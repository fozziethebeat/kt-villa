import { CONTENT, productDef } from './content';
import type { Content, GameState, RegionBuzz, ScoredSeason, SeasonInfo, SeasonReport } from './types';

export const THRIVING_BUZZ = 70;
export const BUSY_BUZZ = 50;

/** Valley Buzz for one region this season (0–100): vitality, seasonal draw, its attraction, and your van's presence. */
export function regionBuzz(state: GameState, regionId: string, s: ScoredSeason, content: Content = CONTENT): RegionBuzz {
  const r = content.regions.find((x) => x.id === regionId)!;
  const v = state.regions[regionId].vitality;
  const shifts = state.seasonStats.byRegion[regionId] ?? 0;
  const attraction = v >= 3 && r.attraction ? r.attraction : null;
  const sponsor = (state.sponsored ?? []).includes(regionId) ? content.business.sponsorship.buzz : 0;
  const raw = v === 0 ? 0 : sponsor + (v / 3) * 55 + r.draw[s] * 20 * (v / 3) + (attraction ? attraction.demand[s] * 100 : 0) + Math.min(15, shifts * 5);
  return { region: regionId, name: r.name, vitality: v, buzz: Math.round(Math.min(100, raw)), attraction: attraction?.name ?? null, shifts };
}

/** Build the Stardew-style Season Report for the scored season that just ended. Never a failure, only gentle tips. */
export function buildReport(state: GameState, info: SeasonInfo, content: Content = CONTENT): SeasonReport {
  const s = info.season as ScoredSeason;
  const regions = content.regions.filter((r) => state.regions[r.id].vitality > 0).map((r) => regionBuzz(state, r.id, s, content));
  const valleyBuzz = regions.length ? Math.round(regions.reduce((a, r) => a + r.buzz, 0) / regions.length) : 0;
  const rating: SeasonReport['rating'] = valleyBuzz >= THRIVING_BUZZ ? 'Thriving' : valleyBuzz >= BUSY_BUZZ ? 'Busy' : 'Quiet';
  const ss = state.seasonStats;
  const best = Object.entries(ss.byProduct).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const tips: string[] = [];
  if (s === 'green') {
    const greenDraws = content.regions.filter((r) => r.attraction && r.attraction.demand.green >= 0.2 && state.regions[r.id].vitality >= 3);
    if (greenDraws.length < 2) tips.push('Green-season visitors need a reason to come: restoring Happo Pond and Iwatake brings big summer draws.');
  }
  const quiet = regions.filter((r) => r.vitality >= 2 && r.shifts === 0).sort((a, b) => a.buzz - b.buzz)[0];
  if (quiet) tips.push(`Nobody sold food at ${quiet.name} this season. Parking your van there would lift its buzz.`);
  if (ss.shifts && ss.soldOut > ss.served * 0.3) tips.push('You sold out often. More stock (a solar panel, shelf modules) would catch those customers.');
  if (!ss.shifts) tips.push('Your van stayed closed this season. Even one shift a day adds up!');
  const unrestored = content.regions.filter((r) => r.playable && state.regions[r.id].vitality < 3).map((r) => r.name);
  if (unrestored.length) tips.push(`Still waking up: ${unrestored.slice(0, 3).join(', ')}.`);
  return {
    season: s, year: info.year, label: info.label, endedDay: state.day - 1,
    regions, valleyBuzz, rating,
    business: { yen: ss.yen, served: ss.served, soldOut: ss.soldOut, shifts: ss.shifts, reputation: state.business.reputation, bestSeller: best ? productDef(content, best).name : null },
    tips: tips.slice(0, 3),
  };
}
