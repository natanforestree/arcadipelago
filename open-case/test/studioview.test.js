import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  studioHit, padAt, faderValue, moodShort, arrowsIn, NAME, TAB_BOXES, SETTINGS, WHEEL, PANEL, KNOB_ARROWS, knobAngle, ringLight, BUTTONS, MAP_KEY, PAD, STRIP, SWITCHES, LIST_BUTTONS, NAME_BUTTONS, NAME_FIELD,
} from '../src/studioview.js';
import { createStudio, newBeat, setTab, startNaming, DRUMS } from '../src/studio.js';
import { STUDIO } from '../src/tuning.js';

const empty = () => ({ slots: Array(STUDIO.slots).fill(null), chosen: null });
const mid = ([x, y, w, h]) => [x + w / 2, y + h / 2];
const inScreen = ([x, y, w, h]) => x >= 0 && y >= 0 && x + w <= 320 && y + h <= 180;
const inPad = ([x, y, w, h]) => x >= PAD[0] && y >= PAD[1] && x + w <= PAD[0] + PAD[2] && y + h <= PAD[1] + PAD[3];
const TOP_BAR = 19; // the top bar's height (the name box ends above it, the tabs a little over)
const inPanel = ([x, y, w, h]) => x >= PANEL[0] && y >= PANEL[1] && x + w <= PANEL[0] + PANEL[2] && y + h <= PANEL[1] + PANEL[3];
const overlap = ([ax, ay, aw, ah], [bx, by, bw, bh]) => ax < bx + bw && bx < ax + aw && ay < by + bh && by < ay + ah;

test('everything on the studio screen is inside it, and the pad, the wheel, the strip and the top bar keep apart', () => {
  for (const box of [NAME, PAD, STRIP, ...Object.values(TAB_BOXES), ...Object.values(SETTINGS), ...Object.values(BUTTONS)]) assert.ok(inScreen(box), `${box}`);
  const [wx, wy, r] = WHEEL;
  assert.ok(wx + r < PAD[0] && wy - r > NAME[1] + NAME[3], 'the wheel left of the pad, under the top bar');
  for (const box of Object.values(BUTTONS)) assert.ok(box[1] > wy + r && box[0] + box[2] < PAD[0], 'the buttons under the wheel');
  assert.ok(PAD[1] + PAD[3] <= STRIP[1], 'the strip under the pad');
  assert.ok(Object.values(TAB_BOXES).every(([x, , w]) => x >= NAME[0] + NAME[2] && x + w <= SETTINGS.bpm[0]), 'the tabs between the name and the settings');
});

test('the knob panel sits under the top bar, left of the pad, above the buttons, and holds the knob, its ring and its arrows', () => {
  const [px, py, pw, ph] = PANEL, [wx, wy] = WHEEL;
  assert.ok(py >= TOP_BAR, 'under the top bar');
  assert.ok(px >= 0 && px + pw <= PAD[0], 'left of the pad');
  for (const box of Object.values(BUTTONS)) assert.ok(py + ph <= box[1], 'above the buttons');
  assert.ok(inPanel([wx - 16, wy - 16, 32, 32]), 'the knob: its box, 16 pixels each way from the middle');
  assert.ok(inPanel(KNOB_ARROWS.left) && inPanel(KNOB_ARROWS.right), 'the arrows');
  for (let k = 0; k < 16; k++) assert.ok(inPanel(ringLight(k, k % 3)), `light ${k}`);
  assert.ok(KNOB_ARROWS.left[0] + KNOB_ARROWS.left[2] <= wx - 16 && KNOB_ARROWS.right[0] >= wx + 16, 'the arrows clear of the knob');
});

test('the ring: sixteen lights from the top round clockwise, clear of the knob, a long note a bigger light', () => {
  const [wx, wy] = WHEEL, centre = ([x, y, w, h]) => [x + w / 2 - wx, y + h / 2 - wy];
  const lights = Array.from({ length: 16 }, (_, k) => ringLight(k, 1));
  assert.equal(new Set(lights.map(String)).size, 16, 'sixteen places');
  const [x0, y0] = centre(lights[0]);
  assert.ok(Math.abs(x0) <= 0.5 && y0 < -15, 'the first at the top');
  assert.ok(centre(lights[4])[0] > 15 && centre(lights[8])[1] > 15 && centre(lights[12])[0] < -15, 'a quarter on, to the right; half way, below; three quarters, left');
  for (const box of lights) assert.ok(Math.hypot(...centre(box)) > 16 + 1, 'outside the knob');
  assert.deepEqual(ringLight(0, 0).slice(2), [2, 2], 'unlit: 2x2');
  assert.deepEqual(ringLight(0, 1).slice(2), [2, 2], 'a short note: 2x2');
  assert.deepEqual(ringLight(0, 2).slice(2), [3, 3], 'a long one: 3x3');
  for (const box of lights) assert.ok(!overlap(box, KNOB_ARROWS.left) && !overlap(box, KNOB_ARROWS.right), 'clear of the arrows');
});

