# Last Light: Cursed charms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After-eaters sometimes drop a charm that gives you something and takes something. You stand over it to read it, E takes it, and you wear one at a time, so taking one leaves yours on the snow. The charm you wear hangs from your gun, swinging.

**Architecture:**
- **The rules** live in the simulation, like everything else in Last Light:
  - `charms.js` holds the six charms, the slots on the snow, dropping, reading and taking, and `lantern(state)`;
  - each charm's effect is read from `state.charm` where it matters (weapons, creatures, embers, the player, the night and the scene).
- **Showing it:** the scene draws charms on the snow and their light, and the Mother's eye marks creatures `xray`, which the renderer draws through walls. The HUD draws the reading, and the charm you wear hanging from the gun in your hands: a pendant drawn turned to 11 angles (the art), chosen by a damped pendulum the HUD runs each frame.
- **The page:** sounds, banners, `?charm=`, and the swing handed to the HUD.

**Tech stack:** plain ES modules, no build step, no dependencies; Node 22 `node --test`; art from Lua scripts through Aseprite's CLI; Web Audio for sound.

**Spec:** `docs/superpowers/specs/2026-09-26-last-light-cursed-charms-design.md`. It amends the game specified in `docs/superpowers/specs/2026-09-24-last-light-design.md` and `docs/superpowers/specs/2026-09-25-last-light-dark-harvest-design.md`.

## Global Constraints

- Plain ES modules, no build step and no dependencies. Tests run with Node 22: `cd last-light && npm test`.
- The simulation (`sim.js` and everything `step` calls) never touches the DOM, the clock or `Math.random`, and allocates nothing in an update:
  - fixed pools and reused objects;
  - randomness only from `state.rng`, and for charm drops only from `state.charmRng`.
- A night where you never take a charm plays exactly as it did before this feature: every existing test passes unchanged, including the bot's.
- Every number the game plays by is in `last-light/src/tuning.js`.
- All art comes from the Lua scripts in `art/last-light/`, through Aseprite, and is deterministic: rebuilding an unchanged script writes identical bytes. The art loop, from the repo root:
  `for s in textures sky sprites hands hud icon; do /Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/last-light/$s.lua; done`
- **Speed:** the renderer benchmark stays under 4 ms a frame at 480×270 (`cd last-light && npm run bench`).
- **The bot:** `?debug=bot` plays whole nights to dawn in god mode with no console errors. It never takes a charm.
- **Storage:** nothing new is stored, and nothing carries over between nights.
- **Copy, exactly:**
  - the charms' names and lines are in Task 1's `charms.js` (names at most 20 characters, lines at most 36);
  - "E to take it", and "E to take it, leaving " followed by the name of the charm you wear;
  - "A charm" / "Something glints where it fell.";
  - the title's keys line: "1/2 guns  F flare  E charm  Shift run  Esc pause  M mute".
- **Code style:** match the surrounding code: comments in plain sentences, British spelling where the code already uses it ("colour"), no allocation in hot paths.

## How this plan was made, and how to work it

- **Tested before it was written.** The code in this plan was built and tested as a working prototype first. Then each task's end state was replayed in order, with these results:

  | After task | Tests passing |
  |---|---|
  | 1 | 252 (on a clean copy of `main`) |
  | 2 | 253 |
  | 3 | 255 (on the branch after Task 2, with Task 1's review fixes) |
  | 4 | 265 |
  | 5 | 267 |

- **Amended after Task 2.** Nathan asked for the charm you wear to hang from the side of your gun, as weapon charms do in shooters (his reference: The Finals). Tasks 1 and 2 were built by then and keep their text. Task 3 (the art for it) is new, and Tasks 4 and 5 (once Tasks 3 and 4) were rebuilt from the amended prototype, replayed on top of the branch as it stood after Task 2.

- **File blocks are whole files.** Every block headed "(the full file now)" or "(new, the full file)" is the complete file, byte for byte, ending with one newline. Write it exactly; the controller may give you a script that writes a task's blocks.
- **Some files are edited, not rewritten:** `art/last-light/sprites.lua` and `hud.lua` (Task 2), `art/last-light/lib.lua`, `hands.lua` and `hud.lua` (Task 3), and `README.md` (Task 5). Their edits are exact find-and-replace pairs, each found exactly once in the file, applied in order.
- **Generated art is committed.** Tasks 2 and 3 regenerate art files: run the art loop and commit what it writes. Only the files each task lists should change.

## Rulings made while planning

These are recorded as ruling, reason, and cost if wrong.

- **One slot for each charm**, not a pool of 8 that replaces the oldest. The spec is updated.
  - Why: a drop is never the charm you wear or one on the snow, so no charm is ever in two places, and six slots can never fill.
  - Cost if wrong: none.
- **An ember worth 4 is drawn bigger still** (1.65 times the sprite, after 1, 1.25 and 1.5). The spec is updated.
  - Why: Crow's feather makes a gaunt's ember worth 4, and the size table stopped at 3, which drew it with no height at all.
  - Cost if wrong: one number.
- **Taking the last charm there clears the reading at once.** When E takes a charm and you wore none, there's nothing left in that slot, so `charmAt` becomes -1 in the same update.
  - Why: the HUD would otherwise read an empty slot until the next update.
  - Cost if wrong: none.
- **Grave salt's slowing multiplies with a flare's**: a creature in both is at 0.5 × 0.75.
  - Why: the spec says "on top of a flare's slowing".
  - Cost if wrong: one line.
- **The charms' random stream is seeded with `seed ^ 0x5bd1e995`.**
  - Why: any fixed mix keeps it apart from the night's own stream, so the night's draws never change.
  - Cost if wrong: none.
- **The charm you wear hangs from your gun; the corner icon is gone** (the amendment). The spec is updated.
  - Why: Nathan asked for it, with a reference picture; "attach it to your gun" was the pitch.
  - Cost if wrong: the corner icon is one line to bring back.
- **Each gun frame's charm point is projected from the gun's model** in `hands.lua` (on the inner side of each gun's fore-end), not measured by hand.
  - Why: the shotgun's fore-end swings down with its barrels on the reload frames, and a point on the model follows it exactly.
  - Cost if wrong: two points in `hands.lua`.
- **Pendants are drawn turned, 11 ways, rather than turned by the canvas.**
  - Why: pixel art turned at run time comes out ragged; drawn turned in the Lua, with each pixel taking the colour most of its samples land on, every pixel stays a palette colour and thin lines (the chain, the thread) survive.
  - Cost if wrong: `hud.png` grows by 66 pieces (about 3,000 pixels wide, mostly empty).
- **The swing is the HUD's, per frame, not the simulation's.**
  - Why: it's for show, like the sparks and the spray; it takes the frame's time, so it's the same at any frame rate (in steps of at most 1/240 s), and holds still while paused.
  - Cost if wrong: none for play.

## Review Focus

These are situations the spec implies but the main tests don't reach, most likely to bite first. Each now has a pinning test in the task that owns the code.

1. **Taking a charm unread:** pressing E in the same update you reach a charm must not take it. This is Task 1's charms test ("E takes the charm you read, once it was showing").
2. **Swapping back:** after a swap you stand over the charm you left; E again takes it back, and your new one lies there instead. This is Task 1's charms test ("taking one leaves the one you wore at your feet").
3. **Hare's foot's cap:** taking it brings your health down to 75 at once, the stove heals only to 75, and taking another charm lets it heal to 100. This is Task 1's charms test.
4. **Crow's feather's biggest ember:** a gaunt's ember worth 4 is drawn, bigger than a 3. This is Task 4's scene test.
5. **A pause between pressing E and the next update:** the press is forgotten, like the fire's keys. This is Task 1's input test.
6. **Frame rate:** the charm on your gun swings alike at 30 and 144 frames a second. This is Task 4's HUD test.
7. **Reloading and dying:** the charm goes down with the rifle when it loads, and isn't drawn once you're dead. This is Task 4's HUD test.

## File structure

| File | Task | What it's responsible for |
|---|---|---|
| `last-light/src/tuning.js` | 1 | `CHARMS`, and `KEYS.take` |
| `last-light/src/charms.js` (new) | 1 | The six charms, their slots on the snow, dropping (with `state.charmRng`), fading at the next wave, drifting to you (gentle), reading and taking, wearing, and `lantern(state)` |
| `last-light/src/creatures.js` | 1 | `kill()` drops a charm and heals you with Red thread; Crow's feather's ember; Grave salt's slowing |
| `last-light/src/embers.js` | 1 | Grave salt: embers cool twice as fast |
| `last-light/src/weapons.js` | 1 | Wolf's tooth: rifle damage |
| `last-light/src/player.js` | 1 | Crow's feather: damage you take |
| `last-light/src/night.js` | 1 | Red thread: the stove doesn't heal |
| `last-light/src/sim.js` | 1 | The new state, `createState({ charm })`, Hare's foot's speed, and `updateCharms` in the update order |
| `last-light/src/events.js` | 1 | Documents the new events |
| `last-light/src/input.js` | 1 | E gives `take` |
| `last-light/src/bot.js` | 1 | Its intents carry `take: 0` |
| `art/last-light/sprites.lua`, `hud.lua` (+ generated assets) | 2 | The charm sprite; the six charm icons |
| `art/last-light/lib.lua`, `hands.lua`, `hud.lua` (+ generated assets), `last-light/src/assets.js` | 3 | Each gun frame's charm point (`hands.json`'s `charms`); the six pendants, turned; the loader passes the points on |
| `last-light/src/scene.js`, `render.js` | 4 | Charms on the snow and their light; the lantern from `lantern(state)`; `xray` eyes; an ember worth 4 |
| `last-light/src/hud.js` | 4 | The reading; the charm on your gun and its swing; "E charm" on the title screen |
| `last-light/bench.js` | 4 | Charms on the snow and `xray` creatures in the busy frame |
| `last-light/src/audio.js`, `game.js`, `main.js`, `README.md` | 5 | Sounds, banners, `?charm=`, the swing handed to the HUD, docs |

---

## Task 1: The charms and what they do (the rules)

**Files:**
- Create:
  - `last-light/src/charms.js`
  - `last-light/test/charms.test.js`
- Modify, each as a full replacement:
  - `last-light/src/tuning.js`, `creatures.js`, `embers.js`, `weapons.js`, `player.js`, `night.js`, `sim.js`, `events.js`, `input.js`, `bot.js`
  - `last-light/test/helpers.js` (intents gain `take`)
  - `last-light/test/input.test.js`, `sim.test.js`, `bot.test.js`

**Interfaces:**
- **Consumes** (existing code): `createRng(seed)` and `nextRandom(rng)`, `emit(state, type, x, y, a, b)`, `KINDS` in `creatures.js`, `LIGHT.lantern`, `PERKS.wick`, `PLAYER.health`, `state.maxHealth`, `state.gentle`, `state.night.{ phase, wave }`.
- **Produces:**
  - **`tuning.js`:**
    - `CHARMS { drop: { crawler, gaunt, leaper, mother }, reach, flicker, drift, light: { full, dark, intensity }, wolf: { damage, lantern }, thread: { heal }, crow: { ember, hurt }, salt: { slow, cool }, hare: { speed, health }, eye: { lantern } }`
    - `KEYS.take = ['KeyE']`
  - **`charms.js`:**
    - ids `WOLF = 0, THREAD = 1, CROW = 2, SALT = 3, HARE = 4, EYE = 5`;
    - `CHARM_LIST`, entries `{ key, from, name, gives, takes }` in id order, with keys wolf, thread, crow, salt, hare, eye and `from` one of 'gaunt', 'leaper', 'mother';
    - `CHARM_COUNT` (6), `createCharms()`, `dropCharm(state, kind, x, y) → slot|null` (`kind` is a name from `KINDS`), `wearCharm(state, id)` (-1 takes it off), `updateCharms(state, intents, dt)`, `lantern(state) → { full, dark, intensity }` (a reused object).
    - A slot is `{ id, x, y, until, settled }`, on the snow while `id >= 0`.
  - **State** (`sim.js`): `charm` (worn id, or -1), `charms` (the slots), `charmRng`, `charmAt` (the slot you're reading, or -1). `createState({ charm })` starts the night wearing it.
  - **Intents:** `take` (a press, 0 or 1), from E.
  - **Events:** `charmDrop` (where it fell; a = id), `charm` (you; a = id), `charmOut` (where it was; a = id).

- [ ] **Step 1: Write the failing tests**

`last-light/test/helpers.js` (the full file now):
```js
// Shared test helpers.
import { parseMap } from '../src/map.js';
import { createState, step } from '../src/sim.js';
import { DT } from '../src/tuning.js';

// A small map from rows; by default an open 12x12 room with the start in the middle.
export function room(rows) {
  return parseMap(
    rows ?? [
      '############',
      '#..........#',
      '#..........#',
      '#..........#',
      '#..........#',
      '#.....@....#',
      '#..........#',
      '#..........#',
      '#..........#',
      '#..........#',
      '#..........#',
      '############',
    ],
  );
}

export const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

// Intents for one update, all idle; override what a test needs.
export function intents(over = {}) {
  return { pick: 0, take: 0, facing: 0, pitch: 0, forward: 0, strafe: 0, run: false, fire: false, flare: 0, reload: 0, weapon: 0, weaponStep: 0, ...over };
}

// A night on the real map, held in its dusk so nothing spawns unless a test starts it. You're on the
// porch at (19.5, 20.5), facing south.
export function quietState(over = {}) {
  const state = createState({ seed: 1, ...over });
  state.night.t = Infinity;
  return state;
}

// Runs `seconds` of updates with the same intents.
export function run(state, seconds, it = intents()) {
  const n = Math.round(seconds / DT);
  for (let i = 0; i < n; i++) step(state, it);
}

// Runs `seconds` of updates and returns every event, as plain objects.
export function runCollecting(state, seconds, it = intents()) {
  const seen = [];
  const n = Math.round(seconds / DT);
  for (let i = 0; i < n; i++) {
    step(state, it);
    for (let k = 0; k < state.eventCount; k++) seen.push({ ...state.events[k] });
  }
  return seen;
}
```

`last-light/test/charms.test.js` (new, the full file):
```js
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
  const ev = runCollecting(s, 0);
  damageCreature(s, m, 9999);
  const c = onSnow(s)[0];
  assert.deepEqual([c.id, c.x, c.y], [EYE, 25.5, 30.5]);
  assert.equal(CHARM_LIST[EYE].from, 'mother');
  assert.ok(s.events.slice(0, s.eventCount).some((e) => e.type === 'charmDrop' && e.a === EYE && e.x === 25.5));
  assert.equal(s.embers.filter((e) => e.t > 0).length, 0);
  assert.deepEqual(ev, []);
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
```

`last-light/test/input.test.js` (the full file now):
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInput } from '../src/input.js';
import { MOUSE, VIEW } from '../src/tuning.js';

// A stand-in for window and document: dispatches events to listeners.
function fakeTarget() {
  const ls = {};
  return {
    addEventListener: (t, f) => (ls[t] ??= []).push(f),
    fire: (t, e = {}) => {
      const evt = { prevented: false, preventDefault() { evt.prevented = true; }, ...e };
      (ls[t] ?? []).forEach((f) => f(evt));
      return evt;
    },
  };
}

function setup() {
  const win = fakeTarget(), doc = fakeTarget();
  const input = createInput(win, doc);
  const canvas = {};
  input.element = canvas;
  doc.pointerLockElement = canvas;
  doc.fire('pointerlockchange');
  return { win, doc, input };
}

test('WASD gives forward and strafe; Shift runs', () => {
  const { win, input } = setup();
  win.fire('keydown', { code: 'KeyW' });
  win.fire('keydown', { code: 'KeyD' });
  win.fire('keydown', { code: 'ShiftLeft' });
  let s = input.sample();
  assert.deepEqual([s.forward, s.strafe, s.run], [1, 1, true]);
  win.fire('keyup', { code: 'KeyW' });
  win.fire('keydown', { code: 'KeyS' });
  s = input.sample();
  assert.equal(s.forward, -1);
});

test('the mouse turns you at once, scaled by sensitivity, while the pointer is locked', () => {
  const { win, doc, input } = setup();
  win.fire('mousemove', { movementX: 100 });
  assert.ok(Math.abs(input.facing - 100 * MOUSE.sensitivity) < 1e-12);
  input.sensitivity = 2;
  win.fire('mousemove', { movementX: -50 });
  assert.ok(Math.abs(input.facing) < 1e-12);
  doc.pointerLockElement = null;
  doc.fire('pointerlockchange');
  win.fire('mousemove', { movementX: 100 });
  assert.ok(Math.abs(input.facing) < 1e-12, 'unlocked: no turning');
});

test('moving the mouse up looks up and down looks down, at once, as far as VIEW.maxPitch either way', () => {
  const { win, doc, input } = setup();
  win.fire('mousemove', { movementY: -40 });
  assert.ok(Math.abs(input.pitch - 40 * MOUSE.sensitivity) < 1e-12, `up is positive: ${input.pitch}`);
  input.sensitivity = 2;
  win.fire('mousemove', { movementY: 40 });
  assert.ok(Math.abs(input.pitch + 40 * MOUSE.sensitivity) < 1e-12, 'the sensitivity scales it too');
  assert.equal(input.sample().pitch, input.pitch);
  for (let i = 0; i < 20; i++) win.fire('mousemove', { movementY: -100 });
  assert.equal(input.pitch, VIEW.maxPitch);
  for (let i = 0; i < 40; i++) win.fire('mousemove', { movementY: 100 });
  assert.equal(input.pitch, -VIEW.maxPitch);
  assert.equal(input.facing, 0, 'looking up and down never turns you');
  doc.pointerLockElement = null;
  doc.fire('pointerlockchange');
  win.fire('mousemove', { movementY: -100 });
  assert.equal(input.pitch, -VIEW.maxPitch, 'unlocked: no looking');
});

test('a single huge mouse jump is a browser glitch and is ignored', () => {
  const { win, input } = setup();
  win.fire('mousemove', { movementX: MOUSE.spike + 1 });
  assert.equal(input.facing, 0);
  const other = setup(); // judged from stillness, not from the jump above
  other.win.fire('mousemove', { movementX: 3, movementY: -(MOUSE.spike + 1) });
  assert.deepEqual([other.input.facing, other.input.pitch], [0, 0], 'a jump up or down is dropped too, sideways and all');
});

test('a fast flick that ramps up is a hand, not a glitch: every event of it turns you', () => {
  const { win, input } = setup();
  input.sensitivity = MOUSE.minScale; // the slider at its lowest, where a panicked flick is biggest
  for (const dx of [200, 400, 700, 900, 900]) win.fire('mousemove', { movementX: dx });
  assert.ok(Math.abs(input.facing - 3100 * MOUSE.sensitivity * MOUSE.minScale) < 1e-12, `turned ${input.facing}`);
});

test('a jump out of a slow turn is still a glitch, and the lock starts every judgement afresh', () => {
  const { win, doc, input } = setup();
  input.sensitivity = MOUSE.minScale;
  const turn = MOUSE.sensitivity * MOUSE.minScale;
  win.fire('mousemove', { movementX: 30 });
  win.fire('mousemove', { movementX: 5000 });
  assert.ok(Math.abs(input.facing - 30 * turn) < 1e-12, 'the jump is dropped');
  // A fast flick, then Esc and back: the glitch that comes with the new lock isn't judged by that flick.
  const before = input.facing;
  for (const dx of [300, 700, 900]) win.fire('mousemove', { movementX: dx });
  doc.pointerLockElement = null;
  doc.fire('pointerlockchange');
  doc.pointerLockElement = input.element;
  doc.fire('pointerlockchange');
  win.fire('mousemove', { movementX: 3000 });
  assert.ok(Math.abs(input.facing - before - 1900 * turn) < 1e-12, `turned ${input.facing - before}`);
});

test('a click shorter than an update still fires once; holding keeps firing', () => {
  const { win, input } = setup();
  win.fire('mousedown', { button: 0 });
  win.fire('mouseup', { button: 0 });
  assert.equal(input.sample().fire, true);
  assert.equal(input.sample().fire, false);
  win.fire('mousedown', { button: 0 });
  assert.equal(input.sample().fire, true);
  assert.equal(input.sample().fire, true);
});

test('presses are latched once: reload, flare (F or right click), weapon keys', () => {
  const { win, input } = setup();
  win.fire('keydown', { code: 'KeyR' });
  win.fire('keydown', { code: 'KeyR', repeat: true });
  win.fire('mousedown', { button: 2 });
  win.fire('keydown', { code: 'Digit2' });
  let s = input.sample();
  assert.deepEqual([s.reload, s.flare, s.weapon], [1, 1, 2]);
  s = input.sample();
  assert.deepEqual([s.reload, s.flare, s.weapon], [0, 0, 0]);
  win.fire('keyup', { code: 'KeyR' });
  win.fire('keydown', { code: 'KeyR' });
  assert.equal(input.sample().reload, 1);
});

test("keys 1 to 3 are the fire's cards too: 1 and 2 still give their gun, 3 only a card", () => {
  const { win, input } = setup();
  win.fire('keydown', { code: 'Digit2' });
  let s = input.sample();
  assert.deepEqual([s.pick, s.weapon], [2, 2]);
  win.fire('keyup', { code: 'Digit2' });
  win.fire('keydown', { code: 'Digit3' });
  s = input.sample();
  assert.deepEqual([s.pick, s.weapon], [3, 0]);
  assert.equal(input.sample().pick, 0, 'a press counts once');
  win.fire('keyup', { code: 'Digit3' });
  win.fire('keydown', { code: 'Digit1' });
  input.releaseAll(); // a pause between the press and the next update forgets it
  assert.equal(input.sample().pick, 0);
});

test('E takes a charm: a press counts once, and a pause forgets it', () => {
  const { win, input } = setup();
  win.fire('keydown', { code: 'KeyE' });
  assert.equal(input.sample().take, 1);
  assert.equal(input.sample().take, 0, 'a press counts once');
  win.fire('keyup', { code: 'KeyE' });
  win.fire('keydown', { code: 'KeyE' });
  input.releaseAll();
  assert.equal(input.sample().take, 0);
});

test('the wheel steps weapons, once per fling', () => {
  const { win, input } = setup();
  win.fire('wheel', { deltaY: 5, timeStamp: 1000 });
  win.fire('wheel', { deltaY: 5, timeStamp: 1020 });
  assert.equal(input.sample().weaponStep, 1);
  win.fire('wheel', { deltaY: -5, timeStamp: 1300 });
  assert.equal(input.sample().weaponStep, -1);
  assert.equal(input.sample().weaponStep, 0);
});

test('a long trackpad fling is one weapon step however long it runs; a fresh flick after a pause is another', () => {
  const { win, input } = setup();
  // One wheel event every 16 ms for a second, sampled at 120 Hz as the game does.
  const steps = [];
  let at = 1000;
  for (let t = 1000; t < 2000; t += 1000 / 120) {
    for (; at <= t; at += 16) win.fire('wheel', { deltaY: 30, timeStamp: at });
    const s = input.sample().weaponStep;
    if (s) steps.push(s);
  }
  assert.deepEqual(steps, [1]);
  win.fire('wheel', { deltaY: -30, timeStamp: at + 200 });
  assert.equal(input.sample().weaponStep, -1);
});

test('losing focus or the pointer lock releases every key and the trigger', () => {
  const { win, doc, input } = setup();
  win.fire('keydown', { code: 'KeyW' });
  win.fire('mousedown', { button: 0 });
  win.fire('blur');
  let s = input.sample();
  assert.deepEqual([s.forward, s.fire], [0, false]);
  win.fire('keydown', { code: 'KeyW' });
  doc.pointerLockElement = null;
  doc.fire('pointerlockchange');
  s = input.sample();
  assert.equal(s.forward, 0);
});

test('a key pressed while paused does not carry into the resumed night', () => {
  const { win, doc, input } = setup();
  win.fire('keydown', { code: 'KeyW' });
  win.fire('mousedown', { button: 0 });
  doc.pointerLockElement = null;
  doc.fire('pointerlockchange');
  win.fire('keydown', { code: 'KeyR' });
  win.fire('keydown', { code: 'KeyF' });
  win.fire('keydown', { code: 'Digit2' });
  doc.pointerLockElement = input.element;
  doc.fire('pointerlockchange');
  const s = input.sample();
  assert.deepEqual([s.forward, s.fire, s.reload, s.flare, s.weapon], [0, false, 0, 0, 0]);
});

test('Cmd shortcuts are left to the browser, and Cmd releases held keys', () => {
  const { win, input } = setup();
  win.fire('keydown', { code: 'KeyW' });
  win.fire('keydown', { code: 'MetaLeft' });
  assert.equal(input.sample().forward, 0);
  win.fire('keydown', { code: 'KeyR', metaKey: true });
  assert.equal(input.sample().reload, 0);
});

test('unlocked, a click is not a shot', () => {
  const { win, doc, input } = setup();
  doc.pointerLockElement = null;
  doc.fire('pointerlockchange');
  win.fire('mousedown', { button: 0 });
  assert.equal(input.sample().fire, false);
});

test('unlocked, movement keys reach the page (not default-prevented, not latched); M still mutes; locking lets them move you again', () => {
  const { win, doc, input } = setup();
  doc.pointerLockElement = null;
  doc.fire('pointerlockchange');
  const evt = win.fire('keydown', { code: 'ArrowLeft' });
  assert.equal(evt.prevented, false);
  assert.equal(input.sample().strafe, 0);
  win.fire('keydown', { code: 'KeyM' });
  assert.equal(input.takeUI().mute, 1);
  doc.pointerLockElement = input.element;
  doc.fire('pointerlockchange');
  win.fire('keydown', { code: 'ArrowLeft' });
  assert.equal(input.sample().strafe, -1);
});

test('releaseAll also forgets presses not yet taken', () => {
  const { win, input } = setup();
  win.fire('keydown', { code: 'KeyR' });
  input.releaseAll();
  assert.equal(input.sample().reload, 0);
});

test('M is a page press: taken once', () => {
  const { win, input } = setup();
  win.fire('keydown', { code: 'KeyM' });
  assert.equal(input.takeUI().mute, 1);
  assert.equal(input.takeUI().mute, 0);
});

test('lock() asks for raw input, and falls back to plain pointer lock', async () => {
  const { input } = setup();
  const asked = [];
  input.element = {
    requestPointerLock(opts) {
      asked.push(opts ?? null);
      return opts ? Promise.reject(new Error('unsupported')) : Promise.resolve();
    },
  };
  assert.equal(await input.lock(), true);
  assert.deepEqual(asked, [{ unadjustedMovement: true }, null]);
  input.element = { requestPointerLock: () => Promise.reject(new Error('too soon')) };
  assert.equal(await input.lock(), false);
});
```

`last-light/test/sim.test.js` (the full file now):
```js
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
    // Every 7 s a charm turns up at your feet, and two updates later you take it.
    if (i % every === 0) {
      const slot = s.charms.find((c) => c.id < 0);
      let id = 0;
      while (id === s.charm || s.charms.some((c) => c.id === id)) id = (id + 1) % CHARM_COUNT;
      Object.assign(slot, { id, x: s.player.x, y: s.player.y, until: s.night.wave + 1, settled: true });
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
```

`last-light/test/bot.test.js` (the full file now):
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { step, createState } from '../src/sim.js';
import { createBot, botIntents } from '../src/bot.js';
import { spawnCreature, CRAWLER, MOTHER } from '../src/creatures.js';
import { DT, VIEW } from '../src/tuning.js';
import { quietState } from './helpers.js';
import { dropEmber } from '../src/embers.js';
import { UPGRADE_LIST } from '../src/upgrades.js';
import { CHARM_LIST, CHARM_COUNT } from '../src/charms.js';

test('the bot looks down to shoot a crawler at its feet', () => {
  const s = quietState(); // on the porch, facing south
  const c = spawnCreature(s, CRAWLER, 19.5, 21.8);
  const bot = createBot();
  let lowest = 0;
  for (let i = 0; i < 1 / DT && !c.dying; i++) {
    step(s, botIntents(s, bot, DT));
    lowest = Math.min(lowest, bot.pitch);
  }
  assert.ok(c.dying > 0, 'dead within a second');
  assert.ok(lowest < -0.1, `looked down to ${lowest}`);
});

test('the bot looks up at the Mother, never past how far you can look', () => {
  const s = quietState();
  spawnCreature(s, MOTHER, 19.5, 23.5);
  const bot = createBot();
  let highest = 0;
  for (let i = 0; i < 0.5 / DT; i++) {
    step(s, botIntents(s, bot, DT));
    highest = Math.max(highest, bot.pitch);
    assert.ok(Math.abs(bot.pitch) <= VIEW.maxPitch);
    assert.equal(s.player.pitch, bot.pitch);
  }
  assert.ok(highest > 0.1, `looked up to ${highest}`);
});

test('the bot only fires once the crosshair is on a crawler, not over its back', () => {
  const s = quietState();
  spawnCreature(s, CRAWLER, 19.5, 21.5); // straight ahead, 1 cell off: level passes over it
  const bot = createBot();
  const first = botIntents(s, bot, DT);
  assert.equal(first.fire, false, 'still looking level');
  let fired = false;
  for (let i = 0; i < 20 && !fired; i++) fired = botIntents(s, bot, DT).fire;
  assert.ok(fired, `fired once looking down, at ${bot.pitch}`);
});

test('a crawler at its feet: the bot looks down only as far as you can', () => {
  const s = quietState();
  const c = spawnCreature(s, CRAWLER, 19.5, 21);
  const bot = createBot();
  for (let i = 0; i < 0.5 / DT; i++) {
    c.x = s.player.x; // held half a cell in front, where it wants to look further down than that
    c.y = s.player.y + 0.5;
    c.hp = 1e9;
    step(s, botIntents(s, bot, DT));
    assert.ok(bot.pitch >= -VIEW.maxPitch, `${bot.pitch}`);
  }
  assert.equal(bot.pitch, -VIEW.maxPitch);
});

const ORDER = ['warm', 'quickLever', 'pierce', 'reach', 'dragon', 'deepMagazine', 'magnesium', 'steady', 'wick', 'snowshoes', 'slugs', 'pockets'];

test('the bot fetches an ember it can reach before it cools, and leaves one that will be gone', () => {
  const s = quietState(); // on the porch
  dropEmber(s, 19.5, 24.5, 1);
  const bot = createBot();
  for (let i = 0; i < 2 / DT && s.carried === 0; i++) step(s, botIntents(s, bot, DT));
  assert.equal(s.carried, 1);
  const t = quietState();
  const e = dropEmber(t, 19.5, 26.5, 3);
  e.t = 0.5; // six cells off, half a second left: not worth it
  const other = createBot();
  for (let i = 0; i < 0.4 / DT; i++) step(t, botIntents(t, other, DT));
  assert.ok(t.player.y < 21, `stayed put: ${t.player.y}`);
});

test('at the fire the bot takes the card it likes best', () => {
  const s = quietState();
  s.night.phase = 'lull';
  s.night.t = 1e9;
  s.carried = 6;
  s.player.x = s.stove.x;
  s.player.y = s.stove.y + 0.9;
  const bot = createBot();
  step(s, botIntents(s, bot, DT)); // the fire draws its three
  const offer = Array.from(s.offer.subarray(0, s.offerN));
  step(s, botIntents(s, bot, DT));
  assert.equal(s.bought, 1);
  const best = offer.map((id) => UPGRADE_LIST[id].key).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))[0];
  assert.equal(UPGRADE_LIST[s.taken[0]].key, best);
});

test('buying several cards in one visit, the bot takes the best of each offer', () => {
  const s = quietState();
  s.night.phase = 'lull';
  s.night.t = 1e9;
  s.carried = 30; // 6 + 10 + 14: three cards
  s.player.x = s.stove.x;
  s.player.y = s.stove.y + 0.9;
  const bot = createBot();
  for (let i = 0; i < 20 && s.bought < 3; i++) {
    const shown = Array.from(s.offer.subarray(0, s.offerN));
    const before = s.bought;
    step(s, botIntents(s, bot, DT));
    if (s.bought > before) {
      const best = shown.map((id) => UPGRADE_LIST[id].key).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))[0];
      assert.equal(UPGRADE_LIST[s.taken[before]].key, best, `card ${before + 1}`);
    }
  }
  assert.equal(s.bought, 3);
});

test('over whole nights (it cannot die), the bot buys 5 to 7 upgrades a night on average', () => {
  let picks = 0;
  for (let seed = 1; seed <= 8; seed++) {
    const s = createState({ seed, god: true });
    const bot = createBot();
    for (let i = 0; i < (20 * 60) / DT && s.night.phase !== 'dawn'; i++) step(s, botIntents(s, bot, DT));
    assert.equal(s.night.phase, 'dawn', `seed ${seed}`);
    picks += s.bought;
  }
  const avg = picks / 8;
  assert.ok(avg >= 5 && avg <= 7, `${avg} a night`);
});

test('wearing any charm, the bot (unable to die) still plays a whole night to the dawn, and never takes one', () => {
  for (let charm = 0; charm < CHARM_COUNT; charm++) {
    const s = createState({ seed: 3, god: true, charm });
    const bot = createBot();
    for (let i = 0; i < (20 * 60) / DT && s.night.phase !== 'dawn'; i++) step(s, botIntents(s, bot, DT));
    assert.equal(s.night.phase, 'dawn', CHARM_LIST[charm].key);
    assert.equal(s.charm, charm, 'still the one it started with');
  }
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd last-light && npm test`
Expected: FAIL. `charms.test.js`, `sim.test.js` and `bot.test.js` can't load `../src/charms.js`, and the input test's E press gives no `take`.

- [ ] **Step 3: Write the code**

`last-light/src/tuning.js` (the full file now):
```js
// Every number the game plays by. Distances are in grid cells, times in seconds, angles in radians.
// Play-testing changes go here.
export const TICK_HZ = 120;
export const DT = 1 / TICK_HZ;

export const PLAYER = {
  radius: 0.25,
  walk: 3.0,
  run: 4.8,
  accelTime: 0.1, // from standing to full speed
  stopTime: 0.08, // from full speed to standing
  health: 100,
  eye: 0.5, // your eyes' height; walls are 1 tall
};

export const VIEW = {
  targetHeight: 270, // internal pixels; 1080p is exactly 4x
  tanHalfV: 0.5625, // fixed vertical half-angle: 90 degrees across at 16:9
  maxAspect: 21 / 9,
  bobPixels: 1.5, // head bob height at walking speed, in internal pixels at 270 tall
  // How far you can look up or down, radians (about 26 degrees). The view shears rather than tilts, as
  // in Duke Nukem 3D: the horizon moves and walls stay upright, and much further the stretch would show.
  maxPitch: 0.45,
};

export const MOUSE = {
  sensitivity: 0.0025, // radians per count at 1x
  minScale: 0.25,
  maxScale: 4,
  // A browser glitch (Chrome's, as the pointer lock starts) is one event that jumps out of nowhere: over
  // `spike` counts, and over `jump` times the event before it plus `floor`. It's ignored. A real flick
  // ramps up through its events, so however fast it is, it's kept.
  spike: 600,
  jump: 4,
  floor: 50,
};

export const LIGHT = {
  lantern: { full: 2.5, dark: 7, intensity: 0.75 }, // clear to about 3 cells, shapes out to 7, then only eyes; 0.75 keeps the lit snow a cold night grey
  flare: { full: 1.5, dark: 4, intensity: 1.1 },
  stove: { full: 2.5, dark: 8, intensity: 1 },
  muzzle: { full: 2, dark: 6, intensity: 0.8, time: 0.05 },
  eyes: { full: 12, dark: 16 }, // glowing eyes fade out between these distances
  // The sky's light by hour index (0 = 9 PM ... 7 = 4 AM); dawn brightens to `dawn`.
  night: [0.03, 0.03, 0.035, 0.04, 0.045, 0.05, 0.06, 0.08],
  dawn: 0.85,
  dawnTime: 8, // seconds for the sun to come up
};

export const RIFLE = { damage: 10, rounds: 8, interval: 0.45, reloadPerRound: 0.4, range: 40 };
export const SHOTGUN = {
  pellets: 8,
  damage: 7,
  spread: (6 * Math.PI) / 180, // each side of the crosshair
  falloff: 4, // half damage past this distance
  interval: 0.25,
  reload: 1.2,
  shells: 2,
  foundWith: 8,
  maxSpare: 30,
  range: 20,
};
export const SWITCH_TIME = 0.25; // lowering one gun and raising the other
// A shot this much (per cell away) above or below a creature still hits it: the tangent of about 3
// degrees, so a crawler is hit aiming level from 3 cells off, but closer you have to look down at it.
export const AIM = { forgive: 0.05 };
export const FLARE = { start: 2, max: 5, throw: 6, burn: 10, radius: 4, slow: 0.5, damage: 1.5, cooldown: 0.5 };
export const SHELL_BOX = 6;

export const CREATURES = {
  crawler: { radius: 0.22, hit: 0.3, height: 0.35, health: 10, speed: 4.0, reach: 0.35, damage: 6, interval: 0.7, firstBite: 0.25, flinch: 0.12 },
  gaunt: { radius: 0.3, hit: 0.32, height: 1.1, health: 45, speed: 1.6, reach: 0.9, windup: 0.45, damage: 25, interval: 1.5, flinch: 0.06 },
  leaper: {
    radius: 0.25, hit: 0.3, height: 0.7, health: 20, speed: 3.4, reach: 0.35, damage: 8, interval: 0.8, flinch: 0.12,
    circleAt: 5, circleSpeed: 3.0, circleMin: 2, circleMax: 4, crouch: 0.5, leapSpeed: 9, leapTime: 1.0,
    pounce: 20, land: 0.6, closeLeap: 2,
    lostSight: 0.5, // seconds out of sight before a circling leaper gives up and chases again
  },
  mother: {
    radius: 0.45, hit: 0.7, height: 2.2, health: 500, speed: 1.3, reach: 1.4, windup: 0.6, damage: 40, interval: 2, flinch: 0,
    birthEvery: 10, births: 2,
  },
  // `hit` and `height` are how wide and tall a creature is to a shot (its sprite, whose height is set in
  // art/last-light/sprites.lua), `radius` how wide it is to walls and others.
  // Every radius stays under 0.5, so everything fits through the doorway and any one-cell gap.
  die: 0.6, // seconds the death animation plays
  sightRange: 10, // creatures head straight for you when they can see you this close; otherwise they path
  pushWeight: { crawler: 1, gaunt: 2.5, leaper: 1, mother: 8 },
};
export const MAX_CREATURES = 64;

// Embers: the warmth an after-eater stole, spilling out where it dies. They glow on the snow and cool;
// you walk to them to take them, and spend them at the stove in a lull (upgrades.js).
export const EMBERS = {
  value: { crawler: 1, gaunt: 3, leaper: 2, mother: 0 }, // hers is the last hour: embers would buy nothing
  life: 15, // seconds on the snow
  flicker: 3, // for its last seconds it flickers and dims
  reach: 0.6, // how close you walk to take one
  longReach: 2, // with Long reach
  drift: 3, // cells a second towards you, with "Embers come to you"
  max: 48, // on the ground at once; a new one takes the place of the coolest
  light: { full: 0.2, dark: 1.5, intensity: 0.5 }, // scaled by value, up to 1.5x
  warm: 2, // health per ember of value, with Warm hands
};

// The fire's upgrades: the n-th of the night (from 0) costs cost + step * n embers; it offers `offer`.
export const UPGRADES = { cost: 6, step: 4, offer: 3 };

// Burning (Dragon's breath): damage a second, for `time` seconds (longer with Magnesium).
export const BURN = { dps: 4, time: 3 };

// What the upgrades change.
export const PERKS = {
  quickLever: 0.3, // seconds between rifle shots
  steady: { still: 0.5, speed: 0.1, damage: 2 }, // still this long (moving slower than speed): x damage
  deepMagazine: 12, // rifle rounds
  slug: { damage: 40, range: 20 },
  magnesium: 2, // flares and burning last this many times as long
  pockets: { max: 8, perLull: 2 }, // flares carried, and how many a lull's flare gives
  wick: { full: 3.5, dark: 9 }, // the lantern's reach
  snowshoes: 1.2, // times your speed
};

// Cursed charms: an after-eater sometimes drops a charm where it dies. Each gives something and takes
// something; you wear one at a time (charms.js).
export const CHARMS = {
  drop: { crawler: 0, gaunt: 0.1, leaper: 1 / 15, mother: 1 }, // the chance a kill drops one
  reach: 0.8, // how close you stand to read one and take it
  flicker: 3, // the lull's last seconds, when charms on the snow flicker before they go
  drift: 3, // cells a second towards you, with "Embers come to you"
  light: { full: 0.1, dark: 0.9, intensity: 0.3 },
  wolf: { damage: 1.5, lantern: 0.6 }, // rifle damage x; lantern reach x
  thread: { heal: 4 }, // health a kill
  crow: { ember: 1, hurt: 4 / 3 }, // added to each ember; damage you take x
  salt: { slow: 0.75, cool: 2 }, // speed x in your lantern's clear light; embers cool this many times as fast
  hare: { speed: 1.25, health: 75 }, // your speed x; your most health
  eye: { lantern: 0.3 }, // lantern reach x
};

export const NIGHT = {
  dusk: 6,
  lull: 20,
  spawnEvery: 0.6,
  aliveCap: (wave) => 8 + 2 * wave, // wave counts from 1
  stoveHeal: 25,
  stoveReach: 1.5,
  pickupReach: 0.6,
  spawnAway: 8, // trails closer than this to you aren't used, when others are free
  shotgunBefore: 2, // the shotgun appears in the lull before wave index 2 (11 PM)
  // One row per hour, 9 PM to 4 AM.
  waves: [
    { crawler: 6, gaunt: 0, leaper: 0, mother: 0 },
    { crawler: 10, gaunt: 1, leaper: 0, mother: 0 },
    { crawler: 12, gaunt: 2, leaper: 2, mother: 0 },
    { crawler: 14, gaunt: 3, leaper: 3, mother: 0 },
    { crawler: 16, gaunt: 4, leaper: 4, mother: 0 },
    { crawler: 20, gaunt: 5, leaper: 5, mother: 0 },
    { crawler: 24, gaunt: 6, leaper: 6, mother: 0 },
    { crawler: 10, gaunt: 2, leaper: 2, mother: 1 },
  ],
  hours: ['9 PM', '10 PM', '11 PM', '12 AM', '1 AM', '2 AM', '3 AM', '4 AM'],
};

export const FEEL = {
  kick: { rifle: 0.035, shotgun: 0.07 }, // view kick, radians, springs back
  kickReturn: 14, // per second
  shake: { shotgun: 1.5 }, // pixels
  shakeTime: 0.12,
  hurtTime: 0.35,
  lowHealth: 30,
};

export const KEYS = {
  forward: ['KeyW', 'ArrowUp'],
  back: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  run: ['ShiftLeft', 'ShiftRight'],
  reload: ['KeyR'],
  rifle: ['Digit1'],
  shotgun: ['Digit2'],
  flare: ['KeyF'],
  mute: ['KeyM'],
  pick: ['Digit1', 'Digit2', 'Digit3'], // the fire's cards, in order (1 and 2 also switch guns away from it)
  take: ['KeyE'], // the charm you're standing over
};
```

`last-light/src/charms.js` (new, the full file):
```js
// Cursed charms: an after-eater sometimes drops a charm where it dies (creatures.js calls dropCharm).
// Each gives something and takes something. You stand over one to read it, and E takes it; you wear
// one at a time, so the one you wore drops where you stand. A charm on the snow lies there until the
// next wave begins. Drops draw from their own random stream (state.charmRng), so a night where you
// never take one plays exactly as it would without them. What a charm does is read where it matters:
// weapons, creatures, embers, the player, the night and the scene look at state.charm.
import { CHARMS, LIGHT, PERKS, PLAYER } from './tuning.js';
import { nextRandom } from './rng.js';
import { emit } from './events.js';

export const WOLF = 0, THREAD = 1, CROW = 2, SALT = 3, HARE = 4, EYE = 5;
// from: the kind of after-eater that drops it.
export const CHARM_LIST = [
  { key: 'wolf', from: 'gaunt', name: "Wolf's tooth", gives: 'Rifle shots hit half again as hard.', takes: "Your lantern's light shrinks." },
  { key: 'thread', from: 'gaunt', name: 'Red thread', gives: 'Each kill heals you a little.', takes: 'The stove no longer heals you.' },
  { key: 'crow', from: 'gaunt', name: "Crow's feather", gives: 'Every ember is worth one more.', takes: 'They hurt you a third more.' },
  { key: 'salt', from: 'leaper', name: 'Grave salt', gives: "They slow in your lantern's light.", takes: 'Embers cool twice as fast.' },
  { key: 'hare', from: 'leaper', name: "Hare's foot", gives: 'Move a quarter faster.', takes: 'You hold 75 health at most.' },
  { key: 'eye', from: 'mother', name: "The Mother's eye", gives: 'Their eyes show through walls.', takes: 'Your lantern gutters low.' },
];
export const CHARM_COUNT = CHARM_LIST.length;

// The charms on the snow: a slot holds one while its id is 0 or more. `until` is the wave whose start
// takes it; `settled` is true once it has stopped drifting to you ("Embers come to you"). Each charm is
// in one place at most (worn, on the snow, or not dropped yet), so there's a slot for every charm.
export function createCharms() {
  return Array.from({ length: CHARM_COUNT }, () => ({ id: -1, x: 0, y: 0, until: 0, settled: false }));
}

// Lays charm `id` in slot `c` at (x, y), until the next wave begins.
function lay(state, c, id, x, y, settled) {
  c.id = id;
  c.x = x;
  c.y = y;
  c.until = state.night.wave + 1;
  c.settled = settled;
}

// Whether charm `id` could drop now: not the one you wear, and not one on the snow.
function free(state, id) {
  if (state.charm === id) return false;
  for (const c of state.charms) if (c.id === id) return false;
  return true;
}

const pool = new Int8Array(CHARM_COUNT);

// A kill of `kind` (its name) at (x, y) may drop a charm: at the kind's chance, one of its charms that's
// free, at random. Returns the charm on the snow, or null.
export function dropCharm(state, kind, x, y) {
  const chance = CHARMS.drop[kind];
  if (!(chance > 0)) return null;
  const roll = nextRandom(state.charmRng), which = nextRandom(state.charmRng);
  if (roll >= chance) return null;
  let n = 0;
  for (let id = 0; id < CHARM_COUNT; id++) if (CHARM_LIST[id].from === kind && free(state, id)) pool[n++] = id;
  if (n === 0) return null;
  let c = state.charms[0];
  for (const o of state.charms) {
    if (o.id < 0) {
      c = o;
      break;
    }
  }
  lay(state, c, pool[Math.floor(which * n)], x, y, false);
  emit(state, 'charmDrop', x, y, c.id);
  return c;
}

// Puts on charm `id` (-1 for none). Hare's foot caps your health at once; taking it off lifts the cap.
export function wearCharm(state, id) {
  state.charm = id;
  state.maxHealth = id === HARE ? CHARMS.hare.health : PLAYER.health;
  if (state.player.health > state.maxHealth) state.player.health = state.maxHealth;
}

// You take the charm in slot `c`; the one you wore, if any, drops at your feet in its place.
function take(state, c) {
  const p = state.player, id = c.id, old = state.charm;
  if (old >= 0) lay(state, c, old, p.x, p.y, true);
  else c.id = -1;
  wearCharm(state, id);
  emit(state, 'charm', p.x, p.y, id);
}

// One update: charms go when the next wave begins, drift to you once in gentle mode, and the nearest
// within reach is the one you read (state.charmAt, its slot, or -1), in a wave or a lull. E
// (intents.take) takes it, if it was already the one showing: a charm you've only just reached can't
// be taken in the same update.
export function updateCharms(state, intents, dt) {
  const p = state.player, n = state.night, shown = state.charmAt;
  const stop = CHARMS.reach * 0.5;
  let near = -1, best = CHARMS.reach * CHARMS.reach;
  for (let i = 0; i < state.charms.length; i++) {
    const c = state.charms[i];
    if (c.id < 0) continue;
    if (n.phase === 'wave' && n.wave >= c.until) {
      emit(state, 'charmOut', c.x, c.y, c.id);
      c.id = -1;
      continue;
    }
    let dx = p.x - c.x, dy = p.y - c.y;
    if (state.gentle && !c.settled) {
      const d = Math.sqrt(dx * dx + dy * dy), step = Math.min(Math.max(0, d - stop), CHARMS.drift * dt);
      if (d > 0) {
        c.x += (dx / d) * step;
        c.y += (dy / d) * step;
      }
      if (d - step <= stop) c.settled = true;
      dx = p.x - c.x;
      dy = p.y - c.y;
    }
    const d2 = dx * dx + dy * dy;
    if (d2 <= best) {
      best = d2;
      near = i;
    }
  }
  state.charmAt = n.phase === 'wave' || n.phase === 'lull' ? near : -1;
  if (intents.take && state.charmAt >= 0 && state.charmAt === shown) {
    const c = state.charms[state.charmAt];
    take(state, c);
    if (c.id < 0) state.charmAt = -1; // nothing left there to read
  }
}

const lamp = { full: 0, dark: 0, intensity: 0 };

// Your lantern's light now, into a reused { full, dark, intensity }: Wide wick widens it, Wolf's tooth
// shrinks it, and the Mother's eye all but puts it out.
export function lantern(state) {
  const L = LIGHT.lantern, wick = state.perks.wick;
  const k = state.charm === WOLF ? CHARMS.wolf.lantern : state.charm === EYE ? CHARMS.eye.lantern : 1;
  lamp.full = (wick ? PERKS.wick.full : L.full) * k;
  lamp.dark = (wick ? PERKS.wick.dark : L.dark) * k;
  lamp.intensity = L.intensity;
  return lamp;
}
```

`last-light/src/creatures.js` (the full file now):
```js
// The after-eaters. Every creature lives in a fixed pool (no allocation mid-night) and runs a small state
// machine each update:
//   crawler  chases and bites
//   gaunt    chases, winds up, swipes
//   leaper   closes in, circles at the edge of your light, crouches with a shriek, leaps in a straight
//            line (sidestep it or shoot it mid-air), lands, and goes round again. Where it can't see
//            you (you're in the cabin) it chases and bites like a crawler. If a wall stops its leap
//            short of you, it comes straight in instead of circling, and pounces once it's close.
//   mother   a slow, huge gaunt that also gives birth to crawlers (within the wave's cap)
// All of them head straight for you when they can see you nearby, and follow the flow field when they
// can't. Flare light halves their speed. They push each other apart, and never into you. One set alight
// (Dragon's breath) burns for a few seconds. Killed, by a shot or by fire, each drops an ember, and
// sometimes a charm. The charms you wear change them: Grave salt slows them in your lantern's light,
// Crow's feather makes their embers worth more, and Red thread heals you for each kill.
import { CREATURES, MAX_CREATURES, FLARE, NIGHT, EMBERS, BURN, PERKS, CHARMS } from './tuning.js';
import { moveBody, pushOutOfCircle, separate } from './collide.js';
import { canSee } from './raycast.js';
import { flowDir } from './flowfield.js';
import { nextRandom, randomBetween } from './rng.js';
import { emit } from './events.js';
import { hurtPlayer } from './player.js';
import { dropEmber } from './embers.js';
import { dropCharm, lantern, CROW, THREAD, SALT } from './charms.js';

export const KINDS = ['crawler', 'gaunt', 'leaper', 'mother'];
export const CRAWLER = 0, GAUNT = 1, LEAPER = 2, MOTHER = 3;
const T = KINDS.map((k) => CREATURES[k]);
const WEIGHT = KINDS.map((k) => CREATURES.pushWeight[k]);
const EMBER = KINDS.map((k) => EMBERS.value[k]);

export function createCreatures(n = MAX_CREATURES) {
  return Array.from({ length: n }, (_, id) => ({
    id, alive: false, dying: 0, kind: 0, x: 0, y: 0, px: 0, py: 0, radius: 0, hp: 0,
    heading: 0, moving: false, walked: 0, mode: 'chase', t: 0, attackT: 0, flinch: 0, hurtT: 0,
    circleDir: 1, circleT: 0, unseen: 0, rush: false, leapX: 0, leapY: 0, leapHit: false, lift: 0, birthT: 0,
    struck: 0, burnT: 0,
  }));
}

export function spawnCreature(state, kind, x, y) {
  let c = null;
  for (const s of state.creatures) {
    if (!s.alive) {
      c = s;
      break;
    }
  }
  if (!c) return null;
  const t = T[kind];
  c.alive = true;
  c.dying = 0;
  c.kind = kind;
  c.x = c.px = x;
  c.y = c.py = y;
  c.radius = t.radius;
  c.hp = t.health;
  c.heading = Math.atan2(state.player.y - y, state.player.x - x);
  c.moving = false;
  c.walked = 0;
  c.mode = 'chase';
  c.t = 0;
  c.attackT = t.firstBite ?? 0;
  c.flinch = 0;
  c.hurtT = 0;
  c.circleDir = nextRandom(state.rng) < 0.5 ? -1 : 1;
  c.circleT = 0;
  c.unseen = 0;
  c.rush = false;
  c.leapHit = false;
  c.lift = 0;
  c.birthT = t.birthEvery ?? 0;
  c.struck = 0;
  c.burnT = 0;
  emit(state, 'spawn', x, y, kind);
  return c;
}

// Creatures still in the fight (spawned and not dying).
export function aliveCount(state) {
  let n = 0;
  for (const c of state.creatures) if (c.alive && !c.dying) n++;
  return n;
}

export function inFlare(state, x, y) {
  const r2 = FLARE.radius * FLARE.radius;
  for (const f of state.flares) {
    if (f.t > 0 && (f.x - x) ** 2 + (f.y - y) ** 2 <= r2) return true;
  }
  return false;
}

// It dies: the death animation starts, it counts, it drops its ember (worth more with Crow's feather)
// and maybe a charm, and Red thread heals you.
function kill(state, c) {
  c.dying = CREATURES.die;
  c.lift = 0;
  c.burnT = 0;
  state.stats.kills++;
  const value = EMBER[c.kind];
  dropEmber(state, c.x, c.y, value > 0 && state.charm === CROW ? value + CHARMS.crow.ember : value);
  dropCharm(state, KINDS[c.kind], c.x, c.y);
  const p = state.player;
  if (state.charm === THREAD && p.health > 0) p.health = Math.min(state.maxHealth, p.health + CHARMS.thread.heal);
}

// Damages a creature; flare light makes it hurt more. Returns true if this killed it.
export function damageCreature(state, c, amount) {
  if (!c.alive || c.dying) return false;
  if (inFlare(state, c.x, c.y)) amount *= FLARE.damage;
  c.hp -= amount;
  c.flinch = T[c.kind].flinch;
  c.hurtT = 0.1;
  const killed = c.hp <= 0;
  if (killed) kill(state, c);
  emit(state, 'hit', c.x, c.y, c.kind, killed ? 1 : 0);
  return killed;
}

// Sets a creature burning, or keeps it burning from now: BURN.time seconds, twice that with Magnesium.
export function igniteCreature(state, c) {
  if (!c.alive || c.dying) return;
  if (c.burnT <= 0) emit(state, 'alight', c.x, c.y, c.kind);
  c.burnT = BURN.time * (state.perks.magnesium ? PERKS.magnesium : 1);
}

const dir = { x: 0, y: 0 };

// Steps towards you: straight if it can see you, else down the flow field. Returns false if it's stuck.
function heading(state, c, sees) {
  const p = state.player;
  if (!sees && flowDir(state.field, state.map, c.x, c.y, dir)) return true;
  const dx = p.x - c.x, dy = p.y - c.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
  dir.x = dx / d;
  dir.y = dy / d;
  return true;
}

function walk(state, c, vx, vy, dt) {
  const hitWall = moveBody(state.map, c, vx * dt, vy * dt);
  for (const prop of state.map.props) pushOutOfCircle(c, prop.x, prop.y, prop.radius);
  const mx = c.x - c.px, my = c.y - c.py, moved = Math.sqrt(mx * mx + my * my);
  c.moving = moved > 1e-4;
  if (c.moving) {
    c.heading = Math.atan2(vy, vx);
    c.walked += moved;
  }
  return hitWall;
}

// A landed attack; `struck` times the attack animation.
function strike(state, c, damage) {
  c.struck = 0.25;
  hurtPlayer(state, damage, c.x, c.y);
}

function update(state, c, dt) {
  const t = T[c.kind], p = state.player;
  c.px = c.x;
  c.py = c.y;
  c.moving = false;
  if (c.hurtT > 0) c.hurtT -= dt;
  if (c.struck > 0) c.struck -= dt;
  if (c.dying) {
    c.dying -= dt;
    if (c.dying <= 0) c.alive = false;
    return;
  }
  // Burning: quiet damage (flare light makes it worse); only a kill is heard.
  if (c.burnT > 0) {
    c.burnT -= dt;
    c.hp -= BURN.dps * dt * (inFlare(state, c.x, c.y) ? FLARE.damage : 1);
    if (c.hp <= 0) {
      kill(state, c);
      emit(state, 'hit', c.x, c.y, c.kind, 1);
      return;
    }
  }
  const dx = p.x - c.x, dy = p.y - c.y, d = Math.sqrt(dx * dx + dy * dy);
  const touch = d - c.radius - p.radius; // gap between the two circles
  const sees = d < CREATURES.sightRange && canSee(state.map, c.x, c.y, p.x, p.y);
  const slow = (inFlare(state, c.x, c.y) ? FLARE.slow : 1) * (d <= saltReach ? CHARMS.salt.slow : 1);
  if (c.flinch > 0) {
    c.flinch -= dt;
    if (c.mode !== 'leap') return;
  }

  if (c.kind === LEAPER) {
    // It gives up a circle only after a moment out of sight, and a circle broken off at a doorway or a
    // corner resumes with the time it had left, so a leaper at the edge of sight still leaps.
    if (c.mode === 'chase' || c.mode === 'circle') {
      c.unseen = sees ? 0 : c.unseen + dt;
      if (c.mode === 'circle' && c.unseen >= t.lostSight) {
        c.mode = 'chase';
      } else if (c.mode === 'chase' && sees && !c.rush && d <= t.circleAt + 0.5) {
        c.mode = 'circle';
        if (c.circleT <= 0) c.circleT = randomBetween(state.rng, t.circleMin, t.circleMax);
      }
    }
    switch (c.mode) {
      case 'chase':
        // Coming straight in after a wall cut its leap short: it pounces once it sees you close.
        if (c.rush && sees && d < t.closeLeap) return crouch(state, c, t, dx, dy);
        if (!sees && touch <= t.reach) return bite(state, c, t, dt, dx, dy);
        c.attackT = t.interval;
        heading(state, c, sees);
        walk(state, c, dir.x * t.speed * slow, dir.y * t.speed * slow, dt);
        return;
      case 'circle': {
        c.circleT -= dt;
        if (c.circleT <= 0 || d < t.closeLeap) return crouch(state, c, t, dx, dy);
        const ux = dx / d, uy = dy / d;
        const radial = Math.max(-1, Math.min(1, d - t.circleAt));
        let vx = -uy * c.circleDir + ux * radial, vy = ux * c.circleDir + uy * radial;
        const l = Math.sqrt(vx * vx + vy * vy) || 1;
        vx = (vx / l) * t.circleSpeed * slow;
        vy = (vy / l) * t.circleSpeed * slow;
        if (walk(state, c, vx, vy, dt)) c.circleDir = -c.circleDir;
        return;
      }
      case 'crouch':
        c.heading = Math.atan2(dy, dx);
        c.t -= dt;
        if (c.t <= 0) {
          c.mode = 'leap';
          c.t = t.leapTime;
          c.leapX = dx / d;
          c.leapY = dy / d;
          c.leapHit = false;
          emit(state, 'leap', c.x, c.y);
        }
        return;
      case 'leap': {
        c.t -= dt;
        c.lift = 0.35 * Math.sin(Math.PI * Math.min(1, 1 - c.t / t.leapTime));
        const wall = walk(state, c, c.leapX * t.leapSpeed * slow, c.leapY * t.leapSpeed * slow, dt);
        const lx = p.x - c.x, ly = p.y - c.y, gap = Math.sqrt(lx * lx + ly * ly) - c.radius - p.radius;
        if (!c.leapHit && gap <= 0.15) {
          c.leapHit = true;
          strike(state, c, t.pounce);
        }
        if (wall || c.t <= 0) {
          c.mode = 'land';
          c.t = t.land;
          c.lift = 0;
          // A wall stopped it with you still ahead (it leapt at a doorway's edge, or at where it last
          // saw you): no clear line from here, so next it comes straight in rather than circling.
          c.rush = wall && !c.leapHit && (p.x - c.x) * c.leapX + (p.y - c.y) * c.leapY > 0;
        }
        return;
      }
      case 'land':
        c.t -= dt;
        if (c.t <= 0) {
          c.mode = 'chase';
          c.attackT = t.interval;
          c.circleT = 0; // the next circle is a fresh one
        }
        return;
    }
    return;
  }

  if (c.kind === MOTHER) {
    c.birthT -= dt;
    // She gives birth on a timer, but not past the wave's cap on creatures alive at once.
    if (c.birthT <= 0 && aliveCount(state) + t.births <= NIGHT.aliveCap(state.night.wave + 1)) {
      c.birthT = t.birthEvery;
      emit(state, 'birth', c.x, c.y);
      for (let i = 0; i < t.births; i++) {
        const a = c.heading + Math.PI + (i - (t.births - 1) / 2) * 0.8;
        const b = spawnCreature(state, CRAWLER, c.x + Math.cos(a) * (c.radius + 0.3), c.y + Math.sin(a) * (c.radius + 0.3));
        if (b) moveBody(state.map, b, 0, 0);
      }
    }
  }

  if (c.kind === CRAWLER) {
    if (touch <= t.reach) return bite(state, c, t, dt, dx, dy);
    c.attackT = t.firstBite;
    heading(state, c, sees);
    walk(state, c, dir.x * t.speed * slow, dir.y * t.speed * slow, dt);
    return;
  }

  // Gaunt and Mother: chase, wind up, strike. Their reach is longer than a wall is thick, so both the
  // wind-up and the strike need sight of you; without it they path round, in by the doorway.
  if (c.attackT > 0) c.attackT -= dt;
  if (c.mode === 'windup') {
    c.heading = Math.atan2(dy, dx);
    c.t -= dt;
    if (c.t <= 0) {
      c.mode = 'chase';
      c.attackT = t.interval;
      if (sees && touch <= t.reach + 0.2) strike(state, c, t.damage);
    }
    return;
  }
  if (sees && touch <= t.reach) {
    if (c.attackT <= 0) {
      c.mode = 'windup';
      c.t = t.windup;
      emit(state, 'windup', c.x, c.y, c.kind);
    }
    c.heading = Math.atan2(dy, dx);
    return;
  }
  heading(state, c, sees);
  walk(state, c, dir.x * t.speed * slow, dir.y * t.speed * slow, dt);
}

// A leaper crouches with a shriek, facing you, before it leaps.
function crouch(state, c, t, dx, dy) {
  c.mode = 'crouch';
  c.t = t.crouch;
  c.heading = Math.atan2(dy, dx);
  emit(state, 'shriek', c.x, c.y);
}

// Crawlers (and leapers that can't see you) bite on a timer while they're touching you.
function bite(state, c, t, dt, dx, dy) {
  c.heading = Math.atan2(dy, dx);
  c.attackT -= dt;
  if (c.attackT <= 0) {
    c.attackT = t.interval;
    strike(state, c, t.damage);
  }
}

// With Grave salt, how far your lantern's clear light reaches (creatures inside it are slowed); -1 without.
let saltReach = -1;

export function updateCreatures(state, dt) {
  const cs = state.creatures, p = state.player;
  saltReach = state.charm === SALT ? lantern(state).full : -1;
  for (const c of cs) if (c.alive) update(state, c, dt);
  // Push apart, then back out of walls and out of you.
  for (let i = 0; i < cs.length; i++) {
    const a = cs[i];
    if (!a.alive || a.dying) continue;
    for (let j = i + 1; j < cs.length; j++) {
      const b = cs[j];
      if (b.alive && !b.dying) separate(a, b, WEIGHT[a.kind], WEIGHT[b.kind]);
    }
  }
  for (const c of cs) {
    if (!c.alive || c.dying) continue;
    pushOutOfCircle(c, p.x, p.y, p.radius);
    moveBody(state.map, c, 0, 0);
  }
}
```

`last-light/src/embers.js` (the full file now):
```js
// Embers: the warmth an after-eater stole, spilling out where it dies (creatures.js drops them). They
// glow on the snow and cool in EMBERS.life seconds; you walk to them to take them, and spend them at
// the stove in a lull (upgrades.js). A fixed pool: a new ember in a full pool takes the place of the
// one closest to going out. With "Embers come to you" (state.gentle) they drift to you instead.
import { EMBERS, CHARMS } from './tuning.js';
import { emit } from './events.js';
import { SALT } from './charms.js';

// An ember is on the snow while t (seconds left) is above 0.
export function createEmbers(n = EMBERS.max) {
  return Array.from({ length: n }, () => ({ x: 0, y: 0, value: 0, t: 0 }));
}

// Drops an ember worth `value` at (x, y). Returns it, or null for a value of 0.
export function dropEmber(state, x, y, value) {
  if (value <= 0) return null;
  let e = state.embers[0];
  for (const o of state.embers) {
    if (o.t <= 0) {
      e = o;
      break;
    }
    if (o.t < e.t) e = o;
  }
  e.x = x;
  e.y = y;
  e.value = value;
  e.t = EMBERS.life;
  emit(state, 'emberDrop', x, y, value);
  return e;
}

// Embers on the snow now.
export function emberCount(state) {
  let n = 0;
  for (const e of state.embers) if (e.t > 0) n++;
  return n;
}

// Takes the embers you're close enough to (Long reach widens it), drifts them to you in gentle mode,
// and cools the rest (twice as fast with Grave salt).
export function updateEmbers(state, dt) {
  const p = state.player, perks = state.perks;
  const reach = perks.reach ? EMBERS.longReach : EMBERS.reach;
  const cool = dt * (state.charm === SALT ? CHARMS.salt.cool : 1);
  for (const e of state.embers) {
    if (e.t <= 0) continue;
    let dx = p.x - e.x, dy = p.y - e.y, d = Math.sqrt(dx * dx + dy * dy);
    if (state.gentle && d > reach) {
      const step = Math.min(d - reach * 0.5, EMBERS.drift * dt);
      e.x += (dx / d) * step;
      e.y += (dy / d) * step;
      dx = p.x - e.x;
      dy = p.y - e.y;
      d = Math.sqrt(dx * dx + dy * dy);
    }
    if (d <= reach) {
      state.carried += e.value;
      if (perks.warm && p.health > 0) p.health = Math.min(state.maxHealth, p.health + EMBERS.warm * e.value);
      emit(state, 'ember', e.x, e.y, e.value);
      e.t = 0;
      continue;
    }
    e.t -= cool;
    if (e.t <= 0) {
      e.t = 0;
      emit(state, 'emberOut', e.x, e.y);
    }
  }
}
```

`last-light/src/weapons.js` (the full file now):
```js
// Your guns and flares. Shots are instant (hitscan): a ray from your eyes along your facing and pitch,
// stopped by the first wall, hits the nearest creature it passes through: within its `hit` width
// across, and between its feet and its top as it passes, give or take AIM.forgive.
//
// The rifle holds 8 and reloads a round at a time; firing interrupts a reload, and an empty rifle
// starts reloading by itself. The shotgun fires 8 pellets in a spread from 2 barrels, and reloads both
// at once from limited spare shells. Holding the trigger keeps firing as fast as each gun allows.
//
// The fire's upgrades (upgrades.js) change them through state.perks: Through-and-through (a rifle round
// carries on into the next creature), Steady hands (double damage after standing still), Slugs (one
// heavy ball instead of pellets), Dragon's breath (the shotgun sets creatures burning), Magnesium
// (flares burn twice as long) and Deep pockets (more flares). Quick lever and Deep magazine are the
// gun's own `interval` and `rounds`. Wolf's tooth (a charm, charms.js) makes rifle shots hit harder.
import { RIFLE, SHOTGUN, SWITCH_TIME, FLARE, FEEL, CREATURES, LIGHT, PLAYER, AIM, PERKS, CHARMS } from './tuning.js';
import { castRay, createHit } from './raycast.js';
import { damageCreature, igniteCreature, KINDS } from './creatures.js';
import { randomBetween } from './rng.js';
import { emit } from './events.js';
import { WOLF } from './charms.js';

export const RIFLE_ID = 0, SHOTGUN_ID = 1;
const HIT_R = KINDS.map((k) => CREATURES[k].hit);
const HEIGHT = KINDS.map((k) => CREATURES[k].height);
export const MAX_FLARES = 8; // burning on the ground at once

export function createGun() {
  return {
    current: RIFLE_ID, next: RIFLE_ID, switching: 0,
    cooldown: 0, reloading: false, reloadT: 0,
    rifle: RIFLE.rounds,
    rounds: RIFLE.rounds, // the rifle's capacity (Deep magazine)
    interval: RIFLE.interval, // seconds between rifle shots (Quick lever)
    hasShotgun: false, shells: 0, spare: 0,
    flares: FLARE.start, flareT: 0,
    kick: 0, // view kick, radians, springing back
    shotT: 0, // seconds since the last shot, for the gun's animation
    loadT: 1, // seconds since reloading last started or stopped, for the hands
  };
}

export function createFlares() {
  return Array.from({ length: MAX_FLARES }, () => ({ x: 0, y: 0, t: 0 }));
}

// The most flares you can carry.
export const flareMax = (state) => (state.perks.pockets ? PERKS.pockets.max : FLARE.max);

// Steady hands is ready: you've stood still long enough for the next rifle shot to hit double.
export const steadyReady = (state) => state.perks.steady && state.player.stillT >= PERKS.steady.still;

const wallHit = createHit();
const shot = { creature: null, dist: 0 };

// The nearest creature along a ray from your eyes at (ox, oy), at `angle` and `pitch` (up is positive),
// before any wall and within `range`, leaving out `skip`. Returns the reusable `shot`
// ({ creature, dist }), with creature null for a miss.
export function traceShot(state, ox, oy, angle, range, pitch = 0, skip = null) {
  const dx = Math.cos(angle), dy = Math.sin(angle), rise = Math.tan(pitch);
  const wall = castRay(state.map, ox, oy, dx, dy, wallHit, range) ? wallHit.dist : range;
  shot.creature = null;
  shot.dist = wall;
  for (const c of state.creatures) {
    if (!c.alive || c.dying || c === skip) continue;
    const rx = c.x - ox, ry = c.y - oy;
    const along = rx * dx + ry * dy;
    if (along <= 0 || along >= shot.dist) continue;
    const across = Math.abs(rx * dy - ry * dx);
    if (across > HIT_R[c.kind]) continue;
    const z = PLAYER.eye + along * rise, give = along * AIM.forgive;
    if (z < c.lift - give || z > c.lift + HEIGHT[c.kind] + give) continue;
    shot.creature = c;
    shot.dist = along;
  }
  return shot;
}

function startSwitch(state, to) {
  const g = state.gun;
  if (to === (g.switching > 0 ? g.next : g.current)) return; // already there, or on the way
  if (to === SHOTGUN_ID && !g.hasShotgun) return;
  g.next = to;
  g.switching = SWITCH_TIME;
  g.reloading = false;
  emit(state, 'switch', state.player.x, state.player.y, to);
}

function startReload(state) {
  const g = state.gun;
  if (g.reloading || g.switching > 0) return;
  if (g.current === RIFLE_ID && g.rifle < g.rounds) {
    g.reloading = true;
    g.reloadT = RIFLE.reloadPerRound;
  } else if (g.current === SHOTGUN_ID && g.shells < SHOTGUN.shells && g.spare > 0) {
    g.reloading = true;
    g.reloadT = SHOTGUN.reload;
  }
}

function fire(state) {
  const g = state.gun, p = state.player, perks = state.perks;
  if (g.current === RIFLE_ID) {
    if (g.rifle === 0) {
      if (!g.reloading) {
        emit(state, 'dry', p.x, p.y, RIFLE_ID);
        startReload(state);
      }
      return;
    }
    g.reloading = false;
    g.rifle--;
    g.cooldown = g.interval;
    const damage = RIFLE.damage * (steadyReady(state) ? PERKS.steady.damage : 1) * (state.charm === WOLF ? CHARMS.wolf.damage : 1);
    const first = traceShot(state, p.x, p.y, p.facing, RIFLE.range, p.pitch).creature;
    if (first) {
      damageCreature(state, first, damage);
      if (perks.pierce) {
        const next = traceShot(state, p.x, p.y, p.facing, RIFLE.range, p.pitch, first).creature;
        if (next) damageCreature(state, next, damage);
      }
    }
    g.kick += FEEL.kick.rifle;
    emit(state, 'shot', p.x, p.y, RIFLE_ID);
    if (g.rifle === 0) startReload(state);
  } else {
    if (g.shells === 0) {
      emit(state, 'dry', p.x, p.y, SHOTGUN_ID);
      if (g.spare > 0) startReload(state);
      else startSwitch(state, RIFLE_ID);
      g.cooldown = SHOTGUN.interval;
      return;
    }
    g.reloading = false;
    g.shells--;
    g.cooldown = SHOTGUN.interval;
    if (perks.slugs) {
      const c = traceShot(state, p.x, p.y, p.facing, PERKS.slug.range, p.pitch).creature;
      if (c) {
        damageCreature(state, c, PERKS.slug.damage);
        if (perks.dragon) igniteCreature(state, c);
      }
    } else {
      const n = SHOTGUN.pellets;
      for (let i = 0; i < n; i++) {
        const spread = SHOTGUN.spread * (((i + 0.5) / n) * 2 - 1);
        const jitter = randomBetween(state.rng, -0.3, 0.3) * (SHOTGUN.spread / n);
        const s = traceShot(state, p.x, p.y, p.facing + spread + jitter, SHOTGUN.range, p.pitch);
        const c = s.creature;
        if (c) {
          damageCreature(state, c, s.dist > SHOTGUN.falloff ? SHOTGUN.damage / 2 : SHOTGUN.damage);
          if (perks.dragon) igniteCreature(state, c);
        }
      }
    }
    g.kick += FEEL.kick.shotgun;
    state.shake = FEEL.shakeTime;
    emit(state, 'shot', p.x, p.y, SHOTGUN_ID);
    if (g.shells === 0 && g.spare > 0) startReload(state);
  }
  g.shotT = 0;
  state.flash = LIGHT.muzzle.time;
}

const flareHit = createHit();

function throwFlare(state) {
  const g = state.gun, p = state.player;
  if (g.flares <= 0 || g.flareT > 0) return;
  let slot = null;
  for (const f of state.flares) {
    if (f.t <= 0) {
      slot = f;
      break;
    }
  }
  if (!slot) return;
  const dx = Math.cos(p.facing), dy = Math.sin(p.facing);
  const d = castRay(state.map, p.x, p.y, dx, dy, flareHit, FLARE.throw) ? Math.max(0, flareHit.dist - 0.3) : FLARE.throw;
  slot.x = p.x + dx * d;
  slot.y = p.y + dy * d;
  slot.t = FLARE.burn * (state.perks.magnesium ? PERKS.magnesium : 1);
  g.flares--;
  g.flareT = FLARE.cooldown;
  emit(state, 'flareThrow', slot.x, slot.y);
}

// intents: { fire (held), reload (presses), weapon (0 none, 1 rifle, 2 shotgun), weaponStep (-1, 0, 1), flare (presses) }
// At the fire (state.choosing), keys 1 and 2 pick cards, so `weapon` is ignored; the wheel still switches.
export function updateGun(state, intents, dt) {
  const g = state.gun;
  const loading = g.reloading;
  g.shotT += dt;
  if (g.cooldown > 0) g.cooldown -= dt;
  if (g.flareT > 0) g.flareT -= dt;
  g.kick -= g.kick * Math.min(1, FEEL.kickReturn * dt);

  const key = state.choosing ? 0 : intents.weapon;
  if (key === 1) startSwitch(state, RIFLE_ID);
  else if (key === 2) startSwitch(state, SHOTGUN_ID);
  else if (intents.weaponStep) startSwitch(state, (g.switching > 0 ? g.next : g.current) === RIFLE_ID ? SHOTGUN_ID : RIFLE_ID);
  if (g.switching > 0) {
    g.switching -= dt;
    if (g.switching <= 0) {
      g.switching = 0;
      g.current = g.next;
    }
  }
  if (intents.reload) startReload(state);
  if (g.reloading) {
    g.reloadT -= dt;
    if (g.reloadT <= 0) {
      if (g.current === RIFLE_ID) {
        g.rifle++;
        emit(state, 'reload', state.player.x, state.player.y, RIFLE_ID);
        if (g.rifle < g.rounds) g.reloadT += RIFLE.reloadPerRound;
        else g.reloading = false;
      } else {
        const load = Math.min(SHOTGUN.shells - g.shells, g.spare);
        g.shells += load;
        g.spare -= load;
        g.reloading = false;
        emit(state, 'reload', state.player.x, state.player.y, SHOTGUN_ID);
      }
    }
  }
  if (intents.fire && g.cooldown <= 0 && g.switching <= 0) fire(state);
  if (intents.flare) throwFlare(state);
  g.loadT = g.reloading === loading ? g.loadT + dt : 0;
}

export function updateFlares(state, dt) {
  for (const f of state.flares) {
    if (f.t <= 0) continue;
    f.t -= dt;
    if (f.t <= 0) {
      f.t = 0;
      emit(state, 'flareOut', f.x, f.y);
    }
  }
}

// Gives you the shotgun, loaded, with its spare shells, and raises it.
export function giveShotgun(state) {
  const g = state.gun;
  g.hasShotgun = true;
  g.shells = SHOTGUN.shells;
  g.spare = SHOTGUN.foundWith - SHOTGUN.shells;
  startSwitch(state, SHOTGUN_ID);
}
```

`last-light/src/player.js` (the full file now):
```js
// You: a circle that walks and runs with snappy acceleration, slides along walls and round props,
// and remembers where it was last update so the renderer can blend between the two. It also keeps how
// long you've stood still (Steady hands reads it).
import { PLAYER, FEEL, PERKS, CHARMS } from './tuning.js';
import { moveBody, pushOutOfCircle } from './collide.js';
import { emit } from './events.js';
import { CROW } from './charms.js';

const ACCEL = PLAYER.run / PLAYER.accelTime;
const DECEL = PLAYER.run / PLAYER.stopTime;

export function createPlayer(start) {
  return {
    x: start.x, y: start.y, px: start.x, py: start.y,
    vx: 0, vy: 0, radius: PLAYER.radius, facing: start.facing, pitch: 0,
    health: PLAYER.health, walked: 0, running: false, stillT: 0,
  };
}

// intents: { facing, pitch (up is positive), forward (-1..1), strafe (-1..1, positive is right), run }.
// `speed` scales your walk, run and acceleration (Snowshoes).
export function movePlayer(map, p, intents, dt, speed = 1) {
  p.px = p.x;
  p.py = p.y;
  p.facing = intents.facing;
  p.pitch = intents.pitch;
  const c = Math.cos(p.facing), s = Math.sin(p.facing);
  let wx = intents.forward * c - intents.strafe * s;
  let wy = intents.forward * s + intents.strafe * c;
  const wl = Math.sqrt(wx * wx + wy * wy);
  if (wl > 1) {
    wx /= wl;
    wy /= wl;
  }
  p.running = intents.run && wl > 0;
  const max = (p.running ? PLAYER.run : PLAYER.walk) * speed;
  const tx = wx * max, ty = wy * max;
  const dvx = tx - p.vx, dvy = ty - p.vy;
  const dl = Math.sqrt(dvx * dvx + dvy * dvy);
  const step = (wl > 0 ? ACCEL : DECEL) * speed * dt;
  if (dl <= step) {
    p.vx = tx;
    p.vy = ty;
  } else {
    p.vx += (dvx / dl) * step;
    p.vy += (dvy / dl) * step;
  }
  moveBody(map, p, p.vx * dt, p.vy * dt);
  for (const prop of map.props) pushOutOfCircle(p, prop.x, prop.y, prop.radius);
  const mx = p.x - p.px, my = p.y - p.py, moved = Math.sqrt(mx * mx + my * my);
  p.walked += moved;
  p.stillT = moved < PERKS.steady.speed * dt ? p.stillT + dt : 0;
}

// Something hit you for `amount` (a third more with Crow's feather), from (x, y). With ?god you never
// drop below 1.
export function hurtPlayer(state, amount, x, y) {
  const p = state.player;
  if (p.health <= 0) return;
  if (state.charm === CROW) amount *= CHARMS.crow.hurt;
  p.health -= amount;
  if (state.god && p.health < 1) p.health = 1;
  state.hurt = FEEL.hurtTime;
  emit(state, 'hurt', x, y, amount);
}
```

`last-light/src/night.js` (the full file now):
```js
// The night: dusk, then one wave an hour from 9 PM to 4 AM, with a lull between. A wave's creatures
// come out of the trails a few at a time, never more alive than the wave's cap, from trails away from
// you. A wave ends when all of its creatures (and the Mother's brood) are dead. In a lull the stove
// heals you (not with Red thread, a charm), and supplies turn up: a flare, shells once you have the
// shotgun, and the shotgun itself before 11 PM. Clearing 4 AM brings the dawn; running out of health
// ends the night.
import { NIGHT, SHOTGUN, SHELL_BOX, LIGHT, PERKS } from './tuning.js';
import { spawnCreature, aliveCount, KINDS, MOTHER } from './creatures.js';
import { nextRandom } from './rng.js';
import { emit } from './events.js';
import { giveShotgun, flareMax } from './weapons.js';
import { THREAD } from './charms.js';

export const LAST_WAVE = NIGHT.waves.length - 1;
export const FLARE_PICKUP = 0, SHELLS_PICKUP = 1, SHOTGUN_PICKUP = 2;

export function createNight() {
  return { phase: 'dusk', wave: 0, t: NIGHT.dusk, queue: new Uint8Array(128), qn: 0, qi: 0, spawnT: 0, reached: 0, dawnT: 0 };
}

export function createPickups(map) {
  return [
    { kind: FLARE_PICKUP, x: map.spots.flare.x, y: map.spots.flare.y, active: false },
    { kind: SHELLS_PICKUP, x: map.spots.shells.x, y: map.spots.shells.y, active: false },
    { kind: SHOTGUN_PICKUP, x: map.spots.shotgun.x, y: map.spots.shotgun.y, active: false },
  ];
}

export function startWave(state, i) {
  const n = state.night, row = NIGHT.waves[i];
  n.phase = 'wave';
  n.wave = i;
  n.reached = Math.max(n.reached, i);
  n.qn = 0;
  n.qi = 0;
  n.spawnT = 0;
  for (let k = 0; k < KINDS.length; k++) for (let j = 0; j < row[KINDS[k]]; j++) n.queue[n.qn++] = k;
  // Shuffle, then bring the Mother forward so she arrives early in her wave.
  for (let j = n.qn - 1; j > 0; j--) {
    const r = Math.floor(nextRandom(state.rng) * (j + 1));
    const t = n.queue[j];
    n.queue[j] = n.queue[r];
    n.queue[r] = t;
  }
  const m = n.queue.subarray(0, n.qn).indexOf(MOTHER);
  const early = Math.min(3, n.qn - 1);
  if (m > early) {
    n.queue[m] = n.queue[early];
    n.queue[early] = MOTHER;
  }
  emit(state, 'wave', 0, 0, i);
}

function spawnNext(state) {
  const n = state.night, p = state.player, spawns = state.map.spawns;
  let far = 0;
  for (const s of spawns) {
    const dx = s.x - p.x, dy = s.y - p.y;
    if (Math.sqrt(dx * dx + dy * dy) >= NIGHT.spawnAway) far++;
  }
  let pick = Math.floor(nextRandom(state.rng) * (far || spawns.length));
  let trail = spawns[0];
  for (const s of spawns) {
    const dx = s.x - p.x, dy = s.y - p.y;
    if (far && Math.sqrt(dx * dx + dy * dy) < NIGHT.spawnAway) continue;
    if (pick-- === 0) {
      trail = s;
      break;
    }
  }
  spawnCreature(state, n.queue[n.qi++], trail.x + (nextRandom(state.rng) - 0.5) * 0.4, trail.y + (nextRandom(state.rng) - 0.5) * 0.4);
}

function endWave(state) {
  const n = state.night;
  if (n.wave === LAST_WAVE) {
    n.phase = 'dawn';
    n.dawnT = 0;
    n.reached = LAST_WAVE + 1;
    emit(state, 'dawn');
    return;
  }
  n.phase = 'lull';
  n.t = NIGHT.lull;
  const [flare, shells, shotgun] = state.pickups;
  flare.active = true;
  if (state.gun.hasShotgun) shells.active = true;
  if (n.wave + 1 === NIGHT.shotgunBefore && !state.gun.hasShotgun) shotgun.active = true;
  emit(state, 'lull', 0, 0, n.wave + 1);
}

function collect(state) {
  const p = state.player, g = state.gun;
  for (const k of state.pickups) {
    const dx = k.x - p.x, dy = k.y - p.y;
    if (!k.active || Math.sqrt(dx * dx + dy * dy) > NIGHT.pickupReach) continue;
    if (k.kind === FLARE_PICKUP) {
      const max = flareMax(state);
      if (g.flares >= max) continue;
      g.flares = Math.min(max, g.flares + (state.perks.pockets ? PERKS.pockets.perLull : 1));
    } else if (k.kind === SHELLS_PICKUP) {
      if (g.spare >= SHOTGUN.maxSpare) continue;
      g.spare = Math.min(SHOTGUN.maxSpare, g.spare + SHELL_BOX);
    } else {
      giveShotgun(state);
    }
    k.active = false;
    emit(state, 'pickup', k.x, k.y, k.kind);
  }
}

export function updateNight(state, dt) {
  const n = state.night, p = state.player;
  if (n.phase === 'dead') return;
  if (n.phase === 'dawn') {
    n.dawnT += dt;
    return;
  }
  collect(state);
  if (n.phase === 'dusk') {
    n.t -= dt;
    if (n.t <= 0) startWave(state, n.wave);
  } else if (n.phase === 'lull') {
    const stove = state.stove;
    const sx = stove ? stove.x - p.x : 0, sy = stove ? stove.y - p.y : 0;
    if (stove && state.charm !== THREAD && Math.sqrt(sx * sx + sy * sy) <= NIGHT.stoveReach) {
      p.health = Math.min(state.maxHealth, p.health + NIGHT.stoveHeal * dt);
    }
    n.t -= dt;
    if (n.t <= 0) startWave(state, n.wave + 1);
  } else if (n.phase === 'wave') {
    const alive = aliveCount(state);
    n.spawnT -= dt;
    if (n.qi < n.qn && n.spawnT <= 0 && alive < NIGHT.aliveCap(n.wave + 1)) {
      spawnNext(state);
      n.spawnT = NIGHT.spawnEvery;
    }
    if (n.qi >= n.qn && alive === 0) endWave(state);
  }
}

// The sky's light for the current hour, rising to daylight over the dawn.
export function ambientFor(night) {
  const base = LIGHT.night[Math.min(night.wave, LIGHT.night.length - 1)];
  if (night.phase !== 'dawn') return base;
  const k = Math.min(1, night.dawnT / LIGHT.dawnTime);
  return base + (LIGHT.dawn - base) * k * k;
}

// The sky panorama's light level (0-15): dim all night, full at sunrise.
export function skyLevelFor(night) {
  if (night.phase === 'dawn') return Math.round(4 + 11 * Math.min(1, night.dawnT / LIGHT.dawnTime));
  return night.wave >= 6 ? 4 : 3;
}

// What the HUD clock shows: the hour of the wave being fought, or the one coming.
export function hourLabel(night) {
  if (night.phase === 'dawn') return '5 AM';
  if (night.phase === 'dusk') return '8 PM';
  if (night.phase === 'lull') return NIGHT.hours[Math.min(night.wave + 1, LAST_WAVE)];
  return NIGHT.hours[night.wave];
}
```

`last-light/src/sim.js` (the full file now):
```js
// One night's state, and step(): a single 120 Hz update of the whole game world. step never touches
// the DOM, the canvas, the clock or Math.random, and allocates nothing, so a night replays exactly
// from its seed and intents, and every rule is tested in Node.
import { DT, PLAYER, NIGHT, PERKS, UPGRADES, CHARMS } from './tuning.js';
import { parseMap } from './map.js';
import { createRng } from './rng.js';
import { createPlayer, movePlayer } from './player.js';
import { createField, updateField } from './flowfield.js';
import { createCreatures, updateCreatures } from './creatures.js';
import { createGun, createFlares, updateGun, updateFlares, giveShotgun } from './weapons.js';
import { createNight, createPickups, updateNight } from './night.js';
import { createEvents, emit } from './events.js';
import { createEmbers, updateEmbers } from './embers.js';
import { createPerks, updateChoosing, UPGRADE_COUNT } from './upgrades.js';
import { createCharms, updateCharms, wearCharm, HARE } from './charms.js';

// seed: the night's random seed. wave: start at this wave index (the ?wave= debug mode; from 11 PM on
// you start with the shotgun). god: you can't die. gentle: "Embers come to you". embers: carried from
// the start (the ?embers= debug mode). charm: the charm you wear from the start (the ?charm= debug
// mode), -1 for none.
export function createState({ seed = 1, wave = 0, god = false, gentle = false, embers = 0, charm = -1, map = parseMap() } = {}) {
  const state = {
    seed, rng: createRng(seed), tick: 0, time: 0, god,
    map, field: createField(map),
    player: createPlayer(map.start), maxHealth: PLAYER.health,
    gun: createGun(), flares: createFlares(), creatures: createCreatures(), pickups: createPickups(map),
    stove: map.props.find((p) => p.kind === 'stove') ?? null,
    night: createNight(),
    events: createEvents(), eventCount: 0,
    flash: 0, hurt: 0, shake: 0,
    stats: { kills: 0 },
    // Dark harvest: embers on the snow, the ones you carry, and what the fire has sold you.
    embers: createEmbers(), carried: embers, gentle,
    perks: createPerks(), bought: 0, taken: new Int8Array(UPGRADE_COUNT).fill(-1),
    offer: new Int8Array(UPGRADES.offer).fill(-1), offerN: 0, atFire: false, choosing: false,
    // Cursed charms: the one you wear (-1 for none), those on the snow, their own random stream (so
    // they never change the rest of the night's), and the slot of the one you're reading (-1 for none).
    charm: -1, charms: createCharms(), charmRng: createRng(seed ^ 0x5bd1e995), charmAt: -1,
  };
  state.night.wave = wave;
  state.night.reached = wave;
  if (charm >= 0) wearCharm(state, charm);
  if (wave >= NIGHT.shotgunBefore) {
    giveShotgun(state);
    state.gun.current = state.gun.next;
    state.gun.switching = 0;
  }
  state.eventCount = 0;
  updateField(state.field, map, state.player.x, state.player.y);
  return state;
}

export function step(state, intents) {
  state.eventCount = 0;
  state.tick++;
  state.time += DT;
  if (state.flash > 0) state.flash -= DT;
  if (state.hurt > 0) state.hurt -= DT;
  if (state.shake > 0) state.shake -= DT;
  const phase = state.night.phase;
  if (phase === 'dead') return state;
  const p = state.player;
  movePlayer(state.map, p, intents, DT, (state.perks.snowshoes ? PERKS.snowshoes : 1) * (state.charm === HARE ? CHARMS.hare.speed : 1));
  updateField(state.field, state.map, p.x, p.y);
  updateChoosing(state, intents);
  if (phase !== 'dawn') updateGun(state, intents, DT);
  updateCreatures(state, DT);
  updateFlares(state, DT);
  updateEmbers(state, DT);
  updateCharms(state, intents, DT);
  updateNight(state, DT);
  if (p.health <= 0 && state.night.phase !== 'dead') {
    p.health = 0;
    state.night.phase = 'dead';
    emit(state, 'dead');
  }
  return state;
}
```

`last-light/src/events.js` (the full file now):
```js
// What happened during an update, for sound, effects and the HUD to react to. The events live in a
// fixed pool that each update reuses, so nothing is allocated: read state.events[0 .. eventCount).
//
//   type          x, y            a                    b
//   shot          you             0 rifle, 1 shotgun
//   dry           you             weapon               (fired with nothing loaded)
//   reload        you             weapon               (a round or both shells went in)
//   switch        you             weapon now raising
//   hit           the creature    kind                 1 if it died
//   flareThrow    where it lands
//   flareOut      where it was
//   hurt          the attacker    damage
//   windup        the creature    kind                 (a gaunt or the Mother winding up)
//   shriek        the leaper                           (crouching to leap)
//   leap          the leaper
//   birth         the Mother
//   spawn         the creature    kind
//   pickup        the spot        0 flare, 1 shells, 2 shotgun
//   emberDrop     where it fell   value
//   ember         where it was    value                (you took it)
//   emberOut      where it was                         (it cooled out)
//   offer         the stove       how many cards
//   upgrade       you             upgrade id
//   alight        the creature    kind                 (set burning)
//   charmDrop     where it fell   charm id
//   charm         you             charm id             (you took it)
//   charmOut      where it was    charm id             (it went at the next wave)
//   wave          -               wave index
//   lull          -               the next wave's index
//   dawn / dead   -
export const MAX_EVENTS = 128;

export function createEvents() {
  return Array.from({ length: MAX_EVENTS }, () => ({ type: '', x: 0, y: 0, a: 0, b: 0 }));
}

export function emit(state, type, x = 0, y = 0, a = 0, b = 0) {
  if (state.eventCount >= MAX_EVENTS) return;
  const e = state.events[state.eventCount++];
  e.type = type;
  e.x = x;
  e.y = y;
  e.a = a;
  e.b = b;
}
```

`last-light/src/input.js` (the full file now):
```js
// Keyboard and mouse. The mouse turns you, and looks up and down, the moment its event arrives (input
// owns your facing and pitch), so looking never waits for an update. Pointer lock asks for raw, unaccelerated input where the browser
// has it. Everything else is sampled once per update into a reused intents object: held keys as held,
// and presses (reload, flare, weapon keys, the fire's cards, taking a charm, the wheel) latched so a tap
// shorter than an update still counts exactly once. Keys 1 to 3 are also `pick` (a card at the fire); the simulation
// decides which one a press means. OS key auto-repeat is ignored, losing focus releases everything,
// and a held Cmd/Ctrl is left to the browser.
import { KEYS, MOUSE, VIEW } from './tuning.js';

const isMeta = (code) => code === 'MetaLeft' || code === 'MetaRight';

function anyDown(down, codes) {
  for (let i = 0; i < codes.length; i++) if (down.has(codes[i])) return true;
  return false;
}
const WHEEL_GAP = 150; // ms of quiet before a wheel event steps, so a whole trackpad fling is one switch

export function createInput(target = globalThis, doc = globalThis.document, bindings = KEYS) {
  const actionOf = new Map(), pickOf = new Map();
  for (const [action, codes] of Object.entries(bindings)) {
    if (action === 'pick') codes.forEach((code, i) => pickOf.set(code, i + 1));
    else for (const code of codes) actionOf.set(code, action);
  }
  const down = new Set();
  const pressed = { reload: 0, flare: 0, rifle: 0, shotgun: 0, mute: 0, wheel: 0, pick: 0, take: 0 };
  let fireHeld = false, fireTapped = false, lastWheel = -Infinity, lastMove = 0;
  const out = { pick: 0, take: 0, facing: 0, pitch: 0, forward: 0, strafe: 0, run: false, fire: false, flare: 0, reload: 0, weapon: 0, weaponStep: 0 };
  const ui = { mute: 0 };

  const input = {
    facing: 0,
    pitch: 0, // up is positive, within VIEW.maxPitch either way
    sensitivity: 1, // multiplier on MOUSE.sensitivity, from the pause menu's slider
    locked: false, // pointer lock held
    element: null, // the canvas that takes the pointer lock
    // Lets go of every key and the trigger, and forgets presses not yet taken (after a pause, so a
    // key pressed on the pause menu doesn't fire on resume).
    releaseAll() {
      down.clear();
      fireHeld = false;
      fireTapped = false;
      pressed.reload = pressed.flare = pressed.rifle = pressed.shotgun = pressed.wheel = pressed.pick = pressed.take = 0;
    },
    // Asks for pointer lock on the canvas; call it from inside a click. Asks for raw input first, and
    // falls back to plain pointer lock where that isn't supported. Resolves true if the lock was
    // granted (or the browser doesn't say), false if it was refused: Chrome refuses for a moment
    // after Esc released it.
    async lock() {
      const el = input.element;
      if (!el?.requestPointerLock) return false;
      try {
        await el.requestPointerLock({ unadjustedMovement: true });
        return true;
      } catch {
        try {
          await el.requestPointerLock();
          return true;
        } catch {
          return false;
        }
      }
    },
    // Fills and returns the intents for one update.
    sample() {
      out.facing = input.facing;
      out.pitch = input.pitch;
      out.forward = (anyDown(down, bindings.forward) ? 1 : 0) - (anyDown(down, bindings.back) ? 1 : 0);
      out.strafe = (anyDown(down, bindings.right) ? 1 : 0) - (anyDown(down, bindings.left) ? 1 : 0);
      out.run = anyDown(down, bindings.run);
      out.fire = fireHeld || fireTapped;
      fireTapped = false;
      out.reload = pressed.reload;
      out.flare = pressed.flare;
      out.weapon = pressed.shotgun ? 2 : pressed.rifle ? 1 : 0;
      out.weaponStep = pressed.wheel;
      out.pick = pressed.pick;
      out.take = pressed.take;
      pressed.reload = pressed.flare = pressed.rifle = pressed.shotgun = pressed.wheel = pressed.pick = pressed.take = 0;
      return out;
    },
    // Presses for the page itself since the last call, into a reused { mute }.
    takeUI() {
      ui.mute = pressed.mute;
      pressed.mute = 0;
      return ui;
    },
  };

  target.addEventListener('keydown', (e) => {
    if (isMeta(e.code)) return input.releaseAll();
    if (e.metaKey || e.ctrlKey) return;
    const action = actionOf.get(e.code), pick = pickOf.get(e.code) ?? 0;
    if (!action && !pick) return;
    if (!input.locked && action !== 'mute') return; // unlocked: the page (title, pause menu) gets its own keys
    e.preventDefault();
    if (e.repeat || down.has(e.code)) return;
    down.add(e.code);
    if (action && action in pressed) pressed[action] = 1;
    if (pick) pressed.pick = pick;
  });
  target.addEventListener('keyup', (e) => (isMeta(e.code) ? input.releaseAll() : down.delete(e.code)));
  target.addEventListener('mousemove', (e) => {
    if (!input.locked) return;
    const dx = e.movementX || 0, dy = e.movementY || 0;
    const size = Math.max(Math.abs(dx), Math.abs(dy)), before = lastMove;
    lastMove = size;
    if (size > MOUSE.spike && size > MOUSE.jump * before + MOUSE.floor) return; // a browser glitch, not a hand
    const turn = MOUSE.sensitivity * input.sensitivity;
    input.facing += dx * turn;
    if (input.facing > Math.PI) input.facing -= 2 * Math.PI;
    else if (input.facing < -Math.PI) input.facing += 2 * Math.PI;
    input.pitch -= dy * turn; // pushing the mouse away looks up
    if (input.pitch > VIEW.maxPitch) input.pitch = VIEW.maxPitch;
    else if (input.pitch < -VIEW.maxPitch) input.pitch = -VIEW.maxPitch;
  });
  target.addEventListener('mousedown', (e) => {
    if (!input.locked) return; // clicks on the page (start, resume) are main.js's
    if (e.button === 0) {
      fireHeld = true;
      fireTapped = true;
    } else if (e.button === 2) pressed.flare = 1;
  });
  target.addEventListener('mouseup', (e) => {
    if (e.button === 0) fireHeld = false;
  });
  target.addEventListener('contextmenu', (e) => e.preventDefault());
  target.addEventListener(
    'wheel',
    (e) => {
      if (!input.locked || e.deltaY === 0) return;
      e.preventDefault?.();
      // Every event pushes the quiet back, so a fling's momentum tail can't step again.
      const now = e.timeStamp ?? 0;
      const quiet = now - lastWheel >= WHEEL_GAP;
      lastWheel = now;
      if (quiet) pressed.wheel = e.deltaY > 0 ? 1 : -1;
    },
    { passive: false },
  );
  target.addEventListener('blur', () => input.releaseAll());
  doc?.addEventListener('visibilitychange', () => {
    if (doc.hidden) input.releaseAll();
  });
  doc?.addEventListener('pointerlockchange', () => {
    input.locked = !!doc.pointerLockElement && doc.pointerLockElement === input.element;
    input.releaseAll(); // gained or lost: nothing pressed before the change carries across it
    lastMove = 0; // nor does a flick: a new lock's first event is judged from stillness
  });
  return input;
}
```

`last-light/src/bot.js` (the full file now):
```js
// ?debug=bot: the game plays itself, for testing whole nights. It turns and looks up or down (at a
// human-ish rate) towards the nearest creature it can see and fires once on target, backs off from anything close, takes the
// shotgun to close quarters, throws a flare into a crowd, reloads in quiet moments, and in a lull goes
// for supplies and then warms up at the stove. It fetches embers in plain sight that it can reach safely before they
// cool (walking to one while it shoots, when the nearest creature isn't close), and at the fire takes
// the card it likes best. It never takes a charm (its `take` stays 0), so its nights are the same with
// or without them. It produces the same intents as the keyboard and mouse.
import { canSee } from './raycast.js';
import { KINDS, MOTHER } from './creatures.js';
import { SHOTGUN_ID, RIFLE_ID, flareMax } from './weapons.js';
import { CREATURES as TUNED, PLAYER, VIEW } from './tuning.js';
import { UPGRADE_LIST, UPGRADE_COUNT, upgradeCost } from './upgrades.js';

const TURN = 7; // radians per second
const HIT_R = KINDS.map((k) => TUNED[k].hit);
const HEIGHT = KINDS.map((k) => TUNED[k].height);

export function createBot() {
  return { facing: null, pitch: 0, out: { pick: 0, take: 0, facing: 0, pitch: 0, forward: 0, strafe: 0, run: false, fire: false, flare: 0, reload: 0, weapon: 0, weaponStep: 0 } };
}

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// The cards it prefers, best first.
const PREFER = ['warm', 'quickLever', 'pierce', 'reach', 'dragon', 'deepMagazine', 'magnesium', 'steady', 'wick', 'snowshoes', 'slugs', 'pockets']
  .map((key) => UPGRADE_LIST.findIndex((u) => u.key === key));
const FETCH = { range: 8, clear: 3, speed: 4.8, spare: 0.3 }; // how far, how clear of creatures, how fast it runs, time to spare

// The nearest ember worth fetching: within range, in plain sight, clear of creatures, and still warm when it gets there.
function emberToFetch(state) {
  const p = state.player;
  let pick = null, best = FETCH.range;
  for (const e of state.embers) {
    if (e.t <= 0) continue;
    const ex = e.x - p.x, ey = e.y - p.y, d = Math.sqrt(ex * ex + ey * ey);
    if (d >= best || e.t < d / FETCH.speed + FETCH.spare) continue;
    if (!canSee(state.map, p.x, p.y, e.x, e.y)) continue;
    let clear = true;
    for (const c of state.creatures) {
      if (!c.alive || c.dying) continue;
      const cx = c.x - e.x, cy = c.y - e.y;
      if (cx * cx + cy * cy < FETCH.clear * FETCH.clear) {
        clear = false;
        break;
      }
    }
    if (clear) {
      best = d;
      pick = e;
    }
  }
  return pick;
}

// The offered card it likes best, as a key press (1 to 3).
function bestCard(state) {
  let slot = 0, rank = UPGRADE_COUNT;
  for (let i = 0; i < state.offerN; i++) {
    const r = PREFER.indexOf(state.offer[i]);
    if (r < rank) {
      rank = r;
      slot = i;
    }
  }
  return slot + 1;
}

// Heads for (gx, gy), running; returns false once it's there.
function goTo(out, bot, p, gx, gy) {
  const d = Math.sqrt((gx - p.x) * (gx - p.x) + (gy - p.y) * (gy - p.y));
  if (d <= 0.2) return false;
  steer(out, bot.facing, (gx - p.x) / d, (gy - p.y) / d);
  out.run = true;
  return true;
}

function steer(out, facing, wx, wy) {
  const c = Math.cos(facing), s = Math.sin(facing);
  out.forward = Math.max(-1, Math.min(1, wx * c + wy * s));
  out.strafe = Math.max(-1, Math.min(1, -wx * s + wy * c));
}

export function botIntents(state, bot, dt) {
  const p = state.player, g = state.gun, out = bot.out, n = state.night;
  if (bot.facing === null) bot.facing = p.facing;
  out.fire = false;
  out.flare = 0;
  out.reload = 0;
  out.weapon = 0;
  out.forward = 0;
  out.strafe = 0;
  out.run = false;
  out.pick = state.choosing && state.offerN > 0 ? bestCard(state) : 0;
  const ember = emberToFetch(state);

  // The nearest creature in sight, except that the Mother comes first when nothing is close.
  let target = null, best = Infinity, crowd = 0, mother = null, motherD = 0;
  for (const c of state.creatures) {
    if (!c.alive || c.dying) continue;
    const cx = c.x - p.x, cy = c.y - p.y, d = Math.sqrt(cx * cx + cy * cy);
    if (d < 4) crowd++;
    if (!canSee(state.map, p.x, p.y, c.x, c.y)) continue;
    if (c.kind === MOTHER) {
      mother = c;
      motherD = d;
    }
    if (d < best) {
      best = d;
      target = c;
    }
  }
  if (mother && best > 2.5) {
    target = mother;
    best = motherD;
  }

  let want = bot.facing, wantPitch = 0;
  if (target) {
    want = Math.atan2(target.y - p.y, target.x - p.x);
    const low = target.lift, high = target.lift + HEIGHT[target.kind];
    wantPitch = Math.atan2((low + high) / 2 - PLAYER.eye, best);
    const err = Math.abs(wrap(want - bot.facing));
    const z = PLAYER.eye + best * Math.tan(bot.pitch); // where the crosshair is as it passes the target
    out.fire = err < Math.asin(Math.min(1, (HIT_R[target.kind] * 0.8) / Math.max(best, 0.01))) && z >= low && z <= high;
    const close = best < 3;
    out.weapon = close && g.hasShotgun && g.shells + g.spare > 0 ? 2 : !close || !g.hasShotgun ? 1 : 0;
    if (crowd >= 4 && g.flares > 0 && err < 0.3) out.flare = 1;
    if (best < 2.5) {
      // Back off, sliding sideways so we don't back into a corner.
      const ax = (p.x - target.x) / best, ay = (p.y - target.y) / best;
      steer(out, bot.facing, ax - ay * 0.5, ay + ax * 0.5);
      out.run = true;
    } else if (ember && best > 4) goTo(out, bot, p, ember.x, ember.y);
  } else if (ember) {
    // Embers first: they cool.
    want = Math.atan2(ember.y - p.y, ember.x - p.x);
    goTo(out, bot, p, ember.x, ember.y);
  } else if (n.phase === 'lull') {
    let pick = null;
    for (let i = 0; i < state.pickups.length; i++) if (state.pickups[i].active) { pick = state.pickups[i]; break; }
    const porch = state.map.start;
    const shop = state.carried >= upgradeCost(state.bought) && state.bought < UPGRADE_COUNT;
    let gx, gy;
    if (pick && !(pick.kind === 0 && g.flares >= flareMax(state))) {
      gx = pick.x;
      gy = pick.y;
    } else if ((p.health < state.maxHealth || shop) && state.stove) {
      // Through the doorway: line up on the porch first.
      const inside = p.y < porch.y - 1.2;
      gx = inside || Math.abs(p.x - porch.x) < 0.3 ? state.stove.x : porch.x;
      gy = inside || Math.abs(p.x - porch.x) < 0.3 ? state.stove.y + 0.9 : porch.y;
    } else {
      gx = porch.x;
      gy = porch.y + 2;
    }
    const d = Math.sqrt((gx - p.x) * (gx - p.x) + (gy - p.y) * (gy - p.y));
    if (d > 0.2) {
      want = Math.atan2(gy - p.y, gx - p.x);
      steer(out, bot.facing, (gx - p.x) / d, (gy - p.y) / d);
    }
    if (g.current === RIFLE_ID && g.rifle < 8) out.reload = 1;
  } else {
    // Nothing in sight: turn slowly, and top up the rifle.
    want = bot.facing + 1.5 * dt * 4;
    if (g.current === RIFLE_ID && g.rifle < 6) out.reload = 1;
    if (g.current === SHOTGUN_ID && g.shells < 2) out.reload = 1;
    const cx = state.map.start.x, cy = state.map.start.y + 3, d = Math.sqrt((cx - p.x) * (cx - p.x) + (cy - p.y) * (cy - p.y));
    if (d > 3) steer(out, bot.facing, (cx - p.x) / d, (cy - p.y) / d);
  }
  const turn = wrap(want - bot.facing);
  bot.facing = wrap(bot.facing + Math.max(-TURN * dt, Math.min(TURN * dt, turn)));
  wantPitch = Math.max(-VIEW.maxPitch, Math.min(VIEW.maxPitch, wantPitch));
  bot.pitch += Math.max(-TURN * dt, Math.min(TURN * dt, wantPitch - bot.pitch));
  out.facing = bot.facing;
  out.pitch = bot.pitch;
  return out;
}
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `cd last-light && npm test`
Expected: PASS, 252 tests.

- [ ] **Step 5: Commit**

```bash
git add last-light/src last-light/test
git commit -m "Last Light: cursed charms, what they give and what they take"
```

## Task 2: The art: a charm on the snow, and six icons

**Files:**
- Modify:
  - `art/last-light/sprites.lua` (three edits)
  - `art/last-light/hud.lua` (three edits)
  - `last-light/test/art.test.js` (a full replacement)
- Regenerated by the art loop:
  - `art/last-light/sprites.aseprite`, `art/last-light/hud.aseprite`
  - `last-light/assets/sprites.json`, `sprites.png`, `hud.json`, `hud.png`

**Interfaces:**
- **Consumes:** `CHARM_LIST` from Task 1 (for the icons' names).
- **Produces:**
  - a `charm` sprite: 4 frames of 8×9, height 0.14, `ms` 140, `anims.idle = [0, 1, 2, 3, 3, 3]`;
  - six HUD icons, 12×12, named `charm-` and each charm's key.

- [ ] **Step 1: Write the failing test**

`last-light/test/art.test.js` (the full file now):
```js
// Checks the committed art (last-light/assets/, written by the scripts in art/last-light/) against
// everything the code expects: every texture the map uses, every sprite and animation the scene draws,
// every frame and icon the HUD draws, and image sizes that hold them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { WALLS } from '../src/map.js';
import { FLOORS, COLOR_SLACK } from '../src/assets.js';
import { SPRITE_ANIMS, SPRAY_Z } from '../src/scene.js';
import { KINDS } from '../src/creatures.js';
import { CREATURES } from '../src/tuning.js';
import { HAND_FRAMES, HUD_ICONS } from '../src/hud.js';
import { UPGRADE_LIST } from '../src/upgrades.js';
import { CHARM_LIST } from '../src/charms.js';

const file = (f) => new URL(`../${f}`, import.meta.url);
const json = (f) => JSON.parse(readFileSync(file(`assets/${f}`), 'utf8'));
// A PNG's width and height, from its header.
function pngSize(f) {
  const b = readFileSync(file(f));
  assert.equal(b.toString('ascii', 1, 4), 'PNG', `${f} is a PNG`);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}
const inside = (rect, [w, h]) => rect[0] >= 0 && rect[1] >= 0 && rect[0] + rect[2] <= w && rect[1] + rect[3] <= h;

test('the palette: up to 255 colours, with glow indices and the named colours the game uses', () => {
  const p = json('palette.json');
  assert.ok(p.colors.length > 0 && p.colors.length <= 255);
  for (const c of p.colors) assert.match(c, /^#[0-9a-f]{6}$/);
  assert.equal(new Set(p.colors).size, p.colors.length, 'no colour twice');
  for (const i of p.glow) assert.ok(i >= 1 && i <= p.colors.length);
  for (const n of ['flake', 'ichor', 'spark', 'ui', 'uiDim', 'hurt', 'night']) assert.ok(p.names[n] >= 1 && p.names[n] <= p.colors.length, n);
  assert.ok(p.glow.includes(p.names.spark), 'sparks glow');
});

test('no two palette colours are close enough for readback noise to land between them', () => {
  const rgb = json('palette.json').colors.map((c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)));
  for (let i = 0; i < rgb.length; i++) {
    for (let j = i + 1; j < rgb.length; j++) {
      const apart = Math.max(...[0, 1, 2].map((k) => Math.abs(rgb[i][k] - rgb[j][k])));
      assert.ok(apart > 2 * COLOR_SLACK, `colours ${i + 1} and ${j + 1} are only ${apart} apart`);
    }
  }
});

test('a texture for every wall kind and floor, 32x32 each, side by side', () => {
  const t = json('textures.json');
  assert.equal(t.size, 32);
  const need = new Set([...FLOORS]);
  for (const k of Object.values(WALLS)) (need.add(k.ns), need.add(k.ew));
  for (const n of need) assert.ok(t.names.includes(n), `texture ${n}`);
  assert.deepEqual(pngSize('assets/textures.png'), [32 * t.names.length, 32]);
});

test('the sky is a wide panorama', () => {
  const [w, h] = pngSize('assets/sky.png');
  assert.ok(w >= 512 && h >= 64 && h <= 256, `${w}x${h}`);
});

test('every sprite, with every animation, inside sprites.png', () => {
  const { sprites } = json('sprites.json');
  const size = pngSize('assets/sprites.png');
  for (const [name, anims] of Object.entries(SPRITE_ANIMS)) {
    const s = sprites[name];
    assert.ok(s, `sprite ${name}`);
    assert.ok(s.height > 0 && s.count > 0, name);
    assert.ok(inside([s.x, s.y, s.w * s.count, s.h], size), `${name} fits in sprites.png`);
    for (const a of anims) {
      assert.ok(s.anims[a]?.length > 0, `${name}.${a}`);
      for (const f of s.anims[a]) assert.ok(f >= 0 && f < s.count, `${name}.${a} frame ${f}`);
    }
    if (['crawler', 'gaunt', 'leaper', 'mother'].includes(name)) {
      assert.equal(s.anims.walk.length, 4, `${name} walks in 4 frames`);
      assert.ok(s.stride > 0, `${name} has a stride`);
    }
  }
});

// Against the 1.0-unit walls (a doorway's height; a window's top sits at about 0.75): a crawler comes
// about knee-high, its back (4/5 up its frame) under the window sill; a gaunt's head (0.82 up its
// frame) stands a little above a man's, under the doorway's top; the Mother towers over the cabin.
test('creature sizes: a crawler about knee-high, a gaunt a little taller than you, the Mother towering', () => {
  const { sprites } = json('sprites.json');
  assert.ok(sprites.crawler.height <= 0.4, `crawler ${sprites.crawler.height}`);
  assert.ok(sprites.gaunt.height > 1 && sprites.gaunt.height <= 1.15, `gaunt ${sprites.gaunt.height}`);
  assert.ok(sprites.mother.height >= 2, `mother ${sprites.mother.height}`);
  const order = ['crawler', 'leaper', 'gaunt', 'mother'].map((k) => sprites[k].height);
  assert.deepEqual(order, [...order].sort((a, b) => a - b), 'crawler < leaper < gaunt < mother');
});

test('a shot sees each creature as tall as it is drawn', () => {
  const { sprites } = json('sprites.json');
  for (const k of KINDS) assert.equal(CREATURES[k].height, sprites[k].height, k);
});

// A hit's spray comes out of the body: above the legs, below the eyes.
test("a hit's spray comes from a creature's body, a third to three quarters of the way up it", () => {
  const { sprites } = json('sprites.json');
  KINDS.forEach((k, i) => {
    const up = SPRAY_Z[i] / sprites[k].height;
    assert.ok(up >= 0.35 && up <= 0.75, `${k}: spray at ${SPRAY_Z[i]} is ${up.toFixed(2)} of its ${sprites[k].height} height`);
  });
});

test('the ember and the new icons are the sizes the scene and the HUD expect', () => {
  const { sprites } = json('sprites.json');
  assert.deepEqual([sprites.ember.w, sprites.ember.h, sprites.ember.count, sprites.ember.height], [10, 6, 3, 0.12]);
  const { icons } = json('hud.json');
  for (const n of ['ember', 'crosshairSteady']) assert.deepEqual(icons[n].slice(2), [7, 7], n);
  for (const u of UPGRADE_LIST) assert.deepEqual(icons[`up-${u.key}`].slice(2), [12, 12], u.key);
});

test('the charm and its icons are the sizes the scene and the HUD expect', () => {
  const { sprites } = json('sprites.json');
  assert.deepEqual([sprites.charm.w, sprites.charm.h, sprites.charm.count, sprites.charm.height], [8, 9, 4, 0.14]);
  const { icons } = json('hud.json');
  for (const c of CHARM_LIST) assert.deepEqual(icons[`charm-${c.key}`].slice(2), [12, 12], c.key);
});

test('every hands frame and HUD icon, inside their sheets', () => {
  const hands = json('hands.json').frames, hud = json('hud.json').icons;
  const hs = pngSize('assets/hands.png'), is = pngSize('assets/hud.png');
  for (const n of HAND_FRAMES) assert.ok(hands[n] && hands[n].length === 6 && inside(hands[n], hs), n);
  for (const n of HUD_ICONS) assert.ok(hud[n] && inside(hud[n], is), n);
});

test('the tab icon is 48x48', () => {
  assert.ok(existsSync(file('icon.png')));
  assert.deepEqual(pngSize('icon.png'), [48, 48]);
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `cd last-light && node --test test/art.test.js`
Expected: FAIL: "the charm and its icons are the sizes the scene and the HUD expect" finds no `charm` in `sprites.json`.

- [ ] **Step 3: The charm sprite (three edits to `art/last-light/sprites.lua`)**

**Edit 1.** Find:
```lua
-- leaper and the Mother; the stove, well and lone pine; a burning flare and the three pickups), in
-- last-light/assets/sprites.png, with their frames and animations in sprites.json. Run from the repo
-- root:
```
Replace with:
```lua
-- leaper and the Mother; the stove, well and lone pine; a burning flare, an ember, a charm and the
-- three pickups), in last-light/assets/sprites.png, with their frames and animations in sprites.json.
-- Run from the repo root:
```

**Edit 2.** Find:
```lua
  }) do frames[#frames + 1] = picture(rows, EMBER_KEY) end
  return frames
end

```
Replace with:
```lua
  }) do frames[#frames + 1] = picture(rows, EMBER_KEY) end
  return frames
end

-- A charm on the snow: a bone pendant on a dark cord, hovering a little. 8x9. A cold glint (the glowing
-- star colour, so it shows in the dark) crosses it in three frames, then it rests for three.
local CHARM_KEY = { c = C.ichor1, P = C.flesh4, p = C.flesh3, q = C.flesh2, ["*"] = C.star }
local function charmFrames()
  local base = {
    "..cccc..",
    ".c....c.",
    ".c....c.",
    "..c..c..",
    "...PP...",
    "..PPPp..",
    "..PPpq..",
    "...Pq...",
    "....q...",
  }
  local frames = {}
  for _, glint in ipairs({ { { 3, 4 } }, { { 3, 5 }, { 2, 5 }, { 4, 5 }, { 3, 4 }, { 3, 6 } }, { { 4, 6 } }, {} }) do
    local rows = {}
    for i, r in ipairs(base) do rows[i] = r end
    for _, g in ipairs(glint) do
      local r = rows[g[2] + 1]
      rows[g[2] + 1] = r:sub(1, g[1]) .. "*" .. r:sub(g[1] + 2)
    end
    frames[#frames + 1] = picture(rows, CHARM_KEY)
  end
  return frames
end

```

**Edit 3.** Find:
```lua
  { name = "ember", frames = emberFrames(), height = 0.12, ms = 110, anims = { idle = { 0, 1, 2 } } },
```
Replace with:
```lua
  { name = "ember", frames = emberFrames(), height = 0.12, ms = 110, anims = { idle = { 0, 1, 2 } } },
  { name = "charm", frames = charmFrames(), height = 0.14, ms = 140, anims = { idle = { 0, 1, 2, 3, 3, 3 } } },
```

- [ ] **Step 4: The six icons (three edits to `art/last-light/hud.lua`)**

**Edit 1.** Find:
```lua
-- warm Steady hands variant), the hit tick, the ember counter's ember, and one 12x12 icon for each of
-- the fire's upgrades ("up-" and its key in last-light/src/upgrades.js), in last-light/assets/hud.png
-- with each icon's place in hud.json. Run from the repo root:
```
Replace with:
```lua
-- warm Steady hands variant), the hit tick, the ember counter's ember, one 12x12 icon for each of the
-- fire's upgrades ("up-" and its key in last-light/src/upgrades.js), and one 12x12 icon for each charm
-- ("charm-" and its key in last-light/src/charms.js), in last-light/assets/hud.png with each icon's
-- place in hud.json. Run from the repo root:
```

**Edit 2.** Find:
```lua
  Y = C.fire4, O = C.fire3, r = C.fire2, E = C.ember0, g = C.stone3, W = C.wood4, n = C.snow2,
```
Replace with:
```lua
  Y = C.fire4, O = C.fire3, r = C.fire2, E = C.ember0, g = C.stone3, W = C.wood4, n = C.snow2,
  P = C.flesh4, p = C.flesh3, q = C.flesh2, K = C.night4, e = C.eye1, y = C.eye2, G = C.gum,
  m = C.wood3, ["5"] = C.wood5, S = C.snow3,
```

**Edit 3.** Find:
```lua
    ".....WW.....",
    "............",
  }) },
```
Replace with:
```lua
    ".....WW.....",
    "............",
  }) },
  -- Wolf's tooth: a long fang hanging from its cord.
  { "charm-wolf", icon({
    "....dddd....",
    "...d....d...",
    "....d..d....",
    ".....dd.....",
    "....PPPp....",
    "....PPPpq...",
    "....PPPpq...",
    ".....PPpq...",
    ".....PPpq...",
    "......Ppq...",
    ".......pq...",
    "........q...",
  }) },
  -- Red thread: a loop of it, knotted, the ends hanging loose.
  { "charm-thread", icon({
    "............",
    "....RRRR....",
    "...R....R...",
    "..R......R..",
    "..R......R..",
    "..R......R..",
    "...R....R...",
    "....RHHR....",
    ".....HH.....",
    "....H..H....",
    "...H....H...",
    "............",
  }) },
  -- Crow's feather: blue-black, with a pale sheen down its edge and a bare quill.
  { "charm-crow", icon({
    "..........n.",
    ".........nK.",
    "........nKK.",
    ".......nKKK.",
    "......nKKKK.",
    ".....nKKKK..",
    "....nKKKK...",
    "...nKKKK....",
    "...KKKK.....",
    "..d.KK......",
    ".d..........",
    "d...........",
  }) },
  -- Grave salt: a little heap of it, glinting.
  { "charm-salt", icon({
    "............",
    ".....w......",
    "....w.w.....",
    ".....w......",
    "............",
    ".....wS.....",
    "....wSSw....",
    "...wSSwSw...",
    "..wSSSSSSw..",
    ".wSSnSSSnSw.",
    ".nnnnnnnnnn.",
    "............",
  }) },
  -- Hare's foot: a furry foot tied with a cord, its claws showing.
  { "charm-hare", icon({
    "....dd......",
    "...d..d.....",
    "....dd......",
    "....mm......",
    "...m5mm.....",
    "...m55m.....",
    "...m55mm....",
    "...m555m....",
    "..m5555mm...",
    "..m55555m...",
    "..mm5555mm..",
    "...p.p.p....",
  }) },
  -- The Mother's eye: open, glowing, in its lids.
  { "charm-eye", icon({
    "............",
    "............",
    "....GGGG....",
    "..GGyyyyGG..",
    ".GyyekkeyyG.",
    "GyyekkkkeyyG",
    ".GyyekkeyyG.",
    "..GGyyyyGG..",
    "....GGGG....",
    "............",
    "............",
    "............",
  }) },
```

- [ ] **Step 5: Build the art, and check only the expected files changed**

Run the art loop from the repo root:
`for s in textures sky sprites hands hud icon; do /Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/last-light/$s.lua; done`

Then `git status --short` should list exactly the two `.lua` scripts, the two `.aseprite` files, `sprites.json`, `sprites.png`, `hud.json`, `hud.png` and `last-light/test/art.test.js`. Run the loop a second time: nothing more changes.

- [ ] **Step 6: Run the tests to see them pass**

Run: `cd last-light && npm test`
Expected: PASS, 253 tests.

- [ ] **Step 7: Commit**

```bash
git add art/last-light last-light/assets last-light/test/art.test.js
git commit -m "Last Light: a charm on the snow, and an icon for each charm"
```

## Task 3: The art: a charm on your gun

**Files:**
- Modify:
  - `art/last-light/lib.lua` (two edits)
  - `art/last-light/hands.lua` (edits)
  - `art/last-light/hud.lua` (edits)
  - `last-light/src/assets.js` (a full replacement)
  - `last-light/test/assets.test.js`, `last-light/test/art.test.js` (full replacements)
- Regenerated by the art loop:
  - `last-light/assets/hands.json` (the images don't change)
  - `art/last-light/hud.aseprite`, `last-light/assets/hud.json`, `last-light/assets/hud.png`

**Interfaces:**
- **Consumes:** `CHARM_LIST` from Task 1 (the pendants' keys); Task 2's `hud.lua`.
- **Produces:**
  - `hands.json` gains `charms`: for each gun frame (`rifle-*`, `shotgun-*`), `[x, y]`, where the charm hangs from it, relative to the bottom centre of the view (the same terms as a frame's `(ox, oy)`);
  - `art.hands.charms` from `unpackArt` (assets.js);
  - HUD pieces `hang-<key>-<turn>` for each charm and turn 0 to 10: 45×25, the pendant turned to `-0.75 + 0.15 × turn` radians about the top of its chain, which is at column 22 of the top row.

- [ ] **Step 1: Write the failing tests**

`last-light/test/assets.test.js` (the full file now):
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { indexPixels, cut, unpackArt, buildMips, COLOR_SLACK } from '../src/assets.js';

// A column-major frame (index x * h + y), as sprites are stored, from rows of digits (0 is clear).
function frameOf(rows) {
  const h = rows.length, w = rows[0].length, px = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px[x * h + y] = Number(rows[y][x]);
  return { w, h, px };
}
const rowsOf = (f) => Array.from({ length: f.h }, (_, y) => Array.from({ length: f.w }, (_, x) => f.px[x * f.h + y]).join(''));

// RGBA for a w x h image from a function of (x, y) giving "#rrggbb" or null (transparent).
function rgba(w, h, at) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = at(x, y);
      if (!c) continue;
      const i = (y * w + x) * 4;
      data[i] = parseInt(c.slice(1, 3), 16);
      data[i + 1] = parseInt(c.slice(3, 5), 16);
      data[i + 2] = parseInt(c.slice(5, 7), 16);
      data[i + 3] = 255;
    }
  }
  return { w, h, data };
}

test('pixels become palette indices, transparent is 0, and a stray colour is named', () => {
  const colors = ['#000000', '#ffffff'];
  const idx = indexPixels(rgba(2, 1, (x) => (x ? '#ffffff' : null)), colors, 't');
  assert.deepEqual([...idx], [0, 2]);
  assert.throws(() => indexPixels(rgba(1, 1, () => '#123456'), colors, 'sky.png'), /sky\.png: the pixel at 0,0 is #123456/);
});

// One pixel's RGBA readback, for the noise tests.
const px = (r, g, b, a = 255) => ({ w: 1, h: 1, data: Uint8ClampedArray.from([r, g, b, a]) });

test('readback noise: a colour off by up to 2 in each channel is still its palette colour', () => {
  // The palette's closest two colours, 5 apart in red.
  const colors = ['#4e3324', '#4a2e22'];
  assert.equal(COLOR_SLACK, 2);
  assert.deepEqual([...indexPixels(px(0x4e + 2, 0x33 - 2, 0x24 + 1), colors, 't')], [1]);
  assert.deepEqual([...indexPixels(px(0x4e - 2, 0x33 + 1, 0x24 - 2), colors, 't')], [1]);
  assert.deepEqual([...indexPixels(px(0x4a + 2, 0x2e + 2, 0x22 - 1), colors, 't')], [2]);
  assert.deepEqual([...indexPixels(px(0x4a - 1, 0x2e - 2, 0x22 + 2), colors, 't')], [2]);
});

test('readback noise: alpha under half is clear, and half or more is opaque', () => {
  const colors = ['#000000', '#ffffff'];
  assert.deepEqual([...indexPixels(px(255, 255, 255, 100), colors, 't')], [0]);
  assert.deepEqual([...indexPixels(px(255, 255, 255, 1), colors, 't')], [0]);
  assert.deepEqual([...indexPixels(px(255, 255, 255, 128), colors, 't')], [2]);
  assert.deepEqual([...indexPixels(px(254, 253, 255, 200), colors, 't')], [2]);
});

test('a colour further off than noise is still an art bug, and is named', () => {
  const colors = ['#4e3324', '#4a2e22'];
  assert.throws(() => indexPixels(px(0x4e + 10, 0x33, 0x24), colors, 'sprites.png'), /sprites\.png: the pixel at 0,0 is #583324/);
  assert.throws(() => indexPixels(px(0x4e, 0x33 + 3, 0x24), colors, 'sky.png'), /isn't in the palette/);
});

test('cut: rows for floors, columns for walls and sprites', () => {
  const img = Uint8Array.from([1, 2, 3, 4]); // 2x2
  assert.deepEqual([...cut(img, 2, 0, 0, 2, 2, false)], [1, 2, 3, 4]);
  assert.deepEqual([...cut(img, 2, 0, 0, 2, 2, true)], [1, 3, 2, 4]);
});

test('mips: each level halves the frame, sides rounded up; a glowing texel wins its 2x2 block, else its first opaque texel', () => {
  const emissive = new Uint8Array(256);
  emissive[9] = 1;
  // 5x3. Blocks, reading across then down: [1 2 / 4 0] keeps 1; [0 8 / 9 0] keeps the glow 9 over the
  // 8 before it; [3 / 5] keeps 3; [0 0] stays clear; [0 7] keeps 7; [6] keeps 6.
  const f = frameOf(['12083', '40905', '00076']);
  const mips = buildMips(f, emissive);
  assert.deepEqual(mips.map((m) => [m.w, m.h]), [[3, 2], [2, 1], [1, 1]]);
  assert.deepEqual(rowsOf(mips[0]), ['193', '076']);
  assert.deepEqual(rowsOf(mips[1]), ['93']);
  assert.deepEqual(rowsOf(mips[2]), ['9']);
  assert.deepEqual(rowsOf(f), ['12083', '40905', '00076'], 'the frame itself is untouched');
});

test('unpackArt: textures by name, the sky, sprite frames, named colours', () => {
  const colors = ['#101010', '#202020', '#303030'];
  const json = {
    palette: { colors, glow: [3], names: { flake: 2, ichor: 1, ui: 2, uiDim: 1, hurt: 3, night: 1 } },
    textures: { size: 2, names: ['trunks', 'snow'] },
    sprites: { sprites: { well: { x: 0, y: 0, w: 1, h: 2, count: 2, height: 0.5, anims: { idle: [0, 1] } } } },
    hands: { frames: {}, charms: { 'rifle-idle': [41, -60] } },
    hud: { icons: {} },
  };
  const images = { textures: 'tex', sky: 'sky', sprites: 'spr', hands: 'hands', hud: 'hud' };
  const pixels = (img) =>
    ({
      tex: rgba(4, 2, (x, y) => colors[(x + y) % 2]),
      sky: rgba(3, 1, () => colors[2]),
      spr: rgba(2, 2, (x, y) => (x === 0 ? colors[y] : null)),
    })[img];
  const art = unpackArt(json, images, pixels);
  assert.deepEqual(Object.keys(art.walls), ['trunks']);
  assert.deepEqual(Object.keys(art.floors), ['snow']);
  assert.deepEqual([...art.walls.trunks], [1, 2, 2, 1]);
  assert.deepEqual([art.sky.w, art.sky.h, art.sky.px[0]], [3, 1, 3]);
  assert.deepEqual([...art.sprites.well.frames[0].px], [1, 2]);
  assert.deepEqual([...art.sprites.well.frames[1].px], [0, 0]);
  assert.deepEqual(art.sprites.well.frames[0].mips.map((m) => [m.w, m.h, ...m.px]), [[1, 1, 1], [1, 1, 1], [1, 1, 1]]);
  assert.equal(art.shades.emissive[3], 1);
  assert.deepEqual(art.ui, { text: '#202020', dim: '#101010', hurt: '#303030', night: '#101010' });
  assert.equal(art.flake, 2);
  assert.deepEqual(art.hands.charms, { 'rifle-idle': [41, -60] }, 'where a charm hangs from each gun');
});
```

`last-light/test/art.test.js` (the full file now):
```js
// Checks the committed art (last-light/assets/, written by the scripts in art/last-light/) against
// everything the code expects: every texture the map uses, every sprite and animation the scene draws,
// every frame and icon the HUD draws, and image sizes that hold them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { WALLS } from '../src/map.js';
import { FLOORS, COLOR_SLACK } from '../src/assets.js';
import { SPRITE_ANIMS, SPRAY_Z } from '../src/scene.js';
import { KINDS } from '../src/creatures.js';
import { CREATURES } from '../src/tuning.js';
import { HAND_FRAMES, HUD_ICONS } from '../src/hud.js';
import { UPGRADE_LIST } from '../src/upgrades.js';
import { CHARM_LIST } from '../src/charms.js';

const file = (f) => new URL(`../${f}`, import.meta.url);
const json = (f) => JSON.parse(readFileSync(file(`assets/${f}`), 'utf8'));
// A PNG's width and height, from its header.
function pngSize(f) {
  const b = readFileSync(file(f));
  assert.equal(b.toString('ascii', 1, 4), 'PNG', `${f} is a PNG`);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}
const inside = (rect, [w, h]) => rect[0] >= 0 && rect[1] >= 0 && rect[0] + rect[2] <= w && rect[1] + rect[3] <= h;

test('the palette: up to 255 colours, with glow indices and the named colours the game uses', () => {
  const p = json('palette.json');
  assert.ok(p.colors.length > 0 && p.colors.length <= 255);
  for (const c of p.colors) assert.match(c, /^#[0-9a-f]{6}$/);
  assert.equal(new Set(p.colors).size, p.colors.length, 'no colour twice');
  for (const i of p.glow) assert.ok(i >= 1 && i <= p.colors.length);
  for (const n of ['flake', 'ichor', 'spark', 'ui', 'uiDim', 'hurt', 'night']) assert.ok(p.names[n] >= 1 && p.names[n] <= p.colors.length, n);
  assert.ok(p.glow.includes(p.names.spark), 'sparks glow');
});

test('no two palette colours are close enough for readback noise to land between them', () => {
  const rgb = json('palette.json').colors.map((c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)));
  for (let i = 0; i < rgb.length; i++) {
    for (let j = i + 1; j < rgb.length; j++) {
      const apart = Math.max(...[0, 1, 2].map((k) => Math.abs(rgb[i][k] - rgb[j][k])));
      assert.ok(apart > 2 * COLOR_SLACK, `colours ${i + 1} and ${j + 1} are only ${apart} apart`);
    }
  }
});

test('a texture for every wall kind and floor, 32x32 each, side by side', () => {
  const t = json('textures.json');
  assert.equal(t.size, 32);
  const need = new Set([...FLOORS]);
  for (const k of Object.values(WALLS)) (need.add(k.ns), need.add(k.ew));
  for (const n of need) assert.ok(t.names.includes(n), `texture ${n}`);
  assert.deepEqual(pngSize('assets/textures.png'), [32 * t.names.length, 32]);
});

test('the sky is a wide panorama', () => {
  const [w, h] = pngSize('assets/sky.png');
  assert.ok(w >= 512 && h >= 64 && h <= 256, `${w}x${h}`);
});

test('every sprite, with every animation, inside sprites.png', () => {
  const { sprites } = json('sprites.json');
  const size = pngSize('assets/sprites.png');
  for (const [name, anims] of Object.entries(SPRITE_ANIMS)) {
    const s = sprites[name];
    assert.ok(s, `sprite ${name}`);
    assert.ok(s.height > 0 && s.count > 0, name);
    assert.ok(inside([s.x, s.y, s.w * s.count, s.h], size), `${name} fits in sprites.png`);
    for (const a of anims) {
      assert.ok(s.anims[a]?.length > 0, `${name}.${a}`);
      for (const f of s.anims[a]) assert.ok(f >= 0 && f < s.count, `${name}.${a} frame ${f}`);
    }
    if (['crawler', 'gaunt', 'leaper', 'mother'].includes(name)) {
      assert.equal(s.anims.walk.length, 4, `${name} walks in 4 frames`);
      assert.ok(s.stride > 0, `${name} has a stride`);
    }
  }
});

// Against the 1.0-unit walls (a doorway's height; a window's top sits at about 0.75): a crawler comes
// about knee-high, its back (4/5 up its frame) under the window sill; a gaunt's head (0.82 up its
// frame) stands a little above a man's, under the doorway's top; the Mother towers over the cabin.
test('creature sizes: a crawler about knee-high, a gaunt a little taller than you, the Mother towering', () => {
  const { sprites } = json('sprites.json');
  assert.ok(sprites.crawler.height <= 0.4, `crawler ${sprites.crawler.height}`);
  assert.ok(sprites.gaunt.height > 1 && sprites.gaunt.height <= 1.15, `gaunt ${sprites.gaunt.height}`);
  assert.ok(sprites.mother.height >= 2, `mother ${sprites.mother.height}`);
  const order = ['crawler', 'leaper', 'gaunt', 'mother'].map((k) => sprites[k].height);
  assert.deepEqual(order, [...order].sort((a, b) => a - b), 'crawler < leaper < gaunt < mother');
});

test('a shot sees each creature as tall as it is drawn', () => {
  const { sprites } = json('sprites.json');
  for (const k of KINDS) assert.equal(CREATURES[k].height, sprites[k].height, k);
});

// A hit's spray comes out of the body: above the legs, below the eyes.
test("a hit's spray comes from a creature's body, a third to three quarters of the way up it", () => {
  const { sprites } = json('sprites.json');
  KINDS.forEach((k, i) => {
    const up = SPRAY_Z[i] / sprites[k].height;
    assert.ok(up >= 0.35 && up <= 0.75, `${k}: spray at ${SPRAY_Z[i]} is ${up.toFixed(2)} of its ${sprites[k].height} height`);
  });
});

test('the ember and the new icons are the sizes the scene and the HUD expect', () => {
  const { sprites } = json('sprites.json');
  assert.deepEqual([sprites.ember.w, sprites.ember.h, sprites.ember.count, sprites.ember.height], [10, 6, 3, 0.12]);
  const { icons } = json('hud.json');
  for (const n of ['ember', 'crosshairSteady']) assert.deepEqual(icons[n].slice(2), [7, 7], n);
  for (const u of UPGRADE_LIST) assert.deepEqual(icons[`up-${u.key}`].slice(2), [12, 12], u.key);
});

test('the charm and its icons are the sizes the scene and the HUD expect', () => {
  const { sprites } = json('sprites.json');
  assert.deepEqual([sprites.charm.w, sprites.charm.h, sprites.charm.count, sprites.charm.height], [8, 9, 4, 0.14]);
  const { icons } = json('hud.json');
  for (const c of CHARM_LIST) assert.deepEqual(icons[`charm-${c.key}`].slice(2), [12, 12], c.key);
});

test("each charm's pendant: turned the same number of times, one hanging straight, each turn the same size", () => {
  const { icons } = json('hud.json');
  const turns = (key) => Object.keys(icons).filter((n) => n.startsWith(`hang-${key}-`)).length;
  const n = turns('wolf'), size = icons['hang-wolf-0'].slice(2);
  assert.ok(n >= 5 && n % 2 === 1, `${n} turns, the middle one hanging straight`);
  assert.equal(size[0] % 2, 1, 'an odd width, so the chain hangs from the middle column');
  for (const c of CHARM_LIST) {
    assert.equal(turns(c.key), n, c.key);
    for (let i = 0; i < n; i++) assert.deepEqual(icons[`hang-${c.key}-${i}`].slice(2), size, `${c.key} ${i}`);
  }
});

test('every gun frame says where a charm hangs from it, on the gun, below the crosshair', () => {
  const { frames, charms } = json('hands.json');
  const guns = HAND_FRAMES.filter((n) => n.startsWith('rifle') || n.startsWith('shotgun'));
  assert.deepEqual(Object.keys(charms).sort(), [...guns].sort());
  for (const n of guns) {
    const [x, y] = charms[n], f = frames[n];
    assert.ok(x >= f[4] && x < f[4] + f[2] && y >= f[5] && y < 0, `${n}: ${x}, ${y} is inside the frame`);
    assert.ok(y > -135 + 20 && x > 10, `${n}: clear of the crosshair`);
  }
});

test('every hands frame and HUD icon, inside their sheets', () => {
  const hands = json('hands.json').frames, hud = json('hud.json').icons;
  const hs = pngSize('assets/hands.png'), is = pngSize('assets/hud.png');
  for (const n of HAND_FRAMES) assert.ok(hands[n] && hands[n].length === 6 && inside(hands[n], hs), n);
  for (const n of HUD_ICONS) assert.ok(hud[n] && inside(hud[n], is), n);
});

test('the tab icon is 48x48', () => {
  assert.ok(existsSync(file('icon.png')));
  assert.deepEqual(pngSize('icon.png'), [48, 48]);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd last-light && node --test test/assets.test.js test/art.test.js`
Expected: FAIL: `unpackArt` doesn't pass `charms` on, `hands.json` has no `charms`, and `hud.json` has no `hang-` pieces.

- [ ] **Step 3: The loader (`last-light/src/assets.js`)**

`last-light/src/assets.js` (the full file now):
```js
// Loads the art that the scripts in art/last-light/ write to last-light/assets/, and unpacks the
// world's images (textures, sky, sprites) into palette indices for the renderer. The guns in your
// hands and the HUD icons stay as images, drawn with the canvas.
//
//   palette.json   { colors: ["#rrggbb", ...] (index 1 up), glow: [indices], names: { flake, ichor, spark, ui, uiDim, hurt, night } }
//   textures.json  { size: 32, names: [...] }, textures.png: the tiles side by side in that order
//   sky.png        the panorama; its bottom row sits on the horizon, and it wraps round
//   sprites.json   { sprites: { name: { x, y, w, h, count, height, stride?, ms?, anims: { anim: [frame...] } } } }
//                  (each frame unpacks to { w, h, px, mips }; see buildMips)
//                  sprites.png: each sprite's frames left to right from (x, y)
//   hands.json     { frames: { name: [x, y, w, h, ox, oy] }, charms: { gun frame name: [x, y] } }:
//                  (ox, oy) places the frame's top-left relative to the bottom centre of the view, and
//                  a gun frame's charm point, where the charm you wear hangs, is on the same terms
//   hud.json       { icons: { name: [x, y, w, h] } }
import { buildShades } from './shade.js';

export const FLOORS = new Set(['snow', 'planks', 'rafters']);
const JSON_FILES = ['palette', 'textures', 'sprites', 'hands', 'hud'];
const IMAGE_FILES = ['textures', 'sky', 'sprites', 'hands', 'hud'];

export async function loadJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.json();
}

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`couldn't load ${url}`));
    img.src = url;
  });
}

export function imagePixels(img) {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0);
  return { w: img.width, h: img.height, data: x.getImageData(0, 0, img.width, img.height).data };
}

// Some browsers add a little noise when a canvas is read back (Firefox's and Brave's fingerprinting
// guards), so a colour within this much of a palette colour in every channel is taken as that colour.
// The palette's closest two colours are 5 apart, so that's never ambiguous (art.test.js checks it).
export const COLOR_SLACK = 2;

// The palette index (1 up) of the colour within COLOR_SLACK of (r, g, b) in every channel, or 0.
function nearIndex(rgbs, r, g, b) {
  for (let k = 0; k < rgbs.length; k++) {
    const c = rgbs[k];
    if (Math.abs((c >> 16) - r) <= COLOR_SLACK && Math.abs(((c >> 8) & 255) - g) <= COLOR_SLACK && Math.abs((c & 255) - b) <= COLOR_SLACK) return k + 1;
  }
  return 0;
}

// RGBA pixels to palette indices (0 where transparent: alpha under half, which also absorbs noise).
// A colour not in the palette, even allowing for noise, is an art bug, and is reported with where it is.
export function indexPixels({ w, h, data }, colors, name) {
  const rgbs = colors.map((hex) => parseInt(hex.slice(1), 16));
  const lookup = new Map(rgbs.map((rgb, i) => [rgb, i + 1]));
  const out = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (data[i * 4 + 3] < 128) continue;
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    const rgb = (r << 16) | (g << 8) | b;
    const idx = lookup.get(rgb) ?? nearIndex(rgbs, r, g, b);
    if (idx === 0) {
      throw new Error(`${name}: the pixel at ${i % w},${Math.floor(i / w)} is #${rgb.toString(16).padStart(6, '0')}, which isn't in the palette`);
    }
    out[i] = idx;
  }
  return out;
}

// The w x h piece of an indexed image at (x, y), row by row, or column by column if `columns`.
export function cut(indexed, imgW, x, y, w, h, columns) {
  const out = new Uint8Array(w * h);
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) out[columns ? xx * h + yy : yy * w + xx] = indexed[(y + yy) * imgW + x + xx];
  }
  return out;
}

// Far off, a sprite is drawn smaller than its frame, and sampling one texel per pixel skips some: a
// 1-texel eye would blink out. So each sprite frame carries `mips`, for the renderer to sample from
// instead: the frame halved, then halved again (1/2, 1/4, 1/8, each side rounded up). In each 2x2
// block a glowing texel wins, so the eyes survive every halving; otherwise the block keeps its first
// opaque texel reading across then down (top-left, top-right, bottom-left, bottom-right), or stays
// clear. Frames are column-major (index x * h + y), like `cut(..., true)` makes them.
export const MIP_LEVELS = 3;

function halve(f, emissive) {
  const w = Math.ceil(f.w / 2), h = Math.ceil(f.h / 2), px = new Uint8Array(w * h);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let opaque = 0, glow = 0;
      for (let k = 0; k < 4 && glow === 0; k++) {
        const sx = 2 * x + (k & 1), sy = 2 * y + (k >> 1);
        if (sx >= f.w || sy >= f.h) continue;
        const v = f.px[sx * f.h + sy];
        if (emissive[v]) glow = v;
        else if (opaque === 0) opaque = v;
      }
      px[x * h + y] = glow || opaque;
    }
  }
  return { w, h, px };
}

export function buildMips(frame, emissive, levels = MIP_LEVELS) {
  const mips = [];
  for (let i = 0, f = frame; i < levels; i++) mips.push((f = halve(f, emissive)));
  return mips;
}

// json: { palette, textures, sprites, hands, hud }; images: { textures, sky, sprites, hands, hud };
// pixels(image) -> { w, h, data (RGBA) }.
export function unpackArt(json, images, pixels) {
  const { palette } = json;
  const shades = buildShades(palette.colors, new Set(palette.glow));
  const tex = pixels(images.textures);
  const texIdx = indexPixels(tex, palette.colors, 'textures.png');
  const size = json.textures.size;
  const walls = {}, floors = {};
  json.textures.names.forEach((name, i) => {
    const floor = FLOORS.has(name);
    (floor ? floors : walls)[name] = cut(texIdx, tex.w, i * size, 0, size, size, !floor);
  });
  const skyPx = pixels(images.sky);
  const sky = { w: skyPx.w, h: skyPx.h, px: indexPixels(skyPx, palette.colors, 'sky.png') };
  const spr = pixels(images.sprites);
  const sprIdx = indexPixels(spr, palette.colors, 'sprites.png');
  const sprites = {};
  for (const [name, s] of Object.entries(json.sprites.sprites)) {
    sprites[name] = {
      height: s.height, stride: s.stride, ms: s.ms, anims: s.anims,
      frames: Array.from({ length: s.count }, (_, i) => {
        const f = { w: s.w, h: s.h, px: cut(sprIdx, spr.w, s.x + i * s.w, s.y, s.w, s.h, true) };
        f.mips = buildMips(f, shades.emissive);
        return f;
      }),
    };
  }
  const color = (n) => palette.colors[palette.names[n] - 1];
  return {
    palette, shades, walls, floors, sky, sprites,
    flake: palette.names.flake,
    ichor: palette.names.ichor,
    spark: palette.names.spark,
    hands: { image: images.hands, frames: json.hands.frames, charms: json.hands.charms },
    hud: { image: images.hud, icons: json.hud.icons },
    ui: { text: color('ui'), dim: color('uiDim'), hurt: color('hurt'), night: color('night') },
  };
}

export async function loadArt(base = new URL('../assets/', import.meta.url), io = { json: loadJson, image: loadImage, pixels: imagePixels }) {
  const at = (f) => new URL(f, base).href;
  const jsons = await Promise.all(JSON_FILES.map((f) => io.json(at(`${f}.json`))));
  const imgs = await Promise.all(IMAGE_FILES.map((f) => io.image(at(`${f}.png`))));
  const json = Object.fromEntries(JSON_FILES.map((f, i) => [f, jsons[i]]));
  const images = Object.fromEntries(IMAGE_FILES.map((f, i) => [f, imgs[i]]));
  return unpackArt(json, images, io.pixels);
}
```

- [ ] **Step 4: Writing the charm points (edits to `art/last-light/lib.lua`)**

**Edit 1.** Find:
```lua
function M.writePieces(kind, pieces)
```
Replace with:
```lua
-- `charms` (the hands only): where the charm you wear hangs from each gun frame.
function M.writePieces(kind, pieces, charms)
```

**Edit 2.** Find:
```lua
  M.writeText(M.ASSETS .. kind .. ".json", json.encode(kind == "hands" and { frames = meta } or { icons = meta }))
```
Replace with:
```lua
  M.writeText(M.ASSETS .. kind .. ".json", json.encode(kind == "hands" and { frames = meta, charms = charms } or { icons = meta }))
```

- [ ] **Step 5: Each gun frame's charm point (edits to `art/last-light/hands.lua`)**

**Edit 1.** Find:
```lua
-- relative to the bottom centre of the view. Every frame reaches the bottom of the view, and nothing
```
Replace with:
```lua
-- relative to the bottom centre of the view. Each gun frame also has the point, on the same terms,
-- where the charm you wear hangs from it (hud.js swings the charm from there). Every frame reaches the bottom of the view, and nothing
```

**Edit 2.** Find:
```lua
local RIFLE_FWD = aimAt(RIFLE_AT, V(0, -0.024, 0.66), MUZZLE[1], MUZZLE[2])

```
Replace with:
```lua
local RIFLE_FWD = aimAt(RIFLE_AT, V(0, -0.024, 0.66), MUZZLE[1], MUZZLE[2])

-- Where a charm hangs from each gun: on the inner side (towards the middle of the view) of its fore-end,
-- clear of the receiver and your hand. The shotgun's swings down with its barrels when it's broken open.
local RIFLE_CHARM = V(-0.0165, 0.004, 0.24)
local SHOTGUN_CHARM = V(-0.0185, 0.002, 0.22)

```

**Edit 3.** Find:
```lua
-- rifle goes down out of the view to load (hud.js), and the rounds are heard going in.
```
Replace with:
```lua
-- rifle goes down out of the view to load (hud.js), and the rounds are heard going in. Returns the
-- frame, where the charm hangs, and where the muzzle is.
```

**Edit 4.** Find:
```lua
  return b, { project(place(g, V(0, -0.024, 0.66))) }
```
Replace with:
```lua
  return b, { project(place(g, RIFLE_CHARM)) }, { project(place(g, V(0, -0.024, 0.66))) }
```

**Edit 5.** Find:
```lua
-- shut), fire.
```
Replace with:
```lua
-- shut), fire. Returns the frame and where the charm hangs.
```

**Edit 6.** Find:
```lua
      flash(b, mx, my, (ex - mx) / d, (ey - my) / d, 1)
    end
  end
  return b
```
Replace with:
```lua
      flash(b, mx, my, (ex - mx) / d, (ey - my) / d, 1)
    end
  end
  return b, { project(place(bg, SHOTGUN_CHARM)) }
```

**Edit 7.** Find:
```lua
local idle, muzzle = rifle({})
```
Replace with:
```lua
-- A gun frame, cropped, noting where its charm hangs, relative to the bottom centre of the view.
local charms = {}
local function gun(name, b, at)
  charms[name] = { math.floor(at[1] + 0.5) - VW / 2, math.floor(at[2] + 0.5) - VH }
  return crop(b, name)
end

local idle, idleCharm, muzzle = rifle({})
```

**Edit 8.** Find:
```lua
  crop(idle, "rifle-idle"),
  crop(rifle({ fire = true }), "rifle-fire"),
  crop(rifle({ lever = 0.5, case = 0.25 }), "rifle-lever-1"),
  crop(rifle({ lever = 1, case = 0.8 }), "rifle-lever-2"),
  crop(shotgun({}), "shotgun-idle"),
  crop(shotgun({ fire = true }), "shotgun-fire"),
  crop(shotgun({ open = 1, lower = 0.02 }), "shotgun-reload-1"),
  crop(shotgun({ open = 1, lower = 0.02, shells = 1 }), "shotgun-reload-2"),
  crop(shotgun({ shells = 2, tip = -0.06, lower = -0.01 }), "shotgun-reload-3"),
```
Replace with:
```lua
  gun("rifle-idle", idle, idleCharm),
  gun("rifle-fire", rifle({ fire = true })),
  gun("rifle-lever-1", rifle({ lever = 0.5, case = 0.25 })),
  gun("rifle-lever-2", rifle({ lever = 1, case = 0.8 })),
  gun("shotgun-idle", shotgun({})),
  gun("shotgun-fire", shotgun({ fire = true })),
  gun("shotgun-reload-1", shotgun({ open = 1, lower = 0.02 })),
  gun("shotgun-reload-2", shotgun({ open = 1, lower = 0.02, shells = 1 })),
  gun("shotgun-reload-3", shotgun({ shells = 2, tip = -0.06, lower = -0.01 })),
```

**Edit 9.** Find:
```lua
L.writePieces("hands", pieces)
```
Replace with:
```lua
L.writePieces("hands", pieces, charms)
```

- [ ] **Step 6: The pendants (edits to `art/last-light/hud.lua`)**

**Edit 1.** Find:
```lua
-- fire's upgrades ("up-" and its key in last-light/src/upgrades.js), and one 12x12 icon for each charm
-- ("charm-" and its key in last-light/src/charms.js), in last-light/assets/hud.png with each icon's
-- place in hud.json. Run from the repo root:
```
Replace with:
```lua
-- fire's upgrades ("up-" and its key in last-light/src/upgrades.js), one 12x12 icon for each charm
-- ("charm-" and its key in last-light/src/charms.js), and each charm's pendant as it hangs from your gun
-- ("hang-", its key and a turn), in last-light/assets/hud.png with each icon's place in hud.json. Run
-- from the repo root:
```

**Edit 2.** Find:
```lua
L.writePieces("hud", {
```
Replace with:
```lua
local pieces = {
```

**Edit 3.** Find:
```lua
})
```
Replace with:
```lua
}

-- The charms as they hang from your gun: each a charm on a short chain, bigger than its icon and
-- outlined in the dark so it reads against the snow and the gun, lit from your lantern on the left.
-- A pendant is drawn turned to HANG_TURNS angles, evenly from -HANG_MOST to HANG_MOST radians
-- (positive swings it to the right), about the top of its chain, which sits HANG_PIVOT pixels from
-- the left of each piece (hud.js swings it by choosing the turn).
local HANG_TURNS, HANG_MOST, HANG_PIVOT = 11, 0.75, 22
local HANG_W, HANG_H = 2 * HANG_PIVOT + 1, 25
local CHAIN = { C.stone3, C.stone1, C.stone3, C.stone1, C.stone3 }
local PENDANTS = {
  { "wolf", {
    ".....BBB.....",
    "....BYBbB....",
    "....bBbbb....",
    "....PPPPp....",
    "....PPPPpq...",
    "....PPPPpq...",
    "....PPPPpq...",
    ".....PPPpq...",
    ".....PPPpq...",
    ".....PPPpq...",
    "......PPpq...",
    "......PPpq...",
    ".......Ppq...",
    "........pq...",
    "........q....",
  } },
  { "thread", {
    "......R......",
    "......R......",
    ".....RHR.....",
    "....RRHHR....",
    "...R.....R...",
    "..R.......R..",
    "..R.......R..",
    "..R.......R..",
    "...R.....R...",
    "....RR.RR....",
    ".....RHH.....",
    "....RH.HR....",
    "...RH...HR...",
    "...H.....H...",
  } },
  { "crow", {
    "......d......",
    "......d......",
    ".....ndK.....",
    "....nKdKK....",
    "....nKdKK....",
    "...nKKdKKK...",
    "...nKKdKKK...",
    "...nKKdKKK...",
    "...nKKdKKK...",
    "....nKdKK....",
    "....nKdKK....",
    ".....KdK.....",
    ".....KdK.....",
    "......K......",
  } },
  { "salt", {
    "......m......",
    ".....mmm.....",
    "....wwwww....",
    "....mmmmm....",
    ".....SSn.....",
    "....SSSSn....",
    "...SSSSSnn...",
    "..SSwSSSSnn..",
    "..SSSSSSSnn..",
    "..SSSSSSnnn..",
    "...SSSSnnn...",
    "....nnnnn....",
  } },
  { "hare", {
    ".....BBB.....",
    "....BYBbB....",
    "....m555m....",
    "....55555m...",
    "...555555m...",
    "...5555555m..",
    "...5555555m..",
    "...555555mm..",
    "...55555mmm..",
    "....555mmm...",
    "....55mmm....",
    "....P.P.P....",
  } },
  { "eye", {
    ".....kkk.....",
    ".....k.k.....",
    "....GGGGG....",
    "..GGGyyyGGG..",
    ".GGyyeeeyyGG.",
    ".GyyekkkeyyG.",
    ".GyyekkkeyyG.",
    ".GGyyeeeyyGG.",
    "..GGGyyyGGG..",
    "....GGGGG....",
  } },
}

-- A pendant upright: the chain, then the charm under it, outlined in the dark (the chain isn't).
local function pendant(rows)
  local body = L.buffer(#rows[1] + 2, #rows + 2)
  for y, row in ipairs(rows) do
    assert(#row == 13, "pendant row " .. y .. " is " .. #row .. " wide, not 13")
    for x = 1, #row do
      local ch = row:sub(x, x)
      if ch ~= "." then body[y][x] = assert(KEY[ch], "no colour for '" .. ch .. "'") end
    end
  end
  L.outline(body, C.void)
  local b = L.buffer(body.w, #CHAIN + body.h - 1)
  for y = 0, #CHAIN - 1 do b[y][7] = CHAIN[y + 1] end
  for y = 0, body.h - 1 do
    for x = 0, body.w - 1 do
      if body[y][x] then b[#CHAIN + y - 1][x] = body[y][x] end
    end
  end
  return b
end

-- The pendant `src` turned by angle a about the top of its chain, into a HANG_W x HANG_H piece. Each
-- pixel takes the colour most of its 4x4 samples land on, or none if fewer than 5 land on the pendant,
-- so thin lines (the chain, the thread) survive the turn.
local function turned(src, a)
  local b = L.buffer(HANG_W, HANG_H)
  local c, s = math.cos(a), math.sin(a)
  local cx = src.w / 2
  for y = 0, HANG_H - 1 do
    for x = 0, HANG_W - 1 do
      local count, order, hit = {}, {}, 0
      for j = 0, 3 do
        for i = 0, 3 do
          local dx, dy = x + (i + 0.5) / 4 - (HANG_PIVOT + 0.5), y + (j + 0.5) / 4
          local sx, sy = math.floor(dx * c - dy * s + cx), math.floor(dx * s + dy * c)
          local col = sy >= 0 and sy < src.h and sx >= 0 and sx < src.w and src[sy][sx] or nil
          if col then
            hit = hit + 1
            if not count[col] then
              count[col] = 0
              order[#order + 1] = col
            end
            count[col] = count[col] + 1
          end
        end
      end
      if hit >= 5 then
        local best = order[1]
        for _, col in ipairs(order) do if count[col] > count[best] then best = col end end
        b[y][x] = best
      end
    end
  end
  return b
end

local hangs = {}
for _, p in ipairs(PENDANTS) do
  local src = pendant(p[2])
  assert(src.h <= HANG_H, p[1] .. "'s pendant is too long")
  for i = 0, HANG_TURNS - 1 do
    hangs[#hangs + 1] = { "hang-" .. p[1] .. "-" .. i, turned(src, -HANG_MOST + 2 * HANG_MOST * i / (HANG_TURNS - 1)) }
  end
end
for _, h in ipairs(hangs) do pieces[#pieces + 1] = h end
L.writePieces("hud", pieces)
```

- [ ] **Step 7: Build the art, and check only the expected files changed**

Run the art loop from the repo root:
`for s in textures sky sprites hands hud icon; do /Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/last-light/$s.lua; done`

Then `git status --short` should list exactly `art/last-light/lib.lua`, `hands.lua`, `hud.lua`, `hud.aseprite`, `last-light/assets/hands.json`, `hud.json`, `hud.png`, `last-light/src/assets.js` and the two test files. `hands.png` and `hands.aseprite` don't change. Run the loop a second time: nothing more changes.

- [ ] **Step 8: Run the tests to see them pass**

Run: `cd last-light && npm test`
Expected: PASS, 255 tests.

- [ ] **Step 9: Commit**

```bash
git add art/last-light last-light/assets last-light/src/assets.js last-light/test
git commit -m "Last Light: where a charm hangs from each gun, and each charm's pendant"
```

## Task 4: Showing it: charms on the snow and on your gun, the Mother's eye, and the reading

**Files:**
- Modify, each as a full replacement:
  - `last-light/src/scene.js`, `render.js`, `hud.js`
  - `last-light/test/fake-art.js`, `scene.test.js`, `render.test.js`, `hud.test.js`, `art.test.js`
  - `last-light/bench.js`

**Interfaces:**
- **Consumes:** from Task 1, `lantern(state)`, `EYE`, `CHARM_LIST`, `CHARMS.light`, `CHARMS.flicker`, `state.charms`, `state.charm`, `state.charmAt`; from Task 2, the `charm` sprite and the `charm-*` icons; from Task 3, `art.hands.charms` and the `hang-*` pieces.
- **Produces:**
  - `scene.js`: `SPRITE_ANIMS.charm = ['idle']`; each sprite has `xray` (true only for after-eaters with the Mother's eye); `charmShine(state, c, t)` (0 to 1).
  - `render.js`: a sprite with `xray === true` draws its glowing pixels even where a nearer wall hides it, and nothing else there.
  - `hud.js`:
    - `HUD_ICONS` ends with the six `charm-` icons and every `hang-` piece;
    - `HANG_TURNS = 11`, `HANG_MOST = 0.75`, `HANG_PIVOT = 22`;
    - `createSwing()` → `{ angle, speed, facing, sway, kick, ready }`, and `swingCharm(swing, dt, facing, sway, kick)`;
    - `drawHud`'s `info` takes `swing`, `facing` and `dt` (all optional);
    - the reading under the hour; the charm you wear hanging from your gun.

- [ ] **Step 1: Write the failing tests**

`last-light/test/fake-art.js` (the full file now):
```js
// A complete, tiny art set in the shapes assets.js produces, for testing the scene and the HUD
// without the real PNGs.
import { buildShades } from '../src/shade.js';
import { TEX } from '../src/render.js';
import { HAND_FRAMES, HUD_ICONS } from '../src/hud.js';

const frame = (w, h, v = 1) => ({ w, h, px: new Uint8Array(w * h).fill(v) });
const sprite = (height, anims, count) => ({ height, stride: 0.35, ms: 120, anims, frames: Array.from({ length: count }, (_, i) => frame(4, 6, 1 + (i % 5))) });
const creature = (extra = {}, n = 15) => sprite(0.8, { walk: [0, 1, 2, 3], 'side-walk': [4, 5, 6, 7], attack: [8, 9], hurt: [10], die: [11, 12, 13, 14], ...extra }, n);

export const HANDS = HAND_FRAMES;
export const ICONS = HUD_ICONS;

export function fakeArt() {
  const flat = () => new Uint8Array(TEX * TEX).fill(2);
  return {
    shades: buildShades(['#ffffff', '#808080', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#402010']),
    walls: { trunks: flat(), logs: flat(), window: flat(), woodpile: flat(), wagonSide: flat(), wagonEnd: flat() },
    floors: { snow: flat(), planks: flat(), rafters: flat() },
    sky: { w: 16, h: 8, px: new Uint8Array(128).fill(1) },
    flake: 1,
    ichor: 7,
    spark: 6,
    sprites: {
      crawler: creature(),
      gaunt: creature({ windup: [15] }, 16),
      leaper: creature({ crouch: [15], leap: [16], 'side-leap': [17] }, 18),
      mother: creature({ windup: [15] }, 16),
      stove: sprite(0.6, { idle: [0, 1] }, 2),
      well: sprite(0.5, { idle: [0] }, 1),
      pine: sprite(2.5, { idle: [0] }, 1),
      flare: sprite(0.2, { idle: [0, 1, 2] }, 3),
      ember: sprite(0.12, { idle: [0, 1, 2] }, 3),
      charm: sprite(0.14, { idle: [0, 1, 2, 3, 3, 3] }, 4),
      'pickup-flare': sprite(0.2, { idle: [0] }, 1),
      'pickup-shells': sprite(0.2, { idle: [0] }, 1),
      'pickup-shotgun': sprite(0.2, { idle: [0] }, 1),
    },
    hands: {
      image: { name: 'hands' },
      frames: Object.fromEntries(HANDS.map((n, i) => [n, [i * 10, 0, 10, 10, -5, -10]])),
      charms: Object.fromEntries(HANDS.filter((n) => n.startsWith('rifle') || n.startsWith('shotgun')).map((n) => [n, [30, -40]])),
    },
    hud: { image: { name: 'hud' }, icons: Object.fromEntries(ICONS.map((n, i) => [n, [i * 8, 0, 6, 8]])) },
    ui: { text: '#eeeeee', dim: '#888888', hurt: '#aa0000', night: '#05070c' },
  };
}

// A stand-in 2D context that records what's drawn.
export function fakeContext() {
  const calls = { images: [], texts: [], rects: [] };
  return {
    calls,
    globalAlpha: 1, fillStyle: '', font: '', textAlign: 'left', textBaseline: 'top',
    drawImage(img, ...args) {
      calls.images.push({ img, args });
    },
    fillText(str, x, y) {
      calls.texts.push({ str, x, y, color: this.fillStyle });
    },
    fillRect(x, y, w, h) {
      calls.rects.push({ x, y, w, h, color: this.fillStyle, alpha: this.globalAlpha });
    },
  };
}
```

`last-light/test/scene.test.js` (the full file now):
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScene, buildFrame, creatureFrame, sceneEvents, charmShine } from '../src/scene.js';
import { spawnCreature, igniteCreature, CRAWLER, LEAPER, GAUNT } from '../src/creatures.js';
import { dropEmber } from '../src/embers.js';
import { createLightmap, lightAt } from '../src/lightmap.js';
import { emit } from '../src/events.js';
import { LIGHT, EMBERS, CHARMS } from '../src/tuning.js';
import { wearCharm, WOLF, EYE, SALT } from '../src/charms.js';
import { fakeArt } from './fake-art.js';
import { quietState } from './helpers.js';

const view = (over = {}) => ({ facing: Math.PI / 2, alpha: 1, time: 0, dt: 1 / 60, reducedMotion: false, h: 270, focal: 240, ...over });

test('the camera blends between the last two updates', () => {
  const art = fakeArt();
  const scene = createScene(art);
  const s = quietState();
  s.player.px = 10;
  s.player.x = 11;
  const f = buildFrame(scene, s, createLightmap(s.map), view({ alpha: 0.25 }));
  assert.equal(f.x, 10.25);
});

test('the view looks up and down with the mouse, at once', () => {
  const art = fakeArt();
  const scene = createScene(art);
  const s = quietState();
  assert.equal(buildFrame(scene, s, createLightmap(s.map), view()).pitch, 0);
  assert.equal(buildFrame(scene, s, createLightmap(s.map), view({ pitch: -0.3 })).pitch, -0.3);
});

test('every creature, prop, active pickup and burning flare becomes a sprite', () => {
  const art = fakeArt();
  const scene = createScene(art);
  const s = quietState();
  spawnCreature(s, CRAWLER, 19.5, 25.5);
  spawnCreature(s, GAUNT, 21.5, 25.5);
  s.pickups[0].active = true;
  s.flares[0].t = 5;
  const f = buildFrame(scene, s, createLightmap(s.map), view());
  assert.equal(f.spriteCount, 2 + s.map.props.length + 1 + 1);
});

test('a creature walking across your view shows its side, flipped by direction; towards you, its front', () => {
  const art = fakeArt();
  const s = quietState();
  const c = spawnCreature(s, CRAWLER, 19.5, 25.5);
  const out = { frame: null, flip: false };
  const rx = -1, ry = 0; // camera facing south: its right is west
  c.heading = -Math.PI / 2; // straight at you
  creatureFrame(art, c, 19.5, 20.5, rx, ry, out);
  assert.ok(art.sprites.crawler.anims.walk.map((i) => art.sprites.crawler.frames[i]).includes(out.frame));
  c.heading = 0; // east: to your left
  creatureFrame(art, c, 19.5, 20.5, rx, ry, out);
  assert.ok(art.sprites.crawler.anims['side-walk'].map((i) => art.sprites.crawler.frames[i]).includes(out.frame));
  const eastFlip = out.flip;
  c.heading = Math.PI;
  creatureFrame(art, c, 19.5, 20.5, rx, ry, out);
  assert.notEqual(out.flip, eastFlip);
});

test('crouching and leaping leapers, winding-up gaunts, and the dying show those frames', () => {
  const art = fakeArt();
  const s = quietState();
  const out = { frame: null, flip: false };
  const l = spawnCreature(s, LEAPER, 19.5, 25.5);
  l.mode = 'crouch';
  creatureFrame(art, l, 19.5, 20.5, -1, 0, out);
  assert.equal(out.frame, art.sprites.leaper.frames[art.sprites.leaper.anims.crouch[0]]);
  const g = spawnCreature(s, GAUNT, 19.5, 25.5);
  g.mode = 'windup';
  creatureFrame(art, g, 19.5, 20.5, -1, 0, out);
  assert.equal(out.frame, art.sprites.gaunt.frames[art.sprites.gaunt.anims.windup[0]]);
  g.dying = 0.01;
  creatureFrame(art, g, 19.5, 20.5, -1, 0, out);
  const die = art.sprites.gaunt.anims.die;
  assert.equal(out.frame, art.sprites.gaunt.frames[die[die.length - 1]]);
});

test('eyes fade out with distance', () => {
  const art = fakeArt();
  const scene = createScene(art);
  const s = quietState();
  spawnCreature(s, CRAWLER, 19.5, 22.5);
  spawnCreature(s, CRAWLER, 19.5, 20.5 + LIGHT.eyes.dark + 1);
  const f = buildFrame(scene, s, createLightmap(s.map), view());
  const glows = f.sprites.slice(0, 2).map((x) => x.glow);
  assert.deepEqual(glows, [15, 0]);
});

test('the lantern lights where you stand, and the muzzle flash adds to it', () => {
  const art = fakeArt();
  const scene = createScene(art);
  const s = quietState();
  const lm = createLightmap(s.map);
  buildFrame(scene, s, lm, view());
  const plain = lightAt(lm, s.player.x, s.player.y);
  assert.ok(plain > 0.9 * LIGHT.lantern.intensity, 'the lantern at full where you stand, less its flicker');
  s.flash = 0.04;
  buildFrame(scene, s, lm, view());
  assert.ok(lightAt(lm, s.player.x, s.player.y) > plain + 0.5);
});

test('reduced motion: no head bob, no shake', () => {
  const art = fakeArt();
  const scene = createScene(art);
  const s = quietState();
  s.player.vx = 3;
  s.player.walked = 0.2;
  s.shake = 0.1;
  let f = buildFrame(scene, s, createLightmap(s.map), view({ reducedMotion: true, time: 1.3 }));
  assert.equal(f.bob, 0);
  assert.deepEqual([scene.shakeX, scene.shakeY], [0, 0]);
  f = buildFrame(scene, s, createLightmap(s.map), view({ time: 1.3 }));
  assert.notEqual(f.bob, 0);
});

test('a hit throws a spray of droplets that fall to the snow', () => {
  const art = fakeArt();
  const scene = createScene(art);
  const s = quietState();
  s.eventCount = 0;
  emit(s, 'hit', 19.5, 25.5, 1, 1);
  sceneEvents(scene, s);
  const live = scene.fx.drops.filter((d) => d.t > 0);
  assert.equal(live.length, 14);
  for (let i = 0; i < 10; i++) buildFrame(scene, s, createLightmap(s.map), view());
  assert.ok(live.every((d) => d.y > 25.5), 'thrown away from you');
  for (let i = 0; i < 60; i++) buildFrame(scene, s, createLightmap(s.map), view());
  assert.ok(live.every((d) => d.t > 0 && d.z === 0), 'landed, and still lying there');
  for (let i = 0; i < 30; i++) buildFrame(scene, s, createLightmap(s.map), view());
  assert.ok(live.every((d) => d.t <= 0), 'gone');
});

test('an ember on the snow is a glowing sprite, bigger for more value, that lights the ground; cooling, it dims', () => {
  const art = fakeArt();
  const scene = createScene(art);
  const s = quietState();
  const lm = createLightmap(s.map);
  buildFrame(scene, s, lm, view());
  const dark = lightAt(lm, 30.5, 26.5);
  const e = dropEmber(s, 30.5, 26.5, 3);
  let f = buildFrame(scene, s, lm, view());
  const sprite = f.sprites.slice(0, f.spriteCount).find((x) => x.x === 30.5 && x.y === 26.5);
  assert.ok(art.sprites.ember.frames.includes(sprite.frame));
  assert.equal(sprite.glow, 15);
  assert.ok(Math.abs(sprite.height - art.sprites.ember.height * 1.5) < 1e-9, 'a 3-ember is half as big again');
  assert.ok(lightAt(lm, 30.5, 26.5) > dark + 0.2, 'it lights the snow');
  // Crow's feather makes a gaunt's ember worth 4: bigger still.
  dropEmber(s, 31.25, 26.5, 4);
  const big = buildFrame(scene, s, lm, view()).sprites.find((x) => x.x === 31.25);
  assert.ok(big.height > art.sprites.ember.height * 1.5 && big.height < art.sprites.ember.height * 2, `${big.height}`);
  e.t = EMBERS.flicker * 0.2;
  let dimmest = 15;
  for (let i = 0; i < 20; i++) {
    f = buildFrame(scene, s, lm, view({ time: i * 0.037 }));
    dimmest = Math.min(dimmest, f.sprites.slice(0, f.spriteCount).find((x) => x.x === 30.5).glow);
  }
  assert.ok(dimmest < 8, `cooling, it dims and flickers: ${dimmest}`);
  e.t = 0;
  f = buildFrame(scene, s, lm, view());
  assert.ok(!f.sprites.slice(0, f.spriteCount).some((x) => x.x === 30.5), 'gone once it goes out');
});

test('Wide wick: the lantern lights further', () => {
  const art = fakeArt();
  const scene = createScene(art);
  const s = quietState();
  const lm = createLightmap(s.map);
  buildFrame(scene, s, lm, view());
  const before = lightAt(lm, s.player.x, s.player.y + 4);
  s.perks.wick = true;
  buildFrame(scene, s, lm, view());
  assert.ok(lightAt(lm, s.player.x, s.player.y + 4) > before + 0.1);
});

test('a burning creature is lit by its fire, and throws sparks', () => {
  const art = fakeArt();
  const scene = createScene(art);
  const s = quietState();
  const lm = createLightmap(s.map);
  const c = spawnCreature(s, GAUNT, 30.5, 26.5);
  buildFrame(scene, s, lm, view());
  const dark = lightAt(lm, 30.5, 26.5);
  igniteCreature(s, c);
  for (let i = 0; i < 10; i++) buildFrame(scene, s, lm, view({ dt: 1 / 60 }));
  assert.ok(lightAt(lm, 30.5, 26.5) > dark + 0.2);
  const f = buildFrame(scene, s, lm, view({ dt: 1 / 60 }));
  const rising = f.sparks.filter((p) => p.t > 0);
  assert.ok(rising.length >= 2, `${rising.length} sparks`);
  assert.ok(rising.every((p) => Math.abs(p.x - 30.5) < 0.5 && p.z > 0));
});

test('a charm on the snow glints: a sprite that lights a little snow, flickering in the lull\'s last seconds', () => {
  const art = fakeArt();
  const scene = createScene(art);
  const s = quietState();
  const lm = createLightmap(s.map);
  buildFrame(scene, s, lm, view());
  const dark = lightAt(lm, 30.5, 26.5);
  Object.assign(s.charms[0], { id: SALT, x: 30.5, y: 26.5, until: 1 });
  let f = buildFrame(scene, s, lm, view());
  const sprite = f.sprites.slice(0, f.spriteCount).find((x) => x.x === 30.5 && x.y === 26.5);
  assert.ok(art.sprites.charm.frames.includes(sprite.frame));
  assert.equal(sprite.glow, 15);
  assert.ok(sprite.lift > 0, 'it hovers');
  assert.ok(lightAt(lm, 30.5, 26.5) > dark + 0.1, 'it lights the snow');
  s.night.phase = 'lull';
  s.night.t = CHARMS.flicker + 1;
  assert.equal(charmShine(s, s.charms[0], 0.1), 1);
  s.night.t = CHARMS.flicker - 1;
  const shines = new Set();
  for (let i = 0; i < 20; i++) shines.add(charmShine(s, s.charms[0], i * 0.037));
  assert.ok(shines.has(1) && [...shines].some((v) => v < 1), 'it flickers before the wave takes it');
  s.charms[0].id = -1;
  f = buildFrame(scene, s, lm, view());
  assert.ok(!f.sprites.slice(0, f.spriteCount).some((x) => x.x === 30.5), 'gone once it is taken');
});

test("the charm you wear sets the lantern's reach: Wolf's tooth shrinks it, and the Mother's eye all but puts it out", () => {
  const art = fakeArt();
  const scene = createScene(art);
  const reach = (charm) => {
    const s = quietState();
    if (charm >= 0) wearCharm(s, charm);
    const lm = createLightmap(s.map);
    buildFrame(scene, s, lm, view());
    return lightAt(lm, s.player.x, s.player.y + 3);
  };
  const plain = reach(-1), wolf = reach(WOLF), eye = reach(EYE);
  assert.ok(wolf < plain - 0.1, `${wolf} vs ${plain}`);
  assert.ok(eye < wolf, `${eye} vs ${wolf}`);
});

test("the Mother's eye: every creature's eyes glow at full strength at any distance, marked to show through walls", () => {
  const art = fakeArt();
  const scene = createScene(art);
  const s = quietState();
  spawnCreature(s, CRAWLER, 19.5, 22.5);
  spawnCreature(s, CRAWLER, 19.5, 20.5 + LIGHT.eyes.dark + 1);
  s.pickups[0].active = true;
  let f = buildFrame(scene, s, createLightmap(s.map), view());
  assert.deepEqual(f.sprites.slice(0, 2).map((x) => [x.glow, x.xray]), [[15, false], [0, false]]);
  wearCharm(s, EYE);
  f = buildFrame(scene, s, createLightmap(s.map), view());
  assert.deepEqual(f.sprites.slice(0, 2).map((x) => [x.glow, x.xray]), [[15, true], [15, true]]);
  assert.ok(f.sprites.slice(2, f.spriteCount).every((x) => !x.xray), 'only the after-eaters');
});
```

`last-light/test/render.test.js` (the full file now):
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRenderer } from '../src/render.js';
import { chooseView } from '../src/view.js';
import { parseMap } from '../src/map.js';
import { createLightmap, beginLight, addLight, lightAt } from '../src/lightmap.js';
import { BAYER } from '../src/shade.js';
import { room } from './helpers.js';
import { testArt, drawnAt, IDX } from './render-helpers.js';
import { buildMips } from '../src/assets.js';
import { VIEW } from '../src/tuning.js';

const view = chooseView(480, 270, 1);

function setup(map, ambient = 1) {
  const art = testArt();
  const r = createRenderer(art, map);
  r.resize(view);
  const lm = createLightmap(map);
  beginLight(lm, ambient);
  const frame = (over) => ({ x: 6.5, y: 5.5, facing: 0, bob: 0, map, lightmap: lm, skyLevel: 15, time: 0, sprites: [], spriteCount: 0, snow: false, ...over });
  return { art, r, lm, frame };
}

test('facing a wall 4.5 cells away: wall at the horizon, sky above it, snow below', () => {
  const { art, r, frame } = setup(room());
  r.draw(frame());
  const { w, h, focal } = view;
  const at = (x, y) => drawnAt(art, r.buffer, w, x, y);
  const x = w / 2;
  const half = focal / 4.5 / 2;
  assert.equal(at(x, h / 2), IDX.trunks);
  assert.equal(at(x, Math.floor(h / 2 - half) - 2), IDX.sky);
  assert.equal(at(x, Math.ceil(h / 2 + half) + 2), IDX.snow);
  assert.equal(at(x, Math.floor(h / 2 - half) + 2), IDX.trunks);
});

test('looking up lowers the horizon by tan(pitch) x focal and looking down raises it; walls stay upright', () => {
  const { art, r, frame } = setup(room());
  const { w, h, focal } = view;
  const at = (x, y) => drawnAt(art, r.buffer, w, x, y);
  const half = focal / 4.5 / 2;
  for (const pitch of [0.3, -0.3]) {
    r.draw(frame({ pitch }));
    const mid = Math.round(h / 2 + Math.tan(pitch) * focal);
    for (const x of [2, w / 2, w - 3]) assert.equal(at(x, mid), IDX.trunks, `the horizon, across the view: pitch ${pitch}, x ${x}`);
    assert.equal(at(w / 2, Math.floor(mid - half) - 2), IDX.sky);
    assert.equal(at(w / 2, Math.floor(mid - half) + 2), IDX.trunks);
    assert.equal(at(w / 2, Math.ceil(mid + half) + 2), IDX.snow);
  }
});

test('looking as far up as you can, the sky fills the top of the view, past the top of the panorama', () => {
  const { art, r, frame } = setup(room());
  r.draw(frame({ pitch: VIEW.maxPitch }));
  for (let y = 0; y < 10; y++) assert.equal(drawnAt(art, r.buffer, view.w, view.w / 2, y), IDX.sky);
});

test('a sprite in front of the wall is drawn; one behind the wall is hidden', () => {
  const { art, r, frame } = setup(room());
  const body = { w: 2, h: 2, px: new Uint8Array(4).fill(IDX.body) };
  r.draw(frame({ sprites: [{ x: 8.5, y: 5.5, height: 0.8, frame: body }], spriteCount: 1 }));
  assert.equal(drawnAt(art, r.buffer, view.w, view.w / 2, view.h / 2 + 10), IDX.body);
  r.draw(frame({ sprites: [{ x: 12.5, y: 5.5, height: 0.8, frame: body }], spriteCount: 1 }));
  assert.equal(drawnAt(art, r.buffer, view.w, view.w / 2, view.h / 2 + 5), IDX.trunks);
});

test('glowing eyes show in the dark, and fade with the sprite glow level', () => {
  const { art, r, frame } = setup(room(), 0);
  const eyes = { w: 1, h: 1, px: new Uint8Array([IDX.eye]) };
  r.draw(frame({ sprites: [{ x: 8.5, y: 5.5, height: 0.5, frame: eyes, glow: 15 }], spriteCount: 1 }));
  const px = r.buffer[(view.h / 2 + 20) * view.w + view.w / 2];
  assert.equal(px, art.shades.table[(15 << 8) | IDX.eye]);
  r.draw(frame({ sprites: [{ x: 8.5, y: 5.5, height: 0.5, frame: eyes, glow: 4 }], spriteCount: 1 }));
  assert.equal(r.buffer[(view.h / 2 + 20) * view.w + view.w / 2], art.shades.fade[(4 << 8) | IDX.eye]);
});

// A 36x36 body with one eye, a single texel, as a creature's are; column-major, like sprite frames.
function oneEyed(art) {
  const f = { w: 36, h: 36, px: new Uint8Array(36 * 36) };
  for (let i = 0; i < f.px.length; i++) f.px[i] = i % 5 === 0 ? 0 : IDX.body;
  f.px[17 * 36 + 11] = IDX.eye;
  return { plain: f, mipped: { ...f, mips: buildMips(f, art.shades.emissive) } };
}
const glowPixels = (art, buf) => {
  const eye = art.shades.table[(15 << 8) | IDX.eye];
  let n = 0;
  for (let i = 0; i < buf.length; i++) if (buf[i] === eye) n++;
  return n;
};

test('far off, a 1-texel eye never blinks out: drawn at 1/3 to 1/6 of its size, every distance shows it', () => {
  const { art, r, frame } = setup(room(), 0);
  const { mipped } = oneEyed(art);
  const lost = [];
  // Height 0.1 is 24 px at 1 cell: 12 px (1/3 of the frame) at 2 cells, 6 px (1/6) at 4.
  for (let d = 2; d <= 4.0001; d += 0.02) {
    r.draw(frame({ sprites: [{ x: 6.5 + d, y: 5.5, height: 0.1, frame: mipped }], spriteCount: 1 }));
    if (glowPixels(art, r.buffer) === 0) lost.push(d.toFixed(2));
  }
  assert.deepEqual(lost, [], `no eye at ${lost.length} distances`);
});

test('drawn at full size or bigger, a sprite with mips looks exactly as it does without', () => {
  const { art, r, frame } = setup(room(), 0.6);
  const { plain, mipped } = oneEyed(art);
  for (const d of [1.5, 2.5, 3.3]) { // height 0.5: 80, 48 and 36.4 px for the 36-texel frame
    r.draw(frame({ sprites: [{ x: 6.5 + d, y: 5.5, height: 0.5, frame: plain, flip: d > 2 }], spriteCount: 1 }));
    const before = Uint32Array.from(r.buffer);
    r.draw(frame({ sprites: [{ x: 6.5 + d, y: 5.5, height: 0.5, frame: mipped, flip: d > 2 }], spriteCount: 1 }));
    assert.deepEqual(r.buffer, before, `at ${d} cells`);
  }
});

test('a light brightens the snow near it', () => {
  const { r, lm, frame } = setup(room(), 0);
  const y = view.h - 3, x = view.w / 2;
  r.draw(frame());
  const dark = r.buffer[y * view.w + x];
  addLight(lm, 6.5, 5.5, 3, 7, 1);
  r.draw(frame());
  assert.notEqual(r.buffer[y * view.w + x], dark);
});

// Every snow, floorboard and rafter pixel against the lightmap at the point of the ground or roof it
// shows: looking down outside and up inside with a light close by, and level with a light 10 cells
// off (where the renderer reads the light least often). Its shade is within a level of lightAt's.
test('the snow, the floorboards and the rafters are lit from the lightmap, pixel by pixel', () => {
  const map = parseMap();
  const { art, r, lm, frame } = setup(map, 0.05);
  const { w, h, focal, plane } = view;
  // Colours two surfaces can both be drawn in (black, in the dark) say nothing about the light.
  const drawnBy = new Map();
  for (const i of Object.values(IDX)) for (let l = 0; l < 16; l++) {
    const v = art.shades.table[(l << 8) | i];
    drawnBy.set(v, drawnBy.has(v) && drawnBy.get(v) !== i ? -1 : i);
  }
  for (const [x0, y0, facing, pitch, lx, ly, kinds] of [
    [19.5, 22.5, Math.PI / 2, -0.35, 20.2, 22.9, [IDX.snow]],
    [19.5, 16.5, 0, 0.35, 20.2, 16.9, [IDX.rafters, IDX.planks]],
    [19.5, 22.5, Math.PI / 2, 0, 19.9, 32.5, [IDX.snow]],
  ]) {
    beginLight(lm, 0.2); // never darker than level 3: levels 0 and 1 are the same fog for everything
    addLight(lm, lx, ly, 0.3, 2, 1); // steep: 2 shade levels a lightmap cell
    r.draw(frame({ x: x0, y: y0, facing, pitch }));
    const hz = Math.round(h / 2 + Math.tan(pitch) * focal);
    const dx = Math.cos(facing), dy = Math.sin(facing);
    let seen = 0, worst = 0, lo = 15, hi = 0;
    for (let y = 0; y < h; y++) {
      if (y === hz) continue;
      const rowDist = (0.5 * focal) / Math.abs(y + 0.5 - hz);
      for (let x = 0; x < w; x += 2) {
        const v = r.buffer[y * w + x], idx = drawnBy.get(v);
        if (!kinds.includes(idx)) continue;
        const cam = (2 * x) / w - 1 + 1 / w;
        const wx = x0 + rowDist * (dx - dy * plane * cam), wy = y0 + rowDist * (dy + dx * plane * cam);
        const want = Math.min(15, Math.floor(lightAt(lm, wx, wy) * 15 + BAYER[((y & 3) << 2) | (x & 3)]));
        let off = 16;
        for (let l = 0; l < 16; l++) if (art.shades.table[(l << 8) | idx] === v) off = Math.min(off, Math.abs(l - want));
        worst = Math.max(worst, off);
        lo = Math.min(lo, want);
        hi = Math.max(hi, want);
        seen++;
      }
    }
    assert.ok(seen > 1000, `${seen} pixels`);
    assert.ok(hi - lo >= 8, `the light should vary across the view: ${lo} to ${hi}`);
    assert.ok(worst <= 1, `a pixel ${worst} levels off (pitch ${pitch})`);
  }
});

test('inside the cabin you see rafters overhead, not sky', () => {
  const map = parseMap();
  const { art, r, frame } = setup(map);
  r.draw(frame({ x: 19.5, y: 16.5, facing: Math.PI / 2 }));
  assert.equal(drawnAt(art, r.buffer, view.w, view.w / 2, 0), IDX.rafters);
  assert.equal(drawnAt(art, r.buffer, view.w, view.w / 2, view.h - 1), IDX.planks);
  r.draw(frame({ x: 19.5, y: 16.5, facing: Math.PI / 2, pitch: VIEW.maxPitch }));
  assert.equal(drawnAt(art, r.buffer, view.w, view.w / 2, view.h / 2 + 5), IDX.rafters, 'looking up, the rafters come down the view');
});

test('falling snow shows outside, never under the roof', () => {
  const map = parseMap();
  const { art, r, frame } = setup(map);
  const count = () => {
    let n = 0;
    for (let y = 0; y < view.h; y++) for (let x = 0; x < view.w; x++) if (drawnAt(art, r.buffer, view.w, x, y) === IDX.flake) n++;
    return n;
  };
  r.draw(frame({ x: 19.5, y: 25.5, facing: Math.PI / 2, snow: true, time: 3 }));
  assert.ok(count() > 20, 'flakes outside');
  r.draw(frame({ x: 19.5, y: 16.5, facing: Math.PI, snow: true, time: 3 }));
  assert.equal(count(), 0, 'none indoors, looking at the wall');
});

test('looking up outside, snow falls from the top of the view, not from partway up the sky', () => {
  const map = parseMap();
  const { art, r, frame } = setup(map);
  const bands = [0, 0, 0]; // flakes in the top, middle and bottom thirds, over ten moments
  for (let t = 0; t < 10; t++) {
    r.draw(frame({ x: 19.5, y: 25.5, facing: Math.PI / 2, pitch: VIEW.maxPitch, snow: true, time: t }));
    for (let y = 0; y < view.h; y++) for (let x = 0; x < view.w; x++) if (drawnAt(art, r.buffer, view.w, x, y) === IDX.flake) bands[Math.floor((3 * y) / view.h)]++;
  }
  assert.ok(bands[0] > bands[2] / 4, `top ${bands[0]}, middle ${bands[1]}, bottom ${bands[2]}`);
});

test("an xray sprite behind a wall shows its glowing pixels through it, and only those (the Mother's eye)", () => {
  const { art, r, frame } = setup(room(), 0.5);
  // A sprite two texels tall, column-major: a glowing eye over a body.
  const f = { w: 1, h: 2, px: new Uint8Array([IDX.eye, IDX.body]) };
  const column = () => Array.from({ length: view.h }, (_, y) => r.buffer[y * view.w + view.w / 2]);
  const eye = art.shades.fade[(15 << 8) | IDX.eye];
  const behind = (xray) => ({ sprites: [{ x: 12.5, y: 5.5, height: 0.8, frame: f, glow: 15, xray }], spriteCount: 1 });
  r.draw(frame(behind(false)));
  assert.ok(!column().includes(eye), 'hidden behind the wall');
  r.draw(frame(behind(true)));
  const col = column();
  assert.ok(col.includes(eye), 'the eye shows through');
  const body = new Set([15, 7, 8].map((l) => art.shades.table[(l << 8) | IDX.body]));
  assert.ok(!col.some((v) => body.has(v)), 'the body stays hidden');
});
```

`last-light/test/hud.test.js` (the full file now):
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gunFrame, handFrame, drawHud, drawScreen, createSwing, swingCharm, HANG_TURNS, HANG_PIVOT } from '../src/hud.js';
import { createGun, giveShotgun, RIFLE_ID, SHOTGUN_ID } from '../src/weapons.js';
import { SWITCH_TIME, RIFLE, FLARE } from '../src/tuning.js';
import { fakeArt, fakeContext, HANDS } from './fake-art.js';
import { quietState } from './helpers.js';
import { UPGRADE_LIST } from '../src/upgrades.js';
import { CHARM_LIST, wearCharm, WOLF, SALT } from '../src/charms.js';

test('the rifle: flash, idle, the lever working, reloading', () => {
  const g = createGun();
  g.shotT = 0.03;
  assert.equal(gunFrame(g).name, 'rifle-fire');
  g.shotT = 0.25;
  assert.equal(gunFrame(g).name, 'rifle-lever-1');
  g.shotT = 0.35;
  assert.equal(gunFrame(g).name, 'rifle-lever-2');
  g.shotT = 5;
  assert.equal(gunFrame(g).name, 'rifle-idle');
});

test('loading the rifle, it goes down out of sight, and comes back up when it is done', () => {
  const g = createGun();
  g.shotT = 5;
  g.reloading = true;
  g.reloadT = RIFLE.reloadPerRound;
  const drops = [0, 0.05, 0.1, 0.2, 1].map((t) => {
    g.loadT = t;
    const f = gunFrame(g);
    assert.equal(f.name, 'rifle-idle');
    return f.drop;
  });
  assert.equal(drops[0], 0, 'it starts from where you hold it');
  assert.ok(drops[1] > 0 && drops[1] < drops[2], `and goes down smoothly: ${drops}`);
  assert.deepEqual(drops.slice(3), [2, 2], 'out of sight (a switch only lowers it to 1) until the loading is done');
  g.reloading = false;
  const up = [0, 0.05, 0.1, 0.2].map((t) => {
    g.loadT = t;
    return gunFrame(g).drop;
  });
  assert.equal(up[0], 2);
  assert.ok(up[1] < 2 && up[2] < up[1], `then comes back up: ${up}`);
  assert.equal(up[3], 0);
});

test('an empty rifle that starts loading by itself works the lever first, then goes down', () => {
  const g = createGun();
  g.reloading = true;
  g.reloadT = RIFLE.reloadPerRound / 2;
  g.loadT = g.shotT = RIFLE.interval - 0.1; // the loading started with the last shot
  assert.deepEqual([gunFrame(g).name, gunFrame(g).drop], ['rifle-lever-2', 0]);
  g.loadT = g.shotT = RIFLE.interval + 0.01;
  const f = gunFrame(g);
  assert.ok(f.drop > 0 && f.drop < 0.5, `only just going down: ${f.drop}`);
});

test('switching lowers one gun and raises the other', () => {
  const g = createGun();
  g.shotT = 5;
  g.next = SHOTGUN_ID;
  g.switching = SWITCH_TIME * 0.75;
  let f = gunFrame(g);
  assert.equal(f.name, 'rifle-idle');
  assert.ok(f.drop > 0.4 && f.drop < 0.6);
  g.switching = SWITCH_TIME * 0.25;
  f = gunFrame(g);
  assert.equal(f.name, 'shotgun-idle');
  assert.ok(f.drop > 0.4 && f.drop < 0.6);
});

test('every frame name the HUD can ask for exists in the hands art', () => {
  const g = createGun();
  const names = new Set();
  for (const current of [RIFLE_ID, SHOTGUN_ID]) {
    g.current = current;
    for (const reloading of [false, true]) {
      g.reloading = reloading;
      for (let t = 0; t < 1.3; t += 0.01) {
        g.shotT = t;
        g.reloadT = t;
        for (const loadT of [0, 1]) {
          g.loadT = loadT;
          names.add(gunFrame(g).name);
        }
      }
    }
  }
  for (const t of [0, 0.1, FLARE.cooldown - 0.05, FLARE.cooldown - 0.2]) {
    g.flareT = t;
    names.add(handFrame(g, 0));
    names.add(handFrame(g, 0.125));
  }
  for (const n of names) assert.ok(HANDS.includes(n), n);
});

test('the HUD shows your health, the hour, rounds and flares', () => {
  const art = fakeArt();
  const ctx = fakeContext();
  const s = quietState();
  s.player.health = 64.2;
  s.gun.rifle = 5;
  drawHud(ctx, art, s, { w: 480, h: 270 }, { time: 0, hitT: 9, banner: { t: 0 }, reducedMotion: false });
  const texts = ctx.calls.texts.map((t) => t.str);
  assert.ok(texts.includes('65'));
  assert.ok(texts.includes('8 PM'));
  const icons = ctx.calls.images.filter((i) => i.img === art.hud.image).map((i) => i.args[0]);
  const at = (name) => art.hud.icons[name][0];
  assert.equal(icons.filter((x) => x === at('round')).length, 5);
  assert.equal(icons.filter((x) => x === at('roundEmpty')).length, 3);
  assert.equal(icons.filter((x) => x === at('flare')).length, FLARE.start);
});

test('with the shotgun: shells loaded, and the spares as a number', () => {
  const art = fakeArt();
  const ctx = fakeContext();
  const s = quietState();
  giveShotgun(s);
  s.gun.current = SHOTGUN_ID;
  s.gun.switching = 0;
  drawHud(ctx, art, s, { w: 480, h: 270 }, { time: 0, hitT: 9, banner: { t: 0 }, reducedMotion: false });
  assert.ok(ctx.calls.texts.map((t) => t.str).includes('6'));
});

test('hurt: the edges glow red', () => {
  const art = fakeArt();
  const ctx = fakeContext();
  const s = quietState();
  s.hurt = 0.3;
  drawHud(ctx, art, s, { w: 480, h: 270 }, { time: 0, hitT: 9, banner: { t: 0 }, reducedMotion: false });
  assert.equal(ctx.calls.rects.filter((r) => r.color === art.ui.hurt).length, 4);
});

test('the title shows your best night; the death screen the hour it ended', () => {
  const art = fakeArt();
  let ctx = fakeContext();
  drawScreen(ctx, art, { w: 480, h: 270 }, 'title', { time: 0, best: { hour: 5, dawns: 0 }, reached: 0, kills: 0 });
  assert.ok(ctx.calls.texts.some((t) => t.str === 'Best night: 2 AM'));
  ctx = fakeContext();
  drawScreen(ctx, art, { w: 480, h: 270 }, 'dead', { time: 0, best: { hour: 5, dawns: 0 }, reached: 3, kills: 40 });
  assert.ok(ctx.calls.texts.some((t) => t.str.startsWith('It was 12 AM.')));
});

test('the death and dawn screens say "after-eater" singular for one, plural otherwise', () => {
  const art = fakeArt();
  let ctx = fakeContext();
  drawScreen(ctx, art, { w: 480, h: 270 }, 'dead', { time: 0, best: { hour: 5, dawns: 0 }, reached: 3, kills: 1 });
  assert.ok(ctx.calls.texts.some((t) => t.str === 'It was 12 AM.  1 after-eater fell.'));
  ctx = fakeContext();
  drawScreen(ctx, art, { w: 480, h: 270 }, 'dead', { time: 0, best: { hour: 5, dawns: 0 }, reached: 3, kills: 40 });
  assert.ok(ctx.calls.texts.some((t) => t.str === 'It was 12 AM.  40 after-eaters fell.'));
  ctx = fakeContext();
  drawScreen(ctx, art, { w: 480, h: 270 }, 'dawn', { time: 0, best: { hour: 5, dawns: 0 }, reached: 8, kills: 1 });
  assert.ok(ctx.calls.texts.some((t) => t.str === 'You held the cabin.  1 after-eater fell.'));
});

// The HUD for state s, and what it drew: its texts, and the icons by name.
function hudOf(s, over = {}) {
  const art = fakeArt();
  const ctx = fakeContext();
  drawHud(ctx, art, s, { w: 480, h: 270 }, { time: 0, hitT: 9, banner: { t: 0 }, reducedMotion: false, ...over });
  const byX = new Map(Object.entries(art.hud.icons).map(([n, r]) => [r[0], n]));
  const icons = ctx.calls.images.filter((i) => i.img === art.hud.image).map((i) => byX.get(i.args[0]));
  return { texts: ctx.calls.texts.map((t) => t.str), icons, drawn: ctx.calls.texts };
}

test('the embers you carry show beside your health, however many (?embers=999 too)', () => {
  const s = quietState();
  s.carried = 17;
  const { texts, icons } = hudOf(s);
  assert.ok(icons.includes('ember'));
  assert.ok(texts.includes('17'));
  s.carried = 999;
  assert.ok(hudOf(s).texts.includes('999'));
});

test('at the fire: the offer as rows, each its key, icon, name and line; short of embers, how many more it wants', () => {
  const s = quietState();
  s.atFire = true;
  s.carried = 4;
  let { texts } = hudOf(s);
  assert.ok(texts.includes('The fire wants 2 more embers'), texts.join('|'));
  s.carried = 5;
  assert.ok(hudOf(s).texts.includes('The fire wants 1 more ember'));
  s.choosing = true;
  s.offer.set([0, 6, 11]);
  s.offerN = 3;
  const d = hudOf(s);
  texts = d.texts;
  assert.ok(texts.includes('The fire shows you three'));
  assert.ok(texts.includes('Costs 6 embers'));
  for (const id of [0, 6, 11]) {
    assert.ok(texts.includes(UPGRADE_LIST[id].name) && texts.includes(UPGRADE_LIST[id].line), UPGRADE_LIST[id].name);
    assert.ok(d.icons.includes(`up-${UPGRADE_LIST[id].key}`));
  }
  assert.ok(['1', '2', '3'].every((k) => texts.includes(k)));
  s.atFire = s.choosing = false;
  assert.ok(!hudOf(s).texts.some((t) => t.startsWith('The fire')), 'nothing away from it');
});

test('the frame after a pick shows no empty panel', () => {
  const s = quietState();
  s.atFire = s.choosing = true; // a card was just taken: the offer is gone, and choosing lasts to the next update
  s.offerN = 0;
  s.bought = 1;
  s.carried = 0;
  const { texts } = hudOf(s);
  assert.ok(!texts.includes('The fire shows you three'));
  assert.ok(texts.includes('The fire wants 10 more embers'), texts.join('|'));
});

test('with nothing left it could offer, the fire asks for nothing', () => {
  const s = quietState(); // before the shotgun
  for (let id = 0; id < UPGRADE_LIST.length; id++) {
    if (UPGRADE_LIST[id].shotgun) continue;
    s.perks[UPGRADE_LIST[id].key] = true;
    s.taken[s.bought++] = id;
  }
  s.atFire = true;
  s.carried = 3;
  assert.ok(!hudOf(s).texts.some((t) => t.startsWith('The fire')));
});

test("a card's banner never covers the fire's line or its offer", () => {
  const s = quietState();
  const banner = { text: UPGRADE_LIST[3].name, sub: UPGRADE_LIST[3].line, t: 2 };
  const below = 270 * 0.28 + 22 + 8; // where the banner's sub-line ends
  const clear = (drawn, str) => drawn.some((t) => t.str === str) && drawn.filter((t) => t.str === str).every((t) => t.y >= below);
  s.atFire = true;
  s.carried = 4;
  assert.ok(clear(hudOf(s, { banner }).drawn, 'The fire wants 2 more embers'));
  s.choosing = true;
  s.offer.set([0, 6, 11]);
  s.offerN = 3;
  const { drawn } = hudOf(s, { banner });
  for (const str of ['The fire shows you three', 'Costs 6 embers', ...[0, 6, 11].flatMap((id) => [UPGRADE_LIST[id].name, UPGRADE_LIST[id].line])]) assert.ok(clear(drawn, str), str);
});

test('Steady hands ready: the crosshair goes warm; a hit tick still wins, and the shotgun never shows it', () => {
  const s = quietState();
  s.perks.steady = true;
  s.player.stillT = 1;
  assert.ok(hudOf(s).icons.includes('crosshairSteady'));
  assert.ok(hudOf(s, { hitT: 0 }).icons.includes('hitTick'));
  s.player.stillT = 0;
  assert.ok(hudOf(s).icons.includes('crosshair'));
  s.player.stillT = 1;
  s.gun.hasShotgun = true;
  s.gun.current = SHOTGUN_ID;
  assert.ok(hudOf(s).icons.includes('crosshair'));
});

test('Deep magazine: the rifle row shows 12', () => {
  const s = quietState();
  s.gun.rounds = 12;
  s.gun.rifle = 10;
  const { icons } = hudOf(s);
  assert.deepEqual([icons.filter((n) => n === 'round').length, icons.filter((n) => n === 'roundEmpty').length], [10, 2]);
});

test('Quick lever: the lever frames play within the quicker time between shots', () => {
  const g = createGun();
  g.interval = 0.3;
  const seen = [];
  for (let t = 0; t < 0.3; t += 0.01) {
    g.shotT = t;
    seen.push(gunFrame(g).name);
  }
  assert.ok(seen.includes('rifle-lever-1') && seen.includes('rifle-lever-2'));
});

test('the dawn and death screens show the upgrades you took, in order', () => {
  for (const screen of ['dawn', 'dead']) {
    const art = fakeArt();
    const ctx = fakeContext();
    const taken = new Int8Array(12).fill(-1);
    taken.set([9, 1, 5]);
    drawScreen(ctx, art, { w: 480, h: 270 }, screen, { time: 0, best: { hour: 0, dawns: 0 }, reached: 4, kills: 30, taken, bought: 3 });
    const at = (n) => art.hud.icons[n][0];
    const drawn = ctx.calls.images.filter((i) => i.img === art.hud.image).map((i) => i.args[0]);
    assert.deepEqual(drawn, ['up-reach', 'up-quickLever', 'up-dragon'].map(at), screen);
  }
});

test('standing over a charm: its icon, name, what it gives and what it takes (in red), and the key, under the hour', () => {
  const s = quietState();
  Object.assign(s.charms[2], { id: WOLF, x: 19.5, y: 20.6 });
  s.charmAt = 2;
  const art = fakeArt();
  let d = hudOf(s);
  const c = CHARM_LIST[WOLF];
  for (const str of [c.name, c.gives, c.takes, 'E to take it']) assert.ok(d.texts.includes(str), str);
  assert.ok(d.icons.includes('charm-wolf'));
  const takes = d.drawn.filter((t) => t.str === c.takes);
  assert.ok(takes.some((t) => t.color === art.ui.hurt), 'what it takes is red');
  assert.ok(d.drawn.filter((t) => t.str === c.gives).every((t) => t.y < 270 / 2 - 8), 'clear of the crosshair');
  wearCharm(s, SALT);
  d = hudOf(s);
  assert.ok(d.texts.includes("E to take it, leaving Grave salt"), d.texts.join('|'));
  s.charmAt = -1;
  assert.ok(!hudOf(s).texts.includes(c.name), 'nothing when you stand over none');
});

// Which pendant piece of the charm you wear is drawn, and where (its top-left), or null.
function worn(s, info = {}) {
  const art = fakeArt();
  const ctx = fakeContext();
  drawHud(ctx, art, s, { w: 480, h: 270 }, { time: 0, hitT: 9, banner: { t: 0 }, reducedMotion: false, ...info });
  const byX = new Map(Object.entries(art.hud.icons).filter(([n]) => n.startsWith('hang-')).map(([n, r]) => [r[0], n]));
  const drawn = ctx.calls.images.find((i) => i.img === art.hud.image && byX.has(i.args[0]));
  return drawn ? { name: byX.get(drawn.args[0]), at: [drawn.args[4], drawn.args[5]] } : null;
}
const MIDDLE = (HANG_TURNS - 1) / 2;

test('the charm you wear hangs from the gun in your hands, where its frame says, straight down when still', () => {
  const s = quietState();
  assert.equal(worn(s), null, 'nothing hangs without one');
  wearCharm(s, SALT);
  // The rifle is up and still: the fake art's charm point is (30, -40) from the bottom centre.
  let w = worn(s);
  assert.deepEqual(w, { name: `hang-salt-${MIDDLE}`, at: [240 + 30 - HANG_PIVOT, 270 - 40] });
  s.gun.reloading = true;
  s.gun.shotT = 9;
  s.gun.loadT = 9;
  w = worn(s);
  assert.equal(w.at[1], 270 - 40 + 120, 'it goes down with the rifle to load');
  s.night.phase = 'dead';
  assert.equal(worn(s), null, 'and nothing once you are dead');
});

test('the charm swings: it leans away as you turn and settles back, a shot jolts it, and it swings alike at any frame rate', () => {
  const sw = createSwing();
  swingCharm(sw, 1 / 60, 0, 0, 0);
  for (let i = 1; i <= 12; i++) swingCharm(sw, 1 / 60, i * 0.05, 0, 0); // turning right at 3 radians a second
  assert.ok(sw.angle < -0.1, `turning right, it swings left: ${sw.angle}`);
  for (let i = 0; i < 300; i++) swingCharm(sw, 1 / 60, 0.6, 0, 0);
  assert.ok(Math.abs(sw.angle) < 0.01 && Math.abs(sw.speed) < 0.05, `it settles, hanging straight: ${sw.angle}`);
  swingCharm(sw, 1 / 60, 0.6, 0, 0.035); // a rifle shot's kick
  assert.ok(Math.abs(sw.speed) > 0.5, 'a shot jolts it');
  const after = (fps) => {
    const t = createSwing();
    swingCharm(t, 1 / fps, 0, 0, 0);
    for (let i = 1; i <= Math.round(0.4 * fps); i++) swingCharm(t, 1 / fps, Math.min(0.3, (i / fps) * 3), 0, 0);
    return t.angle;
  };
  assert.ok(Math.abs(after(30) - after(144)) < 0.1, `${after(30)} at 30 fps, ${after(144)} at 144`);
});

test('swung, the charm is drawn turned that way; with reduced motion it hangs straight', () => {
  const s = quietState();
  wearCharm(s, SALT);
  const swing = createSwing();
  swing.ready = true;
  swing.angle = 0.75;
  assert.equal(worn(s, { swing }).name, `hang-salt-${HANG_TURNS - 1}`, 'swung all the way right');
  swing.angle = -0.3;
  assert.equal(worn(s, { swing }).name, `hang-salt-${MIDDLE - 2}`, 'a little to the left');
  swing.angle = 0.75;
  assert.equal(worn(s, { swing, reducedMotion: true }).name, `hang-salt-${MIDDLE}`);
});

test('the title screen lists E for charms', () => {
  const art = fakeArt();
  const ctx = fakeContext();
  drawScreen(ctx, art, { w: 480, h: 270 }, 'title', { time: 0, best: { hour: 0, dawns: 0 } });
  assert.ok(ctx.calls.texts.some((t) => t.str.includes('E charm')));
});
```

`last-light/test/art.test.js` (the full file now):
```js
// Checks the committed art (last-light/assets/, written by the scripts in art/last-light/) against
// everything the code expects: every texture the map uses, every sprite and animation the scene draws,
// every frame and icon the HUD draws, and image sizes that hold them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { WALLS } from '../src/map.js';
import { FLOORS, COLOR_SLACK } from '../src/assets.js';
import { SPRITE_ANIMS, SPRAY_Z } from '../src/scene.js';
import { KINDS } from '../src/creatures.js';
import { CREATURES } from '../src/tuning.js';
import { HAND_FRAMES, HUD_ICONS, HANG_TURNS, HANG_PIVOT } from '../src/hud.js';
import { UPGRADE_LIST } from '../src/upgrades.js';
import { CHARM_LIST } from '../src/charms.js';

const file = (f) => new URL(`../${f}`, import.meta.url);
const json = (f) => JSON.parse(readFileSync(file(`assets/${f}`), 'utf8'));
// A PNG's width and height, from its header.
function pngSize(f) {
  const b = readFileSync(file(f));
  assert.equal(b.toString('ascii', 1, 4), 'PNG', `${f} is a PNG`);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}
const inside = (rect, [w, h]) => rect[0] >= 0 && rect[1] >= 0 && rect[0] + rect[2] <= w && rect[1] + rect[3] <= h;

test('the palette: up to 255 colours, with glow indices and the named colours the game uses', () => {
  const p = json('palette.json');
  assert.ok(p.colors.length > 0 && p.colors.length <= 255);
  for (const c of p.colors) assert.match(c, /^#[0-9a-f]{6}$/);
  assert.equal(new Set(p.colors).size, p.colors.length, 'no colour twice');
  for (const i of p.glow) assert.ok(i >= 1 && i <= p.colors.length);
  for (const n of ['flake', 'ichor', 'spark', 'ui', 'uiDim', 'hurt', 'night']) assert.ok(p.names[n] >= 1 && p.names[n] <= p.colors.length, n);
  assert.ok(p.glow.includes(p.names.spark), 'sparks glow');
});

test('no two palette colours are close enough for readback noise to land between them', () => {
  const rgb = json('palette.json').colors.map((c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)));
  for (let i = 0; i < rgb.length; i++) {
    for (let j = i + 1; j < rgb.length; j++) {
      const apart = Math.max(...[0, 1, 2].map((k) => Math.abs(rgb[i][k] - rgb[j][k])));
      assert.ok(apart > 2 * COLOR_SLACK, `colours ${i + 1} and ${j + 1} are only ${apart} apart`);
    }
  }
});

test('a texture for every wall kind and floor, 32x32 each, side by side', () => {
  const t = json('textures.json');
  assert.equal(t.size, 32);
  const need = new Set([...FLOORS]);
  for (const k of Object.values(WALLS)) (need.add(k.ns), need.add(k.ew));
  for (const n of need) assert.ok(t.names.includes(n), `texture ${n}`);
  assert.deepEqual(pngSize('assets/textures.png'), [32 * t.names.length, 32]);
});

test('the sky is a wide panorama', () => {
  const [w, h] = pngSize('assets/sky.png');
  assert.ok(w >= 512 && h >= 64 && h <= 256, `${w}x${h}`);
});

test('every sprite, with every animation, inside sprites.png', () => {
  const { sprites } = json('sprites.json');
  const size = pngSize('assets/sprites.png');
  for (const [name, anims] of Object.entries(SPRITE_ANIMS)) {
    const s = sprites[name];
    assert.ok(s, `sprite ${name}`);
    assert.ok(s.height > 0 && s.count > 0, name);
    assert.ok(inside([s.x, s.y, s.w * s.count, s.h], size), `${name} fits in sprites.png`);
    for (const a of anims) {
      assert.ok(s.anims[a]?.length > 0, `${name}.${a}`);
      for (const f of s.anims[a]) assert.ok(f >= 0 && f < s.count, `${name}.${a} frame ${f}`);
    }
    if (['crawler', 'gaunt', 'leaper', 'mother'].includes(name)) {
      assert.equal(s.anims.walk.length, 4, `${name} walks in 4 frames`);
      assert.ok(s.stride > 0, `${name} has a stride`);
    }
  }
});

// Against the 1.0-unit walls (a doorway's height; a window's top sits at about 0.75): a crawler comes
// about knee-high, its back (4/5 up its frame) under the window sill; a gaunt's head (0.82 up its
// frame) stands a little above a man's, under the doorway's top; the Mother towers over the cabin.
test('creature sizes: a crawler about knee-high, a gaunt a little taller than you, the Mother towering', () => {
  const { sprites } = json('sprites.json');
  assert.ok(sprites.crawler.height <= 0.4, `crawler ${sprites.crawler.height}`);
  assert.ok(sprites.gaunt.height > 1 && sprites.gaunt.height <= 1.15, `gaunt ${sprites.gaunt.height}`);
  assert.ok(sprites.mother.height >= 2, `mother ${sprites.mother.height}`);
  const order = ['crawler', 'leaper', 'gaunt', 'mother'].map((k) => sprites[k].height);
  assert.deepEqual(order, [...order].sort((a, b) => a - b), 'crawler < leaper < gaunt < mother');
});

test('a shot sees each creature as tall as it is drawn', () => {
  const { sprites } = json('sprites.json');
  for (const k of KINDS) assert.equal(CREATURES[k].height, sprites[k].height, k);
});

// A hit's spray comes out of the body: above the legs, below the eyes.
test("a hit's spray comes from a creature's body, a third to three quarters of the way up it", () => {
  const { sprites } = json('sprites.json');
  KINDS.forEach((k, i) => {
    const up = SPRAY_Z[i] / sprites[k].height;
    assert.ok(up >= 0.35 && up <= 0.75, `${k}: spray at ${SPRAY_Z[i]} is ${up.toFixed(2)} of its ${sprites[k].height} height`);
  });
});

test('the ember and the new icons are the sizes the scene and the HUD expect', () => {
  const { sprites } = json('sprites.json');
  assert.deepEqual([sprites.ember.w, sprites.ember.h, sprites.ember.count, sprites.ember.height], [10, 6, 3, 0.12]);
  const { icons } = json('hud.json');
  for (const n of ['ember', 'crosshairSteady']) assert.deepEqual(icons[n].slice(2), [7, 7], n);
  for (const u of UPGRADE_LIST) assert.deepEqual(icons[`up-${u.key}`].slice(2), [12, 12], u.key);
});

test('the charm and its icons are the sizes the scene and the HUD expect', () => {
  const { sprites } = json('sprites.json');
  assert.deepEqual([sprites.charm.w, sprites.charm.h, sprites.charm.count, sprites.charm.height], [8, 9, 4, 0.14]);
  const { icons } = json('hud.json');
  for (const c of CHARM_LIST) assert.deepEqual(icons[`charm-${c.key}`].slice(2), [12, 12], c.key);
});

test("each charm's pendant: turned the same number of times, one hanging straight, each turn the same size", () => {
  const { icons } = json('hud.json');
  const turns = (key) => Object.keys(icons).filter((n) => n.startsWith(`hang-${key}-`)).length;
  const n = turns('wolf'), size = icons['hang-wolf-0'].slice(2);
  assert.ok(n >= 5 && n % 2 === 1, `${n} turns, the middle one hanging straight`);
  assert.equal(size[0] % 2, 1, 'an odd width, so the chain hangs from the middle column');
  for (const c of CHARM_LIST) {
    assert.equal(turns(c.key), n, c.key);
    for (let i = 0; i < n; i++) assert.deepEqual(icons[`hang-${c.key}-${i}`].slice(2), size, `${c.key} ${i}`);
  }
});

test('the HUD hangs the pendants as they are drawn: as many turns, from the middle column', () => {
  const { icons } = json('hud.json');
  assert.ok(icons[`hang-wolf-${HANG_TURNS - 1}`] && !icons[`hang-wolf-${HANG_TURNS}`]);
  assert.equal(icons['hang-wolf-0'][2], 2 * HANG_PIVOT + 1);
});

test('every gun frame says where a charm hangs from it, on the gun, below the crosshair', () => {
  const { frames, charms } = json('hands.json');
  const guns = HAND_FRAMES.filter((n) => n.startsWith('rifle') || n.startsWith('shotgun'));
  assert.deepEqual(Object.keys(charms).sort(), [...guns].sort());
  for (const n of guns) {
    const [x, y] = charms[n], f = frames[n];
    assert.ok(x >= f[4] && x < f[4] + f[2] && y >= f[5] && y < 0, `${n}: ${x}, ${y} is inside the frame`);
    assert.ok(y > -135 + 20 && x > 10, `${n}: clear of the crosshair`);
  }
});

test('every hands frame and HUD icon, inside their sheets', () => {
  const hands = json('hands.json').frames, hud = json('hud.json').icons;
  const hs = pngSize('assets/hands.png'), is = pngSize('assets/hud.png');
  for (const n of HAND_FRAMES) assert.ok(hands[n] && hands[n].length === 6 && inside(hands[n], hs), n);
  for (const n of HUD_ICONS) assert.ok(hud[n] && inside(hud[n], is), n);
});

test('the tab icon is 48x48', () => {
  assert.ok(existsSync(file('icon.png')));
  assert.deepEqual(pngSize('icon.png'), [48, 48]);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd last-light && npm test`
Expected: FAIL: the scene has no `charmShine`, charms aren't drawn, eyes don't show through walls, the HUD shows no reading and nothing hangs from the gun, and `hud.js` has no `HANG_TURNS`.

- [ ] **Step 3: Write the code**

`last-light/src/scene.js` (the full file now):
```js
// Turns the game state into what the renderer draws this frame: the camera (blended between the last
// two updates, looking where the mouse says, with the head bob and the gun's kick), the lights, and every sprite with its animation
// frame. Embers glow on the snow, dimming and flickering as they cool, and light the ground round them;
// a burning creature is lit by its fire and throws sparks. A charm on the snow glints and lights a
// little snow; the charm you wear can shrink your lantern, and with the Mother's eye every creature's
// eyes glow at full strength and show through walls (`xray`). Allocates nothing per frame: the sprite
// list is a fixed pool.
//
// art.sprites[name] = { height, stride?, ms?, frames: [{ w, h, px }], anims: { name: [frame indices] } },
// with the animations SPRITE_ANIMS lists.
import { VIEW, LIGHT, FEEL, CREATURES, EMBERS, CHARMS } from './tuning.js';
import { KINDS, LEAPER } from './creatures.js';
import { beginLight, addLight, falloff } from './lightmap.js';
import { ambientFor, skyLevelFor } from './night.js';
import { createEffects, spray, spark, updateEffects } from './effects.js';
import { lantern, EYE } from './charms.js';

// Every sprite the game draws, and the animations each must have.
export const SPRITE_ANIMS = {
  crawler: ['walk', 'side-walk', 'attack', 'hurt', 'die'],
  gaunt: ['walk', 'side-walk', 'windup', 'attack', 'hurt', 'die'],
  leaper: ['walk', 'side-walk', 'crouch', 'leap', 'side-leap', 'attack', 'hurt', 'die'],
  mother: ['walk', 'side-walk', 'windup', 'attack', 'hurt', 'die'],
  stove: ['idle'],
  well: ['idle'],
  pine: ['idle'],
  flare: ['idle'],
  ember: ['idle'],
  charm: ['idle'],
  'pickup-flare': ['idle'],
  'pickup-shells': ['idle'],
  'pickup-shotgun': ['idle'],
};
const MAX_SPRITES = 128;
export const SPRAY_Z = [0.25, 0.7, 0.4, 1.3]; // where on each kind (crawler, gaunt, leaper, mother) the spray comes from
const PICKUP_SPRITE = ['pickup-flare', 'pickup-shells', 'pickup-shotgun'];
const SIDE_FROM = (50 * Math.PI) / 180, SIDE_TO = (130 * Math.PI) / 180;
const EMBER_SIZE = [0, 1, 1.25, 1.5, 1.65]; // an ember's height, times its sprite's, by value (4 with Crow's feather)
const FIRE = { full: 0.3, dark: 1.6, intensity: 0.6 }; // the light of a creature burning
const SPARK_EVERY = 0.05; // seconds between sparks off each burning creature

export function createScene(art) {
  for (const [name, anims] of Object.entries(SPRITE_ANIMS)) {
    if (!art.sprites[name]) throw new Error(`no sprite "${name}"`);
    for (const a of anims) if (!art.sprites[name].anims[a]?.length) throw new Error(`sprite "${name}" has no "${a}" animation`);
  }
  const sprites = Array.from({ length: MAX_SPRITES }, () => ({ x: 0, y: 0, height: 1, lift: 0, frame: null, flip: false, glow: 15, xray: false }));
  return {
    art, sprites,
    frame: { x: 0, y: 0, facing: 0, pitch: 0, bob: 0, map: null, lightmap: null, skyLevel: 0, time: 0, sprites, spriteCount: 0, snow: true, drops: null, sparks: null },
    shakeX: 0, shakeY: 0, count: 0, sparkT: 0, sparkN: 0,
    fx: createEffects(),
  };
}

// Reacts to one update's events: a hit throws a spray away from you (more for a kill).
export function sceneEvents(scene, state) {
  const p = state.player;
  for (let i = 0; i < state.eventCount; i++) {
    const e = state.events[i];
    if (e.type === 'hit') spray(scene.fx, e.x, e.y, SPRAY_Z[e.a], p.x, p.y, e.b ? 14 : 7);
  }
}

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const lerp = (a, b, t) => a + (b - a) * t;

// The frame of a looping animation `ms` per frame at `time` seconds, or of a one-shot at progress p.
function loopFrame(spr, anim, time) {
  const list = spr.anims[anim];
  return spr.frames[list[Math.floor((time * 1000) / (spr.ms ?? 150)) % list.length]];
}
function progressFrame(spr, anim, p) {
  const list = spr.anims[anim];
  return spr.frames[list[Math.min(list.length - 1, Math.floor(p * list.length))]];
}

// Which animation frame a creature shows, seen from (camX, camY), written into `out` ({ frame, flip }).
export function creatureFrame(art, c, camX, camY, camRightX, camRightY, out) {
  const spr = art.sprites[KINDS[c.kind]];
  let flip = false;
  const toCam = Math.atan2(camY - c.y, camX - c.x);
  const rel = Math.abs(wrap(c.heading - toCam));
  const side = rel > SIDE_FROM && rel < SIDE_TO;
  if (side) flip = Math.cos(c.heading) * camRightX + Math.sin(c.heading) * camRightY < 0;
  let frame;
  if (c.dying) frame = progressFrame(spr, 'die', 1 - c.dying / CREATURES.die);
  else if (c.hurtT > 0) frame = spr.frames[spr.anims.hurt[0]];
  else if (c.kind === LEAPER && c.mode === 'crouch') frame = spr.frames[spr.anims.crouch[0]];
  else if (c.kind === LEAPER && c.mode === 'leap') frame = spr.frames[spr.anims[side ? 'side-leap' : 'leap'][0]];
  else if (c.mode === 'windup' && spr.anims.windup) frame = spr.frames[spr.anims.windup[0]];
  else if (c.struck > 0) frame = progressFrame(spr, 'attack', 1 - c.struck / 0.25);
  else {
    const list = spr.anims[side ? 'side-walk' : 'walk'];
    const i = c.moving || c.walked > 0 ? Math.floor(c.walked / (spr.stride ?? 0.4)) % list.length : 0;
    frame = spr.frames[list[i]];
  }
  out.frame = frame;
  out.flip = side && flip;
  return out;
}

// xray: its glowing pixels show through walls (the eyes, with the Mother's eye).
function put(scene, sx, sy, spr, frame, lift, flip, glow, height = spr.height, xray = false) {
  if (scene.count >= MAX_SPRITES) return;
  const s = scene.sprites[scene.count++];
  s.x = sx;
  s.y = sy;
  s.height = height;
  s.frame = frame;
  s.lift = lift;
  s.flip = flip;
  s.glow = glow;
  s.xray = xray;
}

const shown = { frame: null, flip: false };

// view: { facing and pitch (from input), alpha (clock blend), time (seconds), dt (seconds since the last frame),
//        reducedMotion, h (view height), focal }
export function buildFrame(scene, state, lightmap, view) {
  const { art } = scene;
  const f = scene.frame, p = state.player, t = view.time;
  const x = lerp(p.px, p.x, view.alpha), y = lerp(p.py, p.y, view.alpha);
  f.x = x;
  f.y = y;
  f.facing = view.facing;
  f.pitch = view.pitch || 0;
  f.map = state.map;
  f.lightmap = lightmap;
  f.time = t;
  f.skyLevel = skyLevelFor(state.night);
  updateEffects(scene.fx, view.dt ?? 0);
  f.drops = scene.fx.drops;
  f.sparks = scene.fx.sparks;
  // Head bob: a step every 0.9 cells walked, scaled by how fast you're going; the kick lifts the view.
  const speed = Math.min(1, Math.sqrt(p.vx * p.vx + p.vy * p.vy) / 3);
  const px = view.h / VIEW.targetHeight;
  const bob = view.reducedMotion ? 0 : Math.sin((p.walked / 0.9) * Math.PI * 2) * VIEW.bobPixels * px * speed;
  f.bob = bob + state.gun.kick * view.focal;
  const shake = !view.reducedMotion && state.shake > 0 ? (FEEL.shake.shotgun * px * state.shake) / FEEL.shakeTime : 0;
  scene.shakeX = shake ? Math.round(Math.sin(t * 97) * shake) : 0;
  scene.shakeY = shake ? Math.round(Math.cos(t * 83) * shake) : 0;

  // Lights: the sky, your lantern (flickering; Wide wick and some charms change its reach), burning
  // flares, and the muzzle flash.
  beginLight(lightmap, ambientFor(state.night));
  const L = LIGHT;
  const flick = 0.95 + 0.05 * Math.sin(t * 13.1) * Math.sin(t * 7.3);
  const lamp = lantern(state);
  addLight(lightmap, x, y, lamp.full, lamp.dark, lamp.intensity * flick);
  for (const fl of state.flares) {
    if (fl.t <= 0) continue;
    const dying = Math.min(1, fl.t); // fades over its last second
    addLight(lightmap, fl.x, fl.y, L.flare.full, L.flare.dark, L.flare.intensity * dying * (0.85 + 0.15 * Math.sin(t * 31 + fl.x)));
  }
  if (state.flash > 0) addLight(lightmap, x, y, L.muzzle.full, L.muzzle.dark, L.muzzle.intensity);
  // Each ember lights the snow round it, dimming as it cools.
  for (const e of state.embers) {
    if (e.t <= 0) continue;
    const E = EMBERS.light;
    addLight(lightmap, e.x, e.y, E.full, E.dark, E.intensity * Math.min(1.5, 0.75 + 0.25 * e.value) * emberWarmth(e, t));
  }
  // Each charm on the snow lights a little of it, flickering with the charm before the wave.
  for (const c of state.charms) {
    if (c.id < 0) continue;
    const C = CHARMS.light;
    addLight(lightmap, c.x, c.y, C.full, C.dark, C.intensity * charmShine(state, c, t));
  }
  // A burning creature is lit by its fire, and throws sparks.
  scene.sparkT += view.dt ?? 0;
  const sparking = scene.sparkT >= SPARK_EVERY;
  if (sparking) scene.sparkT %= SPARK_EVERY;
  for (const c of state.creatures) {
    if (!c.alive || c.burnT <= 0) continue;
    const cx = lerp(c.px, c.x, view.alpha), cy = lerp(c.py, c.y, view.alpha);
    addLight(lightmap, cx, cy, FIRE.full, FIRE.dark, FIRE.intensity * (0.8 + 0.2 * Math.sin(t * 23 + c.id)));
    if (sparking) spark(scene.fx, cx, cy, c.lift + CREATURES[KINDS[c.kind]].height * 0.5, scene.sparkN++);
  }

  // Sprites.
  scene.count = 0;
  const rightX = -Math.sin(view.facing), rightY = Math.cos(view.facing);
  const eye = state.charm === EYE;
  for (const c of state.creatures) {
    if (!c.alive) continue;
    const cx = lerp(c.px, c.x, view.alpha), cy = lerp(c.py, c.y, view.alpha);
    creatureFrame(art, c, x, y, rightX, rightY, shown);
    const ex = cx - x, ey = cy - y;
    const glow = eye ? 15 : Math.round(15 * falloff(Math.sqrt(ex * ex + ey * ey), L.eyes.full, L.eyes.dark));
    const spr = art.sprites[KINDS[c.kind]];
    put(scene, cx, cy, spr, shown.frame, c.lift, shown.flip, glow, spr.height, eye);
  }
  for (const prop of state.map.props) {
    const spr = art.sprites[prop.kind];
    put(scene, prop.x, prop.y, spr, loopFrame(spr, 'idle', t), 0, false, 15);
  }
  for (const k of state.pickups) {
    if (!k.active) continue;
    const spr = art.sprites[PICKUP_SPRITE[k.kind]];
    put(scene, k.x, k.y, spr, loopFrame(spr, 'idle', t), 0.04 + 0.03 * Math.sin(t * 3), false, 15);
  }
  const flareSpr = art.sprites.flare;
  for (const fl of state.flares) if (fl.t > 0) put(scene, fl.x, fl.y, flareSpr, loopFrame(flareSpr, 'idle', t), 0, false, 15);
  const emberSpr = art.sprites.ember;
  for (const e of state.embers) {
    if (e.t <= 0) continue;
    const frame = loopFrame(emberSpr, 'idle', t + ((e.x * 1.37 + e.y) % 1));
    put(scene, e.x, e.y, emberSpr, frame, 0, false, Math.round(15 * emberWarmth(e, t)), emberSpr.height * EMBER_SIZE[e.value]);
  }
  const charmSpr = art.sprites.charm;
  for (const c of state.charms) {
    if (c.id < 0) continue;
    const frame = loopFrame(charmSpr, 'idle', t + c.id * 0.37);
    put(scene, c.x, c.y, charmSpr, frame, 0.03 + 0.02 * Math.sin(t * 2.5 + c.id), false, Math.round(15 * charmShine(state, c, t)));
  }
  f.spriteCount = scene.count;
  return f;
}

// How brightly a charm on the snow shines (0 to 1): fully, except in the lull's last seconds, when it
// flickers before the next wave takes it.
export function charmShine(state, c, t) {
  const n = state.night;
  if (n.phase !== 'lull' || n.t >= CHARMS.flicker) return 1;
  return Math.sin(t * 29 + c.x * 5) > 0 ? 1 : 0.3;
}

// How warm an ember looks (0 to 1): full until its last seconds, then dimming, and flickering.
export function emberWarmth(e, t) {
  if (e.t >= EMBERS.flicker) return 1;
  const k = e.t / EMBERS.flicker;
  return (0.3 + 0.7 * k) * (Math.sin(t * 31 + e.x * 7) > -0.2 ? 1 : 0.45);
}
```

`last-light/src/render.js` (the full file now):
```js
// Draws the world into a pixel buffer: the sky, the walls, the snow and floorboards, the rafters under
// the cabin roof, the sprites and the falling snow, all lit from the lightmap. It's arithmetic on
// typed arrays and allocates nothing per frame, so it runs (and is tested and timed) in Node too.
//
// art (see assets.js):
//   shades   { table, fade, emissive } from shade.js
//   walls    { name: Uint8Array(32 * 32) }, column-major (index x * 32 + y), palette indices
//   floors   { snow, planks, rafters: Uint8Array(32 * 32) }, row-major
//   sky      { w, h, px: Uint8Array }, row-major; a panorama whose bottom row sits on the horizon, and
//            whose top row carries on above it
//   flake    the palette index falling snow is drawn in
//   ichor    the palette index of the spray when a creature is hit
//   spark    the palette index of the sparks off a burning creature (they glow)
import { castRay, createHit } from './raycast.js';
import { BAYER, LEVELS } from './shade.js';
import { lightAt, RES } from './lightmap.js';

export const TEX = 32;
const TOP = LEVELS - 1;
const SNOW_BOX = 12; // flakes fill a box this many cells across, centred on you
const SNOW_TOP = 3.4; // and fall from this high: above the view's centre across the box, looking all the way up
const FLAKES = 780; // 300 to every 1.3 cells of height
const LIGHT_SPAN = 8; // the most pixels along a floor or ceiling row between reads of the light

// Deterministic per-flake numbers in [0, 1).
function hash(i, k) {
  let n = (i * 374761393 + k * 668265263) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

export function createRenderer(art, map) {
  const { table, fade, emissive } = art.shades;
  const wallTex = map.wallKinds.map((k) => k && { ns: art.walls[k.ns], ew: art.walls[k.ew] });
  for (let i = 1; i < wallTex.length; i++) {
    for (const f of ['ns', 'ew']) if (!wallTex[i][f]) throw new Error(`no wall texture "${map.wallKinds[i][f]}"`);
  }
  const { snow, planks, rafters } = art.floors;
  const sky = art.sky;
  const flakes = new Float32Array(FLAKES * 4);
  for (let i = 0; i < FLAKES; i++) {
    flakes[i * 4] = hash(i, 1) * SNOW_BOX;
    flakes[i * 4 + 1] = hash(i, 2) * SNOW_BOX;
    flakes[i * 4 + 2] = hash(i, 3); // fall phase
    flakes[i * 4 + 3] = (0.325 + hash(i, 4) * 0.325) / SNOW_TOP; // falling 0.33 to 0.65 cells a second, as a share of the fall
  }
  const hit = createHit();
  let w = 0, h = 0, focal = 1, plane = 1;
  let buf, zbuf, wallTop, wallBot, rayX, rayY, skyCol, order, depths;
  // This frame's camera, shared with point().
  let cx = 0, cy = 0, dirX = 1, dirY = 0, hz = 0, lm = null;

  // A point in the world (height z) as one lit pixel, or a 2x2 block up close, hidden by walls. A
  // glowing point ignores the light.
  function point(wx, wy, z, idx, glow) {
    const rx = wx - cx, ry = wy - cy;
    const depth = rx * dirX + ry * dirY;
    if (depth < 0.2) return;
    const sxp = (w / 2 + ((rx * -dirY + ry * dirX) / depth) * focal) | 0;
    const syp = (hz + ((0.5 - z) * focal) / depth) | 0;
    if (sxp < 0 || sxp >= w || syp < 0 || syp >= h || depth >= zbuf[sxp]) return;
    let l = glow ? TOP : (lightAt(lm, wx, wy) * TOP + 0.5) | 0;
    if (l > TOP) l = TOP;
    if (l === 0) return;
    const c = table[(l << 8) | idx];
    buf[syp * w + sxp] = c;
    if (depth < 2 && sxp + 1 < w && syp + 1 < h) {
      buf[syp * w + sxp + 1] = c;
      buf[(syp + 1) * w + sxp] = c;
      buf[(syp + 1) * w + sxp + 1] = c;
    }
  }

  const r = {
    buffer: null,
    resize(view) {
      ({ w, h, focal, plane } = view);
      buf = new Uint32Array(w * h);
      zbuf = new Float32Array(w);
      wallTop = new Int32Array(w);
      wallBot = new Int32Array(w);
      rayX = new Float32Array(w + 1);
      rayY = new Float32Array(w + 1);
      skyCol = new Int32Array(w);
      order = new Int32Array(256);
      depths = new Float32Array(256);
      r.buffer = buf;
    },
    draw(f) {
      lm = f.lightmap;
      cx = f.x;
      cy = f.y;
      dirX = Math.cos(f.facing);
      dirY = Math.sin(f.facing);
      const rightX = -dirY * plane, rightY = dirX * plane;
      // Looking up or down shears the view, as Duke Nukem 3D did: the horizon moves by tan(pitch) x
      // focal, so the crosshair at the centre stays on the line a shot takes, and walls stay upright.
      hz = Math.round(h / 2 + (f.bob || 0) + Math.tan(f.pitch || 0) * focal);
      const skyRow = (f.skyLevel | 0) << 8;

      // Walls, one column at a time.
      for (let x = 0; x <= w; x++) {
        const camX = (2 * x) / w - 1 + 1 / w;
        rayX[x] = dirX + rightX * camX;
        rayY[x] = dirY + rightY * camX;
      }
      for (let x = 0; x < w; x++) {
        const rdx = rayX[x], rdy = rayY[x];
        const ang = f.facing + Math.atan2((2 * x) / w - 1 + 1 / w, 1 / plane);
        let a = (ang / (2 * Math.PI)) % 1;
        if (a < 0) a += 1;
        skyCol[x] = (a * sky.w) | 0;
        if (!castRay(map, cx, cy, rdx, rdy, hit)) {
          zbuf[x] = Infinity;
          wallTop[x] = hz;
          wallBot[x] = hz;
          continue;
        }
        const dist = Math.max(hit.dist, 1e-4);
        zbuf[x] = dist;
        const lineH = focal / dist;
        const top = hz - lineH * 0.5;
        const y0 = Math.max(0, Math.ceil(top - 0.5)), y1 = Math.min(h, Math.ceil(top + lineH - 0.5));
        wallTop[x] = y0;
        wallBot[x] = y1;
        const tex = wallTex[hit.kind][hit.face];
        let tx = (hit.u * TEX) | 0;
        if (tx > TEX - 1) tx = TEX - 1;
        const col = tx * TEX;
        // Light where the ray met the wall, pulled back a little into the open side.
        const back = 0.05 / Math.sqrt(rdx * rdx + rdy * rdy);
        const light = lightAt(lm, cx + rdx * (dist - back), cy + rdy * (dist - back)) * TOP;
        const step = TEX / lineH;
        let pos = (y0 + 0.5 - top) * step;
        for (let y = y0, o = y0 * w + x; y < y1; y++, o += w, pos += step) {
          const idx = tex[col + ((pos | 0) & (TEX - 1))];
          let l = (light + BAYER[((y & 3) << 2) | (x & 3)]) | 0;
          if (l > TOP) l = TOP;
          buf[o] = table[(l << 8) | idx];
        }
      }

      // Floor and ceiling, a row at a time: every pixel of a row is at the same depth. Above the
      // horizon it's sky, except under the cabin roof. Along a row the light changes slowly, so it's
      // read every `span` pixels and blended in between: a span covers at most one lightmap cell, so
      // up close (looking down, most of the view) that's LIGHT_SPAN pixels, and near the horizon
      // every pixel.
      const half = 0.5 * focal;
      const mw = map.w, mh = map.h, roofed = map.roofed, skyPx = sky.px;
      for (let y = 0; y < h; y++) {
        const below = y >= hz;
        const rowDist = half / (below ? y + 0.5 - hz : hz - y - 0.5);
        let wx = cx + rowDist * rayX[0], wy = cy + rowDist * rayY[0];
        const sx = (rowDist * (rayX[w] - rayX[0])) / w, sy = (rowDist * (rayY[w] - rayY[0])) / w;
        const span = Math.max(1, Math.min(LIGHT_SPAN, (1 / (RES * Math.sqrt(sx * sx + sy * sy))) | 0));
        let x0 = 0, x1 = 0, l0 = 0, dl = 0; // the light at x0, and its change a pixel until x1
        const bay = (y & 3) << 2;
        let o = y * w;
        if (!below) {
          const sr = sky.h - (hz - y);
          const skyBase = (sr < 0 ? 0 : sr) * sky.w;
          for (let x = 0; x < w; x++, o++, wx += sx, wy += sy) {
            if (y >= wallTop[x]) continue;
            const mx = wx | 0, my = wy | 0;
            if (wx < 0 || wy < 0 || mx >= mw || my >= mh || roofed[my * mw + mx] === 0) {
              buf[o] = table[skyRow | skyPx[skyBase + skyCol[x]]];
              continue;
            }
            const idx = rafters[(((wy - my) * TEX) | 0) * TEX + (((wx - mx) * TEX) | 0)];
            if (x >= x1) {
              x0 = x;
              x1 = x + span;
              l0 = lightAt(lm, wx, wy);
              dl = (lightAt(lm, wx + sx * span, wy + sy * span) - l0) / span;
            }
            let l = ((l0 + dl * (x - x0)) * TOP + BAYER[bay | (x & 3)]) | 0;
            if (l > TOP) l = TOP;
            buf[o] = table[(l << 8) | idx];
          }
          continue;
        }
        for (let x = 0; x < w; x++, o++, wx += sx, wy += sy) {
          if (y < wallBot[x]) continue;
          const mx = wx | 0, my = wy | 0;
          const roof = wx >= 0 && wy >= 0 && mx < mw && my < mh && roofed[my * mw + mx] === 1;
          const idx = (roof ? planks : snow)[(((wy - my) * TEX) | 0) * TEX + (((wx - mx) * TEX) | 0)];
          if (x >= x1) {
            x0 = x;
            x1 = x + span;
            l0 = lightAt(lm, wx, wy);
            dl = (lightAt(lm, wx + sx * span, wy + sy * span) - l0) / span;
          }
          let l = ((l0 + dl * (x - x0)) * TOP + BAYER[bay | (x & 3)]) | 0;
          if (l > TOP) l = TOP;
          buf[o] = table[(l << 8) | idx];
        }
      }

      // Sprites, far to near, each column hidden behind nearer walls; an `xray` sprite's glowing pixels
      // (the eyes, with the Mother's eye) show through them.
      const n = Math.min(f.spriteCount, order.length);
      let m = 0;
      for (let i = 0; i < n; i++) {
        const s = f.sprites[i];
        const rx = s.x - cx, ry = s.y - cy;
        const depth = rx * dirX + ry * dirY;
        if (depth < 0.1) continue;
        // insertion sort, farthest first
        let j = m++;
        while (j > 0 && depths[j - 1] < depth) {
          depths[j] = depths[j - 1];
          order[j] = order[j - 1];
          j--;
        }
        depths[j] = depth;
        order[j] = i;
      }
      for (let k = 0; k < m; k++) {
        const s = f.sprites[order[k]];
        const depth = depths[k];
        const fr = s.frame;
        const lateral = ((s.x - cx) * -dirY + (s.y - cy) * dirX);
        const sh = (s.height * focal) / depth, sw = (sh * fr.w) / fr.h;
        const centre = w / 2 + (lateral / depth) * focal;
        const bottom = hz + ((0.5 - (s.lift || 0)) * focal) / depth;
        const top = bottom - sh, left = centre - sw / 2;
        const xa = Math.max(0, Math.ceil(left - 0.5)), xb = Math.min(w, Math.ceil(left + sw - 0.5));
        const ya = Math.max(0, Math.ceil(top - 0.5)), yb = Math.min(h, Math.ceil(bottom - 0.5));
        if (xa >= xb || ya >= yb) continue;
        const light = lightAt(lm, s.x, s.y) * TOP;
        const eyes = (s.glow ?? TOP) << 8;
        // Far off, sample a halved copy of the frame (its `mips`, from assets.js): the finest that's
        // less than twice the drawn size. While that's still bigger than drawn, pixels skip some of its
        // texels, and a 1-texel eye could fall between them; so each pixel also looks at the next
        // level down, at the 2x2 block its texel is in, and shows the block's glow if it has one. On
        // screen every texel of that level spans at least a pixel, so no pixel skips it, and the eyes
        // never blink out.
        let F = fr, G = null, mi = 0;
        const mips = fr.mips;
        if (mips !== undefined) {
          while (mi < mips.length && F.h >= 2 * sh) F = mips[mi++];
          if (mi < mips.length && (F.h > sh || F.w > sw)) G = mips[mi];
        }
        const px = F.px, fw = F.w, fh = F.h;
        const gpx = G === null ? null : G.px, gh = G === null ? 0 : G.h;
        const xray = s.xray === true;
        for (let x = xa; x < xb; x++) {
          const hidden = depth >= zbuf[x];
          if (hidden && !xray) continue;
          let tx = (((x + 0.5 - left) / sw) * fw) | 0;
          if (tx >= fw) tx = fw - 1;
          if (s.flip) tx = fw - 1 - tx;
          const col = tx * fh, last = col + fh - 1, step = fh / sh, gcol = (tx >> 1) * gh;
          let pos = (ya + 0.5 - top) * step;
          for (let y = ya, o = ya * w + x; y < yb; y++, o += w, pos += step) {
            let ti = col + (pos | 0);
            if (ti > last) ti = last;
            let idx = px[ti];
            if (gpx !== null && emissive[idx] === 0) {
              const g = gpx[gcol + ((ti - col) >> 1)];
              if (emissive[g] === 1) idx = g;
            }
            if (idx === 0) continue;
            if (emissive[idx]) {
              buf[o] = fade[eyes | idx];
              continue;
            }
            if (hidden) continue;
            let l = (light + BAYER[((y & 3) << 2) | (x & 3)]) | 0;
            if (l > TOP) l = TOP;
            buf[o] = table[(l << 8) | idx];
          }
        }
      }

      // The spray from hits, and sparks off anything burning.
      if (f.drops) for (const d of f.drops) if (d.t > 0) point(d.x, d.y, d.z, art.ichor, false);
      if (f.sparks) for (const d of f.sparks) if (d.t > 0) point(d.x, d.y, d.z, art.spark, true);

      // Falling snow: a box of flakes that drifts with you, drawn as single pixels, hidden by walls
      // and by the cabin roof.
      if (f.snow) {
        const t = f.time;
        for (let i = 0; i < FLAKES; i++) {
          const b = i * 4;
          let fx = (flakes[b] + t * 0.35 - cx) % SNOW_BOX;
          if (fx < 0) fx += SNOW_BOX;
          let fy = (flakes[b + 1] + t * 0.12 - cy) % SNOW_BOX;
          if (fy < 0) fy += SNOW_BOX;
          const wx = cx + fx - SNOW_BOX / 2, wy = cy + fy - SNOW_BOX / 2;
          const z = SNOW_TOP - ((flakes[b + 2] + t * flakes[b + 3]) % 1) * SNOW_TOP;
          const rx = wx - cx, ry = wy - cy;
          const depth = rx * dirX + ry * dirY;
          if (depth < 0.2) continue;
          const sxp = (w / 2 + ((rx * -dirY + ry * dirX) / depth) * focal) | 0;
          const syp = (hz + ((0.5 - z) * focal) / depth) | 0;
          if (sxp < 0 || sxp >= w || syp < 0 || syp >= h || depth >= zbuf[sxp]) continue;
          const mx = wx | 0, my = wy | 0;
          if (mx >= 0 && my >= 0 && mx < map.w && my < map.h && map.roofed[my * map.w + mx]) continue;
          let l = (lightAt(lm, wx, wy) * TOP + 0.5) | 0;
          if (l > TOP) l = TOP;
          if (l > 0) buf[syp * w + sxp] = table[(l << 8) | art.flake];
        }
      }
    },
  };
  return r;
}
```

`last-light/src/hud.js` (the full file now):
```js
// Everything drawn over the world with the canvas 2D context, at internal resolution: the guns and
// lantern in your hands, with the charm you wear swinging from the gun, the crosshair and hit tick,
// health, embers carried, ammo, flares, the hour, the hurt glow, banners, the fire's offer, the charm
// you stand over, and the title, death and dawn screens. Text is Silkscreen.
import { RIFLE, SHOTGUN, SWITCH_TIME, FLARE, FEEL, NIGHT } from './tuning.js';
import { RIFLE_ID, steadyReady } from './weapons.js';
import { hourLabel } from './night.js';
import { UPGRADE_LIST, UPGRADE_COUNT, upgradeCost, anyUsable } from './upgrades.js';
import { CHARM_LIST } from './charms.js';

// Every frame of the hands art, and every HUD icon, the HUD draws.
export const HAND_FRAMES = [
  'rifle-idle', 'rifle-fire', 'rifle-lever-1', 'rifle-lever-2',
  'shotgun-idle', 'shotgun-fire', 'shotgun-reload-1', 'shotgun-reload-2', 'shotgun-reload-3',
  'lantern-1', 'lantern-2', 'throw-1', 'throw-2',
];
// Each upgrade's icon is "up-" and its key.
const UPGRADE_ICONS = UPGRADE_LIST.map((u) => `up-${u.key}`);
// Each charm's is "charm-" and its key.
const CHARM_ICONS = CHARM_LIST.map((c) => `charm-${c.key}`);
// Each charm's pendant, as it hangs from your gun, drawn turned to HANG_TURNS angles evenly from
// -HANG_MOST to HANG_MOST radians (positive swings it right), about the top of its chain, HANG_PIVOT
// pixels in from the left of each piece: "hang-", the charm's key, and the turn (art/last-light/hud.lua).
export const HANG_TURNS = 11, HANG_MOST = 0.75, HANG_PIVOT = 22;
const HANG_ICONS = CHARM_LIST.map((c) => Array.from({ length: HANG_TURNS }, (_, i) => `hang-${c.key}-${i}`));
export const HUD_ICONS = ['heart', 'round', 'roundEmpty', 'shell', 'shellEmpty', 'flare', 'crosshair', 'crosshairSteady', 'hitTick', 'ember', ...UPGRADE_ICONS, ...CHARM_ICONS, ...HANG_ICONS.flat()];

const FONTS = { 8: '8px Silkscreen, monospace', 16: '16px Silkscreen, monospace', 24: '24px Silkscreen, monospace' };
const HOURS = ['9 PM', '10 PM', '11 PM', '12 AM', '1 AM', '2 AM', '3 AM', '4 AM', 'dawn'];
const LOWER = 0.15; // seconds the rifle takes to go down out of sight to load, and to come back up
const LOADING = 2; // how far down it goes to load: out of sight (a switch only lowers a gun to 1)
// The fire's line and its offer sit below the banners (at h x 0.28, two lines), so the banner for a
// card just taken never covers them.
const FIRE_TOP = 0.44;
const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const SHOTGUN_RELOAD = ['shotgun-reload-1', 'shotgun-reload-2', 'shotgun-reload-3'];
// Numbers as text, made once, so the HUD doesn't build new strings every frame.
const NUMBERS = Array.from({ length: 1000 }, (_, i) => String(i));
const num = (n) => NUMBERS[Math.max(0, Math.min(999, Math.ceil(n)))];
// "N after-eaters fell", or "1 after-eater fell" for one.
const fellText = (n) => `${n} after-eater${n === 1 ? '' : 's'} fell`;
// The fire's lines, made once: what the next upgrade costs, and how many more embers it wants.
const COSTS = Array.from({ length: UPGRADE_COUNT }, (_, n) => `Costs ${upgradeCost(n)} embers`);
const WANTS = Array.from({ length: 61 }, (_, n) => `The fire wants ${n} more ember${n === 1 ? '' : 's'}`);
// A charm's key line: what taking it costs you besides its price.
const TAKE = 'E to take it';
const LEAVING = CHARM_LIST.map((c) => `E to take it, leaving ${c.name}`);

// The charm you wear hangs on its chain from the inner side of the gun in your hands, at the point each
// gun frame gives (hands.json's `charms`). It swings as a damped pendulum: it leans away as you turn,
// rocks with your steps, and jumps when you fire. With reduced motion it hangs still.
// spring: how hard it swings back to where it leans (a swing about twice a second); damping: how fast
// the swinging dies away; turn: radians it leans for each radian a second you turn; step: radians for
// each pixel a second the hands sway; kick: radians a second a shot throws it, for each radian of the
// gun's kick. It swings no further than its pendant is drawn (HANG_MOST).
const SWING = { spring: 160, damping: 2.4, turn: 0.12, step: 0.02, kick: 30 };

const shown = { name: '', drop: 0 };
// Which of n frames a countdown from `whole` to 0 is at, `t` left.
const step = (t, whole, n) => Math.min(n - 1, Math.max(0, Math.floor((1 - t / whole) * n)));

// Which frame of the gun in your hand to show, and how far it's lowered (0 up, 1 down for a switch, 2
// out of sight). Returns a reused { name, drop }.
export function gunFrame(gun) {
  let drop = 0, id = gun.current, name;
  if (gun.switching > 0) {
    const half = SWITCH_TIME / 2;
    if (gun.switching > half) drop = 1 - (gun.switching - half) / half;
    else {
      id = gun.next;
      drop = gun.switching / half;
    }
    name = id === RIFLE_ID ? 'rifle-idle' : 'shotgun-idle';
  } else if (id === RIFLE_ID) {
    // The lever works in the time between shots (quicker with Quick lever).
    const k = gun.interval / RIFLE.interval;
    if (gun.shotT < 0.06) name = 'rifle-fire';
    else if (gun.shotT < 0.2 * k) name = 'rifle-idle';
    else if (gun.shotT < 0.3 * k) name = 'rifle-lever-1';
    else if (gun.shotT < gun.interval) name = 'rifle-lever-2';
    else {
      // Loading, the rifle goes down out of sight and comes back up when it's done: the rounds are
      // heard going in, not seen. Down counts from when the loading shows: an empty rifle starts
      // loading with its last shot, but works the lever first.
      name = 'rifle-idle';
      if (gun.reloading) drop = LOADING * ease(Math.min(gun.loadT, gun.shotT - gun.interval) / LOWER);
      else if (gun.loadT < LOWER) drop = LOADING * ease(1 - gun.loadT / LOWER);
    }
  } else if (gun.shotT < 0.06) name = 'shotgun-fire';
  else if (gun.reloading) name = SHOTGUN_RELOAD[step(gun.reloadT, SHOTGUN.reload, SHOTGUN_RELOAD.length)];
  else name = 'shotgun-idle';
  shown.name = name;
  shown.drop = drop;
  return shown;
}

// A swing for the charm on your gun: its angle from hanging straight down (radians, positive to the
// right) and how fast that's changing.
export function createSwing() {
  return { angle: 0, speed: 0, facing: 0, sway: 0, kick: 0, ready: false };
}

// Moves the swing on by dt seconds, from your facing now (radians), the hands' sideways sway (pixels)
// and the gun's kick (radians). The first call only notes where things are.
export function swingCharm(sw, dt, facing, sway, kick) {
  if (!sw.ready || dt <= 0) {
    sw.ready = true;
    sw.facing = facing;
    sw.sway = sway;
    sw.kick = kick;
    return sw;
  }
  const turn = Math.atan2(Math.sin(facing - sw.facing), Math.cos(facing - sw.facing)) / dt;
  const step = (sway - sw.sway) / dt;
  if (kick > sw.kick) sw.speed += (kick - sw.kick) * SWING.kick * (sw.angle < 0 ? -1 : 1);
  sw.facing = facing;
  sw.sway = sway;
  sw.kick = kick;
  const lean = Math.max(-HANG_MOST, Math.min(HANG_MOST, -turn * SWING.turn - step * SWING.step));
  // In small steps, so it swings the same at any frame rate.
  const n = Math.min(24, Math.ceil(dt * 240)), h = dt / n;
  for (let i = 0; i < n; i++) {
    sw.speed += (-SWING.spring * (sw.angle - lean) - SWING.damping * sw.speed) * h;
    sw.angle += sw.speed * h;
  }
  if (sw.angle > HANG_MOST || sw.angle < -HANG_MOST) {
    sw.angle = Math.max(-HANG_MOST, Math.min(HANG_MOST, sw.angle));
    sw.speed = 0;
  }
  return sw;
}

// The lantern hand's frame: a two-frame flicker, or the throw while a flare leaves your hand.
export function handFrame(gun, time) {
  const since = FLARE.cooldown - gun.flareT;
  if (gun.flareT > 0 && since < 0.3) return since < 0.15 ? 'throw-1' : 'throw-2';
  return Math.floor(time * 8) % 2 ? 'lantern-2' : 'lantern-1';
}

function frame(ctx, art, name, x, y) {
  const f = art.hands.frames[name];
  if (!f) throw new Error(`no hands frame "${name}"`);
  ctx.drawImage(art.hands.image, f[0], f[1], f[2], f[3], Math.round(x + f[4]), Math.round(y + f[5]), f[2], f[3]);
}

function icon(ctx, art, name, x, y) {
  const i = art.hud.icons[name];
  ctx.drawImage(art.hud.image, i[0], i[1], i[2], i[3], Math.round(x), Math.round(y), i[2], i[3]);
  return i[2];
}

function text(ctx, str, x, y, color, px = 8, align = 'left') {
  ctx.font = FONTS[px];
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#000000';
  ctx.fillText(str, x + 1, y + 1);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// info: { time, hitT (seconds since you last hit something), banner: { text, sub, t }, reducedMotion,
//        swing (from createSwing, for the charm on your gun), facing (radians), dt (seconds since the
//        last frame) }
export function drawHud(ctx, art, state, view, info) {
  const { w, h } = view, g = state.gun, p = state.player, ui = art.ui;
  // The hands, bobbing as you walk.
  const speed = Math.min(1, Math.sqrt(p.vx * p.vx + p.vy * p.vy) / 3);
  const phase = (p.walked / 0.9) * Math.PI;
  const bx = info.reducedMotion ? 0 : Math.sin(phase) * 3 * speed;
  const by = info.reducedMotion ? 0 : Math.abs(Math.cos(phase)) * 2 * speed;
  if (info.swing) swingCharm(info.swing, info.dt ?? 0, info.facing ?? 0, bx, g.kick);
  if (state.night.phase !== 'dead') {
    frame(ctx, art, handFrame(g, info.time), w / 2 - bx, h + by);
    const gf = gunFrame(g), gx = w / 2 + bx, gy = h + by + gf.drop * 60 + g.kick * 120;
    frame(ctx, art, gf.name, gx, gy);
    if (state.charm >= 0) {
      const angle = info.swing && !info.reducedMotion ? info.swing.angle : 0;
      drawWorn(ctx, art, HANG_ICONS[state.charm], art.hands.charms[gf.name], gx, gy, angle);
    }
  }
  // Crosshair and hit tick; the crosshair goes warm while Steady hands is ready with the rifle raised.
  const cross = info.hitT < 0.15 ? 'hitTick' : g.current === RIFLE_ID && steadyReady(state) ? 'crosshairSteady' : 'crosshair';
  icon(ctx, art, cross, Math.floor(w / 2) - 3, Math.floor(h / 2) - 3);
  // Hurt: the edges glow red, and pulse when you're low.
  let hurt = state.hurt > 0 ? (state.hurt / FEEL.hurtTime) * 0.55 : 0;
  if (p.health > 0 && p.health <= FEEL.lowHealth) hurt = Math.max(hurt, 0.18 + 0.12 * Math.sin(info.time * 7));
  if (hurt > 0) {
    ctx.globalAlpha = Math.min(1, hurt);
    ctx.fillStyle = ui.hurt;
    const e = Math.round(h / 14);
    ctx.fillRect(0, 0, w, e);
    ctx.fillRect(0, h - e, w, e);
    ctx.fillRect(0, e, e, h - 2 * e);
    ctx.fillRect(w - e, e, e, h - 2 * e);
    ctx.globalAlpha = 1;
  }
  // Health, bottom left, and the embers you carry beside it.
  const hx = 6, hy = h - 14;
  const hw = icon(ctx, art, 'heart', hx, hy);
  text(ctx, num(p.health), hx + hw + 3, hy + 1, p.health <= FEEL.lowHealth ? ui.hurt : ui.text);
  const ew = icon(ctx, art, 'ember', hx + 42, hy);
  text(ctx, num(state.carried), hx + 42 + ew + 3, hy + 1, ui.text);
  // Ammo and flares, bottom right.
  let x = w - 6;
  if (g.current === RIFLE_ID) {
    for (let i = g.rounds - 1; i >= 0; i--) x -= icon(ctx, art, i < g.rifle ? 'round' : 'roundEmpty', x - 4, hy) + 1;
  } else {
    text(ctx, num(g.spare), x, hy + 1, ui.dim, 8, 'right');
    x -= 14;
    for (let i = SHOTGUN.shells - 1; i >= 0; i--) x -= icon(ctx, art, i < g.shells ? 'shell' : 'shellEmpty', x - 5, hy) + 2;
  }
  x -= 8;
  for (let i = 0; i < g.flares; i++) x -= icon(ctx, art, 'flare', x - 5, hy) + 1;
  // The hour, top centre, and under it the charm you're standing over.
  text(ctx, hourLabel(state.night), w / 2, 6, ui.dim, 8, 'center');
  if (state.charmAt >= 0) drawCharm(ctx, art, state, w);
  // At the fire: its offer, or how many more embers it wants.
  if (state.choosing && state.offerN > 0) drawOffer(ctx, art, state, w, h);
  else if (state.atFire && anyUsable(state)) {
    const need = upgradeCost(state.bought) - state.carried;
    if (need > 0) text(ctx, WANTS[Math.min(need, WANTS.length - 1)], w / 2, Math.round(h * FIRE_TOP), ui.text, 8, 'center');
  }
  // A banner: the new hour, a supply, a warning.
  const b = info.banner;
  if (b && b.t > 0) {
    ctx.globalAlpha = Math.min(1, b.t);
    if (b.text) text(ctx, b.text, w / 2, h * 0.28, ui.text, 16, 'center');
    if (b.sub) text(ctx, b.sub, w / 2, h * 0.28 + 22, ui.dim, 8, 'center');
    ctx.globalAlpha = 1;
  }
}

// The fire's offer: a panel down the middle of the view, a row a card (its key, icon, name and line).
function drawOffer(ctx, art, state, w, h) {
  const ui = art.ui, n = state.offerN, row = 26;
  const bw = Math.min(w - 16, 300), x = Math.round((w - bw) / 2), top = Math.round(h * FIRE_TOP);
  ctx.globalAlpha = 0.82;
  ctx.fillStyle = ui.night;
  ctx.fillRect(x - 8, top - 8, bw + 16, 30 + n * row);
  ctx.globalAlpha = 1;
  text(ctx, 'The fire shows you three', w / 2, top, ui.text, 8, 'center');
  text(ctx, COSTS[Math.min(state.bought, COSTS.length - 1)], w / 2, top + 10, ui.dim, 8, 'center');
  for (let i = 0; i < n; i++) {
    const u = UPGRADE_LIST[state.offer[i]], y = top + 26 + i * row;
    text(ctx, NUMBERS[i + 1], x, y + 3, ui.text);
    icon(ctx, art, UPGRADE_ICONS[state.offer[i]], x + 12, y);
    text(ctx, u.name, x + 30, y, ui.text);
    text(ctx, u.line, x + 30, y + 10, ui.dim);
  }
}

// The charm you wear, its pendant (`turns`, one name a turn) hanging at `angle` from the point `at` on
// the gun drawn at (gx, gy).
function drawWorn(ctx, art, turns, at, gx, gy, angle) {
  if (!at) return;
  const k = Math.round(((angle / HANG_MOST + 1) * (HANG_TURNS - 1)) / 2);
  icon(ctx, art, turns[Math.max(0, Math.min(HANG_TURNS - 1, k))], Math.round(gx + at[0]) - HANG_PIVOT, Math.round(gy + at[1]));
}

// The charm you're standing over, under the hour, clear of the crosshair: its icon and name, what it
// gives, what it takes (in red), and the key.
function drawCharm(ctx, art, state, w) {
  const ui = art.ui, id = state.charms[state.charmAt].id, c = CHARM_LIST[id];
  const bw = Math.min(w - 16, 220), x = Math.round((w - bw) / 2), top = 18;
  ctx.globalAlpha = 0.82;
  ctx.fillStyle = ui.night;
  ctx.fillRect(x - 6, top - 5, bw + 12, 48);
  ctx.globalAlpha = 1;
  icon(ctx, art, CHARM_ICONS[id], x, top);
  text(ctx, c.name, x + 18, top, ui.text);
  text(ctx, c.gives, x + 18, top + 10, ui.text);
  text(ctx, c.takes, x + 18, top + 20, ui.hurt);
  text(ctx, state.charm >= 0 ? LEAVING[state.charm] : TAKE, x + 18, top + 30, ui.dim);
}

// The upgrades a night bought, in order, as a row of icons centred at y.
function drawTaken(ctx, art, w, y, taken, bought) {
  let x = Math.round(w / 2 - (bought * 14 - 2) / 2);
  for (let i = 0; i < bought; i++) x += icon(ctx, art, UPGRADE_ICONS[taken[i]], x, y) + 2;
}

// The title, death and dawn screens, drawn over the world.
// info: { best: { hour, dawns }, reached, kills, time, taken (upgrade ids in order), bought }
export function drawScreen(ctx, art, view, screen, info) {
  const { w, h } = view, ui = art.ui;
  ctx.globalAlpha = screen === 'title' ? 0.35 : 0.55;
  ctx.fillStyle = ui.night;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
  const blink = Math.floor(info.time * 2) % 2 === 0;
  if (screen === 'title') {
    text(ctx, 'LAST LIGHT', w / 2, h * 0.3, ui.text, 24, 'center');
    text(ctx, 'Hold the cabin until dawn.', w / 2, h * 0.3 + 32, ui.dim, 8, 'center');
    if (blink) text(ctx, 'Click to start', w / 2, h * 0.62, ui.text, 8, 'center');
    const best = info.best.dawns > 0 ? `Dawns seen: ${info.best.dawns}` : info.best.hour > 0 ? `Best night: ${HOURS[info.best.hour]}` : '';
    if (best) text(ctx, best, w / 2, h * 0.62 + 14, ui.dim, 8, 'center');
    text(ctx, 'WASD move  Mouse aim  Click shoot  R reload', w / 2, h - 30, ui.dim, 8, 'center');
    text(ctx, '1/2 guns  F flare  E charm  Shift run  Esc pause  M mute', w / 2, h - 18, ui.dim, 8, 'center');
  } else if (screen === 'dead') {
    text(ctx, "You didn't see the dawn", w / 2, h * 0.32, ui.hurt, 16, 'center');
    text(ctx, `It was ${NIGHT.hours[Math.min(info.reached, NIGHT.hours.length - 1)]}.  ${fellText(info.kills)}.`, w / 2, h * 0.32 + 24, ui.dim, 8, 'center');
    if (info.bought > 0) drawTaken(ctx, art, w, Math.round(h * 0.32 + 38), info.taken, info.bought);
    if (blink) text(ctx, 'Click to try again', w / 2, h * 0.62, ui.text, 8, 'center');
  } else if (screen === 'dawn') {
    text(ctx, 'Dawn', w / 2, h * 0.3, ui.text, 24, 'center');
    text(ctx, `You held the cabin.  ${fellText(info.kills)}.`, w / 2, h * 0.3 + 30, ui.dim, 8, 'center');
    if (info.bought > 0) drawTaken(ctx, art, w, Math.round(h * 0.3 + 44), info.taken, info.bought);
    if (blink) text(ctx, 'Click for another night', w / 2, h * 0.62, ui.text, 8, 'center');
  }
}
```

`last-light/bench.js` (the full file now):
```js
// Times the renderer on a busy late-night frame at 480x270 in Node: 30 creatures, their eyes showing
// through walls (the Mother's eye, the worst case), 3 flares, 20 embers and 3 charms on the snow (each
// lighting it), the lantern, falling snow; then the same looking all the way down (the most snow to
// draw), and inside the cabin looking all the way up (the most rafters). `npm run bench`. The target is under 4 ms a
// frame. Not a test, because timings vary from machine to machine.
import { parseMap } from './src/map.js';
import { chooseView } from './src/view.js';
import { buildShades } from './src/shade.js';
import { createLightmap, bakeStatic, beginLight, addLight } from './src/lightmap.js';
import { createRenderer, TEX } from './src/render.js';
import { LIGHT, VIEW, EMBERS, CHARMS } from './src/tuning.js';

const map = parseMap();
const colors = Array.from({ length: 48 }, (_, i) => `#${((i * 2654435761) >>> 8).toString(16).padStart(6, '0').slice(0, 6)}`);
const shades = buildShades(colors, new Set([47, 48]));
const tex = (seed) => Uint8Array.from({ length: TEX * TEX }, (_, i) => 1 + ((i * 31 + seed * 17) % 46));
const art = {
  shades,
  walls: { trunks: tex(1), logs: tex(2), window: tex(3), woodpile: tex(4), wagonSide: tex(5), wagonEnd: tex(6) },
  floors: { snow: tex(7), planks: tex(8), rafters: tex(9) },
  sky: { w: 1024, h: 120, px: Uint8Array.from({ length: 1024 * 120 }, (_, i) => 1 + (i % 40)) },
  flake: 40,
};
const frame = { w: 28, h: 40, px: Uint8Array.from({ length: 28 * 40 }, (_, i) => (i % 7 === 0 ? 0 : i % 13 === 0 ? 47 : 1 + (i % 40))) };
const view = chooseView(480, 270, 1);
const renderer = createRenderer(art, map);
renderer.resize(view);
const lm = createLightmap(map);
const stove = map.props.find((p) => p.kind === 'stove');
bakeStatic(lm, map, [{ x: stove.x, y: stove.y, ...LIGHT.stove }]);

const sprites = [];
for (let i = 0; i < 30; i++) {
  const a = -0.7 + (i / 30) * 1.4, d = 2 + (i % 7);
  sprites.push({ x: 19.5 + Math.cos(Math.PI / 2 + a) * d, y: 22 + Math.sin(Math.PI / 2 + a) * d, height: 1, frame, flip: i % 2 === 0, glow: 15, xray: true });
}
const ember = { w: 10, h: 6, px: Uint8Array.from({ length: 60 }, (_, i) => (i % 6 === 0 ? 0 : i % 3 === 0 ? 47 : 48)) };
const embers = [];
for (let i = 0; i < 20; i++) {
  const x = 15.5 + (i % 5) * 2, y = 23.5 + Math.floor(i / 5) * 2;
  embers.push([x, y]);
  sprites.push({ x, y, height: 0.15, frame: ember, flip: false, glow: 15 });
}
const charm = { w: 8, h: 9, px: Uint8Array.from({ length: 72 }, (_, i) => (i % 4 === 0 ? 0 : i % 9 === 0 ? 47 : 1 + (i % 40))) };
const charms = [[18.5, 24.5], [21.5, 26.5], [16.5, 28.5]];
for (const [x, y] of charms) sprites.push({ x, y, height: 0.14, lift: 0.04, frame: charm, flip: false, glow: 15 });
const flares = [[17, 26], [22, 25], [20, 30]];
const f = { x: 19.5, y: 21, facing: Math.PI / 2, pitch: 0, bob: 0, map, lightmap: lm, skyLevel: 3, time: 0, sprites, spriteCount: sprites.length, snow: true };

function one(t) {
  f.time = t;
  f.facing = Math.PI / 2 + Math.sin(t) * 0.3;
  beginLight(lm, 0.04);
  addLight(lm, f.x, f.y, LIGHT.lantern.full, LIGHT.lantern.dark, LIGHT.lantern.intensity);
  for (const [x, y] of flares) addLight(lm, x, y, LIGHT.flare.full, LIGHT.flare.dark, LIGHT.flare.intensity);
  for (const [x, y] of embers) addLight(lm, x, y, EMBERS.light.full, EMBERS.light.dark, EMBERS.light.intensity);
  for (const [x, y] of charms) addLight(lm, x, y, CHARMS.light.full, CHARMS.light.dark, CHARMS.light.intensity);
  renderer.draw(f);
}
function time(label, x, y, pitch) {
  f.x = x;
  f.y = y;
  f.pitch = pitch;
  for (let i = 0; i < 100; i++) one(i / 60);
  const N = 600;
  const t0 = performance.now();
  for (let i = 0; i < N; i++) one(i / 60);
  const ms = (performance.now() - t0) / N;
  console.log(`${view.w}x${view.h}, ${label}: ${ms.toFixed(2)} ms a frame (target under 4 ms)`);
}
time('on the porch', 19.5, 21, 0);
time('looking down', 19.5, 21, -VIEW.maxPitch);
time('in the cabin looking up', 19.5, 16.5, VIEW.maxPitch);
```

- [ ] **Step 4: Run the tests and the benchmark**

Run: `cd last-light && npm test && npm run bench`
Expected: PASS, 265 tests; each of the benchmark's three lines under 4 ms (the prototype measured 3.15, 3.73 and 2.88 ms; this machine varies by about 20%).

- [ ] **Step 5: Commit**

```bash
git add last-light/src last-light/test last-light/bench.js
git commit -m "Last Light: charms on the snow and on your gun, the Mother's eye, and reading a charm"
```

## Task 5: The page: sounds, banners, the swing, and ?charm

**Files:**
- Modify, each as a full replacement:
  - `last-light/src/audio.js`, `game.js`, `main.js`
  - `last-light/test/audio.test.js`, `game.test.js`
- Modify: `README.md` (two edits)

**Interfaces:**
- **Consumes:** the events from Task 1, `CHARM_LIST`, `createState({ charm })`; `createSwing` from Task 4.
- **Produces:**
  - sounds for `charmDrop`, `charm` and `charmOut`;
  - banners: "A charm" / "Something glints where it fell." the first time in a session (after the Embers banner, if both are due); a charm's name and what it gives when you take it;
  - `createGame({ debug: { charm } })`, and `?charm=<key>` in the page's URL;
  - the page hands the HUD a swing, your facing, and the frame's time (0 while paused).

- [ ] **Step 1: Write the failing tests**

`last-light/test/audio.test.js` (the full file now):
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAudio } from '../src/audio.js';
import { fakeAudioContext } from './fake-audio.js';
import { quietState } from './helpers.js';
import { emit } from '../src/events.js';

function memoryStorage() {
  const m = new Map();
  return { get: (k) => (m.has(k) ? m.get(k) : null), set: (k, v) => m.set(k, String(v)) };
}

function withAudio(fn) {
  let ctx;
  globalThis.AudioContext = function () {
    ctx = fakeAudioContext();
    return ctx;
  };
  try {
    return fn(() => ctx);
  } finally {
    delete globalThis.AudioContext;
  }
}

test('every event type makes a sound without error', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    const s = quietState();
    const types = ['shot', 'dry', 'reload', 'switch', 'hit', 'hurt', 'windup', 'shriek', 'leap', 'birth', 'flareThrow', 'pickup', 'wave', 'dawn', 'dead', 'spawn', 'flareOut', 'lull', 'emberDrop', 'ember', 'emberOut', 'offer', 'upgrade', 'alight', 'charmDrop', 'charm', 'charmOut'];
    for (const type of types) {
      s.eventCount = 0;
      emit(s, type, 20, 25, type === 'hit' ? 1 : 0, 1);
      audio.events(s);
    }
    assert.ok(ctx().started.length > 20);
  }));

test('the score and the ambience play while a night is on', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    const s = quietState();
    s.night.phase = 'wave';
    s.night.wave = 7;
    const before = ctx().started.length;
    for (let i = 0; i < 20; i++) {
      ctx().currentTime += 0.1;
      audio.update(s, 0, 'playing');
    }
    assert.ok(ctx().started.length > before + 10);
  }));

test('a creature sound takes a free voice, or else the one playing farthest from you', () => {
  // Record the panners, which are the positional voices, in the order they're made.
  const panners = [];
  globalThis.AudioContext = function () {
    const ctx = fakeAudioContext(), make = ctx.createPanner;
    ctx.createPanner = () => {
      const p = make();
      panners.push(p);
      return p;
    };
    return ctx;
  };
  try {
    const audio = createAudio(memoryStorage());
    audio.start();
    const s = quietState(), p = s.player;
    const hitAt = (dx) => {
      s.eventCount = 0;
      emit(s, 'hit', p.x + dx, p.y, 0, 0);
      audio.events(s);
    };
    for (let i = 0; i < panners.length; i++) hitAt(1 + i); // every voice busy, the last one farthest
    assert.deepEqual(panners.map((v) => v.positionX.value - p.x), panners.map((_, i) => 1 + i));
    hitAt(0.5);
    assert.equal(panners.at(-1).positionX.value, p.x + 0.5, 'the farthest voice gives way');
    assert.equal(panners[0].positionX.value, p.x + 1, 'the nearest keeps playing');
  } finally {
    delete globalThis.AudioContext;
  }
});

test('mute and volume are remembered', () => {
  const storage = memoryStorage();
  const a = createAudio(storage);
  a.toggleMute();
  a.setVolume(0.3);
  const b = createAudio(storage);
  assert.equal(b.muted, true);
  assert.equal(b.volume, 0.3);
});

test('with no Web Audio at all, everything is silently a no-op', () => {
  const a = createAudio(memoryStorage());
  a.start();
  a.events(quietState());
  a.update(quietState(), 0, 'playing');
  a.toggleMute();
});
```

`last-light/test/game.test.js` (the full file now):
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game.js';
import { parseMap } from '../src/map.js';
import { NIGHT, DT, LIGHT } from '../src/tuning.js';
import { startWave, LAST_WAVE } from '../src/night.js';
import { intents } from './helpers.js';
import { spawnCreature, CRAWLER, MOTHER } from '../src/creatures.js';
import { UPGRADE_LIST } from '../src/upgrades.js';
import { CHARM_LIST, EYE, WOLF } from '../src/charms.js';

function memoryStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return { m, get: (k) => (m.has(k) ? m.get(k) : null), set: (k, v) => m.set(k, String(v)) };
}
const map = parseMap();

test('title, then a night; pause and resume', () => {
  const g = createGame({ storage: memoryStorage(), map, seed: 1 });
  assert.equal(g.screen, 'title');
  g.newNight();
  assert.equal(g.screen, 'playing');
  g.pause();
  assert.equal(g.screen, 'paused');
  const t = g.state.tick;
  g.tick(intents());
  assert.equal(g.state.tick, t, 'nothing moves while paused');
  g.resume();
  g.tick(intents());
  assert.equal(g.state.tick, t + 1);
});

test('the wave banner shows the hour', () => {
  const g = createGame({ storage: memoryStorage(), map, seed: 1 });
  g.newNight();
  for (let i = 0; i < (NIGHT.dusk + 0.1) / DT; i++) g.tick(intents());
  assert.equal(g.banner.text, '9 PM');
  assert.ok(g.banner.t > 0);
});

test('dying shows the death screen after a moment, and saves the best hour', () => {
  const storage = memoryStorage();
  const g = createGame({ storage, map, seed: 1 });
  g.newNight();
  startWave(g.state, 3);
  g.state.player.health = 0.5;
  for (let i = 0; i < 90 / DT && g.screen === 'playing'; i++) g.tick(intents());
  assert.equal(g.screen, 'dead');
  assert.equal(g.best.hour, 3);
  assert.equal(storage.get('last-light-best'), '3');
});

test('the dawn counts, and a worse night never lowers the best', () => {
  const storage = memoryStorage({ 'last-light-best': '8', 'last-light-dawns': '2' });
  const g = createGame({ storage, map, seed: 1 });
  assert.deepEqual(g.best, { hour: 8, dawns: 2 });
  g.newNight();
  startWave(g.state, LAST_WAVE);
  g.state.night.qi = g.state.night.qn;
  g.state.creatures.forEach((c) => (c.alive = false));
  for (let i = 0; i < (LIGHT.dawnTime + 3) / DT; i++) g.tick(intents());
  assert.equal(g.screen, 'dawn');
  assert.deepEqual(g.best, { hour: 8, dawns: 3 });
  assert.equal(storage.get('last-light-dawns'), '3');
});

test('a click starts the next night only once the death or dawn screen has been up for 2.5 s', () => {
  const frames = (g, seconds) => {
    for (let t = 0; t < seconds; t += 1 / 60) g.frame(1 / 60);
  };
  // Death: the screen comes up a moment after you fall.
  const d = createGame({ storage: memoryStorage(), map, seed: 1 });
  d.newNight();
  startWave(d.state, 3);
  d.state.player.health = 0.5;
  for (let i = 0; i < 90 / DT && d.screen === 'playing'; i++) d.tick(intents());
  assert.equal(d.screen, 'dead');
  assert.equal(d.canContinue, false, 'not the moment the death screen shows');
  frames(d, 2.4);
  assert.equal(d.canContinue, false);
  frames(d, 0.2);
  assert.equal(d.canContinue, true);
  // Dawn: its screen comes up 10 s into the sunrise, and the guard still starts from there.
  const g = createGame({ storage: memoryStorage(), map, seed: 1 });
  g.newNight();
  startWave(g.state, LAST_WAVE);
  g.state.night.qi = g.state.night.qn;
  g.state.creatures.forEach((c) => (c.alive = false));
  for (let i = 0; i < 20 / DT && g.screen !== 'dawn'; i++) g.tick(intents());
  assert.equal(g.screen, 'dawn');
  assert.equal(g.canContinue, false, 'not the moment the dawn screen shows');
  frames(g, 2.4);
  assert.equal(g.canContinue, false);
  frames(g, 0.2);
  assert.equal(g.canContinue, true);
  g.newNight();
  assert.equal(g.canContinue, false, 'playing again');
});

test('junk in storage is ignored', () => {
  const g = createGame({ storage: memoryStorage({ 'last-light-best': 'lots', 'last-light-dawns': '-4' }), map });
  assert.deepEqual(g.best, { hour: 0, dawns: 0 });
});

test('?wave= and ?god reach the night', () => {
  const g = createGame({ storage: memoryStorage(), map, debug: { wave: 7, god: true } });
  g.newNight();
  assert.equal(g.state.night.wave, 7);
  assert.equal(g.state.god, true);
});

test('embers: the first one of the session gets a banner, once; an upgrade shows its name', () => {
  const g = createGame({ storage: memoryStorage(), map, seed: 1 });
  g.newNight();
  const s = g.state;
  spawnCreature(s, CRAWLER, 19.5, 26.5);
  g.tick(intents({ facing: Math.PI / 2, fire: true }));
  assert.deepEqual([g.banner.text, g.banner.sub], ['Embers', 'Take them before they cool.']);
  g.banner.t = 0;
  g.newNight();
  spawnCreature(g.state, CRAWLER, 19.5, 26.5);
  g.tick(intents({ facing: Math.PI / 2, fire: true }));
  assert.equal(g.banner.t, 0, 'not again in the same session');
  const t = g.state;
  t.night.phase = 'lull';
  t.night.t = 1e9;
  t.carried = 6;
  t.player.x = t.stove.x;
  t.player.y = t.stove.y + 1;
  g.tick(intents());
  const id = t.offer[0];
  g.tick(intents({ pick: 1 }));
  assert.deepEqual([g.banner.text, g.banner.sub], [UPGRADE_LIST[id].name, UPGRADE_LIST[id].line]);
});

test('embers: the first banner waits until the live one is in its last second', () => {
  const g = createGame({ storage: memoryStorage(), map, seed: 1 });
  g.newNight();
  const s = g.state;
  spawnCreature(s, CRAWLER, 19.5, 26.5);
  g.banner.text = '9 PM';
  g.banner.sub = 'x';
  g.banner.t = 3;
  g.tick(intents({ facing: Math.PI / 2, fire: true }));
  assert.equal(g.banner.text, '9 PM', 'the opening banner is not cut off');
  g.frame(2.1);
  g.tick(intents());
  assert.deepEqual([g.banner.text, g.banner.sub], ['Embers', 'Take them before they cool.']);
});

test('the first lull asks for embers at the stove', () => {
  const g = createGame({ storage: memoryStorage(), map, seed: 1 });
  g.newNight();
  const s = g.state;
  startWave(s, 0);
  for (const c of s.creatures) c.alive = false;
  s.night.qi = s.night.qn; // the 9 PM wave, all out and all dead
  g.tick(intents());
  assert.equal(s.night.phase, 'lull');
  assert.equal(g.banner.sub, 'Bring embers to the stove.');
});

test('charms: the first one of the session gets a banner, after the Embers one; a charm taken shows its name', () => {
  const g = createGame({ storage: memoryStorage(), map, seed: 1 });
  g.newNight();
  const s = g.state;
  s.perks.pierce = true; // one round through both: a crawler's ember and the Mother's charm drop together
  spawnCreature(s, CRAWLER, 19.5, 23.5);
  spawnCreature(s, MOTHER, 19.5, 26.5).hp = 1; // she always drops hers
  g.tick(intents({ facing: Math.PI / 2, fire: true }));
  assert.ok(s.charms.some((c) => c.id === EYE));
  assert.equal(g.banner.text, 'Embers', 'the Embers banner first');
  g.banner.t = 0.5;
  g.tick(intents());
  assert.deepEqual([g.banner.text, g.banner.sub], ['A charm', 'Something glints where it fell.']);
  g.banner.t = 0;
  g.newNight();
  spawnCreature(g.state, MOTHER, 19.5, 26.5).hp = 1;
  g.tick(intents({ facing: Math.PI / 2, fire: true }));
  g.tick(intents());
  assert.equal(g.banner.t, 0, 'not again in the same session');
  const t = g.state;
  t.night.phase = 'lull';
  t.night.t = 1e9;
  const c = t.charms.find((o) => o.id === EYE);
  t.player.x = c.x;
  t.player.y = c.y;
  g.tick(intents());
  g.tick(intents({ take: 1 }));
  assert.deepEqual([g.banner.text, g.banner.sub], [CHARM_LIST[EYE].name, CHARM_LIST[EYE].gives]);
});

test('"Embers come to you" and ?embers= reach each new night', () => {
  const g = createGame({ storage: memoryStorage(), map, debug: { embers: 40 } });
  g.gentle = true;
  g.newNight();
  assert.deepEqual([g.state.gentle, g.state.carried], [true, 40]);
});

test('?charm= starts each night wearing that charm', () => {
  const g = createGame({ storage: memoryStorage(), map, debug: { charm: WOLF } });
  g.newNight();
  assert.equal(g.state.charm, WOLF);
  g.newNight();
  assert.equal(g.state.charm, WOLF);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd last-light && npm test`
Expected: FAIL: no charm banners, and `?charm=` doesn't reach the night. (The audio test may already pass, since an unknown event plays nothing.)

- [ ] **Step 3: Write the code**

`last-light/src/audio.js` (the full file now):
```js
// All of Last Light's sound, made live with Web Audio (there are no audio files).
//   - Creatures are positional (HRTF): you hear where they are in the dark. At most 12 positional
//     voices play at once; a new sound takes a free voice, or the one playing farthest away.
//   - Around you: wind (quieter under the roof), the stove crackling near it, your footsteps.
//   - Guns crack and echo off the trees; the score (music.js) is scheduled a little ahead.
// Browsers only allow sound after a click, so start() is called from inside the click that starts a
// night (main.js). M mutes; the volume and mute are remembered.
import { layersFor, notesAt, midiToHz, STEP, DAWN } from './music.js';
import { FEEL, RIFLE } from './tuning.js';

const MUTE_KEY = 'last-light-muted', VOLUME_KEY = 'last-light-volume';
const VOICES = 12;
const AHEAD = 0.2; // seconds of music scheduled ahead

export function createAudio(storage) {
  let ctx = null, master = null, music = null, sfx = null, echo = null, noise = null;
  let wind = null, windGain = null, stoveGain = null;
  let voices = [];
  let muted = storage.get(MUTE_KEY) === '1';
  let volume = Number(storage.get(VOLUME_KEY) ?? 0.8);
  if (!(volume >= 0 && volume <= 1)) volume = 0.8;
  let nextStep = 0, stepAt = 0, dawnAt = -1, lastWalked = 0, heartAt = 0, idleAt = 0, crackleAt = 0;

  const level = () => (muted ? 0 : volume);

  function start() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return;
    }
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = level();
    master.connect(ctx.destination);
    music = ctx.createGain();
    music.gain.value = 0.5;
    music.connect(master);
    sfx = ctx.createGain();
    sfx.connect(master);
    // The echo off the treeline: a filtered feedback delay the guns send into.
    echo = ctx.createDelay(1);
    echo.delayTime.value = 0.21;
    const fb = ctx.createGain(), tone = ctx.createBiquadFilter();
    fb.gain.value = 0.32;
    tone.type = 'lowpass';
    tone.frequency.value = 1400;
    echo.connect(tone).connect(fb).connect(echo);
    tone.connect(sfx);
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // Wind: looping noise through a slowly breathing low-pass.
    wind = ctx.createBufferSource();
    wind.buffer = noise;
    wind.loop = true;
    const wf = ctx.createBiquadFilter();
    wf.type = 'lowpass';
    wf.frequency.value = 420;
    windGain = ctx.createGain();
    windGain.gain.value = 0;
    const lfo = ctx.createOscillator(), depth = ctx.createGain();
    lfo.frequency.value = 0.09;
    depth.gain.value = 180;
    lfo.connect(depth).connect(wf.frequency);
    wind.connect(wf).connect(windGain).connect(sfx);
    wind.start();
    lfo.start();
    stoveGain = ctx.createGain();
    stoveGain.gain.value = 0;
    stoveGain.connect(sfx);
    voices = Array.from({ length: VOICES }, () => {
      const panner = ctx.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = 1;
      panner.rolloffFactor = 1.3;
      panner.maxDistance = 40;
      const gain = ctx.createGain();
      gain.connect(panner).connect(sfx);
      return { panner, gain, until: 0, x: 0, y: 0 };
    });
    nextStep = 0;
    stepAt = ctx.currentTime + 0.1;
  }

  // Sets a panner or listener position (Safari only has setPosition).
  function place(node, x, y) {
    if (node.positionX) {
      node.positionX.value = x;
      node.positionY.value = 0;
      node.positionZ.value = y;
    } else node.setPosition(x, 0, y);
  }

  // A positional voice for a sound lasting `len` seconds at (x, y); null before start(). Plain loops,
  // since it runs for every creature sound: the first free voice, else the one farthest from (lx, ly).
  function voiceAt(x, y, len, lx, ly) {
    if (!ctx) return null;
    const now = ctx.currentTime;
    let v = null;
    for (let i = 0; i < voices.length && !v; i++) if (voices[i].until <= now) v = voices[i];
    if (!v) {
      let far = -1;
      for (let i = 0; i < voices.length; i++) {
        const o = voices[i], dx = o.x - lx, dy = o.y - ly, d = Math.sqrt(dx * dx + dy * dy);
        if (d > far) {
          far = d;
          v = o;
        }
      }
    }
    v.until = now + len;
    v.x = x;
    v.y = y;
    place(v.panner, x, y);
    return v.gain;
  }

  // Building blocks. Each plays into `out` starting at time t.
  function burst(out, t, { len, type = 'bandpass', freq = 1000, q = 1, vol = 1, to }) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + len);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    src.connect(f).connect(g).connect(out);
    src.start(t, Math.random() * 1.5, len + 0.05);
    return g;
  }
  function tone(out, t, { len, type = 'sine', freq = 220, to, vol = 0.5, attack = 0.005, vib = 0 }) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + len);
    if (vib) {
      const l = ctx.createOscillator(), dg = ctx.createGain();
      l.frequency.value = 7;
      dg.gain.value = vib;
      l.connect(dg).connect(o.frequency);
      l.start(t);
      l.stop(t + len);
    }
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + len + 0.05);
    return g;
  }

  const CRY = [640, 260, 900, 140]; // death-cry pitch by kind
  const GROWL = [0, 75, 0, 48];

  // Plays the sounds for one update's events. (lx, ly) is where you are.
  function events(state) {
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime, p = state.player, lx = p.x, ly = p.y;
    for (let i = 0; i < state.eventCount; i++) {
      const e = state.events[i];
      switch (e.type) {
        case 'shot':
          if (e.a === 0) {
            const k = state.gun.interval / RIFLE.interval; // the lever works quicker with Quick lever
            burst(sfx, t, { len: 0.09, freq: 1500, q: 0.7, vol: 0.9 }).connect(echo);
            tone(sfx, t, { len: 0.16, freq: 110, to: 38, vol: 0.9 });
            burst(sfx, t + 0.2 * k, { len: 0.03, type: 'highpass', freq: 2800, vol: 0.4 }); // lever
            burst(sfx, t + 0.31 * k, { len: 0.03, type: 'highpass', freq: 2200, vol: 0.4 });
          } else {
            burst(sfx, t, { len: 0.4, type: 'lowpass', freq: 1800, to: 300, vol: 1 }).connect(echo);
            tone(sfx, t, { len: 0.25, freq: 80, to: 30, vol: 1 });
          }
          break;
        case 'dry':
          burst(sfx, t, { len: 0.02, type: 'highpass', freq: 3000, vol: 0.3 });
          break;
        case 'reload':
          burst(sfx, t, { len: 0.03, freq: 2000, q: 3, vol: 0.35 });
          burst(sfx, t + 0.05, { len: 0.03, freq: 1400, q: 3, vol: 0.3 });
          break;
        case 'switch':
          burst(sfx, t, { len: 0.18, freq: 600, to: 1600, q: 0.8, vol: 0.15 });
          break;
        case 'hit': {
          const g = voiceAt(e.x, e.y, 0.9, lx, ly);
          burst(g, t, { len: 0.08, type: 'lowpass', freq: 500, vol: 0.9 });
          if (e.b) tone(g, t + 0.02, { len: 0.7, type: 'sawtooth', freq: CRY[e.a], to: CRY[e.a] * 0.35, vol: 0.35, vib: 18 });
          break;
        }
        case 'hurt':
          burst(sfx, t, { len: 0.12, type: 'lowpass', freq: 350, vol: 1 });
          tone(sfx, t, { len: 0.2, freq: 120, to: 70, vol: 0.5 });
          break;
        case 'windup': {
          const g = voiceAt(e.x, e.y, 0.7, lx, ly);
          tone(g, t, { len: 0.6, type: 'sawtooth', freq: GROWL[e.a] || 70, to: (GROWL[e.a] || 70) * 1.3, vol: 0.5, attack: 0.1, vib: 6 });
          break;
        }
        case 'shriek': {
          const g = voiceAt(e.x, e.y, 0.5, lx, ly);
          tone(g, t, { len: 0.45, type: 'sawtooth', freq: 600, to: 1500, vol: 0.4, attack: 0.03, vib: 40 });
          break;
        }
        case 'leap':
          burst(voiceAt(e.x, e.y, 0.3, lx, ly), t, { len: 0.25, freq: 400, to: 1200, vol: 0.5 });
          break;
        case 'birth':
          burst(voiceAt(e.x, e.y, 0.6, lx, ly), t, { len: 0.5, type: 'lowpass', freq: 250, to: 120, vol: 1 });
          break;
        case 'flareThrow':
          burst(sfx, t, { len: 0.2, freq: 900, to: 300, vol: 0.2 });
          burst(voiceAt(e.x, e.y, 0.6, lx, ly), t + 0.3, { len: 0.5, type: 'highpass', freq: 2500, vol: 0.6 });
          break;
        case 'pickup':
          tone(sfx, t, { len: 0.3, freq: 880, vol: 0.2 });
          tone(sfx, t + 0.08, { len: 0.4, freq: 1320, vol: 0.15 });
          break;
        case 'emberDrop': {
          // A soft crackle where it fell.
          const g = voiceAt(e.x, e.y, 0.4, lx, ly);
          for (let k = 0; k < 3; k++) burst(g, t + k * 0.06, { len: 0.03, type: 'highpass', freq: 3000 + k * 900, vol: 0.25 });
          break;
        }
        case 'ember':
          // A warm tick, higher for a bigger ember.
          tone(sfx, t, { len: 0.12, type: 'triangle', freq: 520 + 140 * e.a, vol: 0.18 });
          burst(sfx, t, { len: 0.04, freq: 2400, q: 2, vol: 0.12 });
          break;
        case 'emberOut':
          burst(voiceAt(e.x, e.y, 0.5, lx, ly), t, { len: 0.4, type: 'highpass', freq: 5000, to: 2500, vol: 0.12 });
          break;
        case 'offer':
          // The fire draws its three: a low whoosh.
          burst(sfx, t, { len: 0.6, type: 'lowpass', freq: 300, to: 900, vol: 0.45 });
          break;
        case 'upgrade':
          tone(sfx, t, { len: 0.5, type: 'triangle', freq: 660, vol: 0.25 });
          tone(sfx, t + 0.12, { len: 0.7, type: 'triangle', freq: 990, vol: 0.2 });
          break;
        case 'alight':
          burst(voiceAt(e.x, e.y, 0.5, lx, ly), t, { len: 0.45, type: 'lowpass', freq: 600, to: 1800, vol: 0.6 });
          break;
        case 'charmDrop': {
          // A thin glassy chime where it fell, so one heard dropping out in the dark can be found.
          const g = voiceAt(e.x, e.y, 1.2, lx, ly);
          tone(g, t, { len: 1.1, freq: 1976, vol: 0.2, attack: 0.002 });
          tone(g, t + 0.07, { len: 0.9, freq: 2637, vol: 0.12, attack: 0.002 });
          break;
        }
        case 'charm':
          // Taken: a low bell, with a sour note under it.
          for (const [freq, vol] of [[147, 0.35], [156, 0.25], [405, 0.1]]) tone(sfx, t, { len: 1.6, freq, vol, attack: 0.01 });
          break;
        case 'charmOut':
          tone(voiceAt(e.x, e.y, 0.8, lx, ly), t, { len: 0.7, freq: 1760, to: 880, vol: 0.08 });
          break;
        case 'wave': {
          // A bell tolls the hour.
          for (const [ratio, vol] of [[1, 0.5], [2.76, 0.2], [5.4, 0.1]]) tone(sfx, t, { len: 3, freq: 98 * ratio, vol, attack: 0.01 });
          break;
        }
        case 'dawn':
          dawnAt = t + 0.5;
          break;
        case 'dead':
          tone(sfx, t, { len: 3, type: 'sawtooth', freq: 55, to: 30, vol: 0.4, attack: 0.3 });
          break;
      }
    }
  }

  function playNote(layer, n, t, len) {
    const out = music;
    switch (layer) {
      case 'drone':
        tone(out, t, { len: len * STEP, type: 'sawtooth', freq: midiToHz(n.note), vol: n.vel * 0.12, attack: 1.5 });
        break;
      case 'pulse':
        tone(out, t, { len: 0.25, freq: 55, to: 35, vol: n.vel * 0.8 });
        break;
      case 'strings':
      case 'choir':
        tone(out, t, { len: len * STEP, type: layer === 'strings' ? 'sawtooth' : 'triangle', freq: midiToHz(n.note), vol: n.vel * 0.1, attack: 0.8, vib: 2 });
        break;
      case 'musicbox':
        tone(out, t, { len: 1.6, freq: midiToHz(n.note), vol: n.vel * 0.4 });
        tone(out, t, { len: 0.8, freq: midiToHz(n.note) * 3.01, vol: n.vel * 0.06 });
        break;
      case 'ticks':
        burst(out, t, { len: 0.03, type: 'highpass', freq: 6000, vol: n.vel * 0.25 });
        break;
      case 'toms':
        tone(out, t, { len: 0.35, freq: midiToHz(n.note), to: midiToHz(n.note) * 0.6, vol: n.vel * 0.6 });
        break;
      case 'brass':
        tone(out, t, { len: len * STEP * 0.8, type: 'sawtooth', freq: midiToHz(n.note), vol: n.vel * 0.25, attack: 0.04 });
        break;
    }
  }

  // Called every frame: moves the listener, keeps the ambience right, schedules the score.
  function update(state, facing, screen) {
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime, p = state.player, L = ctx.listener;
    place(L, p.x, p.y);
    const fx = Math.cos(facing), fz = Math.sin(facing);
    if (L.forwardX) {
      L.forwardX.value = fx;
      L.forwardY.value = 0;
      L.forwardZ.value = fz;
      L.upX.value = 0;
      L.upY.value = 1;
      L.upZ.value = 0;
    } else L.setOrientation(fx, 0, fz, 0, 1, 0);

    const playing = screen === 'playing';
    const phase = state.night.phase;
    const indoors = state.map.roofed[Math.floor(p.y) * state.map.w + Math.floor(p.x)] === 1;
    const windTo = !playing ? 0.05 : (phase === 'lull' ? 0.5 : 0.3) * (indoors ? 0.35 : 1);
    windGain.gain.setTargetAtTime(windTo, t, 0.5);
    const sx = state.stove ? state.stove.x - p.x : 0, sy = state.stove ? state.stove.y - p.y : 0;
    const sd = state.stove ? Math.sqrt(sx * sx + sy * sy) : 99;
    stoveGain.gain.setTargetAtTime(playing ? Math.max(0, 1 - sd / 6) * 0.5 : 0, t, 0.3);
    if (!playing) return;

    // The stove's crackle, a click at a time.
    if (sd < 6 && t >= crackleAt) {
      crackleAt = t + 0.05 + Math.random() * 0.25;
      burst(stoveGain, t, { len: 0.02 + Math.random() * 0.03, type: 'highpass', freq: 1500 + Math.random() * 3000, vol: 0.3 + Math.random() * 0.5 });
    }
    // Footsteps: a crunch every 0.9 cells.
    if (p.walked - lastWalked > 0.9) {
      lastWalked = p.walked;
      burst(sfx, t, { len: 0.08, type: indoors ? 'bandpass' : 'lowpass', freq: indoors ? 300 : 700 + Math.random() * 300, vol: 0.18 });
    } else if (p.walked < lastWalked) lastWalked = p.walked;
    // A heartbeat when you're low.
    if (p.health > 0 && p.health <= FEEL.lowHealth && t >= heartAt) {
      heartAt = t + 0.9;
      tone(sfx, t, { len: 0.12, freq: 60, to: 40, vol: 0.6 });
      tone(sfx, t + 0.18, { len: 0.12, freq: 55, to: 38, vol: 0.4 });
    }
    // Now and then a nearby creature makes its sound: a skitter, a breath, a chitter, a moan.
    if (t >= idleAt) {
      idleAt = t + 0.3 + Math.random() * 0.8;
      let c = null, best = 10;
      for (const o of state.creatures) {
        if (!o.alive || o.dying) continue;
        const ox = o.x - p.x, oy = o.y - p.y, d = Math.sqrt(ox * ox + oy * oy) + Math.random() * 4;
        if (d < best) {
          best = d;
          c = o;
        }
      }
      if (c) {
        const g = voiceAt(c.x, c.y, 0.9, p.x, p.y);
        if (c.kind === 0) for (let k = 0; k < 4; k++) burst(g, t + k * 0.05, { len: 0.02, type: 'highpass', freq: 2500, vol: 0.4 });
        else if (c.kind === 1) burst(g, t, { len: 0.8, freq: 380, q: 2, vol: 0.5 });
        else if (c.kind === 2) for (let k = 0; k < 6; k++) tone(g, t + k * 0.04, { len: 0.03, type: 'square', freq: 1800, vol: 0.08 });
        else tone(g, t, { len: 1.2, type: 'sawtooth', freq: 45, to: 38, vol: 0.5, attack: 0.3, vib: 3 });
      }
    }
    // The score: every step due in the next AHEAD seconds.
    if (stepAt < t) stepAt = t + 0.02;
    const layers = layersFor(phase, state.night.wave);
    while (stepAt < t + AHEAD) {
      for (const layer of layers) for (const n of notesAt(layer, nextStep)) playNote(layer, n, stepAt, n.len);
      if (dawnAt >= 0) {
        const since = Math.round((stepAt - dawnAt) / STEP);
        for (const d of DAWN) if (d.step === since) playNote(d.voice, { note: d.note, vel: 0.9 }, stepAt, d.len);
        if (since > 40) dawnAt = -1;
      }
      nextStep++;
      stepAt += STEP;
    }
  }

  return {
    start,
    events,
    update,
    get muted() {
      return muted;
    },
    get volume() {
      return volume;
    },
    setVolume(v) {
      volume = Math.max(0, Math.min(1, v));
      storage.set(VOLUME_KEY, volume);
      if (master) master.gain.setTargetAtTime(level(), ctx.currentTime, 0.02);
    },
    toggleMute() {
      muted = !muted;
      storage.set(MUTE_KEY, muted ? '1' : '0');
      if (master) master.gain.setTargetAtTime(level(), ctx.currentTime, 0.02);
    },
    suspend() {
      ctx?.suspend();
    },
    resume() {
      if (ctx?.state === 'suspended') ctx.resume();
    },
  };
}
```

`last-light/src/game.js` (the full file now):
```js
// The screens and the flow between them: title, playing, paused, dead, dawn. Owns the night being
// played, turns its events into banners, and remembers your best night: the latest hour you reached,
// and how many dawns you've seen. `gentle` ("Embers come to you", from the pause menu) goes into each
// new night, and so does ?charm= (debug.charm), the charm you start wearing.
import { createState, step } from './sim.js';
import { NIGHT, LIGHT, DT } from './tuning.js';
import { LAST_WAVE } from './night.js';
import { UPGRADE_LIST } from './upgrades.js';
import { CHARM_LIST } from './charms.js';

const BEST_KEY = 'last-light-best', DAWNS_KEY = 'last-light-dawns';
const DEAD_DELAY = 1.5; // seconds between dying and the death screen
const DAWN_DELAY = LIGHT.dawnTime + 2;
const CLICK_GUARD = 2.5; // seconds the death or dawn screen is up before a click starts the next night
// A line under some hours' banners.
const WAVE_LINES = ['The after-eaters are coming out of the trees.', '', 'Something leaps in the dark.', '', '', '', '', 'Something huge is coming.'];

export function createGame({ storage, map, seed = Date.now(), debug = {} }) {
  let nextSeed = seed >>> 0;
  const readInt = (k) => {
    const v = Number.parseInt(storage.get(k) ?? '0', 10);
    return Number.isFinite(v) && v >= 0 ? v : 0;
  };
  const game = {
    screen: 'title',
    state: null,
    best: { hour: Math.min(readInt(BEST_KEY), LAST_WAVE + 1), dawns: readInt(DAWNS_KEY) },
    banner: { text: '', sub: '', t: 0 },
    hitT: 9,
    endT: 0, // seconds of the night since you died or the sun came up: its screen follows after a delay
    shownT: 0, // seconds the death or dawn screen has been up
    saved: false,
    gentle: false, // "Embers come to you"
    taught: false, // the first ember of the session has had its banner
    embersDue: false, // the first ember has dropped; its banner waits for the one showing to fade
    charmTaught: false, // the first charm of the session has had its banner
    charmDue: false, // the first charm has dropped; its banner waits its turn too

    newNight() {
      game.state = createState({ seed: nextSeed++, wave: debug.wave ?? 0, god: !!debug.god, gentle: game.gentle, embers: debug.embers ?? 0, charm: debug.charm ?? -1, map });
      game.screen = 'playing';
      game.endT = 0;
      game.shownT = 0;
      game.saved = false;
      game.banner.t = 0;
      game.embersDue = false;
      game.charmDue = false;
    },
    pause() {
      if (game.screen === 'playing') game.screen = 'paused';
    },
    resume() {
      if (game.screen === 'paused') game.screen = 'playing';
    },
    quit() {
      game.screen = 'title';
      game.state = null;
    },
    // True while the night keeps running under the screen (playing, and the dawn's afterglow).
    get running() {
      return game.state !== null && (game.screen === 'playing' || game.screen === 'dawn');
    },
    // True once the death or dawn screen has been up long enough that a click starts the next night,
    // so a panicked click doesn't skip it.
    get canContinue() {
      return (game.screen === 'dead' || game.screen === 'dawn') && game.shownT >= CLICK_GUARD;
    },

    // One 120 Hz update.
    tick(intents) {
      if (!game.running) return;
      const s = game.state;
      step(s, intents);
      for (let i = 0; i < s.eventCount; i++) {
        const e = s.events[i];
        if (e.type === 'hit') game.hitT = 0;
        else if (e.type === 'wave') show(NIGHT.hours[e.a], WAVE_LINES[e.a] ?? '', 3);
        else if (e.type === 'lull' && e.a === 1) show('', 'Bring embers to the stove.', 3);
        else if (e.type === 'pickup' && e.a === 2) show('Shotgun', '1 and 2 switch guns', 3);
        else if (e.type === 'emberDrop' && !game.taught) game.embersDue = true;
        else if (e.type === 'upgrade') show(UPGRADE_LIST[e.a].name, UPGRADE_LIST[e.a].line, 2.5);
        else if (e.type === 'charmDrop' && !game.charmTaught) game.charmDue = true;
        else if (e.type === 'charm') show(CHARM_LIST[e.a].name, CHARM_LIST[e.a].gives, 2.5);
      }
      // The first ember's banner waits for whatever banner is showing to fade, so it never cuts off
      // the night's opening line.
      if (game.embersDue && game.banner.t <= 1) {
        game.embersDue = false;
        game.taught = true;
        show('Embers', 'Take them before they cool.', 3);
      } else if (game.charmDue && game.banner.t <= 1) {
        game.charmDue = false;
        game.charmTaught = true;
        show('A charm', 'Something glints where it fell.', 3);
      }
      const phase = s.night.phase;
      if (phase === 'dead' || phase === 'dawn') {
        game.endT += DT;
        if (!game.saved) save(s);
        if (phase === 'dead' && game.endT >= DEAD_DELAY) endScreen('dead');
        if (phase === 'dawn' && game.endT >= DAWN_DELAY) endScreen('dawn');
      }
    },
    // Once a frame: timers for the banner, the hit tick and the end screens.
    frame(dt) {
      if (game.banner.t > 0) game.banner.t -= dt;
      game.hitT += dt;
      if ((game.screen === 'dead' || game.screen === 'dawn') && game.state) game.shownT += dt;
    },
  };

  function endScreen(screen) {
    if (game.screen === screen) return;
    game.screen = screen;
    game.shownT = 0;
  }

  function show(text, sub, t) {
    game.banner.text = text;
    game.banner.sub = sub;
    game.banner.t = t;
  }

  function save(s) {
    game.saved = true;
    const reached = s.night.reached;
    if (reached > game.best.hour) {
      game.best.hour = reached;
      storage.set(BEST_KEY, reached);
    }
    if (s.night.phase === 'dawn') {
      game.best.dawns++;
      storage.set(DAWNS_KEY, game.best.dawns);
    }
  }

  return game;
}
```

`last-light/src/main.js` (the full file now):
```js
// Boot, the loop, and the wiring between input, the game, the renderer, the HUD and sound.
//
// The world updates at a fixed 120 Hz; frames draw on requestAnimationFrame at the display's rate,
// blending between the last two updates. The renderer draws into a pixel buffer at internal
// resolution that an ImageData shares (no copy), the HUD goes on top with the 2D context, and the
// result is scaled up by a whole number in one drawImage.
//
// Debug (URL): ?debug=fps shows frame times; ?debug=bot plays by itself (&speed=N runs N updates per
// update); the flags combine with a comma (?debug=bot,fps). ?wave=N starts at wave N (1-8); ?god
// means you can't die; ?seed=N fixes the night; ?embers=N starts each night carrying N embers;
// ?charm=wolf (or thread, crow, salt, hare, eye) starts each night wearing that charm. With any of them,
// window.__lastlight exposes the game, and window.__lastlightPerf the frame timing
// ({ frameMs, updates }), for the browser checks.
import { createInput } from './input.js';
import { createClock } from './clock.js';
import { createAudio } from './audio.js';
import { createGame } from './game.js';
import { loadArt } from './assets.js';
import { safeStorage } from './storage.js';
import { parseMap } from './map.js';
import { chooseView } from './view.js';
import { createRenderer } from './render.js';
import { createLightmap, bakeStatic } from './lightmap.js';
import { createScene, buildFrame, sceneEvents } from './scene.js';
import { drawHud, drawScreen, createSwing } from './hud.js';
import { createBot, botIntents } from './bot.js';
import { createState } from './sim.js';
import { CHARM_LIST } from './charms.js';
import { LIGHT, MOUSE, DT } from './tuning.js';

// The module is running, so the page's "couldn't start" message will never be needed.
document.getElementById('nostart')?.remove();

const params = new URLSearchParams(location.search);
const debugFlags = new Set((params.get('debug') ?? '').split(',').filter(Boolean));
const int = (v, lo, hi, d) => {
  const n = Number.parseInt(v ?? '', 10);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};
const debug = {
  fps: debugFlags.has('fps'),
  bot: debugFlags.has('bot'),
  god: params.has('god'),
  wave: int(params.get('wave'), 1, 8, 1) - 1,
  embers: int(params.get('embers'), 0, 999, 0),
  charm: CHARM_LIST.findIndex((c) => c.key === params.get('charm')),
};
const speed = debug.bot ? int(params.get('speed'), 1, 20, 1) : 1;
const seed = params.has('seed') ? int(params.get('seed'), 0, 2 ** 31, 1) : Date.now();
const anyDebug = debug.fps || debug.bot || debug.god || params.has('wave') || params.has('seed') || params.has('embers') || params.has('charm');

const canvas = document.getElementById('game');
const message = (title, detail) => {
  const m = document.getElementById('message');
  m.querySelector('strong').textContent = title;
  m.querySelector('span').textContent = detail;
  m.hidden = false;
};

const touchOnly = matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches;
if (touchOnly && !debug.bot) {
  document.getElementById('phone').hidden = false;
} else {
  boot().catch((err) => {
    console.error(err);
    message("Last Light couldn't load its art.", 'Check your connection, then reload the page.');
  });
}

async function boot() {
  const storage = safeStorage();
  const audio = createAudio(storage);
  const input = createInput(window, document);
  input.element = canvas;
  const sens = Number(storage.get('last-light-sensitivity') ?? 1);
  input.sensitivity = sens >= MOUSE.minScale && sens <= MOUSE.maxScale ? sens : 1;
  const map = parseMap();
  const game = createGame({ storage, map, seed, debug });
  game.gentle = storage.get('last-light-gentle') === '1';
  if (anyDebug) window.__lastlight = game;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const [art] = await Promise.all([
    loadArt(),
    document.fonts.load('8px Silkscreen').catch((err) => console.warn('Silkscreen not loaded; using the fallback font', err)),
  ]);
  const renderer = createRenderer(art, map);
  const scene = createScene(art);
  const lightmap = createLightmap(map);
  const stove = map.props.find((p) => p.kind === 'stove');
  bakeStatic(lightmap, map, [{ x: stove.x, y: stove.y, ...LIGHT.stove }]);
  const titleState = createState({ seed: 7, map }); // the backdrop behind the title screen
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  const off = document.createElement('canvas');
  const octx = off.getContext('2d');
  let view, image;

  function fit() {
    view = chooseView(innerWidth, innerHeight, devicePixelRatio || 1);
    canvas.width = view.dw;
    canvas.height = view.dh;
    off.width = view.w;
    off.height = view.h;
    renderer.resize(view);
    image = new ImageData(new Uint8ClampedArray(renderer.buffer.buffer), view.w, view.h);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = art.ui.night;
    ctx.fillRect(0, 0, view.dw, view.dh);
  }
  fit();
  addEventListener('resize', fit);

  // The pause menu (a plain HTML form over the canvas).
  const pause = document.getElementById('pause');
  const sensInput = document.getElementById('sensitivity'), volInput = document.getElementById('volume');
  const muteInput = document.getElementById('mute'), note = document.getElementById('pause-note');
  const gentleInput = document.getElementById('gentle');
  // The slider runs 0-100 for 0.25x-4x, evenly in ratio (50 is 1x).
  sensInput.value = String(Math.round((Math.log(input.sensitivity / MOUSE.minScale) / Math.log(MOUSE.maxScale / MOUSE.minScale)) * 100));
  volInput.value = String(Math.round(audio.volume * 100));
  muteInput.checked = audio.muted;
  gentleInput.checked = game.gentle;
  sensInput.addEventListener('input', () => {
    input.sensitivity = MOUSE.minScale * (MOUSE.maxScale / MOUSE.minScale) ** (Number(sensInput.value) / 100);
    storage.set('last-light-sensitivity', input.sensitivity.toFixed(3));
  });
  volInput.addEventListener('input', () => audio.setVolume(Number(volInput.value) / 100));
  muteInput.addEventListener('change', () => {
    if (muteInput.checked !== audio.muted) audio.toggleMute();
  });
  // "Embers come to you": for this night at once, and every night after.
  gentleInput.addEventListener('change', () => {
    game.gentle = gentleInput.checked;
    if (game.state) game.state.gentle = game.gentle;
    storage.set('last-light-gentle', game.gentle ? '1' : '0');
  });
  const showPause = (show) => {
    pause.hidden = !show;
    note.hidden = true;
    muteInput.checked = audio.muted;
  };
  // A refused pointer lock (Chrome: too soon after Esc; the next click works) says so where you are: on
  // the pause menu by its Resume button, and otherwise over the title or end screen.
  const lockNote = document.getElementById('lock-note');
  const lockRefused = () => {
    if (!pause.hidden) note.hidden = false;
    else lockNote.hidden = false;
  };
  const lockOrExplain = async () => {
    if (!(await input.lock())) lockRefused();
  };
  document.addEventListener('pointerlockerror', lockRefused);
  document.getElementById('resume').addEventListener('click', lockOrExplain);
  document.getElementById('quit').addEventListener('click', () => {
    game.quit();
    showPause(false);
  });

  const clock = createClock();
  let bot = createBot();
  const start = () => {
    game.newNight();
    input.facing = game.state.player.facing;
    input.pitch = 0;
    input.releaseAll();
    bot = createBot();
    clock.reset();
  };
  // A click on the canvas starts a night (and the sound, which browsers only allow from a click).
  canvas.addEventListener('click', () => {
    audio.start();
    if (debug.bot) {
      if (game.screen !== 'playing') start();
    } else if (!input.locked) lockOrExplain();
  });
  // With the mouse still locked on the death or dawn screen, a click starts the next night (once the
  // screen has been up a moment). That click is only the start: it doesn't reach input as a shot.
  canvas.addEventListener('mousedown', (e) => {
    if (!input.locked || !game.canContinue) return;
    e.stopPropagation();
    start();
  });
  document.addEventListener('pointerlockchange', () => {
    if (input.locked) {
      lockNote.hidden = true;
      showPause(false);
      if (game.screen === 'paused') {
        game.resume();
        input.releaseAll();
        clock.reset();
      } else if (game.screen === 'title') start();
    } else if (game.screen === 'playing') {
      game.pause();
      showPause(true);
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (game.screen === 'playing' && !debug.bot) {
        game.pause();
        showPause(true);
      }
      audio.suspend();
    } else audio.resume();
  });
  if (debug.bot) start(); // sound waits for a click, as browsers require

  let time = 0, last = null;
  const perf = { frameMs: 0, updates: 0 };
  if (anyDebug) window.__lastlightPerf = perf;
  const frameView = { facing: 0, pitch: 0, alpha: 0, time: 0, dt: 0, reducedMotion: false, h: 0, focal: 0 };
  const hudInfo = { time: 0, hitT: 0, banner: game.banner, reducedMotion: false, swing: createSwing(), facing: 0, dt: 0 };
  const screenInfo = { time: 0, best: game.best, reached: 0, kills: 0, taken: null, bought: 0 };
  const loop = (now) => {
    try {
      const t0 = performance.now();
      const dt = last === null ? 0 : Math.min(0.1, (now - last) / 1000);
      last = now;
      time += dt;
      if (input.takeUI().mute) {
        audio.toggleMute();
        muteInput.checked = audio.muted; // the pause menu's box, if it's open, follows M
      }
      const n = game.running ? clock.advance(now) * speed : 0;
      for (let i = 0; i < n; i++) {
        game.tick(debug.bot ? botIntents(game.state, bot, DT) : input.sample());
        audio.events(game.state);
        sceneEvents(scene, game.state);
      }
      perf.updates = n;
      game.frame(dt);
      draw(dt);
      perf.frameMs = perf.frameMs * 0.9 + (performance.now() - t0) * 0.1;
    } catch (err) {
      // An error stops the loop with a message, rather than freezing without a word.
      console.error(err);
      message('Something went wrong.', 'Reload the page to play again.');
      return;
    }
    requestAnimationFrame(loop);
  };

  function draw(dt) {
    const s = game.state ?? titleState;
    const facing = !game.state ? Math.PI / 2 + Math.sin(time * 0.07) * 0.8 : debug.bot ? bot.facing : input.facing;
    const alpha = game.running ? clock.alpha : 1;
    frameView.facing = facing;
    frameView.pitch = !game.state ? 0 : debug.bot ? bot.pitch : input.pitch;
    frameView.alpha = alpha;
    frameView.time = time;
    frameView.dt = dt;
    frameView.reducedMotion = reducedMotion.matches;
    frameView.h = view.h;
    frameView.focal = view.focal;
    const f = buildFrame(scene, s, lightmap, frameView);
    renderer.draw(f);
    octx.putImageData(image, 0, 0);
    if (game.state && (game.screen === 'playing' || game.screen === 'paused')) {
      hudInfo.time = time;
      hudInfo.hitT = game.hitT;
      hudInfo.reducedMotion = frameView.reducedMotion;
      hudInfo.facing = facing;
      hudInfo.dt = game.screen === 'playing' ? dt : 0; // paused, the charm on your gun holds still
      drawHud(octx, art, s, view, hudInfo);
    } else if (game.screen !== 'paused') {
      screenInfo.time = time;
      screenInfo.reached = s.night.reached;
      screenInfo.kills = s.stats.kills;
      screenInfo.taken = s.taken;
      screenInfo.bought = s.bought;
      drawScreen(octx, art, view, game.screen, screenInfo);
    }
    if (debug.fps) {
      octx.font = '8px Silkscreen, monospace';
      octx.textAlign = 'left';
      octx.textBaseline = 'top';
      octx.fillStyle = '#ffffff';
      octx.fillText(`${perf.frameMs.toFixed(2)} ms  ${perf.updates} upd  ${view.w}x${view.h} x${view.scale}`, 4, 4);
    }
    if (scene.shakeX || scene.shakeY || view.ox > 0) ctx.fillRect(0, 0, view.dw, view.dh);
    ctx.drawImage(off, view.ox + scene.shakeX * view.scale, view.oy + scene.shakeY * view.scale, view.w * view.scale, view.h * view.scale);
    audio.update(s, facing, game.screen);
  }
  requestAnimationFrame(loop);
}
```

- [ ] **Step 4: The README (two edits to `README.md`)**

**Edit 1.** Find:
```markdown
`last-light/` is a first-person survival horror game: you hold a snowy log cabin through one winter night, from dusk to dawn, against the after-eaters, pale starved things that come out of the trees. It's pixel art drawn by a raycaster. The design spec is `docs/superpowers/specs/2026-09-24-last-light-design.md`. The after-eaters drop embers that you spend at the stove on upgrades ("Dark harvest": `docs/superpowers/specs/2026-09-25-last-light-dark-harvest-design.md`).
```
Replace with:
```markdown
`last-light/` is a first-person survival horror game: you hold a snowy log cabin through one winter night, from dusk to dawn, against the after-eaters, pale starved things that come out of the trees. It's pixel art drawn by a raycaster. The design spec is `docs/superpowers/specs/2026-09-24-last-light-design.md`. The after-eaters drop embers that you spend at the stove on upgrades ("Dark harvest": `docs/superpowers/specs/2026-09-25-last-light-dark-harvest-design.md`), and sometimes a charm that gives you something and takes something ("Cursed charms": `docs/superpowers/specs/2026-09-26-last-light-cursed-charms-design.md`).
```

**Edit 2.** Find:
```markdown
- Debug: `?debug=fps` shows the frame rate, and `?debug=bot` plays by itself (add `&speed=N` to speed it up). Debug flags combine with a comma: `?debug=bot,fps`. `?wave=N` (1–8) starts at that wave, `?god` means you can't die, `?seed=N` fixes the night's randomness, and `?embers=N` starts each night carrying N embers. For example, `?debug=bot,fps&god&speed=20&seed=2` watches a whole night play out fast.
```
Replace with:
```markdown
- Debug: `?debug=fps` shows the frame rate, and `?debug=bot` plays by itself (add `&speed=N` to speed it up). Debug flags combine with a comma: `?debug=bot,fps`. `?wave=N` (1–8) starts at that wave, `?god` means you can't die, `?seed=N` fixes the night's randomness, `?embers=N` starts each night carrying N embers, and `?charm=wolf` (or `thread`, `crow`, `salt`, `hare`, `eye`) starts each night wearing that charm. For example, `?debug=bot,fps&god&speed=20&seed=2` watches a whole night play out fast.
```

- [ ] **Step 5: Run the tests to see them pass**

Run: `cd last-light && npm test`
Expected: PASS, 267 tests.

- [ ] **Step 6: Commit**

```bash
git add last-light/src last-light/test README.md
git commit -m "Last Light: sounds and banners for charms, the swing on the page, and ?charm"
```

## Task 6: Release (the controller does this; there's no implementer)

- The final whole-branch review, its fixes, and a scoped re-review.
- The checks:
  - `cd last-light && npm test` and `npm run bench`;
  - `cd site && npm test`;
  - the art loop leaves the tree clean;
  - a browser check: `?debug=bot&god&speed=20&seed=2` plays to dawn with no console errors, and `?charm=eye`, a charm's reading and the charm swinging on each gun look right.
- Merge to `main`: fetch and merge `origin/main` first, fast-forward only, never force. Push, and check that GitHub Pages builds the new commit.

## Self-review notes (for the executor)

- Spec coverage: §1's six charms are Task 1 (rules) and Task 4 (the lantern and the eyes on screen). §2's dropping, fading, reading, taking and gentle drift are Task 1, the reading on screen is Task 4, and the teaching banner is Task 5. §3's display is Task 4 (the charm on your gun too, with its art in Task 3 and the page's part in Task 5), the sound is Task 5, and the art is Tasks 2 and 3. §5's tests are spread across the tasks as listed there.
- Types: `state.charm` and slot ids are numbers (-1 for none) throughout. `dropCharm` takes a kind's name ('gaunt'), not its index. A charm point is `[x, y]` relative to the bottom centre of the view, like a frame's `(ox, oy)`.
