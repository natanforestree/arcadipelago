import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRenderer, shapeTags, personFrame, youFrame, treeFrame, loopLight, loopWords, loopCue, W, H } from '../src/render.js';
import { createSet, runSet } from '../src/set.js';
import { createScene, createFlocks, sceneNote, sceneLoopNote, CASE, PIGEONS, LOOP_PEDAL } from '../src/scene.js';
import { createKeyState } from '../src/keys.js';
import { goodSet } from '../src/bots.js';
import { KINDS } from '../src/crowd.js';
import { BAR, BEAT } from '../src/groove.js';
import { INTEREST, LOOP } from '../src/tuning.js';
import { STOCK, PEDALS, INSTRUMENTS, freshGear, buy, stomp } from '../src/gear.js';
import { createShop, choose, CARD, BUTTON } from '../src/shop.js';
import { createLoop, record, step, LOOP_LENGTH } from '../src/looper.js';
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
      positions.push({ s, x, y, align: this.textAlign, color: this.fillStyle, font: this.font });
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
  flocks: createFlocks(1), gear: freshGear(), stomp: null, loop: null, loopSaid: null, shop: null, debug: null, ...over,
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
  assert.ok(g.texts.includes('2-6 pedals   R loop   backspace undo'), 'the pedal keys and the loop pedal\'s');
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
    const loop = [null, createLoop(), loopOf(2), loopOf(1, t - 1), loopOf(3)][Math.floor(t) % 5]; // empty, waiting or recording, playing
    const loopSaid = { what: ['layer', 'full', 'cancelled', 'removed', 'cleared'][Math.floor(t / 2) % 5], layer: 1 + (Math.floor(t) % 3), time: t * 1.3 - 0.2 };
    if (t % 1 < 0.37) sceneLoopNote(scene, 55 + (Math.floor(t) % 20), t + 0.1);
    for (const still of [false, true]) draw(view({ set, scene, t, bars: t / BAR, time: t * 1.3 - 0.01, still, flocks, gear, stomp: stomped, loop, loopSaid }));
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
  assert.deepEqual(drawn(g, 'pedal-').map((s) => s.name), ['pedal-loop-dark', 'pedal-overdrive-1', 'pedal-chorus-0', 'pedal-tremolo-1', 'pedal-delay-0', 'pedal-reverb-1']);
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

// A loop with `layers` layers done, from band time 0, and optionally a recording armed at band time
// `armed` (from the next bar line).
function loopOf(layers, armed = null) {
  const loop = createLoop();
  for (let i = 0; i < layers; i++) {
    record(loop, i * 5 * BAR);
    step(loop, (i * 5 + 5) * BAR);
  }
  if (armed !== null) record(loop, armed);
  return loop;
}

test("the loop pedal's light: dark when empty, blinking red on the beat while it waits, red recording, green playing", () => {
  assert.equal(loopLight(null, 5), 'dark');
  assert.equal(loopLight(createLoop(), 5), 'dark');
  const waiting = loopOf(0, 20 * BAR + 0.1);
  assert.equal(loopLight(waiting, 20 * BAR + BEAT), 'red', 'on the beat');
  assert.equal(loopLight(waiting, 20 * BAR + BEAT * 1.6), 'dark', 'between beats');
  assert.equal(loopLight(waiting, 21 * BAR + 0.5), 'red', 'recording');
  assert.equal(loopLight(loopOf(2), 30 * BAR), 'green');
  assert.equal(loopLight(loopOf(2, 30 * BAR + 0.1), 31 * BAR + 2), 'red', 'recording over the loop');
});

