import chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { ReviewBranchChanges } from "../use-cases/ReviewBranchChanges.js";
import { SimpleGitDriver } from "../../drivers/git/SimpleGitDriver.js";
import type { PromptDriver } from "../../drivers/cli/PromptDriver.js";
import { CacheService } from "./CacheService.js";
import { ConfigService } from "./ConfigService.js";
import { ConsolePresenter } from "../../presenters/ConsolePresenter.js";
import { BrowserScriptPresenter } from "../../presenters/BrowserScriptPresenter.js";
import { FeedbackPresenter } from "../../presenters/FeedbackPresenter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ReviewOptions {
  userStoryFile?: string | undefined;
  base?: string | undefined;
  scope?: string | undefined;
}

export class ReviewSessionManager {
  constructor(
    private gitDriver: SimpleGitDriver,
    private promptDriver: PromptDriver,
    private cacheService: CacheService,
    private configService: ConfigService,
    private useCase: ReviewBranchChanges,
    private consolePresenter: ConsolePresenter,
    private browserPresenter: BrowserScriptPresenter,
    private feedbackPresenter: FeedbackPresenter,
  ) {}

  async run(options: ReviewOptions): Promise<void> {
    console.log(chalk.blue.bold("\n🚀 Starting Media Aérea Peer Review...\n"));

    // 1. Collection of HU & AC
    const { userStory, acceptanceCriteria } = await this.collectUserStory(
      options.userStoryFile,
    );

    if (!userStory || !acceptanceCriteria) {
      console.error(
        chalk.red(
          "\n❌ Error: Both Historia de Usuario and Criterios de Aceptación are mandatory.",
        ),
      );
      process.exit(1);
    }

    // 2. Standards Selection
    const standardsContent = await this.selectStandards();

    // 3. Branch Selection
    const { targetBranches, selectedBase } = await this.selectBranches(
      options.base,
    );

    // 4. Scope Selection
    const scope = await this.selectScope(options.scope);

    // 5. Cache for next time
    this.cacheService.save({
      story: userStory,
      criteria: acceptanceCriteria,
      featureName: CacheService.generateFeatureName(userStory),
      standardsFile: await this.getLastSelectedStandardsFile(), // We'll need a way to track this
    });

    // 6. Execution
    try {
      this.feedbackPresenter.start();
      const findings = await this.useCase.execute(
        userStory,
        acceptanceCriteria,
        standardsContent,
        selectedBase,
        targetBranches,
        (event) => this.feedbackPresenter.handleEvent(event),
        scope as any,
      );
      this.feedbackPresenter.stop();

      console.log(chalk.green.bold("✅ Review Complete!\n"));
      console.log(chalk.yellow("--- Terminal Summary ---"));
      this.consolePresenter.displayFindings(findings);

      console.log(chalk.cyan("\n--- Browser Auto-fill Script ---"));
      console.log(
        chalk.gray(
          "Copy the code below and paste it into the browser console of the review tool:",
        ),
      );
      console.log(
        chalk.white(
          "------------------------------------------------------------",
        ),
      );
      console.log(
        this.browserPresenter.generateAutoFill(findings, scope as any),
      );
      console.log(
        chalk.white(
          "------------------------------------------------------------",
        ),
      );
    } catch (err) {
      console.error(chalk.red("\n❌ Error during review:"), err);
      throw err;
    }
  }

  private async collectUserStory(
    file?: string,
  ): Promise<{ userStory: string; acceptanceCriteria: string }> {
    let userStory = "";
    let acceptanceCriteria = "";

    if (file && fs.existsSync(file)) {
      const content = fs.readFileSync(file, "utf-8");
      const sections = content.split(/criterios de aceptaci[óo]n/i);
      userStory = (sections[0] || "").trim();
      acceptanceCriteria = sections[1] ? sections[1].trim() : "";
      return { userStory, acceptanceCriteria };
    }

    const cacheData = this.cacheService.get();
    if (
      cacheData &&
      (await this.promptDriver.confirmReuse(cacheData.featureName))
    ) {
      return {
        userStory: cacheData.story,
        acceptanceCriteria: cacheData.criteria,
      };
    }

    const result = await this.promptDriver.collectUserStory();
    return {
      userStory: result.userStory,
      acceptanceCriteria: result.acceptanceCriteria,
    };
  }

  private async selectStandards(): Promise<string> {
    const resourcesPath = path.join(__dirname, "../../../resources/standards");
    const standardsFiles = fs
      .readdirSync(resourcesPath)
      .filter((f) => f.endsWith(".md"));

    let selectedFile = "";
    const currentCache = this.cacheService.get();

    if (
      currentCache?.standardsFile &&
      standardsFiles.includes(currentCache.standardsFile)
    ) {
      if (
        await this.promptDriver.confirmReuseStandards(
          currentCache.standardsFile,
        )
      ) {
        selectedFile = currentCache.standardsFile;
      }
    }

    if (!selectedFile) {
      selectedFile = await this.promptDriver.selectStandards(standardsFiles);
    }

    // Temporary hack to share selected file for cache saving in run()
    (this as any).lastSelectedStandardsFile = selectedFile;

    if (selectedFile === "none") {
      return this.configService.getGenericStandardsInstruction();
    }

    return fs.readFileSync(path.join(resourcesPath, selectedFile), "utf-8");
  }

  private async getLastSelectedStandardsFile(): Promise<string> {
    return (this as any).lastSelectedStandardsFile || "none";
  }

  private async selectBranches(
    baseOption?: string,
  ): Promise<{ targetBranches: string[]; selectedBase: string }> {
    const allBranches = await this.gitDriver.listBranches();
    const targetBranches = await this.promptDriver.selectBranches(
      allBranches.filter((b) => !b.startsWith("remotes/")),
    );

    let selectedBase = baseOption;
    if (!selectedBase || selectedBase === "origin/main") {
      const availableBaseBranches = allBranches.filter(
        (b) => !targetBranches.includes(b),
      );
      const recommendedBase = availableBaseBranches.find((b) =>
        this.configService.getRecommendedBaseBranches().includes(b),
      );
      selectedBase = await this.promptDriver.selectBaseBranch(
        availableBaseBranches,
        recommendedBase,
      );
    }

    return { targetBranches, selectedBase };
  }

  private async selectScope(scopeOption?: string): Promise<string> {
    if (scopeOption && ["frontend", "backend", "both"].includes(scopeOption)) {
      return scopeOption;
    }
    return await this.promptDriver.selectScope();
  }
}
