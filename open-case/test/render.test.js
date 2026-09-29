import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRenderer, shapeTags, personFrame, youFrame, treeFrame, W, H } from '../src/render.js';
import { createSet, runSet } from '../src/set.js';
import { createScene, createFlocks, sceneNote, CASE, PIGEONS } from '../src/scene.js';
import { createKeyState } from '../src/keys.js';
import { goodSet } from '../src/bots.js';
import { KINDS } from '../src/crowd.js';
import { BAR, BEAT } from '../src/groove.js';
import { INTEREST } from '../src/tuning.js';
import { STOCK, PEDALS, INSTRUMENTS, freshGear, buy, stomp } from '../src/gear.js';
import { createShop, CARD, BUTTON } from '../src/shop.js';
import { stoodAt } from './helpers.js';

// The real frame data, with a stand-in for the sheet's image.
const data = JSON.parse(readFileSync(new URL('../assets/sprites.json', import.meta.url), 'utf8'));
const art = { sheet: { fake: 'sheet' }, frames: data.frames, data };
// Which frame a drawImage call took from the sheet, by where it was cut from.
const frameAt = new Map(Object.entries(data.frames).map(([name, [x, y]]) => [`${x},${y}`, name]));

// A stand-in 2D context that records what's drawn: every filled rectangle, every piece of text (both
// the strings alone, in `texts`, and their positions, in `positions`, for layout checks) and every
// sprite, by name, with where it went (in `sprites`). measureText is a rough stand-in (6px/char): real
// widths come from the browser's own font metrics.
function fakeContext() {
  const rects = [], texts = [], positions = [], sprites = [];
  return {
    rects, texts, positions, sprites,
    fillStyle: '', font: '', textAlign: '', textBaseline: '', globalAlpha: 1, imageSmoothingEnabled: true,
    fillRect(x, y, w, h) {
      assert.ok([x, y, w, h].every(Number.isFinite), `fillRect(${x}, ${y}, ${w}, ${h})`);
      rects.push([x, y, w, h, this.fillStyle]);
    },
    fillText(s, x, y) {
      texts.push(s);
      positions.push({ s, x, y, align: this.textAlign });
    },
    measureText(s) {
      return { width: s.length * 6 };
    },
    drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh) {
      assert.equal(img, art.sheet);
      assert.ok([sx, sy, dx, dy].every(Number.isInteger), `drawImage at ${dx}, ${dy}`);
      assert.ok(sw === dw && sh === dh, 'drawn at 1:1');
      sprites.push({ name: frameAt.get(`${sx},${sy}`), x: dx, y: dy });
    },
  };
}
const drawn = (g, prefix) => g.sprites.filter((s) => s.name.startsWith(prefix));

const view = (over) => ({
  screen: 'playing', set: null, scene: createScene(1), keys: createKeyState(), t: 0, bars: 0, time: 1, still: false,
  flocks: createFlocks(1), gear: freshGear(), stomp: null, shop: null, debug: null, ...over,
});
// Gear with everything bought: every pedal (the odd ones on) and every instrument, playing `instrument`.
function allGear(instrument = 'acoustic') {
  const gear = { ...freshGear(), savings: 10000 };
  for (const item of STOCK) buy(gear, item.id);
  PEDALS.forEach((id, i) => i % 2 === 0 && stomp(gear, id));
  gear.instrument = instrument;
  return gear;
}

test('the title shows the name, the key layout and how to start, over the park at dusk', () => {
  const g = fakeContext();
  createRenderer(g, art)(view({ screen: 'title' }));
  assert.ok(g.texts.includes('Open Case'));
  assert.ok(['A', 'W', "'", 'press any key'].every((s) => g.texts.includes(s)));
  assert.ok(g.texts.some((s) => s.startsWith('2-6 your pedals')), 'the pedal keys');
  assert.ok(g.rects.some(([x, y, w]) => x === 0 && y === 0 && w === W), 'the sky behind it');
  for (const n of ['ground', 'lamp-off', 'you-acoustic-idle-', 'case', 'sun']) assert.ok(drawn(g, n).length, n);
  assert.equal(drawn(g, 'pool').length, 0, 'the lamp is off at dusk');
});

