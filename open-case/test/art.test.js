// Checks the committed art (open-case/assets/ and icon.png, written by the scripts in art/open-case/)
// against what the game expects: every frame the renderer draws, in the numbers the art spec gives,
// inside the sheet; at most 64 colours across all of it; small enough to load at once; and laid out
// round the positions the rules use.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { readPng } from './png.js';
import { KINDS, PATH_Y } from '../src/crowd.js';
import { CROWD } from '../src/tuning.js';
import { CASE } from '../src/scene.js';
import { STOCK, PEDALS, INSTRUMENTS } from '../src/gear.js';
import { CARD } from '../src/shop.js';

const file = (f) => new URL(`../${f}`, import.meta.url);
const data = JSON.parse(readFileSync(file('assets/sprites.json'), 'utf8'));
const sheet = readPng(file('assets/sprites.png'));
const names = Object.keys(data.frames);
const REACTIONS = ['repeat', 'offKey', 'callback', 'taste', 'random', 'silence', 'loud', 'recognised']; // every rule crowd.js reacts to
const range = (n) => [...Array(n).keys()];

// How many frames there are of each thing, from the art spec's table (and the sky's five stages).
const FAMILIES = [
  ['sun', 1], ['ground', 1], ['pool', 1], ['case', 1], ['case-coin', 1],
  [/^roofs-back-\d$/, 5], [/^roofs-front-\d$/, 5], [/^train-\d$/, 5], [/^trees-\d$/, 3], [/^lamp-(off|on|flicker)$/, 3],
  [/^cloud-\d+-\d$/, data.clouds.length * 5],
  [/^coin-\d$/, 2], [/^looper-\d$/, 2], [/^bird-\d$/, 2],
  ...INSTRUMENTS.flatMap((id) => [[new RegExp(`^you-${id}-idle-\\d$`), 2], [new RegExp(`^you-${id}-play-\\d$`), 3]]),
  ...PEDALS.flatMap((id) => [[new RegExp(`^pedal-${id}-\\d$`), 2], [new RegExp(`^strip-${id}-\\d$`), 2]]),
  ['amp', 1], ['shop-room', 1], ['shop-counter', 1], [/^keeper-\d$/, 4], ['tag-price', 1], ['tag-yours', 1],
  ...STOCK.map((item) => [new RegExp(`^item-${item.id}-\\d$`), 2]),
  ...KINDS.flatMap((k) => ['left', 'right'].flatMap((d) => [
    [new RegExp(`^${k}-walk-\\d-${d}$`), 4], [new RegExp(`^${k}-stand-\\d-${d}$`), 2], [new RegExp(`^${k}-nod-\\d-${d}$`), 2],
  ])),
  ...REACTIONS.map((r) => [new RegExp(`^react-${r}-\\d$`), 2]),
  ...['peck', 'walk', 'fly'].flatMap((p) => ['left', 'right'].map((d) => [new RegExp(`^pigeon-${p}-\\d-${d}$`), 2])),
];

test('every frame the game draws is there, as many of each as the spec says, and nothing else', () => {
  const count = (f) => names.filter((n) => (typeof f === 'string' ? n === f : f.test(n))).length;
  for (const [f, n] of FAMILIES) assert.equal(count(f), n, String(f));
  assert.equal(names.length, FAMILIES.reduce((sum, [, n]) => sum + n, 0), 'no frames beyond these');
  // numbered from 0, so the renderer can pick one by counting
  for (const s of range(5)) for (const n of [`roofs-back-${s}`, `roofs-front-${s}`, `train-${s}`]) assert.ok(names.includes(n), n);
  for (const k of KINDS) for (const i of range(4)) assert.ok(names.includes(`${k}-walk-${i}-left`), `${k}-walk-${i}`);
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
    for (const k of KINDS) {
      const name = `${k}-stand-0-${sx < CROWD.playerX ? 'right' : 'left'}`, [pl, pt, pr, pb] = cover(name, sx, sy);
      assert.ok(pl >= 0 && pt >= 0 && pr <= 320 && pb <= 180, `a ${k} at spot ${sx},${sy} fits on screen`);
      for (let y = pt; y < pb; y++) {
        for (let x = pl; x < pr; x++) {
          assert.ok(!(opaqueAt(name, sx, sy, x, y) && opaqueAt('case', 0, 0, x, y)), `a ${k} at spot ${sx},${sy} stands clear of the case`);
        }
      }
    }
  }
  assert.ok(data.feet.you > PATH_Y, 'passers-by walk behind you');
});

test('your pedals stand in front of the crate, clear of the case and of every listener', () => {
  const pedals = PEDALS.map((id) => `pedal-${id}-1`);
  const [, , , bottom] = cover('you-acoustic-idle-0', 0, 0);
  for (const name of pedals) {
    const [l, t, r, b] = cover(name, 0, 0);
    assert.ok(t >= data.feet.you && b <= 170, `${name} is on the ground in front of you, above the strip`);
    for (let y = t; y < b; y++) {
      for (let x = l; x < r; x++) {
        if (!opaqueAt(name, 0, 0, x, y)) continue;
        assert.ok(!opaqueAt('case', 0, 0, x, y), `${name} clear of the case`);
        for (const [sx, sy] of CROWD.spots) {
          for (const k of KINDS) assert.ok(!opaqueAt(`${k}-stand-0-${sx < CROWD.playerX ? 'right' : 'left'}`, sx, sy, x, y), `${name} clear of a ${k} at ${sx},${sy}`);
        }
      }
    }
  }
  assert.ok(bottom <= data.feet.pedals);
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
  for (const id of PEDALS) {
    const [lx, ly] = data.shop.leds[id], [x, y, w, h] = data.shop.items[id];
    assert.ok(lx >= x && lx + 2 <= x + w && ly >= y && ly < y + h, `${id}'s light is on the pedal`);
  }
});
