// Merchant instruction, 26 October 2026: add another 30% to website prices.
// Recompute all stages from supplier cost so imports cannot compound increases.
export function supplierSalePrice(costRon) {
  if (!Number.isFinite(costRon) || costRon <= 0) throw new TypeError("A positive verified supplier cost is required.");
  const costCents = Math.round(costRon * 100);
  const previousPrice = Math.max(9, Math.ceil((costCents * 129 - 90000) / 100000) * 10 + 9);
  const basePrice = Math.ceil((previousPrice * 120 - 900) / 1000) * 10 + 9;
  return Math.ceil((basePrice * 130 - 900) / 1000) * 10 + 9;
}

// Merchant instruction, 28 October 2026: newly published Ralex SKUs use the
// supplier's regular public price, excluding the reseller discount, plus 60%.
export function supplierRetailPlus60(retailRon) {
  if (!Number.isFinite(retailRon) || retailRon <= 0) throw new TypeError("A positive verified supplier retail price is required.");
  const retailCents = Math.round(retailRon * 100);
  return Math.round(retailCents * 1.6) / 100;
}

export function validateSupplierPrices(products, evidence) {
  const sources = new Map(evidence.map((entry) => [entry.id, entry]));
  const seenSkus = new Set();
  for (const product of products) {
    const source = sources.get(product.id);
    if (!source || source.error || source.supplierUrl !== product.externalUrl) throw new Error(`Missing supplier cost evidence: ${product.id}`);
    const variants = product.variants ?? [product];
    for (const variant of variants) {
      if (seenSkus.has(variant.sku)) throw new Error(`Duplicate saleable SKU: ${variant.sku}`);
      seenSkus.add(variant.sku);
      const rule = source.pricingRules?.[variant.sku];
      if (rule && rule !== "retail-plus-60") throw new Error(`Unknown pricing rule: ${variant.sku}`);
      const expected = rule === "retail-plus-60"
        ? supplierRetailPlus60(source.costs[variant.sku])
        : supplierSalePrice(source.costs[variant.sku]);
      if (variant.price !== expected) throw new Error(`Price differs from verified supplier pricing rule: ${variant.sku}`);
    }
    if (product.price !== Math.min(...variants.map((variant) => variant.price))) throw new Error(`Parent must use cheapest variant: ${product.id}`);
  }
  return seenSkus.size;
}
