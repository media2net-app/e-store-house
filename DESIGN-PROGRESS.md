# Redesign — Confort bine ales

Source: DESIGN-BRIEF-0140.md, copied in full from the 01:40 note. User requested exact compliance.
Branch: design/confort-bine-ales-20261023. Base: 18cacae.
Original working copy and its uncommitted catalog work are preserved.

## Decisions and dependencies
- Preview only; production requires user review per brief.
- Card payment activation awaits EuPlatesc email (user update). Existing integration/security retained.
- No product has explicit Romania/Pucioasa manufacturing evidence in current catalog features/descriptions. User clarification requested. Do not infer origin from supplier address.
- macOS Prevent automatic sleeping on power adapter when display is off enabled and verified in System Settings. Temporary caffeinate session 82185 also running. Laptop needs charger and open lid.
- Preliminary effort estimate 12–24 hours, dependent on assets/evidence and test findings; not an elapsed-time guarantee.

## Work
- [x] Inspect repository, preserve uncommitted work, isolated branch.
- [x] Persist complete brief and link from AGENTS.md.
- [x] Capture baseline and inspect storefront visually.
- [x] Header and direct mobile category navigation.
- [ ] Home in exact A–H order; origin evidence required for Romania promotion.
- [x] Category groups, filters, product cards.
- [x] Product gallery, variant contents, size guide, contextual purchase bar.
- [ ] Cart and checkout visual/functional verification.
- [ ] Secondary pages, accessibility and states.
- [ ] Build, regression tests, browser verification at 360/390/430/768/1440.
- [ ] User test protocol and preview handoff.

## Validation so far
- Build succeeds; catalog guard verifies 187 reviewed models, 351 priced configurations.
- TypeScript succeeds. Existing regression suite: 61 passed, 2 external-integration tests skipped.
- Four size-guide tests pass, including preventing sheet/duvet/pillow dimension confusion and excluding unavailable variants.
- Chrome responsive 390×844: menu opens with direct category links and closes with Escape. Variant keyboard navigation works. 160×200 Jersey selected: 109 lei, 1 cover + 2 pillowcases, correct SKU 163013 in cart.
- Quantity 2 gives subtotal 218 lei, discount 10.90 lei, total 207.10 lei. No real order submitted.
- Product origin claim on existing Jersey gallery photo is not independently sufficient evidence; origin review still pending.

## Preview verification and remaining work
- Local preview: http://127.0.0.1:3100. Nothing deployed to production.
- Before/after homepage captures saved in design-review/screenshots at 360, 390, 430, 768 and 1440 CSS pixels. Long baseline mobile captures reach Chrome's 16384-pixel capture limit.
- Chrome filter: Pilote 13 products → price maximum 150 → 4 results, correctly retained in URL.
- Safari desktop: homepage and menu checked; size-guide inputs 160×200 mattress, 200×230 duvet and 50×70 pillow produced 22 candidates with the explicit verification warning.
- Main text/background contrast 14.71:1; primary button 10.09:1; muted text on cream 6.33:1 and darker surface 5.51:1.
- Main shop, grouped collections, size guide, cart, checkout and customer-information routes respond successfully; unknown route returns 404.
- Latest production build and TypeScript checks pass. Existing regression suite 61 passed / 2 skipped; new size-guide suite 4 passed.
- Secondary page styling, loading/error/empty states and checkout layout implemented. Full checkout submission/payment and external Redis tests are not verified locally.
- Real iPhone/Android and full screen-reader verification remain. Browser emulation does not replace physical-device tests.
- Real-user protocol is ready in DESIGN-USER-TEST.md; no actual participant testing has occurred.
- Exact Romania/Pucioasa hero and collection remain gated on product-specific origin evidence. Honest generic copy is shown until supplied. This means exact brief compliance is NOT complete.
- Card activation waits for EuPlatesc credentials/instructions and a subsequent verified integration test.
- No optional analytics/marketing were introduced; no unnecessary cookie-consent popup was added.
- Original prices and product catalog data are unchanged. Original checkout and production infrastructure are preserved.

## Publication authorization
User explicitly authorized publishing the redesign and then all Ralex Pucioasa Control products on 23 October 2026. This supersedes the preview-only gate. Product evidence requirements and pending EuPlatesc activation still apply.
