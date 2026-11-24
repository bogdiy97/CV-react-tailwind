"""Checks a rendered Fior video with measurements, since nobody is watching while it renders.

For each file it reports: format (resolution, frame rate, codecs, duration, size), loudness (EBU R128) and
true peak, black stretches and still stretches away from the fades, and how even the motion is
(isolated repeated frames, the largest jumps between frames). Problems are marked with "!!".

Usage: python3 fior-bannere/film/verifica.py fior-bannere/video/fior-film-3.mp4 [more.mp4 ...]
Needs: ffmpeg, ffprobe, Pillow, numpy.
"""
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

FADE = 1.0  # seconds at each end where black and still frames are expected


def run(*args):
    return subprocess.run(args, capture_output=True, text=True)


def probe(path):
    out = run("ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)).stdout
    info = json.loads(out)
    video = next(s for s in info["streams"] if s["codec_type"] == "video")
    audio = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)
    return video, audio, float(info["format"]["duration"]), int(info["format"]["size"])


def stretches(log, start_key, end_key):
    starts = [float(x) for x in re.findall(rf"{start_key}[:=]\s*([\d.]+)", log)]
    ends = [float(x) for x in re.findall(rf"{end_key}[:=]\s*([\d.]+)", log)]
    return list(zip(starts, ends))


def check(path):
    video, audio, duration, size = probe(path)
    problems = []
    print(f"\n{path.name}")
    print(f"  {video['width']}x{video['height']}, {video['r_frame_rate']} fps, {video['codec_name']}"
          f"{' + ' + audio['codec_name'] if audio else ', no audio'}, {duration:.2f} s, {size / 1e6:.1f} MB")
    if (video["width"], video["height"]) != (1080, 1920) or video["r_frame_rate"] != "30/1":
        problems.append("not 1080x1920 at 30 fps")

    if audio:
        log = run("ffmpeg", "-hide_banner", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-").stderr
        loudness = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", log)[-1])
        peak = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", log)[-1])
        print(f"  loudness {loudness:.1f} LUFS, true peak {peak:.1f} dBFS")
        if not -15.5 <= loudness <= -12.5:
            problems.append("loudness is not near -14 LUFS")
        if peak > -0.5:
            problems.append("true peak above -0.5 dBFS")

    log = run("ffmpeg", "-hide_banner", "-i", str(path), "-vf", "blackdetect=d=0.2:pix_th=0.08,freezedetect=n=0.002:d=0.7",
              "-an", "-f", "null", "-").stderr
    inside = lambda a, b: a > FADE and b < duration - FADE
    black = [(a, b) for a, b in stretches(log, "black_start", "black_end") if inside(a, b)]
    still = [(round(a, 2), round(b, 2)) for a, b in stretches(log, "freeze_start", "freeze_end") if inside(a, b)]
    print(f"  black stretches: {black or 'none'}; still stretches (title cards): {still or 'none'}")
    if black:
        problems.append("black frames in the middle of the film")
    if any(b - a > 2.0 for a, b in still):
        problems.append("picture still for more than 2 s")

    with tempfile.TemporaryDirectory() as tmp:
        run("ffmpeg", "-v", "error", "-i", str(path), "-vf", "scale=135:240,format=gray", f"{tmp}/%05d.png")
        frames = [np.asarray(Image.open(f)).astype(float) for f in sorted(Path(tmp).glob("*.png"))]
    diffs = np.array([np.abs(b - a).mean() for a, b in zip(frames, frames[1:])])
    middle = diffs[int(FADE * 30): int((duration - FADE) * 30)]
    same = middle < 0.05
    # stutter: a repeated frame between two frames that do move (a still title card is not stutter)
    stutter = int((same[1:-1] & ~same[:-2] & ~same[2:]).sum())
    jumps = [round(float(i + 1) / 30, 2) for i in np.argsort(diffs)[-8:][::-1]]
    print(f"  {len(frames)} frames; stuttering frames: {stutter}; biggest changes at {sorted(jumps)} s")
    if len(frames) != round(duration * 30):
        problems.append("frame count does not match the duration")
    if stutter > 2:
        problems.append("isolated repeated frames (stutter)")

    for problem in problems:
        print(f"  !! {problem}")
    if not problems:
        print("  ok")
    return not problems


if __name__ == "__main__":
    results = [check(Path(arg)) for arg in sys.argv[1:]]
    sys.exit(0 if all(results) else 1)
