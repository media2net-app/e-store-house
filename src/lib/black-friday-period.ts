export const BLACK_FRIDAY_START = '2026-11-03T00:00:00+02:00';
export const BLACK_FRIDAY_END = '2026-11-17T00:00:00+02:00';
export function blackFridayActive(now = Date.now()) {
  return now >= Date.parse(BLACK_FRIDAY_START) && now < Date.parse(BLACK_FRIDAY_END);
}
