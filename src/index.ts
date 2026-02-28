#!/usr/bin/env tsx
import chalk from "chalk";
import { Command } from "commander";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import inquirer from "inquirer";
import { ReviewBranchChanges } from "./core/use-cases/ReviewBranchChanges.js";
import { CodexDriver } from "./drivers/ai/CodexDriver.js";
import { SimpleGitDriver } from "./drivers/git/SimpleGitDriver.js";
import { BrowserScriptPresenter } from "./presenters/BrowserScriptPresenter.js";
import { ConsolePresenter } from "./presenters/ConsolePresenter.js";
import { FeedbackPresenter } from "./presenters/FeedbackPresenter.js";

const GENERIC_STANDARDS_INSTRUCTION = `
## No Specific Standards
There are no specific technical standards for this project. 
As long as the code is functional, readable, and fulfill the Acceptance Criteria, it should be marked as compliant.
For the technical audit section, set the status to "Si" (compliant) unless a critical bug or security flaw is identified.
`;

const CACHE_FILE = path.join(os.homedir(), ".ma-reviewer-cache.json");

function saveStoryToCache(story: string, criteria: string) {
  try {
    if (!story) return;
    const featureName =
      story.split("\n")[0]?.substring(0, 50).trim() || "Untitled";
    fs.writeFileSync(
      CACHE_FILE,
      JSON.stringify({
        story,
        criteria,
        featureName,
        standardsFile: (global as any).selectedStandardsFile,
      }),
    );
  } catch (e) {
    // Ignore cache errors
  }
}

function getStoryFromCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
    }
  } catch (e) {
    return null;
  }
  return null;
}

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
    const aiDriver = new CodexDriver(); // Future: Factory based on options.driver
    const useCase = new ReviewBranchChanges(gitDriver, aiDriver);
    const browserPresenter = new BrowserScriptPresenter();
    const consolePresenter = new ConsolePresenter();
    const feedbackPresenter = new FeedbackPresenter();

    // 2. Collection of HU & AC (Mandatory Auditor Flow)
    let userStory = "";
    let acceptanceCriteria = "";

    if ((options as any).userStory) {
      const userStoryPath = (options as any).userStory;
      if (fs.existsSync(userStoryPath)) {
        const content = fs.readFileSync(userStoryPath, "utf-8");
        const sections = content.split(/criterios de aceptaci[óo]n/i);
        userStory = (sections[0] || "").trim();
        acceptanceCriteria = sections[1] ? sections[1].trim() : "";

        if (!acceptanceCriteria) {
          console.log(
            chalk.yellow(
              "⚠️ Criteria section not detected in file. Please provide it manually.",
            ),
          );
        }
      } else {
        console.error(
          chalk.red(`\n❌ User Story file not found: ${options.userStory}`),
        );
        process.exit(1);
      }
    }

    if (!userStory || !acceptanceCriteria) {
      try {
        const cache = getStoryFromCache();
        let reuseCache = false;

        if (cache) {
          const { reuse } = await inquirer.prompt([
            {
              type: "confirm",
              name: "reuse",
              message: `I found a previous story for "${chalk.cyan(cache.featureName)}". Do you want to reuse it?`,
              default: true,
            },
          ]);
          reuseCache = reuse;
          if (reuseCache) {
            userStory = cache.story;
            acceptanceCriteria = cache.criteria;
          }
        }

        if (!reuseCache) {
          const answers = await inquirer.prompt([
            {
              type: "rawlist",
              name: "method",
              message:
                "Acceptance Criteria Audit is mandatory. How would you like to provide the details?",
              choices: [
                { name: "Input manually (Story & Criteria)", value: "manual" },
                { name: "Provide path to a structured HU file", value: "file" },
              ],
              when: () => !userStory || !acceptanceCriteria,
            },
            {
              type: "input",
              name: "story",
              message: "1. Historia de Usuario (The 'Who/What/Why'):",
              when: (a: any) =>
                a.method === "manual" || (!userStory && a.method !== "file"),
              validate: (input: string) =>
                input.trim().length > 10 || "Story too short.",
            },
            {
              type: "editor",
              name: "criteria",
              message: "2. Criterios de Aceptación (The technical contract):",
              when: (a: any) =>
                a.method === "manual" ||
                (!acceptanceCriteria && a.method !== "file"),
              validate: (input: string) =>
                input.trim().length > 10 || "Criteria too short.",
            },
            {
              type: "input",
              name: "path",
              message: "Enter the path to the structured HU file:",
              when: (a: any) => a.method === "file",
              validate: (input: string) =>
                fs.existsSync(input) || "File not found.",
            },
          ]);

          if (answers.method === "manual") {
            userStory = answers.story || userStory;
            acceptanceCriteria = answers.criteria || acceptanceCriteria;
          } else if (answers.method === "file" && answers.path) {
            const content = fs.readFileSync(answers.path, "utf-8");
            const sections = content.split(/criterios de aceptaci[óo]n/i);
            userStory = (sections[0] || "").trim();
            acceptanceCriteria = sections[1] ? sections[1].trim() : "";
          }
        }
      } catch (e: any) {
        if (e.name === "ExitPromptError") {
          console.log(chalk.yellow("\n⚠️ Review cancelled by user."));
          process.exit(0);
        }
        throw e;
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

    // Save to cache for next time
    saveStoryToCache(userStory, acceptanceCriteria);

    // 2.1 Technology Standards Selection
    const resourcesPath = path.join(
      path.dirname(new URL(import.meta.url).pathname),
      "../resources/standards",
    );
    const standardsFiles = fs
      .readdirSync(resourcesPath)
      .filter((f) => f.endsWith(".md"));

    let selectedStandardsFile = "";
    const cache = getStoryFromCache();

    if (
      cache &&
      cache.standardsFile &&
      standardsFiles.includes(cache.standardsFile)
    ) {
      const { reuseStandards } = await inquirer.prompt([
        {
          type: "confirm",
          name: "reuseStandards",
          message: `Reuse standards for "${chalk.cyan(cache.standardsFile)}"?`,
          default: true,
        },
      ]);
      if (reuseStandards) {
        selectedStandardsFile = cache.standardsFile;
      }
    }

    if (!selectedStandardsFile) {
      const { standards } = await inquirer.prompt([
        {
          type: "rawlist",
          name: "standards",
          message: "Select Technology Standards:",
          choices: [
            ...standardsFiles.map((f) => ({
              name: f
                .replace(".md", "")
                .split("-")
                .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                .join(" "),
              value: f,
            })),
            {
              name: chalk.yellow("None (Acceptance Criteria Only)"),
              value: "none",
            },
          ],
        },
      ]);
      selectedStandardsFile = standards;
    }

    (global as any).selectedStandardsFile = selectedStandardsFile;
    const standardsContent =
      selectedStandardsFile === "none"
        ? GENERIC_STANDARDS_INSTRUCTION
        : fs.readFileSync(
            path.join(resourcesPath, selectedStandardsFile),
            "utf-8",
          );

    // 2.2 Scope Selection
    let scope = (options as any).scope;
    if (!scope || !["frontend", "backend", "both"].includes(scope)) {
      const { selectedScope } = await inquirer.prompt([
        {
          type: "rawlist",
          name: "selectedScope",
          message: "Select Review Scope:",
          choices: [
            { name: "Frontend", value: "frontend" },
            { name: "Backend", value: "backend" },
            { name: "Both (Full Stack)", value: "both" },
          ],
        },
      ]);
      scope = selectedScope;
    }

    // 3. Execution
    try {
      feedbackPresenter.start();

      const findings = await useCase.execute(
        userStory,
        acceptanceCriteria,
        standardsContent,
        (options as any).base === "origin/main" ? null : (options as any).base,
        (event: any) => feedbackPresenter.handleEvent(event),
        scope as any,
      );

      feedbackPresenter.stop();

      // 4. Display Results
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
