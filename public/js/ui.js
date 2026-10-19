const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------------------------------------------------------------
 * Smooth scroll (Lenis) driven by the GSAP ticker so the 3D scene,
 * ScrollTrigger and scrolling all update in the same frame.
 * ------------------------------------------------------------- */
let lenis = null;
if (!reduceMotion && Lenis) {
  lenis = new Lenis({ duration: 1.25, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop(); // released when the loader finishes
}
window.__lenis = lenis;

document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.8 });
    else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  });
});

/* ---------------------------------------------------------------
 * Nav: glass background after scrolling + active section link
 * ------------------------------------------------------------- */
const nav = document.querySelector('.nav');
ScrollTrigger.create({
  start: 80,
  end: 'max',
  onToggle: (self) => nav.classList.toggle('scrolled', self.isActive),
});

const navLinks = [...document.querySelectorAll('.nav nav a')];
navLinks.forEach((link) => {
  const section = document.querySelector(link.getAttribute('href'));
  if (!section) return;
  ScrollTrigger.create({
    trigger: section,
    start: 'top 55%',
    end: 'bottom 55%',
    onToggle: (self) => self.isActive && navLinks.forEach((l) => l.classList.toggle('active', l === link)),
  });
});

ScrollTrigger.create({
  start: 0,
  end: 'max',
  onUpdate: (self) => gsap.set('#progress i', { scaleX: self.progress }),
});

/* ---------------------------------------------------------------
 * Text reveal: split headings into masked words
 * ------------------------------------------------------------- */
function splitWords(el) {
  const out = [];
  [...el.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(' '));
        const mask = document.createElement('span');
        mask.className = 'w';
        const inner = document.createElement('span');
        inner.className = 'wi';
        inner.textContent = part;
        mask.appendChild(inner);
        frag.appendChild(mask);
        out.push(inner);
      });
      node.replaceWith(frag);
    } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'BR') {
      // Keep styled spans (gold gradient etc.) intact as one word
      const mask = document.createElement('span');
      mask.className = 'w';
      node.replaceWith(mask);
      node.classList.add('wi');
      mask.appendChild(node);
      out.push(node);
    }
  });
  return out;
}

function revealBlock(container, { delay = 0, trigger = true } = {}) {
  const tl = gsap.timeline({
    delay,
    paused: !trigger,
    scrollTrigger: trigger ? { trigger: container, start: 'top 80%' } : undefined,
    defaults: { ease: 'expo.out' },
  });

  [...container.children].forEach((child, i) => {
    const at = i * 0.09;
    if (child.matches('h2, .km-title')) {
      const words = splitWords(child);
      tl.from(words, { yPercent: 115, rotate: 4, duration: 1.2, stagger: 0.06 }, at);
    } else if (child.matches('.cards, .ribbons, .steps, .checks, .stats')) {
      tl.from(child.children, { y: 40, autoAlpha: 0, filter: 'blur(8px)', duration: 1.1, stagger: 0.1 }, at);
    } else {
      tl.from(child, { y: 30, autoAlpha: 0, filter: 'blur(8px)', duration: 1.1 }, at);
    }
  });
  return tl;
}

// Hero plays when the 3D scene is ready; every other block on scroll.
const heroCopy = document.querySelector('#hero .copy');
const heroTl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
heroTl
  .from('#hero .eyebrow', { y: 20, autoAlpha: 0, duration: 1 })
  .from('#hero .title', { clipPath: 'inset(0 0 100% 0)', y: 60, duration: 1.6 }, 0.1)
  .from('#hero .km.big', { y: 30, autoAlpha: 0, filter: 'blur(10px)', duration: 1.2 }, 0.45)
  .from('#hero .checks li', { x: -30, autoAlpha: 0, duration: 1, stagger: 0.12 }, 0.6)
  .from('#hero .btn-wrap', { y: 20, autoAlpha: 0, duration: 1 }, 0.8)
  .from('.scroll-hint', { autoAlpha: 0, duration: 1 }, 1.1)
  .from('.nav', { y: -30, autoAlpha: 0, duration: 1 }, 0.3);

document.querySelectorAll('.copy, .chat-wrap').forEach((el) => {
  if (el !== heroCopy) revealBlock(el);
});

window.addEventListener('scene:ready', () => {
  heroTl.play();
  lenis?.start();
});

