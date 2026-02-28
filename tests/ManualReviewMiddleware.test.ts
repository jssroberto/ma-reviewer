import { describe, expect, it } from "vitest";
import { ManualReviewMiddleware } from "../src/core/utils/ManualReviewMiddleware.js";
import type { Finding } from "../src/core/entities/Review.js";

describe("ManualReviewMiddleware", () => {
  it("should force Manual status for specific frontend IDs if they are not N/A", () => {
    const findings: Finding[] = [
      { itemId: "1", status: "Sí", finding: "Logic matches" }, // Manual ID
      { itemId: "20", status: "No", finding: "Spacing is off" }, // Manual ID
      { itemId: "34", status: "Sí", finding: "Links are good" }, // Auto ID
      { itemId: "20", status: "N/A", finding: "Not applicable" }, // Manual ID but N/A
    ];

    const results = ManualReviewMiddleware.sanitize(findings);

    expect(results[0]!.status).toBe("Manual");
    expect(results[1]!.status).toBe("Manual");
    expect(results[2]!.status).toBe("Sí"); // Should stay the same
    expect(results[3]!.status).toBe("Manual"); // Should NOW be Manual (previously stayed N/A)
  });

  it("should correctly handle full itemId strings with AC prefix", () => {
    const findings: Finding[] = [
      { itemId: "AC: Auth", status: "Sí", finding: "Auth good" },
      { itemId: "Item 19", status: "Sí", finding: "Alignment good" },
    ];

    const results = ManualReviewMiddleware.sanitize(findings);

    expect(results[0]!.status).toBe("Sí");
    expect(results[1]!.status).toBe("Manual");
  });
});
