'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { campaignActive, nextCampaignTransition } from '@/lib/campaign';

/** Open tabs move to the new campaign mode without losing client form state. */
export default function CampaignRefresh() {
  const router = useRouter();
  useEffect(() => {
    let previous = campaignActive();
    let timer: number | null = null;
    document.documentElement.dataset.campaign = previous ? 'on' : 'off';
    const schedule = () => {
      if (timer !== null) window.clearTimeout(timer);
      const next = nextCampaignTransition();
      timer = next === null ? null : window.setTimeout(() => { check(); schedule(); }, Math.min(Math.max(next - Date.now() + 50, 0), 2147483647));
    };
    const check = () => {
      const current = campaignActive();
      if (current !== previous) {
        previous = current;
        document.documentElement.dataset.campaign = current ? 'on' : 'off';
        window.dispatchEvent(new Event('estore-campaign-change'));
        router.refresh();
      }
    };
    const checkAndSchedule = () => { check(); schedule(); };
    schedule();
    window.addEventListener('focus', checkAndSchedule);
    document.addEventListener('visibilitychange', checkAndSchedule);
    return () => {
      if (timer !== null) window.clearTimeout(timer);
      window.removeEventListener('focus', checkAndSchedule);
      document.removeEventListener('visibilitychange', checkAndSchedule);
    };
  }, [router]);
  return null;
}
