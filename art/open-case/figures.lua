-- Open Case's people and birds in the flat style, shared by the style sample and the sprite sheet: the
-- four passers-by (the jogger, the old man, the student and the commuter), the regular (the old man in
-- the red scarf, drawn by the Regulars feature), the reactions over their heads, the pigeons by your
-- case and the birds that cross the sky.
--
-- A figure is drawn facing left, toward you from the right, with its feet at (x, feet); the sheet
-- mirrors it to face right. It's 16 pixels across and 46 tall from the top of its head (row 0) to its
-- feet (row 45). Its legs are drawn as lines from the hips, so every figure walks the same way; its
-- head and body are pixel maps.
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local D = dofile(here .. "draw.lua")
local L, C, rect, stamp = D.L, D.C, D.rect, D.stamp
local F = {}

F.KINDS = { "jogger", "oldman", "student", "commuter" }

-- Walking: each leg's foot, as { forward (pixels, negative is ahead), lifted (pixels) }, for the near
-- leg then the far one. The body sits a pixel lower when both feet are down.
local STRIDE = {
  stand = { { 0, 0 }, { 0, 0 }, 0 },
  [0] = { { -4, 0 }, { 4, 0 }, 1 },
  [1] = { { 0, 0 }, { 2, 2 }, 0 },
  [2] = { { 4, 0 }, { -4, 0 }, 1 },
  [3] = { { 2, 2 }, { 0, 0 }, 0 },
}

-- One leg, from its hip down to its shoe, `wide` pixels across; the shoe points left.
local function leg(b, hx, hy, fx, fy, wide, c, shoe)
  local rows = fy - 2 - hy
  for i = 0, rows do
    local x = math.floor(hx + (fx - hx) * i / math.max(1, rows) + 0.5)
    rect(b, x, hy + i, x + wide - 1, hy + i, c)
  end
  rect(b, fx - 1, fy - 1, fx + wide - 1, fy - 1, shoe)
  rect(b, fx - 2, fy, fx + wide - 1, fy, shoe)
end

-------------------------------------------------------------------------------------------------
-- The passers-by. Each: its hips' row, its legs' colours { near, far, shoe, width }, and its head
-- (rows 0-13) and body (from row 14) as pixel maps.

local FACE = { -- a clean face under each kind's hair, rows 5-13 ("H" is the kind's hair)
  "....ssssssHH....",
  "....sssssssHH...",
  "...sksssssSHH...",
  "..ssssssssSH....",
  "...sssssssS.....",
  "...ssSssssS.....",
  "....sssssS......",
  ".....SSSS.......",
  "......SS........",
}

local K = {}

K.jogger = {
  hip = 27, legs = { "s", "S", "w", 3 }, hair = "k",
  head = {
    "................",
    "................",
    "......kkkkk.....",
    "....kkkkkkkkk...",
    "...kkkkkkkkkkk..",
    "....wwwwwwwwkk..",
  },
  body = {
    "....rrrrrrr.....",
    "...rrrrrrrrrR...",
    "..rrrrrrrrrrRR..",
    "..rrrrrrrrrrRR..",
    "..srrrrrrrrrRs..",
    "..srrrrrrrrrRs..",
    "..SrrrrrrrrrRS..",
    "..SrrrrrrrrrRS..",
    "..SrrrrrrrrrRS..",
    "..ssrrrrrrrrRss.",
    "...rrrrrrrrrR...",
    "...kkkkkkkkkk...",
    "...kkkkkkkkkk...",
    "...kkkkkkkkkk...",
    "...kkkkk.kkkk...",
  },
}

