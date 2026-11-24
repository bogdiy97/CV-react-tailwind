// Renders the Fior brand film to video/fior-film.mp4 (with sound) and video/fior-film-fara-sunet.mp4.
// Usage: python3 fior-bannere/film/sunet.py && node fior-bannere/film/render-film.cjs
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { captureVideo } = require('../video-capture.cjs');

const OUT_DIR = path.join(__dirname, '..', 'video');
const WITH_SOUND = path.join(OUT_DIR, 'fior-film.mp4');
const SILENT = path.join(OUT_DIR, 'fior-film-fara-sunet.mp4');

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const duration = await captureVideo(browser, {
    url: 'file://' + path.join(__dirname, 'film.html'),
    outFile: WITH_SOUND,
    audioFile: path.join(__dirname, 'sunet.wav'),
    crf: 18,
  });
  await browser.close();

  const strip = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', WITH_SOUND, '-an', '-c:v', 'copy', SILENT], { stdio: 'inherit' });
  if (strip.status !== 0) throw new Error('ffmpeg could not write the silent copy');
  console.log(`video/fior-film.mp4 + video/fior-film-fara-sunet.mp4  ${duration} s`);
})();
