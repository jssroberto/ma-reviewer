import type { Finding } from "../../core/entities/Review.js";

export interface AIReviewRequest {
  checklist: string[];
  standards: string;
  diff: string;
  huRequirements?: string | undefined;
}

export interface AIDriver {
  review(request: AIReviewRequest): Promise<Finding[]>;
}
