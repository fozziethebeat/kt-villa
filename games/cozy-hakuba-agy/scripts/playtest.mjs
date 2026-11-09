import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const ARTIFACT_DIR = '/Users/fozziethebeat/.gemini/antigravity/brain/4d097d3a-9c8b-4105-8c0a-c648af17d488';
const PROJECT_DIR = '/Users/fozziethebeat/devel/kt-villa/games/cozy-hakuba-agy';

function buildSelfContainedHtml() {
  const indexHtml = fs.readFileSync(path.join(PROJECT_DIR, 'dist/index.html'), 'utf8');
  const assetsDir = path.join(PROJECT_DIR, 'dist/assets');
  const files = fs.readdirSync(assetsDir);
  const cssFile = files.find((f) => f.endsWith('.css'));
  const jsFile = files.find((f) => f.endsWith('.js'));

  const cssContent = fs.readFileSync(path.join(assetsDir, cssFile), 'utf8');
  const jsContent = fs.readFileSync(path.join(assetsDir, jsFile), 'utf8');

  // Inline CSS and JS so data:/setContent loads with zero network/file requests!
  return indexHtml
    .replace(/<link[^>]+stylesheet[^>]*>/i, () => `<style>${cssContent}</style>`)
    .replace(/<script[^>]+src=[^>]+><\/script>/i, () => `<script type="module">${jsContent}</script>`);
}

async function runPlaytest() {
  console.log('Building self-contained bundle for headless Chrome playtest...');
  const fullHtml = buildSelfContainedHtml();

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });

  const consoleErrors = [];
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  await page.setContent(fullHtml, { waitUntil: 'load' });
  await page.waitForTimeout(900);

  // 1. Screenshot Character & Personality Selection Modal
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'playtest_1_char_select.png') });
  console.log('Captured playtest_1_char_select.png');

  // Select "The Burned-Out Barista" and start game
  await page.click('[data-personality="barista"]');
  await page.click('#btn-confirm-start');
  await page.waitForTimeout(700);

  // 2. Screenshot Unrestored Hakuba Station Overworld (Winter Day 1)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'playtest_2_station_sleepy_winter.png') });
  console.log('Captured playtest_2_station_sleepy_winter.png');

  // 3. Open Modular Van Interior & Mix-and-Match Grid
  await page.click('#btn-open-van');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'playtest_3_van_interior_grid.png') });
  console.log('Captured playtest_3_van_interior_grid.png');

  // Buy & place Oyaki Bamboo Steamer into Slot (3, 3) (gridX=2, gridY=2)
  await page.click('[data-select-mod="oyaki_steamer"]');
  await page.click('[data-place-x="2"][data-place-y="2"]');
  await page.waitForTimeout(400);

  // Start Tactile Service Mini-Game
  await page.click('#btn-start-popup-shift');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'playtest_4_service_minigame.png') });
  console.log('Captured playtest_4_service_minigame.png');

  // Complete shift via Quick Auto-Complete
  await page.click('#btn-quick-auto-serve');
  await page.waitForTimeout(600);

  // 4. Wake up Hakuba Train Station (Forage 3 Cedar Branches + Solve Thermal Pipe Puzzle)
  await page.evaluate(() => {
    window.hakubaDebug.store.collectForageItem('station', 'Cedar Branch');
    window.hakubaDebug.store.collectForageItem('station', 'Cedar Branch');
    window.hakubaDebug.store.collectForageItem('station', 'Cedar Branch');
  });
  await page.click('#btn-open-steward');
  await page.waitForTimeout(400);
  await page.click('#btn-steward-open-puzzle');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'playtest_5_station_pipe_puzzle.png') });
  console.log('Captured playtest_5_station_pipe_puzzle.png');

  await page.click('#btn-instant-solve-puzzle');
  await page.waitForTimeout(900);

  // 5. Screenshot Awakened Hakuba Station in full color!
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'playtest_6_station_awakened_color.png') });
  console.log('Captured playtest_6_station_awakened_color.png');

  // 6. Advance 6 days into Green Season & Travel to Snow Peak Land Station
  await page.evaluate(() => {
    window.hakubaDebug.advanceDays(6);
    window.hakubaDebug.travelTo('snowpeak');
    window.hakubaDebug.wakeCurrentRegion();
    window.hakubaDebug.store.getState().yen += 1500;
    window.hakubaDebug.store.buildGreenPivot('snowpeak');
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'playtest_7_snowpeak_green_season_pivot.png') });
  console.log('Captured playtest_7_snowpeak_green_season_pivot.png');

  // 7. Open 10-Region Hakuba Valley Atlas
  await page.click('#btn-open-atlas');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'playtest_8_valley_atlas_10_regions.png') });
  console.log('Captured playtest_8_valley_atlas_10_regions.png');

  const finalState = await page.evaluate(() => window.hakubaDebug.getState());
  console.log('Final Verified State Summary:', {
    season: finalState.season,
    day: finalState.day,
    yen: finalState.yen,
    currentRegion: finalState.currentRegion,
    stationAwakened: finalState.regions.station.stewardHelped,
    snowpeakAwakened: finalState.regions.snowpeak.stewardHelped,
    snowpeakGreenPivot: finalState.regions.snowpeak.greenPivotBuilt,
    happoUnlocked: finalState.regions.happo.unlocked,
    consoleErrors,
  });

  if (consoleErrors.length > 0) {
    throw new Error('Console errors detected: ' + consoleErrors.join('; '));
  }

  await browser.close();
}

runPlaytest().catch((err) => {
  console.error(err);
  process.exit(1);
});