test('the loop pedal stands by the crate once it is yours, its light as the loop is; the speaker is always there', () => {
  const plain = fakeContext();
  createRenderer(plain, art)(view({ set: createSet(1), t: 1 }));
  assert.equal(drawn(plain, 'pedal-loop').length, 0, 'not yours yet');
  assert.equal(drawn(plain, 'speaker').length, 1);
  const gear = { ...freshGear(), savings: 100 };
  buy(gear, 'loop');
  const at = (loop, t) => {
    const g = fakeContext();
    createRenderer(g, art)(view({ set: createSet(1), t, gear, loop }));
    return drawn(g, 'pedal-loop').map((s) => s.name);
  };
  assert.deepEqual(at(createLoop(), 1), ['pedal-loop-dark']);
  assert.deepEqual(at(loopOf(1), 30 * BAR), ['pedal-loop-green']);
  assert.deepEqual(at(loopOf(1, 30 * BAR + 0.1), 31 * BAR + 1), ['pedal-loop-red']);
});

test("the strip's loop slot: its key, and a dot per layer it can hold, lit for each recorded and red for the one recording", () => {
  const gear = allGear();
  const slot = (loop, t) => {
    const g = fakeContext();
    createRenderer(g, art)(view({ set: createSet(1), t, gear, loop }));
    const icon = drawn(g, 'strip-loop')[0];
    const dots = g.rects.filter(([x, y, w, h]) => y === 172 && w === 3 && h === 3 && x > icon.x);
    return { icon, dots, key: g.positions.find((p) => p.s === 'R'), g };
  };
  const empty = slot(createLoop(), 1);
  assert.equal(empty.icon.name, 'strip-loop-dark');
  assert.equal(empty.icon.y, 170);
  assert.equal(empty.icon.x, drawn(empty.g, 'strip-reverb')[0].x + 16, 'after the reverb');
  assert.ok(empty.key.x > empty.icon.x);
  assert.deepEqual(empty.dots.map((d) => d[4]), [data.colors.greyDark, data.colors.greyDark, data.colors.greyDark]);
  const two = slot(loopOf(2, 30 * BAR + 0.1), 31 * BAR + 1);
  assert.equal(two.icon.name, 'strip-loop-red');
  assert.deepEqual(two.dots.map((d) => d[4]), [data.colors.light, data.colors.light, data.colors.red]);
  const right = Math.max(...empty.dots.map(([x, , w]) => x + w));
  assert.ok(right < Math.min(...PIGEONS.map(([x]) => x)) - 4 - 4, 'the slot ends before the pigeons, however they shuffle');
  const none = fakeContext();
  createRenderer(none, art)(view({ set: createSet(1), t: 1 }));
  assert.equal(drawn(none, 'strip-loop').length, 0, 'not yours yet');
});

test("the loop pedal's news shows over its slot for a second, the newer over a stomp; a landed layer is green, a stomp gold or light", () => {
  assert.deepEqual(
    [{ what: 'layer', layer: 1 }, { what: 'layer', layer: 2 }, { what: 'full' }, { what: 'cancelled' }, { what: 'removed' }, { what: 'cleared' }].map(loopWords),
    ['layer 1', 'layer 2', 'loop full', 'recording cancelled', 'layer removed', 'loop cleared'],
  );
  const gear = allGear();
  const at = (time, stomp, said = { what: 'layer', layer: 2, time: 10 }) => {
    const g = fakeContext();
    createRenderer(g, art)(view({ set: createSet(1), t: 1, time, gear, stomp, loopSaid: said }));
    return g;
  };
  const shownIn = (g, s) => g.positions.find((p) => p.s === s && p.color !== data.colors.ink); // skip the ink shadow
  assert.ok(at(10.5).texts.includes('layer 2'));
  assert.ok(!at(11.2).texts.includes('layer 2'), 'gone after a second');
  assert.equal(shownIn(at(10.5), 'layer 2').color, data.colors.go, "a landed layer's news is green");
  assert.equal(shownIn(at(10.5, null, { what: 'full', time: 10 }), 'loop full').color, data.colors.light, "the loop's other news is plain");
  assert.equal(shownIn(at(10.3, { id: 'delay', on: true, time: 10.3 }), 'delay on').color, data.colors.gold, 'a stomp on is gold');
  assert.equal(shownIn(at(10.3, { id: 'delay', on: false, time: 10.3 }), 'delay off').color, data.colors.light, 'a stomp off is plain');
  const newer = at(10.5, { id: 'delay', on: true, time: 10.3 });
  assert.ok(newer.texts.includes('delay on') && !newer.texts.includes('layer 2'), 'one at a time: the stomp came after');
  const older = at(10.5, { id: 'delay', on: true, time: 9.8 });
  assert.ok(older.texts.includes('layer 2') && !older.texts.includes('delay on'));
});

