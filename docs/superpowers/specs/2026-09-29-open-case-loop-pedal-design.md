# Open Case: the loop pedal (design spec)

**Date:** 2026-09-29
**Status:** Nathan agreed the design in chat ("seems perfect!"), then reviewed this spec and its plan. Built from `docs/superpowers/plans/2026-09-29-open-case-loop-pedal.md`.

Nathan asked for "a music shop with different guitar pedals and loop pedal and instruments". The shop is live with the pedals and the instruments ([the shop's spec](2026-09-28-open-case-shop-design.md)); this adds the loop pedal. It's a new item on the shop's rack. Once it's yours, you record 4 bars of what you play and it loops under you, and you can stack up to three layers and play live over the top. Like the rest of the gear, it only changes how you sound: the crowd judges what you play live, as it does now.

## Decisions

| Topic | Decision |
|---|---|
| How it records | **Your notes, not audio.** The loop keeps each note you play (when, which, how hard, how long) and plays them again through the same voices. |
| Your pedals | **Live** (Nathan's choice): the loop plays through your pedals as they are now, like a looper at the start of a pedalboard. Stomp the delay and the loop gets echoes too. |
| Length | **Always 4 bars** (Nathan's choice): one pass of the chords, so every loop fits the band. |
| Layers | Up to 3. R records one; Backspace removes the last. |
| The crowd | Looped notes are part of the band. The crowd never judges them; they judge only what you play live. Tips and rules don't change. |
| In the shop | **You can try it** (Nathan's choice): choosing it starts the band's electric piano softly, so there are bar lines to record against. |
| Price | 100 coins, the dearest pedal. |
| Between sets | The loop belongs to the set: it fades with the band, and each set starts with an empty loop. |

## How it plays

**Recording.**
- **R** records a layer. The recording starts at the next bar line and lasts exactly 4 bars.
  - While it waits for the bar line, the pedal's light blinks red on the beat.
  - While it records, the light is solid red.
  - When the 4 bars are up, the layer joins the loop, which plays straight back, over and over. The light turns green.
- **R again**, while the loop plays, records another layer in the same way: from the next bar line, for 4 bars, with the loop playing under you as you record. At most 3 layers: once there are three, R does nothing, and the popup over the gear strip says "loop full".
- R does nothing while a recording is waiting or under way.
- **Backspace** removes the last layer. While a recording is waiting or under way, it cancels that recording instead, and the layers already there play on. Pressing it until the loop is empty clears it; the light goes dark.

**What a layer keeps.**
- Every note you start during the 4 bars, with its timing exactly as played: nothing snaps to the beat.
- A note played a hair early for the first bar line (up to a 16th before it) still counts, and plays back just as early each time round.
- Each note lasts as long as it sounded: until its key came up, or, with Space held, until Space let go. A note still sounding at the end of the 4 bars is cut there.
- How hard you picked, and hammer-ons.

**How it sounds.**
- The loop plays with your instrument, through your pedals as they are now.
- Looped notes are voices of their own: they never cut off a note you're playing live, even on the same key.

**The crowd.** Looped notes never reach the crowd's ears. They hear only what you play live, so going quiet over a loop still counts as Silence, and a loop can't earn tips on its own. The headline bot test and the rules don't change.

**The set's end.** When the band fades at the end of the set, the loop fades with it. A recording still under way is dropped. The next set starts with an empty loop.

**In the shop.**
- The loop pedal hangs on the rack with the other pedals, after the reverb. Its card: "Loop pedal", "100 coins", a line about it, and what Enter does, as for the others.
- While it's chosen, the band's electric piano (the keys layer alone) plays softly, so R and Backspace work against its bar lines, whether or not it's yours yet.
- Moving to another item, or leaving the shop, stops the band and clears that loop.
- Once it's yours, the card says "On your board: R".

**Keys.** R and Backspace do nothing until the pedal is yours, except while trying it in the shop. They work between sets too, but there's no band then, so nothing records until a set starts: R before your first note does nothing. Bot sets can't use it.

**The sound check** (`?sound`) has the loop pedal too: R and Backspace work there, over the band.

## On screen

- **Your loop pedal** joins your row of pedals in front of the crate: a wider stompbox with a big footswitch and a light. The light is dark when the loop is empty, blinks red while waiting, is solid red while recording, and is green while playing.
- **The speaker.** The blue box that has always sat by your crate becomes a small speaker, the band's, with no light. So the only red-and-green light down there is your loop pedal's.
- **The gear strip** gets a loop slot after the reverb: a loop icon with the key R and three dots that fill as layers go down, red while recording. A popup over the strip says what happened: "loop recording", "layer 2", "loop full", "layer removed", "loop cleared".
- **Looped notes rise faintly from the loop pedal** as they play, so you can see the loop going round. Your live notes still rise from your instrument.
- **The title card's** pedal line reads "2-6 pedals   R loop   backspace undo".

| New art | Frames |
|---|---|
| The loop pedal on the ground | dark, red, green (3) |
| The loop pedal on the shop's rack | as it stands, chosen (2) |
| The loop's strip icon | off, recording, playing (3) |
| The speaker (replacing the looper box) | 1 |

All in the flat style, in the same sprite sheet, within 64 colours and 400 KB.

## Where it's kept

- Owning it is kept with the rest of your gear: its id, `loop`, in `open-case-gear`'s `owned`.
- The loop itself is never saved: it belongs to the set.
- The test log gains, for each of Nathan's sets, how many layers he recorded (`layers`, counting only layers that finished recording).

## How it's built

- **`looper.js` (new, pure):** the loop's state and its layers, on the set's clock (seconds since the first note):
  - `record(loop, t)`: R at time t. It arms a recording from the next bar line, or does nothing.
  - `note(loop, …)` and `release(loop, …)`: a note starting and ending, with its pitch, pick strength and hammer-on.
  - `undo(loop, t)`: Backspace.
  - `step(loop, t)`: time passing. The recording starts at its bar line and ends 4 bars later.
  - `due(loop, from, to)`: which looped notes start (and end) between two moments, for the sound and the screen.

  It knows nothing about audio or the crowd, and it's tested in Node.
- **`audio.js`:**
  - plays looped notes a moment ahead, as it schedules the band, as voices of their own through your instrument and pedals;
  - stops them when the band stops;
  - lets the shop start the band's keys layer alone, softly.
- **`keys.js` / `input.js`:** KeyR and Backspace as controls ('loop', 'undo'). Neither is a note key.
- **`gear.js` / `tuning.js`:**
  - the loop pedal in the stock, after the reverb (kind `loop`, so it isn't in the effects chain or on keys 2 to 6);
  - `SHOP.loop` = 100 coins;
  - a `LOOP` block: 4 bars, 3 layers, and a 16th's allowance for early notes.
- **`shop.js`:** trying the loop pedal (the band on while it's chosen); its card.
- **Art:** `gear.lua` draws the loop pedal and its strip icon, `shop.lua` its place on the rack, and `draw.lua` the speaker in the looper's place.
- **`scene.js` / `render.js`:** the loop pedal's light, the strip's loop slot and its popups, looped notes rising from the pedal, the speaker, and the title's line.
- **`main.js`:**
  - R and Backspace;
  - feeding your live notes to the looper while a recording runs;
  - telling the sound and the screen what the loop plays;
  - clearing the loop at the set's end;
  - the band in the shop while the loop pedal is chosen;
  - `layers` in the log.

## Tests

- **Recording:**
  - R arms at the next bar line, even pressed just after one;
  - a recording lasts exactly 4 bars, then plays straight back;
  - R does nothing while waiting, while recording, or with 3 layers.
- **What a layer keeps:**
  - timing exactly as played;
  - a note up to a 16th early counts and plays back early, while an earlier one doesn't;
  - Space-held notes last until Space lets go;
  - a note sounding at the end is cut there;
  - pick strength and hammer-ons are kept.
- **Undo:** cancels a waiting or running recording and keeps the layers; otherwise removes the last layer; on an empty loop it does nothing.
- **Playing back:**
  - `due` gives each looped note once per time round, at the right moments, across the wrap from the 4th bar to the 1st;
  - over many passes nothing drifts.
- **The sound:**
  - looped notes are scheduled ahead, never in the past;
  - they stop with the band;
  - they don't cut off live notes on the same key;
  - the shop's band is the keys layer alone.
- **The crowd:**
  - set.js and the rules never import looper.js;
  - a set played with a loop running scores the same as one without.
- **The shop:**
  - the loop pedal's card for affordable, unaffordable and owned;
  - choosing it starts the band and moving on stops it and clears the loop.
- **Keys:** R and Backspace do nothing until the pedal is yours, and bot sets can't use them.
- **The art:** every new frame is in the sheet; the loop pedal stands clear of the case and every listener, as the other pedals do.
- **Unchanged:** the existing tests pass.
- **Checked in Chrome:** buying it; trying it in the shop; recording three layers mid-set; undo; stomping a pedal over a loop; the set's end. Nathan's ear has the final say on how it feels.

## How we'll know it works

Nathan buys the loop pedal and records loops in his sets, and the log shows layers in them. **It works** if he keeps playing over his loops, and his Another-set rate holds or rises. **If recording feels late or early**, the 16th allowance changes. **If three layers is too few or too many**, that's a number in `tuning.js`, and so is the price.

## What the build settled

The plan's prototype settled a few things this spec left open:
- **The loop pedal stands just behind your row of pedals**, between them and the crate, under your foot. There was no room beside the row: the case is on one side and a listener's spot on the other. Its light is two pixels square, so red and green read at a glance.
- **The speaker** is the blue box with a handle on top and a dark cone.
- **The rack is wider**, and the chalkboard moved right to make room. The five pedals stand 20 pixels apart with the loop pedal last, 18 wide, and every price tag hangs clear of the next pedal.
- **The strip's loop slot** comes straight after the reverb's: the icon, "R", and three dots. The pigeons moved 26 pixels to the right to make room.
- **Looped notes rise faintly from just over the loop pedal**, higher notes a little higher. They drift up and to the left, away from your own notes, which drift right toward the crowd, and fade in 3 seconds.
- **The news over the strip:**
  - when R arms a recording: "loop recording" for the first layer, "layer 2" or "layer 3" after that;
  - "loop full";
  - "recording cancelled" (Backspace during a recording);
  - "layer removed";
  - "loop cleared".

  It shows one message at a time: the newer of the loop's news and a pedal stomp.
- **While a recording waits**, the light is red for the first half of each beat.
- **In the shop:**
  - the card's last line, while the loop pedal is chosen, is "R record   backspace undo   esc back";
  - its light on the rack shows the loop you're trying;
  - the band there is the electric piano alone, at about two thirds of its level in a set;
  - buying the pedal while you try it keeps your loop going.
- **An empty recording still counts as a layer.** Four bars with no notes take a layer, and Backspace takes it off.
- **The loop sits a little under you**, at 80% of your live level.
- **A safety before the speakers** keeps stacked loops from clipping. Measured offline at the default volume:
  - one hard four-note chord, clean, already peaks at −2.7 dB;
  - three layers of it, landing on the same beat you play it live, peaked at +9.3 dB.

  The safety passes everything below about −3 dB untouched, so the game's mix measured the same with it, and it rounds louder peaks off smoothly. It isn't oversampled, so it adds no delay to any note, live or looped. That worst case, with the loop at 80%, now peaks at −0.2 dB even at full volume.

## Not in this change

- Loops of other lengths, and saving loops between sets.
- Pedals baked into a layer (recording the actual sound).
- The crowd reacting to your loops.
- Regulars (their own spec).
