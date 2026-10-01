# Open Case: Places to Busk Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Open Case gets three places to busk, the park, the station at rush hour and the night market, each with its own crowd and scene. Before each set, a painted map of the city asks where to busk and what track to play.

**Architecture:**
- **Each place's crowd is data** (`tuning.js` `PLACES`), and the crowd reads it: which kinds come, how they arrive (a station's waves off its trains), their pace, patience and stays, and the tips. With the park's numbers, every set plays exactly as today.
- **Each place's scene** has its own life in `scene.js` (pure: the station's clock, trains and board; the market's lanterns, steam and cat) and its own art in the sprite sheet (`station.lua`, `market.lua`), drawn by `render.js`.
- **The map** has three parts:
  - **Its art:** painted by Python scripts (`art/open-case/map/`) in the reference's richer look, written to `open-case/assets/map/`.
  - **Its workings:** `atlas.js`, pure.
  - **Its view:** `atlasview.js`, page elements over the canvas, like the end card.
- **`main.js`** opens on the map after the title card and comes back to it between sets.

**Tech Stack:** Plain ES modules, Canvas 2D, Web Audio, page elements for the map, Node 22 `node --test` (no dependencies), Aseprite 1.3 in batch mode for the sprite sheet (Lua), Python 3 with Pillow for the map's art.

**Spec:** `docs/superpowers/specs/2026-10-01-open-case-places-design.md`.
- Nathan agreed the design in chat and on a mockup page, and asked for this plan ("go ahead and write the plan and then pause").
- It builds on the studio's spec (`2026-09-30-open-case-studio-design.md`), the passers-by's (`2026-09-29-open-case-passers-by-design.md`), the art's (`2026-09-28-open-case-art-design.md`) and the game's (`2026-09-28-open-case-design.md`).

**Prototyped:** everything below was built and run before this plan was written, in a scratch copy of the repo, one commit per task.
- Each task's end state passes the whole suite: 352 tests before, then 362, 371, 372, 376, 380, 387, 389 and 390 after the tasks.
- The sprite sheet (583 frames, 55 colours) and the map's art rebuild byte for byte.

Checked by eye in Chrome:
- the map's three places, with the panel open and shut;
- a set at the station, its train in with its doors open and a wave of three passengers coming along the platform ("bar 7/100" on the bossa nova);
- the market waiting for its first note (the lanterns dark, the cat asleep);
- Another set and the shop's Esc both back to the map;
- the studio's Busk to this going straight to the place;
- the place and the track remembered over a reload.

The code in each task is that prototype's code, so transcribe it exactly.

## How to put the code in

- **A new file** is shown whole, under "Create `path`". Write it exactly as shown.
- **A changed file** is shown as a patch (a `diff` block) against the previous task's end state. Write the block to a file exactly as it is, then run `git apply --verbose <that file>` from the repo root.
- **Extract long blocks with a small script** rather than retyping them (python3 or awk, copying the lines between the fences verbatim). The code blocks here are fenced with four backticks.
- If a patch doesn't apply, stop and report it; don't hand-edit around it.
- **Images** (the sprite sheet, the map's pictures) are never in the plan: a step runs the script that draws them.

## Global Constraints

- Every commit message starts `Open Case: ` and ends with a blank line and then `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`, exactly that line, whatever model you are.
- Stage only the files your task names (`git add <paths>`), never `git add -A` or `git add .`.
- No new dependencies for the game: plain ES modules, Node 22's `node --test`. Run the tests with `cd open-case && npm test`.
- Aseprite runs from the repo root: `/Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/sprites.lua`. It's deterministic, so a second run leaves `git status` unchanged.
- **The map's scripts** run from the repo root with Python 3 and Pillow (`python3 -c "import PIL"` must work; the prototype used Pillow 12.3): `python3 art/open-case/map/land.py && python3 art/open-case/map/places.py`.
  - They're deterministic and write only `open-case/assets/map/`.
  - They write no `__pycache__`.
  - `land.py` takes about 40 seconds.
- **The sprite sheet** stays in the flat style (every area one solid colour from `art/open-case/palette.lua`, no outlines, no dithering), within **64 colours** and **under 400 KB**. The map is painted in its own richer colours, all of it **under 500 KB**.
- **The park plays as today:** with its numbers, every set, bot score and test comes out exactly as before. What each kind of person likes never changes; a place sets only who comes, how, for how long, and the tips.
- **Different, not better:** over seeds 1–10, an honest set earns within 20% of the park's at each place, and random playing earns almost nothing anywhere.
- **The same layout everywhere:** you, the case, the path at y 146 and the listeners' arc are where they are in the park; only the picture round them changes.
- **The five ready-made tracks are free;** the studio (still 150 coins) is for making your own, which join the map's list.
- **Pages that keep nothing** (`?coins=`, `?studio`) don't keep the place either; `?place=` fixes the place for the page and isn't kept.
- Plain words in comments and messages, in the style of the surrounding code; comment lines wrap at about 100 characters.

## Review Focus

The cases most likely to go wrong that the spec implies. Each is pinned by a test or a check in the task named.
- **A train pulling in while the platform's full.** Its passengers wait a few seconds for room, then go another way. None squeeze in, and they never all arrive at once later. (Task 1: "a train's passengers who find the platform full wait a few seconds, then go another way, never all at once later".)
- **A remembered place or track that's no longer there:** a beat cleared from its slot, the studio's beats on a page without it, or something unreadable in storage. The map falls back to the park and the first track. (Task 1: "the place chosen is kept, and a missing or unknown one is the park". Task 6: "the map opens on the place and the track chosen last time, or the park and the first track".)
- **A loud note while the cat strolls back.** It runs off from where it is, not from home. (Task 2: "woken again while strolling back, the cat runs off from where it is, not from home".)
- **The map's words in Pixelify Sans.**
  - Its "fi" ligature reads as "A", so ligatures are turned off.
  - Its small "C" reads as a 0, so the tempo and key are in Silkscreen.
  - (Task 7's styles; Task 8's Chrome check, where "Lo-fi" and "C major" must read right.)
- **Going straight to a place,** after Busk to this or with `?beat=`, and leaving the map while a track plays softly. The panel is skipped, and the preview stops before the set's band starts. (Task 6: "after the studio's Busk to this, Enter on a place goes straight there". Task 8's Chrome check.)

## Settled in the prototype

The spec left these open, or the prototype changed them. The spec's "What the build settled" (Task 8) records them for Nathan.
- **The station's trains** come every 32–38 s, with someone every 16–22 s between them (the spec's table started at 28–34 and 14–20). Over seeds 1–10:

  | | Honest set | Random notes | Lick bot |
  |---|---|---|---|
  | Park | 629 | 5 | 0 |
  | Station | 722 (+15%) | 11 | 0 |
  | Market | 674 (+7%) | 7 | 0 |

- **The trains come from the crowd:** `createCrowd` works out a station's timetable from its own seeded stream (so the crowd's draws don't move), and the scene reads `set.crowd.trains`. A train stands with its doors open as its passengers step off.
- **The station's timing:** a train takes 3 s to pull in, stands 8 s, takes 4 s to pull out. A passenger who can't get on screen waits up to 4 s (`WAVE_LATE`).
- **The market's timing:**
  - its sky runs two stages behind the park's;
  - its lanterns light one by one from bar 2 to bar 40;
  - the steam's two frames show half a second each;
  - the cat runs off in 1.5 s and strolls back over 4 s, 4 bars later, as the pigeons do.
- **On the map:**
  - left and right go round, from the market back to the park;
  - Space works as Enter;
  - the view glides to a place (about 6 times its distance a second, eased);
  - the clouds drift at 6 map pixels a second;
  - the pin bobs 2 pixels.
- **The preview** on the map plays every part of the track softly (`audio.previewBand`, level 0.3), where the shop's try plays only the chords.
- **`?place=`** skips the map: every set on that page is at that place.
- **`studio.js` needs no change** (the spec expected one): its `chosenBeat` already plays a ready-made track without the studio, and the map sets `beats.chosen` itself (Task 8).
- **The flow is checked in Chrome,** not in Node. `main.js` has no Node tests, as before, so the map's moves are pinned in `atlas.test.js` (Task 6), and the order of the screens is pinned by Task 8's Chrome check.
- **Dark backings:** behind the bottom line's words and the gear strip (leaving the pigeons and the cat beside them clear), and behind the waiting prompt, so it reads over the station's lamps and the market's lanterns.
- **The shop** says "back to the map" on its sign and its card.
- **The art:**
  - six colours join the palette (`stone` and `brick`, three each), making 55;
  - the sheet has 583 frames;
  - the map's files come to 445 KB, the land alone 313 KB.

## File map

| File | What it does |
|---|---|
| `open-case/src/places.js` (new) | The three places' names and words; the place chosen, kept in storage |
| `open-case/src/tuning.js` (edit) | `PLACES` (each place's crowd), `STATION` and `MARKET` (their scenes' timings) |
| `open-case/src/crowd.js`, `set.js` (edit) | A crowd and a set at a place: the place's kinds, arrivals, waves, pace, patience, stays and tips |
| `open-case/src/scene.js` (edit) | The station's clock, trains and board; the market's sky, lanterns, steam and cat |
| `art/open-case/station.lua`, `market.lua` (new), `palette.lua`, `sprites.lua` (edit) | The two scenes' art in the sheet, and their layout data |
| `open-case/src/render.js` (edit) | Draws each place; the dark backings; the shop's "back to the map" |
| `art/open-case/map/layout.py`, `land.py`, `places.py` (new) | The map's art: the land, the places, the city and the bridges, and `map.json` |
| `open-case/assets/map/` (new) | What the map's scripts write |
| `open-case/src/atlas.js` (new) | The map's workings: places, tracks, keys and clicks, the view |
| `open-case/src/atlasview.js` (new) | The map on screen, as page elements |
| `open-case/src/audio.js` (edit) | `previewBand`: a track softly, every part |
| `open-case/index.html` (edit) | The map's container, its styles and the Pixelify Sans font |
| `open-case/src/main.js` (edit) | The map before each set, the way back to it, `?place=` |
| `open-case/src/log.js` (edit) | The log notes each set's place |
| `open-case/test/*` | The tests for each of the above |
| `README.md`, the places spec | Say what's built |

---

### Task 1: Three places, each with its own crowd

**Files:**
- Create: `open-case/src/places.js`, `open-case/test/places.test.js`
- Modify: `open-case/src/tuning.js`, `open-case/src/crowd.js`, `open-case/src/set.js`
- Test: `open-case/test/crowd.test.js`, `open-case/test/bots.test.js`

**Interfaces:**
- Produces:
  - `PLACE_IDS` (`['park', 'station', 'market']`), `PLACE_WORDS` (`{ id: { name, at, crowd } }`), `isPlace(id)`, `loadPlace(storage)` (the kept place, or `'park'`), `savePlace(storage, id)`, under `open-case-place`;
  - `PLACES` in `tuning.js`: `{ id: { kinds: [jogger, elder, student, commuter weights], arrive: [from, to], waves: null | { first, every, people, gap }, onScreen, pace, patience, stay: [from, to], tips } }`;
  - `createCrowd(seed, place = 'park')`, giving `crowd.place` (its `PLACES` entry) and `crowd.trains` (`[{ t, people: [times] }]`, empty but at a station);
  - `createSet(seed, beat = LOFI, place = 'park')`, giving `set.place`; `runSet(seed, notes, beat = LOFI, place = 'park')`.

- [ ] **Step 1: Write the failing tests**

Create `open-case/test/places.test.js`:

````js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLACE_IDS, PLACE_WORDS, isPlace, loadPlace, savePlace } from '../src/places.js';
import { PLACES, CROWD, TIPS } from '../src/tuning.js';
import { safeStorage } from '../src/storage.js';

// A storage backed by a plain object, like the browser's localStorage.
function memory(start = {}) {
  const data = { ...start };
  return { data, store: safeStorage({ getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } }) };
}

test('three places, each with its words for the map, the prompt and the end card, and its crowd', () => {
  assert.deepEqual(PLACE_IDS, ['park', 'station', 'market']);
  for (const id of PLACE_IDS) {
    assert.ok(PLACE_WORDS[id].name && PLACE_WORDS[id].at && PLACE_WORDS[id].crowd, id);
    assert.ok(PLACES[id], id);
  }
  assert.equal(PLACE_WORDS.station.name, 'The Station');
  assert.equal(PLACE_WORDS.market.at, 'at the night market');
  assert.ok(isPlace('market') && !isPlace('pier') && !isPlace(null));
});

test("the park's crowd is the crowd's own numbers, so a set there plays as it always has", () => {
  const p = PLACES.park;
  assert.deepEqual(p.kinds, [1, 1, 1, 1]);
  assert.deepEqual(p.arrive, [CROWD.arriveMin, CROWD.arriveMax]);
  assert.deepEqual(p.stay, [CROWD.budgetMin, CROWD.budgetMax]);
  assert.equal(p.onScreen, CROWD.onScreen);
  assert.equal(p.waves, null);
  assert.equal(p.pace, 1);
  assert.equal(p.patience, 1);
  assert.equal(p.tips, TIPS);
});

test('the place chosen is kept, and a missing or unknown one is the park', () => {
  const { data, store } = memory();
  assert.equal(loadPlace(store), 'park');
  savePlace(store, 'station');
  assert.equal(data['open-case-place'], 'station');
  assert.equal(loadPlace(store), 'station');
  savePlace(store, 'pier');
  assert.equal(loadPlace(store), 'station', 'not a place: not kept');
  assert.equal(loadPlace(memory({ 'open-case-place': '{"x":1}' }).store), 'park');
  assert.equal(loadPlace(safeStorage(null)), 'park', 'no storage at all');
});
````

Apply to `open-case/test/crowd.test.js`:

````diff
diff --git a/open-case/test/crowd.test.js b/open-case/test/crowd.test.js
index 930de54..82353ea 100644
--- a/open-case/test/crowd.test.js
+++ b/open-case/test/crowd.test.js
@@ -1,14 +1,14 @@
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
 import { createCrowd, hear, crowdSize, endTips, dealLook, personName, KINDS, LOOKS } from '../src/crowd.js';
-import { CROWD, INTEREST, TIPS, DT } from '../src/tuning.js';
+import { CROWD, INTEREST, TIPS, DT, PLACES } from '../src/tuning.js';
 import { runCrowd, stoodAt } from './helpers.js';
 
 const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;
 
 // Everyone who came by in the first `seconds`, in order: kind, look, side, budget and arrival time.
