// The studio's screen at 320x180, laid out as Figure's is but wide: the beat's name, the tabs and the
// song's settings across the top; the rhythm wheel and the buttons on the left; the big pad on the
// right (the Mix tab's faders in its place); and along the bottom, a picture of the loop, only to look
// at: bar numbers, a lane for each part showing its notes, and the playhead. The list of beats, and the
// question of which slot to replace, open over the pad. studioHit says what a click lands on;
// drawStudio draws it all with render.js's tools.
import { READY, clockOf, chordOf, bassNote, keyNote, noteLetter, padChordName, SOUNDS, BASS_C } from './beats.js';
import { PARTS, DRUMS, COLUMNS, rhythmOf, isChosen, chosenBeat } from './studio.js';
import { STUDIO } from './tuning.js';

// Where everything is, [x, y, w, h] in scene pixels.
export const NAME = [2, 2, 62, 14];
export const TAB_BOXES = { drums: [66, 3, 32, 14], bass: [100, 3, 26, 14], chords: [128, 3, 38, 14], mix: [168, 3, 22, 14] };
export const SETTINGS = { bpm: [194, 1, 28, 17], mood: [222, 1, 36, 17], swing: [258, 1, 32, 17], bars: [290, 1, 28, 17] };
export const WHEEL = [40, 50, 22]; // its middle and radius
export const BUTTONS = { sound: [4, 84, 74, 12], erase: [4, 98, 36, 12], clear: [42, 98, 36, 12], undo: [4, 112, 36, 12], range: [42, 112, 36, 12] };
export const PAD = [82, 22, 234, 108];
export const STRIP = [16, 134, 300, 44]; // the picture of the loop: its numbers row, then the lanes
const MIX_FADERS = { drums: 104, bass: 144, chords: 184, pump: 244 }; // each fader's x, 14 wide
const FADER = [38, 62]; // the faders' top and height
const MUTE_Y = 106;
const SWITCHES = { pad: [270, 40, 40, 12], vinyl: [270, 56, 40, 12] };
const LIST_ROW = 11; // the list's rows
const LANES = { drums: [144, 10], bass: [156, 9], chords: [167, 10] }; // each lane's top and height

const inside = ([x, y, w, h], px, py) => px >= x && px < x + w && py >= y && py < y + h;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const moodShort = (id) => ({ C: 'C maj', D: 'D dor', E: 'E phr', F: 'F lyd', G: 'G mix', A: 'A min' })[id];
// A beat's name cut to fit a short space (the top bar, a row of the list): 9 letters at most.
const shortName = (name) => (name.length > 9 ? `${name.slice(0, 8)}.` : name);

// The list's rows over the pad: the ready-made beats on the left, your slots on the right, and its
// buttons along the bottom.
const listBox = (i, side) => [PAD[0] + 4 + side * 116, PAD[1] + 14 + i * LIST_ROW, 110, LIST_ROW];
const LIST_BUTTONS = { new: [PAD[0] + 4, PAD[1] + 92, 40, 12], busk: [PAD[0] + 48, PAD[1] + 92, 78, 12], close: [PAD[0] + 178, PAD[1] + 92, 50, 12] };

