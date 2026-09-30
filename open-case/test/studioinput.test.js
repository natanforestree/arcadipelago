import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keyDown, keyUp, mouseDown, mouseMove, mouseUp, scroll, tick } from '../src/studioinput.js';
import { createStudio, newBeat, advance, setTab, setTempo, setSwing, openBeat, startNaming } from '../src/studio.js';
import { NAME, TAB_BOXES, SETTINGS, WHEEL, BUTTONS, PAD, LIST_BUTTONS, NAME_BUTTONS } from '../src/studioview.js';
import { clockOf, blankBeat, LOFI, readyBeat } from '../src/beats.js';
import { STUDIO } from '../src/tuning.js';

const empty = () => ({ slots: Array(STUDIO.slots).fill(null), chosen: null });
const mid = ([x, y, w, h]) => [x + w / 2, y + h / 2];
const key = (code, over = {}) => ({ code, repeat: false, shiftKey: false, metaKey: false, ctrlKey: false, altKey: false, ...over });
function blank() {
  const studio = createStudio(empty());
  newBeat(studio);
  return studio;
}

test('a pad key holds the pad until it comes up: A to F the drums, A to K the notes and chords', () => {
  const studio = blank(), held = { key: null };
  studio.rhythm.drums = 3; // every beat
  keyDown(studio, held, key('KeyS'), 0);
  assert.deepEqual([studio.held.part, studio.held.row], ['drums', 1]);
  advance(studio, clockOf(studio.beat).bar - STUDIO.ahead - 0.01); // just short of the next bar
  keyUp(studio, held, key('KeyS'));
  assert.equal(studio.held, null);
  assert.deepEqual(studio.beat.drums.map((h) => [h.drum, h.s]), [['snare', 0], ['snare', 4], ['snare', 8], ['snare', 12]]);
  keyDown(studio, held, key('KeyJ'), 0);
  assert.equal(studio.held, null, 'no fifth drum strip');
  setTab(studio, 'chords');
  keyDown(studio, held, key('KeyK'), 0);
  assert.deepEqual([studio.held.col, studio.held.y], [7, 0.5]);
  keyDown(studio, held, key('KeyK', { repeat: true }), 0.1);
  assert.equal(studio.held.col, 7, 'key repeat changes nothing');
});

test('arrows turn the wheel, Tab moves on a part, Backspace erases while held, Shift+Backspace clears, Cmd+Z undoes', () => {
  const studio = blank(), held = { key: null };
  keyDown(studio, held, key('ArrowDown'), 0);
  assert.equal(studio.rhythm.drums, 4);
  keyDown(studio, held, key('ArrowUp'), 0);
  keyDown(studio, held, key('ArrowUp'), 0);
  assert.equal(studio.rhythm.drums, 2);
  keyDown(studio, held, key('Tab'), 0);
  assert.equal(studio.tab, 'bass');
  keyDown(studio, held, key('KeyX'), 0);
  assert.equal(studio.range, 1, 'X: the bass an octave up');
  keyDown(studio, held, key('KeyZ'), 0);
  keyDown(studio, held, key('KeyZ'), 0);
  assert.equal(studio.range, -1);
  keyDown(studio, held, key('Backspace'), 0);
  assert.equal(studio.erase, true);
  keyUp(studio, held, key('Backspace'));
  assert.equal(studio.erase, false);
  studio.beat.bass.push({ s: 0, degree: 0, len: 4, vel: 0.8, tone: 0.5 });
  keyDown(studio, held, key('Backspace', { shiftKey: true }), 0);
  assert.deepEqual(studio.beat.bass, []);
  keyDown(studio, held, key('KeyZ', { metaKey: true }), 0);
  assert.equal(studio.beat.bass.length, 1, 'the clear, undone');
});

test('Esc closes the list, or leaves things as they were while asking, or else leaves the studio', () => {
  const studio = blank(), held = { key: null };
  studio.list = true;
  assert.equal(keyDown(studio, held, key('Escape'), 0), null);
  assert.equal(studio.list, false);
  studio.asking = { make: 'new' };
  assert.equal(keyDown(studio, held, key('Escape'), 0), null);
  assert.equal(studio.asking, null);
  assert.equal(keyDown(studio, held, key('Escape'), 0), 'leave');
});

