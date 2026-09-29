# Open Case Music Shop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the coins from each set as savings, and open a pixel-art music shop between sets where Nathan buys five pedals (stomped live on keys 2 to 6) and four instruments, with his gear shown by the crate and on a strip along the bottom of the screen.

**Architecture:** Two new pure modules hold the state. `gear.js` has the stock, the savings, what you own, the instrument you play and which pedals are on, kept through the safe storage wrapper. `shop.js` has the shop screen: the chosen item, the card's words, what Enter does, what you hear while trying, and what a click lands on. `audio.js` gains a voice for each instrument and a chain of five pedals between your instrument and the speakers. Two new Aseprite scripts (`gear.lua`, `shop.lua`) draw the gear and the shop into the same sprite sheet, `render.js` draws them, and `main.js` adds the shop screen after the end card and wires up the savings, the pedal keys, trying and buying. The crowd's rules don't change.

**Tech Stack:** Plain ES modules, Canvas 2D and Web Audio, Node 22 `node --test` (no dependencies), Aseprite 1.3 in batch mode for the art scripts.

**Spec:** `docs/superpowers/specs/2026-09-28-open-case-shop-design.md` (approved: "go ahead and continue with subagents.. i trust your judgement"). It builds on the game's design spec (`2026-09-28-open-case-design.md`) and the art spec (`2026-09-28-open-case-art-design.md`).

**Prototyped:** every file below was built and run before this plan was written, in a scratch copy of the repo. It was then replayed task by task, and each task's end state passes the whole suite:
- 165 Open Case tests (128 before), and the site's 70;
- the sprite sheet: 223 frames, 36 KB, rebuilt byte for byte.

Checked in Chrome:
- the end card, the shop, buying, trying, clicks;
- the park with every instrument, the pedals and the gear strip;
- the sound check.

Every sound was measured offline in Chrome: levels, echoes, no clipping. The code in each task is that prototype's code, so transcribe it exactly.

## Global Constraints

- Every commit message starts `Open Case: ` and ends with a blank line and then `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`, exactly that line, whatever model you are.
- Stage only the files your task names (`git add <paths>`), never `git add -A` or `git add .`.
- No new dependencies: plain ES modules, Node 22's `node --test`. Run the tests with `cd open-case && npm test`.
- Aseprite runs from the repo root: `/Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/<name>.lua`. The scripts are deterministic, so a second run leaves `git status` unchanged. Previews (`art/open-case/preview-*`) are never committed.
- Flat style: every area one solid colour from `art/open-case/palette.lua`, a base and at most one shadow per material, no outlines, no dithering, no half-clear pixels. The whole game's art stays within **64 colours** and **under 400 KB** (`sprites.png`, `sprites.json` and `icon.png` together).
- **Gear only changes how you sound.** `set.js`, `listen.js`, `crowd.js`, `groove.js` and `bots.js` never import `gear.js`, `shop.js` or `audio.js`. The rules, the tips and the bots don't change.
- **Every note sounds the instant its key goes down.** No key press makes samples: the keyboards are oscillators, and the guitars' samples are worked out ahead by `warm()`.
- **A stomp fades.** Switching a pedal changes its gains with `setTargetAtTime` and a time constant of at most 10 ms. Nothing jumps.
- **The pedal keys never change:** 2 overdrive, 3 chorus, 4 tremolo, 5 delay, 6 reverb. Key 1 stays the scale lock.
- Everything kept in the browser goes through `safeStorage` (`storage.js`): `open-case-savings`, `open-case-gear`, `open-case-buys`, and the existing `open-case-log`.
- Bot sets (`?bot`) never earn savings, change your gear or touch the log. `?coins=N` keeps nothing.
- The positions from the art repaint stay:
  - you sit at `CROWD.playerX` 136;
  - passers-by walk at `PATH_Y` 146;
  - listeners stand at `CROWD.spots`;
  - coins land at `CASE` (161, 160);
  - notes float up from `GUITAR` (152, 128).
- Plain words in comments and messages, in the style of the surrounding code.

## Review Focus

These are the inputs the spec implies but doesn't spell out that are most likely to bite someone playing. Each has a test or a check in the task that owns the code:

1. **Enter held down in the shop.** Key repeat must not buy a second thing. Test: Task 2's "Enter buys, once however long it is held".
2. **A damaged or hand-edited save**, such as savings of "lots", a gear list naming things that aren't for sale, or pedals on that aren't owned. The game starts afresh or drops what makes no sense. Test: Task 1's "a damaged save starts afresh".
3. **Trying instruments while a key is held.** Moving the choice in the shop switches instrument mid-note: the held note carries on and stops when its key comes up. Test: Task 3's "changing instrument".
4. **`?coins=N` touching Nathan's real save or log.** It must keep nothing. Code: Task 6's `keep()` and `logBuy` guard. Check: Task 7's Chrome check reads local storage after buying.
5. **Every pedal on, with a hard strum.** No clipping, and the echoes die away rather than build. Test: Task 3's "the delay … fades over three or four repeats". Check: Task 7's offline measurement (the prototype peaked at −10.4 dB).

## Decisions made while prototyping

Each fills in something the spec left open. The reviewer should hold the code to these:

- **The acoustic guitar stands in the shop too**, not for sale, so you can choose it again: the stock has ten items. The arrow keys run along the rack (the five pedals), then along the floor (acoustic, ukulele, electric, electric piano, synth), and wrap round.
- **The chosen item** is drawn lifted 2 px with its colours a step lighter (its `item-<id>-1` frame), and a small gold pointer over it. A rack pedal's light is lit while you can hear it, when it's tried or on.
- **The card** has four lines:
  1. name and price ('yours' in green once owned);
  2. the one-line description;
  3. what Enter does;
  4. "arrows choose   esc back to the park".

  The button (`BUTTON` in `shop.js`) says 'buy' or 'play', and shows only when Enter would do something.
- **Tags:** each item has a small price tag (yellow), or a green one once it's yours, hanging off its top-right corner.
- **The shopkeeper** (grey bun, round glasses, mustard cardigan) breathes, and nods for 1.2 s after a sale. The counter is its own frame, drawn over her.
- **Your pedals by the crate** are a row of five little stompboxes in front of it, between the looper and the case: pedal i's top-left is at (117 + 6i, 160). Each pedal has its own place. The amp (with the electric guitar) stands left of the crate, behind the looper.
- **You with each instrument:** the frames are `you-<instrument>-idle-0/1` and `you-<instrument>-play-0/1/2` for all five instruments, and the acoustic's old `you-idle`/`you-strum` frames are renamed.
  - The ukulele and the electric guitar are held like the acoustic.
  - The keyboards stand on an X over your lap, and your hands press the left, both, then the right.
- **The gear strip:** pedal i's icon is at x 106 + 16i on row 170, with its key in light (on) or grey (off). This places it between "lock" and the pigeons. An icon that's off is in the pedal's shadow colour. The name of the pedal just stomped ("delay on") shows above the strip for 1 s, on the page's clock, so it works between sets and in the shop.
- **The title card** has a line for the pedal keys: "2-6 your pedals (from the shop)".
- **The sounds:**
  - Each instrument's voicing is in `audio.js`'s `VOICING`.
  - The guitars are Karplus-Strong strings: the ukulele rings 1.5 s, the electric 6 s with brighter highs (`stretch`). Only the instrument you play keeps its samples.
  - The electric piano is a sine bent by a sine at its pitch, fading by itself. The synth is two detuned saws and a square an octave down, through an opening filter, holding while its key (or Space) does.
  - Levels were measured: at pick 3, each instrument's first 0.3 s is within about 2 dB of the acoustic's, and the synth's held tone sits a little under.
  - The overdrive's level matches the clean sound for a soft pick.
  - The tremolo swings ±35 % either side of your level, on a cosine wave at the 8ths' rate, restarted with the band. Switching it on doesn't make you quieter.
  - The delay: a dotted 8th, each echo 0.38 of the one before, darker.
  - The reverb's hall is scaled by its own energy: the browser's normalisation left it about 25 dB too quiet.
  - The delay and reverb close their input when switched off, so their echoes die away.
- **The sound check** (`?sound`) gets an instrument menu and a switch per pedal (keys 2 to 6 too), so every sound can be judged by ear over the band.
- **Savings and the log:**
  - The end card says "Saved: N coins."
  - Each set's log entry gains `instrument` and `pedals` (every pedal on at any point in the set), and the choice can be `shop`.
  - Purchases go to `open-case-buys` as `{ date, id, price }`.
  - `?coins=N` saves nothing and logs no purchases.
  - Bot sets play with your saved gear but can't change it, and their end card has no savings line and no shop button.
- **Clicks** turn a click into scene pixels with the canvas's on-screen box. The pointer cursor shows over anything clickable. The door and its sign are one click area.
- **The fake audio context** (`test/fake-audio.js`) now records each node's connections (`outs`, and `from` on whatever it feeds) and each setting's scheduled changes (`events`), so the tests can follow the pedal chain and check that a stomp fades.

## File map

| File | What it does |
|---|---|
| `open-case/src/tuning.js` (append) | `SHOP`: each item's price and each pedal's key |
| `open-case/src/gear.js` (new) | The stock, the savings and your gear, pure; loading and saving through safe storage |
| `open-case/src/log.js` (edit) | Sets log the instrument and pedals; purchases are logged |
| `open-case/src/shop.js` (new) | The shop screen's state, pure: choosing, the card, Enter, trying, clicks |
| `open-case/src/keys.js`, `input.js` (edit) | Keys 2 to 6 stomp pedals; the shop's keys |
| `open-case/src/audio.js` (edit) | The instruments' voices and the pedal chain |
| `open-case/src/soundcheck.js`, `index.html` (edit) | The sound check's instrument menu and pedal switches |
| `art/open-case/draw.lua` (edit) | More pixel-map colours; you without an instrument (`D.youBody`) |
| `art/open-case/gear.lua` (new) | You with each instrument, your pedals, the amp, the strip's icons |
| `art/open-case/shop.lua` (new) | The shop: room, counter, shopkeeper, stock, tags |
| `art/open-case/sprites.lua` (edit) | Packs the new frames; the shop's layout data |
| `open-case/assets/sprites.png`, `sprites.json` (generated) | The sheet |
| `open-case/src/render.js` (edit) | Your instrument, pedals and amp; the gear strip; the title's pedal line; the shop screen |
| `open-case/src/main.js` (edit) | Savings, the shop screen, trying and buying, pedal keys, clicks, `?coins` |
| `open-case/index.html` (edit) | The end card's savings line and Visit the shop button |
| `open-case/test/*` | The tests for each of the above |
| `README.md`, the Open Case specs | Say what's built |

---

### Task 1: The stock, the savings and your gear

**Files:**
- Modify: `open-case/src/tuning.js` (append `SHOP`)
- Create: `open-case/src/gear.js`
- Modify: `open-case/src/log.js`
- Create: `open-case/test/gear.test.js`
- Modify: `open-case/test/log.test.js`, `open-case/test/set.test.js`

**Interfaces:**
- Consumes: `safeStorage`-shaped storage `{ get(key) -> string | null, set(key, value) }`.
- Produces (later tasks rely on these exact names):
  - `tuning.js`: `SHOP` — `{ [id]: { price, key? } }`.
  - `gear.js`:
    - `ACOUSTIC` = `'acoustic'`.
    - `STOCK` — `[{ id, kind: 'pedal' | 'instrument', name, about, price, key }]`, ten items: the pedals in chain order, then `acoustic, ukulele, electric, epiano, synth`.
    - `stockItem(id)`.
    - `PEDALS` (ids in chain order) and `INSTRUMENTS` (ids).
    - `freshGear()`.
    - `owns(gear, id)`.
    - `loadGear(storage)` and `saveGear(storage, gear)`.
    - `earn(gear, coins)`.
    - `buy(gear, id) -> boolean`.
    - `play(gear, id) -> boolean`.
    - `stomp(gear, id) -> true | false | null`.
    - A gear value is `{ savings, owned: [ids], instrument, on: [pedal ids] }`.
  - `log.js`: `readLog`, `logSet` (entries may carry `instrument` and `pedals`), `logChoice` (`'another' | 'stop' | 'shop'`), `readBuys(storage)`, and `logBuy(storage, { date, id, price })`.

- [ ] **Step 1: Write the failing tests**

Create `open-case/test/gear.test.js`:

```js
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
```

Replace `open-case/test/log.test.js` with:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readLog, logSet, logChoice, readBuys, logBuy } from '../src/log.js';
import { LOG_SIZE } from '../src/tuning.js';

function memoryStorage() {
  const m = new Map();
  return { m, get: (k) => (m.has(k) ? m.get(k) : null), set: (k, v) => m.set(k, String(v)) };
}

test('each set is logged, and the button pressed after it is filled in', () => {
  const s = memoryStorage();
  logSet(s, { date: '2026-09-28T20:00:00Z', coins: 21, stopped: 5 });
  logChoice(s, 'another');
  logSet(s, { date: '2026-09-28T20:04:00Z', coins: 9, stopped: 3 });
  assert.deepEqual(readLog(s), [
    { date: '2026-09-28T20:00:00Z', coins: 21, stopped: 5, choice: 'another' },
    { date: '2026-09-28T20:04:00Z', coins: 9, stopped: 3, choice: null },
  ]);
  assert.deepEqual([...s.m.keys()], ['open-case-log']);
});

test('only the last 50 sets are kept', () => {
  const s = memoryStorage();
  for (let i = 0; i < LOG_SIZE + 5; i++) logSet(s, { date: String(i), coins: i, stopped: 0 });
  const log = readLog(s);
  assert.equal(log.length, LOG_SIZE);
  assert.equal(log[0].coins, 5);
});

test('an unreadable log starts afresh, and a choice with no set logged does nothing', () => {
  const s = memoryStorage();
  logChoice(s, 'stop');
  assert.deepEqual(readLog(s), []);
  s.set('open-case-log', '{nope');
  assert.deepEqual(readLog(s), []);
  s.set('open-case-log', '{"a":1}');
  assert.deepEqual(readLog(s), []);
});

