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
