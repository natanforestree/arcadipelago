// Every number the rules, the crowd and the feel run on. The synth's voicing lives in audio.js, and a
// few view timings in scene.js and render.js. Times are in seconds unless a name says beats, bars or
// 16ths (a 16th note is the grid the crowd hears on). Positions are in scene pixels (the scene is
// 320x180). All of these are starting values: play-testing changes go here.
export const TICK_HZ = 60;
export const DT = 1 / TICK_HZ;

export const GROOVE = {
  setSeconds: 180, // a set lasts about this long, whatever its beat's tempo (beats.js setBars)
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

// The places to busk (places.js): who comes by at each, and how. What each kind of person likes is the
// same everywhere (crowd.js). A place sets:
//   kinds     how likely each kind is, in KINDS order (jogger, elder, student, commuter)
//   arrive    seconds between one arrival and the next: from, to
//   waves     null, or a station's trains: the first pulls in `first` seconds into the set and then one
//             every `every`, and `people` step off each, `gap` seconds apart (each [from, to])
//   onScreen  at most this many people at once
//   pace, patience  shares of each kind's own walking speed and patience (crowd's kinds)
//   stay      seconds a listener stays: from, to
//   tips      as TIPS
//   coins     false where nobody pays: each tip counts as the listener's fondness instead (crowd.js)
//   animals   true where animals come instead of people (animals.js), settling on ISLAND.spots
// The park's are CROWD's and TIPS's own, so a set there plays exactly as it always has.
export const PLACES = {
  park: {
    kinds: [1, 1, 1, 1], arrive: [CROWD.arriveMin, CROWD.arriveMax], waves: null, onScreen: CROWD.onScreen,
    pace: 1, patience: 1, stay: [CROWD.budgetMin, CROWD.budgetMax], tips: TIPS,
  },
  station: {
    kinds: [0, 0.15, 0.25, 0.6], arrive: [16, 22], onScreen: 8, pace: 1.15, patience: 0.7, stay: [40, 100],
    waves: { first: [6, 10], every: [32, 38], people: [3, 5], gap: [0.6, 1] },
    tips: { callback: 1, happy: 3, happyElder: 4, end: 1 },
  },
  market: {
    kinds: [0, 0.4, 0.4, 0.2], arrive: [4, 7], waves: null, onScreen: 6, pace: 0.7, patience: 1.5, stay: [90, 240],
    tips: { callback: 1, happy: 1, happyElder: 2, end: 1 },
  },
  // One Tree Island: animals instead of people, every kind as likely and as patient as in the park, but
  // fewer of them, and nobody pays.
  island: {
    kinds: [1, 1, 1, 1], arrive: [10, 16], waves: null, onScreen: 6, pace: 1, patience: 1,
    stay: [CROWD.budgetMin, CROWD.budgetMax], tips: TIPS, coins: false, animals: true,
  },
};

// One Tree Island. Its crowd: the line each sort of animal crosses along (animals.js cross): the land
// animals walk along the island at y 146, as people walk the park's path, the swimmers out on the lake
// behind it (behind the reeds, the rock and the rowboat on its shore), and the birds high up; and the
// eleven spots they settle on, [x, y of their feet, sort]: three in the pine, four on the grass round
// you, and four in the water just off the shore (two in the shallows, the rock and the lily pad).
// Its sunrise (scene.js and render.js), over the same PARK.bars as the park's evening: the sky lightens
// a band at a time from the horizon up, through its five stages; the sun comes up from behind the far
// pines, rising `sunRise` pixels from bar `sunFrom` to bar `sunTo`; the mist's `mist` streaks thin out
// one by one and are gone by bar `mistGone`; and a loud note makes the fish jump at `fish` (its x, and
// the water's y there), which then stays down PARK.pigeonsAway bars, as the pigeons stay away.
export const ISLAND = {
  sunFrom: 4, sunTo: 50, sunRise: 44, mist: 4, mistGone: 40, fish: [262, 124],
  lanes: { land: 146, water: 124, sky: 40 },
  spots: [
    [122, 93, 'pine'], [190, 77, 'pine'], [138, 61, 'pine'],
    [70, 158, 'grass'], [96, 165, 'grass'], [196, 165, 'grass'], [228, 158, 'grass'],
    [52, 134, 'shallows'], [214, 134, 'shallows'], [290, 133, 'rock'], [22, 136, 'lily'],
  ],
};

// The keepsakes (keepsakes.js): once you've found your first, a set on the island leaves another with a
// chance that rises with its fondness, up to `most` at `full` fondness. Tuned with the bots over seeds
// 1 to 200, with one keepsake found: the honest set is left one in 26% of sets (it wins 17 to 80
// fondness a set), in key but never bringing an idea back 4.5%, and random notes and the lick none.
// Your case holds `caseHolds`.
export const KEEPSAKE = { full: 30, most: 0.22, caseHolds: 3 };

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
// background. Its evening counts the park's own bars from a set's first note: PARK.bars of them over
// the whole set, however many bars the set's beat gives it, so the sun always sets across the set.
// (With the lo-fi's 60 bars, a park bar is a bar.) The pigeons stay away for bars of the beat itself.
// Seconds for the clouds, birds and pigeons' pecking run on the page's clock, so they carry on over
// the title and between sets.
export const PARK = {
  bars: 60, // the park's bars in a set
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

// The station's life (scene.js and render.js), over the same PARK.bars as the park's evening: the
// clock runs through the evening rush, and each of the crowd's trains (PLACES.station.waves) pulls in,
// stands with its doors open as its passengers step off, and pulls out. Its sky, through the glass
// roof and the arches, darkens as the park's does.
export const STATION = {
  clockFrom: 30, // minutes past five on the clock as a set starts...
  clockTo: 90, // ...and as it ends: half past six
  pullIn: 3, // seconds a train takes to pull in, before its doors open
  stand: 8, // seconds it stands with its doors open
  pullOut: 4, // seconds it takes to pull out
};

// The night market's life: from blue hour into night, its lanterns light one by one, and steam rises
// from the noodle stall. A cat sleeps by your case, and a loud note sends it off for the pigeons' 4 bars.
export const MARKET = {
  skyFrom: 2, // its sky starts at this stage of the park's (blue hour) and darkens with it to night
  lanternsFrom: 2, // the lanterns light one by one, the first at this bar...
  lanternsTo: 40, // ...the last at this one (of PARK.bars)
  steam: 0.5, // seconds each of the steam's two frames shows
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

// The studio (studio.js): your slots, how far back Undo goes, how late a press can be and still catch
// the 16th it just missed, how far ahead of the playhead a hold writes (just ahead of the sound; the
// band has scheduled further ahead still, so audio.js cuts what the band had on each 16th written and
// plays what's written, on its 16th), and how hard a held bass note and chord are played (a drum's is
// where you hold it).
export const STUDIO = {
  slots: 6,
  undo: 20,
  grace: 0.06, // seconds
  ahead: 0.05, // seconds
  vel: { bass: 0.8, chords: 0.5 },
  softest: 0.3, // a drum held at the pad's left; the right is 1
  name: 12, // the most letters a name you give a beat can have
  saved: 1.5, // seconds "saved" shows on the list after you name a beat
};

// The loop pedal (looper.js): a loop is one pass of the chords, up to `layers` deep, and a note up to
// `early` 16ths before a recording's first bar line still counts, played just as early.
export const LOOP = { bars: 4, layers: 3, early: 1 };
