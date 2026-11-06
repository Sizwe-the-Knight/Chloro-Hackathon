# Judge access — $0 local-run guide

Run Chloro on your own computer using your own PayPal Sandbox and eligible unbilled Gemini Free Tier credentials. The official rules allow a working self-run build with complete instructions. [Official rules](https://paypalaihackathon.devpost.com/rules)

## Windows setup

You need **Node.js 24.x** (tested with 24.21.0), **pnpm 11.25.0**, a modern browser and network access to the npm registry, PayPal Sandbox and the Gemini API. Install pnpm with `npm install --global pnpm@11.25.0` if it is missing. Use Git to clone the public repository. If you download the source ZIP instead, extract it into a new folder and open that folder in PowerShell. A fresh copy starts with empty inquiry history and does not include the owner's credentials, payment records, recordings or AI usage history.

```powershell
git clone https://github.com/Sizwe-the-Knight/Chloro-Hackathon.git
Set-Location Chloro-Hackathon
```

In the project directory, install the locked dependencies and create a local configuration file. Preserve an existing `.env` if present.

```powershell
pnpm install --prod=false --frozen-lockfile --ignore-scripts
if (-not (Test-Path -LiteralPath '.env')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env'
}
```

Edit `.env` in a local editor. Keep keys, passwords and the contents of `.env` out of Git, command lines, chat, screenshots, videos, public issues and Devpost. Use fictional details for the demo.

## Obtain your own test credentials

### PayPal Sandbox

1. Sign in to the PayPal Developer Dashboard. Under **Testing Tools → Sandbox Accounts**, locate a **Business** test account for the seller and a separate **Personal** test account for the buyer. Use the defaults if available, or choose **Create account** and select the required account type. [Developer Dashboard](https://developer.paypal.com/dashboard/) · [Sandbox accounts](https://developer.paypal.com/sandbox-testing/accounts)
2. In **Apps & Credentials**, select **Sandbox**. Open a Sandbox REST app for the Business test account or choose **Create App** and associate it with that account. Use the app's client ID and secret in the settings below. [PayPal REST setup](https://developer.paypal.com/api/get-started/)
3. Use the Personal test account's email and test password only in the PayPal Sandbox popup. To set a test password, use **View/Edit account → Login Info → Change password**. Keep the buyer login out of `.env` and any shared material. [Sandbox login instructions](https://developer.paypal.com/sandbox-testing/accounts)

### Gemini Free Tier

1. In Google AI Studio, open **Projects** and choose an eligible **Free Tier** project with billing unlinked. **Set up billing** indicates billing is unlinked. Leave it that way. Confirm that standard `gemini-3.5-flash-lite` input and output are free for your project and that quota is available. [AI Studio Projects](https://aistudio.google.com/projects) · [Billing](https://ai.google.dev/gemini-api/docs/billing) · [Model pricing](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-flash-lite)
2. In **API keys**, select or create a key for that same project. Store it only in your local `.env`. If setup asks for a card, requires billing activation or leaves costs uncertain, stop and use the [judge support instructions](#judge-support-through-december-21-2026). [AI Studio API keys](https://aistudio.google.com/apikey) · [Key setup](https://ai.google.dev/gemini-api/docs/api-key)

### Local settings

| Variable | Value |
|---|---|
| `PAYPAL_ENVIRONMENT` | `sandbox` only |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | Your Sandbox REST app's client ID and secret |
| `AI_PROVIDER` | `gemini` |
| `AI_MODEL` | `gemini-3.5-flash-lite` only |
| `AI_API_KEY` | Key for your verified unbilled Gemini Free Tier project |
| `AI_ENABLED`, `AI_FREE_TIER_CONFIRMED` | Set both to `true` only after confirming the Free Tier and billing status above. The confirmation flag records your own check. |
| `AI_MAX_CALLS_PER_DAY` | `20`. The server enforces a hard cap of 20 attempts per SAST day, including failures. |
| `PORT` | `3000`, or another unused local port |

## Start the app

For a development run, use this command from the project directory.

```powershell
pnpm dev
```

For a compiled single-process run, use these commands in a separate PowerShell session after stopping the development server.

```powershell
pnpm typecheck
pnpm build
$env:NODE_ENV = 'production'
pnpm start
```

Open the printed address, usually `http://localhost:3000`, on the same computer. Chloro binds locally. Stop it with Ctrl+C before restarting after an `.env` edit. Run one app process per local data directory. On a clean start, **Merchant Holdings** shows **No inquiries yet**. The UI can be inspected without credentials. Live Gemini and Sandbox checkout require the test accounts configured above.

## Run a fresh judge demonstration

Use future dates in **Africa/Johannesburg (SAST, UTC+02:00)**. Try either fictional profile. The example offer amounts below are for the demo.

| Profile | Sample English inquiry | Spending limit and deadline | Example merchant offer |
|---|---|---|---|
| Chloro Kota Counter | Could you prepare two vegetarian kotas without chilli for pickup before 13:00 tomorrow? | USD 20.00, tomorrow at 13:00 SAST | Two kotas for USD 12.00, ready at noon tomorrow |
| Chloro Craft Studio | Could you make a blue nickel-free bracelet, 17 cm, for pickup before 16:00 tomorrow? | USD 40.00, tomorrow at 16:00 SAST | One bracelet for USD 35.00, ready at noon tomorrow |

1. **Discover.** In **Local Offerings**, choose **Food & Drink → Chloro Kota Counter** or **Goods & Crafts → Chloro Craft Studio**, then select **View merchant & inquire**.
2. **Inquire.** Enter the example or your own fictional request, choose English, set the spending limit and future collection deadline, then select **Send inquiry to Gemini** once. Compare the original with the isiZulu or Spanish translation in **Original request & structured AI interpretation**.
3. **Commit.** In **Merchant Holdings**, select the request under **Saved inquiry**. Choose **Accept inquiry for review** or enter a reason and select **Decline inquiry**. To proceed, resolve any flagged details with the traveler. You can write an optional reply in the merchant's language and select **Translate reply to English**. Enter the exact item, quantity, total, currency, future ready time, fictional pickup point and terms in the offer form. Check merchant approval and select **Approve final offer**. Choose **Review as traveler**, confirm the exact terms and select **Accept merchant offer**.
4. **Pay.** Select **Start PayPal sandbox checkout**, then the PayPal button. Confirm PayPal opens in Sandbox. Sign in with the separate **Personal Sandbox buyer** and approve the displayed amount using simulated funds. Chloro shows **Paid · Sandbox capture verified** after checking the completed capture, amount, currency and order association.
5. **Collect.** In **Merchant Holdings**, select **Mark ready for collection** and **Record merchant handover (demo)**. Choose **Review as traveler** to see the pickup terms and select **Record traveler collection (demo)**. Chloro shows both simulated handoff entries.

To repeat, start a new inquiry with future times and preserve earlier records. The inquiry uses one Gemini attempt. An optional reply translation uses another after a five-second minimum interval. Loading or refreshing the app does not call Gemini or PayPal.

### What was verified

- **Live.** The Kota Counter English-to-isiZulu inquiry returned Gemini HTTP 200 OK on November 6, 2026. The saved Kota record shows the approved and accepted offer, a verified Sandbox capture and both simulated handoff entries. Earlier Craft Studio evidence includes a Spanish-to-English traveler inquiry and a verified USD 35.00 Sandbox capture.
- **Mocked only.** The newer Craft Studio English-to-Spanish inquiry and both merchant reply translations into English. [Milestone evidence](../TRACKER.md)

## Safety, persistence and troubleshooting

Chloro uses React, Vite and TypeScript with an Express backend and local JSON storage. The compiled build serves the frontend and API from one Node process.

- Both fictional profiles share one PayPal Sandbox Business account. The two roles share local state without separate sign-ins, so the build is for self-run use on one machine. There is no real merchant onboarding, production checkout, international shipping or live inventory. Confirm stock, food ingredients and readiness with the merchant.
- PayPal JavaScript SDK v6 uses a browser-safe client ID. The secret stays server-side. The server uses Sandbox OAuth and Orders v2. It fingerprints the approved offer and uses its exact amount and currency. Changed terms require a new reviewed offer. Persisted idempotency keys and duplicate-capture protection keep completed orders from being reused. USD, EUR and GBP are allowed offer currencies. Payment verification evidence covers USD. ZAR is available for the traveler budget without exchange conversion. [PayPal SDK v6](https://developer.paypal.com/sdk/js/set-up/) · [Orders v2](https://developer.paypal.com/api/orders/v2/)
- Gemini 3.5 Flash-Lite uses server-side structured output with runtime validation. The inquiry translation uses the selected profile's language, and the traveler language controls the summary. Replies are saved separately from the approved offer. Inquiry and reply calls share a 20-attempt cap with one call in flight and a five-second minimum interval. Provider, quota or invalid-output errors pause calls for the SAST day. The app does not retry automatically or fall back to a paid provider. If AI is disabled, check eligibility, settings and quota without activating billing. An interrupted attempt still counts and shows an error after restart.
- **Payment needs review.** Pending, declined, failed or interrupted captures do not show Paid. Check the existing Sandbox order before another attempt. Restarting does not authorize another capture or reset its idempotency key. If SDK loading fails, a manual reload is available. Keep existing payment state if the outcome is uncertain.
- **Expired offer or no match.** Start a fresh inquiry with future times after a deadline expires. The seeded matches are simple rules for bracelet and kota requests. The server validates the selected demo profile and includes its identity in the approved offer fingerprint. A submitted inquiry stays with that profile, and saved inquiries retain their original language.
- **Restart or port conflict.** Stop the older process or set `PORT` to another unused port. Preserve existing records. State survives normal restarts on the same filesystem. The app stops if JSON is corrupt. Keep the file and restore a trusted private backup. [Hosting and release assessment](RELEASE_READINESS.md)

Private `.env` and `local-data/` are ignored by Git. Keep local backups private.

| Local file | Purpose |
|---|---|
| `local-data/purchase.json` | Original seeded Sandbox purchase, if present |
| `local-data/inquiries.json` | Inquiries, approved offers, acceptance and Gemini usage |
| `local-data/commerce.json` | Inquiry-specific payment, idempotency and collection state |

## Optional local verification

These checks are optional for judging. The test suites use mocked providers. The release scan requires a Git checkout and checks configured values and recognized credential patterns without printing secrets. Private receipts are optional evidence and are never required for tests.

```powershell
pnpm test             # legacy payment checks
pnpm test:m2          # inquiry and approval checks
pnpm test:m3          # accepted-offer payment boundaries
pnpm test:m4          # mocked routes and file-store restarts
pnpm test:m51         # two-profile selection, approval, payment and UI checks
pnpm release:check    # targeted source and Git-history publication scan
```

## Judge support through December 21, 2026

The owner will monitor GitHub Issues through **December 21, 2026**. For setup help, share your OS, Node and pnpm versions, the step that failed and a redacted error. Keep credentials, private receipts and recordings off public channels. [Chloro support](https://github.com/Sizwe-the-Knight/Chloro-Hackathon/issues)

If you cannot obtain eligible no-cost access, stop before enabling billing or entering payment information. You can inspect the local UI without credentials or request help with a no-cost walkthrough through the same channel. Live access depends on your provider eligibility and available quota.
