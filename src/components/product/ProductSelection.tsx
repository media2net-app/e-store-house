"use client";

import { createContext, useContext, useState } from "react";
import type { Product } from "@/lib/products";

type Variant = NonNullable<Product["variants"]>[number];
const SelectionContext = createContext<{
  selected?: Variant;
  select: (id: number) => void;
} | null>(null);

export function ProductSelection({ variants, children }: {
  variants: Product["variants"];
  children: React.ReactNode;
}) {
  const [selectedId, setSelectedId] = useState<number>();
  const selected = variants?.find((variant) => variant.id === selectedId);
  return <SelectionContext.Provider value={{ selected, select: setSelectedId }}>{children}</SelectionContext.Provider>;
}

export const useProductSelection = () => useContext(SelectionContext);
