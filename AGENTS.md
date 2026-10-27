<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Product catalog rules

- Merchant instruction, 23 October 2026: do not add main storefront categories. Place new products under existing main categories; add only necessary subcategories.

- Pricing scope: the two-stage markup (supplier +29% rounded, then another +20% rounded) and prices ending in 9 apply only to estorehouse.ro. When completing E-Store Control product data, preserve its existing price/listPrice and marketplace prices; website pricing is a separate destination calculation.
- Publish one product per model; dimensions are variants, with variant-specific images.
- Updated merchant instruction, 25 October 2026: increase every existing website sale price by 20%, then round UP to the next whole leu ending in 9. The reproducible supplier-based rule is now two stages: supplier cost × 1.29, round up to ending 9; multiply that result by 1.20, round up to ending 9 again (supplier 100 → 129 → 159; previous website 149 → 179). Apply the second stage exactly once; do not compound it on subsequent imports. Store these prices for every model and variant; a variable model uses its cheapest variant as the parent price. Shipping is paid separately by the customer; do not include shipping in product prices or invent a shipping fee. Show the minimum–maximum range before size selection. Apply one automatic 10% discount to the cheapest individual unit when the cart contains at least two eligible units (including two of the same product). Super Sale products and variants neither count toward those two units nor receive the extra discount. Shipping is free when the merchandise total after discount, including Super Sale items, is at least 399 RON. Use src/lib/cart-offers.ts consistently for cart and checkout calculations.
- SKU must be the supplier's numeric barcode, verified on its product page, stored as a string and carried into cart/order items. Do not substitute the supplier's generic letter SKU or an internal product ID.
- Verify model, contents and dimensions against supplier data and the provided image set before publishing.
- Match each product to the supplier category path in `src/data/categories.json`; preserve the Ralex parent/subcategory hierarchy. Parent category listings must include products from descendants.
- Supplier product descriptions are the source of truth for material/composition, piece counts, dimensions and care instructions. Check each supplier barcode against its own page; do not infer composition from another range, file names, or promotional image text. Correct conflicting image captions before publication. If supplier information is contradictory, leave the disputed claim unpublished until resolved. Preserve the photographed product pattern when editing captions.

## Public catalog approval

- Merchant instruction: first audit existing Control galleries across the pending catalog, then publish the largest verified ready batch. Updated merchant instruction, 23 October 2026: repair problems and generate necessary images to complete impeccable galleries. Preserve faithful product references and verify each generated output before publication. Include the merchant-provided wording “Produs de Ralex Pucioasa.” in Ralex product descriptions; do not apply it to other brands.

- Current merchant scope (23 October 2026): new publications from E-Store Control must be RALEX PUCIOASA only. Exclude Casa Pucioasa, other brands, and unconfirmed brands even when sold by the same supplier. Verify actual image galleries before publication.

- Keep only products with complete reviewed E-Store House galleries and accurate Romanian copy in src/data/products.json. Supplier originals serve as references, not as substitutes for the requested E-Store galleries. Four files alone do not prove four distinct views.
- Preserve unverified or rejected records unchanged in catalog-review/products-on-hold.json, with reason codes; do not import this archive into the storefront. Unverified does not necessarily mean defective.
- A model and every published variant need at least four reviewed distinct product photographs, numeric supplier SKU verification, source-backed composition/contents and a matching entry in src/data/catalog-approvals.json. Visually review actual output files against that model’s sources; do not approve a listing just to pass the build.
- npm run check:catalog blocks publication of unapproved models and changes to reviewed copy/gallery/variant details. Re-review those changes before updating the approval fingerprint and media evidence. Price/stock changes do not invalidate a visual review.

## Active redesign specification (23 October 2026)

