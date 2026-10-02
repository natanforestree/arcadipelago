import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAudio, pluckSamples, softClip, safetyCurve, VOICING } from '../src/audio.js';
import { fakeAudioContext } from './fake-audio.js';
import { LOFI, LOFI_CLOCK, READY, readyBeat, clockOf, bandAt, cloneBeat, midiToHz } from '../src/beats.js';
import { PLAY, GROOVE, LAYERS } from '../src/tuning.js';
import { PEDALS, INSTRUMENTS } from '../src/gear.js';
import { createLoop, record, note, release, step, due, loopLength } from '../src/looper.js';
import { createRng, nextRandom } from '../src/rng.js';
const { bar: BAR, beat: BEAT, timeOf16th } = LOFI_CLOCK;
const LOOP_LENGTH = loopLength(createLoop());

function memoryStorage() {
  const m = new Map();
  return { get: (k) => (m.has(k) ? m.get(k) : null), set: (k, v) => m.set(k, String(v)) };
}

// Runs fn with a fake AudioContext installed; fn gets a function returning the context made. The
// context's createGain is wrapped to remember every gain node in the order audio.js makes them
// (master, band, then each of LAYERS, then the stand-in percussion bus), so a test can read a bus's
// level the same way it reads any other recorded node — ctx().busGain(id).gain.value. Its
// createStereoPanner is wrapped the same way: only the birds have panners, so what they feed is the
// birds' own gain, ctx().birdsGain(). With { panner: false }, the browser has no stereo panner.
function withAudio(fn, { panner = true } = {}) {
  let ctx;
  globalThis.AudioContext = function () {
    ctx = fakeAudioContext();
    const gains = [], panners = [];
    const createGain = ctx.createGain, createStereoPanner = ctx.createStereoPanner;
    ctx.createGain = () => {
      const g = createGain();
      gains.push(g);
      return g;
    };
    if (panner) {
      ctx.createStereoPanner = () => {
        const p = createStereoPanner();
        panners.push(p);
        return p;
      };
    } else delete ctx.createStereoPanner;
    ctx.busGain = (id) => {
      const i = LAYERS.findIndex((l) => l.id === id);
      return gains[2 + (i < 0 ? LAYERS.length : i)];
    };
    ctx.master = () => gains[0];
    ctx.gainCount = () => gains.length;
    ctx.panners = () => panners;
    ctx.birdsGain = () => panners[0]?.outs[0];
    return ctx;
  };
  try {
    return fn(() => ctx);
  } finally {
    delete globalThis.AudioContext;
  }
}

// The period of a sound in samples, from its autocorrelation, to a fraction of a sample.
function period(x, from, guess) {
  const corr = (lag) => {
    let s = 0;
    for (let i = from; i < from + 4000; i++) s += x[i] * x[i + lag];
    return s;
  };
  let best = 0, bestLag = 0;
  for (let lag = Math.floor(guess * 0.8); lag <= Math.ceil(guess * 1.2); lag++) {
    const c = corr(lag);
    if (c > best) [best, bestLag] = [c, lag];
  }
  const a = corr(bestLag - 1), b = best, c = corr(bestLag + 1);
  return bestLag + (a - c) / (2 * (a - 2 * b + c));
}
const rms = (x, from, n) => Math.sqrt(x.subarray(from, from + n).reduce((s, v) => s + v * v, 0) / n);

test('a plucked string is in tune, from the low E to the high E', () => {
  for (const hz of [82.41, 220, 659.26, 1318.5]) {
    const x = pluckSamples(48000, hz, 3);
    const p = period(x, 9600, 48000 / hz);
    assert.ok(Math.abs(p / (48000 / hz) - 1) < 0.003, `${hz} Hz: period ${p}, wanted ${48000 / hz}`);
  }
});

test('a plucked string rings on for a few seconds, then its samples stop once it is silent', () => {
  const x = pluckSamples(48000, 220, 3);
  assert.ok(x.length >= 48000 * 2.5 && x.length <= 48000 * (PLAY.ring + 0.3), `${x.length / 48000} s`);
  const start = rms(x, 0, 4800), end = rms(x, x.length - 4800, 4800);
  assert.ok(end < start * 0.003, `${start} -> ${end}`);
  assert.ok(rms(x, 48000, 4800) > start * 0.05, 'still ringing after a second');
});

test('a harder pick is brighter', () => {
  const edge = (x) => {
    let d = 0, a = 0;
    for (let i = 1; i < 2400; i++) {
      d += Math.abs(x[i] - x[i - 1]);
      a += Math.abs(x[i]);
    }
    return d / a;
  };
  assert.ok(edge(pluckSamples(48000, 220, 4)) > edge(pluckSamples(48000, 220, 1)) * 1.5);
});

test('a note sounds the moment it is played, and stops soon after its key comes up', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    ctx().currentTime = 2;
    audio.noteOn('KeyA', 60, 3, 2, false);
    const note = ctx().started.at(-1);
    assert.deepEqual([note.kind, note.t, note.offset], ['buffer', 2, 0]);
    audio.noteOff('KeyA', 2.4);
    assert.ok(ctx().stopped.at(-1).t <= 2.4 + PLAY.damp * 2 + 1e-9);
  }));

test('a hammer-on skips the pick; each pitch and strength is worked out only once', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    const made = ctx().buffers.length;
    audio.noteOn('KeyA', 60, 3, 0, false);
    audio.noteOn('KeyS', 60, 3, 0, true);
    assert.ok(ctx().started.at(-1).offset > 0);
    assert.equal(ctx().buffers.length, made + 1);
    audio.warm([62, 64], 3);
    assert.equal(ctx().buffers.length, made + 3);
  }));

test('while Space is held, released notes ring on; letting it go damps them', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.setRing(true);
    audio.noteOn('KeyA', 60, 3, 0, false);
    const stops = ctx().stopped.length;
    audio.noteOff('KeyA', 0.5);
    assert.equal(ctx().stopped.length, stops, 'still ringing');
    ctx().currentTime = 1.5;
    audio.setRing(false);
    assert.equal(ctx().stopped.length, stops + 1);
    assert.ok(ctx().stopped.at(-1).t >= 1.5);
  }));

test('re-striking the same pitch while it still rings stops the earlier voice, so repeats do not stack', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.setInstrument('synth');
    audio.setRing(true);
    const stoppedNodes = () => new Set(ctx().stopped.map((s) => s.node));
    const strike = (t) => {
      ctx().currentTime = t;
      const before = ctx().started.length;
      audio.noteOn('KeyA', 60, 3, t, false);
      const sources = ctx().started.slice(before).map((s) => s.node);
      audio.noteOff('KeyA', t + 0.02); // let go right away: Space keeps it ringing
      return sources;
    };
    const first = strike(2);
    const second = strike(2.2);
    assert.ok(first.every((n) => stoppedNodes().has(n)), 'the first voice is stopped once the second starts');
    const third = strike(2.4);
    assert.ok(second.every((n) => stoppedNodes().has(n)), 'the second voice is stopped once the third starts');
    assert.ok(third.every((n) => !stoppedNodes().has(n)), 'the third, still ringing, is the only one left');
  }));

test('a note released before its delayed start begins damps from its own start, not before (no click)', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.setInstrument('synth');
    ctx().currentTime = 5.0;
    const before = ctx().started.length;
    audio.noteOn('KeyA', 60, 3, 5.036, false); // a strummed note, starting a moment from now
    const sources = ctx().started.slice(before).map((s) => s.node);
    audio.noteOff('KeyA', 5.02); // the key comes up before the voice even starts
    const stops = ctx().stopped.filter((s) => sources.includes(s.node));
    assert.ok(stops.length > 0, 'the voice does stop');
    for (const { t } of stops) {
      assert.ok(t >= 5.036 - 1e-9, `stopped at ${t}, before its own start`);
      assert.ok(t <= 5.036 + VOICING.synth.release * 2 + 1e-9, `stopped at ${t}, long after its start`);
    }
    const g = downstream(sources[0]).find((n) => n.gain?.events?.some(([how, v]) => how === 'target' && v === 0));
    assert.ok(g, "the note's own gain");
    const [, , fadeAt] = g.gain.events.find(([how, v]) => how === 'target' && v === 0);
    assert.ok(fadeAt >= 5.036 - 1e-9, `the fade is scheduled at ${fadeAt}, before the voice's own start`);
  }));

