// Fior product videos (1080×1920, 20 s), rendered with WebGL2: film-produs.html?p=<id>,
// where <id> is a key of PRODUCT_FILMS (produse.js). Timings match sunet-produs.py (120 BPM, beat = 0.5 s).

const VIDEO_DURATION = 20;
window.VIDEO_DURATION = VIDEO_DURATION;
const BEAT = 0.5;

const PRODUCT_ID = new URLSearchParams(location.search).get('p') || 'gutui';
const P = PRODUCT_FILMS[PRODUCT_ID];

const LOGO_WIDTH = 720;
const ICON_IDS = ['quince-branch', 'berry', 'citrus', 'cinnamon', 'elderflower', 'mint', 'sparkle'];
const reliefCanvas = makeCanvas();
let reliefTexture;
let particles;

const heroRow = () => (P.bottles.length === 1 ? bottleRow(P.bottles, 1020, 0) : bottleRow(P.bottles, P.bottles.length > 4 ? 840 : 1000, P.bottles.length > 4 ? 200 : 235));
const finaleRow = () => (P.bottles.length === 1 ? bottleRow(P.bottles, 1080, 0) : bottleRow(P.bottles, P.bottles.length > 4 ? 860 : 1000, P.bottles.length > 4 ? 200 : 235));
const FINALE_BASE = 1450;

function glowText(str, x, y, options) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  text(str, x, y, { ...options, blur: 18, alpha: (options.alpha ?? 1) * 0.55 });
  ctx.restore();
  text(str, x, y, options);
}

const RELIEF_TEXT = { size: 300, weight: 600, italic: true, maxWidth: 940, color: '#fff' };
const LOGO_RECT = { x: 540 - LOGO_WIDTH / 2, y: 860 - (LOGO_WIDTH * 347) / 635 / 2, width: LOGO_WIDTH, height: (LOGO_WIDTH * 347) / 635 };

// ---------- scenes ----------
function sceneLiquid(local, duration, out) {
  gpu.pass('gold', {
    target: T.liquid,
    uniforms: {
      ...P.liquid, time: local + 3, aspect: ASPECT, zoom: 1 - 0.12 * (local / duration),
      emboss: easeInOut(progress(local, 0.5, 1.8)), logoRect: [0, 0, 1, 1],
    },
    textures: { logo: reliefTexture },
  });
  drawInto(textLayer, () => {
    const [r, g, b] = P.stage.glow.map((v) => Math.round(v * 140));
    radialBackground(540, 860, 1150, [[0, `rgb(${r},${g},${b})`], [0.55, '#0c0704'], [1, '#020100']]);
    if (P.relief) glowText(P.relief, 540, 960, { ...RELIEF_TEXT, color: COLORS.goldLight });
    else logo(540, 860, LOGO_WIDTH, { glow: 0.55, shimmer: progress(local, 3.0, 0.8) });
    text(P.eyebrow, 540, 1130, { family: SANS, weight: 700, size: 26, spacing: 12, color: COLORS.goldLight, alpha: 0.9 * easeOut(progress(local, 3.0, 0.6)) });
  });
  gpu.pass('burn', {
    target: out,
    uniforms: { time: local, aspect: ASPECT, progress: easeInOut(progress(local, 2.5, 1.3)) },
    textures: { srcA: T.liquid, srcB: textTexture() },
  });
}

