# Open Case Loop Pedal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a loop pedal to Open Case's music shop. Once it's yours, R records 4 bars of the notes you play, from the next bar line, and they loop under you through your instrument and pedals, up to three layers; Backspace takes the last one off. You can try it in the shop over the band's electric piano, and the crowd still hears only what you play live.

**Architecture:**
- A new pure module, `looper.js`, holds the loop as notes, on band time (seconds since the band's first 16th): recording, layers, undo, and which looped notes are due between two moments.
- `audio.js` schedules those notes a moment ahead along with the band's, each as a voice of its own through your instrument and pedals. It fades them with the band, plays a softer keys-only band for trying the pedal in the shop, and adds a safety before the speakers so stacked loops can't clip.
- The art scripts:
  - draw the loop pedal by the crate, its strip icon, and its place on a wider shop rack;
  - turn the old blue looper box into the band's speaker.
- `render.js` shows the loop pedal's light, the strip's loop slot and its news, and looped notes rising from the pedal.
- `main.js` wires R and Backspace, your live notes and the loop together. The crowd's rules don't change.

**Tech Stack:** Plain ES modules, Canvas 2D and Web Audio, Node 22 `node --test` (no dependencies), and Aseprite 1.3 in batch mode for the art scripts.

**Spec:** `docs/superpowers/specs/2026-09-29-open-case-loop-pedal-design.md`, whose design Nathan agreed in chat ("seems perfect!"). It builds on the game's design spec (`2026-09-28-open-case-design.md`), the art spec (`2026-09-28-open-case-art-design.md`) and the shop's spec (`2026-09-28-open-case-shop-design.md`).

**Prototyped:** every file below was built and run before this plan was written, in a scratch copy of the repo. It was then replayed task by task, and each task's end state passes the whole suite:
- 200 Open Case tests (168 before), and the site's 70;
- the sprite sheet: 230 frames, 39 colours, rebuilt byte for byte.

Checked in Chrome:
- a loop recorded mid-set, a second layer over it, and a pedal stomped over it;
- trying the loop pedal in the shop, and buying it while trying it;
- a recording armed near the end of a set, dropped at the end, with `layers: 1` in the log.

The loop's loudness was measured offline in Chrome. The code in each task is that prototype's code, so transcribe it exactly.

## Global Constraints

- Every commit message starts `Open Case: ` and ends with a blank line and then `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`, exactly that line, whatever model you are.
- Stage only the files your task names (`git add <paths>`), never `git add -A` or `git add .`.
- No new dependencies: plain ES modules, Node 22's `node --test`. Run the tests with `cd open-case && npm test`.
- Aseprite runs from the repo root: `/Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/<name>.lua`. The scripts are deterministic, so a second run leaves `git status` unchanged. Previews (`art/open-case/preview-*`) are never committed.
- Flat style: every area one solid colour from `art/open-case/palette.lua`, a base and at most one shadow per material, no outlines, no dithering, no half-clear pixels. The whole game's art stays within **64 colours** and **under 400 KB** (`sprites.png`, `sprites.json` and `icon.png` together).
- **The crowd never hears the loop.** `set.js`, `listen.js`, `crowd.js`, `groove.js` and `bots.js` never import `looper.js`, `gear.js`, `shop.js`, `audio.js` or `main.js`. Only notes you play live reach `playNote` and `sceneNote`. The rules, the tips and the bots don't change.
- **The loop keeps notes, not sound.** It plays them through your instrument and your pedals as they are at the time.
- **The numbers are in `tuning.js`:**
  - `LOOP = { bars: 4, layers: 3, early: 1 }`: always 4 bars (one pass of the chords), at most 3 layers, and a note up to a 16th early for a recording's first bar line counts;
  - `SHOP.loop = { price: 100 }`.
- **Keys:**
  - R is `KeyR` → `'loop'`, and Backspace is `Backspace` → `'undo'`. Neither is a note key.
  - They do nothing until the loop pedal is yours, except while you try it in the shop.
  - They do nothing before a set's first note, or once the set's end has begun.
  - Bot sets can't use them.
- **The loop belongs to the set.** It's never saved. It fades with the band at the set's end, a recording still under way is dropped, and each set starts with an empty loop. In the shop, moving off the loop pedal or leaving the shop stops the band and throws that loop away.
- **Looped notes are voices of their own.** They never cut off a note you're playing, even on the same key, and Space never touches them. They're scheduled a moment ahead (`GROOVE.ahead`), never in the past.
- **Every note sounds the instant its key goes down.** No key press makes samples.
- Everything kept in the browser goes through `safeStorage` (`storage.js`). Owning the loop pedal is its id, `loop`, in `open-case-gear`'s `owned`. Each set's `open-case-log` entry gains `layers`, counting only layers that finished recording.
- `?coins=N` keeps nothing, and bot sets never touch the log.
- The positions from the art repaint stay:
  - you sit at `CROWD.playerX` 136;
  - passers-by walk at `PATH_Y` 146;
  - listeners stand at `CROWD.spots`;
  - coins land at `CASE` (161, 160);
  - notes float up from `GUITAR` (152, 128).
- Plain words in comments and messages, in the style of the surrounding code; comment lines wrap at about 100 characters.

## Review Focus

These are the inputs the spec implies but doesn't spell out that are most likely to bite someone playing. Each has a test or a check in the task that owns the code:

1. **Playing along with your own loop, on the same beat.** A looped chord lands on top of the same chord played live, and without a safety that clips. The prototype measured a single hard chord at −2.7 dB, and three layers plus the live chord at +9.3 dB. The sound must stay under full scale. Test: Task 4's "a safety before the speakers…". Check: Task 7's offline measurement.
2. **R pressed a hair either side of a bar line.** Just after one, it records from the next bar line. Just before one, it records from that bar line, and a note a hair early for it counts. Test: Task 1's "R arms a recording from the next bar line, even pressed just after one…" and "a note up to a 16th early…".
3. **Leaving the loop pedal mid-recording in the shop, or buying it mid-recording.** Moving on or leaving stops the band and throws the loop away. Buying keeps it. Test: Task 3's "choosing the loop pedal starts a loop…". Code: Task 6's `sound()`. Check: Task 7 buys it while trying it.
4. **The set ending while a recording runs, and R during the fade.** The recording is dropped, the layers fade out with the band, and R does nothing. Code: Task 6's `end` handling and `loopKey`. Check: Task 7 arms a recording at bar 57.
5. **A stall** (the tab is busy, or the page was paused) while the loop plays. Nothing late plays in a burst, and nothing plays twice. Test: Task 4's "your loop's notes are scheduled a moment ahead…", which cuts the time into frames and checks every note once, never in the past. Task 1's `due` test checks the same for any way the time is cut up.

## Decisions made while prototyping

Each fills in something the spec left open. The reviewer should hold the code to these:

- **The looper's API:**
  - `record(loop, t)`, `note(loop, t, id, { pitch, strength, legato })`, `release(loop, t, id)`, `step(loop, t)`, `undo(loop)` (it needs no time), `due(loop, from, to)`, plus two more:
  - `ring(loop, t, on)`, for Space: a note released while Space is held lasts until Space lets go, as in the sound;
  - `loopState(loop, t)`, for the screen.
  - Striking a pitch that still rings from Space ends the ringing note there, as the sound does.
  - `due` includes the recording's own notes, from the moment the recording ends. So a note played early for the first bar line sounds early the first time round too. The recording's notes carry layer index `loop.layers.length`.
  - A recording with no notes still becomes a layer.
- **Where the loop pedal stands:**
  - on the ground: its top-left at (128, 153), just behind the row of pedals and in front of the crate, 11 by 5 with a 2×2 light;
  - there's no room beside the row: the case is on one side and a listener's spot on the other.
  - The blue looper box becomes the band's speaker (a handle on top, a dark cone, no light). `feet.looper` becomes `feet.speaker`, and `feet.loop` is new.
- **The shop's rack is wider** (to x 240), and the chalkboard moved right (248 to 314). The pedals stand 20 px apart from x 117, and the loop pedal (18 by 17, grey) is last at x 217, so each price tag hangs clear of the next pedal. Its 2×2 light is `shop.leds.loop`.
- **The gear strip's loop slot** is the sixth place (x 186):
  - the icon (`strip-loop-dark|red|green`), "R", and three 3×3 dots at y 172;
  - a dot is lit for each layer, red for the one being recorded, and dark grey otherwise.
  - The pigeons moved 26 px right, to (222, 172), (235, 176) and (248, 170), clear of the slot.
- **The light:**
  - dark when the loop is empty;
  - while a recording waits for its bar line, red for the first half of each beat and dark for the second;
  - red while recording, green while playing.
- **The news over the strip**, for 1 s on the page's clock:
  - when R arms a recording: "loop recording" for the first layer, then "layer 2" or "layer 3" (gold);
  - "loop full", "recording cancelled", "layer removed" and "loop cleared" (light).

  Only the newer of the loop's news and a pedal stomp shows.
- **Looped notes rise faintly** (45%) from just over the loop pedal, at `LOOP_PEDAL` (133, 152). They start 0.5 px higher per semitone and drift up and to the left at 10 px/s. They show only once the note plays, and last 3 s.
- **The title's third line** reads "2-6 pedals   R loop   backspace undo".
- **In the shop:**
  - `choose(shop, at)` (the arrows and clicks both go through it) gives the shop a loop, `shop.loop`, while the loop pedal is chosen, and `null` otherwise.
  - `main.js` starts `audio.tryBand` when a loop appears and `audio.stopBand` when it goes. `start` is then the shop band's start.
  - The card's last line for the loop pedal is "R record   backspace undo   arrows choose   esc back".
  - The rack pedal's light shows the loop you're trying.
  - The band there is the keys layer alone, with no stand-in percussion, at `TRY_LEVEL` 0.35 (0.55 in a set).
  - The owned loop pedal's card says "On your board: R".
- **The sound:**
  - Each voice function takes its destination (`to`). Looped voices go into a gain per instrument (`loopIns`), which feeds that instrument's input. That gain is the loop's level (`LOOP_LEVEL` 0.8) and its fade at the set's end.
  - `update(loopDue)` schedules the loop's notes due in the same window as the band's, and returns them with their audio times (`at`) for the screen. After a stall it skips what's late.
  - `stopLoop(layer)` stops one layer's voices at once: those sounding let go, and those not yet started are disconnected so they never sound. Backspace uses it, and so does a recording dropped at the set's end.
  - `stopBand()` now also fades the band out quickly and stops every looped voice.
  - **The safety:** `master → a gain of 1/4 → a WaveShaper (safetyCurve, 4x oversampled) → the speakers`. The curve is straight up to 0.7 (about −3 dB), so the game's mix is untouched, and it rounds louder peaks off toward 0.95, for peaks up to 4× full scale.
- **The sound check** (`?sound`) plays the loop over its band, with R and Backspace, and shows the loop's state in its status line. Its pedal switches are for `kind: 'pedal'` only.
- **The log:** `setLayers` counts `'layer'` from `step` during a set (not in the shop). The `?debug` end card's log says "N loop layers".
- **Tests that change:**
  - the stock's total is now 1050 coins;
  - the art families swap `looper-0/1` for `speaker`, and add the loop pedal's frames;
  - the title test looks for the new line;
  - the pedals-by-the-crate test lists `pedal-loop-dark` first (it stands further back, so it's drawn first).
  - The fake audio context now records `disconnect()` as `node.cut = true`.

## File map

| File | What it does |
|---|---|
| `open-case/src/tuning.js` (edit) | `LOOP`; `SHOP.loop` |
| `open-case/src/looper.js` (new) | The loop as notes, pure: recording, layers, undo, what's due |
| `open-case/src/gear.js` (edit) | The loop pedal in the stock (kind `loop`) |
| `art/open-case/gear.lua`, `draw.lua`, `shop.lua`, `sprites.lua` (edit) | The loop pedal on the ground, on the strip and on the rack; the speaker |
| `art/open-case/palette.lua`, `style-sample.lua` (edit) | Comments, and the style sample's speaker |
| `open-case/assets/sprites.png`, `sprites.json` (generated) | The sheet |
| `open-case/src/shop.js` (edit) | `choose`, the shop's loop, the loop pedal's card |
| `open-case/src/keys.js`, `input.js` (edit) | R and Backspace |
| `open-case/src/audio.js` (edit) | Looped voices, the loop's fade, the shop's band, the safety |
| `open-case/src/soundcheck.js`, `index.html` (edit) | The loop pedal in the sound check |
| `open-case/src/scene.js` (edit) | Looped notes' glyphs; the pigeons moved |
| `open-case/src/render.js` (edit) | The speaker; the loop pedal's light; the strip's loop slot and news; looped glyphs; the title; the rack's light |
| `open-case/src/main.js` (edit) | The wiring |
| `open-case/src/log.js` (edit) | `layers` in the log's comments |
| `open-case/test/*` | The tests for each of the above |
| `README.md`, the Open Case specs | Say what's built |

---

### Task 1: The loop, as notes

**Files:**
- Modify: `open-case/src/tuning.js` (append `LOOP`)
- Create: `open-case/src/looper.js`
- Create: `open-case/test/looper.test.js`
- Modify: `open-case/test/set.test.js`

**Interfaces:**
- Consumes: `BAR`, `BEAT` from `groove.js` (at 80 bpm a beat is 0.75 s and a bar 3 s).
- Produces (later tasks rely on these exact names):
  - `tuning.js`: `LOOP = { bars: 4, layers: 3, early: 1 }`.
  - `looper.js`:
    - `LOOP_LENGTH`: seconds in a loop, `LOOP.bars * BAR` (12).
    - `createLoop() -> { layers: [{ from, notes }], take: { from, notes, sounding } | null, ring: false }`. A note is `{ at, pitch, strength, legato, len }`: `at` in seconds after its layer's first bar line (a hair below 0 if early), and `len` `null` while it still sounds.
    - `record(loop, t) -> boolean`: arms a recording from the next bar line (`from`).
    - `note(loop, t, id, { pitch, strength, legato }) -> boolean`: whether the note was kept.
    - `release(loop, t, id)`.
    - `ring(loop, t, on)`.
    - `step(loop, t) -> 'layer' | null`.
    - `undo(loop) -> 'cancelled' | 'removed' | 'cleared' | null`.
    - `due(loop, from, to) -> [{ t, pitch, strength, legato, len, layer }]`, in time order, with `t` in band time.
    - `loopState(loop, t) -> 'waiting' | 'recording' | 'playing' | 'empty'`.
  - All times are band time: seconds since the band's first 16th.

- [ ] **Step 1: Write the failing tests**

Create `open-case/test/looper.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLoop, record, note, release, ring, step, undo, due, loopState, LOOP_LENGTH } from '../src/looper.js';
import { BAR, BEAT } from '../src/groove.js';
import { LOOP } from '../src/tuning.js';

const SIXTEENTH = BEAT / 4;
const play = (loop, t, id, pitch, over = {}) => note(loop, t, id, { pitch, strength: 3, legato: false, ...over });
// A loop with one layer recorded from bar line `bar`: each note is [seconds after the bar line, pitch,
// seconds held].
function withLayer(loop, bar, notes) {
  record(loop, bar * BAR - 0.5);
  notes.forEach(([at, pitch, len], i) => {
    play(loop, bar * BAR + at, `k${i}`, pitch);
    release(loop, bar * BAR + at + len, `k${i}`);
  });
  step(loop, bar * BAR + LOOP_LENGTH);
  return loop;
}
const times = (notes) => notes.map((n) => Math.round(n.t * 1000) / 1000);

test('a loop is one pass of the chords: 4 bars, up to 3 layers, a 16th early allowed', () => {
  assert.deepEqual(LOOP, { bars: 4, layers: 3, early: 1 });
  assert.equal(LOOP_LENGTH, 4 * BAR);
});

test('R arms a recording from the next bar line, even pressed just after one; it records 4 bars, then plays straight back', () => {
  const loop = createLoop();
  assert.equal(loopState(loop, 1), 'empty');
  assert.equal(record(loop, BAR + 0.01), true, 'a hair after bar line 1');
  assert.equal(loop.take.from, 2 * BAR, 'waits for bar line 2');
  assert.equal(loopState(loop, 2 * BAR - 0.01), 'waiting');
  assert.equal(loopState(loop, 2 * BAR), 'recording');
  play(loop, 2 * BAR + 0.5, 'KeyA', 60);
  release(loop, 2 * BAR + 0.8, 'KeyA');
  assert.equal(step(loop, 2 * BAR + LOOP_LENGTH - 0.01), null, 'still recording');
  assert.equal(step(loop, 2 * BAR + LOOP_LENGTH), 'layer');
  assert.equal(loopState(loop, 2 * BAR + LOOP_LENGTH), 'playing');
  assert.equal(step(loop, 2 * BAR + LOOP_LENGTH + 1), null, 'only once');
  assert.deepEqual(times(due(loop, 0, 2 * BAR + 2 * LOOP_LENGTH)), [2 * BAR + LOOP_LENGTH + 0.5], 'first heard the moment the recording ends');
  const late = createLoop();
  record(late, 3 * BAR - 0.05);
  assert.equal(late.take.from, 3 * BAR, 'pressed just before a bar line, it records from that one');
});

test("R does nothing while a recording waits or runs, or once there are 3 layers", () => {
  const loop = createLoop();
  record(loop, 0.5);
  assert.equal(record(loop, 1), false, 'waiting');
  assert.equal(loop.take.from, BAR, 'the first recording stands');
  assert.equal(record(loop, BAR + 1), false, 'recording');
  step(loop, BAR + LOOP_LENGTH);
  for (let i = 1; i < LOOP.layers; i++) {
    assert.equal(record(loop, i * 10 * BAR), true);
    step(loop, (i * 10 + 1) * BAR + LOOP_LENGTH);
  }
  assert.equal(loop.layers.length, 3);
  assert.equal(record(loop, 50 * BAR), false, 'full');
  assert.equal(loop.take, null);
});

test('a layer keeps each note as played: its timing exactly, its pick strength and its hammer-ons', () => {
  const loop = createLoop();
  record(loop, 0);
  play(loop, BAR + 0.013, 'KeyA', 60, { strength: 1 });
  play(loop, BAR + 0.401, 'KeyS', 62, { strength: 4, legato: true });
  release(loop, BAR + 0.5, 'KeyA');
  release(loop, BAR + 0.9, 'KeyS');
  step(loop, BAR + LOOP_LENGTH);
  const ms = (n) => ({ ...n, at: Math.round(n.at * 1000) / 1000, len: Math.round(n.len * 1000) / 1000 });
  assert.deepEqual(loop.layers[0].notes.map(ms), [
    { at: 0.013, pitch: 60, strength: 1, legato: false, len: 0.487 },
    { at: 0.401, pitch: 62, strength: 4, legato: true, len: 0.499 },
  ]);
  const heard = due(loop, BAR + LOOP_LENGTH, BAR + 2 * LOOP_LENGTH);
  assert.deepEqual(heard.map((n) => [n.pitch, n.strength, n.legato]), [[60, 1, false], [62, 4, true]]);
  assert.ok(Math.abs(heard[1].t - (BAR + LOOP_LENGTH + 0.401)) < 1e-9, 'not snapped to the beat');
});

test("a note up to a 16th early for the first bar line counts, and plays just as early each time round; an earlier one doesn't", () => {
  const loop = createLoop();
  record(loop, 0);
  play(loop, BAR - SIXTEENTH - 0.01, 'KeyA', 60); // too early
  play(loop, BAR - 0.1, 'KeyS', 62); // a hair early
  release(loop, BAR + 0.2, 'KeyA');
  release(loop, BAR + 0.2, 'KeyS');
  step(loop, BAR + LOOP_LENGTH);
  assert.deepEqual(loop.layers[0].notes.map((n) => n.pitch), [62]);
  assert.ok(Math.abs(loop.layers[0].notes[0].at + 0.1) < 1e-9);
  assert.ok(Math.abs(loop.layers[0].notes[0].len - 0.3) < 1e-9, 'held from its early start');
  assert.deepEqual(times(due(loop, 0, BAR + 3 * LOOP_LENGTH)), [BAR + LOOP_LENGTH - 0.1, BAR + 2 * LOOP_LENGTH - 0.1, BAR + 3 * LOOP_LENGTH - 0.1]);
});

test('the early note is due even before its recording ends, so the first time round keeps it', () => {
  const loop = createLoop();
  record(loop, 0);
  play(loop, BAR - 0.1, 'KeyA', 60);
  release(loop, BAR, 'KeyA');
  assert.deepEqual(times(due(loop, BAR + LOOP_LENGTH - 0.2, BAR + LOOP_LENGTH)), [BAR + LOOP_LENGTH - 0.1], 'the recording is still under way');
  assert.equal(due(loop, BAR + LOOP_LENGTH - 0.2, BAR + LOOP_LENGTH)[0].layer, 0, "it's the next layer's note");
});

test('with Space held a note lasts until Space lets go; a note still sounding at the end is cut there', () => {
  const loop = createLoop();
  record(loop, 0);
  ring(loop, BAR, true);
  play(loop, BAR + 1, 'KeyA', 60);
  release(loop, BAR + 1.2, 'KeyA');
  ring(loop, BAR + 2, false);
  play(loop, BAR + 3, 'KeyS', 62);
  release(loop, BAR + 3.25, 'KeyS');
  play(loop, BAR + LOOP_LENGTH - 1, 'KeyD', 64); // still held when the 4 bars are up
  step(loop, BAR + LOOP_LENGTH + 0.3);
  assert.deepEqual(loop.layers[0].notes.map((n) => n.len), [1, 0.25, 1]);
});

test('a pitch struck again while it rings from Space ends the ringing note there, as in the sound', () => {
  const loop = createLoop();
  record(loop, 0);
  ring(loop, BAR, true);
  play(loop, BAR + 1, 'KeyA', 60);
  release(loop, BAR + 1.1, 'KeyA');
  play(loop, BAR + 1.5, 'KeyA', 60);
  release(loop, BAR + 1.6, 'KeyA');
  ring(loop, BAR + 3, false);
  step(loop, BAR + LOOP_LENGTH);
  assert.deepEqual(loop.layers[0].notes.map((n) => n.len), [0.5, 1.5]);
});

test('notes played before R, or while it waits for its bar line, or after the 4 bars, are not kept', () => {
  const loop = createLoop();
  assert.equal(play(loop, 0.1, 'KeyA', 60), false, 'no recording');
  record(loop, 0.2);
  assert.equal(play(loop, 1, 'KeyS', 62), false, 'waiting');
  assert.equal(play(loop, BAR + LOOP_LENGTH, 'KeyD', 64), false, 'the 4 bars are up');
  step(loop, BAR + LOOP_LENGTH);
  assert.equal(loop.layers[0].notes.length, 0);
});

test('undo cancels a waiting or running recording and keeps the layers; otherwise it takes off the last layer', () => {
  const loop = createLoop();
  assert.equal(undo(loop), null, 'nothing to undo');
  withLayer(loop, 1, [[0, 60, 0.5]]);
  withLayer(loop, 6, [[0, 64, 0.5]]);
  record(loop, 10 * BAR + 1);
  assert.equal(undo(loop), 'cancelled', 'waiting');
  record(loop, 12 * BAR + 1);
  play(loop, 13 * BAR + 1, 'KeyA', 67);
  assert.equal(undo(loop), 'cancelled', 'recording');
  assert.equal(loop.take, null);
  assert.equal(loop.layers.length, 2, 'the layers play on');
  assert.equal(undo(loop), 'removed');
  assert.deepEqual(loop.layers.map((l) => l.notes[0].pitch), [60]);
  assert.equal(undo(loop), 'cleared');
  assert.equal(loopState(loop, 20 * BAR), 'empty');
  assert.equal(undo(loop), null);
});

test('due gives each looped note once per time round, at the right moments, however the time is cut up, across the wrap', () => {
  // A layer from bar 2: notes near its start and near its end, so passes meet at the wrap.
  const loop = withLayer(createLoop(), 2, [[0, 60, 0.2], [LOOP_LENGTH - 0.05, 72, 0.04]]);
  const start = 2 * BAR + LOOP_LENGTH;
  const whole = due(loop, start, start + 3 * LOOP_LENGTH);
  assert.deepEqual(times(whole), [
    start, start + LOOP_LENGTH - 0.05, start + LOOP_LENGTH, start + 2 * LOOP_LENGTH - 0.05, start + 2 * LOOP_LENGTH, start + 3 * LOOP_LENGTH - 0.05,
  ].map((t) => Math.round(t * 1000) / 1000));
  assert.deepEqual(whole.map((n) => n.pitch), [60, 72, 60, 72, 60, 72]);
  // The same span in frame-sized windows gives the same notes, none twice and none missed.
  const cut = [];
  for (let t = start; t < start + 3 * LOOP_LENGTH - 1e-9; t += 1 / 60) cut.push(...due(loop, t, Math.min(t + 1 / 60, start + 3 * LOOP_LENGTH)));
  assert.deepEqual(times(cut), times(whole));
  assert.deepEqual(due(loop, 0, start), [], 'nothing before the recording ends');
});

test('layers play together, each from its own bar line, and each note knows its layer', () => {
  const loop = withLayer(createLoop(), 1, [[1, 60, 0.5]]);
  withLayer(loop, 7, [[2, 64, 0.5]]);
  const heard = due(loop, 11 * BAR, 11 * BAR + LOOP_LENGTH);
  assert.deepEqual(heard.map((n) => [n.pitch, n.layer]), [[64, 1], [60, 0]], 'the second layer comes round first here');
  assert.ok(heard.every((n) => Math.abs((n.t - (n.pitch === 60 ? 1 * BAR + 1 : 7 * BAR + 2)) % LOOP_LENGTH) < 1e-9));
});

test('over many passes nothing drifts', () => {
  const loop = withLayer(createLoop(), 1, [[0.123, 60, 0.3]]);
  const far = due(loop, 1000 * LOOP_LENGTH, 1001 * LOOP_LENGTH);
  assert.equal(far.length, 1);
  assert.ok(Math.abs(((far[0].t - (BAR + 0.123)) / LOOP_LENGTH) - Math.round((far[0].t - (BAR + 0.123)) / LOOP_LENGTH)) < 1e-9);
});
```

In `open-case/test/set.test.js`, replace the test `"gear only changes how you sound: the crowd's rules never see it"` with:

```js
test("gear only changes how you sound: the crowd's rules never see it, or the loop", () => {
  // The rules (the set, the ears, the crowd, the groove, the bots) import nothing from the shop, the
  // gear, the loop pedal or the sound, so a set played with every pedal on, or over a loop, scores
  // exactly as one without.
  for (const f of ['set', 'listen', 'crowd', 'groove', 'bots']) {
    const src = readFileSync(new URL(`../src/${f}.js`, import.meta.url), 'utf8');
    const imports = [...src.matchAll(/from '\.\/([a-z]+)\.js'/g)].map((m) => m[1]);
    for (const other of imports) assert.ok(!['gear', 'shop', 'audio', 'main', 'looper'].includes(other), `${f}.js imports ${other}.js`);
  }
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL. `looper.test.js` can't find `../src/looper.js`. (The set test passes already: it guards against a future mistake.)

- [ ] **Step 3: Add LOOP, and write looper.js**

Append to `open-case/src/tuning.js`:

```js

// The loop pedal (looper.js): a loop is one pass of the chords, up to `layers` deep, and a note up to
// `early` 16ths before a recording's first bar line still counts, played just as early.
export const LOOP = { bars: 4, layers: 3, early: 1 };
```

Create `open-case/src/looper.js`:

```js
// The loop pedal: R records 4 bars of what you play, from the next bar line, and they play on under
// you, over and over, up to LOOP.layers layers deep; Backspace takes the last one off. It keeps your
// notes, not their sound (when each started, its pitch, how hard it was picked, whether it was a
// hammer-on, and how long it sounded), so audio.js plays them again through your instrument and your
// pedals as they are at the time.
//
// Times are band time: seconds since the band's first 16th (in a set, since your first note), so the
// bar lines fall on whole numbers of BAR. Pure, so it's tested in Node; main.js runs it, audio.js
// plays it and render.js shows it. The crowd never hears it: set.js and the rules never import it.
import { LOOP } from './tuning.js';
import { BAR, BEAT } from './groove.js';

export const LOOP_LENGTH = LOOP.bars * BAR; // seconds: one pass of the chords
const EARLY = (LOOP.early * BEAT) / 4; // seconds: how early a note can be for a recording's first bar line

// { layers, take, ring }: the layers so far, oldest first, each { from: the band time its recording
// started, notes }; the recording waiting or under way, { from, notes, sounding }, or null; and
// whether Space is held. Each note is { at: seconds after its layer's first bar line (a hair below 0
// if it came early), pitch, strength, legato, len: seconds it sounded, null while it still does }.
export function createLoop() {
  return { layers: [], take: null, ring: false };
}

// R at band time t: arms a recording from the next bar line. Returns false, doing nothing, while a
// recording is waiting or under way, or when the loop is full.
export function record(loop, t) {
  if (loop.take || loop.layers.length >= LOOP.layers) return false;
  loop.take = { from: (Math.floor(t / BAR) + 1) * BAR, notes: [], sounding: [] };
  return true;
}

// A note you play starts at band time t (id: its key, for its release). It's kept if a recording is
// under way, or about to start within EARLY. Striking a pitch that's still ringing from Space ends the
// ringing note there, as it does in the sound. Returns whether the note was kept.
export function note(loop, t, id, { pitch, strength, legato }) {
  const take = loop.take;
  if (!take) return false;
  for (const s of take.sounding.filter((x) => x.ringing && x.note.pitch === pitch)) end(take, s, t);
  if (t < take.from - EARLY || t >= take.from + LOOP_LENGTH) return false;
  const n = { at: t - take.from, pitch, strength, legato, len: null };
  take.notes.push(n);
  take.sounding.push({ id, note: n, ringing: false });
  return true;
}

// Key `id` comes up at band time t: its note ends there, or rings on while Space is held.
export function release(loop, t, id) {
  const s = loop.take?.sounding.find((x) => x.id === id && !x.ringing);
  if (!s) return;
  if (loop.ring) s.ringing = true;
  else end(loop.take, s, t);
}

// Space goes down (on) or comes up at band time t. Letting it go ends every note still ringing.
export function ring(loop, t, on) {
  loop.ring = on;
  if (on || !loop.take) return;
  for (const s of loop.take.sounding.filter((x) => x.ringing)) end(loop.take, s, t);
}

// A recorded note stops sounding at band time t, or where its recording ends if that's sooner.
function end(take, s, t) {
  s.note.len = Math.max(0, Math.min(t, take.from + LOOP_LENGTH) - take.from - s.note.at);
  take.sounding.splice(take.sounding.indexOf(s), 1);
}

// Time runs on to band time t. Once a recording's 4 bars are up it joins the loop as a layer, any note
// still sounding cut off at its end, and step returns 'layer'; otherwise null.
export function step(loop, t) {
  const take = loop.take;
  if (!take || t < take.from + LOOP_LENGTH) return null;
  for (const s of [...take.sounding]) end(take, s, t);
  loop.layers.push({ from: take.from, notes: take.notes });
  loop.take = null;
  return 'layer';
}

// Backspace: cancels a recording that's waiting or under way ('cancelled'); otherwise takes off the
// last layer ('removed', or 'cleared' if it was the only one). null when there's nothing to undo.
export function undo(loop) {
  if (loop.take) {
    loop.take = null;
    return 'cancelled';
  }
  if (!loop.layers.length) return null;
  loop.layers.pop();
  return loop.layers.length ? 'removed' : 'cleared';
}

// The looped notes that start at band times in [from, to), in time order: { t, pitch, strength,
// legato, len, layer } (layer: its index in loop.layers; a recording's is loop.layers.length). Each
// layer plays from the end of its recording, time after time. A recording's notes are due from then
// too, so a note played early for its first bar line sounds just as early the first time round.
export function due(loop, from, to) {
  const out = [];
  const layers = loop.take ? [...loop.layers, loop.take] : loop.layers;
  layers.forEach((layer, i) => {
    for (const n of layer.notes) {
      const first = layer.from + LOOP_LENGTH + n.at; // its first time round
      // Each time is worked out from the first, never added up, so nothing drifts.
      for (let k = Math.max(0, Math.floor((from - first) / LOOP_LENGTH)); first + k * LOOP_LENGTH < to; k++) {
        const t = first + k * LOOP_LENGTH;
        if (t >= from) out.push({ t, pitch: n.pitch, strength: n.strength, legato: n.legato, len: n.len ?? LOOP_LENGTH - n.at, layer: i });
      }
    }
  });
  return out.sort((a, b) => a.t - b.t);
}

// What the loop is doing at band time t: 'waiting' for its recording's bar line, 'recording',
// 'playing', or 'empty'.
export function loopState(loop, t) {
  if (loop.take) return t < loop.take.from ? 'waiting' : 'recording';
  return loop.layers.length ? 'playing' : 'empty';
}
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 181 tests.

- [ ] **Step 5: Commit**

```bash
git add open-case/src/tuning.js open-case/src/looper.js open-case/test/looper.test.js open-case/test/set.test.js
git commit -m "Open Case: the loop pedal's loop, as notes: recording from the next bar line for 4 bars, up to 3 layers, undo, and what's due when

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: The loop pedal in the stock, and its art

The stock and the art go together. The art tests expect an `item-<id>` frame for every item in the stock, and the shop's drawing needs each item's box and tag.

**Files:**
- Modify: `open-case/src/tuning.js` (`SHOP.loop`), `open-case/src/gear.js`
- Modify: `art/open-case/gear.lua`, `art/open-case/draw.lua`, `art/open-case/shop.lua`, `art/open-case/sprites.lua`, `art/open-case/palette.lua`, `art/open-case/style-sample.lua`
- Regenerate: `open-case/assets/sprites.png`, `open-case/assets/sprites.json`
- Modify: `open-case/src/render.js` (the speaker in the looper's place, nothing else yet)
- Modify: `open-case/test/gear.test.js`, `open-case/test/art.test.js`

**Interfaces:**
- Consumes: `SHOP` and the stock's shape from the shop's build.
- Produces:
  - `tuning.js`: `SHOP.loop = { price: 100 }` (no `key`, so `PEDAL_KEYS` doesn't change).
  - `gear.js`:
    - `STOCK` gains `{ id: 'loop', kind: 'loop', name: 'Loop pedal', about: 'R records 4 bars, then loops them under you.', price: 100, key: null }`, after the reverb and before the acoustic guitar: 11 items.
    - `PEDALS` and `INSTRUMENTS` don't change.
    - `buy(gear, 'loop')` and `owns(gear, 'loop')` work as for any item. `stomp(gear, 'loop')` is `null`, and `play(gear, 'loop')` is `false`.
  - The sheet's frames:
    - `speaker`;
    - `pedal-loop-dark`, `pedal-loop-red` and `pedal-loop-green` (whole-screen frames, anchored top-left, drawn at (0, 0));
    - `strip-loop-dark`, `strip-loop-red` and `strip-loop-green` (7×8, anchored at their top-left);
    - `item-loop-0` and `item-loop-1`.
    - `looper-0` and `looper-1` are gone.
  - `sprites.json`:
    - `feet.speaker` (157), which replaces `feet.looper`;
    - `feet.loop` (158);
    - `shop.items.loop`;
    - `shop.leds.loop`: the top-left of the loop pedal's 2×2 light on the rack.
  - Art: `G.LOOP_PEDAL` = `{ 128, 153 }`, `G.LOOP_LIGHTS`, `G.loopPedal(b, light)`, `G.loopIcon(b, light)`, `D.SPEAKER`, `D.speaker(b)`, `S.LOOP_LED`.

- [ ] **Step 1: Write the failing tests**

Replace `open-case/test/gear.test.js` with:

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

test('the stock: five pedals on keys 2 to 6 in chain order, the loop pedal, then the instruments, priced from tuning.js', () => {
  assert.deepEqual(STOCK.map((s) => s.id), ['overdrive', 'chorus', 'tremolo', 'delay', 'reverb', 'loop', ACOUSTIC, 'ukulele', 'electric', 'epiano', 'synth']);
  assert.deepEqual(PEDALS, ['overdrive', 'chorus', 'tremolo', 'delay', 'reverb']);
  assert.deepEqual(PEDALS.map((id) => STOCK.find((s) => s.id === id).key), [2, 3, 4, 5, 6]);
  assert.deepEqual(INSTRUMENTS, [ACOUSTIC, 'ukulele', 'electric', 'epiano', 'synth']);
  for (const item of STOCK) if (item.id !== ACOUSTIC) assert.equal(item.price, SHOP[item.id].price, item.id);
  assert.equal(STOCK.reduce((sum, item) => sum + item.price, 0), 1050, 'the whole stock costs 1050 coins');
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

test("the loop pedal is bought and kept like a pedal, but it has no number key and never joins the chain", () => {
  const s = memoryStorage();
  const gear = withSavings(99);
  assert.equal(buy(gear, 'loop'), false, '100 coins, with 99 saved');
  earn(gear, 1);
  assert.equal(buy(gear, 'loop'), true);
  assert.deepEqual([gear.savings, gear.owned, gear.on], [0, ['loop'], []]);
  assert.equal(stomp(gear, 'loop'), null, 'R works it, not a pedal key');
  assert.equal(play(gear, 'loop'), false);
  assert.ok(!PEDALS.includes('loop') && !INSTRUMENTS.includes('loop'));
  saveGear(s, gear);
  s.set('open-case-gear', JSON.stringify({ ...JSON.parse(s.get('open-case-gear')), on: ['loop'] }));
  assert.deepEqual(loadGear(s), { savings: 0, owned: ['loop'], instrument: ACOUSTIC, on: [] }, "it's yours after a reload, and never 'on'");
});
```

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
  [/^coin-\d$/, 2], ['speaker', 1], [/^bird-\d$/, 2],
  ...INSTRUMENTS.flatMap((id) => [[new RegExp(`^you-${id}-idle-\\d$`), 2], [new RegExp(`^you-${id}-play-\\d$`), 3]]),
  ...PEDALS.flatMap((id) => [[new RegExp(`^pedal-${id}-\\d$`), 2], [new RegExp(`^strip-${id}-\\d$`), 2]]),
  [/^pedal-loop-(dark|red|green)$/, 3], [/^strip-loop-(dark|red|green)$/, 3],
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
          for (const k of KINDS) assert.ok(!opaqueAt(`${k}-stand-0-${sx < CROWD.playerX ? 'right' : 'left'}`, sx, sy, x, y), `${name} clear of a ${k} at ${sx},${sy}`);
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

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL, 5 tests:
- the stock's two tests (no loop pedal yet, and the total is 950);
- "every frame the game draws is there…" (no `speaker`, no loop pedal frames);
- "your pedals and the loop pedal stand in front of the crate…" (no `pedal-loop-green`);
- "the shop's stock stands apart…" (no `shop.items.loop`).

- [ ] **Step 3: The loop pedal in the stock**

In `open-case/src/tuning.js`, the comment above `SHOP` gains a line, and `SHOP` gains the loop pedal after the reverb:

```js
// The music shop (gear.js): what each thing costs in coins, and the key that stomps each pedal. The
// pedals are listed in the order they chain, overdrive first, which is also the order of their keys.
// The loop pedal is worked with R and Backspace instead.
export const SHOP = {
  overdrive: { price: 40, key: 2 },
  chorus: { price: 50, key: 3 },
  tremolo: { price: 50, key: 4 },
  delay: { price: 70, key: 5 },
  reverb: { price: 80, key: 6 },
  loop: { price: 100 },
  ukulele: { price: 60 },
  electric: { price: 150 },
  epiano: { price: 200 },
  synth: { price: 250 },
};
```

In `open-case/src/gear.js`, the comment above `STOCK` becomes:

```js
// Everything in the shop, in the order you move through it: the pedals on the rack (the loop pedal
// last, since R and Backspace work it rather than a number key), then the instruments on their
// stands. Each price and pedal key is from tuning.js.
```

Add this line to `STOCK` after the reverb's:

```js
  { id: 'loop', kind: 'loop', name: 'Loop pedal', about: 'R records 4 bars, then loops them under you.' },
```

And the comment above `PEDALS` becomes:

```js
// The pedals in the order they chain, which is the order of their keys (not the loop pedal).
```

- [ ] **Step 4: Draw the loop pedal and the speaker**

Replace `art/open-case/gear.lua` with:

```lua
-- Your gear from the music shop, in the flat style, for the sprite sheet (sprites.lua) and the shop
-- (shop.lua): you playing each instrument, your pedals and the loop pedal on the ground by the crate,
-- the small amp that comes with the electric guitar, the gear strip's icons along the bottom of the
-- screen, and each instrument and pedal as it stands in the shop.
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
G.LOOP_PEDAL = { 128, 153 } -- the loop pedal's top-left: between the crate and the row of pedals
-- The loop pedal's light, as a pixel-map letter: dark with nothing to play, red while it records (and
-- blinking while it waits for the bar line), green while the loop plays.
G.LOOP_LIGHTS = { dark = "k", red = "r", green = "o" }
G.AMP = { 109, 136 } -- the amp's top-left, left of the crate behind the speaker

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

-- The loop pedal on the ground: wider than the others, grey, with a big footswitch, and its light
-- ('dark', 'red' or 'green').
function G.loopPedal(b, light)
  local x, y = G.LOOP_PEDAL[1], G.LOOP_PEDAL[2]
  D.shadow(b, x + 5.5, y + 5.5, 6.5, 1)
  stamp(b, x, y, recolour({
    "ccccccccccc",
    "cLLcchhhhhc",
    "cLLcchhhhhc",
    "ccccccccccc",
    "CCCCCCCCCCC",
  }, { L = G.LOOP_LIGHTS[light] }))
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

-- The loop pedal's icon on the gear strip, from its top-left, its light as on the pedal: grey with a
-- dark light while the loop is empty, lit up with a red or green light otherwise.
function G.loopIcon(b, light)
  local lit = light ~= "dark"
  stamp(b, 0, 0, recolour({
    ".bbbbb.",
    "bLLbbbb",
    "bLLbbbb",
    "bbbbbbb",
    "bhhhhhb",
    "bhhhhhb",
    "bbbbbbb",
    "SSSSSSS",
  }, { b = lit and "c" or "C", S = lit and "C" or "N", L = G.LOOP_LIGHTS[light] }))
end

return G
```

In `art/open-case/draw.lua`, the looper's position becomes the speaker's:

```lua
D.SPEAKER = { 112, 151 } -- the band's speaker's top-left, by your crate
```

(it replaces the line `D.LOOPER = { 112, 151 } -- the looper's top-left`), and `D.looper` (with its comment) is replaced by:

```lua
-- The band's small speaker: a blue box with its handle on top and a dark cone.
function D.speaker(b)
  local x, y = D.SPEAKER[1], D.SPEAKER[2]
  shadow(b, x + 5, y + 5.5, 7, 1.5)
  stamp(b, x + 3, y - 2, { "kkkkk", "k...k" })
  stamp(b, x, y, {
    "uuuuuuuuuuu",
    "UUUkkkkkUUU",
    "UUkkhhhkkUU",
    "UUkkhhhkkUU",
    "UUUkkkkkUUU",
    "UUUUUUUUUUU",
  })
end
```

In `art/open-case/shop.lua`, make these edits.

The rack widens, and the chalkboard moves right:

```lua
S.RACK = { 112, 20, 240, 66 } -- the pedal rack; its shelf's top is row 62
S.BOARD = { 248, 10, 314, 44 } -- the chalkboard (the savings: render.js)
```

The comment and `RACK_X` become:

```lua
-- Where each item stands: a pedal's top-left on the rack's shelf (the pedals, then the wider loop
-- pedal), or a guitar's or keyboard's place on the floor ({ x of the middle for a guitar, x of the
-- left for a keyboard }).
local RACK_X = { overdrive = 117, chorus = 137, tremolo = 157, delay = 177, reverb = 197, loop = 217 }
```

After the line `S.LED = { 11, 1 } -- the light's place on a rack pedal, from its top-left (2 by 1)`, add:

```lua
-- The loop pedal on the rack, 18 by 17: grey, its light (2 by 2, lit by render.js while you try it)
-- beside a little window, a line across, and a big footswitch.
local LOOP_PEDAL = {
  ".cccccccccccccccc.",
  "cccccccccccccccccC",
  "ccLLcchhhhhhhhcccC",
  "ccLLcchhhhhhhhcccC",
  "cccccccccccccccccC",
  "CCCCCCCCCCCCCCCCCC",
  "cccccccccccccccccC",
  "cccccccccccccccccC",
  "cccccccccccccccccC",
  "ccccckkkkkkkkccccC",
  "cccckkkkkkkkkkcccC",
  "cccckkkkkkkkkkcccC",
  "ccccckkkkkkkkccccC",
  "cccccccccccccccccC",
  "cccccccccccccccccC",
  "cccccccccccccccccC",
  ".CCCCCCCCCCCCCCCC.",
}
S.LOOP_LED = { 2, 2 } -- the loop pedal's light, from its top-left (2 by 2)
```

At the top of `rackPedal`, before `local c = G.PEDAL_COLORS[id]`, add:

```lua
  if id == "loop" then
    local out = {}
    for i, r in ipairs(LOOP_PEDAL) do out[i] = r:gsub("L", "k") end -- its light, dark
    stamp(b, RACK_X[id], RACK_TOP - lift, out)
    return
  end
```

And `S.led` becomes:

```lua
-- A rack pedal's light, on the screen, as it stands.
function S.led(id)
  local at = id == "loop" and S.LOOP_LED or S.LED
  return { RACK_X[id] + at[1], RACK_TOP + at[2] }
end
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
--   feet       { you, speaker, case, amp, pedals, loop }: the row where each meets the ground, to sort
--              them among the people (loop: the loop pedal)
--   shop       the music shop's layout: items { id: [x, y, w, h] } (each item's box as it stands, for
--              clicks and its tag), leds { id: [x, y] } (each rack pedal's 2x1 light, and the loop
--              pedal's 2x2 one), door [x, y, w, h]
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
-- left hand, both, then the right), your pedals and the loop pedal (its light dark, red or green) on
-- the ground, the amp, the gear strip's icons, and the band's speaker
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
for _, light in ipairs({ "dark", "red", "green" }) do
  screen("pedal-loop-" .. light, function(b) G.loopPedal(b, light) end)
  add("strip-loop-" .. light, 7, 8, 0, 0, function(b) G.loopIcon(b, light) end)
end
screen("amp", G.amp)
screen("speaker", D.speaker)
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
local STOCK = { "overdrive", "chorus", "tremolo", "delay", "reverb", "loop", "acoustic", "ukulele", "electric", "epiano", "synth" }
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
  ('  "feet": { "you": %d, "speaker": %d, "case": %d, "amp": %d, "pedals": %d, "loop": %d },'):format(
    141 + D.YOU[2], D.SPEAKER[2] + 6, D.CASE[2] + 9, G.AMP[2] + 13, G.PEDAL_ROW[2] + 5, G.LOOP_PEDAL[2] + 5),
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
    out[#out + 1] = ('"loop": %s'):format(pair(S.led("loop")))
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

In `art/open-case/palette.lua`, three comments change (the colours don't):

```lua
  blue = { "#2c3466", "#4660a6" }, -- the speaker's body and its top, the student's hoodie
  red = { "#74283a", "#b03c4a" }, -- the case's lining, the scarf, the jogger's top, the loop pedal recording
  go = "#6ed89a", -- the loop pedal playing, a listener's nod of recognition
```

In `art/open-case/style-sample.lua`, the header's fourth and fifth lines become three:

```lua
-- band's speaker, and the regular (the old man in the red scarf) listening at the right-hand spot.
-- And a short GIF of him walking in, nodding, and grinning as his coin arcs into the case. Run from
-- the repo root:
```

(They replace `-- looper, and the regular (the old man in the red scarf) listening at the right-hand spot. And a short` and `-- GIF of him walking in, nodding, and grinning as his coin arcs into the case. Run from the repo root:`.)

`scene` loses its `beat` parameter, and draws the speaker:

```lua
local function scene(manX, step, head, grin, tip, coins, shine)
  local b = L.buffer(W, H)
  L.blit(b, base, 0, 0)
  D.you(b, 0, 0)
  D.speaker(b)
```

and the walking-in loop no longer passes it:

```lua
for f = 0, 11 do add(scene(292 - f * 5.5, f % 4, 0, false, false, 4, false), 120) end
```

- [ ] **Step 5: Draw the speaker in the game**

In `open-case/src/render.js`:
- The header's third and fourth lines become:

  ```js
  // sunset, you on your crate with your instrument, your pedals, the open case and the band's speaker,
  // the passers-by, their reactions, the pigeons and birds, the note trail, the memory strip, the gear
  ```

- In `figures`'s comment, `amp, the looper, the case and its coins` becomes `amp, the speaker, the case and its coins`.
- Delete the line `const beatPhase = set && t >= 0 ? (t % BAR) / BAR : 1;`.
- The looper's entry in `things` becomes:

  ```js
      { y: data.feet.speaker, draw: () => sprite('speaker', 0, 0) },
  ```

- [ ] **Step 6: Build the sheet**

Run from the repo root:

```sh
/Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/sprites.lua
/Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/style-sample.lua
```

Expected:
- `sprites: 230 frames on a 512x1407 sheet, 39 colours`;
- the style sample writes its previews without an error;
- running `sprites.lua` a second time leaves `git status` as it was.

To see the art, save this scratch script as `art/open-case/preview-loop.lua` and run it from the repo root. Its PNGs are git-ignored, but the script isn't, so delete it once you've looked.

```lua
-- Scratch preview (not committed): the ground by the crate with the loop pedal (its light dark, red,
-- then green), the speaker, your pedals and the case; and the shop's rack with the loop pedal chosen.
-- Writes art/open-case/preview-loop-<light>.png and preview-loop-rack.png, at 5x.
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local D = dofile(here .. "draw.lua")
local G = dofile(here .. "gear.lua")
local S = dofile(here .. "shop.lua")
local L = D.L
local W, H = D.W, D.H
local DUSK = D.stages()[1]
for _, light in ipairs({ "dark", "red", "green" }) do
  local b = L.buffer(W, H)
  D.sky(b, DUSK)
  D.ground(b)
  D.path(b, false)
  G.amp(b)
  G.you(b, "electric", 0, 0)
  D.speaker(b)
  G.loopPedal(b, light)
  for i, id in ipairs(G.PEDALS) do G.pedal(b, id, i % 2 == 1) end
  D.openCase(b)
  L.save(L.scale(L.crop(b, 90, 100, 110, 72), 5), nil, "art/open-case/preview-loop-" .. light .. ".png")
end
local shop = L.buffer(W, H)
S.room(shop)
for _, id in ipairs({ "overdrive", "chorus", "tremolo", "delay", "reverb", "loop" }) do S.item(shop, id, id == "loop") end
L.save(L.scale(L.crop(shop, 100, 10, 150, 70), 5), nil, "art/open-case/preview-loop-rack.png")
print("previews written")
```

- [ ] **Step 7: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 182 tests.

- [ ] **Step 8: Commit**

```bash
git add open-case/src/tuning.js open-case/src/gear.js open-case/test/gear.test.js art/open-case/gear.lua art/open-case/draw.lua art/open-case/shop.lua art/open-case/sprites.lua art/open-case/palette.lua art/open-case/style-sample.lua open-case/assets/sprites.png open-case/assets/sprites.json open-case/test/art.test.js open-case/src/render.js
git commit -m "Open Case: the loop pedal in the stock, drawn by the crate, on the strip and on a wider rack; the looper box becomes the band's speaker

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Trying the loop pedal in the shop, and its keys

**Files:**
- Modify: `open-case/src/shop.js`, `open-case/src/keys.js`, `open-case/src/input.js`
- Modify: `open-case/test/shop.test.js`, `open-case/test/keys.test.js`, `open-case/test/input.test.js`

**Interfaces:**
- Consumes:
  - Task 1: `createLoop` from `looper.js`.
  - Task 2: the loop pedal in `STOCK` (kind `'loop'`).
- Produces:
  - `shop.js`:
    - `createShop() -> { at, soldAt, loop: null }`.
    - `choose(shop, at)` sets `shop.at`. It gives `shop.loop` a fresh `createLoop()` when the loop pedal is chosen, keeps it when the pedal is chosen again, and sets it to `null` for anything else.
    - `move(shop, dir)` goes through `choose`.
    - `card()` says `'On your board: R'` for the loop pedal once it's yours.
    - `trying()` doesn't change: the loop pedal adds nothing to `on`.
  - `keys.js`: `CONTROL_KEYS.KeyR = 'loop'` and `CONTROL_KEYS.Backspace = 'undo'`.
  - `input.js`: `onControl('loop', true)` and `onControl('undo', true)`, once per press, after the gate. They change nothing in the key state.

- [ ] **Step 1: Write the failing tests**

Replace `open-case/test/shop.test.js` with:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createShop, chosen, choose, move, action, card, trying, hit, CARD, BUTTON } from '../src/shop.js';
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

test("the loop pedal's card: a line on what R does, Enter to buy, and once it's yours, R", () => {
  const gear = withSavings(80);
  assert.deepEqual(card(shopOn('loop'), gear), {
    name: 'Loop pedal', price: '100 coins', about: 'R records 4 bars, then loops them under you.',
    says: 'Not enough coins yet (you have 80)', button: null,
  });
  gear.savings = 100;
  assert.deepEqual(action(shopOn('loop'), gear), { act: 'buy', id: 'loop' });
  buy(gear, 'loop');
  assert.deepEqual(card(shopOn('loop'), gear), {
    name: 'Loop pedal', price: 'yours', about: 'R records 4 bars, then loops them under you.', says: 'On your board: R', button: null,
  });
  assert.equal(action(shopOn('loop'), gear), null);
});

test('choosing the loop pedal starts a loop to try it with, yours or not; moving on throws the loop away', () => {
  const gear = withSavings(0);
  const shop = createShop();
  assert.equal(shop.loop, null);
  for (let i = 0; i < at('loop'); i++) move(shop, 1);
  assert.equal(chosen(shop).id, 'loop', 'after the reverb on the rack');
  assert.ok(shop.loop && shop.loop.layers.length === 0, 'an empty loop');
  shop.loop.layers.push({ from: 0, notes: [] });
  choose(shop, at('loop'));
  assert.equal(shop.loop.layers.length, 1, 'choosing it again keeps the loop');
  assert.deepEqual(trying(shop, gear), { instrument: ACOUSTIC, on: [] }, 'you hear your own instrument and pedals over it');
  move(shop, 1);
  assert.equal(shop.loop, null);
  move(shop, -1);
  assert.equal(shop.loop.layers.length, 0, 'back again, the loop starts empty');
  choose(shop, at('synth'));
  assert.equal(shop.loop, null, 'a click on something else throws it away too');
});
```

Append to `open-case/test/keys.test.js`:

```js

test('R records a loop and Backspace undoes; neither is a note key', () => {
  assert.equal(CONTROL_KEYS.KeyR, 'loop');
  assert.equal(CONTROL_KEYS.Backspace, 'undo');
  assert.ok(!('KeyR' in NOTE_KEYS) && !('Backspace' in NOTE_KEYS) && !('KeyR' in PEDAL_KEYS));
  const ks = createKeyState();
  assert.equal(applyControl(ks, 'loop'), false, 'they change nothing in the key state');
  assert.equal(applyControl(ks, 'undo'), false);
});
```

Append to `open-case/test/input.test.js`:

```js

test('R and Backspace go to the caller once per press, the browser does nothing with them, and the gate can swallow them', () => {
  let open = true;
  const h = harness({ gate: () => open });
  assert.equal(h.down('KeyR'), true);
  h.down('KeyR', { repeat: true });
  assert.equal(h.down('Backspace'), true, "Backspace doesn't go back a page");
  h.up('KeyR');
  open = false;
  h.down('KeyR');
  assert.deepEqual(h.got, [['loop', true], ['undo', true]]);
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL. `shop.js` has no `choose` export, `CONTROL_KEYS` has no `KeyR`, and R calls nothing.

- [ ] **Step 3: Write shop.js, and the keys**

Replace `open-case/src/shop.js` with:

```js
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
```

In `open-case/src/keys.js`:
- The header's third line becomes:

  ```js
  // pedals, R and Backspace work the loop pedal, and in the shop the arrow keys and Enter choose and buy.
  ```

- `CONTROL_KEYS`'s second line becomes:

  ```js
    Space: 'ring', Digit1: 'lock', KeyM: 'mute', Escape: 'pause', KeyR: 'loop', Backspace: 'undo',
  ```

- The comment above `applyControl` becomes:

  ```js
  // Applies a control key's action to the key state. Returns true if the state changed. (Ring, mute,
  // pause, loop and undo belong to the caller; they don't change the key state.)
  ```

In `open-case/src/input.js`:
- The header's `onControl` lines become:

  ```js
  //   onControl(action, down)  'ring' (down and up), and on key down: 'octaveDown', 'octaveUp',
  //                            'softer', 'louder', 'lock' (only when they change something), 'mute',
  //                            'pause', 'loop' (R) and 'undo' (Backspace)
  ```

- After the imports, add:

  ```js

  // The controls that go straight to the caller, changing nothing in the key state.
  const CALLER_CONTROLS = new Set(['ring', 'mute', 'pause', 'loop', 'undo']);
  ```

- In `down`, the control line becomes:

  ```js
        if (CALLER_CONTROLS.has(action) || applyControl(keys, action)) onControl(action, true);
  ```

- [ ] **Step 4: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 186 tests.

- [ ] **Step 5: Commit**

```bash
git add open-case/src/shop.js open-case/src/keys.js open-case/src/input.js open-case/test/shop.test.js open-case/test/keys.test.js open-case/test/input.test.js
git commit -m "Open Case: trying the loop pedal in the shop gets a loop of its own, its card says R, and R and Backspace reach the game

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: The loop's sound

**Files:**
- Modify: `open-case/src/audio.js`, `open-case/src/soundcheck.js`, `open-case/index.html` (the sound check's line)
- Modify: `open-case/test/fake-audio.js`, `open-case/test/audio.test.js`

**Interfaces:**
- Consumes:
  - Task 1: `looper.js` (`due` has the shape `update` asks for; the sound check uses the whole API).
  - Task 3: the `'loop'` and `'undo'` controls.
- Produces:
  - `audio.js` exports `safetyCurve(n = 4097)`: a `Float32Array` for input scaled down by 4.
  - `createAudio` gains:
    - `update(loopDue = null) -> notes`. `loopDue(from, to)` returns looper-style notes (`{ t, pitch, strength, legato, len, layer }`, in band time). `update` returns the notes it scheduled, each with `at`, its audio time.
    - `startBand(at, level = BAND_LEVEL)`.
    - `tryBand(at)`.
    - `stopBand()`, which now fades the band out quickly and stops every looped voice.
    - `stopLoop(layer = null)`.
  - `fake-audio.js`: `disconnect()` sets `node.cut = true`.

- [ ] **Step 1: Write the failing tests**

In `open-case/test/fake-audio.js`, a node's `disconnect` becomes:

```js
      disconnect() {
        n.cut = true; // cut off from everything it fed
      },
```

In `open-case/test/audio.test.js`, the first import from `audio.js` becomes:

```js
import { createAudio, pluckSamples, softClip, safetyCurve, VOICING } from '../src/audio.js';
```

After the import from `gear.js`, add:

```js
import { createLoop, record, note, release, step, due, LOOP_LENGTH } from '../src/looper.js';
```

and append to the end of the file:

```js

// A loop with a layer recorded from bar line `bar` (band time): each note is [seconds after the bar
// line, pitch, seconds held].
function loopWith(bar, notes, loop = createLoop()) {
  record(loop, bar * BAR - 0.5);
  notes.forEach(([at, pitch, len], i) => {
    note(loop, bar * BAR + at, `k${i}`, { pitch, strength: 3, legato: false });
    release(loop, bar * BAR + at + len, `k${i}`);
  });
  step(loop, bar * BAR + LOOP_LENGTH);
  return loop;
}
// The sounds started since the `before`-th that are your instrument's (they go on into the pedals),
// not the band's.
const yours = (ctx, before = 0) => ctx().started.slice(before).filter((s) => nextPedal(s.node));
// Runs the audio clock on in frames from its time now to `until`, handing update the loop's notes;
// returns the looped notes scheduled, each with the time it was scheduled at.
function runLoop(ctx, audio, loop, until) {
  const out = [];
  while (ctx().currentTime < until) {
    ctx().currentTime += 1 / 60;
    for (const n of audio.update((from, to) => due(loop, from, to))) out.push({ ...n, when: ctx().currentTime });
  }
  return out;
}

test("your loop's notes are scheduled a moment ahead with the band, each once a time round, never in the past", () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.startBand(0.5);
    const loop = loopWith(1, [...Array(16).keys()].map((i) => [i * BEAT, 60 + (i % 5), 0.2]));
    const heard = runLoop(ctx, audio, loop, 0.5 + BAR + 3 * LOOP_LENGTH - 0.5);
    for (const n of heard) assert.ok(n.at >= n.when - 1e-9 && n.at <= n.when + GROOVE.ahead + 1e-9, `${n.at} scheduled at ${n.when}`);
    assert.equal(heard.length, 32, 'the 16 notes, twice round');
    heard.forEach((n, i) => {
      const want = 0.5 + BAR + LOOP_LENGTH * (1 + Math.floor(i / 16)) + (i % 16) * BEAT;
      assert.ok(Math.abs(n.at - want) < 1e-9, `note ${i} at ${n.at}, wanted ${want}`);
    });
    assert.deepEqual(yours(ctx).map((s) => s.t), heard.map((n) => n.at), 'each one sounds, as a plucked note');
  }));

test('a looped note is a voice of its own through your instrument and pedals: a live note on its pitch, or Space, never cuts it off', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.setInstrument('synth');
    audio.startBand(0);
    const loop = loopWith(1, [[0, 60, 2]]);
    ctx().currentTime = BAR + LOOP_LENGTH - 0.1;
    const before = ctx().started.length;
    const [n] = audio.update((from, to) => due(loop, from, to));
    const sources = yours(ctx, before).map((s) => s.node);
    assert.ok(sources.length > 0);
    assert.equal(nextPedal(sources[0]).pedal, PEDALS[0], 'into the pedals');
    assert.ok(downstream(sources[0]).includes(ctx().destination));
    ctx().currentTime = n.at + 0.5;
    audio.setRing(true);
    audio.noteOn('KeyA', 60, 3, ctx().currentTime, false);
    audio.noteOff('KeyA', ctx().currentTime + 0.1);
    audio.setRing(false);
    const stops = ctx().stopped.filter((s) => sources.includes(s.node));
    assert.ok(stops.length > 0 && stops.every((s) => s.t >= n.at + 2 - 1e-9), 'it lets go after its own 2 seconds');
    assert.ok(stops.every((s) => s.t <= n.at + 2 + VOICING.synth.release * 2 + 1e-9));
  }));

