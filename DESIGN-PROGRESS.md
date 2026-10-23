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

## Production result — 23 October 2026
- Redesign commit 67908be deployed successfully to https://www.estorehouse.ro; live homepage and product page verified in Chrome.
- 70 additional Economy models published in commit 0612a7e. All 70 live product pages returned correct SKU and polyester composition. Live public API confirms 257 models and correct new prices/availability.
- Current published catalog: 257 models, 421 configurations; 417 of 1337 exported Control records covered, 920 pending. Control UI excludes one rework record and therefore shows 1336 active records.
- Exact prior Economy gallery hashes verified; supplier numeric barcodes checked from individual evidence and live costs/stock refreshed. Original held records preserved in released-economy-originals-20261023.json; unresolved held records unchanged.
- Full tests: 64 passed / one archive consistency failure / two skipped initially. Moved the 70 released records into their recoverable release archive and reran all seven catalog quality/pricing checks: passed. No test expectations weakened.
- Final production build passed after improving the visible contents of simple products. Deployment commit b5ef73c.
- Control connection fixed: Cloudflare supports manual redirects, not redirect:error. Private Sites deployment appgdep_6adaa165a83c8191ad27b2b6194018de succeeded; UI now shows 257 approved models. Audience and Control prices unchanged.
- Percale batch not imported: own descriptions mention cotton but do not substantiate existing 100% claims. Seventeen models / 23 Control variants require composition confirmation or accurate copy/image corrections. Overhead detail outputs reviewed but do not constitute complete publication approval.
- Not complete: remaining Control catalog needs individual source/gallery/copy work; some Finet composition and Romania/Pucioasa manufacturing claims need supplier confirmation. Card payment still pending EuPlatesc. Real-phone and participant checks not performed.

## Clasy additional batch
- Nine Arsida/Eveya models individually verified against current supplier API and each printed numeric barcode. Composition, piece counts, dimensions and care checked.
- New distinct side-angle images generated from each actual supplier reference, visually reviewed and saved in public/products/clasy-reviewed-20261023. Repetitive hero frames with unsupported mattress-fit wording excluded; final galleries contain front, side, close detail and overhead.
- All seven catalog quality/pricing tests pass; current catalog after this batch is 266 models / 430 configurations. Control coverage becomes 426 articles; 911 remain pending verification/completion.
- Price/stock refreshed from supplier. Clasy is kept identifiable as a separate brand; no Romanian origin attributed.

## Lot Estina — 23 octombrie 2026

Cele 9 modele Arsida/Eveya sunt confirmate live: 266 modele, 430 configurații. Verificate individual paginile, prețurile, disponibilitatea și toate cele 36 imagini.

Pregătite încă 6 modele Clasy Estina: surse individuale cu 100% bumbac Ranforce și set 4 piese, coduri numerice confirmate în pagini, preț actual 489 lei calculat conform regulii. Patru vederi distincte per model, inclusiv vedere laterală nouă verificată față de surse. Afirmația neconfirmată despre potrivirea pe saltele a fost eliminată prin înlocuirea vechiului hero; temperatura contradictorie de călcare nu este publicată. Build și cele 7 teste de catalog/preț au trecut. După publicare: 272 modele / 436 configurații, 432 articole Control acoperite și 905 rămase.
