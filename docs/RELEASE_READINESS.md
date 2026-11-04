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

## Verified local release evidence

Tested source commit: `fc003eda60d1feecc794619e40c92d32b68fd19c`. Its 37-file export had no credentials/private evidence. A frozen offline install reused all 98 packages with zero downloads and scripts disabled. Four focused payment checks plus two release-affected private-record checks passed; typecheck and build passed once. The built server started from that empty source copy, with disabled providers, zero inquiries/AI usage and a 404 for `/.env`. No live provider requests repeated. Candidate/index/history scans found no configured or recognized credential patterns; this is scoped heuristic evidence. See TRACKER.md for preservation hashes and final Git status.

## Owner publication/submission actions

The real source URL is the owner-created repository above. Remaining submission work needs a working public YouTube video under three minutes, Devpost project description/AI and PayPal usage/sandbox limitations, screenshots, and confirmed judge-access/support details. These actions are outside this GitHub-only authorization. Do not mark M6 or submission complete before all original requirements are satisfied.

The M5 source snapshot remains historical evidence. Owner-authorized M5.1 adds the second fictional food passport allowed by Foundation 04; its verification is recorded separately in TRACKER.md. The original M5 archive is not evidence of the M5.1 source. M6 source publication includes the completed M5.1 changes after exact-index/history review and scanning; no deployment is authorized. The locked deadline is November 12, 2026, 22:00 SAST; internal target November 11, 18:00 SAST; Foundation code-freeze cutoff remains November 10, 18:00 SAST. No unrelated feature/redesign work is authorized.
