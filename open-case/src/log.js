// The test log: this computer remembers the last LOG_SIZE sets (the date, coins, how many stopped,
// and whether Nathan chose Another set or Stop here), under open-case-log in local storage.
import { LOG_SIZE } from './tuning.js';

const KEY = 'open-case-log';

export function readLog(storage) {
  try {
    const list = JSON.parse(storage.get(KEY) ?? '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return []; // unreadable: start afresh
  }
}

// A set just ended: { date, coins, stopped }. Its choice is filled in when a button is pressed.
export function logSet(storage, entry) {
  const list = readLog(storage);
  list.push({ ...entry, choice: null });
  storage.set(KEY, JSON.stringify(list.slice(-LOG_SIZE)));
}

// 'another' or 'stop', for the latest set.
export function logChoice(storage, choice) {
  const list = readLog(storage);
  if (!list.length) return;
  list[list.length - 1].choice = choice;
  storage.set(KEY, JSON.stringify(list));
}
