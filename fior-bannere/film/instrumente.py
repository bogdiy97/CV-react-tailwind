"""Sound building blocks for the Fior films: a stereo mix bus and synthesised instruments.

Everything is generated from code, so the films carry no music licence. Used by sunet.py
(film 1) and sunet-2.py (film 2).
"""
import wave

import numpy as np

SR = 48000
rng = np.random.default_rng(7)


def seconds(length):
    return np.arange(int(length * SR)) / SR


def band_noise(length, low, high):
    """White noise limited to a frequency band (FFT mask), normalised to ±1."""
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


def whoosh(length=0.75, gain=0.32, reverse=False):
    """Returns (sound, per-sample pan) for Mix.add."""
    t = seconds(length)
    shape = np.sin(np.pi * t / length) ** 3
    if reverse:
        shape = (t / length) ** 3
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


def braam(root=55.0, length=3.2, gain=0.5):
    """Cinematic brass-like hit: detuned saw stacks on the root and its octave and fifth."""
    t = seconds(length)
    tone = np.zeros_like(t)
    for ratio, level in [(1, 1.0), (2, 0.7), (3, 0.35), (4, 0.25)]:
        for detune in (0.995, 1.0, 1.006):
            phase = (root * ratio * detune * t) % 1.0
            tone += level * (2 * phase - 1) * np.exp(-t * (0.5 + ratio * 0.35))
    swell = envelope(len(t), 0.06, 1.2)
    return np.tanh(tone * 0.35) * swell * gain


def drone(length, root=55.0, gain=0.18):
    t = seconds(length)
    tone = np.sin(2 * np.pi * root * t) + 0.5 * np.sin(2 * np.pi * root * 1.5 * t) + 0.3 * np.sin(2 * np.pi * root * 2.01 * t)
    air = band_noise(length, 80, 900) * 0.35
    return (tone + air) * envelope(len(t), length * 0.6, 0.3) * gain


def sizzle(length, gain=0.06):
    t = seconds(length)
    return band_noise(length, 3000, 12000) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t)) * envelope(len(t), 0.1, 0.4) * gain


class Mix:
    """Stereo mix bus of a fixed duration."""

    def __init__(self, duration):
        self.n = int(SR * duration)
        self.left = np.zeros(self.n)
        self.right = np.zeros(self.n)

    def add(self, signal, start, gain=1.0, pan=0.0):
        """Mixes a mono signal in; pan is -1..1, a number or one value per sample."""
        i = int(start * SR)
        signal = signal[: max(0, self.n - i)]
        angle = (np.asarray(pan, dtype=float) + 1) * np.pi / 4
        if angle.ndim:
            angle = angle[: len(signal)]
        self.left[i : i + len(signal)] += signal * gain * np.cos(angle)
        self.right[i : i + len(signal)] += signal * gain * np.sin(angle)

    def chord(self, notes, start, length, gain=0.05):
        """Soft stereo pad on the notes plus a sine bass an octave under the first one."""
        n = int(length * SR)
        for freq in notes:
            env = envelope(n, 0.9, 1.4)
            self.add(soft_tone(freq, length, 0.997) * env, start, gain, pan=-0.45)
            self.add(soft_tone(freq, length, 1.003) * env, start, gain, pan=0.45)
        bass = notes[0] / 2
        self.add(np.sin(2 * np.pi * bass * seconds(length)) * envelope(n, 0.4, 1.0), start, 0.11)

    def write(self, path, fade_out=1.6):
        """Gentle saturation, fades, -1 dBFS peak, 16-bit stereo WAV."""
        mix = np.stack([self.left, self.right])
        mix = np.tanh(mix * 1.3) / np.tanh(1.3)
        fade_in = int(0.05 * SR)
        fade = int(fade_out * SR)
        mix[:, :fade_in] *= np.linspace(0, 1, fade_in)
        mix[:, -fade:] *= np.linspace(1, 0, fade) ** 1.5
        mix *= 0.89 / np.max(np.abs(mix))
        pcm = (mix.T * 32767).astype("<i2")
        with wave.open(str(path), "wb") as out:
            out.setnchannels(2)
            out.setsampwidth(2)
            out.setframerate(SR)
            out.writeframes(pcm.tobytes())


# Chords used by both films (Hz).
A_MINOR = [220.0, 261.63, 329.63]
F_MAJOR = [174.61, 220.0, 261.63]
C_MAJOR = [130.81, 164.81, 196.0, 261.63]
G_MAJOR = [196.0, 246.94, 293.66]
