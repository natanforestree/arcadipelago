# Last Light: Cursed charms (design spec)

**Date:** 2026-09-26
**Status:** Design approved by Nathan in conversation (2026-09-26). Amended the same day at his request: the charm you wear hangs from your gun (§3). He pitched gun charms that monsters drop, "the more powerful monsters the better charms". The reply, from Max's game-design-consultant skill, recommended **cursed charms**: every charm has a power and a price, you wear one at a time, and a swap leaves yours behind. Nathan's answer: "build it!". The game it changes is specified in `docs/superpowers/specs/2026-09-24-last-light-design.md`, with Dark harvest in `docs/superpowers/specs/2026-09-25-last-light-dark-harvest-design.md`.

Dark harvest's upgrades only ever add: you never give anything up. Charms bring the one decision the game lacks: **what will you give up for this?**
- The after-eaters sometimes drop a **charm** where they die. Gaunts and leapers rarely drop one; the Mother always drops hers.
- You stand over a charm to read it: its name, what it gives you, and what it takes.
- **E** takes it. You wear **one** charm at a time, so taking one leaves the one you wore on the snow where you stand.

The feeling to aim for is **temptation**. A gaunt's charm isn't better than a leaper's: it's stronger in both directions.

## Goals and success criteria

- **The loop:**
  - a rare charm glints where a gaunt or leaper fell;
  - you walk out to read it;
  - you decide whether its power is worth its price, and whether it's worth the one you wear.
- **Every charm has a real price.** None is a plain gain, and each one changes how you play the rest of the night.
- **What doesn't change:**
  - the waves, the upgrades, the embers, your aiming, and the smoothness;
  - a night where you never take a charm plays exactly as it did before (charms draw from their own random stream);
  - the renderer benchmark stays under 4 ms a frame;
  - nothing allocates in an update.
- **Nothing carries over between nights.**
- **Tests:** every rule here has an automated test. `?debug=bot` still plays whole nights to dawn with no console errors.
- **The playtest** (after release, for Nathan and friends; not a build gate):
  - Drop the idea if players take nearly every charm they find, or almost never swap: either way the prices are wrong.
  - Watch the embers too. If people fetch about a third fewer, charms are stealing the walk from the harvest.

## Decisions

| Topic | Decision |
|---|---|
| Direction | Cursed charms: a power and a price each, one worn at a time |
| Who drops them | Gaunts (1 in 10), leapers (1 in 15), the Mother (always). Crawlers never |
| Strength by source | A gaunt's charms are stronger both ways than a leaper's; the Mother's is the strongest of all |
| How you take one | Stand over it to read it; **E** takes it. There's no way to take a charm off except by taking another |
| How long they lie | Until the next wave begins |
| Gentler nights | "Embers come to you" brings charms to you too, once |
| Not doing | Rarity tiers or colours, stats on screen, charm levels, more than one slot, anything carried between nights, the bot wearing charms |

## 1. The six charms

Each charm's two lines are in quotes: what it gives, and what it takes. Names are at most 20 characters, and lines at most 36.

| # | From | Name | Gives | Takes | Exact effect |
|---|---|---|---|---|---|
| 0 | Gaunt | Wolf's tooth | "Rifle shots hit half again as hard." | "Your lantern's light shrinks." | Rifle damage ×1.5, with Steady hands and Through-and-through too. The lantern's clear light and its fade both reach ×0.6 as far (Wide wick included) |
| 1 | Gaunt | Red thread | "Each kill heals you a little." | "The stove no longer heals you." | Every kill, by shot or by fire, heals you 4, up to your maximum. In a lull the stove doesn't heal you. It still sells upgrades, and Warm hands still heals |
| 2 | Gaunt | Crow's feather | "Every ember is worth one more." | "They hurt you a third more." | An ember dropped while you wear it is worth 1 more (crawler 2, leaper 3, gaunt 4, drawn bigger still; the Mother still drops none). All damage you take is ×4/3 |
| 3 | Leaper | Grave salt | "They slow in your lantern's light." | "Embers cool twice as fast." | A creature within your lantern's clear light (2.5 cells, 3.5 with Wide wick) moves at ×0.75. That's on top of a flare's slowing, and a leaper's leap slows too. Embers on the snow cool twice as fast: 7.5 s, flickering for the last 1.5 s |
| 4 | Leaper | Hare's foot | "Move a quarter faster." | "You hold 75 health at most." | Walk, run and acceleration ×1.25, on top of Snowshoes. Your maximum health is 75: taking it brings you down to 75 at once, and taking it off lets the stove heal you back to 100 |
| 5 | The Mother | The Mother's eye | "Their eyes show through walls." | "Your lantern gutters low." | Every after-eater's eyes glow at full strength at any distance, and show through walls. The lantern's clear light and fade reach ×0.3 as far |

