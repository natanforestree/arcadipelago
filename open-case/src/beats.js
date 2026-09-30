// Beats: what the band plays, as data. A beat has a tempo, a swing, a key, a length (1, 2 or 4 bars),
// a sound for each part and a mix, and three parts: drums, bass and chords. The band plays whichever
// beat a set uses (set.js, audio.js), and the studio (studio.js) records into the same data. Pure, so
// it's tested in Node.
//
// Time is counted in 16ths from the band's first note: 16th s is in bar floor(s / 16), and it's a
// strong beat when s % 4 === 0. A beat's parts say where their notes fall within its own length, and
// the band plays it round and round.
//
//   drums:  [{ s, drum: 'kick' | 'snare' | 'hats' | 'perc', vel }]
//   bass:   [{ s, degree, len, vel, tone }]
//   chords: [{ s, degree, len, vel, tone, notes?, name? }]
//
// s is the 16th within the beat, len is in 16ths, vel (how hard) and tone (darker 0 to brighter 1, 0.5
// being the sound itself) run from 0 to 1. A note or chord is kept by its place in the key (degree 0
// is the home note, 7 the home note an octave up, negative below it), so changing the key carries it
// along. A ready-made beat may spell out a chord's own notes and name, as the lo-fi does.
import { GROOVE } from './tuning.js';

export const midiToHz = (n) => 440 * Math.pow(2, (n - 69) / 12);

// Every key is on the white keys: the same seven notes, with a different home note for each mood.
// B's mode is left out: its home chord is diminished and never sounds settled.
const WHITE = [0, 2, 4, 5, 7, 9, 11];
export const MOODS = [
  { id: 'C', name: 'C major' },
  { id: 'D', name: 'D Dorian' },
  { id: 'E', name: 'E Phrygian' },
  { id: 'F', name: 'F Lydian' },
  { id: 'G', name: 'G Mixolydian' },
  { id: 'A', name: 'A minor' },
];
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
export const moodName = (mood) => MOODS.find((m) => m.id === mood)?.name ?? mood;

export const inKey = (pitch) => WHITE.includes(((pitch % 12) + 12) % 12);
export const isStrong = (s) => s % 4 === 0;
export const isOff16th = (s) => s % 2 === 1;
const mod = (a, n) => ((a % n) + n) % n;

// The white key `degree` steps from the mood's home note, the home note being in the octave that
// starts at MIDI note c (36 is C2).
export function keyNote(mood, degree, c) {
  const i = LETTERS.indexOf(mood) + degree;
  return c + 12 * Math.floor(i / 7) + WHITE[mod(i, 7)];
}

export const BASS_C = 36; // the bass's home octave starts at C2
const CHORD_LOW = 48; // a chord's root sits from C3 up to B3

// The chord of the key on `degree`, `size` notes stacked in thirds from its root: 3 (a triad), 4 (a
// 7th) or 5 (with a 9th, left off where it would clash a half step above the root). Degree 7 is the
// home chord again, an octave up; a degree below the home note is its chord in the usual place.
function stack(mood, degree, size) {
  const rootPc = mod(keyNote(mood, degree, 0), 12);
  const root = CHORD_LOW + mod(rootPc - CHORD_LOW, 12) + 12 * Math.max(0, Math.floor(degree / 7));
  const notes = [root];
  for (let k = 1; k < size; k++) {
    const n = root + keyNote(mood, degree + 2 * k, 0) - keyNote(mood, degree, 0);
    if (k === 4 && n - root !== 14) break; // a 9th a half step above the root clashes: leave it off
    notes.push(n);
  }
  return notes;
}

// A chord's name from its notes (root first): C, Cm, Cdim, Cmaj7, C7, Cm7, Cm7b5, Cmaj9, C9, Cm9.
export function chordName(notes) {
  const root = LETTERS[WHITE.indexOf(mod(notes[0], 12))];
  const third = notes[1] - notes[0], fifth = notes[2] - notes[0], seventh = notes[3] - notes[0];
  const minor = third === 3, dim = fifth === 6;
  if (notes.length < 4) return root + (dim ? 'dim' : minor ? 'm' : '');
  if (dim) return `${root}m7b5`;
  const ext = notes.length >= 5 ? '9' : '7';
  if (seventh === 11) return `${root}maj${ext}`;
  return `${root}${minor ? 'm' : ''}${ext}`;
}

