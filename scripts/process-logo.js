const sharp = require('sharp');
const fs = require('fs');

const srcPath = 'C:/Users/msvat/.gemini/antigravity/brain/704c0061-5742-46b8-bff3-f4d74a253d44/.user_uploaded/media_1793721714110_f869d20f.png';

async function main() {
  const image = sharp(srcPath);
  const metadata = await image.metadata();
  console.log('Metadata:', metadata.width, metadata.height, metadata.channels, metadata.hasAlpha);

  // Read raw pixel data
  const { data, info } = await sharp(srcPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  console.log('Raw buffer length:', data.length, 'info:', info);

  // Check dark background threshold:
  // The background is pure black (0,0,0) or near black.
  // In the logo, the minaret/flame is yellow/gold/crimson, "al Ihsan" is pink/crimson, "cademy" is pink/crimson, "BUILDING A GENERATION FOR TOMORROW" is gray.
  // Let's create two versions:
  // 1) A clean transparent PNG where black background is transparent (with smooth alpha feathering for near-black pixels)
  // 2) Also let's check how it looks on white.
  // If the text "BUILDING A GENERATION FOR TOMORROW" is gray (#6b7280 / #888888), does it contrast well on white? Yes!
  // And "al Ihsan" and "cademy" are deep pink/crimson (#e11d48 / #be123c), which looks stunning on white!
  
  const transparentBuffer = Buffer.from(data);
  for (let i = 0; i < transparentBuffer.length; i += 4) {
    const r = transparentBuffer[i];
    const g = transparentBuffer[i + 1];
    const b = transparentBuffer[i + 2];
    
    // Max brightness among RGB
    const maxVal = Math.max(r, g, b);
    
    if (maxVal < 18) {
      // Solid black background -> make completely transparent
      transparentBuffer[i + 3] = 0;
    } else if (maxVal < 45) {
      // Soft antialiased edge -> feather alpha smoothly
      const alpha = Math.round(((maxVal - 18) / (45 - 18)) * 255);
      transparentBuffer[i + 3] = Math.min(transparentBuffer[i + 3], alpha);
    }
  }

  // Save trimmed transparent logo
  await sharp(transparentBuffer, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    }
  })
  .trim() // Trim transparent borders
  .png()
  .toFile('public/alihsan-logo-transparent.png');

  console.log('Saved public/alihsan-logo-transparent.png successfully');
}

main().catch(console.error);
