import { describe, expect, it } from 'vitest';
import { evaluate as cairnEval, failPoint, generateCairn } from '../../src/sim/puzzles/cairn';
import { coverage, generateFlow, isSolved as flowSolved, overlaps, pathValid } from '../../src/sim/puzzles/flow';
import { checkConstraint, countSolutions, describe as describeC, generateSeating, isSolved as seatSolved, neighbours, type Guest } from '../../src/sim/puzzles/seating';

const GUESTS: Guest[] = ['aki', 'ben', 'chie', 'dai', 'emi', 'fumi'].map((id, i) => ({ id, name: id, weight: [1, 2, 3, 2, 1, 3][i] }));

describe('seating engine', () => {
  it('counter neighbours and cabin benches', () => {
    expect(neighbours('counter', 6, 0)).toEqual([1]);
    expect(neighbours('counter', 6, 3)).toEqual([2, 4]);
    expect(neighbours('cabin', 6, 2)).toEqual([1]); // end of the left bench
    expect(neighbours('cabin', 6, 3)).toEqual([4]);
  });

  it('generates puzzles whose hidden solution satisfies every wish, mostly unique', () => {
    let unique = 0;
    for (let seed = 1; seed <= 40; seed++) {
      for (const layout of ['counter', 'cabin'] as const) {
        const p = generateSeating(seed * 7919, layout, GUESTS);
        expect(seatSolved(p, p.solution), `${layout} ${seed}`).toBe(true);
        expect(p.constraints.length).toBeGreaterThan(0);
        if (layout === 'counter' && countSolutions(p, 2) === 1) unique++;
        for (const c of p.constraints) expect(describeC(c, GUESTS).length).toBeGreaterThan(5);
      }
    }
    expect(unique).toBeGreaterThanOrEqual(30); // most counters have exactly one answer (cabin benches can mirror)
  });

  it('reports open / ok / bad per wish', () => {
    const p = generateSeating(3, 'counter', GUESTS);
    const c = { kind: 'next' as const, a: 'aki', b: 'ben' };
    expect(checkConstraint(p, c, [null, null, null, null, null, null])).toBe('open');
    expect(checkConstraint(p, c, ['aki', 'ben', null, null, null, null])).toBe('ok');
    expect(checkConstraint(p, c, ['aki', null, 'ben', null, null, null])).toBe('bad');
  });
});

describe('flow engine', () => {
  it('generates solvable non-crossing route puzzles', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const p = generateFlow(seed * 31337, 6, 5, 4, ['a', 'b', 'c', 'd']);
      expect(p.pairs).toHaveLength(4);
      for (const pair of p.pairs) expect(pathValid(p, pair, p.solution[pair.id]), `seed ${seed} ${pair.id}`).toBe(true);
      expect(overlaps(p.solution)).toBe(false);
      expect(flowSolved(p, p.solution)).toBe(true);
      expect(coverage(p, p.solution)).toBeGreaterThan(0.3);
    }
  });

  it('rejects broken, crossing and stop-trampling paths', () => {
    const p = { w: 3, h: 3, pairs: [{ id: 'a', a: [0, 0] as [number, number], b: [2, 0] as [number, number] }, { id: 'b', a: [0, 2] as [number, number], b: [2, 2] as [number, number] }], solution: {} };
    expect(pathValid(p, p.pairs[0], [[0, 0], [1, 0], [2, 0]])).toBe(true);
    expect(pathValid(p, p.pairs[0], [[0, 0], [2, 0]])).toBe(false);
    expect(pathValid(p, p.pairs[0], [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 1], [2, 0]])).toBe(false); // walks over b's stops
    expect(overlaps({ a: [[0, 0], [1, 0], [1, 1]], b: [[1, 1], [1, 2]] })).toBe(true);
  });
});

