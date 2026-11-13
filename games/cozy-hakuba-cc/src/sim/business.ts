import { CONTENT, archetypeDef, productDef, regionDef } from './content';
import { mod, phase, season, spendAction } from './game';
import { nextRandom } from './rng';
import { enabled, vanEffects } from './van';
import { rankDef } from './progression';
import type { Content, GameState, ScoredSeason, ShiftSummary } from './types';

export type PrepLine = 'cup' | 'bowl';
export interface PlannedCustomer { idx: number; type: string; wants: string; patience: number; arriveAt: number; tipMult: number }
export interface ShiftPlan {
  region: string;
  season: ScoredSeason;
  archetype: string;
  menu: string[];
  customers: PlannedCustomer[];
  durationSec: number;
  /** Lines that need a prep mini-game before service (cups: pour timing, bowls: noodle cut). */
  prep: PrepLine[];
  /** Ready-made stock for shelf items (pastries, onigiri, oyaki) and bookable sessions (sauna, tours). */
  shelf: Record<string, number>;
  /** Extra stock per prepped line from van modules (e.g. solar panel). */
  stockBonus: number;
  /** Multipliers baked in at plan time so pricing stays a pure function of the plan. */
  specialty: string | null;
  tipMult: number;
}

/** Seasons that aren't scored (autumn/spring) behave like the nearest scored season, but quieter. */
export function demandSeason(state: GameState, content: Content = CONTENT): { s: ScoredSeason; mult: number } {
  const info = season(state, content);
  if (info.season === 'winter' || info.season === 'green') return { s: info.season, mult: 1 };
  return { s: info.season === 'autumn' ? 'winter' : 'green', mult: 0.6 };
}

export function businessOpen(state: GameState): boolean {
  return state.unlocks.some((u) => u.startsWith('business:'));
}

/** The archetype that sets the van's rhythm: the chosen primary, or the station's pop-up coffee tutorial. */
export function activeArchetype(state: GameState): string {
  return state.primaryArchetype ?? 'coffee';
}

/** Every product the van's active modules can make, primary archetype first. */
export function availableProducts(state: GameState, content: Content = CONTENT): string[] {
  const en = enabled(state, content);
  const primary = activeArchetype(state);
  const second = state.secondaryArchetype;
  const all = content.business.products.filter((p) => en.has(p.id));
  const rank = (a: string) => (a === primary ? 0 : a === second ? 1 : 2);
  return [...all].sort((a, b) => rank(a.archetype) - rank(b.archetype)).map((p) => p.id);
}

/** Today's menu: the player's chosen items (if still makeable) or the automatic pick, capped by menu slots. */
export function menu(state: GameState, content: Content = CONTENT): string[] {
  if (!businessOpen(state)) return [];
  const avail = availableProducts(state, content);
  const chosen = (state.business.menu ?? []).filter((id) => avail.includes(id));
  return (chosen.length ? chosen : avail).slice(0, menuSlots(state, content));
}

/** Menu slots grow with Business Rank (3 → 6). */
export function menuSlots(state: GameState, content: Content = CONTENT): number {
  return rankDef(state, content).menuSlots;
}

export function setMenu(state: GameState, ids: string[], content: Content = CONTENT): boolean {
  const avail = availableProducts(state, content);
  if (ids.length > menuSlots(state, content) || ids.some((id) => !avail.includes(id))) return false;
  state.business.menu = ids.length ? [...ids] : null;
  return true;
}

export type StartShift = { ok: true; plan: ShiftPlan } | { ok: false; reason: 'locked' | 'no_menu' | 'tired' };

/** Expected customer count for a shift right now (before rounding/clamping). Exposed for the balance sim + UI. */
export function demandFor(state: GameState, content: Content = CONTENT): number {
  const b = content.business;
  const { s, mult } = demandSeason(state, content);
  const region = regionDef(content, state.currentRegion);
  const vit = state.regions[region.id].vitality;
  const arch = archetypeDef(content, activeArchetype(state));
  const repMult = 1 + Math.min(0.5, state.business.reputation / 100);
  const fx = vanEffects(state, content);
  return attractionMult(state, s, content) * b.shift.baseCustomers * mult * (0.5 + vit * 0.25) * (0.2 + region.draw[s]) * arch.phaseMult[phase(state, content)] * arch.strongIn[s] * fx.customerMult[s] * repMult;
}

/** Thriving regions' attractions bring more visitors to the whole valley (the green-season lever). */
export function attractionMult(state: GameState, s: ScoredSeason, content: Content = CONTENT): number {
  let m = 1;
  for (const r of content.regions) if (r.attraction && state.regions[r.id].vitality >= 3) m += r.attraction.demand[s];
  return m;
}