test('loopCue is null with no loop, no take waiting or under way, or once the layer has landed', () => {
  assert.equal(loopCue(null, 1), null);
  assert.equal(loopCue(createLoop(), 1), null, 'no take');
  const loop = createLoop();
  record(loop, 0);
  step(loop, loop.take.from + LOOP_LENGTH);
  assert.equal(loopCue(loop, 1000), null, 'the layer landed; nothing left to count or record');
});

test('loopCue counts down while a recording waits: 4 on the bar\'s first beat, then 3, 2, 1, wherever R joined it', () => {
  const loop = createLoop();
  record(loop, 10 * BAR + 0.01); // just after bar line 10: arms from bar 11
  assert.deepEqual(loopCue(loop, 10 * BAR + 0.01), { count: 4 });
  assert.deepEqual(loopCue(loop, 10 * BAR + BEAT + 0.01), { count: 3 });
  assert.deepEqual(loopCue(loop, 10 * BAR + 2 * BEAT + 0.01), { count: 2 });
  assert.deepEqual(loopCue(loop, 10 * BAR + 3 * BEAT + 0.01), { count: 1 }, 'pressed or not, the count follows the clock');
});

test("loopCue counts down to the bar line, not up from where R joined: a caller's clock a hair behind the bar line still reads 4, not 1", () => {
  // set.t lags the audio clock slightly (it's stepped in whole ticks), so the very next frame after R
  // is pressed just after a bar line can ask loopCue for a t a hair below that bar line, not above it.
  const loop = createLoop();
  record(loop, 9.005); // within bar 3 (bar line 9): arms from bar line 12
  assert.equal(loop.take.from, 12);
  assert.deepEqual(loopCue(loop, 8.999999997), { count: 4 }, "still beat 1's count, not beat 4's");
});

test('loopCue while waiting works from a negative t too, as in the shop', () => {
  const loop = createLoop();
  record(loop, -2.9); // the shop's band starting a little after you choose the pedal
  assert.equal(loop.take.from, 0);
  assert.deepEqual(loopCue(loop, -2.9), { count: 4 });
  assert.deepEqual(loopCue(loop, -0.5), { count: 1 });
});

test('loopCue reports elapsed bars while recording, fractional', () => {
  const loop = createLoop();
  record(loop, 0); // from = BAR
  const half = loopCue(loop, BAR + 0.5 * BAR);
  assert.deepEqual(Object.keys(half), ['bars']);
  assert.ok(Math.abs(half.bars - 0.5) < 1e-9);
  const most = loopCue(loop, BAR + 3.2 * BAR);
  assert.deepEqual(Object.keys(most), ['bars'], "still short of the last bar's closing beats");
  assert.ok(Math.abs(most.bars - 3.2) < 1e-9);
});

test("loopCue counts down 3, 2, 1 over the last bar's beats 2-4, exactly at the boundaries", () => {
  const loop = createLoop();
  record(loop, 0);
  const from = loop.take.from;
  const justBefore = loopCue(loop, from + (LOOP.bars - 1) * BAR + BEAT - 1e-6);
  assert.deepEqual(Object.keys(justBefore), ['bars'], 'a hair before: still just the bars');
  assert.ok(Math.abs(justBefore.bars - ((LOOP.bars - 1) * BAR + BEAT - 1e-6) / BAR) < 1e-9);
  assert.deepEqual(loopCue(loop, from + (LOOP.bars - 1) * BAR + BEAT), { count: 3, closing: true });
  assert.deepEqual(loopCue(loop, from + (LOOP.bars - 1) * BAR + 2 * BEAT), { count: 2, closing: true });
  assert.deepEqual(loopCue(loop, from + (LOOP.bars - 1) * BAR + 3 * BEAT), { count: 1, closing: true });
});

