import { test } from 'node:test';
import assert from 'node:assert/strict';
import { studioHit, padAt, faderValue, moodShort, NAME, TAB_BOXES, SETTINGS, WHEEL, BUTTONS, PAD, STRIP } from '../src/studioview.js';
import { createStudio, newBeat, setTab, DRUMS } from '../src/studio.js';
import { STUDIO } from '../src/tuning.js';

const empty = () => ({ slots: Array(STUDIO.slots).fill(null), chosen: null });
const mid = ([x, y, w, h]) => [x + w / 2, y + h / 2];
const inScreen = ([x, y, w, h]) => x >= 0 && y >= 0 && x + w <= 320 && y + h <= 180;

test('everything on the studio screen is inside it, and the pad, the wheel, the strip and the top bar keep apart', () => {
  for (const box of [NAME, PAD, STRIP, ...Object.values(TAB_BOXES), ...Object.values(SETTINGS), ...Object.values(BUTTONS)]) assert.ok(inScreen(box), `${box}`);
  const [wx, wy, r] = WHEEL;
  assert.ok(wx + r < PAD[0] && wy - r > NAME[1] + NAME[3], 'the wheel left of the pad, under the top bar');
  for (const box of Object.values(BUTTONS)) assert.ok(box[1] > wy + r && box[0] + box[2] < PAD[0], 'the buttons under the wheel');
  assert.ok(PAD[1] + PAD[3] <= STRIP[1], 'the strip under the pad');
  assert.ok(Object.values(TAB_BOXES).every(([x, , w]) => x >= NAME[0] + NAME[2] && x + w <= SETTINGS.bpm[0]), 'the tabs between the name and the settings');
});

test('a click lands on the name, a tab, a setting, the wheel (up or down) or a button', () => {
  const studio = createStudio(empty());
  assert.deepEqual(studioHit(studio, ...mid(NAME)), { hit: 'name' });
  for (const tab of ['drums', 'bass', 'chords', 'mix']) assert.deepEqual(studioHit(studio, ...mid(TAB_BOXES[tab])), { hit: 'tab', tab });
  for (const which of ['bpm', 'mood', 'swing', 'bars']) assert.deepEqual(studioHit(studio, ...mid(SETTINGS[which])), { hit: 'setting', which });
  assert.deepEqual(studioHit(studio, WHEEL[0], WHEEL[1] - 10), { hit: 'wheel', dir: -1 });
  assert.deepEqual(studioHit(studio, WHEEL[0], WHEEL[1] + 10), { hit: 'wheel', dir: 1 });
  for (const which of ['sound', 'erase', 'clear', 'undo']) assert.deepEqual(studioHit(studio, ...mid(BUTTONS[which])), { hit: 'button', which });
  assert.equal(studioHit(studio, ...mid(BUTTONS.range)), null, 'Range is only for the bass');
  setTab(studio, 'bass');
  assert.deepEqual(studioHit(studio, ...mid(BUTTONS.range)), { hit: 'button', which: 'range' });
  assert.equal(studioHit(studio, STRIP[0] + 10, STRIP[1] + 20), null, 'the strip is only to look at');
});

test("on the pad: a drum strip and how hard, or a column and its tone", () => {
  const [x0, y0, w, h] = PAD;
  assert.deepEqual(padAt('drums', x0 + 1, y0 + 1), { row: 0, x: 0 });
  assert.deepEqual(padAt('drums', x0 + w - 1, y0 + h - 1), { row: DRUMS.length - 1, x: 1 });
  assert.deepEqual(padAt('bass', x0 + w * 0.3, y0 + h * 0.25), { col: 2, y: 0.75 });
  assert.deepEqual(padAt('chords', x0 + w + 5, y0 - 5), { col: 7, y: 1 }, 'a drag off the pad stays at its edge');
  const studio = createStudio(empty());
  assert.deepEqual(studioHit(studio, x0 + w / 2, y0 + h * 0.3), { hit: 'pad', at: { row: 1, x: 0.5 } });
});

test('the Mix tab: a fader for each part and the Pump, a mute under each part, and the Pad and Vinyl switches', () => {
  const studio = createStudio(empty());
  setTab(studio, 'mix');
  const hits = [];
  for (let x = PAD[0]; x < PAD[0] + PAD[2]; x++) for (let y = PAD[1]; y < PAD[1] + PAD[3]; y++) hits.push(studioHit(studio, x, y));
  const faders = new Set(hits.filter((h) => h?.hit === 'fader').map((h) => h.which));
  assert.deepEqual([...faders].sort(), ['bass', 'chords', 'drums', 'pump']);
  assert.deepEqual([...new Set(hits.filter((h) => h?.hit === 'mute').map((h) => h.part))].sort(), ['bass', 'chords', 'drums']);
  assert.deepEqual([...new Set(hits.filter((h) => h?.hit === 'switch').map((h) => h.which))].sort(), ['pad', 'vinyl']);
  const levels = hits.filter((h) => h?.hit === 'fader' && h.which === 'drums').map((h) => h.value);
  assert.ok(Math.min(...levels) === 0 && Math.max(...levels) === 1, 'from none at the bottom to full at the top');
  assert.equal(faderValue(-50), 1);
  assert.equal(faderValue(500), 0);
});

test('the list of beats opens the ready-made ones and yours, and has New, Busk to this and Close', () => {
  const studio = createStudio(empty());
  newBeat(studio);
  studio.list = true;
  const hits = [];
  for (let x = PAD[0]; x < PAD[0] + PAD[2]; x += 2) for (let y = PAD[1]; y < PAD[1] + PAD[3]; y += 2) hits.push(studioHit(studio, x, y));
  const opens = hits.filter((h) => h?.hit === 'open').map((h) => JSON.stringify(h.which));
  assert.deepEqual([...new Set(opens)], ['{"ready":"lofi"}', '{"ready":"bossa"}', '{"ready":"funk"}', '{"ready":"reggae"}', '{"ready":"ballad"}', '{"slot":0}'], 'an empty slot opens nothing');
  for (const which of ['new', 'busk', 'close']) assert.ok(hits.some((h) => h?.hit === which), which);
  assert.deepEqual(studioHit(studio, ...mid(NAME)), { hit: 'name' }, 'the name still closes it');
});

test('asking which slot to replace: a click on a slot replaces it, anywhere off the pad leaves them all', () => {
  const studio = createStudio(empty());
  studio.asking = { make: 'copy' };
  const slots = new Set();
  for (let x = PAD[0]; x < PAD[0] + PAD[2]; x += 2) for (let y = PAD[1]; y < PAD[1] + PAD[3]; y += 2) {
    const h = studioHit(studio, x, y);
    if (h) {
      assert.equal(h.hit, 'replace');
      slots.add(h.slot);
    }
  }
  assert.deepEqual([...slots].sort(), [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(studioHit(studio, ...mid(TAB_BOXES.bass)), { hit: 'keep' });
});

test('the keys are named short, to fit the top bar', () => {
  assert.deepEqual(['C', 'D', 'E', 'F', 'G', 'A'].map(moodShort), ['C maj', 'D dor', 'E phr', 'F lyd', 'G mix', 'A min']);
});
