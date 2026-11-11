import React from 'react';
import sharp from 'sharp';

// Generate PWA icons from a standalone SVG logo string
const logoSvg = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff9d5c"/>
      <stop offset="1" stop-color="#f4511e"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <path d="M256 76 C172 76 124 130 134 178 C82 196 74 268 112 304 C94 358 144 420 214 410 C242 444 346 444 374 400 C438 390 468 318 436 272 C466 228 434 148 368 148 C350 96 306 76 256 76 Z" fill="#ff7043" stroke="#fff" stroke-width="14"/>
  <path d="M256 106 C196 106 158 144 164 180 C128 192 122 244 150 268 C136 306 172 350 224 342 C244 366 328 366 348 334 C394 326 414 274 390 240 C410 204 386 148 338 148 C324 112 296 106 256 106 Z" fill="#ff8a65"/>
  <g fill="#fff">
    <circle cx="210" cy="212" r="34"/>
    <circle cx="302" cy="226" r="34"/>
  </g>
  <circle cx="218" cy="216" r="16" fill="#37474f"/>
  <circle cx="310" cy="230" r="16" fill="#37474f"/>
  <circle cx="212" cy="208" r="6" fill="#fff"/>
  <circle cx="304" cy="222" r="6" fill="#fff"/>
  <path d="M226 292 Q256 318 286 292" stroke="#4e342e" stroke-width="16" fill="none" stroke-linecap="round"/>
  <g transform="translate(340 84) rotate(18)">
    <path d="M0 64 L28 0 L44 40 L84 22 L56 78 L96 96 L40 108 L52 156 L0 112 Z" fill="#ffd54f" stroke="#f9a825" stroke-width="8" stroke-linejoin="round"/>
  </g>
</svg>`;

async function main() {
  const sizes = [192, 512];
  for (const size of sizes) {
    await sharp(Buffer.from(logoSvg))
      .resize(size, size)
      .png()
      .toFile(`/home/z/my-project/public/icon-${size}.png`);
    console.log(`icon-${size}.png written`);
  }
  // favicon copy
  await sharp(Buffer.from(logoSvg)).resize(64, 64).png().toFile('/home/z/my-project/public/icon-64.png');
  console.log('icon-64.png written');
}
main().catch((e) => { console.error(e); process.exit(1); });
