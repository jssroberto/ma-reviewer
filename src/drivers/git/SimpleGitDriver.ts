import chalk from "chalk";
import type { SimpleGit } from "simple-git";
import { simpleGit } from "simple-git";
import { CleanupManager } from "../../core/utils/CleanupManager.js";
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

      const branchName = cleanupBranch;
      CleanupManager.getInstance().registerAction(
        `Delete branch ${branchName}`,
        async () => {
          try {
            await this.git.checkout(["-"]);
            await this.git.deleteLocalBranch(branchName, true);
          } catch (e) {}
        },
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

    // 3. Determine the revision for diffing
    let revision = `${targetBase}...${comparisonTarget}`;

    // Optimization: If it's a single branch review, check if it's already merged
    if (targetBranches.length === 1 && targetBranches[0]) {
      const smartRevision = await this.findSmartRevision(
        targetBase,
        targetBranches[0],
      );
      if (smartRevision) {
        revision = smartRevision;
      }
    }

    console.log(chalk.gray(`📊 Comparing revision: ${chalk.bold(revision)}`));

    try {
      // 4. Validate revision
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

      // Logging diff details
      console.log(
        chalk.gray(
          `📄 Files changed: ${chalk.white(status.files.length)} | Diff size: ${chalk.white(diff.length)} chars`,
        ),
      );

      if (diff.length > 0) {
        const previewSize = 500;
        const preview =
          diff.length > previewSize
            ? diff.substring(0, previewSize) + "..."
            : diff;
        console.log(chalk.blue("\n--- Diff Preview ---"));
        console.log(chalk.gray(preview));
        console.log(chalk.blue("--------------------\n"));
      } else {
        console.log(chalk.yellow("⚠️ No changes found between branches."));
      }

      // Cleanup
      if (cleanupBranch) {
        CleanupManager.getInstance().unregisterAction(
          `Delete branch ${cleanupBranch}`,
        );
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

  /**
   * Finds a smart revision string for a branch that might already be merged.
   * If the branch is merged, it finds the first merge commit and diffs against its parent.
   */
  private async findSmartRevision(
    base: string,
    target: string,
  ): Promise<string | null> {
    try {
      // Check if standard diff is empty
      const diff = await this.git.diff([`${base}...${target}`]);
      if (diff.trim().length > 0) {
        return null; // Standard diff works fine
      }

      // It's likely merged. Find the merge commit that integrated the target into the base.
      // We look for merges in the base's history that have the target as an ancestor.
      const rawLog = await this.git.raw([
        "rev-list",
        `${target}..${base}`,
        "--ancestry-path",
        "--first-parent",
        "--merges",
      ]);

      const mergeCommits = rawLog.trim().split("\n").filter(Boolean);
      if (mergeCommits.length === 0) {
        return null; // Could not find a merge commit (e.g., fast-forward)
      }

      // The LAST commit in this list is the OLDEST merge commit that integrated the branch.
      const firstMerge = mergeCommits[mergeCommits.length - 1];

      if (firstMerge) {
        console.log(
          chalk.yellow(
            `✨ Smart Merge Base detected! Branch ${chalk.bold(target)} is already merged into ${chalk.bold(base)}.`,
          ),
        );
        console.log(
          chalk.gray(
            `   Using original merge point: ${chalk.bold(firstMerge.substring(0, 7))}^1`,
          ),
        );
        return `${firstMerge}^1...${target}`;
      }
    } catch (e) {
      // Fallback to standard if anything fails
    }
    return null;
  }
}
