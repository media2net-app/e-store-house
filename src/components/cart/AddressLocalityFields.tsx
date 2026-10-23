"use client";

import { useEffect, useId, useRef, useState } from "react";
import counties from "@/data/romanian-counties.json";
import { localitySuggestions } from "@/lib/locality-search";

const inputClass = "mt-1 w-full rounded-lg border border-[#c9bda9] bg-white px-3 py-3";

export default function AddressLocalityFields({ county, city, onChange, onValidityChange, billing = false }: {
  county: string; city: string; onChange: (county: string, city: string) => void; billing?: boolean; onValidityChange?: (valid: boolean) => void;
}) {
  const id = useId();
  const cityInput = useRef<HTMLInputElement>(null);
  const [list, setList] = useState<{ county: string; names: string[] } | null>(null);
  const [failedCounty, setFailedCounty] = useState("");
  const [manual, setManual] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [touched, setTouched] = useState(false);
  const selectedCounty = counties.find(row => row.name === county);
  const names = list?.county === county ? list.names : [];
  const loading = !!county && list?.county !== county && failedCounty !== county;
  const unavailable = !!county && failedCounty === county;
  const validCity = !!city.trim() && (manual || unavailable || names.includes(city));
  const suggestions = localitySuggestions(names, city);
  const showList = open && !manual && suggestions.length > 0;
  const validationMessage = !county ? "Alege mai întâi județul." : !city.trim() ? "Completează localitatea."
    : loading ? "Se încarcă localitățile. Așteaptă sau alege introducerea manuală."
    : "Alege o localitate din sugestii sau folosește introducerea manuală.";

  useEffect(() => {
    if (!selectedCounty) return;
    const controller = new AbortController();
    fetch(`/locations/${selectedCounty.id}.json`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Localities unavailable");
        const result: unknown = await response.json();
        if (!Array.isArray(result) || !result.length || !result.every(name => typeof name === "string" && name.length <= 80)) throw new Error("Invalid localities");
        if (!controller.signal.aborted) { setList({ county: selectedCounty.name, names: result }); setFailedCounty(""); }
      }).catch(() => { if (!controller.signal.aborted) setFailedCounty(selectedCounty.name); });
    return () => controller.abort();
  }, [selectedCounty]);

  useEffect(() => {
    cityInput.current?.setCustomValidity(validCity ? "" : validationMessage);
    onValidityChange?.(validCity);
  }, [validCity, validationMessage, onValidityChange]);

  function choose(name: string) {
    onChange(county, name); setOpen(false); setActive(-1); setTouched(false);
    cityInput.current?.focus();
    setOpen(false);
  }

  return <>
    <label className="block text-sm font-medium" htmlFor={`${id}-county`}>Județ
      <select id={`${id}-county`} name={billing ? "billingCounty" : "county"} value={county} required
        autoComplete={billing ? "section-billing address-level1" : "shipping address-level1"} className={inputClass}
        onChange={event => { onChange(event.target.value, ""); setManual(false); setOpen(false); setActive(-1); setTouched(false); }}>
        <option value="">Alege județul</option>
        {[...counties].sort((a, b) => a.name.localeCompare(b.name, "ro")).map(row => <option key={row.id} value={row.name}>{row.name}</option>)}
      </select>
    </label>
    <div className="relative">
      <label className="block text-sm font-medium" htmlFor={`${id}-city`}>Localitate</label>
      <input ref={cityInput} id={`${id}-city`} name={billing ? "billingCity" : "city"} value={city} required maxLength={80}
        className={inputClass} autoComplete="off" placeholder={county ? "Scrie numele localității" : "Alege mai întâi județul"}
        readOnly={!county} role="combobox" aria-autocomplete="list" aria-expanded={showList}
        aria-controls={showList ? `${id}-options` : undefined} aria-activedescendant={showList && active >= 0 ? `${id}-option-${active}` : undefined}
        aria-describedby={`${id}-help`} aria-invalid={touched && !validCity}
        onChange={event => { onChange(county, event.target.value); setOpen(true); setActive(-1); setTouched(false); }}
        onFocus={() => { setOpen(true); setActive(-1); }} onBlur={() => { setOpen(false); setTouched(true); }}
        onInvalid={() => setTouched(true)}
        onKeyDown={event => {
          if (event.key === "Escape") { setOpen(false); setActive(-1); }
          if ((event.key === "ArrowDown" || event.key === "ArrowUp") && !manual && suggestions.length) {
            event.preventDefault(); setOpen(true);
            setActive(value => event.key === "ArrowDown" ? (value + 1) % suggestions.length : (value <= 0 ? suggestions.length - 1 : value - 1));
          }
          if (event.key === "Enter" && showList) { event.preventDefault(); if (active >= 0) choose(suggestions[active]); }
        }} />
      {showList && <ul id={`${id}-options`} role="listbox" aria-label="Localități sugerate" className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-[#c9bda9] bg-white shadow-lg">
        {suggestions.map((name, index) => <li key={name} id={`${id}-option-${index}`} role="option" aria-selected={active === index}
          className={`cursor-pointer px-3 py-3 text-sm hover:bg-[#eee7de] ${active === index ? "bg-[#eee7de]" : ""}`}
          onMouseDown={event => event.preventDefault()} onClick={() => choose(name)}>{name}</li>)}
      </ul>}
      <p id={`${id}-help`} className={`mt-2 text-xs ${touched && !validCity ? "text-red-800" : "text-[#5d5148]"}`} role="status">
        {touched && !validCity ? validationMessage : unavailable ? "Lista nu este disponibilă momentan. Poți introduce localitatea manual."
          : manual ? "Introdu denumirea completă și verifică județul ales."
          : loading ? "Se încarcă localitățile…"
          : county ? "Scrie cu sau fără diacritice și alege localitatea din sugestii." : "Selectează județul pentru a vedea localitățile."}
      </p>
      {county && !unavailable && <button type="button" className="mt-2 min-h-11 text-left text-xs underline underline-offset-2"
        onClick={() => { setManual(value => !value); setOpen(false); setTouched(false); }}>
        {manual ? "Înapoi la sugestiile de localități" : "Nu găsesc localitatea — introduc manual"}
      </button>}
    </div>
  </>;
}
