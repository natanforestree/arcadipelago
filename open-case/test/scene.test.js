import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createScene, sceneNote, sceneLoopNote, sceneEvents, stepScene, coinAt, glyphAt, loopGlyphAt, CASE, GUITAR, LOOP_PEDAL,
  TRAIL_LIFE, LOOP_TRAIL_LIFE, FLIGHT, GOLD,
  skyStages, sunDrop, windowLit, lampState, starsOut, trainX, cloudX, createFlocks, birdsAt, pigeonsAt, frameOf,
  PIGEONS, TRAIN_LENGTH, PIGEON_FLY, PIGEON_WALK,
} from '../src/scene.js';
import { LOFI_CLOCK } from '../src/beats.js';
import { PARK } from '../src/tuning.js';
const { bar: BAR } = LOFI_CLOCK;

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

test("each of your loop's notes rises from the loop pedal once it plays, up and away from your own, and fades sooner", () => {
  const scene = createScene();
  sceneLoopNote(scene, 60, 2); // scheduled a moment ahead of time 2
  sceneLoopNote(scene, 72, 2.5);
  const [low, high] = scene.loopTrail;
  assert.equal(loopGlyphAt(low, 1.9).fade, 0, 'not before it plays');
  const start = loopGlyphAt(low, 2);
  assert.equal(start.x, LOOP_PEDAL[0]);
  assert.ok(start.y <= LOOP_PEDAL[1] && start.y > LOOP_PEDAL[1] - 10, 'just over the pedal');
  assert.ok(loopGlyphAt(high, 2.5).y < start.y, 'higher notes a little higher');
  const later = loopGlyphAt(low, 3);
  assert.ok(later.y < start.y && later.x < start.x, 'up and to the left, while your own notes drift right');
  assert.ok(LOOP_TRAIL_LIFE < TRAIL_LIFE);
  stepScene(scene, 2.1 + LOOP_TRAIL_LIFE);
  assert.deepEqual(scene.loopTrail.map((g) => g.pitch), [72]);
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

test('the sky steps from dusk to night a band at a time, at bar lines, the horizon last', () => {
  assert.deepEqual(skyStages(0), [0, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(skyStages(3), [1, 0, 0, 0, 0, 0, 0], 'the top band first');
  assert.deepEqual(skyStages(14), [1, 1, 1, 1, 1, 1, 0], 'the horizon waits for the stage bar');
  assert.deepEqual(skyStages(15), [1, 1, 1, 1, 1, 1, 1]);
  assert.deepEqual(skyStages(30), [2, 2, 2, 2, 2, 2, 2], 'blue hour');
  assert.deepEqual(skyStages(59), [4, 4, 4, 4, 4, 4, 3]);
  assert.deepEqual(skyStages(60), [4, 4, 4, 4, 4, 4, 4], 'night at the end of the set');
  assert.deepEqual(skyStages(99), [4, 4, 4, 4, 4, 4, 4], 'and it stays night');
  for (let bar = 1; bar <= 60; bar++) {
    skyStages(bar).forEach((s, i) => assert.ok(s - skyStages(bar - 1)[i] <= 1, `bar ${bar}: band ${i} steps one stage at a time`));
  }
});

test('the sun sinks a pixel at a time and is gone by bar 36', () => {
  assert.equal(sunDrop(0), 0);
  assert.equal(sunDrop(18), Math.round(PARK.sunSink / 2));
  assert.equal(sunDrop(35.9), PARK.sunSink);
  assert.equal(sunDrop(36), null);
  for (let b = 0; b < 36; b += 0.25) assert.ok(sunDrop(b + 0.25) === null || sunDrop(b + 0.25) - sunDrop(b) <= 1);
});

test('each window lights at its own bar between 10 and 50, the same bars for the same seed', () => {
  const a = createScene(7), b = createScene(7), c = createScene(8);
  const bars = (scene) => [...Array(30).keys()].map((i) => [...Array(61).keys()].find((bar) => windowLit(scene, i, bar)));
  const first = bars(a);
  assert.deepEqual(bars(b), first);
  assert.notDeepEqual(bars(c), first, 'another set lights them in another order');
  for (const bar of first) assert.ok(bar >= PARK.windowsFrom && bar < PARK.windowsTo, `bar ${bar}`);
  assert.ok(new Set(first).size > 10, 'one by one, not all at once');
});

test('the lamp comes on at bar 24 and flickers now and then, but never with reduced motion', () => {
  assert.equal(lampState(23, 1, false), 'off');
  const states = [...Array(2000).keys()].map((i) => lampState(24, i * 0.01, false));
  assert.ok(states.includes('on') && states.includes('flicker'));
  assert.ok(states.filter((s) => s === 'flicker').length < 200, 'a flicker is rare');
  assert.ok([...Array(2000).keys()].every((i) => lampState(40, i * 0.01, true) === 'on'));
});

test('the stars come out one a bar from bar 45', () => {
  assert.equal(starsOut(0), 0);
  assert.equal(starsOut(44), 0);
  assert.equal(starsOut(45), 1);
  assert.equal(starsOut(54), 10);
});

test('the train passes once a set, at a bar between 10 and 50, crossing in 6 seconds', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const scene = createScene(seed);
    assert.ok(Number.isInteger(scene.trainBar) && scene.trainBar >= PARK.trainFrom && scene.trainBar < PARK.trainTo);
    const at = scene.trainBar * BAR;
    assert.equal(trainX(scene, at - 0.01), null);
    assert.equal(trainX(scene, at), -TRAIN_LENGTH, 'it comes on from the left');
    assert.equal(trainX(scene, at + PARK.trainCross), 320, 'and goes off the right');
    assert.equal(trainX(scene, at + PARK.trainCross + 0.01), null);
  }
});

test('clouds drift right, the near ones faster, and come back round', () => {
  assert.equal(cloudX(100, 1, 0), 100);
  assert.equal(cloudX(100, 1, 10), 100 + PARK.clouds[0] * 10);
  assert.equal(cloudX(100, 2, 10), 100 + PARK.clouds[1] * 10);
  const wrapped = cloudX(300, 2, 30);
  assert.ok(wrapped < 0, `off the right and back in from the left: ${wrapped}`);
  for (let t = 0; t < 500; t += 7) assert.ok(cloudX(150, 2, t) >= -60 && cloudX(150, 2, t) < 380);
});

test('birds cross in flocks of 1 to 5, the first 5 to 15 seconds in, then every 20 to 40', () => {
  const starts = [], sizes = [];
  const flocks = createFlocks(3);
  let seen = 0;
  for (let t = 0; t < 600; t += 0.1) {
    const birds = birdsAt(flocks, t);
    for (const f of flocks.flying) if (!starts.includes(f.t)) (starts.push(f.t), sizes.push(f.n));
    seen = Math.max(seen, birds.length);
    for (const b of birds) assert.ok(b.y >= 10 && b.y < 70 && (b.frame === 0 || b.frame === 1));
  }
  assert.ok(starts[0] >= PARK.flockFirst[0] && starts[0] < PARK.flockFirst[1]);
  starts.slice(1).forEach((s, i) => assert.ok(s - starts[i] >= PARK.flockEvery[0] && s - starts[i] < PARK.flockEvery[1]));
  assert.ok(sizes.every((n) => n >= 1 && n <= PARK.flockMost) && new Set(sizes).size > 1);
  assert.ok(seen >= 1);
  // the same seed flies the same birds
  const again = createFlocks(3);
  assert.deepEqual(birdsAt(again, starts[0] + 4), birdsAt(createFlocks(3), starts[0] + 4));
});

test('a flock takes 8 seconds to cross', () => {
  const flocks = createFlocks(1);
  const start = flocks.next;
  const lead = (t) => birdsAt(flocks, t)[0];
  const a = lead(start + 0.01), b = lead(start + PARK.flockCross - 0.01);
  assert.ok((a.x < 0 && b.x > 320) || (a.x > 320 && b.x < 0), `from ${a.x} to ${b.x}`);
  assert.equal(birdsAt(flocks, start + PARK.flockCross + 0.01).length, 0);
});

test('the pigeons peck by the case until a loud note scatters them; they walk back 4 bars later', () => {
  const scene = createScene(1);
  const home = pigeonsAt(scene, 5, 5);
  assert.equal(home.length, PIGEONS.length);
  home.forEach((p, i) => assert.ok(Math.abs(p.x - PIGEONS[i][0]) <= 4 && p.y === PIGEONS[i][1] && p.pose !== 'fly'));
  sceneNote(scene, 60, 0, 10, 3);
  assert.equal(scene.scaredAt, null, 'a pick strength of 3 leaves them be');
  sceneNote(scene, 60, 1, 10, 4);
  assert.equal(scene.scaredAt, 10);
  const up = pigeonsAt(scene, 11, 11);
  assert.ok(up.every((p) => p.pose === 'fly'));
  assert.ok(pigeonsAt(scene, 10 + PIGEON_FLY - 0.1, 0).every((p) => p.y < 0), 'off the top of the screen');
  assert.equal(pigeonsAt(scene, 10 + PIGEON_FLY + 1, 0).length, 0, 'gone');
  sceneNote(scene, 60, 2, 20, 4);
  assert.equal(scene.scaredAt, 10, "a loud note while they're away doesn't count");
  const back = 10 + PARK.pigeonsAway * BAR;
  assert.equal(pigeonsAt(scene, back - 0.1, 0).length, 0);
  const walking = pigeonsAt(scene, back + 0.1, 0);
  assert.ok(walking.every((p) => p.pose === 'walk' && p.dir === -1 && p.x > 300), 'walking in from the right');
  const settled = pigeonsAt(scene, back + PIGEON_WALK + 0.1, 0);
  settled.forEach((p, i) => assert.ok(Math.abs(p.x - PIGEONS[i][0]) <= 4));
  sceneNote(scene, 60, 3, back + 1, 4);
  assert.equal(scene.scaredAt, back + 1, 'walking back, they can be scattered again');
});

test('scattered again while walking back, pigeons fly from where they are, not from home', () => {
  const scene = createScene(1);
  sceneNote(scene, 60, 0, 10, 4); // first scatter
  const mid = 10 + PARK.pigeonsAway * BAR + 1.5; // partway through the walk back
  const before = pigeonsAt(scene, mid, 0);
  assert.ok(before.every((p) => p.pose === 'walk'), 'walking back in when scattered again');
  sceneNote(scene, 60, 1, mid + 0.01, 4); // scattered again, a moment later
  const flight = pigeonsAt(scene, mid + 0.01, 0);
  flight.forEach((p, i) => assert.ok(Math.abs(p.x - before[i].x) <= 2, `pigeon ${i}: ${p.x} vs ${before[i].x}`));
});

test('frame counters wrap for any count, even a hair below zero', () => {
  assert.equal(frameOf(-0.01, 2), 1);
  assert.equal(frameOf(5, 4), 1);
  assert.equal(frameOf(-5, 4), 3);
});

test('after the tab sleeps for an hour, the sky holds at most one flock, not an hour of them', () => {
  const flocks = createFlocks(9);
  birdsAt(flocks, 1);
  const birds = birdsAt(flocks, 3600);
  assert.ok(birds.length <= PARK.flockMost, `${birds.length} birds`);
  assert.ok(flocks.flying.length <= 1);
  assert.ok(flocks.next > 3600, 'the next flock is still to come');
});

test("the park keeps its own bars over a set of any beat: the train by the park's, the pigeons by the beat's", () => {
  const bar = 2.4, parkBar = 182.4 / PARK.bars; // the funk: 76 bars of 2.4 s, so a park bar is 3.04 s
  const scene = createScene(3, { bar, parkBar });
  const at = scene.trainBar * parkBar;
  assert.equal(trainX(scene, at - 0.01), null);
  assert.equal(trainX(scene, at), -TRAIN_LENGTH, "the train comes at its park bar, whatever the beat");
  sceneNote(scene, 60, 0, 10, 4); // loud: the pigeons fly
  assert.ok(pigeonsAt(scene, 10 + PARK.pigeonsAway * bar - 0.01, 0).every((p) => p.pose !== 'walk'), 'still away');
  assert.ok(pigeonsAt(scene, 10 + PARK.pigeonsAway * bar + 0.1, 0).every((p) => p.pose === 'walk'), 'back after 4 of the beat\'s bars');
});
