import { CONTENT, archetypeDef } from './content';
import { THRIVING_BUZZ } from './report';
import type { Content, GameState, HelperDef, RankDef } from './types';

/** Regions at Vitality 3. */
export function thrivingCount(state: GameState): number {
  return Object.values(state.regions).filter((r) => r.vitality >= 3).length;
}

/** Business Rank 1–5 (§6.5): lifetime reputation + regions restored. */
export function rankDef(state: GameState, content: Content = CONTENT): RankDef {
  const t = thrivingCount(state);
  let best = content.business.ranks[0];
  for (const r of content.business.ranks) if (state.business.reputation >= r.reputation && t >= r.regions) best = r;
  return best;
}

export function nextRank(state: GameState, content: Content = CONTENT): RankDef | null {
  return content.business.ranks.find((r) => r.rank === rankDef(state, content).rank + 1) ?? null;
}

// ---- helpers (Spiritfarer-style residents who automate one thing) ----------

export function helperDef(region: string, content: Content = CONTENT): HelperDef {
  const h = content.helpers.find((x) => x.region === region);
  if (!h) throw new Error(`No helper for ${region}`);
  return h;
}

/** Key people of Thriving regions who could help (not yet hired). */
export function availableHelpers(state: GameState, content: Content = CONTENT): HelperDef[] {
  return content.helpers.filter((h) => state.regions[h.region]?.vitality >= 3 && !state.helpers.includes(h.region));
}

export type HireResult = { ok: true } | { ok: false; reason: 'slots' | 'not_thriving' | 'hired' | 'kizuna' };

export function hireHelper(state: GameState, region: string, content: Content = CONTENT): HireResult {
  if (state.helpers.includes(region)) return { ok: false, reason: 'hired' };
  if (state.regions[region]?.vitality < 3) return { ok: false, reason: 'not_thriving' };
  if (state.helpers.length >= rankDef(state, content).helpers) return { ok: false, reason: 'slots' };
  if (state.kizuna < content.business.helperCost) return { ok: false, reason: 'kizuna' };
  state.kizuna -= content.business.helperCost;
  state.helpers.push(region);
  state.log.push(`Day ${state.day}: ${helperDef(region, content).name} joined the van crew.`);
  return { ok: true };
}

export function dismissHelper(state: GameState, region: string): void {
  state.helpers = state.helpers.filter((h) => h !== region);
}

// ---- second trade (Rank 3) ---------------------------------------------------

export type SecondaryResult = { ok: true } | { ok: false; reason: 'rank' | 'no_primary' | 'chosen' | 'same' };

export function secondaryChoices(state: GameState, content: Content = CONTENT): string[] {
  return content.archetypes.filter((a) => a.id !== state.primaryArchetype).map((a) => a.id);
}

/** Pick the second trade: its specialty modules go on sale. Choosing the one strong in your weak season is the lesson. */
export function chooseSecondary(state: GameState, id: string, content: Content = CONTENT): SecondaryResult {
  archetypeDef(content, id);
  if (!state.primaryArchetype) return { ok: false, reason: 'no_primary' };
  if (state.secondaryArchetype) return { ok: false, reason: 'chosen' };
  if (id === state.primaryArchetype) return { ok: false, reason: 'same' };
  if (!rankDef(state, content).secondary) return { ok: false, reason: 'rank' };
  state.secondaryArchetype = id;
  if (!state.unlocks.includes(`business:${id}`)) state.unlocks.push(`business:${id}`);
  state.business.menu = null;
  state.log.push(`Day ${state.day}: added ${archetypeDef(content, id).name} as a second trade.`);
  return { ok: true };
}

// ---- ending (§8.4) -----------------------------------------------------------

/**
 * The Hakuba Valley Festival: every region Thriving, Business Rank 5, and the latest winter + following green
 * season both rated Thriving (checked when a Season Report is written).
 */
export function endingProgress(state: GameState, content: Content = CONTENT) {
  const regions = content.regions.every((r) => state.regions[r.id].vitality >= 3);
  const rank5 = rankDef(state, content).rank >= 5;
  // The two most recent reports must be a winter and the green season right after it, both Thriving.
  const [w, g] = state.reports.slice(-2);
  const seasons = !!w && !!g && w.season === 'winter' && g.season === 'green' && w.year === g.year && w.valleyBuzz >= THRIVING_BUZZ && g.valleyBuzz >= THRIVING_BUZZ;
  return { regions, rank5, seasons };
}

export function checkEnding(state: GameState, content: Content = CONTENT): boolean {
  const p = endingProgress(state, content);
  return p.regions && p.rank5 && p.seasons;
}
