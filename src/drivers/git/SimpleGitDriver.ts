import chalk from "chalk";
import type { SimpleGit } from "simple-git";
import { simpleGit } from "simple-git";
import type { GitContext, GitDriver } from "./GitDriver.js";

export class SimpleGitDriver implements GitDriver {
  private git: SimpleGit;

  constructor(workingDir: string = process.cwd()) {
    this.git = simpleGit(workingDir);
  }

  async getDiff(baseBranch: string | null = null): Promise<GitContext> {
    // 1. Determine the best base branch
    let targetBase = baseBranch;

    if (!targetBase) {
      try {
        const branches = await this.git.branch();
        const possibleMain = [
          "dev",
          "development",
          "origin/dev",
          "origin/development",
        ];
        targetBase = possibleMain.find((b) => branches.all.includes(b)) || null;

        if (targetBase) {
          console.log(
            chalk.gray(
              `🔍 Autodetected base branch: ${chalk.bold(targetBase)}`,
            ),
          );
        }
      } catch (e) {
        targetBase = null;
      }
    }

    if (!targetBase) {
      throw new Error(
        "Could not determine a base branch (main, master, dev, development). Please specify one using --base <branch>.",
      );
    }

    const revision = `${targetBase}...HEAD`;

    try {
      // 2. Validate revision
      const base = revision.split("...")[0] || "HEAD";
      await this.git.revparse([base]);
    } catch (e) {
      throw new Error(
        `Technical error: Base branch '${targetBase}' exists but is not reachable or valid for diffing.`,
      );
    }

    try {
      const diff = await this.git.diff([revision]);
      const status = await this.git.diffSummary([revision]);

      return {
        diff,
        changedFiles: status.files.map((f) => f.file),
      };
    } catch (error: any) {
      console.error(`❌ Git diff failed completely for revision ${revision}`);
      return { diff: "", changedFiles: [] };
    }
  }
}
