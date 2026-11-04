# CHLORO — MASTER FOUNDATIONS (LOCKED)

**Project:** Chloro — AI-assisted local commerce for travelers and small merchants  
**Hackathon:** PayPal AI Hackathon 2026  
**Working public attribution:** "Chloro — Built with PayPal" (not an official PayPal product)  
**Owner:** Sizwe-the-Knight  
**Foundation version:** 1.0 | **Established:** 2026-10-30  
**Time zone:** Africa/Johannesburg (SAST, UTC+02:00)

> **Authority:** This document overrides Codex's preferences, optimizations, and feature recommendations. Codex may point out a conflict or propose a change; it may **not** implement that change without explicit owner approval and a versioned update to this file. Official hackathon rules and applicable law remain higher authority than these project instructions.

## Foundation 01 — Product mission (immutable without approval)

Chloro helps a traveler transact with a participating small/local merchant **during a trip**, with AI-assisted communication and a merchant-approved offer.

**Locked journey: Discover → Inquire → Commit → Pay → Collect.**

1. **Discover:** Traveler views/scans a seeded merchant passport (not an open global directory).
2. **Inquire:** Traveler enters what they want, preferred language, budget, and latest feasible pickup time; AI may translate and organize the request.
3. **Commit:** Merchant confirms a fixed item/service description, currency, price, pickup location, readiness time, and applicable pickup terms. Buyer reviews and accepts; no money has moved yet.
4. **Pay:** Buyer explicitly starts PayPal **Sandbox** checkout. Backend creates/captures an order for the merchant-approved amount. Successful server-verified capture, not a UI click, makes the order **PAID**.
5. **Collect:** Merchant indicates ready; traveler collects locally; both can record handover for the demonstration. Do not call this independent proof of fulfillment.

**Demo success:** One understandable, repeatable, end-to-end journey for one seeded buyer and one seeded merchant, including a real sandbox capture and live AI functionality.

## Foundation 02 — Absolute $0 financial ceiling

- **Total cash outlay: USD $0.00.** No purchases, usage-based billing, subscriptions, paid upgrades, domain purchases, card-required trials, or services that can auto-charge. Promotional credits are **not** an excuse to select paid infrastructure.
- Before adding a dependency, API provider, hosting service, or database: document **free-tier eligibility, card requirement, quota/expiration, billing behavior, and no-charge fallback** in TRACKER.md. Unknown cost = **BLOCKED**.
- Never connect live PayPal credentials, move real money, or enable billable AI fallbacks.
- AI must have server-side request limits and explicit free-tier model selection. On 429/quota failure, stop gracefully; no unbounded retries, provider switching, or paid fallback.
- If free-tier access cannot be confirmed, stop that integration and report a blocker. Never pretend prewritten answers are live AI.
- **Budget ledger:** Authorized $0.00 | Actually spent $0.00 | Maximum permitted $0.00. Update only with real evidence; never assume charges are impossible.

## Foundation 03 — Hard deadline and freeze

- Official deadline: **Thursday, 2026-11-12 22:00 SAST** (2026-11-12 12:00 PST).
- Internal target: **submit by Wednesday, 2026-11-11 18:00 SAST**.
- Scope freeze: **2026-11-07**; only missing essentials, safety, and defects afterward.
- Code freeze: **2026-11-10 18:00 SAST**; no redesigns or stack migrations afterward.
- Nov 12 is contingency only, not a planned development day.
- Judge evaluation runs through Dec 15. A hosted demo is preferred **only if truly free, reliable, and safe**; complete self-run instructions are an acceptable fallback under the official rules.
- Codex must optimize for the best complete submission by the deadline, not the largest architecture.

## Foundation 04 — Scope fence

### In scope for hackathon MVP
- Responsive traveler view and very simple merchant confirmation view.
- One or two clearly labeled demo merchant passports, not a searchable global marketplace.
- Traveler inquiry with budget and requested pickup deadline.
- Live AI-assisted translation **and/or** structured requirement extraction; show original text and AI interpretation.
- Human merchant confirmation of item/service, **exact price, currency, and ready-by time**.
- Fixed-price PayPal sandbox checkout, verified capture, visible order status.
- Local pickup flow with simple handover confirmation, plus error and empty states.
- Minimal durable state as needed for demo, tests, README, public code, license, video.

