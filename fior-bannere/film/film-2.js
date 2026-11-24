// Fior brand film 2 – "Aurul toamnei" (1080×1920, 32 s), rendered with WebGL2.
// window.renderFrame(t) draws the frame at t seconds; render-film.cjs captures every frame.
// Timings match sunet-2.py: 120 BPM, one beat = 0.5 s.
// Chromium must run with --allow-file-access-from-files so local images can reach the GPU.

const VIDEO_DURATION = 32;
window.VIDEO_DURATION = VIDEO_DURATION;
const BEAT = 0.5;
const ASPECT = W / H;

const gpu = new Gpu(document.getElementById('film'));
const layer = makeCanvas(); // photos and bottles (bottles also block the light rays)
const textLayer = makeCanvas();
const overlay = makeCanvas(); // the legal line, sharp and unaffected by the effects

const uvRect = (x, y, width, height) => [x / W, 1 - (y + height) / H, width / W, height / H];
const uvPoint = (x, y) => [x / W, 1 - y / H];
const LOGO_PX = { cx: 540, cy: 860, width: 720 };
LOGO_PX.height = (LOGO_PX.width * 347) / 635;

// ---------- shaders ----------
const SHADERS = {
  image: `uniform sampler2D source;
    void main() { color = vec4(texture(source, uv).rgb, 1.0); }`,

  compose: `uniform sampler2D base; uniform sampler2D overlay;
    void main() {
      vec4 o = texture(overlay, uv);
      color = vec4(mix(texture(base, uv).rgb, o.rgb, o.a), 1.0);
    }`,

  add: `uniform sampler2D base; uniform sampler2D light; uniform float amount;
    void main() { color = vec4(texture(base, uv).rgb + texture(light, uv).rgb * amount, 1.0); }`,

  // Molten gold (domain-warped noise lit as metal); the logo rises out of it as a relief.
  gold: `uniform sampler2D logo; uniform vec4 logoRect; uniform float emboss; uniform float zoom; uniform float aspect;
    void main() {
      vec2 p = (vec2((uv.x - 0.5) * aspect, uv.y - 0.5) * zoom + 0.5) * 2.6;
      float t = time * 0.32;
      vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
      vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + 0.6 * t), fbm(p + 3.0 * q + vec2(8.3, 2.8) - 0.5 * t));
      float h = fbm(p + 3.2 * r);
      vec2 luv = (uv - logoRect.xy) / logoRect.zw;
      float inside = step(0.0, luv.x) * step(luv.x, 1.0) * step(0.0, luv.y) * step(luv.y, 1.0);
      float shape = inside * mix(textureLod(logo, luv, 3.0).a, texture(logo, luv).a, 0.4);
      h = mix(h, 0.62, emboss * shape * 0.7) + emboss * shape * 0.5;
      vec3 n = normalize(vec3(-dFdx(h) * 70.0, -dFdy(h) * 70.0, 1.0));
      vec3 L = normalize(vec3(0.55 * sin(time * 0.7), 0.5 + 0.2 * cos(time * 0.5), 0.75));
      float diff = max(dot(n, L), 0.0);
      float spec = pow(max(dot(n, normalize(L + vec3(0.0, 0.0, 1.0))), 0.0), 40.0);
      float rim = pow(1.0 - n.z, 1.5);
      vec3 c = mix(vec3(0.16, 0.07, 0.015), vec3(0.9, 0.6, 0.22), clamp(diff * 0.8 + h * 0.3 - 0.1, 0.0, 1.0));
      c += spec * vec3(1.0, 0.88, 0.62) * 1.1 + rim * vec3(0.8, 0.5, 0.18) * 0.35;
      c *= 0.55 + 0.6 * smoothstep(0.1, 0.75, h);
      color = vec4(c, 1.0);
    }`,

  // Burn transition: noise front with a glowing gold edge, from srcA to srcB.
  burn: `uniform sampler2D srcA; uniform sampler2D srcB; uniform float progress; uniform float aspect;
    void main() {
      vec2 p = vec2(uv.x * aspect, uv.y) * 3.2;
      float n = fbm(p + time * 0.15) * 0.8 + (1.0 - uv.y) * 0.2;
      float edge = progress * 1.3 - 0.15;
      float m = smoothstep(edge - 0.012, edge + 0.012, n);
      vec3 c = mix(texture(srcB, uv).rgb, texture(srcA, uv).rgb, m);
      float glow = (1.0 - smoothstep(0.0, 0.045, abs(n - edge))) * step(0.001, progress) * step(progress, 0.999);
      color = vec4(c + glow * vec3(2.2, 1.3, 0.45), 1.0);
    }`,

  // Volumetric light: radial blur of a glow that the bottles (occluder alpha) block.
  rays: `uniform sampler2D occluder; uniform vec2 lightPos; uniform float lightRadius; uniform float aspect;
    uniform vec3 rayColor; uniform float intensity;
    float lightAt(vec2 c) {
      vec2 d = c - lightPos; d.x *= aspect;
      return exp(-dot(d, d) / (lightRadius * lightRadius)) * (1.0 - texture(occluder, c).a);
    }
    void main() {
      vec2 delta = (uv - lightPos) / 56.0 * 0.9;
      vec2 c = uv;
      float decay = 1.0, acc = 0.0;
      for (int i = 0; i < 56; i++) { acc += lightAt(c) * decay; c -= delta; decay *= 0.968; }
      color = vec4(rayColor * acc / 56.0 * intensity, 1.0);
    }`,

  // Backdrop with a glow, a floor with light caustics (as through amber liquid) and the rays on top.
  stage: `uniform sampler2D rays; uniform vec2 lightPos; uniform float floorY; uniform float aspect;
    uniform vec3 baseColor; uniform vec3 glowColor; uniform float caustics;
    float caustic(vec2 q, float t) {
      vec2 p = mod(q * 6.28318, 6.28318) - 250.0;
      vec2 i = p;
      float c = 1.0;
      for (int n = 0; n < 4; n++) {
        float tt = t * (1.0 - (3.5 / float(n + 1)));
        i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
        c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / 0.005), p.y / (cos(i.y + tt) / 0.005)));
      }
      c = 1.17 - pow(c / 4.0, 1.4);
      return pow(abs(c), 8.0);
    }
    void main() {
      vec2 d = uv - lightPos; d.x *= aspect;
      vec3 c = mix(baseColor, glowColor, exp(-dot(d, d) * 3.5));
      if (uv.y < floorY) {
        float depth = (floorY - uv.y) / floorY;
        vec2 fp = vec2((uv.x - 0.5) * aspect / (0.25 + depth * 1.2), 0.6 / (0.08 + depth));
        float spot = exp(-pow((uv.x - 0.5) * aspect * 3.0 / (0.4 + depth), 2.0)) * smoothstep(0.0, 0.15, depth);
        c = c * 0.8 + glowColor * 1.6 * caustic(fp * 0.8, time * 0.7) * spot * caustics;
      }
      c += glowColor * exp(-pow((uv.y - floorY) * resolution.y / 5.0, 2.0)) * 0.35;
      color = vec4(c + texture(rays, uv).rgb, 1.0);
    }`,

  // A photo seen through moving amber liquid that settles as `amount` goes to 0.
  liquid: `uniform sampler2D source; uniform float amount; uniform float aspect;
    void main() {
      vec2 p = vec2(uv.x * aspect, uv.y) * 3.0;
      vec2 w = vec2(fbm(p + time * 0.6), fbm(p + vec2(4.1, 7.3) - time * 0.5)) - 0.5;
      vec3 c = texture(source, uv + w * 0.07 * amount).rgb;
      float highlight = pow(max(0.0, fbm(p * 1.7 + w * 3.0 + time)), 3.0);
      c = mix(c, c * vec3(1.15, 0.85, 0.5) + highlight * vec3(1.0, 0.7, 0.3), amount * 0.65);
      color = vec4(c, 1.0);
    }`,

  // Beat shockwave: refracting ring with chromatic split and a flash.
  shock: `uniform sampler2D source; uniform vec2 center; uniform float age; uniform float aspect; uniform float strength;
    void main() {
      vec2 d = uv - center; d.x *= aspect;
      float dist = length(d);
      float radius = age * 1.4;
      float ring = smoothstep(radius - 0.09, radius, dist) * (1.0 - smoothstep(radius, radius + 0.09, dist));
      vec2 dir = d / max(dist, 1e-4); dir.x /= aspect;
      vec2 o = dir * strength * ring * exp(-age * 2.5) * 0.025;
      vec3 c = vec3(texture(source, uv - o * 1.5).r, texture(source, uv - o).g, texture(source, uv - o * 0.5).b);
      c += ring * exp(-age * 4.0) * strength * vec3(1.0, 0.8, 0.45) * 0.35;
      c += exp(-age * 14.0) * strength * vec3(1.0, 0.9, 0.7) * 0.6;
      color = vec4(c, 1.0);
    }`,

  // Radial zoom blur towards `center`.
  zoom: `uniform sampler2D source; uniform vec2 center; uniform float zoom; uniform float blur; uniform float brightness;
    void main() {
      vec2 dir = uv - center;
      vec3 acc = vec3(0.0);
      for (int i = 0; i < 24; i++) acc += texture(source, center + dir * (1.0 - blur * float(i) / 24.0) / zoom).rgb;
      color = vec4(acc / 24.0 * brightness, 1.0);
    }`,

  // Out-of-focus golden lights.
  bokeh: `uniform vec3 baseColor; uniform vec3 glowColor; uniform float aspect; uniform float density;
    void main() {
      vec2 p = vec2(uv.x * aspect, uv.y);
      vec3 c = mix(baseColor, glowColor, exp(-dot((uv - vec2(0.5, 0.35)) * vec2(aspect, 1.0), (uv - vec2(0.5, 0.35)) * vec2(aspect, 1.0)) * 3.0));
      for (int layer = 0; layer < 3; layer++) {
        float fl = float(layer);
        vec2 g = p * (5.0 + fl * 3.5) + vec2(time * (0.04 + fl * 0.03), time * 0.02 * (fl + 1.0));
        vec2 id = floor(g);
        vec2 f = fract(g) - 0.5;
        float h = hash(id + fl * 17.0);
        vec2 o = vec2(hash(id + 1.3), hash(id + 7.1)) - 0.5;
        float r = 0.18 + 0.22 * hash(id + 3.3);
        float disc = smoothstep(r, r - 0.04, length(f - o * 0.45)) * step(1.0 - density, h);
        float twinkle = 0.6 + 0.4 * sin(time * 2.0 + h * 40.0);
        c += disc * twinkle * mix(glowColor * 1.2, vec3(1.0, 0.92, 0.75), hash(id + 9.0)) * (0.35 / (1.0 + fl));
      }
      color = vec4(c, 1.0);
    }`,

  bright: `uniform sampler2D source; uniform float threshold;
    void main() {
      vec3 c = texture(source, uv).rgb;
      color = vec4(c * smoothstep(threshold, threshold + 0.3, max(c.r, max(c.g, c.b))), 1.0);
    }`,

  blur: `uniform sampler2D source; uniform vec2 direction;
    void main() {
      vec2 px = direction / resolution;
      vec3 c = texture(source, uv).rgb * 0.227;
      c += (texture(source, uv + px * 1.385).rgb + texture(source, uv - px * 1.385).rgb) * 0.316;
      c += (texture(source, uv + px * 3.231).rgb + texture(source, uv - px * 3.231).rgb) * 0.070;
      color = vec4(c, 1.0);
    }`,

  // Bloom, chromatic aberration, highlight roll-off, vignette, grain, the sharp overlay and fades.
  final: `uniform sampler2D frame; uniform sampler2D bloom; uniform sampler2D overlay;
    uniform float bloomStrength; uniform float aberration; uniform float overlayAlpha; uniform float fade; uniform float aspect;
    void main() {
      vec2 d = uv - 0.5;
      float r2 = dot(d * vec2(aspect, 1.0), d * vec2(aspect, 1.0));
      vec2 o = d * aberration * (0.3 + r2 * 3.0);
      vec3 c = vec3(texture(frame, uv - o).r, texture(frame, uv).g, texture(frame, uv + o).b);
      c += texture(bloom, uv).rgb * bloomStrength;
      c = c / (1.0 + max(c - 0.85, 0.0));
      c *= 1.0 - smoothstep(0.2, 0.8, r2 * 2.2) * 0.5;
      c += (hash(uv * resolution + fract(time * 13.1) * 97.0) - 0.5) * 0.04;
      vec4 ov = texture(overlay, uv);
      c = mix(c, ov.rgb, ov.a * overlayAlpha);
      color = vec4(c * (1.0 - fade), 1.0);
    }`,
};

