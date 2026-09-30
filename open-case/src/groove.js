// The lo-fi's timing, for the parts of the game that still count in its 16ths, beats and bars (every
// set plays the lo-fi for now), and whether a note is in the key and on the beat. The beats themselves,
// the lo-fi among them, are in beats.js.
import { LOFI_CLOCK } from './beats.js';

export { inKey, isStrong, isOff16th } from './beats.js';
export const { beat: BEAT, bar: BAR, timeOf16th, sixteenthAt } = LOFI_CLOCK;
