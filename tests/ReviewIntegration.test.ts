import { describe, expect, it, vi } from "vitest";
import { ReviewBranchChanges } from "../src/core/use-cases/ReviewBranchChanges.js";
import type { AIDriver } from "../src/drivers/ai/AIDriver.js";
import type { GitDriver } from "../src/drivers/git/GitDriver.js";

describe("ReviewBranchChanges Use Case", () => {
  it("should orchestrate the review process correctly", async () => {
    // Mock Git Driver
    const mockGit: GitDriver = {
      getDiff: vi.fn().mockResolvedValue({
        diff: "index 123..456 100644\n--- a/file.ts\n+++ b/file.ts\n@@ -1 +1 @@\n-old\n+new",
        changedFiles: ["file.ts"],
      }),
    };

    // Mock AI Driver
    const mockAI: AIDriver = {
      review: vi
        .fn()
        .mockResolvedValue([
          { itemId: "Standard 1", status: "Sí", finding: "All good" },
        ]),
    };

    const useCase = new ReviewBranchChanges(mockGit, mockAI);
    const findings = await useCase.execute(
      "Test Story",
      "Test Criteria",
      "Test Standards",
      "main",
    );

    expect(findings).toHaveLength(1);
    expect(findings[0]!.itemId).toBe("Standard 1");
    expect(mockGit.getDiff).toHaveBeenCalledWith("main");
    expect(mockAI.review).toHaveBeenCalled();
  });
});
