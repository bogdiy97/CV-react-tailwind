// Renders a Fior film with its sound track into ../video, plus a silent copy.
// Usage: node fior-bannere/film/render-film.cjs <film>
//   1:   film.html   + sunet.wav    (python3 fior-bannere/film/sunet.py)    -> fior-film.mp4
//   2:   film-2.html + sunet-2.wav  (python3 fior-bannere/film/sunet-2.py)  -> fior-film-2.mp4
//   gutui | sangria | hugo | hard-lemonade | gama:
//        film-produs.html?p=<id> + sunet-<id>.wav (python3 fior-bannere/film/sunet-produs.py <id>) -> fior-video-<id>.mp4
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { captureVideo } = require('../video-capture.cjs');

const FILMS = {
  1: { page: 'film.html', audio: 'sunet.wav', name: 'fior-film', crf: 18 },
  2: { page: 'film-2.html', audio: 'sunet-2.wav', name: 'fior-film-2', crf: 23 },
};
['gutui', 'sangria', 'hugo', 'hard-lemonade', 'gama'].forEach((id) => {
  FILMS[id] = { page: `film-produs.html?p=${id}`, audio: `sunet-${id}.wav`, name: `fior-video-${id}`, crf: 23 };
});
// The WebGL films need the local images on the GPU.
const BROWSER_ARGS = ['--allow-file-access-from-files', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'];

(async () => {
  const film = FILMS[process.argv[2] || '1'];
  if (!film) throw new Error(`Usage: render-film.cjs <${Object.keys(FILMS).join('|')}>`);
  const outDir = path.join(__dirname, '..', 'video');
  const withSound = path.join(outDir, `${film.name}.mp4`);
  const silent = path.join(outDir, `${film.name}-fara-sunet.mp4`);
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ args: BROWSER_ARGS });
  const duration = await captureVideo(browser, {
    url: 'file://' + path.join(__dirname, film.page),
    outFile: withSound,
    audioFile: path.join(__dirname, film.audio),
    crf: film.crf,
  });
  await browser.close();

  const strip = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', withSound, '-an', '-c:v', 'copy', silent], { stdio: 'inherit' });
  if (strip.status !== 0) throw new Error('ffmpeg could not write the silent copy');
  console.log(`video/${film.name}.mp4 + video/${film.name}-fara-sunet.mp4  ${duration} s`);
})();
