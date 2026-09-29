// The loop pedal: R records 4 bars of what you play, from the next bar line, and they play on under
// you, over and over, up to LOOP.layers layers deep; Backspace takes the last one off. It keeps your
// notes, not their sound (when each started, its pitch, how hard it was picked, whether it was a
// hammer-on, and how long it sounded), so audio.js plays them again through your instrument and your
// pedals as they are at the time.
//
// Times are band time: seconds since the band's first 16th (in a set, since your first note), so the
// bar lines fall on whole numbers of BAR. Pure, so it's tested in Node; main.js runs it, audio.js
// plays it and render.js shows it. The crowd never hears it: set.js and the rules never import it.
import { LOOP } from './tuning.js';
import { BAR, BEAT } from './groove.js';

export const LOOP_LENGTH = LOOP.bars * BAR; // seconds: one pass of the chords
const EARLY = (LOOP.early * BEAT) / 4; // seconds: how early a note can be for a recording's first bar line

// { layers, take, ring }: the layers so far, oldest first, each { from: the band time its recording
// started, notes }; the recording waiting or under way, { from, notes, sounding }, or null; and
// whether Space is held. Each note is { at: seconds after its layer's first bar line (a hair below 0
// if it came early), pitch, strength, legato, len: seconds it sounded, null while it still does }.
export function createLoop() {
  return { layers: [], take: null, ring: false };
}

// R at band time t: arms a recording from the next bar line. Returns false, doing nothing, while a
// recording is waiting or under way, or when the loop is full.
export function record(loop, t) {
  if (loop.take || loop.layers.length >= LOOP.layers) return false;
  loop.take = { from: (Math.floor(t / BAR) + 1) * BAR, notes: [], sounding: [] };
  return true;
}

// A note you play starts at band time t (id: its key, for its release). It's kept if a recording is
// under way, or about to start within EARLY. Striking a pitch that's still ringing from Space ends the
// ringing note there, as it does in the sound. Returns whether the note was kept.
export function note(loop, t, id, { pitch, strength, legato }) {
  const take = loop.take;
  if (!take) return false;
  for (const s of take.sounding.filter((x) => x.ringing && x.note.pitch === pitch)) end(take, s, t);
  if (t < take.from - EARLY || t >= take.from + LOOP_LENGTH) return false;
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
  else end(loop.take, s, t);
}

// Space goes down (on) or comes up at band time t. Letting it go ends every note still ringing.
export function ring(loop, t, on) {
  loop.ring = on;
  if (on || !loop.take) return;
  for (const s of loop.take.sounding.filter((x) => x.ringing)) end(loop.take, s, t);
}

// A recorded note stops sounding at band time t, or where its recording ends if that's sooner.
function end(take, s, t) {
  s.note.len = Math.max(0, Math.min(t, take.from + LOOP_LENGTH) - take.from - s.note.at);
  take.sounding.splice(take.sounding.indexOf(s), 1);
}

// Time runs on to band time t. Once a recording's 4 bars are up it joins the loop as a layer, any note
// still sounding cut off at its end, and step returns 'layer'; otherwise null.
export function step(loop, t) {
  const take = loop.take;
  if (!take || t < take.from + LOOP_LENGTH) return null;
  for (const s of [...take.sounding]) end(take, s, t);
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
  const out = [];
  const layers = loop.take ? [...loop.layers, loop.take] : loop.layers;
  layers.forEach((layer, i) => {
    for (const n of layer.notes) {
      const first = layer.from + LOOP_LENGTH + n.at; // its first time round
      // Each time is worked out from the first, never added up, so nothing drifts.
      for (let k = Math.max(0, Math.floor((from - first) / LOOP_LENGTH)); first + k * LOOP_LENGTH < to; k++) {
        const t = first + k * LOOP_LENGTH;
        if (t >= from) out.push({ t, pitch: n.pitch, strength: n.strength, legato: n.legato, len: n.len ?? LOOP_LENGTH - n.at, layer: i });
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
