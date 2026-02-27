export class JsonExtractor {
  static extract<T>(text: string, startMarker?: string, endMarker?: string): T {
    const raw = this.tryExtract(text, startMarker, endMarker);
    if (!raw) {
      throw new Error(
        "Could not extract JSON from provided text after trying all fallbacks.",
      );
    }

    try {
      const repaired = this.repairJsonString(raw);
      return JSON.parse(repaired) as T;
    } catch (e: any) {
      throw new Error(
        `Failed to parse extracted JSON: ${e.message}\nRaw extracted: ${raw}`,
      );
    }
  }

  private static tryExtract(
    text: string,
    startMarker?: string,
    endMarker?: string,
  ): string | null {
    // Tier 1: Explicit Markers
    if (startMarker && endMarker) {
      const start = text.indexOf(startMarker);
      const end = text.indexOf(endMarker);
      if (start !== -1 && end !== -1 && end > start) {
        return text.substring(start + startMarker.length, end).trim();
      }
    }

    // Tier 2: Markdown Blocks (json or just code)
    const markdownRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
    let match;
    while ((match = markdownRegex.exec(text)) !== null) {
      const content = match[1];
      if (content && this.isValidStructure(content)) return content.trim();
    }

    // Tier 3: Heuristic Search (First [ and Last ])
    const firstBracket = text.indexOf("[");
    const lastBracket = text.lastIndexOf("]");
    if (
      firstBracket !== -1 &&
      lastBracket !== -1 &&
      lastBracket > firstBracket
    ) {
      const candidate = text.substring(firstBracket, lastBracket + 1).trim();
      if (this.isValidStructure(candidate)) return candidate;
    }

    // Tier 4: Heuristic Search (First { and Last }) - in case of single object
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = text.substring(firstBrace, lastBrace + 1).trim();
      if (this.isValidStructure(candidate)) return candidate;
    }

    return null;
  }

  private static isValidStructure(text: string): boolean {
    const trimmed = text.trim();
    return (
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith("{") && trimmed.endsWith("}"))
    );
  }

  private static repairJsonString(text: string): string {
    return (
      text
        .trim()
        // Remove trailing commas in arrays/objects: [1, 2, ] -> [1, 2]
        .replace(/,\s*([\]}])/g, "$1")
        // Remove common prefix talk like "Here is the JSON:"
        .replace(/^.*?:\s*(?=[\[{])/s, "")
    );
  }
}