test('the band is scheduled a moment ahead, every layer into its slot, never further ahead', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.startBand(0.1);
    for (let i = 0; i < 100; i++) {
      ctx().currentTime += 0.05;
      audio.update();
      const latest = Math.max(...ctx().started.filter((s) => s.kind === 'osc').map((s) => s.t));
      assert.ok(latest <= ctx().currentTime + GROOVE.ahead + 1e-9);
    }
    assert.ok(ctx().started.filter((s) => s.kind === 'osc').length > 50);
  }));

test('the band fades over a bar at the end and then stops', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.startBand(0);
    audio.endBand(1);
    for (let i = 0; i < 200; i++) {
      ctx().currentTime += 0.05;
      audio.update();
    }
    const osc = ctx().started.filter((s) => s.kind === 'osc');
    assert.ok(Math.max(...osc.map((s) => s.t)) < 1 + BAR);
  }));

test('the stand-in percussion bus is the drums’ inverse: on while they are out, off once they join', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.startBand(0);
    assert.equal(ctx().busGain('drums').gain.value, 0);
    assert.equal(ctx().busGain('perc').gain.value, 1, 'the drums are off, so the percussion starts on');
    audio.setLayer('drums', true, 1);
    assert.equal(ctx().busGain('drums').gain.value, 1);
    assert.equal(ctx().busGain('perc').gain.value, 0, 'the drums joined, so the percussion fades out');
    audio.setLayer('drums', false, 2);
    assert.equal(ctx().busGain('drums').gain.value, 0);
    assert.equal(ctx().busGain('perc').gain.value, 1, 'the crowd emptied: the percussion comes back');
  }));

test('the stand-in percussion lands alongside the hats, on the off-beat 8ths', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.startBand(0);
    for (let i = 0; i < 100; i++) {
      ctx().currentTime += 0.05;
      audio.update();
    }
    const bufferHitsAt = (t) => ctx().started.filter((s) => s.kind === 'buffer' && Math.abs(s.t - t) < 1e-9).length;
    // 16th 2: the hats already fire here; the shaker adds a second hit at the very same moment.
    assert.equal(bufferHitsAt(timeOf16th(2)), 2);
  }));

test('coins, applause and the reported delay', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    assert.equal(audio.reportedLatency(), null);
    audio.start();
    const before = ctx().started.length;
    audio.coin();
    audio.clap(3);
    assert.ok(ctx().started.length > before + 20);
    assert.equal(audio.reportedLatency(), 15);
    ctx().currentTime = 1;
    assert.equal(audio.heardAt(1.2), 6200);
  }));

test('mute and volume are remembered', () => {
  const storage = memoryStorage();
  const a = createAudio(storage);
  a.toggleMute();
  a.setVolume(0.3);
  const b = createAudio(storage);
  assert.equal(b.muted, true);
  assert.equal(b.volume, 0.3);
});

test('with no Web Audio at all, everything is silently a no-op', () => {
  const a = createAudio(memoryStorage());
  a.start();
  a.noteOn('KeyA', 60, 3, 0, false);
  a.noteOff('KeyA', 0);
  a.setRing(false);
  a.startBand(0);
  a.setLayer('drums', true);
  a.birds(true);
  a.update();
  a.coin();
  a.clap(2);
  a.endBand(0);
  assert.equal(a.heardAt(0), null);
  assert.equal(a.now(), 0);
});

test('a saved volume that makes no sense falls back to 0.8', () => {
  const storage = memoryStorage();
  storage.set('open-case-volume', 'loud');
  assert.equal(createAudio(storage).volume, 0.8);
  storage.set('open-case-volume', '7');
  assert.equal(createAudio(storage).volume, 0.8);
});

// Following the wiring: every node reachable from `from`, nearest first, and the first pedal on the way.
function downstream(from) {
  const seen = new Set(), queue = [...(from.outs ?? [])], order = [];
  while (queue.length) {
    const n = queue.shift();
    if (seen.has(n)) continue;
    seen.add(n);
    order.push(n);
    queue.push(...(n.outs ?? []));
  }
  return order;
}
const nextPedal = (from) => downstream(from).find((n) => n.pedal) ?? null;
// Plays a note on `id` at time 2 and returns the sounds it started.
function playOn(ctx, audio, id, strength = 3) {
  audio.setInstrument(id);
  ctx().currentTime = 2;
  const before = ctx().started.length;
  audio.noteOn('KeyA', 60, strength, 2, false);
  return ctx().started.slice(before);
}

test('the ukulele rings short and the electric guitar long; both stay in tune', () => {
  const len = (id) => pluckSamples(48000, 220, 3, VOICING[id].pluck).length / 48000;
  assert.ok(len('ukulele') < 2 && len('ukulele') < len('acoustic') / 2, `ukulele ${len('ukulele')} s`);
  assert.ok(len('electric') > len('acoustic') * 1.3, `electric ${len('electric')} s`);
  for (const id of ['ukulele', 'electric']) {
    const x = pluckSamples(48000, 220, 3, VOICING[id].pluck);
    const p = period(x, 4800, 48000 / 220);
    assert.ok(Math.abs(p / (48000 / 220) - 1) < 0.003, `${id}: period ${p}`);
  }
});

test('every instrument sounds for a note at once, through its own tone into the pedals', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    for (const id of INSTRUMENTS) {
      const fresh = playOn(ctx, audio, id);
      assert.ok(fresh.length >= 1 && fresh.every((s) => s.t === 2), `${id} sounds at once`);
      const path = downstream(fresh[0].node), first = path.findIndex((n) => n.pedal);
      assert.equal(path[first].pedal, 'overdrive', `${id} plays into the first pedal`);
      for (const [type, hz] of VOICING[id].tone) {
        const at = path.findIndex((n) => n.kind === 'filter' && n.type === type && n.frequency.value === hz);
        assert.ok(at >= 0 && at < first, `${id}: its ${type} at ${hz} Hz, before the pedals`);
      }
    }
  }));

test("every instrument's note stops soon after its key comes up, or when Space lets go", () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    for (const id of INSTRUMENTS) {
      playOn(ctx, audio, id);
      let stops = ctx().stopped.length;
      audio.noteOff('KeyA', 2.4);
      const late = ctx().stopped.slice(stops);
      assert.ok(late.length >= 1, `${id} stops`);
      assert.ok(late.every((st) => st.t <= 2.4 + VOICING[id].release * 2 + 1e-9), `${id} stops soon after its key is up`);
      audio.setRing(true);
      playOn(ctx, audio, id);
      stops = ctx().stopped.length;
      audio.noteOff('KeyA', 2.4);
      assert.ok(ctx().stopped.slice(stops).every((st) => st.t > 3), `${id}: Space holds it`);
      ctx().currentTime = 5;
      audio.setRing(false);
      assert.ok(ctx().stopped.slice(stops).some((st) => st.t >= 5 && st.t <= 5 + VOICING[id].release * 2 + 1e-9), `${id}: letting Space go stops it`);
    }
  }));

test('the synth holds while its key is down; the electric piano fades away by itself', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    let stops = ctx().stopped.length;
    playOn(ctx, audio, 'synth');
    assert.equal(ctx().stopped.length, stops, 'no end until the key comes up');
    audio.noteOff('KeyA', 2.2);
    stops = ctx().stopped.length;
    playOn(ctx, audio, 'epiano');
    const ends = ctx().stopped.slice(stops);
    assert.ok(ends.length > 0 && ends.every((st) => st.t > 4 && st.t < 14), 'it ends by itself, some seconds on');
  }));

test('no key press waits: the keyboards make no samples, and a warmed guitar makes none either', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    const made = ctx().buffers.length;
    playOn(ctx, audio, 'epiano');
    playOn(ctx, audio, 'synth');
    audio.warm([60, 62], 3);
    assert.equal(ctx().buffers.length, made, 'the keyboards need nothing worked out');
    audio.setInstrument('ukulele');
    audio.warm([60, 62], 3);
    const warmed = ctx().buffers.length;
    assert.equal(warmed, made + 2);
    playOn(ctx, audio, 'ukulele');
    assert.equal(ctx().buffers.length, warmed, 'the note was ready');
    assert.ok(ctx().buffers.at(-1).length < 8000 * 2, "the ukulele's short ring");
  }));

