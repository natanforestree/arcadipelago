// Draws the scene at 320x180 into a 2D context (main.js scales it up by a whole number). Everything is
// a placeholder drawn in code, in placeholder dusk colours until the flat-style repaint: the park, you
// on your crate with the guitar, the open case and the looper, the passers-by, their reactions, the
// note trail, the memory strip, and the title, pause and ?debug overlays. The end card is HTML
// (index.html).
import { CROWD, PLAY, LAYERS } from './tuning.js';
import { BAR, BEAT } from './groove.js';
import { GUITAR, CASE, coinAt, glyphAt, GOLD } from './scene.js';

export const W = 320, H = 180;
const FONT = '8px Silkscreen, monospace';
const C = {
  sky: ['#241c47', '#33245a', '#4a2d66', '#6a3468', '#8a3c6c', '#b04f63', '#cf6456', '#e8804e', '#f3a04c'],
  roofs: '#3a2750', roofs2: '#2c1f40', window: '#ffcf7a',
  grass: '#34503f', grass2: '#2a4234', path: '#7d6a5f', path2: '#6b5a51', edge: '#9a8676',
  trunk: '#3b2a26', leaves: '#2f4a3a', leaves2: '#3d5e46', pole: '#2b2733', lamp: '#ffd98a',
  crate: '#9b6a3c', crate2: '#6e4a2a', hoodie: '#d98a4a', skin: '#e8b98c', beanie: '#5b6fae', jeans: '#3d4a6b',
  guitar: '#c8843f', guitar2: '#8a5528', neck: '#5a3a22',
  caseOut: '#2b2027', caseIn: '#7a2e3a', coin: '#ffd35a', coin2: '#c99a2e',
  pedal: '#39414f', ledOn: '#ff6a5a', ledOff: '#5ad18a',
  text: '#fff2dc', dim: '#1b1430', panel: '#1b1430e0', gold: '#ffd35a', grey: '#8a8398',
};
const PEOPLE = {
  jogger: { body: '#e8505b', legs: '#f2f2f2', head: '#e8b98c', h: 30 },
  oldman: { body: '#8a7f6e', legs: '#4a4038', head: '#e3c2a0', h: 29 },
  student: { body: '#4f86c6', legs: '#2f3552', head: '#c98f63', h: 28 },
  commuter: { body: '#3b3f4a', legs: '#2a2c33', head: '#e0b48a', h: 31 },
};
const ICON_TIME = 1.6; // seconds a reaction shows over a head
const GOLD_PULSE = 8; // speed (rad/s) the callback's gold frame pulses at
const RULE_WORDS = { offKey: 'off key' }; // the ?debug view's words for rules, where they differ from their names

// Your last notes tagged by shape: notes completing the same shape share a letter; '-' completes none.
export function shapeTags(shapes) {
  const letters = new Map();
  return shapes.map((k) => {
    if (!k) return '-';
    if (!letters.has(k)) letters.set(k, String.fromCharCode(65 + (letters.size % 26)));
    return letters.get(k);
  }).join('');
}

