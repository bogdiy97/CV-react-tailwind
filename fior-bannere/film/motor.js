// Shared WebGL engine for the Fior films (film-2.js, film-produs.js): canvas layers, lit stages,
// photos seen through liquid, transitions, particles and the post-processing chain
// (bloom, chromatic aberration, grain, the legal line, fades).
// Load after desen.js, gpu.js and shadere.js. Chromium needs --allow-file-access-from-files.

const ASPECT = W / H;

const gpu = new Gpu(document.getElementById('film'));
const layer = makeCanvas(); // photos and bottles (bottles also block the light rays)
const textLayer = makeCanvas();
const overlay = makeCanvas(); // the legal line, sharp and unaffected by the effects

const uvRect = (x, y, width, height) => [x / W, 1 - (y + height) / H, width / W, height / H];
const uvPoint = (x, y) => [x / W, 1 - y / H];

const T = {};
let overlayTexture;

function setupEngine() {
  Object.entries(SHADERS).forEach(([name, source]) => gpu.program(name, source));
  gpu.program('particles', PARTICLE_FS, { vertex: PARTICLE_VS, raw: true });
  ['a', 'b', 'c', 'frameA', 'frameB', 'out'].forEach((name) => { T[name] = gpu.target(name); });
  T.gold = gpu.target('gold', 0.5);
  T.liquid = gpu.target('liquid', 1);
  T.rays = gpu.target('rays', 0.5);
  T.bloomA = gpu.target('bloomA', 0.25);
  T.bloomB = gpu.target('bloomB', 0.25);
  drawInto(overlay, () => text(LEGAL.toUpperCase(), 540, 1872, { family: SANS, weight: 600, size: 18, spacing: 5, alpha: 0.6 }));
  overlayTexture = gpu.upload(overlay);
}

const layerTexture = () => gpu.upload(layer);
const textTexture = () => gpu.upload(textLayer);

// `count` random points inside the opaque pixels of `image`, placed at `rect` on screen.
function samplePoints(image, rect, count, seed) {
  const sample = makeCanvas(Math.round(rect.width), Math.round(rect.height));
  sample.getContext('2d').drawImage(image, 0, 0, sample.width, sample.height);
  const alpha = sample.getContext('2d').getImageData(0, 0, sample.width, sample.height).data;
  const rand = seededRandom(seed);
  const points = [];
  while (points.length < count) {
    const x = Math.floor(rand() * sample.width);
    const y = Math.floor(rand() * sample.height);
    if (alpha[(y * sample.width + x) * 4 + 3] >= 128) points.push([rect.x + x, rect.y + y]);
  }
  return points;
}

// Particle buffer for the `particles` program: points inside `image`; with `morphTo` ({ image, rect }) every
// particle also gets a second target (use it with morph = 1). Pass `layout` on to gpu.points.
function particlesFrom(image, rect, count, seed, morphTo = null) {
  const first = samplePoints(image, rect, count, seed);
  const second = morphTo ? samplePoints(morphTo.image, morphTo.rect, count, seed + 1) : null;
  const rand = seededRandom(seed + 2);
  const stride = morphTo ? 8 : 6;
  const data = new Float32Array(count * stride);
  first.forEach((point, i) => {
    data.set([...point, rand(), rand(), rand(), rand(), ...(second ? second[i] : [])], i * stride);
  });
  return { count, data, layout: morphTo ? [2, 4, 2] : [2, 4] };
}

// Bottles in front of a light: rays, caustic floor, glow colours. `drawBottles` paints the layer.
function litStage(local, out, { drawBottles, lightY, floorY, base, glow, ray, intensity = 1.6, caustics = 1, drawText }) {
  drawInto(layer, drawBottles);
  const bottles = layerTexture();
  const light = uvPoint(540, lightY);
  gpu.pass('rays', {
    target: T.rays,
    uniforms: { lightPos: light, lightRadius: 0.15, aspect: ASPECT, rayColor: ray, intensity: intensity * (1 + 0.15 * Math.sin(local * 2)) },
    textures: { occluder: bottles },
  });
  gpu.pass('stage', {
    target: T.a,
    uniforms: { time: local, lightPos: light, floorY: 1 - floorY / H, aspect: ASPECT, baseColor: base, glowColor: glow, caustics },
    textures: { rays: T.rays },
  });
  gpu.pass('compose', { target: T.b, textures: { base: T.a, overlay: bottles } });
  drawInto(textLayer, drawText);
  gpu.pass('compose', { target: out, textures: { base: T.b, overlay: textTexture() } });
}

// Real size relation between the bottles: the 500 ml liqueur is the tallest, the 275 ml Hard Lemonade the shortest.
const BOTTLE_SCALE = { gutui: 1, sangria: 0.92, hugo: 0.9 };
const bottleScale = (key) => BOTTLE_SCALE[key] ?? 0.72;

// Bottles side by side: [{ key, x, height }].
function bottleRow(keys, height, gap) {
  return keys.map((key, i) => ({ key, x: 540 + (i - (keys.length - 1) / 2) * gap, height: height * bottleScale(key) }));
}

