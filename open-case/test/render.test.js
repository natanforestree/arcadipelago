import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRenderer, shapeTags, W, H } from '../src/render.js';
import { createSet, runSet } from '../src/set.js';
import { createScene, sceneNote } from '../src/scene.js';
import { createKeyState } from '../src/keys.js';
import { goodSet } from '../src/bots.js';
import { KINDS } from '../src/crowd.js';
import { stoodAt } from './helpers.js';

// A stand-in 2D context that records what's drawn: every filled rectangle and every piece of text.
function fakeContext() {
  const rects = [], texts = [];
  return {
    rects, texts,
    fillStyle: '', font: '', textAlign: '', textBaseline: '', globalAlpha: 1, imageSmoothingEnabled: true,
    fillRect(x, y, w, h) {
      assert.ok([x, y, w, h].every(Number.isFinite), `fillRect(${x}, ${y}, ${w}, ${h})`);
      rects.push([x, y, w, h, this.fillStyle]);
    },
    fillText(s, x, y) {
      texts.push(s);
    },
    beginPath() {},
    arc() {},
    ellipse() {},
    fill() {},
  };
}

const view = (over) => ({ screen: 'playing', set: null, scene: createScene(), keys: createKeyState(), t: 0, time: 1, debug: null, ...over });

test('the title shows the name, the key layout and how to start', () => {
  const g = fakeContext();
  createRenderer(g)(view({ screen: 'title' }));
  assert.ok(g.texts.includes('Open Case'));
  assert.ok(['A', 'W', "'", 'press any key'].every((s) => g.texts.includes(s)));
  assert.ok(g.rects.some(([x, y, w, h]) => x === 0 && y === 0 && w === W), 'the park behind it');
});

test('a set in full swing draws everyone, their reactions, the trail and the strip without error', () => {
  const g = fakeContext();
  const set = runSet(1, goodSet(1)); // a whole set, so the strip is full
  const scene = createScene();
  for (const [i, n] of set.listen.notes.slice(-12).entries()) sceneNote(scene, n.pitch, set.listen.notes.length - 12 + i, set.t - 2 + i * 0.1);
  scene.gold = { t: set.t - 0.5, first: 0 };
  const rules = ['repeat', 'offKey', 'callback', 'recognised', 'random', 'silence', 'loud', 'taste'];
  KINDS.forEach((kind, i) => stoodAt(set.crowd, kind, i, { reaction: { rule: rules[i], t: set.t } }));
  stoodAt(set.crowd, 'jogger', 4, { reaction: { rule: rules[4], t: set.t }, state: 'passing', dir: -1 });
  stoodAt(set.crowd, 'oldman', 5, { reaction: { rule: rules[7], t: set.t }, state: 'leaving' });
  createRenderer(g)(view({ set, scene, t: set.t, debug: { reported: 12, measured: 18 } }));
  assert.ok(g.texts.includes('zzz') && g.texts.includes('?'), 'reactions over heads');
  assert.ok(g.texts.some((s) => s.startsWith('delay 12ms  key 18ms')), 'the debug panel');
  assert.ok(g.texts.includes('repeat') || g.texts.includes('taste') || g.texts.includes(''), 'last rules under people');
  assert.ok(g.rects.every(([x, y]) => x > -40 && x < W + 40 && y > -40 && y < H + 40));
});

test('waiting for the first note, and paused', () => {
  const g = fakeContext();
  const draw = createRenderer(g);
  draw(view({ screen: 'ready' }));
  assert.ok(g.texts.includes('play a note to start the set'));
  g.rects.length = 0;
  draw(view({ screen: 'paused', set: createSet(1) }));
  assert.deepEqual(g.rects.at(-1).slice(0, 4), [0, 0, W, H], 'dimmed under the pause card');
});

test('the debug panel tags your last notes by shape, repeats sharing a letter', () => {
  assert.equal(shapeTags([null, null, null, 'x', 'y', 'x', 'z']), '---ABAC');
});
