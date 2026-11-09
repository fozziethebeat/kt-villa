import { CONTENT, archetypeDef, productDef } from './content';
import { endDay, jumpToSeason, staminaLeft } from './game';
import { activeArchetype, prepQuality, prepYield, settleShift, startShift, type ServeOutcome, type ShiftPlan } from './business';
import type { Content, GameState, ScoredSeason, ShiftSummary } from './types';

/**
 * Headless balance simulator (§11.3): a "bot player" runs business shifts with a given van build so we
 * can check that build choices change earnings, without rendering anything.
 */
export interface Bot {
  /** Fraction of pours / cuts that land in the window (0..1). */
  prepSkill: number;
  /** Fraction of hits that are perfect. */
  perfectRate: number;
  /** How quickly orders are served, as a fraction of patience (tips need < 0.5). */
  serveSpeed: number;
}

export const DEFAULT_BOT: Bot = { prepSkill: 0.75, perfectRate: 0.3, serveSpeed: 0.35 };

/** Play out one planned shift: prep each line, then serve customers in arrival order while stock lasts. */
export function playShift(plan: ShiftPlan, bot: Bot = DEFAULT_BOT, content: Content = CONTENT): ServeOutcome[] {
  const stock: Record<string, number> = { ...plan.shelf };
  const quality: Record<string, number> = {};
  const lineStock: Record<string, number> = {};
  for (const line of plan.prep) {
    const attempts = line === 'cup' ? content.business.shift.pours : content.business.shift.cuts;
    const hits = Math.round(attempts * bot.prepSkill);
    const perfects = Math.round(hits * bot.perfectRate);
    lineStock[line] = prepYield(line, hits, perfects, attempts, plan, content);
    quality[line] = prepQuality(hits, attempts);
  }
  const outcomes: ServeOutcome[] = [];
  for (const c of plan.customers) {
    const line = productDef(content, c.wants).line;
    const have = line === 'shelf' ? stock[c.wants] ?? 0 : lineStock[line] ?? 0;
    if (have <= 0) continue; // sold out: they see the sign and wander off (no outcome)
    if (line === 'shelf') stock[c.wants]--; else lineStock[line]--;
    outcomes.push({ idx: c.idx, item: c.wants, stars: line === 'shelf' ? 2 : quality[line], waitedFrac: bot.serveSpeed });
  }
  return outcomes;
}

export interface SeasonResult { season: ScoredSeason; days: number; shifts: number; yen: number; served: number; missed: number; soldOut: number; perShift: number }

/**
 * Run `days` days of the given season from a copy of `state`: each day the bot spends the hours before its
 * archetype's best time of day on other things (quests), runs `shiftsPerDay` shifts, then sleeps.
 * The input state is not modified.
 */
export function simulateSeason(state: GameState, s: ScoredSeason, days = 7, bot: Bot = DEFAULT_BOT, shiftsPerDay = 1, content: Content = CONTENT): SeasonResult {
  const st: GameState = JSON.parse(JSON.stringify(state));
  jumpToSeason(st, s, content);
  const startYen = st.yen;
  let shifts = 0, served = 0, missed = 0, soldOut = 0;
  const arch = archetypeDef(content, activeArchetype(st));
  const phases = content.tuning.dayPhases;
  const best = phases.reduce((a, p) => (arch.phaseMult[p.id] > arch.phaseMult[a.id] ? p : a), phases[0]);
  const bestStart = phases[phases.indexOf(best) - 1]?.untilSpent ?? 0;
  for (let d = 0; d < days; d++) {
    st.staminaSpent = Math.min(bestStart, st.staminaMax - content.tuning.actionCosts.businessShift);
    for (let k = 0; k < shiftsPerDay && staminaLeft(st) >= content.tuning.actionCosts.businessShift; k++) {
      const r = startShift(st, content);
      if (!r.ok) break;
      const sum: ShiftSummary = settleShift(st, r.plan, playShift(r.plan, bot, content), content);
      shifts++; served += sum.served; missed += sum.missed; soldOut += sum.soldOut;
    }
    endDay(st, content);
  }
  const yen = st.yen - startYen;
  return { season: s, days, shifts, yen, served, missed, soldOut, perShift: shifts ? Math.round(yen / shifts) : 0 };
}
