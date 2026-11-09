import { CONTENT, archetypeDef, moduleDef } from './content';
import { addUnlock } from './game';
import { currentStep, recordResult } from './quests';
import { grantModule } from './van';
import type { Content, GameState } from './types';

export type ChooseResult = { ok: true } | { ok: false; reason: 'chosen' | 'not_yet' };

/** Pick the van's primary trade at Takumi's workbench (Snow Peak step 3). One-time choice. */
export function chooseArchetype(state: GameState, id: string, content: Content = CONTENT): ChooseResult {
  archetypeDef(content, id);
  if (state.primaryArchetype) return { ok: false, reason: 'chosen' };
  if (currentStep(state, 'snowpeak', content)?.id !== 'first_module') return { ok: false, reason: 'not_yet' };
  state.primaryArchetype = id;
  addUnlock(state, `business:${id}`);
  state.business.menu = null; // let the automatic menu pick up the new specialty
  state.log.push(`Day ${state.day}: chose ${archetypeDef(content, id).name}.`);
  return { ok: true };
}

/**
 * Finish the first-module build: grants the archetype's signature module (free) and the quest item.
 * If the player already bought that module, they get its price back instead.
 */
export function finishBuild(state: GameState, stars: number, content: Content = CONTENT): { moduleId: string; refund: number } {
  if (!state.primaryArchetype) throw new Error('choose an archetype first');
  const moduleId = archetypeDef(content, state.primaryArchetype).builds;
  let refund = 0;
  if (state.van.owned.includes(moduleId)) { refund = moduleDef(content, moduleId).price; state.yen += refund; }
  else grantModule(state, moduleId);
  recordResult(state, 'first_module', stars, 'built_module');
  return { moduleId, refund };
}
