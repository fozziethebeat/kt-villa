import { chooseArchetype, finishBuild } from './archetype';
import { DEFAULT_BOT, playShift, type Bot } from './balance';
import { menu, startShift, settleShift } from './business';
import { CONTENT, archetypeDef, moduleDef } from './content';
import { createNewGame, endDay, grant, spendAction, staminaLeft } from './game';
import { availableHelpers, chooseSecondary, endingProgress, hireHelper, rankDef } from './progression';
import { completeStep, currentStep, stepReadyToday } from './quests';
import { canDriveTo, drive, openRoad, roadOffers, roadOpen } from './travel';
import { buyModule, installRoof, isPlaced, placeModule, priceWithMods, removeModule, roofSlots, upgradeChassis } from './van';
import type { Content, GameState, QuestStepDef } from './types';

/**
 * Whole-game bot (§11.4 "balance sim"): plays every day of a new game with simple, sensible priorities and
 * reports when it reaches the Hakuba Valley Festival ending. Mini-games are abstracted as a stamina cost
 * and a star rating; everything else (quests, driving, roads, shifts, purchases, ranks, helpers) uses the
 * real rules.
 */
export interface GameBotOptions { seed?: number; primary?: 'coffee' | 'soba'; maxDays?: number; bot?: Bot; stars?: number }
export interface GameBotResult {
  endingDay: number | null;
  days: number;
  milestones: Record<string, number>;
  progress: ReturnType<typeof endingProgress>;
  final: { yen: number; reputation: number; rank: number; chassis: number; thriving: number; helpers: string[]; secondary: string | null };
  reports: { day: number; season: string; buzz: number; rating: string }[];
  log: string[];
}

const SHIFT = () => CONTENT.tuning.actionCosts.businessShift;

/** Stamina a quest step costs to finish from scratch (mini-game or per-item pickups, plus the turn-in). */
function stepCost(state: GameState, regionId: string, step: QuestStepDef, content: Content): number {
  const turnIn = content.tuning.actionCosts.questStep;
  if (step.type !== 'fetch') return turnIn + 1;
  const layout = content.layouts[regionId];
  const per = layout?.fetch.cost ? content.tuning.actionCosts[layout.fetch.cost] : 0;
  const [item, n] = Object.entries(step.needs)[0];
  return turnIn + per * Math.max(0, n - (state.inventory[item] ?? 0));
}

/** Try to fit a module anywhere in the van (any cell, any rotation). */
function fit(state: GameState, id: string): boolean {
  if (isPlaced(state, id)) return true;
  const { w, h } = state.van.grid;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let r = 0; r < 2; r++) if (placeModule(state, id, x, y, r)) return true;
  return false;
}

function work(state: GameState, regionId: string, budget: number, o: Required<GameBotOptions>, content: Content): boolean {
  const step = currentStep(state, regionId, content);
  if (!step || !stepReadyToday(state, regionId)) return false;
  const cost = stepCost(state, regionId, step, content);
  if (cost > budget) {
    // Fetch quests can be chipped away at: pick up what today allows.
    if (step.type === 'fetch' && content.layouts[regionId]?.fetch.cost) {
      const [item] = Object.keys(step.needs);
      let did = false;
      while (staminaLeft(state) - SHIFT() >= 1 && (state.inventory[item] ?? 0) < step.needs[item]) { spendAction(state, 'forage', content); grant(state, item, 1); did = true; }
      return did;
    }
    return false;
  }
  if (step.id === 'first_module' && !state.primaryArchetype) chooseArchetype(state, o.primary, content);
  state.staminaSpent += cost;
  for (const [item, n] of Object.entries(step.needs)) { const have = state.inventory[item] ?? 0; if (have < n) grant(state, item, n - have); }
  state.stars[step.id] = o.stars;
  if (step.id === 'first_module') { finishBuild(state, o.stars, content); fit(state, archetypeDef(content, state.primaryArchetype!).builds); }
  completeStep(state, regionId, content);
  if (step.unlocks.includes('module:pour_bar')) fit(state, 'pour_bar');
  return true;
}

/** Next region to work on: here if unfinished, otherwise the lowest-order reachable unfinished region. */
function target(state: GameState, content: Content): string | null {
  const ready = (id: string) => !!currentStep(state, id, content) && stepReadyToday(state, id);
  if (ready(state.currentRegion)) return state.currentRegion;
  const options = [...content.regions].sort((a, b) => a.order - b.order).filter((r) => ready(r.id) && canDriveTo(state, r.id, content).ok);
  return options[0]?.id ?? null;
}

