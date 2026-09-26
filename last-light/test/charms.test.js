// Cursed charms: dropping, lying on the snow, reading and taking, and what each one does.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHARM_LIST, CHARM_COUNT, WOLF, THREAD, CROW, SALT, HARE, EYE, dropCharm, wearCharm, lantern } from '../src/charms.js';
import { spawnCreature, damageCreature, igniteCreature, CRAWLER, GAUNT, LEAPER, MOTHER, KINDS } from '../src/creatures.js';
import { dropEmber } from '../src/embers.js';
import { startWave } from '../src/night.js';
import { createState } from '../src/sim.js';
import { CHARMS, CREATURES, EMBERS, LIGHT, NIGHT, PERKS, PLAYER, RIFLE, DT } from '../src/tuning.js';
import { quietState, run, runCollecting, intents } from './helpers.js';

const south = Math.PI / 2;
const onSnow = (s) => s.charms.filter((c) => c.id >= 0);
// A lull that never ends, on the porch at (19.5, 20.5): charms can be read and taken.
function lull() {
  const s = quietState();
  s.night.phase = 'lull';
  return s;
}
// Lays charm `id` on the snow at (x, y), as a drop would.
function lay(s, id, x, y) {
  const c = s.charms.find((o) => o.id < 0);
  Object.assign(c, { id, x, y, until: s.night.wave + 1, settled: false });
  return c;
}
// Kills one creature of `kind` at (x, y), freeing its slot straight away.
function killOne(s, kind, x = 30.5, y = 30.5) {
  const c = spawnCreature(s, kind, x, y);
  damageCreature(s, c, 9999);
  c.alive = false;
}

test('gaunts and leapers drop charms at their chances, each from its own list; crawlers never do', () => {
  for (const kind of [GAUNT, LEAPER, CRAWLER]) {
    const s = quietState(), name = KINDS[kind], n = 3000;
    let drops = 0;
    for (let i = 0; i < n; i++) {
      killOne(s, kind);
      for (const c of onSnow(s)) {
        drops++;
        assert.equal(CHARM_LIST[c.id].from, name);
        c.id = -1;
      }
    }
    const want = n * CHARMS.drop[name], spread = 4 * Math.sqrt(want) + 1;
    assert.ok(Math.abs(drops - want) <= spread, `${name}: ${drops} drops, about ${want} expected`);
  }
});

test('the Mother always drops hers where she died, and says so; she drops no ember', () => {
  const s = quietState();
  const m = spawnCreature(s, MOTHER, 25.5, 30.5);
  damageCreature(s, m, 9999);
  const c = onSnow(s)[0];
  assert.deepEqual([c.id, c.x, c.y], [EYE, 25.5, 30.5]);
  assert.equal(CHARM_LIST[EYE].from, 'mother');
  assert.ok(s.events.slice(0, s.eventCount).some((e) => e.type === 'charmDrop' && e.a === EYE && e.x === 25.5));
  assert.equal(s.embers.filter((e) => e.t > 0).length, 0);
});

test('a charm that drops is never the one you wear nor one on the snow; with none left, none drops', () => {
  const s = quietState();
  wearCharm(s, WOLF);
  lay(s, THREAD, 5.5, 5.5);
  for (let i = 0; i < 300; i++) {
    killOne(s, GAUNT);
    for (const c of onSnow(s)) {
      if (c.id === THREAD) continue;
      assert.equal(c.id, CROW);
      c.id = -1;
    }
  }
  lay(s, CROW, 6.5, 5.5);
  for (let i = 0; i < 300; i++) killOne(s, GAUNT);
  assert.deepEqual(onSnow(s).map((c) => c.id).sort(), [THREAD, CROW].sort());
});

test('a creature burned to death drops its charm too', () => {
  const s = quietState();
  const m = spawnCreature(s, MOTHER, 25.5, 30.5);
  m.hp = 1;
  igniteCreature(s, m);
  run(s, 0.5);
  assert.ok(m.dying > 0);
  assert.equal(onSnow(s)[0].id, EYE);
});

test("charm drops draw from their own random stream: the night's stays untouched", () => {
  const s = quietState();
  const c = spawnCreature(s, GAUNT, 30.5, 30.5);
  const night = s.rng.s, charms = s.charmRng.s;
  damageCreature(s, c, 9999);
  assert.equal(s.rng.s, night);
  assert.notEqual(s.charmRng.s, charms);
  assert.equal(dropCharm(s, 'crawler', 1, 1), null);
});

