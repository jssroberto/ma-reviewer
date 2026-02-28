import chalk from "chalk";
import type { SimpleGit } from "simple-git";
import { simpleGit } from "simple-git";
import type { GitContext, GitDriver } from "./GitDriver.js";

export class SimpleGitDriver implements GitDriver {
  private git: SimpleGit;

  constructor(workingDir: string = process.cwd()) {
    this.git = simpleGit(workingDir);
  }

  async getDiff(
    baseBranch: string | null = null,
    targetBranches: string[] = [],
  ): Promise<GitContext> {
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

    // 2. Prepare the target for comparison
    let comparisonTarget = "HEAD";
    let cleanupBranch: string | null = null;

    if (targetBranches.length > 1) {
      const timestamp = Date.now();
      cleanupBranch = `ma-review-temp-${timestamp}`;
      console.log(
        chalk.gray(
          `🔨 Creating temporary merge branch: ${chalk.bold(cleanupBranch)}`,
        ),
      );

      try {
        // Create temp branch from base
        await this.git.checkoutBranch(cleanupBranch, targetBase);

        // Merge each target branch
        for (const branch of targetBranches) {
          console.log(chalk.gray(`   Merging ${branch}...`));
          await this.git.merge([branch]);
        }
        comparisonTarget = cleanupBranch;
      } catch (e: any) {
        console.error(
          chalk.red(`❌ Error creating temporary merge context: ${e.message}`),
        );
        // Attempt cleanup if branch was created
        try {
          await this.git.checkout(["-"]); // Switch back
          await this.git.deleteLocalBranch(cleanupBranch, true);
        } catch (inner) {}
        throw new Error(
          "Could not merge branches for review. Please ensure there are no conflicts or your working directory is clean.",
        );
      }
    } else if (targetBranches.length === 1 && targetBranches[0]) {
      comparisonTarget = targetBranches[0];
    }

    const revision = `${targetBase}...${comparisonTarget}`;

    try {
      // 3. Validate revision
      const base = revision.split("...")[0] || "HEAD";
      await this.git.revparse([base]);
    } catch (e) {
      if (cleanupBranch) {
        await this.git.checkout(["-"]);
        await this.git.deleteLocalBranch(cleanupBranch, true);
      }
      throw new Error(
        `Technical error: Base branch '${targetBase}' exists but is not reachable or valid for diffing.`,
      );
    }

    try {
      const diff = await this.git.diff([revision]);
      const status = await this.git.diffSummary([revision]);

      // Cleanup
      if (cleanupBranch) {
        await this.git.checkout(["-"]);
        await this.git.deleteLocalBranch(cleanupBranch, true);
        console.log(chalk.gray(`🧹 Cleaned up temporary branch.`));
      }

      return {
        diff,
        changedFiles: status.files
          .map((f) => f.file)
          .filter((f): f is string => !!f),
      };
    } catch (error: any) {
      if (cleanupBranch) {
        try {
          await this.git.checkout(["-"]);
          await this.git.deleteLocalBranch(cleanupBranch, true);
        } catch (e) {}
      }
      console.error(`❌ Git diff failed completely for revision ${revision}`);
      return { diff: "", changedFiles: [] };
    }
  }

  async listBranches(): Promise<string[]> {
    try {
      const branches = await this.git.branch(["--list"]);
      return branches.all;
    } catch (e) {
      return [];
    }
  }
}
