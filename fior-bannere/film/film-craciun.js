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
// The tiers of the Christmas tree: [top y, bottom y, half width at the bottom].
const TREE_TIERS = [0, 1, 2, 3].map((i) => {
  const height = TREE.bottom - TREE.top - 70;
  return [TREE.top + (height * i) / 4 * 0.82, TREE.top + (height * (i + 1)) / 4, TREE.halfWidth * (0.42 + (0.58 * (i + 1)) / 4)];
});
const treeHalfWidth = (y) => Math.max(0, ...TREE_TIERS.filter(([top, bottom]) => y >= top && y <= bottom)
  .map(([top, bottom, half]) => (half * (y - top)) / (bottom - top)));

// The tree silhouette (tiers and trunk): the particle mask.
function drawTree() {
  ctx.fillStyle = '#fff';
  TREE_TIERS.forEach(([top, bottom, half]) => {
    ctx.beginPath();
    ctx.moveTo(540, top);
    ctx.quadraticCurveTo(540 + half * 0.45, bottom - 60, 540 + half, bottom);
    ctx.quadraticCurveTo(540, bottom + 46, 540 - half, bottom);
    ctx.quadraticCurveTo(540 - half * 0.45, bottom - 60, 540, top);
    ctx.fill();
  });
  ctx.fillRect(540 - 36, TREE.bottom - 76, 72, 76);
}

// Decorations on the tree, appearing from `at` seconds: string lights on four swags, baubles, the star.
const BAUBLES = [[0.2, -0.5, 0], [0.34, 0.45, 1], [0.47, -0.15, 0], [0.56, 0.62, 1], [0.66, -0.62, 1], [0.76, 0.18, 0], [0.87, -0.3, 1], [0.9, 0.66, 0]];

function drawDecorations(local, at, alpha = 1) {
  const span = TREE.bottom - 76 - TREE.top;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'lighter';
  [0.3, 0.5, 0.7, 0.88].forEach((level, garland) => {
    const y0 = TREE.top + span * level - 60;
    for (let i = 0; i <= 14; i += 1) {
      const u = i / 14;
      const y = y0 + 70 * u + 26 * Math.sin(Math.PI * u);
      const x = 540 + (2 * u - 1) * treeHalfWidth(y) * 0.86 * (garland % 2 ? -1 : 1);
      const on = progress(local, at + garland * 0.12 + u * 0.3, 0.2) * (0.55 + 0.45 * Math.sin(local * 5 + i * 1.9 + garland));
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 20);
      glow.addColorStop(0, `rgba(255,236,190,${on})`);
      glow.addColorStop(0.25, `rgba(255,200,110,${0.55 * on})`);
      glow.addColorStop(1, 'rgba(255,190,90,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x - 20, y - 20, 40, 40);
    }
  });
  ctx.globalCompositeOperation = 'source-over';
  BAUBLES.forEach(([level, side, gold], i) => {
    const pop = easeOut(progress(local, at + 0.35 + i * 0.07, 0.35));
    if (pop <= 0) return;
    const y = TREE.top + span * level + 30;
    const x = 540 + side * treeHalfWidth(y) + Math.sin(local * 1.4 + i) * 3;
    const r = 26 * pop;
    const ball = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    ball.addColorStop(0, gold ? '#fff3cc' : '#ff8a8a');
    ball.addColorStop(0.45, gold ? '#d9ab4e' : '#c0202f');
    ball.addColorStop(1, gold ? '#6b4a16' : '#4a0710');
    ctx.fillStyle = ball;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(x - 5 * pop, y - r - 7 * pop, 10 * pop, 8 * pop);
  });
  const star = easeOut(progress(local, at + 0.7, 0.6));
  ctx.globalCompositeOperation = 'lighter';
  lightLeak(540, TREE.top - 16, 300 * star, '255,214,140', 0.55 * star * (0.85 + 0.15 * Math.sin(local * 6)));
  drawIcon('sparkle', 540, TREE.top - 16, 170 * star, { alpha: star, rotation: local * 0.25 });
  drawIcon('sparkle', 540, TREE.top - 16, 100 * star, { alpha: star, rotation: Math.PI / 4 - local * 0.25 });
  ctx.restore();
}

