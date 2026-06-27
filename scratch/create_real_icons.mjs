import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generateIcons() {
  const svgPath = path.join(process.cwd(), 'public', 'favicon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // We add a dark background to the SVG to ensure it looks good and meets maskable requirements
  const backgroundSvg = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#0f172a"/>
      <g transform="scale(12) translate(5, 5)">
        ${fs.readFileSync(svgPath, 'utf8').replace(/<svg[^>]*>|<\/svg>/g, '')}
      </g>
    </svg>
  `;

  // Actually, sharp can just composite the SVG onto a dark background
  try {
    await sharp(svgBuffer)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a
      })
      .flatten({ background: { r: 15, g: 23, b: 42 } })
      .toFile(path.join(process.cwd(), 'public', 'pwa-192x192.png'));

    console.log('Created pwa-192x192.png');

    await sharp(svgBuffer)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 15, g: 23, b: 42, alpha: 1 }
      })
      .flatten({ background: { r: 15, g: 23, b: 42 } })
      .toFile(path.join(process.cwd(), 'public', 'pwa-512x512.png'));

    console.log('Created pwa-512x512.png');
  } catch (e) {
    console.error('Error generating icons:', e);
  }
}

generateIcons();
