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
D.SKY_BOTTOM = 129 -- the sky's last row
D.SUN = { 237, 104, 15 } -- the sun's centre at the start of a set, and its radius
D.LAMP = { 70, 50 } -- the lamp's head
D.POOL = { 70, 143, 40, 12 } -- the pool of lamplight on the path: centre and radii
D.YOU = { -6, 10 } -- where you sit, as an offset from the style sample's first layout
D.CASE = { 147, 156, 28 } -- the open case: its front-left corner and its width
D.SPEAKER = { 112, 151 } -- the band's speaker's top-left, by your crate
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
  l = C.leaf[3], e = C.leaf[2], E = C.leaf[1], o = C.go,
  v = C.sky[4], V = C.sky[3], -- the reverb pedal's violet
  n = C.path[2], N = C.path[1],
  a = C.skin3[2], A = C.skin3[1], m = C.skin4[2], M = C.skin4[1], -- tan and deep brown skin
  f = C.rose[2], F = C.rose[1], j = C.teal[2], J = C.teal[1], x = C.auburn, z = C.blonde,
  O = C.sky[6], -- the studio's drums orange (the groovebox's pads)
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
  for y = 0, D.SKY_BOTTOM do rect(b, 0, y, W - 1, y, stage[D.band(y)]) end
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

-- Where the keepsakes in your case sit in its lid, in the order put in: { x, y } bottom middles on the
-- lid's dark red lining, which leans right as it rises.
function D.caseKeepSpots()
  local x, y = D.CASE[1], D.CASE[2]
  return { { x + 10, y - 2 }, { x + 16, y - 2 }, { x + 22, y - 2 } }
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