test('changing instrument: only a real change counts, and notes already sounding carry on', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    assert.equal(audio.instrument, 'acoustic');
    assert.equal(audio.setInstrument('acoustic'), false);
    assert.equal(audio.setInstrument('banjo'), false);
    assert.equal(audio.setInstrument('synth'), true, 'before the sound starts, too');
    audio.start();
    playOn(ctx, audio, 'synth');
    const stops = ctx().stopped.length;
    audio.setInstrument('acoustic');
    assert.equal(ctx().stopped.length, stops);
    audio.noteOff('KeyA', 3);
    assert.ok(ctx().stopped.length > stops, 'and it stops when its key comes up');
  }));

test('the pedals chain in order, overdrive to reverb, then to the speakers', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    let at = playOn(ctx, audio, 'acoustic')[0].node;
    const order = [];
    for (let p = nextPedal(at); p; p = nextPedal(at)) {
      order.push(p.pedal);
      at = p;
    }
    assert.deepEqual(order, PEDALS);
    assert.ok(downstream(at).includes(ctx().destination), 'the last pedal reaches the speakers');
  }));

// The changes a stomp makes to the gains in and after the pedals (and the gains feeding their
// settings, like the tremolo's depth), from the stomp's time.
function stompFades(ctx, audio, id, on, at) {
  const after = downstream(nextPedal(playOn(ctx, audio, 'acoustic')[0].node));
  const feeding = after.flatMap((n) => (n.gain?.from ?? []).filter((f) => f.gain));
  const inside = [...new Set([...after.filter((n) => n.gain), ...feeding])];
  const before = new Map(inside.map((n) => [n, n.gain.events.length]));
  audio.setPedal(id, on, at);
  return inside.flatMap((n) => n.gain.events.slice(before.get(n)));
}

test('a stomp fades its pedal in or out over a few milliseconds, never cutting the sound', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    for (const id of PEDALS) {
      for (const on of [true, false]) {
        const fades = stompFades(ctx, audio, id, on, 3);
        assert.ok(fades.length >= 1, `${id} ${on ? 'on' : 'off'} changes something`);
        for (const [how, , t, tc] of fades) {
          assert.equal(how, 'target', `${id}: a fade, not a jump`);
          assert.equal(t, 3);
          assert.ok(tc > 0 && tc <= 0.01, `${id}: over a few milliseconds`);
        }
      }
    }
    assert.equal(stompFades(ctx, audio, 'delay', false, 4).length, 0, 'already off: nothing changes');
  }));

test('the overdrive hands over from your clean sound at the same moment, so there is no gap', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    const fades = stompFades(ctx, audio, 'overdrive', true, 3);
    assert.deepEqual(fades.map(([, v]) => v).sort(), [0, 0.16], 'the clean sound fades out as the driven one fades in');
    const curve = softClip();
    assert.ok(Math.abs(curve[512]) < 1e-6 && Math.abs(curve[0] + 1) < 1e-6 && Math.abs(curve[1024] - 1) < 1e-6);
    assert.ok(curve[600] - curve[512] > curve[1024] - curve[936], 'steep in the middle, flat at the ends: soft clipping');
  }));

test('pedals switched on before the sound starts are on once it does', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.setPedal('reverb', true);
    audio.start();
    assert.ok(ctx().buffers.some((b) => b.numberOfChannels === 2), "the hall's echo is worked out at the start");
    const reverbIn = downstream(playOn(ctx, audio, 'acoustic')[0].node).find((n) => n.pedal === 'reverb');
    const send = reverbIn.outs.find((n) => n.gain && n.outs.some((o) => o.kind === 'convolver'));
    assert.equal(send.gain.value, 1);
  }));

test('the tremolo pulses on the 8th notes, lined up with the band when it starts', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.startBand(1.5);
    const waves = ctx().started.filter((s) => s.kind === 'osc' && s.node.type === 'custom');
    assert.equal(waves.at(-1).t, 1.5, 'a new wave starts with the band');
    assert.ok(Math.abs(waves.at(-1).node.frequency.value - 2 / BEAT) < 1e-9, 'at the 8th notes');
    assert.deepEqual([...waves.at(-1).node.wave.real], [0, 1], 'a cosine: loudest on the 8th itself');
    assert.ok(ctx().stopped.some((st) => st.node === waves.at(-2).node && st.t === 1.5), 'the old wave hands over');
  }));

test('the delay echoes on the dotted 8th and fades over three or four repeats', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    const nodes = downstream(playOn(ctx, audio, 'acoustic')[0].node);
    const line = nodes.find((n) => n.kind === 'delay' && n.delayTime.value > 0.1);
    assert.ok(Math.abs(line.delayTime.value - BEAT * 0.75) < 1e-9);
    const loop = downstream(line).find((n) => n.gain && n.outs.includes(line));
    const repeat = loop.gain.value;
    assert.ok(repeat ** 3 > 0.03 && repeat ** 5 < 0.01, `each echo ${repeat} of the one before`);
  }));

// A loop with a layer recorded from bar line `bar` (band time): each note is [seconds after the bar
// line, pitch, seconds held].
function loopWith(bar, notes, loop = createLoop()) {
  record(loop, bar * BAR - 0.5);
  notes.forEach(([at, pitch, len], i) => {
    note(loop, bar * BAR + at, `k${i}`, { pitch, strength: 3, legato: false });
    release(loop, bar * BAR + at + len, `k${i}`);
  });
  step(loop, bar * BAR + LOOP_LENGTH);
  return loop;
}
// The sounds started since the `before`-th that are your instrument's (they go on into the pedals),
// not the band's.
const yours = (ctx, before = 0) => ctx().started.slice(before).filter((s) => nextPedal(s.node));
// Runs the audio clock on in frames from its time now to `until`, handing update the loop's notes;
// returns the looped notes scheduled, each with the time it was scheduled at.
function runLoop(ctx, audio, loop, until) {
  const out = [];
  while (ctx().currentTime < until) {
    ctx().currentTime += 1 / 60;
    for (const n of audio.update((from, to) => due(loop, from, to))) out.push({ ...n, when: ctx().currentTime });
  }
  return out;
}

test("your loop's notes are scheduled a moment ahead with the band, each once a time round, never in the past", () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.startBand(0.5);
    const loop = loopWith(1, [...Array(16).keys()].map((i) => [i * BEAT, 60 + (i % 5), 0.2]));
    const heard = runLoop(ctx, audio, loop, 0.5 + BAR + 3 * LOOP_LENGTH - 0.5);
    for (const n of heard) assert.ok(n.at >= n.when - 1e-9 && n.at <= n.when + GROOVE.ahead + 1e-9, `${n.at} scheduled at ${n.when}`);
    assert.equal(heard.length, 32, 'the 16 notes, twice round');
    heard.forEach((n, i) => {
      const want = 0.5 + BAR + LOOP_LENGTH * (1 + Math.floor(i / 16)) + (i % 16) * BEAT;
      assert.ok(Math.abs(n.at - want) < 1e-9, `note ${i} at ${n.at}, wanted ${want}`);
    });
    assert.deepEqual(yours(ctx).map((s) => s.t), heard.map((n) => n.at), 'each one sounds, as a plucked note');
  }));

test('a stall in the frames skips the note due in the gap, and schedules nothing late or twice', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.startBand(0.5);
    const loop = loopWith(1, [...Array(16).keys()].map((i) => [i * BEAT, 60 + (i % 5), 0.2]));
    // Frames run as usual through the first time round and partway into the second, then stall: the
    // next frame lands about a second later, as if the tab had been backgrounded.
    const heard = runLoop(ctx, audio, loop, 30);
    ctx().currentTime += 1;
    heard.push(...audio.update((from, to) => due(loop, from, to)).map((n) => ({ ...n, when: ctx().currentTime })));
    heard.push(...runLoop(ctx, audio, loop, 0.5 + BAR + 3 * LOOP_LENGTH - 0.5));
    assert.ok(heard.every((n) => n.at >= n.when - 1e-9), 'nothing scheduled in the past, even right after the stall');
    const keys = heard.map((n) => `${n.at.toFixed(6)}:${n.layer}`);
    assert.equal(new Set(keys).size, keys.length, 'nothing scheduled twice');
    assert.ok(!heard.some((n) => Math.abs(n.at - 30.5) < 1e-6), 'the note due inside the gap is skipped, not played late');
    assert.equal(heard.length, 31, 'the first time round in full, the second short the one note the stall swallowed');
  }));