test('the mouse holds the pad where it goes down, follows your finger, and lets go when it comes up', () => {
  const studio = blank(), drag = { what: null };
  setTab(studio, 'bass');
  studio.rhythm.bass = 6; // 8ths
  const [x0, y0, w, h] = PAD;
  mouseDown(studio, drag, x0 + 2, y0 + h / 2, 0);
  assert.equal(drag.what, 'pad');
  advance(studio, 0.2);
  mouseMove(studio, drag, x0 + w - 2, y0 + 2);
  advance(studio, 0.7);
  mouseUp(studio, drag);
  assert.equal(studio.held, null);
  assert.deepEqual(studio.beat.bass.map((b) => [b.s, b.degree, b.tone]), [[0, 0, 0.5], [2, 7, 0.98], [4, 7, 0.98]], 'then where the finger went, at the top: brightest');
});

test('a setting follows a drag up or down, and one Undo takes the whole drag back', () => {
  const studio = blank(), drag = { what: null };
  const [x, y] = mid(SETTINGS.bpm);
  mouseDown(studio, drag, x, y, 0);
  for (let dy = 1; dy <= 20; dy++) mouseMove(studio, drag, x, y - dy);
  mouseUp(studio, drag);
  assert.equal(studio.beat.bpm, 100, '2 pixels a beat per minute');
  assert.equal(studio.undo.length, 1);
  mouseDown(studio, drag, ...mid(BUTTONS.undo), 0);
  assert.equal(studio.beat.bpm, 90);
});

test('a click on the key or the length (without a drag) steps it on', () => {
  const studio = blank(), drag = { what: null };
  mouseDown(studio, drag, ...mid(SETTINGS.mood), 0);
  mouseUp(studio, drag);
  assert.equal(studio.beat.mood, 'C', 'after A minor, round to C major');
  mouseDown(studio, drag, ...mid(SETTINGS.bars), 0);
  mouseUp(studio, drag);
  assert.equal(studio.beat.bars, 1, 'after 4 bars, round to 1');
});

// A point on the upper half of a box (where its ▲ is), and on the lower half (its ▼).
const upper = ([x, y, w, h]) => [x + w / 2, y + 2];
const lower = ([x, y, w, h]) => [x + w / 2, y + h - 2];
// A click (down, and up at once) at page time `now`.
function click(studio, drag, [x, y], now = 0) {
  const what = mouseDown(studio, drag, x, y, 0, now);
  mouseUp(studio, drag);
  return what;
}

test('a click on the upper half of the tempo steps it up a beat per minute, on the lower half down, from 60 to 140', () => {
  const studio = blank(), drag = { what: null };
  click(studio, drag, upper(SETTINGS.bpm));
  assert.equal(studio.beat.bpm, 91);
  click(studio, drag, lower(SETTINGS.bpm));
  click(studio, drag, lower(SETTINGS.bpm));
  assert.equal(studio.beat.bpm, 89);
  assert.equal(studio.undo.length, 3, 'each click a change of its own');
  mouseDown(studio, drag, ...upper(SETTINGS.bpm), 0);
  assert.equal(studio.beat.bpm, 90, 'it steps as the mouse goes down');
  mouseUp(studio, drag);
  assert.equal(studio.beat.bpm, 90, 'and not again as it comes up');
  setTempo(studio, 140);
  click(studio, drag, upper(SETTINGS.bpm));
  assert.equal(studio.beat.bpm, 140, 'at the top it stays');
  setTempo(studio, 60);
  click(studio, drag, lower(SETTINGS.bpm));
  assert.equal(studio.beat.bpm, 60, 'and at the bottom');
});

