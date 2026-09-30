# Open Case Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Open Case gets a studio, bought in the shop, where you make beats to busk to the way Figure makes them, with five ready-made beats (the lo-fi, bossa nova, funk, reggae and a slow ballad) and six slots of your own; your sets play the beat you choose.

**Architecture:**
- **Beats become data** (`beats.js`): a tempo, a swing, a key (six moods of the white keys), a length, a sound for each part, a mix, and three parts (drums, bass, chords). The band plays whichever beat a set uses. The lo-fi, today's loop, is the first beat, note for note.
- **Every part of the game that counts time takes the set's beat's clock** instead of one fixed tempo: the crowd's ears, the loop pedal, the park, the listeners' nods, the bots and the sound. A set lasts about 3 minutes at any tempo.
- **The band learns new sounds** for the new styles (drum kits, basses, chord sounds), each note's tone, the Pump and the Vinyl.
- **The studio** is three new modules:
  - `studio.js`: the workings. Hold to paint a rhythm, erase, clear, undo, the settings, and the slots.
  - `studioview.js`: the screen and what a click lands on.
  - `studioinput.js`: the mouse and the keys.
- **`main.js`** puts the studio on the end card once it's bought, and plays your chosen beat in every set.

**Tech Stack:** Plain ES modules, Canvas 2D, Web Audio, Node 22 `node --test` (no dependencies), and Aseprite 1.3 in batch mode for the art scripts (Lua).

**Spec:** `docs/superpowers/specs/2026-09-30-open-case-studio-design.md`.
- Nathan agreed the design in chat and on the browser mockups, and asked for the spec and then this plan.
- It builds on the loop pedal's spec (`2026-09-29-open-case-loop-pedal-design.md`), the shop's (`2026-09-28-open-case-shop-design.md`) and the game's (`2026-09-28-open-case-design.md`).

**Prototyped:** everything below was built and run before this plan was written, in a scratch copy of the repo. It was then replayed task by task, and each task's end state passes the whole suite:
- 230 tests before, then 233, 239, 248, 269, 279, 288, 290 and 290 after the tasks;
- the sprite sheet: 552 frames, 49 colours, rebuilt byte for byte.

Checked by eye in Chrome:
- each tab of the studio screen, its list of beats and its Mix;
- painting drums with the mouse (the lo-fi copied into your first slot as "Lo-fi 2");
- buying the studio in the shop, opening the funk, Busk to this, and a set that plays the funk ("bar 1/76");
- the groovebox on the shop's counter.

The code in each task is that prototype's code, so transcribe it exactly.

## How to put the code in

- **A new file** is shown whole, under "Create `path`". Write it exactly as shown.
- **A changed file** is shown as a patch (a `diff` block) against the previous task's end state. Write the block to a file exactly as it is, then run `git apply --verbose <that file>` from the repo root.
- **Extract long blocks with a small script** rather than retyping them (python3 or awk, copying the lines between the fences verbatim). The code blocks here are fenced with four backticks.
- If a patch doesn't apply, stop and report it; don't hand-edit around it.
- **A deleted file** is removed with `git rm`, as its step says.

## Global Constraints

- Every commit message starts `Open Case: ` and ends with a blank line and then `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`, exactly that line, whatever model you are.
- Stage only the files your task names (`git add <paths>`, and `git rm` for a deletion), never `git add -A` or `git add .`.
- No new dependencies: plain ES modules, Node 22's `node --test`. Run the tests with `cd open-case && npm test`.
- Aseprite runs from the repo root: `/Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/<name>.lua`. The scripts are deterministic, so a second run leaves `git status` unchanged. Previews (`art/open-case/preview-*`) are never committed.
- Flat style: every area one solid colour from `art/open-case/palette.lua`, no outlines, no dithering. The whole game's art stays within **64 colours** and **under 400 KB**.
- **The rules don't change.** Tastes, tips, patience and the crowd's thresholds keep their values. With the lo-fi, every set, bot score and test comes out exactly as today: the lo-fi beat plays today's notes, voices, lengths and loudness on every 16th.
- **Only the white keys:** a beat's key is one of six moods, C major, D Dorian, E Phrygian, F Lydian, G Mixolydian and A minor. The crowd's in-key rule and the key lock don't change.
- **A set lasts about 3 minutes:** its bars are the multiple of 4 closest to `GROOVE.setSeconds` (180) at the beat's tempo.
- **Tempo 60 to 140, swing 50% (straight) to 75%, length 1, 2 or 4 bars.**
- **The band still builds up with the crowd:**
  - the chords (and the Vinyl's crackle) from the start;
  - the kick, snare and percussion at 1;
  - the bass at 3;
  - the hats (and the Pad and the Vinyl's tape wobble) at 5.
- **The studio is a shop item at 150 coins.** Without it, every set plays the lo-fi.
- **Six slots.** The ready-made beats never change: the first change to one makes your copy ("Funk 2", "Funk 3"...), and a blank beat is "Beat 1", "Beat 2"...
- **`?coins=` pages keep nothing,** beats made in the studio included. The log notes each set's beat.
- **The studio's colours:** drums orange, bass blue, chords green.
- Plain words in comments and messages, in the style of the surrounding code; comment lines wrap at about 100 characters.

## Review Focus

The cases most likely to go wrong that the spec implies. Each is pinned by a test or a check in the task named.
- **Changing the tempo, or opening another beat, while the loop plays.** The band carries on from the same 16th at the new tempo, and nothing jumps or plays twice. (Task 3: "changing the beat mid-loop carries on from the same 16th, timing the rest by the new tempo".)
- **Every slot full.** A copy or New asks which to replace, and Esc leaves everything as it was. (Task 4: "with every slot full, a copy or a new beat asks which to replace; Esc leaves everything as it was".)
- **Stored beats that are broken, or not beats at all.** They're ignored, and the lo-fi plays. (Task 4: "your beats and the chosen one come back after a reload; anything unreadable is left out".)
- **A set at the fastest and slowest ready-made beats.** The crowd's ears, the loop pedal, the bots and the park keep the beat's time, and a set still lasts about 3 minutes. (Task 1: the set lengths of every ready-made beat. Task 2: the set, loop pedal, bots, park and screen tests at the funk, the bossa nova and the ballad.)
- **Leaving the studio mid-hold, or with the list open.** Esc closes the list first. Leaving stops the band and keeps your beat, and the next set plays the beat you chose. (Task 6: "Esc closes the list, or leaves things as they were while asking, or else leaves the studio". Task 8: the Chrome check.)

## Settled in the prototype

The spec left these open, or the prototype changed them. The spec's "What the build settled" (Task 8) records them for Nathan.
- **Esc leaves the studio for the park,** ready for the next set, as the shop does, rather than going back to the end card.
- **With the mouse, Erase is a switch.** A mouse can't hold two things at once. Backspace erases while held.
- **Z and X** move the bass pad an octave down or up, and the Range button steps through the three.
- **The settings:** drag the tempo (2 pixels a beat per minute) or the swing. Click the key or the length to step it on, or drag them.
- **The timing (`STUDIO`):** a press up to 60 ms after a 16th catches it, and a hold writes 50 ms ahead of the playhead, so the band plays it on time.
- **From the keys:** a drum plays at 0.7, and a note or chord at tone 0.5. A held bass note plays at 0.8, a chord at 0.5.
- **The sounds:**
  - Kits (kick, snare, hats, perc):
    - lo-fi: `kick`, `snare`, `hat`, `shaker`;
    - brushes: `softKick`, `brush`, `shaker`, `rim`;
    - funk: `tightKick`, `crack`, `hat`, `openHat`;
    - reggae: `deepKick`, `rimshot`, `hat`, `shaker`.
  - Basses: round `bass`, plucked `pluck`, deep `deep`.
  - Chords, and how many notes they stack:
    - electric piano `ep`, 9ths (the 9th left off where it would clash);
    - nylon `nylon`, 7ths;
    - clav `clav`, 7ths;
    - organ `organ`, triads;
    - piano `piano`, a triad with the root doubled on top.
- **A set's bars:** lo-fi 60, bossa nova 100, funk 76, reggae 56, ballad 52.
- **Loudness,** rendered offline in Chrome with every part on, in dB: lo-fi −24.8, reggae −25.7, funk −26.6, bossa nova −27.3, ballad −29.0. Every peak is under −4 dB. The Pump ducks by up to 70% and comes back over a quarter of a beat.
- **Colours:** the studio's are palette colours already there. The art stays at 49 colours, and the groovebox adds two frames: 552.

## File map

| File | What it does |
|---|---|
| `open-case/src/beats.js` (new) | Beats as data: the moods and chords of a key, the sounds, a beat's clock, what each layer plays on a 16th, a set's length, the five ready-made beats; later copying, blank beats, checking stored beats, and note letters |
| `open-case/src/groove.js` (goes) | Kept through Task 1 as the lo-fi's timing for the modules still counting in it; removed in Task 2 |
| `open-case/src/audio.js` (edit) | Plays any beat at its tempo; the new voices, tone, Pump and Vinyl; `setBeat` and `playWritten` for the studio |
| `listen.js`, `looper.js`, `set.js`, `scene.js`, `render.js`, `bots.js`, `shop.js`, `main.js`, `soundcheck.js` (edit) | Take the set's beat's clock; `?beat=`; the sound check's beats |
| `open-case/src/rhythms.js` (new) | The studio's 16 rhythms for each part |
| `open-case/src/studio.js` (new) | The studio's workings and your beats in storage |
| `open-case/src/studioview.js` (new) | The studio's screen: its layout, what a click lands on, the drawing |
| `open-case/src/studioinput.js` (new) | The studio's mouse and keys |
| `open-case/src/gear.js`, `shop.js`, `tuning.js`, `log.js` (edit) | The studio in the stock at 150 coins, its card, `STUDIO`, the log's beat |
| `art/open-case/sprites.lua`, `shop.lua`, `draw.lua` (edit) | The studio's colours in the sheet's data; the groovebox on the counter |
| `open-case/index.html` (edit) | The sound check's beat menu; the end card's Studio button |
| `open-case/test/*` | The tests for each of the above |
| `README.md`, the studio spec | Say what's built |

---

### Task 1: Beats as data

**Files:**
- Create: `open-case/src/beats.js`
- Modify: `open-case/src/audio.js`, `open-case/src/tuning.js`
- Replace: `open-case/src/groove.js` (it becomes the lo-fi's timing, for the modules still using it until Task 2)
- Test: create `open-case/test/beats.test.js`; delete `open-case/test/groove.test.js` (its tests move into beats.test.js)

**Interfaces:**
- Produces (`beats.js`), which later tasks rely on:
  - `midiToHz(n)`, `inKey(pitch)`, `isStrong(s)`, `isOff16th(s)`;
  - `MOODS` (`[{ id: 'C', name: 'C major' }, …]`, six), `moodName(id)`, `keyNote(mood, degree, c)`, `BASS_C` (36);
  - `chordName(notes)`, `padChordName(mood, degree)`, `chordOf(beat, hit) -> { notes, name }`, `bassNote(beat, hit)`;
  - the sounds: `KITS`, `BASSES`, `CHORD_SOUNDS`, and `SOUNDS` (`{ drums: KITS, bass: BASSES, chords: CHORD_SOUNDS }`, each entry with a `name`);
  - `clockOf(beat) -> { beat, bar, timeOf16th(s), sixteenthAt(t) }` and `setBars(beat)`;
  - `notesOf(beat, part, hit) -> { layer, notes }` and `bandAt(beat, layer, s) -> [{ voice, note, vel, len, tone?, drum? }]`, where layer is `'keys' | 'drums' | 'bass' | 'top' | 'perc'`;
  - the beats: `LOFI`, `BOSSA`, `FUNK`, `REGGAE`, `BALLAD`, `READY` (in that order), `readyBeat(id)` and `LOFI_CLOCK`.
- A beat is `{ id, name, ready, bpm, swing, mood, bars, sounds: { drums, bass, chords }, mix: { levels, muted, pump, pad, vinyl }, drums: [{ s, drum, vel }], bass: [{ s, degree, len, vel, tone }], chords: [{ s, degree, len, vel, tone, notes?, name? }] }`.
- `audio.startBand(at, beat = LOFI, level)` and `audio.tryBand(at, beat = LOFI)`.
- `GROOVE.setSeconds` (180), alongside the old `bpm`, `swing` and `setBars` until Task 2.
- `groove.js` now exports only the lo-fi's `BEAT`, `BAR`, `timeOf16th` and `sixteenthAt`, and `inKey`, `isStrong` and `isOff16th`, for the modules and tests still importing it.

- [ ] **Step 1: Write the failing tests**

Create `open-case/test/beats.test.js`:

````js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LOFI, LOFI_CLOCK, READY, MOODS, KITS, BASSES, CHORD_SOUNDS, clockOf, setBars, bandAt, inKey, isStrong, isOff16th, keyNote, chordName,
  padChordName, chordOf, readyBeat,
} from '../src/beats.js';

const near = (a, b) => Math.abs(a - b) < 1e-9;
const { beat: BEAT, bar: BAR, timeOf16th, sixteenthAt } = LOFI_CLOCK;
const LAYERS = ['keys', 'drums', 'bass', 'top', 'perc'];

// Today's loop as groove.js played it before beats were data: the oracle the lo-fi must match.
const OLD_CHORDS = [
  { keys: [50, 53, 57, 60, 64], root: 38 },
  { keys: [43, 53, 57, 59, 64], root: 43 },
  { keys: [48, 52, 55, 59, 62], root: 36 },
  { keys: [45, 55, 59, 60, 64], root: 45 },
];
const OLD_APPROACH = { 38: 36, 43: 41, 36: 35, 45: 43 };
function oldBandAt(layer, s) {
  const bar = Math.floor(s / 16), k = s - bar * 16, chord = OLD_CHORDS[bar % 4];
  switch (layer) {
    case 'keys':
      if (k === 0) return chord.keys.map((note) => ({ voice: 'ep', note, vel: 0.5, len: 9 }));
      if (k === 10) return chord.keys.slice(1).map((note) => ({ voice: 'ep', note, vel: 0.3, len: 6 }));
      return [];
    case 'drums': {
      const out = [];
      if (k === 0 || k === 10) out.push({ voice: 'kick', note: 0, vel: k === 0 ? 1 : 0.8, len: 1 });
      if (k === 7) out.push({ voice: 'kick', note: 0, vel: 0.5, len: 1 });
      if (k === 4 || k === 12) out.push({ voice: 'snare', note: 0, vel: 0.8, len: 1 });
      if (k === 15 && bar % 2 === 1) out.push({ voice: 'snare', note: 0, vel: 0.25, len: 1 });
      return out;
    }
    case 'bass': {
      const r = chord.root;
      if (k === 0) return [{ voice: 'bass', note: r, vel: 0.9, len: 5 }];
      if (k === 7) return [{ voice: 'bass', note: r, vel: 0.6, len: 2 }];
      if (k === 10) return [{ voice: 'bass', note: r + 7, vel: 0.7, len: 3 }];
      if (k === 14) return [{ voice: 'bass', note: OLD_APPROACH[OLD_CHORDS[(bar + 1) % 4].root], vel: 0.5, len: 2 }];
      return [];
    }
    case 'top': {
      const out = [];
      if (k % 2 === 0) out.push({ voice: 'hat', note: 0, vel: k % 4 === 0 ? 0.35 : 0.5, len: 1 });
      else if (k % 4 === 3) out.push({ voice: 'hat', note: 0, vel: 0.15, len: 1 });
      if (k === 0) for (const note of chord.keys.slice(1)) out.push({ voice: 'pad', note: note + 12, vel: 0.2, len: 16 });
      return out;
    }
    case 'perc': {
      const out = [];
      if (k % 2 === 0) out.push({ voice: 'shaker', note: 0, vel: k % 4 === 0 ? 0.5 : 0.3, len: 1 });
      if (k === 4 || k === 12) out.push({ voice: 'snap', note: 0, vel: 0.5, len: 1 });
      if (k === 0) out.push({ voice: 'tap', note: 0, vel: 0.6, len: 1 });
      return out;
    }
  }
  return [];
}
const plain = ({ voice, note, vel, len }) => ({ voice, note, vel, len });

test("the lo-fi is today's loop: every layer plays the same notes, voices, lengths and loudness on every 16th", () => {
  for (const layer of LAYERS) {
    for (let s = 0; s < 128; s++) assert.deepEqual(bandAt(LOFI, layer, s).map(plain), oldBandAt(layer, s), `${layer} at 16th ${s}`);
  }
  for (let s = 0; s < 64; s++) {
    for (const n of [...bandAt(LOFI, 'keys', s), ...bandAt(LOFI, 'bass', s)]) assert.equal(n.tone, 0.5, 'at its own tone');
  }
});

test('80 beats a minute with a 58% swing: a beat is 0.75 s, a bar 3 s, a set of 60 bars 3 minutes', () => {
  assert.ok(near(BEAT, 0.75));
  assert.ok(near(BAR, 3));
  assert.equal(setBars(LOFI), 60);
  assert.ok(near(timeOf16th(0), 0));
  assert.ok(near(timeOf16th(1), 0.29 * BEAT));
  assert.ok(near(timeOf16th(2), 0.5 * BEAT));
  assert.ok(near(timeOf16th(3), 0.79 * BEAT));
  assert.ok(near(timeOf16th(4), BEAT));
  assert.ok(near(timeOf16th(21), BAR + BEAT + 0.29 * BEAT));
});

test("a beat's clock follows its tempo and swing, straight or swung, slow or fast", () => {
  for (const [bpm, swing] of [[60, 0.5], [68, 0.5], [100, 0.54], [132, 0.5], [140, 0.75]]) {
    const c = clockOf({ bpm, swing });
    assert.ok(near(c.beat, 60 / bpm) && near(c.bar, 240 / bpm), `${bpm}`);
    assert.ok(near(c.timeOf16th(1), (swing / 2) * c.beat) && near(c.timeOf16th(3), (0.5 + swing / 2) * c.beat), `${bpm} swing`);
    for (let s = 0; s < 64; s++) {
      assert.equal(c.sixteenthAt(c.timeOf16th(s)), s, `${bpm} 16th ${s}`);
      assert.equal(c.sixteenthAt(c.timeOf16th(s) + 0.02), s);
      assert.equal(c.sixteenthAt(c.timeOf16th(s) - 0.02), s);
    }
  }
  assert.equal(sixteenthAt(-0.01), 0);
});

test('in key means the white keys; strong beats are quarter notes; off 16ths are odd', () => {
  assert.deepEqual([60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71].map(inKey), [true, false, true, false, true, true, false, true, false, true, false, true]);
  assert.deepEqual([0, 1, 2, 4, 6, 8].map(isStrong), [true, false, false, true, false, true]);
  assert.deepEqual([0, 1, 2, 3].map(isOff16th), [false, true, false, true]);
});

test('the six moods of the white keys: each counts its notes from its own home', () => {
  assert.deepEqual(MOODS.map((m) => m.name), ['C major', 'D Dorian', 'E Phrygian', 'F Lydian', 'G Mixolydian', 'A minor']);
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7].map((d) => keyNote('A', d, 36)), [45, 47, 48, 50, 52, 53, 55, 57], 'A minor from A2');
  assert.deepEqual([-1, -2, -4].map((d) => keyNote('A', d, 36)), [43, 41, 38], 'below the home note');
  assert.deepEqual([0, 1, 7].map((d) => keyNote('D', d, 36)), [38, 40, 50]);
  for (const m of MOODS) for (let d = -7; d < 15; d++) assert.ok(inKey(keyNote(m.id, d, 36)), `${m.id} ${d}`);
});

test("the pad's chords are the key's, named as a musician would", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7].map((d) => padChordName('A', d)), ['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G', 'Am']);
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7].map((d) => padChordName('C', d)), ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim', 'C']);
  assert.equal(chordName([57, 60, 64, 67]), 'Am7');
  assert.equal(chordName([60, 64, 67, 71, 74]), 'Cmaj9');
  assert.equal(chordName([55, 59, 62, 65, 69]), 'G9');
  assert.equal(chordName([59, 62, 65, 69]), 'Bm7b5');
});

test("a chord sound stacks the key's chords its own way; the 9th is left off where it would clash", () => {
  const beat = (chords) => ({ mood: 'A', sounds: { chords } });
  assert.deepEqual(chordOf(beat('organ'), { degree: 0 }), { notes: [57, 60, 64], name: 'Am' });
  assert.deepEqual(chordOf(beat('nylon'), { degree: 0 }), { notes: [57, 60, 64, 67], name: 'Am7' });
  assert.deepEqual(chordOf(beat('epiano'), { degree: 0 }), { notes: [57, 60, 64, 67, 71], name: 'Am9' });
  assert.equal(chordOf(beat('epiano'), { degree: 4 }).name, 'Em7', 'no 9th a half step above E');
  assert.deepEqual(chordOf(beat('piano'), { degree: 2 }).notes, [48, 52, 55, 60], 'the piano doubles the root on top');
  assert.equal(chordOf(beat('organ'), { degree: 7 }).notes[0], 69, 'the home chord again, an octave up');
  assert.equal(chordOf(beat('organ'), { degree: -1 }).notes[0], 55, 'a degree below home, in its usual place');
  assert.deepEqual(chordOf(beat('organ'), { degree: 0, notes: [1, 2], name: 'X' }), { notes: [1, 2], name: 'X' }, 'its own notes, as given');
});

test('every ready-made beat stays on the white keys, is 4 bars, and makes a set of about 3 minutes', () => {
  assert.deepEqual(READY.map((b) => b.id), ['lofi', 'bossa', 'funk', 'reggae', 'ballad']);
  assert.deepEqual(READY.map(setBars), [60, 100, 76, 56, 52]);
  for (const b of READY) {
    assert.equal(b.bars, 4, b.id);
    assert.equal(readyBeat(b.id), b);
    assert.ok(b.bpm >= 60 && b.bpm <= 140 && b.swing >= 0.5 && b.swing <= 0.75, b.id);
    assert.ok(KITS[b.sounds.drums] && BASSES[b.sounds.bass] && CHORD_SOUNDS[b.sounds.chords], b.id);
    const bars = setBars(b), seconds = bars * clockOf(b).bar;
    assert.ok(bars % 4 === 0 && Math.abs(seconds - 180) <= clockOf(b).bar * 2, `${b.id}: ${bars} bars, ${seconds} s`);
    for (let s = 0; s < 64; s++) {
      for (const layer of ['keys', 'bass', 'top']) for (const n of bandAt(b, layer, s)) if (n.note) assert.ok(inKey(n.note), `${b.id} ${layer} ${n.note}`);
    }
    for (const part of ['drums', 'bass', 'chords']) {
      assert.ok(b[part].length > 0 && b[part].every((h) => h.s >= 0 && h.s < 64), `${b.id} ${part}`);
    }
  }
  assert.equal(readyBeat('nope'), null);
});

test("each part's level and mute scale its notes; the Pad plays each bar's chord only when it's on", () => {
  const quiet = { ...LOFI, mix: { ...LOFI.mix, levels: { drums: 0.5, bass: 1, chords: 1 } } };
  assert.equal(bandAt(quiet, 'drums', 0)[0].vel, 0.5, 'the kick at half');
  assert.equal(bandAt(quiet, 'top', 2)[0].vel, 0.25, 'the hats are the drums too');
  const muted = { ...LOFI, mix: { ...LOFI.mix, muted: { drums: false, bass: true, chords: true } } };
  assert.deepEqual(bandAt(muted, 'bass', 0), []);
  assert.deepEqual(bandAt(muted, 'keys', 0), []);
  assert.deepEqual(bandAt(muted, 'top', 0).map((n) => n.voice), ['hat'], 'no Pad under muted chords');
  const noPad = { ...LOFI, mix: { ...LOFI.mix, pad: false } };
  assert.deepEqual(bandAt(noPad, 'top', 16).map((n) => n.voice), ['hat']);
  assert.deepEqual(bandAt(LOFI, 'top', 16).filter((n) => n.voice === 'pad').map((n) => n.note), [65, 69, 71, 76], "G13's upper notes, an octave up");
  assert.deepEqual(bandAt(LOFI, 'nothing', 0), []);
});

test('a shorter beat comes round sooner; the stand-in percussion keeps to the bar', () => {
  const one = { ...LOFI, bars: 1, drums: [{ s: 3, drum: 'kick', vel: 1 }], bass: [], chords: [] };
  for (const s of [3, 19, 35, 51]) assert.equal(bandAt(one, 'drums', s).length, 1, `16th ${s}`);
  assert.deepEqual(bandAt(one, 'drums', 4), []);
  assert.deepEqual(bandAt(one, 'top', 0), [], 'no chord, no Pad');
  for (let s = 0; s < 32; s++) {
    const voices = bandAt(one, 'perc', s).map((h) => h.voice).sort(), k = s % 16;
    if (k % 2 === 1) assert.deepEqual(voices, []);
    else if (k === 0) assert.deepEqual(voices, ['shaker', 'tap']);
    else if (k === 4 || k === 12) assert.deepEqual(voices, ['shaker', 'snap']);
    else assert.deepEqual(voices, ['shaker']);
  }
});
````

and remove the old groove tests: `git rm open-case/test/groove.test.js`.

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL. `test/beats.test.js` can't load: `Cannot find module '…/open-case/src/beats.js'` (1 failing file; the other 223 tests pass).

- [ ] **Step 3: The beats**

Create `open-case/src/beats.js`:

````js
// Beats: what the band plays, as data. A beat has a tempo, a swing, a key, a length (1, 2 or 4 bars),
// a sound for each part and a mix, and three parts: drums, bass and chords. The band plays whichever
// beat a set uses (set.js, audio.js), and the studio (studio.js) records into the same data. Pure, so
// it's tested in Node.
//
// Time is counted in 16ths from the band's first note: 16th s is in bar floor(s / 16), and it's a
// strong beat when s % 4 === 0. A beat's parts say where their notes fall within its own length, and
// the band plays it round and round.
//
//   drums:  [{ s, drum: 'kick' | 'snare' | 'hats' | 'perc', vel }]
//   bass:   [{ s, degree, len, vel, tone }]
//   chords: [{ s, degree, len, vel, tone, notes?, name? }]
//
// s is the 16th within the beat, len is in 16ths, vel (how hard) and tone (darker 0 to brighter 1, 0.5
// being the sound itself) run from 0 to 1. A note or chord is kept by its place in the key (degree 0
// is the home note, 7 the home note an octave up, negative below it), so changing the key carries it
// along. A ready-made beat may spell out a chord's own notes and name, as the lo-fi does.
import { GROOVE } from './tuning.js';

export const midiToHz = (n) => 440 * Math.pow(2, (n - 69) / 12);

// Every key is on the white keys: the same seven notes, with a different home note for each mood.
// B's mode is left out: its home chord is diminished and never sounds settled.
const WHITE = [0, 2, 4, 5, 7, 9, 11];
export const MOODS = [
  { id: 'C', name: 'C major' },
  { id: 'D', name: 'D Dorian' },
  { id: 'E', name: 'E Phrygian' },
  { id: 'F', name: 'F Lydian' },
  { id: 'G', name: 'G Mixolydian' },
  { id: 'A', name: 'A minor' },
];
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
export const moodName = (mood) => MOODS.find((m) => m.id === mood)?.name ?? mood;

export const inKey = (pitch) => WHITE.includes(((pitch % 12) + 12) % 12);
export const isStrong = (s) => s % 4 === 0;
export const isOff16th = (s) => s % 2 === 1;
const mod = (a, n) => ((a % n) + n) % n;

// The white key `degree` steps from the mood's home note, the home note being in the octave that
// starts at MIDI note c (36 is C2).
export function keyNote(mood, degree, c) {
  const i = LETTERS.indexOf(mood) + degree;
  return c + 12 * Math.floor(i / 7) + WHITE[mod(i, 7)];
}

export const BASS_C = 36; // the bass's home octave starts at C2
const CHORD_LOW = 48; // a chord's root sits from C3 up to B3

// The chord of the key on `degree`, `size` notes stacked in thirds from its root: 3 (a triad), 4 (a
// 7th) or 5 (with a 9th, left off where it would clash a half step above the root). Degree 7 is the
// home chord again, an octave up; a degree below the home note is its chord in the usual place.
function stack(mood, degree, size) {
  const rootPc = mod(keyNote(mood, degree, 0), 12);
  const root = CHORD_LOW + mod(rootPc - CHORD_LOW, 12) + 12 * Math.max(0, Math.floor(degree / 7));
  const notes = [root];
  for (let k = 1; k < size; k++) {
    const n = root + keyNote(mood, degree + 2 * k, 0) - keyNote(mood, degree, 0);
    if (k === 4 && n - root !== 14) break; // a 9th a half step above the root clashes: leave it off
    notes.push(n);
  }
  return notes;
}

// A chord's name from its notes (root first): C, Cm, Cdim, Cmaj7, C7, Cm7, Cm7b5, Cmaj9, C9, Cm9.
export function chordName(notes) {
  const root = LETTERS[WHITE.indexOf(mod(notes[0], 12))];
  const third = notes[1] - notes[0], fifth = notes[2] - notes[0], seventh = notes[3] - notes[0];
  const minor = third === 3, dim = fifth === 6;
  if (notes.length < 4) return root + (dim ? 'dim' : minor ? 'm' : '');
  if (dim) return `${root}m7b5`;
  const ext = notes.length >= 5 ? '9' : '7';
  if (seventh === 11) return `${root}maj${ext}`;
  return `${root}${minor ? 'm' : ''}${ext}`;
}

// The name on the studio's pad for the chord on `degree`: the triad's (Am, Bdim, C).
export const padChordName = (mood, degree) => chordName(stack(mood, degree, 3));

// The sounds each part can have. A drum kit is a voice for each of its four drums; a bass is a
// voice; a chord sound is a voice and how it stacks its chords.
export const KITS = {
  lofi: { name: 'lo-fi kit', kick: 'kick', snare: 'snare', hats: 'hat', perc: 'shaker' },
  brushes: { name: 'brushes', kick: 'softKick', snare: 'brush', hats: 'shaker', perc: 'rim' },
  funk: { name: 'funk kit', kick: 'tightKick', snare: 'crack', hats: 'hat', perc: 'openHat' },
  reggae: { name: 'reggae kit', kick: 'deepKick', snare: 'rimshot', hats: 'hat', perc: 'shaker' },
};
export const BASSES = {
  round: { name: 'round bass', voice: 'bass' },
  plucked: { name: 'plucked bass', voice: 'pluck' },
  deep: { name: 'deep bass', voice: 'deep' },
};
export const CHORD_SOUNDS = {
  epiano: { name: 'electric piano', voice: 'ep', size: 5 },
  nylon: { name: 'nylon guitar', voice: 'nylon', size: 4 },
  clav: { name: 'clav', voice: 'clav', size: 4 },
  organ: { name: 'organ', voice: 'organ', size: 3 },
  piano: { name: 'piano', voice: 'piano', size: 3 },
};
export const SOUNDS = { drums: KITS, bass: BASSES, chords: CHORD_SOUNDS };

// A chord hit's notes and name: its own, or its chord of the key as the beat's chord sound stacks it
// (the piano doubles the root an octave up).
export function chordOf(beat, hit) {
  if (hit.notes) return { notes: hit.notes, name: hit.name ?? chordName(hit.notes) };
  const sound = CHORD_SOUNDS[beat.sounds.chords];
  const notes = stack(beat.mood, hit.degree, sound.size);
  return { notes: beat.sounds.chords === 'piano' ? [...notes, notes[0] + 12] : notes, name: chordName(notes) };
}

export const bassNote = (beat, hit) => keyNote(beat.mood, hit.degree, BASS_C);


// The timing of a beat: how long a beat and a bar last, when 16th s sounds (in seconds from the
// band's first 16th) and which 16th is nearest a time. The swing pushes the second 16th of each pair
// late: it lands at `swing` of the pair (0.5 is straight).
export function clockOf(beat) {
  const beatLen = 60 / beat.bpm;
  const grid = [0, beat.swing / 2, 0.5, 0.5 + beat.swing / 2, 1];
  return {
    beat: beatLen,
    bar: beatLen * 4,
    timeOf16th(s) {
      const b = Math.floor(s / 4);
      return (b + grid[s - b * 4]) * beatLen;
    },
    sixteenthAt(t) {
      const beats = Math.max(0, t) / beatLen;
      const b = Math.floor(beats), f = beats - b;
      let best = 0;
      for (let k = 1; k < grid.length; k++) if (Math.abs(f - grid[k]) < Math.abs(f - grid[best])) best = k;
      return b * 4 + best;
    },
  };
}

// How many bars a set of this beat lasts: the multiple of 4 closest to GROOVE.setSeconds.
export const setBars = (beat) => Math.max(4, Math.round(GROOVE.setSeconds / (clockOf(beat).bar * 4)) * 4);

const level = (beat, part) => (beat.mix.muted[part] ? 0 : beat.mix.levels[part]);

// What one hit of a part plays: the layer it plays in and its notes, [{ voice, note, vel, len, tone?,
// drum? }] (len in 16ths; drums use note 0, and say which drum they are). The hats play in the top
// layer, the rest of the drums in the drums layer; the chords are the keys layer. A muted part, or one
// at no level, plays nothing.
export function notesOf(beat, part, hit) {
  const lvl = level(beat, part), vel = hit.vel * lvl;
  if (part === 'drums') {
    const layer = hit.drum === 'hats' ? 'top' : 'drums';
    return { layer, notes: lvl ? [{ voice: KITS[beat.sounds.drums][hit.drum], note: 0, vel, len: 1, drum: hit.drum }] : [] };
  }
  if (part === 'bass') {
    return { layer: 'bass', notes: lvl ? [{ voice: BASSES[beat.sounds.bass].voice, note: bassNote(beat, hit), vel, len: hit.len, tone: hit.tone }] : [] };
  }
  const voice = CHORD_SOUNDS[beat.sounds.chords].voice;
  return { layer: 'keys', notes: lvl ? chordOf(beat, hit).notes.map((note) => ({ voice, note, vel, len: hit.len, tone: hit.tone })) : [] };
}

// The notes a layer starts on 16th s, in the form notesOf gives. The layers are the crowd's
// (tuning.js LAYERS): 'keys' the chords, 'drums' the kick, snare and percussion, 'bass', and 'top' the
// hats and the Pad; and 'perc', the stand-in percussion that audio.js plays whenever the drums are
// out.
export function bandAt(beat, layer, s) {
  const k = mod(s, beat.bars * 16);
  const part = { keys: 'chords', drums: 'drums', bass: 'bass', top: 'drums' }[layer];
  const played = (p) => beat[p].filter((h) => h.s === k).map((h) => notesOf(beat, p, h)).filter((w) => w.layer === layer).flatMap((w) => w.notes);
  switch (layer) {
    case 'keys':
    case 'drums':
    case 'bass':
      return played(part);
    case 'top': {
      const out = played('drums'), lvl = level(beat, 'chords');
      // The Pad: at each bar line, the chord sounding then, its upper notes an octave up, for a bar.
      if (beat.mix.pad && lvl && k % 16 === 0) {
        const hit = beat.chords.filter((h) => h.s <= k).at(-1) ?? beat.chords.at(-1);
        if (hit) for (const note of chordOf(beat, hit).notes.slice(1)) out.push({ voice: 'pad', note: note + 12, vel: 0.2 * lvl, len: 16 });
      }
      return out;
    }
    // Stand-in percussion (not a crowd layer: audio.js plays it whenever the drums slot is off), a
    // soft shaker-and-snap beat rather than a metronome: a shaker on every swung 8th, louder on the
    // beat; finger snaps on 2 and 4; a low tap on the downbeat.
    case 'perc': {
      const out = [], p = mod(s, 16);
      if (p % 2 === 0) out.push({ voice: 'shaker', note: 0, vel: p % 4 === 0 ? 0.5 : 0.3, len: 1 });
      if (p === 4 || p === 12) out.push({ voice: 'snap', note: 0, vel: 0.5, len: 1 });
      if (p === 0) out.push({ voice: 'tap', note: 0, vel: 0.6, len: 1 });
      return out;
    }
    default:
      return [];
  }
}

// Builds a beat's parts bar by bar: fn(bar) returns that bar's { drums, bass, chords }, each hit's s
// counted within the bar.
function bars(count, fn) {
  const out = { drums: [], bass: [], chords: [] };
  for (let b = 0; b < count; b++) {
    const part = fn(b);
    for (const key of Object.keys(out)) for (const h of part[key] ?? []) out[key].push({ ...h, s: b * 16 + h.s });
  }
  return out;
}
const hit = (drum, s, vel) => ({ drum, s, vel });
const note = (s, degree, len, vel) => ({ s, degree, len, vel, tone: 0.5 });
const mix = (over = {}) => ({
  levels: { drums: 1, bass: 1, chords: 1 }, muted: { drums: false, bass: false, chords: false }, pump: 0, pad: false, vinyl: false, ...over,
});
// The hats on every 8th (louder off the beat), and a ghost on each beat's last 16th, as the lo-fi has.
const lofiHats = () => [0, 2, 4, 6, 8, 10, 12, 14].map((s) => hit('hats', s, s % 4 === 0 ? 0.35 : 0.5))
  .concat([3, 7, 11, 15].map((s) => hit('hats', s, 0.15)));

