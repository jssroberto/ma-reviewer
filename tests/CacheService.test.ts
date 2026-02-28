import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import { CacheService } from "../src/core/utils/CacheService.js";

vi.mock("fs");

describe("CacheService", () => {
  let cacheService: CacheService;

  beforeEach(() => {
    vi.clearAllMocks();
    cacheService = new CacheService();
  });

  it("should generate a feature name from the first line of the story", () => {
    const story = "User Login\nAs a user...";
    expect(CacheService.generateFeatureName(story)).toBe("User Login");
  });

  it("should return null if cache file does not exist", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    expect(cacheService.get()).toBeNull();
  });

  it("should return parsed data if cache file exists", () => {
    const mockData = { story: "S", criteria: "C", featureName: "F" };
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockData));
    expect(cacheService.get()).toEqual(mockData);
  });

  it("should write to file when saving", () => {
    const mockData = { story: "S", criteria: "C", featureName: "F" };
    cacheService.save(mockData);
    expect(fs.writeFileSync).toHaveBeenCalled();
  });
});
