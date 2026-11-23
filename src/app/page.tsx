import Calculator from '@/components/Calculator';
import { Arrow, Menu, Plus, Sun } from '@/components/Icons';
import { CTA, FAQ_HEADING, FAQS, FOOTER_NOTE, PAGE, SITE } from '@/content/copy';

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <header className="site-header">
        <div className="wrap header-inner">
          <a className="brand" href={SITE.main}>
            <span className="brand-mark" aria-hidden="true"><Sun size={18} color="#1d2246" /></span>
            <span className="brand-name">Solar Set</span>
          </a>
          <nav className="nav" aria-label="Main">
            {SITE.nav.map((n) => (
              <a key={n.href} href={n.href}>{n.label}</a>
            ))}
            <a className="btn btn-outline btn-sm" href={SITE.contact.href}>{SITE.contact.label}</a>
          </nav>
          <details className="mobile-nav">
            <summary aria-label="Open menu"><Menu /></summary>
            <div className="mobile-nav-panel">
              {SITE.nav.map((n) => (
                <a key={n.href} href={n.href}>{n.label}</a>
              ))}
              <a href={SITE.contact.href}>{SITE.contact.label}</a>
            </div>
          </details>
        </div>
      </header>

      <main className="wrap stack">
        <section className="hero-row">
          <div className="hero">
            <svg className="sparkle" aria-hidden="true" width="100%" height="100%">
              <defs>
                <pattern id="spark" width="56" height="56" patternUnits="userSpaceOnUse">
                  <path d="M28 22v12M22 28h12" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#spark)" />
            </svg>
            <h1><span className="cyan">{PAGE.h1Lead}</span> {PAGE.h1Rest}</h1>
            <p className="hero-intro">{PAGE.intro}</p>
            <p className="hero-support">{PAGE.supporting}</p>
          </div>
          {SITE.heroPhoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="hero-photo" src={SITE.heroPhoto.src} alt={SITE.heroPhoto.alt} />
          )}
        </section>

        <Calculator />

        <section className="cta">
          <div className="cta-body">
            <h2><span className="cyan">{CTA.headingLead}</span> {CTA.headingRest}</h2>
            <p>{CTA.copy}</p>
            <div className="cta-links">
              {CTA.links.map((l) => (
                <a key={l.href} href={l.href}>{l.label} <Arrow color="#50acff" /></a>
              ))}
            </div>
          </div>
          <a className="btn btn-primary btn-xl" href={SITE.requestQuote}>{CTA.button} <Arrow size={18} /></a>
        </section>

        <section className="card faq">
          <h2 className="section-h2"><span className="accent-text">{FAQ_HEADING.lead}</span> {FAQ_HEADING.rest}</h2>
          <div className="faq-list">
            {FAQS.map((f, i) => (
              <details key={f.q} open={i === 0}>
                <summary>
                  <h3>{f.q}</h3>
                  <span className="faq-icon" aria-hidden="true"><Plus /></span>
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="wrap footer-inner">
          <div className="footer-brand">
            <span className="brand-name">Solar Set</span>
            <a href={SITE.phoneHref}>{SITE.phone}</a>
            <span className="footer-small">{SITE.licences}</span>
          </div>
          <p className="footer-small footer-note">{FOOTER_NOTE}</p>
        </div>
      </footer>
    </>
  );
}
