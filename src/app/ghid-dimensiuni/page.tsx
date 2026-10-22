import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SizeGuide from './SizeGuide';
import {allProducts} from '@/lib/products';
export const metadata={title:'Găsește setul potrivit'};
export default function Page(){return <><Header/><main className="collection-page size-guide-page"><h1>Găsește setul potrivit</h1><p>Măsoară separat salteaua, pilota și pernele. Dimensiunile lor nu sunt interschimbabile.</p><SizeGuide products={allProducts.filter(p=>p.categoryPath?.startsWith('lenjerii-de-pat'))}/></main><Footer/></>;}
