import CatalogLayout from "@/components/layout/CatalogLayout";
import CategoryGrid from "@/components/home/CategoryGrid";
import Hero from "@/components/home/Hero";
import ProductGrid from "@/components/home/ProductGrid";
import UspSection from "@/components/home/UspSection";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import TrustBar from "@/components/layout/TrustBar";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8f4ec]/40">
      <TrustBar />
      <Header />
      <CatalogLayout>
      <Hero />
      <CategoryGrid />
      <ProductGrid />
      <UspSection />
      </CatalogLayout>
      <Footer />
    </main>
  );
}
