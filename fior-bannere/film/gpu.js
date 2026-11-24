// Minimal WebGL2 toolkit for the Fior films: full-screen shader passes, float render targets,
// textures from images or 2D canvases, and point-sprite particle draws.

const FULLSCREEN_VS = `#version 300 es
layout(location = 0) in vec2 position;
out vec2 uv;
void main() {
  uv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

// Shared GLSL helpers, prepended to every fragment shader.
const GLSL_COMMON = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 color;
uniform float time;
uniform vec2 resolution;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
`;

class Gpu {
  constructor(canvas) {
    const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true });
    if (!gl) throw new Error('WebGL2 is not available');
    gl.getExtension('EXT_color_buffer_float');
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    this.gl = gl;
    this.width = canvas.width;
    this.height = canvas.height;
    this.programs = {};
    this.targets = {};
    this.textures = new Map();

    this.quad = gl.createVertexArray();
    gl.bindVertexArray(this.quad);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  }

  compile(type, source) {
    const { gl } = this;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }

  // Registers a program. Fragment shaders get GLSL_COMMON prepended unless `raw` is set.
  program(name, fragment, { vertex = FULLSCREEN_VS, raw = false } = {}) {
    const { gl } = this;
    const program = gl.createProgram();
    gl.attachShader(program, this.compile(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, this.compile(gl.FRAGMENT_SHADER, raw ? fragment : GLSL_COMMON + fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    this.programs[name] = { program, locations: {} };
  }

  // A float render target; `scale` is relative to the canvas size.
  target(name, scale = 1) {
    if (this.targets[name]) return this.targets[name];
    const { gl } = this;
    const width = Math.round(this.width * scale);
    const height = Math.round(this.height * scale);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null);
    this.setSampling(gl.LINEAR);
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    this.targets[name] = { texture, framebuffer, width, height };
    return this.targets[name];
  }

  setSampling(filter, mipmaps = false) {
    const { gl } = this;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mipmaps ? gl.LINEAR_MIPMAP_LINEAR : filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  // Uploads an image or canvas; call again for a canvas that changed. Returns the texture.
  upload(source, { mipmaps = false } = {}) {
    const { gl } = this;
    let texture = this.textures.get(source);
    if (!texture) {
      texture = gl.createTexture();
      this.textures.set(source, texture);
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    this.setSampling(gl.LINEAR, mipmaps);
    if (mipmaps) gl.generateMipmap(gl.TEXTURE_2D);
    return texture;
  }

  use(name, uniforms, textures) {
    const { gl } = this;
    const entry = this.programs[name];
    gl.useProgram(entry.program);
    const location = (key) => {
      if (!(key in entry.locations)) entry.locations[key] = gl.getUniformLocation(entry.program, key);
      return entry.locations[key];
    };
    Object.entries(uniforms).forEach(([key, value]) => {
      const at = location(key);
      if (at === null) return;
      if (typeof value === 'number') gl.uniform1f(at, value);
      else if (value.length === 2) gl.uniform2fv(at, value);
      else if (value.length === 3) gl.uniform3fv(at, value);
      else gl.uniform4fv(at, value);
    });
    Object.entries(textures).forEach(([key, texture], unit) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture.texture || texture);
      gl.uniform1i(location(key), unit);
    });
  }

  bindTarget(target) {
    const { gl } = this;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null);
    gl.viewport(0, 0, target ? target.width : this.width, target ? target.height : this.height);
  }

  // Full-screen pass: draws `program` into `target` (null = screen).
  pass(name, { target = null, uniforms = {}, textures = {}, additive = false } = {}) {
    const { gl } = this;
    this.bindTarget(target);
    const size = target ? [target.width, target.height] : [this.width, this.height];
    this.use(name, { resolution: size, ...uniforms }, textures);
    if (additive) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
    }
    gl.bindVertexArray(this.quad);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.BLEND);
  }

  // Point sprites with additive blending; `buffer` holds interleaved float attributes.
  points(name, { target, buffer, count, layout, uniforms = {} }) {
    const { gl } = this;
    this.bindTarget(target);
    this.use(name, { resolution: [target.width, target.height], ...uniforms }, {});
    if (!buffer.vao) {
      buffer.vao = gl.createVertexArray();
      gl.bindVertexArray(buffer.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, buffer.data, gl.STATIC_DRAW);
      const stride = layout.reduce((sum, size) => sum + size, 0) * 4;
      let offset = 0;
      layout.forEach((size, index) => {
        gl.enableVertexAttribArray(index);
        gl.vertexAttribPointer(index, size, gl.FLOAT, false, stride, offset);
        offset += size * 4;
      });
    }
    gl.bindVertexArray(buffer.vao);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.drawArrays(gl.POINTS, 0, count);
    gl.disable(gl.BLEND);
  }
}
