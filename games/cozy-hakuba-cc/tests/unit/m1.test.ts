import { describe, expect, it } from 'vitest';
import { menu, settleShift, startShift } from '../../src/sim/business';
import { CONTENT } from '../../src/sim/content';
import { createNewGame, endDay, grant, jumpToSeason, staminaLeft } from '../../src/sim/game';
import { canPlace, generate, isSolved, normalize, place, rotate } from '../../src/sim/puzzles/gridPacking';
import { currentStep, findKodama, recordResult, talk } from '../../src/sim/quests';
import { deserialize, serialize } from '../../src/sim/save';
import { buyModule, comfort, comfortStaminaBonus, enabled, placeModule } from '../../src/sim/van';

describe('grid packing engine', () => {
  it('rotates and normalizes shapes', () => {
    const L = normalize([[0, 0], [0, 1], [1, 1]]);
    expect(rotate(L, 4)).toEqual(L);
    expect(rotate(rotate(L, 1), 3)).toEqual(L);
    expect(rotate([[0, 0], [1, 0]], 1)).toEqual([[0, 0], [0, 1]]);
  });

  it('rejects overlaps and out-of-bounds placements', () => {
    const board = { w: 3, h: 2, blocked: [[2, 0]] as [number, number][] };
    const pieces = [{ id: 'a', shape: [[0, 0], [1, 0]] as [number, number][] }, { id: 'b', shape: [[0, 0]] as [number, number][] }];
    const placed = place(board, pieces, [], { id: 'a', x: 0, y: 0, rot: 0 })!;
    expect(placed).toHaveLength(1);
    expect(canPlace(board, pieces, placed, { id: 'b', x: 1, y: 0, rot: 0 })).toBe(false); // overlap
    expect(canPlace(board, pieces, placed, { id: 'b', x: 2, y: 0, rot: 0 })).toBe(false); // blocked
    expect(canPlace(board, pieces, placed, { id: 'b', x: 3, y: 0, rot: 0 })).toBe(false); // out of bounds
    expect(canPlace(board, pieces, placed, { id: 'a', x: 1, y: 1, rot: 0 })).toBe(true); // moving a piece ignores itself
  });

  it('generates solvable puzzles across many seeds and sizes', () => {
    for (let seed = 1; seed <= 60; seed++) {
      for (const [w, h] of [[4, 3], [5, 3], [5, 4], [6, 4]]) {
        const g = generate(w, h, seed * 7919, { minSize: 2, maxSize: 4, blocked: seed % 3 === 0 ? [[w - 1, 0]] : [] });
        let placed: { id: string; x: number; y: number; rot: number }[] = [];
        for (const s of g.solution) {
          const next = place(g.board, g.pieces, placed, s);
          expect(next, `seed ${seed} ${w}x${h} piece ${s.id}`).not.toBeNull();
          placed = next!;
        }
        expect(isSolved(g.board, g.pieces, placed)).toBe(true);
        expect(g.pieces.every((p) => p.shape.length >= 1 && p.shape.length <= 5)).toBe(true);
      }
    }
  });
});

describe('station quest arc', () => {
  it('fetch → create → puzzle wakes the station to Thriving and unlocks coffee + board', () => {
    const s = createNewGame();
    expect(talk(s, 'station').kind).toBe('intro');
    expect(talk(s, 'station').kind).toBe('progress');
    grant(s, 'brochure', 5);
    const r1 = talk(s, 'station');
    expect(r1.kind).toBe('complete');
    expect(s.regions.station.vitality).toBe(1);
    expect(s.inventory.blank_map).toBe(1);
    expect(s.inventory.brochure).toBeUndefined();

    expect(currentStep(s, 'station')!.type).toBe('create');
    recordResult(s, 'valley_map', 3, 'valley_map');
    expect(talk(s, 'station').kind).toBe('complete');
    expect(s.regions.station.vitality).toBe(2);
    expect(s.unlocks).toContain('business:coffee');
    expect(s.van.owned).toContain('pour_bar');

    recordResult(s, 'luggage', 2, 'luggage_solved');
    const r3 = talk(s, 'station');
    expect(r3.kind).toBe('complete');
    if (r3.kind === 'complete') expect(r3.kizuna).toBe(6); // 5 + 1 bonus for 2 stars
    expect(s.regions.station.vitality).toBe(3);
    expect(s.unlocks).toContain('revival_board');
    expect(talk(s, 'station').kind).toBe('done');
  });

  it('turning in costs stamina and refuses when exhausted', () => {
    const s = createNewGame();
    grant(s, 'brochure', 5);
    s.staminaSpent = s.staminaMax - 1;
    expect(talk(s, 'station').kind).toBe('tired');
    expect(s.regions.station.vitality).toBe(0);
    s.staminaSpent = 0;
    talk(s, 'station');
    expect(staminaLeft(s)).toBe(s.staminaMax - CONTENT.tuning.actionCosts.questStep);
  });

  it('kodama appear one per vitality level', () => {
    const s = createNewGame();
    expect(findKodama(s, 'station', 0)).toBe(false);
    s.regions.station.vitality = 2;
    expect(findKodama(s, 'station', 0)).toBe(true);
    expect(findKodama(s, 'station', 0)).toBe(false);
    expect(findKodama(s, 'station', 2)).toBe(false);
    expect(findKodama(s, 'station', 1)).toBe(true);
    expect(s.kizuna).toBe(2);
  });
});

