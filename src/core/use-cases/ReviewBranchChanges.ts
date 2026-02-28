import * as fs from "fs";
import * as path from "path";
import type { AIDriver, ReviewScope } from "../../drivers/ai/AIDriver.js";
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
    standards: string,
    baseBranch: string | null = null,
    onEvent?: (event: any) => void,
    scope: ReviewScope = "both",
  ): Promise<Finding[]> {
    // 1. Get code changes
    const gitContext = await this.gitDriver.getDiff(baseBranch);

    // 2. Load checklist
    const currentFile = new URL(import.meta.url).pathname;
    const rootPath = path.resolve(path.dirname(currentFile), "../../../");

    const checklistPath = path.join(rootPath, "resources", "checklist.json");
    const checklistData = JSON.parse(fs.readFileSync(checklistPath, "utf-8"));

    let checklist: string[] = [];
    if (scope === "frontend") {
      checklist = checklistData.frontend;
    } else if (scope === "backend") {
      checklist = checklistData.backend;
    } else {
      checklist = [...checklistData.frontend, ...checklistData.backend];
    }

    // 3. Perform AI Review
    const findings = await this.aiDriver.review(
      {
        checklist,
        standards,
        diff: gitContext.diff,
        userStory,
        acceptanceCriteria,
        scope,
      },
      onEvent,
    );

    // 4. Post-process with deterministic middleware
    const { ManualReviewMiddleware } =
      await import("../utils/ManualReviewMiddleware.js");
    return ManualReviewMiddleware.sanitize(findings);
  }
}
