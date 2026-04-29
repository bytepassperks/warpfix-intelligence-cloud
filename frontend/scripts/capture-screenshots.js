#!/usr/bin/env node
/**
 * Capture screenshots of all WarpFix pages for marketing and docs.
 * Usage: node scripts/capture-screenshots.js [base-url]
 * Default base URL: http://localhost:3000
 */

const { execSync } = require("child_process");

const BASE_URL = process.argv[2] || "http://localhost:3000";

const PAGES = [
  { name: "landing", path: "/", width: 1440, height: 900 },
  { name: "dashboard", path: "/dashboard", width: 1440, height: 900 },
  { name: "repositories", path: "/dashboard/repositories", width: 1440, height: 900 },
  { name: "repairs", path: "/dashboard/repairs", width: 1440, height: 900 },
  { name: "reviews", path: "/dashboard/reviews", width: 1440, height: 900 },
  { name: "analytics", path: "/dashboard/analytics", width: 1440, height: 900 },
  { name: "security", path: "/dashboard/security", width: 1440, height: 900 },
  { name: "dependency-radar", path: "/dashboard/dependency-radar", width: 1440, height: 900 },
  { name: "settings", path: "/dashboard/settings", width: 1440, height: 900 },
  { name: "billing", path: "/dashboard/billing", width: 1440, height: 900 },
  { name: "landing-mobile", path: "/", width: 375, height: 812 },
  { name: "dashboard-mobile", path: "/dashboard", width: 375, height: 812 },
];

async function capture() {
  // Requires Playwright: npx playwright install chromium
  const { chromium } = require("playwright");
  const browser = await chromium.launch();

  for (const page of PAGES) {
    const context = await browser.newContext({
      viewport: { width: page.width, height: page.height },
    });
    const tab = await context.newPage();
    await tab.goto(`${BASE_URL}${page.path}`, { waitUntil: "networkidle" });
    await tab.waitForTimeout(2000); // Let animations settle
    await tab.screenshot({
      path: `public/screenshots/${page.name}.png`,
      fullPage: false,
    });
    console.log(`Captured: ${page.name} (${page.width}x${page.height})`);
    await context.close();
  }

  await browser.close();
  console.log(`\nDone! ${PAGES.length} screenshots saved to public/screenshots/`);
}

capture().catch(console.error);
