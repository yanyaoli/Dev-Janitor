/**
 * Icon Generation Script for Dev Tools Manager
 * 
 * This script provides instructions for generating application icons.
 * electron-builder can automatically generate icons from a 512x512 PNG or SVG.
 * 
 * Required icon files:
 * - build/icon.png (512x512) - Base icon, electron-builder will generate others
 * - build/icon.ico (Windows) - Auto-generated from PNG
 * - build/icon.icns (macOS) - Auto-generated from PNG
 * 
 * Manual generation (if needed):
 * 
 * For Windows (.ico):
 * - Use https://icoconvert.com/ or ImageMagick
 * - Include sizes: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
 * 
 * For macOS (.icns):
 * - Use iconutil on macOS or https://cloudconvert.com/
 * - Include sizes: 16x16, 32x32, 64x64, 128x128, 256x256, 512x512, 1024x1024
 * 
 * For Linux (.png):
 * - 512x512 PNG is sufficient
 * 
 * Using ImageMagick (if installed):
 * ```bash
 * # Convert SVG to PNG
 * convert -background none -resize 512x512 build/icon.svg build/icon.png
 * 
 * # Generate ICO for Windows
 * convert build/icon.png -define icon:auto-resize=256,128,64,48,32,16 build/icon.ico
 * ```
 * 
 * Using sharp (Node.js):
 * ```javascript
 * const sharp = require('sharp');
 * sharp('build/icon.svg')
 *   .resize(512, 512)
 *   .png()
 *   .toFile('build/icon.png');
 * ```
 */

console.log('Icon Generation Instructions');
console.log('============================');
console.log('');
console.log('electron-builder will automatically generate platform-specific icons');
console.log('from the build/icon.png or build/icon.svg file.');
console.log('');
console.log('For best results, provide a 512x512 or 1024x1024 PNG file.');
console.log('');
console.log('Current icon location: build/icon.svg');
