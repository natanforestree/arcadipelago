# Open Case Art Repaint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repaint Open Case in the flat style Nathan approved, from one generated sprite sheet, and bring the park to life: a sunset over each set, drifting clouds, birds, a distant train, swaying trees, pigeons that scatter at loud notes, and listeners who breathe and nod.

**Architecture:** Aseprite Lua scripts in `art/open-case/` draw every picture from shared flat-style drawing code (`draw.lua` for the park, you and your things; `figures.lua` for people, reactions and birds). `sprites.lua` packs them into `open-case/assets/sprites.png` with `sprites.json`, which holds each frame's place and anchor and the park's layout data. In the game, `scene.js` stays pure and works out the park's life from the bar, the seed and the clocks. `render.js` draws the sheet's frames instead of rectangles, keeping the rules' positions. `assets.js` loads the sheet before the title shows. The rules, the crowd and the sound don't change.

**Tech Stack:** Plain ES modules and Canvas 2D, Node 22 `node --test` (no dependencies), Aseprite 1.3 in batch mode for the art scripts.

**Spec:** `docs/superpowers/specs/2026-09-28-open-case-art-design.md` (approved: "ready for the art repaint"). It sits on the game's design spec, `docs/superpowers/specs/2026-09-28-open-case-design.md`.

**Prototyped:** every file below was built and run before this plan was written, in a scratch copy of the repo: the art scripts, the sheet (154 frames, 22 KB, 39 colours, rebuilt byte for byte), and the game in Chrome at dusk, with a crowd, at night, with the pigeons scattering and a flock crossing. That prototype had 127 Open Case tests passing (98 before) and the site's 70. The code in each task is that prototype's code, so transcribe it exactly.

## Global Constraints

- Every commit message starts `Open Case: ` and ends with a blank line and then `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`, exactly that line, whatever model you are.
- Stage only the files your task names (`git add <paths>`), never `git add -A` or `git add .`.
- No new dependencies: plain ES modules, Node 22's `node --test`. Run the tests with `cd open-case && npm test`.
- Aseprite runs from the repo root: `/Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/<name>.lua`. The scripts are deterministic, so a second run leaves `git status` unchanged. Previews (`art/open-case/preview-*`) are git-ignored and never committed.
- Flat style: every area one solid colour from `art/open-case/palette.lua`, a base and at most one shadow per material, no outlines, no dithering, no half-clear pixels. The whole game's art stays within **64 colours** and **under 400 KB** (`sprites.png`, `sprites.json` and `icon.png` together).
- Nothing about the rules, the crowd or the sound changes, and the game's positions stay as they are: you sit at `CROWD.playerX` 136, passers-by walk with their feet at y 146 (`PATH_Y`), listeners stand at `CROWD.spots`, and coins land at `CASE` (161, 160). Notes float up from `GUITAR` (152, 128).
- Everything in the background moves slower and softer than the crowd, and nothing flashes in time with the music. Only two things move with the groove: the trees rustle on each bar's first beat, and hooked listeners (interest above 0.5) nod on the beat.
- With `prefers-reduced-motion`, the birds and the train don't appear, the clouds and the trees hold still, and the lamp doesn't flicker. The sunset still happens.
- Plain words in comments and messages, in the style of the surrounding code.

## Review Focus

These are the inputs the spec implies but doesn't spell out that are most likely to bite someone playing. Each has a test in the task that owns the code:

1. **The first frame's clock is a hair below zero.** `requestAnimationFrame`'s timestamp can come before the moment the game read `performance.now()`, and the prototype crashed on `you-idle--1`. Every frame index wraps through `frameOf`. Tests: Task 3's "frame counters wrap", and Task 4's sweep, which draws at `time = t * 1.3 - 0.01`.
2. **The art can't load** (offline, a 404, a blocked image). The page shows its "Something went wrong" note, not a blank canvas. Test: Task 5's "art that can't load is an error".
3. **A tab left in the background for an hour, then brought back.** The page clock jumps, and the sky must not fill with an hour's worth of flocks. Test: Task 3's "after the tab sleeps for an hour".
4. **A long, generous set.** More coins than the case has places for shows the case full, not an error or coins drawn outside it. Test: Task 4's "a case with more coins than it has places for".
5. **Listeners standing in the case, or off the screen.** The art's layout must keep every kind of listener, at every spot, clear of the case and inside the screen. Test: Task 2's "the art sits round the positions the rules use", which compares pixels.

## Decisions made while prototyping

Each fills in something the spec left open. The reviewer should hold the code to these:

