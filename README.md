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
```

### Running a Review
The review process is **mandatory and interactive** to ensure business alignment.

```bash
# Basic usage (defaults to origin/main)
pnpm run review

# Compare against a specific base branch
pnpm run review -b dev

# Provide the User Story file directly
pnpm run review -s ./docs/MY_USER_STORY.md

# Specify review scope (frontend, backend, both)
pnpm run review --scope backend
```

If you don't provide mandatory info via flags, the CLI will interactively prompt you for:
1.  **Historia de Usuario & Criterios de Aceptación** (Input manually or provide file path).
2.  **Technology Standards Selection**: Choose from Python, PHP, Kotlin, JS/TS, or Web Performance.
3.  **Review Scope**: Filter the checklist for Frontend, Backend, or Full Stack (Both).

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
