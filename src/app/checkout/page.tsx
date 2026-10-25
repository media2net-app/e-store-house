import CheckoutForm from "./CheckoutForm";
import Brand from "@/components/layout/Brand";
import Link from "next/link";
import { checkoutConfiguration } from "@/lib/checkout-config";

export const metadata = { title: "Finalizarea comenzii", robots: { index: false, follow: false } };

export default function CheckoutPage() {
  const config = checkoutConfiguration();
  return <><header className="checkout-header"><Brand /><Link href="/cos">Înapoi la coș</Link></header><CheckoutForm shippingOptions={config.shippingOptions} cardEnabled={config.cardReady} codEnabled={config.codReady} /><footer className="checkout-footer"><Link href="/informatii-clienti">Ajutor și contact</Link><Link href="/livrare-retur">Livrare și retur</Link><Link href="/confidentialitate">Confidențialitate</Link></footer></>;
}
