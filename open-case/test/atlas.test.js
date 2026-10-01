import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { trackList, createAtlas, placeOf, trackOf, atlasKey, clickPlace, clickTrack, viewAt } from '../src/atlas.js';
import { READY, blankBeat } from '../src/beats.js';

const map = JSON.parse(readFileSync(new URL('../assets/map/map.json', import.meta.url), 'utf8'));
// Your beats as studio.js keeps them: six slots, two of them yours.
const beats = () => {
  const slots = Array(6).fill(null);
  slots[1] = { ...blankBeat('x'), name: 'Rainy bus', bpm: 92 };
  slots[4] = { ...blankBeat('y'), name: 'Sunday', bpm: 70 };
  return { slots, chosen: null };
};
const keys = (a, ...codes) => codes.map((c) => atlasKey(a, c));

test('the tracks: the five ready-made ones for everyone, then your own once the studio is yours', () => {
  const without = trackList(beats(), false), withIt = trackList(beats(), true);
  assert.deepEqual(without.map((t) => t.name), READY.map((b) => b.name));
  assert.deepEqual(without[1], { key: { ready: 'bossa' }, name: 'Bossa nova', bpm: 132, mood: 'A' });
  assert.deepEqual(withIt.map((t) => t.name), [...READY.map((b) => b.name), 'Rainy bus', 'Sunday']);
  assert.deepEqual(withIt.slice(5).map((t) => t.key), [{ slot: 1 }, { slot: 4 }]);
});

test('the map opens on the place and the track chosen last time, or the park and the first track', () => {
  const tracks = trackList(beats(), true);
  const fresh = createAtlas({ tracks });
  assert.deepEqual([placeOf(fresh), trackOf(fresh).name, fresh.panel], ['park', 'Lo-fi', false]);
  const back = createAtlas({ place: 'market', tracks, chosen: { slot: 4 } });
  assert.deepEqual([placeOf(back), trackOf(back).name], ['market', 'Sunday']);
  assert.equal(trackOf(createAtlas({ tracks, chosen: { ready: 'funk' } })).name, 'Funk');
  assert.equal(trackOf(createAtlas({ tracks: trackList(beats(), false), chosen: { slot: 4 } })).name, 'Lo-fi', 'your beat, without the studio: the first');
  assert.equal(placeOf(createAtlas({ place: 'pier', tracks })), 'park');
});

test('left and right step through the places, round from the last to the first', () => {
  const a = createAtlas({ tracks: trackList(beats(), false) });
  assert.deepEqual(keys(a, 'ArrowRight'), ['place']);
  assert.equal(placeOf(a), 'station');
  keys(a, 'ArrowRight');
  assert.equal(placeOf(a), 'market');
  keys(a, 'ArrowRight');
  assert.equal(placeOf(a), 'park');
  keys(a, 'ArrowLeft');
  assert.equal(placeOf(a), 'market');
  assert.deepEqual(keys(a, 'ArrowUp', 'ArrowDown', 'Escape', 'KeyA'), [null, null, null, null], 'nothing else does anything with the tracks shut');
});

test('Enter opens the tracks; up and down choose one, Enter goes, Esc shuts them again', () => {
  const a = createAtlas({ place: 'station', tracks: trackList(beats(), false) });
  assert.deepEqual(keys(a, 'Enter'), ['panel']);
  assert.ok(a.panel);
  assert.deepEqual(keys(a, 'ArrowUp'), [null], 'already at the top');
  assert.deepEqual(keys(a, 'ArrowDown', 'ArrowDown'), ['track', 'track']);
  assert.equal(trackOf(a).name, 'Funk');
  assert.deepEqual(keys(a, 'ArrowLeft'), [null], 'the places hold still while the tracks are open');
  assert.deepEqual(keys(a, 'Escape'), ['back']);
  assert.ok(!a.panel);
  assert.equal(trackOf(a).name, 'Funk', 'the track chosen stays chosen');
  assert.deepEqual(keys(a, 'Space', 'Space'), ['panel', 'go'], 'Space works as Enter');
  assert.equal(placeOf(a), 'station');
  const end = createAtlas({ tracks: trackList(beats(), false) });
  keys(end, 'Enter', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown');
  assert.deepEqual(keys(end, 'ArrowDown'), [null], 'already at the bottom');
});

test("after the studio's Busk to this, Enter on a place goes straight there", () => {
  const a = createAtlas({ place: 'park', tracks: trackList(beats(), true), chosen: { slot: 1 }, straightGo: true });
  assert.deepEqual(keys(a, 'ArrowRight', 'Enter'), ['place', 'go']);
  assert.equal(placeOf(a), 'station');
  assert.equal(trackOf(a).name, 'Rainy bus');
  assert.ok(!a.panel);
});

test('clicks: a place chooses it, the chosen place opens the tracks, a track chooses it, the chosen track goes', () => {
  const a = createAtlas({ tracks: trackList(beats(), false) });
  assert.equal(clickPlace(a, 'market'), 'place');
  assert.equal(placeOf(a), 'market');
  assert.equal(clickPlace(a, 'market'), 'panel');
  assert.equal(clickTrack(a, 3), 'track');
  assert.equal(trackOf(a).name, 'Reggae');
  assert.equal(clickTrack(a, 3), 'go');
  assert.equal(clickTrack(a, 9), null);
  assert.equal(clickPlace(a, 'park'), 'back', 'a place while the tracks are open: chosen, and they shut');
  assert.deepEqual([placeOf(a), a.panel], ['park', false]);
  assert.equal(clickTrack(a, 1), null, 'no tracks to click while they are shut');
  assert.equal(clickPlace(a, 'pier'), null);
  const straight = createAtlas({ tracks: trackList(beats(), false), straightGo: true });
  assert.equal(clickPlace(straight, 'park'), 'go');
});

test('the view centres on the chosen place, kept inside the map', () => {
  const screen = [1280, 720];
  for (const place of ['park', 'station', 'market']) {
    const a = createAtlas({ place, tracks: trackList(beats(), false) });
    const { x, y } = viewAt(a, map, screen), [cx, cy] = map.places[place].view;
    assert.ok(x >= 0 && y >= 0 && x + screen[0] <= map.size[0] && y + screen[1] <= map.size[1], `${place}: ${x}, ${y}`);
    assert.ok(x === 0 || x === map.size[0] - screen[0] || Math.abs(x + screen[0] / 2 - cx) <= 1, `${place} centred across`);
    assert.ok(y === 0 || y === map.size[1] - screen[1] || Math.abs(y + screen[1] / 2 - cy) <= 1, `${place} centred down`);
    const [px, py] = map.places[place].pin;
    assert.ok(px > x && px < x + screen[0] && py > y && py < y + screen[1], `${place}'s pin is in view`);
  }
  const wide = viewAt(createAtlas({ tracks: [] }), map, map.size);
  assert.deepEqual(wide, { x: 0, y: 0 }, 'a screen as big as the map sees all of it');
});
