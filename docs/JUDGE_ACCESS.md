# Judge access — $0 local-run plan

The recommended plan is a fresh local source checkout with judge/operator-owned Sandbox and unbilled Free Tier credentials. It does not depend on the owner's development trial, a public server, shared production credentials or an old paid order. [Official rules permit complete setup/run instructions in place of hosting](https://paypalaihackathon.devpost.com/rules).

1. Follow README installation and `.env.example`. Public source deliberately excludes `.env`, local receipts, counters and passwords.
2. Operator signs in to their own PayPal Developer Dashboard and uses a Sandbox Business account/REST application plus a different Personal sandbox buyer. Keep client secret and buyer login private and local. No live processing or owner-account settings changes.
3. Operator uses a Gemini key from their own eligible project that explicitly shows Free Tier / Set up billing with no billing attached. Confirm model `gemini-3.5-flash-lite` and free standard input/output access. Set the two local enable/confirmation flags only then. If any card, payment, ineligible region or unknown billing is involved, stop and request an owner-assisted demonstration; do not activate billing or substitute a paid provider.
4. Start one localhost app. Create a fresh fictional inquiry, with a future ready/departure schedule. Follow traveler → merchant → traveler approval/payment → collection in README. Use USD for the previously verified payment path. New inquiries/orders leave earlier records intact. Both demo roles are on the same machine; no merchant onboarding or account is needed.
5. Save any new receipts privately. Viewing existing records requires no repeated AI inference or capture. The 20/day cap is per local app data store; it is not a shared global quota and does not override provider limits. Do not reset it to evade limits.

## Access limitations to state in the submission

- The live integration requires eligible free API access and Sandbox accounts, not merely running the static UI. Without keys, only inspection/empty states work; do not label that a complete live demonstration.
- The repository contains no pre-approved keys or account passwords. Judges must be told these prerequisites before testing. If judges cannot obtain free access, the owner must arrange an existing no-cost private walkthrough/channel and personally operate the eligible local credentials. No key distribution, invitation or external message has been sent by Codex.
- Keep source runnable, valid demo access instructions and an operator available through **December 15, 2026**. Use fresh future pickup dates during that period. Free model availability/limits can change; stop gracefully rather than billing. No claim that access has already been tested from a judge's account.
- Never put production credentials, a shared owner AI key, developer passwords or complete `.env` in GitHub/YouTube/Devpost. Any exceptional private sharing of test-only access needs separate owner approval and a suitable private channel. This release does not implement public authentication or protect a hosted shared-key endpoint.

## Owner actions before submission

Approve public source publication separately; confirm the self-run prerequisites and support contact/private walkthrough procedure in the submission; ensure the chosen Sandbox and Free Tier access remains usable through judging; record and publish the actual working under-three-minute demo only under the appropriate later authorization. Hosted access is optional, not silently assumed.