// What a click (or a press) at scene point (x, y) lands on, as { hit, ... }, or null:
//   'replace' { slot }, 'keep'                  while asking which slot to replace
//   'open' { which }, 'new', 'busk', 'close'    in the list of beats
//   'name', 'tab' { tab }, 'setting' { which }, 'wheel' { dir }, 'button' { which }
//   'pad' { at }: { row, x } on the drums, { col, y } on the bass and chords
//   'fader' { which, value } (a part's level, or 'pump'), 'mute' { part }, 'switch' { which }
export function studioHit(studio, x, y) {
  if (studio.asking) {
    for (let i = 0; i < STUDIO.slots; i++) if (inside(listBox(i, 1), x, y)) return { hit: 'replace', slot: i };
    return inside(PAD, x, y) ? null : { hit: 'keep' };
  }
  if (studio.list) {
    for (let i = 0; i < READY.length; i++) if (inside(listBox(i, 0), x, y)) return { hit: 'open', which: { ready: READY[i].id } };
    for (let i = 0; i < STUDIO.slots; i++) if (inside(listBox(i, 1), x, y) && studio.beats.slots[i]) return { hit: 'open', which: { slot: i } };
    for (const [which, box] of Object.entries(LIST_BUTTONS)) if (inside(box, x, y)) return { hit: which };
    if (inside(PAD, x, y)) return null;
  }
  if (inside(NAME, x, y)) return { hit: 'name' };
  for (const [tab, box] of Object.entries(TAB_BOXES)) if (inside(box, x, y)) return { hit: 'tab', tab };
  for (const [which, box] of Object.entries(SETTINGS)) if (inside(box, x, y)) return { hit: 'setting', which };
  const [wx, wy, r] = WHEEL;
  if ((x - wx) ** 2 + (y - wy) ** 2 <= (r + 8) ** 2) return { hit: 'wheel', dir: y < wy ? -1 : 1 };
  for (const [which, box] of Object.entries(BUTTONS)) {
    if (inside(box, x, y) && (which !== 'range' || studio.tab === 'bass')) return { hit: 'button', which };
  }
  if (!inside(PAD, x, y)) return null;
  if (studio.tab === 'mix') return mixHit(x, y);
  return { hit: 'pad', at: padAt(studio.tab, x, y) };
}

// Where on the pad a point is, for the part: { row, x } or { col, y } (see studio.js press).
export function padAt(part, x, y) {
  const [px0, py0, w, h] = PAD, fx = clamp01((x - px0) / w), fy = clamp01((y - py0) / h);
  if (part === 'drums') return { row: Math.min(DRUMS.length - 1, Math.floor(fy * DRUMS.length)), x: Math.round(fx * 100) / 100 };
  return { col: Math.min(COLUMNS - 1, Math.floor(fx * COLUMNS)), y: Math.round((1 - fy) * 100) / 100 };
}

function mixHit(x, y) {
  for (const [which, fx] of Object.entries(MIX_FADERS)) {
    if (x >= fx - 3 && x < fx + 17 && y >= FADER[0] - 4 && y < FADER[0] + FADER[1] + 4) {
      return { hit: 'fader', which, value: Math.round(clamp01((FADER[0] + FADER[1] - y) / FADER[1]) * 100) / 100 };
    }
    if (which !== 'pump' && inside([fx, MUTE_Y, 14, 10], x, y)) return { hit: 'mute', part: which };
  }
  for (const [which, box] of Object.entries(SWITCHES)) if (inside(box, x, y)) return { hit: 'switch', which };
  return null;
}

// A fader's value at scene height y, for a drag that has wandered off the fader.
export const faderValue = (y) => Math.round(clamp01((FADER[0] + FADER[1] - y) / FADER[1]) * 100) / 100;

// Draws the studio: d is render.js's { px, text, big, C } (big: text in the 16px font); t is band time
// (for the playhead).
export function drawStudio(d, studio, t) {
  const { px, text, C } = d, beat = studio.beat, part = studio.tab;
  const tone = { drums: [C.drums, C.drumsDark], bass: [C.bass, C.bassDark], chords: [C.chords, C.chordsDark] };
  px(0, 0, 320, 180, C.night);
  // The top bar: the beat's name (click for the list), the tabs, the settings.
  px(0, 0, 320, 19, C.dusk);
  px(NAME[0], NAME[1], NAME[2], NAME[3], studio.list ? C.charcoal : C.night);
  text(shortName(beat.name), NAME[0] + 3, NAME[1] + 3, C.light);
  text('v', NAME[0] + NAME[2] - 7, NAME[1] + 3, C.grey);
  for (const [id, [x, y, w, h]] of Object.entries(TAB_BOXES)) {
    const on = id === part, colour = id === 'mix' ? [C.gold, C.goldDark] : tone[id];
    px(x, y, w, h + 2, on ? colour[0] : C.night);
    text(id, x + w / 2, y + 3, on ? C.ink : C.grey, 'center');
  }
  const values = {
    bpm: String(beat.bpm), mood: moodShort(beat.mood), swing: beat.swing === 0.5 ? 'off' : `${Math.round(beat.swing * 100)}%`, bars: String(beat.bars),
  };
  for (const [id, [x, y, w]] of Object.entries(SETTINGS)) {
    text(id === 'mood' ? 'key' : id, x + w / 2, y, C.greyDark, 'center');
    text(values[id], x + w / 2, y + 8, C.light, 'center');
  }
  if (PARTS.includes(part)) wheel(d, studio, tone[part]);
  buttons(d, studio);
  if (part === 'mix') mix(d, studio, tone);
  else pad(d, studio, tone[part]);
  strip(d, studio, t, tone);
  if (studio.list || studio.asking) list(d, studio);
}

