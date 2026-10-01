-- The station at rush hour in the flat style, for the sprite sheet (sprites.lua): an old train shed
-- seen across the track, in layers drawn back to front over the sky (render.js draws the sky's bands,
-- as for the park):
--   the far city through the arches, in each stage of the sky's colours;
--   the hall: the brick wall and its arched windows, the far platform and the track, and the glass
--     roof on its iron ribs (the sky shows through the glass and the arches);
--   the train's cars, doors shut or open, which pull in and out between the hall and the front;
--   the front: the iron pillars, the globe lamps, the departure board and the clock (their rows and
--     hands are drawn by render.js), the bench, and the near platform you play on, in pale stone.
-- Everything is laid out round the park's positions: you on your crate, the path the people walk at
-- y 146, the listeners' arc, the case.
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local D = dofile(here .. "draw.lua")
local L, C, rect, oval = D.L, D.C, D.rect, D.oval
local W, H = D.W, D.H
local set = L.set
local S = {}

S.GIRDER = 30 -- the roof's deep girder: its top row
S.WALL_TOP = 36
S.ARCHES = { { 64, 34 }, { 160, 34 }, { 256, 34 } } -- the arched windows: centre x, half width
S.ARCH_TOP, S.ARCH_BOTTOM = 46, 102
S.TRAIN_TOP, S.TRAIN_BOTTOM = 80, 124 -- a car's top and bottom rows
S.CAR = 108 -- a car's length; the cars are 4 pixels apart (scene.js TRAIN.car is 112)
S.EDGE = 126 -- the near platform's edge, which hides the train's wheels
S.BOARD = { 34, 44, 98, 66 } -- the departure board: x0, y0, x1, y1 (its rows: render.js)
S.CLOCK = { 238, 52, 9 } -- the clock: its middle and radius (its hands: render.js)

-- The far rooftops seen through the arches: { x0, x1, top }.
local CITY = { { 0, 30, 92 }, { 31, 46, 86 }, { 47, 70, 96 }, { 71, 90, 84 }, { 91, 120, 94 }, { 121, 140, 88 },
  { 141, 170, 98 }, { 171, 186, 90 }, { 187, 214, 95 }, { 215, 240, 85 }, { 241, 262, 92 }, { 263, 290, 88 }, { 291, 319, 96 } }

local function inArch(x, y)
  for _, a in ipairs(S.ARCHES) do
    local cx, hw = a[1], a[2]
    if x >= cx - hw and x <= cx + hw and y <= S.ARCH_BOTTOM then
      local top = S.ARCH_TOP + hw
      if y >= top then return true end
      if y >= S.ARCH_TOP and D.inOval(x, y, cx + 0.5, top, hw + 0.5, hw) then return true end
    end
  end
  return false
end

-- The far city through the arches, in the nearest band's colours of one stage of the sky.
function S.city(b, stage)
  for _, r in ipairs(CITY) do
    for y = r[3], S.ARCH_BOTTOM do
      for x = r[1], r[2] do
        if inArch(x, y) then b[y][x] = stage[3] end
      end
    end
  end
end

-- The hall behind the train. Where nothing is drawn (the glass and the arches), the sky shows.
function S.hall(b)
  -- the far wall in brown brick, with a lighter frame round each arch
  for y = S.WALL_TOP, S.ARCH_BOTTOM do
    for x = 0, W - 1 do
      if not inArch(x, y) then
        local near = inArch(x - 2, y) or inArch(x + 2, y) or inArch(x, y - 2) or inArch(x, y + 2)
        b[y][x] = near and C.wood[2] or ((y % 6 == 0) and C.brown[1] or C.brown[2])
      end
    end
  end
  -- the glazing bars across the arches
  for _, a in ipairs(S.ARCHES) do
    local cx, hw = a[1], a[2]
    for y = S.ARCH_TOP, S.ARCH_BOTTOM do
      for x = cx - hw, cx + hw do
        if inArch(x, y) and ((x - cx) % 12 == 0 or (y - S.ARCH_TOP) % 14 == 0) then b[y][x] = C.charcoal end
      end
    end
  end
  -- the far platform, its yellow edge, and the track in front of it
  rect(b, 0, 103, W - 1, 110, C.path[2])
  rect(b, 0, 103, W - 1, 103, C.path[3])
  rect(b, 0, 110, W - 1, 111, C.yellow[1])
  rect(b, 0, 112, W - 1, S.EDGE - 1, C.path[1])
  for x = 2, W - 1, 9 do rect(b, x, 119, x + 5, 120, C.wood[1]) end
  rect(b, 0, 117, W - 1, 117, C.coat[2])
  rect(b, 0, 118, W - 1, 118, C.coat[1])
  -- the roof: iron ribs and purlins over the glass, and the deep girder with its rivets
  for y = 0, S.GIRDER - 1 do
    for x = 0, W - 1 do
      if x % 40 < 3 then b[y][x] = C.ink
      elseif y % 9 == 8 then b[y][x] = C.charcoal end
    end
  end
  rect(b, 0, S.GIRDER, W - 1, S.WALL_TOP - 1, C.ink)
  rect(b, 0, S.GIRDER, W - 1, S.GIRDER, C.charcoal)
  for x = 4, W - 1, 8 do set(b, x, S.GIRDER + 3, C.coat[1]) end
end

