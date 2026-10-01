-- The front page's tab icon: a tiny floating island with a tree, in the Snake island's colours.
-- Run from the repo root:
--   aseprite -b --script art/site/favicon.lua
-- Writes site/assets/favicon.png (32x32), art/site/favicon.aseprite, and art/site/preview-favicon.png
-- (the icon at tab size and 8x, on a light and a dark tab, to look at; not committed).
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local L = dofile(here .. "lib.lua")
local P = dofile(here .. "palette.lua")
local C = P.snake
local S = 32

local CX, CY, RX, RY = 16, 17.5, 13, 4.5 -- the grass top
local DEPTH = 11                         -- how far below the grass the underside's tip hangs

-- Light comes from the top-left, slightly toward the viewer (as on the islands).
local function light(nx, ny, nz)
  local lx, ly, lz = -0.5, -0.7, 0.5
  return (nx * lx + ny * ly + nz * lz) / math.sqrt(lx * lx + ly * ly + lz * lz)
end

local function ell(x, y, cx, cy, rx, ry)
  local dx, dy = (x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry
  return dx * dx + dy * dy <= 1, dx, dy
end

local b = L.buffer(S, S)

-- Underside: dirt under the rim, rock lower down, narrowing to a point; lit from the left.
for y = 0, S - 1 do
  for x = 0, S - 1 do
    local xb = (x + 0.5 - CX) / (RX - 0.5)
    if math.abs(xb) < 1 then
      local rim = CY + RY * math.sqrt(1 - xb * xb)
      local bottom = CY + 1 + DEPTH * (1 - math.abs(xb)) ^ 1.1
      local yc = y + 0.5
      if yc > CY and yc <= bottom then
        local depth = yc - rim
        local c
        if depth < 1.5 then c = C.d3 elseif depth < 3.5 then c = C.d2 else c = C.rock[2] end
        if xb > 0.25 then c = (c == C.d3) and C.d2 or (c == C.d2 and C.d1 or C.rock[1]) end
        if xb < -0.35 and c == C.rock[2] then c = C.rock[3] end
        if depth < 0.5 and L.rnd(x, y, 3) < 0.5 then c = C.g2 end
        L.set(b, x, y, c)
      end
    end
  end
end

-- Grass top, lighter toward the top-left, darker along the front edge.
for y = 0, S - 1 do
  for x = 0, S - 1 do
    local inside, dx, dy = ell(x, y, CX, CY, RX, RY)
    if inside then
      local d = math.sqrt(dx * dx + dy * dy)
      local c = C.g3
      if ((dx + 0.3) / 0.55) ^ 2 + ((dy + 0.35) / 0.6) ^ 2 <= 1 then c = C.g4 end
      if d > 0.82 and dy > 0.25 then c = C.g2 end
      L.set(b, x, y, c)
    end
  end
end

-- Tree: trunk, then a round canopy shaded like a sphere.
L.fillRect(b, 12, 11, 13, 17, C.stem)
L.set(b, 12, 11, C.d3); L.set(b, 12, 12, C.d3)
local TX, TY, TR = 12.5, 8, 5.5
for y = 0, S - 1 do
  for x = 0, S - 1 do
    local dx, dy = (x + 0.5 - TX) / TR, (y + 0.5 - TY) / TR
    local d2 = dx * dx + dy * dy
    if d2 <= 1 then
      local v = light(dx, dy, math.sqrt(1 - d2))
      local c
      if v > 0.75 then c = C.s5 elseif v > 0.45 then c = C.s4 elseif v > 0.05 then c = C.s3 else c = C.s2 end
      L.set(b, x, y, c)
    end
  end
end
-- Two apples in the tree and a mushroom on the grass, for a bit of red.
L.set(b, 10, 9, C.a2); L.set(b, 15, 10, C.a2); L.set(b, 15, 9, C.a3)
L.set(b, 21, 15, C.mcap); L.set(b, 22, 15, C.mcap2); L.set(b, 23, 15, C.mcap)
L.set(b, 22, 16, C.mstem)
L.set(b, 6, 17, C.cream); L.set(b, 18, 19, C.yellow)

L.outline(b, C.outline)
L.save(b, "art/site/favicon.aseprite", "site/assets/favicon.png")

-- Preview: on a light and a dark tab, at 16px, 32px and 8x.
local tabs = { "#dee1e6", "#35363a" }
local pv = L.buffer(2 * (16 + 32 + S * 8) + 40, (S * 8 + 16) * 2)
for i, bg in ipairs(tabs) do
  local oy = (i - 1) * (S * 8 + 16)
  L.fillRect(pv, 0, oy, pv.w - 1, oy + S * 8 + 15, bg)
  local half = L.buffer(16, 16)
  for y = 0, 15 do for x = 0, 15 do half[y][x] = b[y * 2 + 1][x * 2] or b[y * 2][x * 2 + 1] end end
  L.blit(pv, half, 8, oy + 8)
  L.blit(pv, b, 32, oy + 8)
  L.blit(pv, L.scale(b, 8), 72, oy + 8)
end
L.save(pv, nil, "art/site/preview-favicon.png")
