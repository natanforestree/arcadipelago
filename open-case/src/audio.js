// All of Open Case's sound, made live with Web Audio (there are no audio files).
//   - Your instrument. The guitars are plucked-string synths (Karplus-Strong): each note's samples are
//     worked out the first time it's played and kept, so a key press only starts a buffer and it
//     sounds at once. The electric piano and the synth are made from oscillators as each note starts.
//   - Your pedals, between your instrument and the speakers, chained in the usual order: overdrive,
//     chorus, tremolo, delay, reverb. A stomp fades a pedal in or out over a few milliseconds.
//   - The band: electric piano, drums, bass, hats and pad from groove.js's patterns, scheduled a
//     little ahead of the audio clock, as Last Light's score is. Each layer plays into its own bus
//     (its slot): switching a layer is a fade on that bus at a bar line.
//   - Your loop (looper.js): its notes are scheduled a moment ahead with the band's, each a voice of
//     its own through your instrument and pedals, and they fade and stop with the band.
//   - Vinyl crackle, a dusty filter over the band, the tape wobble, coins landing and applause.
//   - A safety before the speakers, so a loop stacked on your playing can't clip.
// Browsers only allow sound after a key press or click, so start() is called from inside one
// (main.js). M mutes; the volume and mute are remembered.
import { bandAt, timeOf16th, midiToHz, BAR, BEAT } from './groove.js';
import { LAYERS, PLAY, GROOVE } from './tuning.js';
import { PEDALS } from './gear.js';

const MUTE_KEY = 'open-case-muted', VOLUME_KEY = 'open-case-volume';
const PICK = [0.35, 0.55, 0.8, 1]; // loudness by pick strength 1-4
const BRIGHT = [0.2, 0.35, 0.55, 0.8]; // the acoustic's pick's brightness by strength
const BAND_LEVEL = 0.55; // the band bus's level under your instrument
const TRY_LEVEL = 0.35; // ...and in the shop, where the electric piano plays alone while you try the loop pedal
// The percussion standing in for the drums: on only while the drums slot is off. Lo-fi and soft, not
// a metronome: a shaker, a finger snap and a low tap, not a beeping tone.
const PERC_SHAKER_HZ = 7000; // the shaker: bright but soft noise
const PERC_SHAKER_LEVEL = 0.24;
const PERC_SHAKER_ATTACK = 0.015; // a soft attack, so it swishes rather than clicks
const PERC_SNAP_HZ = 2400; // the finger snap: a crisp noise band...
const PERC_SNAP_TONE_HZ = 1200; // ...with a touch of tone
const PERC_SNAP_LEVEL = 0.32;
const PERC_TAP_HZ = 95; // the low tap: a soft thud, like a hand on the guitar's body
const PERC_TAP_DROP_HZ = 55; // ...its pitch dropping quickly
const PERC_TAP_LEVEL = 0.4;

// Each instrument's voicing. `pluck` is a guitar's string: how long it rings (seconds to fall 60 dB), its pick's
// brightness by strength, where the pick meets the string (a share of its length from the bridge),
// and how much its highs outlast a plain string's (the loop filter's stretch: 0.5 is plain, lower
// rings brighter). `level` evens out their loudness; `release` is how long a note takes to fall quiet
// once its key is up; `tone` is the filters that shape each before the pedals: [type, Hz, dB].
export const VOICING = {
  acoustic: {
    pluck: { ring: PLAY.ring, bright: BRIGHT, pick: 0.13, stretch: 0.5 },
    level: 0.9, release: PLAY.damp, tone: [['peaking', 180, 4], ['lowpass', 5200]],
  },
  ukulele: {
    pluck: { ring: 1.5, bright: [0.3, 0.45, 0.65, 0.85], pick: 0.2, stretch: 0.5 },
    level: 1, release: PLAY.damp, tone: [['highpass', 200], ['peaking', 1000, 3], ['lowpass', 6500]],
  },
  electric: {
    pluck: { ring: 6, bright: [0.15, 0.25, 0.4, 0.6], pick: 0.22, stretch: 0.35 },
    level: 0.8, release: PLAY.damp, tone: [['highpass', 90], ['peaking', 1400, 3], ['lowpass', 4000]],
  },
  epiano: { level: 0.9, release: 0.2, tone: [['peaking', 250, 2], ['lowpass', 6000]] },
  synth: { level: 0.8, release: 0.25, tone: [['lowpass', 7000]] },
};
// The electric piano: a sine bent by a second sine at its pitch, the tine's bite fading into a round
// tone, with a bell an octave and a fifth up at the very start.
const EP_LEVEL = 0.13;
const EP_BITE = [0.5, 2]; // how far the second sine bends the first, from the softest pick to the hardest (x pitch)
const EP_MELLOW = 0.15; // ...and where it settles (x pitch)
const EP_FADE = 1.2; // seconds: a middle C fades by 63% in this long; higher notes fade faster
const EP_BELL = 0.12; // the bell's level next to the note
// The synth: two sawtooths a few cents apart and a square an octave down (type, pitch ratio, cents,
// level), through a low-pass filter that opens as a key goes down, then settles.
const SYNTH_OSCS = [['sawtooth', 1, -7, 0.5], ['sawtooth', 1, 7, 0.5], ['square', 0.5, 0, 0.2]];
const SYNTH_LEVEL = 0.22;
const SYNTH_OPEN = [3, 13]; // the filter opens to this many times the pitch, softest to hardest...
const SYNTH_REST = [1.5, 4.5]; // ...and settles here
const SYNTH_Q = 2;

