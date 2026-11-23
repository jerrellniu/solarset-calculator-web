import { RATES } from './rebate/rates';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

/** 2026-11-23 → 23 November 2026 */
export function longDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** Whole dollars, with cents only when there are cents. */
export function money(value: number): string {
  const cents = Math.round(value * 100) % 100 !== 0;
  return value.toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });
}

export function num(value: number, maxDecimals: number = RATES.display.maxDecimals): string {
  return value.toLocaleString('en-AU', { maximumFractionDigits: maxDecimals });
}

/** 100 → 100kW, 1000 → 1MW */
export function kw(value: number): string {
  return value >= RATES.display.kwPerMw ? `${num(value / RATES.display.kwPerMw)}MW` : `${num(value)}kW`;
}

export function percent(share: number): string {
  return `${num(share * RATES.display.percentScale)} per cent`;
}

export function word(n: number): string {
  return WORDS[n] ?? String(n);
}