// The rhythm wheel: the part's rhythm as marks round a ring (long for a long note), its number in the
// middle, and arrows to turn it.
function wheel({ px, big, C }, studio, [base, shadow]) {
  const [cx, cy, r] = WHEEL, rhythm = rhythmOf(studio);
  for (let a = 0; a < 64; a++) {
    const th = (a / 64) * Math.PI * 2;
    px(cx + Math.sin(th) * r, cy - Math.cos(th) * r, 1, 1, C.charcoal);
  }
  for (let k = 0; k < 16; k++) {
    const len = rhythm.find(([s]) => s === k)?.[1] ?? 0, th = (k / 16) * Math.PI * 2, sx = Math.sin(th), cy2 = -Math.cos(th);
    const reach = len > 1 ? 7 : len ? 4 : 1;
    for (let i = 0; i < reach; i++) px(cx + sx * (r - 3 + i), cy + cy2 * (r - 3 + i), 2, 2, len ? (k % 4 === 0 ? base : shadow) : C.charcoal);
  }
  big(String(studio.rhythm[studio.tab] + 1), cx, cy - 7, C.light);
  for (const [dx, dy, dir] of [[0, -r - 7, -1], [0, r + 5, 1]]) {
    for (let i = 0; i < 3; i++) px(cx + dx - i, cy + dy + (dir < 0 ? i : 2 - i), 1 + 2 * i, 1, C.grey);
  }
}

function buttons({ px, text, C }, studio) {
  const lit = { erase: studio.erase };
  for (const [id, [x, y, w, h]] of Object.entries(BUTTONS)) {
    const off = (id === 'range' && studio.tab !== 'bass') || (id !== 'undo' && studio.tab === 'mix' && id !== 'sound');
    const faded = off || (id === 'sound' && studio.tab === 'mix') || (id === 'undo' && !studio.undo.length);
    px(x, y, w, h, lit[id] ? C.red : C.charcoal);
    const sound = PARTS.includes(studio.tab) ? SOUNDS[studio.tab][studio.beat.sounds[studio.tab]].name : 'sound';
    const word = id === 'range' ? `oct ${studio.range > 0 ? '+1' : studio.range < 0 ? '-1' : '0'}` : id === 'sound' ? sound : id;
    text(word, x + w / 2, y + 2, faded ? C.greyDark : C.light, 'center');
  }
}

