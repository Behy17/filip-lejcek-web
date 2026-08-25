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
  var topbar   = document.getElementById('topbar');
  var tbLogo   = topbar && topbar.querySelector('.topbar__logo');
  // Odkaz má kvůli dotykovému cíli vlastní výplň — pro měření morphu
  // potřebujeme čistý text, ne celý klikací box.
  var tbLogoTx = tbLogo && (tbLogo.querySelector('span') || tbLogo);

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

  /* ══ 4. Geometrie přechodu značka → logo v topbaru ══════════════
     Změříme cílovou pozici loga v topbaru a dopočítáme scale/offset. */
  function measureMorph() {
    if (!wm || !wmInner || !tbLogo) return null;

    // dočasně zrušíme transformy, aby měření sedělo
    gsap.set(wm, { clearProps: 'transform' });
    var tbTransform = topbar.style.transform;
    var tbOpacity   = tbLogo.style.opacity;
    topbar.style.transform = 'none';
    tbLogo.style.opacity   = '0';

    var from = wmInner.getBoundingClientRect();
    var to   = tbLogoTx.getBoundingClientRect();

    topbar.style.transform = tbTransform;
    tbLogo.style.opacity   = tbOpacity;

    if (!from.height || !to.height) return null;

    return {
      scale: to.height / from.height,
      x:     to.left - from.left,
      y:     to.top  - from.top
    };
  }

  /* ══ 5. Scroll choreografie (jen desktop + povolený pohyb) ══════ */
  function buildScroll() {
    if (!ST) return;

    var mm = gsap.matchMedia();

    mm.add('(min-width: 981px) and (prefers-reduced-motion: no-preference)', function () {

      var morph = measureMorph();

      /* Výchozí posun topbaru sázíme přes yPercent i v JS — ze stejného
         důvodu jako u maskovaných řádků (GSAP by CSS hodnotu načetl v px). */
      gsap.set(topbar, { yPercent: -101, y: 0 });
      // dokud je topbar odsunutý mimo obraz, nesmí být dosažitelný tabulátorem
      topbar.setAttribute('inert', '');

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

      /* 5.6 — obří značka se scvrkne přesně do loga v topbaru */
      var wmTween;
      if (morph) {
        wmTween = gsap.to(wm, {
          scale: morph.scale, x: morph.x, y: morph.y, ease: 'none',
          scrollTrigger: {
            trigger: '.hero', start: 'top top', end: '44% top',
            scrub: .5, invalidateOnRefresh: true
          }
        });
      }

      /* 5.7 — předání štafety: značka mizí, topbar nastupuje */
      var handoff = gsap.timeline({
        scrollTrigger: {
          trigger: '.hero', start: '45% top',
          toggleActions: 'play none none reverse'
        }
      });
      handoff
        .to(topbar, { yPercent: 0, duration: .45, ease: 'power2.out' }, 0)
        .to(tbLogo, { opacity: 1, duration: .3, ease: 'power1.out' }, .06)
        .to(wm,     { autoAlpha: 0, duration: .3, ease: 'power1.out' }, .06);

      handoff.eventCallback('onStart',           function () { topbar.removeAttribute('inert'); });
      handoff.eventCallback('onReverseComplete', function () { topbar.setAttribute('inert', ''); });

      /* úklid při změně breakpointu */
      return function () {
        topbar.removeAttribute('inert');
        if (wmTween) wmTween.scrollTrigger && wmTween.scrollTrigger.kill();
        gsap.set([wm, topbar, tbLogo, '.hero__center', '.hero__nav',
                  '.cards-left', '.card--traits', '.hero__photo', '.hero__aurora'],
                 { clearProps: 'all' });
        gsap.set('.hero__bottom .ln__i', { yPercent: 0 });
      };
    });

    /* Mobil / omezený pohyb — obsah je staticky na místě */
    mm.add('(max-width: 980px), (prefers-reduced-motion: reduce)', function () {
      gsap.set('.hero__bottom .ln__i', { yPercent: 0 });
      gsap.set(topbar, { clearProps: 'transform' });
      gsap.set(tbLogo, { clearProps: 'opacity' });
      topbar.removeAttribute('inert');
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
