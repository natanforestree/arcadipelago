// Checks the committed art (open-case/assets/ and icon.png, written by the scripts in art/open-case/)
// against what the game expects: every frame the renderer draws, in the numbers the art spec gives,
// inside the sheet; at most 64 colours across all of it; small enough to load at once; and laid out
// round the positions the rules use.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { readPng } from './png.js';
import { KINDS, LOOKS, PATH_Y } from '../src/crowd.js';
import { CROWD, ISLAND } from '../src/tuning.js';
import { ANIMALS, ANIMAL_IDS } from '../src/animals.js';
import { CASE } from '../src/scene.js';
import { STOCK, PEDALS, INSTRUMENTS } from '../src/gear.js';
import { CARD } from '../src/shop.js';

const file = (f) => new URL(`../${f}`, import.meta.url);
const data = JSON.parse(readFileSync(file('assets/sprites.json'), 'utf8'));
const sheet = readPng(file('assets/sprites.png'));
const names = Object.keys(data.frames);
const REACTIONS = ['repeat', 'offKey', 'callback', 'taste', 'random', 'silence', 'loud', 'recognised']; // every rule crowd.js reacts to
const range = (n) => [...Array(n).keys()];
const PEOPLE = KINDS.flatMap((k) => range(LOOKS).map((look) => `${k}-${look}`)); // every passer-by's frames' prefix

// How many frames there are of each thing, from the art spec's table (and the sky's five stages).
const FAMILIES = [
  ['sun', 1], ['ground', 1], ['pool', 1], ['case', 1], ['case-coin', 1],
  [/^roofs-back-\d$/, 5], [/^roofs-front-\d$/, 5], [/^train-\d$/, 5], [/^trees-\d$/, 3], [/^lamp-(off|on|flicker)$/, 3],
  [/^cloud-\d+-\d$/, data.clouds.length * 5],
  [/^coin-\d$/, 2], ['speaker', 1], [/^bird-\d$/, 2],
  ...INSTRUMENTS.flatMap((id) => [[new RegExp(`^you-${id}-idle-\\d$`), 2], [new RegExp(`^you-${id}-play-\\d$`), 3]]),
  ...PEDALS.flatMap((id) => [[new RegExp(`^pedal-${id}-\\d$`), 2], [new RegExp(`^strip-${id}-\\d$`), 2]]),
  [/^pedal-loop-(dark|red|green)$/, 3], [/^strip-loop-(dark|red|green)$/, 3],
  ['amp', 1], ['shop-room', 1], ['shop-counter', 1], [/^keeper-\d$/, 4], ['tag-price', 1], ['tag-yours', 1],
  ...STOCK.map((item) => [new RegExp(`^item-${item.id}-\\d$`), 2]),
  ...PEOPLE.flatMap((who) => ['left', 'right'].flatMap((d) => [
    [new RegExp(`^${who}-walk-\\d-${d}$`), 4], [new RegExp(`^${who}-stand-\\d-${d}$`), 2], [new RegExp(`^${who}-nod-\\d-${d}$`), 2],
  ])),
  ...REACTIONS.map((r) => [new RegExp(`^react-${r}-\\d$`), 2]),
  ...['peck', 'walk', 'fly'].flatMap((p) => ['left', 'right'].map((d) => [new RegExp(`^pigeon-${p}-\\d-${d}$`), 2])),
  // the station and the night market
  [/^station-city-\d$/, 5], ['station-hall', 1], [/^station-car-\d$/, 2], ['station-front', 1],
  ['market-skyline', 1], ['market-stalls', 1], [/^market-steam-\d$/, 2], ['market-strings', 1], ['market-street', 1],
  ['lantern-off', 1], [/^lantern-\d$/, 3],
  ...['sleep', 'walk', 'run'].flatMap((p) => ['left', 'right'].map((d) => [new RegExp(`^cat-${p}-\\d-${d}$`), 2])),
  // One Tree Island, and its animals
  [/^island-shore-\d$/, 5], [/^island-water-\d$/, 5], [/^island-mist-\d$/, 4], ['island-land', 1], ['island-pine', 1], ['island-trunk', 1],
  [/^fish-jump-\d$/, 2], [/^fish-splash-\d$/, 2],
  ...ANIMAL_IDS.flatMap((id) => ['cross', 'sit', 'beat'].flatMap((p) => ['left', 'right'].map((d) => [new RegExp(`^${id}-${p}-\\d-${d}$`), 2]))),
];