test("taking off a layer stops its notes at once: those sounding let go, and those not yet started never sound", () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.setInstrument('synth');
    audio.startBand(0);
    const loop = loopWith(1, [[0, 60, 4]]);
    loopWith(1, [[0.1, 64, 4], [0.15, 67, 4]], loop); // a second layer, from the same bar line
    ctx().currentTime = BAR + LOOP_LENGTH - 0.01;
    const before = ctx().started.length;
    audio.update((from, to) => due(loop, from, to)); // schedules all three
    const layerOf = (pitch) => yours(ctx, before).filter((s) => Math.abs(s.node.frequency.value - 440 * 2 ** ((pitch - 69) / 12)) < 0.01).map((s) => s.node);
    ctx().currentTime = BAR + LOOP_LENGTH + 0.12; // the first two have started, the third hasn't
    audio.stopLoop(1);
    const gainOf = (osc) => downstream(osc).find((g) => g.gain?.events?.length && g.kind === 'gain');
    const cut = (pitch) => layerOf(pitch).map((o) => ctx().stopped.filter((s) => s.node === o).at(-1).t);
    assert.ok(cut(64).every((t) => t <= ctx().currentTime + VOICING.synth.release * 2 + 1e-9), 'the sounding note of layer 2 lets go now');
    assert.ok(gainOf(layerOf(67)[0]).cut, "layer 2's note still to come is cut off before it sounds");
    assert.ok(cut(60).every((t) => t >= BAR + LOOP_LENGTH + 4 - 1e-9), 'layer 1 plays on');
  }));

