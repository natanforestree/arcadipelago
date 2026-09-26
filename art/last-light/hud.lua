-- Last Light's HUD icons: health, rounds and shells (full and spent), flares, the crosshair (and its
-- warm Steady hands variant), the hit tick, the ember counter's ember, one 12x12 icon for each of the
-- fire's upgrades ("up-" and its key in last-light/src/upgrades.js), one 12x12 icon for each charm
-- ("charm-" and its key in last-light/src/charms.js), and each charm's pendant as it hangs from your gun
-- ("hang-", its key and a turn), in last-light/assets/hud.png with each icon's place in hud.json. Run
-- from the repo root:
--   aseprite -b --script art/last-light/hud.lua
--
-- Each icon is drawn from rows of characters, one colour each ('.' is empty). They're drawn over the
-- view as images, so they may use alpha, but they keep to palette colours.
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local L = dofile(here .. "lib.lua")
local P = L.palette()
local C = P.c

local KEY = {
  H = C.hurt, h = C.mouth, F = C.flare2, R = C.flare1,
  B = C.brass1, b = C.brass0, u = C.ui, d = C.uiDim, t = C.uiDim .. "99",
  k = C.iron1, w = C.snow4,
  Y = C.fire4, O = C.fire3, r = C.fire2, E = C.ember0, g = C.stone3, W = C.wood4, n = C.snow2,
  P = C.flesh4, p = C.flesh3, q = C.flesh2, K = C.night4, e = C.eye1, y = C.eye2, G = C.gum,
  m = C.wood3, ["5"] = C.wood5, S = C.snow3,
}

