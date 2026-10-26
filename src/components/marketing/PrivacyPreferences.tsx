'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { marketingConfigured, privacyChoice, savePrivacy, startMarketing, trackPage, trackCommerce } from '@/lib/marketing';
export default function PrivacyPreferences() {
  const path = usePathname();
  const [open, setOpen] = useState(false), [analytics, setAnalytics] = useState(false), [marketing, setMarketing] = useState(false);
  useEffect(() => {
    function refresh() { const choice = privacyChoice(); setAnalytics(choice?.analytics ?? false); setMarketing(choice?.marketing ?? false); setOpen(marketingConfigured && !choice); startMarketing(); }
    function show() { refresh(); setOpen(true); }
    function select(event: MouseEvent) {
      const link = event.target instanceof Element ? event.target.closest('[data-estore-item]') : null;
      if(!link) return;
      try { const item = JSON.parse(link.getAttribute('data-estore-item') || 'null'); if(item) trackCommerce('select_item', {items:[item],item_list_name:'catalog'}); } catch { /* Never affect navigation. */ }
    }
    refresh(); window.addEventListener('estore-open-privacy', show); document.addEventListener('click', select);
    return () => { window.removeEventListener('estore-open-privacy', show); document.removeEventListener('click', select); };
  }, []);
  useEffect(() => { trackPage(path); }, [path]);
  function save(a: boolean, m: boolean) {
    const previous = privacyChoice();
    savePrivacy(a, m); setOpen(false);
    if (previous && (previous.analytics && !a || previous.marketing && !m)) {
      // Unload previously granted third-party code immediately upon withdrawal.
      for (const cookie of document.cookie.split(';')) {
        const name = cookie.trim().split('=')[0];
        if (/^(_ga|_gid|_gat|_ttp|ttcsid)/.test(name)) {
          document.cookie = `${name}=; Max-Age=0; path=/`;
          document.cookie = `${name}=; Max-Age=0; path=/; domain=.estorehouse.ro`;
        }
      }
      window.location.reload(); return;
    }
    startMarketing(); trackPage(path);
  }
  if (!open) return null;
  return <section className="privacy-panel" role="region" aria-labelledby="privacy-title"><h2 id="privacy-title">Tu alegi ce date partajezi</h2><p>Coșul și finalizarea comenzii funcționează fără urmărire opțională. Cu acordul tău, măsurăm utilizarea magazinului sau eficiența reclamelor. <Link href="/cookie-uri">Detalii</Link></p>
    <label><input type="checkbox" checked={analytics} onChange={e => setAnalytics(e.target.checked)}/> Analiză trafic — Google Analytics</label>
    <label><input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)}/> Marketing — TikTok Pixel</label>
    {!marketingConfigured && <p>Instrumentele opționale nu sunt încă activate.</p>}
    <div><button onClick={() => save(false, false)}>Refuz opționalele</button><button onClick={() => save(analytics, marketing)}>Salvez alegerile</button><button onClick={() => save(true, true)}>Accept opționalele</button></div>
  </section>;
}
