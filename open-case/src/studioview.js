// The studio's screen at 320x180, laid out as Figure's is but wide: the beat's name, the tabs and the
// song's settings across the top; on the left, on a blue faceplate with screws, the rhythm knob (a
// vintage MIDI encoder: a knurled silver edge, a gold cap with the rhythm's number, a ring of lights
// showing its hits, ◀ and ▶ to turn it) over the buttons, drawn as raised keys; the big pad on the
// right (the Mix tab's mixing desk in its place: faders with coloured caps, raised mute keys, toggle
// switches with lamps); and along the bottom, a picture of the loop, only to look
// at: bar numbers, a lane for each part showing its notes, and the playhead. The list of beats, the
// question of which slot to replace, and the name box (the list's Save) open over the pad. studioHit
// says what a click lands on; drawStudio draws it all with render.js's tools.
import { READY, clockOf, chordOf, bassNote, keyNote, noteLetter, padChordName, SOUNDS, BASS_C } from './beats.js';
import { PARTS, DRUMS, COLUMNS, rhythmOf, isChosen, chosenBeat } from './studio.js';
import { STUDIO } from './tuning.js';

// Where everything is, [x, y, w, h] in scene pixels.
export const NAME = [2, 2, 62, 14];
export const TAB_BOXES = { drums: [66, 3, 32, 14], bass: [100, 3, 26, 14], chords: [128, 3, 38, 14], mix: [168, 3, 22, 14] };
// The tempo and the swing have ▲ and ▼ at their right (arrowsIn), so their boxes are a little wider.
export const SETTINGS = { bpm: [192, 1, 29, 17], mood: [221, 1, 32, 17], swing: [253, 1, 39, 17], bars: [292, 1, 28, 17] };
const ARROWED = ['bpm', 'swing']; // the settings with ▲ and ▼
export const WHEEL = [40, 50, 22]; // its middle and radius
export const PANEL = [2, 21, 77, 61]; // the faceplate behind the knob (the part tabs)
const KNOB_R = 16, CAP_R = 8, RING_R = 21; // the knob's, its gold cap's and the ring of lights' radii
// The ◀ and ▶ either side of the knob, each [x, y, 3, 5], their outer edges 29 pixels from its
// middle, one the mirror of the other.
export const KNOB_ARROWS = { left: [WHEEL[0] - 29, WHEEL[1] - 2, 3, 5], right: [WHEEL[0] + 26, WHEEL[1] - 2, 3, 5] };
// The turn (radians, clockwise from straight up) of the knob's pointer and ridges at rhythm
// index n (0-15): a sixteenth of a round a rhythm, so 16 comes back round to the first.
export const knobAngle = (n) => (n / 16) * Math.PI * 2;
// Light k of the ring's box [x, y, w, h], for a sixteenth with a note of length len (0: none): the
// sixteenths from the top clockwise, a long note's light 3x3 and the others 2x2.
export function ringLight(k, len) {
  const th = (k / 16) * Math.PI * 2, size = len > 1 ? 3 : 2;
  // rounded away from the middle on a half, so the lights at 3 and 9 o'clock (6 and 12) mirror
  const round = (v) => Math.sign(v) * Math.round(Math.abs(v));
  return [WHEEL[0] + round(Math.sin(th) * RING_R - size / 2), WHEEL[1] + round(-Math.cos(th) * RING_R - size / 2), size, size];
}
// The octave (range, the bass only) is wider than Undo beside it, for its ▲ and ▼ (arrowsIn).
export const BUTTONS = { sound: [4, 84, 74, 12], erase: [4, 98, 36, 12], clear: [42, 98, 36, 12], undo: [4, 112, 28, 12], range: [34, 112, 44, 12] };
// The sound key's ◀ and ▶, each [x, y, 3, 5] as the knob's are, 2 pixels in from its ends and
// level with its word: its left half steps back through the part's sounds and its right half on.
export const SOUND_ARROWS = {
  left: [BUTTONS.sound[0] + 2, BUTTONS.sound[1] + 3, 3, 5],
  right: [BUTTONS.sound[0] + BUTTONS.sound[2] - 5, BUTTONS.sound[1] + 3, 3, 5],
};
// The map key, in the free corner left of the picture of the loop: it leaves the studio for the map.
export const MAP_KEY = [4, 138, 40, 24];
export const PAD = [82, 22, 234, 108];
export const STRIP = [48, 134, 268, 44]; // the picture of the loop: its numbers row, then the lanes
const MIX_FADERS = { drums: 104, bass: 144, chords: 184, pump: 244 }; // each fader's x, 14 wide
const FADER = [38, 62]; // the faders' top and height
const MUTE_Y = 106;
// the Pad and Vinyl switches, one above the other; each box covers its name, lamp and toggle
export const SWITCHES = { pad: [266, 34, 46, 26], vinyl: [266, 64, 46, 26] };
const LIST_ROW = 11; // the list's rows
const LANES = { drums: [144, 10], bass: [156, 9], chords: [167, 10] }; // each lane's top and height

