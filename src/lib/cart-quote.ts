import "server-only";

import { cartOffers } from "@/lib/cart-offers";
import { allProducts, type Product } from "@/lib/products";

export type RequestedCartLine = { productId: number; quantity: number };
export type QuotedCartLine = {
  productId: number;
  superSale: boolean;
  sku?: string;
  bundleComponents?: Product["bundleComponents"];
  name: string;
  category: string;
  categoryPath?: string;
  price: number;
  currency: string;
  image: string;
  quantity: number;
};

export function quoteCart(requested: unknown, catalog: Product[] = allProducts) {
  if (!Array.isArray(requested) || requested.length === 0 || requested.length > 30) {
    throw new Error("Coșul este gol sau prea mare.");
  }
  const seen = new Set<number>();
  const lines: QuotedCartLine[] = requested.map((entry: unknown) => {
    if (!entry || typeof entry !== "object") throw new Error("Produs invalid în coș.");
    const { productId, quantity } = entry as Partial<RequestedCartLine>;
    if (!Number.isSafeInteger(productId) || !Number.isSafeInteger(quantity)
      || !productId || !quantity || quantity < 1 || quantity > 20 || seen.has(productId)) {
      throw new Error("Produs sau cantitate invalidă în coș.");
    }
    seen.add(productId);
    const product = catalog.find((item) => item.id === productId || item.variants?.some((variant) => variant.id === productId));
    const variant = product?.variants?.find((item) => item.id === productId);
    if (!product || product.inStock === false || (product.variants?.length && !variant)
      || variant?.inStock === false || !["RON", "Lei"].includes(product.currency)) {
      throw new Error("Un produs din coș nu mai este disponibil.");
    }
    const available = variant?.stockQuantity ?? product.stockQuantity;
    if (available !== undefined && quantity > available) throw new Error('Cantitatea solicitată depășește stocul disponibil.');
    const price = variant?.price ?? product.price;
    if (!Number.isFinite(price) || price <= 0) throw new Error("Prețul unui produs nu este valid.");
    return {
      category: product.category, categoryPath: product.categoryPath,
      productId, quantity, price, currency: product.currency, superSale: product.tag === "Super Sale",
      sku: variant?.sku ?? product.sku,
      bundleComponents: variant?.bundleComponents ?? product.bundleComponents,
      name: variant ? `${product.name} — ${variant.name}` : product.name,
      image: variant?.images?.[0] ?? product.image,
    };
  });
  return { lines, totals: cartOffers(lines) };
}

// Restoring browser storage may discard stale lines; checkout always uses strict quoteCart.
export function restoreCart(requested: unknown, catalog: Product[] = allProducts) {
  if (!Array.isArray(requested) || requested.length > 30) throw new Error("Coș salvat invalid.");
  const lines: QuotedCartLine[] = [];
  const seen = new Set<number>();
  let removedCount = 0;
  for (const entry of requested) {
    try {
      const line = quoteCart([entry], catalog).lines[0];
      if (seen.has(line.productId)) throw new Error("Produs repetat.");
      seen.add(line.productId);
      lines.push(line);
    } catch {
      removedCount += 1;
    }
  }
  return { lines, totals: cartOffers(lines), removedCount };
}