test('a set in full swing draws everyone, their reactions, the trail and the strip without error', () => {
  const g = fakeContext();
  const set = runSet(1, goodSet(1)); // a whole set, so the strip is full
  const scene = createScene(1);
  for (const [i, n] of set.listen.notes.slice(-12).entries()) sceneNote(scene, n.pitch, set.listen.notes.length - 12 + i, set.t - 2 + i * 0.1);
  scene.gold = { t: set.t - 0.5, first: 0 };
  scene.caseCoins = 7;
  const rules = ['repeat', 'offKey', 'callback', 'recognised', 'random', 'silence', 'loud', 'taste'];
  KINDS.forEach((kind, i) => stoodAt(set.crowd, kind, i, { reaction: { rule: rules[i], t: set.t } }));
  stoodAt(set.crowd, 'jogger', 4, { reaction: { rule: rules[4], t: set.t }, state: 'passing', dir: -1 });
  stoodAt(set.crowd, 'oldman', 5, { reaction: { rule: rules[7], t: set.t }, state: 'leaving' });
  createRenderer(g, art)(view({ set, scene, t: set.t, bars: set.t / BAR, debug: { reported: 12, measured: 18 } }));
  for (const r of ['repeat', 'offKey', 'callback', 'recognised', 'random', 'taste']) assert.equal(drawn(g, `react-${r}-`).length, 1, r);
  assert.equal(drawn(g, 'case-coin').length, 7, 'the coins in the case');
  assert.ok(g.texts.some((s) => s.startsWith('delay 12ms  key 18ms')), 'the debug panel');
  assert.ok(g.texts.includes('they remember'), 'the strip is labelled for a first-time player');
  assert.ok(g.texts.includes('callback!'), 'a callback pops up by the lit box');
  assert.ok(g.rects.every(([x, y]) => x > -40 && x < W + 40 && y > -40 && y < H + 40));
});

test('every frame the renderer asks for is in the sheet, over a whole set, with and without motion', () => {
  // sprite() throws on a name the sheet doesn't have, so drawing every case without an error is the check.
  const set = createSet(2);
  const rules = ['repeat', 'offKey', 'callback', 'recognised', 'random', 'silence', 'loud', 'taste'];
  const states = ['passing', 'joining', 'stopped', 'leaving'];
  KINDS.forEach((kind, i) => {
    for (const [j, state] of states.entries()) {
      stoodAt(set.crowd, kind, (i + j) % 6, { state, dir: j % 2 ? 1 : -1, interest: j % 2 ? 0.9 : 0.3, x: 40 + i * 60 + j * 7, reaction: { rule: rules[(i + j) % 8], t: 0 } });
    }
  });
  const scene = createScene(2);
  scene.flights.push({ from: [200, 120], t: 0 });
  const draw = createRenderer(fakeContext(), art);
  const flocks = createFlocks(2);
  for (let t = 0; t < 62 * BAR; t += 0.37) {
    if (Math.abs(t - 20) < 0.2) sceneNote(scene, 60, 0, t, 4); // the pigeons scatter
    if (t % 3 < 0.37) sceneNote(scene, 62, 0, t, 3); // you play, on every instrument in turn
    set.t = t;
    for (const p of set.crowd.people) p.reaction.t = t - 0.1;
    const gear = allGear(INSTRUMENTS[Math.floor(t) % INSTRUMENTS.length]);
    const stomped = { id: PEDALS[Math.floor(t) % PEDALS.length], on: t % 2 < 1, time: t * 1.3 - 0.5 };
    for (const still of [false, true]) draw(view({ set, scene, t, bars: t / BAR, time: t * 1.3 - 0.01, still, flocks, gear, stomp: stomped }));
  }
});

