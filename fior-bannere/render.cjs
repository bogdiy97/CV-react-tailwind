// Exports every .banner of a page as a PNG into ./png, named after its data-file attribute.
// Usage: node fior-bannere/render.cjs [bannere.html|carusele.html]   (needs Playwright with Chromium)
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PAGE = process.argv[2] || 'bannere.html';
const OUT_DIR = path.join(__dirname, 'png');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 1500 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(__dirname, PAGE));
  await page.evaluate(() => document.fonts.ready);

  for (const banner of await page.$$('.banner')) {
    const file = path.join(OUT_DIR, `${await banner.getAttribute('data-file')}.png`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await banner.screenshot({ path: file });
    console.log(path.relative(__dirname, file));
  }

  await browser.close();
})();
