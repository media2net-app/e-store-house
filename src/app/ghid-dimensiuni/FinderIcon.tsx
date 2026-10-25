import type { ReactNode } from 'react';
export type FinderIconName = 'material' | 'color' | 'sheet' | 'mattress' | 'duvet' | 'pillow' | 'budget' | 'spark' | 'ruler';
const shapes: Record<FinderIconName, ReactNode> = {
  material: <><path d="M5 3h14v18H5zM5 8h14M5 13h14M5 18h14M9 3v18M14 3v18"/></>,
  color: <><path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-3.7 1.7 1.7 0 0 1 1-3.1h2A4 4 0 0 0 21 10c0-4-4-7-9-7Z"/><circle cx="7.5" cy="10" r=".8"/><circle cx="11" cy="7" r=".8"/><circle cx="15.5" cy="8" r=".8"/><circle cx="7.5" cy="15" r=".8"/></>,
  sheet: <><path d="M4 4h13l3 4v12H4zM17 4v5h3M7 16c3-3 7 3 10 0"/></>,
  mattress: <><rect x="3" y="7" width="18" height="11" rx="3"/><path d="M3 12c5 3 13 3 18 0M7 7V5m10 2V5M7 18v2m10-2v2"/></>,
  duvet: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="m4 8 16 8M4 14l13 7M9 3l11 5M10 3 4 15M17 3 8 21M20 11l-5 10"/></>,
  pillow: <><path d="M4 5c5 2 11 2 16 0-1 5-1 9 0 14-5-2-11-2-16 0 1-5 1-9 0-14Z"/><path d="M7 9c3 1 7 1 10 0M7 15c3-1 7-1 10 0"/></>,
  budget: <><rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 9h18M17 13h4v4h-4a2 2 0 0 1 0-4ZM6 5V3h12"/></>,
  spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/></>,
  ruler: <><path d="m3 16 13-13 5 5L8 21zM13 6l3 3M9 10l2 2M5 14l3 3"/></>,
};
export default function FinderIcon({ name }: { name: FinderIconName }) {
  return <svg className="finder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{shapes[name]}</svg>;
}
