import fs from 'fs';
import path from 'path';

// 1x1 transparent PNG base64, we will use it just to satisfy the build
const base64Png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

const buffer = Buffer.from(base64Png, 'base64');
fs.writeFileSync(path.join(process.cwd(), 'public', 'pwa-192x192.png'), buffer);
fs.writeFileSync(path.join(process.cwd(), 'public', 'pwa-512x512.png'), buffer);

console.log('Created placeholder PWA icons.');
