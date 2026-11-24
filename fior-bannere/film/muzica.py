"""Music for the Fior videos, composed as MIDI and played with sampled instruments through FluidSynth
(MuseScore General soundfont, MIT/CC0; falls back to FluidR3 GM, MIT), so there are no music rights to clear.

The arrangement follows the video: --sections set the energy, --hits mark the cuts.
Styles:
  lounge  – A minor: electric piano, strings, finger bass, light drums, vibraphone (brand films, products)
  craciun – C major: celesta, glockenspiel, harp, strings, choir, sleigh bells, tubular bells (Christmas film)
Sections: intro, verse, drop, finale.

Usage:
  python3 muzica.py <out.wav> --duration 20 --bpm 120 [--style lounge] [--offset 0.4] [--key 0]
      --sections 0:intro,4:verse,11.4:drop,15.4:finale --hits 4,8.4,11.4 [--big 17.2] [--final 18.4]
Needs: fluidsynth and a soundfont (apt: fluidsynth musescore-general-soundfont), mido + numpy (pip).
"""
import argparse
import re
import subprocess
import tempfile
import wave
from pathlib import Path

import mido
import numpy as np

SOUNDFONTS = ["/usr/share/sounds/sf3/MuseScore_General_Full.sf3", "/usr/share/sounds/sf2/FluidR3_GM.sf2"]
SR = 48000
TICKS = 480
DRUMS = 9
KICK, STICK, CLAP, HAT, OPEN_HAT, CRASH, TAMBOURINE, CRASH2, SHAKER, TRIANGLE, SLEIGH = 36, 37, 39, 42, 46, 49, 54, 57, 70, 81, 83


class Score:
    """Notes on named instruments; `programs` maps a name to its General MIDI program (0-based)."""

    def __init__(self, bpm, key, programs):
        self.bpm = bpm
        self.key = key
        melodic = [channel for channel in range(16) if channel != DRUMS]
        self.channels = dict(zip((name for name in programs if name != "drums"), melodic))
        self.channels["drums"] = DRUMS
        self.programs = programs
        self.events = []  # (tick, order, message)

    def tick(self, seconds):
        return max(0, round(seconds * self.bpm / 60 * TICKS))

    def note(self, instrument, pitch, start, length, velocity):
        if start < 0:
            return
        channel = self.channels[instrument]
        pitch += 0 if channel == DRUMS else self.key
        velocity = int(max(1, min(127, velocity)))
        self.events.append((self.tick(start), 1, mido.Message("note_on", channel=channel, note=pitch, velocity=velocity)))
        self.events.append((self.tick(start + length), 0, mido.Message("note_off", channel=channel, note=pitch, velocity=0)))

    def chord(self, instrument, pitches, start, length, velocity, roll=0.0):
        for i, pitch in enumerate(pitches):
            self.note(instrument, pitch, start + i * roll, length - i * roll, velocity)

    def save(self, path):
        track = mido.MidiTrack()
        track.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(self.bpm), time=0))
        for name, program in self.programs.items():
            if name != "drums":
                track.append(mido.Message("program_change", channel=self.channels[name], program=program, time=0))
                track.append(mido.Message("control_change", channel=self.channels[name], control=91, value=70, time=0))  # reverb send
        last = 0
        for tick, _, message in sorted(self.events, key=lambda e: (e[0], e[1])):
            track.append(message.copy(time=tick - last))
            last = tick
        midi = mido.MidiFile(ticks_per_beat=TICKS)
        midi.tracks.append(track)
        midi.save(path)


# ---------- lounge (A minor): Am9, Fmaj9, Cmaj9, G6/9 ----------
LOUNGE_PROGRAMS = {"pad": 49, "epiano": 4, "bass": 33, "celesta": 8, "vibes": 11, "swell": 119, "piano": 0,
                   "timpani": 47, "guitar": 26, "drums": None}
