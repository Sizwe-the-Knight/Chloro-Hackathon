# Codex operating instructions — CHLORO

**MANDATORY FIRST READ:** `FOUNDATIONS.md` then `TRACKER.md`. These documents are binding. Review them before proposing code, tools, architecture, environments, or deployment.

## Operating contract

1. Execute **only the currently authorized milestone** in `TRACKER.md`. Do not reinterpret the product goal.
2. Maintain $0 actual and maximum spend. Stop on credit-card requirements, paid plans, uncertain billing, usage charges, automatic upgrades, and unverified AI quotas. Do not sign up or provision on the owner's behalf.
3. Sandbox only; no live payment processing. No secret keys in code, logs, commits, screenshots, or chat summaries.
4. Keep `Discover → Inquire → Commit → Pay → Collect` intact. Preserve buyer approval **and** seller-approved exact quote before checkout.
5. Prefer smallest reliable Windows-native TypeScript implementation using React/Vite, Express/Node, and pnpm. Avoid Docker/WSL.
6. Do not add features, sponsor APIs, analytics, accounts, geolocation, payouts, subscriptions, marketplace onboarding, or cloud services unless the owner approves a Foundation change.
7. If a full implementation cannot be completed before the milestone deadline, prioritize the next judge-demonstrable end-to-end slice and report what was deferred. No quiet scope expansion.
8. Verify important external API behavior with official docs; if tool/network access is absent, label as unverified, do not guess.
9. Tests: run focused checks for actual changes, then gate-level checks. Don't repeat costly external API calls without cause or authorization.
10. Before any proposed action that could spend money, move real money, publish publicly, or incur irreversible effects: **STOP** and request explicit owner authorization. Never do it by default.

## Required response format after every task

- **Authorized stage:** ID and objective
- **Changes:** specific files modified
- **Evidence:** commands/tests/manual results; what was not verified
- **Cost gate:** actual $0.00; newly proposed services and their unverified billing terms
- **Scope gate:** no additions (or change request not implemented)
- **Status:** PASS / BLOCKED / FAIL
- **Next stage:** recommendation only, do not start it

## When a conflict is detected

Write: `CHANGE REQUEST — NOT IMPLEMENTED`, explain why, list a free in-scope alternative, then STOP. Do not silently bypass these instructions.
