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
## Production verification: Estina

Deployment 059a788 succeeded. Public API confirms 272 models / 436 saleable configurations. All six Estina pages and 24 gallery images responded successfully; prices and stock match verified supplier data. This session published 85 new models: 70 Economy, 9 Arsida/Eveya, 6 Estina. Control coverage is 432 of 1337 articles, with 905 still awaiting preparation or verification. This is not a completed catalog.

The 236-page Clasy manufacturer catalog did not supply missing set counts in its extracted text. Nine inspected damasc galleries repeat one source photo in all slots and need complete replacement galleries. Final Control UI recheck failed with computer-use cgWindowNotFound; the Control connection had previously been verified successfully. Final store checks used the live HTTP pages and public API.

## Damasc publication continuation

Nine additional Control models prepared: 76881,76882,76883,76884,76885,76887,76895,76899,76907. Individual supplier pages confirm barcode, 80% polyester / 20% cotton, six-piece contents and dimensions. All 36 gallery photographs newly generated and visually reviewed against each source; repeated originals preserved in release archive. Corrected extra-pillow and split-frame outputs excluded. Seven flat-sheet sets cost 179 lei; two fitted-sheet sets cost 189 lei under the authorized pricing rule. Supplier stock current: 76887 unavailable; other eight available. Catalog and seven regression checks passed. Pending deployment: 281 models / 445 configurations; 441 Control articles covered, 896 remaining.

Local recovery: original Desktop checkout blocked on filesystem reads (Git mmap of postcss.config.mjs; Next invalid local jiti package). Preserved original checkout unchanged and transferred only this reviewed batch to /tmp/estore-damasc-clean-20261023 cloned from production main. Fresh npm ci, full production build and seven catalog/pricing tests succeeded there. Publishing from the same design branch in this isolated recovery checkout.

Deployment 78767ba succeeded. Live verification passed for all nine product pages, exact prices/availability and SHA-256 hashes of all 36 gallery files. Public API confirms 281 models and 445 saleable configurations. Total newly published across the task: 94 models; Control coverage 441/1337; 896 pending. Eight new models are available and navy 76887 is correctly unavailable.

## Homepage 65/35 selection preview — 2026-10-23
User requested right image ~35%, ten sale products on the left, including mobile. Replaced old stacking hero with persistent 65/35 columns and manual ten-product navigation. Selected in-stock IDs: 101399,101400,158295,158310,138602,138608,76882,76885,76895,76899. Portrait uses existing reviewed DP47 photo. Conditional circular discount badge and old/new prices prepared; no prices changed. Awaiting user's discount percentage (async question: 10/15/20%). Preview at localhost:3102; production not changed. Build including catalog validation passed; visually inspected Chrome responsive 390 and 360; next navigation verified 1/10 ECN61 to 2/10 ECN62. Need finish active promotion and verify price consistency across product/catalog/cart, desktop layout and deploy after percentage provided. Existing cheapest-item multi-buy promotion remains unchanged. Offers category currently matches all products; correct when activating actual offer selection.

### User refinement: six thumbnails, category icons, products
Replaced carousel with six small model links first, then six image-based category links, then ten product cards in the left 65%. Right 35% is a sage editorial panel with message and reviewed damask image. Removed former standalone Collections, ProductGrid and ComfortInspiration from homepage. Preview inspected at 360px and 1440px. Production unchanged, discount rate still pending. Preview localhost:3102.

### Three per row, bedding types, static right panel
User requested exactly three thumbnails per row and category/type labels instead of model names/codes. Six thumbnail links now point to Economy, Finet, Ranforce, creponate, damasc and tricot category listings; matching catalog images used. Grid is three columns on all widths. Right editorial panel changed from sticky to static so it no longer follows scrolling. Desktop visual QA and targeted ESLint passed. Preview only.

### Aligned intro and full-width catalog
User wants six Super Sale thumbnails plus categories to fit beside the right image, with no empty column below. Intro now shares one grid row with stretch-height static editorial panel; product catalog is a separate full-width second row (three desktop columns, two mobile). Six thumbnails keep type labels but now link to their representative products, as sale selection requested. Super Sale title is preview copy only; actual discounts remain unconfigured pending rate. Visual QA at 1440 and 390 confirmed aligned bottom edges and full-width continuation. Build and targeted lint passed. Not deployed.

