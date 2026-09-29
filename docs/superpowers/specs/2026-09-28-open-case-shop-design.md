# Open Case: the music shop (design spec)

**Date:** 2026-09-28
**Status:** Nathan agreed the design in chat ("perfect", "yup looks good!"). This written spec is waiting for his review; the implementation plan comes after that.

Nathan's ask: "instead of just the loop we should add a few things that you can buy in a shop with the money you make … a music shop with different guitar pedals and loop pedal and instruments and what not."

Today the coins in your case are gone when the set ends. This change keeps them as **savings**, and opens a **music shop** between sets where you spend them. The shop stocks five guitar pedals and four instruments, all in the flat pixel style. You stomp the pedals on and off while you play, and you take the instrument you choose out to the park. The gear only changes how you sound: the crowd judges your notes exactly as it does now. The loop pedal comes next, in its own spec, and joins the shop once it's built.

## Decisions

| Topic | Decision |
|---|---|
| What gear does | **Sound only.** It changes how you sound; the crowd's rules and the tips don't change. (Nathan's choice over crowd tastes for gear, and over boosts to earnings.) |
| Money | The coins from each set go into savings that carry over. Buying is the only thing that spends them, and anything bought is yours for good. |
| Switching | **Pedals are stomped live** on keys 2 to 6. **The instrument is chosen between sets**, in the shop. |
| The shop | **A pixel-art shop** you visit between sets: pedals on a wall rack, instruments on stands, a shopkeeper at the counter. You can try anything on the keys before you buy it. |
| First stock | 5 pedals (overdrive, chorus, tremolo, delay, reverb) and 4 instruments (ukulele, electric guitar, electric piano, synth). You start with the acoustic guitar. |
| Gear on screen | Your pedalboard by the crate, the instrument in your hands (or on its stand), and a strip along the bottom of the screen showing each pedal's key and whether it's on (Nathan's addition). |
| The loop pedal | Not in this change: the next spec. |

## Money

- The coins that land in your case in a set are added to your savings when the set ends. They're kept in the browser.
- The end card shows what the set earned and your savings ("12 coins in the case. Saved: 140 coins.").
- Buying something takes its price from your savings. You can't buy what you can't afford. Nothing else ever takes coins away.
- Bot sets (`?bot`) don't earn savings, and don't touch your gear.
- For testing, `?coins=N` (a debug option, like `?seed`) sets your savings to N for that page.

**Prices**, as starting values in `tuning.js`:

| Item | Kind | Key | Coins |
|---|---|---|---|
| Overdrive | pedal | 2 | 40 |
| Chorus | pedal | 3 | 50 |
| Tremolo | pedal | 4 | 50 |
| Delay | pedal | 5 | 70 |
| Reverb | pedal | 6 | 80 |
| Ukulele | instrument | | 60 |
| Electric guitar | instrument | | 150 |
| Electric piano | instrument | | 200 |
| Synth | instrument | | 250 |

The whole stock costs 950 coins. The scripted honest bot earns about 60 a set, so the first pedal comes after a set or two, and everything after about fifteen good sets.

## The shop

- **Getting there:** the end card has a third button, **Visit the shop**, beside Another set and Stop here.
- **The room**, at 320×180 in the flat style:
  - the pedals on a rack on the back wall, and the instruments on stands along the floor;
  - the shopkeeper behind the counter;
  - a chalkboard with your savings;
  - a window onto the park at dusk.
- **Choosing:** the left and right arrow keys move from item to item, and a click on an item chooses it. The chosen item lifts a little and brightens.
- **The card:** a card along the bottom gives the chosen item's name, its price, a one-line description, and what Enter will do:
  - "Enter to buy";
  - "Not enough coins yet (you have 35)";
  - for an instrument you own: "Enter to play it" (or "You're playing it");
  - for a pedal you own: "On your board: key 5".
- **Trying:** you can play the keys in the shop, and you hear the chosen item:
  - a chosen pedal is switched on over your current instrument for as long as it's chosen;
  - a chosen instrument replaces yours for as long as it's chosen.

  Leaving the item puts your own setup back. The band doesn't play in the shop; you hear just your notes.
- **Buying:** Enter, or a click on the card's button, buys the item.
  - It moves from the display to "yours": a small tag on it says so.
  - A coin sound plays and the chalkboard updates.
  - A bought instrument becomes the one you play; a bought pedal goes on your board, switched off.
- **Leaving:** Esc, or clicking the "Back to the park" sign by the door, takes you to the park, ready for the next set (the first note starts it).
- The pedal keys (2–6), octave and pick strength, and Space all work in the shop as they do in the park.

## Playing with your gear

**The pedalboard.**
- Each pedal you own sits on the ground by your crate, as a small stompbox in its own colour. A light on it shows when it's on.
- The keys are fixed, so a pedal's key never changes: 2 overdrive, 3 chorus, 4 tremolo, 5 delay, 6 reverb.
- A key does nothing until you own its pedal.
- Pedals stay as you left them between sets and visits. The title card lists the pedal keys.

**The gear strip** (Nathan's addition). Along the bottom of the screen, between your pick strength and the bar count:
- each pedal you own shows as a small icon in its colour with its key number on it, lit while the pedal is on;
- when you stomp one, its name pops up above the strip for a second ("delay on", "delay off");
- the strip is empty until you own a pedal.

**How the pedals sound.** They chain in the usual pedalboard order: overdrive → chorus → tremolo → delay → reverb.
- **Overdrive:** warm soft clipping, with more grit the harder you pick, and a slightly darker tone.
- **Chorus:** a slow shimmer from a gently wobbling copy of your sound.
- **Tremolo:** a volume pulse on the 8th notes, in time with the band.
- **Delay:** echoes on the dotted 8th, in time with the band, fading over three or four repeats.
- **Reverb:** a warm hall behind your notes.

Switching a pedal fades it in or out over a few milliseconds, so there's no click. The tremolo and the delay follow the tempo (80 bpm).

**The instruments.**
- **Acoustic guitar:** what you have now.
- **Ukulele:** brighter, shorter-ringing plucked strings. You hold it like the guitar; it's smaller.
- **Electric guitar:** a clean, long-sustaining plucked tone, with a small amp beside your crate.
- **Electric piano:** a bell-like Rhodes tone. You sit behind it on a stand.
- **Synth:** a soft saw-wave lead with a gentle filter, on the same stand pose with its own keyboard.

**The same controls for every instrument.** Strums, hammer-ons, octaves, pick strength and Space work the same way on all of them. Space is the sustain pedal on the keyboards. Every note sounds the instant you press it, as the guitar's does now.

**The crowd** hears your notes, not your sound: the rules, tips and bots are unchanged.

## On screen

All the new art is in the flat style, in the same sprite sheet, and the art stays within 64 colours and 400 KB.

| Sprite | Frames |
|---|---|
| **The shop:** the room (walls, rack, stands, counter, window, door sign), the shopkeeper (idle 2, a nod when you buy 2), the chalkboard | as listed |
| **The stock on display:** each of the 9 items, and a lifted/brightened version when chosen | 2 each |
| **Your pedalboard:** each pedal on the ground by the crate | off and on (2 each) |
| **You with each instrument:** the ukulele and the electric guitar held like the guitar; seated at the electric piano or the synth on its stand | idle 2, playing 3, like the guitar |
| **The amp** beside the crate, with the electric guitar | 1 |
| **The gear strip's icons** | off and on (2 each) |

## Where it's kept

- `open-case-savings`: the savings, a whole number.
- `open-case-gear`: `{ owned: [ids], instrument: id, on: [pedal ids] }`.
- Both go through the safe storage wrapper. An unreadable value starts afresh: no savings, the acoustic guitar, and no pedals.
- The test log gains, for each of Nathan's sets, the instrument played and which pedals were ever on during the set. Each purchase is logged with its date.

## How it's built

- **`gear.js` (new, pure):** the catalogue (each item's id, kind, name, price, key and one-line description), the savings, and the gear:
  - buying (only when affordable, and only once);
  - choosing an instrument;
  - stomping a pedal (only one you own);
  - reading and saving through safe storage.
- **`shop.js` (new, pure):** the shop screen's state: which item is chosen, moving left and right, what Enter does for the chosen item, and the card's words.
- **`audio.js`:**
  - the pedal chain sits between your instrument's voice and the output, each pedal a small Web Audio graph mixed in or out;
  - each instrument has its own voice: the ukulele and the electric guitar use the plucked-string model with their own settings; the electric piano and the synth are synthesised voices;
  - notes, releases and Space behave the same for all.
- **`input.js` / `keys.js`:** keys 2 to 6 stomp pedals; the arrow keys and Enter drive the shop.
- **Art:** new Aseprite scripts in `art/open-case/` draw the shop and the gear into the sprite sheet, sharing `draw.lua` and `figures.lua`.
- **`render.js`:** draws the shop screen, the pedalboard, your instrument, the amp and the gear strip.
- **`main.js`:**
  - a `shop` screen after the end card;
  - adds the set's coins to savings when a set ends (not for bots);
  - the pedal keys;
  - trying items in the shop;
  - `?coins=N`.
- **`index.html`:** the end card's Visit the shop button and the savings line.
- **Numbers:** the prices and keys go in `tuning.js` (a `SHOP` block), and the pedals' and voices' settings in `audio.js`, beside the guitar's.

## Tests

- **Savings:** a set's coins are added when it ends; bot sets add nothing; a damaged save starts afresh.
- **Buying:**
  - you can't overspend;
  - you can't buy the same thing twice;
  - a bought instrument becomes your instrument, and a bought pedal starts off;
  - what you own survives a reload.
- **Pedal keys:** keys 2–6 switch only the pedals you own, and the pedals stay as you left them.
- **The shop:** choosing wraps round the stock, and the card's words and Enter's action are right for affordable, unaffordable, owned and playing items. Trying a pedal or an instrument puts your setup back when you move on or leave.
- **The sound:**
  - the pedal chain is built in order, and each pedal fades in and out without a gap;
  - every instrument sounds for a note, and its release and Space work;
  - no new voice waits on anything slow when a key is pressed.
- **The art:** every new frame is in the sheet in the numbers above, within the colour and size limits.
- **Unchanged:**
  - the existing tests pass;
  - the headline bot test is unchanged, since gear doesn't touch the rules;
  - a set played with every pedal on scores the same as with none.
- **Checked in Chrome:** the shop, buying, trying each item by ear, each pedal and instrument in a set, and the gear strip. Nathan's ear has the final say on every sound.

## How we'll know it works

Nathan plays his next ten sets or so. The log records what he bought, which instrument he played and which pedals he used.

**It works** if he buys things by choice, uses pedals mid-set, and his Another-set rate holds or rises. **If the shop makes sets feel like a grind for coins,** the prices come down; that's a number in `tuning.js`. **If a sound doesn't please him,** its settings in `audio.js` change.

## Not in this change

- The loop pedal (the next spec).
- Gear that changes how the crowd reacts, and anything that boosts earnings.
- Selling gear back, more instruments or pedals, and more spots.
- Regulars (its own spec).
