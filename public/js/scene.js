import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const { gsap, ScrollTrigger } = window;
gsap.registerPlugin(ScrollTrigger);

/* ---------------------------------------------------------------
 * Renderer / camera
 * ------------------------------------------------------------- */
const canvas = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const CAM_Z = 14;
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, CAM_Z);

/* Lights: warm key + golden rims, like the poster */
scene.add(new THREE.AmbientLight(0xfff1d6, 0.35));
const key = new THREE.DirectionalLight(0xfff4e0, 2.2);
key.position.set(4, 5, 8);
scene.add(key);
const rimL = new THREE.PointLight(0xffb526, 60, 30);
rimL.position.set(-5, 2, -3);
scene.add(rimL);
const rimR = new THREE.PointLight(0xffd36b, 45, 30);
rimR.position.set(5, -2, -2);
scene.add(rimR);

/* ---------------------------------------------------------------
 * Label texture (painted on canvas to match the product)
 * ------------------------------------------------------------- */
const LABEL_W = 2048;
const LABEL_H = 1400;
const FRONT = LABEL_W / 2; // u = 0.5 faces the camera

function goldGradient(ctx, y0, y1) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, '#fff3c4');
  g.addColorStop(0.35, '#e9c46a');
  g.addColorStop(0.6, '#a87a22');
  g.addColorStop(1, '#f6dd8f');
  return g;
}

function drawSunflower(ctx, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  for (let layer = 0; layer < 2; layer++) {
    const n = 22;
    const len = r * (layer ? 0.9 : 1);
    const w = r * 0.18;
    for (let i = 0; i < n; i++) {
      ctx.save();
      ctx.rotate((i / n) * Math.PI * 2 + layer * (Math.PI / n));
      const g = ctx.createLinearGradient(0, 0, 0, -len);
      g.addColorStop(0, layer ? '#d98e00' : '#b87400');
      g.addColorStop(0.5, '#ffc21a');
      g.addColorStop(1, '#ffe27a');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, -len * 0.62, w, len * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  const cr = r * 0.42;
  const cg = ctx.createRadialGradient(0, 0, cr * 0.1, 0, 0, cr);
  cg.addColorStop(0, '#5a3510');
  cg.addColorStop(0.7, '#3a210a');
  cg.addColorStop(1, '#1a0f04');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(0, 0, cr, 0, Math.PI * 2);
  ctx.fill();
  // Seeds on a golden-angle spiral
  for (let i = 0; i < 260; i++) {
    const a = i * 2.39996;
    const d = Math.sqrt(i / 260) * cr * 0.95;
    ctx.fillStyle = i % 3 ? 'rgba(125,80,28,.85)' : 'rgba(18,9,2,.9)';
    ctx.beginPath();
    ctx.arc(Math.cos(a) * d, Math.sin(a) * d, cr * 0.035, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(' ');
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y);
      line = w;
      y += lineH;
    } else line = test;
  }
  ctx.fillText(line, x, y);
  return y + lineH;
}

function drawFront(ctx) {
  const cx = FRONT;

  // Sunflowers (behind the gold label box)
  drawSunflower(ctx, cx - 250, 700, 175);
  drawSunflower(ctx, cx + 255, 640, 120);
  drawSunflower(ctx, cx - 230, 1110, 130);
  drawSunflower(ctx, cx + 230, 1200, 118);

  // "Miss"
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '700 230px Cinzel, Georgia, serif';
  ctx.fillStyle = goldGradient(ctx, 160, 360);
  ctx.shadowColor = 'rgba(0,0,0,.6)';
  ctx.shadowBlur = 12;
  ctx.fillText('Miss', cx, 350);
  ctx.shadowBlur = 0;
  // little sunflower dots on the i's, like the logo
  drawSunflower(ctx, cx - 4, 140, 20);

  // "Sunflower"
  ctx.font = '110px "Great Vibes", cursive';
  ctx.fillStyle = '#f4ecd8';
  ctx.fillText('Sunflower', cx + 60, 450);

  // UV badge
  ctx.beginPath();
  ctx.arc(cx + 10, 545, 46, 0, Math.PI * 2);
  ctx.lineWidth = 6;
  ctx.strokeStyle = goldGradient(ctx, 500, 590);
  ctx.stroke();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + 10 + Math.cos(a) * 54, 545 + Math.sin(a) * 54);
    ctx.lineTo(cx + 10 + Math.cos(a) * 66, 545 + Math.sin(a) * 66);
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.font = '700 38px Cinzel, serif';
  ctx.fillStyle = '#e9c46a';
  ctx.fillText('UV', cx + 10, 559);

  // Gold info box
  const bx = cx - 195;
  const by = 640;
  const bw = 400;
  const bh = 480;
  const boxGrad = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
  boxGrad.addColorStop(0, '#fbe08a');
  boxGrad.addColorStop(0.5, '#e8b93e');
  boxGrad.addColorStop(1, '#f7d778');
  ctx.fillStyle = boxGrad;
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = '#8a5f12';
  ctx.lineWidth = 3;
  ctx.strokeRect(bx + 10, by + 10, bw - 20, bh - 20);

  ctx.fillStyle = '#2a1a04';
  ctx.textAlign = 'left';
  const tx = bx + 30;
  ctx.font = '600 32px Cinzel, Georgia, serif';
  ctx.fillText('PERFECT BB BASE', tx, by + 64);
  ctx.fillText('BEAUTY BOOSTER', tx, by + 104);
  ctx.fillRect(tx, by + 124, bw - 60, 3);
  ctx.font = '600 34px Georgia, serif';
  ctx.fillText('SPF50 PA++++', tx, by + 176);
  ctx.font = 'italic 700 36px Georgia, serif';
  ['Whitening', 'Uv Protecting', 'Wrinkle', 'Improvement'].forEach((t, i) => {
    ctx.fillText(t, tx, by + 236 + i * 46);
  });
  ctx.font = '600 20px Georgia, serif';
  ctx.fillText('MADE IN THAILAND', tx, by + 432);
  ctx.textAlign = 'right';
  ctx.font = '22px Georgia, serif';
  ctx.fillText('Net 70ml', bx + bw - 28, by + 462);
}