describe('cairn engine', () => {
  it('generates stackable cairns whose top stone points at the trail marker', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const p = generateCairn(seed * 7);
      const e = cairnEval(p, p.solution);
      expect(e, `seed ${seed}`).toEqual({ stable: true, complete: true, pointing: true, solved: true });
      expect(p.target).toBeGreaterThan(20); // it really leans toward the trail
    }
  });

  it('topples when the stones above overhang', () => {
    const p = { stones: [{ id: 'a', w: 100, h: 30 }, { id: 'b', w: 100, h: 30 }], baseW: 170, target: 0, tolerance: 10, solution: [] };
    expect(failPoint(p, [{ id: 'a', x: 0 }, { id: 'b', x: 40 }])).toBeNull();
    expect(failPoint(p, [{ id: 'a', x: 0 }, { id: 'b', x: 60 }])).toBe(0);
    expect(failPoint(p, [{ id: 'a', x: 100 }])).toBe(-1); // off the base rock
  });
});

import manifest from '../../content/asset-manifest.json';
import { attractionMult, demandFor } from '../../src/sim/business';
import { CONTENT } from '../../src/sim/content';
import { createNewGame, endDay, jumpToSeason } from '../../src/sim/game';
import { currentStep, fastForwardRegion, talk } from '../../src/sim/quests';
import { regionBuzz } from '../../src/sim/report';
import { canDriveTo, openRoad, roadOffers } from '../../src/sim/travel';

const NORTH = ['happo_terminal', 'echoland', 'happo_pond', 'iwatake'];
const OVERLAYS = ['Flow', 'Seating', 'Cairn', 'Cook', 'Arrange', 'Build'];

describe('north-arm content', () => {
  it('every layout references real art, real quest steps, known overlays and enough fetch spots', () => {
    const ids = new Set(manifest.assets.map((a) => a.id));
    for (const id of NORTH) {
      const L = CONTENT.layouts[id];
      const q = CONTENT.quests[id];
      expect(L, id).toBeTruthy();
      expect(q, id).toBeTruthy();
      const textures = [L.keyPerson.texture, L.fetch.texture, ...(L.vanTexture ? [L.vanTexture] : []), ...L.landmarks.map((l) => l.texture), ...L.stations.flatMap((s) => (s.texture ? [s.texture] : []))];
      for (const t of textures) expect(ids.has(t), `${id}: ${t}`).toBe(true);
      const stepIds = q.steps.map((s) => s.id);
      for (const st of L.stations) {
        expect(OVERLAYS).toContain(st.overlay);
        expect(CONTENT.minigames[st.config], st.config).toBeTruthy();
        for (const s of st.steps) expect(stepIds).toContain(s);
      }
      const fetchStep = q.steps.find((s) => s.id === L.fetch.step)!;
      expect(fetchStep.type).toBe('fetch');
      expect(L.fetch.spots.length).toBeGreaterThanOrEqual(fetchStep.needs[L.fetch.item]);
      // Each region uses fetch, create and puzzle exactly once.
      expect(q.steps.map((s) => s.type).sort()).toEqual(['create', 'fetch', 'puzzle']);
      expect(CONTENT.regions.find((r) => r.id === id)!.playable).toBe(true);
    }
    // Step ids are global (stars are keyed by them).
    const all = Object.values(CONTENT.quests).flatMap((q) => q.steps.map((s) => s.id));
    expect(new Set(all).size).toBe(all.length);
  });

  it('opens the north arm in order: terminal → echoland / pond / iwatake (Tier 1)', () => {
    const s = createNewGame({ seed: 5 });
    fastForwardRegion(s, 'station');
    s.kizuna = 100;
    openRoad(s, 'happo_terminal');
    expect(canDriveTo(s, 'happo_terminal').ok).toBe(true);
    expect(roadOffers(s)).not.toContain('echoland');
    s.currentRegion = 'happo_terminal';
    expect(currentStep(s, 'happo_terminal')?.id).toBe('routes');
    expect(talk(s, 'happo_terminal').kind).toBe('intro');
    fastForwardRegion(s, 'happo_terminal');
    expect(s.regions.happo_terminal.vitality).toBe(3);
    expect(s.unlocks).toContain('attraction:happo_terminal');
    expect(roadOffers(s)).toEqual(expect.arrayContaining(['echoland', 'happo_pond', 'iwatake']));
    for (const r of ['echoland', 'happo_pond', 'iwatake']) openRoad(s, r);
    s.currentRegion = 'station';
    expect(canDriveTo(s, 'echoland').ok).toBe(true);
    expect(canDriveTo(s, 'happo_pond').ok).toBe(true);
    expect(canDriveTo(s, 'iwatake')).toMatchObject({ ok: false, reason: 'chassis' });
  });
});