- **Where you sit.** The style sample's layout doesn't match the game's, so you are drawn at the sample's pixels moved by (-6, +10) (`D.YOU`). That puts your crate over x 136 and your feet just behind the case, whose lining holds the landing point (161, 160). The style sample is now drawn at the game's layout too, so the two match.
- **The sky steps one band at a time.** Each stage change moves the seven bands one at a time, top first, every 2 bars, so the whole sky never changes at once. Stage k is complete at bar 15k, which gives bars 0, 15, 30, 45 and 60. The dusk ramp slides toward the horizon as three night colours come in above it (`D.stages()`). The rooftops and the train take the horizon band's stage, and each cloud takes the stage of its own band.
- **Unlit windows are invisible** (the roof's colour). They light one by one at their seeded bars.
- **Two clocks.** The sunset, the windows, the lamp, the stars, the train, the trees' rustle, the nods and the pigeons' scatter run on the set's clock (bars since your first note). The clouds, birds, trees' sway, breathing, lamp flicker and the pigeons' pecking run on the page's clock, so the title screen is live. The birds are seeded once per page (`?seed=N` fixes them).
- **Walking frames follow the distance walked** (one frame per 4 px). A slower walker steps more slowly, and the jogger fastest, as the spec's table asks.
- **The reactions are bubbles with a sign.** Each rule has one:

  | Rule | Sign in the bubble |
  |---|---|
  | repeat | a yawn's Zs |
  | offKey | a frown |
  | callback | a grin |
  | taste | two bouncing notes |
  | random | a question mark (the head tilt) |
  | silence | dots (drifting off) |
  | loud | a wince |
  | recognised | a tick (the nod) |

  A bubble is pale with a flat dark shadow, so it reads against the sun.
- **The pigeons scatter only when they're there.** A loud note while they're away or flying does nothing. Once they start walking back in, another loud note scatters them again.
- **The lamp doesn't flicker under reduced motion**, because a flicker is motion.
- **`?sky=N`** shows the park N bars into a set until a set starts, so the sunset can be checked without playing three minutes.
- **`palette.lua` returns the flat palette only.** Only the icon and the sample used the old 16-bit colours, and both are redrawn flat.
- **`crowd.js` exports `PATH_Y`**, so the art test can check that walkers pass behind you.
- **The HTML cards** (end, pause) take the palette's colours too.

## File map

| File | What it does |
|---|---|
| `art/open-case/palette.lua` (rewrite) | Every colour: the flat look, plus night sky, darker skin, the old man's brown |
| `art/open-case/draw.lua` (new) | The park, the sunset's stages, you, the looper, the case and coins, in the game's layout |
| `art/open-case/figures.lua` (new) | The four passers-by, the regular, the reactions, the pigeons and the birds |
| `art/open-case/style-sample.lua` (rewrite) | The approved still and GIF, drawn with the two files above |
| `art/open-case/icon.lua` (rewrite) | The tab icon, flat |
| `art/open-case/sprites.lua` (new) | Packs every frame into `open-case/assets/sprites.png` and writes `sprites.json` |
| `open-case/assets/sprites.png`, `sprites.json` (generated) | The sheet and its frame and layout data |
| `open-case/src/tuning.js` (append) | `PARK`: the sunset's and background's numbers |
| `open-case/src/scene.js` (rewrite) | The park's life, pure: sky stages, sun, windows, lamp, stars, train, clouds, birds, pigeons |
| `open-case/src/render.js` (rewrite) | Draws the sheet's frames |
| `open-case/src/assets.js` (new) | Loads the sheet |
| `open-case/src/main.js` (edit) | Loads the art first; seeds, reduced motion, `?sky`, loud notes to the pigeons |
| `open-case/src/crowd.js` (one line) | Exports `PATH_Y` |
| `open-case/index.html` (CSS) | The cards in the palette's colours |
| `open-case/test/png.js`, `art.test.js`, `assets.test.js` (new) | Reading PNGs; the art checks; the loader |
| `open-case/test/scene.test.js`, `render.test.js` (rewrite) | The park's life; the renderer |
| `README.md`, both Open Case specs | Say what's built |

---

### Task 1: The flat palette, the shared drawing code, the style sample and the tab icon

**Files:**
- Rewrite: `art/open-case/palette.lua`
- Create: `art/open-case/draw.lua`
- Create: `art/open-case/figures.lua`
- Rewrite: `art/open-case/style-sample.lua`
- Rewrite: `art/open-case/icon.lua`
- Regenerated: `art/open-case/icon.aseprite`, `open-case/icon.png`

**Interfaces:**
- Consumes: `art/site/lib.lua` (unchanged): `L.buffer`, `L.set`, `L.get`, `L.fillRect`, `L.rnd`, `L.blit`, `L.crop`, `L.scale`, `L.save`, `L.writeText`, `L.ensureDir`, `L.path`, `L.rgba`.
- Produces, for Task 2's `sprites.lua`:
  - From `draw.lua` (`local D = dofile(here .. "draw.lua")`):
    - fields `D.L`, `D.C`, `D.W`, `D.H`, `D.BANDS`, `D.SUN`, `D.LAMP`, `D.POOL`, `D.YOU`, `D.CASE`, `D.LOOPER`, `D.TRAIN_Y`, `D.CLOUDS`, `D.PX`;
    - helpers `D.stages()`, `D.band(y)`, `D.rect`, `D.oval`, `D.inOval`, `D.stamp`, `D.shadow`, `D.mirror(buf)`;
    - drawing functions `D.you(b, breath, strum)`, `D.sky(b, stage)`, `D.sun(b, cx, cy)`, `D.cloud(b, cx, cy, len, stage)`, `D.roofsBack(b, stage)`, `D.roofsFront(b, stage)`, `D.windows()`, `D.window(b, x, y)`, `D.train(b, x, bottom, stage, lit)`, `D.trees(b, frame)`, `D.ground(b)`, `D.path(b, lit)`, `D.lamp(b, state)`, `D.looper(b, red)`, `D.openCase(b)`, `D.caseCoin(b, x, y)`, `D.caseCoinSpots(n)`, `D.coin(b, x, y, f)`.
  - From `figures.lua`: `F.KINDS`, `F.REACTIONS`, `F.person(b, kind, x, feet, step, head)`, `F.oldMan(b, x, feet, step, head, grin, tip, regular)`, `F.reaction(b, rule, frame, x, y)`, `F.pigeon(b, pose, frame, x, y)`, `F.bird(b, frame, x, y)`.

There are no unit tests for Lua here. This task is checked by running the scripts, looking at what they draw, and rebuilding byte for byte. Task 2's art tests then check the sheet built from this code.

- [ ] **Step 1: Replace `art/open-case/palette.lua` with the flat palette**

```lua
-- Open Case's palette, the flat look after Nathan's reference picture: every area one solid colour, a
-- base and at most one shadow per material, no outlines, no dither. Pairs run shadow -> base. The
-- sprite sheet (sprites.lua), the style sample and the tab icon draw with these alone, and the whole
-- game's art stays within 64 colours (sprites.lua checks).
return {
  ink = "#1c1626", -- your black beanie and shirt, hair, eyes, the hat, the guitar's neck, the lamp post, the case's shell
  charcoal = "#3d3649", -- the lit side of your beanie and shirt, the old man's cap, the student's jeans
  sky = { "#2a1d4e", "#43286a", "#663276", "#93406f", "#c9566a", "#ec8458", "#f7b464" }, -- top -> horizon, at dusk
  night = { "#26275a", "#1b1b44", "#121230" }, -- the sky after dusk, as it darkens
  light = "#fff2cc", -- the sun, the lamp's glass, sneakers, whiskers, glints, stars, the reactions' bubbles
  yellow = { "#b0802c", "#fcd062" }, -- lit windows, the lamp, coins, the student's backpack
  leaf = { "#1d3b42", "#2e5d5c", "#45806e" }, -- trees in teal shadow, the hedge and its lit top, a pigeon's neck
  path = { "#3a2e48", "#564660", "#9c8480" }, -- joints and shadows, the stones, the pool of lamplight
  skin = { "#c08468", "#f2c69e" },
  skin2 = { "#7e4e38", "#b07650" }, -- darker skin
  blue = { "#2c3466", "#4660a6" }, -- the looper's body and its top, the student's hoodie
  pants = { "#2d4b2c", "#4c783a" }, -- your forest green pants
  wood = { "#45291f", "#7a4a2c", "#c68a50" }, -- dark wood, the crate, the guitar
  red = { "#74283a", "#b03c4a" }, -- the case's lining, the scarf, the jogger's top, the looper's first beat
  coat = { "#5e566e", "#8e8498" }, -- grey: the regular's coat, the commuter's suit, pigeons
  brown = { "#553a2e", "#86604a" }, -- the passing old man's coat
  go = "#6ed89a", -- the looper's light between beats, a listener's nod of recognition
}
```

- [ ] **Step 2: Create `art/open-case/draw.lua`**

```lua
-- Open Case's flat-style drawing, shared by the style sample (style-sample.lua) and the game's sprite
-- sheet (sprites.lua), so the two can't drift apart. Every area is one solid colour from the palette's
-- `flat` table, a base and at most one shadow per material, with no outlines and no dithering.
-- Everything is laid out on the game's 320x180 screen, round the positions the game's rules use: you
-- sit at x 136 (tuning.js CROWD.playerX), passers-by walk with their feet at y 146, listeners stand at
-- CROWD.spots, and coins land at (161, 160) (scene.js CASE).
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local L = dofile(here .. "../site/lib.lua") -- the site's buffer, noise and saving helpers
local C = dofile(here .. "palette.lua")
local D = { L = L, C = C, W = 320, H = 180 }
local W, H = D.W, D.H

-- Layout.
D.BANDS = { 0, 22, 42, 59, 74, 87, 99 } -- the first row of each band of sky; the sky ends at row 129
D.SUN = { 237, 104, 15 } -- the sun's centre at the start of a set, and its radius
D.LAMP = { 70, 50 } -- the lamp's head
D.POOL = { 70, 143, 40, 12 } -- the pool of lamplight on the path: centre and radii
D.YOU = { -6, 10 } -- where you sit, as an offset from the style sample's first layout
D.CASE = { 147, 156, 28 } -- the open case: its front-left corner and its width
D.LOOPER = { 112, 151 } -- the looper's top-left
D.TRAIN_Y = 92 -- the bottom of the distant train, which the nearer rooftops partly hide
-- The clouds: { centre x, bottom row, length, layer } (layer 1 drifts slowly, 2 faster).
D.CLOUDS = { { 60, 34, 40, 1 }, { 150, 20, 52, 1 }, { 298, 18, 26, 1 }, { 252, 48, 46, 2 }, { 112, 64, 28, 2 } }

-- The five stages of the sky over a set, from dusk to night: each the colours of its seven bands, top
-- to horizon. The dusk ramp slides down toward the horizon as the night colours come in above it.
function D.stages()
  local s, n = C.sky, C.night
  return {
    { s[1], s[2], s[3], s[4], s[5], s[6], s[7] },
    { n[1], s[1], s[2], s[3], s[4], s[5], s[6] },
    { n[2], n[1], s[1], s[2], s[3], s[4], s[5] },
    { n[3], n[2], n[1], s[1], s[2], s[3], s[4] },
    { n[3], n[3], n[2], n[2], n[1], s[1], s[2] },
  }
end

function D.band(y)
  local i = 1
  for k = 1, #D.BANDS do if y >= D.BANDS[k] then i = k end end
  return i
end

-------------------------------------------------------------------------------------------------
-- Helpers

local rect = L.fillRect
D.rect = rect

local function inOval(x, y, cx, cy, rx, ry)
  local dx, dy = (x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry
  return dx * dx + dy * dy <= 1
end
D.inOval = inOval

local function oval(b, cx, cy, rx, ry, c)
  for y = math.floor(cy - ry), math.ceil(cy + ry) do
    for x = math.floor(cx - rx), math.ceil(cx + rx) do
      if inOval(x, y, cx, cy, rx, ry) then L.set(b, x, y, c) end
    end
  end
end
D.oval = oval

-- Pixel maps: one character per pixel, "." left clear.
local PX = {
  k = C.ink, h = C.charcoal, w = C.light, y = C.yellow[2], Y = C.yellow[1],
  s = C.skin[2], S = C.skin[1], t = C.skin2[2], T = C.skin2[1],
  p = C.pants[2], P = C.pants[1],
  g = C.wood[3], G = C.wood[2], D = C.wood[1],
  r = C.red[2], R = C.red[1],
  c = C.coat[2], C = C.coat[1],
  b = C.brown[2], B = C.brown[1],
  u = C.blue[2], U = C.blue[1],
  l = C.leaf[3], e = C.leaf[2], o = C.go,
}
D.PX = PX

local function stamp(b, ox, oy, rows)
  for j, row in ipairs(rows) do
    for i = 1, #row do
      local ch = row:sub(i, i)
      if ch ~= "." then L.set(b, ox + i - 1, oy + j - 1, assert(PX[ch], "no colour for " .. ch)) end
    end
  end
end
D.stamp = stamp

-- A flat shadow on the ground.
local function shadow(b, cx, cy, rx, ry) oval(b, cx, cy, rx, ry, C.path[1]) end
D.shadow = shadow

-- A buffer's mirror image, left to right.
function D.mirror(src)
  local b = L.buffer(src.w, src.h)
  for y = 0, src.h - 1 do for x = 0, src.w - 1 do b[y][src.w - 1 - x] = src[y][x] end end
  return b
end

-------------------------------------------------------------------------------------------------
-- You, on the crate, playing: facing out, your head turned toward the case, the guitar across your
-- lap with its neck out to the right, one arm strumming over the body and one on the neck, the far
-- leg tucked back and the near one stretched down. Drawn in the style sample's first layout and moved
-- by D.YOU.

local FAR_LEG = { 139, 126, {
  "....PPPP",
  "...PPPP.",
  "...PPPP.",
  "...PPPP.",
  "..PPPP..",
  "..PPPP..",
  "..PPPP..",
  "..PPPP..",
  ".PPPP...",
  ".PPPP...",
  ".PPPP...",
  ".PPPP...",
  ".wwww...",
  "wwwwwww.",
  "wwwwwww.",
  "wwwwwww.",
} }
local NEAR_LEG = { 138, 121, {
  "..ppppppppppp...........",
  ".pppppppppppppp.........",
  "pppppppppppppppp........",
  "ppppppppppppppppp.......",
  "ppppppppppppppppp.......",
  "ppppppppppppppppp.......",
  ".PPPPPPPPPPPppppp.......",
  ".............pppp.......",
  ".............pppp.......",
  "..............pppp......",
  "..............pppp......",
  "..............pppp......",
  "...............pppp.....",
  "...............pppp.....",
  "...............pppp.....",
  "................pppp....",
  "................pppp....",
  "................wwww....",
  "...............wwwwwww..",
  "...............wwwwwwww.",
  "...............wwwwwwww.",
} }
local TORSO = { 132, 103, {
  "................",
  "....hhhh....hh..",
  "...kkkkk....khh.",
  ".kkkkkkkkkkkkkhh",
  ".kkkkkkkkkkkkkkh",
  "kkkkkkkkkkkkkkkh",
  "kkkkkkkkkkkkkkkh",
  "kkkkkkkkkkkkkkkh",
  "kkkkkkkkkkkkkkkh",
  "kkkkkkkkkkkkkkkh",
  "kkkkkkkkkkkkkkh.",
  "..kkkkkkkkkkkkh.",
  "..kkkkkkkkkkkkh.",
  "..kkkkkkkkkkkkh.",
  "..kkkkkkkkkkkkh.",
  "..kkkkkkkkkkkkh.",
  "..kkkkkkkkkkkkh.",
  "..kkkkkkkkkkkkh.",
  "..kkkkkkkkkkkkh.",
  "..kkkkkkkkkkkkh.",
} }
local HEAD = { 136, 92, {
  "...kkhhh....",
  ".kkkkkhhhh..",
  "kkkkkkkkhhh.",
  "kkkkkkkkkhh.",
  "hhhhhhhhhhhh",
  "kkSsssssss..",
  "kSSssssksss.",
  "kSSssssksss.",
  ".SSsssssssss",
  ".SSssssssss.",
  "..SSssssSs..",
  "...SSssss...",
  ".....SSS....",
  ".....SSS....",
} }
local GUITAR = { 126, 113, {
  "................gggggg....",
  "....ggggggg....gggggggg...",
  "...gggggggggg.gggggggggg..",
  "..gggggggggggggggggkkkggg.",
  ".ggggggggggggggggggkkkgggg",
  ".ggggggggggggggggggkkkgggg",
  "gggggDDggggggggggggggggggg",
  "gggggDDgggggggggggggggggg.",
  "GggggDDgggggggggggggggggg.",
  "GggggDDggggggggggggggggg..",
  ".GGgggggggggggggGGGGGG....",
  ".GGggggggggggG............",
  "..GGGGGGGGGGG.............",
  "...GGGGGGGGG..............",
  ".....GGGGG................",
} }
-- the neck in steps, rising to the right: { x0, x1, y }, two pixels thick
local NECK = { { 151, 154, 115 }, { 155, 158, 114 }, { 159, 162, 113 }, { 163, 166, 112 }, { 167, 170, 111 }, { 171, 174, 110 }, { 175, 177, 109 } }
local HEADSTOCK = { 176, 106, {
  "...k.k.",
  "..DDDDD",
  ".DDDDDD",
  "DDDDDD.",
  "DDD....",
} }
local FRET_ARM = { 144, 106, {
  "..hhh...........",
  ".hhhhh..........",
  ".kkhhhh.........",
  "..kkkhhh........",
  "...kkkhhh.......",
  "....kkkkhhsssss.",
  ".....kkkksssssss",
  "........SSSSSSS.",
} }
local FRET_HAND = { 161, 110, {
  ".ss.",
  "ssss",
  "ssss",
  "ssss",
  ".SS.",
} }
-- The strumming arm: the upper arm, then the forearm and hand, which move with each strum.
local STRUM_UPPER = { 124, 105, {
  "..........hhhh...",
  "........hhhhkk...",
  "......hhhhkkkk...",
  "....hhhhkkkk.....",
  "..hhhhkkkk.......",
  ".hhhkkkkk........",
  ".hkkkkkkk........",
} }
local STRUM_HAND = { 124, 112, {
  "..kssskk.........",
  "...Sssssk........",
  "....Sssss........",
  "......Sssss......",
  "........Ssssss...",
  "..........Sssssss",
  "...........ssssss",
  "............ssss.",
} }

-- The crate you sit on, on its shadow (in the sample's first layout, like the parts above).
local function crate(b, dx, dy)
  shadow(b, 145 + dx, 141.5 + dy, 19, 2.5)
  rect(b, 132 + dx, 128 + dy, 151 + dx, 141 + dy, C.wood[2])
  rect(b, 132 + dx, 132 + dy, 151 + dx, 132 + dy, C.wood[1])
  rect(b, 132 + dx, 137 + dy, 151 + dx, 137 + dy, C.wood[1])
  rect(b, 138 + dx, 129 + dy, 145 + dx, 130 + dy, C.wood[1]) -- the hand-hold
end

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
  part(FRET_ARM)
  for _, n in ipairs(NECK) do rect(b, n[1] + dx, n[3] + dy, n[2] + dx, n[3] + 1 + dy, C.ink) end
  part(HEADSTOCK)
  part(FRET_HAND)
  part(STRUM_UPPER)
  part(STRUM_HAND, strum or 0)
end

-- Where you are, as a mask, so the lit windows keep clear of you.
local youMask = L.buffer(W, H)
D.you(youMask)
local function nearYou(x, y)
  for yy = y - 2, y + 3 do
    for xx = x - 2, x + 3 do if L.get(youMask, xx, yy) then return true end end
  end
  return false
end

-------------------------------------------------------------------------------------------------
-- The park, back to front

-- The sky's bands in one stage's colours.
function D.sky(b, stage)
  for y = 0, 129 do rect(b, 0, y, W - 1, y, stage[D.band(y)]) end
end

function D.sun(b, cx, cy) oval(b, cx, cy, D.SUN[3], D.SUN[3], C.light) end

-- A long flat cloud in steps, flat along the bottom where the sun lights it: a tone lighter than its
-- band of sky, its underside lighter again, in the given stage's colours.
function D.cloud(b, cx, cy, len, stage)
  local k = D.band(cy)
  local body, lit = stage[math.min(#stage, k + 1)], stage[math.min(#stage, k + 3)]
  local function step(y0, y1, l, r, c) rect(b, math.floor(cx + l * len), y0, math.floor(cx + r * len), y1, c) end
  step(cy - 7, cy - 6, -0.3, 0.05, body)
  step(cy - 5, cy - 4, -0.55, 0.35, body)
  step(cy - 3, cy - 2, -0.85, 0.7, body)
  step(cy - 1, cy, -1, 0.9, lit)
end

-- The far rooftops, hand-placed so each figure's face sits against a roof: a paler row behind, then
-- the nearer one with its windows, a water tower and chimneys. { x0, x1, top }
local BACK = { { 0, 22, 84 }, { 40, 60, 80 }, { 100, 124, 86 }, { 108, 112, 72 }, { 180, 202, 82 }, { 262, 282, 78 }, { 300, 319, 86 } }
local FRONT = {
  { 0, 16, 100 }, { 17, 36, 94 }, { 37, 54, 104 }, { 55, 76, 96 }, { 77, 94, 92 }, { 95, 114, 101 },
  { 115, 128, 96 }, { 129, 158, 88 }, { 159, 178, 99 }, { 179, 198, 94 }, { 199, 220, 102 },
  { 221, 254, 106 }, { 255, 272, 97 }, { 273, 292, 93 }, { 293, 319, 100 },
}

function D.roofsBack(b, stage)
  for _, r in ipairs(BACK) do rect(b, r[1], r[3], r[2], 125, stage[4]) end
end

function D.roofsFront(b, stage)
  local c = stage[3]
  for _, r in ipairs(FRONT) do rect(b, r[1], r[3], r[2], 125, c) end
  rect(b, 80, 81, 90, 88, c) -- the water tower
  rect(b, 82, 79, 88, 80, c)
  rect(b, 81, 89, 82, 91, c); rect(b, 88, 89, 89, 91, c)
  rect(b, 30, 88, 32, 93, c) -- chimneys
  rect(b, 263, 93, 265, 96, c)
end

-- The windows in the nearer rooftops, each 2x2 from its top-left: { x, y }. They light one by one.
function D.windows()
  local out = {}
  for i, r in ipairs(FRONT) do
    for wy = r[3] + 4, 116, 6 do
      for wx = r[1] + 3, r[2] - 4, 5 do
        if L.rnd(wx, wy, 32 + i) < 0.2 and not nearYou(wx, wy) then out[#out + 1] = { wx, wy } end
      end
    end
  end
  return out
end

function D.window(b, x, y) rect(b, x, y, x + 1, y + 1, C.yellow[2]) end

-- The distant train, three cars in the nearer rooftops' colour, its bottom at `bottom`; `lit`: its
-- windows are lit.
function D.train(b, x, bottom, stage, lit)
  local c = stage[3]
  for car = 0, 2 do
    local x0 = x + car * 20
    rect(b, x0, bottom - 5, x0 + 18, bottom, c)
    rect(b, x0 + 1, bottom - 6, x0 + 17, bottom - 6, c)
    if lit then for wx = x0 + 3, x0 + 15, 3 do rect(b, wx, bottom - 4, wx + 1, bottom - 3, C.yellow[2]) end end
  end
  rect(b, x + 60, bottom - 3, x + 61, bottom, c) -- the front of the engine, sloped
  L.set(b, x + 60, bottom - 4, c)
end

-- The two trees, in teal shadow. frame: 0 at rest, 1 their crowns leaning a pixel right, 2 a rustle
-- (the light catching the leaves differently).
local TREES = {
  { 26, 70, { { 4, -16, 15 }, { 0, 0, 24 }, { -14, 10, 16 }, { 16, 8, 17 } } },
  { 300, 62, { { 8, -18, 14 }, { 0, 0, 24 }, { -18, 12, 16 } } },
}
function D.trees(b, frame)
  for _, t in ipairs(TREES) do
    local tx, ty = t[1], t[2]
    rect(b, tx - 3, ty, tx + 3, 124, C.wood[1])
    for _, c in ipairs(t[3]) do
      local cx, cy, r = tx + c[1], ty + c[2], c[3]
      if frame == 1 and c[2] < 0 then cx = cx + 1 end
      local lx, ly = cx - r * 0.3, cy - r * 0.35
      if frame == 2 then lx, ly = lx + 1.5, ly + 1 end
      for y = math.floor(cy - r), math.ceil(cy + r) do
        for x = math.floor(cx - r), math.ceil(cx + r) do
          if inOval(x, y, cx, cy, r, r) then
            L.set(b, x, y, inOval(x, y, lx, ly, r, r) and C.leaf[2] or C.leaf[1])
          end
        end
      end
    end
  end
end

-- The hedge, scalloped along its lit top, and the paved path in rows that widen toward you. lit: the
-- pool of lamplight only (the lamp's on).
local PATH_ROWS = { 130, 134, 139, 145, 152, 160, 169, 180 }
function D.ground(b)
  for x = 0, W - 1 do
    local u = ((x + 3) % 14 - 7) / 7
    local top = 118 - math.floor(3 * math.sqrt(math.max(0, 1 - u * u)))
    rect(b, x, top, x, top + 1, C.leaf[3])
    rect(b, x, top + 2, x, 129, C.leaf[2])
  end
  D.path(b, false)
end

function D.path(b, lit)
  local px, py, rx, ry = D.POOL[1], D.POOL[2], D.POOL[3], D.POOL[4]
  for r = 1, #PATH_ROWS - 1 do
    local y0, y1 = PATH_ROWS[r], PATH_ROWS[r + 1] - 1
    local sw = 10 + r * 3
    for y = y0, y1 do
      for x = 0, W - 1 do
        local sx = x + (r % 2) * math.floor(sw / 2)
        local joint = (y == y1) or (sx % sw == 0)
        if not lit then
          b[y][x] = joint and C.path[1] or C.path[2]
        elseif inOval(x, y, px, py, rx, ry) then
          b[y][x] = joint and C.path[2] or C.path[3]
        end
      end
    end
  end
  if not lit then rect(b, 0, 130, W - 1, 130, C.path[1]) end
end

-- The lamp post. state: "off", "on" or "flicker" (on, but dimmed for a moment).
function D.lamp(b, state)
  local x, y = D.LAMP[1], D.LAMP[2]
  rect(b, x - 1, y + 7, x, 131, C.ink)
  rect(b, x - 3, 128, x + 2, 132, C.ink)
  rect(b, x - 2, y - 3, x + 1, y - 3, C.ink)
  rect(b, x - 4, y - 2, x + 3, y - 2, C.ink)
  local glass, core = C.coat[1], C.coat[2]
  if state == "on" then glass, core = C.yellow[2], C.light
  elseif state == "flicker" then glass, core = C.yellow[1], C.yellow[2] end
  rect(b, x - 3, y - 1, x + 2, y + 5, glass)
  rect(b, x - 2, y, x + 1, y + 4, core)
  rect(b, x - 3, y + 6, x + 2, y + 6, C.ink)
end

-------------------------------------------------------------------------------------------------
-- Things by your crate

-- The looper: its body, the switch, and its light, red on each bar's first beat.
function D.looper(b, red)
  local x, y = D.LOOPER[1], D.LOOPER[2]
  shadow(b, x + 5, y + 5.5, 7, 1.5)
  rect(b, x, y, x + 10, y + 5, C.blue[1])
  rect(b, x, y, x + 10, y, C.blue[2])
  rect(b, x + 6, y - 2, x + 8, y - 1, C.ink)
  rect(b, x + 2, y + 2, x + 3, y + 3, red and C.red[2] or C.go)
end

-- The open case, empty: its lid up behind and the red lining.
function D.openCase(b)
  local x, y, w = D.CASE[1], D.CASE[2], D.CASE[3]
  shadow(b, x + w / 2 + 0.5, y + 8.5, w / 2 + 1, 2.5)
  for yy = y - 8, y - 1 do
    local lean = math.floor((y - yy) / 2)
    rect(b, x + 2 + lean, yy, x + w - 2 + lean, yy, C.ink)
    if yy > y - 8 and yy < y - 1 then rect(b, x + 4 + lean, yy, x + w - 4 + lean, yy, C.red[1]) end
  end
  rect(b, x, y, x + w, y + 8, C.ink)
  rect(b, x + 2, y + 1, x + w - 2, y + 5, C.red[2])
  rect(b, x + 2, y + 1, x + w - 2, y + 1, C.red[1])
end

-- One coin lying in the case, from its top-left.
function D.caseCoin(b, x, y)
  rect(b, x, y, x + 2, y + 1, C.yellow[2])
  L.set(b, x + 2, y + 1, C.yellow[1])
end

-- Where the case's coins lie, in the order they land: { x, y } top-lefts, filling the lining in rows,
-- then heaping up a pixel at a time.
function D.caseCoinSpots(n)
  local x, y, w = D.CASE[1], D.CASE[2], D.CASE[3]
  local out = {}
  for i = 0, n - 1 do
    local layer = i // 16
    local k = i % 16
    local cx = x + 3 + (k * 7 + layer * 3) % (w - 6)
    local cy = y + 2 + (k % 3) - math.min(layer, 3)
    out[#out + 1] = { cx, cy }
  end
  return out
end

-- A coin, thrown: face-on and side-on by turns, so it spins. Centred on (x, y).
function D.coin(b, x, y, f)
  if f % 2 == 0 then
    stamp(b, x - 2, y - 2, { ".yy.", "ywyy", "yyyY", ".YY." })
  else
    stamp(b, x - 1, y - 2, { "yy", "wy", "yY", "YY" })
  end
end

return D
```

- [ ] **Step 3: Create `art/open-case/figures.lua`**

```lua
-- Open Case's people and birds in the flat style, shared by the style sample and the sprite sheet: the
-- four passers-by (the jogger, the old man, the student and the commuter), the regular (the old man in
-- the red scarf, drawn by the Regulars feature), the reactions over their heads, the pigeons by your
-- case and the birds that cross the sky.
--
-- A figure is drawn facing left, toward you from the right, with its feet at (x, feet); the sheet
-- mirrors it to face right. It's 16 pixels across and 46 tall from the top of its head (row 0) to its
-- feet (row 45). Its legs are drawn as lines from the hips, so every figure walks the same way; its
-- head and body are pixel maps.
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local D = dofile(here .. "draw.lua")
local L, C, rect, stamp = D.L, D.C, D.rect, D.stamp
local F = {}

F.KINDS = { "jogger", "oldman", "student", "commuter" }

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

-------------------------------------------------------------------------------------------------
-- The passers-by. Each: its hips' row, its legs' colours { near, far, shoe, width }, and its head
-- (rows 0-13) and body (from row 14) as pixel maps.

local FACE = { -- a clean face under each kind's hair, rows 5-13 ("H" is the kind's hair)
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

local K = {}

K.jogger = {
  hip = 27, legs = { "s", "S", "w", 3 }, hair = "k",
  head = {
    "................",
    "................",
    "......kkkkk.....",
    "....kkkkkkkkk...",
    "...kkkkkkkkkkk..",
    "....wwwwwwwwkk..",
  },
  body = {
    "....rrrrrrr.....",
    "...rrrrrrrrrR...",
    "..rrrrrrrrrrRR..",
    "..rrrrrrrrrrRR..",
    "..srrrrrrrrrRs..",
    "..srrrrrrrrrRs..",
    "..SrrrrrrrrrRS..",
    "..SrrrrrrrrrRS..",
    "..SrrrrrrrrrRS..",
    "..ssrrrrrrrrRss.",
    "...rrrrrrrrrR...",
    "...kkkkkkkkkk...",
    "...kkkkkkkkkk...",
    "...kkkkkkkkkk...",
    "...kkkkk.kkkk...",
  },
}

K.student = {
  hip = 30, legs = { "h", "k", "w", 3 }, hair = "k", skin = true,
  head = {
    "................",
    "......kkkk......",
    "....kkkkkkkk....",
    "...kkkkkkkkkk...",
    "...hhhhhhhhhkk..", -- headphones' band
    "....ttttttkkkk..",
  },
  face = {
    "....ttttttkkk...",
    "...tktttttThhk..",
    "..ttttttttThhk..",
    "...tttttttThh...",
    "...ttTttttT.....",
    "....tttttT......",
    ".....TTTT.......",
    "......TT........",
  },
  body = {
    "...uuuuuuuuUU...",
    "..uuuuuuuuuUUY..",
    "..uuuuuuuuuUUYy.",
    "..uuuuuuuuuUUYy.",
    "..uuuuuuuuuUUYy.",
    "..uuuuuuuuuUUYy.",
    "..uuuuuuuuuUUYy.",
    "..tuuuuuuuuUUYy.",
    "..tuuuuuuuuUUYy.",
    "..TuuuuuuuuUUY..",
    "..TUUUUUUUUUU...",
    "...uuuuuuuuuU...",
    "...UUUUUUUUUU...",
    "...hhhhhhhhhh...",
    "...hhhhhhhhhh...",
    "...hhhhh.hhhh...",
    "...hhhh...hhh...",
  },
}

K.commuter = {
  hip = 32, legs = { "C", "k", "k", 3 }, hair = "D",
  head = {
    "................",
    "................",
    "................",
    ".....DDDDDD.....",
    "....DDDDDDDDD...",
  },
  body = {
    "....cwrwcc......",
    "...ccwrwcccCC...",
    "..cccwrwccccCC..",
    "..cccwrwccccCC..",
    "..ccccrcccccCC..",
    "..ccccrcccccCC..",
    "..cccccckcccCC..",
    "..ccccccccccCC..",
    "..ccccccccccCC..",
    "..ccccccckccCC..",
    "..ccccccccccCC..",
    "..ssccccccccCs..",
    "..ssccccccccCs..",
    "..DDDDcccccccC..",
    "..DDDDDccccccC..",
    "..DDDDDCCCCCCC..",
    "..DDDDDCCCCCC...",
    "...CCCCC.CCCC...",
    "...CCCC...CCC...",
  },
}

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

-- A passer-by with their feet at (x, feet), facing left. step: 0-3 through the walk (nil standing);
-- head: 0, 1 settled (breathing) or 2 nodding.
function F.person(b, kind, x, feet, step, head)
  if kind == "oldman" then return F.oldMan(b, x, feet, step, head) end
  local k = K[kind]
  local ox, top = math.floor(x + 0.5) - 8, feet - 45
  local s = STRIDE[step or "stand"]
  local bob = s[3]
  local near, far, shoe, wide = D.PX[k.legs[1]], D.PX[k.legs[2]], D.PX[k.legs[3]], k.legs[4]
  D.shadow(b, ox + 8, feet + 0.5, 9, 2.5)
  leg(b, ox + 4, top + k.hip + bob, ox + 4 + s[2][1], feet - s[2][2], wide, far, shoe)
  leg(b, ox + 8, top + k.hip + bob, ox + 8 + s[1][1], feet - s[1][2], wide, near, shoe)
  stamp(b, ox, top + 14 + bob, k.body)
  local hx, hy = ox - (head == 2 and 1 or 0), top + bob + ((head or 0) > 0 and 1 or 0)
  local face = k.face or FACE
  local rows = {}
  for i, r in ipairs(face) do rows[i] = r:gsub("H", k.hair) end
  stamp(b, hx, hy + 14 - #rows, rows)
  stamp(b, hx, hy, k.head)
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

- [ ] **Step 4: Replace `art/open-case/style-sample.lua` with the version that draws with the shared code**

```lua
-- Open Case's style sample: the look Nathan approved, drawn with the game's own drawing code
-- (draw.lua and figures.lua), so the sample and the game can't drift apart. The park at dusk at
-- 320x180 with the lamp lit, you on your crate with the guitar, the open case with a few coins, the
-- looper, and the regular (the old man in the red scarf) listening at the right-hand spot. And a short
-- GIF of him walking in, nodding, and grinning as his coin arcs into the case. Run from the repo root:
--   aseprite -b --script art/open-case/style-sample.lua
-- Writes art/open-case/preview-style.png (the still at 3x), preview-style-1x.png and
-- preview-oldman.gif (at 3x). Previews aren't committed.
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local D = dofile(here .. "draw.lua")
local F = dofile(here .. "figures.lua")
local L, C = D.L, D.C
local W, H = D.W, D.H
local DUSK = D.stages()[1]
local SPOT = { 226, 150 } -- the right-hand listener's spot (tuning.js CROWD.spots)

local function park()
  local b = L.buffer(W, H)
  D.sky(b, DUSK)
  D.sun(b, D.SUN[1], D.SUN[2])
  for _, cl in ipairs(D.CLOUDS) do D.cloud(b, cl[1], cl[2], cl[3], DUSK) end
  D.roofsBack(b, DUSK)
  D.roofsFront(b, DUSK)
  for _, w in ipairs(D.windows()) do D.window(b, w[1], w[2]) end
  D.trees(b, 0)
  D.ground(b)
  D.path(b, true)
  D.lamp(b, "on")
  return b
end
local base = park()

-- A glint on the case's first coin.
local function glint(b)
  local s = D.caseCoinSpots(1)[1]
  local x, y = s[1] + 1, s[2]
  for _, d in ipairs({ { 0, -1 }, { -1, 0 }, { 0, 0 }, { 1, 0 }, { 0, 1 } }) do L.set(b, x + d[1], y + d[2], C.light) end
end

local function scene(manX, step, head, grin, tip, coins, shine, beat)
  local b = L.buffer(W, H)
  L.blit(b, base, 0, 0)
  D.you(b, 0, 0)
  D.looper(b, beat)
  D.openCase(b)
  for _, s in ipairs(D.caseCoinSpots(coins)) do D.caseCoin(b, s[1], s[2]) end
  if shine then glint(b) end
  if manX then F.oldMan(b, manX, SPOT[2], step, head, grin, tip, true) end
  return b
end

-- The still.
local still = scene(SPOT[1], nil, 0, true, false, 5, true)
L.save(still, nil, "art/open-case/preview-style-1x.png")
L.save(L.scale(still, 3), nil, "art/open-case/preview-style.png")

-- The GIF: walking in, nodding, grinning, the coin arcing into the case. Cropped round the action.
local CROP = { 110, 80, 200, 100 }
local frames = {}
local function add(b, ms)
  frames[#frames + 1] = { L.scale(L.crop(b, CROP[1], CROP[2], CROP[3], CROP[4]), 3), ms }
end
for f = 0, 11 do add(scene(292 - f * 5.5, f % 4, 0, false, false, 4, false, f % 6 == 0), 120) end
for f = 0, 3 do add(scene(SPOT[1], nil, f % 2 == 0 and 2 or 0, false, false, 4, false), 180) end
add(scene(SPOT[1], nil, 0, true, false, 4, false), 400)
local from, to = { SPOT[1] - 12, SPOT[2] - 26 }, { 161, 159 } -- his hand, then where coins land (scene.js CASE)
for f = 0, 7 do
  local b = scene(SPOT[1], nil, 0, true, true, 4, false)
  local k = f / 7
  D.coin(b, math.floor(from[1] + (to[1] - from[1]) * k + 0.5), math.floor(from[2] + (to[2] - from[2]) * k - math.sin(math.pi * k) * 18 + 0.5), f)
  add(b, 70)
end
add(scene(SPOT[1], nil, 0, true, false, 5, true), 150)
add(scene(SPOT[1], nil, 0, true, false, 5, false), 150)
add(scene(SPOT[1], nil, 0, true, false, 5, true), 900)

local fw, fh = frames[1][1].w, frames[1][1].h
local spr = Sprite(fw, fh, ColorMode.RGB)
for _ = 2, #frames do spr:newEmptyFrame() end
for i, fr in ipairs(frames) do
  local img = Image(fw, fh, ColorMode.RGB)
  for y = 0, fh - 1 do
    for x = 0, fw - 1 do
      local c = fr[1][y][x]
      if c then img:drawPixel(x, y, L.rgba(c)) end
    end
  end
  spr.frames[i].duration = fr[2] / 1000
  spr:newCel(spr.layers[1], i, img, Point(0, 0))
end
L.ensureDir("art/open-case/preview-oldman.gif")
spr:saveCopyAs(L.path("art/open-case/preview-oldman.gif"))
spr:close()
print("style sample: preview-style.png, preview-style-1x.png, preview-oldman.gif (" .. #frames .. " frames)")
```

- [ ] **Step 5: Replace `art/open-case/icon.lua` with the flat icon**

```lua
-- Open Case's 48x48 tab icon, in the game's flat style: the open guitar case on the paving at dusk,
-- coins in its red lining and a note floating up, the low sun behind the rooftops. Flat colour from
-- the palette's `flat` table, no outlines, no dithering. Run from the repo root:
--   aseprite -b --script art/open-case/icon.lua
-- Writes art/open-case/icon.aseprite and open-case/icon.png.
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local L = dofile(here .. "../site/lib.lua")
local C = dofile(here .. "palette.lua")
local N = 48
local b = L.buffer(N, N)

-- A tile with rounded corners.
local function inside(x, y)
  local cx, cy = math.min(math.max(x, 6), 41), math.min(math.max(y, 6), 41)
  return (x - cx) ^ 2 + (y - cy) ^ 2 <= 36
end
local function put(x, y, c) if inside(x, y) then L.set(b, x, y, c) end end
local function rect(x0, y0, x1, y1, c) for y = y0, y1 do for x = x0, x1 do put(x, y, c) end end end

-- the sky in flat bands, dusk purple down to the glow, the sun, the rooftops, then the paving
local BANDS = { 0, 7, 13, 18, 22, 26, 29 }
for i, top in ipairs(BANDS) do rect(0, top, N - 1, (BANDS[i + 1] or 32) - 1, C.sky[i]) end
for y = 20, 31 do
  for x = 28, 42 do
    if (x + 0.5 - 35) ^ 2 + (y + 0.5 - 28) ^ 2 < 36 then put(x, y, C.light) end
  end
end
for _, r in ipairs({ { 0, 26, 9 }, { 10, 24, 17 }, { 18, 27, 25 }, { 26, 29, 33 }, { 34, 25, 40 }, { 41, 27, 47 } }) do
  rect(r[1], r[2], r[3], 31, C.sky[3])
end
put(13, 27, C.yellow[2]); put(22, 29, C.yellow[2]); put(37, 28, C.yellow[2])
for y = 32, N - 1 do
  for x = 0, N - 1 do
    local row = math.floor((y - 32) / 5)
    local sx = x + (row % 2) * 5
    put(x, y, ((y - 32) % 5 == 4 or sx % 10 == 0) and C.path[1] or C.path[2])
  end
end

-- the case: its lid up behind, the shell, the red lining with coins, on its shadow
rect(6, 39, 42, 40, C.path[1])
for y = 19, 27 do
  local lean = (27 - y) // 2
  rect(9 + lean, y, 39 + lean, y, C.ink)
  if y > 19 and y < 27 then rect(11 + lean, y, 37 + lean, y, C.red[1]) end
end
rect(6, 28, 41, 38, C.ink)
rect(8, 29, 39, 35, C.red[2])
rect(8, 29, 39, 29, C.red[1])
for _, c in ipairs({ { 11, 32 }, { 16, 31 }, { 22, 33 }, { 27, 31 }, { 33, 32 }, { 19, 34 } }) do
  rect(c[1], c[2], c[1] + 2, c[2] + 1, C.yellow[2])
  put(c[1] + 2, c[2] + 1, C.yellow[1])
end
put(23, 32, C.light); put(22, 33, C.light); put(24, 33, C.light)

-- a note floating up from it
rect(14, 12, 16, 14, C.light)
rect(17, 5, 17, 14, C.light)
rect(18, 5, 19, 6, C.light)
put(20, 7, C.light)

L.save(b, "art/open-case/icon.aseprite", "open-case/icon.png")
print("icon: open-case/icon.png")
```

- [ ] **Step 6: Run both scripts**

Run: `for s in style-sample icon; do /Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/$s.lua; done`
Expected output:
```
style sample: preview-style.png, preview-style-1x.png, preview-oldman.gif (28 frames)
icon: open-case/icon.png
```

- [ ] **Step 7: Look at the results**

Open `art/open-case/preview-style.png` (the still at 3x) and `open-case/icon.png` with the Read tool. Expected:
- The park at dusk, with a banded purple-to-orange sky, the low sun behind the rooftops, lit windows, two teal trees, the scalloped hedge, and the paved path with the pool of lamplight on the left.
- You on the crate in a black beanie, a black shirt and green pants, the guitar's neck out to the right.
- The looper by your crate, and the open case to your right with 5 coins and a glint.
- The old man in the top hat and red scarf at the right, grinning.
- The icon: a red-lined case with coins on the paving under a banded dusk sky, and a pale note above it.

- [ ] **Step 8: Rebuild and check it's byte for byte**

Run: `md5 -q art/open-case/icon.aseprite open-case/icon.png; /Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/icon.lua; md5 -q art/open-case/icon.aseprite open-case/icon.png; git status --short`
Expected: the same two checksums both times, and `git status` lists the five scripts and the two icon files but no `preview-*` files (they're ignored).

- [ ] **Step 9: Commit**

```bash
git add art/open-case/palette.lua art/open-case/draw.lua art/open-case/figures.lua art/open-case/style-sample.lua art/open-case/icon.lua art/open-case/icon.aseprite open-case/icon.png
git commit -m "Open Case: the flat style's drawing code, shared by the style sample and the game, and a flat tab icon

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: The sprite sheet, and the tests that check it

**Files:**
- Create: `art/open-case/sprites.lua`
- Generated: `open-case/assets/sprites.png`, `open-case/assets/sprites.json`
- Create: `open-case/test/png.js`
- Create: `open-case/test/art.test.js`
- Modify: `open-case/src/crowd.js` (one line: export `PATH_Y`)

**Interfaces:**
- Consumes: Task 1's `draw.lua` and `figures.lua` (the names listed there); `KINDS` from `crowd.js`; `CROWD` from `tuning.js`; `CASE` from `scene.js` (already exported).
- Produces `open-case/assets/sprites.json`, whose fields every later task reads:

  | Field | What it holds |
  |---|---|
  | `frames` | `{ name: [x, y, w, h, ax, ay] }`. A frame drawn at (x, y) puts its top-left at (x - ax, y - ay). The park's layers and your things are drawn at (0, 0); people and pigeons by their feet; the sun, clouds, coins and birds by their centres; reactions by their tail's tip. |
  | `sky` | 5 stages of 7 colours |
  | `bands` | The 7 bands' first rows |
  | `skyBottom` | 129 |
  | `sun` | `[237, 104, 15]` |
  | `clouds` | `[[x, y, layer]]` (5 clouds) |
  | `windows` | `[[x, y]]` |
  | `stars` | `[[x, y]]` (10) |
  | `trainY` | 92 |
  | `caseCoins` | `[[x, y]]` (60) |
  | `feet` | `{ you: 151, looper: 157, case: 165 }` |
  | `colors` | `{ ink, charcoal, light, gold, goldDark, grey, greyDark, red, go, night }` |
  | `palette` | Every colour, at most 64 |

  Frame names:
  - The park: `sun`, `cloud-<i>-<stage>`, `roofs-back-<stage>`, `roofs-front-<stage>`, `train-<stage>`, `trees-<0..2>`, `ground`, `pool`, `lamp-off`, `lamp-on`, `lamp-flicker`.
  - You and your things: `you-idle-<0..1>`, `you-strum-<0..2>`, `looper-<0..1>`, `case`, `case-coin`, `coin-<0..1>`.
  - People: `<kind>-walk-<0..3>-<left|right>`, `<kind>-stand-<0..1>-<left|right>`, `<kind>-nod-<0..1>-<left|right>`.
  - Reactions: `react-<rule>-<0..1>`.
  - Birds: `pigeon-<peck|walk|fly>-<0..1>-<left|right>`, `bird-<0..1>`.
- Produces `export const PATH_Y = 146;` in `crowd.js`.

- [ ] **Step 1: Export the path's row from `open-case/src/crowd.js`**

Change the line
```js
const PATH_Y = 146; // where passers-by walk
```
to
```js
export const PATH_Y = 146; // where passers-by walk
```

- [ ] **Step 2: Create `open-case/test/png.js`, a small PNG reader for the tests**

```js
// Reads a PNG's pixels in Node, for the art tests: 8-bit RGBA or RGB, not interlaced (what Aseprite
// writes). Returns { w, h, data } with 4 bytes (r, g, b, a) per pixel.
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

export function readPng(file) {
  const b = readFileSync(file);
  if (b.toString('ascii', 1, 4) !== 'PNG') throw new Error(`${file} isn't a PNG`);
  let at = 8, w = 0, h = 0, channels = 0;
  const idat = [];
  while (at < b.length) {
    const len = b.readUInt32BE(at), type = b.toString('ascii', at + 4, at + 8), body = b.subarray(at + 8, at + 8 + len);
    if (type === 'IHDR') {
      w = body.readUInt32BE(0);
      h = body.readUInt32BE(4);
      const depth = body[8], colour = body[9], interlace = body[12];
      if (depth !== 8 || interlace !== 0 || (colour !== 6 && colour !== 2)) throw new Error(`${file}: an 8-bit RGB(A) PNG, not interlaced, please`);
      channels = colour === 6 ? 4 : 3;
    } else if (type === 'IDAT') idat.push(body);
    at += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * channels, out = Buffer.alloc(w * h * 4), line = Buffer.alloc(stride), prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) {
      const left = i >= channels ? line[i - channels] : 0, up = prev[i], ul = i >= channels ? prev[i - channels] : 0;
      let v = src[i];
      if (filter === 1) v += left;
      else if (filter === 2) v += up;
      else if (filter === 3) v += (left + up) >> 1;
      else if (filter === 4) {
        const p = left + up - ul, pa = Math.abs(p - left), pb = Math.abs(p - up), pc = Math.abs(p - ul);
        v += pa <= pb && pa <= pc ? left : pb <= pc ? up : ul;
      }
      line[i] = v & 255;
    }
    for (let x = 0; x < w; x++) {
      for (let k = 0; k < 3; k++) out[(y * w + x) * 4 + k] = line[x * channels + k];
      out[(y * w + x) * 4 + 3] = channels === 4 ? line[x * channels + 3] : 255;
    }
    line.copy(prev);
  }
  return { w, h, data: out };
}
```

- [ ] **Step 3: Write the art tests, `open-case/test/art.test.js`**

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
  [/^you-idle-\d$/, 2], [/^you-strum-\d$/, 3], [/^coin-\d$/, 2], [/^looper-\d$/, 2], [/^bird-\d$/, 2],
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
  const [left, , right] = cover('you-idle-0', 0, 0);
  assert.ok(left < CROWD.playerX && CROWD.playerX < right, 'you sit at CROWD.playerX');
  assert.ok(opaqueAt('case', 0, 0, CASE[0], CASE[1]), 'coins land inside the open case');
  for (const [sx, sy] of CROWD.spots) {
    for (const k of KINDS) {
      const name = `${k}-stand-0-${sx < CROWD.playerX ? 'right' : 'left'}`, [pl, pt, pr, pb] = cover(name, sx, sy);
      assert.ok(pt >= 0, `a ${k} at spot ${sx},${sy} fits on screen`);
      for (let y = pt; y < pb; y++) {
        for (let x = pl; x < pr; x++) {
          assert.ok(!(opaqueAt(name, sx, sy, x, y) && opaqueAt('case', 0, 0, x, y)), `a ${k} at spot ${sx},${sy} stands clear of the case`);
        }
      }
    }
  }
  assert.ok(data.feet.you > PATH_Y, 'passers-by walk behind you');
});
```

- [ ] **Step 4: Run them and see them fail**

Run: `cd open-case && node --test test/art.test.js`
Expected: FAIL with `ENOENT: no such file or directory` for `assets/sprites.json`.

- [ ] **Step 5: Create `art/open-case/sprites.lua`**

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
--   feet       { you, looper, case }: the row where each meets the ground, to sort them among the people
--   colors     the named colours the game draws with in code
--   palette    every colour in the sheet (at most 64)
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local D = dofile(here .. "draw.lua")
local F = dofile(here .. "figures.lua")
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

-- You and your things
screen("you-idle-0", function(b) D.you(b, 0, 0) end)
screen("you-idle-1", function(b) D.you(b, 1, 0) end)
for f, strum in ipairs({ -2, 0, 2 }) do screen("you-strum-" .. (f - 1), function(b) D.you(b, 0, strum) end) end
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
  '  "skyBottom": 129,',
  ('  "sun": [%d, %d, %d],'):format(D.SUN[1], D.SUN[2], D.SUN[3]),
  '  "clouds": ' .. list(clouds, function(c) return ("[%d, %d, %d]"):format(c[1], c[2], c[3]) end) .. ",",
  '  "windows": ' .. list(D.windows(), pair) .. ",",
  '  "stars": ' .. list(stars, pair) .. ",",
  ('  "trainY": %d,'):format(D.TRAIN_Y),
  '  "caseCoins": ' .. list(D.caseCoinSpots(60), pair) .. ",",
  ('  "feet": { "you": %d, "looper": %d, "case": %d },'):format(141 + D.YOU[2], D.LOOPER[2] + 6, D.CASE[2] + 9),
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

- [ ] **Step 6: Build the sheet**

Run (from the repo root): `/Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/sprites.lua`
Expected: `sprites: 154 frames on a 512x1055 sheet, 39 colours`

- [ ] **Step 7: Run the art tests, and the whole suite**

Run: `cd open-case && node --test test/art.test.js && npm test`
Expected: the 6 art tests pass, and the whole suite passes (104 tests: the 98 before and these 6).

- [ ] **Step 8: Rebuild and check it's byte for byte**

Run: `md5 open-case/assets/*; /Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/sprites.lua; md5 open-case/assets/*`
Expected: the same two checksums both times.

- [ ] **Step 9: Look at the sheet**

Open `open-case/assets/sprites.png` with the Read tool. Expected: the park layers along the bottom, and many rows of small frames above them:
- the four kinds of passer-by (a jogger in a red top, the old man in a flat cap and brown coat, a student in a blue hoodie with a yellow backpack, a commuter in a grey suit);
- the reaction bubbles;
- the pigeons and the birds.

- [ ] **Step 10: Commit**

```bash
git add art/open-case/sprites.lua open-case/assets/sprites.png open-case/assets/sprites.json open-case/test/png.js open-case/test/art.test.js open-case/src/crowd.js
git commit -m "Open Case: the flat-style sprite sheet, built by a script, and tests that check it against the game

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: The park's life in scene.js

**Files:**
- Modify: `open-case/src/tuning.js` (append the `PARK` block)
- Rewrite: `open-case/src/scene.js`
- Rewrite: `open-case/test/scene.test.js`

**Interfaces:**
- Consumes: `createRng`, `nextRandom` and `randomBetween` from `rng.js`; `BAR` from `groove.js`; `RULES.loudStrength` (4) from `tuning.js`.
- Produces, for Task 4 (`render.js`) and Task 5 (`main.js`):
  - `createScene(seed = 1)` → the scene, which gains `lastNote`, `scaredAt`, `trainBar`, `rng` and `windowBars`.
  - `sceneNote(scene, pitch, index, t, strength = 0)`.
  - `skyStages(bar)` → 7 stage numbers.
  - `sunDrop(bars)` → pixels, or `null` once the sun is gone.
  - `windowLit(scene, i, bar)` → boolean.
  - `lampState(bar, time, still)` → `'off' | 'on' | 'flicker'`.
  - `starsOut(bar)` → how many stars are out.
  - `trainX(scene, t)` → x, or `null`.
  - `cloudX(home, layer, time)` → x.
  - `createFlocks(seed = 1)`, and `birdsAt(flocks, time)` → `[{ x, y, frame }]`.
  - `pigeonsAt(scene, t, time)` → `[{ x, y, pose, frame, dir }]`.
  - `frameOf(count, n)` → which of n frames a counter is on.
  - Constants `PIGEONS`, `TRAIN_LENGTH`, `PIGEON_FLY` and `PIGEON_WALK`, alongside the existing `GUITAR`, `CASE`, `TRAIL_LIFE`, `FLIGHT` and `GOLD`.
- The existing `createScene()` and `sceneNote(scene, pitch, index, t)` calls in `main.js` keep working unchanged until Task 5, thanks to the defaults.

- [ ] **Step 1: Append the `PARK` block to `open-case/src/tuning.js`**

```js
// The park's life (scene.js and render.js): the sunset over each set, and what moves in the
// background. Bars count from a set's first note; seconds for the clouds, birds and pigeons' pecking
// run on the page's clock, so they carry on over the title and between sets.
export const PARK = {
  stageBars: 15, // the sky moves on a stage (dusk 0 to night 4) every this many bars...
  bandFirst: 3, // ...its top band first, this many bars into the stage...
  bandStep: 2, // ...then each band below it this many bars later, so the horizon's is the last
  sunGone: 36, // the sun has sunk behind the rooftops by this bar...
  sunSink: 17, // ...this many pixels below where it starts
  windowsFrom: 10, // each window lights at its own bar between these two
  windowsTo: 50,
  lampOn: 24, // the lamp comes on at this bar, and its pool of light on the path
  starsFrom: 45, // the stars come out one a bar from this bar
  trainFrom: 10, // the distant train passes once a set, at a bar between these two...
  trainTo: 50,
  trainCross: 6, // ...taking this many seconds to cross
  clouds: [2, 4], // pixels a second: the far clouds, then the near ones
  flockFirst: [5, 15], // seconds: the first flock of birds crosses this long after the page opens...
  flockEvery: [20, 40], // ...then another every this many seconds
  flockMost: 5, // birds in a flock: 1 to this many
  flockCross: 8, // seconds a flock takes to cross
  pigeonsAway: 4, // bars the pigeons stay away after a loud note scatters them
};
```

- [ ] **Step 2: Replace `open-case/test/scene.test.js` with the tests below**

The first three tests are the file's existing tests, unchanged. The rest are new.

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createScene, sceneNote, sceneEvents, stepScene, coinAt, glyphAt, CASE, GUITAR, TRAIL_LIFE, FLIGHT, GOLD,
  skyStages, sunDrop, windowLit, lampState, starsOut, trainX, cloudX, createFlocks, birdsAt, pigeonsAt, frameOf,
  PIGEONS, TRAIN_LENGTH, PIGEON_FLY, PIGEON_WALK,
} from '../src/scene.js';
import { BAR } from '../src/groove.js';
import { PARK } from '../src/tuning.js';

test('each note leaves a glyph that floats up from the guitar, higher notes higher, and fades over 2 bars', () => {
  const scene = createScene();
  sceneNote(scene, 60, 0, 1);
  sceneNote(scene, 72, 1, 1.5);
  const [low, high] = scene.trail;
  assert.equal(glyphAt(low, 1).x, GUITAR[0]);
  assert.ok(glyphAt(high, 1.5).y < glyphAt(low, 1).y, 'higher notes start higher');
  assert.ok(glyphAt(low, 3).y < glyphAt(low, 1).y && glyphAt(low, 3).x > glyphAt(low, 1).x, 'they drift up and along');
  assert.ok(glyphAt(low, 1 + TRAIL_LIFE / 2).fade > 0.4);
  stepScene(scene, 1.2 + TRAIL_LIFE);
  assert.deepEqual(scene.trail.map((g) => g.pitch), [72]);
});

test('a coin arcs from the listener into the case and stays there', () => {
  const scene = createScene();
  const person = { x: 200, y: 158 };
  sceneEvents(scene, [{ type: 'coin', person, coins: 2, why: 'happy' }], 10);
  assert.equal(scene.flights.length, 2);
  const [a, b] = scene.flights;
  assert.deepEqual(coinAt(a, 10), [200, 124]);
  assert.equal(coinAt(b, 10), null, 'the second follows a moment later');
  assert.ok(coinAt(a, 10 + FLIGHT / 2)[1] < 124, 'it arcs up');
  stepScene(scene, 10 + FLIGHT + 0.2);
  assert.equal(scene.caseCoins, 2);
  assert.equal(scene.flights.length, 0);
  assert.deepEqual(coinAt(a, 10 + FLIGHT).map(Math.round), CASE);
});

test('a callback lights the gold link for a moment; the end starts the applause', () => {
  const scene = createScene();
  sceneEvents(scene, [{ type: 'rule', rule: 'callback', first: 12 }, { type: 'end' }], 30);
  assert.deepEqual(scene.gold, { t: 30, first: 12 });
  assert.equal(scene.clapFrom, 30);
  stepScene(scene, 30 + GOLD + 0.1);
  assert.equal(scene.gold, null);
});

test('the sky steps from dusk to night a band at a time, at bar lines, the horizon last', () => {
  assert.deepEqual(skyStages(0), [0, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(skyStages(3), [1, 0, 0, 0, 0, 0, 0], 'the top band first');
  assert.deepEqual(skyStages(14), [1, 1, 1, 1, 1, 1, 0], 'the horizon waits for the stage bar');
  assert.deepEqual(skyStages(15), [1, 1, 1, 1, 1, 1, 1]);
  assert.deepEqual(skyStages(30), [2, 2, 2, 2, 2, 2, 2], 'blue hour');
  assert.deepEqual(skyStages(59), [4, 4, 4, 4, 4, 4, 3]);
  assert.deepEqual(skyStages(60), [4, 4, 4, 4, 4, 4, 4], 'night at the end of the set');
  assert.deepEqual(skyStages(99), [4, 4, 4, 4, 4, 4, 4], 'and it stays night');
  for (let bar = 1; bar <= 60; bar++) {
    skyStages(bar).forEach((s, i) => assert.ok(s - skyStages(bar - 1)[i] <= 1, `bar ${bar}: band ${i} steps one stage at a time`));
  }
});

test('the sun sinks a pixel at a time and is gone by bar 36', () => {
  assert.equal(sunDrop(0), 0);
  assert.equal(sunDrop(18), Math.round(PARK.sunSink / 2));
  assert.equal(sunDrop(35.9), PARK.sunSink);
  assert.equal(sunDrop(36), null);
  for (let b = 0; b < 36; b += 0.25) assert.ok(sunDrop(b + 0.25) === null || sunDrop(b + 0.25) - sunDrop(b) <= 1);
});

test('each window lights at its own bar between 10 and 50, the same bars for the same seed', () => {
  const a = createScene(7), b = createScene(7), c = createScene(8);
  const bars = (scene) => [...Array(30).keys()].map((i) => [...Array(61).keys()].find((bar) => windowLit(scene, i, bar)));
  const first = bars(a);
  assert.deepEqual(bars(b), first);
  assert.notDeepEqual(bars(c), first, 'another set lights them in another order');
  for (const bar of first) assert.ok(bar >= PARK.windowsFrom && bar < PARK.windowsTo, `bar ${bar}`);
  assert.ok(new Set(first).size > 10, 'one by one, not all at once');
});

test('the lamp comes on at bar 24 and flickers now and then, but never with reduced motion', () => {
  assert.equal(lampState(23, 1, false), 'off');
  const states = [...Array(2000).keys()].map((i) => lampState(24, i * 0.01, false));
  assert.ok(states.includes('on') && states.includes('flicker'));
  assert.ok(states.filter((s) => s === 'flicker').length < 200, 'a flicker is rare');
  assert.ok([...Array(2000).keys()].every((i) => lampState(40, i * 0.01, true) === 'on'));
});

test('the stars come out one a bar from bar 45', () => {
  assert.equal(starsOut(0), 0);
  assert.equal(starsOut(44), 0);
  assert.equal(starsOut(45), 1);
  assert.equal(starsOut(54), 10);
});

test('the train passes once a set, at a bar between 10 and 50, crossing in 6 seconds', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const scene = createScene(seed);
    assert.ok(Number.isInteger(scene.trainBar) && scene.trainBar >= PARK.trainFrom && scene.trainBar < PARK.trainTo);
    const at = scene.trainBar * BAR;
    assert.equal(trainX(scene, at - 0.01), null);
    assert.equal(trainX(scene, at), -TRAIN_LENGTH, 'it comes on from the left');
    assert.equal(trainX(scene, at + PARK.trainCross), 320, 'and goes off the right');
    assert.equal(trainX(scene, at + PARK.trainCross + 0.01), null);
  }
});

test('clouds drift right, the near ones faster, and come back round', () => {
  assert.equal(cloudX(100, 1, 0), 100);
  assert.equal(cloudX(100, 1, 10), 100 + PARK.clouds[0] * 10);
  assert.equal(cloudX(100, 2, 10), 100 + PARK.clouds[1] * 10);
  const wrapped = cloudX(300, 2, 30);
  assert.ok(wrapped < 0, `off the right and back in from the left: ${wrapped}`);
  for (let t = 0; t < 500; t += 7) assert.ok(cloudX(150, 2, t) >= -60 && cloudX(150, 2, t) < 380);
});

test('birds cross in flocks of 1 to 5, the first 5 to 15 seconds in, then every 20 to 40', () => {
  const starts = [], sizes = [];
  const flocks = createFlocks(3);
  let seen = 0;
  for (let t = 0; t < 600; t += 0.1) {
    const birds = birdsAt(flocks, t);
    for (const f of flocks.flying) if (!starts.includes(f.t)) (starts.push(f.t), sizes.push(f.n));
    seen = Math.max(seen, birds.length);
    for (const b of birds) assert.ok(b.y >= 10 && b.y < 70 && (b.frame === 0 || b.frame === 1));
  }
  assert.ok(starts[0] >= PARK.flockFirst[0] && starts[0] < PARK.flockFirst[1]);
  starts.slice(1).forEach((s, i) => assert.ok(s - starts[i] >= PARK.flockEvery[0] && s - starts[i] < PARK.flockEvery[1]));
  assert.ok(sizes.every((n) => n >= 1 && n <= PARK.flockMost) && new Set(sizes).size > 1);
  assert.ok(seen >= 1);
  // the same seed flies the same birds
  const again = createFlocks(3);
  assert.deepEqual(birdsAt(again, starts[0] + 4), birdsAt(createFlocks(3), starts[0] + 4));
});

test('a flock takes 8 seconds to cross', () => {
  const flocks = createFlocks(1);
  const start = flocks.next;
  const lead = (t) => birdsAt(flocks, t)[0];
  const a = lead(start + 0.01), b = lead(start + PARK.flockCross - 0.01);
  assert.ok((a.x < 0 && b.x > 320) || (a.x > 320 && b.x < 0), `from ${a.x} to ${b.x}`);
  assert.equal(birdsAt(flocks, start + PARK.flockCross + 0.01).length, 0);
});

test('the pigeons peck by the case until a loud note scatters them; they walk back 4 bars later', () => {
  const scene = createScene(1);
  const home = pigeonsAt(scene, 5, 5);
  assert.equal(home.length, PIGEONS.length);
  home.forEach((p, i) => assert.ok(Math.abs(p.x - PIGEONS[i][0]) <= 4 && p.y === PIGEONS[i][1] && p.pose !== 'fly'));
  sceneNote(scene, 60, 0, 10, 3);
  assert.equal(scene.scaredAt, null, 'a pick strength of 3 leaves them be');
  sceneNote(scene, 60, 1, 10, 4);
  assert.equal(scene.scaredAt, 10);
  const up = pigeonsAt(scene, 11, 11);
  assert.ok(up.every((p) => p.pose === 'fly'));
  assert.ok(pigeonsAt(scene, 10 + PIGEON_FLY - 0.1, 0).every((p) => p.y < 0), 'off the top of the screen');
  assert.equal(pigeonsAt(scene, 10 + PIGEON_FLY + 1, 0).length, 0, 'gone');
  sceneNote(scene, 60, 2, 20, 4);
  assert.equal(scene.scaredAt, 10, "a loud note while they're away doesn't count");
  const back = 10 + PARK.pigeonsAway * BAR;
  assert.equal(pigeonsAt(scene, back - 0.1, 0).length, 0);
  const walking = pigeonsAt(scene, back + 0.1, 0);
  assert.ok(walking.every((p) => p.pose === 'walk' && p.dir === -1 && p.x > 300), 'walking in from the right');
  const settled = pigeonsAt(scene, back + PIGEON_WALK + 0.1, 0);
  settled.forEach((p, i) => assert.ok(Math.abs(p.x - PIGEONS[i][0]) <= 4));
  sceneNote(scene, 60, 3, back + 1, 4);
  assert.equal(scene.scaredAt, back + 1, 'walking back, they can be scattered again');
});

test('frame counters wrap for any count, even a hair below zero', () => {
  assert.equal(frameOf(-0.01, 2), 1);
  assert.equal(frameOf(5, 4), 1);
  assert.equal(frameOf(-5, 4), 3);
});

test('after the tab sleeps for an hour, the sky holds at most one flock, not an hour of them', () => {
  const flocks = createFlocks(9);
  birdsAt(flocks, 1);
  const birds = birdsAt(flocks, 3600);
  assert.ok(birds.length <= PARK.flockMost, `${birds.length} birds`);
  assert.ok(flocks.flying.length <= 1);
  assert.ok(flocks.next > 3600, 'the next flock is still to come');
});
```

- [ ] **Step 3: Run them and see them fail**

Run: `cd open-case && node --test test/scene.test.js`
Expected: FAIL with a `SyntaxError` naming a missing export such as `skyStages` from `../src/scene.js`.

- [ ] **Step 4: Replace `open-case/src/scene.js`**

```js
// What's on screen besides the set itself, as plain data updated from what happens: the note trail,
// coins flying into the case, the gold link of a callback, and the park's life (the sunset over the
// set, the lit windows, the train, the pigeons by your case and the birds overhead). Pure, so it's
// tested in Node; render.js draws it. Times are seconds on the set's clock, except the birds' and the
// pigeons' pecking, which run on the page's clock (`time`).
import { createRng, nextRandom, randomBetween } from './rng.js';
import { BAR } from './groove.js';
import { PARK, RULES } from './tuning.js';

export const GUITAR = [152, 128]; // where notes float up from
export const CASE = [161, 160]; // where coins land
export const PIGEONS = [[196, 172], [209, 176], [222, 170]]; // where the pigeons peck: their feet
const TRAIL_LIFE = 6; // seconds a note's glyph lasts (2 bars)
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
    lastNote: -Infinity, // when you last played a note (you strum)
    scaredAt: null, // when a loud note last scattered the pigeons
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
  if (strength >= RULES.loudStrength && (scene.scaredAt === null || t - scene.scaredAt >= PARK.pigeonsAway * BAR)) scene.scaredAt = t;
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
  const since = scene.scaredAt === null ? Infinity : t - scene.scaredAt;
  PIGEONS.forEach(([hx, hy], i) => {
    if (since < PIGEON_FLY) {
      const up = 70 * since + 20 * since * since;
      out.push({ x: Math.round(hx + (60 + i * 12) * since), y: Math.round(hy - up), pose: 'fly', frame: frameOf(since * 8 + i, 2), dir: 1 });
      return;
    }
    const back = since - PARK.pigeonsAway * BAR; // seconds since they started walking back
    if (back < 0) return;
    if (back < PIGEON_WALK) {
      const from = 330 + i * 10;
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

export { TRAIL_LIFE, FLIGHT, GOLD, TRAIN_LENGTH, PIGEON_FLY, PIGEON_WALK };
```

- [ ] **Step 5: Run the scene tests, and the whole suite**

Run: `cd open-case && node --test test/scene.test.js && npm test`
Expected: all 15 scene tests pass, and the whole suite passes (116 tests).

- [ ] **Step 6: Commit**

```bash
git add open-case/src/tuning.js open-case/src/scene.js open-case/test/scene.test.js
git commit -m "Open Case: the park's life as pure data: the sunset over a set, lit windows, the train, clouds, birds and pigeons

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: The renderer draws the sprite sheet

**Files:**
- Rewrite: `open-case/src/render.js`
- Rewrite: `open-case/test/render.test.js`

**Interfaces:**
- Consumes:
  - Task 3's `scene.js` exports: `GUITAR`, `coinAt`, `glyphAt`, `GOLD`, `skyStages`, `sunDrop`, `windowLit`, `lampState`, `starsOut`, `trainX`, `cloudX`, `birdsAt`, `pigeonsAt`, `frameOf`, `createScene`, `createFlocks`, `sceneNote`, `CASE`.
  - Task 2's `sprites.json` fields.
  - `INTEREST.hook` from `tuning.js`, and `BEAT` and `BAR` from `groove.js`.
- Produces:
  - `createRenderer(g, art)`, where `art` is `{ sheet, frames, data }`. It returns `draw(view)`, and `view` gains three fields:
    - `bars`: bars into the set (fractional; 0, or `?sky`'s number, with no set);
    - `still`: reduced motion;
    - `flocks`: from `createFlocks`.
  - Also `personFrame(p, t, time)`, `youFrame(scene, t, time)`, `treeFrame(t, time, playing, still)`, `shapeTags` (unchanged), and `W`, `H`.
  - A frame name the sheet doesn't have throws `no sprite called <name>`, which the page's frame loop turns into its "Something went wrong" note.

**Note:** after this task, `main.js` still calls `createRenderer(g)` without art, so the game doesn't run in a browser until Task 5 wires it up. The Node tests all pass.

- [ ] **Step 1: Replace `open-case/test/render.test.js`**

It keeps every existing check, including the strip label, the callback popup's placement and the debug panel's clearance, now against the real frame data.

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRenderer, shapeTags, personFrame, youFrame, treeFrame, W, H } from '../src/render.js';
import { createSet, runSet } from '../src/set.js';
import { createScene, createFlocks, sceneNote, CASE } from '../src/scene.js';
import { createKeyState } from '../src/keys.js';
import { goodSet } from '../src/bots.js';
import { KINDS } from '../src/crowd.js';
import { BAR, BEAT } from '../src/groove.js';
import { INTEREST } from '../src/tuning.js';
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
  flocks: createFlocks(1), debug: null, ...over,
});

test('the title shows the name, the key layout and how to start, over the park at dusk', () => {
  const g = fakeContext();
  createRenderer(g, art)(view({ screen: 'title' }));
  assert.ok(g.texts.includes('Open Case'));
  assert.ok(['A', 'W', "'", 'press any key'].every((s) => g.texts.includes(s)));
  assert.ok(g.rects.some(([x, y, w]) => x === 0 && y === 0 && w === W), 'the sky behind it');
  for (const n of ['ground', 'lamp-off', 'you-idle-', 'case', 'sun']) assert.ok(drawn(g, n).length, n);
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
    set.t = t;
    for (const p of set.crowd.people) p.reaction.t = t - 0.1;
    for (const still of [false, true]) draw(view({ set, scene, t, bars: t / BAR, time: t * 1.3 - 0.01, still, flocks }));
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

test('you strum on each note, then go back to breathing; the trees rustle on the bar line', () => {
  const scene = createScene(1);
  assert.match(youFrame(scene, 5, 5), /^you-idle-\d$/);
  sceneNote(scene, 60, 0, 5, 3);
  assert.equal(youFrame(scene, 5, 5), 'you-strum-0');
  assert.equal(youFrame(scene, 5.1, 5.1), 'you-strum-1');
  assert.equal(youFrame(scene, 5.17, 5.17), 'you-strum-2');
  assert.match(youFrame(scene, 5.3, 5.3), /^you-idle-\d$/);
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
```

- [ ] **Step 2: Run them and see them fail**

Run: `cd open-case && node --test test/render.test.js`
Expected: FAIL with a `SyntaxError` naming a missing export (`personFrame`) from `../src/render.js`.

- [ ] **Step 3: Replace `open-case/src/render.js`**

```js
// Draws the scene at 320x180 into a 2D context (main.js scales it up by a whole number), in the flat
// style, from the sprite sheet art/open-case/sprites.lua makes (assets.js loads it): the park and its
// sunset, you on your crate with the guitar, the open case and the looper, the passers-by, their
// reactions, the pigeons and birds, the note trail, the memory strip, and the title, pause and ?debug
// overlays. The end card is HTML (index.html).
import { CROWD, PLAY, LAYERS, INTEREST } from './tuning.js';
import { BAR, BEAT } from './groove.js';
import {
  GUITAR, coinAt, glyphAt, GOLD, skyStages, sunDrop, windowLit, lampState, starsOut, trainX, cloudX,
  birdsAt, pigeonsAt, frameOf,
} from './scene.js';

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

// You: strumming for a moment after each note, and otherwise breathing.
export function youFrame(scene, t, time) {
  const since = t - scene.lastNote;
  if (since >= 0 && since < STRUM) return `you-strum-${Math.min(2, Math.floor((since / STRUM) * 3))}`;
  return `you-idle-${frameOf(time / BREATH, 2)}`;
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

  // Everyone and everything standing on the path, nearest last: the listeners, you, the looper, the
  // case and its coins, and the pigeons on the ground. Returns the pigeons in the air, drawn later.
  function figures({ set, scene, t, time }) {
    const beatPhase = set && t >= 0 ? (t % BAR) / BAR : 1;
    const things = [
      { y: data.feet.you, draw: () => sprite(youFrame(scene, t, time), 0, 0) },
      { y: data.feet.looper, draw: () => sprite(`looper-${beatPhase < 0.25 ? 1 : 0}`, 0, 0) },
      {
        y: data.feet.case,
        draw: () => {
          sprite('case', 0, 0);
          for (const [x, y] of data.caseCoins.slice(0, scene.caseCoins)) sprite('case-coin', x, y);
        },
      },
    ];
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

  function hud(keys, set) {
    text(`oct ${keys.octave >= 0 ? '+' : ''}${keys.octave}`, 4, 170);
    for (let i = 0; i < PLAY.strengthMax; i++) px(52 + i * 5, 172, 4, 4, i < keys.strength ? C.light : C.ink);
    if (keys.lock) text('lock', 78, 170, C.gold);
    if (set) text(`bar ${Math.min(60, Math.floor(set.t / BAR) + 1)}/60`, W - 4, 170, C.light, 'right');
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
    text('press any key', W / 2, 132, C.gold, 'center');
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

  // view: { screen: 'title' | 'ready' | 'playing' | 'paused' | 'over', set, scene, keys, t (set time),
  //   bars (bars into the set, a fraction is fine; 0 with no set), time (seconds since the page opened),
  //   still (reduced motion), flocks (the birds, from createFlocks), debug: null | { reported, measured } }
  return function draw(view) {
    const { screen, set, scene, keys, t, time } = view;
    g.imageSmoothingEnabled = false;
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
    if (keys && screen !== 'title') hud(keys, screen === 'ready' ? null : set);
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

- [ ] **Step 4: Run the render tests, and the whole suite**

Run: `cd open-case && node --test test/render.test.js && npm test`
Expected: all 16 render tests pass, and the whole suite passes (125 tests).

- [ ] **Step 5: Commit**

```bash
git add open-case/src/render.js open-case/test/render.test.js
git commit -m "Open Case: the screen is drawn from the sprite sheet, with the sunset, the moving park, and listeners who breathe and nod

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Load the art, and wire the park into the game

**Files:**
- Create: `open-case/src/assets.js`
- Create: `open-case/test/assets.test.js`
- Modify: `open-case/src/main.js`
- Modify: `open-case/index.html` (CSS colours only)

**Interfaces:**
- Consumes:
  - `createRenderer(g, art)` and the view's new fields, from Task 4;
  - `createScene(seed)`, `createFlocks(seed)` and `sceneNote(..., strength)`, from Task 3.
- Produces:
  - `loadArt(base?, { json, image }?)` → `{ sheet, frames, data }`;
  - `loadJson(url)` and `loadImage(url)`;
  - the `?sky=N` URL option;
  - `window.__openCase.art` and `window.__openCase.flocks`, for browser checks.

- [ ] **Step 1: Write the loader's tests, `open-case/test/assets.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadArt, loadJson } from '../src/assets.js';

test('the art loads from open-case/assets/: the frame data and the sheet beside it', async () => {
  const asked = [];
  const art = await loadArt(undefined, {
    json: async (url) => (asked.push(String(url)), { frames: { ground: [0, 0, 1, 1, 0, 0] }, sky: [] }),
    image: async (url) => (asked.push(String(url)), { image: true }),
  });
  assert.ok(asked.some((u) => u.endsWith('/open-case/assets/sprites.json')), asked.join(' '));
  assert.ok(asked.some((u) => u.endsWith('/open-case/assets/sprites.png')), asked.join(' '));
  assert.deepEqual(art.frames, { ground: [0, 0, 1, 1, 0, 0] });
  assert.deepEqual(art.sheet, { image: true });
  assert.deepEqual(art.data.sky, []);
});

test("art that can't load is an error, so the page can say something went wrong", async () => {
  const image = async () => ({});
  await assert.rejects(loadArt(undefined, { json: async () => { throw new Error('offline'); }, image }), /offline/);
  await assert.rejects(loadArt(undefined, { json: async () => ({ frames: {} }), image: async () => { throw new Error("couldn't load"); } }), /couldn't load/);
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 404 });
  try {
    await assert.rejects(loadJson('https://example.test/sprites.json'), /404/);
  } finally {
    globalThis.fetch = realFetch;
  }
});
```

- [ ] **Step 2: Run them and see them fail**

Run: `cd open-case && node --test test/assets.test.js`
Expected: FAIL with `Cannot find module` for `../src/assets.js`.

- [ ] **Step 3: Create `open-case/src/assets.js`**

```js
// Loads the sprite sheet that art/open-case/sprites.lua writes to open-case/assets/: the image, and
// the frame and layout data beside it (sprites.lua describes its fields). The loaders can be swapped,
// so Node tests can load without a browser.
export async function loadJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.json();
}

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`couldn't load ${url}`));
    img.src = url;
  });
}

