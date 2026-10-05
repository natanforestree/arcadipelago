-- The Ruby Radar island for the games page (it links to Ruby Radar, Nathan's fan-made tracker for THE
-- FINALS ranked, a website rather than a game). It's painted in Ruby Radar's own look, retro pixel arcade
-- meets TV game show: a dark slate islet off its night screen, cut in facets like a gem, with teal crystal
-- in the stone and hanging under it. On top stands a little radar station: a dish on a lattice tower
-- turning once round the loop, and a booth whose screen is the scope from Ruby Radar's logo, its sweep
-- turning with the dish and a ruby blip flaring as it passes, under a game-show marquee of chasing bulbs.
-- A cluster of ruby crystals (the top 500, the sweats) glows and glints on the left, and a mast behind
-- them blinks purple signal (someone's live). Run from the repo root:
--   aseprite -b --script art/site/island-ruby-radar.lua
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local L = dofile(here .. "lib.lua")
local P = dofile(here .. "palette.lua")
local I = dofile(here .. "island.lua")
local W, H, N, MS = 108, 84, 12, 160
local C = P.rubyRadar
local S, T, G, R, V = C.slate, C.teal, C.gold, C.ruby, C.live -- ramps, dark -> light

local CX, CY, RX, RY = 54, 45, 47, 10 -- the rock's flat top
local TIPX, TIPY = 51, 70             -- where the underside narrows to

-- Light comes from the top-left, slightly toward the viewer (as on the other islands).
local LX, LY, LZ = -0.5, -0.7, 0.5
local function light(nx, ny, nz)
  return (nx * LX + ny * LY + nz * LZ) / math.sqrt(LX * LX + LY * LY + LZ * LZ)
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

-- The pixels of a straight line from (x0, y0) to (x1, y1), in order.
local function linePixels(x0, y0, x1, y1)
  local out = {}
  local dx, dy = math.abs(x1 - x0), -math.abs(y1 - y0)
  local sx, sy = (x0 < x1) and 1 or -1, (y0 < y1) and 1 or -1
  local err = dx + dy
  while true do
    out[#out + 1] = { x0, y0 }
    if x0 == x1 and y0 == y1 then break end
    local e2 = 2 * err
    if e2 >= dy then err = err + dy; x0 = x0 + sx end
    if e2 <= dx then err = err + dx; y0 = y0 + sy end
  end
  return out
end

local function line(b, x0, y0, x1, y1, c)
  for _, p in ipairs(linePixels(x0, y0, x1, y1)) do L.set(b, p[1], p[2], c) end
end

-- The flat top's lower (front) edge at column x.
local function rimBelow(x)
  local u = math.max(-1, math.min(1, (x + 0.5 - CX) / RX))
  return CY + RY * math.sqrt(1 - u * u)
end

-- The underside's centre, half-width and how far down it is (0 at the top, 1 at the tip) at row y.
local function cone(y)
  local t = (y + 0.5 - CY) / (TIPY - CY)
  return CX + (TIPX - CX) * t, (RX - 2) * (1 - math.min(1, t)) ^ 0.62, t
end

-------------------------------------------------------------------------------------------------
-- The rock (the same in every frame)

-- The underside: a lip under the rim, then a cone hanging to the tip. Its sides step in and out by their
-- own noise and its columns hang in 3 px blocks, so the bottom edge breaks like split stone.
local function inUnderside(x, y)
  if y + 0.5 < CY then return false end
  for k = 1, 3 do if ell(x, y, CX, CY + k, RX - k * 0.6, RY) then return true end end
  local yy = y - math.floor(L.rnd(math.floor(x / 3), 0, 51) * 4)
  local c, hw, t = cone(yy)
  if t > 1 then return false end
  local band = math.floor(yy / 4)
  local left = c - hw - (L.rnd(band, 1, 52) - 0.5) * 6
  local right = c + hw + (L.rnd(band, 2, 52) - 0.5) * 6
  return x + 0.5 >= left and x + 0.5 <= right
end

-- The stone's colour: big flat facets running down to the tip like a rough-cut gem's, lit on the left,
-- each facet's left edge catching the light; a lip just under the rim.
local FACETS = { -0.6, -0.18, 0.24, 0.62 } -- facet edges across the cone, -1 (left) .. 1 (right)
local function stone(x, y)
  local c, hw = cone(y)
  hw = math.max(3, hw)
  local u = (x + 0.5 - c) / hw + math.sin(y * 0.5 + x * 0.07) * 0.05
  local f, edge = 1, false
  for i, e in ipairs(FACETS) do
    if u > e then f = i + 1; edge = (u - e) * hw < 1 end
  end
  local col = ({ S[4], S[3], S[2], S[2], S[1] })[f]
  if edge then col = ({ S[5], S[4], S[3], S[3], S[2] })[f] end
  if y + 0.5 - rimBelow(x) < 3 then col = (u < 0.15) and S[3] or S[2] end -- the lip
  return col
end

-- Teal veins in the stone, top to bottom; a pulse of light runs down each one over the loop.
local VEINS = {
  { { 22, 54 }, { 25, 57 }, { 24, 60 }, { 29, 63 } },
  { { 47, 55 }, { 45, 59 }, { 48, 63 }, { 47, 66 } },
  { { 78, 55 }, { 75, 58 }, { 76, 61 } },
}
local veinPixels = {}
for i, v in ipairs(VEINS) do
  local px = {}
  for k = 1, #v - 1 do
    local seg = linePixels(v[k][1], v[k][2], v[k + 1][1], v[k + 1][2])
    for j = (k == 1) and 1 or 2, #seg do px[#px + 1] = seg[j] end
  end
  veinPixels[i] = px
end

-- A small crystal 2 or 3 px wide, pointing up (dir -1) or down (dir 1) from (x, y), lit on the left.
local function shard(b, x, y, len, wide, dir, ramp)
  local cols = wide and { -1, 0, 1 } or { 0, 1 }
  for k = 0, len - 1 do
    local tip = k >= len - (wide and 2 or 1)
    for i, dx in ipairs(cols) do
      local c = (i == 1) and ramp[3] or ((i == #cols) and ramp[1] or ramp[2])
      if not tip or dx == 0 then L.set(b, x + dx, y + dir * k, (tip and dx == 0) and ramp[2] or c) end
    end
  end
  L.set(b, x + cols[1], y + dir * ((dir < 0) and (len - (wide and 3 or 2)) or 0), ramp[4])
end

-- Teal crystal hanging under the stone (x, length, 3 px wide?) and poking out of the top (x, y, length, wide?).
local HANGING = { { 30, 3, false }, { 39, 5, true }, { 48, 6, true }, { 57, 4, false }, { 65, 5, true }, { 74, 3, false } }
local TOP_SHARDS = { { 41, 52, 3, true }, { 70, 53, 2, false }, { 95, 47, 3, false }, { 88, 51, 2, false } }

local function island()
  local b = L.buffer(W, H)
  for y = CY, TIPY + 4 do
    for x = 0, W - 1 do
      if inUnderside(x, y) then b[y][x] = stone(x, y) end
    end
  end
  for _, v in ipairs(veinPixels) do
    for j, p in ipairs(v) do
      if L.get(b, p[1], p[2]) then b[p[2]][p[1]] = (j % 3 == 0) and T[3] or T[2] end
    end
  end

  -- the flat top: slate, lit toward the back-left, darker toward the front rim, flecked
  for y = CY - RY - 1, CY + RY + 1 do
    for x = CX - RX - 1, CX + RX + 1 do
      local top, dx, dy = ell(x, y, CX, CY, RX, RY)
      if top then
        local d = math.sqrt(dx * dx + dy * dy)
        local lit = -dx * 0.55 - dy * 0.8 + (L.rnd(x, y, 53) - 0.5) * 0.3
        local c = S[3]
        if lit > 0.05 and d < 0.92 then c = S[4] end
        if lit > 0.7 and d < 0.97 then c = S[5] end
        if d > 0.86 and dy > 0.15 then c = S[3] end
        local r = L.rnd(x, y, 54)
        if r < 0.05 then c = S[2] elseif r > 0.97 then c = S[5] end
        b[y][x] = c
      end
    end
  end
  -- the back edge catches the light on the left; the front rim is a dark line
  for x = CX - RX, CX + RX do
    local u = (x + 0.5 - CX) / RX
    local yt = math.floor(CY - RY * math.sqrt(math.max(0, 1 - u * u)) + 0.5)
    if b[yt][x] and u < 0.35 then b[yt][x] = S[5] end
    local y = math.floor(rimBelow(x) + 0.5)
    if b[y] and b[y][x] and y > CY then b[y][x] = S[2] end
  end
  -- a few cracks in the top
  for _, c in ipairs({ { 12, 44, 16, 46 }, { 16, 46, 19, 46 }, { 64, 54, 68, 52 }, { 90, 42, 93, 44 }, { 45, 38, 49, 38 } }) do
    line(b, c[1], c[2], c[3], c[4], S[2])
  end

  -- teal crystal hanging from the bottom of the stone, in place of roots
  for _, h in ipairs(HANGING) do
    local y = H - 1
    while y > 0 and not b[y][h[1]] do y = y - 1 end
    shard(b, h[1], y - 1, h[2] + 1, h[3], 1, { T[1], T[3], T[4], T[5] })
  end
  L.outline(b, C.outline)
  for _, s in ipairs(TOP_SHARDS) do
    local p = L.buffer(W, H)
    shard(p, s[1], s[2], s[3], s[4], -1, { T[2], T[3], T[4], T[5] })
    L.outline(p, C.outline)
    L.blit(b, p, 0, 0)
  end
  return b
end

-- A pulse of light running down the veins: frame f lights a short stretch of each, one after another.
local function veins(b, f)
  for i, v in ipairs(veinPixels) do
    local head = ((f + i * 4) % N) / N * (#v + 4) - 2
    for j, p in ipairs(v) do
      local k = head - j
      if k >= 0 and k < 1 then b[p[2]][p[1]] = T[5]
      elseif k >= 1 and k < 2.5 then b[p[2]][p[1]] = T[4] end
    end
  end
end

-------------------------------------------------------------------------------------------------
-- The radar tower and its dish

local TX, TB, TT = 81, 47, 21  -- the tower's centre column, its base row and its top row
local PX, PY = 81.5, 16.5       -- the dish's pivot (its vertex), in pixel-centre terms
local DR, DS = 7.4, 1.7         -- the dish's radius and depth
local TILT, PITCH = math.rad(30), math.rad(12) -- the dish leans back this much; we look down this much

local function tower()
  local t = L.buffer(W, H)
  local function legAt(y, side)
    local k = (TB - y) / (TB - TT - 2)
    return math.floor(TX + side * (6 - 3 * k) + 0.5)
  end
  -- two legs leaning in, the lit one on the left, on little feet, under the cap the dish turns on; outlined
  line(t, TX - 6, TB, TX - 3, TT + 2, S[5])
  line(t, TX + 6, TB, TX + 3, TT + 2, S[3])
  t[TB][TX - 7] = S[4]; t[TB][TX + 7] = S[3]
  for x = TX - 3, TX + 3 do t[TT][x] = (x < TX) and S[5] or S[4]; t[TT + 1][x] = S[2] end
  t[TT - 1][TX] = S[4]; t[TT - 2][TX] = S[3]
  L.outline(t, C.outline)
  -- the lattice between them, thin and unoutlined: rungs, and a brace zigzagging up from one to the next
  local stops = { TB - 1, TB - 8, TB - 14, TB - 19, TT + 3 }
  for i, y in ipairs(stops) do
    if i > 1 and i < #stops then
      for x = legAt(y, -1) + 1, legAt(y, 1) - 1 do t[y][x] = S[4] end
    end
    if i < #stops then
      local y1 = stops[i + 1]
      local side = (i % 2 == 1) and -1 or 1
      line(t, legAt(y, side) - side, y - 1, legAt(y1, -side) + side, y1 + 1, S[3])
    end
  end
  return t
end

local function unit(x, y, z)
  local m = math.sqrt(x * x + y * y + z * z)
  return x / m, y / m, z / m
end

-- The dish in frame f: a paraboloid turned to the sweep's bearing (north is away from us), drawn from
-- samples of its surface, nearest first, shaded by which face we see; then its feed and outline.
local function dish(f)
  local d = L.buffer(W, H)
  local zb = {}
  local s = math.rad(-90 + 30 * f)
  local ce, se = math.cos(TILT), math.sin(TILT)
  local A = { math.cos(s) * ce, se, math.sin(s) * ce } -- the axis (x right, y up, z toward us)
  local U = { -math.cos(s) * se, ce, -math.sin(s) * se } -- across the dish, upward
  local Vv = { -math.sin(s), 0, math.cos(s) }            -- across the dish, level
  local foc = DR * DR / (4 * DS)
  local cp, sp = math.cos(PITCH), math.sin(PITCH)
  local function project(X, Y, Z)
    return math.floor(PX + X), math.floor(PY - (Y * cp - Z * sp)), Z * cp + Y * sp
  end
  local lx, ly, lz = unit(-0.5, 0.7, 0.5)
  for ri = 0, 64 do
    local r = DR * ri / 64
    for ti = 0, 358, 2 do
      local th = math.rad(ti)
      local ct, st = math.cos(th), math.sin(th)
      local rx, ry, rz = ct * U[1] + st * Vv[1], ct * U[2] + st * Vv[2], ct * U[3] + st * Vv[3]
      local h = r * r / (4 * foc)
      local x, y, depth = project(A[1] * h + rx * r, A[2] * h + ry * r, A[3] * h + rz * r)
      local key = y * W + x
      if not zb[key] or depth > zb[key] then
        zb[key] = depth
        local k = r / (2 * foc)
        local nx, ny, nz = unit(A[1] - k * rx, A[2] - k * ry, A[3] - k * rz) -- into the bowl
        local inside = ny * sp + nz * cp > 0
        local c
        if inside then
          local v = nx * lx + ny * ly + nz * lz
          c = (v > 0.6) and C.cream or ((v > 0.2) and S[6] or ((v > -0.25) and S[5] or S[4]))
          if r > DR - 0.7 then c = S[5] end -- the rim's edge
        else
          local v = -(nx * lx + ny * ly + nz * lz)
          c = (v > 0.45) and S[4] or ((v > 0) and S[3] or S[2])
          -- the back: a lit rim round four ribs out from a hub, so it reads as a dish from behind
          if r > DR - 0.9 then c = (v > 0) and S[5] or S[4]
          elseif r < 1.8 then c = S[1]
          elseif ti % 90 <= 6 or ti % 90 >= 84 then c = S[1] end
        end
        L.set(d, x, y, c)
      end
    end
  end
  -- the feed: a short arm out of the bowl along the axis, tipped with a ruby lamp
  for i = 1, 9 do
    local t = i * 0.55
    local x, y, depth = project(A[1] * t, A[2] * t, A[3] * t)
    local key = y * W + x
    if not zb[key] or depth > zb[key] + 0.3 then
      zb[key] = depth
      L.set(d, x, y, (i >= 8) and R[5] or S[2])
    end
  end
  L.outline(d, C.outline)
  return d
end

-------------------------------------------------------------------------------------------------
-- The booth: the scope on its front, three verdict lamps, and a marquee of bulbs on top

local BX0, BX1, BY0, BY1 = 42, 64, 39, 51 -- its front
local MX0, MX1, MY0, MY1 = 40, 66, 30, 38 -- the marquee, outline included
local SCX, SCY = 49.5, 45.5               -- the scope's centre (pixel 49, 45)
local BLIP = -30                          -- the blip's bearing on the scope (degrees clockwise from east)

-- How far bearing a trails behind the sweep s, going clockwise, in [0, 360).
local function behind(s, a) return (s - a) % 360 end

local function booth(f)
  local b = L.buffer(W, H)
  for y = BY0, BY1 do
    for x = BX0, BX1 do
      local c = S[2]
      if x == BX0 then c = S[3] elseif x == BX1 or y == BY1 then c = S[1] end
      if y == BY0 then c = S[1] end -- the marquee's shadow
      b[y][x] = c
    end
  end
  -- the marquee: a dark board with a gem in the middle, ringed by bulbs on a ruby band
  for y = MY0 + 1, MY1 - 1 do for x = MX0 + 1, MX1 - 1 do b[y][x] = S[1] end end
  local ring = {}
  for x = MX0 + 1, MX1 - 1 do ring[#ring + 1] = { x, MY0 + 1 } end
  for y = MY0 + 2, MY1 - 1 do ring[#ring + 1] = { MX1 - 1, y } end
  for x = MX1 - 2, MX0 + 1, -1 do ring[#ring + 1] = { x, MY1 - 1 } end
  for y = MY1 - 2, MY0 + 2, -1 do ring[#ring + 1] = { MX0 + 1, y } end
  for i, p in ipairs(ring) do
    local c = R[3]
    if i % 2 == 1 then -- a bulb: every third one lit, the lit ones chasing round clockwise
      c = ((((i - 1) // 2) - f) % 3 == 0) and G[4] or G[1]
    end
    b[p[2]][p[1]] = c
  end
  local gem = {
    ".pplrr.",
    "pplrrmm",
    ".lrrmd.",
    "..rmd..",
    "...d...",
  }
  local key = { p = R[6], l = R[5], r = R[4], m = R[3], d = R[2] }
  for row, s in ipairs(gem) do
    for col = 1, #s do
      local k = s:sub(col, col)
      if key[k] then b[MY0 + 1 + row][50 + col - 1] = key[k] end
    end
  end
  -- gold chevrons pointing at the gem, blinking in turn
  for i, cx in ipairs({ 44, 47, 62, 59 }) do
    local dir = (i <= 2) and 1 or -1
    local c = ((i % 2 == 1) == (f % 2 == 0)) and G[3] or G[2]
    b[MY0 + 3][cx] = c; b[MY0 + 4][cx + dir] = c; b[MY0 + 5][cx] = c
  end

  -- the scope: Ruby Radar's logo, its sweep on the same bearing as the dish
  local sweep = -90 + 30 * f
  local sx, sy = math.cos(math.rad(sweep)), math.sin(math.rad(sweep))
  for y = BY0, BY1 do
    for x = BX0, BX1 do
      local dx, dy = x + 0.5 - SCX, y + 0.5 - SCY
      local dd = math.sqrt(dx * dx + dy * dy)
      if dd <= 6.3 then
        local c
        local lit = (-dx - dy) / math.max(dd, 0.001) / math.sqrt(2)
        if dd > 5.5 then c = C.outline
        elseif dd > 4.6 then c = (lit > 0.35) and S[6] or ((lit > -0.35) and S[4] or S[3])
        else
          local t = behind(sweep, math.deg(math.atan(dy, dx)))
          c = S[1]
          if t < 35 then c = T[3] elseif t < 70 then c = T[2] elseif t < 100 then c = T[1] end
          local grid = (math.abs(dx) < 0.1 or math.abs(dy) < 0.1) and dd < 4
          if grid then c = (t < 100) and T[2] or S[2] end
          local along, across = dx * sx + dy * sy, math.abs(dx * sy - dy * sx)
          if along > 0 and across < 0.5 then c = (dd < 2.5) and T[4] or T[5] end
        end
        b[y][x] = c
      end
    end
  end
  b[45][49] = C.cream -- the hub
  local bx = math.floor(SCX + 3 * math.cos(math.rad(BLIP)))
  local by = math.floor(SCY + 3 * math.sin(math.rad(BLIP)))
  local age = math.floor(behind(sweep, BLIP) / 30) -- frames since the sweep crossed it
  if age == 0 then
    for _, o in ipairs({ { -1, 0 }, { 1, 0 }, { 0, -1 }, { 0, 1 } }) do b[by + o[2]][bx + o[1]] = R[4] end
    b[by][bx] = C.cream
  elseif age == 1 then
    b[by][bx] = R[5]
  elseif age <= 4 then
    b[by][bx] = R[4]
  else
    b[by][bx] = R[2]
  end

  -- the verdict lamps (queue up, coin flip, sweats): the ruby one lights when the sweep finds the blip
  local lamps = { { T[1], T[3], T[5] }, { G[1], G[2], G[4] }, { R[1], R[4], R[6] } }
  for i, ramp in ipairs(lamps) do
    local y = BY0 + 2 + (i - 1) * 3
    local on = (i == 3) and age <= 2
    local c = on and ramp[2] or ramp[1]
    b[y][60] = on and ramp[3] or c; b[y][61] = c; b[y + 1][60] = c; b[y + 1][61] = c
    if i < 3 and f % 6 == i * 2 then b[y][60] = ramp[2] end -- a flicker now and then
  end
  L.outline(b, C.outline)
  return b
end

-------------------------------------------------------------------------------------------------
-- The mast: a thin pole behind the crystals, its beacon and purple signal arcs blinking in turn

local MASTX, MASTB, MASTT = 14, 43, 22

local ARCS = {
  inner = { { 3, -1 }, { 4, 0 }, { 4, 1 }, { 3, 2 } },
  outer = { { 5, -3 }, { 6, -2 }, { 7, -1 }, { 7, 0 }, { 7, 1 }, { 7, 2 }, { 6, 3 }, { 5, 4 } },
}

local function mast(f)
  local m = L.buffer(W, H)
  for y = MASTT + 2, MASTB do m[y][MASTX] = S[5] end
  -- guy wires
  line(m, MASTX - 1, MASTT + 9, MASTX - 4, MASTB - 1, S[3])
  line(m, MASTX + 1, MASTT + 9, MASTX + 4, MASTB - 1, S[3])
  local phase = f % 6 -- 0-1 the beacon flashes, 2-3 the inner arcs, 4-5 the outer arcs
  for x = MASTX - 1, MASTX + 1 do
    m[MASTT][x] = (phase < 2) and V[3] or V[2]
    m[MASTT + 1][x] = (phase < 2) and V[2] or V[1]
  end
  if phase < 2 then m[MASTT][MASTX - 1] = C.cream end
  L.outline(m, C.outline)
  local function arcs(set, c)
    for _, o in ipairs(ARCS[set]) do
      L.set(m, MASTX + o[1], MASTT + o[2], c); L.set(m, MASTX - o[1], MASTT + o[2], c)
    end
  end
  if phase == 2 or phase == 3 then arcs("inner", (phase == 2) and V[3] or V[2]) end
  if phase == 4 or phase == 5 then arcs("outer", (phase == 4) and V[3] or V[2]); arcs("inner", V[1]) end
  return m
end

-------------------------------------------------------------------------------------------------
-- The ruby crystals: they glow brighter and dimmer over the loop, light the rock round them, and glint

local CRYSTALS = { -- base x, base y, length, half-width, lean (x per pixel up); back to front
  { 21, 45, 13, 2.5, -0.22 },
  { 29, 46, 18, 3.0, 0.06 },
  { 35, 48, 11, 2.5, 0.32 },
  { 17, 49, 8, 2.0, -0.45 },
  { 25, 51, 9, 2.5, -0.08 },
  { 32, 52, 6, 2.0, 0.25 },
}

local function crystalAxis(c)
  local m = math.sqrt(1 + c[5] * c[5])
  local dx, dy = c[5] / m, -1 / m
  return dx, dy, -dy, dx -- along (base to tip), and across (to the right)
end

-- One crystal, glowing at g (0..1): three faces up the body, lit left, dark right, and two facets at the
-- point; a bright core up the middle when it glows.
local function crystal(c, g)
  local bx, by, len, hw = c[1], c[2], c[3], c[4]
  local dx, dy, nx, ny = crystalAxis(c)
  local tip = hw * 1.6
  local body = len - tip
  local p = L.buffer(W, H)
  for y = by - len - 2, by + 1 do
    for x = bx - len, bx + len do
      local rx, ry = x - bx, y - by
      local along, across = rx * dx + ry * dy, rx * nx + ry * ny
      local w = (along <= body) and hw or hw * (1 - (along - body) / tip)
      if along >= -0.5 and along <= len and math.abs(across) <= w + 0.01 then
        local u = across / hw
        local col
        if along > body then
          col = (u < -0.05) and R[6] or ((u < 0.3) and R[4] or R[3])
        elseif u < -0.35 then col = R[5]
        elseif u < 0.35 then
          col = R[4]
          if along > body * 0.25 and along < body * 0.9 and math.abs(u + 0.05) < 0.25 then
            col = (g > 0.7) and R[6] or ((g > 0.3) and R[5] or R[4]) -- the glowing core
          end
        else col = (g > 0.7) and R[4] or R[3] end
        if along < 1.5 then col = (u < 0.35) and R[3] or R[2] end -- where it grows out of the rock
        L.set(p, x, y, col)
      end
    end
  end
  L.outline(p, C.outline)
  return p
end

local function glowLevel(f) return (1 - math.cos(2 * math.pi * f / N)) / 2 end

-- The crystals' red light on the rock round their feet, reaching further as they glow.
local function rubyLight(b, g)
  local lit = { [S[1]] = C.rubyLit[1], [S[2]] = C.rubyLit[2], [S[3]] = C.rubyLit[3], [S[4]] = C.rubyLit[4],
    [S[5]] = C.rubyLit[4] }
  local rx, ry = 13 + 3 * g, 4 + 1.2 * g
  for y = 38, 56 do
    for x = 4, 48 do
      local inside, dx, dy = ell(x, y, 27, 49, rx, ry)
      local c = b[y][x]
      if inside and c and lit[c] then
        local d = dx * dx + dy * dy
        if d < 0.55 or L.bayer(x, y) > (d - 0.55) / 0.45 then b[y][x] = lit[c] end
      end
    end
  end
end

local GLINTS = { { 2, 0.72, 0 }, { 1, 0.6, 4 }, { 3, 0.55, 8 } } -- crystal, how far up it, first frame
-- Motes of red light drifting up off the crystals, each for half the loop: x, start row, first frame.
local MOTES = { { 27, 30, 0 }, { 34, 33, 3 }, { 19, 33, 6 }, { 31, 27, 9 } }

local function crystals(b, f)
  local g = glowLevel(f)
  rubyLight(b, g)
  local layer = L.buffer(W, H)
  for _, c in ipairs(CRYSTALS) do L.blit(layer, crystal(c, g), 0, 0) end
  L.blit(b, layer, 0, 0)
  for i, m in ipairs(MOTES) do
    local age = (f - m[3]) % N
    if age < 6 then
      local x = m[1] + ((age + i) % 4 < 2 and 0 or 1)
      L.set(b, x, m[2] - age, (age < 2) and R[6] or ((age < 4) and R[5] or R[4]))
    end
  end
  -- glints: a sparkle opens and closes on a crystal's lit edge, one crystal after another
  for _, gl in ipairs(GLINTS) do
    local c = CRYSTALS[gl[1]]
    local dx, dy, nx, ny = crystalAxis(c)
    local a = c[3] * gl[2]
    local x = math.floor(c[1] + dx * a - nx * c[4] + 0.5)
    local y = math.floor(c[2] + dy * a - ny * c[4] + 0.5)
    local age = (f - gl[3]) % N
    if age == 0 or age == 2 then
      L.set(b, x, y, R[6])
    elseif age == 1 then
      for _, o in ipairs({ { 1, 0 }, { -1, 0 }, { 0, 1 }, { 0, -1 } }) do L.set(b, x + o[1], y + o[2], R[6]) end
      for _, o in ipairs({ { 2, 0 }, { -2, 0 }, { 0, 2 }, { 0, -2 } }) do L.set(b, x + o[1], y + o[2], R[5]) end
      L.set(b, x, y, C.cream)
    end
  end
end

-------------------------------------------------------------------------------------------------

local base, frame = island(), tower()

local function paint(f)
  local b = copy(base)
  veins(b, f)
  L.blit(b, mast(f), 0, 0)
  L.blit(b, frame, 0, 0)
  L.blit(b, dish(f), 0, 0)
  L.blit(b, booth(f), 0, 0)
  crystals(b, f)
  return b
end

local frames = {}
for f = 0, N - 1 do frames[#frames + 1] = paint(f) end
I.write("ruby-radar", frames, MS, P.glow["ruby-radar"])
