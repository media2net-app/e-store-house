import assert from 'node:assert/strict';
export function validateSuperSale(products, offers, evidence) {
  assert.equal(offers.length,30,'The approved campaign must contain exactly 30 models');
  assert.equal(new Set(offers.map(o=>o.id)).size,offers.length,'Duplicate sale model');
  for(const offer of offers){
    const product=products.find(p=>p.id===offer.id);
    assert(product && !product.variants?.length && product.sku===offer.sku,`Wrong campaign SKU ${offer.id}`);
    const cost=evidence.find(p=>p.id===offer.id)?.costs[offer.sku];
    assert.equal(offer.supplierCost,cost,`Supplier cost changed for ${offer.sku}`);
    assert.equal(Math.round(offer.price*100),Math.round(cost*110),`Campaign markup differs from 10%: ${offer.sku}`);
    assert(offer.price>0 && offer.referencePrice>offer.price && offer.referencePrice<=product.price,`Invalid reference price ${offer.sku}`);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(offer.referenceFrom) && offer.referenceFrom<=offer.referenceTo && /^[a-f0-9]{40}$/.test(offer.referenceEvidence),'Missing historical evidence');
  }
  return offers.length;
}
