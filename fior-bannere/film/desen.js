// Shared 2D drawing helpers for the Fior films (film.js, film-2.js).
// Load before the film script; the film sets `ctx` to the canvas it draws on.

const W = 1080;
const H = 1920;

const COLORS = { gold: '#c9a55a', goldLight: '#ecd59b', cream: '#f8f0e3' };
const SERIF = 'Playfair';
const SANS = '"Open Sans"';
const LEGAL = 'Consumați cu responsabilitate!';

let ctx = null;

const IMAGE_FILES = {
  logo: 'logo-fior-auriu.png',
  gutui: 'lichior-gutui.png',
  sangria: 'berry-sangria.png',
  hugo: 'elderberry-hugo.png',
  hlZmeura: 'hl-zmeura-lamaie.png',
  hlMenta: 'hl-lamaie-menta.png',
  hlGhimbir: 'hl-lamaie-verde-ghimbir.png',
  hlSoc: 'hl-soc-lamaie.png',
  fotoJob: 'foto-cuplu-apus.jpg',
  fotoPlaja: 'foto-plaja.jpg',
  fotoGutui: 'foto-lichior-gutui.jpg',
  fotoSangria: 'foto-berry-sangria.jpg',
  fotoHugo: 'foto-elderberry-hugo.jpg',
  fotoHl: 'foto-hl-zmeura.jpg',
};
const img = {};

// ---------- helpers ----------
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const progress = (t, start, duration) => clamp((t - start) / duration);
const easeOut = (p) => 1 - (1 - p) ** 3;
const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);
const lerp = (a, b, p) => a + (b - a) * p;

function seededRandom(seed) {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

function makeCanvas(width = W, height = H) {
  const element = document.createElement('canvas');
  element.width = width;
  element.height = height;
  return element;
}

// Runs a drawing function against another canvas (used for transitions and effects).
function drawInto(target, draw) {
  const previous = ctx;
  ctx = target.getContext('2d');
  ctx.clearRect(0, 0, target.width, target.height);
  draw();
  ctx = previous;
}

function cover(image, x, y, w, h, scale = 1, focusX = 0.5, focusY = 0.5) {
  const s = Math.max(w / image.width, h / image.height) * scale;
  const dw = image.width * s;
  const dh = image.height * s;
  ctx.drawImage(image, x + (w - dw) * focusX, y + (h - dh) * focusY, dw, dh);
}

function radialBackground(x, y, radius, stops) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
}

// `maxWidth` (optional) shrinks the font until the line fits.
function text(str, x, y, { size = 60, family = SERIF, weight = 400, italic = false, color = COLORS.cream,
  align = 'center', alpha = 1, blur = 0, spacing = 0, shadow = 0, maxWidth = 0 } = {}) {
  if (alpha <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  const font = (px) => `${italic ? 'italic ' : ''}${weight} ${px}px ${family}`;
  ctx.font = font(size);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.letterSpacing = `${spacing}px`;
  if (maxWidth) {
    const width = ctx.measureText(str).width;
    if (width > maxWidth) ctx.font = font(Math.floor((size * maxWidth) / width));
  }
  if (blur > 0.3) ctx.filter = `blur(${blur}px)`;
  if (shadow) {
    ctx.shadowColor = 'rgba(0,0,0,.6)';
    ctx.shadowBlur = shadow;
    ctx.shadowOffsetY = 4;
  }
  ctx.fillText(str, x, y);
  ctx.restore();
}

// Text that rises out of a blur, starting at `start` seconds of the scene.
function reveal(str, x, y, local, start, options = {}) {
  const p = easeOut(progress(local, start, 0.75));
  text(str, x, y + (1 - p) * 46, { ...options, alpha: p * (options.alpha ?? 1), blur: (1 - p) * 16 });
}

const scratch = makeCanvas();
const scratchReflection = makeCanvas();

// Bottle cut-out with an optional moving light sweep, a floor reflection and a contact glow.
function bottle(image, cx, baseY, height, { sweep = -1, reflection = 0.26, alpha = 1, brightness = 1 } = {}) {
  const width = (height * image.width) / image.height;
  const x = cx - width / 2;
  const y = baseY - height;

  // contact glow on the floor
  ctx.save();
  ctx.globalAlpha = alpha * 0.55;
  const glow = ctx.createRadialGradient(cx, baseY, 0, cx, baseY, width * 1.4);
  glow.addColorStop(0, 'rgba(255,214,150,.35)');
  glow.addColorStop(1, 'rgba(255,214,150,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - width * 1.5, baseY - width * 0.4, width * 3, width * 0.8);
  ctx.restore();

  // reflection: flipped copy that fades out
  if (reflection) {
    const rh = height * 0.32;
    scratchReflection.width = Math.ceil(width);
    scratchReflection.height = Math.ceil(rh);
    const r = scratchReflection.getContext('2d');
    r.save();
    r.translate(0, rh);
    r.scale(1, -1);
    r.drawImage(image, 0, rh - height, width, height);
    r.restore();
    r.globalCompositeOperation = 'destination-in';
    const fade = r.createLinearGradient(0, 0, 0, rh);
    fade.addColorStop(0, 'rgba(0,0,0,1)');
    fade.addColorStop(1, 'rgba(0,0,0,0)');
    r.fillStyle = fade;
    r.fillRect(0, 0, width, rh);
    r.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.globalAlpha = alpha * reflection;
    if (brightness !== 1) ctx.filter = `brightness(${brightness})`;
    ctx.drawImage(scratchReflection, x, baseY + 2);
    ctx.restore();
  }

  // the bottle itself, with the light sweep composited only on its pixels
  scratch.width = Math.ceil(width);
  scratch.height = Math.ceil(height);
  const s = scratch.getContext('2d');
  s.drawImage(image, 0, 0, width, height);
  if (sweep >= 0 && sweep <= 1) {
    s.globalCompositeOperation = 'source-atop';
    const bandX = lerp(-width * 1.2, width * 2.2, sweep);
    const band = s.createLinearGradient(bandX - width * 0.6, 0, bandX + width * 0.6, height * 0.25);
    band.addColorStop(0, 'rgba(255,245,220,0)');
    band.addColorStop(0.5, 'rgba(255,245,220,.55)');
    band.addColorStop(1, 'rgba(255,245,220,0)');
    s.fillStyle = band;
    s.fillRect(0, 0, width, height);
    s.globalCompositeOperation = 'source-over';
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.filter = `drop-shadow(0 26px 30px rgba(0,0,0,.45))${brightness !== 1 ? ` brightness(${brightness})` : ''}`;
  ctx.drawImage(scratch, x, y);
  ctx.restore();
}

// Gold logo with glow and an optional shimmer sweep (0..1).
const logoBuffer = makeCanvas(760, 416);
function logo(cx, cy, width, { alpha = 1, glow = 0.6, shimmer = -1 } = {}) {
  const height = (width * img.logo.height) / img.logo.width;
  logoBuffer.width = Math.ceil(width);
  logoBuffer.height = Math.ceil(height);
  const b = logoBuffer.getContext('2d');
  b.drawImage(img.logo, 0, 0, width, height);
  if (shimmer >= 0 && shimmer <= 1) {
    b.globalCompositeOperation = 'source-atop';
    const bandX = lerp(-width * 0.4, width * 1.4, shimmer);
    const band = b.createLinearGradient(bandX - 120, 0, bandX + 120, height);
    band.addColorStop(0, 'rgba(255,255,255,0)');
    band.addColorStop(0.5, 'rgba(255,255,240,.95)');
    band.addColorStop(1, 'rgba(255,255,255,0)');
    b.fillStyle = band;
    b.fillRect(0, 0, width, height);
    b.globalCompositeOperation = 'source-over';
  }
  const x = cx - width / 2;
  const y = cy - height / 2;
  ctx.save();
  ctx.globalAlpha = alpha * glow;
  ctx.globalCompositeOperation = 'lighter';
  ctx.filter = 'blur(26px)';
  ctx.drawImage(logoBuffer, x, y);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(logoBuffer, x, y);
  ctx.restore();
}

function lightLeak(x, y, radius, rgb, alpha) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const leak = ctx.createRadialGradient(x, y, 0, x, y, radius);
  leak.addColorStop(0, `rgba(${rgb},${alpha})`);
  leak.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = leak;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function blurredBackdrop(image, scale = 1.25, brightness = 0.5) {
  ctx.save();
  ctx.filter = `blur(42px) brightness(${brightness})`;
  cover(image, -100, -100, W + 200, H + 200, scale);
  ctx.restore();
}

function photoBand(image, top, size, scale, focusX = 0.5, focusY = 0.5) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.6)';
  ctx.shadowBlur = 60;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, top, W, size);
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, top, W, size);
  ctx.clip();
  cover(image, 0, top, W, size, scale, focusX, focusY);
  ctx.restore();
}