// { sheet: the image, frames: { name: [x, y, w, h, ax, ay] }, data: all of sprites.json }
export async function loadArt(base = new URL('../assets/', import.meta.url), { json = loadJson, image = loadImage } = {}) {
  const [data, sheet] = await Promise.all([json(new URL('sprites.json', base)), image(new URL('sprites.png', base))]);
  return { sheet, frames: data.frames, data };
}
```

- [ ] **Step 4: Run the loader's tests**

Run: `cd open-case && node --test test/assets.test.js`
Expected: both pass.

- [ ] **Step 5: Wire it into `open-case/src/main.js`**

Make these eight replacements, each exactly once.

(a) The header's list of URL options. Replace:
```js
// URL options: ?sound (the sound check); ?debug (interest bars, the corner panel, and Run the bots on
// the end card); ?seed=N (fixes the passers-by); ?bot=random or ?bot=lick (the bot plays the set,
// audibly). With any of them, window.__openCase exposes the game for browser checks.
```
with:
```js
// URL options: ?sound (the sound check); ?debug (interest bars, the corner panel, and Run the bots on
// the end card); ?seed=N (fixes the passers-by, and the park's windows, train and birds); ?bot=random or
// ?bot=lick (the bot plays the set, audibly); ?sky=N (the park as it is N bars into a set, until a set
// starts). With any of them, window.__openCase exposes the game for browser checks.
```

(b) Replace:
```js
import { createScene, sceneNote, sceneEvents, stepScene, FLIGHT } from './scene.js';
```
with:
```js
import { createScene, createFlocks, sceneNote, sceneEvents, stepScene, FLIGHT } from './scene.js';
```

(c) Replace:
```js
import { soundCheck } from './soundcheck.js';
```
with:
```js
import { soundCheck } from './soundcheck.js';
import { loadArt } from './assets.js';
```

(d) Replace:
```js
const anyDebug = debug || !!bot || fixedSeed !== null || params.has('sound');
```
with:
```js
const skyBar = params.has('sky') ? Math.max(0, Number.parseFloat(params.get('sky')) || 0) : 0;
const anyDebug = debug || !!bot || fixedSeed !== null || params.has('sound') || params.has('sky');
```

(e) Replace:
```js
if (touchOnly) document.getElementById('phone').hidden = false;
else if (params.has('sound')) soundCheck(audio, { debug: anyDebug });
else game();

