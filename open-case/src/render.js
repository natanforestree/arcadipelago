// Draws the scene at 320x180 into a 2D context (main.js scales it up by a whole number), in the flat
// style, from the sprite sheet art/open-case/sprites.lua makes (assets.js loads it): the place you
// busk in (the park and its sunset, the station and its trains, the night market and its lanterns,
// One Tree Island and its sunrise), you on your crate with your instrument, your pedals and the loop
// pedal, the open case with your keepsakes in its lid and the band's speaker, the passers-by (or the
// island's animals), their reactions, the pigeons and birds (or the market's cat, or the island's
// fish), a keepsake dropping into the case, the note
// trail (and your loop's), the memory strip, the gear strip, the music shop, your room and its shelf of
// keepsakes, and the title card (on the pages that skip the map), the key chart, and the pause and
// ?debug overlays. The end card and the map are HTML (index.html, atlasview.js).
import { CROWD, PLAY, LAYERS, INTEREST, LOOP } from './tuning.js';
import { LOFI_CLOCK } from './beats.js';
import {
  GUITAR, coinAt, glyphAt, loopGlyphAt, GOLD, skyStages, sunDrop, windowLit, lampState, starsOut, trainX, cloudX,
  birdsAt, pigeonsAt, frameOf, stationClock, trainAt, boardFirst, marketStages, lanternsLit, steamFrame, catAt, TRAIN,
  sunriseStages, sunUp, mistLeft, fishAt, giftAt,
} from './scene.js';
import { STOCK, PEDALS, owns, stockItem } from './gear.js';
import { card, trying, CARD, BUTTON } from './shop.js';
import { loopState } from './looper.js';
import { drawStudio, cornerKey } from './studioview.js';
import { roomCard, cubbyBox, DESK, CARD as ROOM_CARD } from './room.js';
import { KEEPSAKES } from './keepsakes.js';

export const W = 320, H = 180;
const FONT = '8px Silkscreen, monospace';
const ICON_TIME = 1.6; // seconds a reaction shows over a head
const REACT_FPS = 2.5; // a reaction's two frames alternate this many times a second
const GOLD_PULSE = 8; // speed (rad/s) the callback's gold frame pulses at
const DEBUG_PANEL_TOP = 32; // clears the strip of remembered ideas (its boxes end at y 20) with room to spare
const CALLBACK_MARGIN = 4; // px the "callback!" popup keeps clear of both canvas edges
const RULE_WORDS = { offKey: 'off key' }; // the ?debug view's words for rules, where they differ from their names
const STRUM = 0.18; // seconds your picking hand takes over a strum's three frames
const BREATH = 0.9; // seconds each frame of a breath lasts (you, and standing listeners)
const STEP = 4; // pixels a walker moves per frame of their walk
const NOD = 0.3; // the share of each beat a hooked listener's head is down
const OVER_HEAD = 47; // pixels above a listener's feet their reaction's tail points to
const SWAY = 0.8; // how fast (rad/s) the trees sway...
const RUSTLE = 0.2; // ...and how long (seconds) they rustle after each bar line
const STRIP_X = 106; // the gear strip: its first pedal's icon (clear of "lock")...
const STRIP_STEP = 16; // ...and the next one's, this far to the right (each pedal has its own place), so the
// last ends before the pigeons (scene.js PIGEONS)
const LOOP_SLOT = PEDALS.length; // the loop pedal's place on the gear strip, after the pedals
const LOOP_FAINT = 0.45; // your loop's note glyphs, this faint next to your own
const STOMP_SHOW = 1; // seconds a stomped pedal's name (or the loop pedal's news) shows over the strip
const CUE_DIGIT_TOP = 151; // the count-in's big digit: top-aligned, so it clears the strip's icons at 170
const CUE_CELL_W = 5, CUE_CELL_H = 3, CUE_CELL_GAP = 1; // the recording cue's four bar cells
const CUE_TEXT_GAP = 3; // between "rec" and its first cell
const CUE_CELL_Y = 163; // roughly the middle of "rec"'s 8px row (top at 160)
const CUE_LEFT_MIN = 177; // keeps "rec" clear of the case sprite's rim, whose red lining reads as the word's
const BEATS_PER_BAR = 4; // every beat's 4/4 meter: always 4, unlike LOOP.bars (how many bars a loop take is)
const NOD_SHOW = 1.2; // seconds the shopkeeper nods after a sale...
const NOD_FPS = 4; // ...this many nods a second
const BOARD_ROWS = 4; // trains on the station's departure board
const ANIMAL_STEP = 0.3; // seconds each of an animal's two crossing frames shows (a step or a hop, a stroke, a wingbeat)
const OVER_ANIMAL = 3; // pixels above the top of an animal's frame its reaction's tail points to
const SUN_UP = 12; // pixels the island's sun has risen before its reflection glints on the water
const GLINT = 1.7; // how fast (rad/s) the water's glints come and go
const BACKING = 0.55; // how dark the backing behind the bottom line's words and the gear strip is...
const BACKING_TOP = 168, BACKING_H = 11; // ...and where it runs (the line's text sits at y 170)

// Your last notes tagged by shape: notes completing the same shape share a letter; '-' completes none.
export function shapeTags(shapes) {
  const letters = new Map();
  return shapes.map((k) => {
    if (!k) return '-';
    if (!letters.has(k)) letters.set(k, String.fromCharCode(65 + (letters.size % 26)));
    return letters.get(k);
  }).join('');
}

