# Open Case Passers-by Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Open Case's passers-by look like different people. Each of the four kinds (jogger, elder, student, commuter) keeps its taste and its sign, and gets six looks, three women and three men, dealt like cards from a random stream of their own.

**Architecture:**
- The old man's kind is renamed the elder (`elder` in code), since half of them are now women. No number changes.
- `crowd.js` deals each arriving person a look (0 to 5) from a second seeded stream. The first stream's draws don't move, so every set's kinds, sides, budgets and arrival times stay as they were. It keeps a deck per kind: an arrival takes the first look in the deck that no one on screen is wearing.
- The art scripts draw each look from parts: the kind's body with its sign, a hair style and a face, with colours swapped in by letter. The sheet gains frames named `<kind>-<look>-…` and a `looks` list saying which are women and which men.
- `render.js` names the person's look in their frame. `main.js` names who stayed longest by kind and look: "An old woman stayed longest".

**Tech Stack:** Plain ES modules, Canvas 2D, Node 22 `node --test` (no dependencies), and Aseprite 1.3 in batch mode for the art scripts (Lua).

**Spec:** `docs/superpowers/specs/2026-09-29-open-case-passers-by-design.md`. Nathan picked "same tastes, new people", agreed the design in chat, and asked for this spec and plan. It builds on the game's design spec (`2026-09-28-open-case-design.md`) and the art spec (`2026-09-28-open-case-art-design.md`).

**Prototyped:** everything below was built and run before this plan was written, in a scratch copy of the repo. It was then replayed task by task, and each task's end state passes the whole suite:
- 222 tests after Task 1, 227 after Task 2, and 229 after Tasks 3 and 4 (222 before);
- the sprite sheet: 550 frames, 49 colours, 74 KB, rebuilt byte for byte.

Checked by eye in the line-up preview and in Chrome:
- a bot's set, and a set where everyone who heard you stopped: six different people standing round you, women and men;
- the end card saying "An old woman stayed longest".

The code in each task is that prototype's code, so transcribe it exactly.

## Global Constraints

- Every commit message starts `Open Case: ` and ends with a blank line and then `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`, exactly that line, whatever model you are.
- Stage only the files your task names (`git add <paths>`), never `git add -A` or `git add .`.
- No new dependencies: plain ES modules, Node 22's `node --test`. Run the tests with `cd open-case && npm test`.
- Aseprite runs from the repo root: `/Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/<name>.lua`. The scripts are deterministic, so a second run leaves `git status` unchanged. Previews (`art/open-case/preview-*`) are never committed.
- Flat style: every area one solid colour from `art/open-case/palette.lua`, a base and at most one shadow per material, no outlines, no dithering, no half-clear pixels. The whole game's art stays within **64 colours** and **under 400 KB** (`sprites.png`, `sprites.json` and `icon.png` together).
- **The rules don't change.** Tastes, speeds, patience and tips keep their values under the new names (`CROWD.kinds.elder`, `RULES.elderRest`, `TIPS.happyElder`). The crowd's first stream (`c.rng`) makes exactly the draws it made before, in the same order: kind, side, budget, then the next arrival's time.
- **Looks come from their own stream,** `createRng((seed ^ 0x9e3779b9) >>> 0)`, and only the picture and the end card's words use them.
- **Six looks a kind (`LOOKS` = 6), three women and three men.** Frames are `<kind>-<look>-walk-<0-3>-<left|right>`, `<kind>-<look>-stand-<0-1>-<left|right>` and `<kind>-<look>-nod-<0-1>-<left|right>`: 16 a person, 384 in all. `sprites.json`'s `looks` gives each kind's looks in order, each `"woman"` or `"man"`.
- **Each kind keeps its sign:** the jogger's running kit and white sneakers; the elder's cane and knee-length coat; the student's headphones and yellow backpack; the commuter's suit and briefcase.
- **Everyone fits the figure's box:** 16 pixels across and 46 tall, feet at the same place, and nothing above the head's top row (45 rows over the feet), so reaction bubbles stay clear. A ponytail or bun may stick out behind.
- **No passer-by wears a top hat or a red scarf:** those are the regular's. `F.oldMan` stays as it is, for the regular in the style sample and the Regulars feature.
- The positions from the art repaint stay: passers-by walk at `PATH_Y` 146, listeners stand at `CROWD.spots`, and coins land at `CASE` (161, 160).
- Plain words in comments and messages, in the style of the surrounding code; comment lines wrap at about 100 characters.

## Review Focus

