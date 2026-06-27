import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generateIcons() {
  const svgPath = path.join(process.cwd(), 'public', 'favicon.svg');
  const svgBuffer = fs.readFileSync(svgPath);
  const bgColor = { r: 15, g: 23, b: 42, alpha: 1 }; // #0f172a

  try {
    // 192x192: target logo size ~134x134 (70%)
    await sharp(svgBuffer)
      .resize(134, 134, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 0 } })
      .extend({
        top: 29, bottom: 29, left: 29, right: 29,
        background: bgColor
      })
      .flatten({ background: bgColor })
      .toFile(path.join(process.cwd(), 'public', 'pwa-192x192.png'));
    console.log('Created padded pwa-192x192.png');

    // 512x512: target logo size ~360x360 (70%)
    await sharp(svgBuffer)
      .resize(358, 358, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 0 } })
      .extend({
        top: 77, bottom: 77, left: 77, right: 77,
        background: bgColor
      })
      .flatten({ background: bgColor })
      .toFile(path.join(process.cwd(), 'public', 'pwa-512x512.png'));
    console.log('Created padded pwa-512x512.png');
  } catch (e) {
    console.error('Error generating icons:', e);
  }
}

generateIcons();
