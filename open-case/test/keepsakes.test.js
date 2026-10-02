import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  KEEPSAKES, keepsake, hint, nextFrom, chanceOf, keepsakeFor, loadKeepsakes, saveKeepsakes, addFound, toggleCase, someKeepsakes,
} from '../src/keepsakes.js';
import { ANIMAL_IDS } from '../src/animals.js';
import { KEEPSAKE } from '../src/tuning.js';
import { safeStorage } from '../src/storage.js';

// A storage backed by a plain object, like the browser's localStorage.
function memory(start = {}) {
  const data = { ...start };
  return { data, store: safeStorage({ getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } }) };
}
const ALL = KEEPSAKES.map((k) => k.id);
// A set's end on the island, with nothing found yet and nobody won over, the roll as high as it goes.
const end = (over) => ({ found: [], fondness: 0, fans: [], longest: null, first: null, roll: 0.999, ...over });

test("twenty-two keepsakes, an ordinary one and then a special one from each animal, in the animals' order", () => {
  assert.equal(KEEPSAKES.length, 22);
  assert.deepEqual(KEEPSAKES.map((k) => k.animal), ANIMAL_IDS.flatMap((id) => [id, id]));
  assert.deepEqual(KEEPSAKES.map((k) => k.special), ANIMAL_IDS.flatMap(() => [false, true]));
  assert.equal(new Set(ALL).size, 22, 'each its own id');
  for (const k of KEEPSAKES) assert.ok(k.name && k.a && k.line, k.id);
  assert.deepEqual(keepsake('sock'), { id: 'sock', animal: 'fox', special: true, name: 'Odd sock', a: 'an odd sock', line: "the fox won't say whose it was" });
  assert.equal(keepsake('spoon'), null);
});

test("a keepsake you haven't found gives a hint: the animal it's from, and what that animal likes", () => {
  assert.deepEqual(hint('blackberry'), { name: 'Something from the fox', line: 'the fox likes the groove' });
  assert.deepEqual(hint('ring'), { name: 'Something special from the crow', line: 'the crow likes a tune brought back' });
  assert.deepEqual(hint('feather'), { name: 'Something from the ducks', line: 'the ducks like busy playing' });
  assert.deepEqual(hint('pebble'), { name: 'Something from the heron', line: 'the heron likes space and long notes' });
});

test('an animal gives its ordinary keepsake first, then its special one, then nothing', () => {
  assert.equal(nextFrom('fox', []), 'blackberry');
  assert.equal(nextFrom('fox', ['blackberry']), 'sock');
  assert.equal(nextFrom('fox', ['sock', 'blackberry']), null);
  assert.equal(nextFrom('fox', ['sock']), 'blackberry', 'the ordinary one first, even after the special');
});

test('the chance is nothing with no fondness, and rises with it to its cap', () => {
  assert.equal(chanceOf(0), 0);
  assert.ok(Math.abs(chanceOf(KEEPSAKE.full / 2) - KEEPSAKE.most / 2) < 1e-12);
  assert.equal(chanceOf(KEEPSAKE.full), KEEPSAKE.most);
  assert.equal(chanceOf(KEEPSAKE.full * 4), KEEPSAKE.most);
  assert.ok(KEEPSAKE.most > 0.15 && KEEPSAKE.most < 0.35, 'about 1 in 4');
});

test('your first set on the island always leaves the ordinary keepsake of the animal that stayed longest, or the first that came by', () => {
  assert.equal(keepsakeFor(end({ longest: { kind: 'student', look: 0, seconds: 94 }, first: { kind: 'elder', look: 0 } })), 'blackberry');
  assert.equal(keepsakeFor(end({ first: { kind: 'commuter', look: 1 } })), 'owlfeather', 'nobody settled: the first that came by');
  assert.equal(keepsakeFor(end({})), null, 'nobody came at all');
});

test('after that, a set where no animal was won over leaves nothing, however the roll falls', () => {
  const found = ['dandelion'];
  assert.equal(keepsakeFor(end({ found, roll: 0 })), null, 'no fondness');
  assert.equal(keepsakeFor(end({ found, fondness: 40, roll: 0 })), null, 'fondness, but no fan');
  assert.equal(keepsakeFor(end({ found, fondness: 40, fans: [{ animal: 'fox', stayed: 30 }], roll: KEEPSAKE.most })), null, 'the roll missed');
  assert.equal(keepsakeFor(end({ found, fondness: 40, fans: [{ animal: 'fox', stayed: 30 }], roll: KEEPSAKE.most - 0.01 })), 'blackberry');
});

