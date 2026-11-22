import { expect, test, type Page } from '@playwright/test';
import { waitForScene } from './helpers';

const SHOTS = 'test-results/shots';
const shot = (page: Page, name: string) => page.screenshot({ path: `${SHOTS}/m5-${name}.png` });
const ev = <T>(page: Page, js: string) => page.evaluate(js) as Promise<T>;
const H = (js: string) => `(() => { const h = window.__hakuba; return ${js}; })()`;
const summary = (page: Page) => ev<any>(page, H('h.summary()'));
async function walkTo(page: Page, x: number, y: number) { await ev(page, H(`h.warp(${x}, ${y})`)); await page.waitForTimeout(60); }
async function pressE(page: Page, wait = 250) { await page.keyboard.press('e'); await page.waitForTimeout(wait); }
async function sleepInVan(page: Page) {
  await walkTo(page, 1010, 640); await pressE(page, 500);
  await waitForScene(page, 'VanInterior');
  await page.mouse.click(1040, 412);
  await page.waitForTimeout(1200);
}

test('M5 polish: look, daily pacing, pause menu save/load, settings, paint + festival sponsorship', async ({ page }) => {
  test.setTimeout(300_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => (window as any).__hakuba?.activeScenes().includes('Title'));
  await page.waitForTimeout(1200);

  // ---- character select: pick look 3 (two clicks on ▶)
  await page.mouse.click(640, 362);
  await waitForScene(page, 'CharacterSelect');
  await page.waitForTimeout(400);
  await page.mouse.click(270, 538); await page.mouse.click(270, 538); await page.waitForTimeout(150);
  await shot(page, '01-look');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Station');
  await page.waitForTimeout(2200);
  expect((await ev<any>(page, H('h.getState().player'))).look).toBe(2);
  expect(await ev(page, H('h.music()'))).toBe('winter'); // snowy late autumn at the station

  // ---- real pacing: one request per day (pacing is ON in this test)
  await walkTo(page, 600, 560); await pressE(page); await pressE(page);
  for (const [x, y] of [[150, 560], [380, 660], [700, 690], [880, 630], [1180, 560]]) { await walkTo(page, x, y + 2); await pressE(page, 120); }
  await walkTo(page, 600, 560); await pressE(page, 2200); await pressE(page);
  expect((await summary(page)).vitality.station).toBe(1);
  await ev(page, H("h.grant('valley_map', 1)"));
  await walkTo(page, 600, 560); await pressE(page, 400);
  const dialog = await ev<string>(page, H("h.scene('Station').dialogText.text"));
  expect(dialog).toContain('Come back tomorrow');
  await shot(page, '02-come-back-tomorrow');
  await pressE(page);
  expect((await summary(page)).vitality.station).toBe(1);
  await sleepInVan(page);
  await walkTo(page, 600, 560); await pressE(page, 2200); await pressE(page);
  expect((await summary(page)).vitality.station).toBe(2);

  // ---- pause menu: save to slot 2, change state, load it back
  await page.keyboard.press('Escape');
  await waitForScene(page, 'Pause');
  await shot(page, '03-pause');
  await page.mouse.click(640, 210 + 72); // Save game
  await page.waitForTimeout(250);
  await page.mouse.click(640, 200 + 84 + 22); // Slot 2
  await page.waitForTimeout(250);
  await shot(page, '04-saved-slot2');
  const savedDay = (await summary(page)).day;
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  await page.mouse.click(640, 210 + 3 * 72); // Settings
  await page.waitForTimeout(250);
  await page.mouse.click(640, 312); // Sound off
  await page.waitForTimeout(150);
  await shot(page, '05-settings');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('hakuba-wakeup-settings')!).muted)).toBe(true);
  await page.mouse.click(640, 312); // back on
  await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  await page.keyboard.press('Escape');
  await waitForScene(page, 'Station');
  await sleepInVan(page); await sleepInVan(page);
  expect((await summary(page)).day).toBe(savedDay + 2);
  await page.keyboard.press('Escape');
  await waitForScene(page, 'Pause');
  await page.mouse.click(640, 210 + 2 * 72); // Load game
  await page.waitForTimeout(250);
  await page.mouse.click(640, 200 + 2 * 84 + 22); // Slot 2 (row 0 is the autosave)
  await waitForScene(page, 'Station');
  await page.waitForTimeout(1500);
  expect((await summary(page)).day).toBe(savedDay);

  // ---- late-game yen sinks: paint + sponsorship
  await ev(page, H("(h.fastForward('station'), h.fastForward('snowpeak'), h.grant('yen', 60000), 0)"));
  await page.waitForTimeout(500);
  await walkTo(page, 250, 560); await pressE(page, 400);
  await waitForScene(page, 'Board');
  await page.mouse.click(1160, 36); await page.waitForTimeout(200); // Festivals tab
  await page.mouse.click(60 + 470, 140 + 40); await page.waitForTimeout(200); // Sponsor the station
  await shot(page, '06-festivals');
  expect(await ev(page, H('h.getState().sponsored'))).toEqual(['station']);
  await page.mouse.click(1100, 650);
  await waitForScene(page, 'Station');
  await ev(page, H("h.goto('snowpeak')"));
  await waitForScene(page, 'SnowPeak');
  await page.waitForTimeout(1200);
  await walkTo(page, 935, 560); await pressE(page, 500);
  await waitForScene(page, 'Garage');
  await page.mouse.click(760 + 2 * 52, 390); await page.waitForTimeout(200); // Cedar Green
  expect(await ev(page, H('h.getState().van.livery'))).toBe('forest');
  await page.mouse.click(540, 680);
  await waitForScene(page, 'SnowPeak');
  await ev(page, H("h.setSeason('green')"));
  await page.waitForTimeout(1500);
  await shot(page, '07-green-van-petals');
  expect(await ev(page, H('h.music()'))).toBe('green');
  expect(errors).toEqual([]);
});