test('the swing steps through off, 54, 58, 62, 66, 70 and 75%: one click up from off turns it on', () => {
  const studio = blank(), drag = { what: null };
  assert.equal(studio.beat.swing, 0.5, 'a new beat starts straight: off');
  const seen = [];
  for (let i = 0; i < 7; i++) {
    click(studio, drag, upper(SETTINGS.swing));
    seen.push(studio.beat.swing);
  }
  assert.deepEqual(seen, [0.54, 0.58, 0.62, 0.66, 0.7, 0.75, 0.75], 'and at 75% it stays');
  const down = [];
  for (let i = 0; i < 7; i++) {
    click(studio, drag, lower(SETTINGS.swing));
    down.push(studio.beat.swing);
  }
  assert.deepEqual(down, [0.7, 0.66, 0.62, 0.58, 0.54, 0.5, 0.5], 'down to off, where it stays');
});

test('from a swing between two steps (a drag or the reggae can leave one), ▲ goes to the next step above and ▼ the next below', () => {
  const studio = blank(), drag = { what: null };
  setSwing(studio, 0.57);
  click(studio, drag, upper(SETTINGS.swing));
  assert.equal(studio.beat.swing, 0.58);
  setSwing(studio, 0.57);
  click(studio, drag, lower(SETTINGS.swing));
  assert.equal(studio.beat.swing, 0.54);
  setSwing(studio, 0.73);
  click(studio, drag, upper(SETTINGS.swing));
  assert.equal(studio.beat.swing, 0.75);
  setSwing(studio, 0.51);
  click(studio, drag, lower(SETTINGS.swing));
  assert.equal(studio.beat.swing, 0.5, 'just above off, ▼ turns it off');
  const reggae = createStudio(empty()), rd = { what: null };
  openBeat(reggae, { ready: 'reggae' });
  click(reggae, rd, upper(SETTINGS.swing));
  assert.equal(reggae.beat.swing, 0.58, "the reggae's 55%, up to 58 (in your copy)");
});

test('holding the tempo keeps stepping: after 0.4 s, a step every 0.1 s, every 0.04 s once held 1.5 s; the whole hold is one Undo', () => {
  const studio = blank(), drag = { what: null };
  const held = (s) => tick(studio, drag, 10 + s); // s seconds after the mouse went down, at 10 s of page time
  mouseDown(studio, drag, ...upper(SETTINGS.bpm), 0, 10);
  assert.equal(studio.beat.bpm, 91);
  held(0.39);
  assert.equal(studio.beat.bpm, 91, 'nothing more for 0.4 s');
  held(0.41);
  assert.equal(studio.beat.bpm, 92);
  held(0.49);
  assert.equal(studio.beat.bpm, 92);
  held(0.51);
  assert.equal(studio.beat.bpm, 93, 'then a step every 0.1 s');
  held(1.51);
  assert.equal(studio.beat.bpm, 91 + 12, 'twelve repeats, from 0.4 s to 1.5 s (a late frame catches up)');
  held(1.53);
  assert.equal(studio.beat.bpm, 103);
  held(1.55);
  assert.equal(studio.beat.bpm, 104, 'and once held 1.5 s, a step every 0.04 s');
  held(2.01);
  assert.equal(studio.beat.bpm, 115, 'twelve from 1.54 s to 1.98 s');
  mouseUp(studio, drag);
  held(3);
  assert.equal(studio.beat.bpm, 115, 'letting go stops it');
  assert.equal(studio.undo.length, 1, 'the whole hold, one change');
  mouseDown(studio, drag, ...mid(BUTTONS.undo), 0, 13);
  assert.equal(studio.beat.bpm, 90);
});

test('holding the swing steps it on the same way, and it stays at 75%; a held key or length does not repeat', () => {
  const studio = blank(), drag = { what: null };
  mouseDown(studio, drag, ...upper(SETTINGS.swing), 0, 0);
  tick(studio, drag, 0.41);
  assert.equal(studio.beat.swing, 0.58);
  tick(studio, drag, 3);
  assert.equal(studio.beat.swing, 0.75);
  mouseUp(studio, drag);
  assert.equal(studio.undo.length, 1);
  setTempo(studio, 139);
  mouseDown(studio, drag, ...upper(SETTINGS.bpm), 0, 5);
  tick(studio, drag, 8);
  mouseUp(studio, drag);
  assert.equal(studio.beat.bpm, 140, 'the tempo held up stays at 140');
  mouseDown(studio, drag, ...mid(SETTINGS.mood), 0, 10);
  tick(studio, drag, 13);
  mouseUp(studio, drag);
  assert.equal(studio.beat.mood, 'C', 'the key steps once, as the mouse comes up');
});