// The frame a passer-by shows, as the person they are (their kind and look): walking by where they
// are (so a slower walker steps slower), and standing still facing you, breathing, or nodding on the
// beat once they're hooked (beat: seconds in a beat of the set's beat).
export function personFrame(p, t, time, beat = LOFI_CLOCK.beat) {
  const facingYou = p.state === 'stopped' || p.state === 'joining';
  const face = (facingYou ? (p.x < CROWD.playerX ? 1 : -1) : p.dir) > 0 ? 'right' : 'left';
  if (p.state !== 'stopped') return `${p.kind}-${p.look}-walk-${frameOf((Math.abs(p.x) + Math.abs(p.y)) / STEP, 4)}-${face}`;
  if (p.interest > INTEREST.hook) return `${p.kind}-${p.look}-nod-${t / beat - Math.floor(t / beat) < NOD ? 1 : 0}-${face}`;
  return `${p.kind}-${p.look}-stand-${frameOf(time / BREATH + p.id * 0.37, 2)}-${face}`;
}

// The frame an animal shows, on the island (p.animal: animals.js), as people's do: crossing as it comes
// by, settles and leaves (walking or hopping, swimming or flying), its steps on the page's clock;
// settled, facing you, breathing, or keeping the beat once it's hooked.
export function animalFrame(p, t, time, beat = LOFI_CLOCK.beat) {
  const facingYou = p.state === 'stopped' || p.state === 'joining';
  const face = (facingYou ? (p.x < CROWD.playerX ? 1 : -1) : p.dir) > 0 ? 'right' : 'left';
  if (p.state !== 'stopped') return `${p.animal}-cross-${frameOf(time / ANIMAL_STEP + p.id * 0.37, 2)}-${face}`;
  if (p.interest > INTEREST.hook) return `${p.animal}-beat-${t / beat - Math.floor(t / beat) < NOD ? 1 : 0}-${face}`;
  return `${p.animal}-sit-${frameOf(time / BREATH + p.id * 0.37, 2)}-${face}`;
}

// You with your instrument: playing for a moment after each note (a guitar's strum, a keyboard's
// hands), and otherwise breathing.
export function youFrame(scene, t, time, instrument) {
  const since = t - scene.lastNote;
  if (since >= 0 && since < STRUM) return `you-${instrument}-play-${Math.min(2, Math.floor((since / STRUM) * 3))}`;
  return `you-${instrument}-idle-${frameOf(time / BREATH, 2)}`;
}

// The loop pedal's light at band time t (loop: looper.js, or null): dark while the loop is empty,
// red blinking on the beat while a recording waits for its bar line, red while it records, and
// green while the loop plays.
export function loopLight(loop, t) {
  const state = loop ? loopState(loop, t) : 'empty';
  if (state === 'waiting') return frameOf(t / (loop.clock.beat / 2), 2) === 0 ? 'red' : 'dark';
  return { recording: 'red', playing: 'green' }[state] ?? 'dark';
}

// The words for the loop pedal's news over the strip. what: 'layer' (layer: the layer that just
// landed, from 1), 'full', 'cancelled', 'removed' or 'cleared'.
export function loopWords({ what, layer }) {
  if (what === 'layer') return `layer ${layer}`;
  return { full: 'loop full', cancelled: 'recording cancelled', removed: 'layer removed', cleared: 'loop cleared' }[what];
}

// What the loop's slot counts at band time t, in the news's place, while there's no news to show:
// null with no loop or no take; while waiting for the bar line (t < take.from), { count } (4 down to
// 1, counted down to the bar line itself rather than up from wherever R joined the count, so a caller
// whose clock lags a hair behind the bar line — set.t, stepped in whole ticks, trails the audio clock
// slightly — still reads the beat it's really in, not the tail of the one before); while recording,
// elapsed e = t - take.from (0 <= e < loopLength): on the last bar's beats 2-4, { count, closing:
// true } (3, 2, 1, so you know when it closes); otherwise { bars: e / bar } (0 up to just under
// LOOP.bars, fractional). Beats and bars are the loop's beat's (loop.clock).
export function loopCue(loop, t) {
  const take = loop?.take;
  if (!take) return null;
  const { beat, bar } = loop.clock;
  if (t < take.from) {
    // Ceil'd, not floor'd: however close t sits below a beat boundary, it's still that beat's count.
    // The small tolerance stops a boundary landing a hair above its exact multiple (float error) from
    // ceiling to one more than it should.
    const count = Math.min(BEATS_PER_BAR, Math.max(1, Math.ceil((take.from - t) / beat - 1e-9)));
    return { count };
  }
  const e = t - take.from;
  const lastBarFrom = (LOOP.bars - 1) * bar;
  if (e >= lastBarFrom + beat) {
    return { count: Math.max(1, BEATS_PER_BAR - Math.floor((e - lastBarFrom) / beat)), closing: true };
  }
  return { bars: e / bar };
}

// The trees: still when motion is reduced, rustling just after each bar line of a set (bar: seconds in
// a bar of its beat), and otherwise swaying slowly.
export function treeFrame(t, time, playing, still, bar = LOFI_CLOCK.bar) {
  if (still) return 0;
  if (playing && t >= 0 && t % bar < RUSTLE) return 2;
  return Math.sin(time * SWAY) > 0.4 ? 1 : 0;
}

