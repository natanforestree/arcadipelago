-- The animals of One Tree Island in the flat style, for the sprite sheet (sprites.lua). Each is drawn
-- facing left, its feet (or for a swimmer, the waterline) at (x, y), and the sheet mirrors it to face
-- right. Each has three poses, two frames each:
--   cross  coming by: the land animals walk or hop along the island, the swimmers swim or wade just off
--          its shore, and the birds fly
--   sit    settled on its spot, breathing (frame 1 a breath)
--   beat   keeping the beat once it's hooked: frame 0 is its sit, and frame 1 its move on the beat (the
--          frog bobs, the fox's tail sways, the ducks bob, the bunny's ears twitch, the heron dips its
--          head, the owl blinks, and the rest have a little move of their own)
-- They're drawn with the palette's pixel-map letters (draw.lua), and "~" for the mist-pale ripple
-- round a swimmer.
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local D = dofile(here .. "draw.lua")
local L, C = D.L, D.C
local A = {}

A.IDS = { "bunny", "ducks", "squirrel", "heron", "turtle", "deer", "fox", "frog", "hedgehog", "crow", "owl" }

local INK = setmetatable({ ["~"] = C.mist }, { __index = D.PX })
local function stamp(b, ox, oy, rows)
  for j, row in ipairs(rows) do
    for i = 1, #row do
      local ch = row:sub(i, i)
      if ch ~= "." then L.set(b, ox + i - 1, oy + j - 1, assert(INK[ch], "no colour for " .. ch)) end
    end
  end
end

