// Fior Christmas film – "Un fior de Crăciun" (1080×1920, 30 s), rendered with WebGL2.
// Timings match the music in render-film.cjs (100 BPM, one beat = 0.6 s). The drawings are in craciun-desen.js.

const VIDEO_DURATION = 30;
window.VIDEO_DURATION = VIDEO_DURATION;
const BEAT = 0.6;

const ICON_IDS = ['berry', 'snowflake']; // gold line art on the red and green baubles
const LOGO_WIDTH = 720;
const LOGO_RECT = { x: 540 - LOGO_WIDTH / 2, y: 860 - (LOGO_WIDTH * 347) / 635 / 2, width: LOGO_WIDTH, height: (LOGO_WIDTH * 347) / 635 };
const PINE = { base: [0.012, 0.035, 0.022], glow: [0.1, 0.24, 0.12], ray: [1.0, 0.85, 0.5] };
const SMALL = { family: SANS, weight: 700, size: 24, spacing: 9, color: COLORS.goldLight };
let particles;

const snowPass = (source, out, local, amount = 1) => gpu.pass('snow', {
  target: out, uniforms: { time: local, aspect: ASPECT, amount, wind: 0.25 }, textures: { source },
});

function sceneNight(local, duration, out) {
  // a slow push-in towards the window; the branches close to the lens move faster (parallax)
  const push = easeInOut(local / duration);
  const windowY = WINDOW.y + WINDOW.height / 2;
  drawInto(layer, () => {
    scaledAround(CABIN.x, windowY, 1 + 0.2 * push, () => drawNight(local));
    scaledAround(CABIN.x, windowY, 1 + 0.55 * push, () => {
      ctx.filter = 'blur(3px)';
      ctx.drawImage(branchCanvas, 0, Math.sin(local * 0.9) * 6 - 6);
    });
    riseText('Afară', 540, 560, local, 0.7, { size: 170, shadow: 30 });
    riseText('ninge.', 540, 730, local, 1.1, { size: 170, italic: true, color: '#dfeaff', shadow: 30 });
  });
  gpu.pass('image', { target: T.a, textures: { source: layerTexture() } });
  snowPass(T.a, out, local, 0.85);
}

const HEARTH = { base: [0.05, 0.018, 0.006], glow: [0.5, 0.2, 0.05] };

function sceneInside(local, duration, out) {
  const settle = easeOut(progress(local, 0, 3.2));
  // someone has just shaken the globe and put it down: it rocks on the mantel and settles
  const since = Math.max(local - 0.5, 0); // the zoom through the window ends first
  const rock = 0.085 * Math.exp(-2.2 * since) * Math.sin(9.5 * since);
  // a slow push-in on the globe; the lights behind stay put (parallax)
  const push = 1 + 0.09 * easeInOut(local / duration);
  const pivot = { x: 540, y: 1270 };
  const reach = MANTEL_Y - GLOBE.y;
  const rocked = { x: GLOBE.x + reach * Math.sin(rock), y: MANTEL_Y - reach * Math.cos(rock) };
  const centre = uvPoint(pivot.x + (rocked.x - pivot.x) * push, pivot.y + (rocked.y - pivot.y) * push);
  const framed = (draw) => scaledAround(pivot.x, pivot.y, push, draw);

  gpu.pass('bokeh', { target: T.c, uniforms: { time: local, aspect: ASPECT, density: 0.3, baseColor: HEARTH.base, glowColor: HEARTH.glow.map((v) => v * (0.9 + 0.1 * Math.sin(local * 6))) } });
  drawInto(backdrop, () => framed(() => drawRoom(local)));
  gpu.pass('compose', { target: T.a, textures: { base: T.c, overlay: gpu.upload(backdrop) } });
  drawInto(layer, () => framed(() => rotatedAround(GLOBE.x, MANTEL_Y, rock, () => drawGlobeWorld(local))));
  gpu.pass('globe', {
    target: T.b,
    uniforms: { time: local, aspect: ASPECT, center: centre, radius: (GLOBE.r * push) / H, shake: 1 - settle },
    textures: { base: T.a, inner: layerTexture() },
  });
  drawInto(textLayer, () => {
    framed(() => rotatedAround(GLOBE.x, MANTEL_Y, rock, drawGlobeBase));
    goldDust(local, 90, 9, { speed: 20, alpha: 0.7 });
    riseText('Înăuntru,', 540, 300, local, 0.7, { size: 120 });
    riseText('un fior.', 540, 430, local, 1.0, { size: 120, italic: true, gold: true });
  });
  gpu.pass('compose', { target: out, textures: { base: T.b, overlay: textTexture() } });
}

