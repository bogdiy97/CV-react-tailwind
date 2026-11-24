// Renders the carousels from continut.js as vertical videos (1080×1920, 30 fps, H.264) into ./video:
// <id>.mp4 with music (film/muzica.py, a cymbal on every slide change) and <id>-fara-sunet.mp4.
// Usage: node fior-bannere/render-reels.cjs [carousel-id ...] [--doar-sunet]
//   --doar-sunet: keep the picture, only compose new music (no re-render).
// Needs Playwright with Chromium, ffmpeg, fluidsynth + fluid-soundfont-gm, Python with mido and numpy.
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { captureVideo } = require('./video-capture.cjs');

const OUT_DIR = path.join(__dirname, 'video');
const PAGE_URL = 'file://' + path.join(__dirname, 'reel.html');
const KEYS = { 'dupa-job': 0, 'pe-plaja': 5, 'la-ski': -2, 'langa-brad': 0, retete: 3 }; // semitones from A minor

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

// Calm intro on the cover, the groove from the second slide, piano and strings on the last one.
function musicArgs(id, duration, starts) {
  const last = starts[starts.length - 1];
  return ['--duration', String(duration), '--bpm', '100', '--offset', String(starts[1]), '--key', String(KEYS[id] ?? 0),
    '--sections', `0:intro,${starts[1]}:verse,${last}:finale`,
    '--hits', starts.slice(1, -1).join(','), '--big', String(last)];
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const onlySound = process.argv.includes('--doar-sunet');
  const browser = await chromium.launch();

  let ids = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
  if (!ids.length) ids = await readPage(browser, PAGE_URL, () => CAROUSELS.map((carousel) => carousel.id));

  await Promise.all(ids.map(async (id) => {
    const url = `${PAGE_URL}?c=${id}`;
    const { duration, starts } = await readPage(browser, url, () => ({ duration: window.VIDEO_DURATION, starts: window.SCENE_STARTS }));
    const music = path.join(__dirname, 'film', `muzica-${id}.wav`);
    run('python3', [path.join(__dirname, 'film', 'muzica.py'), music, ...musicArgs(id, duration, starts)]);

    const silent = path.join(OUT_DIR, `${id}-fara-sunet.mp4`);
    if (!onlySound) await captureVideo(browser, { url, outFile: silent });
    run('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-i', music, '-map', '0:v', '-map', '1:a',
      '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', path.join(OUT_DIR, `${id}.mp4`)]);
    console.log(`video/${id}.mp4  ${duration.toFixed(1)} s${onlySound ? ' (muzică nouă)' : ''}`);
  }));
  await browser.close();
})();
