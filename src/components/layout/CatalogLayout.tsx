import { categories, categoryCount } from "@/lib/categories";
import CategorySidebar from "./CategorySidebar";

export default function CatalogLayout({ children, activePath }: {
  children: React.ReactNode;
  activePath?: string;
}) {
  const items = categories.map(({ path, name, parent }) => ({
    path, name, parent, count: categoryCount(path),
  }));
  return <div className="catalog-layout">
    <CategorySidebar key={activePath ?? "all"} items={items} activePath={activePath} />
    <div className="catalog-content">{children}</div>
  </div>;
}