K.student = {
  hip = 30, legs = { "h", "k", "w", 3 }, hair = "k", skin = true,
  head = {
    "................",
    "......kkkk......",
    "....kkkkkkkk....",
    "...kkkkkkkkkk...",
    "...hhhhhhhhhkk..", -- headphones' band
    "....ttttttkkkk..",
  },
  face = {
    "....ttttttkkk...",
    "...tktttttThhk..",
    "..ttttttttThhk..",
    "...tttttttThh...",
    "...ttTttttT.....",
    "....tttttT......",
    ".....TTTT.......",
    "......TT........",
  },
  body = {
    "...uuuuuuuuUU...",
    "..uuuuuuuuuUUY..",
    "..uuuuuuuuuUUYy.",
    "..uuuuuuuuuUUYy.",
    "..uuuuuuuuuUUYy.",
    "..uuuuuuuuuUUYy.",
    "..uuuuuuuuuUUYy.",
    "..tuuuuuuuuUUYy.",
    "..tuuuuuuuuUUYy.",
    "..TuuuuuuuuUUY..",
    "..TUUUUUUUUUU...",
    "...uuuuuuuuuU...",
    "...UUUUUUUUUU...",
    "...hhhhhhhhhh...",
    "...hhhhhhhhhh...",
    "...hhhhh.hhhh...",
    "...hhhh...hhh...",
  },
}

K.commuter = {
  hip = 32, legs = { "C", "k", "k", 3 }, hair = "D",
  head = {
    "................",
    "................",
    "................",
    ".....DDDDDD.....",
    "....DDDDDDDDD...",
  },
  body = {
    "....cwrwcc......",
    "...ccwrwcccCC...",
    "..cccwrwccccCC..",
    "..cccwrwccccCC..",
    "..ccccrcccccCC..",
    "..ccccrcccccCC..",
    "..cccccckcccCC..",
    "..ccccccccccCC..",
    "..ccccccccccCC..",
    "..ccccccckccCC..",
    "..ccccccccccCC..",
    "..ssccccccccCs..",
    "..ssccccccccCs..",
    "..DDDDcccccccC..",
    "..DDDDDccccccC..",
    "..DDDDDCCCCCCC..",
    "..DDDDDCCCCCC...",
    "...CCCCC.CCCC...",
    "...CCCC...CCC...",
  },
}

