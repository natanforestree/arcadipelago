// All of Open Case's sound, made live with Web Audio (there are no audio files).
//   - Your guitar: a plucked-string synth (Karplus-Strong). Each note's samples are worked out the
//     first time it's played and kept, so a key press only starts a buffer: it sounds at once.
//   - The band: electric piano, drums, bass, hats and pad from groove.js's patterns, scheduled a
//     little ahead of the audio clock, as Last Light's score is. Each layer plays into its own bus
//     (its slot): switching a layer is a fade on that bus at a bar line.
//   - Vinyl crackle, a dusty filter over the band, the tape wobble, coins landing and applause.
// Browsers only allow sound after a key press or click, so start() is called from inside one
// (main.js). M mutes; the volume and mute are remembered.
import { bandAt, timeOf16th, midiToHz, BAR } from './groove.js';
import { LAYERS, PLAY, GROOVE } from './tuning.js';

const MUTE_KEY = 'open-case-muted', VOLUME_KEY = 'open-case-volume';
const PICK = [0.35, 0.55, 0.8, 1]; // loudness by pick strength 1-4
const BRIGHT = [0.2, 0.35, 0.55, 0.8]; // the pick's brightness by strength
const BAND_LEVEL = 0.55; // the band bus's level under the guitar

// A plucked string's samples: up to `seconds` of a string at `hz`, picked at strength 1-4, cut short
// once it's inaudible. Karplus-Strong with an all-pass for exact tuning; the loop loses enough each
// period for the fundamental to fall 60 dB over PLAY.ring.
export function pluckSamples(rate, hz, strength = 3, seconds = PLAY.ring + 0.3) {
  const period = rate / hz;
  const n = Math.max(2, Math.floor(period - 0.6));
  const frac = period - 0.5 - n; // the averaging filter adds half a sample; the all-pass the rest
  const c = (1 - frac) / (1 + frac);
  const loss = Math.pow(10, -3 / (PLAY.ring * hz));
  // The pick: noise, smoothed more for a softer pick, with the notch of plucking near the bridge.
  const line = new Float32Array(n);
  let seed = 12345 + Math.round(hz * 7), y = 0, mean = 0;
  const b = BRIGHT[strength - 1];
  for (let i = 0; i < n; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    y += b * ((seed / 4294967296) * 2 - 1 - y);
    line[i] = y;
  }
  const notch = Math.max(1, Math.round(n * 0.13));
  for (let i = n - 1; i >= notch; i--) line[i] -= line[i - notch];
  for (let i = 0; i < n; i++) mean += line[i] / n;
  let peak = 1e-9;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs((line[i] -= mean)));
  for (let i = 0; i < n; i++) line[i] *= 0.5 / peak;
  const out = new Float32Array(Math.ceil(rate * seconds));
  let idx = 0, last = 0, apIn = 0, apOut = 0, loud = 0;
  for (let i = 0; i < out.length; i++) {
    const x = line[idx];
    out[i] = x;
    loud = Math.max(loud, Math.abs(x));
    if ((i & 1023) === 1023) {
      if (loud < 3e-4) return out.slice(0, i + 1); // about 65 dB down: silent
      loud = 0;
    }
    const avg = loss * 0.5 * (x + last);
    last = x;
    apOut = c * avg + apIn - c * apOut;
    apIn = avg;
    line[idx] = apOut;
    idx = idx + 1 === n ? 0 : idx + 1;
  }
  return out;
}

