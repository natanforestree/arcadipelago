// The keepsakes the animals of One Tree Island leave in your case: twenty-two, an ordinary one and then
// a special one from each animal (animals.js). At the end of a set on the island, one may come
// (keepsakeFor): your first set there always leaves one, and after that it's a chance that rises with
// how fond the animals grew of you. Which you've found, in the order found, and which are in your
// case (it holds three), are kept for good in storage. Pure, so it's tested in Node; set.js asks for
// the keepsake, main.js keeps them, and room.js shows them on your shelf.
import { ANIMALS, ANIMALS_OF, LIKES } from './animals.js';
import { KEEPSAKE } from './tuning.js';

// Each: { id, animal, special (false for the ordinary one, which comes first), name, a (what the end
// card says the animal left you), line (the shelf's words about it) }. In the order of the animals,
// each animal's ordinary one first: the shelf's columns and rows.
export const KEEPSAKES = [
  { id: 'dandelion', animal: 'bunny', special: false, name: 'Dandelion clock', a: 'a dandelion clock', line: 'make a wish, then blow' },
  { id: 'clover', animal: 'bunny', special: true, name: 'Four-leaf clover', a: 'a four-leaf clover', line: 'the bunny looked all spring for it' },
  { id: 'feather', animal: 'ducks', special: false, name: 'White feather', a: 'a white feather', line: "from the mother duck's best wing" },
  { id: 'rubberduck', animal: 'ducks', special: true, name: 'Rubber duck', a: 'a rubber duck', line: "the ducklings think it's family" },
  { id: 'acorn', animal: 'squirrel', special: false, name: 'Acorn', a: 'an acorn', line: 'the squirrel had one spare. just one.' },
  { id: 'goldacorn', animal: 'squirrel', special: true, name: 'Golden acorn', a: 'a golden acorn', line: "the squirrel's whole savings" },
  { id: 'pebble', animal: 'heron', special: false, name: 'Smooth pebble', a: 'a smooth pebble', line: 'the heron chose the smoothest one' },
  { id: 'fishbones', animal: 'heron', special: true, name: 'Fish skeleton', a: 'a fish skeleton', line: 'the heron ate the rest' },
  { id: 'snailshell', animal: 'turtle', special: false, name: 'Snail shell', a: 'a snail shell', line: 'nobody lives in it any more' },
  { id: 'teacup', animal: 'turtle', special: true, name: 'Tiny teacup', a: 'a tiny teacup', line: 'the turtle takes its tea slowly' },
  { id: 'wildflower', animal: 'deer', special: false, name: 'Wildflower', a: 'a wildflower', line: "the deer didn't eat this one" },
  { id: 'bell', animal: 'deer', special: true, name: 'Little bell', a: 'a little bell', line: "it rings when nobody's looking" },
  { id: 'blackberry', animal: 'fox', special: false, name: 'Blackberry', a: 'a blackberry', line: 'the fox ate all the others' },
  { id: 'sock', animal: 'fox', special: true, name: 'Odd sock', a: 'an odd sock', line: "the fox won't say whose it was" },
  { id: 'lily', animal: 'frog', special: false, name: 'Water lily', a: 'a water lily', line: 'the frog has plenty of pads' },
  { id: 'crown', animal: 'frog', special: true, name: 'Tiny crown', a: 'a tiny crown', line: 'the frog was a prince once, maybe' },
  { id: 'leaf', animal: 'hedgehog', special: false, name: 'Crunchy leaf', a: 'a crunchy leaf', line: "the hedgehog's crunchiest" },
  { id: 'apple', animal: 'hedgehog', special: true, name: 'Tiny apple', a: 'a tiny apple', line: 'the hedgehog brought it on its spines' },
  { id: 'bottlecap', animal: 'crow', special: false, name: 'Bottle cap', a: 'a bottle cap', line: 'the shiniest thing the crow had' },
  { id: 'ring', animal: 'crow', special: true, name: 'Gold ring', a: 'a gold ring', line: "the crow's real treasure" },
  { id: 'owlfeather', animal: 'owl', special: false, name: 'Speckled feather', a: 'a speckled feather', line: 'the owl had one to spare' },
  { id: 'spectacles', animal: 'owl', special: true, name: 'Tiny spectacles', a: 'tiny spectacles', line: 'the owl reads late into the night' },
];