const PARTICLE_VS = `#version 300 es
layout(location = 0) in vec2 target;
layout(location = 1) in vec4 seed;
uniform float time;
uniform vec2 resolution;
uniform vec2 center;
uniform float assemble;
uniform float burstTime;
uniform float regroup;
uniform float fadeOut;
out float vAlpha;
out vec3 vColor;
void main() {
  float a = seed.x * 6.2831 + time * 0.6 * (0.5 + seed.z);
  vec2 cloud = center + vec2(cos(a), sin(a)) * (600.0 + seed.y * 900.0) * vec2(1.0, 1.35);
  float pe = clamp(assemble * 1.4 - seed.w * 0.4, 0.0, 1.0);
  pe = pe * pe * (3.0 - 2.0 * pe);
  vec2 v = (cloud - target) * (1.0 - pe);
  float turn = (1.0 - pe) * 1.8;
  vec2 pos = target + vec2(v.x * cos(turn) - v.y * sin(turn), v.x * sin(turn) + v.y * cos(turn));

  vec2 dir = normalize(target - center + (seed.yz - 0.5) * 60.0 + 1e-3);
  float bt = max(burstTime, 0.0);
  vec2 burst = dir * (500.0 + seed.z * 1500.0) * (1.0 - exp(-bt * 2.5)) / 2.5 + vec2(0.0, 240.0) * bt * bt;
  float back = clamp(regroup * 1.3 - seed.x * 0.3, 0.0, 1.0);
  back = back * back * (3.0 - 2.0 * back);
  float bursting = step(0.0, burstTime) * (1.0 - back);
  pos += burst * bursting;

  gl_Position = vec4(pos.x / resolution.x * 2.0 - 1.0, 1.0 - pos.y / resolution.y * 2.0, 0.0, 1.0);
  gl_PointSize = 2.5 + seed.w * 3.0 + bursting * 2.0;
  vAlpha = (0.45 + 0.55 * pe) * (1.0 - fadeOut);
  vColor = mix(vec3(1.0, 0.72, 0.36), vec3(1.0, 0.95, 0.82), seed.y);
}`;

