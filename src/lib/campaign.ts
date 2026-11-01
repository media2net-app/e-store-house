import campaign from '@/data/campaign.json';

export type CampaignConfig = { timeZone: 'Europe/Bucharest'; mode: 'on' | 'off' | 'auto'; startAt: string | null; endAt: string | null };
export const campaignConfig = campaign as CampaignConfig;

/** Dates must carry the Romanian UTC offset for that day; coupon dates are separate. */
export function campaignActive(now = Date.now(), config: CampaignConfig = campaignConfig) {
  if (config.mode === 'off') return false;
  if (config.mode === 'on') return true;
  const start = config.startAt ? Date.parse(config.startAt) : NaN;
  const end = config.endAt ? Date.parse(config.endAt) : NaN;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return false;
  return now >= start && now < end;
}

export function nextCampaignTransition(now = Date.now(), config: CampaignConfig = campaignConfig) {
  if (config.mode !== 'auto') return null;
  const start = config.startAt ? Date.parse(config.startAt) : NaN;
  const end = config.endAt ? Date.parse(config.endAt) : NaN;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return now < start ? start : now < end ? end : null;
}