export const keepsake = (id) => KEEPSAKES.find((k) => k.id === id) ?? null;

// The words for a keepsake you haven't found yet, a hint: the animal it's from, and what that animal
// likes. { name, line }, as a found one's.
export function hint(id) {
  const { animal, special } = keepsake(id), { name, kind, plural } = ANIMALS[animal];
  return { name: `Something ${special ? 'special ' : ''}from ${name}`, line: `${name} like${plural ? '' : 's'} ${LIKES[kind]}` };
}

// What an animal gives next, its ordinary keepsake and then its special one: an id, or null once
// you've found both.
export const nextFrom = (animal, found) => KEEPSAKES.find((k) => k.animal === animal && !found.includes(k.id))?.id ?? null;

// The chance a set on the island leaves a keepsake once you've found one: nothing with no fondness,
// rising with it to KEEPSAKE.most at KEEPSAKE.full.
export const chanceOf = (fondness) => KEEPSAKE.most * Math.min(1, Math.max(0, fondness) / KEEPSAKE.full);

// What a set on the island leaves you at its end: a keepsake's id, or null. From the set:
//   found     the ids you'd found before it
//   fondness  its tips, counted as fondness
//   fans      [{ animal, stayed }]: the animals that left happy or were there at the end
//   longest   whoever stayed longest ({ kind, look }, crowd.js), or null; first, whoever came by first
//   roll      a number in [0, 1), from the set's own stream
// Your first keepsake always comes: the ordinary one of the animal that stayed longest, or if none
// settled, of the first that came by. After that, it comes when the roll is under chanceOf(fondness),
// from the fan that stayed longest who still has one to give. Never one you have; nothing once you
// have all 22.
export function keepsakeFor({ found, fondness, fans, longest, first, roll }) {
  if (found.length >= KEEPSAKES.length) return null;
  if (!found.length) {
    const who = longest ?? first;
    return who ? nextFrom(ANIMALS_OF[who.kind][who.look], found) : null;
  }
  if (roll >= chanceOf(fondness)) return null;
  for (const fan of [...fans].sort((a, b) => b.stayed - a.stayed)) {
    const id = nextFrom(fan.animal, found);
    if (id) return id;
  }
  return null;
}

// Yours, kept: { found: [ids, in the order found], inCase: [ids, in the order put in, at most
// KEEPSAKE.caseHolds] }. A keepsake goes in your case only once it's found.
const KEY = 'open-case-keepsakes';

// What's kept (storage: storage.js), leaving out anything unreadable, unknown or twice.
export function loadKeepsakes(storage) {
  let kept = null;
  try {
    kept = JSON.parse(storage.get(KEY) ?? 'null');
  } catch {
    kept = null; // unreadable: start afresh
  }
  const known = (list) => (Array.isArray(list) ? list : []).filter((id, i, all) => keepsake(id) && all.indexOf(id) === i);
  const found = known(kept?.found);
  return { found, inCase: known(kept?.inCase).filter((id) => found.includes(id)).slice(0, KEEPSAKE.caseHolds) };
}

export function saveKeepsakes(storage, keeps) {
  storage.set(KEY, JSON.stringify({ found: keeps.found, inCase: keeps.inCase }));
}

// A keepsake found joins your shelf, and your very first goes into your case by itself.
export function addFound(keeps, id) {
  if (!keepsake(id) || keeps.found.includes(id)) return;
  keeps.found.push(id);
  if (keeps.found.length === 1) keeps.inCase.push(id);
}

// Puts a keepsake you've found in your case, or takes it out if it's in: 'in', 'out', 'full' (your
// case holds three already, and it stays out), or null (you haven't found it).
export function toggleCase(keeps, id) {
  if (!keeps.found.includes(id)) return null;
  const at = keeps.inCase.indexOf(id);
  if (at >= 0) {
    keeps.inCase.splice(at, 1);
    return 'out';
  }
  if (keeps.inCase.length >= KEEPSAKE.caseHolds) return 'full';
  keeps.inCase.push(id);
  return 'in';
}

// ?keepsakes=all or N: the first n keepsakes in the list's order, the first three of them in your case.
export function someKeepsakes(n) {
  const found = KEEPSAKES.slice(0, Math.max(0, n)).map((k) => k.id);
  return { found, inCase: found.slice(0, KEEPSAKE.caseHolds) };
}