// The lo-fi: today's loop, note for note. Chill lo-fi hip hop at 80 bpm with a lazy 16th swing, over
// Dm9, G13, Cmaj9 and Am9 (ii-V-I-vi in C major), each voiced as it always was.
const LOFI_CHORDS = [
  { degree: 1, notes: [50, 53, 57, 60, 64], name: 'Dm9' },
  { degree: 4, notes: [43, 53, 57, 59, 64], name: 'G13' },
  { degree: 0, notes: [48, 52, 55, 59, 62], name: 'Cmaj9' },
  { degree: 5, notes: [45, 55, 59, 60, 64], name: 'Am9' },
];
const LOFI_APPROACH = [3, -1, 4, 0]; // the bass's walk into the next bar's root: F2, B1, G2, C2
export const LOFI = {
  id: 'lofi', name: 'Lo-fi', ready: true, bpm: 80, swing: 0.58, mood: 'C', bars: 4,
  sounds: { drums: 'lofi', bass: 'round', chords: 'epiano' },
  mix: mix({ pad: true, vinyl: true }),
  ...bars(4, (b) => {
    const c = LOFI_CHORDS[b], r = c.degree;
    return {
      chords: [
        { s: 0, degree: r, len: 9, vel: 0.5, tone: 0.5, notes: c.notes, name: c.name },
        { s: 10, degree: r, len: 6, vel: 0.3, tone: 0.5, notes: c.notes.slice(1), name: c.name },
      ],
      drums: [
        hit('kick', 0, 1), hit('snare', 4, 0.8), hit('kick', 7, 0.5), hit('kick', 10, 0.8), hit('snare', 12, 0.8),
        ...(b % 2 === 1 ? [hit('snare', 15, 0.25)] : []), ...lofiHats(),
      ],
      bass: [note(0, r, 5, 0.9), note(7, r, 2, 0.6), note(10, r + 4, 3, 0.7), note(14, LOFI_APPROACH[b], 2, 0.5)],
    };
  }),
};

// Bossa nova at 132, straight: nylon-guitar comping over Am7, Dm7, G7 and Cmaj7, a bass rocking
// between root and fifth on 1 and 3, a rim-click clave and brushes.
export const BOSSA = {
  id: 'bossa', name: 'Bossa nova', ready: true, bpm: 132, swing: 0.5, mood: 'A', bars: 4,
  sounds: { drums: 'brushes', bass: 'round', chords: 'nylon' },
  mix: mix(),
  ...bars(4, (b) => {
    const r = [0, -4, -1, -5][b]; // Am7, Dm7, G7, Cmaj7, with their roots low for the bass
    return {
      chords: [[0, 0.5], [6, 0.4], [10, 0.45], [12, 0.4]].map(([s, vel]) => ({ s, degree: r, len: 2, vel, tone: 0.5 })),
      bass: [note(0, r, 5, 0.85), note(6, r + 4, 2, 0.6), note(8, r + 4, 5, 0.75), note(14, r, 2, 0.55)],
      drums: [
        hit('kick', 0, 0.5), hit('kick', 6, 0.3), hit('kick', 8, 0.45), hit('kick', 14, 0.3),
        ...[0, 3, 6, 10, 12].map((s) => hit('perc', s, 0.6)),
        ...[0, 2, 4, 6, 8, 10, 12, 14].map((s) => hit('hats', s, s % 4 === 0 ? 0.4 : 0.3)),
        hit('snare', 4, 0.3), hit('snare', 12, 0.3),
      ],
    };
  }),
};

// Funk at 100, tight: clav stabs on a D Dorian vamp (Dm9 to G9, each voiced close above the root it
// leaves out), a busy plucked bass, and a tight kit with ghost notes and an open hat.
const FUNK_CHORDS = [
  { degree: 0, notes: [53, 57, 60, 64], name: 'Dm9' },
  { degree: 3, notes: [53, 57, 59, 62], name: 'G9' },
];
const FUNK_BASS = [
  [[0, 0, 2, 0.95], [3, 0, 1, 0.7], [6, 7, 1, 0.8], [7, 6, 1, 0.6], [10, 4, 2, 0.8], [12, 0, 1, 0.75], [14, 2, 1, 0.65], [15, 3, 1, 0.6]],
  [[0, 3, 2, 0.95], [3, 3, 1, 0.7], [6, 10, 1, 0.8], [7, 9, 1, 0.6], [10, 7, 2, 0.8], [12, 3, 1, 0.75], [14, 5, 1, 0.65], [15, 6, 1, 0.6]],
];
export const FUNK = {
  id: 'funk', name: 'Funk', ready: true, bpm: 100, swing: 0.54, mood: 'D', bars: 4,
  sounds: { drums: 'funk', bass: 'plucked', chords: 'clav' },
  mix: mix(),
  ...bars(4, (b) => {
    const c = FUNK_CHORDS[b % 2];
    return {
      chords: [[0, 0.6], [3, 0.45], [6, 0.5], [10, 0.6], [11, 0.4], [14, 0.5]].map(([s, vel]) => ({ s, degree: c.degree, len: 1, vel, tone: 0.5, notes: c.notes, name: c.name })),
      bass: FUNK_BASS[b % 2].map(([s, degree, len, vel]) => note(s, degree, len, vel)),
      drums: [
        hit('kick', 0, 0.9), hit('kick', 7, 0.6), hit('kick', 10, 0.8),
        hit('snare', 4, 0.85), hit('snare', 12, 0.85), hit('snare', 9, 0.2), hit('snare', 15, 0.2),
        ...Array.from({ length: 16 }, (_, s) => s).filter((s) => s !== 14).map((s) => hit('hats', s, s % 2 === 0 ? 0.35 : 0.2)),
        hit('perc', 14, 0.5),
      ],
    };
  }),
};

// Reggae at 76, a little swing: organ skanks on 2 and 4 over Am, G, F and G, a deep round bass, and
// the one-drop: the kick and the rim together on beat 3.
export const REGGAE = {
  id: 'reggae', name: 'Reggae', ready: true, bpm: 76, swing: 0.55, mood: 'A', bars: 4,
  sounds: { drums: 'reggae', bass: 'deep', chords: 'organ' },
  mix: mix(),
  ...bars(4, (b) => {
    const r = [0, -1, -2, -1][b]; // Am, G, F, G
    return {
      chords: [4, 12].map((s) => ({ s, degree: r, len: 2, vel: 0.55, tone: 0.5 })),
      bass: [note(2, r, 3, 0.9), note(6, r + 2, 2, 0.7), note(8, r + 4, 4, 0.8), note(14, r, 2, 0.6)],
      drums: [
        hit('kick', 8, 0.9), hit('snare', 8, 0.7),
        ...[0, 2, 4, 6, 8, 10, 12, 14].map((s) => hit('hats', s, s % 4 === 0 ? 0.25 : 0.35)),
        ...[2, 6, 10, 14].map((s) => hit('perc', s, 0.25)),
      ],
    };
  }),
};

// A slow ballad at 68, straight: piano chords over C, G, Am and F with the Pad under them, a round
// bass walking between roots, and brushes.
export const BALLAD = {
  id: 'ballad', name: 'Slow ballad', ready: true, bpm: 68, swing: 0.5, mood: 'C', bars: 4,
  sounds: { drums: 'brushes', bass: 'round', chords: 'piano' },
  mix: mix({ pad: true }),
  ...bars(4, (b) => {
    const r = [0, 4, 5, 3][b], walk = [2, 6, 4, 1][b]; // C, G, Am, F; each bar's last note leads to the next root
    return {
      chords: [{ s: 0, degree: r, len: 8, vel: 0.5, tone: 0.5 }, { s: 8, degree: r, len: 8, vel: 0.35, tone: 0.5 }],
      bass: [note(0, r, 7, 0.8), note(8, r, 6, 0.6), note(14, walk, 2, 0.5)],
      drums: [
        hit('kick', 0, 0.5), hit('kick', 8, 0.35), hit('snare', 4, 0.45), hit('snare', 12, 0.45),
        ...[0, 2, 4, 6, 8, 10, 12, 14].map((s) => hit('hats', s, 0.2)),
      ],
    };
  }),
};

// The studio's ready-made beats, in the order its list shows them.
export const READY = [LOFI, BOSSA, FUNK, REGGAE, BALLAD];
export const readyBeat = (id) => READY.find((b) => b.id === id) ?? null;
export const LOFI_CLOCK = clockOf(LOFI);
````

- [ ] **Step 4: The set's length, the lo-fi's timing, and the band playing a beat**

Apply to `open-case/src/tuning.js`:

