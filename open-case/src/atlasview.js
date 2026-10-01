// The map on screen: atlas.js's state shown as page elements over the canvas, the way Nathan's
// reference (his friend's atlas) shows its world. On it: the land and the pictures standing on it
// (assets/map/ and map.json, made by art/open-case/map/), each place's label and the gold pin over the
// chosen one, two clouds drifting over with their shadows; over it: the title, the track you'll play
// (or the "What track?" panel) and the keys' hint. The view is SCREEN map pixels, scaled to
// fit the window; it glides to each place you choose. A click on a place, its label or a track calls
// on.place(id) or on.track(i), for main.js to hand to atlas.js.
import { PLACE_IDS, PLACE_WORDS } from './places.js';
import { moodName } from './beats.js';
import { placeOf, trackOf, viewAt } from './atlas.js';

export const SCREEN = [1280, 720]; // the view of the map, in map pixels, before it's scaled to the window
const GLIDE = 6; // how fast the view glides to a place: about this share of the way each second
const CLOUD_SPEED = 6; // map pixels a second a cloud drifts east
const CLOUD_SHADOW = [40, 70]; // where a cloud's shadow falls, from the cloud
const BOB = 2; // pixels the pin bobs up and down
const PIN = '<svg width="22" height="30" viewBox="0 0 11 15" shape-rendering="crispEdges"><path d="M3 0h5v1h1v1h1v1h1v4h-1v2h-1v2h-1v2h-1v2h-1v1h-1v-1h-1v-2h-1v-2h-1v-2h-1v-2h-1v-4h1v-1h1v-1h1z" fill="#fcd062"/><path d="M4 3h3v1h1v3h-1v1h-3v-1h-1v-3h1z" fill="#1c1626"/><rect x="3" y="1" width="2" height="1" fill="#fff2cc"/></svg>';

function el(tag, className, parent, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  parent?.append(e);
  return e;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`couldn't load ${src}`));
    img.src = src;
  });
}

// root: the page's #atlas, empty and hidden. on: { place(id), track(i) }.
export async function createAtlasView(root, on, base = new URL('../assets/map/', import.meta.url)) {
  const map = await (await fetch(new URL('map.json', base))).json();
  const [mapW, mapH] = map.size;
  const stage = el('div', 'stage', root);
  const world = el('div', 'world', stage);
  world.style.width = `${mapW}px`;
  world.style.height = `${mapH}px`;
  const land = await loadImage(new URL(map.land, base));
  land.className = 'land';
  land.alt = '';
  world.append(land);
  for (const p of map.pictures) {
    const img = await loadImage(new URL(`${p.name}.png`, base));
    Object.assign(img.style, { left: `${p.x}px`, top: `${p.y}px` });
    img.alt = '';
    if (PLACE_IDS.includes(p.name)) {
      img.classList.add('place');
      img.addEventListener('click', () => on.place(p.name));
    }
    world.append(img);
  }
  const labels = {};
  for (const id of PLACE_IDS) {
    const [x, y] = map.places[id].label;
    const label = el('button', 'label', world);
    label.type = 'button';
    Object.assign(label.style, { left: `${x}px`, top: `${y}px` });
    const name = el('span', 'name', label);
    el('span', 'dot', name);
    name.append(PLACE_WORDS[id].name);
    el('span', 'crowd', label, PLACE_WORDS[id].crowd);
    label.addEventListener('click', () => on.place(id));
    labels[id] = label;
  }
  const pin = el('div', 'pin', world);
  pin.innerHTML = PIN;
  const clouds = [];
  for (const c of map.clouds) {
    const img = await loadImage(new URL(`${c.name}.png`, base));
    const shadow = img.cloneNode();
    img.className = 'cloud';
    shadow.className = 'cloud shadow';
    for (const i of [img, shadow]) i.style.width = `${img.width * 2}px`;
    world.append(shadow, img);
    clouds.push({ img, shadow, x: c.x, y: c.y, w: img.width * 2 });
  }

  el('div', 'shade', stage);
  el('h1', 'title', stage, 'Where to busk?');
  const chip = el('div', 'chip', stage);
  el('span', 'music', chip, '♪');
  const chipWords = el('div', null, chip);
  const chipName = el('div', 'big', chipWords), chipAbout = el('div', 'small', chipWords);
  const panel = el('div', 'panel', stage);
  el('h2', null, panel, 'What track?');
  const rows = el('div', 'rows', panel);
  el('div', 'foot', panel, '↑↓ choose · enter busk here · esc back');
  const hint = el('div', 'hint', stage);

  const fit = () => stage.style.setProperty('--s', String(Math.min(innerWidth / SCREEN[0], innerHeight / SCREEN[1])));
  fit();
  addEventListener('resize', fit);

  let view = null; // where the view is, gliding toward where it should be
  let rowsOf = null; // the track list the panel's rows were made for
  const about = (t) => `${t.bpm} bpm · ${moodName(t.mood)}`;

  // The panel's rows: the ready-made tracks, then your own under their own heading.
  function makeRows(tracks) {
    rows.replaceChildren();
    el('div', 'eyebrow', rows, 'ready-made');
    tracks.forEach((t, i) => {
      if (t.key.slot !== undefined && tracks[i - 1]?.key.ready) el('div', 'eyebrow', rows, 'your tracks');
      const row = el('button', 'row', rows);
      row.type = 'button';
      el('span', 'tname', row, t.name);
      el('small', null, row, about(t));
      row.addEventListener('click', () => on.track(i));
    });
    rowsOf = tracks;
  }

  return {
    map,
    // Called every frame while the map is up: a (atlas.js), time (seconds on the page's clock), dt
    // (seconds since the last frame), still (reduced motion: no gliding, drifting or bobbing).
    show(a, { time, dt, still }) {
      root.hidden = false;
      const target = viewAt(a, map, SCREEN);
      if (!view || still) view = { ...target };
      else {
        const k = 1 - Math.exp(-GLIDE * Math.min(dt, 0.1));
        view.x += (target.x - view.x) * k;
        view.y += (target.y - view.y) * k;
      }
      world.style.transform = `translate(${-Math.round(view.x)}px, ${-Math.round(view.y)}px)`;
      const place = placeOf(a);
      for (const id of PLACE_IDS) labels[id].classList.toggle('on', id === place);
      const [px, py] = map.places[place].pin;
      const bob = still ? 0 : Math.round(((Math.sin(time * 3) + 1) / 2) * BOB);
      Object.assign(pin.style, { left: `${px}px`, top: `${py - bob}px` });
      for (const c of clouds) {
        const x = still ? c.x : ((c.x + time * CLOUD_SPEED) % (mapW + c.w)) - c.w;
        Object.assign(c.img.style, { left: `${Math.round(x)}px`, top: `${c.y}px` });
        Object.assign(c.shadow.style, { left: `${Math.round(x) + CLOUD_SHADOW[0]}px`, top: `${c.y + CLOUD_SHADOW[1]}px` });
      }
      const t = trackOf(a);
      chip.hidden = a.panel || !t;
      if (t) {
        chipName.textContent = t.name;
        chipAbout.textContent = about(t);
      }
      panel.hidden = !a.panel;
      if (a.panel) {
        if (rowsOf !== a.tracks) makeRows(a.tracks);
        [...rows.querySelectorAll('.row')].forEach((r, i) => r.classList.toggle('on', i === a.track));
      }
      hint.textContent = a.panel ? '↑↓ choose a track · enter to busk · esc back'
        : `← → choose a place · enter ${a.straightGo ? 'to busk here' : 'to go'}`;
    },
    hide() {
      root.hidden = true;
      view = null;
    },
  };
}
