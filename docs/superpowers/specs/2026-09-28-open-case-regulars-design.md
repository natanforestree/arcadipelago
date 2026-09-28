# Open Case: Regulars (design spec)

**Date:** 2026-09-28
**Status:** Nathan picked this from a design memo ("ill go with your rec"). This written spec is waiting for his review; the implementation plan comes after that.

Open Case's first build works: Nathan played it by ear and "it feels and sounds great". But every set starts from zero. The crowd forgets you at the end card, so nothing you invent carries over to the next set. This change adds the one thing that does carry over: **a regular who remembers an idea of yours and asks for it back.** It came out of a design session with Max's game-design-consultant skill, which steered away from XP, coin-bought unlocks, streaks and scores. Each of those would make a number the reason to play, where here what grows is your own music and someone who knows it.

## The moment it's for

You start a set. A few bars in, the old man in the red scarf shuffles up and stops before you've played much. Above his head floats a small bubble with a squiggle in it: the rising figure you brought back three times in an earlier set. You play it starting on a different note, with a lazier rhythm. He grins, taps his cane and drops three coins, and the student beside him, who's never heard it, stops too.

## Decisions

| Topic | Decision |
|---|---|
| Who | One regular to start: **the old man in the red scarf**. He's a new person, separate from the old men who pass by (they keep their own look). More regulars later (the student, then the jogger) if he works. |
| When he comes | In each set, a 50% chance, drawn from its own seeded stream so the passers-by replay exactly as before. If he comes, he walks in from the left at a bar between 4 and 20 (seeded). |
| Before he knows you | He's a passer-by with the old man's taste (space: long notes and rests, and he winces at pick strength 4) and patience. |
| What he remembers | When he leaves happy, or is still listening when the set ends, he keeps **the last idea you called back while he was listening**. If you called nothing back while he listened, he keeps what he remembered before (or nothing yet). |
| His request | Once he remembers an idea, he stops as soon as he's in earshot and takes a spot. A bubble over his head shows the idea's squiggle, drawn like a memory-strip box. It stays for 8 bars. |
| Answering | Within those 8 bars, a phrase that opens with his idea **changed** answers it: the same steps from a different note, or the same notes with a different rhythm (the callback test, but against his idea, with no "8 bars ago" rule). He grins, his interest goes to full, he drops 3 coins, the bubble bursts gold, and the idea joins the memory strip as fresh. |
| Played exactly | A nod and 1 coin. |
| Ignored | The bubble fades after 8 bars. He stays and listens like anyone else: no frown, no penalty. |
| Nothing fades | His memory never expires. Missing days costs nothing, and the game never mentions absence. |
| The songbook | Every idea that earns a callback is saved, with the date: up to 12, newest kept, and an idea with the same steps replaces its older copy. The end card shows them as squiggles under the set's summary, with his idea marked. |
| Bots | `?bot` sets neither read nor change his memory or the songbook, and aren't logged (as now). |

## On screen

- **The regular:** the placeholder old man with a red scarf (the flat style sample's colours), so he reads as a different person from the passing old men.
- **The bubble:** a rounded box over his head holding the squiggle, drawn the same way as the strip's boxes so the two visibly match. A thin bar along its bottom shrinks over the 8 bars. On an answer it bursts gold and "CALLBACK!" pops as it does for a normal callback. Ignored, it fades.
- **The end card:** a line when he came ("The old man in the red scarf asked for one of yours. You answered it." / "…You played it just as before." / "…He listened anyway."), then the songbook row.
- **`?debug`:** his memory's squiggle and his interest, like the other listeners. `?regulars=forget` clears his memory and the songbook (debug only).

## Rules in detail

- An **idea** is as now: the opening shape of a phrase of 4 notes or more (3 steps in semitones and 3 gaps in 16ths).
- **Matching his idea:** a phrase's opening shape has the same steps as his idea. It's an answer if the starting note differs, or the starting note matches and the gaps differ. It's "played exactly" if the starting note and the gaps both match.
- Only the first matching phrase inside the 8 bars counts; after that the bubble is gone.
- An answer is its own event: only he tips 3 coins for it. Everyone else hears a phrase as usual, and if the same phrase also passes the normal callback test against the strip, the normal callback fires too.
- He adopts a new idea only from callbacks heard while he was in earshot or stopped. Answering his request counts as one: its new form becomes his memory.

## Where it's kept

- His memory under `open-case-regulars` in local storage, the songbook under `open-case-songbook`, both read through the safe storage wrapper. An unreadable value starts afresh.
- The test log gains two fields per set: whether he came, and whether his request was answered, played exactly or ignored.

## How it's built

- The rules stay pure. The set's core takes the regulars' memory as an input and reports what it learned, and `main.js` reads and saves it. A set replays exactly from its seed, its notes and the memory it started with.
- New numbers go in `tuning.js` as a `REGULARS` block:

| Setting | Starting value (untested) |
|---|---|
| Chance he comes in a set | 0.5 |
| Arrival bar | 4 to 20 |
| Bars to answer | 8 |
| Tip for an answer | 3 coins |
| Tip for playing it exactly | 1 coin |
| Songbook size | 12 ideas |

- **Tests** cover:
  - he comes about half the time, and his arrival never changes the other passers-by;
  - before he knows you he's a normal old man;
  - he adopts the last callback he heard, and keeps his old idea when he heard none;
  - the request stops him at once, and lasts 8 bars;
  - answer, played exactly and ignored each give their payoff;
  - the answered idea joins the strip as fresh;
  - the songbook keeps 12, replaces same-step copies, and survives an unreadable value;
  - bot sets leave the memory alone;
  - the headline test is unchanged (bots run with no memory).

## How we'll know it works

Nathan plays his next ten sets in which the old man comes; the log records each. **It passes** if Nathan answers the old man's idea by choice in at least half of those sets, and his Another-set rate doesn't drop compared with his sets before. **If he mostly ignores the old man, or says the requests break his flow,** the requests come out and the songbook stays. With one tester this is a taste call, not statistics.

## Not in this change

More regulars, names, faces in the flat style, the full repaint, new spots, instruments, and anything that counts days.