test('each set logs the instrument and the pedals used; each thing bought is logged with its date', () => {
  const s = memoryStorage();
  logSet(s, { date: '2026-09-29T20:00:00Z', coins: 40, stopped: 6, instrument: 'ukulele', pedals: ['delay'] });
  logChoice(s, 'shop');
  logBuy(s, { date: '2026-09-29T20:04:00Z', id: 'reverb', price: 80 });
  assert.deepEqual(readLog(s), [{ date: '2026-09-29T20:00:00Z', coins: 40, stopped: 6, instrument: 'ukulele', pedals: ['delay'], choice: 'shop' }]);
  assert.deepEqual(readBuys(s), [{ date: '2026-09-29T20:04:00Z', id: 'reverb', price: 80 }]);
  for (let i = 0; i < LOG_SIZE + 3; i++) logBuy(s, { date: String(i), id: 'delay', price: 70 });
  assert.equal(readBuys(s).length, LOG_SIZE);
  s.set('open-case-buys', 'nope');
  assert.deepEqual(readBuys(s), []);
});
```

In `open-case/test/set.test.js`, add the `readFileSync` import after the `assert` import:

```js
import { readFileSync } from 'node:fs';
```

and append this test at the end of the file:

```js
test("gear only changes how you sound: the crowd's rules never see it", () => {
  // The rules (the set, the ears, the crowd, the groove, the bots) import nothing from the shop, the
  // gear or the sound, so a set played with every pedal on scores exactly as one with none.
  for (const f of ['set', 'listen', 'crowd', 'groove', 'bots']) {
    const src = readFileSync(new URL(`../src/${f}.js`, import.meta.url), 'utf8');
    const imports = [...src.matchAll(/from '\.\/([a-z]+)\.js'/g)].map((m) => m[1]);
    for (const other of imports) assert.ok(!['gear', 'shop', 'audio', 'main'].includes(other), `${f}.js imports ${other}.js`);
  }
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL. `gear.test.js` can't find `../src/gear.js`, and `log.test.js` has no `readBuys` export. (The new set test passes already: it guards against a future mistake.)

- [ ] **Step 3: Add the prices, and write gear.js and log.js**

Append to `open-case/src/tuning.js`:

```js

// The music shop (gear.js): what each thing costs in coins, and the key that stomps each pedal. The
// pedals are listed in the order they chain, overdrive first, which is also the order of their keys.
export const SHOP = {
  overdrive: { price: 40, key: 2 },
  chorus: { price: 50, key: 3 },
  tremolo: { price: 50, key: 4 },
  delay: { price: 70, key: 5 },
  reverb: { price: 80, key: 6 },
  ukulele: { price: 60 },
  electric: { price: 150 },
  epiano: { price: 200 },
  synth: { price: 250 },
};
```

Create `open-case/src/gear.js`:

```js
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
```

Replace `open-case/src/log.js` with:

```js
// The test log: this computer remembers the last LOG_SIZE sets (the date, coins, how many stopped, the
// instrument played, the pedals that were on at any point, and whether Nathan chose Another set, Stop
// here or Visit the shop), under open-case-log in local storage; and the last LOG_SIZE things he
// bought, with their dates, under open-case-buys.
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

// A set just ended: { date, coins, stopped, instrument, pedals }. Its choice is filled in when a
// button is pressed.
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

// 'another', 'stop' or 'shop', for the latest set.
export function logChoice(storage, choice) {
  const list = readLog(storage);
  if (!list.length) return;
  list[list.length - 1].choice = choice;
  storage.set(KEY, JSON.stringify(list));
}
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 138 tests.

- [ ] **Step 5: Commit**

```bash
git add open-case/src/tuning.js open-case/src/gear.js open-case/src/log.js open-case/test/gear.test.js open-case/test/log.test.js open-case/test/set.test.js
git commit -m "Open Case: savings and gear: the shop's stock and prices, what you own, your instrument and pedals, kept safely; purchases logged

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: The shop's state, and its keys

**Files:**
- Create: `open-case/src/shop.js`
- Modify: `open-case/src/keys.js`, `open-case/src/input.js`
- Create: `open-case/test/shop.test.js`
- Modify: `open-case/test/keys.test.js`, `open-case/test/input.test.js`

**Interfaces:**
- Consumes (Task 1): `STOCK`, `PEDALS`, `owns`, `freshGear`, `buy`, `stomp`, `play` from `gear.js`; `SHOP` from `tuning.js`.
- Produces:
  - `shop.js`:
    - `CARD` = `[4, 138, 312, 38]` and `BUTTON` = `[262, 159, 48, 13]`.
    - `createShop() -> { at, soldAt }`, where `at` indexes `STOCK` and `soldAt` is the page time of the last sale.
    - `chosen(shop)`.
    - `move(shop, dir)`.
    - `action(shop, gear) -> { act: 'buy' | 'play', id } | null`.
    - `card(shop, gear) -> { name, price, about, says, button }`.
    - `trying(shop, gear) -> { instrument, on }`.
    - `hit(layout, shop, gear, x, y) -> { hit: 'item', at } | { hit: 'button' } | { hit: 'door' } | null`.
  - `keys.js`:
    - `PEDAL_KEYS` (`Digit2`…`Digit6` → pedal id).
    - `SHOP_KEYS`.
    - `shopKey(code, repeat) -> 'left' | 'right' | 'enter' | null | undefined`.
  - `input.js`: `createInput(target, { …, onPedal(id) })`. A pedal key calls `onPedal` once per press, after the gate.

- [ ] **Step 1: Write the failing tests**

Create `open-case/test/shop.test.js`:

```js
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
```

Replace `open-case/test/keys.test.js` with:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createKeyState, noteFor, applyControl, toPentatonic, layoutPitches, NOTE_KEYS, CONTROL_KEYS, PEDAL_KEYS, shopKey } from '../src/keys.js';

test('the Musical Typing layout: A is C4, the row runs up to F, the black keys sit above', () => {
  const ks = createKeyState();
  assert.equal(noteFor('KeyA', ks), 60);
  assert.equal(noteFor('KeyW', ks), 61);
  assert.equal(noteFor('KeyJ', ks), 71);
  assert.equal(noteFor('KeyK', ks), 72);
  assert.equal(noteFor('Quote', ks), 77);
  assert.equal(noteFor('KeyP', ks), 75);
  assert.equal(noteFor('KeyQ', ks), null, 'not a note key');
  assert.equal(Object.keys(NOTE_KEYS).length, 18);
});

test('Z and X shift an octave, from -2 to +1; keys outside the guitar (E2 to E6) are silent', () => {
  const ks = createKeyState();
  assert.equal(applyControl(ks, 'octaveDown'), true);
  applyControl(ks, 'octaveDown');
  assert.equal(applyControl(ks, 'octaveDown'), false, 'already at -2');
  assert.equal(ks.octave, -2);
  assert.equal(noteFor('KeyA', ks), null, 'C2 is below the low E');
  assert.equal(noteFor('KeyD', ks), 40, 'E2 is the lowest note');
  for (let i = 0; i < 5; i++) applyControl(ks, 'octaveUp');
  assert.equal(ks.octave, 1);
  assert.equal(noteFor('Semicolon', ks), 88, 'E6 is the highest');
  assert.equal(noteFor('Quote', ks), null);
});

test('C and V step the pick strength through 1 to 4, starting at 3', () => {
  const ks = createKeyState();
  assert.equal(ks.strength, 3);
  applyControl(ks, 'louder');
  assert.equal(applyControl(ks, 'louder'), false);
  assert.equal(ks.strength, 4);
  for (let i = 0; i < 5; i++) applyControl(ks, 'softer');
  assert.equal(ks.strength, 1);
});

test('scale lock maps every key to the nearest C major pentatonic note at or below it', () => {
  assert.deepEqual([60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71].map(toPentatonic), [60, 60, 62, 62, 64, 64, 64, 67, 67, 69, 69, 69]);
  const ks = createKeyState();
  applyControl(ks, 'lock');
  assert.equal(noteFor('KeyF', ks), 64, 'F becomes E');
  assert.equal(noteFor('KeyJ', ks), 69, 'B becomes A');
  applyControl(ks, 'lock');
  assert.equal(noteFor('KeyF', ks), 65);
});

test('the layout\'s pitches: every note key that sounds, for working out sounds ahead', () => {
  const ks = createKeyState();
  assert.deepEqual(layoutPitches(ks), [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77]);
  ks.octave = 1;
  assert.equal(layoutPitches(ks).length, 17, 'F6 is out of range');
});

test('keys 2 to 6 are the pedals, in chain order, and no key does two jobs', () => {
  assert.deepEqual(PEDAL_KEYS, { Digit2: 'overdrive', Digit3: 'chorus', Digit4: 'tremolo', Digit5: 'delay', Digit6: 'reverb' });
  const all = [...Object.keys(NOTE_KEYS), ...Object.keys(CONTROL_KEYS), ...Object.keys(PEDAL_KEYS)];
  assert.equal(new Set(all).size, all.length);
});

test('in the shop the arrows choose and Enter buys, once however long it is held', () => {
  assert.equal(shopKey('ArrowLeft', false), 'left');
  assert.equal(shopKey('ArrowRight', true), 'right', 'a held arrow moves on along the stock');
  assert.equal(shopKey('Enter', false), 'enter');
  assert.equal(shopKey('NumpadEnter', false), 'enter');
  assert.equal(shopKey('Enter', true), null, 'a held Enter repeating does nothing more');
  assert.equal(shopKey('KeyA', false), undefined, 'not a shop key: the note keys still play');
});
```

Replace `open-case/test/input.test.js` with:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInput } from '../src/input.js';

// A stand-in window: listeners by type, and a clock the test moves.
function harness(over = {}) {
  const on = {}, got = [];
  let time = 1;
  const target = { addEventListener: (type, fn) => (on[type] = fn) };
  const input = createInput(target, {
    now: () => time,
    onNote: (n) => got.push(['note', n.code, n.pitch, n.strength, n.legato, Math.round(n.at * 1000)]),
    onRelease: (r) => got.push(['up', r.code]),
    onControl: (action, down) => got.push([action, down]),
    onPedal: (id) => got.push(['pedal', id]),
    ...over,
  });
  const key = (type, code, extra = {}) => {
    let prevented = false;
    on[type]({ code, repeat: false, timeStamp: 0, preventDefault: () => (prevented = true), ...extra });
    return prevented;
  };
  return {
    input, got, on,
    down: (code, extra) => key('keydown', code, extra),
    up: (code) => key('keyup', code),
    at: (t) => (time = t),
  };
}

test('a note key sounds at once, with its pitch and the pick strength, and its release follows', () => {
  const h = harness();
  assert.equal(h.down('KeyA'), true, 'the browser does nothing with it');
  h.up('KeyA');
  assert.deepEqual(h.got, [['note', 'KeyA', 60, 3, false, 1000], ['up', 'KeyA']]);
});

test('held keys do not repeat; other keys are left alone; Cmd, Ctrl and Alt are left to the browser', () => {
  const h = harness();
  h.down('KeyA');
  h.down('KeyA', { repeat: true });
  assert.equal(h.down('KeyQ'), false);
  assert.equal(h.down('KeyS', { metaKey: true }), false);
  assert.equal(h.down('KeyD', { ctrlKey: true }), false);
  assert.equal(h.got.length, 1);
});

test('octave, strength and scale lock change the notes; the release is the note that sounded', () => {
  const h = harness();
  h.down('KeyX');
  h.down('KeyV');
  h.down('KeyA');
  h.down('KeyZ');
  h.up('KeyA');
  h.down('Digit1');
  h.down('KeyF');
  assert.deepEqual(h.got, [['octaveUp', true], ['louder', true], ['note', 'KeyA', 72, 4, false, 1000], ['octaveDown', true], ['up', 'KeyA'], ['lock', true], ['note', 'KeyF', 64, 4, false, 1000]]);
});

test('a control that changes nothing says nothing; a key out of the guitar\'s range is silent', () => {
  const h = harness();
  h.down('KeyX');
  h.down('KeyX');
  h.down('Quote'); // F6, above the guitar
  assert.deepEqual(h.got, [['octaveUp', true]]);
});

test('Space rings while held; M mutes; Esc pauses', () => {
  const h = harness();
  h.down('Space');
  h.up('Space');
  h.down('KeyM');
  h.down('Escape');
  assert.deepEqual(h.got, [['ring', true], ['ring', false], ['mute', true], ['pause', true]]);
});

test('a key pressed while the last is held is a hammer-on', () => {
  const h = harness();
  h.down('KeyA');
  h.at(1.3);
  h.down('KeyS');
  assert.equal(h.got[1][4], true);
  h.up('KeyA');
  h.up('KeyS');
  h.at(2);
  h.down('KeyD');
  assert.equal(h.got.at(-1)[4], false, 'with nothing held, it is picked');
});

test('keys pressed within 30 ms are a strum: each sounds 12 ms after the one before', () => {
  const h = harness();
  h.down('KeyA');
  h.at(1.005);
  h.down('KeyD');
  h.at(1.02);
  h.down('KeyG');
  h.at(1.1);
  h.down('KeyK');
  assert.deepEqual(h.got.map((g) => [g[1], g[4], g[5]]), [['KeyA', false, 1000], ['KeyD', false, 1012], ['KeyG', false, 1024], ['KeyK', true, 1100]]);
});

test('the gate can swallow a key, which then plays nothing and is never released', () => {
  let open = false;
  const h = harness({ gate: () => open });
  h.down('KeyA');
  h.up('KeyA');
  open = true;
  h.down('KeyS');
  assert.deepEqual(h.got, [['note', 'KeyS', 62, 3, false, 1000]]);
});

test('losing focus lets go of every key and the ring', () => {
  const h = harness();
  h.down('KeyA');
  h.down('KeyS');
  h.on.blur();
  assert.deepEqual(h.got.slice(2), [['up', 'KeyA'], ['up', 'KeyS'], ['ring', false]]);
  assert.equal(h.input.held.size, 0);
});

test('keys go by position, so any keyboard layout plays the same notes', () => {
  const h = harness();
  h.down('KeyA', { key: 'q' }); // the A position on a French keyboard types Q
  h.down('Semicolon', { key: 'm' });
  assert.deepEqual(h.got.map((g) => g[2]), [60, 76]);
});

test('every game key\'s browser default is stopped: Space scrolling, Firefox\'s quick find on \' and /', () => {
  const h = harness({ gate: () => false });
  assert.equal(h.down('Space'), true);
  assert.equal(h.down('Quote'), true, 'even when the key is swallowed');
  assert.equal(h.down('KeyA', { repeat: true }), true, 'and when it repeats');
});

test('keys 2 to 6 stomp the pedals, once per press, and the gate can swallow them', () => {
  let open = true;
  const h = harness({ gate: () => open });
  assert.equal(h.down('Digit2'), true, 'the browser does nothing with it');
  h.down('Digit5');
  h.down('Digit5', { repeat: true });
  h.down('Digit7');
  open = false;
  h.down('Digit6');
  assert.deepEqual(h.got, [['pedal', 'overdrive'], ['pedal', 'delay']]);
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL. `shop.test.js` can't find `../src/shop.js`, `keys.js` has no `PEDAL_KEYS` or `shopKey`, and the input test's pedal keys call nothing.

- [ ] **Step 3: Write shop.js, and the pedal and shop keys**

Create `open-case/src/shop.js`:

```js
// The music shop's screen, as plain state: which item is chosen, what the card under it says, what
// Enter does, what you hear while you try things, and what a click lands on. Pure, so it's tested in
// Node; main.js runs it and render.js draws it.
import { STOCK, PEDALS, owns } from './gear.js';

// The card along the bottom of the shop, and the button on it: [x, y, w, h] in scene pixels.
export const CARD = [4, 138, 312, 38];
export const BUTTON = [262, 159, 48, 13];

// The pedals on the rack come first, then the instruments on their stands, so the arrow keys move
// along the rack and then along the floor.
export function createShop() {
  return { at: 0, soldAt: -Infinity }; // soldAt: the page time of the last sale (the shopkeeper nods)
}

export const chosen = (shop) => STOCK[shop.at];

// The arrow keys: one item left (-1) or right (1), round from the last back to the first.
export function move(shop, dir) {
  shop.at = (shop.at + dir + STOCK.length) % STOCK.length;
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
```

Replace `open-case/src/keys.js` with:

```js
// GarageBand's Musical Typing layout. Keys are named by their physical position (KeyboardEvent.code),
// so the layout is the same on any keyboard. At octave 0, A is C4 (MIDI 60). Keys 2 to 6 stomp your
// pedals, and in the shop the arrow keys and Enter choose and buy.
//
//   W E   T Y U   O P        C# D#   F# G# A#   C# D#
//  A S D F G H J K L ; '     C  D  E  F  G  A  B  C  D  E  F
import { PLAY, SHOP } from './tuning.js';

// Each note key's semitones above the A key.
export const NOTE_KEYS = {
  KeyA: 0, KeyW: 1, KeyS: 2, KeyE: 3, KeyD: 4, KeyF: 5, KeyT: 6, KeyG: 7, KeyY: 8,
  KeyH: 9, KeyU: 10, KeyJ: 11, KeyK: 12, KeyO: 13, KeyL: 14, KeyP: 15, Semicolon: 16, Quote: 17,
};

export const CONTROL_KEYS = {
  KeyZ: 'octaveDown', KeyX: 'octaveUp', KeyC: 'softer', KeyV: 'louder',
  Space: 'ring', Digit1: 'lock', KeyM: 'mute', Escape: 'pause',
};

// Each pedal's key, which never changes: Digit2 overdrive to Digit6 reverb (tuning.js SHOP).
export const PEDAL_KEYS = Object.fromEntries(
  Object.entries(SHOP).filter(([, item]) => item.key).map(([id, item]) => [`Digit${item.key}`, id]),
);

// The shop's keys (Esc, the pause key, leaves it).
export const SHOP_KEYS = { ArrowLeft: 'left', ArrowRight: 'right', Enter: 'enter', NumpadEnter: 'enter' };

// What a key does in the shop: 'left', 'right' or 'enter'; null for a held Enter repeating (it buys
// once), while a held arrow moves on along the stock; undefined for any other key.
export function shopKey(code, repeat) {
  const what = SHOP_KEYS[code];
  return what === 'enter' && repeat ? null : what;
}

const PENTATONIC = [0, 2, 4, 7, 9]; // C D E G A

export function createKeyState() {
  return { octave: 0, strength: PLAY.strengthStart, lock: false };
}

// The nearest C major pentatonic note at or below `pitch`.
export function toPentatonic(pitch) {
  let p = pitch;
  while (!PENTATONIC.includes(((p % 12) + 12) % 12)) p--;
  return p;
}

// The MIDI note a key plays, or null: not a note key, or outside the guitar's range.
export function noteFor(code, ks) {
  const semis = NOTE_KEYS[code];
  if (semis === undefined) return null;
  let pitch = 60 + 12 * ks.octave + semis;
  if (ks.lock) pitch = toPentatonic(pitch);
  return pitch >= PLAY.lowest && pitch <= PLAY.highest ? pitch : null;
}

// Applies a control key's action to the key state. Returns true if the state changed. (Ring, mute and
// pause belong to the caller; they don't change the key state.)
export function applyControl(ks, action) {
  const before = `${ks.octave},${ks.strength},${ks.lock}`;
  if (action === 'octaveDown') ks.octave = Math.max(PLAY.octaveMin, ks.octave - 1);
  else if (action === 'octaveUp') ks.octave = Math.min(PLAY.octaveMax, ks.octave + 1);
  else if (action === 'softer') ks.strength = Math.max(PLAY.strengthMin, ks.strength - 1);
  else if (action === 'louder') ks.strength = Math.min(PLAY.strengthMax, ks.strength + 1);
  else if (action === 'lock') ks.lock = !ks.lock;
  return before !== `${ks.octave},${ks.strength},${ks.lock}`;
}

// Every pitch the note keys play right now (to work their sounds out ahead of time).
export function layoutPitches(ks) {
  return Object.keys(NOTE_KEYS).map((code) => noteFor(code, ks)).filter((p) => p !== null);
}
```

Replace `open-case/src/input.js` with:

```js
// Keys to notes. A note key sounds the instant it goes down: onNote is called from inside the key
// event, stamped with the audio clock (now()), so nothing waits for the next update. OS key repeat is
// ignored, a held Cmd, Ctrl or Alt is left to the browser, and losing focus lets go of every key.
//
//   onNote({ code, pitch, strength, legato, at, timeStamp })  at: the audio time to sound it
//   onRelease({ code, at })
//   onControl(action, down)  'ring' (down and up), and on key down: 'octaveDown', 'octaveUp',
//                            'softer', 'louder', 'lock' (only when they change something), 'mute', 'pause'
//   onPedal(id)              a pedal key (2 to 6) went down: 'overdrive' to 'reverb'
// gate(event) runs first on every game key going down; returning false swallows the key (the key
// that dismisses the title card plays no note).
//
// Strums: a key pressed within PLAY.strumWindow of the group's first key, while another is held,
// sounds PLAY.strumGap after the one before it. They sound in the order pressed: the first key
// already sounded the instant it went down, so they can't be re-sorted lowest first without delaying
// every note.
import { NOTE_KEYS, CONTROL_KEYS, PEDAL_KEYS, createKeyState, noteFor, applyControl } from './keys.js';
import { PLAY } from './tuning.js';

export function createInput(target, { now, onNote, onRelease, onControl, onPedal = () => {}, gate = () => true }) {
  const keys = createKeyState();
  const held = new Map(); // code -> the pitch it's sounding
  let groupAt = -Infinity, nextAt = -Infinity;

  function down(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const action = CONTROL_KEYS[e.code], pedal = PEDAL_KEYS[e.code];
    if (!(e.code in NOTE_KEYS) && !action && !pedal) return;
    e.preventDefault(); // Space would scroll; ' and / open Firefox's quick find
    if (e.repeat || !gate(e)) return;
    if (pedal) {
      onPedal(pedal);
      return;
    }
    if (action) {
      if (action === 'ring' || action === 'mute' || action === 'pause' || applyControl(keys, action)) onControl(action, true);
      return;
    }
    if (held.has(e.code)) return;
    const pitch = noteFor(e.code, keys);
    if (pitch === null) return; // outside the guitar's range: silent
    const t = now();
    let at = t, legato = false;
    if (held.size > 0 && t - groupAt <= PLAY.strumWindow) at = Math.max(t, nextAt);
    else {
      groupAt = t;
      legato = held.size > 0; // pressed while the last note is still held: a hammer-on
    }
    nextAt = at + PLAY.strumGap;
    held.set(e.code, pitch);
    onNote({ code: e.code, pitch, strength: keys.strength, legato, at, timeStamp: e.timeStamp });
  }

  function up(e) {
    if (e.code === 'Space') onControl('ring', false);
    if (!held.has(e.code)) return;
    held.delete(e.code);
    onRelease({ code: e.code, at: now() });
  }

  function releaseAll() {
    for (const code of [...held.keys()]) up({ code });
    onControl('ring', false);
  }

  target.addEventListener('keydown', down);
  target.addEventListener('keyup', up);
  target.addEventListener('blur', releaseAll);
  return { keys, held, releaseAll };
}
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 146 tests.

- [ ] **Step 5: Commit**

```bash
git add open-case/src/shop.js open-case/src/keys.js open-case/src/input.js open-case/test/shop.test.js open-case/test/keys.test.js open-case/test/input.test.js
git commit -m "Open Case: the shop's state (choosing, the card, Enter, trying, clicks), and keys 2 to 6 for the pedals

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: The instruments and the pedals

**Files:**
- Modify: `open-case/src/audio.js`, `open-case/src/soundcheck.js`, `open-case/index.html` (the sound check only)
- Modify: `open-case/test/fake-audio.js`, `open-case/test/audio.test.js`

**Interfaces:**
- Consumes (Task 1): `PEDALS` and `STOCK` from `gear.js`. Consumes (Task 2): `onPedal` in `createInput`.
- Produces:
  - `audio.js` exports:
    - `VOICING` (per instrument: `pluck?`, `level`, `release`, `tone`);
    - `pluckSamples(rate, hz, strength, { ring, bright, pick, stretch })`;
    - `softClip(k, n)`.
  - `createAudio` adds `setInstrument(id) -> boolean` (true when it changed), `setPedal(id, on, at = now())` and an `instrument` getter.
  - `warm()` works out samples for the instrument you play (nothing for the keyboards).
  - `startBand(at)` also restarts the tremolo's wave on the band's 8ths.
  - `index.html` gains `#sound-instrument` (a select) and `#sound-pedals` (a row).

- [ ] **Step 1: Write the failing tests**

Replace `open-case/test/fake-audio.js` with:

```js
// A stand-in for Web Audio in Node, enough for audio.js to build and play everything. It records
// every sound started and stopped (what and when), every buffer made, every connection (each node's
// `outs`, and what feeds each node or setting in its `from`), and every change scheduled on a setting
// (each param's `events`), so tests can see what was played and how things are wired.
function param(value = 0) {
  return {
    value,
    events: [], // [method, value, time, time constant]
    setValueAtTime(v, t) {
      this.value = v;
      this.events.push(['set', v, t]);
    },
    exponentialRampToValueAtTime(v, t) {
      this.events.push(['exp', v, t]);
    },
    linearRampToValueAtTime(v, t) {
      this.value = v;
      this.events.push(['linear', v, t]);
    },
    setTargetAtTime(v, t, tc) {
      this.value = v;
      this.events.push(['target', v, t, tc]);
    },
    cancelScheduledValues() {},
  };
}

export function fakeAudioContext() {
  const started = [], stopped = [], buffers = [];
  const node = (kind, extra = {}) => {
    const n = {
      kind,
      outs: [],
      connect: (to) => {
        n.outs.push(to);
        (to.from ??= []).push(n); // what feeds a node or a setting (a wave into a gain, say)
        return to;
      },
      disconnect() {},
      ...extra,
    };
    return n;
  };
  const ctx = {
    started, stopped, buffers,
    currentTime: 0,
    sampleRate: 8000,
    state: 'running',
    baseLatency: 0.005,
    outputLatency: 0.01,
    destination: node('destination'),
    resume() {
      ctx.state = 'running';
    },
    suspend() {
      ctx.state = 'suspended';
    },
    getOutputTimestamp: () => ({ contextTime: ctx.currentTime, performanceTime: 5000 + ctx.currentTime * 1000 }),
    createGain: () => node('gain', { gain: param(1) }),
    createBiquadFilter: () => node('filter', { type: 'lowpass', frequency: param(350), Q: param(1), gain: param(0) }),
    createWaveShaper: () => node('shaper', { curve: null, oversample: 'none' }),
    createDelay: (most = 1) => node('delay', { most, delayTime: param(0) }),
    createConvolver: () => node('convolver', { buffer: null, normalize: true }),
    createBuffer: (ch, len, rate) => {
      const data = new Float32Array(len);
      const b = { length: len, duration: len / rate, numberOfChannels: ch, getChannelData: () => data };
      buffers.push(b);
      return b;
    },
    createBufferSource: () => {
      const s = node('buffer', { buffer: null, loop: false, start: (t = 0, offset = 0) => started.push({ kind: 'buffer', t, offset, buffer: s.buffer, node: s }), stop: (t) => stopped.push({ kind: 'buffer', t, node: s }) });
      return s;
    },
    createOscillator: () => {
      const o = node('osc', {
        type: 'sine', frequency: param(440), detune: param(0),
        setPeriodicWave(w) {
          o.type = 'custom';
          o.wave = w;
        },
        start: (t = 0) => started.push({ kind: 'osc', t, node: o }),
        stop: (t) => stopped.push({ kind: 'osc', t, node: o }),
      });
      return o;
    },
    createPeriodicWave: (real, imag) => ({ real, imag }),
  };
  return ctx;
}
```

Replace `open-case/test/audio.test.js` with:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAudio, pluckSamples, softClip, VOICING } from '../src/audio.js';
import { fakeAudioContext } from './fake-audio.js';
import { BAR, BEAT, timeOf16th } from '../src/groove.js';
import { PLAY, GROOVE, LAYERS } from '../src/tuning.js';
import { PEDALS, INSTRUMENTS } from '../src/gear.js';

function memoryStorage() {
  const m = new Map();
  return { get: (k) => (m.has(k) ? m.get(k) : null), set: (k, v) => m.set(k, String(v)) };
}

// Runs fn with a fake AudioContext installed; fn gets a function returning the context made. The
// context's createGain is wrapped to remember every gain node in the order audio.js makes them
// (master, band, then each of LAYERS, then the stand-in percussion bus), so a test can read a bus's
// level the same way it reads any other recorded node — ctx().busGain(id).gain.value.
function withAudio(fn) {
  let ctx;
  globalThis.AudioContext = function () {
    ctx = fakeAudioContext();
    const gains = [];
    const createGain = ctx.createGain;
    ctx.createGain = () => {
      const g = createGain();
      gains.push(g);
      return g;
    };
    ctx.busGain = (id) => {
      const i = LAYERS.findIndex((l) => l.id === id);
      return gains[2 + (i < 0 ? LAYERS.length : i)];
    };
    return ctx;
  };
  try {
    return fn(() => ctx);
  } finally {
    delete globalThis.AudioContext;
  }
}

// The period of a sound in samples, from its autocorrelation, to a fraction of a sample.
function period(x, from, guess) {
  const corr = (lag) => {
    let s = 0;
    for (let i = from; i < from + 4000; i++) s += x[i] * x[i + lag];
    return s;
  };
  let best = 0, bestLag = 0;
  for (let lag = Math.floor(guess * 0.8); lag <= Math.ceil(guess * 1.2); lag++) {
    const c = corr(lag);
    if (c > best) [best, bestLag] = [c, lag];
  }
  const a = corr(bestLag - 1), b = best, c = corr(bestLag + 1);
  return bestLag + (a - c) / (2 * (a - 2 * b + c));
}
const rms = (x, from, n) => Math.sqrt(x.subarray(from, from + n).reduce((s, v) => s + v * v, 0) / n);

test('a plucked string is in tune, from the low E to the high E', () => {
  for (const hz of [82.41, 220, 659.26, 1318.5]) {
    const x = pluckSamples(48000, hz, 3);
    const p = period(x, 9600, 48000 / hz);
    assert.ok(Math.abs(p / (48000 / hz) - 1) < 0.003, `${hz} Hz: period ${p}, wanted ${48000 / hz}`);
  }
});

test('a plucked string rings on for a few seconds, then its samples stop once it is silent', () => {
  const x = pluckSamples(48000, 220, 3);
  assert.ok(x.length >= 48000 * 2.5 && x.length <= 48000 * (PLAY.ring + 0.3), `${x.length / 48000} s`);
  const start = rms(x, 0, 4800), end = rms(x, x.length - 4800, 4800);
  assert.ok(end < start * 0.003, `${start} -> ${end}`);
  assert.ok(rms(x, 48000, 4800) > start * 0.05, 'still ringing after a second');
});

test('a harder pick is brighter', () => {
  const edge = (x) => {
    let d = 0, a = 0;
    for (let i = 1; i < 2400; i++) {
      d += Math.abs(x[i] - x[i - 1]);
      a += Math.abs(x[i]);
    }
    return d / a;
  };
  assert.ok(edge(pluckSamples(48000, 220, 4)) > edge(pluckSamples(48000, 220, 1)) * 1.5);
});

test('a note sounds the moment it is played, and stops soon after its key comes up', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    ctx().currentTime = 2;
    audio.noteOn('KeyA', 60, 3, 2, false);
    const note = ctx().started.at(-1);
    assert.deepEqual([note.kind, note.t, note.offset], ['buffer', 2, 0]);
    audio.noteOff('KeyA', 2.4);
    assert.ok(ctx().stopped.at(-1).t <= 2.4 + PLAY.damp * 2 + 1e-9);
  }));

test('a hammer-on skips the pick; each pitch and strength is worked out only once', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    const made = ctx().buffers.length;
    audio.noteOn('KeyA', 60, 3, 0, false);
    audio.noteOn('KeyS', 60, 3, 0, true);
    assert.ok(ctx().started.at(-1).offset > 0);
    assert.equal(ctx().buffers.length, made + 1);
    audio.warm([62, 64], 3);
    assert.equal(ctx().buffers.length, made + 3);
  }));

test('while Space is held, released notes ring on; letting it go damps them', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.setRing(true);
    audio.noteOn('KeyA', 60, 3, 0, false);
    const stops = ctx().stopped.length;
    audio.noteOff('KeyA', 0.5);
    assert.equal(ctx().stopped.length, stops, 'still ringing');
    ctx().currentTime = 1.5;
    audio.setRing(false);
    assert.equal(ctx().stopped.length, stops + 1);
    assert.ok(ctx().stopped.at(-1).t >= 1.5);
  }));

test('the band is scheduled a moment ahead, every layer into its slot, never further ahead', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.startBand(0.1);
    for (let i = 0; i < 100; i++) {
      ctx().currentTime += 0.05;
      audio.update();
      const latest = Math.max(...ctx().started.filter((s) => s.kind === 'osc').map((s) => s.t));
      assert.ok(latest <= ctx().currentTime + GROOVE.ahead + 1e-9);
    }
    assert.ok(ctx().started.filter((s) => s.kind === 'osc').length > 50);
  }));

test('the band fades over a bar at the end and then stops', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.startBand(0);
    audio.endBand(1);
    for (let i = 0; i < 200; i++) {
      ctx().currentTime += 0.05;
      audio.update();
    }
    const osc = ctx().started.filter((s) => s.kind === 'osc');
    assert.ok(Math.max(...osc.map((s) => s.t)) < 1 + BAR);
  }));

test('the stand-in percussion bus is the drums’ inverse: on while they are out, off once they join', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.startBand(0);
    assert.equal(ctx().busGain('drums').gain.value, 0);
    assert.equal(ctx().busGain('perc').gain.value, 1, 'the drums are off, so the percussion starts on');
    audio.setLayer('drums', true, 1);
    assert.equal(ctx().busGain('drums').gain.value, 1);
    assert.equal(ctx().busGain('perc').gain.value, 0, 'the drums joined, so the percussion fades out');
    audio.setLayer('drums', false, 2);
    assert.equal(ctx().busGain('drums').gain.value, 0);
    assert.equal(ctx().busGain('perc').gain.value, 1, 'the crowd emptied: the percussion comes back');
  }));

test('the stand-in percussion lands alongside the hats, on the off-beat 8ths', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.startBand(0);
    for (let i = 0; i < 100; i++) {
      ctx().currentTime += 0.05;
      audio.update();
    }
    const bufferHitsAt = (t) => ctx().started.filter((s) => s.kind === 'buffer' && Math.abs(s.t - t) < 1e-9).length;
    // 16th 2: the hats already fire here; the shaker adds a second hit at the very same moment.
    assert.equal(bufferHitsAt(timeOf16th(2)), 2);
  }));

test('coins, applause and the reported delay', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    assert.equal(audio.reportedLatency(), null);
    audio.start();
    const before = ctx().started.length;
    audio.coin();
    audio.clap(3);
    assert.ok(ctx().started.length > before + 20);
    assert.equal(audio.reportedLatency(), 15);
    ctx().currentTime = 1;
    assert.equal(audio.heardAt(1.2), 6200);
  }));

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
  a.noteOn('KeyA', 60, 3, 0, false);
  a.noteOff('KeyA', 0);
  a.setRing(false);
  a.startBand(0);
  a.setLayer('drums', true);
  a.update();
  a.coin();
  a.clap(2);
  a.endBand(0);
  assert.equal(a.heardAt(0), null);
  assert.equal(a.now(), 0);
});

test('a saved volume that makes no sense falls back to 0.8', () => {
  const storage = memoryStorage();
  storage.set('open-case-volume', 'loud');
  assert.equal(createAudio(storage).volume, 0.8);
  storage.set('open-case-volume', '7');
  assert.equal(createAudio(storage).volume, 0.8);
});

// Following the wiring: every node reachable from `from`, nearest first, and the first pedal on the way.
function downstream(from) {
  const seen = new Set(), queue = [...(from.outs ?? [])], order = [];
  while (queue.length) {
    const n = queue.shift();
    if (seen.has(n)) continue;
    seen.add(n);
    order.push(n);
    queue.push(...(n.outs ?? []));
  }
  return order;
}
const nextPedal = (from) => downstream(from).find((n) => n.pedal) ?? null;
// Plays a note on `id` at time 2 and returns the sounds it started.
function playOn(ctx, audio, id, strength = 3) {
  audio.setInstrument(id);
  ctx().currentTime = 2;
  const before = ctx().started.length;
  audio.noteOn('KeyA', 60, strength, 2, false);
  return ctx().started.slice(before);
}

test('the ukulele rings short and the electric guitar long; both stay in tune', () => {
  const len = (id) => pluckSamples(48000, 220, 3, VOICING[id].pluck).length / 48000;
  assert.ok(len('ukulele') < 2 && len('ukulele') < len('acoustic') / 2, `ukulele ${len('ukulele')} s`);
  assert.ok(len('electric') > len('acoustic') * 1.3, `electric ${len('electric')} s`);
  for (const id of ['ukulele', 'electric']) {
    const x = pluckSamples(48000, 220, 3, VOICING[id].pluck);
    const p = period(x, 4800, 48000 / 220);
    assert.ok(Math.abs(p / (48000 / 220) - 1) < 0.003, `${id}: period ${p}`);
  }
});

test('every instrument sounds for a note at once, through its own tone into the pedals', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    for (const id of INSTRUMENTS) {
      const fresh = playOn(ctx, audio, id);
      assert.ok(fresh.length >= 1 && fresh.every((s) => s.t === 2), `${id} sounds at once`);
      const path = downstream(fresh[0].node), first = path.findIndex((n) => n.pedal);
      assert.equal(path[first].pedal, 'overdrive', `${id} plays into the first pedal`);
      for (const [type, hz] of VOICING[id].tone) {
        const at = path.findIndex((n) => n.kind === 'filter' && n.type === type && n.frequency.value === hz);
        assert.ok(at >= 0 && at < first, `${id}: its ${type} at ${hz} Hz, before the pedals`);
      }
    }
  }));

test("every instrument's note stops soon after its key comes up, or when Space lets go", () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    for (const id of INSTRUMENTS) {
      playOn(ctx, audio, id);
      let stops = ctx().stopped.length;
      audio.noteOff('KeyA', 2.4);
      const late = ctx().stopped.slice(stops);
      assert.ok(late.length >= 1, `${id} stops`);
      assert.ok(late.every((st) => st.t <= 2.4 + VOICING[id].release * 2 + 1e-9), `${id} stops soon after its key is up`);
      audio.setRing(true);
      playOn(ctx, audio, id);
      stops = ctx().stopped.length;
      audio.noteOff('KeyA', 2.4);
      assert.ok(ctx().stopped.slice(stops).every((st) => st.t > 3), `${id}: Space holds it`);
      ctx().currentTime = 5;
      audio.setRing(false);
      assert.ok(ctx().stopped.slice(stops).some((st) => st.t >= 5 && st.t <= 5 + VOICING[id].release * 2 + 1e-9), `${id}: letting Space go stops it`);
    }
  }));

test('the synth holds while its key is down; the electric piano fades away by itself', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    let stops = ctx().stopped.length;
    playOn(ctx, audio, 'synth');
    assert.equal(ctx().stopped.length, stops, 'no end until the key comes up');
    audio.noteOff('KeyA', 2.2);
    stops = ctx().stopped.length;
    playOn(ctx, audio, 'epiano');
    const ends = ctx().stopped.slice(stops);
    assert.ok(ends.length > 0 && ends.every((st) => st.t > 4 && st.t < 14), 'it ends by itself, some seconds on');
  }));

test('no key press waits: the keyboards make no samples, and a warmed guitar makes none either', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    const made = ctx().buffers.length;
    playOn(ctx, audio, 'epiano');
    playOn(ctx, audio, 'synth');
    audio.warm([60, 62], 3);
    assert.equal(ctx().buffers.length, made, 'the keyboards need nothing worked out');
    audio.setInstrument('ukulele');
    audio.warm([60, 62], 3);
    const warmed = ctx().buffers.length;
    assert.equal(warmed, made + 2);
    playOn(ctx, audio, 'ukulele');
    assert.equal(ctx().buffers.length, warmed, 'the note was ready');
    assert.ok(ctx().buffers.at(-1).length < 8000 * 2, "the ukulele's short ring");
  }));

test('changing instrument: only a real change counts, and notes already sounding carry on', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    assert.equal(audio.instrument, 'acoustic');
    assert.equal(audio.setInstrument('acoustic'), false);
    assert.equal(audio.setInstrument('banjo'), false);
    assert.equal(audio.setInstrument('synth'), true, 'before the sound starts, too');
    audio.start();
    playOn(ctx, audio, 'synth');
    const stops = ctx().stopped.length;
    audio.setInstrument('acoustic');
    assert.equal(ctx().stopped.length, stops);
    audio.noteOff('KeyA', 3);
    assert.ok(ctx().stopped.length > stops, 'and it stops when its key comes up');
  }));

test('the pedals chain in order, overdrive to reverb, then to the speakers', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    let at = playOn(ctx, audio, 'acoustic')[0].node;
    const order = [];
    for (let p = nextPedal(at); p; p = nextPedal(at)) {
      order.push(p.pedal);
      at = p;
    }
    assert.deepEqual(order, PEDALS);
    assert.ok(downstream(at).includes(ctx().destination), 'the last pedal reaches the speakers');
  }));

// The changes a stomp makes to the gains in and after the pedals (and the gains feeding their
// settings, like the tremolo's depth), from the stomp's time.
function stompFades(ctx, audio, id, on, at) {
  const after = downstream(nextPedal(playOn(ctx, audio, 'acoustic')[0].node));
  const feeding = after.flatMap((n) => (n.gain?.from ?? []).filter((f) => f.gain));
  const inside = [...new Set([...after.filter((n) => n.gain), ...feeding])];
  const before = new Map(inside.map((n) => [n, n.gain.events.length]));
  audio.setPedal(id, on, at);
  return inside.flatMap((n) => n.gain.events.slice(before.get(n)));
}

test('a stomp fades its pedal in or out over a few milliseconds, never cutting the sound', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    for (const id of PEDALS) {
      for (const on of [true, false]) {
        const fades = stompFades(ctx, audio, id, on, 3);
        assert.ok(fades.length >= 1, `${id} ${on ? 'on' : 'off'} changes something`);
        for (const [how, , t, tc] of fades) {
          assert.equal(how, 'target', `${id}: a fade, not a jump`);
          assert.equal(t, 3);
          assert.ok(tc > 0 && tc <= 0.01, `${id}: over a few milliseconds`);
        }
      }
    }
    assert.equal(stompFades(ctx, audio, 'delay', false, 4).length, 0, 'already off: nothing changes');
  }));

test('the overdrive hands over from your clean sound at the same moment, so there is no gap', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    const fades = stompFades(ctx, audio, 'overdrive', true, 3);
    assert.deepEqual(fades.map(([, v]) => v).sort(), [0, 0.16], 'the clean sound fades out as the driven one fades in');
    const curve = softClip();
    assert.ok(Math.abs(curve[512]) < 1e-6 && Math.abs(curve[0] + 1) < 1e-6 && Math.abs(curve[1024] - 1) < 1e-6);
    assert.ok(curve[600] - curve[512] > curve[1024] - curve[936], 'steep in the middle, flat at the ends: soft clipping');
  }));

test('pedals switched on before the sound starts are on once it does', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.setPedal('reverb', true);
    audio.start();
    assert.ok(ctx().buffers.some((b) => b.numberOfChannels === 2), "the hall's echo is worked out at the start");
    const reverbIn = downstream(playOn(ctx, audio, 'acoustic')[0].node).find((n) => n.pedal === 'reverb');
    const send = reverbIn.outs.find((n) => n.gain && n.outs.some((o) => o.kind === 'convolver'));
    assert.equal(send.gain.value, 1);
  }));

