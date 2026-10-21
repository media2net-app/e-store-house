# EuPlătesc checkout — activation notes

The storefront now has a checkout, signed EuPlătesc payment request, verified server callback, durable order record, payment status page and private order list (`/admin/comenzi`). It also includes customer information, the official ANPC SAL pictogram and link, complaints guidance, and an online withdrawal function that stores the declaration and emails a dated receipt. Checkout is intentionally disabled until the production settings and merchant approval are verified.

Configure these **server-only** environment variables in the Vercel project (never use `NEXT_PUBLIC_` and never commit their values):

| Variable | Purpose |
| --- | --- |
| `EU_PLATESC_MERCHANT_ID` | Merchant ID from the 24 June 2026 account email |
| `EU_PLATESC_KEY` | Merchant hexadecimal signing key from that email |
| `EU_PLATESC_MODE` | `test` until EuPlătesc confirms production activation, then `live` |
| `UPSTASH_REDIS_REST_URL` | Dedicated Upstash Redis REST endpoint for order storage |
| `UPSTASH_REDIS_REST_TOKEN` | Write token for that database |
| `STORE_PUBLIC_URL` | `https://www.estorehouse.ro` (exact public origin, without trailing slash) |
| `STORE_SHIPPING_RON` | Confirmed customer-facing flat courier fee in RON; `0` only if shipping is truly free |
| `STORE_SUPPORT_PHONE` | Commercial customer support telephone shown on the website |
| `STORE_ADMIN_TOKEN` | New long random secret for `/admin/comenzi` |
| `RESEND_API_KEY` | Transactional email API key; sending domain must be verified |
| `STORE_MAIL_FROM` | Verified sender such as `E-Store House <comenzi@estorehouse.ro>` |
| `STORE_CHECKOUT_ENABLED` | `true` only after all checks below pass |

Activation sequence:

1. Verify the legal company identity, support phone, return address, shipping price and delivery timeframe shown on the site. The recorded return address is Str. Târgului nr. 8, sat Dragodana, Dâmbovița.
2. Create the order database and set its REST URL/token. Restrict who can access the token. Verify the sending domain in Resend and set its API key and sender.
3. Set the EuPlătesc merchant values from the account email as Vercel environment secrets. Check the merchant account's live/test status in Manager.
4. Configure EuPlătesc callback to `https://www.estorehouse.ro/api/euplatesc/callback` in Manager. Do not enable unsigned optional response fields without updating signature verification.
5. Deploy a preview and exercise checkout, callback, status page, order list, confirmation emails and online withdrawal with an approved test transaction. The emailed account initially permits test transactions of at most 1 RON. Current catalogue prices exceed this cap, so a controlled test order must be created without exposing a 1 RON product publicly.
6. Request/confirm live activation with EuPlătesc after their review of the implemented method, merchant information and mandatory site pages. Then set `EU_PLATESC_MODE=live` and `STORE_CHECKOUT_ENABLED=true` in production.

EuPlătesc's callback signature includes amount, currency, invoice ID, payment ID, merchant ID, action, message, approval, timestamp and nonce in that order. A valid approved callback moves an order to `paid_review`; shipment still requires the green **Livrare permisă** status in Manager. A browser return never marks an order paid.

Official references: [EuPlătesc transaction documentation](https://manager.euplatesc.ro/v3/?page=docs), [ANPC SAL pictogram](https://www.anpc.ro/public/sal), [ANPC SAL update](https://anpc.ro/comunicat-sal/), [OUG 34/2014](https://legislatie.just.ro/Public/DetaliiDocument/307805).