### Local-production collage — owner confirmation
Owner explicitly confirmed Romanian manufacture in chat after being asked whether these products are manufactured locally rather than merely distributed there. Right panel now uses three existing reviewed product photos (76885 damasc, 81336 creponat, 110208 Finet), links directly to their product pages, and states “Fabricate în România”, “Din Pucioasa, pentru casa ta”, “Susținem producătorii locali”. No Ralex name on banner. This is owner-supplied provenance, not independently verified supplier documentation; no blanket origin claim was added to the catalog. Preview only.

### Packaged assortment replaces collage
Generated one portrait scene with built-in imagegen: gift-box bedding, transparent-wrapped mattress, folded bathrobes, towel packs, three pillows and two quilts in carrying bags. Supplier actual box/bag reference downloaded and used, plus material references for mattress/robe/towels. Exact packaging for those other categories was not found; transparent packaging is illustrative. Owner requested generated marketing scene and approved existing message. Saved public/editorial/produse-ambalate-pucioasa-v1.png, with prompt and sources in catalog-review/packaged-banner-20261023/. Replaced collage with single image linking to shop; unchanged Romanian/local-producer copy. Mobile preview checked, targeted lint passed. Not deployed.

### Category visibility refinement
User approved generated packaged-product banner, then requested slightly larger categories below six sale items. Increased category pictures to 76px desktop / 58px mobile; labels 16px desktop / 14px mobile with semibold weight. Added light bordered clickable tiles and visible keyboard focus. Checked mobile preview at 390px. Preview only; no pricing changes or deployment.

### Six duvets for Super Sale selection
Replaced six bedding-type thumbnails with in-stock duvet IDs 163321,163319,163317,162728,102981,104126 and current price/range labels. Verified production Product JSON-LD: first four 149 RON each; HORECA 159–209; Damasc wool 259–329. Prices unchanged; discount still requires owner's rate or target prices. Targeted ESLint passed. Preview only.

### Super Sale mix corrected by owner
Selection is now 3 Finet duvets (163321,163319,163317 at 149 lei), pink cotton bathrobe 90801 (189 lei), MicroGel pillow 102893 (139 lei), Zen Microgel pillow 102537 (159 lei). Six items visible in 3x2 mobile preview; all selected records in stock. Prices unchanged; actual discount pending. ESLint passed, no deployment.

### Real Super Sale reduction, whole-lei correction
Owner requested artificial prior-price inflation for all products and 40% displayed on Super Sale while actually reducing current prices 20%. Declined artificial reference prices; implemented only explicitly authorized real 20% decrease on six selected products through shared src/lib/super-sale.ts and allProducts mapping, including both bathrobe variants. Canonical base catalog unchanged. No fabricated oldPrice/discount labels. Reference-history confirmation asked asynchronously, not yet answered. Categories offers now match Super Sale instead of entire catalog. Existing 10%-cheapest multi-buy still applies additionally and terms state stacking.
Owner reiterated no decimal product prices. Formula now rounds DOWN to whole lei: three Finet duvets 119 each, bathrobe both variants 151, MicroGel 111, Zen 127. Hence actual savings slightly exceed 20%; no false 40% label. API quote checked all 7 purchasable IDs and unchanged non-sale 101399=109; every single-item total matches whole-lei unit price. Product JSON-LD verified before whole-lei adjustment, build passed before rounding, targeted lint passed after rounding. Preview only, not deployed. Need reference-price history before crossed-price/badge advertising. User preference: no decimals in displayed product unit prices; cart multi-buy may still produce cents.

### Approved publication
Owner explicitly requested publishing the current preview (“publica situl asa, asa imi place”). Publishing approved homepage, generated packaged assortment, more visible categories, and six real whole-lei Super Sale prices. No artificial reference prices or 40% discount labels. Existing multi-buy offer retained. Card payment still pending EuPlatesc activation. Baseline main 411ab1e; final build and live deployment verification recorded below.

