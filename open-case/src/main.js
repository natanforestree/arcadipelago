// Start-up. This first version only runs the sound check (?sound), so the guitar and the beat can be
// judged by ear while the rest is built. The game itself is wired up here later, with the set and the
// screen.
import { createAudio } from './audio.js';
import { safeStorage } from './storage.js';
import { soundCheck } from './soundcheck.js';

// The module is running, so the page's "couldn't start" message will never be needed.
document.getElementById('nostart')?.remove();

const params = new URLSearchParams(location.search);
const audio = createAudio(safeStorage());
const touchOnly = matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches;

if (touchOnly) document.getElementById('phone').hidden = false;
else if (params.has('sound')) soundCheck(audio, { debug: true });
else {
  const m = document.getElementById('message');
  m.textContent = 'Open Case is being built. The sound check is at ?sound.';
  m.hidden = false;
}
