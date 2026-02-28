import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import { ReviewSessionManager } from "../src/core/utils/ReviewSessionManager.js";

vi.mock("fs");

describe("ReviewSessionManager", () => {
  let manager: ReviewSessionManager;
  let mockGitDriver: any;
  let mockPromptDriver: any;
  let mockCacheService: any;
  let mockConfigService: any;
  let mockUseCase: any;
  let mockConsolePresenter: any;
  let mockBrowserPresenter: any;
  let mockFeedbackPresenter: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockGitDriver = {
      listBranches: vi.fn().mockResolvedValue(["main", "feature"]),
    };
    mockPromptDriver = {
      confirmReuse: vi.fn().mockResolvedValue(false),
      collectUserStory: vi
        .fn()
        .mockResolvedValue({ userStory: "S", acceptanceCriteria: "AC" }),
      confirmReuseStandards: vi.fn().mockResolvedValue(false),
      selectStandards: vi.fn().mockResolvedValue("none"),
      selectBranches: vi.fn().mockResolvedValue(["feature"]),
      selectBaseBranch: vi.fn().mockResolvedValue("main"),
      selectScope: vi.fn().mockResolvedValue("both"),
    };
    mockCacheService = {
      get: vi.fn().mockReturnValue(null),
      save: vi.fn(),
    };
    mockConfigService = {
      getGenericStandardsInstruction: vi.fn().mockReturnValue("Generic"),
      getRecommendedBaseBranches: vi.fn().mockReturnValue(["main"]),
    };

    vi.mocked(fs.readdirSync).mockReturnValue(["standard1.md"] as any);
    vi.mocked(fs.readFileSync).mockReturnValue("Content");
    vi.mocked(fs.existsSync).mockReturnValue(true);

    mockUseCase = {
      execute: vi.fn().mockResolvedValue([]),
    };
    mockConsolePresenter = { displayFindings: vi.fn() };
    mockBrowserPresenter = {
      generateAutoFill: vi.fn().mockReturnValue("script"),
    };
    mockFeedbackPresenter = {
      start: vi.fn(),
      stop: vi.fn(),
      handleEvent: vi.fn(),
    };

    manager = new ReviewSessionManager(
      mockGitDriver,
      mockPromptDriver,
      mockCacheService,
      mockConfigService,
      mockUseCase,
      mockConsolePresenter,
      mockBrowserPresenter,
      mockFeedbackPresenter,
    );
  });

  it("should coordinate the review flow correctly", async () => {
    await manager.run({});

    expect(mockPromptDriver.collectUserStory).toHaveBeenCalled();
    expect(mockGitDriver.listBranches).toHaveBeenCalled();
    expect(mockUseCase.execute).toHaveBeenCalled();
    expect(mockCacheService.save).toHaveBeenCalled();
  });

  it("should reuse story from cache if confirmed", async () => {
    mockCacheService.get.mockReturnValue({
      story: "CS",
      criteria: "CAC",
      featureName: "F",
    });
    mockPromptDriver.confirmReuse.mockResolvedValue(true);

    await manager.run({});

    expect(mockPromptDriver.collectUserStory).not.toHaveBeenCalled();
    expect(mockUseCase.execute).toHaveBeenCalledWith(
      "CS",
      "CAC",
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });

  it("should use story from file if provided", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      "Feature: Story\nCriterios de Aceptación\nAC: Criteria",
    );

    await manager.run({ userStoryFile: "story.md" });

    expect(mockUseCase.execute).toHaveBeenCalledWith(
      "Feature: Story",
      "AC: Criteria",
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });

  it("should reuse standards from cache if confirmed", async () => {
    mockCacheService.get.mockReturnValue({ standardsFile: "standard1.md" });
    mockPromptDriver.confirmReuseStandards.mockResolvedValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue("Cached Standard Content");

    await manager.run({});

    expect(mockPromptDriver.selectStandards).not.toHaveBeenCalled();
    expect(mockUseCase.execute).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "Cached Standard Content",
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });

  it("should return generic standards if 'none' is selected", async () => {
    mockPromptDriver.selectStandards.mockResolvedValue("none");

    await manager.run({});

    expect(mockUseCase.execute).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "Generic",
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });

  it("should not prompt for base branch if explicitly provided", async () => {
    await manager.run({ base: "master" });

    expect(mockPromptDriver.selectBaseBranch).not.toHaveBeenCalled();
    expect(mockUseCase.execute).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      "master",
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });

  it("should use scope from options if provided", async () => {
    await manager.run({ scope: "frontend" });

    expect(mockPromptDriver.selectScope).not.toHaveBeenCalled();
    expect(mockUseCase.execute).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      "frontend",
    );
  });

  it("should throw if use case fails", async () => {
    mockUseCase.execute.mockRejectedValue(new Error("UseCase Error"));
    await expect(manager.run({})).rejects.toThrow("UseCase Error");
  });
});
