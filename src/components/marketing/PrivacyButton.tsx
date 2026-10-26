'use client';
export default function PrivacyButton() { return <button type="button" className="privacy-settings-link" onClick={() => window.dispatchEvent(new Event('estore-open-privacy'))}>Preferințe de confidențialitate</button>; }
