/* ══════════════════════════════════════════════════════════════
   Filip Lejček — hero motion
   GSAP 3.13 + ScrollTrigger
   Zásady: animujeme jen transform/opacity, respektujeme
   prefers-reduced-motion, scroll choreografie jen na desktopu.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var root     = document.documentElement;
  var wm       = document.getElementById('wordmark');
  var wmInner  = wm && wm.querySelector('.wordmark__inner');
  var letters  = wmInner ? Array.prototype.slice.call(wmInner.children) : [];

  /* ── Fallback: bez GSAP zobrazíme vše staticky ───────────────── */
  if (typeof window.gsap === 'undefined') {
    root.classList.remove('js');
    return;
  }

  var gsap = window.gsap;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
  var ST = window.ScrollTrigger;

  /* ══ 1. Přesné vysázení obří značky na šířku kontejneru ══════════
     Změříme přirozenou šířku řádku písmen při referenční velikosti
     a dopočítáme font-size tak, aby lícoval s okraji. */
  function fitWordmark() {
    if (!wm || !letters.length) return;

    var REF = 200; // referenční velikost pro měření
    var prevJustify = wmInner.style.justifyContent;

    wmInner.style.justifyContent = 'flex-start';
    wm.style.setProperty('--wm-size', REF + 'px');

    var first   = letters[0].getBoundingClientRect();
    var last    = letters[letters.length - 1].getBoundingClientRect();
    var natural = last.right - first.left;

    wmInner.style.justifyContent = prevJustify;

    if (natural > 0) {
      var avail = wm.clientWidth;
      wm.style.setProperty('--wm-size', ((avail / natural) * REF).toFixed(2) + 'px');
    }
  }

  /* ══ 2. Výchozí stavy pro intro ═════════════════════════════════ */
  var photo    = document.querySelector('.hero__photo');
  var navItems = document.querySelectorAll('.navgroup a, .navsep');
  var ctaBtns  = document.querySelectorAll('.hero__cta .btn');
  var cards    = document.querySelectorAll('[data-card]');

  /* Maskované řádky sázíme přes yPercent i v JS.
     CSS drží translate3d(0,110%,0) jen kvůli prvnímu vykreslení — GSAP by ho
     načetl jako pixelové „y“ a tween na yPercent by pak neměl co animovat. */
  gsap.set('.wordmark__l', { yPercent: 110, y: 0 });
  gsap.set('.ln__i',       { yPercent: 110, y: 0 });

  gsap.set(photo,    { opacity: 0, scale: 1.06, transformOrigin: '50% 90%' });
  gsap.set(navItems, { opacity: 0, y: 12 });
  gsap.set(ctaBtns,  { opacity: 0, y: 16 });
  gsap.set(cards,    { opacity: 0, scale: .93, y: 18 });

  /* ══ 3. Intro timeline ══════════════════════════════════════════ */
  function playIntro() {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      gsap.set('.wordmark__l, .ln__i', { yPercent: 0 });
      gsap.set([photo, navItems, ctaBtns, cards], { opacity: 1, scale: 1, y: 0 });
      return null;
    }

    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.to('.wordmark__l',              { yPercent: 0, duration: 1.15, stagger: .055 }, .05)
      .to(photo,                       { opacity: 1, scale: 1, duration: 1.6, ease: 'power2.out' }, .10)
      .to('.hero__headline .ln__i',    { yPercent: 0, duration: 1.0, stagger: .08 }, .48)
      .to(navItems,                    { opacity: 1, y: 0, duration: .7, stagger: .03 }, .58)
      .to(ctaBtns,                     { opacity: 1, y: 0, duration: .75, stagger: .07 }, .88)
      .to(cards,                       { opacity: 1, scale: 1, y: 0, duration: .9, stagger: .09 }, .95)
      .to('.hero__bottom .ln__i',      { yPercent: 0, duration: .85, stagger: .05 }, 1.0)
      .add(function () {
        // uvolníme kompozitní vrstvy, jakmile intro dohraje
        gsap.set('.wordmark__l, .hero__headline .ln__i, .hero__photo',
                 { willChange: 'auto' });
      });

    return tl;
  }

  /* ══ 4. Scroll choreografie (jen desktop + povolený pohyb) ══════ */
  function buildScroll() {
    if (!ST) return;

    var mm = gsap.matchMedia();

    mm.add('(min-width: 981px) and (prefers-reduced-motion: no-preference)', function () {

      /* 5.1 — navigace v hero mizí jako první */
      gsap.to('.hero__nav', {
        autoAlpha: 0, y: 10, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: '7% top', scrub: true }
      });

      /* 5.2 — karty odletí do stran a zmenší se */
      gsap.to('.cards-left', {
        scale: .34, autoAlpha: 0, xPercent: -26, yPercent: -18, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: '2% top', end: '20% top', scrub: true }
      });
      gsap.to('.card--traits', {
        scale: .34, autoAlpha: 0, xPercent: 26, yPercent: -18, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: '2% top', end: '20% top', scrub: true }
      });

      /* 5.3 — spodní texty vyjedou nahoru pod masku */
      gsap.to('.hero__bottom .ln__i', {
        yPercent: -115, ease: 'none', stagger: .015,
        scrollTrigger: { trigger: '.hero', start: '3% top', end: '13% top', scrub: true }
      });

      /* 5.4 — headline a CTA odplují */
      gsap.to('.hero__center', {
        autoAlpha: 0, y: -54, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: '7% top', end: '26% top', scrub: true }
      });

      /* 5.5 — fotka: jemný parallax + ztmavení
         Pozor: procenta v ScrollTrigger se počítají z výšky triggeru (200svh),
         ale odscrollovat lze jen 100svh. Použitelné je tedy jen pásmo 0–50 %. */
      gsap.to('.hero__photo', {
        scale: 1.09, yPercent: 3, opacity: .16, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: '46% top', scrub: .4 }
      });
      gsap.to('.hero__aurora', {
        opacity: .35, scale: 1.12, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: '46% top', scrub: .4 }
      });

      /* 5.6 — obří značka zmizí, jakmile hero odscrollujeme */
      var wmTween = gsap.to(wm, {
        autoAlpha: 0, scale: .92, ease: 'none',
        scrollTrigger: {
          trigger: '.hero', start: '20% top', end: '42% top', scrub: true
        }
      });

      /* úklid při změně breakpointu */
      return function () {
        if (wmTween) wmTween.scrollTrigger && wmTween.scrollTrigger.kill();
        gsap.set([wm, '.hero__center', '.hero__nav',
                  '.cards-left', '.card--traits', '.hero__photo', '.hero__aurora'],
                 { clearProps: 'all' });
        gsap.set('.hero__bottom .ln__i', { yPercent: 0 });
      };
    });

    /* Mobil / omezený pohyb — obsah je staticky na místě */
    mm.add('(max-width: 980px), (prefers-reduced-motion: reduce)', function () {
      gsap.set('.hero__bottom .ln__i', { yPercent: 0 });
    });
  }

  /* ══ 6. Magnetický efekt na primárním CTA (jen jemný, desktop) ══ */
  function magneticCta() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    document.querySelectorAll('.hero__cta .btn').forEach(function (btn) {
      var qx = gsap.quickTo(btn, 'x', { duration: .45, ease: 'power3.out' });
      var qy = gsap.quickTo(btn, 'y', { duration: .45, ease: 'power3.out' });

      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        qx((e.clientX - (r.left + r.width  / 2)) * .16);
        qy((e.clientY - (r.top  + r.height / 2)) * .22);
      });
      btn.addEventListener('pointerleave', function () { qx(0); qy(0); });
    });
  }

  /* ══ 7. Start ═══════════════════════════════════════════════════ */
  function init() {
    fitWordmark();

    var built = false;
    function build() {
      if (built) return;
      built = true;
      buildScroll();
      magneticCta();
      if (ST) ST.refresh();
    }

    var intro = playIntro();

    // Bez intra (omezený pohyb) stavíme rovnou.
    if (!intro) { build(); return; }

    /* Scrub tweeny si zapamatují počáteční hodnoty při prvním vykreslení.
       Kdybychom je postavili během intra, sebraly by rozanimované mezistavy
       (fotka v opacity 0) a zůstaly by na nich. Proto až po dohrání. */
    intro.eventCallback('onComplete', build);

    // Když uživatel začne scrollovat dřív, intro doskočí a řízení předáme scrollu.
    window.addEventListener('scroll', function onEarlyScroll() {
      window.removeEventListener('scroll', onEarlyScroll);
      if (built) return;
      intro.progress(1);
      build();
    }, { passive: true });
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(init);
  } else {
    window.addEventListener('load', init);
  }

  /* ══ 8. Resize — přeměření značky a scroll triggerů ═════════════ */
  var rt;
  var lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    // na mobilech ignorujeme změnu výšky při skrytí URL lišty
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    clearTimeout(rt);
    rt = setTimeout(function () {
      gsap.set(wm, { clearProps: 'transform' });
      fitWordmark();
      if (ST) ST.refresh();
    }, 180);
  }, { passive: true });

})();
