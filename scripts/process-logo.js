const sharp = require('sharp');
const fs = require('fs');

const srcPath = 'C:/Users/msvat/.gemini/antigravity/brain/704c0061-5742-46b8-bff3-f4d74a253d44/.user_uploaded/media_1793722397074_fe5c5fd5.png';

async function main() {
  console.log('Processing new green logo from:', srcPath);

  // 1. Save original trimmed high-res PNG
  await sharp(srcPath)
    .trim()
    .png()
    .toFile('public/alihsan-logo-emerald.png');

  console.log('Saved trimmed public/alihsan-logo-emerald.png');

  // Copy to artifact folder for immediate preview
  fs.copyFileSync('public/alihsan-logo-emerald.png', 'C:/Users/msvat/.gemini/antigravity/brain/704c0061-5742-46b8-bff3-f4d74a253d44/alihsan-logo-emerald.png');
  console.log('Copied to artifact directory');
}

main().catch(console.error);
