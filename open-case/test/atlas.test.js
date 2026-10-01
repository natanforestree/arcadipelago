import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { trackList, createAtlas, stopOf, trackOf, atlasKey, clickPlace, clickTrack, clickTitle, viewAt } from '../src/atlas.js';
import { STOPS } from '../src/places.js';
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

test('the tracks: the five ready-made ones, then your own beats, always', () => {
  const list = trackList(beats());
  assert.deepEqual(list.map((t) => t.name), [...READY.map((b) => b.name), 'Rainy bus', 'Sunday']);
  assert.deepEqual(list[1], { key: { ready: 'bossa' }, name: 'Bossa nova', bpm: 132, mood: 'A' });
  assert.deepEqual(list.slice(5).map((t) => t.key), [{ slot: 1 }, { slot: 4 }]);
  assert.deepEqual(trackList({ slots: Array(6).fill(null), chosen: null }).map((t) => t.name), READY.map((b) => b.name));
});

test('the map opens on the place and the track chosen last time, or the park and the first track', () => {
  const tracks = trackList(beats());
  const fresh = createAtlas({ tracks });
  assert.deepEqual([stopOf(fresh), trackOf(fresh).name, fresh.panel], ['park', 'Lo-fi', false]);
  const back = createAtlas({ place: 'market', tracks, chosen: { slot: 4 } });
  assert.deepEqual([stopOf(back), trackOf(back).name], ['market', 'Sunday']);
  assert.equal(trackOf(createAtlas({ tracks, chosen: { ready: 'funk' } })).name, 'Funk');
  assert.equal(trackOf(createAtlas({ tracks: trackList({ slots: Array(6).fill(null) }), chosen: { slot: 4 } })).name, 'Lo-fi', 'a beat that is gone: the first');
  assert.equal(stopOf(createAtlas({ place: 'pier', tracks })), 'park');
});

test('left and right step through the stops, round from the last to the first', () => {
  const a = createAtlas({ tracks: trackList(beats()) });
  assert.deepEqual(keys(a, 'ArrowRight'), ['place']);
  assert.equal(stopOf(a), 'station');
  keys(a, 'ArrowRight');
  assert.equal(stopOf(a), 'market');
  keys(a, 'ArrowRight', 'ArrowRight', 'ArrowRight');
  assert.equal(stopOf(a), 'park', 'past home, round to the park');
  keys(a, 'ArrowLeft', 'ArrowLeft', 'ArrowLeft');
  assert.equal(stopOf(a), 'market');
  assert.deepEqual(keys(a, 'ArrowUp', 'ArrowDown', 'Escape', 'KeyA'), [null, null, null, null], 'nothing else does anything with the tracks shut');
});

test('the shop is the fourth stop and home the fifth: right goes park, station, market, shop, home, park, and left from the park to home', () => {
  const a = createAtlas({ tracks: trackList(beats()) });
  const seen = [];
  for (let i = 0; i < 5; i++) { keys(a, 'ArrowRight'); seen.push(stopOf(a)); }
  assert.deepEqual(seen, ['station', 'market', 'shop', 'home', 'park']);
  keys(a, 'ArrowLeft');
  assert.equal(stopOf(a), 'home');
});

test('with the shop chosen, Enter and Space go into it, the tracks stay shut, also with straightGo', () => {
  for (const straightGo of [false, true]) {
    for (const code of ['Enter', 'NumpadEnter', 'Space']) {
      const a = createAtlas({ place: 'market', tracks: trackList(beats()), straightGo });
      keys(a, 'ArrowRight');
      assert.equal(stopOf(a), 'shop');
      assert.equal(atlasKey(a, code), 'shop', `${code}, straightGo ${straightGo}`);
      assert.ok(!a.panel);
    }
  }
});

test('with home chosen, Enter and Space go into the studio, the tracks stay shut, also with straightGo', () => {
  for (const straightGo of [false, true]) {
    for (const code of ['Enter', 'NumpadEnter', 'Space']) {
      const a = createAtlas({ tracks: trackList(beats()), straightGo });
      keys(a, 'ArrowLeft');
      assert.equal(stopOf(a), 'home');
      assert.equal(atlasKey(a, code), 'home', `${code}, straightGo ${straightGo}`);
      assert.ok(!a.panel);
    }
  }
});

test('the shop and home open on the park when asked for as the place: they are never a place to busk', () => {
  for (const place of ['shop', 'home']) {
    const a = createAtlas({ place, tracks: trackList(beats()) });
    assert.equal(stopOf(a), 'park', place);
  }
});

test('clicking the shop chooses it, clicking it again goes in, and with the tracks open it closes them', () => {
  const a = createAtlas({ tracks: trackList(beats()) });
  assert.equal(clickPlace(a, 'shop'), 'place');
  assert.equal(stopOf(a), 'shop');
  assert.equal(clickPlace(a, 'shop'), 'shop');
  assert.ok(!a.panel);
  const open = createAtlas({ tracks: trackList(beats()) });
  keys(open, 'Enter');
  assert.ok(open.panel);
  assert.equal(clickPlace(open, 'shop'), 'back');
  assert.deepEqual([stopOf(open), open.panel], ['shop', false]);
});

