// Renders chosen moments of a film page into one labelled contact sheet (a quick look without a full render).
// Usage: node fior-bannere/film/storyboard.cjs <page[?query]> <out.png> <seconds> [<seconds> ...] [--cols 8] [--cell 240]
//   e.g. node fior-bannere/film/storyboard.cjs film-3.html /tmp/film-3.png 1 3 5 9 11 12.2 18 22 26 29
const path = require('path');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? Number(args.splice(at, 2)[1]) : fallback;
};
const cols = option('cols', 8);
const cell = option('cell', 240);
const [pageName, out, ...times] = args;
const BROWSER_ARGS = ['--allow-file-access-from-files', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'];

(async () => {
  const browser = await chromium.launch({ args: BROWSER_ARGS });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', (error) => console.log('PAGE ERROR', error.message));
  page.on('console', (message) => { if (message.type() === 'error') console.log('CONSOLE', message.text()); });
  await page.goto('file://' + path.join(__dirname, pageName));
  await page.evaluate(() => window.videoReady);

  const cards = [];
  for (const t of times) {
    await page.evaluate((time) => window.renderFrame(time), Number(t));
    const jpeg = await page.screenshot({ type: 'jpeg', quality: 88 });
    cards.push(`<figure><img src="data:image/jpeg;base64,${jpeg.toString('base64')}"><figcaption>${t} s</figcaption></figure>`);
  }

  const sheet = await browser.newPage({ viewport: { width: cols * (cell + 8) + 8, height: 200 } });
  await sheet.setContent(`<style>body{margin:0;padding:8px 0 0 8px;background:#161210;display:flex;flex-wrap:wrap;gap:8px;font:13px sans-serif;color:#e9dcc2}
    figure{margin:0;position:relative}img{display:block;width:${cell}px}figcaption{position:absolute;left:4px;top:4px;background:#000b;padding:2px 5px;border-radius:3px}</style>${cards.join('')}`);
  await sheet.screenshot({ path: out, fullPage: true });
  await browser.close();
})();
