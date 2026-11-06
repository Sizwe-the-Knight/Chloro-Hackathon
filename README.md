# Chloro — Built with PayPal

AI-assisted local commerce for travelers and two fictional demonstration merchant profiles: Chloro Craft Studio (bracelets) and Chloro Kota Counter (Food & Drink). **Discover → Inquire → Commit → Pay → Collect.** A traveler describes an item, Gemini translates/organizes the request, the selected merchant approves an exact offer, the traveler accepts and explicitly starts PayPal Sandbox checkout, and the server verifies capture before showing Paid and local collection instructions. Both profiles use **one Sandbox Business account**, not separate onboarded sellers or payouts.

This is an independent hackathon demonstration, not an official PayPal product. **Sandbox only. No real money. MIT licensed: [LICENSE](LICENSE).** See [TRACKER.md](TRACKER.md) for actual milestone evidence and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for dependency licenses.

Judges run Chloro on their own computers. Start with [Windows setup](#windows-setup) and the [judge access guide](docs/JUDGE_ACCESS.md) for test credentials, a walkthrough and support through December 21, 2026.

## Windows setup

Requires **Node.js 24.x** (tested with 24.21.0), **pnpm 11.25.0**, a modern browser and network access to the npm registry, PayPal Sandbox and the Gemini API. Use Git to clone the repository, or download its source ZIP. If pnpm is missing, install it with `npm install --global pnpm@11.25.0`. The lockfile pins the tested dependencies.

Clone the public repository and open the project directory in PowerShell. If you downloaded the source ZIP, extract it and open the extracted project directory instead.

```powershell
git clone https://github.com/Sizwe-the-Knight/Chloro-Hackathon.git
Set-Location Chloro-Hackathon
```

Install the locked dependencies and create your local configuration.

```powershell
pnpm install --prod=false --frozen-lockfile --ignore-scripts
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

The Free Tier flag records your own verification. If setup requires a card, billing activation or uncertain charges, stop and use the access procedure in the judge guide. It walks through obtaining a Gemini key, a Sandbox REST app and a separate Sandbox buyer. [Judge access and credentials](docs/JUDGE_ACCESS.md#obtain-your-own-test-credentials)

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

Open the printed URL (normally `http://localhost:3000`) on the computer where you started Chloro. **Localhost refers to your own computer.** Public hosting is deferred because the demonstration shares local session state and relies on local files for payment checkpoints. Stop the app with Ctrl+C before restarting and use one process per local data directory.

Start from a fresh checkout or newly extracted source directory to get an empty inquiry history. Open **Merchant Holdings** to see **No inquiries yet.** The owner's recordings, receipts and local data are separate from the public source. You can inspect the UI before configuring credentials. Live inquiry and checkout require your own eligible test credentials.

## Run a fresh judge demonstration

1. **Discover.** In **Local Offerings**, choose **Food & Drink → Chloro Kota Counter → View merchant & inquire**. To try the bracelet path, choose **Goods & Crafts → Chloro Craft Studio**.
2. **Inquire.** For Kota Counter, enter “Could you prepare two vegetarian kotas without chilli for pickup before 13:00 tomorrow?” Choose English, a USD 20.00 spending limit and 13:00 tomorrow for latest collection in SAST. Select **Send inquiry to Gemini** once. **Original request & structured AI interpretation** shows the original English, isiZulu translation and extracted requirements. For Craft Studio, try “Could you make a blue nickel-free bracelet, 17 cm, for pickup before 16:00 tomorrow?” with a USD 40.00 budget and a 16:00 deadline. New Craft Studio inquiries translate into Spanish.
3. **Commit.** Open **Merchant Holdings**, select the request under **Saved inquiry**, and choose **Accept inquiry for review**. To decline instead, enter a reason and select **Decline inquiry**. Resolve any flagged details before approval. For an optional translated reply, write in the merchant's language and select **Translate reply to English**. Enter the exact offer separately, for example two kotas for USD 12.00 or one bracelet for USD 35.00, ready at noon tomorrow, with a fictional pickup point and terms. Check merchant approval and select **Approve final offer**. Choose **Review as traveler**, confirm the exact terms and select **Accept merchant offer**.
4. **Pay.** Choose **Start PayPal sandbox checkout**, then the PayPal button. Check that PayPal opens in Sandbox and sign in with your separate **Personal Sandbox buyer**. Approve the displayed USD amount using the simulated account balance. Chloro shows **Paid · Sandbox capture verified** after server verification of the completed capture, amount, currency and order association. If payment needs review, inspect the existing Sandbox order before trying again.
5. **Collect.** After Paid, open **Merchant Holdings**, select **Mark ready for collection** and use **Record merchant handover (demo)**. Choose **Review as traveler** to see the agreed pickup point, ready time and terms, then select **Record traveler collection (demo)**. Chloro shows both sides recorded. This is a simulated handoff using two local demo roles.

To repeat, create a **new inquiry with future times** and keep any prior records. A live run uses one inquiry attempt and one new Sandbox purchase. An optional reply translation uses a second AI attempt after the five-second minimum interval. Loading or refreshing the app does not call the providers.

### Verification evidence

- **Kota Counter.** English-to-isiZulu inquiry translation and structured extraction passed live verification. The owner recorded the Kota flow. The saved record shows merchant approval, traveler acceptance, a verified Sandbox capture and both sides of the simulated handoff. Ingredient safety requires human confirmation.
- **Craft Studio.** An earlier live Spanish traveler inquiry translated into English and led to a verified USD 35.00 Sandbox capture. New English-to-Spanish inquiries and Spanish-to-English merchant replies have mocked verification. Kota Counter's isiZulu-to-English merchant replies also have mocked verification. Saved inquiries retain their original language configuration.

## Integrations and boundaries

- React/Vite + TypeScript frontend; Express/Node backend; pnpm; local JSON persistence. Production serves frontend and API from one Node process.
- PayPal JavaScript SDK **v6**, authenticated with a browser-safe client ID; server-side OAuth and **Orders v2** create/capture. Secret stays on the server. Endpoints are hardcoded to Sandbox. Final price/currency come from the merchant-approved canonical offer, never browser-supplied amounts or Gemini output. Accepted terms are fingerprinted; edits require a new reviewed offer rather than silent changes. Duplicate/concurrent capture protection and persisted idempotency keys prevent reuse of a completed order.
- Gemini **3.5 Flash-Lite** uses server-side REST with a JSON schema and runtime validation. New inquiries use the selected profile's language for the translation and extracted constraints. The traveler language field controls the inquiry summary. An explicit reply request saves the merchant's original text and its English translation separately from the offer. The merchant controls price, availability, readiness and approval. Both request types share the existing **20 attempts/day maximum** (SAST), including failures, with one in flight and a five-second minimum interval. Quota, provider and invalid-output failures pause calls for that day.
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

For setup or provider eligibility issues through December 21, 2026, use [the judge support instructions](docs/JUDGE_ACCESS.md#judge-support-through-december-21-2026).

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