local function icon(rows)
  local b = L.buffer(#rows[1], #rows)
  for y, row in ipairs(rows) do
    assert(#row == b.w, "icon row " .. y .. " is " .. #row .. " wide, not " .. b.w)
    for x = 1, #row do
      local ch = row:sub(x, x)
      if ch ~= "." then b[y - 1][x - 1] = assert(KEY[ch], "no colour for '" .. ch .. "'") end
    end
  end
  return b
end

local pieces = {
  -- A heart, with a glint.
  { "heart", icon({
    ".HH.HH.",
    "HFHHHHH",
    "HHHHHHH",
    "HHHHHHh",
    ".HHHHh.",
    "..HHh..",
    "...h...",
  }) },
  -- A rifle cartridge: the bullet's lead-grey nose (in brass here, darker) and the case.
  { "round", icon({
    ".b.",
    "bBb",
    "bBb",
    "BBb",
    "BBb",
    "BBb",
    "BBb",
    "bbb",
  }) },
  { "roundEmpty", icon({
    ".d.",
    "d.d",
    "d.d",
    "d.d",
    "d.d",
    "d.d",
    "d.d",
    "ddd",
  }) },
  -- A shotgun shell: the red hull and its brass head.
  { "shell", icon({
    ".HHH.",
    "HFHHh",
    "HFHHh",
    "HHHHh",
    "HHHHh",
    "bBBBb",
    "BBBBb",
    "bbbbb",
  }) },
  { "shellEmpty", icon({
    ".ddd.",
    "d...d",
    "d...d",
    "d...d",
    "d...d",
    "d...d",
    "d...d",
    "ddddd",
  }) },
  -- A road flare: the red stick, its striker cap, and a dark end.
  { "flare", icon({
    "...kk",
    "..kkk",
    "..FR.",
    ".FRh.",
    ".RRh.",
    "FRh..",
    "RRh..",
    "Rh...",
  }) },
  -- A single dot, with faint ticks two pixels out.
  { "crosshair", icon({
    ".......",
    "...t...",
    ".......",
    ".t.u.t.",
    ".......",
    "...t...",
    ".......",
  }) },
  -- Four short diagonal ticks round the centre.
  { "hitTick", icon({
    "u.....u",
    ".u...u.",
    ".......",
    ".......",
    ".......",
    ".u...u.",
    "u.....u",
  }) },
  -- The crosshair gone warm: Steady hands is ready.
  { "crosshairSteady", icon({
    ".......",
    "...O...",
    ".......",
    ".O.Y.O.",
    ".......",
    "...O...",
    ".......",
  }) },
  -- An ember, for the counter.
  { "ember", icon({
    "...r...",
    "..rOr..",
    ".rOYOr.",
    ".rOYYO.",
    "ErOYOrE",
    ".EEEEE.",
    ".......",
  }) },
  -- Through-and-through: a round's streak through a pale shape and out the other side.
  { "up-pierce", icon({
    "............",
    "....dddd....",
    "...d....d...",
    "..d......d..",
    "..d......d..",
    "bBBBBBBBBBOY",
    "..d......d..",
    "..d......d..",
    "...d....d...",
    "....dddd....",
    "............",
    "............",
  }) },
  -- Quick lever: the lever's loop, and a blur of speed behind it.
  { "up-quickLever", icon({
    "............",
    "..uuuuuuu...",
    "..u.....u...",
    "..uuu...u...",
    "....u...u...",
    ".O..u...u...",
    "O...uuuuu...",
    ".O..........",
    "O..O........",
    ".O..........",
    "............",
    "............",
  }) },
  -- Steady hands: a warm ring round a still, bright centre.
  { "up-steady", icon({
    "............",
    "....OOOO....",
    "...O....O...",
    "..O......O..",
    "..O......O..",
    "..O..YY..O..",
    "..O..YY..O..",
    "..O......O..",
    "..O......O..",
    "...O....O...",
    "....OOOO....",
    "............",
  }) },
  -- Deep magazine: a row of rounds, and more behind them.
  { "up-deepMagazine", icon({
    "............",
    ".b..b..b..b.",
    "bBbbBbbBbbBb",
    "bBbbBbbBbbBb",
    "BBbBBbBBbBBb",
    "BBbBBbBBbBBb",
    "BBbBBbBBbBBb",
    "bbbbbbbbbbbb",
    "............",
    ".d..d..d..d.",
    ".d..d..d..d.",
    "............",
  }) },
  -- Slugs: one heavy grey ball in a shotgun shell's mouth.
  { "up-slugs", icon({
    "............",
    "....gggg....",
    "...gwwggg...",
    "...gwggggg..",
    "...gggggg...",
    "....gggg....",
    "...HHHHHH...",
    "...HFHHHh...",
    "...HFHHHh...",
    "...bBBBBb...",
    "...bbbbbb...",
    "............",
  }) },
  -- Dragon's breath: flame pouring from a shell.
  { "up-dragon", icon({
    "..r...O.....",
    "...O.YO..r..",
    ".r.OYYO.O...",
    "...OYYYO....",
    "..rOYYOr....",
    "...rOOr.....",
    "...HHHHH....",
    "...HFHHh....",
    "...HFHHh....",
    "...bBBBb....",
    "...bbbbb....",
    "............",
  }) },
  -- Magnesium: a flare burning white-hot.
  { "up-magnesium", icon({
    "......w.....",
    "..w..wYw..w.",
    "....wYYYw...",
    "...wYYYYw...",
    "....YYYYw...",
    ".....RR.....",
    ".....Rh.....",
    ".....Rh.....",
    ".....Rh.....",
    ".....Rh.....",
    ".....kk.....",
    "............",
  }) },
  -- Deep pockets: two flares, crossed.
  { "up-pockets", icon({
    "Y..........Y",
    "OR........RO",
    ".FR......RF.",
    "..FR....RF..",
    "...FR..RF...",
    ".....RR.....",
    ".....RR.....",
    "...RF..FR...",
    "..RF....FR..",
    ".RF......FR.",
    "gg........gg",
    "............",
  }) },
  -- Wide wick: the lantern, its light reaching out.
  { "up-wick", icon({
    "O....BB....O",
    ".O..B..B..O.",
    "....BBBB....",
    "O..B.YY.B..O",
    "...B.YO.B...",
    "...B.OO.B...",
    "O..BBBBBB..O",
    "....bbbb....",
    ".O........O.",
    "O..........O",
    "............",
    "............",
  }) },
  -- Long reach: an ember inside a wide dotted ring.
  { "up-reach", icon({
    "...d.d.d....",
    ".d.......d..",
    "............",
    "d....r....d.",
    "....rOr.....",
    "d..rOYOr..d.",
    "...ErOrE....",
    "d...EEE...d.",
    "............",
    ".d.......d..",
    "...d.d.d....",
    "............",
  }) },
  -- Warm hands: a heart, warmth rising off it.
  { "up-warm", icon({
    "...O...O....",
    "..O...O.....",
    "...O...O....",
    "............",
    ".HH..HH.....",
    "HFHHHHHH....",
    "HHHHHHHH....",
    "HHHHHHHh....",
    ".HHHHHh.....",
    "..HHHh......",
    "...Hh.......",
    "............",
  }) },
  -- Snowshoes: a webbed oval.
  { "up-snowshoes", icon({
    "....WWWW....",
    "...W.u.uW...",
    "..Wu.u.u.W..",
    "..W.u.u.uW..",
    "..Wu.u.u.W..",
    "..WWWWWWWW..",
    "..W.u.u.uW..",
    "..Wu.u.u.W..",
    "...W.u.uW...",
    "....WuuW....",
    ".....WW.....",
    "............",
  }) },
  -- Wolf's tooth: a long fang hanging from its cord.
  { "charm-wolf", icon({
    "....dddd....",
    "...d....d...",
    "....d..d....",
    ".....dd.....",
    "....PPPp....",
    "....PPPpq...",
    "....PPPpq...",
    ".....PPpq...",
    ".....PPpq...",
    "......Ppq...",
    ".......pq...",
    "........q...",
  }) },
  -- Red thread: a loop of it, knotted, the ends hanging loose.
  { "charm-thread", icon({
    "............",
    "....RRRR....",
    "...R....R...",
    "..R......R..",
    "..R......R..",
    "..R......R..",
    "...R....R...",
    "....RHHR....",
    ".....HH.....",
    "....H..H....",
    "...H....H...",
    "............",
  }) },
  -- Crow's feather: blue-black, with a pale sheen down its edge and a bare quill.
  { "charm-crow", icon({
    "..........n.",
    ".........nK.",
    "........nKK.",
    ".......nKKK.",
    "......nKKKK.",
    ".....nKKKK..",
    "....nKKKK...",
    "...nKKKK....",
    "...KKKK.....",
    "..d.KK......",
    ".d..........",
    "d...........",
  }) },
  -- Grave salt: a little heap of it, glinting.
  { "charm-salt", icon({
    "............",
    ".....w......",
    "....w.w.....",
    ".....w......",
    "............",
    ".....wS.....",
    "....wSSw....",
    "...wSSwSw...",
    "..wSSSSSSw..",
    ".wSSnSSSnSw.",
    ".nnnnnnnnnn.",
    "............",
  }) },
  -- Hare's foot: a furry foot tied with a cord, its claws showing.
  { "charm-hare", icon({
    "....dd......",
    "...d..d.....",
    "....dd......",
    "....mm......",
    "...m5mm.....",
    "...m55m.....",
    "...m55mm....",
    "...m555m....",
    "..m5555mm...",
    "..m55555m...",
    "..mm5555mm..",
    "...p.p.p....",
  }) },
  -- The Mother's eye: open, glowing, in its lids.
  { "charm-eye", icon({
    "............",
    "............",
    "....GGGG....",
    "..GGyyyyGG..",
    ".GyyekkeyyG.",
    "GyyekkkkeyyG",
    ".GyyekkeyyG.",
    "..GGyyyyGG..",
    "....GGGG....",
    "............",
    "............",
    "............",
  }) },
}

-- The charms as they hang from your gun: each a charm on a short chain, bigger than its icon and
-- outlined in the dark so it reads against the snow and the gun, lit from your lantern on the left.
-- A pendant is drawn turned to HANG_TURNS angles, evenly from -HANG_MOST to HANG_MOST radians
-- (positive swings it to the right), about the top of its chain, which sits HANG_PIVOT pixels from
-- the left of each piece (hud.js swings it by choosing the turn).
local HANG_TURNS, HANG_MOST, HANG_PIVOT = 11, 0.75, 22
local HANG_W, HANG_H = 2 * HANG_PIVOT + 1, 25
local CHAIN = { C.stone3, C.stone1, C.stone3, C.stone1, C.stone3 }
local PENDANTS = {
  { "wolf", {
    ".....BBB.....",
    "....BYBbB....",
    "....bBbbb....",
    "....PPPPp....",
    "....PPPPpq...",
    "....PPPPpq...",
    "....PPPPpq...",
    ".....PPPpq...",
    ".....PPPpq...",
    ".....PPPpq...",
    "......PPpq...",
    "......PPpq...",
    ".......Ppq...",
    "........pq...",
    "........q....",
  } },
  { "thread", {
    "......R......",
    "......R......",
    ".....RHR.....",
    "....RRHHR....",
    "...R.....R...",
    "..R.......R..",
    "..R.......R..",
    "..R.......R..",
    "...R.....R...",
    "....RR.RR....",
    ".....RHH.....",
    "....RH.HR....",
    "...RH...HR...",
    "...H.....H...",
  } },
  { "crow", {
    "......d......",
    "......d......",
    ".....ndK.....",
    "....nKdKK....",
    "....nKdKK....",
    "...nKKdKKK...",
    "...nKKdKKK...",
    "...nKKdKKK...",
    "...nKKdKKK...",
    "....nKdKK....",
    "....nKdKK....",
    ".....KdK.....",
    ".....KdK.....",
    "......K......",
  } },
  { "salt", {
    "......m......",
    ".....mmm.....",
    "....wwwww....",
    "....mmmmm....",
    ".....SSn.....",
    "....SSSSn....",
    "...SSSSSnn...",
    "..SSwSSSSnn..",
    "..SSSSSSSnn..",
    "..SSSSSSnnn..",
    "...SSSSnnn...",
    "....nnnnn....",
  } },
  { "hare", {
    ".....BBB.....",
    "....BYBbB....",
    "....m555m....",
    "....55555m...",
    "...555555m...",
    "...5555555m..",
    "...5555555m..",
    "...555555mm..",
    "...55555mmm..",
    "....555mmm...",
    "....55mmm....",
    "....P.P.P....",
  } },
  { "eye", {
    ".....kkk.....",
    ".....k.k.....",
    "....GGGGG....",
    "..GGGyyyGGG..",
    ".GGyyeeeyyGG.",
    ".GyyekkkeyyG.",
    ".GyyekkkeyyG.",
    ".GGyyeeeyyGG.",
    "..GGGyyyGGG..",
    "....GGGGG....",
  } },
}

-- A pendant upright: the chain, then the charm under it, outlined in the dark (the chain isn't).
local function pendant(rows)
  local body = L.buffer(#rows[1] + 2, #rows + 2)
  for y, row in ipairs(rows) do
    assert(#row == 13, "pendant row " .. y .. " is " .. #row .. " wide, not 13")
    for x = 1, #row do
      local ch = row:sub(x, x)
      if ch ~= "." then body[y][x] = assert(KEY[ch], "no colour for '" .. ch .. "'") end
    end
  end
  L.outline(body, C.void)
  local b = L.buffer(body.w, #CHAIN + body.h - 1)
  for y = 0, #CHAIN - 1 do b[y][7] = CHAIN[y + 1] end
  for y = 0, body.h - 1 do
    for x = 0, body.w - 1 do
      if body[y][x] then b[#CHAIN + y - 1][x] = body[y][x] end
    end
  end
  return b
end

-- The pendant `src` turned by angle a about the top of its chain, into a HANG_W x HANG_H piece. Each
-- pixel takes the colour most of its 4x4 samples land on, or none if fewer than 5 land on the pendant,
-- so thin lines (the chain, the thread) survive the turn.
local function turned(src, a)
  local b = L.buffer(HANG_W, HANG_H)
  local c, s = math.cos(a), math.sin(a)
  local cx = src.w / 2
  for y = 0, HANG_H - 1 do
    for x = 0, HANG_W - 1 do
      local count, order, hit = {}, {}, 0
      for j = 0, 3 do
        for i = 0, 3 do
          local dx, dy = x + (i + 0.5) / 4 - (HANG_PIVOT + 0.5), y + (j + 0.5) / 4
          local sx, sy = math.floor(dx * c - dy * s + cx), math.floor(dx * s + dy * c)
          local col = sy >= 0 and sy < src.h and sx >= 0 and sx < src.w and src[sy][sx] or nil
          if col then
            hit = hit + 1
            if not count[col] then
              count[col] = 0
              order[#order + 1] = col
            end
            count[col] = count[col] + 1
          end
        end
      end
      if hit >= 5 then
        local best = order[1]
        for _, col in ipairs(order) do if count[col] > count[best] then best = col end end
        b[y][x] = best
      end
    end
  end
  return b
end

local hangs = {}
for _, p in ipairs(PENDANTS) do
  local src = pendant(p[2])
  assert(src.h <= HANG_H, p[1] .. "'s pendant is too long")
  for i = 0, HANG_TURNS - 1 do
    hangs[#hangs + 1] = { "hang-" .. p[1] .. "-" .. i, turned(src, -HANG_MOST + 2 * HANG_MOST * i / (HANG_TURNS - 1)) }
  end
end
for _, h in ipairs(hangs) do pieces[#pieces + 1] = h end
L.writePieces("hud", pieces)
print("hud written")
