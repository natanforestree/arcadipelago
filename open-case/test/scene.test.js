import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createScene, sceneNote, sceneLoopNote, sceneEvents, stepScene, coinAt, glyphAt, loopGlyphAt, CASE, GUITAR, LOOP_PEDAL,
  TRAIL_LIFE, LOOP_TRAIL_LIFE, FLIGHT, GOLD,
  skyStages, sunDrop, windowLit, lampState, starsOut, trainX, cloudX, createFlocks, birdsAt, pigeonsAt, frameOf,
  PIGEONS, TRAIN_LENGTH, PIGEON_FLY, PIGEON_WALK,
  stationClock, trainAt, boardFirst, marketStages, lanternsLit, steamFrame, catAt, CAT, TRAIN, CAT_RUN, CAT_WALK,
  sunriseStages, sunUp, mistLeft, fishAt, giftAt, FISH_JUMP, SPLASH, GIFT_FALL,
} from '../src/scene.js';
import { createCrowd } from '../src/crowd.js';
import { LOFI_CLOCK } from '../src/beats.js';
import { PARK, STATION, MARKET, ISLAND } from '../src/tuning.js';
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

test('a scene knows its place, the park unless it says', () => {
  assert.equal(createScene(1).place, 'park');
  assert.equal(createScene(1, { place: 'market' }).place, 'market');
});

test("the station's clock runs from half past five as a set starts to half past six as it ends", () => {
  assert.deepEqual(stationClock(0), { hour: 5, minute: 30 });
  assert.deepEqual(stationClock(PARK.bars / 2), { hour: 6, minute: 0 });
  assert.deepEqual(stationClock(PARK.bars), { hour: 6, minute: 30 });
  assert.deepEqual(stationClock(PARK.bars * 2), { hour: 6, minute: 30 }, 'and stays there');
  assert.deepEqual(stationClock(PARK.bars / 4 + 0.5), { hour: 5, minute: 45 });
});

test("each of the crowd's trains pulls in, stands with its doors open as its passengers step off, and pulls out", () => {
  const trains = createCrowd(2, 'station').trains, first = trains[0];
  assert.equal(trainAt(trains, first.t - STATION.pullIn - 0.1), null, 'not yet');
  const coming = trainAt(trains, first.t - STATION.pullIn / 2);
  assert.ok(coming.x > TRAIN.stop && coming.x < 320 && !coming.doors, 'pulling in from the right');
  for (const at of first.people) assert.deepEqual(trainAt(trains, at), { x: TRAIN.stop, doors: true }, 'standing as each steps off');
  const going = trainAt(trains, first.t + STATION.stand + STATION.pullOut / 2);
  assert.ok(going.x < TRAIN.stop && !going.doors, 'pulling out to the left');
  assert.equal(trainAt(trains, first.t + STATION.stand + STATION.pullOut + 0.1), null, 'gone');
  assert.ok(trainAt(trains, first.t + STATION.stand + STATION.pullOut).x <= -TRAIN.cars * TRAIN.car + 1, 'all of it off the screen');
  assert.equal(trainAt([], 10), null);
});

test('the departure board loses its top train as that train pulls out', () => {
  const trains = createCrowd(2, 'station').trains;
  assert.equal(boardFirst(trains, 0), 0);
  assert.equal(boardFirst(trains, trains[0].t + STATION.stand - 0.01), 0);
  assert.equal(boardFirst(trains, trains[0].t + STATION.stand), 1);
  assert.equal(boardFirst(trains, trains[2].t + STATION.stand), 3);
});

test("the night market's sky starts at blue hour and darkens to night with the park's", () => {
  assert.deepEqual(marketStages(0), skyStages(0).map((s) => s + MARKET.skyFrom));
  assert.ok(marketStages(PARK.bars).every((s) => s === 4));
  for (let bar = 0; bar <= PARK.bars; bar++) {
    marketStages(bar).forEach((s, band) => assert.ok(s >= marketStages(Math.max(0, bar - 1))[band], 'never lightens'));
  }
});

test('the lanterns light one by one, in order, from bar 2 to bar 40', () => {
  const n = 30;
  assert.equal(lanternsLit(0, n), 0);
  assert.equal(lanternsLit(MARKET.lanternsFrom, n), 1);
  assert.equal(lanternsLit(MARKET.lanternsTo, n), n);
  assert.equal(lanternsLit(PARK.bars, n), n);
  let last = 0;
  for (let bar = 0; bar <= MARKET.lanternsTo; bar += 0.5) {
    const lit = lanternsLit(bar, n);
    assert.ok(lit >= last && lit - last <= 1, `bar ${bar}`);
    last = lit;
  }
});

test('the steam puffs between its two frames, and holds still with reduced motion', () => {
  assert.equal(steamFrame(0.1, false), 0);
  assert.equal(steamFrame(MARKET.steam + 0.1, false), 1);
  assert.equal(steamFrame(MARKET.steam + 0.1, true), 0);
});

test('the cat sleeps by your case until a loud note wakes it; it runs off and strolls back 4 bars later', () => {
  const scene = createScene(1, { place: 'market' });
  const asleep = catAt(scene, 5, 0);
  assert.deepEqual([asleep.pose, asleep.x, asleep.y], ['sleep', CAT[0], CAT[1]]);
  assert.notEqual(catAt(scene, 5, 0).frame, catAt(scene, 5, 1.5).frame, 'breathing');
  sceneNote(scene, 60, 0, 10, 3);
  assert.equal(catAt(scene, 10.5, 0).pose, 'sleep', 'a quiet note leaves it be');
  sceneNote(scene, 60, 1, 10, 4);
  const run = catAt(scene, 10.5, 0);
  assert.ok(run.pose === 'run' && run.x > CAT[0] && run.dir === 1, 'off to the right');
  assert.equal(catAt(scene, 10 + CAT_RUN + 0.1, 0), null, 'away');
  const back = 10 + PARK.pigeonsAway * BAR;
  assert.equal(catAt(scene, back - 0.1, 0), null);
  const walk = catAt(scene, back + CAT_WALK / 2, 0);
  assert.ok(walk.pose === 'walk' && walk.x > CAT[0] && walk.x < 340 && walk.dir === -1, 'strolling back');
  assert.equal(catAt(scene, back + CAT_WALK + 0.1, 0).pose, 'sleep', 'and back to sleep');
});

