// Your room at home, as plain state: the shelf of keepsakes (keepsakes.js), a cubby for each, and the
// desk with your studio on it; which of them the pointer is on, what the card under the shelf says,
// what a key, a click or the mouse over them does, and your case's "no" to a fourth, for a moment.
// Pure, so it's tested in Node; main.js runs it and render.js draws it.
import { KEEPSAKES, keepsake, hint, toggleCase } from './keepsakes.js';
import { MAP_KEY } from './studioview.js';

// The card along the bottom of the room: [x, y, w, h] in scene pixels, right of the map key.
export const CARD = [48, 138, 268, 38];
export const DESK = KEEPSAKES.length; // the pointer's place on the desk, after the 22 cubbies
const COLUMNS = KEEPSAKES.length / 2; // a column for each animal: its ordinary keepsake on top, its special one under
const FULL_SHOWS = 2; // seconds "your case holds three" shows

// Keepsake i's cubby: column i >> 1 (its animal), row i & 1. The pointer starts on the first.
// said: your case's refusal of a fourth, { time } on the page's clock, or null.
export function createRoom() {
  return { at: 0, said: null };
}

// Move the pointer to `at`; the case's refusal belongs to the keepsake it was said for, so moving
// off it clears it.
function pointAt(room, at) {
  if (at !== room.at) room.said = null;
  room.at = at;
}

// The arrow keys: left and right step along the row, and right from its last cubby goes to the desk
// (left from the desk comes back, to the top row); up and down switch rows (on the desk, nothing).
function step(room, code) {
  if (room.at === DESK) {
    if (code === 'ArrowLeft') pointAt(room, (COLUMNS - 1) * 2);
    return;
  }
  const col = room.at >> 1, row = room.at & 1;
  if (code === 'ArrowUp' || code === 'ArrowDown') pointAt(room, col * 2 + (code === 'ArrowDown' ? 1 : 0));
  else if (code === 'ArrowLeft' && col > 0) pointAt(room, (col - 1) * 2 + row);
  else if (code === 'ArrowRight') pointAt(room, col < COLUMNS - 1 ? (col + 1) * 2 + row : DESK);
}

// Enter on where the pointer is: the desk opens the studio ('studio'); a keepsake you've found goes in
// your case, or comes out ('case'), or with your case full, stays out and the room says so for a
// moment (null); one you haven't found does nothing (null). time: the page's clock, in seconds.
export function press(room, keeps, time) {
  if (room.at === DESK) return 'studio';
  const did = toggleCase(keeps, KEEPSAKES[room.at].id);
  room.said = did === 'full' ? { time } : null;
  return did === 'in' || did === 'out' ? 'case' : null;
}

// A key in the room, by its code: what main.js should do, 'studio', 'map' (Esc), 'case' (your case
// changed: keep it), or null.
export function roomKey(room, keeps, code, time) {
  if (code === 'Escape') return 'map';
  if (code === 'Enter' || code === 'NumpadEnter' || code === 'Space') return press(room, keeps, time);
  if (code.startsWith('Arrow')) step(room, code);
  return null;
}

const inside = ([x, y, w, h], px, py) => px >= x && px < x + w && py >= y && py < y + h;

// Keepsake i's cubby, inside: [x, y, w, h]. layout: sprites.json's room data, { shelf: [x, y, pitch,
// columns, rows], desk: [x, y, w, h] }.
export function cubbyBox(layout, i) {
  const [x, y, pitch] = layout.shelf;
  return [x + 1 + (i >> 1) * pitch, y + 1 + (i & 1) * pitch, pitch - 1, pitch - 1];
}

// What scene point (px, py) is over: { hit: 'cubby', at }, { hit: 'desk' }, { hit: 'map' } (the map
// key), or null.
export function roomHit(layout, px, py) {
  if (inside(MAP_KEY, px, py)) return { hit: 'map' };
  if (inside(layout.desk, px, py)) return { hit: 'desk' };
  const at = KEEPSAKES.findIndex((k, i) => inside(cubbyBox(layout, i), px, py));
  return at < 0 ? null : { hit: 'cubby', at };
}

// The mouse moving over the room: the pointer follows it onto a cubby or the desk. Returns whether
// it's over something a click does something with (for the cursor).
export function roomHover(layout, room, px, py) {
  const target = roomHit(layout, px, py);
  if (target?.hit === 'cubby') pointAt(room, target.at);
  else if (target?.hit === 'desk') pointAt(room, DESK);
  return !!target;
}

// A click: the pointer goes where it lands and it's pressed there, as Enter does; on the map key,
// 'map'. Returns as roomKey does.
export function roomClick(layout, room, keeps, px, py, time) {
  const target = roomHit(layout, px, py);
  if (!target) return null;
  if (target.hit === 'map') return 'map';
  pointAt(room, target.hit === 'desk' ? DESK : target.at);
  return press(room, keeps, time);
}

// The card's words for where the pointer is, at page time `time`: { name, line, says, found, full }
// (says: what Enter does; found: false for a keepsake you haven't found, whose name and line are a
// hint and which Enter does nothing with; full: says is your case's "no" to a fourth, for a moment).
export function roomCard(room, keeps, time) {
  if (room.at === DESK) return { name: 'Your studio', line: 'make your own tracks', says: 'enter to open it', found: true, full: false };
  const { id } = KEEPSAKES[room.at];
  if (!keeps.found.includes(id)) return { ...hint(id), says: '', found: false, full: false };
  const { name, line } = keepsake(id);
  if (room.said && time - room.said.time < FULL_SHOWS) return { name, line, says: 'your case holds three, take one off first', found: true, full: true };
  return { name, line, says: keeps.inCase.includes(id) ? 'in your case: enter to take it out' : 'enter to put it in your case', found: true, full: false };
}
