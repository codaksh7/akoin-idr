/**
 * IDR — Institute of Digital Risk
 * main.js — Three.js hero, GSAP ScrollTrigger, Anime.js interactions
 */

'use strict';

/* ── Utility ───────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ═══════════════════════════════════════════════
   1. THREE.JS HERO CANVAS
   Grid with floating cube wireframes and particles
═══════════════════════════════════════════════ */
(function initHeroThree() {
  const canvas = $('#hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
  camera.position.set(0, 2, 14);

  function resize() {
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  }

  resize();

  /* ── Grid plane ── */
  const gridGeo = new THREE.PlaneGeometry(40, 40, 24, 24);
  const gridMat = new THREE.MeshBasicMaterial({
    color: 0xFF6B00,
    wireframe: true,
    transparent: true,
    opacity: 0.06,
  });
  const grid = new THREE.Mesh(gridGeo, gridMat);
  grid.rotation.x = -Math.PI / 2.5;
  grid.position.y = -4;
  scene.add(grid);

  /* ── Particle field (dots) ── */
  const PARTICLE_COUNT = 220;
  const pPositions = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
    pPositions[i] = (Math.random() - 0.5) * 36;
  }

  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

  const pMat = new THREE.PointsMaterial({
    color: 0xFF6B00,
    size: 0.07,
    transparent: true,
    opacity: 0.55,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  /* ── Floating wireframe cubes ── */
  const cubeData = [];
  const edgeMat = (opacity) => new THREE.LineBasicMaterial({
    color: 0xFF6B00,
    transparent: true,
    opacity,
  });

  const cubeConfigs = [
    { size: 1.8, pos: [3, 1, -2],    speed: 0.38, amp: 0.5,  opacity: 0.7 },
    { size: 1.1, pos: [-5, -0.5, 1], speed: 0.55, amp: 0.35, opacity: 0.45 },
    { size: 2.4, pos: [6, -1, -5],   speed: 0.22, amp: 0.7,  opacity: 0.3 },
    { size: 0.8, pos: [-3, 2, -3],   speed: 0.62, amp: 0.4,  opacity: 0.55 },
    { size: 1.5, pos: [0, -2, -6],   speed: 0.32, amp: 0.6,  opacity: 0.2 },
    { size: 0.6, pos: [8, 2, -1],    speed: 0.7,  amp: 0.3,  opacity: 0.4 },
  ];

  cubeConfigs.forEach(({ size, pos, speed, amp, opacity }) => {
    const geo = new THREE.BoxGeometry(size, size, size);
    const edges = new THREE.EdgesGeometry(geo);
    const line = new THREE.LineSegments(edges, edgeMat(opacity));
    line.position.set(...pos);
    line.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    scene.add(line);
    cubeData.push({ mesh: line, speed, amp, baseY: pos[1], t: Math.random() * 100 });
    geo.dispose();
    edges.dispose();
  });

  /* ── Mouse parallax ── */
  let mouseX = 0, mouseY = 0;
  let targetX = 0, targetY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* ── Render loop ── */
  let rafId;
  let clock = 0;

  function tick() {
    rafId = requestAnimationFrame(tick);
    clock += 0.012;

    // Lerp mouse parallax
    targetX += (mouseX - targetX) * 0.04;
    targetY += (mouseY - targetY) * 0.04;

    camera.position.x = targetX * 1.4;
    camera.position.y = 2 - targetY * 0.8;
    camera.lookAt(0, 0, 0);

    // Animate cubes — float and rotate
    cubeData.forEach(({ mesh, speed, amp, baseY, t }, i) => {
      const time = clock * speed + t;
      mesh.position.y = baseY + Math.sin(time) * amp;
      mesh.rotation.y += 0.004 * speed;
      mesh.rotation.x += 0.002 * speed;
      cubeData[i].t = t; // unchanged
    });

    // Slow rotation of particle cloud
    particles.rotation.y = clock * 0.05;
    particles.rotation.x = clock * 0.02;

    renderer.render(scene, camera);
  }

  tick();

  /* ── Resize ── */
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 150);
  });

  /* ── Cleanup when hero is no longer visible ── */
  const heroSection = $('#hero');
  if (heroSection && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) {
        cancelAnimationFrame(rafId);
      } else {
        tick();
      }
    }, { threshold: 0 });
    io.observe(heroSection);
  }
})();