test('your loop fades out with the band at the end of the set, is scheduled no further, and stops with the band', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.setInstrument('synth');
    audio.startBand(0);
    const loop = loopWith(1, [...Array(8).keys()].map((i) => [i * 1.5, 60, 0.5]));
    const end = BAR + LOOP_LENGTH + 5;
    audio.endBand(end);
    const heard = runLoop(ctx, audio, loop, end + BAR + 5);
    assert.ok(heard.length > 0 && heard.every((n) => n.at < end + BAR), 'nothing after the fade');
    const fades = downstream(yours(ctx)[0].node).flatMap((g) => g.gain?.events?.filter(([how, v]) => how === 'linear' && v === 0) ?? []);
    assert.deepEqual(fades, [['linear', 0, end + BAR]], 'it fades over the last bar');
    ctx().currentTime = end + 0.5;
    const sounding = yours(ctx).filter((s) => s.t > end - 1 && s.t < end + 0.5).map((s) => s.node);
    assert.ok(sounding.length > 0);
    audio.stopBand();
    for (const node of sounding) assert.ok(ctx().stopped.filter((s) => s.node === node).at(-1).t <= end + 0.5 + VOICING.synth.release * 2 + 1e-9);
    assert.deepEqual(audio.update((from, to) => due(loop, from, to)), [], 'and nothing more is scheduled');
  }));