test('the sky darkens over the set: dusk at the start, night at the end with the stars out and the lamp lit', () => {
  const dusk = fakeContext(), night = fakeContext();
  const set = createSet(1), scene = createScene(1);
  createRenderer(dusk, art)(view({ set, scene, t: 0.5, bars: 0.5 / BAR }));
  createRenderer(night, art)(view({ set, scene, t: 59.5 * BAR, bars: 59.5 }));
  const top = (g) => g.rects.find(([x, y, w]) => x === 0 && y === 0 && w === W)[4];
  assert.equal(top(dusk), data.sky[0][0]);
  assert.equal(top(night), data.sky[4][0]);
  assert.equal(drawn(dusk, 'sun').length, 1);
  assert.equal(drawn(night, 'sun').length, 0, 'the sun has set');
  assert.equal(drawn(night, 'pool').length, 1);
  assert.ok(drawn(night, 'lamp-on').length + drawn(night, 'lamp-flicker').length === 1);
  const stars = (g) => g.rects.filter(([x, y, w, h]) => w === 1 && h === 1 && data.stars.some(([sx, sy]) => sx === x && sy === y)).length;
  assert.equal(stars(dusk), 0);
  assert.equal(stars(night), 10);
  const windows = (g) => g.rects.filter(([x, y, w, h, c]) => w === 2 && h === 2 && c === data.colors.gold).length;
  assert.equal(windows(dusk), 0, 'no windows lit at dusk');
  assert.equal(windows(night), data.windows.length, 'every window lit by night');
  assert.ok(drawn(night, 'roofs-front-3').length === 1, "the rooftops follow the horizon's band");
});

test('with reduced motion there are no birds or train, and the clouds and trees hold still', () => {
  const scene = createScene(4);
  const t = scene.trainBar * BAR + 3; // the train is mid-crossing
  const flocks = createFlocks(4);
  const time = flocks.next + 4; // a flock is mid-sky
  const moving = fakeContext(), still = fakeContext();
  const set = createSet(4);
  createRenderer(moving, art)(view({ set, scene, t, bars: t / BAR, time, flocks }));
  createRenderer(still, art)(view({ set, scene, t, bars: t / BAR, time, flocks: createFlocks(4), still: true }));
  assert.ok(drawn(moving, 'bird-').length >= 1 && drawn(moving, 'train-').length === 1);
  assert.equal(drawn(still, 'bird-').length, 0);
  assert.equal(drawn(still, 'train-').length, 0);
  assert.deepEqual(drawn(still, 'trees-').map((s) => s.name), ['trees-0']);
  data.clouds.forEach(([x, y], i) => {
    const c = drawn(still, `cloud-${i}-`)[0], f = data.frames[c.name];
    assert.deepEqual([c.x + f[4], c.y + f[5]], [x, y], `cloud ${i} at home`);
  });
});

test('listeners face you once they stop, breathe standing, and nod on the beat once hooked', () => {
  const p = { kind: 'student', state: 'stopped', x: 80, y: 156, dir: -1, id: 3, interest: 0.3 };
  assert.match(personFrame(p, 0, 0), /^student-stand-\d-right$/, 'left of you, facing right');
  assert.match(personFrame({ ...p, x: 200 }, 0, 0), /-left$/);
  assert.match(personFrame({ ...p, state: 'passing' }, 0, 0), /^student-walk-\d-left$/, 'walking the way they go');
  const hooked = { ...p, interest: INTEREST.hook + 0.1 };
  assert.equal(personFrame(hooked, 10 * BEAT + 0.05, 0), 'student-nod-1-right', 'head down on the beat');
  assert.equal(personFrame(hooked, 10 * BEAT + BEAT * 0.6, 0), 'student-nod-0-right', 'up between beats');
  const steps = new Set([0, 4, 8, 12].map((dx) => personFrame({ ...p, state: 'passing', x: 100 + dx }, 0, 0)));
  assert.equal(steps.size, 4, 'a walker steps through four frames as they go');
});

