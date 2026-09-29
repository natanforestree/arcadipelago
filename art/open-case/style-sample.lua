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