function drawBack(ctx, cx) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '700 70px Cinzel, Georgia, serif';
  ctx.fillStyle = goldGradient(ctx, 200, 270);
  ctx.fillText('Miss', cx, 260);
  ctx.font = '54px "Great Vibes", cursive';
  ctx.fillStyle = '#f4ecd8';
  ctx.fillText('Sunflower', cx + 20, 320);

  ctx.textAlign = 'left';
  const x = cx - 270;
  let y = 420;
  ctx.fillStyle = '#e9c46a';
  ctx.font = '600 26px Cinzel, serif';
  ctx.fillText('PERFECT BB BASE BEAUTY BOOSTER', x, y);
  y += 44;
  ctx.fillStyle = '#d9c9a0';
  ctx.font = '22px Inter, sans-serif';
  y = wrapText(ctx, 'SPF50 PA++++ · Whitening · UV Protecting · Wrinkle Improvement', x, y, 540, 32) + 14;
  ctx.fillStyle = '#e9c46a';
  ctx.font = '600 22px Inter, sans-serif';
  ctx.fillText('HOW TO USE', x, y);
  y += 34;
  ctx.fillStyle = '#d9c9a0';
  ctx.font = '21px Inter, sans-serif';
  y = wrapText(ctx, 'After skincare, apply an appropriate amount evenly over face and neck. Reapply when exposed to strong sunlight.', x, y, 540, 31) + 14;
  ctx.fillStyle = '#e9c46a';
  ctx.font = '600 22px Inter, sans-serif';
  ctx.fillText('CAUTION', x, y);
  y += 34;
  ctx.fillStyle = '#d9c9a0';
  ctx.font = '21px Inter, sans-serif';
  y = wrapText(ctx, 'For external use only. Stop use if irritation occurs. Keep out of reach of children.', x, y, 540, 31) + 18;
  ctx.font = '600 30px "Noto Sans Khmer", sans-serif';
  ctx.fillStyle = '#f6dd8f';
  ctx.fillText('ជួយការពារពីកម្តៅថ្ងៃ', x, y + 10);

  // Decorative barcode
  const bx = cx - 120;
  const byy = 1120;
  ctx.fillStyle = '#f4ecd8';
  ctx.fillRect(bx - 16, byy - 16, 272, 150);
  ctx.fillStyle = '#111';
  let px = bx;
  let seed = 7;
  while (px < bx + 240) {
    seed = (seed * 9301 + 49297) % 233280;
    const w = 2 + (seed % 5);
    ctx.fillRect(px, byy, w, 100);
    px += w + 2 + (seed % 3);
  }
  ctx.font = '18px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MADE IN THAILAND · 70ml', cx, byy + 124);
  ctx.restore();
}