function shopping(state: GameState, content: Content) {
  // 1. Open roads with spare kizuna (reachable ones first).
  for (const id of roadOffers(state, content)) if (!roadOpen(state, id)) openRoad(state, id, content);
  // 2. Chassis upgrade when an unfinished region needs it.
  const needTier = Math.min(...content.regions.filter((r) => r.playable && state.regions[r.id].vitality < 3 && r.requires.chassisTier > state.chassisTier).map((r) => r.requires.chassisTier), 99);
  if (needTier <= 3 && state.chassisTier < needTier) { upgradeChassis(state, content); return; }
  // 3. Production modules for owned trades, then roof modules, then comfort.
  const trades = [state.primaryArchetype, state.secondaryArchetype].filter(Boolean) as string[];
  const wants = [
    ...content.modules.filter((m) => m.archetype && trades.includes(m.archetype) && m.price > 0).map((m) => m.id),
    ...(roofSlots(state, content) > state.van.roof.length ? ['solar_panel', 'roof_planter', 'ski_box'] : []),
    'stove', 'plant',
  ];
  for (const id of wants) {
    const def = moduleDef(content, id);
    if (state.van.owned.includes(id)) { if (def.category === 'roof') installRoof(state, id, content); else fit(state, id); continue; }
    if (state.yen < priceWithMods(state, def.price, content) + 1500) continue; // keep a little cushion
    if (buyModule(state, id, content).ok) { if (def.category === 'roof') installRoof(state, id, content); else if (!fit(state, id)) removeModule(state, id); }
  }
  // 4. Rank 3: add the trade that's strong in green season. Helpers when slots open.
  if (rankDef(state, content).secondary && !state.secondaryArchetype) chooseSecondary(state, state.primaryArchetype === 'soba' ? 'sauna' : 'tours', content);
  for (const h of availableHelpers(state, content)) if (state.kizuna >= content.business.helperCost + content.tuning.roadCost) hireHelper(state, h.region, content);
}

export function simulateGame(opts: GameBotOptions = {}, content: Content = CONTENT): GameBotResult {
  const o: Required<GameBotOptions> = { seed: 20261108, primary: 'coffee', maxDays: 120, bot: DEFAULT_BOT, stars: 2, ...opts };
  const state = createNewGame({ seed: o.seed }, content);
  const milestones: Record<string, number> = {};
  const mark = (k: string) => { if (milestones[k] === undefined) milestones[k] = state.day; };
  const reports: GameBotResult['reports'] = [];
  for (let day = 0; day < o.maxDays && !state.ending; day++) {
    // Quests: work while leaving stamina for one shift (once the business is open).
    for (let guard = 0; guard < 12; guard++) {
      const reserve = menu(state, content).length ? SHIFT() : 0;
      const budget = staminaLeft(state) - reserve;
      const t = target(state, content);
      if (!t || budget <= 0) break;
      if (t !== state.currentRegion) { if (budget < 1 || !drive(state, t, content).ok) break; continue; }
      if (!work(state, t, budget, o, content)) break;
    }
    // Business: one shift where we are.
    if (menu(state, content).length && staminaLeft(state) >= SHIFT()) {
      const r = startShift(state, content);
      if (r.ok) settleShift(state, r.plan, playShift(r.plan, o.bot, content), content);
    }
    shopping(state, content);
    for (const r of content.regions) if (state.regions[r.id].vitality >= 3) mark(`thriving:${r.id}`);
    mark(`rank${rankDef(state, content).rank}`);
    if (state.chassisTier) mark(`tier${state.chassisTier}`);
    const res = endDay(state, content);
    if (res.report) reports.push({ day: state.day - 1, season: res.report.season, buzz: res.report.valleyBuzz, rating: res.report.rating });
    // Park somewhere new each morning so every region sees the van (spreads buzz), once the arc work is done.
    if (!target(state, content)) {
      const quiet = content.regions.filter((r) => r.playable && state.regions[r.id].vitality >= 3 && r.id !== state.currentRegion && canDriveTo(state, r.id, content).ok)
        .sort((a, b) => (state.seasonStats.byRegion[a.id] ?? 0) - (state.seasonStats.byRegion[b.id] ?? 0))[0];
      if (quiet && !currentStep(state, state.currentRegion, content)) drive(state, quiet.id, content);
    }
  }
  return {
    endingDay: state.ending?.day ?? null,
    days: state.day,
    milestones,
    progress: endingProgress(state, content),
    final: {
      yen: state.yen, reputation: state.business.reputation, rank: rankDef(state, content).rank, chassis: state.chassisTier,
      thriving: Object.values(state.regions).filter((r) => r.vitality >= 3).length, helpers: [...state.helpers], secondary: state.secondaryArchetype,
    },
    reports,
    log: state.log,
  };
}