export function createRenderer(g) {
  const px = (x, y, w, h, c) => {
    g.fillStyle = c;
    g.fillRect(Math.round(x), Math.round(y), w, h);
  };
  const text = (s, x, y, c = C.text, align = 'left') => {
    g.font = FONT;
    g.textAlign = align;
    g.textBaseline = 'top';
    g.fillStyle = c;
    g.fillText(s, Math.round(x), Math.round(y));
  };

  function park(time) {
    C.sky.forEach((c, i) => px(0, i * 13, W, 13, c));
    // distant rooftops, a few lit windows
    const roofs = [[0, 92, 40], [36, 84, 30], [62, 96, 34], [92, 80, 26], [196, 88, 36], [228, 78, 30], [254, 94, 40], [290, 86, 30]];
    for (const [x, y, w] of roofs) px(x, y, w, 120 - y, C.roofs);
    for (const [x, y] of [[8, 100], [44, 92], [100, 88], [206, 96], [236, 86], [264, 102], [298, 94]]) px(x, y, 3, 3, C.window);
    px(0, 110, W, 10, C.roofs2);
    px(0, 120, W, 18, C.grass);
    for (let x = 0; x < W; x += 7) px(x, 118 + ((x * 13) % 3), 2, 2, C.grass2);
    px(0, 138, W, H - 138, C.path);
    px(0, 138, W, 1, C.edge);
    for (let x = 3; x < W; x += 11) px(x, 150 + ((x * 7) % 20), 4, 1, C.path2);
    // a tree on the right
    px(262, 84, 6, 40, C.trunk);
    for (const [x, y, w, h, c] of [[244, 58, 42, 20, C.leaves], [238, 72, 54, 16, C.leaves], [250, 50, 30, 10, C.leaves2], [246, 64, 20, 8, C.leaves2]]) px(x, y, w, h, c);
    // the lamp post, its light flickering a little
    px(99, 66, 2, 72, C.pole);
    px(95, 62, 10, 4, C.pole);
    const glow = 0.18 + 0.03 * Math.sin(time * 7.3) * Math.sin(time * 2.1);
    g.globalAlpha = glow;
    g.fillStyle = C.lamp;
    g.beginPath();
    g.arc(100, 70, 28, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;
    px(97, 66, 6, 4, C.lamp);
  }

  function you(time, beatPhase) {
    const [cx, cy] = CASE;
    px(128, 140, 18, 14, C.crate);
    px(128, 146, 18, 1, C.crate2);
    px(136, 140, 1, 14, C.crate2);
    px(133, 116, 10, 25, C.hoodie); // body
    px(141, 134, 10, 5, C.jeans); // thighs
    px(149, 134, 4, 18, C.jeans); // shins
    px(149, 152, 6, 2, C.dim);
    g.fillStyle = C.skin;
    g.beginPath();
    g.arc(138, 111, 5, 0, Math.PI * 2);
    g.fill();
    px(133, 104, 10, 4, C.beanie);
    const strum = Math.sin(time * 12) > 0.6 ? 1 : 0;
    // the guitar across your lap
    px(150, 124, 18, 2, C.neck);
    g.fillStyle = C.guitar;
    g.beginPath();
    g.ellipse(144, 131, 8, 6, -0.25, 0, Math.PI * 2);
    g.fill();
    px(143, 130, 3, 3, C.guitar2);
    px(141, 126 + strum, 4, 3, C.skin); // the picking hand
    // the open case, lid up behind it
    px(cx - 14, cy - 8, 28, 3, C.caseOut);
    px(cx - 14, cy - 5, 28, 8, C.caseOut);
    px(cx - 12, cy - 4, 24, 6, C.caseIn);
    // the looper, its light red on each bar's first beat
    px(114, 159, 10, 6, C.pedal);
    px(118, 160, 2, 2, beatPhase < 0.25 ? C.ledOn : C.ledOff);
  }

  function caseCoins(n) {
    const [cx, cy] = CASE;
    for (let i = 0; i < Math.min(n, 60); i++) {
      const col = i % 12, row = Math.floor(i / 12);
      px(cx - 11 + col * 2, cy + 1 - row, 2, 1, i % 3 ? C.coin : C.coin2);
    }
  }

  function person(p, time) {
    const k = PEOPLE[p.kind];
    const walking = p.state !== 'stopped';
    const bob = walking ? Math.round(Math.abs(Math.sin(time * (p.kind === 'jogger' ? 12 : 7) + p.id))) : 0;
    const x = Math.round(p.x) - 4, feet = Math.round(p.y), top = feet - k.h - bob;
    px(x + 1, feet - 10 - bob, 2, 10 + bob, k.legs);
    px(x + 5, feet - 10, 2, 10, k.legs);
    px(x, top + 8, 8, k.h - 17, k.body);
    px(x + 1, top, 6, 7, k.head);
    const face = p.state === 'stopped' || p.state === 'joining' ? (p.x < CROWD.playerX ? 1 : -1) : p.dir;
    px(face > 0 ? x + 6 : x + 1, top + 2, 1, 1, C.dim); // an eye, looking the way they face
    if (p.kind === 'oldman') {
      px(x - 1, top - 2, 10, 2, '#4a4038');
      px(x + 1, top - 4, 6, 2, '#4a4038');
      px(face > 0 ? x + 9 : x - 2, top + 14, 1, k.h - 14, '#6b4a31'); // cane
    } else if (p.kind === 'jogger') px(x + 1, top + 1, 6, 1, '#ffffff');
    else if (p.kind === 'student') {
      px(face > 0 ? x - 3 : x + 8, top + 9, 3, 8, '#d8b04a'); // backpack
      px(x, top + 1, 1, 4, '#222222');
      px(x + 7, top + 1, 1, 4, '#222222');
    } else px(face > 0 ? x + 8 : x - 3, feet - 16, 3, 5, '#6b4a31'); // briefcase
    return top;
  }

  // A reaction over a head, readable within a second.
  function icon(rule, x, y, time) {
    const hop = Math.round(Math.abs(Math.sin(time * 8)) * 2);
    switch (rule) {
      case 'repeat': text('zzz', x, y - 8, '#c9d2ff', 'center'); break;
      case 'random': text('?', x, y - 9 - hop, '#fff2dc', 'center'); break;
      case 'offKey': text('>:(', x, y - 8, '#ff8a7a', 'center'); break;
      case 'silence': text('...', x, y - 8, '#c9c2d8', 'center'); break;
      case 'loud': text('#!', x, y - 8, '#ffb0a0', 'center'); break;
      case 'recognised': text('v', x, y - 8 - hop, '#bff0c4', 'center'); break;
      case 'taste': // two bouncing notes
        for (const [dx, h] of [[-4, hop], [2, 2 - hop]]) {
          px(x + dx, y - 5 - h, 3, 2, '#ffe9a8');
          px(x + dx + 2, y - 10 - h, 1, 5, '#ffe9a8');
        }
        break;
      case 'callback':
        px(x - 2, y - 7 - hop, 5, 5, C.coin);
        px(x - 1, y - 6 - hop, 3, 3, C.coin2);
        break;
    }
  }

  function trail(scene, notes, t) {
    for (const glyph of scene.trail) {
      const { x, y, fade } = glyphAt(glyph, t);
      if (fade <= 0 || x > W) continue;
      const echo = notes[glyph.index]?.echo ?? 1;
      g.globalAlpha = fade;
      if (echo === 2) px(x - 1, y - 1, 5, 5, '#fff2dc'); // a shape's second time: a faint outline
      px(x, y, 3, 3, echo >= 3 ? C.grey : '#ffe9a8');
      px(x + 2, y - 4, 1, 4, echo >= 3 ? C.grey : '#ffe9a8');
      g.globalAlpha = 1;
    }
  }

  // The crowd's 6 remembered ideas, along the top: each a little contour of its 4 notes.
  function strip(listen, scene, t) {
    const n = listen.strip.length;
    for (let i = 0; i < 6; i++) {
      const x = 58 + i * 36, y = 4;
      const lit = scene.gold && i === n - 1;
      px(x, y, 30, 16, lit ? '#5a4520' : '#1b143099');
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
      ys.forEach((v, k) => px(x + 3 + k * 7, y + 12 - Math.round(((v - lo) / span) * 9), 3, 2, lit ? C.gold : '#ffe9a8'));
    }
    text('they remember', 163, 22, C.grey, 'center'); // labels the strip for a first-time player; 163 is its centre (58..268)
    if (scene.gold) {
      // the gold arc from the old idea down to your guitar, and a word popping up beside it, both fading together
      const k = Math.min(1, (t - scene.gold.t) / 0.5);
      const x0 = 58 + (n - 1) * 36 + 15, y0 = 20, [x1, y1] = GUITAR;
      g.globalAlpha = 1 - Math.max(0, (t - scene.gold.t) / GOLD);
      for (let s = 0; s <= k; s += 0.04) px(x0 + (x1 - x0) * s, y0 + (y1 - y0) * s - Math.sin(Math.PI * s) * 20, 3, 3, C.gold);
      text('callback!', x0, y0 + 10, C.gold, 'center');
      g.globalAlpha = 1;
    }
  }

  function hud(keys, set) {
    text(`oct ${keys.octave >= 0 ? '+' : ''}${keys.octave}`, 4, 170);
    for (let i = 0; i < PLAY.strengthMax; i++) px(52 + i * 5, 172, 4, 4, i < keys.strength ? C.text : C.dim);
    if (keys.lock) text('lock', 78, 170, C.gold);
    if (set) text(`bar ${Math.min(60, Math.floor(set.t / BAR) + 1)}/60`, W - 4, 170, C.text, 'right');
  }

  function title() {
    px(40, 34, 240, 112, C.panel);
    g.font = '16px Silkscreen, monospace';
    g.textAlign = 'center';
    g.textBaseline = 'top';
    g.fillStyle = C.text;
    g.fillText('Open Case', W / 2, 42);
    // the key layout: GarageBand's Musical Typing
    const whites = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'"];
    const blacks = { 0: 'W', 1: 'E', 3: 'T', 4: 'Y', 5: 'U', 7: 'O', 8: 'P' };
    whites.forEach((k, i) => {
      px(72 + i * 16, 80, 15, 18, '#f3e6c4');
      text(k, 79 + i * 16, 88, '#3b2a1c', 'center');
    });
    for (const [i, k] of Object.entries(blacks)) {
      px(72 + Number(i) * 16 + 10, 70, 11, 14, '#2b2027');
      text(k, 72 + Number(i) * 16 + 16, 73, C.text, 'center');
    }
    text('Z X octave   C V softer/louder   space ring', W / 2, 106, '#f7d3bc', 'center');
    text('1 scale lock   M mute   esc pause', W / 2, 116, '#f7d3bc', 'center');
    text('press any key', W / 2, 132, C.gold, 'center');
  }

  function debugView(set, info) {
    for (const p of set.crowd.people) {
      const x = Math.round(p.x) - 10, y = Math.round(p.y) + 3;
      px(x, y, 20, 3, C.dim);
      px(x, y, Math.round(20 * p.interest), 3, p.interest >= 0.5 ? '#5ad18a' : p.interest >= 0.2 ? '#ffd35a' : '#ff6a5a');
      if (p.lastRule) text(RULE_WORDS[p.lastRule] ?? p.lastRule, p.x, y + 4, C.text, 'center');
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
    px(W - 132, 24, 130, lines.length * 9 + 4, C.panel);
    lines.forEach((s, i) => text(s, W - 129, 26 + i * 9));
  }

  // view: { screen: 'title' | 'ready' | 'playing' | 'paused' | 'over', set, scene, keys, t (set time),
  //   time (seconds since the page opened), debug: null | { reported, measured } }
  return function draw(view) {
    const { screen, set, scene, keys, t, time } = view;
    g.imageSmoothingEnabled = false;
    park(time);
    you(time, set && t >= 0 ? (t % BAR) / BAR : 1);
    caseCoins(scene ? scene.caseCoins : 0);
    if (set) {
      const people = [...set.crowd.people].sort((a, b) => a.y - b.y);
      for (const p of people) {
        const top = person(p, time);
        if (p.reaction && t - p.reaction.t < ICON_TIME) icon(p.reaction.rule, p.x, top, time);
      }
      for (const f of scene.flights) {
        const at = coinAt(f, t);
        if (at) px(at[0] - 1, at[1] - 1, 3, 3, C.coin);
      }
      trail(scene, set.listen.notes, t);
      strip(set.listen, scene, t);
      if (view.debug) debugView(set, view.debug);
    }
    if (keys && screen !== 'title') hud(keys, screen === 'ready' ? null : set);
    if (screen === 'title') title();
    else if (screen === 'ready') text('play a note to start the set', W / 2, 60, C.text, 'center');
    else if (screen === 'paused') { // dimmed, under the pause card (index.html)
      g.globalAlpha = 0.5;
      px(0, 0, W, H, C.dim);
      g.globalAlpha = 1;
    }
  };
}
