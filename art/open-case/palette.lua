-- Open Case's palette, the flat look after Nathan's reference picture: every area one solid colour, a
-- base and at most one shadow per material, no outlines, no dither. Pairs run shadow -> base. The
-- sprite sheet (sprites.lua), the style sample and the tab icon draw with these alone, and the whole
-- game's art stays within 64 colours (sprites.lua checks).
return {
  ink = "#1c1626", -- your black beanie and shirt, hair, eyes, the hat, the guitar's neck, the lamp post, the case's shell
  charcoal = "#3d3649", -- the lit side of your beanie and shirt, the old man's cap, the student's jeans
  sky = { "#2a1d4e", "#43286a", "#663276", "#93406f", "#c9566a", "#ec8458", "#f7b464" }, -- top -> horizon, at dusk
  night = { "#26275a", "#1b1b44", "#121230" }, -- the sky after dusk, as it darkens
  light = "#fff2cc", -- the sun, the lamp's glass, sneakers, whiskers, glints, stars, the reactions' bubbles
  yellow = { "#b0802c", "#fcd062" }, -- lit windows, the lamp, coins, the student's backpack
  leaf = { "#1d3b42", "#2e5d5c", "#45806e" }, -- trees in teal shadow, the hedge and its lit top, a pigeon's neck
  path = { "#3a2e48", "#564660", "#9c8480" }, -- joints and shadows, the stones, the pool of lamplight
  skin = { "#c08468", "#f2c69e" },
  skin2 = { "#7e4e38", "#b07650" }, -- darker skin
  blue = { "#2c3466", "#4660a6" }, -- the looper's body and its top, the student's hoodie
  pants = { "#2d4b2c", "#4c783a" }, -- your forest green pants
  wood = { "#45291f", "#7a4a2c", "#c68a50" }, -- dark wood, the crate, the guitar
  red = { "#74283a", "#b03c4a" }, -- the case's lining, the scarf, the jogger's top, the looper's first beat
  coat = { "#5e566e", "#8e8498" }, -- grey: the regular's coat, the commuter's suit, pigeons
  brown = { "#553a2e", "#86604a" }, -- the passing old man's coat
  go = "#6ed89a", -- the looper's light between beats, a listener's nod of recognition
}
