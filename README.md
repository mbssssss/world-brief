# World Brief — Multi‑Source Bullets (Politics, Markets, IG)

A home‑screenable web app that aggregates bullet‑point updates from:
- **Newsdata.io** (politics/world/business) — optional
- **Any RSS feeds you choose** — optional
- **Instagram (Business Discovery)** for specific Business/Creator usernames — optional, official API only

Best deployed on **Vercel** (free) so the serverless function can fetch and normalize feeds.

## Quick Deploy (Vercel)
1. Create a Vercel account and import this folder as a new project.
2. In **Project → Settings → Environment Variables**, add any of the following:
   - `NEWSDATA_API_KEY` — from https://newsdata.io
   - `RSS_URLS` — comma‑separated RSS feed URLs (e.g. `https://www.cfr.org/rss,https://www.consilium.europa.eu/en/press/press-releases/rss.xml`)
   - `IG_ACCESS_TOKEN` — Instagram Graph API user access token (long‑lived)
   - `IG_BUSINESS_ACCOUNT_ID` — your Instagram Business Account ID (the *caller* account)
   - `IG_USERNAMES` — comma‑separated list of target IG **Business/Creator** usernames (e.g. `cfr_org,europeancommission,channelnewsasia`)
3. Deploy. Your app is live; open it on iPhone Safari → **Share** → **Add to Home Screen**.

## Notes on Instagram (official API only)
- This uses **Instagram Graph API Business Discovery**. You must have:
  - An **Instagram Business** (or Creator) account linked to a Facebook Page.
  - A Facebook App with the required permissions and **approved** for the endpoints you use.
  - The target accounts must be **Business/Creator** and public. Personal accounts won’t return data.
- If you can’t use Business Discovery, you can instead add RSS URLs generated from third‑party services (e.g., rss.app) to `RSS_URLS`. Respect those services’ terms.

## Customize sources
- Open the web app and use the toggles to include/exclude News APIs, RSS, or Instagram on the fly.
- Language and item limits are adjustable in the UI.

## Local dev
```bash
npm i
# Run a local test server (you can use any static server; Vercel CLI recommended)
# vercel dev   # if you have Vercel CLI installed
```

## License & Use
Personal use. Ensure you comply with each provider’s terms (Meta, publishers, APIs). This project is a template and comes with no warranties.
## Bonus: Spend the Windfall (game)
`windfall.html` is a standalone money game. Pick a fortune ($2M to $1B, or your own number), spend it on cars, homes, travel, fashion, watches, yachts, jets, art, giving and investments at approximate real-world prices, then fast-forward ten years to see your net worth, Lifestyle score and Legacy score. Open `/windfall.html` on the deployed site, or open the file directly in a browser.