export function createAudio(storage) {
  let ctx = null, master = null, band = null, guitar = null, noise = null, wobble = null;
  const bus = {}; // a gain per layer: the layer slots
  const plucks = new Map(); // `${pitch}:${strength}` -> AudioBuffer
  const voices = new Map(); // key code -> { src, g } for notes sounding
  const ringing = new Set(); // voices whose key is up but Space holds them
  let ring = false;
  let muted = storage.get(MUTE_KEY) === '1';
  let volume = Number(storage.get(VOLUME_KEY) ?? 0.8);
  if (!(volume >= 0 && volume <= 1)) volume = 0.8;
  let loopAt = -1, next16 = 0, stopAt = Infinity, crackleAt = 0;
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
    master.connect(ctx.destination);
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
    // Your guitar, a little brighter than the band so it sits in the beat and still stands out, with a
    // touch of body.
    const body = ctx.createBiquadFilter(), gl = ctx.createBiquadFilter();
    body.type = 'peaking';
    body.frequency.value = 180;
    body.gain.value = 4;
    gl.type = 'lowpass';
    gl.frequency.value = 5200;
    guitar = ctx.createGain();
    guitar.gain.value = 0.9;
    guitar.connect(body).connect(gl).connect(master);
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
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

  function bufferFor(pitch, strength) {
    const key = `${pitch}:${strength}`;
    let buf = plucks.get(key);
    if (!buf) {
      const data = pluckSamples(ctx.sampleRate, midiToHz(pitch), strength);
      buf = ctx.createBuffer(1, data.length, ctx.sampleRate);
      buf.getChannelData(0).set(data);
      plucks.set(key, buf);
    }
    return buf;
  }

  // Works out a range of notes' samples ahead of time (in idle moments), so no key press waits.
  function warm(pitches, strength) {
    if (ctx) for (const p of pitches) bufferFor(p, strength);
  }

  function noteOn(code, pitch, strength, at, legato) {
    if (!ctx) return;
    noteOff(code, at); // the same key again: the old note stops
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = bufferFor(pitch, strength);
    g.gain.value = PICK[strength - 1] * (legato ? PLAY.legatoGain : 1);
    src.connect(g).connect(guitar);
    src.start(Math.max(at, ctx.currentTime), legato ? 0.012 : 0); // a hammer-on has no pick attack
    voices.set(code, { src, g });
  }

  function damp(v, at) {
    const t = Math.max(at, ctx.currentTime);
    v.g.gain.setTargetAtTime(0, t, PLAY.damp / 4);
    v.src.stop(t + PLAY.damp * 2);
  }

  function noteOff(code, at) {
    const v = voices.get(code);
    if (!v) return;
    voices.delete(code);
    if (ring) ringing.add(v);
    else damp(v, at);
  }

  // Space: while it's held, released notes ring on; letting go damps them.
  function setRing(on) {
    ring = on;
    if (!on && ctx) {
      for (const v of ringing) damp(v, ctx.currentTime);
      ringing.clear();
    }
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
  function burst(out, t, { len, type = 'bandpass', freq, q = 1, vol }) {
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noise;
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    g.gain.setValueAtTime(vol, t);
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
    }
  }

  // The band starts with your first note: 16th 0 sounds at `at`.
  function startBand(at) {
    if (!ctx) return;
    loopAt = at;
    next16 = 0;
    stopAt = Infinity;
    band.gain.cancelScheduledValues(at);
    band.gain.setValueAtTime(BAND_LEVEL, at);
  }

  // The end of the set: the band fades out over a bar from `at`, and stops.
  function endBand(at) {
    if (!ctx) return;
    band.gain.setValueAtTime(BAND_LEVEL, at);
    band.gain.linearRampToValueAtTime(0, at + BAR);
    stopAt = at + BAR;
  }

  function stopBand() {
    loopAt = -1;
  }

  // A layer slot switched on or off, at a bar line (or at once, from the sound check).
  function setLayer(id, on, at = now()) {
    if (!ctx) return;
    bus[id].gain.setTargetAtTime(on ? 1 : 0, Math.max(at, ctx.currentTime), 0.02);
    if (id === 'top') wobble.gain.setTargetAtTime(on ? 9 : 0, Math.max(at, ctx.currentTime), 0.5);
  }

  // Called every frame: schedules the band's 16ths due in the next GROOVE.ahead seconds, and the crackle.
  function update() {
    if (!ctx || ctx.state !== 'running' || loopAt < 0) return;
    const t = ctx.currentTime;
    // After a stall, skip what's already late rather than playing it all at once.
    while (loopAt + timeOf16th(next16) < t - 0.1) next16++;
    while (loopAt + timeOf16th(next16) < t + GROOVE.ahead && loopAt + timeOf16th(next16) < stopAt) {
      const at = loopAt + timeOf16th(next16);
      for (const { id } of LAYERS) {
        for (const n of bandAt(id, next16)) playBand(id, n, at, loopAt + timeOf16th(next16 + n.len) - at);
      }
      next16++;
    }
    if (t >= crackleAt && t < stopAt) {
      crackleAt = t + 0.03 + Math.random() * 0.25;
      burst(bus.keys, t, { len: 0.004 + Math.random() * 0.01, type: 'highpass', freq: 2000 + Math.random() * 4000, vol: 0.05 + Math.random() * 0.12 });
    }
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
    start, now, warm, noteOn, noteOff, setRing, startBand, endBand, stopBand, setLayer, update, coin, clap,
    reportedLatency, heardAt,
    get started() {
      return !!ctx;
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
