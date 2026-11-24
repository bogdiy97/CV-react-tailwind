"""Sound track for a carousel video (reel.html): a calm groove with a whoosh and a soft hit on every slide change.

Usage: python3 fior-bannere/film/sunet-carusel.py <out.wav> <duration> <slide start> <slide start> ...
(render-reels.cjs passes the slide starts read from reel.js.)
"""
import sys

import numpy as np

from instrumente import A_MINOR, C_MAJOR, F_MAJOR, G_MAJOR, Mix, hat, impact, kick, riser, shimmer, whoosh

out = sys.argv[1]
duration = float(sys.argv[2])
starts = [float(s) for s in sys.argv[3:]]
BEAT = 0.6  # 100 BPM

mix = Mix(duration)

# Pad: A minor – F – C – G, two bars each, for the whole video.
progression = [A_MINOR, F_MAJOR, C_MAJOR, G_MAJOR]
for i, start in enumerate(np.arange(0.0, duration, BEAT * 4)):
    mix.chord(progression[i % 4], start, min(BEAT * 4 + 1.2, duration - start), gain=0.04)

# Groove from the second slide on: soft kick on every other beat, off-beat hats.
for beat in np.arange(starts[1] if len(starts) > 1 else 0.0, duration - 1.0, BEAT):
    index = round((beat - starts[1]) / BEAT) if len(starts) > 1 else 0
    if index % 2 == 0:
        mix.add(kick(0.32), beat)
    mix.add(hat(0.04), beat + BEAT / 2, pan=0.3)

# Opening shimmer, then a whoosh into every slide and a soft hit on it.
mix.add(shimmer(2.4, 0.05), 0.1)
for start in starts[1:]:
    sound, pan = whoosh(0.6, 0.24)
    mix.add(sound, start - 0.35, pan=pan)
    mix.add(impact(0.28), start)

# The last slide (save / share) gets a lift.
mix.add(riser(1.2, 0.18), starts[-1] - 1.2)
mix.add(impact(0.5), starts[-1])
mix.add(shimmer(3.0, 0.06), starts[-1] + 0.05)

mix.write(out, fade_out=1.2)
print(f"{out}: {duration:.1f} s, {len(starts)} slides")
