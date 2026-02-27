import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { createInterface } from "readline";
import type { Finding } from "../../core/entities/Review.js";
import { JsonExtractor } from "../../core/utils/JsonExtractor.js";
import type { AIDriver, AIReviewRequest } from "./AIDriver.js";

export class CodexDriver implements AIDriver {
  async review(
    request: AIReviewRequest,
    onEvent?: (event: any) => void,
  ): Promise<Finding[]> {
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

    // 2. Prepare Codex Prompt
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

    return new Promise((resolve, reject) => {
      let fullOutput = "";

      const child = spawn(
        "codex",
        ["--dangerously-bypass-approvals-and-sandbox", "exec", "--json", "-"],
        { shell: false },
      );

      // Send prompt via stdin
      child.stdin.write(prompt);
      child.stdin.end();

      const rl = createInterface({ input: child.stdout });

      rl.on("line", (line) => {
        try {
          const event = JSON.parse(line);

          // If it's a message item, accumulate it for final extraction
          if (
            event.type === "item.completed" &&
            event.item?.type === "agent_message"
          ) {
            fullOutput += event.item.text + "\n";
          }

          // Forward event to listener
          if (onEvent) onEvent(event);
        } catch (e) {
          // If not valid JSON, it might be raw output or markers
          fullOutput += line + "\n";
        }
      });

      child.stderr.on("data", (data) => {
        // Silencing stderr for events unless we decide to log it
      });

      child.on("close", (code) => {
        if (code !== 0) {
          return reject(new Error(`Codex process exited with code ${code}`));
        }

        try {
          const findings = JsonExtractor.extract<Finding[]>(
            fullOutput,
            "---BEGIN_JSON---",
            "---END_JSON---",
          );
          resolve(findings);
        } catch (error) {
          resolve([]);
        }
      });

      child.on("error", (err) => {
        reject(err);
      });
    });
  }
}
