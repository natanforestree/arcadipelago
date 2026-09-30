import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createStudio, loadBeats, saveBeats, chosenBeat, openBeat, newBeat, replaceSlot, cancelAsk, buskTo, isChosen, setTab, nextTab,
  turnRhythm, rhythmOf, moveRange, nextSound, setTempo, setSwing, setMood, setLength, setLevel, toggleMute, setPump, togglePad,
  toggleVinyl, clearPart, undoChange, press, moveTo, letGo, setErase, advance, DRUMS,
} from '../src/studio.js';
import { LOFI, readyBeat, clockOf, blankBeat, keyNote, BASS_C } from '../src/beats.js';
import { RHYTHMS } from '../src/rhythms.js';
import { STUDIO } from '../src/tuning.js';

function memoryStorage() {
  const m = new Map();
  return { get: (k) => (m.has(k) ? m.get(k) : null), set: (k, v) => m.set(k, String(v)), m };
}
const empty = () => ({ slots: Array(STUDIO.slots).fill(null), chosen: null });
// A studio with a blank beat of yours open (90 bpm, straight: a 16th is exactly 1/6 s).
function blank() {
  const studio = createStudio(empty());
  newBeat(studio);
  return studio;
}
const at16 = (studio, s) => clockOf(studio.beat).timeOf16th(s);
// Holds from 16th `from` to just before 16th `to`, frame by frame, gathering what was written.
function hold(studio, where, from, to) {
  assert.ok(press(studio, at16(studio, from), where));
  const out = [];
  for (let t = at16(studio, from); t < at16(studio, to) - STUDIO.ahead - 1e-9; t += 1 / 60) out.push(...advance(studio, t));
  letGo(studio);
  return out;
}
const rhythm = (part, name) => RHYTHMS[part].findIndex((r) => JSON.stringify(r) === JSON.stringify(name));

test('the studio opens the beat your sets play: the lo-fi at first, as it is', () => {
  const studio = createStudio(empty());
  assert.equal(studio.beat, LOFI, 'the ready-made beat itself, until it changes');
  assert.deepEqual(studio.open, { ready: 'lofi' });
  assert.equal(chosenBeat(studio.beats), LOFI);
  assert.equal(studio.tab, 'drums');
});

test("holding the drum pad writes the rhythm into that strip as the playhead passes, and only there", () => {
  const studio = blank();
  studio.beat.drums.push({ s: 4, drum: 'kick', vel: 1 });
  studio.rhythm.drums = rhythm('drums', [[0, 1], [4, 1], [8, 1], [12, 1]]);
  const written = hold(studio, { row: DRUMS.indexOf('snare'), x: 1 }, 0, 16);
  assert.deepEqual(studio.beat.drums.filter((h) => h.drum === 'snare').map((h) => [h.s, h.vel]), [[0, 1], [4, 1], [8, 1], [12, 1]]);
  assert.deepEqual(studio.beat.drums.filter((h) => h.drum === 'kick').map((h) => h.s), [4], "the kick at the same 16th stays: it's another strip");
  assert.deepEqual(written.filter((w) => w.notes.length).map((w) => [w.layer, w.s]), [['drums', 0], ['drums', 4], ['drums', 8], ['drums', 12]], 'for the sound, as the band would play them');
  assert.deepEqual(written.map((w) => w.s), [...Array(16).keys()], 'and every 16th in between, left empty');
  hold(studio, { row: 1, x: 0 }, 16, 32);
  assert.ok(studio.beat.drums.filter((h) => h.drum === 'snare').every((h) => h.s >= 16 || h.vel === 1), 'bar 1 untouched');
  assert.equal(studio.beat.drums.find((h) => h.drum === 'snare' && h.s === 16).vel, STUDIO.softest, 'the left of the pad is softest');
});

test("painting over replaces what was there: the part's notes on every 16th passed, hits or not", () => {
  const studio = blank();
  studio.rhythm.drums = rhythm('drums', [[0, 1], [4, 1], [8, 1], [12, 1]]);
  hold(studio, { row: 0, x: 1 }, 0, 16);
  studio.rhythm.drums = rhythm('drums', [[0, 1]]);
  hold(studio, { row: 0, x: 1 }, 0, 10);
  assert.deepEqual(studio.beat.drums.map((h) => h.s), [0, 12], 'the kicks on 4 and 8 painted over; the one on 12 was never reached');
});

