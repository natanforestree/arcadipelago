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