// art: { sheet, frames, data } from assets.js.
export function createRenderer(g, art) {
  const { sheet, frames, data } = art;
  const C = data.colors;
  const px = (x, y, w, h, c) => {
    g.fillStyle = c;
    g.fillRect(Math.round(x), Math.round(y), w, h);
  };
  const text = (s, x, y, c = C.light, align = 'left') => {
    g.font = FONT;
    g.textAlign = align;
    g.textBaseline = 'top';
    g.fillStyle = c;
    g.fillText(s, Math.round(x), Math.round(y));
  };
  // The width of a text in the 8px font.
  const measure = (s) => {
    g.font = FONT;
    return g.measureText(s).width;
  };
  // Text in the 16px font, centred on x: the count-in's digit, the studio's rhythm number.
  const big = (s, x, y, c) => {
    g.font = '16px Silkscreen, monospace';
    g.textAlign = 'center';
    g.textBaseline = 'top';
    g.fillStyle = c;
    g.fillText(s, Math.round(x), Math.round(y));
  };
  // A frame from the sheet, placed by its anchor.
  const sprite = (name, x, y) => {
    const f = frames[name];
    if (!f) throw new Error(`no sprite called ${name}`);
    g.drawImage(sheet, f[0], f[1], f[2], f[3], Math.round(x) - f[4], Math.round(y) - f[5], f[2], f[3]);
  };
  const bandOf = (y) => data.bands.findLastIndex((b) => b <= y);

  // The sky's bands, each in its stage's colour (stages: one for each band, top down), from the
  // evening's stages, or the island's sunrise's.
  function sky(stages, colours = data.sky) {
    data.bands.forEach((top, i) => {
      const bottom = data.bands[i + 1] ?? data.skyBottom + 1;
      px(0, top, W, bottom - top, colours[stages[i]][i]);
    });
  }

  // Back to front: the sky and what's in it, the rooftops, the trees, the hedge and path, the lamp.
  function park({ bars, t, time, still, set, scene, flocks }) {
    const bar = Math.floor(bars);
    const stages = skyStages(bar);
    sky(stages);
    data.stars.slice(0, starsOut(bar)).forEach(([x, y], i) => {
      const bright = still || Math.sin(time * 0.9 + i * 2.3) > -0.3;
      px(x, y, 1, 1, bright ? C.light : C.grey);
    });
    const drop = sunDrop(bars);
    if (drop !== null) sprite('sun', data.sun[0], data.sun[1] + drop);
    data.clouds.forEach(([x, y, layer], i) => sprite(`cloud-${i}-${stages[bandOf(y)]}`, still ? x : cloudX(x, layer, time), y));
    if (!still) for (const b of birdsAt(flocks, time)) sprite(`bird-${b.frame}`, b.x, b.y);
    const roofs = stages[6]; // the rooftops darken with the band behind them
    sprite(`roofs-back-${roofs}`, 0, 0);
    const train = set && !still ? trainX(scene, t) : null;
    if (train !== null) sprite(`train-${roofs}`, train, data.trainY);
    sprite(`roofs-front-${roofs}`, 0, 0);
    data.windows.forEach(([x, y], i) => {
      if (windowLit(scene, i, bar)) px(x, y, 2, 2, C.gold);
    });
    sprite(`trees-${treeFrame(t, time, !!set, still, set?.clock.bar)}`, 0, 0);
    sprite('ground', 0, 0);
    const lamp = lampState(bar, time, still);
    if (lamp !== 'off') sprite('pool', 0, 0);
    sprite(`lamp-${lamp}`, 0, 0);
  }

  // The station at rush hour, back to front: the sky through the glass roof and the arches (darkening as
  // the park's does), the far city, the hall, the train while one is in (its doors open as its
  // passengers step off), and in front of it the pillars, the lamps, the board, the clock and the
  // platform. The board lists the trains still to go, the next one brightest; the clock's hands run
  // from half past five to half past six.
  function station({ bars, t, set }) {
    const stages = skyStages(Math.floor(bars));
    sky(stages);
    sprite(`station-city-${stages[6]}`, 0, 0);
    sprite('station-hall', 0, 0);
    const trains = set ? set.crowd.trains : [];
    const train = trainAt(trains, t);
    if (train) for (let k = 0; k < TRAIN.cars; k++) sprite(`station-car-${train.doors ? 1 : 0}`, train.x + k * TRAIN.car, 0);
    sprite('station-front', 0, 0);
    const [x0, y0, x1] = data.station.board, first = boardFirst(trains, t);
    for (let r = 0; r < BOARD_ROWS; r++) {
      const n = first + r, y = y0 + 3 + r * 5, c = r === 0 ? C.gold : C.goldDark;
      px(x0 + 3, y, 10, 3, c); // its time
      for (let k = 0; k < 6; k++) { // and where it's going, a word or two
        const len = 3 + ((n * 7 + k * 13 + 3) % 5), wx = x0 + 16 + k * 8;
        if (wx + len < x1 - 3 && (n + k) % 4 !== 3) px(wx, y, len, 3, c);
      }
    }
    const [cx, cy, radius] = data.station.clock, { hour, minute } = stationClock(bars);
    const hand = (turn, len) => {
      for (let d = 0; d <= len * 2; d++) {
        px(cx + Math.round((Math.sin(turn * Math.PI * 2) * d) / 2), cy - Math.round((Math.cos(turn * Math.PI * 2) * d) / 2), 1, 1, C.ink);
      }
    };
    hand(((hour % 12) + minute / 60) / 12, radius - 4);
    hand(minute / 60, radius - 2);
    px(cx, cy, 1, 1, C.red);
  }

  // The night market, back to front: the sky from blue hour to night, its stars, the far skyline, the
  // stalls and the noodle pot's steam, the strings with their lanterns (lighting one by one), and the
  // brick street.
  function market({ bars, time, still }) {
    sky(marketStages(Math.floor(bars)));
    data.market.stars.forEach(([x, y], i) => px(x, y, 1, 1, still || Math.sin(time * 0.9 + i * 2.3) > -0.3 ? C.light : C.grey));
    sprite('market-skyline', 0, 0);
    sprite('market-stalls', 0, 0);
    sprite(`market-steam-${steamFrame(time, still)}`, 0, 0);
    sprite('market-strings', 0, 0);
    const lit = lanternsLit(bars, data.market.lanterns.length);
    data.market.lanterns.forEach(([x, y, c], i) => sprite(i < lit ? `lantern-${c}` : 'lantern-off', x, y));
    sprite('market-street', 0, 0);
  }

  // One Tree Island at sunrise, back to front: the sky lightening from the horizon up, the sun coming up
  // behind the far shore's pines, the lake (the shore and the water follow the horizon's band) and its
  // glints (the sun's reflection among them once it's up), the mist's streaks still left, the fish if
  // it's jumping, the island, and the pine's branches over you (its trunk stands among the figures).
  function island({ bars, t, time, still, scene }) {
    const stages = sunriseStages(Math.floor(bars)), horizon = stages[6], up = sunUp(bars), [sx, sy] = data.island.sun;
    sky(stages, data.sunrise);
    sprite('sun', sx, sy - up);
    sprite(`island-shore-${horizon}`, 0, 0);
    sprite(`island-water-${horizon}`, 0, 0);
    data.island.glints.forEach(([x, y], i) => {
      if (i < data.island.sunGlints && up < SUN_UP) return;
      if (still ? i % 2 === 0 : Math.sin(time * GLINT + i * 2.3) > 0.5) px(x, y, 2, 1, C.light);
    });
    for (let i = 0; i < mistLeft(bars); i++) sprite(`island-mist-${i}`, 0, 0);
    const fish = fishAt(scene, t);
    if (fish) sprite(`fish-${fish.pose}-${fish.frame}`, fish.x, fish.y);
    sprite('island-land', 0, 0);
    sprite('island-pine', 0, 0);
  }

  // How far above an animal's feet its reaction's tail points: just over the top of the frame it shows.
  const overAnimal = (name) => data.frames[name][5] + OVER_ANIMAL;

  // Everyone and everything standing on the path, nearest last: the listeners (or the island's animals,
  // and the pine's trunk among them), you, your pedals, the loop pedal and the amp, the speaker, the
  // case with your keepsakes in its lid, its coins and a keepsake dropping in, and the pigeons on the
  // ground (at the night market, the cat; on the island, neither). Returns the pigeons in the air,
  // drawn later.
  function figures({ set, scene, t, time, gear, loop, inCase = [] }) {
    const things = [
      { y: data.feet.you, draw: () => sprite(youFrame(scene, t, time, gear.instrument), 0, 0) },
      {
        y: data.feet.pedals,
        draw: () => {
          for (const id of PEDALS) if (owns(gear, id)) sprite(`pedal-${id}-${gear.on.includes(id) ? 1 : 0}`, 0, 0);
        },
      },
      { y: data.feet.speaker, draw: () => sprite('speaker', 0, 0) },
      {
        y: data.feet.case,
        draw: () => {
          sprite('case', 0, 0);
          inCase.forEach((id, i) => sprite(`keep-${id}-case`, ...data.caseKeeps[i]));
          for (const [x, y] of data.caseCoins.slice(0, scene.caseCoins)) sprite('case-coin', x, y);
          const gift = giftAt(scene, t, time);
          if (gift) {
            sprite(`keep-${gift.id}`, gift.x, gift.y);
            if (gift.landed) {
              const sparks = gift.sparkle ? [[-7, -11], [6, -5], [-2, -15]] : [[5, -12], [-6, -4], [8, -9]];
              for (const [dx, dy] of sparks) px(gift.x + dx, gift.y + dy, 1, 1, C.light);
            }
          }
        },
      },
    ];
    if (gear.instrument === 'electric') things.push({ y: data.feet.amp, draw: () => sprite('amp', 0, 0) });
    if (owns(gear, 'loop')) things.push({ y: data.feet.loop, draw: () => sprite(`pedal-loop-${loopLight(loop, t)}`, 0, 0) });
    if (set) {
      for (const p of set.crowd.people) {
        const frame = p.animal ? animalFrame(p, t, time, set.clock.beat) : personFrame(p, t, time, set.clock.beat);
        things.push({ y: p.y, draw: () => sprite(frame, p.x, p.y) });
      }
    }
    if (scene.place === 'island') things.push({ y: data.island.trunk, draw: () => sprite('island-trunk', 0, 0) });
    const flying = [];
    const cat = scene.place === 'market' ? catAt(scene, t, time) : null;
    if (cat) things.push({ y: cat.y, draw: () => sprite(`cat-${cat.pose}-${cat.frame}-${cat.dir > 0 ? 'right' : 'left'}`, cat.x, cat.y) });
    for (const b of scene.place === 'market' || scene.place === 'island' ? [] : pigeonsAt(scene, t, time)) {
      const name = `pigeon-${b.pose}-${b.frame}-${b.dir > 0 ? 'right' : 'left'}`;
      if (b.pose === 'fly') flying.push(() => sprite(name, b.x, b.y));
      else things.push({ y: b.y, draw: () => sprite(name, b.x, b.y) });
    }
    things.sort((a, b) => a.y - b.y);
    for (const thing of things) thing.draw();
    return flying;
  }

  // Your loop's notes, faint, rising from the loop pedal as each plays.
  function loopTrail(scene, t) {
    for (const glyph of scene.loopTrail) {
      const { x, y, fade } = loopGlyphAt(glyph, t);
      if (fade <= 0 || x > W) continue;
      g.globalAlpha = fade * LOOP_FAINT;
      px(x, y, 3, 3, C.light);
      px(x + 2, y - 4, 1, 4, C.light);
    }
    g.globalAlpha = 1;
  }

  function trail(scene, notes, t) {
    for (const glyph of scene.trail) {
      const { x, y, fade } = glyphAt(glyph, t);
      if (fade <= 0 || x > W) continue;
      const echo = notes[glyph.index]?.echo ?? 1;
      g.globalAlpha = fade;
      if (echo === 2) px(x - 1, y - 1, 5, 5, C.light); // a shape's second time: a faint outline
      px(x, y, 3, 3, echo >= 3 ? C.grey : C.gold);
      px(x + 2, y - 4, 1, 4, echo >= 3 ? C.grey : C.gold);
      g.globalAlpha = 1;
    }
  }

  // The crowd's 6 remembered ideas, along the top: each a little contour of its 4 notes.
  function strip(listen, scene, t) {
    const n = listen.strip.length;
    for (let i = 0; i < 6; i++) {
      const x = 58 + i * 36, y = 4;
      const lit = scene.gold && i === n - 1;
      g.globalAlpha = lit ? 1 : 0.6;
      px(x, y, 30, 16, lit ? C.goldDark : C.ink);
      g.globalAlpha = 1;
      if (lit) {
        // a pulsing gold frame around the idea that just came back
        const w = 1 + (Math.sin(t * GOLD_PULSE) > 0 ? 1 : 0);
        px(x, y, 30, w, C.gold);
        px(x, y + 16 - w, 30, w, C.gold);
        px(x, y, w, 16, C.gold);
        px(x + 30 - w, y, w, 16, C.gold);
      }
      const idea = listen.strip[i];
      if (!idea) continue;
      let p = 0;
      const ys = [0, ...idea.steps.map((s) => (p += s))];
      const lo = Math.min(...ys), hi = Math.max(...ys), span = Math.max(1, hi - lo);
      ys.forEach((v, k) => px(x + 3 + k * 7, y + 12 - Math.round(((v - lo) / span) * 9), 3, 2, lit ? C.light : C.gold));
    }
    if (scene.gold) {
      // the gold arc from the old idea down to your guitar
      const k = Math.min(1, (t - scene.gold.t) / 0.5);
      const boxX = 58 + (n - 1) * 36, x0 = boxX + 15, y0 = 20, [x1, y1] = GUITAR;
      g.globalAlpha = 1 - Math.max(0, (t - scene.gold.t) / GOLD);
      for (let s = 0; s <= k; s += 0.04) px(x0 + (x1 - x0) * s, y0 + (y1 - y0) * s - Math.sin(Math.PI * s) * 20, 3, 3, C.gold);
      // the word, on the side of the box away from the guitar so the arc (which only moves from the box
      // towards x1) never crosses it; clamped so it also stays CALLBACK_MARGIN clear of both canvas
      // edges (the rightmost box otherwise runs the word off the right side); a 1px dark shadow keeps
      // it crisp over the sky
      const rightOfGuitar = x0 > x1, align = rightOfGuitar ? 'left' : 'right';
      g.font = FONT;
      const ww = g.measureText('callback!').width;
      const wx = rightOfGuitar
        ? Math.min(boxX + 33, W - CALLBACK_MARGIN - ww - 1) // -1 leaves room for the shadow's +1px offset
        : Math.max(boxX - 3, CALLBACK_MARGIN + ww);
      text('callback!', wx + 1, 9, C.ink, align);
      text('callback!', wx, 8, C.gold, align);
      g.globalAlpha = 1;
    }
  }

  // A dark backing behind a piece of the bottom line, so it reads on any ground (the station's platform
  // is pale), leaving the pigeons or the cat beside it alone.
  function backing(x, w) {
    g.globalAlpha = BACKING;
    px(x, BACKING_TOP, w, BACKING_H, C.ink);
    g.globalAlpha = 1;
  }

  function hud({ keys, gear, stomp, loop, loopSaid, t, time }, set) {
    backing(0, keys.lock ? 102 : 74);
    text(`oct ${keys.octave >= 0 ? '+' : ''}${keys.octave}`, 4, 170);
    for (let i = 0; i < PLAY.strengthMax; i++) px(52 + i * 5, 172, 4, 4, i < keys.strength ? C.light : C.ink);
    if (keys.lock) text('lock', 78, 170, C.gold);
    if (set) {
      const bar = `bar ${Math.min(set.bars, Math.floor(set.t / set.clock.bar) + 1)}/${set.bars}`;
      backing(W - 8 - Math.ceil(measure(bar)), Math.ceil(measure(bar)) + 8);
      text(bar, W - 4, 170, C.light, 'right');
    }
    // The gear strip: each pedal you own in its own place, with its key, lit while it's on; the name
    // of the one just stomped shows above it for a moment.
    PEDALS.forEach((id, i) => {
      if (!owns(gear, id)) return;
      const on = gear.on.includes(id), x = STRIP_X + i * STRIP_STEP;
      backing(x - 1, STRIP_STEP);
      sprite(`strip-${id}-${on ? 1 : 0}`, x, 170);
      text(String(stockItem(id).key), x + 9, 170, on ? C.light : C.grey);
    });
    // The loop pedal's slot, after the pedals: its icon, its key, and a dot for each layer it can
    // hold, lit for each recorded and red for the one recording.
    if (owns(gear, 'loop')) {
      const x = STRIP_X + LOOP_SLOT * STRIP_STEP, state = loop ? loopState(loop, t) : 'empty';
      backing(x - 1, 16 + LOOP.layers * 4);
      sprite(`strip-loop-${loopLight(loop, t)}`, x, 170);
      text('R', x + 9, 170, state === 'empty' ? C.grey : C.light);
      const layers = loop?.layers.length ?? 0;
      for (let i = 0; i < LOOP.layers; i++) {
        px(x + 15 + i * 4, 172, 3, 3, i < layers ? C.light : i === layers && loop?.take ? C.red : C.greyDark);
      }
    }
    // What you just did shows over the strip for a moment: the pedal stomped, or the loop pedal's
    // news, whichever is newer; failing that, the loop's own count-in or recording cue takes the same
    // spot, so you always know where the loop pedal stands.
    const news = [];
    if (stomp) {
      news.push({
        time: stomp.time, x: STRIP_X + PEDALS.indexOf(stomp.id) * STRIP_STEP + 7,
        words: `${stockItem(stomp.id).name.toLowerCase()} ${stomp.on ? 'on' : 'off'}`, color: stomp.on ? C.gold : C.light,
      });
    }
    if (loopSaid) {
      news.push({
        time: loopSaid.time, x: STRIP_X + LOOP_SLOT * STRIP_STEP + 7, words: loopWords(loopSaid),
        color: loopSaid.what === 'layer' ? C.go : C.light,
      });
    }
    const shown = news.filter((n) => time - n.time >= 0 && time - n.time < STOMP_SHOW).sort((a, b) => b.time - a.time)[0];
    if (shown) {
      text(shown.words, shown.x + 1, 161, C.ink, 'center');
      text(shown.words, shown.x, 160, shown.color, 'center');
    } else {
      cue(loopCue(loop, t), STRIP_X + LOOP_SLOT * STRIP_STEP + 7);
    }
  }

  // Draws the loop's count-in or recording cue, centred on the loop slot at x, where the news goes.
  function cue(what, x) {
    if (!what) return;
    if (what.bars === undefined) {
      g.font = '16px Silkscreen, monospace';
      g.textAlign = 'center';
      g.textBaseline = 'top';
      g.fillStyle = C.ink;
      g.fillText(String(what.count), Math.round(x) + 1, CUE_DIGIT_TOP + 1);
      g.fillStyle = what.closing ? C.red : C.gold;
      g.fillText(String(what.count), Math.round(x), CUE_DIGIT_TOP);
      return;
    }
    g.font = FONT;
    const w = g.measureText('rec').width;
    const cellsW = LOOP.bars * CUE_CELL_W + (LOOP.bars - 1) * CUE_CELL_GAP;
    const left = Math.max(CUE_LEFT_MIN, x - (w + CUE_TEXT_GAP + cellsW) / 2);
    text('rec', left + 1, 161, C.ink);
    text('rec', left, 160, C.red);
    const bar = Math.floor(what.bars);
    for (let i = 0; i < LOOP.bars; i++) {
      const cx = left + w + CUE_TEXT_GAP + i * (CUE_CELL_W + CUE_CELL_GAP);
      px(cx, CUE_CELL_Y, CUE_CELL_W, CUE_CELL_H, C.greyDark);
      const fill = i < bar ? CUE_CELL_W : i === bar ? Math.round(CUE_CELL_W * (what.bars - bar)) : 0;
      if (fill > 0) px(cx, CUE_CELL_Y, fill, CUE_CELL_H, C.red);
    }
  }

  // The title card, on the pages that skip the map (?studio, ?place=, ?bot=): the name and how to start.
  function title() {
    g.globalAlpha = 0.9;
    px(80, 62, 160, 56, C.ink);
    g.globalAlpha = 1;
    g.font = '16px Silkscreen, monospace';
    g.textAlign = 'center';
    g.textBaseline = 'top';
    g.fillStyle = C.light;
    g.fillText('Open Case', W / 2, 72);
    text('press any key', W / 2, 100, C.gold, 'center');
  }

  // The key chart, on a dark card, for the first set of a visit: the beat you'll play, the keys (the
  // layout is GarageBand's Musical Typing), the other controls, and how to start.
  function keyChart(busking) {
    g.globalAlpha = 0.9;
    px(40, 34, 240, 112, C.ink);
    g.globalAlpha = 1;
    if (busking) text(`busking to ${busking}`, W / 2, 42, C.gold, 'center');
    const whites = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'"];
    const blacks = { 0: 'W', 1: 'E', 3: 'T', 4: 'Y', 5: 'U', 7: 'O', 8: 'P' };
    whites.forEach((k, i) => {
      px(72 + i * 16, 80, 15, 18, C.light);
      text(k, 79 + i * 16, 88, C.ink, 'center');
    });
    for (const [i, k] of Object.entries(blacks)) {
      px(72 + Number(i) * 16 + 10, 70, 11, 14, C.charcoal);
      text(k, 72 + Number(i) * 16 + 16, 73, C.light, 'center');
    }
    text('Z X octave   C V softer/louder   space ring', W / 2, 106, C.grey, 'center');
    text('1 scale lock   M mute   esc pause', W / 2, 116, C.grey, 'center');
    text('2-6 pedals   R loop   backspace undo', W / 2, 126, C.grey, 'center');
    text('play a note to start the set', W / 2, 136, C.gold, 'center');
  }

  // The music shop: the room and the shopkeeper (nodding just after a sale), the stock with its tags
  // (the chosen item lifted, with a pointer over it, and the lights lit on the pedals you can hear),
  // the savings on the chalkboard, and the card for the chosen item.
  function shopView({ shop, gear, t, time, still }) {
    const S = data.shop;
    sprite('shop-room', 0, 0);
    text('back to', S.sign[0], S.sign[1], C.ink, 'center');
    text('the map', S.sign[0], S.sign[1] + 8, C.ink, 'center');
    text('saved', S.board[0], S.board[1], C.grey, 'center');
    text(`${gear.savings} coin${gear.savings === 1 ? '' : 's'}`, S.board[0], S.board[1] + 11, C.light, 'center');
    const since = time - shop.soldAt;
    sprite(`keeper-${since >= 0 && since < NOD_SHOW ? 2 + frameOf(since * NOD_FPS, 2) : frameOf(time / BREATH, 2)}`, 0, 0);
    sprite('shop-counter', 0, 0);
    const heard = trying(shop, gear).on;
    STOCK.forEach((item, i) => {
      const chosen = i === shop.at, lift = chosen ? S.lift : 0, [x, y, w] = S.items[item.id];
      sprite(`item-${item.id}-${chosen ? 1 : 0}`, 0, 0);
      if (heard.includes(item.id)) px(S.leds[item.id][0], S.leds[item.id][1] - lift, 2, 1, C.light);
      // the loop pedal you're trying
      const light = item.kind === 'loop' ? loopLight(shop.loop, t) : 'dark';
      if (light !== 'dark') px(S.leds.loop[0], S.leds.loop[1] - lift, 2, 2, light === 'red' ? C.red : C.go);
      sprite(owns(gear, item.id) ? 'tag-yours' : 'tag-price', x + w - 1, y + 3 - lift);
      if (chosen) {
        const cx = x + Math.floor(w / 2), cy = y - lift - 7 - (!still && Math.sin(time * 5) > 0 ? 1 : 0);
        px(cx - 2, cy, 5, 1, C.gold);
        px(cx - 1, cy + 1, 3, 1, C.gold);
        px(cx, cy + 2, 1, 1, C.gold);
      }
    });
    const words = card(shop, gear);
    g.globalAlpha = 0.92;
    px(CARD[0], CARD[1], CARD[2], CARD[3], C.ink);
    g.globalAlpha = 1;
    text(words.name, CARD[0] + 6, CARD[1] + 3);
    text(words.price, CARD[0] + CARD[2] - 6, CARD[1] + 3, words.price === 'yours' ? C.go : C.gold, 'right');
    text(words.about, CARD[0] + 6, CARD[1] + 12, C.grey);
    text(words.says, CARD[0] + 6, CARD[1] + 21, words.button ? C.gold : C.light);
    const keys = STOCK[shop.at].kind === 'loop' ? 'R record   backspace undo   esc back' : 'arrows choose   esc back to the map';
    text(keys, CARD[0] + 6, CARD[1] + 30, C.greyDark);
    if (words.button) {
      px(BUTTON[0], BUTTON[1], BUTTON[2], BUTTON[3], C.gold);
      text(words.button, BUTTON[0] + BUTTON[2] / 2, BUTTON[1] + 3, C.ink, 'center');
    }
  }

  // Your room: the room itself, the count over the shelf, each keepsake you've found in its cubby (a
  // gold mark on those in your case) and the outline of each still to find, the gold pointer round the
  // chosen cubby (or bobbing over the groovebox on the desk), the card for it, and the map key.
  function roomView({ room, keeps, time, still }) {
    const R = data.room;
    sprite('room', 0, 0);
    text(`${keeps.found.length} of ${KEEPSAKES.length}`, R.count[0], R.count[1], C.light, 'center');
    KEEPSAKES.forEach(({ id }, i) => {
      const [x, y, w, h] = cubbyBox(R, i);
      sprite(keeps.found.includes(id) ? `keep-${id}` : `keep-${id}-hint`, x + Math.floor(w / 2), y + h - 2);
      if (keeps.inCase.includes(id)) px(x + w - 3, y + 1, 2, 2, C.gold);
      if (i !== room.at) return;
      px(x - 1, y - 1, w + 2, 1, C.gold);
      px(x - 1, y + h, w + 2, 1, C.gold);
      px(x - 1, y, 1, h, C.gold);
      px(x + w, y, 1, h, C.gold);
    });
    if (room.at === DESK) {
      const [x, y, w] = R.desk, cx = x + Math.floor(w / 2) - 2, cy = y - 7 - (!still && Math.sin(time * 5) > 0 ? 1 : 0);
      px(cx - 2, cy, 5, 1, C.gold);
      px(cx - 1, cy + 1, 3, 1, C.gold);
      px(cx, cy + 2, 1, 1, C.gold);
    }
    const words = roomCard(room, keeps, time), [x, y, w, h] = ROOM_CARD;
    g.globalAlpha = 0.92;
    px(x, y, w, h, C.ink);
    g.globalAlpha = 1;
    text(words.name, x + 6, y + 3, words.found ? C.gold : C.grey);
    text(words.line, x + 6, y + 12, words.found ? C.light : C.grey);
    text(words.says, x + 6, y + 21, words.full ? C.red : C.gold);
    text('arrows choose   esc back to the map', x + 6, y + 30, C.greyDark);
    cornerKey({ px, text, C }, 'map');
  }

  function debugView(set, info) {
    for (const p of set.crowd.people) {
      const x = Math.round(p.x) - 10, y = Math.round(p.y) + 3;
      px(x, y, 20, 3, C.ink);
      px(x, y, Math.round(20 * p.interest), 3, p.interest >= 0.5 ? C.go : p.interest >= 0.2 ? C.gold : C.red);
      if (p.lastRule) text(RULE_WORDS[p.lastRule] ?? p.lastRule, p.x, y + 4, C.light, 'center');
    }
    const l = set.listen;
    const { bar, beat: beatLen } = set.clock, beat = Math.floor((set.t % bar) / beatLen) + 1;
    const lines = [
      `bar ${Math.min(set.bars, Math.floor(set.t / bar) + 1)} beat ${beat}`,
      `layers ${LAYERS.filter((x) => set.layers[x.id]).map((x) => x.id).join(' ')}`,
      `crowd ${set.crowd.people.filter((p) => p.state === 'joining' || p.state === 'stopped').length}  ${set.crowd.place.coins === false ? `fondness ${set.fondness}` : `coins ${set.coins}`}`,
      `shapes ${shapeTags(l.shapes.slice(-16))}`,
      `delay ${info.reported == null ? '?' : info.reported.toFixed(0)}ms  key ${info.measured == null ? '?' : info.measured.toFixed(0)}ms`,
    ];
    g.globalAlpha = 0.9;
    px(W - 132, DEBUG_PANEL_TOP, 130, lines.length * 9 + 4, C.ink);
    g.globalAlpha = 1;
    lines.forEach((s, i) => text(s, W - 129, DEBUG_PANEL_TOP + 2 + i * 9));
  }

  // view: { screen: 'title' | 'ready' | 'playing' | 'paused' | 'over' | 'shop' | 'studio' | 'room', set, scene, keys,
  //   t (set time, which is the band's; in the shop, the time of the band you try the loop pedal
  //   over), bars (bars into the set, a fraction is fine; 0 with no set), time (seconds since the page
  //   opened), still (reduced motion), flocks (the birds, from createFlocks), gear (gear.js),
  //   stomp: null | { id, on, time } (the last pedal stomped, and when, on the page's clock),
  //   loop: null | the loop pedal's loop (looper.js) in the set, or in the shop while you try it,
  //   loopSaid: null | { what: 'layer' | 'full' | 'cancelled' | 'removed' | 'cleared', layer, time }
  //     (the loop pedal's last news, and when: see loopWords; with none showing, loopCue takes its
  //     place over the strip: the count-in, or the recording's progress),
  //   shop: the shop's state (shop.js) on the shop screen, studio: the studio's state (studio.js) on
  //   the studio screen, where t is the band time of the beat it plays, room: your room's state
  //   (room.js) on the room screen, keeps: your keepsakes (keepsakes.js), debug: null | { reported, measured },
  //   busking: null | the name of the beat your next set plays, said over the prompt on the 'ready'
  //     screen (null leaves the prompt alone),
  //   teach: the 'ready' screen shows the key chart (the first set of the visit), not the short prompt,
  //   inCase: the keepsakes in your case (keeps.inCase), shown in its lid wherever you busk }
  return function draw(view) {
    const { screen, set, scene, keys, t, time } = view;
    g.imageSmoothingEnabled = false;
    if (screen === 'shop') return shopView(view);
    if (screen === 'room') return roomView(view);
    if (screen === 'studio') return drawStudio({ px, text, big, measure, C }, view.studio, t);
    ({ park, station, market, island })[scene.place](view);
    const flying = figures(view);
    if (set) {
      for (const p of set.crowd.people) {
        if (p.reaction && t - p.reaction.t < ICON_TIME) {
          const over = p.animal ? overAnimal(animalFrame(p, t, time, set.clock.beat)) : OVER_HEAD;
          sprite(`react-${p.reaction.rule}-${frameOf(time * REACT_FPS, 2)}`, p.x, p.y - over);
        }
      }
    }
    for (const fly of flying) fly();
    for (const f of scene.flights) {
      const at = coinAt(f, t);
      if (at) sprite(`coin-${frameOf((t - f.t) * 12, 2)}`, at[0], at[1]);
    }
    if (set) {
      loopTrail(scene, t);
      trail(scene, set.listen.notes, t);
      strip(set.listen, scene, t);
      if (view.debug) debugView(set, view.debug);
    }
    if (keys && screen !== 'title') hud(view, screen === 'ready' ? null : set);
    if (screen === 'title') title();
    else if (screen === 'ready' && view.teach) keyChart(view.busking);
    else if (screen === 'ready') {
      // on a dark backing, so it reads over the station's lamps and board, or the market's lanterns
      const lines = [view.busking && `busking to ${view.busking}`, 'play a note to start the set'].filter(Boolean);
      const w = Math.ceil(Math.max(...lines.map(measure))) + 12, top = view.busking ? 47 : 57;
      g.globalAlpha = BACKING;
      px(Math.round(W / 2 - w / 2), top, w, 70 - top, C.ink);
      g.globalAlpha = 1;
      if (view.busking) text(`busking to ${view.busking}`, W / 2, 50, C.gold, 'center');
      text('play a note to start the set', W / 2, 60, C.light, 'center');
    } else if (screen === 'paused') { // dimmed, under the pause card (index.html)
      g.globalAlpha = 0.5;
      px(0, 0, W, H, C.ink);
      g.globalAlpha = 1;
    }
  };
}