test('a looped note is a voice of its own through your instrument and pedals: a live note on its pitch, or Space, never cuts it off', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.setInstrument('synth');
    audio.startBand(0);
    const loop = loopWith(1, [[0, 60, 2]]);
    ctx().currentTime = BAR + LOOP_LENGTH - 0.1;
    const before = ctx().started.length;
    const [n] = audio.update((from, to) => due(loop, from, to));
    const sources = yours(ctx, before).map((s) => s.node);
    assert.ok(sources.length > 0);
    assert.equal(nextPedal(sources[0]).pedal, PEDALS[0], 'into the pedals');
    assert.ok(downstream(sources[0]).includes(ctx().destination));
    ctx().currentTime = n.at + 0.5;
    audio.setRing(true);
    audio.noteOn('KeyA', 60, 3, ctx().currentTime, false);
    audio.noteOff('KeyA', ctx().currentTime + 0.1);
    audio.setRing(false);
    const stops = ctx().stopped.filter((s) => sources.includes(s.node));
    assert.ok(stops.length > 0 && stops.every((s) => s.t >= n.at + 2 - 1e-9), 'it lets go after its own 2 seconds');
    assert.ok(stops.every((s) => s.t <= n.at + 2 + VOICING.synth.release * 2 + 1e-9));
  }));

test("taking off a layer stops its notes at once: those sounding let go, and those not yet started never sound", () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.setInstrument('synth');
    audio.startBand(0);
    const loop = loopWith(1, [[0, 60, 4]]);
    loopWith(1, [[0.1, 64, 4], [0.15, 67, 4]], loop); // a second layer, from the same bar line
    ctx().currentTime = BAR + LOOP_LENGTH - 0.01;
    const before = ctx().started.length;
    audio.update((from, to) => due(loop, from, to)); // schedules all three
    const layerOf = (pitch) => yours(ctx, before).filter((s) => Math.abs(s.node.frequency.value - 440 * 2 ** ((pitch - 69) / 12)) < 0.01).map((s) => s.node);
    ctx().currentTime = BAR + LOOP_LENGTH + 0.12; // the first two have started, the third hasn't
    audio.stopLoop(1);
    const gainOf = (osc) => downstream(osc).find((g) => g.gain?.events?.length && g.kind === 'gain');
    const cut = (pitch) => layerOf(pitch).map((o) => ctx().stopped.filter((s) => s.node === o).at(-1).t);
    assert.ok(layerOf(64).length > 0, 'layer 2 is sounding, so this is checking something');
    assert.ok(cut(64).every((t) => t <= ctx().currentTime + VOICING.synth.release * 2 + 1e-9), 'the sounding note of layer 2 lets go now');
    assert.ok(gainOf(layerOf(67)[0]).cut, "layer 2's note still to come is cut off before it sounds");
    assert.ok(layerOf(60).length > 0, 'layer 1 is sounding, so this is checking something');
    assert.ok(cut(60).every((t) => t >= BAR + LOOP_LENGTH + 4 - 1e-9), 'layer 1 plays on');
  }));

test('your loop fades out with the band at the end of the set, is scheduled no further, and stops with the band', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.setInstrument('synth');
    audio.startBand(0);
    const loop = loopWith(1, [...Array(8).keys()].map((i) => [i * 1.5, 60, 0.5]));
    const end = BAR + LOOP_LENGTH + 5;
    audio.endBand(end);
    const heard = runLoop(ctx, audio, loop, end + BAR + 5);
    assert.ok(heard.length > 0 && heard.every((n) => n.at < end + BAR), 'nothing after the fade');
    const fades = downstream(yours(ctx)[0].node).flatMap((g) => g.gain?.events?.filter(([how, v]) => how === 'linear' && v === 0) ?? []);
    assert.deepEqual(fades, [['linear', 0, end + BAR]], 'it fades over the last bar');
    ctx().currentTime = end + 0.5;
    const sounding = yours(ctx).filter((s) => s.t > end - 1 && s.t < end + 0.5).map((s) => s.node);
    assert.ok(sounding.length > 0);
    audio.stopBand();
    for (const node of sounding) assert.ok(ctx().stopped.filter((s) => s.node === node).at(-1).t <= end + 0.5 + VOICING.synth.release * 2 + 1e-9);
    assert.deepEqual(audio.update((from, to) => due(loop, from, to)), [], 'and nothing more is scheduled');
  }));

test("in the shop, the band plays its electric piano alone, softer, so you can try the loop pedal over it", () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.tryBand(1);
    const last = (g) => g.gain.events.at(-1)[1];
    for (const { id } of LAYERS) assert.equal(last(ctx().busGain(id)), id === 'keys' ? 1 : 0, id);
    assert.equal(last(ctx().busGain('perc')), 0, 'no stand-in percussion either');
    const band = ctx().busGain('keys').outs[0];
    const tryLevel = band.gain.events.filter(([how, , t]) => how === 'set' && t === 1).at(-1)[1];
    audio.startBand(5);
    const setLevel = band.gain.events.filter(([how, , t]) => how === 'set' && t === 5).at(-1)[1];
    assert.ok(tryLevel > 0 && tryLevel < setLevel * 0.7, `${tryLevel} next to ${setLevel} in a set`);
  }));

test("on the map, the track you're choosing plays every part, softer than in a set", () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.previewBand(1, readyBeat('funk'));
    const last = (g) => g.gain.events.at(-1)[1];
    for (const { id } of LAYERS) assert.equal(last(ctx().busGain(id)), 1, id);
    assert.equal(last(ctx().busGain('perc')), 0, 'the drums play, so no stand-in percussion');
    const band = ctx().busGain('keys').outs[0];
    const preview = band.gain.events.filter(([how, , t]) => how === 'set' && t === 1).at(-1)[1];
    audio.startBand(5);
    const set = band.gain.events.filter(([how, , t]) => how === 'set' && t === 5).at(-1)[1];
    assert.ok(preview > 0 && preview < set * 0.7, `${preview} next to ${set} in a set`);
    audio.previewBand(6, readyBeat('bossa')); // the next track you choose takes over, as softly
    assert.equal(band.gain.events.filter(([how, , t]) => how === 'set' && t === 6).at(-1)[1], preview);
  }));

test('choosing the loop pedal in the shop, then moving straight on: the tried chord never sounds', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.tryBand(0.1); // scheduled a moment ahead, as main.js does when you choose it
    audio.stopBand(); // moving on before that moment, as a held arrow can
    const band = ctx().busGain('keys').outs[0];
    const last = [...band.gain.events].sort((a, b) => a[2] - b[2]).at(-1);
    assert.deepEqual([last[0], last[1]], ['target', 0], "the fade to nothing is last, not the try's leftover");
  }));

test("a safety before the speakers leaves the game's sound as it was, and rounds off what a loop stacks on top", () =>
  withAudio((ctx) => {
    const curve = safetyCurve(), n = curve.length;
    const at = (x) => curve[Math.round(((x / 4 + 1) / 2) * (n - 1))]; // the curve at input level x (it takes up to 4x full scale)
    for (const x of [0, 0.1, -0.3, 0.5, 0.69]) assert.ok(Math.abs(at(x) - x) < 1e-3, `${x} passes untouched`);
    assert.ok(at(1) > 0.8 && at(1) < 0.95, `full scale rounds off a little: ${at(1)}`);
    assert.ok(at(4) <= 0.95 && at(-4) >= -0.95 && at(4) > 0.94, 'four times over still never clips, with room to spare');
    for (let i = 1; i < n; i++) assert.ok(curve[i] >= curve[i - 1], 'never folds back');
    const audio = createAudio(memoryStorage());
    audio.start();
    const safety = downstream(playOn(ctx, audio, 'acoustic')[0].node).find((x) => x.kind === 'shaper' && x.outs.includes(ctx().destination));
    assert.ok(safety, 'the last thing before the speakers');
    assert.equal(safety.from[0].gain.value, 1 / 4, 'fed at a quarter, for the headroom');
  }));

test('countIn schedules a click at each given time, into its own gain feeding master, never a pedal or the band', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    const before = ctx().started.length;
    audio.countIn([1, 1.75, 2.5], 0);
    const started = ctx().started.slice(before);
    assert.ok(started.length > 0, 'the clicks sound');
    assert.deepEqual([...new Set(started.map((s) => s.t))].sort((a, b) => a - b), [1, 1.75, 2.5]);
    const cg = downstream(started[0].node).find((n) => n.countIn !== undefined);
    assert.ok(cg, "its own gain, named like the pedals so the tests can follow it");
    assert.deepEqual(cg.outs, [ctx().master()], 'into master, not a pedal or the band');
    for (const s of started) assert.equal(nextPedal(s.node), null, 'never through a pedal');
  }));

