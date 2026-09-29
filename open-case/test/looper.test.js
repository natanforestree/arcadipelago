import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLoop, record, note, release, ring, step, undo, due, loopState, LOOP_LENGTH, countBeats } from '../src/looper.js';
import { BAR, BEAT } from '../src/groove.js';
import { LOOP } from '../src/tuning.js';

const SIXTEENTH = BEAT / 4;
const play = (loop, t, id, pitch, over = {}) => note(loop, t, id, { pitch, strength: 3, legato: false, ...over });
// A loop with one layer recorded from bar line `bar`: each note is [seconds after the bar line, pitch,
// seconds held].
function withLayer(loop, bar, notes) {
  record(loop, bar * BAR - 0.5);
  notes.forEach(([at, pitch, len], i) => {
    play(loop, bar * BAR + at, `k${i}`, pitch);
    release(loop, bar * BAR + at + len, `k${i}`);
  });
  step(loop, bar * BAR + LOOP_LENGTH);
  return loop;
}
const times = (notes) => notes.map((n) => Math.round(n.t * 1000) / 1000);

test('a loop is one pass of the chords: 4 bars, up to 3 layers, a 16th early allowed', () => {
  assert.deepEqual(LOOP, { bars: 4, layers: 3, early: 1 });
  assert.equal(LOOP_LENGTH, 4 * BAR);
});

test('R arms a recording from the next bar line, even pressed just after one; it records 4 bars, then plays straight back', () => {
  const loop = createLoop();
  assert.equal(loopState(loop, 1), 'empty');
  assert.equal(record(loop, BAR + 0.01), true, 'a hair after bar line 1');
  assert.equal(loop.take.from, 2 * BAR, 'waits for bar line 2');
  assert.equal(loopState(loop, 2 * BAR - 0.01), 'waiting');
  assert.equal(loopState(loop, 2 * BAR), 'recording');
  play(loop, 2 * BAR + 0.5, 'KeyA', 60);
  release(loop, 2 * BAR + 0.8, 'KeyA');
  assert.equal(step(loop, 2 * BAR + LOOP_LENGTH - 0.01), null, 'still recording');
  assert.equal(step(loop, 2 * BAR + LOOP_LENGTH), 'layer');
  assert.equal(loopState(loop, 2 * BAR + LOOP_LENGTH), 'playing');
  assert.equal(step(loop, 2 * BAR + LOOP_LENGTH + 1), null, 'only once');
  assert.deepEqual(times(due(loop, 0, 2 * BAR + 2 * LOOP_LENGTH)), [2 * BAR + LOOP_LENGTH + 0.5], 'first heard the moment the recording ends');
  const late = createLoop();
  record(late, 3 * BAR - 0.05);
  assert.equal(late.take.from, 3 * BAR, 'pressed just before a bar line, it records from that one');
});

test('record also remembers when R was pressed, for the count-in', () => {
  const loop = createLoop();
  record(loop, BAR + 0.01);
  assert.equal(loop.take.armed, BAR + 0.01);
  assert.equal(loop.take.from, 2 * BAR, 'the timing rule is unchanged');
});

test("countBeats gives the count-in's clicks: every beat strictly after R was pressed, strictly before the bar line it arms", () => {
  assert.deepEqual(countBeats(createLoop()), [], 'no take waiting');
  const early = createLoop();
  record(early, 0.1);
  assert.deepEqual(countBeats(early), [0.75, 1.5, 2.25], 'bar 1 beat 1: three clicks left before the bar line');
  const late = createLoop();
  record(late, 2.3);
  assert.deepEqual(countBeats(late), [], 'pressed on beat 4: nothing left to count, and no click for it either');
  const onLine = createLoop();
  record(onLine, 3.0);
  assert.equal(onLine.take.from, 6, 'exactly on a bar line arms the next one');
  assert.deepEqual(countBeats(onLine), [3.75, 4.5, 5.25], '3.0 itself is not after armed');
  const negative = createLoop();
  record(negative, -0.05);
  assert.equal(negative.take.from, 0, "the shop's band starting a hair after you choose the pedal");
  assert.deepEqual(countBeats(negative), []);
});