test('the tremolo pulses on the 8th notes, lined up with the band when it starts', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.startBand(1.5);
    const waves = ctx().started.filter((s) => s.kind === 'osc' && s.node.type === 'custom');
    assert.equal(waves.at(-1).t, 1.5, 'a new wave starts with the band');
    assert.ok(Math.abs(waves.at(-1).node.frequency.value - 2 / BEAT) < 1e-9, 'at the 8th notes');
    assert.deepEqual([...waves.at(-1).node.wave.real], [0, 1], 'a cosine: loudest on the 8th itself');
    assert.ok(ctx().stopped.some((st) => st.node === waves.at(-2).node && st.t === 1.5), 'the old wave hands over');
  }));

test('the delay echoes on the dotted 8th and fades over three or four repeats', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    const nodes = downstream(playOn(ctx, audio, 'acoustic')[0].node);
    const line = nodes.find((n) => n.kind === 'delay' && n.delayTime.value > 0.1);
    assert.ok(Math.abs(line.delayTime.value - BEAT * 0.75) < 1e-9);
    const loop = downstream(line).find((n) => n.gain && n.outs.includes(line));
    const repeat = loop.gain.value;
    assert.ok(repeat ** 3 > 0.03 && repeat ** 5 < 0.01, `each echo ${repeat} of the one before`);
  }));
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL. `audio.js` has no `VOICING` or `softClip` export.

- [ ] **Step 3: Write the voices and the pedal chain**

Replace `open-case/src/audio.js` with:

```js
// All of Open Case's sound, made live with Web Audio (there are no audio files).
//   - Your instrument. The guitars are plucked-string synths (Karplus-Strong): each note's samples are
//     worked out the first time it's played and kept, so a key press only starts a buffer and it
//     sounds at once. The electric piano and the synth are made from oscillators as each note starts.
//   - Your pedals, between your instrument and the speakers, chained in the usual order: overdrive,
//     chorus, tremolo, delay, reverb. A stomp fades a pedal in or out over a few milliseconds.
//   - The band: electric piano, drums, bass, hats and pad from groove.js's patterns, scheduled a
//     little ahead of the audio clock, as Last Light's score is. Each layer plays into its own bus
//     (its slot): switching a layer is a fade on that bus at a bar line.
//   - Vinyl crackle, a dusty filter over the band, the tape wobble, coins landing and applause.
// Browsers only allow sound after a key press or click, so start() is called from inside one
// (main.js). M mutes; the volume and mute are remembered.
import { bandAt, timeOf16th, midiToHz, BAR, BEAT } from './groove.js';
import { LAYERS, PLAY, GROOVE } from './tuning.js';
import { PEDALS } from './gear.js';

const MUTE_KEY = 'open-case-muted', VOLUME_KEY = 'open-case-volume';
const PICK = [0.35, 0.55, 0.8, 1]; // loudness by pick strength 1-4
const BRIGHT = [0.2, 0.35, 0.55, 0.8]; // the acoustic's pick's brightness by strength
const BAND_LEVEL = 0.55; // the band bus's level under your instrument
// The percussion standing in for the drums: on only while the drums slot is off. Lo-fi and soft, not
// a metronome: a shaker, a finger snap and a low tap, not a beeping tone.
const PERC_SHAKER_HZ = 7000; // the shaker: bright but soft noise
const PERC_SHAKER_LEVEL = 0.24;
const PERC_SHAKER_ATTACK = 0.015; // a soft attack, so it swishes rather than clicks
const PERC_SNAP_HZ = 2400; // the finger snap: a crisp noise band...
const PERC_SNAP_TONE_HZ = 1200; // ...with a touch of tone
const PERC_SNAP_LEVEL = 0.32;
const PERC_TAP_HZ = 95; // the low tap: a soft thud, like a hand on the guitar's body
const PERC_TAP_DROP_HZ = 55; // ...its pitch dropping quickly
const PERC_TAP_LEVEL = 0.4;

// Each instrument's voicing. `pluck` is a guitar's string: how long it rings (seconds to fall 60 dB), its pick's
// brightness by strength, where the pick meets the string (a share of its length from the bridge),
// and how much its highs outlast a plain string's (the loop filter's stretch: 0.5 is plain, lower
// rings brighter). `level` evens out their loudness; `release` is how long a note takes to fall quiet
// once its key is up; `tone` is the filters that shape each before the pedals: [type, Hz, dB].
export const VOICING = {
  acoustic: {
    pluck: { ring: PLAY.ring, bright: BRIGHT, pick: 0.13, stretch: 0.5 },
    level: 0.9, release: PLAY.damp, tone: [['peaking', 180, 4], ['lowpass', 5200]],
  },
  ukulele: {
    pluck: { ring: 1.5, bright: [0.3, 0.45, 0.65, 0.85], pick: 0.2, stretch: 0.5 },
    level: 1, release: PLAY.damp, tone: [['highpass', 200], ['peaking', 1000, 3], ['lowpass', 6500]],
  },
  electric: {
    pluck: { ring: 6, bright: [0.15, 0.25, 0.4, 0.6], pick: 0.22, stretch: 0.35 },
    level: 0.8, release: PLAY.damp, tone: [['highpass', 90], ['peaking', 1400, 3], ['lowpass', 4000]],
  },
  epiano: { level: 0.9, release: 0.2, tone: [['peaking', 250, 2], ['lowpass', 6000]] },
  synth: { level: 0.8, release: 0.25, tone: [['lowpass', 7000]] },
};
// The electric piano: a sine bent by a second sine at its pitch, the tine's bite fading into a round
// tone, with a bell an octave and a fifth up at the very start.
const EP_LEVEL = 0.13;
const EP_BITE = [0.5, 2]; // how far the second sine bends the first, from the softest pick to the hardest (x pitch)
const EP_MELLOW = 0.15; // ...and where it settles (x pitch)
const EP_FADE = 1.2; // seconds: a middle C fades by 63% in this long; higher notes fade faster
const EP_BELL = 0.12; // the bell's level next to the note
// The synth: two sawtooths a few cents apart and a square an octave down (type, pitch ratio, cents,
// level), through a low-pass filter that opens as a key goes down, then settles.
const SYNTH_OSCS = [['sawtooth', 1, -7, 0.5], ['sawtooth', 1, 7, 0.5], ['square', 0.5, 0, 0.2]];
const SYNTH_LEVEL = 0.22;
const SYNTH_OPEN = [3, 13]; // the filter opens to this many times the pitch, softest to hardest...
const SYNTH_REST = [1.5, 4.5]; // ...and settles here
const SYNTH_Q = 2;

// The pedals.
const PEDAL_FADE = 0.008; // seconds: a stomp's fade (its time constant)
const OD_DRIVE = 2.5; // the overdrive's gain into the clipper: a soft pick is barely touched, a hard one crunches
const OD_CURVE = 3; // how round the clipping is
const OD_TONE = 2600; // Hz: the overdrive's darker tone
const OD_LEVEL = 0.16; // its level: a soft pick comes out about as loud as with the pedal off
const CHORUS_DELAY = 0.012; // seconds: the copy's delay...
const CHORUS_DEPTH = 0.003; // ...wobbling this much either way...
const CHORUS_RATE = 0.8; // ...this many times a second
const CHORUS_MIX = 0.6; // the copy's level; your own sound drops to CHORUS_DRY under it
const CHORUS_DRY = 0.8;
const TREMOLO_DEPTH = 0.35; // the volume swings this share either way, on the 8th notes
const DELAY_TIME = BEAT * 0.75; // a dotted 8th
const DELAY_FEEDBACK = 0.38; // each echo is this loud next to the one before...
const DELAY_MIX = 0.45; // ...and the first this loud next to your note
const DELAY_TONE = 2800; // Hz: each echo a little darker
const REVERB_TIME = 2.4; // seconds for the hall to fall 60 dB
const REVERB_MIX = 0.5;

// A plucked string's samples: up to `ring` + 0.3 seconds of a string at `hz`, picked at strength 1-4,
// cut short once it's inaudible. Karplus-Strong with an all-pass for exact tuning; the loop loses
// enough each period for the fundamental to fall 60 dB over `ring`.
export function pluckSamples(rate, hz, strength = 3, { ring = PLAY.ring, bright = BRIGHT, pick = 0.13, stretch = 0.5 } = {}) {
  const period = rate / hz;
  const n = Math.max(2, Math.floor(period - stretch - 0.1));
  const frac = period - stretch - n; // the loop filter delays by `stretch` samples; the all-pass the rest
  const c = (1 - frac) / (1 + frac);
  const loss = Math.pow(10, -3 / (ring * hz));
  // The pick: noise, smoothed more for a softer pick, with the notch of plucking near the bridge.
  const line = new Float32Array(n);
  let seed = 12345 + Math.round(hz * 7), y = 0, mean = 0;
  const b = bright[strength - 1];
  for (let i = 0; i < n; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    y += b * ((seed / 4294967296) * 2 - 1 - y);
    line[i] = y;
  }
  const notch = Math.max(1, Math.round(n * pick));
  for (let i = n - 1; i >= notch; i--) line[i] -= line[i - notch];
  for (let i = 0; i < n; i++) mean += line[i] / n;
  let peak = 1e-9;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs((line[i] -= mean)));
  for (let i = 0; i < n; i++) line[i] *= 0.5 / peak;
  const out = new Float32Array(Math.ceil(rate * (ring + 0.3)));
  let idx = 0, last = 0, apIn = 0, apOut = 0, loud = 0;
  for (let i = 0; i < out.length; i++) {
    const x = line[idx];
    out[i] = x;
    loud = Math.max(loud, Math.abs(x));
    if ((i & 1023) === 1023) {
      if (loud < 3e-4) return out.slice(0, i + 1); // about 65 dB down: silent
      loud = 0;
    }
    const avg = loss * ((1 - stretch) * x + stretch * last);
    last = x;
    apOut = c * avg + apIn - c * apOut;
    apIn = avg;
    line[idx] = apOut;
    idx = idx + 1 === n ? 0 : idx + 1;
  }
  return out;
}

// The overdrive's clipping curve: straight for quiet input, rounding off smoothly toward +-1.
export function softClip(k = OD_CURVE, n = 1025) {
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) curve[i] = Math.tanh(k * ((i / (n - 1)) * 2 - 1)) / Math.tanh(k);
  return curve;
}

export function createAudio(storage) {
  let ctx = null, master = null, band = null, noise = null, wobble = null;
  const bus = {}; // a gain per layer: the layer slots
  const inputs = {}; // a gain per instrument, into its tone filters and on into the pedals
  const pedals = {}; // id -> { input, output, set(on, at) }
  let tremoloDepth = null, tremoloWave = null;
  let instrument = 'acoustic';
  const pedalOn = Object.fromEntries(PEDALS.map((id) => [id, false]));
  const plucks = new Map(); // `${pitch}:${strength}` -> AudioBuffer, for the instrument you play
  const voices = new Map(); // key code -> the voice sounding: { g, sources, release }
  const ringing = new Set(); // voices whose key is up but Space holds them
  let ring = false;
  let muted = storage.get(MUTE_KEY) === '1';
  let volume = Number(storage.get(VOLUME_KEY) ?? 0.8);
  if (!(volume >= 0 && volume <= 1)) volume = 0.8;
  let loopAt = -1, next16 = 0, stopAt = Infinity, crackleAt = 0;
  const level = () => (muted ? 0 : volume);

  function start() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return;
    }
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return;
    ctx = new AC({ latencyHint: 'interactive' }); // the lowest delay the browser can keep up with
    master = ctx.createGain();
    master.gain.value = level();
    master.connect(ctx.destination);
    // The dusty filter over the band: no deep lows, soft highs.
    const hp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 70;
    lp.type = 'lowpass';
    lp.frequency.value = 3200;
    band = ctx.createGain();
    band.gain.value = BAND_LEVEL;
    band.connect(hp).connect(lp).connect(master);
    for (const { id, min } of LAYERS) {
      bus[id] = ctx.createGain();
      bus[id].gain.value = min === 0 ? 1 : 0;
      bus[id].connect(band);
    }
    // The stand-in percussion's own bus: not a crowd layer (never in LAYERS), gated the opposite of
    // the drums slot in setLayer. The drums start off, so it starts on.
    bus.perc = ctx.createGain();
    bus.perc.gain.value = 1;
    bus.perc.connect(band);
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // Your pedals, in chain order, into the speakers; and each instrument through its own tone into
    // the first pedal. Your instrument sits a little brighter than the band, so it stands out.
    Object.assign(pedals, { overdrive: overdrive(), chorus: chorus(), tremolo: tremolo(), delay: delay(), reverb: reverb() });
    PEDALS.forEach((id, i) => {
      pedals[id].input.pedal = id; // named, so the tests can follow the chain
      pedals[id].output.connect(i + 1 < PEDALS.length ? pedals[PEDALS[i + 1]].input : master);
      if (pedalOn[id]) pedals[id].set(true, ctx.currentTime);
    });
    for (const [id, { level: gain, tone: filters }] of Object.entries(VOICING)) {
      inputs[id] = ctx.createGain();
      inputs[id].gain.value = gain;
      let node = inputs[id];
      for (const [type, hz, db] of filters) {
        const f = ctx.createBiquadFilter();
        f.type = type;
        f.frequency.value = hz;
        if (db) f.gain.value = db;
        node = node.connect(f);
      }
      node.connect(pedals[PEDALS[0]].input);
    }
    newTremoloWave(ctx.currentTime);
    // The tape wobble: a slow wave on the keys' and pad's pitch, off until the top layer joins.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.55;
    wobble = ctx.createGain();
    wobble.gain.value = 0;
    lfo.connect(wobble);
    lfo.start();
    // A quiet hiss under the crackle, part of the keys layer.
    const hiss = ctx.createBufferSource(), hf = ctx.createBiquadFilter(), hg = ctx.createGain();
    hiss.buffer = noise;
    hiss.loop = true;
    hf.type = 'bandpass';
    hf.frequency.value = 4000;
    hf.Q.value = 0.5;
    hg.gain.value = 0.02;
    hiss.connect(hf).connect(hg).connect(bus.keys);
    hiss.start();
  }

  const now = () => (ctx ? ctx.currentTime : 0);

  // The pedals. Each is a little graph from `input` to `output`; set(on, at) fades its effect in or
  // out, so a stomp never clicks and the sound never drops out.
  const fade = (param, value, at) => param.setTargetAtTime(value, at, PEDAL_FADE);

  // Overdrive: soft clipping, which a harder pick drives further, then a darker tone. It takes over
  // from your clean sound.
  function overdrive() {
    const input = ctx.createGain(), output = ctx.createGain(), clean = ctx.createGain(), driven = ctx.createGain();
    const drive = ctx.createGain(), clip = ctx.createWaveShaper(), dark = ctx.createBiquadFilter();
    drive.gain.value = OD_DRIVE;
    clip.curve = softClip();
    clip.oversample = '4x'; // clipping makes highs that would otherwise fold back down as harsh noise
    dark.type = 'lowpass';
    dark.frequency.value = OD_TONE;
    driven.gain.value = 0;
    input.connect(clean).connect(output);
    input.connect(drive).connect(clip).connect(dark).connect(driven).connect(output);
    return {
      input, output,
      set(on, at) {
        fade(clean.gain, on ? 0 : 1, at);
        fade(driven.gain, on ? OD_LEVEL : 0, at);
      },
    };
  }

  // Chorus: a copy of your sound a few milliseconds late, the delay slowly wobbling, mixed in.
  function chorus() {
    const input = ctx.createGain(), output = ctx.createGain(), dry = ctx.createGain(), copy = ctx.createGain();
    const late = ctx.createDelay(0.05), lfo = ctx.createOscillator(), depth = ctx.createGain();
    late.delayTime.value = CHORUS_DELAY;
    lfo.frequency.value = CHORUS_RATE;
    depth.gain.value = CHORUS_DEPTH;
    lfo.connect(depth).connect(late.delayTime);
    lfo.start();
    copy.gain.value = 0;
    input.connect(dry).connect(output);
    input.connect(late).connect(copy).connect(output);
    return {
      input, output,
      set(on, at) {
        fade(dry.gain, on ? CHORUS_DRY : 1, at);
        fade(copy.gain, on ? CHORUS_MIX : 0, at);
      },
    };
  }

  // Tremolo: the volume swinging either side of where it was, on the 8th notes, so switching it on
  // doesn't make you quieter. The wave comes from newTremoloWave, which lines it up with the band.
  function tremolo() {
    const amp = ctx.createGain();
    tremoloDepth = ctx.createGain();
    tremoloDepth.gain.value = 0;
    tremoloDepth.connect(amp.gain);
    return { input: amp, output: amp, set: (on, at) => fade(tremoloDepth.gain, on ? TREMOLO_DEPTH : 0, at) };
  }

  // A new wave for the tremolo, a cosine at the 8th notes' rate starting at `at` (the band's first
  // 16th, or any moment when there's no band), so its peaks land on the 8ths. The old wave plays
  // until the new one takes over.
  function newTremoloWave(at) {
    const wave = ctx.createOscillator();
    wave.setPeriodicWave(ctx.createPeriodicWave(new Float32Array([0, 1]), new Float32Array([0, 0])));
    wave.frequency.value = 2 / BEAT;
    wave.connect(tremoloDepth);
    wave.start(at);
    tremoloWave?.stop(at);
    tremoloWave = wave;
  }

  // Delay: echoes on the dotted 8th, each a little quieter and darker. Switched off, it stops taking
  // in new notes, and the echoes already going fade away on their own.
  function delay() {
    const input = ctx.createGain(), output = ctx.createGain(), send = ctx.createGain(), wet = ctx.createGain();
    const line = ctx.createDelay(2), dark = ctx.createBiquadFilter(), again = ctx.createGain();
    send.gain.value = 0;
    line.delayTime.value = DELAY_TIME;
    dark.type = 'lowpass';
    dark.frequency.value = DELAY_TONE;
    again.gain.value = DELAY_FEEDBACK;
    wet.gain.value = DELAY_MIX;
    input.connect(output);
    input.connect(send).connect(line).connect(dark).connect(again).connect(line);
    dark.connect(wet).connect(output);
    return { input, output, set: (on, at) => fade(send.gain, on ? 1 : 0, at) };
  }

  // Reverb: a warm hall behind your notes. Like the delay, switching it off lets the hall die away.
  function reverb() {
    const input = ctx.createGain(), output = ctx.createGain(), send = ctx.createGain(), wet = ctx.createGain();
    const hall = ctx.createConvolver();
    send.gain.value = 0;
    hall.normalize = false; // hallSound scales it
    hall.buffer = hallSound();
    wet.gain.value = REVERB_MIX;
    input.connect(output);
    input.connect(send).connect(hall).connect(wet).connect(output);
    return { input, output, set: (on, at) => fade(send.gain, on ? 1 : 0, at) };
  }

  // The hall's echo, worked out once at the start: two channels of noise dying away over REVERB_TIME,
  // after a moment's silence, its highs dying first, so it sounds warm. It's scaled so the whole
  // echo carries as much energy as the note that set it off (the browser's own scaling would leave
  // it far quieter), and REVERB_MIX sets how loud it is.
  function hallSound() {
    const rate = ctx.sampleRate, n = Math.floor(rate * REVERB_TIME), gap = Math.floor(rate * 0.012);
    const hall = ctx.createBuffer(2, n, rate);
    for (let c = 0; c < 2; c++) {
      const d = hall.getChannelData(c);
      let y = 0, energy = 0;
      for (let i = gap; i < n; i++) {
        const k = 0.85 * Math.min(1, (i / n) * 1.5); // smoothed more as it goes: darker...
        y = k * y + (1 - k) * (Math.random() * 2 - 1);
        d[i] = y * Math.sqrt((1 + k) / (1 - k)) * Math.exp((-6.9 * i) / n); // ...but no quieter for it
        energy += d[i] * d[i];
      }
      const scale = 1 / Math.sqrt(energy || 1);
      for (let i = gap; i < n; i++) d[i] *= scale;
    }
    return hall;
  }

  function bufferFor(pitch, strength) {
    const key = `${pitch}:${strength}`;
    let buf = plucks.get(key);
    if (!buf) {
      const data = pluckSamples(ctx.sampleRate, midiToHz(pitch), strength, VOICING[instrument].pluck);
      buf = ctx.createBuffer(1, data.length, ctx.sampleRate);
      buf.getChannelData(0).set(data);
      plucks.set(key, buf);
    }
    return buf;
  }

  // Works out a range of notes' samples ahead of time (in idle moments), so no key press waits. Only
  // the guitars need it: the keyboards are made on the spot.
  function warm(pitches, strength) {
    if (ctx && VOICING[instrument].pluck) for (const p of pitches) bufferFor(p, strength);
  }

  // The voices, one per note: each starts at `at` into its instrument's input and returns what damp()
  // needs to stop it, { g: its gain, sources: what to stop }.
  function pluckVoice(pitch, strength, at, legato) {
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = bufferFor(pitch, strength);
    g.gain.value = PICK[strength - 1] * (legato ? PLAY.legatoGain : 1);
    src.connect(g).connect(inputs[instrument]);
    src.start(at, legato ? 0.012 : 0); // a hammer-on has no pick attack
    return { g, sources: [src] };
  }

  function epianoVoice(pitch, strength, at, legato) {
    const f = midiToHz(pitch), vel = PICK[strength - 1] * (legato ? PLAY.legatoGain : 1);
    const note = ctx.createOscillator(), bend = ctx.createOscillator(), bite = ctx.createGain(), g = ctx.createGain();
    const bell = ctx.createOscillator(), ding = ctx.createGain();
    note.frequency.value = f;
    bend.frequency.value = f;
    bite.gain.setValueAtTime(f * (EP_BITE[0] + (EP_BITE[1] - EP_BITE[0]) * vel), at);
    bite.gain.setTargetAtTime(f * EP_MELLOW, at, 0.3);
    bend.connect(bite).connect(note.frequency);
    bell.frequency.value = f * 3;
    ding.gain.setValueAtTime(EP_BELL * vel, at);
    ding.gain.setTargetAtTime(0, at, 0.04);
    const decay = EP_FADE * Math.min(1.5, Math.sqrt(262 / f)); // higher notes die sooner
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(vel * EP_LEVEL, at + 0.003);
    g.gain.setTargetAtTime(0, at + 0.003, decay);
    note.connect(g).connect(inputs.epiano);
    bell.connect(ding).connect(g);
    const sources = [note, bend, bell];
    for (const o of sources) {
      o.start(at);
      o.stop(at + decay * 7); // by then it's 60 dB down
    }
    return { g, sources };
  }

  function synthVoice(pitch, strength, at, legato) {
    const f = midiToHz(pitch), vel = PICK[strength - 1];
    const filter = ctx.createBiquadFilter(), g = ctx.createGain(), sources = [];
    const between = ([lo, hi]) => f * (lo + (hi - lo) * vel);
    const rest = Math.min(9000, between(SYNTH_REST));
    filter.type = 'lowpass';
    filter.Q.value = SYNTH_Q;
    filter.frequency.setValueAtTime(legato ? rest : Math.min(14000, between(SYNTH_OPEN)), at);
    filter.frequency.setTargetAtTime(rest, at, 0.12);
    for (const [type, ratio, cents, gain] of SYNTH_OSCS) {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = type;
      o.frequency.value = f * ratio;
      o.detune.value = cents;
      og.gain.value = gain;
      o.connect(og).connect(filter);
      o.start(at);
      sources.push(o);
    }
    const loud = vel * SYNTH_LEVEL * (legato ? PLAY.legatoGain : 1);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(loud, at + 0.01);
    g.gain.setTargetAtTime(loud * 0.75, at + 0.01, 0.3);
    filter.connect(g).connect(inputs.synth);
    return { g, sources };
  }

  const VOICES = { acoustic: pluckVoice, ukulele: pluckVoice, electric: pluckVoice, epiano: epianoVoice, synth: synthVoice };

  function noteOn(code, pitch, strength, at, legato) {
    if (!ctx) return;
    noteOff(code, at); // the same key again: the old note stops
    const voice = VOICES[instrument](pitch, strength, Math.max(at, ctx.currentTime), legato);
    voices.set(code, { ...voice, release: VOICING[instrument].release });
  }

  function damp(v, at) {
    const t = Math.max(at, ctx.currentTime);
    v.g.gain.setTargetAtTime(0, t, v.release / 4);
    for (const src of v.sources) {
      try {
        src.stop(t + v.release * 2);
      } catch {
        // an older browser that allows only one stop: the electric piano's own stop stands
      }
    }
  }

  function noteOff(code, at) {
    const v = voices.get(code);
    if (!v) return;
    voices.delete(code);
    if (ring) ringing.add(v);
    else damp(v, at);
  }

  // Space: while it's held, released notes ring on (the keyboards' sustain pedal); letting go damps them.
  function setRing(on) {
    ring = on;
    if (!on && ctx) {
      for (const v of ringing) damp(v, ctx.currentTime);
      ringing.clear();
    }
  }

  // The instrument your next notes play. Notes already sounding carry on. Returns whether it changed
  // (the guitars' samples then need working out again: see warm).
  function setInstrument(id) {
    if (!(id in VOICING) || id === instrument) return false;
    instrument = id;
    plucks.clear(); // only the instrument you play keeps its samples, so memory stays small
    return true;
  }

  // Switches a pedal on or off, fading from `at`. Before the sound starts, it's remembered for start().
  function setPedal(id, on, at = now()) {
    if (!(id in pedalOn) || pedalOn[id] === on) return;
    pedalOn[id] = on;
    if (ctx) pedals[id].set(on, Math.max(at, ctx.currentTime));
  }

  function tone(out, t, { len, type = 'sine', freq, to, vol, attack = 0.005, detune = false }) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + len);
    if (detune) wobble.connect(o.detune);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + len + 0.05);
    return o;
  }
  function burst(out, t, { len, type = 'bandpass', freq, q = 1, vol, attack = 0 }) {
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noise;
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    if (attack > 0) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + attack); // a soft onset, for the shaker's swish
    } else {
      g.gain.setValueAtTime(vol, t);
    }
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    src.connect(f).connect(g).connect(out);
    src.start(t, Math.random() * 1.5, len + 0.05);
  }

  // One band note into its layer's bus. len is in seconds.
  function playBand(layer, n, t, len) {
    const out = bus[layer], f = midiToHz(n.note);
    switch (n.voice) {
      case 'ep': {
        // A soft electric piano: a sine with a sine modulating it, the tine's bite dying away.
        const mod = ctx.createOscillator(), depth = ctx.createGain();
        mod.frequency.value = f;
        depth.gain.setValueAtTime(f * 1.4, t);
        depth.gain.exponentialRampToValueAtTime(f * 0.2, t + 0.6);
        const car = tone(out, t, { len, freq: f, vol: n.vel * 0.12, attack: 0.004, detune: true });
        mod.connect(depth).connect(car.frequency);
        wobble.connect(mod.detune);
        mod.start(t);
        mod.stop(t + len + 0.05);
        break;
      }
      case 'kick':
        tone(out, t, { len: 0.35, freq: 110, to: 42, vol: n.vel * 0.9 });
        break;
      case 'snare':
        burst(out, t, { len: 0.18, freq: 1800, q: 0.7, vol: n.vel * 0.5 });
        tone(out, t, { len: 0.09, type: 'triangle', freq: 190, vol: n.vel * 0.25 });
        break;
      case 'hat':
        burst(out, t, { len: 0.04, type: 'highpass', freq: 7000, vol: n.vel * 0.3 });
        break;
      case 'bass':
        tone(out, t, { len, type: 'triangle', freq: f, vol: n.vel * 0.45, attack: 0.01 });
        break;
      case 'pad':
        tone(out, t, { len, type: 'sawtooth', freq: f, vol: n.vel * 0.03, attack: 0.4, detune: true });
        tone(out, t, { len, type: 'sawtooth', freq: f * 1.004, vol: n.vel * 0.03, attack: 0.4, detune: true });
        break;
      case 'shaker': // bright but soft noise, with a swish rather than a click
        burst(out, t, { len: 0.05, type: 'bandpass', freq: PERC_SHAKER_HZ, q: 0.7, vol: n.vel * PERC_SHAKER_LEVEL, attack: PERC_SHAKER_ATTACK });
        break;
      case 'snap': // a crisp noise burst with a touch of tone, not loud
        burst(out, t, { len: 0.03, type: 'bandpass', freq: PERC_SNAP_HZ, q: 1.3, vol: n.vel * PERC_SNAP_LEVEL });
        tone(out, t, { len: 0.03, type: 'triangle', freq: PERC_SNAP_TONE_HZ, vol: n.vel * PERC_SNAP_LEVEL * 0.3, attack: 0.002 });
        break;
      case 'tap': // a soft low thud on the downbeat, its pitch dropping quickly, quiet
        tone(out, t, { len: 0.1, freq: PERC_TAP_HZ, to: PERC_TAP_DROP_HZ, vol: n.vel * PERC_TAP_LEVEL });
        break;
    }
  }

  // The band starts with your first note: 16th 0 sounds at `at`.
  function startBand(at) {
    if (!ctx) return;
    loopAt = at;
    next16 = 0;
    stopAt = Infinity;
    newTremoloWave(at);
    band.gain.cancelScheduledValues(at);
    band.gain.setValueAtTime(BAND_LEVEL, at);
  }

  // The end of the set: the band fades out over a bar from `at`, and stops.
  function endBand(at) {
    if (!ctx) return;
    band.gain.setValueAtTime(BAND_LEVEL, at);
    band.gain.linearRampToValueAtTime(0, at + BAR);
    stopAt = at + BAR;
  }

  function stopBand() {
    loopAt = -1;
  }

  // A layer slot switched on or off, at a bar line (or at once, from the sound check).
  function setLayer(id, on, at = now()) {
    if (!ctx) return;
    bus[id].gain.setTargetAtTime(on ? 1 : 0, Math.max(at, ctx.currentTime), 0.02);
    if (id === 'top') wobble.gain.setTargetAtTime(on ? 9 : 0, Math.max(at, ctx.currentTime), 0.5);
    // The stand-in percussion fills in for the drums, so it fades the opposite way, at the same moment.
    if (id === 'drums') bus.perc.gain.setTargetAtTime(on ? 0 : 1, Math.max(at, ctx.currentTime), 0.02);
  }

  // Called every frame: schedules the band's 16ths due in the next GROOVE.ahead seconds, and the crackle.
  function update() {
    if (!ctx || ctx.state !== 'running' || loopAt < 0) return;
    const t = ctx.currentTime;
    // After a stall, skip what's already late rather than playing it all at once.
    while (loopAt + timeOf16th(next16) < t - 0.1) next16++;
    while (loopAt + timeOf16th(next16) < t + GROOVE.ahead && loopAt + timeOf16th(next16) < stopAt) {
      const at = loopAt + timeOf16th(next16);
      for (const { id } of LAYERS) {
        for (const n of bandAt(id, next16)) playBand(id, n, at, loopAt + timeOf16th(next16 + n.len) - at);
      }
      for (const n of bandAt('perc', next16)) playBand('perc', n, at, loopAt + timeOf16th(next16 + n.len) - at);
      next16++;
    }
    if (t >= crackleAt && t < stopAt) {
      crackleAt = t + 0.03 + Math.random() * 0.25;
      burst(bus.keys, t, { len: 0.004 + Math.random() * 0.01, type: 'highpass', freq: 2000 + Math.random() * 4000, vol: 0.05 + Math.random() * 0.12 });
    }
  }

  function coin(at = now()) {
    if (!ctx) return;
    const f = 2100 + Math.random() * 300;
    tone(master, at, { len: 0.5, freq: f, vol: 0.12, attack: 0.002 });
    tone(master, at + 0.06, { len: 0.4, freq: f * 1.5, vol: 0.07, attack: 0.002 });
  }

  // Applause from `people` listeners, over a few seconds.
  function clap(people, at = now()) {
    if (!ctx) return;
    const count = Math.round(8 + people * 14);
    for (let i = 0; i < count; i++) {
      const t = at + Math.random() * (1.2 + people * 0.3);
      burst(master, t, { len: 0.03, freq: 1100 + Math.random() * 900, q: 1.2, vol: 0.12 + Math.random() * 0.1 });
    }
  }

  // The delay the browser reports between the audio clock and your ears, in ms.
  function reportedLatency() {
    if (!ctx) return null;
    return ((ctx.baseLatency || 0) + (ctx.outputLatency || 0)) * 1000;
  }

  // When a sound started at context time `at` will be heard, on the page's performance.now() clock.
  function heardAt(at) {
    if (!ctx?.getOutputTimestamp) return null;
    const ts = ctx.getOutputTimestamp();
    if (!ts.performanceTime) return null;
    return ts.performanceTime + (Math.max(at, ctx.currentTime) - ts.contextTime) * 1000;
  }

  return {
    start, now, warm, noteOn, noteOff, setRing, setInstrument, setPedal, startBand, endBand, stopBand, setLayer,
    update, coin, clap, reportedLatency, heardAt,
    get started() {
      return !!ctx;
    },
    get instrument() {
      return instrument;
    },
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
      // Always call, unconditionally: ctx.suspend() changes state asynchronously in Safari and
      // Firefox, so a fast second Esc can see 'running' and skip the resume, leaving the clock frozen
      // with no pause card. suspend() and resume() are queued in order, so this is safe either way.
      ctx?.resume();
    },
  };
}
```