test('the bass and chords write the note or chord under your finger, at its tone; one at a time', () => {
  const studio = blank();
  setTab(studio, 'bass');
  studio.rhythm.bass = rhythm('bass', [[0, 8], [8, 8]]);
  const [first] = hold(studio, { col: 2, y: 0.25 }, 0, 16);
  assert.deepEqual(studio.beat.bass.map(({ s, degree, len, tone }) => [s, degree, len, tone]), [[0, 2, 8, 0.25], [8, 2, 8, 0.25]]);
  assert.equal(first.notes[0].note, keyNote('A', 2, BASS_C), "C, the third of A minor's scale");
  moveRange(studio, 1);
  studio.rhythm.bass = rhythm('bass', [[12, 4]]);
  hold(studio, { col: 0, y: 0.5 }, 12, 16);
  assert.deepEqual(studio.beat.bass.map(({ s, degree, len }) => [s, degree, len]), [[0, 2, 8], [8, 2, 4], [12, 7, 4]], 'an octave up; the note under it stops where it starts');
  setTab(studio, 'chords');
  studio.rhythm.chords = rhythm('chords', [[0, 16]]);
  const [chord] = hold(studio, { col: 3, y: 0.5 }, 0, 1);
  assert.equal(chord.layer, 'keys');
  assert.deepEqual(studio.beat.chords.map(({ s, degree, len }) => [s, degree, len]), [[0, 3, 16]], 'Dm, for a whole bar');
});

test('a press a hair after a 16th still catches it; a later one waits for the next', () => {
  const studio = blank();
  studio.rhythm.drums = rhythm('drums', [[0, 1], [2, 1], [4, 1], [6, 1], [8, 1], [10, 1], [12, 1], [14, 1]]);
  press(studio, at16(studio, 4) + STUDIO.grace - 0.01, { row: 0, x: 1 });
  advance(studio, at16(studio, 4) + STUDIO.grace);
  letGo(studio);
  assert.deepEqual(studio.beat.drums.map((h) => h.s), [4]);
  press(studio, at16(studio, 8) + STUDIO.grace + 0.01, { row: 0, x: 1 });
  advance(studio, at16(studio, 10));
  letGo(studio);
  assert.deepEqual(studio.beat.drums.map((h) => h.s), [4, 10], 'not 8: it went by too long before');
});

test('what a hold writes is written a moment ahead of the playhead, just before it sounds', () => {
  const studio = blank();
  studio.rhythm.drums = rhythm('drums', [[0, 1], [4, 1], [8, 1], [12, 1]]);
  press(studio, 0.01, { row: 0, x: 1 });
  const written = advance(studio, at16(studio, 4) - STUDIO.ahead + 0.001);
  assert.deepEqual(written.filter((w) => w.notes.length).map((w) => w.s), [0, 4], '16th 4 is written just before it sounds');
  assert.equal(written.at(-1).s, 4, 'and nothing after it yet');
});

test('a hold reports every 16th it paints for the sound, the ones it leaves empty too, with the part and the drum strip', () => {
  const studio = blank();
  studio.rhythm.drums = rhythm('drums', [[0, 1]]);
  const hats = hold(studio, { row: DRUMS.indexOf('hats'), x: 1 }, 0, 3);
  assert.deepEqual(hats.map((w) => [w.part, w.drum, w.layer, w.s, w.notes.length]), [
    ['drums', 'hats', 'top', 0, 1], ['drums', 'hats', 'top', 1, 0], ['drums', 'hats', 'top', 2, 0],
  ], 'no hit in the rhythm on 1 and 2: emptied, and said so');
  setErase(studio, true);
  const erased = hold(studio, { row: DRUMS.indexOf('kick'), x: 1 }, 16, 18);
  setErase(studio, false);
  assert.deepEqual(erased.map((w) => [w.part, w.drum, w.layer, w.s, w.notes.length]), [['drums', 'kick', 'drums', 16, 0], ['drums', 'kick', 'drums', 17, 0]], 'erased');
  setTab(studio, 'chords');
  studio.rhythm.chords = rhythm('chords', [[0, 16]]);
  const chords = hold(studio, { col: 0, y: 0.5 }, 0, 2);
  assert.deepEqual(chords.map((w) => [w.part, w.drum, w.layer, w.s, w.notes.length > 0]), [['chords', null, 'keys', 0, true], ['chords', null, 'keys', 1, false]]);
});

