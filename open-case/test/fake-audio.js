// A stand-in for Web Audio in Node, enough for audio.js to build and play everything. It records
// every sound started (what and when) and every buffer made, so tests can see what was played.
function param(value = 0) {
  return {
    value,
    setValueAtTime(v) {
      this.value = v;
    },
    exponentialRampToValueAtTime() {},
    linearRampToValueAtTime(v) {
      this.value = v;
    },
    setTargetAtTime(v) {
      this.value = v;
    },
    cancelScheduledValues() {},
  };
}

export function fakeAudioContext() {
  const started = [], stopped = [], buffers = [];
  const node = (extra = {}) => ({
    connect: (to) => to,
    disconnect() {},
    ...extra,
  });
  const ctx = {
    started, stopped, buffers,
    currentTime: 0,
    sampleRate: 8000,
    state: 'running',
    baseLatency: 0.005,
    outputLatency: 0.01,
    destination: node(),
    resume() {
      ctx.state = 'running';
    },
    suspend() {
      ctx.state = 'suspended';
    },
    getOutputTimestamp: () => ({ contextTime: ctx.currentTime, performanceTime: 5000 + ctx.currentTime * 1000 }),
    createGain: () => node({ gain: param(1) }),
    createBiquadFilter: () => node({ type: 'lowpass', frequency: param(350), Q: param(1), gain: param(0) }),
    createBuffer: (ch, len, rate) => {
      const data = new Float32Array(len);
      const b = { length: len, duration: len / rate, getChannelData: () => data };
      buffers.push(b);
      return b;
    },
    createBufferSource: () => {
      const s = node({ buffer: null, loop: false, start: (t = 0, offset = 0) => started.push({ kind: 'buffer', t, offset, buffer: s.buffer }), stop: (t) => stopped.push({ kind: 'buffer', t }) });
      return s;
    },
    createOscillator: () => node({ type: 'sine', frequency: param(440), detune: param(0), start: (t = 0) => started.push({ kind: 'osc', t }), stop() {} }),
  };
  return ctx;
}
