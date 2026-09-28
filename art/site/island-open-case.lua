-- The Open Case island for the games page: a corner of the park at dusk floating on its clod of earth.
-- A lamp post glows over a crate with a guitar leaning on it, the open guitar case in front holds a
-- few coins, and notes drift up from the strings. It's a work in progress, so a strip of scaffolding
-- still stands on its right edge. Run from the repo root:
--   aseprite -b --script art/site/island-open-case.lua
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local L = dofile(here .. "lib.lua")
local P = dofile(here .. "palette.lua")
local I = dofile(here .. "island.lua")
local W, H, N, MS = 112, 96, 12, 180
local C = P.openCase

local CX, CY, RX, RY = 54, 52, 48, 13 -- the grass top
local TIPX, TIPY = 52, 78             -- where the underside narrows to
local FLICKER = { 3, 3, 2, 3, 3, 3, 1, 3, 2, 3, 3, 3 } -- the lamp's brightness in each frame, 1..3

-- Light comes from the top-left, slightly toward the viewer.
local function light(nx, ny, nz)
  local lx, ly, lz = -0.5, -0.7, 0.5
  return (nx * lx + ny * ly + nz * lz) / math.sqrt(lx * lx + ly * ly + lz * lz)
end

-- Is pixel (x, y) inside the ellipse? Also returns its normalised offsets from the centre.
local function ell(x, y, cx, cy, rx, ry)
  local dx, dy = (x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry
  return dx * dx + dy * dy <= 1, dx, dy
end

local function copy(b)
  local c = L.buffer(b.w, b.h)
  for y = 0, b.h - 1 do for x = 0, b.w - 1 do c[y][x] = b[y][x] end end
  return c
end

-- A piece painted by fn(layer), outlined on its own and then drawn over b.
local function piece(b, fn)
  local one = L.buffer(W, H)
  fn(one)
  L.outline(one, C.outline)
  L.blit(b, one, 0, 0)
end

-- The grass top's lower edge at column x.
local function rimBelow(x)
  local u = math.max(-1, math.min(1, (x + 0.5 - CX) / RX))
  return CY + RY * math.sqrt(1 - u * u)
end

-------------------------------------------------------------------------------------------------
-- The island itself (the same in every frame)

-- The underside: an earth band under the rim, then a rough cone hanging to the tip (as on Snake's).
local function inUnderside(x, y)
  if y + 0.5 < CY then return false end
  for k = 1, 4 do if ell(x, y, CX, CY + k, RX - k * 0.5, RY) then return true end end
  local yy = y - math.floor(L.rnd(math.floor(x / 2), 0, 21) * 3)
  local t = (yy + 0.5 - CY) / (TIPY - CY)
  if t > 1 then return false end
  local c = CX + (TIPX - CX) * t
  local hw = (RX - 3) * (1 - t) ^ 0.8
  local band = math.floor(yy / 3)
  local left = c - hw - (L.rnd(band, 1, 22) - 0.5) * 5
  local right = c + hw + (L.rnd(band, 2, 22) - 0.5) * 5
  return x + 0.5 >= left and x + 0.5 <= right
end

local function earth(x, y)
  local depth = y + 0.5 - rimBelow(x)
  local t = math.max(0, (y + 0.5 - CY) / (TIPY - CY))
  local hw = math.max(4, (RX - 3) * (1 - math.min(1, t)) ^ 0.8)
  local u = (x + 0.5 - (CX + (TIPX - CX) * t)) / hw
  local v = depth + math.sin(x * 0.31) * 1.2 + math.sin(x * 0.11 + 2) * 1.5 + u * 4
  local c
  if v < 5 then c = C.d3 elseif v < 13 then c = C.d2 else c = C.d1 end
  local r = L.rnd(x, y, 23)
  if r < 0.05 then c = (c == C.d3) and C.d2 or C.d1 end
  if u < -0.8 and c == C.d2 then c = C.d3 end
  if u > 0.8 and v > 7 then c = C.rock[1] end
  return c
end

local function stone(b, cx, cy, rx, ry)
  for y = math.floor(cy - ry), math.ceil(cy + ry) do
    for x = math.floor(cx - rx), math.ceil(cx + rx) do
      local inside, dx, dy = ell(x, y, cx, cy, rx, ry)
      if inside and b[y][x] then
        local v = light(dx, dy, math.sqrt(math.max(0, 1 - dx * dx - dy * dy)))
        b[y][x] = (v > 0.55) and C.rock[3] or ((v > -0.1) and C.rock[2] or C.rock[1])
      end
    end
  end
end

-- A root hanging from under column x0 to yEnd, swaying a little.
local function root(b, x0, yEnd, phase, lean, color)
  local y0 = math.floor(rimBelow(x0))
  while b[y0 + 1][x0] do y0 = y0 + 1 end
  local px = x0
  for y = y0 + 1, yEnd do
    local k = y - y0
    local x = math.floor(x0 + lean * k + (math.sin(k * 0.3 + phase) - math.sin(phase)) * 1.2 + 0.5)
    if math.abs(x - px) > 1 then L.set(b, (x + px) // 2, y - 1, color) end
    L.set(b, x, y, color)
    px = x
  end
end

-- The scaffolding on the right edge: two posts, a crossbeam, a plank and a brace, lashed with rope.
local function scaffold(b)
  piece(b, function(s)
    for _, x in ipairs({ 90, 97 }) do
      L.fillRect(s, x, 28, x, math.floor(rimBelow(x)) - 2, C.timber[2])
      L.fillRect(s, x + 1, 28, x + 1, math.floor(rimBelow(x)) - 2, C.timber[1])
    end
    L.fillRect(s, 88, 28, 100, 29, C.timber[3])
    L.fillRect(s, 88, 30, 100, 30, C.timber[1])
    L.fillRect(s, 89, 38, 99, 38, C.timber[3])
    for k = 0, 8 do L.set(s, 91 + k * 0.7, 31 + k, C.timber[2]) end -- the brace
  end)
  for _, p in ipairs({ { 90, 29 }, { 97, 29 }, { 91, 38 }, { 98, 38 } }) do L.set(b, p[1], p[2], C.rope) end
end

local function island()
  local b = L.buffer(W, H)
  for y = CY, TIPY + 4 do
    for x = 0, W - 1 do
      if inUnderside(x, y) then b[y][x] = earth(x, y) end
    end
  end
  for _, s in ipairs({ { 24, 60, 2.5, 1.8 }, { 44, 70, 3, 2 }, { 76, 64, 2.5, 1.8 }, { 60, 74, 2, 1.6 }, { 34, 66, 1.6, 1.3 } }) do
    stone(b, s[1], s[2], s[3], s[4])
  end
  -- the grass top, lit toward the top-left
  for y = CY - RY - 1, CY + RY + 1 do
    for x = CX - RX - 1, CX + RX + 1 do
      local top, dx, dy = ell(x, y, CX, CY, RX, RY)
      if top then
        local d = math.sqrt(dx * dx + dy * dy)
        local lit = -dx * 0.55 - dy * 0.8 + (L.rnd(x, y, 24) - 0.5) * 0.25
        local c = C.g3
        if lit > 0.35 and d < 0.9 then c = C.g4 end
        if d > 0.86 and dy > 0.15 then c = C.g2 end
        local r = L.rnd(x, y, 25)
        if r < 0.06 then c = C.g2 elseif r > 0.96 then c = C.g4 end
        b[y][x] = c
      end
    end
  end
  -- the path: paving stones in a band across the front of the grass
  for y = CY + 1, CY + 9 do
    for x = CX - RX + 6, CX + RX - 6 do
      if ell(x, y, CX, CY, RX - 3, RY - 2) and (y - CY) < 8 then
        local row = math.floor((y - CY - 1) / 3)
        local col = math.floor((x + row * 3) / 6)
        local edge = ((y - CY - 1) % 3 == 2) or ((x + row * 3) % 6 == 5)
        b[y][x] = edge and C.pave[1] or ((L.rnd(col, row, 26) < 0.4) and C.pave[3] or C.pave[2])
      end
    end
  end
  L.outline(b, C.outline)
  root(b, 36, 84, 0.5, -0.1, C.d1)
  root(b, 48, 86, 2.2, -0.04, C.neck)
  root(b, 58, 83, 4.0, 0.03, C.d1)
  root(b, 70, 85, 1.2, 0.08, C.neck)
  -- the lamp post (its head is drawn per frame)
  piece(b, function(s)
    L.fillRect(s, 20, 22, 21, math.floor(rimBelow(20)) - 6, C.pole)
    L.fillRect(s, 18, math.floor(rimBelow(20)) - 7, 23, math.floor(rimBelow(20)) - 6, C.pole)
    L.fillRect(s, 17, 17, 24, 17, C.pole)
  end)
  -- the crate
  piece(b, function(s)
    L.fillRect(s, 42, 38, 55, 49, C.wood[2])
    L.fillRect(s, 42, 38, 55, 38, C.wood[3])
    L.fillRect(s, 42, 43, 55, 43, C.wood[1])
    L.fillRect(s, 48, 39, 48, 49, C.wood[1])
    L.fillRect(s, 55, 39, 55, 49, C.wood[1])
  end)
  -- the guitar leaning on the crate
  piece(b, function(s)
    for k = 0, 13 do L.set(s, 60 + k * 0.35, 40 - k, C.neck) end
    L.fillRect(s, 64, 24, 66, 26, C.neck) -- the headstock
    for y = 38, 51 do
      for x = 55, 67 do
        local upper = ell(x, y, 61, 42, 3.5, 3.5)
        local lower = ell(x, y, 60.5, 47.5, 5, 4)
        if upper or lower then
          local _, dx, dy = ell(x, y, 60.5, 45, 5, 6.5)
          s[y][x] = (dx + dy < -0.6) and C.guitar[3] or ((dx + dy > 0.7) and C.guitar[1] or C.guitar[2])
        end
      end
    end
    L.disc(s, 60.5, 45.5, 1.4, C.outline) -- the sound hole
  end)
  -- the open case in front: the lid up behind, the red lining, a few coins
  piece(b, function(s)
    for y = 46, 51 do L.fillRect(s, 68 + (51 - y) // 2, y, 84 + (51 - y) // 2, y, C.caseOut) end
    L.fillRect(s, 66, 52, 84, 57, C.caseOut)
    L.fillRect(s, 67, 53, 83, 56, C.caseIn)
    L.fillRect(s, 67, 53, 83, 53, C.caseIn2)
  end)
  for _, p in ipairs({ { 70, 55 }, { 73, 54 }, { 75, 56 }, { 78, 55 }, { 81, 54 } }) do
    L.set(b, p[1], p[2], C.coin[2])
    L.set(b, p[1] + 1, p[2], C.coin[1])
  end
  scaffold(b)
  return b
end

-------------------------------------------------------------------------------------------------
-- What moves: the lamp's glow, a coin catching the light, and notes drifting up from the guitar

local function note(b, x, y)
  L.fillRect(b, x, y, x + 1, y + 1, C.note)
  L.fillRect(b, x + 2, y - 4, x + 2, y + 1, C.note)
  L.set(b, x + 3, y - 4, C.note)
  L.set(b, x + 3, y - 3, C.note)
end

local base = island()

-- Frame f of N (0-based).
local function paint(f)
  local b = copy(base)
  -- the lamp's head and its glow
  local k = FLICKER[f + 1]
  L.fillRect(b, 18, 18, 23, 21, C.lamp[k])
  L.fillRect(b, 19, 19, 22, 20, C.lamp[math.min(3, k + 1)])
  local glow = L.buffer(W, H)
  for y = 12, 30 do
    for x = 10, 32 do
      local dx, dy = x + 0.5 - 20.5, y + 0.5 - 20
      local d = math.sqrt(dx * dx + dy * dy)
      if d > 4 and d < 9 + k and not base[y][x] and L.bayer(x, y) < 0.5 - d / 30 then glow[y][x] = C.lamp[1] .. "60" end
    end
  end
  L.blit(b, glow, 0, 0)
  -- a coin glints
  if f == 3 or f == 9 then
    local gx = (f == 3) and 73 or 81
    local gy = (f == 3) and 54 or 54
    L.set(b, gx, gy, C.coin[3])
    L.set(b, gx, gy - 1, C.coin[3])
    L.set(b, gx - 1, gy, C.coin[3]); L.set(b, gx + 1, gy, C.coin[3])
  end
  -- three notes rising from the strings, each over the whole loop, a third apart
  for n = 0, 2 do
    local p = ((f + n * 4) % N) / N
    local x = math.floor(69 + p * 8 + math.sin(p * 6.28 + n) * 2 + 0.5)
    local y = math.floor(42 - p * 26 + 0.5)
    if p > 0.05 then note(b, x, y) end
  end
  return b
end

local frames = {}
for f = 0, N - 1 do frames[#frames + 1] = paint(f) end
I.write("open-case", frames, MS, P.glow["open-case"])
