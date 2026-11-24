// Fior film 3 – "Esența rafinamentului" (1080×1920, 30 s): the official footage with WebGL effects.
// Needs the footage frames from cadre.py. Timings match the music in render-film.cjs (120 BPM, beat = 0.5 s).

const VIDEO_DURATION = 30;
window.VIDEO_DURATION = VIDEO_DURATION;
const BEAT = 0.5;
const FPS = 30;

const LOOK = { sharpen: 0.75, exposure: 0.96, contrast: 1.08, saturation: 1.05, warmth: 0.6, leak: 0.5, lift: 0.8 };
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

// Black bars that open from a slit in the middle of the frame (open 0..1), with thin gold edges.
function curtain(open) {
  if (open >= 1) return;
  const bar = (1 - open) * (H / 2 - 4);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, bar);
  ctx.fillRect(0, H - bar, W, bar);
  ctx.fillStyle = `rgba(236,213,155,${0.9 * (1 - open)})`;
  ctx.fillRect(0, bar - 2, W, 2);
  ctx.fillRect(0, H - bar, W, 2);
}

// One italic gold line that rises in at `from` and fades out before `to`.
function phrase(str, local, from, to, y = 1500) {
  const out = 1 - progress(local, to - 0.3, 0.3);
  if (local < from || out <= 0) return;
  riseText(str, 540, y, local, from, { size: 108, italic: true, gold: true, shadow: 30, maxWidth: 960, alpha: out, duration: 0.5 });
}

// A full-bleed footage scene. shot(local, duration) -> { clip, position, fx, fy, zoom }.
function footageScene(shot, drawWords, look = LOOK) {
  return {
    clips: (local, duration) => [shot(local, duration)],
    draw(local, duration, out) {
      const frame = shot(local, duration);
      drawInto(layer, () => drawClip(frame.clip, frame.position, frame));
      gpu.pass('grade', { target: T.a, uniforms: { ...look, time: local + (look.leakOffset || 0) }, textures: { source: layerTexture() } });
      drawInto(textLayer, () => {
        goldDust(local, 70, 57, { speed: 34, alpha: 0.55 }); // the same gold dust as in the product scenes
        drawWords(local, duration);
      });
      gpu.pass('compose', { target: out, textures: { base: T.a, overlay: textTexture() } });
    },
  };
}

const SMALL = { family: SANS, weight: 700, size: 24, spacing: 9, color: COLORS.goldLight };

// ---------- scenes ----------
// She steps out at double speed while the curtain opens, then in slow motion under the title (whole frames only).
function doorPosition(local) {
  const frame = Math.round(local * FPS);
  return frame <= 36 ? 4 + 2 * frame : 76 + (frame - 36);
}

const sceneDoor = footageScene(
  (local, duration) => ({ clip: 'usa', position: doorPosition(local), fx: lerp(0.42, 0.5, local / duration), zoom: lerp(1, 1.06, local / duration) }),
  (local) => {
    scrim(0.45, 0.8);
    curtain(easeInOut(progress(local, 0.1, 1.3)));
    riseText('Esența', 540, 1340, local, 1.0, { size: 150, shadow: 30 });
    riseText('rafinamentului', 540, 1480, local, 1.3, { size: 118, italic: true, gold: true, shadow: 30 });
  },
);

// Speed ramp for the steps: quick over the dress and the tilt up, slow motion once her face is in frame.
// Whole numbers of footage frames per output frame (3, then 2, then 1), so no two frames are ever blended.
function rampPosition(local) {
  const frame = Math.round(local * FPS);
  if (frame <= 24) return 20 + 3 * frame;
  if (frame <= 39) return 92 + 2 * (frame - 24);
  return 122 + (frame - 39);
}

const sceneSteps = footageScene(
  (local, duration) => ({ clip: 'trepte', position: rampPosition(local), fx: lerp(0.52, 0.47, easeInOut(local / duration)), zoom: 1 }),
  (local) => {
    scrim(0.3, 0.75);
    // three words from the brand's own description, one per bar of the music
    phrase('Artizanal.', local, 0.3, 1.5);
    phrase('Din fructe românești.', local, 1.5, 2.7);
    phrase('Premium.', local, 2.7, 4.2);
  },
);

const scenePortrait = footageScene(
  (local, duration) => ({ clip: 'portret', position: local * FPS, fx: lerp(0.5, 0.58, easeInOut(local / duration)), zoom: 1 }),
  (local) => {
    scrim(0.25, 0.95);
    riseText('Fiecare detaliu', 540, 1500, local, 0.3, { size: 112, shadow: 30 });
    riseText('contează.', 540, 1625, local, 0.9, { size: 124, italic: true, gold: true, shadow: 30 });
  },
);