-- The old man, after the style sample: a flat cap, a white beard, his long brown coat and his cane.
local OLD_FACE = {
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
local OLD_FACE_GRIN = {
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
local function coat(c, s) -- the old man's coat, in a coat colour and its shadow
  local rows = {
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
  local out = {}
  for i, r in ipairs(rows) do out[i] = r:gsub("c", c):gsub("C", s) end
  return out
end
local function armCane(c, s)
  local rows = {
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
  local out = {}
  for i, r in ipairs(rows) do out[i] = r:gsub("C", s) end
  return out
end
local function armTip(s)
  local rows = {
    ".........CCC....",
    "......CCCCCC....",
    "sss.CCCCCCC.....",
    "sssCCCCCC.......",
    "sss.............",
  }
  local out = {}
  for i, r in ipairs(rows) do out[i] = r:gsub("C", s) end
  return out
end
local FLAT_CAP = {
  "................",
  "................",
  ".....hhhhhhh....",
  "....hhhhhhhhh...",
  "..kkkkkkkkkhh...",
}
local TOP_HAT = {
  ".....kkkkkk.....",
  ".....kkkkkk.....",
  ".....kkkkkk.....",
  ".....rrrrrr.....",
  "...kkkkkkkkkk...",
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
local COLLAR = {
  "....bbbbbbbb....",
  "...bbbbbbbbbb...",
}

-- An old man with his feet at (x, feet), facing left. regular: the red-scarfed regular in his top
-- hat and grey coat, not the passing one in his flat cap and brown coat. step: 0-3 through his walk
-- (nil standing); head: 0, or 1 settled (breathing), or 2 nodding; grin; tip: his hand out with a coin.
function F.oldMan(b, x, feet, step, head, grin, tip, regular)
  local ox, top = math.floor(x + 0.5) - 8, feet - 45
  local s = STRIDE[step or "stand"]
  local bob = s[3]
  D.shadow(b, ox + 8, feet + 0.5, 10, 2.5)
  leg(b, ox + 5, top + 33, ox + 5 + s[2][1], feet - s[2][2], 2, C.ink, C.wood[1])
  leg(b, ox + 9, top + 33, ox + 9 + s[1][1], feet - s[1][2], 2, C.ink, C.wood[1])
  local c, sh = regular and "c" or "b", regular and "C" or "B"
  if not tip then -- the cane, planted on the path ahead of him
    local cx = ox + (step and (step == 0 and -2 or step == 2 and 1 or 0) or 0)
    rect(b, cx, top + 27 + bob, cx, feet - 1, C.wood[1])
    rect(b, cx, top + 24 + bob, cx + 1, top + 24 + bob, C.wood[1])
  end
  stamp(b, ox, top + 16 + bob, coat(c, sh))
  local hx, hy = ox - (head == 2 and 1 or 0), top + bob + ((head or 0) > 0 and 1 or 0)
  stamp(b, hx, hy + 5, grin and OLD_FACE_GRIN or OLD_FACE)
  stamp(b, hx, hy, regular and TOP_HAT or FLAT_CAP)
  if regular then stamp(b, ox, top + 14 + bob, SCARF) else stamp(b, ox, top + 14 + bob, COLLAR) end
  if tip then stamp(b, ox - 5, top + 17 + bob, armTip(sh)) else stamp(b, ox, top + 17 + bob, armCane(c, sh)) end
end

-- A passer-by with their feet at (x, feet), facing left. step: 0-3 through the walk (nil standing);
-- head: 0, 1 settled (breathing) or 2 nodding.
function F.person(b, kind, x, feet, step, head)
  if kind == "oldman" then return F.oldMan(b, x, feet, step, head) end
  local k = K[kind]
  local ox, top = math.floor(x + 0.5) - 8, feet - 45
  local s = STRIDE[step or "stand"]
  local bob = s[3]
  local near, far, shoe, wide = D.PX[k.legs[1]], D.PX[k.legs[2]], D.PX[k.legs[3]], k.legs[4]
  D.shadow(b, ox + 8, feet + 0.5, 9, 2.5)
  leg(b, ox + 4, top + k.hip + bob, ox + 4 + s[2][1], feet - s[2][2], wide, far, shoe)
  leg(b, ox + 8, top + k.hip + bob, ox + 8 + s[1][1], feet - s[1][2], wide, near, shoe)
  stamp(b, ox, top + 14 + bob, k.body)
  local hx, hy = ox - (head == 2 and 1 or 0), top + bob + ((head or 0) > 0 and 1 or 0)
  local face = k.face or FACE
  local rows = {}
  for i, r in ipairs(face) do rows[i] = r:gsub("H", k.hair) end
  stamp(b, hx, hy + 14 - #rows, rows)
  stamp(b, hx, hy, k.head)
end

-------------------------------------------------------------------------------------------------
-- The reactions over a listener's head: a pale bubble with its tail down, and a sign inside, in two
-- frames, over a flat dark shadow a pixel down and right, so it reads against the sun too. Each is
-- drawn with its tail's tip at (x, y).

local BUBBLE = {
  ".wwwwwwwwwww.",
  "wwwwwwwwwwwww",
  "wwwwwwwwwwwww",
  "wwwwwwwwwwwww",
  "wwwwwwwwwwwww",
  "wwwwwwwwwwwww",
  "wwwwwwwwwwwww",
  "wwwwwwwwwwwww",
  ".wwwwwwwwwww.",
  ".....www.....",
  "......w......",
}
-- Signs: 11 wide by 7 tall, drawn inside the bubble.
local SIGNS = {
  repeat_ = { -- bored by a repeat: a yawn's Zs
    { "......kkkk.", ".........k.", "..kkk..kk..", "....k.kkkk.", "...k.......", "..kkk......", "..........." },
    { "...........", "......kkkk.", ".........k.", "..kkk..kk..", "....k.kkkk.", "...k.......", "..kkk......" },
  },
  offKey = { -- a frown, brows down
    { "..R.....R..", "...R...R...", "...........", "...k...k...", "...........", "....RRR....", "...R...R..." },
    { "...R...R...", "..R.....R..", "...........", "...k...k...", "...........", "....RRR....", "...R...R..." },
  },
  callback = { -- a grin
    { "...........", "..kk...kk..", "...........", "..Y.....Y..", "...YYYYY...", "...YkkkY...", "....YYY...." },
    { "..kk...kk..", "...........", "..Y.....Y..", "...YYYYY...", "...YkkkY...", "....YYY....", "..........." },
  },
  taste = { -- two notes, bouncing
    { "....kk.....", "....k.k....", "....k...k..", "..kkk...k..", ".kkkk.kkk..", "..kk.kkkk..", "......kk..." },
    { "........k..", "....kk..k..", "....k.kkk..", "....k.kkkk.", "..kkk..kk..", ".kkkk......", "..kk......." },
  },
  random = { -- a tilted head's question
    { "...kkkkk...", "..kk...kk..", ".......kk..", ".....kkk...", ".....kk....", "...........", ".....kk...." },
    { "....kkkkk..", "...kk...kk.", "........kk.", "......kkk..", ".....kk....", "...........", "....kk....." },
  },
  silence = { -- drifting off
    { "...........", "...........", "...........", "...........", "...........", ".kk..kk....", ".kk..kk...." },
    { "...........", "...........", "...........", "...........", "...........", ".kk..kk..kk", ".kk..kk..kk" },
  },
  loud = { -- a wince
    { "..k.....k..", "...k...k...", "..k.....k..", "...........", "...kkkkk...", "..k.k.k.k..", "...kkkkk..." },
    { "...........", "..kk...kk..", "...........", "...........", "...kkkkk...", "..k.k.k.k..", "...kkkkk..." },
  },
  recognised = { -- a nod: a tick
    { "...........", ".........o.", "........oo.", ".o.....oo..", ".oo...oo...", "..oo.oo....", "...ooo....." },
    { ".........o.", "........oo.", ".o.....oo..", ".oo...oo...", "..oo.oo....", "...ooo.....", "..........." },
  },
}
F.REACTIONS = { "repeat", "offKey", "callback", "taste", "random", "silence", "loud", "recognised" }

function F.reaction(b, rule, frame, x, y)
  local ox, oy = x - 6, y - 10
  for j, row in ipairs(BUBBLE) do
    for i = 1, #row do
      if row:sub(i, i) ~= "." then L.set(b, ox + i, oy + j, C.ink) end
    end
  end
  stamp(b, ox, oy, BUBBLE)
  local sign = SIGNS[rule == "repeat" and "repeat_" or rule]
  stamp(b, ox + 1, oy + 1, sign[frame + 1])
end

-------------------------------------------------------------------------------------------------
-- The pigeons by your case, facing left, feet at (x, y): pecking (frame 1 the head down), walking,
-- and flying (wings up, then down).

local PIGEON = {
  peck = {
    { ".CC......", "Ccce.....", ".ceeccc..", "..cccccCC", "..ccCCCC.", "....r.r.." },
    { ".........", "..eccc...", "..cccccCC", "CccccCCC.", ".C..r.r..", "........." },
  },
  walk = {
    { ".CC......", "Ccce.....", ".ceeccc..", "..cccccCC", "..ccCCCC.", "...r..r.." },
    { ".CC......", "Ccce.....", ".ceeccc..", "..cccccCC", "..ccCCCC.", "....rr..." },
  },
  fly = {
    { "....CC...", "...CcC...", ".CC.cC...", "Ccceccccc", ".cccCCC..", "........." },
    { ".........", ".CC......", "Ccceccccc", ".cccCCC..", "...cCC...", "....CC..." },
  },
}

function F.pigeon(b, pose, frame, x, y)
  stamp(b, x - 4, y - 5, PIGEON[pose][frame + 1])
end

-- A distant bird, crossing the sky: wings up, then level. Centred on (x, y).
function F.bird(b, frame, x, y)
  if frame == 0 then stamp(b, x - 3, y - 1, { "k.....k", ".k...k.", "..kkk.." })
  else stamp(b, x - 3, y - 1, { ".......", "kkk.kkk", "...k..." }) end
end

return F
