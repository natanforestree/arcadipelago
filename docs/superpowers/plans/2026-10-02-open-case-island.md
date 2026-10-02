# Open Case: One Tree Island Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The little island with one pine in the map's lake becomes a fourth place to busk, at sunrise. Animals come to listen instead of people and nobody pays. Now and then an animal that liked your playing leaves a keepsake in your case. Your keepsakes go on a shelf in your room at home (Home now opens the room, and its desk opens the studio), and up to three ride in your case's lid wherever you busk.

**Architecture:**
- **The animals are people by another name.** `animals.js` gives each of the eleven animals one of the four kinds of town listener. The crowd (`crowd.js`) deals an arriving kind one of its animals the way it deals a person a look, from the looks' own stream, so every draw at the other places is unchanged. The island's land runs right across the screen: the land animals walk along it as people walk the park's path, the swimmers cross the lake behind it, and the birds fly over, each along its own line. They settle on the island's eleven spots by sort (`tuning.js` `ISLAND`), and their tips count as fondness, not coins (`PLACES.island.coins: false`).
- **Keepsakes are rules and storage, pure.** `keepsakes.js` holds the 22 keepsakes, the end-of-set rule (`keepsakeFor`: the first always comes, then a chance that rises with fondness, from the fan that stayed longest), the storage under `open-case-keepsakes`, and the case's rules (three at most; the first goes in by itself). `set.js` asks for the keepsake at the set's end and reports it as an event.
- **The sunrise is pure scene data** (`scene.js`: the sky's stages horizon first, the sun's rise, the mist, the fish, the keepsake's drop). Its art is in the sprite sheet: `island.lua`, `animals.lua`, `keepsakes.lua` and `room.lua`. `render.js` draws the island, the animals and the room.
- **Your room is a screen like the shop:** `room.js` is pure (the pointer, the keys, the clicks, the card), and `render.js` draws it. `main.js` adds the `room` screen and wires the rest: Home, the studio's way back, the birds, saving keepsakes, the end card and `?keepsakes=`.
- **The map** gets the island as a stop after the night market: a picture of it, its pine drawn again and a rowboat, from `places.py`.

**Tech Stack:**
- Plain ES modules, Canvas 2D and Web Audio, with Node 22 `node --test` and no dependencies.
- Aseprite 1.3 in batch mode (Lua) for the sprite sheet.
- Python 3 with Pillow for the map's art.

**Spec:** `docs/superpowers/specs/2026-10-02-open-case-island-design.md`.
- Nathan agreed the design in chat, one part at a time, and approved the written spec ("go ahead and continue").
- Seeing the prototype's screenshots, he asked for two changes, which the spec now has (`92e0550`) and this plan builds:
  - the land runs off the screen, so the animals don't all cross from the water ("can you make the land extend to outside of the frame, right now the animals cross from the water and its a bit weird");
  - the room's window shows the woods behind the house, as the map has them ("where the house is there are trees and no water.. so it should show trees").
- It builds on the places' spec (`2026-10-01-open-case-places-design.md`), the studio's (`2026-09-30-open-case-studio-design.md`), the passers-by's (`2026-09-29-open-case-passers-by-design.md`), the art's (`2026-09-28-open-case-art-design.md`) and the game's (`2026-09-28-open-case-design.md`).
- Task 9 adds the spec's "What the build settled" section.

**Prototyped:** everything below was built and run before this plan was written, in a scratch copy of the repo, one commit per task.
- **Tests:** each task's end state passes the whole suite: 438 tests before, then 449, 465, 469, 473, 477, 485, 495, 496 and 497 after the tasks.
- **The art:** the sprite sheet (801 frames, 61 colours) and the map's art rebuild byte for byte.
- **Checked by eye in Chrome:**
  - the map's new stop, its label and line;
  - a set on the island from before dawn to morning: all eleven animals on their spots, the land animals walking and hopping along the island, the swimmers out on the lake behind it, reactions over their heads, and "fondness" in `?debug`'s panel;
  - a random bot's whole set on the island: its first keepsake (a crunchy leaf from the hedgehog) dropping into the case with a sparkle, then the end card ("The hedgehog left you a crunchy leaf.", "0 animals stopped to listen on One Tree Island.", "No animal stayed this time."), and the bot's keepsake never joining the shelf;
  - a whole set of your own there: "The frog left you a water lily.", the lily kept, in your case by itself and in the log, and the birds stopping at the shop's door and singing again outside it;
  - your room with `?keepsakes=7`: the woods through its window, the shelf, the count, the gold marks, a fourth refused with its message, a keepsake taken out;
  - the desk opening the studio with "room" on its corner key, Esc back to the room, Esc again to the map;
  - Enter on the music shop no longer buying the first pedal (see Review Focus).

The code in each task is that prototype's code, so transcribe it exactly.

## How to put the code in

- **A new file** is shown whole, under "Create `path`". Write it exactly as shown.
- **A changed file** is shown as a patch (a `diff` block) against the previous task's end state. Write the block to a file exactly as it is, then run `git apply --verbose <that file>` from the repo root.
- **Extract long blocks with a small script** rather than retyping them (python3 or awk, copying the lines between the fences verbatim). The code blocks here are fenced with four backticks.
- If a patch doesn't apply, stop and report it; don't hand-edit around it.
- **Images and generated data** (`sprites.png`, `sprites.json`, the map's pictures and `map.json`) are never in the plan: a step runs the script that writes them.

## Global Constraints

- **Commits:**
  - Every message starts `Open Case: ` and ends with a blank line and then `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`, exactly that line, whatever model you are.
  - Stage only the files your task names (`git add <paths>`), never `git add -A` or `git add .`.
  - Don't push.
- **No new dependencies for the game:** plain ES modules, Node 22's `node --test`. Run the tests with `cd open-case && npm test`.
- **The sprite sheet:**
  - Aseprite runs from the repo root: `/Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/sprites.lua`. It's deterministic, so a second run leaves `git status` unchanged.
  - The sheet stays in the flat style (every area one solid colour from `art/open-case/palette.lua`, no outlines, no dithering), within **64 colours** and **under 400 KB**.
- **The map's scripts:**
  - They run from the repo root with Python 3 and Pillow (`python3 -c "import PIL"` must work): `python3 art/open-case/map/land.py && python3 art/open-case/map/places.py`.
  - They're deterministic, write only `open-case/assets/map/`, write no `__pycache__`, and `land.py` takes about 40 seconds.
  - The map stays **under 500 KB**.
- **Today's places play as they do now:** at the park, the station and the night market, every set, bot score and existing test comes out exactly as before. The animals take their looks from the looks' own stream, and the keepsake's roll from a stream of its own (the set's seed mixed with a constant).
- **Nobody pays on the island:** its tips count as fondness, nothing lands in the case, and nothing goes to your savings.
- **The odds,** over seeds 1 to 200 with one keepsake found:
  - the honest set (`goodSet`) is left a keepsake in 20% to 30% of sets;
  - the random bot in under 5%;
  - the lick bot in about none.
- **Keepsakes are kept** under `open-case-keepsakes` as `{ found, inCase }`:
  - unreadable or unknown values are ignored;
  - the pages that keep nothing (`?coins=`, `?studio`, `?keepsakes=`) never save one, and a bot's set never adds one.
- **Words, exactly:**
  - the place: "One Tree Island", "on One Tree Island", "Just you and the animals · no coins";
  - Home's line: "your studio · your keepsakes";
  - the case's refusal: "your case holds three, take one off first".
- **Style:** plain words in comments and messages, in the style of the surrounding code; comment lines wrap at about 100 characters.

## Review Focus

These are the cases most likely to go wrong that the spec implies but no Node test can reach, since `main.js` has no Node tests. Each is pinned by a check in the task named.
- **A key that leaves the map acting again on the screen it opens.** The Enter that chose the music shop also bought the first pedal there, if you had 40 coins: a live bug today. The Enter that chooses Home would put your first keepsake in or take it out of your case. Each key that leaves the map should be the map's alone. (Task 9: `e.stopImmediatePropagation()` in the map's and the room's keys, and Chrome check 2, Enter on the music shop and on Home.)
- **Leaving an island set for the shop or the studio from the end card.** The birds should stop at the door, and sing again in your room and on the map. (Task 9: `audio.birds(false)` in `openShop` and `openStudio`, and Chrome check 6's birds.)
- **A bot's set, or a page that keeps nothing, finding a keepsake.** It shows dropping in and on the end card, but a bot's never joins your shelf, and none is ever saved. (Task 9: Chrome check 5, a bot's whole set on the island.)
- **Stored keepsakes from a bad or old save:** unknown ids, the same one twice, four in the case, or one in the case that isn't found. They're dropped, never a crash. (Task 2: "anything unreadable, unknown, twice over or not found is left out of what was kept, and the case holds three".)
- **A set where no animal settled, or with all 22 found.** The first keepsake comes from whoever came by first, a later set leaves nothing, and the end card leaves the keepsake line out and says "No animal stayed this time." (Task 2: "your first set on the island always leaves...", "never one you have, and nothing once you have all 22". Task 9: Chrome check 5's end card.)

## Settled in the prototype

The spec left these open, or the prototype changed them. Task 9 records them in the spec's "What the build settled".
- **Where the animals cross and settle (`ISLAND`):**
  - **Lines:** the land animals walk along the island at y 146, where people walk the park's path; the swimmers cross the lake at y 124, behind the reeds, the rock and the rowboat on the shore; and the birds fly high up, at y 40.
  - **The eleven spots:**
    - the pine: (122, 93), (190, 77), (138, 61);
    - the grass round you: (70, 158), (96, 165), (196, 165), (228, 158);
    - the shallows: (52, 134), (214, 134);
    - the rock: (290, 133);
    - the lily pad: (22, 136).
  - **Which spot:** the turtle takes the rock, else the nearest shallows; the frog takes only the lily pad.
- **The squirrel** hops along the land like the others, then up to its branch in the pine.
- **The numbers:**
  - `PLACES.island` brings one animal every 10 to 16 s, at most 6 on screen, with the park's pace, patience, stays and tips.
  - Over seeds 1 to 200, the honest set wins 17 to 80 fondness.
  - `KEEPSAKE` is `{ full: 30, most: 0.22, caseHolds: 3 }`. With one keepsake found, the honest set is left one in 26% of sets, a set in key that never brings an idea back in 5%, and the random and lick bots in none.
- **The sunrise:**
  - **The sky** keeps the evening's timing reversed (`skyStages(bar).reverse()`), so the horizon lightens first. Its five stages are the dusk's colours, then three new morning blues.
  - **The far shore and the lake** follow the horizon's band.
  - **The sun** rises 44 pixels from bar 4 to bar 50, and glints on the water below it once it's 12 pixels up.
  - **The mist** is four streaks, and one lifts every 10 bars, the nearest first, so it's gone at bar 40.
  - **The fish** jumps for 0.8 s from (262, 124), then splashes for 0.5 s.
- **The keepsake's drop:**
  - It falls from 70 pixels above the case for 0.8 s, lands where the coins do with a coin's clink, and twinkles until the end card.
  - **The case's lid** holds 5 × 5 versions at (157, 154), (163, 154) and (169, 154).
- **Your room:**
  - **The look:** a teal wall, a window onto the woods behind the house, the shelf with 11 columns by 2 rows of 14-pixel cubbies, and a desk with the groovebox, a mug and a lamp. A rug and a plant fill the rest.
  - **The card** runs along the bottom, as in the shop.
  - **Marks:** a gold 2 × 2 mark on a cubby whose keepsake is in your case. The pointer is a gold frame, or an arrow over the groovebox for the desk.
  - **The arrow keys:** right from the end of a row goes to the desk.
- **The end card on the island:**
  - **The place:** "N animals stopped to listen on One Tree Island." carries the place.
  - **Nobody stayed:** "No animal stayed this time."
  - **?debug's Run the bots** compares fondness.
- **The birds** sing from the island's waiting screen to its end card, and in your room; they're quiet in the shop and the studio.
- **The studio** takes `{ back }`, so its corner key reads "room" when you came from the desk; Esc and that key go back there, and Busk to this goes to the map.
- **The art:**
  - **Colours:** six join the palette (`morning`, `lake`, `mist`), making 61.
  - **The sheet** has 801 frames (about 160 KB with its data).
  - **The map** redraws the island and its pine at twice the land's detail with the rowboat. It comes to 448 KB. `land.png` changes a little under it, where the island's clearing is tinted, which the picture covers.

## File map

| File | What it does |
|---|---|
| `open-case/src/animals.js` (new) | The eleven animals: each one's kind, how it crosses, its sorts of spot, its name; what each kind likes |
| `open-case/src/keepsakes.js` (new) | The 22 keepsakes, the end-of-set rule, storage, and the case's rules |
| `open-case/src/room.js` (new) | Your room: the pointer, its keys and clicks, the card |
| `open-case/src/tuning.js` (edit) | `PLACES.island`, `ISLAND` (lines, spots, the sunrise), `KEEPSAKE` |
| `open-case/src/crowd.js`, `set.js` (edit) | Animals in the crowd, fondness for coins, the fans, the keepsake at the end |
| `open-case/src/scene.js` (edit) | The sunrise, the fish, the keepsake's drop |
| `art/open-case/island.lua`, `animals.lua`, `keepsakes.lua`, `room.lua` (new), `palette.lua`, `sprites.lua`, `draw.lua` (edit) | Their art in the sheet, and its layout data |
| `open-case/src/render.js` (edit) | Draws the island, the animals, the keepsakes in your case's lid and dropping in, and your room |
| `open-case/src/studio.js`, `studioview.js` (edit) | The studio's way back, and its corner key's word |
| `open-case/src/places.js`, `atlas.js` (edit), `art/open-case/map/layout.py`, `places.py` (edit) | The island on the map |
| `open-case/src/main.js`, `log.js` (edit) | The room screen, the birds, saving keepsakes, the end card, `?keepsakes=`; the log notes the keepsake |
| `open-case/test/*` | The tests for each of the above |
| `README.md`, the island spec | Say what's built |

---

### Task 1: Animals listen on the island in place of people

**Files:**
- Create: `open-case/src/animals.js`, `open-case/test/animals.test.js`
- Modify: `open-case/src/tuning.js`, `open-case/src/crowd.js`, `open-case/src/set.js`
- Test: `open-case/test/crowd.test.js`, `open-case/test/set.test.js`, `open-case/test/bots.test.js`

**Interfaces:**
- Consumes: `crowd.js`'s `KINDS`, `dealLook`, `stoodAt` (`test/helpers.js`), `PLACES` (as today).
- Produces:
  - `animals.js`:
    - `ANIMALS` (`{ id: { kind, cross: 'land' | 'water' | 'sky', spots: [sorts, first preferred], name: 'the fox', plural? } }`);
    - `ANIMAL_IDS` (bunny, ducks, squirrel, heron, turtle, deer, fox, frog, hedgehog, crow, owl);
    - `ANIMALS_OF` (`{ kind: [ids] }`), `LIKES` (`{ kind: words }`), `animalName(id)` (`'The fox'`).
  - `tuning.js`:
    - `PLACES.island`, with `coins: false` and `animals: true`;
    - `ISLAND.lanes` (`{ land: 146, water: 124, sky: 40 }`) and `ISLAND.spots` (`[[x, y, sort], ...]`, eleven of them).
  - `crowd.js`:
    - on the island, each person also has `animal` and `lane`;
    - `crowd.first` (`{ kind, look }`), `spotsOf(c)`;
    - tips where `coins: false` are `{ type: 'fond', person, fondness, why }`.
  - `set.js`: `set.fondness`, `set.fans` (`[{ animal, stayed }]`), and `summary(set)` gains `fondness`.

- [ ] **Step 1: Write the failing tests**

Create `open-case/test/animals.test.js`:

````js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ANIMALS, ANIMAL_IDS, ANIMALS_OF, LIKES, animalName } from '../src/animals.js';
import { KINDS } from '../src/crowd.js';
import { ISLAND } from '../src/tuning.js';

test("eleven animals, each standing for one kind of town listener, listed in its kind's order", () => {
  assert.deepEqual(ANIMAL_IDS, ['bunny', 'ducks', 'squirrel', 'heron', 'turtle', 'deer', 'fox', 'frog', 'hedgehog', 'crow', 'owl']);
  assert.deepEqual(Object.keys(ANIMALS_OF), KINDS);
  assert.deepEqual(Object.values(ANIMALS_OF).flat(), ANIMAL_IDS, "every animal once, in the list's order");
  for (const [kind, ids] of Object.entries(ANIMALS_OF)) for (const id of ids) assert.equal(ANIMALS[id].kind, kind, id);
  for (const kind of KINDS) assert.ok(LIKES[kind], kind);
});

test('each animal crosses in its own way and settles on spots of its own sort, which the island has', () => {
  const sorts = new Set(ISLAND.spots.map(([, , s]) => s));
  for (const id of ANIMAL_IDS) {
    const a = ANIMALS[id];
    assert.ok(['land', 'water', 'sky'].includes(a.cross), id);
    assert.ok(Number.isFinite(ISLAND.lanes[a.cross]), id);
    assert.ok(a.spots.length >= 1 && a.spots.every((s) => sorts.has(s)), id);
    assert.match(a.name, /^the /);
  }
  assert.equal(ANIMALS.turtle.spots[0], 'rock', 'the turtle takes the rock first');
  assert.equal(animalName('heron'), 'The heron');
  assert.equal(animalName('ducks'), 'The ducks');
});

test('the island has eleven spots: three in the pine, four on the grass, two in the shallows, the rock and the lily pad', () => {
  const count = (sort) => ISLAND.spots.filter(([, , s]) => s === sort).length;
  assert.equal(ISLAND.spots.length, 11);
  assert.deepEqual(['pine', 'grass', 'shallows', 'rock', 'lily'].map(count), [3, 4, 2, 1, 1]);
  const landAnimals = Object.values(ANIMALS).filter((a) => a.spots[0] === 'grass').length;
  assert.equal(count('grass'), landAnimals, 'room on the grass for every animal that settles there');
  for (const [x, y] of ISLAND.spots) assert.ok(x > 0 && x < 320 && y > 0 && y < 180, `${x}, ${y}`);
});
````

Apply to `open-case/test/crowd.test.js`:

````diff
diff --git a/open-case/test/crowd.test.js b/open-case/test/crowd.test.js
index ed09a7e..5bf2f71 100644
--- a/open-case/test/crowd.test.js
+++ b/open-case/test/crowd.test.js
@@ -1,7 +1,8 @@
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
 import { createCrowd, hear, crowdSize, endTips, dealLook, personName, KINDS, LOOKS } from '../src/crowd.js';
-import { CROWD, INTEREST, TIPS, DT, PLACES } from '../src/tuning.js';
+import { CROWD, INTEREST, TIPS, DT, PLACES, ISLAND } from '../src/tuning.js';
+import { ANIMALS, ANIMALS_OF } from '../src/animals.js';
 import { runCrowd, stoodAt } from './helpers.js';
 import { createSet, stepSet, playNote, releaseNote, momentsOf } from '../src/set.js';
 import { goodSet } from '../src/bots.js';
@@ -373,3 +374,113 @@ test('over a whole good set at the station, everyone on screen always has a whol
     }
   }
 });
+
+// An animal settled on the island's spot `spot`, for tests that need one without hooking it.
+function settled(c, animal, spot, over = {}) {
+  const { kind, cross } = ANIMALS[animal], [x, y] = ISLAND.spots[spot];
+  return stoodAt(c, kind, 0, { look: ANIMALS_OF[kind].indexOf(animal), animal, lane: ISLAND.lanes[cross], x, y, spot, ...over });
+}
+
+test("the island's animals come as the park's people do, the same kinds from the same side for as long, only further apart", () => {
+  for (const seed of [1, 2, 7]) {
+    const park = arrivals(seed, 300), island = arrivals(seed, 600, undefined, 'island');
+    const same = (list) => list.slice(0, 20).map((p) => [p.kind, p.dir, p.budget]);
+    assert.deepEqual(same(island), same(park), `seed ${seed}`);
+    for (let i = 1; i < 20; i++) {
+      const gap = island[i].at - island[i - 1].at;
+      assert.ok(gap >= 10 - DT && gap <= 16 + DT, `gap ${gap}`);
+    }
+  }
+});
+
+test("on the island every arrival is one of its kind's animals, crossing along its own line, and leaving along it too", () => {
+  const seen = new Set();
+  for (const seed of [1, 2, 3]) {
+    const c = createCrowd(seed, 'island');
+    runCrowd(c, 0, 400, () => {
+      for (const p of c.people) {
+        assert.equal(p.animal, ANIMALS_OF[p.kind][p.look], `a ${p.kind} with look ${p.look}`);
+        assert.equal(p.lane, ISLAND.lanes[ANIMALS[p.animal].cross], p.animal);
+        if (p.state === 'passing') assert.equal(p.y, p.lane, p.animal);
+        if (p.listening) p.interest = 1; // everyone who hears you settles, then leaves when their time is up
+        seen.add(p.animal);
+      }
+    });
+    assert.equal(c.first.kind, arrivals(seed, 3, undefined, 'island')[0].kind, 'the first that came by');
+  }
+  assert.equal(seen.size, 11, 'every animal comes by');
+  const c = createCrowd(1, 'island'), crow = settled(c, 'crow', 2, { budget: 1 });
+  runCrowd(c, 0, 3);
+  assert.equal(crow.state, 'leaving');
+  assert.equal(crow.y, ISLAND.lanes.sky, 'a crow leaving flies off at its own height');
+});
+
+test('a second of one animal comes only while every animal of its kind is on screen', () => {
+  let twice = 0;
+  for (const seed of [1, 2, 3, 4, 5, 6]) {
+    const c = createCrowd(seed, 'island');
+    let before = [];
+    runCrowd(c, 0, 600, () => {
+      for (const p of c.people) if (p.listening) p.interest = 1;
+      const p = c.people.at(-1);
+      if (p && !before.includes(p)) {
+        const others = before.filter((o) => o.kind === p.kind).map((o) => o.animal);
+        if (others.includes(p.animal)) {
+          twice++;
+          assert.equal(new Set(others).size, ANIMALS_OF[p.kind].length, `seed ${seed}: a second ${p.animal} with ${others} on screen`);
+        }
+      }
+      before = [...c.people];
+    });
+  }
+  assert.ok(twice > 0, 'it happens');
+});
+
+test('each animal settles only on a spot of its own sort, never two on one, and the turtle takes the rock while it can', () => {
+  for (const seed of [1, 2, 3, 4]) {
+    const c = createCrowd(seed, 'island');
+    runCrowd(c, 0, 600, () => {
+      for (const p of c.people) if (p.listening) p.interest = 1;
+      const settledOn = c.people.filter((p) => p.state === 'joining' || p.state === 'stopped');
+      for (const p of settledOn) assert.ok(ANIMALS[p.animal].spots.includes(ISLAND.spots[p.spot][2]), `${p.animal} on ${ISLAND.spots[p.spot]}`);
+      assert.equal(new Set(settledOn.map((p) => p.spot)).size, settledOn.length, 'one to a spot');
+    });
+  }
+  // A turtle hooked with the rock taken goes to the nearest free spot in the shallows.
+  const c = createCrowd(1, 'island');
+  c.nextArrival = Infinity;
+  settled(c, 'turtle', 9);
+  const turtle = settled(c, 'turtle', 0, { state: 'passing', listening: true, spot: -1, x: 200, y: ISLAND.lanes.water, interest: 0.6 });
+  runCrowd(c, 0, DT);
+  assert.equal(turtle.state, 'joining');
+  assert.deepEqual(ISLAND.spots[turtle.spot], [214, 134, 'shallows']);
+});
+
+test('an animal hooked with no free spot of its sort passes by, as a person does when the arc is full', () => {
+  const c = createCrowd(1, 'island');
+  c.nextArrival = Infinity;
+  settled(c, 'fox', 3);
+  settled(c, 'hedgehog', 4);
+  settled(c, 'deer', 5);
+  settled(c, 'fox', 6);
+  const bunny = settled(c, 'bunny', 0, { state: 'passing', listening: true, spot: -1, x: 120, y: ISLAND.lanes.land, interest: 0.6, dir: 1 });
+  runCrowd(c, 0, 1);
+  assert.equal(bunny.state, 'passing');
+  assert.ok(bunny.x > 120, 'it hops on by');
+  const frog = settled(c, 'frog', 0, { state: 'passing', listening: true, spot: -1, x: 120, y: ISLAND.lanes.water, interest: 0.6 });
+  runCrowd(c, 1, DT);
+  assert.equal(frog.state, 'joining', 'the lily pad is free');
+});
+
+test('nobody pays on the island: a callback, a happy goodbye and the end of a set give fondness, not coins', () => {
+  const c = createCrowd(1, 'island');
+  settled(c, 'heron', 7, { budget: 5, interest: 0.9 });
+  settled(c, 'fox', 3);
+  hear(c, { rule: 'callback' }, 1);
+  runCrowd(c, 1, 5.1);
+  endTips(c);
+  assert.deepEqual(c.out.filter((e) => e.type !== 'left').map((e) => [e.type, e.person.animal, e.fondness, e.why]), [
+    ['fond', 'heron', TIPS.callback, 'callback'], ['fond', 'fox', TIPS.callback, 'callback'],
+    ['fond', 'heron', TIPS.happyElder, 'happy'], ['fond', 'fox', TIPS.end, 'end'],
+  ]);
+});
````

Apply to `open-case/test/set.test.js`:

````diff
diff --git a/open-case/test/set.test.js b/open-case/test/set.test.js
index 2a13425..8d5a9b7 100644
--- a/open-case/test/set.test.js
+++ b/open-case/test/set.test.js
@@ -2,8 +2,8 @@ import { test } from 'node:test';
 import assert from 'node:assert/strict';
 import { readFileSync } from 'node:fs';
 import { createSet, stepSet, playNote, momentsOf, endTime } from '../src/set.js';
-import { LOFI_CLOCK, readyBeat } from '../src/beats.js';
-import { DT } from '../src/tuning.js';
+import { LOFI, LOFI_CLOCK, readyBeat } from '../src/beats.js';
+import { DT, TIPS } from '../src/tuning.js';
 import { stoodAt } from './helpers.js';
 const { bar: BAR } = LOFI_CLOCK;
 
@@ -107,3 +107,18 @@ test("a set's ears count its beat's bars", () => {
   assert.equal(set.listen.bar, 2);
   assert.equal(set.listen.notes[0].s, 0);
 });
+
+test('on the island every tip is fondness, never coins, and the fans are the animals that left happy or stayed to the end', () => {
+  const set = createSet(1, LOFI, 'island');
+  stoodAt(set.crowd, 'elder', 0, { animal: 'heron', budget: 5, interest: 0.9 });
+  stoodAt(set.crowd, 'commuter', 1, { animal: 'crow', budget: 5, interest: 0.3 });
+  const early = runTo(set, endTime(set) - 20);
+  stoodAt(set.crowd, 'student', 2, { animal: 'fox' });
+  const events = [...early, ...runTo(set, endTime(set) + BAR + 2)];
+  assert.equal(set.coins, 0);
+  assert.ok(!events.some((e) => e.type === 'coin'));
+  assert.deepEqual(events.filter((e) => e.type === 'fond').map((e) => [e.person.animal, e.fondness, e.why]), [['heron', TIPS.happyElder, 'happy'], ['fox', TIPS.end, 'end']]);
+  assert.equal(set.fondness, TIPS.happyElder + TIPS.end);
+  assert.deepEqual(set.fans.map((f) => f.animal), ['heron', 'fox'], 'not the crow, who left bored');
+  assert.ok(Math.abs(set.fans[0].stayed - 5) < 0.05 && Math.abs(set.fans[1].stayed - 20) < 0.05);
+});
````

Apply to `open-case/test/bots.test.js`:

````diff
diff --git a/open-case/test/bots.test.js b/open-case/test/bots.test.js
index f5d9247..9995c43 100644
--- a/open-case/test/bots.test.js
+++ b/open-case/test/bots.test.js
@@ -127,3 +127,13 @@ test('every place pays an honest set about what the park does, within a fifth, a
     assert.ok(sum(good) >= 10 * lick, `${place}: honest ${sum(good)}, lick bot ${lick}`);
   }
 });
+
+test('on One Tree Island nobody pays: an honest set wins the animals over, and random notes or a lick hardly any', () => {
+  const at = (bot) => SEEDS.map((seed) => runSet(seed, bot(seed), LOFI, 'island'));
+  const good = at(goodSet), random = at(randomBot), lick = at(lickBot);
+  for (const set of [...good, ...random, ...lick]) assert.equal(set.coins, 0);
+  const fondness = (sets) => sets.map((set) => set.fondness);
+  assert.ok(fondness(good).every((f) => f >= 1), `honest set: ${fondness(good)}`);
+  assert.ok(sum(fondness(good)) >= 10 * sum(fondness(random)), `honest ${fondness(good)}, random bot ${fondness(random)}`);
+  assert.equal(sum(fondness(lick)), 0);
+});
````

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL. Four fail:
- `test/animals.test.js` and `test/crowd.test.js` can't load: `Cannot find module '…/open-case/src/animals.js'`;
- the new set and bot tests fail, as there's no island to play at yet (`PLACES.island` is undefined).

The other 412 tests pass.

- [ ] **Step 3: The animals, and the crowd at the island**

Create `open-case/src/animals.js`:

````js
// The animals that come to listen on One Tree Island, in place of people. Each stands for one kind of
// town listener (crowd.js KINDS), likes what that kind likes and has its numbers; the crowd deals an
// arriving kind one of its animals as it deals a person a look. Each crosses the screen in its own way
// and settles, once it's hooked, on a free spot of its own sort (tuning.js ISLAND.spots). Their order
// here is the keepsakes' and the shelf's (keepsakes.js).
//   kind    the town listener it stands for
//   cross   how it comes by: 'land' (it walks or hops along the island), 'water' (it swims or wades
//           out on the lake) or 'sky' (it flies), each along its own line (tuning.js ISLAND.lanes)
//   spots   the sorts of spot it settles on: the first sort with a free spot is the one it takes
//   name    what the end card and the shelf call it; plural for the ducks ("the ducks like")
export const ANIMALS = {
  bunny: { kind: 'jogger', cross: 'land', spots: ['grass'], name: 'the bunny' },
  ducks: { kind: 'jogger', cross: 'water', spots: ['shallows'], name: 'the ducks', plural: true },
  squirrel: { kind: 'jogger', cross: 'land', spots: ['pine'], name: 'the squirrel' },
  heron: { kind: 'elder', cross: 'water', spots: ['shallows'], name: 'the heron' },
  turtle: { kind: 'elder', cross: 'water', spots: ['rock', 'shallows'], name: 'the turtle' },
  deer: { kind: 'elder', cross: 'land', spots: ['grass'], name: 'the deer' },
  fox: { kind: 'student', cross: 'land', spots: ['grass'], name: 'the fox' },
  frog: { kind: 'student', cross: 'water', spots: ['lily'], name: 'the frog' },
  hedgehog: { kind: 'student', cross: 'land', spots: ['grass'], name: 'the hedgehog' },
  crow: { kind: 'commuter', cross: 'sky', spots: ['pine'], name: 'the crow' },
  owl: { kind: 'commuter', cross: 'sky', spots: ['pine'], name: 'the owl' },
};
export const ANIMAL_IDS = Object.keys(ANIMALS);

// Each kind's animals, in the order above: an animal's look (crowd.js) is its place in its kind's list.
export const ANIMALS_OF = {
  jogger: ['bunny', 'ducks', 'squirrel'],
  elder: ['heron', 'turtle', 'deer'],
  student: ['fox', 'frog', 'hedgehog'],
  commuter: ['crow', 'owl'],
};

// What each kind likes, in the shelf's words.
export const LIKES = { jogger: 'busy playing', elder: 'space and long notes', student: 'the groove', commuter: 'a tune brought back' };

// "The heron", to start a sentence.
export const animalName = (id) => ANIMALS[id].name.replace(/^t/, 'T');
````

Apply to `open-case/src/tuning.js`:

````diff
diff --git a/open-case/src/tuning.js b/open-case/src/tuning.js
index cab91b6..251b1a3 100644
--- a/open-case/src/tuning.js
+++ b/open-case/src/tuning.js
@@ -107,6 +107,8 @@ export const TIPS = { callback: 1, happy: 2, happyElder: 3, end: 1 };
 //   pace, patience  shares of each kind's own walking speed and patience (crowd's kinds)
 //   stay      seconds a listener stays: from, to
 //   tips      as TIPS
+//   coins     false where nobody pays: each tip counts as the listener's fondness instead (crowd.js)
+//   animals   true where animals come instead of people (animals.js), settling on ISLAND.spots
 // The park's are CROWD's and TIPS's own, so a set there plays exactly as it always has.
 export const PLACES = {
   park: {
@@ -122,6 +124,26 @@ export const PLACES = {
     kinds: [0, 0.4, 0.4, 0.2], arrive: [4, 7], waves: null, onScreen: 6, pace: 0.7, patience: 1.5, stay: [90, 240],
     tips: { callback: 1, happy: 1, happyElder: 2, end: 1 },
   },
+  // One Tree Island: animals instead of people, every kind as likely and as patient as in the park, but
+  // fewer of them, and nobody pays.
+  island: {
+    kinds: [1, 1, 1, 1], arrive: [10, 16], waves: null, onScreen: 6, pace: 1, patience: 1,
+    stay: [CROWD.budgetMin, CROWD.budgetMax], tips: TIPS, coins: false, animals: true,
+  },
+};
+
+// One Tree Island's crowd: the line each sort of animal crosses along (animals.js cross): the land
+// animals walk along the island at y 146, as people walk the park's path, the swimmers out on the lake
+// behind it (behind the reeds, the rock and the rowboat on its shore), and the birds high up; and the
+// eleven spots they settle on, [x, y of their feet, sort]: three in the pine, four on the grass round
+// you, and four in the water just off the shore (two in the shallows, the rock and the lily pad).
+export const ISLAND = {
+  lanes: { land: 146, water: 124, sky: 40 },
+  spots: [
+    [122, 93, 'pine'], [190, 77, 'pine'], [138, 61, 'pine'],
+    [70, 158, 'grass'], [96, 165, 'grass'], [196, 165, 'grass'], [228, 158, 'grass'],
+    [52, 134, 'shallows'], [214, 134, 'shallows'], [290, 133, 'rock'], [22, 136, 'lily'],
+  ],
 };
 
 // The band's layers, and how many listeners each needs. A layer drops out only after the crowd has
````

Apply to `open-case/src/crowd.js`:

````diff
diff --git a/open-case/src/crowd.js b/open-case/src/crowd.js
index 96b7acc..857d399 100644
--- a/open-case/src/crowd.js
+++ b/open-case/src/crowd.js
@@ -1,14 +1,18 @@
 // The passers-by. Pure: they arrive from the seed, walk the path, listen while in earshot, stop when
 // hooked, and leave bored or happy. Their interest moves with what the ears hear (listen.js events).
-// Coins and the rest are reported in c.out as { type, person, coins? } for the set to collect.
+// Coins and the rest are reported in c.out as { type, person, coins? } for the set to collect; where
+// nobody pays (One Tree Island), a tip is { type: 'fond', person, fondness, why } instead.
 //
 // Each person: { id, kind, look (which of the kind's people they are, 0 to LOOKS - 1), dir (+1 walking
 //   right), x, y, state, listening, heard, interest, budget, stayed, spot, lastRule,
 //   reaction: { rule, t } | null, done }
+// On the island, each is an animal (animals.js) instead: look is its place in its kind's animals
+// (ANIMALS_OF), and it has { animal, lane } too: its name, and the y it crosses along.
 // state: 'passing' (walking by, maybe listening), 'joining' (hooked, walking to a spot), 'stopped',
 // 'leaving'. The crowd is everyone joining or stopped.
-import { CROWD, INTEREST, RULES, PLACES } from './tuning.js';
+import { CROWD, INTEREST, RULES, PLACES, ISLAND } from './tuning.js';
 import { createRng, nextRandom, randomBetween } from './rng.js';
+import { ANIMALS, ANIMALS_OF } from './animals.js';
 
 export const KINDS = ['jogger', 'elder', 'student', 'commuter'];
 export const LOOKS = 6; // each kind's people, three women and three men (art/open-case/figures.lua)
@@ -52,6 +56,7 @@ export function createCrowd(seed, place = 'park') {
     open: true, // new people still arrive
     stoppedEver: 0,
     longest: null, // { kind, look, seconds }: whoever has stayed longest
+    first: null, // { kind, look }: whoever came by first
     out: [],
   };
 }
