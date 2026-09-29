// Every number the rules, the crowd and the feel run on. The synth's voicing lives in audio.js, and a
// few view timings in scene.js and render.js. Times are in seconds unless a name says beats, bars or
// 16ths (a 16th note is the grid the crowd hears on). Positions are in scene pixels (the scene is
// 320x180). All of these are starting values: play-testing changes go here.
export const TICK_HZ = 60;
export const DT = 1 / TICK_HZ;

export const GROOVE = {
  bpm: 80,
  swing: 0.58, // the second 16th of each pair lands at this share of the pair
  setBars: 60, // 15 times round the 4-bar loop: 3 minutes
  ahead: 0.2, // seconds of band scheduled ahead of the audio clock
  layerLead: 0.25, // seconds before a bar line that its layers are decided (more than `ahead`)
  applause: 1, // seconds of applause after the band's fade, before the end card
};

export const PLAY = {
  octaveMin: -2,
  octaveMax: 1,
  strengthMin: 1,
  strengthMax: 4,
  strengthStart: 3,
  lowest: 40, // E2: the guitar's range, in MIDI notes
  highest: 88, // E6
  strumWindow: 0.03, // keys pressed this close together are a strum...
  strumGap: 0.012, // ...and sound this far apart
  damp: 0.08, // a released string is quiet after about this long
  ring: 4, // a string left ringing loses 60 dB over this long (it's inaudible a little sooner)
  legatoGain: 0.7, // a hammer-on's loudness next to a picked note
};

// What the crowd's ears notice (listen.js).
export const RULES = {
  gapCap: 8, // a shape's gaps are capped at this many 16ths
  repeatWindow: 16, // notes: a shape's 3rd time among the last this-many is a Repeat
  repeatTimes: 3,
  phraseEndBeats: 1, // no key held and no new note for this long ends a phrase
  phraseMinNotes: 3, // a clean phrase needs this many notes to please anyone
  offKeyShare: 0.25, // more than this share of a phrase's strong-beat notes outside the key is Off key
  offKeyMinStrong: 4, // at a bar line, a phrase still going is judged once it has this many strong-beat notes
  colourWithin: 4, // 16ths: an outside note that steps to an in-key note this soon is a colour note
  ideaMinNotes: 4, // a phrase needs this many notes to leave an idea in the memory strip
  stripSize: 6,
  callbackAge: 8, // bars: an idea must be at least this old to be called back or recognised
  callbackEvery: 16, // bars: each idea earns a callback at most once in this many
  randomBars: 16, // Random: over this many bars...
  randomNotes: 32, // ...at least this many notes, and no shape twice
  silenceBars: 4, // more than this many bars without a note is Silence
  loudStrength: 4,
  joggerNotes: 8, // Energy: at least this many notes in the bar (2 a beat)
  elderRest: 4, // Space: a stretch of at least this many 16ths with no new note in the bar
  studentShare: 1 / 3, // Groove: at least this share of the bar's notes on off 16ths...
  studentMin: 3, // ...out of at least this many
};

// How much each thing moves a listener's interest (0 to 1).
export const INTEREST = {
  start: 0.3, // a passer-by's interest as they come into earshot
  draw: 0.05, // plus this for each listener already stopped
  hook: 0.5, // a passer-by at this stops to listen
  bored: 0.2, // below this, anyone leaves
  happy: 0.5, // above this when their time is up, they tip as they go
  fade: 0.01, // lost every second, because nobody listens forever
  phrase: 0.05,
  taste: 0.1,
  callback: 0.3,
  recognised: 0.05,
  repeat: -0.15,
  offKey: -0.1,
  // The spec started this at -0.15. In the prototype, a player in key who never repeated a figure exactly
  // then lost every listener, as badly as the random bot; at -0.05 they earn about half what the
  // honest set does, and the random bot still earns almost nothing.
  random: -0.05,
  silence: -0.1,
  loud: -0.05,
};