function sceneHero(local, duration, out) {
  const push = 1 + 0.05 * (local / duration);
  const rise = easeOut(progress(local, 0, 1.0));
  const single = P.bottles.length === 1;
  const lightY = single ? 1000 : 1120;
  litStage(local, P.sparkling ? T.c : out, {
    ...P.stage, lightY, floorY: 1540, caustics: easeOut(progress(local, 0.4, 1.5)),
    drawBottles: () => {
      P.floatingIcons.forEach((id, k) => {
        const x = [170, 910, 210, 870][k];
        const y = 640 + 190 * k + 26 * Math.sin(local * 1.3 + k);
        drawIcon(id, x, y, 230, { alpha: 0.3 * easeOut(progress(local, 0.3 + k * 0.15, 0.8)), rotation: 0.15 * Math.sin(local * 0.7 + k) });
      });
      ctx.save();
      ctx.translate(540, 1100);
      ctx.scale(push, push);
      ctx.translate(-540, -1100);
      heroRow().forEach((item) => bottle(img[item.key], item.x, 1540 + (1 - rise) * 120, item.height, {
        reflection: 0.3, sweep: single ? progress(local, 1.8, 1.3) || -1 : -1,
      }));
      ctx.restore();
    },
    drawText: () => {
      anamorphicFlare(lightY, 0.6 + 0.4 * Math.sin(local * 1.7));
      goldDust(local, 140, 9, { speed: 25, alpha: 0.8 });
      reveal(P.eyebrow, 540, 230, local, 0.6, { family: SANS, weight: 700, size: 26, spacing: 12, color: COLORS.goldLight });
      reveal(P.title[0], 540, 345, local, 0.8, { size: 92, maxWidth: 960 });
      reveal(P.title[1], 540, 448, local, 1.0, { size: 92, italic: true, color: COLORS.goldLight, maxWidth: 960 });
      reveal(P.line, 540, 1745, local, 1.6, { family: SANS, size: 32, alpha: 0.9 });
    },
  });
  if (P.sparkling) gpu.pass('bubbles', { target: out, uniforms: { time: local, aspect: ASPECT, amount: 0.55 }, textures: { source: T.c } });
}

