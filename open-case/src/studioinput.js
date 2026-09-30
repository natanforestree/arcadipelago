// The studio's controls: the mouse is your finger on the pad, and the keys stand in for it. These turn
// key and mouse events (in scene pixels, at band time t) into studio.js's actions; main.js feeds them
// and does what they return. Pure, so it's tested in Node.
//
// Keys: A S D F the drum strips, A to K the bass notes or chords; up and down turn the rhythm wheel;
// Tab the next part; Backspace (held) erases, Shift+Backspace clears the part; Z and X move the bass
// pad down or up an octave; Cmd+Z (Ctrl+Z) undoes (with Shift it's redo elsewhere, and there's no
// redo, so it does nothing); Cmd+S (Ctrl+S) opens the name box, as the list's Save does; Esc closes
// the list, or leaves. While the name box is open, the keys type the name instead: letters, digits
// and spaces, Backspace deletes, Enter saves and Esc cancels.
import {
  PARTS, DRUMS, LENGTHS, press, moveTo, letGo, setErase, turnRhythm, nextTab, setTab, clearPart, undoChange, moveRange, nextSound,
  setTempo, setSwing, setMood, setLength, setLevel, setPump, toggleMute, togglePad, toggleVinyl, openBeat, newBeat, buskTo, replaceSlot,
  cancelAsk, startNaming, typeName, backspaceName, saveName, cancelNaming,
} from './studio.js';
import { studioHit, padAt, faderValue } from './studioview.js';
import { MOODS } from './beats.js';

const PAD_KEYS = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK'];
const KEY_VEL = 0.7, KEY_TONE = 0.5; // a drum played from its key, and a note or chord's tone
const DRAG = { bpm: 2, swing: 2, mood: 10, bars: 12 }; // pixels of drag for each step of a setting
const SWINGS = [50, 54, 58, 62, 66, 70, 75]; // the swing's steps, in percent (50 is off)
// Holding the tempo's or the swing's arrow repeats its step: the first repeat after `wait` seconds,
// then one every `every`, and once it's been held `fast` seconds, one every `faster`.
const HOLD = { wait: 0.4, every: 0.1, fast: 1.5, faster: 0.04 };
const SLOW = Math.round((HOLD.fast - HOLD.wait) / HOLD.every); // repeats after the first, to `fast`
// When repeat n (from 0) of a hold is due, in seconds after the mouse went down.
const repeatAt = (n) => (n <= SLOW ? HOLD.wait + n * HOLD.every : HOLD.fast + (n - SLOW) * HOLD.faster);
const WHEEL_GAP = 0.06; // seconds: the scroll wheel steps a setting at most this often
const WHEEL_RUN = 0.5; // seconds: wheel steps on one setting closer than this are one change for Undo

// A key goes down. Returns what main.js should do beyond the studio: 'leave' (Esc, with nothing
// open to close), or null. `held` is the controls' own state: { key } for a pad key held.
export function keyDown(studio, held, e, t) {
  if (studio.naming) return nameKey(studio, e, t);
  if (e.repeat) return null;
  if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.code === 'KeyZ') {
    undoChange(studio);
    return null;
  }
  if ((e.metaKey || e.ctrlKey) && e.code === 'KeyS') {
    if (!studio.asking) startNaming(studio); // a question on screen is answered first
    return null;
  }
  if (e.metaKey || e.ctrlKey || e.altKey) return null;
  if (e.code === 'Escape') {
    if (studio.asking) cancelAsk(studio);
    else if (studio.list) studio.list = false;
    else return 'leave';
    return null;
  }
  if (studio.asking || studio.list) return null;
  const i = PAD_KEYS.indexOf(e.code);
  if (i >= 0 && PARTS.includes(studio.tab)) {
    if (studio.tab === 'drums' && i >= DRUMS.length) return null;
    letGo(studio);
    if (press(studio, t, studio.tab === 'drums' ? { row: i, x: KEY_VEL } : { col: i, y: KEY_TONE })) held.key = e.code;
    return null;
  }
  if (e.code === 'ArrowUp' || e.code === 'ArrowDown') turnRhythm(studio, e.code === 'ArrowUp' ? -1 : 1);
  else if (e.code === 'Tab') nextTab(studio);
  else if (e.code === 'Backspace') {
    if (e.shiftKey) clearPart(studio);
    else setErase(studio, true);
  } else if ((e.code === 'KeyZ' || e.code === 'KeyX') && studio.tab === 'bass') moveRange(studio, e.code === 'KeyX' ? 1 : -1);
  return null;
}