### Out of scope (explicit prohibitions)
- Expedia-style itineraries, hotel/flights, trip booking, food delivery, international shipping, repeated orders after departure.
- Live geolocation/maps, worldwide merchant discovery, SEO marketplace, merchant recommendations requiring real third-party inventories.
- Money custody, escrow, savings vaults, automatic bank withdrawals, remittances, payouts, multi-seller live settlement, card vaulting, subscriptions.
- Fully autonomous payment, agent-to-agent purchase, fake PayPal protection guarantees, unsupported refund/dispute promises.
- Real identity-verification claims, public merchant onboarding, production payments, background job queues, notifications, loyalty programs, full review network.
- Docker, WSL, Kubernetes, new cloud services, or migration to a new framework without written approval.

**Priority order:** Verified transaction > Live AI inquiry > Merchant approval > Local pickup > polished UX > optional additions. When late, cut optional additions first.

## Foundation 05 — Technical and cost constraints

- Windows-compatible local development. No WSL or Docker prerequisites.
- Prefer existing familiar stack: TypeScript, React/Vite frontend, Node/Express backend, pnpm. Use minimal dependencies.
- Prefer **PayPal JS SDK v6 + Orders API** (according to current docs) and sandbox merchant/buyer accounts. Server must own order creation, amount validation, and capture confirmation.
- Credentials in ignored environment files; client ID may be exposed if supported, **client secret never**.
- Start local. Do not purchase hosting or set up a database until its cost and need have been verified. Free managed persistence is optional, not assumed. If hosted memory is ephemeral, document that honestly; never claim reliable persistence.
- No unnecessary sponsor integration. PayPal AI Toolkit is development assistance, not proof of AI functionality in Chloro.

## Foundation 06 — Merchant, traveler, and money safety

- AI is a translator/organizer; it **never sets the price, promises availability, or decides to pay**.
- Original buyer message and AI translation/extraction remain visible for human review. AI must flag uncertainty and ask for clarification instead of inventing details.
- Merchant determines offered price/currency, item terms, pickup location, and ready-by date. Buyer affirmatively accepts those exact terms.
- Payment uses merchant-approved canonical server-side quote, not browser-submitted amount. Quote cannot be silently edited after buyer approval; an edit requires re-approval.
- Prevent duplicate captures; verify PayPal capture status and amount via trusted server response, webhook, or API. Declines and pending statuses must never show Paid.
- For MVP, a single sandbox merchant account may back demo profiles; prominently disclose this. Never imply multiple independent sellers receive separate payouts.
- Do not claim identity verification, scam-proofing, verified reviews, escrow, or unconditional buyer protection.
- Store minimal personal data and use fake demo customer/merchant details. Use no real traveler PII in seeded fixtures.

## Foundation 07 — Tests and evidence

- Every stage has explicit acceptance evidence: commands, screenshots, sandbox transaction IDs with secrets removed, or verified manual checks.
- Baseline tests: valid payment, failed payment, stale/changed quote, double-click or duplicate capture, AI uncertainty, merchant not confirmed, deadline already passed, and pickup status.
- Prefer focused tests once per affected area; run full typecheck/build/integration suite at milestone gates, not repeatedly without a reason.
- Keep a dated changelog, blockers, test results, commit ID, and budget status in TRACKER.md.

## Foundation 08 — Submission completeness

Submission must include:
- Functional app: hosted demo URL **or** full, repeatable local setup/run instructions for judges.
- Public open-source code repository, source/assets, root `LICENSE`, and explanatory `README.md`.
- Under-three-minute **public YouTube** demo showing the actual working journey.
- Devpost description: the problem, audience, how AI is used, how PayPal is used, constraints of sandbox, and what is real versus illustrative.
- No secrets or unlicensed artwork/music/trademarks in source or video.
- Confirm demo remains reasonably testable through Dec 15; if hosting sleeps, say so and document self-run fallback.

## Foundation 09 — Codex workflow / change control

- Read `AGENTS.md`, `FOUNDATIONS.md`, and `TRACKER.md` **at the start of every stage**.
- **One stage per task.** Never start the next stage or run a broad refactor without explicit approval.
- If a recommendation conflicts with a Foundation, STOP and report it as **CHANGE REQUEST — NOT IMPLEMENTED**.
- Any new tool/service dependency must pass the $0 cost gate first. No background tasks, no chargeable service provisioning, no automatic deployment, and no public repo publication without approval.
- Before editing: state stage objective, affected files, risks, planned checks. After editing: report changed files, tests/results, budget status, blocker status, and next recommended stage.
- A Foundation modification requires a numbered entry below with: reason, owner approval, impact on budget and deadline, date, and updated version. Codex cannot approve its own change.

## Foundation change log

| Date (SAST) | Version | Request | Owner approval | Outcome |
|---|---|---|---|---|
| 2026-10-30 | 1.0 | Initial nine locked foundations | Initial project mandate | Active |
