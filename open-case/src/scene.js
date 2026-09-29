// What's on screen besides the set itself, as plain data updated from what happens: the note trail,
// coins flying into the case, the gold link of a callback, and the park's life (the sunset over the
// set, the lit windows, the train, the pigeons by your case and the birds overhead). Pure, so it's
// tested in Node; render.js draws it. Times are seconds on the set's clock, except the birds' and the
// pigeons' pecking, which run on the page's clock (`time`).
import { createRng, nextRandom, randomBetween } from './rng.js';
import { BAR } from './groove.js';
import { PARK, RULES } from './tuning.js';

export const GUITAR = [152, 128]; // where notes float up from
export const CASE = [161, 160]; // where coins land
export const PIGEONS = [[196, 172], [209, 176], [222, 170]]; // where the pigeons peck: their feet
const TRAIL_LIFE = 6; // seconds a note's glyph lasts (2 bars)
const FLIGHT = 0.7; // seconds a coin takes to reach the case
const GOLD = 2; // seconds the callback's gold link shows
const PARK_SEED = 0x9e3779b9; // mixed into the set's seed, so the park draws from its own stream
const TRAIN_LENGTH = 62; // pixels, engine and all
const CLOUD_MARGIN = 60; // pixels a cloud drifts off one side before it comes back on the other
const FLOCK_MARGIN = 40; // pixels off screen a flock starts and ends
const FLOCK_SPACING = 9; // pixels between the birds in a flock...
const FLOCK_ROWS = [0, 3, -2, 5, 1]; // ...and each one's height in the line
const FLAP = 0.12; // seconds a bird's wingbeat frame lasts
const PIGEON_FLY = 2.5; // seconds scattered pigeons take to fly off screen
const PIGEON_WALK = 4; // seconds they take to walk back in
const PIGEON_CYCLE = 6; // seconds: each pigeon pecks, then shuffles a few pixels, then pecks again
// Which of n frames a counter is on, for counters that may be negative (the page's clock can start a
// hair below zero).
export const frameOf = (count, n) => ((Math.floor(count) % n) + n) % n;

export function createScene(seed = 1) {
  const rng = createRng((seed ^ PARK_SEED) >>> 0);
  return {
    trail: [], flights: [], caseCoins: 0, gold: null, clapFrom: -1,
    lastNote: -Infinity, // when you last played a note (you strum)
    scaredAt: null, // when a loud note last scattered the pigeons
    flyFrom: 1, // how far through the walk back they were when last scattered (1: at home)
    trainBar: Math.floor(randomBetween(rng, PARK.trainFrom, PARK.trainTo)),
    rng, // the windows' bars, drawn as they're first asked for
    windowBars: [],
  };
}

// A note you played: index is its place in the ears' note list (for its echo). A loud one scatters
// the pigeons, if they're there.
export function sceneNote(scene, pitch, index, t, strength = 0) {
  scene.trail.push({ pitch, index, t });
  scene.lastNote = t;
  if (strength >= RULES.loudStrength && (scene.scaredAt === null || t - scene.scaredAt >= PARK.pigeonsAway * BAR)) {
    // Scattered while walking back in: fly on from there, not from home.
    const back = scene.scaredAt === null ? -1 : t - scene.scaredAt - PARK.pigeonsAway * BAR;
    scene.flyFrom = back >= 0 && back < PIGEON_WALK ? back / PIGEON_WALK : 1;
    scene.scaredAt = t;
  }
}

// Takes one update's set events.
export function sceneEvents(scene, events, t) {
  for (const e of events) {
    if (e.type === 'coin') {
      for (let k = 0; k < e.coins; k++) scene.flights.push({ from: [e.person.x, e.person.y - 34], t: t + k * 0.12 });
    } else if (e.type === 'rule' && e.rule === 'callback') scene.gold = { t, first: e.first };
    else if (e.type === 'end') scene.clapFrom = t;
  }
}

// Time passes: old glyphs go, coins land.
export function stepScene(scene, t) {
  while (scene.trail.length && t - scene.trail[0].t > TRAIL_LIFE) scene.trail.shift();
  for (const f of scene.flights) if (!f.landed && t - f.t >= FLIGHT) {
    f.landed = true;
    scene.caseCoins++;
  }
  scene.flights = scene.flights.filter((f) => !f.landed);
  if (scene.gold && t - scene.gold.t > GOLD) scene.gold = null;
}

// Where a flying coin is at time t: an arc from the listener to the case. null before it's thrown.
export function coinAt(f, t) {
  const k = (t - f.t) / FLIGHT;
  if (k < 0) return null;
  const [x0, y0] = f.from, [x1, y1] = CASE;
  return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k - Math.sin(Math.PI * k) * 24];
}

// Where a note's glyph is at time t, and how faded (1 new, 0 gone). Higher notes start higher; the
// glyphs drift right and up as they age, so their spacing follows your timing.
export function glyphAt(g, t) {
  const age = t - g.t;
  return { x: GUITAR[0] + age * 16, y: GUITAR[1] - (g.pitch - 52) * 1.4 - age * 5, fade: Math.max(0, 1 - age / TRAIL_LIFE) };
}

// The sunset. `bar` is a whole number of bars into the set (0 before it starts).

// The stage, 0 (dusk) to 4 (night), of each of the sky's seven bands, top down. Each band steps on at a
// bar line, the top one first and the horizon's last, so stage k is complete at bar k * stageBars.
export function skyStages(bar) {
  return Array.from({ length: 7 }, (_, band) => {
    let stage = 0;
    for (let k = 0; k < 4; k++) if (bar >= k * PARK.stageBars + PARK.bandFirst + PARK.bandStep * band) stage = k + 1;
    return stage;
  });
}

