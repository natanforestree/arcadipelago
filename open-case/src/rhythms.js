// The studio's rhythms, as Figure has them: 16 for each part, from sparse to busy, each one bar long.
// Holding the pad plays the chosen rhythm and writes it into the part as the playhead passes
// (studio.js). A rhythm is its hits, each [the 16th in the bar, how many 16ths it lasts]; the drums'
// hits all last one. The rhythm wheel draws a hit lasting more than a 16th as a long mark.
const beats = (every, len = 1, from = 0) => Array.from({ length: Math.ceil((16 - from) / every) }, (_, i) => [from + i * every, len]);
const hits = (...steps) => steps.map((s) => [s, 1]);

export const RHYTHMS = {
  drums: [
    hits(0), // the one
    hits(0, 8), // one and three
    hits(4, 12), // two and four: the backbeat
    beats(4), // every beat
    beats(2), // 8ths
    beats(4, 1, 2), // the offbeat 8ths
    beats(1), // 16ths
    hits(0, 7, 10), // the lo-fi's kick
    hits(0, 3, 8, 11), // pushed
    hits(0, 3, 6, 10, 12), // the son clave
    hits(0, 3, 6, 10, 13), // the bossa's clave
    hits(0, 3, 4, 7, 8, 11, 12, 15), // a shuffle
    hits(0, 6, 12), // the tresillo
    hits(8), // the one-drop, on three
    hits(2, 3, 6, 7, 10, 11, 14, 15), // doubled offbeats
    hits(8, 10, 12, 13, 14, 15), // a fill
  ],
  bass: [
    [[0, 16]], // a whole bar
    [[0, 8], [8, 8]], // halves
    beats(4, 4), // every beat, held
    beats(4, 2), // every beat, short
    [[0, 6], [6, 6], [12, 4]], // dotted
    [[0, 5], [7, 2], [10, 3], [14, 2]], // the lo-fi's line
    beats(2, 2), // 8ths
    beats(4, 2, 2), // the offbeat 8ths
    [[0, 6], [8, 6]], // the two-feel
    [[0, 3], [3, 3], [6, 4], [10, 2], [12, 4]], // syncopated
    [[0, 2], [3, 1], [6, 1], [7, 1], [10, 2], [12, 1], [14, 1], [15, 1]], // funk 16ths
    [[2, 3], [6, 2], [8, 4], [14, 2]], // reggae
    [[0, 4], [7, 4], [14, 2]], // pushes
    beats(4, 1), // every beat, staccato
    [[0, 2], [2, 1], [4, 2], [7, 1], [8, 2], [10, 1], [12, 2], [15, 1]], // busy
    [[12, 4]], // a pickup on four
  ],
  chords: [
    [[0, 16]], // a whole bar
    [[0, 8], [8, 8]], // halves
    beats(4, 3), // every beat
    [[4, 2], [12, 2]], // two and four: the skank
    beats(4, 1, 2), // offbeat stabs
    [[0, 9], [10, 6]], // the lo-fi's
    [[0, 2], [6, 2], [10, 2], [12, 2]], // the bossa's comping
    hits(0, 3, 6, 10, 11, 14), // funk stabs
    [[0, 3], [3, 13]], // the charleston
    [[0, 6], [6, 10]], // pushed
    beats(2, 2), // 8ths
    [[0, 14], [14, 2]], // held, then anticipated
    [[0, 6], [6, 6], [12, 4]], // dotted
    [[0, 4]], // one short chord
    [[8, 8]], // on three
    [[0, 2], [3, 2], [6, 2], [8, 2], [11, 2], [14, 2]], // syncopated
  ],
};

// A rhythm's hit on 16th r of the bar (0 to 15): its length, or 0 for none.
export const hitAt = (rhythm, r) => rhythm.find(([s]) => s === r)?.[1] ?? 0;