/* ═══════════════════════════════════════════════
   2. GSAP — HERO ENTRANCE ANIMATION
═══════════════════════════════════════════════ */
(function initHeroGSAP() {
  if (typeof gsap === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  // Tag pill
  tl.to('.hero-tag', { opacity: 1, y: 0, duration: 0.7, delay: 0.3 });

  // Headline lines sweep in
  tl.to('.headline-line', {
    clipPath: 'inset(0 0% 0 0)',
    duration: 0.8,
    stagger: 0.12,
    ease: 'power4.out',
  }, '-=0.3');

  // Subheading + actions + stats fade
  tl.to('.hero-subheading', { opacity: 1, y: 0, duration: 0.6 }, '-=0.3');
  tl.to('.hero-actions',    { opacity: 1, y: 0, duration: 0.5 }, '-=0.3');
  tl.to('.hero-stats',      { opacity: 1, y: 0, duration: 0.5 }, '-=0.2');
})();


/* ═══════════════════════════════════════════════
   3. GSAP — SCROLLTRIGGER SECTION REVEALS
   (backs up the CSS IntersectionObserver approach
    for elements that need finer timing)
═══════════════════════════════════════════════ */
(function initScrollReveals() {
  if (typeof gsap === 'undefined' || !ScrollTrigger) return;

  // Pillar cards with stagger
  ScrollTrigger.batch('.pillar-card', {
    onEnter: batch => gsap.to(batch, {
      opacity: 1, y: 0, duration: 0.65,
      stagger: 0.12, ease: 'power3.out',
    }),
    start: 'top 88%',
  });

  // Community cards with stagger
  ScrollTrigger.batch('.community-card', {
    onEnter: batch => gsap.to(batch, {
      opacity: 1, y: 0, duration: 0.6,
      stagger: 0.1, ease: 'power3.out',
    }),
    start: 'top 88%',
  });

  // Pipeline steps
  ScrollTrigger.batch('.pipeline-step', {
    onEnter: batch => gsap.to(batch, {
      opacity: 1, y: 0, duration: 0.6,
      stagger: 0.14, ease: 'power3.out',
    }),
    start: 'top 88%',
  });

  // Generic reveal classes
  $$('.reveal-up').forEach(el => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      onEnter: () => el.classList.add('in-view'),
    });
  });

  $$('.reveal-left, .reveal-right').forEach(el => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      onEnter: () => el.classList.add('in-view'),
    });
  });
})();


/* ═══════════════════════════════════════════════
   4. STAT COUNTER — Anime.js
═══════════════════════════════════════════════ */
(function initCounters() {
  if (typeof anime === 'undefined') return;

  const stats = $$('.stat-number[data-target]');
  if (!stats.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10);
      observer.unobserve(el);

      const obj = { count: 0 };
      anime({
        targets: obj,
        count: target,
        round: 1,
        duration: 2000,
        easing: 'easeOutExpo',
        update: () => {
          el.textContent = obj.count.toLocaleString();
        },
      });
    });
  }, { threshold: 0.5 });

  stats.forEach(el => observer.observe(el));
})();


/* ═══════════════════════════════════════════════
   5. PILLAR CARD — Anime.js hover icon spin
═══════════════════════════════════════════════ */
(function initCardAnimations() {
  if (typeof anime === 'undefined') return;

  $$('.pillar-card').forEach(card => {
    const icon = card.querySelector('.pillar-icon svg');
    if (!icon) return;

    card.addEventListener('mouseenter', () => {
      anime({
        targets: icon,
        rotate: '1turn',
        duration: 600,
        easing: 'easeInOutQuad',
      });
    });

    card.addEventListener('mouseleave', () => {
      anime({ targets: icon, rotate: 0, duration: 0 });
    });
  });
})();


/* ═══════════════════════════════════════════════
   6. PIPELINE STEP — Anime.js hover
═══════════════════════════════════════════════ */
(function initPipelineHover() {
  if (typeof anime === 'undefined') return;

  $$('.pipeline-step').forEach(step => {
    const icon = step.querySelector('.step-icon');
    if (!icon) return;

    step.addEventListener('mouseenter', () => {
      anime({
        targets: icon,
        scale: [1, 1.08],
        duration: 300,
        easing: 'easeOutBack',
      });
    });

    step.addEventListener('mouseleave', () => {
      anime({
        targets: icon,
        scale: 1,
        duration: 300,
        easing: 'easeOutQuad',
      });
    });
  });
})();


