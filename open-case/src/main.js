// Start-up, the loop, and the wiring between the keys, the sound, the set and the screen.
//
// The audio clock is the master. Your first note starts the set (and the band) at that note's audio
// time; each frame, the set steps at a fixed 60 Hz up to the audio clock's time since then. Paused,
// the audio is suspended, so the set's clock stops with it. Notes reach the set the moment they're
// played, timed in seconds since the first note.
//
// URL options: ?sound (the sound check); ?debug (interest bars, the corner panel, and Run the bots on
// the end card); ?seed=N (fixes the passers-by, and the park's windows, train and birds); ?bot=random or
// ?bot=lick (the bot plays the set, audibly); ?sky=N (the park as it is N bars into a set, until a set
// starts). With any of them, window.__openCase exposes the game for browser checks.
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { layoutPitches } from './keys.js';
import { createSet, stepSet, playNote, releaseNote, summary, runSet, momentsOf } from './set.js';
import { crowdSize } from './crowd.js';
import { createScene, createFlocks, sceneNote, sceneEvents, stepScene, FLIGHT } from './scene.js';
import { createRenderer, W, H } from './render.js';
import { randomBot, lickBot } from './bots.js';
import { safeStorage } from './storage.js';
import { readLog, logSet, logChoice } from './log.js';
import { soundCheck } from './soundcheck.js';
import { loadArt } from './assets.js';
import { BAR } from './groove.js';
import { DT, LAYERS } from './tuning.js';

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
const anyDebug = debug || !!bot || fixedSeed !== null || params.has('sound') || params.has('sky');

const storage = safeStorage();
const audio = createAudio(storage);
const touchOnly = matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches;

if (touchOnly) document.getElementById('phone').hidden = false;
else if (params.has('sound')) soundCheck(audio, { debug: anyDebug });
else {
  // The art loads before the title card shows; if it can't, say something went wrong.
  loadArt().then(game, (err) => {
    console.error(err);
    document.getElementById('message').hidden = false;
  });
}

