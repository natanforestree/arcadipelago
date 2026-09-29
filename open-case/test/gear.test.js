import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STOCK, PEDALS, INSTRUMENTS, ACOUSTIC, freshGear, loadGear, saveGear, earn, buy, play, stomp, owns } from '../src/gear.js';
import { SHOP } from '../src/tuning.js';

function memoryStorage() {
  const m = new Map();
  return { m, get: (k) => (m.has(k) ? m.get(k) : null), set: (k, v) => m.set(k, String(v)) };
}
const withSavings = (savings) => ({ ...freshGear(), savings });

test('the stock: five pedals on keys 2 to 6 in chain order, then the instruments, priced from tuning.js', () => {
  assert.deepEqual(PEDALS, ['overdrive', 'chorus', 'tremolo', 'delay', 'reverb']);
  assert.deepEqual(PEDALS.map((id) => STOCK.find((s) => s.id === id).key), [2, 3, 4, 5, 6]);
  assert.deepEqual(INSTRUMENTS, [ACOUSTIC, 'ukulele', 'electric', 'epiano', 'synth']);
  for (const item of STOCK) if (item.id !== ACOUSTIC) assert.equal(item.price, SHOP[item.id].price, item.id);
  assert.equal(STOCK.reduce((sum, item) => sum + item.price, 0), 950, 'the whole stock costs 950 coins');
  for (const item of STOCK) assert.ok(item.name && item.about.length <= 48, `${item.id}: a name, and a line that fits the card`);
});

test('a fresh start: no savings, the acoustic guitar, no pedals', () => {
  assert.deepEqual(loadGear(memoryStorage()), { savings: 0, owned: [], instrument: ACOUSTIC, on: [] });
});

test("a set's coins go into your savings, and what you own survives a reload", () => {
  const s = memoryStorage();
  const gear = loadGear(s);
  earn(gear, 12);
  earn(gear, 130);
  buy(gear, 'ukulele');
  buy(gear, 'delay');
  stomp(gear, 'delay');
  saveGear(s, gear);
  assert.deepEqual(loadGear(s), { savings: 12, owned: ['delay', 'ukulele'], instrument: 'ukulele', on: ['delay'] });
  assert.deepEqual([...s.m.keys()].sort(), ['open-case-gear', 'open-case-savings']);
});

test("you can't overspend, buy the same thing twice, or buy what isn't for sale", () => {
  const gear = withSavings(100);
  assert.equal(buy(gear, 'delay'), true);
  assert.equal(gear.savings, 30);
  assert.equal(buy(gear, 'reverb'), false, '80 coins, with 30 saved');
  assert.equal(buy(gear, 'delay'), false, 'already yours');
  earn(gear, 100);
  assert.equal(buy(gear, 'delay'), false, 'still yours');
  assert.equal(buy(gear, ACOUSTIC), false, 'the acoustic is yours already');
  assert.equal(buy(gear, 'banjo'), false);
  assert.deepEqual([gear.savings, gear.owned], [130, ['delay']]);
  assert.equal(buy(gear, 'reverb'), true);
  assert.equal(gear.savings, 50);
  earn(gear, -20);
  earn(gear, 2.7);
  assert.equal(gear.savings, 52, 'nothing but buying takes coins away');
});

test('a bought instrument becomes the one you play; a bought pedal goes on your board switched off', () => {
  const gear = withSavings(1000);
  buy(gear, 'electric');
  assert.equal(gear.instrument, 'electric');
  buy(gear, 'chorus');
  assert.deepEqual(gear.on, []);
  assert.equal(gear.instrument, 'electric');
});

test('you play an instrument you own, and go back to the acoustic whenever you like', () => {
  const gear = withSavings(1000);
  assert.equal(play(gear, 'synth'), false, 'not yours yet');
  buy(gear, 'synth');
  assert.equal(play(gear, 'synth'), false, 'already playing it');
  assert.equal(play(gear, ACOUSTIC), true);
  assert.equal(gear.instrument, ACOUSTIC);
  assert.equal(play(gear, 'overdrive'), false, 'a pedal is not an instrument');
  assert.ok(owns(gear, ACOUSTIC) && owns(gear, 'synth') && !owns(gear, 'epiano'));
});

test('a pedal key switches only a pedal you own, and pedals stay as you left them', () => {
  const s = memoryStorage();
  const gear = withSavings(1000);
  assert.equal(stomp(gear, 'reverb'), null, 'not yours: its key does nothing');
  buy(gear, 'reverb');
  buy(gear, 'overdrive');
  assert.equal(stomp(gear, 'reverb'), true);
  assert.equal(stomp(gear, 'overdrive'), true);
  assert.deepEqual(gear.on, ['overdrive', 'reverb'], 'in chain order');
  assert.equal(stomp(gear, 'overdrive'), false);
  assert.equal(stomp(gear, 'ukulele'), null, 'an instrument is not a pedal');
  saveGear(s, gear);
  assert.deepEqual(loadGear(s).on, ['reverb']);
});

test('a damaged save starts afresh, and what makes no sense in it is dropped', () => {
  const s = memoryStorage();
  s.set('open-case-savings', 'lots');
  s.set('open-case-gear', '{nope');
  assert.deepEqual(loadGear(s), freshGear());
  s.set('open-case-savings', '-40');
  s.set('open-case-gear', '[1, 2]');
  assert.deepEqual(loadGear(s), freshGear());
  s.set('open-case-savings', '75');
  s.set('open-case-gear', JSON.stringify({ owned: ['delay', 'banjo', 'delay', ACOUSTIC], instrument: 'synth', on: ['reverb', 'delay'] }));
  assert.deepEqual(loadGear(s), { savings: 75, owned: ['delay'], instrument: ACOUSTIC, on: ['delay'] });
  s.set('open-case-gear', JSON.stringify({ owned: 'delay', on: 7 }));
  assert.deepEqual(loadGear(s), { ...freshGear(), savings: 75 });
});
