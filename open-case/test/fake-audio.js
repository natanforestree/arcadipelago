// A stand-in for Web Audio in Node, enough for audio.js to build and play everything. It records
// every sound started and stopped (what and when, and how long a buffer was started to play for),
// every buffer made, every connection (each node's `outs`, and what feeds each node or setting in
// its `from`), and every change scheduled on a setting (each param's `events`), so tests can see
// what was played and how things are wired.
function param(value = 0) {
  return {
    value,
    events: [], // [method, value, time, time constant]
    setValueAtTime(v, t) {
      this.value = v;
      this.events.push(['set', v, t]);
    },
    exponentialRampToValueAtTime(v, t) {
      this.events.push(['exp', v, t]);
    },
    linearRampToValueAtTime(v, t) {
      this.value = v;
      this.events.push(['linear', v, t]);
    },
    setTargetAtTime(v, t, tc) {
      this.value = v;
      this.events.push(['target', v, t, tc]);
    },
    cancelScheduledValues(t) {
      this.events = this.events.filter(([, , time]) => time < t);
    },
  };
}

export function fakeAudioContext() {
  const started = [], stopped = [], buffers = [];
  const node = (kind, extra = {}) => {
    const n = {
      kind,
      outs: [],
      connect: (to) => {
        n.outs.push(to);
        (to.from ??= []).push(n); // what feeds a node or a setting (a wave into a gain, say)
        return to;
      },
      disconnect() {
        n.cut = true; // cut off from everything it fed
      },
      ...extra,
    };
    return n;
  };
  const ctx = {
    started, stopped, buffers,
    currentTime: 0,
    sampleRate: 8000,
    state: 'running',
    baseLatency: 0.005,
    outputLatency: 0.01,
    destination: node('destination'),
    resume() {
      ctx.state = 'running';
    },
    suspend() {
      ctx.state = 'suspended';
    },
    getOutputTimestamp: () => ({ contextTime: ctx.currentTime, performanceTime: 5000 + ctx.currentTime * 1000 }),
    createGain: () => node('gain', { gain: param(1) }),
    createBiquadFilter: () => node('filter', { type: 'lowpass', frequency: param(350), Q: param(1), gain: param(0) }),
    createWaveShaper: () => node('shaper', { curve: null, oversample: 'none' }),
    createDelay: (most = 1) => node('delay', { most, delayTime: param(0) }),
    createConvolver: () => node('convolver', { buffer: null, normalize: true }),
    createStereoPanner: () => node('panner', { pan: param(0) }),
    createBuffer: (ch, len, rate) => {
      const data = new Float32Array(len);
      const b = { length: len, duration: len / rate, numberOfChannels: ch, getChannelData: () => data };
      buffers.push(b);
      return b;
    },
    createBufferSource: () => {
      const s = node('buffer', { buffer: null, loop: false, start: (t = 0, offset = 0, duration = Infinity) => started.push({ kind: 'buffer', t, offset, duration, buffer: s.buffer, node: s }), stop: (t) => stopped.push({ kind: 'buffer', t, node: s }) });
      return s;
    },
    createOscillator: () => {
      const o = node('osc', {
        type: 'sine', frequency: param(440), detune: param(0),
        setPeriodicWave(w) {
          o.type = 'custom';
          o.wave = w;
        },
        start: (t = 0) => started.push({ kind: 'osc', t, node: o }),
        stop: (t) => stopped.push({ kind: 'osc', t, node: o }),
      });
      return o;
    },
    createPeriodicWave: (real, imag) => ({ real, imag }),
  };
  return ctx;
}
