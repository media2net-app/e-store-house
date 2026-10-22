'use client';
import Link from 'next/link';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="collection-page empty-state"><h1>Pagina nu s-a putut încărca</h1><p>Încearcă din nou. Dacă problema continuă, contactează-ne.</p><button className="button-primary" onClick={reset}>Reîncearcă</button><Link className="section-link" href="/informatii-clienti">Ai nevoie de ajutor?</Link></main>;}