test('the arrows and the lights mirror each other about the knob, left to right and top to bottom', () => {
  const [wx, wy] = WHEEL, { left, right } = KNOB_ARROWS;
  assert.equal(left[0] - wx, wx - (right[0] + right[2]), 'the arrows the same distance out');
  assert.deepEqual([left[1], left[2], left[3]], [right[1], right[2], right[3]]);
  for (const len of [1, 2]) for (let k = 0; k < 16; k++) {
    const [x, y, w, h] = ringLight(k, len), mx = ringLight((16 - k) % 16, len)[0], my = ringLight((8 - k + 16) % 16, len)[1];
    // (a 3-wide light can't be centred on the middle's pixel line: the one at 12 and 6 o'clock is a
    // pixel off to one side, and the one at 3 and 9 a pixel off up or down)
    if (len === 1 || k % 8) assert.equal(x - wx, wx - (mx + w), `light ${k}, len ${len}: left to right`);
    if (len === 1 || k % 8 !== 4) assert.equal(y - wy, wy - (my + h), `light ${k}, len ${len}: top to bottom`);
  }
});

test('the knob turns a sixteenth of a round a rhythm, clockwise from straight up', () => {
  assert.equal(knobAngle(0), 0, 'rhythm 1 points up');
  assert.ok(Math.abs(knobAngle(4) - Math.PI / 2) < 1e-9, 'rhythm 5 points right');
  assert.ok(Math.abs(knobAngle(8) - Math.PI) < 1e-9, 'rhythm 9 points down');
  assert.ok(Math.abs(knobAngle(16) - Math.PI * 2) < 1e-9, 'a whole round is back to rhythm 1');
});

test('a click lands on the name, a tab, a setting, the wheel (left or right) or a button', () => {
  const studio = createStudio(empty());
  assert.deepEqual(studioHit(studio, ...mid(NAME)), { hit: 'name' });
  for (const tab of ['drums', 'bass', 'chords', 'mix']) assert.deepEqual(studioHit(studio, ...mid(TAB_BOXES[tab])), { hit: 'tab', tab });
  for (const which of ['mood', 'bars']) assert.deepEqual(studioHit(studio, ...mid(SETTINGS[which])), { hit: 'setting', which });
  for (const which of ['bpm', 'swing']) assert.equal(studioHit(studio, ...mid(SETTINGS[which])).which, which, 'the tempo and the swing say which half, too (below)');
  assert.deepEqual(studioHit(studio, WHEEL[0] - 10, WHEEL[1]), { hit: 'wheel', dir: -1 });
  assert.deepEqual(studioHit(studio, WHEEL[0] + 10, WHEEL[1]), { hit: 'wheel', dir: 1 });
  assert.deepEqual(studioHit(studio, WHEEL[0] - 10, WHEEL[1] - 8), { hit: 'wheel', dir: -1 }, 'above the middle, too: the halves are left and right');
  assert.deepEqual(studioHit(studio, WHEEL[0] + 10, WHEEL[1] + 8), { hit: 'wheel', dir: 1 });
  for (const which of ['sound', 'erase', 'clear', 'undo']) assert.deepEqual(studioHit(studio, ...mid(BUTTONS[which])), { hit: 'button', which });
  assert.equal(studioHit(studio, ...mid(BUTTONS.range)), null, 'Range is only for the bass');
  setTab(studio, 'bass');
  assert.deepEqual(studioHit(studio, ...mid(BUTTONS.range)), { hit: 'button', which: 'range', dir: -1 }, 'with which half (below)');
  assert.equal(studioHit(studio, STRIP[0] + 10, STRIP[1] + 20), null, 'the strip is only to look at');
});