describe('attractions and the Season Report', () => {
  it('restored green-season attractions lift green demand far more than winter demand', () => {
    const s = createNewGame({ seed: 8 });
    fastForwardRegion(s, 'station');
    s.unlocks.push('business:coffee');
    jumpToSeason(s, 'green');
    const before = demandFor(s);
    for (const r of NORTH) fastForwardRegion(s, r);
    expect(attractionMult(s, 'green')).toBeCloseTo(1 + 0.1 + 0.12 + 0.25 + 0.25, 5);
    expect(attractionMult(s, 'winter')).toBeLessThan(attractionMult(s, 'green'));
    expect(demandFor(s) / before).toBeGreaterThan(1.6);
  });

  it('writes a report when winter ends, with buzz per restored region and gentle tips', () => {
    const s = createNewGame({ seed: 9 });
    fastForwardRegion(s, 'station');
    jumpToSeason(s, 'winter');
    s.seasonStats.byRegion.station = 3;
    s.seasonStats.shifts = 3;
    expect(regionBuzz(s, 'station', 'winter').buzz).toBeGreaterThan(70);
    let report = null;
    for (let d = 0; d < 7 && !report; d++) report = endDay(s).report;
    expect(report).not.toBeNull();
    expect(report!.season).toBe('winter');
    expect(report!.regions.map((r) => r.region)).toEqual(['station']);
    expect(report!.rating).toBe('Thriving');
    expect(report!.tips.length).toBeGreaterThan(0);
    expect(s.reports).toHaveLength(1);
    expect(s.seasonStats.shifts).toBe(0); // reset for spring
    // Spring isn't scored: no report when it ends.
    let next = null;
    for (let d = 0; d < 2; d++) next = endDay(s).report ?? next;
    expect(next).toBeNull();
  });
});

import { simulateSeason } from '../../src/sim/balance';
import { buyModule, placeModule } from '../../src/sim/van';

describe('balance sim: the north arm makes green season viable', () => {
  function coffeeVan(north: boolean) {
    const s = createNewGame({ seed: 11 });
    fastForwardRegion(s, 'station');
    fastForwardRegion(s, 'snowpeak'); // coffee by default
    if (north) for (const r of NORTH) fastForwardRegion(s, r);
    s.currentRegion = 'station';
    s.yen = 100_000;
    s.business.reputation = 20;
    placeModule(s, 'pour_bar', 1, 0, 0);
    buyModule(s, 'pastry_case'); placeModule(s, 'pastry_case', 2, 0, 0);
    buyModule(s, 'stove');
    s.yen = 0;
    return s;
  }

  it('green-season earnings rise once the north-arm attractions are open', () => {
    const rows = [false, true].map((north) => {
      const w = simulateSeason(coffeeVan(north), 'winter');
      const g = simulateSeason(coffeeVan(north), 'green');
      return { build: north ? 'coffee + north arm' : 'coffee, south only', winterPerShift: w.perShift, greenPerShift: g.perShift, greenSoldOut: g.soldOut };
    });
    // eslint-disable-next-line no-console
    console.table(rows);
    expect(rows[1].greenPerShift).toBeGreaterThan(rows[0].greenPerShift);
    expect(rows[1].greenSoldOut).toBeGreaterThan(rows[0].greenSoldOut); // demand now outruns a small van's stock
  });
});
