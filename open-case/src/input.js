// Keys to notes. A note key sounds the instant it goes down: onNote is called from inside the key
// event, stamped with the audio clock (now()), so nothing waits for the next update. OS key repeat is
// ignored, a held Cmd, Ctrl or Alt is left to the browser, and losing focus lets go of every key.
//
//   onNote({ code, pitch, strength, legato, at, timeStamp })  at: the audio time to sound it
//   onRelease({ code, at })
//   onControl(action, down)  'ring' (down and up), and on key down: 'octaveDown', 'octaveUp',
//                            'softer', 'louder', 'lock' (only when they change something), 'mute', 'pause'
// gate(event) runs first on every game key going down; returning false swallows the key (the key
// that dismisses the title card plays no note).
//
// Strums: a key pressed within PLAY.strumWindow of the group's first key, while another is held,
// sounds PLAY.strumGap after the one before it. They sound in the order pressed: the first key
// already sounded the instant it went down, so they can't be re-sorted lowest first without delaying
// every note.
import { NOTE_KEYS, CONTROL_KEYS, createKeyState, noteFor, applyControl } from './keys.js';
import { PLAY } from './tuning.js';

export function createInput(target, { now, onNote, onRelease, onControl, gate = () => true }) {
  const keys = createKeyState();
  const held = new Map(); // code -> the pitch it's sounding
  let groupAt = -Infinity, nextAt = -Infinity;

  function down(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const action = CONTROL_KEYS[e.code];
    if (!(e.code in NOTE_KEYS) && !action) return;
    e.preventDefault(); // Space would scroll; ' and / open Firefox's quick find
    if (e.repeat || !gate(e)) return;
    if (action) {
      if (action === 'ring' || action === 'mute' || action === 'pause' || applyControl(keys, action)) onControl(action, true);
      return;
    }
    if (held.has(e.code)) return;
    const pitch = noteFor(e.code, keys);
    if (pitch === null) return; // outside the guitar's range: silent
    const t = now();
    let at = t, legato = false;
    if (held.size > 0 && t - groupAt <= PLAY.strumWindow) at = Math.max(t, nextAt);
    else {
      groupAt = t;
      legato = held.size > 0; // pressed while the last note is still held: a hammer-on
    }
    nextAt = at + PLAY.strumGap;
    held.set(e.code, pitch);
    onNote({ code: e.code, pitch, strength: keys.strength, legato, at, timeStamp: e.timeStamp });
  }

  function up(e) {
    if (e.code === 'Space') onControl('ring', false);
    if (!held.has(e.code)) return;
    held.delete(e.code);
    onRelease({ code: e.code, at: now() });
  }

  function releaseAll() {
    for (const code of [...held.keys()]) up({ code });
    onControl('ring', false);
  }

  target.addEventListener('keydown', down);
  target.addEventListener('keyup', up);
  target.addEventListener('blur', releaseAll);
  return { keys, held, releaseAll };
}
