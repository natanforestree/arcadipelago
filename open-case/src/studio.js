// The studio (a shop item): where you make beats to busk to, the way Figure makes them. The open beat
// plays round and round; you pick a part (a tab) and a rhythm on the wheel, and hold the pad: the
// rhythm plays, and is written into the part as the playhead passes, replacing what was there. Also
// here: erasing and clearing, undo, the song's settings, the sounds and the mix, your six slots, and
// the beat your sets play. Pure, so it's tested in Node; main.js runs it, audio.js plays the open beat
// and studioview.js draws it.
//
// Times are band time: seconds since the band's first 16th, on the open beat's clock. 16ths count
// from the band's first too, round and round the beat.
import { READY, readyBeat, cloneBeat, blankBeat, cleanBeat, clockOf, notesOf, SOUNDS, MOODS } from './beats.js';
import { RHYTHMS, hitAt } from './rhythms.js';
import { STUDIO } from './tuning.js';

const KEY = 'open-case-beats';
export const PARTS = ['drums', 'bass', 'chords'];
export const TABS = [...PARTS, 'mix'];
export const DRUMS = ['kick', 'snare', 'hats', 'perc']; // the drum pad's strips, top to bottom
export const COLUMNS = 8; // the bass and chord pads' columns, left to right
export const LENGTHS = [1, 2, 4];

// Your beats, from storage: { slots: [a beat or null, for each of STUDIO.slots], chosen: { ready: id }
// or { slot }: the beat your sets play, or null for the lo-fi }. Anything unreadable is left out.
export function loadBeats(storage) {
  let raw = null;
  try {
    raw = JSON.parse(storage.get(KEY) ?? 'null');
  } catch {
    raw = null;
  }
  const slots = Array.from({ length: STUDIO.slots }, (_, i) => cleanBeat(raw?.slots?.[i]));
  const c = raw?.chosen;
  const chosen = c && (readyBeat(c.ready) ? { ready: c.ready } : Number.isInteger(c.slot) && slots[c.slot] ? { slot: c.slot } : null);
  return { slots, chosen: chosen || null };
}

export const saveBeats = (storage, beats) => storage.set(KEY, JSON.stringify(beats));

// The beat your sets play: the chosen one, if it's still there, and otherwise the lo-fi.
export function chosenBeat(beats) {
  const c = beats.chosen;
  return (c?.ready && readyBeat(c.ready)) || (c && beats.slots[c.slot]) || READY[0];
}

// A studio over your beats (loadBeats), with the beat your sets play open.
export function createStudio(beats) {
  const studio = {
    beats,
    open: null, // where the open beat is: { ready: id } or { slot }
    beat: null, // the open beat: a ready-made one itself, until a change copies it into a slot
    version: 0, // goes up with every change to the open beat, or opening another
    tab: 'drums',
    rhythm: { drums: 3, bass: 5, chords: 5 }, // each part's rhythm on the wheel
    range: 0, // the bass pad's octave: -1, 0 or 1
    held: null, // the pad held: { part, row, x } on the drums or { part, col, y }, and next, the first 16th still to write
    erase: false, // Erase (or Backspace) is down
    undo: [], // the open beat as it was before each change, the latest last
    asking: null, // every slot is full: { make: 'copy' | 'new' } until you pick one to replace
    list: false, // the list of beats is open over the pad
  };
  openBeat(studio, beats.chosen ?? { ready: READY[0].id });
  return studio;
}

// Opens a ready-made beat ({ ready: id }) or one of yours ({ slot }). Undo starts afresh.
export function openBeat(studio, which) {
  const beat = which.ready ? readyBeat(which.ready) : studio.beats.slots[which.slot];
  if (!beat) return;
  studio.open = which.ready ? { ready: which.ready } : { slot: which.slot };
  studio.beat = beat;
  studio.undo = [];
  studio.held = null;
  studio.list = false;
  studio.version++;
}

// The name for a copy of a beat called `name`: the name with the first number from 2 that none of
// your slots has ("Funk 2", then "Funk 3"), or for a blank beat, "Beat" and the first number from 1.
function freeName(slots, name, from) {
  let n = from;
  while (slots.some((b) => b?.name === `${name} ${n}`)) n++;
  return `${name} ${n}`;
}

// Puts `beat` into slot i and opens it there. The chosen beat, if it was that slot, follows it.
function keep(studio, i, beat) {
  studio.beats.slots[i] = beat;
  openBeat(studio, { slot: i });
}

// A copy of the open ready-made beat, as it is, named among `slots` (your slots, less any being
// replaced).
const copyOf = (studio, slots = studio.beats.slots) => ({ ...cloneBeat(studio.beat), name: freeName(slots, studio.beat.name, 2) });