function makeLabelTexture() {
  const c = document.createElement('canvas');
  c.width = LABEL_W;
  c.height = LABEL_H;
  const ctx = c.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, LABEL_W, 0);
  bg.addColorStop(0, '#0b0906');
  bg.addColorStop(0.5, '#141009');
  bg.addColorStop(1, '#0b0906');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, LABEL_W, LABEL_H);

  // Side sunflowers that wrap around the tube
  drawSunflower(ctx, 470, 330, 110);
  drawSunflower(ctx, 520, 980, 150);
  drawSunflower(ctx, 1590, 900, 140);
  drawSunflower(ctx, 1560, 260, 90);

  drawFront(ctx);
  // Back is centred on the seam (u = 0 / 1) so draw it on both edges
  drawBack(ctx, 0);
  drawBack(ctx, LABEL_W);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

function makeRadialSprite(inner, outer, size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeBubbleTexture() {
  const s = 512;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s * 0.42, s * 0.38, s * 0.05, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,240,190,.55)');
  g.addColorStop(0.7, 'rgba(200,150,40,.35)');
  g.addColorStop(0.93, 'rgba(255,215,110,.9)');
  g.addColorStop(1, 'rgba(255,215,110,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
  ctx.fill();
  drawSunflower(ctx, s / 2, s / 2, s * 0.3);
  // specular highlight
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.beginPath();
  ctx.ellipse(s * 0.33, s * 0.25, s * 0.12, s * 0.05, -0.6, 0, Math.PI * 2);
  ctx.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------------------------------------------------------------
 * Product model
 * ------------------------------------------------------------- */
const TUBE_H = 4.2;

function buildTube(labelTex) {
  const group = new THREE.Group();

  // Body: cylinder that flattens toward the crimp seal
  const geo = new THREE.CylinderGeometry(1, 1, TUBE_H, 160, 120, true, Math.PI);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const t = (y + TUBE_H / 2) / TUBE_H; // 0 = cap end, 1 = seal end
    const flat = Math.pow(t, 1.8);
    let shoulder = 1;
    if (t < 0.07) shoulder = 0.84 + 0.16 * Math.sin((t / 0.07) * (Math.PI / 2));
    pos.setXYZ(i, x * (1 + 0.48 * flat) * shoulder, y, z * (1 - 0.94 * flat) * shoulder);
  }
  geo.computeVertexNormals();

  const body = new THREE.Mesh(
    geo,
    new THREE.MeshPhysicalMaterial({
      map: labelTex,
      roughness: 0.38,
      metalness: 0.05,
      clearcoat: 0.8,
      clearcoatRoughness: 0.18,
    }),
  );
  group.add(body);

  // Crimp seal
  const sealTex = (() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 32;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#0d0b08';
    ctx.fillRect(0, 0, 512, 32);
    ctx.fillStyle = '#2a2418';
    for (let x = 0; x < 512; x += 6) ctx.fillRect(x, 0, 2, 32);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const seal = new THREE.Mesh(
    new THREE.BoxGeometry(2.98, 0.32, 0.14),
    new THREE.MeshStandardMaterial({ map: sealTex, roughness: 0.55, metalness: 0.2 }),
  );
  seal.position.y = TUBE_H / 2 + 0.12;
  group.add(seal);

  // Gold cap
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf5c65a,
    metalness: 0.85,
    roughness: 0.28,
    emissive: 0x5a3a08,
    envMapIntensity: 2.2,
  });
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.88, 1.15, 96), goldMat);
  cap.position.y = -TUBE_H / 2 - 0.55;
  group.add(cap);

  const capBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.875, 0.875, 0.08, 96),
    new THREE.MeshStandardMaterial({ color: 0x7a5410, metalness: 1, roughness: 0.35 }),
  );
  capBand.position.y = -TUBE_H / 2 - 0.02;
  group.add(capBand);

  const capBottom = new THREE.Mesh(
    new THREE.TorusGeometry(0.86, 0.04, 16, 96),
    goldMat,
  );
  capBottom.rotation.x = Math.PI / 2;
  capBottom.position.y = -TUBE_H / 2 - 1.12;
  group.add(capBottom);

  group.position.y = 0.12; // visually centre (cap + body + seal)
  return group;
}

