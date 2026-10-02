# Arcade + Archipelago = Arcadipelago!

Little browser games, each on its own floating island, hosted on GitHub Pages at https://natanforestree.github.io/arcadipelago/

## Adding a game

1. Make a folder for it, e.g. `pong/`, with an `index.html` inside.
2. Add its link to the list in the root `index.html`, in the same form as the others, on one line:
   `<li><a href="./pong/" data-game="pong"><strong>Pong</strong> <span class="blurb">…</span> <span class="controls">…</span></a></li>`.
   Browsers that can't show the scene show this list, and the scene writes these words on the island's sign.
3. Paint its island: copy `art/site/island-snake.lua` to `art/site/island-pong.lua` and repaint it in the game's own style, copying the colours you borrow into `art/site/palette.lua`. Change the copy's `I.write("snake", …)` to the new game's id (otherwise it overwrites Snake's art), and add a `glow.pong` colour in `palette.lua`. Keep it 96–140 px wide.
4. Add it to `site/games.json` with its id, `"island": "island-pong"`, a bob, and a spot in both layouts. The scaffolding island ("unfinished") is optional; take it out of games.json if a new game needs its spot. Find it a spot in both layouts, moving the other islands if needed; the tests say what overlaps or runs off the stage.
5. Rebuild the site art (see "The games page") and run the tests: `cd site && npm test`. They check that every link has an island and that nothing overlaps.
6. Commit and push to `main`. Pages redeploys automatically (about a minute).

## Running locally

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

## The games page

The front page is a living pixel-art scene. Each game floats as its own island, painted in that game's style, in a sky that follows your local time of day. The design spec is `docs/superpowers/specs/2026-09-23-games-islands-design.md`.

- Code: `site/`, plain ES modules with no build step. Tests (Node 22, no dependencies): `cd site && npm test`.
- See any time of day: `/?time=dawn`, `day`, `dusk` or `night`.
- Art: each piece has a script in `art/site/`, and `palette.lua` holds every colour. Rebuild it all from the repo root. It's deterministic: an unchanged script rebuilds its files byte for byte.

  ```sh
  for s in art/site/sky.lua art/site/island-*.lua art/site/sign.lua; do /Applications/Aseprite.app/Contents/MacOS/aseprite -b --script "$s"; done
  ```

  `aseprite -b --script art/site/style-test.lua` writes `art/site/preview-style.png`, which shows all four skies with the islands, and each island script writes a preview GIF. Previews aren't committed.

## Art

Pixel art lives in `art/`, drawn in Aseprite through the Aseprite MCP. Each piece has a Lua script that regenerates it, e.g.:

```sh
/Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/snake-icon.lua
```

That writes the editable `art/snake-icon.aseprite` and the `snake/icon.png` the site uses.

## Marrow

`marrow/` is a one-hit-kill fencing tug-of-war in the style of Nidhogg. Each of its three CPU opponents fights you in its own world, painted over the same seven screens: a flesh cathedral, a Beksiński-like dusk, and a bioluminescent abyss. The design spec is `docs/superpowers/specs/2026-09-23-marrow-design.md`.

