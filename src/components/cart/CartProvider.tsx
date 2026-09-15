"use client";

import { createContext, useContext, useState } from "react";
import type { Product } from "@/lib/products";
import {
  COMBO_DEAL_DISCOUNT_PERCENT,
  COMBO_DEAL_THRESHOLD,
  formatProductPrice,
  getComboDealUnitPrice,
} from "@/lib/products";

type CartItem = {
  sku?: string;
  productId: number;
  name: string;
  price: number;
  currency: string;
  image: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  isOpen: boolean;
  totalItems: number;
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = (product: Product, quantity: number) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);

      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }

      return [
        ...prev,
        {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          price: product.price,
          currency: product.currency,
          image: product.image,
          quantity,
        },
      ];
    });
    setIsOpen(true);
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, quantity } : item)),
    );
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const value = {
    items,
    isOpen,
    totalItems,
    addItem,
    removeItem,
    updateQuantity,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
  };

  const subtotalByCurrency = items.reduce<Record<string, number>>((acc, item) => {
    const unitPrice = getComboDealUnitPrice(item.price, item.quantity);
    acc[item.currency] = (acc[item.currency] || 0) + unitPrice * item.quantity;
    return acc;
  }, {});

  return (
    <CartContext.Provider value={value}>
      {children}

      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          isOpen ? "pointer-events-auto bg-black/25 opacity-100" : "pointer-events-none bg-black/0 opacity-0"
        }`}
        onClick={() => setIsOpen(false)}
      >
        <aside
          className={`absolute right-0 top-0 h-full w-full max-w-md bg-white p-5 shadow-xl transition-transform duration-300 ease-out ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(event) => event.stopPropagation()}
        >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#251136]">Cosul tau</h2>
              <button
                className="rounded-full border border-[#251136] px-3 py-1 text-sm text-[#251136]"
                onClick={() => setIsOpen(false)}
              >
                Inchide
              </button>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-[#251136]/70">Cosul este gol.</p>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.productId} className="rounded-xl border border-[#e7def2] p-3">
                    <div className="flex gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-16 w-16 rounded-md object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold text-[#251136]">
                          {item.name}
                        </p>
                        {item.sku ? <p className="mt-1 text-xs text-[#251136]/80">Cod produs: {item.sku}</p> : null}
                        <p className="mt-1 text-sm text-[#251136]/80">
                          {formatProductPrice(
                            getComboDealUnitPrice(item.price, item.quantity),
                            item.currency,
                          )}
                        </p>
                        {item.quantity >= COMBO_DEAL_THRESHOLD ? (
                          <p className="mt-1 text-xs font-semibold text-[#251136]">
                            Combo activ: -{COMBO_DEAL_DISCOUNT_PERCENT}% (2+ produse)
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          className="rounded border border-[#251136] px-2"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          -
                        </button>
                        <span className="text-sm font-semibold text-[#251136]">{item.quantity}</span>
                        <button
                          className="rounded border border-[#251136] px-2"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="text-xs font-semibold text-[#251136]/70 underline"
                        onClick={() => removeItem(item.productId)}
                      >
                        Sterge
                      </button>
                    </div>
                  </div>
                ))}

                <div className="rounded-xl bg-[#f6f2fb] p-3">
                  <p className="text-sm font-semibold text-[#251136]">Subtotal</p>
                  {Object.entries(subtotalByCurrency).map(([currency, amount]) => (
                    <p key={currency} className="text-sm text-[#251136]/85">
                      {formatProductPrice(amount, currency)}
                    </p>
                  ))}
                </div>
              </div>
            )}
        </aside>
      </div>
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
