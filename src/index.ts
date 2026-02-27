import chalk from "chalk";
import { Command } from "commander";
import * as fs from "fs";
import inquirer from "inquirer";
import { ReviewBranchChanges } from "./core/use-cases/ReviewBranchChanges.js";
import { CodexDriver } from "./drivers/ai/CodexDriver.js";
import { SimpleGitDriver } from "./drivers/git/SimpleGitDriver.js";
import { BrowserScriptPresenter } from "./presenters/BrowserScriptPresenter.js";
import { ConsolePresenter } from "./presenters/ConsolePresenter.js";
import { FeedbackPresenter } from "./presenters/FeedbackPresenter.js";

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
        // Simple parsing: split by "Criterios" or similar if possible,
        // but for now let's assume the user might provide a structured file.
        // As a fallback, we'll treat the whole file as both or prompt for clarity.
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

    // 3. Execution
    try {
      feedbackPresenter.start();

      const findings = await useCase.execute(
        userStory,
        acceptanceCriteria,
        (options as any).base === "origin/main" ? null : (options as any).base,
        (event: any) => feedbackPresenter.handleEvent(event),
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
      console.log(browserPresenter.generateAutoFill(findings));
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
