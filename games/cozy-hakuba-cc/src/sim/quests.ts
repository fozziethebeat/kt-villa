import { CONTENT } from './content';
import { addUnlock, count, grant, spendAction, take } from './game';
import { grantModule } from './van';
import type { Content, GameState, QuestStepDef, RegionQuestDef } from './types';

export function regionQuests(regionId: string, content: Content = CONTENT): RegionQuestDef | null {
  return content.quests[regionId] ?? null;
}

/** The step the player is currently on, or null when the region's arc is finished. */
export function currentStep(state: GameState, regionId: string, content: Content = CONTENT): QuestStepDef | null {
  const q = regionQuests(regionId, content);
  if (!q) return null;
  return q.steps[state.regions[regionId].questStep] ?? null;
}

export function stepReady(state: GameState, step: QuestStepDef): boolean {
  return Object.entries(step.needs).every(([item, n]) => count(state, item) >= n);
}

export function fillLine(text: string, state: GameState, step: QuestStepDef): string {
  const [item, need] = Object.entries(step.needs)[0] ?? ['', 0];
  return text
    .replaceAll('{name}', state.player.name)
    .replaceAll('{need}', String(need))
    .replaceAll('{have}', String(Math.min(count(state, item), need)));
}

export type TalkResult =
  | { kind: 'intro' | 'progress'; text: string; step: QuestStepDef }
  | { kind: 'complete'; text: string; step: QuestStepDef; kizuna: number }
  | { kind: 'tired'; text: string; step: QuestStepDef }
  | { kind: 'resting'; text: string; step: QuestStepDef }
  | { kind: 'done'; text: string };

/**
 * Talking to a key person. Free unless it completes a step (costs a questStep action).
 * `seen` marks that the intro has been shown so the next talk shows the progress line.
 */
export function talk(state: GameState, regionId: string, content: Content = CONTENT): TalkResult {
  const q = regionQuests(regionId, content);
  const step = currentStep(state, regionId, content);
  if (!q || !step) return { kind: 'done', text: q?.after ?? '' };
  const seenKey = `seen:${regionId}:${step.id}`;
  if (!stepReady(state, step)) {
    const first = !state.unlocks.includes(seenKey);
    addUnlock(state, seenKey);
    return { kind: first ? 'intro' : 'progress', text: fillLine(first ? step.lines.intro : step.lines.progress, state, step), step };
  }
  if (!stepReadyToday(state, regionId)) {
    return { kind: 'resting', text: `This is wonderful, ${state.player.name}! I need a little time to get things ready on my end. Come back tomorrow and I'll take it.`, step };
  }
  const spent = spendAction(state, 'questStep', content);
  if (!spent.ok) return { kind: 'tired', text: `You look exhausted, ${state.player.name}. Get some rest in your van and come back tomorrow.`, step };
  const text = fillLine(step.lines.complete, state, step);
  const kizuna = completeStep(state, regionId, content);
  return { kind: 'complete', text, step, kizuna };
}

/** Apply a step's completion. Returns kizuna earned (base reward + star bonus). */
export function completeStep(state: GameState, regionId: string, content: Content = CONTENT): number {
  const step = currentStep(state, regionId, content);
  if (!step) return 0;
  if (step.consumes) for (const [item, n] of Object.entries(step.needs)) take(state, item, n);
  const stars = state.stars[step.id] ?? 0;
  const bonus = stars >= 3 ? 2 : stars === 2 ? 1 : 0;
  let kizuna = 0;
  for (const [item, n] of Object.entries(step.rewards)) {
    const amt = item === 'kizuna' ? n + bonus : n;
    if (item === 'kizuna') kizuna = amt;
    grant(state, item, amt);
  }
  for (const u of step.unlocks) {
    addUnlock(state, u);
    if (u.startsWith('module:')) grantModule(state, u.slice('module:'.length));
  }
  const r = state.regions[regionId];
  r.vitality = Math.max(r.vitality, step.vitality) as typeof r.vitality;
  r.questStep += 1;
  r.readyDay = state.day + content.tuning.stepCooldownDays;
  state.log.push(`Day ${state.day}: completed "${step.title}".`);
  return kizuna;
}

/** Key people hand over one request per day: the next turn-in waits until `readyDay`. */
export function stepReadyToday(state: GameState, regionId: string): boolean {
  return state.day >= (state.regions[regionId].readyDay ?? 0);
}

/** Record a mini-game / creation result: keeps the best stars and grants the produced item. */
export function recordResult(state: GameState, stepId: string, stars: number, item?: string): void {
  state.stars[stepId] = Math.max(state.stars[stepId] ?? 0, Math.max(1, Math.min(3, stars)));
  if (item) grant(state, item, 1);
}

/** Kodama found per region: one becomes findable at each vitality level 1..3. */
export function kodamaAvailable(state: GameState, regionId: string): number {
  return Math.min(3, state.regions[regionId].vitality);
}

export function findKodama(state: GameState, regionId: string, index: number): boolean {
  const r = state.regions[regionId];
  const flag = `kodama:${regionId}:${index}`;
  if (index >= kodamaAvailable(state, regionId) || state.unlocks.includes(flag)) return false;
  addUnlock(state, flag);
  r.kodamaFound += 1;
  grant(state, 'kizuna', 1);
  return true;
}

/** Debug/test helper: complete a region's remaining steps as if each was played at `stars`. */
export function fastForwardRegion(state: GameState, regionId: string, stars = 3, content: Content = CONTENT): void {
  for (let step = currentStep(state, regionId, content); step; step = currentStep(state, regionId, content)) {
    for (const [item, n] of Object.entries(step.needs)) {
      const have = count(state, item);
      if (have < n) grant(state, item, n - have);
    }
    state.stars[step.id] = Math.max(state.stars[step.id] ?? 0, stars);
    if (step.id === 'first_module' && !state.primaryArchetype) state.primaryArchetype = 'coffee';
    completeStep(state, regionId, content);
  }
}
