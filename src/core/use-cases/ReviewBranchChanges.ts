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
    targetBranches: string[] = [],
    onEvent?: (event: any) => void,
    scope: ReviewScope = "both",
  ): Promise<Finding[]> {
    // 1. Get code changes
    const gitContext = await this.gitDriver.getDiff(baseBranch, targetBranches);

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

    // 2.1 Notify total items for progress tracking
    if (onEvent) {
      const acCount = acceptanceCriteria
        .split("\n")
        .filter((l) => l.trim().length > 0).length;
      onEvent({
        type: "metadata",
        totalItems: acCount + checklist.length,
      });
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

    // 4. Enrich Findings with original requirement text
    const enrichedFindings = findings.map((f) => {
      if (f.itemId.startsWith("AC:")) {
        // For ACs, the itemId IS the requirement name (e.g., "AC: Login with Google")
        return { ...f, requirement: f.itemId.replace("AC:", "").trim() };
      }

      const idMatch = f.itemId.match(/\d+/);
      if (idMatch) {
        const index = parseInt(idMatch[0]!, 10) - 1;
        if (checklist[index]) {
          return { ...f, requirement: checklist[index] };
        }
      }
      return f;
    });

    // 5. Post-process with deterministic middleware
    const { ManualReviewMiddleware } =
      await import("../utils/ManualReviewMiddleware.js");
    return ManualReviewMiddleware.sanitize(enrichedFindings);
  }
}
