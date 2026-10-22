import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
export default function NotFound(){return <><Header/><main className="collection-page empty-state"><p className="eyebrow">404</p><h1>Pagina nu a fost găsită</h1><p>Poți căuta produsul sau poți reveni la categoriile magazinului.</p><Link className="button-primary" href="/categorii">Vezi categoriile</Link><Link className="section-link" href="/informatii-clienti">Ai nevoie de ajutor?</Link></main><Footer/></>;}
