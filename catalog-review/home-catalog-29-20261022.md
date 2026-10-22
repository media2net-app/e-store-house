# Home and catalog revision — 22 October 2026

## Merchant instructions

- Replace plum bedding with a more expensive coverlet; show several quilts nearby.
- Visible natural camera motion for 4–5 seconds, once per Home arrival; no pause button.
- Prominent message about textiles made in Romania at Pucioasa; no supplier name in the opening message.
- Publish the Control catalog; supplier cost +29%, rounded UP to a whole leu ending in 9, for every saleable configuration.

## Scene

Final built-in ImageGen asset: `public/editorial/maison-nomada-v4.webp`, 1536 × 1024, converted from `exec-b8a64a4d-37ad-45a3-9ba7-2b5d747aad73.png`. Earlier versions retained.
The reviewed Nomada V1 coverlet (158272) is the main product; quilts 98809 / 98785 / 98797 sit on the bench, with towels, robe and merchant-described wrapped mattress. Product print, fringe, diamond quilting and colour relationships compared with all four actual gallery references.
A 4.8-second camera opening from 1.09 to 1.0 replaces the imperceptible 24-second motion. It runs once and stays still; effect setup replays on Home mount/path return, with pageshow support for browser restoration. Reduced-motion preference remains respected. No independent cloth motion or generated video is claimed.

The homepage opening contains no Ralex name. Copy explicitly distinguishes local textiles from international collections: no unsupported claim that every item/brand is manufactured locally. Sources inspected: https://ralexpucioasa.ro/ and https://www.clasyevi.com/hakkimizda.
“Peste 1.200 de articole” describes the verified Control portfolio (1,337 articles), with “Descoperă selecția disponibilă online.” It is not presented as a count of live model cards.

## Catalog and pricing evidence

- Read the complete live Control products table with the Sites connector, following returned offsets: 1,337 unique records. Fifty long projected JSON cells were truncated by the connector; every row's revision/updated matched complete backup (18), enabling exact recovery. No private customer/order data exported.
- Supplier public catalog: 2,426 parents read; matched 1,268 Control SKUs to 870 supplier models/variants; 69 internal/unmatched codes require resolution.
- 50 models / 148 SKUs imported from the fully reviewed second 22 October batch, preserving variant galleries and numeric supplier identifiers.
- 65 additional model candidates checked in 13 source + four-photo contact sheets. 54 models / 65 SKUs passed. Eleven supplier-original/near-duplicate cases remain held. Four earlier 19 October quilt candidates with conflicting cotton/polyester claims and ten partial-composition Finet models excluded before this visual selection; 21 October unresolved source issues also excluded.
- Final prepared catalog: 187 models / 351 saleable SKUs, all with their own verified supplier costs, +29% and ending in 9. Parent price is the cheapest variant. The former +80% rule is superseded; historical audit snapshots retain their original history.
- Build validation checks every published SKU against the supplier evidence, prevents duplicate SKUs and rejects a wrong parent minimum. Gallery/copy fingerprints remain independent.
- Merchant 40 × 40 × 10 cm bedding guidance added for 161 previously unmapped linen SKUs. No weights invented; final packed measurement remains required.
- Full Control publication audit is in `control-publication-audit-20261022.json`: 347 Control article SKUs covered by public SKUs, four additional existing source-verified Jersey configurations absent from Control under those exact SKUs; 990 Control articles remain unready for storefront publication. They were not silently activated. Categories/size variants follow supplier hierarchy.

## Final ImageGen prompt

Use case: precise-object-edit. Asset type: E-Store House luxury homepage photograph, landscape 3:2.
Image 1 is the room/layout target. Images 2–5 are exact product references.
Replace ALL plum geometric bedding in image 1 with the expensive grey/ivory Nomada V1 muslin coverlet and its TWO matching large cushion covers from image 2, preserving the exact small geometric bands, grey/white relationship, fringe edges and quilt texture. Arrange coverlet generously across the bed with a graceful natural folded back corner showing its documented lighter side. No plum patterned fabric remains anywhere. Ivory upholstered headboard within sculptural walnut curved frame.
Replace the stack on the bench and blue blanket with THREE neatly folded or softly rolled quilts next to one another: butter diamond-quilted duvet from image 3; soft grey diamond-quilted duvet from image 4; powder pink diamond-quilted duvet from image 5. All three separate, identifiable, tactile and plush, at believable scale. Keep the Greek-border cream towel stack, cappuccino robe on standing rail and compact cylindrical white vacuum-wrapped mattress on floor from image 1; keep fully visible. Keep a little room around edges for a gentle camera animation without hiding products. Bright luxury European suite, same consistent soft daylight, bronze/travertine/walnut furniture, fresh ivory and grey palette with powder pink/cream accents. Real textile folds, fine weave, accurate print, natural contact shadows. No floating products, no collage, no lettering, no labels, no logos, no people, no theatrical effects. High-end editorial interiors photo, not plastic CGI.


## Validation and verification limit

- Clean production build and catalog validator passed: 187 models, 351 uniquely priced configurations.
- All 63 tests passed with disposable real Redis and fixture-only mail/courier services; zero skipped. Updated the previous 80% policy test and the explicit COD journey expectation to the new 29% prices (449.60 RON total).
- HTTP cart quote verification exercised every one of the 351 saleable product/variant IDs: correct SKU and price on every line. No order or AWB created.
- Generated home HTML/CSS checks confirm the new scene, large local-production message, portfolio wording, 4.8-second finite animation, no pause button, reduced-motion rule and portrait product frames.
- Final live visual/motion QA could not be completed: native Safari and Chrome surfaces both returned cgWindowNotFound, and native app launch is unavailable. Previous revision's desktop/mobile framing was visually checked, but that does not verify this revision's new arrival/re-entry animation. Do not claim a successful browser visual or back-navigation test for this revision.
