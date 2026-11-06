# Release readiness

M5 prepared the local source candidate. The owner has now created and explicitly authorized M6 source publication to [Sizwe-the-Knight/Chloro-Hackathon](https://github.com/Sizwe-the-Knight/Chloro-Hackathon); verified push evidence belongs in TRACKER.md. Hosting, video and Devpost actions are separate. Local Git uses `main` and repository-only identity `Sizwe-the-Knight` / `339973498+Sizwe-the-Knight@users.noreply.github.com`, derived from the public account ID and GitHub's noreply format. Global identity/account settings remain unchanged.

## Publication boundary

- Include application source, lockfile, README, LICENSE, dependency notices, `.env.example`, release checker and governing/evidence documents.
- Exclude `.env*` except `.env.example`, `local-data/`, screenshots/receipts/counters, dependencies, builds, editor state, credentials and the original starter ZIP. The archive is preserved locally, not silently deleted or republished.
- Run `pnpm release:check` before initial commit and again before any later publication. It inspects candidate/tracked files and reachable/reflog history, comparing local configured credential values and recognized patterns without printing matches. Inspect the staged file list too. A clean scan is scoped evidence, not proof that arbitrary future files are safe.
- This source tree uses original CSS/text artwork. PayPal SDK assets are remotely supplied by PayPal. MIT root license and locally installed third-party license/notice texts are retained; platform binary packages declare MIT and refer to parent notices. `node_modules`/built binaries are not distributed in the source snapshot.

## $0 hosting assessment — 2026-11-04

| Route | Card/billing/expiration/quota evidence | Decision |
|---|---|---|
| Local self-run | Existing machine; local OSS has no hosting card, expiration or usage bill. Gemini/PayPal remain subject to their separate verified free/Sandbox gates. | Recommended; README and judge-access guide supplied. No new service. |
| Render Free Node web service | 750 free instance hours/month; sleeps after 15 minutes. Local file changes disappear on spin-down/restart/redeploy; free persistent disks unavailable. Bandwidth/build overages can bill with a payment method, otherwise suspend/stop builds. No fixed free web-service expiration established; exact included bandwidth/build allotments and any account-specific card verification not confirmed. | Not selected or authorized. Losing records/counters violates this app's required persistence, and unknown billing/card conditions fail G0. No signup/provisioning. |

Sources: [Render free-service documentation](https://render.com/docs/free), [Render pricing](https://render.com/pricing). This is an assessment, not confirmation of an eligible owner account. Do not work around lost local state by adding a database, paid disk, card or different cloud service. A public shared-key deployment would also require separate access/abuse controls and owner authorization; none are added in M5.

The [hackathon rules](https://paypalaihackathon.devpost.com/rules) allow a runnable local build with complete instructions. [JUDGE_ACCESS.md](JUDGE_ACCESS.md) documents that option and its credential requirements. Thus optional hosting limitations do not require expanding the MVP.

## M6 hosting-readiness decision — 2026-11-05 (SAST)

**Public hosting deferred.** The current shared session state and local payment checkpoints support local self-run judging. The [official submission rules](https://paypalaihackathon.devpost.com/rules) allow a working self-run build with complete instructions. The [judge guide](JUDGE_ACCESS.md) documents evaluator-owned credentials and the owner-confirmed support channel through December 21, 2026.

### What blocks hosting

- **Network:** The existing server reads `PORT` but binds only to `127.0.0.1`. The POST origin check expects HTTP, so changing only the bind address would also reject normal HTTPS submissions on Render. Leave both unchanged until the hosted storage and access controls are ready.
- **Isolation:** The inquiry list, every inquiry action and the legacy purchase API share process-wide state. The traveler/merchant switch is a demonstration role, not authentication. A hosted implementation needs an opaque server-issued session (secure, HttpOnly cookie), server-side ownership checks on every list/read/write route, and no public legacy receipt or legacy checkout. A fresh session must not erase prior purchases. Separate access control for quota-consuming requests is needed so anonymous traffic cannot exhaust the judges' shared daily allowance.
- **Durability:** Inquiry and commerce routes cache whole JSON snapshots. Their services and the legacy payment engine depend on synchronous saves and in-process guards. An async database write that is not awaited can send Gemini or PayPal requests before the reservation is durable. Saving only after the provider responds can lose the attempt or capture marker if the process stops mid-request. Holding one transaction open until the provider responds also fails to make the initial marker durable. Independent judge file stores would additionally turn the 20-attempt limit into a per-session limit unless usage is moved out of them.
- **Smallest later hosted scope:** Retain the existing UI, validated offer logic and provider adapters. Replace the hosted store contracts with awaited, atomic pre-call reservations and conditional completion writes, with session-owned inquiry/purchase records and one shared SAST-day usage record. Make storage errors fail closed; a persisted uncertain capture needs review, not automatic retry or a new order for that purchase. Keep the existing local JSON files and receipts separate. Verify concurrent requests, restart after reservation, storage failure, foreign-session reads/writes and cross-session quota exhaustion using mocks before any hosted smoke test. This crosses the inquiry, payment and route boundaries; it is not a safe one-file persistence adapter.

### Conditional Render configuration — do not deploy the current revision

| Setting | Value after the blockers are resolved and the owner authorizes deployment |
|---|---|
| Service | One native **Node Web Service**, repository root, reviewed revision, **Hobby** workspace and **Free** instance only. Use the supplied HTTPS subdomain, no paid disk/domain, and disable auto-deploy. |
| Runtime | `NODE_VERSION=24.21.0`, `NODE_ENV=production`; one process. Use Render-assigned `PORT` (normally 10000); bind to `0.0.0.0` only in validated hosted mode, keep local binding unchanged, and check POST Origin against the configured HTTPS origin. Fail startup rather than fall back to local files if hosted storage is unavailable. |
| Build | `npx --yes pnpm@11.25.0 install --prod=false --frozen-lockfile --ignore-scripts && npx --yes pnpm@11.25.0 build` with `SKIP_INSTALL_DEPS=true` to use this explicit locked install. |
| Start | `node build/server/index.js` from the repository root; serve compiled frontend and API together. |
| Private configuration | Hosted database connection and session/admission secrets in server environment variables; `PAYPAL_ENVIRONMENT=sandbox` with Sandbox app credentials only. Leave Gemini disabled until the owner confirms the key's project is unbilled Free Tier and the global durable limit is implemented. Then use the existing `AI_PROVIDER=gemini`, `AI_MODEL=gemini-3.5-flash-lite`, `AI_ENABLED=true`, `AI_FREE_TIER_CONFIRMED=true`; keep the 20-attempt server cap. Never place Sandbox passwords or server secrets in client variables, Git, or recordings. |

The commands are derived from the current locked build and compiled entry point. The build was checked locally, not on Render/Linux. Network and runtime requirements: [Render Web Services](https://render.com/docs/web-services), [Node version](https://render.com/docs/node-version), [environment variables](https://render.com/docs/environment-variables).

### Free plan evidence

| Service | Documented limits and billing | Decision |
|---|---|---|
| Render Hobby + Free web instance | 750 running hours/workspace/month, 5 GB outbound and 500 Starter build minutes/month. Sleeps after 15 minutes idle; wake can take about a minute. Writes to the filesystem are lost on sleep, restart or redeploy. No fixed expiry stated for the web instance; no persistent disk on Free. Render documents a no-payment path; owner-specific eligibility/card status not verified. Without a payment method, exhausted allowance stops service or builds; a linked method can incur overages. | Do not deploy. If a card, paid tier or trial is required, or a no-card workspace is unavailable, use self-run. Render Free Postgres expires after 30 days; created now, it would expire before December 15. |
| Neon Free Postgres | Advertised as ongoing $0 with no card, 100 CU-hours/month, 1 GB storage and 5 GB monthly public transfer per project (aggregate storage cap 20 GB). Compute sleeps after five idle minutes. Compute/transfer exhaustion suspends compute until reset unless manually upgraded; storage exhaustion blocks writes. | Candidate durable store only. Neon specifically is optional; durable storage is required for this hosted design. No account/connection or live restart tested. If quotas or eligibility fail, use self-run; no paid upgrade or ephemeral fallback. |

Sources: [Render Free](https://render.com/docs/free), [first deploy](https://render.com/docs/your-first-deploy), [bandwidth](https://render.com/docs/outbound-bandwidth), [build minutes](https://render.com/docs/build-pipeline), [Neon pricing](https://neon.com/pricing), [Neon limits and upgrade behavior](https://neon.com/docs/introduction/plans). No signup, provisioning, deployment, billing changes, or Gemini/PayPal calls performed. Actual task spend: **$0.00**.

**Existing accounts:** The owner reports using Render and Neon for the separate Colli project. After a future explicit authorization, reuse the existing accounts only for a dedicated Chloro Free web service and, if needed, a dedicated Free database project. Before provisioning, verify combined Render workspace usage (including Colli), plan and payment-method configuration, and confirm the Neon project would be under Free rather than a paid plan. No account-specific usage or billing was inspected in this task. If Chloro could trigger charges, exhaust Colli's shared allowance, or require any Colli change, stop and use self-run. Do not modify, restart, redeploy, migrate, delete or reconfigure Colli, and never reuse its credentials, environment variables, storage or payment records.

## Verified local release evidence

Tested source commit: `fc003eda60d1feecc794619e40c92d32b68fd19c`. Its 37-file export had no credentials/private evidence. A frozen offline install reused all 98 packages with zero downloads and scripts disabled. Four focused payment checks plus two release-affected private-record checks passed; typecheck and build passed once. The built server started from that empty source copy, with disabled providers, zero inquiries/AI usage and a 404 for `/.env`. No live provider requests repeated. Candidate/index/history scans found no configured or recognized credential patterns; this is scoped heuristic evidence. See TRACKER.md for preservation hashes and final Git status.

## Owner publication/submission actions

The real source URL is the owner-created repository above. Remaining submission work needs a working public YouTube video under three minutes, Devpost project description/AI and PayPal usage/sandbox limitations, screenshots, and confirmed judge-access/support details. These actions are outside this GitHub-only authorization. Do not mark M6 or submission complete before all original requirements are satisfied.

The M5 source snapshot remains historical evidence. Owner-authorized M5.1 adds the second fictional food passport allowed by Foundation 04; its verification is recorded separately in TRACKER.md. The original M5 archive is not evidence of the M5.1 source. M6 source publication includes the completed M5.1 changes after exact-index/history review and scanning; no deployment is authorized. The locked deadline is November 12, 2026, 22:00 SAST; internal target November 11, 18:00 SAST; Foundation code-freeze cutoff remains November 10, 18:00 SAST. No unrelated feature/redesign work is authorized.
