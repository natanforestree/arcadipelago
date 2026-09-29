import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAudio, pluckSamples, softClip, safetyCurve, VOICING } from '../src/audio.js';
import { fakeAudioContext } from './fake-audio.js';
import { BAR, BEAT, timeOf16th } from '../src/groove.js';
import { PLAY, GROOVE, LAYERS } from '../src/tuning.js';
import { PEDALS, INSTRUMENTS } from '../src/gear.js';
import { createLoop, record, note, release, step, due, LOOP_LENGTH } from '../src/looper.js';

function memoryStorage() {
  const m = new Map();
  return { get: (k) => (m.has(k) ? m.get(k) : null), set: (k, v) => m.set(k, String(v)) };
}

// Runs fn with a fake AudioContext installed; fn gets a function returning the context made. The
// context's createGain is wrapped to remember every gain node in the order audio.js makes them
// (master, band, then each of LAYERS, then the stand-in percussion bus), so a test can read a bus's
// level the same way it reads any other recorded node — ctx().busGain(id).gain.value.
function withAudio(fn) {
  let ctx;
  globalThis.AudioContext = function () {
    ctx = fakeAudioContext();
    const gains = [];
    const createGain = ctx.createGain;
    ctx.createGain = () => {
      const g = createGain();
      gains.push(g);
      return g;
    };
    ctx.busGain = (id) => {
      const i = LAYERS.findIndex((l) => l.id === id);
      return gains[2 + (i < 0 ? LAYERS.length : i)];
    };
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
