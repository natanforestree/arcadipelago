// What's on screen besides the set itself, as plain data updated from what happens: the note trail
// (and your loop's, fainter), coins flying into the case, the gold link of a callback, a keepsake
// dropping into it, and the park's life (the sunset over the set, the lit windows, the train, the
// pigeons by your case and the birds overhead), and each other place's. Pure, so it's tested in Node;
// render.js draws it. Times are seconds on the set's clock, except the birds' and the pigeons'
// pecking, which run on the page's clock (`time`).
import { createRng, nextRandom, randomBetween } from './rng.js';
import { LOFI_CLOCK } from './beats.js';
import { PARK, STATION, MARKET, ISLAND, RULES } from './tuning.js';

export const GUITAR = [152, 128]; // where notes float up from
// Where your loop's notes float up from (art/open-case/gear.lua G.LOOP_PEDAL).
export const LOOP_PEDAL = [133, 152];
export const CASE = [161, 160]; // where coins land
// Where the pigeons peck: their feet, clear of the gear strip's loop slot (render.js).
export const PIGEONS = [[222, 172], [235, 176], [248, 170]];
// Where the night market's cat sleeps: its feet, where the pigeons would be.
export const CAT = [236, 174];
// The station's train: four cars (art/open-case/station.lua), `car` pixels apart, its first car's
// left edge at `stop` while it stands at the platform.
export const TRAIN = { cars: 4, car: 112, stop: 24 };
const TRAIL_LIFE = 6; // seconds a note's glyph lasts (2 bars)
const LOOP_TRAIL_LIFE = 3; // seconds a looped note's glyph lasts
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
const CAT_RUN = 1.5; // seconds a woken cat takes to run off the screen
const CAT_WALK = PIGEON_WALK; // seconds it takes to stroll back (as long as the pigeons take, so a loud
// note while it's on its way sends it off from where it is, as they do: scene.flyFrom)
const CAT_BREATH = 1.4; // seconds each of a sleeping cat's two breaths shows
const FISH_JUMP = 0.8; // seconds the island's fish is out of the water...
const FISH_HIGH = 14; // ...leaping this many pixels high...
const FISH_ON = 12; // ...and this far along
const SPLASH = 0.5; // seconds its splash shows, each of its two frames half of it
const GIFT_FALL = 0.8; // seconds a keepsake takes to drop into the case...
const GIFT_FROM = 70; // ...from this many pixels above it
const SPARKLE = 0.25; // seconds each of its sparkle's two frames shows
// Which of n frames a counter is on, for counters that may be negative (the page's clock can start a
// hair below zero).
export const frameOf = (count, n) => ((Math.floor(count) % n) + n) % n;

// bar: seconds in a bar of the set's beat (the pigeons stay away PARK.pigeonsAway of them); parkBar:
// seconds in one of the park's bars (the set's length over PARK.bars), which the train's time counts;
// place: where the set is (places.js), whose scene render.js draws.
export function createScene(seed = 1, { bar = LOFI_CLOCK.bar, parkBar = bar, place = 'park' } = {}) {
  const rng = createRng((seed ^ PARK_SEED) >>> 0);
  return {
    bar, parkBar, place,
    trail: [], flights: [], caseCoins: 0, gold: null, clapFrom: -1,
    gift: null, // a keepsake dropping into the case: { id, t }
    // your loop's notes, { pitch, t }, in time order (t may be a moment ahead: scheduled that way)
    loopTrail: [],
    lastNote: -Infinity, // when you last played a note (you strum)
    scaredAt: null, // when a loud note last scattered the pigeons
    flyFrom: 1, // how far through the walk back they were when last scattered (1: at home)
    trainBar: Math.floor(randomBetween(rng, PARK.trainFrom, PARK.trainTo)),
    rng, // the windows' bars, drawn as they're first asked for
    windowBars: [],
  };
}

// A note you played: index is its place in the ears' note list (for its echo). A loud one scatters
// the pigeons, if they're there (or wakes the night market's cat, or makes the island's fish jump).
export function sceneNote(scene, pitch, index, t, strength = 0) {
  scene.trail.push({ pitch, index, t });
  scene.lastNote = t;
  const away = PARK.pigeonsAway * scene.bar;
  if (strength >= RULES.loudStrength && (scene.scaredAt === null || t - scene.scaredAt >= away)) {
    // Scattered while walking back in: fly on from there, not from home.
    const back = scene.scaredAt === null ? -1 : t - scene.scaredAt - away;
    scene.flyFrom = back >= 0 && back < PIGEON_WALK ? back / PIGEON_WALK : 1;
    scene.scaredAt = t;
  }
}

