# Open Case: places to busk (design spec)

**Date:** 2026-10-01
**Status:** Nathan agreed the design in chat and on a mockup page (claude.ai/artifact/9pVRougZNC138ZQ9yVUJEx), the map after several rounds ("yeah that looks much better, the only think i would change is make the station a little smaller"), then asked for the plan ("go ahead and write the plan and then pause"). Built from `docs/superpowers/plans/2026-10-01-open-case-places.md`.

It started with Nathan: "can we now add some new places to busk?" Every set so far is in the park at sunset. Now there are three places, each with its own scene and its own crowd. You choose the place and the track on a map of the city before each set.

## Decisions

| Topic | Decision |
|---|---|
| What a place changes | **Its own crowd** (Nathan's choice over "just the scenery" or "unlocked as you progress"): who comes by, how they arrive, how long they listen and stay, and how they tip. What each kind of person likes stays the same everywhere. |
| The new places | **The station at rush hour and the night market** (Nathan's picks from four; the seaside pier and the subway underpass were the others). The park stays as it is. |
| Different, not better | An honest set earns about the same anywhere (within 20% of the park), and random playing earns almost nothing anywhere. Each place suits a style: the station rewards catchy ideas that grab people fast, the market relaxed and spacious playing over a long stretch, and the park sits in between. |
| Choosing | **Free, on a map, before each set** (Nathan: "once you load into the game the first things that should show are where do you want to go busk and what track do you want to play to"). |
| Tracks | **All five ready-made tracks are free from the start** (Nathan's choice). The studio, still 150 coins, is for making your own, which join the list. |
| The map's look | **Like Nathan's reference** (his friend's atlas at maxwell-thom.github.io/llm-sandbox), but a modern city. It's a big painted world you see part of, with small, detailed places on it, dark labels with a square bullet, and a minimap. |
| Over the map | Only the title, **"Where to busk?"** (Nathan asked to remove the clock, the icon and the line above the title). The track you'll play sits at the top right. |
| Bridges | **Classic bridges seen from the side** (Nathan: "more like the golden gate bridge"): a red suspension bridge for the road and arched steel spans for the railway. Nothing crosses water any other way. |
| The city | **The first cluster's style, spread over the land** between the park, the station and the village (Nathan liked the loose cluster of towers and asked for more of it, not a street grid). The station is a little smaller than in the first mockups. |
| Each place's ground | **Its own** (Nathan: "they all have the same gray brick for the floor"). The park keeps its path, the station gets a pale stone platform, and the market warm brick. |
| "They remember" | The label over the strip of remembered ideas was removed and is already live (main 739f079: "its ominous lol"). |

## The start screens

- **The title card stays** as it is. A key dismisses it and turns the sound on.
- **Then the map: "Where to busk?"**
  - The map fills the screen. The view glides to the place that's chosen, which gets a gold pin and a gold label.
  - Left and right step between the three places, in the order park, station, market. The mouse can click a place or its label.
  - Each label has a line about the place's crowd:
    - **The Park:** "A bit of everyone · sunset";
    - **The Station:** "Rush hour · in a hurry, tips well";
    - **The Night Market:** "Browsers stay long · small coins".
  - The track you'll play is shown at the top right, with its tempo and key.
  - A minimap at the bottom left shows the whole world, where you're looking, and the three places.
  - The bottom right says "← → choose a place · enter to go".
- **Enter opens "What track?"** in a panel where the track chip was.
  - It lists the five ready-made tracks, then your own tracks if you have the studio, each with its tempo and key.
  - Up and down choose. The track you're on plays softly, as the shop's loop pedal try does.
  - Enter goes to the place, and Esc goes back to the map. The mouse can click a track, and a second click on the chosen one goes.
- **At the place,** the scene waits for your first note, as the park does today. It says "busking to" and the track's name over "play a note to start the set".
- **Your last place and track are remembered.** Next time they're already chosen, so Enter twice plays again. The place is kept under `open-case-place`, and the track as the studio keeps its chosen beat today.
- **Between sets,** these all lead to the map with your last answers chosen:
  - the end card's Another set;
  - leaving the shop;
  - leaving the studio by Esc.
- **The studio's Busk to this** chooses its track and leads to the map. Enter on a place then goes straight to it, without the track panel.
- **The bots** (`?bot=`) skip the map and play at the chosen place.

## The map

**What's on it.** A region about one and a half screens across each way:
- the sea and its beaches to the west;
- hills of pines with cliffs to the north;
- a lake with islands and a waterfall in the north-east;
- a river from the lake, running north to south through town and out into the bay;
- patchwork farm fields to the south-east, forests, roads, footpaths and a railway.

The places and the other settlements are drawn on it:
- **The Park:** a ring of trees round a striped lawn, a pond, a bandstand, lamps, benches and people strolling.
- **The Station:** a glass train shed on iron ribs with a brick front and arched windows, a clock tower, a train at the platform, and a limestone forecourt with a fountain and taxis.
- **The Night Market:** striped stalls under lantern strings on warm brick, steam from a noodle stall, people browsing, old townhouses behind and a boardwalk along the water. It stands where the river meets the bay.
- **The city:** loose clusters of buildings on patches of paving across the land between the park, the station and the village. There are glass and stone towers round the station, flats spreading out from there and smaller houses at the edges, with trees in the gaps and the roads running through.
- **Scenery without a label:** a village with a church, two suburbs, a farm with a silo, a lighthouse, a marina, and two drifting clouds with their shadows.
- **The bridges:** the road crosses the river on a red suspension bridge, and the railway just upstream on two arched steel spans.

**How it's made.** Like the reference, it's painted rather than drawn in the game's flat style.
- The land is 960 × 540 pixels, in its own richer colours, shown at twice that size.
- The places and settlements are separate pictures with twice the land's detail, laid on top, as the reference does its towns.
- The screen shows about two thirds of the world each way. The view centres on the chosen place, kept inside the world's edges.
- The labels, title, panel and minimap are drawn over it in Pixelify Sans, the reference's rounded pixel font, from Google Fonts like Silkscreen.
- The whole map is scaled to fit the window, as the game's canvas is.

**What moves.** Two things: the clouds drift slowly with their shadows, and the gold pin bobs. Both stay still when the page asks for reduced motion. The train, boats and smoke can come later.

**Its art** is made by scripts, like the sprite sheet, but in Python with Pillow. The reference's look needs blending and shading that the Lua kit doesn't do.
- `art/open-case/map/land.py` paints the land.
- `art/open-case/map/places.py` draws the places, settlements, bridges, clouds and city.
- Together they write `open-case/assets/map/`:
  - `land.png`;
  - a picture per place, settlement, bridge and cloud;
  - `city.png`;
  - `map.json`, which holds where each picture goes, the places' pins and labels, and the city's outline.
- They're deterministic: an unchanged script writes the same bytes.
- The land script checks that no road, path or railway crosses water except on a bridge.
- The map's files stay under 500 KB in all, and they're loaded when the map first opens.

## The places and their crowds

The kinds of people and what they like don't change. The joggers like busy bars, the old folk space, the students groove, and the commuters only care about phrases and callbacks. Each place sets the numbers below, kept in `tuning.js` as a `PLACES` table. These are starting values, tuned with the bots until the balance holds.

| | **Park** | **Station at rush hour** | **Night market** |
|---|---|---|---|
| Who comes by | all four kinds evenly (today's draw) | commuters 60%, students 25%, old folk 15%, no joggers | old folk 40%, students 40%, commuters 20%, no joggers |
| How they arrive | one every 6–10 s (today) | in waves: a train pulls in every 28–34 s and 3–5 people come along the platform over about 3 s; between trains one every 14–20 s | one every 4–7 s, a steady stream |
| At most on screen | 6 (today) | 8, for the waves | 6 |
| Walking pace | as today | 15% faster | 30% slower, browsing |
| How long they listen before deciding | as today | 0.7 × | 1.5 × |
| How long they stay | 60–180 s (today) | 40–100 s | 90–240 s |
| Tips: callback · happy (old folk) · end | 1 · 2 (3) · 1 (today) | 1 · 3 (4) · 1 | 1 · 1 (2) · 1 |

- **The park's numbers are today's.** With them, every set, bot score and test comes out exactly as it does now. The station's and market's choice of kind uses the same draw from the crowd's stream, read against their own weights.
- **The listeners stand in the same arc** everywhere, and you, the case and the path are where they are now. Only the picture round them changes.

## The scenes

Each scene is laid out round today's positions: you on your crate, the path the people walk, the listeners' arc, and where coins land. Each also has its own life over the set, as the park has its sunset.

**The station at rush hour** (5:30 to 6:30 pm over the set):
- an iron-and-glass roof showing the sky's stages, darkening through the set as the park's sky does;
- a brick wall with three tall arched windows onto the city;
- the far platform and the track;
- iron pillars, two lit globe lamps and a bench.

What changes over the set:
- **The trains:** a teal commuter train pulls in, stands with its doors open, and pulls out. Each arrival is the wave in the crowd table, so people come along the platform as the doors open.
- **The departure board** loses its top row as each train leaves.
- **The clock's hands** move from 5:30 to 6:30.

The platform is pale stone slabs with a yellow line at its edge. The pigeons stay, since stations have pigeons, and a loud note still scatters them.

**The night market** (from blue hour into night):
- night sky with stars, and a skyline with a few lit windows;
- a noodle stall with a red-and-cream awning, a cook, a steaming pot and bowls;
- a fruit and lantern stall with a teal awning and its seller;
- three strings of lanterns over the street.

What changes over the set:
- **The lanterns** light one by one across the set, as the park's windows do.
- **The steam** puffs and drifts up.

The street is warm red brick, brighter in pools under the lanterns. In the pigeons' place, a black-and-white cat sleeps by your case. A loud note wakes it and it trots off, then comes back a few bars later, as the pigeons do.

**The bottom readout** (the octave and the bar count) gets a dark backing, so it reads on the station's light floor and anywhere else.

**Their art** goes in the sprite sheet like the park's, from `art/open-case/station.lua` and `art/open-case/market.lua` called by `sprites.lua`, in the flat style and its palette. A few colours are added for the stone and the brick. The sheet stays within 64 colours and under 400 KB.

## In a set

- The place sets the crowd's numbers and the scene. Everything else plays as today: the band, the rules, the loop pedal, your gear, the end card.
- The end card names the place: "at the station".
- The log notes each set's place.

## For checking

- **`?place=`** with `park`, `station` or `market` chooses that place for the page, the way `?beat=` fixes the track. It isn't remembered.
- **`?sky=N`** shows any place as it is N bars into a set: the station's clock and trains, the market's lanterns.
- **`?bot=`** plays at the chosen place.
- **`?coins=` and `?studio`** keep nothing, including the place.

## How it's built

- **`places.js` (new, pure):**
  - the three places: their names, label lines and crowd numbers, read from `tuning.js`;
  - loading and saving the chosen place through `storage.js`, ignoring bad values.
- **`atlas.js` (new, pure):** the map's state and moves.
  - which place is chosen and whether the track panel is open;
  - the track list: the five ready-made tracks, then your slots;
  - moving and choosing, and what a click lands on;
  - where the view is centred.

  It's tested in Node, like `studio.js`.
- **`atlasview.js` (new):** builds the map from `assets/map/` as page elements over the canvas, the way the end card is: the land and pictures, the labels, the pin, the panel and the minimap. It updates them from `atlas.js`.
- **`crowd.js`:** takes a place's numbers: the kinds' weights, the arrival pattern with its waves, the pace, patience and stay, the most on screen and the tips. With the park's, it draws exactly as today.
- **`scene.js`:** each place's life, kept pure:
  - the station's train timetable, taken from the crowd's waves so they agree, its clock and its board;
  - the market's lanterns, its steam and the cat (asleep, scared off, coming back).
- **`render.js`:** draws the place's scene (the park as today, the station, the market) and the readout's backing.
- **`main.js`:**
  - a `map` screen between the title and `ready`;
  - Another set, the shop's exit, the studio's Esc and Busk to this lead to it;
  - the track panel's soft preview;
  - `?place=`;
  - each set uses the chosen place and track.
- **`studio.js`:** the chosen beat can be a ready-made one without the studio.
- **`set.js` / `log.js`:** the set's place, for the end card and the log.
- **`index.html`:** the map's container and the Pixelify Sans font.
- **Art:**
  - `art/open-case/map/` (Python and Pillow) writes `open-case/assets/map/`;
  - `station.lua` and `market.lua` add the scenes to the sheet.
- **README:** the places, the map, how to rebuild the map's art (`python3 art/open-case/map/land.py && python3 art/open-case/map/places.py`), and `?place=`.

## Tests

- **The park is today's:** with the park's numbers, every existing crowd, listen, set, bot and render test passes unchanged and gives the same numbers.
- **Each place's crowd:**
  - **the station:** arrivals bunch just after each train, and no joggers come;
  - **the market:** arrivals come steadily;
  - **both:** pace, patience, stays and tips follow the table.
- **The balance:** over seeds 1–10, with the bots:
  - the honest set earns within 20% of the park's at the station and at the market;
  - random playing earns almost nothing at each;
  - honest playing still beats random and the lick bot at each place by a wide margin.
- **The map's state:**
  - left and right move through the places;
  - the panel opens and closes;
  - the track list always has the five ready-made tracks, and your slots only with the studio;
  - clicks land on the right place or track;
  - the chosen place and track survive a reload, and bad stored values are ignored.
- **The flow:**
  - the title leads to the map, the map to the track panel, and the panel to the place;
  - Another set, the shop, the studio and Busk to this come back to the map with the last answers chosen;
  - Busk to this skips the panel.
- **The scenes:**
  - the station's clock reads 5:30 at the start and 6:30 at the end;
  - its trains arrive when the crowd's waves do;
  - the market's lanterns light in order across the set;
  - the cat scatters at a loud note and comes back after the set number of bars;
  - each place draws without error at every stage of its evening.
- **The art:**
  - the sheet has the new scenes' frames, within 64 colours and under 400 KB;
  - the map's files are all there, `map.json` names every picture, and they total under 500 KB.
- **By eye and ear, in Chrome:**
  - the map at each place, with the panel;
  - a set at each place;
  - the station's trains and the waves of people;
  - the market's cat.

## How we'll know it works

Nathan opens the game, sees the city, picks the station and a track, and busks to a hurried crowd that comes in waves with each train. Next time he picks the market and plays to slow browsers who stay. Honest playing earns about the same in each, but each feels different.

## What the mockups settled

- **The map took five rounds:**
  - a flat town map in the game's palette ("not really into it");
  - a slanted city map;
  - one closer to the reference ("looking better");
  - a bigger world with small places ("looking much better");
  - a corrected one: bridges where roads crossed water, the market moved off the river, each place given its own ground, and classic bridges.
- **The city:**
  - a street grid was tried and dropped ("i liked the way the city looked before... just wanted you to... expand it");
  - the station was made smaller.
- **The track list** opens in a panel over the map, replacing the first mockup's choice between two screens and one.
- **Over the map:** the clock chip, the title icon and the line above the title were removed.
- **The scenes:** the station's platform became pale stone and the market's street warm brick. The market's cat became black and white so it shows on the brick.

## What the build settled

- **The station's trains** come every 32–38 s, with someone every 16–22 s between them (the table started at 28–34 and 14–20). With those, over seeds 1–10 the honest set earns 629 in the park, 722 at the station and 674 at the market; random playing earns 5, 11 and 7; the lick bot nothing anywhere.
- **The trains come from the crowd:** the crowd works out each set's train timetable from its own stream, and the scene reads it, so a train always stands with its doors open as its passengers step off.
- **On the map:**
  - left and right go round, from the market back to the park;
  - Space works as Enter;
  - the track you're on plays every part of it, softly (`audio.previewBand`), not just the chords as in the shop;
  - the tempo and key are in Silkscreen capitals, since Pixelify's small "C" reads as a 0, and its "fi" ligature is turned off ("Lo-fi" read "Lo-A");
  - the minimap says "the city" and which place of the three you're on.
- **`?place=`** skips the map: every set on that page is at that place.
- **Dark backings:** besides the bottom line's words and the gear strip (leaving the pigeons and the cat beside them clear), the waiting prompt has one too, so it reads over the station's lamps and the market's lanterns.
- **The shop** says "back to the map" on its sign and card, since that's where Esc and the door now go.
- **The art:** six colours join the palette for the station's stone and the market's brick, 55 in all, and the sheet has 583 frames (under 100 KB). The map's files come to 445 KB, its land alone 313 KB.

## Later

On 2026-10-01, after it went live, Nathan asked for the game to open on the map rather than the title card ("it just doesn't flow well or make sense"). So the game now opens on the map, and the sound starts on its first key or click. The title card is left only for the pages that skip the map (`?studio`, `?place=`, `?bot=`), and it shows just the name and "press any key". The key chart moved to the waiting screen of the first set of each visit, and the pause card lists the keys. The minimap and the compass were removed from the map.

## Not in this change

- More places. The lighthouse, the marina and the village are scenery for now.
- New kinds of people, and sounds of a place (a station's announcements, a market's chatter).
- Unlocking places, and dragging or zooming the map.
- Moving trains, boats and smoke on the map.
- The regulars, which are still their own spec.