The Mother comes in the last hour, so her eye is a gift for the end of the night: in near-dark you see every one of them, wherever they are.

## 2. Dropping, reading, taking

- **Dropping.** When an after-eater is killed, by a shot or by burning:
  - a gaunt drops a charm 1 time in 10, and a leaper 1 in 15;
  - the Mother always drops hers;
  - a crawler never does.
- **Which one.** A gaunt's charm is one of the gaunt's three, and a leaper's one of the leaper's two, at random. It's never the one you wear or one already on the snow. If none is left, nothing drops.
- **Their own dice.** Charm drops use a random stream of their own, seeded from the night's seed. So a night where you never take a charm plays exactly as it did before charms existed.
- **Where.** A charm drops where the creature died, next to its ember.
- **How long.**
  - A charm lies on the snow until the next wave begins, then it's gone.
  - In a lull's last 3 s, charms on the snow flicker, so you can see they're going.
  - The Mother's lies until dawn, since her wave is the last.
- **One of each.** Each charm is in one place at most: worn, on the snow, or not dropped yet. So the snow holds at most six, and there's a slot for each.
- **Reading.**
  - Stand within **0.8 cells** of a charm to read it. The nearest one within reach is the one you read.
  - The reading is a small dark panel at the top of the view, under the hour:
    - the charm's icon and name;
    - what it gives;
    - what it takes, in red;
    - *"E to take it"*, or *"E to take it, leaving Grave salt"* with the charm you wear.
  - It never covers the crosshair, and it can show at the same time as the fire's offer.
- **Taking (E).**
  - E takes the charm you're reading, as long as it was already showing (a charm you've only just reached can't be taken in the same update).
  - You wear it at once. The one you wore, if any, drops at your feet, and lies there until the next wave begins, like any other.
  - A banner shows its name and what it gives.
  - E works in waves and lulls, and not once the night is over.
- **Wearing.**
  - Your charm hangs from the gun in your hands (§3).
  - There's no way to take a charm off except by taking another.
- **Gentler nights ("Embers come to you").**
  - A newly dropped charm drifts straight towards you at **3 cells/s**, through anything, like an ember.
  - It stops once it's within half its reach, and settles there.
  - It doesn't follow you after that. The one you leave behind when you swap settles where it falls.
- **Teaching.** The first time a charm drops in a session, a banner reads **"A charm"**, with the line *"Something glints where it fell."* Like the first ember's banner, it waits for the banner showing to fade.

## 3. Display, sound, art

- **The display:**
  - the reading, as in §2;
  - the title screen's keys line gains **"E charm"**.
- **The charm on your gun.** The charm you wear hangs on a short chain from the inner side (towards the middle of the view) of the gun in your hands, from its fore-end, like a weapon charm in a shooter's loadout (Nathan's reference: The Finals).
  - It swings like a pendulum, about twice a second: it leans away as you turn, rocks with your steps, and jumps when you fire, then settles back.
  - It moves with the gun: down with the rifle when it loads, down and up in a switch, and down with the shotgun's barrels when they're broken open.
  - With reduced motion it hangs straight, and while the game is paused it holds still.
  - It's not drawn once you're dead.
- **Sound** (made live, like the rest; positional where it has a place):
  - a charm dropping: a thin glassy chime where it fell, so you can hear one drop out in the dark;
  - taking one: a low bell with a sour note under it;
  - one fading at the wave: a faint falling chime where it was.
- **Art** (Lua through Aseprite, deterministic, like all Last Light art):
  - a **charm** sprite in `sprites.lua`: a small bone trinket on a dark cord in the snow, with a cold glint (the glowing `star` colour) that moves across it in four frames, 0.14 cells tall;
  - six **charm icons** in `hud.lua`, 12×12, named `charm-` and the charm's key, drawn as rows of characters like the upgrade icons, in colours that read on the dark panel and on the snow;
  - six **pendants** in `hud.lua`, each a bigger charm under a short chain, outlined in the dark so it reads on the snow and the gun, drawn turned to 11 angles from -0.75 to 0.75 radians about the top of its chain (`hang-`, the key and the turn), so it swings without being turned at run time;
  - the point on each gun frame where the charm hangs, projected from the gun's model in `hands.lua` and written to `hands.json` as `charms`.
