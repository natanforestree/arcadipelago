-- The Reno Today island for the games page (it links to Reno Today, Nathan's page of what's on in Reno each
-- day, a website rather than a game). A chunk of Virginia Street floats on warm desert stone under the Reno
-- Arch: steel pillars, the starburst on top, RENO in pink neon (it flickers on one frame), the red Biggest
-- Little City banner and bulbs chasing round the arch, with a street lamp at each end of the street.
-- Kept narrow (hit <= 80 px) so seven islands fit the landscape stage. Run from the repo root:
--   /Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/site/island-reno-today.lua
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local L = dofile(here .. "lib.lua")
local P = dofile(here .. "palette.lua")
local I = dofile(here .. "island.lua")
local W, H, N, MS = 88, 84, 12, 160
local C = P.renoToday

local function ell(x, y, cx, cy, rx, ry)
  local dx, dy = (x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry
  return dx * dx + dy * dy <= 1
end

local function copy(b)
  local c = L.buffer(b.w, b.h)
  for y = 0, b.h - 1 do for x = 0, b.w - 1 do c[y][x] = b[y][x] end end
  return c
end

local GLYPHS = {   -- RENO in a 3x5 font
  R = { "##.", "#.#", "##.", "#.#", "#.#" }, E = { "###", "#..", "##.", "#..", "###" },
  N = { "#.#", "###", "###", "#.#", "#.#" }, O = { ".#.", "#.#", "#.#", "#.#", ".#." },
}

-- Arch geometry: a ring between two ellipses centred on (44, 34), top half only.
local AX, AY, ORX, ORY, IRX, IRY = 44, 34, 26, 17, 22, 13

local function scenery()
  local b = L.buffer(W, H)
  -- the underside, narrowing to a tip; lit from the left
  for y = 56, 77 do
    local half = math.floor(36 * (1 - (y - 56) / 22) ^ 1.3 + 0.5)
    for x = 44 - half, 44 + half do
      local c = C.rock[2]
      if x < 44 - half * 0.45 then c = C.rock[3] elseif x > 44 + half * 0.55 then c = C.rock[1] end
      if (x + y * 3) % 9 == 0 then c = C.rock[1] end
      L.set(b, x, y, c)
    end
  end
  -- the top: a sage verge with Virginia Street across it, and the rim's front edge
  for y = 44, 62 do
    for x = 4, 84 do
      if ell(x, y, 44, 53, 39, 8) then
        local c = (y <= 47) and C.grass[3] or C.grass[2]
        if y >= 50 and y <= 55 then c = (y == 50) and C.road[2] or C.road[1] end
        if y == 52 and x % 6 < 3 and x > 12 and x < 76 then c = C.paint end
        if y >= 58 then c = C.rock[3] end
        L.set(b, x, y, c)
      end
    end
  end
  -- street lamps at both ends
  for _, lx in ipairs({ 9, 79 }) do
    for y = 40, 49 do L.set(b, lx, y, C.steel[1]) end
    L.fillRect(b, lx - 1, 38, lx + 1, 39, C.lamp)
  end
  -- the starburst (the band covers its lower rays)
  for k = 0, 7 do
    local a = math.rad(k * 45)
    for r = 2, (k % 2 == 0) and 5 or 3 do
      L.set(b, math.floor(AX + r * math.cos(a) + 0.5), math.floor(13 - r * math.sin(a) + 0.5), C.steel[3])
    end
  end
  L.disc(b, AX, 13, 2, C.gold[2])
  -- pillars on the far kerb
  for y = 30, 50 do
    for x = 18, 21 do L.set(b, x, y, (x == 18) and C.steel[3] or (x == 21) and C.steel[1] or C.steel[2]) end
    for x = 66, 69 do L.set(b, x, y, (x == 66) and C.steel[3] or (x == 69) and C.steel[1] or C.steel[2]) end
  end
  -- the arch band, lit along its top
  for y = AY - ORY, AY do
    for x = AX - ORX, AX + ORX do
      if ell(x, y, AX, AY, ORX, ORY) and not ell(x, y, AX, AY, IRX, IRY) then
        L.set(b, x, y, ell(x, y - 1, AX, AY, ORX, ORY) and C.steel[2] or C.steel[3])
      end
    end
  end
  -- the banner under the arch, its lettering abstracted to dots at this size
  L.fillRect(b, 22, 35, 65, 37, C.red[2])
  L.fillRect(b, 22, 35, 65, 35, C.red[3])
  for x = 24, 63, 2 do L.set(b, x, 36, C.paint) end
  return b
end

-- Bulbs along the middle of the band, left foot to right foot.
local BULBS = {}
for i = 0, 17 do
  local t = math.rad(170 - i * (160 / 17))
  BULBS[#BULBS + 1] = { math.floor(AX + 24 * math.cos(t) + 0.5), math.floor(AY - 15 * math.sin(t) + 0.5) }
end

local base = scenery()
local frames = {}
for f = 1, N do
  local b = copy(base)
  for i, p in ipairs(BULBS) do L.set(b, p[1], p[2], ((i - f) % 3 ~= 0) and C.gold[2] or C.bulbOff) end
  L.outline(b, C.outline)
  -- RENO goes on after the outline so its translucent glow isn't outlined
  local tube = (f == 7) and C.neon[1] or C.neon[2]
  local x0, y0 = 37, 24
  local neon = L.buffer(W, H)
  for li, ch in ipairs({ "R", "E", "N", "O" }) do
    for gy = 1, 5 do
      for gx = 1, 3 do
        if GLYPHS[ch][gy]:sub(gx, gx) == "#" then L.set(neon, x0 + (li - 1) * 4 + gx - 1, y0 + gy - 1, tube) end
      end
    end
  end
  if f ~= 7 then
    for y = y0 - 1, y0 + 5 do
      for x = x0 - 1, x0 + 15 do
        if not neon[y][x] and (L.get(neon, x - 1, y) or L.get(neon, x + 1, y) or L.get(neon, x, y - 1) or L.get(neon, x, y + 1)) then
          neon[y][x] = C.glow
        end
      end
    end
  end
  L.blit(b, neon, 0, 0)
  frames[f] = b
end
I.write("reno-today", frames, MS, P.glow["reno-today"])
