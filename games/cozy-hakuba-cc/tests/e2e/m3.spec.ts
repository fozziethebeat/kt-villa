import { expect, test, type Page } from '@playwright/test';
import { waitForScene } from './helpers';

const SHOTS = 'test-results/shots';
const shot = (page: Page, name: string) => page.screenshot({ path: `${SHOTS}/m3-${name}.png` });
const ev = <T>(page: Page, js: string) => page.evaluate(js) as Promise<T>;
const H = (js: string) => `(() => { const h = window.__hakuba; return ${js}; })()`;
const summary = (page: Page) => ev<any>(page, H('h.summary()'));

async function walkTo(page: Page, x: number, y: number) { await ev(page, H(`h.warp(${x}, ${y})`)); await page.waitForTimeout(60); }
async function pressE(page: Page, wait = 250) { await page.keyboard.press('e'); await page.waitForTimeout(wait); }
/** Talk to the region's key person (they all stand at 630,590), then close the dialog. */
async function talk(page: Page, wait = 2300) { await walkTo(page, 630, 600); await pressE(page, wait); await pressE(page, 200); }
async function drag(page: Page, from: [number, number], to: [number, number], steps = 8) {
  await page.mouse.move(...from); await page.mouse.down();
  await page.mouse.move(to[0], to[1], { steps }); await page.mouse.up(); await page.waitForTimeout(80);
}
async function arrive(page: Page, region: string, key: string) {
  await ev(page, H(`h.goto('${region}')`));
  await waitForScene(page, key);
  await page.waitForTimeout(1500);
  await ev(page, H('h.rest()'));
}
async function useStation(page: Page, x: number, y: number, overlay: string) {
  await walkTo(page, x, y + 10); await pressE(page, 500);
  await waitForScene(page, overlay);
  await page.waitForTimeout(300);
}
async function done(page: Page, region: string) {
  await page.mouse.click(640, 430); // result panel "Done"
  await waitForScene(page, region);
  await page.waitForTimeout(200);
}
async function cook(page: Page) {
  for (let i = 0; i < 4; i++) {
    await page.waitForFunction(() => { const s = (window as any).__hakuba.scene('Cook').debugState(); return s.offset < s.window / 3; }, null, { polling: 16 });
    await page.keyboard.press('Space');
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(800);
}
async function seat(page: Page) {
  const sol: string[] = await ev(page, H("h.scene('Seating').solution()"));
  for (let i = 0; i < sol.length; i++) {
    const g: [number, number] = await ev(page, H(`h.scene('Seating').guestPos('${sol[i]}')`));
    await page.mouse.click(g[0], g[1] - 14); await page.waitForTimeout(60);
    const s: [number, number] = await ev(page, H(`h.scene('Seating').seatPos(${i})`));
    await page.mouse.click(s[0], s[1]); await page.waitForTimeout(60);
  }
}
async function fetchAll(page: Page, spots: [number, number][]) { for (const [x, y] of spots) { await walkTo(page, x, y + 2); await pressE(page, 120); } }

test('M3 north arm: terminal, Echoland, Happo Pond, Iwatake by real input, attractions, Season Report', async ({ page }) => {
  test.setTimeout(300_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => (window as any).__hakuba?.activeScenes().includes('Title'));
  // Arcs are played in one sitting here; the one-request-per-day pacing (M4) is tested in m4.test.ts.
  await page.evaluate(() => (window as any).__hakuba.setPacing(false));
  await page.waitForTimeout(1000);
  // Start from "M2 complete".
  await ev(page, H("h.newGame(7)"));
  await ev(page, H("h.fastForward('station')"));
  await ev(page, H("h.fastForward('snowpeak')"));
  await ev(page, H("h.grant('kizuna', 20)"));
  await ev(page, H("h.openRoad('snowpeak')"));
  await ev(page, H("h.openRoad('happo_terminal')"));

  // ================= Happo-One Bus Terminal =================
  await arrive(page, 'happo_terminal', 'HappoTerminal');
  await shot(page, '01-terminal-dormant');
  await talk(page, 300);
  await useStation(page, 790, 560, 'Flow');
  const paths: Record<string, [number, number][]> = await ev(page, H("h.scene('Flow').solution()"));
  const fg: any = await ev(page, H("h.scene('Flow').geom()"));
  const c = (p: [number, number]): [number, number] => [fg.x + (p[0] + 0.5) * fg.cell, fg.y + (p[1] + 0.5) * fg.cell];
  for (const path of Object.values(paths)) {
    await page.mouse.move(...c(path[0])); await page.mouse.down();
    for (const p of path.slice(1)) await page.mouse.move(...c(p), { steps: 3 });
    await page.mouse.up(); await page.waitForTimeout(60);
  }
  await shot(page, '02-flow-solved');
  await page.mouse.click(945, 640); await page.waitForTimeout(300);
  expect((await ev<any>(page, H('h.getState().stars'))).routes).toBe(3);
  await done(page, 'HappoTerminal');
  await talk(page); await pressE(page); await pressE(page); // turn in, then read + close the next intro
  expect((await summary(page)).vitality.happo_terminal).toBe(1);
  // Regression: fetch items for a later step must appear as soon as that step starts (not only on scene load).
  expect(await ev<boolean[]>(page, H("h.scene('HappoTerminal').items.map((i) => i.visible)"))).toEqual([true, true, true, true]);
  await shot(page, '02b-ic-cards-visible');
  await fetchAll(page, [[300, 580], [470, 690], [790, 690], [1000, 610]]);
  expect((await summary(page)).inventory.ic_card).toBe(4);
  await talk(page); await pressE(page); await pressE(page); // turn in, then read + close the next intro
  expect((await summary(page)).vitality.happo_terminal).toBe(2);
  await useStation(page, 790, 560, 'Arrange');
  const slots: Record<string, [number, number]> = { t0740: [520, 90], t0815: [520, 290], t0900: [520, 190], t0930: [520, 390] };
  for (const [i, id] of ['t0740', 't0815', 't0900', 't0930'].entries()) await drag(page, [130 + i * 150, 650], [60 + slots[id][0], 110 + slots[id][1]]);
  await shot(page, '03-timetable');
  await page.mouse.click(1050, 470); await page.waitForTimeout(300);
  expect((await ev<any>(page, H('h.getState().stars'))).timetable).toBe(3);
  await done(page, 'HappoTerminal');
  await talk(page);
  let s = await summary(page);
  expect(s.vitality.happo_terminal).toBe(3);
  expect(s.unlocks).toContain('attraction:happo_terminal');
  await page.waitForTimeout(1500);
  await shot(page, '04-terminal-thriving');
  // Revival Board at the terminal: open Echoland.
  await walkTo(page, 180, 566); await pressE(page, 400);
  await waitForScene(page, 'Board');
  await shot(page, '05-terminal-board');
  await page.mouse.click(250, 320); await page.waitForTimeout(150); // first card = Echoland
  expect((await summary(page)).unlocks).toContain('road:echoland');
  await page.mouse.click(1100, 650); // Back
  await ev(page, H("h.grant('kizuna', 10)"));
  await ev(page, H("h.openRoad('happo_pond')"));
  await ev(page, H("h.openRoad('iwatake')"));

  // ================= Echoland =================
  await arrive(page, 'echoland', 'Echoland');
  await talk(page, 300);
  await useStation(page, 800, 580, 'Cook');
  await shot(page, '06-cook');
  await cook(page);
  await done(page, 'Echoland');
  await talk(page); await pressE(page); await pressE(page); // turn in, then read + close the next intro
  expect((await summary(page)).vitality.echoland).toBe(1);
  await useStation(page, 470, 540, 'Seating');
  await seat(page);
  await shot(page, '07-izakaya-seated');
  await page.mouse.click(560, 660); await page.waitForTimeout(300);
  await done(page, 'Echoland');
  await talk(page); await pressE(page); await pressE(page); // turn in, then read + close the next intro
  expect((await summary(page)).vitality.echoland).toBe(2);
  await fetchAll(page, [[300, 580], [470, 690], [790, 690], [1000, 610], [880, 660]]);
  await talk(page);
  expect((await summary(page)).vitality.echoland).toBe(3);
  await page.waitForTimeout(1200);
  await shot(page, '08-echoland-thriving');

  // ================= Happo Pond =================
  await arrive(page, 'happo_pond', 'HappoPond');
  await talk(page, 300);
  await fetchAll(page, [[300, 580], [470, 690], [760, 690], [1000, 620], [620, 680]]);
  expect((await summary(page)).inventory.hut_supplies).toBe(5);
  await talk(page); await pressE(page); await pressE(page); // turn in, then read + close the next intro
  await ev(page, H('h.rest()'));
  await useStation(page, 790, 600, 'Cairn');
  const sol: { id: string; x: number }[] = await ev(page, H("h.scene('Cairn').solution()"));
  for (const st of sol) {
    const from: [number, number] = await ev(page, H(`h.scene('Cairn').pilePos('${st.id}')`));
    await drag(page, from, [420 + st.x, 300], 6);
  }
  await shot(page, '09-cairn');
  await page.mouse.click(520, 670); await page.waitForTimeout(300);
  expect((await ev<any>(page, H('h.getState().stars'))).cairn).toBe(3);
  await done(page, 'HappoPond');
  await talk(page); await pressE(page); await pressE(page); // turn in, then read + close the next intro
  await useStation(page, 470, 540, 'Cook');
  await cook(page);
  await done(page, 'HappoPond');
  await talk(page);
  expect((await summary(page)).vitality.happo_pond).toBe(3);
  await page.waitForTimeout(1200);
  await shot(page, '10-pond-thriving');

  // ================= Iwatake (needs Tier 1) =================
  await ev(page, H('h.setChassis(1)'));
  await arrive(page, 'iwatake', 'Iwatake');
  await talk(page, 300);
  await useStation(page, 250, 580, 'Seating');
  await seat(page);
  await shot(page, '11-gondola-balanced');
  await page.mouse.click(560, 660); await page.waitForTimeout(300);
  await done(page, 'Iwatake');
  await talk(page); await pressE(page); await pressE(page); // turn in, then read + close the next intro
  await useStation(page, 780, 580, 'Build');
  const cuts: [number, number][][] = await ev(page, `(async () => (await import('/src/scenes/BuildScene.ts')).CUTS.map((c) => c.path))()`);
  for (const path of cuts) {
    await page.mouse.move(...path[0]); await page.mouse.down();
    for (const p of path.slice(1)) await page.mouse.move(p[0], p[1], { steps: 8 });
    await page.mouse.up(); await page.waitForTimeout(100);
    await page.mouse.click(1000, 640); await page.waitForTimeout(250);
  }
  await done(page, 'Iwatake');
  await talk(page); await pressE(page); await pressE(page); // turn in, then read + close the next intro
  await fetchAll(page, [[470, 690], [790, 690], [1000, 610], [560, 640]]);
  await talk(page);
  s = await summary(page);
  expect(s.vitality.iwatake).toBe(3);
  expect(s.unlocks).toEqual(expect.arrayContaining(['attraction:echoland', 'attraction:happo_pond', 'attraction:iwatake']));

  // ================= Green season + Season Report =================
  await ev(page, H("h.setSeason('green')"));
  await page.waitForTimeout(1500);
  await shot(page, '12-iwatake-green');
  // Sleep through green season in the van; the report pops up when it ends.
  for (let d = 0; d < 7; d++) {
    await walkTo(page, 1130, 670); await pressE(page, 400);
    await waitForScene(page, 'VanInterior');
    await page.mouse.click(1040, 412); // Sleep
    await page.waitForTimeout(500);
  }
  await waitForScene(page, 'SeasonReport');
  await page.waitForTimeout(400);
  await shot(page, '13-season-report');
  const reports: any[] = await ev(page, H('h.getState().reports'));
  expect(reports.at(-1).season).toBe('green');
  expect(reports.at(-1).regions.length).toBe(6);
  await page.mouse.click(955, 654);
  await waitForScene(page, 'Iwatake');
  expect(errors).toEqual([]);
});
