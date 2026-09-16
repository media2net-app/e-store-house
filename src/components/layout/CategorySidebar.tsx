"use client";

import Link from "next/link";
import { useId, useState } from "react";

type CategoryItem = { path: string; name: string; parent: string | null; count: number };
type SidebarProps = { items: CategoryItem[]; activePath?: string };
const href = (path: string) => `/shop?categorie=${encodeURIComponent(path)}`;

function CategoryBranch({ category, items, activePath }: SidebarProps & { category: CategoryItem }) {
  const children = items.filter((item) => item.parent === category.path);
  const selected = activePath === category.path;
  const ancestor = activePath?.startsWith(`${category.path}/`) ?? false;
  const [pinned, setPinned] = useState(ancestor || selected);
  const [hovered, setHovered] = useState(false);
  const open = pinned || hovered;
  const panelId = useId();

  return <li className={`sidebar-branch${selected ? " is-selected" : ""}${ancestor ? " is-ancestor" : ""}`}
    onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(true); }}
    onPointerLeave={() => setHovered(false)}>
    <div className="sidebar-row">
      {children.length ? <button type="button" className="sidebar-category" aria-expanded={open} aria-controls={panelId}
        onClick={() => { setPinned(!pinned); setHovered(false); }}>
        <span>{category.name}</span><small>{category.count}</small><span className="sidebar-chevron" aria-hidden="true">›</span>
      </button> : <Link href={href(category.path)} aria-current={selected ? "page" : undefined}>
        <span>{category.name}</span><small>{category.count}</small>
      </Link>}
    </div>
    {children.length ? <div id={panelId} className="sidebar-panel" data-open={open} inert={!open}>
      <div className="sidebar-panel-inner">
        <Link href={href(category.path)} className="sidebar-view-all" aria-current={selected ? "page" : undefined}>Vezi toate produsele →</Link>
        <ul>{children.map((child) => <CategoryBranch key={child.path} category={child} items={items} activePath={activePath} />)}</ul>
      </div>
    </div> : null}
  </li>;
}

export default function CategorySidebar({ items, activePath }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navId = useId();
  return <aside className="category-sidebar">
    <div className="sidebar-heading"><span aria-hidden="true">☷</span> Categorii de produse</div>
    <button type="button" className="sidebar-mobile-toggle" aria-expanded={mobileOpen} aria-controls={navId} onClick={() => setMobileOpen(!mobileOpen)}>
      <span>☷ Categorii de produse</span><span aria-hidden="true">{mobileOpen ? "−" : "+"}</span>
    </button>
    <nav id={navId} aria-label="Catalog de produse" className={`sidebar-navigation${mobileOpen ? " mobile-open" : ""}`}>
      <Link href="/shop" className="sidebar-all">Toate produsele <span aria-hidden="true">↗</span></Link>
      <ul>{items.filter((item) => item.parent === null).map((category) => <CategoryBranch key={category.path} category={category} items={items} activePath={activePath} />)}</ul>
      <p className="sidebar-note">Vândute și livrate de<br /><strong>E-Store House</strong></p>
    </nav>
  </aside>;
}