// The pedals.
const PEDAL_FADE = 0.008; // seconds: a stomp's fade (its time constant)
const OD_DRIVE = 2.5; // the overdrive's gain into the clipper: a soft pick is barely touched, a hard one crunches
const OD_CURVE = 3; // how round the clipping is
const OD_TONE = 2600; // Hz: the overdrive's darker tone
const OD_LEVEL = 0.16; // its level: a soft pick comes out about as loud as with the pedal off
const CHORUS_DELAY = 0.012; // seconds: the copy's delay...
const CHORUS_DEPTH = 0.003; // ...wobbling this much either way...
const CHORUS_RATE = 0.8; // ...this many times a second
const CHORUS_MIX = 0.6; // the copy's level; your own sound drops to CHORUS_DRY under it
const CHORUS_DRY = 0.8;
const TREMOLO_DEPTH = 0.35; // the volume swings this share either way, on the 8th notes
const DELAY_TIME = BEAT * 0.75; // a dotted 8th
const DELAY_FEEDBACK = 0.38; // each echo is this loud next to the one before...
const DELAY_MIX = 0.45; // ...and the first this loud next to your note
const DELAY_TONE = 2800; // Hz: each echo a little darker
const REVERB_TIME = 2.4; // seconds for the hall to fall 60 dB
const REVERB_MIX = 0.5;

// Your loop sits a little under your live playing.
const LOOP_LEVEL = 0.8;
// The safety before the speakers: everything passes untouched up to SAFE_KNEE (about -3 dB; the
// game's own sound peaks around there, a hard chord at the default volume), and louder peaks round
// off toward SAFE_CEILING, up to SAFE_HEADROOM times over full scale (+12 dB: three layers of a hard
// chord on top of the same chord played live). The ceiling is a hair under full scale because the
// shaper's own smoothing overshoots it a little.
const SAFE_KNEE = 0.7;
const SAFE_CEILING = 0.95;
const SAFE_HEADROOM = 4;

// A plucked string's samples: up to `ring` + 0.3 seconds of a string at `hz`, picked at strength 1-4,
// cut short once it's inaudible. Karplus-Strong with an all-pass for exact tuning; the loop loses
// enough each period for the fundamental to fall 60 dB over `ring`.
export function pluckSamples(rate, hz, strength = 3, { ring = PLAY.ring, bright = BRIGHT, pick = 0.13, stretch = 0.5 } = {}) {
  const period = rate / hz;
  const n = Math.max(2, Math.floor(period - stretch - 0.1));
  const frac = period - stretch - n; // the loop filter delays by `stretch` samples; the all-pass the rest
  const c = (1 - frac) / (1 + frac);
  const loss = Math.pow(10, -3 / (ring * hz));
  // The pick: noise, smoothed more for a softer pick, with the notch of plucking near the bridge.
  const line = new Float32Array(n);
  let seed = 12345 + Math.round(hz * 7), y = 0, mean = 0;
  const b = bright[strength - 1];
  for (let i = 0; i < n; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    y += b * ((seed / 4294967296) * 2 - 1 - y);
    line[i] = y;
  }
  const notch = Math.max(1, Math.round(n * pick));
  for (let i = n - 1; i >= notch; i--) line[i] -= line[i - notch];
  for (let i = 0; i < n; i++) mean += line[i] / n;
  let peak = 1e-9;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs((line[i] -= mean)));
  for (let i = 0; i < n; i++) line[i] *= 0.5 / peak;
  const out = new Float32Array(Math.ceil(rate * (ring + 0.3)));
  let idx = 0, last = 0, apIn = 0, apOut = 0, loud = 0;
  for (let i = 0; i < out.length; i++) {
    const x = line[idx];
    out[i] = x;
    loud = Math.max(loud, Math.abs(x));
    if ((i & 1023) === 1023) {
      if (loud < 3e-4) return out.slice(0, i + 1); // about 65 dB down: silent
      loud = 0;
    }
    const avg = loss * ((1 - stretch) * x + stretch * last);
    last = x;
    apOut = c * avg + apIn - c * apOut;
    apIn = avg;
    line[idx] = apOut;
    idx = idx + 1 === n ? 0 : idx + 1;
  }
  return out;
}

