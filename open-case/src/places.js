// The places to busk: the park, the station at rush hour, the night market and One Tree Island, where
// animals listen instead of people and nobody pays. Each has its own crowd (tuning.js PLACES, which
// crowd.js reads) and its own scene (scene.js, render.js). The map (atlas.js) chooses one before each
// set, and the choice is kept for next time.
export const PLACE_IDS = ['park', 'station', 'market', 'island'];

// The map's stops, in its order: the places to busk, then the music shop and your home, which opens
// your room (neither is a place to busk, so they're never kept as the place, and isPlace('shop') and
// isPlace('home') are false).
export const STOPS = [...PLACE_IDS, 'shop', 'home'];

// What the map calls the shop and home, and their lines in place of a crowd.
export const STOP_WORDS = {
  shop: { name: 'The Music Shop', about: 'pedals · instruments' },
  home: { name: 'Home', about: 'your studio · your keepsakes' },
};

// What the map, the prompt and the end card call each place, and the map's line about its crowd.
export const PLACE_WORDS = {
  park: { name: 'The Park', at: 'in the park', crowd: 'A bit of everyone · sunset' },
  station: { name: 'The Station', at: 'at the station', crowd: 'Rush hour · in a hurry, tips well' },
  market: { name: 'The Night Market', at: 'at the night market', crowd: 'Browsers stay long · small coins' },
  island: { name: 'One Tree Island', at: 'on One Tree Island', crowd: 'Just you and the animals · no coins' },
};

const KEY = 'open-case-place';

export const isPlace = (id) => PLACE_IDS.includes(id);

// The place chosen last time (storage: storage.js), or the park if there's none or it isn't one.
export function loadPlace(storage) {
  const id = storage.get(KEY);
  return isPlace(id) ? id : 'park';
}

export function savePlace(storage, id) {
  if (isPlace(id)) storage.set(KEY, id);
}
