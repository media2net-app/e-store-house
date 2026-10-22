# Sameday integration for estorehouse.ro

## Current evidence — 22 October 2026

The account is active and unrestricted. The password currently saved for interactive eAWB login was rejected by `/api/authenticate`. The original Sameday welcome email dated 14 February 2025 contains different credentials; those successfully authenticate against the live API. The valid API password is stored as a Vercel Secret for Production and the `feature/site-audit-preview` Preview branch, never in this repository. The other six Sameday API settings are configured in Production and Preview.

The live API returned 21 services, including **7 / 24H** and **15 / Locker NextDay**, and 7,400 lockers. A website-specific pickup was created and re-read through the API: **511840**, alias **E-Store House - estorehouse.ro**, Strada Targului nr. 8-10, Dragodana, Dambovita, 137200. Its contact **707870** is Mihai Popescu, phone 0729758396, email **orders@estorehouse.ro**. It is active and not the account default. Existing eMAG pickup points and the account login address were preserved.

The actual TypeScript adapter authenticated and read services/pickups, revalidated locker ID 2, and received both price estimates successfully. For the single sample parcel **2 kg, 30 × 30 × 10 cm**, from the new pickup to Sectorul 4, Bucuresti, the API returned **27.72 Ron / 24 hours** for home delivery and **17.50 Ron / 24 hours** for Locker NextDay. These are sample quotes, not a universal tariff or a confirmed promise for all destinations/parcels. No AWB or shipment was created.

Store paid-order email already goes to `orders@estorehouse.ro`; the new Sameday website pickup contact now uses the same email. Global account-login/ticket notification settings still belong to the existing Yahoo identity; changing that login is not necessary for this integration.

## Checkout update — 22 October 2026

The owner accepted fixed customer fees of **27.72 lei home / 17.50 lei easybox**, and confirmed delivery in **1–3 business days**. These fees, `STORE_SAMEDAY_ENABLED=true`, `STORE_SAMEDAY_DYNAMIC_RATES=true`, and the delivery/shipping public text are now saved as Config values for **Production and Preview** in Vercel. Public card-payment checkout remains gated by its separate readiness/activation settings and EuPlătesc live approval.

`POST /api/shipping/quote` requotes catalog prices on the server, validates customer contact/address and the actual provider locker, then returns the final transport charge with a signed ten-minute confirmation. Checkout independently verifies that confirmation against current catalog prices, quantities, customer data, method and locker; expired, modified or stale confirmations cannot start payment. The UI refreshes expired quotes and hides a stale total while recalculating. Shipping and merchandise totals displayed immediately before payment come from the server quote.

For complete, source-labelled packed SKU profiles, Sameday rate estimation is available directly at checkout. Incomplete profiles use only the accepted fixed fee; a provider failure when estimating a measured parcel does not silently substitute another price. The current SKU profiles file is empty because packed weights have not been confirmed, so current customer quotes use the accepted fixed fees. Actual packed weight/dimensions remain mandatory for AWB creation. No inferred weights are sent to Sameday. Free shipping at 900 lei after discount and the three-set easybox cap remain enforced.

## Vercel environment configuration

Set secrets through Project Settings → Environment Variables. Never put passwords in GitHub or a public `NEXT_PUBLIC_` variable.

| Variable | Value / source |
| --- | --- |
| `SAMEDAY_MODE` | `live` for the real account; `test` only with distinct sandbox credentials |
| `SAMEDAY_API_USERNAME`, `SAMEDAY_API_PASSWORD` | Original credentials verified against live API; stored as Vercel Secret/config |
| `SAMEDAY_PICKUP_POINT_ID` | `511840`, verified website pickup in Dragodana |
| `SAMEDAY_CONTACT_PERSON_ID` | `707870`, contact email `orders@estorehouse.ro` |
| `SAMEDAY_HOME_SERVICE_ID` | `7` (24H), returned for this API account |
| `SAMEDAY_LOCKER_SERVICE_ID` | `15` (Locker NextDay), returned for this API account |
| `STORE_SAMEDAY_SHIPPING_RON` | `27.72`, owner-accepted final customer home-delivery fee |
| `STORE_SAMEDAY_EASYBOX_SHIPPING_RON` | `17.50`, owner-accepted final customer easybox fee |
| `STORE_SAMEDAY_DYNAMIC_RATES` | `true`; live quotes only when all packed SKU profiles are complete |
| `STORE_SAMEDAY_ENABLED` | `true` after credentials, IDs and fees have been verified |
| `SAMEDAY_AWB_ENABLED` | `true` after a successful connection/rate check and durable shipment storage setup |

