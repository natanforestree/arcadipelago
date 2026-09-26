// Cursed charms: an after-eater sometimes drops a charm where it dies (creatures.js calls dropCharm).
// Each gives something and takes something. You stand over one to read it, and E takes it; you wear
// one at a time, so the one you wore drops where you stand. A charm on the snow lies there until the
// next wave begins. Drops draw from their own random stream (state.charmRng), so a night where you
// never take one plays exactly as it would without them. What a charm does is read where it matters:
// weapons, creatures, embers, the player, the night and the scene look at state.charm.
import { CHARMS, LIGHT, PERKS, PLAYER } from './tuning.js';
import { nextRandom } from './rng.js';
import { emit } from './events.js';
import { isSolid } from './map.js';

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
// free, at random. It lands beside the creature's ember, a little towards you, unless that's in a wall.
// Returns the charm on the snow, or null.
export function dropCharm(state, kind, x, y) {
  const chance = CHARMS.drop[kind];
  if (!(chance > 0)) return null;
  const roll = nextRandom(state.charmRng), which = nextRandom(state.charmRng);
  if (roll >= chance) return null;
  let n = 0;
  for (let id = 0; id < CHARM_COUNT; id++) if (CHARM_LIST[id].from === kind && free(state, id)) pool[n++] = id;
  if (n === 0) return null;
  let c = null;
  for (const o of state.charms) {
    if (o.id < 0) {
      c = o;
      break;
    }
  }
  if (c === null) return null; // can't happen: there's a slot for every charm
  const p = state.player, dx = p.x - x, dy = p.y - y, d = Math.sqrt(dx * dx + dy * dy);
  if (d > CHARMS.beside) {
    const bx = x + (dx / d) * CHARMS.beside, by = y + (dy / d) * CHARMS.beside;
    if (!isSolid(state.map, Math.floor(bx), Math.floor(by))) {
      x = bx;
      y = by;
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
      if (d - step <= stop) {
        c.settled = true;
        // It drifts through anything, so it could come to rest in a wall: then it settles at your feet.
        if (isSolid(state.map, Math.floor(c.x), Math.floor(c.y))) {
          c.x = p.x;
          c.y = p.y;
        }
      }
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
