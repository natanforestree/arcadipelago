// Shared test helpers.
import { timeOf16th } from '../src/groove.js';
import { noteOn, noteOff, tick } from '../src/listen.js';
import { stepCrowd } from '../src/crowd.js';
import { DT, CROWD } from '../src/tuning.js';

// Plays notes into a listener, in time order: each is [16th, pitch, length in 16ths = 1, strength = 3].
// A key goes up a hair before its length is up, so a rest of exactly a beat ends a phrase.
export function play(l, notes) {
  const moments = [];
  for (const [s, pitch, len = 1, strength = 3] of notes) {
    moments.push({ t: timeOf16th(s), pitch, strength });
    moments.push({ t: timeOf16th(s + len) - 0.01 });
  }
  moments.sort((a, b) => a.t - b.t || (a.pitch ? 1 : 0) - (b.pitch ? 1 : 0));
  for (const m of moments) {
    tick(l, m.t);
    if (m.pitch) noteOn(l, m.pitch, m.t, m.strength);
    else noteOff(l, m.t);
  }
}

// Time runs on to 16th s.
export const wait = (l, s) => tick(l, timeOf16th(s));

// The events heard since last asked, leaving out the bar lines.
export const heard = (l) => l.events.splice(0).filter((e) => e.rule !== 'bar');
export const names = (events) => events.map((e) => e.rule);

// A 4-note opening from 16th s: pitches, and the gaps between them in 16ths.
export function opening(s, [a, b, c, d], [g1, g2, g3] = [2, 2, 2]) {
  return [[s, a, g1], [s + g1, b, g2], [s + g1 + g2, c, g3], [s + g1 + g2 + g3, d, 2]];
}

// Runs a crowd for `seconds` from time `t`, calling each(t) after every update. Returns the new time.
export function runCrowd(c, t, seconds, each = () => {}) {
  const n = Math.round(seconds / DT);
  for (let i = 0; i < n; i++) {
    t += DT;
    stepCrowd(c, DT, t);
    each(t);
  }
  return t;
}

// A listener standing in the crowd at spot `spot` (the kind's look 0 unless `over` says), for tests
// that need one without hooking them.
export function stoodAt(c, kind, spot, over = {}) {
  const [x, y] = CROWD.spots[spot];
  const p = {
    id: c.nextId++, kind, look: 0, dir: 1, x, y, state: 'stopped', listening: false, heard: 0, walkedOn: true,
    interest: 0.9, budget: 999, stayed: 0, spot, lastRule: '', reaction: null, done: false, arrivedAt: 0, ...over,
  };
  c.people.push(p);
  return p;
}
