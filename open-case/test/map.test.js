// Checks the committed map (open-case/assets/map/, written by art/open-case/map/land.py and places.py)
// against what the map screen expects: every picture map.json names is there and lies on the map, each
// place to busk has its pin, label and view on the map, and the whole map stays small.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { readPng } from './png.js';
import { PLACE_IDS, PLACE_WORDS } from '../src/places.js';

const dir = new URL('../assets/map/', import.meta.url);
const map = JSON.parse(readFileSync(new URL('map.json', dir), 'utf8'));
const [W, H] = map.size;
const png = (name) => readPng(new URL(`${name}.png`, dir));

test('the land is half the map each way, shown at twice its size', () => {
  const land = readPng(new URL(map.land, dir));
  assert.deepEqual([land.w * 2, land.h * 2], [W, H]);
});

test('every picture map.json names is there and lies on the map, the city first, under the rest', () => {
  assert.equal(map.pictures[0].name, 'city');
  const names = map.pictures.map((p) => p.name);
  for (const want of [...PLACE_IDS, 'city', 'suspension', 'truss', 'village', 'lighthouse', 'marina', 'farm']) assert.ok(names.includes(want), want);
  assert.equal(new Set(names).size, names.length, 'each once');
  for (const { name, x, y } of map.pictures) {
    const { w, h } = png(name);
    assert.ok(x >= 0 && y >= 0 && x + w <= W && y + h <= H, `${name} at ${x}, ${y}, ${w}x${h}`);
  }
  for (const { name, x, y } of map.clouds) {
    assert.ok(png(name).w > 0 && x >= 0 && x < W && y >= 0 && y < H, `${name} at ${x}, ${y}`);
  }
});

test("each place to busk has its picture, its name, and its pin, label and view on the map, the pin over the picture", () => {
  assert.deepEqual(Object.keys(map.places), PLACE_IDS);
  for (const id of PLACE_IDS) {
    const p = map.places[id], pic = map.pictures.find((q) => q.name === id), { w, h } = png(id);
    assert.equal(p.name, PLACE_WORDS[id].name);
    for (const [x, y] of [p.pin, p.label, p.view]) assert.ok(x >= 0 && x < W && y >= 0 && y < H, `${id}: ${x}, ${y}`);
    assert.ok(p.pin[0] > pic.x && p.pin[0] < pic.x + w && p.pin[1] >= pic.y - 6 && p.pin[1] < pic.y + h, `${id}'s pin`);
    assert.ok(p.label[1] > p.pin[1], `${id}'s label hangs under it`);
  }
});

test('the whole map stays under 500 KB', () => {
  const bytes = readdirSync(dir).reduce((sum, f) => sum + statSync(new URL(f, dir)).size, 0);
  assert.ok(bytes < 500 * 1024, `${bytes} bytes`);
});
