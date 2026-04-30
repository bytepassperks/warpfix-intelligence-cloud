import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, "..", "public", "icons");
const publicDir = path.join(__dirname, "..", "public");

const conversions = [
  { input: "icon-16.svg", output: "icon-16.png", size: 16 },
  { input: "icon-32.svg", output: "icon-32.png", size: 32 },
  { input: "icon-192.svg", output: "icon-192.png", size: 192 },
  { input: "icon-512.svg", output: "icon-512.png", size: 512 },
  { input: "icon-maskable-192.svg", output: "icon-maskable-192.png", size: 192 },
  { input: "icon-maskable-512.svg", output: "icon-maskable-512.png", size: 512 },
  { input: "apple-touch-icon.svg", output: "apple-touch-icon.png", size: 180 },
];

for (const { input, output, size } of conversions) {
  const inputPath = path.join(iconsDir, input);
  const outputPath = path.join(iconsDir, output);
  if (fs.existsSync(inputPath)) {
    await sharp(inputPath).resize(size, size).png().toFile(outputPath);
    console.log(`✓ ${output} (${size}x${size})`);
  }
}

// OG image
const ogSvgPath = path.join(publicDir, "og-image.svg");
if (fs.existsSync(ogSvgPath)) {
  await sharp(ogSvgPath).resize(1200, 630).png().toFile(path.join(publicDir, "og-image.png"));
  console.log("✓ og-image.png (1200x630)");
}

console.log("\nAll icons converted to PNG.");
