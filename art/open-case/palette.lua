-- Open Case's 16-bit palette: a lo-fi dusk, warm oranges and purples with teal shadows; the tab icon
-- (icon.lua) draws with it. Ramps run dark -> light. The playable test's placeholder colours in
-- open-case/src/render.js are a rough subset of these. `flat`, at the end, is the flat look the style
-- sample draws with, at most 48 colours (style-sample.lua checks).
local lamp = { "#ffd98a", "#fff4d0" }
local city = { "#2c2146", "#3a2a55" }
return {
  outline = "#140f1f",
  sky = { "#1d1638", "#3d2862", "#5a3170", "#7c3a73", "#a3466f", "#c8586a", "#f0945a", "#f7b565" }, -- top -> horizon
  sun = lamp[2],
  city = city, -- far rooftops
  window = lamp[1],
  leaf = { "#14262c", "#1e3a3f", "#2c5552", "#3f7266" }, -- trees and grass, in teal shadow
  path = { "#3b2f3f", "#5a4a55", "#7d6a6a", "#a08a80" },
  wood = { "#3a2418", "#6e4a2a", "#9b6a3c" },
  guitar = { "#6b3a1c", "#a8622c", "#d8904a" },
  case = { "#1f171e", "#6a2233", "#9a3444" }, -- the shell, then its red lining
  skin = { "#7a4a3a", "#c98a6a", "#f0bf98" },
  hoodie = { "#a8522a", "#d9793a" },
  jeans = { "#2f3a5a", "#46587e" },
  beanie = "#5a70b8",
  coat = { "#4a4240", "#7e7064" }, -- the old man
  hat = "#2e2626",
  scarf = "#b04a3a",
  coin = { "#a07420", "#e0b040", "#fff6d0" },
  lamp = lamp,
  pedal = { city[1], "#e05050", "#60d890" }, -- the looper: its body, its light on the first beat, and otherwise
  -- The flat look, after Nathan's reference picture: every area one solid colour, a base and at most one
  -- shadow per material, no outlines, no dither. style-sample.lua draws with these alone. Pairs run
  -- shadow -> base.
  flat = {
    ink = "#1c1626", -- hair, eyes, the hat, the guitar's neck, the lamp post, the case's shell
    sky = { "#2a1d4e", "#43286a", "#663276", "#93406f", "#c9566a", "#ec8458", "#f7b464" }, -- top -> horizon
    light = "#fff2cc", -- the sun, the lamp's glass, sneakers, whiskers, glints
    yellow = { "#b0802c", "#fcd062" }, -- lit windows, the lamp, coins
    leaf = { "#1d3b42", "#2e5d5c", "#45806e" }, -- trees in teal shadow, the hedge and its lit top
    path = { "#3a2e48", "#564660", "#9c8480" }, -- joints and shadows, the stones, the pool of lamplight
    skin = { "#c08468", "#f2c69e" },
    blue = { "#2c3466", "#4660a6", "#6c8ade" }, -- jeans' shadow and the looper, jeans, the beanie
    hoodie = { "#a8502c", "#e07a38" },
    wood = { "#45291f", "#7a4a2c", "#c68a50" }, -- dark wood, the crate, the guitar
    red = { "#74283a", "#b03c4a" }, -- the case's lining, the scarf, the looper's first beat
    coat = { "#5e566e", "#8e8498" },
    go = "#6ed89a", -- the looper's light between beats
  },
}