// A note of your loop, starting at time t.
export function sceneLoopNote(scene, pitch, t) {
  scene.loopTrail.push({ pitch, t });
}

// Takes one update's set events.
export function sceneEvents(scene, events, t) {
  for (const e of events) {
    if (e.type === 'coin') {
      for (let k = 0; k < e.coins; k++) scene.flights.push({ from: [e.person.x, e.person.y - 34], t: t + k * 0.12 });
    } else if (e.type === 'rule' && e.rule === 'callback') scene.gold = { t, first: e.first };
    else if (e.type === 'end') scene.clapFrom = t;
    else if (e.type === 'keepsake') scene.gift = { id: e.id, t };
  }
}

// Time passes: old glyphs go, coins land.
export function stepScene(scene, t) {
  while (scene.trail.length && t - scene.trail[0].t > TRAIL_LIFE) scene.trail.shift();
  while (scene.loopTrail.length && t - scene.loopTrail[0].t > LOOP_TRAIL_LIFE) scene.loopTrail.shift();
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

// The same for a looped note's glyph, once the note sounds: it rises from just over the loop pedal
// (higher notes a little higher) and drifts up and away to the left, so it never follows your own
// notes off toward the crowd.
export function loopGlyphAt(g, t) {
  const age = t - g.t;
  return { x: LOOP_PEDAL[0] - age * 10, y: LOOP_PEDAL[1] - (g.pitch - 52) * 0.5 - age * 10, fade: age < 0 ? 0 : Math.max(0, 1 - age / LOOP_TRAIL_LIFE) };
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
  const k = (t - scene.trainBar * scene.parkBar) / PARK.trainCross;
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
    const back = since - PARK.pigeonsAway * scene.bar; // seconds since they started walking back
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

// The station. Its clock at `bars` (park bars into the set, a fraction is fine): { hour, minute },
// from half past five as a set starts to half past six as it ends.
export function stationClock(bars) {
  const k = Math.min(1, Math.max(0, bars / PARK.bars));
  const minutes = Math.floor(STATION.clockFrom + (STATION.clockTo - STATION.clockFrom) * k);
  return { hour: 5 + Math.floor(minutes / 60), minute: minutes % 60 };
}

// The train at the platform at set time t, from the crowd's trains ([{ t }], t when its doors open):
// null between trains, or { x, doors }: x is its first car's left edge. It slows to a stop pulling in
// from the right, stands with its doors open, and speeds up pulling out to the left.
export function trainAt(trains, t) {
  const length = TRAIN.cars * TRAIN.car;
  for (const tr of trains) {
    const k = t - tr.t;
    if (k < -STATION.pullIn || k > STATION.stand + STATION.pullOut) continue;
    if (k < 0) {
      const left = -k / STATION.pullIn; // 1 as it appears, 0 as it stops
      return { x: Math.round(TRAIN.stop + (320 - TRAIN.stop) * left * left), doors: false };
    }
    if (k <= STATION.stand) return { x: TRAIN.stop, doors: true };
    const gone = (k - STATION.stand) / STATION.pullOut;
    return { x: Math.round(TRAIN.stop - (TRAIN.stop + length) * gone * gone), doors: false };
  }
  return null;
}

// The departure board lists the trains still to go: the first of them at set time t (an index into
// trains). A train leaves the board as it pulls out.
export function boardFirst(trains, t) {
  const i = trains.findIndex((tr) => t < tr.t + STATION.stand);
  return i < 0 ? trains.length : i;
}

// The night market. Its sky's stage for each band, from the park's (skyStages): it starts at blue hour
// and darkens to night with it.
export const marketStages = (bar) => skyStages(bar).map((s) => Math.min(4, s + MARKET.skyFrom));

// How many of its n lanterns are lit at `bar`: they light one by one, in order along the strings.
export function lanternsLit(bar, n) {
  let lit = 0;
  for (let i = 0; i < n; i++) {
    const at = MARKET.lanternsFrom + ((MARKET.lanternsTo - MARKET.lanternsFrom) * i) / Math.max(1, n - 1);
    if (bar >= at) lit++;
  }
  return lit;
}

// The noodle stall's steam: which of its two frames shows at page time `time`.
export const steamFrame = (time, still) => (still ? 0 : frameOf(time / MARKET.steam, 2));

// The cat at set time t and page time `time`: asleep by your case ({ pose: 'sleep', frame }), until a
// loud note (the pigeons' scaredAt) wakes it and it runs off to the right, from wherever it was;
// PARK.pigeonsAway bars later it strolls back in from the right. null while it's away. Each: { pose,
// frame, x, y, dir }.
export function catAt(scene, t, time) {
  const [hx, hy] = CAT;
  const since = scene.scaredAt === null ? Infinity : Math.max(0, t - scene.scaredAt);
  if (since < CAT_RUN) {
    const from = 340 + (hx - 340) * scene.flyFrom; // where it was: home, or on its way back
    return { pose: 'run', frame: frameOf(since * 10, 2), x: Math.round(from + (340 - from) * (since / CAT_RUN) ** 1.5), y: hy, dir: 1 };
  }
  const back = since - PARK.pigeonsAway * scene.bar;
  if (back < 0) return null;
  if (back < CAT_WALK) return { pose: 'walk', frame: frameOf(time * 4, 2), x: Math.round(340 + (hx - 340) * (back / CAT_WALK)), y: hy, dir: -1 };
  return { pose: 'sleep', frame: frameOf(time / CAT_BREATH, 2), x: hx, y: hy, dir: -1 };
}

// One Tree Island. Its sky's stage for each band at `bar`, as the park's (skyStages) but horizon first:
// the sunrise lightens from the horizon up, from before dawn (0) to morning (4).
export const sunriseStages = (bar) => skyStages(bar).reverse();

// How far the sun has come up, in pixels, `bars` (a fraction is fine) into the set: still behind the
// far pines until ISLAND.sunFrom, then rising to ISLAND.sunRise by ISLAND.sunTo.
export function sunUp(bars) {
  const k = (bars - ISLAND.sunFrom) / (ISLAND.sunTo - ISLAND.sunFrom);
  return Math.round(ISLAND.sunRise * Math.min(1, Math.max(0, k)));
}

// How many of the mist's streaks are still on the water at `bars`: all ISLAND.mist of them at the
// start, one fewer at a time, none from ISLAND.mistGone.
export const mistLeft = (bars) => Math.max(0, ISLAND.mist - Math.floor((Math.max(0, bars) / ISLAND.mistGone) * ISLAND.mist));

// The island's fish at set time t: null while it's under, or jumping out of the water at a loud note
// (the pigeons' scaredAt), { pose: 'jump', frame (0 going up, 1 coming down), x, y }, then its splash,
// { pose: 'splash', frame, x, y }. It jumps from ISLAND.fish.
export function fishAt(scene, t) {
  if (scene.scaredAt === null) return null;
  const since = t - scene.scaredAt, [x, y] = ISLAND.fish;
  if (since < 0) return null;
  if (since < FISH_JUMP) {
    const k = since / FISH_JUMP;
    return { pose: 'jump', frame: k < 0.5 ? 0 : 1, x: Math.round(x + FISH_ON * k), y: Math.round(y - FISH_HIGH * 4 * k * (1 - k)) };
  }
  if (since < FISH_JUMP + SPLASH) return { pose: 'splash', frame: since < FISH_JUMP + SPLASH / 2 ? 0 : 1, x: x + FISH_ON, y };
  return null;
}

// The keepsake an animal left, at set time t: null if none, or { id, x, y, landed, sparkle }: dropping
// from above into the case (CASE), then lying there, its sparkle on frame 0 or 1 by the page's `time`.
export function giftAt(scene, t, time) {
  if (!scene.gift) return null;
  const k = Math.min(1, Math.max(0, (t - scene.gift.t) / GIFT_FALL));
  return { id: scene.gift.id, x: CASE[0], y: Math.round(CASE[1] - GIFT_FROM * (1 - k * k)), landed: k === 1, sparkle: frameOf(time / SPARKLE, 2) };
}

export { TRAIL_LIFE, LOOP_TRAIL_LIFE, FLIGHT, GOLD, TRAIN_LENGTH, PIGEON_FLY, PIGEON_WALK, CAT_RUN, CAT_WALK, FISH_JUMP, SPLASH, GIFT_FALL };