/* ---------------------------------------------------------------
 * Marquee: speeds up and skews with scroll velocity
 * ------------------------------------------------------------- */
const track = document.querySelector('.marquee-track');
if (track) {
  track.innerHTML += track.innerHTML; // duplicate for a seamless loop
  const loop = gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
  const skewTo = gsap.quickTo(track, 'skewX', { duration: 0.5, ease: 'power3' });
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const v = self.getVelocity();
      loop.timeScale(1 + Math.min(Math.abs(v) / 400, 4));
      skewTo(gsap.utils.clamp(-8, 8, v / -250));
    },
  });
  ScrollTrigger.addEventListener('scrollEnd', () => {
    gsap.to(loop, { timeScale: 1, duration: 0.8 });
    skewTo(0);
  });
}

/* ---------------------------------------------------------------
 * Counters
 * ------------------------------------------------------------- */
document.querySelectorAll('[data-count]').forEach((el) => {
  const end = Number(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const obj = { v: 0 };
  ScrollTrigger.create({
    trigger: el,
    start: 'top 85%',
    once: true,
    onEnter: () =>
      gsap.to(obj, {
        v: end,
        duration: 2,
        ease: 'power3.out',
        onUpdate: () => (el.textContent = Math.round(obj.v) + suffix),
      }),
  });
});

/* ---------------------------------------------------------------
 * Brand owner photo: scroll parallax + 3D pointer tilt
 * ------------------------------------------------------------- */
gsap.fromTo(
  '.photo-frame img',
  { yPercent: -8, scale: 1.18 },
  {
    yPercent: 8,
    scale: 1.08,
    ease: 'none',
    scrollTrigger: { trigger: '#owner', start: 'top bottom', end: 'bottom top', scrub: true },
  },
);
gsap.from('.photo-tilt', {
  clipPath: 'inset(100% 0 0 0 round 28px)',
  duration: 1.6,
  ease: 'expo.inOut',
  scrollTrigger: { trigger: '.owner-photo', start: 'top 75%' },
});
gsap.from('.badge', {
  scale: 0,
  autoAlpha: 0,
  duration: 0.9,
  stagger: 0.15,
  ease: 'back.out(2)',
  delay: 0.9,
  scrollTrigger: { trigger: '.owner-photo', start: 'top 75%' },
});
gsap.to('.badge-1', { y: -10, duration: 2.4, repeat: -1, yoyo: true, ease: 'sine.inOut' });
gsap.to('.badge-2', { y: 10, duration: 2.8, repeat: -1, yoyo: true, ease: 'sine.inOut' });

function attachTilt(el, max = 10) {
  const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' });
  const ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' });
  gsap.set(el, { transformPerspective: 900 });
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry(px * max * 2);
    rx(-py * max * 2);
    el.style.setProperty('--mx', `${(px + 0.5) * 100}%`);
    el.style.setProperty('--my', `${(py + 0.5) * 100}%`);
  });
  el.addEventListener('pointerleave', () => {
    rx(0);
    ry(0);
  });
}

if (finePointer && !reduceMotion) {
  attachTilt(document.querySelector('.photo-tilt'), 8);
  document.querySelectorAll('.tilt').forEach((c) => attachTilt(c, 6));

  /* Magnetic buttons */
  document.querySelectorAll('.magnetic').forEach((btn) => {
    const x = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3' });
    const y = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3' });
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      x((e.clientX - r.left - r.width / 2) * 0.35);
      y((e.clientY - r.top - r.height / 2) * 0.35);
    });
    btn.addEventListener('pointerleave', () => {
      x(0);
      y(0);
    });
  });

  /* Custom cursor */
  window.addEventListener('pointermove', () => document.body.classList.add('has-cursor'), { once: true });
  const dot = document.querySelector('.cursor');
  const ring = document.querySelector('.cursor-ring');
  const dx = gsap.quickTo(dot, 'x', { duration: 0.1 });
  const dy = gsap.quickTo(dot, 'y', { duration: 0.1 });
  const rxq = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
  const ryq = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
  window.addEventListener('pointermove', (e) => {
    dx(e.clientX);
    dy(e.clientY);
    rxq(e.clientX);
    ryq(e.clientY);
  });
  document.querySelectorAll('a, button, input, .tilt, .photo-tilt').forEach((el) => {
    el.addEventListener('pointerenter', () => ring.classList.add('hover'));
    el.addEventListener('pointerleave', () => ring.classList.remove('hover'));
  });
}