const inside = ([x, y, w, h], px, py) => px >= x && px < x + w && py >= y && py < y + h;
// Which half of box [x, y, w, h] the height py is in: 1 the upper (its ▲), -1 the lower (its ▼).
const half = ([, y, , h], py) => (py < y + h / 2 ? 1 : -1);
const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const moodShort = (id) => ({ C: 'C maj', D: 'D dor', E: 'E phr', F: 'F lyd', G: 'G mix', A: 'A min' })[id];
// A beat's name cut to fit a short space (the top bar, a row of the list): 9 letters at most, and
// never a space before the dot.
const shortName = (name) => (name.length > 9 ? `${name.slice(0, 8).trimEnd()}.` : name);

// The list's rows over the pad: the ready-made beats on the left, your slots on the right, and its
// buttons along the bottom.
const listBox = (i, side) => [PAD[0] + 4 + side * 116, PAD[1] + 14 + i * LIST_ROW, 110, LIST_ROW];
export const LIST_BUTTONS = {
  new: [PAD[0] + 4, PAD[1] + 92, 40, 12], busk: [PAD[0] + 48, PAD[1] + 92, 78, 12], save: [PAD[0] + 130, PAD[1] + 92, 44, 12], close: [PAD[0] + 178, PAD[1] + 92, 50, 12],
};
// The name box, in the list's place: the name as you type it, and its buttons along the bottom.
export const NAME_FIELD = [PAD[0] + 57, PAD[1] + 36, 120, 16];
export const NAME_BUTTONS = { save: [PAD[0] + 60, PAD[1] + 92, 50, 12], cancel: [PAD[0] + 124, PAD[1] + 92, 50, 12] };

// Where a box's ▲ and ▼ are, each [x, y, 5, 3]: little triangles, one over the
// other at the box's right, ▲ just above its middle and ▼ just below, since a click on the box's
// upper half steps up and on its lower half down.
export function arrowsIn([x, y, w, h]) {
  const ax = x + w - 8, mid = Math.ceil(y + h / 2);
  return { up: [ax, mid - 4, 5, 3], down: [ax, mid, 5, 3] };
}

