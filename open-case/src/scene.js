// What's on screen besides the set itself, as plain data updated from what happens: the note trail,
// coins flying into the case, and the gold link of a callback. Pure, so it's tested in Node; render.js
// draws it. Times are seconds on the set's clock.
export const GUITAR = [152, 128]; // where notes float up from
export const CASE = [161, 160]; // where coins land
const TRAIL_LIFE = 6; // seconds a note's glyph lasts (2 bars)
const FLIGHT = 0.7; // seconds a coin takes to reach the case
const GOLD = 2; // seconds the callback's gold link shows

export function createScene() {
  return { trail: [], flights: [], caseCoins: 0, gold: null, clapFrom: -1 };
}

// A note you played: index is its place in the ears' note list (for its echo).
export function sceneNote(scene, pitch, index, t) {
  scene.trail.push({ pitch, index, t });
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

export { TRAIL_LIFE, FLIGHT, GOLD };