// The name on the studio's pad for the chord on `degree`: the triad's (Am, Bdim, C).
export const padChordName = (mood, degree) => chordName(stack(mood, degree, 3));

// The sounds each part can have. A drum kit is a voice for each of its four drums; a bass is a
// voice; a chord sound is a voice and how it stacks its chords.
export const KITS = {
  lofi: { name: 'lo-fi kit', kick: 'kick', snare: 'snare', hats: 'hat', perc: 'shaker' },
  brushes: { name: 'brushes', kick: 'softKick', snare: 'brush', hats: 'shaker', perc: 'rim' },
  funk: { name: 'funk kit', kick: 'tightKick', snare: 'crack', hats: 'hat', perc: 'openHat' },
  reggae: { name: 'reggae kit', kick: 'deepKick', snare: 'rimshot', hats: 'hat', perc: 'shaker' },
};
export const BASSES = {
  round: { name: 'round bass', voice: 'bass' },
  plucked: { name: 'plucked bass', voice: 'pluck' },
  deep: { name: 'deep bass', voice: 'deep' },
};
export const CHORD_SOUNDS = {
  epiano: { name: 'electric piano', voice: 'ep', size: 5 },
  nylon: { name: 'nylon guitar', voice: 'nylon', size: 4 },
  clav: { name: 'clav', voice: 'clav', size: 4 },
  organ: { name: 'organ', voice: 'organ', size: 3 },
  piano: { name: 'piano', voice: 'piano', size: 3 },
};
export const SOUNDS = { drums: KITS, bass: BASSES, chords: CHORD_SOUNDS };

// A chord hit's notes and name: its own, or its chord of the key as the beat's chord sound stacks it
// (the piano doubles the root an octave up).
export function chordOf(beat, hit) {
  if (hit.notes) return { notes: hit.notes, name: hit.name ?? chordName(hit.notes) };
  const sound = CHORD_SOUNDS[beat.sounds.chords];
  const notes = stack(beat.mood, hit.degree, sound.size);
  return { notes: beat.sounds.chords === 'piano' ? [...notes, notes[0] + 12] : notes, name: chordName(notes) };
}

export const bassNote = (beat, hit) => keyNote(beat.mood, hit.degree, BASS_C);


// The timing of a beat: how long a beat and a bar last, when 16th s sounds (in seconds from the
// band's first 16th) and which 16th is nearest a time. The swing pushes the second 16th of each pair
// late: it lands at `swing` of the pair (0.5 is straight).
export function clockOf(beat) {
  const beatLen = 60 / beat.bpm;
  const grid = [0, beat.swing / 2, 0.5, 0.5 + beat.swing / 2, 1];
  return {
    beat: beatLen,
    bar: beatLen * 4,
    timeOf16th(s) {
      const b = Math.floor(s / 4);
      return (b + grid[s - b * 4]) * beatLen;
    },
    sixteenthAt(t) {
      const beats = Math.max(0, t) / beatLen;
      const b = Math.floor(beats), f = beats - b;
      let best = 0;
      for (let k = 1; k < grid.length; k++) if (Math.abs(f - grid[k]) < Math.abs(f - grid[best])) best = k;
      return b * 4 + best;
    },
  };
}

// How many bars a set of this beat lasts: the multiple of 4 closest to GROOVE.setSeconds.
export const setBars = (beat) => Math.max(4, Math.round(GROOVE.setSeconds / (clockOf(beat).bar * 4)) * 4);

const level = (beat, part) => (beat.mix.muted[part] ? 0 : beat.mix.levels[part]);

