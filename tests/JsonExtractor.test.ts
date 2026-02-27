import { describe, expect, it } from "vitest";
import { JsonExtractor } from "../src/core/utils/JsonExtractor.js";

describe("JsonExtractor", () => {
  it("should extract JSON from Tier 1 (Markers)", () => {
    const text =
      'Reasoning... ---BEGIN_JSON--- [{"success": true}] ---END_JSON--- Chatter...';
    const result = JsonExtractor.extract(
      text,
      "---BEGIN_JSON---",
      "---END_JSON---",
    );
    expect(result).toEqual([{ success: true }]);
  });

  it("should extract JSON from Tier 2 (Markdown blocks)", () => {
    const text =
      'Here is the result:\n```json\n[{"id": 1}]\n```\nHope this helps.';
    const result = JsonExtractor.extract(text, "---START---", "---END---"); // Markers missing
    expect(result).toEqual([{ id: 1 }]);
  });

  it("should extract JSON from Tier 3 (Heuristic brackets)", () => {
    const text = 'Sure, here is the array: [{"val": "test"}] and that is all.';
    const result = JsonExtractor.extract(text);
    expect(result).toEqual([{ val: "test" }]);
  });

  it("should repair trailing commas", () => {
    const text = '[{"a": 1,}, {"b": 2},]';
    const result = JsonExtractor.extract(text);
    expect(result).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it('should handle "prefix talk" before brackets', () => {
    const text = 'Response: [{"a": 1}]';
    const result = JsonExtractor.extract(text);
    expect(result).toEqual([{ a: 1 }]);
  });

  it("should throw error if no JSON is found", () => {
    const text = "Just some conversation, no brackets here.";
    expect(() => JsonExtractor.extract(text)).toThrow("Could not extract JSON");
  });
});