const PARTICLE_FS = `#version 300 es
precision highp float;
in float vAlpha;
in vec3 vColor;
out vec4 color;
void main() {
  float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
  color = vec4(vColor * a * vAlpha, 1.0);
}`;

// ---------- render targets, textures, particles ----------
const T = {};
let logoTexture;
let overlayTexture;
const particles = { count: 30000 };

function setup() {
  Object.entries(SHADERS).forEach(([name, source]) => gpu.program(name, source));
  gpu.program('particles', PARTICLE_FS, { vertex: PARTICLE_VS, raw: true });
  ['a', 'b', 'c', 'frameA', 'frameB', 'out'].forEach((name) => { T[name] = gpu.target(name); });
  T.gold = gpu.target('gold', 0.5);
  T.rays = gpu.target('rays', 0.5);
  T.bloomA = gpu.target('bloomA', 0.25);
  T.bloomB = gpu.target('bloomB', 0.25);

  logoTexture = gpu.upload(img.logo, { mipmaps: true });
  drawInto(overlay, () => text(LEGAL.toUpperCase(), 540, 1872, { family: SANS, weight: 600, size: 18, spacing: 5, alpha: 0.6 }));
  overlayTexture = gpu.upload(overlay);

  // Particle targets: random points inside the logo, where it sits on screen.
  const sample = makeCanvas(Math.round(LOGO_PX.width), Math.round(LOGO_PX.height));
  sample.getContext('2d').drawImage(img.logo, 0, 0, sample.width, sample.height);
  const alpha = sample.getContext('2d').getImageData(0, 0, sample.width, sample.height).data;
  const rand = seededRandom(97);
  const data = new Float32Array(particles.count * 6);
  for (let i = 0; i < particles.count;) {
    const x = Math.floor(rand() * sample.width);
    const y = Math.floor(rand() * sample.height);
    if (alpha[(y * sample.width + x) * 4 + 3] < 128) continue;
    data.set([LOGO_PX.cx - LOGO_PX.width / 2 + x, LOGO_PX.cy - LOGO_PX.height / 2 + y, rand(), rand(), rand(), rand()], i * 6);
    i += 1;
  }
  particles.data = data;
}