// How far the sun has sunk, in pixels, `bars` (a fraction is fine) into the set; null once it's gone.
export function sunDrop(bars) {
  if (bars >= PARK.sunGone) return null;
  return Math.round((PARK.sunSink * Math.max(0, bars)) / PARK.sunGone);
}

// Is the i-th window lit yet? Each lights at its own bar, drawn from the set's seed.
export function windowLit(scene, i, bar) {
  while (scene.windowBars.length <= i) scene.windowBars.push(Math.floor(randomBetween(scene.rng, PARK.windowsFrom, PARK.windowsTo)));
  return bar >= scene.windowBars[i];
}

// The lamp: 'off' before its bar, then 'on', dimming for a moment now and then ('flicker') unless
// the page is asked for reduced motion.
export function lampState(bar, time, still) {
  if (bar < PARK.lampOn) return 'off';
  return !still && Math.sin(time * 7.3) * Math.sin(time * 2.1) > 0.9 ? 'flicker' : 'on';
}

// How many stars are out: one more each bar from PARK.starsFrom.
export const starsOut = (bar) => Math.max(0, bar - PARK.starsFrom + 1);

// The distant train's left end at set time t, or null when it isn't passing.
export function trainX(scene, t) {
  const k = (t - scene.trainBar * BAR) / PARK.trainCross;
  if (k < 0 || k > 1) return null;
  return Math.round(-TRAIN_LENGTH + k * (320 + TRAIN_LENGTH));
}

// A cloud's x after `time` seconds of drifting right from `home`, coming back round from the left.
export function cloudX(home, layer, time) {
  const span = 320 + 2 * CLOUD_MARGIN;
  const x = (home + CLOUD_MARGIN + PARK.clouds[layer - 1] * time) % span;
  return Math.round(x) - CLOUD_MARGIN;
}

// The birds: flocks of 1 to PARK.flockMost that cross the sky now and then, from their own seeded
// stream, on the page's clock.
export function createFlocks(seed = 1) {
  const rng = createRng((seed ^ PARK_SEED ^ 0xb12d5) >>> 0);
  return { rng, next: randomBetween(rng, PARK.flockFirst[0], PARK.flockFirst[1]), flying: [] };
}

// The birds in the sky at `time` (seconds, only ever increasing): [{ x, y, frame }].
export function birdsAt(flocks, time) {
  while (flocks.next <= time) {
    const r = flocks.rng;
    flocks.flying.push({
      t: flocks.next,
      dir: nextRandom(r) < 0.5 ? 1 : -1,
      y: Math.round(randomBetween(r, 14, 60)),
      n: 1 + Math.floor(nextRandom(r) * PARK.flockMost),
    });
    flocks.next += randomBetween(r, PARK.flockEvery[0], PARK.flockEvery[1]);
  }
  flocks.flying = flocks.flying.filter((f) => time - f.t < PARK.flockCross);
  const out = [];
  for (const f of flocks.flying) {
    const k = (time - f.t) / PARK.flockCross, span = 320 + 2 * FLOCK_MARGIN;
    const lead = f.dir > 0 ? -FLOCK_MARGIN + k * span : 320 + FLOCK_MARGIN - k * span;
    for (let j = 0; j < f.n; j++) {
      out.push({ x: Math.round(lead - f.dir * j * FLOCK_SPACING), y: f.y + FLOCK_ROWS[j], frame: frameOf(time / FLAP + j, 2) });
    }
  }
  return out;
}

// The pigeons at set time t and page time `time`: [{ x, y, pose: 'peck' | 'walk' | 'fly', frame,
// dir }] (+1 facing right). Scattered, they fly up and off to the right; PARK.pigeonsAway bars later
// they walk back in from the right, and they're gone in between.
export function pigeonsAt(scene, t, time) {
  const out = [];
  const since = scene.scaredAt === null ? Infinity : Math.max(0, t - scene.scaredAt);
  PIGEONS.forEach(([hx, hy], i) => {
    const from = 330 + i * 10; // where pigeon i starts walking back in from
    if (since < PIGEON_FLY) {
      const start = from + (hx - from) * scene.flyFrom; // where it was when scattered
      const up = 70 * since + 20 * since * since;
      out.push({ x: Math.round(start + (60 + i * 12) * since), y: Math.round(hy - up), pose: 'fly', frame: frameOf(since * 8 + i, 2), dir: 1 });
      return;
    }
    const back = since - PARK.pigeonsAway * BAR; // seconds since they started walking back
    if (back < 0) return;
    if (back < PIGEON_WALK) {
      out.push({ x: Math.round(from + (hx - from) * (back / PIGEON_WALK)), y: hy, pose: 'walk', frame: frameOf(time * 6 + i, 2), dir: -1 });
      return;
    }
    // At home: pecking, then shuffling 4 pixels one way, pecking, then shuffling back.
    const cycle = (time + i * 1.3) / PIGEON_CYCLE, n = Math.floor(cycle), f = cycle - n;
    const walking = f > 0.75, w = walking ? (f - 0.75) / 0.25 : 0;
    const dir = frameOf(n, 2) === 0 ? 1 : -1;
    const x = hx + Math.round(dir > 0 ? 4 * w : 4 * (1 - w));
    out.push(walking
      ? { x, y: hy, pose: 'walk', frame: frameOf(time * 6 + i, 2), dir }
      : { x, y: hy, pose: 'peck', frame: frameOf(time * 3 + i * 1.7, 4) === 0 ? 1 : 0, dir });
  });
  return out;
}

export { TRAIL_LIFE, FLIGHT, GOLD, TRAIN_LENGTH, PIGEON_FLY, PIGEON_WALK };
