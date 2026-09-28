import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCrowd, hear, crowdSize, endTips, KINDS } from '../src/crowd.js';
import { CROWD, INTEREST, TIPS, DT } from '../src/tuning.js';
import { runCrowd, stoodAt } from './helpers.js';

const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

// Everyone who came by in the first `seconds`, in order: kind, side and arrival time.
function arrivals(seed, seconds = 120, each) {
  const c = createCrowd(seed), seen = new Map();
  runCrowd(c, 0, seconds, (t) => {
    each?.(c, t);
    for (const p of c.people) if (!seen.has(p.id)) seen.set(p.id, { kind: p.kind, dir: p.dir, at: p.arrivedAt });
  });
  return [...seen.values()];
}

test('passers-by come from the seed: the same seed brings the same people at the same times', () => {
  const a = arrivals(1);
  assert.deepEqual(a, arrivals(1));
  assert.notDeepEqual(a, arrivals(2));
  assert.ok(a.every((p) => KINDS.includes(p.kind) && (p.dir === 1 || p.dir === -1)));
  assert.ok(near(a[0].at, 2, DT * 1.5), 'the first comes 2 seconds in');
  for (let i = 1; i < a.length; i++) {
    const gap = a[i].at - a[i - 1].at;
    assert.ok(gap >= 6 - DT && gap <= 10 + DT, `gap ${gap}`);
  }
});

test('never more than 6 on screen: with 6 listening, nobody new arrives until one leaves', () => {
  let most = 0;
  arrivals(3, 150, (c) => {
    for (const p of c.people) if (p.listening) p.interest = 1; // everyone who hears you stops
    most = Math.max(most, c.people.length);
  });
  assert.equal(most, CROWD.onScreen);
});

// The first passer-by, moved to just inside earshot and listening.
function passerBy(seed = 1) {
  const c = createCrowd(seed);
  let t = runCrowd(c, 0, 2.05);
  const p = c.people[0];
  p.x = CROWD.playerX - p.dir * (CROWD.earshot - 5);
  t = runCrowd(c, t, DT);
  assert.equal(p.listening, true);
  return { c, p, t };
}

test('a passer-by in earshot who reaches 0.5 within their patience stops, at the nearest free spot', () => {
  const { c, p, t } = passerBy();
  assert.ok(near(p.interest, INTEREST.start, 0.01));
  hear(c, { rule: 'callback' }, t);
  runCrowd(c, t, DT);
  assert.equal(p.state, 'joining');
  assert.equal(crowdSize(c), 1);
  assert.equal(c.stoppedEver, 1);
  runCrowd(c, t, 10);
  assert.equal(p.state, 'stopped');
  assert.deepEqual([p.x, p.y], CROWD.spots[p.spot]);
});

test('one who is not hooked within their patience walks on, at their full pace', () => {
  const { c, p, t } = passerBy(4);
  p.interest = 0.45; // interested, but not enough
  const patience = CROWD.kinds[p.kind].patience;
  let at = runCrowd(c, t, patience - 0.5);
  assert.equal(p.listening, true);
  at = runCrowd(c, at, 1);
  assert.equal(p.listening, false);
  assert.equal(p.state, 'passing');
  const x = p.x;
  runCrowd(c, at, 1);
  assert.ok(near(Math.abs(p.x - x), CROWD.kinds[p.kind].speed, 1), 'no longer slowed');
});

test('a crowd draws a crowd: each listener already stopped gives a new arrival 0.05', () => {
  const c = createCrowd(1);
  stoodAt(c, 'student', 0);
  stoodAt(c, 'commuter', 1);
  runCrowd(c, 0, 2.05);
  const p = c.people.find((o) => o.state === 'passing');
  assert.ok(near(p.interest, INTEREST.start + 2 * INTEREST.draw));
});

