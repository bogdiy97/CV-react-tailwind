"""Sound design for the Fior film 2 ("Aurul toamnei"): 32 s, 48 kHz stereo WAV.

Timings follow film-2.js: 120 BPM, one beat = 0.5 s. Instruments live in instrumente.py.
Usage: python3 fior-bannere/film/sunet-2.py   ->  writes fior-bannere/film/sunet-2.wav
"""
from pathlib import Path

import numpy as np

from instrumente import (
    A_MINOR, C_MAJOR, F_MAJOR, G_MAJOR, Mix, braam, drone, hat, impact, kick, riser, shimmer, sizzle, whoosh,
)

DURATION = 32.0
BEAT = 0.5
OUT = Path(__file__).with_name("sunet-2.wav")

mix = Mix(DURATION)


def whoosh_at(when, length=0.75, gain=0.32, reverse=False):
    sound, pan = whoosh(length, gain, reverse)
    mix.add(sound, when, pan=pan)


# 0–5 s: molten gold. Drone, riser into the logo relief, sizzle while the gold drains.
mix.add(drone(5.4, root=55.0, gain=0.2), 0.0)
mix.add(riser(2.9, 0.26), 0.1)
mix.add(braam(55.0, 3.4, 0.5), 3.0)
mix.add(impact(0.6), 3.0)
mix.add(sizzle(1.6, 0.07), 3.2)
mix.add(shimmer(2.6, 0.06), 4.0)

# 5–14.5 s: the quince bottle, the zoom and the photos.
whoosh_at(4.85)
mix.add(impact(0.3), 5.0)
for start, notes, length in [(4.9, A_MINOR, 3.0), (6.9, F_MAJOR, 3.0), (8.9, C_MAJOR, 2.6), (10.0, A_MINOR, 2.6), (12.0, F_MAJOR, 2.8)]:
    mix.chord(notes, start, length, gain=0.045)
for beat in np.arange(5.5, 9.5, BEAT * 2):
    mix.add(kick(0.28), beat)
mix.add(riser(1.0, 0.22), 9.0)
whoosh_at(9.4, 0.6, 0.28, reverse=True)
mix.add(impact(0.55), 10.0)
for beat in np.arange(10.0, 14.0, BEAT * 2):
    mix.add(kick(0.42), beat)
    mix.add(hat(0.05), beat + BEAT, pan=0.3)
whoosh_at(12.25)
mix.add(riser(1.4, 0.25), 13.1)
for i, when in enumerate(np.arange(13.5, 14.5 - 1e-6, BEAT / 4)):
    mix.add(hat(0.04 + i * 0.008), when, pan=-0.2)

# 14.5–18.5 s: the drop. Kick on every beat, off-beat hats, a stab on every cut.
mix.add(impact(0.8), 14.5)
for beat in np.arange(14.5, 18.5 - 1e-6, BEAT):
    mix.add(kick(0.6), beat)
    mix.add(hat(0.07), beat + BEAT / 2, pan=0.35)
    mix.add(braam(110.0, 0.45, 0.12), beat)
for start, notes in [(14.5, A_MINOR), (15.5, F_MAJOR), (16.5, C_MAJOR), (17.5, G_MAJOR)]:
    mix.chord(notes, start, 1.4, gain=0.05)

# 18.5–23.5 s: the orbit.
whoosh_at(18.35)
mix.add(impact(0.45), 18.5)
for start, notes, length in [(18.5, A_MINOR, 2.8), (20.5, F_MAJOR, 2.8), (22.0, G_MAJOR, 2.0)]:
    mix.chord(notes, start, length, gain=0.05)
for beat in np.arange(18.5, 23.0, BEAT * 2):
    mix.add(kick(0.4), beat)
mix.add(shimmer(3.0, 0.05), 19.0)

# 23.5–32 s: finale. Particles gather, burst on the drop at 26 s, regroup, final chord.
whoosh_at(23.35)
mix.add(drone(2.6, root=55.0, gain=0.16), 23.5)
mix.add(riser(2.5, 0.3), 23.5)
mix.add(impact(1.0), 26.0)
mix.add(braam(55.0, 3.6, 0.55), 26.0)
mix.add(shimmer(3.0, 0.07), 26.05)
whoosh_at(27.4, 1.4, 0.3, reverse=True)
mix.add(impact(0.5), 28.8)
mix.add(shimmer(3.5, 0.07), 28.85)
mix.chord(A_MINOR, 28.6, 3.4, gain=0.05)

mix.write(OUT, fade_out=1.4)
print(f"{OUT.name}: {DURATION} s, peak -1 dBFS")
