// The music shop's screen, as plain state: which item is chosen, what the card under it says, what
// Enter does, what you hear while you try things (and the loop you try the loop pedal with), and what
// a click lands on. Pure, so it's tested in Node; main.js runs it and render.js draws it.
import { STOCK, PEDALS, owns } from './gear.js';
import { createLoop } from './looper.js';

// The card along the bottom of the shop, and the button on it: [x, y, w, h] in scene pixels.
export const CARD = [4, 138, 312, 38];
export const BUTTON = [262, 159, 48, 13];

// The pedals on the rack come first (the loop pedal last of them), then the instruments on their
// stands, so the arrow keys move along the rack and then along the floor. soldAt: the page time of
// the last sale (the shopkeeper nods). loop: while the loop pedal is chosen, the loop you try it with
// (looper.js), which main.js plays over the band; null otherwise.
export function createShop() {
  return { at: 0, soldAt: -Infinity, loop: null };
}

export const chosen = (shop) => STOCK[shop.at];

// Chooses the item at index `at` in the stock. Choosing the loop pedal starts an empty loop to try it
// with; choosing anything else throws that loop away.
export function choose(shop, at) {
  shop.at = at;
  if (chosen(shop).kind !== 'loop') shop.loop = null;
  else shop.loop ??= createLoop();
}

// The arrow keys: one item left (-1) or right (1), round from the last back to the first.
export function move(shop, dir) {
  choose(shop, (shop.at + dir + STOCK.length) % STOCK.length);
}

// What Enter does for the chosen item: { act: 'buy' | 'play', id }, or null when there's nothing to do.
export function action(shop, gear) {
  const item = chosen(shop);
  if (!owns(gear, item.id)) return gear.savings >= item.price ? { act: 'buy', id: item.id } : null;
  if (item.kind === 'instrument' && gear.instrument !== item.id) return { act: 'play', id: item.id };
  return null;
}

// The card's words for the chosen item: its name, its price (or 'yours'), a line about it, what
// Enter will do, and the button's word (null for no button).
export function card(shop, gear) {
  const item = chosen(shop), mine = owns(gear, item.id), act = action(shop, gear);
  let says;
  if (!mine) says = act ? 'Enter to buy' : `Not enough coins yet (you have ${gear.savings})`;
  else if (item.kind === 'pedal') says = `On your board: key ${item.key}`;
  else if (item.kind === 'loop') says = 'On your board: R';
  else says = act ? 'Enter to play it' : "You're playing it";
  return { name: item.name, price: mine ? 'yours' : `${item.price} coins`, about: item.about, says, button: act?.act ?? null };
}

// What you hear in the shop: a chosen instrument in place of yours, or a chosen pedal switched on
// over your board. Moving on (or leaving) puts your own setup back.
export function trying(shop, gear) {
  const item = chosen(shop);
  return {
    instrument: item.kind === 'instrument' ? item.id : gear.instrument,
    on: PEDALS.filter((id) => id === item.id || gear.on.includes(id)),
  };
}

const inside = ([x, y, w, h], px, py) => px >= x && px < x + w && py >= y && py < y + h;

// What a click at scene point (px, py) lands on: { hit: 'item', at } (an index into the stock),
// { hit: 'button' } (only while the card has one), { hit: 'door' }, or null.
// layout: sprites.json's shop data, { items: { id: [x, y, w, h] }, door: [x, y, w, h] }.
export function hit(layout, shop, gear, px, py) {
  if (inside(BUTTON, px, py) && action(shop, gear)) return { hit: 'button' };
  if (inside(CARD, px, py)) return null;
  if (inside(layout.door, px, py)) return { hit: 'door' };
  const at = STOCK.findIndex((item) => inside(layout.items[item.id], px, py));
  return at < 0 ? null : { hit: 'item', at };
}
