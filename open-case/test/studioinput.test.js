import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keyDown, keyUp, mouseDown, mouseMove, mouseUp, scroll } from '../src/studioinput.js';
import { createStudio, newBeat, advance, setTab } from '../src/studio.js';
import { NAME, TAB_BOXES, SETTINGS, WHEEL, BUTTONS, PAD } from '../src/studioview.js';
import { clockOf } from '../src/beats.js';
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
  mouseDown(studio, drag, ...mid(SETTINGS.bpm), 0);
  mouseUp(studio, drag);
  assert.equal(studio.beat.bpm, 90, 'a click on the tempo alone changes nothing');
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
