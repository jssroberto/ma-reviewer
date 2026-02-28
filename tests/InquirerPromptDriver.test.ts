import { describe, it, expect, vi, beforeEach } from "vitest";
import inquirer from "inquirer";
import { InquirerPromptDriver } from "../src/drivers/cli/InquirerPromptDriver.js";

vi.mock("inquirer");

describe("InquirerPromptDriver", () => {
  let driver: InquirerPromptDriver;

  beforeEach(() => {
    vi.clearAllMocks();
    driver = new InquirerPromptDriver();
  });

  it("should collect user story manually", async () => {
    vi.mocked(inquirer.prompt).mockResolvedValue({
      method: "manual",
      story: "My Story",
      criteria: "My Criteria",
    });

    const result = await driver.collectUserStory();
    expect(result).toEqual({
      userStory: "My Story",
      acceptanceCriteria: "My Criteria",
    });
  });

  it("should select scope", async () => {
    vi.mocked(inquirer.prompt).mockResolvedValue({ selectedScope: "backend" });
    const result = await driver.selectScope();
    expect(result).toBe("backend");
  });

  it("should confirm reuse", async () => {
    vi.mocked(inquirer.prompt).mockResolvedValue({ reuse: true });
    const result = await driver.confirmReuse("Feature");
    expect(result).toBe(true);
  });
});
