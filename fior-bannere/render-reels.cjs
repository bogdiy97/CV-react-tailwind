// Renders the carousels from continut.js as vertical videos (1080×1920, 30 fps, H.264, no audio) into ./video.
// Usage: node fior-bannere/render-reels.cjs [carousel-id ...]   (needs Playwright with Chromium and ffmpeg)
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { captureVideo } = require('./video-capture.cjs');

const OUT_DIR = path.join(__dirname, 'video');
const PAGE_URL = 'file://' + path.join(__dirname, 'reel.html');

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

  await Promise.all(ids.map(async (id) => {
    const outFile = path.join(OUT_DIR, `${id}.mp4`);
    const duration = await captureVideo(browser, { url: `${PAGE_URL}?c=${id}`, outFile });
    console.log(`${path.relative(__dirname, outFile)}  ${duration.toFixed(1)} s`);
  }));
  await browser.close();
})();
