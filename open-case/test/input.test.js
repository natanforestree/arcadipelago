import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInput } from '../src/input.js';

// A stand-in window: listeners by type, and a clock the test moves.
function harness(over = {}) {
  const on = {}, got = [];
  let time = 1;
  const target = { addEventListener: (type, fn) => (on[type] = fn) };
  const input = createInput(target, {
    now: () => time,
    onNote: (n) => got.push(['note', n.code, n.pitch, n.strength, n.legato, Math.round(n.at * 1000)]),
    onRelease: (r) => got.push(['up', r.code]),
    onControl: (action, down) => got.push([action, down]),
    ...over,
  });
  const key = (type, code, extra = {}) => {
    let prevented = false;
    on[type]({ code, repeat: false, timeStamp: 0, preventDefault: () => (prevented = true), ...extra });
    return prevented;
  };
  return {
    input, got, on,
    down: (code, extra) => key('keydown', code, extra),
    up: (code) => key('keyup', code),
    at: (t) => (time = t),
  };
}

test('a note key sounds at once, with its pitch and the pick strength, and its release follows', () => {
  const h = harness();
  assert.equal(h.down('KeyA'), true, 'the browser does nothing with it');
  h.up('KeyA');
  assert.deepEqual(h.got, [['note', 'KeyA', 60, 3, false, 1000], ['up', 'KeyA']]);
});

test('held keys do not repeat; other keys are left alone; Cmd, Ctrl and Alt are left to the browser', () => {
  const h = harness();
  h.down('KeyA');
  h.down('KeyA', { repeat: true });
  assert.equal(h.down('KeyQ'), false);
  assert.equal(h.down('KeyS', { metaKey: true }), false);
  assert.equal(h.down('KeyD', { ctrlKey: true }), false);
  assert.equal(h.got.length, 1);
});

test('octave, strength and scale lock change the notes; the release is the note that sounded', () => {
  const h = harness();
  h.down('KeyX');
  h.down('KeyV');
  h.down('KeyA');
  h.down('KeyZ');
  h.up('KeyA');
  h.down('Digit1');
  h.down('KeyF');
  assert.deepEqual(h.got, [['octaveUp', true], ['louder', true], ['note', 'KeyA', 72, 4, false, 1000], ['octaveDown', true], ['up', 'KeyA'], ['lock', true], ['note', 'KeyF', 64, 4, false, 1000]]);
});

test('a control that changes nothing says nothing; a key out of the guitar\'s range is silent', () => {
  const h = harness();
  h.down('KeyX');
  h.down('KeyX');
  h.down('Quote'); // F6, above the guitar
  assert.deepEqual(h.got, [['octaveUp', true]]);
});

test('Space rings while held; M mutes; Esc pauses', () => {
  const h = harness();
  h.down('Space');
  h.up('Space');
  h.down('KeyM');
  h.down('Escape');
  assert.deepEqual(h.got, [['ring', true], ['ring', false], ['mute', true], ['pause', true]]);
});

test('a key pressed while the last is held is a hammer-on', () => {
  const h = harness();
  h.down('KeyA');
  h.at(1.3);
  h.down('KeyS');
  assert.equal(h.got[1][4], true);
  h.up('KeyA');
  h.up('KeyS');
  h.at(2);
  h.down('KeyD');
  assert.equal(h.got.at(-1)[4], false, 'with nothing held, it is picked');
});

test('keys pressed within 30 ms are a strum: each sounds 12 ms after the one before', () => {
  const h = harness();
  h.down('KeyA');
  h.at(1.005);
  h.down('KeyD');
  h.at(1.02);
  h.down('KeyG');
  h.at(1.1);
  h.down('KeyK');
  assert.deepEqual(h.got.map((g) => [g[1], g[4], g[5]]), [['KeyA', false, 1000], ['KeyD', false, 1012], ['KeyG', false, 1024], ['KeyK', true, 1100]]);
});

test('the gate can swallow a key, which then plays nothing and is never released', () => {
  let open = false;
  const h = harness({ gate: () => open });
  h.down('KeyA');
  h.up('KeyA');
  open = true;
  h.down('KeyS');
  assert.deepEqual(h.got, [['note', 'KeyS', 62, 3, false, 1000]]);
});

test('losing focus lets go of every key and the ring', () => {
  const h = harness();
  h.down('KeyA');
  h.down('KeyS');
  h.on.blur();
  assert.deepEqual(h.got.slice(2), [['up', 'KeyA'], ['up', 'KeyS'], ['ring', false]]);
  assert.equal(h.input.held.size, 0);
});

test('keys go by position, so any keyboard layout plays the same notes', () => {
  const h = harness();
  h.down('KeyA', { key: 'q' }); // the A position on a French keyboard types Q
  h.down('Semicolon', { key: 'm' });
  assert.deepEqual(h.got.map((g) => g[2]), [60, 76]);
});

test('every game key\'s browser default is stopped: Space scrolling, Firefox\'s quick find on \' and /', () => {
  const h = harness({ gate: () => false });
  assert.equal(h.down('Space'), true);
  assert.equal(h.down('Quote'), true, 'even when the key is swallowed');
  assert.equal(h.down('KeyA', { repeat: true }), true, 'and when it repeats');
});
