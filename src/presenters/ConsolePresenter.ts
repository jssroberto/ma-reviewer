import chalk from "chalk";
import Table from "cli-table3";
import type { Finding } from "../core/entities/Review.js";

export class ConsolePresenter {
  displayFindings(findings: Finding[]): void {
    // We only care about checklist items for the terminal output
    const checklistFindings = findings.filter(
      (f) => !f.itemId.startsWith("AC:"),
    );

    const counts = checklistFindings.reduce(
      (acc, f) => {
        if (f.status === "Sí") acc.si++;
        else if (f.status === "No") acc.no++;
        else if (f.status === "Manual") acc.manual++;
        else if (f.status === "N/A") acc.na++;
        return acc;
      },
      { si: 0, no: 0, manual: 0, na: 0 },
    );

    // 1. Summary Dashboard
    console.log(chalk.bold("\n📊 Review Dashboard"));
    console.log(
      chalk.gray(
        "────────────────────────────────────────────────────────────",
      ),
    );
    console.log(
      `${chalk.green("✅ Sí:")} ${chalk.bold(counts.si)}  |  ` +
        `${chalk.red("❌ No:")} ${chalk.bold(counts.no)}  |  ` +
        `${chalk.yellow("⚠️  Manual:")} ${chalk.bold(counts.manual)}  |  ` +
        `${chalk.white("⚪ N/A:")} ${chalk.bold(counts.na)}`,
    );
    console.log(
      chalk.gray(
        "────────────────────────────────────────────────────────────\n",
      ),
    );

    if (checklistFindings.length > 0) {
      console.log(chalk.magenta.bold("📋 General Checklist"));
      this.renderList(checklistFindings);
    }
  }

  private renderList(findings: Finding[]): void {
    // Sort to show "No" and "Manual" at the top
    const priorityMap: Record<string, number> = {
      No: 0,
      Manual: 1,
      Sí: 2,
      "N/A": 3,
    };

    const sorted = [...findings].sort(
      (a, b) => priorityMap[a.status]! - priorityMap[b.status]!,
    );

    sorted.forEach((f) => {
      const icon =
        f.status === "Sí"
          ? "✅"
          : f.status === "No"
            ? "❌"
            : f.status === "Manual"
              ? "⚠️"
              : "⚪";

      const statusText =
        f.status === "Sí"
          ? chalk.green.bold("SÍ")
          : f.status === "No"
            ? chalk.red.bold("NO")
            : f.status === "Manual"
              ? chalk.yellow.bold("MANUAL")
              : chalk.gray.bold("N/A");

      const requirementLabel = f.requirement
        ? chalk.cyan(`[${f.requirement}]`)
        : "";

      console.log(
        `${icon} ${statusText} ${" ".repeat(6 - f.status.length)} ${chalk.bold(f.itemId)} ${requirementLabel}`,
      );

      if (f.finding) {
        // Subtle branching visual for the observation - using white for better contrast
        console.log(chalk.white(`   └─ ${f.finding}`));
      }
    });
  }
}