The cases most likely to go wrong that the spec implies. Each is pinned by a test or a check in the task named.
- **Every look at every listener spot, facing you, clear of the case and the pedals.** That includes a ponytail or long hair on the side away from you. (Task 3: the art tests check all 24 people at all six spots.)
- **A full crowd of one kind that all stay.** No two look the same, and a deck whose every remaining look is being worn is refilled early. (Task 2: "no two people on screen look the same, even when everyone stays", and the refill test.)
- **The seed's crowd is untouched.** Seed 7's first twelve arrivals keep the kinds, sides, budgets and times they had before looks. (Task 2: pinned against the old code's values.)
- **The regular still draws.** `style-sample.lua` runs and writes its previews, since `F.oldMan` and its parts stay. (Task 3, Step 6.)
- **The sheet rebuilds byte for byte,** so a second run changes nothing. (Task 3, Step 6.)

## Settled in the prototype

- **The looks,** in order (look 0 first). "Navy" is the palette's deep blue, and "jeans" are charcoal or blue:

| Kind | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| jogger | woman, dark brown ponytail, tan, teal top, charcoal leggings | woman, short puff and white headband, deep brown, yellow top, black shorts | woman, blonde ponytail under a charcoal cap, light, rose top, grey leggings | man, black hair and white headband, light, red top, black shorts (the first jogger) | man, buzz cut, brown, blue top, grey shorts | man, dark brown curls, tan, green top, black shorts |
| elder | man, flat cap and white beard, light, brown coat (the first old man) | woman, grey bun, tan, green coat | woman, short white curls, deep brown, violet coat | man, bald with a grey beard, brown, blue coat | woman, rose headscarf, brown, camel coat | man, short white hair, light, charcoal coat |
| student | man, short black hair, brown, blue hoodie, charcoal jeans (the first student) | woman, long black hair, light, grey hoodie, blue jeans | woman, box braids, deep brown, teal top, denim skirt | man, locs, deep brown, red hoodie, charcoal jeans | woman, pink bob, tan, green jacket, charcoal jeans | man, messy blond hair, light, violet hoodie, blue jeans |
| commuter | man, short brown hair, light, grey suit, red tie (the first commuter) | woman, black bob, brown, navy skirt suit | woman, long auburn hair, light, charcoal trouser suit | man, black side parting, tan, navy suit, rose tie | woman, black bun, deep brown, camel trench coat | man, buzz cut and short beard, deep brown, brown suit, blue tie |

- **Ten new colours** in `palette.lua`: `skin3` (tan) and `skin4` (deep brown) pairs, `rose` and `teal` pairs, `auburn` and `blonde`. Their pixel-map letters are `a`/`A`, `m`/`M`, `f`/`F`, `j`/`J`, `x` and `z`.
- **Dealing:** a kind's deck is refilled with all six looks, shuffled with a Fisher-Yates shuffle on the look stream. If the shuffle puts the look just dealt first, that look moves to the back.
- **The closest two looks** of a kind differ in 150 pixels. The art test asks for at least 60.

## File map

| File | What it does |
|---|---|
| `open-case/src/crowd.js` (edit) | `KINDS` with `elder`; `LOOKS`; `dealLook`; `personName`; each person's `look`; `longest.look` |
| `open-case/src/tuning.js` (edit) | `CROWD.kinds.elder`, `RULES.elderRest`, `TIPS.happyElder` |
| `art/open-case/palette.lua`, `draw.lua` (edit) | The new colours and their letters |
| `art/open-case/figures.lua` (edit) | `F.KINDS` with `elder`; the passers-by drawn from parts; `F.LOOKS`; `F.person(b, kind, look, …)` |
| `art/open-case/sprites.lua` (edit) | A person's frames per look; `looks` in `sprites.json` |
| `art/open-case/lineup.lua` (new) | The line-up preview, for checking the people by eye |
| `open-case/assets/sprites.png`, `sprites.json` (generated) | The sheet |
| `open-case/src/render.js` (edit) | `personFrame` names the look |
| `open-case/src/main.js` (edit) | The end card's words |
| `open-case/test/*` | The tests for each of the above |
| `README.md`, the passers-by spec | Say what's built |

---

### Task 1: The old man's kind becomes the elder

**Files:**
- Modify: `open-case/src/crowd.js`, `open-case/src/tuning.js`, `open-case/src/main.js`
- Modify: `art/open-case/figures.lua` (the kind's name only)
- Regenerate: `open-case/assets/sprites.png`, `open-case/assets/sprites.json`
- Test: `open-case/test/crowd.test.js`, `open-case/test/set.test.js`, `open-case/test/render.test.js`

**Interfaces:**
- Produces: `KINDS = ['jogger', 'elder', 'student', 'commuter']` (crowd.js); `CROWD.kinds.elder = { speed: 18, patience: 12 }`, `RULES.elderRest = 4`, `TIPS.happyElder = 3` (tuning.js); `F.KINDS = { "jogger", "elder", "student", "commuter" }` (figures.lua), so the sheet's frames are `elder-walk-0-left` and so on.

- [ ] **Step 1: Rename the kind in the tests**

From the repo root:

```bash
cd open-case
sed -i '' "s/'oldman'/'elder'/g; s/oldman:/elder:/g; s/\.oldman,/.elder,/; s/TIPS\.happyOldMan/TIPS.happyElder/; s/the jogger likes energy, the old man space/the jogger likes energy, the elder space/; s/(the old man 3)/(the elder 3)/" test/crowd.test.js test/set.test.js test/render.test.js
cd ..
```

(On Linux, `sed -i` takes no `''`.)

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL, 4 of 222. "what raises and lowers interest, for whom", "tastes: …" and "when their time is up they leave, …" find no `elder` in the crowd's rules. "a set in full swing draws everyone, …" asks for `elder-…` frames the sheet doesn't have yet.

- [ ] **Step 3: Rename it in the code and the art**

From the repo root:

```bash
cd open-case
sed -i '' "s/'oldman'/'elder'/g; s/RULES\.oldManRest/RULES.elderRest/; s/TIPS\.happyOldMan/TIPS.happyElder/" src/crowd.js
sed -i '' "s/  oldManRest: 4, \/\/ Space:/  elderRest: 4, \/\/ Space:/; s/    oldman: { speed: 18/    elder: { speed: 18/; s/happyOldMan: 3/happyElder: 3/" src/tuning.js
sed -i '' "s/oldman: 'An old man'/elder: 'An old man'/" src/main.js
cd ..
sed -i '' 's/F.KINDS = { "jogger", "oldman", "student", "commuter" }/F.KINDS = { "jogger", "elder", "student", "commuter" }/; s/  if kind == "oldman" then return F.oldMan(b, x, feet, step, head) end/  if kind == "elder" then return F.oldMan(b, x, feet, step, head) end/; s/^-- four passers-by (the jogger, the old man, the student and the commuter), the regular (the old man in$/-- four passers-by (the jogger, the elder, the student and the commuter), the regular (the old man in/' art/open-case/figures.lua
```

Then check nothing's left: `grep -rn -e oldman -e oldMan -e OldMan open-case/src open-case/test art/open-case/figures.lua` should print only `function F.oldMan(…)` and the line that calls it.

- [ ] **Step 4: Rebuild the sheet**

Run: `/Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/sprites.lua`
Expected: `sprites: 230 frames on a 512x1407 sheet, 39 colours`. The old man's frames are now named `elder-…`.

- [ ] **Step 5: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 222 tests.

- [ ] **Step 6: Commit**

```bash
git add art/open-case/figures.lua open-case/src/crowd.js open-case/src/main.js open-case/src/tuning.js open-case/test/crowd.test.js open-case/test/render.test.js open-case/test/set.test.js open-case/assets/sprites.png open-case/assets/sprites.json
git commit -m "Open Case: the old man's kind becomes the elder

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Dealing looks

**Files:**
- Modify: `open-case/src/crowd.js`
- Modify: `open-case/test/helpers.js`
- Test: `open-case/test/crowd.test.js`

**Interfaces:**
- Consumes: `KINDS` with `elder` (Task 1); `createRng`, `nextRandom` from `rng.js`.
- Produces (later tasks rely on these exact names):
  - `LOOKS = 6`: each kind's people.
  - Each person gains `look`, an integer from 0 to `LOOKS - 1`.
  - The crowd gains `lookRng`, `decks` (`{ kind: [looks still to deal] }`) and `lastLook` (`{ kind: look }`).
  - `c.longest` becomes `{ kind, look, seconds }`.
  - `dealLook(c, kind) -> look`: exported for the tests.
  - `personName(kind, who) -> string`, where `who` is `'woman'` or `'man'`: `'A jogger'`, `'A student'`, `'A commuter'`, `'An old woman'` or `'An old man'`.
  - `stoodAt(c, kind, spot, over)` (test helper) gives look 0 unless `over` says.

- [ ] **Step 1: Write the failing tests**

In `open-case/test/helpers.js`, give `stoodAt`'s listener a look. Replace:

```js
// A listener standing in the crowd at spot `spot`, for tests that need one without hooking them.
export function stoodAt(c, kind, spot, over = {}) {
  const [x, y] = CROWD.spots[spot];
  const p = {
    id: c.nextId++, kind, dir: 1, x, y, state: 'stopped', listening: false, heard: 0, walkedOn: true,
```

with:

```js
// A listener standing in the crowd at spot `spot` (the kind's look 0 unless `over` says), for tests
// that need one without hooking them.
export function stoodAt(c, kind, spot, over = {}) {
  const [x, y] = CROWD.spots[spot];
  const p = {
    id: c.nextId++, kind, look: 0, dir: 1, x, y, state: 'stopped', listening: false, heard: 0, walkedOn: true,
```

Replace `open-case/test/crowd.test.js` with:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCrowd, hear, crowdSize, endTips, dealLook, personName, KINDS, LOOKS } from '../src/crowd.js';
import { CROWD, INTEREST, TIPS, DT } from '../src/tuning.js';
import { runCrowd, stoodAt } from './helpers.js';

const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

// Everyone who came by in the first `seconds`, in order: kind, look, side, budget and arrival time.
function arrivals(seed, seconds = 120, each) {
  const c = createCrowd(seed), seen = new Map();
  runCrowd(c, 0, seconds, (t) => {
    each?.(c, t);
    for (const p of c.people) if (!seen.has(p.id)) seen.set(p.id, { kind: p.kind, look: p.look, dir: p.dir, budget: p.budget, at: p.arrivedAt });
  });
  return [...seen.values()];
}

test('passers-by come from the seed: the same seed brings the same people at the same times', () => {
  const a = arrivals(1);
  assert.deepEqual(a, arrivals(1));
  assert.notDeepEqual(a, arrivals(2));
  assert.ok(a.every((p) => KINDS.includes(p.kind) && (p.dir === 1 || p.dir === -1)));
  assert.ok(near(a[0].at, 2, DT * 1.5), 'the first comes 2 seconds in');
  for (let i = 1; i < a.length; i++) {
    const gap = a[i].at - a[i - 1].at;
    assert.ok(gap >= 6 - DT && gap <= 10 + DT, `gap ${gap}`);
  }
});

test("looks don't move the crowd's draws: seed 7 brings the same people, sides, budgets and times as before looks", () => {
  // From the code before passers-by had looks: [kind, dir, budget, arrival time], to 4 places.
  const before = [
    ['jogger', 1, 177.2289, 2.0167], ['student', 1, 115.9479, 10.8167], ['student', -1, 90.9379, 17.7833],
    ['commuter', -1, 83.6565, 24.4167], ['elder', -1, 95.5596, 31.9], ['jogger', -1, 82.895, 41.8167],
    ['jogger', 1, 125.7482, 48.4], ['jogger', -1, 126.4453, 57.45], ['student', -1, 134.9257, 65.95],
    ['commuter', 1, 80.993, 75.65], ['elder', 1, 70.5727, 83.0833], ['elder', 1, 116.2395, 92.1667],
  ];
  const now = arrivals(7).slice(0, before.length).map((p) => [p.kind, p.dir, +p.budget.toFixed(4), +p.at.toFixed(4)]);
  assert.deepEqual(now, before);
});

test('each arrival is dealt a look like a card: all of a kind come by before any comes back, never one twice running', () => {
  for (const seed of [1, 2, 3, 7, 11]) {
    const a = arrivals(seed, 600);
    assert.deepEqual(arrivals(seed, 600), a, 'the same seed deals the same looks');
    for (const kind of KINDS) {
      const looks = a.filter((p) => p.kind === kind).map((p) => p.look);
      assert.ok(looks.every((l) => Number.isInteger(l) && l >= 0 && l < LOOKS), `${kind}: ${looks}`);
      for (let i = 0; i + LOOKS <= looks.length; i += LOOKS) {
        assert.equal(new Set(looks.slice(i, i + LOOKS)).size, LOOKS, `seed ${seed}, ${kind}: each ${LOOKS} in turn are all different (${looks})`);
      }
      looks.forEach((l, i) => i > 0 && assert.notEqual(l, looks[i - 1], `seed ${seed}, ${kind}: never twice running (${looks})`));
    }
  }
});

test('no two people on screen look the same, even when everyone stays', () => {
  for (const seed of [3, 5, 8]) {
    arrivals(seed, 600, (c) => {
      for (const p of c.people) if (p.listening) p.interest = 1; // everyone who hears you stops
      const worn = c.people.map((p) => `${p.kind} ${p.look}`);
      assert.equal(new Set(worn).size, worn.length, `seed ${seed}: ${worn}`);
    });
  }
});

test("a deck whose every look left is on screen is refilled, and the look just dealt doesn't start the new deck", () => {
  const c = createCrowd(1);
  stoodAt(c, 'jogger', 0, { look: 4 });
  c.decks.jogger = [4];
  const look = dealLook(c, 'jogger');
  assert.notEqual(look, 4, "the one left is being worn, so it isn't dealt");
  assert.equal(c.decks.jogger.length, LOOKS - 1, 'a fresh deck, less the look dealt');
  for (let i = 0; i < 50; i++) {
    const d = createCrowd(i);
    const first = dealLook(d, 'student');
    d.decks.student = [];
    assert.notEqual(dealLook(d, 'student'), first, `seed ${i}: a new deck never starts with the look just dealt`);
  }
});

test('the end card names who stayed: a jogger, a student, a commuter, an old woman or an old man', () => {
  assert.equal(personName('jogger', 'woman'), 'A jogger');
  assert.equal(personName('student', 'man'), 'A student');
  assert.equal(personName('commuter', 'woman'), 'A commuter');
  assert.equal(personName('elder', 'woman'), 'An old woman');
  assert.equal(personName('elder', 'man'), 'An old man');
});

test('never more than 6 on screen: with 6 listening, nobody new arrives until one leaves', () => {
  let most = 0;
  arrivals(3, 150, (c) => {
    for (const p of c.people) if (p.listening) p.interest = 1; // everyone who hears you stops
    most = Math.max(most, c.people.length);
  });
  assert.equal(most, CROWD.onScreen);
});

// The first passer-by, moved to just inside earshot and listening.
function passerBy(seed = 1) {
  const c = createCrowd(seed);
  let t = runCrowd(c, 0, 2.05);
  const p = c.people[0];
  p.x = CROWD.playerX - p.dir * (CROWD.earshot - 5);
  t = runCrowd(c, t, DT);
  assert.equal(p.listening, true);
  return { c, p, t };
}

test('a passer-by in earshot who reaches 0.5 within their patience stops, at the nearest free spot', () => {
  const { c, p, t } = passerBy();
  assert.ok(near(p.interest, INTEREST.start, 0.01));
  hear(c, { rule: 'callback' }, t);
  runCrowd(c, t, DT);
  assert.equal(p.state, 'joining');
  assert.equal(crowdSize(c), 1);
  assert.equal(c.stoppedEver, 1);
  runCrowd(c, t, 10);
  assert.equal(p.state, 'stopped');
  assert.deepEqual([p.x, p.y], CROWD.spots[p.spot]);
});

test('one who is not hooked within their patience walks on, at their full pace', () => {
  const { c, p, t } = passerBy(4);
  p.interest = 0.45; // interested, but not enough
  const patience = CROWD.kinds[p.kind].patience;
  let at = runCrowd(c, t, patience - 0.5);
  assert.equal(p.listening, true);
  at = runCrowd(c, at, 1);
  assert.equal(p.listening, false);
  assert.equal(p.state, 'passing');
  const x = p.x;
  runCrowd(c, at, 1);
  assert.ok(near(Math.abs(p.x - x), CROWD.kinds[p.kind].speed, 1), 'no longer slowed');
});

test('a crowd draws a crowd: each listener already stopped gives a new arrival 0.05', () => {
  const c = createCrowd(1);
  stoodAt(c, 'student', 0);
  stoodAt(c, 'commuter', 1);
  runCrowd(c, 0, 2.05);
  const p = c.people.find((o) => o.state === 'passing');
  assert.ok(near(p.interest, INTEREST.start + 2 * INTEREST.draw));
});

test('what raises and lowers interest, for whom', () => {
  const c = createCrowd(1);
  const kinds = Object.fromEntries(KINDS.map((k, i) => [k, stoodAt(c, k, i, { interest: 0.5 })]));
  const after = (e) => {
    for (const p of Object.values(kinds)) p.interest = 0.5;
    hear(c, e, 0);
    return Object.fromEntries(Object.entries(kinds).map(([k, p]) => [k, Math.round((p.interest - 0.5) * 100) / 100]));
  };
  assert.deepEqual(after({ rule: 'phrase', clean: true, loud: false, notes: 5 }), { jogger: 0.05, elder: 0.05, student: 0.05, commuter: 0.05 });
  assert.deepEqual(after({ rule: 'phrase', clean: true, loud: false, notes: 2 }), { jogger: 0, elder: 0, student: 0, commuter: 0 });
  assert.deepEqual(after({ rule: 'phrase', clean: true, loud: true, notes: 5 }), { jogger: 0.05, elder: 0, student: 0.05, commuter: 0.05 });
  assert.deepEqual(after({ rule: 'phrase', clean: false, loud: false, notes: 5 }), { jogger: 0, elder: 0, student: 0, commuter: 0 });
  assert.deepEqual(after({ rule: 'loud' }), { jogger: 0, elder: -0.05, student: 0, commuter: 0 });
  assert.deepEqual(after({ rule: 'repeat' }), { jogger: -0.15, elder: -0.15, student: -0.15, commuter: -0.15 });
  assert.deepEqual(after({ rule: 'offKey' }).jogger, -0.1);
  assert.deepEqual(after({ rule: 'random' }).student, INTEREST.random);
  assert.deepEqual(after({ rule: 'silence' }).elder, -0.1);
  assert.deepEqual(after({ rule: 'recognised' }).commuter, 0.05);
  assert.deepEqual(after({ rule: 'callback' }).jogger, 0.3);
});

test('tastes: the jogger likes energy, the elder space, the student groove; the commuter has none', () => {
  const c = createCrowd(1);
  const kinds = Object.fromEntries(KINDS.map((k, i) => [k, stoodAt(c, k, i, { interest: 0.5 })]));
  const likes = (bar) => {
    for (const p of Object.values(kinds)) p.interest = 0.5;
    hear(c, { rule: 'bar', bar: 0, ...bar }, 0);
    return KINDS.filter((k) => kinds[k].interest > 0.5);
  };
  assert.deepEqual(likes({ count: 8, off: 0, rest: 2 }), ['jogger']);
  assert.deepEqual(likes({ count: 7, off: 0, rest: 2 }), []);
  assert.deepEqual(likes({ count: 2, off: 0, rest: 8 }), ['elder']);
  assert.deepEqual(likes({ count: 0, off: 0, rest: 16 }), [], 'a silent bar is nobody\'s taste');
  assert.deepEqual(likes({ count: 6, off: 2, rest: 2 }), ['student']);
  assert.deepEqual(likes({ count: 9, off: 3, rest: 4 }), ['jogger', 'elder', 'student']);
  assert.equal(kinds.jogger.lastRule, 'taste');
});

test('a callback earns a coin from each listener stopped, not from passers-by', () => {
  const { c, p, t } = passerBy();
  stoodAt(c, 'elder', 0);
  stoodAt(c, 'student', 5);
  hear(c, { rule: 'callback' }, t);
  assert.deepEqual(c.out.map((e) => [e.type, e.coins, e.why]), [['coin', 1, 'callback'], ['coin', 1, 'callback']]);
  assert.equal(p.reaction.rule, 'callback');
});

test('below 0.2 anyone leaves, showing what lost them', () => {
  const c = createCrowd(1);
  const p = stoodAt(c, 'student', 2, { interest: 0.3 });
  hear(c, { rule: 'repeat' }, 5);
  runCrowd(c, 5, DT);
  assert.equal(p.state, 'leaving');
  assert.deepEqual(p.reaction, { rule: 'repeat', t: 5 });
  assert.deepEqual(c.out.map((e) => [e.type, e.happy]), [['left', false]]);
});

test('when their time is up they leave, tipping 2 if happy (the elder 3), nothing if not', () => {
  const c = createCrowd(1);
  stoodAt(c, 'student', 0, { budget: 5, interest: 0.9, look: 3 });
  stoodAt(c, 'elder', 1, { budget: 5, interest: 0.9 });
  stoodAt(c, 'jogger', 2, { budget: 5, interest: 0.4 });
  runCrowd(c, 0, 5.1);
  const coins = c.out.filter((e) => e.type === 'coin').map((e) => [e.person.kind, e.coins, e.why]);
  assert.deepEqual(coins, [['student', TIPS.happy, 'happy'], ['elder', TIPS.happyElder, 'happy']]);
  assert.ok(c.people.filter((p) => p.state !== 'passing').every((p) => p.state === 'leaving'));
  assert.equal(c.longest.kind, 'student');
  assert.equal(c.longest.look, 3, 'and which student');
  assert.ok(near(c.longest.seconds, 5, 0.05));
});

test('at the end of the set, everyone still listening tips once', () => {
  const c = createCrowd(1);
  stoodAt(c, 'student', 0);
  stoodAt(c, 'commuter', 3);
  endTips(c);
  assert.deepEqual(c.out.map((e) => [e.coins, e.why]), [[1, 'end'], [1, 'end']]);
});

test('interest fades a little every second for everyone listening', () => {
  const c = createCrowd(1);
  const p = stoodAt(c, 'student', 0, { interest: 0.9 });
  runCrowd(c, 0, 10);
  assert.ok(near(p.interest, 0.8, 0.001));
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL. `crowd.test.js` can't load: `The requested module '../src/crowd.js' does not provide an export named 'LOOKS'`.

- [ ] **Step 3: Deal looks in crowd.js**

Replace `open-case/src/crowd.js` with:

```js
// The passers-by. Pure: they arrive from the seed, walk the path, listen while in earshot, stop when
// hooked, and leave bored or happy. Their interest moves with what the ears hear (listen.js events).
// Coins and the rest are reported in c.out as { type, person, coins? } for the set to collect.
//
// Each person: { id, kind, look (which of the kind's people they are, 0 to LOOKS - 1), dir (+1 walking
//   right), x, y, state, listening, heard, interest, budget, stayed, spot, lastRule,
//   reaction: { rule, t } | null, done }
// state: 'passing' (walking by, maybe listening), 'joining' (hooked, walking to a spot), 'stopped',
// 'leaving'. The crowd is everyone joining or stopped.
import { CROWD, INTEREST, TIPS, RULES } from './tuning.js';
import { createRng, nextRandom, randomBetween } from './rng.js';

export const KINDS = ['jogger', 'elder', 'student', 'commuter'];
export const LOOKS = 6; // each kind's people, three women and three men (art/open-case/figures.lua)
const LOOK_SEED = 0x9e3779b9; // mixed into the set's seed for the looks' own stream
export const PATH_Y = 146; // where passers-by walk

export function createCrowd(seed) {
  return {
    rng: createRng(seed),
    // Looks are dealt from a stream of their own, so they never move the draws above: a set's kinds,
    // sides, budgets and arrival times are as they were before people had looks.
    lookRng: createRng((seed ^ LOOK_SEED) >>> 0),
    decks: Object.fromEntries(KINDS.map((k) => [k, []])), // each kind's looks still to deal, in order
    lastLook: {}, // each kind's look dealt last
    people: [],
    nextId: 1,
    nextArrival: CROWD.firstArrival,
    open: true, // new people still arrive
    stoppedEver: 0,
    longest: null, // { kind, look, seconds }: whoever has stayed longest
    out: [],
  };
}

export const inCrowd = (p) => p.state === 'joining' || p.state === 'stopped';
export const crowdSize = (c) => c.people.reduce((n, p) => n + (inCrowd(p) ? 1 : 0), 0);
const hearing = (p) => p.listening || inCrowd(p);

// How the end card names someone of `kind`, who (the look's) is 'woman' or 'man': "A jogger", or for
// the elder, "An old woman" or "An old man".
export function personName(kind, who) {
  if (kind === 'elder') return who === 'woman' ? 'An old woman' : 'An old man';
  return `A ${kind}`;
}

// Deals an arriving `kind` a look, like a card: the first in the kind's deck that no one on screen is
// wearing. A deck that's run out, or that has only looks someone's wearing left, is refilled with all
// of them, shuffled, never starting with the look just dealt. So everyone of a kind comes by before any
// comes back, and no two people on screen look the same (at most 5 others are there when one arrives).
export function dealLook(c, kind) {
  const worn = new Set(c.people.filter((p) => p.kind === kind).map((p) => p.look));
  if (!c.decks[kind].some((l) => !worn.has(l))) {
    const deck = [...Array(LOOKS).keys()];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(nextRandom(c.lookRng) * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    if (deck[0] === c.lastLook[kind]) deck.push(deck.shift());
    c.decks[kind] = deck;
  }
  const look = c.decks[kind].find((l) => !worn.has(l));
  c.decks[kind].splice(c.decks[kind].indexOf(look), 1);
  c.lastLook[kind] = look;
  return look;
}

function arrive(c, t) {
  // Always the same draws in the same order, so the k-th arrival is the same person whatever you play.
  const kind = KINDS[Math.floor(nextRandom(c.rng) * KINDS.length)];
  const dir = nextRandom(c.rng) < 0.5 ? 1 : -1;
  const budget = randomBetween(c.rng, CROWD.budgetMin, CROWD.budgetMax);
  c.people.push({
    id: c.nextId++, kind, look: dealLook(c, kind), dir, x: dir > 0 ? -CROWD.edge : CROWD.width + CROWD.edge, y: PATH_Y,
    state: 'passing', listening: false, heard: 0, walkedOn: false,
    interest: INTEREST.start + INTEREST.draw * crowdSize(c), budget, stayed: 0, spot: -1,
    lastRule: '', reaction: null, done: false, arrivedAt: t,
  });
}

function nudge(p, rule, delta, t) {
  p.interest = Math.min(1, Math.max(0, p.interest + delta));
  p.lastRule = rule;
  if (rule !== 'phrase') p.reaction = { rule, t };
}

// Does a bar suit this person's taste? (The commuter has none.)
function likes(kind, bar) {
  if (kind === 'jogger') return bar.count >= RULES.joggerNotes;
  if (kind === 'elder') return bar.count > 0 && bar.rest >= RULES.elderRest;
  if (kind === 'student') return bar.count >= RULES.studentMin && bar.off / bar.count >= RULES.studentShare;
  return false;
}

// Everyone listening hears one event from the ears.
export function hear(c, e, t) {
  for (const p of c.people) {
    if (!hearing(p)) continue;
    switch (e.rule) {
      case 'phrase':
        if (e.clean && e.notes >= RULES.phraseMinNotes && !(p.kind === 'elder' && e.loud)) nudge(p, 'phrase', INTEREST.phrase, t);
        break;
      case 'bar':
        if (likes(p.kind, e)) nudge(p, 'taste', INTEREST.taste, t);
        break;
      case 'loud':
        if (p.kind === 'elder') nudge(p, 'loud', INTEREST.loud, t);
        break;
      case 'callback':
        nudge(p, 'callback', INTEREST.callback, t);
        if (inCrowd(p)) c.out.push({ type: 'coin', person: p, coins: TIPS.callback, why: 'callback' });
        break;
      default: // repeat, offKey, recognised, random, silence
        nudge(p, e.rule, INTEREST[e.rule], t);
    }
  }
}

function freeSpot(c, x) {
  let best = -1;
  CROWD.spots.forEach(([sx], i) => {
    if (c.people.some((o) => inCrowd(o) && o.spot === i)) return;
    if (best < 0 || Math.abs(sx - x) < Math.abs(CROWD.spots[best][0] - x)) best = i;
  });
  return best;
}

function leave(c, p, happy) {
  p.state = 'leaving';
  if (happy) c.out.push({ type: 'coin', person: p, coins: p.kind === 'elder' ? TIPS.happyElder : TIPS.happy, why: 'happy' });
  c.out.push({ type: 'left', person: p, happy });
}

export function stepCrowd(c, dt, t) {
  if (c.open && t >= c.nextArrival && c.people.length < CROWD.onScreen) {
    arrive(c, t);
    c.nextArrival = t + randomBetween(c.rng, CROWD.arriveMin, CROWD.arriveMax);
  }
  for (const p of c.people) {
    const kind = CROWD.kinds[p.kind];
    if (hearing(p)) p.interest = Math.max(0, p.interest - INTEREST.fade * dt);
    if (p.state === 'passing') {
      const near = Math.abs(p.x - CROWD.playerX) <= CROWD.earshot;
      if (near && !p.walkedOn) p.listening = true;
      if (p.listening) {
        p.heard += dt;
        if (p.interest >= INTEREST.hook) {
          const spot = freeSpot(c, p.x);
          if (spot >= 0) {
            p.state = 'joining';
            p.listening = false;
            p.spot = spot;
            c.stoppedEver++;
            c.out.push({ type: 'hooked', person: p });
          }
        } else if (!near || p.heard > kind.patience || p.interest < INTEREST.bored) {
          p.listening = false;
          p.walkedOn = true;
          if (p.interest < INTEREST.bored) c.out.push({ type: 'left', person: p, happy: false });
        }
      }
      if (p.state === 'passing') p.x += p.dir * kind.speed * (p.listening ? CROWD.listenSlow : 1) * dt;
    } else if (p.state === 'joining' || p.state === 'stopped') {
      p.stayed += dt;
      if (!c.longest || p.stayed > c.longest.seconds) c.longest = { kind: p.kind, look: p.look, seconds: p.stayed };
      if (p.state === 'joining') {
        const [sx, sy] = CROWD.spots[p.spot];
        const step = kind.speed * dt;
        p.x += Math.max(-step, Math.min(step, sx - p.x));
        p.y += Math.max(-step, Math.min(step, sy - p.y));
        if (p.x === sx && p.y === sy) p.state = 'stopped';
      }
      if (p.interest < INTEREST.bored) leave(c, p, false);
      else if (p.stayed >= p.budget) leave(c, p, p.interest > INTEREST.happy);
    } else if (p.state === 'leaving') {
      p.x += p.dir * kind.speed * dt;
      p.y += Math.max(-kind.speed * dt, Math.min(kind.speed * dt, PATH_Y - p.y));
    }
    if (p.x < -CROWD.edge - 1 || p.x > CROWD.width + CROWD.edge + 1) p.done = true;
  }
  if (c.people.some((p) => p.done)) c.people = c.people.filter((p) => !p.done);
}

// The set is over: each listener still here tips once.
export function endTips(c) {
  for (const p of c.people) if (inCrowd(p)) c.out.push({ type: 'coin', person: p, coins: TIPS.end, why: 'end' });
}
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 227 tests.

- [ ] **Step 5: Commit**

```bash
git add open-case/src/crowd.js open-case/test/helpers.js open-case/test/crowd.test.js
git commit -m "Open Case: each passer-by is dealt one of their kind's six looks, from a stream of its own

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Six people of each kind in the sheet

**Files:**
- Modify: `art/open-case/palette.lua`, `art/open-case/draw.lua`, `art/open-case/figures.lua`, `art/open-case/sprites.lua`
- Create: `art/open-case/lineup.lua`
- Regenerate: `open-case/assets/sprites.png`, `open-case/assets/sprites.json`
- Modify: `open-case/src/render.js`
- Test: `open-case/test/art.test.js`, `open-case/test/render.test.js`

**Interfaces:**
- Consumes: `KINDS`, `LOOKS` and each person's `look` (Task 2).
- Produces:
  - `F.LOOKS[kind]`: six look tables, each `{ who = "woman" | "man", skin, hair = { style, colour letter }, face?, … }` plus the kind's clothes.
  - `F.person(b, kind, look, x, feet, step, head)`, with `look` from 0.
  - The sheet's frames `<kind>-<look>-walk-<0-3>-<left|right>`, `-stand-<0-1>-` and `-nod-<0-1>-`.
  - `sprites.json` `looks`: `{ "jogger": ["woman", "woman", "woman", "man", "man", "man"], "elder": ["man", "woman", "woman", "man", "woman", "man"], "student": [the same as elder], "commuter": [the same as elder] }`.
  - `personFrame(p, t, time)` returns `` `${p.kind}-${p.look}-…` ``.

- [ ] **Step 1: Write the failing tests**

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
import { KINDS, LOOKS, PATH_Y } from '../src/crowd.js';
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
const PEOPLE = KINDS.flatMap((k) => range(LOOKS).map((look) => `${k}-${look}`)); // every passer-by's frames' prefix

// How many frames there are of each thing, from the art spec's table (and the sky's five stages).
const FAMILIES = [
  ['sun', 1], ['ground', 1], ['pool', 1], ['case', 1], ['case-coin', 1],
  [/^roofs-back-\d$/, 5], [/^roofs-front-\d$/, 5], [/^train-\d$/, 5], [/^trees-\d$/, 3], [/^lamp-(off|on|flicker)$/, 3],
  [/^cloud-\d+-\d$/, data.clouds.length * 5],
  [/^coin-\d$/, 2], ['speaker', 1], [/^bird-\d$/, 2],
  ...INSTRUMENTS.flatMap((id) => [[new RegExp(`^you-${id}-idle-\\d$`), 2], [new RegExp(`^you-${id}-play-\\d$`), 3]]),
  ...PEDALS.flatMap((id) => [[new RegExp(`^pedal-${id}-\\d$`), 2], [new RegExp(`^strip-${id}-\\d$`), 2]]),
  [/^pedal-loop-(dark|red|green)$/, 3], [/^strip-loop-(dark|red|green)$/, 3],
  ['amp', 1], ['shop-room', 1], ['shop-counter', 1], [/^keeper-\d$/, 4], ['tag-price', 1], ['tag-yours', 1],
  ...STOCK.map((item) => [new RegExp(`^item-${item.id}-\\d$`), 2]),
  ...PEOPLE.flatMap((who) => ['left', 'right'].flatMap((d) => [
    [new RegExp(`^${who}-walk-\\d-${d}$`), 4], [new RegExp(`^${who}-stand-\\d-${d}$`), 2], [new RegExp(`^${who}-nod-\\d-${d}$`), 2],
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
  for (const who of PEOPLE) for (const i of range(4)) assert.ok(names.includes(`${who}-walk-${i}-left`), `${who}-walk-${i}`);
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
    for (const who of PEOPLE) {
      const name = `${who}-stand-0-${sx < CROWD.playerX ? 'right' : 'left'}`, [pl, pt, pr, pb] = cover(name, sx, sy);
      assert.ok(pl >= 0 && pt >= 0 && pr <= 320 && pb <= 180, `${who} at spot ${sx},${sy} fits on screen`);
      for (let y = pt; y < pb; y++) {
        for (let x = pl; x < pr; x++) {
          assert.ok(!(opaqueAt(name, sx, sy, x, y) && opaqueAt('case', 0, 0, x, y)), `${who} at spot ${sx},${sy} stands clear of the case`);
        }
      }
    }
  }
  assert.ok(data.feet.you > PATH_Y, 'passers-by walk behind you');
});

// The colour a frame drawn at (0, 0) puts at screen point (sx, sy), or null where it's clear.
const colourAt = (name, sx, sy) => {
  if (!opaqueAt(name, 0, 0, sx, sy)) return null;
  const [fx, fy, , , ax, ay] = data.frames[name], i = ((fy + sy + ay) * sheet.w + fx + sx + ax) * 4;
  return sheet.data.slice(i, i + 3).join();
};
// How many pixels differ between two frames, laid over each other by their anchors.
const differ = (a, b) => {
  const [al, at, ar, ab] = cover(a, 0, 0), [bl, bt, br, bb] = cover(b, 0, 0);
  let n = 0;
  for (let y = Math.min(at, bt); y < Math.max(ab, bb); y++) {
    for (let x = Math.min(al, bl); x < Math.max(ar, br); x++) if (colourAt(a, x, y) !== colourAt(b, x, y)) n++;
  }
  return n;
};

test('each kind has six people, three women and three men, each clearly their own', () => {
  assert.deepEqual(Object.keys(data.looks), KINDS);
  for (const k of KINDS) {
    assert.equal(data.looks[k].length, LOOKS, k);
    assert.ok(data.looks[k].every((who) => who === 'woman' || who === 'man'), k);
    assert.equal(data.looks[k].filter((who) => who === 'woman').length, 3, `${k}: three women`);
    for (const a of range(LOOKS)) {
      for (const b of range(LOOKS)) {
        if (a < b) assert.ok(differ(`${k}-${a}-stand-0-left`, `${k}-${b}-stand-0-left`) >= 60, `${k} ${a} and ${b} look clearly different`);
      }
    }
  }
});

test("nobody's drawn above the top of their head, 45 rows over their feet, so reactions stay clear", () => {
  for (const name of names.filter((n) => PEOPLE.some((who) => n.startsWith(`${who}-`)))) {
    assert.ok(data.frames[name][5] <= 45, `${name} reaches ${data.frames[name][5]} rows over its feet`);
  }
});

test('your pedals and the loop pedal stand in front of the crate, clear of the case and of every listener', () => {
  const pedals = [...PEDALS.map((id) => `pedal-${id}-1`), 'pedal-loop-green'];
  const [, , , bottom] = cover('you-acoustic-idle-0', 0, 0);
  for (const name of pedals) {
    const [l, t, r, b] = cover(name, 0, 0);
    assert.ok(t >= data.feet.you && b <= 170, `${name} is on the ground in front of you, above the strip`);
    for (let y = t; y < b; y++) {
      for (let x = l; x < r; x++) {
        if (!opaqueAt(name, 0, 0, x, y)) continue;
        assert.ok(!opaqueAt('case', 0, 0, x, y), `${name} clear of the case`);
        for (const [sx, sy] of CROWD.spots) {
          for (const who of PEOPLE) assert.ok(!opaqueAt(`${who}-stand-0-${sx < CROWD.playerX ? 'right' : 'left'}`, sx, sy, x, y), `${name} clear of ${who} at ${sx},${sy}`);
        }
      }
    }
  }
  assert.ok(bottom <= data.feet.pedals && bottom <= data.feet.loop);
  const [, , , loopBottom] = cover('pedal-loop-green', 0, 0);
  const [, pedalsTop] = cover('pedal-overdrive-1', 0, 0);
  assert.ok(loopBottom <= pedalsTop + 1, 'the loop pedal stands behind the row of pedals');
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
  for (const id of [...PEDALS, 'loop']) {
    const [lx, ly] = data.shop.leds[id], [x, y, w, h] = data.shop.items[id];
    assert.ok(lx >= x && lx + 2 <= x + w && ly >= y && ly + (id === 'loop' ? 2 : 1) <= y + h, `${id}'s light is on the pedal`);
  }
  const rack = [...PEDALS, 'loop'].map((id) => data.shop.items[id]);
  rack.forEach(([x], i) => i > 0 && assert.ok(x >= rack[i - 1][0] + rack[i - 1][2] + 5, 'room for a price tag between pedals, clear of the next'));
  assert.ok(rack.at(-1)[2] > rack[0][2], 'the loop pedal is the wider one');
});
```

In `open-case/test/render.test.js`, import `LOOKS` too. Change `import { KINDS } from '../src/crowd.js';` to:

```js
import { KINDS, LOOKS } from '../src/crowd.js';
```

In the test "every frame the renderer asks for is in the sheet, over a whole set, with and without motion", give each listener a look. Change the `stoodAt` line to:

```js
      stoodAt(set.crowd, kind, (i + j) % 6, { look: (i + j) % LOOKS, state, dir: j % 2 ? 1 : -1, interest: j % 2 ? 0.9 : 0.3, x: 40 + i * 60 + j * 7, reaction: { rule: rules[(i + j) % 8], t: 0 } });
```

Replace the test "listeners face you once they stop, breathe standing, and nod on the beat once hooked" with:

```js
test('listeners face you once they stop, breathe standing, and nod on the beat once hooked', () => {
  const p = { kind: 'student', look: 4, state: 'stopped', x: 80, y: 156, dir: -1, id: 3, interest: 0.3 };
  assert.match(personFrame(p, 0, 0), /^student-4-stand-\d-right$/, 'left of you, facing right, as the student they are');
  assert.match(personFrame({ ...p, x: 200 }, 0, 0), /-left$/);
  assert.match(personFrame({ ...p, state: 'passing' }, 0, 0), /^student-4-walk-\d-left$/, 'walking the way they go');
  const hooked = { ...p, interest: INTEREST.hook + 0.1 };
  assert.equal(personFrame(hooked, 10 * BEAT + 0.05, 0), 'student-4-nod-1-right', 'head down on the beat');
  assert.equal(personFrame(hooked, 10 * BEAT + BEAT * 0.6, 0), 'student-4-nod-0-right', 'up between beats');
  assert.match(personFrame({ ...p, look: 0 }, 0, 0), /^student-0-stand-/, 'another student, another look');
  const steps = new Set([0, 4, 8, 12].map((dx) => personFrame({ ...p, state: 'passing', x: 100 + dx }, 0, 0)));
  assert.equal(steps.size, 4, 'a walker steps through four frames as they go');
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL. The sheet has no `jogger-0-…` frames and no `looks`. The personFrame test gets `student-stand-…` without the look.

- [ ] **Step 3: The new colours and their letters**

In `art/open-case/palette.lua`, replace the line `  skin2 = { "#7e4e38", "#b07650" }, -- darker skin` with:

```lua
  skin2 = { "#7e4e38", "#b07650" }, -- brown skin
  skin3 = { "#b07448", "#dea574" }, -- tan skin
  skin4 = { "#4a2b20", "#6b4231" }, -- deep brown skin
```

and after the line `  brown = { "#553a2e", "#86604a" }, -- the passing old man's coat` add:

```lua
  rose = { "#9c3c5a", "#d4678a" }, -- a jogger's top, a headscarf, a student's pink bob
  teal = { "#1f6e6a", "#33a394" }, -- a jogger's top, a student's top
  auburn = "#8c3a22", -- hair
  blonde = "#e2bc72", -- hair
```

In `art/open-case/draw.lua`, at the end of the `PX` table, after `  n = C.path[2], N = C.path[1],`, add:

```lua
  a = C.skin3[2], A = C.skin3[1], m = C.skin4[2], M = C.skin4[1], -- tan and deep brown skin
  f = C.rose[2], F = C.rose[1], j = C.teal[2], J = C.teal[1], x = C.auburn, z = C.blonde,
```

- [ ] **Step 4: Draw the passers-by from parts**

Replace `art/open-case/figures.lua` with the file below. The regular's parts (`OLD_FACE`, `coat`, `armCane`, `FLAT_CAP`, `TOP_HAT`, `SCARF`, `COLLAR`) and `F.oldMan` are as they were, and now come before the passers-by, which borrow them. The reactions, pigeons and birds are unchanged.

```lua
-- Open Case's people and birds in the flat style, shared by the style sample and the sprite sheet: the
-- passers-by (joggers, elders, students and commuters, six looks of each), the regular (the old man
-- in the red scarf, drawn by the Regulars feature), the reactions over their heads, the pigeons by
-- your case and the birds that cross the sky.
--
-- A figure is drawn facing left, toward you from the right, with its feet at (x, feet); the sheet
-- mirrors it to face right. It's 16 pixels across and 46 tall from the top of its head (row 0) to its
-- feet (row 45). Its legs are drawn as lines from the hips, so every figure walks the same way; its
-- head and body are pixel maps.
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local D = dofile(here .. "draw.lua")
local L, C, rect, stamp = D.L, D.C, D.rect, D.stamp
local F = {}

F.KINDS = { "jogger", "elder", "student", "commuter" }

-- Walking: each leg's foot, as { forward (pixels, negative is ahead), lifted (pixels) }, for the near
-- leg then the far one. The body sits a pixel lower when both feet are down.
local STRIDE = {
  stand = { { 0, 0 }, { 0, 0 }, 0 },
  [0] = { { -4, 0 }, { 4, 0 }, 1 },
  [1] = { { 0, 0 }, { 2, 2 }, 0 },
  [2] = { { 4, 0 }, { -4, 0 }, 1 },
  [3] = { { 2, 2 }, { 0, 0 }, 0 },
}

-- One leg, from its hip down to its shoe, `wide` pixels across; the shoe points left.
local function leg(b, hx, hy, fx, fy, wide, c, shoe)
  local rows = fy - 2 - hy
  for i = 0, rows do
    local x = math.floor(hx + (fx - hx) * i / math.max(1, rows) + 0.5)
    rect(b, x, hy + i, x + wide - 1, hy + i, c)
  end
  rect(b, fx - 1, fy - 1, fx + wide - 1, fy - 1, shoe)
  rect(b, fx - 2, fy, fx + wide - 1, fy, shoe)
end

-- The old man, after the style sample: a flat cap, a white beard, his long brown coat and his cane.
local OLD_FACE = {
  "....ssssssww....",
  "....ssssssSww...",
  "...sksssssSww...",
  "..ssksssSSSw....",
  "...sssssssS.....",
  "...wwwwsssS.....",
  "...wwwwwwsS.....",
  "....wwwwww......",
  ".....wwww.......",
}
local OLD_FACE_GRIN = {
  "....ssssssww....",
  "....ssssssSww...",
  "...ssssssSSww...",
  "..sskksSSSw.....",
  "...sssssssS.....",
  "...wwwwkssS.....",
  "...wkkkwwsS.....",
  "....wwwwww......",
  ".....wwww.......",
}
local function coat(c, s) -- the old man's coat, in a coat colour and its shadow
  local rows = {
    "....ccccccccc...",
    "..cccccccccccC..",
    "..cccccccccccCC.",
    "..cccccccccccCC.",
    "..cccccccccccCC.",
    "..kccccccccccCC.",
    "..cccccccccccCC.",
    "..cccccccccccCC.",
    "..cccccccccccCC.",
    "..cccccccccccCC.",
    ".ckcccccccccccC.",
    ".cccccccccccccC.",
    ".cccccccccccccC.",
    ".cccccccccccccC.",
    ".cccccccccccccC.",
    ".ckccccccccccCC.",
    ".cccccccccccccC.",
    ".cccccccccccccCC",
    ".cccccccccccccCC",
    ".cccccccccccccCC",
    "ccccccccccccccCC",
    "ccccccccccccccCC",
    "ccccccccccccccCC",
  }
  local out = {}
  for i, r in ipairs(rows) do out[i] = r:gsub("c", c):gsub("C", s) end
  return out
end
local function armCane(c, s)
  local rows = {
    ".....CCC....",
    "....CCCC....",
    "....CCC.....",
    "...CCCC.....",
    "...CCC......",
    "..CCCC......",
    "..CCC.......",
    "..CCC.......",
    ".sss........",
    ".sss........",
  }
  local out = {}
  for i, r in ipairs(rows) do out[i] = r:gsub("C", s) end
  return out
end
local function armTip(s)
  local rows = {
    ".........CCC....",
    "......CCCCCC....",
    "sss.CCCCCCC.....",
    "sssCCCCCC.......",
    "sss.............",
  }
  local out = {}
  for i, r in ipairs(rows) do out[i] = r:gsub("C", s) end
  return out
end
local FLAT_CAP = {
  "................",
  "................",
  ".....hhhhhhh....",
  "....hhhhhhhhh...",
  "..kkkkkkkkkhh...",
}
local TOP_HAT = {
  ".....kkkkkk.....",
  ".....kkkkkk.....",
  ".....kkkkkk.....",
  ".....rrrrrr.....",
  "...kkkkkkkkkk...",
}
local SCARF = {
  "...rrrrrrrrr....",
  "...rrrrrrrrrr...",
  "....rrrrrrrrR...",
  "..........RR....",
  "..........RR....",
  "..........RR....",
  "...........R....",
}
local COLLAR = {
  "....bbbbbbbb....",
  "...bbbbbbbbbb...",
}

-- An old man with his feet at (x, feet), facing left. regular: the red-scarfed regular in his top
-- hat and grey coat, not the passing one in his flat cap and brown coat. step: 0-3 through his walk
-- (nil standing); head: 0, or 1 settled (breathing), or 2 nodding; grin; tip: his hand out with a coin.
-- The style sample draws the regular with it; the passing elders are F.person's.
function F.oldMan(b, x, feet, step, head, grin, tip, regular)
  local ox, top = math.floor(x + 0.5) - 8, feet - 45
  local s = STRIDE[step or "stand"]
  local bob = s[3]
  D.shadow(b, ox + 8, feet + 0.5, 10, 2.5)
  leg(b, ox + 5, top + 33, ox + 5 + s[2][1], feet - s[2][2], 2, C.ink, C.wood[1])
  leg(b, ox + 9, top + 33, ox + 9 + s[1][1], feet - s[1][2], 2, C.ink, C.wood[1])
  local c, sh = regular and "c" or "b", regular and "C" or "B"
  if not tip then -- the cane, planted on the path ahead of him
    local cx = ox + (step and (step == 0 and -2 or step == 2 and 1 or 0) or 0)
    rect(b, cx, top + 27 + bob, cx, feet - 1, C.wood[1])
    rect(b, cx, top + 24 + bob, cx + 1, top + 24 + bob, C.wood[1])
  end
  stamp(b, ox, top + 16 + bob, coat(c, sh))
  local hx, hy = ox - (head == 2 and 1 or 0), top + bob + ((head or 0) > 0 and 1 or 0)
  stamp(b, hx, hy + 5, grin and OLD_FACE_GRIN or OLD_FACE)
  stamp(b, hx, hy, regular and TOP_HAT or FLAT_CAP)
  if regular then stamp(b, ox, top + 14 + bob, SCARF) else stamp(b, ox, top + 14 + bob, COLLAR) end
  if tip then stamp(b, ox - 5, top + 17 + bob, armTip(sh)) else stamp(b, ox, top + 17 + bob, armCane(c, sh)) end
end

-------------------------------------------------------------------------------------------------
-- The passers-by. Each kind keeps its sign: the jogger's running kit, the elder's cane and long coat,
-- the student's headphones and backpack, the commuter's suit and briefcase. Each has six looks,
-- three women and three men (F.LOOKS), drawn from parts: the kind's body, a hair style and a face,
-- with the look's colours swapped in by letter.

-- Each skin tone's letters: its base, then its shadow.
local SKIN = { light = { "s", "S" }, tan = { "a", "A" }, brown = { "t", "T" }, deep = { "m", "M" } }

-- A pixel map with letters swapped all in one pass, so a swapped letter is never swapped again:
-- map[from] = to, and any letter not in map stays as it is.
local function paint(rows, map)
  local out = {}
  for i, r in ipairs(rows) do out[i] = r:gsub(".", map) end
  return out
end

-- Faces, rows 5-13 of the head, in the light skin's letters ("H" the hair behind the ear, or the
-- beard).
local FACE = {
  "....ssssssHH....",
  "....sssssssHH...",
  "...sksssssSHH...",
  "..ssssssssSH....",
  "...sssssssS.....",
  "...ssSssssS.....",
  "....sssssS......",
  ".....SSSS.......",
  "......SS........",
}
local SHORT_BEARD = {
  "....ssssssHH....",
  "....sssssssHH...",
  "...sksssssSHH...",
  "..ssssssssSH....",
  "...sssssssH.....",
  "...sHHHHHHH.....",
  "....HHHHHH......",
  ".....HHHH.......",
  "......SS........",
}
local FACES = { plain = FACE, beard = paint(OLD_FACE, { w = "H" }), shortBeard = SHORT_BEARD }

-- Hair: `top` from the head's row 0, drawn over the face, and `back` (a row, then its rows) drawn
-- after it: a ponytail, a bob, long hair down the back. "H" is the hair's colour.
local HAIR = {
  short = { top = { -- the grey-suited commuter's
    "................",
    "................",
    "................",
    ".....HHHHHH.....",
    "....HHHHHHHHH...",
  } },
  band = { top = { -- the red-topped jogger's, in a white headband
    "................",
    "................",
    "......HHHHH.....",
    "....HHHHHHHHH...",
    "...HHHHHHHHHHH..",
    "....wwwwwwwwHH..",
  } },
  student = { top = { -- the blue-hoodied student's
    "................",
    "......HHHH......",
    "....HHHHHHHH....",
    "...HHHHHHHHHH...",
    "...HHHHHHHHHHH..",
    "..........HHHH..",
  } },
  buzz = { top = {
    "................",
    "................",
    "................",
    "......HHHHH.....",
    ".....HHHHHHHH...",
  } },
  curls = { top = {
    "................",
    "......H.HH......",
    "....HHHHHHHH....",
    "...HHHHHHHHHH...",
    "..HHHHHHHHHHHH..",
    "...H.HHH.HHHHH..",
  } },
  messy = { top = {
    "................",
    ".....H..H.......",
    "....HHHHHHH.H...",
    "...HHHHHHHHHH...",
    "..HHHHHHHHHHHH..",
    "...H.HH..HHHHH..",
  } },
  part = { top = { -- a side parting, swept forward
    "................",
    "................",
    "....HHHHH.......",
    "...HHHHHHHHHH...",
    "...HHHHHHHHHHH..",
    "...H......HH....",
  } },
  bald = { top = {
    "................",
    "................",
    "................",
    ".....ssssss.....",
    "....sssssssSS...",
  } },
  flatCap = { top = FLAT_CAP },
  ponytail = { top = { -- tied high, swinging behind
    "................",
    "................",
    "......HHHH......",
    "....HHHHHHHHH...",
    "...HHHHHHHHHHHH.",
  }, back = { 3,
    ".............HH.",
    "..............HH",
    "..............HH",
    "...............H",
    "...............H",
    "..............H.",
  } },
  puff = { top = { -- a short afro in a white headband
    ".....HHHHH......",
    "...HHHHHHHHH....",
    "..HHHHHHHHHHH...",
    "..HHHHHHHHHHHH..",
    "...wwwwwwwwwHH..",
  }, back = { 5,
    "..........HHH...",
    "...........HHH..",
  } },
  cap = { top = { -- a dark running cap, a ponytail through its back
    "................",
    "................",
    "......hhhhh.....",
    ".....hhhhhhhh...",
    "..hhhhhhhhhhhH..",
  }, back = { 4,
    ".............HH.",
    "..............HH",
    "..............H.",
    "..............H.",
  } },
  bob = { top = {
    "................",
    "................",
    ".....HHHHHH.....",
    "....HHHHHHHHH...",
    "...HHHHHHHHHHH..",
    "...HHH....HHHH..",
  }, back = { 6,
    "..........HHHH..",
    "..........HHHH..",
    "..........HHHH..",
    "..........HHHH..",
    "..........HHH...",
    ".........HHH....",
  } },
  long = { top = {
    "................",
    "......HHHH......",
    "....HHHHHHHH....",
    "...HHHHHHHHHH...",
    "..HHHHHHHHHHHH..",
    "..HH......HHHH..",
  }, back = { 6,
    "..........HHHH..",
    "..........HHHH..",
    "..........HHHH..",
    "..........HHH...",
    "..........HHH...",
    "..........HHH...",
    "..........HHH...",
    "..........HHH...",
    "..........HHH...",
    "...........HH...",
    "...........HH...",
  } },
  braids = { top = { -- box braids, pulled back
    "................",
    "......HHHH......",
    "....HHHHHHHH....",
    "...HHHHHHHHHH...",
    "...HHHHHHHHHHH..",
    "..........HHHH..",
  }, back = { 6,
    "..........HhHh..",
    "..........HhHh..",
    "..........HhH...",
    "..........HhH...",
    "..........HhH...",
    "..........HhH...",
    "..........HhH...",
    "..........HhH...",
    "..........H.H...",
    "..........H.H...",
  } },
  locs = { top = {
    "................",
    "......HHHH......",
    "....HHHHHHHH....",
    "...HHHHHHHHHH...",
    "..HHHHHHHHHHHH..",
    "..........HHHHH.",
  }, back = { 6,
    "..........H.HHH.",
    "..........H.H.H.",
    ".........HH.H.H.",
    "............H.H.",
    "............H.H.",
    "..............H.",
  } },
  bun = { top = {
    "................",
    "................",
    "...........HHH..",
    ".....HHHHHHHHHH.",
    "....HHHHHHHHHHH.",
  } },
  oldCurls = { top = { -- short, curled
    "................",
    "................",
    ".....H.HH.H.....",
    "....HHHHHHHHH...",
    "...HHHHHHHHHHH..",
    "...H.H....HHHH..",
  } },
  scarf = { top = { -- a headscarf, over the hair and round the neck
    "................",
    "......HHHH......",
    "....HHHHHHHH....",
    "...HHHHHHHHHH...",
    "...HHHHHHHHHHH..",
    "...H......HHHH..",
  }, back = { 6,
    "..........HHHH..",
    "..........HHHH..",
    ".........HHHHH..",
    ".........HHHHH..",
    "........HHHHHH..",
    ".......HHHHHH...",
    ".....HHHHHHH....",
    "....HHHHHHHH....",
  } },
}

-- The student's headphones: a band over the hair and a cup on the ear.
local HEADPHONES = {
  "...hhhhhhhhh....",
  "................",
  "................",
  "...........hh...",
  "...........hh...",
  "...........hh...",
}

-- The kinds' bodies from row 14, as the first four passers-by were drawn: "1" and "2" are the top's
-- colour and its shadow, "3" and "4" the shorts', jeans' or skirt's, and "5" the tie. Skin is in the
-- light tone's letters.
local JOGGER = {
  "....1111111.....",
  "...1111111112...",
  "..111111111122..",
  "..111111111122..",
  "..s1111111112s..",
  "..s1111111112s..",
  "..S1111111112S..",
  "..S1111111112S..",
  "..S1111111112S..",
  "..ss111111112ss.",
  "...1111111112...",
  "...3333333333...",
  "...3333333333...",
  "...3333333333...",
  "...33333.3333...",
}
local STUDENT = {
  "...1111111122...",
  "..11111111122Y..",
  "..11111111122Yy.",
  "..11111111122Yy.",
  "..11111111122Yy.",
  "..11111111122Yy.",
  "..11111111122Yy.",
  "..s1111111122Yy.",
  "..s1111111122Yy.",
  "..S1111111122Y..",
  "..S2222222222...",
  "...1111111112...",
  "...2222222222...",
}
local JEANS = {
  "...3333333333...",
  "...3333333333...",
  "...33333.3333...",
  "...3333...333...",
}
local DENIM_SKIRT = {
  "...3333333333...",
  "..333333333333..",
  "..333333333333..",
  "..333333333333..",
  "..444444444444..",
}
local SUIT = {
  "....1w5w11......",
  "...11w5w11122...",
  "..111w5w111122..",
  "..111w5w111122..",
  "..111151111122..",
  "..111151111122..",
  "..111111k11122..",
  "..111111111122..",
  "..111111111122..",
  "..1111111k1122..",
  "..111111111122..",
  "..ss111111112s..",
  "..ss111111112s..",
  "..DDDD11111112..",
  "..DDDDD1111112..",
  "..DDDDD2222222..",
  "..DDDDD222222...",
}
local TROUSERS = {
  "...22222.2222...",
  "...2222...222...",
}
local SKIRT = {
  "...2222222222...",
  "...2222222222...",
  "...2222222222...",
  "...2222222222...",
}
local TRENCH = { -- a trench coat's skirt, to the knees
  "...11111111112..",
  "...11111111112..",
  "...11111111112..",
  "..111111111112..",
  "..111111111122..",
  "..111111111122..",
}

local function join(a, b)
  local out = { table.unpack(a) }
  for _, r in ipairs(b) do out[#out + 1] = r end
  return out
end

-- Each kind's body for a look, in its colours: its hips' row, its legs { near, far, shoe } (letters),
-- and its pixel map from row 14.
local BODY = {}
function BODY.jogger(lk, sk)
  local legs = lk.leggings and { lk.bottom[1], lk.bottom[2], "w" } or { sk[1], sk[2], "w" }
  return { hip = 27, legs = legs, body = paint(JOGGER, { ["1"] = lk.top[1], ["2"] = lk.top[2], ["3"] = lk.bottom[1], s = sk[1], S = sk[2] }) }
end
function BODY.student(lk, sk)
  local legs = lk.skirt and { sk[1], sk[2], "w" } or { lk.bottom[1], lk.bottom[2], "w" }
  local map = { ["1"] = lk.top[1], ["2"] = lk.top[2], ["3"] = lk.bottom[1], ["4"] = lk.bottom[2], s = sk[1], S = sk[2] }
  return { hip = 30, legs = legs, body = paint(join(STUDENT, lk.skirt and DENIM_SKIRT or JEANS), map) }
end
function BODY.commuter(lk, sk)
  local below = { trousers = TROUSERS, skirt = SKIRT, trench = TRENCH }
  local legs = ({ trousers = { lk.suit[2], "k", "k" }, skirt = { sk[1], sk[2], "k" }, trench = { "h", "k", "k" } })[lk.below]
  local map = { ["1"] = lk.suit[1], ["2"] = lk.suit[2], ["5"] = lk.tie or "w", s = sk[1], S = sk[2] }
  return { hip = 32, legs = legs, body = paint(join(SUIT, below[lk.below]), map) }
end

-- The looks, in order (look 0 first). who: "woman" or "man"; skin: a SKIN tone; hair: { a HAIR
-- style, its colour }; face: a FACES face (plain if none); and the kind's clothes.
--   jogger: top { base, shadow }, bottom { near, far } (shorts, or leggings on the legs too)
--   elder: coat { base, shadow }
--   student: top { base, shadow }, bottom { base, shadow } (jeans, or a skirt)
--   commuter: suit { base, shadow }, tie (none for a blouse), below: trousers, skirt or trench
F.LOOKS = {
  jogger = {
    { who = "woman", skin = "tan", hair = { "ponytail", "D" }, top = { "j", "J" }, bottom = { "h", "k" }, leggings = true },
    { who = "woman", skin = "deep", hair = { "puff", "k" }, top = { "y", "Y" }, bottom = { "k", "k" } },
    { who = "woman", skin = "light", hair = { "cap", "z" }, top = { "f", "F" }, bottom = { "c", "C" }, leggings = true },
    { who = "man", skin = "light", hair = { "band", "k" }, top = { "r", "R" }, bottom = { "k", "k" } },
    { who = "man", skin = "brown", hair = { "buzz", "k" }, top = { "u", "U" }, bottom = { "C", "C" } },
    { who = "man", skin = "tan", hair = { "curls", "D" }, top = { "p", "P" }, bottom = { "k", "k" } },
  },
  elder = {
    { who = "man", skin = "light", hair = { "flatCap", "w" }, face = "beard", coat = { "b", "B" } },
    { who = "woman", skin = "tan", hair = { "bun", "c" }, coat = { "p", "P" } },
    { who = "woman", skin = "deep", hair = { "oldCurls", "w" }, coat = { "v", "V" } },
    { who = "man", skin = "brown", hair = { "bald", "c" }, face = "beard", coat = { "u", "U" } },
    { who = "woman", skin = "brown", hair = { "scarf", "f" }, coat = { "g", "G" } },
    { who = "man", skin = "light", hair = { "short", "w" }, coat = { "h", "k" } },
  },
  student = {
    { who = "man", skin = "brown", hair = { "student", "k" }, top = { "u", "U" }, bottom = { "h", "k" } },
    { who = "woman", skin = "light", hair = { "long", "k" }, top = { "c", "C" }, bottom = { "u", "U" } },
    { who = "woman", skin = "deep", hair = { "braids", "k" }, top = { "j", "J" }, bottom = { "u", "U" }, skirt = true },
    { who = "man", skin = "deep", hair = { "locs", "k" }, top = { "r", "R" }, bottom = { "h", "k" } },
    { who = "woman", skin = "tan", hair = { "bob", "f" }, top = { "p", "P" }, bottom = { "h", "k" } },
    { who = "man", skin = "light", hair = { "messy", "z" }, top = { "v", "V" }, bottom = { "u", "U" } },
  },
  commuter = {
    { who = "man", skin = "light", hair = { "short", "D" }, suit = { "c", "C" }, tie = "r", below = "trousers" },
    { who = "woman", skin = "brown", hair = { "bob", "k" }, suit = { "U", "k" }, below = "skirt" },
    { who = "woman", skin = "light", hair = { "long", "x" }, suit = { "h", "k" }, below = "trousers" },
    { who = "man", skin = "tan", hair = { "part", "k" }, suit = { "U", "k" }, tie = "f", below = "trousers" },
    { who = "woman", skin = "deep", hair = { "bun", "k" }, suit = { "g", "G" }, below = "trench" },
    { who = "man", skin = "deep", hair = { "buzz", "k" }, face = "shortBeard", suit = { "b", "B" }, tie = "u", below = "trousers" },
  },
}

-- A look's head, its top-left at (hx, hy): the face, then the hair over it and behind it.
local function drawHead(b, lk, sk, hx, hy)
  local map = { s = sk[1], S = sk[2], H = lk.hair[2] }
  local face = paint(FACES[lk.face or "plain"], map)
  stamp(b, hx, hy + 14 - #face, face)
  local hair = HAIR[lk.hair[1]]
  stamp(b, hx, hy, paint(hair.top, map))
  if hair.back then stamp(b, hx, hy + hair.back[1], paint({ table.unpack(hair.back, 2) }, map)) end
end

-- A passer-by with their feet at (x, feet), facing left: a kind, and its look (0-5). step: 0-3
-- through the walk (nil standing); head: 0, 1 settled (breathing) or 2 nodding.
function F.person(b, kind, look, x, feet, step, head)
  local lk = assert(F.LOOKS[kind][look + 1], "no look " .. look .. " for " .. kind)
  local sk = SKIN[lk.skin]
  local ox, top = math.floor(x + 0.5) - 8, feet - 45
  local s = STRIDE[step or "stand"]
  local bob = s[3]
  local hx, hy = ox - (head == 2 and 1 or 0), top + bob + ((head or 0) > 0 and 1 or 0)
  if kind == "elder" then -- as the old man is drawn, in the look's coat, with the cane
    local c, sh = lk.coat[1], lk.coat[2]
    D.shadow(b, ox + 8, feet + 0.5, 10, 2.5)
    leg(b, ox + 5, top + 33, ox + 5 + s[2][1], feet - s[2][2], 2, C.ink, C.wood[1])
    leg(b, ox + 9, top + 33, ox + 9 + s[1][1], feet - s[1][2], 2, C.ink, C.wood[1])
    local cx = ox + (step and (step == 0 and -2 or step == 2 and 1 or 0) or 0)
    rect(b, cx, top + 27 + bob, cx, feet - 1, C.wood[1])
    rect(b, cx, top + 24 + bob, cx + 1, top + 24 + bob, C.wood[1])
    stamp(b, ox, top + 16 + bob, coat(c, sh))
    drawHead(b, lk, sk, hx, hy)
    stamp(b, ox, top + 14 + bob, paint(COLLAR, { b = c }))
    stamp(b, ox, top + 17 + bob, paint(armCane(c, sh), { s = sk[1] }))
    return
  end
  local k = BODY[kind](lk, sk)
  D.shadow(b, ox + 8, feet + 0.5, 9, 2.5)
  leg(b, ox + 4, top + k.hip + bob, ox + 4 + s[2][1], feet - s[2][2], 3, D.PX[k.legs[2]], D.PX[k.legs[3]])
  leg(b, ox + 8, top + k.hip + bob, ox + 8 + s[1][1], feet - s[1][2], 3, D.PX[k.legs[1]], D.PX[k.legs[3]])
  stamp(b, ox, top + 14 + bob, k.body)
  drawHead(b, lk, sk, hx, hy)
  if kind == "student" then stamp(b, hx, hy + 4, HEADPHONES) end
end

-------------------------------------------------------------------------------------------------
-- The reactions over a listener's head: a pale bubble with its tail down, and a sign inside, in two
-- frames, over a flat dark shadow a pixel down and right, so it reads against the sun too. Each is
-- drawn with its tail's tip at (x, y).

local BUBBLE = {
  ".wwwwwwwwwww.",
  "wwwwwwwwwwwww",
  "wwwwwwwwwwwww",
  "wwwwwwwwwwwww",
  "wwwwwwwwwwwww",
  "wwwwwwwwwwwww",
  "wwwwwwwwwwwww",
  "wwwwwwwwwwwww",
  ".wwwwwwwwwww.",
  ".....www.....",
  "......w......",
}
-- Signs: 11 wide by 7 tall, drawn inside the bubble.
local SIGNS = {
  repeat_ = { -- bored by a repeat: a yawn's Zs
    { "......kkkk.", ".........k.", "..kkk..kk..", "....k.kkkk.", "...k.......", "..kkk......", "..........." },
    { "...........", "......kkkk.", ".........k.", "..kkk..kk..", "....k.kkkk.", "...k.......", "..kkk......" },
  },
  offKey = { -- a frown, brows down
    { "..R.....R..", "...R...R...", "...........", "...k...k...", "...........", "....RRR....", "...R...R..." },
    { "...R...R...", "..R.....R..", "...........", "...k...k...", "...........", "....RRR....", "...R...R..." },
  },
  callback = { -- a grin
    { "...........", "..kk...kk..", "...........", "..Y.....Y..", "...YYYYY...", "...YkkkY...", "....YYY...." },
    { "..kk...kk..", "...........", "..Y.....Y..", "...YYYYY...", "...YkkkY...", "....YYY....", "..........." },
  },
  taste = { -- two notes, bouncing
    { "....kk.....", "....k.k....", "....k...k..", "..kkk...k..", ".kkkk.kkk..", "..kk.kkkk..", "......kk..." },
    { "........k..", "....kk..k..", "....k.kkk..", "....k.kkkk.", "..kkk..kk..", ".kkkk......", "..kk......." },
  },
  random = { -- a tilted head's question
    { "...kkkkk...", "..kk...kk..", ".......kk..", ".....kkk...", ".....kk....", "...........", ".....kk...." },
    { "....kkkkk..", "...kk...kk.", "........kk.", "......kkk..", ".....kk....", "...........", "....kk....." },
  },
  silence = { -- drifting off
    { "...........", "...........", "...........", "...........", "...........", ".kk..kk....", ".kk..kk...." },
    { "...........", "...........", "...........", "...........", "...........", ".kk..kk..kk", ".kk..kk..kk" },
  },
  loud = { -- a wince
    { "..k.....k..", "...k...k...", "..k.....k..", "...........", "...kkkkk...", "..k.k.k.k..", "...kkkkk..." },
    { "...........", "..kk...kk..", "...........", "...........", "...kkkkk...", "..k.k.k.k..", "...kkkkk..." },
  },
  recognised = { -- a nod: a tick
    { "...........", ".........o.", "........oo.", ".o.....oo..", ".oo...oo...", "..oo.oo....", "...ooo....." },
    { ".........o.", "........oo.", ".o.....oo..", ".oo...oo...", "..oo.oo....", "...ooo.....", "..........." },
  },
}
F.REACTIONS = { "repeat", "offKey", "callback", "taste", "random", "silence", "loud", "recognised" }

function F.reaction(b, rule, frame, x, y)
  local ox, oy = x - 6, y - 10
  for j, row in ipairs(BUBBLE) do
    for i = 1, #row do
      if row:sub(i, i) ~= "." then L.set(b, ox + i, oy + j, C.ink) end
    end
  end
  stamp(b, ox, oy, BUBBLE)
  local sign = SIGNS[rule == "repeat" and "repeat_" or rule]
  stamp(b, ox + 1, oy + 1, sign[frame + 1])
end

-------------------------------------------------------------------------------------------------
-- The pigeons by your case, facing left, feet at (x, y): pecking (frame 1 the head down), walking,
-- and flying (wings up, then down).

local PIGEON = {
  peck = {
    { ".CC......", "Ccce.....", ".ceeccc..", "..cccccCC", "..ccCCCC.", "....r.r.." },
    { ".........", "..eccc...", "..cccccCC", "CccccCCC.", ".C..r.r..", "........." },
  },
  walk = {
    { ".CC......", "Ccce.....", ".ceeccc..", "..cccccCC", "..ccCCCC.", "...r..r.." },
    { ".CC......", "Ccce.....", ".ceeccc..", "..cccccCC", "..ccCCCC.", "....rr..." },
  },
  fly = {
    { "....CC...", "...CcC...", ".CC.cC...", "Ccceccccc", ".cccCCC..", "........." },
    { ".........", ".CC......", "Ccceccccc", ".cccCCC..", "...cCC...", "....CC..." },
  },
}

function F.pigeon(b, pose, frame, x, y)
  stamp(b, x - 4, y - 5, PIGEON[pose][frame + 1])
end

-- A distant bird, crossing the sky: wings up, then level. Centred on (x, y).
function F.bird(b, frame, x, y)
  if frame == 0 then stamp(b, x - 3, y - 1, { "k.....k", ".k...k.", "..kkk.." })
  else stamp(b, x - 3, y - 1, { ".......", "kkk.kkk", "...k..." }) end
end

return F
```

- [ ] **Step 5: A person's frames per look, and the line-up**

In `art/open-case/sprites.lua`, add `looks` to the header's list of what `sprites.json` holds. After the line `--              the words on the sign and on the chalkboard), lift (pixels a chosen item rises)` add:

```lua
--   looks      { kind: ["woman" | "man", ...] }: each kind's passers-by, look 0 first (their frames are
--              <kind>-<look>-walk-<0-3>, -stand-<0-1> and -nod-<0-1>, each -left and -right)
```

Replace the passers-by's loop (`for _, kind in ipairs(F.KINDS) do` … its `end`) with:

```lua
for _, kind in ipairs(F.KINDS) do
  for look = 0, #F.LOOKS[kind] - 1 do
    local who = ("%s-%d"):format(kind, look)
    for step = 0, 3 do person(("%s-walk-%d"):format(who, step), function(b) F.person(b, kind, look, 12, 47, step, 0) end) end
    for f = 0, 1 do person(("%s-stand-%d"):format(who, f), function(b) F.person(b, kind, look, 12, 47, nil, f) end) end
    for f = 0, 1 do person(("%s-nod-%d"):format(who, f), function(b) F.person(b, kind, look, 12, 47, nil, f * 2) end) end
  end
end
```

In the JSON, before the line `  '  "colors": {',` add:

```lua
  '  "looks": { ' .. table.concat((function()
    local out = {}
    for i, kind in ipairs(F.KINDS) do
      out[i] = ('"%s": %s'):format(kind, list(F.LOOKS[kind], function(lk) return q(lk.who) end))
    end
    return out
  end)(), ", ") .. " },",
```

Create `art/open-case/lineup.lua`:

```lua
-- The passers-by's line-up, for checking the art by eye: every look of every kind, a row a kind,
-- each standing, mid-stride and walking the other way, in front of the hedge and on the path as in
-- the park. Run from the repo root:
--   aseprite -b --script art/open-case/lineup.lua
-- Writes art/open-case/preview-lineup.png (at 3x). Previews aren't committed.
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local D = dofile(here .. "draw.lua")
local F = dofile(here .. "figures.lua")
local L, C = D.L, D.C
local CELL, ROW = 20, 54 -- each figure's width in the line-up, and each kind's row's height

local b = L.buffer(4 + #F.LOOKS.jogger * 3 * CELL, #F.KINDS * ROW)
for i, kind in ipairs(F.KINDS) do
  local y0, feet = (i - 1) * ROW, (i - 1) * ROW + 49
  L.fillRect(b, 0, y0, b.w - 1, y0 + 29, C.leaf[2]) -- the hedge
  L.fillRect(b, 0, y0 + 30, b.w - 1, y0 + ROW - 1, C.path[2]) -- the path
  for look = 0, #F.LOOKS[kind] - 1 do
    local x = 2 + look * 3 * CELL + CELL / 2
    F.person(b, kind, look, x, feet, nil, 0)
    F.person(b, kind, look, x + CELL, feet, 0, 0)
    local fig = L.buffer(24, 50) -- the third, mirrored to walk right
    F.person(fig, kind, look, 12, 47, 2, 0)
    L.blit(b, D.mirror(fig), x + 2 * CELL - 11, feet - 47)
  end
end
L.save(L.scale(b, 3), nil, "art/open-case/preview-lineup.png")
print("line-up: preview-lineup.png")
```

- [ ] **Step 6: Build the sheet, and look at the people**

From the repo root:

```bash
/Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/sprites.lua
```

Expected: `sprites: 550 frames on a 512x1968 sheet, 49 colours`. Run it again: `git status` must show nothing new since the first run (it's deterministic).

```bash
/Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/style-sample.lua
/Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/lineup.lua
```

Expected: the style sample still draws the regular and prints `style sample: preview-style.png, …`. The line-up prints `line-up: preview-lineup.png`. Open `art/open-case/preview-lineup.png`: four rows (joggers, elders, students, commuters), each six people standing, mid-stride and walking the other way, all different, matching the table under "Settled in the prototype". Don't commit the previews.

- [ ] **Step 7: Name the look in the frame**

In `open-case/src/render.js`, replace `personFrame` and its comment with:

```js
// The frame a passer-by shows, as the person they are (their kind and look): walking by where they
// are (so a slower walker steps slower), and standing still facing you, breathing, or nodding on the
// beat once they're hooked.
export function personFrame(p, t, time) {
  const facingYou = p.state === 'stopped' || p.state === 'joining';
  const face = (facingYou ? (p.x < CROWD.playerX ? 1 : -1) : p.dir) > 0 ? 'right' : 'left';
  if (p.state !== 'stopped') return `${p.kind}-${p.look}-walk-${frameOf((Math.abs(p.x) + Math.abs(p.y)) / STEP, 4)}-${face}`;
  if (p.interest > INTEREST.hook) return `${p.kind}-${p.look}-nod-${t / BEAT - Math.floor(t / BEAT) < NOD ? 1 : 0}-${face}`;
  return `${p.kind}-${p.look}-stand-${frameOf(time / BREATH + p.id * 0.37, 2)}-${face}`;
}
```

- [ ] **Step 8: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 229 tests.

- [ ] **Step 9: Commit**

```bash
git add art/open-case/palette.lua art/open-case/draw.lua art/open-case/figures.lua art/open-case/sprites.lua art/open-case/lineup.lua open-case/assets/sprites.png open-case/assets/sprites.json open-case/src/render.js open-case/test/art.test.js open-case/test/render.test.js
git commit -m "Open Case: six people of each kind, three women and three men, in the sprite sheet

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: The end card's words, and the docs

**Files:**
- Modify: `open-case/src/main.js`
- Modify: `README.md`, `docs/superpowers/specs/2026-09-29-open-case-passers-by-design.md`

**Interfaces:**
- Consumes: `personName(kind, who)` and `longest.look` (Task 2), and `art.data.looks` (Task 3).

- [ ] **Step 1: The end card names the person**

In `open-case/src/main.js`, change the import `import { crowdSize } from './crowd.js';` to:

```js
import { crowdSize, personName } from './crowd.js';
```

In `showEnd`, replace:

```js
    const names = { jogger: 'A jogger', elder: 'An old man', student: 'A student', commuter: 'A commuter' };
    document.getElementById('end-longest').textContent = s.longest
      ? `${names[s.longest.kind]} stayed longest: ${Math.round(s.longest.seconds)} seconds.`
```

with:

```js
    document.getElementById('end-longest').textContent = s.longest
      ? `${personName(s.longest.kind, art.data.looks[s.longest.kind][s.longest.look])} stayed longest: ${Math.round(s.longest.seconds)} seconds.`
```

- [ ] **Step 2: The README**

In `README.md`'s Open Case paragraph:
- After "passers-by stop, stay and tip according to what you play." add: "Four kinds walk by, joggers, elders, students and commuters, each with their own taste, and six different people of each kind."
- Replace "and the loop pedal's is `docs/superpowers/specs/2026-09-29-open-case-loop-pedal-design.md`." with "the loop pedal's is `docs/superpowers/specs/2026-09-29-open-case-loop-pedal-design.md`, and the passers-by's looks' is `docs/superpowers/specs/2026-09-29-open-case-passers-by-design.md`."

In the Art bullet:
- Replace "`figures.lua` (the passers-by, their reactions, the pigeons and the birds)" with "`figures.lua` (the passers-by, six people of each kind drawn from parts, their reactions, the pigeons and the birds)".
- After "The style sample writes `art/open-case/preview-style.png` and `preview-oldman.gif`." add: "`lineup.lua` writes `art/open-case/preview-lineup.png`, every passer-by standing and walking, to check the people by eye."

- [ ] **Step 3: The spec says what was built**

In `docs/superpowers/specs/2026-09-29-open-case-passers-by-design.md`, replace the Status line with:

```markdown
**Status:** Nathan picked "same tastes, new people" and agreed the design in chat. He asked to skip a preview of the line-up ("no need to show me the lineup, go ahead and write up the spec"), then for the plan. Built from `docs/superpowers/plans/2026-09-29-open-case-passers-by.md`.
```

Then, before `## Not in this change`, add:

```markdown
## What the build settled

The plan's prototype settled a few things the line-up left open:
- **A few colours changed** to read better. The jogger's running cap is charcoal, since a white one read as pale hair. The white-haired elder's coat is charcoal too: the dark green was the hedge's own colour. The student in box braids wears teal, not yellow, next to the yellow backpack every student carries. "Navy" is the palette's deep blue.
- **Ten new colours:** tan and deep brown skin, a rose, a teal, auburn and blonde. The sheet has 49 of its 64 colours, 550 frames, and weighs 74 KB.
- **The closest two looks of a kind** still differ in 150 pixels. The art tests ask for at least 60.
- **The skirts:** the commuter's skirt suit and the student's denim skirt come to the knee, with bare legs below. The other women wear trousers, leggings, running shorts or a long coat.
```

- [ ] **Step 4: Run the tests, and check it in Chrome**

Run: `cd open-case && npm test`
Expected: PASS, 229 tests.

Serve the repo root (`python3 -m http.server 8765 --bind 127.0.0.1`) and open `http://127.0.0.1:8765/open-case/?seed=8&coins=0`. Press a key, then play a note, and watch the people walk by and stop: joggers, elders, students and commuters, women and men, no two alike on screen. At the set's end the card names who stayed longest by kind ("A student", or "An old woman"/"An old man" for an elder).

- [ ] **Step 5: Commit**

```bash
git add open-case/src/main.js README.md docs/superpowers/specs/2026-09-29-open-case-passers-by-design.md
git commit -m "Open Case: the end card names who stayed as the person they were, and the docs follow

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```