test('a count-in time already in the past is skipped', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    ctx().currentTime = 2;
    const before = ctx().started.length;
    audio.countIn([1, 1.5, 3], 0);
    const started = ctx().started.slice(before);
    assert.deepEqual([...new Set(started.map((s) => s.t))], [3], 'only the one not already past');
  }));

test("stopLoop(layer) cuts off that layer's count-in before its clicks sound, and leaves another layer's alone", () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    const before0 = ctx().started.length;
    audio.countIn([1, 2], 0);
    const clicks0 = ctx().started.slice(before0);
    const before1 = ctx().started.length;
    audio.countIn([1, 2], 1);
    const clicks1 = ctx().started.slice(before1);
    const cueGain = (s) => downstream(s.node).find((n) => n.countIn !== undefined);
    audio.stopLoop(0);
    assert.ok(clicks0.every((s) => cueGain(s).cut), "layer 0's count-in is cut off");
    assert.ok(clicks1.every((s) => !cueGain(s).cut), "layer 1's is left alone");
  }));

test('stopLoop() with no layer, and stopBand(), cut off every count-in', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.startBand(0);
    const before = ctx().started.length;
    audio.countIn([1, 2], 0);
    audio.countIn([1, 2], 1);
    const clicks = ctx().started.slice(before);
    const cueGain = (s) => downstream(s.node).find((n) => n.countIn !== undefined);
    audio.stopLoop();
    assert.ok(clicks.every((s) => cueGain(s).cut), 'stopLoop() with no layer cuts off every one');
    const before2 = ctx().started.length;
    audio.countIn([3, 4], 0);
    const more = ctx().started.slice(before2);
    audio.stopBand();
    assert.ok(more.every((s) => cueGain(s).cut), 'stopBand() cuts off every count-in too');
  }));

test('countIn does nothing without a started context', () => {
  const audio = createAudio(memoryStorage());
  assert.doesNotThrow(() => audio.countIn([1, 2], 0));
});

test('countIn makes and keeps nothing when every time is already past (R on the last beat, say)', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    ctx().currentTime = 5;
    const before = { started: ctx().started.length, gains: ctx().gainCount() };
    audio.countIn([1, 2, 3], 0);
    assert.equal(ctx().started.length, before.started, 'no click sounds');
    assert.equal(ctx().gainCount(), before.gains, 'no gain made for it either');
  }));

test('update() forgets a count-in once its clicks are done, so stopLoop no longer finds one to cut off', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.startBand(0);
    const before = ctx().started.length;
    audio.countIn([1], 0);
    const clicks = ctx().started.slice(before);
    const cueGain = (s) => downstream(s.node).find((n) => n.countIn !== undefined);
    ctx().currentTime = 1.2; // well past the click's own end
    audio.update(() => []);
    audio.stopLoop(0);
    assert.ok(clicks.every((s) => !cueGain(s).cut), 'already forgotten by update(), so stopLoop had nothing left to cut');
  }));

// Runs the audio clock on in frames from its time now to `until`, updating the band.
function runBand(ctx, audio, until) {
  while (ctx().currentTime < until) {
    ctx().currentTime += 1 / 60;
    audio.update();
  }
}
const FUNK = readyBeat('funk'), BOSSA = readyBeat('bossa');

test("the band plays a beat at its own tempo: its notes start on that beat's 16ths", () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.startBand(0.5, FUNK);
    for (const { id } of LAYERS) audio.setLayer(id, true, 0.5);
    runBand(ctx, audio, 0.5 + 2 * clockOf(FUNK).bar);
    const clock = clockOf(FUNK), times = new Set();
    for (let s = 0; s < 40; s++) times.add((0.5 + clock.timeOf16th(s)).toFixed(6)); // scheduled a moment ahead
    const band = ctx().started.filter((x) => x.t >= 0.5);
    assert.ok(band.length > 60, `${band.length} sounds`);
    for (const x of band) assert.ok(times.has(x.t.toFixed(6)), `a sound at ${x.t}, off the funk's 16ths`);
  }));

test('every ready-made beat plays in its own sounds, into its slots', () => {
  for (const beat of READY) {
    withAudio((ctx) => {
      const audio = createAudio(memoryStorage());
      audio.start();
      audio.startBand(0, beat);
      for (const { id } of LAYERS) audio.setLayer(id, true, 0);
      const before = ctx().started.length;
      runBand(ctx, audio, clockOf(beat).bar * 4);
      assert.ok(ctx().started.length - before > 60, `${beat.id}: ${ctx().started.length - before} sounds`);
    });
  }
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.startBand(0, FUNK);
    runBand(ctx, audio, 1);
    assert.ok(ctx().started.some((x) => x.kind === 'osc' && x.node.type === 'square'), "the funk's clav");
  });
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.startBand(0, BOSSA);
    runBand(ctx, audio, 1);
    assert.ok(ctx().buffers.length > 4, "the bossa's nylon strings, plucked");
  });
});

test("the delay's echo and the tremolo's pulse take the beat's tempo", () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.startBand(1, BOSSA);
    const beat = clockOf(BOSSA).beat;
    const nodes = downstream(playOn(ctx, audio, 'acoustic')[0].node);
    const line = nodes.find((n) => n.kind === 'delay' && n.delayTime.events.length);
    assert.deepEqual(line.delayTime.events.at(-1), ['set', beat * 0.75, 1]);
    const waves = ctx().started.filter((x) => x.kind === 'osc' && x.node.type === 'custom');
    assert.ok(Math.abs(waves.at(-1).node.frequency.value - 2 / beat) < 1e-9);
  }));

test('with the Pump up, the chords, bass and Pad duck on each kick, but only once the drums are heard', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    const pumped = { ...LOFI, mix: { ...LOFI.mix, pump: 1 } };
    audio.startBand(0, pumped);
    const bass = ctx().busGain('bass').from[0]; // the Pump's gain feeding the bass slot
    runBand(ctx, audio, 1);
    assert.equal(bass.gain.events.length, 0, 'no drums yet, so no pumping');
    audio.setLayer('drums', true, 1);
    runBand(ctx, audio, 5);
    const kicks = [0, 7, 10].map((s) => 3 + LOFI_CLOCK.timeOf16th(s)); // bar 1's kicks
    for (const at of kicks) {
      const ok = ([how, v, t, tc]) => how === 'target' && Math.abs(v - 0.3) < 1e-9 && Math.abs(t - at) < 1e-9 && tc > 0 && tc <= 0.005;
      assert.ok(bass.gain.events.some(ok), `ducked at ${at}, over a few ms`);
    }
    assert.ok(!bass.gain.events.some(([how]) => how === 'set'), 'never in one step, which can click on a held chord');
  }));

test("in the shop after a set, the Pump doesn't follow the kicks of drums nobody hears", () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    const pumped = { ...LOFI, mix: { ...LOFI.mix, pump: 1 } };
    audio.startBand(0, pumped);
    for (const { id } of LAYERS) audio.setLayer(id, true, 0); // the set ended with every layer in
    audio.stopBand();
    const keys = ctx().busGain('keys').from[0]; // the Pump's gain feeding the chords' slot
    const before = keys.gain.events.length;
    audio.tryBand(0.5, pumped); // only the chords are heard in the shop
    runBand(ctx, audio, 4);
    assert.equal(keys.gain.events.length, before, 'no pumping');
  }));

test('with the Vinyl off there is no crackle, no hiss and no tape wobble', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.startBand(0, FUNK);
    audio.setLayer('top', true, 0);
    const keys = ctx().busGain('keys');
    const before = ctx().started.length;
    runBand(ctx, audio, 2);
    const noise = ctx().started.slice(before).filter((x) => x.kind === 'buffer' && downstream(x.node)[0]?.type === 'highpass' && downstream(x.node).includes(keys));
    assert.equal(noise.length, 0, 'no crackle into the keys slot');
    const hiss = keys.from.find((n) => n.gain && n.gain.events.some(([how, , t]) => how === 'set' && t === 0));
    assert.equal(hiss.gain.events.at(-1)[1], 0, 'the hiss is silent');
    const wobble = ctx().started.find((x) => x.kind === 'osc' && x.node.frequency.value === 0.55).node.outs[0];
    assert.equal(wobble.gain.events.at(-1)[1], 0, 'no wobble, even with the top in');
  }));

