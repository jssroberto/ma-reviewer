import { spawn } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { createInterface } from "readline";
import { CleanupManager } from "../../core/utils/CleanupManager.js";
import type { Finding } from "../../core/entities/Review.js";
import { JsonExtractor } from "../../core/utils/JsonExtractor.js";
import type { AIDriver, AIReviewRequest } from "./AIDriver.js";

export class CodexDriver implements AIDriver {
  async review(
    request: AIReviewRequest,
    onEvent?: (event: any) => void,
  ): Promise<Finding[]> {
    const cleanupManager = CleanupManager.getInstance();
    const agentsFile = path.join(os.tmpdir(), `ma-agents-${Date.now()}.md`);
    cleanupManager.registerFile(agentsFile);

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
    const systemInstruction = `You are a Supportive Peer Reviewer and Senior Software Engineer at Media Aérea. You are helping a colleague by performing a constructive Peer Review for a ${scopeLabel} component.

Your PRIMARY MISSION is to collaborate with the developer to ensure the code changes align with the 'User Story' (HU) and its 'Acceptance Criteria' (AC), while maintaining technical health.

COLLABORATION PROTOCOL:
1. Review the 'Acceptance Criteria' (AC) and find evidence in the code diff that confirms they are met.
2. If an AC point seems missing or incomplete, mention it as a helpful observation for the project.
3. If an AC is not applicable, mark as 'N/A'.
4. Perform a secondary scan against the general Media Aérea 'Standards' and 'Checklist'. 
5. Focus on meaningful improvements. Be forgiving of debatable minor style points unless they impact project maintainability.

OBSERVATIONS STYLE:
- Perspective: Third-person neutral. Do NOT talk directly to the developer. Avoid "Podrías", "Sería útil", "Debes". Use "Se recomienda...", "Falta...", "Se observa...".
- Structure: Single concise phrase. Do NOT use semicolons or multiple sentences.
- Language: Spanish.
- Conciseness: Maximum 15-20 words.
- Evidence-based: Reference specific files or logic.

Output ONLY a valid JSON array. No conversational text.
`;

    const prompt = `${systemInstruction}

--- BUSINESS CONTEXT (HU) ---
${request.userStory}

--- TECHNICAL CONTRACT (Acceptance Criteria) ---
${request.acceptanceCriteria}

--- GENERAL STANDARDS ---
Checklist: See the attached file ${path.basename(agentsFile)}

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

      child.stderr.on("data", (data: any) => {
        // Silencing stderr for events unless we decide to log it
      });

      child.on("close", async (code: number) => {
        if (code !== 0) {
          await cleanupManager.cleanup();
          return reject(new Error(`Codex process exited with code ${code}`));
        }

        try {
          const findings = JsonExtractor.extract<Finding[]>(
            fullOutput,
            "---BEGIN_JSON---",
            "---END_JSON---",
          );
          await cleanupManager.cleanup();
          resolve(findings);
        } catch (error) {
          await cleanupManager.cleanup();
          resolve([]);
        }
      });

      child.on("error", (err: any) => {
        reject(err);
      });
    });
  }
}
