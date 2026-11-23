import { describe, expect, it } from 'vitest';
import {
  batteryFactor,
  calcBattery,
  calcBatteryUsable,
  calcSolar,
  serviceTierForPostcode,
  zoneForPostcode,
} from './calc';
import { RATES } from './rates';

describe('Greenbank cross-check cases', () => {
  it('6.6 kW at 4220 in 2026 gives 45 certificates over 5 years', () => {
    const r = calcSolar({ systemKw: 6.6, postcode: 4220, installDate: '2026-12-15', customer: 'household' });
    expect(r).toMatchObject({ eligible: true, certificates: 45, years: 5, zone: 3 });
  });

  it('6.6 kW at 4220 in January 2027 gives 36 certificates, 4 years, $1,332 at $37', () => {
    const r = calcSolar({ systemKw: 6.6, postcode: 4220, installDate: '2027-01-10', customer: 'household' });
    expect(r).toMatchObject({ eligible: true, certificates: 36, years: 4, value: 1332 });
  });

  it('16.6 kWh usable battery in 2026 gives 105 certificates', () => {
    const r = calcBatteryUsable({ usableKwh: 16.6, installDate: '2026-11-23', customer: 'household' });
    expect(r).toMatchObject({ eligible: true, certificates: 105, factor: 6.8 });
  });

  it('battery over 50 kWh usable is capped at 50', () => {
    const r = calcBatteryUsable({ usableKwh: 60, installDate: '2026-11-23', customer: 'household' });
    expect(r).toMatchObject({ eligible: true, claimableKwh: 50, capped: true });
  });

  it('postcode 3000 is zone 4 at 1.185', () => {
    expect(zoneForPostcode(3000)).toBe(4);
    expect(RATES.zoneRatings[4]).toBe(1.185);
  });

  it('a 120 kW system before 1 October 2026 is over the cap', () => {
    const r = calcSolar({ systemKw: 120, postcode: 4220, installDate: '2026-09-30', customer: 'business' });
    expect(r).toMatchObject({ eligible: false, reason: 'over-size-cap', capKw: 100 });
  });

  it('GST applies for a business and never for a household', () => {
    const base = { systemKw: 6.6, postcode: 4220, installDate: '2026-12-15' };
    const business = calcSolar({ ...base, customer: 'business' });
    const household = calcSolar({ ...base, customer: 'household' });
    expect(business).toMatchObject({ value: 1665, gst: 166.5, total: 1831.5 });
    expect(household).toMatchObject({ gst: 0, total: 1665 });
  });
});

describe('Scheme rules', () => {
  it('a 500 kW system on or after 1 October 2026 gets a fixed 5-year period', () => {
    const r = calcSolar({ systemKw: 500, postcode: 4220, installDate: '2027-03-01', customer: 'business' });
    expect(r).toMatchObject({ eligible: true, years: 5, midScale: true });
  });

  it('a system over 1 MW is over the cap', () => {
    const r = calcSolar({ systemKw: 1001, postcode: 4220, installDate: '2027-03-01', customer: 'business' });
    expect(r).toMatchObject({ eligible: false, reason: 'over-size-cap', capKw: 1000 });
  });

  it('battery factor steps down on the install date', () => {
    expect(batteryFactor('2026-12-31')).toBe(6.8);
    expect(batteryFactor('2027-01-01')).toBe(5.7);
    expect(batteryFactor('2027-07-01')).toBe(5.2);
    expect(batteryFactor('2026-04-30')).toBeNull();
    expect(batteryFactor('2031-01-01')).toBeNull();
  });

  it('nominal capacity is reduced to usable capacity', () => {
    const r = calcBattery({ nominalKwh: 10, installDate: '2026-11-23', customer: 'household' });
    expect(r).toMatchObject({ eligible: true, usableKwh: 9 });
  });

  it('rejects a battery below the minimum or above the system maximum', () => {
    expect(calcBattery({ nominalKwh: 5, installDate: '2026-11-23', customer: 'household' })).toMatchObject({
      eligible: false,
      reason: 'below-minimum',
    });
    expect(calcBattery({ nominalKwh: 101, installDate: '2026-11-23', customer: 'household' })).toMatchObject({
      eligible: false,
      reason: 'over-system-max',
    });
  });
});

describe('Lookups', () => {
  it('the postcode zone table is contiguous from 0000 to 9999', () => {
    const rows = RATES.postcodeZones;
    expect(rows).toHaveLength(137);
    expect(rows[0][0]).toBe(0);
    expect(rows[rows.length - 1][1]).toBe(9999);
    for (let i = 1; i < rows.length; i++) expect(rows[i][0]).toBe(rows[i - 1][1] + 1);
  });

  it('Sunshine Coast postcodes are not core', () => {
    expect(serviceTierForPostcode(4558)).not.toBe('core');
  });

  it('Gold Coast, Brisbane and Northern NSW are core', () => {
    expect(serviceTierForPostcode(4220)).toBe('core');
    expect(serviceTierForPostcode(4000)).toBe('core');
    expect(serviceTierForPostcode(2486)).toBe('core');
  });
});
