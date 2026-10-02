import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCrowd, hear, crowdSize, endTips, dealLook, personName, KINDS, LOOKS } from '../src/crowd.js';
import { CROWD, INTEREST, TIPS, DT, PLACES, ISLAND } from '../src/tuning.js';
import { ANIMALS, ANIMALS_OF } from '../src/animals.js';
import { runCrowd, stoodAt } from './helpers.js';
import { createSet, stepSet, playNote, releaseNote, momentsOf } from '../src/set.js';
import { goodSet } from '../src/bots.js';
import { LOFI } from '../src/beats.js';

const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

// Everyone who came by in the first `seconds`, in order: kind, look, side, budget and arrival time.
function arrivals(seed, seconds = 120, each, place = 'park') {
  const c = createCrowd(seed, place), seen = new Map();
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

test("the look just dealt isn't dealt again after a reshuffle, even when the new deck's first look is being worn", () => {
  for (let seed = 0; seed < 100; seed++) {
    for (let worn = 0; worn < LOOKS; worn++) {
      if (worn === 2) continue;
      const c = createCrowd(seed);
      stoodAt(c, 'jogger', 0, { look: worn }); // still here from earlier
      c.lastLook.jogger = 2; // the last jogger, look 2, has walked on
      c.decks.jogger = [];
      assert.notEqual(dealLook(c, 'jogger'), 2, `seed ${seed}, look ${worn} on screen`);
    }
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

// Every place's arrivals over a long run, everyone walking straight through (nobody is listening).
function placeArrivals(place, seeds = [1, 2, 3, 4, 5], seconds = 300) {
  return seeds.flatMap((seed) => arrivals(seed, seconds, (c) => { for (const p of c.people) p.walkedOn = true; }, place));
}

test('each place draws its own kinds: no joggers at the station or the market, mostly commuters at the station', () => {
  const share = (list, kind) => list.filter((p) => p.kind === kind).length / list.length;
  const station = placeArrivals('station'), market = placeArrivals('market');
  assert.equal(share(station, 'jogger'), 0);
  assert.equal(share(market, 'jogger'), 0);
  assert.ok(share(station, 'commuter') > 0.45, `commuters at the station: ${share(station, 'commuter')}`);
  assert.ok(share(market, 'commuter') < 0.35, `commuters at the market: ${share(market, 'commuter')}`);
  assert.ok(share(market, 'elder') + share(market, 'student') > 0.65);
});

test("the station's trains are the same from a seed, and bring their passengers in waves as the doors open", () => {
  const w = PLACES.station.waves;
  const a = createCrowd(3, 'station'), b = createCrowd(3, 'station');
  assert.deepEqual(a.trains, b.trains);
  assert.notDeepEqual(a.trains, createCrowd(4, 'station').trains);
  assert.ok(a.trains[0].t >= w.first[0] && a.trains[0].t <= w.first[1]);
  for (let i = 1; i < a.trains.length; i++) {
    const gap = a.trains[i].t - a.trains[i - 1].t;
    assert.ok(gap >= w.every[0] && gap <= w.every[1], `train gap ${gap}`);
  }
  for (const tr of a.trains) assert.ok(tr.people.length >= w.people[0] && tr.people.length <= w.people[1]);
  assert.deepEqual(createCrowd(3, 'park').trains, [], 'no trains in the park');
  // Most arrivals come within a few seconds of a train's doors opening.
  for (const seed of [1, 2, 3, 4, 5]) {
    const trains = createCrowd(seed, 'station').trains;
    const list = arrivals(seed, 300, (c) => { for (const p of c.people) p.walkedOn = true; }, 'station');
    const inWave = list.filter((p) => trains.some((tr) => p.at >= tr.t - DT && p.at <= tr.t + 6)).length;
    assert.ok(inWave / list.length >= 0.6, `seed ${seed}: ${inWave} of ${list.length} came with a train`);
  }
});

test("the market's browsers come steadily, one every 4 to 7 seconds while there's room", () => {
  const list = arrivals(5, 120, (c) => { for (const p of c.people) p.walkedOn = true; }, 'market');
  assert.ok(near(list[0].at, 2, DT * 1.5), 'the first comes 2 seconds in');
  for (let i = 1; i < list.length; i++) {
    const gap = list[i].at - list[i - 1].at;
    assert.ok(gap >= 4 - DT, `gap ${gap}`);
  }
  assert.ok(list.length >= 120 / 7 - 2, `${list.length} came`);
});

test('a place sets how long listeners stay, how fast they walk and how long they listen before deciding', () => {
  for (const place of ['station', 'market']) {
    const P = PLACES[place];
    for (const p of placeArrivals(place, [1, 2])) assert.ok(p.budget >= P.stay[0] && p.budget <= P.stay[1], `${place} ${p.budget}`);
    // A commuter walking by, out of earshot: their pace is the place's share of a commuter's.
    const c = createCrowd(1, place);
    c.nextArrival = Infinity;
    c.waveQueue = [];
    const p = stoodAt(c, 'commuter', 0, { state: 'passing', x: -10, y: 146, interest: 0.3 });
    hear(c, { rule: 'bar', count: 0, rest: 16, off: 0 }, 0);
    const x0 = p.x;
    runCrowd(c, 0, 0.5);
    assert.ok(near(p.x - x0, CROWD.kinds.commuter.speed * P.pace * 0.5, 0.01), `${place}: walked ${p.x - x0}`);
    // In earshot, a listener with nothing to like walks on after the place's share of their patience.
    const d = createCrowd(1, place);
    d.nextArrival = Infinity;
    d.waveQueue = [];
    const q = stoodAt(d, 'commuter', 0, { state: 'passing', x: CROWD.playerX, y: 146, interest: 0.4, dir: 0 });
    q.walkedOn = false;
    let left = null;
    runCrowd(d, 0, 20, (t) => { if (left === null && q.walkedOn) left = t; });
    const patience = CROWD.kinds.commuter.patience * P.patience;
    assert.ok(left !== null && Math.abs(left - patience) <= 0.05, `${place}: walked on after ${left}, patience ${patience}`);
  }
});

test("a place sets the tips: the station's happy listeners give more, the market's less, and the end of a set the same", () => {
  for (const [place, happy] of [['park', TIPS.happy], ['station', PLACES.station.tips.happy], ['market', PLACES.market.tips.happy]]) {
    const c = createCrowd(1, place);
    stoodAt(c, 'student', 0, { budget: 0.01, interest: 0.9 });
    runCrowd(c, 0, 0.05);
    const coin = c.out.find((e) => e.type === 'coin');
    assert.equal(coin.coins, happy, place);
    const d = createCrowd(1, place);
    stoodAt(d, 'student', 0);
    endTips(d);
    assert.equal(d.out[0].coins, 1, `${place}: one coin at the end`);
  }
  assert.ok(PLACES.station.tips.happy > TIPS.happy && PLACES.market.tips.happy < TIPS.happy);
});

test("a train's passengers who find the platform full wait a few seconds, then go another way, never all at once later", () => {
  const c = createCrowd(2, 'station'), first = c.trains[0];
  c.nextArrival = Infinity; // only the train's passengers
  for (let i = 0; i < PLACES.station.onScreen; i++) stoodAt(c, 'commuter', i % 6, { budget: 999 });
  const after = first.people.at(-1) + 5; // its last passenger has waited 5 seconds
  runCrowd(c, 0, after);
  assert.equal(c.people.length, PLACES.station.onScreen, 'nobody squeezed in');
  assert.ok(!c.waveQueue.some((at) => first.people.includes(at)), "the first train's passengers have gone another way");
  c.people.length = 0; // room again
  const before = c.nextId;
  runCrowd(c, after, 0.5);
  assert.ok(c.nextId - before <= 1, `${c.nextId - before} arrived at once`);
});

test('with every look of a kind on screen, a seventh of that kind still gets a whole-number look', () => {
  const c = createCrowd(1, 'station');
  for (let i = 0; i < LOOKS; i++) stoodAt(c, 'commuter', i % 6, { look: i });
  c.decks.commuter = [];
  c.lastLook.commuter = 3;
  const look = dealLook(c, 'commuter');
  assert.ok(Number.isInteger(look) && look >= 0 && look < LOOKS, `look ${look}`);
  assert.notEqual(look, 3, 'not the look just dealt, while another is there');
});

test('over a whole good set at the station, everyone on screen always has a whole-number look', () => {
  const set = createSet(2, LOFI, 'station'), moments = momentsOf(goodSet(2));
  let i = 0;
  while (set.phase !== 'over') {
    const until = set.t + DT;
    for (; i < moments.length && moments[i].t <= until; i++) {
      const m = moments[i];
      if (m.note) playNote(set, m.note.pitch, m.note.strength, m.t);
      else releaseNote(set, m.t);
    }
    stepSet(set, DT);
    for (const p of set.crowd.people) {
      assert.ok(Number.isInteger(p.look) && p.look >= 0 && p.look < LOOKS, `t=${set.t.toFixed(2)}: a ${p.kind} with look ${p.look}`);
    }
  }
});

// An animal settled on the island's spot `spot`, for tests that need one without hooking it.
function settled(c, animal, spot, over = {}) {
  const { kind, cross } = ANIMALS[animal], [x, y] = ISLAND.spots[spot];
  return stoodAt(c, kind, 0, { look: ANIMALS_OF[kind].indexOf(animal), animal, lane: ISLAND.lanes[cross], x, y, spot, ...over });
}

test("the island's animals come as the park's people do, the same kinds from the same side for as long, only further apart", () => {
  for (const seed of [1, 2, 7]) {
    const park = arrivals(seed, 300), island = arrivals(seed, 600, undefined, 'island');
    const same = (list) => list.slice(0, 20).map((p) => [p.kind, p.dir, p.budget]);
    assert.deepEqual(same(island), same(park), `seed ${seed}`);
    for (let i = 1; i < 20; i++) {
      const gap = island[i].at - island[i - 1].at;
      assert.ok(gap >= 10 - DT && gap <= 16 + DT, `gap ${gap}`);
    }
  }
});

test("on the island every arrival is one of its kind's animals, crossing along its own line, and leaving along it too", () => {
  const seen = new Set();
  for (const seed of [1, 2, 3]) {
    const c = createCrowd(seed, 'island');
    runCrowd(c, 0, 400, () => {
      for (const p of c.people) {
        assert.equal(p.animal, ANIMALS_OF[p.kind][p.look], `a ${p.kind} with look ${p.look}`);
        assert.equal(p.lane, ISLAND.lanes[ANIMALS[p.animal].cross], p.animal);
        if (p.state === 'passing') assert.equal(p.y, p.lane, p.animal);
        if (p.listening) p.interest = 1; // everyone who hears you settles, then leaves when their time is up
        seen.add(p.animal);
      }
    });
    assert.equal(c.first.kind, arrivals(seed, 3, undefined, 'island')[0].kind, 'the first that came by');
  }
  assert.equal(seen.size, 11, 'every animal comes by');
  const c = createCrowd(1, 'island'), crow = settled(c, 'crow', 2, { budget: 1 });
  runCrowd(c, 0, 3);
  assert.equal(crow.state, 'leaving');
  assert.equal(crow.y, ISLAND.lanes.sky, 'a crow leaving flies off at its own height');
});

test('a second of one animal comes only while every animal of its kind is on screen', () => {
  let twice = 0;
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    const c = createCrowd(seed, 'island');
    let before = [];
    runCrowd(c, 0, 600, () => {
      for (const p of c.people) if (p.listening) p.interest = 1;
      const p = c.people.at(-1);
      if (p && !before.includes(p)) {
        const others = before.filter((o) => o.kind === p.kind).map((o) => o.animal);
        if (others.includes(p.animal)) {
          twice++;
          assert.equal(new Set(others).size, ANIMALS_OF[p.kind].length, `seed ${seed}: a second ${p.animal} with ${others} on screen`);
        }
      }
      before = [...c.people];
    });
  }
  assert.ok(twice > 0, 'it happens');
});

test('each animal settles only on a spot of its own sort, never two on one, and the turtle takes the rock while it can', () => {
  for (const seed of [1, 2, 3, 4]) {
    const c = createCrowd(seed, 'island');
    runCrowd(c, 0, 600, () => {
      for (const p of c.people) if (p.listening) p.interest = 1;
      const settledOn = c.people.filter((p) => p.state === 'joining' || p.state === 'stopped');
      for (const p of settledOn) assert.ok(ANIMALS[p.animal].spots.includes(ISLAND.spots[p.spot][2]), `${p.animal} on ${ISLAND.spots[p.spot]}`);
      assert.equal(new Set(settledOn.map((p) => p.spot)).size, settledOn.length, 'one to a spot');
    });
  }
  // A turtle hooked with the rock taken goes to the nearest free spot in the shallows.
  const c = createCrowd(1, 'island');
  c.nextArrival = Infinity;
  settled(c, 'turtle', 9);
  const turtle = settled(c, 'turtle', 0, { state: 'passing', listening: true, spot: -1, x: 200, y: ISLAND.lanes.water, interest: 0.6 });
  runCrowd(c, 0, DT);
  assert.equal(turtle.state, 'joining');
  assert.deepEqual(ISLAND.spots[turtle.spot], [214, 134, 'shallows']);
});

test('an animal hooked with no free spot of its sort passes by, as a person does when the arc is full', () => {
  const c = createCrowd(1, 'island');
  c.nextArrival = Infinity;
  settled(c, 'fox', 3);
  settled(c, 'hedgehog', 4);
  settled(c, 'deer', 5);
  settled(c, 'fox', 6);
  const bunny = settled(c, 'bunny', 0, { state: 'passing', listening: true, spot: -1, x: 120, y: ISLAND.lanes.land, interest: 0.6, dir: 1 });
  runCrowd(c, 0, 1);
  assert.equal(bunny.state, 'passing');
  assert.ok(bunny.x > 120, 'it hops on by');
  const frog = settled(c, 'frog', 0, { state: 'passing', listening: true, spot: -1, x: 120, y: ISLAND.lanes.water, interest: 0.6 });
  runCrowd(c, 1, DT);
  assert.equal(frog.state, 'joining', 'the lily pad is free');
});

test('nobody pays on the island: a callback, a happy goodbye and the end of a set give fondness, not coins', () => {
  const c = createCrowd(1, 'island');
  settled(c, 'heron', 7, { budget: 5, interest: 0.9 });
  settled(c, 'fox', 3);
  hear(c, { rule: 'callback' }, 1);
  runCrowd(c, 1, 5.1);
  endTips(c);
  assert.deepEqual(c.out.filter((e) => e.type !== 'left').map((e) => [e.type, e.person.animal, e.fondness, e.why]), [
    ['fond', 'heron', TIPS.callback, 'callback'], ['fond', 'fox', TIPS.callback, 'callback'],
    ['fond', 'heron', TIPS.happyElder, 'happy'], ['fond', 'fox', TIPS.end, 'end'],
  ]);
});
