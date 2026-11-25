#!/usr/bin/env node
// Zero-dependency static site generator for ORYQEN STUDIOS.
// Reads copy from src/content.js and writes plain HTML into ./site
// Usage: node build.js   (then deploy the ./site folder as-is)

const fs = require('fs');
const path = require('path');
const c = require('./src/content.js');
const { site } = c;

const OUT = path.join(__dirname, 'site');
const written = [];

/* ---------- helpers ---------- */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const t = (s) => esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>'); // *accent* -> <em>
const plain = (s) => String(s).replace(/\*/g, '');
const pad = (n) => String(n).padStart(2, '0');
const arrow = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const arrowUR = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const waIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.300-1.200l-.3-.2-3 .8.8-2.900-.2-.3A8.200 8.200 0 1 1 12 20.200Zm4.500-6.100c-.2-.1-1.500-.7-1.700-.8-.2-.1-.4-.1-.6.100l-.8 1c-.1.200-.3.200-.5.100a6.700 6.700 0 0 1-3.300-2.900c-.3-.4.300-.4.700-1.300.1-.200 0-.300 0-.500l-.8-1.800c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.100-.7.300-.2.300-.9.900-.9 2.200s.9 2.500 1.100 2.700c.1.200 1.900 2.900 4.600 4 1.700.700 2.300.800 3.200.600.500-.100 1.500-.600 1.700-1.200.2-.600.200-1.100.2-1.200-.1-.100-.3-.200-.5-.300Z"/></svg>';

const btn = (label, href, kind = 'solid', icon = arrow, attrs = '') =>
  `<a class="btn btn--${kind}" href="${href}" ${attrs}><span class="btn__label">${esc(label)}</span>${icon}</a>`;
const linkArrow = (label, href, ext = false) =>
  `<a class="link-arrow" href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}><span>${esc(label)}</span>${ext ? arrowUR : arrow}</a>`;

const sectionHead = (eyebrow, title, text = '', extra = '') => `
  <header class="shead">
    <p class="eyebrow" data-reveal>${esc(eyebrow)}</p>
    <h2 class="h2" data-split>${t(title)}</h2>
    ${text ? `<p class="shead__text" data-reveal>${esc(text)}</p>` : ''}
    ${extra}
  </header>`;

const faqList = (items) => `
  <div class="faq" data-stagger>
    ${items.map((f) => `
    <details class="faq__item">
      <summary><span>${esc(f.q)}</span><i aria-hidden="true"></i></summary>
      <div class="faq__body"><p>${esc(f.a)}</p></div>
    </details>`).join('')}
  </div>`;

const faqLd = (items) => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});

const projectBy = (slug) => c.projects.find((p) => p.slug === slug);

const pcard = (p, variant = 'grid') => `
  <article class="pcard pcard--${variant}" data-cats="${p.cats.join(' ')}">
    <a class="pcard__link" href="/projects/${p.slug}/" aria-label="${esc(p.name)} — view project">
      <div class="pcard__media" data-tilt>
        <img src="/assets/img/${p.img}" alt="${esc(p.alt)}" loading="lazy" decoding="async" width="1600" height="1100">
        <span class="pcard__badge">${esc(p.badge)}</span>
        <span class="pcard__view" aria-hidden="true">View ${arrowUR}</span>
      </div>
      <div class="pcard__body">
        <p class="pcard__meta">${esc(p.industry)} · ${esc(p.type)}</p>
        <h3 class="pcard__title">${esc(p.name)}</h3>
        <p class="pcard__text">${esc(p.summary)}</p>
        <ul class="chips">${p.theme.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      </div>
    </a>
  </article>`;

const cta = (title = 'Ready to build a *clearer* digital presence?', text = 'Tell us about your business, goals and website requirements. We’ll help you identify the right direction for your project.') => `
  <section class="cta">
    <div class="cta__glow" aria-hidden="true"></div>
    <div class="wrap">
      <p class="eyebrow" data-reveal>Start a project</p>
      <h2 class="cta__title" data-split>${t(title)}</h2>
      <p class="cta__text" data-reveal>${esc(text)}</p>
      <div class="btns" data-reveal>
        ${btn('Discuss Your Website', '/contact/')}
        ${btn('View Our Work', '/portfolio/', 'ghost')}
      </div>
    </div>
  </section>`;

const phead = ({ eyebrow, title, lead, crumbs, actions = '', cls = '' }) => `
  <section class="phead ${cls}">
    <canvas class="gl" data-gl="field" aria-hidden="true"></canvas>
    <div class="phead__shade" aria-hidden="true"></div>
    <div class="wrap">
      ${crumbs ? `<nav class="crumbs" aria-label="Breadcrumb" data-reveal>${crumbs.map(([l, h]) => (h ? `<a href="${h}">${esc(l)}</a>` : `<span aria-current="page">${esc(l)}</span>`)).join('<i>/</i>')}</nav>` : ''}
      ${eyebrow ? `<p class="eyebrow" data-reveal>${esc(eyebrow)}</p>` : ''}
      <h1 class="h1" data-split>${t(title)}</h1>
      ${lead ? `<p class="phead__lead" data-reveal>${esc(lead)}</p>` : ''}
      ${actions ? `<div class="btns" data-reveal>${actions}</div>` : ''}
    </div>
  </section>`;

