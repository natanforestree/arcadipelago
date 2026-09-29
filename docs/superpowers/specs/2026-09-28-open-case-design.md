# Open Case: design spec

**Date:** 2026-09-28
**Status:** Design approved by Nathan in chat, section by section (2026-09-28). This written spec is waiting for his review; the implementation plan comes after that.

A busking game for the games site (`natanforestree.github.io/games/`). You sit on a crate in a park with your guitar and an open guitar case, a looper pedal plays a chill lo-fi beat, and you improvise over it on the computer keyboard. Passers-by stop, stay and tip according to what you actually play. There is no chart: they get bored if you repeat yourself, frown if you wander off key, and grin (and a coin lands in the case) when you bring an earlier idea back changed. The band gains layers as your crowd grows.

The idea came out of a design session with Max's game-design-consultant skill. Its one new rule is **an audience that rewards invention, not accuracy**. Nathan is a musician (guitar and piano, and he records in GarageBand), and the game is built for a musician's ear first.

**This spec covers the first build: a playable test, not the finished game.** It answers one question, whether busking for a crowd that judges invention is fun, before any time goes into full art, more spots or unlocks. Alongside it come a 16-bit style sample for Nathan to judge, and the game's island on the front page, marked as a work in progress.

## Goals and success criteria

- You can play a whole set in current desktop Chrome, Firefox and Safari with a keyboard. Phones and tablets get a polite "needs a keyboard" note.
- **A key press sounds in under 20 ms** where the browser reports its audio delay (`?debug` shows the reported delay and the measured key-to-sound time). Your notes are never snapped to the beat.
- `?sound` opens the sound check: the loop with a switch per layer, and your guitar on the keys.
- Every listening and crowd rule in this spec has an automated test that passes (`cd open-case && npm test`, Node 22, no dependencies).
- **The headline test:** in total over seeds 1 to 10, a scripted "good" set earns at least 3× the coins of the random bot and at least 3× the coins of the lick bot, and it earns at least one coin on every seed.
- `?bot=random` and `?bot=lick` each play a whole set by themselves, to the end card, with no console errors.
- Open Case has an island on the front page that links to `/open-case/`, and the site's tests pass.
- The 16-bit style sample (a still and a short GIF) is made by an Aseprite script and shown to Nathan.
- **The real test is Nathan's verdict:** after a few sets, does he choose Another set? No test can automate that; the end card records his choices.

## Decisions made in brainstorming

| Topic | Decision |
|---|---|
| What this build is | A playable test: one spot, one loop, the crowd rules, placeholder art. Plus a 16-bit style sample, and the island now. |
| Who tests | Nathan only. Two bots and a debug view stand in for other testers. |
| Input | The computer keyboard, laid out like GarageBand's Musical Typing, including its keys for octave and volume. The mouse is only for the end card's buttons. |
| Instrument | A guitar, made in code (a plucked-string synth), with an open guitar case for the tips |
| The loop | Chill lo-fi hip hop: 80 bpm, a lazy 16th swing, Dm9, G13, Cmaj9, Am9 |
| Layers | They join as the crowd grows and drop out as it shrinks, always on a bar line |
| Sound | All made live with Web Audio, no audio files, like Last Light. If the guitar doesn't pass Nathan's ear at the sound check, it switches to recorded samples and nothing else changes. |
| Crowd rules | Repeating yourself bores them; off-key notes on strong beats make them frown; an earlier idea brought back changed earns a grin and a coin; endless new notes with no idea ever reused confuses them; long silence loses them |
| Art | Placeholders drawn in code for the test. The final look was to be 16-bit, judged from a style sample; after seeing it, Nathan chose a flat style from a reference picture instead (flat colour, no outlines, no dithering). |
| Island | Replaces the scaffolding island in the same spot, with a strip of scaffolding kept to say it's a work in progress |
| Later, not now | Real instruments through the mic or a MIDI keyboard; Nathan's own GarageBand music as loops and stems; more spots, the shop and unlocks; full flat-style art |
| Name | *Open Case*, in `open-case/`, id `open-case` |

## 1. What you see and do

### Starting

A title card over the park at dusk shows *Open Case*, a picture of the key layout, and "press any key". Browsers only allow sound after a key press or click, so that key press starts the audio. It only dismisses the card; it doesn't play a note.

### The scene

- A side-on park path, drawn at **320×180** and scaled up by the largest whole number that fits the window, with crisp pixels and letterboxing.
- You sit on a crate just left of centre, with the guitar, the open case in front of you, and the looper pedal beside it.
- People walk along the path from both sides, at most 6 at once. Those who stop stand in a loose arc in front of you, in up to 6 spots.

