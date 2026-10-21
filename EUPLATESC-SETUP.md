# EuPlătesc checkout activation

This branch prepares a signed EuPlătesc redirect, verified server callback, order storage, customer/merchant email, order-status page, and private order list. **Payment is disabled by default.** The public catalog has 37 reviewed models; 815 held IDs cannot be exposed just to test checkout. The test account was reported to permit transactions of at most 1 RON, below current product prices. Do not create a public 1 RON product or place a real order to work around that limit.

Set these values as server environment secrets in the hosting project. Never commit their values or expose them with `NEXT_PUBLIC_`:

| Variable | Purpose |
| --- | --- |
| `EU_PLATESC_MERCHANT_ID`, `EU_PLATESC_KEY` | Merchant identifier and hexadecimal signing key |
| `EU_PLATESC_MODE` | `test` or `live`, matching the merchant account |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Private order and customer-request storage |
| `STORE_PUBLIC_URL` | Exact HTTPS origin for payment callbacks |
| `STORE_SHIPPING_RON` | Confirmed shipping fee under 900 lei, in whole RON |
| `STORE_SUPPORT_PHONE` | Confirmed customer support number |
| `STORE_ADMIN_TOKEN` | Long random secret for the private order/request view and intent IDs |
| `RESEND_API_KEY`, `STORE_MAIL_FROM` | Transactional mail service and verified sender domain |
| `STORE_CHECKOUT_ENABLED` | `true` only after all checks below |

Customer-facing build-time values also need verification: `NEXT_PUBLIC_STORE_SUPPORT_EMAIL`, `NEXT_PUBLIC_STORE_VAT_STATUS` (`included` or `not_registered`), and `NEXT_PUBLIC_STORE_DELIVERY_ESTIMATE`. Accounting must confirm VAT status. The shipping fee and timeframe must come from actual Sameday terms. A zero fee must mean genuinely free shipping under the threshold.

Activation checklist:

1. Confirm legal identity, VAT status, support email and phone, delivery timeframe, return address, and shipping fee. Set public values on the preview deployment and rebuild it.
2. Provision private Redis storage and transactional email. Verify the sender domain. Restrict credentials to server-side environments.
3. Configure merchant ID and signing key. Point EuPlătesc's server callback to `<STORE_PUBLIC_URL>/api/euplatesc/callback` for that environment. The checkout API rejects a browser origin different from `STORE_PUBLIC_URL`.
4. Test the entire flow with an approved EuPlătesc method within the account's test limit: authentic success/failure callback, order status, both confirmation emails, private order list, complaints, and withdrawal receipts. Use approved sandbox data and no public test product.
5. Obtain EuPlătesc's live approval and confirm the merchant's "Livrare permisă" rule before shipping. Set `EU_PLATESC_MODE=live`, production origin and secrets, and only then enable checkout in production.

The server prices the cart from reviewed catalog data, applies 10% to one cheapest unit at two or more items, then offers free shipping from 900 lei **after** discount. Browser-supplied prices are ignored. A signed approved callback moves the order to `paid_review`; the browser return alone never marks it paid. Shipment still requires green "Livrare permisă" status in EuPlătesc Manager.

This branch does not integrate Sameday labels, stock reservation, invoicing, or accounting. The private order list is an operational view, not a full back-office system. See [SITE-AUDIT.md](SITE-AUDIT.md) for evidence and remaining dependencies.

References: [EuPlătesc transaction documentation](https://manager.euplatesc.ro/v3/?page=docs), [OUG 34/2014](https://legislatie.just.ro/Public/DetaliiDocument/307805), [ANPC SAL](https://anpc.ro/comunicat-sal/).
