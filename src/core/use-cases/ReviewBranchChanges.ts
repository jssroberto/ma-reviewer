import * as fs from "fs";
import * as path from "path";
import type { AIDriver } from "../../drivers/ai/AIDriver.js";
import type { GitDriver } from "../../drivers/git/GitDriver.js";
import type { Finding } from "../entities/Review.js";

export class ReviewBranchChanges {
  constructor(
    private gitDriver: GitDriver,
    private aiDriver: AIDriver,
  ) {}

  async execute(
    userStory: string,
    acceptanceCriteria: string,
    baseBranch: string | null = null,
    onEvent?: (event: any) => void,
  ): Promise<Finding[]> {
    // 1. Get code changes
    const gitContext = await this.gitDriver.getDiff(baseBranch);

    // 2. Load standards and checklist
    const currentFile = new URL(import.meta.url).pathname;
    const rootPath = path.resolve(path.dirname(currentFile), "../../../");

    const standardsPath = path.join(
      rootPath,
      "resources",
      "standares-js-ts.md",
    );
    const standards = fs.existsSync(standardsPath)
      ? fs.readFileSync(standardsPath, "utf-8")
      : "";

    const checklistPath = path.join(rootPath, "resources", "checklist.json");
    const checklistData = JSON.parse(fs.readFileSync(checklistPath, "utf-8"));
    const checklist = [...checklistData.frontend, ...checklistData.backend];

    // 3. Perform AI Review
    return await this.aiDriver.review(
      {
        checklist,
        standards,
        diff: gitContext.diff,
        userStory,
        acceptanceCriteria,
      },
      onEvent,
    );
  }
}
