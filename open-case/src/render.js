// Draws the scene at 320x180 into a 2D context (main.js scales it up by a whole number), in the flat
// style, from the sprite sheet art/open-case/sprites.lua makes (assets.js loads it): the park and its
// sunset, you on your crate with your instrument, your pedals and the loop pedal, the open case and
// the band's speaker, the passers-by, their reactions, the pigeons and birds, the note trail (and
// your loop's), the memory strip, the gear strip, the music shop, and the title, pause and ?debug
// overlays. The end card is HTML (index.html).
import { CROWD, PLAY, LAYERS, INTEREST, LOOP } from './tuning.js';
import { BAR, BEAT } from './groove.js';
import {
  GUITAR, coinAt, glyphAt, loopGlyphAt, GOLD, skyStages, sunDrop, windowLit, lampState, starsOut, trainX, cloudX,
  birdsAt, pigeonsAt, frameOf,
} from './scene.js';
import { STOCK, PEDALS, owns, stockItem } from './gear.js';
import { card, trying, CARD, BUTTON } from './shop.js';
import { loopState } from './looper.js';

export const W = 320, H = 180;
const FONT = '8px Silkscreen, monospace';
const ICON_TIME = 1.6; // seconds a reaction shows over a head
const REACT_FPS = 2.5; // a reaction's two frames alternate this many times a second
const GOLD_PULSE = 8; // speed (rad/s) the callback's gold frame pulses at
const DEBUG_PANEL_TOP = 32; // clears "they remember" (drawn at y 22, ~8px tall) with a couple of px to spare
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
const NOD_SHOW = 1.2; // seconds the shopkeeper nods after a sale...
const NOD_FPS = 4; // ...this many nods a second

// Your last notes tagged by shape: notes completing the same shape share a letter; '-' completes none.
export function shapeTags(shapes) {
  const letters = new Map();
  return shapes.map((k) => {
    if (!k) return '-';
    if (!letters.has(k)) letters.set(k, String.fromCharCode(65 + (letters.size % 26)));
    return letters.get(k);
  }).join('');
}

// The frame a listener shows: walking by where they are (so a slower walker steps slower), and
// standing still facing you, breathing, or nodding on the beat once they're hooked.
export function personFrame(p, t, time) {
  const facingYou = p.state === 'stopped' || p.state === 'joining';
  const face = (facingYou ? (p.x < CROWD.playerX ? 1 : -1) : p.dir) > 0 ? 'right' : 'left';
  if (p.state !== 'stopped') return `${p.kind}-walk-${frameOf((Math.abs(p.x) + Math.abs(p.y)) / STEP, 4)}-${face}`;
  if (p.interest > INTEREST.hook) return `${p.kind}-nod-${t / BEAT - Math.floor(t / BEAT) < NOD ? 1 : 0}-${face}`;
  return `${p.kind}-stand-${frameOf(time / BREATH + p.id * 0.37, 2)}-${face}`;
}

// You with your instrument: playing for a moment after each note (a guitar's strum, a keyboard's
// hands), and otherwise breathing.
export function youFrame(scene, t, time, instrument) {
  const since = t - scene.lastNote;
  if (since >= 0 && since < STRUM) return `you-${instrument}-play-${Math.min(2, Math.floor((since / STRUM) * 3))}`;
  return `you-${instrument}-idle-${frameOf(time / BREATH, 2)}`;
}

// The loop pedal's light at band time t (loop: looper.js, or null): dark while the loop is empty,
// red blinking on the beat while a recording waits for its bar line, red while it records, and green
// while the loop plays.
export function loopLight(loop, t) {
  const state = loop ? loopState(loop, t) : 'empty';
  if (state === 'waiting') return frameOf(t / (BEAT / 2), 2) === 0 ? 'red' : 'dark';
  return { recording: 'red', playing: 'green' }[state] ?? 'dark';
}

// The words for the loop pedal's news over the strip. what: 'recording' (layer: the layer it's about
// to record, from 1), 'full', 'cancelled', 'removed' or 'cleared'.
export function loopWords({ what, layer }) {
  if (what === 'recording') return layer === 1 ? 'loop recording' : `layer ${layer}`;
  return { full: 'loop full', cancelled: 'recording cancelled', removed: 'layer removed', cleared: 'loop cleared' }[what];
}

