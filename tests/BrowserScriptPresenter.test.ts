import { describe, expect, it } from "vitest";
import { BrowserScriptPresenter } from "../src/presenters/BrowserScriptPresenter.js";

describe("BrowserScriptPresenter", () => {
  it("should generate a valid function expression for the browser logic", () => {
    const presenter = new BrowserScriptPresenter();
    const findings = [{ itemId: "1", status: "Sí" as const, finding: "Test" }];

    const output = presenter.generateAutoFill(findings, "frontend");

    // Check that the output contains the function definition correctly
    // It should NOT look like "(_browserLogic(..." but "(function _browserLogic(..."
    expect(output).toContain("(function _browserLogic");

    // Verify it ends with the call
    expect(output).toContain("})(findings, scope, cssBase64);");
  });
});
