// Fior film 3 – "Esența rafinamentului" (1080×1920, 30 s): the official footage with WebGL effects.
// Needs the footage frames from cadre.py. Timings match the music in render-film.cjs (120 BPM, beat = 0.5 s).

const VIDEO_DURATION = 30;
window.VIDEO_DURATION = VIDEO_DURATION;
const BEAT = 0.5;
const FPS = 30;

const LOOK = { sharpen: 0.6, exposure: 0.96, contrast: 1.08, saturation: 1.05, warmth: 0.6 };
const LOGO_WIDTH = 720;
const LOGO_RECT = { x: 540 - LOGO_WIDTH / 2, y: 860 - (LOGO_WIDTH * 347) / 635 / 2, width: LOGO_WIDTH, height: (LOGO_WIDTH * 347) / 635 };
const reliefCanvas = makeCanvas();
let reliefTexture;

// Dark gradients behind the words, so they stay readable on the bright footage.
function scrim(top = 0.5, bottom = 0.75) {
  [[0, 620, top, true], [1180, H, bottom, false]].forEach(([from, to, strength, fadeDown]) => {
    const shade = ctx.createLinearGradient(0, from, 0, to);
    shade.addColorStop(fadeDown ? 0 : 1, `rgba(12,6,3,${strength})`);
    shade.addColorStop(fadeDown ? 1 : 0, 'rgba(12,6,3,0)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, from, W, to - from);
  });
}

// A full-bleed footage scene. shot(local, duration) -> { clip, position, fx, fy, zoom }.
function footageScene(shot, drawWords, look = LOOK) {
  return {
    clips: (local, duration) => [shot(local, duration)],
    draw(local, duration, out) {
      const frame = shot(local, duration);
      drawInto(layer, () => drawClip(frame.clip, frame.position, frame));
      gpu.pass('grade', { target: T.a, uniforms: look, textures: { source: layerTexture() } });
      drawInto(textLayer, () => drawWords(local, duration));
      gpu.pass('compose', { target: out, textures: { base: T.a, overlay: textTexture() } });
    },
  };
}

const SMALL = { family: SANS, weight: 700, size: 24, spacing: 9, color: COLORS.goldLight };

// ---------- scenes ----------
const sceneDoor = footageScene(
  (local, duration) => ({ clip: 'usa', position: 10 + local * FPS, fx: lerp(0.42, 0.5, local / duration), zoom: lerp(1, 1.06, local / duration) }),
  (local) => {
    scrim(0.45, 0.8);
    logo(540, 230, 250, { glow: 0.3, alpha: easeOut(progress(local, 0.4, 0.8)) });
    reveal('Esența', 540, 1340, local, 1.0, { size: 150, shadow: 30 });
    reveal('rafinamentului', 540, 1480, local, 1.3, { size: 118, italic: true, color: COLORS.goldLight, shadow: 30 });
  },
);

const sceneSteps = footageScene(
  (local, duration) => ({ clip: 'trepte', position: 6 + local * FPS, fx: lerp(0.52, 0.47, easeInOut(local / duration)), zoom: 1 }),
  (local) => {
    scrim(0.3, 0.7);
    reveal('LICHIOR  ·  COCKTAILS  ·  HARD LEMONADE', 540, 1500, local, 0.6, SMALL);
  },
);

const scenePortrait = footageScene(
  (local, duration) => ({ clip: 'portret', position: local * FPS, fx: lerp(0.5, 0.58, easeInOut(local / duration)), zoom: 1 }),
  (local) => {
    scrim(0.25, 0.75);
    reveal('Fiecare detaliu', 540, 1450, local, 0.3, { size: 112, shadow: 30 });
  },
);

const sceneLabel = footageScene(
  (local, duration) => ({ clip: 'eticheta', position: local * FPS, fx: lerp(0.46, 0.55, local / duration), zoom: 1 }),
  (local) => {
    scrim(0.25, 0.75);
    reveal('contează.', 540, 1450, local, 0.2, { size: 128, italic: true, color: COLORS.goldLight, shadow: 30 });
  },
);

const DROP_CUTS = [
  { clip: 'pasi', from: 0, fx: 0.52 },
  { bottles: ['gutui'], name: 'Lichior de gutui', label: 'NEFILTRAT · DIN FRUCTE ROMÂNEȘTI', stage: STAGES.gutui },
  { clip: 'palarie', from: 55, fx: 0.48 },
  { bottles: ['sangria'], name: 'Berry Sangria', label: 'COCKTAIL READY TO DRINK', stage: STAGES.sangria },
  { clip: 'pasi', from: 56, fx: 0.56 },
  { bottles: ['hugo'], name: 'Elderberry Hugo', label: 'COCKTAIL READY TO DRINK', stage: STAGES.hugo },
  { clip: 'masa', from: 165, fx: 0.5 },
  { bottles: HL_ALL, name: 'Hard Lemonade', label: 'PATRU AROME', stage: STAGES.lemon },
];
const dropCut = (local) => {
  const index = Math.min(DROP_CUTS.length - 1, Math.floor(local / BEAT));
  return { cut: DROP_CUTS[index], cl: local - index * BEAT };
};

const sceneDrop = {
  clips(local) {
    const { cut, cl } = dropCut(local);
    return cut.clip ? [{ clip: cut.clip, position: cut.from + cl * FPS }] : [];
  },
  draw(local, duration, out) {
    const { cut, cl } = dropCut(local);
    const zoomIn = 1.14 - 0.14 * easeOut(cl / BEAT);
    if (cut.clip) {
      drawInto(layer, () => drawClip(cut.clip, cut.from + cl * FPS, { fx: cut.fx, zoom: zoomIn }));
      gpu.pass('grade', { target: T.c, uniforms: LOOK, textures: { source: layerTexture() } });
    } else {
      bottleCut(cl, T.c, { ...cut, zoomIn });
    }
    gpu.pass('shock', { target: out, uniforms: { age: cl, center: [0.5, 0.5], aspect: ASPECT, strength: 1 }, textures: { source: T.c } });
  },
};

const RING = ['gutui', 'hlZmeura', 'sangria', 'hlMenta', 'hugo', 'hlGhimbir', 'hlSoc'];

function sceneOrbit(local, duration, out) {
  orbitScene(local, duration, out, {
    ring: RING,
    drawText: () => {
      goldDust(local, 110, 23, { speed: 30, alpha: 0.7 });
      reveal('Singur sau', 540, 300, local, 0.5, { size: 120 });
      reveal('împreună.', 540, 430, local, 0.75, { size: 120, italic: true, color: COLORS.goldLight });
    },
  });
}

const scenePour = footageScene(
  (local, duration) => ({ clip: 'turnare', position: (local / duration) * (CLIP_FRAMES.turnare - 2), fx: 0.38, zoom: lerp(1.08, 1, local / duration) }),
  (local) => {
    scrim(0.55, 0.6);
    reveal('în fiecare', 540, 330, local, 0.5, { size: 130, shadow: 30 });
    reveal('picătură.', 540, 470, local, 0.8, { size: 130, italic: true, color: COLORS.goldLight, shadow: 30 });
  },
  { ...LOOK, warmth: 0.9 },
);

function sceneGold(local, duration, out) {
  liquidReveal(local, out, {
    palette: PALETTES.gold,
    relief: reliefTexture,
    zoom: 1 - 0.1 * (local / duration),
    emboss: easeInOut(progress(local, 0.2, 1.6)),
    drain: easeInOut(progress(local, 2.4, 1.3)),
    drawCard: () => {
      radialBackground(540, 860, 1150, [[0, '#2a190a'], [0.55, '#0c0704'], [1, '#020100']]);
      goldDust(local, 80, 31, { speed: 18, alpha: 0.6 });
      logo(540, 860, LOGO_WIDTH, { glow: 0.55, shimmer: progress(local, 3.4, 0.8) });
      reveal('Esența rafinamentului', 540, 1190, local, 3.3, { size: 70 });
      reveal('în fiecare picătură.', 540, 1280, local, 3.55, { size: 70, italic: true, color: COLORS.goldLight });
    },
  });
}

// ---------- timeline ----------
const SCENES = [
  { start: 0, end: 4, ...sceneDoor },
  { start: 4, end: 8, ...sceneSteps, transition: 'dissolve' },
  { start: 8, end: 10, ...scenePortrait, transition: 'flash' },
  { start: 10, end: 12, ...sceneLabel, transition: 'dissolve' },
  { start: 12, end: 16, ...sceneDrop },
  { start: 16, end: 20.5, draw: sceneOrbit, transition: 'burn' },
  { start: 20.5, end: 24, ...scenePour, transition: 'flash' },
  { start: 24, end: VIDEO_DURATION, draw: sceneGold, transition: 'burn' },
];

function aberrationAt(t) {
  const drop = SCENES[4];
  if (t >= drop.start && t < drop.end) return 0.004 + 0.012 * Math.exp(-((t - drop.start) % BEAT) * 8);
  return 0.004;
}

window.renderFrame = async (t) => {
  await prepareFootage(SCENES, t);
  renderTimeline(SCENES, t, { duration: VIDEO_DURATION, aberration: aberrationAt(t) });
};

window.videoReady = loadAssets().then(() => {
  setupEngine();
  drawInto(reliefCanvas, () => ctx.drawImage(img.logo, LOGO_RECT.x, LOGO_RECT.y, LOGO_RECT.width, LOGO_RECT.height));
  reliefTexture = gpu.upload(reliefCanvas, { mipmaps: true });
  return window.renderFrame(0);
});