test('you play your instrument on each note, then go back to breathing; the trees rustle on the bar line', () => {
  const scene = createScene(1);
  assert.match(youFrame(scene, 5, 5, 'acoustic'), /^you-acoustic-idle-\d$/);
  sceneNote(scene, 60, 0, 5, 3);
  assert.equal(youFrame(scene, 5, 5, 'acoustic'), 'you-acoustic-play-0');
  assert.equal(youFrame(scene, 5.1, 5.1, 'synth'), 'you-synth-play-1');
  assert.equal(youFrame(scene, 5.17, 5.17, 'ukulele'), 'you-ukulele-play-2');
  assert.match(youFrame(scene, 5.3, 5.3, 'epiano'), /^you-epiano-idle-\d$/);
  assert.equal(treeFrame(3 * BAR + 0.05, 1, true, false), 2);
  assert.notEqual(treeFrame(3 * BAR + 1, 1, true, false), 2);
  assert.notEqual(treeFrame(3 * BAR + 0.05, 1, false, false), 2, 'no rustle without a set');
  assert.equal(treeFrame(3 * BAR + 0.05, 1, true, true), 0);
});

test('a case with more coins than it has places for shows it full, not an error', () => {
  const g = fakeContext();
  const scene = createScene(1);
  scene.caseCoins = 250;
  createRenderer(g, art)(view({ set: createSet(1), scene, t: 1, bars: 0 }));
  assert.equal(drawn(g, 'case-coin').length, data.caseCoins.length);
});

test('a coin in flight spins on its way to the case', () => {
  const g = fakeContext();
  const set = createSet(1), scene = createScene(1);
  scene.flights.push({ from: [220, 116], t: 1 });
  createRenderer(g, art)(view({ set, scene, t: 1.3, bars: 1.3 / BAR }));
  const [coin] = drawn(g, 'coin-');
  assert.ok(coin && coin.x > CASE[0] - 10 && coin.x < 220);
});

test('the callback popup only shows while the gold moment is active', () => {
  const g = fakeContext();
  const set = runSet(1, goodSet(1));
  const scene = createScene(1);
  scene.gold = null;
  createRenderer(g, art)(view({ set, scene, t: set.t, bars: set.t / BAR }));
  assert.ok(g.texts.includes('they remember'), 'the strip is still labelled with no callback live');
  assert.ok(!g.texts.includes('callback!'), 'no popup without a live callback');
});

test('waiting for the first note, and paused', () => {
  const g = fakeContext();
  const draw = createRenderer(g, art);
  draw(view({ screen: 'ready' }));
  assert.ok(g.texts.includes('play a note to start the set'));
  g.rects.length = 0;
  draw(view({ screen: 'paused', set: createSet(1) }));
  assert.deepEqual(g.rects.at(-1).slice(0, 4), [0, 0, W, H], 'dimmed under the pause card');
});

test('an unknown frame is an error, not a blank', () => {
  const draw = createRenderer(fakeContext(), { ...art, frames: { ...art.frames, ground: undefined } });
  assert.throws(() => draw(view({})), /no sprite called ground/);
});

test('the debug panel tags your last notes by shape, repeats sharing a letter', () => {
  assert.equal(shapeTags([null, null, null, 'x', 'y', 'x', 'z']), '---ABAC');
});

test('the debug panel starts clear of the strip label, with a couple of px to spare', () => {
  const g = fakeContext();
  const set = runSet(1, goodSet(1));
  const scene = createScene(1);
  createRenderer(g, art)(view({ set, scene, t: set.t, bars: set.t / BAR, debug: { reported: 12, measured: 18 } }));
  const label = g.positions.find((p) => p.s === 'they remember');
  const panel = g.rects.find(([x, , w]) => x === W - 132 && w === 130);
  assert.ok(label && panel, 'both the label and the debug panel are drawn');
  assert.ok(panel[1] - (label.y + 8) >= 2, "the panel's top clears the label's ink by at least 2px");
});

