import { describe, expect, it } from 'vitest';
import { CONTENT } from '../../src/sim/content';
import { buyLivery, liveryTint, sponsorFestival, sponsorshipCost } from '../../src/sim/extras';
import { createNewGame } from '../../src/sim/game';
import { fastForwardRegion } from '../../src/sim/quests';
import { regionBuzz } from '../../src/sim/report';
import { deserialize, serialize } from '../../src/sim/save';
import { buyModule, vanEffects } from '../../src/sim/van';

describe('late-game yen sinks', () => {
  it('liveries cost yen once, then switch freely; default cream is untinted', () => {
    const s = createNewGame({ seed: 1 });
    expect(liveryTint(s)).toBe(0xffffff);
    s.yen = 5000;
    expect(buyLivery(s, 'festival')).toMatchObject({ ok: false, reason: 'yen' });
    expect(buyLivery(s, 'sakura').ok).toBe(true);
    expect(s.yen).toBe(1000);
    expect(liveryTint(s)).toBe(0xf6c9d3);
    expect(buyLivery(s, 'cream').ok).toBe(true);
    expect(buyLivery(s, 'sakura').ok).toBe(true); // already owned: free
    expect(s.yen).toBe(1000);
  });

  it('sponsoring a Thriving region festival adds Valley Buzz; each one costs more', () => {
    const s = createNewGame({ seed: 2 });
    fastForwardRegion(s, 'station');
    s.yen = 100_000;
    expect(sponsorFestival(s, 'snowpeak')).toMatchObject({ ok: false, reason: 'not_thriving' });
    const before = regionBuzz(s, 'station', 'winter').buzz;
    const c1 = sponsorshipCost(s);
    expect(sponsorFestival(s, 'station').ok).toBe(true);
    expect(s.yen).toBe(100_000 - c1);
    expect(regionBuzz(s, 'station', 'winter').buzz).toBe(Math.min(100, before + CONTENT.business.sponsorship.buzz));
    expect(sponsorshipCost(s)).toBeGreaterThan(c1);
    expect(sponsorFestival(s, 'station')).toMatchObject({ ok: false, reason: 'owned' });
  });

  it('decor modules: the lantern string lifts tips', () => {
    const s = createNewGame({ seed: 3 });
    s.yen = 10_000;
    expect(buyModule(s, 'lantern_string').ok).toBe(true);
    s.van.placed.push({ moduleId: 'lantern_string', x: 0, y: 0, rot: 0 });
    expect(vanEffects(s).tipMult).toBeCloseTo(1.05);
  });

  it('saves keep appearance, livery and sponsorships', () => {
    const s = createNewGame({ seed: 4, player: { look: 2 } });
    s.van.livery = 'sky'; s.sponsored = ['station'];
    const t = deserialize(serialize(s))!;
    expect(t.player.look).toBe(2);
    expect(t.van.livery).toBe('sky');
    expect(t.sponsored).toEqual(['station']);
  });
});