test("a note's tone darkens it below 0.5 and brightens it above; at 0.5 it's the sound itself", () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    const beat = (tone) => ({ ...LOFI, bass: [{ s: 0, degree: 0, len: 4, vel: 0.9, tone }], chords: [], drums: [] });
    const filterOf = (tone) => {
      audio.startBand(ctx().currentTime + 0.05, beat(tone));
      audio.setLayer('bass', true, 0);
      const before = ctx().started.length;
      runBand(ctx, audio, ctx().currentTime + 0.3);
      const note = ctx().started.slice(before).find((x) => x.kind === 'osc' && x.node.type === 'triangle');
      return downstream(note.node).find((n) => n.kind === 'filter') ?? null;
    };
    assert.equal(filterOf(0.5).type, 'highpass', 'straight into the slot: the first filter is the band\'s dusty one');
    const dark = filterOf(0.2);
    assert.equal(dark.type, 'lowpass');
    assert.ok(dark.frequency.value < 1000, `${dark.frequency.value}`);
    const bright = filterOf(0.9);
    assert.equal(bright.type, 'highshelf');
    assert.ok(bright.gain.value > 8);
  }));

test("a note the studio writes on a 16th already scheduled is heard at its time, or at once if that's past", () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    const empty = { ...LOFI, drums: [], bass: [], chords: [] };
    audio.startBand(0, empty);
    audio.setLayer('bass', true, 0);
    ctx().currentTime = 1;
    audio.update(); // scheduled to about 1.2 s
    const next = [...Array(64).keys()].find((s) => LOFI_CLOCK.timeOf16th(s) >= 1.1);
    const notes = bandAt({ ...empty, bass: [{ s: next, degree: 0, len: 2, vel: 0.9, tone: 0.5 }] }, 'bass', next);
    const written = (s) => ({ part: 'bass', drum: null, layer: 'bass', notes, s });
    let before = ctx().started.length;
    audio.playWritten(written(next));
    assert.equal(ctx().started.slice(before)[0].t, LOFI_CLOCK.timeOf16th(next), 'on its 16th');
    before = ctx().started.length;
    audio.playWritten(written(next - 2)); // a 16th already gone by
    assert.equal(ctx().started.slice(before)[0].t, 1, 'at once');
    before = ctx().started.length;
    audio.playWritten(written(next + 8)); // not scheduled yet: the band will play it
    assert.equal(ctx().started.length, before);
  }));

test('changing the beat mid-loop carries on from the same 16th, timing the rest by the new tempo', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    const hatsOnly = { ...LOFI, mix: { ...LOFI.mix, vinyl: false, pad: false }, chords: [], bass: [], drums: LOFI.drums.filter((h) => h.drum === 'hats') };
    audio.startBand(0, hatsOnly);
    audio.setLayer('top', true, 0);
    audio.setLayer('drums', true, 0); // so the stand-in percussion is out
    runBand(ctx, audio, 1);
    const start = audio.bandStart;
    audio.setBeat({ ...hatsOnly, bpm: 100, swing: 0.5 });
    const before = ctx().started.length;
    runBand(ctx, audio, 3);
    const hats = [...new Set(ctx().started.slice(before).filter((x) => x.kind === 'buffer').map((x) => x.t.toFixed(6)))].map(Number).sort((a, b) => a - b);
    const gaps = hats.slice(1).map((t, i) => t - hats[i]);
    const eighth = 60 / 100 / 2;
    assert.ok(gaps.slice(1).every((g) => Math.abs(g - eighth / 2) < 1e-6 || Math.abs(g - eighth) < 1e-6), `${gaps}`);
    assert.ok(hats[0] > 1 && audio.bandStart !== start, 'nothing already scheduled moves; the band just carries on');
  }));

// The studio edits the beat the band is playing in place (audio.startBand(at, studio.beat), then
// studio.js changes it), and hands the band that same beat again. A hat on every 16th, so each one
// shows when it sounds.
const everyHat = () => ({
  ...cloneBeat(LOFI), mix: { ...LOFI.mix, vinyl: false, pad: false }, bpm: 90, swing: 0.5, chords: [], bass: [],
  drums: Array.from({ length: 64 }, (_, s) => ({ s, drum: 'hats', vel: 0.5 })),
});
// Changes the band's own beat in place with change(beat), a moment into the loop, then hands it back;
// returns when the 16ths sounded before the change and those after. The band starts at 0, so a slower
// tempo puts its first 16th before the audio clock's zero: it plays on all the same.
function changeInPlace(ctx, audio, change, until = 1.2) {
  const beat = everyHat();
  audio.startBand(0, beat);
  audio.setLayer('top', true, 0);
  audio.setLayer('drums', true, 0); // so the stand-in percussion is out
  runBand(ctx, audio, until);
  const hatTimes = (from) => [...new Set(ctx().started.slice(from).filter((x) => x.kind === 'buffer').map((x) => x.t.toFixed(6)))].map(Number).sort((a, b) => a - b);
  const before = hatTimes(0);
  change(beat);
  audio.setBeat(beat);
  const n = ctx().started.length;
  runBand(ctx, audio, until + 2);
  return { before, after: hatTimes(n) };
}

test("changing the tempo of the band's own beat in place: the next 16th keeps its time, the rest follow the new tempo", () => {
  for (const bpm of [120, 70]) {
    withAudio((ctx) => {
      const audio = createAudio(memoryStorage());
      audio.start();
      const { before, after } = changeInPlace(ctx, audio, (b) => (b.bpm = bpm));
      const was = 60 / 90 / 4, now = 60 / bpm / 4;
      assert.ok(Math.abs(after[0] - (before.at(-1) + was)) < 1e-6, `${bpm} bpm: the next 16th at ${after[0]}, wanted ${before.at(-1) + was}`);
      const gaps = after.slice(1).map((t, i) => t - after[i]);
      assert.ok(gaps.length > 4 && gaps.every((g) => Math.abs(g - now) < 1e-6), `${bpm} bpm: ${gaps}`);
    });
  }
});

test("changing the swing of the band's own beat in place: the next 16th keeps its time, the rest follow the new swing", () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    // Stopped where the next 16th is an off one (9), which the swing moves.
    const { before, after } = changeInPlace(ctx, audio, (b) => (b.swing = 0.75), 1.2);
    const beatLen = 60 / 90, clock = clockOf({ bpm: 90, swing: 0.75 });
    assert.ok(Math.abs(after[0] - (before.at(-1) + beatLen / 4)) < 1e-6, `the next 16th at ${after[0]}, wanted ${before.at(-1) + beatLen / 4}`);
    const gaps = after.slice(1).map((t, i) => t - after[i]);
    const want = after.slice(1).map((_, i) => clock.timeOf16th(10 + i) - clock.timeOf16th(9 + i));
    assert.ok(gaps.every((g, i) => Math.abs(g - want[i]) < 1e-6), `${gaps} wanted ${want}`);
  }));

// The studio's band: `beat` (one of your own, the Pad and Vinyl off unless it says) from 0.5 s,
// every layer in, as main.js starts it when you open the studio.
function studioBand(ctx, audio, over) {
  const beat = { ...cloneBeat(LOFI), mix: { ...LOFI.mix, pad: false, vinyl: false }, chords: [], bass: [], drums: [], ...over };
  audio.startBand(0.5, beat);
  audio.editBand();
  for (const { id } of LAYERS) audio.setLayer(id, true, 0.5);
  return beat;
}
// When a sound's way to the speakers is cut to silence (a gain ramped to 0), or null if it never is.
const cutAt = (node) => downstream(node).flatMap((n) => (n.kind === 'gain' ? n.gain.events.filter(([how, v]) => how === 'linear' && v === 0).map(([, , t]) => t) : []))[0] ?? null;
// The sounds started at time t since the `before`-th, and those of them that are oscillators at hz.
const startedAt = (ctx, t, before = 0) => ctx().started.slice(before).filter((x) => Math.abs(x.t - t) < 1e-9);
const oscAt = (ctx, t, hz, before = 0) => startedAt(ctx, t, before).filter((x) => x.kind === 'osc' && Math.abs(x.node.frequency.events[0]?.[1] - hz) < 0.01);
const at16 = (s) => 0.5 + LOFI_CLOCK.timeOf16th(s);

