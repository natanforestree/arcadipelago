# Open Case: One Tree Island and keepsakes (design spec)

**Date:** 2026-10-02
**Status:** Nathan agreed the design in chat, one part at a time ("yes that looks right"). The spec is awaiting his review.

It started with Nathan: "it would be really fun to add a wonky silly place to go busk, like you go play on the island with the tree by yourself, no people, just a peaceful landscape surrounded by water and the one tree maybe some animals." He wasn't sure the island should pay, and was "open to ideas to things you maybe unlock there like trinkets or cosmetic things."

So the little island in the map's lake becomes a fourth place to busk. Animals come instead of people, and nobody pays. Instead, now and then, an animal that liked your playing leaves a keepsake in your case. You collect keepsakes on a shelf in your room at home, and you can show up to three of them off in your case's lid wherever you busk.

## Decisions

| Topic | Decision |
|---|---|
| What the island gives | **Keepsakes, not coins** (Nathan liked it: "i like your keepsakes idea, and showing them off"). It's the one place nobody pays, which is what makes it feel different. |
| How rare | **The first island set always gives one, an ordinary one** "just to show the user that they can get a trinket from the animals". **After that, keepsakes are rare** (Nathan: "after that first set there it should be pretty rare"): **about 1 in 4 good sets** (his pick over 1 in 8 and 1 in 2). |
| The set | **A set like the other places', at sunrise** (his pick over playing for as long as you like). It's the same length, band and tracks, and the dawn mist lifts over the set. |
| The animals | **Eleven:** the fox, bunny and crow (Nathan's picks), plus the heron, ducks, frog and turtle from the water and the owl, squirrel, hedgehog and deer from the land. Each likes what one kind of town listener likes. A handful come each set. |
| Where keepsakes show | **A shelf at Home and on your case** (his picks). Wearing them and a big end-card moment were left out. |
| The shelf | **Home opens your room** (his pick over a shelf key inside the studio): the shelf is on the wall and the studio is on a desk. |
| The name | **One Tree Island** ("keep the name"). |

## On the map

- **The island is a fourth place to busk.** It's the smaller of the two islands in the lake, the one with a single pine.
  - The map's stops, left to right with the arrow keys, go: the park, the station, the night market, One Tree Island, the music shop, and home.
- **On the map:**
  - its label reads **"One Tree Island"**, over **"Just you and the animals · no coins"**;
  - a tiny rowboat is pulled up on its shore (a new picture from `places.py`, laid over the land as the other places are);
  - its pin, label and view go into `map.json` like the other places'.
- **Choosing it works as at any place.** Enter opens the track panel, any track works, and the studio's Busk to this skips the panel.
- **Home's label** changes to "your studio · your keepsakes".

## A set on the island

- **The set** is the same length as anywhere else, with the same band and track, and the same rules for what the ears notice.
  - Your gear, your instrument and the loop pedal work as they do in town.
  - The band's layers follow the size of the crowd of animals, as they follow the people in town.
- **The scene: sunrise over the lake,** over the same PARK.bars as the park's evening:
  - **The sky** starts in the deep blue before dawn, turns pink and gold, and ends in a clear morning blue.
  - **The sun** comes up over the far shore's pines.
  - **The dawn mist** lies in bands on the water and thins out over the set, gone by about two thirds of the way through.
  - **The water** is all round, with glints.
  - **The island** barely fits you: you sit on your crate squeezed under the one pine, with your case at your feet and the rowboat tied up beside you. This is the wonky part.
  - **In the pigeons' place, a fish jumps** at a loud note, and doesn't jump again for PARK.pigeonsAway bars, the way the pigeons stay away.
- **No city sounds.** The map's birds (`audio.birds`) sing softly through the whole set, like a dawn chorus.
- **No coins.**
  - The animals' tips are counted as their fondness for you, using the park's numbers, but nothing lands in the case and nothing goes to your savings.
  - The fondness sets the keepsake's odds (below).
- **The end card:**
  - names the animal that stayed longest ("The heron stayed longest: 94 seconds.");
  - in place of the coins line, says what you were left ("The crow left you a bottle cap.");
  - leaves that line out when nothing came;
  - names the place: "on One Tree Island".

## The animals

Animals take the people's place, and the crowd's rules are unchanged. Each animal stands for one of the four kinds of town listener, likes what that kind likes, and listens, gets hooked, settles in, and leaves bored or happy by the same rules and numbers.

| Kind (what it likes) | Animals |
|---|---|
| jogger (busy playing) | bunny, ducks, squirrel |
| elder (space and long notes) | heron, turtle, deer |
| student (the groove) | fox, frog, hedgehog |
| commuter (catchy phrases and callbacks) | crow, owl |

**Who comes.**
- The crowd draws each arrival's kind exactly as it does for people.
- The animal is dealt from that kind's animals, the way a person's look is dealt from their kind's looks, from the looks' own stream.
- If every animal of the kind is already on screen, a second of one comes (two crows is fine).
- The ducks are one visitor: a mother duck with three ducklings in a row.

**The island's numbers** (`PLACES.island` in `tuning.js`; starting values, tuned with the bots):
- every kind is equally likely, as in the park;
- one animal every 10 to 16 seconds, so a handful come each set;
- at most 6 on screen;
- the park's pace, patience and stays;
- the park's tips, counted as fondness.

**How they pass by.** Like people on the path, each animal comes in from one side and passes across the screen within earshot, so it can hear you and get hooked. Each crosses in its own way:
- **The water:**
  - the ducks paddle across in front of the island;
  - the heron wades;
  - the deer swims with just its head up;
  - the turtle swims;
  - the frog hops from lily pad to lily pad.
- **The sky:** the crow and the owl fly across.
- **The land animals float over, which is the silly part:**
  - the fox paddles a log;
  - the bunny rides a big leaf;
  - the squirrel rides a floating branch;
  - the hedgehog floats by curled up in a ball.

**Where they settle when hooked.** Each goes to the nearest free spot of its own sort. If none is free, it passes by, as a person does when the arc is full. The island has nine spots:
- **three in the pine**, for the crow, the owl and the squirrel;
- **two on the grass** either side of you, for the fox, the bunny and the hedgehog;
- **four in the water:**
  - the shallows, for the heron, the deer and the ducks;
  - a rock, for the turtle, which takes the nearest free spot if the rock is taken;
  - a lily pad, for the frog.

**Settled animals** keep the beat in their own way, as hooked people nod:
- the frog bobs;
- the fox's tail sways;
- the ducks bob;
- the bunny's ears twitch;
- the heron dips its head;
- the owl blinks;
- the crow, the squirrel, the turtle, the deer and the hedgehog each have a small two-frame move of their own.

The reaction bubbles show over animals as they do over people. Leaving, an animal goes on its way across the screen, as people do.

## Keepsakes

**Twenty-two, two per animal:** an ordinary one, then a special one. An animal always brings its ordinary keepsake before its special one.

| Animal | Ordinary | Special |
|---|---|---|
| Bunny | dandelion clock | four-leaf clover |
| Ducks | white feather | rubber duck |
| Squirrel | acorn | golden acorn |
| Heron | smooth pebble | fish skeleton |
| Turtle | snail shell | tiny teacup |
| Deer | wildflower | little bell |
| Fox | blackberry | odd sock |
| Frog | water lily | tiny crown |
| Hedgehog | crunchy leaf | tiny apple |
| Crow | bottle cap | gold ring |
| Owl | speckled feather | tiny spectacles |

Each keepsake has a short line for the shelf, e.g. "Odd sock: the fox won't say whose it was." The lines are written in `keepsakes.js` with the list.

**When one comes.** It comes at the end of a set on the island, so a set left before its end (by closing the page) gives nothing.
- **While you have no keepsakes, the set always gives one.** It's the ordinary keepsake of the animal that stayed longest, or, if no animal ever settled, of the first animal that came by.
- **After that, it's a chance.**
  - The chance rises with the set's fondness, up to a cap, and is nothing when no animal was won over.
  - The numbers (`KEEPSAKE` in `tuning.js`) are tuned with the bots over seeds 1 to 200, with a keepsake already found:
    - the honest bot is left a keepsake in 20% to 30% of sets (about 1 in 4);
    - the random bot in under 5%;
    - the lick bot in about none.
  - The roll comes from its own stream (the set's seed mixed with a constant), so it never moves the crowd's draws, and a set replays exactly.
- **Which one.**
  - The animal is the one that stayed longest among the set's fans that still have something to give. A fan is an animal that left happy or was still there at the end.
  - It gives its next keepsake: the ordinary one first, then the special one.
  - If no fan has anything left, nothing comes.
- **At most one a set, and never one you already have.** Once all 22 are found, the animals still come but leave nothing.

**How it arrives.** At the set's end, as the band fades, the keepsake drops into your case with a sparkle. The end card names it.

**They're kept for good,** in storage under `open-case-keepsakes`: which you've found, in the order found, and which are in your case.
- Bad or unknown stored values are ignored.
- The pages that keep nothing (`?coins=`, `?studio`) and the bots' sets still show a keepsake arriving, but never add one to your shelf. The same goes for coins on those pages today.

## Your room

**Home opens your room** instead of the studio. It's a small pixel room in the flat style, drawn on the canvas as the shop is:
- a wooden floor and a wall;
- a window onto a morning sky;
- **the shelf** on the wall;
- **a desk with your studio** (a groovebox) on it;
- a raised **◀ MAP** key in the corner, the same key as the studio's.

The map's birds sing softly through the window.

**The shelf:**
- **The cubbies:** one column per animal, eleven in all, with the ordinary keepsake on the top row and the special one below, so 22 cubbies. Above it, the count: **"2 of 22"**.
- **A found keepsake** shows in its cubby. Pointing at it shows its name and line under the shelf, e.g. "Odd sock: the fox won't say whose it was."
- **A missing one** is a faint outline. Pointing at it gives a hint naming the animal and what it likes, e.g. "Something from the fox · the fox likes the groove." So the shelf also teaches what each animal likes.
- **Keepsakes in your case** carry a small gold mark.

**Keys and the mouse:**
- **The arrow keys** move the pointer through the cubbies and onto the desk. **The mouse** points by hovering.
- **Enter, Space or a click** on a found keepsake puts it in your case, or takes it out if it's in. On a missing one, they do nothing.
- **Enter, Space or a click on the desk** opens the studio.
- **Esc or the ◀ MAP key** goes back to the map.

**Your case holds three.**
- Putting in a fourth is refused, and "your case holds three, take one off first" shows under the shelf for two seconds.
- **Your very first keepsake goes into your case by itself,** so your next set shows what the case is for.

**The studio from your room:**
- Its corner key reads **◀ ROOM**, and it and Esc go back to your room.
- Opened from the end card's Studio button, the key still reads **◀ MAP** and goes to the map.
- Busk to this goes to the map in both cases, as now.

## Your case in every set

At the park, the station, the night market and the island, your open case shows your chosen keepsakes in its lid:
- tiny versions, about 6 × 6 pixels, at three set points on the lid's red lining, in the order you put them in;
- coins still land in the case's body below them.

They're only for looks, and the crowd doesn't notice them, just as your gear only changes the sound.

## For checking

- **`?place=island`** busks on the island, skipping the map.
- **`?sky=N`** shows the island as it is N bars into the sunrise.
- **`?keepsakes=all` or `?keepsakes=N`** gives the page all 22, or the first N in the table's order. The first three go in your case. It keeps nothing, like `?coins=`.
- **`?bot=`** plays on the island too, and keeps no keepsakes.
- **The log** notes an island set's place and the keepsake it gave, if any.

## How it's built

- **`places.js`:**
  - `'island'` joins `PLACE_IDS`, after the market;
  - `PLACE_WORDS.island` is `{ name: 'One Tree Island', at: 'on One Tree Island', crowd: 'Just you and the animals · no coins' }`;
  - Home's `about` becomes "your studio · your keepsakes".
- **`tuning.js`:**
  - `PLACES.island`, whose `coins: false` makes its tips count as fondness;
  - `ISLAND`, the sunrise's numbers (sky stages, the sun, the mist, the fish);
  - `KEEPSAKE`, the odds.
- **`animals.js` (new, pure):** the eleven animals, each with its kind, how it crosses (water, sky or floating), its sort of spot, and its name for the end card ("the heron", "the ducks").
- **`keepsakes.js` (new, pure):**
  - the 22 keepsakes, each with its animal, tier, name, line and hint;
  - the end-of-set rule (the first, the chance, which one);
  - loading and saving through `storage.js`;
  - the case's rules (toggling it, the limit of three, the first keepsake going in by itself).
- **`room.js` (new, pure, like `shop.js`):** the room's state, its keys and what a click or hover lands on.
- **`crowd.js`:**
  - at the island, deals an animal in place of a look;
  - chooses spots by the animal's sort from the island's nine;
  - counts tips as fondness when the place says `coins: false`.

  With the other places' numbers, every draw is exactly as today.
- **`set.js`:**
  - the island's fondness;
  - the set's fans;
  - at the end, the keepsake (from `keepsakes.js`), as an event for the screen and the end card.
- **`scene.js`:** the sunrise (pure: the sky stage, the sun's height, the mist's thinning, the fish).
- **`render.js`:**
  - the island's scene and its animals;
  - the keepsakes in the case's lid at every place;
  - the keepsake's drop and sparkle;
  - the room screen.
- **`main.js`:**
  - a `room` screen: Home opens it, Esc and ◀ MAP leave it, the desk opens the studio, and the studio's ◀ ROOM comes back to it;
  - the birds on during island sets and in the room;
  - saving keepsakes;
  - the end card's lines;
  - `?keepsakes=`.
- **`studioview.js` / `studioinput.js`:** the corner key's word (◀ ROOM or ◀ MAP) and where it leads.
- **`log.js`:** the island's keepsake.
- **Art:**
  - **In the flat style and its palette, called by `sprites.lua`:**
    - `island.lua`, the scene;
    - `animals.lua`, each animal's crossing frames in both directions, settled frames and beat frames;
    - `keepsakes.lua`, each keepsake at shelf size (up to 12 × 12), at case size (up to 6 × 6), and as an outline;
    - `room.lua`, the room, shelf, window, desk and groovebox.
  - **Limits:** the sheet stays within 64 colours and under 400 KB. The sunrise reuses the dusk sky's colours, so only a few new ones are needed, for the morning sky, the water and the mist.
  - **The map:** `places.py` gains `island()`, the rowboat, and `layout.py` gains the island's pin, label and view.
- **README:** the island, keepsakes, the room, and `?keepsakes=`.

## Tests

- **Today's places are unchanged:** every existing crowd, set, bot and render test passes as it is, and the park, station and market draw exactly as before.
- **The island's crowd:**
  - every arrival is an animal of its kind;
  - no animal of a kind repeats on screen while another of the kind is free;
  - each settles only in a spot of its own sort and passes by when none is free;
  - nothing goes to coins or savings.
- **Keepsakes:**
  - with none found, a set that reaches its end always gives the ordinary keepsake of the animal that stayed longest, or of the first that came;
  - after that, a set where no animal was won over gives nothing;
  - an animal's ordinary keepsake comes before its special one;
  - a keepsake already found never comes again;
  - at most one comes a set;
  - nothing comes once all 22 are found;
  - the same seed and notes always give the same keepsake;
  - the roll doesn't move the crowd's draws.
- **The odds,** with the bots over seeds 1 to 200 and a keepsake already found:
  - honest: 20% to 30%;
  - random: under 5%;
  - lick: about none.
- **Storage:**
  - found keepsakes and the case survive a reload;
  - bad values are ignored;
  - keep-nothing pages and bots never save one.
- **The room:**
  - the arrow keys reach every cubby and the desk;
  - toggling the case works;
  - a fourth is refused with its message;
  - a missing keepsake does nothing;
  - the first keepsake goes into the case by itself;
  - the desk opens the studio, whose ◀ ROOM comes back;
  - Esc leads to the map.
- **The scenes:**
  - the sunrise starts before dawn and ends in morning;
  - the mist is gone by its bar;
  - the fish jumps at a loud note and waits its bars;
  - the island draws without error at every stage;
  - the case draws with 0 to 3 keepsakes at every place.
- **The map:** the island is a stop after the market, its label and line are right, and `map.json` has its pin, label and view.
- **The art:**
  - the sheet has every animal's and keepsake's frames;
  - it stays within 64 colours and under 400 KB;
  - the map's files stay under 500 KB.
- **By eye and ear, in Chrome:**
  - the map's new stop;
  - a set on the island from dawn to morning, with animals crossing, settling and keeping the beat;
  - the first keepsake dropping in, then the end card;
  - the room with an empty, part-full and full shelf;
  - the case at each place.

## How we'll know it works

Nathan picks One Tree Island on the map and rows out. As the mist lifts, a duck family paddles by, the fox floats over on its log and settles on the grass beside him, its tail swaying to his groove, and a crow lands in the pine. At the end, a blackberry drops into his case. At home, it sits on his shelf, the first of 22, and in his case's lid at the park the next evening. Later island sets mostly give nothing, until one morning the crow leaves a gold ring.

## Not in this change

- Wearing keepsakes (a feather in your beanie), and a big end-card moment for a find.
- Animal sounds: croaking, honking, the owl's hoot.
- Other uses for keepsakes, or the crowd noticing them.
- Unlocking the island: it's free from the start, like the other places.
- More islands, and boats that move on the map.
