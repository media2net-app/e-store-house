import { readFileSync, writeFileSync } from 'node:fs';
const [controlPath, supplierPath] = process.argv.slice(2);
if (!controlPath || !supplierPath) throw new Error('Pass the verified live Control export and supplier catalog JSON.');
const control = JSON.parse(readFileSync(controlPath));
const supplier = JSON.parse(readFileSync(supplierPath));
const read = (name) => JSON.parse(readFileSync(new URL('../' + name, import.meta.url)));
const products = read('src/data/products.json');
const publicSkus = new Set(products.flatMap((product) => (product.variants ?? [product]).map((variant) => variant.sku)));
const parents = new Map(supplier.map((product) => [String(product.id), product]));
const variants = new Map(supplier.flatMap((product) => (product.variations ?? []).map((variant) => [String(variant.id), product])));
const archive = read('catalog-review/products-on-hold.json').products;
const heldBySku = new Map(archive.flatMap((record) => (record.product.variants ?? [record.product]).filter((item) => item.sku).map((item) => [item.sku, record])));
const rejected = new Set(read('catalog-review/expanded-import-20261022.json').models.filter((record) => record.status === 'held').map((record) => String(record.id)));
const articles = control.products.map((product) => {
  const source = parents.get(product.sku) ?? variants.get(product.sku);
  const ready = publicSkus.has(product.sku);
  const reasons = [];
  if (!ready) {
    if (!source) reasons.push('supplier_barcode_or_model_not_matched');
    if (parents.get(product.sku)?.type === 'variable') reasons.push('supplier_parent_code_needs_purchaseable_variant_mapping');
    if (new Set(product.images ?? []).size < 4) reasons.push('fewer_than_four_images');
    if (!product.description) reasons.push('application_description_missing');
    reasons.push(...(heldBySku.get(product.sku)?.reasonCodes ?? []));
    if (rejected.has(product.sku)) reasons.push('current_visual_review_rejected_supplier_original_or_near_duplicate');
    reasons.push('storefront_gallery_and_copy_review_pending');
  }
  return {
    appBarcode: product.barcode, sku: product.sku, appModel: product.model, title: product.title, category: product.category,
    imageCount: new Set(product.images ?? []).size, supplierModelId: source?.id ?? null, supplierUrl: source?.permalink ?? null,
    status: ready ? 'reviewed_storefront_sku' : 'not_ready_for_storefront', reasons: [...new Set(reasons)],
  };
});
const pendingReasons = {};
for (const article of articles) for (const reason of article.reasons) pendingReasons[reason] = (pendingReasons[reason] ?? 0) + 1;
const summary = {
  liveControlArticles: articles.length, supplierMatchedArticles: articles.filter((article) => article.supplierModelId !== null).length,
  supplierModelGroups: new Set(articles.filter((article) => article.supplierModelId).map((article) => article.supplierModelId)).size,
  reviewedStorefrontModels: products.length, reviewedStorefrontSkus: publicSkus.size,
  controlArticlesCoveredByPublicSkus: articles.filter((article) => article.status === 'reviewed_storefront_sku').length,
  pendingControlArticles: articles.filter((article) => article.status !== 'reviewed_storefront_sku').length,
  applicationMissingDescriptions: control.products.filter((product) => !product.description).length,
  applicationFewerThanFourImages: articles.filter((article) => article.imageCount < 4).length,
  unmatchedSupplierArticles: articles.filter((article) => article.supplierModelId === null).length, pendingReasons,
};
writeFileSync(new URL('../catalog-review/control-publication-audit-20261022.json', import.meta.url), JSON.stringify({
  checkedAt: control.checkedAt, status: 'full_control_audit_complete_partial_catalog_ready',
  note: 'Control counts are articles/SKUs. Storefront cards group dimensions by the supplier model. Incomplete or conflicting source/gallery records remain unpublished. Four existing Jersey SKU configurations are source-verified but absent from Control by that exact SKU.',
  summary, articles,
}, null, 2) + '\n');
console.log(summary);