test("in the shop, the band plays its electric piano alone, softer, so you can try the loop pedal over it", () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.tryBand(1);
    const last = (g) => g.gain.events.at(-1)[1];
    for (const { id } of LAYERS) assert.equal(last(ctx().busGain(id)), id === 'keys' ? 1 : 0, id);
    assert.equal(last(ctx().busGain('perc')), 0, 'no stand-in percussion either');
    const band = ctx().busGain('keys').outs[0];
    const tryLevel = band.gain.events.filter(([how, , t]) => how === 'set' && t === 1).at(-1)[1];
    audio.startBand(5);
    const setLevel = band.gain.events.filter(([how, , t]) => how === 'set' && t === 5).at(-1)[1];
    assert.ok(tryLevel > 0 && tryLevel < setLevel * 0.7, `${tryLevel} next to ${setLevel} in a set`);
  }));

test("a safety before the speakers leaves the game's sound as it was, and rounds off what a loop stacks on top", () =>
  withAudio((ctx) => {
    const curve = safetyCurve(), n = curve.length;
    const at = (x) => curve[Math.round(((x / 4 + 1) / 2) * (n - 1))]; // the curve at input level x (it takes up to 4x full scale)
    for (const x of [0, 0.1, -0.3, 0.5, 0.69]) assert.ok(Math.abs(at(x) - x) < 1e-3, `${x} passes untouched`);
    assert.ok(at(1) > 0.8 && at(1) < 0.95, `full scale rounds off a little: ${at(1)}`);
    assert.ok(at(4) <= 0.95 && at(-4) >= -0.95 && at(4) > 0.94, 'four times over still never clips, with room to spare');
    for (let i = 1; i < n; i++) assert.ok(curve[i] >= curve[i - 1], 'never folds back');
    const audio = createAudio(memoryStorage());
    audio.start();
    const safety = downstream(playOn(ctx, audio, 'acoustic')[0].node).find((x) => x.kind === 'shaper' && x.outs.includes(ctx().destination));
    assert.ok(safety, 'the last thing before the speakers');
    assert.equal(safety.from[0].gain.value, 1 / 4, 'fed at a quarter, for the headroom');
  }));
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL. `audio.js` has no `safetyCurve` export.

