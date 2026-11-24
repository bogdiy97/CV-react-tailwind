// GLSL shaders shared by the WebGL Fior films (film-2.js, film-produs.js).
// Fragment shaders get GLSL_COMMON (gpu.js) prepended.

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

  // Molten metal or liquid (domain-warped noise, lit); a mask (logo or a word) rises out of it as a relief.
  gold: `uniform sampler2D logo; uniform vec4 logoRect; uniform float emboss; uniform float zoom; uniform float aspect;
    uniform vec3 deep; uniform vec3 mid; uniform vec3 shine; uniform vec3 rimTint;
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
      vec3 c = mix(deep, mid, clamp(diff * 0.8 + h * 0.3 - 0.1, 0.0, 1.0));
      c += spec * shine * 1.1 + rim * rimTint * 0.35;
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
      c += (hash(uv * resolution + fract(time * 13.1) * 97.0) - 0.5) * 0.022;
      vec4 ov = texture(overlay, uv);
      c = mix(c, ov.rgb, ov.a * overlayAlpha);
      color = vec4(c * (1.0 - fade), 1.0);
    }`,
};

// Rising bubbles (sparkling drinks), added on top of `source`.
SHADERS.bubbles = `uniform sampler2D source; uniform float aspect; uniform float amount;
  void main() {
    vec2 p = vec2(uv.x * aspect, uv.y);
    float acc = 0.0;
    for (int layer = 0; layer < 3; layer++) {
      float fl = float(layer);
      vec2 g = p * (14.0 + fl * 10.0) + vec2(0.0, -time * (1.2 + fl * 0.6));
      vec2 id = floor(g);
      vec2 f = fract(g) - 0.5;
      float h = hash(id + fl * 31.0);
      if (h > 0.25) continue;
      vec2 o = vec2(sin(time * 2.0 + h * 50.0) * 0.15, hash(id + 2.7) - 0.5) * 0.6;
      float r = 0.12 + 0.2 * hash(id + 5.1);
      float d = length(f - o);
      float ring = smoothstep(r, r - 0.04, d) - smoothstep(r - 0.05, r - 0.12, d) * 0.7;
      float spark = smoothstep(r * 0.35, 0.0, length(f - o - vec2(-r * 0.35, r * 0.35)));
      acc += (ring * 0.5 + spark) / (1.0 + fl * 0.6);
    }
    color = vec4(texture(source, uv).rgb + acc * amount * vec3(1.0, 0.98, 0.9), 1.0);
  }`;

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
