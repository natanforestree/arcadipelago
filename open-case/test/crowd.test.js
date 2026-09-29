import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCrowd, hear, crowdSize, endTips, dealLook, personName, KINDS, LOOKS } from '../src/crowd.js';
import { CROWD, INTEREST, TIPS, DT } from '../src/tuning.js';
import { runCrowd, stoodAt } from './helpers.js';

const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

// Everyone who came by in the first `seconds`, in order: kind, look, side, budget and arrival time.
function arrivals(seed, seconds = 120, each) {
  const c = createCrowd(seed), seen = new Map();
  runCrowd(c, 0, seconds, (t) => {
    each?.(c, t);
    for (const p of c.people) if (!seen.has(p.id)) seen.set(p.id, { kind: p.kind, look: p.look, dir: p.dir, budget: p.budget, at: p.arrivedAt });
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

test("looks don't move the crowd's draws: seed 7 brings the same people, sides, budgets and times as before looks", () => {
  // From the code before passers-by had looks: [kind, dir, budget, arrival time], to 4 places.
  const before = [
    ['jogger', 1, 177.2289, 2.0167], ['student', 1, 115.9479, 10.8167], ['student', -1, 90.9379, 17.7833],
    ['commuter', -1, 83.6565, 24.4167], ['elder', -1, 95.5596, 31.9], ['jogger', -1, 82.895, 41.8167],
    ['jogger', 1, 125.7482, 48.4], ['jogger', -1, 126.4453, 57.45], ['student', -1, 134.9257, 65.95],
    ['commuter', 1, 80.993, 75.65], ['elder', 1, 70.5727, 83.0833], ['elder', 1, 116.2395, 92.1667],
  ];
  const now = arrivals(7).slice(0, before.length).map((p) => [p.kind, p.dir, +p.budget.toFixed(4), +p.at.toFixed(4)]);
  assert.deepEqual(now, before);
});

test('each arrival is dealt a look like a card: all of a kind come by before any comes back, never one twice running', () => {
  for (const seed of [1, 2, 3, 7, 11]) {
    const a = arrivals(seed, 600);
    assert.deepEqual(arrivals(seed, 600), a, 'the same seed deals the same looks');
    for (const kind of KINDS) {
      const looks = a.filter((p) => p.kind === kind).map((p) => p.look);
      assert.ok(looks.every((l) => Number.isInteger(l) && l >= 0 && l < LOOKS), `${kind}: ${looks}`);
      for (let i = 0; i + LOOKS <= looks.length; i += LOOKS) {
        assert.equal(new Set(looks.slice(i, i + LOOKS)).size, LOOKS, `seed ${seed}, ${kind}: each ${LOOKS} in turn are all different (${looks})`);
      }
      looks.forEach((l, i) => i > 0 && assert.notEqual(l, looks[i - 1], `seed ${seed}, ${kind}: never twice running (${looks})`));
    }
  }
});

test('no two people on screen look the same, even when everyone stays', () => {
  for (const seed of [3, 5, 8]) {
    arrivals(seed, 600, (c) => {
      for (const p of c.people) if (p.listening) p.interest = 1; // everyone who hears you stops
      const worn = c.people.map((p) => `${p.kind} ${p.look}`);
      assert.equal(new Set(worn).size, worn.length, `seed ${seed}: ${worn}`);
    });
  }
});

test("a deck whose every look left is on screen is refilled, and the look just dealt doesn't start the new deck", () => {
  const c = createCrowd(1);
  stoodAt(c, 'jogger', 0, { look: 4 });
  c.decks.jogger = [4];
  const look = dealLook(c, 'jogger');
  assert.notEqual(look, 4, "the one left is being worn, so it isn't dealt");
  assert.equal(c.decks.jogger.length, LOOKS - 1, 'a fresh deck, less the look dealt');
  for (let i = 0; i < 50; i++) {
    const d = createCrowd(i);
    const first = dealLook(d, 'student');
    d.decks.student = [];
    assert.notEqual(dealLook(d, 'student'), first, `seed ${i}: a new deck never starts with the look just dealt`);
  }
});

test('the end card names who stayed: a jogger, a student, a commuter, an old woman or an old man', () => {
  assert.equal(personName('jogger', 'woman'), 'A jogger');
  assert.equal(personName('student', 'man'), 'A student');
  assert.equal(personName('commuter', 'woman'), 'A commuter');
  assert.equal(personName('elder', 'woman'), 'An old woman');
  assert.equal(personName('elder', 'man'), 'An old man');
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
  assert.deepEqual(after({ rule: 'phrase', clean: true, loud: false, notes: 5 }), { jogger: 0.05, elder: 0.05, student: 0.05, commuter: 0.05 });
  assert.deepEqual(after({ rule: 'phrase', clean: true, loud: false, notes: 2 }), { jogger: 0, elder: 0, student: 0, commuter: 0 });
  assert.deepEqual(after({ rule: 'phrase', clean: true, loud: true, notes: 5 }), { jogger: 0.05, elder: 0, student: 0.05, commuter: 0.05 });
  assert.deepEqual(after({ rule: 'phrase', clean: false, loud: false, notes: 5 }), { jogger: 0, elder: 0, student: 0, commuter: 0 });
  assert.deepEqual(after({ rule: 'loud' }), { jogger: 0, elder: -0.05, student: 0, commuter: 0 });
  assert.deepEqual(after({ rule: 'repeat' }), { jogger: -0.15, elder: -0.15, student: -0.15, commuter: -0.15 });
  assert.deepEqual(after({ rule: 'offKey' }).jogger, -0.1);
  assert.deepEqual(after({ rule: 'random' }).student, INTEREST.random);
  assert.deepEqual(after({ rule: 'silence' }).elder, -0.1);
  assert.deepEqual(after({ rule: 'recognised' }).commuter, 0.05);
  assert.deepEqual(after({ rule: 'callback' }).jogger, 0.3);
});

test('tastes: the jogger likes energy, the elder space, the student groove; the commuter has none', () => {
  const c = createCrowd(1);
  const kinds = Object.fromEntries(KINDS.map((k, i) => [k, stoodAt(c, k, i, { interest: 0.5 })]));
  const likes = (bar) => {
    for (const p of Object.values(kinds)) p.interest = 0.5;
    hear(c, { rule: 'bar', bar: 0, ...bar }, 0);
    return KINDS.filter((k) => kinds[k].interest > 0.5);
  };
  assert.deepEqual(likes({ count: 8, off: 0, rest: 2 }), ['jogger']);
  assert.deepEqual(likes({ count: 7, off: 0, rest: 2 }), []);
  assert.deepEqual(likes({ count: 2, off: 0, rest: 8 }), ['elder']);
  assert.deepEqual(likes({ count: 0, off: 0, rest: 16 }), [], 'a silent bar is nobody\'s taste');
  assert.deepEqual(likes({ count: 6, off: 2, rest: 2 }), ['student']);
  assert.deepEqual(likes({ count: 9, off: 3, rest: 4 }), ['jogger', 'elder', 'student']);
  assert.equal(kinds.jogger.lastRule, 'taste');
});

test('a callback earns a coin from each listener stopped, not from passers-by', () => {
  const { c, p, t } = passerBy();
  stoodAt(c, 'elder', 0);
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

test('when their time is up they leave, tipping 2 if happy (the elder 3), nothing if not', () => {
  const c = createCrowd(1);
  stoodAt(c, 'student', 0, { budget: 5, interest: 0.9, look: 3 });
  stoodAt(c, 'elder', 1, { budget: 5, interest: 0.9 });
  stoodAt(c, 'jogger', 2, { budget: 5, interest: 0.4 });
  runCrowd(c, 0, 5.1);
  const coins = c.out.filter((e) => e.type === 'coin').map((e) => [e.person.kind, e.coins, e.why]);
  assert.deepEqual(coins, [['student', TIPS.happy, 'happy'], ['elder', TIPS.happyElder, 'happy']]);
  assert.ok(c.people.filter((p) => p.state !== 'passing').every((p) => p.state === 'leaving'));
  assert.equal(c.longest.kind, 'student');
  assert.equal(c.longest.look, 3, 'and which student');
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
