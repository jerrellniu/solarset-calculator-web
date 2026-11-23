/**
 * Every word on the calculator, from the locked Notion copy deck:
 * "Copy Deck — Rebate Calculator (November 2026)", locked by Jerrell on 23 November 2026.
 * https://app.notion.com/p/4211585a06a681418c03f39ab01a01ce
 *
 * Rates and dates are filled from rates.ts, so no number is typed here.
 * Change wording in Notion first, then sync it here.
 */
import { RATES } from '@/lib/rebate/rates';
import { kw, longDate, money, percent, word } from '@/lib/format';
import type { FieldError, Notice } from '@/lib/rebate/estimate';
import type { ServiceTier } from '@/lib/rebate/rates';

const price = money(RATES.certificatePrice);
const asAt = longDate(RATES.asAt);
const end = RATES.solar.deemingEndYear;
const claimable = `${RATES.battery.maxClaimableKwh}kWh`;
const smallCap = kw(RATES.solar.smallMaxKw);
const midCap = kw(RATES.solar.midScaleMaxKw);
const midFrom = longDate(RATES.solar.midScaleFrom);
const midYears = word(RATES.solar.midScaleDeemingYears);

export const SITE = {
  url: 'https://rebate-calculator.solarset.com.au',
  main: 'https://solarset.com.au',
  requestQuote: 'https://solarset.com.au/request-quote/',
  serviceAreas: 'https://solarset.com.au/service-areas/',
  rebatesHub: 'https://solarset.com.au/solar-battery-rebates/',
  packages: 'https://solarset.com.au/solar-battery-packages/',
  phone: '1300 330 923',
  phoneHref: 'tel:1300330923',
  licences: 'QLD Electrical Licence 89708. NSW Contractor Licence 386235C.',
  nav: [
    { label: 'Commercial Solar', href: 'https://solarset.com.au/commercial-solar/' },
    { label: 'Residential Solar', href: 'https://solarset.com.au/residential-solar/' },
    { label: 'About Us', href: 'https://solarset.com.au/about-us/' },
    { label: 'Projects', href: 'https://solarset.com.au/projects/' },
  ],
  contact: { label: 'Contact Us', href: 'https://solarset.com.au/contact-us/' },
  /** Set to an image path once Holly supplies a project photo. Until then the hero runs full width. */
  heroPhoto: null as null | { src: string; alt: string },
};

export const PAGE = {
  title: 'Solar and Battery Rebate Calculator',
  description:
    'Estimate your solar and battery rebate for the Gold Coast, Brisbane and Northern NSW. Enter your postcode, system size and install date and see your certificates and discount.',
  h1Lead: 'Solar and battery',
  h1Rest: 'rebate calculator',
  intro: 'Find out what the federal rebate takes off your solar and battery quote.',
  supporting:
    'Enter your postcode, your system size and your install date. The calculator shows your certificates, their value and every assumption behind the figure. It takes about a minute, and it stores nothing about you.',
};

export const FORM = {
  customerLegend: 'Who is the system for?',
  customerHelp: 'Choose household or business. GST is included for businesses.',
  household: { label: 'Household', help: 'A home you live in or own.' },
  business: { label: 'Business registered for GST', help: 'A business that will use the system for the business.' },
  postcode: { label: 'Install address postcode', help: 'We use your postcode to find your solar zone.' },
  installDate: { label: 'Install date', help: 'The date your installer expects to test and commission the system.' },
  solar: {
    label: 'Solar system size (kW)',
    help: 'Add the panel capacity in kilowatts. Leave blank if you are only adding a battery.',
  },
  battery: {
    label: 'Battery capacity (kWh)',
    help: 'Use the nominal capacity on the battery datasheet. We reduce it to usable capacity. Leave blank if you are only adding solar.',
  },
  submit: 'Calculate my rebate',
  reset: 'Start again',
};

export const ERRORS: Record<FieldError, string> = {
  postcode: 'Enter a four digit postcode (like 4000.)',
  nothingEntered: 'Enter a solar size, a battery size, or both.',
  solarSize: 'Enter a solar size greater than zero.',
  /** Not in the deck: written to match the solar message. Confirm wording. */
  batterySize: 'Enter a battery size greater than zero.',
  dateMissing: 'Choose your install date.',
  dateBefore: `We can only calculate installs from ${longDate(RATES.battery.firstInstallDate)} for batteries and from 1 January ${RATES.solar.firstInstallYear} for solar.`,
  dateAfter: `The scheme ends on ${longDate(RATES.battery.lastInstallDate)}, so we cannot calculate installs after that date.`,
};