- [ ] **Step 4: Give the sound check the instruments and pedals**

Replace `open-case/src/soundcheck.js` with:

```js
// The sound check (/open-case/?sound): the loop with a switch per layer, and your instrument on the
// keys, so the sounds and the beat can be judged by ear before anything else. Every instrument and
// pedal in the shop can be tried here, without buying it (keys 2 to 6 stomp the pedals too). No
// crowd, no set: the loop plays until you leave.
import { createInput } from './input.js';
import { layoutPitches } from './keys.js';
import { STOCK } from './gear.js';

// Browsers don't treat these as user activation (Chrome doesn't for a lone modifier, no browser does
// for Esc), so starting an AudioContext from one leaves it suspended.
const NON_ACTIVATING_KEYS = new Set(['Escape', 'Shift', 'Control', 'Alt', 'Meta', 'CapsLock']);

export function soundCheck(audio, { debug }) {
  const panel = document.getElementById('sound');
  const latency = document.getElementById('latency');
  panel.hidden = false;
  document.getElementById('game').hidden = true;
  const boxes = [...panel.querySelectorAll('input[data-layer]')];
  let started = false, measured = null;

  const begin = () => {
    if (started) return;
    started = true;
    audio.start();
    warm();
    audio.startBand(audio.now() + 0.1);
    for (const box of boxes) audio.setLayer(box.dataset.layer, box.checked);
    document.getElementById('sound-start').hidden = true;
  };
  for (const box of boxes) box.addEventListener('change', () => started && audio.setLayer(box.dataset.layer, box.checked));
  // The shop's instruments and pedals, from its stock.
  const choice = document.getElementById('sound-instrument'), pedals = document.getElementById('sound-pedals');
  const warm = () => audio.warm(layoutPitches(input.keys), input.keys.strength);
  for (const item of STOCK) {
    if (item.kind === 'instrument') choice.add(new Option(item.name, item.id));
    else {
      const label = document.createElement('label'), box = document.createElement('input');
      box.type = 'checkbox';
      box.dataset.pedal = item.id;
      box.addEventListener('change', () => audio.setPedal(item.id, box.checked));
      label.append(box, ` ${item.name} (${item.key})`);
      pedals.append(label);
    }
  }
  choice.addEventListener('change', () => {
    if (audio.setInstrument(choice.value)) warm();
    choice.blur(); // so the arrow keys and letters play, not change the choice
  });
  panel.addEventListener('click', begin);
  // Any key starts the sound; that key plays no note.
  addEventListener('keydown', (e) => {
    if (started || e.metaKey || e.ctrlKey || e.altKey) return;
    if (NON_ACTIVATING_KEYS.has(e.key)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    begin();
  });

  const input = createInput(window, {
    now: audio.now,
    onNote: (n) => {
      audio.noteOn(n.code, n.pitch, n.strength, n.at, n.legato);
      // A strummed note's `at` is deliberately later than now (the strum gap); only notes that sound
      // at once tell us the true key-to-sound latency.
      if (n.at <= audio.now()) {
        const heard = audio.heardAt(n.at);
        if (heard !== null) measured = heard - n.timeStamp;
      }
    },
    onRelease: (r) => audio.noteOff(r.code, r.at),
    onControl: (action, down) => {
      if (action === 'ring') audio.setRing(down);
      else if (action === 'mute') audio.toggleMute();
      else if (action !== 'pause') warm();
    },
    onPedal: (id) => {
      const box = pedals.querySelector(`[data-pedal="${id}"]`);
      box.checked = !box.checked;
      audio.setPedal(id, box.checked);
    },
  });
  if (debug) window.__openCase = { audio, input, get measured() { return measured; } };

  const frame = () => {
    audio.update();
    const reported = audio.reportedLatency();
    latency.textContent = `Octave ${input.keys.octave}, pick ${input.keys.strength} of 4${input.keys.lock ? ', scale lock on' : ''}. `
      + `Browser's reported audio delay: ${reported == null ? 'not reported' : `${reported.toFixed(0)} ms`}. `
      + `Last key to sound: ${measured == null ? 'play a note' : `${measured.toFixed(0)} ms`}.`;
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
```

In `open-case/index.html`, make these four edits.

The fonts rule takes in the select:

```css
    body, button, input { font: 12px/1.6 Silkscreen, monospace; color: #fff2cc; }
```
becomes
```css
    body, button, input, select { font: 12px/1.6 Silkscreen, monospace; color: #fff2cc; }
```

A row can wrap:

```css
    .card .row { display: flex; gap: 12px; justify-content: center; margin-top: 8px; }
```
becomes
```css
    .card .row { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 8px; }
```

The select looks like the buttons:

```css
    .card button { padding: 6px 12px; background: #43286a; border: 2px solid #93406f; cursor: pointer; }
```
becomes
```css
    .card button, .card select { padding: 6px 12px; background: #43286a; border: 2px solid #93406f; cursor: pointer; }
```

The sound check's help line gains the pedal keys, with the instrument menu and the pedal row after it:

```html
    <p>Play the guitar on the keys: A to ' and W E T Y U O P. Z X octave, C V softer or louder, Space lets notes ring, 1 scale lock, M mute.</p>
```
becomes
```html
    <p>Play on the keys: A to ' and W E T Y U O P. Z X octave, C V softer or louder, Space lets notes ring, 1 scale lock, 2 to 6 pedals, M mute.</p>
    <label>Instrument <select id="sound-instrument"></select></label>
    <div class="row" id="sound-pedals"></div>
```

- [ ] **Step 5: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 158 tests (the page test finds `#sound-instrument` and `#sound-pedals`).

- [ ] **Step 6: Commit**

```bash
git add open-case/src/audio.js open-case/src/soundcheck.js open-case/index.html open-case/test/fake-audio.js open-case/test/audio.test.js
git commit -m "Open Case: four new instruments and five pedals in the sound, and the sound check tries them all

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: The art for the shop and the gear

**Files:**
- Modify: `art/open-case/draw.lua`, `art/open-case/sprites.lua`
- Create: `art/open-case/gear.lua`, `art/open-case/shop.lua`
- Regenerate: `open-case/assets/sprites.png`, `open-case/assets/sprites.json`
- Modify: `open-case/test/art.test.js`
- Modify: `open-case/src/render.js`, `open-case/test/render.test.js` (only the renamed frames of you, so the suite stays green)

**Interfaces:**
- Consumes (Tasks 1, 2): `STOCK`, `PEDALS`, `INSTRUMENTS` from `gear.js`; `CARD` from `shop.js` (for the art test).
- Produces new frames in the sheet:
  - `you-<instrument>-idle-0..1` and `you-<instrument>-play-0..2` for each of the five instruments, replacing `you-idle-*` and `you-strum-*`;
  - `pedal-<id>-0..1`, `strip-<id>-0..1` and `amp`;
  - `shop-room`, `shop-counter`, `keeper-0..3`, `item-<id>-0..1` (all ten items), `tag-price` and `tag-yours`.
- Produces new `sprites.json` data:
  - `feet.amp` and `feet.pedals`;
  - `shop` — `{ items: { id: [x, y, w, h] }, leds: { id: [x, y] }, door: [x, y, w, h], sign: [x, y], board: [x, y], lift }`.
- `render.js`: `youFrame(scene, t, time, instrument)`.

**Note:** in this task `render.js` draws you with the acoustic guitar always. Task 5 draws your own instrument.

- [ ] **Step 1: Write the failing test**

Replace `open-case/test/art.test.js` with:

```js
// Checks the committed art (open-case/assets/ and icon.png, written by the scripts in art/open-case/)
// against what the game expects: every frame the renderer draws, in the numbers the art spec gives,
// inside the sheet; at most 64 colours across all of it; small enough to load at once; and laid out
// round the positions the rules use.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { readPng } from './png.js';
import { KINDS, PATH_Y } from '../src/crowd.js';
import { CROWD } from '../src/tuning.js';
import { CASE } from '../src/scene.js';
import { STOCK, PEDALS, INSTRUMENTS } from '../src/gear.js';
import { CARD } from '../src/shop.js';

const file = (f) => new URL(`../${f}`, import.meta.url);
const data = JSON.parse(readFileSync(file('assets/sprites.json'), 'utf8'));
const sheet = readPng(file('assets/sprites.png'));
const names = Object.keys(data.frames);
const REACTIONS = ['repeat', 'offKey', 'callback', 'taste', 'random', 'silence', 'loud', 'recognised']; // every rule crowd.js reacts to
const range = (n) => [...Array(n).keys()];

// How many frames there are of each thing, from the art spec's table (and the sky's five stages).
const FAMILIES = [
  ['sun', 1], ['ground', 1], ['pool', 1], ['case', 1], ['case-coin', 1],
  [/^roofs-back-\d$/, 5], [/^roofs-front-\d$/, 5], [/^train-\d$/, 5], [/^trees-\d$/, 3], [/^lamp-(off|on|flicker)$/, 3],
  [/^cloud-\d+-\d$/, data.clouds.length * 5],
  [/^coin-\d$/, 2], [/^looper-\d$/, 2], [/^bird-\d$/, 2],
  ...INSTRUMENTS.flatMap((id) => [[new RegExp(`^you-${id}-idle-\\d$`), 2], [new RegExp(`^you-${id}-play-\\d$`), 3]]),
  ...PEDALS.flatMap((id) => [[new RegExp(`^pedal-${id}-\\d$`), 2], [new RegExp(`^strip-${id}-\\d$`), 2]]),
  ['amp', 1], ['shop-room', 1], ['shop-counter', 1], [/^keeper-\d$/, 4], ['tag-price', 1], ['tag-yours', 1],
  ...STOCK.map((item) => [new RegExp(`^item-${item.id}-\\d$`), 2]),
  ...KINDS.flatMap((k) => ['left', 'right'].flatMap((d) => [
    [new RegExp(`^${k}-walk-\\d-${d}$`), 4], [new RegExp(`^${k}-stand-\\d-${d}$`), 2], [new RegExp(`^${k}-nod-\\d-${d}$`), 2],
  ])),
  ...REACTIONS.map((r) => [new RegExp(`^react-${r}-\\d$`), 2]),
  ...['peck', 'walk', 'fly'].flatMap((p) => ['left', 'right'].map((d) => [new RegExp(`^pigeon-${p}-\\d-${d}$`), 2])),
];

test('every frame the game draws is there, as many of each as the spec says, and nothing else', () => {
  const count = (f) => names.filter((n) => (typeof f === 'string' ? n === f : f.test(n))).length;
  for (const [f, n] of FAMILIES) assert.equal(count(f), n, String(f));
  assert.equal(names.length, FAMILIES.reduce((sum, [, n]) => sum + n, 0), 'no frames beyond these');
  // numbered from 0, so the renderer can pick one by counting
  for (const s of range(5)) for (const n of [`roofs-back-${s}`, `roofs-front-${s}`, `train-${s}`]) assert.ok(names.includes(n), n);
  for (const k of KINDS) for (const i of range(4)) assert.ok(names.includes(`${k}-walk-${i}-left`), `${k}-walk-${i}`);
});

test('every frame lies inside sprites.png', () => {
  for (const [name, [x, y, w, h]] of Object.entries(data.frames)) {
    assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= sheet.w && y + h <= sheet.h, name);
  }
});

test('the art uses at most 64 colours, all of them in the palette', () => {
  assert.ok(data.palette.length <= 64, `${data.palette.length} colours`);
  assert.equal(new Set(data.palette).size, data.palette.length, 'no colour twice');
  const palette = new Set(data.palette);
  for (const c of [...data.sky.flat(), ...Object.values(data.colors)]) assert.ok(palette.has(c), c);
  for (const f of ['assets/sprites.png', 'icon.png']) {
    const { w, h, data: px } = f === 'icon.png' ? readPng(file(f)) : sheet;
    for (let i = 0; i < w * h; i++) {
      if (px[i * 4 + 3] === 0) continue;
      assert.equal(px[i * 4 + 3], 255, `${f}: a half-clear pixel at ${i % w},${Math.floor(i / w)}`);
      const hex = `#${[0, 1, 2].map((k) => px[i * 4 + k].toString(16).padStart(2, '0')).join('')}`;
      assert.ok(palette.has(hex), `${f}: ${hex} at ${i % w},${Math.floor(i / w)} isn't in the palette`);
    }
  }
});

test("the game's art stays under 400 KB", () => {
  const bytes = ['assets/sprites.png', 'assets/sprites.json', 'icon.png'].reduce((n, f) => n + statSync(file(f)).size, 0);
  assert.ok(bytes < 400 * 1024, `${bytes} bytes`);
});

test('the sunset data: five stages of seven bands, the windows, the stars and the coins in the case', () => {
  assert.equal(data.sky.length, 5);
  for (const stage of data.sky) assert.equal(stage.length, 7);
  assert.equal(data.bands.length, 7);
  assert.equal(data.bands[0], 0);
  data.bands.forEach((b, i) => i > 0 && assert.ok(b > data.bands[i - 1]));
  assert.ok(data.skyBottom > data.bands[6] && data.skyBottom < 180);
  assert.ok(data.windows.length >= 10);
  for (const [x, y] of data.windows) assert.ok(x >= 0 && x < 319 && y >= 0 && y < data.skyBottom);
  assert.equal(data.stars.length, 10);
  for (const [x, y] of data.stars) assert.ok(x >= 0 && x < 320 && y >= 0 && y < data.bands[3]);
  assert.equal(data.caseCoins.length, 60);
  for (const [, , layer] of data.clouds) assert.ok(layer === 1 || layer === 2);
});

// Where a frame drawn at (x, y) covers the screen: [left, top, right, bottom], right and bottom
// exclusive; and whether it has a pixel at screen point (sx, sy).
const cover = (name, x, y) => {
  const [, , w, h, ax, ay] = data.frames[name];
  return [x - ax, y - ay, x - ax + w, y - ay + h];
};
const opaqueAt = (name, x, y, sx, sy) => {
  const [fx, fy, w, h, ax, ay] = data.frames[name];
  const u = sx - (x - ax), v = sy - (y - ay);
  return u >= 0 && v >= 0 && u < w && v < h && sheet.data[((fy + v) * sheet.w + fx + u) * 4 + 3] > 0;
};

test('the art sits round the positions the rules use', () => {
  for (const id of INSTRUMENTS) {
    const [left, , right] = cover(`you-${id}-idle-0`, 0, 0);
    assert.ok(left < CROWD.playerX && CROWD.playerX < right, `you sit at CROWD.playerX with the ${id}`);
  }
  assert.ok(opaqueAt('case', 0, 0, CASE[0], CASE[1]), 'coins land inside the open case');
  for (const [sx, sy] of CROWD.spots) {
    for (const k of KINDS) {
      const name = `${k}-stand-0-${sx < CROWD.playerX ? 'right' : 'left'}`, [pl, pt, pr, pb] = cover(name, sx, sy);
      assert.ok(pl >= 0 && pt >= 0 && pr <= 320 && pb <= 180, `a ${k} at spot ${sx},${sy} fits on screen`);
      for (let y = pt; y < pb; y++) {
        for (let x = pl; x < pr; x++) {
          assert.ok(!(opaqueAt(name, sx, sy, x, y) && opaqueAt('case', 0, 0, x, y)), `a ${k} at spot ${sx},${sy} stands clear of the case`);
        }
      }
    }
  }
  assert.ok(data.feet.you > PATH_Y, 'passers-by walk behind you');
});

test('your pedals stand in front of the crate, clear of the case and of every listener', () => {
  const pedals = PEDALS.map((id) => `pedal-${id}-1`);
  const [, , , bottom] = cover('you-acoustic-idle-0', 0, 0);
  for (const name of pedals) {
    const [l, t, r, b] = cover(name, 0, 0);
    assert.ok(t >= data.feet.you && b <= 170, `${name} is on the ground in front of you, above the strip`);
    for (let y = t; y < b; y++) {
      for (let x = l; x < r; x++) {
        if (!opaqueAt(name, 0, 0, x, y)) continue;
        assert.ok(!opaqueAt('case', 0, 0, x, y), `${name} clear of the case`);
        for (const [sx, sy] of CROWD.spots) {
          for (const k of KINDS) assert.ok(!opaqueAt(`${k}-stand-0-${sx < CROWD.playerX ? 'right' : 'left'}`, sx, sy, x, y), `${name} clear of a ${k} at ${sx},${sy}`);
        }
      }
    }
  }
  assert.ok(bottom <= data.feet.pedals);
});

test("the shop's stock stands apart, above the card, and the door and its sign are inside the screen", () => {
  const boxes = STOCK.map((item) => [item.id, data.shop.items[item.id]]);
  for (const [id, [x, y, w, h]] of boxes) {
    assert.ok(x >= 0 && y - data.shop.lift - 8 >= 0 && x + w <= 320 && y + h <= CARD[1], `${id} above the card, with room for its pointer`);
  }
  for (const [a, [ax, ay, aw, ah]] of boxes) {
    for (const [b, [bx, by, bw, bh]] of boxes) {
      if (a < b) assert.ok(ax + aw <= bx || bx + bw <= ax || ay + ah <= by || by + bh <= ay, `${a} and ${b} don't overlap`);
    }
  }
  const [dx, dy, dw, dh] = data.shop.door;
  assert.ok(dx >= 0 && dy >= 0 && dx + dw <= 320 && dy + dh <= CARD[1]);
  for (const id of PEDALS) {
    const [lx, ly] = data.shop.leds[id], [x, y, w, h] = data.shop.items[id];
    assert.ok(lx >= x && lx + 2 <= x + w && ly >= y && ly < y + h, `${id}'s light is on the pedal`);
  }
});
```

In `open-case/test/render.test.js`, make two edits. The title test's list of frames:

```js
  for (const n of ['ground', 'lamp-off', 'you-idle-', 'case', 'sun']) assert.ok(drawn(g, n).length, n);
```
becomes
```js
  for (const n of ['ground', 'lamp-off', 'you-acoustic-idle-', 'case', 'sun']) assert.ok(drawn(g, n).length, n);
```

and the start of the strumming test:

```js
test('you strum on each note, then go back to breathing; the trees rustle on the bar line', () => {
  const scene = createScene(1);
  assert.match(youFrame(scene, 5, 5), /^you-idle-\d$/);
  sceneNote(scene, 60, 0, 5, 3);
  assert.equal(youFrame(scene, 5, 5), 'you-strum-0');
  assert.equal(youFrame(scene, 5.1, 5.1), 'you-strum-1');
  assert.equal(youFrame(scene, 5.17, 5.17), 'you-strum-2');
  assert.match(youFrame(scene, 5.3, 5.3), /^you-idle-\d$/);
```
becomes
```js
test('you play your instrument on each note, then go back to breathing; the trees rustle on the bar line', () => {
  const scene = createScene(1);
  assert.match(youFrame(scene, 5, 5, 'acoustic'), /^you-acoustic-idle-\d$/);
  sceneNote(scene, 60, 0, 5, 3);
  assert.equal(youFrame(scene, 5, 5, 'acoustic'), 'you-acoustic-play-0');
  assert.equal(youFrame(scene, 5.1, 5.1, 'synth'), 'you-synth-play-1');
  assert.equal(youFrame(scene, 5.17, 5.17, 'ukulele'), 'you-ukulele-play-2');
  assert.match(youFrame(scene, 5.3, 5.3, 'epiano'), /^you-epiano-idle-\d$/);
```

(the rest of that test, about the trees, stays as it is).

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL. The art tests find no `you-acoustic-idle-0`, `pedal-*`, `shop-room` and so on, and `sprites.json` has no `shop` data. The render tests ask for `you-acoustic-*` frames the sheet doesn't have yet.

- [ ] **Step 3: Share more colours and your body in draw.lua**

In `art/open-case/draw.lua`, the pixel-map table's last line gains the chalkboard's green, the reverb's violet and the shop's walls:

```lua
  l = C.leaf[3], e = C.leaf[2], o = C.go,
}
```
becomes
```lua
  l = C.leaf[3], e = C.leaf[2], E = C.leaf[1], o = C.go,
  v = C.sky[4], V = C.sky[3], -- the reverb pedal's violet
  n = C.path[2], N = C.path[1],
}
```

and `D.you` splits into your body, the guitar's hands, and you with the acoustic. Replace:

```lua
-- You on your crate. breath: 1 lowers your head a pixel (the idle's second frame). strum: the picking
-- hand's height, -2 (above the strings) to 2 (through them), 0 at rest.
function D.you(b, breath, strum, dx, dy)
  dx, dy = dx or D.YOU[1], dy or D.YOU[2]
  local function part(p, ddy) stamp(b, p[1] + dx, p[2] + dy + (ddy or 0), p[3]) end
  crate(b, dx, dy)
  part(FAR_LEG)
  part(NEAR_LEG)
  part(TORSO)
  part(HEAD, breath or 0)
  part(GUITAR)
```

with:

```lua
-- You on your crate, without anything to play: the crate, your legs, your body and your head.
-- breath: 1 lowers your head a pixel (the idle's second frame). gear.lua draws each instrument on it.
function D.youBody(b, breath, dx, dy)
  local function part(p, ddy) stamp(b, p[1] + dx, p[2] + dy + (ddy or 0), p[3]) end
  crate(b, dx, dy)
  part(FAR_LEG)
  part(NEAR_LEG)
  part(TORSO)
  part(HEAD, breath or 0)
end

-- The arms and hands that hold a guitar, for gear.lua's other guitars: the fretting arm and hand, the
-- neck's steps, and the strumming arm and hand.
D.GUITAR_HANDS = { fretArm = FRET_ARM, fretHand = FRET_HAND, neck = NECK, strumUpper = STRUM_UPPER, strumHand = STRUM_HAND }

-- You on your crate with the acoustic guitar. breath: as for D.youBody. strum: the picking hand's
-- height, -2 (above the strings) to 2 (through them), 0 at rest.
function D.you(b, breath, strum, dx, dy)
  dx, dy = dx or D.YOU[1], dy or D.YOU[2]
  local function part(p, ddy) stamp(b, p[1] + dx, p[2] + dy + (ddy or 0), p[3]) end
  D.youBody(b, breath, dx, dy)
  part(GUITAR)
```

(the rest of `D.you`, from `part(FRET_ARM)` on, stays as it is).

- [ ] **Step 4: Draw the gear and the shop**

Create `art/open-case/gear.lua`:

```lua
-- Your gear from the music shop, in the flat style, for the sprite sheet (sprites.lua) and the shop
-- (shop.lua): you playing each instrument, your pedals on the ground by the crate, the small amp
-- that comes with the electric guitar, the gear strip's icons along the bottom of the screen, and
-- each instrument and pedal as it stands in the shop.
--
-- You are drawn in the style sample's first layout and moved by D.YOU, like draw.lua's D.you. The
-- pedals, the amp and the strip's icons are drawn where they go on the game's screen.
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local D = dofile(here .. "draw.lua")
local L, C, rect, stamp = D.L, D.C, D.rect, D.stamp
local G = {}

G.PEDALS = { "overdrive", "chorus", "tremolo", "delay", "reverb" } -- in chain order, keys 2 to 6
G.INSTRUMENTS = { "acoustic", "ukulele", "electric", "epiano", "synth" }
-- Each pedal's colour and its shadow, as pixel-map letters.
G.PEDAL_COLORS = {
  overdrive = { "o", "l" }, chorus = { "u", "U" }, tremolo = { "y", "Y" }, delay = { "r", "R" }, reverb = { "v", "V" },
}
G.PEDAL_ROW = { 117, 160 } -- your first pedal's top-left on the ground, in front of the crate...
G.PEDAL_STEP = 6 -- ...and each next one this far to the right
G.AMP = { 109, 136 } -- the amp's top-left, left of the crate behind the looper

-- A pixel map with its letters swapped: { from = to }.
local function recolour(rows, swap)
  local out = {}
  for i, r in ipairs(rows) do out[i] = r:gsub(".", function(ch) return swap[ch] or ch end) end
  return out
end

-------------------------------------------------------------------------------------------------
-- You, with each instrument

local UKULELE = { 133, 114, {
  "..........yyyy.",
  "...yyyy..yyyyyy",
  ".yyyyyyyyyyyyyy",
  "yyyDyyyyykkyyyy",
  "yyyDyyyyykkyyyy",
  "yyyDyyyyyyyyyy.",
  "YyyyyyyyyyyyyY.",
  "YyyyyyyyyyyyYY.",
  ".YYyyyyyyyYY...",
  "..YYYYYYYYY....",
  "....YYYYY......",
} }
local UKULELE_NECK = { { 148, 151, 116 }, { 152, 155, 115 }, { 156, 159, 114 }, { 160, 163, 113 }, { 164, 166, 112 } }
local UKULELE_HEAD = { 166, 108, {
  "..k.k",
  ".DDDD",
  "DDDD.",
  "DDD..",
} }
local ELECTRIC = { 128, 110, {
  "..................rr...",
  ".................rrrr..",
  "..rrrrr.........rrrr...",
  ".rrrrrrrr.....rrrrrr...",
  "rrrrrrrrrrrrrrrrrrrrrr.",
  "rrrwwwwwwwwwwwwwrrrrrrr",
  "rrwwkkwwwkkwwwwwwrrrrr.",
  "rrwwwwwwwwwwwwwrrrrrrr.",
  "RrrwwwwwwwwwwrrrrrrrR..",
  "RrrrrkkkrrrrrrrrrRR....",
  ".RRrrrrrrrrrrrrrR......",
  "..RRRrrrrrrrrRR........",
  "....RRRRRRRRR..........",
} }
local ELECTRIC_HEAD = { 176, 105, {
  "....k.k.k",
  "..ggggggg",
  ".gggggg..",
  "ggggg....",
  "ggg......",
} }

-- A guitar other than the acoustic, held the same way: its body, the arm on its neck, the neck, its
-- headstock, the fretting hand, then the strumming arm and hand (strum: -2 to 2, as for D.you).
local function guitar(b, body, neck, head, strum, dx, dy)
  local H = D.GUITAR_HANDS
  local function part(p, ddy) stamp(b, p[1] + dx, p[2] + dy + (ddy or 0), p[3]) end
  part(body)
  part(H.fretArm)
  for _, n in ipairs(neck) do rect(b, n[1] + dx, n[3] + dy, n[2] + dx, n[3] + 1 + dy, C.ink) end
  part(head)
  part(H.fretHand)
  part(H.strumUpper)
  part(H.strumHand, strum or 0)
end

-- The keyboards, seen from the front with the keys along the top: the electric piano's lid, keys and
-- wooden cheeks, and the synth's blue panel with its knobs and little screen. Each stands on an X.
local EPIANO = {
  "..kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk..",
  ".khhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhk.",
  "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
  "GwkwkwwkwkwkwwkwkwwkwkwkwwkwkwwkwkwkwwkwkG",
  "GwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwG",
  "DkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkD",
  "DhhhhhhhhhhhhhhhhhhhyhhhhhhhhhhhhhhhhhhhhD",
  "DhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhD",
}
local SYNTH = {
  "UuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuU",
  "UuyuyuyuooooouuuuuuuuuuuuuuuuuyuyuuuuuU",
  "UuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuU",
  "UwkwkwwkwkwkwwkwkwwkwkwkwwkwkwwkwkwkwwU",
  "UwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwU",
  "UUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU",
}
G.KEY_ROW = 3 -- the keys' first row, on both
G.KEYBOARDS = { epiano = EPIANO, synth = SYNTH }

-- An X stand for a keyboard: two crossed legs under each end, from the keyboard's bottom (y0) to the
-- floor (y1), centred on x.
local function xStand(b, x, y0, y1)
  for _, cx in ipairs({ x - 12, x + 12 }) do
    for y = y0, y1 do
      local k = (y - y0) / (y1 - y0)
      L.set(b, math.floor(cx - 5 + 10 * k + 0.5), y, C.ink)
      L.set(b, math.floor(cx + 5 - 10 * k + 0.5), y, C.ink)
    end
  end
end

-- A keyboard on its stand, its top-left at (x, y), its feet on row `floor`.
function G.keyboard(b, id, x, y, floor)
  local rows = G.KEYBOARDS[id]
  xStand(b, x + math.floor(#rows[1] / 2), y + #rows, floor)
  D.shadow(b, x + #rows[1] / 2, floor + 0.5, #rows[1] / 2 + 1, 1.5)
  stamp(b, x, y, rows)
end

-- Your arms reaching down to the keys, your hands on them. press: which hand is pressing (0 the left,
-- 1 both, 2 the right; nil neither). The hands sit on the keys' rows, a pixel lower pressing.
local ARM = { "hk", "hk", "hk", "hk", "hk", "hkk", ".hkk", ".hkk", "..hk", "..hk", "..hk", "..hk" }
local HAND = { "ssss", "SssS" }
local function keysPlayed(b, id, press, dx, dy)
  local x, y = 121 + dx, 117 + dy
  G.keyboard(b, id, x, y, 141 + dy)
  stamp(b, 129 + dx, 108 + dy, ARM)
  stamp(b, 145 + dx, 108 + dy, ARM)
  local left = (press == 0 or press == 1) and 1 or 0
  local right = (press == 1 or press == 2) and 1 or 0
  stamp(b, 131 + dx, y + G.KEY_ROW - 1 + left, HAND)
  stamp(b, 147 + dx, y + G.KEY_ROW - 1 + right, HAND)
end

-- You on your crate playing `id`. breath: 1 lowers your head a pixel. play: for a guitar, the picking
-- hand's height (-2 to 2, 0 at rest); for a keyboard, the hand pressing (0 to 2, nil at rest).
function G.you(b, id, breath, play)
  local dx, dy = D.YOU[1], D.YOU[2]
  if id == "acoustic" then return D.you(b, breath, play or 0) end
  D.youBody(b, breath, dx, dy)
  if id == "ukulele" then guitar(b, UKULELE, UKULELE_NECK, UKULELE_HEAD, play, dx, dy)
  elseif id == "electric" then guitar(b, ELECTRIC, D.GUITAR_HANDS.neck, ELECTRIC_HEAD, play, dx, dy)
  else keysPlayed(b, id, play, dx, dy) end
end

-------------------------------------------------------------------------------------------------
-- By the crate, and along the bottom of the screen

-- One of your pedals on the ground, in its place in the row. on: its light is lit.
function G.pedal(b, id, on)
  local i = 0
  for k, p in ipairs(G.PEDALS) do if p == id then i = k - 1 end end
  local x, y = G.PEDAL_ROW[1] + i * G.PEDAL_STEP, G.PEDAL_ROW[2]
  local c = G.PEDAL_COLORS[id]
  D.shadow(b, x + 2.5, y + 5.5, 3.5, 1)
  stamp(b, x, y, recolour({
    "bbbbb",
    "bLbbb",
    "bbbbb",
    "bbcbb",
    "SSSSS",
  }, { b = c[1], S = c[2], L = on and "w" or "k" }))
end

-- The small amp beside the crate, which comes with the electric guitar.
function G.amp(b)
  local x, y = G.AMP[1], G.AMP[2]
  D.shadow(b, x + 7, y + 13.5, 8, 1.5)
  stamp(b, x, y, {
    "....kkkkkk....",
    "...k......k...",
    "kkkkkkkkkkkkkk",
    "kYYYYYYYYYYYYk",
    "kYwYwYwYYYYoYk",
    "kkkkkkkkkkkkkk",
    "khhhhhhhhhhhhk",
    "khhhhhhhhhhhhk",
    "khhhhhhhhhhhhk",
    "khhhhhhhhhhhhk",
    "khhhhhhhhhhhhk",
    "khhhhhhhhhhhhk",
    "kkkkkkkkkkkkkk",
  })
end

-- A pedal's icon on the gear strip, from its top-left: lit in its colour while it's on, in its shadow
-- colour while it's off.
function G.stripIcon(b, id, on)
  local c = G.PEDAL_COLORS[id]
  stamp(b, 0, 0, recolour({
    ".bbbbb.",
    "bbbbbbb",
    "bbLbbbb",
    "bbbbbbb",
    "bbbbbbb",
    "bbcccbb",
    "bbcccbb",
    "SSSSSSS",
  }, { b = on and c[1] or c[2], S = on and c[2] or "N", L = on and "w" or "k" }))
end

return G
```

Create `art/open-case/shop.lua`:

```lua
-- The music shop in the flat style, for the sprite sheet (sprites.lua): the room (the door with its
-- "back to the park" sign, the window onto the park at dusk, the pedal rack, the chalkboard, the
-- floor), the counter in front of the shopkeeper, the shopkeeper, and the stock on display, each item
-- as it stands and as it looks chosen (lifted two pixels and lit up). Everything is drawn where it
-- goes on the game's 320x180 screen; the card along the bottom (y 138 down) and the words on the
-- sign and the chalkboard are drawn by render.js.
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local D = dofile(here .. "draw.lua")
local G = dofile(here .. "gear.lua")
local L, C, rect, stamp = D.L, D.C, D.rect, D.stamp
local W, H = D.W, D.H
local S = {}

S.FLOOR = 100 -- the wall meets the floor
S.STANDS = 124 -- the row the stands' feet stand on
S.SIGN = { 4, 8, 52, 30 } -- the sign over the door: x0, y0, x1, y1 (its words: render.js)
S.DOOR = { 8, 34, 40, S.FLOOR - 1 }
S.WINDOW = { 60, 16, 104, 60 }
S.RACK = { 112, 20, 228, 66 } -- the pedal rack; its shelf's top is row 62
S.BOARD = { 236, 10, 302, 44 } -- the chalkboard (the savings: render.js)
S.COUNTER = { 232, 74, W - 1, 112 }
S.KEEPER = { 266, 74 } -- the shopkeeper's middle, and the counter's top where she stands behind it
S.LIFT = 2 -- pixels a chosen item rises

-- Where each item stands: a pedal's top-left on the rack's shelf, or a guitar's or keyboard's place
-- on the floor ({ x of the middle for a guitar, x of the left for a keyboard }).
local RACK_X = { overdrive = 118, chorus = 140, tremolo = 162, delay = 184, reverb = 206 }
local RACK_TOP = 45 -- a pedal's top row: it's 17 tall, so it stands on the shelf (row 62)
local FLOOR_AT = { acoustic = 55, ukulele = 78, electric = 101, epiano = 117, synth = 168 }

-------------------------------------------------------------------------------------------------
-- The room

local PLANKS = { S.FLOOR, 104, 109, 115, 122, 130, 139, 149, 160, 172, H } -- the floorboards' rows, widening toward you

-- The walls, the wainscot, the floorboards, the door and its sign, the window, the rack and the
-- chalkboard (everything behind the shopkeeper and the stock).
function S.room(b)
  rect(b, 0, 0, W - 1, S.FLOOR - 1, C.path[2])
  rect(b, 0, 0, W - 1, 3, C.path[1]) -- the ceiling's shadow
  rect(b, 0, 78, W - 1, 79, C.wood[2]) -- the rail
  rect(b, 0, 80, W - 1, S.FLOOR - 1, C.wood[1]) -- the wainscot
  for r = 1, #PLANKS - 1 do
    local y0, y1 = PLANKS[r], PLANKS[r + 1] - 1
    local len = 30 + r * 8
    rect(b, 0, y0, W - 1, y1, C.wood[2])
    rect(b, 0, y1, W - 1, y1, C.wood[1])
    for x = (r * 17) % len, W - 1, len do rect(b, x, y0, x, y1, C.wood[1]) end
  end
  -- The door: a frame, a panelled door with a small window of dusk sky, and its handle.
  local d = S.DOOR
  rect(b, d[1], d[2], d[3], d[4], C.wood[1])
  rect(b, d[1] + 2, d[2] + 2, d[3] - 2, d[4], C.wood[2])
  rect(b, d[1] + 6, d[2] + 5, d[3] - 6, d[2] + 17, C.sky[5])
  rect(b, d[1] + 6, d[2] + 5, d[3] - 6, d[2] + 9, C.sky[4])
  rect(b, d[1] + 6, d[2] + 24, d[3] - 6, d[4] - 6, C.wood[1])
  rect(b, d[1] + 8, d[2] + 26, d[3] - 8, d[4] - 8, C.wood[2])
  rect(b, d[3] - 6, d[2] + 36, d[3] - 5, d[2] + 37, C.yellow[2])
  -- The sign over the door, on two strings.
  local s = S.SIGN
  rect(b, s[1] + 8, 0, s[1] + 8, s[2] - 1, C.ink)
  rect(b, s[3] - 8, 0, s[3] - 8, s[2] - 1, C.ink)
  rect(b, s[1], s[2], s[3], s[4], C.wood[3])
  rect(b, s[1], s[4], s[3], s[4], C.wood[2])
  -- The window onto the park at dusk: bands of sky, the sun going down, the rooftops and a tree.
  local w = S.WINDOW
  local sky = C.sky
  local bands = { sky[3], sky[4], sky[5], sky[6], sky[7] }
  for y = w[2], w[4] do
    local k = math.min(#bands, 1 + (y - w[2]) * #bands // (w[4] - w[2] + 1))
    rect(b, w[1], y, w[3], y, bands[k])
  end
  D.oval(b, w[1] + 30, w[4] - 6, 7, 7, C.light)
  for _, r in ipairs({ { 0, 8, 46 }, { 9, 20, 40 }, { 21, 33, 48 }, { 34, 44, 43 } }) do
    rect(b, w[1] + r[1], r[3], w[1] + r[2], w[4], sky[3])
  end
  D.oval(b, w[1] + 4, w[2] + 22, 8, 9, C.leaf[1])
  rect(b, w[1] + 3, w[2] + 30, w[1] + 5, w[4], C.leaf[1])
  rect(b, w[1] - 2, w[2] - 2, w[3] + 2, w[2] - 1, C.wood[1]) -- the frame and its cross
  rect(b, w[1] - 2, w[4] + 1, w[3] + 2, w[4] + 3, C.wood[1])
  rect(b, w[1] - 2, w[2], w[1] - 1, w[4], C.wood[1])
  rect(b, w[3] + 1, w[2], w[3] + 2, w[4], C.wood[1])
  rect(b, (w[1] + w[3]) // 2, w[2], (w[1] + w[3]) // 2 + 1, w[4], C.wood[1])
  rect(b, w[1], (w[2] + w[4]) // 2, w[3], (w[2] + w[4]) // 2 + 1, C.wood[1])
  rect(b, w[1] - 3, w[4] + 4, w[3] + 3, w[4] + 5, C.wood[2]) -- the sill
  -- The pedal rack: a dark board in a frame, with a shelf along its foot.
  local r = S.RACK
  rect(b, r[1], r[2], r[3], r[4], C.wood[2])
  rect(b, r[1] + 2, r[2] + 2, r[3] - 2, r[4] - 2, C.wood[1])
  rect(b, r[1] - 2, 62, r[3] + 2, 64, C.wood[3])
  rect(b, r[1] - 2, 65, r[3] + 2, 65, C.wood[2])
  -- The chalkboard, in its frame, for the savings.
  local c = S.BOARD
  rect(b, c[1], c[2], c[3], c[4], C.wood[2])
  rect(b, c[1] + 2, c[2] + 2, c[3] - 2, c[4] - 2, C.leaf[1])
  rect(b, c[1] + 5, c[4] - 4, c[1] + 12, c[4] - 4, C.light) -- a stub of chalk on the ledge
end

-- The counter, in front of the shopkeeper, with the till on it.
function S.counter(b)
  local c = S.COUNTER
  rect(b, c[1], c[2], c[3], c[4], C.wood[2])
  rect(b, c[1], c[2], c[3], c[2] + 2, C.wood[3])
  rect(b, c[1], c[2] + 3, c[3], c[2] + 3, C.wood[1])
  for x = c[1] + 10, c[3], 22 do rect(b, x, c[2] + 8, x + 14, c[4] - 6, C.wood[1]) end
  rect(b, c[1], c[4] + 1, c[3], c[4] + 2, C.path[1]) -- its shadow on the floor
  local tx, ty = 292, c[2] - 12 -- the till
  rect(b, tx, ty, tx + 18, c[2] - 1, C.charcoal)
  rect(b, tx + 2, ty + 2, tx + 16, ty + 5, C.go)
  for kx = tx + 2, tx + 14, 4 do rect(b, kx, ty + 8, kx + 2, ty + 9, C.coat[2]) end
end

-------------------------------------------------------------------------------------------------
-- The shopkeeper, behind the counter: grey hair in a bun, round glasses, a mustard cardigan over a
-- white shirt. frame: 0 or 1 breathing, 2 or 3 nodding (a sale).

local KEEPER_HEAD = {
  ".....ccc....",
  "....ccccc...",
  "..cccccccc..",
  ".cccccccccc.",
  ".cctttttttc.",
  ".ctkkttkktc.",
  ".ctkwttkwt..",
  "..ttttttttt.",
  "..tttTTtttt.",
  "...tttttttT.",
  "...tTkkkTtT.",
  "....TTTTTT..",
}
local KEEPER_SMILE = { -- her face nodding: eyes shut, a wider smile
  ".....ccc....",
  "....ccccc...",
  "..cccccccc..",
  ".cccccccccc.",
  ".cctttttttc.",
  ".ctkkttkktc.",
  ".ctttttttt..",
  "..ttkktkktt.",
  "..tttTTtttt.",
  "...tkttttkT.",
  "...ttkkkktT.",
  "....TTTTTT..",
}
local KEEPER_BODY = {
  "......TT........",
  "...YYYwwwwYYY...",
  "..YYYYYwwYYYYY..",
  ".YYYYYYwwYYYYYY.",
  "YYYYYYYwwYYYYYYY",
  "YYYYYYYwwYYYYYYY",
  "YYYYYYYwwYYYYYYY",
  "YYYYYYYwwYYYYYYY",
  "YYYYYYYwwYYYYYYY",
  "tYYYYYYwwYYYYYYt",
  "tYYYYYYwwYYYYYYt",
  "TYYYYYYwwYYYYYYT",
  "TYYYYYYwwYYYYYYT",
  "YYYYYYYwwYYYYYYY",
}

function S.keeper(b, frame)
  local x, top = S.KEEPER[1] - 8, S.KEEPER[2] - #KEEPER_BODY - 11
  local bob = (frame == 1 or frame == 3) and 1 or 0
  local nod = frame >= 2 and (frame == 2 and 1 or 2) or 0
  stamp(b, x, top + 11, KEEPER_BODY)
  stamp(b, x + 2, top + bob + nod, frame >= 2 and KEEPER_SMILE or KEEPER_HEAD)
end

-------------------------------------------------------------------------------------------------
-- The stock on display

-- A pedal on the rack, 14 by 17, in its colour: a row of knobs, its light (off: render.js lights it
-- while you hear it), a line across, and the footswitch.
local KNOBS = {
  overdrive = { "bkkbkkbkkbbbbS", "bkwbkwbkwbbbbS" },
  chorus = { "bkkbbkkbbbbbbS", "bkwbbkwbbbbbbS" },
  tremolo = { "bbkkbbbkkbbbbS", "bbkwbbbkwbbbbS" },
  delay = { "bkkbkkbkkbbbbS", "bkwbkwbkwbbbbS" },
  reverb = { "bbkkkbbbbbbbbS", "bbkkwbbbbbbbbS" },
}
local PEDAL_BODY = {
  "bbbbbbbbbbbbbS",
  "SSSSSSSSSSSSSS",
  "bbbbbbbbbbbbbS",
  "bbbbbbbbbbbbbS",
  "bbbbbbbbbbbbbS",
  "bbbbbbbbbbbbbS",
  "bbbbbbbbbbbbbS",
  "bbbbbbbbbbbbbS",
  "bbbbccccbbbbbS",
  "bbbbccccbbbbbS",
  "bbbbbbbbbbbbbS",
}
S.LED = { 11, 1 } -- the light's place on a rack pedal, from its top-left (2 by 1)

local function rackPedal(b, id, lift)
  local c = G.PEDAL_COLORS[id]
  local rows = { ".bbbbbbbbbbbb.", "bbbbbbbbbbbkkS", "bbbbbbbbbbbbbS" }
  for _, r in ipairs(KNOBS[id]) do rows[#rows + 1] = r end
  for _, r in ipairs(PEDAL_BODY) do rows[#rows + 1] = r end
  rows[#rows + 1] = ".SSSSSSSSSSSS."
  local out = {}
  for i, r in ipairs(rows) do out[i] = r:gsub("b", c[1]):gsub("S", c[2]) end
  stamp(b, RACK_X[id], RACK_TOP - lift, out)
end

-- A guitar standing up on its stand: the stand's legs, the body, the neck and the headstock.
local UPRIGHT = {
  acoustic = {
    body = {
      "......gggggg......",
      "....gggggggggg....",
      "...gggggggggggG...",
      "...ggggkkkkgggG...",
      "...gggkkkkkkggG...",
      "...gggkkkkkkggG...",
      "...ggggkkkkgggG...",
      "....ggggggggggG...",
      "....gggggggggG....",
      "...gggggggggggG...",
      "..gggggggggggggG..",
      ".ggggggggggggggGG.",
      ".ggggggggggggggGG.",
      "gggggggDDDDggggGGG",
      "gggggggggggggggGGG",
      "gggggggggggggggGGG",
      ".gggggggggggggGGG.",
      ".ggggggggggggGGGG.",
      "..gggggggggGGGGG..",
      "....GGGGGGGGGG....",
      "......GGGGGG......",
    },
    neck = 22, head = { ".DDD.", "kDDDk", "DDDDD", "kDDDk", "DDDDD", ".DDD." },
  },
  ukulele = {
    body = {
      "...yyyyy...",
      "..yyyyyyY..",
      "..yyykyyY..",
      "..yykkkyY..",
      "..yyykyyY..",
      "...yyyyY...",
      "..yyyyyyY..",
      ".yyyyyyyYY.",
      "yyyyDDDyyYY",
      "yyyyyyyyyYY",
      ".yyyyyyyYY.",
      "..YYYYYYY..",
    },
    neck = 12, head = { ".DD.", "kDDk", "DDDD", "kDDk", ".DD." },
  },
  electric = {
    body = {
      "..rr......rr..",
      ".rrrr....rrrr.",
      ".rrrr....rrrR.",
      ".rrrrrrrrrrrR.",
      "..rrwwwwwwrrR.",
      "..rrwkkkkwrR..",
      "..rrwwwwwwrR..",
      ".rrrwkkkkwrrR.",
      "rrrrwwwwwwrrRR",
      "rrrrwwwwwwrrRR",
      "rrrrrkkkkrrrRR",
      "rrrrrrrrrrrrRR",
      ".rrrrrrrrrrRR.",
      "..RRRRRRRRRR..",
    },
    neck = 24, head = { "gg..", "ggg.", "kggk", ".ggg", "kggk", ".ggg", "..gg" },
  },
}

local function uprightGuitar(b, id, lift)
  local g = UPRIGHT[id]
  local x = FLOOR_AT[id]
  local bw, bh = #g.body[1], #g.body
  local bodyTop = S.STANDS - 2 - bh
  -- the stand: a cradle under the body and two splayed feet
  rect(b, x - bw // 2 + 1, S.STANDS - 3, x + bw // 2 - 1, S.STANDS - 3, C.ink)
  for i = 0, 2 do
    L.set(b, x - bw // 2 - i, S.STANDS - 2 + i, C.ink)
    L.set(b, x + bw // 2 - 1 + i, S.STANDS - 2 + i, C.ink)
  end
  local top = bodyTop - lift
  stamp(b, x - bw // 2, top, g.body)
  rect(b, x - 1, top - g.neck, x, top - 1, C.ink)
  stamp(b, x - #g.head[1] // 2, top - g.neck - #g.head, g.head)
end

local function displayed(b, id, lift)
  if RACK_X[id] then return rackPedal(b, id, lift) end
  if UPRIGHT[id] then
    D.shadow(b, FLOOR_AT[id], S.STANDS + 0.5, 8, 1.5)
    return uprightGuitar(b, id, lift)
  end
  local rows = G.KEYBOARDS[id]
  local x = FLOOR_AT[id]
  D.shadow(b, x + #rows[1] / 2, S.STANDS + 0.5, #rows[1] / 2 + 1, 1.5)
  local k = L.buffer(W, H)
  G.keyboard(k, id, x, 101, S.STANDS)
  -- a chosen keyboard rises off its stand; its stand stays on the floor
  for y = 0, H - 1 do
    for xx = 0, W - 1 do
      local c = k[y][xx]
      if c and c ~= C.path[1] then
        local up = (y < 101 + #rows) and lift or 0
        if y - up >= 0 then L.set(b, xx, y - up, c) end
      end
    end
  end
end

-- Chosen: every colour a step lighter, for the lifted item.
local LIGHTER = {
  [C.wood[1]] = C.wood[2], [C.wood[2]] = C.wood[3], [C.red[1]] = C.red[2], [C.yellow[1]] = C.yellow[2],
  [C.blue[1]] = C.blue[2], [C.sky[3]] = C.sky[4], [C.leaf[3]] = C.go, [C.ink] = C.charcoal,
  [C.charcoal] = C.coat[1], [C.coat[2]] = C.light,
}

-- An item of stock as it stands in the shop (chosen: lifted and lit up), with its hit box for clicks
-- and, for a pedal, where its light is.
function S.item(b, id, chosen)
  if chosen then
    local k = L.buffer(W, H)
    displayed(k, id, S.LIFT)
    for y = 0, H - 1 do
      for x = 0, W - 1 do
        local c = k[y][x]
        if c then L.set(b, x, y, c == C.path[1] and c or (LIGHTER[c] or c)) end
      end
    end
  else
    displayed(b, id, 0)
  end
end

-- Each item's box on the screen (as it stands), for clicks and the price tags: [x, y, w, h].
function S.box(id)
  local k = L.buffer(W, H)
  displayed(k, id, 0)
  local x0, y0, x1, y1 = W, H, -1, -1
  for y = 0, H - 1 do
    for x = 0, W - 1 do
      if k[y][x] and k[y][x] ~= C.path[1] then
        x0, y0 = math.min(x0, x), math.min(y0, y)
        x1, y1 = math.max(x1, x), math.max(y1, y)
      end
    end
  end
  return { x0, y0, x1 - x0 + 1, y1 - y0 + 1 }
end

-- A rack pedal's light, on the screen, as it stands.
function S.led(id) return { RACK_X[id] + S.LED[1], RACK_TOP + S.LED[2] } end

-- The tags on the stock: a price tag, and a green one on what's yours.
function S.tag(b, yours)
  stamp(b, 0, 0, yours and { ".oooo", "koooo", ".oooo" } or { ".yyyy", "kyyyy", ".yyyy" })
end

return S
```

Replace `art/open-case/sprites.lua` with:

```lua
-- Open Case's sprite sheet: every picture the game draws, in the flat style, packed into one image,
-- with the frame data and the scene's layout data the game reads alongside it. Run from the repo root:
--   aseprite -b --script art/open-case/sprites.lua
-- Writes open-case/assets/sprites.png and open-case/assets/sprites.json. It's deterministic: an
-- unchanged script rebuilds both byte for byte.
--
-- sprites.json:
--   frames     { name: [x, y, w, h, ax, ay] }: the frame's place in sprites.png, and its anchor: drawn
--              at (x, y), the frame's top-left goes to (x - ax, y - ay). The park's layers are anchored
--              at the screen's top-left, so each is drawn at (0, 0); people and pigeons by their feet;
--              the sun, clouds, coins and birds by their centres; reactions by their tail's tip.
--   sky        the five stages of the sky, dusk to night: each its seven bands' colours, top down
--   bands      the first row of each band; skyBottom, the sky's last row
--   sun        [x, y, radius]: where the sun is at the start of a set
--   clouds     [[x, y, layer], ...]: each cloud's home (its frames are cloud-<i>-<stage>, i from 0)
--   windows    [[x, y], ...]: the rooftops' 2x2 windows, which light one by one
--   stars      [[x, y], ...]: where the stars come out
--   trainY     the distant train's bottom row
--   caseCoins  [[x, y], ...]: where the coins in the case lie, in the order they land
--   feet       { you, looper, case, amp, pedals }: the row where each meets the ground, to sort them
--              among the people
--   shop       the music shop's layout: items { id: [x, y, w, h] } (each item's box as it stands, for
--              clicks and its tag), leds { id: [x, y] } (each rack pedal's 2x1 light), door [x, y, w, h]
--              (the door and its sign, a click leaves), sign and board [x, y] (the middle of the top of
--              the words on the sign and on the chalkboard), lift (pixels a chosen item rises)
--   colors     the named colours the game draws with in code
--   palette    every colour in the sheet (at most 64)
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local D = dofile(here .. "draw.lua")
local F = dofile(here .. "figures.lua")
local G = dofile(here .. "gear.lua")
local S = dofile(here .. "shop.lua")
local L, C = D.L, D.C
local W, H = D.W, D.H
local STAGES = D.stages()

local frames = {} -- { name, buf, ax, ay }, before trimming

-- Adds a frame drawn by `draw(b)` into a w x h buffer whose point (px, py) is the anchor.
local function add(name, w, h, px, py, draw)
  local b = L.buffer(w, h)
  draw(b)
  frames[#frames + 1] = { name = name, b = b, px = px, py = py }
end
-- A frame drawn on the whole screen, anchored at its top-left.
local function screen(name, draw) add(name, W, H, 0, 0, draw) end

-- The park
add("sun", 40, 40, 20, 20, function(b) D.sun(b, 20, 20) end)
for i, cl in ipairs(D.CLOUDS) do
  for s, st in ipairs(STAGES) do
    screen(("cloud-%d-%d"):format(i - 1, s - 1), function(b) D.cloud(b, cl[1], cl[2], cl[3], st) end)
    frames[#frames].px, frames[#frames].py = cl[1], cl[2]
  end
end
for s, st in ipairs(STAGES) do
  screen("roofs-back-" .. (s - 1), function(b) D.roofsBack(b, st) end)
  screen("roofs-front-" .. (s - 1), function(b) D.roofsFront(b, st) end)
  add("train-" .. (s - 1), 70, 10, 0, 9, function(b) D.train(b, 0, 9, st, s > 1) end)
end
for f = 0, 2 do screen("trees-" .. f, function(b) D.trees(b, f) end) end
screen("ground", D.ground)
screen("pool", function(b) D.path(b, true) end)
for _, state in ipairs({ "off", "on", "flicker" }) do screen("lamp-" .. state, function(b) D.lamp(b, state) end) end

-- You and your things: you playing each instrument (a guitar's picking hand -2, 0 and 2; a keyboard's
-- left hand, both, then the right), your pedals on the ground, the amp and the gear strip's icons
for _, id in ipairs(G.INSTRUMENTS) do
  local keys = G.KEYBOARDS[id]
  for f = 0, 1 do screen(("you-%s-idle-%d"):format(id, f), function(b) G.you(b, id, f, nil) end) end
  for f, play in ipairs(keys and { 0, 1, 2 } or { -2, 0, 2 }) do
    screen(("you-%s-play-%d"):format(id, f - 1), function(b) G.you(b, id, 0, play) end)
  end
end
for _, id in ipairs(G.PEDALS) do
  for f = 0, 1 do
    screen(("pedal-%s-%d"):format(id, f), function(b) G.pedal(b, id, f == 1) end)
    add(("strip-%s-%d"):format(id, f), 7, 8, 0, 0, function(b) G.stripIcon(b, id, f == 1) end)
  end
end
screen("amp", G.amp)
screen("looper-0", function(b) D.looper(b, false) end)
screen("looper-1", function(b) D.looper(b, true) end)
screen("case", D.openCase)
add("case-coin", 3, 2, 0, 0, function(b) D.caseCoin(b, 0, 0) end)
for f = 0, 1 do add("coin-" .. f, 5, 5, 2, 2, function(b) D.coin(b, 2, 2, f) end) end

-- The passers-by, facing left as drawn, and mirrored to face right
local function person(name, draw)
  add(name .. "-left", 24, 50, 12, 47, draw)
  local b = L.buffer(24, 50)
  draw(b)
  frames[#frames + 1] = { name = name .. "-right", b = D.mirror(b), px = 11, py = 47 }
end
for _, kind in ipairs(F.KINDS) do
  for step = 0, 3 do person(("%s-walk-%d"):format(kind, step), function(b) F.person(b, kind, 12, 47, step, 0) end) end
  for f = 0, 1 do person(("%s-stand-%d"):format(kind, f), function(b) F.person(b, kind, 12, 47, nil, f) end) end
  for f = 0, 1 do person(("%s-nod-%d"):format(kind, f), function(b) F.person(b, kind, 12, 47, nil, f * 2) end) end
end
for _, rule in ipairs(F.REACTIONS) do
  for f = 0, 1 do add(("react-%s-%d"):format(rule, f), 14, 12, 6, 10, function(b) F.reaction(b, rule, f, 6, 10) end) end
end
for _, pose in ipairs({ "peck", "walk", "fly" }) do
  for f = 0, 1 do
    local name = ("pigeon-%s-%d"):format(pose, f)
    add(name .. "-left", 9, 6, 4, 5, function(b) F.pigeon(b, pose, f, 4, 5) end)
    local b = L.buffer(9, 6)
    F.pigeon(b, pose, f, 4, 5)
    frames[#frames + 1] = { name = name .. "-right", b = D.mirror(b), px = 4, py = 5 }
  end
end
for f = 0, 1 do add("bird-" .. f, 7, 3, 3, 1, function(b) F.bird(b, f, 3, 1) end) end

-- The music shop: the room, the counter (drawn over the shopkeeper), the shopkeeper breathing (0, 1)
-- and nodding at a sale (2, 3), the stock as it stands and chosen, and the tags
local STOCK = { "overdrive", "chorus", "tremolo", "delay", "reverb", "acoustic", "ukulele", "electric", "epiano", "synth" }
screen("shop-room", S.room)
screen("shop-counter", S.counter)
for f = 0, 3 do screen("keeper-" .. f, function(b) S.keeper(b, f) end) end
for _, id in ipairs(STOCK) do
  for f = 0, 1 do screen(("item-%s-%d"):format(id, f), function(b) S.item(b, id, f == 1) end) end
end
add("tag-price", 5, 3, 0, 0, function(b) S.tag(b, false) end)
add("tag-yours", 5, 3, 0, 0, function(b) S.tag(b, true) end)

-------------------------------------------------------------------------------------------------
-- Every colour drawn is in the flat palette, which stays within 64 colours.

local allowed, palette = {}, {}
do
  local function walk(t)
    local keys = {}
    for k in pairs(t) do keys[#keys + 1] = k end
    table.sort(keys, function(a, b) return tostring(a) < tostring(b) end)
    for _, k in ipairs(keys) do
      local v = t[k]
      if type(v) == "table" then walk(v)
      elseif not allowed[v] then allowed[v] = true; palette[#palette + 1] = v end
    end
  end
  walk(C)
  assert(#palette <= 64, "the palette has " .. #palette .. " colours; keep it to 64")
end

-- Trims each frame to what's drawn and packs them in rows, tallest first, 512 pixels across.
local SHEET_W = 512
local packed = {}
for _, f in ipairs(frames) do
  local x0, y0, x1, y1 = f.b.w, f.b.h, -1, -1
  for y = 0, f.b.h - 1 do
    for x = 0, f.b.w - 1 do
      local c = f.b[y][x]
      if c then
        assert(allowed[c], f.name .. " draws " .. c .. ", outside the flat palette")
        if x < x0 then x0 = x end
        if y < y0 then y0 = y end
        if x > x1 then x1 = x end
        if y > y1 then y1 = y end
      end
    end
  end
  assert(x1 >= 0, f.name .. " is empty")
  packed[#packed + 1] = { name = f.name, b = L.crop(f.b, x0, y0, x1 - x0 + 1, y1 - y0 + 1), ax = f.px - x0, ay = f.py - y0 }
end
table.sort(packed, function(a, b)
  if a.b.h ~= b.b.h then return a.b.h > b.b.h end
  return a.name < b.name
end)
local x, y, rowH = 0, 0, 0
for _, p in ipairs(packed) do
  if x + p.b.w > SHEET_W then x, y, rowH = 0, y + rowH + 1, 0 end
  p.x, p.y = x, y
  x = x + p.b.w + 1
  if p.b.h > rowH then rowH = p.b.h end
end
local sheet = L.buffer(SHEET_W, y + rowH)
for _, p in ipairs(packed) do L.blit(sheet, p.b, p.x, p.y) end
L.save(sheet, nil, "open-case/assets/sprites.png")

-------------------------------------------------------------------------------------------------
-- The frame data, written by hand so its order never changes.

local function list(t, fmt)
  local out = {}
  for i, v in ipairs(t) do out[i] = fmt(v) end
  return "[" .. table.concat(out, ", ") .. "]"
end
local q = function(s) return '"' .. s .. '"' end
local pair = function(p) return ("[%d, %d]"):format(p[1], p[2]) end

table.sort(packed, function(a, b) return a.name < b.name end)
local lines = {}
for i, p in ipairs(packed) do
  lines[i] = ('    "%s": [%d, %d, %d, %d, %d, %d]'):format(p.name, p.x, p.y, p.b.w, p.b.h, p.ax, p.ay)
end

local stars = {}
for i = 0, 9 do
  stars[#stars + 1] = { 8 + math.floor(L.rnd(i, 1, 71) * 300), 3 + math.floor(L.rnd(i, 2, 71) * 50) }
end
local clouds = {}
for i, cl in ipairs(D.CLOUDS) do clouds[i] = { cl[1], cl[2], cl[4] } end

local colorNames = {
  { "ink", C.ink }, { "charcoal", C.charcoal }, { "light", C.light }, { "gold", C.yellow[2] },
  { "goldDark", C.yellow[1] }, { "grey", C.coat[2] }, { "greyDark", C.coat[1] }, { "red", C.red[2] },
  { "go", C.go }, { "night", C.night[3] },
}
local colors = {}
for i, c in ipairs(colorNames) do colors[i] = ('    "%s": "%s"'):format(c[1], c[2]) end

local json = table.concat({
  "{",
  '  "frames": {',
  table.concat(lines, ",\n"),
  "  },",
  '  "sky": ' .. list(STAGES, function(st) return list(st, q) end) .. ",",
  '  "bands": ' .. list(D.BANDS, tostring) .. ",",
  '  "skyBottom": ' .. D.SKY_BOTTOM .. ",",
  ('  "sun": [%d, %d, %d],'):format(D.SUN[1], D.SUN[2], D.SUN[3]),
  '  "clouds": ' .. list(clouds, function(c) return ("[%d, %d, %d]"):format(c[1], c[2], c[3]) end) .. ",",
  '  "windows": ' .. list(D.windows(), pair) .. ",",
  '  "stars": ' .. list(stars, pair) .. ",",
  ('  "trainY": %d,'):format(D.TRAIN_Y),
  '  "caseCoins": ' .. list(D.caseCoinSpots(60), pair) .. ",",
  ('  "feet": { "you": %d, "looper": %d, "case": %d, "amp": %d, "pedals": %d },'):format(
    141 + D.YOU[2], D.LOOPER[2] + 6, D.CASE[2] + 9, G.AMP[2] + 13, G.PEDAL_ROW[2] + 5),
  '  "shop": {',
  '    "items": { ' .. table.concat((function()
    local out = {}
    for i, id in ipairs(STOCK) do
      local box = S.box(id)
      out[i] = ('"%s": [%d, %d, %d, %d]'):format(id, box[1], box[2], box[3], box[4])
    end
    return out
  end)(), ", ") .. " },",
  '    "leds": { ' .. table.concat((function()
    local out = {}
    for i, id in ipairs(G.PEDALS) do out[i] = ('"%s": %s'):format(id, pair(S.led(id))) end
    return out
  end)(), ", ") .. " },",
  ('    "door": [%d, %d, %d, %d],'):format(S.SIGN[1], S.SIGN[2], S.SIGN[3] - S.SIGN[1] + 1, S.DOOR[4] - S.SIGN[2] + 1),
  ('    "sign": [%d, %d],'):format((S.SIGN[1] + S.SIGN[3]) // 2, S.SIGN[2] + 3),
  ('    "board": [%d, %d],'):format((S.BOARD[1] + S.BOARD[3]) // 2, S.BOARD[2] + 6),
  ('    "lift": %d'):format(S.LIFT),
  "  },",
  '  "colors": {',
  table.concat(colors, ",\n"),
  "  },",
  '  "palette": ' .. list(palette, q),
  "}",
  "",
}, "\n")
L.writeText("open-case/assets/sprites.json", json)
print(("sprites: %d frames on a %dx%d sheet, %d colours"):format(#packed, sheet.w, sheet.h, #palette))
```

- [ ] **Step 5: Build the sheet, twice**

Run from the repo root:

```bash
/Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/sprites.lua
md5 -q open-case/assets/sprites.png open-case/assets/sprites.json > /tmp/sheet.md5
/Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/sprites.lua
md5 -q open-case/assets/sprites.png open-case/assets/sprites.json | diff - /tmp/sheet.md5 && echo deterministic
```

Expected: `sprites: 223 frames on a 512x1407 sheet, 39 colours` both times, then `deterministic`. The prototype's `sprites.png` was 36,193 bytes. The style sample is unchanged: running `art/open-case/style-sample.lua` still draws you with the acoustic.

- [ ] **Step 6: Draw you by your frames' new names**

In `open-case/src/render.js`, replace `youFrame`:

```js
// You: strumming for a moment after each note, and otherwise breathing.
export function youFrame(scene, t, time) {
  const since = t - scene.lastNote;
  if (since >= 0 && since < STRUM) return `you-strum-${Math.min(2, Math.floor((since / STRUM) * 3))}`;
  return `you-idle-${frameOf(time / BREATH, 2)}`;
}
```

with:

```js
// You with your instrument: playing for a moment after each note (a guitar's strum, a keyboard's
// hands), and otherwise breathing.
export function youFrame(scene, t, time, instrument) {
  const since = t - scene.lastNote;
  if (since >= 0 && since < STRUM) return `you-${instrument}-play-${Math.min(2, Math.floor((since / STRUM) * 3))}`;
  return `you-${instrument}-idle-${frameOf(time / BREATH, 2)}`;
}
```

and in `figures()`, `youFrame(scene, t, time)` becomes `youFrame(scene, t, time, 'acoustic')`:

```js
      { y: data.feet.you, draw: () => sprite(youFrame(scene, t, time, 'acoustic'), 0, 0) },
```

- [ ] **Step 7: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 160 tests.

- [ ] **Step 8: Commit**

```bash
git add art/open-case/draw.lua art/open-case/gear.lua art/open-case/shop.lua art/open-case/sprites.lua open-case/assets/sprites.png open-case/assets/sprites.json open-case/test/art.test.js open-case/src/render.js open-case/test/render.test.js
git commit -m "Open Case: the art for the music shop and your gear: you with each instrument, your pedals, the amp, the strip's icons, and the shop

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: The renderer draws your gear, the strip and the shop

**Files:**
- Modify: `open-case/src/render.js`
- Modify: `open-case/test/render.test.js`

**Interfaces:**
- Consumes:
  - Task 1: `STOCK`, `PEDALS`, `owns`, `stockItem`.
  - Task 2: `card`, `trying`, `CARD`, `BUTTON`.
  - Task 4: the frames and `data.shop`, `data.feet.amp`, `data.feet.pedals`.
- Produces: `draw(view)` reads new view fields:
  - `gear` (a gear value);
  - `stomp: null | { id, on, time }`, with `time` on the page's clock;
  - `shop` (the shop's state).

  `screen` may be `'shop'`, which draws the shop instead of the park.

**Note:** after this task, `main.js` doesn't yet pass `gear` in the view, so the game doesn't run in a browser until Task 6 wires it up. The Node tests all pass.

- [ ] **Step 1: Write the failing tests**

Replace `open-case/test/render.test.js` with:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRenderer, shapeTags, personFrame, youFrame, treeFrame, W, H } from '../src/render.js';
import { createSet, runSet } from '../src/set.js';
import { createScene, createFlocks, sceneNote, CASE, PIGEONS } from '../src/scene.js';
import { createKeyState } from '../src/keys.js';
import { goodSet } from '../src/bots.js';
import { KINDS } from '../src/crowd.js';
import { BAR, BEAT } from '../src/groove.js';
import { INTEREST } from '../src/tuning.js';
import { STOCK, PEDALS, INSTRUMENTS, freshGear, buy, stomp } from '../src/gear.js';
import { createShop, CARD, BUTTON } from '../src/shop.js';
import { stoodAt } from './helpers.js';

// The real frame data, with a stand-in for the sheet's image.
const data = JSON.parse(readFileSync(new URL('../assets/sprites.json', import.meta.url), 'utf8'));
const art = { sheet: { fake: 'sheet' }, frames: data.frames, data };
// Which frame a drawImage call took from the sheet, by where it was cut from.
const frameAt = new Map(Object.entries(data.frames).map(([name, [x, y]]) => [`${x},${y}`, name]));

// A stand-in 2D context that records what's drawn: every filled rectangle, every piece of text (both
// the strings alone, in `texts`, and their positions, in `positions`, for layout checks) and every
// sprite, by name, with where it went (in `sprites`). measureText is a rough stand-in (6px/char): real
// widths come from the browser's own font metrics.
function fakeContext() {
  const rects = [], texts = [], positions = [], sprites = [];
  return {
    rects, texts, positions, sprites,
    fillStyle: '', font: '', textAlign: '', textBaseline: '', globalAlpha: 1, imageSmoothingEnabled: true,
    fillRect(x, y, w, h) {
      assert.ok([x, y, w, h].every(Number.isFinite), `fillRect(${x}, ${y}, ${w}, ${h})`);
      rects.push([x, y, w, h, this.fillStyle]);
    },
    fillText(s, x, y) {
      texts.push(s);
      positions.push({ s, x, y, align: this.textAlign });
    },
    measureText(s) {
      return { width: s.length * 6 };
    },
    drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh) {
      assert.equal(img, art.sheet);
      assert.ok([sx, sy, dx, dy].every(Number.isInteger), `drawImage at ${dx}, ${dy}`);
      assert.ok(sw === dw && sh === dh, 'drawn at 1:1');
      sprites.push({ name: frameAt.get(`${sx},${sy}`), x: dx, y: dy });
    },
  };
}
const drawn = (g, prefix) => g.sprites.filter((s) => s.name.startsWith(prefix));

const view = (over) => ({
  screen: 'playing', set: null, scene: createScene(1), keys: createKeyState(), t: 0, bars: 0, time: 1, still: false,
  flocks: createFlocks(1), gear: freshGear(), stomp: null, shop: null, debug: null, ...over,
});
// Gear with everything bought: every pedal (the odd ones on) and every instrument, playing `instrument`.
function allGear(instrument = 'acoustic') {
  const gear = { ...freshGear(), savings: 10000 };
  for (const item of STOCK) buy(gear, item.id);
  PEDALS.forEach((id, i) => i % 2 === 0 && stomp(gear, id));
  gear.instrument = instrument;
  return gear;
}

test('the title shows the name, the key layout and how to start, over the park at dusk', () => {
  const g = fakeContext();
  createRenderer(g, art)(view({ screen: 'title' }));
  assert.ok(g.texts.includes('Open Case'));
  assert.ok(['A', 'W', "'", 'press any key'].every((s) => g.texts.includes(s)));
  assert.ok(g.texts.some((s) => s.startsWith('2-6 your pedals')), 'the pedal keys');
  assert.ok(g.rects.some(([x, y, w]) => x === 0 && y === 0 && w === W), 'the sky behind it');
  for (const n of ['ground', 'lamp-off', 'you-acoustic-idle-', 'case', 'sun']) assert.ok(drawn(g, n).length, n);
  assert.equal(drawn(g, 'pool').length, 0, 'the lamp is off at dusk');
});

test('a set in full swing draws everyone, their reactions, the trail and the strip without error', () => {
  const g = fakeContext();
  const set = runSet(1, goodSet(1)); // a whole set, so the strip is full
  const scene = createScene(1);
  for (const [i, n] of set.listen.notes.slice(-12).entries()) sceneNote(scene, n.pitch, set.listen.notes.length - 12 + i, set.t - 2 + i * 0.1);
  scene.gold = { t: set.t - 0.5, first: 0 };
  scene.caseCoins = 7;
  const rules = ['repeat', 'offKey', 'callback', 'recognised', 'random', 'silence', 'loud', 'taste'];
  KINDS.forEach((kind, i) => stoodAt(set.crowd, kind, i, { reaction: { rule: rules[i], t: set.t } }));
  stoodAt(set.crowd, 'jogger', 4, { reaction: { rule: rules[4], t: set.t }, state: 'passing', dir: -1 });
  stoodAt(set.crowd, 'oldman', 5, { reaction: { rule: rules[7], t: set.t }, state: 'leaving' });
  createRenderer(g, art)(view({ set, scene, t: set.t, bars: set.t / BAR, debug: { reported: 12, measured: 18 } }));
  for (const r of ['repeat', 'offKey', 'callback', 'recognised', 'random', 'taste']) assert.equal(drawn(g, `react-${r}-`).length, 1, r);
  assert.equal(drawn(g, 'case-coin').length, 7, 'the coins in the case');
  assert.ok(g.texts.some((s) => s.startsWith('delay 12ms  key 18ms')), 'the debug panel');
  assert.ok(g.texts.includes('they remember'), 'the strip is labelled for a first-time player');
  assert.ok(g.texts.includes('callback!'), 'a callback pops up by the lit box');
  assert.ok(g.rects.every(([x, y]) => x > -40 && x < W + 40 && y > -40 && y < H + 40));
});

test('every frame the renderer asks for is in the sheet, over a whole set, with and without motion', () => {
  // sprite() throws on a name the sheet doesn't have, so drawing every case without an error is the check.
  const set = createSet(2);
  const rules = ['repeat', 'offKey', 'callback', 'recognised', 'random', 'silence', 'loud', 'taste'];
  const states = ['passing', 'joining', 'stopped', 'leaving'];
  KINDS.forEach((kind, i) => {
    for (const [j, state] of states.entries()) {
      stoodAt(set.crowd, kind, (i + j) % 6, { state, dir: j % 2 ? 1 : -1, interest: j % 2 ? 0.9 : 0.3, x: 40 + i * 60 + j * 7, reaction: { rule: rules[(i + j) % 8], t: 0 } });
    }
  });
  const scene = createScene(2);
  scene.flights.push({ from: [200, 120], t: 0 });
  const draw = createRenderer(fakeContext(), art);
  const flocks = createFlocks(2);
  for (let t = 0; t < 62 * BAR; t += 0.37) {
    if (Math.abs(t - 20) < 0.2) sceneNote(scene, 60, 0, t, 4); // the pigeons scatter
    if (t % 3 < 0.37) sceneNote(scene, 62, 0, t, 3); // you play, on every instrument in turn
    set.t = t;
    for (const p of set.crowd.people) p.reaction.t = t - 0.1;
    const gear = allGear(INSTRUMENTS[Math.floor(t) % INSTRUMENTS.length]);
    const stomped = { id: PEDALS[Math.floor(t) % PEDALS.length], on: t % 2 < 1, time: t * 1.3 - 0.5 };
    for (const still of [false, true]) draw(view({ set, scene, t, bars: t / BAR, time: t * 1.3 - 0.01, still, flocks, gear, stomp: stomped }));
  }
});

test('the sky darkens over the set: dusk at the start, night at the end with the stars out and the lamp lit', () => {
  const dusk = fakeContext(), night = fakeContext();
  const set = createSet(1), scene = createScene(1);
  createRenderer(dusk, art)(view({ set, scene, t: 0.5, bars: 0.5 / BAR }));
  createRenderer(night, art)(view({ set, scene, t: 59.5 * BAR, bars: 59.5 }));
  const top = (g) => g.rects.find(([x, y, w]) => x === 0 && y === 0 && w === W)[4];
  assert.equal(top(dusk), data.sky[0][0]);
  assert.equal(top(night), data.sky[4][0]);
  assert.equal(drawn(dusk, 'sun').length, 1);
  assert.equal(drawn(night, 'sun').length, 0, 'the sun has set');
  assert.equal(drawn(night, 'pool').length, 1);
  assert.ok(drawn(night, 'lamp-on').length + drawn(night, 'lamp-flicker').length === 1);
  const stars = (g) => g.rects.filter(([x, y, w, h]) => w === 1 && h === 1 && data.stars.some(([sx, sy]) => sx === x && sy === y)).length;
  assert.equal(stars(dusk), 0);
  assert.equal(stars(night), 10);
  const windows = (g) => g.rects.filter(([x, y, w, h, c]) => w === 2 && h === 2 && c === data.colors.gold).length;
  assert.equal(windows(dusk), 0, 'no windows lit at dusk');
  assert.equal(windows(night), data.windows.length, 'every window lit by night');
  assert.ok(drawn(night, 'roofs-front-3').length === 1, "the rooftops follow the horizon's band");
});

test('with reduced motion there are no birds or train, and the clouds and trees hold still', () => {
  const scene = createScene(4);
  const t = scene.trainBar * BAR + 3; // the train is mid-crossing
  const flocks = createFlocks(4);
  const time = flocks.next + 4; // a flock is mid-sky
  const moving = fakeContext(), still = fakeContext();
  const set = createSet(4);
  createRenderer(moving, art)(view({ set, scene, t, bars: t / BAR, time, flocks }));
  createRenderer(still, art)(view({ set, scene, t, bars: t / BAR, time, flocks: createFlocks(4), still: true }));
  assert.ok(drawn(moving, 'bird-').length >= 1 && drawn(moving, 'train-').length === 1);
  assert.equal(drawn(still, 'bird-').length, 0);
  assert.equal(drawn(still, 'train-').length, 0);
  assert.deepEqual(drawn(still, 'trees-').map((s) => s.name), ['trees-0']);
  data.clouds.forEach(([x, y], i) => {
    const c = drawn(still, `cloud-${i}-`)[0], f = data.frames[c.name];
    assert.deepEqual([c.x + f[4], c.y + f[5]], [x, y], `cloud ${i} at home`);
  });
});

test('listeners face you once they stop, breathe standing, and nod on the beat once hooked', () => {
  const p = { kind: 'student', state: 'stopped', x: 80, y: 156, dir: -1, id: 3, interest: 0.3 };
  assert.match(personFrame(p, 0, 0), /^student-stand-\d-right$/, 'left of you, facing right');
  assert.match(personFrame({ ...p, x: 200 }, 0, 0), /-left$/);
  assert.match(personFrame({ ...p, state: 'passing' }, 0, 0), /^student-walk-\d-left$/, 'walking the way they go');
  const hooked = { ...p, interest: INTEREST.hook + 0.1 };
  assert.equal(personFrame(hooked, 10 * BEAT + 0.05, 0), 'student-nod-1-right', 'head down on the beat');
  assert.equal(personFrame(hooked, 10 * BEAT + BEAT * 0.6, 0), 'student-nod-0-right', 'up between beats');
  const steps = new Set([0, 4, 8, 12].map((dx) => personFrame({ ...p, state: 'passing', x: 100 + dx }, 0, 0)));
  assert.equal(steps.size, 4, 'a walker steps through four frames as they go');
});

test('you play your instrument on each note, then go back to breathing; the trees rustle on the bar line', () => {
  const scene = createScene(1);
  assert.match(youFrame(scene, 5, 5, 'acoustic'), /^you-acoustic-idle-\d$/);
  sceneNote(scene, 60, 0, 5, 3);
  assert.equal(youFrame(scene, 5, 5, 'acoustic'), 'you-acoustic-play-0');
  assert.equal(youFrame(scene, 5.1, 5.1, 'synth'), 'you-synth-play-1');
  assert.equal(youFrame(scene, 5.17, 5.17, 'ukulele'), 'you-ukulele-play-2');
  assert.match(youFrame(scene, 5.3, 5.3, 'epiano'), /^you-epiano-idle-\d$/);
  assert.equal(treeFrame(3 * BAR + 0.05, 1, true, false), 2);
  assert.notEqual(treeFrame(3 * BAR + 1, 1, true, false), 2);
  assert.notEqual(treeFrame(3 * BAR + 0.05, 1, false, false), 2, 'no rustle without a set');
  assert.equal(treeFrame(3 * BAR + 0.05, 1, true, true), 0);
});

test('a case with more coins than it has places for shows it full, not an error', () => {
  const g = fakeContext();
  const scene = createScene(1);
  scene.caseCoins = 250;
  createRenderer(g, art)(view({ set: createSet(1), scene, t: 1, bars: 0 }));
  assert.equal(drawn(g, 'case-coin').length, data.caseCoins.length);
});

test('a coin in flight spins on its way to the case', () => {
  const g = fakeContext();
  const set = createSet(1), scene = createScene(1);
  scene.flights.push({ from: [220, 116], t: 1 });
  createRenderer(g, art)(view({ set, scene, t: 1.3, bars: 1.3 / BAR }));
  const [coin] = drawn(g, 'coin-');
  assert.ok(coin && coin.x > CASE[0] - 10 && coin.x < 220);
});

test('the callback popup only shows while the gold moment is active', () => {
  const g = fakeContext();
  const set = runSet(1, goodSet(1));
  const scene = createScene(1);
  scene.gold = null;
  createRenderer(g, art)(view({ set, scene, t: set.t, bars: set.t / BAR }));
  assert.ok(g.texts.includes('they remember'), 'the strip is still labelled with no callback live');
  assert.ok(!g.texts.includes('callback!'), 'no popup without a live callback');
});

test('waiting for the first note, and paused', () => {
  const g = fakeContext();
  const draw = createRenderer(g, art);
  draw(view({ screen: 'ready' }));
  assert.ok(g.texts.includes('play a note to start the set'));
  g.rects.length = 0;
  draw(view({ screen: 'paused', set: createSet(1) }));
  assert.deepEqual(g.rects.at(-1).slice(0, 4), [0, 0, W, H], 'dimmed under the pause card');
});

test('an unknown frame is an error, not a blank', () => {
  const draw = createRenderer(fakeContext(), { ...art, frames: { ...art.frames, ground: undefined } });
  assert.throws(() => draw(view({})), /no sprite called ground/);
});

test('the debug panel tags your last notes by shape, repeats sharing a letter', () => {
  assert.equal(shapeTags([null, null, null, 'x', 'y', 'x', 'z']), '---ABAC');
});

test('the debug panel starts clear of the strip label, with a couple of px to spare', () => {
  const g = fakeContext();
  const set = runSet(1, goodSet(1));
  const scene = createScene(1);
  createRenderer(g, art)(view({ set, scene, t: set.t, bars: set.t / BAR, debug: { reported: 12, measured: 18 } }));
  const label = g.positions.find((p) => p.s === 'they remember');
  const panel = g.rects.find(([x, , w]) => x === W - 132 && w === 130);
  assert.ok(label && panel, 'both the label and the debug panel are drawn');
  assert.ok(panel[1] - (label.y + 8) >= 2, "the panel's top clears the label's ink by at least 2px");
});

test('the callback word stays inside the screen for the rightmost lit box', () => {
  const g = fakeContext();
  const set = runSet(1, goodSet(1));
  const scene = createScene(1);
  const idea = { steps: [2, -1, 3], gaps: [1, 1, 1], pitch: 60, bar: 0, calledBar: null };
  set.listen.strip = [idea, idea, idea, idea, idea, idea]; // a full strip: the lit box (i = n - 1) is the rightmost
  scene.gold = { t: set.t - 0.3, first: 0 };
  createRenderer(g, art)(view({ set, scene, t: set.t, bars: set.t / BAR }));
  const word = g.positions.filter((p) => p.s === 'callback!');
  assert.equal(word.length, 2, 'the shadow and the gold copy both draw');
  for (const { x, align } of word) {
    assert.equal(align, 'left', 'the rightmost box places the word to its right');
    assert.ok(x + 'callback!'.length * 6 <= W - 4, 'its ink stays clear of the right edge');
  }
});

test('listeners are drawn nearest last, so someone in front covers someone behind', () => {
  const g = fakeContext();
  const set = createSet(1);
  stoodAt(set.crowd, 'jogger', 1); // y 156
  stoodAt(set.crowd, 'commuter', 0); // y 150
  createRenderer(g, art)(view({ set, scene: createScene(1), t: 1, bars: 0 }));
  const order = g.sprites.map((s) => s.name.split('-')[0]).filter((n) => ['jogger', 'commuter', 'you', 'case'].includes(n));
  assert.deepEqual(order, ['commuter', 'you', 'jogger', 'case']);
});

test('your instrument, your pedals by the crate, and the amp with the electric guitar', () => {
  const plain = fakeContext();
  createRenderer(plain, art)(view({ set: createSet(1), t: 1 }));
  assert.equal(drawn(plain, 'pedal-').length, 0, 'no pedals yet');
  assert.equal(drawn(plain, 'amp').length, 0);
  const g = fakeContext();
  createRenderer(g, art)(view({ set: createSet(1), t: 1, gear: allGear('electric') }));
  assert.equal(drawn(g, 'you-electric-').length, 1);
  assert.equal(drawn(g, 'amp').length, 1);
  assert.deepEqual(drawn(g, 'pedal-').map((s) => s.name), ['pedal-overdrive-1', 'pedal-chorus-0', 'pedal-tremolo-1', 'pedal-delay-0', 'pedal-reverb-1']);
  const keys = fakeContext();
  createRenderer(keys, art)(view({ set: createSet(1), t: 1, gear: allGear('epiano') }));
  assert.equal(drawn(keys, 'you-epiano-').length, 1);
  assert.equal(drawn(keys, 'amp').length, 0, 'the amp is only for the electric guitar');
});

test('the gear strip shows each pedal you own in its place, with its key, lit while on', () => {
  const g = fakeContext();
  const gear = { ...freshGear(), savings: 500 };
  buy(gear, 'chorus');
  buy(gear, 'delay');
  stomp(gear, 'delay');
  createRenderer(g, art)(view({ set: createSet(1), t: 1, gear }));
  const icons = drawn(g, 'strip-');
  assert.deepEqual(icons.map((s) => s.name), ['strip-chorus-0', 'strip-delay-1']);
  assert.ok(icons.every((s) => s.y === 170), 'along the bottom');
  const alone = fakeContext();
  createRenderer(alone, art)(view({ set: createSet(1), t: 1, gear: { ...gear, owned: ['delay'] } }));
  assert.equal(drawn(alone, 'strip-')[0].x, icons[1].x, 'a pedal keeps its place whatever else you own');
  const keys = g.positions.filter((p) => p.s === '3' || p.s === '5');
  assert.deepEqual(keys.map((p) => p.s), ['3', '5']);
  const oct = g.positions.find((p) => p.s.startsWith('oct')), bar = g.positions.find((p) => p.s.startsWith('bar '));
  assert.ok(icons[0].x > oct.x + 50 && icons[1].x + 20 < bar.x - 54, 'between the pick strength and the bar count');
  const all = fakeContext();
  createRenderer(all, art)(view({ set: createSet(1), t: 1, gear: allGear() }));
  const last = drawn(all, 'strip-').at(-1);
  assert.ok(last.x + 14 < Math.min(...PIGEONS.map(([x]) => x)) - 4, 'the strip ends before the pigeons');
  assert.ok(drawn(all, 'strip-')[0].x >= 78 + 4 * 6, 'and starts after "lock"');
  const none = fakeContext();
  createRenderer(none, art)(view({ set: createSet(1), t: 1 }));
  assert.equal(drawn(none, 'strip-').length, 0, 'empty until you own a pedal');
});

test('a stomped pedal says so over the strip for a second', () => {
  const gear = allGear();
  const at = (time) => {
    const g = fakeContext();
    createRenderer(g, art)(view({ set: createSet(1), t: 1, time, gear, stomp: { id: 'delay', on: true, time: 10 } }));
    return g.texts;
  };
  assert.ok(at(10.2).includes('delay on'));
  assert.ok(!at(11.2).includes('delay on'), 'gone after a second');
  const g = fakeContext();
  createRenderer(g, art)(view({ screen: 'ready', time: 3, gear, stomp: { id: 'overdrive', on: false, time: 2.5 } }));
  assert.ok(g.texts.includes('overdrive off'), 'between sets too');
});

test('the shop: the room, the stock with its tags, the chosen item lifted, the savings and the card', () => {
  const g = fakeContext();
  const gear = { ...freshGear(), savings: 45 };
  buy(gear, 'overdrive');
  const shop = { ...createShop(), at: STOCK.findIndex((s) => s.id === 'chorus') };
  createRenderer(g, art)(view({ screen: 'shop', shop, gear, time: 5 }));
  for (const n of ['shop-room', 'shop-counter', 'keeper-']) assert.equal(drawn(g, n).length, 1, n);
  assert.equal(drawn(g, 'item-').length, STOCK.length);
  assert.deepEqual(drawn(g, 'item-').filter((s) => s.name.endsWith('-1')).map((s) => s.name), ['item-chorus-1'], 'only the chosen one lifted');
  assert.equal(drawn(g, 'tag-yours').length, 2, 'the overdrive and the acoustic are yours');
  assert.equal(drawn(g, 'tag-price').length, STOCK.length - 2);
  for (const s of ['back to', 'the park', 'saved', '5 coins', 'Chorus', '50 coins', 'Not enough coins yet (you have 5)']) {
    assert.ok(g.texts.includes(s), s);
  }
  assert.equal(drawn(g, 'ground').length, 0, 'not the park');
  assert.ok(!g.rects.some(([x, y, w, h, c]) => x === BUTTON[0] && y === BUTTON[1] && w === BUTTON[2] && h === BUTTON[3]), 'no button: nothing to do');
  const lit = g.rects.filter(([x, y, w, h, c]) => w === 2 && h === 1 && c === data.colors.light).map(([x, y]) => `${x},${y}`);
  const led = data.shop.leds.chorus;
  assert.deepEqual(lit, [`${led[0]},${led[1] - data.shop.lift}`], "the chosen pedal's light is lit: you're hearing it");
});

test('the shop card has a button when there is something to buy or play, and the keeper nods at a sale', () => {
  const g = fakeContext();
  const gear = { ...freshGear(), savings: 300 };
  const shop = { ...createShop(), at: STOCK.findIndex((s) => s.id === 'synth'), soldAt: 4.5 };
  createRenderer(g, art)(view({ screen: 'shop', shop, gear, time: 5 }));
  assert.ok(g.texts.includes('Enter to buy') && g.texts.includes('buy'));
  assert.ok(g.rects.some(([x, y, w, h]) => x === BUTTON[0] && y === BUTTON[1] && w === BUTTON[2] && h === BUTTON[3]));
  assert.match(drawn(g, 'keeper-')[0].name, /^keeper-[23]$/, 'nodding just after a sale');
  const later = fakeContext();
  createRenderer(later, art)(view({ screen: 'shop', shop, gear, time: 7 }));
  assert.match(drawn(later, 'keeper-')[0].name, /^keeper-[01]$/);
  assert.ok(later.rects.every(([x, y, w, h]) => y + h <= H && x >= 0 && x + w <= W), 'everything on the screen');
  assert.ok(CARD[1] + CARD[3] <= H);
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL. No `pedal-`, `strip-`, `amp` or `shop-room` sprites are drawn, the title has no pedal line, and the shop screen draws the park.

- [ ] **Step 3: Draw them**

Replace `open-case/src/render.js` with:

```js
// Draws the scene at 320x180 into a 2D context (main.js scales it up by a whole number), in the flat
// style, from the sprite sheet art/open-case/sprites.lua makes (assets.js loads it): the park and its
// sunset, you on your crate with your instrument, your pedals, the open case and the looper, the
// passers-by, their reactions, the pigeons and birds, the note trail, the memory strip, the gear
// strip, the music shop, and the title, pause and ?debug overlays. The end card is HTML (index.html).
import { CROWD, PLAY, LAYERS, INTEREST } from './tuning.js';
import { BAR, BEAT } from './groove.js';
import {
  GUITAR, coinAt, glyphAt, GOLD, skyStages, sunDrop, windowLit, lampState, starsOut, trainX, cloudX,
  birdsAt, pigeonsAt, frameOf,
} from './scene.js';
import { STOCK, PEDALS, owns, stockItem } from './gear.js';
import { card, trying, CARD, BUTTON } from './shop.js';

export const W = 320, H = 180;
const FONT = '8px Silkscreen, monospace';
const ICON_TIME = 1.6; // seconds a reaction shows over a head
const REACT_FPS = 2.5; // a reaction's two frames alternate this many times a second
const GOLD_PULSE = 8; // speed (rad/s) the callback's gold frame pulses at
const DEBUG_PANEL_TOP = 32; // clears "they remember" (drawn at y 22, ~8px tall) with a couple of px to spare
const CALLBACK_MARGIN = 4; // px the "callback!" popup keeps clear of both canvas edges
const RULE_WORDS = { offKey: 'off key' }; // the ?debug view's words for rules, where they differ from their names
const STRUM = 0.18; // seconds your picking hand takes over a strum's three frames
const BREATH = 0.9; // seconds each frame of a breath lasts (you, and standing listeners)
const STEP = 4; // pixels a walker moves per frame of their walk
const NOD = 0.3; // the share of each beat a hooked listener's head is down
const OVER_HEAD = 47; // pixels above a listener's feet their reaction's tail points to
const SWAY = 0.8; // how fast (rad/s) the trees sway...
const RUSTLE = 0.2; // ...and how long (seconds) they rustle after each bar line
const STRIP_X = 106; // the gear strip: its first pedal's icon (clear of "lock")...
const STRIP_STEP = 16; // ...and the next one's, this far to the right (each pedal has its own place), so the
// last ends before the pigeons (scene.js PIGEONS)
const STOMP_SHOW = 1; // seconds a stomped pedal's name shows over the strip
const NOD_SHOW = 1.2; // seconds the shopkeeper nods after a sale...
const NOD_FPS = 4; // ...this many nods a second

// Your last notes tagged by shape: notes completing the same shape share a letter; '-' completes none.
export function shapeTags(shapes) {
  const letters = new Map();
  return shapes.map((k) => {
    if (!k) return '-';
    if (!letters.has(k)) letters.set(k, String.fromCharCode(65 + (letters.size % 26)));
    return letters.get(k);
  }).join('');
}

// The frame a listener shows: walking by where they are (so a slower walker steps slower), and
// standing still facing you, breathing, or nodding on the beat once they're hooked.
export function personFrame(p, t, time) {
  const facingYou = p.state === 'stopped' || p.state === 'joining';
  const face = (facingYou ? (p.x < CROWD.playerX ? 1 : -1) : p.dir) > 0 ? 'right' : 'left';
  if (p.state !== 'stopped') return `${p.kind}-walk-${frameOf((Math.abs(p.x) + Math.abs(p.y)) / STEP, 4)}-${face}`;
  if (p.interest > INTEREST.hook) return `${p.kind}-nod-${t / BEAT - Math.floor(t / BEAT) < NOD ? 1 : 0}-${face}`;
  return `${p.kind}-stand-${frameOf(time / BREATH + p.id * 0.37, 2)}-${face}`;
}

// You with your instrument: playing for a moment after each note (a guitar's strum, a keyboard's
// hands), and otherwise breathing.
export function youFrame(scene, t, time, instrument) {
  const since = t - scene.lastNote;
  if (since >= 0 && since < STRUM) return `you-${instrument}-play-${Math.min(2, Math.floor((since / STRUM) * 3))}`;
  return `you-${instrument}-idle-${frameOf(time / BREATH, 2)}`;
}

// The trees: still when motion is reduced, rustling just after each bar line of a set, and otherwise
// swaying slowly.
export function treeFrame(t, time, playing, still) {
  if (still) return 0;
  if (playing && t >= 0 && t % BAR < RUSTLE) return 2;
  return Math.sin(time * SWAY) > 0.4 ? 1 : 0;
}

// art: { sheet, frames, data } from assets.js.
export function createRenderer(g, art) {
  const { sheet, frames, data } = art;
  const C = data.colors;
  const px = (x, y, w, h, c) => {
    g.fillStyle = c;
    g.fillRect(Math.round(x), Math.round(y), w, h);
  };
  const text = (s, x, y, c = C.light, align = 'left') => {
    g.font = FONT;
    g.textAlign = align;
    g.textBaseline = 'top';
    g.fillStyle = c;
    g.fillText(s, Math.round(x), Math.round(y));
  };
  // A frame from the sheet, placed by its anchor.
  const sprite = (name, x, y) => {
    const f = frames[name];
    if (!f) throw new Error(`no sprite called ${name}`);
    g.drawImage(sheet, f[0], f[1], f[2], f[3], Math.round(x) - f[4], Math.round(y) - f[5], f[2], f[3]);
  };
  const bandOf = (y) => data.bands.findLastIndex((b) => b <= y);

  // Back to front: the sky and what's in it, the rooftops, the trees, the hedge and path, the lamp.
  function park({ bars, t, time, still, set, scene, flocks }) {
    const bar = Math.floor(bars);
    const stages = skyStages(bar);
    data.bands.forEach((top, i) => {
      const bottom = data.bands[i + 1] ?? data.skyBottom + 1;
      px(0, top, W, bottom - top, data.sky[stages[i]][i]);
    });
    data.stars.slice(0, starsOut(bar)).forEach(([x, y], i) => {
      const bright = still || Math.sin(time * 0.9 + i * 2.3) > -0.3;
      px(x, y, 1, 1, bright ? C.light : C.grey);
    });
    const drop = sunDrop(bars);
    if (drop !== null) sprite('sun', data.sun[0], data.sun[1] + drop);
    data.clouds.forEach(([x, y, layer], i) => sprite(`cloud-${i}-${stages[bandOf(y)]}`, still ? x : cloudX(x, layer, time), y));
    if (!still) for (const b of birdsAt(flocks, time)) sprite(`bird-${b.frame}`, b.x, b.y);
    const roofs = stages[6]; // the rooftops darken with the band behind them
    sprite(`roofs-back-${roofs}`, 0, 0);
    const train = set && !still ? trainX(scene, t) : null;
    if (train !== null) sprite(`train-${roofs}`, train, data.trainY);
    sprite(`roofs-front-${roofs}`, 0, 0);
    data.windows.forEach(([x, y], i) => {
      if (windowLit(scene, i, bar)) px(x, y, 2, 2, C.gold);
    });
    sprite(`trees-${treeFrame(t, time, !!set, still)}`, 0, 0);
    sprite('ground', 0, 0);
    const lamp = lampState(bar, time, still);
    if (lamp !== 'off') sprite('pool', 0, 0);
    sprite(`lamp-${lamp}`, 0, 0);
  }

  // Everyone and everything standing on the path, nearest last: the listeners, you, your pedals and
  // amp, the looper, the case and its coins, and the pigeons on the ground. Returns the pigeons in the
  // air, drawn later.
  function figures({ set, scene, t, time, gear }) {
    const beatPhase = set && t >= 0 ? (t % BAR) / BAR : 1;
    const things = [
      { y: data.feet.you, draw: () => sprite(youFrame(scene, t, time, gear.instrument), 0, 0) },
      {
        y: data.feet.pedals,
        draw: () => {
          for (const id of PEDALS) if (owns(gear, id)) sprite(`pedal-${id}-${gear.on.includes(id) ? 1 : 0}`, 0, 0);
        },
      },
      { y: data.feet.looper, draw: () => sprite(`looper-${beatPhase < 0.25 ? 1 : 0}`, 0, 0) },
      {
        y: data.feet.case,
        draw: () => {
          sprite('case', 0, 0);
          for (const [x, y] of data.caseCoins.slice(0, scene.caseCoins)) sprite('case-coin', x, y);
        },
      },
    ];
    if (gear.instrument === 'electric') things.push({ y: data.feet.amp, draw: () => sprite('amp', 0, 0) });
    if (set) for (const p of set.crowd.people) things.push({ y: p.y, draw: () => sprite(personFrame(p, t, time), p.x, p.y) });
    const flying = [];
    for (const b of pigeonsAt(scene, t, time)) {
      const name = `pigeon-${b.pose}-${b.frame}-${b.dir > 0 ? 'right' : 'left'}`;
      if (b.pose === 'fly') flying.push(() => sprite(name, b.x, b.y));
      else things.push({ y: b.y, draw: () => sprite(name, b.x, b.y) });
    }
    things.sort((a, b) => a.y - b.y);
    for (const thing of things) thing.draw();
    return flying;
  }

  function trail(scene, notes, t) {
    for (const glyph of scene.trail) {
      const { x, y, fade } = glyphAt(glyph, t);
      if (fade <= 0 || x > W) continue;
      const echo = notes[glyph.index]?.echo ?? 1;
      g.globalAlpha = fade;
      if (echo === 2) px(x - 1, y - 1, 5, 5, C.light); // a shape's second time: a faint outline
      px(x, y, 3, 3, echo >= 3 ? C.grey : C.gold);
      px(x + 2, y - 4, 1, 4, echo >= 3 ? C.grey : C.gold);
      g.globalAlpha = 1;
    }
  }

  // The crowd's 6 remembered ideas, along the top: each a little contour of its 4 notes.
  function strip(listen, scene, t) {
    const n = listen.strip.length;
    for (let i = 0; i < 6; i++) {
      const x = 58 + i * 36, y = 4;
      const lit = scene.gold && i === n - 1;
      g.globalAlpha = lit ? 1 : 0.6;
      px(x, y, 30, 16, lit ? C.goldDark : C.ink);
      g.globalAlpha = 1;
      if (lit) {
        // a pulsing gold frame around the idea that just came back
        const w = 1 + (Math.sin(t * GOLD_PULSE) > 0 ? 1 : 0);
        px(x, y, 30, w, C.gold);
        px(x, y + 16 - w, 30, w, C.gold);
        px(x, y, w, 16, C.gold);
        px(x + 30 - w, y, w, 16, C.gold);
      }
      const idea = listen.strip[i];
      if (!idea) continue;
      let p = 0;
      const ys = [0, ...idea.steps.map((s) => (p += s))];
      const lo = Math.min(...ys), hi = Math.max(...ys), span = Math.max(1, hi - lo);
      ys.forEach((v, k) => px(x + 3 + k * 7, y + 12 - Math.round(((v - lo) / span) * 9), 3, 2, lit ? C.light : C.gold));
    }
    text('they remember', 163, 22, C.grey, 'center'); // labels the strip for a first-time player; 163 is its centre (58..268)
    if (scene.gold) {
      // the gold arc from the old idea down to your guitar
      const k = Math.min(1, (t - scene.gold.t) / 0.5);
      const boxX = 58 + (n - 1) * 36, x0 = boxX + 15, y0 = 20, [x1, y1] = GUITAR;
      g.globalAlpha = 1 - Math.max(0, (t - scene.gold.t) / GOLD);
      for (let s = 0; s <= k; s += 0.04) px(x0 + (x1 - x0) * s, y0 + (y1 - y0) * s - Math.sin(Math.PI * s) * 20, 3, 3, C.gold);
      // the word, on the side of the box away from the guitar so the arc (which only moves from the box
      // towards x1) never crosses it; clamped so it also stays CALLBACK_MARGIN clear of both canvas
      // edges (the rightmost box otherwise runs the word off the right side); a 1px dark shadow keeps
      // it crisp over the sky
      const rightOfGuitar = x0 > x1, align = rightOfGuitar ? 'left' : 'right';
      g.font = FONT;
      const ww = g.measureText('callback!').width;
      const wx = rightOfGuitar
        ? Math.min(boxX + 33, W - CALLBACK_MARGIN - ww - 1) // -1 leaves room for the shadow's +1px offset
        : Math.max(boxX - 3, CALLBACK_MARGIN + ww);
      text('callback!', wx + 1, 9, C.ink, align);
      text('callback!', wx, 8, C.gold, align);
      g.globalAlpha = 1;
    }
  }

  function hud(keys, set, gear, stomp, time) {
    text(`oct ${keys.octave >= 0 ? '+' : ''}${keys.octave}`, 4, 170);
    for (let i = 0; i < PLAY.strengthMax; i++) px(52 + i * 5, 172, 4, 4, i < keys.strength ? C.light : C.ink);
    if (keys.lock) text('lock', 78, 170, C.gold);
    if (set) text(`bar ${Math.min(60, Math.floor(set.t / BAR) + 1)}/60`, W - 4, 170, C.light, 'right');
    // The gear strip: each pedal you own in its own place, with its key, lit while it's on; the name
    // of the one just stomped shows above it for a moment.
    PEDALS.forEach((id, i) => {
      if (!owns(gear, id)) return;
      const on = gear.on.includes(id), x = STRIP_X + i * STRIP_STEP;
      sprite(`strip-${id}-${on ? 1 : 0}`, x, 170);
      text(String(stockItem(id).key), x + 9, 170, on ? C.light : C.grey);
    });
    if (stomp && time - stomp.time >= 0 && time - stomp.time < STOMP_SHOW) {
      const x = STRIP_X + PEDALS.indexOf(stomp.id) * STRIP_STEP + 7;
      const words = `${stockItem(stomp.id).name.toLowerCase()} ${stomp.on ? 'on' : 'off'}`;
      text(words, x + 1, 161, C.ink, 'center');
      text(words, x, 160, stomp.on ? C.gold : C.light, 'center');
    }
  }

  function title() {
    g.globalAlpha = 0.9;
    px(40, 34, 240, 112, C.ink);
    g.globalAlpha = 1;
    g.font = '16px Silkscreen, monospace';
    g.textAlign = 'center';
    g.textBaseline = 'top';
    g.fillStyle = C.light;
    g.fillText('Open Case', W / 2, 42);
    // the key layout: GarageBand's Musical Typing
    const whites = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'"];
    const blacks = { 0: 'W', 1: 'E', 3: 'T', 4: 'Y', 5: 'U', 7: 'O', 8: 'P' };
    whites.forEach((k, i) => {
      px(72 + i * 16, 80, 15, 18, C.light);
      text(k, 79 + i * 16, 88, C.ink, 'center');
    });
    for (const [i, k] of Object.entries(blacks)) {
      px(72 + Number(i) * 16 + 10, 70, 11, 14, C.charcoal);
      text(k, 72 + Number(i) * 16 + 16, 73, C.light, 'center');
    }
    text('Z X octave   C V softer/louder   space ring', W / 2, 106, C.grey, 'center');
    text('1 scale lock   M mute   esc pause', W / 2, 116, C.grey, 'center');
    text('2-6 your pedals (from the shop)', W / 2, 126, C.grey, 'center');
    text('press any key', W / 2, 136, C.gold, 'center');
  }

  // The music shop: the room and the shopkeeper (nodding just after a sale), the stock with its tags
  // (the chosen item lifted, with a pointer over it, and the lights lit on the pedals you can hear),
  // the savings on the chalkboard, and the card for the chosen item.
  function shopView({ shop, gear, time, still }) {
    const S = data.shop;
    sprite('shop-room', 0, 0);
    text('back to', S.sign[0], S.sign[1], C.ink, 'center');
    text('the park', S.sign[0], S.sign[1] + 8, C.ink, 'center');
    text('saved', S.board[0], S.board[1], C.grey, 'center');
    text(`${gear.savings} coin${gear.savings === 1 ? '' : 's'}`, S.board[0], S.board[1] + 11, C.light, 'center');
    const since = time - shop.soldAt;
    sprite(`keeper-${since >= 0 && since < NOD_SHOW ? 2 + frameOf(since * NOD_FPS, 2) : frameOf(time / BREATH, 2)}`, 0, 0);
    sprite('shop-counter', 0, 0);
    const heard = trying(shop, gear).on;
    STOCK.forEach((item, i) => {
      const chosen = i === shop.at, lift = chosen ? S.lift : 0, [x, y, w] = S.items[item.id];
      sprite(`item-${item.id}-${chosen ? 1 : 0}`, 0, 0);
      if (heard.includes(item.id)) px(S.leds[item.id][0], S.leds[item.id][1] - lift, 2, 1, C.light);
      sprite(owns(gear, item.id) ? 'tag-yours' : 'tag-price', x + w - 1, y + 3 - lift);
      if (chosen) {
        const cx = x + Math.floor(w / 2), cy = y - lift - 7 - (!still && Math.sin(time * 5) > 0 ? 1 : 0);
        px(cx - 2, cy, 5, 1, C.gold);
        px(cx - 1, cy + 1, 3, 1, C.gold);
        px(cx, cy + 2, 1, 1, C.gold);
      }
    });
    const words = card(shop, gear);
    g.globalAlpha = 0.92;
    px(CARD[0], CARD[1], CARD[2], CARD[3], C.ink);
    g.globalAlpha = 1;
    text(words.name, CARD[0] + 6, CARD[1] + 3);
    text(words.price, CARD[0] + CARD[2] - 6, CARD[1] + 3, words.price === 'yours' ? C.go : C.gold, 'right');
    text(words.about, CARD[0] + 6, CARD[1] + 12, C.grey);
    text(words.says, CARD[0] + 6, CARD[1] + 21, words.button ? C.gold : C.light);
    text('arrows choose   esc back to the park', CARD[0] + 6, CARD[1] + 30, C.greyDark);
    if (words.button) {
      px(BUTTON[0], BUTTON[1], BUTTON[2], BUTTON[3], C.gold);
      text(words.button, BUTTON[0] + BUTTON[2] / 2, BUTTON[1] + 3, C.ink, 'center');
    }
  }

  function debugView(set, info) {
    for (const p of set.crowd.people) {
      const x = Math.round(p.x) - 10, y = Math.round(p.y) + 3;
      px(x, y, 20, 3, C.ink);
      px(x, y, Math.round(20 * p.interest), 3, p.interest >= 0.5 ? C.go : p.interest >= 0.2 ? C.gold : C.red);
      if (p.lastRule) text(RULE_WORDS[p.lastRule] ?? p.lastRule, p.x, y + 4, C.light, 'center');
    }
    const l = set.listen;
    const beat = Math.floor((set.t % BAR) / BEAT) + 1;
    const lines = [
      `bar ${Math.min(60, Math.floor(set.t / BAR) + 1)} beat ${beat}`,
      `layers ${LAYERS.filter((x) => set.layers[x.id]).map((x) => x.id).join(' ')}`,
      `crowd ${set.crowd.people.filter((p) => p.state === 'joining' || p.state === 'stopped').length}  coins ${set.coins}`,
      `shapes ${shapeTags(l.shapes.slice(-16))}`,
      `delay ${info.reported == null ? '?' : info.reported.toFixed(0)}ms  key ${info.measured == null ? '?' : info.measured.toFixed(0)}ms`,
    ];
    g.globalAlpha = 0.9;
    px(W - 132, DEBUG_PANEL_TOP, 130, lines.length * 9 + 4, C.ink);
    g.globalAlpha = 1;
    lines.forEach((s, i) => text(s, W - 129, DEBUG_PANEL_TOP + 2 + i * 9));
  }

  // view: { screen: 'title' | 'ready' | 'playing' | 'paused' | 'over' | 'shop', set, scene, keys,
  //   t (set time), bars (bars into the set, a fraction is fine; 0 with no set), time (seconds since
  //   the page opened), still (reduced motion), flocks (the birds, from createFlocks), gear (gear.js),
  //   stomp: null | { id, on, time } (the last pedal stomped, and when, on the page's clock),
  //   shop: the shop's state (shop.js) on the shop screen, debug: null | { reported, measured } }
  return function draw(view) {
    const { screen, set, scene, keys, t, time } = view;
    g.imageSmoothingEnabled = false;
    if (screen === 'shop') return shopView(view);
    park(view);
    const flying = figures(view);
    if (set) {
      for (const p of set.crowd.people) {
        if (p.reaction && t - p.reaction.t < ICON_TIME) {
          sprite(`react-${p.reaction.rule}-${frameOf(time * REACT_FPS, 2)}`, p.x, p.y - OVER_HEAD);
        }
      }
    }
    for (const fly of flying) fly();
    for (const f of scene.flights) {
      const at = coinAt(f, t);
      if (at) sprite(`coin-${frameOf((t - f.t) * 12, 2)}`, at[0], at[1]);
    }
    if (set) {
      trail(scene, set.listen.notes, t);
      strip(set.listen, scene, t);
      if (view.debug) debugView(set, view.debug);
    }
    if (keys && screen !== 'title') hud(keys, screen === 'ready' ? null : set, view.gear, view.stomp, time);
    if (screen === 'title') title();
    else if (screen === 'ready') text('play a note to start the set', W / 2, 60, C.light, 'center');
    else if (screen === 'paused') { // dimmed, under the pause card (index.html)
      g.globalAlpha = 0.5;
      px(0, 0, W, H, C.ink);
      g.globalAlpha = 1;
    }
  };
}
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 165 tests.

- [ ] **Step 5: Commit**

```bash
git add open-case/src/render.js open-case/test/render.test.js
git commit -m "Open Case: the screen shows your instrument, your pedals and amp, the gear strip, the pedal keys on the title, and the music shop

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: The game: savings, the shop screen, trying and buying

**Files:**
- Modify: `open-case/src/main.js`
- Modify: `open-case/index.html` (the end card)

**Interfaces:**
- Consumes everything above:
  - `loadGear`, `saveGear`, `earn`, `buy`, `play`, `stomp`, `stockItem`, `PEDALS`;
  - `createShop`, `move`, `action`, `trying`, `hit`;
  - `shopKey`;
  - `readBuys`, `logBuy`;
  - `audio.setInstrument` and `audio.setPedal`;
  - `onPedal`;
  - the view's `gear`, `stomp` and `shop`.
- Produces:
  - the `'shop'` screen after the end card;
  - `window.__openCase.gear` and `.shop` (with any debug option);
  - `?coins=N`.

- [ ] **Step 1: Add the end card's savings line and shop button**

In `open-case/index.html`:

```html
    <p id="end-coins"></p>
    <p id="end-stopped"></p>
    <p id="end-longest"></p>
    <div class="row"><button id="again" type="button">Another set</button><button id="stop" type="button">Stop here</button></div>
```
becomes
```html
    <p id="end-coins"></p>
    <p id="end-saved"></p>
    <p id="end-stopped"></p>
    <p id="end-longest"></p>
    <div class="row"><button id="again" type="button">Another set</button><button id="shop" type="button">Visit the shop</button><button id="stop" type="button">Stop here</button></div>
```

- [ ] **Step 2: Wire it up**

Replace `open-case/src/main.js` with:

```js
// Start-up, the loop, and the wiring between the keys, the sound, the set and the screen.
//
// The audio clock is the master. Your first note starts the set (and the band) at that note's audio
// time; each frame, the set steps at a fixed 60 Hz up to the audio clock's time since then. Paused,
// the audio is suspended, so the set's clock stops with it. Notes reach the set the moment they're
// played, timed in seconds since the first note.
//
// Between sets, the end card leads to the music shop: your coins are saved, and your gear (gear.js)
// changes how your notes sound, in the park and while you try things in the shop.
//
// URL options: ?sound (the sound check); ?debug (interest bars, the corner panel, and Run the bots on
// the end card); ?seed=N (fixes the passers-by, and the park's windows, train and birds); ?bot=random or
// ?bot=lick (the bot plays the set, audibly); ?sky=N (the park as it is N bars into a set, until a set
// starts); ?coins=N (your savings are N on this page, and nothing bought on it is kept). With any of
// them, window.__openCase exposes the game for browser checks.
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { layoutPitches, shopKey } from './keys.js';
import { createSet, stepSet, playNote, releaseNote, summary, runSet, momentsOf } from './set.js';
import { crowdSize } from './crowd.js';
import { createScene, createFlocks, sceneNote, sceneEvents, stepScene, FLIGHT } from './scene.js';
import { createRenderer, W, H } from './render.js';
import { randomBot, lickBot } from './bots.js';
import { safeStorage } from './storage.js';
import { readLog, logSet, logChoice, readBuys, logBuy } from './log.js';
import { soundCheck } from './soundcheck.js';
import { loadArt } from './assets.js';
import { PEDALS, loadGear, saveGear, earn, buy, play, stomp, stockItem } from './gear.js';
import { createShop, move, action, trying, hit } from './shop.js';
import { BAR } from './groove.js';
import { DT, LAYERS } from './tuning.js';

// The module is running, so the page's "couldn't start" message will never be needed.
document.getElementById('nostart')?.remove();

// Browsers don't treat these as user activation (Chrome doesn't for a lone modifier, no browser does
// for Esc), so starting an AudioContext from one leaves it suspended.
const NON_ACTIVATING_KEYS = new Set(['Escape', 'Shift', 'Control', 'Alt', 'Meta', 'CapsLock']);

const params = new URLSearchParams(location.search);
const debug = params.has('debug');
const bot = { random: randomBot, lick: lickBot }[params.get('bot')] ?? null;
const fixedSeed = params.has('seed') ? Number.parseInt(params.get('seed'), 10) || 1 : null;
const skyBar = params.has('sky') ? Math.max(0, Number.parseFloat(params.get('sky')) || 0) : 0;
const debugSavings = params.has('coins') ? Math.max(0, Number.parseInt(params.get('coins'), 10) || 0) : null;
const anyDebug = debug || !!bot || fixedSeed !== null || params.has('sound') || params.has('sky') || debugSavings !== null;

const storage = safeStorage();
const audio = createAudio(storage);
const touchOnly = matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches;

if (touchOnly) document.getElementById('phone').hidden = false;
else if (params.has('sound')) soundCheck(audio, { debug: anyDebug });
else {
  // The art loads before the title card shows; if it can't, or the game can't start, say something
  // went wrong.
  loadArt().then(game).catch((err) => {
    console.error(err);
    document.getElementById('message').hidden = false;
  });
}

function game(art) {
  const canvas = document.getElementById('game');
  const out = canvas.getContext('2d', { alpha: false });
  const off = document.createElement('canvas');
  off.width = W;
  off.height = H;
  const draw = createRenderer(off.getContext('2d'), art);
  const end = document.getElementById('end');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const pageSeed = fixedSeed ?? Date.now() % 2147483647;
  const flocks = createFlocks(pageSeed);
  const t0 = performance.now();
  const pageTime = () => (performance.now() - t0) / 1000; // seconds since the page opened

  let screen = 'title'; // 'ready' (waiting for your first note), 'playing', 'paused', 'over', 'shop', 'thanks'
  let set = null, scene = createScene(pageSeed), start = 0, seed = 0;
  let botMoments = null, botNext = 0, botFed = 0;
  const latency = { reported: null, measured: null };
  // Your savings and gear. With ?coins=N your savings are N, and nothing is kept.
  const gear = loadGear(storage);
  if (debugSavings !== null) gear.savings = debugSavings;
  const keep = () => debugSavings === null && saveGear(storage, gear);
  let shop = null; // the shop's state (shop.js) while you're in it
  let stomped = null; // the last pedal stomped: { id, on, time } (its name shows over the gear strip)
  let setPedals = new Set(); // every pedal that's been on during this set, for the log

  function fit() {
    const dpr = devicePixelRatio || 1;
    const scale = Math.max(1, Math.floor(Math.min((innerWidth * dpr) / W, (innerHeight * dpr) / H)));
    canvas.width = W * scale;
    canvas.height = H * scale;
    canvas.style.width = `${(W * scale) / dpr}px`;
    canvas.style.height = `${(H * scale) / dpr}px`;
    out.imageSmoothingEnabled = false;
  }
  fit();
  addEventListener('resize', fit);

  // A new set begins with a note at audio time `at` (your first note, or the bot's start).
  function begin(at) {
    seed = fixedSeed ?? Date.now() % 2147483647;
    set = createSet(seed);
    scene = createScene(seed);
    start = at;
    audio.startBand(at);
    for (const { id, min } of LAYERS) audio.setLayer(id, min === 0, at);
    setPedals = new Set(gear.on);
    screen = 'playing';
  }

  // Your notes play through your gear, or in the shop, through what you're trying.
  function sound() {
    const setup = shop ? trying(shop, gear) : gear;
    if (audio.setInstrument(setup.instrument)) warmLayout();
    for (const id of PEDALS) audio.setPedal(id, setup.on.includes(id));
  }

  function startBot() {
    begin(audio.now() + 0.15);
    botMoments = momentsOf(bot(seed));
    botNext = 0;
    botFed = 0;
  }

  // The bot's notes: sounds scheduled a moment ahead, and fed to the set as its clock reaches them.
  function feedBot() {
    const ahead = audio.now() + 0.2;
    for (; botNext < botMoments.length && start + botMoments[botNext].t < ahead; botNext++) {
      const m = botMoments[botNext];
      if (m.note) {
        const code = `bot${botNext}`;
        audio.noteOn(code, m.note.pitch, m.note.strength, start + m.t, false);
        audio.noteOff(code, start + m.t + m.note.len);
      }
    }
    for (; botFed < botMoments.length && botMoments[botFed].t <= set.t + DT; botFed++) {
      const m = botMoments[botFed];
      if (m.note) {
        playNote(set, m.note.pitch, m.note.strength, m.t);
        if (set.phase === 'playing') sceneNote(scene, m.note.pitch, set.listen.notes.length - 1, m.t, m.note.strength);
      } else releaseNote(set, m.t);
    }
  }

  // Works out the sounds of every key in the current layout, a few at a time between frames, so a key
  // press never waits for its note's samples.
  let warming = [];
  function warmLayout() {
    const fresh = warming.length === 0;
    warming = layoutPitches(input.keys);
    if (!fresh) return;
    const chunk = () => {
      audio.warm(warming.splice(0, 3), input.keys.strength);
      if (warming.length) setTimeout(chunk, 0);
    };
    setTimeout(chunk, 0);
  }

  // Esc pauses the set and the music, and Esc again plays on. The pause card has the volume and mute.
  const pauseCard = document.getElementById('pause');
  const volume = document.getElementById('volume'), mute = document.getElementById('mute');
  volume.value = String(Math.round(audio.volume * 100));
  volume.addEventListener('input', () => audio.setVolume(Number(volume.value) / 100));
  mute.addEventListener('change', () => {
    if (mute.checked !== audio.muted) audio.toggleMute();
  });
  function pause(on) {
    if (on && screen === 'playing') {
      screen = 'paused';
      input.releaseAll();
      audio.suspend();
      mute.checked = audio.muted;
      pauseCard.hidden = false;
    } else if (!on && screen === 'paused') {
      screen = 'playing';
      pauseCard.hidden = true;
      audio.resume();
    }
  }

  // Any key at all dismisses the title card and starts the sound (browsers only allow sound after a
  // key press or a click). It's heard before the keys are read, and it plays no note. Esc and a lone
  // modifier don't count as user activation in every browser, so an AudioContext started from one
  // would stay suspended: leave them alone, doing nothing, on the title card.
  addEventListener('keydown', (e) => {
    if (screen !== 'title' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (NON_ACTIVATING_KEYS.has(e.key)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    audio.start();
    warmLayout();
    if (bot) startBot();
    else screen = 'ready';
  });

  const input = createInput(window, {
    now: audio.now,
    gate: (e) => {
      if (screen === 'paused') return e.code === 'Escape' || e.code === 'KeyM';
      if (screen !== 'ready' && screen !== 'playing' && screen !== 'shop') return false;
      if (bot) return e.code === 'Escape' || e.code === 'KeyM';
      return true;
    },
    onNote: (n) => {
      if (screen === 'ready') begin(n.at);
      audio.noteOn(n.code, n.pitch, n.strength, n.at, n.legato);
      // A strummed note's `at` is deliberately later than now (the strum gap); only notes that sound
      // at once tell us the true key-to-sound latency.
      if (n.at <= audio.now()) {
        const heard = audio.heardAt(n.at);
        if (heard !== null) latency.measured = heard - n.timeStamp;
      }
      if (set?.phase === 'playing') {
        playNote(set, n.pitch, n.strength, n.at - start);
        sceneNote(scene, n.pitch, set.listen.notes.length - 1, n.at - start, n.strength);
      }
    },
    onRelease: (r) => {
      audio.noteOff(r.code, r.at);
      if (set) releaseNote(set, r.at - start);
    },
    onControl: (action, down) => {
      if (action === 'ring') audio.setRing(down);
      else if (action === 'mute') {
        audio.toggleMute();
        mute.checked = audio.muted;
      } else if (action === 'pause') {
        if (screen === 'shop') leaveShop();
        else pause(screen !== 'paused');
      } else warmLayout(); // octave, strength or scale lock changed
    },
    onPedal: (id) => {
      const on = stomp(gear, id);
      if (on === null) return; // not yours yet: its key does nothing
      keep();
      if (on && set?.phase === 'playing') setPedals.add(id);
      stomped = { id, on, time: pageTime() };
      sound();
    },
  });
  sound();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause(true);
  });

  function handle(events) {
    for (const e of events) {
      if (e.type === 'layers') for (const { id } of LAYERS) audio.setLayer(id, e.layers[id], start + e.bar * BAR);
      else if (e.type === 'coin') audio.coin(start + set.t + FLIGHT);
      else if (e.type === 'end') {
        audio.endBand(start + set.t);
        const crowd = crowdSize(set.crowd);
        if (crowd > 0) audio.clap(crowd, start + set.t + BAR * 0.5);
      } else if (e.type === 'over') showEnd();
    }
    sceneEvents(scene, events, set.t);
  }

  function showEnd() {
    screen = 'over';
    const s = summary(set);
    // The log and the savings are Nathan's own, so a bot set (?bot=…) touches neither.
    if (!bot) {
      earn(gear, s.coins);
      keep();
      const pedals = PEDALS.filter((id) => setPedals.has(id));
      logSet(storage, { date: new Date().toISOString(), coins: s.coins, stopped: s.stopped, instrument: gear.instrument, pedals });
    }
    document.getElementById('end-coins').textContent = `${s.coins} coin${s.coins === 1 ? '' : 's'} in the case.`;
    document.getElementById('end-saved').textContent = `Saved: ${gear.savings} coin${gear.savings === 1 ? '' : 's'}.`;
    document.getElementById('end-saved').hidden = !!bot;
    document.getElementById('shop').hidden = !!bot;
    document.getElementById('end-stopped').textContent = `${s.stopped} ${s.stopped === 1 ? 'person' : 'people'} stopped to listen.`;
    const names = { jogger: 'A jogger', oldman: 'An old man', student: 'A student', commuter: 'A commuter' };
    document.getElementById('end-longest').textContent = s.longest
      ? `${names[s.longest.kind]} stayed longest: ${Math.round(s.longest.seconds)} seconds.`
      : 'Nobody stayed this time.';
    document.getElementById('end-debug').hidden = !debug;
    document.getElementById('bots-result').textContent = '';
    if (debug) showLog();
    end.hidden = false;
    document.getElementById('again').focus();
  }

  // The test log, newest first: the sets, and what was bought.
  function showLog() {
    const sets = readLog(storage).map((e) => ({
      date: e.date,
      text: `${e.coins} coins, ${e.stopped} stopped, ${[e.instrument ?? 'acoustic', ...(e.pedals ?? [])].join(' + ')}, ${e.choice ?? 'no choice yet'}`,
    }));
    const buys = readBuys(storage).map((e) => ({ date: e.date, text: `bought the ${stockItem(e.id)?.name.toLowerCase() ?? e.id} for ${e.price}` }));
    document.getElementById('log').replaceChildren(...[...sets, ...buys].sort((a, b) => b.date.localeCompare(a.date)).map((e) => {
      const li = document.createElement('li');
      li.textContent = `${e.date.slice(0, 16).replace('T', ' ')}: ${e.text}`;
      return li;
    }));
  }

  document.getElementById('again').addEventListener('click', () => {
    if (!bot) logChoice(storage, 'another');
    end.hidden = true;
    audio.stopBand();
    set = null;
    scene = createScene(pageSeed);
    if (bot) startBot();
    else screen = 'ready';
  });
  document.getElementById('stop').addEventListener('click', () => {
    if (!bot) logChoice(storage, 'stop');
    end.hidden = true;
    audio.stopBand();
    screen = 'thanks';
    document.getElementById('thanks').hidden = false;
  });
  document.getElementById('shop').addEventListener('click', () => {
    logChoice(storage, 'shop');
    end.hidden = true;
    audio.stopBand();
    set = null;
    scene = createScene(pageSeed);
    shop = createShop();
    screen = 'shop';
    sound();
  });

  // The shop: the arrow keys choose, Enter buys (or plays an instrument you own), Esc or the door
  // leaves for the park, ready for the next set.
  function leaveShop() {
    shop = null;
    screen = 'ready';
    canvas.style.cursor = '';
    sound();
  }
  function shopDo(what) {
    if (what === 'left' || what === 'right') move(shop, what === 'left' ? -1 : 1);
    else if (what === 'enter') {
      const act = action(shop, gear);
      if (act?.act === 'buy' && buy(gear, act.id)) {
        if (debugSavings === null) logBuy(storage, { date: new Date().toISOString(), id: act.id, price: stockItem(act.id).price });
        shop.soldAt = pageTime();
        audio.coin();
      } else if (act?.act === 'play') play(gear, act.id);
      keep();
    }
    sound();
  }
  addEventListener('keydown', (e) => {
    if (screen !== 'shop' || e.metaKey || e.ctrlKey || e.altKey) return;
    const what = shopKey(e.code, e.repeat);
    if (what === undefined) return;
    e.preventDefault();
    if (what) shopDo(what);
  });
  // A click in the shop, in scene pixels: an item chooses it, the card's button presses Enter, and the
  // door leaves.
  const inShop = (e) => {
    const r = canvas.getBoundingClientRect();
    return screen === 'shop' ? hit(art.data.shop, shop, gear, ((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H) : null;
  };
  canvas.addEventListener('click', (e) => {
    const target = inShop(e);
    if (target?.hit === 'item') {
      shop.at = target.at;
      sound();
    } else if (target?.hit === 'button') shopDo('enter');
    else if (target?.hit === 'door') leaveShop();
  });
  canvas.addEventListener('mousemove', (e) => {
    canvas.style.cursor = inShop(e) ? 'pointer' : '';
  });

  document.getElementById('bots').addEventListener('click', () => {
    const r = runSet(seed, randomBot(seed)).coins, l = runSet(seed, lickBot(seed)).coins;
    document.getElementById('bots-result').textContent = `Random bot: ${r}. Lick bot: ${l}. You: ${set.coins}.`;
  });

  if (anyDebug) {
    window.__openCase = {
      get screen() { return screen; },
      get set() { return set; },
      get scene() { return scene; },
      get shop() { return shop; },
      audio, input, latency, art, flocks, gear,
    };
  }

  const frame = (now) => {
    try {
      if (set && screen === 'playing') {
        if (bot) feedBot();
        const target = audio.now() - start;
        for (let n = 0; n < 30 && set.t + DT <= target && set.phase !== 'over'; n++) {
          stepSet(set, DT);
          handle(set.events);
          if (bot) feedBot();
        }
        stepScene(scene, set.t);
      }
      audio.update();
      latency.reported = audio.reportedLatency();
      draw({
        screen: screen === 'thanks' || screen === 'over' ? 'playing' : screen,
        set, scene, keys: input.keys, t: set ? set.t : 0, bars: set ? set.t / BAR : skyBar,
        time: (now - t0) / 1000, still: reducedMotion.matches, flocks, gear, stomp: stomped, shop,
        debug: debug ? latency : null,
      });
      out.drawImage(off, 0, 0, canvas.width, canvas.height);
    } catch (err) {
      console.error(err);
      document.getElementById('message').hidden = false;
      return;
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
```

- [ ] **Step 3: Run the tests**

Run: `cd open-case && npm test`
Expected: PASS, 165 tests. The page test checks that every `getElementById` in the scripts, `end-saved` and `shop` included, is on the page.

- [ ] **Step 4: Play it in a browser**

Serve the repo root (`python3 -m http.server 8000`) and open `http://localhost:8000/open-case/?coins=500&seed=3`.
1. Press a key, play a note, and in the devtools console end the set early:

   ```js
   const s = __openCase.set; s.coins = 42; s.phase = 'ending'; s.overAt = s.t + 0.2;
   ```

   The end card says "42 coins in the case." and "Saved: 542 coins.", with Visit the shop.
2. Visit the shop. Check:
   - the arrow keys move the pointer round the stock;
   - Enter buys the delay (the chalkboard shows 472), and holding Enter doesn't buy again;
   - clicking an instrument tries it;
   - Esc goes back to the park, where the strip shows the delay on key 5 and 5 stomps it.

- [ ] **Step 5: Commit**

```bash
git add open-case/src/main.js open-case/index.html
git commit -m "Open Case: coins are saved after each set, the end card leads to the music shop, and you try and buy gear there and stomp your pedals in the park

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Say what's built, and check it in Chrome

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-09-28-open-case-design.md`, `docs/superpowers/specs/2026-09-28-open-case-shop-design.md`

- [ ] **Step 1: The README**

In `README.md`'s Open Case section, make these edits.

The intro's last sentence:

```markdown
The band gains layers as the crowd grows. The design spec is `docs/superpowers/specs/2026-09-28-open-case-design.md`.
```
becomes
```markdown
The band gains layers as the crowd grows. The coins you earn are saved, and between sets a music shop sells five pedals, which you stomp on keys 2 to 6 while you play, and four more instruments. The design spec is `docs/superpowers/specs/2026-09-28-open-case-design.md`, and the shop's is `docs/superpowers/specs/2026-09-28-open-case-shop-design.md`.
```

The sound check's line:

```markdown
  - `?sound` is the sound check: the loop with a switch per layer, and the guitar on the keys.
```
becomes
```markdown
  - `?sound` is the sound check: the loop with a switch per layer, your instrument on the keys, and every instrument and pedal in the shop to try.
```

After the `?sky=N` line, add:

```markdown
  - `?coins=N` sets your savings to N on that page, to try the shop. Nothing bought on it is kept.
```

The tuning line:

```markdown
- Tuning: the rules, the crowd, the tips and the feel are in `open-case/src/tuning.js`, and so are the park's sunset and background timings (`PARK`); the synth's voicing is in `open-case/src/audio.js`, and a few view timings are in `scene.js` and `render.js`.
```
becomes
```markdown
- Tuning: the rules, the crowd, the tips and the feel are in `open-case/src/tuning.js`, and so are the park's sunset and background timings (`PARK`) and the shop's prices and pedal keys (`SHOP`). The sounds (the band, each instrument and each pedal) are in `open-case/src/audio.js`, and a few view timings are in `scene.js` and `render.js`.
```

In the art line:

```markdown
`art/open-case/sprites.lua` writes both from the shared drawing code: `draw.lua` (the park, you and your things) and `figures.lua` (the passers-by, their reactions, the pigeons and the birds).
```
becomes
```markdown
`art/open-case/sprites.lua` writes both from the shared drawing code: `draw.lua` (the park, you and your things), `figures.lua` (the passers-by, their reactions, the pigeons and the birds), `gear.lua` (you with each instrument, your pedals, the amp and the gear strip's icons) and `shop.lua` (the music shop).
```

- [ ] **Step 2: The specs**

In `docs/superpowers/specs/2026-09-28-open-case-design.md`, after the line that begins `**Update (2026-09-28):** the flat-style repaint is built`, add a blank line and:

```markdown
**Update (2026-09-28):** the music shop is built; see `2026-09-28-open-case-shop-design.md`. Your coins are saved between sets and spent on pedals and instruments.
```

In `docs/superpowers/specs/2026-09-28-open-case-shop-design.md`, the status line becomes:

```markdown
**Status:** Nathan agreed the design in chat ("perfect", "yup looks good!") and approved this written spec ("go ahead and continue with subagents.. i trust your judgement"). Built from `docs/superpowers/plans/2026-09-28-open-case-shop.md`.
```

and before `## Not in this change`, add:

```markdown
## What the build settled

The plan's prototype settled a few things this spec left open:
- **Your acoustic guitar stands in the shop too.** It isn't for sale, but choosing it is how you go back to it. So the shop shows ten things; the arrow keys run along the rack, then along the floor.
- **The chosen item** lifts two pixels, lights up a shade, and has a small gold pointer over it. A pedal's light on the rack is lit while you can hear it.
- **The card has a fourth line**, "arrows choose   esc back to the park".
- **Your pedals by the crate** are a row of little stompboxes in front of it, between the looper and the case. The amp stands to the left of the crate, behind the looper.
- **The keyboards** stand on an X over your lap as you sit on the crate. Your hands press on the keys, the left, both, then the right.
- **The gear strip** gives each pedal its own place, whatever else you own, between "lock" and the pigeons. A pedal that's off shows in its darker shade.
- **The title card** has a line for the pedal keys: "2-6 your pedals (from the shop)".
- **The sounds were measured and evened out.** At a medium pick, each instrument's first moments are about as loud as the acoustic's; the synth, which holds its notes, sits a little under. Switching on the overdrive, the chorus or the tremolo doesn't change how loud you are: the tremolo swings either side of your level. The delay and the reverb let their echoes die away when you switch them off.
- **The sound check** (`?sound`) has a menu of the instruments and a switch for each pedal, so every sound can be judged by ear with the band.
- **`?coins=N` keeps nothing:** what you buy on that page isn't saved or logged.
- **Bots play with your gear but can't change it.** Their end card has no savings line and no shop button.
- **A held Enter buys once;** held arrows move along the stock.
```

- [ ] **Step 3: Commit**

```bash
git add README.md docs/superpowers/specs/2026-09-28-open-case-design.md docs/superpowers/specs/2026-09-28-open-case-shop-design.md
git commit -m "Open Case: the README and specs say the music shop is built, and what the build settled

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 4 (controller): Check it in Chrome**

After the final review, serve the repo root and check it by eye and ear in Chrome.

The flow, at `open-case/?coins=500&seed=3`:
- the end card's savings line and Visit the shop;
- the shop's look, the card's words for affordable, unaffordable, owned and playing items, and buying and trying;
- clicking an item, the button and the door, with the pointer cursor over each;
- the park with each instrument, the pedals by the crate and the gear strip with its popup;
- the title's pedal line.

What's kept:
- After buying on a `?coins` page, `localStorage.getItem('open-case-gear')` and `localStorage.getItem('open-case-buys')` are still `null`.
- With `?bot=lick&seed=3`, the end card has no savings line and no shop button, and `open-case-savings` doesn't change.

The sound, at `open-case/?sound`: each instrument and each pedal is heard over the band.

A hard strum with every pedal on, measured offline in the page's console:

```js
const { createAudio } = await import('./src/audio.js');
let ctx; globalThis.AudioContext = function () { ctx = new OfflineAudioContext(2, 48000 * 5, 48000); return ctx; };
const m = new Map(), audio = createAudio({ get: (k) => m.get(k) ?? null, set: (k, v) => m.set(k, String(v)) });
audio.setInstrument('electric');
for (const p of ['overdrive', 'chorus', 'tremolo', 'delay', 'reverb']) audio.setPedal(p, true);
audio.start();
[60, 64, 67].forEach((p, i) => { audio.noteOn('k' + i, p, 4, 0.1 + i * 0.012, false); audio.noteOff('k' + i, 1.5); });
const b = await ctx.startRendering();
let peak = 0; for (const c of [0, 1]) for (const v of b.getChannelData(c)) peak = Math.max(peak, Math.abs(v));
20 * Math.log10(peak); // the prototype: -10.4 dB; anything under -6 dB is fine
```

Nathan's ear has the final say on every sound.