/* Scene graph:
 * rig (scroll position/scale) ─┬─ glow, shield, cream swoosh
 *                              └─ spin (scroll rotation) → intro → float → tube
 */
const rig = new THREE.Group();
const spin = new THREE.Group();
const intro = new THREE.Group();
const float = new THREE.Group();
scene.add(rig);
rig.add(spin);
spin.add(intro);
intro.add(float);

// Halo behind the tube (the glowing orb of the poster)
const glow = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: makeRadialSprite('rgba(255,205,90,.85)', 'rgba(255,170,30,0)'),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.55,
  }),
);
glow.scale.set(11, 11, 1);
glow.position.z = -3;
rig.add(glow);

// UV shield (SPF section)
const shieldMat = new THREE.MeshBasicMaterial({
  color: 0xffcf5a,
  wireframe: true,
  transparent: true,
  opacity: 0,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
const shield = new THREE.Mesh(new THREE.IcosahedronGeometry(3.6, 3), shieldMat);
rig.add(shield);

// Cream swoosh (texture section) — revealed with drawRange
const creamCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-3.2, -2.2, 0.6),
  new THREE.Vector3(-1.8, -1.0, 2.0),
  new THREE.Vector3(0.2, -0.3, 2.4),
  new THREE.Vector3(2.0, 0.6, 1.4),
  new THREE.Vector3(3.0, 2.0, -0.4),
]);
const creamGeo = new THREE.TubeGeometry(creamCurve, 200, 0.24, 24, false);
const creamTotal = creamGeo.index.count;
creamGeo.setDrawRange(0, 0);
const cream = new THREE.Mesh(
  creamGeo,
  new THREE.MeshPhysicalMaterial({ color: 0xf3dccb, roughness: 0.32, clearcoat: 1, sheen: 1, sheenColor: 0xffe7d0 }),
);
cream.scale.set(1, 1, 0.55);
rig.add(cream);

// Golden dust
const DUST = 1400;
const dustGeo = new THREE.BufferGeometry();
const dustPos = new Float32Array(DUST * 3);
for (let i = 0; i < DUST; i++) {
  dustPos[i * 3] = (Math.random() - 0.5) * 30;
  dustPos[i * 3 + 1] = (Math.random() - 0.5) * 40;
  dustPos[i * 3 + 2] = (Math.random() - 0.5) * 16 - 2;
}
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dust = new THREE.Points(
  dustGeo,
  new THREE.PointsMaterial({
    size: 0.09,
    map: makeRadialSprite('rgba(255,230,150,1)', 'rgba(255,190,60,0)', 64),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    color: 0xffd36b,
  }),
);
scene.add(dust);

