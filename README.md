# QuickHai

A PWA that compares grocery prices across Zepto, Blinkit, Amazon Now, BB Daily and Milkbasket.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build && npm run preview   # production build with the service worker active
```

## What's here

- Splash → search home → product comparison, with hash routing (`#/p/<id>`) so product pages are shareable and work offline.
- Google-style suggestions: prefix matching, Hindi aliases (pyaaz, doodh, atta), one-typo tolerance, keyboard navigation, and the ↖ button to fill the query.
- Product page: best price card, every platform ranked by price (ties go to the faster delivery), in stock / out of stock / not listed states, and a link out to each app's search.
- Installable PWA: manifest, maskable icons, offline shell via `public/sw.js`.

## Data is mocked

`src/data/priceService.ts` generates stable sample prices from `src/data/catalog.ts`. None of these apps publish a pricing API, and prices depend on the pincode's dark store, so real data needs a backend that fetches per platform and location. Swap `fetchComparison()` for a call to that backend; the UI won't need to change.
