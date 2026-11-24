// Renders the carousels from continut.js as vertical videos (1080×1920, 30 fps, H.264) into ./video:
// <id>.mp4 with a sound track (film/sunet-carusel.py, synced to the slide changes) and <id>-fara-sunet.mp4.
// Usage: node fior-bannere/render-reels.cjs [carousel-id ...]   (needs Playwright with Chromium, ffmpeg, Python + numpy)
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { captureVideo } = require('./video-capture.cjs');

const OUT_DIR = path.join(__dirname, 'video');
const PAGE_URL = 'file://' + path.join(__dirname, 'reel.html');

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`${command} failed`);
}

async function readPage(browser, url, read) {
  const page = await browser.newPage();
  await page.goto(url);
  const value = await page.evaluate(read);
  await page.close();
  return value;
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();

  let ids = process.argv.slice(2);
  if (!ids.length) ids = await readPage(browser, PAGE_URL, () => CAROUSELS.map((carousel) => carousel.id));

  await Promise.all(ids.map(async (id) => {
    const url = `${PAGE_URL}?c=${id}`;
    const { duration, starts } = await readPage(browser, url, () => ({ duration: window.VIDEO_DURATION, starts: window.SCENE_STARTS }));
    const audioFile = path.join(__dirname, 'film', `sunet-carusel-${id}.wav`);
    run('python3', [path.join(__dirname, 'film', 'sunet-carusel.py'), audioFile, String(duration), ...starts.map(String)]);

    const withSound = path.join(OUT_DIR, `${id}.mp4`);
    await captureVideo(browser, { url, outFile: withSound, audioFile });
    run('ffmpeg', ['-y', '-loglevel', 'error', '-i', withSound, '-an', '-c:v', 'copy', path.join(OUT_DIR, `${id}-fara-sunet.mp4`)]);
    console.log(`${path.relative(__dirname, withSound)}  ${duration.toFixed(1)} s, cu sunet`);
  }));
  await browser.close();
})();
