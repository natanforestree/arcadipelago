// Players that aren't Nathan, all deterministic from a seed. Each returns a whole set's notes,
// [{ t, pitch, strength, len }] in seconds from the first note, for runSet() or for the browser to play.
//   randomBot: random keys from the whole row, 1 to 3 notes a beat. The too-random side.
//   lickBot:   one 4-note lick over and over, a beat's rest between. The too-repetitive side.
//   goodSet:   the scripted honest set for the headline test: ideas in the key, answered, and brought
//              back changed (moved to another note, or re-timed) 8 or more bars later.
//   wanderSet: in key and in varied phrases, but never bringing an idea back. The tests keep it
//              between the honest set and the random bot.
import { createRng, nextRandom } from './rng.js';
import { timeOf16th } from './groove.js';
import { GROOVE } from './tuning.js';

const SET_16THS = GROOVE.setBars * 16;
const pick = (rng, list) => list[Math.floor(nextRandom(rng) * list.length)];
const int = (rng, lo, hi) => lo + Math.floor(nextRandom(rng) * (hi - lo + 1));
function shuffle(rng, list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom(rng) * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

// A note from 16th s lasting len 16ths (released a hair early, so a rest of exactly a beat still ends
// a phrase).
function note(s, len, pitch, strength = 3) {
  const t = timeOf16th(s);
  return { t, pitch, strength, len: timeOf16th(s + len) - t - 0.01 };
}

export function randomBot(seed) {
  const rng = createRng(seed * 7919 + 1);
  const notes = [];
  for (let beat = 0; beat * 4 < SET_16THS; beat++) {
    if (nextRandom(rng) < 0.15) continue; // an occasional rest
    const count = int(rng, 1, 3);
    const slots = shuffle(rng, [0, 1, 2, 3]).slice(0, count).sort((a, b) => a - b);
    for (const k of slots) notes.push(note(beat * 4 + k, int(rng, 1, 4), 60 + int(rng, 0, 17)));
  }
  if (notes.length) notes[0] = { ...notes[0], t: 0 }; // the first note starts the set
  return notes;
}

const PENTA = [55, 57, 60, 62, 64, 67, 69, 72, 74, 76, 79, 81]; // C major pentatonic, G3 to A5

export function lickBot(seed) {
  const rng = createRng(seed * 104729 + 2);
  let i = int(rng, 3, 7);
  const lick = [PENTA[i]];
  for (let k = 0; k < 3; k++) {
    i = Math.max(0, Math.min(PENTA.length - 1, i + pick(rng, [-2, -1, 1, 2])));
    lick.push(PENTA[i]);
  }
  const notes = [];
  // The lick on 8ths (2 beats), then a beat's rest: every 3 beats.
  for (let s = 0; s + 8 <= SET_16THS; s += 12) lick.forEach((p, k) => notes.push(note(s + k * 2, 2, p)));
  return notes;
}

const SCALE = [55, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83, 84]; // C major, G3 to C6
const RHYTHMS = [[2, 2, 2], [1, 1, 2], [2, 1, 1], [3, 1, 2], [1, 2, 1], [2, 2, 4], [1, 1, 1], [3, 3, 2]];

// A new idea: a 4-note opening on the pentatonic scale with its own rhythm, whose steps differ from
// every idea already made.
function newIdea(rng, ideas) {
  for (;;) {
    let i = int(rng, 3, 7);
    const pitches = [PENTA[i]];
    for (let k = 0; k < 3; k++) {
      i = Math.max(0, Math.min(PENTA.length - 1, i + pick(rng, [-2, -1, 1, 2, 3])));
      pitches.push(PENTA[i]);
    }
    const steps = [1, 2, 3].map((k) => pitches[k] - pitches[k - 1]).join();
    if (!ideas.some((o) => o.steps === steps)) return { pitches, gaps: pick(rng, RHYTHMS), steps, bar: -99, calledBar: -99 };
  }
}

// The same idea moved to start on another note, a fourth or a fifth away, which keeps its steps and
// keeps it in the key (the pentatonic scale moved a fourth or fifth is still inside C major).
function moved(rng, idea) {
  const shifts = [5, 7, -5, -7].filter((d) => idea.pitches.every((p) => p + d >= 55 && p + d <= 84));
  const d = shifts.length ? pick(rng, shifts) : 0;
  return d ? idea.pitches.map((p) => p + d) : null;
}

export function goodSet(seed) {
  const rng = createRng(seed * 15485863 + 3);
  const notes = [];
  const ideas = [];
  let s = 0, phrase = 0;
  while (s < SET_16THS - 16) {
    const bar = Math.floor(s / 16);
    // Choose the opening: bring back an old idea changed, answer the last one, or say something new.
    const old = ideas.findLast((o) => bar - o.bar >= 9 && bar - o.calledBar >= 17);
    let pitches, gaps;
    if (old && phrase % 2 === 0) {
      const m = nextRandom(rng) < 0.5 ? moved(rng, old) : null;
      pitches = m ?? old.pitches;
      gaps = m ? old.gaps : pick(rng, RHYTHMS.filter((r) => r.join() !== old.gaps.join()));
      old.bar = bar;
      old.calledBar = bar;
    } else if (ideas.length && phrase % 3 === 1) {
      const last = ideas[ideas.length - 1]; // an answer: the same opening again, then somewhere new
      pitches = last.pitches;
      gaps = last.gaps;
      last.bar = bar;
    } else {
      const idea = newIdea(rng, ideas);
      idea.bar = bar;
      ideas.push(idea);
      pitches = idea.pitches;
      gaps = idea.gaps;
    }
    // The opening, then a tail that wanders the scale in varied rhythms and ends on a long note.
    const strength = pick(rng, [2, 3, 3]);
    let at = s;
    pitches.forEach((p, k) => {
      notes.push(note(at, k < 3 ? gaps[k] : 2, p, strength));
      if (k < 3) at += gaps[k];
    });
    let deg = SCALE.indexOf(pitches[3]);
    if (deg < 0) deg = SCALE.findIndex((p) => p >= pitches[3]);
    const tail = int(rng, 2, 6);
    const dense = nextRandom(rng) < 0.4; // some phrases are quick runs
    for (let k = 0; k < tail; k++) {
      const gap = dense ? pick(rng, [1, 1, 2]) : pick(rng, [1, 2, 2, 3, 4]);
      at += gap;
      deg = Math.max(0, Math.min(SCALE.length - 1, deg + pick(rng, [-2, -1, -1, 1, 1, 2, 3])));
      const last = k === tail - 1;
      notes.push(note(at, last ? int(rng, 3, 6) : gap, SCALE[deg], strength));
    }
    const end = at + 6;
    s = end + int(rng, 5, 10); // a rest of more than a beat after the last note ends
    phrase++;
  }
  if (notes.length) notes[0] = { ...notes[0], t: 0 };
  return notes.filter((n) => n.t < timeOf16th(SET_16THS));
}

// Phrases of 5 to 9 notes wandering the scale in varied rhythms, a rest after each; no idea returns.
export function wanderSet(seed) {
  const rng = createRng(seed * 31 + 5);
  const notes = [];
  let s = 0;
  while (s < SET_16THS - 16) {
    let deg = int(rng, 5, 12);
    const count = int(rng, 5, 9);
    for (let k = 0; k < count; k++) {
      const gap = pick(rng, [1, 2, 2, 3, 4]);
      notes.push(note(s, gap, SCALE[deg]));
      s += gap;
      deg = Math.max(0, Math.min(SCALE.length - 1, deg + pick(rng, [-2, -1, -1, 1, 1, 2])));
    }
    s += int(rng, 5, 10);
  }
  if (notes.length) notes[0] = { ...notes[0], t: 0 };
  return notes.filter((n) => n.t < timeOf16th(SET_16THS));
}