test('a press that then moves up or down becomes a drag, from where the tempo was when the mouse went down, and stops repeating', () => {
  const studio = blank(), drag = { what: null };
  const [x, y] = upper(SETTINGS.bpm);
  mouseDown(studio, drag, x, y, 0, 0);
  assert.equal(studio.beat.bpm, 91);
  mouseMove(studio, drag, x + 3, y - 1);
  assert.equal(studio.beat.bpm, 91, 'less than a drag step: still a press');
  tick(studio, drag, 0.45);
  assert.equal(studio.beat.bpm, 92, 'so it repeats');
  mouseMove(studio, drag, x, y + 4);
  assert.equal(studio.beat.bpm, 88, 'two steps down from 90, where it was when the mouse went down');
  tick(studio, drag, 1);
  tick(studio, drag, 3);
  assert.equal(studio.beat.bpm, 88, 'no more repeats');
  mouseMove(studio, drag, x, y - 20);
  assert.equal(studio.beat.bpm, 100, '2 pixels a beat per minute, as before');
  mouseUp(studio, drag);
  assert.equal(studio.undo.length, 1, 'the press, its repeat and the drag: one change');
  mouseDown(studio, drag, ...mid(BUTTONS.undo), 0, 4);
  assert.equal(studio.beat.bpm, 90);
  const [sx, sy] = lower(SETTINGS.swing);
  mouseDown(studio, drag, sx, sy, 0, 5);
  mouseMove(studio, drag, sx, sy - 16);
  mouseUp(studio, drag);
  assert.equal(studio.beat.swing, 0.58, 'the swing dragged up 8 points from off (the press, at off, changed nothing)');
});

test('with every slot full, a press or a hold on a ready-made beat\'s tempo asks which slot to replace, and nothing changes', () => {
  const beats = empty();
  for (let i = 0; i < STUDIO.slots; i++) beats.slots[i] = blankBeat(`Beat ${i + 1}`);
  const studio = createStudio(beats), drag = { what: null }, before = studio.version;
  mouseDown(studio, drag, ...upper(SETTINGS.bpm), 0, 0);
  assert.deepEqual(studio.asking, { make: 'copy' });
  for (let i = 1; i <= 120; i++) tick(studio, drag, i / 60);
  mouseUp(studio, drag);
  assert.equal(studio.beat, LOFI);
  assert.equal(LOFI.bpm, 80);
  assert.equal(studio.version, before, 'no change at all');
  assert.deepEqual(beats.slots.map((b) => b.bpm), [90, 90, 90, 90, 90, 90]);
});

test('the scroll wheel over the tempo or the swing steps it as its arrows do (wheel up is ▲), at most once in 60 ms', () => {
  const studio = blank(), wheel = {};
  const [bx, by] = mid(SETTINGS.bpm);
  scroll(studio, bx, by, -3, 10, wheel);
  assert.equal(studio.beat.bpm, 91, 'wheel up: ▲, anywhere over it');
  for (let i = 1; i <= 5; i++) scroll(studio, bx, by, -3, 10 + i / 100, wheel);
  assert.equal(studio.beat.bpm, 91, "a trackpad's stream of small events: once in 60 ms");
  scroll(studio, bx, by, -3, 10.061, wheel);
  assert.equal(studio.beat.bpm, 92);
  scroll(studio, ...upper(SETTINGS.bpm), 120, 10.2, wheel);
  assert.equal(studio.beat.bpm, 91, 'wheel down: ▼, anywhere over it');
  for (let i = 0; i < 60; i++) scroll(studio, bx, by, -2, 11 + i * 0.016, wheel); // a swipe: an event every 16 ms
  assert.equal(studio.beat.bpm, 91 + 15, 'a step every fourth event (64 ms): 15, not 60');
  const [sx, sy] = lower(SETTINGS.swing);
  scroll(studio, sx, sy, -100, 13, wheel);
  assert.equal(studio.beat.swing, 0.54, 'the swing: up from off, to 54%');
  scroll(studio, sx, sy, 100, 13.1, wheel);
  scroll(studio, sx, sy, 100, 13.2, wheel);
  assert.equal(studio.beat.swing, 0.5, 'and down to off, where it stays');
  scroll(studio, sx, sy, 0, 13.3, wheel);
  assert.equal(studio.beat.swing, 0.5, 'a sideways scroll does nothing');
  const was = JSON.stringify(studio.beat);
  scroll(studio, ...mid(SETTINGS.mood), -100, 14, wheel);
  scroll(studio, ...mid(SETTINGS.bars), -100, 14.1, wheel);
  assert.equal(JSON.stringify(studio.beat), was, 'the key and the length: untouched');
});

