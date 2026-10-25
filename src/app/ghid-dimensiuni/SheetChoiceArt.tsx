/** Small bed diagrams distinguish a draped flat sheet from a fitted mattress cover. */
export default function SheetChoiceArt({ fitted }: { fitted: boolean }) {
  return <svg className="finder-sheet-art" viewBox="0 0 88 70" fill="none" aria-hidden="true" focusable="false">
    <rect x="16" y="5" width="56" height="38" rx="9" fill="#cdb99a" stroke="#79583e" strokeWidth="1.5"/>
    <rect x="11" y="25" width="66" height="32" rx="6" fill="#f9f1e4" stroke="#79583e" strokeWidth="1.5"/>
    <rect x="23" y="16" width="19" height="14" rx="4" fill="#fffbf2" stroke="#ad9576"/>
    <rect x="46" y="16" width="19" height="14" rx="4" fill="#fffbf2" stroke="#ad9576"/>
    {fitted ? <><path d="M11 35h66v16a6 6 0 0 1-6 6H17a6 6 0 0 1-6-6V35Z" fill="#95a78a" stroke="#526749" strokeWidth="1.5"/><path d="M11 39c7 0 8 5 8 12M77 39c-7 0-8 5-8 12M19 51h50" stroke="#526749" strokeWidth="1.5" strokeDasharray="3 3"/></>
      : <><path d="M11 35h66l4 27-14-3-23 4-23-4-14 3 4-27Z" fill="#ead5b2" stroke="#79583e" strokeWidth="1.5"/><path d="M22 37 21 59m45-22 1 22M11 40h66" stroke="#b4966d" strokeWidth="1.3"/></>}
  </svg>;
}
