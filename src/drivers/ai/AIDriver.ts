import type { Finding } from "../../core/entities/Review.js";

export interface AIReviewRequest {
  checklist: string[];
  standards: string;
  diff: string;
  userStory: string;
  acceptanceCriteria: string;
}

export interface AIDriver {
  review(
    request: AIReviewRequest,
    onEvent?: (event: any) => void,
  ): Promise<Finding[]>;
}
