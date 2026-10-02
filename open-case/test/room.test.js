import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRoom, roomKey, press, roomHit, roomHover, roomClick, roomCard, cubbyBox, DESK, CARD } from '../src/room.js';
import { KEEPSAKES } from '../src/keepsakes.js';
import { MAP_KEY } from '../src/studioview.js';

const layout = JSON.parse(readFileSync(new URL('../assets/sprites.json', import.meta.url), 'utf8')).room;
const ids = KEEPSAKES.map((k) => k.id);
const at = (i) => ids.indexOf(i);
const mid = ([x, y, w, h]) => [x + w / 2, y + h / 2];
// Some keepsakes found, the first in your case.
const someKept = () => ({ found: ['dandelion', 'acorn', 'sock', 'ring', 'lily'], inCase: ['dandelion'] });

test('the arrow keys reach every cubby and the desk', () => {
  const seen = new Set([0]), queue = [0];
  while (queue.length) {
    const from = queue.shift();
    for (const code of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) {
      const room = { ...createRoom(), at: from };
      roomKey(room, someKept(), code, 0);
      if (!seen.has(room.at)) {
        seen.add(room.at);
        queue.push(room.at);
      }
    }
  }
  assert.equal(seen.size, KEEPSAKES.length + 1);
});

test('left and right step along a row, right from its end onto the desk and back; up and down switch rows', () => {
  const room = createRoom(), keeps = someKept(), go = (code) => roomKey(room, keeps, code, 0);
  assert.equal(room.at, 0, "the bunny's dandelion clock first");
  go('ArrowDown');
  assert.equal(room.at, 1, "then its four-leaf clover, under it");
  go('ArrowRight');
  assert.equal(room.at, 3, "the ducks' rubber duck");
  go('ArrowLeft');
  go('ArrowLeft');
  assert.equal(room.at, 1, 'no further left than the first column');
  go('ArrowUp');
  for (let i = 0; i < 10; i++) go('ArrowRight');
  assert.equal(room.at, at('owlfeather'));
  go('ArrowRight');
  assert.equal(room.at, DESK, 'on to the desk');
  go('ArrowRight');
  go('ArrowUp');
  go('ArrowDown');
  assert.equal(room.at, DESK, 'nowhere further');
  go('ArrowLeft');
  assert.equal(room.at, at('owlfeather'), 'back to the shelf');
});

test('Enter or Space on a keepsake you have puts it in your case or takes it out; on one still to find it does nothing', () => {
  const room = createRoom(), keeps = someKept();
  room.at = at('acorn');
  assert.equal(roomKey(room, keeps, 'Enter', 0), 'case');
  assert.deepEqual(keeps.inCase, ['dandelion', 'acorn']);
  assert.equal(roomKey(room, keeps, 'Space', 0), 'case');
  assert.deepEqual(keeps.inCase, ['dandelion']);
  room.at = at('bell');
  assert.equal(roomKey(room, keeps, 'Enter', 0), null);
  assert.deepEqual(keeps, someKept());
});

test("the case's refusal goes when the pointer moves off the keepsake it was said for", () => {
  const keeps = { ...someKept(), inCase: ['dandelion', 'acorn', 'sock'] };
  const refused = () => {
    const room = createRoom();
    room.at = at('ring');
    press(room, keeps, 10);
    assert.equal(roomCard(room, keeps, 10.5).full, true);
    return room;
  };
  let room = refused();
  roomKey(room, keeps, 'ArrowRight', 10.5);
  assert.equal(roomCard(room, keeps, 10.6).full, false, 'an arrow key');
  room = refused();
  roomHover(layout, room, ...mid(cubbyBox(layout, at('sock'))));
  assert.equal(roomCard(room, keeps, 10.6).says, 'in your case: enter to take it out', 'the mouse, onto one in your case');
  room = refused();
  roomHover(layout, room, ...mid(cubbyBox(layout, at('ring'))));
  assert.equal(roomCard(room, keeps, 10.6).full, true, 'staying on it keeps the refusal');
});

