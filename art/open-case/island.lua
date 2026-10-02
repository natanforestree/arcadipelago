-- One Tree Island at sunrise in the flat style, for the sprite sheet (sprites.lua), in layers drawn back
-- to front over the sky (render.js draws the sky's bands, the sun, and the glints on the water):
--   the far shore's pines, in each stage of the sunrise's colours;
--   the lake, from the far shore down, in each stage's colours, the horizon's colour along its far edge;
--   the dawn mist, a streak at a time (render.js leaves them off one by one as it lifts);
--   the fish that jumps at a loud note, and its splash;
--   the island: its grass running across the screen and on out of it either side, its sandy shore,
--     the reeds, the rock and the lily pads in the water just off it, and the rowboat pulled up on it;
--   the one pine: its branches over your head, and its trunk, which render.js draws among the figures
--     so the animals passing behind it pass behind it.
-- Everything is laid out round the park's positions: you on your crate, the case at your feet, and
-- the land animals walking along the island at y 146, as people walk the park's path, the swimmers
-- out on the lake behind its shore. They settle on tuning.js ISLAND.spots: three on the pine's branches, four on the
-- grass round you, two in the shallows, one on the rock and one on the lily pad.
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local D = dofile(here .. "draw.lua")
local L, C, rect, oval, stamp = D.L, D.C, D.rect, D.oval, D.stamp
local W, H = D.W, D.H
local set = L.set
local I = {}

I.SHORE = 100 -- the lake's far edge: the far shore's pines stand on it
I.SUN = { 66, 120 } -- the sun's middle before it comes up, hidden by the lake (scene.js sunUp lifts it)
I.TRUNK_FEET = 147 -- the row the pine's trunk stands on, to sort it among the figures
I.ROCK = { 290, 136 } -- the turtle's rock, in the water off the shore: its middle
I.LILY = { 22, 137 } -- the frog's lily pad: its middle

-- The sunrise's five stages, before dawn to morning: each its seven bands' colours, top to horizon.
-- The dusk's colours, then the morning's blues.
function I.stages()
  local s, n, m = C.sky, C.night, C.morning
  return {
    { n[3], n[3], n[2], n[2], n[1], s[1], s[2] },
    { n[2], n[1], s[1], s[2], s[3], s[4], s[5] },
    { n[1], s[2], s[3], s[4], s[5], s[6], s[7] },
    { m[1], m[2], s[4], s[5], s[6], s[7], s[7] },
    { m[1], m[1], m[2], m[2], m[3], m[3], s[7] },
  }
end

-- Each stage's far pines (the back row, then the front) and its lake (the water, then its ripples).
local SHORE_COLOURS = {
  { C.night[2], C.night[3] }, { C.night[1], C.night[2] }, { C.sky[2], C.night[1] }, { C.coat[1], C.leaf[1] }, { C.leaf[2], C.leaf[1] },
}
local LAKE_COLOURS = {
  { C.night[2], C.night[1] }, { C.night[1], C.sky[2] }, { C.sky[2], C.sky[4] }, { C.lake[1], C.lake[2] }, { C.lake[2], C.morning[2] },
}

-- A far pine: a narrow stepped spire from its top down to the shore, `w` across at its foot.
local function farPine(b, cx, top, w, c)
  for y = top, I.SHORE - 1 do
    local hw = math.floor((y - top) / (I.SHORE - top) * w / 2 + 0.5)
    if (y - top) % 4 == 3 then hw = hw + 1 end -- the boughs, a pixel wider every few rows
    rect(b, cx - hw, y, cx + hw, y, c)
  end
end

-- The far shore's pines in one stage's colours: a back row, low and close together, and in front of
-- it a row of taller ones here and there.
function I.shore(b, stage)
  local back, front = SHORE_COLOURS[stage][1], SHORE_COLOURS[stage][2]
  rect(b, 0, I.SHORE - 3, W - 1, I.SHORE - 1, back)
  for x = -4, W + 4, 5 do farPine(b, x + math.floor(L.rnd(x, 1, 31) * 3), 86 + math.floor(L.rnd(x, 2, 31) * 7), 6, back) end
  for x = 2, W + 4, 13 do
    if L.rnd(x, 3, 31) < 0.7 then farPine(b, x + math.floor(L.rnd(x, 4, 31) * 6), 78 + math.floor(L.rnd(x, 5, 31) * 10), 8, front) end
  end
  rect(b, 0, I.SHORE - 1, W - 1, I.SHORE - 1, front)
end

-- The lake in one stage's colours, from the far shore to the bottom of the screen: the water, the
-- horizon's colour caught along its far edge, and ripples, short and sparse far off and longer near.
function I.water(b, stage, horizon)
  local water, ripple = LAKE_COLOURS[stage][1], LAKE_COLOURS[stage][2]
  rect(b, 0, I.SHORE, W - 1, H - 1, water)
  for x = 0, W - 1 do
    if L.rnd(x, 7, 33) < 0.75 then set(b, x, I.SHORE, horizon) end
    if L.rnd(x, 8, 33) < 0.35 then set(b, x, I.SHORE + 1, horizon) end
  end
  for y = I.SHORE + 3, H - 1, 3 do
    local near = (y - I.SHORE) / (H - I.SHORE)
    for x = 0, W - 1, 4 do
      if L.rnd(x, y, 35) < 0.12 + near * 0.1 then
        local len = 2 + math.floor(near * 6 + L.rnd(x, y, 36) * 3)
        rect(b, x, y, x + len - 1, y, ripple)
      end
    end
  end
end

-- The dawn mist: four long streaks over the water, each in wisps, the farthest first; render.js draws
-- as many as are left (scene.js mistLeft), so the nearest lift first. Each wisp { x0, x1, y }.
local MIST = {
  { { 4, 64, 104 }, { 76, 158, 105 } },
  { { 150, 236, 109 }, { 246, 316, 108 } },
  { { 22, 120, 115 }, { 132, 214, 116 } },
  { { 190, 262, 122 }, { 272, 318, 121 } },
}
function I.mist(b, i)
  for _, m in ipairs(MIST[i]) do
    rect(b, m[1] + 4, m[3], m[2] - 6, m[3], C.mist)
    rect(b, m[1], m[3] + 1, m[2], m[3] + 1, C.mist)
  end
end
I.MISTS = #MIST

-- The fish, silver, leaping to the right, at (x, y) (its middle): 'jump', frame 0 rising (its nose up)
-- or 1 falling (its nose down); or its 'splash' on the water at (x, y), frame 0 a burst and 1 a ring.
function I.fish(b, pose, frame, x, y)
  if pose == "jump" then
    stamp(b, x - 3, y - 2, frame == 0 and { "....cc", "...cck", "..cwc.", ".cCc..", "Cc...." } or { "Cc....", ".cCc..", "..cwc.", "...cck", "....cc" })
  elseif frame == 0 then
    stamp(b, x - 3, y - 4, { "w....w", ".w..w.", "w.ww.w", ".wwww." })
  else
    stamp(b, x - 4, y - 1, { "..wwww..", "ww....ww" })
  end
end

-- The island's shore: the row its ground starts on at x. It runs right across the screen and on out of
-- it either side, gently uneven, a pixel higher behind your crate.
local function shore(x)
  return 139 + math.floor(1.6 * math.sin(x / 21) + math.sin(x / 8 + 1) + 0.5) - (math.abs(x - 140) < 40 and 1 or 0)
end
local function ground(x, y) return y >= shore(x) and y < H end

-- The island in front of the lake: its wet edge and its sand along the shore, then the grass, with
-- tufts, a few flowers and pebbles; the reeds and the lily pads in the water just off it, the frog's
-- with a flower beside it; the turtle's rock; and the rowboat pulled up on the shore to the right, its
-- rope tied to a stake.
function I.land(b)
  for y = 130, H - 1 do
    for x = 0, W - 1 do
      if ground(x, y) then
        local d = y - shore(x) -- rows in from the water's edge
        if d == 0 then b[y][x] = C.path[2]
        elseif d == 1 or (d == 2 and L.rnd(x, y, 42) < 0.6) then b[y][x] = C.path[3]
        else b[y][x] = (L.rnd(x, y, 41) < 0.08) and C.leaf[2] or C.leaf[3] end
      end
    end
  end
  for x = 3, W - 3, 6 do -- tufts of taller grass, a few flowers, and pebbles on the sand
    local y = shore(x) + 6 + math.floor(L.rnd(x, 1, 43) * 30)
    set(b, x, y, C.leaf[2]); set(b, x + 1, y - 1, C.leaf[2]); set(b, x + 2, y, C.leaf[2])
    if L.rnd(x, 2, 43) < 0.4 then set(b, x + 1, y - 2, ({ C.light, C.yellow[2], C.rose[2] })[1 + math.floor(L.rnd(x, 3, 43) * 3)]) end
    if L.rnd(x, 4, 43) < 0.25 then rect(b, x + 4, shore(x + 4) + 1, x + 5, shore(x + 4) + 1, C.coat[1]) end
  end
  -- the reeds, by the shallows, standing in the water at the shore
  for _, r in ipairs({ { 40, 0 }, { 202, 0 } }) do
    for k = 0, 4 do
      local x = r[1] + k * 2 - 4
      local foot, h = shore(x) - 1, 4 + math.floor(L.rnd(r[1], k, 45) * 5)
      rect(b, x, foot - h, x, foot, C.leaf[2])
      if k % 2 == 0 then rect(b, x, foot - h - 2, x, foot - h, C.wood[2]) end -- a bulrush's head
    end
  end
  -- the rock, grey, its top lit, a ripple round its foot
  local rx, ry = I.ROCK[1], I.ROCK[2]
  oval(b, rx + 0.5, ry + 0.5, 8, 3.5, C.coat[1])
  oval(b, rx - 0.5, ry - 1, 6, 2, C.coat[2])
  rect(b, rx - 11, ry + 3, rx - 7, ry + 3, C.mist); rect(b, rx + 7, ry + 3, rx + 11, ry + 3, C.mist)
  -- the lily pads: the frog's, with a notch, and two small ones; a pink flower beside the frog's
  local function pad(cx, cy, rx2, ry2)
    oval(b, cx + 0.5, cy + 0.5, rx2, ry2, C.leaf[2])
    oval(b, cx + 0.5, cy, rx2 - 1, ry2 - 1, C.leaf[3])
    set(b, cx + 1, cy, nil); set(b, cx + 2, cy - 1, nil); set(b, cx + 1, cy - 1, nil)
  end
  pad(I.LILY[1], I.LILY[2], 6, 2)
  pad(6, 132, 3, 1.5)
  pad(76, 131, 3, 1.5)
  stamp(b, I.LILY[1] + 6, I.LILY[2] - 4, { ".f.", "fwf", "eFe" })
  -- the rowboat, pulled up on the shore to the right, its stern in the water, an oar across it, its
  -- rope to a stake in the grass
  stamp(b, 229, 140, { "kk", "DD", "DD", "DD" })
  for x = 231, 237 do set(b, x, 140 - (x - 231) // 3, C.wood[1]) end
  stamp(b, 236, 134, {
    "....ggggggggggggggggggggggg...",
    "..gGDDDDDDDDDGDDDDDDDDDDDDGgg.",
    ".ggGDDDDDDDDDGDDDDDDDDDDDDGggg",
    "..GGGGGGGGGGGGGGGGGGGGGGGGGGg.",
    "...GGGGGGGGGGGGGGGGGGGGGGGGG..",
    ".....GGGGGGGGGGGGGGGGGGGGG....",
  })
  rect(b, 238, 133, 260, 133, C.wood[3]) -- the oar
  rect(b, 260, 132, 264, 134, C.wood[3])
  rect(b, 262, 137, 270, 137, C.mist) -- a ripple off its stern
end

-- The pine's branches, in tiers over your head: dark teal, lit on their upper left where the sun comes
-- from, each tier's lower edge drooping at its tips. { top, bottom, half width } from the top down.
local TIERS = { { 14, 32, 9 }, { 26, 48, 17 }, { 40, 64, 25 }, { 56, 80, 33 }, { 72, 96, 42 } }
local PINE_X = 160 -- the pine's middle
function I.pine(b)
  for _, t in ipairs(TIERS) do
    local t0, t1, hw = t[1], t[2], t[3]
    for y = t0, t1 do
      local k = (y - t0 + 1) / (t1 - t0 + 1)
      local half = math.floor(hw * k ^ 0.7 + 0.5)
      for x = PINE_X - half, PINE_X + half do
        local u = math.abs(x - PINE_X) / math.max(1, hw)
        -- the lower edge droops toward the tips: the middle ends a few rows short of the bottom
        if y <= t1 - math.floor((1 - u) * 4) then
          local lit = x < PINE_X and (y - t0) < (PINE_X - x) * 0.9 + 2
          b[y][x] = lit and C.leaf[2] or C.leaf[1]
          if lit and (y - t0) < 2 and L.rnd(x, y, 47) < 0.5 then b[y][x] = C.leaf[3] end
        end
      end
    end
  end
  set(b, PINE_X, 12, C.leaf[1]); set(b, PINE_X, 13, C.leaf[2])
end

-- The pine's trunk, from under its lowest branches down into the island, its roots spread on the grass.
function I.trunk(b)
  rect(b, PINE_X - 2, 90, PINE_X + 1, I.TRUNK_FEET, C.wood[1])
  rect(b, PINE_X - 2, 90, PINE_X - 2, I.TRUNK_FEET, C.wood[2])
  rect(b, PINE_X - 4, I.TRUNK_FEET - 1, PINE_X + 3, I.TRUNK_FEET, C.wood[1])
  set(b, PINE_X - 5, I.TRUNK_FEET, C.wood[1]); set(b, PINE_X + 4, I.TRUNK_FEET, C.wood[1])
end

-- Where the water glints, [{ x, y }]: render.js lights them by turns. The first few lie in a column
-- under the sun, its reflection, which shows once the sun's up.
function I.glints()
  local out = {}
  for i = 0, 7 do out[#out + 1] = { I.SUN[1] - 3 + math.floor(L.rnd(i, 1, 49) * 7), I.SHORE + 3 + i * 4 } end
  for i = 0, 13 do out[#out + 1] = { math.floor(L.rnd(i, 2, 49) * W), I.SHORE + 6 + math.floor(L.rnd(i, 3, 49) * 26) } end
  return out
end
I.SUN_GLINTS = 8 -- the first this many glints are the sun's reflection

return I
