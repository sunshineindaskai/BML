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
  const carousel  = document.getElementById('svcCarousel');
  const prevBtn   = document.getElementById('svcPrev');
  const nextBtn   = document.getElementById('svcNext');
  const progress  = document.getElementById('svcProgressBar');
  if (!carousel) return;

  const cards     = carousel.querySelectorAll('.svc-card');
  const cardCount = cards.length;

  /* Update progress bar */
  function updateProgress() {
    const max  = carousel.scrollWidth - carousel.clientWidth;
    const pct  = max > 0 ? carousel.scrollLeft / max : 0;
    const segW = 100 / cardCount;
    if (progress) progress.style.width = (segW + pct * (100 - segW)) + '%';
  }

  /* Scroll to card index */
  function scrollToCard(index) {
    const target = cards[Math.max(0, Math.min(index, cardCount - 1))];
    if (target) {
      carousel.scrollTo({ left: target.offsetLeft - parseInt(getComputedStyle(carousel).paddingLeft || '0'), behavior: 'smooth' });
    }
  }

  /* Find current visible card index */
  function currentIndex() {
    const mid = carousel.scrollLeft + carousel.clientWidth / 2;
    let closest = 0, minDist = Infinity;
    cards.forEach((c, i) => {
      const dist = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    return closest;
  }

  if (prevBtn) prevBtn.addEventListener('click', () => scrollToCard(currentIndex() - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => scrollToCard(currentIndex() + 1));

  carousel.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* Mouse drag-to-scroll */
  let isDown = false, startX = 0, scrollLeft = 0;
  carousel.addEventListener('mousedown', e => {
    isDown     = true;
    startX     = e.pageX - carousel.offsetLeft;
    scrollLeft = carousel.scrollLeft;
    carousel.style.userSelect = 'none';
  });
  window.addEventListener('mouseup', () => {
    isDown = false;
    carousel.style.userSelect = '';
  });
  carousel.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    const x    = e.pageX - carousel.offsetLeft;
    const walk = (x - startX) * 1.5;
    carousel.scrollLeft = scrollLeft - walk;
  });
  carousel.addEventListener('mouseleave', () => { isDown = false; carousel.style.userSelect = ''; });
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
    gsap.fromTo('.svc-card',
      { opacity:0, y:40 },
      { opacity:1, y:0, duration:0.6, stagger:0.08, ease:'power3.out',
        scrollTrigger: { trigger: '.svc-carousel', start: 'top 82%', once: true } }
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
    gsap.fromTo('.cta-final__label, .cta-final__headline, .cta-final__sub, .cta-final__actions',
      { opacity:0, y:30 },
      { opacity:1, y:0, duration:0.7, stagger:0.1, ease:'power3.out',
        scrollTrigger: { trigger: '.cta-final', start: 'top 78%', once: true } }
    );
    gsap.fromTo('.cta-final__contact-label, .contact-item',
      { opacity:0, y:20 },
      { opacity:1, y:0, duration:0.55, stagger:0.08,
        scrollTrigger: { trigger: '.cta-final__contact', start: 'top 82%', once: true } }
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
