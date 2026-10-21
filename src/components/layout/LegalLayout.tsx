import Header from "./Header";
import Footer from "./Footer";
import TrustBar from "./TrustBar";
import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return <><TrustBar /><Header /><main className="legal-page"><Link href="/informatii-clienti" className="legal-back">Ajutor și drepturile clientului</Link>{children}<p className="legal-updated">Actualizat la 21 octombrie 2026.</p></main><Footer /></>;
}