-- One car of the commuter train, its left end at x 0: teal, with a cream stripe, lit windows, and its
-- doors shut or open.
function S.car(b, open)
  local x0, x1, top, bottom = 0, S.CAR - 1, S.TRAIN_TOP, S.TRAIN_BOTTOM
  rect(b, x0 + 2, top, x1 - 2, top, C.coat[1]) -- the roof's curve
  rect(b, x0, top + 1, x1, top + 3, C.coat[2])
  rect(b, x0, top + 4, x1, bottom, C.teal[2])
  rect(b, x0, top + 26, x1, top + 27, C.light) -- the stripe
  rect(b, x0, top + 34, x1, bottom, C.teal[1])
  for wx = x0 + 6, x1 - 14, 16 do
    if ((wx - x0 - 6) // 16) % 3 == 1 then -- a door
      if open then
        rect(b, wx - 2, top + 8, wx + 11, bottom, C.ink)
        rect(b, wx - 2, top + 8, wx + 11, top + 9, C.yellow[1])
      else
        rect(b, wx - 2, top + 8, wx + 11, bottom, C.teal[1])
        rect(b, wx + 4, top + 8, wx + 5, bottom, C.ink)
        rect(b, wx, top + 11, wx + 2, top + 20, C.yellow[2])
        rect(b, wx + 7, top + 11, wx + 9, top + 20, C.yellow[2])
      end
    else -- a window
      rect(b, wx, top + 10, wx + 9, top + 21, C.ink)
      rect(b, wx + 1, top + 11, wx + 8, top + 20, C.yellow[2])
      rect(b, wx + 1, top + 11, wx + 8, top + 12, C.light)
    end
  end
end

-- The near platform: its edge and yellow line, then pale stone slabs in rows that widen toward you.
local ROWS = { 130, 135, 141, 148, 156, 165, 180 }
local function platform(b)
  rect(b, 0, S.EDGE - 1, W - 1, S.EDGE - 1, C.ink)
  rect(b, 0, S.EDGE, W - 1, S.EDGE + 1, C.path[3])
  rect(b, 0, S.EDGE + 2, W - 1, S.EDGE + 3, C.yellow[2])
  for r = 1, #ROWS - 1 do
    local y0, y1 = ROWS[r], ROWS[r + 1] - 1
    local sw = 14 + r * 4
    for y = y0, y1 do
      for x = 0, W - 1 do
        local sx = x - math.floor((x - 160) * (r - 1) * 0.04)
        local joint = (y == y1) or (sx % sw == 0)
        local alt = ((sx // sw) + r) % 2 == 0
        b[y][x] = joint and C.stone[1] or (alt and C.stone[3] or C.stone[2])
      end
    end
  end
end

-- What stands in front of the train: the pillars, the lamps, the board and the clock hanging from the
-- girder, the bench, and the near platform.
function S.front(b)
  for _, x in ipairs({ 18, 300 }) do -- the iron pillars, each with a capital and a foot
    rect(b, x - 3, S.WALL_TOP, x + 2, 132, C.charcoal)
    rect(b, x + 1, S.WALL_TOP, x + 2, 132, C.ink)
    rect(b, x - 6, S.WALL_TOP, x + 5, S.WALL_TOP + 2, C.charcoal)
    rect(b, x - 5, S.WALL_TOP + 3, x + 4, S.WALL_TOP + 3, C.ink)
    rect(b, x - 5, 128, x + 4, 132, C.charcoal)
    rect(b, x + 2, 128, x + 4, 132, C.ink)
  end
  for _, x in ipairs({ 120, 196 }) do -- the globe lamps, lit for the evening
    rect(b, x, S.WALL_TOP, x, 46, C.ink)
    rect(b, x - 2, 47, x + 2, 47, C.ink)
    oval(b, x + 0.5, 51.5, 4, 4, C.yellow[2])
    oval(b, x - 0.5, 50.5, 2, 2, C.light)
  end
  local x0, y0, x1, y1 = S.BOARD[1], S.BOARD[2], S.BOARD[3], S.BOARD[4] -- the board on its two rods
  rect(b, x0 + 8, S.WALL_TOP, x0 + 8, y0 - 1, C.ink)
  rect(b, x1 - 8, S.WALL_TOP, x1 - 8, y0 - 1, C.ink)
  rect(b, x0, y0, x1, y1, C.ink)
  rect(b, x0, y1, x1, y1, C.charcoal)
  local cx, cy, r = S.CLOCK[1], S.CLOCK[2], S.CLOCK[3] -- the clock: its rod, rim, face and hours
  rect(b, cx, S.WALL_TOP, cx, cy - r - 1, C.ink)
  oval(b, cx + 0.5, cy + 0.5, r + 1.5, r + 1.5, C.ink)
  oval(b, cx + 0.5, cy + 0.5, r - 0.5, r - 0.5, C.light)
  for k = 0, 11 do
    local a = k / 12 * math.pi * 2
    set(b, cx + math.floor(math.sin(a) * (r - 2) + 0.5), cy - math.floor(math.cos(a) * (r - 2) + 0.5), C.coat[1])
  end
  platform(b)
  rect(b, 28, 116, 56, 118, C.wood[2]) -- the bench at the back of the platform
  rect(b, 28, 124, 56, 125, C.wood[2])
  rect(b, 28, 126, 56, 126, C.wood[1])
  rect(b, 30, 127, 31, 133, C.ink)
  rect(b, 53, 127, 54, 133, C.ink)
end

return S