/* ---------- layout ---------- */
const navItems = [
  ['Work', '/portfolio/'], ['Process', '/our-process/'], ['About', '/about/'], ['Pricing', '/pricing/'], ['Contact', '/contact/'],
];

const header = (active) => `
<header class="nav" data-nav>
  <div class="nav__inner">
    <a class="brand" href="/" aria-label="ORYQEN STUDIOS — home">
      <span class="brand__name">ORYQEN STUDIOS<b>.</b></span>
      <span class="brand__sub">${esc(site.tagline)}</span>
    </a>
    <nav class="nav__links" aria-label="Primary">
      <div class="nav__drop">
        <button class="nav__link${c.services.some((s) => '/' + s.slug + '/' === active) ? ' is-active' : ''}" aria-expanded="false" aria-controls="svc-menu">Services <svg viewBox="0 0 12 12" aria-hidden="true"><path d="m2.500 4.500 3.500 3.500 3.500-3.500" fill="none" stroke="currentColor" stroke-width="1.400"/></svg></button>
        <div class="nav__panel" id="svc-menu">
          ${c.services.map((s, i) => `<a href="/${s.slug}/"><small>${pad(i + 1)}</small>${esc(s.short)}</a>`).join('')}
        </div>
      </div>
      ${navItems.map(([l, h]) => `<a class="nav__link${h === active ? ' is-active' : ''}" href="${h}">${l}</a>`).join('')}
    </nav>
    <a class="btn btn--solid btn--sm nav__cta" href="/contact/"><span class="btn__label">Start a Project</span>${arrow}</a>
    <button class="nav__toggle" aria-label="Open menu" aria-expanded="false" aria-controls="menu"><span></span><span></span></button>
  </div>
</header>
<div class="menu" id="menu" aria-hidden="true">
  <div class="menu__inner">
    <nav class="menu__links" aria-label="Mobile">
      <a href="/"><small>01</small>Home</a>
      <a href="/portfolio/"><small>02</small>Work</a>
      <a href="/our-process/"><small>03</small>Process</a>
      <a href="/about/"><small>04</small>About</a>
      <a href="/pricing/"><small>05</small>Pricing</a>
      <a href="/contact/"><small>06</small>Contact</a>
    </nav>
    <div class="menu__side">
      <p class="eyebrow">Services</p>
      ${c.services.map((s) => `<a href="/${s.slug}/">${esc(s.short)}</a>`).join('')}
      <p class="eyebrow">Get in touch</p>
      <a href="mailto:${site.email}">${site.email}</a>
      <a href="${site.whatsapp}" target="_blank" rel="noopener">WhatsApp ${site.phoneDisplay}</a>
    </div>
  </div>
</div>`;

const footer = () => `
<footer class="footer">
  <div class="wrap">
    <div class="footer__top">
      <div class="footer__brand">
        <a class="brand" href="/"><span class="brand__name">ORYQEN STUDIOS<b>.</b></span><span class="brand__sub">${esc(site.tagline)}</span></a>
        <p>${esc(site.footerLine)}</p>
        <a class="footer__mail" href="mailto:${site.email}">${site.email}</a>
      </div>
      <nav class="footer__cols" aria-label="Footer">
        <div><h3>Company</h3><a href="/about/">About Us</a><a href="/our-process/">Our Process</a><a href="/contact/">Contact Us</a></div>
        <div><h3>Services</h3>${c.services.map((s) => `<a href="/${s.slug}/">${esc(s.nav)}</a>`).join('')}</div>
        <div><h3>Resources</h3><a href="/portfolio/">Portfolio</a><a href="/insights/">Insights</a><a href="/faq/">FAQs</a><a href="/pricing/">Pricing</a></div>
        <div><h3>Legal</h3><a href="/privacy-policy/">Privacy Policy</a><a href="/terms-of-service/">Terms of Service</a></div>
      </nav>
    </div>
    <div class="footer__mark" aria-hidden="true"><span data-footer-mark>ORYQEN</span></div>
    <div class="footer__bottom">
      <p>© ${new Date().getFullYear()} ORYQEN STUDIOS. ${esc(site.tagline)}. All rights reserved.</p>
      <p>Singapore · <span data-clock>SGT</span></p>
      <a href="#top" class="footer__up">Back to top ↑</a>
    </div>
  </div>
</footer>
<a class="wa" href="${site.whatsapp}" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp">${waIcon}</a>
<div class="curtain" aria-hidden="true"><div class="curtain__panel"></div><div class="curtain__mark"><span>ORYQEN STUDIOS<b>.</b></span><i data-count></i></div></div>`;

