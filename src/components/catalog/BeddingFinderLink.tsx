import Link from 'next/link';

export default function BeddingFinderLink({ className = '', onClick }: { className?: string; onClick?: () => void }) {
  return <Link href="/ghid-dimensiuni" className={`bedding-finder-link ${className}`} onClick={onClick}>
    <svg className="bedding-finder-link-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M4 19V9a3 3 0 0 1 3-3h16a3 3 0 0 1 3 3v5M3 26v-7a3 3 0 0 1 3-3h11M3 22h14M7 12V9h6v4M17 12V9h6v3M6 26v2"/><circle cx="23" cy="21" r="5"/><path d="m27 25 3 4"/></svg>
    <span className="bedding-finder-link-copy"><strong>Găsește lenjeria potrivită</strong><small>Alegi detaliile, vezi imediat potrivirile</small></span>
    <svg className="bedding-finder-link-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>
  </Link>;
}
