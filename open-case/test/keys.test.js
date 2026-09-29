import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createKeyState, noteFor, applyControl, toPentatonic, layoutPitches, NOTE_KEYS, CONTROL_KEYS, PEDAL_KEYS, shopKey } from '../src/keys.js';

test('the Musical Typing layout: A is C4, the row runs up to F, the black keys sit above', () => {
  const ks = createKeyState();
  assert.equal(noteFor('KeyA', ks), 60);
  assert.equal(noteFor('KeyW', ks), 61);
  assert.equal(noteFor('KeyJ', ks), 71);
  assert.equal(noteFor('KeyK', ks), 72);
  assert.equal(noteFor('Quote', ks), 77);
  assert.equal(noteFor('KeyP', ks), 75);
  assert.equal(noteFor('KeyQ', ks), null, 'not a note key');
  assert.equal(Object.keys(NOTE_KEYS).length, 18);
});

test('Z and X shift an octave, from -2 to +1; keys outside the guitar (E2 to E6) are silent', () => {
  const ks = createKeyState();
  assert.equal(applyControl(ks, 'octaveDown'), true);
  applyControl(ks, 'octaveDown');
  assert.equal(applyControl(ks, 'octaveDown'), false, 'already at -2');
  assert.equal(ks.octave, -2);
  assert.equal(noteFor('KeyA', ks), null, 'C2 is below the low E');
  assert.equal(noteFor('KeyD', ks), 40, 'E2 is the lowest note');
  for (let i = 0; i < 5; i++) applyControl(ks, 'octaveUp');
  assert.equal(ks.octave, 1);
  assert.equal(noteFor('Semicolon', ks), 88, 'E6 is the highest');
  assert.equal(noteFor('Quote', ks), null);
});

test('C and V step the pick strength through 1 to 4, starting at 3', () => {
  const ks = createKeyState();
  assert.equal(ks.strength, 3);
  applyControl(ks, 'louder');
  assert.equal(applyControl(ks, 'louder'), false);
  assert.equal(ks.strength, 4);
  for (let i = 0; i < 5; i++) applyControl(ks, 'softer');
  assert.equal(ks.strength, 1);
});

test('scale lock maps every key to the nearest C major pentatonic note at or below it', () => {
  assert.deepEqual([60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71].map(toPentatonic), [60, 60, 62, 62, 64, 64, 64, 67, 67, 69, 69, 69]);
  const ks = createKeyState();
  applyControl(ks, 'lock');
  assert.equal(noteFor('KeyF', ks), 64, 'F becomes E');
  assert.equal(noteFor('KeyJ', ks), 69, 'B becomes A');
  applyControl(ks, 'lock');
  assert.equal(noteFor('KeyF', ks), 65);
});

test('the layout\'s pitches: every note key that sounds, for working out sounds ahead', () => {
  const ks = createKeyState();
  assert.deepEqual(layoutPitches(ks), [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77]);
  ks.octave = 1;
  assert.equal(layoutPitches(ks).length, 17, 'F6 is out of range');
});

test('keys 2 to 6 are the pedals, in chain order, and no key does two jobs', () => {
  assert.deepEqual(PEDAL_KEYS, { Digit2: 'overdrive', Digit3: 'chorus', Digit4: 'tremolo', Digit5: 'delay', Digit6: 'reverb' });
  const all = [...Object.keys(NOTE_KEYS), ...Object.keys(CONTROL_KEYS), ...Object.keys(PEDAL_KEYS)];
  assert.equal(new Set(all).size, all.length);
});

test('in the shop the arrows choose and Enter buys, once however long it is held', () => {
  assert.equal(shopKey('ArrowLeft', false), 'left');
  assert.equal(shopKey('ArrowRight', true), 'right', 'a held arrow moves on along the stock');
  assert.equal(shopKey('Enter', false), 'enter');
  assert.equal(shopKey('NumpadEnter', false), 'enter');
  assert.equal(shopKey('Enter', true), null, 'a held Enter repeating does nothing more');
  assert.equal(shopKey('KeyA', false), undefined, 'not a shop key: the note keys still play');
});
