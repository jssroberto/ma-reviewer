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
        const possibleMain = ["main", "master", "origin/main", "origin/master"];
        targetBase = possibleMain.find((b) => branches.all.includes(b)) || null;
      } catch (e) {
        targetBase = null;
      }
    }

    // Default to the last commit OR empty tree if repo is brand new
    let revision = targetBase ? `${targetBase}...HEAD` : "HEAD~1";

    try {
      // 2. Initial Attempt
      const base = revision.split("...")[0] || "HEAD";
      await this.git.revparse([base]);
    } catch (e) {
      // Revision doesn't exist (e.g., HEAD~1 on a 1-commit repo)
      console.warn(
        `⚠️ Revision ${revision} not found. checking repo history...`,
      );
      try {
        const log = await this.git.log({ maxCount: 2 });
        if (log.all.length === 1) {
          // Special Git SHA for empty tree
          revision = "4b825dc642cb6eb9a060e54bf8d69288fbee4904...HEAD";
        } else {
          revision = "HEAD";
        }
      } catch (logError) {
        revision = "HEAD";
      }
    }

    try {
      const diff = await this.git.diff([revision]);
      const status = await this.git.diffSummary([revision]);

      return {
        diff,
        changedFiles: status.files.map((f) => f.file),
      };
    } catch (error: any) {
      console.error(
        `❌ Git diff failed completely even with fallback ${revision}`,
      );
      return { diff: "", changedFiles: [] };
    }
  }
}
