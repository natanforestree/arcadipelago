-- The keepsakes the island's animals leave, in the flat style, for the sprite sheet (sprites.lua): each
-- at the shelf's size (up to 12x12, for your room), as the faint outline that marks it on the shelf
-- until you've found it, and at the case's size (5x5) for the three you carry in your case's lid. In
-- keepsakes.js's order, two from each animal, the ordinary one first.
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local D = dofile(here .. "draw.lua")
local L, C, stamp = D.L, D.C, D.stamp
local K = {}

-- { id, shelf map, case map }, drawn with the palette's pixel-map letters (draw.lua).
K.LIST = {
  { "dandelion", {
    "..w.w.w.",
    ".w.www.w",
    "w.wwwww.",
    ".wwwcwww",
    "w.wwwww.",
    ".w.www.w",
    "..w.e.w.",
    "....e...",
    "....e...",
    "...ee...",
    "....e...",
  }, { ".w.w.", "wwwww", ".wcw.", "..e..", "..e.." } },
  { "clover", {
    "...oo.....",
    "..oool....",
    ".oo.ol.oo.",
    "ooool.oool",
    ".ollellll.",
    "..oo.e.oo.",
    ".ooolloool",
    ".oo.ol.oo.",
    "....ol....",
    ".....e....",
    "......e...",
  }, { ".o.o.", "oooll", ".lel.", "oo.oo", "...e." } },
  { "feather", {
    "........ww",
    ".......www",
    "......wwwc",
    ".....wwwc.",
    "....wwwc..",
    "...wwwc...",
    "..wwwc....",
    ".wwwc.....",
    ".wwc......",
    "..c.......",
    ".c........",
  }, { "...ww", "..wwc", ".wwc.", "wwc..", "c...." } },
  { "rubberduck", {
    "...yyy....",
    "..yyyyy...",
    "..ykyyy...",
    "OOyyyyy...",
    "OO.yyy....",
    ".yyyyyyyy.",
    "yyyyyyyyyy",
    "yyyyyyyyyY",
    ".yyyyyyyY.",
    "..YYYYYY..",
  }, { ".yy..", "Okyy.", ".yyyy", "yyyyY", ".YYY." } },
  { "acorn", {
    "....D.....",
    "..BBBBB...",
    ".BbBbBbB..",
    "BbBbBbBbB.",
    ".gggggggg.",
    ".gggggggG.",
    ".ggggggGG.",
    "..gggggG..",
    "...ggGG...",
    "....GG....",
  }, { ".BBB.", "BbBbB", "ggggG", ".ggG.", "..G.." } },
  { "goldacorn", {
    "....Y.....",
    "..YYYYY...",
    ".YyYyYyY..",
    "YyYyYyYyY.",
    ".ywyyyyyy.",
    ".wyyyyyyY.",
    ".yyyyyyYY.",
    "..yyyyyY..",
    "...yyYY...",
    "....YY....",
  }, { ".YYY.", "YyYyY", "wyyyY", ".yyY.", "..Y.." } },
  { "pebble", {
    "...cccc...",
    ".ccwwccc..",
    "ccwccccccC",
    "cccccccccC",
    ".cccccccCC",
    "..CCCCCCC.",
  }, { ".ccc.", "cwccC", "ccccC", ".CCC." } },
  { "fishbones", {
    "............",
    ".ww.........",
    "wwww.w.w.w.w",
    "wkwwwwwwwwww",
    "wwww.w.w.w.w",
    ".ww.........",
  }, { ".w...", "wwwww", "kwwww", "wwwww", ".w..." } },
  { "snailshell", {
    "...gggg...",
    "..gGGGGg..",
    ".gGgggGGg.",
    ".gGgDgGGg.",
    ".gGggGGgg.",
    "..gGGGgg..",
    "DDDggggg..",
    ".DDDDDD...",
  }, { ".ggg.", "gGgGg", "gGDGg", "DggG.", ".DD.." } },
  { "teacup", {
    "..........",
    "wwwwwwww..",
    "wffffffwww",
    "wwwwwwww.w",
    "wwwwwwwwww",
    ".wwwwww...",
    "..wwww....",
    "cccccccc..",
  }, { "wwww.", "fffww", "wwwww", ".ww..", "cccc." } },
  { "wildflower", {
    "...ff.....",
    "..fvvf....",
    ".fvyyvf...",
    "..fvvf....",
    "...ff.....",
    "....e.....",
    "....e.ll..",
    "..lle.l...",
    "...le.....",
    "....e.....",
  }, { ".fff.", "fvyvf", ".fff.", "..e..", ".le.." } },
  { "bell", {
    "..rr.rr..",
    "...rrr...",
    "...yyy...",
    "..yyyyy..",
    "..ywyyY..",
    ".ywyyyYY.",
    ".yyyyyYY.",
    "YYYYYYYYY",
    "....k....",
  }, { "rr.rr", ".yyy.", "ywyyY", "YYYYY", "..k.." } },
  { "blackberry", {
    "..e.ll....",
    "...elll...",
    "..VvVvV...",
    ".VvVvVvV..",
    ".vVwVvVv..",
    ".VvVvVvV..",
    "..VvVvV...",
    "...VvV....",
  }, { "..el.", ".VvV.", "VvwvV", "vVvVv", ".VvV." } },
  { "sock", {
    ".rrrr....",
    ".wwww....",
    ".rrrr....",
    ".wwww....",
    ".wwww....",
    ".wwww....",
    ".wwwwww..",
    "rwwwwwwww",
    "rrwwwwwrr",
    ".rrrrrrr.",
  }, { ".rr..", ".ww..", ".ww..", "rwwww", ".rrrr" } },
  { "lily", {
    "...w....",
    ".w.fw.w.",
    ".fwfwff.",
    "wffyyffw",
    ".fwwwwf.",
    "eellllee",
    ".elllle.",
  }, { "..w..", "wfwfw", ".fyf.", "elll.", ".ell." } },
  { "crown", {
    "y...y...y",
    "yy.yyy.yy",
    "yyyyryyyy",
    "yyyyyyyyy",
    "YYYYYYYYY",
    "yryyryyry",
    "YYYYYYYYY",
  }, { "y.y.y", "yyryy", "yyyyy", "YrYrY" } },
  { "leaf", {
    ".......xx",
    ".....OOx.",
    "...OOOxO.",
    "..OOOxOO.",
    ".OOOxOOO.",
    ".OOxOOOO.",
    ".OxOOOO..",
    "OxOOOO...",
    "x.OO.....",
  }, { "...Ox", "..OxO", ".OxO.", "OxO..", "x...." } },
  { "apple", {
    ".....e..",
    "....ell.",
    "..rrDrr.",
    ".rwrrrrr",
    ".wrrrrrR",
    ".rrrrrrR",
    ".rrrrrRR",
    "..rrrRR.",
    "...RRR..",
  }, { "..el.", ".rDr.", "rwrrR", "rrrRR", ".RRR." } },
  { "bottlecap", {
    ".c.c.c.c.",
    "cCCCCCCCc",
    ".CrrrrrC.",
    "cCrwrrrCc",
    ".CrrrrrC.",
    "cCCCCCCCc",
    ".c.c.c.c.",
  }, { "c.c.c", "CrrrC", "Crwrc", "CrrrC", "c.c.c" } },
  { "ring", {
    "...ww...",
    "..wyyw..",
    "..yyyy..",
    ".yY..Yy.",
    "yY....Yy",
    "yY....Yy",
    ".yY..Yy.",
    "..YYYY..",
  }, { "..w..", ".yyy.", "yY.Yy", "yY.Yy", ".YYY." } },
  { "owlfeather", {
    ".........b",
    "........bb",
    ".......bwb",
    "......bbbB",
    ".....bwbB.",
    "....bbbB..",
    "...bwbB...",
    "..bbbB....",
    ".bbB......",
    ".B........",
    "B.........",
  }, { "...bb", "..bwB", ".bbB.", "bwB..", "B...." } },
  { "spectacles", {
    "............",
    ".kkk....kkk.",
    "kwwck..kwwck",
    "kwcckkkkwcck",
    "kccck..kccck",
    ".kkk....kkk.",
  }, { ".....", "kk.kk", "wkkwk", "kk.kk", "....." } },
}

-- A keepsake at the shelf's size, its bottom middle at (x, y).
function K.shelf(b, i, x, y)
  local rows = K.LIST[i][2]
  stamp(b, x - #rows[1] // 2, y - #rows + 1, rows)
end

-- Its faint outline on the shelf, before you've found it: just its edge, in `colour`.
function K.outline(b, i, x, y, colour)
  local shape = L.buffer(b.w, b.h)
  K.shelf(shape, i, x, y)
  local edge = L.buffer(b.w, b.h)
  for yy = 0, b.h - 1 do for xx = 0, b.w - 1 do edge[yy][xx] = shape[yy][xx] end end
  L.outline(edge, colour)
  for yy = 0, b.h - 1 do
    for xx = 0, b.w - 1 do if edge[yy][xx] == colour and not shape[yy][xx] then b[yy][xx] = colour end end
  end
end

-- At the case's size, its bottom middle at (x, y).
function K.case(b, i, x, y)
  local rows = K.LIST[i][3]
  stamp(b, x - #rows[1] // 2, y - #rows + 1, rows)
end

return K
