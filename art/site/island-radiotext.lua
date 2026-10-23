-- The Radiotext island for the games page (it links to Radiotext, Nathan's Teletext-style internet radio
-- for noise rock, sludge, post-punk and other obscure music, a website rather than a game). A little
-- charcoal islet with an old walnut-cabinet TV on it, tuned to Teletext: a blue title band with yellow
-- block letters, cyan lines and the Fastext keys on black, flipping to the next page every couple of
-- seconds. Beside it stands the radio mast from Radiotext's icon, a yellow lattice whose red beacon blinks
-- and sends cyan signal arcs pulsing out. Antenna cables dangle under the stone where other islands have
-- roots. The screen, the mast and the signal are pure Teletext colours. It's under 40 px tall, so eight
-- islands fit the portrait stage. Run from the repo root:
--   aseprite -b --script art/site/island-radiotext.lua
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local L = dofile(here .. "lib.lua")
local P = dofile(here .. "palette.lua")
local I = dofile(here .. "island.lua")
local W, H, N, MS = 90, 46, 36, 160
local C = P.radiotext
local S, WD, G, T = C.stone, C.wood, C.grass, C.tt -- ramps dark -> light; the eight Teletext colours

local CX, CY, RX, RY = 45, 26, 40, 5 -- the flat top
local TIPY = 40                     -- the underside's lowest row

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

-------------------------------------------------------------------------------------------------
-- The islet (the same in every frame): a charcoal slab, its underside hanging in a shallow, ragged point

-- How far down the stone hangs in each column: deepest in the middle, its columns breaking in 3 px blocks.
local BOTTOM = {}
for x = 0, W - 1 do
  local u = (x + 0.5 - CX) / RX
  if math.abs(u) < 1 then
    local rim = rimBelow(x)
    local depth = 2 + (TIPY - rim - 2) * (1 - math.abs(u)) ^ 0.8
    depth = depth + (L.rnd(math.floor((x + 1) / 3), 0, 71) - 0.5) * 3
    BOTTOM[x] = math.min(TIPY, math.floor(rim + depth + 0.5))
  end
end

-- The stone's colour: lit on the left, darker to the right and toward the bottom, dithered between steps.
local function stone(x, y)
  local u = (x + 0.5 - CX) / RX
  local rim = rimBelow(x)
  local v = (y + 0.5 - rim) / math.max(1, BOTTOM[x] + 1 - rim)
  local k = (u + 1) * 0.42 + v * 0.55 + 0.09 * math.sin(x * 1.3 + y * 0.7)
  local even = (x + y) % 2 == 0
  local c
  if k < 0.3 then c = S[3] elseif k < 0.4 then c = even and S[3] or S[2]
  elseif k < 0.75 then c = S[2] elseif k < 0.88 then c = even and S[2] or S[1]
  else c = S[1] end
  if y == BOTTOM[x] and u > -0.4 then c = S[1] end -- the shaded lower lip
  return c
end

-- Antenna cables under the stone, where other islands have roots: two hanging loose from a column, each a
-- path of steps down from it ending in a brass plug, and a loop slung between two columns (x0, x1, its sag).
local CABLES = {
  { 19, { { 0, 1 }, { 0, 2 }, { 1, 3 }, { 1, 4 } } },
  { 71, { { 0, 1 }, { -1, 2 }, { -1, 3 } } },
}
local LOOP = { 40, 47, 3 }