- [ ] **Step 3: Write the sound**

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
//   - Your loop (looper.js): its notes are scheduled a moment ahead with the band's, each a voice of
//     its own through your instrument and pedals, and they fade and stop with the band.
//   - Vinyl crackle, a dusty filter over the band, the tape wobble, coins landing and applause.
//   - A safety before the speakers, so a loop stacked on your playing can't clip.
// Browsers only allow sound after a key press or click, so start() is called from inside one
// (main.js). M mutes; the volume and mute are remembered.
import { bandAt, timeOf16th, midiToHz, BAR, BEAT } from './groove.js';
import { LAYERS, PLAY, GROOVE } from './tuning.js';
import { PEDALS } from './gear.js';

const MUTE_KEY = 'open-case-muted', VOLUME_KEY = 'open-case-volume';
const PICK = [0.35, 0.55, 0.8, 1]; // loudness by pick strength 1-4
const BRIGHT = [0.2, 0.35, 0.55, 0.8]; // the acoustic's pick's brightness by strength
const BAND_LEVEL = 0.55; // the band bus's level under your instrument
const TRY_LEVEL = 0.35; // ...and in the shop, where the electric piano plays alone while you try the loop pedal
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

// Your loop sits a little under your live playing.
const LOOP_LEVEL = 0.8;
// The safety before the speakers: everything passes untouched up to SAFE_KNEE (about -3 dB; the
// game's own sound peaks around there, a hard chord at the default volume), and louder peaks round
// off toward SAFE_CEILING, up to SAFE_HEADROOM times over full scale (+12 dB: three layers of a hard
// chord on top of the same chord played live). The ceiling is a hair under full scale because the
// shaper's own smoothing overshoots it a little.
const SAFE_KNEE = 0.7;
const SAFE_CEILING = 0.95;
const SAFE_HEADROOM = 4;

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

