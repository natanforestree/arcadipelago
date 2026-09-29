// GarageBand's Musical Typing layout. Keys are named by their physical position (KeyboardEvent.code),
// so the layout is the same on any keyboard. At octave 0, A is C4 (MIDI 60). Keys 2 to 6 stomp your
// pedals, R and Backspace work the loop pedal, and in the shop the arrow keys and Enter choose and buy.
//
//   W E   T Y U   O P        C# D#   F# G# A#   C# D#
//  A S D F G H J K L ; '     C  D  E  F  G  A  B  C  D  E  F
import { PLAY, SHOP } from './tuning.js';

// Each note key's semitones above the A key.
export const NOTE_KEYS = {
  KeyA: 0, KeyW: 1, KeyS: 2, KeyE: 3, KeyD: 4, KeyF: 5, KeyT: 6, KeyG: 7, KeyY: 8,
  KeyH: 9, KeyU: 10, KeyJ: 11, KeyK: 12, KeyO: 13, KeyL: 14, KeyP: 15, Semicolon: 16, Quote: 17,
};

export const CONTROL_KEYS = {
  KeyZ: 'octaveDown', KeyX: 'octaveUp', KeyC: 'softer', KeyV: 'louder',
  Space: 'ring', Digit1: 'lock', KeyM: 'mute', Escape: 'pause', KeyR: 'loop', Backspace: 'undo',
};

// Each pedal's key, which never changes: Digit2 overdrive to Digit6 reverb (tuning.js SHOP).
export const PEDAL_KEYS = Object.fromEntries(
  Object.entries(SHOP).filter(([, item]) => item.key).map(([id, item]) => [`Digit${item.key}`, id]),
);

// The shop's keys (Esc, the pause key, leaves it).
export const SHOP_KEYS = { ArrowLeft: 'left', ArrowRight: 'right', Enter: 'enter', NumpadEnter: 'enter' };

// What a key does in the shop: 'left', 'right' or 'enter'; null for a held Enter repeating (it buys
// once), while a held arrow moves on along the stock; undefined for any other key.
export function shopKey(code, repeat) {
  const what = SHOP_KEYS[code];
  return what === 'enter' && repeat ? null : what;
}

const PENTATONIC = [0, 2, 4, 7, 9]; // C D E G A

export function createKeyState() {
  return { octave: 0, strength: PLAY.strengthStart, lock: false };
}

// The nearest C major pentatonic note at or below `pitch`.
export function toPentatonic(pitch) {
  let p = pitch;
  while (!PENTATONIC.includes(((p % 12) + 12) % 12)) p--;
  return p;
}

// The MIDI note a key plays, or null: not a note key, or outside the guitar's range.
export function noteFor(code, ks) {
  const semis = NOTE_KEYS[code];
  if (semis === undefined) return null;
  let pitch = 60 + 12 * ks.octave + semis;
  if (ks.lock) pitch = toPentatonic(pitch);
  return pitch >= PLAY.lowest && pitch <= PLAY.highest ? pitch : null;
}

// Applies a control key's action to the key state. Returns true if the state changed. (Ring, mute,
// pause, loop and undo belong to the caller; they don't change the key state.)
export function applyControl(ks, action) {
  const before = `${ks.octave},${ks.strength},${ks.lock}`;
  if (action === 'octaveDown') ks.octave = Math.max(PLAY.octaveMin, ks.octave - 1);
  else if (action === 'octaveUp') ks.octave = Math.min(PLAY.octaveMax, ks.octave + 1);
  else if (action === 'softer') ks.strength = Math.max(PLAY.strengthMin, ks.strength - 1);
  else if (action === 'louder') ks.strength = Math.min(PLAY.strengthMax, ks.strength + 1);
  else if (action === 'lock') ks.lock = !ks.lock;
  return before !== `${ks.octave},${ks.strength},${ks.lock}`;
}

// Every pitch the note keys play right now (to work their sounds out ahead of time).
export function layoutPitches(ks) {
  return Object.keys(NOTE_KEYS).map((code) => noteFor(code, ks)).filter((p) => p !== null);
}
