import chalk from "chalk";
import Table from "cli-table3";
import type { Finding } from "../core/entities/Review.js";

export class ConsolePresenter {
  displayFindings(findings: Finding[]): void {
    const acFindings = findings.filter((f) => f.itemId.startsWith("AC:"));
    const checklistFindings = findings.filter(
      (f) => !f.itemId.startsWith("AC:"),
    );

    if (acFindings.length > 0) {
      console.log(chalk.blue.bold("\n🔎 Acceptance Criteria Audit Summary:"));
      this.renderTable(acFindings);
    }

    if (checklistFindings.length > 0) {
      console.log(chalk.yellow.bold("\n📋 General Technical Checklist:"));
      this.renderTable(checklistFindings);
    }
  }

  private renderTable(findings: Finding[]): void {
    const table = new Table({
      head: [
        chalk.cyan("Status"),
        chalk.cyan("Item ID"),
        chalk.cyan("Finding / Observation"),
      ],
      colWidths: [10, 30, 60],
      wordWrap: true,
    });

    findings.forEach((f) => {
      const statusIcon =
        f.status === "Sí"
          ? chalk.green("✅ Sí")
          : f.status === "No"
            ? chalk.red("❌ No")
            : f.status === "Manual"
              ? chalk.cyan("⚠️ Manual")
              : chalk.gray("⚪ N/A");

      table.push([statusIcon, chalk.bold(f.itemId), f.finding]);
    });

    console.log(table.toString());
  }
}