const CABIN = { x: 540, base: 1420, width: 400, height: 230, roof: 180 };
const WINDOW = { x: CABIN.x - 50, y: CABIN.base - 175, width: 100, height: 120 };

function fir(x, ground, height, color, snowColor) {
  const tiers = 4;
  for (let i = 0; i < tiers; i += 1) {
    const top = ground - height + (height * i * 0.72) / tiers;
    const bottom = ground - height + (height * (i + 1.25)) / tiers;
    const half = height * 0.34 * ((i + 1.4) / (tiers + 0.4));
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x + half, bottom);
    ctx.lineTo(x - half, bottom);
    ctx.fill();
    ctx.fillStyle = snowColor;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x + half * 0.5, top + (bottom - top) * 0.5);
    ctx.quadraticCurveTo(x, top + (bottom - top) * 0.34, x - half * 0.5, top + (bottom - top) * 0.5);
    ctx.fill();
  }
}

// Night landscape: starry sky, moon, firs, a snowed-in cabin with a warm window, snowy ground.
function drawNight(local) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#040914');
  sky.addColorStop(0.55, '#0c1e33');
  sky.addColorStop(1, '#1a3550');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const rand = seededRandom(77);
  for (let i = 0; i < 90; i += 1) {
    const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(local * (0.6 + rand() * 1.4) + rand() * 6));
    ctx.fillStyle = `rgba(225,235,255,${0.75 * twinkle})`;
    const size = 1.5 + rand() * 2.5;
    ctx.fillRect(rand() * W, rand() * 980, size, size);
  }
  lightLeak(850, 330, 420, '200,220,255', 0.3);
  ctx.fillStyle = '#eef3ff';
  ctx.beginPath();
  ctx.arc(850, 330, 64, 0, Math.PI * 2);
  ctx.fill();

  for (let x = -40; x < W + 80; x += 95 + rand() * 60) fir(x, 1330, 260 + rand() * 170, '#0b1b2c', 'rgba(150,175,205,.35)');
  ctx.fillStyle = '#0b1b2c';
  ctx.fillRect(0, 1320, W, 200);

  // cabin
  const { x, base, width, height, roof } = CABIN;
  ctx.fillStyle = '#0a1420';
  ctx.fillRect(x - width / 2, base - height, width, height);
  ctx.fillRect(x + width * 0.24, base - height - roof * 0.9, 46, roof * 0.7);
  ctx.beginPath();
  ctx.moveTo(x - width / 2 - 36, base - height + 6);
  ctx.lineTo(x, base - height - roof);
  ctx.lineTo(x + width / 2 + 36, base - height + 6);
  ctx.fill();
  ctx.fillStyle = '#c4d4e6';
  ctx.beginPath();
  ctx.moveTo(x - width / 2 - 44, base - height + 10);
  ctx.lineTo(x, base - height - roof - 12);
  ctx.lineTo(x + width / 2 + 44, base - height + 10);
  ctx.lineTo(x + width / 2 + 22, base - height + 14);
  ctx.quadraticCurveTo(x, base - height - roof + 40, x - width / 2 - 22, base - height + 14);
  ctx.fill();
  ctx.fillRect(x + width * 0.24 - 6, base - height - roof * 0.9 - 12, 58, 16);

  // the warm window, flickering like candle light
  const flicker = 0.9 + 0.1 * Math.sin(local * 7) * Math.sin(local * 2.3);
  const glass = ctx.createLinearGradient(0, WINDOW.y, 0, WINDOW.y + WINDOW.height);
  glass.addColorStop(0, '#ffe2a0');
  glass.addColorStop(1, '#ff9f3d');
  ctx.fillStyle = glass;
  ctx.fillRect(WINDOW.x, WINDOW.y, WINDOW.width, WINDOW.height);
  ctx.fillStyle = '#0a1420';
  ctx.fillRect(WINDOW.x + WINDOW.width / 2 - 4, WINDOW.y, 8, WINDOW.height);
  ctx.fillRect(WINDOW.x, WINDOW.y + WINDOW.height / 2 - 4, WINDOW.width, 8);
  lightLeak(x, WINDOW.y + WINDOW.height / 2, 330, '255,170,80', 0.6 * flicker);

  // smoke curling out of the chimney
  for (let i = 0; i < 14; i += 1) {
    const age = ((local * 0.22 + i / 14) % 1);
    const sx = x + width * 0.24 + 23 + Math.sin(age * 5 + i) * 26 * age + age * 60;
    const sy = base - height - roof * 0.9 - 20 - age * 330;
    const puff = ctx.createRadialGradient(sx, sy, 0, sx, sy, 26 + age * 70);
    puff.addColorStop(0, `rgba(190,205,225,${0.2 * (1 - age)})`);
    puff.addColorStop(1, 'rgba(190,205,225,0)');
    ctx.fillStyle = puff;
    ctx.fillRect(sx - 110, sy - 110, 220, 220);
  }

  // a shooting star crosses the sky once
  const fly = progress(local, 2.2, 0.9);
  if (fly > 0 && fly < 1) {
    const hx = lerp(300, 720, fly);
    const hy = lerp(240, 410, fly);
    const tail = ctx.createLinearGradient(hx - 230, hy - 94, hx, hy);
    tail.addColorStop(0, 'rgba(255,255,255,0)');
    tail.addColorStop(1, `rgba(255,250,230,${Math.sin(Math.PI * fly)})`);
    ctx.strokeStyle = tail;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx - 230, hy - 94);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    lightLeak(hx, hy, 90, '255,250,230', Math.sin(Math.PI * fly));
  }

  const snow = ctx.createLinearGradient(0, 1400, 0, H);
  snow.addColorStop(0, '#b9cbdf');
  snow.addColorStop(1, '#6f89a8');
  ctx.fillStyle = snow;
  ctx.beginPath();
  ctx.moveTo(0, 1470);
  ctx.bezierCurveTo(260, 1380, 420, 1430, 540, 1418);
  ctx.bezierCurveTo(700, 1404, 860, 1470, W, 1420);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.fill();
  // light from the window on the snow
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const pool = ctx.createRadialGradient(x, base + 70, 0, x, base + 70, 300);
  pool.addColorStop(0, `rgba(255,170,80,${0.4 * flicker})`);
  pool.addColorStop(1, 'rgba(255,170,80,0)');
  ctx.fillStyle = pool;
  ctx.scale(1, 0.4);
  ctx.fillRect(0, (base - 160) / 0.4, W, 520 / 0.4);
  ctx.restore();
}

