'use client';
import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import FinderIcon, { type FinderIconName } from './FinderIcon';
import Link from 'next/link';
import SheetChoiceArt from './SheetChoiceArt';
import { beddingOptions, emptyBeddingFilters, filterBedding, type BeddingFilters, type BeddingModel } from '@/lib/bedding-finder';
import { formatProductPrice } from '@/lib/product-format';

export default function SizeGuide({ models }: { models: BeddingModel[] }) {
  const [filters, setFilters] = useState<BeddingFilters>({ ...emptyBeddingFilters });
  const [step, setStep] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(12);
  const options = useMemo(() => beddingOptions(models), [models]);
  const results = useMemo(() => filterBedding(models, filters), [models, filters]);
  const active = Object.values(filters).filter(Boolean).length;
  const variantCount = results.reduce((sum, model) => sum + model.choices.length, 0);
  const invalidBudget = filters.maxPrice !== '' && (!Number.isFinite(Number(filters.maxPrice)) || Number(filters.maxPrice) < 0);
  function update(key: keyof BeddingFilters, value: string) { setFilters(current => ({ ...current, [key]: value, ...(key === 'sheet' && value !== 'Cu elastic / husă pentru saltea' ? { mattress: '' } : {}) })); setVisible(12); }
  function changeStep(next: number) { setStep(next); requestAnimationFrame(() => { panel.current?.scrollIntoView({ block: 'start' }); panel.current?.focus({ preventScroll: true }); }); }
  const steps: { label: string; icon: FinderIconName }[] = [{ label: 'Cearșaf', icon: 'sheet' }, { label: 'Dimensiuni', icon: 'ruler' }, { label: 'Preferințe', icon: 'material' }];
  const labels: Record<keyof BeddingFilters, string> = { sheet: 'Cearșaf', mattress: 'Saltea', duvet: 'Pilotă', pillow: 'Pernă', material: 'Material', color: 'Culoare', maxPrice: 'Buget' };
  const dimensionChoices = (key: 'mattress' | 'duvet' | 'pillow', title: string, hint: string) => <fieldset className="finder-measurement"><legend><FinderIcon name={key}/>{title}</legend><p>{hint}</p><div className="finder-chips">{['', ...options[key]].map(value => <button key={value} type="button" aria-pressed={filters[key] === value} onClick={() => update(key, value)}>{value || 'Nu știu / oricare'}</button>)}</div></fieldset>;
  const select = (key: keyof typeof options, label: string, hint?: string) => <label className="finder-field" key={key} htmlFor={`finder-${key}`}><span className="finder-field-title"><span className="finder-field-icon"><FinderIcon name={key}/></span>{label}</span><select id={`finder-${key}`} value={filters[key]} onChange={e => update(key, e.target.value)} aria-describedby={hint ? `finder-${key}-hint` : undefined}><option value="">Nu am o preferință</option>{options[key].map(value => <option key={value} value={value}>{value}</option>)}</select>{hint && <small id={`finder-${key}-hint`}>{hint}</small>}</label>;
  return <>
    <div className="finder-live-status">
      <span className="finder-count-icon"><FinderIcon name="spark"/></span><div role="status" aria-live="polite" aria-atomic="true"><strong>{results.length} {results.length === 1 ? 'produs disponibil' : 'produse disponibile'}</strong><span>{active ? 'Pentru preferințele tale' : 'Începe cu ce știi despre lenjeria dorită'}{variantCount > results.length ? ` · ${variantCount} variante` : ''}</span></div>
      <a className="button-primary" href="#finder-results">Vezi produsele <span aria-hidden="true">↓</span></a>
    </div>
    <nav className="finder-steps" aria-label="Etapele alegerii">{steps.map((item, index) => <button type="button" key={item.label} aria-current={step === index ? 'step' : undefined} onClick={() => changeStep(index)}><FinderIcon name={item.icon}/><span>{index + 1}. {item.label}</span></button>)}</nav>
    <div ref={panel} tabIndex={-1} className="finder-question" aria-labelledby="finder-question-title">
      <p className="finder-question-kicker">PASUL {step + 1} DIN 3 · OPȚIONAL</p>
      <h2 id="finder-question-title">{['Ce cearșaf preferi?', 'Ce dimensiuni îți trebuie?', 'Cum îți place lenjeria?'][step]}</h2>
      <p className="finder-question-help">{['Alege ce îți place. Poți schimba alegerea oricând.', 'Alege doar dimensiunile pe care le știi. Restul pot rămâne nealese.', 'Adaugă doar preferințele importante pentru tine.'][step]}</p>
      {step === 0 && <div className="finder-sheet-cards">{[
        { value: 'Cearșaf simplu', title: 'Cearșaf simplu', note: 'Drept, fără elastic', icon: 'sheet' },
        { value: 'Cu elastic / husă pentru saltea', title: 'Cu elastic', note: 'Husă pentru saltea', icon: 'mattress' },
        { value: '', title: 'Oricare', note: 'Vreau să le văd pe toate', icon: 'spark' },
      ].map(choice => <button type="button" key={choice.title} aria-pressed={filters.sheet === choice.value} onClick={() => update('sheet', choice.value)}><span className="finder-choice-art">{choice.value ? <SheetChoiceArt fitted={choice.value !== 'Cearșaf simplu'}/> : <FinderIcon name="spark"/>}</span><strong>{choice.title}</strong><small>{choice.note}</small><span className="finder-choice-check" aria-hidden="true">{filters.sheet === choice.value ? '✓' : '+'}</span></button>)}</div>}
      {step === 1 && <div className="finder-measurements">{filters.sheet === 'Cearșaf simplu' && <p className="finder-flat-help"><FinderIcon name="sheet"/><span>Și cearșaful simplu se poate potrivi unei saltele de 180 × 200 cm. Alege-l mai mare decât salteaua, cu loc pentru laterale și de băgat dedesubt. Verifică dimensiunile cearșafului și înălțimea saltelei.</span></p>}{filters.sheet === 'Cu elastic / husă pentru saltea' && dimensionChoices('mattress', 'Salteaua', 'Lățime × lungime. Verifică și înălțimea în pagina produsului.')}{dimensionChoices('duvet', 'Pilota', 'Alege dimensiunea pilotei, nu a patului.')}{dimensionChoices('pillow', 'Perna', 'Alege dimensiunea pernei tale.')}</div>}
      {step === 2 && <div className="finder-preferences">{select('material', 'Ce material preferi?')}<fieldset className="finder-budget"><legend><FinderIcon name="budget"/>Buget pentru un set</legend><div className="finder-chips">{['', '150', '250', '350'].map(value => <button type="button" key={value} aria-pressed={filters.maxPrice === value} onClick={() => update('maxPrice', value)}>{value ? `Până la ${value} lei` : 'Orice buget'}</button>)}</div><label className="finder-field" htmlFor="finder-maxPrice"><span>Sau scrie bugetul maxim (lei)</span><input id="finder-maxPrice" type="number" inputMode="decimal" min="0" step="0.01" placeholder="De exemplu, 300" value={filters.maxPrice} onChange={e => update('maxPrice', e.target.value)} aria-invalid={invalidBudget}/>{invalidBudget && <small role="alert">Introdu o sumă de cel puțin 0 lei.</small>}</label></fieldset><details className="finder-color-detail"><summary><FinderIcon name="color"/>Ai o culoare preferată?{filters.color && <span> · {filters.color}</span>}</summary>{select('color', 'Culoare')}</details></div>}
      <div className="finder-step-actions">{step > 0 && <button type="button" className="finder-back" onClick={() => changeStep(step - 1)}>← Înapoi</button>}{step < 2 ? <button type="button" className="button-primary" onClick={() => changeStep(step + 1)}>Continuă <span aria-hidden="true">→</span></button> : <a className="button-primary" href="#finder-results">Vezi {results.length} {results.length === 1 ? 'lenjerie' : 'lenjerii'} <span aria-hidden="true">↓</span></a>}{step < 2 && <button type="button" className="finder-skip" onClick={() => changeStep(step + 1)}>Sar peste acest pas</button>}</div>
    </div>
    {active > 0 && <div className="finder-selection" aria-label="Preferințele alese"><p>Ai ales:</p><div className="finder-selected-chips">{(Object.entries(filters) as [keyof BeddingFilters, string][]).filter(([, value]) => value).map(([key, value]) => <button type="button" key={key} onClick={() => update(key, '')} aria-label={`Elimină ${labels[key]}: ${value}`}>{labels[key]}: {key === 'maxPrice' ? `până la ${value} lei` : value}<span aria-hidden="true">×</span></button>)}</div><button type="button" className="finder-reset-all" onClick={() => { setFilters({ ...emptyBeddingFilters }); setVisible(12); }}>Resetează preferințele</button></div>}
    <section id="finder-results" className="finder-results" aria-labelledby="finder-results-title">
      <p className="finder-results-eyebrow"><FinderIcon name="spark"/> SELECȚIA TA</p><h2 id="finder-results-title">{results.length ? 'Lenjerii pentru preferințele tale' : 'Nicio lenjerie nu corespunde tuturor alegerilor'}</h2>
      <p className="finder-note">{results.length ? `Afișăm ${Math.min(visible, results.length)} din ${results.length} modele disponibile. Prețurile sunt ale variantelor care corespund selecției.` : 'Încearcă un alt buget sau elimină o preferință. Nu îți propunem dimensiuni aproximative.'}</p>
      <details className="finder-match-help"><summary>Cum alegem produsele?</summary><p>Toate alegerile tale trebuie să se potrivească aceleiași variante disponibile. Verifică piesele incluse și înălțimea saltelei în pagina produsului. Dimensiunile neprecizate nu sunt considerate potriviri.</p></details>
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
