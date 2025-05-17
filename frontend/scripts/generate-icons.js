const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = {
  favicon: [16, 32, 48, 64],
  logo192: [192],
  logo512: [512]
};

async function generateIcons() {
  const svgBuffer = fs.readFileSync(path.join(__dirname, '../public/favicon.svg'));

  // Generate favicon.ico
  const faviconSizes = sizes.favicon.map(size => ({
    size,
    buffer: sharp(svgBuffer)
      .resize(size, size)
      .toFormat('png')
      .toBuffer()
  }));

  const faviconBuffers = await Promise.all(faviconSizes.map(({ buffer }) => buffer));
  fs.writeFileSync(path.join(__dirname, '../public/favicon.ico'), Buffer.concat(faviconBuffers));

  // Generate logo192.png
  await sharp(svgBuffer)
    .resize(192, 192)
    .toFormat('png')
    .toFile(path.join(__dirname, '../public/logo192.png'));

  // Generate logo512.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .toFormat('png')
    .toFile(path.join(__dirname, '../public/logo512.png'));

  console.log('Icons generated successfully!');
}

generateIcons().catch(console.error); 