const scenePhoto = photoScene((local, duration) => {
  const image = img[P.photo.image];
  if (image.height > image.width) {
    cover(image, 0, 0, W, H, 1.14 - 0.12 * (local / duration), 0.5, 0.35);
    const shade = ctx.createLinearGradient(0, H * 0.55, 0, H);
    shade.addColorStop(0, 'rgba(10,6,4,0)');
    shade.addColorStop(1, 'rgba(10,6,4,.8)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, H);
    lightLeak(900, 250, 800, '255,180,90', 0.38 + 0.08 * Math.sin(local * 3));
  } else {
    blurredBackdrop(image, 1.3, 0.45);
    photoBand(image, 420, 1080, 1 + 0.09 * (local / duration), 0.5, 0.3);
    lightLeak(lerp(-100, 700, local / duration), 520, 650, '255,150,70', 0.28);
  }
}, (local) => {
  const portrait = img[P.photo.image].height > img[P.photo.image].width;
  const [first, second] = P.photo.words;
  reveal(first, 540, portrait ? 1470 : 330, local, 0.6, { size: 150, shadow: 30, maxWidth: 980 });
  reveal(second, 540, portrait ? 1610 : 1690, local, 0.9, { size: 120, italic: true, color: COLORS.goldLight, shadow: 30, maxWidth: 980 });
  reveal(P.photo.small, 540, portrait ? 1720 : 1790, local, 1.2, { family: SANS, weight: 700, size: 24, spacing: 8, alpha: 0.85 });
});

function sceneBeats(local, duration, out) {
  const index = beatIndex(local, BEAT, 7);
  const cl = local - index * BEAT;
  const [card, visual] = P.beats[Math.floor(index / 2)];
  const zoomIn = 1.16 - 0.16 * easeOut(cl / BEAT);
  const stage = visual.stage || P.stage;
  const name = visual.name || (P.finale.name ?? `${card.word} ${card.sub}`);

  if (index % 2 === 0) {
    iconCard(cl, T.c, { ...card, stage, time: local });
  } else if (visual.photo) {
    drawInto(layer, () => {
      blurredBackdrop(img[visual.photo], 1.3, 0.5);
      photoBand(img[visual.photo], 400, 1080, zoomIn);
    });
    gpu.pass('image', { target: T.a, textures: { source: layerTexture() } });
    drawInto(textLayer, () => beatLabels(name, visual.label, cl));
    gpu.pass('compose', { target: T.c, textures: { base: T.a, overlay: textTexture() } });
  } else {
    bottleCut(cl, T.c, { bottles: visual.bottles, name, label: visual.label, stage, zoomIn });
  }
  gpu.pass('shock', { target: out, uniforms: { age: cl, center: [0.5, 0.5], aspect: ASPECT, strength: 1 }, textures: { source: T.c } });
}

const BURST_AT = 1.8; // seconds into the finale

function sceneFinale(local, duration, out) {
  gpu.pass('bokeh', { target: T.a, uniforms: { time: local, aspect: ASPECT, density: 0.14, baseColor: P.stage.base.map((v) => v * 0.5), glowColor: P.stage.glow.map((v) => v * 0.3) } });
  gpu.points('particles', {
    target: T.a,
    buffer: particles,
    count: particles.count,
    layout: [2, 4],
    uniforms: {
      time: local, center: [540, 900],
      assemble: progress(local, 0.1, 1.6), burstTime: local - BURST_AT,
      regroup: progress(local, 2.3, 1.1), fadeOut: progress(local, 3.2, 0.5),
    },
  });
  drawInto(textLayer, () => {
    const appear = easeOut(progress(local, 3.0, 0.6));
    if (P.finale.name) {
      finaleRow().forEach((item) => bottle(img[item.key], item.x, FINALE_BASE, item.height, { alpha: appear, reflection: 0.25, sweep: progress(local, 3.4, 0.7) || -1 }));
      logo(540, 200, 260, { glow: 0.4, alpha: appear });
      reveal(P.finale.name, 540, 1640, local, 3.1, { size: 100, maxWidth: 980 });
      reveal(P.finale.tagline, 540, 1735, local, 3.3, { size: 50, italic: true, color: COLORS.goldLight, maxWidth: 960 });
    } else {
      logo(540, 860, LOGO_WIDTH, { alpha: appear, glow: 0.6, shimmer: progress(local, 3.4, 0.8) });
      reveal('Fiecare detaliu', 540, 1200, local, 3.2, { size: 92 });
      reveal('contează.', 540, 1305, local, 3.45, { size: 92, italic: true, color: COLORS.goldLight });
    }
  });
  gpu.pass('compose', { target: T.b, textures: { base: T.a, overlay: textTexture() } });
  const age = local - BURST_AT;
  gpu.pass('shock', {
    target: out,
    uniforms: { age: Math.max(age, 0), center: uvPoint(540, 900), aspect: ASPECT, strength: age >= 0 ? 1.2 : 0 },
    textures: { source: T.b },
  });
}

// ---------- timeline ----------
const SCENES = [
  { start: 0, end: 4.0, draw: sceneLiquid },
  { start: 4.0, end: 8.4, draw: sceneHero, transition: 'burn', zoomCenter: uvPoint(540, P.bottles.length === 1 ? 1150 : 1300) },
  { start: 8.4, end: 11.4, draw: scenePhoto, transition: 'zoom' },
  { start: 11.4, end: 15.4, draw: sceneBeats },
  { start: 15.4, end: VIDEO_DURATION, draw: sceneFinale, transition: 'burn' },
];

function aberrationAt(t) {
  const beats = SCENES[3];
  if (t >= beats.start && t < beats.end) return 0.004 + 0.012 * Math.exp(-((t - beats.start) % BEAT) * 8);
  return 0.004;
}

window.renderFrame = (t) => renderTimeline(SCENES, t, { duration: VIDEO_DURATION, aberration: aberrationAt(t) });

function setupProduct() {
  setupEngine();

  drawInto(reliefCanvas, () => {
    if (P.relief) text(P.relief, 540, 960, RELIEF_TEXT);
    else ctx.drawImage(img.logo, LOGO_RECT.x, LOGO_RECT.y, LOGO_RECT.width, LOGO_RECT.height);
  });
  reliefTexture = gpu.upload(reliefCanvas, { mipmaps: true });

  // Particles assemble into the bottles of the finale (or into the logo for the whole range).
  const mask = makeCanvas();
  drawInto(mask, () => {
    if (P.finale.name) {
      finaleRow().forEach((item) => {
        const width = (item.height * img[item.key].width) / img[item.key].height;
        ctx.drawImage(img[item.key], item.x - width / 2, FINALE_BASE - item.height, width, item.height);
      });
    } else {
      ctx.drawImage(img.logo, LOGO_RECT.x, LOGO_RECT.y, LOGO_RECT.width, LOGO_RECT.height);
    }
  });
  particles = particlesFrom(mask, { x: 0, y: 0, width: W, height: H }, 30000, 131);
}

window.videoReady = Promise.all([loadAssets(), ...ICON_IDS.map((id) => loadIcon(id))]).then(() => {
  setupProduct();
  window.renderFrame(0);
});