test("the rhythm wheel's scrolling is as it was: every event turns it, however close", () => {
  const studio = blank(), wheel = {};
  studio.rhythm.drums = 3;
  scroll(studio, WHEEL[0], WHEEL[1], 40, 20, wheel);
  scroll(studio, WHEEL[0], WHEEL[1], 40, 20.001, wheel);
  assert.equal(studio.rhythm.drums, 5);
  scroll(studio, ...mid(SETTINGS.bpm), -3, 20.002, wheel);
  assert.equal(studio.beat.bpm, 91, "and the wheel's turning holds up no setting");
});

test("a click on the octave button's upper half raises the bass pad an octave, on its lower half lowers it, from -1 to +1 (no wrapping)", () => {
  const studio = blank(), drag = { what: null };
  setTab(studio, 'bass');
  const seen = [];
  for (const at of [upper, upper, lower, lower, lower, upper]) {
    click(studio, drag, at(BUTTONS.range));
    seen.push(studio.range);
  }
  assert.deepEqual(seen, [1, 1, 0, -1, -1, 0], 'at either end it stays');
  click(studio, drag, lower(BUTTONS.range));
  mouseDown(studio, drag, ...upper(BUTTONS.range), 0, 10);
  tick(studio, drag, 13);
  mouseUp(studio, drag);
  assert.equal(studio.range, 0, 'from -1, a press steps it once, however long it is held');
  assert.equal(studio.undo.length, 0, 'the octave is where the pad plays, not a change to the beat');
});

test('the scroll wheel over the octave button steps it, wheel up raising it, at most once in 60 ms', () => {
  const studio = blank(), wheel = {};
  setTab(studio, 'bass');
  const [x, y] = mid(BUTTONS.range);
  scroll(studio, x, y, -100, 1, wheel);
  assert.equal(studio.range, 1);
  scroll(studio, x, y, 100, 1.03, wheel);
  assert.equal(studio.range, 1, 'within 60 ms: nothing');
  scroll(studio, x, y, 100, 1.1, wheel);
  scroll(studio, x, y, 100, 1.2, wheel);
  scroll(studio, x, y, 100, 1.3, wheel);
  assert.equal(studio.range, -1, 'down to -1, where it stays');
});

test('off the bass tab the octave button is inert, to a click or the wheel, and Z and X too; on it, Z and X work as before', () => {
  const studio = blank(), drag = { what: null }, held = { key: null }, wheel = {};
  for (const tab of ['drums', 'chords', 'mix']) {
    setTab(studio, tab);
    click(studio, drag, upper(BUTTONS.range));
    click(studio, drag, lower(BUTTONS.range));
    scroll(studio, ...mid(BUTTONS.range), -100, tab.length, wheel);
    keyDown(studio, held, key('KeyX'), 0);
    assert.equal(studio.range, 0, tab);
  }
  setTab(studio, 'bass');
  keyDown(studio, held, key('KeyX'), 0);
  keyDown(studio, held, key('KeyX'), 0);
  assert.equal(studio.range, 1, 'X: up an octave, and no further');
  keyDown(studio, held, key('KeyZ'), 0);
  assert.equal(studio.range, 0, 'Z: down an octave');
});