test('a charm lies through the rest of its wave and the lull, and goes when the next wave begins', () => {
  const s = createState({ seed: 4 });
  startWave(s, 0);
  s.night.qi = s.night.qn; // nothing more comes
  s.night.spawnT = Infinity;
  s.creatures.forEach((c) => (c.alive = false));
  lay(s, SALT, 25.5, 30.5);
  run(s, 1);
  assert.equal(s.night.phase, 'lull');
  assert.equal(onSnow(s).length, 1, 'still there in the lull');
  run(s, NIGHT.lull - 1.1);
  assert.equal(onSnow(s).length, 1, 'still there at the end of the lull');
  const ev = runCollecting(s, 0.2);
  assert.equal(s.night.phase, 'wave');
  assert.equal(onSnow(s).length, 0);
  assert.ok(ev.some((e) => e.type === 'charmOut' && e.a === SALT && e.x === 25.5));
});

test('you read the nearest charm within reach; beyond reach, or before the first wave, none', () => {
  const s = lull(); // you're at (19.5, 20.5)
  lay(s, WOLF, 19.5, 20.5 + CHARMS.reach + 0.05);
  run(s, DT);
  assert.equal(s.charmAt, -1, 'just out of reach');
  const near = lay(s, HARE, 19.5, 20.5 + CHARMS.reach - 0.05);
  const nearer = lay(s, SALT, 19.5 + 0.3, 20.5);
  run(s, DT);
  assert.equal(s.charms[s.charmAt], nearer);
  nearer.id = -1;
  run(s, DT);
  assert.equal(s.charms[s.charmAt], near);
  const d = quietState(); // dusk
  lay(d, WOLF, 19.5, 20.5);
  run(d, DT);
  assert.equal(d.charmAt, -1);
});

test('E takes the charm you read, once it was showing; a banner event says which', () => {
  const s = lull();
  const c = lay(s, WOLF, 19.5, 20.6);
  run(s, DT, intents({ take: 1 }));
  assert.equal(s.charm, -1, 'reached this update: not yet');
  const ev = runCollecting(s, DT, intents({ take: 1 }));
  assert.equal(s.charm, WOLF);
  assert.equal(c.id, -1, 'no longer on the snow');
  assert.ok(ev.some((e) => e.type === 'charm' && e.a === WOLF));
  assert.equal(s.charmAt, -1);
});

test('taking one leaves the one you wore at your feet, until the next wave; E again swaps back', () => {
  const s = lull();
  wearCharm(s, SALT);
  const c = lay(s, CROW, 19.5, 20.9);
  run(s, DT);
  run(s, DT, intents({ take: 1 }));
  assert.equal(s.charm, CROW);
  assert.deepEqual([c.id, c.x, c.y, c.until, c.settled], [SALT, s.player.x, s.player.y, 1, true]);
  assert.equal(s.charms[s.charmAt], c, 'you now read the one you left');
  run(s, DT, intents({ take: 1 }));
  assert.equal(s.charm, SALT);
  assert.equal(c.id, CROW);
});

test('once the night is over, you read and take nothing', () => {
  const s = lull();
  lay(s, WOLF, 19.5, 20.6);
  run(s, DT);
  s.night.phase = 'dawn';
  run(s, DT, intents({ take: 1 }));
  assert.equal(s.charmAt, -1);
  assert.equal(s.charm, -1);
  const d = lull();
  lay(d, WOLF, 19.5, 20.6);
  run(d, DT);
  assert.equal(d.charmAt, 0);
  d.player.health = 0;
  run(d, DT);
  assert.equal(d.night.phase, 'dead');
  assert.equal(d.charmAt, -1, 'dying clears the reading');
});

test('"Embers come to you": a new charm drifts to you once and settles; it does not follow you after', () => {
  const s = lull();
  s.gentle = true;
  const c = lay(s, WOLF, 19.5, 26.5);
  run(s, 1);
  assert.ok(Math.abs(c.y - (26.5 - CHARMS.drift)) < 0.05, `drifting at ${CHARMS.drift} cells/s: ${c.y}`);
  run(s, 2);
  const d = Math.sqrt((c.x - 19.5) ** 2 + (c.y - 20.5) ** 2);
  assert.ok(Math.abs(d - CHARMS.reach / 2) < 1e-6, `settled at half its reach: ${d}`);
  assert.equal(c.settled, true);
  run(s, 1, intents({ facing: -south, forward: 1 }));
  assert.ok(Math.abs(c.y - (20.5 + CHARMS.reach / 2)) < 1e-6, 'it stays where it settled');
});

test("Wolf's tooth: rifle shots hit half again as hard, and the lantern's light shrinks", () => {
  const s = quietState();
  wearCharm(s, WOLF);
  const g = spawnCreature(s, GAUNT, 19.5, 26.5);
  run(s, DT, intents({ facing: south, fire: true }));
  assert.equal(g.hp, CREATURES.gaunt.health - RIFLE.damage * CHARMS.wolf.damage);
  const L = lantern(s);
  assert.deepEqual([L.full, L.dark], [LIGHT.lantern.full * CHARMS.wolf.lantern, LIGHT.lantern.dark * CHARMS.wolf.lantern]);
  s.perks.wick = true;
  assert.equal(lantern(s).full, PERKS.wick.full * CHARMS.wolf.lantern, 'Wide wick shrinks too');
  wearCharm(s, -1);
  assert.equal(lantern(s).full, PERKS.wick.full);
});

