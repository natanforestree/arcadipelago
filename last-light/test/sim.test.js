import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { createState, step } from '../src/sim.js';
import { createBot, botIntents } from '../src/bot.js';
import { igniteCreature } from '../src/creatures.js';
import { CHARM_COUNT, SALT } from '../src/charms.js';
import { DT } from '../src/tuning.js';

// Everything that matters about a night, as one string.
function snapshot(s) {
  const r = (v) => Math.round(v * 1e6) / 1e6;
  return JSON.stringify({
    t: s.tick, p: [r(s.player.x), r(s.player.y), r(s.player.health)], n: [s.night.phase, s.night.wave, s.night.qi],
    c: s.creatures.filter((c) => c.alive).map((c) => [c.id, c.kind, r(c.x), r(c.y), r(c.hp), c.mode]),
    g: [s.gun.current, s.gun.rifle, s.gun.shells, s.gun.spare, s.gun.flares], k: s.stats.kills,
  });
}

function playMinute(seed) {
  const s = createState({ seed });
  const bot = createBot();
  for (let i = 0; i < 60 / DT; i++) step(s, botIntents(s, bot, DT));
  return snapshot(s);
}

test('the same seed and intents give the same night', () => {
  assert.equal(playMinute(21), playMinute(21));
  assert.notEqual(playMinute(21), playMinute(22));
});

test('the bot, unable to die, plays a whole night to the dawn', () => {
  const s = createState({ seed: 2, god: true });
  const bot = createBot();
  for (let i = 0; i < (20 * 60) / DT && s.night.phase !== 'dawn'; i++) step(s, botIntents(s, bot, DT));
  assert.equal(s.night.phase, 'dawn');
  assert.ok(s.stats.kills > 150);
});

test('no module calls Math.hypot: V8 allocates on every call, and distances run per update and per frame', () => {
  const src = new URL('../src/', import.meta.url);
  const calling = readdirSync(src).filter((f) => f.endsWith('.js') && readFileSync(new URL(f, src), 'utf8').includes('Math.hypot('));
  assert.deepEqual(calling, []);
});

test('an update allocates nothing that lasts, with embers, burning, choosing and charms in play: the pools keep their objects', () => {
  const s = createState({ seed: 3, god: true, charm: SALT });
  const bot = createBot();
  const creatures = s.creatures, events = s.events, first = s.creatures[0], flares = s.flares;
  const embers = s.embers, ember = s.embers[0], offer = s.offer, taken = s.taken, perks = s.perks;
  const charms = s.charms, charm = s.charms[0];
  let burnSeen = false, swaps = 0;
  const every = Math.round(7 / DT);
  for (let i = 0; i < 90 / DT; i++) {
    if (i % Math.round(5 / DT) === 0) {
      const c = s.creatures.find((c) => c.alive && !c.dying);
      if (c) igniteCreature(s, c);
    }
    // Every 7 s in a wave or a lull, a charm you don't have turns up at your feet (while one is left),
    // and two updates later you take it.
    if (i % every === 0 && (s.night.phase === 'wave' || s.night.phase === 'lull')) {
      let id = -1;
      for (let k = 0; k < CHARM_COUNT && id < 0; k++) if (k !== s.charm && !s.charms.some((c) => c.id === k)) id = k;
      if (id >= 0) Object.assign(s.charms.find((c) => c.id < 0), { id, x: s.player.x, y: s.player.y, until: s.night.wave + 1, settled: true });
    }
    const it = botIntents(s, bot, DT);
    it.take = i % every === 2 ? 1 : 0;
    step(s, it);
    for (let k = 0; k < s.eventCount; k++) if (s.events[k].type === 'charm') swaps++;
    if (s.creatures.some((c) => c.burnT > 0)) burnSeen = true;
  }
  assert.equal(s.creatures, creatures);
  assert.equal(s.creatures[0], first);
  assert.equal(s.events, events);
  assert.equal(s.flares, flares);
  assert.equal(s.embers, embers);
  assert.equal(s.embers[0], ember);
  assert.equal(s.offer, offer);
  assert.equal(s.taken, taken);
  assert.equal(s.perks, perks);
  assert.equal(s.charms, charms);
  assert.equal(s.charms[0], charm);
  assert.ok(s.bought > 0, 'the bot bought something in 90 s, so choosing ran too');
  assert.ok(burnSeen, 'burning ran too');
  assert.ok(swaps >= 5, `charms were taken and swapped: ${swaps}`);
});
