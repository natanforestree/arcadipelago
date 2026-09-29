# Arcadipelago

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

`open-case/` is a busking game, a work in progress. You improvise on the computer keyboard, laid out like GarageBand's Musical Typing, over a lo-fi loop, and passers-by stop, stay and tip according to what you play. Repeating yourself bores them, off-key notes on strong beats make them frown, and an earlier idea brought back changed earns a coin. The band gains layers as the crowd grows. The design spec is `docs/superpowers/specs/2026-09-28-open-case-design.md`.

- Tests (Node 22, no dependencies): `cd open-case && npm test`. The headline test plays a scripted honest set against a random bot and a lick bot over ten seeds. The art tests check the committed sprite sheet against what the game draws.
- Debug:
  - `?sound` is the sound check: the loop with a switch per layer, and the guitar on the keys.
  - `?debug` shows each listener's interest and the last rule they heard, and a corner panel with the audio delay. On the end card it adds Run the bots and the test log.
  - `?seed=N` fixes the passers-by, and the park's windows, train and birds.
  - `?bot=random` or `?bot=lick` plays a whole set by itself.
  - `?sky=N` shows the park as it is N bars into a set (until a set starts), to check the sunset without playing three minutes.
- Tuning: the rules, the crowd, the tips and the feel are in `open-case/src/tuning.js`, and so are the park's sunset and background timings (`PARK`); the synth's voicing is in `open-case/src/audio.js`, and a few view timings are in `scene.js` and `render.js`.
- Art: flat colour, no outlines, no dithering, the look Nathan picked from a reference picture. The game draws from one sprite sheet, `open-case/assets/sprites.png`, with its frame and layout data in `sprites.json`. `art/open-case/sprites.lua` writes both from the shared drawing code: `draw.lua` (the park, you and your things) and `figures.lua` (the passers-by, their reactions, the pigeons and the birds). `palette.lua` holds every colour, at most 64. The style sample and the tab icon have scripts there too. Rebuild everything from the repo root (it's deterministic: an unchanged script rebuilds its files byte for byte):

  ```sh
  for s in sprites icon style-sample; do /Applications/Aseprite.app/Contents/MacOS/aseprite -b --script art/open-case/$s.lua; done
  ```

  The style sample writes `art/open-case/preview-style.png` and `preview-oldman.gif`. Previews aren't committed.