test('loopCue never dips to 0 from float slop right at the loop\'s own end: the closing count clamps at 1', () => {
  const loop = createLoop();
  record(loop, 0);
  const from = loop.take.from;
  // A hair past where the recording should already have become a layer: without the clamp, floor
  // would take the count past 1, to 0.
  assert.deepEqual(loopCue(loop, from + LOOP_LENGTH + 1e-9), { count: 1, closing: true });
});

test('the count-in digit draws big and centred over the loop slot, gold counting in and red closing, clear of the strip', () => {
  const gear = allGear();
  const draw = (loop, t) => {
    const g = fakeContext();
    createRenderer(g, art)(view({ set: createSet(1), t, time: 1, gear, loop }));
    return g;
  };
  const waiting = createLoop();
  record(waiting, 10 * BAR + 0.01);
  const g1 = draw(waiting, 10 * BAR + 0.01);
  const digit = g1.positions.find((p) => p.s === '4' && p.color === data.colors.gold);
  assert.ok(digit, 'counting in, gold');
  assert.equal(digit.align, 'center');
  assert.equal(digit.y, 151);
  assert.equal(digit.font, '16px Silkscreen, monospace', 'the big digit, not the strip\'s own 8px');
  const shadow = g1.positions.find((p) => p.s === '4' && p.color === data.colors.ink);
  assert.deepEqual([shadow.x - digit.x, shadow.y - digit.y], [1, 1], 'a 1px shadow, like the news');
  const closing = createLoop();
  record(closing, 0);
  const g2 = draw(closing, closing.take.from + (LOOP.bars - 1) * BAR + BEAT);
  assert.ok(g2.positions.find((p) => p.s === '3' && p.color === data.colors.red), 'closing, red');
});

test("the recording cue: 'rec' then a cell per bar, empty grey, filled red, the current one filling by its fraction", () => {
  const gear = allGear();
  const draw = (loop, t) => {
    const g = fakeContext();
    createRenderer(g, art)(view({ set: createSet(1), t, time: 1, gear, loop }));
    return g;
  };
  const loop = createLoop();
  record(loop, 0); // from = BAR
  const g = draw(loop, BAR + 1.5 * BAR); // bar 0 done, bar 1 half full
  assert.ok(g.texts.includes('rec'));
  const recPos = g.positions.find((p) => p.s === 'rec' && p.color === data.colors.red);
  assert.equal(recPos.y, 160);
  assert.equal(recPos.font, '8px Silkscreen, monospace', "the strip's own 8px, not the big digit's");
  assert.ok(recPos.x >= 177, "clear of the case sprite's rim, even centred it would sit under x 177");
  const backgrounds = g.rects.filter(([, , w, h, c]) => w === 5 && h === 3 && c === data.colors.greyDark);
  assert.equal(backgrounds.length, LOOP.bars, 'a background cell for every bar');
  const xs = backgrounds.map(([x]) => x).sort((a, b) => a - b);
  for (let i = 1; i < xs.length; i++) assert.ok(Math.abs(xs[i] - xs[i - 1] - 6) < 1, 'evenly spaced, a 1px gap between 5px cells');
  const reds = g.rects.filter(([x, , , h, c]) => h === 3 && c === data.colors.red && xs.includes(x));
  assert.equal(reds.length, 2, 'bar 0 full, bar 1 partly, bars 2 and 3 not started');
  assert.equal(reds.find((r) => r[0] === xs[0])[2], 5, 'the done bar fills all the way');
  assert.equal(reds.find((r) => r[0] === xs[1])[2], Math.round(5 * 0.5), "the current bar fills by its fraction, from the left");
});