test('the callback word stays inside the screen for the rightmost lit box', () => {
  const g = fakeContext();
  const set = runSet(1, goodSet(1));
  const scene = createScene(1);
  const idea = { steps: [2, -1, 3], gaps: [1, 1, 1], pitch: 60, bar: 0, calledBar: null };
  set.listen.strip = [idea, idea, idea, idea, idea, idea]; // a full strip: the lit box (i = n - 1) is the rightmost
  scene.gold = { t: set.t - 0.3, first: 0 };
  createRenderer(g, art)(view({ set, scene, t: set.t, bars: set.t / BAR }));
  const word = g.positions.filter((p) => p.s === 'callback!');
  assert.equal(word.length, 2, 'the shadow and the gold copy both draw');
  for (const { x, align } of word) {
    assert.equal(align, 'left', 'the rightmost box places the word to its right');
    assert.ok(x + 'callback!'.length * 6 <= W - 4, 'its ink stays clear of the right edge');
  }
});

test('listeners are drawn nearest last, so someone in front covers someone behind', () => {
  const g = fakeContext();
  const set = createSet(1);
  stoodAt(set.crowd, 'jogger', 1); // y 156
  stoodAt(set.crowd, 'commuter', 0); // y 150
  createRenderer(g, art)(view({ set, scene: createScene(1), t: 1, bars: 0 }));
  const order = g.sprites.map((s) => s.name.split('-')[0]).filter((n) => ['jogger', 'commuter', 'you', 'case'].includes(n));
  assert.deepEqual(order, ['commuter', 'you', 'jogger', 'case']);
});

test('your instrument, your pedals by the crate, and the amp with the electric guitar', () => {
  const plain = fakeContext();
  createRenderer(plain, art)(view({ set: createSet(1), t: 1 }));
  assert.equal(drawn(plain, 'pedal-').length, 0, 'no pedals yet');
  assert.equal(drawn(plain, 'amp').length, 0);
  const g = fakeContext();
  createRenderer(g, art)(view({ set: createSet(1), t: 1, gear: allGear('electric') }));
  assert.equal(drawn(g, 'you-electric-').length, 1);
  assert.equal(drawn(g, 'amp').length, 1);
  assert.deepEqual(drawn(g, 'pedal-').map((s) => s.name), ['pedal-overdrive-1', 'pedal-chorus-0', 'pedal-tremolo-1', 'pedal-delay-0', 'pedal-reverb-1']);
  const keys = fakeContext();
  createRenderer(keys, art)(view({ set: createSet(1), t: 1, gear: allGear('epiano') }));
  assert.equal(drawn(keys, 'you-epiano-').length, 1);
  assert.equal(drawn(keys, 'amp').length, 0, 'the amp is only for the electric guitar');
});

test('the gear strip shows each pedal you own in its place, with its key, lit while on', () => {
  const g = fakeContext();
  const gear = { ...freshGear(), savings: 500 };
  buy(gear, 'chorus');
  buy(gear, 'delay');
  stomp(gear, 'delay');
  createRenderer(g, art)(view({ set: createSet(1), t: 1, gear }));
  const icons = drawn(g, 'strip-');
  assert.deepEqual(icons.map((s) => s.name), ['strip-chorus-0', 'strip-delay-1']);
  assert.ok(icons.every((s) => s.y === 170), 'along the bottom');
  const alone = fakeContext();
  createRenderer(alone, art)(view({ set: createSet(1), t: 1, gear: { ...gear, owned: ['delay'] } }));
  assert.equal(drawn(alone, 'strip-')[0].x, icons[1].x, 'a pedal keeps its place whatever else you own');
  const keys = g.positions.filter((p) => p.s === '3' || p.s === '5');
  assert.deepEqual(keys.map((p) => p.s), ['3', '5']);
  const oct = g.positions.find((p) => p.s.startsWith('oct')), bar = g.positions.find((p) => p.s.startsWith('bar '));
  assert.ok(icons[0].x > oct.x + 50 && icons[1].x + 20 < bar.x - 54, 'between the pick strength and the bar count');
  const all = fakeContext();
  createRenderer(all, art)(view({ set: createSet(1), t: 1, gear: allGear() }));
  const last = drawn(all, 'strip-').at(-1);
  assert.ok(last.x + 14 < Math.min(...PIGEONS.map(([x]) => x)) - 4, 'the strip ends before the pigeons');
  assert.ok(drawn(all, 'strip-')[0].x >= 78 + 4 * 6, 'and starts after "lock"');
  const none = fakeContext();
  createRenderer(none, art)(view({ set: createSet(1), t: 1 }));
  assert.equal(drawn(none, 'strip-').length, 0, 'empty until you own a pedal');
});

