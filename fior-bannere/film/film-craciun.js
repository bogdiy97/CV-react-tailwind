// Fior Christmas film – "Un fior de Crăciun" (1080×1920, 30 s), rendered with WebGL2.
// Timings match the music in render-film.cjs (100 BPM, one beat = 0.6 s).

const VIDEO_DURATION = 30;
window.VIDEO_DURATION = VIDEO_DURATION;
const BEAT = 0.6;

const ICON_IDS = ['quince-branch', 'berry', 'elderflower', 'citrus', 'sparkle', 'snowflake'];
const LOGO_WIDTH = 720;
const LOGO_RECT = { x: 540 - LOGO_WIDTH / 2, y: 860 - (LOGO_WIDTH * 347) / 635 / 2, width: LOGO_WIDTH, height: (LOGO_WIDTH * 347) / 635 };
const TREE = { top: 600, bottom: 1440, halfWidth: 330 };
const PINE = { base: [0.012, 0.035, 0.022], glow: [0.1, 0.24, 0.12], ray: [1.0, 0.85, 0.5] };
const SMALL = { family: SANS, weight: 700, size: 24, spacing: 9, color: COLORS.goldLight };
let particles;

// ---------- drawing ----------
// The Christmas tree silhouette: four tiers, a trunk. Used as the particle mask.
function drawTree() {
  const tiers = 4;
  const height = TREE.bottom - TREE.top - 70;
  ctx.fillStyle = '#fff';
  for (let i = 0; i < tiers; i += 1) {
    const top = TREE.top + (height * i) / tiers * 0.82;
    const bottom = TREE.top + (height * (i + 1)) / tiers;
    const half = TREE.halfWidth * (0.42 + (0.58 * (i + 1)) / tiers);
    ctx.beginPath();
    ctx.moveTo(540, top);
    ctx.quadraticCurveTo(540 + half * 0.45, bottom - 60, 540 + half, bottom);
    ctx.quadraticCurveTo(540, bottom + 46, 540 - half, bottom);
    ctx.quadraticCurveTo(540 - half * 0.45, bottom - 60, 540, top);
    ctx.fill();
  }
  ctx.fillRect(540 - 36, TREE.bottom - 76, 72, 76);
}

// Night landscape: sky, moon glow, two rows of firs, snowy ground.
function drawNight(local) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#050b16');
  sky.addColorStop(0.6, '#0e2238');
  sky.addColorStop(1, '#1b3a57');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  lightLeak(820, 420, 520, '190,215,255', 0.35);

  const rand = seededRandom(77);
  [[1290, '#0a1a2b', 150, 300], [1420, '#07121f', 190, 380]].forEach(([ground, color, minHeight, maxHeight], row) => {
    ctx.fillStyle = color;
    for (let x = -60; x < W + 60; x += 70 + rand() * 80) {
      const height = minHeight + rand() * (maxHeight - minHeight);
      const half = height * 0.28;
      const sway = Math.sin(local * 0.6 + x) * 2 * (row + 1);
      ctx.beginPath();
      ctx.moveTo(x + sway, ground - height);
      ctx.lineTo(x + half, ground + 40);
      ctx.lineTo(x - half, ground + 40);
      ctx.fill();
    }
    ctx.fillRect(0, ground + 30, W, H - ground);
  });
  const snow = ctx.createLinearGradient(0, 1480, 0, H);
  snow.addColorStop(0, '#c9d9ea');
  snow.addColorStop(1, '#7f97b3');
  ctx.fillStyle = snow;
  ctx.beginPath();
  ctx.moveTo(0, 1560);
  ctx.bezierCurveTo(300, 1470, 700, 1600, W, 1500);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.fill();
}

const snowPass = (source, out, local, amount = 1) => gpu.pass('snow', {
  target: out, uniforms: { time: local, aspect: ASPECT, amount, wind: 0.25 }, textures: { source },
});

