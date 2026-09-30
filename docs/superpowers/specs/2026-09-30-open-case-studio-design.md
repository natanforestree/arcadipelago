# Open Case: the studio (design spec)

**Date:** 2026-09-30
**Status:** Nathan agreed the design in chat and on the mockups in the browser ("thats what i am talking about!"), asked for this spec ("write the spec then pause"), then for the plan ("go ahead and write the plan then pause"). Built from `docs/superpowers/plans/2026-09-30-open-case-studio.md`.

It started with Nathan: "before we move to the regulars i would like to add another few tracks to add some variety, its getting boring hearing the same song over and over". Every set plays the same 4-bar lo-fi loop, 15 times round.

Then he had a better idea: "it would be awesome to add a studio to the game where we show a similar interface to [Figure] and allow the user to be able to create their own beats that they can busk to." Figure (Propellerhead, now Reason Studios, 2012) is a phone app for making a loop: pick a rhythm, hold a pad, and it plays that rhythm on the loop as it goes round, always in key and on the beat. He wants it followed closely: "the ease that it introduces in being able to make a track is really what i am after".

So the new tracks and the studio are one idea. The studio is where you make beats, and it comes with five ready-made ones, today's lo-fi and four new styles. Between sets you pick the beat you'll busk to.

## Decisions

