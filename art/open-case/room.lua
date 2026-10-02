-- Your room at home in the flat style, for the sprite sheet (sprites.lua): one picture, the wall and its
-- window onto a morning over the woods behind your house, the shelf for your keepsakes with
-- its twenty-two empty cubbies (render.js puts each keepsake in its own, and the outlines of the ones
-- still to find), the desk with your groovebox, which opens the studio, a rug and a plant, and the
-- wooden floor. render.js draws the count over the shelf, the card along the bottom and the map key.
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local D = dofile(here .. "draw.lua")
local L, C, rect, oval, stamp = D.L, D.C, D.rect, D.oval, D.stamp
local W, H = D.W, D.H
local set = L.set
local R = {}

R.FLOOR = 106 -- the floor's first row
R.WINDOW = { 12, 16, 70, 66 } -- the glass: x0, y0, x1, y1
R.SHELF = { 86, 30, 15, 11, 2 } -- the shelf's top-left, its cubbies' pitch (each 14 square inside), its columns and rows
R.COUNT = { 168, 19 } -- the middle of the top of the count over the shelf
R.DESK = { 256, 82, 60, 46 } -- the desk with the groovebox on it, which a click opens: x, y, w, h

-- Cubby (col, row)'s inside: x0, y0, x1, y1.
function R.cubby(col, row)
  local x0, y0, p = R.SHELF[1] + 1 + col * R.SHELF[3], R.SHELF[2] + 1 + row * R.SHELF[3], R.SHELF[3]
  return x0, y0, x0 + p - 2, y0 + p - 2
end

