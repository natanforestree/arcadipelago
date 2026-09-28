import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBot, lickBot, goodSet, wanderSet } from '../src/bots.js';
import { createSet, stepSet, playNote, releaseNote, runSet, summary, momentsOf } from '../src/set.js';
import { sixteenthAt, inKey, timeOf16th } from '../src/groove.js';
import { GROOVE, DT } from '../src/tuning.js';

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const coins = (bot) => SEEDS.map((seed) => runSet(seed, bot(seed)).coins);
const sum = (list) => list.reduce((a, b) => a + b, 0);

// Every event of a set, gathered update by update (set.events holds only the latest update's).
function allEvents(seed, notes) {
  const set = createSet(seed), moments = momentsOf(notes), events = [];
  let i = 0;
  while (set.phase !== 'over') {
    const until = set.t + DT;
    for (; i < moments.length && moments[i].t <= until; i++) {
      const m = moments[i];
      if (m.note) playNote(set, m.note.pitch, m.note.strength, m.t);
      else releaseNote(set, m.t);
    }
    stepSet(set, DT);
    events.push(...set.events);
  }
  return events;
}

test('the headline: over seeds 1 to 10 an honest set earns at least 3x each bot, and a coin on every seed', () => {
  const good = coins(goodSet), random = coins(randomBot), lick = coins(lickBot);
  assert.ok(good.every((c) => c >= 1), `honest set: ${good}`);
  assert.ok(sum(good) >= 3 * sum(random), `honest ${sum(good)}, random bot ${sum(random)}`);
  assert.ok(sum(good) >= 3 * sum(lick), `honest ${sum(good)}, lick bot ${sum(lick)}`);
});

test('in key but never bringing an idea back earns less than the honest set, and far more than random notes', () => {
  const good = sum(coins(goodSet)), wander = sum(coins(wanderSet)), random = sum(coins(randomBot));
  assert.ok(wander < good, `wander ${wander}, honest ${good}`);
  assert.ok(wander >= 3 * random, `wander ${wander}, random bot ${random}`);
});

test('every bot is the same from a seed, and different across seeds; each starts on the first note', () => {
  for (const bot of [randomBot, lickBot, goodSet, wanderSet]) {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]) {
      assert.deepEqual(bot(seed), bot(seed));
      if (seed < 20) assert.notDeepEqual(bot(seed), bot(seed + 1));
      const notes = bot(seed);
      assert.equal(notes[0].t, 0, `bot seed ${seed} first note`);
      assert.ok(notes.every((n, i) => i === 0 || n.t >= notes[i - 1].t), `bot seed ${seed} in time order`);
      assert.ok(notes.every((n) => n.t < timeOf16th(GROOVE.setBars * 16) && n.len > 0), `bot seed ${seed} within set`);
    }
  }
});

test('the random bot plays 1 to 3 notes a beat, from the whole row at octave 0, 1 to 4 16ths long', () => {
  const notes = randomBot(1);
  const perBeat = new Map();
  for (const n of notes) {
    assert.ok(n.pitch >= 60 && n.pitch <= 77);
    const s = sixteenthAt(n.t), beat = Math.floor(s / 4);
    perBeat.set(beat, (perBeat.get(beat) ?? 0) + 1);
    const len16 = sixteenthAt(n.t + n.len + 0.01) - s;
    assert.ok(len16 >= 1 && len16 <= 4, `${len16}`);
  }
  assert.ok([...perBeat.values()].every((k) => k >= 1 && k <= 3));
  assert.ok(perBeat.size < GROOVE.setBars * 4, 'with some rests');
  assert.ok(notes.some((n) => !inKey(n.pitch)), 'black keys too');
});

test('the lick bot plays one 4-note lick over and over, with a beat of rest between', () => {
  const notes = lickBot(2);
  const lick = notes.slice(0, 4).map((n) => n.pitch);
  for (let i = 0; i < notes.length; i++) assert.equal(notes[i].pitch, lick[i % 4]);
  const s = notes.map((n) => sixteenthAt(n.t));
  assert.deepEqual(s.slice(0, 8), [0, 2, 4, 6, 12, 14, 16, 18]);
});

test('the honest set stays in key', () => {
  for (const seed of SEEDS) assert.ok(goodSet(seed).every((n) => inKey(n.pitch)), `seed ${seed}`);
});

test('a set replays exactly from its seed and its notes', () => {
  const a = runSet(3, goodSet(3)), b = runSet(3, goodSet(3));
  assert.equal(a.coins, b.coins);
  assert.deepEqual(summary(a), summary(b));
  assert.deepEqual(a.listen.notes, b.listen.notes);
  assert.ok(a.coins > 0);
});

test('coins in the set are the coin events added up', () => {
  const events = allEvents(2, goodSet(2));
  let coins = 0;
  for (const e of events) if (e.type === 'coin') coins += e.coins;
  assert.equal(runSet(2, goodSet(2)).coins, coins);
});

test("the honest set's callbacks land: the crowd hears it bring ideas back on every seed", () => {
  const perSeedCallbacks = SEEDS.map((seed) => {
    const events = allEvents(seed, goodSet(seed));
    return events.filter((e) => e.type === 'rule' && e.rule === 'callback').length;
  });
  // Every seed manages 10-12 with the fix (ideas.findLast in goodSet); before it, findLast was find
  // and callbacks fell to 2-6. 8 is a floor comfortably below today's low and above the broken range.
  assert.ok(perSeedCallbacks.every((c) => c >= 8), `callbacks per seed: ${perSeedCallbacks}`);
});
