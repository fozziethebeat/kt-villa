import { expect, test, type Page } from '@playwright/test';
import { settle, waitForScene } from './helpers';

const SHOTS = 'test-results/shots';
const shot = (page: Page, name: string) => page.screenshot({ path: `${SHOTS}/m2-${name}.png` });
const ev = <T>(page: Page, js: string) => page.evaluate(js) as Promise<T>;
const H = (js: string) => `(() => { const h = window.__hakuba; return ${js}; })()`;
const summary = (page: Page) => ev<any>(page, H('h.summary()'));

async function walkTo(page: Page, x: number, y: number) {
  await ev(page, H(`h.warp(${x}, ${y})`));
  await page.waitForTimeout(60);
}
async function pressE(page: Page, wait = 250) {
  await page.keyboard.press('e');
  await page.waitForTimeout(wait);
}
async function talkTakumi(page: Page, wait = 300) {
  await walkTo(page, 630, 600); await pressE(page, wait);
}

/** Run a shift from the van: prep (pour and/or noodle cut) by timing, then serve every order by key. */
async function runShift(page: Page, shotName: string) {
  await page.mouse.click(1040, 284);
  await waitForScene(page, 'Business');
  let shotPrep = false;
  for (let guard = 0; guard < 12; guard++) {
    const st = await ev<any>(page, H("h.scene('Business').debugState()"));
    if (st.phase !== 'prep') break;
    await page.waitForFunction(() => { const s = (window as any).__hakuba.scene('Business').debugState(); return s.phase !== 'prep' || s.offset < s.window / 3; }, null, { polling: 16 });
    if (st.line === 'bowl' && !shotPrep) { await shot(page, `${shotName}-cut`); shotPrep = true; }
    await page.keyboard.press('Space');
    await page.waitForTimeout(160);
  }
  await page.waitForFunction(() => (window as any).__hakuba.scene('Business').debugState().phase === 'service');
  let shotTaken = false;
  for (const deadline = Date.now() + 150_000; Date.now() < deadline;) {
    const st = await ev<any>(page, H("h.scene('Business').debugState()"));
    if (st.phase === 'summary') break;
    if (st.waiting.length >= 1 && !shotTaken) { await page.waitForTimeout(500); await shot(page, shotName); shotTaken = true; continue; }
    if (st.waiting.length) {
      const menu: string[] = await ev(page, H("h.scene('Business').plan.menu"));
      await page.keyboard.press(String(menu.indexOf(st.waiting[0].wants) + 1));
    }
    await page.waitForTimeout(220);
  }
  await page.waitForTimeout(300);
  await shot(page, `${shotName}-report`);
  await page.mouse.click(640, 430); // Close the hatch
  await page.waitForTimeout(300);
}

