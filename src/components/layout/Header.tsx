"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";

const navItems = [
  { label: "Acasa", href: "/" },
  { label: "Magazin", href: "/shop" },
  { label: "Categorii", href: "/categorii" },
  { label: "Despre noi", href: "#" },
  { label: "Contact", href: "#" },
];

export default function Header() {
  const { totalItems, openCart } = useCart();

  return (
    <header className="border-b border-[#e7def2] bg-white">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 py-4">
        <div>
          <p className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#251136]">
            E-Store House
          </p>
          <p className="text-xs text-[#251136]">Magazinul tau online</p>
        </div>
        <nav className="hidden gap-6 text-sm font-medium text-[#251136] md:flex">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="transition hover:text-[#321747]">
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          className="rounded-full bg-[#251136] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#321747]"
          onClick={openCart}
        >
          Cos ({totalItems})
        </button>
      </div>
      <nav aria-label="Navigare mobil" className="flex gap-5 overflow-x-auto border-t border-[#e7def2] px-4 py-3 text-sm font-medium text-[#251136] md:hidden">
        {navItems.slice(0, 3).map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
      </nav>
    </header>
  );
}
