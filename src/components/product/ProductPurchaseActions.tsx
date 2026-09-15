"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatProductPrice, formatProductPriceRange, type Product } from "@/lib/products";

type ProductPurchaseActionsProps = {
  product: Product;
};

export default function ProductPurchaseActions({ product }: ProductPurchaseActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const [selectedId, setSelectedId] = useState<number | undefined>(undefined);
  const selected = product.variants?.find((variant) => variant.id === selectedId);
  const cartProduct = selected ? {
    ...product, id: selected.id, price: selected.price, sku: selected.sku,
    name: `${product.name} — ${selected.name} (${selected.dimensions})`,
  } : product;

  return (
    <div className="mt-6">
      {product.variants?.length ? (
        <>
          <p aria-live="polite" aria-atomic="true" className="text-3xl font-bold text-[#251136]">
            {selected ? formatProductPrice(selected.price, product.currency) : formatProductPriceRange(product)}
          </p>
          <fieldset className="mt-5">
            <legend className="text-sm font-semibold text-[#251136]">Alege dimensiunea</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.variants?.map((variant) => (
                <label key={variant.id} className={`cursor-pointer rounded-xl border px-4 py-3 text-sm ${selected?.id === variant.id ? "border-[#251136] bg-[#251136] text-white" : "border-[#e7def2] text-[#251136]"}`}>
                  <input type="radio" name={`size-${product.id}`} value={variant.id}
                    checked={selected?.id === variant.id} onChange={() => setSelectedId(variant.id)}
                    className="mr-2 accent-purple-700" />
                  {variant.name} — {variant.dimensions}
                </label>
              ))}
            </div>
          </fieldset>
          <p className="mt-3 text-sm text-[#251136]/85">{selected ? selected.contents : "Selectează dimensiunea pentru prețul exact."}</p>
          {selected ? <p className="mt-2 text-sm text-[#251136]" aria-live="polite">Cod produs (SKU / cod de bare): <strong>{selected.sku}</strong></p> : null}
        </>
      ) : null}
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-full border border-[#251136]">
        <button
          className="px-4 py-2 text-[#251136]"
          onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
        >
          -
        </button>
        <span className="min-w-10 text-center text-sm font-semibold text-[#251136]">{quantity}</span>
        <button className="px-4 py-2 text-[#251136]" onClick={() => setQuantity((prev) => prev + 1)}>
          +
        </button>
      </div>

      <button
        className="disabled:cursor-not-allowed disabled:opacity-50 rounded-full bg-[#251136] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#321747]"
        disabled={Boolean(product.variants?.length && !selected)}
        onClick={() => { if (!product.variants?.length || selected) addItem(cartProduct, quantity); }}
      >
        Adauga in cos
      </button>
    </div>
    </div>
  );
}