test("R does nothing while a recording waits or runs, or once there are 3 layers", () => {
  const loop = createLoop();
  record(loop, 0.5);
  assert.equal(record(loop, 1), false, 'waiting');
  assert.equal(loop.take.from, BAR, 'the first recording stands');
  assert.equal(record(loop, BAR + 1), false, 'recording');
  step(loop, BAR + LOOP_LENGTH);
  for (let i = 1; i < LOOP.layers; i++) {
    assert.equal(record(loop, i * 10 * BAR), true);
    step(loop, (i * 10 + 1) * BAR + LOOP_LENGTH);
  }
  assert.equal(loop.layers.length, 3);
  assert.equal(record(loop, 50 * BAR), false, 'full');
  assert.equal(loop.take, null);
});

test('a layer keeps each note as played: its timing exactly, its pick strength and its hammer-ons', () => {
  const loop = createLoop();
  record(loop, 0);
  play(loop, BAR + 0.013, 'KeyA', 60, { strength: 1 });
  play(loop, BAR + 0.401, 'KeyS', 62, { strength: 4, legato: true });
  release(loop, BAR + 0.5, 'KeyA');
  release(loop, BAR + 0.9, 'KeyS');
  step(loop, BAR + LOOP_LENGTH);
  const ms = (n) => ({ ...n, at: Math.round(n.at * 1000) / 1000, len: Math.round(n.len * 1000) / 1000 });
  assert.deepEqual(loop.layers[0].notes.map(ms), [
    { at: 0.013, pitch: 60, strength: 1, legato: false, len: 0.487 },
    { at: 0.401, pitch: 62, strength: 4, legato: true, len: 0.499 },
  ]);
  const heard = due(loop, BAR + LOOP_LENGTH, BAR + 2 * LOOP_LENGTH);
  assert.deepEqual(heard.map((n) => [n.pitch, n.strength, n.legato]), [[60, 1, false], [62, 4, true]]);
  assert.ok(Math.abs(heard[1].t - (BAR + LOOP_LENGTH + 0.401)) < 1e-9, 'not snapped to the beat');
});

test("a note up to a 16th early for the first bar line counts, and plays just as early each time round; an earlier one doesn't", () => {
  const loop = createLoop();
  record(loop, 0);
  play(loop, BAR - SIXTEENTH - 0.01, 'KeyA', 60); // too early
  play(loop, BAR - 0.1, 'KeyS', 62); // a hair early
  release(loop, BAR + 0.2, 'KeyA');
  release(loop, BAR + 0.2, 'KeyS');
  step(loop, BAR + LOOP_LENGTH);
  assert.deepEqual(loop.layers[0].notes.map((n) => n.pitch), [62]);
  assert.ok(Math.abs(loop.layers[0].notes[0].at + 0.1) < 1e-9);
  assert.ok(Math.abs(loop.layers[0].notes[0].len - 0.3) < 1e-9, 'held from its early start');
  assert.deepEqual(times(due(loop, 0, BAR + 3 * LOOP_LENGTH)), [BAR + LOOP_LENGTH - 0.1, BAR + 2 * LOOP_LENGTH - 0.1, BAR + 3 * LOOP_LENGTH - 0.1]);
});

test('the early note is due even before its recording ends, so the first time round keeps it', () => {
  const loop = createLoop();
  record(loop, 0);
  play(loop, BAR - 0.1, 'KeyA', 60);
  release(loop, BAR, 'KeyA');
  assert.deepEqual(times(due(loop, BAR + LOOP_LENGTH - 0.2, BAR + LOOP_LENGTH)), [BAR + LOOP_LENGTH - 0.1], 'the recording is still under way');
  assert.equal(due(loop, BAR + LOOP_LENGTH - 0.2, BAR + LOOP_LENGTH)[0].layer, 0, "it's the next layer's note");
});

test('with Space held a note lasts until Space lets go; a note still sounding at the end is cut there', () => {
  const loop = createLoop();
  record(loop, 0);
  ring(loop, BAR, true);
  play(loop, BAR + 1, 'KeyA', 60);
  release(loop, BAR + 1.2, 'KeyA');
  ring(loop, BAR + 2, false);
  play(loop, BAR + 3, 'KeyS', 62);
  release(loop, BAR + 3.25, 'KeyS');
  play(loop, BAR + LOOP_LENGTH - 1, 'KeyD', 64); // still held when the 4 bars are up
  step(loop, BAR + LOOP_LENGTH + 0.3);
  assert.deepEqual(loop.layers[0].notes.map((n) => n.len), [1, 0.25, 1]);
});

