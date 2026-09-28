-- Open Case's 16-bit style sample, for Nathan to judge the look before any repaint: the park at dusk at
-- 320x180, in layers at different depths (a dithered sky and the low sun, far rooftops, near trees,
-- grass and the paved path), you on your crate with the guitar, the open case with a few coins, the
-- looper, and an old man listening. And a short GIF of the old man walking in, nodding, and grinning
-- as his coin arcs into the case. Run from the repo root:
--   aseprite -b --script art/open-case/style-sample.lua
-- Writes art/open-case/preview-style.png (the still at 3x), preview-style-1x.png and
-- preview-oldman.gif (at 3x). Previews aren't committed.
local here = debug.getinfo(1, "S").source:sub(2):match("^(.-)[^/]+$") or ""
local L = dofile(here .. "../site/lib.lua") -- the site's buffer, noise and saving helpers
local C = dofile(here .. "palette.lua")
local W, H = 320, 180

-- The palette stays within 48 colours.
do
  local seen, n = {}, 0
  local function walk(t)
    for _, v in pairs(t) do
      if type(v) == "table" then walk(v) elseif not seen[v] then seen[v] = true; n = n + 1 end
    end
  end
  walk(C)
  assert(n <= 48, "the palette has " .. n .. " colours; keep it to 48")
  print("palette: " .. n .. " colours")
end