Rebuild the deployment after changing configuration. Existing checkout/payment readiness checks still apply. Sameday test credentials cannot issue AWBs for actual paid orders through the admin endpoint.

For Supabase order storage, apply `supabase/migrations/20261022_estore_shipments.sql`. Its private table uses one row per order, RLS, and service-role access only. The existing Redis storage works without a schema migration. A storage failure prevents AWB creation.

## Customer behavior

- The owner confirmed on 22 October that **each packed bedding set is 40 × 40 × 10 cm**. This source is recorded in `src/data/shipping-package-dimensions.json`, separately from complete, weight-bearing SKU packing profiles. Two or three stacked units would occupy 40 × 40 × 20 or 40 × 40 × 30 cm before any added outer packaging; their final packed measurements must still fit the easybox limits. No bedding weight was confirmed in that conversation, so this dimensional record does not enable dynamic checkout pricing or populate a fabricated weight.
- Supplier Store API checks of all 40 published models and the eight size variants found declared weight **2.4 kg** on 14 Finet models, but no transport dimensions. These are supplier-declared product weights, not verified final parcel weights. Toppers, mattresses and sun-lounger covers require separate measurements; the owner's approximate statement about other goods is not a measured SKU profile.
- Home and easybox have distinct server-confirmed fees. Shipping remains free at 900 lei merchandise value after the existing discount.
- On 22 October the owner confirmed the easybox rule: small parcels only, no toppers/mattresses, and no more than **three bedding sets** across the entire cart. The same rule is checked in checkout on the server; browser values cannot bypass it. A bedding set with a mattress cover is still bedding, not a mattress.
- Other small goods require a measured, source-labelled SKU package profile in `src/data/shipping-packages.json`; unknown or oversized parcels are not eligible. This file intentionally contains no invented measurements. Mixed carts require a verifiable packing profile for all items.
- Customers search the account's current locker list by locality/address and choose a named locker. The API revalidates the selected provider ID at checkout. Its ID, name, address, locality and county are stored with the order and shown in customer/merchant email.
- Actual packed weight and dimensions must be entered when preparing the AWB; oversized parcels are rejected for easybox even when the cart quantity was eligible.

## Administration

`/admin/comenzi` → **Conectare Sameday** checks API access and lists services and pickup points. Credentials stay on the server. For an actual paid Sameday order, the shipping section estimates cost, creates an AWB and downloads the A6 label. The admin must first verify EuPlatesc's delivery permission. The provider's estimate does not silently change the shipping charge already accepted by the customer. COD is zero for these card-paid orders.

A durable reservation is created **before** calling Sameday. Concurrent/repeated requests cannot issue another AWB for the order. If a request times out or saving its result fails, the reservation remains blocked: check `estore-<order ID>` in eAWB and reconcile it before any manual reissue. Automatic retries/reset of uncertain AWBs are deliberately absent.

## Validation and remaining activation work

Local TypeScript, lint, production build and automated tests cover the packing rules, server checkout enforcement, locker validation, PHP-compatible nested form encoding, token refresh on reads, and duplicate/uncertain AWB outcomes. All provider traffic in automated tests is mocked. Live authentication, account metadata, locker validation and sample price estimates are now verified. The owner-accepted customer fees and delivery timeframe are configured in Production and Preview. A paid end-to-end checkout, AWB creation and real label download remain untested against production services.