/** Start a business shift: spends stamina and deterministically plans the customer stream. */
export function startShift(state: GameState, content: Content = CONTENT): StartShift {
  if (!businessOpen(state)) return { ok: false, reason: 'locked' };
  const m = menu(state, content);
  if (!m.length) return { ok: false, reason: 'no_menu' };
  const raw = demandFor(state, content);
  if (!spendAction(state, 'businessShift', content).ok) return { ok: false, reason: 'tired' };
  const b = content.business;
  const { s } = demandSeason(state, content);
  let st = state.rngState;
  const rand = () => { const [v, n] = nextRandom(st); st = n; return v; };
  const n = Math.max(b.shift.minCustomers, Math.min(b.shift.maxCustomers, Math.round(raw)));
  const pick = <T,>(items: T[], w: (t: T) => number): T => {
    const total = items.reduce((a, t) => a + w(t), 0);
    let r = rand() * total;
    for (const t of items) { r -= w(t); if (r <= 0) return t; }
    return items[items.length - 1];
  };
  const customers: PlannedCustomer[] = [];
  const spacing = (b.shift.durationSec - 10) / n;
  for (let i = 0; i < n; i++) {
    const type = pick(b.customers, (c) => c.weight[s]);
    const wants = pick(m, (pid) => (type.prefs[pid] ?? 0.1) * productDef(content, pid).seasonAppeal[s]);
    customers.push({ idx: i, type: type.id, wants, patience: type.patience, arriveAt: 2 + i * spacing + rand() * spacing * 0.5, tipMult: type.tip });
  }
  state.rngState = st;
  const fx = vanEffects(state, content);
  const lines = new Set(m.map((pid) => productDef(content, pid).line));
  const prep = (['cup', 'bowl'] as const).filter((l) => lines.has(l));
  const shelf: Record<string, number> = {};
  for (const pid of m) {
    const line = productDef(content, pid).line;
    if (line === 'shelf') shelf[pid] = b.shift.shelfStock + fx.stockBonus;
    if (line === 'session') shelf[pid] = b.shift.sessionStock + Math.ceil(fx.stockBonus / 2);
  }
  return {
    ok: true,
    plan: {
      region: state.currentRegion, season: s, archetype: activeArchetype(state), menu: m, customers, durationSec: b.shift.durationSec,
      prep, shelf, stockBonus: fx.stockBonus, specialty: state.primaryArchetype, tipMult: fx.tipMult * mod(state, 'tips', 1, content),
    },
  };
}

/** Stock produced by a prep mini-game: each hit makes `per` units (+1 on a perfect), a miss still makes 1. */
export function prepYield(line: PrepLine, hits: number, perfects: number, attempts: number, plan: ShiftPlan, content: Content = CONTENT): number {
  const per = line === 'cup' ? content.business.shift.cupsPerPour : content.business.shift.bowlsPerCut;
  return hits * per + perfects + (attempts - hits) + plan.stockBonus;
}

export function prepQuality(hits: number, attempts: number): number {
  return hits >= attempts ? 3 : hits >= Math.ceil(attempts / 2) ? 2 : 1;
}

export interface ServeOutcome { idx: number; item: string | null; stars: number; waitedFrac: number }

/** Price for one served order. Wrong item = served politely at half price, no tip. Specialty items earn a bonus. */
export function priceFor(plan: ShiftPlan, c: PlannedCustomer, o: ServeOutcome, content: Content = CONTENT): { yen: number; tip: number; happy: boolean } {
  if (!o.item) return { yen: 0, tip: 0, happy: false };
  const b = content.business.shift;
  const p = productDef(content, o.item);
  const right = o.item === c.wants;
  const specialty = plan.specialty && p.archetype === plan.specialty ? 1 + b.specialtyBonus : 1;
  const base = Math.round(p.price * specialty * b.qualityMult[Math.max(0, Math.min(3, o.stars))] * (right ? 1 : 0.5));
  const tip = right && o.waitedFrac < 0.5 && o.stars >= 2 ? Math.round(p.price * b.tipRate * c.tipMult * plan.tipMult) : 0;
  return { yen: base, tip, happy: right };
}

/** Settle the shift into the save state. */
export function settleShift(state: GameState, plan: ShiftPlan, outcomes: ServeOutcome[], content: Content = CONTENT): ShiftSummary {
  const b = content.business.shift;
  let yen = 0, tips = 0, served = 0, missed = 0, soldOut = 0, rep = 0;
  const repMult = mod(state, 'regularRep', 1, content);
  for (const c of plan.customers) {
    const o = outcomes.find((x) => x.idx === c.idx);
    // No outcome = they never got to the window (sold out / shift over). Gentle: no reputation loss.
    if (!o) { soldOut++; continue; }
    const r = priceFor(plan, c, o, content);
    yen += r.yen; tips += r.tip;
    if (o.item) served++; else missed++;
    rep += r.happy ? b.reputationPerHappy * repMult : o.item ? 0 : b.reputationPerMissed;
  }
  rep = Math.round(rep * 10) / 10;
  state.yen += yen + tips;
  state.business.reputation = Math.max(0, Math.round((state.business.reputation + rep) * 10) / 10);
  state.business.served += served;
  state.business.shifts += 1;
  const summary: ShiftSummary = { day: state.day, region: plan.region, served, missed, soldOut, yen, tips, reputation: rep };
  state.business.last = summary;
  const ss = state.seasonStats;
  ss.yen += yen + tips; ss.served += served; ss.soldOut += soldOut; ss.missed += missed; ss.shifts += 1;
  ss.byRegion[plan.region] = (ss.byRegion[plan.region] ?? 0) + 1;
  for (const o of outcomes) if (o.item) ss.byProduct[o.item] = (ss.byProduct[o.item] ?? 0) + 1;
  state.log.push(`Day ${state.day}: shift at ${plan.region}, served ${served}, earned ¥${yen + tips}.`);
  return summary;
}