test('the tempo and the swing: their upper half is ▲ (dir 1) and their lower half ▼ (dir -1), all over', () => {
  const studio = createStudio(empty());
  for (const which of ['bpm', 'swing']) {
    const [x, y, w, h] = SETTINGS[which];
    for (let px = x; px < x + w; px += 0.5) for (let py = y; py < y + h; py += 0.5) {
      assert.deepEqual(studioHit(studio, px, py), { hit: 'setting', which, dir: py < y + h / 2 ? 1 : -1 }, `${which} at ${px}, ${py}`);
    }
  }
});

test("the tempo's and the swing's arrows: the wheel's size, one over the other at the box's right, each in its half", () => {
  for (const which of ['bpm', 'swing']) {
    const box = SETTINGS[which], [x, y, w, h] = box, { up, down } = arrowsIn(box);
    for (const a of [up, down]) assert.ok(a[0] >= x && a[1] >= y && a[0] + a[2] <= x + w && a[1] + a[3] <= y + h, `${which}: ${a} in ${box}`);
    assert.deepEqual([up[2], up[3], down[2], down[3]], [5, 3, 5, 3], "5 wide and 3 high, as the wheel's are");
    assert.equal(up[0], down[0], 'one over the other');
    assert.ok(up[0] > x + w / 2, 'at the right, beside the label and the number');
    assert.ok(up[1] + up[3] <= y + h / 2 && down[1] >= y + h / 2, '▲ in the upper half, ▼ in the lower');
  }
  const boxes = Object.values(SETTINGS);
  for (const a of boxes) for (const b of boxes) assert.ok(a === b || !overlap(a, b), `${a} clear of ${b}`);
});

test("the octave button, on the bass tab: its upper half is ▲ (dir 1) and its lower half ▼ (dir -1); off the bass, it's nothing", () => {
  const studio = createStudio(empty());
  const [x, y, w, h] = BUTTONS.range;
  for (const tab of ['drums', 'chords', 'mix', 'bass']) {
    setTab(studio, tab);
    for (let px = x; px < x + w; px += 0.5) for (let py = y; py < y + h; py += 0.5) {
      const want = tab === 'bass' ? { hit: 'button', which: 'range', dir: py < y + h / 2 ? 1 : -1 } : null;
      assert.deepEqual(studioHit(studio, px, py), want, `${tab} at ${px}, ${py}`);
    }
  }
});