// Before a change: a ready-made beat is first copied into your first empty slot (the original never
// changes), and the open beat as it is goes on the undo list. With every slot full, the studio asks
// which to replace instead, and nothing changes: false.
function begin(studio) {
  if (studio.beat.ready) {
    const i = studio.beats.slots.indexOf(null);
    if (i < 0) {
      studio.asking = { make: 'copy' };
      return false;
    }
    keep(studio, i, copyOf(studio));
  }
  studio.undo.push(cloneBeat(studio.beat));
  if (studio.undo.length > STUDIO.undo) studio.undo.shift();
  return true;
}

// Changes the open beat with fn(beat), once begin() allows it. `again` continues a change already
// begun (the rest of a drag), so it undoes as one. Returns whether it changed.
function edit(studio, fn, again = false) {
  if (!again && !begin(studio)) return false;
  fn(studio.beat);
  studio.version++;
  return true;
}

// New: a blank beat in your first empty slot, or with every slot full, asking which to replace.
export function newBeat(studio) {
  const i = studio.beats.slots.indexOf(null);
  if (i < 0) studio.asking = { make: 'new' };
  else keep(studio, i, blankBeat(freeName(studio.beats.slots, 'Beat', 1)));
}

// With every slot full: slot i is replaced by the copy or the new beat you were making.
export function replaceSlot(studio, i) {
  const make = studio.asking?.make;
  if (!make || i < 0 || i >= STUDIO.slots) return;
  studio.asking = null;
  const others = studio.beats.slots.map((b, k) => (k === i ? null : b));
  keep(studio, i, make === 'copy' ? copyOf(studio, others) : blankBeat(freeName(others, 'Beat', 1)));
}

// Esc while asking: nothing is made or replaced, and everything stays as it was.
export function cancelAsk(studio) {
  studio.asking = null;
}

// Busk to this: your sets play the open beat from now on.
export function buskTo(studio) {
  studio.beats.chosen = { ...studio.open };
}

export const isChosen = (studio, which) => {
  const c = studio.beats.chosen ?? { ready: READY[0].id };
  return which.ready ? c.ready === which.ready : c.slot === which.slot;
};

export function setTab(studio, tab) {
  if (TABS.includes(tab)) studio.tab = tab;
  studio.held = null;
}

// Tab: the next part (after Mix, back to the drums).
export const nextTab = (studio) => setTab(studio, TABS[(TABS.indexOf(studio.tab) + 1) % TABS.length]);

// The wheel: the part's rhythm, dir steps on (round and round the 16).
export function turnRhythm(studio, dir) {
  const part = studio.tab;
  if (!PARTS.includes(part)) return;
  const n = RHYTHMS[part].length;
  studio.rhythm[part] = (((studio.rhythm[part] + dir) % n) + n) % n;
}

export const rhythmOf = (studio, part = studio.tab) => RHYTHMS[part][studio.rhythm[part]];

// Range: the bass pad an octave up (1) or down (-1), from -1 to 1.
export function moveRange(studio, dir) {
  studio.range = Math.max(-1, Math.min(1, studio.range + dir));
}

// Sound: the part's next sound (dir 1) or the one before (-1).
export function nextSound(studio, dir = 1) {
  const part = studio.tab;
  if (!PARTS.includes(part)) return;
  const ids = Object.keys(SOUNDS[part]), i = ids.indexOf(studio.beat.sounds[part]);
  edit(studio, (b) => {
    b.sounds[part] = ids[(((i + dir) % ids.length) + ids.length) % ids.length];
  });
}

// The song's settings. A drag calls these over and over: `again` for all but the first, so the whole
// drag undoes as one change.
export function setTempo(studio, bpm, again = false) {
  const v = Math.max(60, Math.min(140, Math.round(bpm)));
  if (v !== studio.beat.bpm) edit(studio, (b) => (b.bpm = v), again);
}
export function setSwing(studio, swing, again = false) {
  const v = Math.max(0.5, Math.min(0.75, Math.round(swing * 100) / 100));
  if (v !== studio.beat.swing) edit(studio, (b) => (b.swing = v), again);
}
// A new key: every note keeps its place in the key, so it moves with it; a chord spelled out note by
// note is stacked afresh in the new key.
export function setMood(studio, mood, again = false) {
  if (!MOODS.some((m) => m.id === mood) || mood === studio.beat.mood) return;
  edit(studio, (b) => {
    b.mood = mood;
    for (const h of b.chords) {
      delete h.notes;
      delete h.name;
    }
  }, again);
}
// A shorter loop keeps its first bars; a longer one repeats what's there, so it sounds the same until
// you change it.
export function setLength(studio, bars, again = false) {
  const was = studio.beat.bars;
  if (!LENGTHS.includes(bars) || bars === was) return;
  edit(studio, (b) => {
    for (const part of PARTS) {
      const kept = b[part].filter((h) => h.s < bars * 16);
      const copies = [];
      for (let k = 1; k * was < bars; k++) for (const h of kept) copies.push({ ...h, s: h.s + k * was * 16 });
      b[part] = [...kept, ...copies].sort((x, y) => x.s - y.s);
    }
    b.bars = bars;
  }, again);
}

