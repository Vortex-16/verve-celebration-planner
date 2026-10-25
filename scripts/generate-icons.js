import fs from 'node:fs';
import zlib from 'node:zlib';

function createPNG(width, height, bgColor, accentColor) {
  // CRC table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Raw bitmap scanlines
  const rowLen = 1 + width * 4;
  const rawData = Buffer.alloc(rowLen * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLen;
    rawData[rowOffset] = 0; // Filter byte 0 (None)
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      // Border radius check
      const r = width * 0.22;
      const dx = Math.max(0, Math.max(r - x, x - (width - 1 - r)));
      const dy = Math.max(0, Math.max(r - y, y - (height - 1 - r)));
      const isOutside = (dx * dx + dy * dy) > r * r;

      if (isOutside) {
        // Transparent
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
        continue;
      }

      // Inner calendar accent
      const margin = width * 0.22;
      const isHeader = y >= margin && y <= margin + height * 0.12 && x >= margin && x <= width - margin;
      const isBody = y > margin + height * 0.12 && y <= height - margin && x >= margin && x <= width - margin;
      const isAccentDot = (x - width * 0.65) ** 2 + (y - height * 0.6) ** 2 < (width * 0.05) ** 2;

      if (isAccentDot) {
        rawData[pxOffset] = accentColor[0];
        rawData[pxOffset + 1] = accentColor[1];
        rawData[pxOffset + 2] = accentColor[2];
        rawData[pxOffset + 3] = 255;
      } else if (isHeader) {
        rawData[pxOffset] = accentColor[0];
        rawData[pxOffset + 1] = accentColor[1];
        rawData[pxOffset + 2] = accentColor[2];
        rawData[pxOffset + 3] = 255;
      } else if (isBody) {
        rawData[pxOffset] = 245;
        rawData[pxOffset + 1] = 245;
        rawData[pxOffset + 2] = 247;
        rawData[pxOffset + 3] = 255;
      } else {
        rawData[pxOffset] = bgColor[0];
        rawData[pxOffset + 1] = bgColor[1];
        rawData[pxOffset + 2] = bgColor[2];
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  const idatData = zlib.deflateSync(rawData);
  const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  return Buffer.concat([
    pngHeader,
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const charcoal = [24, 24, 27];
const redAccent = [225, 29, 72];

fs.writeFileSync('public/pwa-192x192.png', createPNG(192, 192, charcoal, redAccent));
fs.writeFileSync('public/pwa-512x512.png', createPNG(512, 512, charcoal, redAccent));
fs.writeFileSync('public/pwa-maskable-512x512.png', createPNG(512, 512, charcoal, redAccent));
fs.writeFileSync('public/apple-touch-icon.png', createPNG(180, 180, charcoal, redAccent));

console.log('PNG Icons successfully generated.');