// A key goes down in the name box at band time t: it types (by e.key, one character; a held key
// repeats, as in any text box), and nothing else in the studio hears it.
function nameKey(studio, e, t) {
  if (e.metaKey || e.ctrlKey || e.altKey) return null;
  if (e.code === 'Escape') cancelNaming(studio);
  else if (e.code === 'Enter' || e.code === 'NumpadEnter') saveName(studio, t);
  else if (e.code === 'Backspace') backspaceName(studio);
  else if (typeof e.key === 'string' && e.key.length === 1) typeName(studio, e.key);
  return null;
}

// A key comes up. macOS never sends the keyup of a key let go while Cmd is held, so Cmd coming up
// lets go of the pad key held (as input.js does for notes), or it would paint on.
export function keyUp(studio, held, e) {
  if (e.code === held.key || (e.key === 'Meta' && held.key)) {
    letGo(studio);
    held.key = null;
  }
  if (e.code === 'Backspace') setErase(studio, false);
}

// The mouse goes down at (x, y), at band time t and at `now` on the page's clock (seconds since the
// page opened; tick and scroll are given the same clock). Returns 'busk' after Busk to this, or
// null. `drag` is the controls' state for what the mouse holds until it comes up.
export function mouseDown(studio, drag, x, y, t, now = 0) {
  const target = studioHit(studio, x, y);
  drag.what = null;
  if (!target) return null;
  switch (target.hit) {
    case 'replace':
      replaceSlot(studio, target.slot);
      break;
    case 'keep':
      cancelAsk(studio);
      break;
    case 'open':
      openBeat(studio, target.which);
      break;
    case 'new':
      newBeat(studio);
      studio.list = false;
      break;
    case 'busk':
      buskTo(studio);
      studio.list = false;
      return 'busk';
    case 'save':
      startNaming(studio);
      break;
    case 'naming':
      if (target.which === 'save') saveName(studio, t);
      else cancelNaming(studio);
      break;
    case 'close':
      studio.list = false;
      break;
    case 'name':
      studio.list = !studio.list;
      break;
    case 'tab':
      setTab(studio, target.tab);
      break;
    case 'wheel':
      turnRhythm(studio, target.dir);
      break;
    case 'button':
      button(studio, target.which, target.dir);
      break;
    case 'pad':
      if (press(studio, t, target.at)) drag.what = 'pad';
      break;
    case 'setting': {
      // The tempo and the swing step as the mouse goes down, up on their upper half and down on
      // their lower; the key and the length step as it comes up (mouseUp). Either way, a drag
      // takes over from where the setting was when the mouse went down (or, after a hold has
      // repeated, from where the hold got to: mouseMove).
      const from = settingIndex(studio, target.which), before = studio.version;
      if (target.dir) setSetting(studio, target.which, stepped(target.which, from, target.dir), false);
      // dir, down and repeats: an arrow's hold (tick), none for the key or the length, nor for a
      // press refused (every slot full, so it asked which to replace).
      const dir = studio.asking ? 0 : target.dir ?? 0;
      Object.assign(drag, {
        what: 'setting', which: target.which, y, from, begun: studio.version !== before, moved: false, dir, down: now, repeats: 0,
      });
      break;
    }
    case 'fader': {
      // Grabbed where it is, nothing changes yet: the drag's first real change begins it (begun).
      const before = studio.version;
      fader(studio, target.which, target.value, false);
      Object.assign(drag, { what: 'fader', which: target.which, begun: studio.version !== before });
      break;
    }
    case 'mute':
      toggleMute(studio, target.part);
      break;
    case 'switch':
      if (target.which === 'pad') togglePad(studio);
      else toggleVinyl(studio);
      break;
  }
  return null;
}

// A button clicked; on the octave, dir 1 on its upper half (up an octave) or -1 on its lower.
function button(studio, which, dir) {
  if (which === 'sound') nextSound(studio);
  else if (which === 'range') moveRange(studio, dir);
  else if (which === 'erase') setErase(studio, !studio.erase); // a mouse can't hold two things: here it's a switch
  else if (which === 'clear') clearPart(studio);
  else if (which === 'undo') undoChange(studio);
}

function fader(studio, which, value, again) {
  if (which === 'pump') setPump(studio, value, again);
  else setLevel(studio, which, value, again);
}

// Where a setting is, as a number a drag moves: the tempo, the swing in percent, the mood's place,
// the length's place.
function settingIndex(studio, which) {
  const b = studio.beat;
  return { bpm: b.bpm, swing: Math.round(b.swing * 100), mood: MOODS.findIndex((m) => m.id === b.mood), bars: LENGTHS.indexOf(b.bars) }[which];
}

