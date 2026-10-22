# E-Store House site audit and preview handoff

Scope: a reviewable preview of the storefront improvements requested in the Yahoo message “Promt pentru site”. This branch does not publish production changes, create real orders, send customer messages, or activate card payment.

## Implemented in this branch

- Cart persists only product/variant IDs and quantities in browser storage, then re-quotes from the reviewed catalog on return. It never trusts saved price or stock data. The checkout server independently re-quotes and uses the same 10%-for-one-cheapest-unit and free-shipping-at-900-lei-after-discount rules.
- Checkout form collects contact, delivery and optional separate billing data. A card redirect requires complete verified configuration; it is currently disabled. Order persistence, signed EuPlătesc request/callback, status page, private operations view and transaction emails are prepared.
- Search normalizes Romanian diacritics and dimension notation (`160x200`, `160 x 200`, `160 × 200`), and searches titles, attributes and SKU. Catalog filters include only values present in reviewed data. Offers navigation now leads to products eligible for the existing cart promotion, without inventing reduced list prices. Empty categories are hidden from discovery.
- Product pages put contents, variant-specific size guidance, availability and delivery terms beside purchase controls. Related products follow the detail section. Metadata, canonical links, product structured data, sitemap and robots routes were added.
- Complaint and withdrawal forms can store requests and send dated receipts when private storage and verified mail are configured. They report unavailability otherwise and retain an explicit email fallback. Customer-rights pages and privacy/cookie text reflect the planned checkout and local cart storage. Existing ANPC and EU legal-guarantee assets remain in place.
- A reviewed product's clean photo was converted to a 520 KB JPEG hero asset from a roughly 2.5 MB PNG source. The hero was shortened, and the compact top category navigation was retained.

## Evidence and limits

- Local production build, lint and 19 automated tests pass. The catalog validator confirms **37 reviewed public models** and no held models. The quality-hold file contains **815 IDs**. These are intentionally not bulk-imported or merged into the public catalog.
- In Safari, a 160 × 200 cm variant remained in the cart after refresh with its exact 149 lei price and SKU 163013. A two-unit 319 lei API quote produced 638 lei subtotal, 31.90 lei discount and 606.10 lei merchandise total; shipping remained chargeable because the after-discount total was under 900 lei.
- Disabled checkout and customer-request APIs returned 503 without writing an order or sending a message. No payment, order, shipping-label, or email end-to-end test has been made against real services.
- There is no reliable stock feed. Sameday now has an API adapter and administrative AWB flow, with live API authentication, pickup/locker lookup and sample estimates verified. Final customer tariffs and a paid-order shipment remain pending (see `SAMEDAY-SETUP.md`). Availability is checked against the reviewed catalog snapshot, so real-time stock reservation, courier labels, tracking, and invoicing remain separate integration work.
- The Vercel `e-store-house` project has existing Production-only Supabase and SMTP variable names. The checkout branch now supports them, avoiding mandatory new Redis/Resend accounts. The linked database, table migration, mail delivery and Preview isolation still need verification; no production secret was revealed or changed.
- Next.js and its ESLint package were updated from 16.2.4 to 16.4.2 in the preview branch after npm audit identified a critical advisory. The updated local build passes; npm audit now reports no critical findings, with 11 lower-severity dependency findings still present.
- Historical check on 21 October: the signed-in Sameday eAWB account displayed an inactivity notice for unpaid invoices. On 22 October the owner confirmed the account is active and unrestricted; the add-shipment form now opens. The invoice list shows two items marked "Facturat" totaling 82.09 lei (39.66 + 42.43); it also shows "Sold facturi: 0", so the accounting state needs clarification with Sameday rather than assuming a balance or making a payment. The contract-documents view is empty. An active account and confirmed tariff/API terms are prerequisites for courier integration.
- Exact 360/390/430/1440-pixel visual comparison, Core Web Vitals, analytics events and actual conversion effects have not been measured. Image byte reduction alone is not a page-speed claim.

## Business confirmations and external setup needed before activation

1. Confirm the Sameday tariff charged to a customer below 900 lei, the delivery estimate, and the contractual/API route for labels and tracking. Do not advertise a numeric fee until verified.
2. Confirm VAT status with accounting; the site currently avoids an unverified VAT claim. Confirm the final customer-support email and telephone number. The existing Yahoo address is the current fallback.
3. Complete the EuPlătesc, Supabase-table and SMTP setup in [EUPLATESC-SETUP.md](EUPLATESC-SETUP.md), then perform an approved sandbox test. The current test-transaction limit and reviewed product prices do not allow a normal public test checkout.
4. Review every held product with supplier evidence, preserving model, variant, SKU and image identity before extending the 37-model catalog. No older price, false scarcity or unverified marketing claim should be generated.
5. Verify legal pages and operational response procedures with the business's legal/accounting advisers before turning on customer-facing online forms and checkout. Confirm a person will monitor and respond to complaints and withdrawal requests.

The site has no configured analytics provider. A consent-aware funnel (product view → add to cart → checkout → approved payment) can be instrumented after the tracking provider and privacy basis are chosen. No tracking code was added to avoid collecting customer data without that decision.
