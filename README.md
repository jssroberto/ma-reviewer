# 🚀 Media Aérea - Auto Peer Review (ma-reviewer)

The **ma-reviewer** is an automated Peer Review Orchestrator designed to help Media Aérea developers ensure high-quality code that aligns with both technical standards and business requirements.

Unlike generic linters, this tool acts as an **Acceptance Criteria Auditor**, verifying that code changes specifically satisfy the mandated user stories before performing general technical checks.

---

## ✨ Key Features

- **🔎 Acceptance Criteria Audit**: Specialized two-step flow that validates the code against the "Who/What/Why" (Historia de Usuario) and the "Technical Contract" (Criterios de Aceptación).
- **🌍 Multi-Language Standards**: Native support for language-specific audits including JavaScript/TypeScript, Python/Django, PHP/Laravel, Kotlin/Mobile, and Web Performance.
- **📋 Master Checklist Integration**: Audits code against Media Aérea's master certification checklist, adapted to the specific review scope.
- **⚡ Real-Time Feedback**: Asynchronous execution model with a live terminal spinner and high-fidelity status updates.
- **🎨 Browser Auto-fill**: Generates a custom Javascript snippet to automatically populate the internal Media Aérea review tool with the AI's findings.
- **🛡️ Robust AI Driver**: Resilient JSON parsing that handles "dirty" AI outputs and uses `stdin` for secure prompt handling.
- **🌿 Git Intelligence**: Intelligent diffing that handles complex branch comparisons and single-commit repositories.

---

## 🛠️ Tech Stack

- **Core**: TypeScript / Node.js
- **AI Brain**: Codex (via `codex` CLI)
- **CLI Framework**: Commander.js + Inquirer.js
- **UI & Feedback**: Ora (Spinners) + Chalk (Colors) + cli-table3
- **Git Interaction**: Simple Git

---

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+)
- `pnpm` installed
- `codex` CLI installed and authenticated

### Installation
```bash
# Clone the repository
git clone https://github.com/jssroberto/auto-peer-review.git
cd auto-peer-review

# Install dependencies
pnpm install

# (Optional) Install the CLI globally to use 'ma-reviewer' anywhere
pnpm add -g .
```

---

## 🧙 The Review Wizard (Interactive Mode)

The `ma-reviewer` is designed as an **interactive wizard** rather than a silent CLI tool. This ensures that every review is aligned with the specific business requirements of the task.

### 🏃 Quick Start
```bash
# Using the installed CLI
ma-reviewer review

# Or via pnpm (aliased shortcut)
pnpm run review
```

### 🧠 Smart Features
- **Session Caching**: The tool remembers your last **Historia de Usuario**, **Criterios de Aceptación**, and **Technology Standards**. On subsequent runs, it will ask if you'd like to reuse them, saving you from re-typing or re-linking files.
- **Multi-Branch Selection**: During the audit, you can select one or multiple feature branches using the **spacebar**. The tool will intelligently calculate the diff for all selected changes.
- **Base Branch Recommendations**: The wizard scans your repository and recommends the most logical base branch (e.g., `origin/main` or `dev`) for comparison.

### 🛠️ Step-by-Step Flow
1.  **Requirement Collection**: Choose between inputting the Story/AC manually (opens your default editor) or providing a path to a `.md` file.
2.  **Standards Selection**: Pick the relevant technical standards (Python, PHP, JS/TS, etc.).
3.  **Branch Picking**: Select which feature branches to audit and confirm the base merge target.
4.  **Review Scope**: Filter the audit for Frontend, Backend, or Both.

### 📊 Understanding Audit Results
Once the AI completes the audit, the tool provides two distinct outputs:
1.  **Terminal Summary**: A color-coded table showing Passed, Failed, and items requiring **Manual Review**.
2.  **Browser Auto-fill Script**: A custom JavaScript snippet. Copy and paste this into the console of Media Aérea's internal review tool to automatically populate it with the AI's findings.

---

## ⚙️ Advanced Usage (Flags)
While the wizard is the recommended way to use the tool, you can skip parts of it using flags:

```bash
# Using the CLI
ma-reviewer review -b dev

# Provide the User Story file directly
ma-reviewer review -s ./docs/MY_USER_STORY.md

# Specify review scope (frontend, backend, both)
ma-reviewer review --scope backend
```

---

## 🏗️ Architecture

The project follows a clean, decoupled architecture:
- **`src/core/use-cases`**: Orchestrates the review flow logic.
- **`src/drivers/ai`**: Interface and implementation for AI communication (Codex, etc.).
- **`src/drivers/git`**: Interface and implementation for repository interactions.
- **`src/presenters`**: Handles feedback formats (Console, Browser Script, Real-time UI).
- **`src/core/utils`**: Robust utilities like `JsonExtractor` for AI output reliability.

---

## 🌍 Language & Tone

To align with the Media Aérea culture, all observations are generated in **professional, concise Spanish**. The AI focuses on developer-to-developer feedback (e.g., *"Falta validación de 100 char en el DTO"*) rather than robotic status messages.

---

## 🤝 Contribution

1. Ensure all tests pass: `pnpm test`
2. Follow the architectural patterns for new Drivers or Presenters.
3. Keep the checklist in `resources/checklist.json` updated with latest certification standards.