test('a pitch struck again while it rings from Space ends the ringing note there, as in the sound', () => {
  const loop = createLoop();
  record(loop, 0);
  ring(loop, BAR, true);
  play(loop, BAR + 1, 'KeyA', 60);
  release(loop, BAR + 1.1, 'KeyA');
  play(loop, BAR + 1.5, 'KeyA', 60);
  release(loop, BAR + 1.6, 'KeyA');
  ring(loop, BAR + 3, false);
  step(loop, BAR + LOOP_LENGTH);
  assert.deepEqual(loop.layers[0].notes.map((n) => n.len), [0.5, 1.5]);
});

test('notes played before R, or while it waits for its bar line, or after the 4 bars, are not kept', () => {
  const loop = createLoop();
  assert.equal(play(loop, 0.1, 'KeyA', 60), false, 'no recording');
  record(loop, 0.2);
  assert.equal(play(loop, 1, 'KeyS', 62), false, 'waiting');
  assert.equal(play(loop, BAR + LOOP_LENGTH, 'KeyD', 64), false, 'the 4 bars are up');
  step(loop, BAR + LOOP_LENGTH);
  assert.equal(loop.layers[0].notes.length, 0);
});

test('undo cancels a waiting or running recording and keeps the layers; otherwise it takes off the last layer', () => {
  const loop = createLoop();
  assert.equal(undo(loop), null, 'nothing to undo');
  withLayer(loop, 1, [[0, 60, 0.5]]);
  withLayer(loop, 6, [[0, 64, 0.5]]);
  record(loop, 10 * BAR + 1);
  assert.equal(undo(loop), 'cancelled', 'waiting');
  record(loop, 12 * BAR + 1);
  play(loop, 13 * BAR + 1, 'KeyA', 67);
  assert.equal(undo(loop), 'cancelled', 'recording');
  assert.equal(loop.take, null);
  assert.equal(loop.layers.length, 2, 'the layers play on');
  assert.equal(undo(loop), 'removed');
  assert.deepEqual(loop.layers.map((l) => l.notes[0].pitch), [60]);
  assert.equal(undo(loop), 'cleared');
  assert.equal(loopState(loop, 20 * BAR), 'empty');
  assert.equal(undo(loop), null);
});

test('due gives each looped note once per time round, at the right moments, however the time is cut up, across the wrap', () => {
  // A layer from bar 2: notes near its start and near its end, so passes meet at the wrap.
  const loop = withLayer(createLoop(), 2, [[0, 60, 0.2], [LOOP_LENGTH - 0.05, 72, 0.04]]);
  const start = 2 * BAR + LOOP_LENGTH;
  const whole = due(loop, start, start + 3 * LOOP_LENGTH);
  assert.deepEqual(times(whole), [
    start, start + LOOP_LENGTH - 0.05, start + LOOP_LENGTH, start + 2 * LOOP_LENGTH - 0.05, start + 2 * LOOP_LENGTH, start + 3 * LOOP_LENGTH - 0.05,
  ].map((t) => Math.round(t * 1000) / 1000));
  assert.deepEqual(whole.map((n) => n.pitch), [60, 72, 60, 72, 60, 72]);
  // The same span in frame-sized windows gives the same notes, none twice and none missed.
  const cut = [];
  for (let t = start; t < start + 3 * LOOP_LENGTH - 1e-9; t += 1 / 60) cut.push(...due(loop, t, Math.min(t + 1 / 60, start + 3 * LOOP_LENGTH)));
  assert.deepEqual(times(cut), times(whole));
  assert.deepEqual(due(loop, 0, start), [], 'nothing before the recording ends');
});

test('layers play together, each from its own bar line, and each note knows its layer', () => {
  const loop = withLayer(createLoop(), 1, [[1, 60, 0.5]]);
  withLayer(loop, 7, [[2, 64, 0.5]]);
  const heard = due(loop, 11 * BAR, 11 * BAR + LOOP_LENGTH);
  assert.deepEqual(heard.map((n) => [n.pitch, n.layer]), [[64, 1], [60, 0]], 'the second layer comes round first here');
  assert.ok(heard.every((n) => Math.abs((n.t - (n.pitch === 60 ? 1 * BAR + 1 : 7 * BAR + 2)) % LOOP_LENGTH) < 1e-9));
});

test('over many passes nothing drifts', () => {
  const loop = withLayer(createLoop(), 1, [[0.123, 60, 0.3]]);
  const far = due(loop, 1000 * LOOP_LENGTH, 1001 * LOOP_LENGTH);
  assert.equal(far.length, 1);
  assert.ok(Math.abs(((far[0].t - (BAR + 0.123)) / LOOP_LENGTH) - Math.round((far[0].t - (BAR + 0.123)) / LOOP_LENGTH)) < 1e-9);
});