test('tabs, the name, the wheel, the buttons and the scroll wheel', () => {
  const studio = blank(), drag = { what: null };
  mouseDown(studio, drag, ...mid(TAB_BOXES.chords), 0);
  assert.equal(studio.tab, 'chords');
  mouseDown(studio, drag, WHEEL[0], WHEEL[1] + 12, 0);
  assert.equal(studio.rhythm.chords, 6);
  scroll(studio, WHEEL[0], WHEEL[1], -40);
  assert.equal(studio.rhythm.chords, 5);
  scroll(studio, PAD[0] + 5, PAD[1] + 5, 40);
  assert.equal(studio.rhythm.chords, 5, 'only over the wheel');
  mouseDown(studio, drag, ...mid(BUTTONS.sound), 0);
  assert.equal(studio.beat.sounds.chords, 'nylon');
  mouseDown(studio, drag, ...mid(BUTTONS.erase), 0);
  assert.equal(studio.erase, true, 'with the mouse, Erase is a switch');
  mouseDown(studio, drag, ...mid(BUTTONS.erase), 0);
  assert.equal(studio.erase, false);
  mouseDown(studio, drag, ...mid(NAME), 0);
  assert.equal(studio.list, true);
});

test("the list: open a beat, Busk to this (so main.js keeps the choice), New, and Close", () => {
  const studio = blank(), drag = { what: null };
  studio.list = true;
  mouseDown(studio, drag, PAD[0] + 20, PAD[1] + 14 + 2 * 11 + 5, 0); // the third ready-made beat
  assert.deepEqual(studio.open, { ready: 'funk' });
  assert.equal(studio.list, false, 'opening a beat closes the list');
  studio.list = true;
  assert.equal(mouseDown(studio, drag, PAD[0] + 60, PAD[1] + 98, 0), 'busk');
  assert.deepEqual(studio.beats.chosen, { ready: 'funk' });
  studio.list = true;
  mouseDown(studio, drag, PAD[0] + 20, PAD[1] + 98, 0);
  assert.deepEqual(studio.open, { slot: 1 }, 'New: a blank beat in the next slot');
  studio.list = true;
  mouseDown(studio, drag, PAD[0] + 200, PAD[1] + 98, 0);
  assert.equal(studio.list, false);
});

test('the Mix: a fader follows the mouse as one change; a mute and the switches flip', () => {
  const studio = blank(), drag = { what: null };
  setTab(studio, 'mix');
  mouseDown(studio, drag, 111, 38 + 31, 0); // the drums fader, halfway
  assert.equal(studio.beat.mix.levels.drums, 0.5);
  mouseMove(studio, drag, 111, 38 + 62);
  mouseUp(studio, drag);
  assert.equal(studio.beat.mix.levels.drums, 0);
  assert.equal(studio.undo.length, 1);
  mouseDown(studio, drag, 104 + 7, 106 + 5, 0);
  assert.equal(studio.beat.mix.muted.drums, true);
  mouseDown(studio, drag, 275, 45, 0);
  assert.equal(studio.beat.mix.pad, true);
  mouseDown(studio, drag, 275, 61, 0);
  assert.equal(studio.beat.mix.vinyl, true);
});

// The drums fader's knob at full, and the fader halfway down.
const KNOB = [111, 38], HALF = 38 + 31;
function dragDrums(studio, drag) {
  mouseDown(studio, drag, ...KNOB, 0);
  for (let y = KNOB[1] + 1; y <= HALF; y++) mouseMove(studio, drag, KNOB[0], y);
  mouseUp(studio, drag);
}

