// Fior brand film 2 – "Aurul toamnei" (1080×1920, 32 s), rendered with WebGL2.
// window.renderFrame(t) draws the frame at t seconds; render-film.cjs captures every frame.
// Timings match sunet-2.py: 120 BPM, one beat = 0.5 s.
// Chromium must run with --allow-file-access-from-files so local images can reach the GPU.

const VIDEO_DURATION = 32;
window.VIDEO_DURATION = VIDEO_DURATION;
const BEAT = 0.5;

const LOGO_PX = { cx: 540, cy: 860, width: 720 };
LOGO_PX.height = (LOGO_PX.width * 347) / 635;
const LOGO_RECT = { x: LOGO_PX.cx - LOGO_PX.width / 2, y: LOGO_PX.cy - LOGO_PX.height / 2, width: LOGO_PX.width, height: LOGO_PX.height };
// Molten gold colours.
const GOLD = { deep: [0.16, 0.07, 0.015], mid: [0.9, 0.6, 0.22], shine: [1.0, 0.88, 0.62], rimTint: [0.8, 0.5, 0.18] };
let logoTexture;
let particles;

// ---------- scenes: each one writes its frame into `out` ----------
function sceneGold(local, duration, out) {
  gpu.pass('gold', {
    target: T.gold,
    uniforms: {
      ...GOLD, time: local + 3, aspect: ASPECT, zoom: 1 - 0.12 * (local / duration),
      emboss: easeInOut(progress(local, 0.6, 2.4)),
      logoRect: uvRect(LOGO_RECT.x, LOGO_RECT.y, LOGO_RECT.width, LOGO_RECT.height),
    },
    textures: { logo: logoTexture },
  });
  drawInto(textLayer, () => {
    radialBackground(540, 860, 1150, [[0, '#2a190a'], [0.55, '#0c0704'], [1, '#020100']]);
    logo(LOGO_PX.cx, LOGO_PX.cy, LOGO_PX.width, { glow: 0.55, shimmer: progress(local, 4.0, 0.8) });
    text('LICHIOR  ·  COCKTAILS  ·  HARD LEMONADE', 540, 1150, {
      family: SANS, weight: 700, size: 24, spacing: 9, color: COLORS.goldLight, alpha: 0.85 * easeOut(progress(local, 4.1, 0.6)),
    });
  });
  gpu.pass('burn', {
    target: out,
    uniforms: { time: local, aspect: ASPECT, progress: easeInOut(progress(local, 3.2, 1.4)) },
    textures: { srcA: T.gold, srcB: textTexture() },
  });
}

function sceneHero(local, duration, out) {
  const push = 1 + 0.05 * (local / duration);
  const rise = easeOut(progress(local, 0, 1.0));
  litStage(local, out, {
    lightY: 1000, floorY: 1540, base: [0.03, 0.01, 0.003], glow: [0.32, 0.12, 0.035], ray: [1.0, 0.68, 0.32],
    caustics: easeOut(progress(local, 0.4, 1.5)),
    drawBottles: () => {
      ctx.save();
      ctx.translate(540, 1100);
      ctx.scale(push, push);
      ctx.translate(-540, -1100);
      bottle(img.gutui, 540, 1540 + (1 - rise) * 120, 1020, { reflection: 0.3, sweep: progress(local, 1.8, 1.3) || -1 });
      ctx.restore();
    },
    drawText: () => {
      anamorphicFlare(1000, 0.6 + 0.4 * Math.sin(local * 1.7));
      goldDust(local, 140, 9, { speed: 25, alpha: 0.8 });
      reveal('LICHIOR DE GUTUI', 540, 230, local, 0.6, { family: SANS, weight: 700, size: 26, spacing: 12, color: COLORS.goldLight });
      reveal('Aurul toamnei', 540, 345, local, 0.8, { size: 92 });
      reveal('târzii.', 540, 448, local, 1.0, { size: 92, italic: true, color: COLORS.goldLight });
      reveal('Nefiltrat  ·  fără arome adăugate', 540, 1745, local, 1.6, { family: SANS, size: 32, alpha: 0.9 });
    },
  });
}

