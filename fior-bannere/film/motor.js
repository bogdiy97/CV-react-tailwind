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
  T.rays = gpu.target('rays', 0.5);
  T.bloomA = gpu.target('bloomA', 0.25);
  T.bloomB = gpu.target('bloomB', 0.25);
  drawInto(overlay, () => text(LEGAL.toUpperCase(), 540, 1872, { family: SANS, weight: 600, size: 18, spacing: 5, alpha: 0.6 }));
  overlayTexture = gpu.upload(overlay);
}

const layerTexture = () => gpu.upload(layer);
const textTexture = () => gpu.upload(textLayer);

// Particle buffer: `count` random points inside the opaque pixels of `image`, placed at `rect` on screen.
function particlesFrom(image, rect, count, seed) {
  const sample = makeCanvas(Math.round(rect.width), Math.round(rect.height));
  sample.getContext('2d').drawImage(image, 0, 0, sample.width, sample.height);
  const alpha = sample.getContext('2d').getImageData(0, 0, sample.width, sample.height).data;
  const rand = seededRandom(seed);
  const data = new Float32Array(count * 6);
  for (let i = 0; i < count;) {
    const x = Math.floor(rand() * sample.width);
    const y = Math.floor(rand() * sample.height);
    if (alpha[(y * sample.width + x) * 4 + 3] < 128) continue;
    data.set([rect.x + x, rect.y + y, rand(), rand(), rand(), rand()], i * 6);
    i += 1;
  }
  return { count, data };
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

// Draws the frame at `t`: the current scene (or a transition), then bloom and the final grade.
function renderTimeline(scenes, t, { duration, aberration = 0.004, bloomStrength = 0.6 }) {
  const index = scenes.findLastIndex((scene) => t >= scene.start);
  const scene = scenes[index];
  const transition = TRANSITIONS[scene.transition];
  const local = t - scene.start;
  if (transition && local < transition.duration) {
    transition.draw(scenes[index - 1], scene, t, local / transition.duration);
  } else {
    drawScene(scene, t, T.out);
  }

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
