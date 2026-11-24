// Renders the carousels from continut.js as Instagram reels (1080×1920, 30 fps, H.264, no audio) into ./video.
// Usage: node fior-bannere/render-reels.cjs [carousel-id ...]   (needs Playwright with Chromium and ffmpeg)
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const FPS = 30;
const OUT_DIR = path.join(__dirname, 'video');
const PAGE_URL = 'file://' + path.join(__dirname, 'reel.html');

function startEncoder(outFile) {
  const ffmpeg = spawn('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '19', '-preset', 'medium',
    '-movflags', '+faststart', outFile,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((resolve, reject) => {
    ffmpeg.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited with ${code}`))));
  });
  return { ffmpeg, done };
}

async function renderReel(browser, id) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto(`${PAGE_URL}?c=${id}`);
  await page.evaluate(() => document.fonts.ready);
  const duration = await page.evaluate(() => window.REEL_DURATION);

  const outFile = path.join(OUT_DIR, `${id}.mp4`);
  const { ffmpeg, done } = startEncoder(outFile);
  const frames = Math.round(duration * FPS);
  for (let frame = 0; frame < frames; frame += 1) {
    await page.evaluate((t) => window.renderFrame(t), frame / FPS);
    const jpeg = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ffmpeg.stdin.write(jpeg)) await new Promise((resolve) => ffmpeg.stdin.once('drain', resolve));
  }
  ffmpeg.stdin.end();
  await done;
  await page.close();
  console.log(`${path.relative(__dirname, outFile)}  ${duration.toFixed(1)} s`);
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();

  let ids = process.argv.slice(2);
  if (!ids.length) {
    const page = await browser.newPage();
    await page.goto(PAGE_URL);
    ids = await page.evaluate(() => CAROUSELS.map((carousel) => carousel.id));
    await page.close();
  }

  await Promise.all(ids.map((id) => renderReel(browser, id)));
  await browser.close();
})();
