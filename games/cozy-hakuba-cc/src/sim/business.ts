import { CONTENT, productDef, regionDef } from './content';
import { phase, season, spendAction } from './game';
import { nextRandom } from './rng';
import { enabled } from './van';
import type { Content, GameState, ScoredSeason, ShiftSummary } from './types';

export interface PlannedCustomer { idx: number; type: string; wants: string; patience: number; arriveAt: number; tipMult: number }
export interface ShiftPlan { region: string; season: ScoredSeason; menu: string[]; customers: PlannedCustomer[]; durationSec: number; pastryStock: number }

/** Seasons that aren't scored (autumn/spring) behave like the nearest scored season, but quieter. */
function demandSeason(state: GameState, content: Content): { s: ScoredSeason; mult: number } {
  const info = season(state, content);
  if (info.season === 'winter' || info.season === 'green') return { s: info.season, mult: 1 };
  return { s: info.season === 'autumn' ? 'winter' : 'green', mult: 0.6 };
}

export function menu(state: GameState, content: Content = CONTENT): string[] {
  if (!state.unlocks.includes('business:coffee')) return [];
  const en = enabled(state, content);
  return content.business.products.filter((p) => en.has(p.id)).map((p) => p.id);
}

export type StartShift = { ok: true; plan: ShiftPlan } | { ok: false; reason: 'locked' | 'no_menu' | 'tired' };

/** Start a business shift: spends stamina and deterministically plans the customer stream. */
export function startShift(state: GameState, content: Content = CONTENT): StartShift {
  if (!state.unlocks.includes('business:coffee')) return { ok: false, reason: 'locked' };
  const m = menu(state, content);
  if (!m.length) return { ok: false, reason: 'no_menu' };
  const ph = phase(state, content);
  if (!spendAction(state, 'businessShift', content).ok) return { ok: false, reason: 'tired' };
  const b = content.business;
  const { s, mult } = demandSeason(state, content);
  const region = regionDef(content, state.currentRegion);
  const vit = state.regions[region.id].vitality;
  const repMult = 1 + Math.min(0.5, state.business.reputation / 100);
  let st = state.rngState;
  const rand = () => { const [v, n] = nextRandom(st); st = n; return v; };
  const raw = b.shift.baseCustomers * mult * (0.5 + vit * 0.25) * (0.5 + region.draw[s]) * b.shift.phaseMult[ph] * repMult;
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
  return { ok: true, plan: { region: region.id, season: s, menu: m, customers, durationSec: b.shift.durationSec, pastryStock: m.includes('apple_pastry') ? b.shift.pastryStock : 0 } };
}

export interface ServeOutcome { idx: number; item: string | null; stars: number; waitedFrac: number }

/** Price for one served order. Wrong item = served politely at half price, no tip. */
export function priceFor(plan: ShiftPlan, c: PlannedCustomer, o: ServeOutcome, content: Content = CONTENT): { yen: number; tip: number; happy: boolean } {
  if (!o.item) return { yen: 0, tip: 0, happy: false };
  const b = content.business.shift;
  const p = productDef(content, o.item);
  const right = o.item === c.wants;
  const base = Math.round(p.price * b.qualityMult[Math.max(0, Math.min(3, o.stars))] * (right ? 1 : 0.5));
  const tip = right && o.waitedFrac < 0.5 && o.stars >= 2 ? Math.round(p.price * b.tipRate * c.tipMult) : 0;
  void plan;
  return { yen: base, tip, happy: right };
}

/** Settle the shift into the save state. */
export function settleShift(state: GameState, plan: ShiftPlan, outcomes: ServeOutcome[], content: Content = CONTENT): ShiftSummary {
  const b = content.business.shift;
  let yen = 0, tips = 0, served = 0, missed = 0, rep = 0;
  for (const c of plan.customers) {
    const o = outcomes.find((x) => x.idx === c.idx) ?? { idx: c.idx, item: null, stars: 0, waitedFrac: 1 };
    const r = priceFor(plan, c, o, content);
    yen += r.yen; tips += r.tip;
    if (o.item) served++; else missed++;
    rep += r.happy ? b.reputationPerHappy : o.item ? 0 : b.reputationPerMissed;
  }
  state.yen += yen + tips;
  state.business.reputation = Math.max(0, state.business.reputation + rep);
  state.business.served += served;
  state.business.shifts += 1;
  const summary: ShiftSummary = { day: state.day, served, missed, yen, tips, reputation: rep };
  state.business.last = summary;
  state.log.push(`Day ${state.day}: café shift, served ${served}, earned ¥${yen + tips}.`);
  return summary;
}
