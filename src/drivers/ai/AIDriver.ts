import type { Finding } from "../../core/entities/Review.js";
export type ReviewScope = "frontend" | "backend" | "both";
// Skip unchanged lines 1-2
export interface AIReviewRequest {
  checklist: string[];
  standards: string;
  diff: string;
  userStory: string;
  acceptanceCriteria: string;
  scope: ReviewScope;
}

export interface AIDriver {
  review(
    request: AIReviewRequest,
    onEvent?: (event: any) => void,
  ): Promise<Finding[]>;
}
