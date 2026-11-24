"""Synthesises the sound design for the Fior film: 26 s, 48 kHz stereo WAV.

Everything is generated here (pad, bass, kicks, hats, risers, whooshes, impacts, shimmer),
so there is no music licence to clear. Timings follow film.js: 100 BPM, one beat = 0.6 s.

Usage: python3 fior-bannere/film/sunet.py   ->  writes fior-bannere/film/sunet.wav
"""
import wave
from pathlib import Path

import numpy as np

SR = 48000
DURATION = 26.0
BEAT = 0.6
N = int(SR * DURATION)
OUT = Path(__file__).with_name("sunet.wav")

rng = np.random.default_rng(7)
left = np.zeros(N)
right = np.zeros(N)


def seconds(length):
    return np.arange(int(length * SR)) / SR


def add(signal, start, gain=1.0, pan=0.0):
    """Mixes a mono signal into the stereo bus; pan is -1..1, a number or one value per sample."""
    i = int(start * SR)
    signal = signal[: max(0, N - i)]
    angle = (np.asarray(pan, dtype=float) + 1) * np.pi / 4
    if angle.ndim:
        angle = angle[: len(signal)]
    left[i : i + len(signal)] += signal * gain * np.cos(angle)
    right[i : i + len(signal)] += signal * gain * np.sin(angle)


def band_noise(length, low, high):
    """White noise limited to a frequency band (FFT mask)."""
    n = int(length * SR)
    spectrum = np.fft.rfft(rng.standard_normal(n))
    freqs = np.fft.rfftfreq(n, 1 / SR)
    spectrum[(freqs < low) | (freqs > high)] = 0
    noise = np.fft.irfft(spectrum, n)
    return noise / (np.max(np.abs(noise)) + 1e-9)


def envelope(n, attack, release):
    env = np.ones(n)
    a = min(n, int(attack * SR))
    r = min(n, int(release * SR))
    if a:
        env[:a] = np.linspace(0, 1, a) ** 2
    if r:
        env[-r:] *= np.linspace(1, 0, r) ** 2
    return env


def soft_tone(freq, length, detune=1.0):
    t = seconds(length)
    harmonics = [(1, 1.0), (2, 0.28), (3, 0.1), (4, 0.04)]
    phase = rng.uniform(0, 2 * np.pi)
    return sum(a * np.sin(2 * np.pi * freq * detune * k * t + phase * k) for k, a in harmonics)


def chord(notes, start, length, gain=0.05):
    for freq in notes:
        n = int(length * SR)
        env = envelope(n, 0.9, 1.4)
        add(soft_tone(freq, length, 0.997) * env, start, gain, pan=-0.45)
        add(soft_tone(freq, length, 1.003) * env, start, gain, pan=0.45)
    bass = notes[0] / 2
    n = int(length * SR)
    add(np.sin(2 * np.pi * bass * seconds(length)) * envelope(n, 0.4, 1.0), start, 0.11)


def kick(gain=0.55):
    t = seconds(0.5)
    freq = 46 + 100 * np.exp(-t * 30)
    body = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 7.5)
    click = band_noise(0.5, 1500, 6000) * np.exp(-t * 120) * 0.25
    return (body + click) * gain


def hat(gain=0.06):
    t = seconds(0.09)
    return band_noise(0.09, 7000, 15000) * np.exp(-t * 55) * gain


def impact(gain=0.8):
    length = 2.6
    t = seconds(length)
    freq = 34 + 30 * np.exp(-t * 3)
    sub = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 2.2)
    rumble = band_noise(length, 30, 500) * np.exp(-t * 3.5) * 0.45
    hit = sub + rumble
    tail = np.zeros_like(hit)
    for delay, decay in [(0.07, 0.35), (0.13, 0.25), (0.21, 0.18), (0.34, 0.12)]:
        d = int(delay * SR)
        tail[d:] += hit[:-d] * decay
    return (hit + tail) * gain


def whoosh(length=0.75, gain=0.32):
    t = seconds(length)
    shape = np.sin(np.pi * t / length) ** 3
    return band_noise(length, 400, 7000) * shape * gain, np.linspace(-0.8, 0.8, len(t))


def riser(length=2.6, gain=0.28):
    t = seconds(length)
    ramp = (t / length) ** 2.2
    sweep = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (2 * t / length)) / SR) * 0.35
    return (band_noise(length, 2500, 10000) * 0.6 + sweep) * ramp * gain


def shimmer(length=2.4, gain=0.05):
    t = seconds(length)
    notes = [880.0, 1318.5, 1760.0, 2093.0, 2637.0]
    tone = sum(np.sin(2 * np.pi * f * t) * (0.6 + 0.4 * np.sin(2 * np.pi * (5 + i) * t)) for i, f in enumerate(notes))
    return tone * np.exp(-t * 1.6) * envelope(len(t), 0.03, 0.4) * gain


# --- chords (A minor, 100 BPM) ---
A_MINOR = [220.0, 261.63, 329.63]
F_MAJOR = [174.61, 220.0, 261.63]
C_MAJOR = [130.81, 164.81, 196.0, 261.63]
G_MAJOR = [196.0, 246.94, 293.66]
for start, notes, length in [
    (3.6, A_MINOR, 3.6), (6.0, F_MAJOR, 3.6), (8.4, C_MAJOR, 3.6), (10.8, G_MAJOR, 3.6),
    (13.2, A_MINOR, 3.6), (15.6, F_MAJOR, 3.6), (18.0, C_MAJOR, 3.0), (20.0, A_MINOR, 6.0),
]:
    chord(notes, start, length)

# --- logo forge ---
add(riser(), 0.05)
add(impact(0.75), 2.62)
add(shimmer(3.0, 0.06), 2.65)

# --- transitions ---
for when in (3.45, 7.2, 10.4):
    sound, pan = whoosh()
    add(sound, when, pan=pan)
add(impact(0.35), 3.6)

# --- rhythm: half time, then full time, then the final hit ---
for beat in np.arange(7.4, 13.4 - 1e-6, BEAT * 2):
    add(kick(0.42), beat)
for beat in np.arange(13.4, 20.0 - 1e-6, BEAT):
    add(kick(0.55), beat)
    add(hat(), beat + BEAT / 2, pan=0.3)
for cut in (14.0, 14.6, 15.2):
    add(hat(0.09), cut, pan=-0.3)
add(impact(0.9), 20.0)
add(shimmer(3.5, 0.07), 20.05)
add(shimmer(2.5, 0.04), 22.8)

# --- master: gentle saturation, fades, -1 dBFS peak ---
mix = np.stack([left, right])
mix = np.tanh(mix * 1.3) / np.tanh(1.3)
fade_in = int(0.05 * SR)
fade_out = int(1.6 * SR)
mix[:, :fade_in] *= np.linspace(0, 1, fade_in)
mix[:, -fade_out:] *= np.linspace(1, 0, fade_out) ** 1.5
mix *= 0.89 / np.max(np.abs(mix))

pcm = (mix.T * 32767).astype("<i2")
with wave.open(str(OUT), "wb") as out:
    out.setnchannels(2)
    out.setsampwidth(2)
    out.setframerate(SR)
    out.writeframes(pcm.tobytes())
print(f"{OUT.name}: {DURATION} s, peak -1 dBFS")
