import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSet, stepSet, playNote, momentsOf, endTime } from '../src/set.js';
import { LOFI, LOFI_CLOCK, readyBeat } from '../src/beats.js';
import { DT, TIPS } from '../src/tuning.js';
import { stoodAt } from './helpers.js';
const { bar: BAR } = LOFI_CLOCK;

// Steps a set until time `until`, returning every event with the time it came.
function runTo(set, until) {
  const seen = [];
  while (set.t + DT <= until + 1e-9) {
    stepSet(set, DT);
    for (const e of set.events) seen.push({ ...e, at: set.t });
  }
  return seen;
}
const layerChanges = (events) => events.filter((e) => e.type === 'layers').map((e) => ({ bar: e.bar, ...e.layers }));

test('the keys play from the start; a layer joins on the next bar line once the crowd reaches its number', () => {
  const set = createSet(1);
  assert.deepEqual(set.layers, { keys: true, drums: false, bass: false, top: false });
  stoodAt(set.crowd, 'student', 0);
  const events = runTo(set, 2 * BAR);
  assert.deepEqual(layerChanges(events), [{ bar: 1, keys: true, drums: true, bass: false, top: false }]);
  const [e] = events.filter((x) => x.type === 'layers');
  assert.ok(e.at < BAR && e.at > BAR - 0.3, 'decided just before the line, so the sound can be scheduled on it');
  for (const spot of [1, 2, 3, 4]) stoodAt(set.crowd, 'commuter', spot);
  assert.deepEqual(layerChanges(runTo(set, 3 * BAR)), [{ bar: 3, keys: true, drums: true, bass: true, top: true }]);
});

test('a layer drops only after the crowd has stayed below its number for 2 whole bars', () => {
  const set = createSet(1);
  const p = stoodAt(set.crowd, 'student', 0);
  runTo(set, BAR + 1); // drums on from bar 1
  set.crowd.people.splice(set.crowd.people.indexOf(p), 1); // gone during bar 1
  const events = runTo(set, 5 * BAR);
  assert.deepEqual(layerChanges(events), [{ bar: 4, keys: true, drums: false, bass: false, top: false }], 'bars 2 and 3 empty, so it drops at bar 4');
});

test('a single person hesitating never makes the music flicker', () => {
  const set = createSet(1);
  const p = stoodAt(set.crowd, 'student', 0);
  runTo(set, BAR + 1);
  const events = [];
  for (let bar = 1; bar < 8; bar++) {
    set.crowd.people.splice(set.crowd.people.indexOf(p), 1); // away for half of every bar
    events.push(...runTo(set, (bar + 0.5) * BAR));
    set.crowd.people.push(p);
    events.push(...runTo(set, (bar + 1) * BAR));
  }
  assert.deepEqual(layerChanges(events), []);
});

test('the set lasts 60 bars, then fades a bar, the listeners still there tip once, and the end card comes', () => {
  const set = createSet(1);
  const early = runTo(set, endTime(set) - 1);
  stoodAt(set.crowd, 'student', 0);
  stoodAt(set.crowd, 'elder', 1);
  const events = [...early, ...runTo(set, endTime(set) + BAR + 2)];
  const end = events.find((e) => e.type === 'end'), over = events.find((e) => e.type === 'over');
  assert.ok(end.at >= 180 && end.at < 180 + DT * 1.5);
  assert.ok(over.at - end.at >= BAR + 1 - DT && over.at - end.at < BAR + 1 + DT * 1.5);
  assert.deepEqual(events.filter((e) => e.why === 'end').map((e) => e.coins), [1, 1]);
  assert.equal(set.phase, 'over');
  playNote(set, 60, 3, set.t);
  assert.equal(set.listen.notes.length, 0, 'notes after the end are not heard');
});