test('every frame the game draws is there, as many of each as the spec says, and nothing else', () => {
  const count = (f) => names.filter((n) => (typeof f === 'string' ? n === f : f.test(n))).length;
  for (const [f, n] of FAMILIES) assert.equal(count(f), n, String(f));
  assert.equal(names.length, FAMILIES.reduce((sum, [, n]) => sum + n, 0), 'no frames beyond these');
  // numbered from 0, so the renderer can pick one by counting
  for (const s of range(5)) for (const n of [`roofs-back-${s}`, `roofs-front-${s}`, `train-${s}`]) assert.ok(names.includes(n), n);
  for (const who of PEOPLE) for (const i of range(4)) assert.ok(names.includes(`${who}-walk-${i}-left`), `${who}-walk-${i}`);
});

test("the station's and the night market's layout: the board and the clock inside the hall, the lanterns along their strings, in order", () => {
  const { board, clock } = data.station;
  assert.ok(board[0] < board[2] && board[1] < board[3] && board[2] < 320 && board[3] < 100, `board ${board}`);
  assert.ok(clock[2] > 4 && clock[1] - clock[2] > 30 && clock[0] + clock[2] < 320, `clock ${clock}`);
  const { lanterns, stars } = data.market;
  assert.ok(lanterns.length >= 20, `${lanterns.length} lanterns`);
  for (const [x, y, c] of lanterns) assert.ok(x >= 0 && x < 320 && y > 0 && y < 70 && [0, 1, 2].includes(c), `${x}, ${y}, ${c}`);
  assert.ok(stars.length >= 20 && stars.every(([x, y]) => x >= 0 && x < 320 && y >= 0 && y < 70));
});

test('every frame lies inside sprites.png', () => {
  for (const [name, [x, y, w, h]] of Object.entries(data.frames)) {
    assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= sheet.w && y + h <= sheet.h, name);
  }
});

test('the art uses at most 64 colours, all of them in the palette', () => {
  assert.ok(data.palette.length <= 64, `${data.palette.length} colours`);
  assert.equal(new Set(data.palette).size, data.palette.length, 'no colour twice');
  const palette = new Set(data.palette);
  for (const c of [...data.sky.flat(), ...Object.values(data.colors)]) assert.ok(palette.has(c), c);
  for (const f of ['assets/sprites.png', 'icon.png']) {
    const { w, h, data: px } = f === 'icon.png' ? readPng(file(f)) : sheet;
    for (let i = 0; i < w * h; i++) {
      if (px[i * 4 + 3] === 0) continue;
      assert.equal(px[i * 4 + 3], 255, `${f}: a half-clear pixel at ${i % w},${Math.floor(i / w)}`);
      const hex = `#${[0, 1, 2].map((k) => px[i * 4 + k].toString(16).padStart(2, '0')).join('')}`;
      assert.ok(palette.has(hex), `${f}: ${hex} at ${i % w},${Math.floor(i / w)} isn't in the palette`);
    }
  }
});

test("the game's art stays under 400 KB", () => {
  const bytes = ['assets/sprites.png', 'assets/sprites.json', 'icon.png'].reduce((n, f) => n + statSync(file(f)).size, 0);
  assert.ok(bytes < 400 * 1024, `${bytes} bytes`);
});

