import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLACE_IDS, STOPS, SHOP_WORDS, PLACE_WORDS, isPlace, loadPlace, savePlace } from '../src/places.js';
import { PLACES, CROWD, TIPS } from '../src/tuning.js';
import { safeStorage } from '../src/storage.js';

// A storage backed by a plain object, like the browser's localStorage.
function memory(start = {}) {
  const data = { ...start };
  return { data, store: safeStorage({ getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } }) };
}

test('three places, each with its words for the map, the prompt and the end card, and its crowd', () => {
  assert.deepEqual(PLACE_IDS, ['park', 'station', 'market']);
  for (const id of PLACE_IDS) {
    assert.ok(PLACE_WORDS[id].name && PLACE_WORDS[id].at && PLACE_WORDS[id].crowd, id);
    assert.ok(PLACES[id], id);
  }
  assert.equal(PLACE_WORDS.station.name, 'The Station');
  assert.equal(PLACE_WORDS.market.at, 'at the night market');
  assert.ok(isPlace('market') && !isPlace('pier') && !isPlace(null));
});

test('the map has a fourth stop, the shop, which is not a place to busk', () => {
  assert.deepEqual(STOPS, ['park', 'station', 'market', 'shop']);
  assert.equal(SHOP_WORDS.name, 'The Music Shop');
  assert.equal(SHOP_WORDS.about, 'pedals · instruments · the studio');
  assert.ok(!isPlace('shop'));
  assert.equal(loadPlace(memory({ 'open-case-place': 'shop' }).store), 'park', 'a stored shop loads as the park');
  const { data, store } = memory();
  savePlace(store, 'shop');
  assert.equal(data['open-case-place'], undefined, 'the shop is never kept');
});

test("the park's crowd is the crowd's own numbers, so a set there plays as it always has", () => {
  const p = PLACES.park;
  assert.deepEqual(p.kinds, [1, 1, 1, 1]);
  assert.deepEqual(p.arrive, [CROWD.arriveMin, CROWD.arriveMax]);
  assert.deepEqual(p.stay, [CROWD.budgetMin, CROWD.budgetMax]);
  assert.equal(p.onScreen, CROWD.onScreen);
  assert.equal(p.waves, null);
  assert.equal(p.pace, 1);
  assert.equal(p.patience, 1);
  assert.equal(p.tips, TIPS);
});

test('the place chosen is kept, and a missing or unknown one is the park', () => {
  const { data, store } = memory();
  assert.equal(loadPlace(store), 'park');
  savePlace(store, 'station');
  assert.equal(data['open-case-place'], 'station');
  assert.equal(loadPlace(store), 'station');
  savePlace(store, 'pier');
  assert.equal(loadPlace(store), 'station', 'not a place: not kept');
  assert.equal(loadPlace(memory({ 'open-case-place': '{"x":1}' }).store), 'park');
  assert.equal(loadPlace(safeStorage(null)), 'park', 'no storage at all');
});
