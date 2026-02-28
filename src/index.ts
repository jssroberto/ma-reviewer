#!/usr/bin/env tsx
import chalk from "chalk";
import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { ReviewBranchChanges } from "./core/use-cases/ReviewBranchChanges.js";
import { CodexDriver } from "./drivers/ai/CodexDriver.js";
import { SimpleGitDriver } from "./drivers/git/SimpleGitDriver.js";
import { InquirerPromptDriver } from "./drivers/cli/InquirerPromptDriver.js";
import { CacheService } from "./core/utils/CacheService.js";
import { BrowserScriptPresenter } from "./presenters/BrowserScriptPresenter.js";
import { ConsolePresenter } from "./presenters/ConsolePresenter.js";
import { FeedbackPresenter } from "./presenters/FeedbackPresenter.js";

const GENERIC_STANDARDS_INSTRUCTION = `
## No Specific Standards
There are no specific technical standards for this project. 
As long as the code is functional, readable, and fulfill the Acceptance Criteria, it should be marked as compliant.
For the technical audit section, set the status to "Si" (compliant) unless a critical bug or security flaw is identified.
`;

const program = new Command();

program
  .name("ma-reviewer")
  .description("Automated Peer Review Orchestrator for Media Aérea")
  .version("1.0.0");

program
  .command("review")
  .description("Review the current branch changes")
  .option(
    "-b, --base <branch>",
    "Base branch to compare against",
    "origin/main",
  )
  .option(
    "-d, --driver <name>",
    "AI Driver to use (codex, claude, gemini)",
    "codex",
  )
  .option(
    "-s, --user-story <file>",
    "Path to file with User Story requirements",
  )
  .option("--scope <type>", "Scope of the review (frontend, backend, both)")
  .action(async (options) => {
    console.log(chalk.blue.bold("\n🚀 Starting Media Aérea Peer Review...\n"));

    // 1. Dependency Injection
    const gitDriver = new SimpleGitDriver();
    const aiDriver = new CodexDriver();
    const promptDriver = new InquirerPromptDriver();
    const cacheService = new CacheService();
    const useCase = new ReviewBranchChanges(gitDriver, aiDriver);
    const browserPresenter = new BrowserScriptPresenter();
    const consolePresenter = new ConsolePresenter();
    const feedbackPresenter = new FeedbackPresenter();

    // 2. Collection of HU & AC
    let userStory = "";
    let acceptanceCriteria = "";

    if (options.userStory && fs.existsSync(options.userStory)) {
      const content = fs.readFileSync(options.userStory, "utf-8");
      const sections = content.split(/criterios de aceptaci[óo]n/i);
      userStory = (sections[0] || "").trim();
      acceptanceCriteria = sections[1] ? sections[1].trim() : "";
    }

    if (!userStory || !acceptanceCriteria) {
      const cacheData = cacheService.get();
      if (
        cacheData &&
        (await promptDriver.confirmReuse(cacheData.featureName))
      ) {
        userStory = cacheData.story;
        acceptanceCriteria = cacheData.criteria;
      } else {
        const result = await promptDriver.collectUserStory();
        userStory = result.userStory;
        acceptanceCriteria = result.acceptanceCriteria;
      }
    }

    if (!userStory || !acceptanceCriteria) {
      console.error(
        chalk.red(
          "\n❌ Error: Both Historia de Usuario and Criterios de Aceptación are mandatory.",
        ),
      );
      process.exit(1);
    }

    // 3. Standards Selection
    const resourcesPath = path.join(
      path.dirname(new URL(import.meta.url).pathname),
      "../resources/standards",
    );
    const standardsFiles = fs
      .readdirSync(resourcesPath)
      .filter((f) => f.endsWith(".md"));

    let selectedStandardsFile = "";
    const currentCache = cacheService.get();

    if (
      currentCache?.standardsFile &&
      standardsFiles.includes(currentCache.standardsFile)
    ) {
      if (
        await promptDriver.confirmReuseStandards(currentCache.standardsFile)
      ) {
        selectedStandardsFile = currentCache.standardsFile;
      }
    }

    if (!selectedStandardsFile) {
      selectedStandardsFile =
        await promptDriver.selectStandards(standardsFiles);
    }

    const standardsContent =
      selectedStandardsFile === "none"
        ? GENERIC_STANDARDS_INSTRUCTION
        : fs.readFileSync(
            path.join(resourcesPath, selectedStandardsFile),
            "utf-8",
          );

    // 4. Branch Selection
    const allBranches = await gitDriver.listBranches();
    const targetBranches = await promptDriver.selectBranches(
      allBranches.filter((b) => !b.startsWith("remotes/")),
    );

    let selectedBase = options.base;
    if (!selectedBase || selectedBase === "origin/main") {
      const availableBaseBranches = allBranches.filter(
        (b) => !targetBranches.includes(b),
      );
      const recommendedBase = availableBaseBranches.find((b) =>
        [
          "development",
          "dev",
          "origin/development",
          "origin/dev",
          "main",
          "master",
          "origin/main",
        ].includes(b),
      );
      selectedBase = await promptDriver.selectBaseBranch(
        availableBaseBranches,
        recommendedBase,
      );
    }

    // 5. Scope Selection
    let scope = options.scope;
    if (!scope || !["frontend", "backend", "both"].includes(scope)) {
      scope = await promptDriver.selectScope();
    }

    // 6. Cache for next time
    cacheService.save({
      story: userStory,
      criteria: acceptanceCriteria,
      featureName: CacheService.generateFeatureName(userStory),
      standardsFile: selectedStandardsFile,
    });

    // 7. Execution
    try {
      feedbackPresenter.start();
      const findings = await useCase.execute(
        userStory,
        acceptanceCriteria,
        standardsContent,
        selectedBase,
        targetBranches,
        (event) => feedbackPresenter.handleEvent(event),
        scope as any,
      );
      feedbackPresenter.stop();

      console.log(chalk.green.bold("✅ Review Complete!\n"));
      console.log(chalk.yellow("--- Terminal Summary ---"));
      consolePresenter.displayFindings(findings);

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
      console.log(browserPresenter.generateAutoFill(findings, scope as any));
      console.log(
        chalk.white(
          "------------------------------------------------------------",
        ),
      );
    } catch (err) {
      console.error(chalk.red("\n❌ Error during review:"), err);
    }
  });

program.parse();