- Tests (Node 22, no dependencies): `cd marrow && npm test`
- Watch the CPU play itself, with hitboxes: open `/marrow/?debug=cpu&speed=10`
- Tuning: every number is in `marrow/src/tuning.js`. The body geometry shared with the art is in `marrow/data/body.json`, and the screen layouts are in `marrow/data/screens.json`.
- Art: each asset has a script in `art/marrow/`. `palette.lua` holds the fighters' glow and every world's palette, and `worlds/<world>.lua` paints that world. Rebuild everything from the repo root (it takes about a minute, and it's deterministic: an unchanged script rebuilds its files byte for byte):

  ```sh
  for s in fighter scenes maw ui icon; do /Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/marrow/$s.lua; done
  ```

  To repaint one world, run `aseprite -b --script-param world=dusk --script art/marrow/scenes.lua`. To review the worlds, `aseprite -b --script art/marrow/tour.lua` writes `art/marrow/preview-tour-<world>.png`, one image per world. Previews aren't committed.

## Last Light

`last-light/` is a first-person survival horror game: you hold a snowy log cabin through one winter night, from dusk to dawn, against the after-eaters, pale starved things that come out of the trees. It's pixel art drawn by a raycaster. The design spec is `docs/superpowers/specs/2026-09-24-last-light-design.md`. The after-eaters drop embers that you spend at the stove on upgrades ("Dark harvest": `docs/superpowers/specs/2026-09-25-last-light-dark-harvest-design.md`), and sometimes a charm that gives you something and takes something ("Cursed charms": `docs/superpowers/specs/2026-09-26-last-light-cursed-charms-design.md`).

- Tests (Node 22, no dependencies): `cd last-light && npm test`. Bench: `npm run bench` (the target is under 4 ms a frame).
- Debug: `?debug=fps` shows the frame rate, and `?debug=bot` plays by itself (add `&speed=N` to speed it up). Debug flags combine with a comma: `?debug=bot,fps`. `?wave=N` (1–8) starts at that wave, `?god` means you can't die, `?seed=N` fixes the night's randomness, `?embers=N` starts each night carrying N embers, and `?charm=wolf` (or `thread`, `crow`, `salt`, `hare`, `eye`) starts each night wearing that charm. For example, `?debug=bot,fps&god&speed=20&seed=2` watches a whole night play out fast.
- Tuning: every number is in `last-light/src/tuning.js`.
- Art: each asset has a script in `art/last-light/`, and `palette.lua` holds every colour. Rebuild everything from the repo root (it's deterministic: an unchanged script rebuilds its files byte for byte):

  ```sh
  for s in textures sky sprites hands hud icon; do /Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/last-light/$s.lua; done
  ```

  To review the art, `aseprite -b --script art/last-light/style-test.lua` writes `art/last-light/preview-style.png`. Previews aren't committed.

## Open Case

`open-case/` is a busking game, a work in progress. You improvise on the computer keyboard, laid out like GarageBand's Musical Typing, over the band's beat, and passers-by stop, stay and tip according to what you play. The game opens on a map of the city (painted after a friend's atlas), with a title over the first map of each visit that any key or click clears (and starts the sound); before each set it asks where to busk and what to play: the park at sunset, the station at rush hour (commuters come in waves off each train, in a hurry, and tip well), the night market (slow browsers who stay long, for smaller coins) or One Tree Island, the little island in the lake, at sunrise, to one of five ready-made tracks or one of your own. On the island you play alone, squeezed under its one pine: animals come instead of people (a fox trotting along the shore, a heron wading, a crow in the pine, eleven of them), each liking what one kind of town listener likes, and nobody pays. Instead, now and then an animal that liked your playing leaves a keepsake in your case: always one after your first set there, then about one good set in four. There are twenty-two to find, two from each animal. Birds sing on the map, quietly, made live like the rest of the game's sound. The keys are shown on the first set's waiting screen, and again on the pause card (Esc); the try-out pages (`?studio`, `?place=`, `?bot=`), which skip the map, keep a small press-any-key card. Four kinds walk by, joggers, elders, students and commuters, each with their own taste, and six different people of each kind. Repeating yourself bores them, off-key notes on strong beats make them frown, and an earlier idea brought back changed earns a coin. The band gains layers as the crowd grows. The coins you earn are saved, and between sets a music shop (also a fourth stop on the map, between the park and the station: choose it and press Enter) sells five pedals, which you stomp on keys 2 to 6 while you play, four more instruments, and a loop pedal: R records 4 bars of your notes that play on under you, up to three layers, and Backspace takes the last one off. Home, the sixth stop on the map (the house at the west end of the street in its bottom left; choose it and press Enter), opens your room: the keepsakes you've found sit on a shelf there (point at one for its story, or at an empty cubby for a hint about who brings it), and Enter puts one in your case or takes it out, where up to three ride in the lid wherever you busk. The studio is free from the start: the desk in your room opens it, as does the Studio button on the end card. In it you make your own beats to busk to the way Figure makes them: pick a rhythm, hold the pad, and it's written into the loop as it goes round. Each part has a choice of sounds, eight drum kits (lo-fi, brushes, funk, reggae, 808, hand drums, house and rock), seven basses and nine chord sounds, and the sound key steps through them (its left end back, its right end on). It comes with five ready-made beats (lo-fi, bossa nova, funk, reggae and a slow ballad), keeps six of your own (Save names one), and "Busk to this" picks the beat your sets play and takes you to the map. A "map" key in its bottom left corner (or Esc) goes back to the map, or "room" back to your room if you came from its desk. The design spec is `docs/superpowers/specs/2026-09-28-open-case-design.md`, the shop's is `docs/superpowers/specs/2026-09-28-open-case-shop-design.md`, the loop pedal's is `docs/superpowers/specs/2026-09-29-open-case-loop-pedal-design.md`, the passers-by's is `docs/superpowers/specs/2026-09-29-open-case-passers-by-design.md`, the studio's is `docs/superpowers/specs/2026-09-30-open-case-studio-design.md`, the places' and the map's is `docs/superpowers/specs/2026-10-01-open-case-places-design.md`, and One Tree Island's and the keepsakes' is `docs/superpowers/specs/2026-10-02-open-case-island-design.md`.

- Tests (Node 22, no dependencies): `cd open-case && npm test`. The headline test plays a scripted honest set against a random bot and a lick bot over ten seeds, another checks that every place pays an honest set about the same, and another that the island leaves the honest set a keepsake about one time in four over 200 seeds, and the bots almost never. The art tests check the committed sprite sheet and map against what the game draws.
- Debug:
  - `?sound` is the sound check: the band with a switch per layer and a choice of the ready-made beats, and every instrument and pedal in the shop to try on the keys, the loop pedal too.
  - `?debug` shows each listener's interest and the last rule they heard, and a corner panel with the audio delay. On the end card it adds Run the bots and the test log.
  - `?seed=N` fixes the passers-by (or the island's animals), the station's trains, and the park's windows, train and birds.
  - `?bot=random` or `?bot=lick` plays a whole set by itself. A keepsake one leaves on the island shows, but isn't yours.
  - `?sky=N` shows the place as it is N bars into a set (until a set starts), to check the sunset, the station's clock, the market's lanterns or the island's sunrise without playing three minutes.
  - `?coins=N` sets your savings to N on that page, to try the shop. Nothing done on it is kept or logged, beats made in the studio included.
  - `?beat=lofi` (or `bossa`, `funk`, `reggae`, `ballad`) makes every set play that ready-made beat.
  - `?place=park` (or `station`, `market`, `island`) makes every set happen there, with no map, and isn't kept.
  - `?studio` opens the studio on the first key, to try it without the map. Like `?coins=N`, nothing done on it is kept or logged.
  - `?keepsakes=all` (or `?keepsakes=N`) gives that page all 22 keepsakes (or the first N), the first three in your case, to try your room and the case's lid. Like `?coins=N`, nothing done on it is kept or logged.
- Tuning: the rules, the crowd, the tips and the feel are in `open-case/src/tuning.js`, and so are each place's crowd (`PLACES`), the park's sunset and background timings (`PARK`), the station's clock and trains (`STATION`), the night market's lanterns (`MARKET`), One Tree Island's sunrise and where its animals cross and settle (`ISLAND`), the keepsakes' odds and how many your case holds (`KEEPSAKE`), and the shop's prices and pedal keys (`SHOP`), the loop pedal's length, layers and allowance for early notes (`LOOP`), and the studio's slots, undo and timing (`STUDIO`). The beats themselves (the five ready-made ones, the keys, the chords and the sounds each part can have) are in `open-case/src/beats.js`, and the studio's rhythms in `rhythms.js`. The sounds (the band, each instrument and each pedal, the loop's level and the safety before the speakers) are in `open-case/src/audio.js`, and a few view timings are in `scene.js` and `render.js`.
- Art: flat colour, no outlines, no dithering, the look Nathan picked from a reference picture. The game draws from one sprite sheet, `open-case/assets/sprites.png`, with its frame and layout data in `sprites.json`. `art/open-case/sprites.lua` writes both from the shared drawing code: `draw.lua` (the park, you and your things), `figures.lua` (the passers-by, six people of each kind drawn from parts, their reactions, the pigeons and the birds), `gear.lua` (you with each instrument, your pedals and the loop pedal, the amp and the gear strip's icons), `shop.lua` (the music shop), `station.lua` (the station: its hall, the train and the platform) and `market.lua` (the night market: its stalls, lanterns, brick street and cat), `island.lua` (One Tree Island at sunrise: the far shore, the lake, the mist, the fish, the island and its pine), `animals.lua` (its eleven animals, crossing, settled and keeping the beat), `keepsakes.lua` (the twenty-two keepsakes, for the shelf and the case's lid) and `room.lua` (your room). `palette.lua` holds every colour, at most 64. The style sample and the tab icon have scripts there too. Rebuild everything from the repo root (it's deterministic: an unchanged script rebuilds its files byte for byte):

  ```sh
  for s in sprites icon style-sample; do /Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/$s.lua; done
  ```

  The style sample writes `art/open-case/preview-style.png` and `preview-oldman.gif`. `lineup.lua` writes `art/open-case/preview-lineup.png`, every passer-by standing and walking, to check the people by eye. Previews aren't committed.
- The map: painted, not flat, after Nathan's reference, a friend's atlas of lush pixel worlds. The land is 960x540, shown at twice its size, with the places, the city and the bridges drawn on it as pictures at twice its detail. `art/open-case/map/land.py` paints the land and `places.py` draws the pictures and writes `map.json` (where each goes); both share `layout.py`, the lie of the land. They need Python 3 with Pillow, are deterministic, and write `open-case/assets/map/` (under 500 KB). Rebuild from the repo root:

  ```sh
  python3 art/open-case/map/land.py && python3 art/open-case/map/places.py
  ```
