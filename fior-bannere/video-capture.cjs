// Captures a page that exposes window.renderFrame(t) and window.VIDEO_DURATION as an H.264 MP4
// (30 fps, optional AAC audio track). Used by render-reels.cjs and film/render-film.cjs.
const { spawn } = require('child_process');

const FPS = 30;

function startEncoder(outFile, { audioFile, crf }) {
  const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-'];
  if (audioFile) args.push('-i', audioFile, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k', '-shortest');
  args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', String(crf), '-preset', 'medium', '-movflags', '+faststart', outFile);

  const ffmpeg = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((resolve, reject) => {
    ffmpeg.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited with ${code}`))));
  });
  return { ffmpeg, done };
}

// cover: optional { at: seconds, file: path } – that frame is also saved as a PNG (the cover image for the post).
async function captureVideo(browser, { url, outFile, audioFile, crf = 19, width = 1080, height = 1920, cover = null }) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(url);
  await page.evaluate(() => window.videoReady || document.fonts.ready);
  const duration = await page.evaluate(() => window.VIDEO_DURATION);

  const { ffmpeg, done } = startEncoder(outFile, { audioFile, crf });
  const frames = Math.round(duration * FPS);
  for (let frame = 0; frame < frames; frame += 1) {
    await page.evaluate((t) => window.renderFrame(t), frame / FPS);
    const jpeg = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ffmpeg.stdin.write(jpeg)) await new Promise((resolve) => ffmpeg.stdin.once('drain', resolve));
  }
  ffmpeg.stdin.end();
  await done;
  if (cover) {
    await page.evaluate((t) => window.renderFrame(t), cover.at);
    await page.screenshot({ path: cover.file });
  }
  await page.close();
  return duration;
}

module.exports = { captureVideo };