// What one hit of a part plays: the layer it plays in and its notes, [{ voice, note, vel, len, tone?,
// drum? }] (len in 16ths; drums use note 0, and say which drum they are). The hats play in the top
// layer, the rest of the drums in the drums layer; the chords are the keys layer. A muted part, or one
// at no level, plays nothing.
export function notesOf(beat, part, hit) {
  const lvl = level(beat, part), vel = hit.vel * lvl;
  if (part === 'drums') {
    const layer = hit.drum === 'hats' ? 'top' : 'drums';
    return { layer, notes: lvl ? [{ voice: KITS[beat.sounds.drums][hit.drum], note: 0, vel, len: 1, drum: hit.drum }] : [] };
  }
  if (part === 'bass') {
    return { layer: 'bass', notes: lvl ? [{ voice: BASSES[beat.sounds.bass].voice, note: bassNote(beat, hit), vel, len: hit.len, tone: hit.tone }] : [] };
  }
  const voice = CHORD_SOUNDS[beat.sounds.chords].voice;
  return { layer: 'keys', notes: lvl ? chordOf(beat, hit).notes.map((note) => ({ voice, note, vel, len: hit.len, tone: hit.tone })) : [] };
}

// The notes a layer starts on 16th s, in the form notesOf gives. The layers are the crowd's
// (tuning.js LAYERS): 'keys' the chords, 'drums' the kick, snare and percussion, 'bass', and 'top' the
// hats and the Pad; and 'perc', the stand-in percussion that audio.js plays whenever the drums are
// out.
export function bandAt(beat, layer, s) {
  const k = mod(s, beat.bars * 16);
  const part = { keys: 'chords', drums: 'drums', bass: 'bass', top: 'drums' }[layer];
  const played = (p) => beat[p].filter((h) => h.s === k).map((h) => notesOf(beat, p, h)).filter((w) => w.layer === layer).flatMap((w) => w.notes);
  switch (layer) {
    case 'keys':
    case 'drums':
    case 'bass':
      return played(part);
    case 'top': {
      const out = played('drums'), lvl = level(beat, 'chords');
      // The Pad: at each bar line, the chord sounding then, its upper notes an octave up, for a bar.
      if (beat.mix.pad && lvl && k % 16 === 0) {
        const hit = beat.chords.filter((h) => h.s <= k).at(-1) ?? beat.chords.at(-1);
        if (hit) for (const note of chordOf(beat, hit).notes.slice(1)) out.push({ voice: 'pad', note: note + 12, vel: 0.2 * lvl, len: 16 });
      }
      return out;
    }
    // Stand-in percussion (not a crowd layer: audio.js plays it whenever the drums slot is off), a
    // soft shaker-and-snap beat rather than a metronome: a shaker on every swung 8th, louder on the
    // beat; finger snaps on 2 and 4; a low tap on the downbeat.
    case 'perc': {
      const out = [], p = mod(s, 16);
      if (p % 2 === 0) out.push({ voice: 'shaker', note: 0, vel: p % 4 === 0 ? 0.5 : 0.3, len: 1 });
      if (p === 4 || p === 12) out.push({ voice: 'snap', note: 0, vel: 0.5, len: 1 });
      if (p === 0) out.push({ voice: 'tap', note: 0, vel: 0.6, len: 1 });
      return out;
    }
    default:
      return [];
  }
}

// Builds a beat's parts bar by bar: fn(bar) returns that bar's { drums, bass, chords }, each hit's s
// counted within the bar.
function bars(count, fn) {
  const out = { drums: [], bass: [], chords: [] };
  for (let b = 0; b < count; b++) {
    const part = fn(b);
    for (const key of Object.keys(out)) for (const h of part[key] ?? []) out[key].push({ ...h, s: b * 16 + h.s });
  }
  return out;
}
const hit = (drum, s, vel) => ({ drum, s, vel });
const note = (s, degree, len, vel) => ({ s, degree, len, vel, tone: 0.5 });
const mix = (over = {}) => ({
  levels: { drums: 1, bass: 1, chords: 1 }, muted: { drums: false, bass: false, chords: false }, pump: 0, pad: false, vinyl: false, ...over,
});
// The hats on every 8th (louder off the beat), and a ghost on each beat's last 16th, as the lo-fi has.
const lofiHats = () => [0, 2, 4, 6, 8, 10, 12, 14].map((s) => hit('hats', s, s % 4 === 0 ? 0.35 : 0.5))
  .concat([3, 7, 11, 15].map((s) => hit('hats', s, 0.15)));