test('moving your finger changes the note from the next 16th on', () => {
  const studio = blank();
  setTab(studio, 'bass');
  studio.rhythm.bass = rhythm('bass', [[0, 2], [2, 2], [4, 2], [6, 2], [8, 2], [10, 2], [12, 2], [14, 2]]);
  press(studio, 0, { col: 0, y: 0.5 });
  advance(studio, at16(studio, 3));
  moveTo(studio, { col: 4, y: 0.5 });
  advance(studio, at16(studio, 7));
  letGo(studio);
  assert.deepEqual(studio.beat.bass.map((h) => [h.s, h.degree]), [[0, 0], [2, 0], [4, 4], [6, 4]]);
});

test('Erase empties what the playhead passes (only the held strip, on the drums); Clear empties the part', () => {
  const studio = blank();
  studio.rhythm.drums = rhythm('drums', [[0, 1], [4, 1], [8, 1], [12, 1]]);
  hold(studio, { row: 0, x: 1 }, 0, 16);
  hold(studio, { row: 1, x: 1 }, 0, 16);
  setErase(studio, true);
  hold(studio, { row: 0, x: 1 }, 4, 10);
  setErase(studio, false);
  assert.deepEqual(studio.beat.drums.filter((h) => h.drum === 'kick').map((h) => h.s), [0, 12]);
  assert.equal(studio.beat.drums.filter((h) => h.drum === 'snare').length, 4);
  clearPart(studio);
  assert.deepEqual(studio.beat.drums, []);
});

test('an erase is a change like any other: the version moves on, so it is kept', () => {
  const studio = blank();
  studio.beat.drums.push({ s: 4, drum: 'kick', vel: 1 });
  setErase(studio, true);
  press(studio, at16(studio, 4), { row: 0, x: 1 });
  const v = studio.version;
  advance(studio, at16(studio, 5));
  assert.deepEqual(studio.beat.drums, []);
  assert.ok(studio.version > v);
});

test('Undo steps back through every kind of change, one at a time, up to 20', () => {
  const studio = blank();
  studio.rhythm.drums = rhythm('drums', [[0, 1]]);
  hold(studio, { row: 0, x: 1 }, 0, 4);
  clearPart(studio);
  setTempo(studio, 120);
  setMood(studio, 'D');
  nextSound(studio);
  setLevel(studio, 'bass', 0.5);
  toggleMute(studio, 'chords');
  undoChange(studio);
  assert.equal(studio.beat.mix.muted.chords, false);
  undoChange(studio);
  undoChange(studio);
  undoChange(studio);
  undoChange(studio);
  assert.equal(studio.beat.bpm, 90);
  undoChange(studio);
  assert.equal(studio.beat.drums.length, 1, 'the clear, taken back');
  undoChange(studio);
  assert.equal(studio.beat.drums.length, 0, 'and the hold');
  assert.equal(studio.beats.slots[studio.open.slot], studio.beat, 'your slot has it as it is');
  for (let i = 0; i < 25; i++) setTempo(studio, 61 + i);
  for (let i = 0; i < 25; i++) undoChange(studio);
  assert.equal(studio.beat.bpm, 65, 'only the last 20 changes come back');
});

test('a drag is one change: its first step begins it, the rest carry on, and one Undo takes it all back', () => {
  const studio = blank();
  setTempo(studio, 100);
  for (let v = 101; v <= 120; v++) setTempo(studio, v, true);
  setSwing(studio, 0.6);
  setSwing(studio, 0.9, true);
  assert.equal(studio.beat.swing, 0.75, 'swing stops at 75%');
  undoChange(studio);
  assert.equal(studio.beat.swing, 0.5);
  undoChange(studio);
  assert.equal(studio.beat.bpm, 90);
  setTempo(studio, 30);
  assert.equal(studio.beat.bpm, 60, 'tempo from 60...');
  setTempo(studio, 300);
  assert.equal(studio.beat.bpm, 140, '...to 140');
});

test('a new key carries every note to the same place in it; a chord spelled out is stacked afresh', () => {
  const studio = createStudio(empty());
  setTab(studio, 'chords');
  setMood(studio, 'A'); // the lo-fi, copied: its first change
  const beat = studio.beat;
  assert.equal(beat.mood, 'A');
  assert.ok(beat.chords.every((h) => h.notes === undefined && h.name === undefined));
  assert.deepEqual(beat.bass.slice(0, 3).map((h) => h.degree), [1, 1, 5], 'the same places in the key');
  assert.equal(LOFI.mood, 'C', 'the ready-made lo-fi never changes');
  assert.ok(LOFI.chords[0].notes);
});

