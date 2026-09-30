// All of Open Case's sound, made live with Web Audio (there are no audio files).
//   - Your instrument. The guitars are plucked-string synths (Karplus-Strong): each note's samples are
//     worked out the first time it's played and kept, so a key press only starts a buffer and it
//     sounds at once. The electric piano and the synth are made from oscillators as each note starts.
//   - Your pedals, between your instrument and the speakers, chained in the usual order: overdrive,
//     chorus, tremolo, delay, reverb. A stomp fades a pedal in or out over a few milliseconds.
//   - The band: the beat it's given (beats.js), its chords, drums, bass, hats and Pad, scheduled a
//     little ahead of the audio clock, as Last Light's score is, at the beat's tempo, in the sounds
//     the beat chose. Each layer plays into its own bus (its slot): switching a layer is a fade on that
//     bus at a bar line. With the beat's Pump up, the chords, bass and Pad duck on every kick.
//   - A note the studio has just written is heard at once (playWritten), even if the band had already
//     scheduled its 16th.
//   - Your loop (looper.js): its notes are scheduled a moment ahead with the band's, each a voice of
//     its own through your instrument and pedals, and they fade and stop with the band.
//   - Its count-in (countIn): a soft stick click on each beat after R, up to the bar line, so you can
//     hear when the recording is about to start; never through your pedals, never recorded.
//   - A dusty filter over the band; the Vinyl (crackle, hiss and tape wobble) when the beat has it on;
//     coins landing and applause.
//   - A safety before the speakers, so a loop stacked on your playing can't clip.
// Browsers only allow sound after a key press or click, so start() is called from inside one
// (main.js). M mutes; the volume and mute are remembered.
import { bandAt, midiToHz, clockOf, LOFI } from './beats.js';
import { LAYERS, PLAY, GROOVE } from './tuning.js';
import { PEDALS } from './gear.js';

