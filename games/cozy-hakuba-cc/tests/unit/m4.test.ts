import { describe, expect, it } from 'vitest';
import manifest from '../../content/asset-manifest.json';
import { simulateGame } from '../../src/sim/bot';
import { availableProducts, menu, menuSlots, startShift } from '../../src/sim/business';
import { CONTENT } from '../../src/sim/content';
import { createNewGame, endDay, jumpToSeason } from '../../src/sim/game';
import { checkEnding, chooseSecondary, endingProgress, hireHelper, rankDef } from '../../src/sim/progression';
import { evaluate as composeEval, solveCompose, type ComposePuzzle } from '../../src/sim/puzzles/compose';
import { generate, isSolved, place } from '../../src/sim/puzzles/gridPacking';
import { currentStep, fastForwardRegion, talk } from '../../src/sim/quests';
import { canDriveTo, openRoad } from '../../src/sim/travel';
import { buyModule, dailyStamina, placeModule, upgradeChassis } from '../../src/sim/van';
import type { GameState } from '../../src/sim/types';

const SOUTH = ['goryu', 'hakuba47', 'tsugaike', 'aokiko'];
const OVERLAYS = ['Flow', 'Seating', 'Cairn', 'Cook', 'Arrange', 'Build', 'Pack', 'Compose'];

function allRestored(seed = 3): GameState {
  const s = createNewGame({ seed });
  for (const r of CONTENT.regions) fastForwardRegion(s, r.id);
  return s;
}

describe('M4 content', () => {
  it('all 10 regions are playable; every data region references real art, steps and overlays', () => {
    expect(CONTENT.regions.every((r) => r.playable)).toBe(true);
    const ids = new Set(manifest.assets.map((a) => a.id));
    for (const [id, L] of Object.entries(CONTENT.layouts)) {
      const q = CONTENT.quests[id];
      const tex = [L.keyPerson.texture, L.fetch.texture, ...L.landmarks.map((l) => l.texture), ...L.stations.flatMap((s) => (s.texture ? [s.texture] : []))];
      for (const t of tex) expect(ids.has(t), `${id}: ${t}`).toBe(true);
      for (const st of L.stations) {
        expect(OVERLAYS, `${id} ${st.overlay}`).toContain(st.overlay);
        expect(CONTENT.minigames[st.config], st.config).toBeTruthy();
        for (const s of st.steps) expect(q.steps.map((x) => x.id)).toContain(s);
      }
      expect(q.steps.map((s) => s.type).sort()).toEqual(['create', 'fetch', 'puzzle']);
      const f = q.steps.find((s) => s.id === L.fetch.step)!;
      expect(L.fetch.spots.length).toBeGreaterThanOrEqual(f.needs[L.fetch.item]);
    }
    for (const id of SOUTH) expect(CONTENT.layouts[id], id).toBeTruthy();
    expect(CONTENT.helpers.map((h) => h.region).sort()).toEqual(CONTENT.regions.map((r) => r.id).sort());
  });

  it('the lake photo is solvable and the garden plot packs', () => {
    const p = CONTENT.minigames.lake_photo as unknown as ComposePuzzle;
    const sol = solveCompose(p)!;
    expect(sol).not.toBeNull();
    expect(composeEval(p, ...sol).solved).toBe(true);
    expect(composeEval(p, 0, 0).solved).toBe(false);
    for (let seed = 1; seed <= 30; seed++) {
      const g = generate(5, 4, seed * 101, { minSize: 2, maxSize: 5 });
      let placed: { id: string; x: number; y: number; rot: number }[] = [];
      for (const s of g.solution) placed = place(g.board, g.pieces, placed, s)!;
      expect(isSolved(g.board, g.pieces, placed)).toBe(true);
    }
  });
});

describe('pacing: one request per key person per day', () => {
  it('a finished step waits until tomorrow to be turned in', () => {
    const s = createNewGame({ seed: 1 });
    s.inventory.brochure = 5;
    expect(talk(s, 'station').kind).toBe('complete');
    s.inventory.valley_map = 1;
    expect(talk(s, 'station').kind).toBe('resting');
    expect(currentStep(s, 'station')?.id).toBe('valley_map');
    endDay(s);
    expect(talk(s, 'station').kind).toBe('complete');
  });
});

describe('chassis tiers 2–3 and south roads', () => {
  it('Tier 2 grows the van to 6×3 and opens 47 / Aoki; Tier 3 reaches Tsugaike', () => {
    const s = createNewGame({ seed: 2 });
    for (const r of ['station', 'snowpeak', 'happo_terminal', 'iwatake', 'goryu']) fastForwardRegion(s, r);
    s.kizuna = 200; s.yen = 200_000;
    for (const r of ['snowpeak', 'happo_terminal', 'iwatake', 'goryu', 'hakuba47', 'tsugaike']) openRoad(s, r);
    expect(canDriveTo(s, 'hakuba47')).toMatchObject({ ok: false, reason: 'chassis' });
    upgradeChassis(s); upgradeChassis(s);
    expect(s.chassisTier).toBe(2);
    expect(s.van.grid).toEqual({ w: 6, h: 3 });
    expect(canDriveTo(s, 'hakuba47').ok).toBe(true);
    expect(canDriveTo(s, 'tsugaike')).toMatchObject({ ok: false, reason: 'chassis' });
    upgradeChassis(s);
    expect(s.van.grid).toEqual({ w: 8, h: 3 });
    expect(canDriveTo(s, 'tsugaike').ok).toBe(true);
  });
});