// ---------- scenes ----------
function sceneNight(local, duration, out) {
  drawInto(layer, () => {
    drawNight(local);
    reveal('Afară', 540, 520, local, 0.7, { size: 170, shadow: 30 });
    reveal('ninge.', 540, 690, local, 1.1, { size: 170, italic: true, color: '#dfeaff', shadow: 30 });
  });
  gpu.pass('image', { target: T.a, textures: { source: layerTexture() } });
  snowPass(T.a, out, local, 1.1);
}

function sceneInside(local, duration, out) {
  const rise = easeOut(progress(local, 0, 1.0));
  litStage(local, out, {
    ...STAGES.gutui, lightY: 1000, floorY: 1540, caustics: easeOut(progress(local, 0.4, 1.5)),
    drawBottles: () => bottle(img.gutui, 540, 1540 + (1 - rise) * 120, 1040, { reflection: 0.3, sweep: progress(local, 1.8, 1.3) || -1 }),
    drawText: () => {
      anamorphicFlare(1000, 0.6 + 0.4 * Math.sin(local * 1.7));
      goldDust(local, 140, 9, { speed: 25, alpha: 0.8 });
      reveal('Înăuntru,', 540, 320, local, 0.6, { size: 120 });
      reveal('un fior.', 540, 450, local, 0.9, { size: 120, italic: true, color: COLORS.goldLight });
    },
  });
}

function sceneTree(local, duration, out) {
  gpu.pass('bokeh', { target: T.a, uniforms: { time: local, aspect: ASPECT, density: 0.2, baseColor: PINE.base, glowColor: PINE.glow } });
  gpu.points('particles', {
    target: T.a,
    buffer: particles,
    count: particles.count,
    layout: particles.layout,
    uniforms: { time: local, center: [540, 1000], assemble: progress(local, 0.1, 2.4), burstTime: -1, regroup: 0, fadeOut: 0, morph: 0, festive: 1 },
  });
  drawInto(textLayer, () => {
    const star = easeOut(progress(local, 2.3, 0.6));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    drawIcon('sparkle', 540, TREE.top - 20, 150 * star, { alpha: star });
    lightLeak(540, TREE.top - 20, 260 * star, '255,220,150', 0.5 * star);
    ctx.restore();
    reveal('Un fior', 540, 300, local, 2.4, { size: 130 });
    reveal('de Crăciun.', 540, 440, local, 2.7, { size: 130, italic: true, color: COLORS.goldLight });
  });
  gpu.pass('compose', { target: T.b, textures: { base: T.a, overlay: textTexture() } });
  snowPass(T.b, out, local, 0.5);
}

const GIFTS = [
  [{ icon: 'quince-branch', word: 'Cald', sub: 'și auriu' }, { bottles: ['gutui'], name: 'Lichior de gutui', label: 'PENTRU SERILE LUNGI', stage: STAGES.gutui }],
  [{ icon: 'berry', word: 'Roșul', sub: 'sărbătorilor' }, { bottles: ['sangria'], name: 'Berry Sangria', label: 'ZMEURĂ · MURE · SCORȚIȘOARĂ', stage: STAGES.sangria }],
  [{ icon: 'snowflake', word: 'Proaspăt', sub: 'ca prima zăpadă' }, { bottles: ['hugo'], name: 'Elderberry Hugo', label: 'FLORI DE SOC · LĂMÂIE · MENTĂ', stage: STAGES.hugo }],
  [{ icon: 'citrus', word: 'Pentru noaptea', sub: 'dintre ani' }, { bottles: HL_ALL, name: 'Hard Lemonade', label: 'PATRU AROME', stage: STAGES.lemon }],
];

function sceneGifts(local, duration, out) {
  const index = Math.min(7, Math.floor(local / BEAT));
  const cl = local - index * BEAT;
  const [card, visual] = GIFTS[Math.floor(index / 2)];
  if (index % 2 === 0) iconCard(cl, T.c, { ...card, stage: visual.stage, time: local });
  else bottleCut(cl, T.c, { ...visual, zoomIn: 1.16 - 0.16 * easeOut(cl / BEAT) });
  gpu.pass('shock', { target: out, uniforms: { age: cl, center: [0.5, 0.5], aspect: ASPECT, strength: 1 }, textures: { source: T.c } });
}

