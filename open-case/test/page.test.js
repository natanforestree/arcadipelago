import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const html = readFileSync(new URL('index.html', root), 'utf8');
const scripts = readdirSync(new URL('src/', root)).map((f) => readFileSync(new URL(`src/${f}`, root), 'utf8')).join('\n');

test('every element the scripts look up by id is on the page', () => {
  const ids = [...scripts.matchAll(/getElementById\('([^']+)'\)/g)].map((m) => m[1]);
  assert.ok(ids.length >= 5, 'the scripts do look elements up');
  for (const id of new Set(ids)) assert.match(html, new RegExp(`id="${id}"`), id);
});

test('the sound check has a switch for every layer', () => {
  for (const id of ['keys', 'drums', 'bass', 'top']) assert.match(html, new RegExp(`data-layer="${id}"`));
});

test('the page loads the game as a module, with its icon and the Silkscreen font', () => {
  assert.match(html, /<script type="module" src="\.\/src\/main\.js"><\/script>/);
  assert.match(html, /<link rel="icon" href="icon\.png">/);
  assert.match(html, /family=Silkscreen/);
});

test('the sound check has a choice of beats', () => {
  assert.match(html, /<label>Beat <select id="sound-beat"><\/select><\/label>/);
});

test('the end card has a Studio button, hidden until the studio is yours', () => {
  assert.match(html, /<button id="studio" type="button" hidden>Studio<\/button>/);
});