describe('ranks, second trade and helpers', () => {
  it('rank rises with reputation and restored regions, widening the menu', () => {
    const s = createNewGame({ seed: 4 });
    expect(rankDef(s).rank).toBe(1);
    s.business.reputation = 50;
    expect(rankDef(s).rank).toBe(1); // regions hold it back
    for (const r of ['station', 'snowpeak', 'happo_terminal', 'echoland', 'happo_pond']) fastForwardRegion(s, r);
    expect(rankDef(s).rank).toBe(3);
    expect(menuSlots(s)).toBe(5);
  });

  it('a second trade unlocks its modules, and its session products join the menu', () => {
    const s = createNewGame({ seed: 5 });
    for (const r of ['station', 'snowpeak', 'happo_terminal', 'echoland', 'happo_pond']) fastForwardRegion(s, r);
    s.yen = 50_000;
    expect(buyModule(s, 'tent_sauna')).toMatchObject({ ok: false, reason: 'locked' });
    expect(buyModule(s, 'oyaki_griddle')).toMatchObject({ ok: false, reason: 'locked' }); // coffee player
    expect(chooseSecondary(s, 'sauna')).toMatchObject({ ok: false, reason: 'rank' });
    s.business.reputation = 45;
    expect(chooseSecondary(s, 'coffee')).toMatchObject({ ok: false, reason: 'same' });
    expect(chooseSecondary(s, 'sauna').ok).toBe(true);
    expect(buyModule(s, 'tent_sauna').ok).toBe(true);
    s.van.placed = s.van.placed.filter((p) => p.moduleId !== 'workbench');
    placeModule(s, 'pour_bar', 0, 0, 0);
    expect(placeModule(s, 'tent_sauna', 2, 0, 0)).toBe(true);
    expect(availableProducts(s)).toEqual(['pour_over', 'matcha_latte', 'sauna_session', 'herbal_tea']);
    s.currentRegion = 'station';
    jumpToSeason(s, 'green');
    const r = startShift(s);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.plan.shelf.sauna_session).toBe(CONTENT.business.shift.sessionStock);
    expect(menu(s)).toContain('sauna_session');
  });

  it('helpers need a Thriving region, a free slot and kizuna, and change the van', () => {
    const s = createNewGame({ seed: 6 });
    for (const r of ['station', 'snowpeak', 'happo_terminal', 'echoland', 'happo_pond']) fastForwardRegion(s, r);
    s.kizuna = 20;
    expect(hireHelper(s, 'happo_pond')).toMatchObject({ ok: false, reason: 'slots' });
    s.business.reputation = 45;
    expect(hireHelper(s, 'goryu')).toMatchObject({ ok: false, reason: 'not_thriving' });
    const base = dailyStamina(s);
    expect(hireHelper(s, 'happo_pond').ok).toBe(true);
    expect(dailyStamina(s)).toBe(base + 1);
    expect(s.kizuna).toBe(15);
    expect(hireHelper(s, 'station')).toMatchObject({ ok: false, reason: 'slots' });
  });
});

describe('ending', () => {
  it('needs every region, Rank 5 and the latest winter + green both Thriving', () => {
    const s = allRestored();
    s.business.reputation = 200;
    expect(endingProgress(s)).toEqual({ regions: true, rank5: true, seasons: false });
    s.seasonStats.byRegion = Object.fromEntries(CONTENT.regions.map((r) => [r.id, 3]));
    jumpToSeason(s, 'winter');
    let ended = false;
    for (let d = 0; d < 20 && !ended; d++) {
      for (const r of CONTENT.regions) s.seasonStats.byRegion[r.id] = 3;
      ended = endDay(s).ending;
    }
    expect(ended).toBe(true);
    expect(s.ending).not.toBeNull();
    expect(s.reports.slice(-2).map((r) => r.season)).toEqual(['winter', 'green']);
    expect(checkEnding(s)).toBe(true);
  });
});

describe('balance sim: the whole game reaches the ending', () => {
  it('both trades reach the Hakuba Valley Festival in 35–45 in-game days', () => {
    const rows = (['coffee', 'soba'] as const).map((primary) => {
      const r = simulateGame({ primary });
      const m = r.milestones;
      const allThriving = Math.max(...Object.entries(m).filter(([k]) => k.startsWith('thriving')).map(([, v]) => v));
      return { primary, ending: r.endingDay, tier1: m.tier1, tier2: m.tier2, tier3: m.tier3, rank3: m.rank3, rank5: m.rank5, allThriving, secondary: r.final.secondary, yen: r.final.yen };
    });
    // eslint-disable-next-line no-console
    console.table(rows);
    for (const r of rows) {
      expect(r.ending, r.primary).not.toBeNull();
      expect(r.ending!).toBeGreaterThanOrEqual(35);
      expect(r.ending!).toBeLessThanOrEqual(45);
      expect(r.tier1).toBeLessThanOrEqual(8);
      expect(r.tier3).toBeGreaterThan(r.tier2);
    }
  });
});
