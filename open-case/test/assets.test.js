import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadArt, loadJson } from '../src/assets.js';

test('the art loads from open-case/assets/: the frame data and the sheet beside it', async () => {
  const asked = [];
  const art = await loadArt(undefined, {
    json: async (url) => (asked.push(String(url)), { frames: { ground: [0, 0, 1, 1, 0, 0] }, sky: [] }),
    image: async (url) => (asked.push(String(url)), { image: true }),
  });
  assert.ok(asked.some((u) => u.endsWith('/open-case/assets/sprites.json')), asked.join(' '));
  assert.ok(asked.some((u) => u.endsWith('/open-case/assets/sprites.png')), asked.join(' '));
  assert.deepEqual(art.frames, { ground: [0, 0, 1, 1, 0, 0] });
  assert.deepEqual(art.sheet, { image: true });
  assert.deepEqual(art.data.sky, []);
});

test("art that can't load is an error, so the page can say something went wrong", async () => {
  const image = async () => ({});
  await assert.rejects(loadArt(undefined, { json: async () => { throw new Error('offline'); }, image }), /offline/);
  await assert.rejects(loadArt(undefined, { json: async () => ({ frames: {} }), image: async () => { throw new Error("couldn't load"); } }), /couldn't load/);
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 404 });
  try {
    await assert.rejects(loadJson('https://example.test/sprites.json'), /404/);
  } finally {
    globalThis.fetch = realFetch;
  }
});