// What a click (or a press) at scene point (x, y) lands on, as { hit, ... }, or null:
//   'map'                                             the map key, whatever is open over the pad
//   'naming' { which: 'save' | 'cancel' }             while the name box is open (nothing else is)
//   'replace' { slot }, 'keep'                        while asking which slot to replace
//   'open' { which }, 'new', 'busk', 'save', 'close'  in the list of beats
//   'name', 'tab' { tab }, 'setting' { which }, 'wheel' { dir }, 'button' { which }
//   (on the knob and the sound key, dir is -1 on the left half, ◀, and 1 on the right, ▶)
//   (on the tempo, the swing and the octave button, dir too: 1 on the upper half, the ▲, -1 below)
//   'pad' { at }: { row, x } on the drums, { col, y } on the bass and chords
//   'fader' { which, value } (a part's level, or 'pump'), 'mute' { part }, 'switch' { which }
export function studioHit(studio, x, y) {
  if (inside(MAP_KEY, x, y)) return { hit: 'map' };
  if (studio.naming) {
    for (const [which, box] of Object.entries(NAME_BUTTONS)) if (inside(box, x, y)) return { hit: 'naming', which };
    return null;
  }
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
  for (const [which, box] of Object.entries(SETTINGS)) {
    if (inside(box, x, y)) return ARROWED.includes(which) ? { hit: 'setting', which, dir: half(box, y) } : { hit: 'setting', which };
  }
  const [wx, wy, r] = WHEEL;
  if ((x - wx) ** 2 + (y - wy) ** 2 <= (r + 8) ** 2) return { hit: 'wheel', dir: x < wx ? -1 : 1 };
  for (const [which, box] of Object.entries(BUTTONS)) {
    if (!inside(box, x, y)) continue;
    if (which === 'sound') return { hit: 'button', which, dir: x < box[0] + box[2] / 2 ? -1 : 1 };
    if (which !== 'range') return { hit: 'button', which };
    if (studio.tab === 'bass') return { hit: 'button', which, dir: half(box, y) };
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

// Draws the studio: d is render.js's { px, text, big, measure, C } (big: text in the 16px font;
// measure: a text's width); t is band time (for the playhead, the name box's cursor and "saved").
export function drawStudio(d, studio, t) {
  const { px, text, C } = d, beat = studio.beat, part = studio.tab;
  const tone = { drums: [C.drums, C.drumsDark], bass: [C.bass, C.bassDark], chords: [C.chords, C.chordsDark] };
  px(0, 0, 320, 180, C.night);
  // The top bar: the beat's name (click for the list), the tabs, the settings.
  px(0, 0, 320, 19, C.dusk);
  px(NAME[0], NAME[1], NAME[2], NAME[3], studio.list || studio.naming ? C.charcoal : C.night);
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
  // The tempo and the swing: the label and the number to the left of their ▲ and ▼, and an arrow
  // that can't step (at 140 bpm, say) dimmed.
  const ends = { bpm: [beat.bpm < 140, beat.bpm > 60], swing: [beat.swing < 0.75, beat.swing > 0.5] };
  for (const [id, box] of Object.entries(SETTINGS)) {
    const [x, y, w] = box, arrows = ARROWED.includes(id) && arrowsIn(box);
    const cx = arrows ? textLeftOf(x, arrows) : x + w / 2;
    text(id === 'mood' ? 'key' : id, cx, y, C.greyDark, 'center');
    text(values[id], cx, y + 8, C.light, 'center');
    if (arrows) upDown(px, arrows, ends[id].map((can) => (can ? C.grey : C.greyDark)));
  }
  if (PARTS.includes(part)) wheel(d, studio, tone[part]);
  buttons(d, studio);
  mapKey(d);
  if (part === 'mix') mix(d, studio, tone);
  else pad(d, studio, tone[part]);
  strip(d, studio, t, tone);
  if (studio.naming) nameBox(d, studio, t);
  else if (studio.list || studio.asking) list(d, studio, t);
}

// A disc of pixels round the grid corner (cx, cy), radius r, a pixel row at a time. at(dx, dy, d, ang)
// gives a pixel's colour (null: none) from its offset (dx, dy) from the middle, its distance d and its
// angle ang (0 straight up, growing clockwise); a run of one colour is one px call.
function disc(px, cx, cy, r, at) {
  const n = Math.ceil(r);
  for (let y = -n; y < n; y++) {
    let run = null, from = -n;
    for (let x = -n; x <= n; x++) {
      const dx = x + 0.5, dy = y + 0.5, d = Math.hypot(dx, dy);
      const c = x < n && d <= r ? at(dx, dy, d, (Math.atan2(dx, -dy) + Math.PI * 2) % (Math.PI * 2)) : null;
      if (c === run) continue;
      if (run) px(cx + from, cy + y, x - from, 1, run);
      run = c;
      from = x;
    }
  }
}

// The rhythm knob, a vintage MIDI encoder on its faceplate. The part's rhythm is a ring of 16 lights
// (a hit in the part's colour, with a light glint at its top left like a lit LED, bigger for a long
// note; an unlit light dark). The knob has a knurled silver edge (40 ridges, lit from the top left),
// a flat black top, and a small gold cap with the rhythm's number on it; its pointer and ridges turn
// a sixteenth of a round a rhythm. ◀ and ▶ are at its sides.
function wheel({ px, text, measure, C }, studio, [base]) {
  const [cx, cy] = WHEEL, rhythm = rhythmOf(studio), n = studio.rhythm[studio.tab], turn = knobAngle(n);
  px(...PANEL, C.dusk);
  for (const [sx, sy] of [[4, 23], [74, 23], [4, 77], [74, 77]]) screw(px, C, sx, sy);
  for (let k = 0; k < 16; k++) {
    const len = rhythm.find(([s]) => s === k)?.[1] ?? 0;
    const light = ringLight(k, len);
    px(...light, len ? base : C.night);
    if (len) px(light[0], light[1], 1, 1, C.light);
  }
  disc(px, cx + 1, cy + 1, KNOB_R, () => C.ink); // its shadow on the panel
  disc(px, cx, cy, KNOB_R, (dx, dy, d, ang) => {
    const light = -(dx + dy) / (d * Math.SQRT2); // 1 toward the top left, -1 toward the bottom right
    if (d > CAP_R + 0.5) {
      const away = Math.abs(ang - turn), gap = Math.min(away, Math.PI * 2 - away);
      if (gap * d < 0.75 && d < KNOB_R - 0.5) return C.light; // the pointer, from the cap to the rim
      if (d > KNOB_R - 2.2) {
        const ridge = Math.floor((((((ang - turn) / (Math.PI * 2)) * 40) % 40) + 40) % 40) % 2;
        if (light > 0.45) return ridge ? C.light : C.grey;
        if (light > -0.45) return ridge ? C.grey : C.greyDark;
        return ridge ? C.greyDark : C.charcoal;
      }
      return d > KNOB_R - 3.5 && light > 0.3 ? C.charcoal : C.ink; // the flat top, its edge in the light
    }
    if (d > CAP_R - 1 && light > 0.5) return C.light;
    return light < -0.3 && d > CAP_R - 2 ? C.goldDark : C.gold;
  });
  // the number from a whole pixel, as centring an odd width would blur the font on a half pixel
  const number = String(n + 1);
  text(number, Math.round(cx - measure(number) / 2), cy - 3, C.ink);
  for (const [x, y, w, h] of [KNOB_ARROWS.left, KNOB_ARROWS.right]) {
    for (let i = 0; i < w; i++) px(x + (x < cx ? i : w - 1 - i), y + 2 - i, 1, 1 + 2 * i, C.grey);
  }
}

// A screw on a faceplate: 3x3, a slot across it and a glint.
function screw(px, C, x, y) {
  px(x, y, 3, 3, C.greyDark);
  px(x, y + 1, 3, 1, C.ink); // the slot
  px(x + 1, y, 1, 1, C.grey); // a glint
}

// A raised key: a lighter top edge and a dark bottom one; when it's pressed in, the edges swap.
function raisedKey(px, C, [x, y, w, h], colour, pressed) {
  px(x, y, w, h, colour);
  px(x, y, w, 1, pressed ? C.ink : C.greyDark);
  px(x, y + h - 1, w, 1, pressed ? C.greyDark : C.ink);
}

// Where to centre a text in a box from x to its arrows (arrowsIn), a pixel short of them.
const textLeftOf = (x, arrows) => Math.round((x + arrows.up[0] - 1) / 2);

// A box's ▲ and ▼ (arrowsIn), in the colours [up, down].
function upDown(px, { up, down }, [upColour, downColour]) {
  for (let i = 0; i < 3; i++) {
    px(up[0] + 2 - i, up[1] + i, 1 + 2 * i, 1, upColour);
    px(down[0] + 2 - i, down[1] + 2 - i, 1 + 2 * i, 1, downColour);
  }
}

function buttons({ px, text, C }, studio) {
  const lit = { erase: studio.erase };
  for (const [id, box] of Object.entries(BUTTONS)) {
    const [x, y, w, h] = box;
    const off = (id === 'range' && studio.tab !== 'bass') || (id !== 'undo' && studio.tab === 'mix' && id !== 'sound');
    const faded = off || (id === 'sound' && studio.tab === 'mix') || (id === 'undo' && !studio.undo.length);
    // a raised key: a lighter top edge and a dark bottom one; when it's on, pressed in (the edges
    // swap and its word sits a pixel lower)
    const pressed = lit[id] ? 1 : 0;
    raisedKey(px, C, box, lit[id] ? C.red : C.charcoal, pressed);
    const sound = PARTS.includes(studio.tab) ? SOUNDS[studio.tab][studio.beat.sounds[studio.tab]].name : 'sound';
    const word = id === 'range' ? `oct ${studio.range > 0 ? '+1' : studio.range < 0 ? '-1' : '0'}` : id === 'sound' ? sound : id;
    const arrows = id === 'range' && arrowsIn(box); // the octave's ▲ and ▼, dimmed at its ends
    text(word, arrows ? textLeftOf(x, arrows) : x + w / 2, y + 2 + pressed, faded ? C.greyDark : C.light, 'center');
    if (arrows) upDown(px, arrows, [studio.range < 1, studio.range > -1].map((can) => (can && !off ? C.grey : C.greyDark)));
    // the sound key's ◀ and ▶ at its ends, pointing out, drawn as the knob's are: back and on
    if (id === 'sound') {
      for (const [ax, ay, aw] of [SOUND_ARROWS.left, SOUND_ARROWS.right]) {
        for (let i = 0; i < aw; i++) px(ax + (ax < x + w / 2 ? i : aw - 1 - i), ay + 2 - i, 1, 1 + 2 * i, faded ? C.greyDark : C.grey);
      }
    }
  }
}

// The map key: a raised key with a little ◀ (3 wide, 5 tall, as the knob's) and "map" on its top row,
// and "esc" in grey under them, as Esc does the same.
function mapKey({ px, text, C }) {
  const [x, y, w] = MAP_KEY;
  raisedKey(px, C, MAP_KEY, C.charcoal, false);
  for (let i = 0; i < 3; i++) px(x + 6 + i, y + 6 - i, 1, 1 + 2 * i, C.grey);
  text('map', x + 12, y + 4, C.light);
  text('esc', x + w / 2, y + 14, C.grey, 'center');
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

// The Mix tab, a vintage mixing desk like the knob's faceplate: on blue with a screw in each corner, a
// fader for each part and the Pump (a console cap in the part's colour on a scale, over a slot that
// fills with colour below the cap), a raised mute key under each part, and the Pad and Vinyl switches
// stacked at the right, each a name over a jewel lamp that glows gold when on, beside a toggle whose
// lever is up when on.
function mix({ px, text, measure, C }, studio, tone) {
  const [x0, y0, w, h] = PAD, m = studio.beat.mix;
  px(x0, y0, w, h, C.dusk);
  for (const [sx, sy] of [[x0 + 2, y0 + 2], [x0 + w - 5, y0 + 2], [x0 + 2, y0 + h - 5], [x0 + w - 5, y0 + h - 5]]) screw(px, C, sx, sy);
  const fader = (fx, value, [base, shadow], label) => {
    const cx = fx + 7, top = FADER[0], level = top + Math.round((1 - value) * FADER[1]);
    // the scale: a tick every eighth either side of the slot, longer at the ends and the middle
    for (let i = 0; i <= 8; i++) {
      const ty = Math.round(top + (i / 8) * FADER[1]), long = i % 4 === 0;
      px(cx - 6 - (long ? 1 : 0), ty, long ? 3 : 2, 1, long ? C.grey : C.greyDark);
      px(cx + 5, ty, long ? 3 : 2, 1, long ? C.grey : C.greyDark);
    }
    // the slot, sunk into the desk, filled with the part's colour below the cap
    px(cx - 2, top - 1, 4, FADER[1] + 2, C.ink);
    px(cx - 1, top, 2, FADER[1], C.night);
    px(cx - 1, level, 2, top + FADER[1] - level, base);
    // the cap: a console fader's, 12 wide and 7 high, lit from above, a line across its middle
    const capX = cx - 6, capY = level - 3;
    px(capX + 1, capY + 1, 12, 7, C.ink); // its shadow
    px(capX, capY, 12, 7, base);
    px(capX, capY, 12, 1, C.light);
    px(capX, capY + 5, 12, 2, shadow);
    px(capX, capY + 3, 12, 1, C.light);
    // the label from a whole pixel, as centring an odd width would blur the font on a half pixel
    text(label, Math.round(cx - measure(label) / 2), FADER[0] - 12, C.grey);
  };
  for (const p of PARTS) {
    const fx = MIX_FADERS[p], on = m.muted[p];
    fader(fx, m.levels[p], tone[p], p);
    // the mute: a raised key, pressed in and lit red when muted
    raisedKey(px, C, [fx, MUTE_Y, 14, 10], on ? C.red : C.charcoal, on);
    text('m', fx + 7, MUTE_Y + 1 + (on ? 1 : 0), on ? C.light : C.grey, 'center');
  }
  fader(MIX_FADERS.pump, m.pump, [C.gold, C.goldDark], 'pump');
  Object.keys(SWITCHES).forEach((id, i) => {
    const on = m[id], x = 268, y = 36 + i * 30;
    text(id, x, y, on ? C.light : C.grey);
    px(x, y + 10, 9, 9, C.ink); // the lamp's rim
    px(x + 1, y + 11, 7, 7, on ? C.gold : C.charcoal);
    px(x + 1, y + 15, 7, 3, on ? C.goldDark : C.ink);
    px(x + 2, y + 12, 2, 1, on ? C.light : C.greyDark); // its glint
    const tx = x + 15, ty = y + 13;
    px(tx, ty, 7, 4, C.greyDark); // the toggle's plate
    px(tx + 1, ty + 1, 5, 2, C.grey); // its nut
    if (on) { px(tx + 2, ty - 5, 3, 6, C.grey); px(tx + 2, ty - 6, 3, 2, C.light); }
    else { px(tx + 2, ty + 3, 3, 6, C.greyDark); px(tx + 2, ty + 8, 3, 2, C.grey); }
  });
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
// under the rows (a row is too short for the word as well), where "saved" shows for a moment after
// you name a beat.
function list({ px, text, C }, studio, t) {
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
  const under = y0 + 14 + STUDIO.slots * LIST_ROW + 1;
  text(`busking: ${chosenBeat(studio.beats).name}`, x0 + 6, under, C.go);
  if (studio.saved !== null && t >= studio.saved && t - studio.saved < STUDIO.saved) text('saved', x0 + w - 6, under, C.go, 'right');
  if (asking) {
    text('esc: leave them all', x0 + 6, y0 + h - 12, C.grey);
    return;
  }
  for (const [id, [x, y, bw, bh]] of Object.entries(LIST_BUTTONS)) {
    const word = { new: 'new', busk: 'busk to this', save: 'save', close: 'close' }[id];
    px(x, y, bw, bh, id === 'busk' ? C.gold : C.charcoal);
    text(word, x + bw / 2, y + 2, id === 'busk' ? C.ink : C.light, 'center');
  }
}

// The name box (the list's Save), in the list's place: the name as you type it, with a cursor that
// blinks on band time, and its save and cancel buttons.
function nameBox({ px, text, measure, C }, studio, t) {
  const [x0, y0, w, h] = PAD, [fx, fy, fw, fh] = NAME_FIELD, name = studio.naming.text;
  px(x0, y0, w, h, C.ink);
  text('name your track', x0 + 6, y0 + 3, C.gold);
  px(fx, fy, fw, fh, C.charcoal);
  text(name, fx + 4, fy + 4, C.light);
  if (Math.floor(t * 2) % 2 === 0) px(fx + 4 + measure(name) + 1, fy + 3, 1, 10, C.light);
  text(`letters, numbers, spaces: up to ${STUDIO.name}`, x0 + w / 2, fy + fh + 6, C.grey, 'center');
  text('enter: save   esc: cancel', x0 + w / 2, y0 + h - 30, C.greyDark, 'center');
  for (const [id, [x, y, bw, bh]] of Object.entries(NAME_BUTTONS)) {
    px(x, y, bw, bh, id === 'save' ? C.gold : C.charcoal);
    text(id, x + bw / 2, y + 2, id === 'save' ? C.ink : C.light, 'center');
  }
}
