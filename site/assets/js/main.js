/* ORYQEN STUDIOS — interactions. Requires gsap, ScrollTrigger and lenis (loaded before this file). */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     CONFIG — contact form delivery.
     Paste a form endpoint (Formspree, Web3Forms, Basin, your own API…)
     to receive enquiries by POST. Leave empty to open the visitor's
     email app with the enquiry pre-filled instead.
  ------------------------------------------------------------------ */
  var FORM_ENDPOINT = '';
  var CONTACT_EMAIL = 'oryqenstudios@gmail.com';
  var WHATSAPP_NUMBER = '6586839176';

  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var motion = hasGsap && !reduce;
  var curtain = $('.curtain');
  var lenis = null;

  clearTimeout(window.__oqFailsafe);
  if (!motion) {
    root.classList.add('no-motion');
    if (curtain) curtain.classList.add('is-done');
  } else {
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: 'expo.out', duration: 1.1 });
  }

  /* ---------- smooth scroll ---------- */
  if (motion && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- text splitting ---------- */
  function splitWords(el, outer, inner) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (node) {
      var parts = node.nodeValue.split(/(\s+)/), frag = document.createDocumentFragment();
      parts.forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        var o = document.createElement('span'); o.className = outer;
        if (inner) { var i = document.createElement('span'); i.className = inner; i.textContent = part; o.appendChild(i); }
        else o.textContent = part;
        frag.appendChild(o);
      });
      node.parentNode.replaceChild(frag, node);
    });
  }

  /* ---------- scroll + reveal animations ---------- */
  function initAnimations() {
    // headings: words rise out of a mask
    $$('[data-split]').forEach(function (el) {
      el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
      splitWords(el, 'w', 'wi');
      el.classList.add('is-split');
      gsap.set($$('.wi', el), { yPercent: 115 });
      var play = function () { gsap.to($$('.wi', el), { yPercent: 0, duration: 1.25, stagger: 0.045 }); };
      if (el.closest('.hero, .phead')) play();
      else ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: play });
    });

    // single elements and staggered groups
    var all = $$('[data-reveal]').concat($$('[data-stagger] > *'));
    var isTop = function (el) { return !!el.closest('.hero, .phead'); };
    var top = all.filter(isTop), items = all.filter(function (el) { return !isTop(el); });
    gsap.set(all, { y: 34 });
    // page-header content plays straight away, in order, regardless of scroll position
    gsap.to(top, { opacity: 1, y: 0, duration: 1.2, stagger: 0.1, delay: 0.35, clearProps: 'transform' });
    ScrollTrigger.batch(items, {
      start: 'top 92%', once: true,
      onEnter: function (batch) { gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, stagger: 0.08, overwrite: true, clearProps: 'transform' }); }
    });

    // statement text: words light up as you scroll
    $$('[data-scrub]').forEach(function (el) {
      splitWords(el, 'sw');
      gsap.to($$('.sw', el), { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 55%', scrub: 0.4 } });
    });

    // media: clip reveal + parallax
    $$('[data-clip]').forEach(function (el) {
      gsap.fromTo(el, { clipPath: 'inset(14% 10% 14% 10% round 14px)' }, { clipPath: 'inset(0% 0% 0% 0% round 14px)', duration: 1.6, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    $$('[data-parallax]').forEach(function (el) {
      var amt = parseFloat(el.getAttribute('data-parallax')) || 10;
      gsap.fromTo(el, { yPercent: 0 }, { yPercent: -amt, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // marquee, reacts to scroll velocity
    $$('[data-marquee]').forEach(function (track) {
      var tw = gsap.to(track, { xPercent: -50, ease: 'none', duration: 30, repeat: -1 });
      ScrollTrigger.create({
        onUpdate: function (self) {
          var boost = Math.min(5, Math.abs(self.getVelocity()) / 350);
          tw.timeScale(1 + boost);
          gsap.to(tw, { timeScale: 1, duration: 0.9, ease: 'power2.out', overwrite: true });
        }
      });
    });

    // horizontal project gallery (desktop only; phones get a native swipe carousel)
    var mm = gsap.matchMedia();
    mm.add('(min-width: 901px)', function () {
      $$('[data-hscroll]').forEach(function (sec) {
        var track = $('[data-hscroll-track]', sec), bar = $('[data-hscroll-bar]', sec), pin = $('.hwork__pin', sec);
        var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
        gsap.to(track, {
          x: function () { return -dist(); }, ease: 'none',
          scrollTrigger: {
            trigger: sec, pin: pin, start: 'top top', end: function () { return '+=' + dist(); }, scrub: 0.7, invalidateOnRefresh: true, anticipatePin: 1,
            onUpdate: function (self) { if (bar) bar.style.transform = 'scaleX(' + self.progress + ')'; }
          }
        });
      });
    });

    // process: active step + counter + progress line
    $$('[data-steps]').forEach(function (list) {
      var num = $('[data-step-num]'), line = $('[data-steps-line]', list);
      $$('.pstep', list).forEach(function (step) {
        ScrollTrigger.create({
          trigger: step, start: 'top 62%', end: 'bottom 62%',
          onToggle: function (self) {
            step.classList.toggle('is-active', self.isActive);
            if (self.isActive && num && num.textContent !== step.dataset.step) {
              gsap.fromTo(num, { yPercent: 30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5 });
              num.textContent = step.dataset.step;
            }
          }
        });
      });
      if (line) gsap.to(line, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: list, start: 'top 62%', end: 'bottom 62%', scrub: true } });
    });

    // hero copy drifts up and fades as the hero leaves
    var hero = $('.hero');
    if (hero) gsap.to($('.hero__inner', hero), { yPercent: -14, opacity: 0.15, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });

    // footer wordmark rises in
    var mark = $('[data-footer-mark]');
    if (mark) gsap.fromTo(mark, { yPercent: 45 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: mark, start: 'top bottom', end: 'bottom bottom', scrub: true } });

    // CTA glow swells
    $$('.cta__glow').forEach(function (g) {
      gsap.fromTo(g, { scale: 0.6, opacity: 0.4 }, { scale: 1.15, opacity: 1, ease: 'none', scrollTrigger: { trigger: g.parentElement, start: 'top bottom', end: 'bottom bottom', scrub: true } });
    });

    // tilt on project imagery
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      $$('[data-tilt]').forEach(function (el) {
        gsap.set(el, { transformPerspective: 900 });
        var rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3.out' });
        var ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3.out' });
        el.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - 0.5) * 9);
          rx(-((e.clientY - r.top) / r.height - 0.5) * 7);
        });
        el.addEventListener('pointerleave', function () { rx(0); ry(0); });
      });
    }

    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }

  /* ---------- curtain: first-load counter + page transitions ---------- */
  function ready() { document.dispatchEvent(new CustomEvent('oryqen:ready')); }

  function intro() {
    if (!motion || !curtain) { ready(); return; }
    var panel = $('.curtain__panel', curtain), markEl = $('.curtain__mark', curtain), count = $('[data-count]', curtain);
    var first = false;
    try { first = !sessionStorage.getItem('oq-seen'); sessionStorage.setItem('oq-seen', '1'); } catch (e) {}
    var tl = gsap.timeline({ onComplete: function () { curtain.classList.add('is-done'); } });
    if (first) {
      var o = { v: 0 };
      tl.to(o, { v: 100, duration: 1.3, ease: 'power2.inOut', onUpdate: function () { count.textContent = String(Math.round(o.v)).padStart(3, '0'); } });
    } else {
      count.textContent = '';
      tl.to({}, { duration: 0.12 });
    }
    tl.add(function () { initAnimations(); ready(); })
      .to(markEl, { opacity: 0, y: -16, duration: 0.45, ease: 'power2.in' }, '<')
      .set(panel, { transformOrigin: 'top' }, '<')
      .to(panel, { scaleY: 0, duration: 0.95, ease: 'expo.inOut' }, '<0.1');
  }

  function leave(url) {
    if (!motion || !curtain) { window.location.href = url; return; }
    var panel = $('.curtain__panel', curtain), markEl = $('.curtain__mark', curtain);
    curtain.classList.remove('is-done');
    $('[data-count]', curtain).textContent = '';
    if (lenis) lenis.stop();
    gsap.timeline({ onComplete: function () { window.location.href = url; } })
      .set(panel, { transformOrigin: 'bottom', scaleY: 0 })
      .set(markEl, { opacity: 0, y: 16 })
      .to(panel, { scaleY: 1, duration: 0.6, ease: 'expo.inOut' })
      .to(markEl, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, '-=0.3');
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    var href = a.getAttribute('href');
    if (href.charAt(0) === '#') {
      var target = href === '#top' ? 0 : $(href);
      if (target === null) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 1.4 }); else if (target === 0) window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); else target.scrollIntoView();
      return;
    }
    var url;
    try { url = new URL(a.href, window.location.href); } catch (err) { return; }
    if (url.origin !== window.location.origin || !/^https?:$/.test(url.protocol)) return;
    if (url.pathname === window.location.pathname && url.search === window.location.search) return;
    e.preventDefault();
    closeMenu(true);
    leave(url.href);
  });

  // back/forward cache: never show a stale curtain
  window.addEventListener('pageshow', function (e) {
    if (e.persisted && curtain) { curtain.classList.add('is-done'); if (lenis) lenis.start(); }
  });

  /* ---------- navigation ---------- */
  var nav = $('[data-nav]'), menu = $('#menu'), toggle = $('.nav__toggle');
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY || 0;
    if (!nav) return;
    nav.classList.toggle('is-solid', y > 30);
    if (Math.abs(y - lastY) < 4) return;
    if (y > lastY && y > 260 && !root.classList.contains('menu-open')) nav.classList.add('is-hidden');
    else nav.classList.remove('is-hidden');
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function openMenu() {
    root.classList.add('menu-open');
    menu.setAttribute('aria-hidden', 'false'); toggle.setAttribute('aria-expanded', 'true'); toggle.setAttribute('aria-label', 'Close menu');
    if (lenis) lenis.stop();
    if (motion) {
      gsap.killTweensOf(menu);
      gsap.set(menu, { visibility: 'visible' });
      gsap.fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.9, ease: 'expo.inOut' });
      gsap.fromTo($$('.menu__links a, .menu__side > *', menu), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.045, delay: 0.3 });
    } else { menu.style.visibility = 'visible'; menu.style.clipPath = 'none'; }
  }
  function closeMenu(instant) {
    if (!root.classList.contains('menu-open')) return;
    root.classList.remove('menu-open');
    menu.setAttribute('aria-hidden', 'true'); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open menu');
    if (lenis) lenis.start();
    if (motion && !instant) {
      gsap.to(menu, { clipPath: 'inset(0 0 100% 0)', duration: 0.7, ease: 'expo.inOut', onComplete: function () { gsap.set(menu, { visibility: 'hidden' }); } });
    } else if (!instant) { menu.style.visibility = 'hidden'; }
  }
  if (toggle) toggle.addEventListener('click', function () { root.classList.contains('menu-open') ? closeMenu() : openMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMenu(); $$('.nav__drop.is-open').forEach(function (d) { d.classList.remove('is-open'); }); } });

  $$('.nav__drop').forEach(function (drop) {
    var b = $('button', drop);
    b.addEventListener('click', function () { var on = drop.classList.toggle('is-open'); b.setAttribute('aria-expanded', String(on)); });
    document.addEventListener('click', function (e) { if (!drop.contains(e.target)) { drop.classList.remove('is-open'); b.setAttribute('aria-expanded', 'false'); } });
  });

  /* ---------- FAQ accordions ---------- */
  $$('.faq__item').forEach(function (item) {
    var summary = $('summary', item), body = $('.faq__body', item);
    summary.addEventListener('click', function (e) {
      if (!motion) return; // native <details> behaviour
      e.preventDefault();
      var close = function (it) {
        var b = $('.faq__body', it);
        gsap.to(b, { height: 0, duration: 0.5, ease: 'power3.inOut', onComplete: function () { it.removeAttribute('open'); b.style.height = ''; ScrollTrigger.refresh(); } });
      };
      if (item.hasAttribute('open')) { close(item); return; }
      $$('.faq__item[open]', item.parentElement).forEach(close);
      item.setAttribute('open', '');
      gsap.fromTo(body, { height: 0 }, { height: 'auto', duration: 0.6, ease: 'power3.inOut', onComplete: function () { body.style.height = ''; ScrollTrigger.refresh(); } });
    });
  });

  /* ---------- cursor glow on tiles ---------- */
  $$('.tile').forEach(function (tile) {
    tile.addEventListener('pointermove', function (e) {
      var r = tile.getBoundingClientRect();
      tile.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      tile.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- filters (portfolio + insights) ---------- */
  $$('[data-filters]').forEach(function (bar) {
    var grid = bar.parentElement.querySelector('[data-grid]');
    if (!grid) return;
    var items = $$('[data-cats]', grid), buttons = $$('[data-filter]', bar);
    var matches = function (el, key) { var c = el.getAttribute('data-cats'); return key === 'all' || c === key || c.split(' ').indexOf(key) > -1; };
    function apply(key, animate) {
      buttons.forEach(function (b) { var on = b.dataset.filter === key; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on)); });
      var swap = function () {
        items.forEach(function (el) { el.hidden = !matches(el, key); });
        grid.classList.toggle('is-filtered', key !== 'all');
      };
      if (!motion || !animate) { swap(); if (hasGsap) ScrollTrigger.refresh(); return; }
      gsap.to(items, {
        opacity: 0, y: 18, duration: 0.28, ease: 'power2.in', overwrite: true,
        onComplete: function () {
          swap();
          var shown = items.filter(function (el) { return !el.hidden; });
          gsap.fromTo(shown, { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.07, clearProps: 'transform' });
          ScrollTrigger.refresh();
        }
      });
    }
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        apply(b.dataset.filter, true);
        try { var u = new URL(window.location.href); if (b.dataset.filter === 'all') u.searchParams.delete('filter'); else u.searchParams.set('filter', b.dataset.filter); history.replaceState(null, '', u); } catch (e) {}
      });
    });
    var initial = new URLSearchParams(window.location.search).get('filter');
    if (initial && buttons.some(function (b) { return b.dataset.filter === initial; })) apply(initial, false);
  });

  /* ---------- contact form ---------- */
  $$('[data-form]').forEach(function (form) {
    var err = $('.form__error', form), done = $('.form__done', form), doneText = $('[data-form-done]', form);
    var labels = { name: 'Name', company: 'Company', email: 'Email', phone: 'Phone', industry: 'Industry', project_type: 'Type of project', budget: 'Estimated budget', timeline: 'Preferred timeline', website: 'Existing website', source: 'How they found us', requirements: 'Project requirements' };

    function validate() {
      var ok = true, firstBad = null;
      $$('input, select, textarea', form).forEach(function (el) {
        var wrap = el.closest('.field, .check'); if (!wrap) return;
        var bad = !el.checkValidity();
        wrap.classList.toggle('is-invalid', bad);
        if (bad) { ok = false; firstBad = firstBad || el; }
      });
      err.hidden = ok;
      if (!ok) { err.textContent = 'Please complete the highlighted fields and tick the consent box.'; firstBad.focus(); }
      return ok;
    }
    function compose() {
      var data = new FormData(form), lines = [];
      Object.keys(labels).forEach(function (k) { var v = (data.get(k) || '').toString().trim(); if (v) lines.push(labels[k] + ': ' + v); });
      return { data: data, text: 'New website enquiry\n\n' + lines.join('\n') };
    }
    function finish(msg) { doneText.textContent = msg; done.hidden = false; done.focus(); }

    form.addEventListener('input', function (e) { var w = e.target.closest('.field, .check'); if (w) w.classList.remove('is-invalid'); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;
      var c = compose();
      if (FORM_ENDPOINT) {
        var button = $('button[type=submit]', form); button.disabled = true;
        var payload = {}; c.data.forEach(function (v, k) { payload[k] = v; });
        fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) })
          .then(function (r) { if (!r.ok) throw new Error('send failed'); form.reset(); finish('Your enquiry has been sent. We’ll review it and get back to you to arrange a discovery consultation.'); })
          .catch(function () { err.hidden = false; err.textContent = 'Sorry, the enquiry could not be sent. Please email ' + CONTACT_EMAIL + ' or use WhatsApp instead.'; })
          .then(function () { button.disabled = false; });
      } else {
        window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent('Website enquiry — ' + (c.data.get('company') || c.data.get('name'))) + '&body=' + encodeURIComponent(c.text);
        finish('Your email app should now be open with your enquiry filled in — press send to deliver it. If nothing opened, use the WhatsApp button or email ' + CONTACT_EMAIL + '.');
      }
    });

    var wa = $('[data-form-wa]', form);
    if (wa) wa.addEventListener('click', function () {
      if (!validate()) return;
      window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(compose().text), '_blank', 'noopener');
      finish('WhatsApp should now be open with your enquiry filled in — press send to deliver it.');
    });
  });

  /* ---------- Singapore clock ---------- */
  var clock = $('[data-clock]');
  if (clock) {
    var tick = function () {
      try { clock.textContent = new Intl.DateTimeFormat('en-SG', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Singapore' }).format(new Date()) + ' SGT'; } catch (e) {}
    };
    tick(); setInterval(tick, 30000);
  }

  /* ---------- go ---------- */
  intro();
})();
