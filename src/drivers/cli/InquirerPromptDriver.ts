import chalk from "chalk";
import * as fs from "fs";
import inquirer from "inquirer";
import type { PromptDriver } from "./PromptDriver.js";

export class InquirerPromptDriver implements PromptDriver {
  async collectUserStory(): Promise<{
    userStory: string;
    acceptanceCriteria: string;
  }> {
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
      },
      {
        type: "input",
        name: "story",
        message: "1. Historia de Usuario (The 'Who/What/Why'):",
        when: (a) => a.method === "manual",
        validate: (input: string) =>
          input.trim().length > 10 || "Story too short.",
      },
      {
        type: "editor",
        name: "criteria",
        message: "2. Criterios de Aceptación (The technical contract):",
        when: (a) => a.method === "manual",
        validate: (input: string) =>
          input.trim().length > 10 || "Criteria too short.",
      },
      {
        type: "input",
        name: "path",
        message: "Enter the path to the structured HU file:",
        when: (a) => a.method === "file",
        validate: (input: string) => fs.existsSync(input) || "File not found.",
      },
    ]);

    if (answers.method === "manual") {
      return { userStory: answers.story, acceptanceCriteria: answers.criteria };
    } else {
      const content = fs.readFileSync(answers.path, "utf-8");
      const sections = content.split(/criterios de aceptaci[óo]n/i);
      return {
        userStory: (sections[0] || "").trim(),
        acceptanceCriteria: sections[1] ? sections[1].trim() : "",
      };
    }
  }

  async selectStandards(availableFiles: string[]): Promise<string> {
    const { standards } = await inquirer.prompt([
      {
        type: "rawlist",
        name: "standards",
        message: "Select Technology Standards:",
        choices: [
          ...availableFiles.map((f) => ({
            name: f
              .replace(".md", "")
              .split("-")
              .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
              .join(" "),
            value: f,
          })),
          {
            name: chalk.yellow("None (Acceptance Criteria Only)"),
            value: "none",
          },
        ],
      },
    ]);
    return standards;
  }

  async selectBranches(branches: string[]): Promise<string[]> {
    const { selectedBranches } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "selectedBranches",
        message:
          "Which FEATURE branch(es) do you want to audit? (Space to select)",
        choices: branches.map((b) => ({
          name: b,
          value: b,
          checked: false,
        })),
        validate: (input) =>
          input.length > 0 || "Please select at least one branch to continue.",
      },
    ]);
    return selectedBranches as string[];
  }

  async selectBaseBranch(
    branches: string[],
    defaultCandidate?: string,
  ): Promise<string> {
    const { base } = await inquirer.prompt([
      {
        type: "rawlist",
        name: "base",
        message: "Which BASE branch should we compare against? (Merge target)",
        choices: branches.map((b) => ({
          name:
            b === defaultCandidate ? `${b} ${chalk.dim("(recommended)")}` : b,
          value: b,
        })),
        default: defaultCandidate,
      },
    ]);
    return base;
  }

  async selectScope(): Promise<"frontend" | "backend" | "both"> {
    const { selectedScope } = await inquirer.prompt([
      {
        type: "rawlist",
        name: "selectedScope",
        message: "Select Review Scope:",
        choices: [
          { name: "Frontend", value: "frontend" },
          { name: "Backend", value: "backend" },
          { name: "Both (Full Stack)", value: "both" },
        ],
      },
    ]);
    return selectedScope;
  }

  async confirmReuse(featureName: string): Promise<boolean> {
    const { reuse } = await inquirer.prompt([
      {
        type: "confirm",
        name: "reuse",
        message: `I found a previous story for "${chalk.cyan(featureName)}". Do you want to reuse it?`,
        default: true,
      },
    ]);
    return reuse;
  }

  async confirmReuseStandards(fileName: string): Promise<boolean> {
    const { reuseStandards } = await inquirer.prompt([
      {
        type: "confirm",
        name: "reuseStandards",
        message: `Reuse standards for "${chalk.cyan(fileName)}"?`,
        default: true,
      },
    ]);
    return reuseStandards;
  }
}
