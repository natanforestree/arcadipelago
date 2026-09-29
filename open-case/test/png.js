// Reads a PNG's pixels in Node, for the art tests: 8-bit RGBA or RGB, not interlaced (what Aseprite
// writes). Returns { w, h, data } with 4 bytes (r, g, b, a) per pixel.
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

export function readPng(file) {
  const b = readFileSync(file);
  if (b.toString('ascii', 1, 4) !== 'PNG') throw new Error(`${file} isn't a PNG`);
  let at = 8, w = 0, h = 0, channels = 0;
  const idat = [];
  while (at < b.length) {
    const len = b.readUInt32BE(at), type = b.toString('ascii', at + 4, at + 8), body = b.subarray(at + 8, at + 8 + len);
    if (type === 'IHDR') {
      w = body.readUInt32BE(0);
      h = body.readUInt32BE(4);
      const depth = body[8], colour = body[9], interlace = body[12];
      if (depth !== 8 || interlace !== 0 || (colour !== 6 && colour !== 2)) throw new Error(`${file}: an 8-bit RGB(A) PNG, not interlaced, please`);
      channels = colour === 6 ? 4 : 3;
    } else if (type === 'IDAT') idat.push(body);
    at += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * channels, out = Buffer.alloc(w * h * 4), line = Buffer.alloc(stride), prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) {
      const left = i >= channels ? line[i - channels] : 0, up = prev[i], ul = i >= channels ? prev[i - channels] : 0;
      let v = src[i];
      if (filter === 1) v += left;
      else if (filter === 2) v += up;
      else if (filter === 3) v += (left + up) >> 1;
      else if (filter === 4) {
        const p = left + up - ul, pa = Math.abs(p - left), pb = Math.abs(p - up), pc = Math.abs(p - ul);
        v += pa <= pb && pa <= pc ? left : pb <= pc ? up : ul;
      }
      line[i] = v & 255;
    }
    for (let x = 0; x < w; x++) {
      for (let k = 0; k < 3; k++) out[(y * w + x) * 4 + k] = line[x * channels + k];
      out[(y * w + x) * 4 + 3] = channels === 4 ? line[x * channels + 3] : 255;
    }
    line.copy(prev);
  }
  return { w, h, data: out };
}