export const CROWD = {
  width: 320, // the path runs across the whole scene
  edge: 16, // people appear and vanish this far off each side
  playerX: 136, // where you sit
  earshot: 100, // passers-by within this distance of you are listening
  firstArrival: 2, // seconds into the set
  arriveMin: 6, // then one every this many...
  arriveMax: 10, // ...to this many seconds
  onScreen: 6, // at most this many people at once
  listenSlow: 0.4, // a listening passer-by slows to this share of their pace
  budgetMin: 60, // a listener's time to stay: from this...
  budgetMax: 180, // ...to this many seconds
  // Where listeners stand, in an arc round you: [x, y of their feet].
  spots: [[64, 150], [84, 156], [104, 162], [186, 162], [206, 156], [226, 150]],
  kinds: {
    jogger: { speed: 60, patience: 6 },
    elder: { speed: 18, patience: 12 },
    student: { speed: 30, patience: 8 },
    commuter: { speed: 45, patience: 6 },
  },
};

export const TIPS = { callback: 1, happy: 2, happyElder: 3, end: 1 };

// The band's layers, and how many listeners each needs. A layer drops out only after the crowd has
// stayed below its number for LAYER_HOLD whole bars.
export const LAYERS = [
  { id: 'keys', min: 0 }, // electric piano and crackle
  { id: 'drums', min: 1 }, // kick and snare
  { id: 'bass', min: 3 },
  { id: 'top', min: 5 }, // hats, pad and tape wobble
];
export const LAYER_HOLD = 2;

export const LOG_SIZE = 50; // sets kept in the test log

// The park's life (scene.js and render.js): the sunset over each set, and what moves in the
// background. Bars count from a set's first note; seconds for the clouds, birds and pigeons' pecking
// run on the page's clock, so they carry on over the title and between sets.
export const PARK = {
  stageBars: 15, // the sky moves on a stage (dusk 0 to night 4) every this many bars...
  bandFirst: 3, // ...its top band first, this many bars into the stage...
  bandStep: 2, // ...then each band below it this many bars later, so the horizon's is the last
  sunGone: 36, // the sun has sunk behind the rooftops by this bar...
  sunSink: 17, // ...this many pixels below where it starts
  windowsFrom: 10, // each window lights at its own bar between these two
  windowsTo: 50,
  lampOn: 24, // the lamp comes on at this bar, and its pool of light on the path
  starsFrom: 45, // the stars come out one a bar from this bar
  trainFrom: 10, // the distant train passes once a set, at a bar between these two...
  trainTo: 50,
  trainCross: 6, // ...taking this many seconds to cross
  clouds: [2, 4], // pixels a second: the far clouds, then the near ones
  flockFirst: [5, 15], // seconds: the first flock of birds crosses this long after the page opens...
  flockEvery: [20, 40], // ...then another every this many seconds
  flockMost: 5, // birds in a flock: 1 to this many
  flockCross: 8, // seconds a flock takes to cross
  pigeonsAway: 4, // bars the pigeons stay away after a loud note scatters them
};

// The music shop (gear.js): what each thing costs in coins, and the key that stomps each pedal. The
// pedals are listed in the order they chain, overdrive first, which is also the order of their keys.
// The loop pedal is worked with R and Backspace instead.
export const SHOP = {
  overdrive: { price: 40, key: 2 },
  chorus: { price: 50, key: 3 },
  tremolo: { price: 50, key: 4 },
  delay: { price: 70, key: 5 },
  reverb: { price: 80, key: 6 },
  loop: { price: 100 },
  ukulele: { price: 60 },
  electric: { price: 150 },
  epiano: { price: 200 },
  synth: { price: 250 },
};

// The loop pedal (looper.js): a loop is one pass of the chords, up to `layers` deep, and a note up to
// `early` 16ths before a recording's first bar line still counts, played just as early.
export const LOOP = { bars: 4, layers: 3, early: 1 };