// The pad: four strips for the drums, eight columns for the bass (the key's notes) and the chords (its
// chords), each named, with its key; lit where you hold it.
function pad({ px, text, C }, studio, [base, shadow]) {
  const [x0, y0, w, h] = PAD, beat = studio.beat, held = studio.held, part = studio.tab;
  px(x0, y0, w, h, C.charcoal);
  if (part === 'drums') {
    const sh = h / DRUMS.length;
    DRUMS.forEach((drum, i) => {
      const y = y0 + Math.round(i * sh), on = held?.row === i;
      if (on) px(x0, y, w, Math.round(sh), studio.erase ? C.red : base);
      if (i) px(x0, y, w, 1, C.night);
      text(drum, x0 + 6, y + sh / 2 - 4, on ? C.ink : C.grey);
      text('asdf'[i], x0 + w - 8, y + sh / 2 - 4, on ? C.ink : C.greyDark);
    });
    if (held) finger(px, C, x0 + held.x * w, y0 + (held.row + 0.5) * sh);
    return;
  }
  const cw = w / 8;
  for (let i = 0; i < 8; i++) {
    const x = x0 + Math.round(i * cw), on = held?.col === i;
    if (on) px(x, y0, Math.round(cw), h, studio.erase ? C.red : shadow);
    if (i) px(x, y0, 1, h, C.night);
    const name = part === 'bass' ? noteLetter(keyNote(beat.mood, i, BASS_C)) : padChordName(beat.mood, i);
    text(name, x + cw / 2, y0 + h - 11, on ? C.light : C.grey, 'center');
    text('asdfghjk'[i], x + cw / 2, y0 + 3, on ? C.light : C.greyDark, 'center');
  }
  if (held) finger(px, C, x0 + (held.col + 0.5) * cw, y0 + (1 - held.y) * h);
  if (part === 'bass' && studio.range) text(studio.range > 0 ? 'octave up' : 'octave down', x0 + w / 2, y0 + 12, C.grey, 'center');
}

// Where your finger holds the pad: a light dot with a soft ring.
function finger(px, C, x, y) {
  px(x - 3, y - 1, 7, 3, C.light);
  px(x - 1, y - 3, 3, 7, C.light);
  px(x - 2, y - 2, 5, 5, C.light);
}

// The Mix tab: a fader and a mute for each part, the Pump's fader, and the Pad and Vinyl switches.
function mix({ px, text, C }, studio, tone) {
  const [x0, y0, w, h] = PAD, m = studio.beat.mix;
  px(x0, y0, w, h, C.charcoal);
  const fader = (fx, value, [base, shadow], label) => {
    px(fx + 5, FADER[0], 4, FADER[1], C.night);
    const top = FADER[0] + Math.round((1 - value) * FADER[1]);
    px(fx + 5, top, 4, FADER[0] + FADER[1] - top, shadow);
    px(fx, top - 2, 14, 4, base);
    text(label, fx + 7, FADER[0] - 9, C.grey, 'center');
  };
  for (const p of PARTS) {
    fader(MIX_FADERS[p], m.levels[p], tone[p], p);
    px(MIX_FADERS[p], MUTE_Y, 14, 10, m.muted[p] ? C.red : C.night);
    text('m', MIX_FADERS[p] + 7, MUTE_Y + 1, m.muted[p] ? C.light : C.grey, 'center');
  }
  fader(MIX_FADERS.pump, m.pump, [C.gold, C.goldDark], 'pump');
  for (const [id, [x, y, sw, sh]] of Object.entries(SWITCHES)) {
    const on = m[id];
    px(x, y, sh, sh, on ? C.gold : C.night);
    text(id, x + sh + 4, y + 2, on ? C.light : C.grey);
  }
}