test('it comes from the fan that stayed longest with one still to give', () => {
  const fans = [{ animal: 'fox', stayed: 20 }, { animal: 'crow', stayed: 90 }, { animal: 'heron', stayed: 50 }];
  const leaves = (found) => keepsakeFor(end({ found, fondness: 40, fans, roll: 0 }));
  assert.equal(leaves(['dandelion']), 'bottlecap');
  assert.equal(leaves(['dandelion', 'bottlecap']), 'ring');
  assert.equal(leaves(['dandelion', 'bottlecap', 'ring']), 'pebble');
  assert.equal(leaves(['bottlecap', 'ring', 'pebble', 'fishbones', 'blackberry', 'sock']), null, 'no fan has one left');
});

test('never one you have, and nothing once you have all 22', () => {
  assert.equal(keepsakeFor(end({ found: ALL, fondness: 99, fans: [{ animal: 'owl', stayed: 99 }], roll: 0 })), null);
  assert.equal(keepsakeFor(end({ found: ALL.filter((id) => id !== 'acorn'), fondness: 99, fans: [{ animal: 'squirrel', stayed: 9 }], roll: 0 })), 'acorn');
});

test('the keepsakes you find and the ones in your case are kept for good', () => {
  const { data, store } = memory();
  const keeps = loadKeepsakes(store);
  assert.deepEqual(keeps, { found: [], inCase: [] });
  addFound(keeps, 'blackberry');
  addFound(keeps, 'bottlecap');
  toggleCase(keeps, 'bottlecap');
  saveKeepsakes(store, keeps);
  assert.deepEqual(JSON.parse(data['open-case-keepsakes']), { found: ['blackberry', 'bottlecap'], inCase: ['blackberry', 'bottlecap'] });
  assert.deepEqual(loadKeepsakes(store), keeps, 'as they were, after a reload');
});

test('anything unreadable, unknown, twice over or not found is left out of what was kept, and the case holds three', () => {
  const load = (kept) => loadKeepsakes(memory({ 'open-case-keepsakes': kept }).store);
  for (const bad of ['{nope', '7', 'null', '"acorn"', '{"found":"acorn"}', '[]']) assert.deepEqual(load(bad), { found: [], inCase: [] }, bad);
  assert.deepEqual(load('{"found":["acorn","spoon",3,"acorn","ring"],"inCase":["ring","sock",null]}'), { found: ['acorn', 'ring'], inCase: ['ring'] });
  assert.deepEqual(load(JSON.stringify({ found: ALL, inCase: ALL })), { found: ALL, inCase: ALL.slice(0, 3) });
  assert.deepEqual(loadKeepsakes(safeStorage(null)), { found: [], inCase: [] }, 'no storage at all');
});

test('your first keepsake goes into your case by itself; later ones only join the shelf, and none twice', () => {
  const keeps = { found: [], inCase: [] };
  addFound(keeps, 'lily');
  assert.deepEqual(keeps, { found: ['lily'], inCase: ['lily'] });
  addFound(keeps, 'acorn');
  addFound(keeps, 'lily');
  addFound(keeps, 'spoon');
  assert.deepEqual(keeps, { found: ['lily', 'acorn'], inCase: ['lily'] });
});

test('your case: a found keepsake goes in or comes out, a fourth is refused, and one not found does nothing', () => {
  const keeps = { found: ['lily', 'acorn', 'ring', 'sock'], inCase: ['lily'] };
  assert.equal(toggleCase(keeps, 'acorn'), 'in');
  assert.equal(toggleCase(keeps, 'ring'), 'in');
  assert.equal(toggleCase(keeps, 'sock'), 'full');
  assert.deepEqual(keeps.inCase, ['lily', 'acorn', 'ring']);
  assert.equal(toggleCase(keeps, 'lily'), 'out');
  assert.equal(toggleCase(keeps, 'sock'), 'in');
  assert.deepEqual(keeps.inCase, ['acorn', 'ring', 'sock'], 'in the order put in');
  assert.equal(toggleCase(keeps, 'bell'), null);
  assert.deepEqual(keeps.inCase, ['acorn', 'ring', 'sock']);
});

test('?keepsakes= gives the first n in the list, the first three in your case', () => {
  assert.deepEqual(someKeepsakes(0), { found: [], inCase: [] });
  assert.deepEqual(someKeepsakes(2), { found: ['dandelion', 'clover'], inCase: ['dandelion', 'clover'] });
  assert.deepEqual(someKeepsakes(5).inCase, ['dandelion', 'clover', 'feather']);
  assert.deepEqual(someKeepsakes(99).found, ALL);
});
