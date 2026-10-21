# EuPlătesc checkout activation

This branch prepares a signed EuPlătesc redirect, verified server callback, order storage, customer/merchant email, order-status page, and private order list. **Payment is disabled by default.** The public catalog has 37 reviewed models; 815 held IDs cannot be exposed just to test checkout. The test account was reported to permit transactions of at most 1 RON, below current product prices. A token-protected Preview-only 1 RON integration test is available from the private order page; it creates a clearly marked non-shippable test order, not a public product. Do not initiate or pay for that test without the owner's specific agreement at the time.

EuPlătesc confirmed by email on 24 June 2026 that the merchant account was opened. That message also contains the merchant credentials and signing key; retrieve them from the owner's mailbox and never copy them into this document or the repository. On 29 June they confirmed receipt of the signed contract and said live activation follows payment integration and publication of the merchant's legal identity and contacts, consumer-authority complaint path, complaint handling, delivery/return policy, and terms accepted at checkout. On 21 October the owner authorized sign-in to EuPlătesc Manager; its dashboard showed the E-STORE HOUSE S.R.L merchant as **Stare cont: test**, with bank card and RON enabled. Manager also warned that the initial account password should be changed by the owner. The branch includes the legal pages and a required terms checkbox. The owner has confirmed `contact@estorehouse.ro`, temporary phone `0729758396`, and that the company is not VAT-registered. These three public values were added to **Preview only** in the `e-store-house` Vercel project on 21 October 2026. The subsequent Preview deployment passed, and the customer-information page visibly shows the confirmed email and temporary phone. Shipping terms and an end-to-end payment check still need confirmation. Do not describe the account as live until EuPlătesc confirms it.

Confirm these values in the hosting project. Keep signing keys, database write keys, SMTP passwords and admin tokens server-only; never commit them or add `NEXT_PUBLIC_` to their names:

| Variable | Purpose |
| --- | --- |
| `EU_PLATESC_MERCHANT_ID`, `EU_PLATESC_KEY` | Merchant identifier and hexadecimal signing key |
| `EU_PLATESC_MODE` | `test` or `live`, matching the merchant account |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) | Redis REST storage for orders and requests; supplied by the Upstash integration on Preview |
| `STORE_PUBLIC_URL` | Exact HTTPS origin for payment callbacks |
| `STORE_SHIPPING_RON` | Confirmed shipping fee under 900 lei, allowing two decimals |
| `NEXT_PUBLIC_STORE_SUPPORT_PHONE` | Confirmed customer support number displayed to customers |
| `STORE_ADMIN_TOKEN` | Long random secret for the private order/request view and intent IDs |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Existing SMTP service, subject to a real connection/delivery check |
| `ORDER_NOTIFICATION_EMAIL` | `orders@estorehouse.ro` for paid orders and customer requests; code also uses this address as the fallback |
| `STORE_CHECKOUT_ENABLED` | `true` only after all checks below |

Customer-facing build-time values now confirmed in Preview are `NEXT_PUBLIC_STORE_SUPPORT_EMAIL=contact@estorehouse.ro`, `NEXT_PUBLIC_STORE_SUPPORT_PHONE=0729758396`, and `NEXT_PUBLIC_STORE_VAT_STATUS=not_registered`. The phone is temporary until the dedicated WhatsApp number is ready. Still needed: `NEXT_PUBLIC_STORE_SHIPPING_DESCRIPTION` (the same confirmed fee shown in checkout) and `NEXT_PUBLIC_STORE_DELIVERY_ESTIMATE`. Both new mailboxes appear in Apple Mail and received initial messages; SMTP sending and delivery of transactional mail remain untested. The shipping fee and timeframe must come from actual Sameday terms. A zero fee must mean genuinely free shipping under the threshold. The Sameday eAWB page currently reports the account inactive due to unpaid invoices, despite also showing a zero invoice balance; clarify this directly with Sameday before relying on that account for fulfillment.

`STORE_PUBLIC_URL` is set to the exact branch-preview origin in Preview only. It is deliberately absent from Production until the live domain and end-to-end flow are verified.
The EuPlătesc merchant ID and signing key from the 24 June email were saved as Vercel **Secret** values in Preview only, with `EU_PLATESC_MODE=test`. Their contents were not added to the repository. On 21 October a free Upstash Redis database named `estorehouse-checkout-preview` was created in Frankfurt and connected **only** to the `e-store-house` Preview environment. Vercel visibly added `KV_REST_API_URL` and `KV_REST_API_TOKEN` to Preview; the code supports these names. Checkout remains disabled until email, shipping, provider status, and an end-to-end test are ready.

Activation checklist:

1. Confirm delivery timeframe, return address, and shipping fee. Set the remaining public values on the preview deployment and rebuild it.
2. Complete the private Preview admin token and verify transactional email. On 21 October, `SMTP_HOST=smtp.hostinger.com`, port 465 with TLS, `SMTP_USER=orders@estorehouse.ro`, `SMTP_FROM`, and `ORDER_NOTIFICATION_EMAIL` were added as Config variables to Preview only. `SMTP_PASS` is still missing, and the Production SMTP values have not been verified. Test SMTP delivery to the confirmed business mailbox before enabling customer checkout. Redis is now the Preview order store; no Supabase migration is needed for this path.
3. Configure merchant ID and signing key. Point EuPlătesc's server callback to `<STORE_PUBLIC_URL>/api/euplatesc/callback` for that environment. The checkout API rejects a browser origin different from `STORE_PUBLIC_URL`.
4. With the owner's specific agreement, use the private Preview-only 1 RON test from `/admin/comenzi` to check the authentic success/failure callback, order status, both confirmation emails, and private order list. The payment itself must be completed by the owner. Then verify complaints and withdrawal receipts separately. No public test product is needed.
5. Obtain EuPlătesc's live approval and confirm the merchant's "Livrare permisă" rule before shipping. Set `EU_PLATESC_MODE=live`, production origin and secrets, and only then enable checkout in production.

The server prices the cart from reviewed catalog data, applies 10% to one cheapest unit at two or more items, then offers free shipping from 900 lei **after** discount. Browser-supplied prices are ignored. A signed approved callback moves the order to `paid_review`; the browser return alone never marks it paid. Shipment still requires green "Livrare permisă" status in EuPlătesc Manager.

This branch does not integrate Sameday labels, stock reservation, invoicing, or accounting. The private order list is an operational view, not a full back-office system. See [SITE-AUDIT.md](SITE-AUDIT.md) for evidence and remaining dependencies.

The old Vercel Supabase resource named `estorehouse` shows its integration status as **Uninstalled**, and Vercel disabled its Connect Project button. The associated Supabase organization did not list this resource as an available project. No Supabase secrets were copied or migration applied. The existing SMTP variable names are scoped to Production only; their values and service status have not been verified. The Sameday eAWB account still displays an inactive-for-unpaid-invoices notice on 21 October, so shipping cannot yet be relied on operationally.

References: [EuPlătesc transaction documentation](https://manager.euplatesc.ro/v3/?page=docs), [OUG 34/2014](https://legislatie.just.ro/Public/DetaliiDocument/307805), [ANPC SAL](https://anpc.ro/comunicat-sal/).