// The Mix tab: each part's level (0 to 1) and mute, the Pump (0 to 1), and the Pad and Vinyl.
export function setLevel(studio, part, level, again = false) {
  const v = Math.max(0, Math.min(1, Math.round(level * 100) / 100));
  if (v !== studio.beat.mix.levels[part]) edit(studio, (b) => (b.mix.levels[part] = v), again);
}
export const toggleMute = (studio, part) => edit(studio, (b) => (b.mix.muted[part] = !b.mix.muted[part]));
export function setPump(studio, pump, again = false) {
  const v = Math.max(0, Math.min(1, Math.round(pump * 100) / 100));
  if (v !== studio.beat.mix.pump) edit(studio, (b) => (b.mix.pump = v), again);
}
export const togglePad = (studio) => edit(studio, (b) => (b.mix.pad = !b.mix.pad));
export const toggleVinyl = (studio) => edit(studio, (b) => (b.mix.vinyl = !b.mix.vinyl));

// Clear: the part you're on, emptied.
export function clearPart(studio) {
  const part = studio.tab;
  if (PARTS.includes(part) && studio.beat[part].length) edit(studio, (b) => (b[part] = []));
}

// Undo: the open beat as it was before your last change.
export function undoChange(studio) {
  const was = studio.undo.pop();
  if (!was) return;
  studio.beat = was;
  studio.beats.slots[studio.open.slot] = was;
  studio.held = null;
  studio.version++;
}

// The 16th just at or before band time t on `clock`.
function sixteenthBefore(clock, t) {
  const s = clock.sixteenthAt(t);
  return clock.timeOf16th(s) <= t ? s : s - 1;
}

// You hold the pad at band time t: `at` is where, { row, x } on the drums (row 0 the kick to 3 the
// percussion; x from 0, softer, to 1) or { col, y } on the bass and chords (col 0 to 7; y from 0, darker,
// to 1). Writing starts at the next 16th, or at the one just gone if it went less than STUDIO.grace
// ago. False when there's no pad to hold (the Mix tab, or a slot must be picked first).
export function press(studio, t, at) {
  const part = studio.tab;
  if (!PARTS.includes(part) || studio.asking || studio.list || !begin(studio)) return false;
  const clock = clockOf(studio.beat), s = sixteenthBefore(clock, t);
  studio.held = { part, ...at, next: t - clock.timeOf16th(s) <= STUDIO.grace ? s : s + 1 };
  studio.version++;
  return true;
}

// Your finger moves while it holds: the next 16th on is written where it is now.
export function moveTo(studio, at) {
  if (studio.held) Object.assign(studio.held, at);
}

// You let go: nothing more is written.
export function letGo(studio) {
  studio.held = null;
}

// Erase (or Backspace) goes down or up.
export function setErase(studio, on) {
  studio.erase = on;
}

// Time runs on to band time t while you hold: every 16th from the next one still to write up to
// STUDIO.ahead past t is written (the part's notes there replaced by the rhythm's hit, if it has one
// there), or with Erase down, emptied. Returns what was written for the sound, [{ layer, notes, s }]
// (s: the band's 16th), so the notes on 16ths the band has already scheduled are still heard.
export function advance(studio, t) {
  const h = studio.held;
  if (!h) return [];
  const clock = clockOf(studio.beat), out = [], from = h.next;
  while (clock.timeOf16th(h.next) <= t + STUDIO.ahead) {
    const played = paint(studio, h, h.next);
    if (played?.notes.length) out.push({ ...played, s: h.next });
    h.next++;
  }
  if (h.next !== from) studio.version++; // written or erased: either way, the beat has changed
  return out;
}

// Writes the band's 16th k with the held pad, as advance does.
function paint(studio, h, k) {
  const beat = studio.beat, part = h.part, end = beat.bars * 16, pos = ((k % end) + end) % end;
  const drum = part === 'drums' ? DRUMS[h.row] : null;
  beat[part] = beat[part].filter((x) => !(x.s === pos && (!drum || x.drum === drum)));
  if (studio.erase) return null;
  const len = hitAt(rhythmOf(studio, part), pos % 16);
  if (!len) return null;
  let hit;
  if (drum) hit = { s: pos, drum, vel: Math.round((STUDIO.softest + (1 - STUDIO.softest) * h.x) * 100) / 100 };
  else {
    // One note of the bass, or one chord, at a time: one still sounding stops where this starts.
    for (const x of beat[part]) if (x.s < pos && x.s + x.len > pos) x.len = pos - x.s;
    const degree = part === 'bass' ? h.col + 7 * studio.range : h.col;
    hit = { s: pos, degree, len: Math.min(len, end - pos), vel: STUDIO.vel[part], tone: Math.round(h.y * 100) / 100 };
  }
  beat[part].push(hit);
  beat[part].sort((a, b) => a.s - b.s);
  return notesOf(beat, part, hit);
}
