import campaign from '@/data/campaign.json';

export type CampaignConfig = { timeZone: 'Europe/Bucharest'; mode: 'on' | 'off' | 'auto'; startAt: string | null; endAt: string | null };
export const campaignConfig = campaign as CampaignConfig;

/** Reject impossible calendar dates and offsets before Date.parse can normalize them. */
function configuredInstant(value: string | null) {
  if (value === null) return null;
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\+0[23]:00)$/.exec(value);
  if (!parts) return NaN;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, offset] = parts;
  const year = Number(yearText), month = Number(monthText), day = Number(dayText);
  const hour = Number(hourText), minute = Number(minuteText), second = Number(secondText);
  if (month < 1 || month > 12 || day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate()
    || hour > 23 || minute > 59 || second > 59) return NaN;
  const instant = Date.parse(value);
  const actualOffset = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Bucharest', timeZoneName: 'longOffset' })
    .formatToParts(new Date(instant)).find(part => part.type === 'timeZoneName')?.value;
  return actualOffset === `GMT${offset}` ? instant : NaN;
}

/** A missing start means the campaign is already running; its end is still required. */
export function campaignActive(now = Date.now(), config: CampaignConfig = campaignConfig) {
  if (config.mode === 'off') return false;
  if (config.mode === 'on') return true;
  const start = configuredInstant(config.startAt);
  const end = configuredInstant(config.endAt);
  if (end === null || !Number.isFinite(end) || (start !== null && (!Number.isFinite(start) || end <= start))) return false;
  return (start === null || now >= start) && now < end;
}

export function nextCampaignTransition(now = Date.now(), config: CampaignConfig = campaignConfig) {
  if (config.mode !== 'auto') return null;
  const start = configuredInstant(config.startAt);
  const end = configuredInstant(config.endAt);
  if (end === null || !Number.isFinite(end) || (start !== null && (!Number.isFinite(start) || end <= start))) return null;
  return start !== null && now < start ? start : now < end ? end : null;
}
