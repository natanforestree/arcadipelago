// The loop as data: its tempo and swing, the chords, what's in key, where each 16th falls, and each
// layer's pattern. audio.js turns the patterns into sound; the crowd's rules use the timing.
//
// Chill lo-fi hip hop at 80 bpm with a lazy 16th swing, over four bars of Dm9, G13, Cmaj9, Am9
// (ii-V-I-vi in C major). Time is counted in 16ths from the set's first note: 16th s is in bar
// floor(s / 16), and it's a strong beat when s % 4 === 0.
import { GROOVE } from './tuning.js';

export const BEAT = 60 / GROOVE.bpm; // seconds
export const BAR = BEAT * 4;

// Each 16th's place in its beat, in beats: the second of each pair is pushed late by the swing.
const GRID = [0, GROOVE.swing / 2, 0.5, 0.5 + GROOVE.swing / 2, 1];

// When 16th s sounds, in seconds from the set's start.
export function timeOf16th(s) {
  const beat = Math.floor(s / 4);
  return (beat + GRID[s - beat * 4]) * BEAT;
}

// The nearest (swung) 16th to t seconds from the set's start.
export function sixteenthAt(t) {
  const beats = Math.max(0, t) / BEAT;
  const beat = Math.floor(beats), f = beats - beat;
  let best = 0;
  for (let k = 1; k < GRID.length; k++) if (Math.abs(f - GRID[k]) < Math.abs(f - GRID[best])) best = k;
  return beat * 4 + best;
}

const KEY = new Set([0, 2, 4, 5, 7, 9, 11]); // C major
export const inKey = (pitch) => KEY.has(((pitch % 12) + 12) % 12);
export const isStrong = (s) => s % 4 === 0;
export const isOff16th = (s) => s % 2 === 1;

// The chords, one a bar: MIDI notes for the electric piano, and the bass's root.
export const CHORDS = [
  { name: 'Dm9', keys: [50, 53, 57, 60, 64], root: 38 },
  { name: 'G13', keys: [43, 53, 57, 59, 64], root: 43 },
  { name: 'Cmaj9', keys: [48, 52, 55, 59, 62], root: 36 },
  { name: 'Am9', keys: [45, 55, 59, 60, 64], root: 45 },
];
export const chordAt = (bar) => CHORDS[((bar % CHORDS.length) + CHORDS.length) % CHORDS.length];

// The in-key note just below the next bar's root, for the bass to walk into it.
const APPROACH = { 38: 36, 43: 41, 36: 35, 45: 43 };

// The notes a layer starts on 16th s: [{ voice, note, vel (0..1), len (16ths) }]. Drums use note 0.
// Every layer is a slot: later, a slot can hold an audio stem instead of these patterns.
export function bandAt(layer, s) {
  const bar = Math.floor(s / 16), k = s - bar * 16;
  const chord = chordAt(bar);
  switch (layer) {
    case 'keys':
      if (k === 0) return chord.keys.map((note) => ({ voice: 'ep', note, vel: 0.5, len: 9 }));
      if (k === 10) return chord.keys.slice(1).map((note) => ({ voice: 'ep', note, vel: 0.3, len: 6 }));
      return [];
    case 'drums': {
      const out = [];
      if (k === 0 || k === 10) out.push({ voice: 'kick', note: 0, vel: k === 0 ? 1 : 0.8, len: 1 });
      if (k === 7) out.push({ voice: 'kick', note: 0, vel: 0.5, len: 1 });
      if (k === 4 || k === 12) out.push({ voice: 'snare', note: 0, vel: 0.8, len: 1 });
      if (k === 15 && bar % 2 === 1) out.push({ voice: 'snare', note: 0, vel: 0.25, len: 1 });
      return out;
    }
    case 'bass': {
      const r = chord.root;
      if (k === 0) return [{ voice: 'bass', note: r, vel: 0.9, len: 5 }];
      if (k === 7) return [{ voice: 'bass', note: r, vel: 0.6, len: 2 }];
      if (k === 10) return [{ voice: 'bass', note: r + 7, vel: 0.7, len: 3 }];
      if (k === 14) return [{ voice: 'bass', note: APPROACH[chordAt(bar + 1).root], vel: 0.5, len: 2 }];
      return [];
    }
    case 'top': {
      const out = [];
      if (k % 2 === 0) out.push({ voice: 'hat', note: 0, vel: k % 4 === 0 ? 0.35 : 0.5, len: 1 });
      else if (k % 4 === 3) out.push({ voice: 'hat', note: 0, vel: 0.15, len: 1 });
      if (k === 0) for (const note of chord.keys.slice(1)) out.push({ voice: 'pad', note: note + 12, vel: 0.2, len: 16 });
      return out;
    }
    // The metronome click (not a crowd layer: audio.js plays it whenever the drums slot is off). One
    // hit a beat, brighter on the bar's first beat; note carries the accent flag, not a pitch.
    case 'click':
      if (k % 4 !== 0) return [];
      return [{ voice: 'click', note: k === 0 ? 1 : 0, vel: k === 0 ? 0.9 : 0.55, len: 1 }];
    default:
      return [];
  }
}

export const midiToHz = (n) => 440 * Math.pow(2, (n - 69) / 12);
