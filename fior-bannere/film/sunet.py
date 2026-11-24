"""Sound design for the Fior film 1: 26 s, 48 kHz stereo WAV (instruments in instrumente.py).

Timings follow film.js: 100 BPM, one beat = 0.6 s.
Usage: python3 fior-bannere/film/sunet.py   ->  writes fior-bannere/film/sunet.wav
"""
from pathlib import Path

import numpy as np

from instrumente import A_MINOR, C_MAJOR, F_MAJOR, G_MAJOR, Mix, hat, impact, kick, riser, shimmer, whoosh

DURATION = 26.0
BEAT = 0.6
OUT = Path(__file__).with_name("sunet.wav")

mix = Mix(DURATION)

for start, notes, length in [
    (3.6, A_MINOR, 3.6), (6.0, F_MAJOR, 3.6), (8.4, C_MAJOR, 3.6), (10.8, G_MAJOR, 3.6),
    (13.2, A_MINOR, 3.6), (15.6, F_MAJOR, 3.6), (18.0, C_MAJOR, 3.0), (20.0, A_MINOR, 6.0),
]:
    mix.chord(notes, start, length)

# logo forge
mix.add(riser(), 0.05)
mix.add(impact(0.75), 2.62)
mix.add(shimmer(3.0, 0.06), 2.65)

# transitions
for when in (3.45, 7.2, 10.4):
    sound, pan = whoosh()
    mix.add(sound, when, pan=pan)
mix.add(impact(0.35), 3.6)

# rhythm: half time, then full time, then the final hit
for beat in np.arange(7.4, 13.4 - 1e-6, BEAT * 2):
    mix.add(kick(0.42), beat)
for beat in np.arange(13.4, 20.0 - 1e-6, BEAT):
    mix.add(kick(0.55), beat)
    mix.add(hat(), beat + BEAT / 2, pan=0.3)
for cut in (14.0, 14.6, 15.2):
    mix.add(hat(0.09), cut, pan=-0.3)
mix.add(impact(0.9), 20.0)
mix.add(shimmer(3.5, 0.07), 20.05)
mix.add(shimmer(2.5, 0.04), 22.8)

mix.write(OUT)
print(f"{OUT.name}: {DURATION} s, peak -1 dBFS")