function page({ url, title, desc = site.description, body, cls = '', ld = [], noindex = false, file }) {
  const canonical = site.url + url;
  const lds = [].concat(ld).map((x) => `<script type="application/ld+json">${JSON.stringify(x)}</script>`).join('\n');
  const html = `<!DOCTYPE html>
<html lang="en-SG">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="author" content="ORYQEN STUDIOS">
<meta name="theme-color" content="#07080a">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${canonical}">`}
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ORYQEN STUDIOS">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${site.url}/assets/img/studio.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" type="image/x-icon">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Manrope:wght@300;400;500;600;700&display=swap">
<link rel="stylesheet" href="/assets/css/main.css">
<script>document.documentElement.classList.add('js');window.__oqFailsafe=setTimeout(function(){document.documentElement.classList.remove('js')},6000);</script>
${lds}
</head>
<body class="${cls}" id="top">
<a class="skip" href="#main">Skip to content</a>
${header(url)}
<main id="main">
${body}
</main>
${footer()}
<script src="/assets/vendor/gsap.min.js" defer></script>
<script src="/assets/vendor/ScrollTrigger.min.js" defer></script>
<script src="/assets/vendor/lenis.min.js" defer></script>
<script src="/assets/js/gl.js" defer></script>
<script src="/assets/js/main.js" defer></script>
</body>
</html>
`;
  const rel = file || path.join(url, 'index.html');
  const dest = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html);
  if (!noindex) written.push(url);
}

/* ---------- shared blocks ---------- */
const stepsCompact = () => `
  <ol class="steps-grid" data-stagger>
    ${c.processSteps.map((s, i) => `<li><span class="num">Stage ${i + 1}</span><h3>${esc(s.name)}</h3><p>${esc(s.what)}</p></li>`).join('')}
  </ol>`;

const marquee = (items) => {
  const run = items.map((x) => `<span>${esc(x)}</span><i aria-hidden="true">✦</i>`).join('');
  return `<div class="marquee" aria-hidden="true"><div class="marquee__track" data-marquee>${run}${run}</div></div>`;
};

/* ---------- HOME ---------- */
function buildHome() {
  const body = `
  <section class="hero">
    <canvas class="gl" data-gl="orb" aria-hidden="true"></canvas>
    <div class="hero__shade" aria-hidden="true"></div>
    <div class="wrap hero__inner">
      <p class="eyebrow" data-reveal>Singapore · Website design &amp; digital experiences</p>
      <h1 class="hero__title" data-split>Purposeful websites for businesses ready to <em>move forward.</em></h1>
      <div class="hero__foot">
        <p class="hero__lead" data-reveal>ORYQEN STUDIOS designs and develops clear, professional websites that strengthen credibility, organise information and guide customers towards taking action.</p>
        <div class="btns" data-reveal>
          ${btn('Start a Project', '/contact/')}
          ${btn('View Our Work', '/portfolio/', 'ghost')}
        </div>
      </div>
    </div>
    <div class="hero__meta wrap" data-reveal>
      <span>${esc(site.tagline)}</span>
      <span class="hero__hint">Move your cursor · Scroll to explore</span>
      <span class="hero__scroll" aria-hidden="true"><i></i></span>
    </div>
  </section>

  ${marquee(['Website Design', 'Website Redesign', 'Restaurant & F&B', 'Interior Design', 'Professional Services', 'Retail & Lifestyle'])}

  <section class="section statement">
    <div class="wrap statement__grid">
      <div>
        <p class="eyebrow" data-reveal>About ORYQEN STUDIOS</p>
        <p class="statement__text" data-scrub>Design with clarity. Build with purpose. The website design and digital-experience division of Oryqen Labs — we combine thoughtful planning, professional design, responsive development and careful testing to support real business objectives.</p>
        <div data-reveal>${linkArrow('More about us', '/about/')}</div>
      </div>
      <figure class="statement__media" data-clip>
        <img src="/assets/img/studio.jpg" alt="An independent studio interface study shown on desktop and mobile" loading="lazy" decoding="async" width="1920" height="1024" data-parallax="12">
      </figure>
    </div>
  </section>

  <section class="section" id="services">
    <div class="wrap">
      ${sectionHead('Services', 'What we *do*', 'Website design and development, with specialised offerings for industries where presentation matters most.')}
      <div class="svc-list" data-stagger>
        ${c.services.map((s, i) => `
        <a class="svc" href="/${s.slug}/">
          <span class="num">${pad(i + 1)}</span>
          <h3 class="svc__title">${esc(s.short)}</h3>
          <p class="svc__text">${esc(s.card)}</p>
          <span class="svc__go">Learn more ${arrow}</span>
        </a>`).join('')}
      </div>
    </div>
  </section>

  <section class="hwork" id="work" data-hscroll>
    <div class="hwork__pin">
      <div class="wrap hwork__head">
        <div>
          <p class="eyebrow" data-reveal>Featured work</p>
          <h2 class="h2" data-split>Selected <em>projects</em></h2>
        </div>
        <div class="hwork__side" data-reveal>
          <p>A selection of internal work and independent website concepts across different industries.</p>
          ${linkArrow('View all projects', '/portfolio/')}
        </div>
      </div>
      <div class="hwork__viewport">
        <div class="hwork__track" data-hscroll-track>
          ${c.projects.map((p) => pcard(p, 'slide')).join('')}
          <a class="hwork__end" href="/portfolio/"><span>View all<br><em>projects</em></span>${arrow}</a>
        </div>
      </div>
      <div class="hwork__bar" aria-hidden="true"><i data-hscroll-bar></i></div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      ${sectionHead('Why it matters', 'Why businesses need a *professional* website')}
      <div class="tiles tiles--4" data-stagger>
        ${c.home.whyMatters.map(([h, p], i) => `<article class="tile"><span class="num">${pad(i + 1)}</span><h3>${esc(h)}</h3><p>${esc(p)}</p></article>`).join('')}
      </div>
    </div>
  </section>

  <section class="section section--tight">
    <div class="wrap">
      ${sectionHead('Industries', 'Industries we *serve*')}
      <ul class="rows" data-stagger>
        ${c.home.industries.map(([h, p], i) => `<li class="row"><span class="num">${pad(i + 1)}</span><h3>${esc(h)}</h3><p>${esc(p)}</p></li>`).join('')}
      </ul>
    </div>
  </section>

  <section class="section process" id="process">
    <div class="wrap process__grid">
      <div class="process__sticky">
        <p class="eyebrow" data-reveal>Process</p>
        <h2 class="h2" data-split>Our website development <em>process</em></h2>
        <div class="process__count" aria-hidden="true"><b data-step-num>01</b><span>/ ${pad(c.processSteps.length)}</span></div>
        <div data-reveal>${linkArrow('Read the full process', '/our-process/')}</div>
      </div>
      <ol class="process__steps" data-steps>
        <span class="process__line" aria-hidden="true"><i data-steps-line></i></span>
        ${c.processSteps.map((s, i) => `<li class="pstep" data-step="${pad(i + 1)}"><span class="num">${pad(i + 1)}</span><h3>${esc(s.name)}</h3><p>${esc(s.what)}</p></li>`).join('')}
      </ol>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      ${sectionHead('Why ORYQEN STUDIOS', 'Why choose *ORYQEN STUDIOS*')}
      <div class="tiles tiles--3" data-stagger>
        ${c.home.whyChoose.map(([h, p], i) => `<article class="tile"><span class="num">${pad(i + 1)}</span><h3>${esc(h)}</h3><p>${esc(p)}</p></article>`).join('')}
      </div>
    </div>
  </section>

  <section class="section section--tight">
    <div class="wrap split">
      ${sectionHead('FAQ', 'Frequently asked *questions*', '', `<div data-reveal>${linkArrow('All FAQs', '/faq/')}</div>`)}
      ${faqList(c.home.faqs)}
    </div>
  </section>

  ${cta()}`;

  page({
    url: '/', title: 'ORYQEN STUDIOS | Purposeful Website Design in Singapore', body, cls: 'home',
    ld: [
      { '@context': 'https://schema.org', '@graph': [
        { '@type': 'Organization', name: 'ORYQEN STUDIOS', description: 'Singapore website design and digital-experience division of Oryqen Labs.', areaServed: 'Singapore', parentOrganization: { '@type': 'Organization', name: 'Oryqen Labs' }, url: site.url, email: site.email },
        { '@type': 'WebSite', name: 'ORYQEN STUDIOS', url: site.url },
      ] },
      faqLd(c.home.faqs),
    ],
  });
}

/* ---------- PORTFOLIO ---------- */
function buildPortfolio() {
  const body = `
  ${phead({ eyebrow: 'Our work', title: 'Thoughtful design, *in practice.*', lead: 'A selection of internal work and independent website concepts across different industries.' })}
  <section class="section section--flush">
    <div class="wrap">
      <div class="filters" role="group" aria-label="Filter projects" data-filters>
        ${c.filters.map((f, i) => `<button class="filter${i === 0 ? ' is-active' : ''}" data-filter="${f.key}" aria-pressed="${i === 0}">${esc(f.label)}<sup>${f.key === 'all' ? c.projects.length : c.projects.filter((p) => p.cats.includes(f.key)).length}</sup></button>`).join('')}
      </div>
      <div class="pgrid" data-grid data-stagger>
        ${c.projects.map((p) => pcard(p, 'grid')).join('')}
      </div>
      <p class="note" data-reveal>Client case studies will be added here as projects are completed and approved for publication.</p>
    </div>
  </section>
  ${cta()}`;
  page({ url: '/portfolio/', title: 'Portfolio | ORYQEN STUDIOS', desc: 'A selection of internal work and independent website concepts across different industries by ORYQEN STUDIOS, Singapore.', body });
}

/* ---------- PROJECT ---------- */
function buildProjects() {
  c.projects.forEach((p, i) => {
    const next = c.projects[(i + 1) % c.projects.length];
    const others = c.projects.filter((x) => x.slug !== p.slug).slice(0, 2);
    const group = p.cats.includes('internal') ? ['Internal Projects', '/portfolio/?filter=internal'] : ['Concept Designs', '/portfolio/?filter=concept'];
    const name = p.fullName || p.name;
    const body = `
    ${phead({
      crumbs: [['All Projects', '/portfolio/'], group, [p.name]],
      eyebrow: `${p.industry} · ${p.type}`,
      title: name, lead: p.intro, cls: 'phead--project',
      actions: btn(p.liveLabel, p.live, 'solid', arrowUR, 'target="_blank" rel="noopener"') + `<span class="badge">${esc(p.badge)}</span>`,
    })}
    <section class="cover">
      <div class="wrap">
        <figure class="cover__frame" data-clip>
          <img src="/assets/img/${p.img}" alt="${esc(p.alt)}" width="1600" height="1100" data-parallax="10">
        </figure>
      </div>
    </section>
    <section class="section section--flush">
      <div class="wrap case">
        <aside class="case__aside">
          <dl class="meta" data-stagger>
            <div><dt>Classification</dt><dd>${esc(p.cats.includes('internal') ? 'Internal Project' : 'Independent Concept')}</dd></div>
            <div><dt>Industry</dt><dd>${esc(p.industry)}</dd></div>
            <div><dt>Website type</dt><dd>${esc(p.type)}</dd></div>
            <div><dt>Design direction</dt><dd><ul>${p.direction.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></dd></div>
            <div><dt>${esc(p.featuresLabel)}</dt><dd><ul>${p.features.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></dd></div>
          </dl>
        </aside>
        <div class="case__main">
          <article class="case__block"><span class="num">01</span><h2 data-split>Business objective</h2><p data-reveal>${esc(p.objective)}</p></article>
          <article class="case__block"><span class="num">02</span><h2 data-split>Design challenges</h2><ul class="ticks" data-stagger>${p.challenges.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></article>
          <article class="case__block"><span class="num">03</span><h2 data-split>Proposed solution</h2><p data-reveal>${esc(p.solution)}</p></article>
          <article class="case__block"><span class="num">04</span><h2 data-split>${esc(p.whyTitle)}</h2><p data-reveal>${esc(p.why)}</p></article>
          <article class="case__block"><span class="num">05</span><h2 data-split>Development approach</h2><p data-reveal>${esc(p.approach)}</p></article>
          <aside class="callout" data-reveal><h3>${esc(p.statusTitle)}</h3><p>${esc(p.status)}</p></aside>
          <div class="btns" data-reveal>
            ${btn(p.liveLabel, p.live, 'solid', arrowUR, 'target="_blank" rel="noopener"')}
            ${btn('Enquire About a Similar Project', '/contact/', 'ghost')}
          </div>
          <div data-reveal>${linkArrow('Back to ' + group[0], group[1])}</div>
        </div>
      </div>
    </section>
    <section class="section section--tight">
      <div class="wrap">
        ${sectionHead('Keep exploring', 'More *projects*')}
        <div class="pgrid" data-stagger>${others.map((o) => pcard(o, 'grid')).join('')}</div>
      </div>
    </section>
    <a class="nextp" href="/projects/${next.slug}/">
      <img src="/assets/img/${next.img}" alt="" loading="lazy" decoding="async" aria-hidden="true">
      <div class="wrap"><p class="eyebrow">Next project</p><p class="nextp__title">${esc(next.name)} ${arrow}</p></div>
    </a>`;
    page({ url: `/projects/${p.slug}/`, title: `${p.name} — ${p.type} | ORYQEN STUDIOS`, desc: p.summary, body });
  });
}

/* ---------- SERVICES ---------- */
function buildServices() {
  c.services.forEach((s) => {
    const body = `
    ${phead({ eyebrow: s.eyebrow, title: s.title, lead: s.lead, actions: btn('Request a Consultation', '/contact/') + btn('See Our Work', '/portfolio/', 'ghost') })}
    <section class="section section--flush">
      <div class="wrap split">
        ${sectionHead(s.listEyebrow, s.listTitle)}
        <ul class="rows rows--plain" data-stagger>${s.list.map((x, i) => `<li class="row"><span class="num">${pad(i + 1)}</span><h3>${esc(x)}</h3></li>`).join('')}</ul>
      </div>
    </section>
    <section class="section">
      <div class="wrap">
        ${sectionHead('Features & deliverables', "What's *included*")}
        <div class="tiles tiles--4" data-stagger>
          ${s.features.map(([h, p], i) => `<article class="tile"><span class="num">${pad(i + 1)}</span><h3>${esc(h)}</h3><p>${esc(p)}</p></article>`).join('')}
        </div>
      </div>
    </section>
    <section class="section section--tight">
      <div class="wrap split">
        ${sectionHead('Benefits', 'What it means for *your business*')}
        <div>
          <ul class="ticks ticks--lg" data-stagger>${s.benefits.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
          ${s.note ? `<aside class="callout" data-reveal><h3>${esc(s.note.title)}</h3><p>${esc(s.note.text)}</p></aside>` : ''}
        </div>
      </div>
    </section>
    <section class="section">
      <div class="wrap">
        ${sectionHead('Workflow', 'How the project *runs*', 'A structured six-stage process keeps scope, feedback and timelines clear.')}
        ${stepsCompact()}
        <div class="after" data-reveal>${linkArrow('Read about our full process', '/our-process/')}</div>
      </div>
    </section>
    <section class="section section--tight">
      <div class="wrap">
        ${sectionHead('Relevant work', 'Example *projects*')}
        <div class="pgrid" data-stagger>${s.examples.map((slug) => pcard(projectBy(slug), 'grid')).join('')}</div>
      </div>
    </section>
    <section class="section section--tight">
      <div class="wrap split">
        ${sectionHead('FAQ', 'Common *questions*')}
        ${faqList(s.faqs)}
      </div>
    </section>
    ${cta(s.cta)}`;
    page({ url: `/${s.slug}/`, title: s.metaTitle, desc: s.lead, body, ld: faqLd(s.faqs) });
  });
}

/* ---------- PROCESS ---------- */
function buildProcess() {
  const body = `
  ${phead({ eyebrow: 'Our process', title: 'A clear path from first call *to launch*', lead: 'Six stages, each with defined inputs and deliverables, so you always know what happens next.' })}
  <section class="section section--flush">
    <div class="wrap">
      <ol class="stages">
        ${c.processSteps.map((s, i) => `
        <li class="stage">
          <div class="stage__head"><span class="stage__num" data-reveal>${pad(i + 1)}</span><h2 data-split>${esc(s.name)}</h2></div>
          <dl class="stage__grid" data-stagger>
            <div><dt>What happens</dt><dd>${esc(s.what)}</dd></div>
            <div><dt>You provide</dt><dd>${esc(s.provide)}</dd></div>
            <div><dt>We deliver</dt><dd>${esc(s.deliver)}</dd></div>
            <div><dt>Next step</dt><dd>${esc(s.next)}</dd></div>
          </dl>
        </li>`).join('')}
      </ol>
    </div>
  </section>
  ${cta('Ready for *stage one?*', 'Book a discovery consultation and tell us about your business.')}`;
  page({ url: '/our-process/', title: 'Our Website Development Process | ORYQEN STUDIOS', desc: 'Six stages, each with defined inputs and deliverables, so you always know what happens next.', body });
}

/* ---------- ABOUT ---------- */
function buildAbout() {
  const body = `
  ${phead({ eyebrow: 'About us', title: 'Clear thinking. *Considered design.*', lead: 'ORYQEN STUDIOS is the creative website and digital-experience division of Oryqen Labs.' })}
  <section class="section section--flush statement">
    <div class="wrap">
      <p class="eyebrow" data-reveal>Our mission</p>
      <p class="statement__text statement__text--wide" data-scrub>${esc(c.about.mission.join(' '))}</p>
    </div>
  </section>
  <section class="section section--tight">
    <div class="wrap">
      <figure class="wide-media" data-clip><img src="/assets/img/studio.jpg" alt="An independent studio interface study shown on desktop and mobile" loading="lazy" decoding="async" width="1920" height="1024" data-parallax="12"></figure>
      <div class="tiles tiles--3" data-stagger>
        ${c.about.blocks.map(([h, p], i) => `<article class="tile"><span class="num">${pad(i + 1)}</span><h3>${esc(h)}</h3><p>${esc(p)}</p></article>`).join('')}
      </div>
    </div>
  </section>
  <section class="section section--tight">
    <div class="wrap split">
      ${sectionHead('Focus', 'Industries we *focus on*')}
      <ul class="rows rows--plain" data-stagger>${c.home.industries.map(([h, p], i) => `<li class="row"><span class="num">${pad(i + 1)}</span><h3>${esc(h)}</h3><p>${esc(p)}</p></li>`).join('')}</ul>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      ${sectionHead('Values', 'What guides *our work*')}
      <ul class="values" data-stagger>
        ${c.about.values.map(([h, p], i) => `<li><span class="num">${pad(i + 1)}</span><h3>${esc(h)}</h3><p>${esc(p)}</p></li>`).join('')}
      </ul>
    </div>
  </section>
  ${cta()}`;
  page({ url: '/about/', title: 'About | ORYQEN STUDIOS', desc: 'ORYQEN STUDIOS is the creative website and digital-experience division of Oryqen Labs.', body });
}

/* ---------- CONTACT ---------- */
function buildContact() {
  const f = c.contactForm;
  const opts = (arr, ph) => `<option value="">${ph}</option>` + arr.map((x) => `<option>${esc(x)}</option>`).join('');
  const body = `
  ${phead({ eyebrow: 'Contact', title: 'Tell us about *your project*', lead: 'Share a few details and we’ll reply with next steps. Fields marked optional can be left blank.', cls: 'phead--short' })}
  <section class="section section--flush">
    <div class="wrap contact">
      <aside class="contact__side" data-stagger>
        <div class="tile"><h3>What happens next</h3><p>We review your enquiry and get back to you to arrange a discovery consultation.</p></div>
        <div class="tile"><h3>Before you start</h3><p>It helps to have examples of websites you like and a rough idea of the pages you need.</p></div>
        <div class="tile"><h3>WhatsApp</h3><p>Message us directly instead of using the form.</p><p><a class="link-arrow" href="${site.whatsapp}" target="_blank" rel="noopener"><span>${site.phoneDisplay}</span>${arrowUR}</a></p></div>
        <div class="tile"><h3>Email</h3><p><a class="link-arrow" href="mailto:${site.email}"><span>${site.email}</span>${arrowUR}</a></p></div>
      </aside>
      <form class="form" data-form novalidate>
        <div class="form__grid">
          <label class="field"><span>Name</span><input name="name" autocomplete="name" required></label>
          <label class="field"><span>Company name</span><input name="company" autocomplete="organization" required></label>
          <label class="field"><span>Email</span><input name="email" type="email" autocomplete="email" required></label>
          <label class="field"><span>Phone <em>optional</em></span><input name="phone" type="tel" autocomplete="tel"></label>
          <label class="field"><span>Industry</span><select name="industry" required>${opts(f.industries, 'Select…')}</select></label>
          <label class="field"><span>Type of project</span><select name="project_type" required>${opts(f.types, 'Select…')}</select></label>
          <label class="field"><span>Estimated budget <em>optional</em></span><select name="budget">${opts(f.budgets, '—')}</select></label>
          <label class="field"><span>Preferred timeline <em>optional</em></span><select name="timeline">${opts(f.timelines, '—')}</select></label>
          <label class="field"><span>Existing website <em>optional</em></span><input name="website" inputmode="url" placeholder="https://"></label>
          <label class="field"><span>How did you discover ORYQEN STUDIOS? <em>optional</em></span><input name="source"></label>
          <label class="field field--full"><span>Project requirements</span><textarea name="requirements" rows="5" required></textarea></label>
        </div>
        <label class="check"><input type="checkbox" name="consent" required><span>I consent to ORYQEN STUDIOS collecting and using my details to respond to this enquiry, as described in the <a href="/privacy-policy/">Privacy Policy</a>.</span></label>
        <p class="form__error" role="alert" hidden></p>
        <div class="btns">
          <button class="btn btn--solid" type="submit"><span class="btn__label">Send Enquiry</span>${arrow}</button>
          <button class="btn btn--ghost" type="button" data-form-wa><span class="btn__label">Send via WhatsApp</span>${arrowUR}</button>
        </div>
        <div class="form__done" hidden tabindex="-1"><h3>Thank you.</h3><p data-form-done></p></div>
      </form>
    </div>
  </section>`;
  page({ url: '/contact/', title: 'Contact | ORYQEN STUDIOS', desc: 'Tell us about your project. Share a few details and we’ll reply with next steps.', body });
}

/* ---------- FAQ ---------- */
function buildFaq() {
  const all = c.faqGroups.flatMap((g) => g.items);
  const body = `
  ${phead({ eyebrow: 'FAQ', title: 'Frequently asked *questions*', lead: 'Direct answers about working with ORYQEN STUDIOS and building a business website in Singapore.', cls: 'phead--short' })}
  <section class="section section--flush">
    <div class="wrap faq-groups">
      ${c.faqGroups.map((g, i) => `<div class="split"><header class="shead"><p class="eyebrow" data-reveal>${pad(i + 1)}</p><h2 class="h3" data-split>${esc(g.title)}</h2></header>${faqList(g.items)}</div>`).join('')}
    </div>
  </section>
  ${cta('Still have *a question?*', 'Send us a message and we’ll get back to you.')}`;
  page({ url: '/faq/', title: 'FAQ | ORYQEN STUDIOS', desc: 'Direct answers about working with ORYQEN STUDIOS and building a business website in Singapore.', body, ld: faqLd(all) });
}

/* ---------- PRICING ---------- */
function buildPricing() {
  const p = c.pricing;
  const mark = (v) => (v ? '<span class="yes" aria-label="Included">●</span>' : '<span class="no" aria-label="Not included">—</span>');
  const body = `
  ${phead({ eyebrow: 'Pricing & packages', title: 'Website packages for *every stage* of business', lead: 'Three starting points, each scoped to your requirements. Request a quote and we’ll recommend the right fit.', cls: 'phead--short' })}
  <section class="section section--flush">
    <div class="wrap">
      <div class="plans" data-stagger>
        ${p.packages.map((k, i) => `
        <article class="plan${k.tag ? ' plan--featured' : ''}">
          <span class="num">${pad(i + 1)}${k.tag ? ` · ${esc(k.tag)}` : ''}</span>
          <h2>${esc(k.name)}</h2>
          <p class="plan__for">${esc(k.for)}</p>
          <ul class="ticks">${k.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
          ${btn('Request a Quote', '/contact/', k.tag ? 'solid' : 'ghost')}
        </article>`).join('')}
      </div>
    </div>
  </section>
  <section class="section section--tight">
    <div class="wrap">
      ${sectionHead('Compare', 'Package *comparison*')}
      <div class="table-wrap" data-reveal>
        <table class="compare">
          <thead><tr><th scope="col">Feature</th>${p.packages.map((k) => `<th scope="col">${esc(k.name)}</th>`).join('')}</tr></thead>
          <tbody>${p.compare.map(([f, a, b, d]) => `<tr><th scope="row">${esc(f)}</th><td>${mark(a)}</td><td>${mark(b)}</td><td>${mark(d)}</td></tr>`).join('')}</tbody>
        </table>
      </div>
    </div>
  </section>
  <section class="section section--tight">
    <div class="wrap split">
      ${sectionHead('Good to know', 'Potential *additional costs*')}
      <div>
        <ul class="ticks ticks--lg" data-stagger>${p.extras.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <aside class="callout" data-reveal><h3>Website maintenance</h3><p>${esc(p.maintenance)}</p></aside>
      </div>
    </div>
  </section>
  <section class="section section--tight">
    <div class="wrap split">
      ${sectionHead('FAQ', 'Pricing *questions*')}
      ${faqList(p.faqs)}
    </div>
  </section>
  ${cta('Get a *tailored* quotation')}`;
  page({ url: '/pricing/', title: 'Pricing & Packages | ORYQEN STUDIOS', desc: 'Three website packages, each scoped to your requirements. Request a quote and we’ll recommend the right fit.', body, ld: faqLd(p.faqs) });
}

/* ---------- INSIGHTS ---------- */
function buildInsights() {
  const cats = ['All', 'Website Design', 'Business Growth', 'Search Foundations', 'Digital Presence', 'Industry Insights', 'Website Maintenance'];
  const body = `
  ${phead({ eyebrow: 'Insights', title: 'Guides for building a *better online presence*', lead: 'Straightforward answers to the questions Singapore businesses ask about websites, search and digital presence.', cls: 'phead--short' })}
  <section class="section section--flush">
    <div class="wrap">
      <div class="filters" role="group" aria-label="Filter articles" data-filters>
        ${cats.map((x, i) => `<button class="filter${i === 0 ? ' is-active' : ''}" data-filter="${i === 0 ? 'all' : esc(x)}" aria-pressed="${i === 0}">${esc(x)}</button>`).join('')}
      </div>
      <div class="posts" data-grid data-stagger>
        ${c.articles.map((a) => `
        <article class="post" data-cats="${esc(a.cat)}">
          <a href="/insights/${a.slug}/">
            <p class="pcard__meta">${esc(a.cat)} · <time datetime="${a.iso}">${a.date}</time></p>
            <h2>${esc(a.title)}</h2>
            <p>${esc(a.excerpt)}</p>
            <span class="link-arrow"><span>Read article</span>${arrow}</span>
          </a>
        </article>`).join('')}
        ${c.comingSoon.map(([title, cat]) => `
        <article class="post post--soon" data-cats="${esc(cat)}">
          <div><p class="pcard__meta">${esc(cat)} · Coming soon</p><h2>${esc(title)}</h2></div>
        </article>`).join('')}
      </div>
    </div>
  </section>
  ${cta()}`;
  page({ url: '/insights/', title: 'Insights | ORYQEN STUDIOS', desc: 'Straightforward answers to the questions Singapore businesses ask about websites, search and digital presence.', body });

  c.articles.forEach((a) => {
    const other = c.articles.find((x) => x.slug !== a.slug);
    const prose = a.body.map(([tag, v]) => (tag === 'ul' ? `<ul>${v.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : `<${tag}>${esc(v)}</${tag}>`)).join('\n');
    const abody = `
    ${phead({ crumbs: [['Insights', '/insights/'], [a.cat]], eyebrow: `${a.cat} · ${a.date}`, title: a.title, lead: a.excerpt, cls: 'phead--short phead--article' })}
    <section class="section section--flush">
      <div class="wrap article">
        <div class="prose" data-reveal>
          ${prose}
          <h2>Related pages</h2>
          <ul>${a.related.map(([l, h]) => `<li><a href="${h}">${esc(l)}</a></li>`).join('')}</ul>
        </div>
        <aside class="article__side" data-reveal>
          <p class="eyebrow">Related article</p>
          <a class="post" href="/insights/${other.slug}/"><p class="pcard__meta">${esc(other.cat)}</p><h3>${esc(other.title)}</h3><span class="link-arrow"><span>Read article</span>${arrow}</span></a>
        </aside>
      </div>
    </section>
    ${cta()}`;
    page({
      url: `/insights/${a.slug}/`, title: `${a.title} | ORYQEN STUDIOS`, desc: a.excerpt, body: abody,
      ld: { '@context': 'https://schema.org', '@type': 'Article', headline: a.title, datePublished: a.iso, author: { '@type': 'Organization', name: 'ORYQEN STUDIOS' }, publisher: { '@type': 'Organization', name: 'ORYQEN STUDIOS' } },
    });
  });
}

/* ---------- LEGAL + 404 ---------- */
function buildLegal() {
  const make = (url, title, sections) => {
    const body = `
    ${phead({ eyebrow: 'Legal', title, cls: 'phead--short' })}
    <section class="section section--flush">
      <div class="wrap article">
        <div class="prose" data-reveal>
          <p class="callout">${esc(c.legal.draftNote)}</p>
          ${sections.map(([h, p]) => `<h2>${esc(h)}</h2><p>${esc(p)}</p>`).join('\n')}
        </div>
      </div>
    </section>`;
    page({ url, title: `${title} | ORYQEN STUDIOS`, body });
  };
  make('/privacy-policy/', 'Privacy Policy', c.legal.privacy);
  make('/terms-of-service/', 'Terms of Service', c.legal.terms);

  page({
    url: '/404/', file: '404.html', noindex: true, title: 'Page not found | ORYQEN STUDIOS',
    body: phead({ eyebrow: 'Error 404', title: 'This page has *moved on.*', lead: 'The page you are looking for does not exist or has been moved.', actions: btn('Back to Home', '/') + btn('View Our Work', '/portfolio/', 'ghost'), cls: 'phead--full' }),
  });
}

/* ---------- run ---------- */
buildHome(); buildPortfolio(); buildProjects(); buildServices(); buildProcess(); buildAbout();
buildContact(); buildFaq(); buildPricing(); buildInsights(); buildLegal();

fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${written.map((u) => `  <url><loc>${site.url}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);
console.log(`Built ${written.length + 1} pages into ./site`);
