import { describe, expect, it } from 'vitest';
import { chooseArchetype, finishBuild } from '../../src/sim/archetype';
import { simulateSeason } from '../../src/sim/balance';
import { availableProducts, menu, priceFor, setMenu, startShift } from '../../src/sim/business';
import { createNewGame, grant, mod } from '../../src/sim/game';
import { checkPeg, evaluate, generateTent, netForce, solve, type Pegs } from '../../src/sim/puzzles/tentBalance';
import { resample, scoreTrace, type Pt } from '../../src/sim/puzzles/trace';
import { currentStep, fastForwardRegion, talk } from '../../src/sim/quests';
import { deserialize } from '../../src/sim/save';
import { canDriveTo, drive, openRoad, roadOffers } from '../../src/sim/travel';
import { buyModule, comfort, enabled, installRoof, placeModule, roofSlots, upgradeChassis, vanEffects } from '../../src/sim/van';
import type { GameState } from '../../src/sim/types';
import { CONTENT as _C } from '../../src/sim/content';

// These arcs are played in one sitting; the one-request-per-day pacing (M4) is covered in m4.test.ts.
_C.tuning.stepCooldownDays = 0;

/** A game where the station arc is done and the Snow Peak road is open. */
function afterStation(seed = 7): GameState {
  const s = createNewGame({ seed });
  fastForwardRegion(s, 'station');
  placeModule(s, 'pour_bar', 1, 0, 0);
  s.kizuna = 10;
  expect(openRoad(s, 'snowpeak').ok).toBe(true);
  return s;
}

describe('tent balance engine', () => {
  it('generates solvable tents across many seeds, with the mirror-image pegging blocked', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const p = generateTent(seed * 104729);
      const sol = solve(p)!;
      expect(sol, `seed ${seed}`).not.toBeNull();
      const e = evaluate(p, sol);
      expect(e.solved && e.perfect).toBe(true);
      for (const c of p.corners) expect(checkPeg(p, sol[c.id]!).ok).toBe(true);
    }
  });

  it('measures lean as the sum of spring pulls and rejects bad pegs', () => {
    const p = { w: 11, h: 9, center: [5, 4] as [number, number], corners: generateTent(1).corners, rocks: [[8, 7]] as [number, number][], minLen: 2, maxLen: 4 };
    const pegs: Pegs = { nw: [2, 1], ne: [8, 1], sw: [2, 7], se: [8, 6] };
    // se line is one cell shorter in y → tent leans north by one.
    expect(netForce(p, pegs)).toEqual([0, -1]);
    expect(evaluate(p, pegs)).toMatchObject({ solved: true, perfect: false, lean: 1 });
    expect(checkPeg(p, [8, 7])).toMatchObject({ ok: false, reason: 'rock' });
    expect(checkPeg(p, [5, 1])).toMatchObject({ ok: false, reason: 'axis' });
    expect(checkPeg(p, [6, 5])).toMatchObject({ ok: false, reason: 'tent' });
    expect(checkPeg(p, [7, 6])).toMatchObject({ ok: false, reason: 'short' });
    expect(checkPeg(p, [10, 8])).toMatchObject({ ok: false, reason: 'long' });
    expect(evaluate(p, { nw: [2, 1] }).solved).toBe(false);
  });
});

describe('trace engine', () => {
  const guide: Pt[] = [[0, 0], [200, 0], [200, 100]];
  it('scores a faithful trace at 3 stars and a sloppy one lower', () => {
    expect(scoreTrace(guide, resample(guide, 5), 12).stars).toBe(3);
    const wobbly = resample(guide, 5).map(([x, y], i) => [x + (i % 2 ? 30 : -30), y] as Pt);
    expect(scoreTrace(guide, wobbly, 12).stars).toBeLessThan(3);
    const half = resample([[0, 0], [100, 0]], 5);
    expect(scoreTrace(guide, half, 12).coverage).toBeLessThan(0.5);
    expect(scoreTrace(guide, [], 12).stars).toBe(0);
  });
});