// The safety's curve, for input scaled down by SAFE_HEADROOM: back up to the sound's own level, then
// straight through up to SAFE_KNEE, and rounding off smoothly above it, never past SAFE_CEILING.
export function safetyCurve(n = 4097) {
  const curve = new Float32Array(n), room = SAFE_CEILING - SAFE_KNEE;
  for (let i = 0; i < n; i++) {
    const x = SAFE_HEADROOM * ((i / (n - 1)) * 2 - 1), a = Math.abs(x);
    curve[i] = Math.sign(x) * (a <= SAFE_KNEE ? a : SAFE_KNEE + room * Math.tanh((a - SAFE_KNEE) / room));
  }
  return curve;
}

// The overdrive's clipping curve: straight for quiet input, rounding off smoothly toward +-1.
export function softClip(k = OD_CURVE, n = 1025) {
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) curve[i] = Math.tanh(k * ((i / (n - 1)) * 2 - 1)) / Math.tanh(k);
  return curve;
}

export function createAudio(storage) {
  let ctx = null, master = null, band = null, noise = null, wobble = null;
  const bus = {}; // a gain per layer: the layer slots
  const inputs = {}; // a gain per instrument, into its tone filters and on into the pedals
  const loopIns = {}; // a gain per instrument for your loop's notes, into its input: the loop's fade
  const pedals = {}; // id -> { input, output, set(on, at) }
  let tremoloDepth = null, tremoloWave = null;
  let instrument = 'acoustic';
  const pedalOn = Object.fromEntries(PEDALS.map((id) => [id, false]));
  const plucks = new Map(); // `${pitch}:${strength}` -> AudioBuffer, for the instrument you play
  const voices = new Map(); // key code -> the voice sounding: { g, sources, release }
  const looped = new Set(); // your loop's voices, sounding or about to: { g, sources, release, start, end, layer }
  const ringing = new Set(); // voices whose key is up but Space holds them
  let ring = false;
  let muted = storage.get(MUTE_KEY) === '1';
  let volume = Number(storage.get(VOLUME_KEY) ?? 0.8);
  if (!(volume >= 0 && volume <= 1)) volume = 0.8;
  let loopAt = -1, next16 = 0, stopAt = Infinity, crackleAt = 0;
  let loopDone = 0; // your loop's notes are scheduled up to this band time
  const level = () => (muted ? 0 : volume);

  function start() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return;
    }
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return;
    ctx = new AC({ latencyHint: 'interactive' }); // the lowest delay the browser can keep up with
    master = ctx.createGain();
    master.gain.value = level();
    // The dusty filter over the band: no deep lows, soft highs.
    const hp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 70;
    lp.type = 'lowpass';
    lp.frequency.value = 3200;
    band = ctx.createGain();
    band.gain.value = BAND_LEVEL;
    band.connect(hp).connect(lp).connect(master);
    for (const { id, min } of LAYERS) {
      bus[id] = ctx.createGain();
      bus[id].gain.value = min === 0 ? 1 : 0;
      bus[id].connect(band);
    }
    // The stand-in percussion's own bus: not a crowd layer (never in LAYERS), gated the opposite of
    // the drums slot in setLayer. The drums start off, so it starts on.
    bus.perc = ctx.createGain();
    bus.perc.gain.value = 1;
    bus.perc.connect(band);
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // Your pedals, in chain order, into the speakers; and each instrument through its own tone into
    // the first pedal. Your instrument sits a little brighter than the band, so it stands out.
    Object.assign(pedals, { overdrive: overdrive(), chorus: chorus(), tremolo: tremolo(), delay: delay(), reverb: reverb() });
    PEDALS.forEach((id, i) => {
      pedals[id].input.pedal = id; // named, so the tests can follow the chain
      pedals[id].output.connect(i + 1 < PEDALS.length ? pedals[PEDALS[i + 1]].input : master);
      if (pedalOn[id]) pedals[id].set(true, ctx.currentTime);
    });
    for (const [id, { level: gain, tone: filters }] of Object.entries(VOICING)) {
      inputs[id] = ctx.createGain();
      inputs[id].gain.value = gain;
      let node = inputs[id];
      for (const [type, hz, db] of filters) {
        const f = ctx.createBiquadFilter();
        f.type = type;
        f.frequency.value = hz;
        if (db) f.gain.value = db;
        node = node.connect(f);
      }
      node.connect(pedals[PEDALS[0]].input);
      loopIns[id] = ctx.createGain();
      loopIns[id].gain.value = LOOP_LEVEL;
      loopIns[id].connect(inputs[id]);
    }
    newTremoloWave(ctx.currentTime);
    // The safety between everything and the speakers.
    const headroom = ctx.createGain(), safety = ctx.createWaveShaper();
    headroom.gain.value = 1 / SAFE_HEADROOM;
    safety.curve = safetyCurve();
    safety.oversample = '4x'; // rounding off peaks makes highs that would otherwise fold back down as noise
    master.connect(headroom).connect(safety).connect(ctx.destination);
    // The tape wobble: a slow wave on the keys' and pad's pitch, off until the top layer joins.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.55;
    wobble = ctx.createGain();
    wobble.gain.value = 0;
    lfo.connect(wobble);
    lfo.start();
    // A quiet hiss under the crackle, part of the keys layer.
    const hiss = ctx.createBufferSource(), hf = ctx.createBiquadFilter(), hg = ctx.createGain();
    hiss.buffer = noise;
    hiss.loop = true;
    hf.type = 'bandpass';
    hf.frequency.value = 4000;
    hf.Q.value = 0.5;
    hg.gain.value = 0.02;
    hiss.connect(hf).connect(hg).connect(bus.keys);
    hiss.start();
  }

  const now = () => (ctx ? ctx.currentTime : 0);

  // The pedals. Each is a little graph from `input` to `output`; set(on, at) fades its effect in or
  // out, so a stomp never clicks and the sound never drops out.
  const fade = (param, value, at) => param.setTargetAtTime(value, at, PEDAL_FADE);

  // Overdrive: soft clipping, which a harder pick drives further, then a darker tone. It takes over
  // from your clean sound.
  function overdrive() {
    const input = ctx.createGain(), output = ctx.createGain(), clean = ctx.createGain(), driven = ctx.createGain();
    const drive = ctx.createGain(), clip = ctx.createWaveShaper(), dark = ctx.createBiquadFilter();
    drive.gain.value = OD_DRIVE;
    clip.curve = softClip();
    clip.oversample = '4x'; // clipping makes highs that would otherwise fold back down as harsh noise
    dark.type = 'lowpass';
    dark.frequency.value = OD_TONE;
    driven.gain.value = 0;
    input.connect(clean).connect(output);
    input.connect(drive).connect(clip).connect(dark).connect(driven).connect(output);
    return {
      input, output,
      set(on, at) {
        fade(clean.gain, on ? 0 : 1, at);
        fade(driven.gain, on ? OD_LEVEL : 0, at);
      },
    };
  }

  // Chorus: a copy of your sound a few milliseconds late, the delay slowly wobbling, mixed in.
  function chorus() {
    const input = ctx.createGain(), output = ctx.createGain(), dry = ctx.createGain(), copy = ctx.createGain();
    const late = ctx.createDelay(0.05), lfo = ctx.createOscillator(), depth = ctx.createGain();
    late.delayTime.value = CHORUS_DELAY;
    lfo.frequency.value = CHORUS_RATE;
    depth.gain.value = CHORUS_DEPTH;
    lfo.connect(depth).connect(late.delayTime);
    lfo.start();
    copy.gain.value = 0;
    input.connect(dry).connect(output);
    input.connect(late).connect(copy).connect(output);
    return {
      input, output,
      set(on, at) {
        fade(dry.gain, on ? CHORUS_DRY : 1, at);
        fade(copy.gain, on ? CHORUS_MIX : 0, at);
      },
    };
  }

  // Tremolo: the volume swinging either side of where it was, on the 8th notes, so switching it on
  // doesn't make you quieter. The wave comes from newTremoloWave, which lines it up with the band.
  function tremolo() {
    const amp = ctx.createGain();
    tremoloDepth = ctx.createGain();
    tremoloDepth.gain.value = 0;
    tremoloDepth.connect(amp.gain);
    return { input: amp, output: amp, set: (on, at) => fade(tremoloDepth.gain, on ? TREMOLO_DEPTH : 0, at) };
  }

  // A new wave for the tremolo, a cosine at the 8th notes' rate starting at `at` (the band's first
  // 16th, or any moment when there's no band), so its peaks land on the 8ths. The old wave plays
  // until the new one takes over.
  function newTremoloWave(at) {
    const wave = ctx.createOscillator();
    wave.setPeriodicWave(ctx.createPeriodicWave(new Float32Array([0, 1]), new Float32Array([0, 0])));
    wave.frequency.value = 2 / BEAT;
    wave.connect(tremoloDepth);
    wave.start(at);
    tremoloWave?.stop(at);
    tremoloWave = wave;
  }

  // Delay: echoes on the dotted 8th, each a little quieter and darker. Switched off, it stops taking
  // in new notes, and the echoes already going fade away on their own.
  function delay() {
    const input = ctx.createGain(), output = ctx.createGain(), send = ctx.createGain(), wet = ctx.createGain();
    const line = ctx.createDelay(2), dark = ctx.createBiquadFilter(), again = ctx.createGain();
    send.gain.value = 0;
    line.delayTime.value = DELAY_TIME;
    dark.type = 'lowpass';
    dark.frequency.value = DELAY_TONE;
    again.gain.value = DELAY_FEEDBACK;
    wet.gain.value = DELAY_MIX;
    input.connect(output);
    input.connect(send).connect(line).connect(dark).connect(again).connect(line);
    dark.connect(wet).connect(output);
    return { input, output, set: (on, at) => fade(send.gain, on ? 1 : 0, at) };
  }

  // Reverb: a warm hall behind your notes. Like the delay, switching it off lets the hall die away.
  function reverb() {
    const input = ctx.createGain(), output = ctx.createGain(), send = ctx.createGain(), wet = ctx.createGain();
    const hall = ctx.createConvolver();
    send.gain.value = 0;
    hall.normalize = false; // hallSound scales it
    hall.buffer = hallSound();
    wet.gain.value = REVERB_MIX;
    input.connect(output);
    input.connect(send).connect(hall).connect(wet).connect(output);
    return { input, output, set: (on, at) => fade(send.gain, on ? 1 : 0, at) };
  }

  // The hall's echo, worked out once at the start: two channels of noise dying away over REVERB_TIME,
  // after a moment's silence, its highs dying first, so it sounds warm. It's scaled so the whole
  // echo carries as much energy as the note that set it off (the browser's own scaling would leave
  // it far quieter), and REVERB_MIX sets how loud it is.
  function hallSound() {
    const rate = ctx.sampleRate, n = Math.floor(rate * REVERB_TIME), gap = Math.floor(rate * 0.012);
    const hall = ctx.createBuffer(2, n, rate);
    for (let c = 0; c < 2; c++) {
      const d = hall.getChannelData(c);
      let y = 0, energy = 0;
      for (let i = gap; i < n; i++) {
        const k = 0.85 * Math.min(1, (i / n) * 1.5); // smoothed more as it goes: darker...
        y = k * y + (1 - k) * (Math.random() * 2 - 1);
        d[i] = y * Math.sqrt((1 + k) / (1 - k)) * Math.exp((-6.9 * i) / n); // ...but no quieter for it
        energy += d[i] * d[i];
      }
      const scale = 1 / Math.sqrt(energy || 1);
      for (let i = gap; i < n; i++) d[i] *= scale;
    }
    return hall;
  }

  function bufferFor(pitch, strength) {
    const key = `${pitch}:${strength}`;
    let buf = plucks.get(key);
    if (!buf) {
      const data = pluckSamples(ctx.sampleRate, midiToHz(pitch), strength, VOICING[instrument].pluck);
      buf = ctx.createBuffer(1, data.length, ctx.sampleRate);
      buf.getChannelData(0).set(data);
      plucks.set(key, buf);
    }
    return buf;
  }

  // Works out a range of notes' samples ahead of time (in idle moments), so no key press waits. Only
  // the guitars need it: the keyboards are made on the spot.
  function warm(pitches, strength) {
    if (ctx && VOICING[instrument].pluck) for (const p of pitches) bufferFor(p, strength);
  }

  // The voices, one per note: each starts at `at` into `to` (its instrument's input, or the loop's way
  // into it) and returns what damp() needs to stop it, { g: its gain, sources: what to stop }.
  function pluckVoice(pitch, strength, at, legato, to) {
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = bufferFor(pitch, strength);
    g.gain.value = PICK[strength - 1] * (legato ? PLAY.legatoGain : 1);
    src.connect(g).connect(to);
    src.start(at, legato ? 0.012 : 0); // a hammer-on has no pick attack
    return { g, sources: [src] };
  }

  function epianoVoice(pitch, strength, at, legato, to) {
    const f = midiToHz(pitch), vel = PICK[strength - 1] * (legato ? PLAY.legatoGain : 1);
    const note = ctx.createOscillator(), bend = ctx.createOscillator(), bite = ctx.createGain(), g = ctx.createGain();
    const bell = ctx.createOscillator(), ding = ctx.createGain();
    note.frequency.value = f;
    bend.frequency.value = f;
    bite.gain.setValueAtTime(f * (EP_BITE[0] + (EP_BITE[1] - EP_BITE[0]) * vel), at);
    bite.gain.setTargetAtTime(f * EP_MELLOW, at, 0.3);
    bend.connect(bite).connect(note.frequency);
    bell.frequency.value = f * 3;
    ding.gain.setValueAtTime(EP_BELL * vel, at);
    ding.gain.setTargetAtTime(0, at, 0.04);
    const decay = EP_FADE * Math.min(1.5, Math.sqrt(262 / f)); // higher notes die sooner
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(vel * EP_LEVEL, at + 0.003);
    g.gain.setTargetAtTime(0, at + 0.003, decay);
    note.connect(g).connect(to);
    bell.connect(ding).connect(g);
    const sources = [note, bend, bell];
    for (const o of sources) {
      o.start(at);
      o.stop(at + decay * 7); // by then it's 60 dB down
    }
    return { g, sources };
  }

  function synthVoice(pitch, strength, at, legato, to) {
    const f = midiToHz(pitch), vel = PICK[strength - 1];
    const filter = ctx.createBiquadFilter(), g = ctx.createGain(), sources = [];
    const between = ([lo, hi]) => f * (lo + (hi - lo) * vel);
    const rest = Math.min(9000, between(SYNTH_REST));
    filter.type = 'lowpass';
    filter.Q.value = SYNTH_Q;
    filter.frequency.setValueAtTime(legato ? rest : Math.min(14000, between(SYNTH_OPEN)), at);
    filter.frequency.setTargetAtTime(rest, at, 0.12);
    for (const [type, ratio, cents, gain] of SYNTH_OSCS) {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = type;
      o.frequency.value = f * ratio;
      o.detune.value = cents;
      og.gain.value = gain;
      o.connect(og).connect(filter);
      o.start(at);
      sources.push(o);
    }
    const loud = vel * SYNTH_LEVEL * (legato ? PLAY.legatoGain : 1);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(loud, at + 0.01);
    g.gain.setTargetAtTime(loud * 0.75, at + 0.01, 0.3);
    filter.connect(g).connect(to);
    return { g, sources };
  }

  const VOICES = { acoustic: pluckVoice, ukulele: pluckVoice, electric: pluckVoice, epiano: epianoVoice, synth: synthVoice };

  function noteOn(code, pitch, strength, at, legato) {
    if (!ctx) return;
    noteOff(code, at); // the same key again: the old note stops
    const start = Math.max(at, ctx.currentTime);
    // A re-struck pitch still ringing from Space (a different key code, since noteOff above already
    // moved this one on): damp it too, so repeats replace their ringing self instead of stacking.
    for (const v of ringing) {
      if (v.pitch === pitch) {
        ringing.delete(v);
        damp(v, start);
      }
    }
    const voice = VOICES[instrument](pitch, strength, start, legato, inputs[instrument]);
    voices.set(code, { ...voice, release: VOICING[instrument].release, pitch, start });
  }

  // Damps a voice from `at`, but never before it actually starts: a strummed note can be released
  // before its own delayed start, and starting the fade early would be undone by the attack's later
  // automation, then cut off with a click.
  function damp(v, at) {
    const t = Math.max(at, ctx.currentTime, v.start);
    v.g.gain.setTargetAtTime(0, t, v.release / 4);
    for (const src of v.sources) {
      try {
        src.stop(t + v.release * 2);
      } catch {
        // an older browser that allows only one stop: the electric piano's own stop stands
      }
    }
  }

  function noteOff(code, at) {
    const v = voices.get(code);
    if (!v) return;
    voices.delete(code);
    if (ring) ringing.add(v);
    else damp(v, at);
  }

  // Space: while it's held, released notes ring on (the keyboards' sustain pedal); letting go damps them.
  function setRing(on) {
    ring = on;
    if (!on && ctx) {
      for (const v of ringing) damp(v, ctx.currentTime);
      ringing.clear();
    }
  }

  // The instrument your next notes play. Notes already sounding carry on. Returns whether it changed
  // (the guitars' samples then need working out again: see warm).
  function setInstrument(id) {
    if (!(id in VOICING) || id === instrument) return false;
    instrument = id;
    plucks.clear(); // only the instrument you play keeps its samples, so memory stays small
    return true;
  }

  // Switches a pedal on or off, fading from `at`. Before the sound starts, it's remembered for start().
  function setPedal(id, on, at = now()) {
    if (!(id in pedalOn) || pedalOn[id] === on) return;
    pedalOn[id] = on;
    if (ctx) pedals[id].set(on, Math.max(at, ctx.currentTime));
  }

  function tone(out, t, { len, type = 'sine', freq, to, vol, attack = 0.005, detune = false }) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + len);
    if (detune) wobble.connect(o.detune);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + len + 0.05);
    return o;
  }
  function burst(out, t, { len, type = 'bandpass', freq, q = 1, vol, attack = 0 }) {
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noise;
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    if (attack > 0) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + attack); // a soft onset, for the shaker's swish
    } else {
      g.gain.setValueAtTime(vol, t);
    }
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    src.connect(f).connect(g).connect(out);
    src.start(t, Math.random() * 1.5, len + 0.05);
  }

  // One band note into its layer's bus. len is in seconds.
  function playBand(layer, n, t, len) {
    const out = bus[layer], f = midiToHz(n.note);
    switch (n.voice) {
      case 'ep': {
        // A soft electric piano: a sine with a sine modulating it, the tine's bite dying away.
        const mod = ctx.createOscillator(), depth = ctx.createGain();
        mod.frequency.value = f;
        depth.gain.setValueAtTime(f * 1.4, t);
        depth.gain.exponentialRampToValueAtTime(f * 0.2, t + 0.6);
        const car = tone(out, t, { len, freq: f, vol: n.vel * 0.12, attack: 0.004, detune: true });
        mod.connect(depth).connect(car.frequency);
        wobble.connect(mod.detune);
        mod.start(t);
        mod.stop(t + len + 0.05);
        break;
      }
      case 'kick':
        tone(out, t, { len: 0.35, freq: 110, to: 42, vol: n.vel * 0.9 });
        break;
      case 'snare':
        burst(out, t, { len: 0.18, freq: 1800, q: 0.7, vol: n.vel * 0.5 });
        tone(out, t, { len: 0.09, type: 'triangle', freq: 190, vol: n.vel * 0.25 });
        break;
      case 'hat':
        burst(out, t, { len: 0.04, type: 'highpass', freq: 7000, vol: n.vel * 0.3 });
        break;
      case 'bass':
        tone(out, t, { len, type: 'triangle', freq: f, vol: n.vel * 0.45, attack: 0.01 });
        break;
      case 'pad':
        tone(out, t, { len, type: 'sawtooth', freq: f, vol: n.vel * 0.03, attack: 0.4, detune: true });
        tone(out, t, { len, type: 'sawtooth', freq: f * 1.004, vol: n.vel * 0.03, attack: 0.4, detune: true });
        break;
      case 'shaker': // bright but soft noise, with a swish rather than a click
        burst(out, t, { len: 0.05, type: 'bandpass', freq: PERC_SHAKER_HZ, q: 0.7, vol: n.vel * PERC_SHAKER_LEVEL, attack: PERC_SHAKER_ATTACK });
        break;
      case 'snap': // a crisp noise burst with a touch of tone, not loud
        burst(out, t, { len: 0.03, type: 'bandpass', freq: PERC_SNAP_HZ, q: 1.3, vol: n.vel * PERC_SNAP_LEVEL });
        tone(out, t, { len: 0.03, type: 'triangle', freq: PERC_SNAP_TONE_HZ, vol: n.vel * PERC_SNAP_LEVEL * 0.3, attack: 0.002 });
        break;
      case 'tap': // a soft low thud on the downbeat, its pitch dropping quickly, quiet
        tone(out, t, { len: 0.1, freq: PERC_TAP_HZ, to: PERC_TAP_DROP_HZ, vol: n.vel * PERC_TAP_LEVEL });
        break;
    }
  }

  // The band starts with your first note: 16th 0 sounds at `at`. Your loop starts empty with it.
  function startBand(at, level = BAND_LEVEL) {
    if (!ctx) return;
    loopAt = at;
    next16 = 0;
    stopAt = Infinity;
    loopDone = 0;
    newTremoloWave(at);
    for (const g of [band, ...Object.values(loopIns)]) {
      g.gain.cancelScheduledValues(at);
      g.gain.setValueAtTime(g === band ? level : LOOP_LEVEL, at);
    }
  }

  // The band in the shop, while you try the loop pedal: its electric piano alone (the keys layer, with
  // no stand-in percussion), softly, from `at`.
  function tryBand(at) {
    if (!ctx) return;
    startBand(at, TRY_LEVEL);
    for (const { id } of LAYERS) bus[id].gain.setTargetAtTime(id === 'keys' ? 1 : 0, at, 0.02);
    bus.perc.gain.setTargetAtTime(0, at, 0.02);
    wobble.gain.setTargetAtTime(0, at, 0.5);
  }

  // The end of the set: the band and your loop fade out over a bar from `at`, and stop.
  function endBand(at) {
    if (!ctx) return;
    for (const g of [band, ...Object.values(loopIns)]) {
      g.gain.setValueAtTime(g === band ? BAND_LEVEL : LOOP_LEVEL, at);
      g.gain.linearRampToValueAtTime(0, at + BAR);
    }
    stopAt = at + BAR;
  }

  // Stops the band and your loop at once: nothing more is scheduled, and what's still sounding fades
  // out quickly.
  function stopBand() {
    loopAt = -1;
    if (!ctx) return;
    band.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    stopLoop();
  }

  // A looped note: a voice of its own through your instrument and pedals (so it never cuts off a note
  // you're playing, even on the same key), letting go `len` seconds after it starts at `at`.
  function loopNote({ pitch, strength, legato, len, layer, at }) {
    const release = VOICING[instrument].release;
    const v = { ...VOICES[instrument](pitch, strength, at, legato, loopIns[instrument]), release, start: at, end: at + len + release * 2, layer };
    damp(v, at + len);
    looped.add(v);
  }

  // Stops your loop's voices from one layer (or every layer) now: those sounding let go, and those
  // scheduled but not yet started are cut off before they sound.
  function stopLoop(layer = null) {
    if (!ctx) return;
    for (const v of looped) {
      if (layer !== null && v.layer !== layer) continue;
      looped.delete(v);
      if (v.start > ctx.currentTime) v.g.disconnect();
      damp(v, ctx.currentTime);
    }
  }

  // A layer slot switched on or off, at a bar line (or at once, from the sound check).
  function setLayer(id, on, at = now()) {
    if (!ctx) return;
    bus[id].gain.setTargetAtTime(on ? 1 : 0, Math.max(at, ctx.currentTime), 0.02);
    if (id === 'top') wobble.gain.setTargetAtTime(on ? 9 : 0, Math.max(at, ctx.currentTime), 0.5);
    // The stand-in percussion fills in for the drums, so it fades the opposite way, at the same moment.
    if (id === 'drums') bus.perc.gain.setTargetAtTime(on ? 0 : 1, Math.max(at, ctx.currentTime), 0.02);
  }

  // Called every frame: schedules the band's 16ths due in the next GROOVE.ahead seconds, the crackle,
  // and your loop's notes due by then. loopDue(from, to) gives the looped notes starting between two
  // band times (seconds since the band's first 16th), as looper.js's due does. Returns the looped
  // notes it scheduled, each with `at`, its time on the audio clock.
  function update(loopDue = null) {
    if (!ctx || ctx.state !== 'running' || loopAt < 0) return [];
    const t = ctx.currentTime;
    // After a stall, skip what's already late rather than playing it all at once.
    while (loopAt + timeOf16th(next16) < t - 0.1) next16++;
    while (loopAt + timeOf16th(next16) < t + GROOVE.ahead && loopAt + timeOf16th(next16) < stopAt) {
      const at = loopAt + timeOf16th(next16);
      for (const { id } of LAYERS) {
        for (const n of bandAt(id, next16)) playBand(id, n, at, loopAt + timeOf16th(next16 + n.len) - at);
      }
      for (const n of bandAt('perc', next16)) playBand('perc', n, at, loopAt + timeOf16th(next16 + n.len) - at);
      next16++;
    }
    if (t >= crackleAt && t < stopAt) {
      crackleAt = t + 0.03 + Math.random() * 0.25;
      burst(bus.keys, t, { len: 0.004 + Math.random() * 0.01, type: 'highpass', freq: 2000 + Math.random() * 4000, vol: 0.05 + Math.random() * 0.12 });
    }
    for (const v of looped) if (v.end < t) looped.delete(v);
    // Your loop's notes, never in the past: after a stall, what's already late is skipped.
    const from = Math.max(loopDone, t - loopAt), to = Math.min(t + GROOVE.ahead, stopAt) - loopAt;
    if (!loopDue || to <= from) return [];
    loopDone = to;
    const notes = loopDue(from, to).map((n) => ({ ...n, at: loopAt + n.t }));
    for (const n of notes) loopNote(n);
    return notes;
  }

  function coin(at = now()) {
    if (!ctx) return;
    const f = 2100 + Math.random() * 300;
    tone(master, at, { len: 0.5, freq: f, vol: 0.12, attack: 0.002 });
    tone(master, at + 0.06, { len: 0.4, freq: f * 1.5, vol: 0.07, attack: 0.002 });
  }

  // Applause from `people` listeners, over a few seconds.
  function clap(people, at = now()) {
    if (!ctx) return;
    const count = Math.round(8 + people * 14);
    for (let i = 0; i < count; i++) {
      const t = at + Math.random() * (1.2 + people * 0.3);
      burst(master, t, { len: 0.03, freq: 1100 + Math.random() * 900, q: 1.2, vol: 0.12 + Math.random() * 0.1 });
    }
  }

  // The delay the browser reports between the audio clock and your ears, in ms.
  function reportedLatency() {
    if (!ctx) return null;
    return ((ctx.baseLatency || 0) + (ctx.outputLatency || 0)) * 1000;
  }

  // When a sound started at context time `at` will be heard, on the page's performance.now() clock.
  function heardAt(at) {
    if (!ctx?.getOutputTimestamp) return null;
    const ts = ctx.getOutputTimestamp();
    if (!ts.performanceTime) return null;
    return ts.performanceTime + (Math.max(at, ctx.currentTime) - ts.contextTime) * 1000;
  }

  return {
    start, now, warm, noteOn, noteOff, setRing, setInstrument, setPedal, startBand, tryBand, endBand, stopBand, stopLoop,
    setLayer, update, coin, clap, reportedLatency, heardAt,
    get started() {
      return !!ctx;
    },
    get instrument() {
      return instrument;
    },
    get muted() {
      return muted;
    },
    get volume() {
      return volume;
    },
    setVolume(v) {
      volume = Math.max(0, Math.min(1, v));
      storage.set(VOLUME_KEY, volume);
      if (master) master.gain.setTargetAtTime(level(), ctx.currentTime, 0.02);
    },
    toggleMute() {
      muted = !muted;
      storage.set(MUTE_KEY, muted ? '1' : '0');
      if (master) master.gain.setTargetAtTime(level(), ctx.currentTime, 0.02);
    },
    suspend() {
      ctx?.suspend();
    },
    resume() {
      // Always call, unconditionally: ctx.suspend() changes state asynchronously in Safari and
      // Firefox, so a fast second Esc can see 'running' and skip the resume, leaving the clock frozen
      // with no pause card. suspend() and resume() are queued in order, so this is safe either way.
      ctx?.resume();
    },
  };
}