| Topic | Decision |
|---|---|
| Variety | **Different styles** (Nathan's choice): each ready-made beat has its own tempo, feel, chords and sounds. |
| The studio | **Follows Figure closely.** Nathan wants all four of the things he loved about it: holding a pad to play a rhythm, never playing a wrong note, building the loop up live, and its clean look and good sound. |
| Its parts | **Drums, Bass and Chords** (Nathan's pick). Chords take the place of Figure's Lead, since when you busk you're the lead. |
| Its layout | Figure's: tabs across the top, the rhythm wheel on the left, a big pad on the right (Nathan picked it over a track view with controls). The mouse is your finger, and keys can stand in for the pad. |
| The strip | A picture of the loop along the bottom, "just for visuals just so when you look at it you know what is going on": bar numbers, a lane per part showing its notes, and the playhead. Nothing in it to click. |
| Tracks and the studio | **One idea** (Nathan's choice): the new styles are the studio's ready-made beats. |
| Getting it | **Bought in the shop** (Nathan's choice), for **150 coins**. Until then every set plays the lo-fi, as now. |
| Choosing | **You pick between sets** (Nathan's choice): in the studio, "Busk to this" makes a beat the one your sets use. |
| The ready-made beats | Lo-fi (today's), bossa nova, funk, reggae and a slow ballad (Nathan picked all four styles). |
| Keys | **Only the white keys.** A beat's key is one of six moods of the white keys, so the crowd's in-key rule, the key lock and your hands stay as they are. |
| A set's length | **About 3 minutes whatever the tempo**, so a fast beat gets more bars. |
| Clearing | A **Clear** button empties the part you're on (Nathan asked for a way to clear a track). |
| The game's own strip | Later, in a spec of its own: Nathan wants the busking screen's bar counter, loop cells and "they remember" boxes to become a picture like the studio's strip ("All of them"). |

## Beats

A beat is data. The band plays whichever beat the set uses, in place of today's one fixed loop, and the studio records into the same data.

- **What a beat holds:**
  - a name, and whether it's ready-made or yours;
  - its tempo (60 to 140 bpm), its swing (straight, or the second 16th of each pair pushed late, up to 75%), its key (one of the moods below) and its length (1, 2 or 4 bars);
  - a sound for each part, and the mix: each part's level, Pump, and two switches for texture, **Pad** (a soft pad under the chords) and **Vinyl** (crackle and tape wobble);
  - **drums:** hits on kick, snare, hats and percussion, each with where it falls (the 16th) and how hard;
  - **bass:** notes, each with where it falls, how long it lasts, how hard, its tone, and which note of the key it is;
  - **chords:** chord hits, each with where it falls, how long it lasts, how hard, its tone, and which chord of the key it is.
- **Notes are kept by their place in the key,** so changing a beat's key carries its bass and chords along. A ready-made beat may spell out its chords' exact notes, as the lo-fi does with its Dm9, G13, Cmaj9 and Am9.
- **The moods:** C major, D Dorian, E Phrygian, F Lydian, G Mixolydian and A minor. They all use the white keys and differ in their home note, so each has its own colour. B, the seventh, is left out: its home chord is diminished and never sounds settled.
- **The chords of a key** are the seven built on its notes, plus the home chord again an octave up: eight, left to right. In A minor they're Am, B°, C, Dm, Em, F, G and Am. Each chord sound voices them its own way. The electric piano adds 9ths, as the lo-fi does, and the organ plays plain triads for a reggae skank.
- **The band still builds up with the crowd,** with the same thresholds as now:

  | Crowd | What plays |
  |---|---|
  | anyone listening | the chords (and the Vinyl crackle) |
  | 1 | the kick, the snare and the percussion |
  | 3 | the bass |
  | 5 | the hats (and the Pad, and the Vinyl's tape wobble) |

  Before anyone stops, the soft stand-in percussion (shaker, snaps and a low tap) plays as it does now, at the beat's tempo.

## The five ready-made beats

| Beat | Tempo | Feel | Key | Chords, a bar each | Sounds |
|---|---|---|---|---|---|
| **Lo-fi** | 80 | lazy swing (58%) | C major | Dm9 · G13 · Cmaj9 · Am9 | exactly today's: electric piano, round bass, the lo-fi kit, Pad and Vinyl on |
| **Bossa nova** | 132 | straight | A minor | Am7 · Dm7 · G7 · Cmaj7 | nylon-guitar comping, a bass on beats 1 and 3, the brushes kit with a rim-click clave and shaker |
| **Funk** | 100 | tight, a touch of swing | D Dorian | Dm9 · G9 · Dm9 · G9 | clav stabs, a busy plucked bass, the funk kit with open hats |
| **Reggae** | 76 | a little swing | A minor | Am · G · F · G | organ skanks on the offbeats, a deep round bass, the reggae kit's one-drop (kick and rim together on beat 3) |
| **Slow ballad** | 68 | straight | C major | C · G · Am · F | piano chords with the Pad on, a round bass, the brushes kit |

- All five are 4 bars long and always there, and they never change. Changing one makes your own copy (see "Your beats").
- The lo-fi plays the same notes at the same times as today's loop, through the same voices.
- The new beats' tempos, patterns and sounds are starting points, to be tuned by ear the way the lo-fi was.

## The studio screen

The layout from the mockups, drawn in the game's flat style at 320×180. Each part has its own colour: drums orange, bass blue and chords green.

- **The top bar:**
  - the beat's name: click it to open the list of beats;
  - the tabs: **Drums**, **Bass**, **Chords** and **Mix**;
  - the song's settings: **tempo**, **key**, **swing** and **length**. Click one and drag up or down to change it, as Figure swipes.
- **The rhythm wheel,** on the left:
  - Each part has 16 rhythms, running from sparse to busy. Each is one bar long, and the ring shows its hits as long and short marks for long and short notes.
    - **Drums:** from a single hit on the one to steady 8ths, 16ths, offbeats and syncopations.
    - **Bass:** long held notes, a note a beat, pushes ahead of the beat, and busier lines.
    - **Chords:** long held chords, a chord a beat, offbeat stabs (the skank) and comping patterns like the bossa's.
  - Scroll over the wheel, click its arrows, or press ↑ and ↓ to change the rhythm.
- **The buttons** under the wheel:
  - **Sound:** steps through the part's sounds.
    - Drums: the lo-fi, brushes, funk and reggae kits, each with its own four sounds.
    - Bass: round, plucked and deep.
    - Chords: electric piano, nylon guitar, clav, organ and piano.
  - **Range** (bass only): moves the pad up or down an octave.
  - **Erase:** hold it, or Backspace, while holding the pad, and the part's notes vanish as the playhead passes.
  - **Clear:** empties the part you're on. Shift+Backspace does it too.
  - **Undo:** takes back your last change: a hold, an erase, a clear or a setting. Cmd+Z (Ctrl+Z) does it too.
- **The pad,** on the right, is where you play:
  - **Drums:** four strips, kick, snare, hats and percussion. Left to right is softer to harder.
  - **Bass:** eight columns, the notes of the key across an octave, named along the bottom. Up and down is the tone, darker to brighter.
  - **Chords:** eight columns, the chords of the key, named along the bottom. Up and down is the tone.
  - Where you hold lights up, like Figure's finger mark.
- **The keys** stand in for the pad: A, S, D and F are the four drum strips, and A to K are the eight bass notes or chords, played at a middle tone. Tab moves to the next part, and Esc goes back to the end card.
- **Mix:** a level bar for each part (drag it), a mute for each, **Pump** (which ducks the bass and chords on every kick; drag it from none to a lot), and the **Pad** and **Vinyl** switches.
- **The strip,** along the bottom, is a picture of the loop and nothing to click:
  - bar numbers, with a line on every beat;
  - three thin lanes in the parts' colours: the drums as four rows of marks, the bass as a little piano roll (higher notes higher, longer notes longer), and the chords as named blocks with a mark where each hit falls;
  - the playhead going round.
- **The list of beats** opens over the pad:
  - the five ready-made beats with their tempo and key, then your six slots (an empty one says so);
  - click one to open it, or **New** for a blank beat;
  - **Busk to this** makes the open beat the one your sets use; the chosen beat is marked.

## How recording works

- **The loop never stops** while you're in the studio, and all three parts play whatever the crowd's size, at their mix levels. Your own instrument is silent here: the keys play the pad.
- **Hold to paint.** While you hold the pad, each step of the rhythm that the playhead reaches plays and is written into the part:
  - on the drums, at the strip you're holding;
  - on the bass and chords, at the note or chord under your finger, with the tone your finger's height gives.

  It replaces what that part had at those steps (for the drums, only that strip's hits), like painting over it. Moving your finger while you hold changes the note from the next step on.
- **Nothing is ever wrong or late.** Every hit lands on a step of the rhythm, and every note is in the key. A hold is heard from its first step, even when the band has already queued that moment. A press a hair after a step still catches that step, and it sounds at once.
- **Erase** removes the part's notes (for the drums, the held strip's) at every step the playhead passes while you hold.
- **Changing the settings:**
  - Changing the key moves every note to the same place in the new key.
  - Shortening the length keeps the first bars.
  - Lengthening it repeats what's there, so the loop sounds the same until you change it.
- **Undo** steps back through your changes, one at a time, up to 20.

## Your beats

- **Six slots,** kept in the browser like your savings and gear. The ready-made beats sit above them and never change.
- **Saving happens as you go.** The first change to a ready-made beat makes your copy in the first empty slot, named after it ("Funk 2", or "Funk 3" if there's already a 2), and your change goes into the copy. A blank beat from New is named "Beat 1", "Beat 2" and so on.
- **When all six are full,** making a copy or a new beat asks which of yours to replace: click one, or press Esc to leave things as they were.
- **Busk to this** is remembered. The end card's Another set uses that beat until you choose another. If you choose a slot and later replace its beat, the choice follows the slot.
- **Getting in:** the studio is a shop item, like the loop pedal: a small groovebox on the counter, 150 coins, "Make your own beats to busk to." Once it's yours, the end card has a **Studio** button next to "Visit the shop". Without it there's no button, and every set plays the lo-fi.

## In a set

- **The band plays your beat:** its tempo, swing, sounds and mix, built up with the crowd as above.
- **Everything that counts time follows the beat's tempo:**
  - the crowd's ears (the 16th grid, the ends of phrases, bars);
  - the loop pedal: 4 bars of this beat, its count-in, and its early allowance;
  - the delay pedal's dotted 8th and the tremolo's 8th notes;
  - the listeners' nods, the count-in cue, and the bar counter;
  - the bots, the applause and the pigeons' return.
- **A set lasts about 3 minutes.** Its bars are the multiple of 4 closest to 3 minutes at the beat's tempo: 60 for the lo-fi, as now, about 100 for the bossa nova, 76 for the funk, 56 for the reggae and 52 for the ballad. The bar counter shows the set's own total.
- **The park's evening still spans the whole set.** Its timeline, set today in bars of a 60-bar set (the sky's stages, the sun, the lamp, the windows, the stars, the train), is read as shares of the set.
- **The shop's try of the loop pedal** plays your beat's chords softly, at its tempo.
- **The rules don't change.** Tastes, tips, patience and the crowd's thresholds are as they are. With the lo-fi, every set, bot score and test comes out exactly as today.

## For checking by ear

- **`?beat=`** followed by a ready-made beat (`lofi`, `bossa`, `funk`, `reggae` or `ballad`) makes a set use that beat, the way `?seed=` fixes the crowd. It doesn't need the studio and isn't remembered.
- **The sound check** (`?sound`) gets a beat menu beside its instrument menu.
- **`?coins=`:** as with the shop, nothing done on that page is kept, including beats made in the studio.
- **The log** notes each set's beat.

## How it's built

- **`beats.js` (new):**
  - the beat's shape;
  - the five ready-made beats;
  - the moods, and the notes and chords of a key;
  - the timing for a beat: its beat and bar lengths, when a 16th sounds and which 16th is nearest a time (today's `groove.js` maths, taking a beat);
  - what each part plays on a 16th, for the band;
  - a set's length in bars.

  It's pure and tested in Node. Today's `groove.js` moves into it, since its fixed tempo, chords and patterns become the lo-fi beat.
- **`rhythms.js` (new):** the 16 rhythms of each part.
- **`studio.js` (new, pure):**
  - the studio's state: the open beat, the part, the rhythm, what's held;
  - painting, erasing and clearing as time passes;
  - undo, the settings, and saving to slots, loading them, and the chosen beat, through `storage.js`.

  Tested in Node, like `shop.js` and `looper.js`.
- **`audio.js`:**
  - plays a beat: its sounds, including the new voices, its mix and Pump, and its Pad and Vinyl;
  - plays a studio hold's first step on time;
  - the delay and tremolo at the beat's tempo.
- **Tempo from the set's beat:** `set.js`, `listen.js`, `looper.js`, `scene.js`, `bots.js`, `render.js` and `soundcheck.js` take their timing from the set's beat instead of fixed numbers.
- **`gear.js` / `tuning.js`:** the studio in the stock (kind `studio`, 150 coins).
- **`render.js`:** the studio screen and its strip, the bar counter's total, and the end card's Studio button.
- **`main.js`:** the studio screen (mouse and keys), the end card's Studio button, `?beat=`, and the chosen beat for each set.
- **Art:** the groovebox in the shop and its card (`gear.lua`, `shop.lua`), and any sprites the studio screen needs. New colours for the parts come from the palette, keeping the art within 64 colours and under 400 KB.
- **`index.html`:** the Studio button.
- **README:** the studio, and `?beat=`.

## Tests

- **The lo-fi is today's loop:** at 80 bpm and 58% swing, every part plays the same notes, voices, lengths and loudness on every 16th of the 4 bars as today's band does (pinned against today's values). Its 16ths fall at the same times.
- **Every ready-made beat:**
  - uses only the white keys, in its chords and its bass;
  - is 4 bars long, with a tempo from 60 to 140;
  - gives a set of about 3 minutes, in a multiple of 4 bars.
- **Timing for any beat:** a 16th's time and the 16th nearest a time agree, straight and swung, at slow and fast tempos.
- **The rules are unchanged:** every existing crowd, listen, set, loop pedal and bot test passes with the lo-fi and gives the same numbers.
- **The studio's logic:**
  - A hold paints the rhythm's steps as the playhead passes. It replaces only that part's notes (only that strip, for the drums), and a press just after a step catches it.
  - Moving your finger changes the note from the next step on.
  - Erase, Clear and Undo work, with Undo stepping back through every kind of change, up to 20.
  - Changing the key carries the notes along; shortening and lengthening behave as described.
  - The first change to a ready-made beat makes a named copy in the first empty slot, and the original stays as it was. Full slots ask, and Esc leaves everything as it was.
  - Your beats and the chosen beat survive a reload, and bad stored data is ignored safely.
- **The shop:** the studio is in the stock at 150 coins and can be bought, and the end card shows Studio only once it's yours.
- **The sound:** a beat plays at its tempo, the stand-in percussion follows it, a studio hold's first step sounds on time, and the delay's time follows the beat.
- **The screen:** the studio screen draws each tab, the strip draws each part's notes in its lane, and the bar counter shows the set's total.
- **The art:** the groovebox is in the sheet, within the palette's 64 colours and under 400 KB.
- **By eye and ear, in Chrome:**
  - each beat through `?sound` and in a set;
  - in the studio, making a beat from blank, changing a ready-made one, and busking to it;
  - Nathan judges the sounds.

## How we'll know it works

Nathan opens the studio and has a beat he likes in a minute or two, without thinking about notes, the way Figure felt. Then he busks over it, and sets stop sounding the same. **If making a beat feels fiddly,** the rhythms and the pad are where to look. **If a style doesn't sound like itself,** its sounds and patterns get tuned by ear.

## What the build settled

The plan's prototype settled what this spec left open, and changed two small things:
- **Esc leaves the studio for the park,** ready for the next set, as the shop does, rather than going back to the end card. Every screen between sets returns to the park, and the end card only tells you about a set that's over.
- **With the mouse, Erase is a switch:** click it and it lights red, paint over what to wipe, click it again. A mouse can't hold two things at once. Backspace still erases while it's held.
- **Z and X** move the bass pad an octave down or up, as they move your octave when you play. The Range button steps through the three.
- **The settings:** the tempo and the swing have ▲ and ▼ at their right. A click on the upper half of either steps it up and on the lower half down, and holding keeps stepping (after 0.4 s, then every 0.1 s, and every 0.04 s once held 1.5 s), the whole hold one change for Undo. The tempo steps a beat per minute, from 60 to 140; the swing steps through off, 54, 58, 62, 66, 70 and 75% (from between two, to the next one that way). The scroll wheel over either steps it too, at most once every 60 ms, since a trackpad's swipe sends a stream of small events. Dragging up or down still works, for big jumps (2 pixels a step, from where it was when the mouse went down). Click the key or the length to step on to the next, or drag them. (At first only a drag changed the tempo and the swing, and nothing said so: Nathan couldn't find how to change the tempo, or turn the swing on.)
- **The timing:** a press up to 60 ms after a 16th catches it, and a hold writes 50 ms ahead of the playhead. The band schedules 200 ms ahead, so it has always already scheduled the old notes of a 16th you paint: the sound cuts that part's old notes there (and a bass note or chord the new one stops) within a few milliseconds, and plays what's written on its 16th. Letting go within 50 ms of a 16th still writes it. These are in `tuning.js` (`STUDIO`).
- **From the keys:** a drum plays at 0.7 of full, and a note or chord at the middle tone. A held bass note plays at 0.8, a chord at 0.5.
- **The chords' names:** the pad names the key's triads (Am, Bdim, C). The strip names each chord as its sound stacks it: Am7 on the nylon guitar, Am9 on the electric piano, and the lo-fi's and the funk's by their own voicings.
- **A set's bars:** 60 for the lo-fi, 100 for the bossa nova, 76 for the funk, 56 for the reggae and 52 for the ballad.
- **The ready-made beats' loudness,** rendered offline in Chrome with every part playing: the lo-fi −24.8 dB, the reggae −25.7, the funk −26.6, the bossa nova −27.3 and the ballad −29.0, the gentler ones a little softer. None peaks above −4 dB. The Pump ducks by up to 70% and comes back over a quarter of a beat.
- **The colours** come from the palette already there: the drums the sky's orange, the bass the speaker's blue, the chords the loop pedal's green. The art stays at 49 colours, and the groovebox adds two frames to the sheet.
- **Two more files** than "How it's built" lists: `studioview.js` (the screen, and what a click lands on) and `studioinput.js` (the mouse and the keys). Your beats are stored under `open-case-beats`.

After Nathan's first go ("it doesnt do anything", of Busk to this), three more things, which he agreed:
- **Save, in the list of beats,** between Busk to this and Close ("i almost feel the save should go in this dropdown"), and Cmd+S (Ctrl+S) from anywhere in the studio. It opens a name box in the list's place: type up to 12 letters, digits and spaces, Backspace deletes, and Enter (or its save) sets the name and goes back to the list, where "saved" shows for a moment on the busking line. Esc (or cancel) keeps the old name, and so does an empty one; spaces at either end are trimmed. While the box is open the keys only type, and the band plays on. Saving a ready-made beat makes your copy first, as a first change does, asking which slot to replace when all six are full. Your changes still keep themselves as you go; a new name is a change like any other, so it's kept, and Undo takes it back. Save again renames.
- **Busk to this goes to the park:** it still chooses the open beat and keeps it, then leaves the studio as Esc does. Waiting for the first note, the park says "busking to" and the beat's name over "play a note to start the set", whenever the studio is yours or `?beat=` fixes the beat. Without either, the prompt is as it was.
- **`?studio`** counts the studio as yours on that page, and the title card's first key opens it. Like `?coins=N`, the page keeps nothing: no gear, beats or log.

## Not in this change

- The picture strip in the busking screen (the next spec).
- A lead part, loops longer than 4 bars, or more than six slots.
- Keys outside the white keys.
- Recording audio, or sharing or exporting beats.
- Changing the beat during a set, or the crowd liking some styles more than others.
- The Regulars.