````diff
diff --git a/open-case/src/tuning.js b/open-case/src/tuning.js
index 20f1c63..7eecb93 100644
--- a/open-case/src/tuning.js
+++ b/open-case/src/tuning.js
@@ -9,6 +9,7 @@ export const GROOVE = {
   bpm: 80,
   swing: 0.58, // the second 16th of each pair lands at this share of the pair
   setBars: 60, // 15 times round the 4-bar loop: 3 minutes
+  setSeconds: 180, // a set lasts about this long, whatever its beat's tempo (beats.js setBars)
   ahead: 0.2, // seconds of band scheduled ahead of the audio clock
   layerLead: 0.25, // seconds before a bar line that its layers are decided (more than `ahead`)
   applause: 1, // seconds of applause after the band's fade, before the end card
````

Replace `open-case/src/groove.js` with:

````js
// The lo-fi's timing, for the parts of the game that still count in its 16ths, beats and bars (every
// set plays the lo-fi for now), and whether a note is in the key and on the beat. The beats themselves,
// the lo-fi among them, are in beats.js.
import { LOFI_CLOCK } from './beats.js';

export { inKey, isStrong, isOff16th } from './beats.js';
export const { beat: BEAT, bar: BAR, timeOf16th, sixteenthAt } = LOFI_CLOCK;
````

Apply to `open-case/src/audio.js`:

````diff
diff --git a/open-case/src/audio.js b/open-case/src/audio.js
index f7dd071..c5109f8 100644
--- a/open-case/src/audio.js
+++ b/open-case/src/audio.js
@@ -4,9 +4,9 @@
 //     sounds at once. The electric piano and the synth are made from oscillators as each note starts.
 //   - Your pedals, between your instrument and the speakers, chained in the usual order: overdrive,
 //     chorus, tremolo, delay, reverb. A stomp fades a pedal in or out over a few milliseconds.
-//   - The band: electric piano, drums, bass, hats and pad from groove.js's patterns, scheduled a
-//     little ahead of the audio clock, as Last Light's score is. Each layer plays into its own bus
-//     (its slot): switching a layer is a fade on that bus at a bar line.
+//   - The band: the beat it's given (beats.js), its chords, drums, bass, hats and Pad, scheduled a
+//     little ahead of the audio clock, as Last Light's score is, at the beat's tempo. Each layer plays
+//     into its own bus (its slot): switching a layer is a fade on that bus at a bar line.
 //   - Your loop (looper.js): its notes are scheduled a moment ahead with the band's, each a voice of
 //     its own through your instrument and pedals, and they fade and stop with the band.
 //   - Its count-in (countIn): a soft stick click on each beat after R, up to the bar line, so you can
@@ -15,7 +15,7 @@
 //   - A safety before the speakers, so a loop stacked on your playing can't clip.
 // Browsers only allow sound after a key press or click, so start() is called from inside one
 // (main.js). M mutes; the volume and mute are remembered.
-import { bandAt, timeOf16th, midiToHz, BAR, BEAT } from './groove.js';
+import { bandAt, midiToHz, clockOf, LOFI } from './beats.js';
 import { LAYERS, PLAY, GROOVE } from './tuning.js';
 import { PEDALS } from './gear.js';
 
@@ -96,7 +96,7 @@ const CHORUS_RATE = 0.8; // ...this many times a second
 const CHORUS_MIX = 0.6; // the copy's level; your own sound drops to CHORUS_DRY under it
 const CHORUS_DRY = 0.8;
 const TREMOLO_DEPTH = 0.35; // the volume swings this share either way, on the 8th notes
-const DELAY_TIME = BEAT * 0.75; // a dotted 8th
+const DELAY_BEATS = 0.75; // the echo's time, in beats of the band's beat: a dotted 8th
 const DELAY_FEEDBACK = 0.38; // each echo is this loud next to the one before...
 const DELAY_MIX = 0.45; // ...and the first this loud next to your note
 const DELAY_TONE = 2800; // Hz: each echo a little darker
@@ -182,7 +182,8 @@ export function createAudio(storage) {
   const inputs = {}; // a gain per instrument, into its tone filters and on into the pedals
   const loopIns = {}; // a gain per instrument for your loop's notes, into its input: the loop's fade
   const pedals = {}; // id -> { input, output, set(on, at) }
-  let tremoloDepth = null, tremoloWave = null;
+  let tremoloDepth = null, tremoloWave = null, delayLine = null;
+  let beat = LOFI, clock = clockOf(LOFI); // what the band plays, and its timing
   let instrument = 'acoustic';
   const pedalOn = Object.fromEntries(PEDALS.map((id) => [id, false]));
   const plucks = new Map(); // `${pitch}:${strength}` -> AudioBuffer, for the instrument you play
@@ -344,26 +345,27 @@ export function createAudio(storage) {
     return { input: amp, output: amp, set: (on, at) => fade(tremoloDepth.gain, on ? TREMOLO_DEPTH : 0, at) };
   }
 
-  // A new wave for the tremolo, a cosine at the 8th notes' rate starting at `at` (the band's first
-  // 16th, or any moment when there's no band), so its peaks land on the 8ths. The old wave plays
-  // until the new one takes over.
+  // A new wave for the tremolo, a cosine at the 8th notes' rate (of the band's beat) starting at `at`
+  // (the band's first 16th, or any moment when there's no band), so its peaks land on the 8ths. The
+  // old wave plays until the new one takes over.
   function newTremoloWave(at) {
     const wave = ctx.createOscillator();
     wave.setPeriodicWave(ctx.createPeriodicWave(new Float32Array([0, 1]), new Float32Array([0, 0])));
-    wave.frequency.value = 2 / BEAT;
+    wave.frequency.value = 2 / clock.beat;
     wave.connect(tremoloDepth);
     wave.start(at);
     tremoloWave?.stop(at);
     tremoloWave = wave;
   }
 
-  // Delay: echoes on the dotted 8th, each a little quieter and darker. Switched off, it stops taking
+  // Delay: echoes on the dotted 8th of the band's beat, each a little quieter and darker. Switched off, it stops taking
   // in new notes, and the echoes already going fade away on their own.
   function delay() {
     const input = ctx.createGain(), output = ctx.createGain(), send = ctx.createGain(), wet = ctx.createGain();
     const line = ctx.createDelay(2), dark = ctx.createBiquadFilter(), again = ctx.createGain();
     send.gain.value = 0;
-    line.delayTime.value = DELAY_TIME;
+    line.delayTime.value = clock.beat * DELAY_BEATS;
+    delayLine = line;
     dark.type = 'lowpass';
     dark.frequency.value = DELAY_TONE;
     again.gain.value = DELAY_FEEDBACK;
@@ -635,9 +637,13 @@ export function createAudio(storage) {
     }
   }
 
-  // The band starts with your first note: 16th 0 sounds at `at`. Your loop starts empty with it.
-  function startBand(at, level = BAND_LEVEL) {
+  // The band starts playing `b` (a beat) with your first note: 16th 0 sounds at `at`. Your loop starts
+  // empty with it. The tremolo and the delay take the beat's tempo.
+  function startBand(at, b = LOFI, level = BAND_LEVEL) {
     if (!ctx) return;
+    beat = b;
+    clock = clockOf(b);
+    delayLine.delayTime.setValueAtTime(clock.beat * DELAY_BEATS, at);
     loopAt = at;
     next16 = 0;
     stopAt = Infinity;
@@ -649,11 +655,11 @@ export function createAudio(storage) {
     }
   }
 
-  // The band in the shop, while you try the loop pedal: its electric piano alone (the keys layer, with
+  // The band in the shop, while you try the loop pedal: the chords of `b` alone (the keys layer, with
   // no stand-in percussion), softly, from `at`.
-  function tryBand(at) {
+  function tryBand(at, b = LOFI) {
     if (!ctx) return;
-    startBand(at, TRY_LEVEL);
+    startBand(at, b, TRY_LEVEL);
     for (const { id } of LAYERS) bus[id].gain.setTargetAtTime(id === 'keys' ? 1 : 0, at, 0.02);
     bus.perc.gain.setTargetAtTime(0, at, 0.02);
     wobble.gain.setTargetAtTime(0, at, 0.5);
@@ -664,9 +670,9 @@ export function createAudio(storage) {
     if (!ctx) return;
     for (const g of [band, ...Object.values(loopIns)]) {
       g.gain.setValueAtTime(g === band ? BAND_LEVEL : LOOP_LEVEL, at);
-      g.gain.linearRampToValueAtTime(0, at + BAR);
+      g.gain.linearRampToValueAtTime(0, at + clock.bar);
     }
-    stopAt = at + BAR;
+    stopAt = at + clock.bar;
   }
 
   // Stops the band and your loop at once: nothing more is scheduled, and what's still sounding fades
@@ -745,13 +751,13 @@ export function createAudio(storage) {
     if (!ctx || ctx.state !== 'running' || loopAt < 0) return [];
     const t = ctx.currentTime;
     // After a stall, skip what's already late rather than playing it all at once.
-    while (loopAt + timeOf16th(next16) < t - 0.1) next16++;
-    while (loopAt + timeOf16th(next16) < t + GROOVE.ahead && loopAt + timeOf16th(next16) < stopAt) {
-      const at = loopAt + timeOf16th(next16);
-      for (const { id } of LAYERS) {
-        for (const n of bandAt(id, next16)) playBand(id, n, at, loopAt + timeOf16th(next16 + n.len) - at);
+    const at16 = (s) => loopAt + clock.timeOf16th(s);
+    while (at16(next16) < t - 0.1) next16++;
+    while (at16(next16) < t + GROOVE.ahead && at16(next16) < stopAt) {
+      const at = at16(next16);
+      for (const { id } of [...LAYERS, { id: 'perc' }]) {
+        for (const n of bandAt(beat, id, next16)) playBand(id, n, at, at16(next16 + n.len) - at);
       }
-      for (const n of bandAt('perc', next16)) playBand('perc', n, at, loopAt + timeOf16th(next16 + n.len) - at);
       next16++;
     }
     if (t >= crackleAt && t < stopAt) {
````

- [ ] **Step 5: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 233 tests.

- [ ] **Step 6: Commit**

```bash
git add open-case/src/beats.js open-case/src/groove.js open-case/src/audio.js open-case/src/tuning.js open-case/test/beats.test.js
git commit -m "Open Case: beats as data: the band plays a beat, the lo-fi note for note, and four more are written down

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

(The `git rm` in Step 1 has already staged the old test's removal.)

---

### Task 2: Every part of the game keeps the set's beat's time

**Files:**
- Modify: `open-case/src/listen.js`, `looper.js`, `set.js`, `scene.js`, `render.js`, `bots.js`, `shop.js`, `main.js`, `tuning.js`
- Delete: `open-case/src/groove.js`
- Test: `open-case/test/audio.test.js`, `bots.test.js`, `helpers.js`, `listen.test.js`, `looper.test.js`, `render.test.js`, `scene.test.js`, `set.test.js`

**Interfaces:**
- Consumes: `clockOf`, `setBars`, `LOFI`, `LOFI_CLOCK`, `readyBeat` (Task 1).
- Produces:
  - `createSet(seed, beat = LOFI)`, giving `set.beat`, `set.clock` and `set.bars`; `endTime(set)`; `runSet(seed, notes, beat = LOFI)`;
  - `createListener(clock = LOFI_CLOCK)`;
  - `createLoop(clock = LOFI_CLOCK)`, with `loop.clock`, and `loopLength(loop)` in place of the old `LOOP_LENGTH`;
  - `createScene(seed, { bar, parkBar })`;
  - `personFrame(p, t, time, beat = LOFI_CLOCK.beat)` and `treeFrame(t, time, playing, still, bar = LOFI_CLOCK.bar)`;
  - every bot takes `(seed, beat = LOFI)`;
  - `createShop(clock = LOFI_CLOCK)`;
  - `PARK.bars` (60): the park's evening counts the set's time as its share of these;
  - `GROOVE` loses `bpm`, `swing` and `setBars`.
- `main.js` plays `let beat = LOFI` for now. Task 3 lets `?beat=` choose it, and Task 7 the studio.

- [ ] **Step 1: Write the failing tests**

The tests take their timing from the lo-fi's clock (`LOFI_CLOCK`) instead of `groove.js`, and new ones play sets, loops, bots, the park and the screen at other beats. Apply each patch:

````diff
diff --git a/open-case/test/helpers.js b/open-case/test/helpers.js
index 57c9d4d..2990f05 100644
--- a/open-case/test/helpers.js
+++ b/open-case/test/helpers.js
@@ -1,8 +1,9 @@
 // Shared test helpers.
-import { timeOf16th } from '../src/groove.js';
+import { LOFI_CLOCK } from '../src/beats.js';
 import { noteOn, noteOff, tick } from '../src/listen.js';
 import { stepCrowd } from '../src/crowd.js';
 import { DT, CROWD } from '../src/tuning.js';
+const { timeOf16th } = LOFI_CLOCK;
 
 // Plays notes into a listener, in time order: each is [16th, pitch, length in 16ths = 1, strength = 3].
 // A key goes up a hair before its length is up, so a rest of exactly a beat ends a phrase.
````

````diff
diff --git a/open-case/test/audio.test.js b/open-case/test/audio.test.js
index 006b2d3..12ad439 100644
--- a/open-case/test/audio.test.js
+++ b/open-case/test/audio.test.js
@@ -2,10 +2,12 @@ import { test } from 'node:test';
 import assert from 'node:assert/strict';
 import { createAudio, pluckSamples, softClip, safetyCurve, VOICING } from '../src/audio.js';
 import { fakeAudioContext } from './fake-audio.js';
-import { BAR, BEAT, timeOf16th } from '../src/groove.js';
+import { LOFI_CLOCK } from '../src/beats.js';
 import { PLAY, GROOVE, LAYERS } from '../src/tuning.js';
 import { PEDALS, INSTRUMENTS } from '../src/gear.js';
-import { createLoop, record, note, release, step, due, LOOP_LENGTH } from '../src/looper.js';
+import { createLoop, record, note, release, step, due, loopLength } from '../src/looper.js';
+const { bar: BAR, beat: BEAT, timeOf16th } = LOFI_CLOCK;
+const LOOP_LENGTH = loopLength(createLoop());
 
 function memoryStorage() {
   const m = new Map();
````

````diff
diff --git a/open-case/test/bots.test.js b/open-case/test/bots.test.js
index 6006c98..dd69e55 100644
--- a/open-case/test/bots.test.js
+++ b/open-case/test/bots.test.js
@@ -2,8 +2,10 @@ import { test } from 'node:test';
 import assert from 'node:assert/strict';
 import { randomBot, lickBot, goodSet, wanderSet } from '../src/bots.js';
 import { createSet, stepSet, playNote, releaseNote, runSet, summary, momentsOf } from '../src/set.js';
-import { sixteenthAt, inKey, timeOf16th } from '../src/groove.js';
-import { GROOVE, DT } from '../src/tuning.js';
+import { LOFI, LOFI_CLOCK, inKey, setBars, clockOf, readyBeat } from '../src/beats.js';
+import { DT } from '../src/tuning.js';
+const { sixteenthAt, timeOf16th } = LOFI_CLOCK;
+const SET_BARS = setBars(LOFI);
 
 const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
 const coins = (bot) => SEEDS.map((seed) => runSet(seed, bot(seed)).coins);
@@ -47,7 +49,7 @@ test('every bot is the same from a seed, and different across seeds; each starts
       const notes = bot(seed);
       assert.equal(notes[0].t, 0, `bot seed ${seed} first note`);
       assert.ok(notes.every((n, i) => i === 0 || n.t >= notes[i - 1].t), `bot seed ${seed} in time order`);
-      assert.ok(notes.every((n) => n.t < timeOf16th(GROOVE.setBars * 16) && n.len > 0), `bot seed ${seed} within set`);
+      assert.ok(notes.every((n) => n.t < timeOf16th(SET_BARS * 16) && n.len > 0), `bot seed ${seed} within set`);
     }
   }
 });
@@ -63,7 +65,7 @@ test('the random bot plays 1 to 3 notes a beat, from the whole row at octave 0,
     assert.ok(len16 >= 1 && len16 <= 4, `${len16}`);
   }
   assert.ok([...perBeat.values()].every((k) => k >= 1 && k <= 3));
-  assert.ok(perBeat.size < GROOVE.setBars * 4, 'with some rests');
+  assert.ok(perBeat.size < SET_BARS * 4, 'with some rests');
   assert.ok(notes.some((n) => !inKey(n.pitch)), 'black keys too');
 });
 
@@ -103,3 +105,13 @@ test("the honest set's callbacks land: the crowd hears it bring ideas back on ev
   // and callbacks fell to 2-6. 8 is a floor comfortably below today's low and above the broken range.
   assert.ok(perSeedCallbacks.every((c) => c >= 8), `callbacks per seed: ${perSeedCallbacks}`);
 });
+
+test("a bot plays over another beat in that beat's time: the bossa's 16ths, within its 100 bars", () => {
+  const bossa = readyBeat('bossa'), clock = clockOf(bossa), end = clock.timeOf16th(setBars(bossa) * 16);
+  for (const bot of [randomBot, lickBot, goodSet, wanderSet]) {
+    const notes = bot(3, bossa);
+    assert.ok(notes.length > 50 && notes.every((n) => n.t < end), bot.name);
+    for (const n of notes.slice(1, 40)) assert.ok(Math.abs(clock.timeOf16th(clock.sixteenthAt(n.t)) - n.t) < 1e-9, `${bot.name} on a 16th`);
+  }
+  assert.ok(runSet(3, goodSet(3, bossa), bossa).phase === 'over');
+});
````

````diff
diff --git a/open-case/test/listen.test.js b/open-case/test/listen.test.js
index 25f1054..bdee57e 100644
--- a/open-case/test/listen.test.js
+++ b/open-case/test/listen.test.js
@@ -1,8 +1,9 @@
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
 import { createListener, tick, noteOff, shapeKey } from '../src/listen.js';
-import { timeOf16th, BEAT, inKey } from '../src/groove.js';
+import { LOFI_CLOCK, inKey } from '../src/beats.js';
 import { play, wait, heard, names, opening } from './helpers.js';
+const { timeOf16th, beat: BEAT } = LOFI_CLOCK;
 
 test('a phrase ends once no key has been held, and no note started, for a whole beat', () => {
   const l = createListener();
````

````diff
diff --git a/open-case/test/looper.test.js b/open-case/test/looper.test.js
index d682699..2e4da99 100644
--- a/open-case/test/looper.test.js
+++ b/open-case/test/looper.test.js
@@ -1,8 +1,10 @@
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
-import { createLoop, record, note, release, ring, step, undo, due, loopState, LOOP_LENGTH, countBeats } from '../src/looper.js';
-import { BAR, BEAT } from '../src/groove.js';
+import { createLoop, record, note, release, ring, step, undo, due, loopState, loopLength, countBeats } from '../src/looper.js';
+import { LOFI_CLOCK, clockOf, readyBeat } from '../src/beats.js';
 import { LOOP } from '../src/tuning.js';
+const { bar: BAR, beat: BEAT } = LOFI_CLOCK;
+const LOOP_LENGTH = loopLength(createLoop());
 
 const SIXTEENTH = BEAT / 4;
 const play = (loop, t, id, pitch, over = {}) => note(loop, t, id, { pitch, strength: 3, legato: false, ...over });
@@ -211,3 +213,14 @@ test('over many passes nothing drifts', () => {
   assert.equal(far.length, 1);
   assert.ok(Math.abs(((far[0].t - (BAR + 0.123)) / LOOP_LENGTH) - Math.round((far[0].t - (BAR + 0.123)) / LOOP_LENGTH)) < 1e-9);
 });
+
+test("a loop of another beat records 4 of that beat's bars, from its own bar lines", () => {
+  const clock = clockOf(readyBeat('funk'));
+  const loop = createLoop(clock);
+  assert.ok(Math.abs(loopLength(loop) - 4 * 2.4) < 1e-9);
+  assert.ok(record(loop, 1));
+  assert.ok(Math.abs(loop.take.from - 2.4) < 1e-9, "the funk's next bar line");
+  assert.deepEqual(countBeats(loop).map((t) => Math.round(t * 100) / 100), [1.2, 1.8], 'its beats, 0.6 s apart');
+  assert.equal(step(loop, 2.4 + 9.6 - 0.01), null);
+  assert.equal(step(loop, 2.4 + 9.6), 'layer');
+});
````

````diff
diff --git a/open-case/test/render.test.js b/open-case/test/render.test.js
index 3fe6c22..614c907 100644
--- a/open-case/test/render.test.js
+++ b/open-case/test/render.test.js
@@ -7,12 +7,14 @@ import { createScene, createFlocks, sceneNote, sceneLoopNote, CASE, PIGEONS, LOO
 import { createKeyState } from '../src/keys.js';
 import { goodSet } from '../src/bots.js';
 import { KINDS, LOOKS } from '../src/crowd.js';
-import { BAR, BEAT } from '../src/groove.js';
+import { LOFI_CLOCK, readyBeat } from '../src/beats.js';
 import { INTEREST, LOOP } from '../src/tuning.js';
 import { STOCK, PEDALS, INSTRUMENTS, freshGear, buy, stomp } from '../src/gear.js';
 import { createShop, choose, CARD, BUTTON } from '../src/shop.js';
-import { createLoop, record, step, LOOP_LENGTH } from '../src/looper.js';
+import { createLoop, record, step, loopLength } from '../src/looper.js';
 import { stoodAt } from './helpers.js';
+const { bar: BAR, beat: BEAT } = LOFI_CLOCK;
+const LOOP_LENGTH = loopLength(createLoop());
 
 // The real frame data, with a stand-in for the sheet's image.
 const data = JSON.parse(readFileSync(new URL('../assets/sprites.json', import.meta.url), 'utf8'));
@@ -645,3 +647,15 @@ test("the loop pedal's key line is no longer than another item's, so it never ru
   const otherKeys = keysFor(STOCK.find((s) => s.kind !== 'loop').id);
   assert.ok(loopKeys.length <= otherKeys.length, `${loopKeys} (${loopKeys.length}) vs ${otherKeys} (${otherKeys.length})`);
 });
+
+test("with another beat, the bar counter counts that set's bars, and listeners nod on its beats", () => {
+  const funk = readyBeat('funk');
+  const set = createSet(1, funk), g = fakeContext();
+  set.t = 2.5 * set.clock.bar;
+  createRenderer(g, art)(view({ set, t: set.t, bars: 2 }));
+  assert.ok(g.texts.includes('bar 3/76'), g.texts.filter((x) => x.startsWith('bar')).join());
+  const p = { kind: 'student', look: 1, x: 100, y: 150, dir: -1, state: 'stopped', interest: 0.9, id: 0 };
+  const beat = set.clock.beat;
+  assert.match(personFrame(p, 10 * beat + 0.05, 0, beat), /-nod-1-/, "head down on the funk's beat");
+  assert.match(personFrame(p, 10 * beat + beat * 0.6, 0, beat), /-nod-0-/);
+});
````

````diff
diff --git a/open-case/test/scene.test.js b/open-case/test/scene.test.js
index fdd83f5..0160b29 100644
--- a/open-case/test/scene.test.js
+++ b/open-case/test/scene.test.js
@@ -6,8 +6,9 @@ import {
   skyStages, sunDrop, windowLit, lampState, starsOut, trainX, cloudX, createFlocks, birdsAt, pigeonsAt, frameOf,
   PIGEONS, TRAIN_LENGTH, PIGEON_FLY, PIGEON_WALK,
 } from '../src/scene.js';
-import { BAR } from '../src/groove.js';
+import { LOFI_CLOCK } from '../src/beats.js';
 import { PARK } from '../src/tuning.js';
+const { bar: BAR } = LOFI_CLOCK;
 
 test('each note leaves a glyph that floats up from the guitar, higher notes higher, and fades over 2 bars', () => {
   const scene = createScene();
@@ -209,3 +210,14 @@ test('after the tab sleeps for an hour, the sky holds at most one flock, not an
   assert.ok(flocks.flying.length <= 1);
   assert.ok(flocks.next > 3600, 'the next flock is still to come');
 });
+
+test("the park keeps its own bars over a set of any beat: the train by the park's, the pigeons by the beat's", () => {
+  const bar = 2.4, parkBar = 182.4 / PARK.bars; // the funk: 76 bars of 2.4 s, so a park bar is 3.04 s
+  const scene = createScene(3, { bar, parkBar });
+  const at = scene.trainBar * parkBar;
+  assert.equal(trainX(scene, at - 0.01), null);
+  assert.equal(trainX(scene, at), -TRAIN_LENGTH, "the train comes at its park bar, whatever the beat");
+  sceneNote(scene, 60, 0, 10, 4); // loud: the pigeons fly
+  assert.ok(pigeonsAt(scene, 10 + PARK.pigeonsAway * bar - 0.01, 0).every((p) => p.pose !== 'walk'), 'still away');
+  assert.ok(pigeonsAt(scene, 10 + PARK.pigeonsAway * bar + 0.1, 0).every((p) => p.pose === 'walk'), 'back after 4 of the beat\'s bars');
+});
````

````diff
diff --git a/open-case/test/set.test.js b/open-case/test/set.test.js
index 465673a..2a13425 100644
--- a/open-case/test/set.test.js
+++ b/open-case/test/set.test.js
@@ -2,9 +2,10 @@ import { test } from 'node:test';
 import assert from 'node:assert/strict';
 import { readFileSync } from 'node:fs';
 import { createSet, stepSet, playNote, momentsOf, endTime } from '../src/set.js';
-import { BAR } from '../src/groove.js';
+import { LOFI_CLOCK, readyBeat } from '../src/beats.js';
 import { DT } from '../src/tuning.js';
 import { stoodAt } from './helpers.js';
+const { bar: BAR } = LOFI_CLOCK;
 
 // Steps a set until time `until`, returning every event with the time it came.
 function runTo(set, until) {
@@ -54,10 +55,10 @@ test('a single person hesitating never makes the music flicker', () => {
 
 test('the set lasts 60 bars, then fades a bar, the listeners still there tip once, and the end card comes', () => {
   const set = createSet(1);
-  const early = runTo(set, endTime() - 1);
+  const early = runTo(set, endTime(set) - 1);
   stoodAt(set.crowd, 'student', 0);
   stoodAt(set.crowd, 'elder', 1);
-  const events = [...early, ...runTo(set, endTime() + BAR + 2)];
+  const events = [...early, ...runTo(set, endTime(set) + BAR + 2)];
   const end = events.find((e) => e.type === 'end'), over = events.find((e) => e.type === 'over');
   assert.ok(end.at >= 180 && end.at < 180 + DT * 1.5);
   assert.ok(over.at - end.at >= BAR + 1 - DT && over.at - end.at < BAR + 1 + DT * 1.5);
@@ -73,12 +74,36 @@ test('key moments come in time order, a key going up before the next goes down',
 });
 
 test("gear only changes how you sound: the crowd's rules never see it, or the loop", () => {
-  // The rules (the set, the ears, the crowd, the groove, the bots) import nothing from the shop, the
+  // The rules (the set, the ears, the crowd, the beats, the bots) import nothing from the shop, the
   // gear, the loop pedal or the sound, so a set played with every pedal on, or over a loop, scores
   // exactly as one without.
-  for (const f of ['set', 'listen', 'crowd', 'groove', 'bots']) {
+  for (const f of ['set', 'listen', 'crowd', 'beats', 'bots']) {
     const src = readFileSync(new URL(`../src/${f}.js`, import.meta.url), 'utf8');
     const imports = [...src.matchAll(/from '\.\/([a-z]+)\.js'/g)].map((m) => m[1]);
     for (const other of imports) assert.ok(!['gear', 'shop', 'audio', 'main', 'looper'].includes(other), `${f}.js imports ${other}.js`);
   }
 });
+
+test("a set of another beat keeps its tempo: the funk's 76 bars of 2.4 s, its layers decided at its own bar lines", () => {
+  const set = createSet(1, readyBeat('funk'));
+  assert.equal(set.beat.id, 'funk');
+  assert.equal(set.bars, 76);
+  assert.ok(Math.abs(set.clock.bar - 2.4) < 1e-9 && Math.abs(endTime(set) - 182.4) < 1e-9);
+  stoodAt(set.crowd, 'student', 0);
+  const events = runTo(set, 2 * set.clock.bar);
+  const [e] = events.filter((x) => x.type === 'layers');
+  assert.equal(e.bar, 1);
+  assert.ok(e.at < set.clock.bar && e.at > set.clock.bar - 0.3, "just before the funk's first bar line");
+  const rest = runTo(set, endTime(set) + set.clock.bar + 2);
+  const end = rest.find((x) => x.type === 'end'), over = rest.find((x) => x.type === 'over');
+  assert.ok(end.at >= 182.4 && end.at < 182.4 + DT * 1.5);
+  assert.ok(over.at - end.at >= set.clock.bar + 1 - DT && over.at - end.at < set.clock.bar + 1 + DT * 1.5, 'a bar of the funk to fade');
+});
+
+test("a set's ears count its beat's bars", () => {
+  const set = createSet(1, readyBeat('ballad'));
+  playNote(set, 60, 3, 0.1);
+  runTo(set, set.clock.bar * 2 + 0.01);
+  assert.equal(set.listen.bar, 2);
+  assert.equal(set.listen.notes[0].s, 0);
+});
````

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL.
- `audio.test.js`, `looper.test.js` and `render.test.js` can't load: `The requested module '../src/looper.js' does not provide an export named 'loopLength'`.
- Four new tests fail:
  - "a bot plays over another beat in that beat's time: the bossa's 16ths, within its 100 bars";
  - "the park keeps its own bars over a set of any beat: the train by the park's, the pigeons by the beat's";
  - "a set of another beat keeps its tempo: the funk's 76 bars of 2.4 s, its layers decided at its own bar lines";
  - "a set's ears count its beat's bars".

- [ ] **Step 3: The clock, everywhere**

Apply each patch:

````diff
diff --git a/open-case/src/tuning.js b/open-case/src/tuning.js
index 7eecb93..3edcf16 100644
--- a/open-case/src/tuning.js
+++ b/open-case/src/tuning.js
@@ -6,9 +6,6 @@ export const TICK_HZ = 60;
 export const DT = 1 / TICK_HZ;
 
 export const GROOVE = {
-  bpm: 80,
-  swing: 0.58, // the second 16th of each pair lands at this share of the pair
-  setBars: 60, // 15 times round the 4-bar loop: 3 minutes
   setSeconds: 180, // a set lasts about this long, whatever its beat's tempo (beats.js setBars)
   ahead: 0.2, // seconds of band scheduled ahead of the audio clock
   layerLead: 0.25, // seconds before a bar line that its layers are decided (more than `ahead`)
@@ -113,9 +110,13 @@ export const LAYER_HOLD = 2;
 export const LOG_SIZE = 50; // sets kept in the test log
 
 // The park's life (scene.js and render.js): the sunset over each set, and what moves in the
-// background. Bars count from a set's first note; seconds for the clouds, birds and pigeons' pecking
-// run on the page's clock, so they carry on over the title and between sets.
+// background. Its evening counts the park's own bars from a set's first note: PARK.bars of them over
+// the whole set, however many bars the set's beat gives it, so the sun always sets across the set.
+// (With the lo-fi's 60 bars, a park bar is a bar.) The pigeons stay away for bars of the beat itself.
+// Seconds for the clouds, birds and pigeons' pecking run on the page's clock, so they carry on over
+// the title and between sets.
 export const PARK = {
+  bars: 60, // the park's bars in a set
   stageBars: 15, // the sky moves on a stage (dusk 0 to night 4) every this many bars...
   bandFirst: 3, // ...its top band first, this many bars into the stage...
   bandStep: 2, // ...then each band below it this many bars later, so the horizon's is the last
````

````diff
diff --git a/open-case/src/listen.js b/open-case/src/listen.js
index e00674e..43b628d 100644
--- a/open-case/src/listen.js
+++ b/open-case/src/listen.js
@@ -11,10 +11,12 @@
 // 'loud', and also 'phrase' ({ clean, loud, notes }) when a phrase ends and 'bar' ({ bar, count, off,
 // rest }) at each bar line, for the crowd's tastes.
 import { RULES } from './tuning.js';
-import { BAR, BEAT, sixteenthAt, inKey, isStrong, isOff16th } from './groove.js';
+import { LOFI_CLOCK, inKey, isStrong, isOff16th } from './beats.js';
 
-export function createListener() {
+// clock: the set's beat's timing (beats.js clockOf), for its 16ths, beats and bars.
+export function createListener(clock = LOFI_CLOCK) {
   return {
+    clock,
     notes: [], // { pitch, s, strength, echo }: echo is the most times a shape it's part of has come round lately
     shapes: [], // shapes[i]: the key of the shape ending at note i (null for the set's first 3 notes)
     held: 0, // keys down
@@ -48,8 +50,8 @@ export const shapeKey = (notes, i) => keyOf(shapeOf(notes, i));
 
 export function noteOn(l, pitch, t, strength) {
   // A beat of quiet ended the last phrase, even if no update has run since to notice.
-  if (l.phrase && l.held === 0 && t - l.quietAt >= RULES.phraseEndBeats * BEAT) endPhrase(l);
-  const s = sixteenthAt(t);
+  if (l.phrase && l.held === 0 && t - l.quietAt >= RULES.phraseEndBeats * l.clock.beat) endPhrase(l);
+  const s = l.clock.sixteenthAt(t);
   const i = l.notes.length;
   const note = { pitch, s, strength, echo: 1 };
   l.notes.push(note);
@@ -183,9 +185,9 @@ function barLine(l, b) {
 
 // Time passes: bar lines and phrase ends.
 export function tick(l, t) {
-  while (t >= (l.bar + 1) * BAR) {
+  while (t >= (l.bar + 1) * l.clock.bar) {
     l.bar++;
     barLine(l, l.bar);
   }
-  if (l.phrase && l.held === 0 && t - l.quietAt >= RULES.phraseEndBeats * BEAT) endPhrase(l);
+  if (l.phrase && l.held === 0 && t - l.quietAt >= RULES.phraseEndBeats * l.clock.beat) endPhrase(l);
 }
````

````diff
diff --git a/open-case/src/looper.js b/open-case/src/looper.js
index e75678c..c2ea717 100644
--- a/open-case/src/looper.js
+++ b/open-case/src/looper.js
@@ -5,51 +5,54 @@
 // pedals as they are at the time.
 //
 // Times are band time: seconds since the band's first 16th (in a set, since your first note), so the
-// bar lines fall on whole numbers of BAR. Pure, so it's tested in Node; main.js runs it, audio.js
+// bar lines fall on whole numbers of the beat's bar (the loop's clock). Pure, so it's tested in Node; main.js runs it, audio.js
 // plays it and render.js shows it. The crowd never hears it: set.js and the rules never import it.
 import { LOOP } from './tuning.js';
-import { BAR, BEAT } from './groove.js';
+import { LOFI_CLOCK } from './beats.js';
 
-export const LOOP_LENGTH = LOOP.bars * BAR; // seconds: one pass of the chords
-const EARLY = (LOOP.early * BEAT) / 4; // seconds: how early a note can be for a recording's first bar line
+// Seconds: one pass of the loop, LOOP.bars of its beat's bars.
+export const loopLength = (loop) => LOOP.bars * loop.clock.bar;
+// Seconds: how early a note can be for a recording's first bar line.
+const early = (loop) => (LOOP.early * loop.clock.beat) / 4;
 
-// { layers, take, ring }: the layers so far, oldest first, each { from: the band time its recording
+// { clock, layers, take, ring }: the beat's timing (beats.js clockOf), the layers so far, oldest first, each { from: the band time its recording
 // started, notes }; the recording waiting or under way, { from, armed, notes, sounding }, or null; and
 // whether Space is held. `armed` is the band time R was pressed, for the count-in (countBeats). Each
 // note is { at: seconds after its layer's first bar line (a hair below 0 if it came early), pitch,
 // strength, legato, len: seconds it sounded, null while it still does }.
-export function createLoop() {
-  return { layers: [], take: null, ring: false };
+export function createLoop(clock = LOFI_CLOCK) {
+  return { clock, layers: [], take: null, ring: false };
 }
 
 // R at band time t: arms a recording from the next bar line. Returns false, doing nothing, while a
 // recording is waiting or under way, or when the loop is full.
 export function record(loop, t) {
   if (loop.take || loop.layers.length >= LOOP.layers) return false;
-  loop.take = { from: (Math.floor(t / BAR) + 1) * BAR, armed: t, notes: [], sounding: [] };
+  const bar = loop.clock.bar;
+  loop.take = { from: (Math.floor(t / bar) + 1) * bar, armed: t, notes: [], sounding: [] };
   return true;
 }
 
 // The band times of the count-in's clicks for the recording that's waiting: every beat (a whole
-// multiple of BEAT) strictly after R was pressed and strictly before the bar line it arms from, in
-// order ([] with no take). Integer beat indices, not repeated addition, keep the times exact multiples
-// of BEAT; a small tolerance keeps float error from ever including the bar line itself.
+// multiple of the clock's beat) strictly after R was pressed and strictly before the bar line it arms
+// from, in order ([] with no take). Integer beat indices, not repeated addition, keep the times exact
+// multiples of a beat; a small tolerance keeps float error from ever including the bar line itself.
 export function countBeats(loop) {
   const take = loop.take;
   if (!take) return [];
-  const out = [];
-  for (let k = Math.floor(take.armed / BEAT) + 1; k * BEAT < take.from - 1e-9; k++) out.push(k * BEAT);
+  const out = [], beat = loop.clock.beat;
+  for (let k = Math.floor(take.armed / beat) + 1; k * beat < take.from - 1e-9; k++) out.push(k * beat);
   return out;
 }
 
 // A note you play starts at band time t (id: its key, for its release). It's kept if a recording is
-// under way, or about to start within EARLY. Striking a pitch that's still ringing from Space ends the
+// under way, or about to start within a 16th (LOOP.early). Striking a pitch that's still ringing from Space ends the
 // ringing note there, as it does in the sound. Returns whether the note was kept.
 export function note(loop, t, id, { pitch, strength, legato }) {
   const take = loop.take;
   if (!take) return false;
-  for (const s of take.sounding.filter((x) => x.ringing && x.note.pitch === pitch)) end(take, s, t);
-  if (t < take.from - EARLY || t >= take.from + LOOP_LENGTH) return false;
+  for (const s of take.sounding.filter((x) => x.ringing && x.note.pitch === pitch)) end(loop, s, t);
+  if (t < take.from - early(loop) || t >= take.from + loopLength(loop)) return false;
   const n = { at: t - take.from, pitch, strength, legato, len: null };
   take.notes.push(n);
   take.sounding.push({ id, note: n, ringing: false });
@@ -61,19 +64,20 @@ export function release(loop, t, id) {
   const s = loop.take?.sounding.find((x) => x.id === id && !x.ringing);
   if (!s) return;
   if (loop.ring) s.ringing = true;
-  else end(loop.take, s, t);
+  else end(loop, s, t);
 }
 
 // Space goes down (on) or comes up at band time t. Letting it go ends every note still ringing.
 export function ring(loop, t, on) {
   loop.ring = on;
   if (on || !loop.take) return;
-  for (const s of loop.take.sounding.filter((x) => x.ringing)) end(loop.take, s, t);
+  for (const s of loop.take.sounding.filter((x) => x.ringing)) end(loop, s, t);
 }
 
 // A recorded note stops sounding at band time t, or where its recording ends if that's sooner.
-function end(take, s, t) {
-  s.note.len = Math.max(0, Math.min(t, take.from + LOOP_LENGTH) - take.from - s.note.at);
+function end(loop, s, t) {
+  const take = loop.take;
+  s.note.len = Math.max(0, Math.min(t, take.from + loopLength(loop)) - take.from - s.note.at);
   take.sounding.splice(take.sounding.indexOf(s), 1);
 }
 
@@ -81,8 +85,8 @@ function end(take, s, t) {
 // still sounding cut off at its end, and step returns 'layer'; otherwise null.
 export function step(loop, t) {
   const take = loop.take;
-  if (!take || t < take.from + LOOP_LENGTH) return null;
-  for (const s of [...take.sounding]) end(take, s, t);
+  if (!take || t < take.from + loopLength(loop)) return null;
+  for (const s of [...take.sounding]) end(loop, s, t);
   loop.layers.push({ from: take.from, notes: take.notes });
   loop.take = null;
   return 'layer';
@@ -105,15 +109,15 @@ export function undo(loop) {
 // layer plays from the end of its recording, time after time. A recording's notes are due from then
 // too, so a note played early for its first bar line sounds just as early the first time round.
 export function due(loop, from, to) {
-  const out = [];
+  const out = [], length = loopLength(loop);
   const layers = loop.take ? [...loop.layers, loop.take] : loop.layers;
   layers.forEach((layer, i) => {
     for (const n of layer.notes) {
-      const first = layer.from + LOOP_LENGTH + n.at; // its first time round
+      const first = layer.from + length + n.at; // its first time round
       // Each time is worked out from the first, never added up, so nothing drifts.
-      for (let k = Math.max(0, Math.floor((from - first) / LOOP_LENGTH)); first + k * LOOP_LENGTH < to; k++) {
-        const t = first + k * LOOP_LENGTH;
-        if (t >= from) out.push({ t, pitch: n.pitch, strength: n.strength, legato: n.legato, len: n.len ?? LOOP_LENGTH - n.at, layer: i });
+      for (let k = Math.max(0, Math.floor((from - first) / length)); first + k * length < to; k++) {
+        const t = first + k * length;
+        if (t >= from) out.push({ t, pitch: n.pitch, strength: n.strength, legato: n.legato, len: n.len ?? length - n.at, layer: i });
       }
     }
   });
````

````diff
diff --git a/open-case/src/set.js b/open-case/src/set.js
index 00bf8c6..93e8220 100644
--- a/open-case/src/set.js
+++ b/open-case/src/set.js
@@ -7,19 +7,25 @@
 //   { type: 'coin', person, coins, why } a coin lands in the case ('callback', 'happy' or 'end')
 //   { type: 'hooked', person }  { type: 'left', person, happy }
 //   { type: 'layers', bar, layers }     the layers playing from bar `bar` on (decided just before it)
-//   { type: 'end' }                     bar 60 is over: fade the band, clap
+//   { type: 'end' }                     the set's last bar is over: fade the band, clap
 //   { type: 'over' }                    the end card
 import { createListener, noteOn, noteOff, tick } from './listen.js';
 import { createCrowd, hear, stepCrowd, crowdSize, endTips } from './crowd.js';
-import { BAR } from './groove.js';
+import { LOFI, clockOf, setBars } from './beats.js';
 import { GROOVE, LAYERS, LAYER_HOLD, DT } from './tuning.js';
 
-export function createSet(seed) {
+// A set of `beat` (beats.js): the band plays it, and its tempo sets the set's 16ths, beats and bars
+// (clock) and how many bars the set lasts (bars).
+export function createSet(seed, beat = LOFI) {
+  const clock = clockOf(beat);
   return {
     seed,
+    beat,
+    clock,
+    bars: setBars(beat),
     t: 0,
     phase: 'playing', // then 'ending' (the fade and the applause), then 'over'
-    listen: createListener(),
+    listen: createListener(clock),
     crowd: createCrowd(seed),
     coins: 0,
     layers: Object.fromEntries(LAYERS.map((l) => [l.id, l.min === 0])),
@@ -31,7 +37,8 @@ export function createSet(seed) {
   };
 }
 
-export const endTime = () => GROOVE.setBars * BAR;
+// When the set's last bar is over, in seconds from its first note.
+export const endTime = (set) => set.bars * set.clock.bar;
 
 export function playNote(set, pitch, strength, t) {
   if (set.phase === 'playing') noteOn(set.listen, pitch, t, strength);
@@ -76,15 +83,16 @@ export function stepSet(set, dt = DT) {
   l.events.length = 0;
   stepCrowd(c, dt, t);
   set.most = Math.max(set.most, crowdSize(c));
-  while (set.phase === 'playing' && t >= (set.decided + 1) * BAR - GROOVE.layerLead && set.decided + 1 < GROOVE.setBars) {
+  const bar = set.clock.bar;
+  while (set.phase === 'playing' && t >= (set.decided + 1) * bar - GROOVE.layerLead && set.decided + 1 < set.bars) {
     set.decided++;
     decideLayers(set, set.decided);
   }
-  if (set.phase === 'playing' && t >= endTime()) {
+  if (set.phase === 'playing' && t >= endTime(set)) {
     set.phase = 'ending';
     c.open = false;
     endTips(c);
-    set.overAt = t + BAR + GROOVE.applause; // a bar's fade, then applause
+    set.overAt = t + bar + GROOVE.applause; // a bar's fade, then applause
     set.events.push({ type: 'end' });
   } else if (set.phase === 'ending' && t >= set.overAt) {
     set.phase = 'over';
@@ -114,8 +122,8 @@ export function momentsOf(notes) {
 }
 
 // Plays a whole set without sound or screen, as the tests and the end card's "Run the bots" do.
-export function runSet(seed, notes) {
-  const set = createSet(seed);
+export function runSet(seed, notes, beat = LOFI) {
+  const set = createSet(seed, beat);
   const moments = momentsOf(notes);
   let i = 0;
   while (set.phase !== 'over') {
````

````diff
diff --git a/open-case/src/scene.js b/open-case/src/scene.js
index eff4240..b895b10 100644
--- a/open-case/src/scene.js
+++ b/open-case/src/scene.js
@@ -4,7 +4,7 @@
 // the birds overhead). Pure, so it's tested in Node; render.js draws it. Times are seconds on the
 // set's clock, except the birds' and the pigeons' pecking, which run on the page's clock (`time`).
 import { createRng, nextRandom, randomBetween } from './rng.js';
-import { BAR } from './groove.js';
+import { LOFI_CLOCK } from './beats.js';
 import { PARK, RULES } from './tuning.js';
 
 export const GUITAR = [152, 128]; // where notes float up from
@@ -31,9 +31,12 @@ const PIGEON_CYCLE = 6; // seconds: each pigeon pecks, then shuffles a few pixel
 // hair below zero).
 export const frameOf = (count, n) => ((Math.floor(count) % n) + n) % n;
 
-export function createScene(seed = 1) {
+// bar: seconds in a bar of the set's beat (the pigeons stay away PARK.pigeonsAway of them); parkBar:
+// seconds in one of the park's bars (the set's length over PARK.bars), which the train's time counts.
+export function createScene(seed = 1, { bar = LOFI_CLOCK.bar, parkBar = bar } = {}) {
   const rng = createRng((seed ^ PARK_SEED) >>> 0);
   return {
+    bar, parkBar,
     trail: [], flights: [], caseCoins: 0, gold: null, clapFrom: -1,
     // your loop's notes, { pitch, t }, in time order (t may be a moment ahead: scheduled that way)
     loopTrail: [],
@@ -51,9 +54,10 @@ export function createScene(seed = 1) {
 export function sceneNote(scene, pitch, index, t, strength = 0) {
   scene.trail.push({ pitch, index, t });
   scene.lastNote = t;
-  if (strength >= RULES.loudStrength && (scene.scaredAt === null || t - scene.scaredAt >= PARK.pigeonsAway * BAR)) {
+  const away = PARK.pigeonsAway * scene.bar;
+  if (strength >= RULES.loudStrength && (scene.scaredAt === null || t - scene.scaredAt >= away)) {
     // Scattered while walking back in: fly on from there, not from home.
-    const back = scene.scaredAt === null ? -1 : t - scene.scaredAt - PARK.pigeonsAway * BAR;
+    const back = scene.scaredAt === null ? -1 : t - scene.scaredAt - away;
     scene.flyFrom = back >= 0 && back < PIGEON_WALK ? back / PIGEON_WALK : 1;
     scene.scaredAt = t;
   }
@@ -145,7 +149,7 @@ export const starsOut = (bar) => Math.max(0, bar - PARK.starsFrom + 1);
 
 // The distant train's left end at set time t, or null when it isn't passing.
 export function trainX(scene, t) {
-  const k = (t - scene.trainBar * BAR) / PARK.trainCross;
+  const k = (t - scene.trainBar * scene.parkBar) / PARK.trainCross;
   if (k < 0 || k > 1) return null;
   return Math.round(-TRAIN_LENGTH + k * (320 + TRAIN_LENGTH));
 }
@@ -202,7 +206,7 @@ export function pigeonsAt(scene, t, time) {
       out.push({ x: Math.round(start + (60 + i * 12) * since), y: Math.round(hy - up), pose: 'fly', frame: frameOf(since * 8 + i, 2), dir: 1 });
       return;
     }
-    const back = since - PARK.pigeonsAway * BAR; // seconds since they started walking back
+    const back = since - PARK.pigeonsAway * scene.bar; // seconds since they started walking back
     if (back < 0) return;
     if (back < PIGEON_WALK) {
       out.push({ x: Math.round(from + (hx - from) * (back / PIGEON_WALK)), y: hy, pose: 'walk', frame: frameOf(time * 6 + i, 2), dir: -1 });
````

````diff
diff --git a/open-case/src/render.js b/open-case/src/render.js
index 9b5deb8..c254788 100644
--- a/open-case/src/render.js
+++ b/open-case/src/render.js
@@ -5,7 +5,7 @@
 // your loop's), the memory strip, the gear strip, the music shop, and the title, pause and ?debug
 // overlays. The end card is HTML (index.html).
 import { CROWD, PLAY, LAYERS, INTEREST, LOOP } from './tuning.js';
-import { BAR, BEAT } from './groove.js';
+import { LOFI_CLOCK } from './beats.js';
 import {
   GUITAR, coinAt, glyphAt, loopGlyphAt, GOLD, skyStages, sunDrop, windowLit, lampState, starsOut, trainX, cloudX,
   birdsAt, pigeonsAt, frameOf,
@@ -40,7 +40,7 @@ const CUE_CELL_W = 5, CUE_CELL_H = 3, CUE_CELL_GAP = 1; // the recording cue's f
 const CUE_TEXT_GAP = 3; // between "rec" and its first cell
 const CUE_CELL_Y = 163; // roughly the middle of "rec"'s 8px row (top at 160)
 const CUE_LEFT_MIN = 177; // keeps "rec" clear of the case sprite's rim, whose red lining reads as the word's
-const BEATS_PER_BAR = 4; // this song's fixed 4/4 meter: always 4, unlike LOOP.bars (how many bars a loop take is)
+const BEATS_PER_BAR = 4; // every beat's 4/4 meter: always 4, unlike LOOP.bars (how many bars a loop take is)
 const NOD_SHOW = 1.2; // seconds the shopkeeper nods after a sale...
 const NOD_FPS = 4; // ...this many nods a second
 
@@ -56,12 +56,12 @@ export function shapeTags(shapes) {
 
 // The frame a passer-by shows, as the person they are (their kind and look): walking by where they
 // are (so a slower walker steps slower), and standing still facing you, breathing, or nodding on the
-// beat once they're hooked.
-export function personFrame(p, t, time) {
+// beat once they're hooked (beat: seconds in a beat of the set's beat).
+export function personFrame(p, t, time, beat = LOFI_CLOCK.beat) {
   const facingYou = p.state === 'stopped' || p.state === 'joining';
   const face = (facingYou ? (p.x < CROWD.playerX ? 1 : -1) : p.dir) > 0 ? 'right' : 'left';
   if (p.state !== 'stopped') return `${p.kind}-${p.look}-walk-${frameOf((Math.abs(p.x) + Math.abs(p.y)) / STEP, 4)}-${face}`;
-  if (p.interest > INTEREST.hook) return `${p.kind}-${p.look}-nod-${t / BEAT - Math.floor(t / BEAT) < NOD ? 1 : 0}-${face}`;
+  if (p.interest > INTEREST.hook) return `${p.kind}-${p.look}-nod-${t / beat - Math.floor(t / beat) < NOD ? 1 : 0}-${face}`;
   return `${p.kind}-${p.look}-stand-${frameOf(time / BREATH + p.id * 0.37, 2)}-${face}`;
 }
 
@@ -78,7 +78,7 @@ export function youFrame(scene, t, time, instrument) {
 // green while the loop plays.
 export function loopLight(loop, t) {
   const state = loop ? loopState(loop, t) : 'empty';
-  if (state === 'waiting') return frameOf(t / (BEAT / 2), 2) === 0 ? 'red' : 'dark';
+  if (state === 'waiting') return frameOf(t / (loop.clock.beat / 2), 2) === 0 ? 'red' : 'dark';
   return { recording: 'red', playing: 'green' }[state] ?? 'dark';
 }
 
@@ -94,32 +94,33 @@ export function loopWords({ what, layer }) {
 // 1, counted down to the bar line itself rather than up from wherever R joined the count, so a caller
 // whose clock lags a hair behind the bar line — set.t, stepped in whole ticks, trails the audio clock
 // slightly — still reads the beat it's really in, not the tail of the one before); while recording,
-// elapsed e = t - take.from (0 <= e < LOOP_LENGTH): on the last bar's beats 2-4, { count, closing:
-// true } (3, 2, 1, so you know when it closes); otherwise { bars: e / BAR } (0 up to just under
-// LOOP.bars, fractional).
+// elapsed e = t - take.from (0 <= e < loopLength): on the last bar's beats 2-4, { count, closing:
+// true } (3, 2, 1, so you know when it closes); otherwise { bars: e / bar } (0 up to just under
+// LOOP.bars, fractional). Beats and bars are the loop's beat's (loop.clock).
 export function loopCue(loop, t) {
   const take = loop?.take;
   if (!take) return null;
+  const { beat, bar } = loop.clock;
   if (t < take.from) {
     // Ceil'd, not floor'd: however close t sits below a beat boundary, it's still that beat's count.
     // The small tolerance stops a boundary landing a hair above its exact multiple (float error) from
     // ceiling to one more than it should.
-    const count = Math.min(BEATS_PER_BAR, Math.max(1, Math.ceil((take.from - t) / BEAT - 1e-9)));
+    const count = Math.min(BEATS_PER_BAR, Math.max(1, Math.ceil((take.from - t) / beat - 1e-9)));
     return { count };
   }
   const e = t - take.from;
-  const lastBarFrom = (LOOP.bars - 1) * BAR;
-  if (e >= lastBarFrom + BEAT) {
-    return { count: Math.max(1, BEATS_PER_BAR - Math.floor((e - lastBarFrom) / BEAT)), closing: true };
+  const lastBarFrom = (LOOP.bars - 1) * bar;
+  if (e >= lastBarFrom + beat) {
+    return { count: Math.max(1, BEATS_PER_BAR - Math.floor((e - lastBarFrom) / beat)), closing: true };
   }
-  return { bars: e / BAR };
+  return { bars: e / bar };
 }
 
-// The trees: still when motion is reduced, rustling just after each bar line of a set, and otherwise
-// swaying slowly.
-export function treeFrame(t, time, playing, still) {
+// The trees: still when motion is reduced, rustling just after each bar line of a set (bar: seconds in
+// a bar of its beat), and otherwise swaying slowly.
+export function treeFrame(t, time, playing, still, bar = LOFI_CLOCK.bar) {
   if (still) return 0;
-  if (playing && t >= 0 && t % BAR < RUSTLE) return 2;
+  if (playing && t >= 0 && t % bar < RUSTLE) return 2;
   return Math.sin(time * SWAY) > 0.4 ? 1 : 0;
 }
 
@@ -170,7 +171,7 @@ export function createRenderer(g, art) {
     data.windows.forEach(([x, y], i) => {
       if (windowLit(scene, i, bar)) px(x, y, 2, 2, C.gold);
     });
-    sprite(`trees-${treeFrame(t, time, !!set, still)}`, 0, 0);
+    sprite(`trees-${treeFrame(t, time, !!set, still, set?.clock.bar)}`, 0, 0);
     sprite('ground', 0, 0);
     const lamp = lampState(bar, time, still);
     if (lamp !== 'off') sprite('pool', 0, 0);
@@ -200,7 +201,7 @@ export function createRenderer(g, art) {
     ];
     if (gear.instrument === 'electric') things.push({ y: data.feet.amp, draw: () => sprite('amp', 0, 0) });
     if (owns(gear, 'loop')) things.push({ y: data.feet.loop, draw: () => sprite(`pedal-loop-${loopLight(loop, t)}`, 0, 0) });
-    if (set) for (const p of set.crowd.people) things.push({ y: p.y, draw: () => sprite(personFrame(p, t, time), p.x, p.y) });
+    if (set) for (const p of set.crowd.people) things.push({ y: p.y, draw: () => sprite(personFrame(p, t, time, set.clock.beat), p.x, p.y) });
     const flying = [];
     for (const b of pigeonsAt(scene, t, time)) {
       const name = `pigeon-${b.pose}-${b.frame}-${b.dir > 0 ? 'right' : 'left'}`;
@@ -288,7 +289,7 @@ export function createRenderer(g, art) {
     text(`oct ${keys.octave >= 0 ? '+' : ''}${keys.octave}`, 4, 170);
     for (let i = 0; i < PLAY.strengthMax; i++) px(52 + i * 5, 172, 4, 4, i < keys.strength ? C.light : C.ink);
     if (keys.lock) text('lock', 78, 170, C.gold);
-    if (set) text(`bar ${Math.min(60, Math.floor(set.t / BAR) + 1)}/60`, W - 4, 170, C.light, 'right');
+    if (set) text(`bar ${Math.min(set.bars, Math.floor(set.t / set.clock.bar) + 1)}/${set.bars}`, W - 4, 170, C.light, 'right');
     // The gear strip: each pedal you own in its own place, with its key, lit while it's on; the name
     // of the one just stomped shows above it for a moment.
     PEDALS.forEach((id, i) => {
@@ -440,9 +441,9 @@ export function createRenderer(g, art) {
       if (p.lastRule) text(RULE_WORDS[p.lastRule] ?? p.lastRule, p.x, y + 4, C.light, 'center');
     }
     const l = set.listen;
-    const beat = Math.floor((set.t % BAR) / BEAT) + 1;
+    const { bar, beat: beatLen } = set.clock, beat = Math.floor((set.t % bar) / beatLen) + 1;
     const lines = [
-      `bar ${Math.min(60, Math.floor(set.t / BAR) + 1)} beat ${beat}`,
+      `bar ${Math.min(set.bars, Math.floor(set.t / bar) + 1)} beat ${beat}`,
       `layers ${LAYERS.filter((x) => set.layers[x.id]).map((x) => x.id).join(' ')}`,
       `crowd ${set.crowd.people.filter((p) => p.state === 'joining' || p.state === 'stopped').length}  coins ${set.coins}`,
       `shapes ${shapeTags(l.shapes.slice(-16))}`,
````

````diff
diff --git a/open-case/src/bots.js b/open-case/src/bots.js
index 033a122..cd42201 100644
--- a/open-case/src/bots.js
+++ b/open-case/src/bots.js
@@ -1,5 +1,6 @@
 // Players that aren't Nathan, all deterministic from a seed. Each returns a whole set's notes,
-// [{ t, pitch, strength, len }] in seconds from the first note, for runSet() or for the browser to play.
+// [{ t, pitch, strength, len }] in seconds from the first note, for runSet() or for the browser to play,
+// over a beat (beats.js; the lo-fi unless told), whose tempo times the notes and sets the set's length.
 //   randomBot: random keys from the whole row, 1 to 3 notes a beat. The too-random side.
 //   lickBot:   one 4-note lick over and over, a beat's rest between. The too-repetitive side.
 //   goodSet:   the scripted honest set for the headline test: ideas in the key, answered, and brought
@@ -7,10 +8,8 @@
 //   wanderSet: in key and in varied phrases, but never bringing an idea back. The tests keep it
 //              between the honest set and the random bot.
 import { createRng, nextRandom } from './rng.js';
-import { timeOf16th } from './groove.js';
-import { GROOVE } from './tuning.js';
+import { LOFI, clockOf, setBars } from './beats.js';
 
-const SET_16THS = GROOVE.setBars * 16;
 const pick = (rng, list) => list[Math.floor(nextRandom(rng) * list.length)];
 const int = (rng, lo, hi) => lo + Math.floor(nextRandom(rng) * (hi - lo + 1));
 function shuffle(rng, list) {
@@ -21,21 +20,22 @@ function shuffle(rng, list) {
   return list;
 }
 
-// A note from 16th s lasting len 16ths (released a hair early, so a rest of exactly a beat still ends
-// a phrase).
-function note(s, len, pitch, strength = 3) {
-  const t = timeOf16th(s);
-  return { t, pitch, strength, len: timeOf16th(s + len) - t - 0.01 };
+// A note from 16th s lasting len 16ths of the beat's clock (released a hair early, so a rest of
+// exactly a beat still ends a phrase).
+function note(clock, s, len, pitch, strength = 3) {
+  const t = clock.timeOf16th(s);
+  return { t, pitch, strength, len: clock.timeOf16th(s + len) - t - 0.01 };
 }
 
-export function randomBot(seed) {
+export function randomBot(seed, beat = LOFI) {
   const rng = createRng(seed * 7919 + 1);
+  const clock = clockOf(beat), total = setBars(beat) * 16;
   const notes = [];
-  for (let beat = 0; beat * 4 < SET_16THS; beat++) {
+  for (let b = 0; b * 4 < total; b++) {
     if (nextRandom(rng) < 0.15) continue; // an occasional rest
     const count = int(rng, 1, 3);
     const slots = shuffle(rng, [0, 1, 2, 3]).slice(0, count).sort((a, b) => a - b);
-    for (const k of slots) notes.push(note(beat * 4 + k, int(rng, 1, 4), 60 + int(rng, 0, 17)));
+    for (const k of slots) notes.push(note(clock, b * 4 + k, int(rng, 1, 4), 60 + int(rng, 0, 17)));
   }
   if (notes.length) notes[0] = { ...notes[0], t: 0 }; // the first note starts the set
   return notes;
@@ -43,8 +43,9 @@ export function randomBot(seed) {
 
 const PENTA = [55, 57, 60, 62, 64, 67, 69, 72, 74, 76, 79, 81]; // C major pentatonic, G3 to A5
 
-export function lickBot(seed) {
+export function lickBot(seed, beat = LOFI) {
   const rng = createRng(seed * 104729 + 2);
+  const clock = clockOf(beat), total = setBars(beat) * 16;
   let i = int(rng, 3, 7);
   const lick = [PENTA[i]];
   for (let k = 0; k < 3; k++) {
@@ -53,7 +54,7 @@ export function lickBot(seed) {
   }
   const notes = [];
   // The lick on 8ths (2 beats), then a beat's rest: every 3 beats.
-  for (let s = 0; s + 8 <= SET_16THS; s += 12) lick.forEach((p, k) => notes.push(note(s + k * 2, 2, p)));
+  for (let s = 0; s + 8 <= total; s += 12) lick.forEach((p, k) => notes.push(note(clock, s + k * 2, 2, p)));
   return notes;
 }
 
@@ -83,12 +84,13 @@ function moved(rng, idea) {
   return d ? idea.pitches.map((p) => p + d) : null;
 }
 
-export function goodSet(seed) {
+export function goodSet(seed, beat = LOFI) {
   const rng = createRng(seed * 15485863 + 3);
+  const clock = clockOf(beat), total = setBars(beat) * 16;
   const notes = [];
   const ideas = [];
   let s = 0, phrase = 0;
-  while (s < SET_16THS - 16) {
+  while (s < total - 16) {
     const bar = Math.floor(s / 16);
     // Choose the opening: bring back an old idea changed, answer the last one, or say something new.
     const old = ideas.findLast((o) => bar - o.bar >= 9 && bar - o.calledBar >= 17);
@@ -115,7 +117,7 @@ export function goodSet(seed) {
     const strength = pick(rng, [2, 3, 3]);
     let at = s;
     pitches.forEach((p, k) => {
-      notes.push(note(at, k < 3 ? gaps[k] : 2, p, strength));
+      notes.push(note(clock, at, k < 3 ? gaps[k] : 2, p, strength));
       if (k < 3) at += gaps[k];
     });
     let deg = SCALE.indexOf(pitches[3]);
@@ -127,32 +129,33 @@ export function goodSet(seed) {
       at += gap;
       deg = Math.max(0, Math.min(SCALE.length - 1, deg + pick(rng, [-2, -1, -1, 1, 1, 2, 3])));
       const last = k === tail - 1;
-      notes.push(note(at, last ? int(rng, 3, 6) : gap, SCALE[deg], strength));
+      notes.push(note(clock, at, last ? int(rng, 3, 6) : gap, SCALE[deg], strength));
     }
     const end = at + 6;
     s = end + int(rng, 5, 10); // a rest of more than a beat after the last note ends
     phrase++;
   }
   if (notes.length) notes[0] = { ...notes[0], t: 0 };
-  return notes.filter((n) => n.t < timeOf16th(SET_16THS));
+  return notes.filter((n) => n.t < clock.timeOf16th(total));
 }
 
 // Phrases of 5 to 9 notes wandering the scale in varied rhythms, a rest after each; no idea returns.
-export function wanderSet(seed) {
+export function wanderSet(seed, beat = LOFI) {
   const rng = createRng(seed * 31 + 5);
+  const clock = clockOf(beat), total = setBars(beat) * 16;
   const notes = [];
   let s = 0;
-  while (s < SET_16THS - 16) {
+  while (s < total - 16) {
     let deg = int(rng, 5, 12);
     const count = int(rng, 5, 9);
     for (let k = 0; k < count; k++) {
       const gap = pick(rng, [1, 2, 2, 3, 4]);
-      notes.push(note(s, gap, SCALE[deg]));
+      notes.push(note(clock, s, gap, SCALE[deg]));
       s += gap;
       deg = Math.max(0, Math.min(SCALE.length - 1, deg + pick(rng, [-2, -1, -1, 1, 1, 2])));
     }
     s += int(rng, 5, 10);
   }
   if (notes.length) notes[0] = { ...notes[0], t: 0 };
-  return notes.filter((n) => n.t < timeOf16th(SET_16THS));
+  return notes.filter((n) => n.t < clock.timeOf16th(total));
 }
````

````diff
diff --git a/open-case/src/shop.js b/open-case/src/shop.js
index 88240cf..e07cd02 100644
--- a/open-case/src/shop.js
+++ b/open-case/src/shop.js
@@ -3,6 +3,7 @@
 // a click lands on. Pure, so it's tested in Node; main.js runs it and render.js draws it.
 import { STOCK, PEDALS, owns } from './gear.js';
 import { createLoop } from './looper.js';
+import { LOFI_CLOCK } from './beats.js';
 
 // The card along the bottom of the shop, and the button on it: [x, y, w, h] in scene pixels.
 export const CARD = [4, 138, 312, 38];
@@ -11,9 +12,10 @@ export const BUTTON = [262, 159, 48, 13];
 // The pedals on the rack come first (the loop pedal last of them), then the instruments on their
 // stands, so the arrow keys move along the rack and then along the floor. soldAt: the page time of
 // the last sale (the shopkeeper nods). loop: while the loop pedal is chosen, the loop you try it with
-// (looper.js), which main.js plays over the band; null otherwise.
-export function createShop() {
-  return { at: 0, soldAt: -Infinity, loop: null };
+// (looper.js), which main.js plays over the band; null otherwise. clock: the timing of the beat the band
+// plays while you try it (beats.js clockOf).
+export function createShop(clock = LOFI_CLOCK) {
+  return { at: 0, soldAt: -Infinity, loop: null, clock };
 }
 
 export const chosen = (shop) => STOCK[shop.at];
@@ -23,7 +25,7 @@ export const chosen = (shop) => STOCK[shop.at];
 export function choose(shop, at) {
   shop.at = at;
   if (chosen(shop).kind !== 'loop') shop.loop = null;
-  else shop.loop ??= createLoop();
+  else shop.loop ??= createLoop(shop.clock);
 }
 
 // The arrow keys: one item left (-1) or right (1), round from the last back to the first.
````

````diff
diff --git a/open-case/src/main.js b/open-case/src/main.js
index 38fa587..3dc65f1 100644
--- a/open-case/src/main.js
+++ b/open-case/src/main.js
@@ -18,7 +18,7 @@
 import { createAudio } from './audio.js';
 import { createInput } from './input.js';
 import { layoutPitches, shopKey } from './keys.js';
-import { createSet, stepSet, playNote, releaseNote, summary, runSet, momentsOf } from './set.js';
+import { createSet, stepSet, playNote, releaseNote, summary, runSet, momentsOf, endTime } from './set.js';
 import { crowdSize, personName } from './crowd.js';
 import { createScene, createFlocks, sceneNote, sceneLoopNote, sceneEvents, stepScene, FLIGHT } from './scene.js';
 import { createRenderer, W, H } from './render.js';
@@ -30,8 +30,8 @@ import { loadArt } from './assets.js';
 import { PEDALS, loadGear, saveGear, earn, buy, play, stomp, stockItem, owns } from './gear.js';
 import { createShop, choose, move, action, trying, hit } from './shop.js';
 import { createLoop, record, note, release, ring, step, undo, due, countBeats } from './looper.js';
-import { BAR } from './groove.js';
-import { DT, LAYERS } from './tuning.js';
+import { LOFI, clockOf } from './beats.js';
+import { DT, LAYERS, PARK } from './tuning.js';
 
 // The module is running, so the page's "couldn't start" message will never be needed.
 document.getElementById('nostart')?.remove();
@@ -79,6 +79,7 @@ function game(art) {
 
   let screen = 'title'; // 'ready' (waiting for your first note), 'playing', 'paused', 'over', 'shop', 'thanks'
   let set = null, scene = createScene(pageSeed), start = 0, seed = 0;
+  let beat = LOFI; // the beat your sets play (beats.js)
   let botMoments = null, botNext = 0, botFed = 0;
   const latency = { reported: null, measured: null };
   // Your savings and gear. With ?coins=N your savings are N, and nothing is kept.
@@ -117,13 +118,13 @@ function game(art) {
   // A new set begins with a note at audio time `at` (your first note, or the bot's start).
   function begin(at) {
     seed = fixedSeed ?? Date.now() % 2147483647;
-    set = createSet(seed);
-    scene = createScene(seed);
+    set = createSet(seed, beat);
+    scene = createScene(seed, { bar: set.clock.bar, parkBar: endTime(set) / PARK.bars });
     start = at;
-    audio.startBand(at);
+    audio.startBand(at, beat);
     for (const { id, min } of LAYERS) audio.setLayer(id, min === 0, at);
     setPedals = new Set(gear.on);
-    loop = createLoop();
+    loop = createLoop(set.clock);
     ring(loop, 0, ringHeld);
     setLayers = 0;
     screen = 'playing';
@@ -163,7 +164,7 @@ function game(art) {
       shopBand = !shopBand;
       if (shopBand) {
         start = audio.now() + 0.1;
-        audio.tryBand(start);
+        audio.tryBand(start, beat);
         ring(shop.loop, 0, ringHeld);
       } else audio.stopBand();
     }
@@ -305,7 +306,7 @@ function game(art) {
 
   function handle(events) {
     for (const e of events) {
-      if (e.type === 'layers') for (const { id } of LAYERS) audio.setLayer(id, e.layers[id], start + e.bar * BAR);
+      if (e.type === 'layers') for (const { id } of LAYERS) audio.setLayer(id, e.layers[id], start + e.bar * set.clock.bar);
       else if (e.type === 'coin') audio.coin(start + set.t + FLIGHT);
       else if (e.type === 'end') {
         audio.endBand(start + set.t);
@@ -323,7 +324,7 @@ function game(art) {
           }
         }
         const crowd = crowdSize(set.crowd);
-        if (crowd > 0) audio.clap(crowd, start + set.t + BAR * 0.5);
+        if (crowd > 0) audio.clap(crowd, start + set.t + set.clock.bar * 0.5);
       } else if (e.type === 'over') showEnd();
     }
     sceneEvents(scene, events, set.t);
@@ -395,7 +396,7 @@ function game(art) {
     audio.stopBand();
     set = null;
     scene = createScene(pageSeed);
-    shop = createShop();
+    shop = createShop(clockOf(beat));
     screen = 'shop';
     sound();
   });
@@ -487,7 +488,7 @@ function game(art) {
       latency.reported = audio.reportedLatency();
       draw({
         screen: screen === 'thanks' || screen === 'over' ? 'playing' : screen,
-        set, scene, keys: input.keys, t: set ? set.t : shop?.loop ? audio.now() - start : 0, bars: set ? set.t / BAR : skyBar,
+        set, scene, keys: input.keys, t: set ? set.t : shop?.loop ? audio.now() - start : 0, bars: set ? set.t / (endTime(set) / PARK.bars) : skyBar,
         time: (now - t0) / 1000, still: reducedMotion.matches, flocks, gear, stomp: stomped, shop,
         loop: shop ? shop.loop : set ? loop : null, loopSaid,
         debug: debug ? latency : null,
````

Then remove the lo-fi's old timing module, which nothing imports now: `git rm open-case/src/groove.js`. Check with `grep -rn groove.js open-case/src open-case/test`, which should print nothing.

- [ ] **Step 4: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 239 tests.

- [ ] **Step 5: Commit**

```bash
git add open-case/src/listen.js open-case/src/looper.js open-case/src/set.js open-case/src/scene.js open-case/src/bots.js open-case/src/shop.js open-case/src/render.js open-case/src/main.js open-case/src/tuning.js open-case/test/set.test.js open-case/test/looper.test.js open-case/test/bots.test.js open-case/test/scene.test.js open-case/test/listen.test.js open-case/test/helpers.js open-case/test/render.test.js open-case/test/audio.test.js
git commit -m "Open Case: every part of the game keeps the time of the set's beat, and a set lasts about 3 minutes at any tempo

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: The new sounds, and hearing every beat

**Files:**
- Modify: `open-case/src/audio.js`, `open-case/src/soundcheck.js`, `open-case/src/main.js`, `open-case/index.html`
- Test: `open-case/test/audio.test.js`, `open-case/test/page.test.js`

**Interfaces:**
- Consumes: `bandAt`, `clockOf`, `readyBeat`, `READY` (Task 1); the set's beat (Task 2).
- Produces:
  - `audio.setBeat(beat)`: the band carries on with another beat, or the same one changed, from the same 16th;
  - `audio.playWritten(layer, notes, s)`: notes just written at the band's 16th s, heard even if that 16th is already scheduled;
  - `audio.bandStart`: the band's first 16th on the audio clock, or -1 with no band;
  - every voice the ready-made beats' sounds name;
  - each band note's `tone`, the beat's Pump, and its Vinyl.
- `main.js`: `?beat=lofi|bossa|funk|reggae|ballad` fixes every set's beat (`fixedBeat`).
- The sound check has a beat menu (`#sound-beat`).

- [ ] **Step 1: Write the failing tests**

````diff
diff --git a/open-case/test/audio.test.js b/open-case/test/audio.test.js
index 12ad439..043c2cb 100644
--- a/open-case/test/audio.test.js
+++ b/open-case/test/audio.test.js
@@ -2,7 +2,7 @@ import { test } from 'node:test';
 import assert from 'node:assert/strict';
 import { createAudio, pluckSamples, softClip, safetyCurve, VOICING } from '../src/audio.js';
 import { fakeAudioContext } from './fake-audio.js';
-import { LOFI_CLOCK } from '../src/beats.js';
+import { LOFI, LOFI_CLOCK, READY, readyBeat, clockOf, bandAt } from '../src/beats.js';
 import { PLAY, GROOVE, LAYERS } from '../src/tuning.js';
 import { PEDALS, INSTRUMENTS } from '../src/gear.js';
 import { createLoop, record, note, release, step, due, loopLength } from '../src/looper.js';
@@ -747,3 +747,163 @@ test('update() forgets a count-in once its clicks are done, so stopLoop no longe
     audio.stopLoop(0);
     assert.ok(clicks.every((s) => !cueGain(s).cut), 'already forgotten by update(), so stopLoop had nothing left to cut');
   }));
+
+// Runs the audio clock on in frames from its time now to `until`, updating the band.
+function runBand(ctx, audio, until) {
+  while (ctx().currentTime < until) {
+    ctx().currentTime += 1 / 60;
+    audio.update();
+  }
+}
+const FUNK = readyBeat('funk'), BOSSA = readyBeat('bossa');
+
+test("the band plays a beat at its own tempo: its notes start on that beat's 16ths", () =>
+  withAudio((ctx) => {
+    const audio = createAudio(memoryStorage());
+    audio.start();
+    audio.startBand(0.5, FUNK);
+    for (const { id } of LAYERS) audio.setLayer(id, true, 0.5);
+    runBand(ctx, audio, 0.5 + 2 * clockOf(FUNK).bar);
+    const clock = clockOf(FUNK), times = new Set();
+    for (let s = 0; s < 40; s++) times.add((0.5 + clock.timeOf16th(s)).toFixed(6)); // scheduled a moment ahead
+    const band = ctx().started.filter((x) => x.t >= 0.5);
+    assert.ok(band.length > 60, `${band.length} sounds`);
+    for (const x of band) assert.ok(times.has(x.t.toFixed(6)), `a sound at ${x.t}, off the funk's 16ths`);
+  }));
+
+test('every ready-made beat plays in its own sounds, into its slots', () => {
+  for (const beat of READY) {
+    withAudio((ctx) => {
+      const audio = createAudio(memoryStorage());
+      audio.start();
+      audio.startBand(0, beat);
+      for (const { id } of LAYERS) audio.setLayer(id, true, 0);
+      const before = ctx().started.length;
+      runBand(ctx, audio, clockOf(beat).bar * 4);
+      assert.ok(ctx().started.length - before > 60, `${beat.id}: ${ctx().started.length - before} sounds`);
+    });
+  }
+  withAudio((ctx) => {
+    const audio = createAudio(memoryStorage());
+    audio.start();
+    audio.startBand(0, FUNK);
+    runBand(ctx, audio, 1);
+    assert.ok(ctx().started.some((x) => x.kind === 'osc' && x.node.type === 'square'), "the funk's clav");
+  });
+  withAudio((ctx) => {
+    const audio = createAudio(memoryStorage());
+    audio.start();
+    audio.startBand(0, BOSSA);
+    runBand(ctx, audio, 1);
+    assert.ok(ctx().buffers.length > 4, "the bossa's nylon strings, plucked");
+  });
+});
+
+test("the delay's echo and the tremolo's pulse take the beat's tempo", () =>
+  withAudio((ctx) => {
+    const audio = createAudio(memoryStorage());
+    audio.start();
+    audio.startBand(1, BOSSA);
+    const beat = clockOf(BOSSA).beat;
+    const nodes = downstream(playOn(ctx, audio, 'acoustic')[0].node);
+    const line = nodes.find((n) => n.kind === 'delay' && n.delayTime.events.length);
+    assert.deepEqual(line.delayTime.events.at(-1), ['set', beat * 0.75, 1]);
+    const waves = ctx().started.filter((x) => x.kind === 'osc' && x.node.type === 'custom');
+    assert.ok(Math.abs(waves.at(-1).node.frequency.value - 2 / beat) < 1e-9);
+  }));
+
+test('with the Pump up, the chords, bass and Pad duck on each kick, but only once the drums are heard', () =>
+  withAudio((ctx) => {
+    const audio = createAudio(memoryStorage());
+    audio.start();
+    const pumped = { ...LOFI, mix: { ...LOFI.mix, pump: 1 } };
+    audio.startBand(0, pumped);
+    const bass = ctx().busGain('bass').from[0]; // the Pump's gain feeding the bass slot
+    runBand(ctx, audio, 1);
+    assert.equal(bass.gain.events.length, 0, 'no drums yet, so no pumping');
+    audio.setLayer('drums', true, 1);
+    runBand(ctx, audio, 5);
+    const kicks = [0, 7, 10].map((s) => 3 + LOFI_CLOCK.timeOf16th(s)); // bar 1's kicks
+    for (const at of kicks) assert.ok(bass.gain.events.some(([how, v, t]) => how === 'set' && Math.abs(v - 0.3) < 1e-9 && Math.abs(t - at) < 1e-9), `ducked at ${at}`);
+  }));
+
+test('with the Vinyl off there is no crackle, no hiss and no tape wobble', () =>
+  withAudio((ctx) => {
+    const audio = createAudio(memoryStorage());
+    audio.start();
+    audio.startBand(0, FUNK);
+    audio.setLayer('top', true, 0);
+    const keys = ctx().busGain('keys');
+    const before = ctx().started.length;
+    runBand(ctx, audio, 2);
+    const noise = ctx().started.slice(before).filter((x) => x.kind === 'buffer' && downstream(x.node)[0]?.type === 'highpass' && downstream(x.node).includes(keys));
+    assert.equal(noise.length, 0, 'no crackle into the keys slot');
+    const hiss = keys.from.find((n) => n.gain && n.gain.events.some(([how, , t]) => how === 'set' && t === 0));
+    assert.equal(hiss.gain.events.at(-1)[1], 0, 'the hiss is silent');
+    const wobble = ctx().started.find((x) => x.kind === 'osc' && x.node.frequency.value === 0.55).node.outs[0];
+    assert.equal(wobble.gain.events.at(-1)[1], 0, 'no wobble, even with the top in');
+  }));
+
+test("a note's tone darkens it below 0.5 and brightens it above; at 0.5 it's the sound itself", () =>
+  withAudio((ctx) => {
+    const audio = createAudio(memoryStorage());
+    audio.start();
+    const beat = (tone) => ({ ...LOFI, bass: [{ s: 0, degree: 0, len: 4, vel: 0.9, tone }], chords: [], drums: [] });
+    const filterOf = (tone) => {
+      audio.startBand(ctx().currentTime + 0.05, beat(tone));
+      audio.setLayer('bass', true, 0);
+      const before = ctx().started.length;
+      runBand(ctx, audio, ctx().currentTime + 0.3);
+      const note = ctx().started.slice(before).find((x) => x.kind === 'osc' && x.node.type === 'triangle');
+      return downstream(note.node).find((n) => n.kind === 'filter') ?? null;
+    };
+    assert.equal(filterOf(0.5).type, 'highpass', 'straight into the slot: the first filter is the band\'s dusty one');
+    const dark = filterOf(0.2);
+    assert.equal(dark.type, 'lowpass');
+    assert.ok(dark.frequency.value < 1000, `${dark.frequency.value}`);
+    const bright = filterOf(0.9);
+    assert.equal(bright.type, 'highshelf');
+    assert.ok(bright.gain.value > 8);
+  }));
+
+test("a note the studio writes on a 16th already scheduled is heard at its time, or at once if that's past", () =>
+  withAudio((ctx) => {
+    const audio = createAudio(memoryStorage());
+    audio.start();
+    const empty = { ...LOFI, drums: [], bass: [], chords: [] };
+    audio.startBand(0, empty);
+    audio.setLayer('bass', true, 0);
+    ctx().currentTime = 1;
+    audio.update(); // scheduled to about 1.2 s
+    const next = [...Array(64).keys()].find((s) => LOFI_CLOCK.timeOf16th(s) >= 1.1);
+    const notes = bandAt({ ...empty, bass: [{ s: next, degree: 0, len: 2, vel: 0.9, tone: 0.5 }] }, 'bass', next);
+    let before = ctx().started.length;
+    audio.playWritten('bass', notes, next);
+    assert.equal(ctx().started.slice(before)[0].t, LOFI_CLOCK.timeOf16th(next), 'on its 16th');
+    before = ctx().started.length;
+    audio.playWritten('bass', notes, next - 2); // a 16th already gone by
+    assert.equal(ctx().started.slice(before)[0].t, 1, 'at once');
+    before = ctx().started.length;
+    audio.playWritten('bass', notes, next + 8); // not scheduled yet: the band will play it
+    assert.equal(ctx().started.length, before);
+  }));
+
+test('changing the beat mid-loop carries on from the same 16th, timing the rest by the new tempo', () =>
+  withAudio((ctx) => {
+    const audio = createAudio(memoryStorage());
+    audio.start();
+    const hatsOnly = { ...LOFI, mix: { ...LOFI.mix, vinyl: false, pad: false }, chords: [], bass: [], drums: LOFI.drums.filter((h) => h.drum === 'hats') };
+    audio.startBand(0, hatsOnly);
+    audio.setLayer('top', true, 0);
+    audio.setLayer('drums', true, 0); // so the stand-in percussion is out
+    runBand(ctx, audio, 1);
+    const start = audio.bandStart;
+    audio.setBeat({ ...hatsOnly, bpm: 100, swing: 0.5 });
+    const before = ctx().started.length;
+    runBand(ctx, audio, 3);
+    const hats = [...new Set(ctx().started.slice(before).filter((x) => x.kind === 'buffer').map((x) => x.t.toFixed(6)))].map(Number).sort((a, b) => a - b);
+    const gaps = hats.slice(1).map((t, i) => t - hats[i]);
+    const eighth = 60 / 100 / 2;
+    assert.ok(gaps.slice(1).every((g) => Math.abs(g - eighth / 2) < 1e-6 || Math.abs(g - eighth) < 1e-6), `${gaps}`);
+    assert.ok(hats[0] > 1 && audio.bandStart !== start, 'nothing already scheduled moves; the band just carries on');
+  }));
````

````diff
diff --git a/open-case/test/page.test.js b/open-case/test/page.test.js
index 4106590..43b130f 100644
--- a/open-case/test/page.test.js
+++ b/open-case/test/page.test.js
@@ -21,3 +21,7 @@ test('the page loads the game as a module, with its icon and the Silkscreen font
   assert.match(html, /<link rel="icon" href="icon\.png">/);
   assert.match(html, /family=Silkscreen/);
 });
+
+test('the sound check has a choice of beats', () => {
+  assert.match(html, /<label>Beat <select id="sound-beat"><\/select><\/label>/);
+});
````

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL, 8 of 248:
- "the band plays a beat at its own tempo: its notes start on that beat's 16ths";
- "every ready-made beat plays in its own sounds, into its slots";
- "with the Pump up, the chords, bass and Pad duck on each kick, but only once the drums are heard";
- "with the Vinyl off there is no crackle, no hiss and no tape wobble";
- "a note's tone darkens it below 0.5 and brightens it above; at 0.5 it's the sound itself";
- "a note the studio writes on a 16th already scheduled is heard at its time, or at once if that's past";
- "changing the beat mid-loop carries on from the same 16th, timing the rest by the new tempo";
- "the sound check has a choice of beats".

- [ ] **Step 3: The voices, the tone, the Pump, the Vinyl, setBeat and playWritten**

````diff
diff --git a/open-case/src/audio.js b/open-case/src/audio.js
index c5109f8..bdc8b97 100644
--- a/open-case/src/audio.js
+++ b/open-case/src/audio.js
@@ -5,13 +5,17 @@
 //   - Your pedals, between your instrument and the speakers, chained in the usual order: overdrive,
 //     chorus, tremolo, delay, reverb. A stomp fades a pedal in or out over a few milliseconds.
 //   - The band: the beat it's given (beats.js), its chords, drums, bass, hats and Pad, scheduled a
-//     little ahead of the audio clock, as Last Light's score is, at the beat's tempo. Each layer plays
-//     into its own bus (its slot): switching a layer is a fade on that bus at a bar line.
+//     little ahead of the audio clock, as Last Light's score is, at the beat's tempo, in the sounds
+//     the beat chose. Each layer plays into its own bus (its slot): switching a layer is a fade on that
+//     bus at a bar line. With the beat's Pump up, the chords, bass and Pad duck on every kick.
+//   - A note the studio has just written is heard at once (playWritten), even if the band had already
+//     scheduled its 16th.
 //   - Your loop (looper.js): its notes are scheduled a moment ahead with the band's, each a voice of
 //     its own through your instrument and pedals, and they fade and stop with the band.
 //   - Its count-in (countIn): a soft stick click on each beat after R, up to the bar line, so you can
 //     hear when the recording is about to start; never through your pedals, never recorded.
-//   - Vinyl crackle, a dusty filter over the band, the tape wobble, coins landing and applause.
+//   - A dusty filter over the band; the Vinyl (crackle, hiss and tape wobble) when the beat has it on;
+//     coins landing and applause.
 //   - A safety before the speakers, so a loop stacked on your playing can't clip.
 // Browsers only allow sound after a key press or click, so start() is called from inside one
 // (main.js). M mutes; the volume and mute are remembered.
@@ -97,6 +101,14 @@ const CHORUS_MIX = 0.6; // the copy's level; your own sound drops to CHORUS_DRY
 const CHORUS_DRY = 0.8;
 const TREMOLO_DEPTH = 0.35; // the volume swings this share either way, on the 8th notes
 const DELAY_BEATS = 0.75; // the echo's time, in beats of the band's beat: a dotted 8th
+const PUMP_DEPTH = 0.7; // at full Pump, the chords, bass and Pad drop to 30% on a kick...
+const PUMP_BACK = 0.25; // ...and come back with this time constant, in beats
+const HISS_LEVEL = 0.02; // the Vinyl's quiet hiss under its crackle
+// A band note's tone: below 0.5, a lowpass closing from TONE_DARK_HZ x 32 (0.5) to TONE_DARK_HZ (0);
+// above it, a shelf lifting the highs from TONE_SHELF_HZ by up to TONE_LIFT_DB (1).
+const TONE_DARK_HZ = 200;
+const TONE_SHELF_HZ = 2000;
+const TONE_LIFT_DB = 12;
 const DELAY_FEEDBACK = 0.38; // each echo is this loud next to the one before...
 const DELAY_MIX = 0.45; // ...and the first this loud next to your note
 const DELAY_TONE = 2800; // Hz: each echo a little darker
@@ -179,6 +191,7 @@ export function softClip(k = OD_CURVE, n = 1025) {
 export function createAudio(storage) {
   let ctx = null, master = null, band = null, noise = null, wobble = null;
   const bus = {}; // a gain per layer: the layer slots
+  const pump = {}; // the ducking gains the chords, bass and Pad play through, into their slots
   const inputs = {}; // a gain per instrument, into its tone filters and on into the pedals
   const loopIns = {}; // a gain per instrument for your loop's notes, into its input: the loop's fade
   const pedals = {}; // id -> { input, output, set(on, at) }
@@ -197,7 +210,9 @@ export function createAudio(storage) {
   let muted = storage.get(MUTE_KEY) === '1';
   let volume = Number(storage.get(VOLUME_KEY) ?? 0.8);
   if (!(volume >= 0 && volume <= 1)) volume = 0.8;
-  let loopAt = -1, next16 = 0, stopAt = Infinity, crackleAt = 0;
+  let loopAt = -1, next16 = 0, stopAt = Infinity, crackleAt = 0, hiss = null;
+  const layerOn = {}; // whether each layer slot is on (the Pump follows the kick only while you can hear it)
+  const bandPlucks = new Map(); // `${voice}:${note}` -> AudioBuffer: the band's plucked strings
   let loopDone = 0; // your loop's notes are scheduled up to this band time
   const level = () => (muted ? 0 : volume);
 
@@ -223,6 +238,7 @@ export function createAudio(storage) {
     for (const { id, min } of LAYERS) {
       bus[id] = ctx.createGain();
       bus[id].gain.value = min === 0 ? 1 : 0;
+      layerOn[id] = min === 0;
       bus[id].connect(band);
     }
     // The stand-in percussion's own bus: not a crowd layer (never in LAYERS), gated the opposite of
@@ -230,6 +246,11 @@ export function createAudio(storage) {
     bus.perc = ctx.createGain();
     bus.perc.gain.value = 1;
     bus.perc.connect(band);
+    // The Pump's gains: the chords and the bass into their slots, the Pad into the top's.
+    for (const [id, into] of [['keys', 'keys'], ['bass', 'bass'], ['pad', 'top']]) {
+      pump[id] = ctx.createGain();
+      pump[id].connect(bus[into]);
+    }
     noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
     const d = noise.getChannelData(0);
     for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
@@ -275,15 +296,16 @@ export function createAudio(storage) {
     lfo.connect(wobble);
     lfo.start();
     // A quiet hiss under the crackle, part of the keys layer.
-    const hiss = ctx.createBufferSource(), hf = ctx.createBiquadFilter(), hg = ctx.createGain();
-    hiss.buffer = noise;
-    hiss.loop = true;
+    const hs = ctx.createBufferSource(), hf = ctx.createBiquadFilter();
+    hiss = ctx.createGain();
+    hs.buffer = noise;
+    hs.loop = true;
     hf.type = 'bandpass';
     hf.frequency.value = 4000;
     hf.Q.value = 0.5;
-    hg.gain.value = 0.02;
-    hiss.connect(hf).connect(hg).connect(bus.keys);
-    hiss.start();
+    hiss.gain.value = beat.mix.vinyl ? HISS_LEVEL : 0;
+    hs.connect(hf).connect(hiss).connect(bus.keys);
+    hs.start();
   }
 
   const now = () => (ctx ? ctx.currentTime : 0);
@@ -590,9 +612,47 @@ export function createAudio(storage) {
     src.start(t, Math.random() * 1.5, len + 0.05);
   }
 
-  // One band note into its layer's bus. len is in seconds.
+  // A band note's way into its slot, through its tone: below 0.5 a lowpass closing towards its pitch
+  // (darker), above it a shelf lifting its highs (brighter); at 0.5 (or with none) the sound itself.
+  function toned(out, tone) {
+    if (tone === undefined || tone === 0.5) return out;
+    const fl = ctx.createBiquadFilter();
+    if (tone < 0.5) {
+      fl.type = 'lowpass';
+      fl.frequency.value = TONE_DARK_HZ * Math.pow(2, tone * 10);
+    } else {
+      fl.type = 'highshelf';
+      fl.frequency.value = TONE_SHELF_HZ;
+      fl.gain.value = (tone - 0.5) * 2 * TONE_LIFT_DB;
+    }
+    fl.connect(out);
+    return fl;
+  }
+
+  // A plucked string of the band's (the nylon guitar, the plucked bass): its samples worked out the
+  // first time its note is played and kept, then damped len seconds after it starts.
+  function bandString(out, t, len, n, { ring, bright, pick }, level) {
+    const key = `${n.voice}:${n.note}`;
+    let buf = bandPlucks.get(key);
+    if (!buf) {
+      const data = pluckSamples(ctx.sampleRate, midiToHz(n.note), 1, { ring, bright: [bright], pick });
+      buf = ctx.createBuffer(1, data.length, ctx.sampleRate);
+      buf.getChannelData(0).set(data);
+      bandPlucks.set(key, buf);
+    }
+    const src = ctx.createBufferSource(), g = ctx.createGain();
+    src.buffer = buf;
+    g.gain.setValueAtTime(n.vel * level, t);
+    g.gain.setTargetAtTime(0, t + len, 0.03);
+    src.connect(g).connect(out);
+    src.start(t);
+    src.stop(t + len + 0.2);
+  }
+
+  // One band note into its layer's bus (the chords, the bass and the Pad through their Pump). len is in
+  // seconds.
   function playBand(layer, n, t, len) {
-    const out = bus[layer], f = midiToHz(n.note);
+    const out = toned(n.voice === 'pad' ? pump.pad : pump[layer] ?? bus[layer], n.tone), f = midiToHz(n.note);
     switch (n.voice) {
       case 'ep': {
         // A soft electric piano: a sine with a sine modulating it, the tine's bite dying away.
@@ -634,6 +694,82 @@ export function createAudio(storage) {
       case 'tap': // a soft low thud on the downbeat, its pitch dropping quickly, quiet
         tone(out, t, { len: 0.1, freq: PERC_TAP_HZ, to: PERC_TAP_DROP_HZ, vol: n.vel * PERC_TAP_LEVEL });
         break;
+      // The brushes kit.
+      case 'softKick': // a round, quiet thump
+        tone(out, t, { len: 0.3, freq: 90, to: 45, vol: n.vel });
+        break;
+      case 'brush': // a swish of wire brushes: noise that swells a little, then fades
+        burst(out, t, { len: 0.28, freq: 3200, q: 0.5, vol: n.vel * 0.7, attack: 0.03 });
+        break;
+      case 'rim': // a rim click: a short wooden knock
+        tone(out, t, { len: 0.05, type: 'triangle', freq: 1650, vol: n.vel * 0.45, attack: 0.001 });
+        burst(out, t, { len: 0.02, freq: 3000, q: 3, vol: n.vel * 0.3 });
+        break;
+      // The funk kit.
+      case 'tightKick': // short and punchy, with a click on top
+        tone(out, t, { len: 0.2, freq: 150, to: 48, vol: n.vel });
+        burst(out, t, { len: 0.012, type: 'highpass', freq: 3500, vol: n.vel * 0.15 });
+        break;
+      case 'crack': // a bright, tight snare
+        burst(out, t, { len: 0.13, freq: 2600, q: 0.9, vol: n.vel * 0.7 });
+        tone(out, t, { len: 0.06, type: 'triangle', freq: 240, vol: n.vel * 0.3 });
+        break;
+      case 'openHat': // an open hat, ringing a little
+        burst(out, t, { len: 0.32, type: 'highpass', freq: 7500, vol: n.vel * 0.28 });
+        break;
+      // The reggae kit.
+      case 'deepKick': // deep and long
+        tone(out, t, { len: 0.55, freq: 85, to: 38, vol: n.vel });
+        break;
+      case 'rimshot': // a cross-stick: a hollow knock
+        tone(out, t, { len: 0.06, type: 'triangle', freq: 820, vol: n.vel * 0.4, attack: 0.001 });
+        burst(out, t, { len: 0.035, freq: 2000, q: 2, vol: n.vel * 0.3 });
+        break;
+      // The basses (the round bass is 'bass', above).
+      case 'pluck': // a plucked bass string
+        bandString(out, t, len, n, { ring: 1.2, bright: 0.45, pick: 0.25 }, 1);
+        break;
+      case 'deep': // a deep, round sine
+        tone(out, t, { len, freq: f, vol: n.vel * 0.4, attack: 0.02 });
+        break;
+      // The chord sounds (the electric piano is 'ep', above).
+      case 'nylon': // a nylon-strung guitar, plucked softly
+        bandString(out, t, len, n, { ring: 1.4, bright: 0.3, pick: 0.18 }, 0.4);
+        break;
+      case 'clav': { // a clavinet-like stab: a bright pulse whose filter snaps shut
+        const o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
+        const end = t + Math.max(0.08, Math.min(len, 0.3));
+        o.type = 'square';
+        o.frequency.value = f;
+        fl.type = 'lowpass';
+        fl.Q.value = 4;
+        fl.frequency.setValueAtTime(f * 10, t);
+        fl.frequency.exponentialRampToValueAtTime(f * 2, t + 0.12);
+        g.gain.setValueAtTime(n.vel * 0.09, t);
+        g.gain.exponentialRampToValueAtTime(0.001, end);
+        o.connect(fl).connect(g).connect(out);
+        o.start(t);
+        o.stop(end + 0.05);
+        break;
+      }
+      case 'organ': // a drawbar organ: the note, its octave and its twelfth, as sines
+        for (const [k, v] of [[1, 0.1], [2, 0.065], [3, 0.04]]) tone(out, t, { len: Math.max(len, 0.12), freq: f * k, vol: n.vel * v, attack: 0.008 });
+        break;
+      case 'piano': // a soft piano: a sine and a quieter octave over it, dying away
+        tone(out, t, { len: Math.min(len + 0.8, 3), freq: f, vol: n.vel * 0.1, attack: 0.002 });
+        tone(out, t, { len: Math.min(len, 1.5), type: 'triangle', freq: f * 2, vol: n.vel * 0.025, attack: 0.002 });
+        break;
+    }
+  }
+
+  // The Pump: on a kick at `at`, the chords, the bass and the Pad drop by the beat's Pump and come
+  // back over about an 8th note.
+  function duck(at) {
+    const depth = beat.mix.pump * PUMP_DEPTH;
+    if (!depth) return;
+    for (const g of Object.values(pump)) {
+      g.gain.setValueAtTime(1 - depth, at);
+      g.gain.setTargetAtTime(1, at + 0.01, clock.beat * PUMP_BACK);
     }
   }
 
@@ -644,6 +780,7 @@ export function createAudio(storage) {
     beat = b;
     clock = clockOf(b);
     delayLine.delayTime.setValueAtTime(clock.beat * DELAY_BEATS, at);
+    hiss.gain.setValueAtTime(b.mix.vinyl ? HISS_LEVEL : 0, at);
     loopAt = at;
     next16 = 0;
     stopAt = Infinity;
@@ -655,6 +792,32 @@ export function createAudio(storage) {
     }
   }
 
+  // The band carries on with `b` in place of the beat it was playing (the studio's changes), from the
+  // same 16th: at a new tempo, the 16ths still to come are timed by it, so nothing jumps or repeats.
+  function setBeat(b) {
+    if (!ctx) return;
+    const next = clockOf(b);
+    const retimed = b.bpm !== beat.bpm || b.swing !== beat.swing;
+    if (loopAt >= 0 && retimed) loopAt += clock.timeOf16th(next16) - next.timeOf16th(next16);
+    beat = b;
+    clock = next;
+    if (retimed) {
+      delayLine.delayTime.setValueAtTime(clock.beat * DELAY_BEATS, ctx.currentTime);
+      newTremoloWave(ctx.currentTime);
+    }
+    hiss.gain.setTargetAtTime(b.mix.vinyl ? HISS_LEVEL : 0, ctx.currentTime, 0.05);
+    wobble.gain.setTargetAtTime(layerOn.top && b.mix.vinyl ? 9 : 0, ctx.currentTime, 0.5);
+  }
+
+  // Notes the studio has just written at 16th s (band time: 16ths since the band's first), heard even
+  // when the band has already scheduled that 16th: at its time, or at once if that's already past. A
+  // 16th not yet scheduled is left to the band, which will play what's written there.
+  function playWritten(layer, notes, s) {
+    if (!ctx || loopAt < 0 || s >= next16) return;
+    const at = Math.max(ctx.currentTime, loopAt + clock.timeOf16th(s));
+    for (const n of notes) playBand(layer, n, at, loopAt + clock.timeOf16th(s + n.len) - at);
+  }
+
   // The band in the shop, while you try the loop pedal: the chords of `b` alone (the keys layer, with
   // no stand-in percussion), softly, from `at`.
   function tryBand(at, b = LOFI) {
@@ -737,8 +900,9 @@ export function createAudio(storage) {
   // A layer slot switched on or off, at a bar line (or at once, from the sound check).
   function setLayer(id, on, at = now()) {
     if (!ctx) return;
+    layerOn[id] = on;
     bus[id].gain.setTargetAtTime(on ? 1 : 0, Math.max(at, ctx.currentTime), 0.02);
-    if (id === 'top') wobble.gain.setTargetAtTime(on ? 9 : 0, Math.max(at, ctx.currentTime), 0.5);
+    if (id === 'top') wobble.gain.setTargetAtTime(on && beat.mix.vinyl ? 9 : 0, Math.max(at, ctx.currentTime), 0.5);
     // The stand-in percussion fills in for the drums, so it fades the opposite way, at the same moment.
     if (id === 'drums') bus.perc.gain.setTargetAtTime(on ? 0 : 1, Math.max(at, ctx.currentTime), 0.02);
   }
@@ -756,11 +920,14 @@ export function createAudio(storage) {
     while (at16(next16) < t + GROOVE.ahead && at16(next16) < stopAt) {
       const at = at16(next16);
       for (const { id } of [...LAYERS, { id: 'perc' }]) {
-        for (const n of bandAt(beat, id, next16)) playBand(id, n, at, at16(next16 + n.len) - at);
+        for (const n of bandAt(beat, id, next16)) {
+          playBand(id, n, at, at16(next16 + n.len) - at);
+          if (n.drum === 'kick' && layerOn.drums) duck(at);
+        }
       }
       next16++;
     }
-    if (t >= crackleAt && t < stopAt) {
+    if (beat.mix.vinyl && t >= crackleAt && t < stopAt) {
       crackleAt = t + 0.03 + Math.random() * 0.25;
       burst(bus.keys, t, { len: 0.004 + Math.random() * 0.01, type: 'highpass', freq: 2000 + Math.random() * 4000, vol: 0.05 + Math.random() * 0.12 });
     }
@@ -807,8 +974,12 @@ export function createAudio(storage) {
   }
 
   return {
-    start, now, warm, noteOn, noteOff, setRing, setInstrument, setPedal, startBand, tryBand, endBand, stopBand, stopLoop,
-    countIn, setLayer, update, coin, clap, reportedLatency, heardAt,
+    start, now, warm, noteOn, noteOff, setRing, setInstrument, setPedal, startBand, setBeat, playWritten, tryBand, endBand, stopBand,
+    stopLoop, countIn, setLayer, update, coin, clap, reportedLatency, heardAt,
+    // the band's first 16th on the audio clock (-1 with no band): band time counts from it
+    get bandStart() {
+      return loopAt;
+    },
     get started() {
       return !!ctx;
     },
````

- [ ] **Step 4: `?beat=` and the sound check's beats**

````diff
diff --git a/open-case/src/main.js b/open-case/src/main.js
index 3dc65f1..7bc3e44 100644
--- a/open-case/src/main.js
+++ b/open-case/src/main.js
@@ -13,8 +13,9 @@
 // URL options: ?sound (the sound check); ?debug (interest bars, the corner panel, and Run the bots on
 // the end card); ?seed=N (fixes the passers-by, and the park's windows, train and birds); ?bot=random or
 // ?bot=lick (the bot plays the set, audibly); ?sky=N (the park as it is N bars into a set, until a set
-// starts); ?coins=N (your savings are N on this page, and nothing bought on it is kept). With any of
-// them, window.__openCase exposes the game for browser checks.
+// starts); ?coins=N (your savings are N on this page, and nothing bought on it is kept); ?beat=lofi,
+// bossa, funk, reggae or ballad (every set plays that ready-made beat). With any of them,
+// window.__openCase exposes the game for browser checks.
 import { createAudio } from './audio.js';
 import { createInput } from './input.js';
 import { layoutPitches, shopKey } from './keys.js';
@@ -30,7 +31,7 @@ import { loadArt } from './assets.js';
 import { PEDALS, loadGear, saveGear, earn, buy, play, stomp, stockItem, owns } from './gear.js';
 import { createShop, choose, move, action, trying, hit } from './shop.js';
 import { createLoop, record, note, release, ring, step, undo, due, countBeats } from './looper.js';
-import { LOFI, clockOf } from './beats.js';
+import { LOFI, clockOf, readyBeat } from './beats.js';
 import { DT, LAYERS, PARK } from './tuning.js';
 
 // The module is running, so the page's "couldn't start" message will never be needed.
@@ -46,7 +47,8 @@ const bot = { random: randomBot, lick: lickBot }[params.get('bot')] ?? null;
 const fixedSeed = params.has('seed') ? Number.parseInt(params.get('seed'), 10) || 1 : null;
 const skyBar = params.has('sky') ? Math.max(0, Number.parseFloat(params.get('sky')) || 0) : 0;
 const debugSavings = params.has('coins') ? Math.max(0, Number.parseInt(params.get('coins'), 10) || 0) : null;
-const anyDebug = debug || !!bot || fixedSeed !== null || params.has('sound') || params.has('sky') || debugSavings !== null;
+const fixedBeat = readyBeat(params.get('beat'));
+const anyDebug = debug || !!bot || fixedSeed !== null || params.has('sound') || params.has('sky') || debugSavings !== null || !!fixedBeat;
 
 const storage = safeStorage();
 const audio = createAudio(storage);
@@ -79,7 +81,7 @@ function game(art) {
 
   let screen = 'title'; // 'ready' (waiting for your first note), 'playing', 'paused', 'over', 'shop', 'thanks'
   let set = null, scene = createScene(pageSeed), start = 0, seed = 0;
-  let beat = LOFI; // the beat your sets play (beats.js)
+  let beat = fixedBeat ?? LOFI; // the beat your sets play (beats.js)
   let botMoments = null, botNext = 0, botFed = 0;
   const latency = { reported: null, measured: null };
   // Your savings and gear. With ?coins=N your savings are N, and nothing is kept.
````

````diff
diff --git a/open-case/src/soundcheck.js b/open-case/src/soundcheck.js
index 38ebbba..36a13a3 100644
--- a/open-case/src/soundcheck.js
+++ b/open-case/src/soundcheck.js
@@ -1,5 +1,6 @@
-// The sound check (/open-case/?sound): the band with a switch per layer, and your instrument on the
-// keys, so the sounds and the beat can be judged by ear before anything else. Every instrument and
+// The sound check (/open-case/?sound): the band with a switch per layer and a choice of the ready-made
+// beats, and your instrument on the keys, so the sounds and the beats can be judged by ear before
+// anything else. Every instrument and
 // pedal in the shop can be tried here, without buying it (keys 2 to 6 stomp the pedals too), and the
 // loop pedal (R records, Backspace undoes). No crowd, no set: the band plays until you leave.
 import { createInput } from './input.js';
@@ -7,6 +8,7 @@ import { layoutPitches } from './keys.js';
 import { STOCK } from './gear.js';
 import { createLoop, record, note, release, ring, step, undo, due, loopState, countBeats } from './looper.js';
 import { LOOP } from './tuning.js';
+import { READY, clockOf, readyBeat } from './beats.js';
 
 // Browsers don't treat these as user activation (Chrome doesn't for a lone modifier, no browser does
 // for Esc), so starting an AudioContext from one leaves it suspended.
@@ -19,20 +21,33 @@ export function soundCheck(audio, { debug }) {
   document.getElementById('game').hidden = true;
   const boxes = [...panel.querySelectorAll('input[data-layer]')];
   let started = false, measured = null;
-  const loop = createLoop();
+  const beats = document.getElementById('sound-beat');
+  for (const b of READY) beats.add(new Option(b.name, b.id));
+  let beat = READY[0], loop = createLoop(clockOf(beat));
   let bandAt = 0; // the band's first 16th, on the audio clock: the loop's times count from it
   const bandTime = () => audio.now() - bandAt;
 
+  // The band starts (or starts again, with another beat) a moment from now, with an empty loop.
+  const playBand = () => {
+    audio.stopLoop();
+    loop = createLoop(clockOf(beat));
+    bandAt = audio.now() + 0.1;
+    audio.startBand(bandAt, beat);
+    for (const box of boxes) audio.setLayer(box.dataset.layer, box.checked);
+  };
   const begin = () => {
     if (started) return;
     started = true;
     audio.start();
     warm();
-    bandAt = audio.now() + 0.1;
-    audio.startBand(bandAt);
-    for (const box of boxes) audio.setLayer(box.dataset.layer, box.checked);
+    playBand();
     document.getElementById('sound-start').hidden = true;
   };
+  beats.addEventListener('change', () => {
+    beat = readyBeat(beats.value);
+    if (started) playBand();
+    beats.blur(); // so the arrow keys and letters play, not change the choice
+  });
   for (const box of boxes) box.addEventListener('change', () => started && audio.setLayer(box.dataset.layer, box.checked));
   // The shop's instruments and pedals, from its stock.
   const choice = document.getElementById('sound-instrument'), pedals = document.getElementById('sound-pedals');
@@ -95,7 +110,7 @@ export function soundCheck(audio, { debug }) {
       audio.setPedal(id, box.checked);
     },
   });
-  if (debug) window.__openCase = { audio, input, loop, get measured() { return measured; } };
+  if (debug) window.__openCase = { audio, input, get loop() { return loop; }, get measured() { return measured; } };
 
   const frame = () => {
     if (started) step(loop, bandTime());
````

````diff
diff --git a/open-case/index.html b/open-case/index.html
index 0c65177..2cab1a7 100644
--- a/open-case/index.html
+++ b/open-case/index.html
@@ -56,12 +56,13 @@
     <h2>Sound check</h2>
     <p id="sound-start">Press any key or click here to start the loop.</p>
     <p>Play on the keys: A to ' and W E T Y U O P. Z X octave, C V softer or louder, Space lets notes ring, 1 scale lock, 2 to 6 pedals, R loop, Backspace undo, M mute.</p>
+    <label>Beat <select id="sound-beat"></select></label>
     <label>Instrument <select id="sound-instrument"></select></label>
     <div class="row" id="sound-pedals"></div>
-    <label><input type="checkbox" data-layer="keys" checked> Keys and crackle</label>
-    <label><input type="checkbox" data-layer="drums" checked> Kick and snare</label>
+    <label><input type="checkbox" data-layer="keys" checked> Chords (and the vinyl's crackle)</label>
+    <label><input type="checkbox" data-layer="drums" checked> Kick, snare and percussion</label>
     <label><input type="checkbox" data-layer="bass" checked> Bass</label>
-    <label><input type="checkbox" data-layer="top" checked> Hats, pad and tape wobble</label>
+    <label><input type="checkbox" data-layer="top" checked> Hats (and the pad and tape wobble)</label>
     <p id="latency"></p>
   </section>
   <p class="note" id="thanks" hidden>Thanks for playing.<br><a href="../">Back to the games</a></p>
````

- [ ] **Step 5: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 248 tests.

- [ ] **Step 6: Commit**

```bash
git add open-case/src/audio.js open-case/src/soundcheck.js open-case/src/main.js open-case/index.html open-case/test/audio.test.js open-case/test/page.test.js
git commit -m "Open Case: the band learns the new styles' sounds, the Pump and the Vinyl, and ?beat= and the sound check play every beat

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: The studio's workings

**Files:**
- Create: `open-case/src/rhythms.js`, `open-case/src/studio.js`
- Modify: `open-case/src/beats.js`, `open-case/src/tuning.js`
- Test: create `open-case/test/studio.test.js`

**Interfaces:**
- Consumes: `beats.js` (Task 1).
- Produces:
  - `rhythms.js`: `RHYTHMS` (`{ drums, bass, chords }`, 16 rhythms each, a rhythm being `[[16th in the bar, length in 16ths], …]`) and `hitAt(rhythm, r)`.
  - `beats.js`: `cloneBeat(beat)`, `blankBeat(name)` and `cleanBeat(raw)` (a beat or null).
  - `tuning.js`: `STUDIO` (`slots`, `undo`, `grace`, `ahead`, `vel`, `softest`).
  - `studio.js`:
    - your beats in storage: `loadBeats(storage) -> { slots, chosen }`, `saveBeats(storage, beats)`, `chosenBeat(beats)`;
    - `createStudio(beats)`, whose state is `{ beats, open, beat, version, tab, rhythm, range, held, erase, undo, asking, list }`;
    - `openBeat`, `newBeat`, `replaceSlot`, `cancelAsk`, `buskTo`, `isChosen`;
    - `setTab`, `nextTab`, `turnRhythm`, `rhythmOf`, `moveRange`, `nextSound`;
    - the settings: `setTempo`, `setSwing`, `setMood` and `setLength`, each `(studio, value, again)`;
    - the mix: `setLevel(studio, part, value, again)`, `toggleMute`, `setPump(studio, value, again)`, `togglePad`, `toggleVinyl`;
    - `clearPart`, `undoChange`;
    - holding the pad: `press(studio, t, at)`, `moveTo`, `letGo`, `setErase`, and `advance(studio, t) -> [{ layer, notes, s }]`;
    - `PARTS`, `TABS`, `DRUMS`, `COLUMNS`, `LENGTHS`.

- [ ] **Step 1: Write the failing tests**

Create `open-case/test/studio.test.js`:

````js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createStudio, loadBeats, saveBeats, chosenBeat, openBeat, newBeat, replaceSlot, cancelAsk, buskTo, isChosen, setTab, nextTab,
  turnRhythm, rhythmOf, moveRange, nextSound, setTempo, setSwing, setMood, setLength, setLevel, toggleMute, setPump, togglePad,
  toggleVinyl, clearPart, undoChange, press, moveTo, letGo, setErase, advance, DRUMS,
} from '../src/studio.js';
import { LOFI, readyBeat, clockOf, blankBeat, keyNote, BASS_C } from '../src/beats.js';
import { RHYTHMS } from '../src/rhythms.js';
import { STUDIO } from '../src/tuning.js';

function memoryStorage() {
  const m = new Map();
  return { get: (k) => (m.has(k) ? m.get(k) : null), set: (k, v) => m.set(k, String(v)), m };
}
const empty = () => ({ slots: Array(STUDIO.slots).fill(null), chosen: null });
// A studio with a blank beat of yours open (90 bpm, straight: a 16th is exactly 1/6 s).
function blank() {
  const studio = createStudio(empty());
  newBeat(studio);
  return studio;
}
const at16 = (studio, s) => clockOf(studio.beat).timeOf16th(s);
// Holds from 16th `from` to just before 16th `to`, frame by frame, gathering what was written.
function hold(studio, where, from, to) {
  assert.ok(press(studio, at16(studio, from), where));
  const out = [];
  for (let t = at16(studio, from); t < at16(studio, to) - STUDIO.ahead - 1e-9; t += 1 / 60) out.push(...advance(studio, t));
  letGo(studio);
  return out;
}
const rhythm = (part, name) => RHYTHMS[part].findIndex((r) => JSON.stringify(r) === JSON.stringify(name));

test('the studio opens the beat your sets play: the lo-fi at first, as it is', () => {
  const studio = createStudio(empty());
  assert.equal(studio.beat, LOFI, 'the ready-made beat itself, until it changes');
  assert.deepEqual(studio.open, { ready: 'lofi' });
  assert.equal(chosenBeat(studio.beats), LOFI);
  assert.equal(studio.tab, 'drums');
});

test("holding the drum pad writes the rhythm into that strip as the playhead passes, and only there", () => {
  const studio = blank();
  studio.beat.drums.push({ s: 4, drum: 'kick', vel: 1 });
  studio.rhythm.drums = rhythm('drums', [[0, 1], [4, 1], [8, 1], [12, 1]]);
  const written = hold(studio, { row: DRUMS.indexOf('snare'), x: 1 }, 0, 16);
  assert.deepEqual(studio.beat.drums.filter((h) => h.drum === 'snare').map((h) => [h.s, h.vel]), [[0, 1], [4, 1], [8, 1], [12, 1]]);
  assert.deepEqual(studio.beat.drums.filter((h) => h.drum === 'kick').map((h) => h.s), [4], "the kick at the same 16th stays: it's another strip");
  assert.deepEqual(written.map((w) => [w.layer, w.s]), [['drums', 0], ['drums', 4], ['drums', 8], ['drums', 12]], 'for the sound, as the band would play them');
  hold(studio, { row: 1, x: 0 }, 16, 32);
  assert.ok(studio.beat.drums.filter((h) => h.drum === 'snare').every((h) => h.s >= 16 || h.vel === 1), 'bar 1 untouched');
  assert.equal(studio.beat.drums.find((h) => h.drum === 'snare' && h.s === 16).vel, STUDIO.softest, 'the left of the pad is softest');
});

test("painting over replaces what was there: the part's notes on every 16th passed, hits or not", () => {
  const studio = blank();
  studio.rhythm.drums = rhythm('drums', [[0, 1], [4, 1], [8, 1], [12, 1]]);
  hold(studio, { row: 0, x: 1 }, 0, 16);
  studio.rhythm.drums = rhythm('drums', [[0, 1]]);
  hold(studio, { row: 0, x: 1 }, 0, 10);
  assert.deepEqual(studio.beat.drums.map((h) => h.s), [0, 12], 'the kicks on 4 and 8 painted over; the one on 12 was never reached');
});

test('the bass and chords write the note or chord under your finger, at its tone; one at a time', () => {
  const studio = blank();
  setTab(studio, 'bass');
  studio.rhythm.bass = rhythm('bass', [[0, 8], [8, 8]]);
  const [first] = hold(studio, { col: 2, y: 0.25 }, 0, 16);
  assert.deepEqual(studio.beat.bass.map(({ s, degree, len, tone }) => [s, degree, len, tone]), [[0, 2, 8, 0.25], [8, 2, 8, 0.25]]);
  assert.equal(first.notes[0].note, keyNote('A', 2, BASS_C), "C, the third of A minor's scale");
  moveRange(studio, 1);
  studio.rhythm.bass = rhythm('bass', [[12, 4]]);
  hold(studio, { col: 0, y: 0.5 }, 12, 16);
  assert.deepEqual(studio.beat.bass.map(({ s, degree, len }) => [s, degree, len]), [[0, 2, 8], [8, 2, 4], [12, 7, 4]], 'an octave up; the note under it stops where it starts');
  setTab(studio, 'chords');
  studio.rhythm.chords = rhythm('chords', [[0, 16]]);
  const [chord] = hold(studio, { col: 3, y: 0.5 }, 0, 1);
  assert.equal(chord.layer, 'keys');
  assert.deepEqual(studio.beat.chords.map(({ s, degree, len }) => [s, degree, len]), [[0, 3, 16]], 'Dm, for a whole bar');
});

test('a press a hair after a 16th still catches it; a later one waits for the next', () => {
  const studio = blank();
  studio.rhythm.drums = rhythm('drums', [[0, 1], [2, 1], [4, 1], [6, 1], [8, 1], [10, 1], [12, 1], [14, 1]]);
  press(studio, at16(studio, 4) + STUDIO.grace - 0.01, { row: 0, x: 1 });
  advance(studio, at16(studio, 4) + STUDIO.grace);
  letGo(studio);
  assert.deepEqual(studio.beat.drums.map((h) => h.s), [4]);
  press(studio, at16(studio, 8) + STUDIO.grace + 0.01, { row: 0, x: 1 });
  advance(studio, at16(studio, 10));
  letGo(studio);
  assert.deepEqual(studio.beat.drums.map((h) => h.s), [4, 10], 'not 8: it went by too long before');
});

test('what a hold writes is written a moment ahead of the playhead, so the band plays it on time', () => {
  const studio = blank();
  studio.rhythm.drums = rhythm('drums', [[0, 1], [4, 1], [8, 1], [12, 1]]);
  press(studio, 0.01, { row: 0, x: 1 });
  const written = advance(studio, at16(studio, 4) - STUDIO.ahead + 0.001);
  assert.deepEqual(written.map((w) => w.s), [0, 4], '16th 4 is written just before it sounds');
});

test('moving your finger changes the note from the next 16th on', () => {
  const studio = blank();
  setTab(studio, 'bass');
  studio.rhythm.bass = rhythm('bass', [[0, 2], [2, 2], [4, 2], [6, 2], [8, 2], [10, 2], [12, 2], [14, 2]]);
  press(studio, 0, { col: 0, y: 0.5 });
  advance(studio, at16(studio, 3));
  moveTo(studio, { col: 4, y: 0.5 });
  advance(studio, at16(studio, 7));
  letGo(studio);
  assert.deepEqual(studio.beat.bass.map((h) => [h.s, h.degree]), [[0, 0], [2, 0], [4, 4], [6, 4]]);
});

test('Erase empties what the playhead passes (only the held strip, on the drums); Clear empties the part', () => {
  const studio = blank();
  studio.rhythm.drums = rhythm('drums', [[0, 1], [4, 1], [8, 1], [12, 1]]);
  hold(studio, { row: 0, x: 1 }, 0, 16);
  hold(studio, { row: 1, x: 1 }, 0, 16);
  setErase(studio, true);
  hold(studio, { row: 0, x: 1 }, 4, 10);
  setErase(studio, false);
  assert.deepEqual(studio.beat.drums.filter((h) => h.drum === 'kick').map((h) => h.s), [0, 12]);
  assert.equal(studio.beat.drums.filter((h) => h.drum === 'snare').length, 4);
  clearPart(studio);
  assert.deepEqual(studio.beat.drums, []);
});

test('an erase is a change like any other: the version moves on, so it is kept', () => {
  const studio = blank();
  studio.beat.drums.push({ s: 4, drum: 'kick', vel: 1 });
  setErase(studio, true);
  press(studio, at16(studio, 4), { row: 0, x: 1 });
  const v = studio.version;
  advance(studio, at16(studio, 5));
  assert.deepEqual(studio.beat.drums, []);
  assert.ok(studio.version > v);
});

test('Undo steps back through every kind of change, one at a time, up to 20', () => {
  const studio = blank();
  studio.rhythm.drums = rhythm('drums', [[0, 1]]);
  hold(studio, { row: 0, x: 1 }, 0, 4);
  clearPart(studio);
  setTempo(studio, 120);
  setMood(studio, 'D');
  nextSound(studio);
  setLevel(studio, 'bass', 0.5);
  toggleMute(studio, 'chords');
  undoChange(studio);
  assert.equal(studio.beat.mix.muted.chords, false);
  undoChange(studio);
  undoChange(studio);
  undoChange(studio);
  undoChange(studio);
  assert.equal(studio.beat.bpm, 90);
  undoChange(studio);
  assert.equal(studio.beat.drums.length, 1, 'the clear, taken back');
  undoChange(studio);
  assert.equal(studio.beat.drums.length, 0, 'and the hold');
  assert.equal(studio.beats.slots[studio.open.slot], studio.beat, 'your slot has it as it is');
  for (let i = 0; i < 25; i++) setTempo(studio, 61 + i);
  for (let i = 0; i < 25; i++) undoChange(studio);
  assert.equal(studio.beat.bpm, 65, 'only the last 20 changes come back');
});

test('a drag is one change: its first step begins it, the rest carry on, and one Undo takes it all back', () => {
  const studio = blank();
  setTempo(studio, 100);
  for (let v = 101; v <= 120; v++) setTempo(studio, v, true);
  setSwing(studio, 0.6);
  setSwing(studio, 0.9, true);
  assert.equal(studio.beat.swing, 0.75, 'swing stops at 75%');
  undoChange(studio);
  assert.equal(studio.beat.swing, 0.5);
  undoChange(studio);
  assert.equal(studio.beat.bpm, 90);
  setTempo(studio, 30);
  assert.equal(studio.beat.bpm, 60, 'tempo from 60...');
  setTempo(studio, 300);
  assert.equal(studio.beat.bpm, 140, '...to 140');
});

test('a new key carries every note to the same place in it; a chord spelled out is stacked afresh', () => {
  const studio = createStudio(empty());
  setTab(studio, 'chords');
  setMood(studio, 'A'); // the lo-fi, copied: its first change
  const beat = studio.beat;
  assert.equal(beat.mood, 'A');
  assert.ok(beat.chords.every((h) => h.notes === undefined && h.name === undefined));
  assert.deepEqual(beat.bass.slice(0, 3).map((h) => h.degree), [1, 1, 5], 'the same places in the key');
  assert.equal(LOFI.mood, 'C', 'the ready-made lo-fi never changes');
  assert.ok(LOFI.chords[0].notes);
});

test('shortening keeps the first bars; lengthening repeats what is there', () => {
  const studio = blank();
  studio.rhythm.drums = rhythm('drums', [[0, 1]]);
  for (const bar of [0, 1, 2, 3]) hold(studio, { row: 0, x: 1 }, bar * 16, bar * 16 + 2);
  setLength(studio, 1);
  assert.equal(studio.beat.bars, 1);
  assert.deepEqual(studio.beat.drums.map((h) => h.s), [0]);
  studio.beat.drums.push({ s: 6, drum: 'snare', vel: 0.8 });
  setLength(studio, 4);
  assert.deepEqual(studio.beat.drums.map((h) => h.s), [0, 6, 16, 22, 32, 38, 48, 54]);
  setLength(studio, 2);
  assert.deepEqual(studio.beat.drums.map((h) => h.s), [0, 6, 16, 22]);
  setLength(studio, 3);
  assert.equal(studio.beat.bars, 2, '1, 2 or 4 bars only');
});

test('the first change to a ready-made beat makes your copy in the first empty slot; the original stays', () => {
  const beats = empty();
  beats.slots[0] = { ...blankBeat('Funk 2') };
  const studio = createStudio(beats);
  openBeat(studio, { ready: 'funk' });
  const funk = readyBeat('funk'), before = JSON.stringify(funk);
  studio.rhythm.drums = rhythm('drums', [[0, 1]]);
  hold(studio, { row: 0, x: 1 }, 0, 2);
  assert.deepEqual(studio.open, { slot: 1 });
  assert.equal(studio.beat.name, 'Funk 3', "there's already a Funk 2");
  assert.equal(studio.beat.ready, false);
  assert.equal(studio.beat.id, null, 'a copy is never the ready-made one');
  assert.equal(JSON.stringify(funk), before, 'the ready-made funk is as it was');
  assert.equal(studio.beat.bpm, 100, 'the copy is the funk');
});

test('with every slot full, a copy or a new beat asks which to replace; Esc leaves everything as it was', () => {
  const beats = empty();
  for (let i = 0; i < STUDIO.slots; i++) beats.slots[i] = blankBeat(`Beat ${i + 1}`);
  const studio = createStudio(beats);
  openBeat(studio, { ready: 'reggae' });
  assert.equal(press(studio, 0, { row: 0, x: 1 }), false);
  assert.deepEqual(studio.asking, { make: 'copy' });
  cancelAsk(studio);
  assert.equal(studio.asking, null);
  assert.equal(studio.beat, readyBeat('reggae'));
  assert.deepEqual(beats.slots.map((b) => b.name), ['Beat 1', 'Beat 2', 'Beat 3', 'Beat 4', 'Beat 5', 'Beat 6']);
  setTempo(studio, 90);
  assert.equal(studio.beat.bpm, 76, 'no change while it asks');
  replaceSlot(studio, 2);
  assert.equal(beats.slots[2].name, 'Reggae 2');
  assert.deepEqual(studio.open, { slot: 2 });
  setTempo(studio, 90);
  assert.equal(beats.slots[2].bpm, 90, 'now the change goes into your copy');
  newBeat(studio);
  assert.deepEqual(studio.asking, { make: 'new' });
  replaceSlot(studio, 4);
  assert.equal(beats.slots[4].name, 'Beat 3', 'the first number no other slot has');
});

test('New makes a blank beat, named Beat 1, Beat 2...', () => {
  const studio = createStudio(empty());
  newBeat(studio);
  newBeat(studio);
  assert.deepEqual(studio.beats.slots.slice(0, 3).map((b) => b?.name ?? null), ['Beat 1', 'Beat 2', null]);
  assert.deepEqual(studio.open, { slot: 1 });
  assert.deepEqual([studio.beat.bpm, studio.beat.mood, studio.beat.bars, studio.beat.drums.length], [90, 'A', 4, 0]);
});

test('Busk to this chooses the open beat for your sets, and the choice follows its slot', () => {
  const studio = createStudio(empty());
  openBeat(studio, { ready: 'ballad' });
  buskTo(studio);
  assert.equal(chosenBeat(studio.beats), readyBeat('ballad'));
  assert.ok(isChosen(studio, { ready: 'ballad' }) && !isChosen(studio, { ready: 'lofi' }));
  newBeat(studio);
  buskTo(studio);
  assert.equal(chosenBeat(studio.beats), studio.beats.slots[0]);
  setTempo(studio, 70);
  assert.equal(chosenBeat(studio.beats).bpm, 70, 'your changes are what your sets play');
});

test('your beats and the chosen one come back after a reload; anything unreadable is left out', () => {
  const storage = memoryStorage();
  const studio = createStudio(empty());
  openBeat(studio, { ready: 'funk' });
  setTempo(studio, 104);
  buskTo(studio);
  saveBeats(storage, studio.beats);
  const again = loadBeats(storage);
  assert.equal(again.slots[0].name, 'Funk 2');
  assert.equal(again.slots[0].bpm, 104);
  assert.deepEqual(again.chosen, { slot: 0 });
  assert.equal(createStudio(again).beat.bpm, 104, 'it opens on the beat you busk to');
  for (const bad of ['{', '[]', 'null', '{"slots":[{"name":"x"},7,null],"chosen":{"slot":1}}', '{"slots":[],"chosen":{"ready":"nope"}}']) {
    storage.set('open-case-beats', bad);
    const b = loadBeats(storage);
    assert.equal(b.slots.length, STUDIO.slots);
    assert.ok(b.slots.every((x) => x === null), bad);
    assert.equal(b.chosen, null, bad);
  }
  assert.equal(chosenBeat(loadBeats(memoryStorage())), LOFI, 'nothing stored: the lo-fi');
});

test('the wheel turns round the 16 rhythms; Tab goes round the parts; nothing to hold on the Mix tab', () => {
  const studio = blank();
  studio.rhythm.drums = 15;
  turnRhythm(studio, 1);
  assert.equal(studio.rhythm.drums, 0);
  turnRhythm(studio, -1);
  assert.equal(rhythmOf(studio), RHYTHMS.drums[15]);
  nextTab(studio);
  nextTab(studio);
  nextTab(studio);
  assert.equal(studio.tab, 'mix');
  assert.equal(press(studio, 0, { col: 0, y: 0 }), false);
  nextTab(studio);
  assert.equal(studio.tab, 'drums');
  moveRange(studio, 5);
  assert.equal(studio.range, 1);
});

test('the Mix: levels, mutes, the Pump, the Pad and the Vinyl', () => {
  const studio = blank();
  setLevel(studio, 'drums', 1.4);
  setPump(studio, 0.5);
  togglePad(studio);
  toggleVinyl(studio);
  toggleMute(studio, 'bass');
  assert.deepEqual(studio.beat.mix, { levels: { drums: 1, bass: 1, chords: 1 }, muted: { drums: false, bass: true, chords: false }, pump: 0.5, pad: true, vinyl: true });
  setTab(studio, 'chords');
  nextSound(studio);
  assert.equal(studio.beat.sounds.chords, 'nylon');
  nextSound(studio, -1);
  nextSound(studio, -1);
  assert.equal(studio.beat.sounds.chords, 'piano', 'round the sounds');
});

test('every change moves the version on, so the sound and the screen can follow', () => {
  const studio = blank();
  const v = studio.version;
  setTempo(studio, 99);
  assert.ok(studio.version > v);
  const w = studio.version;
  turnRhythm(studio, 1);
  assert.equal(studio.version, w, 'choosing a rhythm changes nothing in the beat');
});
````

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL. `test/studio.test.js` can't load: `Cannot find module '…/open-case/src/studio.js'`.

- [ ] **Step 3: Copies, blank beats, and checking a stored beat**

````diff
diff --git a/open-case/src/beats.js b/open-case/src/beats.js
index 3d195ec..c933d3d 100644
--- a/open-case/src/beats.js
+++ b/open-case/src/beats.js
@@ -335,3 +335,43 @@ export const BALLAD = {
 export const READY = [LOFI, BOSSA, FUNK, REGGAE, BALLAD];
 export const readyBeat = (id) => READY.find((b) => b.id === id) ?? null;
 export const LOFI_CLOCK = clockOf(LOFI);
+
+// A beat of your own to change freely: a deep copy, never the ready-made one it came from (so it has
+// no ready-made id).
+export const cloneBeat = (beat) => ({ ...JSON.parse(JSON.stringify(beat)), id: null, ready: false });
+
+// A blank beat, named `name`: 90 bpm, straight, A minor, 4 bars, the lo-fi's sounds, nothing in it.
+export function blankBeat(name) {
+  return {
+    id: null, name, ready: false, bpm: 90, swing: 0.5, mood: 'A', bars: 4,
+    sounds: { drums: 'lofi', bass: 'round', chords: 'epiano' }, mix: mix(), drums: [], bass: [], chords: [],
+  };
+}
+
+// A beat read back from storage, checked from top to bottom: the beat as a beat of your own, or null
+// if anything about it is off (it's ignored, and the game carries on).
+export function cleanBeat(raw) {
+  const num = (x, lo, hi) => typeof x === 'number' && Number.isFinite(x) && x >= lo && x <= hi;
+  const int = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;
+  const flag = (x) => typeof x === 'boolean';
+  try {
+    if (!raw || typeof raw !== 'object' || typeof raw.name !== 'string' || !raw.name || raw.name.length > 24) return null;
+    if (!num(raw.bpm, 60, 140) || !num(raw.swing, 0.5, 0.75) || !MOODS.some((m) => m.id === raw.mood) || ![1, 2, 4].includes(raw.bars)) return null;
+    const { sounds: so, mix: m } = raw;
+    if (!KITS[so?.drums] || !BASSES[so?.bass] || !CHORD_SOUNDS[so?.chords]) return null;
+    const parts = ['drums', 'bass', 'chords'];
+    if (!m || !parts.every((p) => num(m.levels?.[p], 0, 1) && flag(m.muted?.[p])) || !num(m.pump, 0, 1) || !flag(m.pad) || !flag(m.vinyl)) return null;
+    const end = raw.bars * 16;
+    const ok = {
+      drums: (h) => int(h.s, 0, end - 1) && ['kick', 'snare', 'hats', 'perc'].includes(h.drum) && num(h.vel, 0, 1),
+      bass: (h) => int(h.s, 0, end - 1) && int(h.degree, -14, 21) && int(h.len, 1, 64) && num(h.vel, 0, 1) && num(h.tone, 0, 1),
+      chords: (h) => int(h.s, 0, end - 1) && int(h.degree, -14, 21) && int(h.len, 1, 64) && num(h.vel, 0, 1) && num(h.tone, 0, 1)
+        && (h.notes === undefined || (Array.isArray(h.notes) && h.notes.length > 0 && h.notes.every((n) => int(n, 0, 127))))
+        && (h.name === undefined || typeof h.name === 'string'),
+    };
+    if (!parts.every((p) => Array.isArray(raw[p]) && raw[p].length <= 512 && raw[p].every((h) => h && ok[p](h)))) return null;
+    return cloneBeat(raw);
+  } catch {
+    return null;
+  }
+}
````

````diff
diff --git a/open-case/src/tuning.js b/open-case/src/tuning.js
index 3edcf16..a3cb2fd 100644
--- a/open-case/src/tuning.js
+++ b/open-case/src/tuning.js
@@ -153,6 +153,18 @@ export const SHOP = {
   synth: { price: 250 },
 };
 
+// The studio (studio.js): your slots, how far back Undo goes, how late a press can be and still catch
+// the 16th it just missed, how far ahead of the playhead a hold writes (so the band plays what it
+// writes on time), and how hard a held bass note and chord are played (a drum's is where you hold it).
+export const STUDIO = {
+  slots: 6,
+  undo: 20,
+  grace: 0.06, // seconds
+  ahead: 0.05, // seconds
+  vel: { bass: 0.8, chords: 0.5 },
+  softest: 0.3, // a drum held at the pad's left; the right is 1
+};
+
 // The loop pedal (looper.js): a loop is one pass of the chords, up to `layers` deep, and a note up to
 // `early` 16ths before a recording's first bar line still counts, played just as early.
 export const LOOP = { bars: 4, layers: 3, early: 1 };
````

- [ ] **Step 4: The rhythms**

Create `open-case/src/rhythms.js`:

````js
// The studio's rhythms, as Figure has them: 16 for each part, from sparse to busy, each one bar long.
// Holding the pad plays the chosen rhythm and writes it into the part as the playhead passes
// (studio.js). A rhythm is its hits, each [the 16th in the bar, how many 16ths it lasts]; the drums'
// hits all last one. The rhythm wheel draws a hit lasting more than a 16th as a long mark.
const beats = (every, len = 1, from = 0) => Array.from({ length: Math.ceil((16 - from) / every) }, (_, i) => [from + i * every, len]);
const hits = (...steps) => steps.map((s) => [s, 1]);

export const RHYTHMS = {
  drums: [
    hits(0), // the one
    hits(0, 8), // one and three
    hits(4, 12), // two and four: the backbeat
    beats(4), // every beat
    beats(2), // 8ths
    beats(4, 1, 2), // the offbeat 8ths
    beats(1), // 16ths
    hits(0, 7, 10), // the lo-fi's kick
    hits(0, 3, 8, 11), // pushed
    hits(0, 3, 6, 10, 12), // the son clave
    hits(0, 3, 6, 10, 13), // the bossa's clave
    hits(0, 3, 4, 7, 8, 11, 12, 15), // a shuffle
    hits(0, 6, 12), // the tresillo
    hits(8), // the one-drop, on three
    hits(2, 3, 6, 7, 10, 11, 14, 15), // doubled offbeats
    hits(8, 10, 12, 13, 14, 15), // a fill
  ],
  bass: [
    [[0, 16]], // a whole bar
    [[0, 8], [8, 8]], // halves
    beats(4, 4), // every beat, held
    beats(4, 2), // every beat, short
    [[0, 6], [6, 6], [12, 4]], // dotted
    [[0, 5], [7, 2], [10, 3], [14, 2]], // the lo-fi's line
    beats(2, 2), // 8ths
    beats(4, 2, 2), // the offbeat 8ths
    [[0, 6], [8, 6]], // the two-feel
    [[0, 3], [3, 3], [6, 4], [10, 2], [12, 4]], // syncopated
    [[0, 2], [3, 1], [6, 1], [7, 1], [10, 2], [12, 1], [14, 1], [15, 1]], // funk 16ths
    [[2, 3], [6, 2], [8, 4], [14, 2]], // reggae
    [[0, 4], [7, 4], [14, 2]], // pushes
    beats(4, 1), // every beat, staccato
    [[0, 2], [2, 1], [4, 2], [7, 1], [8, 2], [10, 1], [12, 2], [15, 1]], // busy
    [[12, 4]], // a pickup on four
  ],
  chords: [
    [[0, 16]], // a whole bar
    [[0, 8], [8, 8]], // halves
    beats(4, 3), // every beat
    [[4, 2], [12, 2]], // two and four: the skank
    beats(4, 1, 2), // offbeat stabs
    [[0, 9], [10, 6]], // the lo-fi's
    [[0, 2], [6, 2], [10, 2], [12, 2]], // the bossa's comping
    hits(0, 3, 6, 10, 11, 14), // funk stabs
    [[0, 3], [3, 13]], // the charleston
    [[0, 6], [6, 10]], // pushed
    beats(2, 2), // 8ths
    [[0, 14], [14, 2]], // held, then anticipated
    [[0, 6], [6, 6], [12, 4]], // dotted
    [[0, 4]], // one short chord
    [[8, 8]], // on three
    [[0, 2], [3, 2], [6, 2], [8, 2], [11, 2], [14, 2]], // syncopated
  ],
};

// A rhythm's hit on 16th r of the bar (0 to 15): its length, or 0 for none.
export const hitAt = (rhythm, r) => rhythm.find(([s]) => s === r)?.[1] ?? 0;
````

- [ ] **Step 5: The studio**

Create `open-case/src/studio.js`:

````js
// The studio (a shop item): where you make beats to busk to, the way Figure makes them. The open beat
// plays round and round; you pick a part (a tab) and a rhythm on the wheel, and hold the pad: the
// rhythm plays, and is written into the part as the playhead passes, replacing what was there. Also
// here: erasing and clearing, undo, the song's settings, the sounds and the mix, your six slots, and
// the beat your sets play. Pure, so it's tested in Node; main.js runs it, audio.js plays the open beat
// and studioview.js draws it.
//
// Times are band time: seconds since the band's first 16th, on the open beat's clock. 16ths count
// from the band's first too, round and round the beat.
import { READY, readyBeat, cloneBeat, blankBeat, cleanBeat, clockOf, notesOf, SOUNDS, MOODS } from './beats.js';
import { RHYTHMS, hitAt } from './rhythms.js';
import { STUDIO } from './tuning.js';

const KEY = 'open-case-beats';
export const PARTS = ['drums', 'bass', 'chords'];
export const TABS = [...PARTS, 'mix'];
export const DRUMS = ['kick', 'snare', 'hats', 'perc']; // the drum pad's strips, top to bottom
export const COLUMNS = 8; // the bass and chord pads' columns, left to right
export const LENGTHS = [1, 2, 4];

// Your beats, from storage: { slots: [a beat or null, for each of STUDIO.slots], chosen: { ready: id }
// or { slot }: the beat your sets play, or null for the lo-fi }. Anything unreadable is left out.
export function loadBeats(storage) {
  let raw = null;
  try {
    raw = JSON.parse(storage.get(KEY) ?? 'null');
  } catch {
    raw = null;
  }
  const slots = Array.from({ length: STUDIO.slots }, (_, i) => cleanBeat(raw?.slots?.[i]));
  const c = raw?.chosen;
  const chosen = c && (readyBeat(c.ready) ? { ready: c.ready } : Number.isInteger(c.slot) && slots[c.slot] ? { slot: c.slot } : null);
  return { slots, chosen: chosen || null };
}

export const saveBeats = (storage, beats) => storage.set(KEY, JSON.stringify(beats));

// The beat your sets play: the chosen one, if it's still there, and otherwise the lo-fi.
export function chosenBeat(beats) {
  const c = beats.chosen;
  return (c?.ready && readyBeat(c.ready)) || (c && beats.slots[c.slot]) || READY[0];
}

// A studio over your beats (loadBeats), with the beat your sets play open.
export function createStudio(beats) {
  const studio = {
    beats,
    open: null, // where the open beat is: { ready: id } or { slot }
    beat: null, // the open beat: a ready-made one itself, until a change copies it into a slot
    version: 0, // goes up with every change to the open beat, or opening another
    tab: 'drums',
    rhythm: { drums: 3, bass: 5, chords: 5 }, // each part's rhythm on the wheel
    range: 0, // the bass pad's octave: -1, 0 or 1
    held: null, // the pad held: { part, row, x } on the drums or { part, col, y }, and next, the first 16th still to write
    erase: false, // Erase (or Backspace) is down
    undo: [], // the open beat as it was before each change, the latest last
    asking: null, // every slot is full: { make: 'copy' | 'new' } until you pick one to replace
    list: false, // the list of beats is open over the pad
  };
  openBeat(studio, beats.chosen ?? { ready: READY[0].id });
  return studio;
}

// Opens a ready-made beat ({ ready: id }) or one of yours ({ slot }). Undo starts afresh.
export function openBeat(studio, which) {
  const beat = which.ready ? readyBeat(which.ready) : studio.beats.slots[which.slot];
  if (!beat) return;
  studio.open = which.ready ? { ready: which.ready } : { slot: which.slot };
  studio.beat = beat;
  studio.undo = [];
  studio.held = null;
  studio.list = false;
  studio.version++;
}

// The name for a copy of a beat called `name`: the name with the first number from 2 that none of
// your slots has ("Funk 2", then "Funk 3"), or for a blank beat, "Beat" and the first number from 1.
function freeName(slots, name, from) {
  let n = from;
  while (slots.some((b) => b?.name === `${name} ${n}`)) n++;
  return `${name} ${n}`;
}

// Puts `beat` into slot i and opens it there. The chosen beat, if it was that slot, follows it.
function keep(studio, i, beat) {
  studio.beats.slots[i] = beat;
  openBeat(studio, { slot: i });
}

// A copy of the open ready-made beat, as it is, named among `slots` (your slots, less any being
// replaced).
const copyOf = (studio, slots = studio.beats.slots) => ({ ...cloneBeat(studio.beat), name: freeName(slots, studio.beat.name, 2) });

// Before a change: a ready-made beat is first copied into your first empty slot (the original never
// changes), and the open beat as it is goes on the undo list. With every slot full, the studio asks
// which to replace instead, and nothing changes: false.
function begin(studio) {
  if (studio.beat.ready) {
    const i = studio.beats.slots.indexOf(null);
    if (i < 0) {
      studio.asking = { make: 'copy' };
      return false;
    }
    keep(studio, i, copyOf(studio));
  }
  studio.undo.push(cloneBeat(studio.beat));
  if (studio.undo.length > STUDIO.undo) studio.undo.shift();
  return true;
}

// Changes the open beat with fn(beat), once begin() allows it. `again` continues a change already
// begun (the rest of a drag), so it undoes as one. Returns whether it changed.
function edit(studio, fn, again = false) {
  if (!again && !begin(studio)) return false;
  fn(studio.beat);
  studio.version++;
  return true;
}

// New: a blank beat in your first empty slot, or with every slot full, asking which to replace.
export function newBeat(studio) {
  const i = studio.beats.slots.indexOf(null);
  if (i < 0) studio.asking = { make: 'new' };
  else keep(studio, i, blankBeat(freeName(studio.beats.slots, 'Beat', 1)));
}

// With every slot full: slot i is replaced by the copy or the new beat you were making.
export function replaceSlot(studio, i) {
  const make = studio.asking?.make;
  if (!make || i < 0 || i >= STUDIO.slots) return;
  studio.asking = null;
  const others = studio.beats.slots.map((b, k) => (k === i ? null : b));
  keep(studio, i, make === 'copy' ? copyOf(studio, others) : blankBeat(freeName(others, 'Beat', 1)));
}

// Esc while asking: nothing is made or replaced, and everything stays as it was.
export function cancelAsk(studio) {
  studio.asking = null;
}

// Busk to this: your sets play the open beat from now on.
export function buskTo(studio) {
  studio.beats.chosen = { ...studio.open };
}

export const isChosen = (studio, which) => {
  const c = studio.beats.chosen ?? { ready: READY[0].id };
  return which.ready ? c.ready === which.ready : c.slot === which.slot;
};

export function setTab(studio, tab) {
  if (TABS.includes(tab)) studio.tab = tab;
  studio.held = null;
}

// Tab: the next part (after Mix, back to the drums).
export const nextTab = (studio) => setTab(studio, TABS[(TABS.indexOf(studio.tab) + 1) % TABS.length]);

// The wheel: the part's rhythm, dir steps on (round and round the 16).
export function turnRhythm(studio, dir) {
  const part = studio.tab;
  if (!PARTS.includes(part)) return;
  const n = RHYTHMS[part].length;
  studio.rhythm[part] = (((studio.rhythm[part] + dir) % n) + n) % n;
}

export const rhythmOf = (studio, part = studio.tab) => RHYTHMS[part][studio.rhythm[part]];

// Range: the bass pad an octave up (1) or down (-1), from -1 to 1.
export function moveRange(studio, dir) {
  studio.range = Math.max(-1, Math.min(1, studio.range + dir));
}

// Sound: the part's next sound (dir 1) or the one before (-1).
export function nextSound(studio, dir = 1) {
  const part = studio.tab;
  if (!PARTS.includes(part)) return;
  const ids = Object.keys(SOUNDS[part]), i = ids.indexOf(studio.beat.sounds[part]);
  edit(studio, (b) => {
    b.sounds[part] = ids[(((i + dir) % ids.length) + ids.length) % ids.length];
  });
}

// The song's settings. A drag calls these over and over: `again` for all but the first, so the whole
// drag undoes as one change.
export function setTempo(studio, bpm, again = false) {
  const v = Math.max(60, Math.min(140, Math.round(bpm)));
  if (v !== studio.beat.bpm) edit(studio, (b) => (b.bpm = v), again);
}
export function setSwing(studio, swing, again = false) {
  const v = Math.max(0.5, Math.min(0.75, Math.round(swing * 100) / 100));
  if (v !== studio.beat.swing) edit(studio, (b) => (b.swing = v), again);
}
// A new key: every note keeps its place in the key, so it moves with it; a chord spelled out note by
// note is stacked afresh in the new key.
export function setMood(studio, mood, again = false) {
  if (!MOODS.some((m) => m.id === mood) || mood === studio.beat.mood) return;
  edit(studio, (b) => {
    b.mood = mood;
    for (const h of b.chords) {
      delete h.notes;
      delete h.name;
    }
  }, again);
}
// A shorter loop keeps its first bars; a longer one repeats what's there, so it sounds the same until
// you change it.
export function setLength(studio, bars, again = false) {
  const was = studio.beat.bars;
  if (!LENGTHS.includes(bars) || bars === was) return;
  edit(studio, (b) => {
    for (const part of PARTS) {
      const kept = b[part].filter((h) => h.s < bars * 16);
      const copies = [];
      for (let k = 1; k * was < bars; k++) for (const h of kept) copies.push({ ...h, s: h.s + k * was * 16 });
      b[part] = [...kept, ...copies].sort((x, y) => x.s - y.s);
    }
    b.bars = bars;
  }, again);
}

// The Mix tab: each part's level (0 to 1) and mute, the Pump (0 to 1), and the Pad and Vinyl.
export function setLevel(studio, part, level, again = false) {
  const v = Math.max(0, Math.min(1, Math.round(level * 100) / 100));
  if (v !== studio.beat.mix.levels[part]) edit(studio, (b) => (b.mix.levels[part] = v), again);
}
export const toggleMute = (studio, part) => edit(studio, (b) => (b.mix.muted[part] = !b.mix.muted[part]));
export function setPump(studio, pump, again = false) {
  const v = Math.max(0, Math.min(1, Math.round(pump * 100) / 100));
  if (v !== studio.beat.mix.pump) edit(studio, (b) => (b.mix.pump = v), again);
}
export const togglePad = (studio) => edit(studio, (b) => (b.mix.pad = !b.mix.pad));
export const toggleVinyl = (studio) => edit(studio, (b) => (b.mix.vinyl = !b.mix.vinyl));

// Clear: the part you're on, emptied.
export function clearPart(studio) {
  const part = studio.tab;
  if (PARTS.includes(part) && studio.beat[part].length) edit(studio, (b) => (b[part] = []));
}

// Undo: the open beat as it was before your last change.
export function undoChange(studio) {
  const was = studio.undo.pop();
  if (!was) return;
  studio.beat = was;
  studio.beats.slots[studio.open.slot] = was;
  studio.held = null;
  studio.version++;
}

// The 16th just at or before band time t on `clock`.
function sixteenthBefore(clock, t) {
  const s = clock.sixteenthAt(t);
  return clock.timeOf16th(s) <= t ? s : s - 1;
}

// You hold the pad at band time t: `at` is where, { row, x } on the drums (row 0 the kick to 3 the
// percussion; x from 0, softer, to 1) or { col, y } on the bass and chords (col 0 to 7; y from 0, darker,
// to 1). Writing starts at the next 16th, or at the one just gone if it went less than STUDIO.grace
// ago. False when there's no pad to hold (the Mix tab, or a slot must be picked first).
export function press(studio, t, at) {
  const part = studio.tab;
  if (!PARTS.includes(part) || studio.asking || studio.list || !begin(studio)) return false;
  const clock = clockOf(studio.beat), s = sixteenthBefore(clock, t);
  studio.held = { part, ...at, next: t - clock.timeOf16th(s) <= STUDIO.grace ? s : s + 1 };
  studio.version++;
  return true;
}

// Your finger moves while it holds: the next 16th on is written where it is now.
export function moveTo(studio, at) {
  if (studio.held) Object.assign(studio.held, at);
}

// You let go: nothing more is written.
export function letGo(studio) {
  studio.held = null;
}

// Erase (or Backspace) goes down or up.
export function setErase(studio, on) {
  studio.erase = on;
}

// Time runs on to band time t while you hold: every 16th from the next one still to write up to
// STUDIO.ahead past t is written (the part's notes there replaced by the rhythm's hit, if it has one
// there), or with Erase down, emptied. Returns what was written for the sound, [{ layer, notes, s }]
// (s: the band's 16th), so the notes on 16ths the band has already scheduled are still heard.
export function advance(studio, t) {
  const h = studio.held;
  if (!h) return [];
  const clock = clockOf(studio.beat), out = [], from = h.next;
  while (clock.timeOf16th(h.next) <= t + STUDIO.ahead) {
    const played = paint(studio, h, h.next);
    if (played?.notes.length) out.push({ ...played, s: h.next });
    h.next++;
  }
  if (h.next !== from) studio.version++; // written or erased: either way, the beat has changed
  return out;
}

// Writes the band's 16th k with the held pad, as advance does.
function paint(studio, h, k) {
  const beat = studio.beat, part = h.part, end = beat.bars * 16, pos = ((k % end) + end) % end;
  const drum = part === 'drums' ? DRUMS[h.row] : null;
  beat[part] = beat[part].filter((x) => !(x.s === pos && (!drum || x.drum === drum)));
  if (studio.erase) return null;
  const len = hitAt(rhythmOf(studio, part), pos % 16);
  if (!len) return null;
  let hit;
  if (drum) hit = { s: pos, drum, vel: Math.round((STUDIO.softest + (1 - STUDIO.softest) * h.x) * 100) / 100 };
  else {
    // One note of the bass, or one chord, at a time: one still sounding stops where this starts.
    for (const x of beat[part]) if (x.s < pos && x.s + x.len > pos) x.len = pos - x.s;
    const degree = part === 'bass' ? h.col + 7 * studio.range : h.col;
    hit = { s: pos, degree, len: Math.min(len, end - pos), vel: STUDIO.vel[part], tone: Math.round(h.y * 100) / 100 };
  }
  beat[part].push(hit);
  beat[part].sort((a, b) => a.s - b.s);
  return notesOf(beat, part, hit);
}
````

- [ ] **Step 6: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 269 tests.

- [ ] **Step 7: Commit**

```bash
git add open-case/src/rhythms.js open-case/src/studio.js open-case/src/beats.js open-case/src/tuning.js open-case/test/studio.test.js
git commit -m "Open Case: the studio's workings: hold to paint a rhythm, erase, clear, undo, the settings, and six slots

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: The studio's screen

**Files:**
- Create: `open-case/src/studioview.js`
- Modify: `open-case/src/beats.js`, `open-case/src/render.js`, `art/open-case/sprites.lua`
- Regenerate: `open-case/assets/sprites.json` (the sheet's named colours gain the studio's)
- Test: create `open-case/test/studioview.test.js`; modify `open-case/test/render.test.js`

**Interfaces:**
- Consumes: `studio.js` (Task 4); `beats.js`.
- Produces:
  - `studioview.js`:
    - the layout: `NAME`, `TAB_BOXES`, `SETTINGS`, `WHEEL`, `BUTTONS`, `PAD`, `STRIP`;
    - `moodShort(id)`;
    - `studioHit(studio, x, y)`: what a click lands on, `{ hit, … }` or null (its header lists every kind);
    - `padAt(part, x, y)` and `faderValue(y)`;
    - `drawStudio({ px, text, big, C }, studio, t)`.
  - `render.js` draws the `'studio'` screen from `view.studio`, with `view.t` its band time, and gains a `big(s, x, y, c)` for 16px text.
  - `beats.js`: `noteLetter(pitch)`.
  - The sheet's `colors` gain `dusk`, `drums`, `drumsDark`, `bass`, `bassDark`, `chords` and `chordsDark`.

- [ ] **Step 1: Write the failing tests**

Create `open-case/test/studioview.test.js`:

````js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { studioHit, padAt, faderValue, moodShort, NAME, TAB_BOXES, SETTINGS, WHEEL, BUTTONS, PAD, STRIP } from '../src/studioview.js';
import { createStudio, newBeat, setTab, DRUMS } from '../src/studio.js';
import { STUDIO } from '../src/tuning.js';

const empty = () => ({ slots: Array(STUDIO.slots).fill(null), chosen: null });
const mid = ([x, y, w, h]) => [x + w / 2, y + h / 2];
const inScreen = ([x, y, w, h]) => x >= 0 && y >= 0 && x + w <= 320 && y + h <= 180;

test('everything on the studio screen is inside it, and the pad, the wheel, the strip and the top bar keep apart', () => {
  for (const box of [NAME, PAD, STRIP, ...Object.values(TAB_BOXES), ...Object.values(SETTINGS), ...Object.values(BUTTONS)]) assert.ok(inScreen(box), `${box}`);
  const [wx, wy, r] = WHEEL;
  assert.ok(wx + r < PAD[0] && wy - r > NAME[1] + NAME[3], 'the wheel left of the pad, under the top bar');
  for (const box of Object.values(BUTTONS)) assert.ok(box[1] > wy + r && box[0] + box[2] < PAD[0], 'the buttons under the wheel');
  assert.ok(PAD[1] + PAD[3] <= STRIP[1], 'the strip under the pad');
  assert.ok(Object.values(TAB_BOXES).every(([x, , w]) => x >= NAME[0] + NAME[2] && x + w <= SETTINGS.bpm[0]), 'the tabs between the name and the settings');
});

test('a click lands on the name, a tab, a setting, the wheel (up or down) or a button', () => {
  const studio = createStudio(empty());
  assert.deepEqual(studioHit(studio, ...mid(NAME)), { hit: 'name' });
  for (const tab of ['drums', 'bass', 'chords', 'mix']) assert.deepEqual(studioHit(studio, ...mid(TAB_BOXES[tab])), { hit: 'tab', tab });
  for (const which of ['bpm', 'mood', 'swing', 'bars']) assert.deepEqual(studioHit(studio, ...mid(SETTINGS[which])), { hit: 'setting', which });
  assert.deepEqual(studioHit(studio, WHEEL[0], WHEEL[1] - 10), { hit: 'wheel', dir: -1 });
  assert.deepEqual(studioHit(studio, WHEEL[0], WHEEL[1] + 10), { hit: 'wheel', dir: 1 });
  for (const which of ['sound', 'erase', 'clear', 'undo']) assert.deepEqual(studioHit(studio, ...mid(BUTTONS[which])), { hit: 'button', which });
  assert.equal(studioHit(studio, ...mid(BUTTONS.range)), null, 'Range is only for the bass');
  setTab(studio, 'bass');
  assert.deepEqual(studioHit(studio, ...mid(BUTTONS.range)), { hit: 'button', which: 'range' });
  assert.equal(studioHit(studio, STRIP[0] + 10, STRIP[1] + 20), null, 'the strip is only to look at');
});

test("on the pad: a drum strip and how hard, or a column and its tone", () => {
  const [x0, y0, w, h] = PAD;
  assert.deepEqual(padAt('drums', x0 + 1, y0 + 1), { row: 0, x: 0 });
  assert.deepEqual(padAt('drums', x0 + w - 1, y0 + h - 1), { row: DRUMS.length - 1, x: 1 });
  assert.deepEqual(padAt('bass', x0 + w * 0.3, y0 + h * 0.25), { col: 2, y: 0.75 });
  assert.deepEqual(padAt('chords', x0 + w + 5, y0 - 5), { col: 7, y: 1 }, 'a drag off the pad stays at its edge');
  const studio = createStudio(empty());
  assert.deepEqual(studioHit(studio, x0 + w / 2, y0 + h * 0.3), { hit: 'pad', at: { row: 1, x: 0.5 } });
});

test('the Mix tab: a fader for each part and the Pump, a mute under each part, and the Pad and Vinyl switches', () => {
  const studio = createStudio(empty());
  setTab(studio, 'mix');
  const hits = [];
  for (let x = PAD[0]; x < PAD[0] + PAD[2]; x++) for (let y = PAD[1]; y < PAD[1] + PAD[3]; y++) hits.push(studioHit(studio, x, y));
  const faders = new Set(hits.filter((h) => h?.hit === 'fader').map((h) => h.which));
  assert.deepEqual([...faders].sort(), ['bass', 'chords', 'drums', 'pump']);
  assert.deepEqual([...new Set(hits.filter((h) => h?.hit === 'mute').map((h) => h.part))].sort(), ['bass', 'chords', 'drums']);
  assert.deepEqual([...new Set(hits.filter((h) => h?.hit === 'switch').map((h) => h.which))].sort(), ['pad', 'vinyl']);
  const levels = hits.filter((h) => h?.hit === 'fader' && h.which === 'drums').map((h) => h.value);
  assert.ok(Math.min(...levels) === 0 && Math.max(...levels) === 1, 'from none at the bottom to full at the top');
  assert.equal(faderValue(-50), 1);
  assert.equal(faderValue(500), 0);
});

test('the list of beats opens the ready-made ones and yours, and has New, Busk to this and Close', () => {
  const studio = createStudio(empty());
  newBeat(studio);
  studio.list = true;
  const hits = [];
  for (let x = PAD[0]; x < PAD[0] + PAD[2]; x += 2) for (let y = PAD[1]; y < PAD[1] + PAD[3]; y += 2) hits.push(studioHit(studio, x, y));
  const opens = hits.filter((h) => h?.hit === 'open').map((h) => JSON.stringify(h.which));
  assert.deepEqual([...new Set(opens)], ['{"ready":"lofi"}', '{"ready":"bossa"}', '{"ready":"funk"}', '{"ready":"reggae"}', '{"ready":"ballad"}', '{"slot":0}'], 'an empty slot opens nothing');
  for (const which of ['new', 'busk', 'close']) assert.ok(hits.some((h) => h?.hit === which), which);
  assert.deepEqual(studioHit(studio, ...mid(NAME)), { hit: 'name' }, 'the name still closes it');
});

test('asking which slot to replace: a click on a slot replaces it, anywhere off the pad leaves them all', () => {
  const studio = createStudio(empty());
  studio.asking = { make: 'copy' };
  const slots = new Set();
  for (let x = PAD[0]; x < PAD[0] + PAD[2]; x += 2) for (let y = PAD[1]; y < PAD[1] + PAD[3]; y += 2) {
    const h = studioHit(studio, x, y);
    if (h) {
      assert.equal(h.hit, 'replace');
      slots.add(h.slot);
    }
  }
  assert.deepEqual([...slots].sort(), [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(studioHit(studio, ...mid(TAB_BOXES.bass)), { hit: 'keep' });
});

test('the keys are named short, to fit the top bar', () => {
  assert.deepEqual(['C', 'D', 'E', 'F', 'G', 'A'].map(moodShort), ['C maj', 'D dor', 'E phr', 'F lyd', 'G mix', 'A min']);
});
````

and apply to `open-case/test/render.test.js`:

````diff
diff --git a/open-case/test/render.test.js b/open-case/test/render.test.js
index 614c907..948d2ff 100644
--- a/open-case/test/render.test.js
+++ b/open-case/test/render.test.js
@@ -13,6 +13,8 @@ import { STOCK, PEDALS, INSTRUMENTS, freshGear, buy, stomp } from '../src/gear.j
 import { createShop, choose, CARD, BUTTON } from '../src/shop.js';
 import { createLoop, record, step, loopLength } from '../src/looper.js';
 import { stoodAt } from './helpers.js';
+import { createStudio, setTab } from '../src/studio.js';
+import { STRIP } from '../src/studioview.js';
 const { bar: BAR, beat: BEAT } = LOFI_CLOCK;
 const LOOP_LENGTH = loopLength(createLoop());
 
@@ -659,3 +661,52 @@ test("with another beat, the bar counter counts that set's bars, and listeners n
   assert.match(personFrame(p, 10 * beat + 0.05, 0, beat), /-nod-1-/, "head down on the funk's beat");
   assert.match(personFrame(p, 10 * beat + beat * 0.6, 0, beat), /-nod-0-/);
 });
+
+test("the studio screen: the top bar, the wheel, the buttons and each tab's pad", () => {
+  const studio = createStudio({ slots: Array(6).fill(null), chosen: null });
+  const drawOn = (tab, over = {}) => {
+    const g = fakeContext();
+    setTab(studio, tab);
+    Object.assign(studio, over);
+    createRenderer(g, art)(view({ screen: 'studio', studio, t: 4.2 }));
+    return g;
+  };
+  const drums = drawOn('drums');
+  for (const s of ['Lo-fi', 'drums', 'bass', 'chords', 'mix', '80', 'C maj', '58%', '4', 'kick', 'snare', 'hats', 'perc', 'lo-fi kit', 'erase', 'clear', 'undo']) {
+    assert.ok(drums.texts.includes(s), s);
+  }
+  assert.ok(drums.positions.some((p) => p.s === '4' && p.font.startsWith('16px')), "the wheel's rhythm number, in the big font");
+  assert.ok(drums.sprites.length === 0, 'no park behind it');
+  const bass = drawOn('bass');
+  for (const s of ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'round bass', 'oct 0']) assert.ok(bass.texts.includes(s), s);
+  const chords = drawOn('chords');
+  for (const s of ['Dm', 'Em', 'F', 'Am', 'Bdim', 'electric piano']) assert.ok(chords.texts.includes(s), s);
+  const mix = drawOn('mix');
+  for (const s of ['pump', 'pad', 'vinyl', 'm']) assert.ok(mix.texts.includes(s), s);
+});
+
+test("the studio's strip: every part's notes in its own lane and colour, the chords named, and the playhead", () => {
+  const studio = createStudio({ slots: Array(6).fill(null), chosen: null });
+  const g = fakeContext();
+  createRenderer(g, art)(view({ screen: 'studio', studio, t: 4.5 }));
+  const C = data.colors, [x0, y0, w, h] = STRIP;
+  const inStrip = g.rects.filter(([x, y]) => x >= x0 && x < x0 + w && y >= y0 && y < y0 + h);
+  for (const colour of [C.drums, C.drumsDark, C.bass, C.chordsDark]) assert.ok(inStrip.some((r) => r[4] === colour), colour);
+  for (const s of ['1', '2', '3', '4', 'Dm9', 'G13', 'Cmaj9', 'Am9']) assert.ok(g.texts.includes(s), s);
+  const playhead = inStrip.filter(([, , rw, rh, c]) => rw === 1 && rh > 30 && c === C.light);
+  assert.equal(playhead.length, 1);
+  assert.equal(playhead[0][0], x0 + Math.round((4.5 / 12) * 64 * (w / 64)), 'a bar and a half in: 1.5 of the 4 bars');
+});
+
+test('the list of beats, and the question when your slots are full, over the pad', () => {
+  const studio = createStudio({ slots: Array(6).fill(null), chosen: null });
+  studio.list = true;
+  const g = fakeContext();
+  createRenderer(g, art)(view({ screen: 'studio', studio, t: 0 }));
+  for (const s of ['ready-made', 'yours', 'Lo-fi', 'Bossa nova', 'Funk', 'Reggae', 'Slow ballad', 'empty', 'busking', 'new', 'busk to this', 'close']) assert.ok(g.texts.includes(s), s);
+  studio.list = false;
+  studio.asking = { make: 'copy' };
+  const q = fakeContext();
+  createRenderer(q, art)(view({ screen: 'studio', studio, t: 0 }));
+  assert.ok(q.texts.includes('your slots are full: replace which?') && q.texts.includes('esc: leave them all'));
+});
````

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL. `test/render.test.js` and `test/studioview.test.js` can't load: `Cannot find module '…/open-case/src/studioview.js'`.

- [ ] **Step 3: The studio's colours in the sheet's data**

````diff
diff --git a/art/open-case/sprites.lua b/art/open-case/sprites.lua
index 2de454a..3d09611 100644
--- a/art/open-case/sprites.lua
+++ b/art/open-case/sprites.lua
@@ -214,7 +214,10 @@ for i, cl in ipairs(D.CLOUDS) do clouds[i] = { cl[1], cl[2], cl[4] } end
 local colorNames = {
   { "ink", C.ink }, { "charcoal", C.charcoal }, { "light", C.light }, { "gold", C.yellow[2] },
   { "goldDark", C.yellow[1] }, { "grey", C.coat[2] }, { "greyDark", C.coat[1] }, { "red", C.red[2] },
-  { "go", C.go }, { "night", C.night[3] },
+  { "go", C.go }, { "night", C.night[3] }, { "dusk", C.night[1] },
+  -- the studio's parts: the drums orange, the bass blue, the chords green, each with its shadow
+  { "drums", C.sky[6] }, { "drumsDark", C.sky[5] }, { "bass", C.blue[2] }, { "bassDark", C.blue[1] },
+  { "chords", C.go }, { "chordsDark", C.leaf[3] },
 }
 local colors = {}
 for i, c in ipairs(colorNames) do colors[i] = ('    "%s": "%s"'):format(c[1], c[2]) end
````

Rebuild from the repo root: `/Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/sprites.lua`.
- Expected: `sprites: 550 frames on a 512x1968 sheet, 49 colours`.
- Only `sprites.json` changes, gaining the colours; `sprites.png` is unchanged.
- Run it again: `git status` must show nothing new since the first run.

- [ ] **Step 4: Note letters, the screen, and the renderer's hook**

````diff
diff --git a/open-case/src/beats.js b/open-case/src/beats.js
index c933d3d..0e47bc1 100644
--- a/open-case/src/beats.js
+++ b/open-case/src/beats.js
@@ -111,6 +111,8 @@ export function chordOf(beat, hit) {
 
 export const bassNote = (beat, hit) => keyNote(beat.mood, hit.degree, BASS_C);
 
+// A white key's letter: C to B.
+export const noteLetter = (pitch) => LETTERS[WHITE.indexOf(mod(pitch, 12))];
 
 // The timing of a beat: how long a beat and a bar last, when 16th s sounds (in seconds from the
 // band's first 16th) and which 16th is nearest a time. The swing pushes the second 16th of each pair
````

Create `open-case/src/studioview.js`:

````js
// The studio's screen at 320x180, laid out as Figure's is but wide: the beat's name, the tabs and the
// song's settings across the top; the rhythm wheel and the buttons on the left; the big pad on the
// right (the Mix tab's faders in its place); and along the bottom, a picture of the loop, only to look
// at: bar numbers, a lane for each part showing its notes, and the playhead. The list of beats, and the
// question of which slot to replace, open over the pad. studioHit says what a click lands on;
// drawStudio draws it all with render.js's tools.
import { READY, clockOf, chordOf, bassNote, keyNote, noteLetter, padChordName, SOUNDS, BASS_C } from './beats.js';
import { PARTS, DRUMS, COLUMNS, rhythmOf, isChosen } from './studio.js';
import { STUDIO } from './tuning.js';

// Where everything is, [x, y, w, h] in scene pixels.
export const NAME = [2, 2, 62, 14];
export const TAB_BOXES = { drums: [66, 3, 32, 14], bass: [100, 3, 26, 14], chords: [128, 3, 38, 14], mix: [168, 3, 22, 14] };
export const SETTINGS = { bpm: [194, 1, 28, 17], mood: [222, 1, 36, 17], swing: [258, 1, 32, 17], bars: [290, 1, 28, 17] };
export const WHEEL = [40, 50, 22]; // its middle and radius
export const BUTTONS = { sound: [4, 84, 74, 12], erase: [4, 98, 36, 12], clear: [42, 98, 36, 12], undo: [4, 112, 36, 12], range: [42, 112, 36, 12] };
export const PAD = [82, 22, 234, 108];
export const STRIP = [16, 134, 300, 44]; // the picture of the loop: its numbers row, then the lanes
const MIX_FADERS = { drums: 104, bass: 144, chords: 184, pump: 244 }; // each fader's x, 14 wide
const FADER = [38, 62]; // the faders' top and height
const MUTE_Y = 106;
const SWITCHES = { pad: [270, 40, 40, 12], vinyl: [270, 56, 40, 12] };
const LIST_ROW = 11; // the list's rows
const LANES = { drums: [144, 10], bass: [156, 9], chords: [167, 10] }; // each lane's top and height

const inside = ([x, y, w, h], px, py) => px >= x && px < x + w && py >= y && py < y + h;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const moodShort = (id) => ({ C: 'C maj', D: 'D dor', E: 'E phr', F: 'F lyd', G: 'G mix', A: 'A min' })[id];

// The list's rows over the pad: the ready-made beats on the left, your slots on the right, and its
// buttons along the bottom.
const listBox = (i, side) => [PAD[0] + 4 + side * 116, PAD[1] + 14 + i * LIST_ROW, 110, LIST_ROW];
const LIST_BUTTONS = { new: [PAD[0] + 4, PAD[1] + 92, 40, 12], busk: [PAD[0] + 48, PAD[1] + 92, 78, 12], close: [PAD[0] + 178, PAD[1] + 92, 50, 12] };

// What a click (or a press) at scene point (x, y) lands on, as { hit, ... }, or null:
//   'replace' { slot }, 'keep'                  while asking which slot to replace
//   'open' { which }, 'new', 'busk', 'close'    in the list of beats
//   'name', 'tab' { tab }, 'setting' { which }, 'wheel' { dir }, 'button' { which }
//   'pad' { at }: { row, x } on the drums, { col, y } on the bass and chords
//   'fader' { which, value } (a part's level, or 'pump'), 'mute' { part }, 'switch' { which }
export function studioHit(studio, x, y) {
  if (studio.asking) {
    for (let i = 0; i < STUDIO.slots; i++) if (inside(listBox(i, 1), x, y)) return { hit: 'replace', slot: i };
    return inside(PAD, x, y) ? null : { hit: 'keep' };
  }
  if (studio.list) {
    for (let i = 0; i < READY.length; i++) if (inside(listBox(i, 0), x, y)) return { hit: 'open', which: { ready: READY[i].id } };
    for (let i = 0; i < STUDIO.slots; i++) if (inside(listBox(i, 1), x, y) && studio.beats.slots[i]) return { hit: 'open', which: { slot: i } };
    for (const [which, box] of Object.entries(LIST_BUTTONS)) if (inside(box, x, y)) return { hit: which };
    if (inside(PAD, x, y)) return null;
  }
  if (inside(NAME, x, y)) return { hit: 'name' };
  for (const [tab, box] of Object.entries(TAB_BOXES)) if (inside(box, x, y)) return { hit: 'tab', tab };
  for (const [which, box] of Object.entries(SETTINGS)) if (inside(box, x, y)) return { hit: 'setting', which };
  const [wx, wy, r] = WHEEL;
  if ((x - wx) ** 2 + (y - wy) ** 2 <= (r + 8) ** 2) return { hit: 'wheel', dir: y < wy ? -1 : 1 };
  for (const [which, box] of Object.entries(BUTTONS)) {
    if (inside(box, x, y) && (which !== 'range' || studio.tab === 'bass')) return { hit: 'button', which };
  }
  if (!inside(PAD, x, y)) return null;
  if (studio.tab === 'mix') return mixHit(x, y);
  return { hit: 'pad', at: padAt(studio.tab, x, y) };
}

// Where on the pad a point is, for the part: { row, x } or { col, y } (see studio.js press).
export function padAt(part, x, y) {
  const [px0, py0, w, h] = PAD, fx = clamp01((x - px0) / w), fy = clamp01((y - py0) / h);
  if (part === 'drums') return { row: Math.min(DRUMS.length - 1, Math.floor(fy * DRUMS.length)), x: Math.round(fx * 100) / 100 };
  return { col: Math.min(COLUMNS - 1, Math.floor(fx * COLUMNS)), y: Math.round((1 - fy) * 100) / 100 };
}

function mixHit(x, y) {
  for (const [which, fx] of Object.entries(MIX_FADERS)) {
    if (x >= fx - 3 && x < fx + 17 && y >= FADER[0] - 4 && y < FADER[0] + FADER[1] + 4) {
      return { hit: 'fader', which, value: Math.round(clamp01((FADER[0] + FADER[1] - y) / FADER[1]) * 100) / 100 };
    }
    if (which !== 'pump' && inside([fx, MUTE_Y, 14, 10], x, y)) return { hit: 'mute', part: which };
  }
  for (const [which, box] of Object.entries(SWITCHES)) if (inside(box, x, y)) return { hit: 'switch', which };
  return null;
}

// A fader's value at scene height y, for a drag that has wandered off the fader.
export const faderValue = (y) => Math.round(clamp01((FADER[0] + FADER[1] - y) / FADER[1]) * 100) / 100;

// Draws the studio: d is render.js's { px, text, big, C } (big: text in the 16px font); t is band time
// (for the playhead).
export function drawStudio(d, studio, t) {
  const { px, text, C } = d, beat = studio.beat, part = studio.tab;
  const tone = { drums: [C.drums, C.drumsDark], bass: [C.bass, C.bassDark], chords: [C.chords, C.chordsDark] };
  px(0, 0, 320, 180, C.night);
  // The top bar: the beat's name (click for the list), the tabs, the settings.
  px(0, 0, 320, 19, C.dusk);
  px(NAME[0], NAME[1], NAME[2], NAME[3], studio.list ? C.charcoal : C.night);
  text(beat.name.length > 9 ? `${beat.name.slice(0, 8)}.` : beat.name, NAME[0] + 3, NAME[1] + 3, C.light);
  text('v', NAME[0] + NAME[2] - 7, NAME[1] + 3, C.grey);
  for (const [id, [x, y, w, h]] of Object.entries(TAB_BOXES)) {
    const on = id === part, colour = id === 'mix' ? [C.gold, C.goldDark] : tone[id];
    px(x, y, w, h + 2, on ? colour[0] : C.night);
    text(id, x + w / 2, y + 3, on ? C.ink : C.grey, 'center');
  }
  const values = {
    bpm: String(beat.bpm), mood: moodShort(beat.mood), swing: beat.swing === 0.5 ? 'off' : `${Math.round(beat.swing * 100)}%`, bars: String(beat.bars),
  };
  for (const [id, [x, y, w]] of Object.entries(SETTINGS)) {
    text(id === 'mood' ? 'key' : id, x + w / 2, y, C.greyDark, 'center');
    text(values[id], x + w / 2, y + 8, C.light, 'center');
  }
  if (PARTS.includes(part)) wheel(d, studio, tone[part]);
  buttons(d, studio);
  if (part === 'mix') mix(d, studio, tone);
  else pad(d, studio, tone[part]);
  strip(d, studio, t, tone);
  if (studio.list || studio.asking) list(d, studio);
}

// The rhythm wheel: the part's rhythm as marks round a ring (long for a long note), its number in the
// middle, and arrows to turn it.
function wheel({ px, big, C }, studio, [base, shadow]) {
  const [cx, cy, r] = WHEEL, rhythm = rhythmOf(studio);
  for (let a = 0; a < 64; a++) {
    const th = (a / 64) * Math.PI * 2;
    px(cx + Math.sin(th) * r, cy - Math.cos(th) * r, 1, 1, C.charcoal);
  }
  for (let k = 0; k < 16; k++) {
    const len = rhythm.find(([s]) => s === k)?.[1] ?? 0, th = (k / 16) * Math.PI * 2, sx = Math.sin(th), cy2 = -Math.cos(th);
    const reach = len > 1 ? 7 : len ? 4 : 1;
    for (let i = 0; i < reach; i++) px(cx + sx * (r - 3 + i), cy + cy2 * (r - 3 + i), 2, 2, len ? (k % 4 === 0 ? base : shadow) : C.charcoal);
  }
  big(String(studio.rhythm[studio.tab] + 1), cx, cy - 7, C.light);
  for (const [dx, dy, dir] of [[0, -r - 7, -1], [0, r + 5, 1]]) {
    for (let i = 0; i < 3; i++) px(cx + dx - i, cy + dy + (dir < 0 ? i : 2 - i), 1 + 2 * i, 1, C.grey);
  }
}

function buttons({ px, text, C }, studio) {
  const lit = { erase: studio.erase };
  for (const [id, [x, y, w, h]] of Object.entries(BUTTONS)) {
    const off = (id === 'range' && studio.tab !== 'bass') || (id !== 'undo' && studio.tab === 'mix' && id !== 'sound');
    const faded = off || (id === 'sound' && studio.tab === 'mix') || (id === 'undo' && !studio.undo.length);
    px(x, y, w, h, lit[id] ? C.red : C.charcoal);
    const sound = PARTS.includes(studio.tab) ? SOUNDS[studio.tab][studio.beat.sounds[studio.tab]].name : 'sound';
    const word = id === 'range' ? `oct ${studio.range > 0 ? '+1' : studio.range < 0 ? '-1' : '0'}` : id === 'sound' ? sound : id;
    text(word, x + w / 2, y + 2, faded ? C.greyDark : C.light, 'center');
  }
}

// The pad: four strips for the drums, eight columns for the bass (the key's notes) and the chords (its
// chords), each named, with its key; lit where you hold it.
function pad({ px, text, C }, studio, [base, shadow]) {
  const [x0, y0, w, h] = PAD, beat = studio.beat, held = studio.held, part = studio.tab;
  px(x0, y0, w, h, C.charcoal);
  if (part === 'drums') {
    const sh = h / DRUMS.length;
    DRUMS.forEach((drum, i) => {
      const y = y0 + Math.round(i * sh), on = held?.row === i;
      if (on) px(x0, y, w, Math.round(sh), studio.erase ? C.red : base);
      if (i) px(x0, y, w, 1, C.night);
      text(drum, x0 + 6, y + sh / 2 - 4, on ? C.ink : C.grey);
      text('asdf'[i], x0 + w - 8, y + sh / 2 - 4, on ? C.ink : C.greyDark);
    });
    if (held) finger(px, C, x0 + held.x * w, y0 + (held.row + 0.5) * sh);
    return;
  }
  const cw = w / 8;
  for (let i = 0; i < 8; i++) {
    const x = x0 + Math.round(i * cw), on = held?.col === i;
    if (on) px(x, y0, Math.round(cw), h, studio.erase ? C.red : shadow);
    if (i) px(x, y0, 1, h, C.night);
    const name = part === 'bass' ? noteLetter(keyNote(beat.mood, i, BASS_C)) : padChordName(beat.mood, i);
    text(name, x + cw / 2, y0 + h - 11, on ? C.light : C.grey, 'center');
    text('asdfghjk'[i], x + cw / 2, y0 + 3, on ? C.light : C.greyDark, 'center');
  }
  if (held) finger(px, C, x0 + (held.col + 0.5) * cw, y0 + (1 - held.y) * h);
  if (part === 'bass' && studio.range) text(studio.range > 0 ? 'octave up' : 'octave down', x0 + w / 2, y0 + 12, C.grey, 'center');
}

// Where your finger holds the pad: a light dot with a soft ring.
function finger(px, C, x, y) {
  px(x - 3, y - 1, 7, 3, C.light);
  px(x - 1, y - 3, 3, 7, C.light);
  px(x - 2, y - 2, 5, 5, C.light);
}

// The Mix tab: a fader and a mute for each part, the Pump's fader, and the Pad and Vinyl switches.
function mix({ px, text, C }, studio, tone) {
  const [x0, y0, w, h] = PAD, m = studio.beat.mix;
  px(x0, y0, w, h, C.charcoal);
  const fader = (fx, value, [base, shadow], label) => {
    px(fx + 5, FADER[0], 4, FADER[1], C.night);
    const top = FADER[0] + Math.round((1 - value) * FADER[1]);
    px(fx + 5, top, 4, FADER[0] + FADER[1] - top, shadow);
    px(fx, top - 2, 14, 4, base);
    text(label, fx + 7, FADER[0] - 9, C.grey, 'center');
  };
  for (const p of PARTS) {
    fader(MIX_FADERS[p], m.levels[p], tone[p], p);
    px(MIX_FADERS[p], MUTE_Y, 14, 10, m.muted[p] ? C.red : C.night);
    text('m', MIX_FADERS[p] + 7, MUTE_Y + 1, m.muted[p] ? C.light : C.grey, 'center');
  }
  fader(MIX_FADERS.pump, m.pump, [C.gold, C.goldDark], 'pump');
  for (const [id, [x, y, sw, sh]] of Object.entries(SWITCHES)) {
    const on = m[id];
    px(x, y, sh, sh, on ? C.gold : C.night);
    text(id, x + sh + 4, y + 2, on ? C.light : C.grey);
  }
}

// The picture of the loop: bar numbers and a line on every beat; the drums as four rows of marks,
// the bass as a little piano roll, the chords as named blocks with a mark for each hit; the playhead.
function strip({ px, text, C }, studio, t, tone) {
  const [x0, y0, w, h] = STRIP, beat = studio.beat, n = beat.bars * 16, step = w / n;
  const clock = clockOf(beat), top = y0 + 9; // the lanes, under the bar numbers
  px(x0, top, w, y0 + h - top, C.ink);
  for (let b = 0; b < beat.bars; b++) text(String(b + 1), x0 + b * 16 * step + 2, y0, C.grey);
  for (let k = 0; k < n; k += 4) px(x0 + Math.round(k * step), top, 1, y0 + h - top, k % 16 === 0 ? C.greyDark : C.charcoal);
  // the drums
  const [dy] = LANES.drums;
  for (const h of beat.drums) px(x0 + Math.round(h.s * step) + 1, dy + DRUMS.indexOf(h.drum) * 2.5, Math.max(1, Math.round(step) - 1), 2, h.drum === 'kick' || h.drum === 'snare' ? tone.drums[0] : tone.drums[1]);
  // the bass, higher notes higher
  const [by, bh] = LANES.bass, notes = beat.bass.map((h) => bassNote(beat, h));
  const lo = Math.min(...notes, 99), hi = Math.max(...notes, lo + 12);
  beat.bass.forEach((b, i) => px(x0 + Math.round(b.s * step) + 1, by + bh - 2 - Math.round(((notes[i] - lo) / (hi - lo)) * (bh - 2)), Math.max(1, Math.round(b.len * step) - 1), 2, tone.bass[0]));
  // the chords: a block from each change of chord to the next, named where it fits
  const [cy, ch] = LANES.chords, hits = beat.chords;
  hits.forEach((c, i) => {
    const name = chordOf(beat, c).name, prev = hits[i - 1];
    if (!prev || chordOf(beat, prev).name !== name) {
      let j = i + 1;
      while (j < hits.length && chordOf(beat, hits[j]).name === name) j++;
      const end = j < hits.length ? hits[j].s : Math.max(c.s + c.len, hits.at(-1).s + hits.at(-1).len);
      const bx = x0 + Math.round(c.s * step) + 1, bw = Math.max(2, Math.round(Math.min(end, n) * step) + x0 - bx - 1);
      px(bx, cy, bw, ch, tone.chords[1]);
      if (bw >= name.length * 5 + 4) text(name, bx + 2, cy + 1, C.light);
    }
    px(x0 + Math.round(c.s * step) + 1, cy + ch - 2, 2, 2, tone.chords[0]);
  });
  // the playhead
  const s = clock.sixteenthAt(Math.max(0, t)), frac = (t - clock.timeOf16th(s)) / (clock.timeOf16th(s + 1) - clock.timeOf16th(s));
  const pos = (((s % n) + n) % n) + Math.max(0, Math.min(1, frac));
  if (t >= 0) px(x0 + Math.round(pos * step), top, 1, y0 + h - top, C.light);
}

// The list of beats (or, with every slot full, which of yours to replace), over the pad.
function list({ px, text, C }, studio) {
  const [x0, y0, w, h] = PAD, asking = studio.asking;
  px(x0, y0, w, h, C.ink);
  text(asking ? 'your slots are full: replace which?' : 'ready-made', x0 + 6, y0 + 3, C.gold);
  if (!asking) text('yours', x0 + 122, y0 + 3, C.gold);
  const row = ([x, y, rw], name, open, chosen, empty) => {
    if (open) px(x - 2, y - 1, rw, LIST_ROW, C.charcoal);
    text(name, x, y + 1, empty ? C.greyDark : C.light);
    if (chosen) text('busking', x + rw - 6, y + 1, C.go, 'right');
  };
  if (!asking) {
    READY.forEach((b, i) => row(listBox(i, 0), b.name, studio.open.ready === b.id, isChosen(studio, { ready: b.id })));
  }
  studio.beats.slots.forEach((b, i) => row(listBox(i, 1), b ? b.name : 'empty', studio.open.slot === i, b && isChosen(studio, { slot: i }), !b));
  if (asking) {
    text('esc: leave them all', x0 + 6, y0 + h - 12, C.grey);
    return;
  }
  for (const [id, [x, y, bw, bh]] of Object.entries(LIST_BUTTONS)) {
    const word = { new: 'new', busk: 'busk to this', close: 'close' }[id];
    px(x, y, bw, bh, id === 'busk' ? C.gold : C.charcoal);
    text(word, x + bw / 2, y + 2, id === 'busk' ? C.ink : C.light, 'center');
  }
}
````

````diff
diff --git a/open-case/src/render.js b/open-case/src/render.js
index c254788..d994c06 100644
--- a/open-case/src/render.js
+++ b/open-case/src/render.js
@@ -13,6 +13,7 @@ import {
 import { STOCK, PEDALS, owns, stockItem } from './gear.js';
 import { card, trying, CARD, BUTTON } from './shop.js';
 import { loopState } from './looper.js';
+import { drawStudio } from './studioview.js';
 
 export const W = 320, H = 180;
 const FONT = '8px Silkscreen, monospace';
@@ -139,6 +140,14 @@ export function createRenderer(g, art) {
     g.fillStyle = c;
     g.fillText(s, Math.round(x), Math.round(y));
   };
+  // Text in the 16px font, centred on x: the count-in's digit, the studio's rhythm number.
+  const big = (s, x, y, c) => {
+    g.font = '16px Silkscreen, monospace';
+    g.textAlign = 'center';
+    g.textBaseline = 'top';
+    g.fillStyle = c;
+    g.fillText(s, Math.round(x), Math.round(y));
+  };
   // A frame from the sheet, placed by its anchor.
   const sprite = (name, x, y) => {
     const f = frames[name];
@@ -464,11 +473,13 @@ export function createRenderer(g, art) {
   //   loopSaid: null | { what: 'layer' | 'full' | 'cancelled' | 'removed' | 'cleared', layer, time }
   //     (the loop pedal's last news, and when: see loopWords; with none showing, loopCue takes its
   //     place over the strip: the count-in, or the recording's progress),
-  //   shop: the shop's state (shop.js) on the shop screen, debug: null | { reported, measured } }
+  //   shop: the shop's state (shop.js) on the shop screen, studio: the studio's state (studio.js) on
+  //   the studio screen, where t is the band time of the beat it plays, debug: null | { reported, measured } }
   return function draw(view) {
     const { screen, set, scene, keys, t, time } = view;
     g.imageSmoothingEnabled = false;
     if (screen === 'shop') return shopView(view);
+    if (screen === 'studio') return drawStudio({ px, text, big, C }, view.studio, t);
     park(view);
     const flying = figures(view);
     if (set) {
````

- [ ] **Step 5: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 279 tests.

- [ ] **Step 6: Commit**

```bash
git add art/open-case/sprites.lua open-case/assets/sprites.json open-case/src/studioview.js open-case/src/beats.js open-case/src/render.js open-case/test/studioview.test.js open-case/test/render.test.js
git commit -m "Open Case: the studio's screen: Figure's layout, the rhythm wheel, the pad, the Mix, and a picture of the loop

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: The studio's controls

**Files:**
- Create: `open-case/src/studioinput.js`
- Test: create `open-case/test/studioinput.test.js`

**Interfaces:**
- Consumes:
  - `studio.js` (Task 4);
  - `studioHit`, `padAt` and `faderValue` (Task 5);
  - `MOODS` (Task 1).
- Produces: `keyDown(studio, held, e, t) -> 'leave' | null`, `keyUp(studio, held, e)`, `mouseDown(studio, drag, x, y, t) -> 'busk' | null`, `mouseMove(studio, drag, x, y)`, `mouseUp(studio, drag)`, `scroll(studio, x, y, dy)`. `held` (`{ key }`) and `drag` (`{ what, … }`) are the caller's own objects, kept between events.

- [ ] **Step 1: Write the failing tests**

Create `open-case/test/studioinput.test.js`:

````js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keyDown, keyUp, mouseDown, mouseMove, mouseUp, scroll } from '../src/studioinput.js';
import { createStudio, newBeat, advance, setTab } from '../src/studio.js';
import { NAME, TAB_BOXES, SETTINGS, WHEEL, BUTTONS, PAD } from '../src/studioview.js';
import { clockOf } from '../src/beats.js';
import { STUDIO } from '../src/tuning.js';

const empty = () => ({ slots: Array(STUDIO.slots).fill(null), chosen: null });
const mid = ([x, y, w, h]) => [x + w / 2, y + h / 2];
const key = (code, over = {}) => ({ code, repeat: false, shiftKey: false, metaKey: false, ctrlKey: false, altKey: false, ...over });
function blank() {
  const studio = createStudio(empty());
  newBeat(studio);
  return studio;
}

test('a pad key holds the pad until it comes up: A to F the drums, A to K the notes and chords', () => {
  const studio = blank(), held = { key: null };
  studio.rhythm.drums = 3; // every beat
  keyDown(studio, held, key('KeyS'), 0);
  assert.deepEqual([studio.held.part, studio.held.row], ['drums', 1]);
  advance(studio, clockOf(studio.beat).bar - STUDIO.ahead - 0.01); // just short of the next bar
  keyUp(studio, held, key('KeyS'));
  assert.equal(studio.held, null);
  assert.deepEqual(studio.beat.drums.map((h) => [h.drum, h.s]), [['snare', 0], ['snare', 4], ['snare', 8], ['snare', 12]]);
  keyDown(studio, held, key('KeyJ'), 0);
  assert.equal(studio.held, null, 'no fifth drum strip');
  setTab(studio, 'chords');
  keyDown(studio, held, key('KeyK'), 0);
  assert.deepEqual([studio.held.col, studio.held.y], [7, 0.5]);
  keyDown(studio, held, key('KeyK', { repeat: true }), 0.1);
  assert.equal(studio.held.col, 7, 'key repeat changes nothing');
});

test('arrows turn the wheel, Tab moves on a part, Backspace erases while held, Shift+Backspace clears, Cmd+Z undoes', () => {
  const studio = blank(), held = { key: null };
  keyDown(studio, held, key('ArrowDown'), 0);
  assert.equal(studio.rhythm.drums, 4);
  keyDown(studio, held, key('ArrowUp'), 0);
  keyDown(studio, held, key('ArrowUp'), 0);
  assert.equal(studio.rhythm.drums, 2);
  keyDown(studio, held, key('Tab'), 0);
  assert.equal(studio.tab, 'bass');
  keyDown(studio, held, key('KeyX'), 0);
  assert.equal(studio.range, 1, 'X: the bass an octave up');
  keyDown(studio, held, key('KeyZ'), 0);
  keyDown(studio, held, key('KeyZ'), 0);
  assert.equal(studio.range, -1);
  keyDown(studio, held, key('Backspace'), 0);
  assert.equal(studio.erase, true);
  keyUp(studio, held, key('Backspace'));
  assert.equal(studio.erase, false);
  studio.beat.bass.push({ s: 0, degree: 0, len: 4, vel: 0.8, tone: 0.5 });
  keyDown(studio, held, key('Backspace', { shiftKey: true }), 0);
  assert.deepEqual(studio.beat.bass, []);
  keyDown(studio, held, key('KeyZ', { metaKey: true }), 0);
  assert.equal(studio.beat.bass.length, 1, 'the clear, undone');
});

test('Esc closes the list, or leaves things as they were while asking, or else leaves the studio', () => {
  const studio = blank(), held = { key: null };
  studio.list = true;
  assert.equal(keyDown(studio, held, key('Escape'), 0), null);
  assert.equal(studio.list, false);
  studio.asking = { make: 'new' };
  assert.equal(keyDown(studio, held, key('Escape'), 0), null);
  assert.equal(studio.asking, null);
  assert.equal(keyDown(studio, held, key('Escape'), 0), 'leave');
});

test('the mouse holds the pad where it goes down, follows your finger, and lets go when it comes up', () => {
  const studio = blank(), drag = { what: null };
  setTab(studio, 'bass');
  studio.rhythm.bass = 6; // 8ths
  const [x0, y0, w, h] = PAD;
  mouseDown(studio, drag, x0 + 2, y0 + h / 2, 0);
  assert.equal(drag.what, 'pad');
  advance(studio, 0.2);
  mouseMove(studio, drag, x0 + w - 2, y0 + 2);
  advance(studio, 0.7);
  mouseUp(studio, drag);
  assert.equal(studio.held, null);
  assert.deepEqual(studio.beat.bass.map((b) => [b.s, b.degree, b.tone]), [[0, 0, 0.5], [2, 7, 0.98], [4, 7, 0.98]], 'then where the finger went, at the top: brightest');
});

test('a setting follows a drag up or down, and one Undo takes the whole drag back', () => {
  const studio = blank(), drag = { what: null };
  const [x, y] = mid(SETTINGS.bpm);
  mouseDown(studio, drag, x, y, 0);
  for (let dy = 1; dy <= 20; dy++) mouseMove(studio, drag, x, y - dy);
  mouseUp(studio, drag);
  assert.equal(studio.beat.bpm, 100, '2 pixels a beat per minute');
  assert.equal(studio.undo.length, 1);
  mouseDown(studio, drag, ...mid(BUTTONS.undo), 0);
  assert.equal(studio.beat.bpm, 90);
});

test('a click on the key or the length (without a drag) steps it on', () => {
  const studio = blank(), drag = { what: null };
  mouseDown(studio, drag, ...mid(SETTINGS.mood), 0);
  mouseUp(studio, drag);
  assert.equal(studio.beat.mood, 'C', 'after A minor, round to C major');
  mouseDown(studio, drag, ...mid(SETTINGS.bars), 0);
  mouseUp(studio, drag);
  assert.equal(studio.beat.bars, 1, 'after 4 bars, round to 1');
  mouseDown(studio, drag, ...mid(SETTINGS.bpm), 0);
  mouseUp(studio, drag);
  assert.equal(studio.beat.bpm, 90, 'a click on the tempo alone changes nothing');
});

test('tabs, the name, the wheel, the buttons and the scroll wheel', () => {
  const studio = blank(), drag = { what: null };
  mouseDown(studio, drag, ...mid(TAB_BOXES.chords), 0);
  assert.equal(studio.tab, 'chords');
  mouseDown(studio, drag, WHEEL[0], WHEEL[1] + 12, 0);
  assert.equal(studio.rhythm.chords, 6);
  scroll(studio, WHEEL[0], WHEEL[1], -40);
  assert.equal(studio.rhythm.chords, 5);
  scroll(studio, PAD[0] + 5, PAD[1] + 5, 40);
  assert.equal(studio.rhythm.chords, 5, 'only over the wheel');
  mouseDown(studio, drag, ...mid(BUTTONS.sound), 0);
  assert.equal(studio.beat.sounds.chords, 'nylon');
  mouseDown(studio, drag, ...mid(BUTTONS.erase), 0);
  assert.equal(studio.erase, true, 'with the mouse, Erase is a switch');
  mouseDown(studio, drag, ...mid(BUTTONS.erase), 0);
  assert.equal(studio.erase, false);
  mouseDown(studio, drag, ...mid(NAME), 0);
  assert.equal(studio.list, true);
});

test("the list: open a beat, Busk to this (so main.js keeps the choice), New, and Close", () => {
  const studio = blank(), drag = { what: null };
  studio.list = true;
  mouseDown(studio, drag, PAD[0] + 20, PAD[1] + 14 + 2 * 11 + 5, 0); // the third ready-made beat
  assert.deepEqual(studio.open, { ready: 'funk' });
  assert.equal(studio.list, false, 'opening a beat closes the list');
  studio.list = true;
  assert.equal(mouseDown(studio, drag, PAD[0] + 60, PAD[1] + 98, 0), 'busk');
  assert.deepEqual(studio.beats.chosen, { ready: 'funk' });
  studio.list = true;
  mouseDown(studio, drag, PAD[0] + 20, PAD[1] + 98, 0);
  assert.deepEqual(studio.open, { slot: 1 }, 'New: a blank beat in the next slot');
  studio.list = true;
  mouseDown(studio, drag, PAD[0] + 200, PAD[1] + 98, 0);
  assert.equal(studio.list, false);
});

test('the Mix: a fader follows the mouse as one change; a mute and the switches flip', () => {
  const studio = blank(), drag = { what: null };
  setTab(studio, 'mix');
  mouseDown(studio, drag, 111, 38 + 31, 0); // the drums fader, halfway
  assert.equal(studio.beat.mix.levels.drums, 0.5);
  mouseMove(studio, drag, 111, 38 + 62);
  mouseUp(studio, drag);
  assert.equal(studio.beat.mix.levels.drums, 0);
  assert.equal(studio.undo.length, 1);
  mouseDown(studio, drag, 104 + 7, 106 + 5, 0);
  assert.equal(studio.beat.mix.muted.drums, true);
  mouseDown(studio, drag, 275, 45, 0);
  assert.equal(studio.beat.mix.pad, true);
  mouseDown(studio, drag, 275, 61, 0);
  assert.equal(studio.beat.mix.vinyl, true);
});
````

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL. `test/studioinput.test.js` can't load: `Cannot find module '…/open-case/src/studioinput.js'`.

- [ ] **Step 3: The controls**

Create `open-case/src/studioinput.js`:

````js
// The studio's controls: the mouse is your finger on the pad, and the keys stand in for it. These turn
// key and mouse events (in scene pixels, at band time t) into studio.js's actions; main.js feeds them
// and does what they return. Pure, so it's tested in Node.
//
// Keys: A S D F the drum strips, A to K the bass notes or chords; up and down turn the rhythm wheel;
// Tab the next part; Backspace (held) erases, Shift+Backspace clears the part; Z and X move the bass
// pad down or up an octave; Cmd+Z (Ctrl+Z) undoes; Esc closes the list, or leaves.
import {
  PARTS, DRUMS, LENGTHS, press, moveTo, letGo, setErase, turnRhythm, nextTab, setTab, clearPart, undoChange, moveRange, nextSound,
  setTempo, setSwing, setMood, setLength, setLevel, setPump, toggleMute, togglePad, toggleVinyl, openBeat, newBeat, buskTo, replaceSlot,
  cancelAsk,
} from './studio.js';
import { studioHit, padAt, faderValue } from './studioview.js';
import { MOODS } from './beats.js';

const PAD_KEYS = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK'];
const KEY_VEL = 0.7, KEY_TONE = 0.5; // a drum played from its key, and a note or chord's tone
const DRAG = { bpm: 2, swing: 2, mood: 10, bars: 12 }; // pixels of drag for each step of a setting

// A key goes down. Returns what main.js should do beyond the studio: 'leave', 'busk' (save the
// choice), or null. `held` is the controls' own state: { key } for a pad key held.
export function keyDown(studio, held, e, t) {
  if (e.repeat) return null;
  if ((e.metaKey || e.ctrlKey) && e.code === 'KeyZ') {
    undoChange(studio);
    return null;
  }
  if (e.metaKey || e.ctrlKey || e.altKey) return null;
  if (e.code === 'Escape') {
    if (studio.asking) cancelAsk(studio);
    else if (studio.list) studio.list = false;
    else return 'leave';
    return null;
  }
  if (studio.asking || studio.list) return null;
  const i = PAD_KEYS.indexOf(e.code);
  if (i >= 0 && PARTS.includes(studio.tab)) {
    if (studio.tab === 'drums' && i >= DRUMS.length) return null;
    letGo(studio);
    if (press(studio, t, studio.tab === 'drums' ? { row: i, x: KEY_VEL } : { col: i, y: KEY_TONE })) held.key = e.code;
    return null;
  }
  if (e.code === 'ArrowUp' || e.code === 'ArrowDown') turnRhythm(studio, e.code === 'ArrowUp' ? -1 : 1);
  else if (e.code === 'Tab') nextTab(studio);
  else if (e.code === 'Backspace') {
    if (e.shiftKey) clearPart(studio);
    else setErase(studio, true);
  } else if ((e.code === 'KeyZ' || e.code === 'KeyX') && studio.tab === 'bass') moveRange(studio, e.code === 'KeyX' ? 1 : -1);
  return null;
}

export function keyUp(studio, held, e) {
  if (e.code === held.key) {
    letGo(studio);
    held.key = null;
  }
  if (e.code === 'Backspace') setErase(studio, false);
}

// The mouse goes down at (x, y). Returns 'busk' after Busk to this, or null. `drag` is the controls'
// state for what the mouse holds until it comes up.
export function mouseDown(studio, drag, x, y, t) {
  const target = studioHit(studio, x, y);
  drag.what = null;
  if (!target) return null;
  switch (target.hit) {
    case 'replace':
      replaceSlot(studio, target.slot);
      break;
    case 'keep':
      cancelAsk(studio);
      break;
    case 'open':
      openBeat(studio, target.which);
      break;
    case 'new':
      newBeat(studio);
      studio.list = false;
      break;
    case 'busk':
      buskTo(studio);
      studio.list = false;
      return 'busk';
    case 'close':
      studio.list = false;
      break;
    case 'name':
      studio.list = !studio.list;
      break;
    case 'tab':
      setTab(studio, target.tab);
      break;
    case 'wheel':
      turnRhythm(studio, target.dir);
      break;
    case 'button':
      button(studio, target.which);
      break;
    case 'pad':
      if (press(studio, t, target.at)) drag.what = 'pad';
      break;
    case 'setting':
      drag.what = 'setting';
      Object.assign(drag, { which: target.which, y, from: settingIndex(studio, target.which), begun: false, moved: false });
      break;
    case 'fader':
      fader(studio, target.which, target.value, false);
      Object.assign(drag, { what: 'fader', which: target.which });
      break;
    case 'mute':
      toggleMute(studio, target.part);
      break;
    case 'switch':
      if (target.which === 'pad') togglePad(studio);
      else toggleVinyl(studio);
      break;
  }
  return null;
}

function button(studio, which) {
  if (which === 'sound') nextSound(studio);
  else if (which === 'range') moveRange(studio, studio.range === 1 ? -2 : 1);
  else if (which === 'erase') setErase(studio, !studio.erase); // a mouse can't hold two things: here it's a switch
  else if (which === 'clear') clearPart(studio);
  else if (which === 'undo') undoChange(studio);
}

function fader(studio, which, value, again) {
  if (which === 'pump') setPump(studio, value, again);
  else setLevel(studio, which, value, again);
}

// Where a setting is, as a number a drag moves: the tempo, the swing in percent, the mood's place,
// the length's place.
function settingIndex(studio, which) {
  const b = studio.beat;
  return { bpm: b.bpm, swing: Math.round(b.swing * 100), mood: MOODS.findIndex((m) => m.id === b.mood), bars: LENGTHS.indexOf(b.bars) }[which];
}

function setSetting(studio, which, v, again) {
  if (which === 'bpm') setTempo(studio, v, again);
  else if (which === 'swing') setSwing(studio, v / 100, again);
  else if (which === 'mood') setMood(studio, MOODS[((v % MOODS.length) + MOODS.length) % MOODS.length].id, again);
  else setLength(studio, LENGTHS[Math.max(0, Math.min(LENGTHS.length - 1, v))], again);
}

// The mouse moves to (x, y) while down: the finger moves on the pad, or a setting or fader follows.
export function mouseMove(studio, drag, x, y) {
  if (drag.what === 'pad') moveTo(studio, padAt(studio.tab, x, y));
  else if (drag.what === 'fader') fader(studio, drag.which, faderValue(y), true);
  else if (drag.what === 'setting') {
    const steps = Math.trunc((drag.y - y) / DRAG[drag.which]);
    if (!steps && !drag.moved) return;
    drag.moved = true;
    const before = studio.version;
    setSetting(studio, drag.which, drag.from + steps, drag.begun);
    if (studio.version !== before) drag.begun = true;
  }
}

// The mouse comes up: the finger lets go. A setting clicked without a drag steps on: the key to the
// next mood, the length to the next.
export function mouseUp(studio, drag) {
  if (drag.what === 'pad') letGo(studio);
  if (drag.what === 'setting' && !drag.moved && (drag.which === 'mood' || drag.which === 'bars')) {
    setSetting(studio, drag.which, drag.which === 'bars' ? (drag.from + 1) % LENGTHS.length : drag.from + 1, false);
  }
  drag.what = null;
}

// The scroll wheel over the rhythm wheel turns it.
export function scroll(studio, x, y, dy) {
  const target = studioHit(studio, x, y);
  if (target?.hit === 'wheel' && dy) turnRhythm(studio, Math.sign(dy));
}
````

- [ ] **Step 4: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 288 tests.

- [ ] **Step 5: Commit**

```bash
git add open-case/src/studioinput.js open-case/test/studioinput.test.js
git commit -m "Open Case: the studio's controls: the mouse as your finger on the pad, and the keys standing in for it

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: The studio in the shop and in the game

**Files:**
- Modify: `open-case/src/tuning.js`, `gear.js`, `shop.js`, `log.js`, `main.js`, `open-case/index.html`
- Modify: `art/open-case/draw.lua`, `shop.lua`, `sprites.lua`
- Regenerate: `open-case/assets/sprites.png`, `sprites.json`
- Test: `open-case/test/gear.test.js`, `shop.test.js`, `page.test.js`

**Interfaces:**
- Consumes: everything above.
- Produces:
  - `SHOP.studio` (150 coins), and the stock's last item `{ id: 'studio', kind: 'studio', name: 'Studio', about: 'Make your own beats to busk to.' }`;
  - its card: "After a set: Studio, on the end card";
  - the groovebox on the counter (`item-studio-0` and `-1`);
  - the end card's `#studio` button, shown once the studio is yours;
  - the `'studio'` screen in `main.js`, whose sets play `setBeat()`: `?beat=`'s, or with the studio yours, the one you chose, or else the lo-fi;
  - the log's `beat`, and its 'studio' choice.

- [ ] **Step 1: Write the failing tests**

````diff
diff --git a/open-case/test/gear.test.js b/open-case/test/gear.test.js
index 664e9c6..d150a28 100644
--- a/open-case/test/gear.test.js
+++ b/open-case/test/gear.test.js
@@ -9,13 +9,14 @@ function memoryStorage() {
 }
 const withSavings = (savings) => ({ ...freshGear(), savings });
 
-test('the stock: five pedals on keys 2 to 6 in chain order, the loop pedal, then the instruments, priced from tuning.js', () => {
-  assert.deepEqual(STOCK.map((s) => s.id), ['overdrive', 'chorus', 'tremolo', 'delay', 'reverb', 'loop', ACOUSTIC, 'ukulele', 'electric', 'epiano', 'synth']);
+test('the stock: five pedals on keys 2 to 6 in chain order, the loop pedal, the instruments, then the studio, priced from tuning.js', () => {
+  assert.deepEqual(STOCK.map((s) => s.id), ['overdrive', 'chorus', 'tremolo', 'delay', 'reverb', 'loop', ACOUSTIC, 'ukulele', 'electric', 'epiano', 'synth', 'studio']);
   assert.deepEqual(PEDALS, ['overdrive', 'chorus', 'tremolo', 'delay', 'reverb']);
   assert.deepEqual(PEDALS.map((id) => STOCK.find((s) => s.id === id).key), [2, 3, 4, 5, 6]);
   assert.deepEqual(INSTRUMENTS, [ACOUSTIC, 'ukulele', 'electric', 'epiano', 'synth']);
   for (const item of STOCK) if (item.id !== ACOUSTIC) assert.equal(item.price, SHOP[item.id].price, item.id);
-  assert.equal(STOCK.reduce((sum, item) => sum + item.price, 0), 1050, 'the whole stock costs 1050 coins');
+  assert.equal(STOCK.find((s) => s.id === 'studio').price, 150);
+  assert.equal(STOCK.reduce((sum, item) => sum + item.price, 0), 1200, 'the whole stock costs 1200 coins');
   for (const item of STOCK) assert.ok(item.name && item.about.length <= 48, `${item.id}: a name, and a line that fits the card`);
 });
 
````

````diff
diff --git a/open-case/test/shop.test.js b/open-case/test/shop.test.js
index 0481803..6c8d062 100644
--- a/open-case/test/shop.test.js
+++ b/open-case/test/shop.test.js
@@ -11,7 +11,7 @@ test('the arrow keys move along the stock and wrap round it', () => {
   const shop = createShop();
   assert.equal(chosen(shop).id, 'overdrive', 'the rack comes first');
   move(shop, -1);
-  assert.equal(chosen(shop).id, 'synth', 'left from the first is the last');
+  assert.equal(chosen(shop).id, 'studio', 'left from the first is the last: the groovebox on the counter');
   move(shop, 1);
   move(shop, 1);
   assert.equal(chosen(shop).id, 'chorus');
@@ -111,3 +111,17 @@ test('choosing the loop pedal starts a loop to try it with, yours or not; moving
   choose(shop, at('synth'));
   assert.equal(shop.loop, null, 'a click on something else throws it away too');
 });
+
+test("the studio's card: 150 coins, and once it's yours, where to find it", () => {
+  const gear = withSavings(149);
+  assert.deepEqual(card(shopOn('studio'), gear), {
+    name: 'Studio', price: '150 coins', about: 'Make your own beats to busk to.', says: 'Not enough coins yet (you have 149)', button: null,
+  });
+  gear.savings = 150;
+  assert.deepEqual(action(shopOn('studio'), gear), { act: 'buy', id: 'studio' });
+  buy(gear, 'studio');
+  assert.deepEqual(card(shopOn('studio'), gear), {
+    name: 'Studio', price: 'yours', about: 'Make your own beats to busk to.', says: 'After a set: Studio, on the end card', button: null,
+  });
+  assert.deepEqual(trying(shopOn('studio'), gear), { instrument: ACOUSTIC, on: [] }, 'trying it changes nothing you hear');
+});
````

````diff
diff --git a/open-case/test/page.test.js b/open-case/test/page.test.js
index 43b130f..f779bf8 100644
--- a/open-case/test/page.test.js
+++ b/open-case/test/page.test.js
@@ -25,3 +25,7 @@ test('the page loads the game as a module, with its icon and the Silkscreen font
 test('the sound check has a choice of beats', () => {
   assert.match(html, /<label>Beat <select id="sound-beat"><\/select><\/label>/);
 });
+
+test('the end card has a Studio button, hidden until the studio is yours', () => {
+  assert.match(html, /<button id="studio" type="button" hidden>Studio<\/button>/);
+});
````

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL, 4 of 290:
- "the stock: five pedals on keys 2 to 6 in chain order, the loop pedal, the instruments, then the studio, priced from tuning.js";
- "the end card has a Studio button, hidden until the studio is yours";
- "the arrow keys move along the stock and wrap round it";
- "the studio's card: 150 coins, and once it's yours, where to find it".

- [ ] **Step 3: The studio in the stock, and its card**

````diff
diff --git a/open-case/src/tuning.js b/open-case/src/tuning.js
index a3cb2fd..708e638 100644
--- a/open-case/src/tuning.js
+++ b/open-case/src/tuning.js
@@ -151,6 +151,7 @@ export const SHOP = {
   electric: { price: 150 },
   epiano: { price: 200 },
   synth: { price: 250 },
+  studio: { price: 150 },
 };
 
 // The studio (studio.js): your slots, how far back Undo goes, how late a press can be and still catch
````

````diff
diff --git a/open-case/src/gear.js b/open-case/src/gear.js
index 3d731df..707c000 100644
--- a/open-case/src/gear.js
+++ b/open-case/src/gear.js
@@ -9,7 +9,7 @@ export const ACOUSTIC = 'acoustic';
 
 // Everything in the shop, in the order you move through it: the pedals on the rack (the loop pedal
 // last, since R and Backspace work it rather than a number key), then the instruments on their
-// stands. Each price and pedal key is from tuning.js.
+// stands, then the studio's groovebox on the counter. Each price and pedal key is from tuning.js.
 export const STOCK = [
   { id: 'overdrive', kind: 'pedal', name: 'Overdrive', about: 'Warm grit, more of it the harder you pick.' },
   { id: 'chorus', kind: 'pedal', name: 'Chorus', about: 'A slow shimmer, like two guitars at once.' },
@@ -22,6 +22,7 @@ export const STOCK = [
   { id: 'electric', kind: 'instrument', name: 'Electric guitar', about: 'A clean tone that sings, through a small amp.' },
   { id: 'epiano', kind: 'instrument', name: 'Electric piano', about: 'A bell-like tone. Space is its sustain pedal.' },
   { id: 'synth', kind: 'instrument', name: 'Synth', about: 'A soft saw-wave lead. Space holds its notes.' },
+  { id: 'studio', kind: 'studio', name: 'Studio', about: 'Make your own beats to busk to.' },
 ].map((item) => ({ price: 0, key: null, ...item, ...SHOP[item.id] }));
 
 export const stockItem = (id) => STOCK.find((item) => item.id === id) ?? null;
````

````diff
diff --git a/open-case/src/shop.js b/open-case/src/shop.js
index e07cd02..733b0f4 100644
--- a/open-case/src/shop.js
+++ b/open-case/src/shop.js
@@ -49,6 +49,7 @@ export function card(shop, gear) {
   if (!mine) says = act ? 'Enter to buy' : `Not enough coins yet (you have ${gear.savings})`;
   else if (item.kind === 'pedal') says = `On your board: key ${item.key}`;
   else if (item.kind === 'loop') says = 'On your board: R';
+  else if (item.kind === 'studio') says = 'After a set: Studio, on the end card';
   else says = act ? 'Enter to play it' : "You're playing it";
   return { name: item.name, price: mine ? 'yours' : `${item.price} coins`, about: item.about, says, button: act?.act ?? null };
 }
````

- [ ] **Step 4: The groovebox on the counter**

````diff
diff --git a/art/open-case/draw.lua b/art/open-case/draw.lua
index 3624dc0..3ac6b87 100644
--- a/art/open-case/draw.lua
+++ b/art/open-case/draw.lua
@@ -78,6 +78,7 @@ local PX = {
   n = C.path[2], N = C.path[1],
   a = C.skin3[2], A = C.skin3[1], m = C.skin4[2], M = C.skin4[1], -- tan and deep brown skin
   f = C.rose[2], F = C.rose[1], j = C.teal[2], J = C.teal[1], x = C.auburn, z = C.blonde,
+  O = C.sky[6], -- the studio's drums orange (the groovebox's pads)
 }
 D.PX = PX
 
````

````diff
diff --git a/art/open-case/shop.lua b/art/open-case/shop.lua
index 5fc9f23..48828f5 100644
--- a/art/open-case/shop.lua
+++ b/art/open-case/shop.lua
@@ -1,7 +1,8 @@
 -- The music shop in the flat style, for the sprite sheet (sprites.lua): the room (the door with its
 -- "back to the park" sign, the window onto the park at dusk, the pedal rack, the chalkboard, the
--- floor), the counter in front of the shopkeeper, the shopkeeper, and the stock on display, each item
--- as it stands and as it looks chosen (lifted two pixels and lit up). Everything is drawn where it
+-- floor), the counter in front of the shopkeeper, the shopkeeper, and the stock on display (the pedals
+-- on the rack, the instruments on the floor, the studio's groovebox on the counter), each item as it
+-- stands and as it looks chosen (lifted two pixels and lit up). Everything is drawn where it
 -- goes on the game's 320x180 screen; the card along the bottom (y 138 down) and the words on the
 -- sign and the chalkboard are drawn by render.js.
 local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
@@ -21,6 +22,7 @@ S.BOARD = { 248, 10, 314, 44 } -- the chalkboard (the savings: render.js)
 S.COUNTER = { 232, 74, W - 1, 112 }
 S.KEEPER = { 266, 74 } -- the shopkeeper's middle, and the counter's top where she stands behind it
 S.LIFT = 2 -- pixels a chosen item rises
+S.GROOVEBOX = { 234, 66 } -- the studio's groovebox: its top-left, on the counter left of the shopkeeper
 
 -- Where each item stands: a pedal's top-left on the rack's shelf (the pedals, then the wider loop
 -- pedal), or a guitar's or keyboard's place on the floor ({ x of the middle for a guitar, x of the
@@ -318,7 +320,21 @@ local function uprightGuitar(b, id, lift)
   stamp(b, x - #g.head[1] // 2, top - g.neck - #g.head, g.head)
 end
 
+-- The studio's groovebox, 17 by 8, on the counter: a little screen, two knobs, and pads in the
+-- studio's colours for its parts (orange drums, blue bass, green chords).
+local GROOVEBOX = {
+  "hhhhhhhhhhhhhhhhh",
+  "hkkkkkkkkkkkkkkkh",
+  "hkooookOOkuukookh",
+  "hkooookOOkuukookh",
+  "hkkkkkkkkkkkkkkkh",
+  "hkwkwkkOOkuukookh",
+  "hkkkkkkOOkuukookh",
+  "hhhhhhhhhhhhhhhhh",
+}
+
 local function displayed(b, id, lift)
+  if id == "studio" then return stamp(b, S.GROOVEBOX[1], S.GROOVEBOX[2] - lift, GROOVEBOX) end
   if RACK_X[id] then return rackPedal(b, id, lift) end
   if UPRIGHT[id] then
     D.shadow(b, FLOOR_AT[id], S.STANDS + 0.5, 8, 1.5)
@@ -345,7 +361,7 @@ end
 local LIGHTER = {
   [C.wood[1]] = C.wood[2], [C.wood[2]] = C.wood[3], [C.red[1]] = C.red[2], [C.yellow[1]] = C.yellow[2],
   [C.blue[1]] = C.blue[2], [C.sky[3]] = C.sky[4], [C.leaf[3]] = C.go, [C.ink] = C.charcoal,
-  [C.charcoal] = C.coat[1], [C.coat[2]] = C.light,
+  [C.charcoal] = C.coat[1], [C.coat[2]] = C.light, [C.sky[6]] = C.sky[7],
 }
 
 -- An item of stock as it stands in the shop (chosen: lifted and lit up), with its hit box for clicks
````

````diff
diff --git a/art/open-case/sprites.lua b/art/open-case/sprites.lua
index 3d09611..e81e69e 100644
--- a/art/open-case/sprites.lua
+++ b/art/open-case/sprites.lua
@@ -123,7 +123,7 @@ for f = 0, 1 do add("bird-" .. f, 7, 3, 3, 1, function(b) F.bird(b, f, 3, 1) end
 
 -- The music shop: the room, the counter (drawn over the shopkeeper), the shopkeeper breathing (0, 1)
 -- and nodding at a sale (2, 3), the stock as it stands and chosen, and the tags
-local STOCK = { "overdrive", "chorus", "tremolo", "delay", "reverb", "loop", "acoustic", "ukulele", "electric", "epiano", "synth" }
+local STOCK = { "overdrive", "chorus", "tremolo", "delay", "reverb", "loop", "acoustic", "ukulele", "electric", "epiano", "synth", "studio" }
 screen("shop-room", S.room)
 screen("shop-counter", S.counter)
 for f = 0, 3 do screen("keeper-" .. f, function(b) S.keeper(b, f) end) end
````

Rebuild from the repo root: `/Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/sprites.lua`.
- Expected: `sprites: 552 frames on a 512x1968 sheet, 49 colours`.
- Run it again: `git status` must show nothing new since the first run.

- [ ] **Step 5: The Studio button, the studio's screen in the game, and the beat your sets play**

````diff
diff --git a/open-case/index.html b/open-case/index.html
index 2cab1a7..f2bfe36 100644
--- a/open-case/index.html
+++ b/open-case/index.html
@@ -39,7 +39,7 @@
     <p id="end-saved"></p>
     <p id="end-stopped"></p>
     <p id="end-longest"></p>
-    <div class="row"><button id="again" type="button">Another set</button><button id="shop" type="button">Visit the shop</button><button id="stop" type="button">Stop here</button></div>
+    <div class="row"><button id="again" type="button">Another set</button><button id="shop" type="button">Visit the shop</button><button id="studio" type="button" hidden>Studio</button><button id="stop" type="button">Stop here</button></div>
     <div id="end-debug" hidden>
       <div class="row"><button id="bots" type="button">Run the bots</button></div>
       <p id="bots-result"></p>
````

````diff
diff --git a/open-case/src/main.js b/open-case/src/main.js
index 7bc3e44..ac88371 100644
--- a/open-case/src/main.js
+++ b/open-case/src/main.js
@@ -32,6 +32,9 @@ import { PEDALS, loadGear, saveGear, earn, buy, play, stomp, stockItem, owns } f
 import { createShop, choose, move, action, trying, hit } from './shop.js';
 import { createLoop, record, note, release, ring, step, undo, due, countBeats } from './looper.js';
 import { LOFI, clockOf, readyBeat } from './beats.js';
+import { createStudio, loadBeats, saveBeats, chosenBeat, advance } from './studio.js';
+import { keyDown, keyUp, mouseDown, mouseMove, mouseUp, scroll } from './studioinput.js';
+import { studioHit } from './studioview.js';
 import { DT, LAYERS, PARK } from './tuning.js';
 
 // The module is running, so the page's "couldn't start" message will never be needed.
@@ -79,9 +82,8 @@ function game(art) {
   const t0 = performance.now();
   const pageTime = () => (performance.now() - t0) / 1000; // seconds since the page opened
 
-  let screen = 'title'; // 'ready' (waiting for your first note), 'playing', 'paused', 'over', 'shop', 'thanks'
+  let screen = 'title'; // 'ready' (waiting for your first note), 'playing', 'paused', 'over', 'shop', 'studio', 'thanks'
   let set = null, scene = createScene(pageSeed), start = 0, seed = 0;
-  let beat = fixedBeat ?? LOFI; // the beat your sets play (beats.js)
   let botMoments = null, botNext = 0, botFed = 0;
   const latency = { reported: null, measured: null };
   // Your savings and gear. With ?coins=N your savings are N, and nothing is kept.
@@ -92,6 +94,14 @@ function game(art) {
   // on a ?coins page (earn, below); they're just never kept, same as keep() above.
   const logging = !bot && debugSavings === null;
   let shop = null; // the shop's state (shop.js) while you're in it
+  // Your beats (studio.js): six slots and the one your sets play, kept like your gear (not on a ?coins
+  // page). The studio's state while you're in it, and the last change of its beat handed to the band.
+  const beats = loadBeats(storage);
+  const keepBeats = () => debugSavings === null && saveBeats(storage, beats);
+  let studio = null, studioSeen = -1, studioSaved = true;
+  const studioHeld = { key: null }, studioDrag = { what: null };
+  // The beat your sets play: ?beat='s, or with the studio yours, the one you chose there; else the lo-fi.
+  const setBeat = () => fixedBeat ?? (owns(gear, 'studio') ? chosenBeat(beats) : LOFI);
   let stomped = null; // the last pedal stomped: { id, on, time } (its name shows over the gear strip)
   let setPedals = new Set(); // every pedal that's been on during this set, for the log
   // The loop pedal's loop in a set, empty at each set's start (in the shop, the one you try it with
@@ -120,10 +130,10 @@ function game(art) {
   // A new set begins with a note at audio time `at` (your first note, or the bot's start).
   function begin(at) {
     seed = fixedSeed ?? Date.now() % 2147483647;
-    set = createSet(seed, beat);
+    set = createSet(seed, setBeat());
     scene = createScene(seed, { bar: set.clock.bar, parkBar: endTime(set) / PARK.bars });
     start = at;
-    audio.startBand(at, beat);
+    audio.startBand(at, set.beat);
     for (const { id, min } of LAYERS) audio.setLayer(id, min === 0, at);
     setPedals = new Set(gear.on);
     loop = createLoop(set.clock);
@@ -166,7 +176,7 @@ function game(art) {
       shopBand = !shopBand;
       if (shopBand) {
         start = audio.now() + 0.1;
-        audio.tryBand(start, beat);
+        audio.tryBand(start, setBeat());
         ring(shop.loop, 0, ringHeld);
       } else audio.stopBand();
     }
@@ -343,13 +353,14 @@ function game(art) {
     // The log is Nathan's own too, and also skips a ?coins page: see `logging` above.
     if (logging) {
       const pedals = PEDALS.filter((id) => setPedals.has(id));
-      logSet(storage, { date: new Date().toISOString(), coins: s.coins, stopped: s.stopped, instrument: gear.instrument, pedals, layers: setLayers });
+      logSet(storage, { date: new Date().toISOString(), coins: s.coins, stopped: s.stopped, instrument: gear.instrument, pedals, layers: setLayers, beat: set.beat.name });
     }
     loop = createLoop(); // the loop belongs to the set, and it's over
     document.getElementById('end-coins').textContent = `${s.coins} coin${s.coins === 1 ? '' : 's'} in the case.`;
     document.getElementById('end-saved').textContent = `Saved: ${gear.savings} coin${gear.savings === 1 ? '' : 's'}.`;
     document.getElementById('end-saved').hidden = !!bot;
     document.getElementById('shop').hidden = !!bot;
+    document.getElementById('studio').hidden = !!bot || !owns(gear, 'studio');
     document.getElementById('end-stopped').textContent = `${s.stopped} ${s.stopped === 1 ? 'person' : 'people'} stopped to listen.`;
     document.getElementById('end-longest').textContent = s.longest
       ? `${personName(s.longest.kind, art.data.looks[s.longest.kind][s.longest.look])} stayed longest: ${Math.round(s.longest.seconds)} seconds.`
@@ -366,7 +377,7 @@ function game(art) {
     const sets = readLog(storage).map((e) => ({
       date: e.date,
       text: `${e.coins} coins, ${e.stopped} stopped, ${[e.instrument ?? 'acoustic', ...(e.pedals ?? [])].join(' + ')}, `
-        + `${e.layers ? `${e.layers} loop layer${e.layers === 1 ? '' : 's'}, ` : ''}${e.choice ?? 'no choice yet'}`,
+        + `${e.layers ? `${e.layers} loop layer${e.layers === 1 ? '' : 's'}, ` : ''}${e.beat ? `${e.beat}, ` : ''}${e.choice ?? 'no choice yet'}`,
     }));
     const buys = readBuys(storage).map((e) => ({ date: e.date, text: `bought the ${stockItem(e.id)?.name.toLowerCase() ?? e.id} for ${e.price}` }));
     document.getElementById('log').replaceChildren(...[...sets, ...buys].sort((a, b) => b.date.localeCompare(a.date)).map((e) => {
@@ -398,11 +409,68 @@ function game(art) {
     audio.stopBand();
     set = null;
     scene = createScene(pageSeed);
-    shop = createShop(clockOf(beat));
+    shop = createShop(clockOf(setBeat()));
     screen = 'shop';
     sound();
   });
 
+  // The studio: its beat plays round and round, every part at once, while you make it. Esc leaves for
+  // the park, ready for the next set.
+  document.getElementById('studio').addEventListener('click', () => {
+    if (logging) logChoice(storage, 'studio');
+    end.hidden = true;
+    audio.stopBand();
+    set = null;
+    scene = createScene(pageSeed);
+    studio = createStudio(beats);
+    studioSeen = studio.version;
+    const at = audio.now() + 0.1;
+    audio.startBand(at, studio.beat);
+    for (const { id } of LAYERS) audio.setLayer(id, true, at);
+    screen = 'studio';
+  });
+  function leaveStudio() {
+    keepBeats();
+    studio = null;
+    audio.stopBand();
+    screen = 'ready';
+    canvas.style.cursor = '';
+  }
+  const bandTime = () => audio.now() - audio.bandStart;
+  addEventListener('keydown', (e) => {
+    if (screen !== 'studio') return;
+    if (e.code === 'Tab' || e.code === 'Backspace' || e.code.startsWith('Arrow') || ((e.metaKey || e.ctrlKey) && e.code === 'KeyZ')) e.preventDefault();
+    const what = keyDown(studio, studioHeld, e, bandTime());
+    if (what === 'leave') leaveStudio();
+  });
+  addEventListener('keyup', (e) => {
+    if (screen === 'studio') keyUp(studio, studioHeld, e);
+  });
+  // Where the mouse is, in scene pixels.
+  const scenePoint = (e) => {
+    const r = canvas.getBoundingClientRect();
+    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
+  };
+  canvas.addEventListener('mousedown', (e) => {
+    if (screen !== 'studio' || e.button !== 0) return;
+    e.preventDefault();
+    if (mouseDown(studio, studioDrag, ...scenePoint(e), bandTime()) === 'busk') keepBeats();
+  });
+  addEventListener('mousemove', (e) => {
+    if (screen !== 'studio') return;
+    const [x, y] = scenePoint(e);
+    if (studioDrag.what) mouseMove(studio, studioDrag, x, y);
+    else canvas.style.cursor = studioHit(studio, x, y) ? 'pointer' : '';
+  });
+  addEventListener('mouseup', () => {
+    if (screen === 'studio') mouseUp(studio, studioDrag);
+  });
+  canvas.addEventListener('wheel', (e) => {
+    if (screen !== 'studio') return;
+    e.preventDefault();
+    scroll(studio, ...scenePoint(e), e.deltaY);
+  }, { passive: false });
+
   // The shop: the arrow keys choose, Enter buys (or plays an instrument you own), Esc or the door
   // leaves for the park, ready for the next set.
   function leaveShop() {
@@ -460,6 +528,8 @@ function game(art) {
       get set() { return set; },
       get scene() { return scene; },
       get shop() { return shop; },
+      get studio() { return studio; },
+      beats,
       get loop() { return heardLoop(); },
       audio, input, latency, art, flocks, gear,
     };
@@ -477,6 +547,21 @@ function game(art) {
         }
         stepScene(scene, set.t);
       }
+      // The studio: a held pad writes as the playhead reaches it, and the notes on 16ths the band had
+      // already scheduled are played for it; each change of the beat goes to the band, and is kept once
+      // you let go.
+      if (studio) {
+        for (const w of advance(studio, bandTime())) audio.playWritten(w.layer, w.notes, w.s);
+        if (studio.version !== studioSeen) {
+          audio.setBeat(studio.beat);
+          studioSeen = studio.version;
+          studioSaved = false;
+        }
+        if (!studioSaved && !studio.held) {
+          keepBeats();
+          studioSaved = true;
+        }
+      }
       // The loop: a recording moves on (and in a set, a finished one counts for the log, and says so
       // over the strip), and the notes due soon are scheduled with the band's; in the park, each rises
       // from the loop pedal.
@@ -490,7 +575,8 @@ function game(art) {
       latency.reported = audio.reportedLatency();
       draw({
         screen: screen === 'thanks' || screen === 'over' ? 'playing' : screen,
-        set, scene, keys: input.keys, t: set ? set.t : shop?.loop ? audio.now() - start : 0, bars: set ? set.t / (endTime(set) / PARK.bars) : skyBar,
+        set, scene, keys: input.keys, t: set ? set.t : studio ? bandTime() : shop?.loop ? audio.now() - start : 0,
+        bars: set ? set.t / (endTime(set) / PARK.bars) : skyBar, studio,
         time: (now - t0) / 1000, still: reducedMotion.matches, flocks, gear, stomp: stomped, shop,
         loop: shop ? shop.loop : set ? loop : null, loopSaid,
         debug: debug ? latency : null,
````

````diff
diff --git a/open-case/src/log.js b/open-case/src/log.js
index 836b019..aad3ac6 100644
--- a/open-case/src/log.js
+++ b/open-case/src/log.js
@@ -1,7 +1,8 @@
 // The test log: this computer remembers the last LOG_SIZE sets (the date, coins, how many stopped, the
-// instrument played, the pedals that were on at any point, how many loop layers were recorded, and
-// whether Nathan chose Another set, Stop here or Visit the shop), under open-case-log in local
-// storage; and the last LOG_SIZE things he bought, with their dates, under open-case-buys.
+// instrument played, the pedals that were on at any point, how many loop layers were recorded, the
+// beat played, and whether Nathan chose Another set, Stop here, Visit the shop or Studio), under
+// open-case-log in local storage; and the last LOG_SIZE things he bought, with their dates, under
+// open-case-buys.
 import { LOG_SIZE } from './tuning.js';
 
 const KEY = 'open-case-log', BUYS = 'open-case-buys';
@@ -18,8 +19,8 @@ function readList(storage, key) {
 export const readLog = (storage) => readList(storage, KEY);
 export const readBuys = (storage) => readList(storage, BUYS);
 
-// A set just ended: { date, coins, stopped, instrument, pedals, layers }. Its choice is filled in
-// when a button is pressed.
+// A set just ended: { date, coins, stopped, instrument, pedals, layers, beat }. Its choice is filled
+// in when a button is pressed.
 export function logSet(storage, entry) {
   const list = readLog(storage);
   list.push({ ...entry, choice: null });
@@ -33,7 +34,7 @@ export function logBuy(storage, entry) {
   storage.set(BUYS, JSON.stringify(list.slice(-LOG_SIZE)));
 }
 
-// 'another', 'stop' or 'shop', for the latest set.
+// 'another', 'stop', 'shop' or 'studio', for the latest set.
 export function logChoice(storage, choice) {
   const list = readLog(storage);
   if (!list.length) return;
````

- [ ] **Step 6: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 290 tests.

- [ ] **Step 7: Commit**

```bash
git add open-case/src/tuning.js open-case/src/gear.js open-case/src/shop.js open-case/src/main.js open-case/src/log.js open-case/index.html art/open-case/shop.lua art/open-case/draw.lua art/open-case/sprites.lua open-case/assets/sprites.png open-case/assets/sprites.json open-case/test/gear.test.js open-case/test/shop.test.js open-case/test/page.test.js
git commit -m "Open Case: the studio in the shop for 150 coins, a Studio button on the end card, and your sets play the beat you choose

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: The docs, and a check in Chrome

**Files:**
- Modify: `README.md`, `docs/superpowers/specs/2026-09-30-open-case-studio-design.md`

- [ ] **Step 1: The README**

````diff
diff --git a/README.md b/README.md
index 757893e..819b680 100644
--- a/README.md
+++ b/README.md
@@ -77,18 +77,19 @@ That writes the editable `art/snake-icon.aseprite` and the `snake/icon.png` the
 
 ## Open Case
 
-`open-case/` is a busking game, a work in progress. You improvise on the computer keyboard, laid out like GarageBand's Musical Typing, over a lo-fi loop, and passers-by stop, stay and tip according to what you play. Four kinds walk by, joggers, elders, students and commuters, each with their own taste, and six different people of each kind. Repeating yourself bores them, off-key notes on strong beats make them frown, and an earlier idea brought back changed earns a coin. The band gains layers as the crowd grows. The coins you earn are saved, and between sets a music shop sells five pedals, which you stomp on keys 2 to 6 while you play, four more instruments, and a loop pedal: R records 4 bars of your notes that play on under you, up to three layers, and Backspace takes the last one off. The design spec is `docs/superpowers/specs/2026-09-28-open-case-design.md`, the shop's is `docs/superpowers/specs/2026-09-28-open-case-shop-design.md`, the loop pedal's is `docs/superpowers/specs/2026-09-29-open-case-loop-pedal-design.md`, and the passers-by's is `docs/superpowers/specs/2026-09-29-open-case-passers-by-design.md`.
+`open-case/` is a busking game, a work in progress. You improvise on the computer keyboard, laid out like GarageBand's Musical Typing, over the band's beat (a lo-fi loop, unless you've made your own), and passers-by stop, stay and tip according to what you play. Four kinds walk by, joggers, elders, students and commuters, each with their own taste, and six different people of each kind. Repeating yourself bores them, off-key notes on strong beats make them frown, and an earlier idea brought back changed earns a coin. The band gains layers as the crowd grows. The coins you earn are saved, and between sets a music shop sells five pedals, which you stomp on keys 2 to 6 while you play, four more instruments, and a loop pedal: R records 4 bars of your notes that play on under you, up to three layers, and Backspace takes the last one off. The shop also sells the studio, where you make your own beats to busk to the way Figure makes them: pick a rhythm, hold the pad, and it's written into the loop as it goes round. It comes with five ready-made beats (lo-fi, bossa nova, funk, reggae and a slow ballad), keeps six of your own, and "Busk to this" picks the beat your sets play. The design spec is `docs/superpowers/specs/2026-09-28-open-case-design.md`, the shop's is `docs/superpowers/specs/2026-09-28-open-case-shop-design.md`, the loop pedal's is `docs/superpowers/specs/2026-09-29-open-case-loop-pedal-design.md`, the passers-by's is `docs/superpowers/specs/2026-09-29-open-case-passers-by-design.md`, and the studio's is `docs/superpowers/specs/2026-09-30-open-case-studio-design.md`.
 
 - Tests (Node 22, no dependencies): `cd open-case && npm test`. The headline test plays a scripted honest set against a random bot and a lick bot over ten seeds. The art tests check the committed sprite sheet against what the game draws.
 - Debug:
-  - `?sound` is the sound check: the band with a switch per layer, and every instrument and pedal in the shop to try on the keys, the loop pedal too.
+  - `?sound` is the sound check: the band with a switch per layer and a choice of the ready-made beats, and every instrument and pedal in the shop to try on the keys, the loop pedal too.
   - `?debug` shows each listener's interest and the last rule they heard, and a corner panel with the audio delay. On the end card it adds Run the bots and the test log.
   - `?seed=N` fixes the passers-by, and the park's windows, train and birds.
   - `?bot=random` or `?bot=lick` plays a whole set by itself.
   - `?sky=N` shows the park as it is N bars into a set (until a set starts), to check the sunset without playing three minutes.
-  - `?coins=N` sets your savings to N on that page, to try the shop. Nothing done on it is kept or logged.
-- Tuning: the rules, the crowd, the tips and the feel are in `open-case/src/tuning.js`, and so are the park's sunset and background timings (`PARK`) and the shop's prices and pedal keys (`SHOP`), and the loop pedal's length, layers and allowance for early notes (`LOOP`). The sounds (the band, each instrument and each pedal, the loop's level and the safety before the speakers) are in `open-case/src/audio.js`, and a few view timings are in `scene.js` and `render.js`.
-- Art: flat colour, no outlines, no dithering, the look Nathan picked from a reference picture. The game draws from one sprite sheet, `open-case/assets/sprites.png`, with its frame and layout data in `sprites.json`. `art/open-case/sprites.lua` writes both from the shared drawing code: `draw.lua` (the park, you and your things), `figures.lua` (the passers-by, six people of each kind drawn from parts, their reactions, the pigeons and the birds), `gear.lua` (you with each instrument, your pedals and the loop pedal, the amp and the gear strip's icons) and `shop.lua` (the music shop). `palette.lua` holds every colour, at most 64. The style sample and the tab icon have scripts there too. Rebuild everything from the repo root (it's deterministic: an unchanged script rebuilds its files byte for byte):
+  - `?coins=N` sets your savings to N on that page, to try the shop. Nothing done on it is kept or logged, beats made in the studio included.
+  - `?beat=lofi` (or `bossa`, `funk`, `reggae`, `ballad`) makes every set play that ready-made beat, without the studio.
+- Tuning: the rules, the crowd, the tips and the feel are in `open-case/src/tuning.js`, and so are the park's sunset and background timings (`PARK`) and the shop's prices and pedal keys (`SHOP`), the loop pedal's length, layers and allowance for early notes (`LOOP`), and the studio's slots, undo and timing (`STUDIO`). The beats themselves (the five ready-made ones, the keys, the chords and the sounds each part can have) are in `open-case/src/beats.js`, and the studio's rhythms in `rhythms.js`. The sounds (the band, each instrument and each pedal, the loop's level and the safety before the speakers) are in `open-case/src/audio.js`, and a few view timings are in `scene.js` and `render.js`.
+- Art: flat colour, no outlines, no dithering, the look Nathan picked from a reference picture. The game draws from one sprite sheet, `open-case/assets/sprites.png`, with its frame and layout data in `sprites.json`. `art/open-case/sprites.lua` writes both from the shared drawing code: `draw.lua` (the park, you and your things), `figures.lua` (the passers-by, six people of each kind drawn from parts, their reactions, the pigeons and the birds), `gear.lua` (you with each instrument, your pedals and the loop pedal, the amp and the gear strip's icons) and `shop.lua` (the music shop, the studio's groovebox on its counter). `palette.lua` holds every colour, at most 64. The style sample and the tab icon have scripts there too. Rebuild everything from the repo root (it's deterministic: an unchanged script rebuilds its files byte for byte):
 
   ```sh
   for s in sprites icon style-sample; do /Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/$s.lua; done
````

- [ ] **Step 2: The spec says what was built, and what the build settled**

````diff
diff --git a/docs/superpowers/specs/2026-09-30-open-case-studio-design.md b/docs/superpowers/specs/2026-09-30-open-case-studio-design.md
index 75497e9..44045e6 100644
--- a/docs/superpowers/specs/2026-09-30-open-case-studio-design.md
+++ b/docs/superpowers/specs/2026-09-30-open-case-studio-design.md
@@ -1,7 +1,7 @@
 # Open Case: the studio (design spec)
 
 **Date:** 2026-09-30
-**Status:** Nathan agreed the design in chat and on the mockups in the browser ("thats what i am talking about!"), and asked for this spec ("write the spec then pause"). It waits for his review; the implementation plan comes after.
+**Status:** Nathan agreed the design in chat and on the mockups in the browser ("thats what i am talking about!"), asked for this spec ("write the spec then pause"), then for the plan ("go ahead and write the plan then pause"). Built from `docs/superpowers/plans/2026-09-30-open-case-studio.md`.
 
 It started with Nathan: "before we move to the regulars i would like to add another few tracks to add some variety, its getting boring hearing the same song over and over". Every set plays the same 4-bar lo-fi loop, 15 times round.
 
@@ -209,6 +209,21 @@ The layout from the mockups, drawn in the game's flat style at 320×180. Each pa
 
 Nathan opens the studio and has a beat he likes in a minute or two, without thinking about notes, the way Figure felt. Then he busks over it, and sets stop sounding the same. **If making a beat feels fiddly,** the rhythms and the pad are where to look. **If a style doesn't sound like itself,** its sounds and patterns get tuned by ear.
 
+## What the build settled
+
+The plan's prototype settled what this spec left open, and changed two small things:
+- **Esc leaves the studio for the park,** ready for the next set, as the shop does, rather than going back to the end card. Every screen between sets returns to the park, and the end card only tells you about a set that's over.
+- **With the mouse, Erase is a switch:** click it and it lights red, paint over what to wipe, click it again. A mouse can't hold two things at once. Backspace still erases while it's held.
+- **Z and X** move the bass pad an octave down or up, as they move your octave when you play. The Range button steps through the three.
+- **The settings:** drag the tempo (2 pixels a beat per minute) or the swing up or down. Click the key or the length to step on to the next, or drag them.
+- **The timing:** a press up to 60 ms after a 16th catches it, and a hold writes 50 ms ahead of the playhead, so the band plays what it writes on time. Letting go within 50 ms of a 16th still writes it. These are in `tuning.js` (`STUDIO`).
+- **From the keys:** a drum plays at 0.7 of full, and a note or chord at the middle tone. A held bass note plays at 0.8, a chord at 0.5.
+- **The chords' names:** the pad names the key's triads (Am, Bdim, C). The strip names each chord as its sound stacks it: Am7 on the nylon guitar, Am9 on the electric piano, and the lo-fi's and the funk's by their own voicings.
+- **A set's bars:** 60 for the lo-fi, 100 for the bossa nova, 76 for the funk, 56 for the reggae and 52 for the ballad.
+- **The ready-made beats' loudness,** rendered offline in Chrome with every part playing: the lo-fi −24.8 dB, the reggae −25.7, the funk −26.6, the bossa nova −27.3 and the ballad −29.0, the gentler ones a little softer. None peaks above −4 dB. The Pump ducks by up to 70% and comes back over a quarter of a beat.
+- **The colours** come from the palette already there: the drums the sky's orange, the bass the speaker's blue, the chords the loop pedal's green. The art stays at 49 colours, and the groovebox adds two frames to the sheet.
+- **Two more files** than "How it's built" lists: `studioview.js` (the screen, and what a click lands on) and `studioinput.js` (the mouse and the keys). Your beats are stored under `open-case-beats`.
+
 ## Not in this change
 
 - The picture strip in the busking screen (the next spec).
````

- [ ] **Step 3: Run the tests, and check it in Chrome**

Run: `cd open-case && npm test`
Expected: PASS, 290 tests.

Serve the repo root (`python3 -m http.server 8765 --bind 127.0.0.1`) and open `http://127.0.0.1:8765/open-case/?coins=500&seed=2&debug`. Then check:
- **The shop:** press a key, then choose Visit the shop (in the console: `document.getElementById('shop').click()`). Arrow left to the groovebox on the counter and buy it with Enter. The savings go from 500 to 350.
- **The studio:**
  - Open it from the end card's Studio button (or `document.getElementById('studio').click()`).
  - Each tab draws; the list opens from the beat's name.
  - Holding the pad paints into the loop, and the strip shows it as the playhead passes.
  - Esc with the list open closes it; Esc again leaves for the park.
  - Leaving mid-hold stops the band, with no note left sounding.
- **A set:** open the funk from the list and Busk to this. Then play a note: the set is the funk's, "bar 1/76".
- **The sound check:** `?sound` has the beat menu, and each beat plays.
- No console errors throughout.

(Nathan judges the sounds by ear.)

- [ ] **Step 4: Commit**

```bash
git add README.md docs/superpowers/specs/2026-09-30-open-case-studio-design.md
git commit -m "Open Case: the README and the spec say what the studio is and what its build settled

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```