const layerTexture = () => gpu.upload(layer);
const textTexture = () => gpu.upload(textLayer);

// ---------- scenes: each one writes its frame into `out` ----------
function sceneGold(local, duration, out) {
  gpu.pass('gold', {
    target: T.gold,
    uniforms: {
      time: local + 3, aspect: ASPECT, zoom: 1 - 0.12 * (local / duration),
      emboss: easeInOut(progress(local, 0.6, 2.4)),
      logoRect: uvRect(LOGO_PX.cx - LOGO_PX.width / 2, LOGO_PX.cy - LOGO_PX.height / 2, LOGO_PX.width, LOGO_PX.height),
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
const BOTTLE_SCALE = { gutui: 1, sangria: 0.92, hugo: 0.9 };

function dropText(cut, cl) {
  const slide = easeOut(progress(cl, 0, 0.25));
  logo(540, 210, 230, { glow: 0.3 });
  text(cut.label, 540, 1610, { family: SANS, weight: 700, size: 23, spacing: 8, color: COLORS.goldLight, alpha: slide });
  text(cut.name, 540 + (1 - slide) * 70, 1725, { size: 104, alpha: slide, shadow: 24 });
}

function sceneDrop(local, duration, out) {
  const index = Math.min(DROP_CUTS.length - 1, Math.floor(local / BEAT));
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
          bottle(img[key], x, 1500, 1000 * (BOTTLE_SCALE[key] ?? 0.72) * (0.92 + 0.08 * zoomIn), { reflection: 0.3 });
        });
      },
      drawText: () => dropText(cut, cl),
    });
  }
  gpu.pass('shock', { target: out, uniforms: { age: cl, center: [0.5, 0.5], aspect: ASPECT, strength: 1 }, textures: { source: T.c } });
}

