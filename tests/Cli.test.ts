import { describe, it, expect } from "vitest";
import { execSync } from "child_process";

describe("CLI Integration", () => {
  const binary = "npx tsx src/index.ts";

  it("should show help information", () => {
    const output = execSync(`${binary} --help`).toString();
    expect(output).toContain("Usage: ma-reviewer [options] [command]");
    expect(output).toContain("Automated Peer Review Orchestrator");
  });

  it("should show version information", () => {
    const output = execSync(`${binary} --version`).toString();
    expect(output).toBe("1.0.0\n");
  });

  it("should show command-specific help", () => {
    const output = execSync(`${binary} review --help`).toString();
    expect(output).toContain("Usage: ma-reviewer review [options]");
    expect(output).toContain("-b, --base <branch>");
    expect(output).toContain("-s, --user-story <file>");
  });
});