test('in the studio, painting a drum strip over a 16th the band already scheduled cuts its old hit there and plays the new; another strip plays on', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    studioBand(ctx, audio, { drums: [{ s: 8, drum: 'kick', vel: 1 }, { s: 8, drum: 'snare', vel: 0.8 }] });
    const T = at16(8);
    runBand(ctx, audio, T - 0.15); // the band has scheduled 16th 8
    const oldKick = oscAt(ctx, T, 110)[0].node;
    const snare = startedAt(ctx, T).filter((x) => x.node !== oldKick && downstream(x.node).includes(ctx().busGain('drums')));
    assert.ok(oldKick && snare.length === 2, "the band's kick and snare (a burst and a tone) at 16th 8");
    ctx().currentTime = T - 0.04; // a hold writes a moment ahead of the playhead
    const kick = { voice: 'kick', note: 0, vel: 0.7, len: 1, drum: 'kick' };
    let before = ctx().started.length;
    audio.playWritten({ part: 'drums', drum: 'kick', layer: 'drums', notes: [kick], s: 8 });
    const cut = cutAt(oldKick);
    assert.ok(cut !== null && cut >= T - 0.04 && cut <= T + 0.01, `the old kick is silent by its own time: ${cut}`);
    const fresh = oscAt(ctx, T, 110, before);
    assert.equal(fresh.length, 1, 'the new kick, on its 16th');
    assert.equal(cutAt(fresh[0].node), null);
    for (const x of snare) assert.equal(cutAt(x.node), null, 'the snare at the same 16th keeps sounding');
    // Let go and press again within the grace: the same 16th painted again replaces the new kick too.
    ctx().currentTime = T + 0.03;
    before = ctx().started.length;
    audio.playWritten({ part: 'drums', drum: 'kick', layer: 'drums', notes: [kick], s: 8 });
    const again = cutAt(fresh[0].node);
    assert.ok(again !== null && again >= T + 0.03 && again <= T + 0.03 + 0.01, `cut at once, over a few ms: ${again}`);
    assert.equal(oscAt(ctx, T + 0.03, 110, before).length, 1, 'one kick sounding, not two');
    for (const x of snare) assert.equal(cutAt(x.node), null);
  }));

test('in the studio, a bass note still sounding where a new one is painted is cut where the new one starts; the new one rings on over the empty 16ths after it', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    studioBand(ctx, audio, { bass: [{ s: 0, degree: 0, len: 8, vel: 0.9, tone: 0.5 }] });
    const T = at16(4);
    runBand(ctx, audio, T - 0.1);
    const old = oscAt(ctx, 0.5, midiToHz(36))[0].node; // C2, from 16th 0 for 8 16ths
    ctx().currentTime = T - 0.04;
    audio.playWritten({ part: 'bass', drum: null, layer: 'bass', notes: [], s: 3 }); // an empty 16th (Erase)
    assert.equal(cutAt(old), null, 'emptying a 16th trims nothing');
    const before = ctx().started.length;
    audio.playWritten({ part: 'bass', drum: null, layer: 'bass', notes: [{ voice: 'bass', note: 41, vel: 0.8, len: 4, tone: 0.5 }], s: 4 });
    const cut = cutAt(old);
    assert.ok(cut !== null && cut >= T - 0.04 && cut <= T + 0.01, `the old note stops where the new starts: ${cut}`);
    const fresh = oscAt(ctx, T, midiToHz(41), before)[0].node;
    ctx().currentTime = at16(5) - 0.04;
    audio.update();
    audio.playWritten({ part: 'bass', drum: null, layer: 'bass', notes: [], s: 5 }); // the rhythm has no hit here
    assert.equal(cutAt(fresh), null, 'the note just painted rings on');
  }));

test("in the studio, a chord painted over one still sounding cuts it and the bar's Pad where it starts; the hats in the Pad's layer play on", () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    const hats = [0, 2, 4, 6].map((s) => ({ s, drum: 'hats', vel: 0.5 }));
    studioBand(ctx, audio, { mix: { ...LOFI.mix, pad: true, vinyl: false }, chords: [{ s: 0, degree: 0, len: 16, vel: 0.5, tone: 0.5 }], drums: hats });
    const T = at16(4);
    runBand(ctx, audio, T - 0.1);
    const band = startedAt(ctx, 0.5).filter((x) => x.kind === 'osc');
    const into = (x, id) => downstream(x.node).includes(ctx().busGain(id));
    const chord = band.filter((x) => into(x, 'keys')), pad = band.filter((x) => x.node.type === 'sawtooth' && into(x, 'top'));
    assert.ok(chord.length >= 3 && pad.length >= 4, 'the chord and the Pad from 16th 0');
    const hat = startedAt(ctx, T).filter((x) => downstream(x.node).includes(ctx().busGain('top')));
    assert.equal(hat.length, 1, 'the hat on 16th 4');
    ctx().currentTime = T - 0.04;
    audio.playWritten({ part: 'chords', drum: null, layer: 'keys', notes: [60, 64, 67].map((note) => ({ voice: 'ep', note, vel: 0.5, len: 4, tone: 0.5 })), s: 4 });
    for (const x of [...chord, ...pad]) {
      const cut = cutAt(x.node);
      assert.ok(cut !== null && cut >= T - 0.04 && cut <= T + 0.01, `cut where the new chord starts: ${cut}`);
    }
    assert.equal(cutAt(hat[0].node), null, 'the hat plays on');
  }));

test('outside the studio the band makes no gates: each note goes straight into its slot, as it always has', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    const kickInto = () => oscAt(ctx, ctx().started.filter((x) => x.kind === 'osc' && x.node.frequency.events[0]?.[1] === 110).at(-1).t, 110)[0].node.outs[0].outs[0];
    audio.editBand(); // the studio, then a set: starting the band turns the gates off
    audio.startBand(0.5);
    runBand(ctx, audio, 1.5);
    assert.equal(kickInto(), ctx().busGain('drums'), 'in a set');
    audio.startBand(2);
    audio.editBand();
    runBand(ctx, audio, 3);
    const gate = kickInto();
    assert.notEqual(gate, ctx().busGain('drums'));
    assert.deepEqual(gate.outs, [ctx().busGain('drums')], 'in the studio, through a gate into the same slot');
  }));

// The Vinyl's hiss: the gain after its looped noise.
const hissOf = (ctx) => downstream(ctx().started.find((x) => x.kind === 'buffer' && x.node.loop).node).find((n) => n.kind === 'gain');

test("the Vinyl's hiss is silent until a band starts, so the map doesn't hiss from the first key", () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start(); // the default beat is Lo-fi, whose Vinyl is on
    const hiss = hissOf(ctx);
    assert.equal(hiss.gain.value, 0, 'silent with no band');
    assert.deepEqual(hiss.gain.events, [], 'and nothing scheduled to raise it');
    audio.startBand(1, LOFI);
    const [how, level, at] = hiss.gain.events.at(-1);
    assert.deepEqual([how, at], ['set', 1], 'a band with the Vinyl on: from its first 16th...');
    assert.ok(level > 0 && level <= 0.05, `...at the hiss's quiet level: ${level}`);
    audio.stopBand();
    audio.startBand(3, FUNK);
    assert.deepEqual(hiss.gain.events.at(-1), ['set', 0, 3], 'a band with the Vinyl off: silent');
  }));

// Runs fn with Math.random drawing from a seeded stream (rng.js), so the birds sing the same songs
// on every run; Math.random is put back after.
function seeded(seed, fn) {
  const random = Math.random, rng = createRng(seed);
  Math.random = () => nextRandom(rng);
  try {
    return fn();
  } finally {
    Math.random = random;
  }
}
// A bird's notes since the `before`-th sound: the oscillators that play through a panner (a bird's
// place). panOf gives the panner a note plays through: which bird sang it.
const panOf = (x) => downstream(x.node).find((n) => n.kind === 'panner');
const birdNotes = (ctx, before = 0) => ctx().started.slice(before).filter((x) => x.kind === 'osc' && panOf(x));

