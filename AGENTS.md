<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Product catalog rules

- Publish one product per model; dimensions are variants, with variant-specific images.
- Sale price for each variant is the verified supplier price multiplied by 1.30, rounded to two decimals. Show the minimum–maximum range before size selection. Do not apply automatic cart discounts.
- SKU must be the supplier's numeric barcode, verified on its product page, stored as a string and carried into cart/order items. Do not substitute the supplier's generic letter SKU or an internal product ID.
- Verify model, contents and dimensions against supplier data and the provided image set before publishing.
- Match each product to the supplier category path in `src/data/categories.json`; preserve the Ralex parent/subcategory hierarchy. Parent category listings must include products from descendants.
