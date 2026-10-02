// One set: the ears (listen.js) and the crowd (crowd.js) joined up, the band's layers chosen by the
// crowd's size, the coins, and the ending. Pure: given a seed and the notes played (times in seconds
// from the first note), a set replays exactly, in Node or in the browser.
//
// set.events holds this update's news for the screen and the sound, as plain objects:
//   { type: 'rule', rule, ... }         something the ears noticed (see listen.js)
//   { type: 'coin', person, coins, why } a coin lands in the case ('callback', 'happy' or 'end')
//   { type: 'fond', person, fondness, why } where nobody pays (One Tree Island), a tip's fondness
//   { type: 'hooked', person }  { type: 'left', person, happy }
//   { type: 'layers', bar, layers }     the layers playing from bar `bar` on (decided just before it)
//   { type: 'end' }                     the set's last bar is over: fade the band, clap
//   { type: 'keepsake', id }            just after it, on the island: an animal left you a keepsake
//   { type: 'over' }                    the end card
import { createListener, noteOn, noteOff, tick } from './listen.js';
import { createCrowd, hear, stepCrowd, crowdSize, endTips, inCrowd } from './crowd.js';
import { LOFI, clockOf, setBars } from './beats.js';
import { keepsakeFor } from './keepsakes.js';
import { createRng, nextRandom } from './rng.js';
import { GROOVE, LAYERS, LAYER_HOLD, DT } from './tuning.js';

const KEEPSAKE_SEED = 0x85ebca6b; // mixed into the set's seed for the keepsake's roll, its own stream

// A set of `beat` (beats.js) at `place` (places.js): the band plays the beat, and its tempo sets the
// set's 16ths, beats and bars (clock) and how many bars the set lasts (bars); the place sets the crowd.
// found: the keepsakes you'd found before it (keepsakes.js), which a set on the island goes by.
export function createSet(seed, beat = LOFI, place = 'park', found = []) {
  const clock = clockOf(beat);
  return {
    seed,
    beat,
    place,
    found: [...found],
    clock,
    bars: setBars(beat),
    t: 0,
    phase: 'playing', // then 'ending' (the fade and the applause), then 'over'
    listen: createListener(clock),
    crowd: createCrowd(seed, place),
    coins: 0,
    fondness: 0, // where nobody pays, the tips' fondness instead
    fans: [], // the animals won over, { animal, stayed }: each that left happy, or was still there at the end
    keepsake: null, // on the island, the keepsake left at the end, if any (its id)
    layers: Object.fromEntries(LAYERS.map((l) => [l.id, l.min === 0])),
    below: Object.fromEntries(LAYERS.map((l) => [l.id, 0])), // whole bars the crowd has stayed below each layer's number
    most: 0, // the biggest the crowd has been since the last layer decision
    decided: 0, // the last bar whose layers are decided
    overAt: Infinity,
    events: [],
  };
}

// When the set's last bar is over, in seconds from its first note.
export const endTime = (set) => set.bars * set.clock.bar;

export function playNote(set, pitch, strength, t) {
  if (set.phase === 'playing') noteOn(set.listen, pitch, t, strength);
}

export function releaseNote(set, t) {
  noteOff(set.listen, t);
}

// The layers for the bar starting at the next line: a layer joins once the crowd reaches its number,
// and drops only after the crowd has stayed below it for LAYER_HOLD whole bars.
function decideLayers(set, bar) {
  const now = crowdSize(set.crowd);
  let changed = false;
  for (const { id, min } of LAYERS) {
    if (min === 0) continue;
    if (set.layers[id]) {
      set.below[id] = set.most < min ? set.below[id] + 1 : 0;
      if (set.below[id] >= LAYER_HOLD) {
        set.layers[id] = false;
        set.below[id] = 0;
        changed = true;
      }
    } else if (now >= min) {
      set.layers[id] = true;
      changed = true;
    }
  }
  set.most = now;
  if (changed) set.events.push({ type: 'layers', bar, layers: { ...set.layers } });
}

export function stepSet(set, dt = DT) {
  set.events.length = 0;
  set.t += dt;
  const t = set.t, c = set.crowd, l = set.listen;
  if (set.phase === 'playing') tick(l, t);
  for (const e of l.events) {
    hear(c, e, t);
    set.events.push({ type: 'rule', ...e });
  }
  l.events.length = 0;
  stepCrowd(c, dt, t);
  set.most = Math.max(set.most, crowdSize(c));
  const bar = set.clock.bar;
  while (set.phase === 'playing' && t >= (set.decided + 1) * bar - GROOVE.layerLead && set.decided + 1 < set.bars) {
    set.decided++;
    decideLayers(set, set.decided);
  }
  const ending = set.phase === 'playing' && t >= endTime(set);
  if (ending) {
    set.phase = 'ending';
    c.open = false;
    endTips(c);
    for (const p of c.people) if (inCrowd(p) && p.animal) set.fans.push({ animal: p.animal, stayed: p.stayed });
    set.overAt = t + bar + GROOVE.applause; // a bar's fade, then applause
    set.events.push({ type: 'end' });
  } else if (set.phase === 'ending' && t >= set.overAt) {
    set.phase = 'over';
    set.events.push({ type: 'over' });
  }
  for (const e of c.out) {
    if (e.type === 'coin') set.coins += e.coins;
    else if (e.type === 'fond') set.fondness += e.fondness;
    else if (e.type === 'left' && e.happy && e.person.animal) set.fans.push({ animal: e.person.animal, stayed: e.person.stayed });
    set.events.push(e);
  }
  c.out.length = 0;
  if (ending && c.place.animals) leaveKeepsake(set);
}

// The end of a set on the island, its last tips counted: the keepsake, if one comes (keepsakes.js).
function leaveKeepsake(set) {
  const roll = nextRandom(createRng((set.seed ^ KEEPSAKE_SEED) >>> 0));
  const c = set.crowd;
  set.keepsake = keepsakeFor({ found: set.found, fondness: set.fondness, fans: set.fans, longest: c.longest, first: c.first, roll });
  if (set.keepsake) set.events.push({ type: 'keepsake', id: set.keepsake });
}

// What the end card shows. (fondness: where nobody pays, what the tips would have been; keepsake: the
// one an animal left, or null.)
export function summary(set) {
  return { coins: set.coins, fondness: set.fondness, stopped: set.crowd.stoppedEver, longest: set.crowd.longest, keepsake: set.keepsake };
}

// A list of notes ([{ t, pitch, strength, len }], seconds) as key moments in time order: { t, note }
// for a key going down, { t, note: null } for one going up. At the same moment, up comes first.
export function momentsOf(notes) {
  const moments = [];
  for (const n of notes) {
    moments.push({ t: n.t, note: n });
    moments.push({ t: n.t + n.len, note: null });
  }
  return moments.sort((a, b) => a.t - b.t || (a.note ? 1 : 0) - (b.note ? 1 : 0));
}

// Plays a whole set without sound or screen, as the tests and the end card's "Run the bots" do.
export function runSet(seed, notes, beat = LOFI, place = 'park', found = []) {
  const set = createSet(seed, beat, place, found);
  const moments = momentsOf(notes);
  let i = 0;
  while (set.phase !== 'over') {
    const until = set.t + DT;
    for (; i < moments.length && moments[i].t <= until; i++) {
      const m = moments[i];
      if (m.note) playNote(set, m.note.pitch, m.note.strength, m.t);
      else releaseNote(set, m.t);
    }
    stepSet(set, DT);
  }
  return set;
}
