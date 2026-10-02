import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLACE_IDS, STOPS, STOP_WORDS, PLACE_WORDS, isPlace, loadPlace, savePlace } from '../src/places.js';
import { PLACES, CROWD, TIPS } from '../src/tuning.js';
import { safeStorage } from '../src/storage.js';

// A storage backed by a plain object, like the browser's localStorage.
function memory(start = {}) {
  const data = { ...start };
  return { data, store: safeStorage({ getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } }) };
}

test('four places, each with its words for the map, the prompt and the end card, and its crowd', () => {
  assert.deepEqual(PLACE_IDS, ['park', 'station', 'market', 'island']);
  for (const id of PLACE_IDS) {
    assert.ok(PLACE_WORDS[id].name && PLACE_WORDS[id].at && PLACE_WORDS[id].crowd, id);
    assert.ok(PLACES[id], id);
  }
  assert.equal(PLACE_WORDS.station.name, 'The Station');
  assert.equal(PLACE_WORDS.market.at, 'at the night market');
  assert.deepEqual(PLACE_WORDS.island, { name: 'One Tree Island', at: 'on One Tree Island', crowd: 'Just you and the animals · no coins' });
  assert.equal(PLACES.island.coins, false, 'nobody pays on the island');
  assert.ok(isPlace('market') && !isPlace('pier') && !isPlace(null));
});

test('the map has two more stops, the shop and home, which are not places to busk', () => {
  assert.deepEqual(STOPS, ['park', 'station', 'market', 'island', 'shop', 'home']);
  assert.deepEqual(STOP_WORDS.shop, { name: 'The Music Shop', about: 'pedals · instruments' });
  assert.deepEqual(STOP_WORDS.home, { name: 'Home', about: 'your studio · your keepsakes' });
  assert.ok(!isPlace('shop') && !isPlace('home'));
  assert.equal(loadPlace(memory({ 'open-case-place': 'home' }).store), 'park', 'a stored home loads as the park');
  assert.equal(loadPlace(memory({ 'open-case-place': 'shop' }).store), 'park', 'a stored shop loads as the park');
  const { data, store } = memory();
  savePlace(store, 'shop');
  savePlace(store, 'home');
  assert.equal(data['open-case-place'], undefined, 'the shop and home are never kept');
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