test('woken again while strolling back, the cat runs off from where it is, not from home', () => {
  const scene = createScene(1, { place: 'market' });
  sceneNote(scene, 60, 0, 10, 4);
  const back = 10 + PARK.pigeonsAway * BAR, mid = back + CAT_WALK / 2;
  const there = catAt(scene, mid, 0).x;
  assert.ok(there > CAT[0] + 10, 'on its way back');
  sceneNote(scene, 60, 1, mid, 4);
  const run = catAt(scene, mid + 0.01, 0);
  assert.equal(run.pose, 'run');
  assert.ok(Math.abs(run.x - there) <= 2, `runs from ${run.x}, where it was (${there})`);
});

test("the island's sunrise lightens the sky a band at a time, at bar lines, from before dawn to morning, the horizon first", () => {
  assert.deepEqual(sunriseStages(0), [0, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(sunriseStages(PARK.bars), [4, 4, 4, 4, 4, 4, 4]);
  assert.deepEqual(sunriseStages(PARK.bandFirst), [0, 0, 0, 0, 0, 0, 1], 'the horizon first');
  for (let bar = 0; bar <= PARK.bars; bar++) {
    const s = sunriseStages(bar);
    s.forEach((stage, band) => band < 6 && assert.ok(stage <= s[band + 1], `bar ${bar}: lighter toward the horizon`));
    if (bar) s.forEach((stage, band) => assert.ok(stage >= sunriseStages(bar - 1)[band], `bar ${bar}: never darker again`));
  }
});

test('the sun stays behind the far pines a few bars, then comes up, and the mist thins out and is gone by bar 40', () => {
  assert.equal(sunUp(0), 0);
  assert.equal(sunUp(ISLAND.sunFrom), 0);
  assert.equal(sunUp(ISLAND.sunTo), ISLAND.sunRise);
  assert.equal(sunUp(PARK.bars), ISLAND.sunRise);
  for (let b = 1; b <= PARK.bars; b += 0.5) assert.ok(sunUp(b) >= sunUp(b - 0.5), `bar ${b}`);
  assert.equal(mistLeft(0), ISLAND.mist);
  assert.equal(ISLAND.mistGone, 40);
  assert.ok(mistLeft(ISLAND.mistGone - 1) > 0);
  assert.equal(mistLeft(ISLAND.mistGone), 0);
  assert.equal(mistLeft(PARK.bars), 0);
  for (let b = 1; b <= PARK.bars; b++) assert.ok(mistLeft(b) <= mistLeft(b - 1), `bar ${b}`);
});

test("a loud note makes the island's fish jump and splash, and it stays down 4 bars", () => {
  const scene = createScene(1, { place: 'island' });
  assert.equal(fishAt(scene, 5), null, 'under, until a loud note');
  sceneNote(scene, 60, 0, 10, 3);
  assert.equal(fishAt(scene, 10.1), null, 'a pick strength of 3 leaves it be');
  sceneNote(scene, 60, 1, 10, 4);
  const up = fishAt(scene, 10 + FISH_JUMP * 0.25), top = fishAt(scene, 10 + FISH_JUMP / 2), down = fishAt(scene, 10 + FISH_JUMP * 0.75);
  assert.deepEqual([up.pose, up.frame, down.frame], ['jump', 0, 1]);
  assert.ok(top.y < up.y && up.y < ISLAND.fish[1] && top.y <= ISLAND.fish[1] - 13, 'it leaps');
  assert.ok(up.x < top.x && top.x < down.x, 'and along');
  assert.equal(fishAt(scene, 10 + FISH_JUMP + 0.1).pose, 'splash');
  assert.equal(fishAt(scene, 10 + FISH_JUMP + SPLASH + 0.1), null);
  sceneNote(scene, 60, 2, 12, 4);
  assert.equal(fishAt(scene, 12.1), null, "another loud note soon after doesn't count");
  const back = 10 + PARK.pigeonsAway * BAR;
  sceneNote(scene, 60, 3, back + 0.5, 4);
  assert.equal(fishAt(scene, back + 0.6).pose, 'jump', '4 bars later it jumps again');
});

test('a keepsake left at the end drops into the case and lies there, sparkling', () => {
  const scene = createScene(1, { place: 'island' });
  assert.equal(giftAt(scene, 1, 1), null);
  sceneEvents(scene, [{ type: 'end' }, { type: 'keepsake', id: 'acorn' }], 180);
  const falling = giftAt(scene, 180 + GIFT_FALL / 2, 0);
  assert.equal(falling.id, 'acorn');
  assert.ok(!falling.landed && falling.y < CASE[1] && falling.x === CASE[0]);
  const landed = giftAt(scene, 180 + GIFT_FALL + 1, 0);
  assert.deepEqual([landed.x, landed.y, landed.landed], [...CASE, true]);
  assert.notEqual(giftAt(scene, 183, 0).sparkle, giftAt(scene, 183, 0.3).sparkle, 'it sparkles');
});
