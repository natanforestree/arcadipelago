// The map you choose where to busk on, and what track to play (the start screens): whether the title
// is up over it, which stop is chosen, whether the "What track?" panel is open and which track it's
// on, what a key or a click does, and where the view of the map is centred. Pure, so it's tested in
// Node; atlasview.js shows it as page elements over the canvas, and main.js wires it to the keys, the
// mouse and the band.
import { PLACE_IDS, STOPS } from './places.js';
import { READY } from './beats.js';

// The tracks to choose from: the five ready-made ones, then your own beats (studio.js slots). Each:
// { key: { ready: id } | { slot: i }, name, bpm, mood }.
export function trackList(beats) {
  const list = READY.map((b) => ({ key: { ready: b.id }, name: b.name, bpm: b.bpm, mood: b.mood }));
  beats.slots.forEach((b, i) => b && list.push({ key: { slot: i }, name: b.name, bpm: b.bpm, mood: b.mood }));
  return list;
}

const sameKey = (a, b) => !!a && !!b && (a.ready ? a.ready === b.ready : a.slot === b.slot);

// The map as it opens: place (a place to busk, never the shop or home) the one chosen last time, chosen the
// track chosen last time (studio.js beats.chosen; the first if it's gone). straightGo: the track is
// already chosen (the studio's Busk to this), so Enter on a place goes straight there without the
// panel. intro: the title is up over the map (the first map of a visit) until a key or a click
// clears it.
export function createAtlas({ place = 'park', tracks, chosen = null, straightGo = false, intro = false }) {
  return {
    intro,
    at: Math.max(0, PLACE_IDS.indexOf(place)), // an index into STOPS
    tracks,
    track: Math.max(0, tracks.findIndex((t) => sameKey(t.key, chosen))),
    panel: false,
    straightGo,
  };
}

// The stop chosen: a place to busk, 'shop' or 'home'.
export const stopOf = (a) => STOPS[a.at];
export const trackOf = (a) => a.tracks[a.track];

// A key on the map, by its code. Returns what happened, for main.js: 'place' (another stop is chosen),
// 'panel' (the tracks open), 'track' (another track is chosen), 'go' (busk at the chosen place, to the
// chosen track), 'shop' (go into the music shop), 'home' (go into the studio), 'back' (the panel
// closes), 'start' (the title was up and is cleared), or null (the key does nothing here).
//   With the title up, any key but Esc clears it and does nothing else; Esc leaves it up.
//   Left and right step through the stops, round from the last (home) to the first; Enter or Space
//   opens the tracks (or goes, with straightGo), or goes into the shop or the studio when that's
//   chosen, never opening the tracks. With the tracks open, up and down choose one, Enter or Space
//   goes, and Esc closes them.
export function atlasKey(a, code) {
  if (a.intro) return code === 'Escape' ? null : clickTitle(a);
  const enter = code === 'Enter' || code === 'NumpadEnter' || code === 'Space';
  if (!a.panel) {
    if (code === 'ArrowLeft' || code === 'ArrowRight') {
      const n = STOPS.length;
      a.at = (a.at + (code === 'ArrowRight' ? 1 : -1) + n) % n;
      return 'place';
    }
    if (enter) return stopOf(a) === 'shop' || stopOf(a) === 'home' ? stopOf(a) : openTracks(a);
    return null;
  }
  if (code === 'ArrowUp' || code === 'ArrowDown') {
    const next = Math.min(a.tracks.length - 1, Math.max(0, a.track + (code === 'ArrowDown' ? 1 : -1)));
    if (next === a.track) return null;
    a.track = next;
    return 'track';
  }
  if (enter) return 'go';
  if (code === 'Escape') {
    a.panel = false;
    return 'back';
  }
  return null;
}

function openTracks(a) {
  if (a.straightGo) return 'go';
  a.panel = true;
  return 'panel';
}

// A click on the title: it clears, and nothing is chosen. Returns 'start', or null if it isn't up.
export function clickTitle(a) {
  if (!a.intro) return null;
  a.intro = false;
  return 'start';
}

// A click on a stop (its picture or its label): one not chosen is chosen; the chosen place opens the
// tracks (or goes, with straightGo), and the chosen shop or home goes in. With the tracks open, a
// click on a stop chooses it and closes them. Returns as atlasKey does.
export function clickPlace(a, id) {
  if (a.intro) return clickTitle(a);
  const at = STOPS.indexOf(id);
  if (at < 0) return null;
  if (a.panel) {
    a.panel = false;
    a.at = at;
    return 'back';
  }
  if (at !== a.at) {
    a.at = at;
    return 'place';
  }
  return id === 'shop' || id === 'home' ? id : openTracks(a);
}

// A click on track i in the panel: chooses it, or on the one already chosen, goes.
export function clickTrack(a, i) {
  if (a.intro) return clickTitle(a);
  if (!a.panel || i < 0 || i >= a.tracks.length) return null;
  if (i === a.track) return 'go';
  a.track = i;
  return 'track';
}

// Where the view of the map sits, its top left in map pixels, for a screen (view) of [w, h]: centred on
// the chosen stop's view point (map.json places), kept inside the map.
export function viewAt(a, map, [w, h]) {
  const [cx, cy] = map.places[stopOf(a)].view;
  const clamp = (v, most) => Math.max(0, Math.min(most, v));
  return { x: Math.round(clamp(cx - w / 2, map.size[0] - w)), y: Math.round(clamp(cy - h / 2, map.size[1] - h)) };
}
