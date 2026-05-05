"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import type { Product } from "@/lib/products";

type ProductPurchaseActionsProps = {
  product: Product;
};

export default function ProductPurchaseActions({ product }: ProductPurchaseActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
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
        className="rounded-full bg-[#251136] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#321747]"
        onClick={() => addItem(product, quantity)}
      >
        Adauga in cos
      </button>
    </div>
  );
}
