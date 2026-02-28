import type { Finding } from "../core/entities/Review.js";

export class BrowserScriptPresenter {
  generateAutoFill(
    findings: Finding[],
    scope: "frontend" | "backend" | "both",
  ): string {
    const findingsJson = JSON.stringify(findings);

    return `
(function() {
  const findings = ${findingsJson};
  const scope = "${scope}";
  console.log("🚀 MA-Reviewer: Starting auto-fill...");

  const statusMap = {
    'Sí': 'true',
    'No': 'false',
    'N/A': 'null',
    'Manual': ''
  };

  findings.forEach(finding => {
    let isAC = finding.itemId.startsWith("AC:");

    if (isAC) {
      console.log(\`ℹ️ Skipping AC observation in DOM auto-fill: \${finding.itemId}\`);
      return;
    }

    const match = finding.itemId.match(/\\d+/);
    if (!match) {
      console.warn(\`⚠️ Could not parse item ID: \${finding.itemId}\`);
      return;
    }

    const idNumber = parseInt(match[0], 10);
    let inputName = '';
    let inputValue = '';
    
    if (scope === "frontend") {
      inputName = 'catF_id[]';
      inputValue = idNumber.toString();
    } else if (scope === "backend") {
      inputName = 'catB_id[]';
      inputValue = idNumber.toString();
    } else {
      // both
      if (idNumber <= 42) {
        inputName = 'catF_id[]';
        inputValue = idNumber.toString();
      } else {
        inputName = 'catB_id[]';
        inputValue = (idNumber - 42).toString();
      }
    }

    const hiddenInput = document.querySelector(\`input[type="hidden"][name="\${inputName}"][value="\${inputValue}"]\`);

    if (hiddenInput) {
      const targetRow = hiddenInput.closest('tr');
      const select = targetRow.querySelector('select.select-cumple');
      const textarea = targetRow.querySelector('textarea.input-observacion');

      if (select) {
        select.value = statusMap[finding.status] || '';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }

      if (textarea) {
        if (finding.status === 'No') {
          textarea.value = finding.finding;
          textarea.removeAttribute('readonly');
          textarea.setAttribute('required', 'true');
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          textarea.style.height = 'auto';
          textarea.style.height = textarea.scrollHeight + 'px';
        } else if (finding.status === 'Manual') {
          textarea.value = ''; // Clean for user input
          textarea.removeAttribute('readonly');
          textarea.dispatchEvent(new Event('input', { bubbles: true }));

          // Inject Visual Hint Badge
          const hint = document.createElement('div');
          hint.className = 'ma-reviewer-hint';
          hint.style.all = 'initial';
          hint.style.display = 'block';
          hint.style.marginTop = '8px';
          hint.style.padding = '8px';
          hint.style.backgroundColor = '#e0fafa';
          hint.style.border = '1px dashed #008b8b';
          hint.style.borderRadius = '4px';
          hint.style.color = '#006666';
          hint.style.fontFamily = 'sans-serif';
          hint.style.fontSize = '12px';
          hint.style.lineHeight = '1.4';
          hint.innerHTML = \`<strong>🤖 AI HINT:</strong> \${finding.finding}\`;
          
          // Append to the observation cell
          textarea.parentNode.appendChild(hint);
        } else {
          textarea.value = '';
          textarea.setAttribute('readonly', 'true');
          textarea.removeAttribute('required');
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
      
      console.log(\`✅ Filled: \${finding.itemId}\`);
    } else {
      console.warn(\`⚠️ Could not find DOM element for: \${finding.itemId}\`);
    }
  });

  console.log("✨ MA-Reviewer: Auto-fill complete!");
})();
    `;
  }
}