test("Undo and the octave share the bottom row of the left column, lined up with Erase and Clear, the octave's arrows at its right", () => {
  const { sound, erase, clear, undo, range } = BUTTONS;
  assert.deepEqual([undo[1], undo[3]], [range[1], range[3]], 'one row');
  assert.ok(undo[0] + undo[2] < range[0], 'Undo, a gap, then the octave');
  assert.equal(undo[0], erase[0], 'lined up on the left');
  assert.equal(range[0] + range[2], clear[0] + clear[2], 'and on the right');
  const all = [sound, erase, clear, undo, range];
  for (const a of all) for (const b of all) assert.ok(a === b || !overlap(a, b), `${a} clear of ${b}`);
  const [x, y, w, h] = range, { up, down } = arrowsIn(range);
  for (const a of [up, down]) assert.ok(a[0] >= x && a[1] >= y && a[0] + a[2] <= x + w && a[1] + a[3] <= y + h, `${a} in ${range}`);
  assert.deepEqual([up[2], up[3], down[2], down[3]], [5, 3, 5, 3]);
  assert.ok(up[0] === down[0] && up[0] > x + w / 2, 'one over the other, at the right');
  assert.ok(up[1] + up[3] <= y + h / 2 && down[1] >= y + h / 2, '▲ in the upper half, ▼ in the lower');
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

test('the Mix tab: the Pad and Vinyl switches are stacked on the desk, clear of the faders, and a click on a lamp or a toggle lands on its own', () => {
  const studio = createStudio(empty());
  setTab(studio, 'mix');
  const names = Object.keys(SWITCHES);
  assert.deepEqual(names, ['pad', 'vinyl']);
  names.forEach((which, i) => {
    const box = SWITCHES[which], [x, y, w, h] = box;
    assert.ok(inPad(box), `${which}'s box is on the desk`);
    assert.ok(x >= 244 + 17, `${which}'s box is clear of the Pump fader`);
    if (i) {
      const [, py, , ph] = SWITCHES[names[i - 1]];
      assert.ok(y >= py + ph, `${which}'s box is under the one before`);
    }
    const top = 36 + 30 * i, left = 268;
    assert.deepEqual(studioHit(studio, left + 1, top + 1), { hit: 'switch', which }, 'its name');
    assert.deepEqual(studioHit(studio, left + 4, top + 14), { hit: 'switch', which }, 'its lamp');
    assert.deepEqual(studioHit(studio, left + 18, top + 14), { hit: 'switch', which }, 'its toggle');
    assert.deepEqual(studioHit(studio, left + 18, top + 8), { hit: 'switch', which }, 'its lever, up');
    assert.ok(x <= left && left + 22 <= x + w && y <= top && top + 19 <= y + h, 'covers name, lamp and toggle');
  });
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

test("the map key sits in the free corner left of the picture of the loop, under the buttons, and a click on it says 'map'", () => {
  assert.ok(inScreen(MAP_KEY), `${MAP_KEY}`);
  assert.ok(MAP_KEY[0] + MAP_KEY[2] < STRIP[0], 'left of the strip, with a gap');
  assert.ok(!overlap(MAP_KEY, STRIP) && !overlap(MAP_KEY, PAD));
  for (const box of Object.values(BUTTONS)) assert.ok(MAP_KEY[1] >= box[1] + box[3], 'under the buttons');
  assert.ok(STRIP[0] + STRIP[2] === 316 && PAD[1] + PAD[3] <= STRIP[1], 'the strip keeps its right edge, under the pad');
  const studio = createStudio(empty());
  assert.deepEqual(studioHit(studio, ...mid(MAP_KEY)), { hit: 'map' });
  newBeat(studio);
  studio.list = true;
  assert.deepEqual(studioHit(studio, ...mid(MAP_KEY)), { hit: 'map' }, 'with the list open');
  studio.list = false;
  studio.asking = { make: 'copy' };
  assert.deepEqual(studioHit(studio, ...mid(MAP_KEY)), { hit: 'map' }, 'with the replace question up');
  studio.asking = null;
  startNaming(studio);
  assert.deepEqual(studioHit(studio, ...mid(MAP_KEY)), { hit: 'map' }, 'while naming');
});

test('the keys are named short, to fit the top bar', () => {
  assert.deepEqual(['C', 'D', 'E', 'F', 'G', 'A'].map(moodShort), ['C maj', 'D dor', 'E phr', 'F lyd', 'G mix', 'A min']);
});

test("the list's Save sits on its bottom row between Busk to this and Close, and a click on it saves", () => {
  const { save, new: fresh, busk, close } = LIST_BUTTONS;
  assert.ok(save && inScreen(save) && inPad(save), `${save}`);
  assert.equal(save[1], busk[1], 'on the row of buttons');
  assert.equal(save[3], busk[3]);
  for (const other of [fresh, busk, close]) assert.ok(!overlap(save, other), `${save} clear of ${other}`);
  assert.ok(save[0] >= busk[0] + busk[2] && save[0] + save[2] <= close[0], 'between Busk to this and Close');
  const studio = createStudio(empty());
  studio.list = true;
  assert.deepEqual(studioHit(studio, ...mid(save)), { hit: 'save' });
});

test('the name box: its save and cancel buttons are all there is to click', () => {
  const studio = createStudio(empty());
  newBeat(studio);
  startNaming(studio);
  for (const box of [NAME_FIELD, NAME_BUTTONS.save, NAME_BUTTONS.cancel]) assert.ok(inScreen(box) && inPad(box), `${box}`);
  assert.ok(!overlap(NAME_BUTTONS.save, NAME_BUTTONS.cancel) && !overlap(NAME_FIELD, NAME_BUTTONS.save) && !overlap(NAME_FIELD, NAME_BUTTONS.cancel));
  assert.deepEqual(studioHit(studio, ...mid(NAME_BUTTONS.save)), { hit: 'naming', which: 'save' });
  assert.deepEqual(studioHit(studio, ...mid(NAME_BUTTONS.cancel)), { hit: 'naming', which: 'cancel' });
  const hits = new Set();
  for (let x = 0; x < 320; x += 2) for (let y = 0; y < 180; y += 2) hits.add(JSON.stringify(studioHit(studio, x, y)));
  assert.deepEqual([...hits].sort(), ['null', '{"hit":"map"}', '{"hit":"naming","which":"cancel"}', '{"hit":"naming","which":"save"}'], 'the name, the tabs and the pad wait; the map key does not');
});
