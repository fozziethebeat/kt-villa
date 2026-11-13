import { expect, test, type Page } from '@playwright/test';
import { settle, waitForScene } from './helpers';

const SHOTS = 'test-results/shots';
const shot = (page: Page, name: string) => page.screenshot({ path: `${SHOTS}/${name}.png` });
const ev = <T>(page: Page, js: string) => page.evaluate(js) as Promise<T>;
const H = (js: string) => `(() => { const h = window.__hakuba; return ${js}; })()`;
const summary = (page: Page) => ev<any>(page, H('h.summary()'));

async function drag(page: Page, from: [number, number], to: [number, number]) {
  await page.mouse.move(...from);
  await page.mouse.down();
  await page.mouse.move((from[0] + to[0]) / 2, (from[1] + to[1]) / 2, { steps: 4 });
  await page.mouse.move(...to, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(80);
}

async function walkTo(page: Page, x: number, y: number) {
  await ev(page, H(`h.warp(${x}, ${y})`));
  await page.waitForTimeout(60);
}

async function pressE(page: Page, wait = 250) {
  await page.keyboard.press('e');
  await page.waitForTimeout(wait);
}

async function runCafe(page: Page, shotName: string) {
  await page.mouse.click(1040, 284); // Open the café
  await waitForScene(page, 'Business');
  // Pour: press Space when the kettle is near the sweet spot.
  for (let i = 0; i < 4; i++) {
    await page.waitForFunction(() => { const s = (window as any).__hakuba.scene('Business').debugState(); return s.offset < s.window / 3; }, null, { polling: 16 });
    await page.keyboard.press('Space');
    await page.waitForTimeout(150);
  }
  await page.waitForFunction(() => (window as any).__hakuba.scene('Business').debugState().phase === 'service');
  let shotTaken = false;
  for (const deadline = Date.now() + 150_000; Date.now() < deadline;) {
    const st = await ev<any>(page, H("h.scene('Business').debugState()"));
    if (st.phase === 'summary') break;
    if (st.waiting.length >= 1 && !shotTaken) { await page.waitForTimeout(700); await shot(page, shotName); shotTaken = true; continue; }
    if (st.waiting.length && shotTaken) {
      const menu: string[] = await ev(page, H("h.scene('Business').plan.menu"));
      await page.keyboard.press(String(menu.indexOf(st.waiting[0].wants) + 1));
    }
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(300);
  await shot(page, `${shotName}-report`);
  await page.mouse.click(640, 430); // Close the hatch
  await page.waitForTimeout(300);
}

test('M1 vertical slice: full station arc, van, café, luggage, board, sleep/save, seasons', async ({ page }) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => (window as any).__hakuba?.activeScenes().includes('Title'));
  // Arcs are played in one sitting here; the one-request-per-day pacing (M4) is tested in m4.test.ts.
  await page.evaluate(() => (window as any).__hakuba.setPacing(false));
  await settle(page, 2600);
  await shot(page, '01-title');
  await expect(page).toHaveScreenshot('title.png');
  await ev(page, H('h.freeze(false)'));

  // ---- character select
  await page.mouse.click(640, 362);
  await waitForScene(page, 'CharacterSelect');
  await page.waitForTimeout(500);
  for (let i = 0; i < 3; i++) await page.keyboard.press('Backspace');
  await page.keyboard.type('Mika');
  await page.mouse.click(380 + 135, 156 + 85); // The Planner card
  await page.mouse.click(100 + 2 * 90, 286); // they
  await page.waitForTimeout(200);
  await shot(page, '02-character-select');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Station');
  await page.waitForTimeout(2600);
  let s = await summary(page);
  expect(s.step).toBe('brochures');
  expect(await ev(page, H('h.getState().player'))).toEqual({ name: 'Mika', pronouns: 'they', personality: 'planner' });

  // ---- step 1: fetch brochures
  await walkTo(page, 600, 560); await pressE(page);
  await shot(page, '03-kobayashi-intro');
  await pressE(page);
  for (const [x, y] of [[150, 560], [380, 660], [700, 690], [880, 630], [1180, 560]]) { await walkTo(page, x, y + 2); await pressE(page, 120); }
  expect((await summary(page)).inventory.brochure).toBe(5);
  await walkTo(page, 600, 560); await pressE(page, 2200);
  s = await summary(page);
  expect(s.vitality.station).toBe(1);
  expect(s.inventory.blank_map).toBe(1);
  await shot(page, '04-step1-complete');
  await pressE(page);
  await pressE(page); // read the step-2 intro
  await pressE(page);

  // ---- step 2: draw the map at the van workbench
  await walkTo(page, 1010, 640); await pressE(page, 500);
  await waitForScene(page, 'VanInterior');
  await shot(page, '05-van-interior');
  await page.mouse.click(1040, 220); // Workbench
  await waitForScene(page, 'MapCraft');
  await page.waitForTimeout(300);
  const slots: Record<string, [number, number]> = { mountains: [170, 120], gondola: [290, 210], station: [430, 300], onsen: [560, 180], lake: [300, 390] };
  // Put one sticker slightly wrong (onsen ↔ gondola swapped) to see a 2★ result path? No: aim for 3★.
  let i = 0;
  for (const [, [x, y]] of Object.entries(slots)) { await drag(page, [130 + i * 150, 650], [60 + x + 6, 110 + y - 4]); i++; }
  await shot(page, '06-mapcraft');
  await page.mouse.click(1050, 470); // Finish
  await page.waitForTimeout(400);
  await shot(page, '07-mapcraft-done');
  expect((await ev<any>(page, H('h.getState().stars'))).valley_map).toBe(3);
  await page.mouse.click(640, 430); // Done
  await page.waitForTimeout(300);
  await page.mouse.click(1040, 476); // Step outside
  await waitForScene(page, 'Station');
  await page.waitForTimeout(300);
  await walkTo(page, 600, 560); await pressE(page, 2400);
  s = await summary(page);
  expect(s.vitality.station).toBe(2);
  expect(s.unlocks).toContain('business:coffee');
  await shot(page, '08-step2-complete-awake');
  await pressE(page);

  // ---- place the pour-over bar, run the café (winter)
  await walkTo(page, 1010, 640); await pressE(page, 500);
  await drag(page, [150, 632], [500, 385]);
  const placed = await ev<any[]>(page, H('h.getState().van.placed'));
  expect(placed.find((p) => p.moduleId === 'pour_bar')).toBeTruthy();
  await shot(page, '09-van-pour-bar');
  const yenBefore = (await summary(page)).yen;
  await runCafe(page, '10-cafe-service');
  s = await summary(page);
  expect(s.yen).toBeGreaterThan(yenBefore);
  await page.mouse.click(1040, 476); // Step outside
  await waitForScene(page, 'Station');

  // ---- step 3: luggage puzzle by real drags
  await walkTo(page, 600, 560); await pressE(page); await pressE(page); // read step-3 intro
  await walkTo(page, 372, 548); await pressE(page, 500);
  await waitForScene(page, 'Luggage');
  await page.waitForTimeout(300);
  await shot(page, '11-luggage-start');
  const solution: any[] = await ev(page, H("h.scene('Luggage').solution()"));
  for (const sol of solution) {
    let info: any = await ev(page, H(`h.scene('Luggage').trayInfo('${sol.id}')`));
    for (let r = info.rot; r !== sol.rot; r = (r + 1) % 4) {
      await page.mouse.click(info.x + 4, info.y + 4, { button: 'right' });
      await page.waitForTimeout(40);
      info = await ev(page, H(`h.scene('Luggage').trayInfo('${sol.id}')`));
    }
    const [fx, fy] = info.first;
    const from: [number, number] = [info.x + (fx + 0.5) * info.cell, info.y + (fy + 0.5) * info.cell];
    const to: [number, number] = [info.shelf.x + (sol.x + fx + 0.5) * info.shelf.cell, info.shelf.y + (sol.y + fy + 0.5) * info.shelf.cell];
    await drag(page, from, to);
    expect(await ev(page, H(`h.scene('Luggage').isPlaced('${sol.id}')`)), `piece ${sol.id}`).toBe(true);
  }
  await page.waitForTimeout(400);
  await shot(page, '12-luggage-solved');
  await page.mouse.click(950, 410); // Done
  await waitForScene(page, 'Station');
  await walkTo(page, 600, 560); await pressE(page, 2400);
  s = await summary(page);
  expect(s.vitality.station).toBe(3);
  expect(s.unlocks).toContain('revival_board');
  await pressE(page);
  await page.waitForTimeout(1600);
  await shot(page, '13-thriving');

  // ---- kodama + board
  for (const [x, y] of [[92, 512], [846, 500], [1196, 690]]) { await walkTo(page, x, y); await pressE(page, 150); }
  expect((await ev<any>(page, H('h.getState().regions.station'))).kodamaFound).toBe(3);
  await walkTo(page, 250, 560); await pressE(page, 400);
  await waitForScene(page, 'Board');
  await shot(page, '14-board');
  const kz = (await summary(page)).kizuna;
  await page.mouse.click(250, 320); // Open road (first card)
  await page.waitForTimeout(200);
  expect((await summary(page)).kizuna).toBe(kz - 5);
  await page.mouse.click(1100, 650); // Back
  await waitForScene(page, 'Station');

  // ---- sleep → day 2, autosave, reload, continue
  const day = (await summary(page)).day;
  await walkTo(page, 1010, 640); await pressE(page, 500);
  await page.mouse.click(1040, 412); // Sleep
  await page.waitForTimeout(800);
  expect((await summary(page)).day).toBe(day + 1);
  await page.reload();
  await page.waitForFunction(() => (window as any).__hakuba?.activeScenes().includes('Title'));
  await page.waitForTimeout(2600);
  await shot(page, '15-title-continue');
  await page.mouse.click(640, 350); // Continue
  await waitForScene(page, 'Station');
  s = await summary(page);
  expect(s.day).toBe(day + 1);
  expect(s.vitality.station).toBe(3);

  // ---- green season café and visuals
  await ev(page, H("h.setSeason('green')"));
  await page.waitForTimeout(2600);
  await settle(page, 200);
  await shot(page, '16-thriving-green');
  await expect(page).toHaveScreenshot('station-thriving-green.png');
  await ev(page, H('h.freeze(false)'));
  await walkTo(page, 1010, 640); await pressE(page, 500);
  await runCafe(page, '17-cafe-green');
  expect(errors).toEqual([]);
});
