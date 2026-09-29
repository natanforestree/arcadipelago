-- The music shop in the flat style, for the sprite sheet (sprites.lua): the room (the door with its
-- "back to the park" sign, the window onto the park at dusk, the pedal rack, the chalkboard, the
-- floor), the counter in front of the shopkeeper, the shopkeeper, and the stock on display, each item
-- as it stands and as it looks chosen (lifted two pixels and lit up). Everything is drawn where it
-- goes on the game's 320x180 screen; the card along the bottom (y 138 down) and the words on the
-- sign and the chalkboard are drawn by render.js.
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local D = dofile(here .. "draw.lua")
local G = dofile(here .. "gear.lua")
local L, C, rect, stamp = D.L, D.C, D.rect, D.stamp
local W, H = D.W, D.H
local S = {}

S.FLOOR = 100 -- the wall meets the floor
S.STANDS = 124 -- the row the stands' feet stand on
S.SIGN = { 4, 8, 52, 30 } -- the sign over the door: x0, y0, x1, y1 (its words: render.js)
S.DOOR = { 8, 34, 40, S.FLOOR - 1 }
S.WINDOW = { 60, 16, 104, 60 }
S.RACK = { 112, 20, 240, 66 } -- the pedal rack; its shelf's top is row 62
S.BOARD = { 248, 10, 314, 44 } -- the chalkboard (the savings: render.js)
S.COUNTER = { 232, 74, W - 1, 112 }
S.KEEPER = { 266, 74 } -- the shopkeeper's middle, and the counter's top where she stands behind it
S.LIFT = 2 -- pixels a chosen item rises

-- Where each item stands: a pedal's top-left on the rack's shelf (the pedals, then the wider loop
-- pedal), or a guitar's or keyboard's place on the floor ({ x of the middle for a guitar, x of the
-- left for a keyboard }).
local RACK_X = { overdrive = 117, chorus = 137, tremolo = 157, delay = 177, reverb = 197, loop = 217 }
local RACK_TOP = 45 -- a pedal's top row: it's 17 tall, so it stands on the shelf (row 62)
local FLOOR_AT = { acoustic = 55, ukulele = 78, electric = 101, epiano = 117, synth = 168 }

-------------------------------------------------------------------------------------------------
-- The room

local PLANKS = { S.FLOOR, 104, 109, 115, 122, 130, 139, 149, 160, 172, H } -- the floorboards' rows, widening toward you