test('clicking home chooses it, clicking it again goes in, and with the tracks open it closes them', () => {
  const a = createAtlas({ tracks: trackList(beats()) });
  assert.equal(clickPlace(a, 'home'), 'place');
  assert.equal(stopOf(a), 'home');
  assert.equal(clickPlace(a, 'home'), 'home');
  assert.ok(!a.panel);
  const straight = createAtlas({ tracks: trackList(beats()), straightGo: true });
  clickPlace(straight, 'home');
  assert.equal(clickPlace(straight, 'home'), 'home', 'straightGo makes no difference');
  const open = createAtlas({ tracks: trackList(beats()) });
  keys(open, 'Enter');
  assert.ok(open.panel);
  assert.equal(clickPlace(open, 'home'), 'back');
  assert.deepEqual([stopOf(open), open.panel], ['home', false]);
});

test('Enter opens the tracks; up and down choose one, Enter goes, Esc shuts them again', () => {
  const a = createAtlas({ place: 'station', tracks: trackList(beats()) });
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
  assert.equal(stopOf(a), 'station');
  const end = createAtlas({ tracks: trackList(beats()) });
  keys(end, 'Enter', ...Array(6).fill('ArrowDown')); // the five ready-made tracks and your two
  assert.deepEqual(keys(end, 'ArrowDown'), [null], 'already at the bottom');
});

test("after the studio's Busk to this, Enter on a place goes straight there", () => {
  const a = createAtlas({ place: 'park', tracks: trackList(beats()), chosen: { slot: 1 }, straightGo: true });
  assert.deepEqual(keys(a, 'ArrowRight', 'Enter'), ['place', 'go']);
  assert.equal(stopOf(a), 'station');
  assert.equal(trackOf(a).name, 'Rainy bus');
  assert.ok(!a.panel);
});

test('clicks: a place chooses it, the chosen place opens the tracks, a track chooses it, the chosen track goes', () => {
  const a = createAtlas({ tracks: trackList(beats()) });
  assert.equal(clickPlace(a, 'market'), 'place');
  assert.equal(stopOf(a), 'market');
  assert.equal(clickPlace(a, 'market'), 'panel');
  assert.equal(clickTrack(a, 3), 'track');
  assert.equal(trackOf(a).name, 'Reggae');
  assert.equal(clickTrack(a, 3), 'go');
  assert.equal(clickTrack(a, 9), null);
  assert.equal(clickPlace(a, 'park'), 'back', 'a place while the tracks are open: chosen, and they shut');
  assert.deepEqual([stopOf(a), a.panel], ['park', false]);
  assert.equal(clickTrack(a, 1), null, 'no tracks to click while they are shut');
  assert.equal(clickPlace(a, 'pier'), null);
  const straight = createAtlas({ tracks: trackList(beats()), straightGo: true });
  assert.equal(clickPlace(straight, 'park'), 'go');
});

test('the view centres on the chosen place, kept inside the map', () => {
  const screen = [1280, 720];
  for (const place of STOPS) {
    const a = createAtlas({ tracks: trackList(beats()) });
    a.at = STOPS.indexOf(place);
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

test('the title: off unless asked for, and any key but Esc clears it and does nothing else', () => {
  assert.equal(createAtlas({ tracks: trackList(beats()) }).intro, false);
  assert.equal(createAtlas({ tracks: trackList(beats()), intro: true }).intro, true);
  for (const code of ['ArrowRight', 'Enter', 'Space']) {
    const a = createAtlas({ tracks: trackList(beats()), intro: true });
    const [at, track] = [a.at, a.track];
    assert.equal(atlasKey(a, code), 'start', code);
    assert.equal(a.intro, false, code);
    assert.deepEqual([a.at, a.panel, a.track], [at, false, track], `${code} changes nothing else`);
    assert.deepEqual(keys(a, 'ArrowRight'), ['place']);
    assert.equal(a.at, at + 1);
  }
  const up = createAtlas({ tracks: trackList(beats()), intro: true });
  assert.equal(atlasKey(up, 'Escape'), null);
  assert.equal(up.intro, true, 'Esc leaves the title up');
});

test('the title: a click on a place or a track clears it without choosing, and clickTitle clears it', () => {
  const a = createAtlas({ tracks: trackList(beats()), intro: true });
  const [at, track] = [a.at, a.track];
  assert.equal(clickPlace(a, 'market'), 'start');
  assert.equal(a.intro, false);
  assert.deepEqual([a.at, a.panel, a.track], [at, false, track]);
  const b = createAtlas({ tracks: trackList(beats()), intro: true });
  assert.equal(clickTrack(b, 2), 'start');
  assert.equal(b.intro, false);
  assert.deepEqual([b.at, b.panel, b.track], [at, false, track]);
  const c = createAtlas({ tracks: trackList(beats()), intro: true });
  assert.equal(clickTitle(c), 'start');
  assert.equal(c.intro, false);
  assert.equal(clickTitle(c), null, 'no title, nothing to click');
});