test('key moments come in time order, a key going up before the next goes down', () => {
  const m = momentsOf([{ t: 0.5, pitch: 62, strength: 3, len: 0.5 }, { t: 0, pitch: 60, strength: 3, len: 0.5 }]);
  assert.deepEqual(m.map((x) => [x.t, x.note ? x.note.pitch : 'up']), [[0, 60], [0.5, 'up'], [0.5, 62], [1, 'up']]);
});

test("gear only changes how you sound: the crowd's rules never see it, or the loop", () => {
  // The rules (the set, the ears, the crowd, the beats, the bots) import nothing from the shop, the
  // gear, the loop pedal or the sound, so a set played with every pedal on, or over a loop, scores
  // exactly as one without.
  for (const f of ['set', 'listen', 'crowd', 'beats', 'bots']) {
    const src = readFileSync(new URL(`../src/${f}.js`, import.meta.url), 'utf8');
    const imports = [...src.matchAll(/from '\.\/([a-z]+)\.js'/g)].map((m) => m[1]);
    for (const other of imports) assert.ok(!['gear', 'shop', 'audio', 'main', 'looper'].includes(other), `${f}.js imports ${other}.js`);
  }
});

test("a set of another beat keeps its tempo: the funk's 76 bars of 2.4 s, its layers decided at its own bar lines", () => {
  const set = createSet(1, readyBeat('funk'));
  assert.equal(set.beat.id, 'funk');
  assert.equal(set.bars, 76);
  assert.ok(Math.abs(set.clock.bar - 2.4) < 1e-9 && Math.abs(endTime(set) - 182.4) < 1e-9);
  stoodAt(set.crowd, 'student', 0);
  const events = runTo(set, 2 * set.clock.bar);
  const [e] = events.filter((x) => x.type === 'layers');
  assert.equal(e.bar, 1);
  assert.ok(e.at < set.clock.bar && e.at > set.clock.bar - 0.3, "just before the funk's first bar line");
  const rest = runTo(set, endTime(set) + set.clock.bar + 2);
  const end = rest.find((x) => x.type === 'end'), over = rest.find((x) => x.type === 'over');
  assert.ok(end.at >= 182.4 && end.at < 182.4 + DT * 1.5);
  assert.ok(over.at - end.at >= set.clock.bar + 1 - DT && over.at - end.at < set.clock.bar + 1 + DT * 1.5, 'a bar of the funk to fade');
});

test("a set's ears count its beat's bars", () => {
  const set = createSet(1, readyBeat('ballad'));
  playNote(set, 60, 3, 0.1);
  runTo(set, set.clock.bar * 2 + 0.01);
  assert.equal(set.listen.bar, 2);
  assert.equal(set.listen.notes[0].s, 0);
});

test('on the island every tip is fondness, never coins, and the fans are the animals that left happy or stayed to the end', () => {
  const set = createSet(1, LOFI, 'island');
  stoodAt(set.crowd, 'elder', 0, { animal: 'heron', budget: 5, interest: 0.9 });
  stoodAt(set.crowd, 'commuter', 1, { animal: 'crow', budget: 5, interest: 0.3 });
  const early = runTo(set, endTime(set) - 20);
  stoodAt(set.crowd, 'student', 2, { animal: 'fox' });
  const events = [...early, ...runTo(set, endTime(set) + BAR + 2)];
  assert.equal(set.coins, 0);
  assert.ok(!events.some((e) => e.type === 'coin'));
  assert.deepEqual(events.filter((e) => e.type === 'fond').map((e) => [e.person.animal, e.fondness, e.why]), [['heron', TIPS.happyElder, 'happy'], ['fox', TIPS.end, 'end']]);
  assert.equal(set.fondness, TIPS.happyElder + TIPS.end);
  assert.deepEqual(set.fans.map((f) => f.animal), ['heron', 'fox'], 'not the crow, who left bored');
  assert.ok(Math.abs(set.fans[0].stayed - 5) < 0.05 && Math.abs(set.fans[1].stayed - 20) < 0.05);
});