const snowPass = (source, out, local, amount = 1) => gpu.pass('snow', {
  target: out, uniforms: { time: local, aspect: ASPECT, amount, wind: 0.25 }, textures: { source },
});

// ---------- scenes ----------
// Snowy fir branches hanging into the top corners, close to the lens (slightly out of focus).
const branchCanvas = makeCanvas(W, 520);

function paintBranches() {
  const rand = seededRandom(515);
  drawInto(branchCanvas, () => {
    [[-40, -30, 0.5, 520], [W + 40, -40, Math.PI - 0.55, 470], [-60, 120, 0.2, 330], [W + 60, 150, Math.PI - 0.2, 300]].forEach(([bx, by, angle, length]) => {
      for (let i = 0; i < 150; i += 1) {
        const along = rand() * length;
        const px = bx + Math.cos(angle) * along;
        const py = by + Math.sin(angle) * along + along * along * 0.0005;
        const side = rand() > 0.5 ? 1 : -1;
        const lean = angle + side * (0.7 + rand() * 0.5);
        const needle = 40 + rand() * 60 * (1 - along / length * 0.5);
        const shade = 0.3 + 0.7 * rand();
        ctx.strokeStyle = `rgb(${Math.round(8 + 20 * shade)},${Math.round(30 + 50 * shade)},${Math.round(30 + 34 * shade)})`;
        ctx.lineWidth = 3 + rand() * 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(lean) * needle, py + Math.sin(lean) * needle);
        ctx.stroke();
        if (rand() < 0.14) { // snow resting on the needles
          ctx.fillStyle = 'rgba(225,235,248,.6)';
          ctx.beginPath();
          ctx.ellipse(px + Math.cos(lean) * needle * 0.5, py + Math.sin(lean) * needle * 0.5 - 8, 22 + rand() * 20, 11 + rand() * 5, lean * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
  });
}

// Runs `draw` scaled by `scale` around the point (cx, cy).
function scaledAround(cx, cy, scale, draw) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);
  draw();
  ctx.restore();
}

function sceneNight(local, duration, out) {
  // a slow push-in towards the window; the branches close to the lens move faster (parallax)
  const push = easeInOut(local / duration);
  const windowY = WINDOW.y + WINDOW.height / 2;
  drawInto(layer, () => {
    scaledAround(CABIN.x, windowY, 1 + 0.1 * push, () => drawNight(local));
    scaledAround(CABIN.x, windowY, 1 + 0.32 * push, () => {
      ctx.filter = 'blur(3px)';
      ctx.drawImage(branchCanvas, 0, Math.sin(local * 0.9) * 6 - 6);
    });
    riseText('Afară', 540, 560, local, 0.7, { size: 170, shadow: 30 });
    riseText('ninge.', 540, 730, local, 1.1, { size: 170, italic: true, color: '#dfeaff', shadow: 30 });
  });
  gpu.pass('image', { target: T.a, textures: { source: layerTexture() } });
  snowPass(T.a, out, local, 0.85);
}

const GLOBE = { x: 540, y: 950, r: 400 };
const HEARTH = { base: [0.05, 0.018, 0.006], glow: [0.5, 0.2, 0.05] };

// The little world inside the snow globe: the bottle on a snow mound between two small firs.
function drawGlobeWorld(local) {
  const { x, y, r } = GLOBE;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  const air = ctx.createRadialGradient(x, y - 60, 40, x, y, r);
  air.addColorStop(0, 'rgba(255,214,150,.30)');
  air.addColorStop(1, 'rgba(120,60,20,.10)');
  ctx.fillStyle = air;
  ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  fir(x - 205, y + 260, 250, '#17402b', 'rgba(235,242,250,.9)');
  fir(x + 215, y + 270, 200, '#17402b', 'rgba(235,242,250,.9)');
  bottle(img.gutui, x, y + 262, 610, { reflection: 0, sweep: progress(local, 1.6, 1.2) || -1 });
  const mound = ctx.createLinearGradient(0, y + 200, 0, y + r);
  mound.addColorStop(0, '#f6f9fc');
  mound.addColorStop(1, '#b7c6d8');
  ctx.fillStyle = mound;
  ctx.beginPath();
  ctx.moveTo(x - r, y + 300);
  ctx.bezierCurveTo(x - 200, y + 200, x - 80, y + 262, x, y + 250);
  ctx.bezierCurveTo(x + 110, y + 236, x + 230, y + 200, x + r, y + 290);
  ctx.lineTo(x + r, y + r);
  ctx.lineTo(x - r, y + r);
  ctx.fill();
  ctx.restore();
}

// The pedestal of the globe, with the Fior plaque.
function drawGlobeBase() {
  const { x, y, r } = GLOBE;
  const top = y + r * 0.84;
  const metal = ctx.createLinearGradient(x - 330, 0, x + 330, 0);
  metal.addColorStop(0, '#5a3d14');
  metal.addColorStop(0.3, '#e9cf8f');
  metal.addColorStop(0.55, '#b98f43');
  metal.addColorStop(0.8, '#f1dca4');
  metal.addColorStop(1, '#5a3d14');
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.6)';
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 24;
  ctx.fillStyle = '#3a0c12';
  ctx.beginPath();
  ctx.moveTo(x - 255, top + 26);
  ctx.lineTo(x + 255, top + 26);
  ctx.lineTo(x + 318, top + 196);
  ctx.lineTo(x - 318, top + 196);
  ctx.fill();
  ctx.restore();
  const velvet = ctx.createLinearGradient(x - 320, 0, x + 320, 0);
  velvet.addColorStop(0, '#2a060b');
  velvet.addColorStop(0.5, '#7a1522');
  velvet.addColorStop(1, '#2a060b');
  ctx.fillStyle = velvet;
  ctx.beginPath();
  ctx.moveTo(x - 255, top + 26);
  ctx.lineTo(x + 255, top + 26);
  ctx.lineTo(x + 318, top + 196);
  ctx.lineTo(x - 318, top + 196);
  ctx.fill();
  ctx.fillStyle = metal;
  ctx.beginPath();
  ctx.ellipse(x, top + 22, 268, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 322, top + 182, 644, 26);
  ctx.fillRect(x - 120, top + 84, 240, 74);
  ctx.fillStyle = '#2a060b';
  ctx.fillRect(x - 114, top + 90, 228, 62);
  logo(x, top + 121, 150, { glow: 0.2 });
}

// The room behind the globe: a wooden mantel under warm bokeh lights, fir branches along it, two candles.
const MANTEL_Y = 1470;

function drawFlame(x, y, size, local, phase) {
  const flicker = 0.88 + 0.12 * Math.sin(local * 9 + phase) * Math.sin(local * 3.7 + phase * 2);
  const lean = Math.sin(local * 5 + phase) * size * 0.08;
  lightLeak(x, y - size * 0.4, size * 4.2, '255,170,70', 0.42 * flicker);
  const flame = ctx.createRadialGradient(x, y - size * 0.2, 0, x, y - size * 0.45, size);
  flame.addColorStop(0, '#fffbe6');
  flame.addColorStop(0.35, '#ffd66e');
  flame.addColorStop(0.75, 'rgba(255,140,40,.85)');
  flame.addColorStop(1, 'rgba(255,110,30,0)');
  ctx.fillStyle = flame;
  ctx.beginPath();
  ctx.moveTo(x - size * 0.34, y);
  ctx.quadraticCurveTo(x - size * 0.42, y - size * 0.6, x + lean, y - size * 1.25 * flicker);
  ctx.quadraticCurveTo(x + size * 0.42, y - size * 0.6, x + size * 0.34, y);
  ctx.quadraticCurveTo(x, y + size * 0.22, x - size * 0.34, y);
  ctx.fill();
}

function drawCandle(x, height, local, phase) {
  const top = MANTEL_Y - height;
  const wax = ctx.createLinearGradient(x - 34, 0, x + 34, 0);
  wax.addColorStop(0, '#8a1622');
  wax.addColorStop(0.45, '#d8394a');
  wax.addColorStop(1, '#5c0c15');
  ctx.fillStyle = wax;
  ctx.fillRect(x - 34, top, 68, height);
  ctx.fillStyle = '#e8616f';
  ctx.beginPath();
  ctx.ellipse(x, top, 34, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a1408';
  ctx.fillRect(x - 2, top - 16, 4, 18);
  drawFlame(x, top - 14, 44, local, phase);
}

function drawRoom(local) {
  const wood = ctx.createLinearGradient(0, MANTEL_Y, 0, H);
  wood.addColorStop(0, '#5a3015');
  wood.addColorStop(0.06, '#3a1d0b');
  wood.addColorStop(1, '#120803');
  ctx.fillStyle = wood;
  ctx.fillRect(0, MANTEL_Y, W, H - MANTEL_Y);
  ctx.fillStyle = 'rgba(255,214,150,.35)';
  ctx.fillRect(0, MANTEL_Y, W, 3);
  // the polished wood mirrors the candle light and the globe
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  [[118, 0.3, 130], [968, 0.26, 120], [540, 0.22, 330]].forEach(([x, strength, width]) => {
    const sheen = ctx.createRadialGradient(x, MANTEL_Y + 10, 0, x, MANTEL_Y + 10, width);
    sheen.addColorStop(0, `rgba(255,170,80,${strength * (0.9 + 0.1 * Math.sin(local * 7 + x))})`);
    sheen.addColorStop(1, 'rgba(255,170,80,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(x - width, MANTEL_Y, width * 2, 230);
  });
  ctx.restore();
  const rand = seededRandom(404);
  for (let i = 0; i < 520; i += 1) { // fir garland lying on the mantel
    const x = rand() * W;
    const y = MANTEL_Y + 4 - rand() * 34 * (0.4 + Math.abs(Math.sin(x / 170)));
    const lean = -Math.PI / 2 + (rand() - 0.5) * 2.4;
    const length = 22 + rand() * 34;
    const shade = 0.35 + 0.65 * rand();
    ctx.strokeStyle = `rgb(${Math.round(12 + 26 * shade)},${Math.round(46 + 70 * shade)},${Math.round(26 + 30 * shade)})`;
    ctx.lineWidth = 2 + rand() * 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(lean) * length, y + Math.sin(lean) * length);
    ctx.stroke();
  }
  drawCandle(118, 250, local, 0);
  drawCandle(968, 190, local, 2.1);
}

// Runs `draw` rotated by `angle` around the point (px, py).
function rotatedAround(px, py, angle, draw) {
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(angle);
  ctx.translate(-px, -py);
  draw();
  ctx.restore();
}

function sceneInside(local, duration, out) {
  const settle = easeOut(progress(local, 0, 3.2));
  // someone has just shaken the globe and put it down: it rocks on the mantel and settles
  const since = Math.max(local - 0.5, 0); // the zoom through the window ends first
  const rock = 0.085 * Math.exp(-2.2 * since) * Math.sin(9.5 * since);
  const reach = MANTEL_Y - GLOBE.y;
  const centre = uvPoint(GLOBE.x + reach * Math.sin(rock), MANTEL_Y - reach * Math.cos(rock));
  gpu.pass('bokeh', { target: T.c, uniforms: { time: local, aspect: ASPECT, density: 0.3, baseColor: HEARTH.base, glowColor: HEARTH.glow.map((v) => v * (0.9 + 0.1 * Math.sin(local * 6))) } });
  drawInto(backdrop, () => drawRoom(local));
  gpu.pass('compose', { target: T.a, textures: { base: T.c, overlay: gpu.upload(backdrop) } });
  drawInto(layer, () => rotatedAround(GLOBE.x, MANTEL_Y, rock, () => drawGlobeWorld(local)));
  gpu.pass('globe', {
    target: T.b,
    uniforms: { time: local, aspect: ASPECT, center: centre, radius: GLOBE.r / H, shake: 1 - settle },
    textures: { base: T.a, inner: layerTexture() },
  });
  drawInto(textLayer, () => {
    rotatedAround(GLOBE.x, MANTEL_Y, rock, drawGlobeBase);
    goldDust(local, 90, 9, { speed: 20, alpha: 0.7 });
    riseText('Înăuntru,', 540, 300, local, 0.7, { size: 120 });
    riseText('un fior.', 540, 430, local, 1.0, { size: 120, italic: true, gold: true });
  });
  gpu.pass('compose', { target: out, textures: { base: T.b, overlay: textTexture() } });
}

// A wrapped present standing on `baseY`: box, lid, ribbon and a bow.
function drawGift(x, baseY, width, height, [dark, mid, light], ribbon) {
  const paper = ctx.createLinearGradient(x - width / 2, 0, x + width / 2, 0);
  paper.addColorStop(0, dark);
  paper.addColorStop(0.45, mid);
  paper.addColorStop(1, dark);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.5)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = paper;
  ctx.fillRect(x - width / 2, baseY - height, width, height);
  ctx.restore();
  ctx.fillStyle = light;
  ctx.fillRect(x - width / 2 - 8, baseY - height - 4, width + 16, height * 0.2);
  ctx.fillStyle = ribbon;
  ctx.fillRect(x - width * 0.09, baseY - height - 4, width * 0.18, height + 4);
  drawBow(x, baseY - height - 8, width * 0.62);
}

const GIFT_PAPERS = { red: ['#4a0710', '#b3162a', '#d8394a'], gold: ['#6b4a16', '#d9ab4e', '#f1dca4'], green: ['#0c2a18', '#1f6b3c', '#2f8a50'] };
const FLOOR_Y = 1500;

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

// A red satin bow, about `size` px wide, centred on its knot.
function drawBow(x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 220, size / 220);
  const satin = ctx.createLinearGradient(-110, -40, 110, 50);
  [[0, '#6d0a16'], [0.25, '#e23b4a'], [0.5, '#96101f'], [0.75, '#ea6c76'], [1, '#6d0a16']].forEach(([at, color]) => satin.addColorStop(at, color));
  ctx.fillStyle = satin;
  ctx.strokeStyle = 'rgba(50,4,9,.6)';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = 'rgba(0,0,0,.45)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;
  [-1, 1].forEach((side) => {
    ctx.beginPath(); // tail
    ctx.moveTo(0, 4);
    ctx.lineTo(side * 58, 118);
    ctx.lineTo(side * 34, 106);
    ctx.lineTo(side * 20, 126);
    ctx.lineTo(side * -4, 12);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath(); // loop
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(side * 44, -76, side * 128, -52, side * 108, 6);
    ctx.bezierCurveTo(side * 122, 56, side * 42, 42, 0, 8);
    ctx.fill();
    ctx.stroke();
  });
  ctx.beginPath();
  ctx.roundRect(-17, -20, 34, 40, 11);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// A glass bauble swinging in on its string from (hangX, -90); `icon` (optional) is drawn on it.
function drawBauble(cl, { icon = null, colors, hangX = 540, length = 900, r = 250 }) {
  const angle = 0.42 * Math.exp(-3.2 * cl) * Math.cos(10 * cl);
  const x = hangX + length * Math.sin(angle);
  const y = -90 + length * Math.cos(angle);
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(hangX, -90);
  ctx.lineTo(x, y - r * 1.12);
  ctx.stroke();
  const ball = ctx.createRadialGradient(x - r * 0.38, y - r * 0.4, r * 0.08, x, y, r);
  ball.addColorStop(0, colors[0]);
  ball.addColorStop(0.42, colors[1]);
  ball.addColorStop(1, colors[2]);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.5)';
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 30;
  ctx.fillStyle = ball;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const cap = ctx.createLinearGradient(x - 44, 0, x + 44, 0);
  [[0, '#6b4a16'], [0.4, '#f1dca4'], [1, '#8f6f2e']].forEach(([at, color]) => cap.addColorStop(at, color));
  ctx.fillStyle = cap;
  ctx.fillRect(x - r * 0.17, y - r * 1.14, r * 0.34, r * 0.19);
  if (icon) drawIcon(icon, x, y + 6, r * 1.15, { alpha: 0.9 });
  ctx.save(); // highlight
  ctx.globalCompositeOperation = 'lighter';
  const shine = ctx.createRadialGradient(x - r * 0.42, y - r * 0.46, 0, x - r * 0.42, y - r * 0.46, r * 0.5);
  shine.addColorStop(0, 'rgba(255,255,255,.55)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

const GIFTS = [
  [{ icon: 'quince-branch-dark', word: 'Cald', sub: 'și auriu', colors: ['#fff0c4', '#d9912b', '#5e3408'] }, { bottles: ['gutui'], name: 'Lichior de gutui', label: 'PENTRU SERILE LUNGI', stage: STAGES.gutui }],
  [{ icon: 'berry', word: 'Roșul', sub: 'sărbătorilor', colors: ['#ffb0b0', '#b3162a', '#3d0510'] }, { bottles: ['sangria'], name: 'Berry Sangria', label: 'ZMEURĂ · MURE · SCORȚIȘOARĂ', stage: STAGES.sangria }],
  [{ icon: 'snowflake', word: 'Proaspăt', sub: 'ca prima zăpadă', colors: ['#e6ffd9', '#3f8f45', '#0f3316'] }, { bottles: ['hugo'], name: 'Elderberry Hugo', label: 'FLORI DE SOC · LĂMÂIE · MENTĂ', stage: STAGES.hugo }],
  [{ icon: 'citrus-dark', word: 'Pentru noaptea', sub: 'dintre ani', colors: ['#fff6c9', '#d6ab1d', '#5c4302'] }, { bottles: HL_ALL, name: 'Hard Lemonade', label: 'PATRU AROME', stage: STAGES.lemon }],
];

// Bows on the bottle necks.
const bowOn = (item, baseY) => drawBow(item.x, baseY - item.height * 0.63, item.height * 0.27);

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
  gpu.pass('shock', { target: out, uniforms: { age: cl, center: [0.5, 0.5], aspect: ASPECT, strength: 1 }, textures: { source: T.b } });
}

const RING = ['gutui', 'hlZmeura', 'sangria', 'hlMenta', 'hugo', 'hlGhimbir', 'hlSoc'];

// A fir wreath with berries, painted once; the lights and the bow are added when it is drawn.
const WREATH = { size: 760, radius: 270 };
const wreathCanvas = makeCanvas(WREATH.size, WREATH.size);

function paintWreath() {
  const rand = seededRandom(303);
  const c = WREATH.size / 2;
  drawInto(wreathCanvas, () => {
    for (let i = 0; i < 2600; i += 1) {
      const angle = rand() * Math.PI * 2;
      const radius = WREATH.radius + (rand() - 0.5) * 120 * (0.4 + 0.6 * rand());
      const x = c + Math.cos(angle) * radius;
      const y = c + Math.sin(angle) * radius;
      const lean = angle + Math.PI / 2 + (rand() - 0.5) * 1.5;
      const length = 26 + rand() * 34;
      const shade = 0.35 + 0.65 * rand();
      ctx.strokeStyle = `rgb(${Math.round(14 + 30 * shade)},${Math.round(52 + 78 * shade)},${Math.round(30 + 34 * shade)})`;
      ctx.lineWidth = 2 + rand() * 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(lean) * length, y + Math.sin(lean) * length);
      ctx.stroke();
    }
    for (let i = 0; i < 9; i += 1) {
      const angle = (i / 9) * Math.PI * 2 + 0.35;
      for (let k = 0; k < 3; k += 1) {
        const x = c + Math.cos(angle) * WREATH.radius + (k - 1) * 20;
        const y = c + Math.sin(angle) * WREATH.radius + (k === 1 ? -14 : 6);
        const berry = ctx.createRadialGradient(x - 4, y - 5, 1, x, y, 13);
        berry.addColorStop(0, '#ff9c9c');
        berry.addColorStop(0.4, '#c5182b');
        berry.addColorStop(1, '#4a0710');
        ctx.fillStyle = berry;
        ctx.beginPath();
        ctx.arc(x, y, 13, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
}

function drawWreath(local, cx, cy, appear) {
  const scale = 0.85 + 0.15 * appear;
  ctx.save();
  ctx.globalAlpha *= appear;
  ctx.translate(cx, cy);
  ctx.rotate(Math.sin(local * 0.5) * 0.03);
  ctx.scale(scale, scale);
  ctx.drawImage(wreathCanvas, -WREATH.size / 2, -WREATH.size / 2);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 22; i += 1) {
    const angle = (i / 22) * Math.PI * 2;
    const x = Math.cos(angle) * (WREATH.radius + (i % 2 ? 18 : -18));
    const y = Math.sin(angle) * (WREATH.radius + (i % 2 ? 18 : -18));
    const on = 0.5 + 0.5 * Math.sin(local * 4 + i * 2.4);
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 22);
    glow.addColorStop(0, `rgba(255,238,196,${0.95 * on})`);
    glow.addColorStop(0.3, `rgba(255,200,110,${0.5 * on})`);
    glow.addColorStop(1, 'rgba(255,190,90,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 22, y - 22, 44, 44);
  }
  ctx.globalCompositeOperation = 'source-over';
  drawBow(0, WREATH.radius + 6, 200);
  ctx.restore();
}

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

// ---------- timeline ----------
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