// The lo-fi: today's loop, note for note. Chill lo-fi hip hop at 80 bpm with a lazy 16th swing, over
// Dm9, G13, Cmaj9 and Am9 (ii-V-I-vi in C major), each voiced as it always was.
const LOFI_CHORDS = [
  { degree: 1, notes: [50, 53, 57, 60, 64], name: 'Dm9' },
  { degree: 4, notes: [43, 53, 57, 59, 64], name: 'G13' },
  { degree: 0, notes: [48, 52, 55, 59, 62], name: 'Cmaj9' },
  { degree: 5, notes: [45, 55, 59, 60, 64], name: 'Am9' },
];
const LOFI_APPROACH = [3, -1, 4, 0]; // the bass's walk into the next bar's root: F2, B1, G2, C2
export const LOFI = {
  id: 'lofi', name: 'Lo-fi', ready: true, bpm: 80, swing: 0.58, mood: 'C', bars: 4,
  sounds: { drums: 'lofi', bass: 'round', chords: 'epiano' },
  mix: mix({ pad: true, vinyl: true }),
  ...bars(4, (b) => {
    const c = LOFI_CHORDS[b], r = c.degree;
    return {
      chords: [
        { s: 0, degree: r, len: 9, vel: 0.5, tone: 0.5, notes: c.notes, name: c.name },
        { s: 10, degree: r, len: 6, vel: 0.3, tone: 0.5, notes: c.notes.slice(1), name: c.name },
      ],
      drums: [
        hit('kick', 0, 1), hit('snare', 4, 0.8), hit('kick', 7, 0.5), hit('kick', 10, 0.8), hit('snare', 12, 0.8),
        ...(b % 2 === 1 ? [hit('snare', 15, 0.25)] : []), ...lofiHats(),
      ],
      bass: [note(0, r, 5, 0.9), note(7, r, 2, 0.6), note(10, r + 4, 3, 0.7), note(14, LOFI_APPROACH[b], 2, 0.5)],
    };
  }),
};

// Bossa nova at 132, straight: nylon-guitar comping over Am7, Dm7, G7 and Cmaj7, a bass rocking
// between root and fifth on 1 and 3, a rim-click clave and brushes.
export const BOSSA = {
  id: 'bossa', name: 'Bossa nova', ready: true, bpm: 132, swing: 0.5, mood: 'A', bars: 4,
  sounds: { drums: 'brushes', bass: 'round', chords: 'nylon' },
  mix: mix(),
  ...bars(4, (b) => {
    const r = [0, -4, -1, -5][b]; // Am7, Dm7, G7, Cmaj7, with their roots low for the bass
    return {
      chords: [[0, 0.5], [6, 0.4], [10, 0.45], [12, 0.4]].map(([s, vel]) => ({ s, degree: r, len: 2, vel, tone: 0.5 })),
      bass: [note(0, r, 5, 0.85), note(6, r + 4, 2, 0.6), note(8, r + 4, 5, 0.75), note(14, r, 2, 0.55)],
      drums: [
        hit('kick', 0, 0.5), hit('kick', 6, 0.3), hit('kick', 8, 0.45), hit('kick', 14, 0.3),
        ...[0, 3, 6, 10, 12].map((s) => hit('perc', s, 0.6)),
        ...[0, 2, 4, 6, 8, 10, 12, 14].map((s) => hit('hats', s, s % 4 === 0 ? 0.4 : 0.3)),
        hit('snare', 4, 0.3), hit('snare', 12, 0.3),
      ],
    };
  }),
};

