const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function buildAllIcons() {
  console.log('Building all PWA and web icons...');

  const trimmed = await sharp('public/alihsan-logo-emerald.png')
    .trim()
    .toBuffer({ resolveWithObject: true });

  console.log('Original logo trimmed dimensions:', trimmed.info.width, 'x', trimmed.info.height);

  // 1. Master Desktop & App Tile (1024x1024) - Squircle rounded white badge
  const size = 1024;
  const standardLogoWidth = Math.round(size * 0.86);
  const standardLogo = await sharp(trimmed.data)
    .resize(standardLogoWidth, null, { fit: 'inside' })
    .toBuffer();

  const squircleSvg = Buffer.from(`
    <svg width="${size}" height="${size}">
      <rect x="0" y="0" width="${size}" height="${size}" rx="190" ry="190" fill="#FFFFFF" />
    </svg>
  `);

  const masterSquircle = await sharp(squircleSvg)
    .composite([{ input: standardLogo, gravity: 'centre' }])
    .png()
    .toBuffer();

  // Save Next.js master app icon
  await sharp(masterSquircle).toFile('src/app/icon.png');
  console.log('Saved src/app/icon.png (1024x1024)');

  // Save 512x512 and 192x192 standard icons (squircle desktop badge)
  await sharp(masterSquircle)
    .resize(512, 512)
    .toFile('public/icons/icon-512x512.png');
  console.log('Saved public/icons/icon-512x512.png');

  await sharp(masterSquircle)
    .resize(192, 192)
    .toFile('public/icons/icon-192x192.png');
  console.log('Saved public/icons/icon-192x192.png');

  // Apple touch icon (180x180) - iOS squircle is automatically applied by iOS, so solid full white
  const appleLogoWidth = Math.round(180 * 0.82);
  const appleLogo = await sharp(trimmed.data)
    .resize(appleLogoWidth, null, { fit: 'inside' })
    .toBuffer();

  await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite([{ input: appleLogo, gravity: 'centre' }])
  .png()
  .toFile('public/icons/icon-apple-touch.png');
  console.log('Saved public/icons/icon-apple-touch.png (180x180)');

  // Maskable icons (for Android adaptive icons - strictly full-bleed solid background with 72% logo safe zone)
  for (const mSize of [512, 192]) {
    const maskLogoWidth = Math.round(mSize * 0.72);
    const maskLogo = await sharp(trimmed.data)
      .resize(maskLogoWidth, null, { fit: 'inside' })
      .toBuffer();

    await sharp({
      create: {
        width: mSize,
        height: mSize,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite([{ input: maskLogo, gravity: 'centre' }])
    .png()
    .toFile(`public/icons/icon-maskable-${mSize}.png`);
    console.log(`Saved public/icons/icon-maskable-${mSize}.png`);
  }

  console.log('All icons built successfully!');
}

buildAllIcons().catch(console.error);