### Live verification complete
Production commit b538e15 deployed successfully on Vercel. Canonical https://www.estorehouse.ro/ serves approved homepage and generated banner (remote SHA-256 matches local asset). Production quote endpoint verified three duvets at 119 lei each, both capot variants at 151, MicroGel at 111, Zen at 127, and unchanged non-sale control product 101399 at 109; single-unit totals match. Report saved to catalog-review/packaged-banner-20261023/live-verification.json. Final build/catalog/lint passed. Browser follow-up could not use inactive Chrome binding; HTTP/API verification succeeded. Production publication complete.

### Prior-price display: owner's trading-history clarification
Reviewed Git source snapshots and found earlier development prices (including robe 156). Owner explicitly clarified that the store was not trading live during that development stage and instructed use of last displayed pre-campaign prices. Source-code history is not independently treated as evidence of commercial price history. Based on owner's clarification, reference prices for this campaign: duvets 149, robe 189 (both variants), MicroGel 139, Zen 159. Current whole-lei prices unchanged. Added struck prior prices and conservative whole-percent badges (20%) in homepage Super Sale, catalog cards and product purchase panel. No fictitious 40% badge or general catalog price inflation. Publishing requested follow-up to approved live homepage.

- User update: free shipping at 399 lei after discounts, including Super Sale value. Extra 10% requires two non-Super-Sale units and discounts only the cheapest eligible unit. Updated cart, authoritative quote, public messages and promotion terms.

- Logo: user selected proposal 4 (brown house/leaf and olive textile base). Built-in imagegen extraction saved as public/brand/estore-house-icon.png; applied shared header/footer brand, multi-size favicon, 192px app icon, 180px Apple icon and Organization logo metadata. Google appearance depends on recrawl.

- Mobile repair: dedicated 1:3 packaged-products illustration; readable full-width Romanian message on phones, six sale cards left and vertical packaged image right, categories immediately below across width. Complete (contain) image framing in product cards and native horizontal swipe gallery; zoom image mounted only after opening and optimized via Next Image. Visually checked 360/390/430px phone layouts and tablet layout; product next-image and zoom tested at 390px.
- Performance: moved currency formatting into a data-free module, removing catalog JSON from browser JS. Homepage linked JS bytes before 1,264,532, after 612,084 (uncompressed, 51.6% less; not a measured page-load-time percentage). All 281 product detail pages now prerendered at build; route loading UI added. Offer tests passed.

- Checkout: payment-method section moved before courier selection as requested; existing payment availability and delivery calculations preserved.


## Apple Pay — 23 octombrie 2026
- Verificat în contul EuPlătesc, Setări cont → Integrări speciale → ApplePay: „Activez ApplePay în pagina de plată” era deja bifat. Nu au fost modificate certificate sau setări de cont.
- Fluxul existent redirecționează către pagina securizată EuPlătesc fără filtrarea canalelor; păstrat pentru Apple Pay găzduit de procesator. Nu este o integrare Apple Pay directă în domeniul magazinului.
- Checkout explică Apple Pay în opțiunea de plată online și disponibilitatea condiționată de dispozitiv/card. Buton: „Continuă la plata securizată”.
- Build și lint pentru fișierele schimbate trecute; 6 teste EuPlătesc trecute, inclusiv callback ApplePay și respingerea modificării canalului/sumei.
- Demo-ul deschis din Manager → Testează a returnat erori PHP (server lipsă / headers already sent); nu a fost autorizată o plată. O tranzacție Apple Pay reală nu este confirmată.
- Documentație: https://manager.euplatesc.ro/v3/?page=docs ; https://www.euplatesc.ro/acasa/metode-de-plata/applepay-googlepay/

## Google Pay — 23 octombrie 2026
- Verificat în EuPlătesc Manager: opțiunea GooglePay este deja bifată. Nu au fost modificate setările și nu au fost acceptați din nou termenii.
- Adăugat Google Pay lângă Apple Pay în checkout-ul public, cu selecție pe pagina găzduită EuPlătesc și disponibilitate în funcție de dispozitiv/card.
- Testul callback verifică ambele canale ApplePay/GPay și respinge modificarea canalului sau sumei. Nu a fost efectuată o plată reală.

## Checkout readiness colour — 23 October 2026
- Requested by the user: final card/COD button turns green only when ready.
- Native form validity (including terms, postal code and conditional billing fields) combines with existing payment/shipping disabled checks. Incomplete or pending checkout stays brown. No order/payment logic changed.

