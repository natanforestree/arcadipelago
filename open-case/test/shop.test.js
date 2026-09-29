import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createShop, chosen, move, action, card, trying, hit, CARD, BUTTON } from '../src/shop.js';
import { STOCK, ACOUSTIC, freshGear, buy, stomp, play } from '../src/gear.js';

const withSavings = (savings) => ({ ...freshGear(), savings });
const at = (id) => STOCK.findIndex((s) => s.id === id);
const shopOn = (id) => ({ ...createShop(), at: at(id) });

test('the arrow keys move along the stock and wrap round it', () => {
  const shop = createShop();
  assert.equal(chosen(shop).id, 'overdrive', 'the rack comes first');
  move(shop, -1);
  assert.equal(chosen(shop).id, 'synth', 'left from the first is the last');
  move(shop, 1);
  move(shop, 1);
  assert.equal(chosen(shop).id, 'chorus');
  for (let i = 0; i < STOCK.length; i++) move(shop, 1);
  assert.equal(chosen(shop).id, 'chorus', 'all the way round');
});

test("the card: something you can afford, something you can't yet, and a pedal that's yours", () => {
  const gear = withSavings(35);
  assert.deepEqual(card(shopOn('overdrive'), gear), {
    name: 'Overdrive', price: '40 coins', about: 'Warm grit, more of it the harder you pick.',
    says: 'Not enough coins yet (you have 35)', button: null,
  });
  assert.equal(action(shopOn('overdrive'), gear), null);
  gear.savings = 40;
  assert.equal(card(shopOn('overdrive'), gear).says, 'Enter to buy');
  assert.equal(card(shopOn('overdrive'), gear).button, 'buy');
  assert.deepEqual(action(shopOn('overdrive'), gear), { act: 'buy', id: 'overdrive' });
  buy(gear, 'overdrive');
  assert.deepEqual(card(shopOn('overdrive'), gear), {
    name: 'Overdrive', price: 'yours', about: 'Warm grit, more of it the harder you pick.', says: 'On your board: key 2', button: null,
  });
  assert.equal(action(shopOn('overdrive'), gear), null);
});

test("the card: an instrument you own is played with Enter, and says so when you're playing it", () => {
  const gear = withSavings(500);
  assert.equal(card(shopOn(ACOUSTIC), gear).says, "You're playing it");
  assert.equal(card(shopOn(ACOUSTIC), gear).price, 'yours');
  buy(gear, 'epiano');
  assert.equal(card(shopOn('epiano'), gear).says, "You're playing it");
  assert.deepEqual(action(shopOn(ACOUSTIC), gear), { act: 'play', id: ACOUSTIC });
  assert.equal(card(shopOn(ACOUSTIC), gear).says, 'Enter to play it');
  assert.equal(card(shopOn(ACOUSTIC), gear).button, 'play');
  play(gear, ACOUSTIC);
  assert.equal(action(shopOn(ACOUSTIC), gear), null);
});

test('trying: a chosen pedal is on over your board, a chosen instrument replaces yours, and moving on puts yours back', () => {
  const gear = withSavings(500);
  buy(gear, 'reverb');
  stomp(gear, 'reverb');
  buy(gear, 'ukulele');
  const shop = shopOn('chorus');
  assert.deepEqual(trying(shop, gear), { instrument: 'ukulele', on: ['chorus', 'reverb'] });
  move(shop, 1);
  assert.deepEqual(trying(shop, gear), { instrument: 'ukulele', on: ['tremolo', 'reverb'] });
  shop.at = at('synth');
  assert.deepEqual(trying(shop, gear), { instrument: 'synth', on: ['reverb'] }, 'trying an instrument you do not own');
  shop.at = at('reverb');
  assert.deepEqual(trying(shop, gear), { instrument: 'ukulele', on: ['reverb'] }, 'your own pedal, already on');
});

test('a click chooses an item, presses the card button, or leaves by the door', () => {
  const layout = { items: Object.fromEntries(STOCK.map((s, i) => [s.id, [10 + i * 20, 40, 16, 20]])), door: [0, 20, 8, 80] };
  const gear = withSavings(45);
  const shop = createShop();
  assert.deepEqual(hit(layout, shop, gear, 32, 50), { hit: 'item', at: 1 });
  assert.deepEqual(hit(layout, shop, gear, 3, 60), { hit: 'door' });
  assert.equal(hit(layout, shop, gear, 300, 10), null, 'the bare wall');
  assert.deepEqual(hit(layout, shop, gear, BUTTON[0] + 2, BUTTON[1] + 2), { hit: 'button' }, 'overdrive: 40 coins, 45 saved');
  shop.at = at('delay');
  assert.equal(hit(layout, shop, gear, BUTTON[0] + 2, BUTTON[1] + 2), null, 'no button when there is nothing to do');
  assert.equal(hit(layout, shop, gear, CARD[0] + 2, CARD[1] + 2), null, 'the rest of the card');
});