-function arrivals(seed, seconds = 120, each) {
-  const c = createCrowd(seed), seen = new Map();
+function arrivals(seed, seconds = 120, each, place = 'park') {
+  const c = createCrowd(seed, place), seen = new Map();
   runCrowd(c, 0, seconds, (t) => {
     each?.(c, t);
     for (const p of c.people) if (!seen.has(p.id)) seen.set(p.id, { kind: p.kind, look: p.look, dir: p.dir, budget: p.budget, at: p.arrivedAt });
@@ -242,3 +242,104 @@ test('interest fades a little every second for everyone listening', () => {
   runCrowd(c, 0, 10);
   assert.ok(near(p.interest, 0.8, 0.001));
 });
+
+// Every place's arrivals over a long run, everyone walking straight through (nobody is listening).
+function placeArrivals(place, seeds = [1, 2, 3, 4, 5], seconds = 300) {
+  return seeds.flatMap((seed) => arrivals(seed, seconds, (c) => { for (const p of c.people) p.walkedOn = true; }, place));
+}
+
+test('each place draws its own kinds: no joggers at the station or the market, mostly commuters at the station', () => {
+  const share = (list, kind) => list.filter((p) => p.kind === kind).length / list.length;
+  const station = placeArrivals('station'), market = placeArrivals('market');
+  assert.equal(share(station, 'jogger'), 0);
+  assert.equal(share(market, 'jogger'), 0);
+  assert.ok(share(station, 'commuter') > 0.45, `commuters at the station: ${share(station, 'commuter')}`);
+  assert.ok(share(market, 'commuter') < 0.35, `commuters at the market: ${share(market, 'commuter')}`);
+  assert.ok(share(market, 'elder') + share(market, 'student') > 0.65);
+});
+
+test("the station's trains are the same from a seed, and bring their passengers in waves as the doors open", () => {
+  const w = PLACES.station.waves;
+  const a = createCrowd(3, 'station'), b = createCrowd(3, 'station');
+  assert.deepEqual(a.trains, b.trains);
+  assert.notDeepEqual(a.trains, createCrowd(4, 'station').trains);
+  assert.ok(a.trains[0].t >= w.first[0] && a.trains[0].t <= w.first[1]);
+  for (let i = 1; i < a.trains.length; i++) {
+    const gap = a.trains[i].t - a.trains[i - 1].t;
+    assert.ok(gap >= w.every[0] && gap <= w.every[1], `train gap ${gap}`);
+  }
+  for (const tr of a.trains) assert.ok(tr.people.length >= w.people[0] && tr.people.length <= w.people[1]);
+  assert.deepEqual(createCrowd(3, 'park').trains, [], 'no trains in the park');
+  // Most arrivals come within a few seconds of a train's doors opening.
+  for (const seed of [1, 2, 3, 4, 5]) {
+    const trains = createCrowd(seed, 'station').trains;
+    const list = arrivals(seed, 300, (c) => { for (const p of c.people) p.walkedOn = true; }, 'station');
+    const inWave = list.filter((p) => trains.some((tr) => p.at >= tr.t - DT && p.at <= tr.t + 6)).length;
+    assert.ok(inWave / list.length >= 0.6, `seed ${seed}: ${inWave} of ${list.length} came with a train`);
+  }
+});
+
+test("the market's browsers come steadily, one every 4 to 7 seconds while there's room", () => {
+  const list = arrivals(5, 120, (c) => { for (const p of c.people) p.walkedOn = true; }, 'market');
+  assert.ok(near(list[0].at, 2, DT * 1.5), 'the first comes 2 seconds in');
+  for (let i = 1; i < list.length; i++) {
+    const gap = list[i].at - list[i - 1].at;
+    assert.ok(gap >= 4 - DT, `gap ${gap}`);
+  }
+  assert.ok(list.length >= 120 / 7 - 2, `${list.length} came`);
+});
+
+test('a place sets how long listeners stay, how fast they walk and how long they listen before deciding', () => {
+  for (const place of ['station', 'market']) {
+    const P = PLACES[place];
+    for (const p of placeArrivals(place, [1, 2])) assert.ok(p.budget >= P.stay[0] && p.budget <= P.stay[1], `${place} ${p.budget}`);
+    // A commuter walking by, out of earshot: their pace is the place's share of a commuter's.
+    const c = createCrowd(1, place);
+    c.nextArrival = Infinity;
+    c.waveQueue = [];
+    const p = stoodAt(c, 'commuter', 0, { state: 'passing', x: -10, y: 146, interest: 0.3 });
+    hear(c, { rule: 'bar', count: 0, rest: 16, off: 0 }, 0);
+    const x0 = p.x;
+    runCrowd(c, 0, 0.5);
+    assert.ok(near(p.x - x0, CROWD.kinds.commuter.speed * P.pace * 0.5, 0.01), `${place}: walked ${p.x - x0}`);
+    // In earshot, a listener with nothing to like walks on after the place's share of their patience.
+    const d = createCrowd(1, place);
+    d.nextArrival = Infinity;
+    d.waveQueue = [];
+    const q = stoodAt(d, 'commuter', 0, { state: 'passing', x: CROWD.playerX, y: 146, interest: 0.4, dir: 0 });
+    q.walkedOn = false;
+    let left = null;
+    runCrowd(d, 0, 20, (t) => { if (left === null && q.walkedOn) left = t; });
+    const patience = CROWD.kinds.commuter.patience * P.patience;
+    assert.ok(left !== null && Math.abs(left - patience) <= 0.05, `${place}: walked on after ${left}, patience ${patience}`);
+  }
+});
+
+test("a place sets the tips: the station's happy listeners give more, the market's less, and the end of a set the same", () => {
+  for (const [place, happy] of [['park', TIPS.happy], ['station', PLACES.station.tips.happy], ['market', PLACES.market.tips.happy]]) {
+    const c = createCrowd(1, place);
+    stoodAt(c, 'student', 0, { budget: 0.01, interest: 0.9 });
+    runCrowd(c, 0, 0.05);
+    const coin = c.out.find((e) => e.type === 'coin');
+    assert.equal(coin.coins, happy, place);
+    const d = createCrowd(1, place);
+    stoodAt(d, 'student', 0);
+    endTips(d);
+    assert.equal(d.out[0].coins, 1, `${place}: one coin at the end`);
+  }
+  assert.ok(PLACES.station.tips.happy > TIPS.happy && PLACES.market.tips.happy < TIPS.happy);
+});
+
+test("a train's passengers who find the platform full wait a few seconds, then go another way, never all at once later", () => {
+  const c = createCrowd(2, 'station'), first = c.trains[0];
+  c.nextArrival = Infinity; // only the train's passengers
+  for (let i = 0; i < PLACES.station.onScreen; i++) stoodAt(c, 'commuter', i % 6, { budget: 999 });
+  const after = first.people.at(-1) + 5; // its last passenger has waited 5 seconds
+  runCrowd(c, 0, after);
+  assert.equal(c.people.length, PLACES.station.onScreen, 'nobody squeezed in');
+  assert.ok(!c.waveQueue.some((at) => first.people.includes(at)), "the first train's passengers have gone another way");
+  c.people.length = 0; // room again
+  const before = c.nextId;
+  runCrowd(c, after, 0.5);
+  assert.ok(c.nextId - before <= 1, `${c.nextId - before} arrived at once`);
+});
````

Apply to `open-case/test/bots.test.js`:

````diff
diff --git a/open-case/test/bots.test.js b/open-case/test/bots.test.js
index dd69e55..f5d9247 100644
--- a/open-case/test/bots.test.js
+++ b/open-case/test/bots.test.js
@@ -115,3 +115,15 @@ test("a bot plays over another beat in that beat's time: the bossa's 16ths, with
   }
   assert.ok(runSet(3, goodSet(3, bossa), bossa).phase === 'over');
 });
+
+test('every place pays an honest set about what the park does, within a fifth, and random playing almost nothing', () => {
+  const at = (bot, place) => SEEDS.map((seed) => runSet(seed, bot(seed), LOFI, place).coins);
+  const park = sum(at(goodSet, 'park'));
+  for (const place of ['station', 'market']) {
+    const good = at(goodSet, place), random = sum(at(randomBot, place)), lick = sum(at(lickBot, place));
+    assert.ok(Math.abs(sum(good) - park) <= park * 0.2, `${place}: honest ${sum(good)}, park ${park}`);
+    assert.ok(good.every((c) => c >= 1), `${place}: honest set ${good}`);
+    assert.ok(sum(good) >= 10 * random, `${place}: honest ${sum(good)}, random bot ${random}`);
+    assert.ok(sum(good) >= 10 * lick, `${place}: honest ${sum(good)}, lick bot ${lick}`);
+  }
+});
````

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL. Two files can't load:
- `test/places.test.js`: `Cannot find module '…/open-case/src/places.js'`;
- `test/crowd.test.js`: `tuning.js` has no `PLACES`.

The other 335 tests pass, the new balance test among them. Until a set takes a place, every place plays as the park, so it can't fail yet; it guards the balance from here on.

- [ ] **Step 3: The places and their crowds**

Create `open-case/src/places.js`:

````js
// The places to busk: the park, the station at rush hour and the night market. Each has its own crowd
// (tuning.js PLACES, which crowd.js reads) and its own scene (scene.js, render.js). The map (atlas.js)
// chooses one before each set, and the choice is kept for next time.
export const PLACE_IDS = ['park', 'station', 'market'];

// What the map, the prompt and the end card call each place, and the map's line about its crowd.
export const PLACE_WORDS = {
  park: { name: 'The Park', at: 'in the park', crowd: 'A bit of everyone · sunset' },
  station: { name: 'The Station', at: 'at the station', crowd: 'Rush hour · in a hurry, tips well' },
  market: { name: 'The Night Market', at: 'at the night market', crowd: 'Browsers stay long · small coins' },
};

const KEY = 'open-case-place';

export const isPlace = (id) => PLACE_IDS.includes(id);

// The place chosen last time (storage: storage.js), or the park if there's none or it isn't one.
export function loadPlace(storage) {
  const id = storage.get(KEY);
  return isPlace(id) ? id : 'park';
}

export function savePlace(storage, id) {
  if (isPlace(id)) storage.set(KEY, id);
}
````

Apply to `open-case/src/tuning.js`:

````diff
diff --git a/open-case/src/tuning.js b/open-case/src/tuning.js
index 4691e21..4d2dd7b 100644
--- a/open-case/src/tuning.js
+++ b/open-case/src/tuning.js
@@ -97,6 +97,33 @@ export const CROWD = {
 
 export const TIPS = { callback: 1, happy: 2, happyElder: 3, end: 1 };
 
+// The places to busk (places.js): who comes by at each, and how. What each kind of person likes is the
+// same everywhere (crowd.js). A place sets:
+//   kinds     how likely each kind is, in KINDS order (jogger, elder, student, commuter)
+//   arrive    seconds between one arrival and the next: from, to
+//   waves     null, or a station's trains: the first pulls in `first` seconds into the set and then one
+//             every `every`, and `people` step off each, `gap` seconds apart (each [from, to])
+//   onScreen  at most this many people at once
+//   pace, patience  shares of each kind's own walking speed and patience (crowd's kinds)
+//   stay      seconds a listener stays: from, to
+//   tips      as TIPS
+// The park's are CROWD's and TIPS's own, so a set there plays exactly as it always has.
+export const PLACES = {
+  park: {
+    kinds: [1, 1, 1, 1], arrive: [CROWD.arriveMin, CROWD.arriveMax], waves: null, onScreen: CROWD.onScreen,
+    pace: 1, patience: 1, stay: [CROWD.budgetMin, CROWD.budgetMax], tips: TIPS,
+  },
+  station: {
+    kinds: [0, 0.15, 0.25, 0.6], arrive: [16, 22], onScreen: 8, pace: 1.15, patience: 0.7, stay: [40, 100],
+    waves: { first: [6, 10], every: [32, 38], people: [3, 5], gap: [0.6, 1] },
+    tips: { callback: 1, happy: 3, happyElder: 4, end: 1 },
+  },
+  market: {
+    kinds: [0, 0.4, 0.4, 0.2], arrive: [4, 7], waves: null, onScreen: 6, pace: 0.7, patience: 1.5, stay: [90, 240],
+    tips: { callback: 1, happy: 1, happyElder: 2, end: 1 },
+  },
+};
+
 // The band's layers, and how many listeners each needs. A layer drops out only after the crowd has
 // stayed below its number for LAYER_HOLD whole bars.
 export const LAYERS = [
````

Apply to `open-case/src/crowd.js`:

````diff
diff --git a/open-case/src/crowd.js b/open-case/src/crowd.js
index 215edf1..d01f26b 100644
--- a/open-case/src/crowd.js
+++ b/open-case/src/crowd.js
@@ -7,16 +7,39 @@
 //   reaction: { rule, t } | null, done }
 // state: 'passing' (walking by, maybe listening), 'joining' (hooked, walking to a spot), 'stopped',
 // 'leaving'. The crowd is everyone joining or stopped.
-import { CROWD, INTEREST, TIPS, RULES } from './tuning.js';
+import { CROWD, INTEREST, RULES, PLACES } from './tuning.js';
 import { createRng, nextRandom, randomBetween } from './rng.js';
 
 export const KINDS = ['jogger', 'elder', 'student', 'commuter'];
 export const LOOKS = 6; // each kind's people, three women and three men (art/open-case/figures.lua)
 const LOOK_SEED = 0x9e3779b9; // mixed into the set's seed for the looks' own stream
+const WAVE_SEED = 0x2545f491; // and for a station's trains
+const WAVE_HORIZON = 600; // seconds of trains worked out at the start: longer than any set
+const WAVE_LATE = 4; // seconds a train's passenger waits for room on screen before going another way
 export const PATH_Y = 146; // where passers-by walk
 
-export function createCrowd(seed) {
+// The trains of a station (place.waves) over the set, from their own stream so they never move the
+// crowd's draws: [{ t, people: [times each steps off] }], t when it stands with its doors open.
+function timetable(seed, waves) {
+  if (!waves) return [];
+  const rng = createRng((seed ^ WAVE_SEED) >>> 0), trains = [];
+  for (let t = randomBetween(rng, ...waves.first); t < WAVE_HORIZON; t += randomBetween(rng, ...waves.every)) {
+    const n = waves.people[0] + Math.floor(nextRandom(rng) * (waves.people[1] - waves.people[0] + 1));
+    const people = [];
+    for (let k = 0, at = t; k < n; k++, at += randomBetween(rng, ...waves.gap)) people.push(at);
+    trains.push({ t, people });
+  }
+  return trains;
+}
+
+// place: a key of tuning.js PLACES ('park' if none): who comes by and how.
+export function createCrowd(seed, place = 'park') {
+  const p = PLACES[place];
+  const trains = timetable(seed, p.waves);
   return {
+    place: p,
+    trains,
+    waveQueue: trains.flatMap((tr) => tr.people), // when each train's passengers come along the platform
     rng: createRng(seed),
     // Looks are dealt from a stream of their own, so they never move the draws above: a set's kinds,
     // sides, budgets and arrival times are as they were before people had looks.
@@ -68,11 +91,23 @@ export function dealLook(c, kind) {
   return look;
 }
 
+// A kind drawn by the place's weights (in KINDS order): with the park's, all equal, exactly the old
+// pick of one of the four.
+function pickKind(r, weights) {
+  const target = r * weights.reduce((a, b) => a + b, 0);
+  let sum = 0;
+  for (let i = 0; i < KINDS.length; i++) {
+    sum += weights[i];
+    if (target < sum) return KINDS[i];
+  }
+  return KINDS[weights.findLastIndex((w) => w > 0)];
+}
+
 function arrive(c, t) {
   // Always the same draws in the same order, so the k-th arrival is the same person whatever you play.
-  const kind = KINDS[Math.floor(nextRandom(c.rng) * KINDS.length)];
+  const kind = pickKind(nextRandom(c.rng), c.place.kinds);
   const dir = nextRandom(c.rng) < 0.5 ? 1 : -1;
-  const budget = randomBetween(c.rng, CROWD.budgetMin, CROWD.budgetMax);
+  const budget = randomBetween(c.rng, c.place.stay[0], c.place.stay[1]);
   c.people.push({
     id: c.nextId++, kind, look: dealLook(c, kind), dir, x: dir > 0 ? -CROWD.edge : CROWD.width + CROWD.edge, y: PATH_Y,
     state: 'passing', listening: false, heard: 0, walkedOn: false,
@@ -111,7 +146,7 @@ export function hear(c, e, t) {
         break;
       case 'callback':
         nudge(p, 'callback', INTEREST.callback, t);
-        if (inCrowd(p)) c.out.push({ type: 'coin', person: p, coins: TIPS.callback, why: 'callback' });
+        if (inCrowd(p)) c.out.push({ type: 'coin', person: p, coins: c.place.tips.callback, why: 'callback' });
         break;
       default: // repeat, offKey, recognised, random, silence
         nudge(p, e.rule, INTEREST[e.rule], t);
@@ -130,17 +165,26 @@ function freeSpot(c, x) {
 
 function leave(c, p, happy) {
   p.state = 'leaving';
-  if (happy) c.out.push({ type: 'coin', person: p, coins: p.kind === 'elder' ? TIPS.happyElder : TIPS.happy, why: 'happy' });
+  if (happy) c.out.push({ type: 'coin', person: p, coins: p.kind === 'elder' ? c.place.tips.happyElder : c.place.tips.happy, why: 'happy' });
   c.out.push({ type: 'left', person: p, happy });
 }
 
 export function stepCrowd(c, dt, t) {
-  if (c.open && t >= c.nextArrival && c.people.length < CROWD.onScreen) {
+  const P = c.place;
+  if (c.open && t >= c.nextArrival && c.people.length < P.onScreen) {
+    arrive(c, t);
+    c.nextArrival = t + randomBetween(c.rng, P.arrive[0], P.arrive[1]);
+  }
+  // A train's passengers come along the platform as they step off, while there's room; one kept waiting
+  // too long goes another way.
+  while (c.waveQueue.length && c.waveQueue[0] < t - WAVE_LATE) c.waveQueue.shift();
+  while (c.open && c.waveQueue.length && c.waveQueue[0] <= t && c.people.length < P.onScreen) {
+    c.waveQueue.shift();
     arrive(c, t);
-    c.nextArrival = t + randomBetween(c.rng, CROWD.arriveMin, CROWD.arriveMax);
   }
   for (const p of c.people) {
-    const kind = CROWD.kinds[p.kind];
+    const base = CROWD.kinds[p.kind];
+    const kind = { speed: base.speed * P.pace, patience: base.patience * P.patience };
     if (hearing(p)) p.interest = Math.max(0, p.interest - INTEREST.fade * dt);
     if (p.state === 'passing') {
       const near = Math.abs(p.x - CROWD.playerX) <= CROWD.earshot;
@@ -186,5 +230,5 @@ export function stepCrowd(c, dt, t) {
 
 // The set is over: each listener still here tips once.
 export function endTips(c) {
-  for (const p of c.people) if (inCrowd(p)) c.out.push({ type: 'coin', person: p, coins: TIPS.end, why: 'end' });
+  for (const p of c.people) if (inCrowd(p)) c.out.push({ type: 'coin', person: p, coins: c.place.tips.end, why: 'end' });
 }
````

Apply to `open-case/src/set.js`:

````diff
diff --git a/open-case/src/set.js b/open-case/src/set.js
index 93e8220..5ab0276 100644
--- a/open-case/src/set.js
+++ b/open-case/src/set.js
@@ -14,19 +14,20 @@ import { createCrowd, hear, stepCrowd, crowdSize, endTips } from './crowd.js';
 import { LOFI, clockOf, setBars } from './beats.js';
 import { GROOVE, LAYERS, LAYER_HOLD, DT } from './tuning.js';
 
-// A set of `beat` (beats.js): the band plays it, and its tempo sets the set's 16ths, beats and bars
-// (clock) and how many bars the set lasts (bars).
-export function createSet(seed, beat = LOFI) {
+// A set of `beat` (beats.js) at `place` (places.js): the band plays the beat, and its tempo sets the
+// set's 16ths, beats and bars (clock) and how many bars the set lasts (bars); the place sets the crowd.
+export function createSet(seed, beat = LOFI, place = 'park') {
   const clock = clockOf(beat);
   return {
     seed,
     beat,
+    place,
     clock,
     bars: setBars(beat),
     t: 0,
     phase: 'playing', // then 'ending' (the fade and the applause), then 'over'
     listen: createListener(clock),
-    crowd: createCrowd(seed),
+    crowd: createCrowd(seed, place),
     coins: 0,
     layers: Object.fromEntries(LAYERS.map((l) => [l.id, l.min === 0])),
     below: Object.fromEntries(LAYERS.map((l) => [l.id, 0])), // whole bars the crowd has stayed below each layer's number
@@ -122,8 +123,8 @@ export function momentsOf(notes) {
 }
 
 // Plays a whole set without sound or screen, as the tests and the end card's "Run the bots" do.
-export function runSet(seed, notes, beat = LOFI) {
-  const set = createSet(seed, beat);
+export function runSet(seed, notes, beat = LOFI, place = 'park') {
+  const set = createSet(seed, beat, place);
   const moments = momentsOf(notes);
   let i = 0;
   while (set.phase !== 'over') {
````

- [ ] **Step 4: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 362 tests. Every test that was there before passes unchanged: the park plays as it always has.

- [ ] **Step 5: Commit**

```bash
git add open-case/src/places.js open-case/src/tuning.js open-case/src/crowd.js open-case/src/set.js open-case/test/places.test.js open-case/test/crowd.test.js open-case/test/bots.test.js
git commit -m "Open Case: three places to busk, each with its own crowd: the park as it was, the station's trains bringing waves of commuters, the night market's slow browsers

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: The station's and the night market's life

**Files:**
- Modify: `open-case/src/scene.js`, `open-case/src/tuning.js`
- Test: `open-case/test/scene.test.js`

**Interfaces:**
- Consumes: `createCrowd(seed, 'station').trains` (Task 1).
- Produces, in `scene.js`:
  - `createScene(seed, { bar, parkBar, place = 'park' })`, giving `scene.place`;
  - `CAT` (`[236, 174]`, the cat's feet), `TRAIN` (`{ cars: 4, car: 112, stop: 24 }`), `CAT_RUN`, `CAT_WALK`;
  - `stationClock(bars) -> { hour, minute }`; `trainAt(trains, t) -> null | { x, doors }`; `boardFirst(trains, t)` (the index of the first train still to go);
  - `marketStages(bar)` (each sky band's stage); `lanternsLit(bar, n)`; `steamFrame(time, still)`; `catAt(scene, t, time) -> null | { pose: 'sleep' | 'run' | 'walk', frame, x, y, dir }`.
- Produces, in `tuning.js`: `STATION` (`clockFrom`, `clockTo`, `pullIn`, `stand`, `pullOut`) and `MARKET` (`skyFrom`, `lanternsFrom`, `lanternsTo`, `steam`).

- [ ] **Step 1: Write the failing tests**

Apply to `open-case/test/scene.test.js`:

````diff
diff --git a/open-case/test/scene.test.js b/open-case/test/scene.test.js
index 0160b29..3f0afd3 100644
--- a/open-case/test/scene.test.js
+++ b/open-case/test/scene.test.js
@@ -5,9 +5,11 @@ import {
   TRAIL_LIFE, LOOP_TRAIL_LIFE, FLIGHT, GOLD,
   skyStages, sunDrop, windowLit, lampState, starsOut, trainX, cloudX, createFlocks, birdsAt, pigeonsAt, frameOf,
   PIGEONS, TRAIN_LENGTH, PIGEON_FLY, PIGEON_WALK,
+  stationClock, trainAt, boardFirst, marketStages, lanternsLit, steamFrame, catAt, CAT, TRAIN, CAT_RUN, CAT_WALK,
 } from '../src/scene.js';
+import { createCrowd } from '../src/crowd.js';
 import { LOFI_CLOCK } from '../src/beats.js';
-import { PARK } from '../src/tuning.js';
+import { PARK, STATION, MARKET } from '../src/tuning.js';
 const { bar: BAR } = LOFI_CLOCK;
 
 test('each note leaves a glyph that floats up from the guitar, higher notes higher, and fades over 2 bars', () => {
@@ -221,3 +223,95 @@ test("the park keeps its own bars over a set of any beat: the train by the park'
   assert.ok(pigeonsAt(scene, 10 + PARK.pigeonsAway * bar - 0.01, 0).every((p) => p.pose !== 'walk'), 'still away');
   assert.ok(pigeonsAt(scene, 10 + PARK.pigeonsAway * bar + 0.1, 0).every((p) => p.pose === 'walk'), 'back after 4 of the beat\'s bars');
 });
+
+test('a scene knows its place, the park unless it says', () => {
+  assert.equal(createScene(1).place, 'park');
+  assert.equal(createScene(1, { place: 'market' }).place, 'market');
+});
+
+test("the station's clock runs from half past five as a set starts to half past six as it ends", () => {
+  assert.deepEqual(stationClock(0), { hour: 5, minute: 30 });
+  assert.deepEqual(stationClock(PARK.bars / 2), { hour: 6, minute: 0 });
+  assert.deepEqual(stationClock(PARK.bars), { hour: 6, minute: 30 });
+  assert.deepEqual(stationClock(PARK.bars * 2), { hour: 6, minute: 30 }, 'and stays there');
+  assert.deepEqual(stationClock(PARK.bars / 4 + 0.5), { hour: 5, minute: 45 });
+});
+
+test("each of the crowd's trains pulls in, stands with its doors open as its passengers step off, and pulls out", () => {
+  const trains = createCrowd(2, 'station').trains, first = trains[0];
+  assert.equal(trainAt(trains, first.t - STATION.pullIn - 0.1), null, 'not yet');
+  const coming = trainAt(trains, first.t - STATION.pullIn / 2);
+  assert.ok(coming.x > TRAIN.stop && coming.x < 320 && !coming.doors, 'pulling in from the right');
+  for (const at of first.people) assert.deepEqual(trainAt(trains, at), { x: TRAIN.stop, doors: true }, 'standing as each steps off');
+  const going = trainAt(trains, first.t + STATION.stand + STATION.pullOut / 2);
+  assert.ok(going.x < TRAIN.stop && !going.doors, 'pulling out to the left');
+  assert.equal(trainAt(trains, first.t + STATION.stand + STATION.pullOut + 0.1), null, 'gone');
+  assert.ok(trainAt(trains, first.t + STATION.stand + STATION.pullOut).x <= -TRAIN.cars * TRAIN.car + 1, 'all of it off the screen');
+  assert.equal(trainAt([], 10), null);
+});
+
+test('the departure board loses its top train as that train pulls out', () => {
+  const trains = createCrowd(2, 'station').trains;
+  assert.equal(boardFirst(trains, 0), 0);
+  assert.equal(boardFirst(trains, trains[0].t + STATION.stand - 0.01), 0);
+  assert.equal(boardFirst(trains, trains[0].t + STATION.stand), 1);
+  assert.equal(boardFirst(trains, trains[2].t + STATION.stand), 3);
+});
+
+test("the night market's sky starts at blue hour and darkens to night with the park's", () => {
+  assert.deepEqual(marketStages(0), skyStages(0).map((s) => s + MARKET.skyFrom));
+  assert.ok(marketStages(PARK.bars).every((s) => s === 4));
+  for (let bar = 0; bar <= PARK.bars; bar++) {
+    marketStages(bar).forEach((s, band) => assert.ok(s >= marketStages(Math.max(0, bar - 1))[band], 'never lightens'));
+  }
+});
+
+test('the lanterns light one by one, in order, from bar 2 to bar 40', () => {
+  const n = 30;
+  assert.equal(lanternsLit(0, n), 0);
+  assert.equal(lanternsLit(MARKET.lanternsFrom, n), 1);
+  assert.equal(lanternsLit(MARKET.lanternsTo, n), n);
+  assert.equal(lanternsLit(PARK.bars, n), n);
+  let last = 0;
+  for (let bar = 0; bar <= MARKET.lanternsTo; bar += 0.5) {
+    const lit = lanternsLit(bar, n);
+    assert.ok(lit >= last && lit - last <= 1, `bar ${bar}`);
+    last = lit;
+  }
+});
+
+test('the steam puffs between its two frames, and holds still with reduced motion', () => {
+  assert.equal(steamFrame(0.1, false), 0);
+  assert.equal(steamFrame(MARKET.steam + 0.1, false), 1);
+  assert.equal(steamFrame(MARKET.steam + 0.1, true), 0);
+});
+
+test('the cat sleeps by your case until a loud note wakes it; it runs off and strolls back 4 bars later', () => {
+  const scene = createScene(1, { place: 'market' });
+  const asleep = catAt(scene, 5, 0);
+  assert.deepEqual([asleep.pose, asleep.x, asleep.y], ['sleep', CAT[0], CAT[1]]);
+  assert.notEqual(catAt(scene, 5, 0).frame, catAt(scene, 5, 1.5).frame, 'breathing');
+  sceneNote(scene, 60, 0, 10, 3);
+  assert.equal(catAt(scene, 10.5, 0).pose, 'sleep', 'a quiet note leaves it be');
+  sceneNote(scene, 60, 1, 10, 4);
+  const run = catAt(scene, 10.5, 0);
+  assert.ok(run.pose === 'run' && run.x > CAT[0] && run.dir === 1, 'off to the right');
+  assert.equal(catAt(scene, 10 + CAT_RUN + 0.1, 0), null, 'away');
+  const back = 10 + PARK.pigeonsAway * BAR;
+  assert.equal(catAt(scene, back - 0.1, 0), null);
+  const walk = catAt(scene, back + CAT_WALK / 2, 0);
+  assert.ok(walk.pose === 'walk' && walk.x > CAT[0] && walk.x < 340 && walk.dir === -1, 'strolling back');
+  assert.equal(catAt(scene, back + CAT_WALK + 0.1, 0).pose, 'sleep', 'and back to sleep');
+});
+
+test('woken again while strolling back, the cat runs off from where it is, not from home', () => {
+  const scene = createScene(1, { place: 'market' });
+  sceneNote(scene, 60, 0, 10, 4);
+  const back = 10 + PARK.pigeonsAway * BAR, mid = back + CAT_WALK / 2;
+  const there = catAt(scene, mid, 0).x;
+  assert.ok(there > CAT[0] + 10, 'on its way back');
+  sceneNote(scene, 60, 1, mid, 4);
+  const run = catAt(scene, mid + 0.01, 0);
+  assert.equal(run.pose, 'run');
+  assert.ok(Math.abs(run.x - there) <= 2, `runs from ${run.x}, where it was (${there})`);
+});
````

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL. `test/scene.test.js` can't load, because `scene.js` doesn't export `stationClock` and the rest. That's 1 failing file; the other 344 tests pass.

- [ ] **Step 3: Their life**

Apply to `open-case/src/tuning.js`:

````diff
diff --git a/open-case/src/tuning.js b/open-case/src/tuning.js
index 4d2dd7b..5ff637a 100644
--- a/open-case/src/tuning.js
+++ b/open-case/src/tuning.js
@@ -164,6 +164,27 @@ export const PARK = {
   pigeonsAway: 4, // bars the pigeons stay away after a loud note scatters them
 };
 
+// The station's life (scene.js and render.js), over the same PARK.bars as the park's evening: the
+// clock runs through the evening rush, and each of the crowd's trains (PLACES.station.waves) pulls in,
+// stands with its doors open as its passengers step off, and pulls out. Its sky, through the glass
+// roof and the arches, darkens as the park's does.
+export const STATION = {
+  clockFrom: 30, // minutes past five on the clock as a set starts...
+  clockTo: 90, // ...and as it ends: half past six
+  pullIn: 3, // seconds a train takes to pull in, before its doors open
+  stand: 8, // seconds it stands with its doors open
+  pullOut: 4, // seconds it takes to pull out
+};
+
+// The night market's life: from blue hour into night, its lanterns light one by one, and steam rises
+// from the noodle stall. A cat sleeps by your case, and a loud note sends it off for the pigeons' 4 bars.
+export const MARKET = {
+  skyFrom: 2, // its sky starts at this stage of the park's (blue hour) and darkens with it to night
+  lanternsFrom: 2, // the lanterns light one by one, the first at this bar...
+  lanternsTo: 40, // ...the last at this one (of PARK.bars)
+  steam: 0.5, // seconds each of the steam's two frames shows
+};
+
 // The music shop (gear.js): what each thing costs in coins, and the key that stomps each pedal. The
 // pedals are listed in the order they chain, overdrive first, which is also the order of their keys.
 // The loop pedal is worked with R and Backspace instead.
````

Apply to `open-case/src/scene.js`:

````diff
diff --git a/open-case/src/scene.js b/open-case/src/scene.js
index b895b10..530df93 100644
--- a/open-case/src/scene.js
+++ b/open-case/src/scene.js
@@ -5,7 +5,7 @@
 // set's clock, except the birds' and the pigeons' pecking, which run on the page's clock (`time`).
 import { createRng, nextRandom, randomBetween } from './rng.js';
 import { LOFI_CLOCK } from './beats.js';
-import { PARK, RULES } from './tuning.js';
+import { PARK, STATION, MARKET, RULES } from './tuning.js';
 
 export const GUITAR = [152, 128]; // where notes float up from
 // Where your loop's notes float up from (art/open-case/gear.lua G.LOOP_PEDAL).
@@ -13,6 +13,11 @@ export const LOOP_PEDAL = [133, 152];
 export const CASE = [161, 160]; // where coins land
 // Where the pigeons peck: their feet, clear of the gear strip's loop slot (render.js).
 export const PIGEONS = [[222, 172], [235, 176], [248, 170]];
+// Where the night market's cat sleeps: its feet, where the pigeons would be.
+export const CAT = [236, 174];
+// The station's train: four cars (art/open-case/station.lua), `car` pixels apart, its first car's
+// left edge at `stop` while it stands at the platform.
+export const TRAIN = { cars: 4, car: 112, stop: 24 };
 const TRAIL_LIFE = 6; // seconds a note's glyph lasts (2 bars)
 const LOOP_TRAIL_LIFE = 3; // seconds a looped note's glyph lasts
 const FLIGHT = 0.7; // seconds a coin takes to reach the case
@@ -27,16 +32,21 @@ const FLAP = 0.12; // seconds a bird's wingbeat frame lasts
 const PIGEON_FLY = 2.5; // seconds scattered pigeons take to fly off screen
 const PIGEON_WALK = 4; // seconds they take to walk back in
 const PIGEON_CYCLE = 6; // seconds: each pigeon pecks, then shuffles a few pixels, then pecks again
+const CAT_RUN = 1.5; // seconds a woken cat takes to run off the screen
+const CAT_WALK = PIGEON_WALK; // seconds it takes to stroll back (as long as the pigeons take, so a loud
+// note while it's on its way sends it off from where it is, as they do: scene.flyFrom)
+const CAT_BREATH = 1.4; // seconds each of a sleeping cat's two breaths shows
 // Which of n frames a counter is on, for counters that may be negative (the page's clock can start a
 // hair below zero).
 export const frameOf = (count, n) => ((Math.floor(count) % n) + n) % n;
 
 // bar: seconds in a bar of the set's beat (the pigeons stay away PARK.pigeonsAway of them); parkBar:
-// seconds in one of the park's bars (the set's length over PARK.bars), which the train's time counts.
-export function createScene(seed = 1, { bar = LOFI_CLOCK.bar, parkBar = bar } = {}) {
+// seconds in one of the park's bars (the set's length over PARK.bars), which the train's time counts;
+// place: where the set is (places.js), whose scene render.js draws.
+export function createScene(seed = 1, { bar = LOFI_CLOCK.bar, parkBar = bar, place = 'park' } = {}) {
   const rng = createRng((seed ^ PARK_SEED) >>> 0);
   return {
-    bar, parkBar,
+    bar, parkBar, place,
     trail: [], flights: [], caseCoins: 0, gold: null, clapFrom: -1,
     // your loop's notes, { pitch, t }, in time order (t may be a moment ahead: scheduled that way)
     loopTrail: [],
@@ -50,7 +60,7 @@ export function createScene(seed = 1, { bar = LOFI_CLOCK.bar, parkBar = bar } =
 }
 
 // A note you played: index is its place in the ears' note list (for its echo). A loud one scatters
-// the pigeons, if they're there.
+// the pigeons, if they're there (or wakes the night market's cat).
 export function sceneNote(scene, pitch, index, t, strength = 0) {
   scene.trail.push({ pitch, index, t });
   scene.lastNote = t;
@@ -224,4 +234,72 @@ export function pigeonsAt(scene, t, time) {
   return out;
 }
 
-export { TRAIL_LIFE, LOOP_TRAIL_LIFE, FLIGHT, GOLD, TRAIN_LENGTH, PIGEON_FLY, PIGEON_WALK };
+// The station. Its clock at `bars` (park bars into the set, a fraction is fine): { hour, minute },
+// from half past five as a set starts to half past six as it ends.
+export function stationClock(bars) {
+  const k = Math.min(1, Math.max(0, bars / PARK.bars));
+  const minutes = Math.floor(STATION.clockFrom + (STATION.clockTo - STATION.clockFrom) * k);
+  return { hour: 5 + Math.floor(minutes / 60), minute: minutes % 60 };
+}
+
+// The train at the platform at set time t, from the crowd's trains ([{ t }], t when its doors open):
+// null between trains, or { x, doors }: x is its first car's left edge. It slows to a stop pulling in
+// from the right, stands with its doors open, and speeds up pulling out to the left.
+export function trainAt(trains, t) {
+  const length = TRAIN.cars * TRAIN.car;
+  for (const tr of trains) {
+    const k = t - tr.t;
+    if (k < -STATION.pullIn || k > STATION.stand + STATION.pullOut) continue;
+    if (k < 0) {
+      const left = -k / STATION.pullIn; // 1 as it appears, 0 as it stops
+      return { x: Math.round(TRAIN.stop + (320 - TRAIN.stop) * left * left), doors: false };
+    }
+    if (k <= STATION.stand) return { x: TRAIN.stop, doors: true };
+    const gone = (k - STATION.stand) / STATION.pullOut;
+    return { x: Math.round(TRAIN.stop - (TRAIN.stop + length) * gone * gone), doors: false };
+  }
+  return null;
+}
+
+// The departure board lists the trains still to go: the first of them at set time t (an index into
+// trains). A train leaves the board as it pulls out.
+export function boardFirst(trains, t) {
+  const i = trains.findIndex((tr) => t < tr.t + STATION.stand);
+  return i < 0 ? trains.length : i;
+}
+
+// The night market. Its sky's stage for each band, from the park's (skyStages): it starts at blue hour
+// and darkens to night with it.
+export const marketStages = (bar) => skyStages(bar).map((s) => Math.min(4, s + MARKET.skyFrom));
+
+// How many of its n lanterns are lit at `bar`: they light one by one, in order along the strings.
+export function lanternsLit(bar, n) {
+  let lit = 0;
+  for (let i = 0; i < n; i++) {
+    const at = MARKET.lanternsFrom + ((MARKET.lanternsTo - MARKET.lanternsFrom) * i) / Math.max(1, n - 1);
+    if (bar >= at) lit++;
+  }
+  return lit;
+}
+
+// The noodle stall's steam: which of its two frames shows at page time `time`.
+export const steamFrame = (time, still) => (still ? 0 : frameOf(time / MARKET.steam, 2));
+
+// The cat at set time t and page time `time`: asleep by your case ({ pose: 'sleep', frame }), until a
+// loud note (the pigeons' scaredAt) wakes it and it runs off to the right, from wherever it was;
+// PARK.pigeonsAway bars later it strolls back in from the right. null while it's away. Each: { pose,
+// frame, x, y, dir }.
+export function catAt(scene, t, time) {
+  const [hx, hy] = CAT;
+  const since = scene.scaredAt === null ? Infinity : Math.max(0, t - scene.scaredAt);
+  if (since < CAT_RUN) {
+    const from = 340 + (hx - 340) * scene.flyFrom; // where it was: home, or on its way back
+    return { pose: 'run', frame: frameOf(since * 10, 2), x: Math.round(from + (340 - from) * (since / CAT_RUN) ** 1.5), y: hy, dir: 1 };
+  }
+  const back = since - PARK.pigeonsAway * scene.bar;
+  if (back < 0) return null;
+  if (back < CAT_WALK) return { pose: 'walk', frame: frameOf(time * 4, 2), x: Math.round(340 + (hx - 340) * (back / CAT_WALK)), y: hy, dir: -1 };
+  return { pose: 'sleep', frame: frameOf(time / CAT_BREATH, 2), x: hx, y: hy, dir: -1 };
+}
+
+export { TRAIL_LIFE, LOOP_TRAIL_LIFE, FLIGHT, GOLD, TRAIN_LENGTH, PIGEON_FLY, PIGEON_WALK, CAT_RUN, CAT_WALK };
````

- [ ] **Step 4: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 371 tests.

- [ ] **Step 5: Commit**

```bash
git add open-case/src/scene.js open-case/src/tuning.js open-case/test/scene.test.js
git commit -m "Open Case: the station's and the night market's life: the clock, the trains and the board; the lanterns, the steam and the cat

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: The station's and the night market's art

**Files:**
- Create: `art/open-case/station.lua`, `art/open-case/market.lua`
- Modify: `art/open-case/palette.lua`, `art/open-case/sprites.lua`; rebuilt: `open-case/assets/sprites.png`, `open-case/assets/sprites.json`
- Test: `open-case/test/art.test.js`

**Interfaces:**
- Produces, in the sheet:
  - `station-city-<0-4>` (the far city through the arches, in each stage of the sky), `station-hall`, `station-car-<0|1>` (one car, doors shut or open, drawn at (x, 0) for its left end at x), `station-front`, all anchored at the screen's top left;
  - `market-skyline`, `market-stalls`, `market-steam-<0|1>`, `market-strings`, `market-street`, at the top left; `lantern-off` and `lantern-<0-2>` (hung from their cap's top); `cat-<sleep|walk|run>-<0|1>-<left|right>` (by its feet).
- Produces, in `sprites.json`: `station: { board: [x0, y0, x1, y1], clock: [x, y, r] }` and `market: { lanterns: [[x, y, colour], …] (in the order they light), stars: [[x, y], …] }`.
- Palette: `stone` (`#958873`, `#bdb097`, `#c9bca3`) and `brick` (`#6a3426`, `#a4573c`, `#c27a50`).

- [ ] **Step 1: Write the failing tests**

Apply to `open-case/test/art.test.js`:

````diff
diff --git a/open-case/test/art.test.js b/open-case/test/art.test.js
index 8262cc3..e07ebe4 100644
--- a/open-case/test/art.test.js
+++ b/open-case/test/art.test.js
@@ -36,6 +36,11 @@ const FAMILIES = [
   ])),
   ...REACTIONS.map((r) => [new RegExp(`^react-${r}-\\d$`), 2]),
   ...['peck', 'walk', 'fly'].flatMap((p) => ['left', 'right'].map((d) => [new RegExp(`^pigeon-${p}-\\d-${d}$`), 2])),
+  // the station and the night market
+  [/^station-city-\d$/, 5], ['station-hall', 1], [/^station-car-\d$/, 2], ['station-front', 1],
+  ['market-skyline', 1], ['market-stalls', 1], [/^market-steam-\d$/, 2], ['market-strings', 1], ['market-street', 1],
+  ['lantern-off', 1], [/^lantern-\d$/, 3],
+  ...['sleep', 'walk', 'run'].flatMap((p) => ['left', 'right'].map((d) => [new RegExp(`^cat-${p}-\\d-${d}$`), 2])),
 ];
 
 test('every frame the game draws is there, as many of each as the spec says, and nothing else', () => {
@@ -47,6 +52,16 @@ test('every frame the game draws is there, as many of each as the spec says, and
   for (const who of PEOPLE) for (const i of range(4)) assert.ok(names.includes(`${who}-walk-${i}-left`), `${who}-walk-${i}`);
 });
 
+test("the station's and the night market's layout: the board and the clock inside the hall, the lanterns along their strings, in order", () => {
+  const { board, clock } = data.station;
+  assert.ok(board[0] < board[2] && board[1] < board[3] && board[2] < 320 && board[3] < 100, `board ${board}`);
+  assert.ok(clock[2] > 4 && clock[1] - clock[2] > 30 && clock[0] + clock[2] < 320, `clock ${clock}`);
+  const { lanterns, stars } = data.market;
+  assert.ok(lanterns.length >= 20, `${lanterns.length} lanterns`);
+  for (const [x, y, c] of lanterns) assert.ok(x >= 0 && x < 320 && y > 0 && y < 70 && [0, 1, 2].includes(c), `${x}, ${y}, ${c}`);
+  assert.ok(stars.length >= 20 && stars.every(([x, y]) => x >= 0 && x < 320 && y >= 0 && y < 70));
+});
+
 test('every frame lies inside sprites.png', () => {
   for (const [name, [x, y, w, h]] of Object.entries(data.frames)) {
     assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= sheet.w && y + h <= sheet.h, name);
````

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL, 2 tests:
- "every frame the game draws is there, as many of each as the spec says, and nothing else";
- "the station's and the night market's layout: the board and the clock inside the hall, the lanterns along their strings, in order".

The other 370 pass.

- [ ] **Step 3: The art**

Create `art/open-case/station.lua`:

````lua
-- The station at rush hour in the flat style, for the sprite sheet (sprites.lua): an old train shed
-- seen across the track, in layers drawn back to front over the sky (render.js draws the sky's bands,
-- as for the park):
--   the far city through the arches, in each stage of the sky's colours;
--   the hall: the brick wall and its arched windows, the far platform and the track, and the glass
--     roof on its iron ribs (the sky shows through the glass and the arches);
--   the train's cars, doors shut or open, which pull in and out between the hall and the front;
--   the front: the iron pillars, the globe lamps, the departure board and the clock (their rows and
--     hands are drawn by render.js), the bench, and the near platform you play on, in pale stone.
-- Everything is laid out round the park's positions: you on your crate, the path the people walk at
-- y 146, the listeners' arc, the case.
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local D = dofile(here .. "draw.lua")
local L, C, rect, oval = D.L, D.C, D.rect, D.oval
local W, H = D.W, D.H
local set = L.set
local S = {}

S.GIRDER = 30 -- the roof's deep girder: its top row
S.WALL_TOP = 36
S.ARCHES = { { 64, 34 }, { 160, 34 }, { 256, 34 } } -- the arched windows: centre x, half width
S.ARCH_TOP, S.ARCH_BOTTOM = 46, 102
S.TRAIN_TOP, S.TRAIN_BOTTOM = 80, 124 -- a car's top and bottom rows
S.CAR = 108 -- a car's length; the cars are 4 pixels apart (scene.js TRAIN.car is 112)
S.EDGE = 126 -- the near platform's edge, which hides the train's wheels
S.BOARD = { 34, 44, 98, 66 } -- the departure board: x0, y0, x1, y1 (its rows: render.js)
S.CLOCK = { 238, 52, 9 } -- the clock: its middle and radius (its hands: render.js)

-- The far rooftops seen through the arches: { x0, x1, top }.
local CITY = { { 0, 30, 92 }, { 31, 46, 86 }, { 47, 70, 96 }, { 71, 90, 84 }, { 91, 120, 94 }, { 121, 140, 88 },
  { 141, 170, 98 }, { 171, 186, 90 }, { 187, 214, 95 }, { 215, 240, 85 }, { 241, 262, 92 }, { 263, 290, 88 }, { 291, 319, 96 } }

local function inArch(x, y)
  for _, a in ipairs(S.ARCHES) do
    local cx, hw = a[1], a[2]
    if x >= cx - hw and x <= cx + hw and y <= S.ARCH_BOTTOM then
      local top = S.ARCH_TOP + hw
      if y >= top then return true end
      if y >= S.ARCH_TOP and D.inOval(x, y, cx + 0.5, top, hw + 0.5, hw) then return true end
    end
  end
  return false
end

-- The far city through the arches, in the nearest band's colours of one stage of the sky.
function S.city(b, stage)
  for _, r in ipairs(CITY) do
    for y = r[3], S.ARCH_BOTTOM do
      for x = r[1], r[2] do
        if inArch(x, y) then b[y][x] = stage[3] end
      end
    end
  end
end

-- The hall behind the train. Where nothing is drawn (the glass and the arches), the sky shows.
function S.hall(b)
  -- the far wall in brown brick, with a lighter frame round each arch
  for y = S.WALL_TOP, S.ARCH_BOTTOM do
    for x = 0, W - 1 do
      if not inArch(x, y) then
        local near = inArch(x - 2, y) or inArch(x + 2, y) or inArch(x, y - 2) or inArch(x, y + 2)
        b[y][x] = near and C.wood[2] or ((y % 6 == 0) and C.brown[1] or C.brown[2])
      end
    end
  end
  -- the glazing bars across the arches
  for _, a in ipairs(S.ARCHES) do
    local cx, hw = a[1], a[2]
    for y = S.ARCH_TOP, S.ARCH_BOTTOM do
      for x = cx - hw, cx + hw do
        if inArch(x, y) and ((x - cx) % 12 == 0 or (y - S.ARCH_TOP) % 14 == 0) then b[y][x] = C.charcoal end
      end
    end
  end
  -- the far platform, its yellow edge, and the track in front of it
  rect(b, 0, 103, W - 1, 110, C.path[2])
  rect(b, 0, 103, W - 1, 103, C.path[3])
  rect(b, 0, 110, W - 1, 111, C.yellow[1])
  rect(b, 0, 112, W - 1, S.EDGE - 1, C.path[1])
  for x = 2, W - 1, 9 do rect(b, x, 119, x + 5, 120, C.wood[1]) end
  rect(b, 0, 117, W - 1, 117, C.coat[2])
  rect(b, 0, 118, W - 1, 118, C.coat[1])
  -- the roof: iron ribs and purlins over the glass, and the deep girder with its rivets
  for y = 0, S.GIRDER - 1 do
    for x = 0, W - 1 do
      if x % 40 < 3 then b[y][x] = C.ink
      elseif y % 9 == 8 then b[y][x] = C.charcoal end
    end
  end
  rect(b, 0, S.GIRDER, W - 1, S.WALL_TOP - 1, C.ink)
  rect(b, 0, S.GIRDER, W - 1, S.GIRDER, C.charcoal)
  for x = 4, W - 1, 8 do set(b, x, S.GIRDER + 3, C.coat[1]) end
end

-- One car of the commuter train, its left end at x 0: teal, with a cream stripe, lit windows, and its
-- doors shut or open.
function S.car(b, open)
  local x0, x1, top, bottom = 0, S.CAR - 1, S.TRAIN_TOP, S.TRAIN_BOTTOM
  rect(b, x0 + 2, top, x1 - 2, top, C.coat[1]) -- the roof's curve
  rect(b, x0, top + 1, x1, top + 3, C.coat[2])
  rect(b, x0, top + 4, x1, bottom, C.teal[2])
  rect(b, x0, top + 26, x1, top + 27, C.light) -- the stripe
  rect(b, x0, top + 34, x1, bottom, C.teal[1])
  for wx = x0 + 6, x1 - 14, 16 do
    if ((wx - x0 - 6) // 16) % 3 == 1 then -- a door
      if open then
        rect(b, wx - 2, top + 8, wx + 11, bottom, C.ink)
        rect(b, wx - 2, top + 8, wx + 11, top + 9, C.yellow[1])
      else
        rect(b, wx - 2, top + 8, wx + 11, bottom, C.teal[1])
        rect(b, wx + 4, top + 8, wx + 5, bottom, C.ink)
        rect(b, wx, top + 11, wx + 2, top + 20, C.yellow[2])
        rect(b, wx + 7, top + 11, wx + 9, top + 20, C.yellow[2])
      end
    else -- a window
      rect(b, wx, top + 10, wx + 9, top + 21, C.ink)
      rect(b, wx + 1, top + 11, wx + 8, top + 20, C.yellow[2])
      rect(b, wx + 1, top + 11, wx + 8, top + 12, C.light)
    end
  end
end

-- The near platform: its edge and yellow line, then pale stone slabs in rows that widen toward you.
local ROWS = { 130, 135, 141, 148, 156, 165, 180 }
local function platform(b)
  rect(b, 0, S.EDGE - 1, W - 1, S.EDGE - 1, C.ink)
  rect(b, 0, S.EDGE, W - 1, S.EDGE + 1, C.path[3])
  rect(b, 0, S.EDGE + 2, W - 1, S.EDGE + 3, C.yellow[2])
  for r = 1, #ROWS - 1 do
    local y0, y1 = ROWS[r], ROWS[r + 1] - 1
    local sw = 14 + r * 4
    for y = y0, y1 do
      for x = 0, W - 1 do
        local sx = x - math.floor((x - 160) * (r - 1) * 0.04)
        local joint = (y == y1) or (sx % sw == 0)
        local alt = ((sx // sw) + r) % 2 == 0
        b[y][x] = joint and C.stone[1] or (alt and C.stone[3] or C.stone[2])
      end
    end
  end
end

-- What stands in front of the train: the pillars, the lamps, the board and the clock hanging from the
-- girder, the bench, and the near platform.
function S.front(b)
  for _, x in ipairs({ 18, 300 }) do -- the iron pillars, each with a capital and a foot
    rect(b, x - 3, S.WALL_TOP, x + 2, 132, C.charcoal)
    rect(b, x + 1, S.WALL_TOP, x + 2, 132, C.ink)
    rect(b, x - 6, S.WALL_TOP, x + 5, S.WALL_TOP + 2, C.charcoal)
    rect(b, x - 5, S.WALL_TOP + 3, x + 4, S.WALL_TOP + 3, C.ink)
    rect(b, x - 5, 128, x + 4, 132, C.charcoal)
    rect(b, x + 2, 128, x + 4, 132, C.ink)
  end
  for _, x in ipairs({ 120, 196 }) do -- the globe lamps, lit for the evening
    rect(b, x, S.WALL_TOP, x, 46, C.ink)
    rect(b, x - 2, 47, x + 2, 47, C.ink)
    oval(b, x + 0.5, 51.5, 4, 4, C.yellow[2])
    oval(b, x - 0.5, 50.5, 2, 2, C.light)
  end
  local x0, y0, x1, y1 = S.BOARD[1], S.BOARD[2], S.BOARD[3], S.BOARD[4] -- the board on its two rods
  rect(b, x0 + 8, S.WALL_TOP, x0 + 8, y0 - 1, C.ink)
  rect(b, x1 - 8, S.WALL_TOP, x1 - 8, y0 - 1, C.ink)
  rect(b, x0, y0, x1, y1, C.ink)
  rect(b, x0, y1, x1, y1, C.charcoal)
  local cx, cy, r = S.CLOCK[1], S.CLOCK[2], S.CLOCK[3] -- the clock: its rod, rim, face and hours
  rect(b, cx, S.WALL_TOP, cx, cy - r - 1, C.ink)
  oval(b, cx + 0.5, cy + 0.5, r + 1.5, r + 1.5, C.ink)
  oval(b, cx + 0.5, cy + 0.5, r - 0.5, r - 0.5, C.light)
  for k = 0, 11 do
    local a = k / 12 * math.pi * 2
    set(b, cx + math.floor(math.sin(a) * (r - 2) + 0.5), cy - math.floor(math.cos(a) * (r - 2) + 0.5), C.coat[1])
  end
  platform(b)
  rect(b, 28, 116, 56, 118, C.wood[2]) -- the bench at the back of the platform
  rect(b, 28, 124, 56, 125, C.wood[2])
  rect(b, 28, 126, 56, 126, C.wood[1])
  rect(b, 30, 127, 31, 133, C.ink)
  rect(b, 53, 127, 54, 133, C.ink)
end

return S
````

Create `art/open-case/market.lua`:

````lua
-- The night market in the flat style, for the sprite sheet (sprites.lua), in layers drawn back to
-- front over the night sky (render.js draws the sky's bands and the stars):
--   the far skyline, with a few lit windows;
--   the two stalls: the noodle stall (red-and-cream awning, the cook, the pot, bowls) and the fruit and
--     lantern stall (teal-and-cream awning, the seller, crates of fruit, paper lanterns for sale);
--   the steam rising from the noodle pot, in two frames;
--   the strings the lanterns hang from, and each lantern, dark or lit (render.js lights them one by
--     one: M.lanterns gives where each hangs, in the order they light);
--   the street in warm red brick, brighter in pools under the lanterns;
--   the cat that sleeps by your case: asleep (two breaths), running off, strolling back.
-- Everything is laid out round the park's positions: you on your crate, the path the people walk at
-- y 146, the listeners' arc, the case.
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local D = dofile(here .. "draw.lua")
local L, C, rect, oval, stamp = D.L, D.C, D.rect, D.oval, D.stamp
local W, H = D.W, D.H
local set = L.set
local M = {}

-- The far skyline between the stalls, darker than the sky, with a few lit windows.
local SKYLINE = { { 80, 100, 78 }, { 101, 118, 66 }, { 119, 134, 82 }, { 135, 150, 58 }, { 151, 176, 74 }, { 177, 196, 86 }, { 197, 222, 70 } }
function M.skyline(b)
  for _, r in ipairs(SKYLINE) do
    rect(b, r[1], r[3], r[2], 128, C.night[3])
    for wy = r[3] + 4, 120, 6 do
      for wx = r[1] + 3, r[2] - 3, 5 do
        if L.rnd(wx, wy, 5) < 0.18 then rect(b, wx, wy, wx + 1, wy + 1, C.yellow[1]) end
      end
    end
  end
end

-- Where the stars are: [{ x, y }], all out from the start.
function M.stars()
  local out = {}
  for i = 0, 29 do out[#out + 1] = { math.floor(L.rnd(i, 1, 11) * W), math.floor(L.rnd(i, 2, 11) * 64) } end
  return out
end

-- A stall: posts, a striped awning with a scalloped edge, bulbs under it, a counter, and what it sells
-- (goods(b, x0, x1, top), drawn on the counter).
local function stall(b, x0, x1, stripeA, stripeB, goods)
  local aTop, aBottom, cTop = 66, 78, 106
  local stripe = function(x) return ((x - x0) // 6) % 2 == 0 and stripeA or stripeB end
  rect(b, x0 + 2, aBottom, x0 + 3, 130, C.wood[1])
  rect(b, x1 - 3, aBottom, x1 - 2, 130, C.wood[1])
  rect(b, x0 + 4, aBottom + 1, x1 - 4, cTop - 1, C.night[3]) -- the back of the stall, in shadow
  for y = aTop, aBottom do
    local inset = (aBottom - y) // 2
    for x = x0 + inset, x1 - inset do b[y][x] = stripe(x) end
  end
  for x = x0, x1 do -- the scalloped edge
    local u = ((x - x0) % 6 - 2.5) / 3
    local drop = math.floor(2 * math.sqrt(math.max(0, 1 - u * u)) + 0.5)
    rect(b, x, aBottom + 1, x, aBottom + drop, stripe(x))
  end
  for x = x0 + 10, x1 - 8, 14 do -- the bulbs
    set(b, x, aBottom + 3, C.ink)
    rect(b, x - 1, aBottom + 4, x + 1, aBottom + 6, C.yellow[2])
    set(b, x, aBottom + 5, C.light)
  end
  goods(b, x0, x1, cTop)
  rect(b, x0 + 1, cTop, x1 - 1, cTop + 2, C.wood[3])
  rect(b, x0 + 1, cTop + 3, x1 - 1, 130, C.wood[2])
  for x = x0 + 6, x1 - 6, 10 do rect(b, x, cTop + 5, x, 128, C.wood[1]) end
end

-- The noodle stall's cook, pot and bowls.
local function noodles(b, x0, x1, top)
  local cx = x0 + 62
  rect(b, cx - 5, top - 14, cx + 5, top - 1, C.light) -- the apron
  rect(b, cx - 6, top - 16, cx + 6, top - 13, C.red[1])
  oval(b, cx + 0.5, top - 21.5, 4, 4, C.skin2[2])
  rect(b, cx - 4, top - 26, cx + 4, top - 24, C.light) -- the cook's cap
  rect(b, x0 + 14, top - 9, x0 + 32, top - 1, C.ink) -- the pot
  rect(b, x0 + 13, top - 10, x0 + 33, top - 10, C.charcoal)
  for k = 0, 2 do
    local bx = x0 + 74 + k * 7
    rect(b, bx, top - 3, bx + 5, top - 1, C.teal[2])
    rect(b, bx + 1, top - 1, bx + 4, top - 1, C.teal[1])
  end
end

-- The fruit stall's seller, crates of fruit, and paper lanterns for sale hanging from the awning.
local function fruit(b, x0, x1, top)
  local vx = x0 + 22
  rect(b, vx - 5, top - 14, vx + 5, top - 1, C.blue[2])
  oval(b, vx + 0.5, top - 19.5, 4, 4, C.skin3[2])
  rect(b, vx - 4, top - 24, vx + 4, top - 22, C.ink)
  local cols = { C.yellow[2], C.red[2], C.go, C.rose[2] }
  for k = 0, 3 do
    local bx = x0 + 36 + k * 13
    rect(b, bx, top - 6, bx + 10, top - 1, C.wood[1])
    for f = 0, 3 do oval(b, bx + 2 + f * 2.5, top - 6.5, 1.5, 1.5, cols[k + 1]) end
  end
  for k = 0, 2 do
    local lx = x0 + 44 + k * 16
    rect(b, lx, 80, lx, 84, C.ink)
    oval(b, lx + 0.5, 88.5, 3, 4, k == 1 and C.yellow[2] or C.red[2])
  end
end

function M.stalls(b)
  stall(b, 2, 104, C.red[2], C.light, noodles)
  stall(b, 214, 318, C.teal[2], C.light, fruit)
end

-- The steam from the noodle pot, in front of the awning: soft puffs that drift as they rise.
function M.steam(b, frame)
  for k = 0, 5 do
    local sy = 98 - k * 8 - frame * 4
    local sx = 25 + math.floor(3 * math.sin(k * 1.3 + frame))
    local r = 2.5 + k * 0.6
    oval(b, sx + 0.5, sy + 0.5, r, r * 0.7, k < 3 and C.light or C.coat[2])
  end
end

-- The strings over the street: { x0, y0, x1, y1, sag }, each a sagging line, and a lantern every 13
-- pixels along it.
local STRINGS = { { 0, 12, 170, 22, 14 }, { 150, 20, 319, 10, 13 }, { 0, 38, 319, 40, 18 } }
local function stringY(s, x)
  local u = (x - s[1]) / (s[3] - s[1])
  return math.floor(s[2] + (s[4] - s[2]) * u + s[5] * 4 * u * (1 - u) + 0.5)
end

function M.strings(b)
  for _, s in ipairs(STRINGS) do
    for x = s[1], s[3] do set(b, x, stringY(s, x), C.ink) end
  end
end

-- Where each lantern hangs, in the order they light (along each string in turn): { x, y, colour },
-- (x, y) the top of its cap and colour 0 (red), 1 (yellow) or 2 (rose).
function M.lanterns()
  local out = {}
  for _, s in ipairs(STRINGS) do
    for x = s[1] + 8, s[3] - 4, 13 do out[#out + 1] = { x, stringY(s, x) + 1, #out % 3 } end
  end
  return out
end

-- A lantern hanging from (3, 0): its caps, and its paper dark or lit in colour 0, 1 or 2.
function M.lantern(b, colour)
  set(b, 3, 0, C.ink)
  rect(b, 2, 1, 4, 1, C.ink)
  if colour then
    oval(b, 3.5, 4.5, 3.5, 3.5, ({ C.red[2], C.yellow[2], C.rose[2] })[colour + 1])
    oval(b, 3.5, 4, 1.5, 2, C.light)
  else
    oval(b, 3.5, 4.5, 3.5, 3.5, C.red[1])
  end
  rect(b, 2, 8, 4, 8, C.ink)
end

-- The street: red brick in rows that widen toward you, warm in pools under the stalls and the strings.
local ROWS = { 130, 134, 139, 145, 152, 160, 169, 180 }
function M.street(b)
  for r = 1, #ROWS - 1 do
    local y0, y1 = ROWS[r], ROWS[r + 1] - 1
    local sw = 8 + r * 3
    for y = y0, y1 do
      for x = 0, W - 1 do
        local sx = x + (r % 2) * (sw // 2)
        local joint = (y == y1) or (sx % sw == 0)
        local warm = D.inOval(x, y, 54, 140, 60, 14) or D.inOval(x, y, 266, 140, 60, 14) or D.inOval(x, y, 160, 132, 70, 6)
        b[y][x] = joint and C.brick[1] or (warm and C.brick[3] or C.brick[2])
      end
    end
  end
end

-- The cat, a black and white one so it shows on the brick, facing left as drawn, its feet on (x, y):
-- pose 'sleep' (curled up, frame 1 a breath in), 'walk' or 'run' (two frames of its legs).
function M.cat(b, x, y, pose, frame)
  if pose == "sleep" then
    D.shadow(b, x + 1, y, 10, 2)
    oval(b, x + 1.5, y - 3.5 - frame * 0.5, 8, 4.5 + frame * 0.5, C.ink) -- the body, curled
    rect(b, x - 1, y - 7 - frame, x + 6, y - 7 - frame, C.charcoal) -- the light along its back
    oval(b, x - 5.5, y - 4.5, 4, 3.5, C.ink) -- the head, tucked in
    rect(b, x - 9, y - 9, x - 8, y - 7, C.ink); rect(b, x - 4, y - 9, x - 3, y - 7, C.ink) -- ears
    rect(b, x - 7, y - 3, x - 4, y - 1, C.light) -- its white chin and chest
    rect(b, x - 8, y - 5, x - 7, y - 5, C.coat[2]); rect(b, x - 4, y - 5, x - 3, y - 5, C.coat[2]) -- shut eyes
    set(b, x - 6, y - 3, C.rose[2])
    rect(b, x - 3, y - 1, x + 9, y, C.ink) -- the tail round the front
    rect(b, x + 8, y - 1, x + 9, y, C.light)
    return
  end
  D.shadow(b, x, y, 8, 1.5)
  local legs = pose == "run"
    and (frame == 0 and { "k.........kk..", "w..........w.." } or { "...kk..kk.....", "...w....w....." })
    or (frame == 0 and { "..k..k...k..k.", "..w..w...w..w." } or { "...k..k.k..k..", "...w..w.w..w.." })
  stamp(b, x - 7, y - 6, {
    ".k.k.........w",
    ".kkk.........k",
    "kkkkk.......k.",
    "kwkkkkkkkkkkk.",
    ".wwkkkkkkkkkh.",
    legs[1],
    legs[2],
  })
end

return M
````

Apply to `art/open-case/palette.lua`:

````diff
diff --git a/art/open-case/palette.lua b/art/open-case/palette.lua
index 5618174..6630938 100644
--- a/art/open-case/palette.lua
+++ b/art/open-case/palette.lua
@@ -26,4 +26,6 @@ return {
   auburn = "#8c3a22", -- hair
   blonde = "#e2bc72", -- hair
   go = "#6ed89a", -- the loop pedal playing, a listener's nod of recognition
+  stone = { "#958873", "#bdb097", "#c9bca3" }, -- the station's platform: its joints, its slabs, every other slab
+  brick = { "#6a3426", "#a4573c", "#c27a50" }, -- the night market's street: its joints, its bricks, bricks in the lanterns' light
 }
````

Apply to `art/open-case/sprites.lua`:

````diff
diff --git a/art/open-case/sprites.lua b/art/open-case/sprites.lua
index e81e69e..97c99f3 100644
--- a/art/open-case/sprites.lua
+++ b/art/open-case/sprites.lua
@@ -24,6 +24,10 @@
 --              pedal's 2x2 one), door [x, y, w, h]
 --              (the door and its sign, a click leaves), sign and board [x, y] (the middle of the top of
 --              the words on the sign and on the chalkboard), lift (pixels a chosen item rises)
+--   station    the station's layout: board [x0, y0, x1, y1] (the departure board's face, for its rows)
+--              and clock [x, y, r] (the clock's middle and radius, for its hands)
+--   market     the night market's: lanterns [[x, y, colour], ...] (where each hangs, in the order they
+--              light; their frames are lantern-off and lantern-<colour>) and stars [[x, y], ...]
 --   looks      { kind: ["woman" | "man", ...] }: each kind's passers-by, look 0 first (their frames are
 --              <kind>-<look>-walk-<0-3>, -stand-<0-1> and -nod-<0-1>, each -left and -right)
 --   colors     the named colours the game draws with in code
@@ -33,6 +37,8 @@ local D = dofile(here .. "draw.lua")
 local F = dofile(here .. "figures.lua")
 local G = dofile(here .. "gear.lua")
 local S = dofile(here .. "shop.lua")
+local ST = dofile(here .. "station.lua")
+local MK = dofile(here .. "market.lua")
 local L, C = D.L, D.C
 local W, H = D.W, D.H
 local STAGES = D.stages()
@@ -121,6 +127,32 @@ for _, pose in ipairs({ "peck", "walk", "fly" }) do
 end
 for f = 0, 1 do add("bird-" .. f, 7, 3, 3, 1, function(b) F.bird(b, f, 3, 1) end) end
 
+-- The station: the far city through its arches in each stage of the sky, the hall, a car of the train
+-- with its doors shut (0) and open (1), and what stands in front of the train
+for s, st in ipairs(STAGES) do screen("station-city-" .. (s - 1), function(b) ST.city(b, st) end) end
+screen("station-hall", ST.hall)
+for f = 0, 1 do add("station-car-" .. f, ST.CAR, ST.TRAIN_BOTTOM + 1, 0, 0, function(b) ST.car(b, f == 1) end) end
+screen("station-front", ST.front)
+
+-- The night market: the skyline, the stalls, the steam (two frames), the strings, a lantern dark and
+-- lit in each colour, the street, and the cat asleep, walking and running, facing left and right
+screen("market-skyline", MK.skyline)
+screen("market-stalls", MK.stalls)
+for f = 0, 1 do screen("market-steam-" .. f, function(b) MK.steam(b, f) end) end
+screen("market-strings", MK.strings)
+add("lantern-off", 7, 9, 3, 0, function(b) MK.lantern(b, nil) end)
+for c = 0, 2 do add("lantern-" .. c, 7, 9, 3, 0, function(b) MK.lantern(b, c) end) end
+screen("market-street", MK.street)
+for _, pose in ipairs({ "sleep", "walk", "run" }) do
+  for f = 0, 1 do
+    local name = ("cat-%s-%d"):format(pose, f)
+    add(name .. "-left", 24, 12, 11, 10, function(b) MK.cat(b, 11, 10, pose, f) end)
+    local b = L.buffer(24, 12)
+    MK.cat(b, 11, 10, pose, f)
+    frames[#frames + 1] = { name = name .. "-right", b = D.mirror(b), px = 12, py = 10 }
+  end
+end
+
 -- The music shop: the room, the counter (drawn over the shopkeeper), the shopkeeper breathing (0, 1)
 -- and nodding at a sale (2, 3), the stock as it stands and chosen, and the tags
 local STOCK = { "overdrive", "chorus", "tremolo", "delay", "reverb", "loop", "acoustic", "ukulele", "electric", "epiano", "synth", "studio" }
@@ -258,6 +290,14 @@ local json = table.concat({
   ('    "board": [%d, %d],'):format((S.BOARD[1] + S.BOARD[3]) // 2, S.BOARD[2] + 6),
   ('    "lift": %d'):format(S.LIFT),
   "  },",
+  '  "station": {',
+  ('    "board": [%d, %d, %d, %d],'):format(ST.BOARD[1], ST.BOARD[2], ST.BOARD[3], ST.BOARD[4]),
+  ('    "clock": [%d, %d, %d]'):format(ST.CLOCK[1], ST.CLOCK[2], ST.CLOCK[3]),
+  "  },",
+  '  "market": {',
+  '    "lanterns": ' .. list(MK.lanterns(), function(l) return ("[%d, %d, %d]"):format(l[1], l[2], l[3]) end) .. ",",
+  '    "stars": ' .. list(MK.stars(), pair),
+  "  },",
   '  "looks": { ' .. table.concat((function()
     local out = {}
     for i, kind in ipairs(F.KINDS) do
````

- [ ] **Step 4: Rebuild the sheet**

Run: `/Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/sprites.lua`
Expected: `sprites: 583 frames on a 512x2514 sheet, 55 colours`. A second run leaves `git status` unchanged.

- [ ] **Step 5: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 372 tests.

- [ ] **Step 6: Commit**

```bash
git add art/open-case/station.lua art/open-case/market.lua art/open-case/palette.lua art/open-case/sprites.lua open-case/assets/sprites.png open-case/assets/sprites.json open-case/test/art.test.js
git commit -m "Open Case: the station's and the night market's art: the hall, the train and the platform; the stalls, the lanterns, the brick street and the cat

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: The game draws the station and the night market

**Files:**
- Modify: `open-case/src/render.js`
- Test: `open-case/test/render.test.js`

**Interfaces:**
- Consumes: Task 2's scene functions and Task 3's frames and data.
- Produces: `draw(view)` draws `view.scene.place`'s scene: `'park'` as today, or `'station'` or `'market'`. The trains come from `view.set.crowd.trains` (none before a set). At the market, the cat takes the pigeons' place. The bottom line's words and the gear strip sit on dark backings (`BACKING`, rows 168 to 178).

- [ ] **Step 1: Write the failing tests**

Apply to `open-case/test/render.test.js`:

````diff
diff --git a/open-case/test/render.test.js b/open-case/test/render.test.js
index d4fdbaf..2964206 100644
--- a/open-case/test/render.test.js
+++ b/open-case/test/render.test.js
@@ -3,12 +3,12 @@ import assert from 'node:assert/strict';
 import { readFileSync } from 'node:fs';
 import { createRenderer, shapeTags, personFrame, youFrame, treeFrame, loopLight, loopWords, loopCue, W, H } from '../src/render.js';
 import { createSet, runSet } from '../src/set.js';
-import { createScene, createFlocks, sceneNote, sceneLoopNote, CASE, PIGEONS, LOOP_PEDAL } from '../src/scene.js';
+import { createScene, createFlocks, sceneNote, sceneLoopNote, CASE, PIGEONS, LOOP_PEDAL, CAT, TRAIN, lanternsLit } from '../src/scene.js';
 import { createKeyState } from '../src/keys.js';
 import { goodSet } from '../src/bots.js';
 import { KINDS, LOOKS } from '../src/crowd.js';
 import { LOFI_CLOCK, readyBeat } from '../src/beats.js';
-import { INTEREST, LOOP } from '../src/tuning.js';
+import { INTEREST, LOOP, PARK, STATION } from '../src/tuning.js';
 import { STOCK, PEDALS, INSTRUMENTS, freshGear, buy, stomp } from '../src/gear.js';
 import { createShop, choose, CARD, BUTTON } from '../src/shop.js';
 import { createLoop, record, step, loopLength } from '../src/looper.js';
@@ -880,3 +880,70 @@ test('the list has Save; the name box shows its title, the name with a blinking
   assert.ok(drawAt(2.5).texts.includes('Beat 1x'), 'and the new name on its row');
   assert.ok(!drawAt(2 + 1.6).texts.includes('saved'), 'gone after a moment');
 });
+
+// A set at a place, its scene, and a view of it `t` seconds in.
+function placed(place, t, over = {}) {
+  const set = createSet(2, undefined, place);
+  set.t = t;
+  const scene = createScene(2, { place });
+  return { set, scene, view: view({ set, scene, t, bars: t / BAR, ...over }) };
+}
+
+test("the station: its hall, the train while one is in, doors open as its passengers step off, the board and the clock", () => {
+  const { set } = placed('station', 0), first = set.crowd.trains[0];
+  for (const [t, cars] of [[first.t - STATION.pullIn - 1, null], [first.t - 1, 'station-car-0'], [first.t + 1, 'station-car-1'], [first.t + STATION.stand + 1, 'station-car-0']]) {
+    const g = fakeContext();
+    createRenderer(g, art)(placed('station', t).view);
+    for (const n of ['station-city-0', 'station-hall', 'station-front', 'you-acoustic-', 'case']) assert.ok(drawn(g, n).length, `${n} at ${t}`);
+    assert.equal(drawn(g, 'station-car-').length, cars ? TRAIN.cars : 0, `the train at ${t}`);
+    if (cars) assert.ok(drawn(g, 'station-car-').every((c) => c.name === cars), `${cars} at ${t}`);
+    for (const n of ['ground', 'trees-', 'lamp-', 'roofs-']) assert.equal(drawn(g, n).length, 0, `no ${n}`);
+  }
+  // The board's rows and the clock's hands, amber and ink, inside the board and round the clock.
+  const g = fakeContext();
+  createRenderer(g, art)(placed('station', 5).view);
+  const [x0, y0, x1, y1] = data.station.board, [cx, cy, r] = data.station.clock;
+  assert.ok(g.rects.filter(([x, y, , , c]) => x > x0 && x < x1 && y > y0 && y < y1 && (c === data.colors.gold || c === data.colors.goldDark)).length >= 8, 'the board lists trains');
+  assert.ok(g.rects.filter(([x, y, , , c]) => Math.hypot(x - cx, y - cy) <= r && c === data.colors.ink).length >= 6, 'the clock has hands');
+});
+
+test('the night market: its stalls, its lanterns lit one by one over the set, and the cat by your case instead of the pigeons', () => {
+  for (const bar of [0, 10, 30, PARK.bars]) {
+    const g = fakeContext();
+    createRenderer(g, art)(placed('market', bar * BAR).view);
+    for (const n of ['market-skyline', 'market-stalls', 'market-steam-', 'market-strings', 'market-street']) assert.ok(drawn(g, n).length, n);
+    const n = data.market.lanterns.length;
+    assert.equal(drawn(g, 'lantern-').length, n);
+    assert.equal(drawn(g, 'lantern-off').length, n - lanternsLit(bar, n), `bar ${bar}`);
+    const cats = drawn(g, 'cat-').map((c) => [c.name, c.x + data.frames[c.name][4], c.y + data.frames[c.name][5]]); // by its anchor, its feet
+    assert.equal(cats.length, 1);
+    assert.match(cats[0][0], /^cat-sleep-\d-left$/);
+    assert.deepEqual(cats[0].slice(1), CAT, 'asleep by your case');
+    assert.equal(drawn(g, 'pigeon-').length, 0, 'no pigeons at the market');
+  }
+});
+
+test('every frame the renderer asks for at the station and the market is in the sheet, over a whole set', () => {
+  for (const place of ['station', 'market']) {
+    const { set, scene } = placed(place, 0);
+    stoodAt(set.crowd, 'commuter', 1);
+    const draw = createRenderer(fakeContext(), art);
+    for (let t = 0; t < 62 * BAR; t += 0.37) {
+      if (Math.abs(t - 20) < 0.2) sceneNote(scene, 60, 0, t, 4); // the pigeons scatter, or the cat wakes
+      set.t = t;
+      for (const still of [false, true]) draw(view({ set, scene, t, bars: t / BAR, time: t * 1.1, still }));
+    }
+  }
+});
+
+test("the bottom line's words and the gear strip sit on a dark backing, which leaves the pigeons and the cat beside it alone", () => {
+  const g = fakeContext(), set = createSet(2);
+  set.t = 30;
+  createRenderer(g, art)(view({ set, scene: createScene(2), t: 30, bars: 30 / BAR, gear: allGear() }));
+  const backings = g.rects.filter(([, y, , h, c]) => y === 168 && h === 11 && c === data.colors.ink);
+  assert.ok(backings.some(([x, , w]) => x === 0 && w >= 70), 'behind the octave and the strength');
+  assert.ok(backings.some(([x, , w]) => x + w === W), 'behind the bar count');
+  assert.ok(backings.length >= 3, 'and behind the gear strip');
+  for (const [x, , w] of backings) for (const [px] of PIGEONS) assert.ok(px < x || px > x + w, `the pigeon at ${px} is clear of ${x}..${x + w}`);
+  for (const [x, , w] of backings) assert.ok(CAT[0] + 10 < x || CAT[0] - 10 > x + w, `the cat is clear of ${x}..${x + w}`);
+});
````

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL, 3 tests:
- "the station: its hall, the train while one is in…" (`station-city-0 at 3.04…`);
- "the night market: its stalls…" (`market-skyline`);
- "the bottom line's words and the gear strip sit on a dark backing…" (`behind the octave and the strength`).

The other 373 pass.

- [ ] **Step 3: Drawing them**

Apply to `open-case/src/render.js`:

````diff
diff --git a/open-case/src/render.js b/open-case/src/render.js
index 1bcd290..c9e6eca 100644
--- a/open-case/src/render.js
+++ b/open-case/src/render.js
@@ -1,14 +1,15 @@
 // Draws the scene at 320x180 into a 2D context (main.js scales it up by a whole number), in the flat
-// style, from the sprite sheet art/open-case/sprites.lua makes (assets.js loads it): the park and its
-// sunset, you on your crate with your instrument, your pedals and the loop pedal, the open case and
-// the band's speaker, the passers-by, their reactions, the pigeons and birds, the note trail (and
-// your loop's), the memory strip, the gear strip, the music shop, and the title, pause and ?debug
-// overlays. The end card is HTML (index.html).
+// style, from the sprite sheet art/open-case/sprites.lua makes (assets.js loads it): the place you
+// busk in (the park and its sunset, the station and its trains, the night market and its lanterns),
+// you on your crate with your instrument, your pedals and the loop pedal, the open case and the band's
+// speaker, the passers-by, their reactions, the pigeons and birds (or the market's cat), the note
+// trail (and your loop's), the memory strip, the gear strip, the music shop, and the title, pause and
+// ?debug overlays. The end card and the map are HTML (index.html, atlasview.js).
 import { CROWD, PLAY, LAYERS, INTEREST, LOOP } from './tuning.js';
 import { LOFI_CLOCK } from './beats.js';
 import {
   GUITAR, coinAt, glyphAt, loopGlyphAt, GOLD, skyStages, sunDrop, windowLit, lampState, starsOut, trainX, cloudX,
-  birdsAt, pigeonsAt, frameOf,
+  birdsAt, pigeonsAt, frameOf, stationClock, trainAt, boardFirst, marketStages, lanternsLit, steamFrame, catAt, TRAIN,
 } from './scene.js';
 import { STOCK, PEDALS, owns, stockItem } from './gear.js';
 import { card, trying, CARD, BUTTON } from './shop.js';
@@ -44,6 +45,9 @@ const CUE_LEFT_MIN = 177; // keeps "rec" clear of the case sprite's rim, whose r
 const BEATS_PER_BAR = 4; // every beat's 4/4 meter: always 4, unlike LOOP.bars (how many bars a loop take is)
 const NOD_SHOW = 1.2; // seconds the shopkeeper nods after a sale...
 const NOD_FPS = 4; // ...this many nods a second
+const BOARD_ROWS = 4; // trains on the station's departure board
+const BACKING = 0.55; // how dark the backing behind the bottom line's words and the gear strip is...
+const BACKING_TOP = 168, BACKING_H = 11; // ...and where it runs (the line's text sits at y 170)
 
 // Your last notes tagged by shape: notes completing the same shape share a letter; '-' completes none.
 export function shapeTags(shapes) {
@@ -161,14 +165,19 @@ export function createRenderer(g, art) {
   };
   const bandOf = (y) => data.bands.findLastIndex((b) => b <= y);
 
-  // Back to front: the sky and what's in it, the rooftops, the trees, the hedge and path, the lamp.
-  function park({ bars, t, time, still, set, scene, flocks }) {
-    const bar = Math.floor(bars);
-    const stages = skyStages(bar);
+  // The sky's bands, each in its stage's colour (stages: one for each band, top down).
+  function sky(stages) {
     data.bands.forEach((top, i) => {
       const bottom = data.bands[i + 1] ?? data.skyBottom + 1;
       px(0, top, W, bottom - top, data.sky[stages[i]][i]);
     });
+  }
+
+  // Back to front: the sky and what's in it, the rooftops, the trees, the hedge and path, the lamp.
+  function park({ bars, t, time, still, set, scene, flocks }) {
+    const bar = Math.floor(bars);
+    const stages = skyStages(bar);
+    sky(stages);
     data.stars.slice(0, starsOut(bar)).forEach(([x, y], i) => {
       const bright = still || Math.sin(time * 0.9 + i * 2.3) > -0.3;
       px(x, y, 1, 1, bright ? C.light : C.grey);
@@ -192,9 +201,58 @@ export function createRenderer(g, art) {
     sprite(`lamp-${lamp}`, 0, 0);
   }
 
+  // The station at rush hour, back to front: the sky through the glass roof and the arches (darkening as
+  // the park's does), the far city, the hall, the train while one is in (its doors open as its
+  // passengers step off), and in front of it the pillars, the lamps, the board, the clock and the
+  // platform. The board lists the trains still to go, the next one brightest; the clock's hands run
+  // from half past five to half past six.
+  function station({ bars, t, set }) {
+    const stages = skyStages(Math.floor(bars));
+    sky(stages);
+    sprite(`station-city-${stages[6]}`, 0, 0);
+    sprite('station-hall', 0, 0);
+    const trains = set ? set.crowd.trains : [];
+    const train = trainAt(trains, t);
+    if (train) for (let k = 0; k < TRAIN.cars; k++) sprite(`station-car-${train.doors ? 1 : 0}`, train.x + k * TRAIN.car, 0);
+    sprite('station-front', 0, 0);
+    const [x0, y0, x1] = data.station.board, first = boardFirst(trains, t);
+    for (let r = 0; r < BOARD_ROWS; r++) {
+      const n = first + r, y = y0 + 3 + r * 5, c = r === 0 ? C.gold : C.goldDark;
+      px(x0 + 3, y, 10, 3, c); // its time
+      for (let k = 0; k < 6; k++) { // and where it's going, a word or two
+        const len = 3 + ((n * 7 + k * 13 + 3) % 5), wx = x0 + 16 + k * 8;
+        if (wx + len < x1 - 3 && (n + k) % 4 !== 3) px(wx, y, len, 3, c);
+      }
+    }
+    const [cx, cy, radius] = data.station.clock, { hour, minute } = stationClock(bars);
+    const hand = (turn, len) => {
+      for (let d = 0; d <= len * 2; d++) {
+        px(cx + Math.round((Math.sin(turn * Math.PI * 2) * d) / 2), cy - Math.round((Math.cos(turn * Math.PI * 2) * d) / 2), 1, 1, C.ink);
+      }
+    };
+    hand(((hour % 12) + minute / 60) / 12, radius - 4);
+    hand(minute / 60, radius - 2);
+    px(cx, cy, 1, 1, C.red);
+  }
+
+  // The night market, back to front: the sky from blue hour to night, its stars, the far skyline, the
+  // stalls and the noodle pot's steam, the strings with their lanterns (lighting one by one), and the
+  // brick street.
+  function market({ bars, time, still }) {
+    sky(marketStages(Math.floor(bars)));
+    data.market.stars.forEach(([x, y], i) => px(x, y, 1, 1, still || Math.sin(time * 0.9 + i * 2.3) > -0.3 ? C.light : C.grey));
+    sprite('market-skyline', 0, 0);
+    sprite('market-stalls', 0, 0);
+    sprite(`market-steam-${steamFrame(time, still)}`, 0, 0);
+    sprite('market-strings', 0, 0);
+    const lit = lanternsLit(bars, data.market.lanterns.length);
+    data.market.lanterns.forEach(([x, y, c], i) => sprite(i < lit ? `lantern-${c}` : 'lantern-off', x, y));
+    sprite('market-street', 0, 0);
+  }
+
   // Everyone and everything standing on the path, nearest last: the listeners, you, your pedals, the
-  // loop pedal and the amp, the speaker, the case and its coins, and the pigeons on the ground.
-  // Returns the pigeons in the air, drawn later.
+  // loop pedal and the amp, the speaker, the case and its coins, and the pigeons on the ground (at the
+  // night market, the cat). Returns the pigeons in the air, drawn later.
   function figures({ set, scene, t, time, gear, loop }) {
     const things = [
       { y: data.feet.you, draw: () => sprite(youFrame(scene, t, time, gear.instrument), 0, 0) },
@@ -217,7 +275,9 @@ export function createRenderer(g, art) {
     if (owns(gear, 'loop')) things.push({ y: data.feet.loop, draw: () => sprite(`pedal-loop-${loopLight(loop, t)}`, 0, 0) });
     if (set) for (const p of set.crowd.people) things.push({ y: p.y, draw: () => sprite(personFrame(p, t, time, set.clock.beat), p.x, p.y) });
     const flying = [];
-    for (const b of pigeonsAt(scene, t, time)) {
+    const cat = scene.place === 'market' ? catAt(scene, t, time) : null;
+    if (cat) things.push({ y: cat.y, draw: () => sprite(`cat-${cat.pose}-${cat.frame}-${cat.dir > 0 ? 'right' : 'left'}`, cat.x, cat.y) });
+    for (const b of scene.place === 'market' ? [] : pigeonsAt(scene, t, time)) {
       const name = `pigeon-${b.pose}-${b.frame}-${b.dir > 0 ? 'right' : 'left'}`;
       if (b.pose === 'fly') flying.push(() => sprite(name, b.x, b.y));
       else things.push({ y: b.y, draw: () => sprite(name, b.x, b.y) });
@@ -298,16 +358,30 @@ export function createRenderer(g, art) {
     }
   }
 
+  // A dark backing behind a piece of the bottom line, so it reads on any ground (the station's platform
+  // is pale), leaving the pigeons or the cat beside it alone.
+  function backing(x, w) {
+    g.globalAlpha = BACKING;
+    px(x, BACKING_TOP, w, BACKING_H, C.ink);
+    g.globalAlpha = 1;
+  }
+
   function hud({ keys, gear, stomp, loop, loopSaid, t, time }, set) {
+    backing(0, keys.lock ? 102 : 74);
     text(`oct ${keys.octave >= 0 ? '+' : ''}${keys.octave}`, 4, 170);
     for (let i = 0; i < PLAY.strengthMax; i++) px(52 + i * 5, 172, 4, 4, i < keys.strength ? C.light : C.ink);
     if (keys.lock) text('lock', 78, 170, C.gold);
-    if (set) text(`bar ${Math.min(set.bars, Math.floor(set.t / set.clock.bar) + 1)}/${set.bars}`, W - 4, 170, C.light, 'right');
+    if (set) {
+      const bar = `bar ${Math.min(set.bars, Math.floor(set.t / set.clock.bar) + 1)}/${set.bars}`;
+      backing(W - 8 - Math.ceil(measure(bar)), Math.ceil(measure(bar)) + 8);
+      text(bar, W - 4, 170, C.light, 'right');
+    }
     // The gear strip: each pedal you own in its own place, with its key, lit while it's on; the name
     // of the one just stomped shows above it for a moment.
     PEDALS.forEach((id, i) => {
       if (!owns(gear, id)) return;
       const on = gear.on.includes(id), x = STRIP_X + i * STRIP_STEP;
+      backing(x - 1, STRIP_STEP);
       sprite(`strip-${id}-${on ? 1 : 0}`, x, 170);
       text(String(stockItem(id).key), x + 9, 170, on ? C.light : C.grey);
     });
@@ -315,6 +389,7 @@ export function createRenderer(g, art) {
     // hold, lit for each recorded and red for the one recording.
     if (owns(gear, 'loop')) {
       const x = STRIP_X + LOOP_SLOT * STRIP_STEP, state = loop ? loopState(loop, t) : 'empty';
+      backing(x - 1, 16 + LOOP.layers * 4);
       sprite(`strip-loop-${loopLight(loop, t)}`, x, 170);
       text('R', x + 9, 170, state === 'empty' ? C.grey : C.light);
       const layers = loop?.layers.length ?? 0;
@@ -486,7 +561,7 @@ export function createRenderer(g, art) {
     g.imageSmoothingEnabled = false;
     if (screen === 'shop') return shopView(view);
     if (screen === 'studio') return drawStudio({ px, text, big, measure, C }, view.studio, t);
-    park(view);
+    ({ park, station, market })[scene.place](view);
     const flying = figures(view);
     if (set) {
       for (const p of set.crowd.people) {
````

- [ ] **Step 4: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 376 tests.

- [ ] **Step 5: Commit**

```bash
git add open-case/src/render.js open-case/test/render.test.js
git commit -m "Open Case: the game draws the station and the night market: the train in and out, the board and the clock, the lanterns lighting, the cat; the bottom line gets a dark backing

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: The map's art

**Files:**
- Create: `art/open-case/map/layout.py`, `art/open-case/map/land.py`, `art/open-case/map/places.py`, `open-case/test/map.test.js`
- Written by the scripts: `open-case/assets/map/` (`land.png`, `map.json`, and a picture each: `park`, `station`, `market`, `city`, `suburb1`, `suburb2`, `village`, `farm`, `lighthouse`, `marina`, `suspension`, `truss`, `cloud1`, `cloud2`)

**Interfaces:**
- Produces `open-case/assets/map/map.json`:
  - `size: [1920, 1080]` (the map in screen pixels; the land is drawn at twice its 960x540);
  - `land: 'land.png'`;
  - `pictures: [{ name, x, y }]`: each picture's top left, in drawing order, the city first;
  - `places: { park | station | market: { name, pin: [x, y], label: [x, y], view: [x, y] } }`;
  - `clouds: [{ name, x, y }]`: each drawn at twice its size.

- [ ] **Step 1: Write the failing tests**

Create `open-case/test/map.test.js`:

````js
// Checks the committed map (open-case/assets/map/, written by art/open-case/map/land.py and places.py)
// against what the map screen expects: every picture map.json names is there and lies on the map, each
// place to busk has its pin, label and view on the map, and the whole map stays small.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { readPng } from './png.js';
import { PLACE_IDS, PLACE_WORDS } from '../src/places.js';

const dir = new URL('../assets/map/', import.meta.url);
const map = JSON.parse(readFileSync(new URL('map.json', dir), 'utf8'));
const [W, H] = map.size;
const png = (name) => readPng(new URL(`${name}.png`, dir));

test('the land is half the map each way, shown at twice its size', () => {
  const land = readPng(new URL(map.land, dir));
  assert.deepEqual([land.w * 2, land.h * 2], [W, H]);
});

test('every picture map.json names is there and lies on the map, the city first, under the rest', () => {
  assert.equal(map.pictures[0].name, 'city');
  const names = map.pictures.map((p) => p.name);
  for (const want of [...PLACE_IDS, 'city', 'suspension', 'truss', 'village', 'lighthouse', 'marina', 'farm']) assert.ok(names.includes(want), want);
  assert.equal(new Set(names).size, names.length, 'each once');
  for (const { name, x, y } of map.pictures) {
    const { w, h } = png(name);
    assert.ok(x >= 0 && y >= 0 && x + w <= W && y + h <= H, `${name} at ${x}, ${y}, ${w}x${h}`);
  }
  for (const { name, x, y } of map.clouds) {
    assert.ok(png(name).w > 0 && x >= 0 && x < W && y >= 0 && y < H, `${name} at ${x}, ${y}`);
  }
});

test("each place to busk has its picture, its name, and its pin, label and view on the map, the pin over the picture", () => {
  assert.deepEqual(Object.keys(map.places), PLACE_IDS);
  for (const id of PLACE_IDS) {
    const p = map.places[id], pic = map.pictures.find((q) => q.name === id), { w, h } = png(id);
    assert.equal(p.name, PLACE_WORDS[id].name);
    for (const [x, y] of [p.pin, p.label, p.view]) assert.ok(x >= 0 && x < W && y >= 0 && y < H, `${id}: ${x}, ${y}`);
    assert.ok(p.pin[0] > pic.x && p.pin[0] < pic.x + w && p.pin[1] >= pic.y - 6 && p.pin[1] < pic.y + h, `${id}'s pin`);
    assert.ok(p.label[1] > p.pin[1], `${id}'s label hangs under it`);
  }
});

test('the whole map stays under 500 KB', () => {
  const bytes = readdirSync(dir).reduce((sum, f) => sum + statSync(new URL(f, dir)).size, 0);
  assert.ok(bytes < 500 * 1024, `${bytes} bytes`);
});
````

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL. `test/map.test.js` can't load (`ENOENT`: there's no `assets/map/map.json` yet). That's 1 failing file; the other 376 tests pass.

- [ ] **Step 3: The scripts**

Create `art/open-case/map/layout.py`:

````python
# The lie of Open Case's map, shared by land.py (which paints the land) and places.py (which draws the
# places, the city and the bridges on it, and writes map.json): the coast, the lake, the river, the
# roads, the paths and the railway, where each picture stands, and the noise and colour helpers both
# draw with. Everything here is in land pixels: the land is W x H, and the game shows it at SCALE
# times that size, with the pictures on it drawn at one screen pixel each (twice the land's detail).
import math
from pathlib import Path
from PIL import Image, ImageDraw

W, H = 960, 540
SCALE = 2
ROOT = Path(__file__).resolve().parents[3]  # the repo
OUT = ROOT / 'open-case' / 'assets' / 'map'

# ---------------------------------------------------------------------------------------------
# Noise and colour

def hsh(ix, iy, seed):
    """A repeatable number in [0, 1] for whole numbers ix, iy and a seed."""
    n = (int(ix) * 374761393 + int(iy) * 668265263 + seed * 2147483647) & 0xffffffff
    n = ((n ^ (n >> 13)) * 1274126177) & 0xffffffff
    return ((n ^ (n >> 16)) & 0xffff) / 65535.0

def vnoise(x, y, seed):
    ix, iy = math.floor(x), math.floor(y)
    fx, fy = x - ix, y - iy
    sx, sy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    a, b = hsh(ix, iy, seed), hsh(ix + 1, iy, seed)
    c, d = hsh(ix, iy + 1, seed), hsh(ix + 1, iy + 1, seed)
    return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy

def fbm(x, y, seed, scale=40.0, octaves=4):
    """Smooth noise in [0, 1], its features about `scale` pixels across."""
    v, amp, tot, f = 0.0, 1.0, 0.0, 1.0 / scale
    for o in range(octaves):
        v += vnoise(x * f, y * f, seed + o * 17) * amp
        tot += amp
        amp *= 0.5
        f *= 2
    return v / tot

def mix(a, b, t):
    t = max(0.0, min(1.0, t))
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def step(cols, t):
    """The colour of a ramp at t in [0, 1], in hard steps, for crisp pixel shading."""
    t = max(0.0, min(0.999, t))
    return cols[int(t * len(cols))]

def darker(c, k):
    return tuple(max(0, int(v * (1 - k))) for v in c[:3])

def lighter(c, k):
    return tuple(min(255, int(v + (255 - v) * k)) for v in c[:3])

def catmull(pts, n=24):
    """A smooth curve through the points, n steps between each pair."""
    out = []
    for i in range(len(pts) - 1):
        p0, p1 = pts[max(0, i - 1)], pts[i]
        p2, p3 = pts[i + 1], pts[min(len(pts) - 1, i + 2)]
        for k in range(n):
            t = k / n
            t2, t3 = t * t, t * t * t
            out.append(tuple(0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2
                                    + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3) for j in range(2)))
    out.append(pts[-1])
    return out

# ---------------------------------------------------------------------------------------------
# The land

def coast(y):
    """The western sea's edge at row y: the sea is everything left of it, widening into the bay."""
    return 70 + 26 * math.sin(y / 70) + 30 * fbm(0, y, 5, 50, 3) + (max(0, y - 380) ** 1.3) * 0.75

# The river, from the lake's waterfall down through town (north to south past the station, where the
# road and the railway cross it) and west into the bay.
RIVER = [(842, 150), (812, 186), (770, 214), (726, 240), (702, 270), (692, 300), (690, 330), (688, 360), (680, 392),
         (650, 424), (596, 446), (530, 458), (460, 466), (390, 474), (320, 482), (250, 494)]
LAKE = (838, 104, 74, 42)  # its middle and radii
ISLANDS = [(856, 98, 12, 7), (812, 112, 6, 4), (40, 150, 6, 4), (26, 330, 8, 5)]  # two in the lake, two off the coast

ROADS = [
    [(424, 438), (452, 408), (490, 370), (528, 330), (560, 298), (604, 270)],  # the market to the station
    [(404, 262), (450, 276), (490, 290), (528, 300), (560, 298)],  # the park into town
    [(604, 270), (630, 300), (650, 330), (668, 342), (692, 344), (716, 342), (744, 352), (770, 384), (790, 420)],  # over the suspension bridge
    [(404, 262), (360, 270), (300, 290), (250, 318), (200, 330), (140, 340), (90, 330)],  # the park to the coast
    [(604, 270), (626, 230), (650, 200), (650, 150), (680, 90), (720, 40), (760, -10)],  # north, past the village
    [(424, 438), (392, 446), (366, 456)],  # down to the marina
    [(790, 420), (830, 460), (870, 500), (920, 512), (970, 520)],  # out past the farm
    [(404, 262), (420, 200), (400, 140), (360, 80), (340, -10)],  # north from the park
]
PATHS = [
    [(120, 178), (150, 210), (200, 240), (250, 318)],
    [(650, 150), (700, 142), (736, 152), (758, 172)],
    [(652, 512), (682, 490), (710, 470)],
    [(84, 262), (104, 282), (140, 340)],
    [(860, 200), (900, 240), (940, 300), (970, 330)],
]
RAIL = [(970, 300), (900, 300), (830, 300), (760, 300), (712, 300), (692, 300), (672, 300), (646, 292), (622, 274), (606, 262)]

# Where each picture stands (places.py): its bottom middle and the size of the clear ground it needs,
# where no trees grow: (x, y, w, h).
PICTURES = {
    'park': (404, 262, 80, 50), 'station': (604, 270, 92, 52), 'market': (424, 438, 76, 44),
    'suburb1': (250, 318, 70, 34), 'suburb2': (790, 420, 70, 34), 'farm': (870, 500, 54, 34),
    'lighthouse': (120, 178, 26, 30), 'marina': (334, 478, 60, 26), 'village': (650, 150, 56, 30),
}
PLACES = ['park', 'station', 'market']  # the pictures that are places to busk
# Where the road and the railway cross the river, on bridges drawn from the side: each deck's left end
# and its length.
BRIDGES = {'suspension': (664, 344, 48), 'truss': (670, 300, 44)}
# The city's outline: its buildings spread over the land between the park, the station and the village.
CITY = [(448, 296), (446, 236), (456, 196), (480, 160), (520, 132), (566, 118), (612, 116), (642, 152), (676, 160),
        (690, 196), (682, 236), (668, 270), (652, 298), (600, 304), (520, 306)]
CITY_HEART = (604, 246)  # the towers crowd round here, by the station
CLOUDS = [('cloud1', 150, 60), ('cloud2', 750, 320), ('cloud1', 590, 45), ('cloud2', 60, 430)]  # each one's start

def in_city(x, y):
    inside = False
    for i in range(len(CITY)):
        (x1, y1), (x2, y2) = CITY[i], CITY[(i + 1) % len(CITY)]
        if (y1 > y) != (y2 > y) and x < x1 + (y - y1) * (x2 - x1) / (y2 - y1):
            inside = not inside
    return inside

def in_clearing(x, y, pad=0):
    return any(cx - w / 2 - pad <= x <= cx + w / 2 + pad and by - h - pad <= y <= by + pad for (cx, by, w, h) in PICTURES.values())

def on_bridge(x, y):
    return any(bx - 2 <= x <= bx + bl + 2 and by - 6 <= y <= by + 6 for (bx, by, bl) in BRIDGES.values())

def masks():
    """The land's masks, each an 'L' image, 255 where it is: the water (the sea, the lake with its
    islands, the river), the roads with their kerbs, the roads alone, the paths, and round the railway."""
    def mask():
        m = Image.new('L', (W, H), 0)
        return m, ImageDraw.Draw(m)
    water, wd = mask()
    for y in range(H):
        wd.line((0, y, coast(y), y), fill=255)
    river = catmull(RIVER, 30)
    for i, (x, y) in enumerate(river):
        w = 7 + 6 * i / len(river) + 2 * fbm(i, 0, 77, 14, 2)
        wd.ellipse((x - w, y - w, x + w, y + w), fill=255)
    lx, ly, lrx, lry = LAKE
    wd.polygon([(lx + lrx * (1 + 0.25 * (fbm(k, 3, 81, 5, 2) - 0.5)) * math.cos(k / 48 * 6.283),
                 ly + lry * (1 + 0.25 * (fbm(k, 3, 81, 5, 2) - 0.5)) * math.sin(k / 48 * 6.283)) for k in range(48)], fill=255)
    for (ix, iy, rx, ry) in ISLANDS:
        wd.ellipse((ix - rx, iy - ry, ix + rx, iy + ry), fill=0)
    kerb, kd = mask()
    road, rd = mask()
    for r in ROADS:
        for (x, y) in catmull(r, 40):
            kd.ellipse((x - 4, y - 4, x + 4, y + 4), fill=255)
            rd.ellipse((x - 3, y - 3, x + 3, y + 3), fill=255)
    path, pd = mask()
    for p in PATHS:
        for (x, y) in catmull(p, 40):
            pd.ellipse((x - 2, y - 2, x + 2, y + 2), fill=255)
    rail, rld = mask()
    for (x, y) in catmull(RAIL, 40):
        rld.ellipse((x - 7, y - 7, x + 7, y + 4), fill=255)
    return {'water': water, 'kerb': kerb, 'road': road, 'path': path, 'rail': rail}
````

Create `art/open-case/map/land.py`:

````python
# Paints the land of Open Case's map, after Nathan's reference (his friend's atlas): a lush world seen
# from above, with mottled grass and flowers, terraced hills of pines with cliffs, the sea and its
# beaches, a lake with islands and a waterfall, the river, farm fields, roads, paths and the railway,
# forests and rocks. The places, the city and the bridges are drawn on top by places.py. Run from the
# repo root (Python 3 with Pillow):
#   python3 art/open-case/map/land.py
# Writes open-case/assets/map/land.png. It's deterministic: an unchanged script writes the same bytes.
# It stops with an error if a road, a path or the railway crosses water anywhere but on a bridge.
import math
from collections import deque
import sys
from PIL import Image, ImageDraw
sys.dont_write_bytecode = True  # no __pycache__ beside the scripts
from layout import (W, H, OUT, hsh, fbm, mix, step, darker, lighter, catmull, coast, ROADS, PATHS, RAIL, ISLANDS,
                    PICTURES, BRIDGES, in_city, in_clearing, on_bridge, masks)

img = Image.new('RGB', (W, H))
P = img.load()

def put(x, y, c):
    if 0 <= x < W and 0 <= y < H:
        P[x, y] = c

def shade(x, y, k):
    if 0 <= x < W and 0 <= y < H:
        P[x, y] = darker(P[x, y], k)

# daylight with a warm cast
GRASS_WARM = [(74, 112, 40), (96, 134, 44), (122, 156, 52), (150, 174, 62), (180, 190, 84), (204, 204, 112)]
GRASS_COOL = [(48, 96, 52), (62, 116, 56), (82, 138, 62), (108, 158, 70), (136, 176, 82), (168, 194, 104)]
LEAF = [(16, 40, 36), (24, 58, 44), (34, 80, 50), (50, 104, 54), (76, 130, 58), (114, 156, 66), (158, 182, 86)]
LEAF_Y = [(30, 52, 30), (50, 78, 34), (76, 108, 40), (108, 136, 46), (146, 162, 58), (186, 186, 82), (222, 210, 120)]
PINE = [(12, 34, 34), (18, 50, 44), (26, 68, 54), (38, 90, 64), (60, 116, 72), (92, 140, 82)]
WATER = [(30, 84, 134), (34, 100, 150), (40, 120, 164), (52, 140, 174), (72, 162, 182), (106, 188, 190)]
FOAM = (214, 238, 228)
SAND = [(190, 160, 104), (214, 188, 132), (234, 212, 160), (246, 230, 186)]
CLIFF = [(54, 46, 44), (78, 66, 58), (104, 88, 72), (132, 114, 92), (160, 142, 116)]
ROCK = [(62, 64, 70), (92, 94, 100), (128, 128, 130), (164, 162, 158), (200, 196, 186)]
DIRT = [(118, 88, 56), (150, 116, 74), (182, 148, 98), (206, 176, 124)]
ROAD = [(64, 64, 74), (84, 84, 94), (104, 104, 112)]

M = masks()
WA, KA, RA, PA, RCA = (M[k].load() for k in ('water', 'kerb', 'road', 'path', 'rail'))

def wet(x, y):
    return 0 <= x < W and 0 <= y < H and WA[x, y] > 0

# How far each water pixel is from the shore (1 at the edge, up to 16), for the water's depth.
dist = {}
q = deque()
for y in range(H):
    for x in range(W):
        if WA[x, y] and any(0 <= x + dx < W and 0 <= y + dy < H and not wet(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            dist[(x, y)] = 1
            q.append((x, y))
while q:
    x, y = q.popleft()
    if dist[(x, y)] >= 16:
        continue
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        n = (x + dx, y + dy)
        if wet(*n) and n not in dist:
            dist[n] = dist[(x, y)] + 1
            q.append(n)

# The hills: terraces rising to the north (and to the lake), each a step up with a cliff on its south
# face.
def level(x, y):
    e = fbm(x, y, 91, 150, 4) * 0.9 + max(0, (170 - y) / 170) * 0.75 + max(0, (x - 700) / 260) * max(0, (260 - y) / 260) * 0.4
    return 0 if e < 0.78 else (1 if e < 0.98 else 2)
LEVEL = [[level(x, y) for x in range(W)] for y in range(H)]
def lv(x, y):
    return LEVEL[y][x] if 0 <= x < W and 0 <= y < H else 0

# ---------------------------------------------------------------------------------------------
# The ground: grass mottled warm and cool, cliffs and lit lips on the terraces, the beach, the water

for y in range(H):
    for x in range(W):
        if WA[x, y]:
            continue
        hue, n, m = fbm(x, y, 11, 220, 3), fbm(x, y, 13, 70, 4), fbm(x, y, 17, 6, 2)
        t = 0.2 + n * 0.62 + (m - 0.5) * 0.42 + lv(x, y) * 0.06
        P[x, y] = step(GRASS_WARM, t) if hue + (hsh(x, y, 19) - 0.5) * 0.08 > 0.52 else step(GRASS_COOL, t)
for y in range(H):
    for x in range(W):
        if WA[x, y]:
            continue
        L = lv(x, y)
        if max(lv(x, y - k) for k in range(1, 7)) > L:
            k = next(k for k in range(1, 7) if lv(x, y - k) > L)  # how far down the cliff's face
            stripe = (x * 3 + int(hsh(x, 0, 23) * 4)) % 5
            t = 0.75 - k * 0.1 + (0.12 if stripe == 0 else (-0.12 if stripe == 3 else 0)) + (hsh(x, y, 29) - 0.5) * 0.15
            P[x, y] = step(CLIFF, t)
            if k == 6 or lv(x, y + 1) > L:
                P[x, y] = darker(P[x, y], 0.2)
        elif lv(x, y + 1) < L:
            P[x, y] = lighter(P[x, y], 0.25)
for y in range(H):
    for x in range(W):
        if WA[x, y]:
            continue
        d = min((abs(dx) + abs(dy) for dx in range(-6, 7) for dy in (-2, 0, 2) if wet(x + dx, y + dy) and (x + dx) < coast(y + dy) + 2), default=99)
        if d <= 5 and x < coast(y) + 12:
            P[x, y] = step(SAND, 0.15 + d * 0.15 + (hsh(x, y, 31) - 0.5) * 0.2)
for y in range(H):
    for x in range(W):
        if WA[x, y]:
            d = dist.get((x, y), 16)
            c = step(WATER, 0.98 - d * 0.055 + (fbm(x, y, 41, 16, 3) - 0.5) * 0.25)
            if d == 1 and hsh(x, y, 43) < 0.8:
                c = FOAM
            elif d == 2 and hsh(x, y, 45) < 0.35:
                c = lighter(c, 0.35)
            elif hsh(x, y, 47) < 0.0012:
                c = (226, 242, 238)
            P[x, y] = c
for i in range(900):  # little waves on open water
    x, y = int(hsh(i, 1, 49) * W), int(hsh(i, 2, 49) * H)
    if wet(x, y) and wet(x + 3, y) and dist.get((x, y), 16) > 4:
        for k in range(3):
            put(x + k, y, lighter(P[x + k, y], 0.3))
for y in range(150, 168):  # the waterfall where the river leaves the lake
    for x in range(836, 852):
        if wet(x, y) and hsh(x, y, 51) < 0.6:
            P[x, y] = (226, 240, 236) if (x + y // 2) % 3 else (176, 214, 218)
for i in range(260):  # patches of flowers
    cx, cy = int(hsh(i, 1, 61) * W), int(hsh(i, 2, 61) * H)
    col = [(236, 232, 206), (232, 200, 90), (214, 142, 160), (190, 210, 240)][int(hsh(i, 3, 61) * 4)]
    for k in range(5):
        x, y = cx + int(hsh(i, k, 63) * 6) - 3, cy + int(hsh(i, k, 65) * 4) - 2
        if 0 <= x < W and 0 <= y < H and not wet(x, y) and (P[x, y] in GRASS_WARM or P[x, y] in GRASS_COOL):
            P[x, y] = col

# ---------------------------------------------------------------------------------------------
# Fields: a patchwork of crops in the south east, with hedges between

FIELDS = []
for fy in range(372, H, 34):
    for fx in range(712, W, 46):
        if not in_clearing(fx + 20, fy + 30, 6) and not any(wet(fx + dx, fy + dy) for dx in (0, 20, 46) for dy in (0, 16, 32)):
            FIELDS.append((fx + int(hsh(fx, fy, 61) * 6), fy + int(hsh(fx, fy, 62) * 4), 40 + int(hsh(fx, fy, 63) * 6), 28, int(hsh(fx, fy, 64) * 4)))
CROPS = [((214, 186, 96), (186, 154, 72)), ((152, 176, 70), (118, 146, 58)), ((150, 110, 74), (122, 88, 60)), ((196, 200, 110), (164, 172, 88))]
for (x0, y0, w, h, k) in FIELDS:
    a, b = CROPS[k]
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            if 0 <= x < W and 0 <= y < H and not WA[x, y]:
                stripe = ((y - y0) % 3 == 0) if k != 1 else ((x - x0 + (y - y0) // 2) % 4 == 0)
                c = b if stripe else a
                P[x, y] = lighter(c, 0.15) if hsh(x, y, 65) < 0.06 else c
    for x in range(x0, x0 + w):
        put(x, y0 + h, (54, 84, 40))
        put(x, y0 + h + 1, (40, 66, 34))
    for y in range(y0, y0 + h + 2):
        put(x0 + w, y, (54, 84, 40))

# ---------------------------------------------------------------------------------------------
# Paths, roads (their decks under the bridges' pictures where they cross the river) and the railway

for y in range(H):
    for x in range(W):
        if PA[x, y] and not KA[x, y]:
            inner = all(PA[min(W - 1, x + dx), min(H - 1, y + dy)] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
            P[x, y] = step(DIRT, (0.6 if inner else 0.25) + (hsh(x, y, 71) - 0.5) * 0.3)
for y in range(H):
    for x in range(W):
        if KA[x, y]:
            if WA[x, y]:
                P[x, y] = (150, 144, 136) if not RA[x, y] else (112, 110, 116)
            else:
                P[x, y] = (178, 170, 154) if not RA[x, y] else step(ROAD, 0.45 + (hsh(x, y, 73) - 0.5) * 0.3)
for road in ROADS:  # the centre lines, dashed
    for i, (x, y) in enumerate(catmull(road, 80)):
        if (i // 3) % 2 == 0 and not in_clearing(x, y):
            put(int(x), int(y), (228, 214, 166))
line = [(int(x), int(y)) for (x, y) in catmull(RAIL, 60) if 0 <= x < W and 0 <= y < H]
for i, (x, y) in enumerate(line):
    for dy in range(-2, 3):
        if not KA[x, min(H - 1, max(0, y + dy))]:
            put(x, y + dy, (66, 48, 38) if i % 2 == 0 else ((96, 82, 72) if not wet(x, y + dy) else (84, 78, 76)))
for (x, y) in line:
    for dy in (-1, 1):
        if not KA[x, min(H - 1, max(0, y + dy))]:
            put(x, y + dy, (190, 188, 184))

# The ground under each picture, a lighter mown green, where no trees grow
for (cx, by, w, h) in PICTURES.values():
    for y in range(int(by - h), int(by) + 1):
        for x in range(int(cx - w / 2), int(cx + w / 2) + 1):
            if 0 <= x < W and 0 <= y < H and not WA[x, y] and not KA[x, y]:
                dx, dy = (x - cx) / (w / 2), (y - (by - h / 2)) / (h / 2)
                if dx * dx + dy * dy <= 0.8:
                    P[x, y] = mix(P[x, y], (128, 168, 70), 0.35)

# ---------------------------------------------------------------------------------------------
# What stands on the land, back to front: trees and rocks

things = []
def stand(y, f):
    things.append((y, len(things), f))

def rock(cx, cy, r, seed):
    for y in range(cy - 1, cy + 3):
        for x in range(cx, cx + r + 3):
            shade(x, y, 0.3)
    for y in range(cy - r, cy + 1):
        for x in range(cx - r, cx + r + 1):
            dx, dy = (x - cx) / (r + 0.5), (y - cy + r * 0.3) / (r * 0.8 + 0.5)
            if dx * dx + dy * dy <= 1:
                edge = dx * dx + dy * dy > 0.7 and (dx > 0.3 or dy > 0.3)
                put(x, y, ROCK[0] if edge else step(ROCK, 0.6 - dx * 0.25 - dy * 0.35 + (hsh(x, y, seed) - 0.5) * 0.3))

# A tree standing at (cx, cy), r its size: its shadow cast to the lower right, then a pine in tiers,
# or a round crown of a few overlapping blobs, each lit from the top left, outlined below and right.
def tree(cx, cy, r, seed, kind='leaf'):
    for y in range(int(cy - r * 0.5), int(cy + r * 0.5) + 2):
        for x in range(int(cx - r * 0.2), int(cx + r * 1.9)):
            dx, dy = (x - (cx + r * 0.75)) / (r * 1.15), (y - cy) / (r * 0.5)
            if dx * dx + dy * dy <= 1:
                shade(x, y, 0.3)
    if kind == 'pine':
        top = cy - r * 2.8
        for y in range(int(top), int(cy) + 1):
            k = (y - top) / (cy - top)
            tier = ((y - int(top)) % 5) / 5
            half = max(0.6, r * (0.25 + k * 0.75) * (0.75 + tier * 0.35))
            for x in range(int(cx - half), int(cx + half) + 1):
                t = 0.7 - (x - cx) / (half + 1) * 0.4 - tier * 0.25 - k * 0.15 + (hsh(x, y, seed) - 0.5) * 0.2
                put(x, y, PINE[0] if x >= int(cx + half) or y == int(cy) else step(PINE, t))
        put(int(cx), int(cy) + 1, (58, 40, 30))
        return
    ramp = LEAF_Y if kind == 'yellow' else LEAF
    put(int(cx), int(cy), (64, 42, 30))
    put(int(cx), int(cy) - 1, (84, 56, 36))
    blobs = []
    for k in range(3 + int(hsh(seed, 1, 92) * 3)):
        a, d = hsh(k, seed, 91) * 6.28, 0 if k == 0 else r * 0.5
        blobs.append((cx + math.cos(a) * d, cy - r * 1.1 + math.sin(a) * d * 0.7, r * (1 if k == 0 else 0.55 + hsh(k, seed, 93) * 0.25)))
    def inside(x, y):
        best = None
        for (bx, by, br) in blobs:
            if (x - bx) ** 2 + (y - by) ** 2 <= br * br and (best is None or by > best[1]):
                best = (bx, by, br)
        return best
    for y in range(int(cy - r * 2.6), int(cy) + 1):
        for x in range(int(cx - r * 1.7), int(cx + r * 1.7) + 1):
            b = inside(x + 0.5, y + 0.5)
            if not b:
                continue
            bx, by, br = b
            t = 0.6 - ((x - bx) * 0.45 + (y - by) * 0.75) / br * 0.45 + (hsh(x, y, seed) - 0.5) * 0.22
            if not inside(x + 1.5, y + 0.5) or not inside(x + 0.5, y + 1.5):
                c = ramp[0]
            elif not inside(x - 0.5, y - 0.5):
                c = ramp[min(len(ramp) - 1, int(t * len(ramp)) + 1)]
            else:
                c = step(ramp, t)
            put(x, y, c)

# Where a tree or a rock may stand: on dry ground, off the roads, paths and railway, clear of the
# pictures, the city, the bridges, the fields and the beach, and not on a cliff.
def clear(x, y):
    if not (0 <= x < W and 0 <= y < H) or wet(x, y) or wet(x, y + 2) or wet(x + 3, y):
        return False
    if KA[x, y] or PA[x, y] or RCA[x, y] or in_clearing(x, y, 4) or in_city(x, y):
        return False
    if any(bx - 4 <= x <= bx + bl + 4 and by - 24 <= y <= by + 8 for (bx, by, bl) in BRIDGES.values()):
        return False
    if any(f[0] - 2 <= x <= f[0] + f[2] + 2 and f[1] - 2 <= y <= f[1] + f[3] + 4 for f in FIELDS):
        return False
    return x >= coast(y) + 10 and not any(lv(x, y - k) > lv(x, y) for k in range(1, 8))

# Forests where the noise is high (and on the hills, mostly pines), a scatter of trees elsewhere.
for gy in range(-6, H + 10, 4):
    for gx in range(-6, W + 6, 5):
        x, y = gx + int(hsh(gx, gy, 141) * 5) - 2, gy + int(hsh(gx, gy, 142) * 5) - 2
        if not clear(x, y):
            continue
        f, hill, roll = fbm(x, y, 151, 80, 3), lv(x, y) > 0, hsh(gx, gy, 143)
        dense = f > 0.56 or (hill and f > 0.46)
        if dense or roll < 0.035:
            r = (3.6 + hsh(gx, gy, 144) * 2.4) if dense else (3 + hsh(gx, gy, 144) * 2)
            pick = hsh(gx, gy, 145)
            if hill and pick < 0.7:
                kind = 'pine'
            else:
                kind = 'yellow' if fbm(x, y, 157, 50, 2) > 0.62 and pick < 0.5 else ('pine' if pick < 0.15 else 'leaf')
            stand(y, lambda x=x, y=y, r=r, kind=kind: tree(x, y, r * (0.8 if kind == 'pine' else 1), x * 31 + y * 7, kind))
for i in range(320):  # rocks: on the hills, at the cliffs' feet, and here and there
    x, y = int(hsh(i, 1, 171) * W), int(hsh(i, 2, 171) * H)
    if clear(x, y) and (lv(x, y) > 0 or hsh(i, 3, 171) < 0.25 or any(lv(x, y - k) > lv(x, y) for k in range(8, 12))):
        stand(y, lambda x=x, y=y, i=i: rock(x, y, 1 + int(hsh(i, 4, 171) * 3), i))
for (ix, iy, rx, ry) in ISLANDS[:2]:  # pines on the lake's islands
    stand(iy, lambda ix=ix, iy=iy, rx=rx: tree(ix, iy + 1, min(4, rx * 0.5), ix, 'pine'))
for (x0, y0, w, h, k) in FIELDS:  # hedgerow trees between the fields
    for x in range(x0, x0 + w, 9):
        if hsh(x, y0, 181) < 0.4:
            stand(y0 + h + 1, lambda x=x, y=y0 + h + 1: tree(x, y, 3, x * 3 + y, 'leaf'))

for _, _, f in sorted(things, key=lambda t: (t[0], t[1])):
    f()

# ---------------------------------------------------------------------------------------------
# Nothing crosses water but on a bridge

for kind, lines in (('road', ROADS), ('path', PATHS), ('railway', [RAIL])):
    for i, ln in enumerate(lines):
        for (x, y) in catmull(ln, 60):
            if 0 <= x < W and 0 <= y < H and WA[int(x), int(y)] and not on_bridge(x, y):
                raise SystemExit(f'{kind} {i} crosses water at ({int(x)}, {int(y)}) with no bridge')

OUT.mkdir(parents=True, exist_ok=True)
img.save(OUT / 'land.png', optimize=True)
print(f'land: {W}x{H}, {len(img.getcolors(W * H))} colours')
````

Create `art/open-case/map/places.py`:

````python
# Draws the pictures that stand on Open Case's map, at one screen pixel each (twice the land's detail,
# as Nathan's reference draws its towns), and writes where everything goes:
#   the three places to busk: the park (a ring of trees round a lawn, a pond, the bandstand), the station
#     (the glass train shed, its brick front and clock tower, a limestone forecourt with a fountain) and
#     the night market (striped stalls under lanterns on warm brick, townhouses behind, a boardwalk);
#   the city, in loose clusters over the land between the park, the station and the village: towers by
#     the station, flats further out, houses at the edges, trees in the gaps;
#   the settlements without a name: a village with a church, two suburbs, a farm, a lighthouse, a marina;
#   the bridges, seen from the side: a red suspension bridge for the road, two arched steel spans for
#     the railway; and two clouds.
# Run from the repo root after land.py (Python 3 with Pillow):
#   python3 art/open-case/map/places.py
# Writes open-case/assets/map/<picture>.png and map.json:
#   size      [w, h]: the map in screen pixels (the land at SCALE times its size)
#   land      the land's picture
#   pictures  [{ name, x, y }]: each picture's top left, in the order they're drawn (the city first)
#   places    { id: { name, pin: [x, y], label: [x, y], view: [x, y] } }: each place's picture, where its
#             gold pin points (just over its top), where its label hangs (under it), and the point the
#             view centres on when it's chosen
#   clouds    [{ name, x, y }]: where each cloud starts, drawn at SCALE times its size
# It's deterministic: an unchanged script writes the same bytes.
import json, math
import sys
from PIL import Image, ImageDraw
sys.dont_write_bytecode = True  # no __pycache__ beside the scripts
from layout import (W, H, SCALE, OUT, hsh, mix, step, darker, lighter, PICTURES, PLACES, BRIDGES, CITY, CITY_HEART, CLOUDS,
                    in_city, masks)

LEAF = [(16, 40, 36), (24, 58, 44), (34, 80, 50), (50, 104, 54), (76, 130, 58), (114, 156, 66), (158, 182, 86)]
PINE = [(12, 34, 34), (18, 50, 44), (26, 68, 54), (38, 90, 64), (60, 116, 72), (92, 140, 82)]
WALLS = [(222, 200, 166), (204, 160, 124), (234, 222, 200), (178, 126, 100), (210, 202, 186), (196, 176, 146), (232, 196, 150)]
ROOFS = [(162, 72, 58), (184, 96, 66), (112, 106, 112), (132, 82, 62), (96, 100, 118), (150, 62, 70)]
GLASS = [((106, 152, 176), (64, 104, 132)), ((134, 162, 172), (86, 112, 128)), ((80, 132, 150), (50, 92, 112)), ((150, 170, 190), (100, 116, 140))]


class Canvas:
    """A picture with see-through ground, and the few ways it's drawn on."""

    def __init__(self, w, h):
        self.w, self.h = w, h
        self.img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        self.P = self.img.load()
        self.d = ImageDraw.Draw(self.img)

    def put(self, x, y, c):
        x, y = int(x), int(y)
        if 0 <= x < self.w and 0 <= y < self.h:
            self.P[x, y] = c if len(c) == 4 else (c[0], c[1], c[2], 255)

    def get(self, x, y):
        x, y = int(x), int(y)
        return self.P[x, y] if 0 <= x < self.w and 0 <= y < self.h else (0, 0, 0, 0)

    def shade(self, x, y, k=0.32):
        """A shadow: darker where something's drawn, a soft dark where nothing is (on the land)."""
        x, y = int(x), int(y)
        if 0 <= x < self.w and 0 <= y < self.h:
            c = self.P[x, y]
            if c[3] == 0:
                self.P[x, y] = (10, 24, 14, 90)
            elif c[3] < 255:
                self.P[x, y] = (c[0], c[1], c[2], min(255, c[3] + 40))
            else:
                self.P[x, y] = darker(c, k) + (255,)

    def rect(self, x0, y0, x1, y1, c):
        self.d.rectangle((x0, y0, x1, y1), fill=c)

    def poly(self, pts, c):
        self.d.polygon(pts, fill=c)

    def line(self, pts, c):
        self.d.line(pts, fill=c)

    def oval(self, x0, y0, x1, y1, c):
        self.d.ellipse((x0, y0, x1, y1), fill=c)


# ---------------------------------------------------------------------------------------------
# The kit

def tree(cv, cx, cy, r, seed, kind='leaf'):
    """A tree standing at (cx, cy): a pine, or a round crown of overlapping blobs lit from the top left."""
    for y in range(int(cy - r * 0.5), int(cy + r * 0.5) + 2):
        for x in range(int(cx - r * 0.2), int(cx + r * 1.9)):
            dx, dy = (x - (cx + r * 0.75)) / (r * 1.15), (y - cy) / (r * 0.5)
            if dx * dx + dy * dy <= 1:
                cv.shade(x, y)
    if kind == 'pine':
        top = cy - r * 2.8
        for y in range(int(top), int(cy) + 1):
            k = (y - top) / (cy - top)
            tier = ((y - int(top)) % 5) / 5
            half = max(0.6, r * (0.25 + k * 0.75) * (0.75 + tier * 0.35))
            for x in range(int(cx - half), int(cx + half) + 1):
                t = 0.7 - (x - cx) / (half + 1) * 0.4 - tier * 0.25 - k * 0.15 + (hsh(x, y, seed) - 0.5) * 0.2
                cv.put(x, y, PINE[0] if x >= int(cx + half) or y == int(cy) else step(PINE, t))
        return
    cv.rect(int(cx), int(cy - r * 0.6), int(cx) + 1, int(cy), (78, 52, 34))
    blobs = []
    for k in range(4 + int(hsh(seed, 1, 92) * 3)):
        a, d = hsh(k, seed, 91) * 6.28, 0 if k == 0 else r * 0.5
        blobs.append((cx + math.cos(a) * d, cy - r * 1.15 + math.sin(a) * d * 0.7, r * (1 if k == 0 else 0.5 + hsh(k, seed, 93) * 0.25)))
    def inside(x, y):
        best = None
        for (bx, by, br) in blobs:
            if (x - bx) ** 2 + (y - by) ** 2 <= br * br and (best is None or by > best[1]):
                best = (bx, by, br)
        return best
    for y in range(int(cy - r * 2.7), int(cy) + 1):
        for x in range(int(cx - r * 1.7), int(cx + r * 1.7) + 1):
            b = inside(x + 0.5, y + 0.5)
            if not b:
                continue
            bx, by, br = b
            t = 0.6 - ((x - bx) * 0.45 + (y - by) * 0.75) / br * 0.45 + (hsh(x, y, seed) - 0.5) * 0.2
            if not inside(x + 1.5, y + 0.5) or not inside(x + 0.5, y + 1.5):
                c = LEAF[0]
            elif not inside(x - 0.5, y - 0.5):
                c = LEAF[min(6, int(t * 7) + 1)]
            else:
                c = step(LEAF, t)
            cv.put(x, y, c)


def building(cv, x, y, w, h, d, wall, roof, roofkind='gable', win=(52, 50, 62), lit=0.25, seed=1, floors=None, door=True):
    """A building seen from the front and above at a slant: its front's bottom left at (x, y), w wide,
    h tall to the eaves, d deep (going up and right at 45 degrees, half length), its shadow cast to the
    lower right; a 'gable' roof (ridge along the front, with a chimney now and then) or a 'flat' one
    (with a box on top); windows in rows on its front and side, some lit."""
    dx = d // 2
    side = darker(wall, 0.3)
    rise = max(3, int(w * 0.35)) if roofkind == 'gable' else 0
    for yy in range(y - dx, y + 3):
        for xx in range(x + w, x + w + dx + int(h * 0.6) + 2):
            if xx - (x + w) <= (yy - (y - dx)) + int(h * 0.6):
                cv.shade(xx, yy)
    cv.rect(x, y - h, x + w - 1, y, wall)
    cv.poly([(x + w, y - h), (x + w + dx, y - h - dx), (x + w + dx, y - dx), (x + w, y)], side)
    for yy in range(y - h + 2, y, 3):
        cv.line([(x, yy), (x + w - 1, yy)], darker(wall, 0.06))
    fl = floors or max(1, (h - 2) // 5)
    fh = (h - 2) / fl
    for f in range(fl):
        wy = int(y - h + 2 + f * fh + 1)
        for wx in range(x + 2, x + w - 3, 4):
            cv.rect(wx, wy, wx + 1, wy + 1, (252, 216, 128) if hsh(wx, wy, seed) < lit else win)
            cv.put(wx, wy + 2, lighter(wall, 0.3))
        for k in range(2, dx - 1, 4):
            c = (226, 190, 110) if hsh(k, wy, seed + 1) < lit else darker(win, 0.15)
            cv.put(x + w + k, wy - k + 1, c)
            cv.put(x + w + k, wy - k + 2, c)
    if door and h >= 7:
        cv.rect(x + w // 2 - 1, y - 4, x + w // 2 + 1, y - 1, darker(wall, 0.55))
    if roofkind == 'gable':
        ridge = y - h - rise - dx // 2
        cv.poly([(x - 1, y - h), (x + w, y - h), (x + w + dx // 2, ridge), (x - 1 + dx // 2, ridge)], roof)
        cv.poly([(x - 1 + dx // 2, ridge), (x + w + dx // 2, ridge), (x + w + dx, y - h - dx), (x + dx - 1, y - h - dx)], darker(roof, 0.28))
        cv.poly([(x + w, y - h), (x + w + dx, y - h - dx), (x + w + dx // 2, ridge)], side)
        for yy in range(ridge + 2, y - h, 2):
            x0 = x - 1 + dx // 2 * (1 - (yy - ridge) / (rise + dx // 2))
            cv.line([(x0, yy), (x0 + w + 1, yy)], darker(roof, 0.12))
        cv.line([(x - 1 + dx // 2, ridge), (x + w + dx // 2, ridge)], lighter(roof, 0.3))
        cv.line([(x - 1, y - h), (x + w, y - h)], darker(roof, 0.4))
        if hsh(x, y, seed + 7) < 0.6:
            ch = x + w - 4
            cv.rect(ch, y - h - rise - 3, ch + 1, y - h - rise + 1, (120, 80, 64))
            cv.put(ch, y - h - rise - 3, (150, 104, 84))
    else:
        cv.poly([(x, y - h), (x + w - 1, y - h), (x + w - 1 + dx, y - h - dx), (x + dx, y - h - dx)], roof)
        cv.line([(x, y - h), (x + w - 1, y - h)], lighter(roof, 0.35))
        cv.line([(x + w - 1, y - h), (x + w - 1 + dx, y - h - dx)], lighter(roof, 0.2))
        if w > 9:
            bx = x + 3 + int(hsh(x, y, seed + 9) * (w - 9))
            cv.rect(bx + dx // 2, y - h - dx // 2 - 3, bx + dx // 2 + 3, y - h - dx // 2, lighter(roof, 0.15))
    cv.line([(x, y), (x + w - 1, y)], darker(wall, 0.5))


def tower(cv, x, y, w, h, seed, glass):
    """A tower: glass with mullions running up it, or stone."""
    if glass:
        wall, roof = GLASS[int(hsh(x, y, 7) * 4) % 4]
        building(cv, x, y, w, h, 10, wall, roof, 'flat', win=roof, lit=0.3, seed=seed, floors=h // 6, door=False)
        for xx in range(x + 1, x + w - 1, 3):
            cv.line([(xx, y - h + 1), (xx, y - 1)], lighter(wall, 0.12))
    else:
        building(cv, x, y, w, h, 10, WALLS[int(hsh(x, y, 8) * 7) % 7], (110, 104, 110), 'flat', win=(70, 64, 74), lit=0.3, seed=seed, floors=h // 6, door=False)


def person(cv, x, y, i):
    skin = [(236, 196, 160), (190, 136, 100), (150, 100, 70), (110, 70, 50)][i % 4]
    shirt = [(200, 64, 70), (60, 110, 170), (240, 220, 180), (50, 140, 120), (230, 180, 70), (150, 90, 160), (60, 60, 70)][i % 7]
    cv.put(x + 1, y + 1, (0, 0, 0, 60))
    cv.put(x + 2, y + 1, (0, 0, 0, 60))
    cv.put(x, y - 4, (60, 40, 30) if i % 3 else (220, 200, 140))
    cv.put(x, y - 3, skin)
    for yy in (y - 2, y - 1):
        cv.put(x, yy, shirt)
        cv.put(x + 1, yy, darker(shirt, 0.25))
    cv.put(x, y, (50, 46, 60))
    cv.put(x + 1, y, (40, 36, 50))


def lamp(cv, x, y):
    cv.line([(x, y - 9), (x, y)], (44, 40, 48))
    for dx, c in ((-1, (252, 222, 130)), (0, (255, 246, 210)), (1, (252, 222, 130))):
        cv.put(x + dx, y - 10, c)
    cv.put(x, y - 11, (44, 40, 48))
    cv.put(x + 1, y + 1, (0, 0, 0, 60))


def bench(cv, x, y):
    cv.line([(x, y - 1), (x + 5, y - 1)], (168, 118, 72))
    cv.line([(x, y), (x + 5, y)], (128, 86, 52))
    cv.put(x, y + 1, (52, 40, 36))
    cv.put(x + 5, y + 1, (52, 40, 36))


def ground(cv, cx, cy, rx, ry, cols, seed):
    """An oval of ground, ragged at its edge: cols(x, y, d) the colour at each pixel, d 0 in the middle
    to 1 at the edge."""
    for y in range(int(cy - ry), int(cy + ry) + 1):
        for x in range(int(cx - rx), int(cx + rx) + 1):
            dx, dy = (x - cx) / rx, (y - cy) / ry
            d = dx * dx + dy * dy + (hsh(x, y, seed) - 0.5) * 0.12
            if d <= 1:
                cv.put(x, y, cols(x, y, d))


def back_to_front(items):
    for _, _, f in sorted(items, key=lambda t: (t[0], t[1])):
        f()

# ---------------------------------------------------------------------------------------------
# The places

def park():
    cv = Canvas(170, 120)
    cx, cy = 85, 76
    ground(cv, cx, cy, 80, 40, lambda x, y, d: ((128, 172, 70) if ((x - y // 2) // 6) % 2 else (116, 162, 64)) if d < 0.9 else (60, 110, 54), 3)
    for t in range(200):  # the gravel paths
        k = t / 200
        x, y = 10 + k * 150, cy + 10 * math.sin(k * 5) - 4
        cv.rect(x - 1, y - 1, x + 1, y + 1, (206, 182, 136))
        x2, y2 = cx + 30 * math.sin(k * 3) - 10, 40 + k * 76
        if 38 < y2 < 114:
            cv.rect(x2 - 1, y2 - 1, x2 + 1, y2 + 1, (206, 182, 136))
    ground(cv, 50, 92, 22, 10, lambda x, y, d: (196, 186, 156) if d > 0.8 else step([(40, 120, 160), (56, 146, 172), (86, 172, 182)], 0.9 - d + (hsh(x, y, 5) - 0.5) * 0.3), 5)
    for (x, y) in ((42, 90), (56, 94)):  # ducks on the pond
        cv.put(x, y, (250, 250, 240))
        cv.put(x + 1, y, (250, 250, 240))
        cv.put(x + 2, y - 1, (240, 180, 60))
    for (bx, by) in ((112, 96), (26, 66), (128, 66)):  # flower beds
        for y in range(by, by + 4):
            for x in range(bx, bx + 14):
                cv.put(x, y, [(222, 84, 92), (248, 212, 98), (240, 240, 220), (214, 120, 176)][(x + y * 3) % 4] if (x + y) % 2 else (64, 108, 50))
    bx, by = 106, 74  # the bandstand
    for y in range(by - 4, by + 6):
        for x in range(bx + 4, bx + 22):
            cv.shade(x, y)
    cv.oval(bx - 13, by - 3, bx + 13, by + 5, (214, 206, 190))
    cv.oval(bx - 12, by - 2, bx + 12, by + 3, (226, 220, 206))
    for px in (bx - 10, bx - 5, bx, bx + 5, bx + 10):
        cv.line([(px, by - 12), (px, by + 1)], (246, 242, 230))
    cv.poly([(bx - 15, by - 12), (bx, by - 24), (bx + 15, by - 12), (bx, by - 8)], (186, 70, 64))
    cv.poly([(bx, by - 24), (bx + 15, by - 12), (bx, by - 8)], (142, 48, 52))
    cv.line([(bx - 15, by - 12), (bx, by - 8), (bx + 15, by - 12)], (244, 232, 206))
    cv.rect(bx, by - 27, bx, by - 24, (240, 200, 90))
    items = []
    for k in range(34):  # the ring of trees, open at the front
        a = k / 34 * 6.283
        x, y = cx + math.cos(a) * 76 + (hsh(k, 1, 7) - 0.5) * 6, cy + math.sin(a) * 36 + (hsh(k, 2, 7) - 0.5) * 4
        if not (60 < x < 112 and y > 100):
            items.append((y, k, lambda x=x, y=y, k=k: tree(cv, x, y, 5 + hsh(k, 3, 7) * 3, k * 13, 'pine' if k % 7 == 0 else 'leaf')))
    for k, (x, y) in enumerate(((60, 62), (84, 58), (140, 84), (20, 82), (72, 70))):
        items.append((y, 100 + k, lambda x=x, y=y, k=k: tree(cv, x, y, 6, k * 7 + 100)))
    for k, (x, y) in enumerate(((40, 78), (90, 84), (126, 78), (66, 100))):
        items.append((y, 200 + k, lambda x=x, y=y: lamp(cv, x, y)))
    for k, (x, y) in enumerate(((70, 80), (118, 86))):
        items.append((y, 300 + k, lambda x=x, y=y: bench(cv, x, y)))
    for i in range(14):
        x, y = 20 + int(hsh(i, 1, 9) * 130), 70 + int(hsh(i, 2, 9) * 36)
        items.append((y, 400 + i, lambda x=x, y=y, i=i: person(cv, x, y, i)))
    back_to_front(items)
    return cv


def station():
    cv = Canvas(124, 106)
    def limestone(x, y, d):  # the forecourt's pale slabs
        if d > 0.9:
            return (190, 180, 158)
        row = y // 3
        joint = y % 3 == 0 or (x + (row % 2) * 4) % 8 == 0
        return (172, 160, 136) if joint else mix((222, 212, 186), (234, 226, 204), hsh(x // 8, row, 14))
    ground(cv, 58, 94, 56, 10, limestone, 13)
    x, y, w, h, d = 16, 88, 80, 13, 38
    dx = d // 2
    for yy in range(y - dx, y + 4):
        for xx in range(x + w, x + w + 20):
            if xx - (x + w) <= yy - (y - dx) + 9:
                cv.shade(xx, yy)
    top = y - h
    tx0, ty = x + w + 2, top - dx + 13  # the train coming out of the shed's far end
    cv.rect(tx0, ty - 4, 123, ty + 2, (40, 150, 140))
    cv.line([(tx0, ty - 4), (123, ty - 4)], (206, 228, 222))
    cv.line([(tx0, ty + 2), (123, ty + 2)], (26, 100, 96))
    for wx in range(tx0 + 2, 123, 4):
        cv.rect(wx, ty - 2, wx + 1, ty - 1, (250, 222, 140))
    R = dx + 10  # the glass roof: a barrel vault seen from above at a slant, lit along its crown
    for k in range(R):
        t = k / R
        c = mix((150, 196, 206), (230, 242, 238), t * 2) if t < 0.5 else mix((230, 242, 238), (110, 160, 178), (t - 0.5) * 2)
        sx = x + int(k * 0.5)
        cv.line([(sx, top - k), (sx + w, top - k)], c)
    for rx in range(x, x + w + 1, 6):
        cv.line([(rx, top), (rx + R // 2, top - R)], (64, 68, 82))
    cv.line([(x + R // 2, top - R), (x + w + R // 2, top - R)], (64, 68, 82))
    cv.poly([(x + w, top), (x + w + R // 2, top - R), (x + w + R // 2, top - dx + 2), (x + w, y)], (126, 74, 56))
    cv.rect(x, top, x + w, y, (166, 96, 70))  # the brick front, its arched windows lit
    for yy in range(top + 2, y, 2):
        cv.line([(x, yy), (x + w, yy)], (150, 86, 62))
        for xx in range(x + (yy % 4), x + w, 4):
            cv.put(xx, yy, (140, 80, 58))
    for ax in range(x + 4, x + w - 6, 10):
        cv.poly([(ax, y - 1), (ax, top + 5), (ax + 2, top + 3), (ax + 3, top + 3), (ax + 5, top + 5), (ax + 5, y - 1)], (48, 42, 54))
        cv.poly([(ax + 1, y - 2), (ax + 1, top + 6), (ax + 2, top + 4), (ax + 3, top + 4), (ax + 4, top + 6), (ax + 4, y - 2)], (236, 196, 116))
    cv.line([(x, top), (x + w, top)], (222, 200, 170))
    cv.line([(x, top + 1), (x + w, top + 1)], (196, 170, 140))
    tx, tw, th = 50, 12, 48  # the clock tower
    for yy in range(y - 8, y + 3):
        for xx in range(tx + tw + 4, tx + tw + 13):
            cv.shade(xx, yy)
    cv.rect(tx, y - th, tx + tw, y, (222, 200, 164))
    cv.poly([(tx + tw, y - th), (tx + tw + 5, y - th - 5), (tx + tw + 5, y - 5), (tx + tw, y)], (176, 152, 122))
    for yy in range(y - th + 2, y, 3):
        cv.line([(tx, yy), (tx + tw, yy)], (210, 186, 150))
    cv.poly([(tx - 2, y - th), (tx + tw // 2 + 2, y - th - 12), (tx + tw + 7, y - th - 5), (tx + tw + 2, y - th)], (162, 72, 58))
    cv.poly([(tx + tw // 2 + 2, y - th - 12), (tx + tw + 7, y - th - 5), (tx + tw + 2, y - th)], (118, 50, 44))
    cv.rect(tx + tw // 2 + 1, y - th - 15, tx + tw // 2 + 1, y - th - 12, (60, 50, 50))
    cv.oval(tx + 2, y - th + 4, tx + 10, y - th + 12, (64, 54, 54))
    cv.oval(tx + 3, y - th + 5, tx + 9, y - th + 11, (252, 248, 232))
    cv.line([(tx + 6, y - th + 8), (tx + 6, y - th + 6)], (40, 34, 40))
    cv.line([(tx + 6, y - th + 8), (tx + 8, y - th + 8)], (40, 34, 40))
    for wy in range(y - th + 16, y - 8, 6):
        cv.rect(tx + 5, wy, tx + 7, wy + 3, (236, 196, 116))
        cv.line([(tx + 5, wy), (tx + 7, wy)], (90, 70, 60))
    cv.rect(tx + 4, y - 7, tx + 8, y, (52, 44, 54))
    cv.rect(tx + 5, y - 6, tx + 7, y, (90, 60, 50))
    def taxi(cx, cy):
        cv.rect(cx, cy - 2, cx + 6, cy, (246, 200, 66))
        cv.rect(cx + 2, cy - 4, cx + 4, cy - 2, (250, 214, 90))
        cv.rect(cx + 2, cy - 3, cx + 4, cy - 3, (90, 110, 130))
        cv.put(cx + 1, cy + 1, (30, 30, 34))
        cv.put(cx + 5, cy + 1, (30, 30, 34))
    def fountain():
        fx, fy = 58, 100
        cv.oval(fx - 8, fy - 3, fx + 8, fy + 3, (150, 142, 128))
        cv.oval(fx - 7, fy - 2, fx + 7, fy + 2, (70, 150, 176))
        cv.oval(fx - 4, fy - 1, fx + 4, fy + 1, (96, 178, 196))
        cv.rect(fx, fy - 6, fx, fy, (200, 192, 176))
        for (ddx, ddy) in ((-2, -8), (0, -9), (2, -8), (-4, -5), (4, -5)):
            cv.put(fx + ddx, fy + ddy, (226, 244, 250))
    def planter(px, py):
        cv.rect(px, py - 2, px + 6, py, (120, 112, 104))
        cv.line([(px, py - 2), (px + 6, py - 2)], (160, 152, 140))
        for xx in range(px + 1, px + 6):
            cv.put(xx, py - 3, [(220, 70, 80), (64, 120, 60), (246, 206, 90)][xx % 3])
    items = [(101, 0, fountain)]
    for k, (cx, cy) in enumerate(((22, 96), (34, 98), (86, 96), (98, 99))):
        items.append((cy, 10 + k, lambda cx=cx, cy=cy: taxi(cx, cy)))
    for i in range(16):
        px, py = 18 + int(hsh(i, 1, 21) * 84), 90 + int(hsh(i, 2, 21) * 10)
        items.append((py, 20 + i, lambda px=px, py=py, i=i: person(cv, px, py, i)))
    for k, (px, py) in enumerate(((6, 102), (118, 102), (3, 84))):
        items.append((py, 40 + k, lambda px=px, py=py: tree(cv, px, py, 5, px)))
    for k, (px, py) in enumerate(((44, 102), (74, 102))):
        items.append((py, 50 + k, lambda px=px, py=py: lamp(cv, px, py)))
    for k, (px, py) in enumerate(((10, 94), (100, 94))):
        items.append((py, 60 + k, lambda px=px, py=py: planter(px, py)))
    back_to_front(items)
    return cv


AWNINGS = [((210, 62, 70), (246, 238, 222)), ((40, 150, 140), (246, 238, 222)), ((248, 200, 80), (204, 120, 60)), ((216, 110, 150), (246, 238, 222)), ((70, 110, 180), (246, 238, 222))]

def market():
    cv = Canvas(170, 122)
    def brick(x, y, d):  # warm brick in a herringbone, brighter under the lanterns; a boardwalk along the water
        if y >= 114:
            plank = (x + (y // 2) * 7) % 12 == 0 or y % 2 == 1
            return (92, 60, 38) if plank and y % 2 == 1 else mix((150, 104, 64), (176, 128, 82), hsh(x // 6, y // 2, 35))
        block = ((x // 4) + (y // 4)) % 2
        joint = (y % 2 == 0 or (x + (y // 2) * 2) % 4 == 0) if block == 0 else (x % 2 == 0 or (y + (x // 2) * 2) % 4 == 0)
        c = (112, 60, 46) if joint else mix((176, 96, 70), (196, 116, 84), hsh(x // 2, y // 2, 34))
        return mix(c, (246, 196, 120), max(0, 1 - ((x - 85) / 70) ** 2 - ((y - 100) / 12) ** 2) * 0.35)
    ground(cv, 85, 94, 82, 24, brick, 33)
    x, k = 8, 0  # the townhouses along the back
    while x < 150:
        w, h = 14 + int(hsh(k, 1, 41) * 6), 22 + int(hsh(k, 2, 41) * 12)
        building(cv, x, 78, w, h, 12, WALLS[k % len(WALLS)], ROOFS[(k * 2) % len(ROOFS)], 'gable', lit=0.45, seed=k + 50, floors=3 + (h > 28))
        x, k = x + w + 1, k + 1
    def stall(x, y, k):
        a, b = AWNINGS[k % len(AWNINGS)]
        goods = [(244, 204, 82), (214, 72, 62), (124, 186, 82), (240, 150, 60)]
        for yy in range(y - 3, y + 3):
            for xx in range(x + 12, x + 17):
                cv.shade(xx, yy)
        cv.rect(x, y - 5, x + 13, y, (146, 100, 62))
        cv.line([(x, y), (x + 13, y)], (100, 66, 42))
        for xx in range(x + 1, x + 13, 2):
            cv.put(xx, y - 4, goods[(xx + k) % 4])
            cv.put(xx, y - 3, goods[(xx + k + 1) % 4])
        cv.line([(x, y - 12), (x, y - 5)], (90, 64, 44))
        cv.line([(x + 13, y - 12), (x + 13, y - 5)], (90, 64, 44))
        for xx in range(x - 1, x + 15):
            for yy in range(y - 14, y - 8):
                cv.put(xx, yy, a if ((xx - x + 1) // 2) % 2 == 0 else b)
        for xx in range(x - 1, x + 15, 2):
            cv.put(xx, y - 8, a)
        cv.line([(x - 1, y - 14), (x + 14, y - 14)], lighter(a, 0.3))
    def lanterns():
        for row in (92, 100):
            for x in range(6, 164):
                yy = row + int(4 * abs(((x - 6) % 30) - 15) / 15)
                cv.put(x, yy, (70, 56, 54))
                if (x - 6) % 5 == 0:
                    c = [(255, 214, 96), (244, 100, 84), (246, 156, 176)][(x // 5) % 3]
                    cv.put(x, yy + 1, c)
                    cv.put(x, yy + 2, c)
                    cv.put(x + 1, yy + 1, darker(c, 0.2))
                    cv.put(x + 1, yy + 2, darker(c, 0.25))
                    cv.put(x, yy + 3, (255, 240, 200, 120))
    def steam():
        for k in range(6):
            sx, sy = 20 + int(3 * math.sin(k * 1.4)), 70 - k * 6
            cv.oval(sx - 2 - k * 0.4, sy - 1.5, sx + 2 + k * 0.4, sy + 1.5, (240, 240, 236, 200 - k * 25))
    def posts():
        for x in range(12, 160, 12):
            cv.rect(x, 116, x + 1, 120, (84, 56, 36))
            cv.put(x, 115, (176, 128, 82))
        cv.line([(8, 116), (162, 116)], (120, 84, 52))
    items = [(79, 0, steam), (101, 1, lanterns), (121, 2, posts)]
    for k, x in enumerate(range(12, 150, 20)):
        items.append((88, 10 + k, lambda x=x, k=k: stall(x, 88, k)))
        items.append((110, 30 + k, lambda x=x, k=k: stall(x + 8, 110, k + 2)))
    for i in range(40):
        x, y = 8 + int(hsh(i, 1, 51) * 154), 90 + int(hsh(i, 2, 51) * 22)
        items.append((y, 50 + i, lambda x=x, y=y, i=i: person(cv, x, y, i)))
    back_to_front(items)
    return cv

# ---------------------------------------------------------------------------------------------
# The settlements without a name

def suburb(seed):
    cv = Canvas(150, 78)
    ground(cv, 75, 56, 72, 20, lambda x, y, d: (122, 164, 66) if (x + y) % 7 else (112, 156, 62), seed)
    items = []
    for row, y in enumerate((52, 72)):
        x, k = 6 + row * 8, 0
        while x < 132:
            w = 14 + int(hsh(k, row, seed) * 5)
            n = len(items)
            items.append((y, n, lambda x=x, y=y, w=w, k=k, row=row: building(cv, x, y, w, 9, 10, WALLS[(k + row * 3 + seed) % len(WALLS)], ROOFS[(k * 3 + row + seed) % len(ROOFS)], 'gable', lit=0.2, seed=k + row * 20 + seed, floors=1)))
            if hsh(k, row, seed + 1) < 0.5:
                items.append((y + 1, n + 1, lambda x=x + w + 6, y=y + 1, k=k: tree(cv, x, y, 4.5, k + seed)))
            items.append((y + 4, n + 2, lambda x=x, y=y, w=w: [cv.put(xx, y + 4, (236, 228, 210)) for xx in range(x - 2, x + w + 3, 2)]))  # a garden fence
            x, k = x + w + 14, k + 1
    back_to_front(items)
    return cv


def village():
    cv = Canvas(120, 90)
    ground(cv, 60, 74, 56, 14, lambda x, y, d: (122, 164, 66), 71)
    def church():
        building(cv, 46, 74, 24, 14, 12, (222, 214, 196), (110, 104, 112), 'gable', lit=0.1, seed=3, floors=1)
        sx = 40
        cv.rect(sx, 44, sx + 7, 74, (214, 206, 188))
        cv.poly([(sx + 7, 44), (sx + 10, 41), (sx + 10, 71), (sx + 7, 74)], (176, 168, 152))
        cv.poly([(sx - 1, 44), (sx + 4, 22), (sx + 11, 41), (sx + 8, 44)], (96, 100, 116))
        cv.poly([(sx + 4, 22), (sx + 11, 41), (sx + 8, 44)], (70, 74, 90))
        cv.rect(sx + 2, 52, sx + 4, 56, (60, 60, 70))
        cv.put(sx + 3, 21, (240, 200, 90))
    items = [(74, 0, church)]
    for k, (x, y) in enumerate(((8, 70), (18, 84), (76, 72), (92, 84), (62, 86))):
        items.append((y, 10 + k, lambda x=x, y=y, k=k: building(cv, x, y, 14, 8, 10, WALLS[k % len(WALLS)], ROOFS[k % len(ROOFS)], 'gable', lit=0.2, seed=k + 70, floors=1)))
    for k, (x, y) in enumerate(((36, 86), (104, 70), (4, 82))):
        items.append((y, 20 + k, lambda x=x, y=y, k=k: tree(cv, x, y, 5, k + 80)))
    back_to_front(items)
    return cv


def farm():
    cv = Canvas(110, 80)
    ground(cv, 55, 64, 52, 14, lambda x, y, d: (150, 130, 90) if d < 0.5 else (124, 164, 66), 81)
    def silo():
        cv.rect(54, 30, 63, 62, (206, 204, 198))
        cv.rect(60, 30, 63, 62, (170, 168, 164))
        cv.oval(53, 25, 64, 34, (150, 150, 156))
        cv.oval(54, 26, 62, 31, (186, 186, 190))
    def tractor():
        cv.rect(36, 70, 44, 73, (70, 150, 70))
        cv.rect(40, 67, 43, 70, (60, 130, 60))
        cv.oval(34, 71, 39, 76, (40, 40, 44))
        cv.oval(42, 73, 45, 76, (40, 40, 44))
    back_to_front([
        (60, 0, lambda: building(cv, 14, 60, 30, 16, 16, (170, 58, 52), (110, 104, 108), 'gable', win=(90, 40, 36), lit=0, seed=1, floors=1)),
        (62, 1, silo),
        (72, 2, lambda: building(cv, 70, 72, 20, 10, 12, (234, 222, 200), (150, 62, 56), 'gable', lit=0.3, seed=4, floors=1)),
        (76, 3, tractor),
        (74, 4, lambda: tree(cv, 6, 74, 6, 90)),
        (66, 5, lambda: tree(cv, 100, 66, 6, 91)),
    ])
    return cv


def lighthouse():
    cv = Canvas(50, 90)
    ground(cv, 25, 80, 22, 8, lambda x, y, d: step([(96, 96, 104), (128, 128, 132), (160, 158, 154)], 0.8 - d * 0.6 + (hsh(x, y, 91) - 0.5) * 0.3), 93)
    for yy in range(70, 82):
        for xx in range(30, 44):
            cv.shade(xx, yy)
    for y in range(26, 80):  # the tower in red and white bands, shaded on the right
        half = 4 + (y - 26) / 54 * 3
        for x in range(int(25 - half), int(25 + half) + 1):
            c = (204, 54, 58) if ((y - 26) // 9) % 2 == 0 else (244, 240, 230)
            cv.put(x, y, darker(c, 0.25) if x > 25 + half * 0.3 else c)
    cv.rect(20, 18, 30, 26, (60, 60, 70))
    cv.rect(21, 19, 29, 25, (255, 236, 150))
    cv.rect(22, 20, 25, 24, (255, 252, 230))
    cv.poly([(19, 18), (25, 10), (31, 18)], (180, 50, 54))
    cv.line([(18, 26), (32, 26)], (40, 40, 48))
    return cv


def marina():
    cv = Canvas(130, 60)
    cv.rect(10, 20, 120, 24, (150, 112, 74))  # the pier and its jetties, out over the water
    cv.line([(10, 24), (120, 24)], (96, 70, 48))
    for x in range(10, 121, 4):
        cv.line([(x, 20), (x, 24)], (130, 96, 62))
    for jx in (24, 54, 84, 110):
        cv.rect(jx, 24, jx + 3, 46, (150, 112, 74))
        cv.line([(jx + 3, 24), (jx + 3, 46)], (96, 70, 48))
    for k, (bx, by) in enumerate(((30, 34), (44, 42), (60, 30), (74, 40), (90, 34), (116, 42), (12, 40))):
        for xx in range(bx + 1, bx + 14):
            cv.put(xx, by + 3, (20, 60, 90, 90))
        cv.poly([(bx, by), (bx + 12, by), (bx + 10, by + 3), (bx + 2, by + 3)], (246, 244, 236))
        cv.line([(bx + 2, by + 3), (bx + 10, by + 3)], (80, 110, 140) if k % 2 else (190, 60, 60))
        cv.line([(bx + 6, by - 12), (bx + 6, by)], (60, 56, 60))
        cv.poly([(bx + 7, by - 11), (bx + 12, by - 2), (bx + 7, by - 2)], (250, 248, 240))
    return cv


def cloud(w, h, seed):
    cv = Canvas(w, h)
    blobs = [(w * (0.2 + 0.6 * hsh(k, 1, seed)), h * (0.45 + 0.25 * hsh(k, 2, seed)), h * (0.22 + 0.2 * hsh(k, 3, seed))) for k in range(7)]
    for y in range(h):
        for x in range(w):
            inside = [(bx, by, r) for (bx, by, r) in blobs if (x - bx) ** 2 + ((y - by) * 1.5) ** 2 <= r * r * 2.2]
            if inside:
                bx, by, r = max(inside, key=lambda b: b[1])
                t = (y - (by - r)) / (2 * r)
                cv.put(x, y, ((255, 255, 252) if t < 0.35 else ((236, 240, 244) if t < 0.7 else (206, 216, 228))) + (150,))
    return cv

# ---------------------------------------------------------------------------------------------
# The bridges, seen from the side

DECK = {'suspension': 78, 'truss': 44}  # the row of each bridge picture that sits on its road or railway

def suspension(L=96):
    """Like the Golden Gate: the road deck on a red girder, two tall red towers standing in the water,
    the main cables draping between them and down to each end, hangers down to the deck."""
    cv = Canvas(L, 100)
    RED, RED_LIT, RED_DARK = (196, 62, 46), (232, 104, 74), (134, 40, 32)
    deck_far, deck_near = 74, 82
    t1, t2 = int(L * 0.27), int(L * 0.73)
    top = 18
    def cable(x, sag_to):
        if t1 <= x <= t2:
            k = (x - t1) / (t2 - t1)
            return top + 2 + (sag_to - top) * (1 - (2 * k - 1) ** 2)
        k = x / t1 if x < t1 else (L - 1 - x) / (L - 1 - t2)
        return deck_far - 2 - (deck_far - 2 - top - 2) * k ** 1.6
    for y in range(deck_near + 3, deck_near + 9):  # its shadow on the water
        for x in range(4, L):
            cv.put(x, y, (8, 30, 50, 70))
    for x in range(L):  # the far cable and its hangers, behind the deck
        cy = cable(x, deck_far - 6) - 3
        cv.put(x, cy, RED_DARK)
        if x % 3 == 0 and cy < deck_far - 1:
            for y in range(int(cy) + 1, deck_far):
                cv.put(x, y, (150, 50, 40, 160))
    for t in (t1, t2):  # the piers under the towers, with foam
        cv.rect(t - 4, deck_near, t + 5, deck_near + 7, (150, 146, 140))
        cv.rect(t - 4, deck_near, t - 2, deck_near + 7, (186, 182, 174))
        for dx in (-5, -2, 2, 6):
            cv.put(t + dx, deck_near + 8, (226, 242, 236))
    cv.rect(0, deck_far, L - 1, deck_near - 1, (100, 100, 110))  # the road, a red rail on the far side, the girder's red face
    cv.line([(0, deck_far), (L - 1, deck_far)], RED_DARK)
    for x in range(0, L, 6):
        cv.line([(x, (deck_far + deck_near) // 2), (x + 2, (deck_far + deck_near) // 2)], (232, 220, 170))
    cv.rect(0, deck_near, L - 1, deck_near + 3, RED)
    cv.line([(0, deck_near), (L - 1, deck_near)], RED_LIT)
    cv.line([(0, deck_near + 3), (L - 1, deck_near + 3)], RED_DARK)
    for x in range(1, L, 3):
        cv.put(x, deck_near + 1, RED_DARK)
        cv.put(x + 1, deck_near + 2, RED_DARK)
    for t in (t1, t2):  # the towers, tapering in steps, lit on the left, braced across
        for y in range(top, deck_near + 4):
            half = 2 if y < top + 18 else (3 if y < top + 38 else 4)
            for x in range(t - half, t + half + 1):
                cv.put(x, y, RED_LIT if x == t - half else (RED_DARK if x >= t + half - 1 else RED))
        for by in (top + 3, top + 18, top + 38):
            cv.rect(t - 4, by, t + 4, by + 1, RED_DARK)
            cv.line([(t - 4, by), (t + 4, by)], RED_LIT)
        cv.rect(t - 2, top - 2, t + 2, top, RED_LIT)
        for y in range(top + 5, deck_far - 2):  # the slot between each tower's two legs
            if y not in range(top + 17, top + 20) and y not in range(top + 37, top + 40):
                cv.put(t, y, RED_DARK)
    for x in range(L):  # the near cable and its hangers, in front
        cy = cable(x, deck_far - 4)
        cv.put(x, cy, RED)
        cv.put(x, cy - 1, RED_LIT)
        if x % 3 == 0 and cy < deck_near - 1 and abs(x - t1) > 4 and abs(x - t2) > 4:
            for y in range(int(cy) + 1, deck_near):
                cv.put(x, y, (176, 58, 44))
    for x0 in (0, L - 6):  # stone ends where it meets the banks
        cv.rect(x0, deck_far - 1, x0 + 5, deck_near + 6, (176, 168, 152))
        cv.line([(x0, deck_far - 1), (x0 + 5, deck_far - 1)], (214, 206, 188))
    return cv


def truss(L=88):
    """For the trains: the rails on the deck, and two arched steel spans along both sides, the far side
    darker, on a pier in the river."""
    cv = Canvas(L, 60)
    STEEL, STEEL_LIT, STEEL_DARK = (66, 96, 98), (120, 156, 150), (36, 54, 58)
    deck_far, deck_near = 41, 47
    half = L // 2
    for y in range(deck_near + 3, deck_near + 8):
        for x in range(4, L):
            cv.put(x, y, (8, 30, 50, 70))
    cv.rect(half - 3, deck_near, half + 3, deck_near + 8, (150, 140, 128))
    cv.rect(half - 3, deck_near, half - 1, deck_near + 8, (184, 176, 162))
    for dx in (-4, 0, 4):
        cv.put(half + dx, deck_near + 9, (226, 242, 236))
    def span(x0, x1, base, rise, top_c, mem_c):  # a bowstring: an arch over the span, verticals and diagonals inside
        pts = [(x, base - 2 - rise * (1 - (2 * (x - x0) / (x1 - x0) - 1) ** 2)) for x in range(x0, x1 + 1)]
        for i in range(len(pts) - 1):
            cv.line([pts[i], pts[i + 1]], top_c)
            cv.line([(pts[i][0], pts[i][1] + 1), (pts[i + 1][0], pts[i + 1][1] + 1)], mem_c)
        n = 6
        for j in range(1, n):
            x = x0 + (x1 - x0) * j // n
            xp = x0 + (x1 - x0) * (j - 1) // n
            cv.line([(x, pts[x - x0][1]), (x, base)], mem_c)
            cv.line([(xp, base), (x, pts[x - x0][1])] if j <= n // 2 else [(x, base), (xp, pts[xp - x0][1])], mem_c)
        cv.line([(x0, base), (x1, base)], top_c)
    span(0, half, deck_far, 12, STEEL_DARK, (30, 44, 48))
    span(half, L - 1, deck_far, 12, STEEL_DARK, (30, 44, 48))
    cv.rect(0, deck_far, L - 1, deck_near - 1, (96, 82, 72))
    for x in range(0, L, 2):
        cv.line([(x, deck_far + 1), (x, deck_near - 2)], (66, 48, 38))
    cv.line([(0, deck_far + 2), (L - 1, deck_far + 2)], (196, 194, 190))
    cv.line([(0, deck_near - 2), (L - 1, deck_near - 2)], (196, 194, 190))
    cv.rect(0, deck_near, L - 1, deck_near + 2, STEEL)
    cv.line([(0, deck_near + 2), (L - 1, deck_near + 2)], STEEL_DARK)
    span(0, half, deck_near, 13, STEEL_LIT, STEEL)
    span(half, L - 1, deck_near, 13, STEEL_LIT, STEEL)
    for x0 in (0, L - 5):
        cv.rect(x0, deck_far - 1, x0 + 4, deck_near + 5, (176, 168, 152))
    return cv

# ---------------------------------------------------------------------------------------------
# The city

def city(pictures, M):
    """The city's buildings, loose on patches of paving over the land inside its outline, clear of the
    roads, the water and the pictures standing in it (the station, the village, the park): towers
    crowded round its heart by the station, flats further out, houses in gardens at the edges, trees in
    the gaps. Returns the picture and its top left, in screen pixels."""
    roads, water = M['kerb'].load(), M['water'].load()
    xs, ys = [p[0] for p in CITY], [p[1] for p in CITY]
    lx0, ly0, lx1, ly1 = min(xs) - 4, min(ys) - 50, max(xs) + 8, max(ys) + 6  # with headroom for the towers
    CW, CH = (lx1 - lx0) * SCALE, (ly1 - ly0) * SCALE
    cv = Canvas(CW, CH)
    def land(px, py):  # a picture pixel's land pixel
        return lx0 + px / SCALE, ly0 + py / SCALE
    def ground_ok(X, Y):
        return in_city(X, Y) and not roads[int(X), int(Y)] and not water[int(X), int(Y)]
    def clear_of(px0, py0, px1, py1):
        return all(ground_ok(*land(px, py)) for py in range(int(py0), int(py1) + 1, 2) for px in range(int(px0), int(px1) + 1, 2))
    keep_out = []  # the lower part of each picture standing in the city
    for name in ('station', 'village', 'park'):
        cx, by, _, _ = PICTURES[name]
        im = pictures[name].img
        keep_out.append((cx * SCALE - im.width // 2 - lx0 * SCALE + 6, by * SCALE - im.height * 0.55 - ly0 * SCALE,
                         cx * SCALE + im.width // 2 - lx0 * SCALE - 6, by * SCALE - ly0 * SCALE + 4))
    taken = []
    def free(x0, y0, x1, y1):
        if any(not (x1 < k[0] or x0 > k[2] or y1 < k[1] or y0 > k[3]) for k in keep_out):
            return False
        return not any(not (x1 + 2 < t[0] or x0 - 2 > t[2] or y1 + 2 < t[1] or y0 - 2 > t[3]) for t in taken)
    hx, hy = (CITY_HEART[0] - lx0) * SCALE, (CITY_HEART[1] - ly0) * SCALE
    plots = []
    for gy in range(0, CH, 10):
        for gx in range(0, CW, 10):
            x, y = gx + int(hsh(gx, gy, 1) * 6), gy + int(hsh(gx, gy, 2) * 6)
            d = math.hypot((x - hx) / 1.25, y - hy) / SCALE  # from the heart, in land pixels
            if d < 70:
                kind, w, h = 'tower', 14 + int(hsh(x, y, 3) * 9), 36 + int(hsh(x, y, 4) * 50 * (1 - d / 90))
            elif d < 120:
                kind, w, h = 'flats', 13 + int(hsh(x, y, 3) * 8), 16 + int(hsh(x, y, 4) * 14)
            else:
                kind, w, h = 'house', 11 + int(hsh(x, y, 3) * 4), 9
            fx0, fy0, fx1, fy1 = x, y - 6, x + w + 5, y  # its footprint
            if fy0 - h < 0 or not clear_of(fx0 - 3, fy0 - 3, fx1 + 3, fy1 + 4) or not free(fx0, fy0, fx1, fy1):
                continue
            if hsh(x, y, 5) < {'house': 0.4, 'flats': 0.22, 'tower': 0.08}[kind]:  # some room between them
                continue
            taken.append((fx0, fy0, fx1, fy1))
            plots.append((y, x, w, h, kind))
    for (y, x, w, h, kind) in plots:  # paving round the towers and the flats, joining up where they're close
        if kind == 'house':
            continue
        m = 5 if kind == 'tower' else 3
        for py in range(y - 5 - m, y + m + 1):
            for px in range(x - m, x + w + 5 + m + 1):
                if 0 <= px < CW and 0 <= py < CH and ground_ok(*land(px, py)):
                    cv.put(px, py, mix((170, 160, 144), (192, 182, 162), hsh(px, py, 61)))
    items = []
    for k, (y, x, w, h, kind) in enumerate(plots):
        seed = x * 7 + y
        if kind == 'tower':
            items.append((y, k, lambda x=x, y=y, w=w, h=h, seed=seed: tower(cv, x, y, w, h, seed, hsh(x, y, 6) < 0.6)))
        else:
            wall, roof = WALLS[int(hsh(x, y, 8) * 7) % 7], ROOFS[int(hsh(x, y, 9) * 6) % 6]
            if kind == 'flats':
                rk = 'flat' if hsh(x, y, 10) < 0.5 else 'gable'
                items.append((y, k, lambda x=x, y=y, w=w, h=h, wall=wall, roof=roof, rk=rk, seed=seed: building(cv, x, y, w, h, 10, wall, roof, rk, lit=0.3, seed=seed)))
            else:
                items.append((y, k, lambda x=x, y=y, w=w, wall=wall, roof=roof, seed=seed: building(cv, x, y, w, 8, 10, wall, roof, 'gable', lit=0.2, seed=seed, floors=1)))
    for gy in range(0, CH, 7):  # trees in the gaps
        for gx in range(0, CW, 7):
            x, y = gx + int(hsh(gx, gy, 11) * 5), gy + int(hsh(gx, gy, 12) * 5)
            if not ground_ok(*land(x, y)) or cv.get(x, y)[3] or not free(x - 4, y - 3, x + 4, y + 1) or hsh(gx, gy, 13) >= 0.3:
                continue
            taken.append((x - 3, y - 2, x + 3, y))
            items.append((y, len(items), lambda x=x, y=y: tree(cv, x, y, 3.5 + hsh(x, y, 14) * 1.5, x * 3 + y)))
    back_to_front(items)
    return cv, (lx0 * SCALE, ly0 * SCALE)

# ---------------------------------------------------------------------------------------------
# Everything drawn, saved, and placed

def top_row(cv):
    """The highest solid row in the middle third of a picture, where its pin points."""
    for y in range(cv.h):
        for x in range(cv.w // 3, cv.w * 2 // 3):
            if cv.get(x, y)[3] > 200:
                return y
    return 0


pictures = {
    'park': park(), 'station': station(), 'market': market(), 'suburb1': suburb(3), 'suburb2': suburb(11),
    'village': village(), 'farm': farm(), 'lighthouse': lighthouse(), 'marina': marina(),
}
the_city, city_at = city(pictures, masks())
bridges = {'suspension': suspension(96), 'truss': truss(88)}
clouds = {'cloud1': cloud(120, 44, 5), 'cloud2': cloud(90, 34, 9)}

placed = [{'name': 'city', 'x': city_at[0], 'y': city_at[1]}]
places = {}
NAMES = {'park': 'The Park', 'station': 'The Station', 'market': 'The Night Market'}
for name, (cx, by, w, h) in sorted(PICTURES.items(), key=lambda kv: (kv[1][1], kv[0])):
    cv = pictures[name]
    x, y = cx * SCALE - cv.w // 2, by * SCALE - cv.h + 3
    placed.append({'name': name, 'x': x, 'y': y})
    if name in PLACES:
        places[name] = {'name': NAMES[name], 'pin': [cx * SCALE, y + top_row(cv) - 4], 'label': [cx * SCALE, by * SCALE + 6],
                        'view': [cx * SCALE, round(by * SCALE - cv.h * 0.4 - 17)]}
for name, (bx, by, _) in BRIDGES.items():
    placed.append({'name': name, 'x': bx * SCALE, 'y': by * SCALE - DECK[name]})

OUT.mkdir(parents=True, exist_ok=True)
for name, cv in {**pictures, 'city': the_city, **bridges, **clouds}.items():
    cv.img.save(OUT / f'{name}.png', optimize=True)
data = {
    'size': [W * SCALE, H * SCALE],
    'land': 'land.png',
    'pictures': placed,
    'places': {k: places[k] for k in PLACES},
    'clouds': [{'name': name, 'x': x * SCALE, 'y': y * SCALE} for (name, x, y) in CLOUDS],
}
(OUT / 'map.json').write_text(json.dumps(data, indent=2) + '\n')
print(f'places: {len(placed)} pictures, {len(clouds)} clouds')
````

- [ ] **Step 4: Paint the map**

Run: `python3 art/open-case/map/land.py && python3 art/open-case/map/places.py`
Expected, after about 40 seconds:

```
land: 960x540, 306 colours
places: 12 pictures, 2 clouds
```

`open-case/assets/map/` now holds 16 files, about 445 KB, and there's no `__pycache__` in `art/open-case/map/`. A second run leaves `git status` unchanged.

- [ ] **Step 5: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 380 tests.

- [ ] **Step 6: Commit**

```bash
git add art/open-case/map/layout.py art/open-case/map/land.py art/open-case/map/places.py open-case/assets/map open-case/test/map.test.js
git commit -m "Open Case: the map's art: a lush world painted after Nathan's reference, with the city, the three places and the bridges drawn on it

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: The map's workings

**Files:**
- Create: `open-case/src/atlas.js`, `open-case/test/atlas.test.js`

**Interfaces:**
- Consumes: `PLACE_IDS` (Task 1), `map.json` (Task 5), `READY` (beats.js).
- Produces:
  - `trackList(beats, studio)`: `[{ key: { ready: id } | { slot: i }, name, bpm, mood }]`, the five ready-made tracks, then your slots when `studio` is true;
  - `createAtlas({ place, tracks, chosen, straightGo })` -> `{ at, tracks, track, panel, straightGo }`; `placeOf(a)`; `trackOf(a)`;
  - `atlasKey(a, code)`, `clickPlace(a, id)` and `clickTrack(a, i)`, each returning `'place' | 'panel' | 'track' | 'go' | 'back' | null`;
  - `viewAt(a, map, [w, h]) -> { x, y }`: the view's top left, centred on the chosen place and kept inside the map.

- [ ] **Step 1: Write the failing tests**

Create `open-case/test/atlas.test.js`:

````js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { trackList, createAtlas, placeOf, trackOf, atlasKey, clickPlace, clickTrack, viewAt } from '../src/atlas.js';
import { READY, blankBeat } from '../src/beats.js';

const map = JSON.parse(readFileSync(new URL('../assets/map/map.json', import.meta.url), 'utf8'));
// Your beats as studio.js keeps them: six slots, two of them yours.
const beats = () => {
  const slots = Array(6).fill(null);
  slots[1] = { ...blankBeat('x'), name: 'Rainy bus', bpm: 92 };
  slots[4] = { ...blankBeat('y'), name: 'Sunday', bpm: 70 };
  return { slots, chosen: null };
};
const keys = (a, ...codes) => codes.map((c) => atlasKey(a, c));

test('the tracks: the five ready-made ones for everyone, then your own once the studio is yours', () => {
  const without = trackList(beats(), false), withIt = trackList(beats(), true);
  assert.deepEqual(without.map((t) => t.name), READY.map((b) => b.name));
  assert.deepEqual(without[1], { key: { ready: 'bossa' }, name: 'Bossa nova', bpm: 132, mood: 'A' });
  assert.deepEqual(withIt.map((t) => t.name), [...READY.map((b) => b.name), 'Rainy bus', 'Sunday']);
  assert.deepEqual(withIt.slice(5).map((t) => t.key), [{ slot: 1 }, { slot: 4 }]);
});

test('the map opens on the place and the track chosen last time, or the park and the first track', () => {
  const tracks = trackList(beats(), true);
  const fresh = createAtlas({ tracks });
  assert.deepEqual([placeOf(fresh), trackOf(fresh).name, fresh.panel], ['park', 'Lo-fi', false]);
  const back = createAtlas({ place: 'market', tracks, chosen: { slot: 4 } });
  assert.deepEqual([placeOf(back), trackOf(back).name], ['market', 'Sunday']);
  assert.equal(trackOf(createAtlas({ tracks, chosen: { ready: 'funk' } })).name, 'Funk');
  assert.equal(trackOf(createAtlas({ tracks: trackList(beats(), false), chosen: { slot: 4 } })).name, 'Lo-fi', 'your beat, without the studio: the first');
  assert.equal(placeOf(createAtlas({ place: 'pier', tracks })), 'park');
});

test('left and right step through the places, round from the last to the first', () => {
  const a = createAtlas({ tracks: trackList(beats(), false) });
  assert.deepEqual(keys(a, 'ArrowRight'), ['place']);
  assert.equal(placeOf(a), 'station');
  keys(a, 'ArrowRight');
  assert.equal(placeOf(a), 'market');
  keys(a, 'ArrowRight');
  assert.equal(placeOf(a), 'park');
  keys(a, 'ArrowLeft');
  assert.equal(placeOf(a), 'market');
  assert.deepEqual(keys(a, 'ArrowUp', 'ArrowDown', 'Escape', 'KeyA'), [null, null, null, null], 'nothing else does anything with the tracks shut');
});

test('Enter opens the tracks; up and down choose one, Enter goes, Esc shuts them again', () => {
  const a = createAtlas({ place: 'station', tracks: trackList(beats(), false) });
  assert.deepEqual(keys(a, 'Enter'), ['panel']);
  assert.ok(a.panel);
  assert.deepEqual(keys(a, 'ArrowUp'), [null], 'already at the top');
  assert.deepEqual(keys(a, 'ArrowDown', 'ArrowDown'), ['track', 'track']);
  assert.equal(trackOf(a).name, 'Funk');
  assert.deepEqual(keys(a, 'ArrowLeft'), [null], 'the places hold still while the tracks are open');
  assert.deepEqual(keys(a, 'Escape'), ['back']);
  assert.ok(!a.panel);
  assert.equal(trackOf(a).name, 'Funk', 'the track chosen stays chosen');
  assert.deepEqual(keys(a, 'Space', 'Space'), ['panel', 'go'], 'Space works as Enter');
  assert.equal(placeOf(a), 'station');
  const end = createAtlas({ tracks: trackList(beats(), false) });
  keys(end, 'Enter', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown');
  assert.deepEqual(keys(end, 'ArrowDown'), [null], 'already at the bottom');
});

test("after the studio's Busk to this, Enter on a place goes straight there", () => {
  const a = createAtlas({ place: 'park', tracks: trackList(beats(), true), chosen: { slot: 1 }, straightGo: true });
  assert.deepEqual(keys(a, 'ArrowRight', 'Enter'), ['place', 'go']);
  assert.equal(placeOf(a), 'station');
  assert.equal(trackOf(a).name, 'Rainy bus');
  assert.ok(!a.panel);
});

test('clicks: a place chooses it, the chosen place opens the tracks, a track chooses it, the chosen track goes', () => {
  const a = createAtlas({ tracks: trackList(beats(), false) });
  assert.equal(clickPlace(a, 'market'), 'place');
  assert.equal(placeOf(a), 'market');
  assert.equal(clickPlace(a, 'market'), 'panel');
  assert.equal(clickTrack(a, 3), 'track');
  assert.equal(trackOf(a).name, 'Reggae');
  assert.equal(clickTrack(a, 3), 'go');
  assert.equal(clickTrack(a, 9), null);
  assert.equal(clickPlace(a, 'park'), 'back', 'a place while the tracks are open: chosen, and they shut');
  assert.deepEqual([placeOf(a), a.panel], ['park', false]);
  assert.equal(clickTrack(a, 1), null, 'no tracks to click while they are shut');
  assert.equal(clickPlace(a, 'pier'), null);
  const straight = createAtlas({ tracks: trackList(beats(), false), straightGo: true });
  assert.equal(clickPlace(straight, 'park'), 'go');
});

test('the view centres on the chosen place, kept inside the map', () => {
  const screen = [1280, 720];
  for (const place of ['park', 'station', 'market']) {
    const a = createAtlas({ place, tracks: trackList(beats(), false) });
    const { x, y } = viewAt(a, map, screen), [cx, cy] = map.places[place].view;
    assert.ok(x >= 0 && y >= 0 && x + screen[0] <= map.size[0] && y + screen[1] <= map.size[1], `${place}: ${x}, ${y}`);
    assert.ok(x === 0 || x === map.size[0] - screen[0] || Math.abs(x + screen[0] / 2 - cx) <= 1, `${place} centred across`);
    assert.ok(y === 0 || y === map.size[1] - screen[1] || Math.abs(y + screen[1] / 2 - cy) <= 1, `${place} centred down`);
    const [px, py] = map.places[place].pin;
    assert.ok(px > x && px < x + screen[0] && py > y && py < y + screen[1], `${place}'s pin is in view`);
  }
  const wide = viewAt(createAtlas({ tracks: [] }), map, map.size);
  assert.deepEqual(wide, { x: 0, y: 0 }, 'a screen as big as the map sees all of it');
});
````

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL. `test/atlas.test.js` can't load (`Cannot find module '…/open-case/src/atlas.js'`). That's 1 failing file; the other 380 tests pass.

- [ ] **Step 3: The workings**

Create `open-case/src/atlas.js`:

````js
// The map you choose where to busk on, and what track to play (the start screens): which place is
// chosen, whether the "What track?" panel is open and which track it's on, what a key or a click does,
// and where the view of the map is centred. Pure, so it's tested in Node; atlasview.js shows it as page
// elements over the canvas, and main.js wires it to the keys, the mouse and the band.
import { PLACE_IDS } from './places.js';
import { READY } from './beats.js';

// The tracks to choose from: the five ready-made ones, free to everyone, then your own beats (studio.js
// slots) once the studio is yours. Each: { key: { ready: id } | { slot: i }, name, bpm, mood }.
export function trackList(beats, studio) {
  const list = READY.map((b) => ({ key: { ready: b.id }, name: b.name, bpm: b.bpm, mood: b.mood }));
  if (studio) beats.slots.forEach((b, i) => b && list.push({ key: { slot: i }, name: b.name, bpm: b.bpm, mood: b.mood }));
  return list;
}

const sameKey = (a, b) => !!a && !!b && (a.ready ? a.ready === b.ready : a.slot === b.slot);

// The map as it opens: place the one chosen last time, chosen the track chosen last time (studio.js
// beats.chosen; the first if it's gone). straightGo: the track is already chosen (the studio's Busk to
// this), so Enter on a place goes straight there without the panel.
export function createAtlas({ place = 'park', tracks, chosen = null, straightGo = false }) {
  return {
    at: Math.max(0, PLACE_IDS.indexOf(place)),
    tracks,
    track: Math.max(0, tracks.findIndex((t) => sameKey(t.key, chosen))),
    panel: false,
    straightGo,
  };
}

export const placeOf = (a) => PLACE_IDS[a.at];
export const trackOf = (a) => a.tracks[a.track];

// A key on the map, by its code. Returns what happened, for main.js: 'place' (another place is chosen),
// 'panel' (the tracks open), 'track' (another track is chosen), 'go' (busk at the chosen place, to the
// chosen track), 'back' (the panel closes), or null (the key does nothing here).
//   Left and right step through the places, round from the last to the first; Enter or Space opens
//   the tracks (or goes, with straightGo). With the tracks open, up and down choose one, Enter or Space
//   goes, and Esc closes them.
export function atlasKey(a, code) {
  const enter = code === 'Enter' || code === 'NumpadEnter' || code === 'Space';
  if (!a.panel) {
    if (code === 'ArrowLeft' || code === 'ArrowRight') {
      const n = PLACE_IDS.length;
      a.at = (a.at + (code === 'ArrowRight' ? 1 : -1) + n) % n;
      return 'place';
    }
    if (enter) return openTracks(a);
    return null;
  }
  if (code === 'ArrowUp' || code === 'ArrowDown') {
    const next = Math.min(a.tracks.length - 1, Math.max(0, a.track + (code === 'ArrowDown' ? 1 : -1)));
    if (next === a.track) return null;
    a.track = next;
    return 'track';
  }
  if (enter) return 'go';
  if (code === 'Escape') {
    a.panel = false;
    return 'back';
  }
  return null;
}

function openTracks(a) {
  if (a.straightGo) return 'go';
  a.panel = true;
  return 'panel';
}

// A click on a place (its picture or its label): a place not chosen is chosen; the chosen one opens
// the tracks (or goes, with straightGo). With the tracks open, a click on a place chooses it and
// closes them. Returns as atlasKey does.
export function clickPlace(a, id) {
  const at = PLACE_IDS.indexOf(id);
  if (at < 0) return null;
  if (a.panel) {
    a.panel = false;
    a.at = at;
    return 'back';
  }
  if (at !== a.at) {
    a.at = at;
    return 'place';
  }
  return openTracks(a);
}

// A click on track i in the panel: chooses it, or on the one already chosen, goes.
export function clickTrack(a, i) {
  if (!a.panel || i < 0 || i >= a.tracks.length) return null;
  if (i === a.track) return 'go';
  a.track = i;
  return 'track';
}

// Where the view of the map sits, its top left in map pixels, for a screen (view) of [w, h]: centred on
// the chosen place's view point (map.json places), kept inside the map.
export function viewAt(a, map, [w, h]) {
  const [cx, cy] = map.places[placeOf(a)].view;
  const clamp = (v, most) => Math.max(0, Math.min(most, v));
  return { x: Math.round(clamp(cx - w / 2, map.size[0] - w)), y: Math.round(clamp(cy - h / 2, map.size[1] - h)) };
}
````

- [ ] **Step 4: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 387 tests.

- [ ] **Step 5: Commit**

```bash
git add open-case/src/atlas.js open-case/test/atlas.test.js
git commit -m "Open Case: the map's workings: choosing a place and a track, with the keys or the mouse, and where the view sits

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: The map on screen

**Files:**
- Create: `open-case/src/atlasview.js`
- Modify: `open-case/index.html`, `open-case/src/audio.js`
- Test: `open-case/test/page.test.js`, `open-case/test/audio.test.js`

**Interfaces:**
- Consumes: `atlas.js` (Task 6), `map.json` and the pictures (Task 5), `PLACE_IDS` and `PLACE_WORDS` (Task 1), `moodName` (beats.js).
- Produces:
  - `SCREEN` (`[1280, 720]`, the view in map pixels) and `createAtlasView(root, on, base?)` -> a promise of `{ map, show(a, { time, dt, still }), hide() }`. `on` is `{ place(id), track(i) }`, called on a click. `show` is called every frame while the map is up.
  - `audio.previewBand(at, beat)`: every part of a track, softly.
  - In `index.html`: `<div id="atlas" hidden>`, the map's styles, and the Pixelify Sans font. Nothing uses them until Task 8.

- [ ] **Step 1: Write the failing tests**

Apply to `open-case/test/page.test.js`:

````diff
diff --git a/open-case/test/page.test.js b/open-case/test/page.test.js
index f779bf8..b5db09f 100644
--- a/open-case/test/page.test.js
+++ b/open-case/test/page.test.js
@@ -16,10 +16,15 @@ test('the sound check has a switch for every layer', () => {
   for (const id of ['keys', 'drums', 'bass', 'top']) assert.match(html, new RegExp(`data-layer="${id}"`));
 });
 
-test('the page loads the game as a module, with its icon and the Silkscreen font', () => {
+test('the page loads the game as a module, with its icon, the Silkscreen font and the map\'s Pixelify Sans', () => {
   assert.match(html, /<script type="module" src="\.\/src\/main\.js"><\/script>/);
   assert.match(html, /<link rel="icon" href="icon\.png">/);
   assert.match(html, /family=Silkscreen/);
+  assert.match(html, /family=Pixelify\+Sans/);
+});
+
+test('the map has its place on the page, hidden until the title card is gone', () => {
+  assert.match(html, /<div id="atlas" hidden[^>]*><\/div>/);
 });
 
 test('the sound check has a choice of beats', () => {
````

Apply to `open-case/test/audio.test.js`:

````diff
diff --git a/open-case/test/audio.test.js b/open-case/test/audio.test.js
index def582a..f7f08e7 100644
--- a/open-case/test/audio.test.js
+++ b/open-case/test/audio.test.js
@@ -630,6 +630,23 @@ test("in the shop, the band plays its electric piano alone, softer, so you can t
     assert.ok(tryLevel > 0 && tryLevel < setLevel * 0.7, `${tryLevel} next to ${setLevel} in a set`);
   }));
 
+test("on the map, the track you're choosing plays every part, softer than in a set", () =>
+  withAudio((ctx) => {
+    const audio = createAudio(memoryStorage());
+    audio.start();
+    audio.previewBand(1, readyBeat('funk'));
+    const last = (g) => g.gain.events.at(-1)[1];
+    for (const { id } of LAYERS) assert.equal(last(ctx().busGain(id)), 1, id);
+    assert.equal(last(ctx().busGain('perc')), 0, 'the drums play, so no stand-in percussion');
+    const band = ctx().busGain('keys').outs[0];
+    const preview = band.gain.events.filter(([how, , t]) => how === 'set' && t === 1).at(-1)[1];
+    audio.startBand(5);
+    const set = band.gain.events.filter(([how, , t]) => how === 'set' && t === 5).at(-1)[1];
+    assert.ok(preview > 0 && preview < set * 0.7, `${preview} next to ${set} in a set`);
+    audio.previewBand(6, readyBeat('bossa')); // the next track you choose takes over, as softly
+    assert.equal(band.gain.events.filter(([how, , t]) => how === 'set' && t === 6).at(-1)[1], preview);
+  }));
+
 test('choosing the loop pedal in the shop, then moving straight on: the tried chord never sounds', () =>
   withAudio((ctx) => {
     const audio = createAudio(memoryStorage());
````

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL, 3 tests:
- "on the map, the track you're choosing plays every part…" (`audio.previewBand is not a function`);
- the two page tests, since the page has neither Pixelify Sans nor `#atlas`.

The other 386 pass.

- [ ] **Step 3: The map on the page, and the preview**

Create `open-case/src/atlasview.js`:

````js
// The map on screen: atlas.js's state shown as page elements over the canvas, the way Nathan's
// reference (his friend's atlas) shows its world. On it: the land and the pictures standing on it
// (assets/map/ and map.json, made by art/open-case/map/), each place's label and the gold pin over the
// chosen one, two clouds drifting over with their shadows; over it: the title, the track you'll play
// (or the "What track?" panel), the minimap and the keys' hint. The view is SCREEN map pixels, scaled to
// fit the window; it glides to each place you choose. A click on a place, its label or a track calls
// on.place(id) or on.track(i), for main.js to hand to atlas.js.
import { PLACE_IDS, PLACE_WORDS } from './places.js';
import { moodName } from './beats.js';
import { placeOf, trackOf, viewAt } from './atlas.js';

export const SCREEN = [1280, 720]; // the view of the map, in map pixels, before it's scaled to the window
const GLIDE = 6; // how fast the view glides to a place: about this share of the way each second
const CLOUD_SPEED = 6; // map pixels a second a cloud drifts east
const CLOUD_SHADOW = [40, 70]; // where a cloud's shadow falls, from the cloud
const BOB = 2; // pixels the pin bobs up and down
const MINI = [192, 108]; // the minimap, in its own pixels
const PIN = '<svg width="22" height="30" viewBox="0 0 11 15" shape-rendering="crispEdges"><path d="M3 0h5v1h1v1h1v1h1v4h-1v2h-1v2h-1v2h-1v2h-1v1h-1v-1h-1v-2h-1v-2h-1v-2h-1v-2h-1v-4h1v-1h1v-1h1z" fill="#fcd062"/><path d="M4 3h3v1h1v3h-1v1h-3v-1h-1v-3h1z" fill="#1c1626"/><rect x="3" y="1" width="2" height="1" fill="#fff2cc"/></svg>';

function el(tag, className, parent, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  parent?.append(e);
  return e;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`couldn't load ${src}`));
    img.src = src;
  });
}

// root: the page's #atlas, empty and hidden. on: { place(id), track(i) }.
export async function createAtlasView(root, on, base = new URL('../assets/map/', import.meta.url)) {
  const map = await (await fetch(new URL('map.json', base))).json();
  const [mapW, mapH] = map.size;
  const stage = el('div', 'stage', root);
  const world = el('div', 'world', stage);
  world.style.width = `${mapW}px`;
  world.style.height = `${mapH}px`;
  const land = await loadImage(new URL(map.land, base));
  land.className = 'land';
  land.alt = '';
  world.append(land);
  for (const p of map.pictures) {
    const img = await loadImage(new URL(`${p.name}.png`, base));
    Object.assign(img.style, { left: `${p.x}px`, top: `${p.y}px` });
    img.alt = '';
    if (PLACE_IDS.includes(p.name)) {
      img.classList.add('place');
      img.addEventListener('click', () => on.place(p.name));
    }
    world.append(img);
  }
  const labels = {};
  for (const id of PLACE_IDS) {
    const [x, y] = map.places[id].label;
    const label = el('button', 'label', world);
    label.type = 'button';
    Object.assign(label.style, { left: `${x}px`, top: `${y}px` });
    const name = el('span', 'name', label);
    el('span', 'dot', name);
    name.append(PLACE_WORDS[id].name);
    el('span', 'crowd', label, PLACE_WORDS[id].crowd);
    label.addEventListener('click', () => on.place(id));
    labels[id] = label;
  }
  const pin = el('div', 'pin', world);
  pin.innerHTML = PIN;
  const clouds = [];
  for (const c of map.clouds) {
    const img = await loadImage(new URL(`${c.name}.png`, base));
    const shadow = img.cloneNode();
    img.className = 'cloud';
    shadow.className = 'cloud shadow';
    for (const i of [img, shadow]) i.style.width = `${img.width * 2}px`;
    world.append(shadow, img);
    clouds.push({ img, shadow, x: c.x, y: c.y, w: img.width * 2 });
  }

  el('div', 'shade', stage);
  el('h1', 'title', stage, 'Where to busk?');
  const chip = el('div', 'chip', stage);
  el('span', 'music', chip, '♪');
  const chipWords = el('div', null, chip);
  const chipName = el('div', 'big', chipWords), chipAbout = el('div', 'small', chipWords);
  const panel = el('div', 'panel', stage);
  el('h2', null, panel, 'What track?');
  const rows = el('div', 'rows', panel);
  el('div', 'foot', panel, '↑↓ choose · enter busk here · esc back');
  const mini = el('div', 'minimap', stage);
  const miniCanvas = el('canvas', null, mini);
  [miniCanvas.width, miniCanvas.height] = MINI;
  const miniG = miniCanvas.getContext('2d');
  const miniCap = el('div', 'cap', mini);
  el('span', null, miniCap, 'the city');
  const miniAt = el('span', null, miniCap);
  el('div', 'compass', stage, 'N ↑');
  const hint = el('div', 'hint', stage);

  const fit = () => stage.style.setProperty('--s', String(Math.min(innerWidth / SCREEN[0], innerHeight / SCREEN[1])));
  fit();
  addEventListener('resize', fit);

  let view = null; // where the view is, gliding toward where it should be
  let rowsOf = null; // the track list the panel's rows were made for
  const about = (t) => `${t.bpm} bpm · ${moodName(t.mood)}`;

  // The panel's rows: the ready-made tracks, then your own under their own heading.
  function makeRows(tracks) {
    rows.replaceChildren();
    el('div', 'eyebrow', rows, 'ready-made');
    tracks.forEach((t, i) => {
      if (t.key.slot !== undefined && tracks[i - 1]?.key.ready) el('div', 'eyebrow', rows, 'your tracks');
      const row = el('button', 'row', rows);
      row.type = 'button';
      el('span', 'tname', row, t.name);
      el('small', null, row, about(t));
      row.addEventListener('click', () => on.track(i));
    });
    rowsOf = tracks;
  }

  return {
    map,
    // Called every frame while the map is up: a (atlas.js), time (seconds on the page's clock), dt
    // (seconds since the last frame), still (reduced motion: no gliding, drifting or bobbing).
    show(a, { time, dt, still }) {
      root.hidden = false;
      const target = viewAt(a, map, SCREEN);
      if (!view || still) view = { ...target };
      else {
        const k = 1 - Math.exp(-GLIDE * Math.min(dt, 0.1));
        view.x += (target.x - view.x) * k;
        view.y += (target.y - view.y) * k;
      }
      world.style.transform = `translate(${-Math.round(view.x)}px, ${-Math.round(view.y)}px)`;
      const place = placeOf(a);
      for (const id of PLACE_IDS) labels[id].classList.toggle('on', id === place);
      const [px, py] = map.places[place].pin;
      const bob = still ? 0 : Math.round(((Math.sin(time * 3) + 1) / 2) * BOB);
      Object.assign(pin.style, { left: `${px}px`, top: `${py - bob}px` });
      for (const c of clouds) {
        const x = still ? c.x : ((c.x + time * CLOUD_SPEED) % (mapW + c.w)) - c.w;
        Object.assign(c.img.style, { left: `${Math.round(x)}px`, top: `${c.y}px` });
        Object.assign(c.shadow.style, { left: `${Math.round(x) + CLOUD_SHADOW[0]}px`, top: `${c.y + CLOUD_SHADOW[1]}px` });
      }
      const t = trackOf(a);
      chip.hidden = a.panel || !t;
      if (t) {
        chipName.textContent = t.name;
        chipAbout.textContent = about(t);
      }
      panel.hidden = !a.panel;
      if (a.panel) {
        if (rowsOf !== a.tracks) makeRows(a.tracks);
        [...rows.querySelectorAll('.row')].forEach((r, i) => r.classList.toggle('on', i === a.track));
      }
      hint.textContent = a.panel ? '↑↓ choose a track · enter to busk · esc back'
        : `← → choose a place · enter ${a.straightGo ? 'to busk here' : 'to go'}`;
      miniG.imageSmoothingEnabled = true;
      miniG.drawImage(land, 0, 0, MINI[0], MINI[1]);
      const k = MINI[0] / mapW;
      for (const id of PLACE_IDS) {
        const [lx, ly] = map.places[id].label;
        miniG.fillStyle = id === place ? '#fcd062' : '#f3ead0';
        miniG.fillRect(Math.round(lx * k) - 2, Math.round(ly * k) - 4, 4, 4);
      }
      miniG.strokeStyle = '#f3ead0';
      miniG.strokeRect(Math.round(view.x * k) + 0.5, Math.round(view.y * k) + 0.5, Math.round(SCREEN[0] * k), Math.round(SCREEN[1] * k));
      miniAt.textContent = `${a.at + 1} / ${PLACE_IDS.length}`;
    },
    hide() {
      root.hidden = true;
      view = null;
    },
  };
}
````

Apply to `open-case/index.html`:

````diff
diff --git a/open-case/index.html b/open-case/index.html
index f2bfe36..fd7521d 100644
--- a/open-case/index.html
+++ b/open-case/index.html
@@ -7,7 +7,7 @@
   <link rel="icon" href="icon.png">
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
-  <link href="https://fonts.googleapis.com/css2?family=Silkscreen&display=swap" rel="stylesheet">
+  <link href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;600&family=Silkscreen&display=swap" rel="stylesheet">
   <style>
     html, body { margin: 0; height: 100%; overflow: hidden; background: #121230; }
     body { display: grid; place-items: center; }
@@ -28,10 +28,54 @@
     .card label { display: flex; gap: 8px; align-items: center; }
     .card input[type=range] { flex: 1; }
     #log { margin: 0; padding-left: 20px; font-size: 10px; }
+    /* The map (atlasview.js): a view of SCREEN map pixels, scaled to fit the window, in Pixelify Sans
+       like the atlas it's drawn after. Its panels are dark green with a pale rim; the chosen place's
+       label is gold. */
+    #atlas { position: fixed; inset: 0; overflow: hidden; background: #1d3328; z-index: 1; }
+    #atlas[hidden], #atlas [hidden] { display: none !important; }
+    #atlas .stage { position: absolute; left: 50%; top: 50%; width: 1280px; height: 720px; overflow: hidden; transform: translate(-50%, -50%) scale(var(--s, 1)); font: 16px/1.2 'Pixelify Sans', monospace; color: #f3ead0; }
+    #atlas * { font-variant-ligatures: none; } /* Pixelify Sans joins "fi" into a shape that reads as "A" */
+    #atlas .world { position: absolute; left: 0; top: 0; }
+    #atlas .world img { position: absolute; image-rendering: pixelated; user-select: none; }
+    #atlas .world img.land { left: 0; top: 0; width: 100%; height: 100%; }
+    #atlas .world img.place { cursor: pointer; }
+    #atlas .cloud { opacity: 0.85; pointer-events: none; }
+    #atlas .cloud.shadow { filter: brightness(0); opacity: 0.12; }
+    #atlas .shade { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(180deg, #0a140e59 0%, #0a140e00 22%, #0a140e00 80%, #0a140e66 100%); }
+    #atlas .label { position: absolute; transform: translate(-50%, 0); display: grid; justify-items: center; gap: 2px; padding: 0; background: none; border: 0; font: inherit; color: inherit; cursor: pointer; }
+    #atlas .label .name { display: flex; align-items: center; gap: 8px; padding: 5px 10px 5px 8px; background: #1c2c22db; border: 2px solid #d6e2be47; font-size: 18px; white-space: nowrap; }
+    #atlas .label .dot { width: 6px; height: 6px; background: currentColor; }
+    #atlas .label .crowd { font-size: 12px; letter-spacing: 0.03em; text-shadow: 1px 1px 0 #10201a, -1px 1px 0 #10201a; }
+    #atlas .label.on .name { border-color: #fcd062; color: #fcd062; }
+    #atlas .label:focus-visible .name, #atlas .row:focus-visible { outline: 2px solid #fcd062; }
+    #atlas .pin { position: absolute; transform: translate(-50%, -100%); pointer-events: none; filter: drop-shadow(2px 2px 0 #10201a); }
+    #atlas .title { position: absolute; left: 26px; top: 40px; margin: 0; font-size: 44px; font-weight: 600; line-height: 1; text-shadow: 3px 3px 0 #10201a; }
+    #atlas .chip, #atlas .panel, #atlas .minimap { position: absolute; background: #1c2c22db; border: 2px solid #d6e2be47; }
+    #atlas .chip { right: 26px; top: 22px; display: flex; gap: 12px; align-items: center; padding: 9px 14px; }
+    #atlas .chip .music { font-size: 22px; color: #fcd062; }
+    #atlas .chip .big { font-size: 22px; font-weight: 600; line-height: 1; }
+    #atlas .chip .small { margin-top: 4px; font-size: 10px; color: #b9c2a6; }
+    #atlas .panel { right: 26px; top: 22px; width: 300px; display: grid; gap: 4px; padding: 14px 16px; }
+    #atlas .panel h2 { margin: 0 0 4px; font-size: 24px; font-weight: 600; }
+    #atlas .rows { display: grid; gap: 2px; }
+    #atlas .eyebrow, #atlas .foot, #atlas .hint, #atlas .compass, #atlas .minimap .cap, #atlas .row small, #atlas .chip .small { font-family: Silkscreen, monospace; letter-spacing: 0.12em; text-transform: uppercase; }
+    #atlas .eyebrow { margin-top: 6px; font-size: 10px; color: #b9c2a6; }
+    #atlas .row { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 5px 8px; background: none; border: 0; font: 17px 'Pixelify Sans', monospace; color: inherit; text-align: left; cursor: pointer; }
+    #atlas .row small { font-size: 10px; color: #b9c2a6; }
+    #atlas .row.on { background: #fcd0622e; outline: 2px solid #fcd062; color: #fcd062; }
+    #atlas .row.on small { color: #fcd062; }
+    #atlas .foot { margin-top: 8px; font-size: 10px; color: #b9c2a6; }
+    #atlas .minimap { left: 26px; bottom: 26px; padding: 4px; }
+    #atlas .minimap canvas { display: block; image-rendering: pixelated; }
+    #atlas .minimap .cap { display: flex; justify-content: space-between; margin-top: 3px; font-size: 9px; color: #b9c2a6; }
+    #atlas .compass { position: absolute; left: 30px; bottom: 160px; font-size: 12px; text-shadow: 1px 1px 0 #10201a; }
+    #atlas .hint { position: absolute; right: 26px; bottom: 24px; font-size: 10px; color: #b9c2a6; text-shadow: 1px 1px 0 #10201a; }
+    a.back { z-index: 2; }
   </style>
 </head>
 <body>
   <canvas id="game" aria-label="Open Case: a busking game played on the keyboard"></canvas>
+  <div id="atlas" hidden aria-label="A map of the city: choose where to busk, and what track to play"></div>
   <a class="back" href="../">← games</a>
   <form class="card" id="end" hidden onsubmit="return false">
     <h2>Set over</h2>
````

Apply to `open-case/src/audio.js`:

````diff
diff --git a/open-case/src/audio.js b/open-case/src/audio.js
index e74f7ef..9539f5a 100644
--- a/open-case/src/audio.js
+++ b/open-case/src/audio.js
@@ -31,6 +31,7 @@ const BRIGHT = [0.2, 0.35, 0.55, 0.8]; // the acoustic's pick's brightness by st
 const BAND_LEVEL = 0.55; // the band bus's level under your instrument
 // ...and in the shop, where the electric piano plays alone while you try the loop pedal.
 const TRY_LEVEL = 0.35;
+const PREVIEW_LEVEL = 0.3; // the band's level on the map, as you choose a track
 // The percussion standing in for the drums: on only while the drums slot is off. Lo-fi and soft, not
 // a metronome: a shaker, a finger snap and a low tap, not a beeping tone.
 const PERC_SHAKER_HZ = 7000; // the shaker: bright but soft noise
@@ -902,6 +903,13 @@ export function createAudio(storage) {
     wobble.gain.setTargetAtTime(0, at, 0.5);
   }
 
+  // A track heard on the map while you choose it: every part playing, softly.
+  function previewBand(at, b = LOFI) {
+    if (!ctx) return;
+    startBand(at, b, PREVIEW_LEVEL);
+    for (const { id } of LAYERS) setLayer(id, true, at);
+  }
+
   // The end of the set: the band and your loop fade out over a bar from `at`, and stop.
   function endBand(at) {
     if (!ctx) return;
@@ -1050,7 +1058,7 @@ export function createAudio(storage) {
   }
 
   return {
-    start, now, warm, noteOn, noteOff, setRing, setInstrument, setPedal, startBand, editBand, setBeat, playWritten, tryBand, endBand, stopBand,
+    start, now, warm, noteOn, noteOff, setRing, setInstrument, setPedal, startBand, editBand, setBeat, playWritten, tryBand, previewBand, endBand, stopBand,
     stopLoop, countIn, setLayer, update, coin, clap, reportedLatency, heardAt,
     // the band's first 16th on the audio clock (null with no band): band time counts from it
     get bandStart() {
````

- [ ] **Step 4: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 389 tests.

- [ ] **Step 5: Commit**

```bash
git add open-case/src/atlasview.js open-case/index.html open-case/src/audio.js open-case/test/page.test.js open-case/test/audio.test.js
git commit -m "Open Case: the map on screen: the land and its places, the labels and the pin, the clouds, the track panel and the minimap; the band plays a track softly while you choose it

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: The game opens on the map

**Files:**
- Modify: `open-case/src/main.js`, `open-case/src/render.js`, `open-case/src/log.js`, `README.md`, `docs/superpowers/specs/2026-10-01-open-case-places-design.md`
- Test: `open-case/test/render.test.js`, `open-case/test/log.test.js`

**Interfaces:**
- Consumes: everything above.
- Produces the flow:
  - The title card leads to the map (screen `'map'`). Enter or a click goes to the place (screen `'ready'`), and the place and track are kept.
  - Another set, the shop's Esc and door, and the studio's Esc all open the map again, with your last answers chosen. The studio's Busk to this opens it to go straight.
  - `?place=` skips the map.
  - The end card says where the set was ("in the case at the station"), and the log keeps `place`.
  - The waiting prompt sits on a dark backing; the shop says "back to the map".

- [ ] **Step 1: Write the failing tests**

Apply to `open-case/test/render.test.js`:

````diff
diff --git a/open-case/test/render.test.js b/open-case/test/render.test.js
index 2964206..fca76d5 100644
--- a/open-case/test/render.test.js
+++ b/open-case/test/render.test.js
@@ -246,6 +246,11 @@ test("waiting for the first note, the park names the beat your set will play whe
   const plain = draw({ screen: 'ready' });
   assert.deepEqual(plain.positions.map((p) => [p.s, p.x, p.y]), draw({ screen: 'ready', busking: null }).positions.map((p) => [p.s, p.x, p.y]));
   assert.ok(!plain.texts.some((s) => s.startsWith('busking')), 'without the studio, the prompt alone, as today');
+  // Both lines on a dark backing, which reads over the station's lamps and the market's lanterns.
+  for (const [over, top] of [[{ busking: 'Funk 2' }, 47], [{}, 57]]) {
+    const backing = draw({ screen: 'ready', ...over }).rects.find(([, y, , h, c]) => y === top && y + h === 70 && c === data.colors.ink);
+    assert.ok(backing && backing[0] < W / 2 - 80 && backing[0] + backing[2] > W / 2 + 80, `a backing from ${top}`);
+  }
   assert.ok(plain.texts.includes('play a note to start the set'));
   assert.ok(!draw({ busking: 'Funk 2', set: createSet(1) }).texts.some((s) => s.startsWith('busking')), 'not once the set is playing');
 });
@@ -364,7 +369,7 @@ test('the shop: the room, the stock with its tags, the chosen item lifted, the s
   assert.deepEqual(drawn(g, 'item-').filter((s) => s.name.endsWith('-1')).map((s) => s.name), ['item-chorus-1'], 'only the chosen one lifted');
   assert.equal(drawn(g, 'tag-yours').length, 2, 'the overdrive and the acoustic are yours');
   assert.equal(drawn(g, 'tag-price').length, STOCK.length - 2);
-  for (const s of ['back to', 'the park', 'saved', '5 coins', 'Chorus', '50 coins', 'Not enough coins yet (you have 5)']) {
+  for (const s of ['back to', 'the map', 'saved', '5 coins', 'Chorus', '50 coins', 'Not enough coins yet (you have 5)']) {
     assert.ok(g.texts.includes(s), s);
   }
   assert.equal(drawn(g, 'ground').length, 0, 'not the park');
@@ -656,18 +661,17 @@ test("in the shop, the loop pedal's light shows the loop you're trying, and its
   assert.ok(g.texts.includes('R record   backspace undo   esc back'));
 });
 
-test("the loop pedal's key line is no longer than another item's, so it never runs under the Buy button", () => {
+test("every item's key line ends before the Buy button, the loop pedal's longest one too", () => {
   const gear = { ...freshGear(), savings: 1000 };
-  const keysFor = (id) => {
+  for (const item of STOCK) {
     const shop = createShop();
-    choose(shop, STOCK.findIndex((s) => s.id === id));
+    choose(shop, STOCK.indexOf(item));
     const g = fakeContext();
     createRenderer(g, art)(view({ screen: 'shop', shop, gear, t: 0, time: 5 }));
-    return g.texts.find((s) => s.includes('esc back'));
-  };
-  const loopKeys = keysFor('loop');
-  const otherKeys = keysFor(STOCK.find((s) => s.kind !== 'loop').id);
-  assert.ok(loopKeys.length <= otherKeys.length, `${loopKeys} (${loopKeys.length}) vs ${otherKeys} (${otherKeys.length})`);
+    const keys = g.positions.find((p) => p.s.includes('esc back'));
+    // 6 px a letter (the stand-in's measure, a little wider than Silkscreen's)
+    assert.ok(keys.x + keys.s.length * 6 <= BUTTON[0] - 2, `${item.id}: "${keys.s}" ends at ${keys.x + keys.s.length * 6}`);
+  }
 });
 
 test("with another beat, the bar counter counts that set's bars, and listeners nod on its beats", () => {
````

Apply to `open-case/test/log.test.js`:

````diff
diff --git a/open-case/test/log.test.js b/open-case/test/log.test.js
index 0a90d9c..2c17a03 100644
--- a/open-case/test/log.test.js
+++ b/open-case/test/log.test.js
@@ -57,3 +57,9 @@ test('each set logs how many loop layers were recorded in it', () => {
   logChoice(s, 'another');
   assert.deepEqual(readLog(s), [{ date: '2026-09-30T20:00:00Z', coins: 25, stopped: 4, instrument: 'electric', pedals: [], layers: 3, choice: 'another' }]);
 });
+
+test('each set logs where it was played', () => {
+  const s = memoryStorage();
+  logSet(s, { date: '2026-10-01T18:00:00Z', coins: 14, stopped: 4, beat: 'Funk', place: 'station' });
+  assert.equal(readLog(s)[0].place, 'station');
+});
````

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL, 2 tests:
- "waiting for the first note, the park names the beat…" (`a backing from 47`);
- "the shop: the room, the stock with its tags…" (`the map`).

The other 388 pass.

- [ ] **Step 3: The flow, the prompt and the shop's words**

Apply to `open-case/src/render.js`:

````diff
diff --git a/open-case/src/render.js b/open-case/src/render.js
index c9e6eca..8e1b939 100644
--- a/open-case/src/render.js
+++ b/open-case/src/render.js
@@ -483,7 +483,7 @@ export function createRenderer(g, art) {
     const S = data.shop;
     sprite('shop-room', 0, 0);
     text('back to', S.sign[0], S.sign[1], C.ink, 'center');
-    text('the park', S.sign[0], S.sign[1] + 8, C.ink, 'center');
+    text('the map', S.sign[0], S.sign[1] + 8, C.ink, 'center');
     text('saved', S.board[0], S.board[1], C.grey, 'center');
     text(`${gear.savings} coin${gear.savings === 1 ? '' : 's'}`, S.board[0], S.board[1] + 11, C.light, 'center');
     const since = time - shop.soldAt;
@@ -513,7 +513,7 @@ export function createRenderer(g, art) {
     text(words.price, CARD[0] + CARD[2] - 6, CARD[1] + 3, words.price === 'yours' ? C.go : C.gold, 'right');
     text(words.about, CARD[0] + 6, CARD[1] + 12, C.grey);
     text(words.says, CARD[0] + 6, CARD[1] + 21, words.button ? C.gold : C.light);
-    const keys = STOCK[shop.at].kind === 'loop' ? 'R record   backspace undo   esc back' : 'arrows choose   esc back to the park';
+    const keys = STOCK[shop.at].kind === 'loop' ? 'R record   backspace undo   esc back' : 'arrows choose   esc back to the map';
     text(keys, CARD[0] + 6, CARD[1] + 30, C.greyDark);
     if (words.button) {
       px(BUTTON[0], BUTTON[1], BUTTON[2], BUTTON[3], C.gold);
@@ -584,6 +584,12 @@ export function createRenderer(g, art) {
     if (keys && screen !== 'title') hud(view, screen === 'ready' ? null : set);
     if (screen === 'title') title();
     else if (screen === 'ready') {
+      // on a dark backing, so it reads over the station's lamps and board, or the market's lanterns
+      const lines = [view.busking && `busking to ${view.busking}`, 'play a note to start the set'].filter(Boolean);
+      const w = Math.ceil(Math.max(...lines.map(measure))) + 12, top = view.busking ? 47 : 57;
+      g.globalAlpha = BACKING;
+      px(Math.round(W / 2 - w / 2), top, w, 70 - top, C.ink);
+      g.globalAlpha = 1;
       if (view.busking) text(`busking to ${view.busking}`, W / 2, 50, C.gold, 'center');
       text('play a note to start the set', W / 2, 60, C.light, 'center');
     } else if (screen === 'paused') { // dimmed, under the pause card (index.html)
````

Apply to `open-case/src/log.js`:

````diff
diff --git a/open-case/src/log.js b/open-case/src/log.js
index aad3ac6..edbd80e 100644
--- a/open-case/src/log.js
+++ b/open-case/src/log.js
@@ -1,6 +1,6 @@
 // The test log: this computer remembers the last LOG_SIZE sets (the date, coins, how many stopped, the
 // instrument played, the pedals that were on at any point, how many loop layers were recorded, the
-// beat played, and whether Nathan chose Another set, Stop here, Visit the shop or Studio), under
+// beat played, where, and whether Nathan chose Another set, Stop here, Visit the shop or Studio), under
 // open-case-log in local storage; and the last LOG_SIZE things he bought, with their dates, under
 // open-case-buys.
 import { LOG_SIZE } from './tuning.js';
@@ -19,7 +19,7 @@ function readList(storage, key) {
 export const readLog = (storage) => readList(storage, KEY);
 export const readBuys = (storage) => readList(storage, BUYS);
 
-// A set just ended: { date, coins, stopped, instrument, pedals, layers, beat }. Its choice is filled
+// A set just ended: { date, coins, stopped, instrument, pedals, layers, beat, place }. Its choice is filled
 // in when a button is pressed.
 export function logSet(storage, entry) {
   const list = readLog(storage);
````

Apply to `open-case/src/main.js`:

````diff
diff --git a/open-case/src/main.js b/open-case/src/main.js
index 6630dec..546924f 100644
--- a/open-case/src/main.js
+++ b/open-case/src/main.js
@@ -5,18 +5,21 @@
 // the audio is suspended, so the set's clock stops with it. Notes reach the set the moment they're
 // played, timed in seconds since the first note.
 //
-// Between sets, the end card leads to the music shop: your coins are saved, and your gear (gear.js)
-// changes how your notes sound, in the park and while you try things in the shop. Once the loop
-// pedal is yours, R records your notes into a loop (looper.js) that plays on under you; the crowd
-// only ever hears the notes you play live.
+// Before each set, the map (atlas.js, atlasview.js) asks where to busk and what track to play, your
+// last answers already chosen: the park, the station at rush hour or the night market (places.js),
+// each with its own crowd and scene. Between sets, the end card leads back to it, or to the music
+// shop: your coins are saved, and your gear (gear.js) changes how your notes sound, wherever you
+// play and while you try things in the shop. Once the loop pedal is yours, R records your notes into a
+// loop (looper.js) that plays on under you; the crowd only ever hears the notes you play live.
 //
 // URL options: ?sound (the sound check); ?debug (interest bars, the corner panel, and Run the bots on
 // the end card); ?seed=N (fixes the passers-by, and the park's windows, train and birds); ?bot=random or
-// ?bot=lick (the bot plays the set, audibly); ?sky=N (the park as it is N bars into a set, until a set
+// ?bot=lick (the bot plays the set, audibly); ?sky=N (the place as it is N bars into a set, until a set
 // starts); ?coins=N (your savings are N on this page, and nothing bought on it is kept); ?beat=lofi,
-// bossa, funk, reggae or ballad (every set plays that ready-made beat); ?studio (the studio is yours on
-// this page, the first key opens it, and nothing made on it is kept). With any of them,
-// window.__openCase exposes the game for browser checks.
+// bossa, funk, reggae or ballad (every set plays that ready-made beat); ?place=park, station or market
+// (every set is there, with no map, and the place isn't kept); ?studio (the studio is yours on this
+// page, the first key opens it, and nothing made on it is kept). With any of them, window.__openCase
+// exposes the game for browser checks.
 import { createAudio } from './audio.js';
 import { createInput } from './input.js';
 import { layoutPitches, shopKey } from './keys.js';
@@ -33,6 +36,9 @@ import { PEDALS, loadGear, saveGear, earn, buy, play, stomp, stockItem, owns } f
 import { createShop, choose, move, action, trying, hit } from './shop.js';
 import { createLoop, record, note, release, ring, step, undo, due, countBeats } from './looper.js';
 import { LOFI, clockOf, readyBeat } from './beats.js';
+import { PLACE_WORDS, isPlace, loadPlace, savePlace } from './places.js';
+import { createAtlas, atlasKey, clickPlace, clickTrack, trackList, placeOf, trackOf } from './atlas.js';
+import { createAtlasView } from './atlasview.js';
 import { createStudio, loadBeats, saveBeats, chosenBeat, advance, letGo, setErase } from './studio.js';
 import { keyDown, keyUp, mouseDown, mouseMove, mouseUp, scroll, tick } from './studioinput.js';
 import { studioHit } from './studioview.js';
@@ -53,26 +59,29 @@ const skyBar = params.has('sky') ? Math.max(0, Number.parseFloat(params.get('sky
 const debugSavings = params.has('coins') ? Math.max(0, Number.parseInt(params.get('coins'), 10) || 0) : null;
 const fixedBeat = readyBeat(params.get('beat'));
 const tryStudio = params.has('studio');
-const anyDebug = debug || !!bot || fixedSeed !== null || params.has('sound') || params.has('sky') || debugSavings !== null || !!fixedBeat || tryStudio;
+const fixedPlace = isPlace(params.get('place')) ? params.get('place') : null;
+const anyDebug = debug || !!bot || fixedSeed !== null || params.has('sound') || params.has('sky') || debugSavings !== null || !!fixedBeat || tryStudio || !!fixedPlace;
 // This page keeps nothing (?coins=N or ?studio): no gear, beats or log is written to storage.
 const keepsNothing = debugSavings !== null || tryStudio;
 
 const storage = safeStorage();
 const audio = createAudio(storage);
+const atlasOn = {}; // what a click on the map does (game() sets it up): { place(id), track(i) }
 const touchOnly = matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches;
 
 if (touchOnly) document.getElementById('phone').hidden = false;
 else if (params.has('sound')) soundCheck(audio, { debug: anyDebug });
 else {
-  // The art loads before the title card shows; if it can't, or the game can't start, say something
-  // went wrong.
-  loadArt().then(game).catch((err) => {
+  // The art and the map load before the title card shows; if they can't, or the game can't start, say
+  // something went wrong.
+  const atlasRoot = document.getElementById('atlas');
+  Promise.all([loadArt(), createAtlasView(atlasRoot, { place: (id) => atlasOn.place(id), track: (i) => atlasOn.track(i) })]).then(([art, atlasView]) => game(art, atlasView)).catch((err) => {
     console.error(err);
     document.getElementById('message').hidden = false;
   });
 }
 
-function game(art) {
+function game(art, atlasView) {
   const canvas = document.getElementById('game');
   const out = canvas.getContext('2d', { alpha: false });
   const off = document.createElement('canvas');
@@ -86,8 +95,11 @@ function game(art) {
   const t0 = performance.now();
   const pageTime = () => (performance.now() - t0) / 1000; // seconds since the page opened
 
-  let screen = 'title'; // 'ready' (waiting for your first note), 'playing', 'paused', 'over', 'shop', 'studio', 'thanks'
-  let set = null, scene = createScene(pageSeed), start = 0, seed = 0;
+  let screen = 'title'; // 'map', 'ready' (waiting for your first note), 'playing', 'paused', 'over', 'shop', 'studio', 'thanks'
+  // Where you busk: ?place='s, or the place you chose last time on the map (kept unless the page keeps
+  // nothing). The map's state while it's up (atlas.js).
+  let place = fixedPlace ?? loadPlace(storage), atlas = null;
+  let set = null, scene = createScene(pageSeed, { place }), start = 0, seed = 0;
   let botMoments = null, botNext = 0, botFed = 0;
   const latency = { reported: null, measured: null };
   // Your savings and gear. With ?coins=N your savings are N, with ?studio the studio is yours, and on
@@ -107,8 +119,8 @@ function game(art) {
   const keepBeats = () => !keepsNothing && saveBeats(storage, beats);
   let studio = null, studioSeen = -1, studioSaved = true;
   const studioHeld = { key: null }, studioDrag = { what: null }, studioWheel = {};
-  // The beat your sets play: ?beat='s, or with the studio yours, the one you chose there; else the lo-fi.
-  const setBeat = () => fixedBeat ?? (owns(gear, 'studio') ? chosenBeat(beats) : LOFI);
+  // The beat your sets play: ?beat='s, or the one you chose on the map (or with Busk to this).
+  const setBeat = () => fixedBeat ?? chosenBeat(beats);
   let stomped = null; // the last pedal stomped: { id, on, time } (its name shows over the gear strip)
   let setPedals = new Set(); // every pedal that's been on during this set, for the log
   // The loop pedal's loop in a set, empty at each set's start (in the shop, the one you try it with
@@ -137,8 +149,8 @@ function game(art) {
   // A new set begins with a note at audio time `at` (your first note, or the bot's start).
   function begin(at) {
     seed = fixedSeed ?? Date.now() % 2147483647;
-    set = createSet(seed, setBeat());
-    scene = createScene(seed, { bar: set.clock.bar, parkBar: endTime(set) / PARK.bars });
+    set = createSet(seed, setBeat(), place);
+    scene = createScene(seed, { bar: set.clock.bar, parkBar: endTime(set) / PARK.bars, place });
     start = at;
     audio.startBand(at, set.beat);
     for (const { id, min } of LAYERS) audio.setLayer(id, min === 0, at);
@@ -255,8 +267,8 @@ function game(art) {
   // Any key at all dismisses the title card and starts the sound (browsers only allow sound after a
   // key press or a click). It's heard before the keys are read, and it plays no note. Esc and a lone
   // modifier don't count as user activation in every browser, so an AudioContext started from one
-  // would stay suspended: leave them alone, doing nothing, on the title card. With ?studio, it opens
-  // the studio instead of the park.
+  // would stay suspended: leave them alone, doing nothing, on the title card. It opens the map (with
+  // ?studio, the studio; with a bot, the bot's set).
   addEventListener('keydown', (e) => {
     if (screen !== 'title' || e.metaKey || e.ctrlKey || e.altKey) return;
     if (NON_ACTIVATING_KEYS.has(e.key)) return;
@@ -266,7 +278,55 @@ function game(art) {
     warmLayout();
     if (bot) startBot();
     else if (tryStudio) openStudio();
-    else screen = 'ready';
+    else openMap();
+  });
+
+  // The map, before each set: where to busk and what track to play, your last answers already chosen.
+  // straightGo: the track's chosen already (the studio's Busk to this, or ?beat=), so Enter on a place
+  // goes straight there. With ?place= there's no map: straight to the place.
+  function openMap({ straightGo = false } = {}) {
+    audio.stopBand();
+    set = null;
+    if (fixedPlace) return toPlace();
+    atlas = createAtlas({
+      place, tracks: trackList(beats, owns(gear, 'studio')), chosen: fixedBeat ? { ready: fixedBeat.id } : beats.chosen,
+      straightGo: straightGo || !!fixedBeat,
+    });
+    canvas.hidden = true;
+    screen = 'map';
+  }
+  // At the place chosen, its scene waits for your first note.
+  function toPlace() {
+    scene = createScene(pageSeed, { place });
+    screen = 'ready';
+  }
+  const beatOf = (key) => (key.ready ? readyBeat(key.ready) : beats.slots[key.slot]) ?? LOFI;
+  // What happened on the map (atlas.js): the track you're on plays softly while the tracks are open;
+  // going keeps the place and the track for next time and sets off to the place.
+  function atlasDid(what) {
+    if (what === 'panel' || what === 'track') audio.previewBand(audio.now() + 0.1, beatOf(trackOf(atlas).key));
+    else if (what === 'back') audio.stopBand();
+    else if (what === 'go') {
+      place = placeOf(atlas);
+      if (!keepsNothing) savePlace(storage, place);
+      if (!fixedBeat) {
+        beats.chosen = { ...trackOf(atlas).key };
+        keepBeats();
+      }
+      audio.stopBand();
+      atlas = null;
+      atlasView.hide();
+      canvas.hidden = false;
+      toPlace();
+    }
+  }
+  atlasOn.place = (id) => screen === 'map' && atlasDid(clickPlace(atlas, id));
+  atlasOn.track = (i) => screen === 'map' && atlasDid(clickTrack(atlas, i));
+  addEventListener('keydown', (e) => {
+    if (screen !== 'map' || e.metaKey || e.ctrlKey || e.altKey) return;
+    const what = atlasKey(atlas, e.code);
+    if (what || e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault(); // no scrolling
+    if (what) atlasDid(what);
   });
 
   const input = createInput(window, {
@@ -371,10 +431,10 @@ function game(art) {
     // The log is Nathan's own too, and also skips a ?coins page: see `logging` above.
     if (logging) {
       const pedals = PEDALS.filter((id) => setPedals.has(id));
-      logSet(storage, { date: new Date().toISOString(), coins: s.coins, stopped: s.stopped, instrument: gear.instrument, pedals, layers: setLayers, beat: set.beat.name });
+      logSet(storage, { date: new Date().toISOString(), coins: s.coins, stopped: s.stopped, instrument: gear.instrument, pedals, layers: setLayers, beat: set.beat.name, place: set.place });
     }
     loop = createLoop(); // the loop belongs to the set, and it's over
-    document.getElementById('end-coins').textContent = `${s.coins} coin${s.coins === 1 ? '' : 's'} in the case.`;
+    document.getElementById('end-coins').textContent = `${s.coins} coin${s.coins === 1 ? '' : 's'} in the case ${PLACE_WORDS[set.place].at}.`;
     document.getElementById('end-saved').textContent = `Saved: ${gear.savings} coin${gear.savings === 1 ? '' : 's'}.`;
     document.getElementById('end-saved').hidden = !!bot;
     document.getElementById('shop').hidden = !!bot;
@@ -395,7 +455,7 @@ function game(art) {
     const sets = readLog(storage).map((e) => ({
       date: e.date,
       text: `${e.coins} coins, ${e.stopped} stopped, ${[e.instrument ?? 'acoustic', ...(e.pedals ?? [])].join(' + ')}, `
-        + `${e.layers ? `${e.layers} loop layer${e.layers === 1 ? '' : 's'}, ` : ''}${e.beat ? `${e.beat}, ` : ''}${e.choice ?? 'no choice yet'}`,
+        + `${e.layers ? `${e.layers} loop layer${e.layers === 1 ? '' : 's'}, ` : ''}${e.beat ? `${e.beat}, ` : ''}${e.place ? `${e.place}, ` : ''}${e.choice ?? 'no choice yet'}`,
     }));
     const buys = readBuys(storage).map((e) => ({ date: e.date, text: `bought the ${stockItem(e.id)?.name.toLowerCase() ?? e.id} for ${e.price}` }));
     document.getElementById('log').replaceChildren(...[...sets, ...buys].sort((a, b) => b.date.localeCompare(a.date)).map((e) => {
@@ -409,10 +469,8 @@ function game(art) {
     if (logging) logChoice(storage, 'another');
     end.hidden = true;
     audio.stopBand();
-    set = null;
-    scene = createScene(pageSeed);
     if (bot) startBot();
-    else screen = 'ready';
+    else openMap();
   });
   document.getElementById('stop').addEventListener('click', () => {
     if (logging) logChoice(storage, 'stop');
@@ -426,14 +484,14 @@ function game(art) {
     end.hidden = true;
     audio.stopBand();
     set = null;
-    scene = createScene(pageSeed);
     shop = createShop(clockOf(setBeat()));
     screen = 'shop';
     sound();
   });
 
   // The studio: its beat plays round and round, every part at once, while you make it. Esc leaves for
-  // the park, ready for the next set, and so does Busk to this, once it has kept your choice.
+  // the map, ready for the next set, and so does Busk to this, once it has kept your choice (the map
+  // then only asks where).
   document.getElementById('studio').addEventListener('click', () => {
     if (logging) logChoice(storage, 'studio');
     openStudio();
@@ -444,7 +502,6 @@ function game(art) {
     end.hidden = true;
     audio.stopBand();
     set = null;
-    scene = createScene(pageSeed);
     studio = createStudio(beats);
     studioSeen = studio.version;
     const at = audio.now() + 0.1;
@@ -463,13 +520,12 @@ function game(art) {
     studioHeld.key = null;
     studioDrag.what = null;
   }
-  function leaveStudio() {
+  function leaveStudio(busked = false) {
     keepBeats();
     letGoStudio();
     studio = null;
-    audio.stopBand();
-    screen = 'ready';
     canvas.style.cursor = '';
+    openMap({ straightGo: busked });
   }
   const bandTime = () => audio.now() - audio.bandStart;
   // The browser's own uses of the studio's keys are kept off: Cmd+S would save the page, and while
@@ -494,7 +550,7 @@ function game(art) {
   canvas.addEventListener('mousedown', (e) => {
     if (screen !== 'studio' || e.button !== 0) return;
     e.preventDefault();
-    if (mouseDown(studio, studioDrag, ...scenePoint(e), bandTime(), pageTime()) === 'busk') leaveStudio(); // it keeps your beats
+    if (mouseDown(studio, studioDrag, ...scenePoint(e), bandTime(), pageTime()) === 'busk') leaveStudio(true); // it keeps your beats
   });
   addEventListener('mousemove', (e) => {
     if (screen !== 'studio') return;
@@ -519,12 +575,12 @@ function game(art) {
   }, { passive: false });
 
   // The shop: the arrow keys choose, Enter buys (or plays an instrument you own), Esc or the door
-  // leaves for the park, ready for the next set.
+  // leaves for the map, ready for the next set.
   function leaveShop() {
     shop = null;
-    screen = 'ready';
     canvas.style.cursor = '';
     sound();
+    openMap();
   }
   function shopDo(what) {
     if (what === 'left' || what === 'right') move(shop, what === 'left' ? -1 : 1);
@@ -566,7 +622,7 @@ function game(art) {
 
   document.getElementById('bots').addEventListener('click', () => {
     // On the beat your set played, so the bots and you are compared on the same beat.
-    const r = runSet(seed, randomBot(seed, set.beat), set.beat).coins, l = runSet(seed, lickBot(seed, set.beat), set.beat).coins;
+    const r = runSet(seed, randomBot(seed, set.beat), set.beat, set.place).coins, l = runSet(seed, lickBot(seed, set.beat), set.beat, set.place).coins;
     document.getElementById('bots-result').textContent = `Random bot: ${r}. Lick bot: ${l}. You: ${set.coins}.`;
   });
 
@@ -577,14 +633,19 @@ function game(art) {
       get scene() { return scene; },
       get shop() { return shop; },
       get studio() { return studio; },
+      get atlas() { return atlas; },
+      get place() { return place; },
       beats,
       get loop() { return heardLoop(); },
       audio, input, latency, art, flocks, gear,
     };
   }
 
+  let lastTime = 0; // the page's clock at the last frame, for the map's glide
   const frame = (now) => {
     try {
+      const time = (now - t0) / 1000, dt = Math.max(0, time - lastTime);
+      lastTime = time;
       if (set && screen === 'playing') {
         if (bot) feedBot();
         const target = audio.now() - start;
@@ -628,13 +689,18 @@ function game(art) {
       const played = audio.update((from, to) => (l ? due(l, from, to) : []));
       if (set) for (const n of played) sceneLoopNote(scene, n.pitch, n.at - start);
       latency.reported = audio.reportedLatency();
+      if (screen === 'map') {
+        atlasView.show(atlas, { time, dt, still: reducedMotion.matches });
+        requestAnimationFrame(frame);
+        return;
+      }
       draw({
         screen: screen === 'thanks' || screen === 'over' ? 'playing' : screen,
         set, scene, keys: input.keys, t: set ? set.t : studio ? bandTime() : shop?.loop ? audio.now() - start : 0,
         bars: set ? set.t / (endTime(set) / PARK.bars) : skyBar, studio,
         time: (now - t0) / 1000, still: reducedMotion.matches, flocks, gear, stomp: stomped, shop,
         loop: shop ? shop.loop : set ? loop : null, loopSaid,
-        busking: fixedBeat || owns(gear, 'studio') ? setBeat().name : null,
+        busking: setBeat().name,
         debug: debug ? latency : null,
       });
       out.drawImage(off, 0, 0, canvas.width, canvas.height);
````

- [ ] **Step 4: The README, and what the build settled**

Apply to `README.md`:

````diff
diff --git a/README.md b/README.md
index f67fd2a..9b9a80a 100644
--- a/README.md
+++ b/README.md
@@ -77,23 +77,29 @@ That writes the editable `art/snake-icon.aseprite` and the `snake/icon.png` the
 
 ## Open Case
 
-`open-case/` is a busking game, a work in progress. You improvise on the computer keyboard, laid out like GarageBand's Musical Typing, over the band's beat (a lo-fi loop, unless you've made your own), and passers-by stop, stay and tip according to what you play. Four kinds walk by, joggers, elders, students and commuters, each with their own taste, and six different people of each kind. Repeating yourself bores them, off-key notes on strong beats make them frown, and an earlier idea brought back changed earns a coin. The band gains layers as the crowd grows. The coins you earn are saved, and between sets a music shop sells five pedals, which you stomp on keys 2 to 6 while you play, four more instruments, and a loop pedal: R records 4 bars of your notes that play on under you, up to three layers, and Backspace takes the last one off. The shop also sells the studio, where you make your own beats to busk to the way Figure makes them: pick a rhythm, hold the pad, and it's written into the loop as it goes round. It comes with five ready-made beats (lo-fi, bossa nova, funk, reggae and a slow ballad), keeps six of your own (Save names one), and "Busk to this" picks the beat your sets play and takes you to the park. The design spec is `docs/superpowers/specs/2026-09-28-open-case-design.md`, the shop's is `docs/superpowers/specs/2026-09-28-open-case-shop-design.md`, the loop pedal's is `docs/superpowers/specs/2026-09-29-open-case-loop-pedal-design.md`, the passers-by's is `docs/superpowers/specs/2026-09-29-open-case-passers-by-design.md`, and the studio's is `docs/superpowers/specs/2026-09-30-open-case-studio-design.md`.
+`open-case/` is a busking game, a work in progress. You improvise on the computer keyboard, laid out like GarageBand's Musical Typing, over the band's beat, and passers-by stop, stay and tip according to what you play. Before each set, a map of the city (painted after a friend's atlas) asks where to busk and what to play: the park at sunset, the station at rush hour (commuters come in waves off each train, in a hurry, and tip well) or the night market (slow browsers who stay long, for smaller coins), to one of five ready-made tracks or one of your own. Four kinds walk by, joggers, elders, students and commuters, each with their own taste, and six different people of each kind. Repeating yourself bores them, off-key notes on strong beats make them frown, and an earlier idea brought back changed earns a coin. The band gains layers as the crowd grows. The coins you earn are saved, and between sets a music shop sells five pedals, which you stomp on keys 2 to 6 while you play, four more instruments, and a loop pedal: R records 4 bars of your notes that play on under you, up to three layers, and Backspace takes the last one off. The shop also sells the studio, where you make your own beats to busk to the way Figure makes them: pick a rhythm, hold the pad, and it's written into the loop as it goes round. It comes with five ready-made beats (lo-fi, bossa nova, funk, reggae and a slow ballad), keeps six of your own (Save names one), and "Busk to this" picks the beat your sets play and takes you to the map. The design spec is `docs/superpowers/specs/2026-09-28-open-case-design.md`, the shop's is `docs/superpowers/specs/2026-09-28-open-case-shop-design.md`, the loop pedal's is `docs/superpowers/specs/2026-09-29-open-case-loop-pedal-design.md`, the passers-by's is `docs/superpowers/specs/2026-09-29-open-case-passers-by-design.md`, the studio's is `docs/superpowers/specs/2026-09-30-open-case-studio-design.md`, and the places' and the map's is `docs/superpowers/specs/2026-10-01-open-case-places-design.md`.
 
-- Tests (Node 22, no dependencies): `cd open-case && npm test`. The headline test plays a scripted honest set against a random bot and a lick bot over ten seeds. The art tests check the committed sprite sheet against what the game draws.
+- Tests (Node 22, no dependencies): `cd open-case && npm test`. The headline test plays a scripted honest set against a random bot and a lick bot over ten seeds, and another checks that every place pays an honest set about the same. The art tests check the committed sprite sheet and map against what the game draws.
 - Debug:
   - `?sound` is the sound check: the band with a switch per layer and a choice of the ready-made beats, and every instrument and pedal in the shop to try on the keys, the loop pedal too.
   - `?debug` shows each listener's interest and the last rule they heard, and a corner panel with the audio delay. On the end card it adds Run the bots and the test log.
-  - `?seed=N` fixes the passers-by, and the park's windows, train and birds.
+  - `?seed=N` fixes the passers-by, the station's trains, and the park's windows, train and birds.
   - `?bot=random` or `?bot=lick` plays a whole set by itself.
-  - `?sky=N` shows the park as it is N bars into a set (until a set starts), to check the sunset without playing three minutes.
+  - `?sky=N` shows the place as it is N bars into a set (until a set starts), to check the sunset, the station's clock or the market's lanterns without playing three minutes.
   - `?coins=N` sets your savings to N on that page, to try the shop. Nothing done on it is kept or logged, beats made in the studio included.
-  - `?beat=lofi` (or `bossa`, `funk`, `reggae`, `ballad`) makes every set play that ready-made beat, without the studio.
+  - `?beat=lofi` (or `bossa`, `funk`, `reggae`, `ballad`) makes every set play that ready-made beat.
+  - `?place=park` (or `station`, `market`) makes every set happen there, with no map, and isn't kept.
   - `?studio` counts the studio as yours on that page, and the first key opens it, to try it without buying it. Like `?coins=N`, nothing done on it is kept or logged.
-- Tuning: the rules, the crowd, the tips and the feel are in `open-case/src/tuning.js`, and so are the park's sunset and background timings (`PARK`) and the shop's prices and pedal keys (`SHOP`), the loop pedal's length, layers and allowance for early notes (`LOOP`), and the studio's slots, undo and timing (`STUDIO`). The beats themselves (the five ready-made ones, the keys, the chords and the sounds each part can have) are in `open-case/src/beats.js`, and the studio's rhythms in `rhythms.js`. The sounds (the band, each instrument and each pedal, the loop's level and the safety before the speakers) are in `open-case/src/audio.js`, and a few view timings are in `scene.js` and `render.js`.
-- Art: flat colour, no outlines, no dithering, the look Nathan picked from a reference picture. The game draws from one sprite sheet, `open-case/assets/sprites.png`, with its frame and layout data in `sprites.json`. `art/open-case/sprites.lua` writes both from the shared drawing code: `draw.lua` (the park, you and your things), `figures.lua` (the passers-by, six people of each kind drawn from parts, their reactions, the pigeons and the birds), `gear.lua` (you with each instrument, your pedals and the loop pedal, the amp and the gear strip's icons) and `shop.lua` (the music shop, the studio's groovebox on its counter). `palette.lua` holds every colour, at most 64. The style sample and the tab icon have scripts there too. Rebuild everything from the repo root (it's deterministic: an unchanged script rebuilds its files byte for byte):
+- Tuning: the rules, the crowd, the tips and the feel are in `open-case/src/tuning.js`, and so are each place's crowd (`PLACES`), the park's sunset and background timings (`PARK`), the station's clock and trains (`STATION`), the night market's lanterns (`MARKET`), and the shop's prices and pedal keys (`SHOP`), the loop pedal's length, layers and allowance for early notes (`LOOP`), and the studio's slots, undo and timing (`STUDIO`). The beats themselves (the five ready-made ones, the keys, the chords and the sounds each part can have) are in `open-case/src/beats.js`, and the studio's rhythms in `rhythms.js`. The sounds (the band, each instrument and each pedal, the loop's level and the safety before the speakers) are in `open-case/src/audio.js`, and a few view timings are in `scene.js` and `render.js`.
+- Art: flat colour, no outlines, no dithering, the look Nathan picked from a reference picture. The game draws from one sprite sheet, `open-case/assets/sprites.png`, with its frame and layout data in `sprites.json`. `art/open-case/sprites.lua` writes both from the shared drawing code: `draw.lua` (the park, you and your things), `figures.lua` (the passers-by, six people of each kind drawn from parts, their reactions, the pigeons and the birds), `gear.lua` (you with each instrument, your pedals and the loop pedal, the amp and the gear strip's icons), `shop.lua` (the music shop, the studio's groovebox on its counter), `station.lua` (the station: its hall, the train and the platform) and `market.lua` (the night market: its stalls, lanterns, brick street and cat). `palette.lua` holds every colour, at most 64. The style sample and the tab icon have scripts there too. Rebuild everything from the repo root (it's deterministic: an unchanged script rebuilds its files byte for byte):
 
   ```sh
   for s in sprites icon style-sample; do /Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/$s.lua; done
   ```
 
   The style sample writes `art/open-case/preview-style.png` and `preview-oldman.gif`. `lineup.lua` writes `art/open-case/preview-lineup.png`, every passer-by standing and walking, to check the people by eye. Previews aren't committed.
+- The map: painted, not flat, after Nathan's reference, a friend's atlas of lush pixel worlds. The land is 960x540, shown at twice its size, with the places, the city and the bridges drawn on it as pictures at twice its detail. `art/open-case/map/land.py` paints the land and `places.py` draws the pictures and writes `map.json` (where each goes); both share `layout.py`, the lie of the land. They need Python 3 with Pillow, are deterministic, and write `open-case/assets/map/` (under 500 KB). Rebuild from the repo root:
+
+  ```sh
+  python3 art/open-case/map/land.py && python3 art/open-case/map/places.py
+  ```
````

Apply to `docs/superpowers/specs/2026-10-01-open-case-places-design.md`:

````diff
diff --git a/docs/superpowers/specs/2026-10-01-open-case-places-design.md b/docs/superpowers/specs/2026-10-01-open-case-places-design.md
index a7f0838..041d6cd 100644
--- a/docs/superpowers/specs/2026-10-01-open-case-places-design.md
+++ b/docs/superpowers/specs/2026-10-01-open-case-places-design.md
@@ -1,7 +1,7 @@
 # Open Case: places to busk (design spec)
 
 **Date:** 2026-10-01
-**Status:** Nathan agreed the design in chat and on a mockup page (claude.ai/artifact/9pVRougZNC138ZQ9yVUJEx), the map after several rounds ("yeah that looks much better, the only think i would change is make the station a little smaller"). Awaiting his review of this spec.
+**Status:** Nathan agreed the design in chat and on a mockup page (claude.ai/artifact/9pVRougZNC138ZQ9yVUJEx), the map after several rounds ("yeah that looks much better, the only think i would change is make the station a little smaller"), then asked for the plan ("go ahead and write the plan and then pause"). Built from `docs/superpowers/plans/2026-10-01-open-case-places.md`.
 
 It started with Nathan: "can we now add some new places to busk?" Every set so far is in the park at sunset. Now there are three places, each with its own scene and its own crowd. You choose the place and the track on a map of the city before each set.
 
@@ -235,6 +235,21 @@ Nathan opens the game, sees the city, picks the station and a track, and busks t
 - **Over the map:** the clock chip, the title icon and the line above the title were removed.
 - **The scenes:** the station's platform became pale stone and the market's street warm brick. The market's cat became black and white so it shows on the brick.
 
+## What the build settled
+
+- **The station's trains** come every 32–38 s, with someone every 16–22 s between them (the table started at 28–34 and 14–20). With those, over seeds 1–10 the honest set earns 629 in the park, 722 at the station and 674 at the market; random playing earns 5, 11 and 7; the lick bot nothing anywhere.
+- **The trains come from the crowd:** the crowd works out each set's train timetable from its own stream, and the scene reads it, so a train always stands with its doors open as its passengers step off.
+- **On the map:**
+  - left and right go round, from the market back to the park;
+  - Space works as Enter;
+  - the track you're on plays every part of it, softly (`audio.previewBand`), not just the chords as in the shop;
+  - the tempo and key are in Silkscreen capitals, since Pixelify's small "C" reads as a 0, and its "fi" ligature is turned off ("Lo-fi" read "Lo-A");
+  - the minimap says "the city" and which place of the three you're on.
+- **`?place=`** skips the map: every set on that page is at that place.
+- **Dark backings:** besides the bottom line's words and the gear strip (leaving the pigeons and the cat beside them clear), the waiting prompt has one too, so it reads over the station's lamps and the market's lanterns.
+- **The shop** says "back to the map" on its sign and card, since that's where Esc and the door now go.
+- **The art:** six colours join the palette for the station's stone and the market's brick, 55 in all, and the sheet has 583 frames (under 100 KB). The map's files come to 445 KB, its land alone 313 KB.
+
 ## Not in this change
 
 - More places. The lighthouse, the marina and the village are scenery for now.
````

- [ ] **Step 5: Run the tests, and check it in Chrome**

Run: `cd open-case && npm test`
Expected: PASS, 390 tests.

Serve the repo root (`python3 -m http.server 8765 --bind 127.0.0.1`) and open `http://127.0.0.1:8765/open-case/?seed=3` in a fresh profile, at about 1280x720. Then check:
- **The map:**
  - A key on the title card opens the map: the park chosen, its label gold and the pin over it, "Lo-fi" on the chip (not "Lo-A"), the minimap at the bottom left.
  - Right glides to the station.
  - Enter opens "What track?", with "80 BPM · C MAJOR" in Silkscreen.
  - Down chooses the bossa nova, and it plays softly.
  - Enter goes to the station: the map hides, and "busking to Bossa nova" sits on its backing.
- **A set at the station:** play a note. About 6–10 s in, a train pulls in and stands with its doors open, and its passengers come along the platform. The clock reads 5:30, and the bar counter shows "bar n/100".
- **Back to the map:**
  - `document.getElementById('again').click()` opens the map on the station, with the panel shut.
  - Reload: the map opens on the station with the bossa nova chosen.
- **The market:** choose it and go. The lanterns are dark, the cat sleeps by the case, and both the prompt and the bottom line are readable.
- **The studio:** with `?studio`, the first key opens the studio. Open its list (`__openCase.studio.list = true`) and click Busk to this: the map opens saying "enter to busk here", and Enter goes straight to the place.
- **Other pages:** `?place=market` goes straight from the title card to the market. With reduced motion turned on, the map holds still.
- No console errors throughout.

(Nathan judges the look of the map and the places, and the balance, by playing.)

- [ ] **Step 6: Commit**

```bash
git add open-case/src/main.js open-case/src/render.js open-case/src/log.js open-case/test/render.test.js open-case/test/log.test.js README.md docs/superpowers/specs/2026-10-01-open-case-places-design.md
git commit -m "Open Case: the game opens on the map: where to busk and what track to play, remembered, and every way back between sets leads there

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```
