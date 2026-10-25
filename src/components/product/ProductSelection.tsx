"use client";

import { createContext, useContext, useState, useSyncExternalStore } from "react";
import type { Product } from "@/lib/products";

type Variant = NonNullable<Product["variants"]>[number];
const SelectionContext = createContext<{
  selected?: Variant;
  select: (id: number) => void;
} | null>(null);

const subscribeVariant = (callback: () => void) => {
  window.addEventListener('popstate', callback);
  return () => window.removeEventListener('popstate', callback);
};
const readVariant = () => new URLSearchParams(window.location.search).get('varianta') || '';
const serverVariant = () => '';

export function ProductSelection({ variants, children }: {
  variants: Product["variants"];
  children: React.ReactNode;
}) {
  const [selectedId, setSelectedId] = useState<number>();
  const linkedVariant = useSyncExternalStore(subscribeVariant, readVariant, serverVariant);
  const selected = variants?.find((variant) => variant.id === (selectedId ?? Number(linkedVariant)) && variant.inStock !== false);
  return <SelectionContext.Provider value={{ selected, select: setSelectedId }}>{children}</SelectionContext.Provider>;
}

export const useProductSelection = () => useContext(SelectionContext);