// Floating sunflower bubbles
const bubbleTex = makeBubbleTexture();
const bubbles = [
  { x: -1.2, y: 3.4, z: -4, s: 1.1, sp: 2.2 },
  { x: -9.5, y: -7.5, z: -6, s: 1.3, sp: 3.4 },
  { x: 7.2, y: 2.6, z: -3, s: 1.1, sp: 2.8 },
  { x: 5.0, y: -4.8, z: -2, s: 0.9, sp: 4.0 },
  { x: 0.5, y: -9.5, z: -5, s: 1.3, sp: 5.0 },
].map((b) => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex, transparent: true, depthWrite: false }));
  sp.scale.setScalar(b.s);
  sp.position.set(b.x, b.y, b.z);
  scene.add(sp);
  return { ...b, sprite: sp, phase: Math.random() * Math.PI * 2 };
});

/* ---------------------------------------------------------------
 * Scroll choreography
 * ------------------------------------------------------------- */
// xf = fraction of half the visible width; vis = 0 hides the tube
// Everything else in world units / radians.
const TAU = Math.PI * 2;
const KEYFRAMES = {
  hero: { xf: 0.5, y: 0, s: 1, rx: 0.05, ry: -0.3, rz: -0.12, shield: 0, cream: 0, vis: 1 },
  benefits: { xf: -0.52, ry: TAU, rz: 0.16, rx: 0.08 },
  protect: { xf: 0.52, ry: TAU + 0.7, rx: 0.3, rz: -0.08, s: 1.12, shield: 1 },
  texture: { xf: -0.48, ry: TAU * 2 - 0.4, rx: 0, rz: -1.05, s: 1, shield: 0, cream: 1 },
  how: { xf: 0.52, ry: TAU * 2 + 0.3, rz: 0.12, cream: 0 },
  owner: { xf: 1.35, y: 1.2, ry: TAU * 3, rz: 0.6, s: 0.6, vis: 0 }, // fly away, the photo takes the stage
  ai: { xf: -0.7, y: 0, ry: TAU * 4 - 0.2, rz: -0.1, s: 0.78, vis: 1 },
};
const S = { ...KEYFRAMES.hero, progress: 0 };
// Smoothed copy of S actually applied to the model (extra inertia on top of scrub)
const R = { ...S };

function buildScrollChoreography() {
  // One scrubbed tween per section, running while that section scrolls into view,
  // so motion stays aligned with the content whatever each section's height is.
  let prev = { ...KEYFRAMES.hero };
  Object.entries(KEYFRAMES).forEach(([id, frame], i) => {
    const next = { ...prev, ...frame };
    if (i > 0) {
      gsap.fromTo(S, { ...prev }, {
        ...next,
        ease: 'power2.inOut',
        immediateRender: false,
        scrollTrigger: { trigger: `#${id}`, start: 'top bottom', end: 'top top', scrub: 1 },
      });
    }
    prev = next;
  });

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => (S.progress = self.progress),
  });
}

/* ---------------------------------------------------------------
 * Layout, input, loop
 * ------------------------------------------------------------- */
let halfW = 1;
let halfH = 1;
let mobile = false;

function layout() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  halfH = CAM_Z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  halfW = halfH * camera.aspect;
  mobile = w <= 820;
}
window.addEventListener('resize', layout);
layout();

const mouse = { x: 0, y: 0 };
window.addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
});

const damp = THREE.MathUtils.damp;
const easeVis = (v) => v * v * (3 - 2 * v); // smoothstep

