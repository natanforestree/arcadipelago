-- The Under the Rowan Tree island for the games page (it links to undertherowantree.org, a website rather
-- than a game): a rowan in autumn, heavy with berries, shedding a few leaves over a little family on a
-- picnic blanket underneath (two dark-haired grown-ups with their baby between them). Run from the repo
-- root:
--   aseprite -b --script art/site/island-rowan.lua
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local L = dofile(here .. "lib.lua")
local P = dofile(here .. "palette.lua")
local I = dofile(here .. "island.lua")
local W, H, N, MS = 108, 84, 12, 200
local C = P.rowan

local CX, CY, RX, RY = 54, 50, 48, 10 -- the grass top
local TIPX, TIPY = 53, 73              -- where the underside narrows to
local TRUNK = 67                       -- the trunk's centre column where it meets the grass

-- Light comes from the top-left, slightly toward the viewer (as on the other islands).
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

-- The grass top's lower edge at column x.
local function rimBelow(x)
  local u = math.max(-1, math.min(1, (x + 0.5 - CX) / RX))
  return CY + RY * math.sqrt(1 - u * u)
end

-------------------------------------------------------------------------------------------------
-- The island itself (the same in every frame)

-- The underside: an earth band under the rim, then a rough cone hanging to the tip, its sides stepping
-- in and out by their own noise and its columns hanging by a pixel or two.
local function inUnderside(x, y)
  if y + 0.5 < CY then return false end
  for k = 1, 4 do if ell(x, y, CX, CY + k, RX - k * 0.5, RY) then return true end end
  local yy = y - math.floor(L.rnd(math.floor(x / 2), 0, 22) * 3)
  local t = (yy + 0.5 - CY) / (TIPY - CY)
  if t > 1 then return false end
  local c = CX + (TIPX - CX) * t
  local hw = (RX - 3) * (1 - t) ^ 0.75
  local band = math.floor(yy / 3)
  local left = c - hw - (L.rnd(band, 1, 21) - 0.5) * 5
  local right = c + hw + (L.rnd(band, 2, 21) - 0.5) * 5
  return x + 0.5 >= left and x + 0.5 <= right
end

-- The earth's colour: layered d3, d2, d1 going down, lighter on the left (toward the light).
local function earth(x, y)
  local depth = y + 0.5 - rimBelow(x)
  local t = math.max(0, (y + 0.5 - CY) / (TIPY - CY))
  local hw = math.max(4, (RX - 3) * (1 - math.min(1, t)) ^ 0.75)
  local u = (x + 0.5 - (CX + (TIPX - CX) * t)) / hw
  local v = depth + math.sin(x * 0.31) * 1.2 + math.sin(x * 0.11 + 2) * 1.5 + u * 4
  local c
  if v < 5 then c = C.d3 elseif v < 11 then c = C.d2 else c = C.d1 end
  local r = L.rnd(x, y, 23)
  if r < 0.05 then c = (c == C.d3) and C.d2 or C.d1 end
  if r > 0.975 and c ~= C.d3 then c = (c == C.d1) and C.d2 or C.d3 end
  if u < -0.8 and c == C.d2 then c = C.d3 end
  if u > 0.8 and v > 6 then c = C.rock[1] end
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