test('a fourth is refused, and the card says so for two seconds', () => {
  const room = createRoom(), keeps = { ...someKept(), inCase: ['dandelion', 'acorn', 'sock'] };
  room.at = at('ring');
  assert.equal(press(room, keeps, 10), null);
  assert.deepEqual(keeps.inCase, ['dandelion', 'acorn', 'sock']);
  assert.equal(roomCard(room, keeps, 11).says, 'your case holds three, take one off first');
  assert.equal(roomCard(room, keeps, 11).full, true);
  assert.equal(roomCard(room, keeps, 12.1).says, 'enter to put it in your case', 'after two seconds');
  room.at = at('sock');
  assert.equal(press(room, keeps, 13), 'case', 'one taken off...');
  room.at = at('ring');
  assert.equal(press(room, keeps, 14), 'case', '...makes room');
  assert.deepEqual(keeps.inCase, ['dandelion', 'acorn', 'ring']);
});

test('Enter on the desk opens the studio, and Esc leads to the map', () => {
  const room = { ...createRoom(), at: DESK };
  assert.equal(roomKey(room, someKept(), 'Enter', 0), 'studio');
  assert.equal(roomKey(room, someKept(), 'Escape', 0), 'map');
  assert.equal(roomKey(createRoom(), someKept(), 'KeyA', 0), null);
});

test("the card: a keepsake's name and line and what Enter does; a hint for one still to find; the desk", () => {
  const room = createRoom(), keeps = someKept();
  assert.deepEqual(roomCard(room, keeps, 0), { name: 'Dandelion clock', line: 'make a wish, then blow', says: 'in your case: enter to take it out', found: true, full: false });
  room.at = at('sock');
  assert.deepEqual(roomCard(room, keeps, 0), { name: 'Odd sock', line: "the fox won't say whose it was", says: 'enter to put it in your case', found: true, full: false });
  room.at = at('blackberry');
  assert.deepEqual(roomCard(room, keeps, 0), { name: 'Something from the fox', line: 'the fox likes the groove', says: '', found: false, full: false });
  room.at = DESK;
  assert.equal(roomCard(room, keeps, 0).says, 'enter to open it');
});

test('the cubbies sit side by side on the shelf in the art, a column for each animal, and a click or the mouse finds each one, the desk and the map key', () => {
  for (let i = 0; i < KEEPSAKES.length; i++) {
    const box = cubbyBox(layout, i);
    assert.deepEqual(roomHit(layout, ...mid(box)), { hit: 'cubby', at: i });
    if (i >= 2) assert.equal(box[0] - cubbyBox(layout, i - 2)[0], layout.shelf[2], 'the next column');
    if (i & 1) assert.equal(box[1] - cubbyBox(layout, i - 1)[1], layout.shelf[2], 'the special one under the ordinary');
  }
  assert.deepEqual(roomHit(layout, ...mid(layout.desk)), { hit: 'desk' });
  assert.deepEqual(roomHit(layout, ...mid(MAP_KEY)), { hit: 'map' });
  assert.equal(roomHit(layout, ...mid(CARD)), null);
  const room = createRoom();
  assert.equal(roomHover(layout, room, ...mid(cubbyBox(layout, 9))), true);
  assert.equal(room.at, 9);
  assert.equal(roomHover(layout, room, ...mid(layout.desk)), true);
  assert.equal(room.at, DESK);
  assert.equal(roomHover(layout, room, 2, 2), false);
  assert.equal(room.at, DESK, 'the pointer stays where it was');
});

test('a click points and presses as Enter does: a cubby puts its keepsake in or out, the desk opens the studio, the map key leaves', () => {
  const room = createRoom(), keeps = someKept();
  assert.equal(roomClick(layout, room, keeps, ...mid(cubbyBox(layout, at('lily'))), 0), 'case');
  assert.equal(room.at, at('lily'));
  assert.deepEqual(keeps.inCase, ['dandelion', 'lily']);
  assert.equal(roomClick(layout, room, keeps, ...mid(layout.desk), 0), 'studio');
  assert.equal(roomClick(layout, room, keeps, ...mid(MAP_KEY), 0), 'map');
  assert.equal(roomClick(layout, room, keeps, 2, 2, 0), null);
});