/* ---------------------------------------------------------------
 * Auto-play tour: glides section to section, holds on each so the
 * 3D choreography and text reveals play out. Any manual scroll stops it.
 * ------------------------------------------------------------- */
const TOUR = [
  { id: 'hero', label: 'Miss Sunflower' },
  { id: 'benefits', label: 'Benefits' },
  { id: 'protect', label: 'SPF50 PA++++' },
  { id: 'texture', label: 'Texture' },
  { id: 'how', label: 'How to use' },
  { id: 'owner', label: 'ម្ចាស់ Brand' },
  { id: 'ai', label: 'AI Advisor' },
];
const GLIDE = 3.2; // seconds between sections
const HOLD = 3.8; // seconds resting on each section

const apBtn = document.getElementById('autoplay');
const apFill = apBtn.querySelector('.ap-fill');
const apTitle = apBtn.querySelector('.ap-label b');
const apStep = apBtn.querySelector('.ap-step');
const RING = 2 * Math.PI * 27;
const apIdle = { title: apTitle.textContent, step: apStep.textContent };

let playing = false;
let tourIndex = 0;
let holdTween = null;
let glideTimer = null;

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function currentSectionIndex() {
  const mid = window.innerHeight * 0.5;
  let best = 0;
  TOUR.forEach((s, i) => {
    if (document.getElementById(s.id).getBoundingClientRect().top <= mid) best = i;
  });
  return best;
}

function setLabel(i) {
  apTitle.textContent = 'Pause';
  apStep.textContent = `${i + 1}/${TOUR.length} · ${TOUR[i].label}`;
}

function glideTo(i) {
  if (!playing) return;
  tourIndex = i;
  setLabel(i);
  gsap.to(apFill, { strokeDashoffset: RING, duration: 0.4, ease: 'power2.out' });
  const target = document.getElementById(TOUR[i].id);
  const onArrive = () => playing && hold();
  if (lenis) {
    lenis.scrollTo(target, { duration: GLIDE, easing: easeInOutCubic, lock: true, force: true, onComplete: onArrive });
  } else {
    target.scrollIntoView({ behavior: 'smooth' });
    glideTimer = setTimeout(onArrive, 1200);
  }
}

function hold() {
  // The ring fills while resting on a section, then we move on
  holdTween = gsap.fromTo(
    apFill,
    { strokeDashoffset: RING },
    {
      strokeDashoffset: 0,
      duration: HOLD,
      ease: 'none',
      onComplete: () => {
        if (tourIndex < TOUR.length - 1) glideTo(tourIndex + 1);
        else stopTour(true);
      },
    },
  );
}

function startTour() {
  playing = true;
  apBtn.classList.add('playing');
  apBtn.setAttribute('aria-pressed', 'true');
  lenis?.start();
  const here = currentSectionIndex();
  // At the end already? Restart from the top.
  glideTo(here >= TOUR.length - 1 ? 0 : here + 1);
}

function stopTour(finished = false) {
  playing = false;
  holdTween?.kill();
  clearTimeout(glideTimer);
  if (lenis) lenis.scrollTo(window.scrollY, { immediate: true, force: true }); // cancel an in-flight glide
  apBtn.classList.remove('playing');
  apBtn.setAttribute('aria-pressed', 'false');
  apTitle.textContent = finished ? 'Replay' : apIdle.title;
  apStep.textContent = apIdle.step;
  gsap.to(apFill, { strokeDashoffset: RING, duration: 0.5, ease: 'power2.out' });
}

apBtn.addEventListener('click', () => (playing ? stopTour() : startTour()));

// Taking over the scroll yourself stops the tour
const interrupt = () => playing && stopTour();
window.addEventListener('wheel', interrupt, { passive: true });
window.addEventListener('touchstart', (e) => !apBtn.contains(e.target) && interrupt(), { passive: true });
window.addEventListener('keydown', (e) => {
  if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Escape'].includes(e.key)) interrupt();
});
document.querySelectorAll('.nav a, #chat-input, .chips button').forEach((el) => el.addEventListener('pointerdown', interrupt));

window.addEventListener('scene:ready', () =>
  gsap.from(apBtn, { y: 40, autoAlpha: 0, scale: 0.8, duration: 1.2, ease: 'expo.out', delay: 1.2 }),
);