test('the sunset data: five stages of seven bands, the windows, the stars and the coins in the case', () => {
  assert.equal(data.sky.length, 5);
  for (const stage of data.sky) assert.equal(stage.length, 7);
  assert.equal(data.bands.length, 7);
  assert.equal(data.bands[0], 0);
  data.bands.forEach((b, i) => i > 0 && assert.ok(b > data.bands[i - 1]));
  assert.ok(data.skyBottom > data.bands[6] && data.skyBottom < 180);
  assert.ok(data.windows.length >= 10);
  for (const [x, y] of data.windows) assert.ok(x >= 0 && x < 319 && y >= 0 && y < data.skyBottom);
  assert.equal(data.stars.length, 10);
  for (const [x, y] of data.stars) assert.ok(x >= 0 && x < 320 && y >= 0 && y < data.bands[3]);
  assert.equal(data.caseCoins.length, 60);
  for (const [, , layer] of data.clouds) assert.ok(layer === 1 || layer === 2);
});

// Where a frame drawn at (x, y) covers the screen: [left, top, right, bottom], right and bottom
// exclusive; and whether it has a pixel at screen point (sx, sy).
const cover = (name, x, y) => {
  const [, , w, h, ax, ay] = data.frames[name];
  return [x - ax, y - ay, x - ax + w, y - ay + h];
};
const opaqueAt = (name, x, y, sx, sy) => {
  const [fx, fy, w, h, ax, ay] = data.frames[name];
  const u = sx - (x - ax), v = sy - (y - ay);
  return u >= 0 && v >= 0 && u < w && v < h && sheet.data[((fy + v) * sheet.w + fx + u) * 4 + 3] > 0;
};

test('the art sits round the positions the rules use', () => {
  for (const id of INSTRUMENTS) {
    const [left, , right] = cover(`you-${id}-idle-0`, 0, 0);
    assert.ok(left < CROWD.playerX && CROWD.playerX < right, `you sit at CROWD.playerX with the ${id}`);
  }
  assert.ok(opaqueAt('case', 0, 0, CASE[0], CASE[1]), 'coins land inside the open case');
  for (const [sx, sy] of CROWD.spots) {
    for (const who of PEOPLE) {
      const name = `${who}-stand-0-${sx < CROWD.playerX ? 'right' : 'left'}`, [pl, pt, pr, pb] = cover(name, sx, sy);
      assert.ok(pl >= 0 && pt >= 0 && pr <= 320 && pb <= 180, `${who} at spot ${sx},${sy} fits on screen`);
      for (let y = pt; y < pb; y++) {
        for (let x = pl; x < pr; x++) {
          assert.ok(!(opaqueAt(name, sx, sy, x, y) && opaqueAt('case', 0, 0, x, y)), `${who} at spot ${sx},${sy} stands clear of the case`);
        }
      }
    }
  }
  assert.ok(data.feet.you > PATH_Y, 'passers-by walk behind you');
});

// The colour a frame drawn at (0, 0) puts at screen point (sx, sy), or null where it's clear.
const colourAt = (name, sx, sy) => {
  if (!opaqueAt(name, 0, 0, sx, sy)) return null;
  const [fx, fy, , , ax, ay] = data.frames[name], i = ((fy + sy + ay) * sheet.w + fx + sx + ax) * 4;
  return sheet.data.slice(i, i + 3).join();
};
// How many pixels differ between two frames, laid over each other by their anchors.
const differ = (a, b) => {
  const [al, at, ar, ab] = cover(a, 0, 0), [bl, bt, br, bb] = cover(b, 0, 0);
  let n = 0;
  for (let y = Math.min(at, bt); y < Math.max(ab, bb); y++) {
    for (let x = Math.min(al, bl); x < Math.max(ar, br); x++) if (colourAt(a, x, y) !== colourAt(b, x, y)) n++;
  }
  return n;
};

test('each kind has six people, three women and three men, each clearly their own', () => {
  assert.deepEqual(Object.keys(data.looks), KINDS);
  for (const k of KINDS) {
    assert.equal(data.looks[k].length, LOOKS, k);
    assert.ok(data.looks[k].every((who) => who === 'woman' || who === 'man'), k);
    assert.equal(data.looks[k].filter((who) => who === 'woman').length, 3, `${k}: three women`);
    for (const a of range(LOOKS)) {
      for (const b of range(LOOKS)) {
        if (a < b) assert.ok(differ(`${k}-${a}-stand-0-left`, `${k}-${b}-stand-0-left`) >= 60, `${k} ${a} and ${b} look clearly different`);
      }
    }
  }
});

