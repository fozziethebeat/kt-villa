import { expect, test, type Page } from '@playwright/test';
import { waitForScene } from './helpers';

const SHOTS = 'test-results/shots';
const shot = (page: Page, name: string) => page.screenshot({ path: `${SHOTS}/m4-${name}.png` });
const ev = <T>(page: Page, js: string) => page.evaluate(js) as Promise<T>;
const H = (js: string) => `(() => { const h = window.__hakuba; return ${js}; })()`;
const summary = (page: Page) => ev<any>(page, H('h.summary()'));

async function walkTo(page: Page, x: number, y: number) { await ev(page, H(`h.warp(${x}, ${y})`)); await page.waitForTimeout(60); }
async function pressE(page: Page, wait = 250) { await page.keyboard.press('e'); await page.waitForTimeout(wait); }
async function talk(page: Page, wait = 2300) { await walkTo(page, 630, 600); await pressE(page, wait); await pressE(page, 200); }
/** Turn in, then read and close the next step's intro. */
async function turnIn(page: Page) { await talk(page); await pressE(page); await pressE(page); }
async function drag(page: Page, from: [number, number], to: [number, number], steps = 8) {
  await page.mouse.move(...from); await page.mouse.down(); await page.mouse.move(to[0], to[1], { steps }); await page.mouse.up(); await page.waitForTimeout(80);
}
async function arrive(page: Page, region: string, key: string) {
  await ev(page, H(`h.goto('${region}')`)); await waitForScene(page, key); await page.waitForTimeout(1400); await ev(page, H('h.rest()'));
}
async function station(page: Page, x: number, y: number, overlay: string) {
  await walkTo(page, x, y + 10); await pressE(page, 500); await waitForScene(page, overlay); await page.waitForTimeout(300);
}
async function done(page: Page, region: string) {
  // Click the result panel's Done until the region is back (the panel can appear a frame or two late).
  for (let i = 0; i < 20; i++) {
    await page.mouse.click(640, 430); await page.waitForTimeout(300);
    if ((await ev<string[]>(page, H('h.activeScenes()'))).includes(region)) break;
  }
  await waitForScene(page, region); await page.waitForTimeout(200);
}
async function fetchAll(page: Page, spots: [number, number][]) { for (const [x, y] of spots) { await walkTo(page, x, y + 2); await pressE(page, 120); } }
async function flow(page: Page) {
  const paths: Record<string, [number, number][]> = await ev(page, H("h.scene('Flow').solution()"));
  const g: any = await ev(page, H("h.scene('Flow').geom()"));
  const c = (p: [number, number]): [number, number] => [g.x + (p[0] + 0.5) * g.cell, g.y + (p[1] + 0.5) * g.cell];
  for (const path of Object.values(paths)) {
    await page.mouse.move(...c(path[0])); await page.mouse.down();
    for (const p of path.slice(1)) await page.mouse.move(...c(p), { steps: 3 });
    await page.mouse.up(); await page.waitForTimeout(60);
  }
  await page.mouse.click(945, 640); await page.waitForTimeout(300);
}
async function arrange(page: Page, order: string[], slots: Record<string, [number, number]>) {
  for (const [i, id] of order.entries()) await drag(page, [130 + i * 150, 650], [60 + slots[id][0], 110 + slots[id][1]]);
  await page.mouse.click(1050, 470); await page.waitForTimeout(300);
}
async function cook(page: Page) {
  for (let i = 0; i < 4; i++) {
    await page.waitForFunction(() => { const s = (window as any).__hakuba.scene('Cook').debugState(); return s.offset < s.window / 3; }, null, { polling: 16 });
    await page.keyboard.press('Space'); await page.waitForTimeout(120);
  }
  await page.waitForTimeout(800);
}


/** Rotate a tray piece to `rot` (re-checking the real rotation) and drag it into place, retrying if a frame hitch eats an input. */
async function packPiece(page: Page, scene: string, sol: { id: string; x: number; y: number; rot: number }) {
  for (let attempt = 0; attempt < 3; attempt++) {
    let info: any = await ev(page, H(`h.scene('${scene}').trayInfo('${sol.id}')`));
    for (let i = 0; i < 8 && info.rot !== sol.rot; i++) {
      await page.mouse.click(info.x + (info.first[0] + 0.5) * info.cell, info.y + (info.first[1] + 0.5) * info.cell, { button: 'right' });
      await page.waitForTimeout(80);
      info = await ev(page, H(`h.scene('${scene}').trayInfo('${sol.id}')`));
    }
    const [fx, fy] = info.first;
    await drag(page, [info.x + (fx + 0.5) * info.cell, info.y + (fy + 0.5) * info.cell], [info.shelf.x + (sol.x + fx + 0.5) * info.shelf.cell, info.shelf.y + (sol.y + fy + 0.5) * info.shelf.cell]);
    await page.waitForTimeout(120);
    if (await ev(page, H(`h.scene('${scene}').isPlaced('${sol.id}')`))) return true;
  }
  return false;
}

