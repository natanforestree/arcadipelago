// The passers-by. Pure: they arrive from the seed, walk the path, listen while in earshot, stop when
// hooked, and leave bored or happy. Their interest moves with what the ears hear (listen.js events).
// Coins and the rest are reported in c.out as { type, person, coins? } for the set to collect.
//
// Each person: { id, kind, look (which of the kind's people they are, 0 to LOOKS - 1), dir (+1 walking
//   right), x, y, state, listening, heard, interest, budget, stayed, spot, lastRule,
//   reaction: { rule, t } | null, done }
// state: 'passing' (walking by, maybe listening), 'joining' (hooked, walking to a spot), 'stopped',
// 'leaving'. The crowd is everyone joining or stopped.
import { CROWD, INTEREST, RULES, PLACES } from './tuning.js';
import { createRng, nextRandom, randomBetween } from './rng.js';

export const KINDS = ['jogger', 'elder', 'student', 'commuter'];
export const LOOKS = 6; // each kind's people, three women and three men (art/open-case/figures.lua)
const LOOK_SEED = 0x9e3779b9; // mixed into the set's seed for the looks' own stream
const WAVE_SEED = 0x2545f491; // and for a station's trains
const WAVE_HORIZON = 600; // seconds of trains worked out at the start: longer than any set
const WAVE_LATE = 4; // seconds a train's passenger waits for room on screen before going another way
export const PATH_Y = 146; // where passers-by walk

// The trains of a station (place.waves) over the set, from their own stream so they never move the
// crowd's draws: [{ t, people: [times each steps off] }], t when it stands with its doors open.
function timetable(seed, waves) {
  if (!waves) return [];
  const rng = createRng((seed ^ WAVE_SEED) >>> 0), trains = [];
  for (let t = randomBetween(rng, ...waves.first); t < WAVE_HORIZON; t += randomBetween(rng, ...waves.every)) {
    const n = waves.people[0] + Math.floor(nextRandom(rng) * (waves.people[1] - waves.people[0] + 1));
    const people = [];
    for (let k = 0, at = t; k < n; k++, at += randomBetween(rng, ...waves.gap)) people.push(at);
    trains.push({ t, people });
  }
  return trains;
}

// place: a key of tuning.js PLACES ('park' if none): who comes by and how.
export function createCrowd(seed, place = 'park') {
  const p = PLACES[place];
  const trains = timetable(seed, p.waves);
  return {
    place: p,
    trains,
    waveQueue: trains.flatMap((tr) => tr.people), // when each train's passengers come along the platform
    rng: createRng(seed),
    // Looks are dealt from a stream of their own, so they never move the draws above: a set's kinds,
    // sides, budgets and arrival times are as they were before people had looks.
    lookRng: createRng((seed ^ LOOK_SEED) >>> 0),
    decks: Object.fromEntries(KINDS.map((k) => [k, []])), // each kind's looks still to deal, in order
    lastLook: {}, // each kind's look dealt last
    people: [],
    nextId: 1,
    nextArrival: CROWD.firstArrival,
    open: true, // new people still arrive
    stoppedEver: 0,
    longest: null, // { kind, look, seconds }: whoever has stayed longest
    out: [],
  };
}

export const inCrowd = (p) => p.state === 'joining' || p.state === 'stopped';
export const crowdSize = (c) => c.people.reduce((n, p) => n + (inCrowd(p) ? 1 : 0), 0);
const hearing = (p) => p.listening || inCrowd(p);

// How the end card names someone of `kind`, who (the look's) is 'woman' or 'man': "A jogger", or for
// the elder, "An old woman" or "An old man".
export function personName(kind, who) {
  if (kind === 'elder') return who === 'woman' ? 'An old woman' : 'An old man';
  return `A ${kind}`;
}