## County and locality suggestions — 23 October 2026
- County selector before searchable locality for shipping and separate billing. Locality resets when county changes.
- FAN public snapshot: 42 counties / 13,829 source localities, split by county and fetched only on demand. Provenance: public/locations/SOURCES.txt.
- Accent-insensitive matching and single-typo suggestions; explicit selection, keyboard arrows/Enter/Escape, native form validity. No silent correction.
- Explicit manual entry and automatic manual fallback on list download failure keep uncommon addresses usable. No postal-code guesses.
- Existing signed shipping quote is invalidated by address edits; readiness waits for a selected/manual locality.
- Validation: production build and ESLint passed; 14 locality and checkout/shipping tests passed. Browser check pending deployment.

## Super Sale collection button — 23 October 2026
- Homepage Super Sale heading is now a prominent linked button: Super Sale / Vezi toate produsele.
- Destination is the existing full offers collection, with filters and pagination, now titled Super Sale.
- Current product previews and discount rules are preserved. Future Super Sale catalog entries appear in the full collection.

## 25 October — image loading and complete category navigation

- Confirmed production image optimizer returned HTTP 400 for cdn.dsmcdn.com; allowed the exact HTTPS image host. All 3,586 distinct catalog image paths checked: 1,077 local files exist and 2,509 remote URLs return HTTP 200.
- Replaced four-item collection previews with full category/group listings using the existing shop, filters, sorting and pagination. Legacy collection links redirect to the complete listing.
- Category/subcategory summaries now include model counts and minimum–maximum prices across every variant.
- Build passed (810 approved models, 1,226 SKUs). Headless Chrome checked 360/390/430/768/1440 widths, pagination and grouped price filtering; no page errors or horizontal overflow. Local image optimizer returned HTTP 200 for the same image rejected in production. Screenshots: /tmp/estore-browser-check. No real order/payment submitted.
- Follow-up authorized: audit all product category assignments, especially Finet duvets; keep existing main categories.

## 25 October — complete category audit and recovered Control models

- Audited all 1,337 live Control rows, including rows labelled Generic/Clasy rather than only RALEX PUCIOASA. Matched each recovered product to its own supplier numeric barcode, content and actual gallery. Added 22 Finet duvet models, 13 Clasy models and one Butterfly pillow already present in Control. Finet now has 29 models rather than 7; supplier category also contains 29.
- Reclassified 13 models: seven duvet/pillow bundles into a dedicated subcategory under Pilote; HoReCa duvet, pillow protector and Finet bedding into their physical categories; Line towel into towels; Damasc bedding into the appropriate cotton/policotton subcategories. No new main categories.
- Removed the HoReCa category/menu link as requested; old category URL redirects to the directory. Super Sale membership no longer inherits the supplier's unrelated offer category.
- Retained 119 actual reviewed Control photos, replaced 22 repeated duvet infographics with reviewed close-ups, completed Butterfly single-pillow views. Built-in image_gen used; all 25 outputs visually checked and saved under public/products/control-recovered-20261025. Exact prompts and source references are in catalog-review/control-recovered-publication-20261025.
- Build passed for 846 reviewed models / 1,262 SKUs. 22 catalog, price and offer tests plus category navigation regressions passed. Updated an obsolete test which required a specific unresolved issue to remain in the hold archive; all remaining hold records must still have documented reasons.
- HTTP audit passed for 64 category pages (all 63 nonempty categories plus empty Super Sale) and complete pagination of Finet and all bedding. Product placement is recorded in catalog-review/category-audit-20261025/audit.json.
- Audit limits are explicit: 40 Control records remain unresolved (39 previously listed plus unconfirmed OEM 011); 20 original Control bundles currently correspond to individual items, not the original complete bundle. 33 Casa Pucioasa records remain excluded. Identifier matches are not claimed as proof of identical bundle offers.
- Production verification completed for content commit dc01500: 846 models / 1,262 SKUs, all 36 new pages, all 25 new assets by hash, 64 category pages, and complete Finet/bedding pagination passed. Live headless Chrome checked image decoding, four-image gallery, 29 Finet models, removed HoReCa links, old URL redirect, grouped filters and responsive overflow. Cart smoke test on the local production build passed new product quantity/discount, checkout entry, variant SKU and free-shipping threshold, without submitting an order.
