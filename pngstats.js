#!/usr/bin/env node
// stats PNG: descodifica un PNG 8-bit (RGB/RGBA) y reporta estadísticas de brillo
'use strict';
const fs = require('fs'), zlib = require('zlib');
const buf = fs.readFileSync(process.argv[2]);
let o = 8, w, h, ct;
const chunks = [];
while (o < buf.length) {
  const len = buf.readUInt32BE(o), type = buf.toString('ascii', o + 4, o + 8);
  const data = buf.slice(o + 8, o + 8 + len);
  if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[8]; }
  if (type === 'IDAT') chunks.push(data);
  o += 12 + len;
}
const nch = ct === 6 ? 4 : ct === 2 ? 3 : ct === 0 ? 1 : 2;
const raw = zlib.inflateSync(Buffer.concat(chunks));
const stride = w * nch;
const px = Buffer.alloc(h * stride);
let ro = 0;
const prev = Buffer.alloc(stride);
for (let y = 0; y < h; y++) {
  const f = raw[ro++];
  const line = raw.slice(ro, ro + stride); ro += stride;
  for (let x = 0; x < stride; x++) {
    const a = x >= nch ? line[x - nch] : 0;
    const b = prev[x];
    const c = x >= nch ? prev[x - nch] : 0;
    let v = line[x];
    if (f === 1) v = (v + a) & 255;
    else if (f === 2) v = (v + b) & 255;
    else if (f === 3) v = (v + ((a + b) >> 1)) & 255;
    else if (f === 4) { const p = a + b - c; const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255; }
    px[y * stride + x] = v;
    prev[x] = v;
  }
}
let sum = 0, bright = 0, dark = 0, colors = new Map();
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  const o2 = (y * w + x) * nch;
  const r = px[o2], g = nch > 2 ? px[o2 + 1] : r, b = nch > 2 ? px[o2 + 2] : r;
  const lum = (r + g + b) / (nch > 2 ? 3 : 1);
  sum += lum;
  if (lum > 45) bright++;
  if (lum < 15) dark++;
  const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
  colors.set(key, (colors.get(key) || 0) + 1);
}
const top = [...colors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  .map(([k, n]) => `#${(k >> 8 & 15).toString(16)}${(k >> 4 & 15).toString(16)}${(k & 15).toString(16)}x${n}`);
console.log(`res=${w}x${h} ct=${ct} avgLum=${(sum / (w * h)).toFixed(1)} bright(>45)=${bright} (${(100 * bright / (w * h)).toFixed(1)}%) dark(<15)=${dark} (${(100 * dark / (w * h)).toFixed(1)}%)`);
console.log('topColors(4bit):', top.join(' '));
