#!/usr/bin/env tsx
import { Command } from "commander";
import { ReviewBranchChanges } from "./core/use-cases/ReviewBranchChanges.js";
import { CodexDriver } from "./drivers/ai/CodexDriver.js";
import { SimpleGitDriver } from "./drivers/git/SimpleGitDriver.js";
import { InquirerPromptDriver } from "./drivers/cli/InquirerPromptDriver.js";
import { CacheService } from "./core/utils/CacheService.js";
import { ConfigService } from "./core/utils/ConfigService.js";
import { ReviewSessionManager } from "./core/utils/ReviewSessionManager.js";
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
  .option("--scope <type>", "Scope of the review (frontend, backend, both)")
  .action(async (options) => {
    // 1. Dependency Injection (Will move to Container.ts in Phase 3)
    const gitDriver = new SimpleGitDriver();
    const aiDriver = new CodexDriver();
    const promptDriver = new InquirerPromptDriver();
    const cacheService = new CacheService();
    const configService = new ConfigService();
    const useCase = new ReviewBranchChanges(gitDriver, aiDriver);
    const browserPresenter = new BrowserScriptPresenter();
    const consolePresenter = new ConsolePresenter();
    const feedbackPresenter = new FeedbackPresenter();

    const sessionManager = new ReviewSessionManager(
      gitDriver,
      promptDriver,
      cacheService,
      configService,
      useCase,
      consolePresenter,
      browserPresenter,
      feedbackPresenter,
    );

    // 2. Execution
    await sessionManager.run({
      userStoryFile: options.userStory,
      base: options.base,
      scope: options.scope,
    });
  });

program.parse();