Official protocol reference: [Sameday Courier PHP SDK](https://github.com/sameday-courier/php-sdk), particularly `SamedayAuthenticateRequest`, `SamedayPostAwbRequest`, `SamedayPostAwbEstimationRequest` and `SamedayGetLockersRequest`.

The API identifies currency as `Ron`; the adapter normalizes it to `RON`. Authenticated requests identify the integration with `User-Agent` and `X-Platform` headers, following the official SDK pattern. These details were verified by the live adapter smoke check.

## COD update — 22 October

The owner explicitly requested **cash on delivery at the home address**, usable immediately without EuPlătesc live approval. Checkout now offers separate `card` and `cod` methods. `STORE_COD_ENABLED=true` enables COD independently when durable storage, notifications, merchant contact/delivery information, public origin and live Sameday home delivery are ready. `STORE_CHECKOUT_ENABLED` remains the card-activation flag and cannot enable test-mode card payments. The initial release limited COD to home delivery; the easybox update below supersedes that limitation. Other couriers remain excluded.

A COD order is saved as `pending_cod`, never as paid, and returns its order number/status page without generating EuPlătesc fields. A repeat of the same unchanged COD intent returns the existing order instead of creating or emailing twice. A notification failure does not lose the saved order; an authenticated admin can retry its confirmation using `/api/admin/cod-notification`. Receipts clearly state the total payable to the courier. The signed shipping confirmation also binds the payment method. COD currently retains the approved fixed home fee (or free transport above the threshold), so the estimator cannot silently omit/add a COD commission.

Sameday AWBs set `cashOnDelivery` to the persisted **whole order total including customer shipping**, `cashOnDeliveryReturns=1` (client), and `awbPayment=1` (sender pays the carrier, so the client is not charged shipping twice). Card AWBs retain zero COD. COD dispatch requires manual verification of the order/address/amount, without a EuPlătesc permission checkbox; actual package measurements and durable duplicate-AWB protection still apply.

Redis production records use `estore:production:*`; Preview keeps the existing `estore:*` test namespace. `STORE_ORDER_STORAGE=redis` explicitly selects the verified Redis store, bypassing the obsolete unrelated Supabase checkout configuration. Supabase installations must apply `20261022_estore_cod.sql` before accepting the new status. EuPlătesc callbacks/storage updates cannot mark a COD order paid.

## Order cancellation in E-Store Control

The owner requested cancellation controls on 22 October. The signed integration now permits only the additional `/api/control/cancel` operation, with the exact JSON body hash included in its POST signature. A cancellation requires an explicit confirmation and a customer-facing reason. Order history and totals are preserved. A single Redis Lua operation prevents cancellation and AWB issuance from racing: cancellation without a shipment completes immediately; an existing shipment makes the order `cancel_requested` and blocks labels/new shipments. Only the initial cancellation claimant may send the Sameday DELETE request, never an automatic retry. Existing live AWBs are checked with `GET /api/client/awb/{awb}/status`; cancellation uses the official SDK's `DELETE /api/awb/{awb}`. Delivered parcels and uncertain AWBs remain under review for manual courier/return resolution. “Check cancellation” only reads courier status and completes cancellation after confirmation. Cancelled orders notify customer and merchant, with an explicit retry for email failure. Paid card cancellations require a separate EuPlătesc refund; late payment callbacks preserve cancellation and flag/reforward the refund review instead of reopening fulfillment. No automatic refund, stock return, invoice cancellation or accounting operation is claimed or performed. Tests use a local disposable Redis database and mocked courier calls; no real customer order is cancelled as QA.


## Easybox COD update — 22 October

The owner requested card payment at locker collection. Sameday's official easybox terms, section 7.1, confirm COD at the easybox POS exclusively by bank card: https://sameday.ro/restrictii-si-conditii-de-transport-in-easybox/ . This is carrier-collected COD, independent of EuPlătesc online payment activation.

The checkout quote, signed binding, server order creation and Sameday AWB payload now support `paymentMethod=cod` with `shippingMethod=easybox`. A provider-validated locker is saved with the order. The order remains `pending_cod`; the full total after discount plus customer shipping is sent as `cashOnDelivery`, with service 15, `lockerLastMile`, `cashOnDeliveryReturns=1`, and sender-paid carrier transport. The current approved customer fee remains 17.50 lei, or free shipping at the existing threshold. No commission or parcel weight is fabricated. Email confirmations, public status, payment terms and E-Store Control identify payment by card at collection, not an already paid online transaction. Home COD remains available. Server/AWB amount limits are 5,000 lei for home COD and 10,000 lei for easybox COD, consistent with Sameday's published cash/card limits (https://sameday.ro/termeni-si-conditii/).

The three-bedding-set limit, topper/mattress exclusion, measured-profile requirement for other products, live locker validation and actual parcel dimensions/weight at AWB creation remain enforced. Automated tests cover locker COD shipping quote through saved unpaid order and full-total AWB payload, invalid lockers, eligibility restrictions, amount limits and notification wording. Tests do not place a real order or issue an AWB. Historical Sameday account records also show locker COD with transferred collection; no new carrier transaction was made during this verification.
