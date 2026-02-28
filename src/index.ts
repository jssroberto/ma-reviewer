#!/usr/bin/env tsx
import chalk from "chalk";
import { Command } from "commander";
import { Container } from "./infrastructure/Container.js";

async function main() {
  const program = new Command();
  const container = new Container();

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

// Global unhandled promise rejection handler
process.on("unhandledRejection", (reason) => {
  console.error(
    chalk.red.bold("\n🛑 Unhandled Promise Rejection:"),
    chalk.red(reason),
  );
  process.exit(1);
});

main();