test('a stomped pedal says so over the strip for a second', () => {
  const gear = allGear();
  const at = (time) => {
    const g = fakeContext();
    createRenderer(g, art)(view({ set: createSet(1), t: 1, time, gear, stomp: { id: 'delay', on: true, time: 10 } }));
    return g.texts;
  };
  assert.ok(at(10.2).includes('delay on'));
  assert.ok(!at(11.2).includes('delay on'), 'gone after a second');
  const g = fakeContext();
  createRenderer(g, art)(view({ screen: 'ready', time: 3, gear, stomp: { id: 'overdrive', on: false, time: 2.5 } }));
  assert.ok(g.texts.includes('overdrive off'), 'between sets too');
});

test('the shop: the room, the stock with its tags, the chosen item lifted, the savings and the card', () => {
  const g = fakeContext();
  const gear = { ...freshGear(), savings: 45 };
  buy(gear, 'overdrive');
  const shop = { ...createShop(), at: STOCK.findIndex((s) => s.id === 'chorus') };
  createRenderer(g, art)(view({ screen: 'shop', shop, gear, time: 5 }));
  for (const n of ['shop-room', 'shop-counter', 'keeper-']) assert.equal(drawn(g, n).length, 1, n);
  assert.equal(drawn(g, 'item-').length, STOCK.length);
  assert.deepEqual(drawn(g, 'item-').filter((s) => s.name.endsWith('-1')).map((s) => s.name), ['item-chorus-1'], 'only the chosen one lifted');
  assert.equal(drawn(g, 'tag-yours').length, 2, 'the overdrive and the acoustic are yours');
  assert.equal(drawn(g, 'tag-price').length, STOCK.length - 2);
  for (const s of ['back to', 'the park', 'saved', '5 coins', 'Chorus', '50 coins', 'Not enough coins yet (you have 5)']) {
    assert.ok(g.texts.includes(s), s);
  }
  assert.equal(drawn(g, 'ground').length, 0, 'not the park');
  assert.ok(!g.rects.some(([x, y, w, h, c]) => x === BUTTON[0] && y === BUTTON[1] && w === BUTTON[2] && h === BUTTON[3]), 'no button: nothing to do');
  const lit = g.rects.filter(([x, y, w, h, c]) => w === 2 && h === 1 && c === data.colors.light).map(([x, y]) => `${x},${y}`);
  const led = data.shop.leds.chorus;
  assert.deepEqual(lit, [`${led[0]},${led[1] - data.shop.lift}`], "the chosen pedal's light is lit: you're hearing it");
});

test('the shop card has a button when there is something to buy or play, and the keeper nods at a sale', () => {
  const g = fakeContext();
  const gear = { ...freshGear(), savings: 300 };
  const shop = { ...createShop(), at: STOCK.findIndex((s) => s.id === 'synth'), soldAt: 4.5 };
  createRenderer(g, art)(view({ screen: 'shop', shop, gear, time: 5 }));
  assert.ok(g.texts.includes('Enter to buy') && g.texts.includes('buy'));
  assert.ok(g.rects.some(([x, y, w, h]) => x === BUTTON[0] && y === BUTTON[1] && w === BUTTON[2] && h === BUTTON[3]));
  assert.match(drawn(g, 'keeper-')[0].name, /^keeper-[23]$/, 'nodding just after a sale');
  const later = fakeContext();
  createRenderer(later, art)(view({ screen: 'shop', shop, gear, time: 7 }));
  assert.match(drawn(later, 'keeper-')[0].name, /^keeper-[01]$/);
  assert.ok(later.rects.every(([x, y, w, h]) => y + h <= H && x >= 0 && x + w <= W), 'everything on the screen');
  assert.ok(CARD[1] + CARD[3] <= H);
});
