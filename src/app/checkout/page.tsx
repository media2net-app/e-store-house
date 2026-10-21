import CheckoutForm from "./CheckoutForm";
import Header from "@/components/layout/Header";
import TrustBar from "@/components/layout/TrustBar";
import Footer from "@/components/layout/Footer";
import { checkoutConfiguration } from "@/lib/checkout-config";

export const metadata = { title: "Finalizarea comenzii", robots: { index: false, follow: false } };

export default function CheckoutPage() {
  const config = checkoutConfiguration();
  return <><TrustBar /><Header /><CheckoutForm shippingOptions={config.shippingOptions} enabled={config.ready} /><Footer /></>;
}
