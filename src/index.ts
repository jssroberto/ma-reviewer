#!/usr/bin/env tsx
import chalk from "chalk";
import { Command } from "commander";
import { ReviewBranchChanges } from "./core/use-cases/ReviewBranchChanges.js";
import { CodexDriver } from "./drivers/ai/CodexDriver.js";
import { SimpleGitDriver } from "./drivers/git/SimpleGitDriver.js";
import { BrowserScriptPresenter } from "./presenters/BrowserScriptPresenter.js";
import { ConsolePresenter } from "./presenters/ConsolePresenter.js";

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

    // 2. Execution
    try {
      const findings = await useCase.execute(
        options.base === "origin/main" ? null : options.base,
      );

      // 3. Display Results
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
