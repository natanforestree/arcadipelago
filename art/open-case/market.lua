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
