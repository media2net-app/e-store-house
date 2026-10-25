import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SizeGuide from './SizeGuide';
import { allProducts } from '@/lib/products';
import { buildBeddingModels } from '@/lib/bedding-finder';
export const metadata = { title: 'Găsește lenjeria potrivită', description: 'Alege materialul, bugetul și dimensiunile. Vezi imediat câte lenjerii disponibile corespund preferințelor tale.', alternates: { canonical: '/ghid-dimensiuni' } };
export default function Page() {
  return <><Header/><main className="collection-page bedding-finder-page"><p className="eyebrow">ALEGE MAI UȘOR</p><h1>Găsește lenjeria potrivită</h1><p className="finder-intro">Spune-ne ce cauți, iar noi îți arătăm lenjeriile disponibile. Poți completa orice combinație de preferințe — rezultatele se actualizează pe loc.</p><SizeGuide models={buildBeddingModels(allProducts)}/></main><Footer/></>;
}
