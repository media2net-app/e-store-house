'use client';
import Link from 'next/link';
export default function CatalogReturn(){
 return <Link className="section-link" href="/shop" onClick={e=>{try{const saved=JSON.parse(sessionStorage.getItem('estore-catalog-position')??'null');if(saved && typeof saved.path==='string' && /^\/(shop(?:\?|$)|colectii\/|colectia-romaneasca(?:\?|$)|ghid-dimensiuni(?:\?|$))/.test(saved.path)){e.preventDefault();sessionStorage.setItem('estore-restore-catalog','yes');window.location.assign(saved.path);}}catch{/* Use the catalog link if storage is unavailable. */}}}>← Înapoi la produse</Link>;
}
