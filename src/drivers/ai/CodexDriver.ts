import { spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import type { Finding } from "../../core/entities/Review.js";
import type { AIDriver, AIReviewRequest } from "./AIDriver.js";

export class CodexDriver implements AIDriver {
  async review(request: AIReviewRequest): Promise<Finding[]> {
    const agentsFile = path.join(process.cwd(), "AGENTS.md");

    // 1. Prepare AGENTS.md with standards and checklist
    const agentsContent = `
# Media Aérea Reviewer Context

## Standards
${request.standards}

## Checklist
${request.checklist.map((c, i) => `${i + 1}. ${c}`).join("\n")}

## Goal
Provide a JSON response for each checklist item with status (Sí/No/N/A) and finding.
`;
    fs.writeFileSync(agentsFile, agentsContent);

    // 2. Spawn Codex Review
    const systemInstruction = `You are a Senior Software Engineer at Media Aérea performing a critical Peer Review.
Your task is to review the git diff for the current branch against the 'Standards' and 'Checklist' provided in AGENTS.md.

Run the appropriate git diff command yourself to see the changes you need to review. Don't ask the user for it.

RULES:
1. For each item in the checklist, determine if the code satisfies it (Sí), fails it (No), or if it's not applicable (N/A).
2. Provide specific evidence and findings.
3. If an HU requirement is provided, ensure the code satisfies the Acceptance Criteria.
4. Output ONLY a valid JSON array. No conversational text.
`;

    const prompt = `${systemInstruction}

Review context:
- HU Requirements: ${request.huRequirements || "N/A"}

EXPECTED OUTPUT FORMAT (JSON ONLY):
---BEGIN_JSON---
[
  { "itemId": "Exactly as written in checklist", "status": "Sí|No|N/A", "finding": "Brief explanation" }
]
---END_JSON---
`;

    console.log("🧠 Codex is thinking... this may take 30-60 seconds.");

    try {
      // Use spawnSync to avoid shell execution limits and unescaped character issues
      const result = spawnSync(
        "codex",
        ["--dangerously-bypass-approvals-and-sandbox", "exec", prompt],
        { encoding: "utf-8" },
      );

      if (result.error) {
        throw result.error;
      }

      const output = result.stdout;
      const stderr = result.stderr;

      // 3. Parse JSON from output using markers
      const startMarker = "---BEGIN_JSON---";
      const endMarker = "---END_JSON---";

      const startIndex = output.indexOf(startMarker);
      const endIndex = output.indexOf(endMarker);

      if (startIndex === -1 || endIndex === -1) {
        console.error("RAW CODEX STDOUT:\n", output);
        console.error("RAW CODEX STDERR:\n", stderr);
        throw new Error("Missing JSON markers in Codex output");
      }

      const jsonString = output
        .substring(startIndex + startMarker.length, endIndex)
        .trim();
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Codex Review Failed:", error);
      return [];
    } finally {
      // Optional: cleanup AGENTS.md
      // fs.unlinkSync(agentsFile);
    }
  }
}
