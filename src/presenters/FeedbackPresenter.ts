import chalk from "chalk";
import ora, { type Ora } from "ora";

export class FeedbackPresenter {
  private spinner: Ora;

  private rotationInterval?: NodeJS.Timeout;
  private totalItems = 0;

  private readonly ANALYZING_MESSAGES = [
    "🤔 Analyzing code logic and standards...",
    "🛡️ Checking security patterns and best practices...",
    "🎨 Evaluating UI consistency and responsiveness...",
    "⚡ Identifying potential performance bottlenecks...",
    "📚 Cross-referencing with Media Aérea standards...",
    "🔍 Searching for redundant or obsolete code...",
    "🧪 Simulating execution paths and edge cases...",
    "🧩 Mapping component interdependencies...",
    "📐 Verifying adherence to project architecture...",
    "🔐 Scanning for sensitive data and exposures...",
    "🚀 Optimizing diff context for better insights...",
    "🧪 Validating technical debt and refactor needs...",
    "📝 Drafting evidence-based observations...",
    "✨ Polishing the final review findings...",
  ];

  constructor() {
    this.spinner = ora({
      text: chalk.blue("🧠 Initializing AI Review Agent..."),
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
    }, 3000); // Slightly faster rotation
  }

  private stopRotation() {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval as unknown as number);
      this.rotationInterval = undefined as any;
    }
  }

  private updateText(text: string) {
    this.spinner.text = text;
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
        // No counter display: keeps the UI cleaner
        break;
      case "reasoning.completed":
        // Keep the rotation going with the same pool during the quiet drafting phase
        break;
      case "item.completed":
        if (event.item?.type === "agent_message") {
          // If we were not already rotating, ensure we are using the full technical pool
          if (!this.rotationInterval) {
            this.startRotation(
              this.ANALYZING_MESSAGES.map((m) => chalk.blue(m)),
            );
          }
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
