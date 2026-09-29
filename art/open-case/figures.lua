-- Open Case's people and birds in the flat style, shared by the style sample and the sprite sheet: the
-- passers-by (joggers, elders, students and commuters, six looks of each), the regular (the old man
-- in the red scarf, drawn by the Regulars feature), the reactions over their heads, the pigeons by
-- your case and the birds that cross the sky.
--
-- A figure is drawn facing left, toward you from the right, with its feet at (x, feet); the sheet
-- mirrors it to face right. It's 16 pixels across and 46 tall from the top of its head (row 0) to its
-- feet (row 45). Its legs are drawn as lines from the hips, so every figure walks the same way; its
-- head and body are pixel maps.
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local D = dofile(here .. "draw.lua")
local L, C, rect, stamp = D.L, D.C, D.rect, D.stamp
local F = {}

F.KINDS = { "jogger", "elder", "student", "commuter" }

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
local function coat(c, s) -- the regular's coat and every elder's, in a coat colour and its shadow
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
-- The style sample draws the regular with it; the passing elders are F.person's.
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

-------------------------------------------------------------------------------------------------
-- The passers-by. Each kind keeps its sign: the jogger's running kit, the elder's cane and long coat,
-- the student's headphones and backpack, the commuter's suit and briefcase. Each has six looks,
-- three women and three men (F.LOOKS), drawn from parts: the kind's body, a hair style and a face,
-- with the look's colours swapped in by letter.

-- Each skin tone's letters: its base, then its shadow.
local SKIN = { light = { "s", "S" }, tan = { "a", "A" }, brown = { "t", "T" }, deep = { "m", "M" } }

-- A pixel map with letters swapped all in one pass, so a swapped letter is never swapped again:
-- map[from] = to, and any letter not in map stays as it is.
local function paint(rows, map)
  local out = {}
  for i, r in ipairs(rows) do out[i] = r:gsub(".", map) end
  return out
end

