<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Product catalog rules

- Publish one product per model; dimensions are variants, with variant-specific images.
- Sale price for each variant is the verified supplier price multiplied by 1.29 (29% markup), then rounded UP to the next whole-leu price ending in 9 (for example, supplier cost 100 → 129 and supplier cost 120 → 159). Store these prices for every model and variant; a variable model uses its cheapest variant as the parent price. Shipping is paid separately by the customer; do not include shipping in product prices or invent a shipping fee. Show the minimum–maximum range before size selection. Apply one automatic 10% discount to the cheapest individual unit when the cart contains at least two units (including two of the same product). Shipping is free when the merchandise total after discount is at least 900 RON. Use src/lib/cart-offers.ts consistently for cart and checkout calculations.
- SKU must be the supplier's numeric barcode, verified on its product page, stored as a string and carried into cart/order items. Do not substitute the supplier's generic letter SKU or an internal product ID.
- Verify model, contents and dimensions against supplier data and the provided image set before publishing.
- Match each product to the supplier category path in `src/data/categories.json`; preserve the Ralex parent/subcategory hierarchy. Parent category listings must include products from descendants.
- Supplier product descriptions are the source of truth for material/composition, piece counts, dimensions and care instructions. Check each supplier barcode against its own page; do not infer composition from another range, file names, or promotional image text. Correct conflicting image captions before publication. If supplier information is contradictory, leave the disputed claim unpublished until resolved. Preserve the photographed product pattern when editing captions.

## Public catalog approval

- Keep only products with complete reviewed E-Store House galleries and accurate Romanian copy in src/data/products.json. Supplier originals serve as references, not as substitutes for the requested E-Store galleries. Four files alone do not prove four distinct views.
- Preserve unverified or rejected records unchanged in catalog-review/products-on-hold.json, with reason codes; do not import this archive into the storefront. Unverified does not necessarily mean defective.
- A model and every published variant need at least four reviewed distinct product photographs, numeric supplier SKU verification, source-backed composition/contents and a matching entry in src/data/catalog-approvals.json. Visually review actual output files against that model’s sources; do not approve a listing just to pass the build.
- npm run check:catalog blocks publication of unapproved models and changes to reviewed copy/gallery/variant details. Re-review those changes before updating the approval fingerprint and media evidence. Price/stock changes do not invalidate a visual review.