// Driven by gsap.ticker: same frame as Lenis + ScrollTrigger, so no jitter.
function tick(time, deltaMs) {
  const t = time;
  const dt = Math.min(deltaMs / 1000, 0.05);

  // Frame-rate independent smoothing toward the scroll state
  for (const k in S) R[k] = damp(R[k], S[k], 7, dt);

  const baseScale = mobile ? 0.55 : Math.min(1, camera.aspect / 1.5 + 0.2);
  const vis = easeVis(THREE.MathUtils.clamp(R.vis, 0, 1));
  rig.position.x = mobile ? 0 : R.xf * halfW;
  rig.position.y = mobile ? halfH * 0.45 + R.y : R.y;
  rig.scale.setScalar(Math.max(R.s * baseScale * (mobile ? vis : 0.3 + 0.7 * vis), 0.0001));
  rig.visible = vis > 0.01;
  spin.rotation.set(R.rx, R.ry, R.rz);

  // Idle float + mouse parallax
  float.position.y = Math.sin(t * 1.1) * 0.12;
  float.rotation.y = damp(float.rotation.y, mouse.x * 0.35, 4, dt);
  float.rotation.x = damp(float.rotation.x, mouse.y * 0.18, 4, dt);

  shieldMat.opacity = R.shield * (0.18 + Math.sin(t * 3) * 0.04);
  shield.visible = R.shield > 0.01;
  shield.rotation.y = t * 0.15;
  shield.rotation.x = t * 0.07;
  shield.scale.setScalar(0.85 + R.shield * 0.15);

  creamGeo.setDrawRange(0, Math.floor((creamTotal * R.cream) / 3) * 3);
  cream.visible = R.cream > 0.001;

  glow.material.opacity = (0.45 + Math.sin(t * 0.8) * 0.08) * vis;

  // Camera drifts gently with the pointer for depth
  camera.position.x = damp(camera.position.x, mouse.x * 0.6, 2.5, dt);
  camera.position.y = damp(camera.position.y, -mouse.y * 0.4, 2.5, dt);
  camera.lookAt(0, 0, 0);

  dust.rotation.y = t * 0.02;
  dust.position.y = R.progress * 10;

  for (const b of bubbles) {
    b.sprite.position.y = b.y + R.progress * b.sp * 3 + Math.sin(t * 0.7 + b.phase) * 0.3;
    b.sprite.position.x = (mobile ? b.x * 0.5 : b.x) + Math.cos(t * 0.5 + b.phase) * 0.2;
    b.sprite.material.rotation = Math.sin(t * 0.4 + b.phase) * 0.3;
  }

  renderer.render(scene, camera);
}

/* ---------------------------------------------------------------
 * Boot: wait for fonts so the label paints correctly
 * ------------------------------------------------------------- */
async function boot() {
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('700 230px Cinzel'),
        document.fonts.load('600 32px Cinzel'),
        document.fonts.load('110px "Great Vibes"'),
        document.fonts.load('600 30px "Noto Sans Khmer"', 'ជួយការពារ'),
        document.fonts.load('22px Inter'),
      ]),
      new Promise((r) => setTimeout(r, 3000)),
    ]);
  } catch {
    /* fall back to system fonts */
  }

  float.add(buildTube(makeLabelTexture()));
  buildScrollChoreography();
  // Compile shaders before the reveal so the first frames don't stutter
  renderer.compile(scene, camera);
  gsap.ticker.add(tick);

  // Loader exit: logo lifts, curtain slides up, tube spins in
  const loader = document.getElementById('loader');
  gsap
    .timeline({ defaults: { ease: 'expo.inOut' } })
    .to('#loader .loader-bar', { autoAlpha: 0, duration: 0.4 })
    .to('#loader .loader-logo', { y: -40, autoAlpha: 0, duration: 0.8 }, 0.1)
    .to(loader, { yPercent: -100, duration: 1.1, onComplete: () => loader.remove() }, 0.45)
    .add(() => window.dispatchEvent(new Event('scene:ready')), 0.7)
    .from(intro.rotation, { y: -Math.PI * 1.5, duration: 2.6, ease: 'expo.out' }, 0.6)
    .from(intro.position, { y: -7, duration: 2.2, ease: 'expo.out' }, 0.6)
    .from(intro.scale, { x: 0.4, y: 0.4, z: 0.4, duration: 2.2, ease: 'expo.out' }, 0.6);
}

boot();
