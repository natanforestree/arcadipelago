# Open Case: the art repaint (design spec)

**Date:** 2026-09-28
**Status:** Approved by Nathan ("ready for the art repaint") and built from `docs/superpowers/plans/2026-09-28-open-case-art.md`. The look is the flat style sample he approved (his busker in a black beanie, black shirt and forest green pants: "looks great!"). The ambient motion is from the chat ("is the background going to be dynamic? clouds moving maybe some birds flying"). Order: art, then the looper, then Regulars.

The playable test draws everything as code-made rectangles. This change repaints the game in the flat style Nathan chose from his reference picture, the one `art/open-case/style-sample.lua` shows:
- flat colour, at most two tones per material;
- no outlines and no dithering;
- few colours;
- chunky figures about 40–46 px tall on the 320×180 screen.

It also brings the park to life: the sun sets over each set, clouds drift, birds cross, the trees sway, and pigeons peck by your case.

Nothing about the rules, the crowd or the sound changes. The game's positions stay as they are: where you sit, the listeners' spots, the path, earshot, and where coins land. The art is laid out around them.

## What moves, and why it stays calm

Everything in the background moves slower and softer than the crowd, because the crowd's reactions are what you read while you play. Nothing flashes in time with the music. Two things do move with the groove, quietly: the trees rustle on each bar's first beat, and happy listeners nod on the beat.

| What | How it moves | Starting values (untested) |
|---|---|---|
| **The sunset over your set** | The set runs from dusk to night over its 60 bars. The sky's flat bands step to the next colours at bar lines (no gradients), the sun sinks behind the rooftops, windows light up one by one, the lamp post comes on, and stars come out near the end. Every set starts at dusk again. | Sky stages at bars 0, 15, 30, 45 and 60. The sun is gone by bar 36. Each window lights at its own bar between 10 and 50 (from the seed). The lamp comes on at bar 24, and its pool of light appears on the path. About 10 stars appear from bar 45, twinkling slowly. |
| **Clouds** | Two layers drift right at different speeds, wrapping round. | 2 and 4 px a second |
| **Birds** | Now and then a single bird or a small flock crosses the sky, flapping in a loose line. | A flock every 20–40 s, of 1–5 birds, 2 flap frames at 120 ms, about 8 s to cross |
| **A distant train** | Once in a set, a silhouette passes along the rooftop line. Its windows are lit after dusk. | At a seeded bar between 10 and 50, about 6 s to cross |
| **Trees** | A gentle sway, and a small rustle on each bar's first beat | 3 frames |
| **Pigeons** | Three peck and shuffle near your case. A pick-strength-4 note scatters them into the air and off screen, and they walk back in after a few bars. | Scatter on strength 4, back after 4 bars |
| **The lamp** | Its glow flickers a little, as now | |
| **Listeners** | Standing listeners breathe. When a listener's interest is above 0.5 (hooked), they nod on the beat. | 2 idle frames, a nod on each beat |

If the browser asks for reduced motion (`prefers-reduced-motion`), the birds and the train don't appear and the clouds and trees hold still. The sunset still happens, because it tells you where you are in the set.

## What gets drawn

All in the flat style, from the palette in `art/open-case/palette.lua` (its `flat` table, grown as needed). The whole game's art stays at 64 colours or fewer: the sunset's sky stages need more colours than the sample's 32.

| Sprite | Frames |
|---|---|
| **The park, in layers:** the sky (5 stages), sun, 2 cloud sprites, far rooftops with their windows (unlit and lit), the train, trees (3 sway frames), the hedge, the path, the lamplight pool, the lamp post (off, on, flicker) | as above |
| **You:** the black beanie, black shirt and forest green pants, seated on the crate with the guitar | idle (2 frames), strum (3 frames, played on each note) |
| **The case:** open, its red lining, with coins that pile up as they land | coins stay in the case, as they do now |
| **A coin:** the one that flies in | 2 frames, with a glint |
| **The looper pedal:** red on each bar's first beat and green otherwise, as now | 2 frames (states for the looper feature come later) |
| **The four passers-by:** jogger, old man, student, commuter, each facing right (mirrored for left) | walk (4 frames; faster for the jogger), stand (2 frames), nod (2 frames) |
| **Reactions over heads:** yawn/phone, frown, grin, bouncing notes, head tilt, drifting, wince, nod | 1–2 frames each, about 9–12 px |
| **Pigeons** | peck (2 frames), walk (2), fly (2) |
| **Birds** | flap (2 frames) |

