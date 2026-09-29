// Your savings and your gear: what the shop sells, what you own, the instrument you play and which of
// your pedals are on. The coins from each set go into your savings; buying is the only thing that
// spends them, and what you buy is yours for good. Kept in the browser through the safe storage
// wrapper (storage.js), and pure otherwise, so it's tested in Node.
import { SHOP } from './tuning.js';

// The guitar you start with. It isn't for sale, but it stands in the shop so you can go back to it.
export const ACOUSTIC = 'acoustic';

// Everything in the shop, in the order you move through it: the pedals on the rack, then the
// instruments on their stands. Each price and pedal key is from tuning.js.
export const STOCK = [
  { id: 'overdrive', kind: 'pedal', name: 'Overdrive', about: 'Warm grit, more of it the harder you pick.' },
  { id: 'chorus', kind: 'pedal', name: 'Chorus', about: 'A slow shimmer, like two guitars at once.' },
  { id: 'tremolo', kind: 'pedal', name: 'Tremolo', about: 'Your volume pulses on the 8th notes.' },
  { id: 'delay', kind: 'pedal', name: 'Delay', about: 'Echoes in time with the band, fading away.' },
  { id: 'reverb', kind: 'pedal', name: 'Reverb', about: 'A warm hall behind every note.' },
  { id: ACOUSTIC, kind: 'instrument', name: 'Acoustic guitar', about: 'The guitar you started out with.' },
  { id: 'ukulele', kind: 'instrument', name: 'Ukulele', about: 'Bright little strings that ring short.' },
  { id: 'electric', kind: 'instrument', name: 'Electric guitar', about: 'A clean tone that sings, through a small amp.' },
  { id: 'epiano', kind: 'instrument', name: 'Electric piano', about: 'A bell-like tone. Space is its sustain pedal.' },
  { id: 'synth', kind: 'instrument', name: 'Synth', about: 'A soft saw-wave lead. Space holds its notes.' },
].map((item) => ({ price: 0, key: null, ...item, ...SHOP[item.id] }));

export const stockItem = (id) => STOCK.find((item) => item.id === id) ?? null;
// The pedals in the order they chain, which is the order of their keys.
export const PEDALS = STOCK.filter((item) => item.kind === 'pedal').map((item) => item.id);
export const INSTRUMENTS = STOCK.filter((item) => item.kind === 'instrument').map((item) => item.id);

const SAVINGS_KEY = 'open-case-savings', GEAR_KEY = 'open-case-gear';

// { savings, owned: [ids, in the shop's order], instrument, on: [pedal ids, in chain order] }. A fresh
// start has no savings, the acoustic guitar and no pedals.
export function freshGear() {
  return { savings: 0, owned: [], instrument: ACOUSTIC, on: [] };
}

export const owns = (gear, id) => id === ACOUSTIC || gear.owned.includes(id);

// Reads your savings and gear. Whatever is unreadable or makes no sense starts afresh.
export function loadGear(storage) {
  const gear = freshGear();
  const savings = Number(storage.get(SAVINGS_KEY));
  if (Number.isSafeInteger(savings) && savings > 0) gear.savings = savings;
  let saved = null;
  try {
    saved = JSON.parse(storage.get(GEAR_KEY) ?? 'null');
  } catch {
    // unreadable: start afresh
  }
  if (!saved || typeof saved !== 'object') return gear;
  const listed = (list) => (Array.isArray(list) ? list : []);
  gear.owned = STOCK.filter((item) => item.id !== ACOUSTIC && listed(saved.owned).includes(item.id)).map((item) => item.id);
  if (INSTRUMENTS.includes(saved.instrument) && owns(gear, saved.instrument)) gear.instrument = saved.instrument;
  gear.on = PEDALS.filter((id) => owns(gear, id) && listed(saved.on).includes(id));
  return gear;
}

export function saveGear(storage, gear) {
  storage.set(SAVINGS_KEY, gear.savings);
  storage.set(GEAR_KEY, JSON.stringify({ owned: gear.owned, instrument: gear.instrument, on: gear.on }));
}

// A set's coins go into your savings.
export function earn(gear, coins) {
  gear.savings += Math.max(0, Math.floor(coins));
}

// Buys `id` if it's for sale, isn't yours yet, and you can afford it; returns whether it did. A bought
// instrument becomes the one you play; a bought pedal goes on your board, switched off.
export function buy(gear, id) {
  const item = stockItem(id);
  if (!item || owns(gear, id) || gear.savings < item.price) return false;
  gear.savings -= item.price;
  gear.owned = STOCK.filter((s) => s.id === id || gear.owned.includes(s.id)).map((s) => s.id);
  if (item.kind === 'instrument') gear.instrument = id;
  return true;
}

// Plays an instrument you own from now on; returns whether that changed anything.
export function play(gear, id) {
  if (!INSTRUMENTS.includes(id) || !owns(gear, id) || gear.instrument === id) return false;
  gear.instrument = id;
  return true;
}

// Switches one of your pedals on or off. Returns true if it's now on, false if it's now off, and null
// if it isn't yours (its key does nothing).
export function stomp(gear, id) {
  if (!PEDALS.includes(id) || !owns(gear, id)) return null;
  const on = !gear.on.includes(id);
  gear.on = PEDALS.filter((p) => (p === id ? on : gear.on.includes(p)));
  return on;
}
