// Exports every .banner from bannere.html as a 1080×1350 PNG (Instagram 4:5 feed) into ./png.
// Usage: node fior-craciun-bannere/render.cjs   (needs Playwright with Chromium installed)
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const OUT_DIR = path.join(__dirname, 'png');

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 1500 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(__dirname, 'bannere.html'));
  await page.evaluate(() => document.fonts.ready);

  for (const banner of await page.$$('.banner')) {
    const name = await banner.getAttribute('data-file');
    await banner.screenshot({ path: path.join(OUT_DIR, `${name}.png`) });
    console.log(`png/${name}.png`);
  }

  await browser.close();
})();
