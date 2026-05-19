/* ═══════════════════════════════════════════════════════════════════════════
   BML – Business Mindset Limited | Interactions v5
   GSAP + ScrollTrigger (loaded via CDN)
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

/* ── Site config ─────────────────────────────────────────────────────────────
   Central source of truth — update here to change across the whole site
─────────────────────────────────────────────────────────────────────────── */
const SITE = {
  name:      'BML',
  fullName:  'Business Mindset Limited',
  email:     'info@businessmindsetjm.com',
  phone:     '+1 (876) 233-9715',
  tel:       '+18762339715',
  instagram: 'https://www.instagram.com/businessmindsetjm',
  twitter:   'https://x.com/businessmindsetjm',
  calendly:  'https://calendly.com/businessmindsetjm/consultation',
};

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Copyright year ─────────────────────────────────────────────────────────── */
const yr = document.getElementById('year');
if (yr) yr.textContent = new Date().getFullYear();

/* ── Nav scroll class + hamburger ───────────────────────────────────────────── */
(function initNav() {
  const nav       = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const mobile    = document.getElementById('mobileMenu');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 30);
  }, { passive: true });

  hamburger.addEventListener('click', () => {
    const open = mobile.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', open);
    mobile.setAttribute('aria-hidden', !open);
  });

  mobile.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobile.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      mobile.setAttribute('aria-hidden', 'true');
    });
  });
})();

/* ── Active nav link on scroll ──────────────────────────────────────────────── */
(function initActiveLink() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav__link');
  if (!sections.length) return;
  const io = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(l => {
        l.classList.toggle('nav__link--active', l.getAttribute('href') === '#' + e.target.id);
      });
    }),
    { threshold: 0.35 }
  );
  sections.forEach(s => io.observe(s));
})();

/* ── Smooth anchor scroll ───────────────────────────────────────────────────── */
(function initAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      const offset = document.getElementById('nav').offsetHeight + 8;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
    });
  });
})();

/* ═══════════════════════════════════════════════════════════════════════════
   SERVICE CAROUSEL
   ═══════════════════════════════════════════════════════════════════════════ */
(function initCarousel() {
  const outer = document.getElementById('svcOuter');
  const track = document.getElementById('svcTrack');
  if (!outer || !track) return;

  /* ── Clone originals only (guard against double-cloning on edge cases) ── */
  const origCards = Array.from(track.querySelectorAll('.svc-card:not([aria-hidden])'));
  origCards.forEach(card => {
    const clone = card.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.setAttribute('tabindex', '-1');
    track.appendChild(clone);
  });

  /* ── Skip animation: reduced-motion or touch/mobile ── */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch        = window.matchMedia('(pointer: coarse)').matches;
  if (prefersReduced || isTouch) return;

  /* ── Speed constants (px per frame @ 60 fps)
     BASE 0.6 = ~36 px/s  → premium but visibly alive
     FAST 2.2× = ~79 px/s → brisk right-zone scroll
     BACK 1.7× = ~61 px/s → confident left-zone reverse  ── */
  const BASE  = 0.6;
  const FAST  = BASE * 2.2;
  const BACK  = -(BASE * 1.7);

  let pos          = 0;
  let speed        = BASE;
  let targetSpeed  = BASE;
  let hoveringCard = false;
  let hoverZone    = null; // 'left' | 'right' | null
  let raf;

  /* ── Card hover → pause ── */
  track.querySelectorAll('.svc-card').forEach(card => {
    card.addEventListener('mouseenter', () => { hoveringCard = true; });
    card.addEventListener('mouseleave', () => { hoveringCard = false; });
  });

  /* ── Mouse position → hover zone ── */
  outer.addEventListener('mousemove', e => {
    if (hoveringCard) { hoverZone = null; return; }
    const x = e.clientX - outer.getBoundingClientRect().left;
    const w = outer.offsetWidth;
    if      (x < w * 0.20) hoverZone = 'left';
    else if (x > w * 0.80) hoverZone = 'right';
    else                    hoverZone = null;
  });
  outer.addEventListener('mouseleave', () => { hoverZone = null; });

  /* ── rAF loop ── */
  function tick() {
    if (hoveringCard) {
      targetSpeed = 0;
    } else if (hoverZone === 'left') {
      targetSpeed = BACK;
    } else if (hoverZone === 'right') {
      targetSpeed = FAST;
    } else {
      targetSpeed = BASE;
    }

    /* Smooth easing — 0.055 gives a ~0.25 s half-life, feels deliberate not snappy */
    speed += (targetSpeed - speed) * 0.055;
    if (Math.abs(speed) < 0.004) speed = 0;

    pos += speed;

    /* Infinite loop: reset when one full set has scrolled past */
    const half = track.scrollWidth / 2;
    if (pos >= half) pos -= half;
    if (pos < 0)     pos += half;

    track.style.transform = `translateX(${-pos}px)`;
    raf = requestAnimationFrame(tick);
  }

  raf = requestAnimationFrame(tick);
})();

