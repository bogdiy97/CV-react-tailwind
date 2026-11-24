"""Music for the Fior videos, composed as MIDI and played with sampled instruments
(FluidSynth + the FluidR3 General MIDI soundfont, MIT licence), so there are no music rights to clear.

The arrangement follows the video: sections set the energy, hits mark the cuts.
  intro  – warm strings and a celesta arpeggio
  verse  – electric piano, finger bass, light percussion
  drop   – full groove: kick on every beat, claps, hats, pulsing bass, vibraphone
  finale – piano and strings, then the last chord rings out

Usage:
  python3 muzica.py <out.wav> --duration 20 --bpm 120 [--offset 0.4] [--key 0]
      --sections 0:intro,4:verse,11.4:drop,15.4:finale --hits 4,8.4,11.4 [--big 17.2] [--final 18.4]
Needs: fluidsynth, fluid-soundfont-gm (apt), mido + numpy (pip).
"""
import argparse
import subprocess
import tempfile
import wave
from pathlib import Path

import mido
import numpy as np

SOUNDFONT = "/usr/share/sounds/sf2/FluidR3_GM.sf2"
SR = 48000
TICKS = 480

# General MIDI programs (0-based) and channels.
PAD, EPIANO, BASS, CELESTA, VIBES, SWELL, PIANO, TIMPANI = range(8)
PROGRAMS = {PAD: 49, EPIANO: 4, BASS: 33, CELESTA: 8, VIBES: 11, SWELL: 119, PIANO: 0, TIMPANI: 47}
DRUMS = 9
KICK, STICK, CLAP, HAT, OPEN_HAT, CRASH, CRASH2, SHAKER = 36, 37, 39, 42, 46, 49, 57, 70

# A minor colours: (bass root, voicing) – Am9, Fmaj9, Cmaj9, G6/9, one chord per bar.
CHORDS = [
    (45, [57, 60, 64, 67, 71]),
    (41, [53, 57, 60, 64, 67]),
    (48, [52, 55, 59, 62, 64]),
    (43, [55, 59, 62, 64, 69]),
]


class Score:
    def __init__(self, bpm, key):
        self.bpm = bpm
        self.key = key
        self.events = []  # (tick, order, message)

    def tick(self, seconds):
        return max(0, round(seconds * self.bpm / 60 * TICKS))

    def note(self, channel, pitch, start, length, velocity):
        pitch += 0 if channel == DRUMS else self.key
        velocity = int(max(1, min(127, velocity)))
        self.events.append((self.tick(start), 1, mido.Message("note_on", channel=channel, note=pitch, velocity=velocity)))
        self.events.append((self.tick(start + length), 0, mido.Message("note_off", channel=channel, note=pitch, velocity=0)))

    def chord(self, channel, pitches, start, length, velocity, roll=0.0):
        for i, pitch in enumerate(pitches):
            self.note(channel, pitch, start + i * roll, length - i * roll, velocity)

    def save(self, path):
        track = mido.MidiTrack()
        track.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(self.bpm), time=0))
        for channel, program in PROGRAMS.items():
            track.append(mido.Message("program_change", channel=channel, program=program, time=0))
        track.append(mido.Message("control_change", channel=PAD, control=91, value=100, time=0))  # reverb
        last = 0
        for tick, _, message in sorted(self.events, key=lambda e: (e[0], e[1])):
            track.append(message.copy(time=tick - last))
            last = tick
        midi = mido.MidiFile(ticks_per_beat=TICKS)
        midi.tracks.append(track)
        midi.save(path)


def section_at(sections, t):
    current = sections[0][1]
    for start, name in sections:
        if t + 1e-6 >= start:
            current = name
    return current


