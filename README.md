# Chloro — Built with PayPal

AI-assisted local commerce for travelers and two fictional demonstration merchant profiles: Chloro Craft Studio (bracelets) and Chloro Kota Counter (Food & Drink). **Discover → Inquire → Commit → Pay → Collect.** A traveler describes an item, Gemini translates/organizes the request, the selected merchant approves an exact offer, the traveler accepts and explicitly starts PayPal Sandbox checkout, and the server verifies capture before showing Paid and local collection instructions. Both profiles use **one Sandbox Business account**, not separate onboarded sellers or payouts.

This is an independent hackathon demonstration, not an official PayPal product. **Sandbox only. No real money. MIT licensed: [LICENSE](LICENSE).** See [TRACKER.md](TRACKER.md) for actual milestone evidence and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for dependency licenses.

Source repository: [Sizwe-the-Knight/Chloro-Hackathon](https://github.com/Sizwe-the-Knight/Chloro-Hackathon). Owner-authorized source publication is separate from hosting and hackathon submission.

## Windows setup

Requires **Node.js 24.x**, **pnpm 11.25.0**, Git (for source checkout/release checks), a modern browser, and network access to the npm registry, PayPal Sandbox and the Gemini API. No Docker, WSL, Codex trial, hosting or database account is needed to run the source. Source and the lockfile pin the tested dependencies.

From the downloaded/cloned project directory in PowerShell:

```powershell
pnpm install --frozen-lockfile --ignore-scripts
if (-not (Test-Path -LiteralPath '.env')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env'
}
```

Open `.env` in your local editor. Keep an existing file. Never paste secrets into chat, command lines, screenshots, public issues, Git or Devpost text. Public source intentionally contains **no working credentials, test-account passwords, private receipts or AI usage history**.

| Local variable | Required value / source |
|---|---|
| `PAYPAL_ENVIRONMENT` | `sandbox` only |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | Your Sandbox REST app linked to your Sandbox Business merchant |
| `AI_PROVIDER` | `gemini` |
| `AI_MODEL` | `gemini-3.5-flash-lite` only |
| `AI_API_KEY` | Your verified unbilled Gemini Free Tier project key |
| `AI_ENABLED`, `AI_FREE_TIER_CONFIRMED` | Set both to `true` only after confirming the key's project shows Free Tier / Set up billing, without billing linked |
| `AI_MAX_CALLS_PER_DAY` | `20`; server enforces a hard maximum of 20 attempted calls per SAST day |
| `PORT` | `3000`, or another unused local port |

The confirmation flag is an owner/operator attestation, not an API billing detector. If a signup asks for a card, billing activation or uncertain charges, **stop**. No paid fallback is permitted. The [judge-access guide](docs/JUDGE_ACCESS.md) explains the no-public-secrets approach.

Run development:

```powershell
pnpm dev
```

Or build and run the single-process app:

```powershell
pnpm typecheck
pnpm build
$env:NODE_ENV = 'production'
pnpm start
```

Open the printed localhost URL (normally `http://localhost:3000`). Stop the older app with Ctrl+C before restarting. Use **one process per local data directory**. The server binds to loopback; this source has not been hardened or configured for public hosting. A port conflict is an error, not a reason to delete payment data.

Without local credentials you can inspect the home/category/empty states; live AI and checkout correctly remain unavailable. A clean checkout has no paid fixtures. Do not mistake this for a broken install or expect the owner's saved records to appear.

## Run a fresh judge demonstration

1. **Discover:** Start in **Local Offerings**. Choose Goods & Crafts for fictional Chloro Craft Studio or Food & Drink for fictional Chloro Kota Counter. Both speak English and offer local collection only, subject to human approval. Saved Merchants reflects your local inquiry history. Categories are reversible filters, with no live inventory or availability claim.
2. **Inquire:** Enter a fictional request such as “A handmade blue nickel-free bracelet, 17 cm.” Destination is optional user-entered context, not a location lookup or a claim of merchant coverage. **Prepare my inquiry** carries the draft into the seeded merchant passport and constraint form; it makes no AI call. Enter your language, USD 40.00 budget and a **future** departure/latest collection time in SAST. Choose **Send inquiry to Gemini** once. Review the original, English translation, traveler-language summary and structured constraints. Missing/ambiguous details require clarification; no result is fabricated when AI is unavailable.
3. **Commit:** Open **Merchant Holdings** on the same page. This is a demo role switch, not an authenticated account. Accept for review or decline with a reason. Enter the exact item, USD 35.00, a **future ready time before departure**, fictional pickup location and local terms. Record any necessary human clarification and explicitly approve. Choose **Review as traveler**, review the exact offer, check acceptance and accept its version. No money moves at acceptance.
4. **Pay:** Choose **Start PayPal sandbox checkout**, then PayPal. Use your **Personal sandbox buyer**, not a real login. The backend creates a new order from that inquiry's server-owned accepted offer. Buyer approval alone is not Paid: the server must verify a COMPLETED capture, amount, currency and order/quote association. Record the confirmation once; do not charge again to revisit it.
5. **Collect:** Paid shows the agreed location, ready-by time, departure deadline and terms. In Merchant Holdings mark ready; return to traveler review for status. Each role can optionally record its own demo handover. These declarations are not independent proof of fulfillment.

To repeat, create a **new inquiry with future times**. Each has separate acceptance, payment and collection state. Never reset or overwrite the earlier M1/M3 records or usage counter. Historical fixed-date receipts can still be inspected; they are not reusable checkout templates. A complete live run normally consumes one AI attempt and one new sandbox purchase. Merely loading pages or refreshing saved status calls no model/payment provider.

### Food & Drink demonstration

Choose **Chloro Kota Counter** before submitting (the inquiry form also has an explicit merchant selector). For example: “Two vegetarian kotas, no chilli, total budget USD 20, for local collection before my departure.” Enter the actual future deadline separately in the form. Gemini organizes quantity/preferences and flags missing details; it cannot confirm ingredients, allergen safety, price or preparation time. The demo merchant reviews the original and interpretation, confirms the complete quantity/item description and human-agreed ingredients, enters an exact **total** price and ready-by time, and explicitly approves. Traveler acceptance, the same Sandbox checkout and collection controls follow the five steps above. Food is local pickup only, with no delivery, menu inventory or real vendor onboarding. USD examples are illustrative, not published food prices or currency conversion.

M5.1 food-specific behavior was verified with mocked AI/payment responses and UI checks, **not a new live food inquiry or payment**. The shared Gemini/PayPal integration retains the previous real bracelet evidence. No third cooking-lesson profile or booking system is included; Foundation 04 caps this MVP at two demo passports.

## Integrations and boundaries

- React/Vite + TypeScript frontend; Express/Node backend; pnpm; local JSON persistence. Production serves frontend and API from one Node process.
- PayPal JavaScript SDK **v6**, authenticated with a browser-safe client ID; server-side OAuth and **Orders v2** create/capture. Secret stays on the server. Endpoints are hardcoded to Sandbox. Final price/currency come from the merchant-approved canonical offer, never browser-supplied amounts or Gemini output. Accepted terms are fingerprinted; edits require a new reviewed offer rather than silent changes. Duplicate/concurrent capture protection and persisted idempotency keys prevent reuse of a completed order.
- Gemini **3.5 Flash-Lite**, direct server-side REST with a JSON schema and runtime validation. AI extracts/translates; it does not price, promise stock/readiness, approve offers or pay. Requests are explicit, bounded to 2,000 message characters and bounded output, spaced at least five seconds apart, with one in flight and **20 attempts/day maximum** (SAST), including failures. Quota/provider/invalid-output failures pause calls for that day; no automatic retries, model switching or paid fallback.
- Seeded suggestions are simple bracelet/kota request-type presentation rules for the selected profile, not global search or live inventory lookup. Selection is fixed on submission; an existing inquiry is never silently reassigned. Server validates the seeded ID/name and fingerprints merchant identity with the accepted commercial terms. Older bracelet inquiries resolve their original merchant name without migration. Human review remains authoritative. USD/EUR/GBP are allowed offer currencies; **only USD has actual payment verification evidence**. ZAR can be a budget currency, with no exchange conversion implied.

## Persistence, restart and troubleshooting

Private `.env` and `local-data/` are ignored by Git and must stay local:

| File | Purpose |
|---|---|
| `local-data/purchase.json` | Original M1 seeded purchase; preserve if present |
| `local-data/inquiries.json` | Inquiries, immutable approved offers/acceptance, AI counter |
| `local-data/commerce.json` | New inquiry-specific payment/idempotency and collection records |

Records persist across normal restarts **on the same machine/filesystem**, not across ephemeral hosting. Keep private local backups. Do not run two writing app processes. An interrupted AI interpretation becomes an honest error on restart while its attempt remains counted. Pending, declined, failed or interrupted captures never show Paid and require manual inspection of the existing Sandbox order; restarting does not authorize another capture or reset its idempotency key. Corrupt JSON fails closed: preserve the file and restore a trusted backup rather than silently starting over.

If inquiry is disabled, check local configuration, eligibility and quota without activating billing. If the SDK fails, a manual reload/retry is available; do not repeat a possibly completed payment. If an offer/departure date passed, start a new inquiry with future times. Unsupported request-type/no-match states are intentional; neither profile promises stock. Form times are explicitly **Africa/Johannesburg (SAST, UTC+02:00)**.

## Validation and release

```powershell
pnpm test             # focused mocked legacy payment checks; no external calls
pnpm test:m2          # inquiry/approval checks
pnpm test:m3          # accepted-offer payment boundaries
pnpm test:m4          # mocked routes and isolated file-store restarts
pnpm test:m51         # two-profile selection, approval, payment protection and UI checks
pnpm release:check    # source/history credential-pattern and publication checks; requires Git
```

Tests use mocked providers; they do not prove a new live transaction. Private receipts are optional integrity evidence, never a test prerequisite. Release work uses only changed/necessary checks plus typecheck/build, not repeated live calls. The release checker compares against locally configured credential values and common patterns without printing them; heuristic scanning is not a universal guarantee against every unknown secret.

See [release and hosting assessment](docs/RELEASE_READINESS.md). The owner created the public repository above and authorized source publication in M6; publication evidence is in TRACKER.md. No hosted app URL is provided. Deployment remains unauthorized. Remaining submission work includes a public YouTube demo under three minutes, Devpost description/screenshots/submission and confirmed usable access through December 15. Official deadline **November 12, 2026, 22:00 SAST**; internal target **November 11, 18:00 SAST**.

## License and attribution

Chloro source: **MIT**, copyright 2026 Sizwe-the-Knight. Dependency notices are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). The leaf/category artwork uses original CSS/text; no downloaded photos, custom font files, music or stock artwork are bundled. PayPal's official button is supplied by its SDK; no replacement PayPal logo is shipped. PayPal and Gemini names identify integrations and do not imply sponsorship or identity verification.

## Official references

- [Hackathon rules and local-run option](https://paypalaihackathon.devpost.com/rules)
- [PayPal sandbox accounts](https://developer.paypal.com/sandbox-testing/accounts)
- [PayPal SDK v6](https://developer.paypal.com/sdk/js/set-up/)
- [PayPal Orders v2](https://developer.paypal.com/api/orders/v2/)
- [Gemini model](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite)
- [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing) and [billing](https://ai.google.dev/gemini-api/docs/billing)

Locked project instructions remain [FOUNDATIONS.md](FOUNDATIONS.md) and [AGENTS.md](AGENTS.md).