/* ═══════════════════════════════════════════════════════════════════════════
   ANIMATED HIGHLIGHT TEXT
   Cycles green glow through key phrases
   ═══════════════════════════════════════════════════════════════════════════ */
(function initHighlight() {
  const words   = document.querySelectorAll('.hl');
  if (!words.length) return;

  let current  = -1;
  let interval = null;
  let started  = false;

  function activate(index) {
    words.forEach((w, i) => w.classList.toggle('hl--active', i === index));
    current = index;
  }

  function cycle() {
    activate((current + 1) % words.length);
  }

  function start() {
    if (started) return;
    started = true;
    activate(0);
    interval = setInterval(cycle, 2200);
  }

  if (prefersReduced) {
    // Just show all highlighted without animation
    words.forEach(w => w.classList.add('hl--active'));
    return;
  }

  // Start when text scrolls into view
  const hlText = document.getElementById('hlText');
  if (hlText) {
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { start(); io.disconnect(); }
    }, { threshold: 0.5 });
    io.observe(hlText);
  } else {
    start();
  }
})();

/* ═══════════════════════════════════════════════════════════════════════════
   GSAP ANIMATIONS
   ═══════════════════════════════════════════════════════════════════════════ */
function runGSAP() {
  if (typeof gsap === 'undefined') {
    /* GSAP failed — reveal everything as fallback */
    document.querySelectorAll('#heroEyebrow,#heroSub,#heroActions,#heroScroll,#heroVisual').forEach(el => {
      if (el) { el.style.opacity = '1'; el.style.transform = 'none'; }
    });
    document.querySelectorAll('.h-line').forEach(el => {
      el.style.opacity = '1'; el.style.transform = 'none';
    });
    document.querySelectorAll('.beat__img').forEach(el => { el.style.clipPath = 'none'; });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ── 1. Hero entrance ───────────────────────────────────────────────── */
  if (!prefersReduced) {
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    heroTl.fromTo('#heroEyebrow', { opacity:0, y:20 }, { opacity:1, y:0, duration:0.7 }, 0.2);

    document.querySelectorAll('.hero__headline .h-line').forEach((line, i) => {
      heroTl.fromTo(line,
        { opacity:0, yPercent:110 },
        { opacity:1, yPercent:0, duration:0.75, ease:'power4.out' },
        0.45 + i * 0.12
      );
    });

    heroTl.fromTo('#heroSub',     { opacity:0, y:24 }, { opacity:1, y:0, duration:0.7 }, 0.9);
    heroTl.fromTo('#heroActions', { opacity:0, y:20 }, { opacity:1, y:0, duration:0.6 }, 1.05);
    heroTl.fromTo('#heroScroll',  { opacity:0 },       { opacity:1, duration:0.5 },       1.35);
    heroTl.fromTo('#heroVisual',  { opacity:0, scale:0.92 }, { opacity:1, scale:1, duration:1.1, ease:'power3.out' }, 0.55);

  } else {
    gsap.set(['#heroEyebrow','#heroSub','#heroActions','#heroScroll','#heroVisual'], { opacity:1 });
    gsap.set('.h-line', { opacity:1, yPercent:0 });
  }

  /* ── 2. Hero parallax ───────────────────────────────────────────────── */
  if (!prefersReduced) {
    gsap.to('.hero__text', {
      yPercent: 12, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.orb__wrap', {
      y: -60, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  /* ── 3. About section ───────────────────────────────────────────────── */
  if (!prefersReduced) {
    const aboutTl = gsap.timeline({
      scrollTrigger: { trigger: '.about', start: 'top 75%', once: true }
    });
    aboutTl
      .fromTo('.about__text .section__label', { opacity:0, y:20 }, { opacity:1, y:0, duration:0.6 }, 0)
      .fromTo('.about__headline', { opacity:0, y:36 }, { opacity:1, y:0, duration:0.8, ease:'power3.out' }, 0.1)
      .fromTo('.hl-text',         { opacity:0, y:20 }, { opacity:1, y:0, duration:0.6 }, 0.25)
      .fromTo('#counterFeature',  { opacity:0, y:24, scale:0.97 }, { opacity:1, y:0, scale:1, duration:0.7, ease:'power3.out' }, 0.38)
      .fromTo('.about__text .btn', { opacity:0, y:16 }, { opacity:1, y:0, duration:0.5 }, 0.5);

    // Image mask wipe
    const mask = document.querySelector('.about__img-mask');
    if (mask) {
      gsap.fromTo(mask,
        { scaleX:1, transformOrigin:'left center' },
        { scaleX:0, duration:1.1, ease:'power3.inOut',
          scrollTrigger: { trigger: '.about__visual', start: 'top 70%', once: true } }
      );
    }
    gsap.fromTo('.about__card',
      { opacity:0, y:16, x:-10 },
      { opacity:1, y:0, x:0, duration:0.7, delay:0.8,
        scrollTrigger: { trigger: '.about__visual', start: 'top 70%', once: true } }
    );
  }

  /* ── 4. Counter animation ───────────────────────────────────────────── */
  (function initCounter() {
    const valEl = document.getElementById('counterVal');
    if (!valEl) return;

    if (prefersReduced) { valEl.textContent = '50'; return; }

    const obj = { val: 0 };
    ScrollTrigger.create({
      trigger: '#counterFeature',
      start: 'top 80%',
      once: true,
      onEnter: () => {
        gsap.to(obj, {
          val: 50,
          duration: 2.2,
          ease: 'power2.out',
          onUpdate: function() {
            valEl.textContent = Math.round(obj.val);
          },
          onComplete: () => { valEl.textContent = '50'; }
        });
      }
    });
  })();

  /* ── 5. Services carousel reveal ────────────────────────────────────── */
  if (!prefersReduced) {
    gsap.fromTo('.services__hd .section__label, .services__hd .section__heading, .services__intro',
      { opacity:0, y:30 },
      { opacity:1, y:0, duration:0.7, stagger:0.12,
        scrollTrigger: { trigger: '.services', start: 'top 78%', once: true } }
    );
    /* Clones added by initCarousel should always be visible */
    gsap.set('.svc-card[aria-hidden="true"]', { opacity:1, y:0 });
    /* Reveal only the original (non-clone) cards */
    gsap.fromTo('.svc-card:not([aria-hidden])',
      { opacity:0, y:40 },
      { opacity:1, y:0, duration:0.6, stagger:0.08, ease:'power3.out',
        scrollTrigger: { trigger: '#svcOuter', start: 'top 82%', once: true } }
    );
    gsap.fromTo('.services__foot',
      { opacity:0, y:20 },
      { opacity:1, y:0, duration:0.5,
        scrollTrigger: { trigger: '.services__foot', start: 'top 88%', once: true } }
    );
  }

  /* ── 6. Scroll Story beats ──────────────────────────────────────────── */
  if (!prefersReduced) {
    gsap.fromTo('.scroll-story__hd .section__label, .scroll-story__title',
      { opacity:0, y:36 },
      { opacity:1, y:0, duration:0.8, stagger:0.15,
        scrollTrigger: { trigger: '.scroll-story__hd', start: 'top 78%', once: true } }
    );

    document.querySelectorAll('.beat').forEach(beat => {
      const elems = [beat.querySelector('.beat__num'), beat.querySelector('.beat__title'), beat.querySelector('.beat__desc')].filter(Boolean);
      const img   = beat.querySelector('.beat__img');

      gsap.fromTo(elems,
        { opacity:0, y:36 },
        { opacity:1, y:0, duration:0.75, stagger:0.1, ease:'power3.out',
          scrollTrigger: { trigger: beat, start: 'top 75%', once: true } }
      );
      if (img) {
        gsap.fromTo(img,
          { clipPath: 'inset(0 0 100% 0)' },
          { clipPath: 'inset(0 0 0% 0)', duration:1.0, ease:'power3.inOut',
            scrollTrigger: { trigger: beat, start: 'top 72%', once: true } }
        );
      }
    });
  }

  /* ── 7. Why BML cards ───────────────────────────────────────────────── */
  if (!prefersReduced) {
    gsap.fromTo('.why__hd .section__label, .why__hd .section__heading',
      { opacity:0, y:30 },
      { opacity:1, y:0, duration:0.7, stagger:0.12,
        scrollTrigger: { trigger: '.why', start: 'top 75%', once: true } }
    );
    gsap.fromTo('.why-card',
      { opacity:0, y:40, scale:0.97 },
      { opacity:1, y:0, scale:1, duration:0.6, stagger:0.07, ease:'power3.out',
        scrollTrigger: { trigger: '.why__grid', start: 'top 80%', once: true } }
    );
  }

  /* ── 8. Final CTA ───────────────────────────────────────────────────── */
  if (!prefersReduced) {
    gsap.fromTo('.cta-final__label, .cta-final__headline, .cta-final__sub, .cta-final__btn',
      { opacity:0, y:30 },
      { opacity:1, y:0, duration:0.7, stagger:0.12, ease:'power3.out',
        scrollTrigger: { trigger: '.cta-final', start: 'top 80%', once: true } }
    );
  }

  /* ── 9. Magnetic button hover ───────────────────────────────────────── */
  if (!prefersReduced) {
    document.querySelectorAll('.btn--lg').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        const x    = (e.clientX - rect.left - rect.width  / 2) * 0.18;
        const y    = (e.clientY - rect.top  - rect.height / 2) * 0.18;
        gsap.to(btn, { x, y, duration:0.3, ease:'power2.out' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x:0, y:0, duration:0.5, ease:'elastic.out(1,.5)' });
      });
    });
  }

  /* ── 10. Service card 3-D tilt on hover ─────────────────────────────── */
  if (!prefersReduced) {
    document.querySelectorAll('.svc-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x    = (e.clientX - rect.left) / rect.width  - 0.5;
        const y    = (e.clientY - rect.top)  / rect.height - 0.5;
        gsap.to(card, {
          rotateY: x * 8, rotateX: -y * 5,
          transformPerspective: 900,
          ease: 'power2.out', duration: 0.35
        });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { rotateY:0, rotateX:0, duration:0.5, ease:'power3.out' });
      });
    });
  }

  /* ── Refresh triggers so elements already in view on load animate in ── */
  requestAnimationFrame(() => ScrollTrigger.refresh());

}

/* Run after all scripts (including CDN) have loaded */
if (document.readyState === 'complete') {
  runGSAP();
} else {
  window.addEventListener('load', runGSAP, { once: true });
}
