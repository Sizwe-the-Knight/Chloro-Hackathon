# Copy everything below into Codex as the first task

**CHLORO — FOUNDATION 00 / M0 FEASIBILITY AUDIT ONLY**

You are joining a new PayPal AI Hackathon project. Before doing anything, read `AGENTS.md`, `FOUNDATIONS.md`, and `TRACKER.md` in full. These are binding; do not override or refactor them.

Goal: inspect my **Windows** local environment and repo folder, then prepare a narrow and technically accurate M0 verification plan for the $0-budget Chloro prototype. The product journey is **Discover → Inquire → Commit → Pay → Collect**.

Rules for THIS task:

1. Do not write app code, install dependencies, run cloud commands, deploy, publish, buy anything, create accounts, connect billing, or call PayPal/AI APIs.
2. Never edit `FOUNDATIONS.md` or `AGENTS.md`. You may update only the M0 inspection fields in `TRACKER.md`, with verified facts; do not mark a check PASS without evidence.
3. Check only read-only local facts: Node, pnpm, git availability/versions; current folder and repo status; whether the expected starter docs exist; any pre-existing source to preserve.
4. Read official PayPal JS SDK v6 and Orders API guidance *if network access is available*, but do not treat internet docs as approval for paid or external changes. Say 'unverified' when you cannot check.
5. Give a concise proposed architecture using React/Vite + TypeScript, Express/Node, and pnpm, or explain a clear blocker. Prefer one process for hosting later if possible without complexity.
6. Give an exact **human-performed** signup checklist for free Devpost registration and PayPal sandbox buyer/business accounts, and an AI free-tier validation checklist. Never ask me to paste API secrets into chat.
7. Define the next stage (M1) as **one verified PayPal sandbox order** created from a backend-authoritative quote, with buyer approval and verified capture. Do not start M1.

Response format:
- Environment observations (verified vs unknown)
- M0 readiness checklist and blockers
- Proposed minimal app shape (no implementation yet)
- Cost compliance: no payments/charges/provisioning; identify any unknowns
- Scope compliance: no new features
- Required owner actions
- Exact next Codex prompt suggestion for **M1 only**, contingent on M0 PASS

Do not invent test results, credentials, or repository status.