const RING = [['gutui', 1], ['hlZmeura', 0.72], ['sangria', 0.92], ['hlMenta', 0.72], ['hugo', 0.9], ['hlGhimbir', 0.72], ['hlSoc', 0.72]];

function sceneOrbit(local, duration, out) {
  gpu.pass('bokeh', { target: T.a, uniforms: { time: local, aspect: ASPECT, density: 0.35, baseColor: [0.02, 0.012, 0.004], glowColor: [0.28, 0.18, 0.05] } });

  const spin = lerp(-Math.PI * 2 * 0.85, 0, easeOut(progress(local, 0, duration - 0.4)));
  const tilt = lerp(0.5, 1.15, easeInOut(progress(local, 0, duration)));
  drawInto(layer, () => {
    RING.map(([key, scale], i) => {
      const angle = spin + (i * Math.PI * 2) / RING.length;
      const depth = Math.cos(angle);
      return { key, scale, x: 540 + 410 * Math.sin(angle), depth, near: (depth + 1) / 2 };
    }).sort((a, b) => a.depth - b.depth).forEach((item) => {
      bottle(img[item.key], item.x, 1430 + 90 * item.depth * tilt, 960 * item.scale * (0.6 + 0.4 * item.near), {
        alpha: 0.5 + 0.5 * item.near, brightness: 0.45 + 0.55 * item.near, reflection: 0.24,
      });
    });
  });
  const bottles = layerTexture();
  gpu.pass('rays', {
    target: T.rays,
    uniforms: { lightPos: uvPoint(540, 1150), lightRadius: 0.12, aspect: ASPECT, rayColor: [1.0, 0.8, 0.45], intensity: 1.3 },
    textures: { occluder: bottles },
  });
  gpu.pass('add', { target: T.b, uniforms: { amount: 1 }, textures: { base: T.a, light: T.rays } });
  gpu.pass('compose', { target: T.a, textures: { base: T.b, overlay: bottles } });
  drawInto(textLayer, () => {
    goldDust(local, 110, 23, { speed: 30, alpha: 0.7 });
    reveal('Singur sau', 540, 300, local, 0.5, { size: 120 });
    reveal('împreună.', 540, 430, local, 0.75, { size: 120, italic: true, color: COLORS.goldLight });
    reveal('LICHIOR  ·  COCKTAILS  ·  HARD LEMONADE', 540, 1740, local, 1.2, { family: SANS, weight: 700, size: 24, spacing: 9, color: COLORS.goldLight, alpha: 0.85 });
  });
  gpu.pass('compose', { target: out, textures: { base: T.a, overlay: textTexture() } });
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
  { start: 5.0, end: 9.6, draw: sceneHero, transition: 'burn' },
  { start: 9.6, end: 12.4, draw: scenePhotoJob, transition: 'zoom' },
  { start: 12.4, end: 14.5, draw: scenePhotoLake, transition: 'burn' },
  { start: 14.5, end: 18.5, draw: sceneDrop },
  { start: 18.5, end: 23.5, draw: sceneOrbit, transition: 'burn' },
  { start: 23.5, end: VIDEO_DURATION, draw: sceneFinale, transition: 'burn' },
];
const drawScene = (scene, t, out) => scene.draw(t - scene.start, scene.end - scene.start, out);

