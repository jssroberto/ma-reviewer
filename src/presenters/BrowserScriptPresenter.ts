import type { Finding } from "../core/entities/Review.js";

export class BrowserScriptPresenter {
  /**
   * Generates the browser auto-fill script.
   * Uses IIFE stringification to avoid manual escaping hell.
   */
  generateAutoFill(
    findings: Finding[],
    scope: "frontend" | "backend" | "both",
  ): string {
    const findingsJson = JSON.stringify(findings);
    const cssBase64 = this._getCssBase64();

    const logicStr = this._browserLogic.toString();
    const functionDefinition =
      logicStr.startsWith("async") || logicStr.startsWith("function")
        ? logicStr
        : "function " + logicStr;

    return `
(function() {
  const findings = ${findingsJson};
  const scope = "${scope}";
  const cssBase64 = "${cssBase64}";

  (${functionDefinition})(findings, scope, cssBase64);
})();
    `;
  }

  /**
   * Helper to Base64 encode the minimalist CSS.
   * This ensures zero escaping issues during script generation.
   */
  private _getCssBase64(): string {
    const css = `
      .ma-reviewer-hint {
        margin-top: 8px;
        padding: 6px 10px;
        background-color: rgba(15, 23, 42, 0.6);
        border-radius: 4px;
        border-left: 2px solid #0891b2;
        font-family: inherit;
        color: #94a3b8;
        font-size: 11px;
        line-height: 1.4;
        display: flex;
        align-items: flex-start;
        gap: 8px;
      }
      .ma-reviewer-hint-badge {
        background-color: rgba(8, 145, 178, 0.1);
        color: #22d3ee;
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        padding: 1px 4px;
        border-radius: 3px;
        white-space: nowrap;
        border: 1px solid rgba(8, 145, 178, 0.2);
        margin-top: 1px;
      }
      .ma-reviewer-hint-content {
        flex: 1;
      }
      @keyframes maFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .ma-reviewer-animated {
        animation: maFadeIn 0.3s ease-out forwards;
      }
    `;
    return Buffer.from(css).toString("base64");
  }

  /**
   * This method contains the ACTUAL logic that runs in the browser.
   * Since it's a real function, we get full IDE support (syntax highlighting, linting).
   */
  private _browserLogic(findings: Finding[], scope: string, cssBase64: string) {
    console.log("🚀 MA-Reviewer: Starting auto-fill...");

    // Inject CSS for Minimalist UI
    if (!document.getElementById("ma-reviewer-styles")) {
      const style = document.createElement("style");
      style.id = "ma-reviewer-styles";
      style.textContent = atob(cssBase64);
      document.head.appendChild(style);
    }

    const statusMap: Record<string, string> = {
      Sí: "true",
      No: "false",
      "N/A": "null",
      Manual: "",
    };

    findings.forEach((finding) => {
      const isAC = finding.itemId.startsWith("AC:");

      if (isAC) {
        console.log(
          `ℹ️ Skipping AC observation in DOM auto-fill: ${finding.itemId}`,
        );
        return;
      }

      const match = finding.itemId.match(/\d+/);
      if (!match) {
        console.warn(`⚠️ Could not parse item ID: ${finding.itemId}`);
        return;
      }

      const idNumber = parseInt(match[0], 10);
      let inputName = "";
      let inputValue = "";

      if (scope === "frontend") {
        inputName = "catF_id[]";
        inputValue = idNumber.toString();
      } else if (scope === "backend") {
        inputName = "catB_id[]";
        inputValue = idNumber.toString();
      } else {
        // both
        if (idNumber <= 42) {
          inputName = "catF_id[]";
          inputValue = idNumber.toString();
        } else {
          inputName = "catB_id[]";
          inputValue = (idNumber - 42).toString();
        }
      }

      const hiddenInput = document.querySelector(
        `input[type="hidden"][name="${inputName}"][value="${inputValue}"]`,
      );

      if (hiddenInput) {
        const targetRow = hiddenInput.closest("tr");
        if (!targetRow) return;

        const select = targetRow.querySelector(
          "select.select-cumple",
        ) as HTMLSelectElement | null;
        const textarea = targetRow.querySelector(
          "textarea.input-observacion",
        ) as HTMLTextAreaElement | null;

        if (select) {
          select.value = statusMap[finding.status] || "";
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }

        if (textarea) {
          if (finding.status === "No") {
            textarea.value = finding.finding;
            textarea.removeAttribute("readonly");
            textarea.setAttribute("required", "true");
            textarea.dispatchEvent(new Event("input", { bubbles: true }));
            textarea.style.height = "auto";
            textarea.style.height = textarea.scrollHeight + "px";
          } else if (finding.status === "Manual") {
            textarea.value = ""; // Clean for user input
            textarea.removeAttribute("readonly");
            textarea.dispatchEvent(new Event("input", { bubbles: true }));

            // Inject Visual Hint Badge
            const hintId =
              "ai-hint-" + finding.itemId.replace(/[^a-zA-Z0-9]/g, "");
            if (!document.getElementById(hintId)) {
              const hint = document.createElement("div");
              hint.id = hintId;
              hint.className = "ma-reviewer-hint ma-reviewer-animated";

              hint.innerHTML = `
                <span class="ma-reviewer-hint-badge">✨ AI</span>
                <span class="ma-reviewer-hint-content">${finding.finding}</span>
              `;

              // Append to the observation cell
              textarea.parentNode?.appendChild(hint);
            }
          } else {
            textarea.value = "";
            textarea.setAttribute("readonly", "true");
            textarea.removeAttribute("required");
            textarea.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }

        console.log(`✅ Filled: ${finding.itemId}`);
      } else {
        console.warn(`⚠️ Could not find DOM element for: ${finding.itemId}`);
      }
    });

    console.log("✨ MA-Reviewer: Auto-fill complete!");
  }
}