// Deals an arriving `kind` a look, like a card: the first in the kind's deck that no one on screen is
// wearing, skipping the look just dealt while any other is free. A deck that's run out, or that has
// only looks someone's wearing left, is refilled with all of them, shuffled, never starting with the
// look just dealt. So everyone of a kind comes by before any comes back, no two people on screen look
// the same (at most 5 others are there when one arrives), and the look just dealt comes back only when
// the other five of its kind are all on screen.
export function dealLook(c, kind) {
  const worn = new Set(c.people.filter((p) => p.kind === kind).map((p) => p.look));
  if (!c.decks[kind].some((l) => !worn.has(l))) {
    const deck = [...Array(LOOKS).keys()];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(nextRandom(c.lookRng) * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    if (deck[0] === c.lastLook[kind]) deck.push(deck.shift());
    c.decks[kind] = deck;
  }
  const free = (l) => !worn.has(l);
  const look = c.decks[kind].find((l) => free(l) && l !== c.lastLook[kind]) ?? c.decks[kind].find(free);
  c.decks[kind].splice(c.decks[kind].indexOf(look), 1);
  c.lastLook[kind] = look;
  return look;
}

// A kind drawn by the place's weights (in KINDS order): with the park's, all equal, exactly the old
// pick of one of the four.
function pickKind(r, weights) {
  const target = r * weights.reduce((a, b) => a + b, 0);
  let sum = 0;
  for (let i = 0; i < KINDS.length; i++) {
    sum += weights[i];
    if (target < sum) return KINDS[i];
  }
  return KINDS[weights.findLastIndex((w) => w > 0)];
}

function arrive(c, t) {
  // Always the same draws in the same order, so the k-th arrival is the same person whatever you play.
  const kind = pickKind(nextRandom(c.rng), c.place.kinds);
  const dir = nextRandom(c.rng) < 0.5 ? 1 : -1;
  const budget = randomBetween(c.rng, c.place.stay[0], c.place.stay[1]);
  c.people.push({
    id: c.nextId++, kind, look: dealLook(c, kind), dir, x: dir > 0 ? -CROWD.edge : CROWD.width + CROWD.edge, y: PATH_Y,
    state: 'passing', listening: false, heard: 0, walkedOn: false,
    interest: INTEREST.start + INTEREST.draw * crowdSize(c), budget, stayed: 0, spot: -1,
    lastRule: '', reaction: null, done: false, arrivedAt: t,
  });
}

function nudge(p, rule, delta, t) {
  p.interest = Math.min(1, Math.max(0, p.interest + delta));
  p.lastRule = rule;
  if (rule !== 'phrase') p.reaction = { rule, t };
}

// Does a bar suit this person's taste? (The commuter has none.)
function likes(kind, bar) {
  if (kind === 'jogger') return bar.count >= RULES.joggerNotes;
  if (kind === 'elder') return bar.count > 0 && bar.rest >= RULES.elderRest;
  if (kind === 'student') return bar.count >= RULES.studentMin && bar.off / bar.count >= RULES.studentShare;
  return false;
}

// Everyone listening hears one event from the ears.
export function hear(c, e, t) {
  for (const p of c.people) {
    if (!hearing(p)) continue;
    switch (e.rule) {
      case 'phrase':
        if (e.clean && e.notes >= RULES.phraseMinNotes && !(p.kind === 'elder' && e.loud)) nudge(p, 'phrase', INTEREST.phrase, t);
        break;
      case 'bar':
        if (likes(p.kind, e)) nudge(p, 'taste', INTEREST.taste, t);
        break;
      case 'loud':
        if (p.kind === 'elder') nudge(p, 'loud', INTEREST.loud, t);
        break;
      case 'callback':
        nudge(p, 'callback', INTEREST.callback, t);
        if (inCrowd(p)) c.out.push({ type: 'coin', person: p, coins: c.place.tips.callback, why: 'callback' });
        break;
      default: // repeat, offKey, recognised, random, silence
        nudge(p, e.rule, INTEREST[e.rule], t);
    }
  }
}

function freeSpot(c, x) {
  let best = -1;
  CROWD.spots.forEach(([sx], i) => {
    if (c.people.some((o) => inCrowd(o) && o.spot === i)) return;
    if (best < 0 || Math.abs(sx - x) < Math.abs(CROWD.spots[best][0] - x)) best = i;
  });
  return best;
}

function leave(c, p, happy) {
  p.state = 'leaving';
  if (happy) c.out.push({ type: 'coin', person: p, coins: p.kind === 'elder' ? c.place.tips.happyElder : c.place.tips.happy, why: 'happy' });
  c.out.push({ type: 'left', person: p, happy });
}

export function stepCrowd(c, dt, t) {
  const P = c.place;
  if (c.open && t >= c.nextArrival && c.people.length < P.onScreen) {
    arrive(c, t);
    c.nextArrival = t + randomBetween(c.rng, P.arrive[0], P.arrive[1]);
  }
  // A train's passengers come along the platform as they step off, while there's room; one kept waiting
  // too long goes another way.
  while (c.waveQueue.length && c.waveQueue[0] < t - WAVE_LATE) c.waveQueue.shift();
  while (c.open && c.waveQueue.length && c.waveQueue[0] <= t && c.people.length < P.onScreen) {
    c.waveQueue.shift();
    arrive(c, t);
  }
  for (const p of c.people) {
    const base = CROWD.kinds[p.kind];
    const kind = { speed: base.speed * P.pace, patience: base.patience * P.patience };
    if (hearing(p)) p.interest = Math.max(0, p.interest - INTEREST.fade * dt);
    if (p.state === 'passing') {
      const near = Math.abs(p.x - CROWD.playerX) <= CROWD.earshot;
      if (near && !p.walkedOn) p.listening = true;
      if (p.listening) {
        p.heard += dt;
        if (p.interest >= INTEREST.hook) {
          const spot = freeSpot(c, p.x);
          if (spot >= 0) {
            p.state = 'joining';
            p.listening = false;
            p.spot = spot;
            c.stoppedEver++;
            c.out.push({ type: 'hooked', person: p });
          }
        } else if (!near || p.heard > kind.patience || p.interest < INTEREST.bored) {
          p.listening = false;
          p.walkedOn = true;
          if (p.interest < INTEREST.bored) c.out.push({ type: 'left', person: p, happy: false });
        }
      }
      if (p.state === 'passing') p.x += p.dir * kind.speed * (p.listening ? CROWD.listenSlow : 1) * dt;
    } else if (p.state === 'joining' || p.state === 'stopped') {
      p.stayed += dt;
      if (!c.longest || p.stayed > c.longest.seconds) c.longest = { kind: p.kind, look: p.look, seconds: p.stayed };
      if (p.state === 'joining') {
        const [sx, sy] = CROWD.spots[p.spot];
        const step = kind.speed * dt;
        p.x += Math.max(-step, Math.min(step, sx - p.x));
        p.y += Math.max(-step, Math.min(step, sy - p.y));
        if (p.x === sx && p.y === sy) p.state = 'stopped';
      }
      if (p.interest < INTEREST.bored) leave(c, p, false);
      else if (p.stayed >= p.budget) leave(c, p, p.interest > INTEREST.happy);
    } else if (p.state === 'leaving') {
      p.x += p.dir * kind.speed * dt;
      p.y += Math.max(-kind.speed * dt, Math.min(kind.speed * dt, PATH_Y - p.y));
    }
    if (p.x < -CROWD.edge - 1 || p.x > CROWD.width + CROWD.edge + 1) p.done = true;
  }
  if (c.people.some((p) => p.done)) c.people = c.people.filter((p) => !p.done);
}

// The set is over: each listener still here tips once.
export function endTips(c) {
  for (const p of c.people) if (inCrowd(p)) c.out.push({ type: 'coin', person: p, coins: c.place.tips.end, why: 'end' });
}