@@ -73,11 +78,12 @@ export function personName(kind, who) {
 // look just dealt. So everyone of a kind comes by before any comes back, and two people of a kind look
 // alike only when more than six of that kind are on screen at once (the station allows more than the
 // park and the market do): then, with every look worn, one someone's wearing is given out, not the
-// look just dealt if there's another.
+// look just dealt if there's another. On the island the looks are the kind's animals (two or three),
+// so a second of one comes only while all of its kind are on screen.
 export function dealLook(c, kind) {
   const worn = new Set(c.people.filter((p) => p.kind === kind).map((p) => p.look));
   if (!c.decks[kind].some((l) => !worn.has(l))) {
-    const deck = [...Array(LOOKS).keys()];
+    const deck = [...Array(c.place.animals ? ANIMALS_OF[kind].length : LOOKS).keys()];
     for (let i = deck.length - 1; i > 0; i--) {
       const j = Math.floor(nextRandom(c.lookRng) * (i + 1));
       [deck[i], deck[j]] = [deck[j], deck[i]];
@@ -110,14 +116,24 @@ function arrive(c, t) {
   const kind = pickKind(nextRandom(c.rng), c.place.kinds);
   const dir = nextRandom(c.rng) < 0.5 ? 1 : -1;
   const budget = randomBetween(c.rng, c.place.stay[0], c.place.stay[1]);
+  const look = dealLook(c, kind);
+  // On the island, an animal of the kind, crossing along its own line.
+  const animal = c.place.animals ? ANIMALS_OF[kind][look] : null;
+  const lane = animal ? ISLAND.lanes[ANIMALS[animal].cross] : PATH_Y;
+  c.first ??= { kind, look };
   c.people.push({
-    id: c.nextId++, kind, look: dealLook(c, kind), dir, x: dir > 0 ? -CROWD.edge : CROWD.width + CROWD.edge, y: PATH_Y,
+    id: c.nextId++, kind, look, dir, x: dir > 0 ? -CROWD.edge : CROWD.width + CROWD.edge, y: lane,
     state: 'passing', listening: false, heard: 0, walkedOn: false,
     interest: INTEREST.start + INTEREST.draw * crowdSize(c), budget, stayed: 0, spot: -1,
-    lastRule: '', reaction: null, done: false, arrivedAt: t,
+    lastRule: '', reaction: null, done: false, arrivedAt: t, ...(animal && { animal, lane }),
   });
 }
 
+// A tip from p: coins, or where nobody pays, fondness.
+function tip(c, p, amount, why) {
+  c.out.push(c.place.coins === false ? { type: 'fond', person: p, fondness: amount, why } : { type: 'coin', person: p, coins: amount, why });
+}
+
 function nudge(p, rule, delta, t) {
   p.interest = Math.min(1, Math.max(0, p.interest + delta));
   p.lastRule = rule;
@@ -148,7 +164,7 @@ export function hear(c, e, t) {
         break;
       case 'callback':
         nudge(p, 'callback', INTEREST.callback, t);
-        if (inCrowd(p)) c.out.push({ type: 'coin', person: p, coins: c.place.tips.callback, why: 'callback' });
+        if (inCrowd(p)) tip(c, p, c.place.tips.callback, 'callback');
         break;
       default: // repeat, offKey, recognised, random, silence
         nudge(p, e.rule, INTEREST[e.rule], t);
@@ -156,18 +172,27 @@ export function hear(c, e, t) {
   }
 }
 
-function freeSpot(c, x) {
-  let best = -1;
-  CROWD.spots.forEach(([sx], i) => {
-    if (c.people.some((o) => inCrowd(o) && o.spot === i)) return;
-    if (best < 0 || Math.abs(sx - x) < Math.abs(CROWD.spots[best][0] - x)) best = i;
-  });
-  return best;
+// Where listeners stand: round you in an arc, or on the island, its spots ([x, y, sort]).
+export const spotsOf = (c) => (c.place.animals ? ISLAND.spots : CROWD.spots);
+
+// The free spot nearest to p, or -1: for a person any of the arc's, for an animal one of the first of
+// its sorts (animals.js spots) that has one free.
+function freeSpot(c, p) {
+  const spots = spotsOf(c);
+  for (const sort of p.animal ? ANIMALS[p.animal].spots : [null]) {
+    let best = -1;
+    spots.forEach(([sx, , s], i) => {
+      if ((sort && s !== sort) || c.people.some((o) => inCrowd(o) && o.spot === i)) return;
+      if (best < 0 || Math.abs(sx - p.x) < Math.abs(spots[best][0] - p.x)) best = i;
+    });
+    if (best >= 0) return best;
+  }
+  return -1;
 }
 
 function leave(c, p, happy) {
   p.state = 'leaving';
-  if (happy) c.out.push({ type: 'coin', person: p, coins: p.kind === 'elder' ? c.place.tips.happyElder : c.place.tips.happy, why: 'happy' });
+  if (happy) tip(c, p, p.kind === 'elder' ? c.place.tips.happyElder : c.place.tips.happy, 'happy');
   c.out.push({ type: 'left', person: p, happy });
 }
 
@@ -194,7 +219,7 @@ export function stepCrowd(c, dt, t) {
       if (p.listening) {
         p.heard += dt;
         if (p.interest >= INTEREST.hook) {
-          const spot = freeSpot(c, p.x);
+          const spot = freeSpot(c, p);
           if (spot >= 0) {
             p.state = 'joining';
             p.listening = false;
@@ -213,7 +238,7 @@ export function stepCrowd(c, dt, t) {
       p.stayed += dt;
       if (!c.longest || p.stayed > c.longest.seconds) c.longest = { kind: p.kind, look: p.look, seconds: p.stayed };
       if (p.state === 'joining') {
-        const [sx, sy] = CROWD.spots[p.spot];
+        const [sx, sy] = spotsOf(c)[p.spot];
         const step = kind.speed * dt;
         p.x += Math.max(-step, Math.min(step, sx - p.x));
         p.y += Math.max(-step, Math.min(step, sy - p.y));
@@ -223,7 +248,7 @@ export function stepCrowd(c, dt, t) {
       else if (p.stayed >= p.budget) leave(c, p, p.interest > INTEREST.happy);
     } else if (p.state === 'leaving') {
       p.x += p.dir * kind.speed * dt;
-      p.y += Math.max(-kind.speed * dt, Math.min(kind.speed * dt, PATH_Y - p.y));
+      p.y += Math.max(-kind.speed * dt, Math.min(kind.speed * dt, (p.lane ?? PATH_Y) - p.y));
     }
     if (p.x < -CROWD.edge - 1 || p.x > CROWD.width + CROWD.edge + 1) p.done = true;
   }
@@ -232,5 +257,5 @@ export function stepCrowd(c, dt, t) {
 
 // The set is over: each listener still here tips once.
 export function endTips(c) {
-  for (const p of c.people) if (inCrowd(p)) c.out.push({ type: 'coin', person: p, coins: c.place.tips.end, why: 'end' });
+  for (const p of c.people) if (inCrowd(p)) tip(c, p, c.place.tips.end, 'end');
 }
````

Apply to `open-case/src/set.js`:

````diff
diff --git a/open-case/src/set.js b/open-case/src/set.js
index 5ab0276..b6bdd95 100644
--- a/open-case/src/set.js
+++ b/open-case/src/set.js
@@ -5,12 +5,13 @@
 // set.events holds this update's news for the screen and the sound, as plain objects:
 //   { type: 'rule', rule, ... }         something the ears noticed (see listen.js)
 //   { type: 'coin', person, coins, why } a coin lands in the case ('callback', 'happy' or 'end')
+//   { type: 'fond', person, fondness, why } where nobody pays (One Tree Island), a tip's fondness
 //   { type: 'hooked', person }  { type: 'left', person, happy }
 //   { type: 'layers', bar, layers }     the layers playing from bar `bar` on (decided just before it)
 //   { type: 'end' }                     the set's last bar is over: fade the band, clap
 //   { type: 'over' }                    the end card
 import { createListener, noteOn, noteOff, tick } from './listen.js';
-import { createCrowd, hear, stepCrowd, crowdSize, endTips } from './crowd.js';
+import { createCrowd, hear, stepCrowd, crowdSize, endTips, inCrowd } from './crowd.js';
 import { LOFI, clockOf, setBars } from './beats.js';
 import { GROOVE, LAYERS, LAYER_HOLD, DT } from './tuning.js';
 
@@ -29,6 +30,8 @@ export function createSet(seed, beat = LOFI, place = 'park') {
     listen: createListener(clock),
     crowd: createCrowd(seed, place),
     coins: 0,
+    fondness: 0, // where nobody pays, the tips' fondness instead
+    fans: [], // the animals won over, { animal, stayed }: each that left happy, or was still there at the end
     layers: Object.fromEntries(LAYERS.map((l) => [l.id, l.min === 0])),
     below: Object.fromEntries(LAYERS.map((l) => [l.id, 0])), // whole bars the crowd has stayed below each layer's number
     most: 0, // the biggest the crowd has been since the last layer decision
@@ -93,6 +96,7 @@ export function stepSet(set, dt = DT) {
     set.phase = 'ending';
     c.open = false;
     endTips(c);
+    for (const p of c.people) if (inCrowd(p) && p.animal) set.fans.push({ animal: p.animal, stayed: p.stayed });
     set.overAt = t + bar + GROOVE.applause; // a bar's fade, then applause
     set.events.push({ type: 'end' });
   } else if (set.phase === 'ending' && t >= set.overAt) {
@@ -101,14 +105,16 @@ export function stepSet(set, dt = DT) {
   }
   for (const e of c.out) {
     if (e.type === 'coin') set.coins += e.coins;
+    else if (e.type === 'fond') set.fondness += e.fondness;
+    else if (e.type === 'left' && e.happy && e.person.animal) set.fans.push({ animal: e.person.animal, stayed: e.person.stayed });
     set.events.push(e);
   }
   c.out.length = 0;
 }
 
-// What the end card shows.
+// What the end card shows. (fondness: where nobody pays, what the tips would have been.)
 export function summary(set) {
-  return { coins: set.coins, stopped: set.crowd.stoppedEver, longest: set.crowd.longest };
+  return { coins: set.coins, fondness: set.fondness, stopped: set.crowd.stoppedEver, longest: set.crowd.longest };
 }
 
 // A list of notes ([{ t, pitch, strength, len }], seconds) as key moments in time order: { t, note }
````

- [ ] **Step 4: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 449 tests. Every test that was there before passes unchanged: the park, the station and the night market draw exactly as they did.

- [ ] **Step 5: Commit**

```bash
git add open-case/src/animals.js open-case/src/tuning.js open-case/src/crowd.js open-case/src/set.js open-case/test/animals.test.js open-case/test/crowd.test.js open-case/test/set.test.js open-case/test/bots.test.js
git commit -m "Open Case: animals listen on One Tree Island in place of people, each like one kind of town listener, and their tips count as fondness, not coins

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Keepsakes

**Files:**
- Create: `open-case/src/keepsakes.js`, `open-case/test/keepsakes.test.js`
- Modify: `open-case/src/tuning.js`, `open-case/src/set.js`
- Test: `open-case/test/set.test.js`, `open-case/test/bots.test.js`

**Interfaces:**
- Consumes: `ANIMALS`, `ANIMALS_OF`, `LIKES` (Task 1); `set.fondness`, `set.fans`, `crowd.longest`, `crowd.first` (Task 1); `safeStorage` (`storage.js`).
- Produces:
  - `keepsakes.js`:
    - `KEEPSAKES` (`[{ id, animal, special, name, a, line }]`, each animal's ordinary one then its special one, in `ANIMAL_IDS` order);
    - `keepsake(id)` (or `null`), `hint(id)` (`{ name, line }`), `nextFrom(animal, found)`, `chanceOf(fondness)`;
    - `keepsakeFor({ found, fondness, fans, longest, first, roll })` (an id or `null`);
    - `loadKeepsakes(storage)` (`{ found, inCase }`), `saveKeepsakes(storage, keeps)`;
    - `addFound(keeps, id)`, `toggleCase(keeps, id)` (`'in' | 'out' | 'full' | null`), `someKeepsakes(n)`.
  - `tuning.js`: `KEEPSAKE` (`{ full: 30, most: 0.22, caseHolds: 3 }`).
  - `set.js`:
    - `createSet(seed, beat = LOFI, place = 'park', found = [])` and `runSet(seed, notes, beat = LOFI, place = 'park', found = [])`;
    - `set.keepsake`, the event `{ type: 'keepsake', id }` just after `{ type: 'end' }`, and `summary(set)` gains `keepsake`.

- [ ] **Step 1: Write the failing tests**

Create `open-case/test/keepsakes.test.js`:

````js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  KEEPSAKES, keepsake, hint, nextFrom, chanceOf, keepsakeFor, loadKeepsakes, saveKeepsakes, addFound, toggleCase, someKeepsakes,
} from '../src/keepsakes.js';
import { ANIMAL_IDS } from '../src/animals.js';
import { KEEPSAKE } from '../src/tuning.js';
import { safeStorage } from '../src/storage.js';

// A storage backed by a plain object, like the browser's localStorage.
function memory(start = {}) {
  const data = { ...start };
  return { data, store: safeStorage({ getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } }) };
}
const ALL = KEEPSAKES.map((k) => k.id);
// A set's end on the island, with nothing found yet and nobody won over, the roll as high as it goes.
const end = (over) => ({ found: [], fondness: 0, fans: [], longest: null, first: null, roll: 0.999, ...over });

test("twenty-two keepsakes, an ordinary one and then a special one from each animal, in the animals' order", () => {
  assert.equal(KEEPSAKES.length, 22);
  assert.deepEqual(KEEPSAKES.map((k) => k.animal), ANIMAL_IDS.flatMap((id) => [id, id]));
  assert.deepEqual(KEEPSAKES.map((k) => k.special), ANIMAL_IDS.flatMap(() => [false, true]));
  assert.equal(new Set(ALL).size, 22, 'each its own id');
  for (const k of KEEPSAKES) assert.ok(k.name && k.a && k.line, k.id);
  assert.deepEqual(keepsake('sock'), { id: 'sock', animal: 'fox', special: true, name: 'Odd sock', a: 'an odd sock', line: "the fox won't say whose it was" });
  assert.equal(keepsake('spoon'), null);
});

test("a keepsake you haven't found gives a hint: the animal it's from, and what that animal likes", () => {
  assert.deepEqual(hint('blackberry'), { name: 'Something from the fox', line: 'the fox likes the groove' });
  assert.deepEqual(hint('ring'), { name: 'Something special from the crow', line: 'the crow likes a tune brought back' });
  assert.deepEqual(hint('feather'), { name: 'Something from the ducks', line: 'the ducks like busy playing' });
  assert.deepEqual(hint('pebble'), { name: 'Something from the heron', line: 'the heron likes space and long notes' });
});

test('an animal gives its ordinary keepsake first, then its special one, then nothing', () => {
  assert.equal(nextFrom('fox', []), 'blackberry');
  assert.equal(nextFrom('fox', ['blackberry']), 'sock');
  assert.equal(nextFrom('fox', ['sock', 'blackberry']), null);
  assert.equal(nextFrom('fox', ['sock']), 'blackberry', 'the ordinary one first, even after the special');
});

test('the chance is nothing with no fondness, and rises with it to its cap', () => {
  assert.equal(chanceOf(0), 0);
  assert.ok(Math.abs(chanceOf(KEEPSAKE.full / 2) - KEEPSAKE.most / 2) < 1e-12);
  assert.equal(chanceOf(KEEPSAKE.full), KEEPSAKE.most);
  assert.equal(chanceOf(KEEPSAKE.full * 4), KEEPSAKE.most);
  assert.ok(KEEPSAKE.most > 0.15 && KEEPSAKE.most < 0.35, 'about 1 in 4');
});

test('your first set on the island always leaves the ordinary keepsake of the animal that stayed longest, or the first that came by', () => {
  assert.equal(keepsakeFor(end({ longest: { kind: 'student', look: 0, seconds: 94 }, first: { kind: 'elder', look: 0 } })), 'blackberry');
  assert.equal(keepsakeFor(end({ first: { kind: 'commuter', look: 1 } })), 'owlfeather', 'nobody settled: the first that came by');
  assert.equal(keepsakeFor(end({})), null, 'nobody came at all');
});

test('after that, a set where no animal was won over leaves nothing, however the roll falls', () => {
  const found = ['dandelion'];
  assert.equal(keepsakeFor(end({ found, roll: 0 })), null, 'no fondness');
  assert.equal(keepsakeFor(end({ found, fondness: 40, roll: 0 })), null, 'fondness, but no fan');
  assert.equal(keepsakeFor(end({ found, fondness: 40, fans: [{ animal: 'fox', stayed: 30 }], roll: KEEPSAKE.most })), null, 'the roll missed');
  assert.equal(keepsakeFor(end({ found, fondness: 40, fans: [{ animal: 'fox', stayed: 30 }], roll: KEEPSAKE.most - 0.01 })), 'blackberry');
});

test('it comes from the fan that stayed longest with one still to give', () => {
  const fans = [{ animal: 'fox', stayed: 20 }, { animal: 'crow', stayed: 90 }, { animal: 'heron', stayed: 50 }];
  const leaves = (found) => keepsakeFor(end({ found, fondness: 40, fans, roll: 0 }));
  assert.equal(leaves(['dandelion']), 'bottlecap');
  assert.equal(leaves(['dandelion', 'bottlecap']), 'ring');
  assert.equal(leaves(['dandelion', 'bottlecap', 'ring']), 'pebble');
  assert.equal(leaves(['bottlecap', 'ring', 'pebble', 'fishbones', 'blackberry', 'sock']), null, 'no fan has one left');
});

test('never one you have, and nothing once you have all 22', () => {
  assert.equal(keepsakeFor(end({ found: ALL, fondness: 99, fans: [{ animal: 'owl', stayed: 99 }], roll: 0 })), null);
  assert.equal(keepsakeFor(end({ found: ALL.filter((id) => id !== 'acorn'), fondness: 99, fans: [{ animal: 'squirrel', stayed: 9 }], roll: 0 })), 'acorn');
});

test('the keepsakes you find and the ones in your case are kept for good', () => {
  const { data, store } = memory();
  const keeps = loadKeepsakes(store);
  assert.deepEqual(keeps, { found: [], inCase: [] });
  addFound(keeps, 'blackberry');
  addFound(keeps, 'bottlecap');
  toggleCase(keeps, 'bottlecap');
  saveKeepsakes(store, keeps);
  assert.deepEqual(JSON.parse(data['open-case-keepsakes']), { found: ['blackberry', 'bottlecap'], inCase: ['blackberry', 'bottlecap'] });
  assert.deepEqual(loadKeepsakes(store), keeps, 'as they were, after a reload');
});

test('anything unreadable, unknown, twice over or not found is left out of what was kept, and the case holds three', () => {
  const load = (kept) => loadKeepsakes(memory({ 'open-case-keepsakes': kept }).store);
  for (const bad of ['{nope', '7', 'null', '"acorn"', '{"found":"acorn"}', '[]']) assert.deepEqual(load(bad), { found: [], inCase: [] }, bad);
  assert.deepEqual(load('{"found":["acorn","spoon",3,"acorn","ring"],"inCase":["ring","sock",null]}'), { found: ['acorn', 'ring'], inCase: ['ring'] });
  assert.deepEqual(load(JSON.stringify({ found: ALL, inCase: ALL })), { found: ALL, inCase: ALL.slice(0, 3) });
  assert.deepEqual(loadKeepsakes(safeStorage(null)), { found: [], inCase: [] }, 'no storage at all');
});

test('your first keepsake goes into your case by itself; later ones only join the shelf, and none twice', () => {
  const keeps = { found: [], inCase: [] };
  addFound(keeps, 'lily');
  assert.deepEqual(keeps, { found: ['lily'], inCase: ['lily'] });
  addFound(keeps, 'acorn');
  addFound(keeps, 'lily');
  addFound(keeps, 'spoon');
  assert.deepEqual(keeps, { found: ['lily', 'acorn'], inCase: ['lily'] });
});

test('your case: a found keepsake goes in or comes out, a fourth is refused, and one not found does nothing', () => {
  const keeps = { found: ['lily', 'acorn', 'ring', 'sock'], inCase: ['lily'] };
  assert.equal(toggleCase(keeps, 'acorn'), 'in');
  assert.equal(toggleCase(keeps, 'ring'), 'in');
  assert.equal(toggleCase(keeps, 'sock'), 'full');
  assert.deepEqual(keeps.inCase, ['lily', 'acorn', 'ring']);
  assert.equal(toggleCase(keeps, 'lily'), 'out');
  assert.equal(toggleCase(keeps, 'sock'), 'in');
  assert.deepEqual(keeps.inCase, ['acorn', 'ring', 'sock'], 'in the order put in');
  assert.equal(toggleCase(keeps, 'bell'), null);
  assert.deepEqual(keeps.inCase, ['acorn', 'ring', 'sock']);
});

test('?keepsakes= gives the first n in the list, the first three in your case', () => {
  assert.deepEqual(someKeepsakes(0), { found: [], inCase: [] });
  assert.deepEqual(someKeepsakes(2), { found: ['dandelion', 'clover'], inCase: ['dandelion', 'clover'] });
  assert.deepEqual(someKeepsakes(5).inCase, ['dandelion', 'clover', 'feather']);
  assert.deepEqual(someKeepsakes(99).found, ALL);
});
````

Apply to `open-case/test/set.test.js`:

````diff
diff --git a/open-case/test/set.test.js b/open-case/test/set.test.js
index 8d5a9b7..303e670 100644
--- a/open-case/test/set.test.js
+++ b/open-case/test/set.test.js
@@ -1,7 +1,10 @@
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
 import { readFileSync } from 'node:fs';
-import { createSet, stepSet, playNote, momentsOf, endTime } from '../src/set.js';
+import { createSet, stepSet, playNote, momentsOf, endTime, runSet } from '../src/set.js';
+import { goodSet, randomBot } from '../src/bots.js';
+import { KEEPSAKES } from '../src/keepsakes.js';
+import { ANIMALS_OF } from '../src/animals.js';
 import { LOFI, LOFI_CLOCK, readyBeat } from '../src/beats.js';
 import { DT, TIPS } from '../src/tuning.js';
 import { stoodAt } from './helpers.js';
@@ -122,3 +125,31 @@ test('on the island every tip is fondness, never coins, and the fans are the ani
   assert.deepEqual(set.fans.map((f) => f.animal), ['heron', 'fox'], 'not the crow, who left bored');
   assert.ok(Math.abs(set.fans[0].stayed - 5) < 0.05 && Math.abs(set.fans[1].stayed - 20) < 0.05);
 });
+
+test("a set on the island ends with its keepsake, once its last tips are in: the first is from whoever stayed longest", () => {
+  const set = createSet(4, LOFI, 'island');
+  const moments = momentsOf(goodSet(4)), events = [];
+  let i = 0;
+  while (set.phase !== 'over') {
+    for (; i < moments.length && moments[i].t <= set.t + DT; i++) if (moments[i].note) playNote(set, moments[i].note.pitch, 3, moments[i].t);
+    stepSet(set, DT);
+    events.push(...set.events.map((e) => e.type));
+  }
+  const { kind, look } = set.crowd.longest;
+  assert.equal(set.keepsake, KEEPSAKES.find((k) => k.animal === ANIMALS_OF[kind][look]).id);
+  assert.deepEqual(events.filter((e) => e === 'keepsake' || e === 'end'), ['end', 'keepsake'], 'once, just after the end');
+  assert.ok(events.lastIndexOf('fond') < events.indexOf('keepsake'), 'after the last tips');
+});
+
+test("the keepsake's roll never moves the crowd's draws, and the same seed and notes leave the same keepsake", () => {
+  for (const seed of [1, 2, 3]) {
+    const notes = goodSet(seed), sets = [[], ['dandelion'], KEEPSAKES.map((k) => k.id)].map((found) => runSet(seed, notes, LOFI, 'island', found));
+    const crowd = (s) => [s.fondness, s.crowd.stoppedEver, s.crowd.longest, s.fans];
+    assert.deepEqual(crowd(sets[1]), crowd(sets[0]));
+    assert.deepEqual(crowd(sets[2]), crowd(sets[0]));
+    assert.equal(sets[2].keepsake, null, 'all 22 found: nothing');
+    assert.equal(runSet(seed, notes, LOFI, 'island', ['dandelion']).keepsake, sets[1].keepsake);
+  }
+  assert.equal(runSet(1, goodSet(1), LOFI, 'park', []).keepsake, null, 'nothing anywhere but the island');
+  assert.equal(runSet(1, randomBot(1), LOFI, 'island', []).keepsake !== null, true, 'your first comes however you played');
+});
````

Apply to `open-case/test/bots.test.js`:

````diff
diff --git a/open-case/test/bots.test.js b/open-case/test/bots.test.js
index 9995c43..394251f 100644
--- a/open-case/test/bots.test.js
+++ b/open-case/test/bots.test.js
@@ -137,3 +137,12 @@ test('on One Tree Island nobody pays: an honest set wins the animals over, and r
   assert.ok(sum(fondness(good)) >= 10 * sum(fondness(random)), `honest ${fondness(good)}, random bot ${fondness(random)}`);
   assert.equal(sum(fondness(lick)), 0);
 });
+
+test('with a keepsake found, an honest set on the island is left another about 1 time in 4, random notes and a lick almost never', () => {
+  const seeds = Array.from({ length: 200 }, (_, i) => i + 1);
+  const share = (bot) => seeds.filter((seed) => runSet(seed, bot(seed), LOFI, 'island', ['dandelion']).keepsake).length / seeds.length;
+  const good = share(goodSet), random = share(randomBot), lick = share(lickBot);
+  assert.ok(good >= 0.2 && good <= 0.3, `honest: ${good}`);
+  assert.ok(random < 0.05, `random bot: ${random}`);
+  assert.ok(lick <= 0.005, `lick bot: ${lick}`);
+});
````

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL. Three fail:
- `test/keepsakes.test.js` and `test/set.test.js` can't load: `Cannot find module '…/open-case/src/keepsakes.js'`;
- the odds test fails, as no set leaves a keepsake yet.

The other 440 tests pass.

- [ ] **Step 3: The keepsakes, and the one a set leaves**

Create `open-case/src/keepsakes.js`:

````js
// The keepsakes the animals of One Tree Island leave in your case: twenty-two, an ordinary one and then
// a special one from each animal (animals.js). At the end of a set on the island, one may come
// (keepsakeFor): your first set there always leaves one, and after that it's a chance that rises with
// how fond the animals grew of you. Which you've found, in the order found, and which are in your
// case (it holds three), are kept for good in storage. Pure, so it's tested in Node; set.js asks for
// the keepsake, main.js keeps them, and room.js shows them on your shelf.
import { ANIMALS, ANIMALS_OF, LIKES } from './animals.js';
import { KEEPSAKE } from './tuning.js';

// Each: { id, animal, special (false for the ordinary one, which comes first), name, a (what the end
// card says the animal left you), line (the shelf's words about it) }. In the order of the animals,
// each animal's ordinary one first: the shelf's columns and rows.
export const KEEPSAKES = [
  { id: 'dandelion', animal: 'bunny', special: false, name: 'Dandelion clock', a: 'a dandelion clock', line: 'make a wish, then blow' },
  { id: 'clover', animal: 'bunny', special: true, name: 'Four-leaf clover', a: 'a four-leaf clover', line: 'the bunny looked all spring for it' },
  { id: 'feather', animal: 'ducks', special: false, name: 'White feather', a: 'a white feather', line: "from the mother duck's best wing" },
  { id: 'rubberduck', animal: 'ducks', special: true, name: 'Rubber duck', a: 'a rubber duck', line: "the ducklings think it's family" },
  { id: 'acorn', animal: 'squirrel', special: false, name: 'Acorn', a: 'an acorn', line: 'the squirrel had one spare. just one.' },
  { id: 'goldacorn', animal: 'squirrel', special: true, name: 'Golden acorn', a: 'a golden acorn', line: "the squirrel's whole savings" },
  { id: 'pebble', animal: 'heron', special: false, name: 'Smooth pebble', a: 'a smooth pebble', line: 'the heron chose the smoothest one' },
  { id: 'fishbones', animal: 'heron', special: true, name: 'Fish skeleton', a: 'a fish skeleton', line: 'the heron ate the rest' },
  { id: 'snailshell', animal: 'turtle', special: false, name: 'Snail shell', a: 'a snail shell', line: 'nobody lives in it any more' },
  { id: 'teacup', animal: 'turtle', special: true, name: 'Tiny teacup', a: 'a tiny teacup', line: 'the turtle takes its tea slowly' },
  { id: 'wildflower', animal: 'deer', special: false, name: 'Wildflower', a: 'a wildflower', line: "the deer didn't eat this one" },
  { id: 'bell', animal: 'deer', special: true, name: 'Little bell', a: 'a little bell', line: "it rings when nobody's looking" },
  { id: 'blackberry', animal: 'fox', special: false, name: 'Blackberry', a: 'a blackberry', line: 'the fox ate all the others' },
  { id: 'sock', animal: 'fox', special: true, name: 'Odd sock', a: 'an odd sock', line: "the fox won't say whose it was" },
  { id: 'lily', animal: 'frog', special: false, name: 'Water lily', a: 'a water lily', line: 'the frog has plenty of pads' },
  { id: 'crown', animal: 'frog', special: true, name: 'Tiny crown', a: 'a tiny crown', line: 'the frog was a prince once, maybe' },
  { id: 'leaf', animal: 'hedgehog', special: false, name: 'Crunchy leaf', a: 'a crunchy leaf', line: "the hedgehog's crunchiest" },
  { id: 'apple', animal: 'hedgehog', special: true, name: 'Tiny apple', a: 'a tiny apple', line: 'the hedgehog brought it on its spines' },
  { id: 'bottlecap', animal: 'crow', special: false, name: 'Bottle cap', a: 'a bottle cap', line: 'the shiniest thing the crow had' },
  { id: 'ring', animal: 'crow', special: true, name: 'Gold ring', a: 'a gold ring', line: "the crow's real treasure" },
  { id: 'owlfeather', animal: 'owl', special: false, name: 'Speckled feather', a: 'a speckled feather', line: 'the owl had one to spare' },
  { id: 'spectacles', animal: 'owl', special: true, name: 'Tiny spectacles', a: 'tiny spectacles', line: 'the owl reads late into the night' },
];

export const keepsake = (id) => KEEPSAKES.find((k) => k.id === id) ?? null;

// The words for a keepsake you haven't found yet, a hint: the animal it's from, and what that animal
// likes. { name, line }, as a found one's.
export function hint(id) {
  const { animal, special } = keepsake(id), { name, kind, plural } = ANIMALS[animal];
  return { name: `Something ${special ? 'special ' : ''}from ${name}`, line: `${name} like${plural ? '' : 's'} ${LIKES[kind]}` };
}

// What an animal gives next, its ordinary keepsake and then its special one: an id, or null once
// you've found both.
export const nextFrom = (animal, found) => KEEPSAKES.find((k) => k.animal === animal && !found.includes(k.id))?.id ?? null;

// The chance a set on the island leaves a keepsake once you've found one: nothing with no fondness,
// rising with it to KEEPSAKE.most at KEEPSAKE.full.
export const chanceOf = (fondness) => KEEPSAKE.most * Math.min(1, Math.max(0, fondness) / KEEPSAKE.full);

// What a set on the island leaves you at its end: a keepsake's id, or null. From the set:
//   found     the ids you'd found before it
//   fondness  its tips, counted as fondness
//   fans      [{ animal, stayed }]: the animals that left happy or were there at the end
//   longest   whoever stayed longest ({ kind, look }, crowd.js), or null; first, whoever came by first
//   roll      a number in [0, 1), from the set's own stream
// Your first keepsake always comes: the ordinary one of the animal that stayed longest, or if none
// settled, of the first that came by. After that, it comes when the roll is under chanceOf(fondness),
// from the fan that stayed longest who still has one to give. Never one you have; nothing once you
// have all 22.
export function keepsakeFor({ found, fondness, fans, longest, first, roll }) {
  if (found.length >= KEEPSAKES.length) return null;
  if (!found.length) {
    const who = longest ?? first;
    return who ? nextFrom(ANIMALS_OF[who.kind][who.look], found) : null;
  }
  if (roll >= chanceOf(fondness)) return null;
  for (const fan of [...fans].sort((a, b) => b.stayed - a.stayed)) {
    const id = nextFrom(fan.animal, found);
    if (id) return id;
  }
  return null;
}

// Yours, kept: { found: [ids, in the order found], inCase: [ids, in the order put in, at most
// KEEPSAKE.caseHolds] }. A keepsake goes in your case only once it's found.
const KEY = 'open-case-keepsakes';

// What's kept (storage: storage.js), leaving out anything unreadable, unknown or twice.
export function loadKeepsakes(storage) {
  let kept = null;
  try {
    kept = JSON.parse(storage.get(KEY) ?? 'null');
  } catch {
    kept = null; // unreadable: start afresh
  }
  const known = (list) => (Array.isArray(list) ? list : []).filter((id, i, all) => keepsake(id) && all.indexOf(id) === i);
  const found = known(kept?.found);
  return { found, inCase: known(kept?.inCase).filter((id) => found.includes(id)).slice(0, KEEPSAKE.caseHolds) };
}

export function saveKeepsakes(storage, keeps) {
  storage.set(KEY, JSON.stringify({ found: keeps.found, inCase: keeps.inCase }));
}

// A keepsake found joins your shelf, and your very first goes into your case by itself.
export function addFound(keeps, id) {
  if (!keepsake(id) || keeps.found.includes(id)) return;
  keeps.found.push(id);
  if (keeps.found.length === 1) keeps.inCase.push(id);
}

// Puts a keepsake you've found in your case, or takes it out if it's in: 'in', 'out', 'full' (your
// case holds three already, and it stays out), or null (you haven't found it).
export function toggleCase(keeps, id) {
  if (!keeps.found.includes(id)) return null;
  const at = keeps.inCase.indexOf(id);
  if (at >= 0) {
    keeps.inCase.splice(at, 1);
    return 'out';
  }
  if (keeps.inCase.length >= KEEPSAKE.caseHolds) return 'full';
  keeps.inCase.push(id);
  return 'in';
}

// ?keepsakes=all or N: the first n keepsakes in the list's order, the first three of them in your case.
export function someKeepsakes(n) {
  const found = KEEPSAKES.slice(0, Math.max(0, n)).map((k) => k.id);
  return { found, inCase: found.slice(0, KEEPSAKE.caseHolds) };
}
````

Apply to `open-case/src/tuning.js`:

````diff
diff --git a/open-case/src/tuning.js b/open-case/src/tuning.js
index 251b1a3..6c670b6 100644
--- a/open-case/src/tuning.js
+++ b/open-case/src/tuning.js
@@ -146,6 +146,13 @@ export const ISLAND = {
   ],
 };
 
+// The keepsakes (keepsakes.js): once you've found your first, a set on the island leaves another with a
+// chance that rises with its fondness, up to `most` at `full` fondness. Tuned with the bots over seeds
+// 1 to 200, with one keepsake found: the honest set is left one in 26% of sets (it wins 33 to 69
+// fondness a set), in key but never bringing an idea back 4.5%, and random notes and the lick none.
+// Your case holds `caseHolds`.
+export const KEEPSAKE = { full: 30, most: 0.22, caseHolds: 3 };
+
 // The band's layers, and how many listeners each needs. A layer drops out only after the crowd has
 // stayed below its number for LAYER_HOLD whole bars.
 export const LAYERS = [
````

Apply to `open-case/src/set.js`:

````diff
diff --git a/open-case/src/set.js b/open-case/src/set.js
index b6bdd95..c175573 100644
--- a/open-case/src/set.js
+++ b/open-case/src/set.js
@@ -9,20 +9,27 @@
 //   { type: 'hooked', person }  { type: 'left', person, happy }
 //   { type: 'layers', bar, layers }     the layers playing from bar `bar` on (decided just before it)
 //   { type: 'end' }                     the set's last bar is over: fade the band, clap
+//   { type: 'keepsake', id }            just after it, on the island: an animal left you a keepsake
 //   { type: 'over' }                    the end card
 import { createListener, noteOn, noteOff, tick } from './listen.js';
 import { createCrowd, hear, stepCrowd, crowdSize, endTips, inCrowd } from './crowd.js';
 import { LOFI, clockOf, setBars } from './beats.js';
+import { keepsakeFor } from './keepsakes.js';
+import { createRng, nextRandom } from './rng.js';
 import { GROOVE, LAYERS, LAYER_HOLD, DT } from './tuning.js';
 
+const KEEPSAKE_SEED = 0x85ebca6b; // mixed into the set's seed for the keepsake's roll, its own stream
+
 // A set of `beat` (beats.js) at `place` (places.js): the band plays the beat, and its tempo sets the
 // set's 16ths, beats and bars (clock) and how many bars the set lasts (bars); the place sets the crowd.
-export function createSet(seed, beat = LOFI, place = 'park') {
+// found: the keepsakes you'd found before it (keepsakes.js), which a set on the island goes by.
+export function createSet(seed, beat = LOFI, place = 'park', found = []) {
   const clock = clockOf(beat);
   return {
     seed,
     beat,
     place,
+    found: [...found],
     clock,
     bars: setBars(beat),
     t: 0,
@@ -32,6 +39,7 @@ export function createSet(seed, beat = LOFI, place = 'park') {
     coins: 0,
     fondness: 0, // where nobody pays, the tips' fondness instead
     fans: [], // the animals won over, { animal, stayed }: each that left happy, or was still there at the end
+    keepsake: null, // on the island, the keepsake left at the end, if any (its id)
     layers: Object.fromEntries(LAYERS.map((l) => [l.id, l.min === 0])),
     below: Object.fromEntries(LAYERS.map((l) => [l.id, 0])), // whole bars the crowd has stayed below each layer's number
     most: 0, // the biggest the crowd has been since the last layer decision
@@ -92,7 +100,8 @@ export function stepSet(set, dt = DT) {
     set.decided++;
     decideLayers(set, set.decided);
   }
-  if (set.phase === 'playing' && t >= endTime(set)) {
+  const ending = set.phase === 'playing' && t >= endTime(set);
+  if (ending) {
     set.phase = 'ending';
     c.open = false;
     endTips(c);
@@ -110,11 +119,21 @@ export function stepSet(set, dt = DT) {
     set.events.push(e);
   }
   c.out.length = 0;
+  if (ending && c.place.animals) leaveKeepsake(set);
+}
+
+// The end of a set on the island, its last tips counted: the keepsake, if one comes (keepsakes.js).
+function leaveKeepsake(set) {
+  const roll = nextRandom(createRng((set.seed ^ KEEPSAKE_SEED) >>> 0));
+  const c = set.crowd;
+  set.keepsake = keepsakeFor({ found: set.found, fondness: set.fondness, fans: set.fans, longest: c.longest, first: c.first, roll });
+  if (set.keepsake) set.events.push({ type: 'keepsake', id: set.keepsake });
 }
 
-// What the end card shows. (fondness: where nobody pays, what the tips would have been.)
+// What the end card shows. (fondness: where nobody pays, what the tips would have been; keepsake: the
+// one an animal left, or null.)
 export function summary(set) {
-  return { coins: set.coins, fondness: set.fondness, stopped: set.crowd.stoppedEver, longest: set.crowd.longest };
+  return { coins: set.coins, fondness: set.fondness, stopped: set.crowd.stoppedEver, longest: set.crowd.longest, keepsake: set.keepsake };
 }
 
 // A list of notes ([{ t, pitch, strength, len }], seconds) as key moments in time order: { t, note }
@@ -129,8 +148,8 @@ export function momentsOf(notes) {
 }
 
 // Plays a whole set without sound or screen, as the tests and the end card's "Run the bots" do.
-export function runSet(seed, notes, beat = LOFI, place = 'park') {
-  const set = createSet(seed, beat, place);
+export function runSet(seed, notes, beat = LOFI, place = 'park', found = []) {
+  const set = createSet(seed, beat, place, found);
   const moments = momentsOf(notes);
   let i = 0;
   while (set.phase !== 'over') {
````

- [ ] **Step 4: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 465 tests. The odds test plays 600 sets, so the suite takes a few seconds longer.

- [ ] **Step 5: Commit**

```bash
git add open-case/src/keepsakes.js open-case/src/tuning.js open-case/src/set.js open-case/test/keepsakes.test.js open-case/test/set.test.js open-case/test/bots.test.js
git commit -m "Open Case: the island's animals leave keepsakes, twenty-two of them: always one after your first set there, then about 1 in 4 good sets, kept for good with three in your case

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: The sunrise, the fish and the keepsake's drop

**Files:**
- Modify: `open-case/src/scene.js`, `open-case/src/tuning.js`
- Test: `open-case/test/scene.test.js`

**Interfaces:**
- Consumes: `skyStages`, `CASE`, `scene.scaredAt` (as today); `ISLAND` (Task 1).
- Produces:
  - `scene.js`:
    - `sunriseStages(bar)`, `sunUp(bars)`, `mistLeft(bars)`;
    - `fishAt(scene, t)` (`null | { pose: 'jump' | 'splash', frame, x, y }`);
    - `giftAt(scene, t, time)` (`null | { id, x, y, landed, sparkle }`);
    - `sceneEvents` takes `{ type: 'keepsake', id }` (`scene.gift`);
    - `FISH_JUMP`, `SPLASH`, `GIFT_FALL`.
  - `tuning.js`: `ISLAND` gains `sunFrom`, `sunTo`, `sunRise`, `mist`, `mistGone`, `fish`.

- [ ] **Step 1: Write the failing tests**

Apply to `open-case/test/scene.test.js`:

````diff
diff --git a/open-case/test/scene.test.js b/open-case/test/scene.test.js
index 3f0afd3..c96b08f 100644
--- a/open-case/test/scene.test.js
+++ b/open-case/test/scene.test.js
@@ -6,10 +6,11 @@ import {
   skyStages, sunDrop, windowLit, lampState, starsOut, trainX, cloudX, createFlocks, birdsAt, pigeonsAt, frameOf,
   PIGEONS, TRAIN_LENGTH, PIGEON_FLY, PIGEON_WALK,
   stationClock, trainAt, boardFirst, marketStages, lanternsLit, steamFrame, catAt, CAT, TRAIN, CAT_RUN, CAT_WALK,
+  sunriseStages, sunUp, mistLeft, fishAt, giftAt, FISH_JUMP, SPLASH, GIFT_FALL,
 } from '../src/scene.js';
 import { createCrowd } from '../src/crowd.js';
 import { LOFI_CLOCK } from '../src/beats.js';
-import { PARK, STATION, MARKET } from '../src/tuning.js';
+import { PARK, STATION, MARKET, ISLAND } from '../src/tuning.js';
 const { bar: BAR } = LOFI_CLOCK;
 
 test('each note leaves a glyph that floats up from the guitar, higher notes higher, and fades over 2 bars', () => {
@@ -315,3 +316,59 @@ test('woken again while strolling back, the cat runs off from where it is, not f
   assert.equal(run.pose, 'run');
   assert.ok(Math.abs(run.x - there) <= 2, `runs from ${run.x}, where it was (${there})`);
 });
+
+test("the island's sunrise lightens the sky a band at a time, at bar lines, from before dawn to morning, the horizon first", () => {
+  assert.deepEqual(sunriseStages(0), [0, 0, 0, 0, 0, 0, 0]);
+  assert.deepEqual(sunriseStages(PARK.bars), [4, 4, 4, 4, 4, 4, 4]);
+  assert.deepEqual(sunriseStages(PARK.bandFirst), [0, 0, 0, 0, 0, 0, 1], 'the horizon first');
+  for (let bar = 0; bar <= PARK.bars; bar++) {
+    const s = sunriseStages(bar);
+    s.forEach((stage, band) => band < 6 && assert.ok(stage <= s[band + 1], `bar ${bar}: lighter toward the horizon`));
+    if (bar) s.forEach((stage, band) => assert.ok(stage >= sunriseStages(bar - 1)[band], `bar ${bar}: never darker again`));
+  }
+});
+
+test('the sun stays behind the far pines a few bars, then comes up, and the mist thins out and is gone by bar 40', () => {
+  assert.equal(sunUp(0), 0);
+  assert.equal(sunUp(ISLAND.sunFrom), 0);
+  assert.equal(sunUp(ISLAND.sunTo), ISLAND.sunRise);
+  assert.equal(sunUp(PARK.bars), ISLAND.sunRise);
+  for (let b = 1; b <= PARK.bars; b += 0.5) assert.ok(sunUp(b) >= sunUp(b - 0.5), `bar ${b}`);
+  assert.equal(mistLeft(0), ISLAND.mist);
+  assert.equal(ISLAND.mistGone, 40);
+  assert.ok(mistLeft(ISLAND.mistGone - 1) > 0);
+  assert.equal(mistLeft(ISLAND.mistGone), 0);
+  assert.equal(mistLeft(PARK.bars), 0);
+  for (let b = 1; b <= PARK.bars; b++) assert.ok(mistLeft(b) <= mistLeft(b - 1), `bar ${b}`);
+});
+
+test("a loud note makes the island's fish jump and splash, and it stays down 4 bars", () => {
+  const scene = createScene(1, { place: 'island' });
+  assert.equal(fishAt(scene, 5), null, 'under, until a loud note');
+  sceneNote(scene, 60, 0, 10, 3);
+  assert.equal(fishAt(scene, 10.1), null, 'a pick strength of 3 leaves it be');
+  sceneNote(scene, 60, 1, 10, 4);
+  const up = fishAt(scene, 10 + FISH_JUMP * 0.25), top = fishAt(scene, 10 + FISH_JUMP / 2), down = fishAt(scene, 10 + FISH_JUMP * 0.75);
+  assert.deepEqual([up.pose, up.frame, down.frame], ['jump', 0, 1]);
+  assert.ok(top.y < up.y && up.y < ISLAND.fish[1] && top.y <= ISLAND.fish[1] - 13, 'it leaps');
+  assert.ok(up.x < top.x && top.x < down.x, 'and along');
+  assert.equal(fishAt(scene, 10 + FISH_JUMP + 0.1).pose, 'splash');
+  assert.equal(fishAt(scene, 10 + FISH_JUMP + SPLASH + 0.1), null);
+  sceneNote(scene, 60, 2, 12, 4);
+  assert.equal(fishAt(scene, 12.1), null, "another loud note soon after doesn't count");
+  const back = 10 + PARK.pigeonsAway * BAR;
+  sceneNote(scene, 60, 3, back + 0.5, 4);
+  assert.equal(fishAt(scene, back + 0.6).pose, 'jump', '4 bars later it jumps again');
+});
+
+test('a keepsake left at the end drops into the case and lies there, sparkling', () => {
+  const scene = createScene(1, { place: 'island' });
+  assert.equal(giftAt(scene, 1, 1), null);
+  sceneEvents(scene, [{ type: 'end' }, { type: 'keepsake', id: 'acorn' }], 180);
+  const falling = giftAt(scene, 180 + GIFT_FALL / 2, 0);
+  assert.equal(falling.id, 'acorn');
+  assert.ok(!falling.landed && falling.y < CASE[1] && falling.x === CASE[0]);
+  const landed = giftAt(scene, 180 + GIFT_FALL + 1, 0);
+  assert.deepEqual([landed.x, landed.y, landed.landed], [...CASE, true]);
+  assert.notEqual(giftAt(scene, 183, 0).sparkle, giftAt(scene, 183, 0.3).sparkle, 'it sparkles');
+});
````

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL. `test/scene.test.js` can't load: `The requested module '../src/scene.js' does not provide an export named 'FISH_JUMP'`. The other 438 tests pass.

- [ ] **Step 3: The sunrise's life**

Apply to `open-case/src/tuning.js`:

````diff
diff --git a/open-case/src/tuning.js b/open-case/src/tuning.js
index 6c670b6..21de94a 100644
--- a/open-case/src/tuning.js
+++ b/open-case/src/tuning.js
@@ -132,12 +132,18 @@ export const PLACES = {
   },
 };
 
-// One Tree Island's crowd: the line each sort of animal crosses along (animals.js cross): the land
+// One Tree Island. Its crowd: the line each sort of animal crosses along (animals.js cross): the land
 // animals walk along the island at y 146, as people walk the park's path, the swimmers out on the lake
 // behind it (behind the reeds, the rock and the rowboat on its shore), and the birds high up; and the
 // eleven spots they settle on, [x, y of their feet, sort]: three in the pine, four on the grass round
 // you, and four in the water just off the shore (two in the shallows, the rock and the lily pad).
+// Its sunrise (scene.js and render.js), over the same PARK.bars as the park's evening: the sky lightens
+// a band at a time from the horizon up, through its five stages; the sun comes up from behind the far
+// pines, rising `sunRise` pixels from bar `sunFrom` to bar `sunTo`; the mist's `mist` streaks thin out
+// one by one and are gone by bar `mistGone`; and a loud note makes the fish jump at `fish` (its x, and
+// the water's y there), which then stays down PARK.pigeonsAway bars, as the pigeons stay away.
 export const ISLAND = {
+  sunFrom: 4, sunTo: 50, sunRise: 44, mist: 4, mistGone: 40, fish: [262, 124],
   lanes: { land: 146, water: 124, sky: 40 },
   spots: [
     [122, 93, 'pine'], [190, 77, 'pine'], [138, 61, 'pine'],
````

Apply to `open-case/src/scene.js`:

````diff
diff --git a/open-case/src/scene.js b/open-case/src/scene.js
index 530df93..e4d5786 100644
--- a/open-case/src/scene.js
+++ b/open-case/src/scene.js
@@ -1,11 +1,12 @@
 // What's on screen besides the set itself, as plain data updated from what happens: the note trail
-// (and your loop's, fainter), coins flying into the case, the gold link of a callback, and the
-// park's life (the sunset over the set, the lit windows, the train, the pigeons by your case and
-// the birds overhead). Pure, so it's tested in Node; render.js draws it. Times are seconds on the
-// set's clock, except the birds' and the pigeons' pecking, which run on the page's clock (`time`).
+// (and your loop's, fainter), coins flying into the case, the gold link of a callback, a keepsake
+// dropping into it, and the park's life (the sunset over the set, the lit windows, the train, the
+// pigeons by your case and the birds overhead), and each other place's. Pure, so it's tested in Node;
+// render.js draws it. Times are seconds on the set's clock, except the birds' and the pigeons'
+// pecking, which run on the page's clock (`time`).
 import { createRng, nextRandom, randomBetween } from './rng.js';
 import { LOFI_CLOCK } from './beats.js';
-import { PARK, STATION, MARKET, RULES } from './tuning.js';
+import { PARK, STATION, MARKET, ISLAND, RULES } from './tuning.js';
 
 export const GUITAR = [152, 128]; // where notes float up from
 // Where your loop's notes float up from (art/open-case/gear.lua G.LOOP_PEDAL).
@@ -36,6 +37,13 @@ const CAT_RUN = 1.5; // seconds a woken cat takes to run off the screen
 const CAT_WALK = PIGEON_WALK; // seconds it takes to stroll back (as long as the pigeons take, so a loud
 // note while it's on its way sends it off from where it is, as they do: scene.flyFrom)
 const CAT_BREATH = 1.4; // seconds each of a sleeping cat's two breaths shows
+const FISH_JUMP = 0.8; // seconds the island's fish is out of the water...
+const FISH_HIGH = 14; // ...leaping this many pixels high...
+const FISH_ON = 12; // ...and this far along
+const SPLASH = 0.5; // seconds its splash shows, each of its two frames half of it
+const GIFT_FALL = 0.8; // seconds a keepsake takes to drop into the case...
+const GIFT_FROM = 70; // ...from this many pixels above it
+const SPARKLE = 0.25; // seconds each of its sparkle's two frames shows
 // Which of n frames a counter is on, for counters that may be negative (the page's clock can start a
 // hair below zero).
 export const frameOf = (count, n) => ((Math.floor(count) % n) + n) % n;
@@ -48,6 +56,7 @@ export function createScene(seed = 1, { bar = LOFI_CLOCK.bar, parkBar = bar, pla
   return {
     bar, parkBar, place,
     trail: [], flights: [], caseCoins: 0, gold: null, clapFrom: -1,
+    gift: null, // a keepsake dropping into the case: { id, t }
     // your loop's notes, { pitch, t }, in time order (t may be a moment ahead: scheduled that way)
     loopTrail: [],
     lastNote: -Infinity, // when you last played a note (you strum)
@@ -60,7 +69,7 @@ export function createScene(seed = 1, { bar = LOFI_CLOCK.bar, parkBar = bar, pla
 }
 
 // A note you played: index is its place in the ears' note list (for its echo). A loud one scatters
-// the pigeons, if they're there (or wakes the night market's cat).
+// the pigeons, if they're there (or wakes the night market's cat, or makes the island's fish jump).
 export function sceneNote(scene, pitch, index, t, strength = 0) {
   scene.trail.push({ pitch, index, t });
   scene.lastNote = t;
@@ -85,6 +94,7 @@ export function sceneEvents(scene, events, t) {
       for (let k = 0; k < e.coins; k++) scene.flights.push({ from: [e.person.x, e.person.y - 34], t: t + k * 0.12 });
     } else if (e.type === 'rule' && e.rule === 'callback') scene.gold = { t, first: e.first };
     else if (e.type === 'end') scene.clapFrom = t;
+    else if (e.type === 'keepsake') scene.gift = { id: e.id, t };
   }
 }
 
@@ -302,4 +312,42 @@ export function catAt(scene, t, time) {
   return { pose: 'sleep', frame: frameOf(time / CAT_BREATH, 2), x: hx, y: hy, dir: -1 };
 }
 
-export { TRAIL_LIFE, LOOP_TRAIL_LIFE, FLIGHT, GOLD, TRAIN_LENGTH, PIGEON_FLY, PIGEON_WALK, CAT_RUN, CAT_WALK };
+// One Tree Island. Its sky's stage for each band at `bar`, as the park's (skyStages) but horizon first:
+// the sunrise lightens from the horizon up, from before dawn (0) to morning (4).
+export const sunriseStages = (bar) => skyStages(bar).reverse();
+
+// How far the sun has come up, in pixels, `bars` (a fraction is fine) into the set: still behind the
+// far pines until ISLAND.sunFrom, then rising to ISLAND.sunRise by ISLAND.sunTo.
+export function sunUp(bars) {
+  const k = (bars - ISLAND.sunFrom) / (ISLAND.sunTo - ISLAND.sunFrom);
+  return Math.round(ISLAND.sunRise * Math.min(1, Math.max(0, k)));
+}
+
+// How many of the mist's streaks are still on the water at `bars`: all ISLAND.mist of them at the
+// start, one fewer at a time, none from ISLAND.mistGone.
+export const mistLeft = (bars) => Math.max(0, ISLAND.mist - Math.floor((Math.max(0, bars) / ISLAND.mistGone) * ISLAND.mist));
+
+// The island's fish at set time t: null while it's under, or jumping out of the water at a loud note
+// (the pigeons' scaredAt), { pose: 'jump', frame (0 going up, 1 coming down), x, y }, then its splash,
+// { pose: 'splash', frame, x, y }. It jumps from ISLAND.fish.
+export function fishAt(scene, t) {
+  if (scene.scaredAt === null) return null;
+  const since = t - scene.scaredAt, [x, y] = ISLAND.fish;
+  if (since < 0) return null;
+  if (since < FISH_JUMP) {
+    const k = since / FISH_JUMP;
+    return { pose: 'jump', frame: k < 0.5 ? 0 : 1, x: Math.round(x + FISH_ON * k), y: Math.round(y - FISH_HIGH * 4 * k * (1 - k)) };
+  }
+  if (since < FISH_JUMP + SPLASH) return { pose: 'splash', frame: since < FISH_JUMP + SPLASH / 2 ? 0 : 1, x: x + FISH_ON, y };
+  return null;
+}
+
+// The keepsake an animal left, at set time t: null if none, or { id, x, y, landed, sparkle }: dropping
+// from above into the case (CASE), then lying there, its sparkle on frame 0 or 1 by the page's `time`.
+export function giftAt(scene, t, time) {
+  if (!scene.gift) return null;
+  const k = Math.min(1, Math.max(0, (t - scene.gift.t) / GIFT_FALL));
+  return { id: scene.gift.id, x: CASE[0], y: Math.round(CASE[1] - GIFT_FROM * (1 - k * k)), landed: k === 1, sparkle: frameOf(time / SPARKLE, 2) };
+}
+
+export { TRAIL_LIFE, LOOP_TRAIL_LIFE, FLIGHT, GOLD, TRAIN_LENGTH, PIGEON_FLY, PIGEON_WALK, CAT_RUN, CAT_WALK, FISH_JUMP, SPLASH, GIFT_FALL };
````

- [ ] **Step 4: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 469 tests.

- [ ] **Step 5: Commit**

```bash
git add open-case/src/scene.js open-case/src/tuning.js open-case/test/scene.test.js
git commit -m "Open Case: the island's sunrise, worked out: the sky lightens from the horizon up, the sun comes up, the mist lifts, a loud note makes a fish jump, and a keepsake drops into the case

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: The island and its animals in the sprite sheet

**Files:**
- Create: `art/open-case/island.lua`, `art/open-case/animals.lua`
- Modify: `art/open-case/palette.lua`, `art/open-case/sprites.lua`
- Rebuild: `open-case/assets/sprites.png`, `open-case/assets/sprites.json`
- Test: `open-case/test/art.test.js`

**Interfaces:**
- Consumes: `draw.lua`'s helpers (`D.rect`, `D.oval`, `D.stamp`, `D.PX`, `D.mirror`, `D.sun`); `ISLAND`, `ANIMALS`, `ANIMAL_IDS` (Task 1) in the tests.
- Produces, in the sheet:
  - frames `island-shore-0`..`4`, `island-water-0`..`4` (each stage), `island-mist-0`..`3`, `island-land`, `island-pine`, `island-trunk` (all anchored at the screen's top left);
  - `fish-jump-0`/`1`, `fish-splash-0`/`1` (anchored at the fish's middle);
  - for every animal, `<id>-<cross | sit | beat>-<0 | 1>-<left | right>` (anchored at its feet, or a swimmer's waterline).
- Produces, in `sprites.json`: `sunrise` (5 stages × 7 bands) and `island` (`{ sun: [x, y], trunk, glints: [[x, y], ...], sunGlints }`).
- Produces, in `palette.lua`: `morning` (3), `lake` (2), `mist`.

- [ ] **Step 1: Write the failing tests**

Apply to `open-case/test/art.test.js`:

````diff
diff --git a/open-case/test/art.test.js b/open-case/test/art.test.js
index e37916f..e0a9fa3 100644
--- a/open-case/test/art.test.js
+++ b/open-case/test/art.test.js
@@ -7,7 +7,8 @@ import assert from 'node:assert/strict';
 import { readFileSync, statSync } from 'node:fs';
 import { readPng } from './png.js';
 import { KINDS, LOOKS, PATH_Y } from '../src/crowd.js';
-import { CROWD } from '../src/tuning.js';
+import { CROWD, ISLAND } from '../src/tuning.js';
+import { ANIMALS, ANIMAL_IDS } from '../src/animals.js';
 import { CASE } from '../src/scene.js';
 import { STOCK, PEDALS, INSTRUMENTS } from '../src/gear.js';
 import { CARD } from '../src/shop.js';
@@ -41,6 +42,10 @@ const FAMILIES = [
   ['market-skyline', 1], ['market-stalls', 1], [/^market-steam-\d$/, 2], ['market-strings', 1], ['market-street', 1],
   ['lantern-off', 1], [/^lantern-\d$/, 3],
   ...['sleep', 'walk', 'run'].flatMap((p) => ['left', 'right'].map((d) => [new RegExp(`^cat-${p}-\\d-${d}$`), 2])),
+  // One Tree Island, and its animals
+  [/^island-shore-\d$/, 5], [/^island-water-\d$/, 5], [/^island-mist-\d$/, 4], ['island-land', 1], ['island-pine', 1], ['island-trunk', 1],
+  [/^fish-jump-\d$/, 2], [/^fish-splash-\d$/, 2],
+  ...ANIMAL_IDS.flatMap((id) => ['cross', 'sit', 'beat'].flatMap((p) => ['left', 'right'].map((d) => [new RegExp(`^${id}-${p}-\\d-${d}$`), 2]))),
 ];
 
 test('every frame the game draws is there, as many of each as the spec says, and nothing else', () => {
@@ -222,3 +227,52 @@ test("the shop window's view stays inside its frame: the wall beside it is plain
     for (const x of [56, 57]) assert.equal(colourAt('shop-room', x, y), colourAt('shop-room', 54, y), `wall at ${x},${y}`);
   }
 });
+
+test("One Tree Island's sunrise: five stages of seven bands, the sun hidden under the far shore until it comes up, and the glints on the water", () => {
+  assert.equal(data.sunrise.length, 5);
+  for (const stage of data.sunrise) assert.equal(stage.length, 7);
+  const [, waterTop] = cover('island-water-0', 0, 0), [sx, sy] = data.island.sun, [, sunTop] = cover('sun', sx, sy);
+  assert.ok(sunTop >= waterTop, `the sun's top (${sunTop}) is under the lake's far edge (${waterTop})`);
+  assert.ok(sunTop - ISLAND.sunRise < waterTop - 10, 'and it comes up well clear of it');
+  assert.ok(data.island.glints.length > data.island.sunGlints && data.island.sunGlints > 0);
+  for (const [x, y] of data.island.glints) assert.ok(x >= 0 && x < 320 && y > waterTop && y < 180, `glint ${x}, ${y}`);
+  for (const [x] of data.island.glints.slice(0, data.island.sunGlints)) assert.ok(Math.abs(x - sx) <= 4, 'the sun\'s glints lie under it');
+});
+
+test("the island's land runs right across the screen, the swimmers cross open water behind it, and each animal settles where its sort of spot says", () => {
+  const [, waterTop] = cover('island-water-0', 0, 0), { land, water, sky } = ISLAND.lanes;
+  const grass = new Set(['69,128,110', '46,93,92']); // the island's grass: the palette's two lighter leaf greens (palette.lua)
+  for (let x = 0; x < 320; x++) {
+    assert.ok(opaqueAt('island-land', 0, 0, x, land) && opaqueAt('island-land', 0, 0, x, land - 3), `the land animals walk on the island at ${x}`);
+    assert.ok(!opaqueAt('island-land', 0, 0, x, water + 1), `the swimmers are out on the lake at ${x}, behind everything on its shore`);
+  }
+  assert.ok(water > waterTop + 10 && water < land - 15, 'on the lake, well behind the land animals');
+  assert.ok(sky < waterTop - 30, 'the birds fly high');
+  for (const [x, y, sort] of ISLAND.spots) {
+    const under = [1, 2, 3].map((d) => colourAt('island-land', x, y + d));
+    if (sort === 'pine') assert.ok([1, 2, 3].some((d) => opaqueAt('island-pine', 0, 0, x, y + d)), `a branch under ${x}, ${y}`);
+    else if (sort === 'grass') assert.ok(grass.has(colourAt('island-land', x, y)), `grass at ${x}, ${y}`);
+    else if (sort === 'shallows') assert.ok(!opaqueAt('island-land', 0, 0, x, y), `water at ${x}, ${y}`);
+    else assert.ok(under.some((c) => c !== null), `the ${sort} under ${x}, ${y}`);
+  }
+});
+
+test('every animal fits on screen at each spot of its sort, and on the grass stands clear of the case', () => {
+  for (const id of ANIMAL_IDS) {
+    for (const [sx, sy, sort] of ISLAND.spots.filter(([, , s]) => ANIMALS[id].spots.includes(s))) {
+      const name = `${id}-sit-0-${sx < CROWD.playerX ? 'right' : 'left'}`, [pl, pt, pr, pb] = cover(name, sx, sy);
+      assert.ok(pl >= 0 && pt >= 0 && pr <= 320 && pb <= 180, `${id} at ${sx},${sy} fits on screen`);
+      if (sort !== 'grass') continue;
+      for (let y = pt; y < pb; y++) {
+        for (let x = pl; x < pr; x++) assert.ok(!(opaqueAt(name, sx, sy, x, y) && opaqueAt('case', 0, 0, x, y)), `${id} at ${sx},${sy} clear of the case`);
+      }
+    }
+  }
+});
+
+test('each animal is its own, and smaller than a person: its frames are no taller than 20 rows over its feet', () => {
+  for (const id of ANIMAL_IDS) {
+    for (const name of names.filter((n) => n.startsWith(`${id}-`))) assert.ok(data.frames[name][5] <= 20, `${name} reaches ${data.frames[name][5]} rows`);
+    for (const other of ANIMAL_IDS) if (id < other) assert.ok(differ(`${id}-sit-0-left`, `${other}-sit-0-left`) >= 30, `${id} and ${other}`);
+  }
+});
````

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL. Five art tests fail, as the sheet has no island yet:
- "every frame the game draws is there…";
- "One Tree Island's sunrise…";
- "the island's land runs right across the screen…";
- "every animal fits on screen…";
- "each animal is its own…".

The other 468 tests pass.

- [ ] **Step 3: The island's art**

Apply to `art/open-case/palette.lua`:

````diff
diff --git a/art/open-case/palette.lua b/art/open-case/palette.lua
index 6630938..8f3b627 100644
--- a/art/open-case/palette.lua
+++ b/art/open-case/palette.lua
@@ -28,4 +28,7 @@ return {
   go = "#6ed89a", -- the loop pedal playing, a listener's nod of recognition
   stone = { "#958873", "#bdb097", "#c9bca3" }, -- the station's platform: its joints, its slabs, every other slab
   brick = { "#6a3426", "#a4573c", "#c27a50" }, -- the night market's street: its joints, its bricks, bricks in the lanterns' light
+  morning = { "#5b8fd4", "#8cb8e8", "#c2dcef" }, -- One Tree Island's sky once the sun's up, top -> horizon
+  lake = { "#22466e", "#336592" }, -- the island's lake in the morning: its water and its ripples
+  mist = "#a49ec4", -- the dawn mist on the lake, and the ripples round what floats on it
 }
````

Create `art/open-case/island.lua`:

````lua
-- One Tree Island at sunrise in the flat style, for the sprite sheet (sprites.lua), in layers drawn back
-- to front over the sky (render.js draws the sky's bands, the sun, and the glints on the water):
--   the far shore's pines, in each stage of the sunrise's colours;
--   the lake, from the far shore down, in each stage's colours, the horizon's colour along its far edge;
--   the dawn mist, a streak at a time (render.js leaves them off one by one as it lifts);
--   the fish that jumps at a loud note, and its splash;
--   the island: its grass running across the screen and on out of it either side, its sandy shore,
--     the reeds, the rock and the lily pads in the water just off it, and the rowboat pulled up on it;
--   the one pine: its branches over your head, and its trunk, which render.js draws among the figures
--     so the animals passing behind it pass behind it.
-- Everything is laid out round the park's positions: you on your crate, the case at your feet, and
-- the land animals walking along the island at y 146, as people walk the park's path, the swimmers
-- out on the lake behind its shore. They settle on tuning.js ISLAND.spots: three on the pine's branches, four on the
-- grass round you, two in the shallows, one on the rock and one on the lily pad.
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local D = dofile(here .. "draw.lua")
local L, C, rect, oval, stamp = D.L, D.C, D.rect, D.oval, D.stamp
local W, H = D.W, D.H
local set = L.set
local I = {}

I.SHORE = 100 -- the lake's far edge: the far shore's pines stand on it
I.SUN = { 66, 120 } -- the sun's middle before it comes up, hidden by the lake (scene.js sunUp lifts it)
I.TRUNK_FEET = 147 -- the row the pine's trunk stands on, to sort it among the figures
I.ROCK = { 290, 136 } -- the turtle's rock, in the water off the shore: its middle
I.LILY = { 22, 137 } -- the frog's lily pad: its middle

-- The sunrise's five stages, before dawn to morning: each its seven bands' colours, top to horizon.
-- The dusk's colours, then the morning's blues.
function I.stages()
  local s, n, m = C.sky, C.night, C.morning
  return {
    { n[3], n[3], n[2], n[2], n[1], s[1], s[2] },
    { n[2], n[1], s[1], s[2], s[3], s[4], s[5] },
    { n[1], s[2], s[3], s[4], s[5], s[6], s[7] },
    { m[1], m[2], s[4], s[5], s[6], s[7], s[7] },
    { m[1], m[1], m[2], m[2], m[3], m[3], s[7] },
  }
end

-- Each stage's far pines (the back row, then the front) and its lake (the water, then its ripples).
local SHORE_COLOURS = {
  { C.night[2], C.night[3] }, { C.night[1], C.night[2] }, { C.sky[2], C.night[1] }, { C.coat[1], C.leaf[1] }, { C.leaf[2], C.leaf[1] },
}
local LAKE_COLOURS = {
  { C.night[2], C.night[1] }, { C.night[1], C.sky[2] }, { C.sky[2], C.sky[4] }, { C.lake[1], C.lake[2] }, { C.lake[2], C.morning[2] },
}

-- A far pine: a narrow stepped spire from its top down to the shore, `w` across at its foot.
local function farPine(b, cx, top, w, c)
  for y = top, I.SHORE - 1 do
    local hw = math.floor((y - top) / (I.SHORE - top) * w / 2 + 0.5)
    if (y - top) % 4 == 3 then hw = hw + 1 end -- the boughs, a pixel wider every few rows
    rect(b, cx - hw, y, cx + hw, y, c)
  end
end

-- The far shore's pines in one stage's colours: a back row, low and close together, and in front of
-- it a row of taller ones here and there.
function I.shore(b, stage)
  local back, front = SHORE_COLOURS[stage][1], SHORE_COLOURS[stage][2]
  rect(b, 0, I.SHORE - 3, W - 1, I.SHORE - 1, back)
  for x = -4, W + 4, 5 do farPine(b, x + math.floor(L.rnd(x, 1, 31) * 3), 86 + math.floor(L.rnd(x, 2, 31) * 7), 6, back) end
  for x = 2, W + 4, 13 do
    if L.rnd(x, 3, 31) < 0.7 then farPine(b, x + math.floor(L.rnd(x, 4, 31) * 6), 78 + math.floor(L.rnd(x, 5, 31) * 10), 8, front) end
  end
  rect(b, 0, I.SHORE - 1, W - 1, I.SHORE - 1, front)
end

-- The lake in one stage's colours, from the far shore to the bottom of the screen: the water, the
-- horizon's colour caught along its far edge, and ripples, short and sparse far off and longer near.
function I.water(b, stage, horizon)
  local water, ripple = LAKE_COLOURS[stage][1], LAKE_COLOURS[stage][2]
  rect(b, 0, I.SHORE, W - 1, H - 1, water)
  for x = 0, W - 1 do
    if L.rnd(x, 7, 33) < 0.75 then set(b, x, I.SHORE, horizon) end
    if L.rnd(x, 8, 33) < 0.35 then set(b, x, I.SHORE + 1, horizon) end
  end
  for y = I.SHORE + 3, H - 1, 3 do
    local near = (y - I.SHORE) / (H - I.SHORE)
    for x = 0, W - 1, 4 do
      if L.rnd(x, y, 35) < 0.12 + near * 0.1 then
        local len = 2 + math.floor(near * 6 + L.rnd(x, y, 36) * 3)
        rect(b, x, y, x + len - 1, y, ripple)
      end
    end
  end
end

-- The dawn mist: four long streaks over the water, each in wisps, the farthest first; render.js draws
-- as many as are left (scene.js mistLeft), so the nearest lift first. Each wisp { x0, x1, y }.
local MIST = {
  { { 4, 64, 104 }, { 76, 158, 105 } },
  { { 150, 236, 109 }, { 246, 316, 108 } },
  { { 22, 120, 115 }, { 132, 214, 116 } },
  { { 190, 262, 122 }, { 272, 318, 121 } },
}
function I.mist(b, i)
  for _, m in ipairs(MIST[i]) do
    rect(b, m[1] + 4, m[3], m[2] - 6, m[3], C.mist)
    rect(b, m[1], m[3] + 1, m[2], m[3] + 1, C.mist)
  end
end
I.MISTS = #MIST

-- The fish, silver, leaping to the right, at (x, y) (its middle): 'jump', frame 0 rising (its nose up)
-- or 1 falling (its nose down); or its 'splash' on the water at (x, y), frame 0 a burst and 1 a ring.
function I.fish(b, pose, frame, x, y)
  if pose == "jump" then
    stamp(b, x - 3, y - 2, frame == 0 and { "....cc", "...cck", "..cwc.", ".cCc..", "Cc...." } or { "Cc....", ".cCc..", "..cwc.", "...cck", "....cc" })
  elseif frame == 0 then
    stamp(b, x - 3, y - 4, { "w....w", ".w..w.", "w.ww.w", ".wwww." })
  else
    stamp(b, x - 4, y - 1, { "..wwww..", "ww....ww" })
  end
end

-- The island's shore: the row its ground starts on at x. It runs right across the screen and on out of
-- it either side, gently uneven, a pixel higher behind your crate.
local function shore(x)
  return 139 + math.floor(1.6 * math.sin(x / 21) + math.sin(x / 8 + 1) + 0.5) - (math.abs(x - 140) < 40 and 1 or 0)
end
local function ground(x, y) return y >= shore(x) and y < H end

-- The island in front of the lake: its wet edge and its sand along the shore, then the grass, with
-- tufts, a few flowers and pebbles; the reeds and the lily pads in the water just off it, the frog's
-- with a flower beside it; the turtle's rock; and the rowboat pulled up on the shore to the right, its
-- rope tied to a stake.
function I.land(b)
  for y = 130, H - 1 do
    for x = 0, W - 1 do
      if ground(x, y) then
        local d = y - shore(x) -- rows in from the water's edge
        if d == 0 then b[y][x] = C.path[2]
        elseif d == 1 or (d == 2 and L.rnd(x, y, 42) < 0.6) then b[y][x] = C.path[3]
        else b[y][x] = (L.rnd(x, y, 41) < 0.08) and C.leaf[2] or C.leaf[3] end
      end
    end
  end
  for x = 3, W - 3, 6 do -- tufts of taller grass, a few flowers, and pebbles on the sand
    local y = shore(x) + 6 + math.floor(L.rnd(x, 1, 43) * 30)
    set(b, x, y, C.leaf[2]); set(b, x + 1, y - 1, C.leaf[2]); set(b, x + 2, y, C.leaf[2])
    if L.rnd(x, 2, 43) < 0.4 then set(b, x + 1, y - 2, ({ C.light, C.yellow[2], C.rose[2] })[1 + math.floor(L.rnd(x, 3, 43) * 3)]) end
    if L.rnd(x, 4, 43) < 0.25 then rect(b, x + 4, shore(x + 4) + 1, x + 5, shore(x + 4) + 1, C.coat[1]) end
  end
  -- the reeds, by the shallows, standing in the water at the shore
  for _, r in ipairs({ { 40, 0 }, { 202, 0 } }) do
    for k = 0, 4 do
      local x = r[1] + k * 2 - 4
      local foot, h = shore(x) - 1, 4 + math.floor(L.rnd(r[1], k, 45) * 5)
      rect(b, x, foot - h, x, foot, C.leaf[2])
      if k % 2 == 0 then rect(b, x, foot - h - 2, x, foot - h, C.wood[2]) end -- a bulrush's head
    end
  end
  -- the rock, grey, its top lit, a ripple round its foot
  local rx, ry = I.ROCK[1], I.ROCK[2]
  oval(b, rx + 0.5, ry + 0.5, 8, 3.5, C.coat[1])
  oval(b, rx - 0.5, ry - 1, 6, 2, C.coat[2])
  rect(b, rx - 11, ry + 3, rx - 7, ry + 3, C.mist); rect(b, rx + 7, ry + 3, rx + 11, ry + 3, C.mist)
  -- the lily pads: the frog's, with a notch, and two small ones; a pink flower beside the frog's
  local function pad(cx, cy, rx2, ry2)
    oval(b, cx + 0.5, cy + 0.5, rx2, ry2, C.leaf[2])
    oval(b, cx + 0.5, cy, rx2 - 1, ry2 - 1, C.leaf[3])
    set(b, cx + 1, cy, nil); set(b, cx + 2, cy - 1, nil); set(b, cx + 1, cy - 1, nil)
  end
  pad(I.LILY[1], I.LILY[2], 6, 2)
  pad(6, 132, 3, 1.5)
  pad(76, 131, 3, 1.5)
  stamp(b, I.LILY[1] + 6, I.LILY[2] - 4, { ".f.", "fwf", "eFe" })
  -- the rowboat, pulled up on the shore to the right, its stern in the water, an oar across it, its
  -- rope to a stake in the grass
  stamp(b, 229, 140, { "kk", "DD", "DD", "DD" })
  for x = 231, 237 do set(b, x, 140 - (x - 231) // 3, C.wood[1]) end
  stamp(b, 236, 134, {
    "....ggggggggggggggggggggggg...",
    "..gGDDDDDDDDDGDDDDDDDDDDDDGgg.",
    ".ggGDDDDDDDDDGDDDDDDDDDDDDGggg",
    "..GGGGGGGGGGGGGGGGGGGGGGGGGGg.",
    "...GGGGGGGGGGGGGGGGGGGGGGGGG..",
    ".....GGGGGGGGGGGGGGGGGGGGG....",
  })
  rect(b, 238, 133, 260, 133, C.wood[3]) -- the oar
  rect(b, 260, 132, 264, 134, C.wood[3])
  rect(b, 262, 137, 270, 137, C.mist) -- a ripple off its stern
end

-- The pine's branches, in tiers over your head: dark teal, lit on their upper left where the sun comes
-- from, each tier's lower edge drooping at its tips. { top, bottom, half width } from the top down.
local TIERS = { { 14, 32, 9 }, { 26, 48, 17 }, { 40, 64, 25 }, { 56, 80, 33 }, { 72, 96, 42 } }
local PINE_X = 160 -- the pine's middle
function I.pine(b)
  for _, t in ipairs(TIERS) do
    local t0, t1, hw = t[1], t[2], t[3]
    for y = t0, t1 do
      local k = (y - t0 + 1) / (t1 - t0 + 1)
      local half = math.floor(hw * k ^ 0.7 + 0.5)
      for x = PINE_X - half, PINE_X + half do
        local u = math.abs(x - PINE_X) / math.max(1, hw)
        -- the lower edge droops toward the tips: the middle ends a few rows short of the bottom
        if y <= t1 - math.floor((1 - u) * 4) then
          local lit = x < PINE_X and (y - t0) < (PINE_X - x) * 0.9 + 2
          b[y][x] = lit and C.leaf[2] or C.leaf[1]
          if lit and (y - t0) < 2 and L.rnd(x, y, 47) < 0.5 then b[y][x] = C.leaf[3] end
        end
      end
    end
  end
  set(b, PINE_X, 12, C.leaf[1]); set(b, PINE_X, 13, C.leaf[2])
end

-- The pine's trunk, from under its lowest branches down into the island, its roots spread on the grass.
function I.trunk(b)
  rect(b, PINE_X - 2, 90, PINE_X + 1, I.TRUNK_FEET, C.wood[1])
  rect(b, PINE_X - 2, 90, PINE_X - 2, I.TRUNK_FEET, C.wood[2])
  rect(b, PINE_X - 4, I.TRUNK_FEET - 1, PINE_X + 3, I.TRUNK_FEET, C.wood[1])
  set(b, PINE_X - 5, I.TRUNK_FEET, C.wood[1]); set(b, PINE_X + 4, I.TRUNK_FEET, C.wood[1])
end

-- Where the water glints, [{ x, y }]: render.js lights them by turns. The first few lie in a column
-- under the sun, its reflection, which shows once the sun's up.
function I.glints()
  local out = {}
  for i = 0, 7 do out[#out + 1] = { I.SUN[1] - 3 + math.floor(L.rnd(i, 1, 49) * 7), I.SHORE + 3 + i * 4 } end
  for i = 0, 13 do out[#out + 1] = { math.floor(L.rnd(i, 2, 49) * W), I.SHORE + 6 + math.floor(L.rnd(i, 3, 49) * 26) } end
  return out
end
I.SUN_GLINTS = 8 -- the first this many glints are the sun's reflection

return I
````

Create `art/open-case/animals.lua`:

````lua
-- The animals of One Tree Island in the flat style, for the sprite sheet (sprites.lua). Each is drawn
-- facing left, its feet (or for a swimmer, the waterline) at (x, y), and the sheet mirrors it to face
-- right. Each has three poses, two frames each:
--   cross  coming by: the land animals walk or hop along the island, the swimmers swim or wade just off
--          its shore, and the birds fly
--   sit    settled on its spot, breathing (frame 1 a breath)
--   beat   keeping the beat once it's hooked: frame 0 is its sit, and frame 1 its move on the beat (the
--          frog bobs, the fox's tail sways, the ducks bob, the bunny's ears twitch, the heron dips its
--          head, the owl blinks, and the rest have a little move of their own)
-- They're drawn with the palette's pixel-map letters (draw.lua), and "~" for the mist-pale ripple
-- round a swimmer.
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local D = dofile(here .. "draw.lua")
local L, C = D.L, D.C
local A = {}

A.IDS = { "bunny", "ducks", "squirrel", "heron", "turtle", "deer", "fox", "frog", "hedgehog", "crow", "owl" }

local INK = setmetatable({ ["~"] = C.mist }, { __index = D.PX })
local function stamp(b, ox, oy, rows)
  for j, row in ipairs(rows) do
    for i = 1, #row do
      local ch = row:sub(i, i)
      if ch ~= "." then L.set(b, ox + i - 1, oy + j - 1, assert(INK[ch], "no colour for " .. ch)) end
    end
  end
end

-- The map with its top n rows moved down a pixel, over the row below them: a breath, or a nod.
local function lower(rows, n)
  local out = {}
  for i, r in ipairs(rows) do out[i] = i <= n and ("."):rep(#r) or r end
  for i = n, 1, -1 do
    local under, over = out[i + 1], rows[i]
    out[i + 1] = under:gsub("()(.)", function(k, ch) local c = over:sub(k, k); return c ~= "." and c or ch end)
  end
  return out
end

-- Each animal's maps: sit, its breath (sit1; by default its top `head` rows lowered a pixel), its move
-- on the beat (beat), and its two crossing frames (cross).
local M = {}

M.bunny = {
  head = 6,
  sit = {
    "..w.w......",
    ".wf.wf.....",
    ".wf.wf.....",
    ".ww.ww.....",
    ".wwwww.....",
    "wkwwwwc....",
    "fwwwwwwww..",
    ".cwwwwwwwww",
    "..wwwwwwwcw",
    "..cwwwwwcww",
    "...cc..cc..",
  },
  beat = {
    "...........",
    ".wf.ww.....",
    ".wf..wf....",
    ".ww...ww...",
    ".wwwww.....",
    "wkwwwwc....",
    "fwwwwwwww..",
    ".cwwwwwwwww",
    "..wwwwwwwcw",
    "..cwwwwwcww",
    "...cc..cc..",
  },
  cross = { -- hopping: crouched, then stretched out in the air
    {
      "..w.w......",
      ".wf.wf.....",
      ".wf.wf.....",
      ".ww.ww.....",
      ".wwwww.....",
      "wkwwwwc....",
      "fwwwwwwww..",
      ".cwwwwwwwww",
      "..wwwwwwwcw",
      "..cwwwwwcww",
      "...cc..cc..",
    },
    {
      "..ww........",
      ".wfwf.......",
      "..wfwf......",
      "..wwww......",
      ".wkwwwwwww..",
      "fwwwwwwwwwww",
      "..cwwwwwwccc",
      "........cc..",
      "............",
      "............",
      "............",
    },
  },
}

M.ducks = { -- the mother and her three ducklings in a row behind her
  head = 0,
  sit = {
    ".BB.........................",
    "BBkB........................",
    "YBBB.........yy......yy.....",
    "..BbbbbbB...ykyy....ykyy....",
    "..bbbbBBbb..Yyyyyy..Yyyyyy..",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  },
  beat = {
    "............................",
    ".BB..........yy.............",
    "BBkB........ykyy.....yy.....",
    "YBbbbbbbB...Yyyyyy..ykyy....",
    "..bbbbBBbb..........Yyyyyy..",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  },
  cross = {
    {
      ".BB.........................",
      "BBkB........................",
      "YBBB.........yy......yy.....",
      "..BbbbbbB...ykyy....ykyy....",
      "..bbbbBBbb..Yyyyyy..Yyyyyy..",
      ".~~~~~~~~~~..~~~~~~..~~~~~~~",
    },
    {
      ".BB.........................",
      "BBkB........................",
      "YBBB.........yy......yy.....",
      "..BbbbbbB...ykyy....ykyy....",
      "..bbbbBBbb..Yyyyyy..Yyyyyy..",
      "~~~~~~~~~~~~.~~~~~~~.~~~~~~.",
    },
  },
}

M.squirrel = {
  head = 4,
  sit = {
    "........xx.",
    ".x.....xxxx",
    "xxx...xxGxx",
    "kxxx..xG.xx",
    "xxxx..xG..x",
    ".xxxx.xG...",
    "..xwxxxG...",
    "..xwxxGG...",
    "..xxxxG....",
    "...G.G.....",
  },
  beat = { -- its tail flicks up
    ".......xx..",
    ".x....xxxx.",
    "xxx...xGxxx",
    "kxxx..xGx.x",
    "xxxx..xG...",
    ".xxxx.xG...",
    "..xwxxxG...",
    "..xwxxGG...",
    "..xxxxG....",
    "...G.G.....",
  },
  cross = { -- hopping, its tail up behind
    {
      "........xx.",
      ".x.....xxxx",
      "xxx...xxGxx",
      "kxxx..xG.xx",
      "xxxx..xG..x",
      ".xxxx.xG...",
      "..xwxxxG...",
      "..xwxxGG...",
      "..xxxxG....",
      "...G.G.....",
    },
    {
      "...........xx",
      "..x......xxxx",
      ".xxx....xxGx.",
      "kxxxxxxxxG...",
      "xxxxxxxxxG...",
      "..xwxxxxG....",
      "..G....GG....",
      ".............",
      ".............",
      ".............",
    },
  },
}

M.heron = {
  head = 7,
  sit = {
    "...kkk...",
    "..ccw....",
    "Yyccwk...",
    "...cw....",
    "...cw....",
    "....cw...",
    "....cww..",
    "...ccccC.",
    "..cccccCC",
    "..wcccCCC",
    "...wccCC.",
    "....cCC..",
    ".....h.h.",
    ".....h.h.",
    ".....h.h.",
    ".....h.h.",
    "...~~~~~~",
  },
  beat = { -- it dips its head
    ".........",
    ".........",
    ".........",
    "...kkk...",
    "..ccw....",
    "Yyccwk...",
    "....cww..",
    "...ccccC.",
    "..cccccCC",
    "..wcccCCC",
    "...wccCC.",
    "....cCC..",
    ".....h.h.",
    ".....h.h.",
    ".....h.h.",
    ".....h.h.",
    "...~~~~~~",
  },
  cross = {
    {
      "..kkk.....",
      ".ccw......",
      "Yccwk.....",
      "..cw......",
      "...cw.....",
      "...cww....",
      "..ccccC...",
      ".cccccCCC.",
      ".wcccCCCC.",
      "..wccCCC..",
      "...cCC....",
      "...h..h...",
      "..h....h..",
      ".h......h.",
      ".h......h.",
      "~~~~..~~~~",
    },
    {
      "..kkk.....",
      ".ccw......",
      "Yccwk.....",
      "..cw......",
      "...cw.....",
      "...cww....",
      "..ccccC...",
      ".cccccCCC.",
      ".wcccCCCC.",
      "..wccCCC..",
      "...cCC....",
      "....hh....",
      "....h.h...",
      "....h.h...",
      "....h.h...",
      "..~~~~~~..",
    },
  },
}

M.turtle = { -- a brown shell, green skin
  head = 0,
  sit = {
    "....gGgGg.....",
    "...gGgGgGgG...",
    "..GgGgGgGgGg..",
    "lkDDDDDDDDDDD.",
    "lll.ll....ll.l",
  },
  sit1 = {
    "....gGgGg.....",
    "...gGgGgGgG...",
    "..GgGgGgGgGg..",
    ".kDDDDDDDDDDD.",
    "lll.ll....ll.l",
  },
  beat = { -- its head bobs out
    "....gGgGg.....",
    "ll.gGgGgGgG...",
    "lkGgGgGgGgGg..",
    ".lDDDDDDDDDDD.",
    "..l.ll....ll.l",
  },
  cross = {
    { "....gGgGg.....", "ll.gGgGgGgG...", "lkGgGgGgGgGg..", "~ll~~~~~~~~l~~" },
    { "....gGgGg.....", "ll.gGgGgGgG...", "lkGgGgGgGgGgl.", "~~~l~~~~~~~~~~" },
  },
}

M.deer = {
  head = 8,
  sit = {
    "G...G.........",
    ".G.G..........",
    "..GG..........",
    ".gggg.........",
    "ggkgg.........",
    "kggggg........",
    "..ggg.........",
    "..gggggggggg..",
    "..gwgggggggGgw",
    "...gwgggggGGG.",
    "...gggggggGGG.",
    "...G.G...G.G..",
    "...G.G...G.G..",
    "...D.D...D.D..",
  },
  beat = { -- an ear flicks back
    "G...G.........",
    ".G.G..........",
    "..GG..........",
    ".gggg.g.......",
    "ggkggg........",
    "kggggg........",
    "..ggg.........",
    "..gggggggggg..",
    "..gwgggggggGgw",
    "...gwgggggGGG.",
    "...gggggggGGG.",
    "...G.G...G.G..",
    "...G.G...G.G..",
    "...D.D...D.D..",
  },
  cross = { -- walking
    {
      "G...G.........",
      ".G.G..........",
      "..GG..........",
      ".gggg.........",
      "ggkgg.........",
      "kggggg........",
      "..ggg.........",
      "..gggggggggg..",
      "..gwgggggggGgw",
      "...gwgggggGGG.",
      "...gggggggGGG.",
      "...G.G...G.G..",
      "..G...G.G...G.",
      "..D...D.D...D.",
    },
    {
      "G...G.........",
      ".G.G..........",
      "..GG..........",
      ".gggg.........",
      "ggkgg.........",
      "kggggg........",
      "..ggg.........",
      "..gggggggggg..",
      "..gwgggggggGgw",
      "...gwgggggGGG.",
      "...gggggggGGG.",
      "...G.G...G.G..",
      "....GG....GG..",
      "....DD....DD..",
    },
  },
}

M.fox = {
  head = 6,
  sit = {
    ".O.O..........",
    ".OOO..........",
    "OkOOO.........",
    "wOOOO.........",
    "kwwO..........",
    "..OOO.........",
    "..OwOO....xx..",
    "..OwOOO..xOOx.",
    "..OwOOOO.xOOx.",
    "..OOOOOOOxOx..",
    "..k.OOOOOxx...",
    "..k.kxxxwww...",
  },
  beat = { -- its tail sways the other way
    ".O.O..........",
    ".OOO..........",
    "OkOOO.........",
    "wOOOO.........",
    "kwwO..........",
    "..OOO.........",
    "..OwOO........",
    "..OwOOO.......",
    "..OwOOOO......",
    "..OOOOOOOxx...",
    "..k.OOOOxOOxx.",
    "..k.kxxxxOOww.",
  },
  cross = { -- trotting, its tail out behind
    {
      "..O.O.............",
      "..OOO.............",
      ".OkOO.............",
      "wOOOOOOOOOOOOx....",
      ".kwwOOOOOOOOOOxxx.",
      "...wwOOOOOOOOxOOOx",
      "...k..k...k..k.Oww",
      "..k....k.k....k...",
    },
    {
      "..O.O.............",
      "..OOO.............",
      ".OkOO.............",
      "wOOOOOOOOOOOOx....",
      ".kwwOOOOOOOOOOxxx.",
      "...wwOOOOOOOOxOOOx",
      "....k.k....k.k.Oww",
      "....k.k....k.k....",
    },
  },
}

M.frog = {
  head = 0,
  sit = {
    ".oo.oo..",
    "okoookoo",
    "ooooooool",
    "lowwwolll",
    "ll.ll.ll.",
  },
  sit1 = {
    ".oo.oo..",
    "okoookoo",
    "ooooooool",
    "lowwwwoll",
    "ll.ll.ll.",
  },
  beat = { -- it bobs
    ".........",
    ".oo.oo..",
    "okoookoo",
    "ooooooool",
    "llwwwolll",
  },
  cross = { -- on a lily pad, then leaping to the next
    { "..........", ".oo.oo....", "okoookoo..", "ooooooool.", "lowwwolll.", "eelllllee.", "~~~....~~~" },
    { "oo.oo.....", "kooookoo..", "ooooooooll", ".owwwool.l", "l.......l.", "..........", "..~~~~~~.." },
  },
}

M.hedgehog = {
  head = 0,
  sit = {
    "....BbBbB...",
    "...BbBbBbB..",
    "..ssBbBbBbB.",
    ".kssbBbBbBb.",
    "sssssbBbBbB.",
    "..ss.s..s...",
  },
  sit1 = {
    "............",
    "....BbBbB...",
    "..ssBbBbBbB.",
    ".kssbBbBbBb.",
    "sssssbBbBbB.",
    "..ss.s..s...",
  },
  beat = { -- a little hop
    "....BbBbB...",
    "...BbBbBbB..",
    "..ssBbBbBbB.",
    ".kssbBbBbBb.",
    "sssssbBbBbB.",
    "............",
  },
  cross = { -- trundling along
    { "....BbBbB...", "...BbBbBbB..", "..ssBbBbBbB.", ".kssbBbBbBb.", "sssssbBbBbB.", "..ss.s..s..." },
    { "....BbBbB...", "...BbBbBbB..", "..ssBbBbBbB.", ".kssbBbBbBb.", "sssssbBbBbB.", "...s.s...s.." },
  },
}

M.crow = {
  head = 3,
  sit = {
    "..kk........",
    ".kkkk.......",
    "hkwkk.......",
    ".kkkkk......",
    "..kkkkkhh...",
    "..kkkkhhhkk.",
    "...kkkkkkkkk",
    "....kk....kk",
    "....D.D.....",
  },
  beat = { -- it caws, its beak open
    "..kk........",
    ".kkkk.......",
    "hkwkk.......",
    "h.kkkk......",
    "..kkkkkhh...",
    "..kkkkhhhkk.",
    "...kkkkkkkkk",
    "....kk....kk",
    "....D.D.....",
  },
  cross = {
    { "......kk.....", ".....kkk.....", "..kk.khk.....", "hkwkkkkkkkkk.", "..kkkkkkkk.kk", "......kk.....", "............." },
    { ".............", "..kk.........", "hkwkkkkkkkkk.", "..kkkkkkkk.kk", "....khkk.....", ".....kkk.....", "......kk....." },
  },
}

M.owl = {
  head = 0,
  sit = {
    ".B....B..",
    ".BbbbbB..",
    "bwwbwwbb.",
    "wykwykwb.",
    "bwwYwwbbB",
    ".bbbbbbbB",
    ".bwbwbbBB",
    ".bbwbwbBB",
    "..bbbbBB.",
    "...Y..Y..",
  },
  sit1 = {
    ".B....B..",
    ".BbbbbB..",
    "bwwbwwbb.",
    "wykwykwb.",
    "bwwYwwbbB",
    ".bbbbbbbB",
    ".bwbwbbBB",
    ".bbwbwbBB",
    ".bbbbbbBB",
    "...Y..Y..",
  },
  beat = { -- it blinks
    ".B....B..",
    ".BbbbbB..",
    "bwwbwwbb.",
    "wBBwBBwb.",
    "bwwYwwbbB",
    ".bbbbbbbB",
    ".bwbwbbBB",
    ".bbwbwbBB",
    "..bbbbBB.",
    "...Y..Y..",
  },
  cross = { -- flying, wings up then down
    {
      "bB..........Bb",
      ".bB..B..B..Bb.",
      "..bBBbbbbBBb..",
      "....wwbwwb....",
      "....ykwykw....",
      "....wwYwwb....",
      ".....bbbb.....",
      "......YY......",
    },
    {
      ".....B..B.....",
      ".....bbbb.....",
      "....wwbwwb....",
      "....ykwykw....",
      "..bbwwYwwbbb..",
      ".bB.bbbbbb.Bb.",
      "bB...bbbb...Bb",
      "......YY......",
    },
  },
}

-- Draws animal `id` in pose 'cross', 'sit' or 'beat', frame 0 or 1, facing left, its feet (or
-- waterline) at (x, y).
function A.draw(b, id, pose, frame, x, y)
  local m = M[id]
  local function put(rows, dy)
    local w = 0
    for _, r in ipairs(rows) do w = math.max(w, #r) end
    stamp(b, x - w // 2, y - #rows + 1 + (dy or 0), rows)
  end
  if pose == "cross" then put(m.cross[frame + 1])
  elseif pose == "beat" and frame == 1 then put(m.beat)
  elseif frame == 1 then put(m.sit1 or lower(m.sit, m.head))
  else put(m.sit) end
end

return A
````

Apply to `art/open-case/sprites.lua`:

````diff
diff --git a/art/open-case/sprites.lua b/art/open-case/sprites.lua
index 1c2908d..f45bd81 100644
--- a/art/open-case/sprites.lua
+++ b/art/open-case/sprites.lua
@@ -28,6 +28,10 @@
 --              and clock [x, y, r] (the clock's middle and radius, for its hands)
 --   market     the night market's: lanterns [[x, y, colour], ...] (where each hangs, in the order they
 --              light; their frames are lantern-off and lantern-<colour>) and stars [[x, y], ...]
+--   sunrise    One Tree Island's five stages of the sky, before dawn to morning, as `sky`
+--   island     its layout: sun [x, y] (where the sun's middle is before it comes up), trunk (the row the
+--              pine's trunk stands on, to sort it among the figures), glints [[x, y], ...] (where the
+--              water glints; the first sunGlints of them are the sun's reflection, under it)
 --   looks      { kind: ["woman" | "man", ...] }: each kind's passers-by, look 0 first (their frames are
 --              <kind>-<look>-walk-<0-3>, -stand-<0-1> and -nod-<0-1>, each -left and -right)
 --   colors     the named colours the game draws with in code
@@ -39,6 +43,8 @@ local G = dofile(here .. "gear.lua")
 local S = dofile(here .. "shop.lua")
 local ST = dofile(here .. "station.lua")
 local MK = dofile(here .. "market.lua")
+local IS = dofile(here .. "island.lua")
+local AN = dofile(here .. "animals.lua")
 local L, C = D.L, D.C
 local W, H = D.W, D.H
 local STAGES = D.stages()
@@ -153,6 +159,33 @@ for _, pose in ipairs({ "sleep", "walk", "run" }) do
   end
 end
 
+-- One Tree Island: the far shore and the lake in each stage of the sunrise, the mist's streaks, the
+-- fish leaping and its splash, the island, the pine's branches and its trunk, and the animals, each in
+-- each pose (crossing, settled, keeping the beat), facing left and mirrored to face right
+local SUNRISE = IS.stages()
+for s, st in ipairs(SUNRISE) do
+  screen("island-shore-" .. (s - 1), function(b) IS.shore(b, s) end)
+  screen("island-water-" .. (s - 1), function(b) IS.water(b, s, st[7]) end)
+end
+for i = 1, IS.MISTS do screen("island-mist-" .. (i - 1), function(b) IS.mist(b, i) end) end
+screen("island-land", IS.land)
+screen("island-pine", IS.pine)
+screen("island-trunk", IS.trunk)
+for _, pose in ipairs({ "jump", "splash" }) do
+  for f = 0, 1 do add(("fish-%s-%d"):format(pose, f), 12, 10, 6, 5, function(b) IS.fish(b, pose, f, 6, 5) end) end
+end
+for _, id in ipairs(AN.IDS) do
+  for _, pose in ipairs({ "cross", "sit", "beat" }) do
+    for f = 0, 1 do
+      local name = ("%s-%s-%d"):format(id, pose, f)
+      add(name .. "-left", 32, 24, 16, 22, function(b) AN.draw(b, id, pose, f, 16, 22) end)
+      local b = L.buffer(32, 24)
+      AN.draw(b, id, pose, f, 16, 22)
+      frames[#frames + 1] = { name = name .. "-right", b = D.mirror(b), px = 15, py = 22 }
+    end
+  end
+end
+
 -- The music shop: the room, the counter (drawn over the shopkeeper), the shopkeeper breathing (0, 1)
 -- and nodding at a sale (2, 3), the stock as it stands and chosen, and the tags
 local STOCK = { "overdrive", "chorus", "tremolo", "delay", "reverb", "loop", "acoustic", "ukulele", "electric", "epiano", "synth" }
@@ -298,6 +331,13 @@ local json = table.concat({
   '    "lanterns": ' .. list(MK.lanterns(), function(l) return ("[%d, %d, %d]"):format(l[1], l[2], l[3]) end) .. ",",
   '    "stars": ' .. list(MK.stars(), pair),
   "  },",
+  '  "sunrise": ' .. list(SUNRISE, function(st) return list(st, q) end) .. ",",
+  '  "island": {',
+  ('    "sun": [%d, %d],'):format(IS.SUN[1], IS.SUN[2]),
+  ('    "trunk": %d,'):format(IS.TRUNK_FEET),
+  '    "glints": ' .. list(IS.glints(), pair) .. ",",
+  ('    "sunGlints": %d'):format(IS.SUN_GLINTS),
+  "  },",
   '  "looks": { ' .. table.concat((function()
     local out = {}
     for i, kind in ipairs(F.KINDS) do
````

Then rebuild the sheet from the repo root:

Run: `/Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/sprites.lua`
Expected: `sprites: 734 frames on a 512x3077 sheet, 61 colours`. A second run leaves `git status` unchanged.

- [ ] **Step 4: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 473 tests.

- [ ] **Step 5: Commit**

```bash
git add art/open-case/palette.lua art/open-case/island.lua art/open-case/animals.lua art/open-case/sprites.lua open-case/assets/sprites.png open-case/assets/sprites.json open-case/test/art.test.js
git commit -m "Open Case: One Tree Island and its eleven animals in the sprite sheet: the sunrise's far shore and lake, the mist, the fish, the island with its pine and rowboat, and every animal crossing, settled and keeping the beat

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: The keepsakes and your room in the sprite sheet

**Files:**
- Create: `art/open-case/keepsakes.lua`, `art/open-case/room.lua`
- Modify: `art/open-case/draw.lua`, `art/open-case/sprites.lua`
- Rebuild: `open-case/assets/sprites.png`, `open-case/assets/sprites.json`
- Test: `open-case/test/art.test.js`

**Interfaces:**
- Consumes: `KEEPSAKES` (Task 2) and `ANIMAL_IDS` (Task 1) in the tests; `D.CASE`.
- Produces, in the sheet: for every keepsake, `keep-<id>` (for the shelf, up to 12 × 12, anchored at its bottom middle), `keep-<id>-hint` (its outline) and `keep-<id>-case` (5 × 5, anchored at its bottom middle); and `room` (the whole screen).
- Produces, in `sprites.json`:
  - `room` (`{ shelf: [x, y, pitch, columns, rows], count: [x, y], desk: [x, y, w, h] }`);
  - `caseKeeps` (`[[x, y], ...]`, three bottom middles in the case's lid).
- Produces, in `draw.lua`: `D.caseKeepSpots()`.

- [ ] **Step 1: Write the failing tests**

Apply to `open-case/test/art.test.js`:

````diff
diff --git a/open-case/test/art.test.js b/open-case/test/art.test.js
index e0a9fa3..a9f8176 100644
--- a/open-case/test/art.test.js
+++ b/open-case/test/art.test.js
@@ -9,6 +9,7 @@ import { readPng } from './png.js';
 import { KINDS, LOOKS, PATH_Y } from '../src/crowd.js';
 import { CROWD, ISLAND } from '../src/tuning.js';
 import { ANIMALS, ANIMAL_IDS } from '../src/animals.js';
+import { KEEPSAKES } from '../src/keepsakes.js';
 import { CASE } from '../src/scene.js';
 import { STOCK, PEDALS, INSTRUMENTS } from '../src/gear.js';
 import { CARD } from '../src/shop.js';
@@ -46,6 +47,9 @@ const FAMILIES = [
   [/^island-shore-\d$/, 5], [/^island-water-\d$/, 5], [/^island-mist-\d$/, 4], ['island-land', 1], ['island-pine', 1], ['island-trunk', 1],
   [/^fish-jump-\d$/, 2], [/^fish-splash-\d$/, 2],
   ...ANIMAL_IDS.flatMap((id) => ['cross', 'sit', 'beat'].flatMap((p) => ['left', 'right'].map((d) => [new RegExp(`^${id}-${p}-\\d-${d}$`), 2]))),
+  // the keepsakes, on the shelf, as its outline there, and in your case; and your room
+  ...KEEPSAKES.flatMap(({ id }) => [[`keep-${id}`, 1], [`keep-${id}-hint`, 1], [`keep-${id}-case`, 1]]),
+  ['room', 1],
 ];
 
 test('every frame the game draws is there, as many of each as the spec says, and nothing else', () => {
@@ -276,3 +280,57 @@ test('each animal is its own, and smaller than a person: its frames are no talle
     for (const other of ANIMAL_IDS) if (id < other) assert.ok(differ(`${id}-sit-0-left`, `${other}-sit-0-left`) >= 30, `${id} and ${other}`);
   }
 });
+
+test('each keepsake fits its cubby, up to 12 square on the shelf and 6 in your case, and its outline there is only its edge, in one colour', () => {
+  const [, , pitch] = data.room.shelf;
+  for (const { id } of KEEPSAKES) {
+    const [, , w, h] = data.frames[`keep-${id}`], [, , cw, ch] = data.frames[`keep-${id}-case`], [hx, hy, hw, hh] = data.frames[`keep-${id}-hint`];
+    assert.ok(w <= 12 && h <= 12 && w < pitch - 1 && h < pitch - 1, `keep-${id}: ${w}x${h}`);
+    assert.ok(cw <= 6 && ch <= 6, `keep-${id}-case: ${cw}x${ch}`);
+    const colours = new Set();
+    for (let y = 0; y < hh; y++) {
+      for (let x = 0; x < hw; x++) {
+        const i = ((hy + y) * sheet.w + hx + x) * 4;
+        if (sheet.data[i + 3]) colours.add(sheet.data.slice(i, i + 3).join());
+      }
+    }
+    assert.equal(colours.size, 1, `keep-${id}-hint`);
+    assert.ok(differ(`keep-${id}`, `keep-${id}-hint`) > 0);
+  }
+});
+
+test("your room: the shelf's 22 cubbies and the count on the wall, the desk beside them, all clear of the card and the map key", () => {
+  const [sx, sy, pitch, cols, rows] = data.room.shelf, [dx, dy, dw, dh] = data.room.desk, [cx, cy] = data.room.count;
+  assert.equal(cols * rows, KEEPSAKES.length);
+  assert.equal(cols, ANIMAL_IDS.length, 'a column for each animal');
+  const right = sx + cols * pitch, bottom = sy + rows * pitch;
+  assert.ok(sx >= 0 && right < dx && bottom < 138 && dy + dh <= 138 && dx + dw <= 320, 'side by side, above the card');
+  assert.ok(cy + 8 < sy && cx > sx && cx < right, 'the count over the shelf');
+  assert.ok(sx > 44, 'clear of the map key in the corner');
+});
+
+test("your room's window looks out on the woods behind your house, kept inside its frame: the wall beside it is plain wall", () => {
+  // The window's glass runs from x 12 to 70 (art/open-case/room.lua R.WINDOW) and its frame 3 pixels
+  // past it; the two columns of wall either side of the frame match the wall beyond them.
+  for (let y = 16; y <= 66; y++) {
+    for (const x of [7, 8]) assert.equal(colourAt('room', x, y), colourAt('room', 4, y), `wall at ${x},${y}`);
+    for (const x of [74, 75]) assert.equal(colourAt('room', x, y), colourAt('room', 76, y), `wall at ${x},${y}`);
+  }
+  const woods = new Set(['29,59,66', '46,93,92', '69,128,110']); // the palette's leaf greens (palette.lua)
+  let trees = 0;
+  for (let y = 50; y <= 66; y++) for (let x = 12; x <= 70; x++) if (woods.has(colourAt('room', x, y))) trees++;
+  assert.ok(trees > 0.8 * 17 * 59, `trees fill the bottom of the window (${trees} pixels)`);
+});
+
+test("the keepsakes in your case lie on its lid's lining, side by side", () => {
+  assert.equal(data.caseKeeps.length, 3);
+  data.caseKeeps.forEach(([x, y], i) => {
+    if (i) assert.ok(x - data.caseKeeps[i - 1][0] >= 6, 'clear of each other');
+    for (const { id } of KEEPSAKES) {
+      const name = `keep-${id}-case`, [l, t, r, b] = cover(name, x, y);
+      for (let yy = t; yy < b; yy++) {
+        for (let xx = l; xx < r; xx++) if (opaqueAt(name, x, y, xx, yy)) assert.ok(opaqueAt('case', 0, 0, xx, yy), `${id} in the lid at ${xx}, ${yy}`);
+      }
+    }
+  });
+});
````

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL. Five art tests fail, as the sheet has no keepsakes or room yet:
- "every frame the game draws is there…";
- "each keepsake fits its cubby…";
- "your room: the shelf's 22 cubbies…";
- "your room's window looks out on the woods…";
- "the keepsakes in your case lie on its lid's lining…".

The other 472 tests pass.

- [ ] **Step 3: The keepsakes' and the room's art**

Create `art/open-case/keepsakes.lua`:

````lua
-- The keepsakes the island's animals leave, in the flat style, for the sprite sheet (sprites.lua): each
-- at the shelf's size (up to 12x12, for your room), as the faint outline that marks it on the shelf
-- until you've found it, and at the case's size (5x5) for the three you carry in your case's lid. In
-- keepsakes.js's order, two from each animal, the ordinary one first.
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local D = dofile(here .. "draw.lua")
local L, C, stamp = D.L, D.C, D.stamp
local K = {}

-- { id, shelf map, case map }, drawn with the palette's pixel-map letters (draw.lua).
K.LIST = {
  { "dandelion", {
    "..w.w.w.",
    ".w.www.w",
    "w.wwwww.",
    ".wwwcwww",
    "w.wwwww.",
    ".w.www.w",
    "..w.e.w.",
    "....e...",
    "....e...",
    "...ee...",
    "....e...",
  }, { ".w.w.", "wwwww", ".wcw.", "..e..", "..e.." } },
  { "clover", {
    "...oo.....",
    "..oool....",
    ".oo.ol.oo.",
    "ooool.oool",
    ".ollellll.",
    "..oo.e.oo.",
    ".ooolloool",
    ".oo.ol.oo.",
    "....ol....",
    ".....e....",
    "......e...",
  }, { ".o.o.", "oooll", ".lel.", "oo.oo", "...e." } },
  { "feather", {
    "........ww",
    ".......www",
    "......wwwc",
    ".....wwwc.",
    "....wwwc..",
    "...wwwc...",
    "..wwwc....",
    ".wwwc.....",
    ".wwc......",
    "..c.......",
    ".c........",
  }, { "...ww", "..wwc", ".wwc.", "wwc..", "c...." } },
  { "rubberduck", {
    "...yyy....",
    "..yyyyy...",
    "..ykyyy...",
    "OOyyyyy...",
    "OO.yyy....",
    ".yyyyyyyy.",
    "yyyyyyyyyy",
    "yyyyyyyyyY",
    ".yyyyyyyY.",
    "..YYYYYY..",
  }, { ".yy..", "Okyy.", ".yyyy", "yyyyY", ".YYY." } },
  { "acorn", {
    "....D.....",
    "..BBBBB...",
    ".BbBbBbB..",
    "BbBbBbBbB.",
    ".gggggggg.",
    ".gggggggG.",
    ".ggggggGG.",
    "..gggggG..",
    "...ggGG...",
    "....GG....",
  }, { ".BBB.", "BbBbB", "ggggG", ".ggG.", "..G.." } },
  { "goldacorn", {
    "....Y.....",
    "..YYYYY...",
    ".YyYyYyY..",
    "YyYyYyYyY.",
    ".ywyyyyyy.",
    ".wyyyyyyY.",
    ".yyyyyyYY.",
    "..yyyyyY..",
    "...yyYY...",
    "....YY....",
  }, { ".YYY.", "YyYyY", "wyyyY", ".yyY.", "..Y.." } },
  { "pebble", {
    "...cccc...",
    ".ccwwccc..",
    "ccwccccccC",
    "cccccccccC",
    ".cccccccCC",
    "..CCCCCCC.",
  }, { ".ccc.", "cwccC", "ccccC", ".CCC." } },
  { "fishbones", {
    "............",
    ".ww.........",
    "wwww.w.w.w.w",
    "wkwwwwwwwwww",
    "wwww.w.w.w.w",
    ".ww.........",
  }, { ".w...", "wwwww", "kwwww", "wwwww", ".w..." } },
  { "snailshell", {
    "...gggg...",
    "..gGGGGg..",
    ".gGgggGGg.",
    ".gGgDgGGg.",
    ".gGggGGgg.",
    "..gGGGgg..",
    "DDDggggg..",
    ".DDDDDD...",
  }, { ".ggg.", "gGgGg", "gGDGg", "DggG.", ".DD.." } },
  { "teacup", {
    "..........",
    "wwwwwwww..",
    "wffffffwww",
    "wwwwwwww.w",
    "wwwwwwwwww",
    ".wwwwww...",
    "..wwww....",
    "cccccccc..",
  }, { "wwww.", "fffww", "wwwww", ".ww..", "cccc." } },
  { "wildflower", {
    "...ff.....",
    "..fvvf....",
    ".fvyyvf...",
    "..fvvf....",
    "...ff.....",
    "....e.....",
    "....e.ll..",
    "..lle.l...",
    "...le.....",
    "....e.....",
  }, { ".fff.", "fvyvf", ".fff.", "..e..", ".le.." } },
  { "bell", {
    "..rr.rr..",
    "...rrr...",
    "...yyy...",
    "..yyyyy..",
    "..ywyyY..",
    ".ywyyyYY.",
    ".yyyyyYY.",
    "YYYYYYYYY",
    "....k....",
  }, { "rr.rr", ".yyy.", "ywyyY", "YYYYY", "..k.." } },
  { "blackberry", {
    "..e.ll....",
    "...elll...",
    "..VvVvV...",
    ".VvVvVvV..",
    ".vVwVvVv..",
    ".VvVvVvV..",
    "..VvVvV...",
    "...VvV....",
  }, { "..el.", ".VvV.", "VvwvV", "vVvVv", ".VvV." } },
  { "sock", {
    ".rrrr....",
    ".wwww....",
    ".rrrr....",
    ".wwww....",
    ".wwww....",
    ".wwww....",
    ".wwwwww..",
    "rwwwwwwww",
    "rrwwwwwrr",
    ".rrrrrrr.",
  }, { ".rr..", ".ww..", ".ww..", "rwwww", ".rrrr" } },
  { "lily", {
    "...w....",
    ".w.fw.w.",
    ".fwfwff.",
    "wffyyffw",
    ".fwwwwf.",
    "eellllee",
    ".elllle.",
  }, { "..w..", "wfwfw", ".fyf.", "elll.", ".ell." } },
  { "crown", {
    "y...y...y",
    "yy.yyy.yy",
    "yyyyryyyy",
    "yyyyyyyyy",
    "YYYYYYYYY",
    "yryyryyry",
    "YYYYYYYYY",
  }, { "y.y.y", "yyryy", "yyyyy", "YrYrY" } },
  { "leaf", {
    ".......xx",
    ".....OOx.",
    "...OOOxO.",
    "..OOOxOO.",
    ".OOOxOOO.",
    ".OOxOOOO.",
    ".OxOOOO..",
    "OxOOOO...",
    "x.OO.....",
  }, { "...Ox", "..OxO", ".OxO.", "OxO..", "x...." } },
  { "apple", {
    ".....e..",
    "....ell.",
    "..rrDrr.",
    ".rwrrrrr",
    ".wrrrrrR",
    ".rrrrrrR",
    ".rrrrrRR",
    "..rrrRR.",
    "...RRR..",
  }, { "..el.", ".rDr.", "rwrrR", "rrrRR", ".RRR." } },
  { "bottlecap", {
    ".c.c.c.c.",
    "cCCCCCCCc",
    ".CrrrrrC.",
    "cCrwrrrCc",
    ".CrrrrrC.",
    "cCCCCCCCc",
    ".c.c.c.c.",
  }, { "c.c.c", "CrrrC", "Crwrc", "CrrrC", "c.c.c" } },
  { "ring", {
    "...ww...",
    "..wyyw..",
    "..yyyy..",
    ".yY..Yy.",
    "yY....Yy",
    "yY....Yy",
    ".yY..Yy.",
    "..YYYY..",
  }, { "..w..", ".yyy.", "yY.Yy", "yY.Yy", ".YYY." } },
  { "owlfeather", {
    ".........b",
    "........bb",
    ".......bwb",
    "......bbbB",
    ".....bwbB.",
    "....bbbB..",
    "...bwbB...",
    "..bbbB....",
    ".bbB......",
    ".B........",
    "B.........",
  }, { "...bb", "..bwB", ".bbB.", "bwB..", "B...." } },
  { "spectacles", {
    "............",
    ".kkk....kkk.",
    "kwwck..kwwck",
    "kwcckkkkwcck",
    "kccck..kccck",
    ".kkk....kkk.",
  }, { ".....", "kk.kk", "wkkwk", "kk.kk", "....." } },
}

-- A keepsake at the shelf's size, its bottom middle at (x, y).
function K.shelf(b, i, x, y)
  local rows = K.LIST[i][2]
  stamp(b, x - #rows[1] // 2, y - #rows + 1, rows)
end

-- Its faint outline on the shelf, before you've found it: just its edge, in `colour`.
function K.outline(b, i, x, y, colour)
  local shape = L.buffer(b.w, b.h)
  K.shelf(shape, i, x, y)
  local edge = L.buffer(b.w, b.h)
  for yy = 0, b.h - 1 do for xx = 0, b.w - 1 do edge[yy][xx] = shape[yy][xx] end end
  L.outline(edge, colour)
  for yy = 0, b.h - 1 do
    for xx = 0, b.w - 1 do if edge[yy][xx] == colour and not shape[yy][xx] then b[yy][xx] = colour end end
  end
end

-- At the case's size, its bottom middle at (x, y).
function K.case(b, i, x, y)
  local rows = K.LIST[i][3]
  stamp(b, x - #rows[1] // 2, y - #rows + 1, rows)
end

return K
````

Create `art/open-case/room.lua`:

````lua
-- Your room at home in the flat style, for the sprite sheet (sprites.lua): one picture, the wall and its
-- window onto a morning over the woods behind your house, the shelf for your keepsakes with
-- its twenty-two empty cubbies (render.js puts each keepsake in its own, and the outlines of the ones
-- still to find), the desk with your groovebox, which opens the studio, a rug and a plant, and the
-- wooden floor. render.js draws the count over the shelf, the card along the bottom and the map key.
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local D = dofile(here .. "draw.lua")
local L, C, rect, oval, stamp = D.L, D.C, D.rect, D.oval, D.stamp
local W, H = D.W, D.H
local set = L.set
local R = {}

R.FLOOR = 106 -- the floor's first row
R.WINDOW = { 12, 16, 70, 66 } -- the glass: x0, y0, x1, y1
R.SHELF = { 86, 30, 15, 11, 2 } -- the shelf's top-left, its cubbies' pitch (each 14 square inside), its columns and rows
R.COUNT = { 168, 19 } -- the middle of the top of the count over the shelf
R.DESK = { 256, 82, 60, 46 } -- the desk with the groovebox on it, which a click opens: x, y, w, h

-- Cubby (col, row)'s inside: x0, y0, x1, y1.
function R.cubby(col, row)
  local x0, y0, p = R.SHELF[1] + 1 + col * R.SHELF[3], R.SHELF[2] + 1 + row * R.SHELF[3], R.SHELF[3]
  return x0, y0, x0 + p - 2, y0 + p - 2
end

function R.room(b)
  -- the wall, in teal, a paler stripe now and then, and the skirting board
  rect(b, 0, 0, W - 1, R.FLOOR - 1, C.teal[1])
  for x = 6, W - 1, 12 do rect(b, x, 0, x, R.FLOOR - 3, C.leaf[2]) end
  rect(b, 0, R.FLOOR - 3, W - 1, R.FLOOR - 1, C.wood[1])
  rect(b, 0, R.FLOOR - 3, W - 1, R.FLOOR - 3, C.wood[2])
  -- the floor, in planks that widen toward you
  local rows = { R.FLOOR, 110, 115, 121, 128, 136, 145, 155, 166, H }
  for r = 1, #rows - 1 do
    local y0, y1, len = rows[r], rows[r + 1] - 1, 26 + r * 9
    rect(b, 0, y0, W - 1, y1, C.wood[2])
    rect(b, 0, y1, W - 1, y1, C.wood[1])
    for x = (r * 23) % len, W - 1, len do rect(b, x, y0, x, y1, C.wood[1]) end
  end
  -- the rug
  oval(b, 168.5, 121.5, 58, 9, C.red[1])
  oval(b, 168.5, 121, 54, 7, C.red[2])
  for x = 120, 216, 8 do rect(b, x, 119, x + 3, 122, C.red[1]) end
  -- the window: the morning sky over the woods behind your house (as on the map, where they come up close
  -- behind it), the sun through the treetops, two pines and the round crowns of the trees in front, lit
  -- on their upper left; drawn on their own and kept to the glass, then the frame and the sill
  local w = R.WINDOW
  local view = L.buffer(W, H)
  local sky = { C.morning[1], C.morning[2], C.morning[3] }
  for y = w[2], w[4] do rect(view, w[1], y, w[3], y, sky[math.min(3, 1 + (y - w[2]) // 12)]) end
  oval(view, w[1] + 15.5, 31.5, 5, 5, C.light)
  for _, p in ipairs({ { w[1] + 31, 25 }, { w[1] + 50, 31 } }) do
    for y = p[2], w[4] do
      local hw = math.floor((y - p[2]) * 0.3) + ((y - p[2]) % 4 == 3 and 1 or 0)
      rect(view, p[1] - hw, y, p[1] + hw, y, C.leaf[1])
    end
  end
  rect(view, w[1], 56, w[3], w[4], C.leaf[1]) -- the woods' shade under the crowns
  for _, c in ipairs({ { w[1] - 2, 50, 10 }, { w[1] + 13, 44, 9 }, { w[1] + 27, 51, 10 }, { w[1] + 43, 45, 9 }, { w[1] + 58, 51, 11 },
    { w[1] + 6, 60, 9 }, { w[1] + 36, 61, 10 } }) do
    oval(view, c[1] + 0.5, c[2] + 0.5, c[3], c[3] * 0.85, C.leaf[2])
    oval(view, c[1] - 1.5, c[2] - 1.5, c[3] * 0.7, c[3] * 0.6, C.leaf[3])
  end
  for y = w[2], w[4] do for x = w[1], w[3] do b[y][x] = view[y][x] end end
  rect(b, w[1] - 3, w[2] - 3, w[3] + 3, w[2] - 1, C.wood[3])
  rect(b, w[1] - 3, w[2] - 3, w[1] - 1, w[4] + 2, C.wood[3])
  rect(b, w[3] + 1, w[2] - 3, w[3] + 3, w[4] + 2, C.wood[3])
  rect(b, (w[1] + w[3]) // 2, w[2], (w[1] + w[3]) // 2 + 1, w[4], C.wood[3])
  rect(b, w[1], 40, w[3], 41, C.wood[3])
  rect(b, w[1] - 5, w[4] + 1, w[3] + 5, w[4] + 3, C.wood[3])
  rect(b, w[1] - 5, w[4] + 4, w[3] + 5, w[4] + 4, C.wood[1])
  -- the plant under the window, in its pot
  stamp(b, 24, 84, {
    "....l..e......",
    "..e.le.le.....",
    ".lle.lel..l...",
    "..llelleell...",
    ".e.lleell.ee..",
    "...eellee.....",
    "....eeee......",
    "...RRRRRR.....",
    "...rrrrrR.....",
    "....rrrR......",
    "....rrrR......",
    "....rrrR......",
    "....RRRR......",
  })
  -- the shelf: its cubbies in two rows, dark inside, on two brackets
  local sx, sy, p, cols, rws = R.SHELF[1], R.SHELF[2], R.SHELF[3], R.SHELF[4], R.SHELF[5]
  rect(b, sx, sy, sx + cols * p, sy + rws * p, C.wood[2])
  rect(b, sx, sy, sx + cols * p, sy, C.wood[3])
  for row = 0, rws - 1 do
    for col = 0, cols - 1 do
      local x0, y0, x1, y1 = R.cubby(col, row)
      rect(b, x0, y0, x1, y1, C.wood[1])
      rect(b, x0, y1, x1, y1, C.brown[1]) -- its floor
    end
  end
  rect(b, sx - 2, sy + rws * p + 1, sx + cols * p + 2, sy + rws * p + 2, C.wood[3])
  for _, bx in ipairs({ sx + 12, sx + cols * p - 14 }) do
    stamp(b, bx, sy + rws * p + 3, { "DDD", ".DD", "..D" })
  end
  -- the desk, its drawer and legs, and on it your groovebox, a mug and a lamp
  local dx, dy = R.DESK[1], R.DESK[2] + 14
  rect(b, dx + 2, dy, dx + 59, dy + 1, C.wood[3])
  rect(b, dx + 2, dy + 2, dx + 59, dy + 8, C.wood[2])
  rect(b, dx + 18, dy + 4, dx + 42, dy + 6, C.wood[1])
  rect(b, dx + 29, dy + 5, dx + 31, dy + 5, C.yellow[2])
  rect(b, dx + 4, dy + 9, dx + 6, 126, C.wood[1])
  rect(b, dx + 55, dy + 9, dx + 57, 126, C.wood[1])
  stamp(b, dx + 12, dy - 10, {
    "hhhhhhhhhhhhhhhhhhhhhhhhh",
    "hkkkkkkkhkkooooook.wwh.wh",
    "hkOOkOOkhkkooooook.whhwwh",
    "hkkkkkkkhkkkkkkkkkhhhhhhh",
    "hkOOkOOkhkOOkOOkOOkOOkOOh",
    "hkkkkkkkhkkkkkkkkkkkkkkkh",
    "hkOOkOOkhkOOkOOkOOkOOkOOh",
    "hkkkkkkkhkkkkkkkkkkkkkkkh",
    "kkkkkkkkkkkkkkkkkkkkkkkkk",
    "kkkkkkkkkkkkkkkkkkkkkkkkk",
  })
  stamp(b, dx + 42, dy - 7, { "rrrr.", "rrrRR", "rrrR.R", "rrrRR", "RRRR." })
  stamp(b, dx + 48, dy - 22, {
    "...yyyy..",
    "..yyyyyy.",
    ".YYYYYYYY",
    ".....k...",
    "....k....",
    "...k.....",
    "...k.....",
    "...k.....",
    "...k.....",
    "...k.....",
    "...k.....",
    "...k.....",
    "...k.....",
    ".kkkkk...",
    "hhhhhhh..",
  })
end

return R
````

Apply to `art/open-case/draw.lua`:

````diff
diff --git a/art/open-case/draw.lua b/art/open-case/draw.lua
index 3ac6b87..7a9ba87 100644
--- a/art/open-case/draw.lua
+++ b/art/open-case/draw.lua
@@ -502,6 +502,13 @@ function D.caseCoinSpots(n)
   return out
 end
 
+-- Where the keepsakes in your case sit in its lid, in the order put in: { x, y } bottom middles on the
+-- lid's dark red lining, which leans right as it rises.
+function D.caseKeepSpots()
+  local x, y = D.CASE[1], D.CASE[2]
+  return { { x + 10, y - 2 }, { x + 16, y - 2 }, { x + 22, y - 2 } }
+end
+
 -- A coin, thrown: face-on and side-on by turns, so it spins. Centred on (x, y).
 function D.coin(b, x, y, f)
   if f % 2 == 0 then
````

Apply to `art/open-case/sprites.lua`:

````diff
diff --git a/art/open-case/sprites.lua b/art/open-case/sprites.lua
index f45bd81..dc74bba 100644
--- a/art/open-case/sprites.lua
+++ b/art/open-case/sprites.lua
@@ -32,6 +32,12 @@
 --   island     its layout: sun [x, y] (where the sun's middle is before it comes up), trunk (the row the
 --              pine's trunk stands on, to sort it among the figures), glints [[x, y], ...] (where the
 --              water glints; the first sunGlints of them are the sun's reflection, under it)
+--   room       your room's layout: shelf [x, y, pitch, columns, rows] (the shelf's top-left, and its
+--              cubbies, each pitch - 1 square inside: keepsake k's is column k // 2, row k % 2), count
+--              [x, y] (the middle of the top of the count over it), desk [x, y, w, h] (the desk and its
+--              groovebox, a click opens the studio)
+--   caseKeeps  [[x, y], ...]: where the keepsakes in your case sit in its lid, their bottom middles
+--              (their frames are keep-<id>-case; on the shelf, keep-<id>, and until found, keep-<id>-hint)
 --   looks      { kind: ["woman" | "man", ...] }: each kind's passers-by, look 0 first (their frames are
 --              <kind>-<look>-walk-<0-3>, -stand-<0-1> and -nod-<0-1>, each -left and -right)
 --   colors     the named colours the game draws with in code
@@ -45,6 +51,8 @@ local ST = dofile(here .. "station.lua")
 local MK = dofile(here .. "market.lua")
 local IS = dofile(here .. "island.lua")
 local AN = dofile(here .. "animals.lua")
+local KS = dofile(here .. "keepsakes.lua")
+local RM = dofile(here .. "room.lua")
 local L, C = D.L, D.C
 local W, H = D.W, D.H
 local STAGES = D.stages()
@@ -186,6 +194,15 @@ for _, id in ipairs(AN.IDS) do
   end
 end
 
+-- The keepsakes, each on the shelf (anchored by its bottom middle), as its outline there until it's
+-- found, and in your case's lid; and your room
+for i, k in ipairs(KS.LIST) do
+  add("keep-" .. k[1], 14, 14, 7, 12, function(b) KS.shelf(b, i, 7, 12) end)
+  add("keep-" .. k[1] .. "-hint", 14, 14, 7, 12, function(b) KS.outline(b, i, 7, 12, C.brown[1]) end)
+  add("keep-" .. k[1] .. "-case", 7, 7, 3, 5, function(b) KS.case(b, i, 3, 5) end)
+end
+screen("room", RM.room)
+
 -- The music shop: the room, the counter (drawn over the shopkeeper), the shopkeeper breathing (0, 1)
 -- and nodding at a sale (2, 3), the stock as it stands and chosen, and the tags
 local STOCK = { "overdrive", "chorus", "tremolo", "delay", "reverb", "loop", "acoustic", "ukulele", "electric", "epiano", "synth" }
@@ -338,6 +355,12 @@ local json = table.concat({
   '    "glints": ' .. list(IS.glints(), pair) .. ",",
   ('    "sunGlints": %d'):format(IS.SUN_GLINTS),
   "  },",
+  '  "room": {',
+  ('    "shelf": [%d, %d, %d, %d, %d],'):format(RM.SHELF[1], RM.SHELF[2], RM.SHELF[3], RM.SHELF[4], RM.SHELF[5]),
+  ('    "count": [%d, %d],'):format(RM.COUNT[1], RM.COUNT[2]),
+  ('    "desk": [%d, %d, %d, %d]'):format(RM.DESK[1], RM.DESK[2], RM.DESK[3], RM.DESK[4]),
+  "  },",
+  '  "caseKeeps": ' .. list(D.caseKeepSpots(), pair) .. ",",
   '  "looks": { ' .. table.concat((function()
     local out = {}
     for i, kind in ipairs(F.KINDS) do
````

Then rebuild the sheet from the repo root:

Run: `/Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/sprites.lua`
Expected: `sprites: 801 frames on a 512x3265 sheet, 61 colours`.

- [ ] **Step 4: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 477 tests.

- [ ] **Step 5: Commit**

```bash
git add art/open-case/keepsakes.lua art/open-case/room.lua art/open-case/draw.lua art/open-case/sprites.lua open-case/assets/sprites.png open-case/assets/sprites.json open-case/test/art.test.js
git commit -m "Open Case: the twenty-two keepsakes and your room in the sprite sheet: each keepsake for the shelf, as its outline there and for your case's lid, and the room with its shelf, window and desk

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Drawing the island

**Files:**
- Modify: `open-case/src/render.js`
- Test: `open-case/test/render.test.js`

**Interfaces:**
- Consumes:
  - `sunriseStages`, `sunUp`, `mistLeft`, `fishAt`, `giftAt` (Task 3);
  - the island's and the keepsakes' frames and data (Tasks 4 and 5);
  - `p.animal` (Task 1).
- Produces, in `render.js`:
  - `animalFrame(p, t, time, beat)`;
  - the draw function takes `view.inCase` (the keepsakes in your case, shown in its lid at every place);
  - a scene whose `place` is `'island'` is drawn as the island.

- [ ] **Step 1: Write the failing tests**

Apply to `open-case/test/render.test.js`:

````diff
diff --git a/open-case/test/render.test.js b/open-case/test/render.test.js
index c11c9f7..105bccd 100644
--- a/open-case/test/render.test.js
+++ b/open-case/test/render.test.js
@@ -1,14 +1,16 @@
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
 import { readFileSync } from 'node:fs';
-import { createRenderer, shapeTags, personFrame, youFrame, treeFrame, loopLight, loopWords, loopCue, W, H } from '../src/render.js';
+import { createRenderer, shapeTags, personFrame, animalFrame, youFrame, treeFrame, loopLight, loopWords, loopCue, W, H } from '../src/render.js';
 import { createSet, runSet } from '../src/set.js';
-import { createScene, createFlocks, sceneNote, sceneLoopNote, CASE, PIGEONS, LOOP_PEDAL, CAT, TRAIN, lanternsLit } from '../src/scene.js';
+import { createScene, createFlocks, sceneNote, sceneLoopNote, sceneEvents, CASE, PIGEONS, LOOP_PEDAL, CAT, TRAIN, lanternsLit, GIFT_FALL } from '../src/scene.js';
 import { createKeyState } from '../src/keys.js';
 import { goodSet } from '../src/bots.js';
 import { KINDS, LOOKS } from '../src/crowd.js';
 import { LOFI_CLOCK, readyBeat } from '../src/beats.js';
-import { INTEREST, LOOP, PARK, STATION } from '../src/tuning.js';
+import { INTEREST, LOOP, PARK, STATION, ISLAND } from '../src/tuning.js';
+import { ANIMALS, ANIMAL_IDS, ANIMALS_OF } from '../src/animals.js';
+import { KEEPSAKES } from '../src/keepsakes.js';
 import { STOCK, PEDALS, INSTRUMENTS, freshGear, buy, stomp } from '../src/gear.js';
 import { createShop, choose, CARD, BUTTON } from '../src/shop.js';
 import { createLoop, record, step, loopLength } from '../src/looper.js';
@@ -1016,3 +1018,129 @@ test("the bottom line's words and the gear strip sit on a dark backing, which le
   for (const [x, , w] of backings) for (const [px] of PIGEONS) assert.ok(px < x || px > x + w, `the pigeon at ${px} is clear of ${x}..${x + w}`);
   for (const [x, , w] of backings) assert.ok(CAT[0] + 10 < x || CAT[0] - 10 > x + w, `the cat is clear of ${x}..${x + w}`);
 });
+
+// An animal on the island's set at spot `spot`, settled unless `over` says.
+function animalAt(set, animal, spot, over = {}) {
+  const { kind, cross } = ANIMALS[animal], [x, y] = ISLAND.spots[spot];
+  return stoodAt(set.crowd, kind, 0, { look: ANIMALS_OF[kind].indexOf(animal), animal, lane: ISLAND.lanes[cross], x, y, spot, ...over });
+}
+
+test('One Tree Island: before dawn at the start with the sun hidden and the mist on the water, morning at the end with the sun up and the mist gone', () => {
+  const dawn = fakeContext(), morning = fakeContext();
+  createRenderer(dawn, art)(placed('island', 0.5).view);
+  createRenderer(morning, art)(placed('island', 59.5 * BAR).view);
+  const top = (g) => g.rects.find(([x, y, w]) => x === 0 && y === 0 && w === W)[4];
+  assert.equal(top(dawn), data.sunrise[0][0]);
+  assert.equal(top(morning), data.sunrise[4][0]);
+  for (const n of ['island-shore-0', 'island-water-0', 'island-land', 'island-pine', 'island-trunk', 'you-acoustic-', 'case', 'speaker']) assert.ok(drawn(dawn, n).length, n);
+  assert.equal(drawn(dawn, 'island-mist-').length, ISLAND.mist);
+  assert.equal(drawn(morning, 'island-mist-').length, 0);
+  assert.ok(drawn(morning, 'island-water-4').length && drawn(morning, 'island-shore-4').length);
+  const sun = (g) => drawn(g, 'sun')[0].y + data.frames.sun[5];
+  assert.equal(sun(dawn), data.island.sun[1], 'the sun still under the far shore');
+  assert.equal(sun(morning), data.island.sun[1] - ISLAND.sunRise, 'and up by the end');
+  const order = dawn.sprites.map((x) => x.name);
+  assert.ok(order.indexOf('sun') < order.findIndex((n) => n.startsWith('island-water-')), 'the lake hides the sun until it comes up');
+  for (const n of ['ground', 'trees-', 'lamp-', 'roofs-', 'pigeon-', 'cat-', 'station-', 'market-']) assert.equal(drawn(dawn, n).length, 0, `no ${n}`);
+});
+
+test("the island's sun glints on the water once it's up, and the glints hold still with reduced motion", () => {
+  const sunGlints = (g) => g.rects.filter(([x, y, w, h]) => w === 2 && h === 1 && data.island.glints.slice(0, data.island.sunGlints).some(([gx, gy]) => gx === x && gy === y)).length;
+  const at = (bars, still, time) => {
+    const g = fakeContext();
+    createRenderer(g, art)(placed('island', bars * BAR, { still, time }).view);
+    return g;
+  };
+  assert.equal(sunGlints(at(0, true, 1)), 0, 'not before the sun is up');
+  assert.ok(sunGlints(at(50, true, 1)) > 0);
+  assert.deepEqual(at(50, true, 1).rects, at(50, true, 7).rects, 'still: the same glints whenever');
+});
+
+test("the island's animals: crossing as they come by, settled facing you, breathing, or keeping the beat once they're hooked", () => {
+  const p = { animal: 'fox', id: 1, x: 200, y: ISLAND.lanes.land, dir: -1, state: 'passing', interest: 0.3 };
+  assert.match(animalFrame(p, 0, 0), /^fox-cross-\d-left$/);
+  assert.notEqual(animalFrame(p, 0, 0), animalFrame(p, 0, 0.3), 'its strokes come and go');
+  assert.match(animalFrame({ ...p, state: 'joining', x: 100 }, 0, 0), /^fox-cross-\d-right$/, 'heading for its spot, facing you');
+  assert.match(animalFrame({ ...p, state: 'stopped', x: 200 }, 0, 0), /^fox-sit-\d-left$/);
+  assert.match(animalFrame({ ...p, state: 'stopped', x: 98 }, 0, 0), /^fox-sit-\d-right$/);
+  const hooked = { ...p, state: 'stopped', interest: 0.9 };
+  assert.equal(animalFrame(hooked, 0.05, 0), 'fox-beat-1-left', 'its move on the beat');
+  assert.equal(animalFrame(hooked, BEAT * 0.6, 0), 'fox-beat-0-left');
+  assert.match(animalFrame({ ...p, state: 'leaving', dir: 1 }, 0, 0), /^fox-cross-\d-right$/, 'trotting off as it goes');
+});
+
+test('on the island the animals take the people\'s place, the trunk stands among them, and their reactions sit just over their heads', () => {
+  const { set, view: v } = placed('island', 30);
+  const heron = animalAt(set, 'heron', 7, { reaction: { rule: 'taste', t: 29.5 } });
+  const crow = animalAt(set, 'crow', 0, { reaction: { rule: 'callback', t: 29.5 } });
+  const ducks = animalAt(set, 'ducks', 0, { state: 'passing', x: 150, y: ISLAND.lanes.water });
+  const g = fakeContext();
+  createRenderer(g, art)(v);
+  const names = g.sprites.map((x) => x.name);
+  assert.ok(names.some((n) => n.startsWith('heron-sit-') || n.startsWith('heron-beat-')));
+  assert.ok(names.some((n) => n.startsWith('ducks-cross-')));
+  assert.ok(names.findIndex((n) => n.startsWith('ducks-')) < names.indexOf('island-trunk'), 'the ducks pass behind the trunk');
+  assert.ok(names.indexOf('island-pine') < names.findIndex((n) => n.startsWith('crow-')), 'the crow sits on the pine');
+  for (const [a, rule] of [[heron, 'taste'], [crow, 'callback']]) {
+    const r = drawn(g, `react-${rule}-`)[0], name = animalFrame(a, 30, 1, set.clock.beat);
+    const tip = r.y + data.frames[r.name][5], top = a.y - data.frames[name][5];
+    assert.ok(tip < top && tip >= top - 4, `${a.animal}: its reaction's tail just over its head (${tip} over ${top})`);
+  }
+  assert.equal(drawn(g, 'pigeon-').length, 0, 'no pigeons on the island');
+});
+
+test("a loud note makes the island's fish jump, then splash", () => {
+  const { scene, view: v } = placed('island', 20);
+  sceneNote(scene, 60, 0, 20, 4);
+  const g = fakeContext();
+  createRenderer(g, art)({ ...v, t: 20.3 });
+  assert.equal(drawn(g, 'fish-jump-').length, 1);
+  const later = fakeContext();
+  createRenderer(later, art)({ ...v, t: 21 });
+  assert.equal(drawn(later, 'fish-splash-').length, 1);
+});
+
+test('your keepsakes show in your case\'s lid wherever you busk, none to three of them, in the order put in', () => {
+  for (const place of ['park', 'station', 'market', 'island']) {
+    for (let n = 0; n <= 3; n++) {
+      const inCase = KEEPSAKES.slice(5, 5 + n).map((k) => k.id), g = fakeContext();
+      createRenderer(g, art)(placed(place, 10, { inCase }).view);
+      const shown = drawn(g, 'keep-').map((k) => [k.name, k.x + data.frames[k.name][4], k.y + data.frames[k.name][5]]);
+      assert.deepEqual(shown, inCase.map((id, i) => [`keep-${id}-case`, ...data.caseKeeps[i]]), `${place}, ${n}`);
+    }
+  }
+});
+
+test('a keepsake left at the end drops into the case and lies there, sparkling', () => {
+  const { scene, view: v } = placed('island', 180);
+  sceneEvents(scene, [{ type: 'keepsake', id: 'ring' }], 180);
+  const at = (t, time = 1) => {
+    const g = fakeContext();
+    createRenderer(g, art)({ ...v, t, time });
+    return g;
+  };
+  const falling = drawn(at(180 + GIFT_FALL / 2), 'keep-ring')[0];
+  assert.ok(falling.y + data.frames['keep-ring'][5] < CASE[1], 'on its way down');
+  const landed = at(180 + GIFT_FALL + 1), ring = drawn(landed, 'keep-ring')[0];
+  assert.deepEqual([ring.x + data.frames['keep-ring'][4], ring.y + data.frames['keep-ring'][5]], CASE, 'in the case');
+  const sparks = (g) => g.rects.filter(([, , w, h, c]) => w === 1 && h === 1 && c === data.colors.light).map(([x, y]) => `${x},${y}`).join(' ');
+  assert.notEqual(sparks(at(182, 0)), sparks(at(182, 0.3)), 'its sparkle twinkles');
+});
+
+test('every frame the renderer asks for on the island is in the sheet, over a whole set, every animal in every state', () => {
+  const { set, scene } = placed('island', 0);
+  const states = ['passing', 'joining', 'stopped', 'leaving'];
+  ANIMAL_IDS.forEach((animal, i) => {
+    for (const [j, state] of states.entries()) {
+      animalAt(set, animal, (i + j) % ISLAND.spots.length, { state, dir: j % 2 ? 1 : -1, interest: j % 2 ? 0.9 : 0.3, x: 20 + i * 25 + j * 5, reaction: { rule: 'taste', t: 0 } });
+    }
+  });
+  const draw = createRenderer(fakeContext(), art);
+  for (let t = 0; t < 62 * BAR; t += 0.37) {
+    if (Math.abs(t - 20) < 0.2) sceneNote(scene, 60, 0, t, 4); // the fish jumps
+    if (Math.abs(t - 180) < 0.2) sceneEvents(scene, [{ type: 'keepsake', id: KEEPSAKES[Math.floor(t) % 22].id }], t);
+    set.t = t;
+    for (const p of set.crowd.people) p.reaction.t = t - 0.1;
+    for (const still of [false, true]) draw(view({ set, scene, t, bars: t / BAR, time: t * 1.1, still, inCase: ['sock', 'ring', 'lily'] }));
+  }
+});
````

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL. `test/render.test.js` can't load: `The requested module '../src/render.js' does not provide an export named 'animalFrame'`. The other 421 tests pass.

- [ ] **Step 3: Draw it**

Apply to `open-case/src/render.js`:

````diff
diff --git a/open-case/src/render.js b/open-case/src/render.js
index ab93382..8607190 100644
--- a/open-case/src/render.js
+++ b/open-case/src/render.js
@@ -1,8 +1,10 @@
 // Draws the scene at 320x180 into a 2D context (main.js scales it up by a whole number), in the flat
 // style, from the sprite sheet art/open-case/sprites.lua makes (assets.js loads it): the place you
-// busk in (the park and its sunset, the station and its trains, the night market and its lanterns),
-// you on your crate with your instrument, your pedals and the loop pedal, the open case and the band's
-// speaker, the passers-by, their reactions, the pigeons and birds (or the market's cat), the note
+// busk in (the park and its sunset, the station and its trains, the night market and its lanterns,
+// One Tree Island and its sunrise), you on your crate with your instrument, your pedals and the loop
+// pedal, the open case with your keepsakes in its lid and the band's speaker, the passers-by (or the
+// island's animals), their reactions, the pigeons and birds (or the market's cat, or the island's
+// fish), a keepsake dropping into the case, the note
 // trail (and your loop's), the memory strip, the gear strip, the music shop, and the title card (on the
 // pages that skip the map), the key chart, and the pause and ?debug overlays. The end card and the map
 // are HTML (index.html, atlasview.js).
@@ -11,6 +13,7 @@ import { LOFI_CLOCK } from './beats.js';
 import {
   GUITAR, coinAt, glyphAt, loopGlyphAt, GOLD, skyStages, sunDrop, windowLit, lampState, starsOut, trainX, cloudX,
   birdsAt, pigeonsAt, frameOf, stationClock, trainAt, boardFirst, marketStages, lanternsLit, steamFrame, catAt, TRAIN,
+  sunriseStages, sunUp, mistLeft, fishAt, giftAt,
 } from './scene.js';
 import { STOCK, PEDALS, owns, stockItem } from './gear.js';
 import { card, trying, CARD, BUTTON } from './shop.js';
@@ -47,6 +50,10 @@ const BEATS_PER_BAR = 4; // every beat's 4/4 meter: always 4, unlike LOOP.bars (
 const NOD_SHOW = 1.2; // seconds the shopkeeper nods after a sale...
 const NOD_FPS = 4; // ...this many nods a second
 const BOARD_ROWS = 4; // trains on the station's departure board
+const ANIMAL_STEP = 0.3; // seconds each of an animal's two crossing frames shows (a step or a hop, a stroke, a wingbeat)
+const OVER_ANIMAL = 3; // pixels above the top of an animal's frame its reaction's tail points to
+const SUN_UP = 12; // pixels the island's sun has risen before its reflection glints on the water
+const GLINT = 1.7; // how fast (rad/s) the water's glints come and go
 const BACKING = 0.55; // how dark the backing behind the bottom line's words and the gear strip is...
 const BACKING_TOP = 168, BACKING_H = 11; // ...and where it runs (the line's text sits at y 170)
 
@@ -71,6 +78,17 @@ export function personFrame(p, t, time, beat = LOFI_CLOCK.beat) {
   return `${p.kind}-${p.look}-stand-${frameOf(time / BREATH + p.id * 0.37, 2)}-${face}`;
 }
 
+// The frame an animal shows, on the island (p.animal: animals.js), as people's do: crossing as it comes
+// by, settles and leaves (walking or hopping, swimming or flying), its steps on the page's clock;
+// settled, facing you, breathing, or keeping the beat once it's hooked.
+export function animalFrame(p, t, time, beat = LOFI_CLOCK.beat) {
+  const facingYou = p.state === 'stopped' || p.state === 'joining';
+  const face = (facingYou ? (p.x < CROWD.playerX ? 1 : -1) : p.dir) > 0 ? 'right' : 'left';
+  if (p.state !== 'stopped') return `${p.animal}-cross-${frameOf(time / ANIMAL_STEP + p.id * 0.37, 2)}-${face}`;
+  if (p.interest > INTEREST.hook) return `${p.animal}-beat-${t / beat - Math.floor(t / beat) < NOD ? 1 : 0}-${face}`;
+  return `${p.animal}-sit-${frameOf(time / BREATH + p.id * 0.37, 2)}-${face}`;
+}
+
 // You with your instrument: playing for a moment after each note (a guitar's strum, a keyboard's
 // hands), and otherwise breathing.
 export function youFrame(scene, t, time, instrument) {
@@ -166,11 +184,12 @@ export function createRenderer(g, art) {
   };
   const bandOf = (y) => data.bands.findLastIndex((b) => b <= y);
 
-  // The sky's bands, each in its stage's colour (stages: one for each band, top down).
-  function sky(stages) {
+  // The sky's bands, each in its stage's colour (stages: one for each band, top down), from the
+  // evening's stages, or the island's sunrise's.
+  function sky(stages, colours = data.sky) {
     data.bands.forEach((top, i) => {
       const bottom = data.bands[i + 1] ?? data.skyBottom + 1;
-      px(0, top, W, bottom - top, data.sky[stages[i]][i]);
+      px(0, top, W, bottom - top, colours[stages[i]][i]);
     });
   }
 
@@ -251,10 +270,36 @@ export function createRenderer(g, art) {
     sprite('market-street', 0, 0);
   }
 
-  // Everyone and everything standing on the path, nearest last: the listeners, you, your pedals, the
-  // loop pedal and the amp, the speaker, the case and its coins, and the pigeons on the ground (at the
-  // night market, the cat). Returns the pigeons in the air, drawn later.
-  function figures({ set, scene, t, time, gear, loop }) {
+  // One Tree Island at sunrise, back to front: the sky lightening from the horizon up, the sun coming up
+  // behind the far shore's pines, the lake (the shore and the water follow the horizon's band) and its
+  // glints (the sun's reflection among them once it's up), the mist's streaks still left, the fish if
+  // it's jumping, the island, and the pine's branches over you (its trunk stands among the figures).
+  function island({ bars, t, time, still, scene }) {
+    const stages = sunriseStages(Math.floor(bars)), horizon = stages[6], up = sunUp(bars), [sx, sy] = data.island.sun;
+    sky(stages, data.sunrise);
+    sprite('sun', sx, sy - up);
+    sprite(`island-shore-${horizon}`, 0, 0);
+    sprite(`island-water-${horizon}`, 0, 0);
+    data.island.glints.forEach(([x, y], i) => {
+      if (i < data.island.sunGlints && up < SUN_UP) return;
+      if (still ? i % 2 === 0 : Math.sin(time * GLINT + i * 2.3) > 0.5) px(x, y, 2, 1, C.light);
+    });
+    for (let i = 0; i < mistLeft(bars); i++) sprite(`island-mist-${i}`, 0, 0);
+    const fish = fishAt(scene, t);
+    if (fish) sprite(`fish-${fish.pose}-${fish.frame}`, fish.x, fish.y);
+    sprite('island-land', 0, 0);
+    sprite('island-pine', 0, 0);
+  }
+
+  // How far above an animal's feet its reaction's tail points: just over the top of the frame it shows.
+  const overAnimal = (name) => data.frames[name][5] + OVER_ANIMAL;
+
+  // Everyone and everything standing on the path, nearest last: the listeners (or the island's animals,
+  // and the pine's trunk among them), you, your pedals, the loop pedal and the amp, the speaker, the
+  // case with your keepsakes in its lid, its coins and a keepsake dropping in, and the pigeons on the
+  // ground (at the night market, the cat; on the island, neither). Returns the pigeons in the air,
+  // drawn later.
+  function figures({ set, scene, t, time, gear, loop, inCase = [] }) {
     const things = [
       { y: data.feet.you, draw: () => sprite(youFrame(scene, t, time, gear.instrument), 0, 0) },
       {
@@ -268,17 +313,32 @@ export function createRenderer(g, art) {
         y: data.feet.case,
         draw: () => {
           sprite('case', 0, 0);
+          inCase.forEach((id, i) => sprite(`keep-${id}-case`, ...data.caseKeeps[i]));
           for (const [x, y] of data.caseCoins.slice(0, scene.caseCoins)) sprite('case-coin', x, y);
+          const gift = giftAt(scene, t, time);
+          if (gift) {
+            sprite(`keep-${gift.id}`, gift.x, gift.y);
+            if (gift.landed) {
+              const sparks = gift.sparkle ? [[-7, -11], [6, -5], [-2, -15]] : [[5, -12], [-6, -4], [8, -9]];
+              for (const [dx, dy] of sparks) px(gift.x + dx, gift.y + dy, 1, 1, C.light);
+            }
+          }
         },
       },
     ];
     if (gear.instrument === 'electric') things.push({ y: data.feet.amp, draw: () => sprite('amp', 0, 0) });
     if (owns(gear, 'loop')) things.push({ y: data.feet.loop, draw: () => sprite(`pedal-loop-${loopLight(loop, t)}`, 0, 0) });
-    if (set) for (const p of set.crowd.people) things.push({ y: p.y, draw: () => sprite(personFrame(p, t, time, set.clock.beat), p.x, p.y) });
+    if (set) {
+      for (const p of set.crowd.people) {
+        const frame = p.animal ? animalFrame(p, t, time, set.clock.beat) : personFrame(p, t, time, set.clock.beat);
+        things.push({ y: p.y, draw: () => sprite(frame, p.x, p.y) });
+      }
+    }
+    if (scene.place === 'island') things.push({ y: data.island.trunk, draw: () => sprite('island-trunk', 0, 0) });
     const flying = [];
     const cat = scene.place === 'market' ? catAt(scene, t, time) : null;
     if (cat) things.push({ y: cat.y, draw: () => sprite(`cat-${cat.pose}-${cat.frame}-${cat.dir > 0 ? 'right' : 'left'}`, cat.x, cat.y) });
-    for (const b of scene.place === 'market' ? [] : pigeonsAt(scene, t, time)) {
+    for (const b of scene.place === 'market' || scene.place === 'island' ? [] : pigeonsAt(scene, t, time)) {
       const name = `pigeon-${b.pose}-${b.frame}-${b.dir > 0 ? 'right' : 'left'}`;
       if (b.pose === 'fly') flying.push(() => sprite(name, b.x, b.y));
       else things.push({ y: b.y, draw: () => sprite(name, b.x, b.y) });
@@ -544,7 +604,7 @@ export function createRenderer(g, art) {
     const lines = [
       `bar ${Math.min(set.bars, Math.floor(set.t / bar) + 1)} beat ${beat}`,
       `layers ${LAYERS.filter((x) => set.layers[x.id]).map((x) => x.id).join(' ')}`,
-      `crowd ${set.crowd.people.filter((p) => p.state === 'joining' || p.state === 'stopped').length}  coins ${set.coins}`,
+      `crowd ${set.crowd.people.filter((p) => p.state === 'joining' || p.state === 'stopped').length}  ${set.crowd.place.coins === false ? `fondness ${set.fondness}` : `coins ${set.coins}`}`,
       `shapes ${shapeTags(l.shapes.slice(-16))}`,
       `delay ${info.reported == null ? '?' : info.reported.toFixed(0)}ms  key ${info.measured == null ? '?' : info.measured.toFixed(0)}ms`,
     ];
@@ -567,18 +627,20 @@ export function createRenderer(g, art) {
   //   the studio screen, where t is the band time of the beat it plays, debug: null | { reported, measured },
   //   busking: null | the name of the beat your next set plays, said over the prompt on the 'ready'
   //     screen (null leaves the prompt alone),
-  //   teach: the 'ready' screen shows the key chart (the first set of the visit), not the short prompt }
+  //   teach: the 'ready' screen shows the key chart (the first set of the visit), not the short prompt,
+  //   inCase: the keepsakes in your case (keepsakes.js), shown in its lid wherever you busk }
   return function draw(view) {
     const { screen, set, scene, keys, t, time } = view;
     g.imageSmoothingEnabled = false;
     if (screen === 'shop') return shopView(view);
     if (screen === 'studio') return drawStudio({ px, text, big, measure, C }, view.studio, t);
-    ({ park, station, market })[scene.place](view);
+    ({ park, station, market, island })[scene.place](view);
     const flying = figures(view);
     if (set) {
       for (const p of set.crowd.people) {
         if (p.reaction && t - p.reaction.t < ICON_TIME) {
-          sprite(`react-${p.reaction.rule}-${frameOf(time * REACT_FPS, 2)}`, p.x, p.y - OVER_HEAD);
+          const over = p.animal ? overAnimal(animalFrame(p, t, time, set.clock.beat)) : OVER_HEAD;
+          sprite(`react-${p.reaction.rule}-${frameOf(time * REACT_FPS, 2)}`, p.x, p.y - over);
         }
       }
     }
````

- [ ] **Step 4: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 485 tests.

- [ ] **Step 5: Commit**

```bash
git add open-case/src/render.js open-case/test/render.test.js
git commit -m "Open Case: One Tree Island drawn: the sunrise over the lake, the animals crossing, settling and keeping the beat, the fish, your keepsakes in your case's lid at every place, and a keepsake dropping in with a sparkle

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Your room

**Files:**
- Create: `open-case/src/room.js`, `open-case/test/room.test.js`
- Modify: `open-case/src/render.js`, `open-case/src/studio.js`, `open-case/src/studioview.js`
- Test: `open-case/test/render.test.js`

**Interfaces:**
- Consumes: `KEEPSAKES`, `keepsake`, `hint`, `toggleCase`, `someKeepsakes` (Task 2); the room's frames and `sprites.json` `room` (Task 5); `MAP_KEY` (`studioview.js`).
- Produces:
  - `room.js`:
    - `CARD`, `DESK` (22, the desk's place after the cubbies), `createRoom()` (`{ at, said }`);
    - `press(room, keeps, time)`, `roomKey(room, keeps, code, time)` and `roomClick(layout, room, keeps, x, y, time)`, each returning `'studio' | 'map' | 'case' | null`;
    - `roomHover(layout, room, x, y)` (a boolean), `roomHit(layout, x, y)`, `cubbyBox(layout, i)`;
    - `roomCard(room, keeps, time)` (`{ name, line, says, found, full }`).
  - `studio.js`: `createStudio(beats, { back = 'map' } = {})`, giving `studio.back`.
  - `studioview.js`: `cornerKey(d, word)`.
  - `render.js`: the `'room'` screen, drawn from `view.room` and `view.keeps`.

- [ ] **Step 1: Write the failing tests**

Create `open-case/test/room.test.js`:

````js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRoom, roomKey, press, roomHit, roomHover, roomClick, roomCard, cubbyBox, DESK, CARD } from '../src/room.js';
import { KEEPSAKES } from '../src/keepsakes.js';
import { MAP_KEY } from '../src/studioview.js';

const layout = JSON.parse(readFileSync(new URL('../assets/sprites.json', import.meta.url), 'utf8')).room;
const ids = KEEPSAKES.map((k) => k.id);
const at = (i) => ids.indexOf(i);
const mid = ([x, y, w, h]) => [x + w / 2, y + h / 2];
// Some keepsakes found, the first in your case.
const someKept = () => ({ found: ['dandelion', 'acorn', 'sock', 'ring', 'lily'], inCase: ['dandelion'] });

test('the arrow keys reach every cubby and the desk', () => {
  const seen = new Set([0]), queue = [0];
  while (queue.length) {
    const from = queue.shift();
    for (const code of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) {
      const room = { ...createRoom(), at: from };
      roomKey(room, someKept(), code, 0);
      if (!seen.has(room.at)) {
        seen.add(room.at);
        queue.push(room.at);
      }
    }
  }
  assert.equal(seen.size, KEEPSAKES.length + 1);
});

test('left and right step along a row, right from its end onto the desk and back; up and down switch rows', () => {
  const room = createRoom(), keeps = someKept(), go = (code) => roomKey(room, keeps, code, 0);
  assert.equal(room.at, 0, "the bunny's dandelion clock first");
  go('ArrowDown');
  assert.equal(room.at, 1, "then its four-leaf clover, under it");
  go('ArrowRight');
  assert.equal(room.at, 3, "the ducks' rubber duck");
  go('ArrowLeft');
  go('ArrowLeft');
  assert.equal(room.at, 1, 'no further left than the first column');
  go('ArrowUp');
  for (let i = 0; i < 10; i++) go('ArrowRight');
  assert.equal(room.at, at('owlfeather'));
  go('ArrowRight');
  assert.equal(room.at, DESK, 'on to the desk');
  go('ArrowRight');
  go('ArrowUp');
  go('ArrowDown');
  assert.equal(room.at, DESK, 'nowhere further');
  go('ArrowLeft');
  assert.equal(room.at, at('owlfeather'), 'back to the shelf');
});

test('Enter or Space on a keepsake you have puts it in your case or takes it out; on one still to find it does nothing', () => {
  const room = createRoom(), keeps = someKept();
  room.at = at('acorn');
  assert.equal(roomKey(room, keeps, 'Enter', 0), 'case');
  assert.deepEqual(keeps.inCase, ['dandelion', 'acorn']);
  assert.equal(roomKey(room, keeps, 'Space', 0), 'case');
  assert.deepEqual(keeps.inCase, ['dandelion']);
  room.at = at('bell');
  assert.equal(roomKey(room, keeps, 'Enter', 0), null);
  assert.deepEqual(keeps, someKept());
});

test('a fourth is refused, and the card says so for two seconds', () => {
  const room = createRoom(), keeps = { ...someKept(), inCase: ['dandelion', 'acorn', 'sock'] };
  room.at = at('ring');
  assert.equal(press(room, keeps, 10), null);
  assert.deepEqual(keeps.inCase, ['dandelion', 'acorn', 'sock']);
  assert.equal(roomCard(room, keeps, 11).says, 'your case holds three, take one off first');
  assert.equal(roomCard(room, keeps, 11).full, true);
  assert.equal(roomCard(room, keeps, 12.1).says, 'enter to put it in your case', 'after two seconds');
  room.at = at('sock');
  assert.equal(press(room, keeps, 13), 'case', 'one taken off...');
  room.at = at('ring');
  assert.equal(press(room, keeps, 14), 'case', '...makes room');
  assert.deepEqual(keeps.inCase, ['dandelion', 'acorn', 'ring']);
});

test('Enter on the desk opens the studio, and Esc leads to the map', () => {
  const room = { ...createRoom(), at: DESK };
  assert.equal(roomKey(room, someKept(), 'Enter', 0), 'studio');
  assert.equal(roomKey(room, someKept(), 'Escape', 0), 'map');
  assert.equal(roomKey(createRoom(), someKept(), 'KeyA', 0), null);
});

test("the card: a keepsake's name and line and what Enter does; a hint for one still to find; the desk", () => {
  const room = createRoom(), keeps = someKept();
  assert.deepEqual(roomCard(room, keeps, 0), { name: 'Dandelion clock', line: 'make a wish, then blow', says: 'in your case: enter to take it out', found: true, full: false });
  room.at = at('sock');
  assert.deepEqual(roomCard(room, keeps, 0), { name: 'Odd sock', line: "the fox won't say whose it was", says: 'enter to put it in your case', found: true, full: false });
  room.at = at('blackberry');
  assert.deepEqual(roomCard(room, keeps, 0), { name: 'Something from the fox', line: 'the fox likes the groove', says: '', found: false, full: false });
  room.at = DESK;
  assert.equal(roomCard(room, keeps, 0).says, 'enter to open it');
});

test('the cubbies sit side by side on the shelf in the art, a column for each animal, and a click or the mouse finds each one, the desk and the map key', () => {
  for (let i = 0; i < KEEPSAKES.length; i++) {
    const box = cubbyBox(layout, i);
    assert.deepEqual(roomHit(layout, ...mid(box)), { hit: 'cubby', at: i });
    if (i >= 2) assert.equal(box[0] - cubbyBox(layout, i - 2)[0], layout.shelf[2], 'the next column');
    if (i & 1) assert.equal(box[1] - cubbyBox(layout, i - 1)[1], layout.shelf[2], 'the special one under the ordinary');
  }
  assert.deepEqual(roomHit(layout, ...mid(layout.desk)), { hit: 'desk' });
  assert.deepEqual(roomHit(layout, ...mid(MAP_KEY)), { hit: 'map' });
  assert.equal(roomHit(layout, ...mid(CARD)), null);
  const room = createRoom();
  assert.equal(roomHover(layout, room, ...mid(cubbyBox(layout, 9))), true);
  assert.equal(room.at, 9);
  assert.equal(roomHover(layout, room, ...mid(layout.desk)), true);
  assert.equal(room.at, DESK);
  assert.equal(roomHover(layout, room, 2, 2), false);
  assert.equal(room.at, DESK, 'the pointer stays where it was');
});

test('a click points and presses as Enter does: a cubby puts its keepsake in or out, the desk opens the studio, the map key leaves', () => {
  const room = createRoom(), keeps = someKept();
  assert.equal(roomClick(layout, room, keeps, ...mid(cubbyBox(layout, at('lily'))), 0), 'case');
  assert.equal(room.at, at('lily'));
  assert.deepEqual(keeps.inCase, ['dandelion', 'lily']);
  assert.equal(roomClick(layout, room, keeps, ...mid(layout.desk), 0), 'studio');
  assert.equal(roomClick(layout, room, keeps, ...mid(MAP_KEY), 0), 'map');
  assert.equal(roomClick(layout, room, keeps, 2, 2, 0), null);
});
````

Apply to `open-case/test/render.test.js`:

````diff
diff --git a/open-case/test/render.test.js b/open-case/test/render.test.js
index 105bccd..8cf54ee 100644
--- a/open-case/test/render.test.js
+++ b/open-case/test/render.test.js
@@ -10,7 +10,8 @@ import { KINDS, LOOKS } from '../src/crowd.js';
 import { LOFI_CLOCK, readyBeat } from '../src/beats.js';
 import { INTEREST, LOOP, PARK, STATION, ISLAND } from '../src/tuning.js';
 import { ANIMALS, ANIMAL_IDS, ANIMALS_OF } from '../src/animals.js';
-import { KEEPSAKES } from '../src/keepsakes.js';
+import { KEEPSAKES, someKeepsakes } from '../src/keepsakes.js';
+import { createRoom, cubbyBox, DESK } from '../src/room.js';
 import { STOCK, PEDALS, INSTRUMENTS, freshGear, buy, stomp } from '../src/gear.js';
 import { createShop, choose, CARD, BUTTON } from '../src/shop.js';
 import { createLoop, record, step, loopLength } from '../src/looper.js';
@@ -1144,3 +1145,39 @@ test('every frame the renderer asks for on the island is in the sheet, over a wh
     for (const still of [false, true]) draw(view({ set, scene, t, bars: t / BAR, time: t * 1.1, still, inCase: ['sock', 'ring', 'lily'] }));
   }
 });
+
+test('your room: every keepsake found in its cubby and the rest as outlines, the count, a gold mark on those in your case, the pointer, the card and the map key', () => {
+  for (const n of [0, 5, 22]) {
+    const g = fakeContext(), keeps = someKeepsakes(n), room = createRoom();
+    room.at = 4;
+    createRenderer(g, art)(view({ screen: 'room', room, keeps, time: 3 }));
+    assert.ok(drawn(g, 'room').length === 1);
+    assert.ok(g.texts.includes(`${n} of 22`), `${n} of 22`);
+    const shown = drawn(g, 'keep-').map((k) => k.name);
+    assert.deepEqual(shown, KEEPSAKES.map(({ id }, i) => (i < n ? `keep-${id}` : `keep-${id}-hint`)));
+    KEEPSAKES.forEach((k, i) => {
+      const s = drawn(g, `keep-${k.id}`)[0], [x, y, w, h] = cubbyBox(data.room, i);
+      const [l, t] = [s.x, s.y], [, , fw, fh] = data.frames[s.name];
+      assert.ok(l >= x && t >= y && l + fw <= x + w && t + fh <= y + h, `${s.name} inside its cubby`);
+    });
+    const marks = g.rects.filter(([, , w, h, c]) => w === 2 && h === 2 && c === data.colors.gold);
+    assert.equal(marks.length, Math.min(n, 3), 'a mark for each in your case');
+    const [x, y, w] = cubbyBox(data.room, 4);
+    assert.ok(g.rects.some(([rx, ry, rw, , c]) => rx === x - 1 && ry === y - 1 && rw === w + 2 && c === data.colors.gold), 'the pointer round the chosen cubby');
+    assert.ok(g.texts.includes(n > 4 ? 'Acorn' : 'Something from the squirrel'), 'the card');
+    assert.ok(g.texts.includes('map') && g.texts.includes('esc'), 'the map key');
+    assert.equal(drawn(g, 'you-').length, 0);
+  }
+  const g = fakeContext();
+  createRenderer(g, art)(view({ screen: 'room', room: { ...createRoom(), at: DESK }, keeps: someKeepsakes(1), time: 3 }));
+  assert.ok(g.texts.includes('Your studio') && g.texts.includes('enter to open it'));
+});
+
+test('the studio opened from your room has a "room" key in its corner, and from anywhere else a "map" key', () => {
+  for (const back of ['room', 'map']) {
+    const g = fakeContext(), studio = createStudio({ slots: [null, null, null, null, null, null], chosen: null }, back === 'room' ? { back } : undefined);
+    createRenderer(g, art)(view({ screen: 'studio', studio, t: 0 }));
+    const [x, y, w, h] = MAP_KEY, inKey = (p) => p.x >= x && p.x < x + w && p.y >= y && p.y < y + h;
+    assert.ok(g.positions.some((p) => p.s === back && inKey(p)), back);
+  }
+});
````

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL. `test/room.test.js` and `test/render.test.js` can't load: `Cannot find module '…/open-case/src/room.js'`. The other 421 tests pass.

- [ ] **Step 3: The room, and the studio's way back to it**

Create `open-case/src/room.js`:

````js
// Your room at home, as plain state: the shelf of keepsakes (keepsakes.js), a cubby for each, and the
// desk with your studio on it; which of them the pointer is on, what the card under the shelf says,
// what a key, a click or the mouse over them does, and your case's "no" to a fourth, for a moment.
// Pure, so it's tested in Node; main.js runs it and render.js draws it.
import { KEEPSAKES, keepsake, hint, toggleCase } from './keepsakes.js';
import { MAP_KEY } from './studioview.js';

// The card along the bottom of the room: [x, y, w, h] in scene pixels, right of the map key.
export const CARD = [48, 138, 268, 38];
export const DESK = KEEPSAKES.length; // the pointer's place on the desk, after the 22 cubbies
const COLUMNS = KEEPSAKES.length / 2; // a column for each animal: its ordinary keepsake on top, its special one under
const FULL_SHOWS = 2; // seconds "your case holds three" shows

// Keepsake i's cubby: column i >> 1 (its animal), row i & 1. The pointer starts on the first.
// said: your case's refusal of a fourth, { time } on the page's clock, or null.
export function createRoom() {
  return { at: 0, said: null };
}

// The arrow keys: left and right step along the row, and right from its last cubby goes to the desk
// (left from the desk comes back, to the top row); up and down switch rows (on the desk, nothing).
function step(room, code) {
  if (room.at === DESK) {
    if (code === 'ArrowLeft') room.at = (COLUMNS - 1) * 2;
    return;
  }
  const col = room.at >> 1, row = room.at & 1;
  if (code === 'ArrowUp' || code === 'ArrowDown') room.at = col * 2 + (code === 'ArrowDown' ? 1 : 0);
  else if (code === 'ArrowLeft' && col > 0) room.at = (col - 1) * 2 + row;
  else if (code === 'ArrowRight') room.at = col < COLUMNS - 1 ? (col + 1) * 2 + row : DESK;
}

// Enter on where the pointer is: the desk opens the studio ('studio'); a keepsake you've found goes in
// your case, or comes out ('case'), or with your case full, stays out and the room says so for a
// moment (null); one you haven't found does nothing (null). time: the page's clock, in seconds.
export function press(room, keeps, time) {
  if (room.at === DESK) return 'studio';
  const did = toggleCase(keeps, KEEPSAKES[room.at].id);
  room.said = did === 'full' ? { time } : null;
  return did === 'in' || did === 'out' ? 'case' : null;
}

// A key in the room, by its code: what main.js should do, 'studio', 'map' (Esc), 'case' (your case
// changed: keep it), or null.
export function roomKey(room, keeps, code, time) {
  if (code === 'Escape') return 'map';
  if (code === 'Enter' || code === 'NumpadEnter' || code === 'Space') return press(room, keeps, time);
  if (code.startsWith('Arrow')) step(room, code);
  return null;
}

const inside = ([x, y, w, h], px, py) => px >= x && px < x + w && py >= y && py < y + h;

// Keepsake i's cubby, inside: [x, y, w, h]. layout: sprites.json's room data, { shelf: [x, y, pitch,
// columns, rows], desk: [x, y, w, h] }.
export function cubbyBox(layout, i) {
  const [x, y, pitch] = layout.shelf;
  return [x + 1 + (i >> 1) * pitch, y + 1 + (i & 1) * pitch, pitch - 1, pitch - 1];
}

// What scene point (px, py) is over: { hit: 'cubby', at }, { hit: 'desk' }, { hit: 'map' } (the map
// key), or null.
export function roomHit(layout, px, py) {
  if (inside(MAP_KEY, px, py)) return { hit: 'map' };
  if (inside(layout.desk, px, py)) return { hit: 'desk' };
  const at = KEEPSAKES.findIndex((k, i) => inside(cubbyBox(layout, i), px, py));
  return at < 0 ? null : { hit: 'cubby', at };
}

// The mouse moving over the room: the pointer follows it onto a cubby or the desk. Returns whether
// it's over something a click does something with (for the cursor).
export function roomHover(layout, room, px, py) {
  const target = roomHit(layout, px, py);
  if (target?.hit === 'cubby') room.at = target.at;
  else if (target?.hit === 'desk') room.at = DESK;
  return !!target;
}

// A click: the pointer goes where it lands and it's pressed there, as Enter does; on the map key,
// 'map'. Returns as roomKey does.
export function roomClick(layout, room, keeps, px, py, time) {
  const target = roomHit(layout, px, py);
  if (!target) return null;
  if (target.hit === 'map') return 'map';
  room.at = target.hit === 'desk' ? DESK : target.at;
  return press(room, keeps, time);
}

// The card's words for where the pointer is, at page time `time`: { name, line, says, found, full }
// (says: what Enter does; found: false for a keepsake you haven't found, whose name and line are a
// hint and which Enter does nothing with; full: says is your case's "no" to a fourth, for a moment).
export function roomCard(room, keeps, time) {
  if (room.at === DESK) return { name: 'Your studio', line: 'make your own tracks', says: 'enter to open it', found: true, full: false };
  const { id } = KEEPSAKES[room.at];
  if (!keeps.found.includes(id)) return { ...hint(id), says: '', found: false, full: false };
  const { name, line } = keepsake(id);
  if (room.said && time - room.said.time < FULL_SHOWS) return { name, line, says: 'your case holds three, take one off first', found: true, full: true };
  return { name, line, says: keeps.inCase.includes(id) ? 'in your case: enter to take it out' : 'enter to put it in your case', found: true, full: false };
}
````

Apply to `open-case/src/studio.js`:

````diff
diff --git a/open-case/src/studio.js b/open-case/src/studio.js
index 314bdfc..cc197fc 100644
--- a/open-case/src/studio.js
+++ b/open-case/src/studio.js
@@ -42,9 +42,11 @@ export function chosenBeat(beats) {
 }
 
 // A studio over your beats (loadBeats), with the beat your sets play open.
-export function createStudio(beats) {
+// back: where its corner key and Esc lead, 'map' or 'room' (your room, when you came from its desk).
+export function createStudio(beats, { back = 'map' } = {}) {
   const studio = {
     beats,
+    back,
     open: null, // where the open beat is: { ready: id } or { slot }
     beat: null, // the open beat: a ready-made one itself, until a change copies it into a slot
     version: 0, // goes up with every change to the open beat, or opening another
````

Apply to `open-case/src/studioview.js`:

````diff
diff --git a/open-case/src/studioview.js b/open-case/src/studioview.js
index 09d4ab6..156458e 100644
--- a/open-case/src/studioview.js
+++ b/open-case/src/studioview.js
@@ -42,7 +42,8 @@ export const SOUND_ARROWS = {
   left: [BUTTONS.sound[0] + 2, BUTTONS.sound[1] + 3, 3, 5],
   right: [BUTTONS.sound[0] + BUTTONS.sound[2] - 5, BUTTONS.sound[1] + 3, 3, 5],
 };
-// The map key, in the free corner left of the picture of the loop: it leaves the studio for the map.
+// The map key, in the free corner left of the picture of the loop: it leaves the studio for the map, or
+// for your room when you came from there (and your room has the same key, for the map).
 export const MAP_KEY = [4, 138, 40, 24];
 export const PAD = [82, 22, 234, 108];
 export const STRIP = [48, 134, 268, 44]; // the picture of the loop: its numbers row, then the lanes
@@ -177,7 +178,7 @@ export function drawStudio(d, studio, t) {
   }
   if (PARTS.includes(part)) wheel(d, studio, tone[part]);
   buttons(d, studio);
-  mapKey(d);
+  cornerKey(d, studio.back);
   if (part === 'mix') mix(d, studio, tone);
   else pad(d, studio, tone[part]);
   strip(d, studio, t, tone);
@@ -292,13 +293,13 @@ function buttons({ px, text, C }, studio) {
   }
 }
 
-// The map key: a raised key with a little ◀ (3 wide, 5 tall, as the knob's) and "map" on its top row,
-// and "esc" in grey under them, as Esc does the same.
-function mapKey({ px, text, C }) {
+// The map key: a raised key with a little ◀ (3 wide, 5 tall, as the knob's) and where it leads ("map",
+// or "room") on its top row, and "esc" in grey under them, as Esc does the same. Your room has it too.
+export function cornerKey({ px, text, C }, word) {
   const [x, y, w] = MAP_KEY;
   raisedKey(px, C, MAP_KEY, C.charcoal, false);
   for (let i = 0; i < 3; i++) px(x + 6 + i, y + 6 - i, 1, 1 + 2 * i, C.grey);
-  text('map', x + 12, y + 4, C.light);
+  text(word, x + 12, y + 4, C.light);
   text('esc', x + w / 2, y + 14, C.grey, 'center');
 }
 
````

Apply to `open-case/src/render.js`:

````diff
diff --git a/open-case/src/render.js b/open-case/src/render.js
index 8607190..191c489 100644
--- a/open-case/src/render.js
+++ b/open-case/src/render.js
@@ -5,9 +5,9 @@
 // pedal, the open case with your keepsakes in its lid and the band's speaker, the passers-by (or the
 // island's animals), their reactions, the pigeons and birds (or the market's cat, or the island's
 // fish), a keepsake dropping into the case, the note
-// trail (and your loop's), the memory strip, the gear strip, the music shop, and the title card (on the
-// pages that skip the map), the key chart, and the pause and ?debug overlays. The end card and the map
-// are HTML (index.html, atlasview.js).
+// trail (and your loop's), the memory strip, the gear strip, the music shop, your room and its shelf of
+// keepsakes, and the title card (on the pages that skip the map), the key chart, and the pause and
+// ?debug overlays. The end card and the map are HTML (index.html, atlasview.js).
 import { CROWD, PLAY, LAYERS, INTEREST, LOOP } from './tuning.js';
 import { LOFI_CLOCK } from './beats.js';
 import {
@@ -18,7 +18,9 @@ import {
 import { STOCK, PEDALS, owns, stockItem } from './gear.js';
 import { card, trying, CARD, BUTTON } from './shop.js';
 import { loopState } from './looper.js';
-import { drawStudio } from './studioview.js';
+import { drawStudio, cornerKey } from './studioview.js';
+import { roomCard, cubbyBox, DESK, CARD as ROOM_CARD } from './room.js';
+import { KEEPSAKES } from './keepsakes.js';
 
 export const W = 320, H = 180;
 const FONT = '8px Silkscreen, monospace';
@@ -592,6 +594,40 @@ export function createRenderer(g, art) {
     }
   }
 
+  // Your room: the room itself, the count over the shelf, each keepsake you've found in its cubby (a
+  // gold mark on those in your case) and the outline of each still to find, the gold pointer round the
+  // chosen cubby (or bobbing over the groovebox on the desk), the card for it, and the map key.
+  function roomView({ room, keeps, time, still }) {
+    const R = data.room;
+    sprite('room', 0, 0);
+    text(`${keeps.found.length} of ${KEEPSAKES.length}`, R.count[0], R.count[1], C.light, 'center');
+    KEEPSAKES.forEach(({ id }, i) => {
+      const [x, y, w, h] = cubbyBox(R, i);
+      sprite(keeps.found.includes(id) ? `keep-${id}` : `keep-${id}-hint`, x + Math.floor(w / 2), y + h - 2);
+      if (keeps.inCase.includes(id)) px(x + w - 3, y + 1, 2, 2, C.gold);
+      if (i !== room.at) return;
+      px(x - 1, y - 1, w + 2, 1, C.gold);
+      px(x - 1, y + h, w + 2, 1, C.gold);
+      px(x - 1, y, 1, h, C.gold);
+      px(x + w, y, 1, h, C.gold);
+    });
+    if (room.at === DESK) {
+      const [x, y, w] = R.desk, cx = x + Math.floor(w / 2) - 2, cy = y - 7 - (!still && Math.sin(time * 5) > 0 ? 1 : 0);
+      px(cx - 2, cy, 5, 1, C.gold);
+      px(cx - 1, cy + 1, 3, 1, C.gold);
+      px(cx, cy + 2, 1, 1, C.gold);
+    }
+    const words = roomCard(room, keeps, time), [x, y, w, h] = ROOM_CARD;
+    g.globalAlpha = 0.92;
+    px(x, y, w, h, C.ink);
+    g.globalAlpha = 1;
+    text(words.name, x + 6, y + 3, words.found ? C.gold : C.grey);
+    text(words.line, x + 6, y + 12, words.found ? C.light : C.grey);
+    text(words.says, x + 6, y + 21, words.full ? C.red : C.gold);
+    text('arrows choose   esc back to the map', x + 6, y + 30, C.greyDark);
+    cornerKey({ px, text, C }, 'map');
+  }
+
   function debugView(set, info) {
     for (const p of set.crowd.people) {
       const x = Math.round(p.x) - 10, y = Math.round(p.y) + 3;
@@ -614,7 +650,7 @@ export function createRenderer(g, art) {
     lines.forEach((s, i) => text(s, W - 129, DEBUG_PANEL_TOP + 2 + i * 9));
   }
 
-  // view: { screen: 'title' | 'ready' | 'playing' | 'paused' | 'over' | 'shop', set, scene, keys,
+  // view: { screen: 'title' | 'ready' | 'playing' | 'paused' | 'over' | 'shop' | 'studio' | 'room', set, scene, keys,
   //   t (set time, which is the band's; in the shop, the time of the band you try the loop pedal
   //   over), bars (bars into the set, a fraction is fine; 0 with no set), time (seconds since the page
   //   opened), still (reduced motion), flocks (the birds, from createFlocks), gear (gear.js),
@@ -624,15 +660,17 @@ export function createRenderer(g, art) {
   //     (the loop pedal's last news, and when: see loopWords; with none showing, loopCue takes its
   //     place over the strip: the count-in, or the recording's progress),
   //   shop: the shop's state (shop.js) on the shop screen, studio: the studio's state (studio.js) on
-  //   the studio screen, where t is the band time of the beat it plays, debug: null | { reported, measured },
+  //   the studio screen, where t is the band time of the beat it plays, room: your room's state
+  //   (room.js) on the room screen, keeps: your keepsakes (keepsakes.js), debug: null | { reported, measured },
   //   busking: null | the name of the beat your next set plays, said over the prompt on the 'ready'
   //     screen (null leaves the prompt alone),
   //   teach: the 'ready' screen shows the key chart (the first set of the visit), not the short prompt,
-  //   inCase: the keepsakes in your case (keepsakes.js), shown in its lid wherever you busk }
+  //   inCase: the keepsakes in your case (keeps.inCase), shown in its lid wherever you busk }
   return function draw(view) {
     const { screen, set, scene, keys, t, time } = view;
     g.imageSmoothingEnabled = false;
     if (screen === 'shop') return shopView(view);
+    if (screen === 'room') return roomView(view);
     if (screen === 'studio') return drawStudio({ px, text, big, measure, C }, view.studio, t);
     ({ park, station, market, island })[scene.place](view);
     const flying = figures(view);
````

- [ ] **Step 4: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 495 tests.

- [ ] **Step 5: Commit**

```bash
git add open-case/src/room.js open-case/src/render.js open-case/src/studio.js open-case/src/studioview.js open-case/test/room.test.js open-case/test/render.test.js
git commit -m "Open Case: your room, worked out and drawn: the shelf of keepsakes to point at and put in or take out of your case (it holds three), the desk that opens the studio, and the studio's corner key that leads back to it

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: The island on the map

**Files:**
- Modify: `open-case/src/places.js`, `open-case/src/atlas.js`, `art/open-case/map/layout.py`, `art/open-case/map/places.py`
- Rebuild: `open-case/assets/map/land.png`, `open-case/assets/map/map.json`, and the new `open-case/assets/map/island.png`
- Test: `open-case/test/places.test.js`, `open-case/test/atlas.test.js`, `open-case/test/map.test.js`

**Interfaces:**
- Consumes: `ISLANDS` (`layout.py`), `tree` and `Canvas` (`places.py`); `PLACES.island` (Task 1).
- Produces:
  - `PLACE_IDS` is `['park', 'station', 'market', 'island']`, so `STOPS` goes park, station, market, island, shop, home;
  - `PLACE_WORDS.island` (`{ name: 'One Tree Island', at: 'on One Tree Island', crowd: 'Just you and the animals · no coins' }`);
  - Home's `about`: `'your studio · your keepsakes'`;
  - `map.json`'s `places.island` (pin, label, view) and the picture `island`.

- [ ] **Step 1: Write the failing tests**

Apply to `open-case/test/places.test.js`:

````diff
diff --git a/open-case/test/places.test.js b/open-case/test/places.test.js
index d158af6..4a98b33 100644
--- a/open-case/test/places.test.js
+++ b/open-case/test/places.test.js
@@ -10,21 +10,23 @@ function memory(start = {}) {
   return { data, store: safeStorage({ getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } }) };
 }
 
-test('three places, each with its words for the map, the prompt and the end card, and its crowd', () => {
-  assert.deepEqual(PLACE_IDS, ['park', 'station', 'market']);
+test('four places, each with its words for the map, the prompt and the end card, and its crowd', () => {
+  assert.deepEqual(PLACE_IDS, ['park', 'station', 'market', 'island']);
   for (const id of PLACE_IDS) {
     assert.ok(PLACE_WORDS[id].name && PLACE_WORDS[id].at && PLACE_WORDS[id].crowd, id);
     assert.ok(PLACES[id], id);
   }
   assert.equal(PLACE_WORDS.station.name, 'The Station');
   assert.equal(PLACE_WORDS.market.at, 'at the night market');
+  assert.deepEqual(PLACE_WORDS.island, { name: 'One Tree Island', at: 'on One Tree Island', crowd: 'Just you and the animals · no coins' });
+  assert.equal(PLACES.island.coins, false, 'nobody pays on the island');
   assert.ok(isPlace('market') && !isPlace('pier') && !isPlace(null));
 });
 
 test('the map has two more stops, the shop and home, which are not places to busk', () => {
-  assert.deepEqual(STOPS, ['park', 'station', 'market', 'shop', 'home']);
+  assert.deepEqual(STOPS, ['park', 'station', 'market', 'island', 'shop', 'home']);
   assert.deepEqual(STOP_WORDS.shop, { name: 'The Music Shop', about: 'pedals · instruments' });
-  assert.deepEqual(STOP_WORDS.home, { name: 'Home', about: 'your studio · make your own tracks' });
+  assert.deepEqual(STOP_WORDS.home, { name: 'Home', about: 'your studio · your keepsakes' });
   assert.ok(!isPlace('shop') && !isPlace('home'));
   assert.equal(loadPlace(memory({ 'open-case-place': 'home' }).store), 'park', 'a stored home loads as the park');
   assert.equal(loadPlace(memory({ 'open-case-place': 'shop' }).store), 'park', 'a stored shop loads as the park');
````

Apply to `open-case/test/atlas.test.js`:

````diff
diff --git a/open-case/test/atlas.test.js b/open-case/test/atlas.test.js
index 7f994ca..001abdd 100644
--- a/open-case/test/atlas.test.js
+++ b/open-case/test/atlas.test.js
@@ -40,26 +40,34 @@ test('left and right step through the stops, round from the last to the first',
   assert.equal(stopOf(a), 'station');
   keys(a, 'ArrowRight');
   assert.equal(stopOf(a), 'market');
-  keys(a, 'ArrowRight', 'ArrowRight', 'ArrowRight');
+  keys(a, 'ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight');
   assert.equal(stopOf(a), 'park', 'past home, round to the park');
-  keys(a, 'ArrowLeft', 'ArrowLeft', 'ArrowLeft');
+  keys(a, 'ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft');
   assert.equal(stopOf(a), 'market');
   assert.deepEqual(keys(a, 'ArrowUp', 'ArrowDown', 'Escape', 'KeyA'), [null, null, null, null], 'nothing else does anything with the tracks shut');
 });
 
-test('the shop is the fourth stop and home the fifth: right goes park, station, market, shop, home, park, and left from the park to home', () => {
+test('One Tree Island is the fourth stop, the shop the fifth and home the sixth: right goes park, station, market, island, shop, home, park, and left from the park to home', () => {
   const a = createAtlas({ tracks: trackList(beats()) });
   const seen = [];
-  for (let i = 0; i < 5; i++) { keys(a, 'ArrowRight'); seen.push(stopOf(a)); }
-  assert.deepEqual(seen, ['station', 'market', 'shop', 'home', 'park']);
+  for (let i = 0; i < 6; i++) { keys(a, 'ArrowRight'); seen.push(stopOf(a)); }
+  assert.deepEqual(seen, ['station', 'market', 'island', 'shop', 'home', 'park']);
   keys(a, 'ArrowLeft');
   assert.equal(stopOf(a), 'home');
 });
 
+test('One Tree Island is a place to busk like the others: Enter opens the tracks, or with straightGo goes straight there', () => {
+  for (const straightGo of [false, true]) {
+    const a = createAtlas({ place: 'island', tracks: trackList(beats()), straightGo });
+    assert.equal(stopOf(a), 'island', 'the island chosen last time');
+    assert.deepEqual(keys(a, 'Enter'), [straightGo ? 'go' : 'panel']);
+  }
+});
+
 test('with the shop chosen, Enter and Space go into it, the tracks stay shut, also with straightGo', () => {
   for (const straightGo of [false, true]) {
     for (const code of ['Enter', 'NumpadEnter', 'Space']) {
-      const a = createAtlas({ place: 'market', tracks: trackList(beats()), straightGo });
+      const a = createAtlas({ place: 'island', tracks: trackList(beats()), straightGo });
       keys(a, 'ArrowRight');
       assert.equal(stopOf(a), 'shop');
       assert.equal(atlasKey(a, code), 'shop', `${code}, straightGo ${straightGo}`);
@@ -68,7 +76,7 @@ test('with the shop chosen, Enter and Space go into it, the tracks stay shut, al
   }
 });
 
-test('with home chosen, Enter and Space go into the studio, the tracks stay shut, also with straightGo', () => {
+test('with home chosen, Enter and Space go home, to your room, the tracks stay shut, also with straightGo', () => {
   for (const straightGo of [false, true]) {
     for (const code of ['Enter', 'NumpadEnter', 'Space']) {
       const a = createAtlas({ tracks: trackList(beats()), straightGo });
````

Apply to `open-case/test/map.test.js`:

````diff
diff --git a/open-case/test/map.test.js b/open-case/test/map.test.js
index e745b0d..34d78e8 100644
--- a/open-case/test/map.test.js
+++ b/open-case/test/map.test.js
@@ -33,6 +33,7 @@ test('every picture map.json names is there and lies on the map, the city first,
 });
 
 test("each place to busk has its picture, its name, and its pin, label and view on the map, the pin over the picture", () => {
+  assert.ok(PLACE_IDS.includes('island'), 'One Tree Island among them');
   assert.deepEqual(Object.keys(map.places), [...PLACE_IDS, 'shop', 'home'], 'the stops: the places to busk, the shop, then home');
   for (const id of PLACE_IDS) {
     const p = map.places[id], pic = map.pictures.find((q) => q.name === id), { w, h } = png(id);
````

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL. Seven fail, as the island isn't a place or a stop yet:
- in `places.test.js`: "four places…" and "the map has two more stops…";
- in `atlas.test.js`: the stops' order, Enter on the island, and the shop test that now starts from the island;
- in `map.test.js`: "each place to busk has its picture…".

The other 489 tests pass.

- [ ] **Step 3: The island as a stop, and its picture**

Apply to `open-case/src/places.js`:

````diff
diff --git a/open-case/src/places.js b/open-case/src/places.js
index baf23c7..67d840e 100644
--- a/open-case/src/places.js
+++ b/open-case/src/places.js
@@ -1,17 +1,18 @@
-// The places to busk: the park, the station at rush hour and the night market. Each has its own crowd
-// (tuning.js PLACES, which crowd.js reads) and its own scene (scene.js, render.js). The map (atlas.js)
-// chooses one before each set, and the choice is kept for next time.
-export const PLACE_IDS = ['park', 'station', 'market'];
+// The places to busk: the park, the station at rush hour, the night market and One Tree Island, where
+// animals listen instead of people and nobody pays. Each has its own crowd (tuning.js PLACES, which
+// crowd.js reads) and its own scene (scene.js, render.js). The map (atlas.js) chooses one before each
+// set, and the choice is kept for next time.
+export const PLACE_IDS = ['park', 'station', 'market', 'island'];
 
 // The map's stops, in its order: the places to busk, then the music shop and your home, which opens
-// the studio (neither is a place to busk, so they're never kept as the place, and isPlace('shop') and
+// your room (neither is a place to busk, so they're never kept as the place, and isPlace('shop') and
 // isPlace('home') are false).
 export const STOPS = [...PLACE_IDS, 'shop', 'home'];
 
 // What the map calls the shop and home, and their lines in place of a crowd.
 export const STOP_WORDS = {
   shop: { name: 'The Music Shop', about: 'pedals · instruments' },
-  home: { name: 'Home', about: 'your studio · make your own tracks' },
+  home: { name: 'Home', about: 'your studio · your keepsakes' },
 };
 
 // What the map, the prompt and the end card call each place, and the map's line about its crowd.
@@ -19,6 +20,7 @@ export const PLACE_WORDS = {
   park: { name: 'The Park', at: 'in the park', crowd: 'A bit of everyone · sunset' },
   station: { name: 'The Station', at: 'at the station', crowd: 'Rush hour · in a hurry, tips well' },
   market: { name: 'The Night Market', at: 'at the night market', crowd: 'Browsers stay long · small coins' },
+  island: { name: 'One Tree Island', at: 'on One Tree Island', crowd: 'Just you and the animals · no coins' },
 };
 
 const KEY = 'open-case-place';
````

Apply to `open-case/src/atlas.js`:

````diff
diff --git a/open-case/src/atlas.js b/open-case/src/atlas.js
index 015ed3c..84add33 100644
--- a/open-case/src/atlas.js
+++ b/open-case/src/atlas.js
@@ -38,12 +38,12 @@ export const trackOf = (a) => a.tracks[a.track];
 
 // A key on the map, by its code. Returns what happened, for main.js: 'place' (another stop is chosen),
 // 'panel' (the tracks open), 'track' (another track is chosen), 'go' (busk at the chosen place, to the
-// chosen track), 'shop' (go into the music shop), 'home' (go into the studio), 'back' (the panel
+// chosen track), 'shop' (go into the music shop), 'home' (go home, to your room), 'back' (the panel
 // closes), 'start' (the title was up and is cleared), or null (the key does nothing here).
 //   With the title up, any key but Esc clears it and does nothing else; Esc leaves it up.
 //   Left and right step through the stops, round from the last (home) to the first; Enter or Space
-//   opens the tracks (or goes, with straightGo), or goes into the shop or the studio when that's
-//   chosen, never opening the tracks. With the tracks open, up and down choose one, Enter or Space
+//   opens the tracks (or goes, with straightGo), or goes into the shop or home when that's chosen,
+//   never opening the tracks. With the tracks open, up and down choose one, Enter or Space
 //   goes, and Esc closes them.
 export function atlasKey(a, code) {
   if (a.intro) return code === 'Escape' ? null : clickTitle(a);
````

Apply to `art/open-case/map/layout.py`:

````diff
diff --git a/art/open-case/map/layout.py b/art/open-case/map/layout.py
index f7fe674..d41a884 100644
--- a/art/open-case/map/layout.py
+++ b/art/open-case/map/layout.py
@@ -106,14 +106,15 @@ RAIL = [(970, 300), (900, 300), (830, 300), (760, 300), (712, 300), (692, 300),
 # above its kerb, halfway from the park to the station, where its label fits between theirs. Your
 # home stands at the west end of the first suburb's street, a bit apart from its houses, just above
 # the road to the coast with its gate facing it; its clear ground is no taller than the house and its
-# garden, so the woods come up close behind it.
+# garden, so the woods come up close behind it. One Tree Island is the smaller of the lake's islands
+# (ISLANDS[1]), drawn again over the land's.
 PICTURES = {
     'park': (404, 262, 80, 50), 'station': (604, 270, 92, 52), 'market': (424, 438, 76, 44),
-    'shop': (500, 284, 32, 22), 'home': (192, 323, 30, 20),
+    'island': (812, 116, 12, 8), 'shop': (500, 284, 32, 22), 'home': (192, 323, 30, 20),
     'suburb1': (250, 318, 70, 34), 'suburb2': (790, 420, 70, 34), 'farm': (870, 500, 54, 34),
     'lighthouse': (120, 178, 26, 30), 'marina': (334, 478, 60, 26), 'village': (650, 150, 56, 30),
 }
-PLACES = ['park', 'station', 'market']  # the pictures that are places to busk
+PLACES = ['park', 'station', 'market', 'island']  # the pictures that are places to busk
 STOPS = PLACES + ['shop', 'home']  # the map's stops: the places to busk, the music shop, then your home
 # Where the road and the railway cross the river, on bridges drawn from the side: each deck's left end
 # and its length.
````

Apply to `art/open-case/map/places.py`:

````diff
diff --git a/art/open-case/map/places.py b/art/open-case/map/places.py
index a038c10..9970b5f 100644
--- a/art/open-case/map/places.py
+++ b/art/open-case/map/places.py
@@ -1,8 +1,9 @@
 # Draws the pictures that stand on Open Case's map, at one screen pixel each (twice the land's detail,
 # as Nathan's reference draws its towns), and writes where everything goes:
-#   the three places to busk: the park (a ring of trees round a lawn, a pond, the bandstand), the station
-#     (the glass train shed, its brick front and clock tower, a limestone forecourt with a fountain) and
-#     the night market (striped stalls under lanterns on warm brick, townhouses behind, a boardwalk);
+#   the four places to busk: the park (a ring of trees round a lawn, a pond, the bandstand), the station
+#     (the glass train shed, its brick front and clock tower, a limestone forecourt with a fountain),
+#     the night market (striped stalls under lanterns on warm brick, townhouses behind, a boardwalk) and
+#     One Tree Island (the lake's smaller island again, its one pine, a rowboat pulled up on its shore);
 #   the music shop, on the road into town between the park and the station (a flat over a shopfront
 #     with a striped awning and a guitar in its lit window);
 #   your home, at the west end of the first suburb's street (a cottage with lit windows, smoke from its
@@ -610,6 +611,32 @@ def home():
     back_to_front(items)
     return cv
 
+def island():
+    """One Tree Island, the smaller of the lake's two, drawn again at twice the land's detail over its own:
+    its grass in the land's greens, sunlit on the right, the foam round its edge, its one pine with its
+    shadow, and a rowboat pulled up on its shore."""
+    cv = Canvas(40, 34)
+    cx, cy = 20, 23  # the island's middle, over the land's own
+    GRASS = [(122, 156, 52), (150, 174, 62), (180, 190, 84)]
+    for y in range(cy - 10, cy + 11):
+        for x in range(cx - 16, cx + 17):
+            dx, dy = (x - cx) / 14.5, (y - cy) / 9.5
+            d = dx * dx + dy * dy + (hsh(x, y, 61) - 0.5) * 0.1
+            if d <= 1:
+                cv.put(x, y, (214, 238, 228) if d > 0.78 else step(GRASS, 0.45 + (x - cx) / 30 - (y - cy) / 40 + (hsh(x, y, 62) - 0.5) * 0.3))
+    # the rowboat, its bow up on the grass to the right, its stern in the water
+    bx, by = cx + 6, cy + 3
+    for k, row in enumerate(['..ggggggg..', '.gDDDDDDDg.', 'GGGGGGGGGGG', '.HHHHHHHHH.']):
+        for i, ch in enumerate(row):
+            if ch != '.':
+                cv.put(bx + i, by + k, {'g': (204, 160, 108), 'D': (104, 66, 42), 'G': (166, 112, 72), 'H': (118, 76, 48)}[ch])
+    for i in range(1, 10):
+        cv.put(bx + i, by + 4, (20, 60, 90, 90))
+    cv.line([(bx + 2, by + 1), (bx + 8, by + 1)], (104, 66, 42))
+    cv.line([(bx + 3, by), (bx + 3, by + 1)], (204, 160, 108))  # the seat
+    tree(cv, cx, cy + 1, 6, 812, 'pine')  # over the land's own, a little taller
+    return cv
+
 # ---------------------------------------------------------------------------------------------
 # The settlements without a name
 
@@ -927,7 +954,7 @@ def top_row(cv):
 
 
 pictures = {
-    'park': park(), 'station': station(), 'market': market(), 'shop': shop(), 'home': home(), 'suburb1': suburb(3),
+    'park': park(), 'station': station(), 'market': market(), 'island': island(), 'shop': shop(), 'home': home(), 'suburb1': suburb(3),
     'suburb2': suburb(11), 'village': village(), 'farm': farm(), 'lighthouse': lighthouse(), 'marina': marina(),
 }
 the_city, city_at = city(pictures, masks())
@@ -936,7 +963,7 @@ clouds = {'cloud1': cloud(120, 44, 5), 'cloud2': cloud(90, 34, 9)}
 
 placed = [{'name': 'city', 'x': city_at[0], 'y': city_at[1]}]
 places = {}
-NAMES = {'park': 'The Park', 'station': 'The Station', 'market': 'The Night Market', 'shop': 'The Music Shop', 'home': 'Home'}
+NAMES = {'park': 'The Park', 'station': 'The Station', 'market': 'The Night Market', 'island': 'One Tree Island', 'shop': 'The Music Shop', 'home': 'Home'}
 for name, (cx, by, w, h) in sorted(PICTURES.items(), key=lambda kv: (kv[1][1], kv[0])):
     cv = pictures[name]
     x, y = cx * SCALE - cv.w // 2, by * SCALE - cv.h + 3
````

Then rebuild the map from the repo root (about 40 seconds):

Run: `python3 art/open-case/map/land.py && python3 art/open-case/map/places.py`
Expected: `land: 960x540, 309 colours`, then `places: 15 pictures, 2 clouds`.
- `git status` shows `land.png` and `map.json` changed, and `island.png` new.
- In `map.json`, `places.island` is `{ "name": "One Tree Island", "pin": [1624, 204], "label": [1624, 238], "view": [1624, 201] }`.

- [ ] **Step 4: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 496 tests.

- [ ] **Step 5: Commit**

```bash
git add open-case/src/places.js open-case/src/atlas.js art/open-case/map/layout.py art/open-case/map/places.py open-case/assets/map/land.png open-case/assets/map/map.json open-case/assets/map/island.png open-case/test/places.test.js open-case/test/atlas.test.js open-case/test/map.test.js
git commit -m "Open Case: One Tree Island on the map, a fourth place to busk after the night market, its pine drawn again with a rowboat pulled up on its shore; Home's line says your keepsakes are there

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Wiring it in: your room, keepsakes kept, the birds and the end card

**Files:**
- Modify: `open-case/src/main.js`, `open-case/src/log.js`, `README.md`, `docs/superpowers/specs/2026-10-02-open-case-island-design.md`
- Test: `open-case/test/log.test.js`, and the checks in Chrome below (`main.js` has no Node tests)

**Interfaces:**
- Consumes everything above:
  - `loadKeepsakes`, `saveKeepsakes`, `addFound`, `someKeepsakes`, `keepsake`, `KEEPSAKES` (Task 2);
  - `createRoom`, `roomKey`, `roomClick`, `roomHover` (Task 7);
  - `createStudio(beats, { back })` (Task 7);
  - `ANIMALS_OF`, `animalName` (Task 1);
  - `GIFT_FALL` (Task 3);
  - the `room` screen and `view.inCase` in `render.js` (Tasks 6 and 7);
  - `createSet(..., found)` and the `'keepsake'` event (Task 2).
- Produces: the `room` screen, and `?keepsakes=all` or `?keepsakes=N`. `window.__openCase` gains `room` and `keeps`. A set's log entry on the island has `keepsake`.

- [ ] **Step 1: Write the test**

Apply to `open-case/test/log.test.js`:

````diff
diff --git a/open-case/test/log.test.js b/open-case/test/log.test.js
index 2c17a03..8305c0a 100644
--- a/open-case/test/log.test.js
+++ b/open-case/test/log.test.js
@@ -58,6 +58,13 @@ test('each set logs how many loop layers were recorded in it', () => {
   assert.deepEqual(readLog(s), [{ date: '2026-09-30T20:00:00Z', coins: 25, stopped: 4, instrument: 'electric', pedals: [], layers: 3, choice: 'another' }]);
 });
 
+test('a set on the island logs the keepsake it left, or that none came', () => {
+  const s = memoryStorage();
+  logSet(s, { date: 'a', coins: 0, stopped: 4, place: 'island', keepsake: 'bottlecap' });
+  logSet(s, { date: 'b', coins: 0, stopped: 2, place: 'island', keepsake: null });
+  assert.deepEqual(readLog(s).map((e) => [e.place, e.keepsake]), [['island', 'bottlecap'], ['island', null]]);
+});
+
 test('each set logs where it was played', () => {
   const s = memoryStorage();
   logSet(s, { date: '2026-10-01T18:00:00Z', coins: 14, stopped: 4, beat: 'Funk', place: 'station' });
````

- [ ] **Step 2: Run it**

Run: `cd open-case && npm test`
Expected: PASS, 497 tests. The log keeps whatever a set gives it, so this test passes already: it pins the island's entry, which `main.js` writes in Step 3.

- [ ] **Step 3: Wire it in**

Apply to `open-case/src/main.js`:

````diff
diff --git a/open-case/src/main.js b/open-case/src/main.js
index c87a266..ebf6bbe 100644
--- a/open-case/src/main.js
+++ b/open-case/src/main.js
@@ -7,9 +7,11 @@
 //
 // The game opens on the map (atlas.js, atlasview.js), with the title over it: the sound starts on the
 // first key or click, which only clears the title. Before each set it asks where to busk and what
-// track to play, your last answers already chosen: the park, the station at rush hour or the night
-// market (places.js), each with its own crowd and scene; the music shop is a fourth stop on the map,
-// and your home a fifth, which opens the studio.
+// track to play, your last answers already chosen: the park, the station at rush hour, the night
+// market or One Tree Island (places.js), each with its own crowd and scene; the music shop is a fifth
+// stop on the map, and your home a sixth, which opens your room (room.js): the shelf of keepsakes the
+// island's animals leave you (keepsakes.js), three of which ride in your case, and the desk with
+// the studio.
 // Between sets, the end card leads back to it, or to the music shop: your coins are saved, and your
 // gear (gear.js) changes how your notes sound, wherever you play and while you try things in the shop.
 // Once the loop pedal is yours, R records your notes into a loop (looper.js) that plays on under you;
@@ -19,16 +21,20 @@
 // the end card); ?seed=N (fixes the passers-by, and the park's windows, train and birds); ?bot=random or
 // ?bot=lick (the bot plays the set, audibly); ?sky=N (the place as it is N bars into a set, until a set
 // starts); ?coins=N (your savings are N on this page, and nothing bought on it is kept); ?beat=lofi,
-// bossa, funk, reggae or ballad (every set plays that ready-made beat); ?place=park, station or market
-// (every set is there, with no map, and the place isn't kept); ?studio (the first key opens the
-// studio, and nothing made on it is kept). With any of them, window.__openCase
+// bossa, funk, reggae or ballad (every set plays that ready-made beat); ?place=park, station, market or
+// island (every set is there, with no map, and the place isn't kept); ?studio (the first key opens the
+// studio, and nothing made on it is kept); ?keepsakes=all or N (this page has all 22 keepsakes, or the
+// first N, three of them in your case, and keeps nothing). With any of them, window.__openCase
 // exposes the game for browser checks.
 import { createAudio } from './audio.js';
 import { createInput } from './input.js';
 import { layoutPitches, shopKey } from './keys.js';
 import { createSet, stepSet, playNote, releaseNote, summary, runSet, momentsOf, endTime } from './set.js';
+import { KEEPSAKES, keepsake, loadKeepsakes, saveKeepsakes, addFound, someKeepsakes } from './keepsakes.js';
+import { ANIMALS_OF, animalName } from './animals.js';
+import { createRoom, roomKey, roomClick, roomHover } from './room.js';
 import { crowdSize, personName } from './crowd.js';
-import { createScene, createFlocks, sceneNote, sceneLoopNote, sceneEvents, stepScene, FLIGHT } from './scene.js';
+import { createScene, createFlocks, sceneNote, sceneLoopNote, sceneEvents, stepScene, FLIGHT, GIFT_FALL } from './scene.js';
 import { createRenderer, W, H } from './render.js';
 import { randomBot, lickBot } from './bots.js';
 import { safeStorage } from './storage.js';
@@ -63,9 +69,11 @@ const debugSavings = params.has('coins') ? Math.max(0, Number.parseInt(params.ge
 const fixedBeat = readyBeat(params.get('beat'));
 const tryStudio = params.has('studio');
 const fixedPlace = isPlace(params.get('place')) ? params.get('place') : null;
-const anyDebug = debug || !!bot || fixedSeed !== null || params.has('sound') || params.has('sky') || debugSavings !== null || !!fixedBeat || tryStudio || !!fixedPlace;
-// This page keeps nothing (?coins=N or ?studio): no gear, beats or log is written to storage.
-const keepsNothing = debugSavings !== null || tryStudio;
+const someKept = !params.has('keepsakes') ? null : params.get('keepsakes') === 'all' ? KEEPSAKES.length : Math.max(0, Number.parseInt(params.get('keepsakes'), 10) || 0);
+const anyDebug = debug || !!bot || fixedSeed !== null || params.has('sound') || params.has('sky') || debugSavings !== null || !!fixedBeat || tryStudio || !!fixedPlace || someKept !== null;
+// This page keeps nothing (?coins=N, ?studio or ?keepsakes=): no gear, beats, keepsakes or log is
+// written to storage.
+const keepsNothing = debugSavings !== null || tryStudio || someKept !== null;
 
 const storage = safeStorage();
 const audio = createAudio(storage);
@@ -100,7 +108,7 @@ function game(art, atlasView) {
 
   // On the map, except on the pages that skip it (?studio, ?place=, ?bot=), which open on a title card.
   // The screens: 'title', 'map', 'ready' (waiting for your first note), 'playing', 'paused', 'over',
-  // 'shop', 'studio', 'thanks'.
+  // 'shop', 'studio', 'room', 'thanks'.
   let screen = bot || tryStudio || fixedPlace ? 'title' : 'map';
   // Where you busk: ?place='s, or the place you chose last time on the map (kept unless the page keeps
   // nothing). The map's state while it's up (atlas.js).
@@ -118,6 +126,12 @@ function game(art, atlasView) {
   // The log is Nathan's own: a bot set, a ?coins page or a ?studio page never writes to it. Savings
   // still count up on such a page (earn, below); they're just never kept, same as keep() above.
   const logging = !bot && !keepsNothing;
+  // Your keepsakes (keepsakes.js): the ones the island's animals have left you, and the three in your
+  // case. With ?keepsakes=N the page has the first N; like savings, a keepsake found on a page that
+  // keeps nothing joins your shelf there but isn't kept, and a bot's never joins it.
+  const keeps = someKept !== null ? someKeepsakes(someKept) : loadKeepsakes(storage);
+  const keepKeeps = () => !keepsNothing && saveKeepsakes(storage, keeps);
+  let room = null; // your room's state (room.js) while you're in it
   let shop = null; // the shop's state (shop.js) while you're in it
   // Your beats (studio.js): six slots and the one your sets play, kept like your gear (not on a ?coins
   // or ?studio page). The studio's state while you're in it, and the last change of its beat handed to
@@ -159,7 +173,8 @@ function game(art, atlasView) {
   // A new set begins with a note at audio time `at` (your first note, or the bot's start).
   function begin(at) {
     seed = fixedSeed ?? Date.now() % 2147483647;
-    set = createSet(seed, setBeat(), place);
+    set = createSet(seed, setBeat(), place, keeps.found);
+    audio.birds(place === 'island'); // a dawn chorus on the island
     scene = createScene(seed, { bar: set.clock.bar, parkBar: endTime(set) / PARK.bars, place });
     start = at;
     audio.startBand(at, set.beat);
@@ -317,21 +332,24 @@ function game(art, atlasView) {
     canvas.hidden = true;
     screen = 'map';
   }
-  // At the place chosen, its scene waits for your first note.
+  // At the place chosen, its scene waits for your first note (on the island, with the birds singing).
   function toPlace() {
     scene = createScene(pageSeed, { place });
+    audio.birds(place === 'island');
     screen = 'ready';
   }
   // Into the music shop, from the end card or from the map (its fourth stop). Leaving it opens the
   // map again, on the last place you busked at.
   function openShop() {
     set = null;
+    audio.birds(false); // an island set's birds stop at the door
     shop = createShop(clockOf(setBeat()));
     screen = 'shop';
     sound();
   }
   const beatOf = (key) => (key.ready ? readyBeat(key.ready) : beats.slots[key.slot]) ?? LOFI;
-  // Off the map, to a place, the shop or home: its track and its birds go quiet.
+  // Off the map, to a place, the shop or home: its track and its birds go quiet (the island's and your
+  // room's have their own).
   function leaveMap() {
     audio.stopBand();
     audio.birds(false);
@@ -341,7 +359,7 @@ function game(art, atlasView) {
   }
   // What happened on the map (atlas.js): the track you're on plays softly while the tracks are open
   // (over the birds, who sing throughout); going keeps the place and the track for next time and sets
-  // off to the place; 'shop' goes into the music shop and 'home' into the studio, neither of which is
+  // off to the place; 'shop' goes into the music shop and 'home' into your room, neither of which is
   // kept as the place. 'start' (the title cleared) needs nothing more: the sound's started already.
   function atlasDid(what) {
     if (what === 'panel' || what === 'track') audio.previewBand(audio.now() + 0.1, beatOf(trackOf(atlas).key));
@@ -360,7 +378,7 @@ function game(art, atlasView) {
       openShop();
     } else if (what === 'home') {
       leaveMap();
-      openStudio();
+      openRoom();
     }
   }
   atlasOn.place = (id) => {
@@ -385,7 +403,11 @@ function game(art, atlasView) {
     } else startSound();
     const what = atlasKey(atlas, e.code);
     if (what || e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault(); // no scrolling
-    if (what) atlasDid(what);
+    if (!what) return;
+    // The key that leaves the map is the map's alone: the Enter that goes into the shop mustn't buy
+    // there too, nor the one that goes home put a keepsake in your case.
+    e.stopImmediatePropagation();
+    atlasDid(what);
   });
 
   const input = createInput(window, {
@@ -457,6 +479,14 @@ function game(art, atlasView) {
     for (const e of events) {
       if (e.type === 'layers') for (const { id } of LAYERS) audio.setLayer(id, e.layers[id], start + e.bar * set.clock.bar);
       else if (e.type === 'coin') audio.coin(start + set.t + FLIGHT);
+      else if (e.type === 'keepsake') {
+        audio.coin(start + set.t + GIFT_FALL); // it lands in the case
+        // Yours, unless a bot found it (and kept, unless the page keeps nothing).
+        if (!bot) {
+          addFound(keeps, e.id);
+          keepKeeps();
+        }
+      }
       else if (e.type === 'end') {
         audio.endBand(start + set.t);
         // Stepped to the set's own end time first: a take finishing exactly then still becomes a
@@ -488,20 +518,32 @@ function game(art, atlasView) {
       keep();
     }
     // The log is Nathan's own too, and also skips a ?coins page: see `logging` above.
+    // On the island, nobody pays: the end card says what the animals left you, if anything.
+    const island = set.crowd.place.animals;
     if (logging) {
       const pedals = PEDALS.filter((id) => setPedals.has(id));
-      logSet(storage, { date: new Date().toISOString(), coins: s.coins, stopped: s.stopped, instrument: gear.instrument, pedals, layers: setLayers, beat: set.beat.name, place: set.place });
+      logSet(storage, {
+        date: new Date().toISOString(), coins: s.coins, stopped: s.stopped, instrument: gear.instrument, pedals, layers: setLayers, beat: set.beat.name, place: set.place,
+        ...(island && { keepsake: s.keepsake }),
+      });
     }
     loop = createLoop(); // the loop belongs to the set, and it's over
-    document.getElementById('end-coins').textContent = `${s.coins} coin${s.coins === 1 ? '' : 's'} in the case ${PLACE_WORDS[set.place].at}.`;
+    const left = s.keepsake && keepsake(s.keepsake);
+    document.getElementById('end-coins').textContent = island
+      ? (left ? `${animalName(left.animal)} left you ${left.a}.` : '')
+      : `${s.coins} coin${s.coins === 1 ? '' : 's'} in the case ${PLACE_WORDS[set.place].at}.`;
+    document.getElementById('end-coins').hidden = island && !left;
     document.getElementById('end-saved').textContent = `Saved: ${gear.savings} coin${gear.savings === 1 ? '' : 's'}.`;
     document.getElementById('end-saved').hidden = !!bot;
     document.getElementById('shop').hidden = !!bot;
     document.getElementById('studio').hidden = !!bot;
-    document.getElementById('end-stopped').textContent = `${s.stopped} ${s.stopped === 1 ? 'person' : 'people'} stopped to listen.`;
-    document.getElementById('end-longest').textContent = s.longest
-      ? `${personName(s.longest.kind, art.data.looks[s.longest.kind][s.longest.look])} stayed longest: ${Math.round(s.longest.seconds)} seconds.`
-      : 'Nobody stayed this time.';
+    document.getElementById('end-stopped').textContent = island
+      ? `${s.stopped} animal${s.stopped === 1 ? '' : 's'} stopped to listen ${PLACE_WORDS.island.at}.`
+      : `${s.stopped} ${s.stopped === 1 ? 'person' : 'people'} stopped to listen.`;
+    const longest = s.longest && (island ? animalName(ANIMALS_OF[s.longest.kind][s.longest.look]) : personName(s.longest.kind, art.data.looks[s.longest.kind][s.longest.look]));
+    document.getElementById('end-longest').textContent = longest
+      ? `${longest} stayed longest: ${Math.round(s.longest.seconds)} seconds.`
+      : island ? 'No animal stayed this time.' : 'Nobody stayed this time.';
     document.getElementById('end-debug').hidden = !debug;
     document.getElementById('bots-result').textContent = '';
     if (debug) showLog();
@@ -514,7 +556,8 @@ function game(art, atlasView) {
     const sets = readLog(storage).map((e) => ({
       date: e.date,
       text: `${e.coins} coins, ${e.stopped} stopped, ${[e.instrument ?? 'acoustic', ...(e.pedals ?? [])].join(' + ')}, `
-        + `${e.layers ? `${e.layers} loop layer${e.layers === 1 ? '' : 's'}, ` : ''}${e.beat ? `${e.beat}, ` : ''}${e.place ? `${e.place}, ` : ''}${e.choice ?? 'no choice yet'}`,
+        + `${e.layers ? `${e.layers} loop layer${e.layers === 1 ? '' : 's'}, ` : ''}${e.beat ? `${e.beat}, ` : ''}${e.place ? `${e.place}, ` : ''}`
+        + `${e.keepsake ? `left ${keepsake(e.keepsake)?.a ?? e.keepsake}, ` : ''}${e.choice ?? 'no choice yet'}`,
     }));
     const buys = readBuys(storage).map((e) => ({ date: e.date, text: `bought the ${stockItem(e.id)?.name.toLowerCase() ?? e.id} for ${e.price}` }));
     document.getElementById('log').replaceChildren(...[...sets, ...buys].sort((a, b) => b.date.localeCompare(a.date)).map((e) => {
@@ -546,21 +589,22 @@ function game(art, atlasView) {
   });
 
   // The studio, free to everyone: its beat plays round and round, every part at once, while you make
-  // it. You reach it from the end card's Studio button, or from Home on the map. Esc leaves for the
-  // map, ready for the next set, and so does Busk to this, once it has kept your choice (the map then
-  // only asks where).
+  // it. You reach it from the end card's Studio button, or from the desk in your room. Esc leaves for
+  // the map, ready for the next set (or from your room's desk, back to your room), and Busk to this
+  // leaves for the map, once it has kept your choice (the map then only asks where).
   document.getElementById('studio').addEventListener('click', () => {
     if (logging) logChoice(storage, 'studio');
     openStudio();
   });
-  // Into the studio: from the end card's Studio button, from Home on the map, or with ?studio, from
-  // the title card.
-  function openStudio() {
+  // Into the studio: from the end card's Studio button, from the desk in your room (back: 'room'), or
+  // with ?studio, from the title card.
+  function openStudio(back = 'map') {
     letGoStudio();
     end.hidden = true;
     audio.stopBand();
+    audio.birds(false);
     set = null;
-    studio = createStudio(beats);
+    studio = createStudio(beats, { back });
     studioSeen = studio.version;
     const at = audio.now() + 0.1;
     audio.startBand(at, studio.beat);
@@ -581,10 +625,39 @@ function game(art, atlasView) {
   function leaveStudio(busked = false) {
     keepBeats();
     letGoStudio();
+    const back = studio.back;
     studio = null;
     canvas.style.cursor = '';
-    openMap({ straightGo: busked });
+    if (back === 'room' && !busked) openRoom();
+    else openMap({ straightGo: busked });
+  }
+
+  // Your room, from Home on the map: the shelf of your keepsakes, and the desk with the studio. The
+  // arrow keys or the mouse point at a keepsake or the desk; Enter, Space or a click puts a keepsake in
+  // your case or takes it out (and keeps that), or opens the studio from the desk. Esc or the map key
+  // goes back to the map. The birds sing through the window.
+  function openRoom() {
+    set = null;
+    room = createRoom();
+    audio.birds(true);
+    screen = 'room';
   }
+  function roomDid(what) {
+    if (what === 'case') keepKeeps();
+    else if (what === 'map' || what === 'studio') {
+      room = null;
+      canvas.style.cursor = '';
+      if (what === 'map') openMap();
+      else openStudio('room');
+    }
+  }
+  addEventListener('keydown', (e) => {
+    if (screen !== 'room' || e.metaKey || e.ctrlKey || e.altKey) return;
+    if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault(); // no scrolling
+    if (e.repeat && !e.code.startsWith('Arrow')) return;
+    e.stopImmediatePropagation(); // the Enter that opens the studio is the room's alone
+    roomDid(roomKey(room, keeps, e.code, pageTime()));
+  });
   const bandTime = () => audio.now() - audio.bandStart;
   // The browser's own uses of the studio's keys are kept off: Cmd+S would save the page, and while
   // you name a beat, Space would scroll, Enter press a button, and ' or / open Firefox's quick find.
@@ -669,6 +742,7 @@ function game(art, atlasView) {
     return screen === 'shop' ? hit(art.data.shop, shop, gear, ((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H) : null;
   };
   canvas.addEventListener('click', (e) => {
+    if (screen === 'room') return roomDid(roomClick(art.data.room, room, keeps, ...scenePoint(e), pageTime()));
     const target = inShop(e);
     if (target?.hit === 'item') {
       choose(shop, target.at);
@@ -677,13 +751,16 @@ function game(art, atlasView) {
     else if (target?.hit === 'door') leaveShop();
   });
   canvas.addEventListener('mousemove', (e) => {
-    canvas.style.cursor = inShop(e) ? 'pointer' : '';
+    if (screen === 'room') canvas.style.cursor = roomHover(art.data.room, room, ...scenePoint(e)) ? 'pointer' : '';
+    else canvas.style.cursor = inShop(e) ? 'pointer' : '';
   });
 
   document.getElementById('bots').addEventListener('click', () => {
-    // On the beat your set played, so the bots and you are compared on the same beat.
-    const r = runSet(seed, randomBot(seed, set.beat), set.beat, set.place).coins, l = runSet(seed, lickBot(seed, set.beat), set.beat, set.place).coins;
-    document.getElementById('bots-result').textContent = `Random bot: ${r}. Lick bot: ${l}. You: ${set.coins}.`;
+    // On the beat your set played, so the bots and you are compared on the same beat; on the island,
+    // by the animals' fondness, as nobody pays there.
+    const what = set.crowd.place.coins === false ? 'fondness' : 'coins', said = what === 'coins' ? '' : ` ${what}`;
+    const r = runSet(seed, randomBot(seed, set.beat), set.beat, set.place)[what], l = runSet(seed, lickBot(seed, set.beat), set.beat, set.place)[what];
+    document.getElementById('bots-result').textContent = `Random bot: ${r}${said}. Lick bot: ${l}${said}. You: ${set[what]}${said}.`;
   });
 
   if (anyDebug) {
@@ -693,6 +770,8 @@ function game(art, atlasView) {
       get scene() { return scene; },
       get shop() { return shop; },
       get studio() { return studio; },
+      get room() { return room; },
+      keeps,
       get atlas() { return atlas; },
       get place() { return place; },
       beats,
@@ -758,7 +837,7 @@ function game(art, atlasView) {
         screen: screen === 'thanks' || screen === 'over' ? 'playing' : screen,
         set, scene, keys: input.keys, t: set ? set.t : studio ? bandTime() : shop?.loop ? audio.now() - start : 0,
         bars: set ? set.t / (endTime(set) / PARK.bars) : skyBar, studio,
-        time: (now - t0) / 1000, still: reducedMotion.matches, flocks, gear, stomp: stomped, shop,
+        time: (now - t0) / 1000, still: reducedMotion.matches, flocks, gear, stomp: stomped, shop, room, keeps, inCase: keeps.inCase,
         loop: shop ? shop.loop : set ? loop : null, loopSaid,
         busking: setBeat().name, teach: !taught,
         debug: debug ? latency : null,
````

Apply to `open-case/src/log.js`:

````diff
diff --git a/open-case/src/log.js b/open-case/src/log.js
index edbd80e..3801010 100644
--- a/open-case/src/log.js
+++ b/open-case/src/log.js
@@ -1,6 +1,7 @@
 // The test log: this computer remembers the last LOG_SIZE sets (the date, coins, how many stopped, the
 // instrument played, the pedals that were on at any point, how many loop layers were recorded, the
-// beat played, where, and whether Nathan chose Another set, Stop here, Visit the shop or Studio), under
+// beat played, where, on One Tree Island the keepsake left, and whether Nathan chose Another set, Stop
+// here, Visit the shop or Studio), under
 // open-case-log in local storage; and the last LOG_SIZE things he bought, with their dates, under
 // open-case-buys.
 import { LOG_SIZE } from './tuning.js';
@@ -19,8 +20,8 @@ function readList(storage, key) {
 export const readLog = (storage) => readList(storage, KEY);
 export const readBuys = (storage) => readList(storage, BUYS);
 
-// A set just ended: { date, coins, stopped, instrument, pedals, layers, beat, place }. Its choice is filled
-// in when a button is pressed.
+// A set just ended: { date, coins, stopped, instrument, pedals, layers, beat, place }, and on the island
+// keepsake (the id of the one left, or null). Its choice is filled in when a button is pressed.
 export function logSet(storage, entry) {
   const list = readLog(storage);
   list.push({ ...entry, choice: null });
````

Apply to `README.md`:

````diff
diff --git a/README.md b/README.md
index cc528ec..7e389e3 100644
--- a/README.md
+++ b/README.md
@@ -77,21 +77,22 @@ That writes the editable `art/snake-icon.aseprite` and the `snake/icon.png` the
 
 ## Open Case
 
-`open-case/` is a busking game, a work in progress. You improvise on the computer keyboard, laid out like GarageBand's Musical Typing, over the band's beat, and passers-by stop, stay and tip according to what you play. The game opens on a map of the city (painted after a friend's atlas), with a title over the first map of each visit that any key or click clears (and starts the sound); before each set it asks where to busk and what to play: the park at sunset, the station at rush hour (commuters come in waves off each train, in a hurry, and tip well) or the night market (slow browsers who stay long, for smaller coins), to one of five ready-made tracks or one of your own. Birds sing on the map, quietly, made live like the rest of the game's sound. The keys are shown on the first set's waiting screen, and again on the pause card (Esc); the try-out pages (`?studio`, `?place=`, `?bot=`), which skip the map, keep a small press-any-key card. Four kinds walk by, joggers, elders, students and commuters, each with their own taste, and six different people of each kind. Repeating yourself bores them, off-key notes on strong beats make them frown, and an earlier idea brought back changed earns a coin. The band gains layers as the crowd grows. The coins you earn are saved, and between sets a music shop (also a fourth stop on the map, between the park and the station: choose it and press Enter) sells five pedals, which you stomp on keys 2 to 6 while you play, four more instruments, and a loop pedal: R records 4 bars of your notes that play on under you, up to three layers, and Backspace takes the last one off. The studio is free from the start: Home, the fifth stop on the map (the house at the west end of the street in its bottom left; choose it and press Enter), opens it, as does the Studio button on the end card. In it you make your own beats to busk to the way Figure makes them: pick a rhythm, hold the pad, and it's written into the loop as it goes round. Each part has a choice of sounds, eight drum kits (lo-fi, brushes, funk, reggae, 808, hand drums, house and rock), seven basses and nine chord sounds, and the sound key steps through them (its left end back, its right end on). It comes with five ready-made beats (lo-fi, bossa nova, funk, reggae and a slow ballad), keeps six of your own (Save names one), and "Busk to this" picks the beat your sets play and takes you to the map. A "map" key in its bottom left corner (or Esc) goes back to the map. The design spec is `docs/superpowers/specs/2026-09-28-open-case-design.md`, the shop's is `docs/superpowers/specs/2026-09-28-open-case-shop-design.md`, the loop pedal's is `docs/superpowers/specs/2026-09-29-open-case-loop-pedal-design.md`, the passers-by's is `docs/superpowers/specs/2026-09-29-open-case-passers-by-design.md`, the studio's is `docs/superpowers/specs/2026-09-30-open-case-studio-design.md`, and the places' and the map's is `docs/superpowers/specs/2026-10-01-open-case-places-design.md`.
+`open-case/` is a busking game, a work in progress. You improvise on the computer keyboard, laid out like GarageBand's Musical Typing, over the band's beat, and passers-by stop, stay and tip according to what you play. The game opens on a map of the city (painted after a friend's atlas), with a title over the first map of each visit that any key or click clears (and starts the sound); before each set it asks where to busk and what to play: the park at sunset, the station at rush hour (commuters come in waves off each train, in a hurry, and tip well), the night market (slow browsers who stay long, for smaller coins) or One Tree Island, the little island in the lake, at sunrise, to one of five ready-made tracks or one of your own. On the island you play alone, squeezed under its one pine: animals come instead of people (a fox trotting along the shore, a heron wading, a crow in the pine, eleven of them), each liking what one kind of town listener likes, and nobody pays. Instead, now and then an animal that liked your playing leaves a keepsake in your case: always one after your first set there, then about one good set in four. There are twenty-two to find, two from each animal. Birds sing on the map, quietly, made live like the rest of the game's sound. The keys are shown on the first set's waiting screen, and again on the pause card (Esc); the try-out pages (`?studio`, `?place=`, `?bot=`), which skip the map, keep a small press-any-key card. Four kinds walk by, joggers, elders, students and commuters, each with their own taste, and six different people of each kind. Repeating yourself bores them, off-key notes on strong beats make them frown, and an earlier idea brought back changed earns a coin. The band gains layers as the crowd grows. The coins you earn are saved, and between sets a music shop (also a fourth stop on the map, between the park and the station: choose it and press Enter) sells five pedals, which you stomp on keys 2 to 6 while you play, four more instruments, and a loop pedal: R records 4 bars of your notes that play on under you, up to three layers, and Backspace takes the last one off. Home, the sixth stop on the map (the house at the west end of the street in its bottom left; choose it and press Enter), opens your room: the keepsakes you've found sit on a shelf there (point at one for its story, or at an empty cubby for a hint about who brings it), and Enter puts one in your case or takes it out, where up to three ride in the lid wherever you busk. The studio is free from the start: the desk in your room opens it, as does the Studio button on the end card. In it you make your own beats to busk to the way Figure makes them: pick a rhythm, hold the pad, and it's written into the loop as it goes round. Each part has a choice of sounds, eight drum kits (lo-fi, brushes, funk, reggae, 808, hand drums, house and rock), seven basses and nine chord sounds, and the sound key steps through them (its left end back, its right end on). It comes with five ready-made beats (lo-fi, bossa nova, funk, reggae and a slow ballad), keeps six of your own (Save names one), and "Busk to this" picks the beat your sets play and takes you to the map. A "map" key in its bottom left corner (or Esc) goes back to the map, or "room" back to your room if you came from its desk. The design spec is `docs/superpowers/specs/2026-09-28-open-case-design.md`, the shop's is `docs/superpowers/specs/2026-09-28-open-case-shop-design.md`, the loop pedal's is `docs/superpowers/specs/2026-09-29-open-case-loop-pedal-design.md`, the passers-by's is `docs/superpowers/specs/2026-09-29-open-case-passers-by-design.md`, the studio's is `docs/superpowers/specs/2026-09-30-open-case-studio-design.md`, the places' and the map's is `docs/superpowers/specs/2026-10-01-open-case-places-design.md`, and One Tree Island's and the keepsakes' is `docs/superpowers/specs/2026-10-02-open-case-island-design.md`.
 
-- Tests (Node 22, no dependencies): `cd open-case && npm test`. The headline test plays a scripted honest set against a random bot and a lick bot over ten seeds, and another checks that every place pays an honest set about the same. The art tests check the committed sprite sheet and map against what the game draws.
+- Tests (Node 22, no dependencies): `cd open-case && npm test`. The headline test plays a scripted honest set against a random bot and a lick bot over ten seeds, another checks that every place pays an honest set about the same, and another that the island leaves the honest set a keepsake about one time in four over 200 seeds, and the bots almost never. The art tests check the committed sprite sheet and map against what the game draws.
 - Debug:
   - `?sound` is the sound check: the band with a switch per layer and a choice of the ready-made beats, and every instrument and pedal in the shop to try on the keys, the loop pedal too.
   - `?debug` shows each listener's interest and the last rule they heard, and a corner panel with the audio delay. On the end card it adds Run the bots and the test log.
-  - `?seed=N` fixes the passers-by, the station's trains, and the park's windows, train and birds.
-  - `?bot=random` or `?bot=lick` plays a whole set by itself.
-  - `?sky=N` shows the place as it is N bars into a set (until a set starts), to check the sunset, the station's clock or the market's lanterns without playing three minutes.
+  - `?seed=N` fixes the passers-by (or the island's animals), the station's trains, and the park's windows, train and birds.
+  - `?bot=random` or `?bot=lick` plays a whole set by itself. A keepsake one leaves on the island shows, but isn't yours.
+  - `?sky=N` shows the place as it is N bars into a set (until a set starts), to check the sunset, the station's clock, the market's lanterns or the island's sunrise without playing three minutes.
   - `?coins=N` sets your savings to N on that page, to try the shop. Nothing done on it is kept or logged, beats made in the studio included.
   - `?beat=lofi` (or `bossa`, `funk`, `reggae`, `ballad`) makes every set play that ready-made beat.
-  - `?place=park` (or `station`, `market`) makes every set happen there, with no map, and isn't kept.
+  - `?place=park` (or `station`, `market`, `island`) makes every set happen there, with no map, and isn't kept.
   - `?studio` opens the studio on the first key, to try it without the map. Like `?coins=N`, nothing done on it is kept or logged.
-- Tuning: the rules, the crowd, the tips and the feel are in `open-case/src/tuning.js`, and so are each place's crowd (`PLACES`), the park's sunset and background timings (`PARK`), the station's clock and trains (`STATION`), the night market's lanterns (`MARKET`), and the shop's prices and pedal keys (`SHOP`), the loop pedal's length, layers and allowance for early notes (`LOOP`), and the studio's slots, undo and timing (`STUDIO`). The beats themselves (the five ready-made ones, the keys, the chords and the sounds each part can have) are in `open-case/src/beats.js`, and the studio's rhythms in `rhythms.js`. The sounds (the band, each instrument and each pedal, the loop's level and the safety before the speakers) are in `open-case/src/audio.js`, and a few view timings are in `scene.js` and `render.js`.
-- Art: flat colour, no outlines, no dithering, the look Nathan picked from a reference picture. The game draws from one sprite sheet, `open-case/assets/sprites.png`, with its frame and layout data in `sprites.json`. `art/open-case/sprites.lua` writes both from the shared drawing code: `draw.lua` (the park, you and your things), `figures.lua` (the passers-by, six people of each kind drawn from parts, their reactions, the pigeons and the birds), `gear.lua` (you with each instrument, your pedals and the loop pedal, the amp and the gear strip's icons), `shop.lua` (the music shop), `station.lua` (the station: its hall, the train and the platform) and `market.lua` (the night market: its stalls, lanterns, brick street and cat). `palette.lua` holds every colour, at most 64. The style sample and the tab icon have scripts there too. Rebuild everything from the repo root (it's deterministic: an unchanged script rebuilds its files byte for byte):
+  - `?keepsakes=all` (or `?keepsakes=N`) gives that page all 22 keepsakes (or the first N), the first three in your case, to try your room and the case's lid. Like `?coins=N`, nothing done on it is kept or logged.
+- Tuning: the rules, the crowd, the tips and the feel are in `open-case/src/tuning.js`, and so are each place's crowd (`PLACES`), the park's sunset and background timings (`PARK`), the station's clock and trains (`STATION`), the night market's lanterns (`MARKET`), One Tree Island's sunrise and where its animals cross and settle (`ISLAND`), the keepsakes' odds and how many your case holds (`KEEPSAKE`), and the shop's prices and pedal keys (`SHOP`), the loop pedal's length, layers and allowance for early notes (`LOOP`), and the studio's slots, undo and timing (`STUDIO`). The beats themselves (the five ready-made ones, the keys, the chords and the sounds each part can have) are in `open-case/src/beats.js`, and the studio's rhythms in `rhythms.js`. The sounds (the band, each instrument and each pedal, the loop's level and the safety before the speakers) are in `open-case/src/audio.js`, and a few view timings are in `scene.js` and `render.js`.
+- Art: flat colour, no outlines, no dithering, the look Nathan picked from a reference picture. The game draws from one sprite sheet, `open-case/assets/sprites.png`, with its frame and layout data in `sprites.json`. `art/open-case/sprites.lua` writes both from the shared drawing code: `draw.lua` (the park, you and your things), `figures.lua` (the passers-by, six people of each kind drawn from parts, their reactions, the pigeons and the birds), `gear.lua` (you with each instrument, your pedals and the loop pedal, the amp and the gear strip's icons), `shop.lua` (the music shop), `station.lua` (the station: its hall, the train and the platform) `market.lua` (the night market: its stalls, lanterns, brick street and cat), `island.lua` (One Tree Island at sunrise: the far shore, the lake, the mist, the fish, the island and its pine), `animals.lua` (its eleven animals, crossing, settled and keeping the beat), `keepsakes.lua` (the twenty-two keepsakes, for the shelf and the case's lid) and `room.lua` (your room). `palette.lua` holds every colour, at most 64. The style sample and the tab icon have scripts there too. Rebuild everything from the repo root (it's deterministic: an unchanged script rebuilds its files byte for byte):
 
   ```sh
   for s in sprites icon style-sample; do /Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/$s.lua; done
````

Apply to `docs/superpowers/specs/2026-10-02-open-case-island-design.md`:

````diff
diff --git a/docs/superpowers/specs/2026-10-02-open-case-island-design.md b/docs/superpowers/specs/2026-10-02-open-case-island-design.md
index 05ba787..3912e0b 100644
--- a/docs/superpowers/specs/2026-10-02-open-case-island-design.md
+++ b/docs/superpowers/specs/2026-10-02-open-case-island-design.md
@@ -1,7 +1,7 @@
 # Open Case: One Tree Island and keepsakes (design spec)
 
 **Date:** 2026-10-02
-**Status:** Nathan agreed the design in chat, one part at a time ("yes that looks right"), and approved this spec ("go ahead and continue"). Then, seeing the prototype, he asked for two changes, which this version has:
+**Status:** Nathan agreed the design in chat, one part at a time ("yes that looks right"), and approved this spec ("go ahead and continue"). It's built as `docs/superpowers/plans/2026-10-02-open-case-island.md`, and what the build settled is at the end. Then, seeing the prototype, he asked for two changes, which this version has:
 - **The land runs off the screen:** "can you make the land extend to outside of the frame, right now the animals cross from the water and its a bit weird". The island's grass now runs across the screen, and the land animals walk along it instead of floating over the water.
 - **The room's window shows woods:** "where the house is there are trees and no water.. so it should show trees". It looked out on the lake before.
 
@@ -305,6 +305,50 @@ They're only for looks, and the crowd doesn't notice them, just as your gear onl
 
 Nathan picks One Tree Island on the map and rows out. As the mist lifts, a duck family paddles by, the fox trots along the shore and settles on the grass beside him, its tail swaying to his groove, and a crow lands in the pine. At the end, a blackberry drops into his case. At home, it sits on his shelf, the first of 22, and in his case's lid at the park the next evening. Later island sets mostly give nothing, until one morning the crow leaves a gold ring.
 
+## What the build settled
+
+- **Where the animals cross and settle** (`ISLAND` in `tuning.js`):
+  - **Lines:** the land animals walk along the island at y 146, where people walk the park's path; the swimmers cross the lake at y 124, behind the reeds, the rock and the rowboat on the shore; and the birds fly high up, at y 40.
+  - **The eleven spots:**
+    - the pine's branches: the low left tip (122, 93), the middle right (190, 77) and the upper left (138, 61);
+    - the grass round you: (70, 158), (96, 165), (196, 165) and (228, 158);
+    - the shallows: (52, 134) and (214, 134);
+    - the rock: (290, 133);
+    - the lily pad: (22, 136).
+  - **Which spot:** the turtle takes the rock, or if it's taken, the nearest shallows. The frog only takes the lily pad.
+- **The squirrel** hops along the land like the others, then up to its branch in the pine.
+- **The numbers:**
+  - Over seeds 1 to 200, the honest set wins 17 to 80 fondness a set, and the random bot and the lick bot almost none.
+  - `KEEPSAKE` is a chance of 0.22 at 30 fondness or more, less below. With one keepsake found, the honest set is left one in 26% of sets, a set in key that never brings an idea back in 5%, and the random bot and the lick bot in none.
+- **The sunrise:**
+  - **The sky** keeps the evening's timing in reverse, so the horizon lightens first. Its five stages are the dusk's colours, then the morning's blues.
+  - **The far shore's pines and the lake** follow the horizon's band.
+  - **The sun** rises 44 pixels from bar 4 to bar 50, and once it's up, it glints on the water below it.
+  - **The mist** is four streaks, and one lifts every 10 bars, the nearest first, so it's gone at bar 40.
+  - **The fish** is out of the water for 0.8 s, then splashes for 0.5 s.
+- **A keepsake dropping in:**
+  - It falls from 70 pixels above the case for 0.8 s and lands where the coins do, with a coin's clink, then twinkles there until the end card.
+  - **The case's lid** shows 5 × 5 versions, which fit its lining better than the 6 × 6 the spec planned.
+- **Your room:**
+  - **The look:** a teal wall, a window onto the woods behind the house, the shelf with 11 columns by 2 rows of 14-pixel cubbies, and on the right a desk with the groovebox, a mug and a lamp. A rug and a plant fill the rest.
+  - **The card** runs along the bottom, as in the shop.
+  - **Marks:** a keepsake in your case has a 2 × 2 gold mark at its cubby's top right. The pointer is a gold frame, or a gold arrow over the groovebox for the desk.
+  - **The arrow keys:** right from the end of a row goes to the desk.
+  - **The words:** "in your case: enter to take it out" and "enter to put it in your case". A missing keepsake's hint reads "Something from the fox" over "the fox likes the groove", and for a special one, "Something special from the crow". The crow and the owl like "a tune brought back".
+- **The end card on the island:**
+  - **The place:** "4 animals stopped to listen on One Tree Island." carries the place, since the coins line is gone.
+  - **Nobody stayed:** "No animal stayed this time."
+  - **?debug's Run the bots** compares fondness.
+- **The birds** sing from the island's waiting screen through the set and its end card. They're quiet in the shop and the studio, and sing again in your room.
+- **A fix that came with it:**
+  - **The live bug:** the Enter that chose the music shop on the map also bought the first item there, if you had the coins.
+  - **The fix:** now a key that leaves the map is the map's alone. Without it, the Enter that goes home would have taken your first keepsake straight back out of your case.
+- **`?keepsakes=`** keeps nothing, as `?coins=` doesn't. A keepsake found on such a page joins its shelf only for that page. A bot's never does.
+- **The art:**
+  - **Colours:** six join the palette (the morning sky's three blues, the lake's two, and the mist), making 61.
+  - **The sheet** has 801 frames and comes to about 160 KB.
+  - **The map:** its picture of the island draws it and its pine again at twice the land's detail, with the rowboat on its right shore. The map comes to 448 KB.
+
 ## Not in this change
 
 - Wearing keepsakes (a feather in your beanie), and a big end-card moment for a find.
````

- [ ] **Step 4: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 497 tests.

- [ ] **Step 5: Check it in Chrome**

Serve the repo root: `python3 -m http.server 8123 --bind 127.0.0.1` (from the repo root), then use a browser you can drive (Playwright). Every page with a `?` option exposes `window.__openCase`. Check each of these, and report what you saw:
1. **The map:** on `/open-case/?debug`, press a key to clear the title, then press right three times. One Tree Island is chosen, with its label and "Just you and the animals · no coins", and its pin over the island in the lake. Right twice more to Home, whose line reads "your studio · your keepsakes".
2. **Enter on the music shop and on Home:**
   - On `/open-case/?coins=500`, choose the shop (right four times) and press Enter. `__openCase.screen` is `'shop'` and `__openCase.gear.savings` is still 500: nothing was bought.
   - On `/open-case/?keepsakes=7`, choose Home (right five times) and press Enter. `__openCase.screen` is `'room'` and `__openCase.keeps.inCase` is still `['dandelion', 'clover', 'feather']`.
3. **Your room** (that page):
   - The window looks out on the woods. The shelf shows 7 keepsakes, 15 outlines and "7 of 22", with gold marks on the first three. The card names the dandelion clock and says "in your case: enter to take it out".
   - Right twice to the acorn, then Enter: the card says "your case holds three, take one off first" in red for two seconds, and `inCase` is unchanged.
   - Left twice, then Enter: the dandelion clock comes out.
   - Right until the gold arrow is over the groovebox, then Enter: the studio opens with "room" on its corner key (`__openCase.studio.back === 'room'`).
   - Esc goes back to the room, and Esc again to the map.
4. **A set on the island:** `/open-case/?place=island&seed=3&debug`, press a key, then play a few notes. It's before dawn: a dark sky and the mist on the lake behind you. The land animals walk along the island, past the pine's trunk, and the swimmers come by on the lake. `?debug`'s panel says "fondness", not "coins".
5. **A bot's whole set on the island:** on `/open-case/?place=island&bot=random&seed=5&debug`, first clear `localStorage['open-case-keepsakes']` and reload, so that it's a first set there. Then press a key and wait out the set: about 3 minutes, so poll `__openCase.screen` for `'over'`.
   - As it ends, a keepsake (the crunchy leaf) drops into the case and sparkles there. The sky is morning blue and the sun is up.
   - The end card says "The hedgehog left you a crunchy leaf.", "0 animals stopped to listen on One Tree Island." and "No animal stayed this time."
   - `__openCase.keeps.found` is still `[]`: a bot's keepsake isn't yours.
6. **Your own whole set on the island:** on `/open-case/?place=island&seed=3`, clear `localStorage['open-case-keepsakes']` again and reload. Press a key, play one note (A), and wait out the set.
   - The end card says "The frog left you a water lily."
   - `__openCase.keeps` is `{ found: ['lily'], inCase: ['lily'] }`, since your first goes in your case by itself. `localStorage['open-case-keepsakes']` has it, and the log's last entry has `place: 'island'` and `keepsake: 'lily'`.
   - **The birds:** wrap `__openCase.audio.birds` to note each call (`const b = a.birds; a.birds = (on) => { calls.push(on); b(on); }`). Click "Visit the shop": it's called with `false`. Press Esc: you're back at the island's waiting screen, and it's called with `true`.

- [ ] **Step 6: Commit**

```bash
git add open-case/src/main.js open-case/src/log.js open-case/test/log.test.js README.md docs/superpowers/specs/2026-10-02-open-case-island-design.md
git commit -m "Open Case: One Tree Island wired in: Home opens your room, keepsakes are kept and ride in your case, birds sing on the island and at home, the end card says what the animals left you, ?keepsakes= tries it out, and a key that leaves the map no longer buys in the shop too

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```