export const RESULT = {
  heading: 'Your estimated rebate',
  totalBefore: 'Your rebate is worth about',
  totalAfter: 'This comes off your quote as a discount.',
  caption: `The figure uses ${price} a certificate, checked ${asAt}. Your agent's price may be different, so treat it as an estimate.`,
  solarCerts: 'Solar certificates',
  solarValue: 'Solar value',
  batteryCerts: 'Battery certificates',
  batteryValue: 'Battery value',
  gst: `GST at ${percent(RATES.gstRate)}`,
  total: 'Total',
};

export const WORKING = {
  heading: 'How we worked this out',
  solar: (p: { systemKw: string; postcode: string; zone: number; zoneRating: string; years: number; midScale: boolean }) =>
    p.midScale
      ? `Your ${p.systemKw}kW system in postcode ${p.postcode} sits in zone ${p.zone}, with a rating of ${p.zoneRating}. It earns that rating for each of ${p.years} years. We round the certificates down to a whole number.`
      : `Your ${p.systemKw}kW system in postcode ${p.postcode} sits in zone ${p.zone}, with a rating of ${p.zoneRating}. It earns that rating for each of ${p.years} years, from your install year to the end of the scheme in ${end}. We round the certificates down to a whole number.`,
  battery: (p: { nominalKwh: string; usableKwh: string; factor: string }) =>
    `Your ${p.nominalKwh}kWh battery has about ${p.usableKwh}kWh of usable capacity. The federal program pays on the first ${claimable} of usable capacity, and larger batteries earn less for each kWh above the first band. Your install date sets a factor of ${p.factor}, which steps down every six months until ${end}.`,
};

export const TIERS: Record<ServiceTier, { heading: string; copy: string; button: string; href: string; primary: boolean }> = {
  core: {
    heading: 'We install in your area',
    copy: 'Solar Set installs across the Gold Coast, Brisbane and Northern NSW. Request a free quote and we will confirm your rebate on a written quote.',
    button: 'Get a free quote',
    href: SITE.requestQuote,
    primary: true,
  },
  nearby: {
    heading: 'We may be able to install in your area',
    copy: 'Your postcode is close to the areas we cover. Request a quote and we will confirm whether we can install at your address.',
    button: 'Ask about your address',
    href: SITE.requestQuote,
    primary: true,
  },
  outside: {
    heading: 'You are outside our service area',
    copy: 'We install on the Gold Coast, in Brisbane and across Northern NSW. The rebate estimate above still applies to any installer.',
    button: 'See where we install',
    href: SITE.serviceAreas,
    primary: false,
  },
};

export const NOTICES: Record<Notice, { heading: string; copy: string }> = {
  midScale: {
    heading: 'Your system is a mid-scale system',
    copy: `Systems over ${smallCap} and up to ${midCap} can claim certificates for installs from ${midFrom}, with a fixed ${midYears} year period. You can instead register as a power station and earn large-scale certificates, and choosing one can rule out the other. Check the Clean Energy Regulator's guidance before you choose.`,
  },
  overSmallCap: {
    heading: `Your system is over the ${smallCap} limit`,
    copy: `Certificates for this size start from ${midFrom}. Change your install date, or ask us about large-scale certificates.`,
  },
  overMidScaleCap: {
    heading: `Your system is over ${midCap}`,
    copy: `The rebate covers systems up to ${midCap}. Ask us about large-scale certificates.`,
  },
  batteryTooSmall: {
    heading: 'Your battery is too small',
    copy: `The federal program needs at least ${RATES.battery.minUsableKwh}kWh of usable capacity.`,
  },
  batteryTooLarge: {
    heading: 'Your battery is too large',
    copy: `The federal program covers systems up to ${RATES.battery.maxSystemKwh}kWh.`,
  },
  batteryCapped: {
    heading: `Only the first ${claimable} counts`,
    copy: `The program pays on the first ${claimable} of usable capacity, so we have capped your result there.`,
  },
  gst: {
    heading: 'GST is included',
    copy: `Your business is registered for GST and uses the system for the business, so the certificates are taxable and we have added ${percent(RATES.gstRate)}. Ask your accountant to confirm how this applies to you.`,
  },
};