LOUNGE_CHORDS = [(45, [57, 60, 64, 67, 71]), (41, [53, 57, 60, 64, 67]), (48, [52, 55, 59, 62, 64]), (43, [55, 59, 62, 64, 69])]
# A two-bar motif repeated over the progression: (beat in the bar, length in beats, scale step over the chord).
# Piano plays it in the verse, vibraphone doubles it an octave up in the drop.
LOUNGE_TUNE = [
    [(0, 1.5, 4), (1.5, 0.5, 3), (2, 1, 2), (3, 1, 3)],
    [(0, 2, 4), (2.5, 0.5, 2), (3, 1, 1)],
    [(0, 1.5, 3), (1.5, 0.5, 4), (2, 1, 2), (3, 1, 1)],
    [(0, 3, 2)],
]
RIDE, RIDE_BELL = 51, 53


def lounge_beat(score, section, t, beat, b, bar, root, voicing):
    accent = 1.0 if b == 0 else 0.85
    swing = beat * 0.58  # swung off-beat
    if b == 0:
        score.chord("pad", voicing, t, beat * 4, {"intro": 48, "verse": 40, "drop": 44, "finale": 56}[section])
    if section in ("verse", "drop"):
        for start, length, step in LOUNGE_TUNE[bar % 4]:
            if int(start) == b:
                when = t + (swing if start % 1 else 0)
                score.note("piano", voicing[step] + 12, when, beat * length * 0.9, 70 if section == "verse" else 76)
                if section == "drop":
                    score.note("vibes", voicing[step] + 24, when, beat * length * 0.9, 52)
    if section == "intro":
        score.note("celesta", voicing[(b * 2) % 5] + 12, t, beat, 40)
        score.note("celesta", voicing[(b * 2 + 3) % 5] + 12, t + beat / 2, beat / 2, 32)
    elif section == "verse":
        if b in (0, 2):
            score.chord("epiano", voicing[:4], t + (swing if b == 2 else 0), beat * 0.9, 50 * accent)
        if b == 0:
            score.note("bass", root - 12, t, beat * 1.5, 76)
        if b == 2:
            score.note("bass", root - 5, t + swing, beat * 0.5, 66)
        if b == 3:
            score.note("bass", root - 12 + 10, t + swing, beat * 0.4, 60)  # walk up into the next bar
        if b in (0, 2):
            score.note("drums", KICK, t + (swing if b == 2 else 0), beat / 2, 62)
        if b in (1, 3):
            score.note("drums", STICK, t, beat / 2, 50)
        score.note("drums", RIDE, t, beat / 2, 44 if b % 2 == 0 else 36)
        score.note("drums", SHAKER, t + swing, beat / 4, 26)
    elif section == "drop":
        score.note("drums", KICK, t, beat / 2, 100)
        if b in (1, 3):
            score.note("drums", CLAP, t, beat / 2, 82)
        score.note("drums", HAT, t, beat / 4, 50)
        score.note("drums", OPEN_HAT, t + beat / 2, beat / 4, 52)
        score.note("drums", RIDE_BELL, t, beat / 2, 40)
        score.chord("guitar", voicing[1:4], t + beat / 2, beat * 0.2, 62)  # muted off-beat stabs
        score.chord("epiano", voicing[:4], t + beat / 2, beat * 0.4, 50)
        for half in (0, 1):
            score.note("bass", root - 12 + (12 if half else 0), t + half * beat / 2, beat * 0.45, 86)
    elif section == "finale" and b == 0:
        score.chord("piano", [root - 12] + voicing, t, beat * 4, 58, roll=0.06)
        score.note("celesta", voicing[-1] + 12, t + beat * 2, beat * 2, 34)


def lounge_ending(score, start, length):
    root, voicing = LOUNGE_CHORDS[0]
    score.chord("piano", [root - 24, root - 12] + voicing, start, length, 66, roll=0.05)
    score.chord("pad", voicing, start, length, 60)
    score.note("celesta", voicing[-1] + 24, start + 0.3, length - 0.3, 36)


# ---------- craciun (C major): C, Am, F, G ----------
CRACIUN_PROGRAMS = {"strings": 48, "celesta": 8, "glock": 9, "harp": 46, "bells": 14, "choir": 52, "bass": 32,
                    "piano": 0, "swell": 119, "timpani": 47, "flute": 73, "drums": None}