const RING = ['gutui', 'hlZmeura', 'sangria', 'hlMenta', 'hugo', 'hlGhimbir', 'hlSoc'];

function sceneRange(local, duration, out) {
  orbitScene(local, duration, T.c, {
    ring: RING,
    ...PINE,
    drawText: () => {
      goldDust(local, 110, 23, { speed: 30, alpha: 0.7 });
      reveal('Singur sau', 540, 300, local, 0.5, { size: 120 });
      reveal('împreună.', 540, 430, local, 0.75, { size: 120, italic: true, color: COLORS.goldLight });
    },
  });
  snowPass(T.c, out, local, 0.45);
}

const BURST_AT = 2.4; // seconds into the finale (26.4 s in the film, on a downbeat)

function sceneFinale(local, duration, out) {
  gpu.pass('bokeh', { target: T.a, uniforms: { time: local, aspect: ASPECT, density: 0.16, baseColor: PINE.base.map((v) => v * 0.6), glowColor: PINE.glow.map((v) => v * 0.5) } });
  gpu.points('particles', {
    target: T.a,
    buffer: particles,
    count: particles.count,
    layout: particles.layout,
    uniforms: {
      time: local, center: [540, 1000],
      assemble: progress(local, 0, 1.6), burstTime: local - BURST_AT,
      regroup: progress(local, 3.0, 1.3), fadeOut: progress(local, 4.2, 0.6), morph: 1, festive: 1,
    },
  });
  drawInto(textLayer, () => {
    logo(540, 860, LOGO_WIDTH, { alpha: easeOut(progress(local, 4.1, 0.7)), glow: 0.6, shimmer: progress(local, 4.6, 0.8) });
    reveal('Crăciun fericit!', 540, 1210, local, 4.3, { size: 110, italic: true, color: COLORS.goldLight });
    reveal('SĂRBĂTORI CU FIORI FRUMOȘI', 540, 1300, local, 4.6, SMALL);
  });
  gpu.pass('compose', { target: T.b, textures: { base: T.a, overlay: textTexture() } });
  const age = local - BURST_AT;
  gpu.pass('shock', {
    target: T.c,
    uniforms: { age: Math.max(age, 0), center: uvPoint(540, 1000), aspect: ASPECT, strength: age >= 0 ? 1.2 : 0 },
    textures: { source: T.b },
  });
  snowPass(T.c, out, local, 0.5);
}

// ---------- timeline ----------
const SCENES = [
  { start: 0, end: 4.8, draw: sceneNight },
  { start: 4.8, end: 9.6, draw: sceneInside, transition: 'burn' },
  { start: 9.6, end: 14.4, draw: sceneTree, transition: 'burn' },
  { start: 14.4, end: 19.2, draw: sceneGifts },
  { start: 19.2, end: 24, draw: sceneRange, transition: 'burn' },
  { start: 24, end: VIDEO_DURATION, draw: sceneFinale, transition: 'burn' },
];

function aberrationAt(t) {
  const gifts = SCENES[3];
  if (t >= gifts.start && t < gifts.end) return 0.004 + 0.012 * Math.exp(-((t - gifts.start) % BEAT) * 8);
  return 0.004;
}

window.renderFrame = (t) => renderTimeline(SCENES, t, { duration: VIDEO_DURATION, aberration: aberrationAt(t) });

window.videoReady = Promise.all([loadAssets(), ...ICON_IDS.map(loadIcon)]).then(() => {
  setupEngine();
  const treeMask = makeCanvas();
  drawInto(treeMask, drawTree);
  const logoMask = makeCanvas();
  drawInto(logoMask, () => ctx.drawImage(img.logo, LOGO_RECT.x, LOGO_RECT.y, LOGO_RECT.width, LOGO_RECT.height));
  const full = { x: 0, y: 0, width: W, height: H };
  particles = particlesFrom(treeMask, full, 36000, 211, { image: logoMask, rect: full });
  window.renderFrame(0);
});
