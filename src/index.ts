#!/usr/bin/env tsx
import chalk from "chalk";
import { Command } from "commander";
import { Container } from "./infrastructure/Container.js";
import { CleanupManager } from "./core/utils/CleanupManager.js";

async function main() {
  const program = new Command();
  const container = new Container();

  program
    .name("ma-reviewer")
    .description("Automated Peer Review Orchestrator for Media Aérea")
    .version("1.0.0");

  // Handle interruption signals
  const cleanupAndExit = async (signal: string) => {
    console.log(chalk.dim(`\n\n(Cleaning up before exit...)`));
    await CleanupManager.getInstance().cleanup();
    process.exit(0);
  };

  process.on("SIGINT", () => cleanupAndExit("SIGINT"));
  process.on("SIGTERM", () => cleanupAndExit("SIGTERM"));

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
      await container.resolveReviewCommand().execute(options);
    });

  try {
    await program.parseAsync(process.argv);
  } catch (err: any) {
    console.error(
      chalk.red.bold("\n💥 Fatal Error:"),
      chalk.red(err.message || err),
    );
    process.exit(1);
  }
}

// Global error handlers
process.on("unhandledRejection", async (reason) => {
  console.error(
    chalk.red.bold("\n🛑 Unhandled Promise Rejection:"),
    chalk.red(reason),
  );
  await CleanupManager.getInstance().cleanup();
  process.exit(1);
});

process.on("uncaughtException", async (error) => {
  console.error(
    chalk.red.bold("\n💥 Uncaught Exception:"),
    chalk.red(error.message || error),
  );
  await CleanupManager.getInstance().cleanup();
  process.exit(1);
});

main();
