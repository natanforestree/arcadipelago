import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readLog, logSet, logChoice } from '../src/log.js';
import { LOG_SIZE } from '../src/tuning.js';

function memoryStorage() {
  const m = new Map();
  return { m, get: (k) => (m.has(k) ? m.get(k) : null), set: (k, v) => m.set(k, String(v)) };
}

test('each set is logged, and the button pressed after it is filled in', () => {
  const s = memoryStorage();
  logSet(s, { date: '2026-09-28T20:00:00Z', coins: 21, stopped: 5 });
  logChoice(s, 'another');
  logSet(s, { date: '2026-09-28T20:04:00Z', coins: 9, stopped: 3 });
  assert.deepEqual(readLog(s), [
    { date: '2026-09-28T20:00:00Z', coins: 21, stopped: 5, choice: 'another' },
    { date: '2026-09-28T20:04:00Z', coins: 9, stopped: 3, choice: null },
  ]);
  assert.deepEqual([...s.m.keys()], ['open-case-log']);
});

test('only the last 50 sets are kept', () => {
  const s = memoryStorage();
  for (let i = 0; i < LOG_SIZE + 5; i++) logSet(s, { date: String(i), coins: i, stopped: 0 });
  const log = readLog(s);
  assert.equal(log.length, LOG_SIZE);
  assert.equal(log[0].coins, 5);
});

test('an unreadable log starts afresh, and a choice with no set logged does nothing', () => {
  const s = memoryStorage();
  logChoice(s, 'stop');
  assert.deepEqual(readLog(s), []);
  s.set('open-case-log', '{nope');
  assert.deepEqual(readLog(s), []);
  s.set('open-case-log', '{"a":1}');
  assert.deepEqual(readLog(s), []);
});
