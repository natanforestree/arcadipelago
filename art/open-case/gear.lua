-- Your gear from the music shop, in the flat style, for the sprite sheet (sprites.lua) and the shop
-- (shop.lua): you playing each instrument, your pedals on the ground by the crate, the small amp
-- that comes with the electric guitar, the gear strip's icons along the bottom of the screen, and
-- each instrument and pedal as it stands in the shop.
--
-- You are drawn in the style sample's first layout and moved by D.YOU, like draw.lua's D.you. The
-- pedals, the amp and the strip's icons are drawn where they go on the game's screen.
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local D = dofile(here .. "draw.lua")
local L, C, rect, stamp = D.L, D.C, D.rect, D.stamp
local G = {}

G.PEDALS = { "overdrive", "chorus", "tremolo", "delay", "reverb" } -- in chain order, keys 2 to 6
G.INSTRUMENTS = { "acoustic", "ukulele", "electric", "epiano", "synth" }
-- Each pedal's colour and its shadow, as pixel-map letters.
G.PEDAL_COLORS = {
  overdrive = { "o", "l" }, chorus = { "u", "U" }, tremolo = { "y", "Y" }, delay = { "r", "R" }, reverb = { "v", "V" },
}
G.PEDAL_ROW = { 117, 160 } -- your first pedal's top-left on the ground, in front of the crate...
G.PEDAL_STEP = 6 -- ...and each next one this far to the right
G.AMP = { 109, 136 } -- the amp's top-left, left of the crate behind the looper

-- A pixel map with its letters swapped: { from = to }.
local function recolour(rows, swap)
  local out = {}
  for i, r in ipairs(rows) do out[i] = r:gsub(".", function(ch) return swap[ch] or ch end) end
  return out
end

-------------------------------------------------------------------------------------------------
-- You, with each instrument

local UKULELE = { 133, 114, {
  "..........yyyy.",
  "...yyyy..yyyyyy",
  ".yyyyyyyyyyyyyy",
  "yyyDyyyyykkyyyy",
  "yyyDyyyyykkyyyy",
  "yyyDyyyyyyyyyy.",
  "YyyyyyyyyyyyyY.",
  "YyyyyyyyyyyyYY.",
  ".YYyyyyyyyYY...",
  "..YYYYYYYYY....",
  "....YYYYY......",
} }
local UKULELE_NECK = { { 148, 151, 116 }, { 152, 155, 115 }, { 156, 159, 114 }, { 160, 163, 113 }, { 164, 166, 112 } }
local UKULELE_HEAD = { 166, 108, {
  "..k.k",
  ".DDDD",
  "DDDD.",
  "DDD..",
} }
local ELECTRIC = { 128, 110, {
  "..................rr...",
  ".................rrrr..",
  "..rrrrr.........rrrr...",
  ".rrrrrrrr.....rrrrrr...",
  "rrrrrrrrrrrrrrrrrrrrrr.",
  "rrrwwwwwwwwwwwwwrrrrrrr",
  "rrwwkkwwwkkwwwwwwrrrrr.",
  "rrwwwwwwwwwwwwwrrrrrrr.",
  "RrrwwwwwwwwwwrrrrrrrR..",
  "RrrrrkkkrrrrrrrrrRR....",
  ".RRrrrrrrrrrrrrrR......",
  "..RRRrrrrrrrrRR........",
  "....RRRRRRRRR..........",
} }
local ELECTRIC_HEAD = { 176, 105, {
  "....k.k.k",
  "..ggggggg",
  ".gggggg..",
  "ggggg....",
  "ggg......",
} }

-- A guitar other than the acoustic, held the same way: its body, the arm on its neck, the neck, its
-- headstock, the fretting hand, then the strumming arm and hand (strum: -2 to 2, as for D.you).
local function guitar(b, body, neck, head, strum, dx, dy)
  local H = D.GUITAR_HANDS
  local function part(p, ddy) stamp(b, p[1] + dx, p[2] + dy + (ddy or 0), p[3]) end
  part(body)
  part(H.fretArm)
  for _, n in ipairs(neck) do rect(b, n[1] + dx, n[3] + dy, n[2] + dx, n[3] + 1 + dy, C.ink) end
  part(head)
  part(H.fretHand)
  part(H.strumUpper)
  part(H.strumHand, strum or 0)
end

-- The keyboards, seen from the front with the keys along the top: the electric piano's lid, keys and
-- wooden cheeks, and the synth's blue panel with its knobs and little screen. Each stands on an X.
local EPIANO = {
  "..kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk..",
  ".khhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhk.",
  "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
  "GwkwkwwkwkwkwwkwkwwkwkwkwwkwkwwkwkwkwwkwkG",
  "GwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwG",
  "DkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkD",
  "DhhhhhhhhhhhhhhhhhhhyhhhhhhhhhhhhhhhhhhhhD",
  "DhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhD",
}
local SYNTH = {
  "UuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuU",
  "UuyuyuyuooooouuuuuuuuuuuuuuuuuyuyuuuuuU",
  "UuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuU",
  "UwkwkwwkwkwkwwkwkwwkwkwkwwkwkwwkwkwkwwU",
  "UwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwU",
  "UUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU",
}
G.KEY_ROW = 3 -- the keys' first row, on both
G.KEYBOARDS = { epiano = EPIANO, synth = SYNTH }

