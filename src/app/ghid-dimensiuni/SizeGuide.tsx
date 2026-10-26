'use client';
import { useEffect, useMemo, useState } from 'react';
import { trackCommerce } from '@/lib/marketing';
import Image from 'next/image';
import FinderIcon from './FinderIcon';
import Link from 'next/link';
import { beddingOptions, emptyBeddingFilters, filterBedding, type BeddingFilters, type BeddingModel } from '@/lib/bedding-finder';
import { formatProductPrice } from '@/lib/product-format';

export default function SizeGuide({ models }: { models: BeddingModel[] }) {
  const [filters, setFilters] = useState<BeddingFilters>({ ...emptyBeddingFilters });
  const [visible, setVisible] = useState(12);
  const options = useMemo(() => beddingOptions(models), [models]);
  const results = useMemo(() => filterBedding(models, filters), [models, filters]);
  const active = Object.values(filters).filter(Boolean).length;
  const variantCount = results.reduce((sum, model) => sum + model.choices.length, 0);
  useEffect(() => {
    if(!active) return;
    const timer = setTimeout(() => trackCommerce('bedding_finder_use', {result_count:results.length,variant_count:variantCount,filters_used:Object.entries(filters).filter(([,v]) => Boolean(v)).map(([k]) => k).join(',')}), 600);
    return () => clearTimeout(timer);
  }, [filters, active, results.length, variantCount]);
  const invalidBudget = filters.maxPrice !== '' && (!Number.isFinite(Number(filters.maxPrice)) || Number(filters.maxPrice) < 0);
  function update(key: keyof BeddingFilters, value: string) { setFilters(current => ({ ...current, [key]: value })); setVisible(12); }
  const labels: Record<keyof BeddingFilters, string> = { sheet: 'Cearșaf', mattress: 'Saltea', duvet: 'Pilotă', pillow: 'Pernă', material: 'Material', color: 'Culoare', maxPrice: 'Buget', mattressHeight: 'Înălțime saltea' };
  const select = (key: keyof typeof options, label: string, hint?: string) => <label className="finder-field" key={key} htmlFor={`finder-${key}`}><span className="finder-field-title"><span className="finder-field-icon"><FinderIcon name={key}/></span>{label}</span><select id={`finder-${key}`} value={filters[key]} onChange={e => update(key, e.target.value)} aria-describedby={hint ? `finder-${key}-hint` : undefined}><option value="">Nu am o preferință</option>{options[key].map(value => <option key={value} value={value}>{value}</option>)}</select>{hint && <small id={`finder-${key}-hint`}>{hint}</small>}</label>;
  return <>
    <div className="finder-live-status">
      <span className="finder-count-icon"><FinderIcon name="spark"/></span><div role="status" aria-live="polite" aria-atomic="true"><strong>{results.length} {results.length === 1 ? 'produs disponibil' : 'produse disponibile'}</strong><span>{active ? 'Pentru preferințele tale' : 'Începe cu ce știi despre lenjeria dorită'}{variantCount > results.length ? ` · ${variantCount} variante` : ''}</span></div>
      <a className="button-primary" href="#finder-results">Vezi produsele <span aria-hidden="true">↓</span></a>
    </div>
    <section className="finder-question finder-simple" aria-labelledby="finder-simple-title">
      <h2 id="finder-simple-title">Patru alegeri. Lenjeria potrivită.</h2>
      <p className="finder-question-help">Completează doar ce contează pentru tine. Produsele se actualizează imediat.</p>
      <div className="finder-simple-fields">
        {select('mattress', 'Dimensiunea saltelei', 'Recomandări pentru salteaua ta, inclusiv lenjerii cu cearșaf simplu. Verifică înălțimea saltelei și piesele setului în pagina produsului.')}
        {select('material', 'Tip de material')}
        {select('color', 'Culoare')}
        <label className="finder-field" htmlFor="finder-maxPrice"><span className="finder-field-title"><span className="finder-field-icon"><FinderIcon name="budget"/></span>Preț maxim (lei)</span><input id="finder-maxPrice" type="number" inputMode="numeric" min="0" step="1" placeholder="Orice preț" value={filters.maxPrice} onChange={e => update('maxPrice', e.target.value)} aria-invalid={invalidBudget} aria-describedby={invalidBudget ? 'finder-budget-error' : undefined}/>{invalidBudget && <small id="finder-budget-error" role="alert">Introdu o sumă de cel puțin 0 lei.</small>}</label>
      </div>
    </section>
    {active > 0 && <div className="finder-selection" aria-label="Preferințele alese"><p>Ai ales:</p><div className="finder-selected-chips">{(Object.entries(filters) as [keyof BeddingFilters, string][]).filter(([, value]) => value).map(([key, value]) => <button type="button" key={key} onClick={() => update(key, '')} aria-label={`Elimină ${labels[key]}: ${value}`}>{labels[key]}: {key === 'maxPrice' ? `până la ${value} lei` : key === 'mattressHeight' ? `${value} cm` : value}<span aria-hidden="true">×</span></button>)}</div><button type="button" className="finder-reset-all" onClick={() => { setFilters({ ...emptyBeddingFilters }); setVisible(12); }}>Resetează preferințele</button></div>}
    <section id="finder-results" className="finder-results" aria-labelledby="finder-results-title">
      <p className="finder-results-eyebrow"><FinderIcon name="spark"/> SELECȚIA TA</p><h2 id="finder-results-title">{results.length ? 'Lenjerii pentru preferințele tale' : 'Nicio lenjerie nu corespunde tuturor alegerilor'}</h2>
      <p className="finder-note">{results.length ? `Afișăm ${Math.min(visible, results.length)} din ${results.length} modele disponibile. Prețurile sunt ale variantelor care corespund selecției.` : 'Încearcă un alt preț maxim sau elimină o preferință.'}</p>
      <details className="finder-match-help"><summary>Cum alegem produsele?</summary><p>Toate alegerile tale trebuie să se potrivească aceleiași variante disponibile. Verifică piesele incluse și înălțimea saltelei în pagina produsului. Pentru cearșafurile simple păstrăm cel puțin 20 cm în plus pe fiecare margine față de saltea; această selecție este orientativă, deoarece înălțimea saltelei și materialul băgat dedesubt pot necesita mai mult. Dimensiunile neprecizate nu sunt considerate potriviri.</p></details>
      {!results.length && <div className="finder-empty"><button className="button-primary" onClick={() => { setFilters({ ...emptyBeddingFilters }); setVisible(12); }}>Arată toate lenjeriile disponibile</button><Link href="/informatii-clienti">Ai nevoie de ajutor la alegere?</Link></div>}
      <div className="products-grid finder-products">{results.slice(0, visible).map(model => {
        const prices = model.choices.map(v => v.price), min = Math.min(...prices), max = Math.max(...prices);
        const best = model.choices.find(v => v.price === min)!;
        const price = min === max ? formatProductPrice(min, 'RON') : `${formatProductPrice(min, 'RON').replace(' lei', '')}–${formatProductPrice(max, 'RON')}`;
        const href = `/product/${model.id}${model.variable ? `?varianta=${best.id}` : ''}`;
        return <Link key={model.id} href={href} className="catalog-card catalog-card-link"><div className="catalog-card-image"><Image src={best.image} alt={model.name} width={400} height={600} sizes="(max-width:700px) 45vw, (max-width:1000px) 30vw, 300px"/></div><div className="catalog-card-copy"><h3>{model.name}</h3><p className="catalog-card-material">{model.material}</p><p className="catalog-card-price">{price}</p>{filters.mattress && best.sheet === 'Cearșaf simplu' && <p className="catalog-card-variants">Cearșaf {best.flatSheet.join(', ')} · verifică înălțimea saltelei</p>}{model.variable && <p className="catalog-card-variants">{model.choices.length === 1 ? best.name : `${model.choices.length} variante pentru selecția ta · de la ${best.name}`}</p>}<span className="catalog-card-action">{model.variable ? 'Vezi varianta potrivită' : 'Vezi produsul'} <span aria-hidden="true">↗</span></span></div></Link>;
      })}</div>
      {visible < results.length && <button className="button-primary finder-more" onClick={() => setVisible(n => n + 12)}>Arată încă {Math.min(12, results.length - visible)} produse</button>}
    </section>
  </>;
}
