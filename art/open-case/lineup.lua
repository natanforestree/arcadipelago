-- The passers-by's line-up, for checking the art by eye: every look of every kind, a row a kind,
-- each standing, mid-stride and walking the other way, in front of the hedge and on the path as in
-- the park. Run from the repo root:
--   aseprite -b --script art/open-case/lineup.lua
-- Writes art/open-case/preview-lineup.png (at 3x). Previews aren't committed.
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local D = dofile(here .. "draw.lua")
local F = dofile(here .. "figures.lua")
local L, C = D.L, D.C
local CELL, ROW = 20, 54 -- each figure's width in the line-up, and each kind's row's height

local b = L.buffer(4 + #F.LOOKS.jogger * 3 * CELL, #F.KINDS * ROW)
for i, kind in ipairs(F.KINDS) do
  local y0, feet = (i - 1) * ROW, (i - 1) * ROW + 49
  L.fillRect(b, 0, y0, b.w - 1, y0 + 29, C.leaf[2]) -- the hedge
  L.fillRect(b, 0, y0 + 30, b.w - 1, y0 + ROW - 1, C.path[2]) -- the path
  for look = 0, #F.LOOKS[kind] - 1 do
    local x = 2 + look * 3 * CELL + CELL / 2
    F.person(b, kind, look, x, feet, nil, 0)
    F.person(b, kind, look, x + CELL, feet, 0, 0)
    local fig = L.buffer(24, 50) -- the third, mirrored to walk right
    F.person(fig, kind, look, 12, 47, 2, 0)
    L.blit(b, D.mirror(fig), x + 2 * CELL - 11, feet - 47)
  end
end
L.save(L.scale(b, 3), nil, "art/open-case/preview-lineup.png")
print("line-up: preview-lineup.png")
