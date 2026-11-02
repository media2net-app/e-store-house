'use client';
import { useEffect, useState } from 'react';
import { BLACK_FRIDAY_END, BLACK_FRIDAY_START, blackFridayActive } from '@/lib/black-friday-period';

export function useBlackFridayCoupon() {
  const [active, setActive] = useState(blackFridayActive);
  useEffect(() => {
    let timer: number | null = null;
    const update = () => setActive(blackFridayActive());
    const schedule = () => {
      if (timer !== null) window.clearTimeout(timer);
      const next = [Date.parse(BLACK_FRIDAY_START), Date.parse(BLACK_FRIDAY_END)].find(time => time > Date.now());
      timer = next ? window.setTimeout(() => { update(); schedule(); }, Math.min(Math.max(next - Date.now() + 50, 0), 2147483647)) : null;
    };
    const check = () => { update(); schedule(); };
    schedule();
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    return () => {
      if (timer !== null) window.clearTimeout(timer);
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);
  return active;
}