test('what raises and lowers interest, for whom', () => {
  const c = createCrowd(1);
  const kinds = Object.fromEntries(KINDS.map((k, i) => [k, stoodAt(c, k, i, { interest: 0.5 })]));
  const after = (e) => {
    for (const p of Object.values(kinds)) p.interest = 0.5;
    hear(c, e, 0);
    return Object.fromEntries(Object.entries(kinds).map(([k, p]) => [k, Math.round((p.interest - 0.5) * 100) / 100]));
  };
  assert.deepEqual(after({ rule: 'phrase', clean: true, loud: false, notes: 5 }), { jogger: 0.05, oldman: 0.05, student: 0.05, commuter: 0.05 });
  assert.deepEqual(after({ rule: 'phrase', clean: true, loud: false, notes: 2 }), { jogger: 0, oldman: 0, student: 0, commuter: 0 });
  assert.deepEqual(after({ rule: 'phrase', clean: true, loud: true, notes: 5 }), { jogger: 0.05, oldman: 0, student: 0.05, commuter: 0.05 });
  assert.deepEqual(after({ rule: 'phrase', clean: false, loud: false, notes: 5 }), { jogger: 0, oldman: 0, student: 0, commuter: 0 });
  assert.deepEqual(after({ rule: 'loud' }), { jogger: 0, oldman: -0.05, student: 0, commuter: 0 });
  assert.deepEqual(after({ rule: 'repeat' }), { jogger: -0.15, oldman: -0.15, student: -0.15, commuter: -0.15 });
  assert.deepEqual(after({ rule: 'offKey' }).jogger, -0.1);
  assert.deepEqual(after({ rule: 'random' }).student, INTEREST.random);
  assert.deepEqual(after({ rule: 'silence' }).oldman, -0.1);
  assert.deepEqual(after({ rule: 'recognised' }).commuter, 0.05);
  assert.deepEqual(after({ rule: 'callback' }).jogger, 0.3);
});

test('tastes: the jogger likes energy, the old man space, the student groove; the commuter has none', () => {
  const c = createCrowd(1);
  const kinds = Object.fromEntries(KINDS.map((k, i) => [k, stoodAt(c, k, i, { interest: 0.5 })]));
  const likes = (bar) => {
    for (const p of Object.values(kinds)) p.interest = 0.5;
    hear(c, { rule: 'bar', bar: 0, ...bar }, 0);
    return KINDS.filter((k) => kinds[k].interest > 0.5);
  };
  assert.deepEqual(likes({ count: 8, off: 0, rest: 2 }), ['jogger']);
  assert.deepEqual(likes({ count: 7, off: 0, rest: 2 }), []);
  assert.deepEqual(likes({ count: 2, off: 0, rest: 8 }), ['oldman']);
  assert.deepEqual(likes({ count: 0, off: 0, rest: 16 }), [], 'a silent bar is nobody\'s taste');
  assert.deepEqual(likes({ count: 6, off: 2, rest: 2 }), ['student']);
  assert.deepEqual(likes({ count: 9, off: 3, rest: 4 }), ['jogger', 'oldman', 'student']);
  assert.equal(kinds.jogger.lastRule, 'taste');
});

test('a callback earns a coin from each listener stopped, not from passers-by', () => {
  const { c, p, t } = passerBy();
  stoodAt(c, 'oldman', 0);
  stoodAt(c, 'student', 5);
  hear(c, { rule: 'callback' }, t);
  assert.deepEqual(c.out.map((e) => [e.type, e.coins, e.why]), [['coin', 1, 'callback'], ['coin', 1, 'callback']]);
  assert.equal(p.reaction.rule, 'callback');
});

test('below 0.2 anyone leaves, showing what lost them', () => {
  const c = createCrowd(1);
  const p = stoodAt(c, 'student', 2, { interest: 0.3 });
  hear(c, { rule: 'repeat' }, 5);
  runCrowd(c, 5, DT);
  assert.equal(p.state, 'leaving');
  assert.deepEqual(p.reaction, { rule: 'repeat', t: 5 });
  assert.deepEqual(c.out.map((e) => [e.type, e.happy]), [['left', false]]);
});

test('when their time is up they leave, tipping 2 if happy (the old man 3), nothing if not', () => {
  const c = createCrowd(1);
  stoodAt(c, 'student', 0, { budget: 5, interest: 0.9 });
  stoodAt(c, 'oldman', 1, { budget: 5, interest: 0.9 });
  stoodAt(c, 'jogger', 2, { budget: 5, interest: 0.4 });
  runCrowd(c, 0, 5.1);
  const coins = c.out.filter((e) => e.type === 'coin').map((e) => [e.person.kind, e.coins, e.why]);
  assert.deepEqual(coins, [['student', TIPS.happy, 'happy'], ['oldman', TIPS.happyOldMan, 'happy']]);
  assert.ok(c.people.filter((p) => p.state !== 'passing').every((p) => p.state === 'leaving'));
  assert.equal(c.longest.kind, 'student');
  assert.ok(near(c.longest.seconds, 5, 0.05));
});

test('at the end of the set, everyone still listening tips once', () => {
  const c = createCrowd(1);
  stoodAt(c, 'student', 0);
  stoodAt(c, 'commuter', 3);
  endTips(c);
  assert.deepEqual(c.out.map((e) => [e.coins, e.why]), [[1, 'end'], [1, 'end']]);
});

test('interest fades a little every second for everyone listening', () => {
  const c = createCrowd(1);
  const p = stoodAt(c, 'student', 0, { interest: 0.9 });
  runCrowd(c, 0, 10);
  assert.ok(near(p.interest, 0.8, 0.001));
});