test('shortening keeps the first bars; lengthening repeats what is there', () => {
  const studio = blank();
  studio.rhythm.drums = rhythm('drums', [[0, 1]]);
  for (const bar of [0, 1, 2, 3]) hold(studio, { row: 0, x: 1 }, bar * 16, bar * 16 + 2);
  setLength(studio, 1);
  assert.equal(studio.beat.bars, 1);
  assert.deepEqual(studio.beat.drums.map((h) => h.s), [0]);
  studio.beat.drums.push({ s: 6, drum: 'snare', vel: 0.8 });
  setLength(studio, 4);
  assert.deepEqual(studio.beat.drums.map((h) => h.s), [0, 6, 16, 22, 32, 38, 48, 54]);
  setLength(studio, 2);
  assert.deepEqual(studio.beat.drums.map((h) => h.s), [0, 6, 16, 22]);
  setLength(studio, 3);
  assert.equal(studio.beat.bars, 2, '1, 2 or 4 bars only');
});

test('the first change to a ready-made beat makes your copy in the first empty slot; the original stays', () => {
  const beats = empty();
  beats.slots[0] = { ...blankBeat('Funk 2') };
  const studio = createStudio(beats);
  openBeat(studio, { ready: 'funk' });
  const funk = readyBeat('funk'), before = JSON.stringify(funk);
  studio.rhythm.drums = rhythm('drums', [[0, 1]]);
  hold(studio, { row: 0, x: 1 }, 0, 2);
  assert.deepEqual(studio.open, { slot: 1 });
  assert.equal(studio.beat.name, 'Funk 3', "there's already a Funk 2");
  assert.equal(studio.beat.ready, false);
  assert.equal(studio.beat.id, null, 'a copy is never the ready-made one');
  assert.equal(JSON.stringify(funk), before, 'the ready-made funk is as it was');
  assert.equal(studio.beat.bpm, 100, 'the copy is the funk');
});

test('with every slot full, a copy or a new beat asks which to replace; Esc leaves everything as it was', () => {
  const beats = empty();
  for (let i = 0; i < STUDIO.slots; i++) beats.slots[i] = blankBeat(`Beat ${i + 1}`);
  const studio = createStudio(beats);
  openBeat(studio, { ready: 'reggae' });
  assert.equal(press(studio, 0, { row: 0, x: 1 }), false);
  assert.deepEqual(studio.asking, { make: 'copy' });
  cancelAsk(studio);
  assert.equal(studio.asking, null);
  assert.equal(studio.beat, readyBeat('reggae'));
  assert.deepEqual(beats.slots.map((b) => b.name), ['Beat 1', 'Beat 2', 'Beat 3', 'Beat 4', 'Beat 5', 'Beat 6']);
  setTempo(studio, 90);
  assert.equal(studio.beat.bpm, 76, 'no change while it asks');
  replaceSlot(studio, 2);
  assert.equal(beats.slots[2].name, 'Reggae 2');
  assert.deepEqual(studio.open, { slot: 2 });
  setTempo(studio, 90);
  assert.equal(beats.slots[2].bpm, 90, 'now the change goes into your copy');
  newBeat(studio);
  assert.deepEqual(studio.asking, { make: 'new' });
  replaceSlot(studio, 4);
  assert.equal(beats.slots[4].name, 'Beat 3', 'the first number no other slot has');
});

test('with every slot full, the rest of a refused drag leaves a ready-made beat alone', () => {
  const beats = empty();
  for (let i = 0; i < STUDIO.slots; i++) beats.slots[i] = blankBeat(`Beat ${i + 1}`);
  const studio = createStudio(beats);
  openBeat(studio, { ready: 'reggae' });
  const reggae = readyBeat('reggae');
  const before = reggae.bpm;
  setTempo(studio, 100);
  assert.deepEqual(studio.asking, { make: 'copy' });
  assert.equal(reggae.bpm, before, 'first step refused, beat unchanged');
  setTempo(studio, 110, true);
  assert.equal(reggae.bpm, before, 'rest of drag also refused, the ready-made beat stays unchanged');
});

