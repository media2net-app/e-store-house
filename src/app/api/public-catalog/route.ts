import { getLiveProducts } from "@/lib/live-products";

// Only the same reviewed products that the public shop displays are exposed here.
export async function GET() {
  const allProducts = await getLiveProducts();
  return Response.json({
    source: "estorehouse.ro",
    count: allProducts.length,
    products: allProducts.map((product) => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category,
      categoryPath: product.categoryPath,
      image: product.image,
      price: product.price,
      currency: product.currency,
      inStock: product.inStock !== false,
      variants: product.variants?.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        name: variant.name,
        price: variant.price,
        inStock: variant.inStock !== false,
      })) ?? [],
    })),
  }, { headers: { "Cache-Control": "no-store" } });
}