- **On screen in the world:**
  - a charm on the snow hovers a little, like a supply, and glints;
  - it lights a small patch of snow round it, so it can be found in the dark;
  - with the Mother's eye, the after-eaters' eyes are drawn at full glow, and through walls.

## 4. Code structure

New code follows the existing rules:
- no allocation in an update;
- fixed pools;
- seeded random numbers;
- no DOM in the simulation;
- numbers in `tuning.js`.

| File | Change |
|---|---|
| `src/tuning.js` | `CHARMS`: drop chances, reach, the lull's flicker, the gentle drift, the snow's light, and each charm's numbers; `KEYS.take` (`KeyE`) |
| `src/charms.js` (new) | The charm list (key, name, lines, from), the pool on the snow, `dropCharm`, `updateCharms` (fading, gentle drift, reading, taking), `wearCharm`, and `lantern(state)`: your lantern's light now |
| `src/creatures.js` | `kill()` drops a charm, and heals you with Red thread; Crow's feather adds 1 to the ember; Grave salt slows creatures in your light |
| `src/embers.js` | Grave salt: embers cool twice as fast |
| `src/weapons.js` | Wolf's tooth: rifle damage |
| `src/player.js` | Hare's foot: speed; Crow's feather: damage you take |
| `src/night.js` | Red thread: the stove doesn't heal |
| `src/sim.js` | New state (`charm`, `charms`, `charmRng`, `charmAt`); `createState({ charm })`; `updateCharms` in the update order |
| `src/input.js` | E gives a `take` press |
| `src/bot.js` | Its intents include `take: 0`; it never takes a charm |
| `src/scene.js` | Charm sprites and their light; the lantern from `lantern(state)`; eyes at full glow with the Mother's eye, and marked to show through walls; an ember worth 4 (Crow's feather) drawn bigger still |
| `src/render.js` | A sprite marked `xray` draws its glowing pixels (the eyes) even behind walls |
| `src/hud.js` | The reading; the charm on your gun, swinging (`createSwing`, `swingCharm`); "E charm" on the title screen |
| `src/audio.js` | Sounds for the new events |
| `src/game.js` | Banners (the first charm; a charm taken) |
| `src/main.js` | `?charm=<key>` (debug): start each night wearing that charm; the swing, your facing and the frame time go to the HUD |
| `src/assets.js` | `art.hands.charms`: where the charm hangs from each gun frame |
| `src/events.js` | Documents the new events |
| `bench.js` | Charms on the snow, and the creatures drawn with `xray` (the Mother's eye, the worst case) |
| `art/last-light/sprites.lua`, `hud.lua` | The charm sprite; the six icons; the six pendants, turned |
| `art/last-light/hands.lua`, `lib.lua` | Each gun frame's charm point, in `hands.json` |

**New events:**

| Event | x, y | a |
|---|---|---|
| `charmDrop` | where it fell | charm id |
| `charm` | you | charm id (you took it) |
| `charmOut` | where it was | charm id (it faded at the wave) |

**Update order** in `step`:
1. `movePlayer`
2. `updateField`
3. `updateChoosing`
4. `updateGun`
5. `updateCreatures`
6. `updateFlares`
7. `updateEmbers`
8. `updateCharms` (new)
9. `updateNight`

## 5. Testing

Node tests, like the rest. At least:
- **Dropping:**
  - a gaunt or leaper kill drops a charm at the right rate over many kills, from its own list;
  - the Mother always drops hers, and a crawler never drops one;
  - never the one you wear, nor one on the snow;
  - burn kills drop too;
  - drops don't change the night's main random stream.
- **Lying and fading:**
  - a charm stays through the rest of its wave and the lull, and is gone when the next wave begins, with `charmOut`.
- **Reading and taking:**
  - the reading shows within 0.8 cells, for the nearest charm, and not beyond;
  - E takes only a charm that was already showing;
  - a swap leaves your old charm at your feet;
  - no taking once the night is over;
  - gentle mode drifts a new charm to you once, and it settles.
- **Each charm's effect**, one test at least per row of §1:
  - Hare's foot's cap on health, and the cap lifting when you take another;
  - Red thread's stove.
- **Input:** E gives `take`.
- **Display:**
  - the reading, and its line with and without a charm worn;
  - the charm on your gun: where the frame says, down with the rifle to load, gone when you're dead, turned as it swings, straight with reduced motion;
  - the swing: turning swings it away and it settles back, a shot jolts it, and it swings alike at any frame rate.
- **Scene:**
  - charm sprites with their light;
  - the lantern's reach under each charm;
  - eyes at full glow and `xray` with the Mother's eye.
- **Render:** an `xray` sprite behind a wall draws its glowing pixels, and only those.
- **Bot:** it plays a whole night to dawn (god mode) wearing each charm, from `createState({ charm })`.
- **Allocation:** an update allocates nothing that lasts, with charms dropping, worn and swapped.
- **Art:** the sprite, the six icons and the pendants exist at the sizes above, every gun frame has its charm point on the gun, and the loader passes the points on.
- **Benchmark:** the existing frames, plus charms on the snow and `xray` creatures, stay under 4 ms.

## 6. Starting tuning values

These are my starting values, untested, to be tuned by play.

| Value | Start | How you'd know it's right |
|---|---|---|
| Gaunt drop chance | 1 in 10 | About 4 charms in a whole night (the Mother's aside) |
| Leaper drop chance | 1 in 15 | Same |
| Reach | 0.8 cells | Easy to stand over; never read by accident from across the porch |
| Flicker before the wave | last 3 s of the lull | You notice they're going |
| Light on the snow | clear to 0.1 cells, dark by 0.9, intensity 0.3 | Findable in the dark; not mistaken for an ember |
| Wolf's tooth | rifle ×1.5, lantern ×0.6 | Taken sometimes, and sometimes regretted |
| Red thread | 4 health a kill; no stove healing | Both halves felt within a wave and a lull |
| Crow's feather | +1 an ember; damage taken ×4/3 | A greedy choice, not an automatic one |
| Grave salt | ×0.75 in the lantern's clear light; embers cool ×2 | Crawlers visibly slower up close |
| Hare's foot | ×1.25 speed; 75 health at most | Ember runs feel quicker, and every bite matters |
| The Mother's eye | lantern ×0.3 | Scary, and still playable to dawn |

## 7. Rulings made in this spec

These are recorded as ruling, reason, and cost if wrong.

- **The Mother's eye's price** is "your lantern gutters low", not "every one of them knows where you are", as pitched.
  - Why: they already always know where you are (they follow the flow field to you), so the pitched price cost nothing.
  - Cost if wrong: one line and one number.
- **Wolf's tooth hits ×1.5**, not a third harder, as pitched.
  - Why: a third harder changes no kill count except the gaunt's, so it wouldn't be felt. Half again means two shots for a leaper in flare light becomes one.
  - Cost if wrong: one number.
- **Three new charms** complete the six: Red thread, Crow's feather and Hare's foot.
  - Why: each covers a way of playing the others don't: the brawler, the greedy harvester and the runner.
  - Cost if wrong: they're rows in a list.
- **The reading sits at the top of the view**, not in the middle.
  - Why: charms lie where the fighting is, and a panel in the middle would cover the crosshair.
  - Cost if wrong: layout only.
- **One slot for each charm**, not a pool of 8 that replaces the oldest.
  - Why: a drop is never the charm you wear or one on the snow, so no charm can be in two places, and six slots can never fill.
  - Cost if wrong: none.
- **The charm hangs from your gun, and the corner icon is gone** (Nathan, 2026-09-26, with a reference picture).
  - Why: "attach it to your gun" was the pitch; seeing it swing there says what you wear without another icon.
  - Cost if wrong: the corner icon is one line to bring back.
- **Pendants are drawn turned, not turned at run time.**
  - Why: pixel art turned by the canvas at run time comes out ragged and uneven; drawing each turn in the Lua keeps every pixel a palette colour, and 11 turns look smooth at this size.
  - Cost if wrong: hud.png grows by 66 small pieces (about 3,000 pixels wide, mostly empty).
- **No end-screen charm, and the bot wears no charms.**
  - Why: the end screens already show the night's upgrades. The bot is a test harness, and its gates (dawn in god mode, 5 to 7 picks) stay exactly as they were.
  - Cost if wrong: small, and easy to add later.

## Out of scope

- Rarity tiers, charm levels, stats or numbers on screen.
- More than one slot, or taking a charm off without taking another.
- Anything carried between nights.
- The bot choosing charms.
- Changes to the creatures' numbers, the waves or the upgrades.
