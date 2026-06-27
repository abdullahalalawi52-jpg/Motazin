const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, '..', 'public');
const faviconPath = path.join(publicDir, 'favicon.svg');

async function generateIcons() {
  try {
    console.log('Generating PWA icons using sharp...');

    // 1. Generate apple-touch-icon / 180x180 PNG from favicon.svg
    await sharp(faviconPath)
      .resize(180, 180)
      .png()
      .toFile(path.join(publicDir, 'pwa-180x180.png'));
    
    // Copy to apple-touch-icon.png for compatibility
    fs.copyFileSync(
      path.join(publicDir, 'pwa-180x180.png'),
      path.join(publicDir, 'apple-touch-icon.png')
    );
    console.log('Wrote pwa-180x180.png and apple-touch-icon.png');

    // 2. Generate maskable 512x512 icon
    // We scale the logo down to 320x320 (around 62% of 512) and center it on a #0f172a background
    const logoResized = await sharp(faviconPath)
      .resize(320, 320)
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a (slate-900)
      }
    })
      .composite([{
        input: logoResized,
        gravity: 'center'
      }])
      .png()
      .toFile(path.join(publicDir, 'pwa-maskable.png'));

    console.log('Wrote pwa-maskable.png (512x512 with safe padding)');
    console.log('Icon generation successful!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