local function islet()
  local b = L.buffer(W, H)
  for x = 0, W - 1 do
    if BOTTOM[x] then for y = CY, BOTTOM[x] do b[y][x] = stone(x, y) end end
  end
  local lowest = H - I.MARGIN - 2 -- the lowest row anything opaque may reach, leaving a row for the outline
  for _, cb in ipairs(CABLES) do
    local x, y = cb[1], BOTTOM[cb[1]]
    for i, o in ipairs(cb[2]) do
      local last = i == #cb[2] or y + cb[2][i + 1][2] > lowest
      L.set(b, x + o[1], y + o[2], last and C.brass or S[4])
      if last then break end
    end
  end
  local x0, x1, sag = LOOP[1], LOOP[2], LOOP[3]
  local prev
  for x = x0, x1 do
    local t = (x - x0) / (x1 - x0)
    local y = math.floor(BOTTOM[x0] + (BOTTOM[x1] - BOTTOM[x0]) * t + sag * 4 * t * (1 - t) + 0.5)
    y = math.min(lowest, y)
    if prev then line(b, x - 1, prev, x, y, S[4]) else L.set(b, x, y, S[4]) end
    prev = y
  end

  -- the flat top: charcoal, lit toward the back-left, flecked, with a dark line along its front rim
  for y = CY - RY - 1, CY + RY + 1 do
    for x = CX - RX - 1, CX + RX + 1 do
      local top, dx, dy = ell(x, y, CX, CY, RX, RY)
      if top then
        local d = math.sqrt(dx * dx + dy * dy)
        local lit = -dx * 0.6 - dy * 0.7 + (L.rnd(x, y, 72) - 0.5) * 0.35
        local c = S[2]
        if lit > 0.3 and d < 0.95 then c = S[3] end
        local r = L.rnd(x, y, 73)
        if r < 0.06 then c = S[1] elseif r > 0.96 then c = S[3] end
        b[y][x] = c
      end
    end
  end
  for x = CX - RX, CX + RX do
    local u = (x + 0.5 - CX) / RX
    if math.abs(u) < 1 then
      local yt = math.floor(CY - RY * math.sqrt(1 - u * u) + 0.5)
      if b[yt] and b[yt][x] and u < 0.3 then b[yt][x] = S[4] end -- the back edge catches the light
      local y = math.floor(rimBelow(x) + 0.5)
      if b[y] and b[y][x] and u > -0.85 then b[y][x] = S[1] end
    end
  end
  -- a little grass in the cracks: clumps (x, y, half-width), each with a blade or two sticking up
  for _, g in ipairs({ { 10, 26, 2 }, { 49, 29, 2 }, { 78, 25, 2 }, { 73, 29, 1 } }) do
    for x = g[1] - g[3], g[1] + g[3] do
      L.set(b, x, g[2], (x < g[1]) and G[3] or G[2])
      if L.rnd(x, g[2], 74) < 0.5 then L.set(b, x, g[2] - 1, G[3]) end
    end
    L.set(b, g[1], g[2] - 1, G[3])
    L.set(b, g[1] + 1, g[2] - 2, G[3])
  end
  L.outline(b, C.outline)
  return b
end

-------------------------------------------------------------------------------------------------
-- The TV: a chunky walnut cabinet on splayed legs, a chrome-rimmed screen, two knobs and a grille

local TX, TY = 15, 13 -- the cabinet front's top-left; it's 27 x 16, with 2 px of side to its right
local SX, SY, SW, SH = 18, 15, 15, 10 -- the screen

local function tv()
  local t = L.buffer(W, H)
  for y = TY, TY + 15 do
    for x = TX, TX + 26 do
      local c = WD[3]
      if x == TX then c = WD[4] elseif y == TY + 15 then c = WD[2] end
      t[y][x] = c
    end
  end
  for x = TX + 1, TX + 27 do t[TY - 1][x] = WD[4] end -- the top
  for y = TY, TY + 14 do t[y][TX + 27] = WD[2]; t[y][TX + 28] = WD[1] end -- the side, in shade
  -- the walnut's grain
  for _, g in ipairs({ { TX + 1, TY + 4, 1 }, { TX + 1, TY + 10, 1 }, { TX + 5, TY + 14, 7 }, { TX + 21, TY + 1, 4 },
    { TX + 16, TY + 14, 3 } }) do
    for x = g[1], g[1] + g[3] - 1 do t[g[2]][x] = WD[2] end
  end
  -- the screen's chrome rim: lit along the top and left
  for y = SY - 1, SY + SH do
    for x = SX - 1, SX + SW do
      local c = S[3]
      if y == SY - 1 or x == SX - 1 then c = S[4] elseif y == SY + SH or x == SX + SW then c = S[2] end
      t[y][x] = c
    end
  end
  -- two knobs and the speaker grille on the right
  for _, ky in ipairs({ TY + 3, TY + 7 }) do
    t[ky - 1][TX + 22] = S[4]
    t[ky][TX + 21] = S[4]; t[ky][TX + 22] = S[3]; t[ky][TX + 23] = S[2]
    t[ky + 1][TX + 22] = S[2]
  end
  for _, gy in ipairs({ TY + 10, TY + 12 }) do
    for x = TX + 20, TX + 24 do t[gy][x] = WD[1] end
  end
  -- splayed legs
  t[TY + 16][TX + 2] = WD[2]; t[TY + 17][TX + 1] = WD[2]
  t[TY + 16][TX + 25] = WD[2]; t[TY + 17][TX + 26] = WD[1]
  L.outline(t, C.outline)
  return t