test('New makes a blank beat, named Beat 1, Beat 2...', () => {
  const studio = createStudio(empty());
  newBeat(studio);
  newBeat(studio);
  assert.deepEqual(studio.beats.slots.slice(0, 3).map((b) => b?.name ?? null), ['Beat 1', 'Beat 2', null]);
  assert.deepEqual(studio.open, { slot: 1 });
  assert.deepEqual([studio.beat.bpm, studio.beat.mood, studio.beat.bars, studio.beat.drums.length], [90, 'A', 4, 0]);
});

test('Busk to this chooses the open beat for your sets, and the choice follows its slot', () => {
  const studio = createStudio(empty());
  openBeat(studio, { ready: 'ballad' });
  buskTo(studio);
  assert.equal(chosenBeat(studio.beats), readyBeat('ballad'));
  assert.ok(isChosen(studio, { ready: 'ballad' }) && !isChosen(studio, { ready: 'lofi' }));
  newBeat(studio);
  buskTo(studio);
  assert.equal(chosenBeat(studio.beats), studio.beats.slots[0]);
  setTempo(studio, 70);
  assert.equal(chosenBeat(studio.beats).bpm, 70, 'your changes are what your sets play');
});

test('your beats and the chosen one come back after a reload; anything unreadable is left out', () => {
  const storage = memoryStorage();
  const studio = createStudio(empty());
  openBeat(studio, { ready: 'funk' });
  setTempo(studio, 104);
  buskTo(studio);
  saveBeats(storage, studio.beats);
  const again = loadBeats(storage);
  assert.equal(again.slots[0].name, 'Funk 2');
  assert.equal(again.slots[0].bpm, 104);
  assert.deepEqual(again.chosen, { slot: 0 });
  assert.equal(createStudio(again).beat.bpm, 104, 'it opens on the beat you busk to');
  for (const bad of ['{', '[]', 'null', '{"slots":[{"name":"x"},7,null],"chosen":{"slot":1}}', '{"slots":[],"chosen":{"ready":"nope"}}']) {
    storage.set('open-case-beats', bad);
    const b = loadBeats(storage);
    assert.equal(b.slots.length, STUDIO.slots);
    assert.ok(b.slots.every((x) => x === null), bad);
    assert.equal(b.chosen, null, bad);
  }
  assert.equal(chosenBeat(loadBeats(memoryStorage())), LOFI, 'nothing stored: the lo-fi');
});

test('a storage that throws when it is read leaves your slots empty and your sets on the lo-fi', () => {
  const beats = loadBeats({ get() { throw new Error('denied'); }, set() {} });
  assert.deepEqual(beats, { slots: Array(STUDIO.slots).fill(null), chosen: null });
  assert.equal(chosenBeat(beats), LOFI);
});

test('the wheel turns round the 16 rhythms; Tab goes round the parts; nothing to hold on the Mix tab', () => {
  const studio = blank();
  studio.rhythm.drums = 15;
  turnRhythm(studio, 1);
  assert.equal(studio.rhythm.drums, 0);
  turnRhythm(studio, -1);
  assert.equal(rhythmOf(studio), RHYTHMS.drums[15]);
  nextTab(studio);
  nextTab(studio);
  nextTab(studio);
  assert.equal(studio.tab, 'mix');
  assert.equal(press(studio, 0, { col: 0, y: 0 }), false);
  nextTab(studio);
  assert.equal(studio.tab, 'drums');
  moveRange(studio, 5);
  assert.equal(studio.range, 1);
});

test('the Mix: levels, mutes, the Pump, the Pad and the Vinyl', () => {
  const studio = blank();
  setLevel(studio, 'drums', 1.4);
  setPump(studio, 0.5);
  togglePad(studio);
  toggleVinyl(studio);
  toggleMute(studio, 'bass');
  assert.deepEqual(studio.beat.mix, { levels: { drums: 1, bass: 1, chords: 1 }, muted: { drums: false, bass: true, chords: false }, pump: 0.5, pad: true, vinyl: true });
  setTab(studio, 'chords');
  nextSound(studio);
  assert.equal(studio.beat.sounds.chords, 'nylon');
  nextSound(studio, -1);
  nextSound(studio, -1);
  assert.equal(studio.beat.sounds.chords, 'piano', 'round the sounds');
});

test('every change moves the version on, so the sound and the screen can follow', () => {
  const studio = blank();
  const v = studio.version;
  setTempo(studio, 99);
  assert.ok(studio.version > v);
  const w = studio.version;
  turnRhythm(studio, 1);
  assert.equal(studio.version, w, 'choosing a rhythm changes nothing in the beat');
});
