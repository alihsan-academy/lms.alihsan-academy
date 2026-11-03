const fs = require('fs');

const imgPath = 'C:/Users/msvat/.gemini/antigravity/brain/704c0061-5742-46b8-bff3-f4d74a253d44/alihsan-logo-emerald.png';
const base64 = fs.readFileSync(imgPath).toString('base64');
const dataUri = `data:image/png;base64,${base64}`;

const previewPath = 'C:/Users/msvat/.gemini/antigravity/brain/704c0061-5742-46b8-bff3-f4d74a253d44/email-preview.html';
let html = fs.readFileSync(previewPath, 'utf8');

// Replace the relative image tag with self-contained dataUri
html = html.replace('src="/alihsan-logo-emerald.png"', `src="${dataUri}"`);
fs.writeFileSync(previewPath, html);

// Also do it for email-design-showcase.html so all showcase tabs have visible logos
const showcasePath = 'C:/Users/msvat/.gemini/antigravity/brain/704c0061-5742-46b8-bff3-f4d74a253d44/email-design-showcase.html';
if (fs.existsSync(showcasePath)) {
  let scHtml = fs.readFileSync(showcasePath, 'utf8');
  scHtml = scHtml.replaceAll('/alihsan-logo-transparent.png', dataUri);
  fs.writeFileSync(showcasePath, scHtml);
}

console.log('Successfully embedded base64 logo in preview artifacts!');