def compose(args):
    score = Score(args.bpm, args.key)
    beat = 60 / args.bpm
    sections = sorted(args.sections)
    final = args.final if args.final is not None else max(s for s, n in sections if n == "finale")

    bars_before = int(args.offset // (beat * 4)) + 1  # start a bar before zero, so the bar at `offset` gets the first chord
    bar_start = args.offset - beat * 4 * bars_before
    bar_index = -bars_before
    while bar_start < final:
        root, voicing = CHORDS[bar_index % 4]
        for b in range(4):
            t = bar_start + b * beat
            if t < 0 or t >= final:
                continue
            name = section_at(sections, t)
            accent = 1.0 if b == 0 else 0.85
            if b == 0:
                score.chord(PAD, voicing, t, beat * 4, {"intro": 48, "verse": 42, "drop": 46, "finale": 56}[name])
            if name == "intro":
                score.note(CELESTA, voicing[(b * 2) % 5] + 12, t, beat, 40)
                score.note(CELESTA, voicing[(b * 2 + 3) % 5] + 12, t + beat / 2, beat / 2, 32)
            elif name == "verse":
                if b in (0, 2):
                    score.chord(EPIANO, voicing, t + (beat / 2 if b == 2 else 0), beat * 0.9, 56 * accent)
                if b == 0:
                    score.note(BASS, root - 12, t, beat * 1.5, 74)
                if b == 2:
                    score.note(BASS, root - 12, t + beat / 2, beat * 0.5, 66)
                if b in (0, 2):
                    score.note(DRUMS, KICK, t + (beat / 2 if b == 2 else 0), beat / 2, 62)
                if b in (1, 3):
                    score.note(DRUMS, STICK, t, beat / 2, 48)
                score.note(DRUMS, SHAKER, t, beat / 4, 34)
                score.note(DRUMS, SHAKER, t + beat / 2, beat / 4, 26)
            elif name == "drop":
                score.note(DRUMS, KICK, t, beat / 2, 100)
                if b in (1, 3):
                    score.note(DRUMS, CLAP, t, beat / 2, 82)
                score.note(DRUMS, HAT, t, beat / 4, 50)
                score.note(DRUMS, OPEN_HAT, t + beat / 2, beat / 4, 52)
                score.chord(EPIANO, voicing, t + beat / 2, beat * 0.4, 58)
                for half in (0, 1):
                    score.note(BASS, root - 12 + (12 if half else 0), t + half * beat / 2, beat * 0.45, 84)
                score.note(VIBES, voicing[(b + bar_index) % 5] + 12, t, beat * 0.9, 56)
            elif name == "finale" and b == 0:
                score.chord(PIANO, [root - 12] + voicing, t, beat * 4, 58, roll=0.06)
                score.note(CELESTA, voicing[-1] + 12, t + beat * 2, beat * 2, 34)
        bar_start += beat * 4
        bar_index += 1

    # The last chord rings out over the end.
    root, voicing = CHORDS[0]
    ring = args.duration - final
    score.chord(PIANO, [root - 24, root - 12] + voicing, final, ring, 66, roll=0.05)
    score.chord(PAD, voicing, final, ring, 60)
    score.note(CELESTA, voicing[-1] + 24, final + 0.3, ring - 0.3, 36)

    # Transitions: a reverse cymbal swelling into every hit, a crash on it; big hits add timpani and a low root.
    for hit in sorted(set(args.hits) | set(args.big)):
        big = hit in args.big
        if hit >= 1.2:
            score.note(SWELL, 60, hit - 1.2, 1.2, 70 if big else 52)
        score.note(DRUMS, CRASH, hit, 1.5, 100 if big else 72)
        if big:
            score.note(DRUMS, CRASH2, hit, 1.5, 90)
            score.note(TIMPANI, 33, hit, 1.6, 110)
            score.note(BASS, 33, hit, 1.6, 100)
    return score


def render(score, out, duration):
    with tempfile.TemporaryDirectory() as tmp:
        midi = Path(tmp) / "fior.mid"
        raw = Path(tmp) / "fior.wav"
        score.save(midi)
        subprocess.run(["fluidsynth", "-ni", "-q", "-g", "0.6", "-r", str(SR), "-O", "s16", "-F", str(raw), SOUNDFONT, str(midi)],
                       check=True, stdout=subprocess.DEVNULL)
        with wave.open(str(raw)) as w:
            audio = np.frombuffer(w.readframes(w.getnframes()), "<i2").reshape(-1, w.getnchannels()).astype(float) / 32768

    n = int(duration * SR)
    audio = np.pad(audio, ((0, max(0, n - len(audio))), (0, 0)))[:n]
    fade_in, fade_out = int(0.02 * SR), int(1.2 * SR)
    audio[:fade_in] *= np.linspace(0, 1, fade_in)[:, None]
    audio[-fade_out:] *= (np.linspace(1, 0, fade_out) ** 1.5)[:, None]
    audio *= 0.89 / max(np.max(np.abs(audio)), 1e-9)
    with wave.open(str(out), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((audio * 32767).astype("<i2").tobytes())


def times(text):
    return [float(x) for x in text.split(",") if x]


def sections(text):
    return [(float(start), name) for start, name in (item.split(":") for item in text.split(","))]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("out")
    parser.add_argument("--duration", type=float, required=True)
    parser.add_argument("--bpm", type=float, required=True)
    parser.add_argument("--offset", type=float, default=0.0, help="time of a downbeat, so the drums land on the cuts")
    parser.add_argument("--key", type=int, default=0, help="semitones from A minor")
    parser.add_argument("--sections", type=sections, required=True)
    parser.add_argument("--hits", type=times, default=[])
    parser.add_argument("--big", type=times, default=[])
    parser.add_argument("--final", type=float, default=None, help="when the last chord starts (default: the finale)")
    args = parser.parse_args()
    render(compose(args), args.out, args.duration)
    print(f"{args.out}: {args.duration} s")


if __name__ == "__main__":
    main()