// Funk at 100, tight: clav stabs on a D Dorian vamp (Dm9 to G9, each voiced close above the root it
// leaves out), a busy plucked bass, and a tight kit with ghost notes and an open hat.
const FUNK_CHORDS = [
  { degree: 0, notes: [53, 57, 60, 64], name: 'Dm9' },
  { degree: 3, notes: [53, 57, 59, 62], name: 'G9' },
];
const FUNK_BASS = [
  [[0, 0, 2, 0.95], [3, 0, 1, 0.7], [6, 7, 1, 0.8], [7, 6, 1, 0.6], [10, 4, 2, 0.8], [12, 0, 1, 0.75], [14, 2, 1, 0.65], [15, 3, 1, 0.6]],
  [[0, 3, 2, 0.95], [3, 3, 1, 0.7], [6, 10, 1, 0.8], [7, 9, 1, 0.6], [10, 7, 2, 0.8], [12, 3, 1, 0.75], [14, 5, 1, 0.65], [15, 6, 1, 0.6]],
];
export const FUNK = {
  id: 'funk', name: 'Funk', ready: true, bpm: 100, swing: 0.54, mood: 'D', bars: 4,
  sounds: { drums: 'funk', bass: 'plucked', chords: 'clav' },
  mix: mix(),
  ...bars(4, (b) => {
    const c = FUNK_CHORDS[b % 2];
    return {
      chords: [[0, 0.6], [3, 0.45], [6, 0.5], [10, 0.6], [11, 0.4], [14, 0.5]].map(([s, vel]) => ({ s, degree: c.degree, len: 1, vel, tone: 0.5, notes: c.notes, name: c.name })),
      bass: FUNK_BASS[b % 2].map(([s, degree, len, vel]) => note(s, degree, len, vel)),
      drums: [
        hit('kick', 0, 0.9), hit('kick', 7, 0.6), hit('kick', 10, 0.8),
        hit('snare', 4, 0.85), hit('snare', 12, 0.85), hit('snare', 9, 0.2), hit('snare', 15, 0.2),
        ...Array.from({ length: 16 }, (_, s) => s).filter((s) => s !== 14).map((s) => hit('hats', s, s % 2 === 0 ? 0.35 : 0.2)),
        hit('perc', 14, 0.5),
      ],
    };
  }),
};

// Reggae at 76, a little swing: organ skanks on 2 and 4 over Am, G, F and G, a deep round bass, and
// the one-drop: the kick and the rim together on beat 3.
export const REGGAE = {
  id: 'reggae', name: 'Reggae', ready: true, bpm: 76, swing: 0.55, mood: 'A', bars: 4,
  sounds: { drums: 'reggae', bass: 'deep', chords: 'organ' },
  mix: mix(),
  ...bars(4, (b) => {
    const r = [0, -1, -2, -1][b]; // Am, G, F, G
    return {
      chords: [4, 12].map((s) => ({ s, degree: r, len: 2, vel: 0.55, tone: 0.5 })),
      bass: [note(2, r, 3, 0.9), note(6, r + 2, 2, 0.7), note(8, r + 4, 4, 0.8), note(14, r, 2, 0.6)],
      drums: [
        hit('kick', 8, 0.9), hit('snare', 8, 0.7),
        ...[0, 2, 4, 6, 8, 10, 12, 14].map((s) => hit('hats', s, s % 4 === 0 ? 0.25 : 0.35)),
        ...[2, 6, 10, 14].map((s) => hit('perc', s, 0.25)),
      ],
    };
  }),
};

