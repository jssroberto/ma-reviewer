import { describe, it, expect } from "vitest";
import { ConfigService } from "../src/core/utils/ConfigService.js";
import {
  GENERIC_STANDARDS_INSTRUCTION,
  RECOMMENDED_BASE_BRANCHES,
} from "../src/config/defaults.js";

describe("ConfigService", () => {
  const configService = new ConfigService();

  it("should return the generic standards instruction", () => {
    expect(configService.getGenericStandardsInstruction()).toBe(
      GENERIC_STANDARDS_INSTRUCTION,
    );
  });

  it("should return the recommended base branches", () => {
    expect(configService.getRecommendedBaseBranches()).toEqual(
      RECOMMENDED_BASE_BRANCHES,
    );
  });
});
