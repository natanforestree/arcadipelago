import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ANIMALS, ANIMAL_IDS, ANIMALS_OF, LIKES, animalName } from '../src/animals.js';
import { KINDS } from '../src/crowd.js';
import { ISLAND } from '../src/tuning.js';

test("eleven animals, each standing for one kind of town listener, listed in its kind's order", () => {
  assert.deepEqual(ANIMAL_IDS, ['bunny', 'ducks', 'squirrel', 'heron', 'turtle', 'deer', 'fox', 'frog', 'hedgehog', 'crow', 'owl']);
  assert.deepEqual(Object.keys(ANIMALS_OF), KINDS);
  assert.deepEqual(Object.values(ANIMALS_OF).flat(), ANIMAL_IDS, "every animal once, in the list's order");
  for (const [kind, ids] of Object.entries(ANIMALS_OF)) for (const id of ids) assert.equal(ANIMALS[id].kind, kind, id);
  for (const kind of KINDS) assert.ok(LIKES[kind], kind);
});

test('each animal crosses in its own way and settles on spots of its own sort, which the island has', () => {
  const sorts = new Set(ISLAND.spots.map(([, , s]) => s));
  for (const id of ANIMAL_IDS) {
    const a = ANIMALS[id];
    assert.ok(['land', 'water', 'sky'].includes(a.cross), id);
    assert.ok(Number.isFinite(ISLAND.lanes[a.cross]), id);
    assert.ok(a.spots.length >= 1 && a.spots.every((s) => sorts.has(s)), id);
    assert.match(a.name, /^the /);
  }
  assert.equal(ANIMALS.turtle.spots[0], 'rock', 'the turtle takes the rock first');
  assert.equal(animalName('heron'), 'The heron');
  assert.equal(animalName('ducks'), 'The ducks');
});

test('the island has eleven spots: three in the pine, four on the grass, two in the shallows, the rock and the lily pad', () => {
  const count = (sort) => ISLAND.spots.filter(([, , s]) => s === sort).length;
  assert.equal(ISLAND.spots.length, 11);
  assert.deepEqual(['pine', 'grass', 'shallows', 'rock', 'lily'].map(count), [3, 4, 2, 1, 1]);
  const landAnimals = Object.values(ANIMALS).filter((a) => a.spots[0] === 'grass').length;
  assert.equal(count('grass'), landAnimals, 'room on the grass for every animal that settles there');
  for (const [x, y] of ISLAND.spots) assert.ok(x > 0 && x < 320 && y > 0 && y < 180, `${x}, ${y}`);
});
