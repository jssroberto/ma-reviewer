import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReviewCommand } from "../src/commands/ReviewCommand.js";

describe("ReviewCommand", () => {
  let command: ReviewCommand;
  let mockContainer: any;
  let mockSessionManager: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSessionManager = {
      run: vi.fn().mockResolvedValue(undefined),
    };

    mockContainer = {
      resolveReviewSessionManager: vi.fn().mockReturnValue(mockSessionManager),
    };

    command = new ReviewCommand(mockContainer);
  });

  it("should resolve session manager and run with options", async () => {
    const options = { userStory: "file.md", base: "main", scope: "both" };
    await command.execute(options);

    expect(mockContainer.resolveReviewSessionManager).toHaveBeenCalled();
    expect(mockSessionManager.run).toHaveBeenCalledWith({
      userStoryFile: "file.md",
      base: "main",
      scope: "both",
    });
  });

  it("should handle partial options", async () => {
    await command.execute({});

    expect(mockSessionManager.run).toHaveBeenCalledWith({
      userStoryFile: undefined,
      base: undefined,
      scope: undefined,
    });
  });
});
