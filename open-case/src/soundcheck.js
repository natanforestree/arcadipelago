// The sound check (/open-case/?sound): the loop with a switch per layer, and your instrument on the
// keys, so the sounds and the beat can be judged by ear before anything else. Every instrument and
// pedal in the shop can be tried here, without buying it (keys 2 to 6 stomp the pedals too). No
// crowd, no set: the loop plays until you leave.
import { createInput } from './input.js';
import { layoutPitches } from './keys.js';
import { STOCK } from './gear.js';

// Browsers don't treat these as user activation (Chrome doesn't for a lone modifier, no browser does
// for Esc), so starting an AudioContext from one leaves it suspended.
const NON_ACTIVATING_KEYS = new Set(['Escape', 'Shift', 'Control', 'Alt', 'Meta', 'CapsLock']);

export function soundCheck(audio, { debug }) {
  const panel = document.getElementById('sound');
  const latency = document.getElementById('latency');
  panel.hidden = false;
  document.getElementById('game').hidden = true;
  const boxes = [...panel.querySelectorAll('input[data-layer]')];
  let started = false, measured = null;

  const begin = () => {
    if (started) return;
    started = true;
    audio.start();
    warm();
    audio.startBand(audio.now() + 0.1);
    for (const box of boxes) audio.setLayer(box.dataset.layer, box.checked);
    document.getElementById('sound-start').hidden = true;
  };
  for (const box of boxes) box.addEventListener('change', () => started && audio.setLayer(box.dataset.layer, box.checked));
  // The shop's instruments and pedals, from its stock.
  const choice = document.getElementById('sound-instrument'), pedals = document.getElementById('sound-pedals');
  const warm = () => audio.warm(layoutPitches(input.keys), input.keys.strength);
  for (const item of STOCK) {
    if (item.kind === 'instrument') choice.add(new Option(item.name, item.id));
    else {
      const label = document.createElement('label'), box = document.createElement('input');
      box.type = 'checkbox';
      box.dataset.pedal = item.id;
      box.addEventListener('change', () => audio.setPedal(item.id, box.checked));
      label.append(box, ` ${item.name} (${item.key})`);
      pedals.append(label);
    }
  }
  choice.addEventListener('change', () => {
    if (audio.setInstrument(choice.value)) warm();
    choice.blur(); // so the arrow keys and letters play, not change the choice
  });
  panel.addEventListener('click', begin);
  // Any key starts the sound; that key plays no note.
  addEventListener('keydown', (e) => {
    if (started || e.metaKey || e.ctrlKey || e.altKey) return;
    if (NON_ACTIVATING_KEYS.has(e.key)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    begin();
  });

  const input = createInput(window, {
    now: audio.now,
    onNote: (n) => {
      audio.noteOn(n.code, n.pitch, n.strength, n.at, n.legato);
      // A strummed note's `at` is deliberately later than now (the strum gap); only notes that sound
      // at once tell us the true key-to-sound latency.
      if (n.at <= audio.now()) {
        const heard = audio.heardAt(n.at);
        if (heard !== null) measured = heard - n.timeStamp;
      }
    },
    onRelease: (r) => audio.noteOff(r.code, r.at),
    onControl: (action, down) => {
      if (action === 'ring') audio.setRing(down);
      else if (action === 'mute') audio.toggleMute();
      else if (action !== 'pause') warm();
    },
    onPedal: (id) => {
      const box = pedals.querySelector(`[data-pedal="${id}"]`);
      box.checked = !box.checked;
      audio.setPedal(id, box.checked);
    },
  });
  if (debug) window.__openCase = { audio, input, get measured() { return measured; } };

  const frame = () => {
    audio.update();
    const reported = audio.reportedLatency();
    latency.textContent = `Octave ${input.keys.octave}, pick ${input.keys.strength} of 4${input.keys.lock ? ', scale lock on' : ''}. `
      + `Browser's reported audio delay: ${reported == null ? 'not reported' : `${reported.toFixed(0)} ms`}. `
      + `Last key to sound: ${measured == null ? 'play a note' : `${measured.toFixed(0)} ms`}.`;
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