// Floating gold dust, seeded so every render is identical.
function goldDust(t, count, seed, { speed = 40, alpha = 0.7 } = {}) {
  const rand = seededRandom(seed);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < count; i += 1) {
    const x = rand() * W;
    const y = (((rand() * H - t * speed * (0.5 + rand())) % H) + H) % H;
    const size = 1 + rand() * 3.2;
    const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(t * (1 + rand() * 2) + rand() * 6));
    ctx.globalAlpha = alpha * twinkle;
    ctx.fillStyle = '#ffdc9a';
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();
}

const icons = {};

// Loads a line-art icon from the shared SVG sprite (FIOR_SPRITE in ../fior.js) into `icons[key]`, with even lines.
function loadIcon(id, color = COLORS.goldLight, key = id) {
  const viewBox = FIOR_SPRITE.match(new RegExp(`<symbol id="${id}" viewBox="([^"]+)"`))[1];
  const [, , boxWidth, boxHeight] = viewBox.split(' ').map(Number);
  const width = 920;
  const height = Math.round((width * boxHeight) / boxWidth);
  const defs = FIOR_SPRITE.match(/<defs>[\s\S]*<\/defs>/)[0];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}" color="${color}">`
    + `<style>*{stroke-width:${(boxWidth / 150).toFixed(2)}px !important}</style>${defs}<use href="#${id}"/></svg>`;
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve((icons[key] = image));
    image.onerror = () => reject(new Error(`Icon ${id} failed`));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

function drawIcon(id, cx, cy, width, { alpha = 1, rotation = 0 } = {}) {
  const icon = icons[id];
  const height = (width * icon.height) / icon.width;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.drawImage(icon, -width / 2, -height / 2, width, height);
  ctx.restore();
}

// Loads every image in IMAGE_FILES into `img` and waits for the brand fonts.
function loadAssets() {
  return Promise.all([
    ...Object.entries(IMAGE_FILES).map(([key, file]) => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve((img[key] = image));
      image.onerror = () => reject(new Error(`Missing image ${file}`));
      image.src = `../imagini/${file}`;
    })),
    // The sample text makes the browser load the latin-ext faces too; without it the first frame that
    // shows ă, ș or ț would be drawn with a fallback font.
    ...[`400 100px ${SERIF}`, `italic 400 100px ${SERIF}`, `600 100px ${SERIF}`, `italic 600 100px ${SERIF}`,
      `700 40px ${SANS}`, `600 40px ${SANS}`, `400 40px ${SANS}`].map((font) => document.fonts.load(font, 'Fior ăâîșț')),
  ]);
}