end

-- The Teletext pages, 15 x 10: K black, R red, G green, Y yellow, B blue, M magenta, C cyan, W white.
-- Row 0 is the header (the page number, and the clock on the right); the last row is the Fastext keys.
local PAGES = {
  { -- Radiotext's front page: the blue title band with yellow lettering, and two lines of cyan
    "WKWWWKKKKKKWWKW",
    "BBBBBBBBBBBBBBB",
    "BYYBYYBYYBYBYYB",
    "BYBBYBBYBBYBYBB",
    "BBBBBBBBBBBBBBB",
    "KKKKKKKKKKKKKKK",
    "KCCCCKCCCKCCCCK",
    "KKKKKKKKKKKKKKK",
    "KCCCKCCCCCKCCKK",
    "KRRKGGGKYYKCCCK",
  },
  { -- now playing: a magenta band, white lettering and a level meter (its bars jump every other frame)
    "WKWWKKKKKKKWWKW",
    "MMMMMMMMMMMMMMM",
    "MWWMWMWWMWWMWMM",
    "MWMMWMWMMWMMWWM",
    "MMMMMMMMMMMMMMM",
    "KKKKKKKKKKKKKKK",
    "KKKKKKKKKKKKKKK",
    "KKKKKKKKKKKKKKK",
    "KKKKKKKKKKKKKKK",
    "KRRKGGGKYYKCCCK",
  },
  { -- the stations: a narrower cyan band with blue lettering, and a list, its numbers in yellow
    "WKWWWWKKKKKWWKW",
    "CCCCCCCCCCCCCCC",
    "CBBCBCBBCBBCBCC",
    "CCCCCCCCCCCCCCC",
    "KKKKKKKKKKKKKKK",
    "KYYKWWWKWWWWKKK",
    "KKKKKKKKKKKKKKK",
    "KYYKWWKWWWWWWKK",
    "KKKKKKKKKKKKKKK",
    "KRRKGGGKYYKCCCK",
  },
}
local KEY = { K = T.black, R = T.red, G = T.green, Y = T.yellow, B = T.blue, M = T.magenta, C = T.cyan, W = T.white }

