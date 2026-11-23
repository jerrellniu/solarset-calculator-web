import { RATES, type ServiceTier, type Zone } from './rates';

/** Install dates are ISO strings: YYYY-MM-DD. */
export type IsoDate = string;
export type CustomerType = 'household' | 'business';

const floorCerts = (value: number): number => Math.floor(value + RATES.floorTolerance);

export function zoneForPostcode(postcode: number): Zone {
  const row = RATES.postcodeZones.find(([from, to]) => postcode >= from && postcode <= to);
  return row ? row[2] : RATES.fallbackZone;
}

export function serviceTierForPostcode(postcode: number): ServiceTier {
  const inRange = (ranges: ReadonlyArray<readonly [number, number]>) =>
    ranges.some(([from, to]) => postcode >= from && postcode <= to);
  if (inRange(RATES.serviceTiers.core)) return 'core';
  if (inRange(RATES.serviceTiers.nearby)) return 'nearby';
  return 'outside';
}

export function sizeCapKw(installDate: IsoDate): number {
  return installDate >= RATES.solar.midScaleFrom ? RATES.solar.midScaleMaxKw : RATES.solar.smallMaxKw;
}

export function deemingYears(installDate: IsoDate, systemKw: number): number {
  if (systemKw > RATES.solar.smallMaxKw) return RATES.solar.midScaleDeemingYears;
  const year = Number(installDate.slice(0, 4));
  return RATES.solar.deemingEndYear - year + 1;
}

export function batteryFactor(installDate: IsoDate): number | null {
  if (installDate < RATES.battery.firstInstallDate || installDate > RATES.battery.lastInstallDate) {
    return null;
  }
  let factor: number | null = null;
  for (const row of RATES.battery.factors) {
    if (installDate >= row.from) factor = row.factor;
  }
  return factor;
}

export type Money = { certificates: number; value: number; gst: number; total: number };

function money(certificates: number, customer: CustomerType, price: number): Money {
  const value = certificates * price;
  const gst = customer === 'business' ? value * RATES.gstRate : 0;
  return { certificates, value, gst, total: value + gst };
}

export type SolarInput = {
  systemKw: number;
  postcode: number;
  installDate: IsoDate;
  customer: CustomerType;
  certificatePrice?: number;
};

export type SolarResult =
  | { eligible: false; reason: 'over-size-cap' | 'invalid-size' | 'unsupported-date'; capKw: number }
  | ({ eligible: true; zone: Zone; zoneRating: number; years: number; midScale: boolean } & Money);

export function calcSolar(input: SolarInput): SolarResult {
  const capKw = sizeCapKw(input.installDate);
  const year = Number(input.installDate.slice(0, 4));
  if (!(input.systemKw > 0)) return { eligible: false, reason: 'invalid-size', capKw };
  if (year < RATES.solar.firstInstallYear || year > RATES.solar.deemingEndYear) {
    return { eligible: false, reason: 'unsupported-date', capKw };
  }
  if (input.systemKw > capKw) return { eligible: false, reason: 'over-size-cap', capKw };

  const zone = zoneForPostcode(input.postcode);
  const zoneRating = RATES.zoneRatings[zone];
  const years = deemingYears(input.installDate, input.systemKw);
  const certificates = floorCerts(input.systemKw * zoneRating * years);
  return {
    eligible: true,
    zone,
    zoneRating,
    years,
    midScale: input.systemKw > RATES.solar.smallMaxKw,
    ...money(certificates, input.customer, input.certificatePrice ?? RATES.certificatePrice),
  };
}

export type BatteryResult =
  | { eligible: false; reason: 'below-minimum' | 'over-system-max' | 'unsupported-date' }
  | ({ eligible: true; usableKwh: number; claimableKwh: number; factor: number; capped: boolean } & Money);

type BatteryBase = { installDate: IsoDate; customer: CustomerType; certificatePrice?: number };

/** Takes usable capacity, in kWh. */
export function calcBatteryUsable(input: BatteryBase & { usableKwh: number; nominalKwh?: number }): BatteryResult {
  const factor = batteryFactor(input.installDate);
  if (factor === null) return { eligible: false, reason: 'unsupported-date' };
  if (input.nominalKwh !== undefined && input.nominalKwh > RATES.battery.maxSystemKwh) {
    return { eligible: false, reason: 'over-system-max' };
  }
  if (input.usableKwh < RATES.battery.minUsableKwh) return { eligible: false, reason: 'below-minimum' };

  const claimableKwh = Math.min(input.usableKwh, RATES.battery.maxClaimableKwh);
  let previousLimit = 0;
  let total = 0;
  for (const band of RATES.battery.bands) {
    const inBand = Math.max(0, Math.min(claimableKwh, band.upToKwh) - previousLimit);
    total += inBand * factor * band.share;
    previousLimit = band.upToKwh;
  }
  const certificates = floorCerts(total);
  return {
    eligible: true,
    usableKwh: input.usableKwh,
    claimableKwh,
    factor,
    capped: input.usableKwh > RATES.battery.maxClaimableKwh,
    ...money(certificates, input.customer, input.certificatePrice ?? RATES.certificatePrice),
  };
}

/** Takes nominal capacity, in kWh, and derives usable capacity. */
export function calcBattery(input: BatteryBase & { nominalKwh: number }): BatteryResult {
  return calcBatteryUsable({ ...input, usableKwh: input.nominalKwh * RATES.battery.usableShare });
}

const inRanges = (postcode: number, ranges: ReadonlyArray<readonly [number, number]>) =>
  ranges.some(([from, to]) => postcode >= from && postcode <= to);

export type VppResult = {
  certificates: number;
  value: number;
  capacityKwh: number;
  capped: boolean;
  networkLossFactor: number;
};

/** NSW VPP incentive (PDRS BESS2). Returns null when the postcode is not in NSW or the battery is outside the limits. */
export function calcNswVpp(input: { usableKwh: number; postcode: number; certificatePrice?: number }): VppResult | null {
  const v = RATES.nswVpp;
  if (!inRanges(input.postcode, v.nswPostcodes)) return null;
  if (!(input.usableKwh > v.minUsableKwhExclusive) || input.usableKwh > v.maxUsableKwh) return null;
  const capacityKwh = Math.min(input.usableKwh, v.capKwh);
  const networkLossFactor = inRanges(input.postcode, v.ausgridPostcodes)
    ? v.networkLossFactor.ausgrid
    : v.networkLossFactor.default;
  const reduction = capacityKwh * v.coefficientKwPerKwh * v.firmnessFactor * v.durationHours * v.lifetimeYears;
  const certificates = floorCerts(reduction * networkLossFactor * v.certificatesPerKw);
  return {
    certificates,
    value: certificates * (input.certificatePrice ?? v.certificatePrice),
    capacityKwh,
    capped: input.usableKwh > v.capKwh,
    networkLossFactor,
  };
}