function game() {
  const canvas = document.getElementById('game');
  const out = canvas.getContext('2d', { alpha: false });
  const off = document.createElement('canvas');
  off.width = W;
  off.height = H;
  const draw = createRenderer(off.getContext('2d'));
  const end = document.getElementById('end');

  let screen = 'title'; // 'ready' (waiting for your first note), 'playing', 'paused', 'over', 'thanks'
  let set = null, scene = createScene(), start = 0, seed = 0;
```
with:
```js
if (touchOnly) document.getElementById('phone').hidden = false;
else if (params.has('sound')) soundCheck(audio, { debug: anyDebug });
else {
  // The art loads before the title card shows; if it can't, say something went wrong.
  loadArt().then(game, (err) => {
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

  let screen = 'title'; // 'ready' (waiting for your first note), 'playing', 'paused', 'over', 'thanks'
  let set = null, scene = createScene(pageSeed), start = 0, seed = 0;
```

(f) In `begin(at)`, replace:
```js
    set = createSet(seed);
    scene = createScene();
```
with:
```js
    set = createSet(seed);
    scene = createScene(seed);
```

(g) Loud notes reach the pigeons. In `feedBot()`, replace:
```js
        if (set.phase === 'playing') sceneNote(scene, m.note.pitch, set.listen.notes.length - 1, m.t);
```
with:
```js
        if (set.phase === 'playing') sceneNote(scene, m.note.pitch, set.listen.notes.length - 1, m.t, m.note.strength);
```
and in `onNote`, replace:
```js
        sceneNote(scene, n.pitch, set.listen.notes.length - 1, n.at - start);
```
with:
```js
        sceneNote(scene, n.pitch, set.listen.notes.length - 1, n.at - start, n.strength);
```

(h) Three smaller replacements.

In the Another set handler, replace:
```js
    set = null;
    scene = createScene();
```
with:
```js
    set = null;
    scene = createScene(pageSeed);
```

In `window.__openCase`, replace:
```js
      audio, input, latency,
```
with:
```js
      audio, input, latency, art, flocks,
```

In the frame loop, replace:
```js
      draw({
        screen: screen === 'thanks' || screen === 'over' ? 'playing' : screen,
        set, scene, keys: input.keys, t: set ? set.t : 0, time: (now - t0) / 1000, debug: debug ? latency : null,
      });
```
with:
```js
      draw({
        screen: screen === 'thanks' || screen === 'over' ? 'playing' : screen,
        set, scene, keys: input.keys, t: set ? set.t : 0, bars: set ? set.t / BAR : skyBar,
        time: (now - t0) / 1000, still: reducedMotion.matches, flocks, debug: debug ? latency : null,
      });
```

- [ ] **Step 6: Give the HTML cards the palette's colours, in `open-case/index.html`'s `<style>`**

Make these replacements:
- `background: #120e22;` → `background: #121230;` (in `html, body`)
- `color: #fff2dc; }` → `color: #fff2cc; }` (in `body, button, input`)
- `a.back:hover, a.back:focus { color: #fff2dc; }` → `a.back:hover, a.back:focus { color: #fff2cc; }`
- `background: #1b1430ee; border: 2px solid #4a2d66;` → `background: #1c1626ee; border: 2px solid #663276;` (in `.card`)
- `.card button { padding: 6px 12px; background: #33245a; border: 2px solid #6a3468; cursor: pointer; }` → `.card button { padding: 6px 12px; background: #43286a; border: 2px solid #93406f; cursor: pointer; }`
- `.card button:hover, .card button:focus-visible { background: #4a2d66; }` → `.card button:hover, .card button:focus-visible { background: #663276; }`

- [ ] **Step 7: Run the whole suite**

Run: `cd open-case && npm test`
Expected: all 127 pass. The page test still finds every element id the scripts look up, `message` included.

- [ ] **Step 8: Check that it runs in a browser**

Run `python3 -m http.server 8765` in the background from the repo root. If you have a browser tool, open `http://localhost:8765/open-case/?seed=3` and check:
- the title card shows over the park at dusk;
- `http://localhost:8765/open-case/?sky=59` shows night after one key press;
- there are no errors in the console.

If you have no browser tool, say so in your report; the controller checks it in Task 6. Stop the server afterwards.

- [ ] **Step 9: Commit**

```bash
git add open-case/src/assets.js open-case/test/assets.test.js open-case/src/main.js open-case/index.html
git commit -m "Open Case: the art loads before the title, and the game runs the park: seeds, reduced motion, loud notes, ?sky

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Say what's built, and check it in Chrome

**Files:**
- Modify: `README.md` (the Open Case section)
- Modify: `docs/superpowers/specs/2026-09-28-open-case-art-design.md` (status, and what the build settled)
- Modify: `docs/superpowers/specs/2026-09-28-open-case-design.md` (one update line in §5)

- [ ] **Step 1: README, in the Open Case section**

Make these replacements.

The Tests bullet. Replace:
```markdown
- Tests (Node 22, no dependencies): `cd open-case && npm test`. The headline test plays a scripted honest set against a random bot and a lick bot over ten seeds.
```
with:
```markdown
- Tests (Node 22, no dependencies): `cd open-case && npm test`. The headline test plays a scripted honest set against a random bot and a lick bot over ten seeds. The art tests check the committed sprite sheet against what the game draws.
```

In the Debug list, after the `?bot` line, add:
```markdown
  - `?sky=N` shows the park as it is N bars into a set (until a set starts), to check the sunset without playing three minutes.
```

The Tuning bullet. Replace:
```markdown
- Tuning: the rules, the crowd, the tips and the feel are in `open-case/src/tuning.js`; the synth's voicing is in `open-case/src/audio.js`, and a few view timings are in `scene.js` and `render.js`.
```
with:
```markdown
- Tuning: the rules, the crowd, the tips and the feel are in `open-case/src/tuning.js`, and so are the park's sunset and background timings (`PARK`); the synth's voicing is in `open-case/src/audio.js`, and a few view timings are in `scene.js` and `render.js`.
```

Replace the whole Art bullet, including its code block and the line after it, with:
````markdown
- Art: flat colour, no outlines, no dithering, the look Nathan picked from a reference picture. The game draws from one sprite sheet, `open-case/assets/sprites.png`, with its frame and layout data in `sprites.json`. `art/open-case/sprites.lua` writes both from the shared drawing code: `draw.lua` (the park, you and your things) and `figures.lua` (the passers-by, their reactions, the pigeons and the birds). `palette.lua` holds every colour, at most 64. The style sample and the tab icon have scripts there too. Rebuild everything from the repo root (it's deterministic: an unchanged script rebuilds its files byte for byte):

  ```sh
  for s in sprites icon style-sample; do /Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/$s.lua; done
  ```

  The style sample writes `art/open-case/preview-style.png` and `preview-oldman.gif`. Previews aren't committed.
````

- [ ] **Step 2: The art spec**

In `docs/superpowers/specs/2026-09-28-open-case-art-design.md`, replace the Status line with:
```markdown
**Status:** Approved by Nathan ("ready for the art repaint") and built from `docs/superpowers/plans/2026-09-28-open-case-art.md`. The look is the flat style sample he approved (his busker in a black beanie, black shirt and forest green pants: "looks great!"). The ambient motion is from the chat ("is the background going to be dynamic? clouds moving maybe some birds flying"). Order: art, then the looper, then Regulars.
```

Then add this section just before `## Not in this change`:
```markdown
## What the build settled

The plan's prototype settled a few things this spec left open:
- **The sky steps one band at a time.** Each stage's seven bands change top first, every 2 bars, so the whole sky never changes at once. Each stage is complete at its bar (0, 15, 30, 45, 60). The rooftops and the train darken with the horizon's band, and each cloud with its own band.
- **Unlit windows don't show.** Each lights at its own seeded bar.
- **Two clocks.** What follows the set runs on the set's clock: the sunset, windows, lamp, stars, train, the trees' rustle, the nods and the pigeons' scatter. The clouds, the birds, the sway, breathing and the pigeons' pecking run on the page's clock, so the title screen is live. The birds come from the page's seed, which `?seed=N` fixes.
- **Reactions are pale bubbles with a sign**, over a flat dark shadow so they read against the sun:
  - repeat: a yawn's Zs;
  - off key: a frown;
  - callback: a grin;
  - taste: bouncing notes;
  - random: a question mark;
  - silence: dots;
  - loud: a wince;
  - recognised: a tick.
- **Reduced motion also stops the lamp's flicker.**
- **`?sky=N`** shows the park N bars into a set, for checking the sunset.
```

- [ ] **Step 3: The game's design spec**

In `docs/superpowers/specs/2026-09-28-open-case-design.md`, after the paragraph in §5 that starts `**Update (2026-09-28):** Nathan saw the 16-bit sample`, add a new paragraph:
```markdown
**Update (2026-09-28):** the flat-style repaint is built; see `2026-09-28-open-case-art-design.md`. The game now draws from a sprite sheet made by `art/open-case/sprites.lua`.
```

- [ ] **Step 4: Run every test**

Run: `cd open-case && npm test && cd ../site && npm test`
Expected: Open Case 127 pass, site 70 pass.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/superpowers/specs/2026-09-28-open-case-art-design.md docs/superpowers/specs/2026-09-28-open-case-design.md
git commit -m "Open Case: the README and specs say the flat repaint is built, and what the build settled

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 6 (controller, not the implementer): Check it in Chrome**

Serve the repo on localhost and use the Playwright browser at 960x540. Save the screenshots under `/Users/nathan/Documents/code/.playwright-mcp/`. Never capture Nathan's screen.
- `?seed=3`: the title over the dusk park.
- `?seed=3&sky=1`, `?sky=30` and `?sky=59`, one key press each: dusk, blue hour and night.
- `?seed=3&bot=lick&debug` about 30 s in: walkers stepping, reactions over heads, no console errors.
- A pigeon scatter: in the same bot page, set `window.__openCase.scene.scaredAt = window.__openCase.set.t`.
- A flock crossing: `window.__openCase.flocks.next = performance.now() / 1000 - 3`.
- The same page emulating `prefers-reduced-motion: reduce`: no birds and no train.

Safari can't be driven here without capturing Nathan's screen, so it's left to him: ask him to play a set in Safari.