local function ell(x, y, cx, cy, rx, ry)
  local dx, dy = (x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry
  return dx * dx + dy * dy <= 1, dx, dy
end

-- Big surfaces (the trees) are dithered between shades; small ones (people, the guitar) aren't, or
-- they'd look grainy. The sprite painters set this while they paint.
local plain = false

-- A shade from a ramp for a surface facing (dx, dy), lit from the top-left.
local function shade(ramp, dx, dy, x, y)
  local v = (-dx * 0.6 - dy * 0.8) * 0.5 + 0.5 -- 0 (away from the light) .. 1 (toward it)
  local t = v * (#ramp - 1)
  local i = math.floor(t)
  if (plain and 0.5 or L.bayer(x, y)) < t - i then i = i + 1 end
  return ramp[math.max(1, math.min(#ramp, i + 1))]
end

local function blob(b, cx, cy, rx, ry, ramp)
  for y = math.floor(cy - ry), math.ceil(cy + ry) do
    for x = math.floor(cx - rx), math.ceil(cx + rx) do
      local inside, dx, dy = ell(x, y, cx, cy, rx, ry)
      if inside then L.set(b, x, y, shade(ramp, dx, dy, x, y)) end
    end
  end
end

-- A limb from (x0, y0) to (x1, y1), w pixels thick, its upper-left side lit.
local function limb(b, x0, y0, x1, y1, w, ramp)
  local n = math.max(1, math.ceil(math.max(math.abs(x1 - x0), math.abs(y1 - y0)) * 2))
  for i = 0, n do
    local t = i / n
    local cx, cy = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
    for y = math.floor(cy - w / 2), math.floor(cy + w / 2) do
      for x = math.floor(cx - w / 2), math.floor(cx + w / 2) do
        local dx, dy = (x + 0.5 - cx) / (w / 2), (y + 0.5 - cy) / (w / 2)
        if dx * dx + dy * dy <= 1.2 then L.set(b, x, y, shade(ramp, dx, dy, x, y)) end
      end
    end
  end
end

-- A sprite piece painted by fn(layer), outlined on its own and drawn over b.
local function piece(b, fn)
  local one = L.buffer(W, H)
  fn(one)
  L.outline(one, C.outline)
  L.blit(b, one, 0, 0)
end

-------------------------------------------------------------------------------------------------
-- The park, back to front (the same in every frame)

local LAMP_X, LAMP_Y = 70, 50 -- the lamp's head
local CASE_X, CASE_Y = 166, 138 -- the open case's front-left corner

local function park()
  local b = L.buffer(W, H)
  -- the sky: ordered dither between each pair of bands, dark at the top to the glow at the horizon
  for y = 0, 125 do
    for x = 0, W - 1 do
      local t = math.min(1, y / 112) * (#C.sky - 1)
      local i = math.floor(t)
      if L.bayer(x, y) < t - i then i = i + 1 end
      b[y][x] = C.sky[math.min(#C.sky, i + 1)]
    end
  end
  -- the low sun, half behind the rooftops
  for y = 80, 125 do
    for x = 212, 262 do
      local d = math.sqrt((x + 0.5 - 237) ^ 2 + (y + 0.5 - 104) ^ 2)
      if d < 15 then b[y][x] = C.sun elseif d < 19 and L.bayer(x, y) < (19 - d) / 4 then b[y][x] = C.sun end
    end
  end
  -- long clouds, lit from below by the sun
  for _, cl in ipairs({ { 60, 34, 46, 3 }, { 150, 22, 60, 2.5 }, { 250, 46, 52, 3 }, { 112, 58, 34, 2 }, { 300, 20, 30, 2 } }) do
    local cx, cy, len, th = cl[1], cl[2], cl[3], cl[4]
    for y = math.floor(cy - th), math.ceil(cy + th) do
      for x = math.floor(cx - len), math.ceil(cx + len) do
        local u = (x + 0.5 - cx) / len
        local half = th * (1 - u * u)
        if half > 0 and math.abs(y + 0.5 - cy) <= half then
          b[y][x] = (y + 0.5 > cy + half - 1.2) and C.sky[7] or ((y + 0.5 < cy - half + 1) and C.sky[4] or C.sky[5])
        end
      end
    end
  end
  -- far rooftops, a water tower and a few lit windows
  local x = 0
  local k = 0
  while x < W do
    local w = 12 + math.floor(L.rnd(k, 1, 31) * 20)
    local top = 90 + math.floor(L.rnd(k, 2, 31) * 16)
    for yy = top, 125 do
      for xx = x, math.min(W - 1, x + w - 1) do b[yy][xx] = (yy == top) and C.city[2] or C.city[1] end
    end
    for wy = top + 4, 118, 6 do
      for wx = x + 3, x + w - 4, 5 do
        if L.rnd(wx, wy, 32) < 0.14 then L.fillRect(b, wx, wy, wx + 1, wy + 1, C.window) end
      end
    end
    x = x + w
    k = k + 1
  end
  -- the near trees, in teal shadow
  for _, tr in ipairs({ { 26, 70, { { 0, 0, 24 }, { -14, 10, 16 }, { 16, 8, 17 }, { 4, -16, 15 } } }, { 300, 62, { { 0, 0, 24 }, { -18, 12, 16 }, { 8, -18, 14 } } } }) do
    local tx, ty = tr[1], tr[2]
    L.fillRect(b, tx - 3, ty, tx + 3, 124, C.wood[1])
    for _, c in ipairs(tr[3]) do
      local cx, cy, r = tx + c[1], ty + c[2], c[3]
      for yy = math.floor(cy - r), math.ceil(cy + r) do
        for xx = math.floor(cx - r), math.ceil(cx + r) do
          local inside, dx, dy = ell(xx, yy, cx, cy, r, r)
          local lumpy = L.rnd(math.floor(xx / 3), math.floor(yy / 3), 33) * 0.25
          if inside and dx * dx + dy * dy < 1 - lumpy then L.set(b, xx, yy, shade(C.leaf, dx, dy, xx, yy)) end
        end
      end
    end
  end
  -- grass, then the paved path in rows that widen toward you
  for yy = 118, 130 do
    for xx = 0, W - 1 do
      local c = C.leaf[2]
      if yy < 120 and L.rnd(xx, yy, 34) < 0.5 then c = C.leaf[3] elseif L.rnd(xx, yy, 35) < 0.12 then c = C.leaf[1] end
      b[yy][xx] = c
    end
  end
  local rows = { 130, 134, 139, 145, 152, 160, 169, 180 }
  for r = 1, #rows - 1 do
    local y0, y1 = rows[r], rows[r + 1] - 1
    local sw = 10 + r * 3
    for yy = y0, y1 do
      for xx = 0, W - 1 do
        local sx = xx + (r % 2) * math.floor(sw / 2)
        local stoneId = math.floor(sx / sw)
        local mortar = (yy == y1) or (sx % sw == 0)
        local mid = stoneId * sw + sw / 2 - (r % 2) * math.floor(sw / 2)
        local c = (L.rnd(stoneId, r, 36) < 0.45) and C.path[3] or C.path[2]
        if math.abs(mid - LAMP_X) < 12 + r * 3 then c = C.path[4] end -- the pool of lamplight
        if yy == y0 and not mortar then c = C.path[4] end -- each stone's lit top edge
        b[yy][xx] = mortar and C.path[1] or c
      end
    end
  end
  L.fillRect(b, 0, 130, W - 1, 130, C.path[1])
  -- the lamp's glow on the air (dithered, thinner with distance)
  for yy = LAMP_Y - 26, LAMP_Y + 30 do
    for xx = LAMP_X - 30, LAMP_X + 30 do
      local d = math.sqrt((xx + 0.5 - LAMP_X) ^ 2 + (yy + 0.5 - LAMP_Y - 3) ^ 2)
      if d > 5 and d < 24 and yy < 118 and L.bayer(xx, yy) < 0.4 - d / 60 then L.set(b, xx, yy, C.lamp[1]) end
    end
  end
  -- the lamp post
  piece(b, function(s)
    L.fillRect(s, LAMP_X - 1, LAMP_Y + 6, LAMP_X, 132, C.city[2])
    L.fillRect(s, LAMP_X - 3, 130, LAMP_X + 2, 133, C.city[2])
    L.fillRect(s, LAMP_X - 4, LAMP_Y - 2, LAMP_X + 3, LAMP_Y - 1, C.city[2])
    L.fillRect(s, LAMP_X - 3, LAMP_Y, LAMP_X + 2, LAMP_Y + 5, C.lamp[1])
    L.fillRect(s, LAMP_X - 2, LAMP_Y + 1, LAMP_X + 1, LAMP_Y + 4, C.lamp[2])
  end)
  -- the crate you sit on
  piece(b, function(s)
    L.fillRect(s, 130, 124, 152, 141, C.wood[2])
    L.fillRect(s, 130, 124, 152, 125, C.wood[3])
    L.fillRect(s, 130, 132, 152, 132, C.wood[1])
    L.fillRect(s, 141, 126, 141, 141, C.wood[1])
    L.fillRect(s, 130, 126, 130, 141, C.wood[3])
  end)
  -- the looper, a knob on top
  piece(b, function(s)
    L.fillRect(s, 118, 141, 128, 146, C.pedal[1])
    L.fillRect(s, 125, 139, 126, 140, C.city[2])
  end)
  return b
end

-- You, on the crate, playing: the far leg, the body and head, the guitar across your lap, and your
-- arms on the strings and the neck.
local function you(b, beat)
  plain = true
  L.fillRect(b, 120, 142, 121, 143, beat and C.pedal[2] or C.pedal[3]) -- the looper's light
  piece(b, function(s)
    limb(s, 140, 121, 157, 122, 6, C.jeans) -- the far thigh and shin, half hidden
    limb(s, 157, 122, 160, 139, 5, C.jeans)
    L.fillRect(s, 158, 139, 165, 141, C.case[1])
    blob(s, 141, 108, 8, 13, C.hoodie) -- the body
    limb(s, 141, 121, 155, 123, 7, C.jeans) -- the near thigh...
    limb(s, 155, 123, 156, 140, 6, C.jeans) -- ...and shin
    L.fillRect(s, 154, 140, 162, 142, C.case[1]) -- a shoe
    blob(s, 143, 89, 6.5, 7, C.skin) -- the head
    for y = 80, 86 do
      for x = 136, 150 do
        if ell(x, y, 143, 87, 7.5, 7) then L.set(s, x, y, C.beanie) end
      end
    end
    L.fillRect(s, 136, 86, 150, 86, C.city[2]) -- the beanie's fold
    L.set(s, 147, 90, C.outline) -- an eye
    L.set(s, 150, 91, C.skin[3]) -- the nose
    L.set(s, 139, 90, C.skin[1]) -- an ear
  end)
  piece(b, function(s) -- the guitar
    limb(s, 158, 112, 190, 97, 2, { C.wood[1], C.wood[2] }) -- the neck
    L.fillRect(s, 189, 94, 193, 97, C.wood[1]) -- the headstock
    blob(s, 152, 115, 7, 6.5, C.guitar) -- the lower bout
    blob(s, 158, 112, 5, 5, C.guitar) -- the upper bout
    L.disc(s, 155, 113, 1.8, C.outline) -- the sound hole
    for k = 0, 34 do L.set(s, 150 + k, 116 - k * 0.55, C.guitar[3]) end -- a string catching the light
  end)
  piece(b, function(s) -- the arms: one strumming, one on the neck
    limb(s, 139, 100, 146, 110, 4, C.hoodie)
    limb(s, 146, 110, 152, 113, 4, C.hoodie)
    L.fillRect(s, 152, 112, 154, 114, C.skin[2])
    limb(s, 144, 99, 160, 104, 4, C.hoodie)
    limb(s, 160, 104, 176, 101, 3, C.hoodie)
    L.fillRect(s, 176, 99, 178, 102, C.skin[2])
  end)
  plain = false
end

-- The open case: its lid up behind, the red lining, and `coins` coins in it (and a glint on one).
local function openCase(b, coins, glint)
  piece(b, function(s)
    for y = CASE_Y - 8, CASE_Y - 1 do
      local lean = math.floor((CASE_Y - y) / 2)
      L.fillRect(s, CASE_X + 2 + lean, y, CASE_X + 32 + lean, y, C.case[1])
    end
    L.fillRect(s, CASE_X, CASE_Y, CASE_X + 32, CASE_Y + 8, C.case[1])
    L.fillRect(s, CASE_X + 2, CASE_Y + 1, CASE_X + 30, CASE_Y + 6, C.case[2])
    L.fillRect(s, CASE_X + 2, CASE_Y + 1, CASE_X + 30, CASE_Y + 1, C.case[3])
  end)
  for i = 0, coins - 1 do
    local x = CASE_X + 4 + (i * 7) % 25
    local y = CASE_Y + 3 + (i * 3) % 3
    L.fillRect(b, x, y, x + 2, y + 1, C.coin[2])
    L.set(b, x, y, C.coin[3])
    L.set(b, x + 2, y + 1, C.coin[1])
  end
  if glint then
    local x, y = CASE_X + 11, CASE_Y + 3
    L.set(b, x, y - 1, C.coin[3]); L.set(b, x - 1, y, C.coin[3]); L.set(b, x + 1, y, C.coin[3]); L.set(b, x, y + 1, C.coin[3])
  end
end

-- The old man, feet at (x, 150), facing left toward you. step: 0..3 through his walk (nil standing);
-- nod: his head dipped; grin: smiling; tip: his hand held out with a coin.
local function oldMan(b, x, step, nod, grin, tip)
  plain = true
  local bob = (step and step % 2 == 1) and 1 or 0
  local top = 104 + bob
  piece(b, function(s)
    local swing = step and ({ -3, 0, 3, 0 })[step + 1] or 0
    limb(s, x + 2, top + 32, x + 2 - swing, 148, 3, { C.coat[1], C.coat[1] }) -- the legs
    limb(s, x - 2, top + 32, x - 2 + swing, 148, 3, { C.coat[1], C.coat[2] })
    L.fillRect(s, x - 5 + swing, 148, x - 1 + swing, 150, C.hat)
    L.fillRect(s, x - 1 - swing, 148, x + 3 - swing, 150, C.hat)
    for y = top + 14, top + 34 do -- the coat, widening to its hem
      local half = 6 + (y - top - 14) * 0.15
      for xx = math.floor(x - half), math.floor(x + half) do
        local dx = (xx + 0.5 - x) / half
        L.set(s, xx, y, shade(C.coat, dx, -0.2, xx, y))
      end
    end
    L.fillRect(s, x - 6, top + 13, x + 6, top + 15, C.scarf)
    L.fillRect(s, x + 3, top + 16, x + 5, top + 21, C.scarf) -- its loose end
    local hy = top + 7 + (nod and 1 or 0)
    blob(s, x - 1, hy, 5, 5.5, C.skin) -- the head
    L.fillRect(s, x - 6, hy - 5, x + 5, hy - 4, C.hat) -- the brim
    L.fillRect(s, x - 4, hy - 10, x + 3, hy - 5, C.hat) -- the crown
    L.set(s, x - 4, hy - 1, C.outline) -- an eye
    L.set(s, x - 6, hy, C.skin[2]) -- the nose
    if grin then
      L.fillRect(s, x - 5, hy + 2, x - 3, hy + 2, C.outline)
      L.set(s, x - 2, hy + 1, C.outline)
    else
      L.fillRect(s, x - 5, hy + 2, x - 4, hy + 2, C.skin[1])
    end
    L.fillRect(s, x + 1, hy + 3, x + 3, hy + 4, C.coat[2]) -- white whiskers... in coat grey, as the dusk lights them
    -- the arm and the cane (or the hand out, tipping)
    if tip then
      limb(s, x - 2, top + 17, x - 9, top + 20, 3, C.coat)
      L.fillRect(s, x - 11, top + 19, x - 9, top + 21, C.skin[2])
    else
      limb(s, x - 2, top + 17, x - 6, top + 25, 3, C.coat)
      L.fillRect(s, x - 7, top + 25, x - 5, top + 27, C.skin[2])
      limb(s, x - 6, top + 27, x - 8 - (step and 1 or 0), 149, 1, { C.wood[1], C.wood[2] })
    end
  end)
  plain = false
end

-- A coin, thrown: side-on every other frame, so it spins.
local function coin(b, x, y, f)
  if f % 2 == 0 then
    L.fillRect(b, x - 1, y - 1, x + 1, y + 1, C.coin[2])
    L.set(b, x - 1, y - 1, C.coin[3])
  else
    L.fillRect(b, x, y - 1, x, y + 1, C.coin[2])
  end
end

-------------------------------------------------------------------------------------------------

local base = park()

local function scene(manX, step, nod, grin, tip, coins, glint, beat)
  local b = L.buffer(W, H)
  L.blit(b, base, 0, 0)
  openCase(b, coins, glint)
  you(b, beat)
  if manX then oldMan(b, manX, step, nod, grin, tip) end
  return b
end

-- The still.
local still = scene(234, nil, false, true, false, 5, true)
L.save(still, nil, "art/open-case/preview-style-1x.png")
L.save(L.scale(still, 3), nil, "art/open-case/preview-style.png")

-- The GIF: walking in, nodding, grinning, the coin arcing into the case. Cropped round the action.
local CROP = { 110, 70, 200, 90 }
local frames = {}
local function add(b, ms) frames[#frames + 1] = { L.scale(L.crop(b, CROP[1], CROP[2], CROP[3], CROP[4]), 3), ms } end
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