// The bottles in `ring` on a slow carousel, in front of bokeh lights and light rays; `drawText` paints the words,
// `drawBehind` (optional) paints behind the bottles and, like them, blocks the rays.
function orbitScene(local, duration, out, { ring, drawText, drawBehind = null, base = [0.02, 0.012, 0.004], glow = [0.28, 0.18, 0.05], ray = [1.0, 0.8, 0.45] }) {
  gpu.pass('bokeh', { target: T.a, uniforms: { time: local, aspect: ASPECT, density: 0.35, baseColor: base, glowColor: glow } });

  const spin = lerp(-Math.PI * 2 * 0.85, 0, easeOut(progress(local, 0, duration - 0.4)));
  const tilt = lerp(0.5, 1.15, easeInOut(progress(local, 0, duration)));
  drawInto(layer, () => {
    if (drawBehind) drawBehind();
    ring.map((key, i) => {
      const angle = spin + (i * Math.PI * 2) / ring.length;
      const depth = Math.cos(angle);
      return { key, x: 540 + 410 * Math.sin(angle), depth, near: (depth + 1) / 2 };
    }).sort((a, b) => a.depth - b.depth).forEach((item) => {
      bottle(img[item.key], item.x, 1430 + 90 * item.depth * tilt, 960 * bottleScale(item.key) * (0.6 + 0.4 * item.near), {
        alpha: 0.5 + 0.5 * item.near, brightness: 0.45 + 0.55 * item.near, reflection: 0.24,
      });
    });
  });
  const bottles = layerTexture();
  gpu.pass('rays', {
    target: T.rays,
    uniforms: { lightPos: uvPoint(540, 1150), lightRadius: 0.12, aspect: ASPECT, rayColor: ray, intensity: 1.3 },
    textures: { occluder: bottles },
  });
  gpu.pass('add', { target: T.b, uniforms: { amount: 1 }, textures: { base: T.a, light: T.rays } });
  gpu.pass('compose', { target: T.a, textures: { base: T.b, overlay: bottles } });
  drawInto(textLayer, drawText);
  gpu.pass('compose', { target: out, textures: { base: T.a, overlay: textTexture() } });
}

// ---------- beat cuts: cards that last one beat ----------
function beatLabels(name, label, cl) {
  const slide = easeOut(progress(cl, 0, 0.25));
  logo(540, 210, 230, { glow: 0.3 });
  text(label, 540, 1610, { family: SANS, weight: 700, size: 23, spacing: 8, color: COLORS.goldLight, alpha: slide });
  text(name, 540 + (1 - slide) * 70, 1725, { size: 104, alpha: slide, shadow: 24, maxWidth: 980 });
}

// A line-art icon with a word (and an italic second line) on bokeh lights. `cl` = seconds since the cut.
function iconCard(cl, out, { icon, word, sub, stage, time = cl }) {
  gpu.pass('bokeh', { target: T.a, uniforms: { time, aspect: ASPECT, density: 0.3, baseColor: stage.base, glowColor: stage.glow.map((v) => v * 0.8) } });
  drawInto(textLayer, () => {
    const pop = easeOut(progress(cl, 0, 0.3));
    logo(540, 210, 230, { glow: 0.3 });
    drawIcon(icon, 540, 820, 460 * (1.15 - 0.15 * pop), { alpha: pop, rotation: (1 - pop) * -0.2 });
    text(word, 540, 1340, { size: 130, alpha: pop, shadow: 24, maxWidth: 960 });
    if (sub) text(sub, 540, 1460, { size: 96, italic: true, color: COLORS.goldLight, alpha: pop, shadow: 24, maxWidth: 960 });
  });
  gpu.pass('compose', { target: out, textures: { base: T.a, overlay: textTexture() } });
}

// Bottles on a lit stage with their name underneath. decorate(item, baseY) may draw on top of each bottle.
function bottleCut(cl, out, { bottles, name, label, stage, zoomIn = 1, decorate = null }) {
  litStage(cl, out, {
    ...stage, lightY: 980, floorY: 1500, intensity: 1.8,
    drawBottles: () => bottleRow(bottles, 1000 * (0.92 + 0.08 * zoomIn), 240).forEach((item) => {
      bottle(img[item.key], item.x, 1500, item.height, { reflection: 0.3 });
      if (decorate) decorate(item, 1500);
    }),
    drawText: () => beatLabels(name, label, cl),
  });
}

function anamorphicFlare(y, strength) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  [[3, 0.85], [22, 0.12]].forEach(([height, alpha]) => {
    const line = ctx.createLinearGradient(0, 0, W, 0);
    line.addColorStop(0, 'rgba(255,214,150,0)');
    line.addColorStop(0.5, `rgba(255,226,170,${alpha * strength})`);
    line.addColorStop(1, 'rgba(255,214,150,0)');
    ctx.fillStyle = line;
    ctx.fillRect(0, y - height / 2, W, height);
  });
  ctx.restore();
}

