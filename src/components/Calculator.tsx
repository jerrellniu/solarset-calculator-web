'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { ERRORS, FORM, NOTICES, RESULT, TIERS, WORKING } from '@/content/copy';
import { estimate, type Estimate, type FieldError, type RawInput } from '@/lib/rebate/estimate';
import { RATES } from '@/lib/rebate/rates';
import { money, num } from '@/lib/format';
import { Arrow, Battery, Info, Pin, Sun } from './Icons';

const EMPTY: RawInput = { customer: 'household', postcode: '', installDate: '', solarKw: '', batteryKwh: '' };

const FIELD_OF: Record<FieldError, keyof RawInput | 'sizes'> = {
  postcode: 'postcode',
  nothingEntered: 'sizes',
  solarSize: 'solarKw',
  batterySize: 'batteryKwh',
  dateMissing: 'installDate',
  dateBefore: 'installDate',
  dateAfter: 'installDate',
};

export default function Calculator() {
  const id = useId();
  const [input, setInput] = useState<RawInput>(EMPTY);
  const [result, setResult] = useState<Estimate | null>(null);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  const set = (key: keyof RawInput) => (value: string) => setInput((prev) => ({ ...prev, [key]: value }));

  const errorsFor = (field: keyof RawInput | 'sizes') => errors.filter((e) => FIELD_OF[e] === field);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const r = estimate(input);
    if (!r.ok) {
      setErrors(r.errors);
      setResult(null);
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setErrors([]);
    setResult(r);
    if (window.matchMedia('(max-width: 940px)').matches) {
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }

  function onReset() {
    setInput(EMPTY);
    setErrors([]);
    setResult(null);
  }

  const field = (
    key: 'postcode' | 'installDate' | 'solarKw' | 'batteryKwh',
    copy: { label: string; help: string },
    props: React.InputHTMLAttributes<HTMLInputElement>,
    extraErrors: FieldError[] = [],
  ) => {
    const fieldErrors = [...errorsFor(key), ...extraErrors];
    const inputId = `${id}-${key}`;
    return (
      <div className="field">
        <label htmlFor={inputId}>{copy.label}</label>
        <input
          id={inputId}
          value={input[key]}
          onChange={(e) => set(key)(e.target.value)}
          aria-invalid={fieldErrors.length > 0 || undefined}
          aria-describedby={`${inputId}-help${fieldErrors.length ? ` ${inputId}-err` : ''}`}
          {...props}
        />
        <span className="help" id={`${inputId}-help`}>{copy.help}</span>
        <span className="error" id={`${inputId}-err`}>
          {fieldErrors.map((e) => ERRORS[e]).join(' ')}
        </span>
      </div>
    );
  };

  const option = (value: 'household' | 'business', copy: { label: string; help: string }) => (
    <label className={`option${input.customer === value ? ' is-on' : ''}`}>
      <input
        type="radio"
        name="customer"
        value={value}
        checked={input.customer === value}
        onChange={() => set('customer')(value)}
      />
      <span className="option-text">
        <span className="option-label">{copy.label}</span>
        <span className="option-help">{copy.help}</span>
      </span>
    </label>
  );

  const dash = '–';
  const r = result;
  const hasFigures = !!r && (!!r.solar || !!r.battery);

  return (
    <section className="calc">
      <form className="card form" onSubmit={onSubmit} onReset={onReset} noValidate>
        {errors.length > 0 && (
          <div className="error-summary" role="alert" tabIndex={-1} ref={summaryRef}>
            <ul>
              {errors.map((e) => (
                <li key={e}>{ERRORS[e]}</li>
              ))}
            </ul>
          </div>
        )}

        <fieldset>
          <legend>{FORM.customerLegend}</legend>
          <div className="options">
            {option('household', FORM.household)}
            {option('business', FORM.business)}
          </div>
          <p className="help">{FORM.customerHelp}</p>
        </fieldset>

        <div className="grid-2">
          {field('postcode', FORM.postcode, { type: 'text', inputMode: 'numeric', maxLength: 4, autoComplete: 'postal-code' })}
          {field('installDate', FORM.installDate, {
            type: 'date',
            min: `${RATES.solar.firstInstallYear}-01-01`,
            max: RATES.battery.lastInstallDate,
          })}
        </div>

        <div className="grid-2">
          {field('solarKw', FORM.solar, { type: 'text', inputMode: 'decimal' }, errorsFor('sizes'))}
          {field('batteryKwh', FORM.battery, { type: 'text', inputMode: 'decimal' })}
        </div>

        <div className="actions">
          <button type="submit" className="btn btn-primary btn-lg">
            {FORM.submit} <Arrow size={18} />
          </button>
          <button type="reset" className="btn-text">{FORM.reset}</button>
        </div>
      </form>

      <div className="results" ref={resultRef} aria-live="polite">
        {(!r || hasFigures) && (
          <section className="card estimate" aria-label={RESULT.heading}>
            <h2 className="eyebrow">{RESULT.heading}</h2>
            <p className="est-lead">{RESULT.totalBefore}</p>
            <p className="est-total">{r ? money(r.total) : `$${dash}`}</p>
            <p className="est-lead est-after">{RESULT.totalAfter}</p>

            <div className="stats">
              {(!r || r.solar) && (
                <div className="stat">
                  <span className="stat-label">{RESULT.solarCerts}</span>
                  <span className="stat-num">{r?.solar ? r.solar.certificates : dash}</span>
                  <span className="stat-sub">
                    {RESULT.solarValue}: <strong>{r?.solar ? money(r.solar.value) : dash}</strong>
                  </span>
                </div>
              )}
              {(!r || r.battery) && (
                <div className="stat">
                  <span className="stat-label">{RESULT.batteryCerts}</span>
                  <span className="stat-num">{r?.battery ? r.battery.certificates : dash}</span>
                  <span className="stat-sub">
                    {RESULT.batteryValue}: <strong>{r?.battery ? money(r.battery.value) : dash}</strong>
                  </span>
                </div>
              )}
            </div>

            {r && r.gst > 0 && (
              <div className="est-row">
                <span>{RESULT.gst}</span>
                <span>{money(r.gst)}</span>
              </div>
            )}
            <div className="est-row est-row-total">
              <span>{RESULT.total}</span>
              <span>{r ? money(r.total) : dash}</span>
            </div>
            <p className="est-caption">{RESULT.caption}</p>
          </section>
        )}

        {r && r.notices.length > 0 && (
          <section className="card notices">
            {r.notices.map((n) => (
              <div className="notice" key={n}>
                <span className="chip chip-sm chip-navy"><Info size={20} color="#2dbbc9" /></span>
                <div>
                  <h3>{NOTICES[n].heading}</h3>
                  <p className="muted">{NOTICES[n].copy}</p>
                </div>
              </div>
            ))}
          </section>
        )}

        {r && hasFigures && (
          <section className="card working">
            <h2 className="h3"><span className="accent-text">How</span> {WORKING.heading.replace(/^How /, '')}</h2>
            {r.solar && r.systemKw !== null && (
              <div className="working-row">
                <span className="chip chip-sm"><Sun color="#1d2246" /></span>
                <p className="muted">
                  {WORKING.solar({
                    systemKw: num(r.systemKw),
                    postcode: String(r.postcode).padStart(4, '0'),
                    zone: r.solar.zone,
                    zoneRating: String(r.solar.zoneRating),
                    years: r.solar.years,
                    midScale: r.solar.midScale,
                  })}
                </p>
              </div>
            )}
            {r.battery && r.nominalKwh !== null && (
              <div className="working-row">
                <span className="chip chip-sm"><Battery color="#1d2246" /></span>
                <p className="muted">
                  {WORKING.battery({
                    nominalKwh: num(r.nominalKwh),
                    usableKwh: num(r.battery.usableKwh, RATES.display.usableDecimals),
                    factor: num(r.battery.factor),
                  })}
                </p>
              </div>
            )}
          </section>
        )}

        {r && (
          <section className="card tier">
            <span className="chip chip-navy"><Pin color="#2dbbc9" /></span>
            <div className="tier-body">
              <h2 className="h3">{TIERS[r.tier].heading}</h2>
              <p className="muted">{TIERS[r.tier].copy}</p>
              <a className={`btn ${TIERS[r.tier].primary ? 'btn-primary' : 'btn-outline'}`} href={TIERS[r.tier].href}>
                {TIERS[r.tier].button} <Arrow />
              </a>
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