test("nobody's drawn above the top of their head, 45 rows over their feet, so reactions stay clear", () => {
  for (const name of names.filter((n) => PEOPLE.some((who) => n.startsWith(`${who}-`)))) {
    assert.ok(data.frames[name][5] <= 45, `${name} reaches ${data.frames[name][5]} rows over its feet`);
  }
});

test('your pedals and the loop pedal stand in front of the crate, clear of the case and of every listener', () => {
  const pedals = [...PEDALS.map((id) => `pedal-${id}-1`), 'pedal-loop-green'];
  const [, , , bottom] = cover('you-acoustic-idle-0', 0, 0);
  for (const name of pedals) {
    const [l, t, r, b] = cover(name, 0, 0);
    assert.ok(t >= data.feet.you && b <= 170, `${name} is on the ground in front of you, above the strip`);
    for (let y = t; y < b; y++) {
      for (let x = l; x < r; x++) {
        if (!opaqueAt(name, 0, 0, x, y)) continue;
        assert.ok(!opaqueAt('case', 0, 0, x, y), `${name} clear of the case`);
        for (const [sx, sy] of CROWD.spots) {
          for (const who of PEOPLE) assert.ok(!opaqueAt(`${who}-stand-0-${sx < CROWD.playerX ? 'right' : 'left'}`, sx, sy, x, y), `${name} clear of ${who} at ${sx},${sy}`);
        }
      }
    }
  }
  assert.ok(bottom <= data.feet.pedals && bottom <= data.feet.loop);
  const [, , , loopBottom] = cover('pedal-loop-green', 0, 0);
  const [, pedalsTop] = cover('pedal-overdrive-1', 0, 0);
  assert.ok(loopBottom <= pedalsTop + 1, 'the loop pedal stands behind the row of pedals');
});

test("the shop's stock stands apart, above the card, and the door and its sign are inside the screen", () => {
  const boxes = STOCK.map((item) => [item.id, data.shop.items[item.id]]);
  for (const [id, [x, y, w, h]] of boxes) {
    assert.ok(x >= 0 && y - data.shop.lift - 8 >= 0 && x + w <= 320 && y + h <= CARD[1], `${id} above the card, with room for its pointer`);
  }
  for (const [a, [ax, ay, aw, ah]] of boxes) {
    for (const [b, [bx, by, bw, bh]] of boxes) {
      if (a < b) assert.ok(ax + aw <= bx || bx + bw <= ax || ay + ah <= by || by + bh <= ay, `${a} and ${b} don't overlap`);
    }
  }
  const [dx, dy, dw, dh] = data.shop.door;
  assert.ok(dx >= 0 && dy >= 0 && dx + dw <= 320 && dy + dh <= CARD[1]);
  for (const id of [...PEDALS, 'loop']) {
    const [lx, ly] = data.shop.leds[id], [x, y, w, h] = data.shop.items[id];
    assert.ok(lx >= x && lx + 2 <= x + w && ly >= y && ly + (id === 'loop' ? 2 : 1) <= y + h, `${id}'s light is on the pedal`);
  }
  const rack = [...PEDALS, 'loop'].map((id) => data.shop.items[id]);
  rack.forEach(([x], i) => i > 0 && assert.ok(x >= rack[i - 1][0] + rack[i - 1][2] + 5, 'room for a price tag between pedals, clear of the next'));
  assert.ok(rack.at(-1)[2] > rack[0][2], 'the loop pedal is the wider one');
});

test("the shop window's view stays inside its frame: the wall beside it is plain wall", () => {
  // The window's glass runs from x 60 (art/open-case/shop.lua S.WINDOW) and its frame from x 58; the
  // two columns of wall left of the frame match the wall further left, all the way down.
  for (let y = 16; y <= 60; y++) {
    for (const x of [56, 57]) assert.equal(colourAt('shop-room', x, y), colourAt('shop-room', 54, y), `wall at ${x},${y}`);
  }
});