const MUTE_KEY = 'open-case-muted', VOLUME_KEY = 'open-case-volume';
const PICK = [0.35, 0.55, 0.8, 1]; // loudness by pick strength 1-4
const BRIGHT = [0.2, 0.35, 0.55, 0.8]; // the acoustic's pick's brightness by strength
const BAND_LEVEL = 0.55; // the band bus's level under your instrument
// ...and in the shop, where the electric piano plays alone while you try the loop pedal.
const TRY_LEVEL = 0.35;
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
// The loop pedal's count-in: a soft, woody stick click, quieter than the band's snare, never through
// your pedals and never recorded.
const COUNT_BURST_HZ = 2500; // a noise burst, narrow and bright...
const COUNT_BURST_Q = 2;
const COUNT_BURST_LEN = 0.025;
const COUNT_BURST_LEVEL = 0.09;
const COUNT_TONE_HZ = 1000; // ...with a little pitch under it, dropping as it dies away
const COUNT_TONE_DROP_HZ = 700;
const COUNT_TONE_LEN = 0.03;
const COUNT_TONE_LEVEL = 0.05;
const COUNT_ATTACK = 0.002; // a quick onset, like a stick, not a slow swell

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
const DELAY_BEATS = 0.75; // the echo's time, in beats of the band's beat: a dotted 8th
const PUMP_DEPTH = 0.7; // at full Pump, the chords, bass and Pad drop to 30% on a kick...
const PUMP_BACK = 0.25; // ...and come back with this time constant, in beats
const HISS_LEVEL = 0.02; // the Vinyl's quiet hiss under its crackle
// A band note's tone: below 0.5, a lowpass closing from TONE_DARK_HZ x 32 (0.5) to TONE_DARK_HZ (0);
// above it, a shelf lifting the highs from TONE_SHELF_HZ by up to TONE_LIFT_DB (1).
const TONE_DARK_HZ = 200;
const TONE_SHELF_HZ = 2000;
const TONE_LIFT_DB = 12;
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
  const pump = {}; // the ducking gains the chords, bass and Pad play through, into their slots
  const inputs = {}; // a gain per instrument, into its tone filters and on into the pedals
  const loopIns = {}; // a gain per instrument for your loop's notes, into its input: the loop's fade
  const pedals = {}; // id -> { input, output, set(on, at) }
  let tremoloDepth = null, tremoloWave = null, delayLine = null;
  let beat = LOFI, clock = clockOf(LOFI); // what the band plays, and its timing
  let instrument = 'acoustic';
  const pedalOn = Object.fromEntries(PEDALS.map((id) => [id, false]));
  const plucks = new Map(); // `${pitch}:${strength}` -> AudioBuffer, for the instrument you play
  const voices = new Map(); // key code -> the voice sounding: { g, sources, release }
  // your loop's voices, sounding or about to: { g, sources, release, start, end, layer }
  const looped = new Set();
  // a count-in counting a recording in, one per call to countIn: { g, layer, end }
  const countIns = new Set();
  const ringing = new Set(); // voices whose key is up but Space holds them
  let ring = false;
  let muted = storage.get(MUTE_KEY) === '1';
  let volume = Number(storage.get(VOLUME_KEY) ?? 0.8);
  if (!(volume >= 0 && volume <= 1)) volume = 0.8;
  // loopAt: the band's first 16th on the audio clock, or null with no band (a new tempo can put it
  // before the clock's zero, so it can be below 0)
  let loopAt = null, next16 = 0, stopAt = Infinity, crackleAt = 0, hiss = null;
  const layerOn = {}; // whether each layer slot is on (the Pump follows the kick only while you can hear it)
  const bandPlucks = new Map(); // `${voice}:${note}` -> AudioBuffer: the band's plucked strings
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
      layerOn[id] = min === 0;
      bus[id].connect(band);
    }
    // The stand-in percussion's own bus: not a crowd layer (never in LAYERS), gated the opposite of
    // the drums slot in setLayer. The drums start off, so it starts on.
    bus.perc = ctx.createGain();
    bus.perc.gain.value = 1;
    bus.perc.connect(band);
    // The Pump's gains: the chords and the bass into their slots, the Pad into the top's.
    for (const [id, into] of [['keys', 'keys'], ['bass', 'bass'], ['pad', 'top']]) {
      pump[id] = ctx.createGain();
      pump[id].connect(bus[into]);
    }
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
    // No oversampling: unlike 4x, it adds no delay to every note. The curve is straight below the
    // knee, so the normal mix still passes through untouched; only the rare overload this exists
    // for gets a little aliasing, a better trade than delay all the time.
    safety.oversample = 'none';
    master.connect(headroom).connect(safety).connect(ctx.destination);
    // The tape wobble: a slow wave on the keys' and pad's pitch, off until the top layer joins.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.55;
    wobble = ctx.createGain();
    wobble.gain.value = 0;
    lfo.connect(wobble);
    lfo.start();
    // A quiet hiss under the crackle, part of the keys layer.
    const hs = ctx.createBufferSource(), hf = ctx.createBiquadFilter();
    hiss = ctx.createGain();
    hs.buffer = noise;
    hs.loop = true;
    hf.type = 'bandpass';
    hf.frequency.value = 4000;
    hf.Q.value = 0.5;
    hiss.gain.value = beat.mix.vinyl ? HISS_LEVEL : 0;
    hs.connect(hf).connect(hiss).connect(bus.keys);
    hs.start();
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

  // A new wave for the tremolo, a cosine at the 8th notes' rate (of the band's beat) starting at `at`
  // (the band's first 16th, or any moment when there's no band), so its peaks land on the 8ths. The
  // old wave plays until the new one takes over.
  function newTremoloWave(at) {
    const wave = ctx.createOscillator();
    wave.setPeriodicWave(ctx.createPeriodicWave(new Float32Array([0, 1]), new Float32Array([0, 0])));
    wave.frequency.value = 2 / clock.beat;
    wave.connect(tremoloDepth);
    wave.start(at);
    tremoloWave?.stop(at);
    tremoloWave = wave;
  }

  // Delay: echoes on the dotted 8th of the band's beat, each a little quieter and darker. Switched off, it stops taking
  // in new notes, and the echoes already going fade away on their own.
  function delay() {
    const input = ctx.createGain(), output = ctx.createGain(), send = ctx.createGain(), wet = ctx.createGain();
    const line = ctx.createDelay(2), dark = ctx.createBiquadFilter(), again = ctx.createGain();
    send.gain.value = 0;
    line.delayTime.value = clock.beat * DELAY_BEATS;
    delayLine = line;
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

  // A band note's way into its slot, through its tone: below 0.5 a lowpass closing towards its pitch
  // (darker), above it a shelf lifting its highs (brighter); at 0.5 (or with none) the sound itself.
  function toned(out, tone) {
    if (tone === undefined || tone === 0.5) return out;
    const fl = ctx.createBiquadFilter();
    if (tone < 0.5) {
      fl.type = 'lowpass';
      fl.frequency.value = TONE_DARK_HZ * Math.pow(2, tone * 10);
    } else {
      fl.type = 'highshelf';
      fl.frequency.value = TONE_SHELF_HZ;
      fl.gain.value = (tone - 0.5) * 2 * TONE_LIFT_DB;
    }
    fl.connect(out);
    return fl;
  }

  // A plucked string of the band's (the nylon guitar, the plucked bass): its samples worked out the
  // first time its note is played and kept, then damped len seconds after it starts.
  function bandString(out, t, len, n, { ring, bright, pick }, level) {
    const key = `${n.voice}:${n.note}`;
    let buf = bandPlucks.get(key);
    if (!buf) {
      const data = pluckSamples(ctx.sampleRate, midiToHz(n.note), 1, { ring, bright: [bright], pick });
      buf = ctx.createBuffer(1, data.length, ctx.sampleRate);
      buf.getChannelData(0).set(data);
      bandPlucks.set(key, buf);
    }
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = buf;
    g.gain.setValueAtTime(n.vel * level, t);
    g.gain.setTargetAtTime(0, t + len, 0.03);
    src.connect(g).connect(out);
    src.start(t);
    src.stop(t + len + 0.2);
  }

  // One band note into its layer's bus (the chords, the bass and the Pad through their Pump). len is in
  // seconds.
  function playBand(layer, n, t, len) {
    const out = toned(n.voice === 'pad' ? pump.pad : pump[layer] ?? bus[layer], n.tone), f = midiToHz(n.note);
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
      // The brushes kit.
      case 'softKick': // a round, quiet thump
        tone(out, t, { len: 0.3, freq: 90, to: 45, vol: n.vel });
        break;
      case 'brush': // a swish of wire brushes: noise that swells a little, then fades
        burst(out, t, { len: 0.28, freq: 3200, q: 0.5, vol: n.vel * 0.7, attack: 0.03 });
        break;
      case 'rim': // a rim click: a short wooden knock
        tone(out, t, { len: 0.05, type: 'triangle', freq: 1650, vol: n.vel * 0.45, attack: 0.001 });
        burst(out, t, { len: 0.02, freq: 3000, q: 3, vol: n.vel * 0.3 });
        break;
      // The funk kit.
      case 'tightKick': // short and punchy, with a click on top
        tone(out, t, { len: 0.2, freq: 150, to: 48, vol: n.vel });
        burst(out, t, { len: 0.012, type: 'highpass', freq: 3500, vol: n.vel * 0.15 });
        break;
      case 'crack': // a bright, tight snare
        burst(out, t, { len: 0.13, freq: 2600, q: 0.9, vol: n.vel * 0.7 });
        tone(out, t, { len: 0.06, type: 'triangle', freq: 240, vol: n.vel * 0.3 });
        break;
      case 'openHat': // an open hat, ringing a little
        burst(out, t, { len: 0.32, type: 'highpass', freq: 7500, vol: n.vel * 0.28 });
        break;
      // The reggae kit.
      case 'deepKick': // deep and long
        tone(out, t, { len: 0.55, freq: 85, to: 38, vol: n.vel });
        break;
      case 'rimshot': // a cross-stick: a hollow knock
        tone(out, t, { len: 0.06, type: 'triangle', freq: 820, vol: n.vel * 0.4, attack: 0.001 });
        burst(out, t, { len: 0.035, freq: 2000, q: 2, vol: n.vel * 0.3 });
        break;
      // The basses (the round bass is 'bass', above).
      case 'pluck': // a plucked bass string
        bandString(out, t, len, n, { ring: 1.2, bright: 0.45, pick: 0.25 }, 1);
        break;
      case 'deep': // a deep, round sine
        tone(out, t, { len, freq: f, vol: n.vel * 0.4, attack: 0.02 });
        break;
      // The chord sounds (the electric piano is 'ep', above).
      case 'nylon': // a nylon-strung guitar, plucked softly
        bandString(out, t, len, n, { ring: 1.4, bright: 0.3, pick: 0.18 }, 0.4);
        break;
      case 'clav': { // a clavinet-like stab: a bright pulse whose filter snaps shut
        const o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
        const end = t + Math.max(0.08, Math.min(len, 0.3));
        o.type = 'square';
        o.frequency.value = f;
        fl.type = 'lowpass';
        fl.Q.value = 4;
        fl.frequency.setValueAtTime(f * 10, t);
        fl.frequency.exponentialRampToValueAtTime(f * 2, t + 0.12);
        g.gain.setValueAtTime(n.vel * 0.09, t);
        g.gain.exponentialRampToValueAtTime(0.001, end);
        o.connect(fl).connect(g).connect(out);
        o.start(t);
        o.stop(end + 0.05);
        break;
      }
      case 'organ': // a drawbar organ: the note, its octave and its twelfth, as sines
        for (const [k, v] of [[1, 0.1], [2, 0.065], [3, 0.04]]) tone(out, t, { len: Math.max(len, 0.12), freq: f * k, vol: n.vel * v, attack: 0.008 });
        break;
      case 'piano': // a soft piano: a sine and a quieter octave over it, dying away
        tone(out, t, { len: Math.min(len + 0.8, 3), freq: f, vol: n.vel * 0.1, attack: 0.002 });
        tone(out, t, { len: Math.min(len, 1.5), type: 'triangle', freq: f * 2, vol: n.vel * 0.025, attack: 0.002 });
        break;
    }
  }

  // The Pump: on a kick at `at`, the chords, the bass and the Pad drop by the beat's Pump and come
  // back over about an 8th note.
  function duck(at) {
    const depth = beat.mix.pump * PUMP_DEPTH;
    if (!depth) return;
    for (const g of Object.values(pump)) {
      g.gain.setValueAtTime(1 - depth, at);
      g.gain.setTargetAtTime(1, at + 0.01, clock.beat * PUMP_BACK);
    }
  }

  // The band starts playing `b` (a beat) with your first note: 16th 0 sounds at `at`. Your loop starts
  // empty with it. The tremolo and the delay take the beat's tempo.
  function startBand(at, b = LOFI, level = BAND_LEVEL) {
    if (!ctx) return;
    beat = b;
    clock = clockOf(b);
    delayLine.delayTime.setValueAtTime(clock.beat * DELAY_BEATS, at);
    hiss.gain.setValueAtTime(b.mix.vinyl ? HISS_LEVEL : 0, at);
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

  // The band carries on with `b` in place of the beat it was playing (the studio's changes), from the
  // same 16th: at a new tempo, the 16ths still to come are timed by it, so nothing jumps or repeats.
  // The studio changes the very beat the band plays, in place, so a new tempo or swing shows against
  // the band's own clock (made when it last started or retimed), not against the beat. It's for the
  // studio, where no loop pedal plays, so it doesn't re-base your loop's schedule (loopDone).
  function setBeat(b) {
    if (!ctx) return;
    const next = clockOf(b);
    const retimed = next.beat !== clock.beat || next.timeOf16th(1) !== clock.timeOf16th(1);
    if (loopAt !== null && retimed) loopAt += clock.timeOf16th(next16) - next.timeOf16th(next16);
    beat = b;
    clock = next;
    if (retimed) {
      delayLine.delayTime.setValueAtTime(clock.beat * DELAY_BEATS, ctx.currentTime);
      newTremoloWave(ctx.currentTime);
    }
    hiss.gain.setTargetAtTime(b.mix.vinyl ? HISS_LEVEL : 0, ctx.currentTime, 0.05);
    wobble.gain.setTargetAtTime(layerOn.top && b.mix.vinyl ? 9 : 0, ctx.currentTime, 0.5);
  }

  // Notes the studio has just written at 16th s (band time: 16ths since the band's first), heard even
  // when the band has already scheduled that 16th: at its time, or at once if that's already past. A
  // 16th not yet scheduled is left to the band, which will play what's written there.
  function playWritten(layer, notes, s) {
    if (!ctx || loopAt === null || s >= next16) return;
    const at = Math.max(ctx.currentTime, loopAt + clock.timeOf16th(s));
    for (const n of notes) playBand(layer, n, at, loopAt + clock.timeOf16th(s + n.len) - at);
  }

  // The band in the shop, while you try the loop pedal: the chords of `b` alone (the keys layer, with
  // no stand-in percussion), softly, from `at`.
  function tryBand(at, b = LOFI) {
    if (!ctx) return;
    startBand(at, b, TRY_LEVEL);
    for (const { id } of LAYERS) bus[id].gain.setTargetAtTime(id === 'keys' ? 1 : 0, at, 0.02);
    bus.perc.gain.setTargetAtTime(0, at, 0.02);
    wobble.gain.setTargetAtTime(0, at, 0.5);
  }

  // The end of the set: the band and your loop fade out over a bar from `at`, and stop.
  function endBand(at) {
    if (!ctx) return;
    for (const g of [band, ...Object.values(loopIns)]) {
      g.gain.setValueAtTime(g === band ? BAND_LEVEL : LOOP_LEVEL, at);
      g.gain.linearRampToValueAtTime(0, at + clock.bar);
    }
    stopAt = at + clock.bar;
  }

  // Stops the band and your loop at once: nothing more is scheduled, and what's still sounding fades
  // out quickly.
  function stopBand() {
    loopAt = null;
    if (!ctx) return;
    const at = ctx.currentTime;
    band.gain.cancelScheduledValues(at); // drop a shop try's chord that hadn't started yet
    band.gain.setTargetAtTime(0, at, 0.05);
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
  // scheduled but not yet started are cut off before they sound. A count-in still counting that layer
  // in (or every layer) is cut off too, so any of its clicks not yet sounded never sound.
  function stopLoop(layer = null) {
    if (!ctx) return;
    for (const v of looped) {
      if (layer !== null && v.layer !== layer) continue;
      looped.delete(v);
      if (v.start > ctx.currentTime) v.g.disconnect();
      damp(v, ctx.currentTime);
    }
    for (const v of countIns) {
      if (layer !== null && v.layer !== layer) continue;
      countIns.delete(v);
      v.g.disconnect();
    }
  }

  // A count-in: a stick click at each audio-clock time in `ats` not already past, counting the
  // recording arming on `layer` in. The clicks go through one gain of their own into master, never the
  // band bus (its level differs in the shop) and never a pedal (they're not your instrument, and never
  // recorded). stopLoop cuts them off. Nothing is made or kept if every time is already past (R pressed
  // on the last beat, say, or the shop's band starting before its first click).
  function countIn(ats, layer) {
    if (!ctx) return;
    const ahead = ats.filter((at) => at >= ctx.currentTime);
    if (!ahead.length) return;
    const g = ctx.createGain();
    g.countIn = layer; // named, so the tests can follow it, like the pedals
    g.connect(master);
    let end = ctx.currentTime;
    for (const at of ahead) {
      burst(g, at, { len: COUNT_BURST_LEN, freq: COUNT_BURST_HZ, q: COUNT_BURST_Q, vol: COUNT_BURST_LEVEL });
      tone(g, at, { len: COUNT_TONE_LEN, type: 'triangle', freq: COUNT_TONE_HZ, to: COUNT_TONE_DROP_HZ, vol: COUNT_TONE_LEVEL, attack: COUNT_ATTACK });
      end = Math.max(end, at + COUNT_TONE_LEN + 0.05);
    }
    countIns.add({ g, layer, end });
  }

  // A layer slot switched on or off, at a bar line (or at once, from the sound check).
  function setLayer(id, on, at = now()) {
    if (!ctx) return;
    layerOn[id] = on;
    bus[id].gain.setTargetAtTime(on ? 1 : 0, Math.max(at, ctx.currentTime), 0.02);
    if (id === 'top') wobble.gain.setTargetAtTime(on && beat.mix.vinyl ? 9 : 0, Math.max(at, ctx.currentTime), 0.5);
    // The stand-in percussion fills in for the drums, so it fades the opposite way, at the same moment.
    if (id === 'drums') bus.perc.gain.setTargetAtTime(on ? 0 : 1, Math.max(at, ctx.currentTime), 0.02);
  }

  // Called every frame: schedules the band's 16ths due in the next GROOVE.ahead seconds, the crackle,
  // and your loop's notes due by then. loopDue(from, to) gives the looped notes starting between two
  // band times (seconds since the band's first 16th), as looper.js's due does. Returns the looped
  // notes it scheduled, each with `at`, its time on the audio clock.
  function update(loopDue = null) {
    if (!ctx || ctx.state !== 'running' || loopAt === null) return [];
    const t = ctx.currentTime;
    // After a stall, skip what's already late rather than playing it all at once.
    const at16 = (s) => loopAt + clock.timeOf16th(s);
    while (at16(next16) < t - 0.1) next16++;
    while (at16(next16) < t + GROOVE.ahead && at16(next16) < stopAt) {
      const at = at16(next16);
      for (const { id } of [...LAYERS, { id: 'perc' }]) {
        for (const n of bandAt(beat, id, next16)) {
          playBand(id, n, at, at16(next16 + n.len) - at);
          if (n.drum === 'kick' && layerOn.drums) duck(at);
        }
      }
      next16++;
    }
    if (beat.mix.vinyl && t >= crackleAt && t < stopAt) {
      crackleAt = t + 0.03 + Math.random() * 0.25;
      burst(bus.keys, t, { len: 0.004 + Math.random() * 0.01, type: 'highpass', freq: 2000 + Math.random() * 4000, vol: 0.05 + Math.random() * 0.12 });
    }
    for (const v of looped) if (v.end < t) looped.delete(v);
    for (const v of countIns) if (v.end < t) countIns.delete(v);
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
    start, now, warm, noteOn, noteOff, setRing, setInstrument, setPedal, startBand, setBeat, playWritten, tryBand, endBand, stopBand,
    stopLoop, countIn, setLayer, update, coin, clap, reportedLatency, heardAt,
    // the band's first 16th on the audio clock (null with no band): band time counts from it
    get bandStart() {
      return loopAt;
    },
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
