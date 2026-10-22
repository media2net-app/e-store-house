import { categories, categoryCount } from "@/lib/categories";
import CategorySidebar from "./CategorySidebar";

export default function CatalogLayout({ children, activePath, showSidebar = true }: {
  children: React.ReactNode;
  activePath?: string;
  showSidebar?: boolean;
}) {
  const items = showSidebar ? categories.filter(({ path }) => categoryCount(path) > 0).map(({ path, name, parent }) => ({
    path, name, parent, count: categoryCount(path),
  })) : [];
  return <div className="catalog-layout">
    {showSidebar ? <CategorySidebar key={activePath ?? "all"} items={items} activePath={activePath} /> : null}
    <div className="catalog-content">{children}</div>
  </div>;
}