-- A root hanging from the bottom of column x0 down to yEnd, swaying and leaning a little.
local function root(b, x0, yEnd, phase, lean, color)
  local y0 = math.floor(rimBelow(x0))
  while b[y0 + 1][x0] do y0 = y0 + 1 end
  local px = x0
  for y = y0 + 1, yEnd do
    local k = y - y0
    local x = math.floor(x0 + lean * k + (math.sin(k * 0.3 + phase) - math.sin(phase)) * 1.2 + 0.5)
    if math.abs(x - px) > 1 then L.set(b, (x + px) // 2, y - 1, color) end
    L.set(b, x, y, color)
    if k <= (yEnd - y0) * 0.35 and not L.get(b, x + 1, y) then L.set(b, x + 1, y, C.d1) end
    px = x
  end
end

-- Soft shade on the grass: darkens lit grass inside the ellipse.
local function grassShadow(b, cx, cy, rx, ry)
  for y = math.floor(cy - ry), math.ceil(cy + ry) do
    for x = math.floor(cx - rx), math.ceil(cx + rx) do
      local c = L.get(b, x, y)
      if ell(x, y, cx, cy, rx, ry) and (c == C.g3 or c == C.g4) then b[y][x] = C.g2 end
    end
  end
end

local function island()
  local b = L.buffer(W, H)
  for y = CY, TIPY + 3 do
    for x = 0, W - 1 do
      if inUnderside(x, y) then b[y][x] = earth(x, y) end
    end
  end
  for _, s in ipairs({ { 26, 59, 2.3, 1.6 }, { 43, 65, 2.8, 1.9 }, { 72, 63, 2.6, 1.8 }, { 86, 58, 1.8, 1.4 },
      { 58, 70, 2, 1.5 }, { 35, 61, 1.5, 1.2 } }) do
    stone(b, s[1], s[2], s[3], s[4])
  end

  -- the grass top: autumn grass, lit toward the top-left, darker toward the front rim, with specks
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
  for x = CX - RX, CX + RX do
    local y = math.floor(rimBelow(x) + 0.5)
    if b[y] and b[y][x] and y > CY then
      b[y][x] = C.g2
      if L.rnd(x, 0, 26) < 0.35 then L.set(b, x, y + 1, C.g1) end
    end
  end
  -- tufts poking above the back rim (clear of the trunk)
  for _, tx in ipairs({ 14, 24, 37, 51, 84, 94 }) do
    local u = (tx + 0.5 - CX) / RX
    local ty = math.floor(CY - RY * math.sqrt(1 - u * u) + 0.5)
    L.set(b, tx, ty - 1, C.g3); L.set(b, tx + 1, ty - 2, C.g4); L.set(b, tx + 2, ty - 1, C.g3)
  end
  -- the tree's shade, falling forward and right of the trunk (the light is behind it, top-left)
  grassShadow(b, 63, 51, 25, 5)
  grassShadow(b, TRUNK + 2, 47, 6, 2)

  L.outline(b, C.outline)

  -- roots, kept short so the island stays within its height on the page
  root(b, 34, 76, 0.5, -0.1, C.bark[1])
  root(b, 46, 79, 2.2, -0.04, C.d1)
  root(b, 61, 78, 4.0, 0.03, C.bark[1])
  root(b, 70, 76, 1.2, 0.08, C.d1)
  root(b, 80, 74, 3.1, 0.1, C.bark[1])
  return b
end

-------------------------------------------------------------------------------------------------
-- The rowan: trunk, crown and berries (the crown twinkles a little from frame to frame)

-- The crown is a few overlapping lumps; a pixel belongs to the lump it's deepest inside.
local LUMPS = {
  { 60, 10.5, 13, 6.5 }, { 74, 12.5, 11, 6.5 }, { 65, 18.5, 22, 11 }, { 46, 22, 14, 8 }, { 83, 21.5, 12, 8 },
}

local function crownAt(x, y)
  local best, bdx, bdy = nil, 0, 0
  for _, l in ipairs(LUMPS) do
    local dx, dy = (x + 0.5 - l[1]) / l[3], (y + 0.5 - l[2]) / l[4]
    local d2 = dx * dx + dy * dy
    -- the edge is lumpy: each 3x3 cell of the outline bites in a little by its own noise
    local edge = 1 - 0.22 * L.rnd(math.floor(x / 3), math.floor(y / 3), 27)
    if d2 <= edge and (not best or d2 < best) then best, bdx, bdy = d2, dx, dy end
  end
  return best, bdx, bdy
end

local function tree()
  local t = L.buffer(W, H)
  -- the trunk: 4 px wide at the grass, 3 px higher up, leaning a touch left; shaded on the right
  for y = 26, 48 do
    local k = (48 - y) / 22
    local cx = TRUNK - k * 2.5
    local half = (y > 40) and 2 or 1.5
    for x = math.floor(cx - half), math.floor(cx + half - 0.01) do
      local u = (x + 0.5 - (cx - half)) / (2 * half)
      t[y][x] = (u < 0.34) and C.bark[3] or ((u < 0.75) and C.bark[2] or C.bark[1])
    end
  end
  -- roots flaring into the grass, and two branches up into the crown
  L.set(t, TRUNK - 3, 48, C.bark[2]); L.set(t, TRUNK + 2, 48, C.bark[1]); L.set(t, TRUNK - 3, 47, C.bark[3])
  for i = 0, 6 do L.set(t, TRUNK - 3 - i, 33 - i, C.bark[2]); L.set(t, TRUNK - 3 - i, 32 - i, C.bark[3]) end
  for i = 0, 5 do L.set(t, TRUNK + 1 + i, 32 - i, C.bark[1]); L.set(t, TRUNK + 1 + i, 31 - i, C.bark[2]) end
  -- the crown, in the leaves' five autumn tones, ordered-dithered between them
  for y = 0, 34 do
    for x = 0, W - 1 do
      local d2, dx, dy = crownAt(x, y)
      if d2 then
        local v = light(dx, dy, math.sqrt(math.max(0, 1 - d2)))
        v = v + (L.rnd(math.floor(x / 2), math.floor(y / 2), 28) - 0.5) * 0.5 -- clumps of leaves
        local s = (v + 0.9) / 1.7 * 4 + 1 -- 1..5
        s = math.floor(s + L.bayer(x, y) - 0.5)
        t[y][x] = C.leaf[math.max(1, math.min(5, s))]
      end
    end
  end
  -- gaps where the sky shows through near the bottom of the crown
  for _, g in ipairs({ { 52, 27 }, { 75, 26 }, { 42, 26 }, { 87, 25 } }) do
    if t[g[2]][g[1]] then t[g[2]][g[1]] = nil end
  end
  L.outline(t, C.outline)
  -- berry clusters: a few red beads each, the top-left one lit. The ones listed with `hang` dangle below
  -- the crown's edge on a short stalk, outlined so they read against the sky.
  local function cluster(bx, by, hang)
    local one = L.buffer(W, H)
    -- a rowan's bunch is flat-topped and wide, not round: the hanging ones are five beads over four
    local beads = hang and { { -2, 0 }, { -1, 0 }, { 0, 0 }, { 1, 0 }, { 2, 0 }, { -2, 1 }, { -1, 1 }, { 1, 1 }, { 2, 1 }, { 0, 2 } }
      or { { -1, 0 }, { 0, 0 }, { 1, 0 }, { -1, 1 }, { 0, 1 }, { 1, 1 }, { 0, 2 } }
    for _, p in ipairs(beads) do
      local c = C.berry[2]
      if p[2] == 0 and (p[1] + bx) % 2 == 0 then c = C.berry[3] end -- every other top bead catches the light
      if p[2] == 2 or (p[1] >= 1 and p[2] == 1) then c = C.berry[1] end
      L.set(one, bx + p[1], by + p[2], c)
    end
    L.set(one, bx - 1, by, C.berryShine)
    if hang then L.set(one, bx, by - 1, C.bark[2]); L.outline(one, C.outline) end
    L.blit(t, one, 0, 0)
  end
  for _, c in ipairs({ { 40, 23 }, { 58, 22 }, { 65, 13 }, { 52, 15 }, { 78, 16 }, { 90, 19 }, { 44, 17 },
      { 70, 21 }, { 84, 23 }, { 60, 8 }, { 34, 21 } }) do
    cluster(c[1], c[2])
  end
  for _, c in ipairs({ { 47, 30 }, { 81, 30 }, { 37, 28 }, { 92, 26 } }) do cluster(c[1], c[2], true) end
  return t
end

-- Frame f's twinkle: scattered crown pixels catch the light (one tone brighter) for a frame or two.
local function twinkle(b, t, f)
  for y = 0, 34 do
    for x = 0, W - 1 do
      local c = t[y][x]
      local r = L.rnd(x, y, 29)
      if r > 0.92 and c then
        local step = math.floor(L.rnd(x, y, 30) * N)
        if (f - step) % N < 2 then
          for i = 1, 4 do if c == C.leaf[i] then b[y][x] = C.leaf[i + 1] end end
        end
      end
    end
  end
end

-------------------------------------------------------------------------------------------------
-- The family on their picnic blanket

local function picnic(b)
  for y = 50, 57 do
    local k = y - 50
    local x0, x1 = 33 - k // 2, 64 - k // 2
    for x = x0, x1 do
      local cell = (math.floor((x - x0) / 3) + math.floor(k / 2)) % 2
      b[y][x] = (y == 57) and C.picnic[3] or ((cell == 0) and C.picnic[1] or C.picnic[2])
    end
  end
end

-- A grown-up sitting facing out, 6 px wide, with the feet's row at y. longHair lets the hair fall to the
-- shoulders; extra adds rows of sweater (so one can sit a little taller); reach puts out a hand to the
-- right on the lap row (toward the baby).
local function grownUp(x, y, sweater, longHair, extra, reach)
  local p = L.buffer(W, H)
  local rows = 9 + extra
  local top = y - rows + 1
  local hair, skin = C.hair, C.skin
  -- head: hair over the top and down the sides, a 4x2 face lit from the left
  for i = 1, 4 do L.set(p, x + i, top, hair) end
  for i = 0, 5 do L.set(p, x + i, top + 1, hair) end
  L.set(p, x + 1, top, C.hairShine); L.set(p, x + 2, top + 1, C.hairShine)
  for r = 2, 3 do
    L.set(p, x, top + r, hair); L.set(p, x + 5, top + r, hair)
    for i = 1, 4 do L.set(p, x + i, top + r, (i == 4) and skin[1] or skin[2]) end
  end
  if not longHair then L.set(p, x, top + 3, nil); L.set(p, x + 5, top + 3, nil) end
  -- sweater: shoulders, chest and arms, shaded on the right
  local lap = top + 6 + extra
  for r = top + 4, lap do
    for i = 0, 5 do L.set(p, x + i, r, (i == 5) and sweater[1] or sweater[2]) end
  end
  if longHair then L.set(p, x, top + 4, hair); L.set(p, x + 5, top + 4, hair) end
  L.set(p, x + 1, lap, skin[1]); L.set(p, x + 2, lap, skin[2]) -- hands in the lap
  if reach then L.set(p, x + 6, lap, sweater[2]); L.set(p, x + 7, lap, skin[2]) end
  -- legs folded in front, then the feet
  for i = 0, 5 do L.set(p, x + i, lap + 1, C.legs) end
  for i = -1, 6 do L.set(p, x + i, lap + 2, (i == -1 or i == 6) and C.shoe or C.legs) end
  L.outline(p, C.outline)
  return p
end

-- The baby, bundled in a cream blanket between them, 5 px wide and 6 tall, waving now and then.
local function baby(x, y, waving)
  local p = L.buffer(W, H)
  local top = y - 5
  for i = 1, 3 do L.set(p, x + i, top, C.hair) end -- a dark little tuft
  for r = 1, 2 do
    L.set(p, x, top + r, C.blanket[2]); L.set(p, x + 4, top + r, C.blanket[1])
    for i = 1, 3 do L.set(p, x + i, top + r, (i == 3) and C.skin[1] or C.skin[2]) end
  end
  for r = 3, 5 do
    for i = 0, 4 do L.set(p, x + i, top + r, (i == 4 or r == 5) and C.blanket[1] or C.blanket[2]) end
  end
  if waving then L.set(p, x + 5, top + 1, C.skin[2]); L.set(p, x + 5, top + 2, C.blanket[2])
  else L.set(p, x + 5, top + 3, C.skin[2]) end
  L.outline(p, C.outline)
  return p
end

-------------------------------------------------------------------------------------------------
-- Leaves drifting down from the crown to the grass, each on its own part of the loop

local FALLING = {
  { x = 30, y = 27, len = 24, offset = 0, colour = C.fall[1] },
  { x = 86, y = 29, len = 22, offset = 4, colour = C.fall[2] },
  { x = 72, y = 32, len = 16, offset = 8, colour = C.fall[4] },
}

local function falling(b, f)
  for _, l in ipairs(FALLING) do
    local q = ((f + l.offset) % N) / N
    local x = math.floor(l.x + math.sin(q * math.pi * 3 + l.offset) * 2.5 + 0.5)
    local y = math.floor(l.y + q * l.len + 0.5)
    L.set(b, x, y, l.colour)
    if (f + l.offset) % 2 == 0 then L.set(b, x + 1, y, l.colour) else L.set(b, x, y + 1, l.colour) end
  end
end

-------------------------------------------------------------------------------------------------

local base, rowan = island(), tree()
-- a few leaves already fallen on the grass
for _, l in ipairs({ { 20, 46, 1 }, { 25, 54, 3 }, { 75, 55, 2 }, { 90, 48, 5 }, { 82, 52, 4 }, { 14, 51, 2 }, { 66, 57, 1 } }) do
  L.set(base, l[1], l[2], C.fall[l[3]]); L.set(base, l[1] + 1, l[2], C.fall[l[3]])
end
picnic(base)
local mom, dad = grownUp(35, 55, C.mom, true, 0, true), grownUp(51, 55, C.dad, false, 1, false)

local function paint(f)
  local b = copy(base)
  L.blit(b, rowan, 0, 0)
  twinkle(b, rowan, f)
  L.blit(b, mom, 0, 0)
  L.blit(b, dad, 0, 0)
  L.blit(b, baby(44, 55, f % 6 < 2), 0, 0)
  falling(b, f)
  return b
end

local frames = {}
for f = 0, N - 1 do frames[#frames + 1] = paint(f) end
I.write("rowan", frames, MS, P.glow.rowan)