const sceneLabel = footageScene(
  (local, duration) => ({ clip: 'eticheta', position: local * FPS, fx: lerp(0.46, 0.55, local / duration), zoom: 1 }),
  () => scrim(0.2, 0.45), // no words here: the label is the detail
);

// The drop, one step per beat: a triptych of widescreen bands builds up (the footage at its full width),
// then the four drinks, then her eyes to the camera.
const TRIPTYCH = [
  { clip: 'palarie', from: 96, fx: 0.5, fy: 0.45, side: -1 },
  { clip: 'eticheta', from: 0, fx: 0.47, fy: 0.5, side: 1 },
  { clip: 'pasi', from: 0, fx: 0.5, fy: 0.55, side: -1 },
];
const BAND = H / 3;
const DROP_CUTS = [
  { bottles: ['gutui'], name: 'Lichior de gutui', label: 'NEFILTRAT · DIN FRUCTE ROMÂNEȘTI', stage: STAGES.gutui },
  { bottles: ['sangria'], name: 'Berry Sangria', label: 'COCKTAIL READY TO DRINK', stage: STAGES.sangria },
  { bottles: ['hugo'], name: 'Elderberry Hugo', label: 'COCKTAIL READY TO DRINK', stage: STAGES.hugo, sparkling: true },
  { bottles: HL_ALL, name: 'Hard Lemonade', label: 'PATRU AROME', stage: STAGES.lemon, sparkling: true },
  { clip: 'palarie', from: 112, fx: 0.48 },
];
const dropStep = (local) => {
  const beat = beatIndex(local, BEAT, 7);
  return { beat, cl: local - beat * BEAT, cut: DROP_CUTS[beat - TRIPTYCH.length] };
};
const BAND_EVERY = BEAT / 2; // the bands slide in half a beat apart, then hold
const bandFrame = (band, index, local) => band.from + Math.max(0, local - index * BAND_EVERY) * FPS;

const sceneDrop = {
  clips(local) {
    const { beat, cl, cut } = dropStep(local);
    if (!cut) return TRIPTYCH.map((band, i) => ({ clip: band.clip, position: bandFrame(band, i, local) }));
    return cut.clip ? [{ clip: cut.clip, position: cut.from + cl * FPS }] : [];
  },
  draw(local, duration, out) {
    const { beat, cl, cut } = dropStep(local);
    const zoomIn = 1.14 - 0.14 * easeOut(cl / BEAT);
    if (!cut) {
      drawInto(layer, () => {
        ctx.fillStyle = '#060302';
        ctx.fillRect(0, 0, W, H);
        TRIPTYCH.forEach((band, i) => {
          if (local < i * BAND_EVERY) return;
          const slide = i === 0 ? 0 : 1 - easeOut(progress(local, i * BAND_EVERY, 0.22));
          const push = 1.1 - 0.1 * easeOut(progress(local, i * BAND_EVERY, 1.4));
          drawClip(band.clip, bandFrame(band, i, local), { fx: band.fx, fy: band.fy, zoom: push, x: band.side * slide * W, y: i * BAND, w: W, h: BAND - 6 });
        });
      });
      gpu.pass('grade', { target: T.c, uniforms: { ...LOOK, exposure: 0.86, leak: 0.2, time: local }, textures: { source: layerTexture() } });
    } else if (cut.clip) {
      drawInto(layer, () => drawClip(cut.clip, cut.from + cl * FPS, { fx: cut.fx, fy: cut.fy, zoom: (cut.zoom || 1) * zoomIn }));
      gpu.pass('grade', { target: T.c, uniforms: { ...LOOK, time: local }, textures: { source: layerTexture() } });
    } else if (cut.sparkling) {
      bottleCut(cl, T.d, { ...cut, zoomIn });
      gpu.pass('bubbles', { target: T.c, uniforms: { time: local, aspect: ASPECT, amount: 0.5 }, textures: { source: T.d } });
    } else {
      bottleCut(cl, T.c, { ...cut, zoomIn });
    }
    gpu.pass('shock', { target: out, uniforms: { age: cl, center: [0.5, 0.5], aspect: ASPECT, strength: cut || beat === 0 ? 1 : 0.5 }, textures: { source: T.c } });
  },
};

const RING = ['gutui', 'hlZmeura', 'sangria', 'hlMenta', 'hugo', 'hlGhimbir', 'hlSoc'];

