// Fior brand film (1080×1920, 26 s), drawn on a canvas frame by frame.
// window.renderFrame(t) draws the frame at t seconds; render-film.cjs captures every frame.
// The timings match the sound design in sunet.py (100 BPM, one beat = 0.6 s).

const VIDEO_DURATION = 26;
window.VIDEO_DURATION = VIDEO_DURATION;

const canvas = document.getElementById('film');
ctx = canvas.getContext('2d');

// ---------- scenes ----------
const LOGO_CENTER = { x: 540, y: 860 };
const LOGO_WIDTH = 760;

function sceneLogoForge(local) {
  radialBackground(540, 900, 1150, [[0, `rgb(${Math.round(lerp(20, 52, progress(local, 0, 2.6)))},22,10)`], [0.55, '#0d0704'], [1, '#030201']]);
  goldDust(local, 70, 3, { speed: 20, alpha: 0.5 });

  const rand = seededRandom(19);
  const logoHeight = (LOGO_WIDTH * 347) / 635;
  const left = LOGO_CENTER.x - LOGO_WIDTH / 2;
  const top = LOGO_CENTER.y - logoHeight / 2;
  const particlesAlpha = 1 - progress(local, 2.45, 0.5);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const [px, py] of LOGO_POINTS) {
    const angle = rand() * Math.PI * 2;
    const radius = 650 + rand() * 750;
    const delay = rand() * 0.9;
    const sx = 540 + Math.cos(angle) * radius;
    const sy = 900 + Math.sin(angle) * radius;
    const tx = left + px * LOGO_WIDTH;
    const ty = top + py * logoHeight;
    const e = easeInOut(progress(local, delay, 1.5));
    const turn = (1 - e) * 1.7;
    const vx = (sx - tx) * (1 - e);
    const vy = (sy - ty) * (1 - e);
    const x = tx + vx * Math.cos(turn) - vy * Math.sin(turn);
    const y = ty + vx * Math.sin(turn) + vy * Math.cos(turn);
    ctx.globalAlpha = (0.5 + 0.5 * e) * particlesAlpha;
    ctx.fillStyle = '#ffd98c';
    ctx.fillRect(x - 1.4, y - 1.4, 2.8, 2.8);
    ctx.globalAlpha = 0.09 * particlesAlpha;
    ctx.fillRect(x - 5, y - 5, 10, 10);
  }
  ctx.restore();

  const logoAlpha = easeOut(progress(local, 2.35, 0.6));
  logo(LOGO_CENTER.x, LOGO_CENTER.y, LOGO_WIDTH, { alpha: logoAlpha, glow: 0.4 + 0.6 * (1 - progress(local, 2.7, 0.9)), shimmer: progress(local, 2.75, 0.75) });
  text('LICHIOR  ·  COCKTAILS  ·  HARD LEMONADE', 540, 1170, {
    family: SANS, weight: 700, size: 24, spacing: 9, color: COLORS.goldLight, alpha: 0.85 * easeOut(progress(local, 2.95, 0.5)),
  });
}

function sceneHero(local, duration) {
  radialBackground(540, 1050, 1250, [[0, '#a34a17'], [0.38, '#4a1707'], [1, '#0b0302']]);
  const drift = easeOut(local / duration);

  ctx.save();
  ctx.font = `400 400px ${SERIF}`;
  ctx.letterSpacing = '30px';
  ctx.textAlign = 'center';
  ctx.strokeStyle = 'rgba(236,213,155,.22)';
  ctx.lineWidth = 2;
  ctx.strokeText('FIOR', 560 + 90 * (1 - drift), 1060);
  ctx.restore();

  goldDust(local, 120, 7, { speed: 35, alpha: 0.6 });
  lightLeak(900, 300, 700, '255,170,90', 0.18);

  const rise = easeOut(progress(local, 0.1, 1.1));
  bottle(img.gutui, 540, 1580 + (1 - rise) * 260, 1100, { alpha: rise, sweep: progress(local, 1.25, 1.3) || -1 });

  reveal('LICHIOR DE GUTUI', 540, 200, local, 0.5, { family: SANS, weight: 700, size: 26, spacing: 12, color: COLORS.goldLight });
  reveal('Gust tandru', 540, 300, local, 0.7, { size: 88 });
  reveal('și delicat.', 540, 395, local, 0.9, { size: 88, italic: true, color: COLORS.goldLight });
  reveal('Nefiltrat  ·  din gutui românești', 540, 1740, local, 1.6, { family: SANS, size: 34, alpha: 0.9 });
}

function sceneAfterWork(local, duration) {
  blurredBackdrop(img.fotoJob, 1.3, 0.45);
  photoBand(img.fotoJob, 420, 1080, 1 + 0.09 * (local / duration), 0.5, 0.3);
  lightLeak(lerp(-100, 700, local / duration), 520, 650, '255,150,70', 0.28);
  reveal('Seara', 540, 330, local, 0.25, { size: 150, shadow: 30 });
  reveal('după job.', 540, 1690, local, 0.6, { size: 120, italic: true, color: COLORS.goldLight, shadow: 30 });
  reveal('HARD LEMONADE  ·  ZERO ZAHĂR', 540, 1790, local, 1.0, { family: SANS, weight: 700, size: 24, spacing: 9, alpha: 0.85 });
}