CRACIUN_CHORDS = [(48, [60, 64, 67, 72]), (45, [57, 60, 64, 69]), (41, [57, 60, 65, 69]), (43, [55, 59, 62, 67])]
# One bar of melody per chord, in eighth notes (None = rest), an octave above the voicing.
CRACIUN_MELODY = [
    [76, 79, 84, 79, 76, 79, 84, None],
    [81, 84, 88, 84, 81, 84, 88, None],
    [77, 81, 84, 81, 77, 81, 86, 84],
    [83, 86, 91, 86, 83, 81, 79, None],
]
# The tune on top, over eight bars: (beat in the bar, length in beats, pitch).
CRACIUN_TUNE = [
    [(0, 2, 79), (2, 1, 76), (3, 1, 79)],
    [(0, 2, 81), (2, 2, 84)],
    [(0, 1, 81), (1, 1, 79), (2, 1, 77), (3, 1, 81)],
    [(0, 3, 79)],
    [(0, 2, 84), (2, 2, 79)],
    [(0, 2, 81), (2, 2, 76)],
    [(0, 1, 77), (1, 1, 79), (2, 1, 81), (3, 1, 84)],
    [(0, 2, 86), (2, 2, 83)],
]


def craciun_beat(score, section, t, beat, b, bar, root, voicing):
    melody = CRACIUN_MELODY[bar % 4]
    full = section in ("drop", "finale")
    if b == 0:
        score.chord("strings", [root] + voicing, t, beat * 4, {"intro": 44, "verse": 50, "drop": 62, "finale": 66}[section])
        if full:
            score.chord("choir", voicing, t, beat * 4, 54)
            score.note("bells", voicing[0] + 12, t, beat * 4, 78)
    # celesta plays the melody everywhere; the glockenspiel doubles it when the arrangement is full
    for half in (0, 1):
        pitch = melody[b * 2 + half]
        if pitch is not None:
            when = t + half * beat / 2
            score.note("celesta", pitch, when, beat * 0.9, 62 if half == 0 else 50)
            if full:
                score.note("glock", pitch + 12, when, beat * 0.5, 46)
    if section != "intro":
        # the tune on the flute, harp arpeggio in sixteenths, bass on one and three, sleigh bells on the eighths
        for start, length, pitch in CRACIUN_TUNE[bar % 8]:
            if start == b:
                score.note("flute", pitch, t, beat * length * 0.95, 74 if full else 64)
        for i in range(4):
            score.note("harp", voicing[(b + i) % 4] - 12 + (12 if i % 2 else 0), t + i * beat / 4, beat * 0.6, 38 + 6 * (i == 0))
        if b in (0, 2):
            score.note("bass", root - 12, t, beat * 1.8, 70)
        score.note("drums", SLEIGH, t, beat / 4, 70 if b % 2 == 0 else 58)
        score.note("drums", SLEIGH, t + beat / 2, beat / 4, 46)
    elif b in (0, 2):
        score.note("drums", SLEIGH, t, beat / 4, 40)
    if section == "drop":
        score.note("drums", TAMBOURINE, t + beat / 2, beat / 4, 58)
        score.note("drums", KICK, t, beat / 2, 78)
        if b in (1, 3):
            score.chord("piano", voicing, t, beat * 0.5, 60)
            score.note("drums", TRIANGLE, t, beat / 2, 64)


def craciun_ending(score, start, length):
    root, voicing = CRACIUN_CHORDS[0]
    score.chord("strings", [root - 12, root] + voicing, start, length, 70)
    score.chord("choir", voicing, start, length, 60)
    score.chord("harp", [root, root + 7] + voicing + [voicing[0] + 24], start, length, 70, roll=0.07)
    score.note("bells", voicing[0] + 12, start, length, 96)
    score.note("glock", voicing[-1] + 24, start + 0.4, length - 0.4, 50)


STYLES = {
    "lounge": (LOUNGE_PROGRAMS, LOUNGE_CHORDS, lounge_beat, lounge_ending),
    "craciun": (CRACIUN_PROGRAMS, CRACIUN_CHORDS, craciun_beat, craciun_ending),
}


def section_at(sections, t):
    current = sections[0][1]
    for start, name in sections:
        if t + 1e-6 >= start:
            current = name
    return current