test('birds asked for before the sound starts sing once it does, a second or two in, each in its place, into their own gain and on to master', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.birds(true); // the map opens under the title, before the first key
    audio.start();
    runBand(ctx, audio, 20);
    const notes = birdNotes(ctx);
    assert.ok(notes.length > 0, 'they sing');
    assert.ok(notes[0].t >= 1 - 1e-9 && notes[0].t <= 2 + 1e-9, `the first song a second or two in: ${notes[0].t}`);
    const birds = ctx().birdsGain();
    assert.equal(birds.kind, 'gain');
    assert.deepEqual(birds.outs, [ctx().master()], 'into master, so the volume and mute apply to them');
    const band = ctx().busGain('keys').outs[0];
    for (const x of notes) {
      assert.ok(panOf(x).outs.includes(birds), 'through its place into the birds gain');
      assert.ok(!downstream(x.node).includes(band), "never through the band's bus and its dusty filter");
    }
    const places = ctx().panners().map((p) => p.pan.value);
    assert.equal(new Set(places).size, 3, `three birds, each in a place of its own: ${places}`);
    assert.ok(places.every((p) => p >= -1 && p <= 1));
  }));

test('with no birds asked for, none sing', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    const before = ctx().started.length;
    runBand(ctx, audio, 30);
    assert.equal(ctx().started.length, before, 'no band and no birds: nothing at all');
  }));

test("every bird's note is a high sine, and quiet, well under the music", () =>
  seeded(7, () =>
    withAudio((ctx) => {
      const audio = createAudio(memoryStorage());
      audio.start();
      audio.birds(true);
      runBand(ctx, audio, 120);
      const notes = birdNotes(ctx), level = ctx().birdsGain().gain.value; // all the way in by now
      assert.ok(notes.length > 20 && level > 0, `${notes.length} notes, the birds at ${level}`);
      assert.equal(new Set(notes.map(panOf)).size, 3, 'all three birds sang');
      for (const x of notes) {
        assert.equal(x.node.type, 'sine');
        for (const [, hz] of x.node.frequency.events) assert.ok(hz >= 2000 && hz <= 6000, `${hz} Hz`);
        const peak = Math.max(...x.node.outs[0].gain.events.map(([, v]) => v));
        assert.ok(peak * level <= 0.02 + 1e-9, `a note peaking at ${peak * level}`);
      }
    })));

test("the birds sing with no band at all, and the band stopping (a preview changing, leaving the map) doesn't touch them", () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.birds(true);
    runBand(ctx, audio, 15);
    assert.ok(birdNotes(ctx).length > 0, 'singing, with no band');
    const birds = ctx().birdsGain(), events = birds.gain.events.length;
    audio.previewBand(ctx().currentTime + 0.1, FUNK);
    runBand(ctx, audio, 18);
    audio.stopBand();
    assert.equal(birds.gain.events.length, events, 'the band coming and going leaves their gain alone');
    const before = ctx().started.length;
    runBand(ctx, audio, 40);
    assert.ok(birdNotes(ctx, before).length > 0, 'and they sing on');
  }));

test('birds(false) fades them out and starts no new song; birds(true) again fades them back in and they sing on', () =>
  withAudio((ctx) => {
    const audio = createAudio(memoryStorage());
    audio.start();
    audio.birds(true);
    const birds = ctx().birdsGain(), fade = () => birds.gain.events.at(-1);
    let [how, level, at, tc] = fade();
    assert.deepEqual([how, at], ['target', 0], 'they fade in from now...');
    assert.ok(level > 0 && tc >= 0.1 && tc <= 0.5, `...over about a second: to ${level}, ${tc}`);
    runBand(ctx, audio, 10);
    audio.birds(false); // leaving the map
    [how, level, at, tc] = fade();
    assert.deepEqual([how, level, at], ['target', 0, ctx().currentTime], 'they fade out from now...');
    assert.ok(tc >= 0.1 && tc <= 0.5, `...over about a second: ${tc}`);
    const events = birds.gain.events.length;
    audio.birds(false);
    assert.equal(birds.gain.events.length, events, 'asking again changes nothing');
    const before = ctx().started.length;
    runBand(ctx, audio, 70);
    assert.equal(ctx().started.length, before, 'no new song, over a minute');
    const on = ctx().currentTime;
    audio.birds(true); // back on the map
    [how, level, at] = fade();
    assert.ok(how === 'target' && level > 0 && at === on, 'they fade back in');
    audio.birds(true);
    assert.equal(birds.gain.events.length, events + 1, 'asking again changes nothing');
    runBand(ctx, audio, 90);
    const again = birdNotes(ctx, before);
    assert.ok(again.length > 0, 'and they sing again');
    assert.ok(again[0].t >= on + 1 - 1e-9, `a second or two after they come back: ${again[0].t - on}`);
  }));

test('after a stall the birds make up nothing: no song while the context is suspended, and at most one, none in the past, after a minute hidden', () =>
  seeded(3, () =>
    withAudio((ctx) => {
      const audio = createAudio(memoryStorage());
      audio.birds(true);
      audio.start();
      runBand(ctx, audio, 10);
      ctx().suspend();
      let before = ctx().started.length;
      audio.update();
      assert.equal(ctx().started.length, before, 'nothing while the context is suspended');
      ctx().resume();
      ctx().currentTime += 60; // a hidden tab: no frames, but the audio clock ran on
      const now = ctx().currentTime;
      before = ctx().started.length;
      audio.update();
      const notes = birdNotes(ctx, before);
      assert.ok(notes.every((x) => x.t >= now - 1e-9), 'nothing in the past');
      assert.ok(new Set(notes.map(panOf)).size <= 1 && notes.every((x) => x.t < now + 1.5), "one song at most, not a minute's worth");
      before = ctx().started.length;
      runBand(ctx, audio, now + 0.3);
      assert.equal(birdNotes(ctx, before).length, 0, 'and none more on the frames after');
    })));

test('a bird sings every few seconds; now and then another answers, and now and then there is a longer quiet', () =>
  seeded(11, () =>
    withAudio((ctx) => {
      const audio = createAudio(memoryStorage());
      audio.birds(true);
      audio.start();
      runBand(ctx, audio, 600);
      // The songs, each { start, end, bird }: notes are under 0.2 s apart within a song.
      const songs = [];
      for (const x of birdNotes(ctx).sort((a, b) => a.t - b.t)) {
        const end = x.node.outs[0].gain.events.at(-1)[2], song = songs.at(-1);
        if (song && x.t - song.end < 0.2) {
          assert.equal(panOf(x), song.bird, 'one bird to a song');
          song.end = Math.max(song.end, end);
        } else songs.push({ start: x.t, end, bird: panOf(x) });
      }
      assert.ok(songs[0].start >= 1 - 1e-9 && songs[0].start <= 2 + 1e-9, 'the first a second or two in');
      const gaps = songs.slice(1).map((s, i) => ({ gap: s.start - songs[i].end, same: s.bird === songs[i].bird }));
      assert.ok(gaps.length > 60, `${gaps.length + 1} songs in ten minutes`);
      const answers = gaps.filter((g) => g.gap < 2), hushes = gaps.filter((g) => g.gap > 7.5);
      for (const { gap, same } of answers) assert.ok(gap >= 0.4 - 1e-9 && gap <= 1.2 + 1e-9 && !same, `an answer ${gap} s after, by another bird`);
      for (const { gap } of hushes) assert.ok(gap >= 8 - 1e-9 && gap <= 14 + 1e-9, `a longer quiet: ${gap} s`);
      for (const { gap } of gaps) assert.ok(gap < 2 || gap > 7.5 || (gap >= 2.5 - 1e-9 && gap <= 7 + 1e-9), `a song ${gap} s after the last`);
      assert.ok(answers.length > gaps.length / 5 && answers.length < gaps.length / 2, `${answers.length} answers in ${gaps.length}`);
      assert.ok(hushes.length > gaps.length / 15 && hushes.length < gaps.length / 4, `${hushes.length} longer quiets in ${gaps.length}`);
    })));

test('in a browser with no stereo panner, the birds sing all the same, straight into their gain', () =>
  withAudio(
    (ctx) => {
      const audio = createAudio(memoryStorage());
      audio.birds(true);
      audio.start();
      const before = ctx().started.length;
      runBand(ctx, audio, 20);
      const notes = ctx().started.slice(before);
      assert.ok(notes.length > 0, 'they sing');
      for (const x of notes) {
        const birds = x.node.outs[0].outs[0]; // past the note's own gain
        assert.ok(birds.gain.value > 0 && birds.outs.includes(ctx().master()), 'into the birds gain, on to master');
      }
    },
    { panner: false },
  ));