// The picture of the loop: bar numbers and a line on every beat; the drums as four rows of marks,
// the bass as a little piano roll, the chords as named blocks with a mark for each hit; the playhead.
function strip({ px, text, C }, studio, t, tone) {
  const [x0, y0, w, h] = STRIP, beat = studio.beat, n = beat.bars * 16, step = w / n;
  const clock = clockOf(beat), top = y0 + 9; // the lanes, under the bar numbers
  px(x0, top, w, y0 + h - top, C.ink);
  for (let b = 0; b < beat.bars; b++) text(String(b + 1), x0 + b * 16 * step + 2, y0, C.grey);
  for (let k = 0; k < n; k += 4) px(x0 + Math.round(k * step), top, 1, y0 + h - top, k % 16 === 0 ? C.greyDark : C.charcoal);
  // the drums
  const [dy] = LANES.drums;
  for (const h of beat.drums) px(x0 + Math.round(h.s * step) + 1, dy + DRUMS.indexOf(h.drum) * 2.5, Math.max(1, Math.round(step) - 1), 2, h.drum === 'kick' || h.drum === 'snare' ? tone.drums[0] : tone.drums[1]);
  // the bass, higher notes higher
  const [by, bh] = LANES.bass, notes = beat.bass.map((h) => bassNote(beat, h));
  const lo = Math.min(...notes, 99), hi = Math.max(...notes, lo + 12);
  beat.bass.forEach((b, i) => px(x0 + Math.round(b.s * step) + 1, by + bh - 2 - Math.round(((notes[i] - lo) / (hi - lo)) * (bh - 2)), Math.max(1, Math.round(b.len * step) - 1), 2, tone.bass[0]));
  // the chords: a block from each change of chord to the next, named where it fits
  const [cy, ch] = LANES.chords, hits = beat.chords;
  hits.forEach((c, i) => {
    const name = chordOf(beat, c).name, prev = hits[i - 1];
    if (!prev || chordOf(beat, prev).name !== name) {
      let j = i + 1;
      while (j < hits.length && chordOf(beat, hits[j]).name === name) j++;
      const end = j < hits.length ? hits[j].s : Math.max(c.s + c.len, hits.at(-1).s + hits.at(-1).len);
      const bx = x0 + Math.round(c.s * step) + 1, bw = Math.max(2, Math.round(Math.min(end, n) * step) + x0 - bx - 1);
      px(bx, cy, bw, ch, tone.chords[1]);
      if (bw >= name.length * 5 + 4) text(name, bx + 2, cy + 1, C.light);
    }
    px(x0 + Math.round(c.s * step) + 1, cy + ch - 2, 2, 2, tone.chords[0]);
  });
  // the playhead
  const s = clock.sixteenthAt(Math.max(0, t)), frac = (t - clock.timeOf16th(s)) / (clock.timeOf16th(s + 1) - clock.timeOf16th(s));
  const pos = (((s % n) + n) % n) + Math.max(0, Math.min(1, frac));
  if (t >= 0) px(x0 + Math.round(pos * step), top, 1, y0 + h - top, C.light);
}

// The list of beats (or, with every slot full, which of yours to replace), over the pad. Each row is a
// beat's name and, at its end, its tempo and key; the beat your sets play is named in green, and said
// under the rows (a row is too short for the word as well).
function list({ px, text, C }, studio) {
  const [x0, y0, w, h] = PAD, asking = studio.asking;
  px(x0, y0, w, h, C.ink);
  text(asking ? 'your slots are full: replace which?' : 'ready-made', x0 + 6, y0 + 3, C.gold);
  if (!asking) text('yours', x0 + 122, y0 + 3, C.gold);
  const row = ([x, y, rw], beat, open, chosen) => {
    if (open) px(x - 2, y - 1, rw, LIST_ROW, C.charcoal);
    if (!beat) return text('empty', x, y + 1, C.greyDark);
    text(shortName(beat.name), x, y + 1, chosen ? C.go : C.light);
    text(`${beat.bpm} ${moodShort(beat.mood)}`, x + rw - 6, y + 1, C.grey, 'right');
  };
  if (!asking) {
    READY.forEach((b, i) => row(listBox(i, 0), b, studio.open.ready === b.id, isChosen(studio, { ready: b.id })));
  }
  studio.beats.slots.forEach((b, i) => row(listBox(i, 1), b, studio.open.slot === i, b && isChosen(studio, { slot: i })));
  text(`busking: ${chosenBeat(studio.beats).name}`, x0 + 6, y0 + 14 + STUDIO.slots * LIST_ROW + 1, C.go);
  if (asking) {
    text('esc: leave them all', x0 + 6, y0 + h - 12, C.grey);
    return;
  }
  for (const [id, [x, y, bw, bh]] of Object.entries(LIST_BUTTONS)) {
    const word = { new: 'new', busk: 'busk to this', close: 'close' }[id];
    px(x, y, bw, bh, id === 'busk' ? C.gold : C.charcoal);
    text(word, x + bw / 2, y + 2, id === 'busk' ? C.ink : C.light, 'center');
  }
}
