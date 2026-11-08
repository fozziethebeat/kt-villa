import { expect, test } from '@playwright/test';
import { boot, hk, settle, waitForScene } from './helpers';

const SHOTS = 'test-results/shots';

test('title screen renders', async ({ page }) => {
  await boot(page);
  await settle(page, 2800);
  await page.screenshot({ path: `${SHOTS}/01-title.png` });
  await expect(page).toHaveScreenshot('title.png');
});

test('start → station, fetch quest wakes the station, seasons swap', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await boot(page);
  await page.waitForTimeout(600);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Station');
  await waitForScene(page, 'Hud');
  await page.waitForTimeout(2600); // banner + fade

  // Walk with real keys: hold D then release; the player should move right.
  const before = await page.evaluate(() => (window as any).__hakuba.game.scene.getScene('Station').player.x);
  await page.keyboard.down('d'); await page.waitForTimeout(400); await page.keyboard.up('d');
  const after = await page.evaluate(() => (window as any).__hakuba.game.scene.getScene('Station').player.x);
  expect(after).toBeGreaterThan(before + 40);

  await settle(page, 200);
  await page.screenshot({ path: `${SHOTS}/02-station-dormant-autumn.png` });
  await expect(page).toHaveScreenshot('station-dormant.png');
  await page.evaluate(() => (window as any).__hakuba.freeze(false));

  // Talk to Mrs. Kobayashi (quest intro).
  await hk(page, (h) => h.warp(600, 560));
  await page.waitForTimeout(100);
  await page.keyboard.press('e');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOTS}/03-dialog-intro.png` });
  await page.keyboard.press('e'); // close

  // Pick up all 5 brochures by walking to each and pressing E.
  for (const [x, y] of [[150, 560], [380, 660], [700, 690], [880, 630], [1180, 560]]) {
    await hk(page, new Function('h', `h.warp(${x}, ${y + 2})`) as any);
    await page.waitForTimeout(80);
    await page.keyboard.press('e');
    await page.waitForTimeout(120);
  }
  expect((await hk(page, (h) => h.getState())).inventory.brochure).toBe(5);

  // Return them → station becomes Stirring, +3 kizuna, kodama appears.
  await hk(page, (h) => h.warp(600, 560));
  await page.waitForTimeout(80);
  await page.keyboard.press('e');
  await page.waitForTimeout(2200);
  const s = await hk(page, (h) => h.summary());
  expect(s.vitality.station).toBe(1);
  expect(s.kizuna).toBe(3);
  await page.screenshot({ path: `${SHOTS}/04-quest-complete.png` });
  await page.keyboard.press('e');

  // Sleep in the van → day 2.
  await hk(page, (h) => h.warp(1010, 640));
  await page.waitForTimeout(80);
  await page.keyboard.press('e');
  await page.waitForTimeout(1200);
  expect((await hk(page, (h) => h.summary())).day).toBe(2);

  // Jump to green season and capture.
  await hk(page, (h) => h.setSeason('green'));
  await settle(page, 2600);
  await page.screenshot({ path: `${SHOTS}/05-station-stirring-green.png` });
  await expect(page).toHaveScreenshot('station-stirring-green.png');

  // Full thriving in winter for the art direction check.
  await page.evaluate(() => (window as any).__hakuba.freeze(false));
  await hk(page, (h) => { h.setSeason('winter'); h.setVitality('station', 3); });
  await settle(page, 600);
  await page.screenshot({ path: `${SHOTS}/06-station-thriving-winter.png` });

  expect(errors).toEqual([]);
});