**The passing old man gets a new look:** a flat cap and a brown coat, with his cane. The red scarf and top hat from the style sample go to the regular in the Regulars feature, so the two read as different people.

**On-screen elements** are restyled in the same palette:
- the note trail's glyphs;
- the memory strip, its "they remember" label and the gold callback moment;
- the HUD (octave, pick strength, bar count);
- the title screen, which now sits over the live scene at dusk.

The **tab icon** is redrawn flat to match. The front-page island stays in the site's own style.

## How it's built

- **Art scripts:** Aseprite Lua scripts in `art/open-case/` write sprite sheets (`.png`) and their frame data (`.json`) into `open-case/assets/`, as Last Light does. They are deterministic, and their previews aren't committed.
  - The drawing code for the busker, the old man and the scenery moves out of `style-sample.lua` into a shared file that both the sample and the sprite scripts use. That way the game and the sample can't drift apart.
- **Loading:** `open-case/src/assets.js` loads the sheets before the title card shows. If they can't load, the page shows its existing "Something went wrong" note.
- **Drawing:** `render.js` draws sprites instead of rectangles, with the same layout constants. `scene.js`, which stays pure and tested in Node, also holds:
  - the sunset's stage from the bar;
  - the birds, train and pigeons, seeded from the set's seed.
- **Tests:**
  - every sprite and frame the renderer asks for exists in the frame data, and the frame counts match the table above;
  - the colours stay within 64;
  - the sunset's stage, the window, lamp and star times, and the pigeons' scatter and return follow the set's bar and notes;
  - reduced motion turns the birds, train, clouds and trees off;
  - the game's art stays under 400 KB;
  - the existing 98 tests still pass;
  - the art rebuilds byte for byte.
- **Checked in Chrome:** screenshots at bars 1, 30 and 59 (dusk, blue hour, night), a pigeon scatter, and a flock crossing. Safari is checked as far as it can be here.

## How we'll know it works

- It looks like the style sample Nathan approved.
- A mid-set screenshot still makes every listener's reaction readable at a glance, with the background moving.
- The frame rate stays smooth.
- Nathan's verdict after a few sets.

## What the build settled

The plan's prototype settled a few things this spec left open:
- **The sky steps one band at a time.** Each stage's seven bands change top first, every 2 bars, so the whole sky never changes at once. Each stage is complete at its bar (0, 15, 30, 45, 60). The rooftops and the train darken with the horizon's band, and each cloud with its own band.
- **Unlit windows don't show.** Each lights at its own seeded bar.
- **Two clocks.** What follows the set runs on the set's clock: the sunset, windows, lamp, stars, train, the trees' rustle, the nods and the pigeons' scatter. The clouds, the birds, the sway, breathing and the pigeons' pecking run on the page's clock, so the title screen is live. The birds come from the page's seed, which `?seed=N` fixes.
- **Reactions are pale bubbles with a sign**, over a flat dark shadow so they read against the sun:
  - repeat: a yawn's Zs;
  - off key: a frown;
  - callback: a grin;
  - taste: bouncing notes;
  - random: a question mark;
  - silence: dots;
  - loud: a wince;
  - recognised: a tick.
- **Reduced motion also stops the lamp's flicker.**
- **`?sky=N`** shows the park N bars into a set, for checking the sunset.

## Not in this change

- The regular (the Regulars feature draws him).
- The looper's recording lights (the looper feature).
- New spots and more characters.
- Any change to the rules, the crowd or the sound.