- Read DESIGN-BRIEF-0140.md before changing storefront design. It is the user's complete controlling brief, not optional inspiration.
- Work on design/confort-bine-ales-20261023 in this isolated checkout; production publication explicitly authorized by the user on 23 October 2026 after preview handoff.
- Preserve existing pricing, reviewed catalog, order/payment/shipping security and data correctness.
- Card payment activation is pending the user's email from EuPlatesc.ro. Complete independent work; never display unavailable online payment as active.
- Keep progress and unresolved evidence in DESIGN-PROGRESS.md. Do not claim all acceptance criteria pass without evidence.

## Merchant scope update — 25 October 2026

- Complete and repair the products already present in E-Store Control. Do not add new products sourced only from the Ralex catalog to reach 1,000. The numerical target is subordinate to this scope; publish all eligible distinct Control models and resolve their variants without duplicates.
- Merchant explicitly accepts the supplier’s Ralex classification for the Control products discussed, including supplier-sold Clasy series; retain that classification. Continue excluding Casa Pucioasa.

## Category audit correction — 25 October 2026

- Merchant requested removal of the HoReCa navigation category and redistribution into the existing product categories. Keep all reviewed products; do not reintroduce a HoReCa menu link.
- Do not treat Control's brand label alone as proof that a supplier product is absent or ineligible. The audit recovered 22 existing Control Finet duvet rows labelled Generic, 13 Clasy rows and a Butterfly pillow by their own Ralex numeric product pages and actual galleries. These are existing Control products, not supplier-only additions. Continue excluding Casa Pucioasa and unresolved identities.
- Category counts describe distinct models; price ranges must include all published size variants. Super Sale membership comes from the store's active promotion, not the supplier's `oferte` taxonomy.

## Super Sale campaign — 25 October 2026

- Merchant authorized 30 selected models at verified supplier cost +10%, rounded only to bani (not ending 9). Campaign configuration is src/data/super-sale.json; base catalog prices remain the regular two-stage prices.
- Advertised crossed-out prices use the historical minimum, not the just-increased regular price. Show the reference period on the product page and floor the advertised percentage. Keep reference evidence in the campaign configuration.
- Super Sale items remain excluded from the additional second-item discount. Validate each campaign SKU and price before publishing; do not automatically transfer a campaign to a different SKU or variant.

## Website pricing update — 26 October 2026

- Merchant authorized an additional 30% on all current website prices, including all variants and Super Sale. Regular prices retain upward rounding to whole lei ending in 9: supplier ×1.29 rounded, ×1.20 rounded, then ×1.30 rounded. Recompute from supplier cost on imports, never apply again to an already updated selling price. Campaign prices retain bani rounding: prior supplier +10% price ×1.30. This supersedes the earlier two-stage regular and +10% campaign price rules.
- No separate price-history report requested. Never inflate historical references to create a discount; suppress crossed prices, percentages and reference notes when current prices exceed their existing reference. Preserve campaign membership and second-unit discount exclusions. Prices in Control and marketplaces are outside scope.

## Super Sale launch update — 26 October 2026

- Merchant now requests supplier +10% for the 30 Super Sale models, rounded UP to whole lei. This supersedes the additional 30% campaign rule; regular catalog prices are unchanged.
- Merchant clarified the crossed-out price must be the ACTUAL current campaign selling price before this update, not the standard catalog price. Preserve it as comparisonPrice. Show only crossed-out price, new whole-lei price and percentage badge next to products, without explanatory copy. Floor the percentage after rounding the final selling price. Retain existing historical evidence unchanged, but do not assert that the launch comparison is the 30-day minimum.
- The merchant will post on Instagram themselves. Do not publish social posts.


## Bath publication and reseller promotion — 27 October 2026