export const CTA = {
  headingLead: 'Want',
  headingRest: 'a written quote?',
  copy: 'This is only an estimate. Your quote shows the exact discount for your system, applied by Solar Set before you pay. Request a free quote and we will confirm it for your address.',
  button: 'Get a free quote',
  links: [
    { label: 'See our solar and battery rebates guide', href: SITE.rebatesHub },
    { label: 'See our packages', href: SITE.packages },
  ],
};

export const FOOTER_NOTE = `This calculator gives an estimate only and is not financial or tax advice. Figures use the Clean Energy Regulator's rules and the certificate price shown, checked ${asAt}. The scheme changes on a schedule, so your quote is the final figure. We do not store anything you enter.`;

export const FAQ_HEADING = { lead: 'Your rebate', rest: 'questions, answered' };

export const FAQS: Array<{ q: string; a: string }> = [
  {
    q: 'What is a small-scale technology certificate?',
    a: 'A small-scale technology certificate, or STC, is a federal certificate created when you install an eligible solar or battery system. Your installer sells the certificates to an agent and takes the value off your quote. You get the saving as a discount at the time you buy, with no forms to lodge.',
  },
  {
    q: 'How many certificates will my solar system earn?',
    a: 'Your solar system earns its size in kilowatts, multiplied by the rating for your postcode zone and by the number of years left in the scheme. A bigger system, a sunnier zone and an earlier install date all earn more certificates. The calculator shows each of those numbers so you can check the working.',
  },
  {
    q: 'Why does my install date change the result?',
    a: `Your install date sets how many years of output the scheme counts, and it sets the battery factor. A solar system installed in ${RATES.solar.firstInstallYear + 1} earns one year less than the same system installed in ${RATES.solar.firstInstallYear}. The battery factor steps down every January and July until ${end}, so an earlier install earns more.`,
  },
  {
    q: 'Does the battery rebate cover the whole battery?',
    a: `No. The federal program pays on the first ${claimable} of usable capacity, and each kWh above the first band earns less than the one before it. This means a mid-sized battery gives you the strongest return for each kWh. The calculator applies these bands for you.`,
  },
  {
    q: 'What is the difference between nominal and usable capacity?',
    a: `Nominal capacity is the size on the battery's label, and usable capacity is the part you can draw on. We estimate usable capacity at ${percent(RATES.battery.usableShare)} of nominal, which is a common industry rule rather than a scheme rule. Your quote will use the figure from the battery's datasheet.`,
  },
  {
    q: `Why does the calculator use ${price} for each certificate?`,
    a: `Certificate prices move with the market, and agents pay different rates, so we use one stated price and show its date. ${price} is our working figure as at ${asAt}. Your quote shows the rate that applies to your system.`,
  },
  {
    q: 'Do businesses pay GST on the rebate?',
    a: 'A business that is registered for GST and uses the system for the business pays GST on the certificates. The Australian Taxation Office treats the sale of the certificates as a taxable sale. Households do not pay GST on them, and you should ask your accountant how it applies to your business.',
  },
  {
    q: `Can I claim for a system over ${smallCap}?`,
    a: `Yes, for installs from ${midFrom}. The rebate now covers systems up to ${midCap}, with a fixed ${midYears} year period for systems over ${smallCap}. You can choose large-scale certificates instead, and choosing one can rule out the other, so check the Clean Energy Regulator's guidance first.`,
  },
  {
    q: 'Does this calculator include state incentives?',
    a: 'No. It covers the federal solar and battery rebates only. Queensland has no state battery incentive at the moment, and we do not show New South Wales payments here.',
  },
  {
    q: 'Do you store my details?',
    a: 'No. The calculation runs in your browser, and we do not keep your postcode, your system size or your result. If you request a quote, you give us your details on that form instead.',
  },
  {
    q: 'Where does Solar Set install?',
    a: 'Solar Set installs across the Gold Coast, Brisbane and Northern NSW. Enter your postcode and the calculator tells you whether your address is in our area, nearby or outside it.',
  },
];
