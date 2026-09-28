// The crowd's ears: what they notice in what you play. Pure: it's fed notes and the passing of time,
// and writes rule events into l.events for the crowd to react to. Times are seconds from the set's
// first note; the rules judge onsets rounded to the nearest (swung) 16th.
//
//   A note is its pitch, its onset in 16ths and its pick strength.
//   A shape is 4 notes in a row: their 3 steps in pitch (semitones) and 3 gaps in time (16ths, capped).
//   A phrase ends when no key has been held, and no note started, for a whole beat.
//   An idea is the opening shape of a phrase of 4 notes or more; the memory strip keeps the last 6.
//
// Events: { rule } with rule one of 'repeat', 'offKey', 'callback', 'recognised', 'random', 'silence',
// 'loud', and also 'phrase' ({ clean, loud, notes }) when a phrase ends and 'bar' ({ bar, count, off,
// rest }) at each bar line, for the crowd's tastes.
import { RULES } from './tuning.js';
import { BAR, BEAT, sixteenthAt, inKey, isStrong, isOff16th } from './groove.js';

export function createListener() {
  return {
    notes: [], // { pitch, s, strength, echo }: echo is the most times a shape it's part of has come round lately
    shapes: [], // shapes[i]: the key of the shape ending at note i (null for the set's first 3 notes)
    held: 0, // keys down
    quietAt: 0, // when the last key went up
    phrase: null, // the phrase being played (see noteOn)
    strip: [], // the memory strip, oldest first: { steps, gaps, pitch, bar, calledBar }
    bar: 0, // bar lines passed
    lastNoteBar: -1,
    events: [],
  };
}

const emit = (l, rule, extra) => l.events.push({ rule, ...extra });
const sameList = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
// Two shapes' steps are compared in semitones, as the spec says. (Comparing scale steps instead would
// hear a figure moved within the key as the same idea; change it here if play-testing asks for that.)
export const sameSteps = sameList;

// The shape of notes[i..i+3].
export function shapeOf(notes, i) {
  const steps = [], gaps = [];
  for (let k = 0; k < 3; k++) {
    steps.push(notes[i + k + 1].pitch - notes[i + k].pitch);
    gaps.push(Math.min(RULES.gapCap, notes[i + k + 1].s - notes[i + k].s));
  }
  return { steps, gaps, pitch: notes[i].pitch };
}
const keyOf = ({ steps, gaps }) => `${steps.join(',')}/${gaps.join(',')}`;
// A shape as a string: equal strings are the same shape, wherever it starts.
export const shapeKey = (notes, i) => keyOf(shapeOf(notes, i));

export function noteOn(l, pitch, t, strength) {
  // A beat of quiet ended the last phrase, even if no update has run since to notice.
  if (l.phrase && l.held === 0 && t - l.quietAt >= RULES.phraseEndBeats * BEAT) endPhrase(l);
  const s = sixteenthAt(t);
  const i = l.notes.length;
  const note = { pitch, s, strength, echo: 1 };
  l.notes.push(note);
  l.held++;
  l.lastNoteBar = Math.floor(s / 16);
  if (!l.phrase) l.phrase = { first: i, judged: i, strong: 0, bad: 0, frownedAt: 0, broken: false, loud: false, matched: false };
  const p = l.phrase;
  if (strength >= RULES.loudStrength) {
    p.loud = true;
    emit(l, 'loud');
  }
  // Repeat: this note completes a shape; count it among the shapes wholly inside the last 16 notes.
  const key = i >= 3 ? keyOf(shapeOf(l.notes, i - 3)) : null;
  l.shapes.push(key);
  if (key) {
    let count = 0;
    for (let j = Math.max(3, i - RULES.repeatWindow + 4); j <= i; j++) if (l.shapes[j] === key) count++;
    for (let j = i - 3; j <= i; j++) l.notes[j].echo = Math.max(l.notes[j].echo, count); // all 4 of the shape's glyphs
    if (count >= RULES.repeatTimes) {
      p.broken = true;
      emit(l, 'repeat');
    }
  }
  if (i - p.first === 3) opening(l, p);
}

export function noteOff(l, t) {
  l.held = Math.max(0, l.held - 1);
  if (l.held === 0) l.quietAt = t;
}

