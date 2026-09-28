import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BEAT, BAR, timeOf16th, sixteenthAt, inKey, isStrong, isOff16th, CHORDS, bandAt } from '../src/groove.js';
import { GROOVE } from '../src/tuning.js';

const near = (a, b) => Math.abs(a - b) < 1e-9;

test('80 beats a minute: a beat is 0.75 s, a bar 3 s, a set of 60 bars 3 minutes', () => {
  assert.ok(near(BEAT, 0.75));
  assert.ok(near(BAR, 3));
  assert.ok(near(GROOVE.setBars * BAR, 180));
});

test('the swing pushes the second 16th of each pair late, to 58% of the pair', () => {
  assert.ok(near(timeOf16th(0), 0));
  assert.ok(near(timeOf16th(1), 0.29 * BEAT));
  assert.ok(near(timeOf16th(2), 0.5 * BEAT));
  assert.ok(near(timeOf16th(3), 0.79 * BEAT));
  assert.ok(near(timeOf16th(4), BEAT));
  assert.ok(near(timeOf16th(21), BAR + BEAT + 0.29 * BEAT));
});

test('a time rounds to the nearest swung 16th, so small jitter never moves a note', () => {
  for (let s = 0; s < 64; s++) {
    assert.equal(sixteenthAt(timeOf16th(s)), s);
    assert.equal(sixteenthAt(timeOf16th(s) + 0.04), s);
    assert.equal(sixteenthAt(timeOf16th(s) - 0.04), s);
  }
  assert.equal(sixteenthAt(-0.01), 0);
});

test('in key means C major: the white keys; strong beats are quarter notes; off 16ths are odd', () => {
  assert.deepEqual([60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71].map(inKey), [true, false, true, false, true, true, false, true, false, true, false, true]);
  assert.deepEqual([0, 1, 2, 4, 6, 8].map(isStrong), [true, false, false, true, false, true]);
  assert.deepEqual([0, 1, 2, 3].map(isOff16th), [false, true, false, true]);
});

test('the four chords are in C major, one a bar, round and round', () => {
  assert.deepEqual(CHORDS.map((c) => c.name), ['Dm9', 'G13', 'Cmaj9', 'Am9']);
  for (const c of CHORDS) assert.ok([...c.keys, c.root].every(inKey), c.name);
  assert.deepEqual(bandAt('keys', 16 * 5).map((n) => n.note), CHORDS[1].keys);
});

test('each layer has its pattern; the band plays only in key', () => {
  let drums = 0, bass = 0, top = 0;
  for (let s = 0; s < 64; s++) {
    for (const layer of ['keys', 'bass', 'top']) for (const n of bandAt(layer, s)) if (n.note) assert.ok(inKey(n.note), `${layer} ${n.note}`);
    drums += bandAt('drums', s).length;
    bass += bandAt('bass', s).length;
    top += bandAt('top', s).length;
  }
  assert.ok(drums >= 16 && bass >= 16 && top >= 32, `${drums} ${bass} ${top}`);
  assert.deepEqual(bandAt('nothing', 0), []);
});

test('the click ticks on every beat, the bar\'s first beat brighter than the rest', () => {
  for (let s = 0; s < 32; s++) {
    const hits = bandAt('click', s);
    if (s % 4 === 0) {
      assert.equal(hits.length, 1, `16th ${s}`);
      assert.equal(hits[0].voice, 'click');
    } else {
      assert.deepEqual(hits, [], `16th ${s}`);
    }
  }
  const bar = 5; // the accent isn't special to bar 0
  const [downbeat] = bandAt('click', bar * 16);
  const [beatTwo] = bandAt('click', bar * 16 + 4);
  assert.ok(downbeat.note > beatTwo.note && downbeat.vel > beatTwo.vel);
});
