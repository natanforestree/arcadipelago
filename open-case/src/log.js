// The test log: this computer remembers the last LOG_SIZE sets (the date, coins, how many stopped, the
// instrument played, the pedals that were on at any point, how many loop layers were recorded, the
// beat played, where, on One Tree Island the keepsake left, and whether Nathan chose Another set, Stop
// here, Visit the shop or Studio), under
// open-case-log in local storage; and the last LOG_SIZE things he bought, with their dates, under
// open-case-buys.
import { LOG_SIZE } from './tuning.js';

const KEY = 'open-case-log', BUYS = 'open-case-buys';

function readList(storage, key) {
  try {
    const list = JSON.parse(storage.get(key) ?? '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return []; // unreadable: start afresh
  }
}

export const readLog = (storage) => readList(storage, KEY);
export const readBuys = (storage) => readList(storage, BUYS);

// A set just ended: { date, coins, stopped, instrument, pedals, layers, beat, place }, and on the island
// keepsake (the id of the one left, or null). Its choice is filled in when a button is pressed.
export function logSet(storage, entry) {
  const list = readLog(storage);
  list.push({ ...entry, choice: null });
  storage.set(KEY, JSON.stringify(list.slice(-LOG_SIZE)));
}

// Something bought in the shop: { date, id, price }.
export function logBuy(storage, entry) {
  const list = readBuys(storage);
  list.push(entry);
  storage.set(BUYS, JSON.stringify(list.slice(-LOG_SIZE)));
}

// 'another', 'stop', 'shop' or 'studio', for the latest set.
export function logChoice(storage, choice) {
  const list = readLog(storage);
  if (!list.length) return;
  list[list.length - 1].choice = choice;
  storage.set(KEY, JSON.stringify(list));
}