// A phrase's first 4 notes are in: is it an idea from the strip coming back?
function opening(l, p) {
  const o = shapeOf(l.notes, p.first);
  const bar = Math.floor(l.notes[p.first].s / 16);
  const at = l.strip.findIndex((idea) => sameSteps(idea.steps, o.steps));
  if (at < 0) return;
  const idea = l.strip[at];
  if (bar - idea.bar < RULES.callbackAge) return;
  const unchanged = idea.pitch === o.pitch && sameList(idea.gaps, o.gaps);
  if (!unchanged && idea.calledBar !== null && bar - idea.calledBar < RULES.callbackEvery) return;
  // Called back or recognised, the idea counts as fresh: it takes its new form and moves to the end.
  l.strip.splice(at, 1);
  l.strip.push({ ...o, bar, calledBar: unchanged ? idea.calledBar : bar });
  p.matched = true;
  emit(l, unchanged ? 'recognised' : 'callback', { age: bar - idea.bar, first: p.first });
}

// Off key: counts the phrase's strong-beat notes from p.judged up to (not including) note `upto`, and
// frowns if more than 1 in 4 of all its strong-beat notes so far are outside the key, and some are new
// since the last frown. At a bar line (not `final`) a phrase needs a few strong-beat notes first, so
// one early note can't decide it.
function judgeKey(l, p, upto, final) {
  for (let i = p.judged; i < upto; i++) {
    const n = l.notes[i];
    if (!isStrong(n.s)) continue;
    p.strong++;
    if (!inKey(n.pitch) && !isColour(l, i)) p.bad++;
  }
  p.judged = Math.max(p.judged, upto);
  if ((final || p.strong >= RULES.offKeyMinStrong) && p.bad > p.frownedAt && p.bad / p.strong > RULES.offKeyShare) {
    p.frownedAt = p.bad;
    p.broken = true;
    emit(l, 'offKey');
  }
}

// An outside note followed within a beat by a step of 1 or 2 semitones to an in-key note.
function isColour(l, i) {
  const n = l.notes[i], next = l.notes[i + 1];
  if (!next || next.s - n.s > RULES.colourWithin || !inKey(next.pitch)) return false;
  const step = Math.abs(next.pitch - n.pitch);
  return step === 1 || step === 2;
}

function endPhrase(l) {
  const p = l.phrase;
  judgeKey(l, p, l.notes.length, true);
  const count = l.notes.length - p.first;
  emit(l, 'phrase', { clean: !p.broken, loud: p.loud, notes: count });
  if (count >= RULES.ideaMinNotes && !p.matched) remember(l, shapeOf(l.notes, p.first), Math.floor(l.notes[p.first].s / 16));
  l.phrase = null;
}

// A new idea joins the strip; the oldest drops off. One with the same steps as an idea already there
// replaces it (the crowd hears it as that idea again, just not yet as a callback).
function remember(l, o, bar) {
  const at = l.strip.findIndex((idea) => sameSteps(idea.steps, o.steps));
  const calledBar = at >= 0 ? l.strip[at].calledBar : null;
  if (at >= 0) l.strip.splice(at, 1);
  l.strip.push({ ...o, bar, calledBar });
  if (l.strip.length > RULES.stripSize) l.strip.shift();
}

// The index of the first note with an onset at or after 16th s.
function firstAt(l, s) {
  let i = l.notes.length;
  while (i > 0 && l.notes[i - 1].s >= s) i--;
  return i;
}

function barLine(l, b) {
  const end = b * 16;
  // A phrase still going is judged for key up to a beat before the line (later notes may yet resolve).
  if (l.phrase) judgeKey(l, l.phrase, Math.max(l.phrase.judged, firstAt(l, end - RULES.colourWithin)), false);
  // The bar just ended, for the crowd's tastes.
  const from = firstAt(l, end - 16), to = firstAt(l, end);
  let off = 0, rest = 0, last = end - 16;
  for (let i = from; i < to; i++) {
    const s = l.notes[i].s;
    if (isOff16th(s)) off++;
    rest = Math.max(rest, s - last);
    last = s;
  }
  rest = Math.max(rest, end - last);
  emit(l, 'bar', { bar: b - 1, count: to - from, off, rest });
  // Random: plenty of notes over the last 16 bars and not one shape twice.
  const start = firstAt(l, Math.max(0, b - RULES.randomBars) * 16);
  if (to - start >= RULES.randomNotes) {
    const seen = new Set();
    let twice = false;
    for (let i = start + 3; i < to && !twice; i++) {
      if (seen.has(l.shapes[i])) twice = true;
      seen.add(l.shapes[i]);
    }
    if (!twice) emit(l, 'random');
  }
  // Silence: more than 4 whole bars with no note.
  if (l.notes.length && b - 1 - l.lastNoteBar > RULES.silenceBars) emit(l, 'silence');
}

// Time passes: bar lines and phrase ends.
export function tick(l, t) {
  while (t >= (l.bar + 1) * BAR) {
    l.bar++;
    barLine(l, l.bar);
  }
  if (l.phrase && l.held === 0 && t - l.quietAt >= RULES.phraseEndBeats * BEAT) endPhrase(l);
}
