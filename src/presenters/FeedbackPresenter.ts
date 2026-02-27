import chalk from "chalk";
import ora, { type Ora } from "ora";

export class FeedbackPresenter {
  private spinner: Ora;

  constructor() {
    this.spinner = ora({
      text: chalk.blue("🧠 Codex is initializing..."),
      color: "cyan",
    });
  }

  start() {
    this.spinner.start();
  }

  stop() {
    this.spinner.stop();
  }

  handleEvent(event: any) {
    switch (event.type) {
      case "turn.started":
        this.spinner.text = chalk.blue("🚀 AI review started...");
        break;
      case "reasoning.started":
        this.spinner.text = chalk.magenta(
          "🤔 Analyzing code logic and standards...",
        );
        break;
      case "call_tool":
        // Usually codex calls git diff
        const toolName = event.call?.procedure || "process";
        this.spinner.text = chalk.yellow(`🛠️ Running ${toolName}...`);
        break;
      case "reasoning.completed":
        this.spinner.text = chalk.green(
          "✅ Logic analysis complete. Drafting findings...",
        );
        break;
      case "item.completed":
        if (event.item?.type === "agent_message") {
          this.spinner.text = chalk.blue("✍️ Receiving final findings...");
        }
        break;
      case "turn.completed":
        this.spinner.succeed(chalk.bold.green("✨ AI Review Complete!"));
        break;
      case "error":
        this.spinner.fail(
          chalk.red(`❌ AI Error: ${event.message || "Unknown error"}`),
        );
        break;
    }
  }

  logWarning(message: string) {
    this.spinner.warn(chalk.yellow(message));
    this.spinner.start(); // Resume spinner after warning
  }
}