describe('van modules', () => {
  it('starts with futon + workbench, comfort feeds next-day stamina', () => {
    const s = createNewGame();
    expect(comfort(s)).toBe(2);
    expect(comfortStaminaBonus(s)).toBe(1);
    endDay(s);
    expect(s.staminaMax).toBe(CONTENT.tuning.baseStamina + 1);
  });

  it('buying and placing respects yen and grid space', () => {
    const s = createNewGame();
    expect(buyModule(s, 'pour_bar')).toEqual({ ok: false, reason: 'locked' });
    s.yen = 100;
    expect(buyModule(s, 'stove')).toEqual({ ok: false, reason: 'yen' });
    s.yen = 10_000;
    expect(buyModule(s, 'pastry_case')).toEqual({ ok: true });
    expect(placeModule(s, 'pastry_case', 0, 1, 0)).toBe(false); // futon is there
    expect(placeModule(s, 'pastry_case', 0, 0, 0)).toBe(true);
    expect(enabled(s).has('apple_pastry')).toBe(true);
  });
});

describe('coffee business', () => {
  const ready = () => {
    const s = createNewGame();
    s.unlocks.push('business:coffee');
    s.van.owned.push('pour_bar');
    placeModule(s, 'pour_bar', 2, 1, 0);
    return s;
  };

  it('is locked until the quest unlocks it', () => {
    expect(startShift(createNewGame())).toEqual({ ok: false, reason: 'locked' });
  });

  it('plans deterministic customers whose wants are on the menu', () => {
    const a = ready(), b = ready();
    const pa = startShift(a), pb = startShift(b);
    expect(pa).toEqual(pb);
    if (!pa.ok) throw new Error('expected ok');
    expect(menu(a)).toEqual(['pour_over', 'matcha_latte']);
    expect(pa.plan.customers.length).toBeGreaterThanOrEqual(CONTENT.business.shift.minCustomers);
    for (const c of pa.plan.customers) expect(pa.plan.menu).toContain(c.wants);
    expect(staminaLeft(a)).toBe(a.staminaMax - CONTENT.tuning.actionCosts.businessShift);
  });

  it('winter brings more customers than green to a thriving station', () => {
    const w = ready(); w.regions.station.vitality = 3; jumpToSeason(w, 'winter');
    const g = ready(); g.regions.station.vitality = 3; jumpToSeason(g, 'green');
    const pw = startShift(w), pg = startShift(g);
    if (!pw.ok || !pg.ok) throw new Error('expected ok');
    expect(pw.plan.customers.length).toBeGreaterThan(pg.plan.customers.length);
    expect(pg.plan.customers.some((c) => c.type === 'hiker')).toBe(true);
  });

  it('settling pays for correct orders, tips fast service, and tracks reputation', () => {
    const s = ready();
    const r = startShift(s);
    if (!r.ok) throw new Error('expected ok');
    const [c0, c1] = r.plan.customers;
    const yen0 = s.yen;
    const sum = settleShift(s, r.plan, [
      { idx: c0.idx, item: c0.wants, stars: 3, waitedFrac: 0.2 },
      { idx: c1.idx, item: c1.wants === 'pour_over' ? 'matcha_latte' : 'pour_over', stars: 2, waitedFrac: 0.3 },
    ]);
    expect(sum.served).toBe(2);
    expect(sum.missed).toBe(0);
    expect(sum.soldOut).toBe(r.plan.customers.length - 2); // never reached the window: no reputation loss
    expect(sum.reputation).toBe(1);
    expect(sum.tips).toBeGreaterThan(0);
    expect(s.yen).toBe(yen0 + sum.yen + sum.tips);
    expect(s.business.shifts).toBe(1);
  });
});

describe('saves', () => {
  it('round-trips and rejects junk', () => {
    const s = createNewGame({ player: { name: 'Mika' } });
    grant(s, 'brochure', 2);
    const back = deserialize(serialize(s))!;
    expect(back).toEqual(s);
    expect(deserialize('not json')).toBeNull();
    expect(deserialize(JSON.stringify({ version: 1 }))).toBeNull();
    expect(deserialize(null)).toBeNull();
  });
});