test('M2 garage & build: drive to Snow Peak, tent, parts, soba build, garage Tier 1, soba kitchen shift', async ({ page }) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => (window as any).__hakuba?.activeScenes().includes('Title'));
  await page.waitForTimeout(1200);

  // Start from "M1 complete": station Thriving, pour bar placed, Snow Peak road opened on the board.
  await ev(page, H("h.newGame(7)"));
  await ev(page, H("h.fastForward('station')"));
  await ev(page, H("h.goto('station')"));
  await waitForScene(page, 'Station');
  await page.waitForTimeout(1600);
  await walkTo(page, 250, 560); await pressE(page, 400);
  await waitForScene(page, 'Board');
  await shot(page, '01-board');
  await page.mouse.click(250, 426); // Open road to Snow Peak (first card)
  await page.waitForTimeout(200);
  expect((await summary(page)).unlocks).toContain('road:snowpeak');
  await page.mouse.click(640, 640); // Back

  // ---- drive
  await walkTo(page, 1010, 640); await pressE(page, 500);
  await waitForScene(page, 'VanInterior');
  await page.mouse.click(945, 540); // Drive…
  await waitForScene(page, 'Travel');
  await page.mouse.click(540, 470); // Snow Peak node
  await page.waitForTimeout(200);
  await shot(page, '02-travel');
  const staminaBefore = (await summary(page)).stamina;
  await page.mouse.click(1100, 600); // Drive here
  await waitForScene(page, 'SnowPeak');
  await page.waitForTimeout(2200);
  let s = await summary(page);
  expect(s.region).toBe('snowpeak');
  expect(s.stamina).toBe(staminaBefore - 1);
  expect(await ev(page, H('h.activeScenes()'))).toEqual(['SnowPeak', 'Hud']);
  await shot(page, '03-snowpeak-dormant');

  // ---- step 1: tent (balance puzzle) by real clicks
  await talkTakumi(page); await shot(page, '04-takumi-intro'); await pressE(page);
  await walkTo(page, 160, 610); await pressE(page, 500);
  await waitForScene(page, 'Tent');
  const sol: Record<string, [number, number]> = await ev(page, H("h.scene('Tent').solution()"));
  const g: any = await ev(page, H("h.scene('Tent').geom()"));
  const ids = Object.keys(sol);
  for (const id of ids.slice(0, 3)) await page.mouse.click(g.x + (sol[id][0] + 0.5) * g.cell, g.y + (sol[id][1] + 0.5) * g.cell);
  await page.waitForTimeout(150);
  await shot(page, '05-tent-leaning');
  const last = sol[ids[3]];
  await page.mouse.click(g.x + (last[0] + 0.5) * g.cell, g.y + (last[1] + 0.5) * g.cell);
  await page.waitForTimeout(150);
  await shot(page, '06-tent-balanced');
  await page.mouse.click(935, 640); // Tie it off
  await page.waitForTimeout(300);
  expect((await ev<any>(page, H('h.getState().stars'))).tent).toBe(3);
  await page.mouse.click(640, 420); // Done
  await waitForScene(page, 'SnowPeak');
  await talkTakumi(page, 2400);
  expect((await summary(page)).vitality.snowpeak).toBe(1);
  await pressE(page); await pressE(page); await pressE(page); // close, read step-2 intro, close

  // ---- step 2: dig out 4 parts (1 stamina each)
  for (const [x, y] of [[440, 690], [540, 630], [800, 690], [1000, 620]]) { await walkTo(page, x, y + 2); await pressE(page, 150); }
  expect((await summary(page)).inventory.van_part).toBe(4);
  await shot(page, '07-parts');
  await talkTakumi(page, 2400);
  s = await summary(page);
  expect(s.vitality.snowpeak).toBe(2);
  await pressE(page); await pressE(page); await pressE(page);
  // Out of stamina after a long day: sleep in the van first.
  await walkTo(page, 1130, 670); await pressE(page, 500);
  await page.mouse.click(1040, 412); // Sleep
  await page.waitForTimeout(900);

  // ---- step 3: choose soba, build the module by tracing
  await walkTo(page, 790, 560); await pressE(page, 500);
  await waitForScene(page, 'Archetype');
  await page.mouse.click(660 + 280, 110 + 200); // Soba card
  await page.waitForTimeout(150);
  await shot(page, '08-archetype');
  await page.mouse.click(640, 630); // Make it official
  await waitForScene(page, 'Build');
  expect((await summary(page)).primary).toBe('soba');
  const cuts: [number, number][][] = await ev(page, `(async () => (await import('/src/scenes/BuildScene.ts')).CUTS.map((c) => c.path))()`);
  for (let i = 0; i < cuts.length; i++) {
    const path = cuts[i];
    await page.mouse.move(...path[0]);
    await page.mouse.down();
    for (let k = 1; k < path.length; k++) await page.mouse.move(path[k][0], path[k][1], { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(100);
    if (i === 0) await shot(page, '09-build-trace');
    await page.mouse.click(1000, 640); // Next cut / Assemble
    await page.waitForTimeout(250);
  }
  await shot(page, '10-build-done');
  expect((await ev<any>(page, H('h.getState().stars'))).first_module).toBeGreaterThanOrEqual(2);
  await page.mouse.click(640, 430); // Done
  await waitForScene(page, 'SnowPeak');
  await talkTakumi(page, 2400);
  s = await summary(page);
  expect(s.vitality.snowpeak).toBe(3);
  expect(s.unlocks).toEqual(expect.arrayContaining(['garage', 'business:soba']));
  await pressE(page);
  await page.waitForTimeout(1500);
  await shot(page, '11-snowpeak-thriving');

  // ---- place the soba kitchen (replacing the pour bar), set the menu
  await walkTo(page, 1130, 670); await pressE(page, 500);
  await waitForScene(page, 'VanInterior');
  await page.mouse.click(1040, 412); // sleep for stamina
  await page.waitForTimeout(900);
  await walkTo(page, 1130, 670); await pressE(page, 500);
  await page.mouse.move(100 + 160 * 1.5, 190 + 65); // pour bar at (1,0)
  await page.mouse.down(); await page.mouse.move(400, 620, { steps: 5 }); await page.mouse.up(); // back to storage
  await page.waitForTimeout(150);
  const stored = await ev<string[]>(page, H("h.getState().van.owned.filter((id) => !h.getState().van.placed.some((p) => p.moduleId === id))"));
  const kIdx = stored.indexOf('soba_kitchen');
  await page.mouse.move(40 + 110 + kIdx * 190, 540 + 92);
  await page.mouse.down(); await page.mouse.move(100 + 160 * 2, 190 + 65, { steps: 6 }); await page.mouse.up();
  await page.waitForTimeout(150);
  expect((await ev<any[]>(page, H('h.getState().van.placed'))).some((p) => p.moduleId === 'soba_kitchen')).toBe(true);
  await page.mouse.click(1135, 540); // Menu
  await page.waitForTimeout(200);
  await shot(page, '12-van-menu');
  await page.mouse.click(1135, 540); // close menu

  // ---- garage: Tier 1 + ski box
  await page.mouse.click(1040, 476); // Step outside
  await waitForScene(page, 'SnowPeak');
  await ev(page, H("h.grant('yen', 9000)"));
  await walkTo(page, 935, 560); await pressE(page, 500);
  await waitForScene(page, 'Garage');
  await page.mouse.click(540, 122 + 128 + 57); // Upgrade to Tier 1
  await page.waitForTimeout(150);
  await page.mouse.click(1170, 392 + 92 + 34); // Buy ski box (second roof module)
  await page.waitForTimeout(150);
  s = await summary(page);
  expect(s.chassis).toBe(1);
  expect(s.roof).toEqual(['ski_box']);
  await shot(page, '13-garage');
  await page.mouse.click(540, 680); // Back
  await waitForScene(page, 'SnowPeak');
  await page.waitForTimeout(400);
  await shot(page, '14-van-tier1');

  // ---- winter soba shift at Snow Peak (evening is soba's best time)
  await ev(page, H("h.setSeason('winter')"));
  await page.waitForTimeout(800);
  await walkTo(page, 1130, 670); await pressE(page, 500);
  const yen0 = (await summary(page)).yen;
  await runShift(page, '15-soba-shift');
  s = await summary(page);
  expect(s.yen).toBeGreaterThan(yen0);
  const last2: any = await ev(page, H('h.getState().business.last'));
  expect(last2.region).toBe('snowpeak');

  // ---- drive home, save, continue lands back at the right region
  await page.mouse.click(1040, 412); // Sleep (autosave)
  await page.waitForTimeout(900);
  await page.reload();
  await page.waitForFunction(() => (window as any).__hakuba?.activeScenes().includes('Title'));
  await page.waitForTimeout(1500);
  await page.mouse.click(640, 350); // Continue
  await waitForScene(page, 'SnowPeak');
  s = await summary(page);
  expect(s.primary).toBe('soba');
  expect(s.chassis).toBe(1);
  await page.waitForTimeout(1800);
  await settle(page, 200);
  await shot(page, '16-continue-snowpeak');
  expect(errors).toEqual([]);
});