test('Red thread: each kill heals you a little, and the stove no longer heals you', () => {
  const s = quietState();
  wearCharm(s, THREAD);
  s.player.health = 50;
  killOne(s, CRAWLER);
  assert.equal(s.player.health, 50 + CHARMS.thread.heal);
  s.player.health = PLAYER.health - 1;
  killOne(s, GAUNT);
  assert.equal(s.player.health, PLAYER.health, 'never past your maximum');
  const t = lull();
  wearCharm(t, THREAD);
  t.player.health = 50;
  t.player.x = t.stove.x;
  t.player.y = t.stove.y + 1;
  run(t, 1);
  assert.equal(t.player.health, 50);
  wearCharm(t, -1);
  run(t, 1);
  assert.ok(t.player.health > 70, 'without it, the stove heals');
});

test("Crow's feather: every ember is worth one more, and they hurt you a third more", () => {
  const s = quietState();
  wearCharm(s, CROW);
  for (const [kind, value] of [[CRAWLER, 2], [LEAPER, 3], [GAUNT, 4]]) {
    killOne(s, kind);
    const e = s.embers.find((o) => o.t > 0);
    assert.equal(e.value, value, KINDS[kind]);
    e.t = 0;
  }
  killOne(s, MOTHER);
  assert.equal(s.embers.filter((e) => e.t > 0).length, 0, 'the Mother still drops none');
  const c = spawnCreature(s, CRAWLER, 19.5, 21.2);
  const ev = runCollecting(s, 1);
  const bite = ev.find((e) => e.type === 'hurt');
  assert.ok(Math.abs(bite.a - CREATURES.crawler.damage * CHARMS.crow.hurt) < 1e-9);
  assert.ok(c.alive);
});

test("Grave salt: creatures slow in your lantern's clear light, and embers cool twice as fast", () => {
  const moved = (salt, x) => {
    const s = quietState();
    if (salt) wearCharm(s, SALT);
    const c = spawnCreature(s, CRAWLER, x, 20.5);
    run(s, 0.1);
    return Math.abs(c.x - x);
  };
  assert.ok(Math.abs(moved(true, 21.5) - moved(false, 21.5) * CHARMS.salt.slow) < 0.01, 'slowed in the light');
  assert.ok(Math.abs(moved(true, 25.5) - moved(false, 25.5)) < 1e-9, 'not beyond it');
  const s = quietState();
  wearCharm(s, SALT);
  dropEmber(s, 19.5, 30.5, 1);
  run(s, EMBERS.life / CHARMS.salt.cool + 0.1);
  assert.equal(s.embers.filter((e) => e.t > 0).length, 0);
});

test("Hare's foot: you move a quarter faster, and hold 75 health at most until you take another", () => {
  for (const [hare, want] of [[false, 1], [true, CHARMS.hare.speed]]) {
    const s = quietState();
    if (hare) wearCharm(s, HARE);
    run(s, 0.5, intents({ facing: south, forward: 1 }));
    const v = Math.sqrt(s.player.vx ** 2 + s.player.vy ** 2);
    assert.ok(Math.abs(v - PLAYER.walk * want) < 1e-6, `hare ${hare}: ${v}`);
  }
  const s = lull();
  assert.equal(s.player.health, PLAYER.health);
  wearCharm(s, HARE);
  assert.deepEqual([s.player.health, s.maxHealth], [CHARMS.hare.health, CHARMS.hare.health]);
  s.player.x = s.stove.x;
  s.player.y = s.stove.y + 1;
  run(s, 1);
  assert.equal(s.player.health, CHARMS.hare.health, 'the stove heals only to 75');
  wearCharm(s, WOLF);
  run(s, 2);
  assert.equal(s.player.health, PLAYER.health, 'the cap lifts');
});

test("the Mother's eye: the lantern gutters low", () => {
  const s = quietState();
  wearCharm(s, EYE);
  assert.equal(lantern(s).full, LIGHT.lantern.full * CHARMS.eye.lantern);
  assert.equal(lantern(s).dark, LIGHT.lantern.dark * CHARMS.eye.lantern);
});

test('createState({ charm }) starts the night wearing it; the list holds six, with short lines', () => {
  const s = createState({ seed: 1, charm: HARE });
  assert.equal(s.charm, HARE);
  assert.equal(s.player.health, CHARMS.hare.health);
  assert.equal(createState({ seed: 1 }).charm, -1);
  assert.equal(CHARM_COUNT, 6);
  for (const c of CHARM_LIST) {
    assert.ok(c.name.length <= 20, c.name);
    assert.ok(c.gives.length <= 36 && c.takes.length <= 36, c.key);
    assert.ok(['gaunt', 'leaper', 'mother'].includes(c.from));
  }
  assert.equal(new Set(CHARM_LIST.map((c) => c.key)).size, CHARM_COUNT);
});
