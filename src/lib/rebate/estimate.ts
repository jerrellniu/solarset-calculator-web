import {
  calcBattery,
  calcSolar,
  serviceTierForPostcode,
  type BatteryResult,
  type CustomerType,
  type SolarResult,
} from './calc';
import { RATES, type ServiceTier } from './rates';

export type RawInput = {
  customer: CustomerType;
  postcode: string;
  installDate: string;
  solarKw: string;
  batteryKwh: string;
};

export type FieldError =
  | 'postcode'
  | 'nothingEntered'
  | 'solarSize'
  | 'batterySize'
  | 'dateMissing'
  | 'dateBefore'
  | 'dateAfter';

export type Notice =
  | 'midScale'
  | 'overSmallCap'
  | 'overMidScaleCap'
  | 'batteryTooSmall'
  | 'batteryTooLarge'
  | 'batteryCapped'
  | 'gst';

export type Estimate = {
  ok: true;
  customer: CustomerType;
  postcode: number;
  systemKw: number | null;
  nominalKwh: number | null;
  solar: Extract<SolarResult, { eligible: true }> | null;
  battery: Extract<BatteryResult, { eligible: true }> | null;
  value: number;
  gst: number;
  total: number;
  tier: ServiceTier;
  notices: Notice[];
};

export type EstimateErrors = { ok: false; errors: FieldError[] };

const parseNumber = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : Number.NaN;
};

export function estimate(input: RawInput): Estimate | EstimateErrors {
  const errors: FieldError[] = [];
  const postcodeOk = /^\d{4}$/.test(input.postcode.trim());
  if (!postcodeOk) errors.push('postcode');

  const systemKw = parseNumber(input.solarKw);
  const nominalKwh = parseNumber(input.batteryKwh);
  if (systemKw === null && nominalKwh === null) errors.push('nothingEntered');
  if (systemKw !== null && !(systemKw > 0)) errors.push('solarSize');
  if (nominalKwh !== null && !(nominalKwh > 0)) errors.push('batterySize');

  const date = input.installDate.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.push('dateMissing');
  } else {
    const year = Number(date.slice(0, 4));
    const solarTooEarly = systemKw !== null && year < RATES.solar.firstInstallYear;
    const batteryTooEarly = nominalKwh !== null && date < RATES.battery.firstInstallDate;
    if (solarTooEarly || batteryTooEarly) errors.push('dateBefore');
    if (date > RATES.battery.lastInstallDate) errors.push('dateAfter');
  }

  if (errors.length > 0) return { ok: false, errors };

  const postcode = Number(input.postcode.trim());
  const notices: Notice[] = [];
  let solar: Estimate['solar'] = null;
  let battery: Estimate['battery'] = null;

  if (systemKw !== null) {
    const r = calcSolar({ systemKw, postcode, installDate: date, customer: input.customer });
    if (r.eligible) {
      solar = r;
      if (r.midScale) notices.push('midScale');
    } else if (r.reason === 'over-size-cap') {
      notices.push(r.capKw < RATES.solar.midScaleMaxKw ? 'overSmallCap' : 'overMidScaleCap');
    }
  }

  if (nominalKwh !== null) {
    const r = calcBattery({ nominalKwh, installDate: date, customer: input.customer });
    if (r.eligible) {
      battery = r;
      if (r.capped) notices.push('batteryCapped');
    } else if (r.reason === 'below-minimum') {
      notices.push('batteryTooSmall');
    } else if (r.reason === 'over-system-max') {
      notices.push('batteryTooLarge');
    }
  }

  const value = (solar?.value ?? 0) + (battery?.value ?? 0);
  const gst = (solar?.gst ?? 0) + (battery?.gst ?? 0);
  if (input.customer === 'business' && (solar || battery)) notices.push('gst');

  return {
    ok: true,
    customer: input.customer,
    postcode,
    systemKw,
    nominalKwh,
    solar,
    battery,
    value,
    gst,
    total: value + gst,
    tier: serviceTierForPostcode(postcode),
    notices,
  };
}
