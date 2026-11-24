// Real footage for the films: JPEG sequences written by cadre.py (cadre/<clip>/NNNN.jpg), loaded on demand.
// A scene that uses footage has clips(local, duration) -> [{ clip, position }]; the film awaits
// prepareFootage(SCENES, t) before it draws the frame. Load after cadre/index.js and motor.js.

const CLIP_CACHE_LIMIT = 24;
const clipImages = new Map(); // "clip/index" -> Promise<Image>, with .image once loaded

const clipIndex = (clip, index) => Math.min(CLIP_FRAMES[clip] - 1, Math.max(0, index));

function loadClipFrame(clip, index) {
  const key = `${clip}/${clipIndex(clip, index)}`;
  if (!clipImages.has(key)) {
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Missing footage frame ${key}: run cadre.py`));
      image.src = `cadre/${clip}/${String(clipIndex(clip, index) + 1).padStart(4, '0')}.jpg`;
    });
    promise.then((image) => { promise.image = image; });
    clipImages.set(key, promise);
    if (clipImages.size > CLIP_CACHE_LIMIT) clipImages.delete(clipImages.keys().next().value);
  }
  return clipImages.get(key);
}

// Loads the footage frames that the scenes active at `t` are about to draw.
function prepareFootage(scenes, t) {
  const { scene, previous } = activeScenes(scenes, t);
  const needed = [scene, previous].filter(Boolean)
    .flatMap((s) => (s.clips ? s.clips(t - s.start, s.end - s.start) : []));
  return Promise.all(needed.flatMap(({ clip, position }) => [
    loadClipFrame(clip, Math.floor(position)), loadClipFrame(clip, Math.floor(position) + 1),
  ]));
}

// Draws a footage frame into the rectangle (x, y, w, h) of the current canvas. `position` may be fractional:
// neighbouring frames are blended. fx, fy: the point of the frame to centre on (0..1); zoom >= 1.
function drawClip(clip, position, { fx = 0.5, fy = 0.5, zoom = 1, x = 0, y = 0, w = W, h = H } = {}) {
  const first = clipImages.get(`${clip}/${clipIndex(clip, Math.floor(position))}`).image;
  const sh = first.height / zoom;
  const sw = (sh * w) / h;
  const sx = Math.min(first.width - sw, Math.max(0, fx * first.width - sw / 2));
  const sy = Math.min(first.height - sh, Math.max(0, fy * first.height - sh / 2));
  ctx.drawImage(first, sx, sy, sw, sh, x, y, w, h);
  const blend = position - Math.floor(position);
  if (blend > 0.02) {
    ctx.save();
    ctx.globalAlpha *= blend;
    ctx.drawImage(clipImages.get(`${clip}/${clipIndex(clip, Math.floor(position) + 1)}`).image, sx, sy, sw, sh, x, y, w, h);
    ctx.restore();
  }
}
