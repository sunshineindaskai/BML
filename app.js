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
   HERO WORD CLOUD  (Matter.js physics)
   ═══════════════════════════════════════════════════════════════════════════ */
(function initWordCloud() {
  const container = document.getElementById('wordCloud');
  if (!container) return;

  /* Only run on non-touch, non-small-screen contexts */
  if (window.matchMedia('(pointer: coarse)').matches)  return;
  if (window.matchMedia('(max-width: 959px)').matches) return;

  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* variant: 'primary' = green-glass service words (tied together visually)
              'secondary' = quieter navy-glass supporting words              */
  const WORDS = [
    { text: 'Your All-in-One Solution', size: 'xl', variant: 'primary'   },
    { text: 'Consulting',               size: 'lg', variant: 'primary'   },
    { text: 'Accounting',               size: 'lg', variant: 'primary'   },
    { text: 'Web Development',          size: 'lg', variant: 'primary'   },
    { text: 'Marketing',                size: 'lg', variant: 'primary'   },
    { text: 'POS Systems',              size: 'md', variant: 'primary'   },
    { text: 'Professional',             size: 'md', variant: 'secondary' },
    { text: 'Trusted',                  size: 'md', variant: 'secondary' },
    { text: 'Tailored',                 size: 'md', variant: 'secondary' },
  ];

  /* Build DOM pill elements */
  const tags = WORDS.map(word => {
    const el = document.createElement('div');
    el.className = `word-tag word-tag--${word.size} word-tag--${word.variant}`;
    el.textContent = word.text;
    container.appendChild(el);
    return { ...word, el, w: 0, h: 0, body: null };
  });

  /* Reduced-motion: CSS handles static layout — no JS physics needed */
  if (isReduced) return;

  /* ── Wait for Matter.js CDN and container dimensions ─────────────────── */
  let attempts = 0;
  function tryInit() {
    attempts++;
    if (attempts > 120) return; /* ~2 s timeout */
    if (typeof Matter === 'undefined' || container.offsetWidth < 50 || container.offsetHeight < 50) {
      requestAnimationFrame(tryInit);
      return;
    }
    setupPhysics(container.offsetWidth, container.offsetHeight);
  }
  requestAnimationFrame(tryInit);

  /* ── Physics setup ───────────────────────────────────────────────────── */
  function setupPhysics(W, H) {
    /* Measure rendered pill sizes */
    tags.forEach(t => { t.w = t.el.offsetWidth; t.h = t.el.offsetHeight; });

    const { Engine, Bodies, Body, World } = Matter;

    const engine = Engine.create({ gravity: { x: 0, y: 0 } }); /* zero gravity — cluster stays centred */

    /* Invisible boundary walls */
    const S = 50;
    World.add(engine.world, [
      Bodies.rectangle(W / 2,      -S / 2,      W + S * 2, S, { isStatic: true, restitution: 0.5, friction: 0.05 }),
      Bodies.rectangle(W / 2,  H + S / 2,       W + S * 2, S, { isStatic: true, restitution: 0.5, friction: 0.05 }),
      Bodies.rectangle(-S / 2,     H / 2,    S, H + S * 2,    { isStatic: true, restitution: 0.5, friction: 0.05 }),
      Bodies.rectangle(W + S / 2,  H / 2,    S, H + S * 2,    { isStatic: true, restitution: 0.5, friction: 0.05 }),
    ]);

    /* Cluster map — secondary words (Professional, Trusted, Tailored) are
       distributed across different rows so they feel integrated, not segregated.
       Each secondary word shares a row with at least one primary word.

       Row 1  y=0.10  POS Systems (primary MD, top anchor)
       Row 2  y=0.27  Consulting (primary LG) · Tailored (secondary MD) · Accounting (primary LG)
       Row 3  y=0.50  Your All-in-One Solution (XL — alone, too wide to share)
       Row 4  y=0.73  Web Dev (primary LG) · Trusted (secondary MD)
       Row 5  y=0.89  Marketing (primary LG) · Professional (secondary MD)              */
    const cx = W * 0.5, cy = H * 0.5;
    const POSITIONS = [
      [0.50, 0.50],  /* XL  Your All-in-One Solution — centre anchor     */
      [0.20, 0.27],  /* LG  Consulting   — upper-left                    */
      [0.80, 0.27],  /* LG  Accounting   — upper-right                   */
      [0.26, 0.73],  /* LG  Web Dev      — lower-left                    */
      [0.30, 0.89],  /* LG  Marketing    — bottom-left                   */
      [0.50, 0.10],  /* MD  POS Systems  — top-centre                    */
      [0.73, 0.89],  /* MD  Professional — bottom-right (shares row 5)   */
      [0.67, 0.73],  /* MD  Trusted      — lower-right (shares row 4)    */
      [0.50, 0.27],  /* MD  Tailored     — upper-centre (shares row 2)   */
    ];
    tags.forEach((t, i) => {
      const [fx, fy] = POSITIONS[i] || [0.5, 0.5];
      const pad = 12;
      /* Home position — attractor will pull body back here */
      t.hx = Math.max(t.w / 2 + pad, Math.min(W - t.w / 2 - pad, W * fx));
      t.hy = Math.max(t.h / 2 + pad, Math.min(H - t.h / 2 - pad, H * fy));

      /* Spawn with tiny jitter so bodies don't stack exactly on each other */
      const jitter = 6;
      const x = t.hx + (Math.random() - 0.5) * jitter;
      const y = t.hy + (Math.random() - 0.5) * jitter;

      const body = Bodies.rectangle(x, y, t.w, t.h, {
        restitution: 0.20,  /* low bounce — calm collisions */
        friction:    0.05,
        frictionAir: 0.013, /* light air drag — bodies drift gently */
        density:     0.0015,
        label:       'word',
      });
      /* Gentle random initial drift — home attractor keeps them in place */
      Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 0.5,
        y: (Math.random() - 0.5) * 0.5,
      });
      Body.setAngle(body, (Math.random() - 0.5) * 0.08);
      t.body = body;
      World.add(engine.world, body);
    });

    /* Prepare divs — positioned via CSS transform from top-left origin */
    tags.forEach(t => {
      t.el.style.position = 'absolute';
      t.el.style.left     = '0';
      t.el.style.top      = '0';
      t.el.style.opacity  = '0';
      t.el.style.transition = 'opacity 0.5s ease';
    });

    /* ── Mouse repulsion ──────────────────────────────────────────────── */
    let mx = -9999, my = -9999, hovering = false;
    container.addEventListener('mousemove', e => {
      const r = container.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
      hovering = true;
    });
    container.addEventListener('mouseleave', () => { hovering = false; });

    /* ── RAF loop ─────────────────────────────────────────────────────── */
    let raf, frameCount = 0, revealed = false;

    function tick() {
      Engine.update(engine, 16.667);
      frameCount++;

      /* Mouse repulsion — subtle quadratic falloff within 200 px */
      if (hovering) {
        tags.forEach(t => {
          const dx   = t.body.position.x - mx;
          const dy   = t.body.position.y - my;
          const dist = Math.hypot(dx, dy);
          if (dist < 200 && dist > 1) {
            const k = 1 - dist / 200;
            const f = 0.00015 * k * k;
            Body.applyForce(t.body, t.body.position, { x: (dx / dist) * f, y: (dy / dist) * f });
          }
        });
      }

      /* Home attractor — each body pulled toward its own intended position */
      tags.forEach(t => {
        const dx = t.hx - t.body.position.x;
        const dy = t.hy - t.body.position.y;
        const d  = Math.hypot(dx, dy);
        if (d > 8) {
          const f = 0.0000055 * d; /* spring-like: stronger the further it strays */
          Body.applyForce(t.body, t.body.position, {
            x: (dx / d) * f,
            y: (dy / d) * f,
          });
        }
      });

      /* Idle nudge — kick any body that has settled, every ~2 s */
      if (frameCount % 120 === 0) {
        tags.forEach(t => {
          const spd = Math.hypot(t.body.velocity.x, t.body.velocity.y);
          if (spd < 0.12) {
            Body.setVelocity(t.body, {
              x: t.body.velocity.x + (Math.random() - 0.5) * 0.45,
              y: t.body.velocity.y + (Math.random() - 0.5) * 0.45,
            });
          }
        });
      }

      /* Cap speed — low ceiling keeps motion premium, not frantic */
      const MAX_SPD = 1.8;
      tags.forEach(t => {
        const spd = Math.hypot(t.body.velocity.x, t.body.velocity.y);
        if (spd > MAX_SPD) {
          Body.setVelocity(t.body, {
            x: (t.body.velocity.x / spd) * MAX_SPD,
            y: (t.body.velocity.y / spd) * MAX_SPD,
          });
        }
        /* Clamp rotation to ±13° to keep words readable */
        const MAX_A = 0.23;
        if (Math.abs(t.body.angle) > MAX_A) {
          Body.setAngle(t.body, Math.sign(t.body.angle) * MAX_A);
          Body.setAngularVelocity(t.body, t.body.angularVelocity * 0.4);
        }
        /* Damp angular velocity */
        if (Math.abs(t.body.angularVelocity) > 0.008) {
          Body.setAngularVelocity(t.body, t.body.angularVelocity * 0.88);
        }
      });

      /* Sync DOM positions */
      if (!revealed) { tags.forEach(t => { t.el.style.opacity = '1'; }); revealed = true; }
      tags.forEach(t => {
        const { x, y } = t.body.position;
        t.el.style.transform = `translate(${(x - t.w / 2).toFixed(1)}px,${(y - t.h / 2).toFixed(1)}px) rotate(${t.body.angle.toFixed(4)}rad)`;
      });

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);

    /* Pause when tab hidden */
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(tick);
    });

    /* Cleanup */
    window.addEventListener('pagehide', () => {
      cancelAnimationFrame(raf);
      World.clear(engine.world);
      Engine.clear(engine);
    });
  }
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

  // Start when text scrolls into view — works on both homepage (#hlText) and about page (#approachHlText)
  const hlText = document.getElementById('hlText') || document.getElementById('approachHlText');
  if (hlText) {
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { start(); io.disconnect(); }
    }, { threshold: 0.4 });
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
    gsap.to('#wordCloud', {
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

  /* ════════════════════════════════════════════════════════════════════════
     ABOUT PAGE ANIMATIONS  (only run when about.html elements are present)
     ════════════════════════════════════════════════════════════════════════ */

  /* ── About hero entrance ─────────────────────────────────────────────── */
  const ahEyebrow = document.getElementById('ahEyebrow');
  if (ahEyebrow) {
    if (!prefersReduced) {
      const ahTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      ahTl
        .fromTo('#ahEyebrow',    { opacity:0, y:20 },        { opacity:1, y:0, duration:0.7 }, 0.2);
      document.querySelectorAll('.about-hero__headline .h-line').forEach((line, i) => {
        ahTl.fromTo(line,
          { opacity:0, yPercent:110 },
          { opacity:1, yPercent:0, duration:0.75, ease:'power4.out' },
          0.45 + i * 0.12
        );
      });
      ahTl
        .fromTo('#ahSub',        { opacity:0, y:24 }, { opacity:1, y:0, duration:0.7 }, 0.9)
        .fromTo('#ahActions',    { opacity:0, y:20 }, { opacity:1, y:0, duration:0.6 }, 1.05)
        .fromTo('#ahScrollInd',  { opacity:0 },       { opacity:1, duration:0.5 },       1.35)
        .fromTo('#ahVisual',     { opacity:0, scale:0.94 }, { opacity:1, scale:1, duration:1.1 }, 0.55);
    } else {
      gsap.set(['#ahEyebrow','#ahSub','#ahActions','#ahScrollInd','#ahVisual'], { opacity:1 });
      gsap.set('.about-hero__headline .h-line', { opacity:1, yPercent:0 });
    }
  }

  /* ── Story split: section text + image clip reveal ───────────────────── */
  if (!prefersReduced) {
    if (document.querySelector('.story-split__text')) {
      gsap.fromTo(
        '.story-split__text .section__label, .story-split__text .section__heading, .story-split__body',
        { opacity:0, y:30 },
        { opacity:1, y:0, duration:0.7, stagger:0.12, ease:'power3.out',
          scrollTrigger: { trigger: '.story-split__text', start: 'top 78%', once: true } }
      );
    }
    const storyImg = document.querySelector('.story-img');
    if (storyImg) {
      gsap.fromTo(storyImg,
        { clipPath: 'inset(0 0 100% 0)' },
        { clipPath: 'inset(0 0 0% 0)', duration:1.1, ease:'power3.inOut',
          scrollTrigger: { trigger: '#storySplitVisual', start: 'top 72%', once: true } }
      );
    }
  }

  /* ── Values section: heading + staggered cards ───────────────────────── */
  if (!prefersReduced) {
    if (document.querySelector('.values-section__hd')) {
      gsap.fromTo(
        '.values-section__hd .section__label, .values-section__hd .section__heading',
        { opacity:0, y:30 },
        { opacity:1, y:0, duration:0.7, stagger:0.12, ease:'power3.out',
          scrollTrigger: { trigger: '.values-section__hd', start: 'top 78%', once: true } }
      );
      gsap.fromTo('.value-card',
        { opacity:0, y:40, scale:0.97 },
        { opacity:1, y:0, scale:1, duration:0.6, stagger:0.1, ease:'power3.out',
          scrollTrigger: { trigger: '.values-grid', start: 'top 82%', once: true } }
      );
    }
  }

  /* ── Who We Help: text + staggered list items ────────────────────────── */
  if (!prefersReduced) {
    if (document.querySelector('.who-help__text')) {
      gsap.fromTo(
        '.who-help__text .section__label, .who-help__text .section__heading, .who-help__body',
        { opacity:0, y:30 },
        { opacity:1, y:0, duration:0.7, stagger:0.12, ease:'power3.out',
          scrollTrigger: { trigger: '.who-help__text', start: 'top 78%', once: true } }
      );
      gsap.fromTo('.who-item',
        { opacity:0, x:-20 },
        { opacity:1, x:0, duration:0.55, stagger:0.09, ease:'power3.out',
          scrollTrigger: { trigger: '#whoHelpList', start: 'top 82%', once: true } }
      );
    }
  }

  /* ── Approach section ────────────────────────────────────────────────── */
  if (!prefersReduced) {
    if (document.querySelector('.approach-section__hd')) {
      gsap.fromTo(
        '.approach-section__hd .section__label, .approach-section__hd .section__heading',
        { opacity:0, y:30 },
        { opacity:1, y:0, duration:0.7, stagger:0.12, ease:'power3.out',
          scrollTrigger: { trigger: '.approach-section__hd', start: 'top 78%', once: true } }
      );
      gsap.fromTo(
        '.approach-section__copy, .approach-hl-text, .approach-services',
        { opacity:0, y:24 },
        { opacity:1, y:0, duration:0.7, stagger:0.15, ease:'power3.out',
          scrollTrigger: { trigger: '.approach-section__body', start: 'top 80%', once: true } }
      );
    }
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