// A slow ballad at 68, straight: piano chords over C, G, Am and F with the Pad under them, a round
// bass walking between roots, and brushes.
export const BALLAD = {
  id: 'ballad', name: 'Slow ballad', ready: true, bpm: 68, swing: 0.5, mood: 'C', bars: 4,
  sounds: { drums: 'brushes', bass: 'round', chords: 'piano' },
  mix: mix({ pad: true }),
  ...bars(4, (b) => {
    const r = [0, 4, 5, 3][b], walk = [2, 6, 4, 1][b]; // C, G, Am, F; each bar's last note leads to the next root
    return {
      chords: [{ s: 0, degree: r, len: 8, vel: 0.5, tone: 0.5 }, { s: 8, degree: r, len: 8, vel: 0.35, tone: 0.5 }],
      bass: [note(0, r, 7, 0.8), note(8, r, 6, 0.6), note(14, walk, 2, 0.5)],
      drums: [
        hit('kick', 0, 0.5), hit('kick', 8, 0.35), hit('snare', 4, 0.45), hit('snare', 12, 0.45),
        ...[0, 2, 4, 6, 8, 10, 12, 14].map((s) => hit('hats', s, 0.2)),
      ],
    };
  }),
};

// The studio's ready-made beats, in the order its list shows them.
export const READY = [LOFI, BOSSA, FUNK, REGGAE, BALLAD];
export const readyBeat = (id) => READY.find((b) => b.id === id) ?? null;
export const LOFI_CLOCK = clockOf(LOFI);

// A beat of your own to change freely: a deep copy, never the ready-made one it came from (so it has
// no ready-made id).
export const cloneBeat = (beat) => ({ ...JSON.parse(JSON.stringify(beat)), id: null, ready: false });

// A blank beat, named `name`: 90 bpm, straight, A minor, 4 bars, the lo-fi's sounds, nothing in it.
export function blankBeat(name) {
  return {
    id: null, name, ready: false, bpm: 90, swing: 0.5, mood: 'A', bars: 4,
    sounds: { drums: 'lofi', bass: 'round', chords: 'epiano' }, mix: mix(), drums: [], bass: [], chords: [],
  };
}

// A beat read back from storage, checked from top to bottom: the beat as a beat of your own, or null
// if anything about it is off (it's ignored, and the game carries on).
export function cleanBeat(raw) {
  const num = (x, lo, hi) => typeof x === 'number' && Number.isFinite(x) && x >= lo && x <= hi;
  const int = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;
  const flag = (x) => typeof x === 'boolean';
  try {
    if (!raw || typeof raw !== 'object' || typeof raw.name !== 'string' || !raw.name || raw.name.length > 24) return null;
    if (!num(raw.bpm, 60, 140) || !num(raw.swing, 0.5, 0.75) || !MOODS.some((m) => m.id === raw.mood) || ![1, 2, 4].includes(raw.bars)) return null;
    const { sounds: so, mix: m } = raw;
    if (!KITS[so?.drums] || !BASSES[so?.bass] || !CHORD_SOUNDS[so?.chords]) return null;
    const parts = ['drums', 'bass', 'chords'];
    if (!m || !parts.every((p) => num(m.levels?.[p], 0, 1) && flag(m.muted?.[p])) || !num(m.pump, 0, 1) || !flag(m.pad) || !flag(m.vinyl)) return null;
    const end = raw.bars * 16;
    const ok = {
      drums: (h) => int(h.s, 0, end - 1) && ['kick', 'snare', 'hats', 'perc'].includes(h.drum) && num(h.vel, 0, 1),
      bass: (h) => int(h.s, 0, end - 1) && int(h.degree, -14, 21) && int(h.len, 1, 64) && num(h.vel, 0, 1) && num(h.tone, 0, 1),
      chords: (h) => int(h.s, 0, end - 1) && int(h.degree, -14, 21) && int(h.len, 1, 64) && num(h.vel, 0, 1) && num(h.tone, 0, 1)
        && (h.notes === undefined || (Array.isArray(h.notes) && h.notes.length > 0 && h.notes.every((n) => int(n, 0, 127))))
        && (h.name === undefined || typeof h.name === 'string'),
    };
    if (!parts.every((p) => Array.isArray(raw[p]) && raw[p].length <= 512 && raw[p].every((h) => h && ok[p](h)))) return null;
    return cloneBeat(raw);
  } catch {
    return null;
  }
}