-- The map with its top n rows moved down a pixel, over the row below them: a breath, or a nod.
local function lower(rows, n)
  local out = {}
  for i, r in ipairs(rows) do out[i] = i <= n and ("."):rep(#r) or r end
  for i = n, 1, -1 do
    local under, over = out[i + 1], rows[i]
    out[i + 1] = under:gsub("()(.)", function(k, ch) local c = over:sub(k, k); return c ~= "." and c or ch end)
  end
  return out
end

-- Each animal's maps: sit, its breath (sit1; by default its top `head` rows lowered a pixel), its move
-- on the beat (beat), and its two crossing frames (cross).
local M = {}

M.bunny = {
  head = 6,
  sit = {
    "..w.w......",
    ".wf.wf.....",
    ".wf.wf.....",
    ".ww.ww.....",
    ".wwwww.....",
    "wkwwwwc....",
    "fwwwwwwww..",
    ".cwwwwwwwww",
    "..wwwwwwwcw",
    "..cwwwwwcww",
    "...cc..cc..",
  },
  beat = {
    "...........",
    ".wf.ww.....",
    ".wf..wf....",
    ".ww...ww...",
    ".wwwww.....",
    "wkwwwwc....",
    "fwwwwwwww..",
    ".cwwwwwwwww",
    "..wwwwwwwcw",
    "..cwwwwwcww",
    "...cc..cc..",
  },
  cross = { -- hopping: crouched, then stretched out in the air
    {
      "..w.w......",
      ".wf.wf.....",
      ".wf.wf.....",
      ".ww.ww.....",
      ".wwwww.....",
      "wkwwwwc....",
      "fwwwwwwww..",
      ".cwwwwwwwww",
      "..wwwwwwwcw",
      "..cwwwwwcww",
      "...cc..cc..",
    },
    {
      "..ww........",
      ".wfwf.......",
      "..wfwf......",
      "..wwww......",
      ".wkwwwwwww..",
      "fwwwwwwwwwww",
      "..cwwwwwwccc",
      "........cc..",
      "............",
      "............",
      "............",
    },
  },
}

M.ducks = { -- the mother and her three ducklings in a row behind her
  head = 0,
  sit = {
    ".BB.........................",
    "BBkB........................",
    "YBBB.........yy......yy.....",
    "..BbbbbbB...ykyy....ykyy....",
    "..bbbbBBbb..Yyyyyy..Yyyyyy..",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  },
  beat = {
    "............................",
    ".BB..........yy.............",
    "BBkB........ykyy.....yy.....",
    "YBbbbbbbB...Yyyyyy..ykyy....",
    "..bbbbBBbb..........Yyyyyy..",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  },
  cross = {
    {
      ".BB.........................",
      "BBkB........................",
      "YBBB.........yy......yy.....",
      "..BbbbbbB...ykyy....ykyy....",
      "..bbbbBBbb..Yyyyyy..Yyyyyy..",
      ".~~~~~~~~~~..~~~~~~..~~~~~~~",
    },
    {
      ".BB.........................",
      "BBkB........................",
      "YBBB.........yy......yy.....",
      "..BbbbbbB...ykyy....ykyy....",
      "..bbbbBBbb..Yyyyyy..Yyyyyy..",
      "~~~~~~~~~~~~.~~~~~~~.~~~~~~.",
    },
  },
}

M.squirrel = {
  head = 4,
  sit = {
    "........xx.",
    ".x.....xxxx",
    "xxx...xxGxx",
    "kxxx..xG.xx",
    "xxxx..xG..x",
    ".xxxx.xG...",
    "..xwxxxG...",
    "..xwxxGG...",
    "..xxxxG....",
    "...G.G.....",
  },
  beat = { -- its tail flicks up
    ".......xx..",
    ".x....xxxx.",
    "xxx...xGxxx",
    "kxxx..xGx.x",
    "xxxx..xG...",
    ".xxxx.xG...",
    "..xwxxxG...",
    "..xwxxGG...",
    "..xxxxG....",
    "...G.G.....",
  },
  cross = { -- hopping, its tail up behind
    {
      "........xx.",
      ".x.....xxxx",
      "xxx...xxGxx",
      "kxxx..xG.xx",
      "xxxx..xG..x",
      ".xxxx.xG...",
      "..xwxxxG...",
      "..xwxxGG...",
      "..xxxxG....",
      "...G.G.....",
    },
    {
      "...........xx",
      "..x......xxxx",
      ".xxx....xxGx.",
      "kxxxxxxxxG...",
      "xxxxxxxxxG...",
      "..xwxxxxG....",
      "..G....GG....",
      ".............",
      ".............",
      ".............",
    },
  },
}

M.heron = {
  head = 7,
  sit = {
    "...kkk...",
    "..ccw....",
    "Yyccwk...",
    "...cw....",
    "...cw....",
    "....cw...",
    "....cww..",
    "...ccccC.",
    "..cccccCC",
    "..wcccCCC",
    "...wccCC.",
    "....cCC..",
    ".....h.h.",
    ".....h.h.",
    ".....h.h.",
    ".....h.h.",
    "...~~~~~~",
  },
  beat = { -- it dips its head
    ".........",
    ".........",
    ".........",
    "...kkk...",
    "..ccw....",
    "Yyccwk...",
    "....cww..",
    "...ccccC.",
    "..cccccCC",
    "..wcccCCC",
    "...wccCC.",
    "....cCC..",
    ".....h.h.",
    ".....h.h.",
    ".....h.h.",
    ".....h.h.",
    "...~~~~~~",
  },
  cross = {
    {
      "..kkk.....",
      ".ccw......",
      "Yccwk.....",
      "..cw......",
      "...cw.....",
      "...cww....",
      "..ccccC...",
      ".cccccCCC.",
      ".wcccCCCC.",
      "..wccCCC..",
      "...cCC....",
      "...h..h...",
      "..h....h..",
      ".h......h.",
      ".h......h.",
      "~~~~..~~~~",
    },
    {
      "..kkk.....",
      ".ccw......",
      "Yccwk.....",
      "..cw......",
      "...cw.....",
      "...cww....",
      "..ccccC...",
      ".cccccCCC.",
      ".wcccCCCC.",
      "..wccCCC..",
      "...cCC....",
      "....hh....",
      "....h.h...",
      "....h.h...",
      "....h.h...",
      "..~~~~~~..",
    },
  },
}

M.turtle = { -- a brown shell, green skin
  head = 0,
  sit = {
    "....gGgGg.....",
    "...gGgGgGgG...",
    "..GgGgGgGgGg..",
    "lkDDDDDDDDDDD.",
    "lll.ll....ll.l",
  },
  sit1 = {
    "....gGgGg.....",
    "...gGgGgGgG...",
    "..GgGgGgGgGg..",
    ".kDDDDDDDDDDD.",
    "lll.ll....ll.l",
  },
  beat = { -- its head bobs out
    "....gGgGg.....",
    "ll.gGgGgGgG...",
    "lkGgGgGgGgGg..",
    ".lDDDDDDDDDDD.",
    "..l.ll....ll.l",
  },
  cross = {
    { "....gGgGg.....", "ll.gGgGgGgG...", "lkGgGgGgGgGg..", "~ll~~~~~~~~l~~" },
    { "....gGgGg.....", "ll.gGgGgGgG...", "lkGgGgGgGgGgl.", "~~~l~~~~~~~~~~" },
  },
}

M.deer = {
  head = 8,
  sit = {
    "G...G.........",
    ".G.G..........",
    "..GG..........",
    ".gggg.........",
    "ggkgg.........",
    "kggggg........",
    "..ggg.........",
    "..gggggggggg..",
    "..gwgggggggGgw",
    "...gwgggggGGG.",
    "...gggggggGGG.",
    "...G.G...G.G..",
    "...G.G...G.G..",
    "...D.D...D.D..",
  },
  beat = { -- an ear flicks back
    "G...G.........",
    ".G.G..........",
    "..GG..........",
    ".gggg.g.......",
    "ggkggg........",
    "kggggg........",
    "..ggg.........",
    "..gggggggggg..",
    "..gwgggggggGgw",
    "...gwgggggGGG.",
    "...gggggggGGG.",
    "...G.G...G.G..",
    "...G.G...G.G..",
    "...D.D...D.D..",
  },
  cross = { -- walking
    {
      "G...G.........",
      ".G.G..........",
      "..GG..........",
      ".gggg.........",
      "ggkgg.........",
      "kggggg........",
      "..ggg.........",
      "..gggggggggg..",
      "..gwgggggggGgw",
      "...gwgggggGGG.",
      "...gggggggGGG.",
      "...G.G...G.G..",
      "..G...G.G...G.",
      "..D...D.D...D.",
    },
    {
      "G...G.........",
      ".G.G..........",
      "..GG..........",
      ".gggg.........",
      "ggkgg.........",
      "kggggg........",
      "..ggg.........",
      "..gggggggggg..",
      "..gwgggggggGgw",
      "...gwgggggGGG.",
      "...gggggggGGG.",
      "...G.G...G.G..",
      "....GG....GG..",
      "....DD....DD..",
    },
  },
}

M.fox = {
  head = 6,
  sit = {
    ".O.O..........",
    ".OOO..........",
    "OkOOO.........",
    "wOOOO.........",
    "kwwO..........",
    "..OOO.........",
    "..OwOO....xx..",
    "..OwOOO..xOOx.",
    "..OwOOOO.xOOx.",
    "..OOOOOOOxOx..",
    "..k.OOOOOxx...",
    "..k.kxxxwww...",
  },
  beat = { -- its tail sways the other way
    ".O.O..........",
    ".OOO..........",
    "OkOOO.........",
    "wOOOO.........",
    "kwwO..........",
    "..OOO.........",
    "..OwOO........",
    "..OwOOO.......",
    "..OwOOOO......",
    "..OOOOOOOxx...",
    "..k.OOOOxOOxx.",
    "..k.kxxxxOOww.",
  },
  cross = { -- trotting, its tail out behind
    {
      "..O.O.............",
      "..OOO.............",
      ".OkOO.............",
      "wOOOOOOOOOOOOx....",
      ".kwwOOOOOOOOOOxxx.",
      "...wwOOOOOOOOxOOOx",
      "...k..k...k..k.Oww",
      "..k....k.k....k...",
    },
    {
      "..O.O.............",
      "..OOO.............",
      ".OkOO.............",
      "wOOOOOOOOOOOOx....",
      ".kwwOOOOOOOOOOxxx.",
      "...wwOOOOOOOOxOOOx",
      "....k.k....k.k.Oww",
      "....k.k....k.k....",
    },
  },
}

M.frog = {
  head = 0,
  sit = {
    ".oo.oo..",
    "okoookoo",
    "ooooooool",
    "lowwwolll",
    "ll.ll.ll.",
  },
  sit1 = {
    ".oo.oo..",
    "okoookoo",
    "ooooooool",
    "lowwwwoll",
    "ll.ll.ll.",
  },
  beat = { -- it bobs
    ".........",
    ".oo.oo..",
    "okoookoo",
    "ooooooool",
    "llwwwolll",
  },
  cross = { -- on a lily pad, then leaping to the next
    { "..........", ".oo.oo....", "okoookoo..", "ooooooool.", "lowwwolll.", "eelllllee.", "~~~....~~~" },
    { "oo.oo.....", "kooookoo..", "ooooooooll", ".owwwool.l", "l.......l.", "..........", "..~~~~~~.." },
  },
}

M.hedgehog = {
  head = 0,
  sit = {
    "....BbBbB...",
    "...BbBbBbB..",
    "..ssBbBbBbB.",
    ".kssbBbBbBb.",
    "sssssbBbBbB.",
    "..ss.s..s...",
  },
  sit1 = {
    "............",
    "....BbBbB...",
    "..ssBbBbBbB.",
    ".kssbBbBbBb.",
    "sssssbBbBbB.",
    "..ss.s..s...",
  },
  beat = { -- a little hop
    "....BbBbB...",
    "...BbBbBbB..",
    "..ssBbBbBbB.",
    ".kssbBbBbBb.",
    "sssssbBbBbB.",
    "............",
  },
  cross = { -- trundling along
    { "....BbBbB...", "...BbBbBbB..", "..ssBbBbBbB.", ".kssbBbBbBb.", "sssssbBbBbB.", "..ss.s..s..." },
    { "....BbBbB...", "...BbBbBbB..", "..ssBbBbBbB.", ".kssbBbBbBb.", "sssssbBbBbB.", "...s.s...s.." },
  },
}

M.crow = {
  head = 3,
  sit = {
    "..kk........",
    ".kkkk.......",
    "hkwkk.......",
    ".kkkkk......",
    "..kkkkkhh...",
    "..kkkkhhhkk.",
    "...kkkkkkkkk",
    "....kk....kk",
    "....D.D.....",
  },
  beat = { -- it caws, its beak open
    "..kk........",
    ".kkkk.......",
    "hkwkk.......",
    "h.kkkk......",
    "..kkkkkhh...",
    "..kkkkhhhkk.",
    "...kkkkkkkkk",
    "....kk....kk",
    "....D.D.....",
  },
  cross = {
    { "......kk.....", ".....kkk.....", "..kk.khk.....", "hkwkkkkkkkkk.", "..kkkkkkkk.kk", "......kk.....", "............." },
    { ".............", "..kk.........", "hkwkkkkkkkkk.", "..kkkkkkkk.kk", "....khkk.....", ".....kkk.....", "......kk....." },
  },
}

M.owl = {
  head = 0,
  sit = {
    ".B....B..",
    ".BbbbbB..",
    "bwwbwwbb.",
    "wykwykwb.",
    "bwwYwwbbB",
    ".bbbbbbbB",
    ".bwbwbbBB",
    ".bbwbwbBB",
    "..bbbbBB.",
    "...Y..Y..",
  },
  sit1 = {
    ".B....B..",
    ".BbbbbB..",
    "bwwbwwbb.",
    "wykwykwb.",
    "bwwYwwbbB",
    ".bbbbbbbB",
    ".bwbwbbBB",
    ".bbwbwbBB",
    ".bbbbbbBB",
    "...Y..Y..",
  },
  beat = { -- it blinks
    ".B....B..",
    ".BbbbbB..",
    "bwwbwwbb.",
    "wBBwBBwb.",
    "bwwYwwbbB",
    ".bbbbbbbB",
    ".bwbwbbBB",
    ".bbwbwbBB",
    "..bbbbBB.",
    "...Y..Y..",
  },
  cross = { -- flying, wings up then down
    {
      "bB..........Bb",
      ".bB..B..B..Bb.",
      "..bBBbbbbBBb..",
      "....wwbwwb....",
      "....ykwykw....",
      "....wwYwwb....",
      ".....bbbb.....",
      "......YY......",
    },
    {
      ".....B..B.....",
      ".....bbbb.....",
      "....wwbwwb....",
      "....ykwykw....",
      "..bbwwYwwbbb..",
      ".bB.bbbbbb.Bb.",
      "bB...bbbb...Bb",
      "......YY......",
    },
  },
}

-- Draws animal `id` in pose 'cross', 'sit' or 'beat', frame 0 or 1, facing left, its feet (or
-- waterline) at (x, y).
function A.draw(b, id, pose, frame, x, y)
  local m = M[id]
  local function put(rows, dy)
    local w = 0
    for _, r in ipairs(rows) do w = math.max(w, #r) end
    stamp(b, x - w // 2, y - #rows + 1 + (dy or 0), rows)
  end
  if pose == "cross" then put(m.cross[frame + 1])
  elseif pose == "beat" and frame == 1 then put(m.beat)
  elseif frame == 1 then put(m.sit1 or lower(m.sit, m.head))
  else put(m.sit) end
end

return A
