// Loads the sprite sheet that art/open-case/sprites.lua writes to open-case/assets/: the image, and
// the frame and layout data beside it (sprites.lua describes its fields). The loaders can be swapped,
// so Node tests can load without a browser.
export async function loadJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.json();
}

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`couldn't load ${url}`));
    img.src = url;
  });
}

// { sheet: the image, frames: { name: [x, y, w, h, ax, ay] }, data: all of sprites.json }
export async function loadArt(base = new URL('../assets/', import.meta.url), { json = loadJson, image = loadImage } = {}) {
  const [data, sheet] = await Promise.all([json(new URL('sprites.json', base)), image(new URL('sprites.png', base))]);
  return { sheet, frames: data.frames, data };
}
