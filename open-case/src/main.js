// Start-up, the loop, and the wiring between the keys, the sound, the set and the screen.
//
// The audio clock is the master. Your first note starts the set (and the band) at that note's audio
// time; each frame, the set steps at a fixed 60 Hz up to the audio clock's time since then. Paused,
// the audio is suspended, so the set's clock stops with it. Notes reach the set the moment they're
// played, timed in seconds since the first note.
//
// The game opens on the map (atlas.js, atlasview.js), with the title over it: the sound starts on the
// first key or click, which only clears the title. Before each set it asks where to busk and what
// track to play, your last answers already chosen: the park, the station at rush hour or the night
// market (places.js), each with its own crowd and scene; the music shop is a fourth stop on the map,
// and your home a fifth, which opens the studio.
// Between sets, the end card leads back to it, or to the music shop: your coins are saved, and your
// gear (gear.js) changes how your notes sound, wherever you play and while you try things in the shop.
// Once the loop pedal is yours, R records your notes into a loop (looper.js) that plays on under you;
// the crowd only ever hears the notes you play live.
//
// URL options: ?sound (the sound check); ?debug (interest bars, the corner panel, and Run the bots on
// the end card); ?seed=N (fixes the passers-by, and the park's windows, train and birds); ?bot=random or
// ?bot=lick (the bot plays the set, audibly); ?sky=N (the place as it is N bars into a set, until a set
// starts); ?coins=N (your savings are N on this page, and nothing bought on it is kept); ?beat=lofi,
// bossa, funk, reggae or ballad (every set plays that ready-made beat); ?place=park, station or market
// (every set is there, with no map, and the place isn't kept); ?studio (the first key opens the
// studio, and nothing made on it is kept). With any of them, window.__openCase
// exposes the game for browser checks.
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { layoutPitches, shopKey } from './keys.js';
import { createSet, stepSet, playNote, releaseNote, summary, runSet, momentsOf, endTime } from './set.js';
import { crowdSize, personName } from './crowd.js';
import { createScene, createFlocks, sceneNote, sceneLoopNote, sceneEvents, stepScene, FLIGHT } from './scene.js';
import { createRenderer, W, H } from './render.js';
import { randomBot, lickBot } from './bots.js';
import { safeStorage } from './storage.js';
import { readLog, logSet, logChoice, readBuys, logBuy } from './log.js';
import { soundCheck } from './soundcheck.js';
import { loadArt } from './assets.js';
import { PEDALS, loadGear, saveGear, earn, buy, play, stomp, stockItem, owns } from './gear.js';
import { createShop, choose, move, action, trying, hit } from './shop.js';
import { createLoop, record, note, release, ring, step, undo, due, countBeats } from './looper.js';
import { LOFI, clockOf, readyBeat } from './beats.js';
import { PLACE_WORDS, isPlace, loadPlace, savePlace } from './places.js';
import { createAtlas, atlasKey, clickPlace, clickTrack, clickTitle, trackList, stopOf, trackOf } from './atlas.js';
import { createAtlasView } from './atlasview.js';
import { createStudio, loadBeats, saveBeats, chosenBeat, advance, letGo, setErase } from './studio.js';
import { keyDown, keyUp, mouseDown, mouseMove, mouseUp, scroll, tick } from './studioinput.js';
import { studioHit } from './studioview.js';
import { DT, LAYERS, PARK } from './tuning.js';

// The module is running, so the page's "couldn't start" message will never be needed.
document.getElementById('nostart')?.remove();

// Browsers don't treat these as user activation (Chrome doesn't for a lone modifier, no browser does
// for Esc), so starting an AudioContext from one leaves it suspended.
const NON_ACTIVATING_KEYS = new Set(['Escape', 'Shift', 'Control', 'Alt', 'Meta', 'CapsLock']);

const params = new URLSearchParams(location.search);
const debug = params.has('debug');
const bot = { random: randomBot, lick: lickBot }[params.get('bot')] ?? null;
const fixedSeed = params.has('seed') ? Number.parseInt(params.get('seed'), 10) || 1 : null;
const skyBar = params.has('sky') ? Math.max(0, Number.parseFloat(params.get('sky')) || 0) : 0;
const debugSavings = params.has('coins') ? Math.max(0, Number.parseInt(params.get('coins'), 10) || 0) : null;
const fixedBeat = readyBeat(params.get('beat'));
const tryStudio = params.has('studio');
const fixedPlace = isPlace(params.get('place')) ? params.get('place') : null;
const anyDebug = debug || !!bot || fixedSeed !== null || params.has('sound') || params.has('sky') || debugSavings !== null || !!fixedBeat || tryStudio || !!fixedPlace;
// This page keeps nothing (?coins=N or ?studio): no gear, beats or log is written to storage.
const keepsNothing = debugSavings !== null || tryStudio;