// The range turns in front of her, out of focus at her table.
const orbitShot = (local) => ({ clip: 'masa', position: 20 + local * FPS, fx: 0.5, zoom: 1.05 });
const sceneOrbit = {
  clips: (local) => [orbitShot(local)],
  draw(local, duration, out) {
    orbitScene(local, duration, out, {
      ring: RING,
      drawBackdrop: () => {
        const shot = orbitShot(local);
        ctx.save();
        ctx.filter = 'blur(26px) brightness(0.5) saturate(1.15)';
        drawClip(shot.clip, shot.position, { ...shot, x: -60, y: -60, w: W + 120, h: H + 120 });
        ctx.restore();
        const shade = ctx.createLinearGradient(0, 900, 0, H);
        shade.addColorStop(0, 'rgba(10,5,2,0)');
        shade.addColorStop(1, 'rgba(10,5,2,.75)');
        ctx.fillStyle = shade;
        ctx.fillRect(0, 900, W, H - 900);
      },
      drawText: () => {
        goldDust(local, 110, 23, { speed: 30, alpha: 0.7 });
        riseText('Singur sau', 540, 300, local, 0.5, { size: 120, shadow: 24 });
        riseText('împreună.', 540, 430, local, 0.75, { size: 120, italic: true, gold: true, shadow: 24 });
      },
    });
  },
};

const scenePour = footageScene(
  (local, duration) => ({ clip: 'turnare', position: 8 + local * FPS * 1.4, fx: 0.38, zoom: lerp(1.08, 1, local / duration) }),
  (local) => {
    scrim(0.55, 0.6);
    riseText('în fiecare', 540, 330, local, 0.5, { size: 130, shadow: 30 });
    riseText('picătură.', 540, 470, local, 0.8, { size: 130, italic: true, gold: true, shadow: 30 });
  },
  { ...LOOK, warmth: 0.9 },
);

// The end of the pour: the picture itself turns liquid and floods towards the gold.
const pourFlood = {
  clips: scenePour.clips,
  draw(local, duration, out) {
    scenePour.draw(local, duration, T.c);
    gpu.pass('liquid', { target: out, uniforms: { time: local, aspect: ASPECT, amount: 1.6 * easeInOut(progress(local, duration - 1.2, 1.2)) }, textures: { source: T.c } });
  },
};

function sceneGold(local, duration, out) {
  liquidReveal(local, out, {
    palette: PALETTES.gold,
    relief: reliefTexture,
    zoom: 1 - 0.1 * (local / duration),
    emboss: easeInOut(progress(local, 0.3, 1.5)),
    drain: easeInOut(progress(local, 2.2, 1.2)),
    drawCard: () => {
      radialBackground(540, 860, 1150, [[0, '#2a190a'], [0.55, '#0c0704'], [1, '#020100']]);
      goldDust(local, 80, 31, { speed: 18, alpha: 0.6 });
      logo(540, 860, LOGO_WIDTH, { glow: 0.55, shimmer: progress(local, 3.2, 0.8) });
      rule(540, 1118, 420, local, 3.0);
      riseText('Esența rafinamentului', 540, 1200, local, 3.0, { size: 70 });
      riseText('în fiecare picătură.', 540, 1290, local, 3.25, { size: 70, italic: true, gold: true });
      trackText('FIORDRINKS.RO', 540, 1368, local, 3.7, { ...SMALL, size: 22, alpha: 0.8 });
      // the range under the slogan, rising one by one
      bottleRow(['hlZmeura', 'sangria', 'gutui', 'hugo', 'hlMenta'], 345, 150).forEach((item, i) => {
        const rise = easeOut(progress(local, 3.3 + i * 0.08, 0.6));
        bottle(img[item.key], item.x, 1790 + (1 - rise) * 50, item.height, { alpha: rise, reflection: 0.2 });
      });
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
  { start: 16, end: 20.5, ...sceneOrbit, transition: 'burn' },
  { start: 20.5, end: 24, ...pourFlood, transition: 'flash' },
  { start: 24, end: VIDEO_DURATION, draw: sceneGold, transition: 'dissolve' },
];

function aberrationAt(t) {
  const drop = SCENES[4];
  if (t >= drop.start && t < drop.end) return 0.004 + 0.012 * Math.exp(-((t - drop.start) % BEAT) * 8);
  return 0.004;
}

window.renderFrame = async (t) => {
  await prepareFootage(SCENES, t);
  renderTimeline(SCENES, t, { duration: VIDEO_DURATION, aberration: aberrationAt(t), halation: 0.35 });
};

window.videoReady = loadAssets().then(() => {
  setupEngine();
  drawInto(reliefCanvas, () => ctx.drawImage(img.logo, LOGO_RECT.x, LOGO_RECT.y, LOGO_RECT.width, LOGO_RECT.height));
  reliefTexture = gpu.upload(reliefCanvas, { mipmaps: true });
  return window.renderFrame(0);
});