// Molten liquid (full resolution) with a relief mask (logo or word) that drains away with a burning edge
// and reveals the card painted by `drawCard`. emboss and drain are 0..1.
function liquidReveal(local, out, { palette, relief, rect = [0, 0, 1, 1], zoom = 1, emboss, drain, drawCard }) {
  gpu.pass('gold', {
    target: T.liquid,
    uniforms: { ...palette, bump: 1, time: local + 3, aspect: ASPECT, zoom, emboss, logoRect: rect },
    textures: { logo: relief },
  });
  drawInto(textLayer, drawCard);
  gpu.pass('burn', { target: out, uniforms: { time: local, aspect: ASPECT, progress: drain }, textures: { srcA: T.liquid, srcB: textTexture() } });
}

// A scene showing a photo through amber liquid that settles, with words on top.
function photoScene(drawPhoto, drawWords) {
  return (local, duration, out) => {
    drawInto(layer, () => drawPhoto(local, duration));
    gpu.pass('liquid', {
      target: T.a,
      uniforms: { time: local, aspect: ASPECT, amount: 1 - easeOut(progress(local, 0.2, 1.8)) },
      textures: { source: layerTexture() },
    });
    drawInto(textLayer, () => drawWords(local));
    gpu.pass('compose', { target: out, textures: { base: T.a, overlay: textTexture() } });
  };
}

// ---------- timeline ----------
const drawScene = (scene, t, out) => scene.draw(t - scene.start, scene.end - scene.start, out);

const TRANSITIONS = {
  burn: {
    duration: 0.9,
    draw(previous, next, t, p) {
      drawScene(previous, t, T.frameA);
      drawScene(next, t, T.frameB);
      gpu.pass('burn', { target: T.out, uniforms: { time: t, aspect: ASPECT, progress: easeInOut(p) }, textures: { srcA: T.frameA, srcB: T.frameB } });
    },
  },
  dissolve: {
    duration: 0.6,
    draw(previous, next, t, p) {
      drawScene(previous, t, T.frameA);
      drawScene(next, t, T.frameB);
      gpu.pass('mix', { target: T.out, uniforms: { amount: easeInOut(p), flash: 0 }, textures: { srcA: T.frameA, srcB: T.frameB } });
    },
  },
  // A warm flash on the cut that decays into the next scene.
  flash: {
    duration: 0.35,
    draw(previous, next, t, p) {
      drawScene(next, t, T.frameB);
      gpu.pass('mix', { target: T.out, uniforms: { amount: 1, flash: (1 - p) ** 2 }, textures: { srcA: T.frameB, srcB: T.frameB } });
    },
  },
  // Zooms into `previous.zoomCenter`, then out of the next scene.
  zoom: {
    duration: 0.8,
    draw(previous, next, t, p) {
      const into = p < 0.5;
      const q = into ? p * 2 : (p - 0.5) * 2;
      drawScene(into ? previous : next, t, T.frameA);
      gpu.pass('zoom', {
        target: T.out,
        uniforms: into
          ? { center: previous.zoomCenter || [0.5, 0.5], zoom: 1 + 7 * q * q, blur: 0.35 * q, brightness: 1 + 0.3 * q * q }
          : { center: [0.5, 0.5], zoom: 1 + 0.6 * (1 - easeOut(q)), blur: 0.3 * (1 - q), brightness: 1 + 0.3 * (1 - q) ** 2 },
        textures: { source: T.frameA },
      });
    },
  },
};

// The scene at `t` and, while its transition runs, the previous scene and the transition.
function activeScenes(scenes, t) {
  const index = scenes.findLastIndex((scene) => t >= scene.start);
  const scene = scenes[index];
  const transition = TRANSITIONS[scene.transition];
  const progressIn = transition ? (t - scene.start) / (scene.transitionDuration || transition.duration) : 1;
  return progressIn < 1 ? { scene, previous: scenes[index - 1], transition, progressIn } : { scene };
}

// Draws the frame at `t`: the current scene (or a transition), then bloom and the final grade.
function renderTimeline(scenes, t, { duration, aberration = 0.004, bloomStrength = 0.6 }) {
  const { scene, previous, transition, progressIn } = activeScenes(scenes, t);
  if (transition) transition.draw(previous, scene, t, progressIn);
  else drawScene(scene, t, T.out);

  gpu.pass('bright', { target: T.bloomA, uniforms: { threshold: 0.8 }, textures: { source: T.out } });
  [[1, 0], [0, 1], [2, 0], [0, 2]].forEach((direction, i) => {
    const [from, to] = i % 2 ? [T.bloomB, T.bloomA] : [T.bloomA, T.bloomB];
    gpu.pass('blur', { target: to, uniforms: { direction }, textures: { source: from } });
  });
  gpu.pass('final', {
    uniforms: {
      time: t, aspect: ASPECT, bloomStrength, aberration,
      overlayAlpha: progress(t, 0.6, 0.6), fade: Math.max(1 - progress(t, 0, 0.35), progress(t, duration - 0.9, 0.9)),
    },
    textures: { frame: T.out, bloom: T.bloomA, overlay: overlayTexture },
  });
}
