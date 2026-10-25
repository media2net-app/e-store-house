import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { validateSupplierPrices } from "./catalog-pricing.mjs";

const copyKeys = ["id", "sku", "name", "category", "categoryPath", "description", "material", "features", "externalUrl", "image", "images", "bundleComponents"];
const variantKeys = ["id", "sku", "name", "dimensions", "contents", "images", "bundleComponents"];
const pick = (item, keys) => Object.fromEntries(keys.filter((key) => item[key] !== undefined).map((key) => [key, item[key]]));
const canonical = (value) => Array.isArray(value) ? value.map(canonical) : value && typeof value === "object"
  ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])])) : value;
export function catalogFingerprint(product) {
  const snapshot = pick(product, copyKeys);
  if (product.variants) snapshot.variants = product.variants.map((variant) => pick(variant, variantKeys));
  return createHash("sha256").update(JSON.stringify(canonical(snapshot))).digest("hex");
}
export function validateCatalog(products, approvals, heldIds) {
  const approved = new Map(approvals.map((entry) => [entry.id, entry]));
  const held = new Set(heldIds), ids = new Set();
  if (approved.size !== approvals.length) throw new Error("Duplicate catalog approval.");
  for (const product of products) {
    if (ids.has(product.id) || held.has(product.id)) throw new Error(`Duplicate or held product in public catalog: ${product.id}`);
    ids.add(product.id);
    const review = approved.get(product.id);
    if (!review || review.fingerprint !== catalogFingerprint(product)) throw new Error(`Missing or outdated E-Store review: ${product.id}`);
    if (!review.visualReview || review.photographicViews < 4 || !product.description || !product.material) throw new Error(`Incomplete review: ${product.id}`);
    for (const item of [product, ...(product.variants ?? [])]) {
      const images = item.images ?? [];
      if (new Set(images).size < 4 || images.some((url) => !review.media.some((media) => media.url === url && /^[a-f0-9]{64}$/.test(media.sha256)))) throw new Error(`Incomplete reviewed gallery: ${item.id}`);
      if (!(item === product && product.variants?.length) && (typeof item.sku !== "string" || !/^\d+$/.test(item.sku))) throw new Error(`Missing numeric supplier SKU: ${item.id}`);
    }
  }
  if (ids.size !== approved.size) throw new Error("Approval list does not match the public catalog.");
  return ids.size;
}
export function validateCategoryAssignments(products, categories) {
  const paths = new Set(categories.map(category => category.path));
  if (paths.size !== categories.length) throw new Error("Duplicate category path.");
  for (const category of categories) {
    if (category.parent && (!paths.has(category.parent) || !category.path.startsWith(`${category.parent}/`))) {
      throw new Error(`Invalid category parent: ${category.path}`);
    }
  }
  for (const product of products) {
    if (!paths.has(product.categoryPath)) throw new Error(`Unknown category for product: ${product.id}`);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const read = (file) => JSON.parse(readFileSync(new URL("../" + file, import.meta.url), "utf8"));
  const count = validateCatalog(read("src/data/products.json"), read("src/data/catalog-approvals.json"), read("src/data/quality-hold.json"));
  validateCategoryAssignments(read("src/data/products.json"), read("src/data/categories.json"));
  const skus = validateSupplierPrices(read("src/data/products.json"), read("catalog-review/price-verification-29-20261022/results.json"));
  console.log(`E-Store catalog: ${count} reviewed models; no held models included.`);
  console.log(`Verified supplier +29% prices, ending in 9: ${skus} saleable SKUs.`);
}
