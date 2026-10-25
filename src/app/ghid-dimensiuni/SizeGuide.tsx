'use client';
import { useMemo, useState } from 'react';
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
  const invalidBudget = filters.maxPrice !== '' && (!Number.isFinite(Number(filters.maxPrice)) || Number(filters.maxPrice) < 0);
  function update(key: keyof BeddingFilters, value: string) { setFilters(current => ({ ...current, [key]: value })); setVisible(12); }
  const select = (key: keyof typeof options, label: string, hint?: string) => <label className="finder-field" key={key} htmlFor={`finder-${key}`}><span className="finder-field-title"><span className="finder-field-icon"><FinderIcon name={key}/></span>{label}</span><select id={`finder-${key}`} value={filters[key]} onChange={e => update(key, e.target.value)} aria-describedby={hint ? `finder-${key}-hint` : undefined}><option value="">Nu am o preferință</option>{options[key].map(value => <option key={value} value={value}>{value}</option>)}</select>{hint && <small id={`finder-${key}-hint`}>{hint}</small>}</label>;
  return <>
    <div className="finder-live-status">
      <span className="finder-count-icon"><FinderIcon name="spark"/></span><div role="status" aria-live="polite" aria-atomic="true"><strong>{results.length} {results.length === 1 ? 'produs disponibil' : 'produse disponibile'}</strong><span>{active ? 'Pentru preferințele tale' : 'Începe cu ce știi despre lenjeria dorită'}{variantCount > results.length ? ` · ${variantCount} variante` : ''}</span></div>
      <a className="button-primary" href="#finder-results">Vezi produsele <span aria-hidden="true">↓</span></a>
    </div>
    <form className="bedding-finder-form" onSubmit={e => e.preventDefault()} aria-label="Preferințe pentru lenjeria de pat">
      <fieldset className="finder-style-section"><legend><span className="finder-step">01</span> Cum vrei să fie lenjeria?</legend><p>Alege textura și nuanța care fac dormitorul să se simtă acasă.</p><div className="finder-fields">{select('material', 'Material')}{select('color', 'Culoare')}{select('sheet', 'Tipul cearșafului')}<label className="finder-field" htmlFor="finder-maxPrice"><span className="finder-field-title"><span className="finder-field-icon"><FinderIcon name="budget"/></span>Buget maxim pentru un set (lei)</span><input id="finder-maxPrice" type="number" inputMode="decimal" min="0" step="0.01" placeholder="De exemplu, 300" value={filters.maxPrice} onChange={e => update('maxPrice', e.target.value)} aria-invalid={invalidBudget} aria-describedby={invalidBudget ? 'finder-budget-error' : undefined}/>{invalidBudget && <small id="finder-budget-error">Introdu o sumă de cel puțin 0 lei.</small>}</label></div></fieldset>
      <fieldset className="finder-size-section"><legend><span className="finder-step">02</span> Ce dimensiuni îți trebuie?</legend><p>Completează doar ce știi. Salteaua, pilota și perna au dimensiuni diferite.</p><div className="finder-fields">{select('mattress', 'Saltea pentru cearșaf cu elastic', 'Afișăm doar huse cu dimensiunea saltelei confirmată. Pentru cearșaf simplu, lasă acest câmp neales.')}{select('duvet', 'Pilotă (lățime × lungime)')}{select('pillow', 'Pernă (lățime × lungime)')}</div></fieldset>
      <div className="finder-reset"><p>Numărul produselor se actualizează automat, după fiecare alegere.</p><button type="button" disabled={!active} onClick={() => { setFilters({ ...emptyBeddingFilters }); setVisible(12); }}>Resetează preferințele</button></div>
    </form>
    <section id="finder-results" className="finder-results" aria-labelledby="finder-results-title">
      <p className="finder-results-eyebrow"><FinderIcon name="spark"/> SELECȚIA TA</p><h2 id="finder-results-title">{results.length ? 'Lenjerii pentru preferințele tale' : 'Nicio lenjerie nu corespunde tuturor alegerilor'}</h2>
      <p className="finder-note">{results.length ? `Afișăm ${Math.min(visible, results.length)} din ${results.length} modele disponibile. Prețurile sunt ale variantelor care corespund selecției.` : 'Încearcă un alt buget sau elimină o preferință. Nu îți propunem dimensiuni aproximative.'}</p>
      <p className="finder-note">Verifică piesele incluse și înălțimea saltelei în pagina produsului. Dacă o dimensiune nu este precizată, produsul nu apare pentru acel filtru.</p>
      {!results.length && <div className="finder-empty"><button className="button-primary" onClick={() => { setFilters({ ...emptyBeddingFilters }); setVisible(12); }}>Arată toate lenjeriile disponibile</button><Link href="/informatii-clienti">Ai nevoie de ajutor la alegere?</Link></div>}
      <div className="products-grid finder-products">{results.slice(0, visible).map(model => {
        const prices = model.choices.map(v => v.price), min = Math.min(...prices), max = Math.max(...prices);
        const best = model.choices.find(v => v.price === min)!;
        const price = min === max ? formatProductPrice(min, 'RON') : `${formatProductPrice(min, 'RON').replace(' lei', '')}–${formatProductPrice(max, 'RON')}`;
        const href = `/product/${model.id}${model.variable ? `?varianta=${best.id}` : ''}`;
        return <Link key={model.id} href={href} className="catalog-card catalog-card-link" aria-label={`${model.name} — ${price}`}><div className="catalog-card-image"><Image src={best.image} alt={model.name} width={400} height={600} sizes="(max-width:700px) 45vw, (max-width:1000px) 30vw, 300px"/></div><div className="catalog-card-copy"><h3>{model.name}</h3><p className="catalog-card-material">{model.material}</p><p className="catalog-card-price">{price}</p>{model.variable && <p className="catalog-card-variants">{model.choices.length === 1 ? best.name : `${model.choices.length} variante pentru selecția ta · de la ${best.name}`}</p>}<span className="catalog-card-action">{model.variable ? 'Vezi varianta potrivită' : 'Vezi produsul'} <span aria-hidden="true">↗</span></span></div></Link>;
      })}</div>
      {visible < results.length && <button className="button-primary finder-more" onClick={() => setVisible(n => n + 12)}>Arată încă {Math.min(12, results.length - visible)} produse</button>}
    </section>
  </>;
}
