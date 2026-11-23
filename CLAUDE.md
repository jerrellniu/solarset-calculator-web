# solarset-calculator-web

Solar Set rebate calculator. Next.js (App Router, TypeScript) on Vercel at rebate-calculator.solarset.com.au.

## Rules
- Build from the Claude Design canvas, never from Notion. Read the current canvas before writing markup.
- Copy comes from the locked Notion copy doc. Australian English, no emojis.
- Every rate lives in `src/lib/rebate/rates.ts`. No numbers anywhere else.
- Logic follows the Rebate Calculator Logic Spec in Notion. Tests must pass the Greenbank cross-check cases.
- No personal data is stored. No database.
- Live and indexable since 23 November 2026 (Gate D). Quote buttons point to /contact-us/ because /request-quote/ is broken.

## Gates
A copy and logic locked, B design approved, C build approved, D cutover approved. Jerrell signs each off.
