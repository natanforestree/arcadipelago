// The animals that come to listen on One Tree Island, in place of people. Each stands for one kind of
// town listener (crowd.js KINDS), likes what that kind likes and has its numbers; the crowd deals an
// arriving kind one of its animals as it deals a person a look. Each crosses the screen in its own way
// and settles, once it's hooked, on a free spot of its own sort (tuning.js ISLAND.spots). Their order
// here is the keepsakes' and the shelf's (keepsakes.js).
//   kind    the town listener it stands for
//   cross   how it comes by: 'land' (it walks or hops along the island), 'water' (it swims or wades
//           out on the lake) or 'sky' (it flies), each along its own line (tuning.js ISLAND.lanes)
//   spots   the sorts of spot it settles on: the first sort with a free spot is the one it takes
//   name    what the end card and the shelf call it; plural for the ducks ("the ducks like")
export const ANIMALS = {
  bunny: { kind: 'jogger', cross: 'land', spots: ['grass'], name: 'the bunny' },
  ducks: { kind: 'jogger', cross: 'water', spots: ['shallows'], name: 'the ducks', plural: true },
  squirrel: { kind: 'jogger', cross: 'land', spots: ['pine'], name: 'the squirrel' },
  heron: { kind: 'elder', cross: 'water', spots: ['shallows'], name: 'the heron' },
  turtle: { kind: 'elder', cross: 'water', spots: ['rock', 'shallows'], name: 'the turtle' },
  deer: { kind: 'elder', cross: 'land', spots: ['grass'], name: 'the deer' },
  fox: { kind: 'student', cross: 'land', spots: ['grass'], name: 'the fox' },
  frog: { kind: 'student', cross: 'water', spots: ['lily'], name: 'the frog' },
  hedgehog: { kind: 'student', cross: 'land', spots: ['grass'], name: 'the hedgehog' },
  crow: { kind: 'commuter', cross: 'sky', spots: ['pine'], name: 'the crow' },
  owl: { kind: 'commuter', cross: 'sky', spots: ['pine'], name: 'the owl' },
};
export const ANIMAL_IDS = Object.keys(ANIMALS);

// Each kind's animals, in the order above: an animal's look (crowd.js) is its place in its kind's list.
export const ANIMALS_OF = {
  jogger: ['bunny', 'ducks', 'squirrel'],
  elder: ['heron', 'turtle', 'deer'],
  student: ['fox', 'frog', 'hedgehog'],
  commuter: ['crow', 'owl'],
};

// What each kind likes, in the shelf's words.
export const LIKES = { jogger: 'busy playing', elder: 'space and long notes', student: 'the groove', commuter: 'a tune brought back' };

// "The heron", to start a sentence.
export const animalName = (id) => ANIMALS[id].name.replace(/^t/, 'T');
