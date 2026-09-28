// One set: the ears (listen.js) and the crowd (crowd.js) joined up, the band's layers chosen by the
// crowd's size, the coins, and the ending. Pure: given a seed and the notes played (times in seconds
// from the first note), a set replays exactly, in Node or in the browser.
//
// set.events holds this update's news for the screen and the sound, as plain objects:
//   { type: 'rule', rule, ... }         something the ears noticed (see listen.js)
//   { type: 'coin', person, coins, why } a coin lands in the case ('callback', 'happy' or 'end')
//   { type: 'hooked', person }  { type: 'left', person, happy }
//   { type: 'layers', bar, layers }     the layers playing from bar `bar` on (decided just before it)
//   { type: 'end' }                     bar 60 is over: fade the band, clap
//   { type: 'over' }                    the end card
import { createListener, noteOn, noteOff, tick } from './listen.js';
import { createCrowd, hear, stepCrowd, crowdSize, endTips } from './crowd.js';
import { BAR } from './groove.js';
import { GROOVE, LAYERS, LAYER_HOLD, DT } from './tuning.js';

export function createSet(seed) {
  return {
    seed,
    t: 0,
    phase: 'playing', // then 'ending' (the fade and the applause), then 'over'
    listen: createListener(),
    crowd: createCrowd(seed),
    coins: 0,
    layers: Object.fromEntries(LAYERS.map((l) => [l.id, l.min === 0])),
    below: Object.fromEntries(LAYERS.map((l) => [l.id, 0])), // whole bars the crowd has stayed below each layer's number
    most: 0, // the biggest the crowd has been since the last layer decision
    decided: 0, // the last bar whose layers are decided
    overAt: Infinity,
    events: [],
  };
}

export const endTime = () => GROOVE.setBars * BAR;

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
  while (set.phase === 'playing' && t >= (set.decided + 1) * BAR - GROOVE.layerLead && set.decided + 1 < GROOVE.setBars) {
    set.decided++;
    decideLayers(set, set.decided);
  }
  if (set.phase === 'playing' && t >= endTime()) {
    set.phase = 'ending';
    c.open = false;
    endTips(c);
    set.overAt = t + BAR + GROOVE.applause; // a bar's fade, then applause
    set.events.push({ type: 'end' });
  } else if (set.phase === 'ending' && t >= set.overAt) {
    set.phase = 'over';
    set.events.push({ type: 'over' });
  }
  for (const e of c.out) {
    if (e.type === 'coin') set.coins += e.coins;
    set.events.push(e);
  }
  c.out.length = 0;
}

// What the end card shows.
export function summary(set) {
  return { coins: set.coins, stopped: set.crowd.stoppedEver, longest: set.crowd.longest };
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
export function runSet(seed, notes) {
  const set = createSet(seed);
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
