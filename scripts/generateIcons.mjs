/**
 * Generate PWA + Apple icons from an inline brand SVG, via sharp.
 *
 * Run: node scripts/generateIcons.mjs
 * Emits to /public:
 *   pwa-192x192.png, pwa-512x512.png, apple-touch-icon.png (180), maskable-512.png
 *
 * The maskable variant keeps the heart inside the ~80% safe zone so Android's
 * adaptive-icon mask doesn't clip it.
 */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, '..', 'public');

const CRIMSON = '#9B1B30';
const GOLD = '#D4AF37';

/** @param {number} heartScale 1 = full bleed, <1 shrinks the heart for maskable safe-zone. */
const svg = (heartScale = 1) => {
  // Heart path drawn in a 0..32 space, then scaled/centred within 512.
  const inner = 512 * heartScale;
  const offset = (512 - inner) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="${CRIMSON}"/>
  <g transform="translate(${offset},${offset}) scale(${inner / 32})">
    <path d="M16 25.5s-8-4.9-8-10.4A4.3 4.3 0 0 1 16 12a4.3 4.3 0 0 1 8 3.1C24 20.6 16 25.5 16 25.5Z" fill="${GOLD}"/>
  </g>
</svg>`;
};

const targets = [
  { name: 'pwa-192x192.png', size: 192, scale: 1 },
  { name: 'pwa-512x512.png', size: 512, scale: 1 },
  { name: 'apple-touch-icon.png', size: 180, scale: 1 },
  { name: 'maskable-512.png', size: 512, scale: 0.72 },
];

for (const t of targets) {
  await sharp(Buffer.from(svg(t.scale)))
    .resize(t.size, t.size)
    .png()
    .toFile(join(PUBLIC, t.name));
  console.log(`✓ ${t.name} (${t.size}px)`);
}
console.log('Icons generated.');