function sceneSunset(local, duration) {
  const p = local / duration;
  cover(img.fotoPlaja, 0, 0, W, H, 1.14 - 0.12 * p, 0.5, 0.35);
  const shade = ctx.createLinearGradient(0, H * 0.55, 0, H);
  shade.addColorStop(0, 'rgba(10,6,4,0)');
  shade.addColorStop(1, 'rgba(10,6,4,.78)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);
  lightLeak(900, 250, 800, '255,180,90', 0.35 + 0.08 * Math.sin(local * 3));
  reveal('Vara,', 540, 1470, local, 0.25, { size: 150, shadow: 30 });
  reveal('la apus.', 540, 1610, local, 0.55, { size: 130, italic: true, color: COLORS.goldLight, shadow: 30 });
  reveal('HARD LEMONADE ZMEURĂ ȘI LĂMÂIE', 540, 1720, local, 0.9, { family: SANS, weight: 700, size: 24, spacing: 8, alpha: 0.85 });
}

const CUTS = [
  { photo: 'fotoSangria', name: 'Berry Sangria', label: 'COCKTAIL READY TO DRINK' },
  { photo: 'fotoHugo', name: 'Elderberry Hugo', label: 'COCKTAIL READY TO DRINK' },
  { photo: 'fotoGutui', name: 'Lichior de gutui', label: 'NEFILTRAT · FĂRĂ AROME ADĂUGATE' },
  { photo: 'fotoHl', name: 'Hard Lemonade', label: 'ZERO ZAHĂR' },
];
const BEAT = 0.6;

function sceneCuts(local) {
  const index = Math.min(CUTS.length - 1, Math.floor(local / BEAT));
  const cut = CUTS[index];
  const cl = local - index * BEAT;
  const image = img[cut.photo];
  blurredBackdrop(image, 1.3, 0.5);
  photoBand(image, 400, 1080, 1.16 - 0.16 * easeOut(cl / BEAT));
  logo(540, 220, 250, { glow: 0.3 });
  const slide = easeOut(progress(cl, 0, 0.3));
  text(cut.label, 540, 1600, { family: SANS, weight: 700, size: 24, spacing: 9, color: COLORS.goldLight, alpha: slide });
  text(cut.name, 540 + (1 - slide) * 60, 1720, { size: 104, alpha: slide, shadow: 24 });
  const flash = (1 - progress(cl, 0, 0.24)) ** 2;
  if (index > 0 && flash > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = `rgba(255,236,196,${0.85 * flash})`;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

const RING = [
  ['gutui', 1], ['hlZmeura', 0.72], ['sangria', 0.92], ['hlMenta', 0.72],
  ['hugo', 0.9], ['hlGhimbir', 0.72], ['hlSoc', 0.72],
];

function sceneOrbit(local, duration) {
  radialBackground(540, 1250, 1300, [[0, '#4a3412'], [0.45, '#1c1307'], [1, '#050302']]);
  goldDust(local, 110, 23, { speed: 30, alpha: 0.6 });
  const floor = ctx.createRadialGradient(540, 1440, 0, 540, 1440, 640);
  floor.addColorStop(0, 'rgba(236,213,155,.22)');
  floor.addColorStop(1, 'rgba(236,213,155,0)');
  ctx.fillStyle = floor;
  ctx.fillRect(0, 1200, W, 500);

  const spin = lerp(-Math.PI * 2 * 0.85, 0, easeOut(progress(local, 0, duration - 0.4)));
  const placed = RING.map(([key, scale], i) => {
    const angle = spin + (i * Math.PI * 2) / RING.length;
    const depth = Math.cos(angle);
    const near = (depth + 1) / 2;
    return { key, scale, x: 540 + 400 * Math.sin(angle), depth, near };
  }).sort((a, b) => a.depth - b.depth);

  for (const item of placed) {
    const size = 0.6 + 0.4 * item.near;
    bottle(img[item.key], item.x, 1420 + 80 * item.depth, 900 * item.scale * size, {
      alpha: 0.45 + 0.55 * item.near, brightness: 0.45 + 0.55 * item.near, reflection: 0.2,
    });
  }

  reveal('Singur sau', 540, 330, local, 0.3, { size: 120 });
  reveal('împreună.', 540, 460, local, 0.55, { size: 120, italic: true, color: COLORS.goldLight });
  reveal('LICHIOR  ·  COCKTAILS  ·  HARD LEMONADE', 540, 1720, local, 1.0, { family: SANS, weight: 700, size: 24, spacing: 9, color: COLORS.goldLight, alpha: 0.85 });
}

function sceneFinale(local) {
  radialBackground(540, 880, 1200, [[0, '#3a2510'], [0.5, '#120b05'], [1, '#030201']]);
  goldDust(local, 90, 31, { speed: 18, alpha: 0.5 });

  // spark burst
  const rand = seededRandom(41);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 520; i += 1) {
    const angle = rand() * Math.PI * 2;
    const speed = 380 + rand() * 1100;
    const life = 1.1 + rand() * 0.9;
    const p = clamp(local / life);
    if (p >= 1) continue;
    const distance = speed * (1 - (1 - p) ** 2) * 0.9;
    ctx.globalAlpha = (1 - p) ** 1.5;
    ctx.fillStyle = rand() > 0.5 ? '#fff1c9' : '#ffc56b';
    const s = 1.5 + rand() * 2.5;
    ctx.fillRect(LOGO_CENTER.x + Math.cos(angle) * distance, LOGO_CENTER.y + Math.sin(angle) * distance * 0.8, s, s);
  }
  ctx.restore();

  const shimmer = local < 2 ? progress(local, 0.5, 0.9) : progress(local, 2.8, 0.9);
  logo(LOGO_CENTER.x, LOGO_CENTER.y, 720, { glow: 0.45 + 0.5 * (1 - progress(local, 0, 1.2)), shimmer });
  reveal('Fiecare detaliu', 540, 1200, local, 0.8, { size: 92 });
  reveal('contează.', 540, 1305, local, 1.05, { size: 92, italic: true, color: COLORS.goldLight });
}

// ---------- timeline and transitions ----------
const SCENES = [
  { start: 0, end: 3.6, draw: sceneLogoForge },
  { start: 3.6, end: 7.4, draw: sceneHero, transition: 'flash' },
  { start: 7.4, end: 10.6, draw: sceneAfterWork, transition: 'circle' },
  { start: 10.6, end: 13.4, draw: sceneSunset, transition: 'whip' },
  { start: 13.4, end: 15.8, draw: sceneCuts, transition: 'flash' },
  { start: 15.8, end: 20.0, draw: sceneOrbit, transition: 'flash' },
  { start: 20.0, end: VIDEO_DURATION, draw: sceneFinale, transition: 'flash' },
];

const bufferA = makeCanvas();
const bufferB = makeCanvas();
const drawScene = (scene, t) => scene.draw(t - scene.start, scene.end - scene.start);

const TRANSITIONS = {
  flash: {
    duration: 0.35,
    draw(previous, next, t, p) {
      drawScene(next, t);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(255,236,196,${0.95 * (1 - p) ** 2})`;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    },
  },
  circle: {
    duration: 0.8,
    draw(previous, next, t, p) {
      drawScene(previous, t);
      const radius = easeInOut(p) * 1250;
      ctx.save();
      ctx.beginPath();
      ctx.arc(540, 960, radius, 0, Math.PI * 2);
      ctx.clip();
      drawScene(next, t);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = `rgba(236,213,155,${1 - p})`;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(540, 960, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    },
  },
  whip: {
    duration: 0.5,
    draw(previous, next, t, p) {
      const e = easeInOut(p);
      const blur = Math.sin(Math.PI * p) * 34;
      drawInto(bufferA, () => drawScene(previous, t));
      drawInto(bufferB, () => drawScene(next, t));
      ctx.save();
      ctx.filter = `blur(${blur}px)`;
      ctx.drawImage(bufferA, -e * W, 0);
      ctx.drawImage(bufferB, (1 - e) * W, 0);
      ctx.restore();
    },
  },
};

// ---------- film grain, vignette, legal line ----------
let grainPattern;
function prepareGrain() {
  const noise = makeCanvas(256, 256);
  const n = noise.getContext('2d');
  const data = n.createImageData(256, 256);
  const rand = seededRandom(5);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.round(rand() * 255);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  n.putImageData(data, 0, 0);
  grainPattern = ctx.createPattern(noise, 'repeat');
}

function finishFrame(t) {
  const vignette = ctx.createRadialGradient(540, 960, 520, 540, 960, 1250);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  const frame = Math.floor(t * 30);
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.globalCompositeOperation = 'overlay';
  ctx.translate(-((frame * 97) % 256), -((frame * 57) % 256));
  ctx.fillStyle = grainPattern;
  ctx.fillRect(0, 0, W + 256, H + 256);
  ctx.restore();

  text(LEGAL.toUpperCase(), 540, 1872, {
    family: SANS, weight: 600, size: 18, spacing: 5, alpha: 0.55 * progress(t, 0.6, 0.6),
  });

  const fade = Math.max(1 - progress(t, 0, 0.35), progress(t, VIDEO_DURATION - 0.9, 0.9));
  if (fade > 0) {
    ctx.fillStyle = `rgba(0,0,0,${fade})`;
    ctx.fillRect(0, 0, W, H);
  }
}

window.renderFrame = (t) => {
  const index = SCENES.findLastIndex((scene) => t >= scene.start);
  const scene = SCENES[index];
  const transition = TRANSITIONS[scene.transition];
  const local = t - scene.start;

  ctx.save();
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  if (transition && local < transition.duration) {
    transition.draw(SCENES[index - 1], scene, t, local / transition.duration);
  } else {
    drawScene(scene, t);
  }
  ctx.restore();
  finishFrame(t);
};

window.videoReady = loadAssets().then(() => {
  prepareGrain();
  window.renderFrame(0);
});
