// The studio's controls: the mouse is your finger on the pad, and the keys stand in for it. These turn
// key and mouse events (in scene pixels, at band time t) into studio.js's actions; main.js feeds them
// and does what they return. Pure, so it's tested in Node.
//
// Keys: A S D F the drum strips, A to K the bass notes or chords; up and down turn the rhythm wheel;
// Tab the next part; Backspace (held) erases, Shift+Backspace clears the part; Z and X move the bass
// pad down or up an octave; Cmd+Z (Ctrl+Z) undoes; Esc closes the list, or leaves.
import {
  PARTS, DRUMS, LENGTHS, press, moveTo, letGo, setErase, turnRhythm, nextTab, setTab, clearPart, undoChange, moveRange, nextSound,
  setTempo, setSwing, setMood, setLength, setLevel, setPump, toggleMute, togglePad, toggleVinyl, openBeat, newBeat, buskTo, replaceSlot,
  cancelAsk,
} from './studio.js';
import { studioHit, padAt, faderValue } from './studioview.js';
import { MOODS } from './beats.js';

const PAD_KEYS = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK'];
const KEY_VEL = 0.7, KEY_TONE = 0.5; // a drum played from its key, and a note or chord's tone
const DRAG = { bpm: 2, swing: 2, mood: 10, bars: 12 }; // pixels of drag for each step of a setting

// A key goes down. Returns what main.js should do beyond the studio: 'leave', 'busk' (save the
// choice), or null. `held` is the controls' own state: { key } for a pad key held.
export function keyDown(studio, held, e, t) {
  if (e.repeat) return null;
  if ((e.metaKey || e.ctrlKey) && e.code === 'KeyZ') {
    undoChange(studio);
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

export function keyUp(studio, held, e) {
  if (e.code === held.key) {
    letGo(studio);
    held.key = null;
  }
  if (e.code === 'Backspace') setErase(studio, false);
}

// The mouse goes down at (x, y). Returns 'busk' after Busk to this, or null. `drag` is the controls'
// state for what the mouse holds until it comes up.
export function mouseDown(studio, drag, x, y, t) {
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
      button(studio, target.which);
      break;
    case 'pad':
      if (press(studio, t, target.at)) drag.what = 'pad';
      break;
    case 'setting':
      drag.what = 'setting';
      Object.assign(drag, { which: target.which, y, from: settingIndex(studio, target.which), begun: false, moved: false });
      break;
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

function button(studio, which) {
  if (which === 'sound') nextSound(studio);
  else if (which === 'range') moveRange(studio, studio.range === 1 ? -2 : 1);
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
    const steps = Math.trunc((drag.y - y) / DRAG[drag.which]);
    if (!steps && !drag.moved) return;
    drag.moved = true;
    const before = studio.version;
    setSetting(studio, drag.which, drag.from + steps, drag.begun);
    if (studio.version !== before) drag.begun = true;
  }
}

// The mouse comes up: the finger lets go. A setting clicked without a drag steps on: the key to the
// next mood, the length to the next.
export function mouseUp(studio, drag) {
  if (drag.what === 'pad') letGo(studio);
  if (drag.what === 'setting' && !drag.moved && (drag.which === 'mood' || drag.which === 'bars')) {
    setSetting(studio, drag.which, drag.which === 'bars' ? (drag.from + 1) % LENGTHS.length : drag.from + 1, false);
  }
  drag.what = null;
}

// The scroll wheel over the rhythm wheel turns it.
export function scroll(studio, x, y, dy) {
  const target = studioHit(studio, x, y);
  if (target?.hit === 'wheel' && dy) turnRhythm(studio, Math.sign(dy));
}