const storage = safeStorage();
const audio = createAudio(storage);
const atlasOn = {}; // what a click on the map does (game() sets it up): { place(id), track(i), title() }
const touchOnly = matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches;

if (touchOnly) document.getElementById('phone').hidden = false;
else if (params.has('sound')) soundCheck(audio, { debug: anyDebug });
else {
  // The art and the map load before the game opens; if they can't, or the game can't start, say
  // something went wrong.
  const atlasRoot = document.getElementById('atlas');
  Promise.all([loadArt(), createAtlasView(atlasRoot, { place: (id) => atlasOn.place(id), track: (i) => atlasOn.track(i), title: () => atlasOn.title() })]).then(([art, atlasView]) => game(art, atlasView)).catch((err) => {
    console.error(err);
    document.getElementById('message').hidden = false;
  });
}

function game(art, atlasView) {
  const canvas = document.getElementById('game');
  const out = canvas.getContext('2d', { alpha: false });
  const off = document.createElement('canvas');
  off.width = W;
  off.height = H;
  const draw = createRenderer(off.getContext('2d'), art);
  const end = document.getElementById('end');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const pageSeed = fixedSeed ?? Date.now() % 2147483647;
  const flocks = createFlocks(pageSeed);
  const t0 = performance.now();
  const pageTime = () => (performance.now() - t0) / 1000; // seconds since the page opened

  // On the map, except on the pages that skip it (?studio, ?place=, ?bot=), which open on a title card.
  // The screens: 'title', 'map', 'ready' (waiting for your first note), 'playing', 'paused', 'over',
  // 'shop', 'studio', 'thanks'.
  let screen = bot || tryStudio || fixedPlace ? 'title' : 'map';
  // Where you busk: ?place='s, or the place you chose last time on the map (kept unless the page keeps
  // nothing). The map's state while it's up (atlas.js).
  let place = fixedPlace ?? loadPlace(storage), atlas = null;
  let set = null, scene = createScene(pageSeed, { place }), start = 0, seed = 0;
  let botMoments = null, botNext = 0, botFed = 0;
  const latency = { reported: null, measured: null };
  // Your savings and gear. With ?coins=N your savings are N, and on that page and ?studio nothing is
  // kept. A save that had bought the studio is paid its 150 coins back (loadGear), and saved at once so
  // it's paid only once.
  const gear = loadGear(storage);
  if (debugSavings !== null) gear.savings = debugSavings;
  const keep = () => !keepsNothing && saveGear(storage, gear);
  if (gear.refunded) keep();
  // The log is Nathan's own: a bot set, a ?coins page or a ?studio page never writes to it. Savings
  // still count up on such a page (earn, below); they're just never kept, same as keep() above.
  const logging = !bot && !keepsNothing;
  let shop = null; // the shop's state (shop.js) while you're in it
  // Your beats (studio.js): six slots and the one your sets play, kept like your gear (not on a ?coins
  // or ?studio page). The studio's state while you're in it, and the last change of its beat handed to
  // the band.
  const beats = loadBeats(storage);
  const keepBeats = () => !keepsNothing && saveBeats(storage, beats);
  let studio = null, studioSeen = -1, studioSaved = true;
  const studioHeld = { key: null }, studioDrag = { what: null }, studioWheel = {};
  // The beat your sets play: ?beat='s, or the one you chose on the map (or with Busk to this).
  const setBeat = () => fixedBeat ?? chosenBeat(beats);
  let stomped = null; // the last pedal stomped: { id, on, time } (its name shows over the gear strip)
  let setPedals = new Set(); // every pedal that's been on during this set, for the log
  // The loop pedal's loop in a set, empty at each set's start (in the shop, the one you try it with
  // is shop.loop). Its times are band time: the audio clock since the band's first 16th, `start`.
  let loop = createLoop();
  // the loop pedal's last news: { what: 'layer' | 'full' | 'cancelled' | 'removed' | 'cleared', layer,
  // time } (it shows over the gear strip; with none showing, the count-in or the recording's progress
  // takes its place)
  let loopSaid = null;
  let setLayers = 0; // layers recorded this set, for the log
  let ringHeld = false; // whether Space is down, for a loop that starts while it is
  let shopBand = false; // whether the band is playing in the shop, for trying the loop pedal

  function fit() {
    const dpr = devicePixelRatio || 1;
    const scale = Math.max(1, Math.floor(Math.min((innerWidth * dpr) / W, (innerHeight * dpr) / H)));
    canvas.width = W * scale;
    canvas.height = H * scale;
    canvas.style.width = `${(W * scale) / dpr}px`;
    canvas.style.height = `${(H * scale) / dpr}px`;
    out.imageSmoothingEnabled = false;
  }
  fit();
  addEventListener('resize', fit);

  // Whether this visit's first set has begun: until then, the waiting screen teaches the keys.
  let taught = false;

  // A new set begins with a note at audio time `at` (your first note, or the bot's start).
  function begin(at) {
    seed = fixedSeed ?? Date.now() % 2147483647;
    set = createSet(seed, setBeat(), place);
    scene = createScene(seed, { bar: set.clock.bar, parkBar: endTime(set) / PARK.bars, place });
    start = at;
    audio.startBand(at, set.beat);
    for (const { id, min } of LAYERS) audio.setLayer(id, min === 0, at);
    setPedals = new Set(gear.on);
    loop = createLoop(set.clock);
    ring(loop, 0, ringHeld);
    setLayers = 0;
    screen = 'playing';
    taught = true;
  }

  // The loop you hear: the set's, or in the shop the one you're trying (null while you aren't).
  const heardLoop = () => (shop ? shop.loop : loop);

  // R records a layer from the next bar line, and Backspace cancels a recording or takes off the last
  // layer: in a set once the pedal is yours, until the set's end, and in the shop while you try it.
  // Their news shows over the gear strip (a landed layer's; "loop full", say); while there's none, the
  // count-in or the recording's progress takes its place, so R itself says nothing at once.
  function loopKey(action) {
    const l = shop ? shop.loop : set?.phase === 'playing' && owns(gear, 'loop') ? loop : null;
    if (!l) return;
    const time = pageTime();
    if (action === 'loop') {
      if (record(l, audio.now() - start)) {
        loopSaid = null; // an older message would otherwise hide the count-in
        audio.countIn(countBeats(l).map((b) => start + b), l.layers.length);
      } else if (!l.take) loopSaid = { what: 'full', time };
      return;
    }
    const what = undo(l);
    if (!what) return;
    audio.stopLoop(l.layers.length); // the cancelled recording's notes, or the layer taken off
    loopSaid = { what, time };
  }

  // Your notes play through your gear, or in the shop, through what you're trying.
  function sound() {
    const setup = shop ? trying(shop, gear) : gear;
    if (audio.setInstrument(setup.instrument)) warmLayout();
    for (const id of PEDALS) audio.setPedal(id, setup.on.includes(id));
    // Trying the loop pedal in the shop: the band plays while it's chosen, and stops as you move on.
    if (!!shop?.loop !== shopBand) {
      shopBand = !shopBand;
      if (shopBand) {
        start = audio.now() + 0.1;
        audio.tryBand(start, setBeat());
        ring(shop.loop, 0, ringHeld);
      } else audio.stopBand();
    }
  }

  function startBot() {
    begin(audio.now() + 0.15);
    botMoments = momentsOf(bot(seed, set.beat)); // in time with the beat the set plays
    botNext = 0;
    botFed = 0;
  }

  // The bot's notes: sounds scheduled a moment ahead, and fed to the set as its clock reaches them.
  function feedBot() {
    const ahead = audio.now() + 0.2;
    for (; botNext < botMoments.length && start + botMoments[botNext].t < ahead; botNext++) {
      const m = botMoments[botNext];
      if (m.note) {
        const code = `bot${botNext}`;
        audio.noteOn(code, m.note.pitch, m.note.strength, start + m.t, false);
        audio.noteOff(code, start + m.t + m.note.len);
      }
    }
    for (; botFed < botMoments.length && botMoments[botFed].t <= set.t + DT; botFed++) {
      const m = botMoments[botFed];
      if (m.note) {
        playNote(set, m.note.pitch, m.note.strength, m.t);
        if (set.phase === 'playing') sceneNote(scene, m.note.pitch, set.listen.notes.length - 1, m.t, m.note.strength);
      } else releaseNote(set, m.t);
    }
  }

  // Works out the sounds of every key in the current layout, a few at a time between frames, so a key
  // press never waits for its note's samples.
  let warming = [];
  function warmLayout() {
    const fresh = warming.length === 0;
    warming = layoutPitches(input.keys);
    if (!fresh) return;
    const chunk = () => {
      audio.warm(warming.splice(0, 3), input.keys.strength);
      if (warming.length) setTimeout(chunk, 0);
    };
    setTimeout(chunk, 0);
  }

  // Esc pauses the set and the music, and Esc again plays on. The pause card has the volume and mute.
  const pauseCard = document.getElementById('pause');
  const volume = document.getElementById('volume'), mute = document.getElementById('mute');
  volume.value = String(Math.round(audio.volume * 100));
  volume.addEventListener('input', () => audio.setVolume(Number(volume.value) / 100));
  mute.addEventListener('change', () => {
    if (mute.checked !== audio.muted) audio.toggleMute();
  });
  function pause(on) {
    if (on && screen === 'playing') {
      screen = 'paused';
      input.releaseAll();
      audio.suspend();
      mute.checked = audio.muted;
      pauseCard.hidden = false;
    } else if (!on && screen === 'paused') {
      screen = 'playing';
      pauseCard.hidden = true;
      audio.resume();
    }
  }

  // The sound starts on a key press or a click (browsers only allow it after one), once per page. It's
  // started before the key is read, and it plays no note.
  let soundStarted = false;
  function startSound() {
    audio.start(); // before the once-only guard on purpose: it resumes a context that is still suspended
    if (soundStarted) return;
    soundStarted = true;
    warmLayout();
  }

  // The pages that skip the map open on a title card: any key dismisses it and starts the sound. Esc and
  // a lone modifier don't count as user activation in every browser, so an AudioContext started from
  // one would stay suspended: leave them alone, doing nothing, on the title card. It does what the page
  // starts: with ?studio, the studio; with a bot, the bot's set; with ?place=, the place.
  addEventListener('keydown', (e) => {
    if (screen !== 'title' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (NON_ACTIVATING_KEYS.has(e.key)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    startSound();
    if (bot) startBot();
    else if (tryStudio) openStudio();
    else openMap();
  });

  // The map, before each set: where to busk and what track to play, your last answers already chosen.
  // straightGo: the track's chosen already (the studio's Busk to this, or ?beat=), so Enter on a place
  // goes straight there. intro: the title is over it (the first map of a visit). With ?place= there's
  // no map: straight to the place.
  function openMap({ straightGo = false, intro = false } = {}) {
    audio.stopBand();
    set = null;
    if (fixedPlace) return toPlace();
    atlas = createAtlas({
      place, tracks: trackList(beats), chosen: fixedBeat ? { ready: fixedBeat.id } : beats.chosen,
      straightGo: straightGo || !!fixedBeat, intro,
    });
    canvas.hidden = true;
    screen = 'map';
  }
  // At the place chosen, its scene waits for your first note.
  function toPlace() {
    scene = createScene(pageSeed, { place });
    screen = 'ready';
  }
  // Into the music shop, from the end card or from the map (its fourth stop). Leaving it opens the
  // map again, on the last place you busked at.
  function openShop() {
    set = null;
    shop = createShop(clockOf(setBeat()));
    screen = 'shop';
    sound();
  }
  const beatOf = (key) => (key.ready ? readyBeat(key.ready) : beats.slots[key.slot]) ?? LOFI;
  // What happened on the map (atlas.js): the track you're on plays softly while the tracks are open;
  // going keeps the place and the track for next time and sets off to the place; 'shop' goes into the
  // music shop and 'home' into the studio, neither of which is kept as the place. 'start' (the title
  // cleared) needs nothing more: the sound's started already.
  function atlasDid(what) {
    if (what === 'panel' || what === 'track') audio.previewBand(audio.now() + 0.1, beatOf(trackOf(atlas).key));
    else if (what === 'back') audio.stopBand();
    else if (what === 'go') {
      place = stopOf(atlas); // a place to busk: 'go' never comes from the shop or home
      if (!keepsNothing) savePlace(storage, place);
      if (!fixedBeat) {
        beats.chosen = { ...trackOf(atlas).key };
        keepBeats();
      }
      audio.stopBand();
      atlas = null;
      atlasView.hide();
      canvas.hidden = false;
      toPlace();
    } else if (what === 'shop') {
      audio.stopBand();
      atlas = null;
      atlasView.hide();
      canvas.hidden = false;
      openShop();
    } else if (what === 'home') {
      audio.stopBand();
      atlas = null;
      atlasView.hide();
      canvas.hidden = false;
      openStudio();
    }
  }
  atlasOn.place = (id) => {
    if (screen !== 'map') return;
    startSound();
    atlasDid(clickPlace(atlas, id));
  };
  atlasOn.track = (i) => {
    if (screen !== 'map') return;
    startSound();
    atlasDid(clickTrack(atlas, i));
  };
  atlasOn.title = () => {
    if (screen !== 'map') return;
    startSound();
    atlasDid(clickTitle(atlas));
  };
  addEventListener('keydown', (e) => {
    if (screen !== 'map' || e.metaKey || e.ctrlKey || e.altKey || (e.repeat && !e.code.startsWith('Arrow'))) return;
    if (NON_ACTIVATING_KEYS.has(e.key)) {
      if (atlas.intro) return; // not a user activation: leave the title up, doing nothing
    } else startSound();
    const what = atlasKey(atlas, e.code);
    if (what || e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault(); // no scrolling
    if (what) atlasDid(what);
  });

  const input = createInput(window, {
    now: audio.now,
    gate: (e) => {
      if (screen === 'paused') return e.code === 'Escape' || e.code === 'KeyM';
      if (screen !== 'ready' && screen !== 'playing' && screen !== 'shop') return false;
      if (bot) return e.code === 'Escape' || e.code === 'KeyM';
      return true;
    },
    onNote: (n) => {
      if (screen === 'ready') begin(n.at);
      audio.noteOn(n.code, n.pitch, n.strength, n.at, n.legato);
      if (heardLoop()) note(heardLoop(), n.at - start, n.code, n);
      // A strummed note's `at` is deliberately later than now (the strum gap); only notes that sound
      // at once tell us the true key-to-sound latency.
      if (n.at <= audio.now()) {
        const heard = audio.heardAt(n.at);
        if (heard !== null) latency.measured = heard - n.timeStamp;
      }
      if (set?.phase === 'playing') {
        playNote(set, n.pitch, n.strength, n.at - start);
        sceneNote(scene, n.pitch, set.listen.notes.length - 1, n.at - start, n.strength);
      }
    },
    onRelease: (r) => {
      audio.noteOff(r.code, r.at);
      if (heardLoop()) release(heardLoop(), r.at - start, r.code);
      if (set) releaseNote(set, r.at - start);
    },
    onControl: (action, down) => {
      if (action === 'ring') {
        audio.setRing(down);
        ringHeld = down;
        if (heardLoop()) ring(heardLoop(), audio.now() - start, down);
      } else if (action === 'loop' || action === 'undo') loopKey(action);
      else if (action === 'mute') {
        audio.toggleMute();
        mute.checked = audio.muted;
      } else if (action === 'pause') {
        if (screen === 'shop') leaveShop();
        else pause(screen !== 'paused');
      } else warmLayout(); // octave, strength or scale lock changed
    },
    onPedal: (id) => {
      const on = stomp(gear, id);
      if (on === null) return; // not yours yet: its key does nothing
      keep();
      if (on && set?.phase === 'playing') setPedals.add(id);
      stomped = { id, on, time: pageTime() };
      sound();
    },
  });
  sound();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pause(true);
      if (screen === 'studio') {
        letGoStudio();
        keepBeats(); // the frame loop stops while the page is hidden, so it wouldn't keep them
      }
    }
  });
  addEventListener('blur', () => {
    if (screen === 'studio') letGoStudio();
  });

  function handle(events) {
    for (const e of events) {
      if (e.type === 'layers') for (const { id } of LAYERS) audio.setLayer(id, e.layers[id], start + e.bar * set.clock.bar);
      else if (e.type === 'coin') audio.coin(start + set.t + FLIGHT);
      else if (e.type === 'end') {
        audio.endBand(start + set.t);
        // Stepped to the set's own end time first: a take finishing exactly then still becomes a
        // layer (and counts, as the frame loop's own step would have counted it); only a take not
        // finished by then is dropped, its would-be layer's notes cut off. The loop's layers (kept
        // or not) fade out with the band either way.
        if (loop.take) {
          if (step(loop, set.t) === 'layer') {
            setLayers++;
            loopSaid = { what: 'layer', layer: loop.layers.length, time: pageTime() };
          } else {
            undo(loop);
            audio.stopLoop(loop.layers.length);
          }
        }
        const crowd = crowdSize(set.crowd);
        if (crowd > 0) audio.clap(crowd, start + set.t + set.clock.bar * 0.5);
      } else if (e.type === 'over') showEnd();
    }
    sceneEvents(scene, events, set.t);
  }

  function showEnd() {
    screen = 'over';
    const s = summary(set);
    // Savings are Nathan's own: a bot set (?bot=…) touches neither them nor his gear.
    if (!bot) {
      earn(gear, s.coins);
      keep();
    }
    // The log is Nathan's own too, and also skips a ?coins page: see `logging` above.
    if (logging) {
      const pedals = PEDALS.filter((id) => setPedals.has(id));
      logSet(storage, { date: new Date().toISOString(), coins: s.coins, stopped: s.stopped, instrument: gear.instrument, pedals, layers: setLayers, beat: set.beat.name, place: set.place });
    }
    loop = createLoop(); // the loop belongs to the set, and it's over
    document.getElementById('end-coins').textContent = `${s.coins} coin${s.coins === 1 ? '' : 's'} in the case ${PLACE_WORDS[set.place].at}.`;
    document.getElementById('end-saved').textContent = `Saved: ${gear.savings} coin${gear.savings === 1 ? '' : 's'}.`;
    document.getElementById('end-saved').hidden = !!bot;
    document.getElementById('shop').hidden = !!bot;
    document.getElementById('studio').hidden = !!bot;
    document.getElementById('end-stopped').textContent = `${s.stopped} ${s.stopped === 1 ? 'person' : 'people'} stopped to listen.`;
    document.getElementById('end-longest').textContent = s.longest
      ? `${personName(s.longest.kind, art.data.looks[s.longest.kind][s.longest.look])} stayed longest: ${Math.round(s.longest.seconds)} seconds.`
      : 'Nobody stayed this time.';
    document.getElementById('end-debug').hidden = !debug;
    document.getElementById('bots-result').textContent = '';
    if (debug) showLog();
    end.hidden = false;
    document.getElementById('again').focus();
  }

  // The test log, newest first: the sets, and what was bought.
  function showLog() {
    const sets = readLog(storage).map((e) => ({
      date: e.date,
      text: `${e.coins} coins, ${e.stopped} stopped, ${[e.instrument ?? 'acoustic', ...(e.pedals ?? [])].join(' + ')}, `
        + `${e.layers ? `${e.layers} loop layer${e.layers === 1 ? '' : 's'}, ` : ''}${e.beat ? `${e.beat}, ` : ''}${e.place ? `${e.place}, ` : ''}${e.choice ?? 'no choice yet'}`,
    }));
    const buys = readBuys(storage).map((e) => ({ date: e.date, text: `bought the ${stockItem(e.id)?.name.toLowerCase() ?? e.id} for ${e.price}` }));
    document.getElementById('log').replaceChildren(...[...sets, ...buys].sort((a, b) => b.date.localeCompare(a.date)).map((e) => {
      const li = document.createElement('li');
      li.textContent = `${e.date.slice(0, 16).replace('T', ' ')}: ${e.text}`;
      return li;
    }));
  }

  document.getElementById('again').addEventListener('click', () => {
    if (logging) logChoice(storage, 'another');
    end.hidden = true;
    audio.stopBand();
    if (bot) startBot();
    else openMap();
  });
  document.getElementById('stop').addEventListener('click', () => {
    if (logging) logChoice(storage, 'stop');
    end.hidden = true;
    audio.stopBand();
    screen = 'thanks';
    document.getElementById('thanks').hidden = false;
  });
  document.getElementById('shop').addEventListener('click', () => {
    if (logging) logChoice(storage, 'shop');
    end.hidden = true;
    audio.stopBand();
    openShop();
  });

  // The studio, free to everyone: its beat plays round and round, every part at once, while you make
  // it. You reach it from the end card's Studio button, or from Home on the map. Esc leaves for the
  // map, ready for the next set, and so does Busk to this, once it has kept your choice (the map then
  // only asks where).
  document.getElementById('studio').addEventListener('click', () => {
    if (logging) logChoice(storage, 'studio');
    openStudio();
  });
  // Into the studio: from the end card's Studio button, from Home on the map, or with ?studio, from
  // the title card.
  function openStudio() {
    letGoStudio();
    end.hidden = true;
    audio.stopBand();
    set = null;
    studio = createStudio(beats);
    studioSeen = studio.version;
    const at = audio.now() + 0.1;
    audio.startBand(at, studio.beat);
    audio.editBand(); // so what you paint over can be cut off (until the band next starts)
    for (const { id } of LAYERS) audio.setLayer(id, true, at);
    screen = 'studio';
  }
  // A keyup or mouseup the page never gets (the window lost the keys, or we left the studio) would
  // leave a hold writing, or Erase wiping, as the playhead passes.
  function letGoStudio() {
    if (studio) {
      letGo(studio);
      setErase(studio, false);
    }
    studioHeld.key = null;
    studioDrag.what = null;
  }
  function leaveStudio(busked = false) {
    keepBeats();
    letGoStudio();
    studio = null;
    canvas.style.cursor = '';
    openMap({ straightGo: busked });
  }
  const bandTime = () => audio.now() - audio.bandStart;
  // The browser's own uses of the studio's keys are kept off: Cmd+S would save the page, and while
  // you name a beat, Space would scroll, Enter press a button, and ' or / open Firefox's quick find.
  addEventListener('keydown', (e) => {
    if (screen !== 'studio') return;
    const cmd = e.metaKey || e.ctrlKey;
    if (e.code === 'Tab' || e.code === 'Backspace' || e.code.startsWith('Arrow') || (cmd && (e.code === 'KeyZ' || e.code === 'KeyS')) || (studio.naming && !cmd)) {
      e.preventDefault();
    }
    const what = keyDown(studio, studioHeld, e, bandTime());
    if (what === 'leave') leaveStudio();
  });
  addEventListener('keyup', (e) => {
    if (screen === 'studio') keyUp(studio, studioHeld, e);
  });
  // Where the mouse is, in scene pixels.
  const scenePoint = (e) => {
    const r = canvas.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  };
  canvas.addEventListener('mousedown', (e) => {
    if (screen !== 'studio' || e.button !== 0) return;
    e.preventDefault();
    if (mouseDown(studio, studioDrag, ...scenePoint(e), bandTime(), pageTime()) === 'busk') leaveStudio(true); // it keeps your beats
  });
  addEventListener('mousemove', (e) => {
    if (screen !== 'studio') return;
    const [x, y] = scenePoint(e);
    if (studioDrag.what) mouseMove(studio, studioDrag, x, y);
    else canvas.style.cursor = studioHit(studio, x, y) ? 'pointer' : '';
  });
  addEventListener('mouseup', () => {
    if (screen === 'studio') mouseUp(studio, studioDrag);
  });
  // A Ctrl+click on a Mac opens the context menu, and its mouseup may never come: the menu is kept
  // off the studio, and everything held lets go, so no arrow's hold or drag is left running.
  canvas.addEventListener('contextmenu', (e) => {
    if (screen !== 'studio') return;
    e.preventDefault();
    letGoStudio();
  });
  canvas.addEventListener('wheel', (e) => {
    if (screen !== 'studio') return;
    e.preventDefault();
    scroll(studio, ...scenePoint(e), e.deltaY, pageTime(), studioWheel);
  }, { passive: false });

  // The shop: the arrow keys choose, Enter buys (or plays an instrument you own), Esc or the door
  // leaves for the map, ready for the next set.
  function leaveShop() {
    shop = null;
    canvas.style.cursor = '';
    sound();
    openMap();
  }
  function shopDo(what) {
    if (what === 'left' || what === 'right') move(shop, what === 'left' ? -1 : 1);
    else if (what === 'enter') {
      const act = action(shop, gear);
      if (act?.act === 'buy' && buy(gear, act.id)) {
        if (!keepsNothing) logBuy(storage, { date: new Date().toISOString(), id: act.id, price: stockItem(act.id).price });
        shop.soldAt = pageTime();
        audio.coin();
      } else if (act?.act === 'play') play(gear, act.id);
      keep();
    }
    sound();
  }
  addEventListener('keydown', (e) => {
    if (screen !== 'shop' || e.metaKey || e.ctrlKey || e.altKey) return;
    const what = shopKey(e.code, e.repeat);
    if (what === undefined) return;
    e.preventDefault();
    if (what) shopDo(what);
  });
  // A click in the shop, in scene pixels: an item chooses it, the card's button presses Enter, and the
  // door leaves.
  const inShop = (e) => {
    const r = canvas.getBoundingClientRect();
    return screen === 'shop' ? hit(art.data.shop, shop, gear, ((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H) : null;
  };
  canvas.addEventListener('click', (e) => {
    const target = inShop(e);
    if (target?.hit === 'item') {
      choose(shop, target.at);
      sound();
    } else if (target?.hit === 'button') shopDo('enter');
    else if (target?.hit === 'door') leaveShop();
  });
  canvas.addEventListener('mousemove', (e) => {
    canvas.style.cursor = inShop(e) ? 'pointer' : '';
  });

  document.getElementById('bots').addEventListener('click', () => {
    // On the beat your set played, so the bots and you are compared on the same beat.
    const r = runSet(seed, randomBot(seed, set.beat), set.beat, set.place).coins, l = runSet(seed, lickBot(seed, set.beat), set.beat, set.place).coins;
    document.getElementById('bots-result').textContent = `Random bot: ${r}. Lick bot: ${l}. You: ${set.coins}.`;
  });

  if (anyDebug) {
    window.__openCase = {
      get screen() { return screen; },
      get set() { return set; },
      get scene() { return scene; },
      get shop() { return shop; },
      get studio() { return studio; },
      get atlas() { return atlas; },
      get place() { return place; },
      beats,
      get loop() { return heardLoop(); },
      audio, input, latency, art, flocks, gear,
    };
  }

  let lastTime = 0; // the page's clock at the last frame, for the map's glide
  const frame = (now) => {
    try {
      const time = (now - t0) / 1000, dt = Math.max(0, time - lastTime);
      lastTime = time;
      if (set && screen === 'playing') {
        if (bot) feedBot();
        const target = audio.now() - start;
        for (let n = 0; n < 30 && set.t + DT <= target && set.phase !== 'over'; n++) {
          stepSet(set, DT);
          handle(set.events);
          if (bot) feedBot();
        }
        stepScene(scene, set.t);
      }
      // The studio: a tempo or swing arrow held down steps on (on the page's clock, as the mouse and
      // the scroll wheel are timed); a held pad writes as the playhead reaches it, and on 16ths the
      // band had already scheduled, what it had there is cut and what's written played; each change of
      // the beat goes to the band, and is kept once you let go. A change goes to the band before the
      // hold reads the band's time too, so after a new tempo it reads it on the band's new clock (and
      // again after, for what the hold wrote).
      if (studio) {
        tick(studio, studioDrag, pageTime());
        const toBand = () => {
          if (studio.version === studioSeen) return;
          audio.setBeat(studio.beat);
          studioSeen = studio.version;
          studioSaved = false;
        };
        toBand();
        for (const w of advance(studio, bandTime())) audio.playWritten(w);
        toBand();
        if (!studioSaved && !studio.held) {
          keepBeats();
          studioSaved = true;
        }
      }
      // The loop: a recording moves on (and in a set, a finished one counts for the log, and says so
      // over the strip), and the notes due soon are scheduled with the band's; in the park, each rises
      // from the loop pedal.
      const l = heardLoop();
      if (l && step(l, audio.now() - start) === 'layer') {
        if (!shop) setLayers++;
        loopSaid = { what: 'layer', layer: l.layers.length, time: pageTime() };
      }
      const played = audio.update((from, to) => (l ? due(l, from, to) : []));
      if (set) for (const n of played) sceneLoopNote(scene, n.pitch, n.at - start);
      latency.reported = audio.reportedLatency();
      if (screen === 'map') {
        atlasView.show(atlas, { time, dt, still: reducedMotion.matches });
        requestAnimationFrame(frame);
        return;
      }
      draw({
        screen: screen === 'thanks' || screen === 'over' ? 'playing' : screen,
        set, scene, keys: input.keys, t: set ? set.t : studio ? bandTime() : shop?.loop ? audio.now() - start : 0,
        bars: set ? set.t / (endTime(set) / PARK.bars) : skyBar, studio,
        time: (now - t0) / 1000, still: reducedMotion.matches, flocks, gear, stomp: stomped, shop,
        loop: shop ? shop.loop : set ? loop : null, loopSaid,
        busking: setBeat().name, teach: !taught,
        debug: debug ? latency : null,
      });
      out.drawImage(off, 0, 0, canvas.width, canvas.height);
    } catch (err) {
      console.error(err);
      document.getElementById('message').hidden = false;
      return;
    }
    requestAnimationFrame(frame);
  };
  if (screen === 'map') openMap({ intro: true }); // the game opens on the map, under the title
  requestAnimationFrame(frame);
}