- Merchant authorized all 89 supplier bath models / 203 variants, Control first then website, matching numeric SKU/barcode and preserving existing records. All 203 bath variants have stock 100, including six existing local stock corrections; no Trendyol stock submission. Existing Control and marketplace prices remain unchanged.
- Merchant extended website promotional pricing to existing similar bath models/colors: use the authenticated reseller acquisition cost, final price ceil(cost / 0.70), comparison ceil(final / 0.55), integer displayed discount calculated from those prices (over 40%). Keep private reseller evidence in the Desktop bath batch; do not assert the calculated comparison is a historical minimum.
- Apply the bath campaign after existing Super Sale pricing for overlapping bath products. No additional cart/coupon discounts on bath campaign items, to preserve minimum 30% gross merchandise margin.
- Complete missing size variants under existing models. Publish saved-cart SKU aliases alongside the corresponding catalog conversions.

- Merchant explicitly requests all bath offers included in Super Sale; visible navigation and campaign title: “Super Sales · Black Friday”. Preserve the separate Black Friday coupon dates.
- Homepage merchandise selections show only available Super Sale items with more than 40% discount for every size; keep other offers in the complete campaign page. Black Friday color changes are deferred until publication is finished.

- Merchant authorized the deferred Black Friday palette on 27 October 2026: charcoal campaign surfaces, gold headings/actions, red discount badges, cream shopping surfaces. Seasonal overrides are in src/app/black-friday.css; do not change commercial calculations as part of styling.

- Merchant update 27 October: homepage must lead with Black Friday before other content. Display product dimensions on home/catalog cards and prominently in purchase controls. Preserve single-size dimensions when flattening supplier variants; never infer dimensions from images.

- Merchant confirmed packed bath dimensions on 27 October 2026: robes 30×30×10 cm, towels 30×30×5 cm, bath mats 40×40×10 cm; weight 2 kg per packed item for all three categories. Apply by exact supplier SKU in shipping-packages.json. Preserve aggregate parcel size/weight limits for easybox and the 17 lei customer fee (free at the existing threshold).

## Damasc Policoton reseller promotion — 27 October 2026

- Merchant authorized all 68 existing Damasc Policoton models in Super Sales: exact authenticated reseller cost / 0.70, rounded UP to whole lei. Use the actual website selling price before this update as comparisonPrice; floor the percentage. No additional automatic/cart/coupon discounts.
- Configuration: src/data/damasc-offers.json. Private reseller costs and exact variant evidence stay in the Desktop Damasc batch, never in the public bundle. King size model 95157 maps to supplier variant/barcode 95160; do not use the supplier parent minimum price.
- Preserve existing products, galleries, stock, bath offers and Control/marketplace prices. Total campaign membership becomes 184 models.

## Super Sales selection — 27 October 2026

- Merchant now limits the visible Super Sales collection to displayed discounts strictly greater than 40%, including every variant of a model. Use isVisibleSale in sale-selection.ts for category membership and homepage selection. Preserve existing prices and discount-stacking exclusions even for offers no longer shown in this collection.
- Super Sales has two section buttons: Articole baie (selectie=baie) and Lenjerii de pat (selectie=lenjerii). Preserve section through filters, sorting, pagination and search reset; section switching starts a fresh selection. Current visible collection: 157 models, 89 bath + 68 bedding.

- Merchant price-floor update: Damasc Policoton must start at 129 lei. Final price is now max(129, ceil(authenticated reseller cost / 0.70)); higher current campaign prices stay unchanged. Recalculate badge from the unchanged actual pre-campaign comparisonPrice. This raises 28 models from 112/118 to 129 lei; all remain over 40% off.

## Policoton size presentation — 27 October 2026

- Merchant requests simpler size presentation for Damasc Policoton. Do not concatenate sheet, duvet, pillow and quantity measurements in the primary summary. For verified fitted models show only mattress 160 × 200 or 180 × 200 cm; for flat-sheet sets show sheet type and piece count without inventing mattress compatibility.
- Keep exact reviewed dimensions and mattress height in an initially collapsed “Vezi dimensiunile pieselor” section. Simplify the visible fitted title by omitting its repeated size string. Preserve source catalog, finder data, SKU, pricing and stock; this is a presentation change only.
