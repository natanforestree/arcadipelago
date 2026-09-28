import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScene, sceneNote, sceneEvents, stepScene, coinAt, glyphAt, CASE, GUITAR, TRAIL_LIFE, FLIGHT, GOLD } from '../src/scene.js';

test('each note leaves a glyph that floats up from the guitar, higher notes higher, and fades over 2 bars', () => {
  const scene = createScene();
  sceneNote(scene, 60, 0, 1);
  sceneNote(scene, 72, 1, 1.5);
  const [low, high] = scene.trail;
  assert.equal(glyphAt(low, 1).x, GUITAR[0]);
  assert.ok(glyphAt(high, 1.5).y < glyphAt(low, 1).y, 'higher notes start higher');
  assert.ok(glyphAt(low, 3).y < glyphAt(low, 1).y && glyphAt(low, 3).x > glyphAt(low, 1).x, 'they drift up and along');
  assert.ok(glyphAt(low, 1 + TRAIL_LIFE / 2).fade > 0.4);
  stepScene(scene, 1.2 + TRAIL_LIFE);
  assert.deepEqual(scene.trail.map((g) => g.pitch), [72]);
});

test('a coin arcs from the listener into the case and stays there', () => {
  const scene = createScene();
  const person = { x: 200, y: 158 };
  sceneEvents(scene, [{ type: 'coin', person, coins: 2, why: 'happy' }], 10);
  assert.equal(scene.flights.length, 2);
  const [a, b] = scene.flights;
  assert.deepEqual(coinAt(a, 10), [200, 124]);
  assert.equal(coinAt(b, 10), null, 'the second follows a moment later');
  assert.ok(coinAt(a, 10 + FLIGHT / 2)[1] < 124, 'it arcs up');
  stepScene(scene, 10 + FLIGHT + 0.2);
  assert.equal(scene.caseCoins, 2);
  assert.equal(scene.flights.length, 0);
  assert.deepEqual(coinAt(a, 10 + FLIGHT).map(Math.round), CASE);
});

test('a callback lights the gold link for a moment; the end starts the applause', () => {
  const scene = createScene();
  sceneEvents(scene, [{ type: 'rule', rule: 'callback', first: 12 }, { type: 'end' }], 30);
  assert.deepEqual(scene.gold, { t: 30, first: 12 });
  assert.equal(scene.clapFrom, 30);
  stepScene(scene, 30 + GOLD + 0.1);
  assert.equal(scene.gold, null);
});
