const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname, '../public/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create a simple icon with the TaxFolio "T" logo
async function generateIcons() {
  // SVG for the icon - green gradient background with white "T"
  const svg = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="96" fill="url(#grad)"/>
      <text x="256" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="280" font-weight="bold" fill="white" text-anchor="middle">T</text>
    </svg>
  `;

  const svgBuffer = Buffer.from(svg);

  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, `icon-${size}x${size}.png`));

    console.log(`Generated icon-${size}x${size}.png`);
  }

  // Generate Apple Touch Icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(outputDir, 'apple-touch-icon.png'));

  console.log('Generated apple-touch-icon.png');

  // Generate favicon (32x32)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(outputDir, 'favicon-32x32.png'));

  console.log('Generated favicon-32x32.png');

  // Generate favicon (16x16)
  await sharp(svgBuffer)
    .resize(16, 16)
    .png()
    .toFile(path.join(outputDir, 'favicon-16x16.png'));

  console.log('Generated favicon-16x16.png');

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
