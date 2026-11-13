import { CONTENT, regionDef } from './content';
import { dailyStamina } from './van';
import { checkEnding } from './progression';
import { buildReport } from './report';
import { firstDayOfSeason, seasonForDay } from './seasons';
import type { ActionKind, Content, GameState, PhaseId, PlayerProfile, SeasonId, SeasonInfo, SeasonReport, Vitality } from './types';

export const DEFAULT_PLAYER: PlayerProfile = { name: 'Aoi', pronouns: 'she', personality: 'outdoorsy' };

export function createNewGame(opts: { seed?: number; player?: Partial<PlayerProfile> } = {}, content: Content = CONTENT): GameState {
  const seed = (opts.seed ?? 20261108) >>> 0;
  const regions: GameState['regions'] = {};
  for (const r of content.regions) regions[r.id] = { vitality: 0, questStep: 0, kodamaFound: 0 };
  const state: GameState = {
    version: 5,
    seed,
    rngState: seed,
    player: { ...DEFAULT_PLAYER, ...opts.player },
    day: 1,
    staminaMax: content.tuning.baseStamina,
    staminaSpent: 0,
    yen: content.tuning.startingYen,
    kizuna: content.tuning.startingKizuna,
    chassisTier: 0,
    primaryArchetype: null,
    secondaryArchetype: null,
    helpers: [],
    ending: null,
    currentRegion: 'station',
    regions,
    inventory: {},
    unlocks: [],
    stars: {},
    van: {
      grid: { w: 4, h: 2 },
      owned: ['futon', 'workbench'],
      placed: [
        { moduleId: 'futon', x: 0, y: 1, rot: 0 },
        { moduleId: 'workbench', x: 3, y: 1, rot: 0 },
      ],
      roof: [],
    },
    business: { reputation: 0, served: 0, shifts: 0, last: null, menu: null },
    seasonStats: emptySeasonStats(),
    reports: [],
    log: ['Arrived at JR Hakuba Station in late autumn.'],
  };
  state.staminaMax = dailyStamina(state, content);
  return state;
}

export function season(state: GameState, content: Content = CONTENT): SeasonInfo {
  return seasonForDay(state.day, content.tuning.calendar);
}

export function staminaLeft(state: GameState): number {
  return Math.max(0, state.staminaMax - state.staminaSpent);
}

export function phase(state: GameState, content: Content = CONTENT): PhaseId {
  const p = content.tuning.dayPhases.find((ph) => state.staminaSpent < ph.untilSpent);
  return (p ?? content.tuning.dayPhases[content.tuning.dayPhases.length - 1]).id;
}

export type SpendResult = { ok: true; cost: number } | { ok: false; reason: 'not_enough_stamina' };

/** Spend stamina for a meaningful action. Walking and talking are free and never call this. */
export function spendAction(state: GameState, kind: ActionKind, content: Content = CONTENT): SpendResult {
  const cost = content.tuning.actionCosts[kind];
  if (staminaLeft(state) < cost) return { ok: false, reason: 'not_enough_stamina' };
  state.staminaSpent += cost;
  return { ok: true, cost };
}

export function emptySeasonStats(): GameState['seasonStats'] {
  return { yen: 0, served: 0, soldOut: 0, missed: 0, shifts: 0, byProduct: {}, byRegion: {} };
}

/**
 * Sleep in the van: advance to the next morning. Returns the new season if a boundary was crossed, and the
 * Season Report when a scored season (winter / green) just ended.
 */
export function endDay(state: GameState, content: Content = CONTENT): { newSeason: SeasonInfo | null; report: SeasonReport | null; ending: boolean } {
  const before = season(state, content);
  state.day += 1;
  state.staminaSpent = 0;
  state.staminaMax = dailyStamina(state, content);
  const after = season(state, content);
  const changed = before.season !== after.season;
  let report: SeasonReport | null = null;
  if (changed) {
    state.log.push(`Day ${state.day}: ${after.label} begins.`);
    if (before.scored) { report = buildReport(state, before, content); state.reports.push(report); }
    state.seasonStats = emptySeasonStats();
  }
  let ending = false;
  if (report && !state.ending && checkEnding(state, content)) {
    state.ending = { day: state.day };
    state.log.push(`Day ${state.day}: the Hakuba Valley Festival!`);
    ending = true;
  }
  return { newSeason: changed ? after : null, report, ending };
}

export function jumpToSeason(state: GameState, target: SeasonId, content: Content = CONTENT): void {
  state.day = firstDayOfSeason(target, state.day, content.tuning.calendar);
  state.staminaSpent = 0;
}

export function canTravelTo(state: GameState, regionId: string, content: Content = CONTENT): { ok: boolean; missing: string[] } {
  const def = regionDef(content, regionId);
  const missing: string[] = [];
  if (state.chassisTier < def.requires.chassisTier) missing.push(`chassis:${def.requires.chassisTier}`);
  for (const r of def.requires.regions) if (state.regions[r].vitality < 1) missing.push(`region:${r}`);
  return { ok: missing.length === 0, missing };
}

export function setVitality(state: GameState, regionId: string, v: Vitality, content: Content = CONTENT): void {
  regionDef(content, regionId);
  state.regions[regionId].vitality = v;
}

export function grant(state: GameState, item: string, count = 1): void {
  if (item === 'yen') state.yen += count;
  else if (item === 'kizuna') state.kizuna += count;
  else state.inventory[item] = (state.inventory[item] ?? 0) + count;
}

/** Saturation multiplier for rendering a region at a given vitality (0 = mostly grey, 3 = full color). */
export function saturationFor(v: Vitality): number {
  return [0.25, 0.55, 0.85, 1.0][v];
}

export function hasUnlock(state: GameState, flag: string): boolean {
  return state.unlocks.includes(flag);
}

export function addUnlock(state: GameState, flag: string): void {
  if (!state.unlocks.includes(flag)) state.unlocks.push(flag);
}

export function count(state: GameState, item: string): number {
  if (item === 'yen') return state.yen;
  if (item === 'kizuna') return state.kizuna;
  return state.inventory[item] ?? 0;
}

export function take(state: GameState, item: string, n: number): boolean {
  if (count(state, item) < n) return false;
  if (item === 'yen') state.yen -= n;
  else if (item === 'kizuna') state.kizuna -= n;
  else { state.inventory[item] -= n; if (state.inventory[item] <= 0) delete state.inventory[item]; }
  return true;
}

/** Personality modifier (e.g. "walkSpeed"), 1 / 0 when the personality doesn't touch it. */
export function mod(state: GameState, key: string, fallback = 1, content: Content = CONTENT): number {
  const p = content.personalities.find((x) => x.id === state.player.personality);
  return p?.mods[key] ?? fallback;
}
