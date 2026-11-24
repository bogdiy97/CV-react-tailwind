"""Sound design for the Fior product videos (film-produs.js): 20 s, 48 kHz stereo WAV.

Same structure for every drink, in its own key; sparkling drinks get a fizz layer.
Timings follow film-produs.js: 120 BPM, one beat = 0.5 s.
Usage: python3 fior-bannere/film/sunet-produs.py <gutui|sangria|hugo|hard-lemonade|gama>  ->  sunet-<id>.wav
"""
import sys
from pathlib import Path

import numpy as np

from instrumente import (
    A_MINOR, C_MAJOR, F_MAJOR, G_MAJOR, Mix, braam, drone, hat, impact, kick, riser, shimmer, sizzle, whoosh,
)

# Semitones from A minor, and whether the drink is sparkling.
PRODUCTS = {
    "gutui": (0, False),
    "sangria": (-2, False),
    "hugo": (3, True),
    "hard-lemonade": (5, True),
    "gama": (0, False),
}

product = sys.argv[1] if len(sys.argv) > 1 else "gutui"
semitones, sparkling = PRODUCTS[product]
key = 2 ** (semitones / 12)
DURATION = 20.0
BEAT = 0.5
OUT = Path(__file__).with_name(f"sunet-{product}.wav")

mix = Mix(DURATION)


def chord(notes, start, length, gain=0.05):
    mix.chord([n * key for n in notes], start, length, gain)


def whoosh_at(when, length=0.75, gain=0.32, reverse=False):
    sound, pan = whoosh(length, gain, reverse)
    mix.add(sound, when, pan=pan)


# 0–4 s: the liquid. Drone and riser into the name in relief, sizzle while it drains.
mix.add(drone(4.4, root=55.0 * key, gain=0.2), 0.0)
mix.add(riser(2.3, 0.26), 0.1)
mix.add(braam(55.0 * key, 3.0, 0.5), 2.4)
mix.add(impact(0.6), 2.4)
mix.add(sizzle(1.4, 0.07), 2.5)
mix.add(shimmer(2.4, 0.06), 3.1)

# 4–8.4 s: the bottle in the light.
whoosh_at(3.85)
mix.add(impact(0.3), 4.0)
chord(A_MINOR, 3.9, 2.6, 0.045)
chord(F_MAJOR, 6.1, 2.6, 0.045)
for beat in np.arange(4.5, 8.0, BEAT * 2):
    mix.add(kick(0.28), beat)
if sparkling:
    mix.add(sizzle(4.4, 0.035), 4.0)

# 8.4–11.4 s: zoom into the photo.
mix.add(riser(0.6, 0.2), 7.85)
whoosh_at(7.9, 0.5, 0.26, reverse=True)
mix.add(impact(0.55), 8.4)
chord(C_MAJOR, 8.3, 1.8, 0.045)
chord(A_MINOR, 9.9, 1.8, 0.045)
for beat in np.arange(8.4, 11.0, BEAT * 2):
    mix.add(kick(0.42), beat)
    mix.add(hat(0.05), beat + BEAT, pan=0.3)
mix.add(riser(0.9, 0.24), 10.5)
for i, when in enumerate(np.arange(10.9, 11.4 - 1e-6, BEAT / 4)):
    mix.add(hat(0.04 + i * 0.01), when, pan=-0.2)

# 11.4–15.4 s: ingredients on the beat.
mix.add(impact(0.8), 11.4)
for beat in np.arange(11.4, 15.4 - 1e-6, BEAT):
    mix.add(kick(0.6), beat)
    mix.add(hat(0.07), beat + BEAT / 2, pan=0.35)
    mix.add(braam(110.0 * key, 0.45, 0.12), beat)
for start, notes in [(11.4, A_MINOR), (12.4, F_MAJOR), (13.4, C_MAJOR), (14.4, G_MAJOR)]:
    chord(notes, start, 1.4, 0.05)

# 15.4–20 s: particles gather, burst at 17.2 s, regroup, final chord.
whoosh_at(15.25)
mix.add(drone(1.9, root=55.0 * key, gain=0.16), 15.4)
mix.add(riser(1.8, 0.3), 15.4)
mix.add(impact(1.0), 17.2)
mix.add(braam(55.0 * key, 3.0, 0.55), 17.2)
mix.add(shimmer(2.5, 0.07), 17.25)
whoosh_at(17.6, 1.1, 0.3, reverse=True)
mix.add(impact(0.45), 18.4)
mix.add(shimmer(1.6, 0.07), 18.45)
chord(A_MINOR, 18.2, 1.8, 0.05)

mix.write(OUT, fade_out=1.2)
print(f"{OUT.name}: {DURATION} s, peak -1 dBFS")
