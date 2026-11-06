# Chloro — Find something local.

**Your words. A human agreement. Powered by AI and PayPal.**

You're visiting South Africa. You have a limited budget, you're leaving tomorrow, and you want to buy something from a local small business. Maybe it's a handmade bracelet or two kotas from a neighborhood food vendor. You know what you'd like. The harder part is explaining it, agreeing on a price and finding out whether you can collect it before you leave.

Chloro was created to make that conversation easier. Its name comes from chlorophyll and the idea of making purposeful use of what's available. A traveler has time and a budget. A merchant has skills and a chance to serve someone new. Chloro helps them make use of that opportunity.

[Run Chloro yourself](#run-chloro-yourself) · [Milestone evidence](TRACKER.md) · [MIT license](LICENSE) · [GitHub Issues](https://github.com/Sizwe-the-Knight/Chloro-Hackathon/issues)

## How Chloro works

**Discover → Inquire → Commit → Pay → Collect**

1. **Discover.** Browse the demo offerings in Food & Drink or Goods & Crafts.
2. **Inquire.** Describe what you want, your budget and when you need to collect it. Google Gemini translates the request and organizes the details for the merchant. Both people can review the original text.
3. **Commit.** The merchant can ask for clarification, decline the request or approve an exact offer with a price, pickup point and ready time within the traveler's collection deadline. The traveler decides whether to accept it.
4. **Pay.** After accepting the offer, the traveler authorizes a PayPal Sandbox payment. Chloro checks the capture before showing **Paid**.
5. **Collect.** The merchant marks the purchase ready. Both sides can record their part of the simulated local handoff.

Gemini helps people understand each other. The merchant controls price, availability and pickup terms, and the traveler decides whether to proceed. PayPal Sandbox handles the test payment.

## Meet the demonstration merchants

### Chloro Kota Counter · Food & Drink

This fictional South African street-food vendor can review an English request for two kotas in isiZulu. The live Gemini inquiry returned HTTP 200 OK with an isiZulu translation and structured details. The saved Kota purchase shows a verified PayPal Sandbox capture and both simulated handoff entries.

### Chloro Craft Studio · Goods & Crafts

This fictional maker takes handmade bracelet requests. An earlier Spanish-to-English traveler inquiry and Sandbox purchase were verified live. The newer English-to-Spanish inquiry and both merchants' translated reply flows have mocked verification only.

## Why it matters

An independent merchant can make something a traveler wants without having an online catalog for every variation. A traveler can ask for a custom order and learn whether it fits their budget and schedule. With the original request and the agreed terms in one place, both people have something clear to review before checkout.

## Built for the PayPal AI Hackathon 2026

Chloro was created for *Build What's Next with PayPal and AI*. Its combination of AI-assisted communication, human approval and PayPal Sandbox checkout is relevant to the **Best Use of PayPal + AI** and **Best Use of Agentic Commerce** honorable mentions. [Official hackathon rules](https://paypalaihackathon.devpost.com/rules)

## Watch the demonstration

**YouTube demo link pending publication.** The demonstration will show the Kota inquiry, the agreed offer, the verified Sandbox payment and the simulated handoff.

## Run Chloro yourself

Judges can follow the [Judge Access Guide](docs/JUDGE_ACCESS.md) to install and run Chloro on their own computers. A fresh copy starts with empty inquiry history. Live AI and checkout require your own eligible Gemini Free Tier and PayPal Sandbox credentials. The owner will monitor [GitHub Issues](https://github.com/Sizwe-the-Knight/Chloro-Hackathon/issues) through December 21, 2026.

## Scope and limitations

Chloro is an independent, open-source hackathon prototype. Both fictional merchant profiles share one PayPal Sandbox Business account and use simulated funds. The demo runs locally, with simulated local pickup and handoff. It has no real merchant onboarding, production payments, international shipping or live inventory. Merchants must confirm availability and food ingredients.

[Third-party notices](THIRD_PARTY_NOTICES.md)