describe('Snow Peak arc, archetype choice and garage', () => {
  it('drives to Snow Peak only once the road is open, spending 1 stamina', () => {
    const s = createNewGame({ seed: 3 });
    expect(canDriveTo(s, 'snowpeak')).toMatchObject({ ok: false, reason: 'road' });
    fastForwardRegion(s, 'station');
    expect(roadOffers(s)).toEqual(['snowpeak', 'happo_terminal']);
    s.kizuna = 10;
    expect(openRoad(s, 'snowpeak').ok).toBe(true);
    expect(openRoad(s, 'snowpeak')).toMatchObject({ ok: false, reason: 'open' });
    const before = s.staminaSpent;
    expect(drive(s, 'snowpeak').ok).toBe(true);
    expect(s.currentRegion).toBe('snowpeak');
    expect(s.staminaSpent).toBe(before + 1);
    expect(openRoad(s, 'happo_terminal').ok).toBe(true);
    expect(canDriveTo(s, 'happo_terminal').ok).toBe(true); // playable since M3
    s.unlocks.push('road:tsugaike');
    expect(canDriveTo(s, 'tsugaike')).toMatchObject({ ok: false, reason: 'chassis' });
  });

  it('runs tent → parts → choose soba → build → Thriving + garage', () => {
    const s = afterStation();
    drive(s, 'snowpeak');
    expect(currentStep(s, 'snowpeak')?.id).toBe('tent');
    expect(chooseArchetype(s, 'soba')).toMatchObject({ ok: false, reason: 'not_yet' });
    grant(s, 'tent_pitched'); s.stars.tent = 3;
    expect(talk(s, 'snowpeak').kind).toBe('complete');
    grant(s, 'van_part', 4);
    expect(talk(s, 'snowpeak').kind).toBe('complete');
    expect(s.regions.snowpeak.vitality).toBe(2);
    expect(currentStep(s, 'snowpeak')?.id).toBe('first_module');
    expect(chooseArchetype(s, 'soba').ok).toBe(true);
    expect(chooseArchetype(s, 'coffee')).toMatchObject({ ok: false, reason: 'chosen' });
    expect(finishBuild(s, 2)).toEqual({ moduleId: 'soba_kitchen', refund: 0 });
    s.staminaSpent = 0;
    expect(talk(s, 'snowpeak').kind).toBe('complete');
    expect(s.regions.snowpeak.vitality).toBe(3);
    expect(s.unlocks).toEqual(expect.arrayContaining(['garage', 'business:soba']));
    expect(roadOffers(s)).toContain('goryu');
  });

  it('refunds the build module when the player already bought it', () => {
    const s = afterStation();
    s.yen = 10_000;
    buyModule(s, 'pastry_case');
    fastForwardRegion(s, 'snowpeak'); // sets coffee + finishes; check the direct path too
    const t = afterStation(9);
    t.yen = 10_000; buyModule(t, 'pastry_case');
    t.regions.snowpeak.questStep = 2;
    chooseArchetype(t, 'coffee');
    const yen = t.yen;
    expect(finishBuild(t, 3)).toEqual({ moduleId: 'pastry_case', refund: 2400 });
    expect(t.yen).toBe(yen + 2400);
  });

  it('upgrades the chassis to Tier 1, opening roof slots that change shift effects', () => {
    const s = afterStation();
    expect(upgradeChassis(s)).toMatchObject({ ok: false, reason: 'no_garage' });
    fastForwardRegion(s, 'snowpeak');
    s.yen = 20_000;
    expect(roofSlots(s)).toBe(0);
    expect(upgradeChassis(s).ok).toBe(true);
    expect(s.chassisTier).toBe(1);
    expect(roofSlots(s)).toBe(2);
    expect(upgradeChassis(s)).toMatchObject({ ok: false, reason: 'yen' }); // Tier 2 exists since M4 but costs ¥18,000
    for (const m of ['solar_panel', 'ski_box', 'roof_planter']) expect(buyModule(s, m).ok).toBe(true);
    expect(placeModule(s, 'solar_panel', 0, 0, 0)).toBe(false); // roof modules don't go inside
    expect(installRoof(s, 'solar_panel').ok).toBe(true);
    expect(installRoof(s, 'ski_box').ok).toBe(true);
    expect(installRoof(s, 'roof_planter')).toMatchObject({ ok: false, reason: 'full' });
    expect(vanEffects(s)).toEqual({ stockBonus: 2, customerMult: { winter: 1.2, green: 1 }, tipMult: 1, staminaBonus: 0 });
    expect(canDriveTo(s, 'goryu')).toMatchObject({ ok: false, reason: 'road' });
  });

  it('Tinkerer pays 15% less for modules', () => {
    const s = createNewGame({ seed: 1, player: { personality: 'tinkerer' } });
    s.yen = 2000;
    expect(mod(s, 'moduleCost')).toBe(0.85);
    expect(buyModule(s, 'stove').ok).toBe(true);
    expect(s.yen).toBe(2000 - Math.round(1800 * 0.85));
  });
});