### Controls

GarageBand's Musical Typing layout, so a GarageBand user's fingers already know it:

```
  W E   T Y U   O P        C# D#   F# G# A#   C# D#
 A S D F G H J K L ; '     C  D  E  F  G  A  B  C  D  E  F
 Z / X  octave down/up    C / V  softer/louder   Space  let ring
 1  scale lock on/off     M  mute                Esc  pause
```

- **Pitch.** At octave 0, A is C4. Z and X shift by an octave, from −2 to +1. The guitar's range is E2 to E6 (MIDI 40 to 88); keys that would fall outside it are silent.
- **Pick strength.** C and V step through 4 levels, starting at 3. Harder is louder and brighter.
- Keys are read by their physical position (`KeyboardEvent.code`), so the layout works on non-US keyboards too. Held keys don't repeat. Esc pauses the set and the music, and Esc again resumes it.
- Many laptop keyboards can't register three keys pressed together. This is a melody game, and the loop carries the chords.

### A set

- **Your first note starts the looper and the set.** That note is beat 1 of bar 1.
- A set is **60 bars**, 15 times round the 4-bar loop, which is 3 minutes at 80 bpm.
- **The end.** After bar 60, the layers fade out over one bar, anyone still listening claps, and the last tips land.
- **The end card** shows the coins earned, how many people stopped, and who stayed longest (their kind and for how long). It has two buttons, **Another set** and **Stop here**. Which one you press is recorded, because that choice is the test.
- There's no way to lose. An empty path is a quiet set.
- **Not in this build:** other spots, the shop, unlocks, and anything saved between visits except the settings and the test log.

## 2. The band and the sound

### The loop

