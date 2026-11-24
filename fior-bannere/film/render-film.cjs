// Renders a Fior film into ../video: <name>.mp4 with music (muzica.py) and <name>-fara-sunet.mp4.
// Usage: node fior-bannere/film/render-film.cjs <film> [--doar-sunet]
//   <film>: 1 | 2 | gutui | sangria | hugo | hard-lemonade | gama
//   --doar-sunet: keep the picture, only compose new music and put it on <name>-fara-sunet.mp4 (seconds, no re-render).
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { captureVideo } = require('../video-capture.cjs');

// Music: sections follow the film, hits are its cuts; `key` is in semitones from A minor.
const PRODUCT_MUSIC = ['--duration', '20', '--bpm', '120', '--offset', '0.4', '--sections', '0:intro,4:verse,11.4:drop,15.4:intro,17.2:finale',
  '--hits', '2.4,4,8.4,11.4', '--big', '17.2', '--final', '18.4'];
const FILMS = {
  1: {
    page: 'film.html', name: 'fior-film', crf: 18,
    music: ['--duration', '26', '--bpm', '100', '--offset', '0.2', '--sections', '0:intro,3.6:verse,13.4:drop,20:finale',
      '--hits', '2.65,3.6,7.4,10.6,13.4,15.8', '--big', '20'],
  },
  2: {
    page: 'film-2.html', name: 'fior-film-2', crf: 23,
    music: ['--duration', '32', '--bpm', '120', '--sections', '0:intro,5:verse,14.5:drop,18.5:verse,23.5:intro,26:finale',
      '--hits', '3,5,10,12.4,14.5,18.5,23.5', '--big', '26', '--final', '28.8'],
  },
};
Object.entries({ gutui: 0, sangria: -2, hugo: 3, 'hard-lemonade': 5, gama: 0 }).forEach(([id, key]) => {
  FILMS[id] = { page: `film-produs.html?p=${id}`, name: `fior-video-${id}`, crf: 23, music: [...PRODUCT_MUSIC, '--key', String(key)] };
});
// The WebGL films need the local images on the GPU.
const BROWSER_ARGS = ['--allow-file-access-from-files', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'];

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`${command} failed`);
}

(async () => {
  const film = FILMS[process.argv[2] || '1'];
  if (!film) throw new Error(`Usage: render-film.cjs <${Object.keys(FILMS).join('|')}> [--doar-sunet]`);
  const onlySound = process.argv.includes('--doar-sunet');
  const outDir = path.join(__dirname, '..', 'video');
  const withSound = path.join(outDir, `${film.name}.mp4`);
  const silent = path.join(outDir, `${film.name}-fara-sunet.mp4`);
  const music = path.join(__dirname, `muzica-${film.name}.wav`);
  fs.mkdirSync(outDir, { recursive: true });

  run('python3', [path.join(__dirname, 'muzica.py'), music, ...film.music]);

  if (!onlySound) {
    const browser = await chromium.launch({ args: BROWSER_ARGS });
    await captureVideo(browser, { url: 'file://' + path.join(__dirname, film.page), outFile: silent, crf: film.crf });
    await browser.close();
  }
  run('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-i', music, '-map', '0:v', '-map', '1:a',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', withSound]);
  console.log(`video/${film.name}.mp4 + video/${film.name}-fara-sunet.mp4${onlySound ? ' (muzică nouă)' : ''}`);
})();