def compose(args):
    programs, chords, beat_fn, ending_fn = STYLES[args.style]
    score = Score(args.bpm, args.key, programs)
    beat = 60 / args.bpm
    sections = sorted(args.sections)
    final = args.final if args.final is not None else max(s for s, n in sections if n == "finale")

    bars_before = int(args.offset // (beat * 4)) + 1  # start a bar before zero, so the bar at `offset` gets the first chord
    bar_start = args.offset - beat * 4 * bars_before
    bar = -bars_before
    while bar_start < final:
        root, voicing = chords[bar % 4]
        for b in range(4):
            t = bar_start + b * beat
            if 0 <= t < final:
                beat_fn(score, section_at(sections, t), t, beat, b, bar, root, voicing)
        bar_start += beat * 4
        bar += 1
    ending_fn(score, final, args.duration - final)

    # Transitions: a reverse cymbal swelling into every hit and a crash on it; big hits add timpani and a low root.
    low_root = chords[0][0] - 12
    for hit in sorted(set(args.hits) | set(args.big)):
        big = hit in args.big
        if hit >= 1.2:
            score.note("swell", 60, hit - 1.2, 1.2, 70 if big else 52)
        score.note("drums", CRASH, hit, 1.5, 100 if big else 72)
        if big:
            score.note("drums", CRASH2, hit, 1.5, 90)
            score.note("timpani", low_root, hit, 1.6, 110)
            score.note("bass", low_root, hit, 1.6, 100)
    return score


def render(score, out, duration):
    soundfont = next(path for path in SOUNDFONTS if Path(path).exists())
    with tempfile.TemporaryDirectory() as tmp:
        midi = Path(tmp) / "fior.mid"
        raw = Path(tmp) / "fior.wav"
        score.save(midi)
        subprocess.run(["fluidsynth", "-ni", "-q", "-g", "0.6", "-r", str(SR), "-O", "s16", "-F", str(raw), soundfont, str(midi)],
                       check=True, stdout=subprocess.DEVNULL)
        with wave.open(str(raw)) as w:
            audio = np.frombuffer(w.readframes(w.getnframes()), "<i2").reshape(-1, w.getnchannels()).astype(float) / 32768

    n = int(duration * SR)
    audio = np.pad(audio, ((0, max(0, n - len(audio))), (0, 0)))[:n]
    fade_in, fade_out = int(0.02 * SR), int(1.2 * SR)
    audio[:fade_in] *= np.linspace(0, 1, fade_in)[:, None]
    audio[-fade_out:] *= (np.linspace(1, 0, fade_out) ** 1.5)[:, None]
    write_wav(out, master(audio))


def write_wav(path, audio):
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((audio * 32767).astype("<i2").tobytes())


def loudness(audio):
    """Integrated loudness in LUFS (EBU R128), measured by ffmpeg."""
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "mix.wav"
        write_wav(path, audio)
        log = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", "ebur128", "-f", "null", "-"],
                             capture_output=True, text=True).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", log)[-1])


def master(audio, target=-14.0):
    """Soft-limits the mix until it reaches the target loudness (the level social platforms play at); peak -1 dBFS."""
    audio = audio / max(np.max(np.abs(audio)), 1e-9)
    for drive in (1.0, 1.25, 1.6, 2.0, 2.5, 3.2, 4.0, 5.0):
        limited = np.tanh(audio * drive) / np.tanh(drive) * 0.89
        level = loudness(limited)
        if level >= target - 0.3:
            break
    return limited * min(1.0, 10 ** ((target - level) / 20))


def times(text):
    return [float(x) for x in text.split(",") if x]


def sections(text):
    return [(float(start), name) for start, name in (item.split(":") for item in text.split(","))]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("out")
    parser.add_argument("--duration", type=float, required=True)
    parser.add_argument("--bpm", type=float, required=True)
    parser.add_argument("--style", choices=sorted(STYLES), default="lounge")
    parser.add_argument("--offset", type=float, default=0.0, help="time of a downbeat, so the drums land on the cuts")
    parser.add_argument("--key", type=int, default=0, help="semitones to transpose")
    parser.add_argument("--sections", type=sections, required=True)
    parser.add_argument("--hits", type=times, default=[])
    parser.add_argument("--big", type=times, default=[])
    parser.add_argument("--final", type=float, default=None, help="when the last chord starts (default: the finale)")
    args = parser.parse_args()
    render(compose(args), args.out, args.duration)
    print(f"{args.out}: {args.duration} s, {args.style}")


if __name__ == "__main__":
    main()