test('M4: Goryu, Hakuba 47, Lake Aoki, Tsugaike, Tiers 2–3, rank & crew, the festival ending', async ({ page }) => {
  test.setTimeout(600_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => (window as any).__hakuba?.activeScenes().includes('Title'));
  await page.waitForTimeout(1000);
  // Start from "M3 complete" with Tier 1, money and bonds. Tests play arcs in one sitting, so pacing is off.
  await ev(page, H("(h.newGame(7), h.setPacing(false), ['station','snowpeak','happo_terminal','echoland','happo_pond','iwatake'].forEach((r) => h.fastForward(r)), h.setChassis(1), h.grant('kizuna', 60), h.grant('yen', 100000), 0)"));
  for (const r of ['snowpeak', 'happo_terminal', 'echoland', 'happo_pond', 'iwatake', 'goryu']) await ev(page, H(`h.openRoad('${r}')`));

  // ================= Goryu: plants → garden beds (packing) → farm crate (arrange) =================
  await arrive(page, 'goryu', 'Goryu');
  await shot(page, '01-goryu-dormant');
  await talk(page, 300);
  await fetchAll(page, [[300, 580], [470, 690], [760, 690], [1000, 620], [880, 520]]);
  expect((await summary(page)).inventory.alpine_plant).toBe(5);
  await turnIn(page);
  await station(page, 790, 590, 'Pack');
  const sol: any[] = await ev(page, H("h.scene('Pack').solution()"));
  for (const sp of sol) expect(await packPiece(page, 'Pack', sp), `bed ${sp.id}`).toBe(true);
  await page.waitForTimeout(300);
  await shot(page, '02-garden-planted');
  expect((await ev<any>(page, H('h.getState().stars'))).garden_beds).toBe(3);
  await page.mouse.click(950, 410); await waitForScene(page, 'Goryu');
  await turnIn(page);
  await station(page, 790, 590, 'Arrange');
  await arrange(page, ['flour', 'apples', 'rice', 'nozawana'], { apples: [520, 90], nozawana: [520, 190], flour: [520, 290], rice: [520, 390] });
  expect((await ev<any>(page, H('h.getState().stars'))).farm_crate).toBe(3);
  await done(page, 'Goryu');
  await talk(page);
  expect((await summary(page)).vitality.goryu).toBe(3);

  // ================= Garage: Tier 2 by real clicks =================
  await arrive(page, 'snowpeak', 'SnowPeak');
  await walkTo(page, 935, 560); await pressE(page, 500);
  await waitForScene(page, 'Garage');
  await page.mouse.click(540, 122 + 2 * 128 + 57);
  await page.waitForTimeout(200);
  expect((await summary(page)).chassis).toBe(2);
  await shot(page, '03-garage-tier2');
  await page.mouse.click(540, 680);
  await waitForScene(page, 'SnowPeak');
  await page.waitForTimeout(400);
  await shot(page, '04-box-van');
  await ev(page, H("h.grant('kizuna', 40)"));
  for (const r of ['hakuba47', 'aokiko']) await ev(page, H(`h.openRoad('${r}')`));

  // ================= Hakuba 47: trails (flow) → markers → bike tune (cook) =================
  await arrive(page, 'hakuba47', 'Hakuba47');
  await talk(page, 300);
  await station(page, 880, 570, 'Flow');
  await flow(page);
  await done(page, 'Hakuba47');
  await turnIn(page);
  await fetchAll(page, [[470, 690], [760, 690], [1000, 620], [540, 630]]);
  await turnIn(page);
  await station(page, 260, 590, 'Cook');
  await cook(page);
  await done(page, 'Hakuba47');
  await talk(page);
  expect((await summary(page)).vitality.hakuba47).toBe(3);

  // ================= Lake Aoki: photo (compose) → postcards (trace) → beach =================
  await arrive(page, 'aokiko', 'Aokiko');
  await talk(page, 300);
  await station(page, 820, 560, 'Compose');
  const target: [number, number] = await ev(page, H("h.scene('Compose').solution()"));
  const cg: any = await ev(page, H("h.scene('Compose').geom()"));
  const frameCenter = (fx: number, fy: number): [number, number] => [cg.x + (fx + cg.frame.w / 2) * cg.scale, cg.y + (fy + cg.frame.h / 2) * cg.scale];
  await drag(page, frameCenter(cg.fx, cg.fy), frameCenter(target[0], target[1]), 12);
  await shot(page, '05-lake-photo');
  await page.mouse.click(1060, 640); await page.waitForTimeout(400);
  expect((await ev<any>(page, H('h.getState().stars'))).lake_photo).toBe(3);
  await done(page, 'Aokiko');
  await turnIn(page);
  await station(page, 470, 575, 'Build');
  const cuts: [number, number][][] = await ev(page, `(async () => (await import('/src/scenes/BuildScene.ts')).CUTS.map((c) => c.path))()`);
  for (const [i, path] of cuts.entries()) {
    await page.mouse.move(...path[0]); await page.mouse.down();
    for (const p of path.slice(1)) await page.mouse.move(p[0], p[1], { steps: 8 });
    await page.mouse.up();
    // Wait for the game to score the stroke before pressing Next / Assemble (slow software rendering).
    await page.waitForFunction(() => (window as any).__hakuba.scene('Build').score().coverage >= 0.9);
    await page.mouse.click(1000, 640);
    if (i < cuts.length - 1) await page.waitForFunction((n) => (window as any).__hakuba.scene('Build').cut === n, i + 1);
  }
  await page.waitForFunction(() => !!(window as any).__hakuba.getState().stars.postcards);
  await done(page, 'Aokiko');
  await turnIn(page);
  await fetchAll(page, [[300, 600], [470, 690], [760, 690], [1000, 620], [560, 640]]);
  await talk(page);
  expect((await summary(page)).vitality.aokiko).toBe(3);
  await page.waitForTimeout(1200);
  await shot(page, '06-aokiko-thriving');

  // ================= Tier 3 + Tsugaike: field guide → boardwalk (flow) → tour pack =================
  await arrive(page, 'snowpeak', 'SnowPeak');
  await walkTo(page, 935, 560); await pressE(page, 500);
  await waitForScene(page, 'Garage');
  await page.mouse.click(540, 122 + 3 * 128 + 57);
  await page.waitForTimeout(200);
  expect((await summary(page)).chassis).toBe(3);
  await page.mouse.click(540, 680);
  await waitForScene(page, 'SnowPeak');
  await ev(page, H("h.openRoad('tsugaike')"));
  await arrive(page, 'tsugaike', 'Tsugaike');
  await talk(page, 300);
  await fetchAll(page, [[300, 580], [470, 690], [760, 690], [1000, 620], [880, 660], [560, 640]]);
  await turnIn(page);
  await station(page, 470, 545, 'Flow');
  await flow(page);
  await done(page, 'Tsugaike');
  await turnIn(page);
  await station(page, 470, 545, 'Arrange');
  await arrange(page, ['map', 'bino', 'guide', 'cover'], { guide: [520, 90], cover: [520, 190], bino: [520, 290], map: [520, 390] });
  await done(page, 'Tsugaike');
  await talk(page);
  let s = await summary(page);
  expect(Object.values(s.vitality).every((v) => v === 3)).toBe(true);

  // ================= Rank & crew: second trade + a helper, by clicks =================
  await ev(page, H('h.setReputation(140)'));
  await walkTo(page, 1130, 670); await pressE(page, 500);
  await waitForScene(page, 'VanInterior');
  await shot(page, '07-van-camper');
  await page.mouse.click(1135, 348); // Rank & crew
  await waitForScene(page, 'Crew');
  await page.waitForTimeout(200);
  await page.mouse.click(520, 410 + 2 * 64 + 20); // third choice = Guide & Tours (soba, sauna, tours)
  await page.waitForTimeout(150);
  await page.mouse.click(1150, 146 + 20); // invite the first available helper
  await page.waitForTimeout(150);
  await shot(page, '08-crew');
  s = await summary(page);
  expect(s.primary).toBe('coffee');
  expect(await ev(page, H('h.getState().secondaryArchetype'))).toBe('tours');
  expect((await ev<string[]>(page, H('h.getState().helpers'))).length).toBe(1);
  await page.mouse.click(1140, 690); // Back
  await waitForScene(page, 'VanInterior'); await page.waitForTimeout(200);
  await page.mouse.click(1040, 476); // Step outside
  await waitForScene(page, 'Tsugaike');

  // ================= A Thriving winter + green → the festival =================
  await ev(page, H("h.setSeason('winter')"));
  await page.waitForTimeout(500);
  for (let d = 0; d < 30; d++) {
    const scenes: string[] = await ev(page, H('h.activeScenes()'));
    if (scenes.includes('Festival')) break;
    if (scenes.includes('SeasonReport')) { await page.waitForTimeout(400); await shot(page, `09-report-${d}`); await page.mouse.click(955, 654); await page.waitForTimeout(600); continue; }
    await ev(page, H('h.endDay()'));
    await page.waitForTimeout(1300);
  }
  await waitForScene(page, 'Festival');
  await page.waitForTimeout(1200);
  await shot(page, '10-festival');
  expect(await ev(page, H('h.getState().ending'))).not.toBeNull();
  await page.mouse.click(640, 580);
  await waitForScene(page, 'Tsugaike');
  expect(errors).toEqual([]);
});