test('on a ready-made beat, a Mix fader grabbed at its knob and dragged moves, makes your copy, and one Undo takes the drag back', () => {
  const studio = createStudio(empty()), drag = { what: null };
  setTab(studio, 'mix');
  mouseDown(studio, drag, ...KNOB, 0);
  assert.equal(studio.beat, LOFI, 'grabbing it where it is changes nothing yet');
  for (let y = KNOB[1] + 1; y <= HALF; y++) mouseMove(studio, drag, KNOB[0], y);
  mouseUp(studio, drag);
  assert.equal(studio.beat.mix.levels.drums, 0.5, 'it follows the mouse');
  assert.deepEqual(studio.open, { slot: 0 });
  assert.equal(studio.beat.name, 'Lo-fi 2', 'your copy');
  assert.equal(LOFI.mix.levels.drums, 1, 'the ready-made lo-fi never changes');
  mouseDown(studio, drag, ...mid(BUTTONS.undo), 0);
  assert.equal(studio.beat.mix.levels.drums, 1, 'one Undo takes the whole drag back');
  assert.equal(studio.undo.length, 0);
});

test('on your own beat, a fader drag from its knob is one change of its own: Undo takes back only the drag', () => {
  const studio = blank(), drag = { what: null };
  setTempo(studio, 100);
  setTab(studio, 'mix');
  dragDrums(studio, drag);
  assert.equal(studio.beat.mix.levels.drums, 0.5);
  mouseDown(studio, drag, ...mid(BUTTONS.undo), 0);
  assert.deepEqual([studio.beat.mix.levels.drums, studio.beat.bpm], [1, 100], 'the drag undone, the tempo kept');
});

test('with every slot full, the same fader drag asks which slot to replace and changes nothing', () => {
  const beats = empty();
  for (let i = 0; i < STUDIO.slots; i++) beats.slots[i] = blankBeat(`Beat ${i + 1}`);
  const studio = createStudio(beats), drag = { what: null };
  setTab(studio, 'mix');
  dragDrums(studio, drag);
  assert.deepEqual(studio.asking, { make: 'copy' });
  assert.equal(studio.beat, LOFI);
  assert.equal(LOFI.mix.levels.drums, 1);
  assert.deepEqual(beats.slots.map((b) => b.name), ['Beat 1', 'Beat 2', 'Beat 3', 'Beat 4', 'Beat 5', 'Beat 6']);
});

test('Cmd+Shift+Z (Ctrl+Shift+Z) is redo elsewhere, so it does not undo', () => {
  const studio = blank(), held = { key: null };
  setTempo(studio, 100);
  keyDown(studio, held, key('KeyZ', { metaKey: true, shiftKey: true }), 0);
  keyDown(studio, held, key('KeyZ', { ctrlKey: true, shiftKey: true }), 0);
  assert.equal(studio.beat.bpm, 100);
  keyDown(studio, held, key('KeyZ', { ctrlKey: true }), 0);
  assert.equal(studio.beat.bpm, 90, 'Ctrl+Z still undoes');
});

test("Cmd coming up lets go of a held pad key, whose own keyup macOS never sends while Cmd is down", () => {
  const studio = blank(), held = { key: null };
  keyDown(studio, held, key('KeyA'), 0);
  assert.ok(studio.held);
  keyUp(studio, held, key('MetaLeft', { key: 'Meta' }));
  assert.equal(studio.held, null);
  assert.equal(held.key, null);
});

// A key typed in the name box: its code, and the character it types (e.key).
const typed = (ch) => key(/[a-z]/i.test(ch) ? `Key${ch.toUpperCase()}` : /[0-9]/.test(ch) ? `Digit${ch}` : 'Space', { key: ch, shiftKey: ch !== ch.toLowerCase() });

test('Cmd+S and Ctrl+S open the name box, from the pad or the list', () => {
  const studio = blank(), held = { key: null };
  assert.equal(keyDown(studio, held, key('KeyS', { metaKey: true, key: 's' }), 0), null);
  assert.deepEqual(studio.naming, { text: 'Beat 1' });
  assert.equal(studio.held, null, 'S is no pad key here');
  keyDown(studio, held, key('Escape'), 0);
  assert.equal(studio.naming, null);
  keyDown(studio, held, key('KeyS', { ctrlKey: true, key: 's' }), 0);
  assert.deepEqual(studio.naming, { text: 'Beat 1' }, 'Ctrl+S, with the list open');
  const ready = createStudio(empty());
  keyDown(ready, { key: null }, key('KeyS', { metaKey: true, key: 's' }), 0);
  assert.equal(ready.beat.name, 'Lo-fi 2', 'a ready-made beat is copied first');
  assert.deepEqual(ready.naming, { text: 'Lo-fi 2' });
});