// The safety's curve, for input scaled down by SAFE_HEADROOM: back up to the sound's own level, then
// straight through up to SAFE_KNEE, and rounding off smoothly above it, never past SAFE_CEILING.
export function safetyCurve(n = 4097) {
  const curve = new Float32Array(n), room = SAFE_CEILING - SAFE_KNEE;
  for (let i = 0; i < n; i++) {
    const x = SAFE_HEADROOM * ((i / (n - 1)) * 2 - 1), a = Math.abs(x);
    curve[i] = Math.sign(x) * (a <= SAFE_KNEE ? a : SAFE_KNEE + room * Math.tanh((a - SAFE_KNEE) / room));
  }
  return curve;
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
  const loopIns = {}; // a gain per instrument for your loop's notes, into its input: the loop's fade
  const pedals = {}; // id -> { input, output, set(on, at) }
  let tremoloDepth = null, tremoloWave = null;
  let instrument = 'acoustic';
  const pedalOn = Object.fromEntries(PEDALS.map((id) => [id, false]));
  const plucks = new Map(); // `${pitch}:${strength}` -> AudioBuffer, for the instrument you play
  const voices = new Map(); // key code -> the voice sounding: { g, sources, release }
  const looped = new Set(); // your loop's voices, sounding or about to: { g, sources, release, start, end, layer }
  const ringing = new Set(); // voices whose key is up but Space holds them
  let ring = false;
  let muted = storage.get(MUTE_KEY) === '1';
  let volume = Number(storage.get(VOLUME_KEY) ?? 0.8);
  if (!(volume >= 0 && volume <= 1)) volume = 0.8;
  let loopAt = -1, next16 = 0, stopAt = Infinity, crackleAt = 0;
  let loopDone = 0; // your loop's notes are scheduled up to this band time
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
      loopIns[id] = ctx.createGain();
      loopIns[id].gain.value = LOOP_LEVEL;
      loopIns[id].connect(inputs[id]);
    }
    newTremoloWave(ctx.currentTime);
    // The safety between everything and the speakers.
    const headroom = ctx.createGain(), safety = ctx.createWaveShaper();
    headroom.gain.value = 1 / SAFE_HEADROOM;
    safety.curve = safetyCurve();
    safety.oversample = '4x'; // rounding off peaks makes highs that would otherwise fold back down as noise
    master.connect(headroom).connect(safety).connect(ctx.destination);
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

  // The voices, one per note: each starts at `at` into `to` (its instrument's input, or the loop's way
  // into it) and returns what damp() needs to stop it, { g: its gain, sources: what to stop }.
  function pluckVoice(pitch, strength, at, legato, to) {
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = bufferFor(pitch, strength);
    g.gain.value = PICK[strength - 1] * (legato ? PLAY.legatoGain : 1);
    src.connect(g).connect(to);
    src.start(at, legato ? 0.012 : 0); // a hammer-on has no pick attack
    return { g, sources: [src] };
  }

  function epianoVoice(pitch, strength, at, legato, to) {
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
    note.connect(g).connect(to);
    bell.connect(ding).connect(g);
    const sources = [note, bend, bell];
    for (const o of sources) {
      o.start(at);
      o.stop(at + decay * 7); // by then it's 60 dB down
    }
    return { g, sources };
  }

  function synthVoice(pitch, strength, at, legato, to) {
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
    filter.connect(g).connect(to);
    return { g, sources };
  }

  const VOICES = { acoustic: pluckVoice, ukulele: pluckVoice, electric: pluckVoice, epiano: epianoVoice, synth: synthVoice };

  function noteOn(code, pitch, strength, at, legato) {
    if (!ctx) return;
    noteOff(code, at); // the same key again: the old note stops
    const start = Math.max(at, ctx.currentTime);
    // A re-struck pitch still ringing from Space (a different key code, since noteOff above already
    // moved this one on): damp it too, so repeats replace their ringing self instead of stacking.
    for (const v of ringing) {
      if (v.pitch === pitch) {
        ringing.delete(v);
        damp(v, start);
      }
    }
    const voice = VOICES[instrument](pitch, strength, start, legato, inputs[instrument]);
    voices.set(code, { ...voice, release: VOICING[instrument].release, pitch, start });
  }

  // Damps a voice from `at`, but never before it actually starts: a strummed note can be released
  // before its own delayed start, and starting the fade early would be undone by the attack's later
  // automation, then cut off with a click.
  function damp(v, at) {
    const t = Math.max(at, ctx.currentTime, v.start);
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

  // The band starts with your first note: 16th 0 sounds at `at`. Your loop starts empty with it.
  function startBand(at, level = BAND_LEVEL) {
    if (!ctx) return;
    loopAt = at;
    next16 = 0;
    stopAt = Infinity;
    loopDone = 0;
    newTremoloWave(at);
    for (const g of [band, ...Object.values(loopIns)]) {
      g.gain.cancelScheduledValues(at);
      g.gain.setValueAtTime(g === band ? level : LOOP_LEVEL, at);
    }
  }

  // The band in the shop, while you try the loop pedal: its electric piano alone (the keys layer, with
  // no stand-in percussion), softly, from `at`.
  function tryBand(at) {
    if (!ctx) return;
    startBand(at, TRY_LEVEL);
    for (const { id } of LAYERS) bus[id].gain.setTargetAtTime(id === 'keys' ? 1 : 0, at, 0.02);
    bus.perc.gain.setTargetAtTime(0, at, 0.02);
    wobble.gain.setTargetAtTime(0, at, 0.5);
  }

  // The end of the set: the band and your loop fade out over a bar from `at`, and stop.
  function endBand(at) {
    if (!ctx) return;
    for (const g of [band, ...Object.values(loopIns)]) {
      g.gain.setValueAtTime(g === band ? BAND_LEVEL : LOOP_LEVEL, at);
      g.gain.linearRampToValueAtTime(0, at + BAR);
    }
    stopAt = at + BAR;
  }

  // Stops the band and your loop at once: nothing more is scheduled, and what's still sounding fades
  // out quickly.
  function stopBand() {
    loopAt = -1;
    if (!ctx) return;
    band.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    stopLoop();
  }

  // A looped note: a voice of its own through your instrument and pedals (so it never cuts off a note
  // you're playing, even on the same key), letting go `len` seconds after it starts at `at`.
  function loopNote({ pitch, strength, legato, len, layer, at }) {
    const release = VOICING[instrument].release;
    const v = { ...VOICES[instrument](pitch, strength, at, legato, loopIns[instrument]), release, start: at, end: at + len + release * 2, layer };
    damp(v, at + len);
    looped.add(v);
  }

  // Stops your loop's voices from one layer (or every layer) now: those sounding let go, and those
  // scheduled but not yet started are cut off before they sound.
  function stopLoop(layer = null) {
    if (!ctx) return;
    for (const v of looped) {
      if (layer !== null && v.layer !== layer) continue;
      looped.delete(v);
      if (v.start > ctx.currentTime) v.g.disconnect();
      damp(v, ctx.currentTime);
    }
  }

  // A layer slot switched on or off, at a bar line (or at once, from the sound check).
  function setLayer(id, on, at = now()) {
    if (!ctx) return;
    bus[id].gain.setTargetAtTime(on ? 1 : 0, Math.max(at, ctx.currentTime), 0.02);
    if (id === 'top') wobble.gain.setTargetAtTime(on ? 9 : 0, Math.max(at, ctx.currentTime), 0.5);
    // The stand-in percussion fills in for the drums, so it fades the opposite way, at the same moment.
    if (id === 'drums') bus.perc.gain.setTargetAtTime(on ? 0 : 1, Math.max(at, ctx.currentTime), 0.02);
  }

  // Called every frame: schedules the band's 16ths due in the next GROOVE.ahead seconds, the crackle,
  // and your loop's notes due by then. loopDue(from, to) gives the looped notes starting between two
  // band times (seconds since the band's first 16th), as looper.js's due does. Returns the looped
  // notes it scheduled, each with `at`, its time on the audio clock.
  function update(loopDue = null) {
    if (!ctx || ctx.state !== 'running' || loopAt < 0) return [];
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
    for (const v of looped) if (v.end < t) looped.delete(v);
    // Your loop's notes, never in the past: after a stall, what's already late is skipped.
    const from = Math.max(loopDone, t - loopAt), to = Math.min(t + GROOVE.ahead, stopAt) - loopAt;
    if (!loopDue || to <= from) return [];
    loopDone = to;
    const notes = loopDue(from, to).map((n) => ({ ...n, at: loopAt + n.t }));
    for (const n of notes) loopNote(n);
    return notes;
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
    start, now, warm, noteOn, noteOff, setRing, setInstrument, setPedal, startBand, tryBand, endBand, stopBand, stopLoop,
    setLayer, update, coin, clap, reportedLatency, heardAt,
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

- [ ] **Step 4: The loop pedal in the sound check**

Replace `open-case/src/soundcheck.js` with:

```js
// The sound check (/open-case/?sound): the band with a switch per layer, and your instrument on the
// keys, so the sounds and the beat can be judged by ear before anything else. Every instrument and
// pedal in the shop can be tried here, without buying it (keys 2 to 6 stomp the pedals too), and the
// loop pedal (R records, Backspace undoes). No crowd, no set: the band plays until you leave.
import { createInput } from './input.js';
import { layoutPitches } from './keys.js';
import { STOCK } from './gear.js';
import { createLoop, record, note, release, ring, step, undo, due, loopState } from './looper.js';
import { LOOP } from './tuning.js';

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
  const loop = createLoop();
  let bandAt = 0; // the band's first 16th, on the audio clock: the loop's times count from it
  const bandTime = () => audio.now() - bandAt;

  const begin = () => {
    if (started) return;
    started = true;
    audio.start();
    warm();
    bandAt = audio.now() + 0.1;
    audio.startBand(bandAt);
    for (const box of boxes) audio.setLayer(box.dataset.layer, box.checked);
    document.getElementById('sound-start').hidden = true;
  };
  for (const box of boxes) box.addEventListener('change', () => started && audio.setLayer(box.dataset.layer, box.checked));
  // The shop's instruments and pedals, from its stock.
  const choice = document.getElementById('sound-instrument'), pedals = document.getElementById('sound-pedals');
  const warm = () => audio.warm(layoutPitches(input.keys), input.keys.strength);
  for (const item of STOCK) {
    if (item.kind === 'instrument') choice.add(new Option(item.name, item.id));
    else if (item.kind === 'pedal') {
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
      if (started) note(loop, n.at - bandAt, n.code, n);
      // A strummed note's `at` is deliberately later than now (the strum gap); only notes that sound
      // at once tell us the true key-to-sound latency.
      if (n.at <= audio.now()) {
        const heard = audio.heardAt(n.at);
        if (heard !== null) measured = heard - n.timeStamp;
      }
    },
    onRelease: (r) => {
      audio.noteOff(r.code, r.at);
      release(loop, r.at - bandAt, r.code);
    },
    onControl: (action, down) => {
      if (action === 'ring') {
        audio.setRing(down);
        ring(loop, bandTime(), down);
      } else if (action === 'mute') audio.toggleMute();
      else if (action === 'loop') {
        if (started) record(loop, bandTime());
      } else if (action === 'undo') {
        if (undo(loop)) audio.stopLoop(loop.layers.length);
      } else if (action !== 'pause') warm();
    },
    onPedal: (id) => {
      const box = pedals.querySelector(`[data-pedal="${id}"]`);
      box.checked = !box.checked;
      audio.setPedal(id, box.checked);
    },
  });
  if (debug) window.__openCase = { audio, input, loop, get measured() { return measured; } };

  const frame = () => {
    if (started) step(loop, bandTime());
    audio.update((from, to) => due(loop, from, to));
    const reported = audio.reportedLatency();
    latency.textContent = `Octave ${input.keys.octave}, pick ${input.keys.strength} of 4${input.keys.lock ? ', scale lock on' : ''}. `
      + `Loop: ${loopState(loop, bandTime())}, ${loop.layers.length} of ${LOOP.layers} layers. `
      + `Browser's reported audio delay: ${reported == null ? 'not reported' : `${reported.toFixed(0)} ms`}. `
      + `Last key to sound: ${measured == null ? 'play a note' : `${measured.toFixed(0)} ms`}.`;
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
```

In `open-case/index.html`, the sound check's key line becomes:

```html
    <p>Play on the keys: A to ' and W E T Y U O P. Z X octave, C V softer or louder, Space lets notes ring, 1 scale lock, 2 to 6 pedals, R loop, Backspace undo, M mute.</p>
```

- [ ] **Step 5: Run the tests to see them pass**

Run: `cd open-case && npm test`
Expected: PASS, 192 tests.

- [ ] **Step 6: Commit**

```bash
git add open-case/src/audio.js open-case/src/soundcheck.js open-case/index.html open-case/test/fake-audio.js open-case/test/audio.test.js
git commit -m "Open Case: the loop's sound: its notes scheduled with the band's as voices of their own through your pedals, fading with the band; the shop's softer keys-only band; and a safety so stacked loops can't clip

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: The loop on screen

**Files:**
- Modify: `open-case/src/scene.js`, `open-case/src/render.js`
- Modify: `open-case/test/scene.test.js`, `open-case/test/render.test.js`

**Interfaces:**
- Consumes:
  - Task 1: `loopState`, `createLoop`, `record` and `step` from `looper.js`.
  - Task 2: the frames and `sprites.json` data.
  - Task 3: `choose` from `shop.js`.
- Produces:
  - `scene.js`:
    - `LOOP_PEDAL = [133, 152]`, and `PIGEONS = [[222, 172], [235, 176], [248, 170]]`.
    - `createScene()` has `loopTrail: []`.
    - `sceneLoopNote(scene, pitch, t)`.
    - `loopGlyphAt(g, t) -> { x, y, fade }`, where `fade` is 0 before the note plays.
    - `LOOP_TRAIL_LIFE` (3).
  - `render.js`:
    - exports `loopLight(loop, t) -> 'dark' | 'red' | 'green'` and `loopWords({ what, layer })`.
    - The view gains `loop` (the set's loop, or the shop's while you try it, or `null`) and `loopSaid` (`null | { what, layer, time }`, with `what` one of `'recording'`, `'full'`, `'cancelled'`, `'removed'` or `'cleared'`, and `time` on the page's clock).
    - On the shop screen, the view's `t` is the time of the band you try the loop pedal over.

- [ ] **Step 1: Write the failing tests**

In `open-case/test/scene.test.js`, the import from `scene.js` begins:

```js
import {
  createScene, sceneNote, sceneLoopNote, sceneEvents, stepScene, coinAt, glyphAt, loopGlyphAt, CASE, GUITAR, LOOP_PEDAL,
  TRAIL_LIFE, LOOP_TRAIL_LIFE, FLIGHT, GOLD,
```

(the rest of it doesn't change), and before the test `'a coin arcs from the listener into the case and stays there'`, add:

```js
test("each of your loop's notes rises from the loop pedal once it plays, up and away from your own, and fades sooner", () => {
  const scene = createScene();
  sceneLoopNote(scene, 60, 2); // scheduled a moment ahead of time 2
  sceneLoopNote(scene, 72, 2.5);
  const [low, high] = scene.loopTrail;
  assert.equal(loopGlyphAt(low, 1.9).fade, 0, 'not before it plays');
  const start = loopGlyphAt(low, 2);
  assert.equal(start.x, LOOP_PEDAL[0]);
  assert.ok(start.y <= LOOP_PEDAL[1] && start.y > LOOP_PEDAL[1] - 10, 'just over the pedal');
  assert.ok(loopGlyphAt(high, 2.5).y < start.y, 'higher notes a little higher');
  const later = loopGlyphAt(low, 3);
  assert.ok(later.y < start.y && later.x < start.x, 'up and to the left, while your own notes drift right');
  assert.ok(LOOP_TRAIL_LIFE < TRAIL_LIFE);
  stepScene(scene, 2.1 + LOOP_TRAIL_LIFE);
  assert.deepEqual(scene.loopTrail.map((g) => g.pitch), [72]);
});
```

Replace `open-case/test/render.test.js` with:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRenderer, shapeTags, personFrame, youFrame, treeFrame, loopLight, loopWords, W, H } from '../src/render.js';
import { createSet, runSet } from '../src/set.js';
import { createScene, createFlocks, sceneNote, sceneLoopNote, CASE, PIGEONS, LOOP_PEDAL } from '../src/scene.js';
import { createKeyState } from '../src/keys.js';
import { goodSet } from '../src/bots.js';
import { KINDS } from '../src/crowd.js';
import { BAR, BEAT } from '../src/groove.js';
import { INTEREST } from '../src/tuning.js';
import { STOCK, PEDALS, INSTRUMENTS, freshGear, buy, stomp } from '../src/gear.js';
import { createShop, choose, CARD, BUTTON } from '../src/shop.js';
import { createLoop, record, step } from '../src/looper.js';
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
  flocks: createFlocks(1), gear: freshGear(), stomp: null, loop: null, loopSaid: null, shop: null, debug: null, ...over,
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
  assert.ok(g.texts.includes('2-6 pedals   R loop   backspace undo'), 'the pedal keys and the loop pedal\'s');
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
    const loop = [null, createLoop(), loopOf(2), loopOf(1, t - 1), loopOf(3)][Math.floor(t) % 5]; // empty, waiting or recording, playing
    const loopSaid = { what: ['recording', 'full', 'cancelled', 'removed', 'cleared'][Math.floor(t / 2) % 5], layer: 1 + (Math.floor(t) % 3), time: t * 1.3 - 0.2 };
    if (t % 1 < 0.37) sceneLoopNote(scene, 55 + (Math.floor(t) % 20), t + 0.1);
    for (const still of [false, true]) draw(view({ set, scene, t, bars: t / BAR, time: t * 1.3 - 0.01, still, flocks, gear, stomp: stomped, loop, loopSaid }));
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
  assert.deepEqual(drawn(g, 'pedal-').map((s) => s.name), ['pedal-loop-dark', 'pedal-overdrive-1', 'pedal-chorus-0', 'pedal-tremolo-1', 'pedal-delay-0', 'pedal-reverb-1']);
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

// A loop with `layers` layers done, from band time 0, and optionally a recording armed at band time
// `armed` (from the next bar line).
function loopOf(layers, armed = null) {
  const loop = createLoop();
  for (let i = 0; i < layers; i++) {
    record(loop, i * 5 * BAR);
    step(loop, (i * 5 + 5) * BAR);
  }
  if (armed !== null) record(loop, armed);
  return loop;
}

test("the loop pedal's light: dark when empty, blinking red on the beat while it waits, red recording, green playing", () => {
  assert.equal(loopLight(null, 5), 'dark');
  assert.equal(loopLight(createLoop(), 5), 'dark');
  const waiting = loopOf(0, 20 * BAR + 0.1);
  assert.equal(loopLight(waiting, 20 * BAR + BEAT), 'red', 'on the beat');
  assert.equal(loopLight(waiting, 20 * BAR + BEAT * 1.6), 'dark', 'between beats');
  assert.equal(loopLight(waiting, 21 * BAR + 0.5), 'red', 'recording');
  assert.equal(loopLight(loopOf(2), 30 * BAR), 'green');
  assert.equal(loopLight(loopOf(2, 30 * BAR + 0.1), 31 * BAR + 2), 'red', 'recording over the loop');
});

test('the loop pedal stands by the crate once it is yours, its light as the loop is; the speaker is always there', () => {
  const plain = fakeContext();
  createRenderer(plain, art)(view({ set: createSet(1), t: 1 }));
  assert.equal(drawn(plain, 'pedal-loop').length, 0, 'not yours yet');
  assert.equal(drawn(plain, 'speaker').length, 1);
  const gear = { ...freshGear(), savings: 100 };
  buy(gear, 'loop');
  const at = (loop, t) => {
    const g = fakeContext();
    createRenderer(g, art)(view({ set: createSet(1), t, gear, loop }));
    return drawn(g, 'pedal-loop').map((s) => s.name);
  };
  assert.deepEqual(at(createLoop(), 1), ['pedal-loop-dark']);
  assert.deepEqual(at(loopOf(1), 30 * BAR), ['pedal-loop-green']);
  assert.deepEqual(at(loopOf(1, 30 * BAR + 0.1), 31 * BAR + 1), ['pedal-loop-red']);
});

test("the strip's loop slot: its key, and a dot per layer it can hold, lit for each recorded and red for the one recording", () => {
  const gear = allGear();
  const slot = (loop, t) => {
    const g = fakeContext();
    createRenderer(g, art)(view({ set: createSet(1), t, gear, loop }));
    const icon = drawn(g, 'strip-loop')[0];
    const dots = g.rects.filter(([x, y, w, h]) => y === 172 && w === 3 && h === 3 && x > icon.x);
    return { icon, dots, key: g.positions.find((p) => p.s === 'R'), g };
  };
  const empty = slot(createLoop(), 1);
  assert.equal(empty.icon.name, 'strip-loop-dark');
  assert.equal(empty.icon.y, 170);
  assert.equal(empty.icon.x, drawn(empty.g, 'strip-reverb')[0].x + 16, 'after the reverb');
  assert.ok(empty.key.x > empty.icon.x);
  assert.deepEqual(empty.dots.map((d) => d[4]), [data.colors.greyDark, data.colors.greyDark, data.colors.greyDark]);
  const two = slot(loopOf(2, 30 * BAR + 0.1), 31 * BAR + 1);
  assert.equal(two.icon.name, 'strip-loop-red');
  assert.deepEqual(two.dots.map((d) => d[4]), [data.colors.light, data.colors.light, data.colors.red]);
  const right = Math.max(...empty.dots.map(([x, , w]) => x + w));
  assert.ok(right < Math.min(...PIGEONS.map(([x]) => x)) - 4 - 4, 'the slot ends before the pigeons, however they shuffle');
  const none = fakeContext();
  createRenderer(none, art)(view({ set: createSet(1), t: 1 }));
  assert.equal(drawn(none, 'strip-loop').length, 0, 'not yours yet');
});

test("the loop pedal's news shows over its slot for a second, the newer over a stomp", () => {
  assert.deepEqual(
    [{ what: 'recording', layer: 1 }, { what: 'recording', layer: 2 }, { what: 'full' }, { what: 'cancelled' }, { what: 'removed' }, { what: 'cleared' }].map(loopWords),
    ['loop recording', 'layer 2', 'loop full', 'recording cancelled', 'layer removed', 'loop cleared'],
  );
  const gear = allGear();
  const at = (time, stomp) => {
    const g = fakeContext();
    createRenderer(g, art)(view({ set: createSet(1), t: 1, time, gear, stomp, loopSaid: { what: 'recording', layer: 2, time: 10 } }));
    return g.texts;
  };
  assert.ok(at(10.5).includes('layer 2'));
  assert.ok(!at(11.2).includes('layer 2'), 'gone after a second');
  const newer = at(10.5, { id: 'delay', on: true, time: 10.3 });
  assert.ok(newer.includes('delay on') && !newer.includes('layer 2'), 'one at a time: the stomp came after');
  const older = at(10.5, { id: 'delay', on: true, time: 9.8 });
  assert.ok(older.includes('layer 2') && !older.includes('delay on'));
});

test("your loop's notes rise faintly from the loop pedal as each plays, not before, and fade", () => {
  const scene = createScene(1);
  sceneLoopNote(scene, 60, 5);
  const lit = (t) => {
    const g = fakeContext();
    const rects = [];
    const fill = g.fillRect;
    g.fillRect = function (x, y, w, h) {
      if (w === 3 && h === 3 && this.fillStyle === data.colors.light) rects.push([x, y, this.globalAlpha]);
      return fill.call(this, x, y, w, h);
    };
    createRenderer(g, art)(view({ set: createSet(1), scene, t }));
    return rects;
  };
  assert.deepEqual(lit(4.9), [], 'scheduled a moment ahead, but not playing yet');
  const [[x, y, alpha]] = lit(5.2);
  assert.ok(Math.abs(x - LOOP_PEDAL[0]) < 6 && y < LOOP_PEDAL[1], 'just over the loop pedal');
  assert.ok(alpha > 0 && alpha < 0.5, `faint: ${alpha}`);
  assert.deepEqual(lit(5 + 3.1), [], 'gone');
});

test("in the shop, the loop pedal's light shows the loop you're trying, and its card says what R and Backspace do", () => {
  const gear = { ...freshGear(), savings: 0 };
  const shop = createShop();
  choose(shop, STOCK.findIndex((s) => s.id === 'loop'));
  const at = (t) => {
    const g = fakeContext();
    createRenderer(g, art)(view({ screen: 'shop', shop, gear, t, time: 5 }));
    return g;
  };
  const [lx, ly] = data.shop.leds.loop;
  const light = (g) => g.rects.filter(([x, y, w, h]) => x === lx && y === ly - data.shop.lift && w === 2 && h === 2).map((r) => r[4]);
  assert.deepEqual(light(at(1)), [], 'dark: nothing recorded yet');
  record(shop.loop, 1);
  assert.deepEqual(light(at(BAR + 1)), [data.colors.red]);
  step(shop.loop, BAR + 4 * BAR);
  assert.deepEqual(light(at(6 * BAR)), [data.colors.go]);
  const g = at(6 * BAR);
  assert.ok(g.texts.includes('R records 4 bars, then loops them under you.'));
  assert.ok(g.texts.includes('R record   backspace undo   arrows choose   esc back'));
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd open-case && npm test`
Expected: FAIL. `scene.js` has no `LOOP_PEDAL` export, so `scene.test.js` and `render.test.js` don't load.

- [ ] **Step 3: Write scene.js and render.js**

Replace `open-case/src/scene.js` with:

```js
// What's on screen besides the set itself, as plain data updated from what happens: the note trail
// (and your loop's, fainter), coins flying into the case, the gold link of a callback, and the park's
// life (the sunset over the set, the lit windows, the train, the pigeons by your case and the birds
// overhead). Pure, so it's
// tested in Node; render.js draws it. Times are seconds on the set's clock, except the birds' and the
// pigeons' pecking, which run on the page's clock (`time`).
import { createRng, nextRandom, randomBetween } from './rng.js';
import { BAR } from './groove.js';
import { PARK, RULES } from './tuning.js';

export const GUITAR = [152, 128]; // where notes float up from
export const LOOP_PEDAL = [133, 152]; // where your loop's notes float up from (art/open-case/gear.lua G.LOOP_PEDAL)
export const CASE = [161, 160]; // where coins land
// Where the pigeons peck: their feet, clear of the gear strip's loop slot (render.js).
export const PIGEONS = [[222, 172], [235, 176], [248, 170]];
const TRAIL_LIFE = 6; // seconds a note's glyph lasts (2 bars)
const LOOP_TRAIL_LIFE = 3; // seconds a looped note's glyph lasts
const FLIGHT = 0.7; // seconds a coin takes to reach the case
const GOLD = 2; // seconds the callback's gold link shows
const PARK_SEED = 0x9e3779b9; // mixed into the set's seed, so the park draws from its own stream
const TRAIN_LENGTH = 62; // pixels, engine and all
const CLOUD_MARGIN = 60; // pixels a cloud drifts off one side before it comes back on the other
const FLOCK_MARGIN = 40; // pixels off screen a flock starts and ends
const FLOCK_SPACING = 9; // pixels between the birds in a flock...
const FLOCK_ROWS = [0, 3, -2, 5, 1]; // ...and each one's height in the line
const FLAP = 0.12; // seconds a bird's wingbeat frame lasts
const PIGEON_FLY = 2.5; // seconds scattered pigeons take to fly off screen
const PIGEON_WALK = 4; // seconds they take to walk back in
const PIGEON_CYCLE = 6; // seconds: each pigeon pecks, then shuffles a few pixels, then pecks again
// Which of n frames a counter is on, for counters that may be negative (the page's clock can start a
// hair below zero).
export const frameOf = (count, n) => ((Math.floor(count) % n) + n) % n;

export function createScene(seed = 1) {
  const rng = createRng((seed ^ PARK_SEED) >>> 0);
  return {
    trail: [], flights: [], caseCoins: 0, gold: null, clapFrom: -1,
    loopTrail: [], // your loop's notes, { pitch, t }, in time order (t can be a moment ahead: they're scheduled ahead)
    lastNote: -Infinity, // when you last played a note (you strum)
    scaredAt: null, // when a loud note last scattered the pigeons
    flyFrom: 1, // how far through the walk back they were when last scattered (1: at home)
    trainBar: Math.floor(randomBetween(rng, PARK.trainFrom, PARK.trainTo)),
    rng, // the windows' bars, drawn as they're first asked for
    windowBars: [],
  };
}

// A note you played: index is its place in the ears' note list (for its echo). A loud one scatters
// the pigeons, if they're there.
export function sceneNote(scene, pitch, index, t, strength = 0) {
  scene.trail.push({ pitch, index, t });
  scene.lastNote = t;
  if (strength >= RULES.loudStrength && (scene.scaredAt === null || t - scene.scaredAt >= PARK.pigeonsAway * BAR)) {
    // Scattered while walking back in: fly on from there, not from home.
    const back = scene.scaredAt === null ? -1 : t - scene.scaredAt - PARK.pigeonsAway * BAR;
    scene.flyFrom = back >= 0 && back < PIGEON_WALK ? back / PIGEON_WALK : 1;
    scene.scaredAt = t;
  }
}

// A note of your loop, starting at time t.
export function sceneLoopNote(scene, pitch, t) {
  scene.loopTrail.push({ pitch, t });
}

// Takes one update's set events.
export function sceneEvents(scene, events, t) {
  for (const e of events) {
    if (e.type === 'coin') {
      for (let k = 0; k < e.coins; k++) scene.flights.push({ from: [e.person.x, e.person.y - 34], t: t + k * 0.12 });
    } else if (e.type === 'rule' && e.rule === 'callback') scene.gold = { t, first: e.first };
    else if (e.type === 'end') scene.clapFrom = t;
  }
}

// Time passes: old glyphs go, coins land.
export function stepScene(scene, t) {
  while (scene.trail.length && t - scene.trail[0].t > TRAIL_LIFE) scene.trail.shift();
  while (scene.loopTrail.length && t - scene.loopTrail[0].t > LOOP_TRAIL_LIFE) scene.loopTrail.shift();
  for (const f of scene.flights) if (!f.landed && t - f.t >= FLIGHT) {
    f.landed = true;
    scene.caseCoins++;
  }
  scene.flights = scene.flights.filter((f) => !f.landed);
  if (scene.gold && t - scene.gold.t > GOLD) scene.gold = null;
}

// Where a flying coin is at time t: an arc from the listener to the case. null before it's thrown.
export function coinAt(f, t) {
  const k = (t - f.t) / FLIGHT;
  if (k < 0) return null;
  const [x0, y0] = f.from, [x1, y1] = CASE;
  return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k - Math.sin(Math.PI * k) * 24];
}

// Where a note's glyph is at time t, and how faded (1 new, 0 gone). Higher notes start higher; the
// glyphs drift right and up as they age, so their spacing follows your timing.
export function glyphAt(g, t) {
  const age = t - g.t;
  return { x: GUITAR[0] + age * 16, y: GUITAR[1] - (g.pitch - 52) * 1.4 - age * 5, fade: Math.max(0, 1 - age / TRAIL_LIFE) };
}

// The same for a looped note's glyph, once the note sounds: it rises from just over the loop pedal
// (higher notes a little higher) and drifts up and away to the left, so it never follows your own
// notes off toward the crowd.
export function loopGlyphAt(g, t) {
  const age = t - g.t;
  return { x: LOOP_PEDAL[0] - age * 10, y: LOOP_PEDAL[1] - (g.pitch - 52) * 0.5 - age * 10, fade: age < 0 ? 0 : Math.max(0, 1 - age / LOOP_TRAIL_LIFE) };
}

// The sunset. `bar` is a whole number of bars into the set (0 before it starts).

// The stage, 0 (dusk) to 4 (night), of each of the sky's seven bands, top down. Each band steps on at a
// bar line, the top one first and the horizon's last, so stage k is complete at bar k * stageBars.
export function skyStages(bar) {
  return Array.from({ length: 7 }, (_, band) => {
    let stage = 0;
    for (let k = 0; k < 4; k++) if (bar >= k * PARK.stageBars + PARK.bandFirst + PARK.bandStep * band) stage = k + 1;
    return stage;
  });
}

// How far the sun has sunk, in pixels, `bars` (a fraction is fine) into the set; null once it's gone.
export function sunDrop(bars) {
  if (bars >= PARK.sunGone) return null;
  return Math.round((PARK.sunSink * Math.max(0, bars)) / PARK.sunGone);
}

// Is the i-th window lit yet? Each lights at its own bar, drawn from the set's seed.
export function windowLit(scene, i, bar) {
  while (scene.windowBars.length <= i) scene.windowBars.push(Math.floor(randomBetween(scene.rng, PARK.windowsFrom, PARK.windowsTo)));
  return bar >= scene.windowBars[i];
}

// The lamp: 'off' before its bar, then 'on', dimming for a moment now and then ('flicker') unless
// the page is asked for reduced motion.
export function lampState(bar, time, still) {
  if (bar < PARK.lampOn) return 'off';
  return !still && Math.sin(time * 7.3) * Math.sin(time * 2.1) > 0.9 ? 'flicker' : 'on';
}

// How many stars are out: one more each bar from PARK.starsFrom.
export const starsOut = (bar) => Math.max(0, bar - PARK.starsFrom + 1);

// The distant train's left end at set time t, or null when it isn't passing.
export function trainX(scene, t) {
  const k = (t - scene.trainBar * BAR) / PARK.trainCross;
  if (k < 0 || k > 1) return null;
  return Math.round(-TRAIN_LENGTH + k * (320 + TRAIN_LENGTH));
}

// A cloud's x after `time` seconds of drifting right from `home`, coming back round from the left.
export function cloudX(home, layer, time) {
  const span = 320 + 2 * CLOUD_MARGIN;
  const x = (home + CLOUD_MARGIN + PARK.clouds[layer - 1] * time) % span;
  return Math.round(x) - CLOUD_MARGIN;
}

// The birds: flocks of 1 to PARK.flockMost that cross the sky now and then, from their own seeded
// stream, on the page's clock.
export function createFlocks(seed = 1) {
  const rng = createRng((seed ^ PARK_SEED ^ 0xb12d5) >>> 0);
  return { rng, next: randomBetween(rng, PARK.flockFirst[0], PARK.flockFirst[1]), flying: [] };
}

// The birds in the sky at `time` (seconds, only ever increasing): [{ x, y, frame }].
export function birdsAt(flocks, time) {
  while (flocks.next <= time) {
    const r = flocks.rng;
    flocks.flying.push({
      t: flocks.next,
      dir: nextRandom(r) < 0.5 ? 1 : -1,
      y: Math.round(randomBetween(r, 14, 60)),
      n: 1 + Math.floor(nextRandom(r) * PARK.flockMost),
    });
    flocks.next += randomBetween(r, PARK.flockEvery[0], PARK.flockEvery[1]);
  }
  flocks.flying = flocks.flying.filter((f) => time - f.t < PARK.flockCross);
  const out = [];
  for (const f of flocks.flying) {
    const k = (time - f.t) / PARK.flockCross, span = 320 + 2 * FLOCK_MARGIN;
    const lead = f.dir > 0 ? -FLOCK_MARGIN + k * span : 320 + FLOCK_MARGIN - k * span;
    for (let j = 0; j < f.n; j++) {
      out.push({ x: Math.round(lead - f.dir * j * FLOCK_SPACING), y: f.y + FLOCK_ROWS[j], frame: frameOf(time / FLAP + j, 2) });
    }
  }
  return out;
}

// The pigeons at set time t and page time `time`: [{ x, y, pose: 'peck' | 'walk' | 'fly', frame,
// dir }] (+1 facing right). Scattered, they fly up and off to the right; PARK.pigeonsAway bars later
// they walk back in from the right, and they're gone in between.
export function pigeonsAt(scene, t, time) {
  const out = [];
  const since = scene.scaredAt === null ? Infinity : Math.max(0, t - scene.scaredAt);
  PIGEONS.forEach(([hx, hy], i) => {
    const from = 330 + i * 10; // where pigeon i starts walking back in from
    if (since < PIGEON_FLY) {
      const start = from + (hx - from) * scene.flyFrom; // where it was when scattered
      const up = 70 * since + 20 * since * since;
      out.push({ x: Math.round(start + (60 + i * 12) * since), y: Math.round(hy - up), pose: 'fly', frame: frameOf(since * 8 + i, 2), dir: 1 });
      return;
    }
    const back = since - PARK.pigeonsAway * BAR; // seconds since they started walking back
    if (back < 0) return;
    if (back < PIGEON_WALK) {
      out.push({ x: Math.round(from + (hx - from) * (back / PIGEON_WALK)), y: hy, pose: 'walk', frame: frameOf(time * 6 + i, 2), dir: -1 });
      return;
    }
    // At home: pecking, then shuffling 4 pixels one way, pecking, then shuffling back.
    const cycle = (time + i * 1.3) / PIGEON_CYCLE, n = Math.floor(cycle), f = cycle - n;
    const walking = f > 0.75, w = walking ? (f - 0.75) / 0.25 : 0;
    const dir = frameOf(n, 2) === 0 ? 1 : -1;
    const x = hx + Math.round(dir > 0 ? 4 * w : 4 * (1 - w));
    out.push(walking
      ? { x, y: hy, pose: 'walk', frame: frameOf(time * 6 + i, 2), dir }
      : { x, y: hy, pose: 'peck', frame: frameOf(time * 3 + i * 1.7, 4) === 0 ? 1 : 0, dir });
  });
  return out;
}

export { TRAIL_LIFE, LOOP_TRAIL_LIFE, FLIGHT, GOLD, TRAIN_LENGTH, PIGEON_FLY, PIGEON_WALK };
```

Replace `open-case/src/render.js` with:

```js
// Draws the scene at 320x180 into a 2D context (main.js scales it up by a whole number), in the flat
// style, from the sprite sheet art/open-case/sprites.lua makes (assets.js loads it): the park and its
// sunset, you on your crate with your instrument, your pedals and the loop pedal, the open case and
// the band's speaker, the passers-by, their reactions, the pigeons and birds, the note trail (and
// your loop's), the memory strip, the gear strip, the music shop, and the title, pause and ?debug
// overlays. The end card is HTML (index.html).
import { CROWD, PLAY, LAYERS, INTEREST, LOOP } from './tuning.js';
import { BAR, BEAT } from './groove.js';
import {
  GUITAR, coinAt, glyphAt, loopGlyphAt, GOLD, skyStages, sunDrop, windowLit, lampState, starsOut, trainX, cloudX,
  birdsAt, pigeonsAt, frameOf,
} from './scene.js';
import { STOCK, PEDALS, owns, stockItem } from './gear.js';
import { card, trying, CARD, BUTTON } from './shop.js';
import { loopState } from './looper.js';

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
const LOOP_SLOT = PEDALS.length; // the loop pedal's place on the gear strip, after the pedals
const LOOP_FAINT = 0.45; // your loop's note glyphs, this faint next to your own
const STOMP_SHOW = 1; // seconds a stomped pedal's name (or the loop pedal's news) shows over the strip
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

// The loop pedal's light at band time t (loop: looper.js, or null): dark while the loop is empty,
// red blinking on the beat while a recording waits for its bar line, red while it records, and green
// while the loop plays.
export function loopLight(loop, t) {
  const state = loop ? loopState(loop, t) : 'empty';
  if (state === 'waiting') return frameOf(t / (BEAT / 2), 2) === 0 ? 'red' : 'dark';
  return { recording: 'red', playing: 'green' }[state] ?? 'dark';
}

// The words for the loop pedal's news over the strip. what: 'recording' (layer: the layer it's about
// to record, from 1), 'full', 'cancelled', 'removed' or 'cleared'.
export function loopWords({ what, layer }) {
  if (what === 'recording') return layer === 1 ? 'loop recording' : `layer ${layer}`;
  return { full: 'loop full', cancelled: 'recording cancelled', removed: 'layer removed', cleared: 'loop cleared' }[what];
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

  // Everyone and everything standing on the path, nearest last: the listeners, you, your pedals, the
  // loop pedal and the amp, the speaker, the case and its coins, and the pigeons on the ground.
  // Returns the pigeons in the air, drawn later.
  function figures({ set, scene, t, time, gear, loop }) {
    const things = [
      { y: data.feet.you, draw: () => sprite(youFrame(scene, t, time, gear.instrument), 0, 0) },
      {
        y: data.feet.pedals,
        draw: () => {
          for (const id of PEDALS) if (owns(gear, id)) sprite(`pedal-${id}-${gear.on.includes(id) ? 1 : 0}`, 0, 0);
        },
      },
      { y: data.feet.speaker, draw: () => sprite('speaker', 0, 0) },
      {
        y: data.feet.case,
        draw: () => {
          sprite('case', 0, 0);
          for (const [x, y] of data.caseCoins.slice(0, scene.caseCoins)) sprite('case-coin', x, y);
        },
      },
    ];
    if (gear.instrument === 'electric') things.push({ y: data.feet.amp, draw: () => sprite('amp', 0, 0) });
    if (owns(gear, 'loop')) things.push({ y: data.feet.loop, draw: () => sprite(`pedal-loop-${loopLight(loop, t)}`, 0, 0) });
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

  // Your loop's notes, faint, rising from the loop pedal as each plays.
  function loopTrail(scene, t) {
    for (const glyph of scene.loopTrail) {
      const { x, y, fade } = loopGlyphAt(glyph, t);
      if (fade <= 0 || x > W) continue;
      g.globalAlpha = fade * LOOP_FAINT;
      px(x, y, 3, 3, C.light);
      px(x + 2, y - 4, 1, 4, C.light);
    }
    g.globalAlpha = 1;
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

  function hud({ keys, gear, stomp, loop, loopSaid, t, time }, set) {
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
    // The loop pedal's slot, after the pedals: its icon, its key, and a dot for each layer it can
    // hold, lit for each recorded and red for the one recording.
    if (owns(gear, 'loop')) {
      const x = STRIP_X + LOOP_SLOT * STRIP_STEP, state = loop ? loopState(loop, t) : 'empty';
      sprite(`strip-loop-${loopLight(loop, t)}`, x, 170);
      text('R', x + 9, 170, state === 'empty' ? C.grey : C.light);
      const layers = loop?.layers.length ?? 0;
      for (let i = 0; i < LOOP.layers; i++) {
        px(x + 15 + i * 4, 172, 3, 3, i < layers ? C.light : i === layers && loop?.take ? C.red : C.greyDark);
      }
    }
    // What you just did shows over the strip for a moment: the pedal stomped, or the loop pedal's
    // news, whichever is newer.
    const news = [];
    if (stomp) {
      news.push({
        time: stomp.time, x: STRIP_X + PEDALS.indexOf(stomp.id) * STRIP_STEP + 7,
        words: `${stockItem(stomp.id).name.toLowerCase()} ${stomp.on ? 'on' : 'off'}`, good: stomp.on,
      });
    }
    if (loopSaid) news.push({ time: loopSaid.time, x: STRIP_X + LOOP_SLOT * STRIP_STEP + 7, words: loopWords(loopSaid), good: loopSaid.what === 'recording' });
    const shown = news.filter((n) => time - n.time >= 0 && time - n.time < STOMP_SHOW).sort((a, b) => b.time - a.time)[0];
    if (shown) {
      text(shown.words, shown.x + 1, 161, C.ink, 'center');
      text(shown.words, shown.x, 160, shown.good ? C.gold : C.light, 'center');
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
    text('2-6 pedals   R loop   backspace undo', W / 2, 126, C.grey, 'center');
    text('press any key', W / 2, 136, C.gold, 'center');
  }

  // The music shop: the room and the shopkeeper (nodding just after a sale), the stock with its tags
  // (the chosen item lifted, with a pointer over it, and the lights lit on the pedals you can hear),
  // the savings on the chalkboard, and the card for the chosen item.
  function shopView({ shop, gear, t, time, still }) {
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
      const light = item.kind === 'loop' ? loopLight(shop.loop, t) : 'dark'; // the loop pedal you're trying
      if (light !== 'dark') px(S.leds.loop[0], S.leds.loop[1] - lift, 2, 2, light === 'red' ? C.red : C.go);
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
    const keys = STOCK[shop.at].kind === 'loop' ? 'R record   backspace undo   arrows choose   esc back' : 'arrows choose   esc back to the park';
    text(keys, CARD[0] + 6, CARD[1] + 30, C.greyDark);
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
  //   t (set time, which is the band's; in the shop, the time of the band you try the loop pedal
  //   over), bars (bars into the set, a fraction is fine; 0 with no set), time (seconds since the page
  //   opened), still (reduced motion), flocks (the birds, from createFlocks), gear (gear.js),
  //   stomp: null | { id, on, time } (the last pedal stomped, and when, on the page's clock),
  //   loop: null | the loop pedal's loop (looper.js) in the set, or in the shop while you try it,
  //   loopSaid: null | { what, layer, time } (the loop pedal's last news, and when: see loopWords),
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
      loopTrail(scene, t);
      trail(scene, set.listen.notes, t);
      strip(set.listen, scene, t);
      if (view.debug) debugView(set, view.debug);
    }
    if (keys && screen !== 'title') hud(view, screen === 'ready' ? null : set);
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
Expected: PASS, 199 tests.

- [ ] **Step 5: Commit**

```bash
git add open-case/src/scene.js open-case/src/render.js open-case/test/scene.test.js open-case/test/render.test.js
git commit -m "Open Case: the screen: the loop pedal's light, the strip's loop slot and its news, looped notes rising from the pedal, the title's keys, and the light on the rack while you try it

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: The wiring

**Files:**
- Modify: `open-case/src/main.js`, `open-case/src/log.js`
- Modify: `open-case/test/log.test.js`

**Interfaces:**
- Consumes everything above:
  - `looper.js`'s whole API;
  - `choose` from `shop.js`;
  - `owns` from `gear.js`;
  - `audio.update(loopDue)`, `tryBand`, `stopBand` and `stopLoop`;
  - `sceneLoopNote`;
  - the view's `loop` and `loopSaid`.
- Produces: each set's `open-case-log` entry gains `layers`.

`main.js` runs only in the browser, so its checks are the syntax check here and Task 7's run in Chrome.

- [ ] **Step 1: Write the test**

Append to `open-case/test/log.test.js`:

```js

test('each set logs how many loop layers were recorded in it', () => {
  const s = memoryStorage();
  logSet(s, { date: '2026-09-30T20:00:00Z', coins: 25, stopped: 4, instrument: 'electric', pedals: [], layers: 3 });
  logChoice(s, 'another');
  assert.deepEqual(readLog(s), [{ date: '2026-09-30T20:00:00Z', coins: 25, stopped: 4, instrument: 'electric', pedals: [], layers: 3, choice: 'another' }]);
});
```

Run: `cd open-case && npm test`
Expected: PASS, 200 tests. `logSet` keeps whatever an entry holds, so this pins the entry's shape rather than failing first.

- [ ] **Step 2: The log's comments**

In `open-case/src/log.js`, the header becomes:

```js
// The test log: this computer remembers the last LOG_SIZE sets (the date, coins, how many stopped, the
// instrument played, the pedals that were on at any point, how many loop layers were recorded, and
// whether Nathan chose Another set, Stop here or Visit the shop), under open-case-log in local
// storage; and the last LOG_SIZE things he bought, with their dates, under open-case-buys.
```

and the comment above `logSet` becomes:

```js
// A set just ended: { date, coins, stopped, instrument, pedals, layers }. Its choice is filled in
// when a button is pressed.
```

- [ ] **Step 3: Wire it up**

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
// changes how your notes sound, in the park and while you try things in the shop. Once the loop
// pedal is yours, R records your notes into a loop (looper.js) that plays on under you; the crowd
// only ever hears the notes you play live.
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
import { createScene, createFlocks, sceneNote, sceneLoopNote, sceneEvents, stepScene, FLIGHT } from './scene.js';
import { createRenderer, W, H } from './render.js';
import { randomBot, lickBot } from './bots.js';
import { safeStorage } from './storage.js';
import { readLog, logSet, logChoice, readBuys, logBuy } from './log.js';
import { soundCheck } from './soundcheck.js';
import { loadArt } from './assets.js';
import { PEDALS, loadGear, saveGear, earn, buy, play, stomp, stockItem, owns } from './gear.js';
import { createShop, choose, move, action, trying, hit } from './shop.js';
import { createLoop, record, note, release, ring, step, undo, due } from './looper.js';
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
  // The log is Nathan's own: a bot set or a ?coins page never writes to it. Savings still count up
  // on a ?coins page (earn, below); they're just never kept, same as keep() above.
  const logging = !bot && debugSavings === null;
  let shop = null; // the shop's state (shop.js) while you're in it
  let stomped = null; // the last pedal stomped: { id, on, time } (its name shows over the gear strip)
  let setPedals = new Set(); // every pedal that's been on during this set, for the log
  // The loop pedal's loop in a set, empty at each set's start (in the shop, the one you try it with
  // is shop.loop). Its times are band time: the audio clock since the band's first 16th, `start`.
  let loop = createLoop();
  let loopSaid = null; // the loop pedal's last news: { what, layer, time } (it shows over the gear strip)
  let setLayers = 0; // layers recorded this set, for the log
  let ringHeld = false; // whether Space is down, for a loop that starts while it is
  let shopBand = false; // whether the band is playing in the shop, for trying the loop pedal

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
    loop = createLoop();
    ring(loop, 0, ringHeld);
    setLayers = 0;
    screen = 'playing';
  }

  // The loop you hear: the set's, or in the shop the one you're trying (null while you aren't).
  const heardLoop = () => (shop ? shop.loop : loop);

  // R records a layer from the next bar line, and Backspace cancels a recording or takes off the last
  // layer: in a set once the pedal is yours, until the set's end, and in the shop while you try it.
  // Their news shows over the gear strip.
  function loopKey(action) {
    const l = shop ? shop.loop : set?.phase === 'playing' && owns(gear, 'loop') ? loop : null;
    if (!l) return;
    const time = pageTime();
    if (action === 'loop') {
      if (record(l, audio.now() - start)) loopSaid = { what: 'recording', layer: l.layers.length + 1, time };
      else if (!l.take) loopSaid = { what: 'full', time };
      return;
    }
    const what = undo(l);
    if (!what) return;
    audio.stopLoop(l.layers.length); // the cancelled recording's notes, or the layer taken off
    loopSaid = { what, time };
  }

  // Your notes play through your gear, or in the shop, through what you're trying.
  function sound() {
    const setup = shop ? trying(shop, gear) : gear;
    if (audio.setInstrument(setup.instrument)) warmLayout();
    for (const id of PEDALS) audio.setPedal(id, setup.on.includes(id));
    // Trying the loop pedal in the shop: the band plays while it's chosen, and stops as you move on.
    if (!!shop?.loop !== shopBand) {
      shopBand = !shopBand;
      if (shopBand) {
        start = audio.now() + 0.1;
        audio.tryBand(start);
        ring(shop.loop, 0, ringHeld);
      } else audio.stopBand();
    }
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
      if (heardLoop()) note(heardLoop(), n.at - start, n.code, n);
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
      if (heardLoop()) release(heardLoop(), r.at - start, r.code);
      if (set) releaseNote(set, r.at - start);
    },
    onControl: (action, down) => {
      if (action === 'ring') {
        audio.setRing(down);
        ringHeld = down;
        if (heardLoop()) ring(heardLoop(), audio.now() - start, down);
      } else if (action === 'loop' || action === 'undo') loopKey(action);
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
        // A recording still under way is dropped; the loop's layers fade out with the band.
        if (loop.take) {
          undo(loop);
          audio.stopLoop(loop.layers.length);
        }
        const crowd = crowdSize(set.crowd);
        if (crowd > 0) audio.clap(crowd, start + set.t + BAR * 0.5);
      } else if (e.type === 'over') showEnd();
    }
    sceneEvents(scene, events, set.t);
  }

  function showEnd() {
    screen = 'over';
    const s = summary(set);
    // Savings are Nathan's own: a bot set (?bot=…) touches neither them nor his gear.
    if (!bot) {
      earn(gear, s.coins);
      keep();
    }
    // The log is Nathan's own too, and also skips a ?coins page: see `logging` above.
    if (logging) {
      const pedals = PEDALS.filter((id) => setPedals.has(id));
      logSet(storage, { date: new Date().toISOString(), coins: s.coins, stopped: s.stopped, instrument: gear.instrument, pedals, layers: setLayers });
    }
    loop = createLoop(); // the loop belongs to the set, and it's over
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
      text: `${e.coins} coins, ${e.stopped} stopped, ${[e.instrument ?? 'acoustic', ...(e.pedals ?? [])].join(' + ')}, `
        + `${e.layers ? `${e.layers} loop layer${e.layers === 1 ? '' : 's'}, ` : ''}${e.choice ?? 'no choice yet'}`,
    }));
    const buys = readBuys(storage).map((e) => ({ date: e.date, text: `bought the ${stockItem(e.id)?.name.toLowerCase() ?? e.id} for ${e.price}` }));
    document.getElementById('log').replaceChildren(...[...sets, ...buys].sort((a, b) => b.date.localeCompare(a.date)).map((e) => {
      const li = document.createElement('li');
      li.textContent = `${e.date.slice(0, 16).replace('T', ' ')}: ${e.text}`;
      return li;
    }));
  }

  document.getElementById('again').addEventListener('click', () => {
    if (logging) logChoice(storage, 'another');
    end.hidden = true;
    audio.stopBand();
    set = null;
    scene = createScene(pageSeed);
    if (bot) startBot();
    else screen = 'ready';
  });
  document.getElementById('stop').addEventListener('click', () => {
    if (logging) logChoice(storage, 'stop');
    end.hidden = true;
    audio.stopBand();
    screen = 'thanks';
    document.getElementById('thanks').hidden = false;
  });
  document.getElementById('shop').addEventListener('click', () => {
    if (logging) logChoice(storage, 'shop');
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
      choose(shop, target.at);
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
      get loop() { return heardLoop(); },
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
      // The loop: a recording moves on (and in a set, a finished one counts for the log), and the
      // notes due soon are scheduled with the band's; in the park, each rises from the loop pedal.
      const l = heardLoop();
      if (l && step(l, audio.now() - start) === 'layer' && !shop) setLayers++;
      const played = audio.update((from, to) => (l ? due(l, from, to) : []));
      if (set) for (const n of played) sceneLoopNote(scene, n.pitch, n.at - start);
      latency.reported = audio.reportedLatency();
      draw({
        screen: screen === 'thanks' || screen === 'over' ? 'playing' : screen,
        set, scene, keys: input.keys, t: set ? set.t : shop?.loop ? audio.now() - start : 0, bars: set ? set.t / BAR : skyBar,
        time: (now - t0) / 1000, still: reducedMotion.matches, flocks, gear, stomp: stomped, shop,
        loop: shop ? shop.loop : set ? loop : null, loopSaid,
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

- [ ] **Step 4: Check it**

Run: `node --check open-case/src/main.js && cd open-case && npm test`
Expected: no syntax error, and PASS, 200 tests.

- [ ] **Step 5: Commit**

```bash
git add open-case/src/main.js open-case/src/log.js open-case/test/log.test.js
git commit -m "Open Case: R and Backspace work the loop pedal in a set and in the shop; your notes are recorded, the loop plays and shows, it ends with the set, and the log counts its layers

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Say what's built, and check it in Chrome

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-09-28-open-case-design.md`, `docs/superpowers/specs/2026-09-28-open-case-shop-design.md`, `docs/superpowers/specs/2026-09-29-open-case-loop-pedal-design.md`

- [ ] **Step 1: The README**

In `README.md`'s Open Case section, make these edits.

In the intro, the sentences from "The coins you earn are saved" to the end of the paragraph become:

```markdown
The coins you earn are saved, and between sets a music shop sells five pedals, which you stomp on keys 2 to 6 while you play, four more instruments, and a loop pedal: R records 4 bars of your notes that play on under you, up to three layers, and Backspace takes the last one off. The design spec is `docs/superpowers/specs/2026-09-28-open-case-design.md`, the shop's is `docs/superpowers/specs/2026-09-28-open-case-shop-design.md`, and the loop pedal's is `docs/superpowers/specs/2026-09-29-open-case-loop-pedal-design.md`.
```

The sound check's line becomes:

```markdown
  - `?sound` is the sound check: the band with a switch per layer, and every instrument and pedal in the shop to try on the keys, the loop pedal too.
```

The tuning line becomes:

```markdown
- Tuning: the rules, the crowd, the tips and the feel are in `open-case/src/tuning.js`, and so are the park's sunset and background timings (`PARK`) and the shop's prices and pedal keys (`SHOP`), and the loop pedal's length, layers and allowance for early notes (`LOOP`). The sounds (the band, each instrument and each pedal, the loop's level and the safety before the speakers) are in `open-case/src/audio.js`, and a few view timings are in `scene.js` and `render.js`.
```

In the art line, `gear.lua` (you with each instrument, your pedals, the amp and the gear strip's icons) becomes `gear.lua` (you with each instrument, your pedals and the loop pedal, the amp and the gear strip's icons).

- [ ] **Step 2: The specs**

In `docs/superpowers/specs/2026-09-28-open-case-design.md`, after the line that begins `**Update (2026-09-28):** the music shop is built`, add a blank line and:

```markdown
**Update (2026-09-29):** the loop pedal is built; see `2026-09-29-open-case-loop-pedal-design.md`. R records 4 bars of your notes, which loop under you; the blue box by the crate is now the band's speaker.
```

In `docs/superpowers/specs/2026-09-28-open-case-shop-design.md`, make two edits.

In "What the build settled", the pedals' line becomes:

```markdown
- **Your pedals by the crate** are a row of little stompboxes in front of it, between the looper (the band's speaker since the loop pedal came) and the case. The amp stands to the left of the crate, behind the looper.
```

In "Not in this change", the loop pedal's line becomes:

```markdown
- The loop pedal (the next spec: `2026-09-29-open-case-loop-pedal-design.md`).
```

In `docs/superpowers/specs/2026-09-29-open-case-loop-pedal-design.md`, the status line becomes:

```markdown
**Status:** Nathan agreed the design in chat ("seems perfect!"), then reviewed this spec and its plan. Built from `docs/superpowers/plans/2026-09-29-open-case-loop-pedal.md`.
```

and before `## Not in this change`, add:

```markdown
## What the build settled

The plan's prototype settled a few things this spec left open:
- **The loop pedal stands just behind your row of pedals**, between them and the crate, under your foot. There was no room beside the row: the case is on one side and a listener's spot on the other. Its light is two pixels square, so red and green read at a glance.
- **The speaker** is the blue box with a handle on top and a dark cone.
- **The rack is wider**, and the chalkboard moved right to make room. The five pedals stand 20 pixels apart with the loop pedal last, 18 wide, and every price tag hangs clear of the next pedal.
- **The strip's loop slot** comes straight after the reverb's: the icon, "R", and three dots. The pigeons moved 26 pixels to the right to make room.
- **Looped notes rise faintly from just over the loop pedal**, higher notes a little higher. They drift up and to the left, away from your own notes, which drift right toward the crowd, and fade in 3 seconds.
- **The news over the strip:**
  - when R arms a recording: "loop recording" for the first layer, "layer 2" or "layer 3" after that;
  - "loop full";
  - "recording cancelled" (Backspace during a recording);
  - "layer removed";
  - "loop cleared".

  It shows one message at a time: the newer of the loop's news and a pedal stomp.
- **While a recording waits**, the light is red for the first half of each beat.
- **In the shop:**
  - the card's last line, while the loop pedal is chosen, is "R record   backspace undo   arrows choose   esc back";
  - its light on the rack shows the loop you're trying;
  - the band there is the electric piano alone, at about two thirds of its level in a set;
  - buying the pedal while you try it keeps your loop going.
- **An empty recording still counts as a layer.** Four bars with no notes take a layer, and Backspace takes it off.
- **The loop sits a little under you**, at 80% of your live level.
- **A safety before the speakers** keeps stacked loops from clipping. Measured offline at the default volume:
  - one hard four-note chord, clean, already peaks at −2.7 dB;
  - three layers of it, landing on the same beat you play it live, peaked at +9.3 dB.

  The safety passes everything below about −3 dB untouched, so the game's mix measured the same with it, and it rounds louder peaks off smoothly. That worst case, with the loop at 80%, now peaks at −0.2 dB even at full volume.
```

- [ ] **Step 3: Commit**

```bash
git add README.md docs/superpowers/specs/2026-09-28-open-case-design.md docs/superpowers/specs/2026-09-28-open-case-shop-design.md docs/superpowers/specs/2026-09-29-open-case-loop-pedal-design.md
git commit -m "Open Case: the README and specs say the loop pedal is built, and what the build settled

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 4 (controller): Check it in Chrome**

After the final review, serve the repo root and check it by eye and ear in Chrome. Set up the gear first, in the page's console, then reload:

```js
localStorage.setItem('open-case-gear', JSON.stringify({ owned: ['overdrive', 'chorus', 'tremolo', 'delay', 'reverb', 'loop', 'electric'], instrument: 'electric', on: ['chorus'] }));
```

In a set, at `open-case/?seed=1&coins=500`:
- R arms from the next bar line, and "loop recording" shows. The pedal's light blinks red, then goes solid red, then green, and the strip's first dot fills.
- A second layer over the first. Backspace takes it off ("layer removed"), then the first ("loop cleared").
- R with three layers says "loop full".
- Stomping the delay over the loop puts echoes on the loop.
- Looped notes rise faintly from the pedal.
- The title's third line.

At the set's end, at `open-case/?seed=3`, with the gear as above: record a layer, then press R at bar 57. At the end:
- `__openCase.loop.take` is `null`, and R during the fade does nothing;
- the end card's log (`?debug`) says "1 loop layer".

In the shop (the end card's Visit the shop, at `?coins=150`):
- choose the loop pedal: the band's electric piano plays;
- R records over it, and the rack's light follows;
- buy it while it records: the loop goes on;
- move off it: the band stops.

Where R does nothing:
- in a set before the loop pedal is yours: at `open-case/?seed=1&coins=0`, with `open-case-gear` cleared, no news shows and `__openCase.loop.take` stays `null`;
- in a bot set (`?bot=lick`);
- before the set's first note.

The sound, at `open-case/?sound`: R and Backspace over the band.

The loudest case, measured offline in the page's console: three layers of a hard four-note chord, landing on the same beat you play it live, at full volume, with no pedals.

```js
const { createAudio } = await import('./src/audio.js');
const { due, LOOP_LENGTH } = await import('./src/looper.js');
const RATE = 48000, SECS = 4;
let off;
globalThis.AudioContext = function () {
  off = new OfflineAudioContext(2, RATE * SECS, RATE);
  Object.defineProperty(off, 'state', { get: () => 'running' }); // it pauses for each update, but it's running as far as the game knows
  return off;
};
const m = new Map(), audio = createAudio({ get: (k) => m.get(k) ?? null, set: (k, v) => m.set(k, String(v)) });
audio.setVolume(1);
audio.start();
audio.setInstrument('electric');
audio.startBand(0);
const chord = [52, 59, 64, 67].map((pitch, i) => ({ at: 0.5 + i * 0.012, pitch, strength: 4, legato: false, len: 1.5 }));
const loop = { layers: [0, 1, 2].map(() => ({ from: -LOOP_LENGTH, notes: chord })), take: null }; // three layers, first time round at the band's start
chord.forEach((n, i) => audio.noteOn('k' + i, n.pitch, 4, n.at, false)); // and the same chord, live
for (let k = 1; k * 0.05 < SECS - 0.1; k++) {
  off.suspend(Math.round((k * 0.05 * RATE) / 128) * 128 / RATE).then(() => { audio.update((a, b) => due(loop, a, b)); off.resume(); });
}
audio.update((a, b) => due(loop, a, b));
const b = await off.startRendering();
let peak = 0; for (const c of [0, 1]) for (const v of b.getChannelData(c)) peak = Math.max(peak, Math.abs(v));
20 * Math.log10(peak); // the prototype: -0.2 dB; anything under 0 dB is fine
```

Nathan's ear has the final say on how it feels, and on the loop's level (`LOOP_LEVEL` in `audio.js`).
