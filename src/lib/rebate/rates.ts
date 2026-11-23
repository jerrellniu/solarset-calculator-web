/**
 * Every rate, date, threshold and lookup table for the calculator lives in this file.
 * Nothing else in the codebase holds a number. To change a rate, change it here and
 * update `asAt`.
 *
 * Sources:
 * - Zone ratings and postcode zones: Renewable Energy (Electricity) (Zone Ratings and Zones
 *   for Solar (Photovoltaic) Systems) Instrument 2019 (137 contiguous ranges, 0000 to 9999).
 * - Battery bands and factors: Clean Energy Regulator, Cheaper Home Batteries Program.
 *   Factors confirmed to January 2029. The three factors after that (3.1, 2.6, 2.1) come from the
 *   Logic Spec and are still to be confirmed against the regulator.
 * - Certificate price: DEFAULT of $37.00, set by Jerrell on 23 November 2026, until Holly names
 *   her agent and rate.
 */

export type Zone = 1 | 2 | 3 | 4;
export type ServiceTier = 'core' | 'nearby' | 'outside';

export const RATES = {
  /** Date these rates were last checked. Shown on the page. */
  asAt: '2026-11-23',

  /** Dollars per certificate. DEFAULT pending Holly's agent and rate. */
  certificatePrice: 37,

  /** GST rate for GST registered businesses installing for the business. */
  gstRate: 0.1,

  /** Display helpers used by the copy. */
  display: { maxDecimals: 2, kwPerMw: 1000, percentScale: 100, usableDecimals: 1 },

  /** Absorbs floating point error before rounding certificates down. */
  floorTolerance: 1e-9,

  zoneRatings: { 1: 1.622, 2: 1.536, 3: 1.382, 4: 1.185 } as Record<Zone, number>,

  /** Zone used if a postcode ever falls outside the table. */
  fallbackZone: 3 as Zone,

  solar: {
    /** The scheme ends on this date, which sets the deeming years for small systems. */
    deemingEndYear: 2030,
    /** First and last install years the calculator supports. */
    firstInstallYear: 2026,
    /** Small systems are up to and including this size, in kW. */
    smallMaxKw: 100,
    /** Mid-scale systems (over smallMaxKw up to midScaleMaxKw) get a fixed deeming period. */
    midScaleMaxKw: 1000,
    midScaleDeemingYears: 5,
    /** Before this date the size cap is smallMaxKw. From it, the cap is midScaleMaxKw. */
    midScaleFrom: '2026-10-01',
  },

  battery: {
    /** Usable capacity as a share of the nominal capacity (Greenbank's convention). */
    usableShare: 0.9,
    minUsableKwh: 5,
    maxSystemKwh: 100,
    /** Only the first 50 kWh of usable capacity earns certificates. */
    maxClaimableKwh: 50,
    /** First install date the tiered program applies to. */
    firstInstallDate: '2026-05-01',
    /** Marginal bands: kWh up to this level earn this share of the factor. */
    bands: [
      { upToKwh: 14, share: 1 },
      { upToKwh: 28, share: 0.6 },
      { upToKwh: 50, share: 0.15 },
    ],
    /** Certificate factor by install date. Each row applies from its date. */
    factors: [
      { from: '2026-05-01', factor: 6.8 },
      { from: '2027-01-01', factor: 5.7 },
      { from: '2027-07-01', factor: 5.2 },
      { from: '2028-01-01', factor: 4.6 },
      { from: '2028-07-01', factor: 4.1 },
      { from: '2029-01-01', factor: 3.6 },
      { from: '2029-07-01', factor: 3.1 },
      { from: '2030-01-01', factor: 2.6 },
      { from: '2030-07-01', factor: 2.1 },
    ],
    /** Last day the program runs. */
    lastInstallDate: '2030-12-31',
  },

  /**
   * NSW virtual power plant incentive: Peak Demand Reduction Scheme activity BESS2, "Onboard a
   * Behind the Meter Battery Energy Storage System with a Demand Response Aggregator", per the
   * PDRS (Amendment No. 2) Rule 2026, commenced 1 July 2026.
   * Certificates = min(usable, capKwh) x coefficient x firmness x durationHours x lifetimeYears
   *                x network loss factor x certificatesPerKw, rounded down.
   * Cross-check: 16.6 kWh usable in the Essential Energy area gives 368 certificates (Greenbank).
   */
  nswVpp: {
    coefficientKwPerKwh: 0.0734,
    firmnessFactor: 0.8,
    durationHours: 6,
    lifetimeYears: 6,
    capKwh: 28,
    /** Usable capacity must be greater than this. */
    minUsableKwhExclusive: 2,
    /** Usable capacity must be no more than this. */
    maxUsableKwh: 50,
    certificatesPerKw: 10,
    /** Minimum VPP contract, in months. */
    contractMonths: 12,
    /** Dollars per certificate. DEFAULT: Greenbank's price, checked 10 September 2026. */
    certificatePrice: 2,
    /** Network loss factors (Rule Table A3). Essential and Endeavour are 1.05, Ausgrid 1.04. */
    networkLossFactor: { default: 1.05, ausgrid: 1.04 },
    /** NSW postcodes. The ACT ranges (2600 to 2618, 2900 to 2920) are excluded. */
    nswPostcodes: [
      [1000, 2599],
      [2619, 2899],
      [2921, 2999],
    ] as Array<[number, number]>,
    /** APPROXIMATE Ausgrid area: Sydney east, north and inner west, Central Coast, Hunter. Error is at most 1%. */
    ausgridPostcodes: [
      [2000, 2139],
      [2190, 2239],
      [2250, 2339],
    ] as Array<[number, number]>,
  },

  /**
   * Service area. DEFAULT bands pending Holly (open item 7 in the Logic Spec). The Sunshine
   * Coast is not core. Ranges are inclusive postcodes. Anything not listed is outside.
   */
  serviceTiers: {
    core: [
      [4000, 4179], // Brisbane
      [4207, 4230], // Gold Coast
      [2470, 2490], // Northern NSW
    ] as Array<[number, number]>,
    nearby: [
      [4180, 4206],
      [4231, 4299],
      [4500, 4575], // Moreton Bay to Sunshine Coast
      [2440, 2469],
      [2491, 2499],
    ] as Array<[number, number]>,
  },

  /** Clean Energy Regulator postcode zones: [from, to, zone]. 137 ranges, contiguous. */
  postcodeZones: [
  [0, 799, 3],
  [800, 853, 2],
  [854, 854, 3],
  [855, 861, 2],
  [862, 862, 3],
  [863, 869, 2],
  [870, 879, 1],
  [880, 885, 3],
  [886, 1000, 2],
  [1001, 2355, 3],
  [2356, 2357, 2],
  [2358, 2384, 3],
  [2385, 2389, 2],
  [2390, 2395, 3],
  [2396, 2397, 2],
  [2398, 2399, 3],
  [2400, 2400, 2],
  [2401, 2404, 3],
  [2405, 2407, 2],
  [2408, 2544, 3],
  [2545, 2554, 4],
  [2555, 2627, 3],
  [2628, 2628, 4],
  [2629, 2629, 3],
  [2630, 2639, 4],
  [2640, 2816, 3],
  [2817, 2817, 2],
  [2818, 2820, 3],
  [2821, 2829, 2],
  [2830, 2830, 3],
  [2831, 2841, 2],
  [2842, 2872, 3],
  [2873, 2873, 2],
  [2874, 2877, 3],
  [2878, 2889, 2],
  [2890, 2999, 3],
  [3000, 3035, 4],
  [3036, 3038, 3],
  [3039, 3044, 4],
  [3045, 3045, 3],
  [3046, 3046, 4],
  [3047, 3049, 3],
  [3050, 3058, 4],
  [3059, 3059, 3],
  [3060, 3060, 4],
  [3061, 3064, 3],
  [3065, 3074, 4],
  [3075, 3076, 3],
  [3077, 3098, 4],
  [3099, 3099, 3],
  [3100, 3292, 4],
  [3293, 3302, 3],
  [3303, 3308, 4],
  [3309, 3319, 3],
  [3320, 3333, 4],
  [3334, 3337, 3],
  [3338, 3339, 4],
  [3340, 3758, 3],
  [3759, 3760, 4],
  [3761, 3764, 3],
  [3765, 3999, 4],
  [4000, 4416, 3],
  [4417, 4417, 2],
  [4418, 4427, 3],
  [4428, 4473, 2],
  [4474, 4476, 1],
  [4477, 4478, 2],
  [4479, 4485, 1],
  [4486, 4491, 2],
  [4492, 4492, 1],
  [4493, 4493, 2],
  [4494, 4494, 3],
  [4495, 4497, 2],
  [4498, 4719, 3],
  [4720, 4722, 2],
  [4723, 4723, 3],
  [4724, 4734, 2],
  [4735, 4736, 1],
  [4737, 4822, 3],
  [4823, 4823, 2],
  [4824, 4824, 3],
  [4825, 4827, 2],
  [4828, 4828, 3],
  [4829, 4829, 1],
  [4830, 5431, 3],
  [5432, 5450, 2],
  [5451, 5654, 3],
  [5655, 5669, 2],
  [5670, 5679, 3],
  [5680, 5699, 2],
  [5700, 5709, 3],
  [5710, 5722, 2],
  [5723, 5724, 1],
  [5725, 5730, 2],
  [5731, 5731, 1],
  [5732, 5732, 2],
  [5733, 5799, 1],
  [5800, 6043, 3],
  [6044, 6044, 2],
  [6045, 6256, 3],
  [6257, 6270, 4],
  [6271, 6316, 3],
  [6317, 6349, 4],
  [6350, 6353, 3],
  [6354, 6356, 4],
  [6357, 6394, 3],
  [6395, 6400, 4],
  [6401, 6430, 3],
  [6431, 6431, 2],
  [6432, 6433, 3],
  [6434, 6440, 2],
  [6441, 6441, 1],
  [6442, 6444, 3],
  [6445, 6459, 4],
  [6460, 6467, 3],
  [6468, 6469, 2],
  [6470, 6471, 3],
  [6472, 6472, 2],
  [6473, 6506, 3],
  [6507, 6508, 2],
  [6509, 6509, 3],
  [6510, 6536, 2],
  [6537, 6537, 1],
  [6538, 6555, 2],
  [6556, 6573, 3],
  [6574, 6602, 2],
  [6603, 6607, 3],
  [6608, 6641, 2],
  [6642, 6724, 1],
  [6725, 6750, 2],
  [6751, 6764, 1],
  [6765, 6765, 2],
  [6766, 6797, 1],
  [6798, 6799, 2],
  [6800, 6999, 3],
  [7000, 8999, 4],
  [9000, 9999, 3]
  ] as Array<[number, number, Zone]>,
} as const;
