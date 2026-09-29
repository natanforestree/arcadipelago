# Open Case: passers-by who look like different people (design spec)

**Date:** 2026-09-29
**Status:** Nathan picked "same tastes, new people" and agreed the design in chat. He asked to skip a preview of the line-up ("no need to show me the lineup, go ahead and write up the spec"). This written spec is waiting for his review; the implementation plan comes after that.

Nathan: "can we add more variation with the specators? i am seeing the same thre eones over and ove and it would be nice if it seemed like actual random people walking by, also add some female characters, i think they are all male currently and its a little strange".

He's right. Four kinds of people walk by, and each kind is drawn one way. Every one of them is a man:
- the jogger: short hair, a headband, a red top;
- the old man: a flat cap, a white beard, a brown coat and a cane;
- the student: headphones, a blue hoodie, a backpack;
- the commuter: a grey suit, a red tie, a briefcase.

The first design spec chose "one colour and shape per kind" on purpose, so you could tell at a glance who wants what. This change keeps that read and makes each passer-by a person of their own.

## Decisions

| Topic | Decision |
|---|---|
| Tastes | **Unchanged** (Nathan's choice). There are still four kinds, each with its own taste, speed, patience and tip. |
| Telling kinds apart | Each kind keeps its sign: the jogger's running kit, the elder's cane and long coat, the student's headphones and backpack, the commuter's suit and briefcase. |
| People | **6 looks per kind, 3 women and 3 men**: 24 people in all. Their hair, skin and clothes differ. |
| Skin | Four tones instead of two, spread across every kind. |
| Choosing a look | From its own seeded stream, **dealt like cards**: you meet all six of a kind before any comes back (almost always), never the same one twice in a row, and never two of the same person on screen at once. |
| The rules | No kind, side, budget or arrival time changes. A set's crowd and its coins replay exactly as before from the same seed and the same notes. |
| The old man | His kind becomes **the elder** (in code, `elder` in place of `oldman`), since half of them are now women. The end card says "An old woman" or "An old man". |
| The regular | The old man in the red scarf (the Regulars spec) stays as designed. No passer-by wears a top hat or a red scarf, so he still stands out. |

## Who walks by

The intended line-up. The build may change a colour to fit the palette or to read better, as long as the rules under the table hold.

| Kind | Who | Hair | Skin | Clothes |
|---|---|---|---|---|
| Jogger | woman | high ponytail, dark brown | tan | teal top, black leggings |
| Jogger | woman | short puff, white headband | deep brown | yellow top, black shorts |
| Jogger | woman | blonde, tied back under a cap | light | rose top, grey leggings |
| Jogger | man | black, white headband (today's jogger) | light | red top, black shorts |
| Jogger | man | buzz cut | brown | blue top, grey shorts |
| Jogger | man | dark curls | tan | green top, black shorts |
| Elder | man | flat cap, white beard (today's old man) | light | brown coat |
| Elder | woman | grey bun | tan | green coat |
| Elder | woman | short white curls | deep brown | violet coat |
| Elder | man | bald, grey beard | brown | navy coat |
| Elder | woman | rose headscarf | brown | camel coat |
| Elder | man | white, clean-shaven | light | dark green coat |
| Student | man | short, black (today's student) | brown | blue hoodie, charcoal jeans |
| Student | woman | long, black | light | grey hoodie, jeans |
| Student | woman | box braids | deep brown | yellow top, denim skirt |
| Student | man | locs | deep brown | red hoodie, jeans |
| Student | woman | pink bob | tan | green jacket, jeans |
| Student | man | messy, blond | light | violet hoodie, jeans |
| Commuter | man | short, brown, red tie (today's commuter) | light | grey suit |
| Commuter | woman | black bob | brown | navy skirt suit |
| Commuter | woman | long, auburn | light | charcoal trouser suit |
| Commuter | man | black, side parting | tan | navy suit |
| Commuter | woman | bun | deep brown | camel trench coat |
| Commuter | man | close-cropped, short beard | deep brown | brown suit |

- **The same size as today.** Everyone fits the figure's box: 16 pixels across and 46 tall, feet in the same place. Nothing rises above the head's top row, so the reaction bubbles stay clear. A ponytail or bun may stick out behind.
- **Each kind keeps its sign**, drawn the same way for all six: running kit and white sneakers; a cane and a coat to the knees; headphones and a backpack; a briefcase. The jogger's run, the elder's shuffle and the others' walks don't change.
- **Each look is different at a glance** from the other five of its kind, by its hair shape or colour and its clothes' colour, not by one pixel.
- **Everyone walks, stands, breathes and nods the same way** as now: 4 walking frames, 2 standing, 2 nodding, each facing left and right. That's 16 frames a person and 384 in all, replacing today's 64.
- **The flat style:** flat colour, no outlines, no dither, at most one shadow per material. About ten new colours (two skin tones, a few hair colours and a rose) keep the sheet well within 64. The sheet stays under 400 KB.
- **No passer-by wears a top hat or a red scarf.**

## How they're picked

- When someone arrives, the crowd draws their kind, side and budget from its stream, exactly as now. It then deals them a look from a **second stream**, seeded from the set's seed. The first stream's draws don't move, so every set's crowd, and with it every test and bot score, stays as it was.
- Each kind has a **deck of its 6 looks**, shuffled from the look stream. An arrival takes the first card in the deck that no one on screen is wearing, and that card leaves the deck.
- When a deck runs out, it's refilled with all 6 and reshuffled. The new deck never starts with the look just dealt.
- If every card left in a deck is being worn by someone still on screen, the deck is refilled and reshuffled early. It takes five arrivals of one kind while an earlier one is still about, so it's rare.
- So you meet all six of a kind before any comes back (but for that rare early refill), never the same person twice in a row, and never two of them at once. At most 6 people are ever on screen, so a free look always exists.
- A look never touches the rules. Only the picture and the end card's words use it. Who wears which look can depend on who's still on screen, so on what you played, but the same seed and the same notes still replay the same people.

## Words

- The end card's "stayed longest" line follows the person: "A jogger", "A student" and "A commuter" as now, and "An old woman" or "An old man" for the elder.
- Everything else says "the elder" or "older" where it said "the old man" about the kind: code comments, `tuning.js`, the README. The Regulars spec keeps its old man, who is one person.

## How it's built

- **`crowd.js`:** `KINDS` becomes `['jogger', 'elder', 'student', 'commuter']`. A person gains `look` (0 to 5). The crowd gains the look stream and the decks, and `longest` records the look too.
- **`tuning.js`:** `oldman` becomes `elder` in `CROWD.kinds`; `RULES.oldManRest` becomes `RULES.elderRest`; `TIPS.happyOldMan` becomes `TIPS.happyElder`. The values don't change.
- **Art:**
  - `palette.lua`: the new colours.
  - `draw.lua`: letters for them in the pixel maps.
  - `figures.lua`: builds each look from parts. There's a body per kind, with its sign, and parts for hair and heads. Colours are swapped by letter, the way the old man's coat is drawn today. `F.oldMan` stays, for the regular in the style sample and the Regulars feature.
  - `sprites.lua`: writes frames named `<kind>-<look>-walk-<0-3>-<left|right>`, `-stand-<0-1>-` and `-nod-<0-1>-`. Its data gains `looks`: for each kind, its looks in order, each `'woman'` or `'man'`.
  - A new `lineup.lua`, for checking the art by eye: it writes `art/open-case/preview-lineup.png` with all 24 people standing and walking. Previews aren't committed.
  - The sheet (`sprites.png`, `sprites.json`) is rebuilt; the scripts stay deterministic.
- **`render.js`:** `personFrame` uses the person's look in the frame's name.
- **`main.js`:** the end card's words come from the kind and, for the elder, from the look's `'woman'` or `'man'` in the sheet's data.
- **README:** the art section mentions the looks and the line-up preview. The kind names follow the rename.

## Tests

- **The crowd:**
  - a set's kinds, sides, budgets and arrival times are exactly what the same seed gave before the change (pinned against values from the old code);
  - every arrival has a look from 0 to 5;
  - within a kind, all six looks are dealt before any repeats;
  - no look follows itself, even across a reshuffle;
  - no look is dealt while someone on screen wears it, and a deck whose every remaining look is on screen is refilled early;
  - the same seed and the same notes give the same looks;
  - `longest` has the look.
- **The rules:** the rename changes nothing. Every existing crowd, set and bot test passes with `elder` in place of `oldman`, with the same numbers.
- **The art:**
  - every look of every kind has all 16 frames, and the sheet's `looks` lists 6 per kind, 3 of them women;
  - each look differs from the other five of its kind in many pixels, not a handful;
  - no look draws above the head's top row;
  - the sheet has at most 64 colours, all in the palette, and is under 400 KB;
  - the pedals, the loop pedal and the case stay clear of every look at every spot, as they're checked against each kind today;
  - rebuilding the sheet twice gives the same files.
- **The screen:** `personFrame` names the person's look, and every frame the renderer asks for over a whole set is in the sheet.
- **The end card:** its line for an elder says "An old woman" or "An old man" by the look.
- **Checked by eye:** the line-up preview, then Chrome over a few seeds: people of every kind, women and men, and nobody reading as a copy.

## How we'll know it works

Nathan plays a few sets and it feels like a street: different people of every kind, women and men, and the same face rarely comes round. He can still tell a jogger from a commuter without thinking. **If six looks a kind feels too few**, adding more is art, and the deck takes any number. **If a kind stops reading at a glance**, its sign gets bolder.

## Not in this change

- New kinds of people, or new tastes.
- Different heights or builds, children, dogs, prams or bikes.
- Clothes that change with the evening or the weather.
- The regular (the Regulars spec).