// The trees: still when motion is reduced, rustling just after each bar line of a set, and otherwise
// swaying slowly.
export function treeFrame(t, time, playing, still) {
  if (still) return 0;
  if (playing && t >= 0 && t % BAR < RUSTLE) return 2;
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
  // A frame from the sheet, placed by its anchor.
  const sprite = (name, x, y) => {
    const f = frames[name];
    if (!f) throw new Error(`no sprite called ${name}`);
    g.drawImage(sheet, f[0], f[1], f[2], f[3], Math.round(x) - f[4], Math.round(y) - f[5], f[2], f[3]);
  };
  const bandOf = (y) => data.bands.findLastIndex((b) => b <= y);

  // Back to front: the sky and what's in it, the rooftops, the trees, the hedge and path, the lamp.
  function park({ bars, t, time, still, set, scene, flocks }) {
    const bar = Math.floor(bars);
    const stages = skyStages(bar);
    data.bands.forEach((top, i) => {
      const bottom = data.bands[i + 1] ?? data.skyBottom + 1;
      px(0, top, W, bottom - top, data.sky[stages[i]][i]);
    });
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
    sprite(`trees-${treeFrame(t, time, !!set, still)}`, 0, 0);
    sprite('ground', 0, 0);
    const lamp = lampState(bar, time, still);
    if (lamp !== 'off') sprite('pool', 0, 0);
    sprite(`lamp-${lamp}`, 0, 0);
  }

  // Everyone and everything standing on the path, nearest last: the listeners, you, your pedals, the
  // loop pedal and the amp, the speaker, the case and its coins, and the pigeons on the ground.
  // Returns the pigeons in the air, drawn later.
  function figures({ set, scene, t, time, gear, loop }) {
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
          for (const [x, y] of data.caseCoins.slice(0, scene.caseCoins)) sprite('case-coin', x, y);
        },
      },
    ];
    if (gear.instrument === 'electric') things.push({ y: data.feet.amp, draw: () => sprite('amp', 0, 0) });
    if (owns(gear, 'loop')) things.push({ y: data.feet.loop, draw: () => sprite(`pedal-loop-${loopLight(loop, t)}`, 0, 0) });
    if (set) for (const p of set.crowd.people) things.push({ y: p.y, draw: () => sprite(personFrame(p, t, time), p.x, p.y) });
    const flying = [];
    for (const b of pigeonsAt(scene, t, time)) {
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
    text('they remember', 163, 22, C.grey, 'center'); // labels the strip for a first-time player; 163 is its centre (58..268)
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

  function hud({ keys, gear, stomp, loop, loopSaid, t, time }, set) {
    text(`oct ${keys.octave >= 0 ? '+' : ''}${keys.octave}`, 4, 170);
    for (let i = 0; i < PLAY.strengthMax; i++) px(52 + i * 5, 172, 4, 4, i < keys.strength ? C.light : C.ink);
    if (keys.lock) text('lock', 78, 170, C.gold);
    if (set) text(`bar ${Math.min(60, Math.floor(set.t / BAR) + 1)}/60`, W - 4, 170, C.light, 'right');
    // The gear strip: each pedal you own in its own place, with its key, lit while it's on; the name
    // of the one just stomped shows above it for a moment.
    PEDALS.forEach((id, i) => {
      if (!owns(gear, id)) return;
      const on = gear.on.includes(id), x = STRIP_X + i * STRIP_STEP;
      sprite(`strip-${id}-${on ? 1 : 0}`, x, 170);
      text(String(stockItem(id).key), x + 9, 170, on ? C.light : C.grey);
    });
    // The loop pedal's slot, after the pedals: its icon, its key, and a dot for each layer it can
    // hold, lit for each recorded and red for the one recording.
    if (owns(gear, 'loop')) {
      const x = STRIP_X + LOOP_SLOT * STRIP_STEP, state = loop ? loopState(loop, t) : 'empty';
      sprite(`strip-loop-${loopLight(loop, t)}`, x, 170);
      text('R', x + 9, 170, state === 'empty' ? C.grey : C.light);
      const layers = loop?.layers.length ?? 0;
      for (let i = 0; i < LOOP.layers; i++) {
        px(x + 15 + i * 4, 172, 3, 3, i < layers ? C.light : i === layers && loop?.take ? C.red : C.greyDark);
      }
    }
    // What you just did shows over the strip for a moment: the pedal stomped, or the loop pedal's
    // news, whichever is newer.
    const news = [];
    if (stomp) {
      news.push({
        time: stomp.time, x: STRIP_X + PEDALS.indexOf(stomp.id) * STRIP_STEP + 7,
        words: `${stockItem(stomp.id).name.toLowerCase()} ${stomp.on ? 'on' : 'off'}`, good: stomp.on,
      });
    }
    if (loopSaid) news.push({ time: loopSaid.time, x: STRIP_X + LOOP_SLOT * STRIP_STEP + 7, words: loopWords(loopSaid), good: loopSaid.what === 'recording' });
    const shown = news.filter((n) => time - n.time >= 0 && time - n.time < STOMP_SHOW).sort((a, b) => b.time - a.time)[0];
    if (shown) {
      text(shown.words, shown.x + 1, 161, C.ink, 'center');
      text(shown.words, shown.x, 160, shown.good ? C.gold : C.light, 'center');
    }
  }

  function title() {
    g.globalAlpha = 0.9;
    px(40, 34, 240, 112, C.ink);
    g.globalAlpha = 1;
    g.font = '16px Silkscreen, monospace';
    g.textAlign = 'center';
    g.textBaseline = 'top';
    g.fillStyle = C.light;
    g.fillText('Open Case', W / 2, 42);
    // the key layout: GarageBand's Musical Typing
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
    text('press any key', W / 2, 136, C.gold, 'center');
  }

  // The music shop: the room and the shopkeeper (nodding just after a sale), the stock with its tags
  // (the chosen item lifted, with a pointer over it, and the lights lit on the pedals you can hear),
  // the savings on the chalkboard, and the card for the chosen item.
  function shopView({ shop, gear, t, time, still }) {
    const S = data.shop;
    sprite('shop-room', 0, 0);
    text('back to', S.sign[0], S.sign[1], C.ink, 'center');
    text('the park', S.sign[0], S.sign[1] + 8, C.ink, 'center');
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
      const light = item.kind === 'loop' ? loopLight(shop.loop, t) : 'dark'; // the loop pedal you're trying
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
    const keys = STOCK[shop.at].kind === 'loop' ? 'R record   backspace undo   arrows choose   esc back' : 'arrows choose   esc back to the park';
    text(keys, CARD[0] + 6, CARD[1] + 30, C.greyDark);
    if (words.button) {
      px(BUTTON[0], BUTTON[1], BUTTON[2], BUTTON[3], C.gold);
      text(words.button, BUTTON[0] + BUTTON[2] / 2, BUTTON[1] + 3, C.ink, 'center');
    }
  }

  function debugView(set, info) {
    for (const p of set.crowd.people) {
      const x = Math.round(p.x) - 10, y = Math.round(p.y) + 3;
      px(x, y, 20, 3, C.ink);
      px(x, y, Math.round(20 * p.interest), 3, p.interest >= 0.5 ? C.go : p.interest >= 0.2 ? C.gold : C.red);
      if (p.lastRule) text(RULE_WORDS[p.lastRule] ?? p.lastRule, p.x, y + 4, C.light, 'center');
    }
    const l = set.listen;
    const beat = Math.floor((set.t % BAR) / BEAT) + 1;
    const lines = [
      `bar ${Math.min(60, Math.floor(set.t / BAR) + 1)} beat ${beat}`,
      `layers ${LAYERS.filter((x) => set.layers[x.id]).map((x) => x.id).join(' ')}`,
      `crowd ${set.crowd.people.filter((p) => p.state === 'joining' || p.state === 'stopped').length}  coins ${set.coins}`,
      `shapes ${shapeTags(l.shapes.slice(-16))}`,
      `delay ${info.reported == null ? '?' : info.reported.toFixed(0)}ms  key ${info.measured == null ? '?' : info.measured.toFixed(0)}ms`,
    ];
    g.globalAlpha = 0.9;
    px(W - 132, DEBUG_PANEL_TOP, 130, lines.length * 9 + 4, C.ink);
    g.globalAlpha = 1;
    lines.forEach((s, i) => text(s, W - 129, DEBUG_PANEL_TOP + 2 + i * 9));
  }

  // view: { screen: 'title' | 'ready' | 'playing' | 'paused' | 'over' | 'shop', set, scene, keys,
  //   t (set time, which is the band's; in the shop, the time of the band you try the loop pedal
  //   over), bars (bars into the set, a fraction is fine; 0 with no set), time (seconds since the page
  //   opened), still (reduced motion), flocks (the birds, from createFlocks), gear (gear.js),
  //   stomp: null | { id, on, time } (the last pedal stomped, and when, on the page's clock),
  //   loop: null | the loop pedal's loop (looper.js) in the set, or in the shop while you try it,
  //   loopSaid: null | { what, layer, time } (the loop pedal's last news, and when: see loopWords),
  //   shop: the shop's state (shop.js) on the shop screen, debug: null | { reported, measured } }
  return function draw(view) {
    const { screen, set, scene, keys, t, time } = view;
    g.imageSmoothingEnabled = false;
    if (screen === 'shop') return shopView(view);
    park(view);
    const flying = figures(view);
    if (set) {
      for (const p of set.crowd.people) {
        if (p.reaction && t - p.reaction.t < ICON_TIME) {
          sprite(`react-${p.reaction.rule}-${frameOf(time * REACT_FPS, 2)}`, p.x, p.y - OVER_HEAD);
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
    else if (screen === 'ready') text('play a note to start the set', W / 2, 60, C.light, 'center');
    else if (screen === 'paused') { // dimmed, under the pause card (index.html)
      g.globalAlpha = 0.5;
      px(0, 0, W, H, C.ink);
      g.globalAlpha = 1;
    }
  };
}
