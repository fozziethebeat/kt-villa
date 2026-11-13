import { describe, expect, it } from 'vitest';
import { CONTENT } from '../../src/sim/content';
import { canTravelTo, createNewGame, endDay, grant, jumpToSeason, phase, season, setVitality, spendAction, staminaLeft } from '../../src/sim/game';
import { nextRandom } from '../../src/sim/rng';
import { seasonForDay, yearLength } from '../../src/sim/seasons';

describe('content', () => {
  it('has 10 regions with valid, symmetric connections', () => {
    expect(CONTENT.regions).toHaveLength(10);
    const ids = new Set(CONTENT.regions.map((r) => r.id));
    for (const r of CONTENT.regions) {
      for (const c of r.connects) {
        expect(ids.has(c), `${r.id} -> ${c}`).toBe(true);
        expect(CONTENT.regions.find((x) => x.id === c)!.connects, `${c} should link back to ${r.id}`).toContain(r.id);
      }
      for (const req of r.requires.regions) expect(ids.has(req)).toBe(true);
    }
  });

  it('includes Happo Pond as region 5; coffee and soba are the first-trade choices', () => {
    expect(CONTENT.regions.find((r) => r.order === 5)!.id).toBe('happo_pond');
    expect(CONTENT.archetypes.filter((a) => a.primaryChoice).map((a) => a.id)).toEqual(['coffee', 'soba']);
  });

  it('every region is reachable from the station', () => {
    const seen = new Set(['station']);
    const queue = ['station'];
    while (queue.length) {
      const id = queue.shift()!;
      const cur = CONTENT.regions.find((r) => r.id === id)!;
      for (const c of cur.connects) if (!seen.has(c)) { seen.add(c); queue.push(c); }
    }
    expect(seen.size).toBe(10);
  });
});

describe('seasons', () => {
  const cal = CONTENT.tuning.calendar;
  it('starts in late autumn, then winter, and cycles', () => {
    expect(seasonForDay(1, cal).season).toBe('autumn');
    expect(seasonForDay(3, cal)).toMatchObject({ season: 'winter', dayInSeason: 1, scored: true });
    const len = yearLength(cal);
    expect(seasonForDay(len + 1, cal)).toMatchObject({ season: 'autumn', year: 2 });
  });
  it('alternates scored winter and green seasons', () => {
    const scored = cal.filter((c) => c.scored).map((c) => c.season);
    expect(scored).toEqual(['winter', 'green']);
  });
});

describe('action budget day loop', () => {
  it('spends stamina, advances phases, and blocks when exhausted', () => {
    const s = createNewGame();
    expect(phase(s)).toBe('morning');
    expect(spendAction(s, 'businessShift')).toEqual({ ok: true, cost: 3 });
    expect(phase(s)).toBe('afternoon');
    while (spendAction(s, 'forage').ok) { /* drain */ }
    expect(staminaLeft(s)).toBe(0);
    expect(phase(s)).toBe('night');
    expect(spendAction(s, 'forage')).toEqual({ ok: false, reason: 'not_enough_stamina' });
  });

  it('sleeping resets stamina and reports season changes', () => {
    const s = createNewGame();
    spendAction(s, 'questStep');
    expect(endDay(s).newSeason).toBeNull(); // day 2, still autumn
    expect(staminaLeft(s)).toBe(s.staminaMax);
    expect(endDay(s).newSeason?.season).toBe('winter');
  });

  it('jumpToSeason lands on day 1 of that season', () => {
    const s = createNewGame();
    jumpToSeason(s, 'green');
    expect(season(s)).toMatchObject({ season: 'green', dayInSeason: 1 });
  });
});

describe('travel gating', () => {
  it('needs region vitality and chassis tier', () => {
    const s = createNewGame();
    expect(canTravelTo(s, 'station').ok).toBe(true);
    expect(canTravelTo(s, 'snowpeak')).toEqual({ ok: false, missing: ['region:station'] });
    setVitality(s, 'station', 1);
    expect(canTravelTo(s, 'snowpeak').ok).toBe(true);
    setVitality(s, 'happo_terminal', 1);
    expect(canTravelTo(s, 'iwatake').missing).toEqual(['chassis:1']);
  });
  it('grant adds currencies and items', () => {
    const s = createNewGame();
    grant(s, 'yen', 500); grant(s, 'kizuna', 2); grant(s, 'brochure', 3);
    expect([s.yen, s.kizuna, s.inventory.brochure]).toEqual([3500, 2, 3]);
  });
});

describe('rng', () => {
  it('is deterministic and in [0,1)', () => {
    const [a, s1] = nextRandom(42);
    const [b] = nextRandom(42);
    expect(a).toBe(b);
    let st = s1;
    for (let i = 0; i < 1000; i++) { const [v, n] = nextRandom(st); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); st = n; }
  });
});