test("the loop's count-in and recording cue show in the news's place, but a stomp or the loop's own news hides them", () => {
  const gear = allGear();
  const draw = (loop, t, over = {}) => {
    const g = fakeContext();
    createRenderer(g, art)(view({ set: createSet(1), t, time: 1, gear, loop, ...over }));
    return g;
  };
  // '4' and 'rec' alone aren't safe to look for: the gear strip's own pedal keys include digits, so
  // check the cue's own spot (the digit's row, y 151, or "rec" at y 160) instead.
  const digitShown = (g) => g.positions.some((p) => p.y === 151);
  const recShown = (g) => g.positions.some((p) => p.s === 'rec' && p.y === 160);
  const waiting = createLoop();
  record(waiting, 10 * BAR + 0.01);
  assert.ok(digitShown(draw(waiting, 10 * BAR + 0.01)), 'the count shows with no news up');
  assert.ok(!digitShown(draw(waiting, 10 * BAR + 0.01, { stomp: { id: 'delay', on: true, time: 0.5 } })), "a stomp's news hides it");
  const recording = createLoop();
  record(recording, 0);
  assert.ok(recShown(draw(recording, BAR + 0.5 * BAR)), 'the recording cue shows with no news up');
  assert.ok(!recShown(draw(recording, BAR + 0.5 * BAR, { loopSaid: { what: 'full', time: 0.5 } })), "the loop's own news hides it too");
});

test("your loop's notes rise faintly from the loop pedal as each plays, not before, and fade", () => {
  const scene = createScene(1);
  sceneLoopNote(scene, 60, 5);
  const lit = (t) => {
    const g = fakeContext();
    const rects = [];
    const fill = g.fillRect;
    g.fillRect = function (x, y, w, h) {
      if (w === 3 && h === 3 && this.fillStyle === data.colors.light) rects.push([x, y, this.globalAlpha]);
      return fill.call(this, x, y, w, h);
    };
    createRenderer(g, art)(view({ set: createSet(1), scene, t }));
    return rects;
  };
  assert.deepEqual(lit(4.9), [], 'scheduled a moment ahead, but not playing yet');
  const [[x, y, alpha]] = lit(5.2);
  assert.ok(Math.abs(x - LOOP_PEDAL[0]) < 6 && y < LOOP_PEDAL[1], 'just over the loop pedal');
  assert.ok(alpha > 0 && alpha < 0.5, `faint: ${alpha}`);
  assert.deepEqual(lit(5 + 3.1), [], 'gone');
});

test("in the shop, the loop pedal's light shows the loop you're trying, and its card says what R and Backspace do", () => {
  const gear = { ...freshGear(), savings: 0 };
  const shop = createShop();
  choose(shop, STOCK.findIndex((s) => s.id === 'loop'));
  const at = (t) => {
    const g = fakeContext();
    createRenderer(g, art)(view({ screen: 'shop', shop, gear, t, time: 5 }));
    return g;
  };
  const [lx, ly] = data.shop.leds.loop;
  const light = (g) => g.rects.filter(([x, y, w, h]) => x === lx && y === ly - data.shop.lift && w === 2 && h === 2).map((r) => r[4]);
  assert.deepEqual(light(at(1)), [], 'dark: nothing recorded yet');
  record(shop.loop, 1);
  assert.deepEqual(light(at(BAR + 1)), [data.colors.red]);
  step(shop.loop, BAR + 4 * BAR);
  assert.deepEqual(light(at(6 * BAR)), [data.colors.go]);
  const g = at(6 * BAR);
  assert.ok(g.texts.includes('R records 4 bars, then loops them under you.'));
  assert.ok(g.texts.includes('R record   backspace undo   esc back'));
});

test("the loop pedal's key line is no longer than another item's, so it never runs under the Buy button", () => {
  const gear = { ...freshGear(), savings: 1000 };
  const keysFor = (id) => {
    const shop = createShop();
    choose(shop, STOCK.findIndex((s) => s.id === id));
    const g = fakeContext();
    createRenderer(g, art)(view({ screen: 'shop', shop, gear, t: 0, time: 5 }));
    return g.texts.find((s) => s.includes('esc back'));
  };
  const loopKeys = keysFor('loop');
  const otherKeys = keysFor(STOCK.find((s) => s.kind !== 'loop').id);
  assert.ok(loopKeys.length <= otherKeys.length, `${loopKeys} (${loopKeys.length}) vs ${otherKeys} (${otherKeys.length})`);
});
