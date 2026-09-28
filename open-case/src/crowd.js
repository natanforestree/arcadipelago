// The passers-by. Pure: they arrive from the seed, walk the path, listen while in earshot, stop when
// hooked, and leave bored or happy. Their interest moves with what the ears hear (listen.js events).
// Coins and the rest are reported in c.out as { type, person, coins? } for the set to collect.
//
// Each person: { id, kind, dir (+1 walking right), x, y, state, listening, heard, interest, budget,
//   stayed, spot, lastRule, reaction: { rule, t } | null, done }
// state: 'passing' (walking by, maybe listening), 'joining' (hooked, walking to a spot), 'stopped',
// 'leaving'. The crowd is everyone joining or stopped.
import { CROWD, INTEREST, TIPS, RULES } from './tuning.js';
import { createRng, nextRandom, randomBetween } from './rng.js';

export const KINDS = ['jogger', 'oldman', 'student', 'commuter'];
const PATH_Y = 146; // where passers-by walk

export function createCrowd(seed) {
  return {
    rng: createRng(seed),
    people: [],
    nextId: 1,
    nextArrival: CROWD.firstArrival,
    open: true, // new people still arrive
    stoppedEver: 0,
    longest: null, // { kind, seconds }: whoever has stayed longest
    out: [],
  };
}

export const inCrowd = (p) => p.state === 'joining' || p.state === 'stopped';
export const crowdSize = (c) => c.people.reduce((n, p) => n + (inCrowd(p) ? 1 : 0), 0);
const hearing = (p) => p.listening || inCrowd(p);

function arrive(c, t) {
  // Always the same draws in the same order, so the k-th arrival is the same person whatever you play.
  const kind = KINDS[Math.floor(nextRandom(c.rng) * KINDS.length)];
  const dir = nextRandom(c.rng) < 0.5 ? 1 : -1;
  const budget = randomBetween(c.rng, CROWD.budgetMin, CROWD.budgetMax);
  c.people.push({
    id: c.nextId++, kind, dir, x: dir > 0 ? -CROWD.edge : CROWD.width + CROWD.edge, y: PATH_Y,
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
  if (kind === 'oldman') return bar.count > 0 && bar.rest >= RULES.oldManRest;
  if (kind === 'student') return bar.count >= RULES.studentMin && bar.off / bar.count >= RULES.studentShare;
  return false;
}

// Everyone listening hears one event from the ears.
export function hear(c, e, t) {
  for (const p of c.people) {
    if (!hearing(p)) continue;
    switch (e.rule) {
      case 'phrase':
        if (e.clean && e.notes >= RULES.phraseMinNotes && !(p.kind === 'oldman' && e.loud)) nudge(p, 'phrase', INTEREST.phrase, t);
        break;
      case 'bar':
        if (likes(p.kind, e)) nudge(p, 'taste', INTEREST.taste, t);
        break;
      case 'loud':
        if (p.kind === 'oldman') nudge(p, 'loud', INTEREST.loud, t);
        break;
      case 'callback':
        nudge(p, 'callback', INTEREST.callback, t);
        if (inCrowd(p)) c.out.push({ type: 'coin', person: p, coins: TIPS.callback, why: 'callback' });
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
  if (happy) c.out.push({ type: 'coin', person: p, coins: p.kind === 'oldman' ? TIPS.happyOldMan : TIPS.happy, why: 'happy' });
  c.out.push({ type: 'left', person: p, happy });
}

export function stepCrowd(c, dt, t) {
  if (c.open && t >= c.nextArrival && c.people.length < CROWD.onScreen) {
    arrive(c, t);
    c.nextArrival = t + randomBetween(c.rng, CROWD.arriveMin, CROWD.arriveMax);
  }
  for (const p of c.people) {
    const kind = CROWD.kinds[p.kind];
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
      if (!c.longest || p.stayed > c.longest.seconds) c.longest = { kind: p.kind, seconds: p.stayed };
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
  for (const p of c.people) if (inCrowd(p)) c.out.push({ type: 'coin', person: p, coins: TIPS.end, why: 'end' });
}
