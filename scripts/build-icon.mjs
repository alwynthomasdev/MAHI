// Generates build/icon.png — MAHI's mark: a cream task tick inside a rounded
// frame on pounamu green. Pure Node (no native deps); rendered at 4x
// supersample and box-downscaled. Re-run: `npm run icon`.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { deflateSync } from 'node:zlib';

const OUT = 1024;
const SS = 4;
const N = OUT * SS; // working resolution

const CRC_TABLE = (() => {
  const tbl = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tbl[n] = c >>> 0;
  }
  return tbl;
})();

const GREEN = [31, 122, 92];
const CREAM = [243, 244, 241];

// RGB buffer, opaque; icon is a filled square so no alpha needed.
const buf = Buffer.alloc(N * N * 3);
const U = (v) => v * SS; // 1024-space -> working-space

function fill(rgb) {
  for (let i = 0; i < N * N; i++) {
    buf[i * 3] = rgb[0];
    buf[i * 3 + 1] = rgb[1];
    buf[i * 3 + 2] = rgb[2];
  }
}
function setpx(x, y, rgb) {
  if (x < 0 || y < 0 || x >= N || y >= N) return;
  const i = (y * N + x) * 3;
  buf[i] = rgb[0];
  buf[i + 1] = rgb[1];
  buf[i + 2] = rgb[2];
}
function rect(x, y, w, h, rgb) {
  const x0 = Math.round(U(x));
  const y0 = Math.round(U(y));
  const x1 = Math.round(U(x + w));
  const y1 = Math.round(U(y + h));
  for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) setpx3(xx, yy, rgb);
}
function setpx3(x, y, rgb) {
  setpx(x, y, rgb);
}
// Rounded rect (uniform corner radius r), in 1024-space.
function rrect(x, y, w, h, r, rgb) {
  const x0 = U(x);
  const y0 = U(y);
  const x1 = U(x + w);
  const y1 = U(y + h);
  const rr = U(r);
  for (let yy = Math.floor(y0); yy < Math.ceil(y1); yy++) {
    for (let xx = Math.floor(x0); xx < Math.ceil(x1); xx++) {
      let dx = 0;
      let dy = 0;
      if (xx < x0 + rr) dx = x0 + rr - xx;
      else if (xx > x1 - rr) dx = xx - (x1 - rr);
      if (yy < y0 + rr) dy = y0 + rr - yy;
      else if (yy > y1 - rr) dy = yy - (y1 - rr);
      if (dx * dx + dy * dy <= rr * rr) setpx3(xx, yy, rgb);
    }
  }
}
function ellipse(cx, cy, rx, ry, rgb) {
  const CX = U(cx);
  const CY = U(cy);
  const RX = U(rx);
  const RY = U(ry);
  for (let yy = Math.floor(CY - RY); yy <= Math.ceil(CY + RY); yy++) {
    for (let xx = Math.floor(CX - RX); xx <= Math.ceil(CX + RX); xx++) {
      const nx = (xx - CX) / RX;
      const ny = (yy - CY) / RY;
      if (nx * nx + ny * ny <= 1) setpx3(xx, yy, rgb);
    }
  }
}
// Convex/concave polygon scanline fill, points in 1024-space.
function poly(pts, rgb) {
  const p = pts.map(([x, y]) => [U(x), U(y)]);
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [, y] of p) {
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  for (let yy = Math.floor(minY); yy <= Math.ceil(maxY); yy++) {
    const xs = [];
    for (let i = 0; i < p.length; i++) {
      const [ax, ay] = p[i];
      const [bx, by] = p[(i + 1) % p.length];
      if (ay === by) continue;
      const y = yy + 0.5;
      if (y >= Math.min(ay, by) && y < Math.max(ay, by)) {
        xs.push(ax + ((y - ay) / (by - ay)) * (bx - ax));
      }
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let xx = Math.ceil(xs[k] - 0.5); xx <= Math.floor(xs[k + 1] - 0.5); xx++) setpx3(xx, yy, rgb);
    }
  }
}

// --- compose ---------------------------------------------------------------
fill(GREEN);

// Inset frame.
const m = 52;
const t = 11;
rect(m, m, OUT - 2 * m, t, CREAM);
rect(m, OUT - m - t, OUT - 2 * m, t, CREAM);
rect(m, m, t, OUT - 2 * m, CREAM);
rect(OUT - m - t, m, t, OUT - 2 * m, CREAM);

// A task box with a bold tick breaking out of its top-right corner.
const bx = 250;
const by = 300;
const bs = 470;
const bt = 44;
rrect(bx, by, bs, bs, 40, CREAM);
rrect(bx + bt, by + bt, bs - 2 * bt, bs - 2 * bt, 12, GREEN);
// Clear a notch in the box's top-right so the tick reads on top of it.
rect(bx + bs - 150, by - 10, 170, 150, GREEN);

// Tick: two thick strokes as polygons.
poly(
  [
    [330, 520],
    [395, 455],
    [505, 565],
    [440, 630],
  ],
  CREAM,
);
poly(
  [
    [440, 630],
    [375, 565],
    [720, 220],
    [785, 285],
  ],
  CREAM,
);

// --- downscale (box filter) + encode ------------------------------------
const small = Buffer.alloc(OUT * OUT * 4);
for (let y = 0; y < OUT; y++) {
  for (let x = 0; x < OUT; x++) {
    let r = 0;
    let g = 0;
    let b = 0;
    for (let sy = 0; sy < SS; sy++) {
      for (let sx2 = 0; sx2 < SS; sx2++) {
        const i = ((y * SS + sy) * N + (x * SS + sx2)) * 3;
        r += buf[i];
        g += buf[i + 1];
        b += buf[i + 2];
      }
    }
    const n = SS * SS;
    const o = (y * OUT + x) * 4;
    small[o] = Math.round(r / n);
    small[o + 1] = Math.round(g / n);
    small[o + 2] = Math.round(b / n);
    small[o + 3] = 255;
  }
}

writeFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'build', 'icon.png'), encodePng(small, OUT, OUT));
console.log('wrote build/icon.png');

function encodePng(rgba, w, h) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}
function chunk(type, data) {
  const tb = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([tb, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0, 0);
  return Buffer.concat([len, body, crc]);
}
function crc32(buf2) {
  let c = 0xffffffff;
  for (let i = 0; i < buf2.length; i++) c = CRC_TABLE[(c ^ buf2[i]) & 0xff] ^ (c >>> 8);
  return c ^ 0xffffffff;
}