-- The walls, the wainscot, the floorboards, the door and its sign, the window, the rack and the
-- chalkboard (everything behind the shopkeeper and the stock).
function S.room(b)
  rect(b, 0, 0, W - 1, S.FLOOR - 1, C.path[2])
  rect(b, 0, 0, W - 1, 3, C.path[1]) -- the ceiling's shadow
  rect(b, 0, 78, W - 1, 79, C.wood[2]) -- the rail
  rect(b, 0, 80, W - 1, S.FLOOR - 1, C.wood[1]) -- the wainscot
  for r = 1, #PLANKS - 1 do
    local y0, y1 = PLANKS[r], PLANKS[r + 1] - 1
    local len = 30 + r * 8
    rect(b, 0, y0, W - 1, y1, C.wood[2])
    rect(b, 0, y1, W - 1, y1, C.wood[1])
    for x = (r * 17) % len, W - 1, len do rect(b, x, y0, x, y1, C.wood[1]) end
  end
  -- The door: a frame, a panelled door with a small window of dusk sky, and its handle.
  local d = S.DOOR
  rect(b, d[1], d[2], d[3], d[4], C.wood[1])
  rect(b, d[1] + 2, d[2] + 2, d[3] - 2, d[4], C.wood[2])
  rect(b, d[1] + 6, d[2] + 5, d[3] - 6, d[2] + 17, C.sky[5])
  rect(b, d[1] + 6, d[2] + 5, d[3] - 6, d[2] + 9, C.sky[4])
  rect(b, d[1] + 6, d[2] + 24, d[3] - 6, d[4] - 6, C.wood[1])
  rect(b, d[1] + 8, d[2] + 26, d[3] - 8, d[4] - 8, C.wood[2])
  rect(b, d[3] - 6, d[2] + 36, d[3] - 5, d[2] + 37, C.yellow[2])
  -- The sign over the door, on two strings.
  local s = S.SIGN
  rect(b, s[1] + 8, 0, s[1] + 8, s[2] - 1, C.ink)
  rect(b, s[3] - 8, 0, s[3] - 8, s[2] - 1, C.ink)
  rect(b, s[1], s[2], s[3], s[4], C.wood[3])
  rect(b, s[1], s[4], s[3], s[4], C.wood[2])
  -- The window onto the park at dusk: bands of sky, the sun going down, the rooftops and a tree.
  local w = S.WINDOW
  local sky = C.sky
  local bands = { sky[3], sky[4], sky[5], sky[6], sky[7] }
  for y = w[2], w[4] do
    local k = math.min(#bands, 1 + (y - w[2]) * #bands // (w[4] - w[2] + 1))
    rect(b, w[1], y, w[3], y, bands[k])
  end
  D.oval(b, w[1] + 30, w[4] - 6, 7, 7, C.light)
  for _, r in ipairs({ { 0, 8, 46 }, { 9, 20, 40 }, { 21, 33, 48 }, { 34, 44, 43 } }) do
    rect(b, w[1] + r[1], r[3], w[1] + r[2], w[4], sky[3])
  end
  D.oval(b, w[1] + 4, w[2] + 22, 8, 9, C.leaf[1])
  rect(b, w[1] + 3, w[2] + 30, w[1] + 5, w[4], C.leaf[1])
  rect(b, w[1] - 2, w[2] - 2, w[3] + 2, w[2] - 1, C.wood[1]) -- the frame and its cross
  rect(b, w[1] - 2, w[4] + 1, w[3] + 2, w[4] + 3, C.wood[1])
  rect(b, w[1] - 2, w[2], w[1] - 1, w[4], C.wood[1])
  rect(b, w[3] + 1, w[2], w[3] + 2, w[4], C.wood[1])
  rect(b, (w[1] + w[3]) // 2, w[2], (w[1] + w[3]) // 2 + 1, w[4], C.wood[1])
  rect(b, w[1], (w[2] + w[4]) // 2, w[3], (w[2] + w[4]) // 2 + 1, C.wood[1])
  rect(b, w[1] - 3, w[4] + 4, w[3] + 3, w[4] + 5, C.wood[2]) -- the sill
  -- The pedal rack: a dark board in a frame, with a shelf along its foot.
  local r = S.RACK
  rect(b, r[1], r[2], r[3], r[4], C.wood[2])
  rect(b, r[1] + 2, r[2] + 2, r[3] - 2, r[4] - 2, C.wood[1])
  rect(b, r[1] - 2, 62, r[3] + 2, 64, C.wood[3])
  rect(b, r[1] - 2, 65, r[3] + 2, 65, C.wood[2])
  -- The chalkboard, in its frame, for the savings.
  local c = S.BOARD
  rect(b, c[1], c[2], c[3], c[4], C.wood[2])
  rect(b, c[1] + 2, c[2] + 2, c[3] - 2, c[4] - 2, C.leaf[1])
  rect(b, c[1] + 5, c[4] - 4, c[1] + 12, c[4] - 4, C.light) -- a stub of chalk on the ledge
end

-- The counter, in front of the shopkeeper, with the till on it.
function S.counter(b)
  local c = S.COUNTER
  rect(b, c[1], c[2], c[3], c[4], C.wood[2])
  rect(b, c[1], c[2], c[3], c[2] + 2, C.wood[3])
  rect(b, c[1], c[2] + 3, c[3], c[2] + 3, C.wood[1])
  for x = c[1] + 10, c[3], 22 do rect(b, x, c[2] + 8, x + 14, c[4] - 6, C.wood[1]) end
  rect(b, c[1], c[4] + 1, c[3], c[4] + 2, C.path[1]) -- its shadow on the floor
  local tx, ty = 292, c[2] - 12 -- the till
  rect(b, tx, ty, tx + 18, c[2] - 1, C.charcoal)
  rect(b, tx + 2, ty + 2, tx + 16, ty + 5, C.go)
  for kx = tx + 2, tx + 14, 4 do rect(b, kx, ty + 8, kx + 2, ty + 9, C.coat[2]) end
end

-------------------------------------------------------------------------------------------------
-- The shopkeeper, behind the counter: grey hair in a bun, round glasses, a mustard cardigan over a
-- white shirt. frame: 0 or 1 breathing, 2 or 3 nodding (a sale).

local KEEPER_HEAD = {
  ".....ccc....",
  "....ccccc...",
  "..cccccccc..",
  ".cccccccccc.",
  ".cctttttttc.",
  ".ctkkttkktc.",
  ".ctkwttkwt..",
  "..ttttttttt.",
  "..tttTTtttt.",
  "...tttttttT.",
  "...tTkkkTtT.",
  "....TTTTTT..",
}
local KEEPER_SMILE = { -- her face nodding: eyes shut, a wider smile
  ".....ccc....",
  "....ccccc...",
  "..cccccccc..",
  ".cccccccccc.",
  ".cctttttttc.",
  ".ctkkttkktc.",
  ".ctttttttt..",
  "..ttkktkktt.",
  "..tttTTtttt.",
  "...tkttttkT.",
  "...ttkkkktT.",
  "....TTTTTT..",
}
local KEEPER_BODY = {
  "......TT........",
  "...YYYwwwwYYY...",
  "..YYYYYwwYYYYY..",
  ".YYYYYYwwYYYYYY.",
  "YYYYYYYwwYYYYYYY",
  "YYYYYYYwwYYYYYYY",
  "YYYYYYYwwYYYYYYY",
  "YYYYYYYwwYYYYYYY",
  "YYYYYYYwwYYYYYYY",
  "tYYYYYYwwYYYYYYt",
  "tYYYYYYwwYYYYYYt",
  "TYYYYYYwwYYYYYYT",
  "TYYYYYYwwYYYYYYT",
  "YYYYYYYwwYYYYYYY",
}

function S.keeper(b, frame)
  local x, top = S.KEEPER[1] - 8, S.KEEPER[2] - #KEEPER_BODY - 11
  local bob = (frame == 1 or frame == 3) and 1 or 0
  local nod = frame >= 2 and (frame == 2 and 1 or 2) or 0
  stamp(b, x, top + 11, KEEPER_BODY)
  stamp(b, x + 2, top + bob + nod, frame >= 2 and KEEPER_SMILE or KEEPER_HEAD)
end

-------------------------------------------------------------------------------------------------
-- The stock on display

-- A pedal on the rack, 14 by 17, in its colour: a row of knobs, its light (off: render.js lights it
-- while you hear it), a line across, and the footswitch.
local KNOBS = {
  overdrive = { "bkkbkkbkkbbbbS", "bkwbkwbkwbbbbS" },
  chorus = { "bkkbbkkbbbbbbS", "bkwbbkwbbbbbbS" },
  tremolo = { "bbkkbbbkkbbbbS", "bbkwbbbkwbbbbS" },
  delay = { "bkkbkkbkkbbbbS", "bkwbkwbkwbbbbS" },
  reverb = { "bbkkkbbbbbbbbS", "bbkkwbbbbbbbbS" },
}
local PEDAL_BODY = {
  "bbbbbbbbbbbbbS",
  "SSSSSSSSSSSSSS",
  "bbbbbbbbbbbbbS",
  "bbbbbbbbbbbbbS",
  "bbbbbbbbbbbbbS",
  "bbbbbbbbbbbbbS",
  "bbbbbbbbbbbbbS",
  "bbbbbbbbbbbbbS",
  "bbbbccccbbbbbS",
  "bbbbccccbbbbbS",
  "bbbbbbbbbbbbbS",
}
S.LED = { 11, 1 } -- the light's place on a rack pedal, from its top-left (2 by 1)

-- The loop pedal on the rack, 18 by 17: grey, its light (2 by 2, lit by render.js while you try it)
-- beside a little window, a line across, and a big footswitch.
local LOOP_PEDAL = {
  ".cccccccccccccccc.",
  "cccccccccccccccccC",
  "ccLLcchhhhhhhhcccC",
  "ccLLcchhhhhhhhcccC",
  "cccccccccccccccccC",
  "CCCCCCCCCCCCCCCCCC",
  "cccccccccccccccccC",
  "cccccccccccccccccC",
  "cccccccccccccccccC",
  "ccccckkkkkkkkccccC",
  "cccckkkkkkkkkkcccC",
  "cccckkkkkkkkkkcccC",
  "ccccckkkkkkkkccccC",
  "cccccccccccccccccC",
  "cccccccccccccccccC",
  "cccccccccccccccccC",
  ".CCCCCCCCCCCCCCCC.",
}
S.LOOP_LED = { 2, 2 } -- the loop pedal's light, from its top-left (2 by 2)

local function rackPedal(b, id, lift)
  if id == "loop" then
    local out = {}
    for i, r in ipairs(LOOP_PEDAL) do out[i] = r:gsub("L", "k") end -- its light, dark
    stamp(b, RACK_X[id], RACK_TOP - lift, out)
    return
  end
  local c = G.PEDAL_COLORS[id]
  local rows = { ".bbbbbbbbbbbb.", "bbbbbbbbbbbkkS", "bbbbbbbbbbbbbS" }
  for _, r in ipairs(KNOBS[id]) do rows[#rows + 1] = r end
  for _, r in ipairs(PEDAL_BODY) do rows[#rows + 1] = r end
  rows[#rows + 1] = ".SSSSSSSSSSSS."
  local out = {}
  for i, r in ipairs(rows) do out[i] = r:gsub("b", c[1]):gsub("S", c[2]) end
  stamp(b, RACK_X[id], RACK_TOP - lift, out)
end

-- A guitar standing up on its stand: the stand's legs, the body, the neck and the headstock.
local UPRIGHT = {
  acoustic = {
    body = {
      "......gggggg......",
      "....gggggggggg....",
      "...gggggggggggG...",
      "...ggggkkkkgggG...",
      "...gggkkkkkkggG...",
      "...gggkkkkkkggG...",
      "...ggggkkkkgggG...",
      "....ggggggggggG...",
      "....gggggggggG....",
      "...gggggggggggG...",
      "..gggggggggggggG..",
      ".ggggggggggggggGG.",
      ".ggggggggggggggGG.",
      "gggggggDDDDggggGGG",
      "gggggggggggggggGGG",
      "gggggggggggggggGGG",
      ".gggggggggggggGGG.",
      ".ggggggggggggGGGG.",
      "..gggggggggGGGGG..",
      "....GGGGGGGGGG....",
      "......GGGGGG......",
    },
    neck = 22, head = { ".DDD.", "kDDDk", "DDDDD", "kDDDk", "DDDDD", ".DDD." },
  },
  ukulele = {
    body = {
      "...yyyyy...",
      "..yyyyyyY..",
      "..yyykyyY..",
      "..yykkkyY..",
      "..yyykyyY..",
      "...yyyyY...",
      "..yyyyyyY..",
      ".yyyyyyyYY.",
      "yyyyDDDyyYY",
      "yyyyyyyyyYY",
      ".yyyyyyyYY.",
      "..YYYYYYY..",
    },
    neck = 12, head = { ".DD.", "kDDk", "DDDD", "kDDk", ".DD." },
  },
  electric = {
    body = {
      "..rr......rr..",
      ".rrrr....rrrr.",
      ".rrrr....rrrR.",
      ".rrrrrrrrrrrR.",
      "..rrwwwwwwrrR.",
      "..rrwkkkkwrR..",
      "..rrwwwwwwrR..",
      ".rrrwkkkkwrrR.",
      "rrrrwwwwwwrrRR",
      "rrrrwwwwwwrrRR",
      "rrrrrkkkkrrrRR",
      "rrrrrrrrrrrrRR",
      ".rrrrrrrrrrRR.",
      "..RRRRRRRRRR..",
    },
    neck = 24, head = { "gg..", "ggg.", "kggk", ".ggg", "kggk", ".ggg", "..gg" },
  },
}

local function uprightGuitar(b, id, lift)
  local g = UPRIGHT[id]
  local x = FLOOR_AT[id]
  local bw, bh = #g.body[1], #g.body
  local bodyTop = S.STANDS - 2 - bh
  -- the stand: a cradle under the body and two splayed feet
  rect(b, x - bw // 2 + 1, S.STANDS - 3, x + bw // 2 - 1, S.STANDS - 3, C.ink)
  for i = 0, 2 do
    L.set(b, x - bw // 2 - i, S.STANDS - 2 + i, C.ink)
    L.set(b, x + bw // 2 - 1 + i, S.STANDS - 2 + i, C.ink)
  end
  local top = bodyTop - lift
  stamp(b, x - bw // 2, top, g.body)
  rect(b, x - 1, top - g.neck, x, top - 1, C.ink)
  stamp(b, x - #g.head[1] // 2, top - g.neck - #g.head, g.head)
end

local function displayed(b, id, lift)
  if RACK_X[id] then return rackPedal(b, id, lift) end
  if UPRIGHT[id] then
    D.shadow(b, FLOOR_AT[id], S.STANDS + 0.5, 8, 1.5)
    return uprightGuitar(b, id, lift)
  end
  local rows = G.KEYBOARDS[id]
  local x = FLOOR_AT[id]
  D.shadow(b, x + #rows[1] / 2, S.STANDS + 0.5, #rows[1] / 2 + 1, 1.5)
  local k = L.buffer(W, H)
  G.keyboard(k, id, x, 101, S.STANDS)
  -- a chosen keyboard rises off its stand; its stand stays on the floor
  for y = 0, H - 1 do
    for xx = 0, W - 1 do
      local c = k[y][xx]
      if c and c ~= C.path[1] then
        local up = (y < 101 + #rows) and lift or 0
        if y - up >= 0 then L.set(b, xx, y - up, c) end
      end
    end
  end
end

-- Chosen: every colour a step lighter, for the lifted item.
local LIGHTER = {
  [C.wood[1]] = C.wood[2], [C.wood[2]] = C.wood[3], [C.red[1]] = C.red[2], [C.yellow[1]] = C.yellow[2],
  [C.blue[1]] = C.blue[2], [C.sky[3]] = C.sky[4], [C.leaf[3]] = C.go, [C.ink] = C.charcoal,
  [C.charcoal] = C.coat[1], [C.coat[2]] = C.light,
}

-- An item of stock as it stands in the shop (chosen: lifted and lit up), with its hit box for clicks
-- and, for a pedal, where its light is.
function S.item(b, id, chosen)
  if chosen then
    local k = L.buffer(W, H)
    displayed(k, id, S.LIFT)
    for y = 0, H - 1 do
      for x = 0, W - 1 do
        local c = k[y][x]
        if c then L.set(b, x, y, c == C.path[1] and c or (LIGHTER[c] or c)) end
      end
    end
  else
    displayed(b, id, 0)
  end
end

-- Each item's box on the screen (as it stands), for clicks and the price tags: [x, y, w, h].
function S.box(id)
  local k = L.buffer(W, H)
  displayed(k, id, 0)
  local x0, y0, x1, y1 = W, H, -1, -1
  for y = 0, H - 1 do
    for x = 0, W - 1 do
      if k[y][x] and k[y][x] ~= C.path[1] then
        x0, y0 = math.min(x0, x), math.min(y0, y)
        x1, y1 = math.max(x1, x), math.max(y1, y)
      end
    end
  end
  return { x0, y0, x1 - x0 + 1, y1 - y0 + 1 }
end

-- A rack pedal's light, on the screen, as it stands.
function S.led(id)
  local at = id == "loop" and S.LOOP_LED or S.LED
  return { RACK_X[id] + at[1], RACK_TOP + at[2] }
end

-- The tags on the stock: a price tag, and a green one on what's yours.
function S.tag(b, yours)
  stamp(b, 0, 0, yours and { ".oooo", "koooo", ".oooo" } or { ".yyyy", "kyyyy", ".yyyy" })
end

return S
