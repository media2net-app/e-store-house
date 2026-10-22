# Sameday integration for estorehouse.ro

## Current evidence — 22 October 2026

The account is active and unrestricted. The password currently saved for interactive eAWB login was rejected by `/api/authenticate`. The original Sameday welcome email dated 14 February 2025 contains different credentials; those successfully authenticate against the live API. The valid API password is stored as a Vercel Secret for Production and the `feature/site-audit-preview` Preview branch, never in this repository. The other six Sameday API settings are configured in Production and Preview.

The live API returned 21 services, including **7 / 24H** and **15 / Locker NextDay**, and 7,400 lockers. A website-specific pickup was created and re-read through the API: **511840**, alias **E-Store House - estorehouse.ro**, Strada Targului nr. 8-10, Dragodana, Dambovita, 137200. Its contact **707870** is Mihai Popescu, phone 0729758396, email **orders@estorehouse.ro**. It is active and not the account default. Existing eMAG pickup points and the account login address were preserved.

The actual TypeScript adapter authenticated and read services/pickups, revalidated locker ID 2, and received both price estimates successfully. For the single sample parcel **2 kg, 30 × 30 × 10 cm**, from the new pickup to Sectorul 4, Bucuresti, the API returned **27.72 Ron / 24 hours** for home delivery and **17.50 Ron / 24 hours** for Locker NextDay. These are sample quotes, not a universal tariff or a confirmed promise for all destinations/parcels. No AWB or shipment was created.

Store paid-order email already goes to `orders@estorehouse.ro`; the new Sameday website pickup contact now uses the same email. Global account-login/ticket notification settings still belong to the existing Yahoo identity; changing that login is not necessary for this integration.

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

Local TypeScript, lint, production build and automated tests cover the packing rules, server checkout enforcement, locker validation, PHP-compatible nested form encoding, token refresh on reads, and duplicate/uncertain AWB outcomes. All provider traffic in automated tests is mocked. Live authentication, account metadata, locker validation and sample price estimates are now verified. The final customer-facing fees await the owner’s choice. A paid end-to-end checkout, AWB creation and real label download remain untested against production services.

Official protocol reference: [Sameday Courier PHP SDK](https://github.com/sameday-courier/php-sdk), particularly `SamedayAuthenticateRequest`, `SamedayPostAwbRequest`, `SamedayPostAwbEstimationRequest` and `SamedayGetLockersRequest`.

The API identifies currency as `Ron`; the adapter normalizes it to `RON`. Authenticated requests identify the integration with `User-Agent` and `X-Platform` headers, following the official SDK pattern. These details were verified by the live adapter smoke check.