const scenePhotoJob = photoScene((local, duration) => {
  blurredBackdrop(img.fotoJob, 1.3, 0.45);
  photoBand(img.fotoJob, 420, 1080, 1 + 0.09 * (local / duration), 0.5, 0.3);
  lightLeak(lerp(-100, 700, local / duration), 520, 650, '255,150,70', 0.3);
}, (local) => {
  reveal('Seara', 540, 330, local, 0.6, { size: 150, shadow: 30 });
  reveal('după job.', 540, 1690, local, 0.9, { size: 120, italic: true, color: COLORS.goldLight, shadow: 30 });
  reveal('HARD LEMONADE  ·  ZERO ZAHĂR', 540, 1790, local, 1.2, { family: SANS, weight: 700, size: 24, spacing: 9, alpha: 0.85 });
});

const scenePhotoLake = photoScene((local, duration) => {
  cover(img.fotoPlaja, 0, 0, W, H, 1.14 - 0.12 * (local / duration), 0.5, 0.35);
  const shade = ctx.createLinearGradient(0, H * 0.55, 0, H);
  shade.addColorStop(0, 'rgba(10,6,4,0)');
  shade.addColorStop(1, 'rgba(10,6,4,.8)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);
  lightLeak(900, 250, 800, '255,180,90', 0.38 + 0.08 * Math.sin(local * 3));
}, (local) => {
  reveal('Vara,', 540, 1470, local, 0.3, { size: 150, shadow: 30 });
  reveal('la apus.', 540, 1610, local, 0.55, { size: 130, italic: true, color: COLORS.goldLight, shadow: 30 });
  reveal('HARD LEMONADE ZMEURĂ ȘI LĂMÂIE', 540, 1720, local, 0.85, { family: SANS, weight: 700, size: 24, spacing: 8, alpha: 0.85 });
});

const DROP_CUTS = [
  { photo: 'fotoSangria', name: 'Berry Sangria', label: 'ZMEURĂ · MURE · PORTOCALĂ · SCORȚIȘOARĂ' },
  { bottles: ['sangria'], name: 'Berry Sangria', label: 'COCKTAIL READY TO DRINK', base: [0.04, 0.003, 0.01], glow: [0.4, 0.04, 0.09], ray: [1.0, 0.35, 0.4] },
  { photo: 'fotoHugo', name: 'Elderberry Hugo', label: 'FLORI DE SOC · LĂMÂIE · MENTĂ' },
  { bottles: ['hugo'], name: 'Elderberry Hugo', label: 'COCKTAIL READY TO DRINK', base: [0.01, 0.025, 0.005], glow: [0.18, 0.3, 0.06], ray: [0.85, 1.0, 0.5] },
  { photo: 'fotoGutui', name: 'Lichior de gutui', label: 'NEFILTRAT · DIN FRUCTE ROMÂNEȘTI' },
  { bottles: ['gutui'], name: 'Lichior de gutui', label: 'FIECARE DETALIU CONTEAZĂ', base: [0.03, 0.01, 0.003], glow: [0.36, 0.14, 0.04], ray: [1.0, 0.68, 0.32] },
  { photo: 'fotoHl', name: 'Hard Lemonade', label: 'ZERO ZAHĂR' },
  { bottles: ['hlGhimbir', 'hlZmeura', 'hlMenta', 'hlSoc'], name: 'Hard Lemonade', label: 'PATRU AROME', base: [0.03, 0.022, 0.003], glow: [0.34, 0.25, 0.04], ray: [1.0, 0.85, 0.4] },
];
function dropText(cut, cl) {
  const slide = easeOut(progress(cl, 0, 0.25));
  logo(540, 210, 230, { glow: 0.3 });
  text(cut.label, 540, 1610, { family: SANS, weight: 700, size: 23, spacing: 8, color: COLORS.goldLight, alpha: slide });
  text(cut.name, 540 + (1 - slide) * 70, 1725, { size: 104, alpha: slide, shadow: 24 });
}

function sceneDrop(local, duration, out) {
  const index = beatIndex(local, BEAT, DROP_CUTS.length - 1);
  const cut = DROP_CUTS[index];
  const cl = local - index * BEAT;
  const zoomIn = 1.16 - 0.16 * easeOut(cl / BEAT);

  if (cut.photo) {
    drawInto(layer, () => {
      blurredBackdrop(img[cut.photo], 1.3, 0.5);
      photoBand(img[cut.photo], 400, 1080, zoomIn);
    });
    gpu.pass('image', { target: T.a, textures: { source: layerTexture() } });
    drawInto(textLayer, () => dropText(cut, cl));
    gpu.pass('compose', { target: T.c, textures: { base: T.a, overlay: textTexture() } });
  } else {
    litStage(cl, T.c, {
      lightY: 980, floorY: 1500, base: cut.base, glow: cut.glow, ray: cut.ray, intensity: 1.8,
      drawBottles: () => {
        const gap = 240;
        cut.bottles.forEach((key, i) => {
          const x = 540 + (i - (cut.bottles.length - 1) / 2) * gap;
          bottle(img[key], x, 1500, 1000 * bottleScale(key) * (0.92 + 0.08 * zoomIn), { reflection: 0.3 });
        });
      },
      drawText: () => dropText(cut, cl),
    });
  }
  gpu.pass('shock', { target: out, uniforms: { age: cl, center: [0.5, 0.5], aspect: ASPECT, strength: 1 }, textures: { source: T.c } });
}

const RING = ['gutui', 'hlZmeura', 'sangria', 'hlMenta', 'hugo', 'hlGhimbir', 'hlSoc'];

function sceneOrbit(local, duration, out) {
  orbitScene(local, duration, out, {
    ring: RING,
    drawText: () => {
      goldDust(local, 110, 23, { speed: 30, alpha: 0.7 });
      reveal('Singur sau', 540, 300, local, 0.5, { size: 120 });
      reveal('împreună.', 540, 430, local, 0.75, { size: 120, italic: true, color: COLORS.goldLight });
      reveal('LICHIOR  ·  COCKTAILS  ·  HARD LEMONADE', 540, 1740, local, 1.2, { family: SANS, weight: 700, size: 24, spacing: 9, color: COLORS.goldLight, alpha: 0.85 });
    },
  });
}

const BURST_AT = 2.5; // seconds into the finale (26.0 s in the film)

function sceneFinale(local, duration, out) {
  gpu.pass('bokeh', { target: T.a, uniforms: { time: local, aspect: ASPECT, density: 0.14, baseColor: [0.01, 0.006, 0.002], glowColor: [0.09, 0.055, 0.015] } });
  gpu.points('particles', {
    target: T.a,
    buffer: particles,
    count: particles.count,
    layout: [2, 4],
    uniforms: {
      time: local, center: [LOGO_PX.cx, LOGO_PX.cy],
      assemble: progress(local, 0.1, 2.2), burstTime: local - BURST_AT,
      regroup: progress(local, 3.7, 1.6), fadeOut: progress(local, 5.3, 0.8),
    },
  });
  drawInto(textLayer, () => {
    logo(LOGO_PX.cx, LOGO_PX.cy, LOGO_PX.width, { alpha: easeOut(progress(local, 5.2, 0.8)), glow: 0.6, shimmer: progress(local, 5.9, 0.9) });
    reveal('Fiecare detaliu', 540, 1200, local, 5.7, { size: 92 });
    reveal('contează.', 540, 1305, local, 6.0, { size: 92, italic: true, color: COLORS.goldLight });
  });
  gpu.pass('compose', { target: T.b, textures: { base: T.a, overlay: textTexture() } });
  const age = local - BURST_AT;
  gpu.pass('shock', {
    target: out,
    uniforms: { age: Math.max(age, 0), center: uvPoint(LOGO_PX.cx, LOGO_PX.cy), aspect: ASPECT, strength: age >= 0 ? 1.2 : 0 },
    textures: { source: T.b },
  });
}

// ---------- timeline, transitions, post ----------
const SCENES = [
  { start: 0, end: 5.0, draw: sceneGold },
  { start: 5.0, end: 9.6, draw: sceneHero, transition: 'burn', zoomCenter: uvPoint(540, 1150) },
  { start: 9.6, end: 12.4, draw: scenePhotoJob, transition: 'zoom' },
  { start: 12.4, end: 14.5, draw: scenePhotoLake, transition: 'burn' },
  { start: 14.5, end: 18.5, draw: sceneDrop },
  { start: 18.5, end: 23.5, draw: sceneOrbit, transition: 'burn' },
  { start: 23.5, end: VIDEO_DURATION, draw: sceneFinale, transition: 'burn' },
];

function aberrationAt(t) {
  const drop = SCENES[4];
  if (t >= drop.start && t < drop.end) return 0.004 + 0.012 * Math.exp(-((t - drop.start) % BEAT) * 8);
  return 0.004;
}

window.renderFrame = (t) => renderTimeline(SCENES, t, { duration: VIDEO_DURATION, aberration: aberrationAt(t) });

window.videoReady = loadAssets().then(() => {
  setupEngine();
  logoTexture = gpu.upload(img.logo, { mipmaps: true });
  particles = particlesFrom(img.logo, LOGO_RECT, 30000, 97);
  window.renderFrame(0);
});
