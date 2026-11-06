# Judge access — $0 local-run plan

Run Chloro on your own computer with PayPal Sandbox and eligible unbilled Gemini Free Tier credentials. The official rules allow a working self-run build with complete instructions. [Official rules](https://paypalaihackathon.devpost.com/rules)

## Start with a clean copy

Clone [the public repository](https://github.com/Sizwe-the-Knight/Chloro-Hackathon) or extract its source ZIP into a new folder. In PowerShell, open that folder, install the locked dependencies with Node.js 24.x and pnpm 11.25.0, then copy `.env.example` to `.env` as shown in [Windows setup](../README.md#windows-setup). This copy starts with empty inquiry history and its own local data. Preserve any older copy and its receipts.

## Obtain your own test credentials

### PayPal Sandbox

1. Sign in to the PayPal Developer Dashboard. Under **Testing Tools → Sandbox Accounts**, locate a **Business** test account for the seller and a separate **Personal** test account for the buyer. Use the default accounts if available. Otherwise choose **Create account** and select the required test account type. [Developer Dashboard](https://developer.paypal.com/dashboard/) · [Sandbox accounts](https://developer.paypal.com/sandbox-testing/accounts)
2. In **Apps & Credentials**, select **Sandbox**. Open a Sandbox REST app for the Business test account or choose **Create App** and associate it with that account. In your local `.env`, set `PAYPAL_ENVIRONMENT=sandbox` and fill in `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` from that app. [PayPal REST setup](https://developer.paypal.com/api/get-started/)
3. Use the Personal test email shown in **Sandbox Accounts** and its test password. If you need a password, open **View/Edit account → Login Info → Change password** for that test account. Use those credentials only in the PayPal Sandbox popup, where payment uses simulated funds. Keep the buyer login out of `.env`, Git, screenshots and the recording. [Sandbox login and password instructions](https://developer.paypal.com/sandbox-testing/accounts)

### Gemini Free Tier

1. Sign in to Google AI Studio and open **Projects**. Choose an eligible project on the **Free Tier** with billing unlinked. **Set up billing** indicates billing is unlinked. Leave that action untouched. Check that standard `gemini-3.5-flash-lite` input and output are available at no charge for your project and that quota is available. [AI Studio Projects](https://aistudio.google.com/projects) · [Billing](https://ai.google.dev/gemini-api/docs/billing) · [Model pricing](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-flash-lite)
2. Open **API keys** and use the key for that project or select **Create API key** and choose the same project. Keep it in your local `.env` as `AI_API_KEY`. Set `AI_PROVIDER=gemini`, `AI_MODEL=gemini-3.5-flash-lite`, `AI_ENABLED=true` and `AI_FREE_TIER_CONFIRMED=true` after the eligibility check. If setup requires payment, a card, or uncertain billing, stop and use the access fallback below. [Create or view an API key](https://aistudio.google.com/apikey) · [Key setup](https://ai.google.dev/gemini-api/docs/api-key)

## Run and evaluate

From the project directory run `pnpm dev`. Open the printed address, typically `http://localhost:3000`, in a browser on the same computer. **This is your local address.** Chloro has no public hosted URL. Restart the process after editing `.env` and run one process per local data directory. **Merchant Holdings** shows **No inquiries yet** on a clean start.

1. **Traveler.** Select Kota Counter (English and isiZulu) or Craft Studio (English and Spanish) from **Local Offerings**. Submit an English inquiry with a budget and future pickup deadline. Compare the original and the translation.
2. **Merchant.** Open **Merchant Holdings** and select the saved inquiry. Choose **Accept inquiry for review**, or enter a reason and choose **Decline inquiry**. To continue, resolve any flagged details and approve an offer with the exact price and currency, ready-by time, pickup point and collection terms. An optional reply translated to English is separate from the offer.
3. **Traveler.** Choose **Review as traveler** and accept the exact offer. Start PayPal Sandbox checkout, sign in as the Personal Sandbox buyer and approve the test purchase. Wait for Chloro to show a verified Sandbox capture.
4. **Both roles.** Mark the paid order ready in Merchant Holdings. Record the merchant handover there and the traveler collection in the traveler view. Both controls simulate a local handoff. [Sample inputs and full walkthrough](../README.md#run-a-fresh-judge-demonstration)

Use future SAST dates and keep receipts private. Inquiry and reply requests share a 20-attempt SAST-day cap. If a provider fails or the app pauses requests, follow its status message and keep your local data. The two fictional profiles share one PayPal Sandbox Business account. The demo has no real merchant onboarding, production payments or international shipping. The role switch shares local state without separate sign-ins, which is why judging uses a local copy.

## What was verified

- **Live evidence.** The Kota Counter English-to-isiZulu inquiry returned **Gemini HTTP 200 OK** on November 6, 2026. The saved Kota purchase shows approval and acceptance, a verified Sandbox capture and both simulated handoff entries. The earlier Craft Studio flow verified a Spanish traveler inquiry translated to English and a Sandbox capture.
- **Mocked evidence only.** The implemented Craft Studio English-to-Spanish inquiry and both merchant reply translations to English. [Milestone evidence](../TRACKER.md)

## Judge support through December 21, 2026

The owner will monitor GitHub Issues through **December 21, 2026**. For setup help, share your operating system, Node and pnpm versions, the step that failed and a redacted error. Keep `.env`, keys, passwords, receipts and recording files off public channels. [Chloro support](https://github.com/Sizwe-the-Knight/Chloro-Hackathon/issues)

If you cannot obtain eligible no-cost provider access, stop setup before enabling billing or entering payment information. Use the same Issues channel to request setup assistance or an owner-assisted walkthrough. You can still inspect the local UI without credentials. Live access depends on the evaluator's provider eligibility and available quota.