-- Faces, rows 5-13 of the head, in the light skin's letters ("H" the hair behind the ear, or the
-- beard).
local FACE = {
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
local SHORT_BEARD = {
  "....ssssssHH....",
  "....sssssssHH...",
  "...sksssssSHH...",
  "..ssssssssSH....",
  "...sssssssH.....",
  "...sHHHHHHH.....",
  "....HHHHHH......",
  ".....HHHH.......",
  "......SS........",
}
local FACES = { plain = FACE, beard = paint(OLD_FACE, { w = "H" }), shortBeard = SHORT_BEARD }

-- Hair: `top` from the head's row 0, drawn over the face, and `back` (a row, then its rows) drawn
-- after it: a ponytail, a bob, long hair down the back. "H" is the hair's colour.
local HAIR = {
  short = { top = { -- the grey-suited commuter's
    "................",
    "................",
    "................",
    ".....HHHHHH.....",
    "....HHHHHHHHH...",
  } },
  band = { top = { -- the red-topped jogger's, in a white headband
    "................",
    "................",
    "......HHHHH.....",
    "....HHHHHHHHH...",
    "...HHHHHHHHHHH..",
    "....wwwwwwwwHH..",
  } },
  student = { top = { -- the blue-hoodied student's
    "................",
    "......HHHH......",
    "....HHHHHHHH....",
    "...HHHHHHHHHH...",
    "...HHHHHHHHHHH..",
    "..........HHHH..",
  } },
  buzz = { top = {
    "................",
    "................",
    "................",
    "......HHHHH.....",
    ".....HHHHHHHH...",
  } },
  curls = { top = {
    "................",
    "......H.HH......",
    "....HHHHHHHH....",
    "...HHHHHHHHHH...",
    "..HHHHHHHHHHHH..",
    "...H.HHH.HHHHH..",
  } },
  messy = { top = {
    "................",
    ".....H..H.......",
    "....HHHHHHH.H...",
    "...HHHHHHHHHH...",
    "..HHHHHHHHHHHH..",
    "...H.HH..HHHHH..",
  } },
  part = { top = { -- a side parting, swept forward
    "................",
    "................",
    "....HHHHH.......",
    "...HHHHHHHHHH...",
    "...HHHHHHHHHHH..",
    "...H......HH....",
  } },
  bald = { top = {
    "................",
    "................",
    "................",
    ".....ssssss.....",
    "....sssssssSS...",
  } },
  flatCap = { top = FLAT_CAP },
  ponytail = { top = { -- tied high, swinging behind
    "................",
    "................",
    "......HHHH......",
    "....HHHHHHHHH...",
    "...HHHHHHHHHHHH.",
  }, back = { 3,
    ".............HH.",
    "..............HH",
    "..............HH",
    "...............H",
    "...............H",
    "..............H.",
  } },
  puff = { top = { -- a short afro in a white headband
    ".....HHHHH......",
    "...HHHHHHHHH....",
    "..HHHHHHHHHHH...",
    "..HHHHHHHHHHHH..",
    "...wwwwwwwwwHH..",
  }, back = { 5,
    "..........HHH...",
    "...........HHH..",
  } },
  cap = { top = { -- a dark running cap, a ponytail through its back
    "................",
    "................",
    "......hhhhh.....",
    ".....hhhhhhhh...",
    "..hhhhhhhhhhhH..",
  }, back = { 4,
    ".............HH.",
    "..............HH",
    "..............H.",
    "..............H.",
  } },
  bob = { top = {
    "................",
    "................",
    ".....HHHHHH.....",
    "....HHHHHHHHH...",
    "...HHHHHHHHHHH..",
    "...HHH....HHHH..",
  }, back = { 6,
    "..........HHHH..",
    "..........HHHH..",
    "..........HHHH..",
    "..........HHHH..",
    "..........HHH...",
    ".........HHH....",
  } },
  long = { top = {
    "................",
    "......HHHH......",
    "....HHHHHHHH....",
    "...HHHHHHHHHH...",
    "..HHHHHHHHHHHH..",
    "..HH......HHHH..",
  }, back = { 6,
    "..........HHHH..",
    "..........HHHH..",
    "..........HHHH..",
    "..........HHH...",
    "..........HHH...",
    "..........HHH...",
    "..........HHH...",
    "..........HHH...",
    "..........HHH...",
    "...........HH...",
    "...........HH...",
  } },
  braids = { top = { -- box braids, pulled back
    "................",
    "......HHHH......",
    "....HHHHHHHH....",
    "...HHHHHHHHHH...",
    "...HHHHHHHHHHH..",
    "..........HHHH..",
  }, back = { 6,
    "..........HhHh..",
    "..........HhHh..",
    "..........HhH...",
    "..........HhH...",
    "..........HhH...",
    "..........HhH...",
    "..........HhH...",
    "..........HhH...",
    "..........H.H...",
    "..........H.H...",
  } },
  locs = { top = {
    "................",
    "......HHHH......",
    "....HHHHHHHH....",
    "...HHHHHHHHHH...",
    "..HHHHHHHHHHHH..",
    "..........HHHHH.",
  }, back = { 6,
    "..........H.HHH.",
    "..........H.H.H.",
    ".........HH.H.H.",
    "............H.H.",
    "............H.H.",
    "..............H.",
  } },
  bun = { top = {
    "................",
    "................",
    "...........HHH..",
    ".....HHHHHHHHHH.",
    "....HHHHHHHHHHH.",
  } },
  oldCurls = { top = { -- short, curled
    "................",
    "................",
    ".....H.HH.H.....",
    "....HHHHHHHHH...",
    "...HHHHHHHHHHH..",
    "...H.H....HHHH..",
  } },
  scarf = { top = { -- a headscarf, over the hair and round the neck
    "................",
    "......HHHH......",
    "....HHHHHHHH....",
    "...HHHHHHHHHH...",
    "...HHHHHHHHHHH..",
    "...H......HHHH..",
  }, back = { 6,
    "..........HHHH..",
    "..........HHHH..",
    ".........HHHHH..",
    ".........HHHHH..",
    "........HHHHHH..",
    ".......HHHHHH...",
    ".....HHHHHHH....",
    "....HHHHHHHH....",
  } },
}

-- The student's headphones: a band over the hair and a cup on the ear.
local HEADPHONES = {
  "...hhhhhhhhh....",
  "................",
  "................",
  "...........hh...",
  "...........hh...",
  "...........hh...",
}

-- The kinds' bodies from row 14, as the first four passers-by were drawn: "1" and "2" are the top's
-- colour and its shadow, "3" and "4" the shorts', jeans' or skirt's, and "5" the tie. Skin is in the
-- light tone's letters.
local JOGGER = {
  "....1111111.....",
  "...1111111112...",
  "..111111111122..",
  "..111111111122..",
  "..s1111111112s..",
  "..s1111111112s..",
  "..S1111111112S..",
  "..S1111111112S..",
  "..S1111111112S..",
  "..ss111111112ss.",
  "...1111111112...",
  "...3333333333...",
  "...3333333333...",
  "...3333333333...",
  "...33333.3333...",
}
local STUDENT = {
  "...1111111122...",
  "..11111111122Y..",
  "..11111111122Yy.",
  "..11111111122Yy.",
  "..11111111122Yy.",
  "..11111111122Yy.",
  "..11111111122Yy.",
  "..s1111111122Yy.",
  "..s1111111122Yy.",
  "..S1111111122Y..",
  "..S2222222222...",
  "...1111111112...",
  "...2222222222...",
}
local JEANS = {
  "...3333333333...",
  "...3333333333...",
  "...33333.3333...",
  "...3333...333...",
}
local DENIM_SKIRT = {
  "...3333333333...",
  "..333333333333..",
  "..333333333333..",
  "..333333333333..",
  "..444444444444..",
}
local SUIT = {
  "....1w5w11......",
  "...11w5w11122...",
  "..111w5w111122..",
  "..111w5w111122..",
  "..111151111122..",
  "..111151111122..",
  "..111111k11122..",
  "..111111111122..",
  "..111111111122..",
  "..1111111k1122..",
  "..111111111122..",
  "..ss111111112s..",
  "..ss111111112s..",
  "..DDDD11111112..",
  "..DDDDD1111112..",
  "..DDDDD2222222..",
  "..DDDDD222222...",
}
local TROUSERS = {
  "...22222.2222...",
  "...2222...222...",
}
local SKIRT = {
  "...2222222222...",
  "...2222222222...",
  "...2222222222...",
  "...2222222222...",
}
local TRENCH = { -- a trench coat's skirt, to the knees
  "...11111111112..",
  "...11111111112..",
  "...11111111112..",
  "..111111111112..",
  "..111111111122..",
  "..111111111122..",
}

local function join(a, b)
  local out = { table.unpack(a) }
  for _, r in ipairs(b) do out[#out + 1] = r end
  return out
end

-- Each kind's body for a look, in its colours: its hips' row, its legs { near, far, shoe } (letters),
-- and its pixel map from row 14.
local BODY = {}
function BODY.jogger(lk, sk)
  local legs = lk.leggings and { lk.bottom[1], lk.bottom[2], "w" } or { sk[1], sk[2], "w" }
  return { hip = 27, legs = legs, body = paint(JOGGER, { ["1"] = lk.top[1], ["2"] = lk.top[2], ["3"] = lk.bottom[1], s = sk[1], S = sk[2] }) }
end
function BODY.student(lk, sk)
  local legs = lk.skirt and { sk[1], sk[2], "w" } or { lk.bottom[1], lk.bottom[2], "w" }
  local map = { ["1"] = lk.top[1], ["2"] = lk.top[2], ["3"] = lk.bottom[1], ["4"] = lk.bottom[2], s = sk[1], S = sk[2] }
  return { hip = 30, legs = legs, body = paint(join(STUDENT, lk.skirt and DENIM_SKIRT or JEANS), map) }
end
function BODY.commuter(lk, sk)
  local below = { trousers = TROUSERS, skirt = SKIRT, trench = TRENCH }
  local legs = ({ trousers = { lk.suit[2], "k", "k" }, skirt = { sk[1], sk[2], "k" }, trench = { "h", "k", "k" } })[lk.below]
  local map = { ["1"] = lk.suit[1], ["2"] = lk.suit[2], ["5"] = lk.tie or "w", s = sk[1], S = sk[2] }
  return { hip = 32, legs = legs, body = paint(join(SUIT, below[lk.below]), map) }
end

-- The looks, in order (look 0 first). who: "woman" or "man"; skin: a SKIN tone; hair: { a HAIR
-- style, its colour }; face: a FACES face (plain if none); and the kind's clothes.
--   jogger: top { base, shadow }, bottom { near, far } (shorts, or leggings on the legs too)
--   elder: coat { base, shadow }
--   student: top { base, shadow }, bottom { base, shadow } (jeans, or a skirt)
--   commuter: suit { base, shadow }, tie (none for a blouse), below: trousers, skirt or trench
F.LOOKS = {
  jogger = {
    { who = "woman", skin = "tan", hair = { "ponytail", "D" }, top = { "j", "J" }, bottom = { "h", "k" }, leggings = true },
    { who = "woman", skin = "deep", hair = { "puff", "k" }, top = { "y", "Y" }, bottom = { "k", "k" } },
    { who = "woman", skin = "light", hair = { "cap", "z" }, top = { "f", "F" }, bottom = { "c", "C" }, leggings = true },
    { who = "man", skin = "light", hair = { "band", "k" }, top = { "r", "R" }, bottom = { "k", "k" } },
    { who = "man", skin = "brown", hair = { "buzz", "k" }, top = { "u", "U" }, bottom = { "C", "C" } },
    { who = "man", skin = "tan", hair = { "curls", "D" }, top = { "p", "P" }, bottom = { "k", "k" } },
  },
  elder = {
    { who = "man", skin = "light", hair = { "flatCap", "w" }, face = "beard", coat = { "b", "B" } },
    { who = "woman", skin = "tan", hair = { "bun", "c" }, coat = { "p", "P" } },
    { who = "woman", skin = "deep", hair = { "oldCurls", "w" }, coat = { "v", "V" } },
    { who = "man", skin = "brown", hair = { "bald", "c" }, face = "beard", coat = { "u", "U" } },
    { who = "woman", skin = "brown", hair = { "scarf", "f" }, coat = { "g", "G" } },
    { who = "man", skin = "light", hair = { "short", "w" }, coat = { "h", "k" } },
  },
  student = {
    { who = "man", skin = "brown", hair = { "student", "k" }, top = { "u", "U" }, bottom = { "h", "k" } },
    { who = "woman", skin = "light", hair = { "long", "k" }, top = { "c", "C" }, bottom = { "u", "U" } },
    { who = "woman", skin = "deep", hair = { "braids", "k" }, top = { "j", "J" }, bottom = { "u", "U" }, skirt = true },
    { who = "man", skin = "deep", hair = { "locs", "k" }, top = { "r", "R" }, bottom = { "h", "k" } },
    { who = "woman", skin = "tan", hair = { "bob", "f" }, top = { "p", "P" }, bottom = { "h", "k" } },
    { who = "man", skin = "light", hair = { "messy", "z" }, top = { "v", "V" }, bottom = { "u", "U" } },
  },
  commuter = {
    { who = "man", skin = "light", hair = { "short", "D" }, suit = { "c", "C" }, tie = "r", below = "trousers" },
    { who = "woman", skin = "brown", hair = { "bob", "k" }, suit = { "U", "k" }, below = "skirt" },
    { who = "woman", skin = "light", hair = { "long", "x" }, suit = { "h", "k" }, below = "trousers" },
    { who = "man", skin = "tan", hair = { "part", "k" }, suit = { "U", "k" }, tie = "f", below = "trousers" },
    { who = "woman", skin = "deep", hair = { "bun", "k" }, suit = { "g", "G" }, below = "trench" },
    { who = "man", skin = "deep", hair = { "buzz", "k" }, face = "shortBeard", suit = { "b", "B" }, tie = "u", below = "trousers" },
  },
}

-- A look's head, its top-left at (hx, hy): the face, then the hair over it and behind it.
local function drawHead(b, lk, sk, hx, hy)
  local map = { s = sk[1], S = sk[2], H = lk.hair[2] }
  local face = paint(FACES[lk.face or "plain"], map)
  stamp(b, hx, hy + 14 - #face, face)
  local hair = HAIR[lk.hair[1]]
  stamp(b, hx, hy, paint(hair.top, map))
  if hair.back then stamp(b, hx, hy + hair.back[1], paint({ table.unpack(hair.back, 2) }, map)) end
end

-- A passer-by with their feet at (x, feet), facing left: a kind, and its look (0-5). step: 0-3
-- through the walk (nil standing); head: 0, 1 settled (breathing) or 2 nodding.
function F.person(b, kind, look, x, feet, step, head)
  local lk = assert(F.LOOKS[kind][look + 1], "no look " .. look .. " for " .. kind)
  local sk = SKIN[lk.skin]
  local ox, top = math.floor(x + 0.5) - 8, feet - 45
  local s = STRIDE[step or "stand"]
  local bob = s[3]
  local hx, hy = ox - (head == 2 and 1 or 0), top + bob + ((head or 0) > 0 and 1 or 0)
  if kind == "elder" then -- as the old man is drawn, in the look's coat, with the cane
    local c, sh = lk.coat[1], lk.coat[2]
    D.shadow(b, ox + 8, feet + 0.5, 10, 2.5)
    leg(b, ox + 5, top + 33, ox + 5 + s[2][1], feet - s[2][2], 2, C.ink, C.wood[1])
    leg(b, ox + 9, top + 33, ox + 9 + s[1][1], feet - s[1][2], 2, C.ink, C.wood[1])
    local cx = ox + (step and (step == 0 and -2 or step == 2 and 1 or 0) or 0)
    rect(b, cx, top + 27 + bob, cx, feet - 1, C.wood[1])
    rect(b, cx, top + 24 + bob, cx + 1, top + 24 + bob, C.wood[1])
    stamp(b, ox, top + 16 + bob, coat(c, sh))
    drawHead(b, lk, sk, hx, hy)
    stamp(b, ox, top + 14 + bob, paint(COLLAR, { b = c }))
    stamp(b, ox, top + 17 + bob, paint(armCane(c, sh), { s = sk[1] }))
    return
  end
  local k = BODY[kind](lk, sk)
  D.shadow(b, ox + 8, feet + 0.5, 9, 2.5)
  leg(b, ox + 4, top + k.hip + bob, ox + 4 + s[2][1], feet - s[2][2], 3, D.PX[k.legs[2]], D.PX[k.legs[3]])
  leg(b, ox + 8, top + k.hip + bob, ox + 8 + s[1][1], feet - s[1][2], 3, D.PX[k.legs[1]], D.PX[k.legs[3]])
  stamp(b, ox, top + 14 + bob, k.body)
  drawHead(b, lk, sk, hx, hy)
  if kind == "student" then stamp(b, hx, hy + 4, HEADPHONES) end
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