function R.room(b)
  -- the wall, in teal, a paler stripe now and then, and the skirting board
  rect(b, 0, 0, W - 1, R.FLOOR - 1, C.teal[1])
  for x = 6, W - 1, 12 do rect(b, x, 0, x, R.FLOOR - 3, C.leaf[2]) end
  rect(b, 0, R.FLOOR - 3, W - 1, R.FLOOR - 1, C.wood[1])
  rect(b, 0, R.FLOOR - 3, W - 1, R.FLOOR - 3, C.wood[2])
  -- the floor, in planks that widen toward you
  local rows = { R.FLOOR, 110, 115, 121, 128, 136, 145, 155, 166, H }
  for r = 1, #rows - 1 do
    local y0, y1, len = rows[r], rows[r + 1] - 1, 26 + r * 9
    rect(b, 0, y0, W - 1, y1, C.wood[2])
    rect(b, 0, y1, W - 1, y1, C.wood[1])
    for x = (r * 23) % len, W - 1, len do rect(b, x, y0, x, y1, C.wood[1]) end
  end
  -- the rug
  oval(b, 168.5, 121.5, 58, 9, C.red[1])
  oval(b, 168.5, 121, 54, 7, C.red[2])
  for x = 120, 216, 8 do rect(b, x, 119, x + 3, 122, C.red[1]) end
  -- the window: the morning sky over the woods behind your house (as on the map, where they come up close
  -- behind it), the sun through the treetops, two pines and the round crowns of the trees in front, lit
  -- on their upper left; drawn on their own and kept to the glass, then the frame and the sill
  local w = R.WINDOW
  local view = L.buffer(W, H)
  local sky = { C.morning[1], C.morning[2], C.morning[3] }
  for y = w[2], w[4] do rect(view, w[1], y, w[3], y, sky[math.min(3, 1 + (y - w[2]) // 12)]) end
  oval(view, w[1] + 15.5, 31.5, 5, 5, C.light)
  for _, p in ipairs({ { w[1] + 31, 25 }, { w[1] + 50, 31 } }) do
    for y = p[2], w[4] do
      local hw = math.floor((y - p[2]) * 0.3) + ((y - p[2]) % 4 == 3 and 1 or 0)
      rect(view, p[1] - hw, y, p[1] + hw, y, C.leaf[1])
    end
  end
  rect(view, w[1], 56, w[3], w[4], C.leaf[1]) -- the woods' shade under the crowns
  for _, c in ipairs({ { w[1] - 2, 50, 10 }, { w[1] + 13, 44, 9 }, { w[1] + 27, 51, 10 }, { w[1] + 43, 45, 9 }, { w[1] + 58, 51, 11 },
    { w[1] + 6, 60, 9 }, { w[1] + 36, 61, 10 } }) do
    oval(view, c[1] + 0.5, c[2] + 0.5, c[3], c[3] * 0.85, C.leaf[2])
    oval(view, c[1] - 1.5, c[2] - 1.5, c[3] * 0.7, c[3] * 0.6, C.leaf[3])
  end
  for y = w[2], w[4] do for x = w[1], w[3] do b[y][x] = view[y][x] end end
  rect(b, w[1] - 3, w[2] - 3, w[3] + 3, w[2] - 1, C.wood[3])
  rect(b, w[1] - 3, w[2] - 3, w[1] - 1, w[4] + 2, C.wood[3])
  rect(b, w[3] + 1, w[2] - 3, w[3] + 3, w[4] + 2, C.wood[3])
  rect(b, (w[1] + w[3]) // 2, w[2], (w[1] + w[3]) // 2 + 1, w[4], C.wood[3])
  rect(b, w[1], 40, w[3], 41, C.wood[3])
  rect(b, w[1] - 5, w[4] + 1, w[3] + 5, w[4] + 3, C.wood[3])
  rect(b, w[1] - 5, w[4] + 4, w[3] + 5, w[4] + 4, C.wood[1])
  -- the plant under the window, in its pot
  stamp(b, 24, 96, {
    "....l..e......",
    "..e.le.le.....",
    ".lle.lel..l...",
    "..llelleell...",
    ".e.lleell.ee..",
    "...eellee.....",
    "....eeee......",
    "...RRRRRR.....",
    "...rrrrrR.....",
    "....rrrR......",
    "....rrrR......",
    "....rrrR......",
    "....RRRR......",
  })
  -- the shelf: its cubbies in two rows, dark inside, on two brackets
  local sx, sy, p, cols, rws = R.SHELF[1], R.SHELF[2], R.SHELF[3], R.SHELF[4], R.SHELF[5]
  rect(b, sx, sy, sx + cols * p, sy + rws * p, C.wood[2])
  rect(b, sx, sy, sx + cols * p, sy, C.wood[3])
  for row = 0, rws - 1 do
    for col = 0, cols - 1 do
      local x0, y0, x1, y1 = R.cubby(col, row)
      rect(b, x0, y0, x1, y1, C.wood[1])
      rect(b, x0, y1, x1, y1, C.brown[1]) -- its floor
    end
  end
  rect(b, sx - 2, sy + rws * p + 1, sx + cols * p + 2, sy + rws * p + 2, C.wood[3])
  for _, bx in ipairs({ sx + 12, sx + cols * p - 14 }) do
    stamp(b, bx, sy + rws * p + 3, { "DDD", ".DD", "..D" })
  end
  -- the desk, its drawer and legs, and on it your groovebox, a mug and a lamp
  local dx, dy = R.DESK[1], R.DESK[2] + 14
  rect(b, dx + 2, dy, dx + 59, dy + 1, C.wood[3])
  rect(b, dx + 2, dy + 2, dx + 59, dy + 8, C.wood[2])
  rect(b, dx + 18, dy + 4, dx + 42, dy + 6, C.wood[1])
  rect(b, dx + 29, dy + 5, dx + 31, dy + 5, C.yellow[2])
  rect(b, dx + 4, dy + 9, dx + 6, 126, C.wood[1])
  rect(b, dx + 55, dy + 9, dx + 57, 126, C.wood[1])
  stamp(b, dx + 12, dy - 10, {
    "hhhhhhhhhhhhhhhhhhhhhhhhh",
    "hkkkkkkkhkkooooook.wwh.wh",
    "hkOOkOOkhkkooooook.whhwwh",
    "hkkkkkkkhkkkkkkkkkhhhhhhh",
    "hkOOkOOkhkOOkOOkOOkOOkOOh",
    "hkkkkkkkhkkkkkkkkkkkkkkkh",
    "hkOOkOOkhkOOkOOkOOkOOkOOh",
    "hkkkkkkkhkkkkkkkkkkkkkkkh",
    "kkkkkkkkkkkkkkkkkkkkkkkkk",
    "kkkkkkkkkkkkkkkkkkkkkkkkk",
  })
  stamp(b, dx + 42, dy - 5, { "rrrr.", "rrrRR", "rrrR.R", "rrrRR", "RRRR." })
  stamp(b, dx + 48, dy - 15, {
    "...yyyy..",
    "..yyyyyy.",
    ".YYYYYYYY",
    ".....k...",
    "....k....",
    "...k.....",
    "...k.....",
    "...k.....",
    "...k.....",
    "...k.....",
    "...k.....",
    "...k.....",
    "...k.....",
    ".kkkkk...",
    "hhhhhhh..",
  })
end

return R