const FLOOR_Y = 1630;

const TREE_LIGHT = { time: 0, center: [540, 1000], rise: [TREE.bottom, TREE.top, TREE.halfWidth], festive: 1 };

function sceneTree(local, duration, out) {
  gpu.pass('bokeh', { target: T.a, uniforms: { time: local, aspect: ASPECT, density: 0.2, baseColor: PINE.base, glowColor: PINE.glow } });
  gpu.points('particles', {
    target: T.a,
    buffer: particles,
    count: particles.count,
    layout: particles.layout,
    uniforms: { ...TREE_LIGHT, time: local, assemble: progress(local, 0.1, 2.2), burstTime: -1, regroup: 0, fadeOut: 0, morph: 0 },
  });
  drawInto(textLayer, () => {
    // a polished floor catching the light of the tree
    const floor = ctx.createLinearGradient(0, FLOOR_Y - 40, 0, H);
    floor.addColorStop(0, 'rgba(6,20,12,0)');
    floor.addColorStop(0.12, 'rgba(6,20,12,.85)');
    floor.addColorStop(1, 'rgba(2,8,5,.95)');
    ctx.fillStyle = floor;
    ctx.fillRect(0, FLOOR_Y - 40, W, H - FLOOR_Y + 40);
    const lit = easeOut(progress(local, 1.7, 1.0));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.scale(1, 0.3);
    const pool = ctx.createRadialGradient(540, FLOOR_Y / 0.3 + 60, 0, 540, FLOOR_Y / 0.3 + 60, 620);
    pool.addColorStop(0, `rgba(255,214,140,${0.4 * lit})`);
    pool.addColorStop(1, 'rgba(255,214,140,0)');
    ctx.fillStyle = pool;
    ctx.fillRect(0, FLOOR_Y / 0.3 - 500, W, 1400);
    ctx.restore();
    drawDecorations(local, 1.7);
    drawSpiral(local, 1.5, 0.9);
    [[250, 190, 150, 'gold', '#8a1622', 1.9], [400, 130, 110, 'red', '#f1dca4', 2.05], [700, 150, 120, 'green', '#f1dca4', 2.2]].forEach(([gx, gw, gh, paper, ribbon, at]) => {
      const drop = easeOut(progress(local, at, 0.5));
      if (drop <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.min(1, drop * 2);
      drawGift(gx, FLOOR_Y + 14 - (1 - drop) * 90, gw, gh, GIFT_PAPERS[paper], ribbon);
      ctx.restore();
    });
    const gift = easeOut(progress(local, 2.3, 0.8));
    bottle(img.gutui, 860, FLOOR_Y + 20 + (1 - gift) * 60, 600, { alpha: gift, reflection: 0.25, sweep: progress(local, 3.2, 1.0) || -1 });
    riseText('Un fior', 540, 300, local, 2.3, { size: 130 });
    riseText('de Crăciun.', 540, 440, local, 2.6, { size: 130, italic: true, gold: true });
  });
  gpu.pass('compose', { target: T.b, textures: { base: T.a, overlay: textTexture() } });
  snowPass(T.b, out, local, 0.4);
}

const GIFTS = [
  [{ icon: 'quince-branch-dark', word: 'Cald', sub: 'și auriu', colors: ['#fff0c4', '#d9912b', '#5e3408'] }, { bottles: ['gutui'], name: 'Lichior de gutui', label: 'PENTRU SERILE LUNGI', stage: STAGES.gutui }],
  [{ icon: 'berry', word: 'Roșul', sub: 'sărbătorilor', colors: ['#ffb0b0', '#b3162a', '#3d0510'] }, { bottles: ['sangria'], name: 'Berry Sangria', label: 'ZMEURĂ · MURE · SCORȚIȘOARĂ', stage: STAGES.sangria }],
  [{ icon: 'snowflake', word: 'Proaspăt', sub: 'ca prima zăpadă', colors: ['#e6ffd9', '#3f8f45', '#0f3316'] }, { bottles: ['hugo'], name: 'Elderberry Hugo', label: 'FLORI DE SOC · LĂMÂIE · MENTĂ', stage: STAGES.hugo }],
  [{ icon: 'citrus-dark', word: 'Pentru noaptea', sub: 'dintre ani', colors: ['#fff6c9', '#d6ab1d', '#5c4302'] }, { bottles: HL_ALL, name: 'Hard Lemonade', label: 'PATRU AROME', stage: STAGES.lemon }],
];

// Bows on the bottle necks (as a fraction of the bottle's height), clear of the labels.
const NECK = { gutui: 0.74 };

const bowOn = (item, baseY) => drawBow(item.x, baseY - item.height * (NECK[item.key] ?? 0.63), item.height * 0.27);

function sceneGifts(local, duration, out) {
  const index = beatIndex(local, BEAT, 7);
  const cl = local - index * BEAT;
  const [card, visual] = GIFTS[Math.floor(index / 2)];
  if (index % 2 === 0) {
    gpu.pass('bokeh', { target: T.a, uniforms: { time: local, aspect: ASPECT, density: 0.3, baseColor: visual.stage.base, glowColor: visual.stage.glow.map((v) => v * 0.8) } });
    drawInto(textLayer, () => {
      const pop = easeOut(progress(cl, 0, 0.3));
      drawBauble(cl, card);
      text(card.word, 540, 1340, { size: 130, alpha: pop, shadow: 24, maxWidth: 960 });
      text(card.sub, 540, 1460, { size: 96, italic: true, color: COLORS.goldLight, alpha: pop, shadow: 24, maxWidth: 960 });
    });
    gpu.pass('compose', { target: T.c, textures: { base: T.a, overlay: textTexture() } });
  } else {
    bottleCut(cl, T.c, { ...visual, zoomIn: 1.16 - 0.16 * easeOut(cl / BEAT), decorate: bowOn });
  }
  snowPass(T.c, T.b, local, 0.35);
  // a gentle flash: the snow and the lights are bright already
  gpu.pass('shock', { target: out, uniforms: { age: cl, center: [0.5, 0.5], aspect: ASPECT, strength: 0.55 }, textures: { source: T.b } });
}

const RING = ['gutui', 'hlZmeura', 'sangria', 'hlMenta', 'hugo', 'hlGhimbir', 'hlSoc'];

function sceneRange(local, duration, out) {
  orbitScene(local, duration, T.c, {
    ring: RING,
    ...PINE,
    drawBehind: () => drawWreath(local, 540, 420, easeOut(progress(local, 0.1, 0.9))),
    drawText: () => {
      goldDust(local, 110, 23, { speed: 30, alpha: 0.7 });
      riseText('Singur sau', 540, 400, local, 0.6, { size: 84, shadow: 20 });
      riseText('împreună.', 540, 492, local, 0.85, { size: 84, italic: true, gold: true, shadow: 20 });
    },
  });
  snowPass(T.c, out, local, 0.4);
}

const BURST_AT = 1.2; // seconds into the finale (25.2 s in the film, on a beat)

const END_BAUBLES = [
  { hangX: 170, length: 470, r: 74, colors: ['#ffb0b0', '#b3162a', '#3d0510'] },
  { hangX: 330, length: 330, r: 48, colors: ['#fff0c4', '#d9912b', '#5e3408'] },
  { hangX: 900, length: 420, r: 62, colors: ['#fff0c4', '#d9912b', '#5e3408'] },
  { hangX: 760, length: 300, r: 42, colors: ['#ffb0b0', '#b3162a', '#3d0510'] },
];

function sceneFinale(local, duration, out) {
  gpu.pass('bokeh', { target: T.a, uniforms: { time: local, aspect: ASPECT, density: 0.16, baseColor: PINE.base.map((v) => v * 0.6), glowColor: PINE.glow.map((v) => v * 0.5) } });
  gpu.points('particles', {
    target: T.a,
    buffer: particles,
    count: particles.count,
    layout: particles.layout,
    uniforms: {
      ...TREE_LIGHT, time: local,
      assemble: progress(local, -0.2, 1.0), burstTime: local - BURST_AT,
      regroup: progress(local, 1.7, 1.2), fadeOut: progress(local, 2.8, 0.5), morph: 1,
    },
  });
  drawInto(textLayer, () => {
    drawDecorations(local, 0.2, 1 - progress(local, BURST_AT - 0.1, 0.25));
    // the end card: fir branches and baubles frame the logo and the greeting
    const card = local - 2.5;
    if (card > 0) {
      ctx.save();
      ctx.globalAlpha = easeOut(progress(card, 0, 0.6));
      ctx.filter = 'blur(2px)';
      ctx.drawImage(branchCanvas, 0, -40 + (1 - easeOut(progress(card, 0, 0.8))) * -120);
      ctx.filter = 'none';
      END_BAUBLES.forEach((bauble, i) => drawBauble(Math.max(card - i * 0.12, 0), bauble));
      ctx.restore();
      // the whole family under the greeting
      bottleRow(['hlZmeura', 'sangria', 'gutui', 'hugo', 'hlMenta'], 400, 150).forEach((item, i) => {
        const rise = easeOut(progress(card, 0.5 + i * 0.08, 0.6));
        bottle(img[item.key], item.x, 1770 + (1 - rise) * 50, item.height, { alpha: rise, reflection: 0.2 });
      });
    }
    logo(540, 860, LOGO_WIDTH, { alpha: easeOut(progress(local, 2.7, 0.6)), glow: 0.6, shimmer: progress(local, 3.2, 0.8) });
    rule(540, 1120, 420, local, 3.0);
    riseText('Crăciun fericit!', 540, 1240, local, 3.0, { size: 118, italic: true, gold: true });
    trackText('SĂRBĂTORI CU FIORI FRUMOȘI', 540, 1330, local, 3.3, SMALL);
  });
  gpu.pass('compose', { target: T.b, textures: { base: T.a, overlay: textTexture() } });
  const age = local - BURST_AT;
  gpu.pass('shock', {
    target: T.c,
    uniforms: { age: Math.max(age, 0), center: uvPoint(540, 1000), aspect: ASPECT, strength: age >= 0 ? 1.2 : 0 },
    textures: { source: T.b },
  });
  snowPass(T.c, out, local, 0.4);
}

const SCENES = [
  { start: 0, end: 4.8, draw: sceneNight, zoomCenter: uvPoint(CABIN.x, WINDOW.y + WINDOW.height / 2) },
  { start: 4.8, end: 9.6, draw: sceneInside, transition: 'zoom' },
  { start: 9.6, end: 14.4, draw: sceneTree, transition: 'frost' },
  { start: 14.4, end: 19.2, draw: sceneGifts },
  { start: 19.2, end: 24, draw: sceneRange, transition: 'frost' },
  { start: 24, end: VIDEO_DURATION, draw: sceneFinale, transition: 'burn' },
];

function aberrationAt(t) {
  const gifts = SCENES[3];
  if (t >= gifts.start && t < gifts.end) return 0.004 + 0.006 * Math.exp(-((t - gifts.start) % BEAT) * 8);
  return 0.004;
}

window.renderFrame = (t) => renderTimeline(SCENES, t, { duration: VIDEO_DURATION, aberration: aberrationAt(t) });

const DARK_ICONS = ['quince-branch', 'citrus'].map((id) => loadIcon(id, '#4a2c08', `${id}-dark`));

window.videoReady = Promise.all([loadAssets(), ...ICON_IDS.map((id) => loadIcon(id)), ...DARK_ICONS]).then(() => {
  setupEngine();
  const treeMask = makeCanvas();
  drawInto(treeMask, drawTree);
  const logoMask = makeCanvas();
  drawInto(logoMask, () => ctx.drawImage(img.logo, LOGO_RECT.x, LOGO_RECT.y, LOGO_RECT.width, LOGO_RECT.height));
  const full = { x: 0, y: 0, width: W, height: H };
  particles = particlesFrom(treeMask, full, 36000, 211, { image: logoMask, rect: full });
  paintWreath();
  paintBranches();
  window.renderFrame(0);
});
