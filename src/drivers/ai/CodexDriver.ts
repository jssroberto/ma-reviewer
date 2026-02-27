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
    const scopeLabel =
      request.scope === "both" ? "Full Stack" : request.scope.toUpperCase();
    const systemInstruction = `You are a Senior Software Engineer at Media Aérea performing a critical Peer Review as an Acceptance Criteria Auditor for a ${scopeLabel} component.

Your PRIMARY MISSION is to perform a technical audit of the code changes against the specific 'Acceptance Criteria' (AC) of the 'User Story' (HU).

AUDIT PROTOCOL:
1. Parse the 'Acceptance Criteria' list into individual, actionable points.
2. For EACH point, find technical evidence in the code diff that confirms it is either 'Satisfied' (Sí) or 'Violated' (No).
3. If an AC is not applicable to the current changes, mark as 'N/A'.
4. After the AC Audit, perform a secondary review against the general Media Aérea 'Standards' and 'Checklist'.
5. Map every finding either to a specific AC point or a Checklist item ID.

OBSERVATIONS STYLE:
- Language: Spanish.
- Tone: Natural, professional, and developer-to-developer. Avoid robotic "No cumple..." prefixes.
- Conciseness: Maximum 15-20 words.
- Evidence-based: Mention specific files or line logic (e.g., "Falta validación de 100 char en el DTO" instead of "El campo nombre no cumple con la longitud máxima").

Output ONLY a valid JSON array. No conversational text.
`;

    const prompt = `${systemInstruction}

--- BUSINESS CONTEXT (HU) ---
${request.userStory}

--- TECHNICAL CONTRACT (Acceptance Criteria) ---
${request.acceptanceCriteria}

--- GENERAL STANDARDS ---
Checklist: See AGENTS.md

--- EXPECTED OUTPUT FORMAT (JSON ONLY) ---
---BEGIN_JSON---
[
  { 
    "itemId": "AC: [Requirement Name] or Checklist ID", 
    "status": "Sí|No|N/A", 
    "finding": "Specific evidence from the code (concise)" 
  }
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
