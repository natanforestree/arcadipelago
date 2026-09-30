// The loop pedal: R records 4 bars of what you play, from the next bar line, and they play on under
// you, over and over, up to LOOP.layers layers deep; Backspace takes the last one off. It keeps your
// notes, not their sound (when each started, its pitch, how hard it was picked, whether it was a
// hammer-on, and how long it sounded), so audio.js plays them again through your instrument and your
// pedals as they are at the time.
//
// Times are band time: seconds since the band's first 16th (in a set, since your first note), so the
// bar lines fall on whole numbers of the beat's bar (the loop's clock). Pure, so it's tested in Node; main.js runs it, audio.js
// plays it and render.js shows it. The crowd never hears it: set.js and the rules never import it.
import { LOOP } from './tuning.js';
import { LOFI_CLOCK } from './beats.js';

// Seconds: one pass of the loop, LOOP.bars of its beat's bars.
export const loopLength = (loop) => LOOP.bars * loop.clock.bar;
// Seconds: how early a note can be for a recording's first bar line.
const early = (loop) => (LOOP.early * loop.clock.beat) / 4;

// { clock, layers, take, ring }: the beat's timing (beats.js clockOf), the layers so far, oldest first, each { from: the band time its recording
// started, notes }; the recording waiting or under way, { from, armed, notes, sounding }, or null; and
// whether Space is held. `armed` is the band time R was pressed, for the count-in (countBeats). Each
// note is { at: seconds after its layer's first bar line (a hair below 0 if it came early), pitch,
// strength, legato, len: seconds it sounded, null while it still does }.
export function createLoop(clock = LOFI_CLOCK) {
  return { clock, layers: [], take: null, ring: false };
}

// R at band time t: arms a recording from the next bar line. Returns false, doing nothing, while a
// recording is waiting or under way, or when the loop is full.
export function record(loop, t) {
  if (loop.take || loop.layers.length >= LOOP.layers) return false;
  const bar = loop.clock.bar;
  loop.take = { from: (Math.floor(t / bar) + 1) * bar, armed: t, notes: [], sounding: [] };
  return true;
}

// The band times of the count-in's clicks for the recording that's waiting: every beat (a whole
// multiple of the clock's beat) strictly after R was pressed and strictly before the bar line it arms
// from, in order ([] with no take). Integer beat indices, not repeated addition, keep the times exact
// multiples of a beat; a small tolerance keeps float error from ever including the bar line itself.
export function countBeats(loop) {
  const take = loop.take;
  if (!take) return [];
  const out = [], beat = loop.clock.beat;
  for (let k = Math.floor(take.armed / beat) + 1; k * beat < take.from - 1e-9; k++) out.push(k * beat);
  return out;
}

// A note you play starts at band time t (id: its key, for its release). It's kept if a recording is
// under way, or about to start within a 16th (LOOP.early). Striking a pitch that's still ringing from Space ends the
// ringing note there, as it does in the sound. Returns whether the note was kept.
export function note(loop, t, id, { pitch, strength, legato }) {
  const take = loop.take;
  if (!take) return false;
  for (const s of take.sounding.filter((x) => x.ringing && x.note.pitch === pitch)) end(loop, s, t);
  if (t < take.from - early(loop) || t >= take.from + loopLength(loop)) return false;
  const n = { at: t - take.from, pitch, strength, legato, len: null };
  take.notes.push(n);
  take.sounding.push({ id, note: n, ringing: false });
  return true;
}

// Key `id` comes up at band time t: its note ends there, or rings on while Space is held.
export function release(loop, t, id) {
  const s = loop.take?.sounding.find((x) => x.id === id && !x.ringing);
  if (!s) return;
  if (loop.ring) s.ringing = true;
  else end(loop, s, t);
}

// Space goes down (on) or comes up at band time t. Letting it go ends every note still ringing.
export function ring(loop, t, on) {
  loop.ring = on;
  if (on || !loop.take) return;
  for (const s of loop.take.sounding.filter((x) => x.ringing)) end(loop, s, t);
}

// A recorded note stops sounding at band time t, or where its recording ends if that's sooner.
function end(loop, s, t) {
  const take = loop.take;
  s.note.len = Math.max(0, Math.min(t, take.from + loopLength(loop)) - take.from - s.note.at);
  take.sounding.splice(take.sounding.indexOf(s), 1);
}

// Time runs on to band time t. Once a recording's 4 bars are up it joins the loop as a layer, any note
// still sounding cut off at its end, and step returns 'layer'; otherwise null.
export function step(loop, t) {
  const take = loop.take;
  if (!take || t < take.from + loopLength(loop)) return null;
  for (const s of [...take.sounding]) end(loop, s, t);
  loop.layers.push({ from: take.from, notes: take.notes });
  loop.take = null;
  return 'layer';
}

// Backspace: cancels a recording that's waiting or under way ('cancelled'); otherwise takes off the
// last layer ('removed', or 'cleared' if it was the only one). null when there's nothing to undo.
export function undo(loop) {
  if (loop.take) {
    loop.take = null;
    return 'cancelled';
  }
  if (!loop.layers.length) return null;
  loop.layers.pop();
  return loop.layers.length ? 'removed' : 'cleared';
}

// The looped notes that start at band times in [from, to), in time order: { t, pitch, strength,
// legato, len, layer } (layer: its index in loop.layers; a recording's is loop.layers.length). Each
// layer plays from the end of its recording, time after time. A recording's notes are due from then
// too, so a note played early for its first bar line sounds just as early the first time round.
export function due(loop, from, to) {
  const out = [], length = loopLength(loop);
  const layers = loop.take ? [...loop.layers, loop.take] : loop.layers;
  layers.forEach((layer, i) => {
    for (const n of layer.notes) {
      const first = layer.from + length + n.at; // its first time round
      // Each time is worked out from the first, never added up, so nothing drifts.
      for (let k = Math.max(0, Math.floor((from - first) / length)); first + k * length < to; k++) {
        const t = first + k * length;
        if (t >= from) out.push({ t, pitch: n.pitch, strength: n.strength, legato: n.legato, len: n.len ?? length - n.at, layer: i });
      }
    }
  });
  return out.sort((a, b) => a.t - b.t);
}

// What the loop is doing at band time t: 'waiting' for its recording's bar line, 'recording',
// 'playing', or 'empty'.
export function loopState(loop, t) {
  if (loop.take) return t < loop.take.from ? 'waiting' : 'recording';
  return loop.layers.length ? 'playing' : 'empty';
}