/* ═══════════════════════════════════════════════
   7. STICKY NAV — scroll class + active links
═══════════════════════════════════════════════ */
(function initNav() {
  const header    = $('#site-header');
  const navLinks  = $$('.nav-link[href^="#"]');
  const sections  = $$('section[id], header[id]');
  const hamburger = $('#hamburger-btn');
  const navList   = $('#nav-links');

  if (!header) return;

  /* Scrolled class */
  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 30);
    updateActiveLink();
  }

  /* Active section highlighting */
  function updateActiveLink() {
    let current = '';
    sections.forEach(sec => {
      const top = sec.offsetTop - 120;
      if (window.scrollY >= top) current = sec.id;
    });

    navLinks.forEach(link => {
      const href = link.getAttribute('href').slice(1);
      link.classList.toggle('active', href === current);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Hamburger toggle */
  if (hamburger && navList) {
    hamburger.addEventListener('click', () => {
      const isOpen = navList.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link click
    navList.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navList.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!navList.contains(e.target) && !hamburger.contains(e.target)) {
        navList.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }
})();


/* ═══════════════════════════════════════════════
   8. SMOOTH SCROLL for nav links
═══════════════════════════════════════════════ */
(function initSmoothScroll() {
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function (e) {
      const target = $(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();

      const navH = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--nav-height'), 10) || 72;

      const top = target.getBoundingClientRect().top + window.scrollY - navH;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();


/* ═══════════════════════════════════════════════
   9. CONTACT FORM — validation + Anime.js feedback
═══════════════════════════════════════════════ */
(function initContactForm() {
  const form    = $('#contact-form');
  const success = $('#form-success');
  const submit  = $('#form-submit');
  if (!form) return;

  /* Shake animation for invalid fields */
  function shake(el) {
    if (typeof anime !== 'undefined') {
      anime({
        targets: el,
        translateX: [0, -8, 8, -6, 6, -4, 4, 0],
        duration: 380,
        easing: 'linear',
      });
    }
    el.classList.add('error');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const nameEl  = $('#cf-name');
    const emailEl = $('#cf-email');
    let valid = true;

    $$('.form-input').forEach(i => i.classList.remove('error'));

    if (!nameEl.value.trim()) {
      shake(nameEl);
      valid = false;
    }

    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(emailEl.value.trim())) {
      shake(emailEl);
      valid = false;
    }

    if (!valid) return;

    // Simulate submit
    submit.disabled = true;
    submit.querySelector('.btn-text').textContent = 'Sending…';

    setTimeout(() => {
      form.style.display = 'none';
      success.classList.add('visible');

      if (typeof anime !== 'undefined') {
        anime({
          targets: success,
          opacity: [0, 1],
          translateY: [12, 0],
          duration: 500,
          easing: 'easeOutQuad',
        });
      }
    }, 900);
  });

  /* Remove error class on input */
  $$('.form-input').forEach(inp => {
    inp.addEventListener('input', () => inp.classList.remove('error'));
  });
})();


/* ═══════════════════════════════════════════════
   10. FLOATING LABELS — Anime.js stagger pulse
═══════════════════════════════════════════════ */
(function initFloatingLabels() {
  if (typeof anime === 'undefined') return;

  const labels = $$('.floating-label');
  if (!labels.length) return;

  anime({
    targets: labels,
    translateY: [-4, 4],
    direction: 'alternate',
    loop: true,
    easing: 'easeInOutSine',
    duration: 2400,
    delay: anime.stagger(700),
  });
})();


/* ═══════════════════════════════════════════════
   11. GSAP — nav logo entrance
═══════════════════════════════════════════════ */
(function initLogoEntrance() {
  if (typeof gsap === 'undefined') return;

  gsap.from('.nav-logo', {
    opacity: 0,
    x: -20,
    duration: 0.7,
    delay: 0.1,
    ease: 'power3.out',
  });

  gsap.from('.nav-links li', {
    opacity: 0,
    y: -10,
    duration: 0.5,
    delay: 0.3,
    stagger: 0.08,
    ease: 'power2.out',
  });
})();


/* ═══════════════════════════════════════════════
   12. BADGE click ripple — Anime.js
═══════════════════════════════════════════════ */
(function initBadgeRipple() {
  if (typeof anime === 'undefined') return;

  $$('.badge, .fw-badge, .cc-tag').forEach(badge => {
    badge.addEventListener('click', () => {
      anime({
        targets: badge,
        scale: [1, 0.93, 1],
        duration: 260,
        easing: 'easeOutQuad',
      });
    });
  });
})();


/* ═══════════════════════════════════════════════
   13. About cube interaction — speed up on hover
═══════════════════════════════════════════════ */
(function initCubeHover() {
  const cubeContainer = $('#about-cube');
  if (!cubeContainer) return;

  cubeContainer.addEventListener('mouseenter', () => {
    cubeContainer.style.animationDuration = '4s';
  });

  cubeContainer.addEventListener('mouseleave', () => {
    cubeContainer.style.animationDuration = '14s';
  });
})();


/* ═══════════════════════════════════════════════
   14. Intersection Observer fallback for reveals
   (for older browsers or when GSAP isn't ready)
═══════════════════════════════════════════════ */
(function initFallbackObserver() {
  if (typeof IntersectionObserver === 'undefined') {
    // Show everything immediately if IO not supported
    $$('.reveal-up, .reveal-left, .reveal-right, .pipeline-step, .community-card, .pillar-card')
      .forEach(el => el.style.cssText = 'opacity:1;transform:none');
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  // Only observe elements not already handled by GSAP ScrollTrigger
  if (typeof ScrollTrigger === 'undefined') {
    $$('.reveal-up, .reveal-left, .reveal-right, .pipeline-step, .community-card, .pillar-card')
      .forEach(el => io.observe(el));
  } else {
    // Cover section labels that GSAP doesn't target
    $$('.section-label').forEach(el => io.observe(el));
  }
})();