-- An X stand for a keyboard: two crossed legs under each end, from the keyboard's bottom (y0) to the
-- floor (y1), centred on x.
local function xStand(b, x, y0, y1)
  for _, cx in ipairs({ x - 12, x + 12 }) do
    for y = y0, y1 do
      local k = (y - y0) / (y1 - y0)
      L.set(b, math.floor(cx - 5 + 10 * k + 0.5), y, C.ink)
      L.set(b, math.floor(cx + 5 - 10 * k + 0.5), y, C.ink)
    end
  end
end

-- A keyboard on its stand, its top-left at (x, y), its feet on row `floor`.
function G.keyboard(b, id, x, y, floor)
  local rows = G.KEYBOARDS[id]
  xStand(b, x + math.floor(#rows[1] / 2), y + #rows, floor)
  D.shadow(b, x + #rows[1] / 2, floor + 0.5, #rows[1] / 2 + 1, 1.5)
  stamp(b, x, y, rows)
end

-- Your arms reaching down to the keys, your hands on them. press: which hand is pressing (0 the left,
-- 1 both, 2 the right; nil neither). The hands sit on the keys' rows, a pixel lower pressing.
local ARM = { "hk", "hk", "hk", "hk", "hk", "hkk", ".hkk", ".hkk", "..hk", "..hk", "..hk", "..hk" }
local HAND = { "ssss", "SssS" }
local function keysPlayed(b, id, press, dx, dy)
  local x, y = 121 + dx, 117 + dy
  G.keyboard(b, id, x, y, 141 + dy)
  stamp(b, 129 + dx, 108 + dy, ARM)
  stamp(b, 145 + dx, 108 + dy, ARM)
  local left = (press == 0 or press == 1) and 1 or 0
  local right = (press == 1 or press == 2) and 1 or 0
  stamp(b, 131 + dx, y + G.KEY_ROW - 1 + left, HAND)
  stamp(b, 147 + dx, y + G.KEY_ROW - 1 + right, HAND)
end

-- You on your crate playing `id`. breath: 1 lowers your head a pixel. play: for a guitar, the picking
-- hand's height (-2 to 2, 0 at rest); for a keyboard, the hand pressing (0 to 2, nil at rest).
function G.you(b, id, breath, play)
  local dx, dy = D.YOU[1], D.YOU[2]
  if id == "acoustic" then return D.you(b, breath, play or 0) end
  D.youBody(b, breath, dx, dy)
  if id == "ukulele" then guitar(b, UKULELE, UKULELE_NECK, UKULELE_HEAD, play, dx, dy)
  elseif id == "electric" then guitar(b, ELECTRIC, D.GUITAR_HANDS.neck, ELECTRIC_HEAD, play, dx, dy)
  else keysPlayed(b, id, play, dx, dy) end
end

-------------------------------------------------------------------------------------------------
-- By the crate, and along the bottom of the screen

-- One of your pedals on the ground, in its place in the row. on: its light is lit.
function G.pedal(b, id, on)
  local i = 0
  for k, p in ipairs(G.PEDALS) do if p == id then i = k - 1 end end
  local x, y = G.PEDAL_ROW[1] + i * G.PEDAL_STEP, G.PEDAL_ROW[2]
  local c = G.PEDAL_COLORS[id]
  D.shadow(b, x + 2.5, y + 5.5, 3.5, 1)
  stamp(b, x, y, recolour({
    "bbbbb",
    "bLbbb",
    "bbbbb",
    "bbcbb",
    "SSSSS",
  }, { b = c[1], S = c[2], L = on and "w" or "k" }))
end

-- The small amp beside the crate, which comes with the electric guitar.
function G.amp(b)
  local x, y = G.AMP[1], G.AMP[2]
  D.shadow(b, x + 7, y + 13.5, 8, 1.5)
  stamp(b, x, y, {
    "....kkkkkk....",
    "...k......k...",
    "kkkkkkkkkkkkkk",
    "kYYYYYYYYYYYYk",
    "kYwYwYwYYYYoYk",
    "kkkkkkkkkkkkkk",
    "khhhhhhhhhhhhk",
    "khhhhhhhhhhhhk",
    "khhhhhhhhhhhhk",
    "khhhhhhhhhhhhk",
    "khhhhhhhhhhhhk",
    "khhhhhhhhhhhhk",
    "kkkkkkkkkkkkkk",
  })
end

-- A pedal's icon on the gear strip, from its top-left: lit in its colour while it's on, in its shadow
-- colour while it's off.
function G.stripIcon(b, id, on)
  local c = G.PEDAL_COLORS[id]
  stamp(b, 0, 0, recolour({
    ".bbbbb.",
    "bbbbbbb",
    "bbLbbbb",
    "bbbbbbb",
    "bbbbbbb",
    "bbcccbb",
    "bbcccbb",
    "SSSSSSS",
  }, { b = on and c[1] or c[2], S = on and c[2] or "N", L = on and "w" or "k" }))
end

return G