test('while naming, the keys type: a pad key types and never presses the pad, and arrows, Tab, Z and X do nothing', () => {
  const studio = blank(), held = { key: null };
  startNaming(studio);
  const before = JSON.stringify({ ...studio, naming: null });
  for (const ch of 'asdf') assert.equal(keyDown(studio, held, typed(ch), 0), null);
  assert.equal(studio.held, null, 'the pad is never pressed');
  assert.equal(held.key, null);
  for (const code of ['ArrowUp', 'ArrowDown', 'Tab']) keyDown(studio, held, key(code), 0);
  keyDown(studio, held, key('KeyZ', { metaKey: true }), 0);
  assert.equal(studio.naming.text, 'Beat 1asdf');
  for (const ch of 'zx') keyDown(studio, held, typed(ch), 0);
  assert.equal(studio.naming.text, 'Beat 1asdfzx', 'Z and X type too');
  assert.equal(JSON.stringify({ ...studio, naming: null }), before, 'nothing else changed: the wheel, the tab, the octave, the beat');
  keyDown(studio, held, key('Backspace', { key: 'Backspace' }), 0);
  keyDown(studio, held, key('Backspace', { key: 'Backspace', repeat: true }), 0);
  assert.equal(studio.naming.text, 'Beat 1asdf', 'Backspace deletes the last, and deletes on as it repeats');
  assert.equal(studio.erase, false, 'and never erases');
  keyUp(studio, held, key('Backspace'));
  keyDown(studio, held, key('Escape', { key: 'Escape' }), 0);
  assert.equal(studio.naming, null, 'Esc: back to the list, nothing changed');
  assert.equal(studio.list, true);
  assert.equal(studio.beat.name, 'Beat 1');
});

test('in the name box, Enter saves the name and goes back to the list', () => {
  const studio = blank(), held = { key: null };
  startNaming(studio);
  for (let i = 0; i < 6; i++) keyDown(studio, held, key('Backspace', { key: 'Backspace' }), 0);
  for (const ch of 'Late Tram 7') keyDown(studio, held, typed(ch), 0);
  assert.equal(keyDown(studio, held, key('Enter', { key: 'Enter' }), 3.25), null);
  assert.equal(studio.beat.name, 'Late Tram 7');
  assert.equal(studio.list, true);
  assert.equal(studio.saved, 3.25, 'saved at the band time of the key');
});

test("a click on the list's Save opens the name box, and its save and cancel buttons work; Busk to this still says 'busk'", () => {
  const studio = blank(), drag = { what: null };
  const mid = ([x, y, w, h]) => [x + w / 2, y + h / 2];
  studio.list = true;
  mouseDown(studio, drag, ...mid(LIST_BUTTONS.save), 0);
  assert.deepEqual(studio.naming, { text: 'Beat 1' });
  studio.naming.text = 'Mine';
  mouseDown(studio, drag, ...mid(NAME_BUTTONS.cancel), 0);
  assert.equal(studio.naming, null);
  assert.equal(studio.beat.name, 'Beat 1', 'cancel keeps the name');
  assert.equal(studio.list, true);
  mouseDown(studio, drag, ...mid(LIST_BUTTONS.save), 0);
  studio.naming.text = 'Mine';
  mouseDown(studio, drag, ...mid(NAME_BUTTONS.save), 2);
  assert.equal(studio.beat.name, 'Mine');
  assert.equal(studio.saved, 2);
  assert.equal(studio.list, true, 'back to the list');
  openBeat(studio, { ready: 'bossa' });
  studio.list = true;
  assert.equal(mouseDown(studio, drag, ...mid(LIST_BUTTONS.busk), 0), 'busk');
  assert.deepEqual(studio.beats.chosen, { ready: 'bossa' });
  assert.equal(readyBeat('bossa').name, 'Bossa nova');
});
