import Image from "next/image";
import Link from "next/link";

export default function Brand() {
  return <Link href="/" className="wordmark brand-lockup" aria-label="E-Store House — Acasă">
    <Image src="/brand/estore-house-icon.png" alt="" width={56} height={56} className="brand-icon" />
    <span className="brand-copy"><b>E-Store House</b><small>CONFORT BINE ALES</small></span>
  </Link>;
}