// Where the zoom goes into the quince bottle label.
const ZOOM_CENTER = uvPoint(540, 1150);

const TRANSITIONS = {
  burn: {
    duration: 0.9,
    draw(previous, next, t, p) {
      drawScene(previous, t, T.frameA);
      drawScene(next, t, T.frameB);
      gpu.pass('burn', { target: T.out, uniforms: { time: t, aspect: ASPECT, progress: easeInOut(p) }, textures: { srcA: T.frameA, srcB: T.frameB } });
    },
  },
  zoom: {
    duration: 0.8,
    draw(previous, next, t, p) {
      const into = p < 0.5;
      const q = into ? p * 2 : (p - 0.5) * 2;
      drawScene(into ? previous : next, t, T.frameA);
      gpu.pass('zoom', {
        target: T.out,
        uniforms: into
          ? { center: ZOOM_CENTER, zoom: 1 + 7 * q * q, blur: 0.35 * q, brightness: 1 + 0.3 * q * q }
          : { center: [0.5, 0.5], zoom: 1 + 0.6 * (1 - easeOut(q)), blur: 0.3 * (1 - q), brightness: 1 + 0.3 * (1 - q) ** 2 },
        textures: { source: T.frameA },
      });
    },
  },
};

function aberrationAt(t) {
  const drop = SCENES[4];
  if (t >= drop.start && t < drop.end) return 0.004 + 0.012 * Math.exp(-((t - drop.start) % BEAT) * 8);
  return 0.004;
}

window.renderFrame = (t) => {
  const index = SCENES.findLastIndex((scene) => t >= scene.start);
  const scene = SCENES[index];
  const transition = TRANSITIONS[scene.transition];
  const local = t - scene.start;
  if (transition && local < transition.duration) {
    transition.draw(SCENES[index - 1], scene, t, local / transition.duration);
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
      time: t, aspect: ASPECT, bloomStrength: 0.6, aberration: aberrationAt(t),
      overlayAlpha: progress(t, 0.6, 0.6), fade: Math.max(1 - progress(t, 0, 0.35), progress(t, VIDEO_DURATION - 0.9, 0.9)),
    },
    textures: { frame: T.out, bloom: T.bloomA, overlay: overlayTexture },
  });
};

window.videoReady = loadAssets().then(() => {
  setup();
  window.renderFrame(0);
});
