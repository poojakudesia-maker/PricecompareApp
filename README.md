# QuickHai

A PWA that compares grocery prices across Zepto, Blinkit, Amazon Now, BB Daily and Milkbasket. It doesn't sell anything: users see who's cheapest and tap through to that app.

## Run it

```bash
npm install
npm run dev          # API on :8787 and the web app on http://localhost:5173
```

In development no SMS is sent: the OTP appears on the login screen and in the server log.

Production (one Node process serves both the API and the built app):

```bash
cp .env.example .env   # fill AUTH_SECRET, MSG91_*, VITE_ADSENSE_*
npm run build
npm start              # http://localhost:8787
```

Node 22.18+ is required: the server is TypeScript run directly by Node, with no build step.

## User flow

1. Splash.
2. Login with an Indian mobile number (10 digits starting 6–9; `+91` and a leading `0` are stripped). A 6-digit OTP follows. The login token lasts 180 days, so users stay signed in.
3. One-time profile: name, Gmail address and pincode. Editable later from the avatar, which is also where Log out lives.
4. Search. Suggestions appear from the 3rd character. Typing a full product name and pressing search opens it directly; otherwise picking a suggestion does.
5. The product page shows the product photo and name, then every platform's price and availability. Tapping a platform opens its app if it's installed, otherwise its website.
6. Every 5th product comparison per user includes an AdSense unit.

## Server design

```
server/
  index.ts              routes, static hosting
  auth.ts               OTP send/verify, signed tokens, requireAuth
  sms.ts                console (dev) and MSG91 (prod) providers
  store.ts              JSON-file database (users, OTPs)
  catalog/              product catalogue and search ranking
  pricing/
    index.ts            fans out to all platforms, 2.5s timeout each, 5-min cache per product+pincode
    types.ts            PlatformAdapter interface
    adapters/mock.ts    sample prices (vary by pincode)
shared/                 types and platform config used by server and client
```

### API

All routes except `/api/auth/*` need `Authorization: Bearer <token>`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/otp` | `{phone}` → sends OTP. 30s resend cooldown, 5 per hour per number, 20 per hour per IP |
| POST | `/api/auth/verify` | `{phone, otp}` → `{token, user}`. 5 wrong tries invalidates the code; codes expire in 5 min |
| GET | `/api/me` | Current user |
| PUT | `/api/me/profile` | `{name, email, pincode}` |
| GET | `/api/suggest?q=` | Up to 7 matches (empty under 3 chars), plus `exactId` when `q` is a full product name |
| GET | `/api/trending` | Home screen tiles |
| GET | `/api/products/:id/compare` | Offers from every platform for the user's pincode; increments the search count and sets `showAd` on every 5th |

OTPs are stored hashed. Tokens are HMAC-SHA256 signed and verified with a constant-time compare.

### Getting real prices

Each platform is one adapter implementing `PlatformAdapter.fetchOffer(product, {pincode, signal})`. Swap the mock for a real one in `server/pricing/index.ts` and nothing else changes. A platform that times out or errors shows as "Couldn't check" instead of breaking the page.

None of these platforms publish a pricing API, so you need one of:

- **Affiliate or partner feeds.** Amazon has an affiliate programme (Amazon Now items live on amazon.in). This is the cleanest option where it exists.
- **A business agreement** with the platform for a catalogue/price feed.
- **Your own fetchers.** Possible technically, but check each platform's terms of service first; most prohibit automated scraping, and prices depend on the dark store serving that pincode, so you'd need location-aware requests.

The catalogue also needs a mapping from your product id to each platform's product id/URL (add it to `Product`) so "Open app" lands on the product rather than a search page.

### Scaling notes

- Replace `store.ts` with Postgres or SQLite when you run more than one server instance.
- Move the price cache to Redis for the same reason, and have a background job keep popular products warm so `fromPrice` in suggestions comes from real data.
- Put the API behind HTTPS (required for PWA install and WebOTP anyway).

## Opening the platform's app

`src/lib/openApp.ts`:

- **Android:** an `intent://` link naming the app's package (`com.zeptoconsumerapp`, `com.grofers.customerapp`, `in.amazon.mShop.android.shopping`, `com.raincan.android.hybrid` for BB Daily, `com.milkbasket.app`). Chrome opens the app if installed and falls back to the website otherwise. Zepto, Blinkit and Amazon get the product/search URL; BB Daily and Milkbasket have no public product links, so their apps open on the home screen (or the Play Store if not installed).
- **iOS:** a plain https link. Apps that register Universal Links for that domain open directly; otherwise Safari shows the page.

## SMS (production)

India requires DLT-registered templates for OTP SMS. Register a template with MSG91 containing `##OTP##`, then set `SMS_PROVIDER=msg91`, `MSG91_AUTH_KEY` and `MSG91_TEMPLATE_ID`. The MSG91 call in `server/sms.ts` hasn't been run against a live account yet, so test it before launch.

To let Android Chrome fill the code automatically (WebOTP), end the SMS with `@yourdomain.com #<code>`.

## Ads

`src/components/AdSlot.tsx` renders an in-content AdSense display unit on every 5th comparison. It's inline with the results, not a pop-up, because AdSense policy doesn't allow ads in pop-ups or overlays.

To go live: get the site approved in AdSense, create a display ad unit, set `VITE_ADSENSE_CLIENT` (`ca-pub-…`) and `VITE_ADSENSE_SLOT`, and add `public/ads.txt` with the line AdSense gives you.

## Not done yet

- Real product photos (the API supports an `image` URL per product; the app shows an emoji tile until one exists).
- Real price adapters, as above.
