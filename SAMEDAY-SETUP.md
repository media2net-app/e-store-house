# Sameday integration for estorehouse.ro

## Current evidence — 22 October 2026

The owner confirmed that the eAWB account is active and unrestricted. The add-shipment form opens and lists NextDay home and Locker NextDay services. This removes the earlier account-inactivity blocker. An authenticated browser session is not an API credential: no API authentication, live rate estimate, AWB or label download has been verified against this account yet.

The Dragodana pickup point `371866` has contact `538851` (Mihai Popescu) and still displays the old Yahoo email. The account's default pickup remains a different address in Targoviste; do not auto-select that default for website shipments. Verify these IDs through the API before setting them. Other Dragodana points are labelled eMag and should not be silently reused for direct website orders.

The store's paid-order emails already target `orders@estorehouse.ro`. The Sameday account contact and ticket notifications are separate: eAWB's notification settings expose ticket-event checkboxes but no editable destination email. Changing the Sameday contact to `orders@estorehouse.ro` may require Sameday support. No support message or account-contact change has been made.

## Vercel environment configuration

Set secrets through Project Settings → Environment Variables. Never put passwords in GitHub or a public `NEXT_PUBLIC_` variable.

| Variable | Value / source |
| --- | --- |
| `SAMEDAY_MODE` | `live` for the real account; `test` only with distinct sandbox credentials |
| `SAMEDAY_API_USERNAME`, `SAMEDAY_API_PASSWORD` | Assigned API credentials; not yet supplied |
| `SAMEDAY_PICKUP_POINT_ID` | Verified website pickup in Dragodana |
| `SAMEDAY_CONTACT_PERSON_ID` | Verified contact belonging to that pickup |
| `SAMEDAY_HOME_SERVICE_ID` | Home service ID returned for this API account |
| `SAMEDAY_LOCKER_SERVICE_ID` | Locker NextDay ID returned for this API account |
| `STORE_SAMEDAY_SHIPPING_RON` | Confirmed final customer home-delivery fee, including any applicable charges |
| `STORE_SAMEDAY_EASYBOX_SHIPPING_RON` | Confirmed final customer easybox fee |
| `STORE_SAMEDAY_ENABLED` | `true` after credentials, IDs and fees have been verified |
| `SAMEDAY_AWB_ENABLED` | `true` after a successful connection/rate check and durable shipment storage setup |

Rebuild the deployment after changing configuration. Existing checkout/payment readiness checks still apply. Sameday test credentials cannot issue AWBs for actual paid orders through the admin endpoint.

For Supabase order storage, apply `supabase/migrations/20261022_estore_shipments.sql`. Its private table uses one row per order, RLS, and service-role access only. The existing Redis storage works without a schema migration. A storage failure prevents AWB creation.

## Customer behavior

- Home and easybox have distinct server-confirmed fees. Shipping remains free at 900 lei merchandise value after the existing discount.
- On 22 October the owner confirmed the easybox rule: small parcels only, no toppers/mattresses, and no more than **three bedding sets** across the entire cart. The same rule is checked in checkout on the server; browser values cannot bypass it. A bedding set with a mattress cover is still bedding, not a mattress.
- Other small goods require a measured, source-labelled SKU package profile in `src/data/shipping-packages.json`; unknown or oversized parcels are not eligible. This file intentionally contains no invented measurements. Mixed carts require a verifiable packing profile for all items.
- Customers search the account's current locker list by locality/address and choose a named locker. The API revalidates the selected provider ID at checkout. Its ID, name, address, locality and county are stored with the order and shown in customer/merchant email.
- Actual packed weight and dimensions must be entered when preparing the AWB; oversized parcels are rejected for easybox even when the cart quantity was eligible.

## Administration

`/admin/comenzi` → **Conectare Sameday** checks API access and lists services and pickup points. Credentials stay on the server. For an actual paid Sameday order, the shipping section estimates cost, creates an AWB and downloads the A6 label. The admin must first verify EuPlatesc's delivery permission. The provider's estimate does not silently change the shipping charge already accepted by the customer. COD is zero for these card-paid orders.

A durable reservation is created **before** calling Sameday. Concurrent/repeated requests cannot issue another AWB for the order. If a request times out or saving its result fails, the reservation remains blocked: check `estore-<order ID>` in eAWB and reconcile it before any manual reissue. Automatic retries/reset of uncertain AWBs are deliberately absent.

## Validation and remaining activation work

Local TypeScript, lint, production build and automated tests cover the packing rules, server checkout enforcement, locker validation, PHP-compatible nested form encoding, token refresh on reads, and duplicate/uncertain AWB outcomes. All provider traffic in automated tests is mocked. Live provider authentication, fees, an approved end-to-end order and a real label remain unverified until API credentials are supplied.

Official protocol reference: [Sameday Courier PHP SDK](https://github.com/sameday-courier/php-sdk), particularly `SamedayAuthenticateRequest`, `SamedayPostAwbRequest`, `SamedayPostAwbEstimationRequest` and `SamedayGetLockersRequest`.
