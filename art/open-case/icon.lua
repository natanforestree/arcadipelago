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