-- The page showing in frame f. A new page comes up every 12 frames (just after the signal has gone out),
-- drawing in from the top over two frames as a Teletext set does.
local function screen(b, f)
  local page = ((f + 4) // 12) % #PAGES + 1
  local since = (f + 4) % 12
  local rows = (since == 0) and 5 or ((since == 1) and 7 or SH)
  local p = PAGES[page]
  for y = 0, SH - 1 do
    for x = 0, SW - 1 do
      local ch = (y < rows) and p[y + 1]:sub(x + 1, x + 1) or "K"
      b[SY + y][SX + x] = KEY[ch]
    end
  end
  -- the clock's last digit ticks over about once a second
  if (f // 6) % 2 == 1 then b[SY][SX + SW - 1] = T.black; b[SY][SX + SW - 2] = T.white end
  if page == 2 then
    -- the level meter: seven bars, green, then yellow, then red at the top (drawn in with the rest)
    for i = 0, 6 do
      local h = 1 + math.floor(L.rnd(i, f // 2, 75) * 4)
      for k = 0, h - 1 do
        if 8 - k < rows then b[SY + 8 - k][SX + 1 + i * 2] = (k >= 3) and T.red or ((k >= 2) and T.yellow or T.green) end
      end
    end
  end
  -- the glass's corners round off
  for _, c in ipairs({ { SX, SY }, { SX + SW - 1, SY }, { SX, SY + SH - 1 }, { SX + SW - 1, SY + SH - 1 } }) do
    b[c[2]][c[1]] = S[3]
  end
end

-------------------------------------------------------------------------------------------------
-- The mast: Radiotext's icon, a yellow lattice with a red beacon, sending out cyan arcs

local MX, MY, MP, MB = 64, 6, 10, 27 -- its centre column, the beacon's row, the top of the lattice, its base
local AY = MY + 3                     -- the row the signal arcs are centred on

local function legAt(y, side)
  return math.floor(MX + side * (1 + 5 * (y - MP) / (MB - MP)) + 0.5)
end

local function mast()
  local m = L.buffer(W, H)
  line(m, legAt(MB, -1), MB, legAt(MP, -1), MP, T.yellow)
  line(m, legAt(MB, 1), MB, legAt(MP, 1), MP, T.yellow)
  for x = MX - 1, MX + 1 do m[MP][x] = T.yellow end
  for y = MY + 1, MP - 1 do m[y][MX] = T.yellow end
  m[MY][MX] = C.beaconOff
  L.outline(m, C.outline)
  return m
end

-- The lattice between the legs, thin and unoutlined: rungs, and a brace zigzagging down between them.
local function lattice(b)
  local stops = { MP, MP + 4, MP + 9, MB - 1 }
  for i, y in ipairs(stops) do
    if i > 1 and i < #stops then
      for x = legAt(y, -1) + 1, legAt(y, 1) - 1 do b[y][x] = T.yellow end
    end
    if i < #stops then
      local y1 = stops[i + 1]
      local side = (i % 2 == 1) and -1 or 1
      line(b, legAt(y, side), y, legAt(y1, -side), y1, T.yellow)
    end
  end
end

-- The signal arcs: rings round the beacon, cut off above and below so they open sideways like the icon's.
local RINGS = {}
for k, r in ipairs({ 4, 6.8, 9.6 }) do
  local px = {}
  for dy = -5, 5 do
    for dx = 2, 11 do
      local d = math.sqrt(dx * dx + dy * dy)
      if math.abs(d - r) < 0.5 and math.abs(dy) <= dx * 1.2 then px[#px + 1] = { dx, dy } end
    end
  end
  RINGS[k] = px
end

-- Every 12 frames the beacon flashes, and a ring of signal goes out from it, a step every two frames,
-- breaking up as it goes.
local function signal(b, f)
  local c = f % 12
  if c <= 1 then
    b[MY][MX] = T.red
    if c == 0 then
      for _, o in ipairs({ { -1, 0 }, { 1, 0 }, { 0, -1 } }) do L.set(b, MX + o[1], MY + o[2], T.red) end
    end
  end
  local k = (c + 1) // 2
  if k >= 1 and k <= #RINGS then
    local broken = c % 2 == 0
    for i, p in ipairs(RINGS[k]) do
      if not broken or i % 2 == 1 then
        L.set(b, MX + p[1], AY + p[2], T.cyan)
        L.set(b, MX - p[1], AY + p[2], T.cyan)
      end
    end
  end
end

-------------------------------------------------------------------------------------------------

local base = islet()
-- the antenna cable from the back of the TV to the foot of the mast, slack across the stone
for _, p in ipairs({ { 44, 24 }, { 45, 25 }, { 46, 25 }, { 47, 26 }, { 48, 26 }, { 49, 26 }, { 50, 27 }, { 51, 27 },
  { 52, 27 }, { 53, 27 }, { 54, 26 }, { 55, 26 }, { 56, 26 }, { 57, 25 }, { 58, 25 } }) do
  base[p[2]][p[1]] = C.outline
end
L.blit(base, tv(), 0, 0)
L.blit(base, mast(), 0, 0)
lattice(base)

local frames = {}
for f = 0, N - 1 do
  local b = copy(base)
  screen(b, f)
  signal(b, f)
  frames[#frames + 1] = b
end
I.write("radiotext", frames, MS, P.glow.radiotext)
