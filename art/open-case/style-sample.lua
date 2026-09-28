-- Open Case's style sample, for Nathan to judge the look before any repaint, drawn after his flat
-- reference picture: every area one solid colour, a base and at most one shadow per material, no
-- outlines, no dither, and a flat shadow on the ground under each figure. The park at dusk at 320x180,
-- in layers at different depths (a banded sky and the low sun, clouds, far rooftops with lit windows,
-- trees, the hedge and the paved path with its pool of lamplight), you on your crate with the guitar,
-- the open case with a few coins, the looper, the lamp post, and an old man listening. And a short
-- GIF of the old man walking in, nodding, and grinning as his coin arcs into the case. Run from the
-- repo root:
--   aseprite -b --script art/open-case/style-sample.lua
-- Writes art/open-case/preview-style.png (the still at 3x), preview-style-1x.png and
-- preview-oldman.gif (at 3x). Previews aren't committed.
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local L = dofile(here .. "../site/lib.lua") -- the site's buffer, noise and saving helpers
local C = dofile(here .. "palette.lua").flat
local W, H = 320, 180

-- The flat palette stays within 48 colours, and nothing is drawn in any other colour.
local allowed = {}
do
  local n = 0
  local function walk(t)
    for _, v in pairs(t) do
      if type(v) == "table" then walk(v) elseif not allowed[v] then allowed[v] = true; n = n + 1 end
    end
  end
  walk(C)
  assert(n <= 48, "the palette has " .. n .. " colours; keep it to 48")
  print("palette: " .. n .. " colours")
end
local function checkFlat(b)
  for y = 0, b.h - 1 do
    for x = 0, b.w - 1 do
      local c = b[y][x]
      assert(c == nil or allowed[c], "drew " .. tostring(c) .. " at " .. x .. "," .. y .. ", outside the flat palette")
    end
  end
end

local rect = L.fillRect