- **80 bpm**, 4/4, 16 sixteenths to a bar, with a lazy swing: the second 16th of each pair lands at 58% of the pair (my starting value, in the tuning file).
- **Four bars:** Dm9, G13, Cmaj9, Am9 (ii–V–I–vi). All four are in C major, so every white key is in key over the whole loop, and the black keys are the colour notes.
- **In key** means the notes of C major: C D E F G A B. The black keys (C#, D#, F#, G#, A#) are outside.

### Layers

| Listeners stopped | What's playing |
|---|---|
| 0 | Dusty electric-piano chords and vinyl crackle |
| 1 or more | Plus a soft boom-bap kick and snare |
| 3 or more | Plus a warm bass line |
| 5 or more | Plus swung hi-hats, a soft pad and tape wobble |

- A layer joins on the next bar line once the crowd reaches its number.
- **The 2-bar hold.** A layer only drops out after the crowd has stayed below its number for 2 whole bars, and then it drops on a bar line. So a single person hesitating doesn't make the music flicker.
- **Every layer is a slot.** In this build each is filled by code. Later a slot can hold an audio file instead, so Nathan's GarageBand stems can drop in with a small card giving their tempo, key and chords. The slot interface is built for that now; the loading of audio files is not.

**Update (2026-09-28):** at Nathan's request, a soft percussion part (a shaker on the 8ths, finger snaps on 2 and 4, a low tap on 1) plays whenever the drums are out (at the start, and if the crowd empties), and fades when they join.

### Your guitar

- A clean, warm guitar tone made with a plucked-string synth, through the same dusty filter as the band but a little brighter, so it sits in the beat and still stands out.
- **Releasing a key mutes the string** after a short damp (about 80 ms). **Holding Space lets notes ring** until they decay on their own, over about 3 to 4 seconds.
- **Legato.** A key pressed while the previous key is still held plays as a hammer-on: no pick attack, a little softer.
- **Strums.** Keys pressed within 30 ms of each other sound about 12 ms apart, from the lowest note up.
- **Scale lock** (the 1 key, off by default) maps every key onto the nearest C major pentatonic note (C D E G A) at or below it, so nothing clashes. It's there for friends later; Nathan leaves it off.
- **Volume and mute** are remembered on this computer, as in Last Light.

### Timing

- **The audio clock is the master.** Every note gets a time in beats since the set began, read from the audio clock when its key goes down. The crowd rules judge those times, rounded to the nearest 16th note. At 80 bpm a 16th is about 190 ms, so small timing jitter never changes a verdict.
- **Your notes start the instant you press,** with the audio context asked for its lowest latency. The band is scheduled a moment ahead (about 0.2 s), as Last Light's score is.

### The sound check

`/open-case/?sound` is a bare page with the loop, a button to switch each layer on and off, and the guitar on the keys. It's built first. Nathan judges the guitar and the beat by ear there, and if the guitar doesn't pass, it switches to recorded samples (with their licences noted). Only the guitar's voice changes; nothing else in this spec does.

## 3. The crowd

### Who passes

| Kind | Walking speed | Wants | Patience to hook |
|---|---|---|---|
| Jogger | Fast | **Energy:** at least 2 notes a beat over the last bar | About 6 s |
| Old man | Slow | **Space:** long notes and rests, at least a beat of rest in the last bar; winces at pick strength 4 | About 12 s |
| Student | Medium | **Groove:** at least a third of the last bar's notes on the off 16ths (not on an 8th-note position) | About 8 s |
| Commuter | Brisk | Nothing in particular, just a good phrase, fast | About 6 s |

All the numbers in this section are starting values in the tuning file, untested. The plan may refine them from a prototype.

### Arrivals

- Someone arrives every 6 to 10 seconds, from the left or right at random, until 6 are on screen. Kinds, sides and timings all come from the set's seed (`?seed=N` fixes it), so a set's passers-by replay exactly.
- **A crowd draws a crowd.** Each person already stopped gives each new arrival a head start of interest (0.05 each).

### Interest

Each person has an interest level from 0 to 1 (shown in `?debug`).

- **Hooking.** A passer-by starts listening when they come into earshot: within 100 px of you along the path (a starting value). If their interest reaches 0.5 within their patience, they stop and take a spot in the arc. If not, they walk on.
- **Rises:** a phrase that ends with no rule broken (+0.05), a bar that matches their taste (+0.1), a callback (+0.3).
- **Falls:** each rule below, and a slow fade over time (−0.01 a second), because nobody listens forever.
- **Leaving bored.** Below 0.2 they leave, after showing the reaction for the rule that lost them, so you can see why.
- **Leaving happy.** Each person has a time budget of 1 to 3 minutes from the seed. When it runs out with their interest above 0.5, they leave happily and tip; with it lower, they just leave.

### The rules

A **note** is its pitch, its onset time in 16ths, and its pick strength. A **shape** is 4 notes in a row: their 3 steps in pitch (in semitones) and their 3 gaps in time (in 16ths, rounded, capped at 8). Two shapes are **the same** when their steps and gaps are identical, wherever they start. A **phrase** is a run of notes that ends when no key is held and no new note has started for one full beat. (Chat said half a beat; a full beat is used so that quarter notes played short don't each count as a phrase.)

| Rule | When it fires | Reaction | Interest |
|---|---|---|---|
| **Repeat** | Among the last 16 notes, the same shape appears for the 3rd time (and again on each time after) | Yawn, or a look at their phone | −0.15 |
| **Off key** | At a phrase's end, and at every bar line for a phrase still going: more than 1 in 4 of the phrase's notes on strong beats (onsets on a quarter-note beat) are outside the key. An outside note followed within a beat by a step of 1 or 2 semitones to an in-key note is a **colour note** and doesn't count. | Frown | −0.1 |
| **Callback** | A phrase opens with a shape from the memory strip (below) whose phrase began 8 or more bars ago, changed: the same steps starting on a different note, or the same steps from the same starting note with different gaps. Each idea can earn this once every 16 bars. | Grin, and a coin from everyone stopped | +0.3 |
| **Recognised** | A phrase opens with a strip idea from 8 or more bars ago, unchanged | A small nod | +0.05 |
| **Random** | Over the last 16 bars, at least 32 notes and no shape appearing twice | Head tilt | −0.15, once a bar while it holds |
| **Silence** | More than 4 bars with no note | Drifting | −0.1 a bar after the 4th |
| **Too loud** | Pick strength 4 (the old man only) | Wince | −0.05 a note |
| **Taste** | A bar that matches the person's taste in the table above | Bouncing notes over their head | +0.1 |

### The memory strip

The crowd remembers your last 6 ideas. An **idea** is the opening shape of a phrase of 4 notes or more. When a phrase ends, its idea joins the strip, and the oldest drops off. An idea that's called back stays in the strip and counts as fresh.

### Tips

- A callback: 1 coin from each stopped listener.
- A happy exit: 2 coins (the old man gives 3).
- The end of the set: 1 coin from each listener still there.

## 4. Seeing the rules, and testing them

### The note trail

- Every note floats up from the guitar as a small glyph. Higher notes start higher, and the spacing follows your timing. Glyphs drift up and fade over about 2 bars.
- When a shape comes round a second time, its glyphs flash with a faint outline. On the third (when the Repeat rule fires) they turn grey.

### The memory strip on screen

Along the top of the screen, the strip shows the crowd's 6 remembered ideas as little glyph clusters. On a callback, the old idea lights up gold, and a gold arc joins it to your new notes as the coins land. This is how the callback rule teaches itself without words.

### Reactions

Small icons over heads, readable within a second: zzz or a phone (bored), "?" (confused), a frown mark (off key), bouncing notes (taste), a coin flip (callback), a wince (too loud), a small nod (recognised).

### `?debug`

- Over each person: their interest bar and the last rule that touched them ("repeat", "off key", "callback", "recognised", "random", "silence", "loud", "taste").
- A corner panel: bar and beat, the layers on, the stopped count, your last 16 notes tagged by shape, and the audio delay the browser reports plus the measured key-to-sound time.
- The end card gets a **Run the bots** button. It runs both bots instantly and silently against this set's seed (the rules are pure, so a set can run without sound or screen) and shows their coins next to yours: "Random bot: 3. Lick bot: 2. You: 21."
- The test log (below) is listed on the end card.

### The bots

- **The random bot** (`?bot=random`) plays random keys from the whole row at octave 0, 1 to 3 notes a beat, each 1 to 4 sixteenths long, with occasional rests. It shows the too-random side.
- **The lick bot** (`?bot=lick`) plays one 4-note lick over and over with a beat's rest between. It shows the too-repetitive side.
- Both are deterministic from the seed. In the browser they play a real, audible set.

### The test log

This computer remembers the last 50 sets: the date, coins, how many stopped, and whether Nathan pressed Another set or Stop here. Only the game's own settings and this log are stored, in local storage, under keys starting `open-case-`.

## 5. Art and the island

### Test art: placeholders drawn in code

- **People** are simple silhouettes, one colour and shape per kind: the jogger in a bright tracksuit, the old man with a hat and cane, the student with a backpack and headphones, the commuter with a briefcase. They bob as they walk.
- **You, the guitar, the open case, the looper and the park** (sky, path, a lamp post, a tree) are plain shapes.
- Coins arc into the case and stay there, piling up over the set.
- UI text uses the Silkscreen font, as Last Light does.

### The 16-bit style sample

**Update (2026-09-28):** Nathan saw the 16-bit sample and chose a different direction from a reference picture he found: flat colour, no outlines, no dithering, about a dozen colours per figure, figures about 46 px tall at 320×180. The sample script was redrawn in that style; the repaint aims at it.

**Update (2026-09-28):** the flat-style repaint is built; see `2026-09-28-open-case-art-design.md`. The game now draws from a sprite sheet made by `art/open-case/sprites.lua`.

Made by Aseprite scripts in `art/open-case/`, like the other games' art, and shown to Nathan. As the README says of previews, it isn't committed.

- **A still** of the park at dusk, at 320×180, in layers at different depths: sky, distant rooftops, near trees, the path. You're on the crate with the guitar, with the open case holding a few coins, and the looper.
- **A short GIF** of the old man walking in, nodding, then grinning as a coin arcs into the case.
- **Palette:** lo-fi dusk, warm oranges and purples with teal shadows, about 32 to 48 colours, with dithered gradients in the sky. People are 40 to 48 px tall.

If Nathan likes it, a later round (with its own spec) repaints the game in that style, once the test says the game is worth it.

### The island

- **Art:** `art/site/island-open-case.lua`, in the site's island style, 96 to 140 px wide (the README's range for games). It shows a chunk of park corner with a warm lamp post, a crate with the guitar leaning on it, and the open case with glinting coins. Little notes float up, the lamp flickers, and a coin catches the light. A strip of scaffolding stands on one edge, because it's a work in progress. New colours go in `art/site/palette.lua`, with a `glow["open-case"]` colour.
- **It takes the scaffolding island's spot** in both layouts. The site currently requires an `unfinished` island (`site/islands.js`, `site/load.js` and their tests), so that becomes optional: a `games.json` without one is valid, and nothing else about the page changes. The scaffolding island's art and script stay in the repo for the next game. Open Case is wider than the scaffolding (80 px), so it may need a nudge; the site's tests say if anything overlaps or runs off the stage. In portrait it sits bottom-right beside Last Light instead, since the scaffolding's portrait spot at the top didn't suit it; `site/games.json` has the positions.
- **The link,** in the root `index.html` list: **Open Case**, "Busk for a crowd. (Work in progress)", controls "Keyboard: play it like GarageBand's Musical Typing."
- **An icon:** `open-case/icon.png`, 48×48, from a script, for the browser tab.

## 6. How it's built

Plain ES modules with no build step, a fixed update rate, every number in `src/tuning.js`, and tests in Node with no dependencies, following Last Light's patterns.

| File | Job |
|---|---|
| `keys.js` | The Musical Typing map: key position to note, octave shift, pick strength, let-ring, scale lock |
| `input.js` | Key presses to note on and off, ignoring repeats, timestamped for the audio clock |
| `groove.js` | The loop as data: tempo, swing, chords per bar, each layer's pattern, what's in key, beat and bar from a time |
| `listen.js` | The rules: shapes, phrases, repeats, off-key and colour notes, callbacks, recognition, randomness, silence, the memory strip |
| `crowd.js` | Passers-by: arrivals from the seed, kinds and tastes, interest, hooking, leaving, tips, crowd draws crowd |
| `set.js` | One set's state and its update: joins listening to the crowd, layers by crowd size with the 2-bar hold, coins, the ending |
| `bots.js` | The random and lick bots, and the scripted good set for the tests |
| `audio.js` | The guitar, electric piano, drums, bass, pad, crackle and the dusty filter; the layer slots; plays your notes at once and schedules the band ahead |
| `render.js` | The scene, trail, memory strip, reactions, end card and the `?debug` panel |
| `main.js` | Start-up, the loop, the wiring, and the URL options: `?sound`, `?debug`, `?seed=N`, `?bot=random` or `lick` |
| `tuning.js`, `rng.js`, `storage.js` | Every number; the seeded random numbers; safe local storage |

- **Pure rules.** `listen.js`, `crowd.js` and `set.js` never touch the page, the clock or `Math.random`. Given a seed and a list of notes (in beats), a whole set replays exactly, in Node or in the browser.
- **Updates.** The crowd updates at a fixed 60 Hz, and frames draw on `requestAnimationFrame`. Notes feed the rules as they're played, timed in beats from the audio clock.
- **With any debug option,** `window.__openCase` exposes the game for browser checks, as Last Light does.

### Tests

- **Unit tests:**
  - the key map, octave limits and scale lock;
  - the groove's timing and swing;
  - each rule on scripted notes: a repeat fires on the third time, a callback needs 8+ bars and a change, a colour note must step to an in-key note, a phrase ends after a beat of silence;
  - the crowd: arrivals from the seed, hooking and patience, the 2-bar hold, tips, crowd draws crowd.
- **The headline test** in "Goals" above: the good set against both bots over seeds 1 to 10.
- **In a real browser:**
  - the key-to-sound time;
  - a smoke check that the page loads with no console errors, scripted keys play notes, and a bot set reaches the end card;
  - the sound check page.
- **The site:** its tests still pass with the new island and with `unfinished` optional.

### Build order

1. The sound check. Nathan gets the link to listen; it doesn't hold up the build.
2. The listening rules and the crowd, with their tests.
3. The playable scene, with the trail, memory strip, debug view and bots.
4. The island and the front-page link.
5. The 16-bit style sample, alongside the rest.

### Publishing

The work happens on the `open-case` branch. When it's done, it's merged into `main` and pushed, which publishes it: Nathan has said a work-in-progress link on his page is fine. Before pushing, fetch and merge `origin/main` first (Nathan commits to `main` too), and never force.

## Risks

- **The guitar sounds cheap.** The sound check catches it first. The fallback is recorded guitar samples, with licences checked.
- **The rules feel like an algorithm, not ears.** The bots and `?debug` show it, and every number is in the tuning file. Nathan's ear is the final judge.
- **Nathan wrote the rules, so he can't be surprised by them.** That's why the bots exist. Friends can be added as testers later.
- **Laptop keyboards drop some key combinations.** It's a melody game, so this mostly doesn't matter.
- **Browsers differ on audio delay.** Bluetooth headphones add delay the game can't remove; `?debug` shows what the browser reports.

## Later (not in this build)

- Real instruments: a MIDI keyboard (Chrome, Edge and Firefox; not Safari), then guitar and voice through the mic (single-note lines; strummed chords are hard to hear).
- Nathan's own music: GarageBand loops and stems as layer slots, each with a card giving its tempo, key and chords.
- More spots (a station at rush hour, a night market), more kinds of listener, new sounds and loops to spend coins on.
- The full flat-style repaint.
