'use client';
import {useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {facetOptions,matchesCatalogFilters,type CatalogFilterState} from '@/lib/catalog-filters';
import type {Product} from '@/lib/products';
const empty:CatalogFilterState={material:'',culoare:'',dimensiune:'',cearsaf:'',stoc:'',pretMin:'',pretMax:''};
export default function FilterPanel({products,initial,category,query,sort}:{products:Product[];initial:CatalogFilterState;category?:string;query:string;sort:string}){
 const dialog=useRef<HTMLDialogElement>(null),router=useRouter();
 const [filters,setFilters]=useState(initial);
 const options=facetOptions(products);
 const count=products.filter(p=>matchesCatalogFilters(p,filters)).length;
 const active=Object.values(initial).filter(Boolean).length;
 function apply(){const params=new URLSearchParams();if(category)params.set('categorie',category);if(query)params.set('q',query);params.set('sortare',sort);for(const [k,v] of Object.entries(filters)){if(v)params.set(k==='pretMin'?'pret_min':k==='pretMax'?'pret_max':k,v);}dialog.current?.close();router.push(`/shop?${params}`);}
 return <div className="filter-control"><button className="filter-trigger" onClick={()=>{setFilters(initial);dialog.current?.showModal();}}>Filtre{active?` (${active})`:''}</button><dialog ref={dialog} className="store-dialog filter-dialog" aria-labelledby="filter-title"><form onSubmit={e=>{e.preventDefault();apply();}}><div className="dialog-heading"><h2 id="filter-title">Filtrează produsele</h2><button type="button" aria-label="Închide filtrele" onClick={()=>dialog.current?.close()}>✕</button></div>{([['material','Material'],['culoare','Culoare'],['dimensiune','Dimensiunea produsului'],['cearsaf','Tip cearșaf']] as const).filter(([key])=>options[key].length>1||filters[key]).map(([key,label])=><label key={key}>{label}<select value={filters[key]} onChange={e=>setFilters({...filters,[key]:e.target.value})}><option value="">Toate</option>{options[key].map(v=><option value={v} key={v}>{v}</option>)}</select></label>)}<div className="filter-prices"><label>Preț minim (lei)<input type="number" min="0" step="1" inputMode="numeric" value={filters.pretMin} onChange={e=>setFilters({...filters,pretMin:e.target.value})}/></label><label>Preț maxim (lei)<input type="number" min="0" step="1" inputMode="numeric" value={filters.pretMax} onChange={e=>setFilters({...filters,pretMax:e.target.value})}/></label></div><label className="filter-stock"><input type="checkbox" checked={filters.stoc==='da'} onChange={e=>setFilters({...filters,stoc:e.target.checked?'da':''})}/>Doar disponibile</label><p aria-live="polite">{count} produse pentru selecția curentă.</p><div className="filter-actions"><button type="button" className="section-link" onClick={()=>setFilters(empty)}>Resetează filtrele</button><button className="button-primary">Arată {count} produse</button></div></form></dialog></div>;
}