local function inOval(x, y, cx, cy, rx, ry)
  local dx, dy = (x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry
  return dx * dx + dy * dy <= 1
end

local function oval(b, cx, cy, rx, ry, c)
  for y = math.floor(cy - ry), math.ceil(cy + ry) do
    for x = math.floor(cx - rx), math.ceil(cx + rx) do
      if inOval(x, y, cx, cy, rx, ry) then L.set(b, x, y, c) end
    end
  end
end

-- Pixel maps: one character per pixel, "." left clear.
local PX = {
  k = C.ink, w = C.light, y = C.yellow[2], Y = C.yellow[1],
  s = C.skin[2], S = C.skin[1],
  h = C.charcoal, p = C.pants[2], P = C.pants[1],
  g = C.wood[3], G = C.wood[2], D = C.wood[1],
  r = C.red[2], R = C.red[1],
  c = C.coat[2], C = C.coat[1],
}

local function stamp(b, ox, oy, rows)
  for j, row in ipairs(rows) do
    for i = 1, #row do
      local ch = row:sub(i, i)
      if ch ~= "." then L.set(b, ox + i - 1, oy + j - 1, assert(PX[ch], "no colour for " .. ch)) end
    end
  end
end

-- A flat shadow on the ground.
local function shadow(b, cx, cy, rx, ry) oval(b, cx, cy, rx, ry, C.path[1]) end

-------------------------------------------------------------------------------------------------
-- You, on the crate, playing: facing out, your head turned toward the case, the guitar across your
-- lap with its neck out to the right, one arm strumming over the body and one on the neck, the far
-- leg tucked back and the near one stretched down.

local FAR_LEG = { 139, 126, {
  "....PPPP",
  "...PPPP.",
  "...PPPP.",
  "...PPPP.",
  "..PPPP..",
  "..PPPP..",
  "..PPPP..",
  "..PPPP..",
  ".PPPP...",
  ".PPPP...",
  ".PPPP...",
  ".PPPP...",
  ".wwww...",
  "wwwwwww.",
  "wwwwwww.",
  "wwwwwww.",
} }
local NEAR_LEG = { 138, 121, {
  "..ppppppppppp...........",
  ".pppppppppppppp.........",
  "pppppppppppppppp........",
  "ppppppppppppppppp.......",
  "ppppppppppppppppp.......",
  "ppppppppppppppppp.......",
  ".PPPPPPPPPPPppppp.......",
  ".............pppp.......",
  ".............pppp.......",
  "..............pppp......",
  "..............pppp......",
  "..............pppp......",
  "...............pppp.....",
  "...............pppp.....",
  "...............pppp.....",
  "................pppp....",
  "................pppp....",
  "................wwww....",
  "...............wwwwwww..",
  "...............wwwwwwww.",
  "...............wwwwwwww.",
} }
local TORSO = { 132, 103, {
  "................",
  "....hhhh....hh..",
  "...kkkkk....khh.",
  ".kkkkkkkkkkkkkhh",
  ".kkkkkkkkkkkkkkh",
  "kkkkkkkkkkkkkkkh",
  "kkkkkkkkkkkkkkkh",
  "kkkkkkkkkkkkkkkh",
  "kkkkkkkkkkkkkkkh",
  "kkkkkkkkkkkkkkkh",
  "kkkkkkkkkkkkkkh.",
  "..kkkkkkkkkkkkh.",
  "..kkkkkkkkkkkkh.",
  "..kkkkkkkkkkkkh.",
  "..kkkkkkkkkkkkh.",
  "..kkkkkkkkkkkkh.",
  "..kkkkkkkkkkkkh.",
  "..kkkkkkkkkkkkh.",
  "..kkkkkkkkkkkkh.",
  "..kkkkkkkkkkkkh.",
} }
local HEAD = { 136, 92, {
  "...kkhhh....",
  ".kkkkkhhhh..",
  "kkkkkkkkhhh.",
  "kkkkkkkkkhh.",
  "hhhhhhhhhhhh",
  "kkSsssssss..",
  "kSSssssksss.",
  "kSSssssksss.",
  ".SSsssssssss",
  ".SSssssssss.",
  "..SSssssSs..",
  "...SSssss...",
  ".....SSS....",
  ".....SSS....",
} }
local GUITAR = { 126, 113, {
  "................gggggg....",
  "....ggggggg....gggggggg...",
  "...gggggggggg.gggggggggg..",
  "..gggggggggggggggggkkkggg.",
  ".ggggggggggggggggggkkkgggg",
  ".ggggggggggggggggggkkkgggg",
  "gggggDDggggggggggggggggggg",
  "gggggDDgggggggggggggggggg.",
  "GggggDDgggggggggggggggggg.",
  "GggggDDggggggggggggggggg..",
  ".GGgggggggggggggGGGGGG....",
  ".GGggggggggggG............",
  "..GGGGGGGGGGG.............",
  "...GGGGGGGGG..............",
  ".....GGGGG................",
} }
-- the neck in steps, rising to the right: { x0, x1, y }, two pixels thick
local NECK = { { 151, 154, 115 }, { 155, 158, 114 }, { 159, 162, 113 }, { 163, 166, 112 }, { 167, 170, 111 }, { 171, 174, 110 }, { 175, 177, 109 } }
local HEADSTOCK = { 176, 106, {
  "...k.k.",
  "..DDDDD",
  ".DDDDDD",
  "DDDDDD.",
  "DDD....",
} }
local FRET_ARM = { 144, 106, {
  "..hhh...........",
  ".hhhhh..........",
  ".kkhhhh.........",
  "..kkkhhh........",
  "...kkkhhh.......",
  "....kkkkhhsssss.",
  ".....kkkksssssss",
  "........SSSSSSS.",
} }
local FRET_HAND = { 161, 110, {
  ".ss.",
  "ssss",
  "ssss",
  "ssss",
  ".SS.",
} }
local STRUM_ARM = { 124, 105, {
  "..........hhhh...",
  "........hhhhkk...",
  "......hhhhkkkk...",
  "....hhhhkkkk.....",
  "..hhhhkkkk.......",
  ".hhhkkkkk........",
  ".hkkkkkkk........",
  "..kssskk.........",
  "...Sssssk........",
  "....Sssss........",
  "......Sssss......",
  "........Ssssss...",
  "..........Sssssss",
  "...........ssssss",
  "............ssss.",
} }

local function you(b)
  stamp(b, FAR_LEG[1], FAR_LEG[2], FAR_LEG[3])
  stamp(b, NEAR_LEG[1], NEAR_LEG[2], NEAR_LEG[3])
  stamp(b, TORSO[1], TORSO[2], TORSO[3])
  stamp(b, HEAD[1], HEAD[2], HEAD[3])
  stamp(b, GUITAR[1], GUITAR[2], GUITAR[3])
  stamp(b, FRET_ARM[1], FRET_ARM[2], FRET_ARM[3])
  for _, n in ipairs(NECK) do rect(b, n[1], n[3], n[2], n[3] + 1, C.ink) end
  stamp(b, HEADSTOCK[1], HEADSTOCK[2], HEADSTOCK[3])
  stamp(b, FRET_HAND[1], FRET_HAND[2], FRET_HAND[3])
  stamp(b, STRUM_ARM[1], STRUM_ARM[2], STRUM_ARM[3])
end

-------------------------------------------------------------------------------------------------
-- The park, back to front (the same in every frame)

local LAMP_X, LAMP_Y = 70, 50 -- the lamp's head
local CASE_X, CASE_Y = 166, 138 -- the open case's front-left corner
local BANDS = { 0, 22, 42, 59, 74, 87, 99 } -- the first row of each band of sky

local function band(y)
  local i = 1
  for k = 1, #BANDS do if y >= BANDS[k] then i = k end end
  return i
end

-- A long flat cloud in steps, flat along the bottom where the sun lights it: a tone lighter than its
-- sky, its underside lighter again.
local function cloud(b, cx, cy, len)
  local k = band(cy)
  local body, lit = C.sky[math.min(#C.sky, k + 1)], C.sky[math.min(#C.sky, k + 3)]
  local function step(y0, y1, l, r, c) rect(b, math.floor(cx + l * len), y0, math.floor(cx + r * len), y1, c) end
  step(cy - 7, cy - 6, -0.3, 0.05, body)
  step(cy - 5, cy - 4, -0.55, 0.35, body)
  step(cy - 3, cy - 2, -0.85, 0.7, body)
  step(cy - 1, cy, -1, 0.9, lit)
end

-- The far rooftops, hand-placed so each figure's face sits against a roof: a paler row behind, then
-- the nearer one with its lit windows. { x0, x1, top }
local BACK = { { 0, 22, 84 }, { 40, 60, 80 }, { 100, 124, 86 }, { 108, 112, 72 }, { 180, 202, 82 }, { 262, 282, 78 }, { 300, 319, 86 } }
local FRONT = {
  { 0, 16, 100 }, { 17, 36, 94 }, { 37, 54, 104 }, { 55, 76, 96 }, { 77, 94, 92 }, { 95, 114, 101 },
  { 115, 128, 96 }, { 129, 158, 88 }, { 159, 178, 99 }, { 179, 198, 94 }, { 199, 220, 102 },
  { 221, 254, 106 }, { 255, 272, 97 }, { 273, 292, 93 }, { 293, 319, 100 },
}

local function tree(b, tx, ty, clumps)
  rect(b, tx - 3, ty, tx + 3, 124, C.wood[1])
  for _, c in ipairs(clumps) do
    local cx, cy, r = tx + c[1], ty + c[2], c[3]
    for y = math.floor(cy - r), math.ceil(cy + r) do
      for x = math.floor(cx - r), math.ceil(cx + r) do
        if inOval(x, y, cx, cy, r, r) then
          L.set(b, x, y, inOval(x, y, cx - r * 0.3, cy - r * 0.35, r, r) and C.leaf[2] or C.leaf[1])
        end
      end
    end
  end
end

-- A lit window this close to you would read as part of you, so the windows keep clear.
local youMask = L.buffer(W, H)
you(youMask)
local function nearYou(x, y)
  for yy = y - 2, y + 3 do
    for xx = x - 2, x + 3 do if L.get(youMask, xx, yy) then return true end end
  end
  return false
end

local function park()
  local b = L.buffer(W, H)
  -- the sky: flat bands, dusk purple at the top to the glow at the horizon
  for y = 0, 129 do rect(b, 0, y, W - 1, y, C.sky[band(y)]) end
  -- the low sun, half behind the rooftops
  oval(b, 237, 104, 15, 15, C.light)
  -- long clouds, lit from below
  for _, cl in ipairs({ { 60, 34, 40 }, { 150, 20, 52 }, { 252, 48, 46 }, { 112, 64, 28 }, { 298, 18, 26 } }) do
    cloud(b, cl[1], cl[2], cl[3])
  end
  -- far rooftops: the paler row behind, then the near row, a water tower, chimneys, lit windows
  for _, r in ipairs(BACK) do rect(b, r[1], r[3], r[2], 125, C.sky[4]) end
  for i, r in ipairs(FRONT) do
    rect(b, r[1], r[3], r[2], 125, C.sky[3])
    for wy = r[3] + 4, 116, 6 do
      for wx = r[1] + 3, r[2] - 4, 5 do
        if L.rnd(wx, wy, 32 + i) < 0.2 and not nearYou(wx, wy) then rect(b, wx, wy, wx + 1, wy + 1, C.yellow[2]) end
      end
    end
  end
  rect(b, 80, 81, 90, 88, C.sky[3]) -- the water tower
  rect(b, 82, 79, 88, 80, C.sky[3])
  rect(b, 81, 89, 82, 91, C.sky[3]); rect(b, 88, 89, 89, 91, C.sky[3])
  rect(b, 30, 88, 32, 93, C.sky[3]) -- chimneys
  rect(b, 263, 93, 265, 96, C.sky[3])
  -- the trees, in teal shadow
  tree(b, 26, 70, { { 4, -16, 15 }, { 0, 0, 24 }, { -14, 10, 16 }, { 16, 8, 17 } })
  tree(b, 300, 62, { { 8, -18, 14 }, { 0, 0, 24 }, { -18, 12, 16 } })
  -- the hedge, scalloped along its lit top
  for x = 0, W - 1 do
    local u = ((x + 3) % 14 - 7) / 7
    local top = 118 - math.floor(3 * math.sqrt(math.max(0, 1 - u * u)))
    rect(b, x, top, x, top + 1, C.leaf[3])
    rect(b, x, top + 2, x, 129, C.leaf[2])
  end
  -- the paved path in rows that widen toward you, and the pool of lamplight on it
  local rows = { 130, 134, 139, 145, 152, 160, 169, 180 }
  for r = 1, #rows - 1 do
    local y0, y1 = rows[r], rows[r + 1] - 1
    local sw = 10 + r * 3
    for y = y0, y1 do
      for x = 0, W - 1 do
        local sx = x + (r % 2) * math.floor(sw / 2)
        local joint = (y == y1) or (sx % sw == 0)
        local lit = inOval(x, y, LAMP_X, 143, 40, 12)
        b[y][x] = joint and (lit and C.path[2] or C.path[1]) or (lit and C.path[3] or C.path[2])
      end
    end
  end
  rect(b, 0, 130, W - 1, 130, C.path[1])
  -- the lamp post
  rect(b, LAMP_X - 1, LAMP_Y + 7, LAMP_X, 131, C.ink)
  rect(b, LAMP_X - 3, 128, LAMP_X + 2, 132, C.ink)
  rect(b, LAMP_X - 2, LAMP_Y - 3, LAMP_X + 1, LAMP_Y - 3, C.ink)
  rect(b, LAMP_X - 4, LAMP_Y - 2, LAMP_X + 3, LAMP_Y - 2, C.ink)
  rect(b, LAMP_X - 3, LAMP_Y - 1, LAMP_X + 2, LAMP_Y + 5, C.yellow[2])
  rect(b, LAMP_X - 2, LAMP_Y, LAMP_X + 1, LAMP_Y + 4, C.light)
  rect(b, LAMP_X - 3, LAMP_Y + 6, LAMP_X + 2, LAMP_Y + 6, C.ink)
  -- the crate you sit on, on its shadow
  shadow(b, 145, 141.5, 19, 2.5)
  rect(b, 132, 128, 151, 141, C.wood[2])
  rect(b, 132, 132, 151, 132, C.wood[1])
  rect(b, 132, 137, 151, 137, C.wood[1])
  rect(b, 138, 129, 145, 130, C.wood[1]) -- the hand-hold
  return b
end

-- The looper by the crate: its body, the switch, and its light, red on the first beat.
local function looper(b, beat)
  shadow(b, 123, 146.5, 7, 1.5)
  rect(b, 118, 141, 128, 146, C.blue[1])
  rect(b, 118, 141, 128, 141, C.blue[2])
  rect(b, 124, 139, 126, 140, C.ink)
  rect(b, 120, 143, 121, 144, beat and C.red[2] or C.go)
end

-- The open case: its lid up behind, the red lining, and `coins` coins in it (and a glint on one).
local function openCase(b, coins, glint)
  shadow(b, CASE_X + 17, CASE_Y + 8.5, 19, 2.5)
  for y = CASE_Y - 8, CASE_Y - 1 do
    local lean = math.floor((CASE_Y - y) / 2)
    rect(b, CASE_X + 2 + lean, y, CASE_X + 30 + lean, y, C.ink)
    if y > CASE_Y - 8 and y < CASE_Y - 1 then rect(b, CASE_X + 4 + lean, y, CASE_X + 28 + lean, y, C.red[1]) end
  end
  rect(b, CASE_X, CASE_Y, CASE_X + 32, CASE_Y + 8, C.ink)
  rect(b, CASE_X + 2, CASE_Y + 1, CASE_X + 30, CASE_Y + 5, C.red[2])
  rect(b, CASE_X + 2, CASE_Y + 1, CASE_X + 30, CASE_Y + 1, C.red[1])
  for i = 0, coins - 1 do
    local x = CASE_X + 4 + (i * 7) % 25
    local y = CASE_Y + 2 + i % 2
    rect(b, x, y, x + 2, y + 1, C.yellow[2])
    L.set(b, x + 2, y + 1, C.yellow[1])
  end
  if glint then
    local x, y = CASE_X + 11, CASE_Y + 2
    L.set(b, x, y - 1, C.light); L.set(b, x - 1, y, C.light); L.set(b, x, y, C.light); L.set(b, x + 1, y, C.light); L.set(b, x, y + 1, C.light)
  end
end

-------------------------------------------------------------------------------------------------
-- The old man, feet at (x, 150), facing left toward you. step: 0..3 through his walk (nil standing);
-- nod: his head dipped; grin: smiling; tip: his hand held out with a coin.

local HAT = {
  ".....kkkkkk.....",
  ".....kkkkkk.....",
  ".....kkkkkk.....",
  ".....rrrrrr.....",
  "...kkkkkkkkkk...",
}
local FACE = {
  "....ssssssww....",
  "....ssssssSww...",
  "...sksssssSww...",
  "..ssksssSSSw....",
  "...sssssssS.....",
  "...wwwwsssS.....",
  "...wwwwwwsS.....",
  "....wwwwww......",
  ".....wwww.......",
}
local FACE_GRIN = {
  "....ssssssww....",
  "....ssssssSww...",
  "...ssssssSSww...",
  "..sskksSSSw.....",
  "...sssssssS.....",
  "...wwwwkssS.....",
  "...wkkkwwsS.....",
  "....wwwwww......",
  ".....wwww.......",
}
local COAT = {
  "....ccccccccc...",
  "..cccccccccccC..",
  "..cccccccccccCC.",
  "..cccccccccccCC.",
  "..cccccccccccCC.",
  "..kccccccccccCC.",
  "..cccccccccccCC.",
  "..cccccccccccCC.",
  "..cccccccccccCC.",
  "..cccccccccccCC.",
  ".ckcccccccccccC.",
  ".cccccccccccccC.",
  ".cccccccccccccC.",
  ".cccccccccccccC.",
  ".cccccccccccccC.",
  ".ckccccccccccCC.",
  ".cccccccccccccC.",
  ".cccccccccccccCC",
  ".cccccccccccccCC",
  ".cccccccccccccCC",
  "ccccccccccccccCC",
  "ccccccccccccccCC",
  "ccccccccccccccCC",
}
local SCARF = {
  "...rrrrrrrrr....",
  "...rrrrrrrrrr...",
  "....rrrrrrrrR...",
  "..........RR....",
  "..........RR....",
  "..........RR....",
  "...........R....",
}
local ARM_CANE = {
  ".....CCC....",
  "....CCCC....",
  "....CCC.....",
  "...CCCC.....",
  "...CCC......",
  "..CCCC......",
  "..CCC.......",
  "..CCC.......",
  ".sss........",
  ".sss........",
}
local ARM_TIP = {
  ".........CCC....",
  "......CCCCCC....",
  "sss.CCCCCCC.....",
  "sssCCCCCC.......",
  "sss.............",
}
local LEGS = {
  [0] = {
    "......kkkk......",
    ".....kk..kk.....",
    ".....kk...kk....",
    "....kk....kk....",
    "....kk.....kk...",
    "...kk......kk...",
    ".DDDD.....DDDD..",
    ".DDDD......DDD..",
  },
  [1] = {
    "......kkk.......",
    "......kkk.......",
    ".....kk.kk......",
    ".....kk..kk.....",
    ".....kk..kkk....",
    ".....kk...DDD...",
    "...DDDD.........",
    "...DDDD.........",
  },
  stand = {
    ".....kk..kk.....",
    ".....kk..kk.....",
    ".....kk..kk.....",
    ".....kk..kk.....",
    ".....kk..kk.....",
    ".....kk..kk.....",
    "...DDDD.DDDD....",
    "...DDDD.DDDD....",
  },
}
LEGS[2], LEGS[3] = LEGS[0], LEGS[1]

local function oldMan(b, x, step, nod, grin, tip)
  x = math.floor(x + 0.5)
  local bob = (step and step % 2 == 1) and 1 or 0
  local top = 105 + bob
  local ox = x - 8
  shadow(b, x, 150.5, 10, 2.5)
  stamp(b, ox, 143, step and LEGS[step] or LEGS.stand)
  if not tip then -- the cane, planted on the path
    rect(b, ox, top + 27, ox, 149, C.wood[1])
    rect(b, ox, top + 24, ox + 1, top + 24, C.wood[1])
  end
  stamp(b, ox, top + 16, COAT)
  local hx, hy = ox - (nod and 1 or 0), top + (nod and 1 or 0)
  stamp(b, hx, hy + 5, grin and FACE_GRIN or FACE)
  stamp(b, hx, hy, HAT)
  stamp(b, ox, top + 14, SCARF)
  if tip then stamp(b, ox - 5, top + 17, ARM_TIP) else stamp(b, ox, top + 17, ARM_CANE) end
end

-- A coin, thrown: face-on and side-on by turns, so it spins.
local function coin(b, x, y, f)
  if f % 2 == 0 then
    stamp(b, x - 2, y - 2, { ".yy.", "ywyy", "yyyY", ".YY." })
  else
    stamp(b, x - 1, y - 2, { "yy", "wy", "yY", "YY" })
  end
end

-------------------------------------------------------------------------------------------------

local base = park()

local function scene(manX, step, nod, grin, tip, coins, glint, beat)
  local b = L.buffer(W, H)
  L.blit(b, base, 0, 0)
  looper(b, beat)
  openCase(b, coins, glint)
  you(b)
  if manX then oldMan(b, manX, step, nod, grin, tip) end
  return b
end

-- The still.
local still = scene(234, nil, false, true, false, 5, true)
checkFlat(still)
L.save(still, nil, "art/open-case/preview-style-1x.png")
L.save(L.scale(still, 3), nil, "art/open-case/preview-style.png")

-- The GIF: walking in, nodding, grinning, the coin arcing into the case. Cropped round the action.
local CROP = { 110, 70, 200, 90 }
local frames = {}
local function add(b, ms)
  checkFlat(b)
  frames[#frames + 1] = { L.scale(L.crop(b, CROP[1], CROP[2], CROP[3], CROP[4]), 3), ms }
end
for f = 0, 11 do add(scene(300 - f * 5.5, f % 4, false, false, false, 4, false, f % 6 == 0), 120) end
for f = 0, 3 do add(scene(234, nil, f % 2 == 0, false, false, 4, false), 180) end
add(scene(234, nil, false, true, false, 4, false), 400)
local from, to = { 222, 124 }, { CASE_X + 12, CASE_Y + 3 }
for f = 0, 7 do
  local b = scene(234, nil, false, true, true, 4, false)
  local k = f / 7
  coin(b, math.floor(from[1] + (to[1] - from[1]) * k + 0.5), math.floor(from[2] + (to[2] - from[2]) * k - math.sin(math.pi * k) * 18 + 0.5), f)
  add(b, 70)
end
add(scene(234, nil, false, true, false, 5, true), 150)
add(scene(234, nil, false, true, false, 5, false), 150)
add(scene(234, nil, false, true, false, 5, true), 900)

local fw, fh = frames[1][1].w, frames[1][1].h
local spr = Sprite(fw, fh, ColorMode.RGB)
for _ = 2, #frames do spr:newEmptyFrame() end
for i, fr in ipairs(frames) do
  local img = Image(fw, fh, ColorMode.RGB)
  for y = 0, fh - 1 do
    for x = 0, fw - 1 do
      local c = fr[1][y][x]
      if c then img:drawPixel(x, y, L.rgba(c)) end
    end
  end
  spr.frames[i].duration = fr[2] / 1000
  spr:newCel(spr.layers[1], i, img, Point(0, 0))
end
L.ensureDir("art/open-case/preview-oldman.gif")
spr:saveCopyAs(L.path("art/open-case/preview-oldman.gif"))
spr:close()
print("style sample: preview-style.png, preview-style-1x.png, preview-oldman.gif (" .. #frames .. " frames)")
