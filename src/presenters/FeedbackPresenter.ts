import chalk from "chalk";
import ora, { type Ora } from "ora";

export class FeedbackPresenter {
  private spinner: Ora;

  private rotationInterval?: NodeJS.Timeout;
  private currentProgress = 0;
  private totalItems = 0;

  private readonly ANALYZING_MESSAGES = [
    "🤔 Analyzing code logic and standards...",
    "🛡️ Checking security patterns and best practices...",
    "🎨 Evaluating UI consistency and responsiveness...",
    "⚡ Identifying potential performance bottlenecks...",
    "📚 Cross-referencing with Media Aérea standards...",
    "🔍 Searching for redundant or obsolete code...",
  ];

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
    this.stopRotation();
    this.spinner.stop();
  }

  setTotalItems(total: number) {
    this.totalItems = total;
  }

  private startRotation(messages: string[]) {
    this.stopRotation();
    let index = 0;
    this.rotationInterval = setInterval(() => {
      index = (index + 1) % messages.length;
      const msg = messages[index];
      if (msg) this.updateText(msg);
    }, 3000);
  }

  private stopRotation() {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval as unknown as number);
      this.rotationInterval = undefined as any;
    }
  }

  private updateText(text: string) {
    const progressText =
      this.totalItems > 0
        ? chalk.dim(` (${this.currentProgress}/${this.totalItems})`)
        : "";
    this.spinner.text = text + progressText;
  }

  handleEvent(event: any) {
    switch (event.type) {
      case "metadata":
        this.setTotalItems(event.totalItems);
        break;
      case "turn.started":
        this.updateText(chalk.blue("🚀 AI review started..."));
        break;
      case "reasoning.started":
        this.startRotation(
          this.ANALYZING_MESSAGES.map((m) => chalk.magenta(m)),
        );
        break;
      case "call_tool":
        const toolName = event.call?.procedure || "process";
        this.updateText(chalk.yellow(`🛠️ Running ${toolName}...`));
        break;
      case "item.processed":
        this.currentProgress++;
        const currentText = this.spinner.text.split(" (")[0] || "";
        this.updateText(currentText); // Keep current text, update counter
        break;
      case "reasoning.completed":
        this.stopRotation();
        this.updateText(
          chalk.green("✅ Logic analysis complete. Drafting findings..."),
        );
        break;
      case "item.completed":
        if (event.item?.type === "agent_message") {
          this.updateText(chalk.blue("✍️ Receiving final findings..."));
        }
        break;
      case "turn.completed":
        this.stopRotation();
        this.spinner.succeed(chalk.bold.green("✨ AI Review Complete!"));
        break;
      case "error":
        this.stopRotation();
        this.spinner.fail(
          chalk.red(
            `❌ AI Error: ${event.message || "Unknown error"}`,
          ) as string,
        );
        break;
    }
  }

  logWarning(message: string) {
    this.spinner.warn(chalk.yellow(message));
    this.spinner.start(); // Resume spinner after warning
  }
}