test("One Tree Island's sunrise: five stages of seven bands, the sun hidden under the far shore until it comes up, and the glints on the water", () => {
  assert.equal(data.sunrise.length, 5);
  for (const stage of data.sunrise) assert.equal(stage.length, 7);
  const [, waterTop] = cover('island-water-0', 0, 0), [sx, sy] = data.island.sun, [, sunTop] = cover('sun', sx, sy);
  assert.ok(sunTop >= waterTop, `the sun's top (${sunTop}) is under the lake's far edge (${waterTop})`);
  assert.ok(sunTop - ISLAND.sunRise < waterTop - 10, 'and it comes up well clear of it');
  assert.ok(data.island.glints.length > data.island.sunGlints && data.island.sunGlints > 0);
  for (const [x, y] of data.island.glints) assert.ok(x >= 0 && x < 320 && y > waterTop && y < 180, `glint ${x}, ${y}`);
  for (const [x] of data.island.glints.slice(0, data.island.sunGlints)) assert.ok(Math.abs(x - sx) <= 4, 'the sun\'s glints lie under it');
});

test("the island's land runs right across the screen, the swimmers cross open water behind it, and each animal settles where its sort of spot says", () => {
  const [, waterTop] = cover('island-water-0', 0, 0), { land, water, sky } = ISLAND.lanes;
  const grass = new Set(['69,128,110', '46,93,92']); // the island's grass: the palette's two lighter leaf greens (palette.lua)
  for (let x = 0; x < 320; x++) {
    assert.ok(opaqueAt('island-land', 0, 0, x, land) && opaqueAt('island-land', 0, 0, x, land - 3), `the land animals walk on the island at ${x}`);
    assert.ok(!opaqueAt('island-land', 0, 0, x, water + 1), `the swimmers are out on the lake at ${x}, behind everything on its shore`);
  }
  assert.ok(water > waterTop + 10 && water < land - 15, 'on the lake, well behind the land animals');
  assert.ok(sky < waterTop - 30, 'the birds fly high');
  for (const [x, y, sort] of ISLAND.spots) {
    const under = [1, 2, 3].map((d) => colourAt('island-land', x, y + d));
    if (sort === 'pine') assert.ok([1, 2, 3].some((d) => opaqueAt('island-pine', 0, 0, x, y + d)), `a branch under ${x}, ${y}`);
    else if (sort === 'grass') assert.ok(grass.has(colourAt('island-land', x, y)), `grass at ${x}, ${y}`);
    else if (sort === 'shallows') assert.ok(!opaqueAt('island-land', 0, 0, x, y), `water at ${x}, ${y}`);
    else assert.ok(under.some((c) => c !== null), `the ${sort} under ${x}, ${y}`);
  }
});

test('every animal fits on screen at each spot of its sort, and on the grass stands clear of the case', () => {
  for (const id of ANIMAL_IDS) {
    for (const [sx, sy, sort] of ISLAND.spots.filter(([, , s]) => ANIMALS[id].spots.includes(s))) {
      const name = `${id}-sit-0-${sx < CROWD.playerX ? 'right' : 'left'}`, [pl, pt, pr, pb] = cover(name, sx, sy);
      assert.ok(pl >= 0 && pt >= 0 && pr <= 320 && pb <= 180, `${id} at ${sx},${sy} fits on screen`);
      if (sort !== 'grass') continue;
      for (let y = pt; y < pb; y++) {
        for (let x = pl; x < pr; x++) assert.ok(!(opaqueAt(name, sx, sy, x, y) && opaqueAt('case', 0, 0, x, y)), `${id} at ${sx},${sy} clear of the case`);
      }
    }
  }
});

test('each animal is its own, and smaller than a person: its frames are no taller than 20 rows over its feet', () => {
  for (const id of ANIMAL_IDS) {
    for (const name of names.filter((n) => n.startsWith(`${id}-`))) assert.ok(data.frames[name][5] <= 20, `${name} reaches ${data.frames[name][5]} rows`);
    for (const other of ANIMAL_IDS) if (id < other) assert.ok(differ(`${id}-sit-0-left`, `${other}-sit-0-left`) >= 30, `${id} and ${other}`);
  }
});