function game(art) {
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

  let screen = 'title'; // 'ready' (waiting for your first note), 'playing', 'paused', 'over', 'thanks'
  let set = null, scene = createScene(pageSeed), start = 0, seed = 0;
  let botMoments = null, botNext = 0, botFed = 0;
  const latency = { reported: null, measured: null };

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

  // A new set begins with a note at audio time `at` (your first note, or the bot's start).
  function begin(at) {
    seed = fixedSeed ?? Date.now() % 2147483647;
    set = createSet(seed);
    scene = createScene(seed);
    start = at;
    audio.startBand(at);
    for (const { id, min } of LAYERS) audio.setLayer(id, min === 0, at);
    screen = 'playing';
  }

  function startBot() {
    begin(audio.now() + 0.15);
    botMoments = momentsOf(bot(seed));
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

  // Any key at all dismisses the title card and starts the sound (browsers only allow sound after a
  // key press or a click). It's heard before the keys are read, and it plays no note. Esc and a lone
  // modifier don't count as user activation in every browser, so an AudioContext started from one
  // would stay suspended: leave them alone, doing nothing, on the title card.
  addEventListener('keydown', (e) => {
    if (screen !== 'title' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (NON_ACTIVATING_KEYS.has(e.key)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    audio.start();
    warmLayout();
    if (bot) startBot();
    else screen = 'ready';
  });

  const input = createInput(window, {
    now: audio.now,
    gate: (e) => {
      if (screen === 'paused') return e.code === 'Escape' || e.code === 'KeyM';
      if (screen !== 'ready' && screen !== 'playing') return false;
      if (bot) return e.code === 'Escape' || e.code === 'KeyM';
      return true;
    },
    onNote: (n) => {
      if (screen === 'ready') begin(n.at);
      audio.noteOn(n.code, n.pitch, n.strength, n.at, n.legato);
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
      if (set) releaseNote(set, r.at - start);
    },
    onControl: (action, down) => {
      if (action === 'ring') audio.setRing(down);
      else if (action === 'mute') {
        audio.toggleMute();
        mute.checked = audio.muted;
      } else if (action === 'pause') pause(screen !== 'paused');
      else warmLayout(); // octave, strength or scale lock changed
    },
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause(true);
  });

  function handle(events) {
    for (const e of events) {
      if (e.type === 'layers') for (const { id } of LAYERS) audio.setLayer(id, e.layers[id], start + e.bar * BAR);
      else if (e.type === 'coin') audio.coin(start + set.t + FLIGHT);
      else if (e.type === 'end') {
        audio.endBand(start + set.t);
        const crowd = crowdSize(set.crowd);
        if (crowd > 0) audio.clap(crowd, start + set.t + BAR * 0.5);
      } else if (e.type === 'over') showEnd();
    }
    sceneEvents(scene, events, set.t);
  }

  function showEnd() {
    screen = 'over';
    const s = summary(set);
    // The log is Nathan's own sets and choices, so a bot set (?bot=…) never touches it.
    if (!bot) logSet(storage, { date: new Date().toISOString(), coins: s.coins, stopped: s.stopped });
    document.getElementById('end-coins').textContent = `${s.coins} coin${s.coins === 1 ? '' : 's'} in the case.`;
    document.getElementById('end-stopped').textContent = `${s.stopped} ${s.stopped === 1 ? 'person' : 'people'} stopped to listen.`;
    const names = { jogger: 'A jogger', oldman: 'An old man', student: 'A student', commuter: 'A commuter' };
    document.getElementById('end-longest').textContent = s.longest
      ? `${names[s.longest.kind]} stayed longest: ${Math.round(s.longest.seconds)} seconds.`
      : 'Nobody stayed this time.';
    document.getElementById('end-debug').hidden = !debug;
    document.getElementById('bots-result').textContent = '';
    if (debug) showLog();
    end.hidden = false;
    document.getElementById('again').focus();
  }

  function showLog() {
    const list = document.getElementById('log');
    list.replaceChildren(...readLog(storage).slice().reverse().map((e) => {
      const li = document.createElement('li');
      li.textContent = `${e.date.slice(0, 16).replace('T', ' ')}: ${e.coins} coins, ${e.stopped} stopped, ${e.choice ?? 'no choice yet'}`;
      return li;
    }));
  }

  document.getElementById('again').addEventListener('click', () => {
    if (!bot) logChoice(storage, 'another');
    end.hidden = true;
    audio.stopBand();
    set = null;
    scene = createScene(pageSeed);
    if (bot) startBot();
    else screen = 'ready';
  });
  document.getElementById('stop').addEventListener('click', () => {
    if (!bot) logChoice(storage, 'stop');
    end.hidden = true;
    audio.stopBand();
    screen = 'thanks';
    document.getElementById('thanks').hidden = false;
  });
  document.getElementById('bots').addEventListener('click', () => {
    const r = runSet(seed, randomBot(seed)).coins, l = runSet(seed, lickBot(seed)).coins;
    document.getElementById('bots-result').textContent = `Random bot: ${r}. Lick bot: ${l}. You: ${set.coins}.`;
  });

  if (anyDebug) {
    window.__openCase = {
      get screen() { return screen; },
      get set() { return set; },
      get scene() { return scene; },
      audio, input, latency, art, flocks,
    };
  }

  const t0 = performance.now();
  const frame = (now) => {
    try {
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
      audio.update();
      latency.reported = audio.reportedLatency();
      draw({
        screen: screen === 'thanks' || screen === 'over' ? 'playing' : screen,
        set, scene, keys: input.keys, t: set ? set.t : 0, bars: set ? set.t / BAR : skyBar,
        time: (now - t0) / 1000, still: reducedMotion.matches, flocks, debug: debug ? latency : null,
      });
      out.drawImage(off, 0, 0, canvas.width, canvas.height);
    } catch (err) {
      console.error(err);
      document.getElementById('message').hidden = false;
      return;
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
