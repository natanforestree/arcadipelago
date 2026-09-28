-- Open Case's 16-bit palette: a lo-fi dusk, warm oranges and purples with teal shadows. At most 48
-- different colours (style-sample.lua checks). Ramps run dark -> light. The playable test's
-- placeholder colours in open-case/src/render.js are a rough subset of these.
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
}
