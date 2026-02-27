import type { Finding } from "../core/entities/Review.js";

export class BrowserScriptPresenter {
  generateAutoFill(findings: Finding[]): string {
    const findingsJson = JSON.stringify(findings);

    return `
(function() {
  const findings = ${findingsJson};
  console.log("🚀 MA-Reviewer: Starting auto-fill...");

  const statusMap = {
    'Sí': 'true',
    'No': 'false',
    'N/A': 'null'
  };

  findings.forEach(finding => {
    // 1. Find the row by specification text (this is the most reliable way)
    const rows = Array.from(document.querySelectorAll('tr'));
    
    const normalize = (str) => str.toLowerCase().replace(/\s+/g, ' ').trim();
    const targetRow = rows.find(tr => {
      const rowText = normalize(tr.innerText);
      const searchId = normalize(finding.itemId);
      // Use includes or a high-similarity check
      return rowText.includes(searchId) || searchId.includes(rowText.substring(0, 20));
    });

    if (targetRow) {
      // 2. Find the select and textarea in this row
      const select = targetRow.querySelector('select.select-cumple');
      const textarea = targetRow.querySelector('textarea.input-observacion');

      if (select) {
        select.value = statusMap[finding.status] || '';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }

      if (textarea) {
        if (finding.status === 'No') {
          textarea.value = finding.finding;
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          // Trigger the auto-expand logic if it exists
          textarea.style.height = 'auto';
          textarea.style.height = textarea.scrollHeight + 'px';
        } else {
          textarea.value = '';
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
      
      console.log(\`✅ Filled: \${finding.itemId}\`);
    } else {
      console.warn(\`⚠️ Could not find row for: \${finding.itemId}\`);
    }
  });

  console.log("✨ MA-Reviewer: Auto-fill complete!");
})();
    `;
  }
}