describe('menus and specialties', () => {
  it('puts the primary archetype first, caps at menu slots, and accepts a custom menu', () => {
    const s = afterStation();
    fastForwardRegion(s, 'snowpeak');
    s.primaryArchetype = 'soba';
    s.unlocks.push('business:soba');
    s.yen = 10_000;
    s.van.owned.push('soba_kitchen');
    placeModule(s, 'soba_kitchen', 2, 0, 0);
    buyModule(s, 'oyaki_griddle'); placeModule(s, 'oyaki_griddle', 0, 0, 0);
    expect(availableProducts(s)).toEqual(['kake_soba', 'onigiri', 'nozawana_oyaki', 'pour_over', 'matcha_latte']);
    expect(menu(s)).toEqual(['kake_soba', 'onigiri', 'nozawana_oyaki']);
    expect(setMenu(s, ['kake_soba', 'pour_over'])).toBe(true);
    expect(menu(s)).toEqual(['kake_soba', 'pour_over']);
    expect(setMenu(s, ['apple_pastry'])).toBe(false);
    const r = startShift(s);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.plan.prep).toEqual(['cup', 'bowl']);
    const c = r.plan.customers[0];
    const soba = priceFor(r.plan, { ...c, wants: 'kake_soba' }, { idx: 0, item: 'kake_soba', stars: 2, waitedFrac: 0.9 });
    const coffee = priceFor(r.plan, { ...c, wants: 'pour_over' }, { idx: 0, item: 'pour_over', stars: 2, waitedFrac: 0.9 });
    expect(soba.yen).toBe(Math.round(800 * 1.15)); // specialty bonus
    expect(coffee.yen).toBe(450);
    expect(enabled(s).has('kake_soba')).toBe(true);
    expect(comfort(s)).toBeGreaterThan(0);
  });

  it('migrates a v2 save (M1) to the current version', () => {
    const s = createNewGame({ seed: 5 }) as any;
    s.version = 2; delete s.van.roof; delete s.business.menu;
    const t = deserialize(JSON.stringify(s))!;
    expect(t.version).toBe(5);
    expect(t.helpers).toEqual([]);
    expect(t.reports).toEqual([]);
    expect(t.van.roof).toEqual([]);
    expect(t.business.menu).toBeNull();
  });
});

describe('balance sim: the build changes earnings', () => {
  /** Thriving station + Snow Peak, the van parked at the station, with a given build. */
  function build(kind: 'starter' | 'coffee' | 'soba' | 'soba_t1'): GameState {
    const s = afterStation(11);
    fastForwardRegion(s, 'snowpeak');
    s.currentRegion = 'station';
    s.yen = 100_000;
    s.business.reputation = 20;
    if (kind === 'starter') { s.primaryArchetype = null; s.unlocks = s.unlocks.filter((u) => u !== 'business:soba'); }
    if (kind === 'coffee') { s.primaryArchetype = 'coffee'; buyModule(s, 'pastry_case'); placeModule(s, 'pastry_case', 2, 0, 0); }
    if (kind === 'soba' || kind === 'soba_t1') {
      s.primaryArchetype = 'soba'; s.unlocks.push('business:soba');
      s.van.owned.push('soba_kitchen');
      s.van.placed = s.van.placed.filter((p) => p.moduleId !== 'pour_bar');
      placeModule(s, 'soba_kitchen', 0, 0, 0);
      buyModule(s, 'oyaki_griddle'); placeModule(s, 'oyaki_griddle', 2, 0, 0);
    }
    if (kind === 'soba_t1') {
      upgradeChassis(s);
      buyModule(s, 'ski_box'); installRoof(s, 'ski_box');
      buyModule(s, 'solar_panel'); installRoof(s, 'solar_panel');
    }
    s.yen = 0;
    return s;
  }

  it('reports per-season earnings that differ by build', () => {
    const rows = (['starter', 'coffee', 'soba', 'soba_t1'] as const).map((k) => {
      const w = simulateSeason(build(k), 'winter');
      const g = simulateSeason(build(k), 'green');
      return { build: k, winterYen: w.yen, greenYen: g.yen, winterPerShift: w.perShift, greenPerShift: g.perShift, winterSoldOut: w.soldOut };
    });
    // eslint-disable-next-line no-console
    console.table(rows);
    const by = Object.fromEntries(rows.map((r) => [r.build, r]));
    expect(by.coffee.winterYen).toBeGreaterThan(by.starter.winterYen); // pastry case + specialty
    expect(by.soba.winterYen).toBeGreaterThan(by.coffee.winterYen * 0.9); // soba is the winter archetype
    expect(by.soba_t1.winterYen).toBeGreaterThan(by.soba.winterYen * 1.1); // roof modules pay off
    expect(by.soba.greenYen).toBeLessThan(by.soba.winterYen); // green season is the hard one
    expect(by.coffee.greenYen / by.coffee.winterYen).toBeGreaterThan(by.soba.greenYen / by.soba.winterYen); // coffee is steadier
  });
});
