import { describe, expect, it } from 'vitest';
import { estimate } from './estimate';
import * as copy from '../../content/copy';

const base = { customer: 'household' as const, postcode: '4220', installDate: '2026-12-15', solarKw: '6.6', batteryKwh: '13' };

describe('estimate', () => {
  it('combines solar and battery for an in-area household', () => {
    const r = estimate(base);
    expect(r).toMatchObject({ ok: true, tier: 'core', total: 4588, gst: 0 });
  });

  it('adds GST for a business without a separate notice', () => {
    const r = estimate({ ...base, customer: 'business' });
    expect(r).toMatchObject({ ok: true, gst: 458.8, notices: [] });
  });

  it('reports field errors', () => {
    const r = estimate({ ...base, postcode: '42', installDate: '', solarKw: '', batteryKwh: '' });
    expect(r).toEqual({ ok: false, errors: ['postcode', 'nothingEntered', 'dateMissing'] });
  });

  it('rejects a battery install before the program dates', () => {
    const r = estimate({ ...base, installDate: '2026-03-01' });
    expect(r).toMatchObject({ ok: false, errors: ['dateBefore'] });
  });

  it('flags a 120 kW system before 1 October 2026 as over the cap', () => {
    const r = estimate({ ...base, batteryKwh: '', solarKw: '120', installDate: '2026-09-01' });
    expect(r).toMatchObject({ ok: true, solar: null, notices: ['overSmallCap'] });
  });

  it('flags mid-scale systems and battery limits', () => {
    const r = estimate({ ...base, solarKw: '500', batteryKwh: '80', installDate: '2027-03-01' });
    if (!r.ok) throw new Error('expected ok');
    expect(r.notices).toEqual(expect.arrayContaining(['midScale', 'batteryCapped']));
  });

  it('labels Sunshine Coast and Melbourne postcodes outside core', () => {
    const sc = estimate({ ...base, postcode: '4558' });
    const mel = estimate({ ...base, postcode: '3000' });
    expect(sc).toMatchObject({ tier: 'nearby' });
    expect(mel).toMatchObject({ tier: 'outside', total: 4366 });
  });
});

describe('copy', () => {
  it('has no unfilled placeholders', () => {
    const text = JSON.stringify(copy);
    expect(text).not.toMatch(/undefined|NaN|\{[a-zA-Z]+\}/);
  });
});
