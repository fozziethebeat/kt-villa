import { CONTENT } from './content';
import type { Content, GameState } from './types';

/**
 * Late-game yen sinks (M5): cosmetic van liveries and festival sponsorships
 * (a Thriving region you sponsor gets a permanent Valley Buzz bonus).
 */
export type BuyResult = { ok: true } | { ok: false; reason: 'yen' | 'owned' | 'not_thriving' | 'unknown' };

export function buyLivery(state: GameState, id: string, content: Content = CONTENT): BuyResult {
  const l = content.business.liveries.find((x) => x.id === id);
  if (!l) return { ok: false, reason: 'unknown' };
  const owned = state.van.liveries ?? ['cream'];
  if (!owned.includes(id)) {
    if (state.yen < l.price) return { ok: false, reason: 'yen' };
    state.yen -= l.price;
    state.van.liveries = [...owned, id];
  }
  state.van.livery = id;
  return { ok: true };
}

export function liveryTint(state: GameState, content: Content = CONTENT): number {
  const l = content.business.liveries.find((x) => x.id === (state.van.livery ?? 'cream'));
  return parseInt((l?.tint ?? '#ffffff').slice(1), 16);
}

/** Each sponsorship costs more than the last. */
export function sponsorshipCost(state: GameState, content: Content = CONTENT): number {
  const c = content.business.sponsorship;
  return c.base + c.step * (state.sponsored ?? []).length;
}

export function sponsorFestival(state: GameState, region: string, content: Content = CONTENT): BuyResult {
  if ((state.sponsored ?? []).includes(region)) return { ok: false, reason: 'owned' };
  if (state.regions[region]?.vitality < 3) return { ok: false, reason: 'not_thriving' };
  const cost = sponsorshipCost(state, content);
  if (state.yen < cost) return { ok: false, reason: 'yen' };
  state.yen -= cost;
  state.sponsored = [...(state.sponsored ?? []), region];
  state.log.push(`Day ${state.day}: sponsored the ${region} festival.`);
  return { ok: true };
}
