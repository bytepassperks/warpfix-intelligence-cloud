#!/usr/bin/env node

/**
 * Generate PWA icons and favicons for WarpFix.
 * Uses SVG → embedded in HTML for the OG image fallback.
 * For actual PNG generation, run with a canvas library or use an online tool.
 */

const fs = require("fs");
const path = require("path");

const iconsDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(iconsDir, { recursive: true });

// SVG template for WarpFix icon
function generateIconSVG(size, maskable = false) {
  const padding = maskable ? size * 0.1 : 0;
  const innerSize = size - padding * 2;
  const centerX = size / 2;
  const centerY = size / 2;
  const r = innerSize * 0.35;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${maskable ? `<rect width="${size}" height="${size}" fill="#635bff" rx="0"/>` : ""}
  <rect x="${padding}" y="${padding}" width="${innerSize}" height="${innerSize}" rx="${innerSize * 0.2}" fill="${maskable ? "#635bff" : "#635bff"}"/>
  <g transform="translate(${centerX}, ${centerY})">
    <path d="M${-r * 0.5} ${-r * 0.6} L${r * 0.15} ${-r * 0.1} L${-r * 0.3} ${r * 0.6} L${-r * 0.1} ${r * 0.1} L${r * 0.5} ${-r * 0.6} L${-r * 0.15} ${r * 0.1} L${r * 0.3} ${-r * 0.6}" fill="none" stroke="white" stroke-width="${size * 0.04}" stroke-linecap="round" stroke-linejoin="round"/>
    <text y="${r * 0.02}" text-anchor="middle" dominant-baseline="central" fill="white" font-family="Inter, system-ui, sans-serif" font-weight="700" font-size="${size * 0.22}">W</text>
  </g>
</svg>`;
}

// Generate OG image SVG
function generateOGImage() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f8f8ff"/>
      <stop offset="100%" style="stop-color:#f0f0ff"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="4" fill="#635bff"/>
  <g transform="translate(80, 180)">
    <rect width="80" height="80" rx="16" fill="#635bff"/>
    <text x="40" y="50" text-anchor="middle" fill="white" font-family="Inter, system-ui, sans-serif" font-weight="700" font-size="36">W</text>
  </g>
  <text x="80" y="320" fill="#111" font-family="Inter, system-ui, sans-serif" font-weight="700" font-size="52">WarpFix</text>
  <text x="80" y="375" fill="#555" font-family="Inter, system-ui, sans-serif" font-weight="400" font-size="28">Autonomous CI Repair Agent</text>
  <text x="80" y="430" fill="#888" font-family="Inter, system-ui, sans-serif" font-weight="400" font-size="20">Detect failures · Generate patches · Validate in sandboxes · Open PRs automatically</text>
  <g transform="translate(80, 480)">
    <rect width="180" height="44" rx="8" fill="#635bff"/>
    <text x="90" y="28" text-anchor="middle" fill="white" font-family="Inter, system-ui, sans-serif" font-weight="600" font-size="16">Get Started Free</text>
  </g>
  <g transform="translate(700, 140)">
    <rect width="420" height="340" rx="12" fill="#1a1a2e" stroke="#333" stroke-width="1"/>
    <rect x="0" y="0" width="420" height="36" rx="12 12 0 0" fill="#252540"/>
    <circle cx="20" cy="18" r="6" fill="#ff5f56"/>
    <circle cx="40" cy="18" r="6" fill="#ffbd2e"/>
    <circle cx="60" cy="18" r="6" fill="#27c93f"/>
    <text x="20" y="72" fill="#888" font-family="JetBrains Mono, monospace" font-size="13">$ warpfix /fix-ci</text>
    <text x="20" y="102" fill="#635bff" font-family="JetBrains Mono, monospace" font-size="13">⚡ Analyzing CI failure...</text>
    <text x="20" y="132" fill="#27c93f" font-family="JetBrains Mono, monospace" font-size="13">✓ Error classified: type_error</text>
    <text x="20" y="162" fill="#27c93f" font-family="JetBrains Mono, monospace" font-size="13">✓ Fingerprint: a3f8c2d1 (cached)</text>
    <text x="20" y="192" fill="#27c93f" font-family="JetBrains Mono, monospace" font-size="13">✓ Patch generated (confidence: 94)</text>
    <text x="20" y="222" fill="#27c93f" font-family="JetBrains Mono, monospace" font-size="13">✓ Sandbox validation passed</text>
    <text x="20" y="252" fill="#ffbd2e" font-family="JetBrains Mono, monospace" font-size="13">→ PR #42 opened successfully</text>
  </g>
</svg>`;
}

// Write icon files
const sizes = [16, 32, 192, 512];
sizes.forEach((size) => {
  const svg = generateIconSVG(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.svg`), svg);
});

// Maskable icons
[192, 512].forEach((size) => {
  const svg = generateIconSVG(size, true);
  fs.writeFileSync(path.join(iconsDir, `icon-maskable-${size}.svg`), svg);
});

// Apple touch icon
const appleSvg = generateIconSVG(180);
fs.writeFileSync(path.join(iconsDir, "apple-touch-icon.svg"), appleSvg);

// OG image
const ogSvg = generateOGImage();
fs.writeFileSync(
  path.join(__dirname, "..", "public", "og-image.svg"),
  ogSvg
);

console.log("✓ Icons generated in public/icons/");
console.log("✓ OG image generated at public/og-image.svg");
console.log(
  "Note: Convert SVGs to PNG using a tool like sharp, Inkscape, or an online converter for production use."
);
