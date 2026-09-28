import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createListener, tick, noteOff, shapeKey } from '../src/listen.js';
import { timeOf16th, BEAT, inKey } from '../src/groove.js';
import { play, wait, heard, names, opening } from './helpers.js';

test('a phrase ends once no key has been held, and no note started, for a whole beat', () => {
  const l = createListener();
  play(l, [[0, 60], [2, 62], [4, 64]]); // the last key goes up just before 16th 5
  wait(l, 8);
  assert.deepEqual(heard(l), []);
  tick(l, timeOf16th(5) + BEAT);
  assert.deepEqual(heard(l), [{ rule: 'phrase', clean: true, loud: false, notes: 3 }]);
});

test('a held key, or a note inside the beat, keeps the phrase going', () => {
  const l = createListener();
  play(l, [[0, 60, 12]]); // held for three beats
  wait(l, 12);
  assert.deepEqual(heard(l), []);
  play(l, [[14, 62], [17, 64]]); // each starts within a beat of the last key going up
  wait(l, 30);
  assert.deepEqual(heard(l), [{ rule: 'phrase', clean: true, loud: false, notes: 3 }]);
});

test('a repeat fires on the third time a shape comes round in the last 16 notes', () => {
  const l = createListener();
  const lick = (s) => [60, 64, 67, 72].map((p, k) => [s + k, p]);
  play(l, [...lick(0), ...lick(8)]);
  assert.deepEqual(names(heard(l)).filter((r) => r === 'repeat'), []);
  assert.deepEqual(l.notes.slice(4, 8).map((n) => n.echo), [2, 2, 2, 2], 'the second time, its glyphs flash');
  play(l, lick(16));
  assert.deepEqual(names(heard(l)).filter((r) => r === 'repeat'), ['repeat']);
  assert.deepEqual(l.notes.slice(8, 12).map((n) => n.echo), [3, 3, 3, 3], 'the third time, they turn grey');
});

test('the same steps in a different rhythm are a different shape', () => {
  const l = createListener();
  play(l, [...opening(0, [60, 64, 67, 72], [1, 1, 1]), ...opening(8, [60, 64, 67, 72], [2, 1, 1]), ...opening(16, [60, 64, 67, 72], [1, 2, 1])]);
  assert.equal(names(heard(l)).includes('repeat'), false);
});

test('off key: more than 1 in 4 strong-beat notes outside the key frowns', () => {
  const l = createListener();
  play(l, [[0, 61, 4], [4, 70, 4], [8, 64, 4], [12, 60, 4]]); // C# and A# on beats 1 and 2
  wait(l, 24);
  assert.deepEqual(heard(l), [{ rule: 'offKey' }, { rule: 'phrase', clean: false, loud: false, notes: 4 }]);
  play(l, [[32, 61, 4], [36, 69, 4], [40, 64, 4], [44, 60, 4]]); // one in four is fine
  wait(l, 56);
  assert.deepEqual(names(heard(l)), ['phrase']);
});

test('a colour note, stepping within a beat to a note in the key, is not off key', () => {
  const l = createListener();
  play(l, [[0, 61, 4], [4, 62, 4], [8, 63, 4], [12, 64, 4]]); // C# to D, D# to E: colour notes
  wait(l, 24);
  assert.deepEqual(heard(l), [{ rule: 'phrase', clean: true, loud: false, notes: 4 }]);
  play(l, [[32, 61, 4], [36, 65, 4], [40, 68, 4], [44, 60, 4]]); // C# leaps to F, G# leaps to C
  wait(l, 56);
  assert.deepEqual(names(heard(l)), ['offKey', 'phrase']);
});

test('a phrase still going is judged for key at each bar line, once it has 4 strong-beat notes', () => {
  const l = createListener();
  const notes = [61, 66, 70, 63, 68, 61, 70, 66, 63, 68].map((p, k) => [k * 4, p, 4]); // outside, every beat, no rests
  const frowns = () => names(heard(l)).filter((r) => r === 'offKey').length;
  play(l, notes.slice(0, 5)); // past the first bar line
  assert.equal(frowns(), 0, 'at the first line only 3 notes can be judged');
  play(l, notes.slice(5, 9)); // past the second
  assert.equal(frowns(), 1, 'frowned at the second line, before the phrase ended');
  play(l, notes.slice(9));
  wait(l, 50);
  assert.equal(frowns(), 1, 'and again at its end, for the new ones');
});

test('an off-key note judged early never frowns twice', () => {
  const l = createListener();
  play(l, [[0, 61, 4], [4, 70, 4], [8, 64, 4], [12, 60, 4], [16, 62, 4], [20, 64, 4], [24, 65, 4], [28, 67, 4], [32, 69, 4]]);
  wait(l, 50);
  assert.deepEqual(names(heard(l)), ['offKey', 'phrase']);
});

