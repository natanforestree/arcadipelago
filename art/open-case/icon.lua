-- Open Case's 48x48 tab icon: the open guitar case on the paving at dusk, coins in its red lining and a
-- note floating up, the low sun behind the rooftops. Run from the repo root:
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

-- the sky, dithered from dusk purple down to the glow, the sun and the rooftops, then the paving
for y = 0, N - 1 do
  for x = 0, N - 1 do
    local t = math.min(1, y / 30) * (#C.sky - 1)
    local i = math.floor(t)
    if L.bayer(x, y) < t - i then i = i + 1 end
    put(x, y, C.sky[math.min(#C.sky, i + 1)])
  end
end
for y = 20, 30 do
  for x = 28, 42 do
    local d = math.sqrt((x + 0.5 - 35) ^ 2 + (y + 0.5 - 28) ^ 2)
    if d < 6 then put(x, y, C.sun) end
  end
end
for _, r in ipairs({ { 0, 26, 9 }, { 10, 24, 17 }, { 18, 27, 25 }, { 26, 29, 33 }, { 34, 25, 40 }, { 41, 27, 47 } }) do
  rect(r[1], r[2], r[3], 31, C.city[1])
end
put(13, 27, C.window); put(22, 29, C.window); put(37, 28, C.window)
for y = 32, N - 1 do
  for x = 0, N - 1 do
    local row = math.floor((y - 32) / 5)
    local sx = x + (row % 2) * 5
    put(x, y, ((y - 32) % 5 == 4 or sx % 10 == 0) and C.path[1] or ((row + math.floor(sx / 10)) % 3 == 0 and C.path[3] or C.path[2]))
  end
end

-- the case: its lid up behind, the shell, the red lining with coins
local case = L.buffer(N, N)
for y = 19, 27 do
  local lean = (27 - y) // 2
  L.fillRect(case, 9 + lean, y, 39 + lean, y, C.case[1])
end
L.fillRect(case, 6, 28, 41, 38, C.case[1])
L.fillRect(case, 8, 29, 39, 35, C.case[2])
L.fillRect(case, 8, 29, 39, 29, C.case[3])
for _, c in ipairs({ { 11, 32 }, { 16, 31 }, { 22, 33 }, { 27, 31 }, { 33, 32 }, { 19, 34 } }) do
  L.fillRect(case, c[1], c[2], c[1] + 2, c[2] + 1, C.coin[2])
  L.set(case, c[1], c[2], C.coin[3])
  L.set(case, c[1] + 2, c[2] + 1, C.coin[1])
end
L.set(case, 23, 32, C.coin[3]); L.set(case, 22, 33, C.coin[3]); L.set(case, 24, 33, C.coin[3])
L.outline(case, C.outline)
for y = 0, N - 1 do for x = 0, N - 1 do if case[y][x] then put(x, y, case[y][x]) end end end

-- a note floating up from it
local note = L.buffer(N, N)
L.fillRect(note, 14, 12, 16, 14, C.lamp[2])
L.fillRect(note, 17, 5, 17, 14, C.lamp[2])
L.fillRect(note, 18, 5, 19, 6, C.lamp[2])
L.set(note, 20, 7, C.lamp[2])
L.outline(note, C.outline)
for y = 0, N - 1 do for x = 0, N - 1 do if note[y][x] then put(x, y, note[y][x]) end end end

L.save(b, "art/open-case/icon.aseprite", "open-case/icon.png")
print("icon: open-case/icon.png")
