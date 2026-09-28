import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAudio, pluckSamples } from '../src/audio.js';
import { fakeAudioContext } from './fake-audio.js';
import { BAR } from '../src/groove.js';
import { PLAY, GROOVE } from '../src/tuning.js';

function memoryStorage() {
  const m = new Map();
  return { get: (k) => (m.has(k) ? m.get(k) : null), set: (k, v) => m.set(k, String(v)) };
}

// Runs fn with a fake AudioContext installed; fn gets a function returning the context made.
function withAudio(fn) {
  let ctx;
  globalThis.AudioContext = function () {
    ctx = fakeAudioContext();
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
