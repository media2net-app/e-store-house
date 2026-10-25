'use client';
import { useEffect, useState } from 'react';
import { CHECKOUT_DRAFT_KEY, emptyCheckoutDraft, readCheckoutDraft, serializeCheckoutDraft } from '@/lib/checkout-draft';

export function useCheckoutDraft() {
  const [draft, setDraft] = useState(emptyCheckoutDraft);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      try { setDraft(readCheckoutDraft(sessionStorage.getItem(CHECKOUT_DRAFT_KEY))); } catch { /* Storage may be disabled. */ }
      setReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { sessionStorage.setItem(CHECKOUT_DRAFT_KEY, serializeCheckoutDraft(draft)); } catch { /* Keep the in-memory draft. */ }
  }, [draft, ready]);
  return [draft, setDraft] as const;
}