test('a callback: an idea from 8 or more bars ago, moved to another note or re-timed', () => {
  const idea = opening(0, [60, 62, 64, 67]);
  const at = (bars, pitches, gaps) => {
    const l = createListener();
    play(l, idea);
    wait(l, bars * 16 - 1);
    heard(l);
    play(l, opening(bars * 16, pitches, gaps));
    return names(heard(l)).filter((r) => r === 'callback' || r === 'recognised');
  };
  assert.deepEqual(at(8, [65, 67, 69, 72]), ['callback'], 'moved up a fourth');
  assert.deepEqual(at(8, [60, 62, 64, 67], [1, 1, 2]), ['callback'], 're-timed from the same note');
  assert.deepEqual(at(8, [60, 62, 64, 67]), ['recognised'], 'unchanged: just a nod');
  assert.deepEqual(at(7, [65, 67, 69, 72]), [], 'too soon');
  assert.deepEqual(at(8, [65, 67, 69, 71]), [], 'different steps: a new idea');
});

test('each idea earns a callback at most once every 16 bars', () => {
  const l = createListener();
  const callbacks = () => names(heard(l)).filter((r) => r === 'callback').length;
  play(l, opening(0, [60, 62, 64, 67]));
  wait(l, 8 * 16 - 1);
  play(l, opening(8 * 16, [65, 67, 69, 72]));
  assert.equal(callbacks(), 1);
  wait(l, 16 * 16 - 1);
  play(l, opening(16 * 16, [60, 62, 64, 67]));
  assert.equal(callbacks(), 0, '8 bars since it was called back: not yet');
  wait(l, 24 * 16 - 1);
  play(l, opening(24 * 16, [67, 69, 71, 74]));
  assert.equal(callbacks(), 1, '16 bars since');
});

test('the memory strip keeps the last 6 ideas; a phrase under 4 notes leaves none', () => {
  const l = createListener();
  play(l, [[0, 60], [2, 64], [4, 67]]);
  wait(l, 15);
  assert.equal(l.strip.length, 0);
  for (let k = 1; k <= 7; k++) {
    play(l, opening(k * 16, [60, 60 + k, 60 + 2 * k, 60 + 3 * k]));
    wait(l, k * 16 + 15);
  }
  assert.deepEqual(l.strip.map((i) => i.steps[0]), [2, 3, 4, 5, 6, 7]);
  assert.deepEqual(l.strip[0], { steps: [2, 2, 2], gaps: [2, 2, 2], pitch: 60, bar: 2, calledBar: null });
});

// One note a beat, in key, each new note chosen so no shape ever comes twice.
function wandering(beats) {
  const notes = [], seen = new Set(), white = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79];
  for (let i = 0; i < beats; i++) {
    for (const p of [...white.slice(i % 7), ...white]) {
      const trial = [...notes, { pitch: p, s: i * 4 }];
      const key = i >= 3 ? shapeKey(trial, i - 3) : String(i);
      if (!seen.has(key)) {
        seen.add(key);
        notes.push({ pitch: p, s: i * 4 });
        break;
      }
    }
  }
  assert.ok(notes.every((n) => inKey(n.pitch)) && notes.length === beats);
  return notes.map((n) => [n.s, n.pitch, 3]);
}

test('random: 32 or more notes in 16 bars and not one shape twice, once a bar while it holds', () => {
  const l = createListener();
  play(l, wandering(40)); // 10 bars
  wait(l, 10 * 16);
  const bars = l.events.filter((e) => e.rule === 'random').length;
  assert.equal(bars, 3, 'at the lines after bars 8, 9 and 10');
});

test('one shape coming round a second time is not random', () => {
  const l = createListener();
  const notes = wandering(40);
  for (let k = 0; k < 4; k++) notes[20 + k] = [notes[20 + k][0], notes[k][1] + 12, 3]; // notes 0-3 again, an octave up
  play(l, notes);
  wait(l, 10 * 16);
  assert.equal(l.events.filter((e) => e.rule === 'random').length, 0);
});

test('silence: more than 4 whole bars with no note, then once a bar', () => {
  const l = createListener();
  play(l, [[0, 60]]);
  wait(l, 5 * 16);
  assert.deepEqual(names(heard(l)).filter((r) => r === 'silence'), []);
  wait(l, 6 * 16);
  assert.deepEqual(names(heard(l)).filter((r) => r === 'silence'), ['silence']);
  wait(l, 8 * 16);
  assert.deepEqual(names(heard(l)).filter((r) => r === 'silence'), ['silence', 'silence']);
});

test('a note picked at strength 4 is loud', () => {
  const l = createListener();
  play(l, [[0, 60, 1, 4], [2, 62, 1, 3]]);
  assert.deepEqual(names(heard(l)), ['loud']);
});

test('each bar line reports the bar just ended: its notes, how many on off 16ths, its longest rest', () => {
  const l = createListener();
  play(l, [[0, 60], [1, 62], [3, 64], [4, 65], [12, 67]]);
  wait(l, 16);
  const bar = l.events.find((e) => e.rule === 'bar');
  assert.deepEqual(bar, { rule: 'bar', bar: 0, count: 5, off: 2, rest: 8 });
});

test('a stray key-up (after switching tabs, say) never leaves a phrase stuck open', () => {
  const l = createListener();
  play(l, [[0, 60], [2, 62], [4, 64]]);
  noteOff(l, timeOf16th(6));
  noteOff(l, timeOf16th(6));
  assert.equal(l.held, 0);
  tick(l, timeOf16th(6) + BEAT);
  assert.deepEqual(names(heard(l)), ['phrase']);
});