// One step of the tempo or the swing from v (as settingIndex has it), dir 1 up or -1 down: the tempo
// by a beat per minute; the swing to the first of SWINGS above v, or the last below it.
function stepped(which, v, dir) {
  if (which === 'bpm') return v + dir;
  return (dir > 0 ? SWINGS.find((s) => s > v) : SWINGS.findLast((s) => s < v)) ?? v;
}

function setSetting(studio, which, v, again) {
  if (which === 'bpm') setTempo(studio, v, again);
  else if (which === 'swing') setSwing(studio, v / 100, again);
  else if (which === 'mood') setMood(studio, MOODS[((v % MOODS.length) + MOODS.length) % MOODS.length].id, again);
  else setLength(studio, LENGTHS[Math.max(0, Math.min(LENGTHS.length - 1, v))], again);
}

// The mouse moves to (x, y) while down: the finger moves on the pad, or a setting or fader follows.
export function mouseMove(studio, drag, x, y) {
  if (drag.what === 'pad') moveTo(studio, padAt(studio.tab, x, y));
  else if (drag.what === 'fader') {
    const before = studio.version;
    fader(studio, drag.which, faderValue(y), drag.begun);
    if (studio.version !== before) drag.begun = true;
  } else if (drag.what === 'setting') {
    if (studio.naming) {
      drag.what = null; // the name box opened over it (Cmd+S): that ends the press, as in tick
      return;
    }
    const steps = Math.trunc((drag.y - y) / DRAG[drag.which]);
    if (!steps && !drag.moved) return;
    // The drag counts from where the setting was before the press's own step (so it undoes that
    // step); but once the hold has repeated, from where the hold got to.
    if (!drag.moved && drag.repeats) drag.from = settingIndex(studio, drag.which);
    drag.moved = true;
    const before = studio.version;
    setSetting(studio, drag.which, drag.from + steps, drag.begun);
    if (studio.version !== before) drag.begun = true;
  }
}

// Every frame while the studio is open, at page time `now`: a tempo or swing arrow still held (and
// not dragged) steps again when its next repeat is due, as part of the same change. Not while a
// question is on screen; and the name box opening over it (Cmd+S) ends the press.
export function tick(studio, drag, now) {
  if (drag.what !== 'setting') return;
  if (studio.naming) {
    drag.what = null;
    return;
  }
  if (!drag.dir || drag.moved || studio.asking) return;
  while (now >= drag.down + repeatAt(drag.repeats)) {
    const before = studio.version;
    setSetting(studio, drag.which, stepped(drag.which, settingIndex(studio, drag.which), drag.dir), drag.begun);
    if (studio.version !== before) drag.begun = true;
    drag.repeats++;
  }
}

// The mouse comes up: the finger lets go. The key or the length clicked without a drag steps on: the
// key to the next mood, the length to the next. (The tempo and the swing stepped as it went down.)
export function mouseUp(studio, drag) {
  if (drag.what === 'pad') letGo(studio);
  if (drag.what === 'setting' && !drag.moved && (drag.which === 'mood' || drag.which === 'bars')) {
    setSetting(studio, drag.which, drag.which === 'bars' ? (drag.from + 1) % LENGTHS.length : drag.from + 1, false);
  }
  drag.what = null;
}

// The scroll wheel (dy, down the page) at page time `now`: over the rhythm wheel it turns it, and over
// the tempo, the swing or the octave button it steps it as its arrows do, wheel up for ▲. A trackpad
// sends a stream of small events, so those step at most once every WHEEL_GAP seconds; and a run of
// steps on one setting, each within WHEEL_RUN of the last and nothing else changed between, is one
// change for Undo (so a swipe doesn't fill the undo list). `wheel` is the controls' state for that:
// { at, which, version, begun }, the last step's time and control, the beat's version after it, and
// whether its run has changed the beat yet.
export function scroll(studio, x, y, dy, now = 0, wheel = {}) {
  const target = studioHit(studio, x, y);
  if (!dy || !target) return;
  if (target.hit === 'wheel') turnRhythm(studio, Math.sign(dy));
  else if (target.dir && (wheel.at === undefined || now - wheel.at >= WHEEL_GAP)) {
    const dir = dy < 0 ? 1 : -1, which = target.which, before = studio.version;
    const again = wheel.begun && wheel.which === which && now - wheel.at < WHEEL_RUN && wheel.version === before;
    if (target.hit === 'setting') setSetting(studio, which, stepped(which, settingIndex(studio, which), dir), again);
    else moveRange(studio, dir); // the octave button, the only other with arrows
    Object.assign(wheel, { at: now, which, version: studio.version, begun: again || studio.version !== before });
  }
}
