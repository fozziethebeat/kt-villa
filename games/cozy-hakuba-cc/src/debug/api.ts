import type Phaser from 'phaser';
import { store } from '../gameStore';
import { clearSave, loadGame, saveGame } from '../persist';
import { CONTENT } from '../sim/content';
import { createNewGame, grant, jumpToSeason, phase, season, setVitality, spendAction, staminaLeft } from '../sim/game';
import { currentStep, fastForwardRegion } from '../sim/quests';
import { simulateSeason } from '../sim/balance';
import { drive, openRoad } from '../sim/travel';
import { REGION_SCENES, goToRegion, switchTo } from '../scenes/regions';
import type { ActionKind, ScoredSeason, SeasonId, Vitality } from '../sim/types';

/**
 * Debug/playtest API exposed as window.__hakuba. Used by Claude in the browser pane and by Playwright.
 * Mutations go through store.update('debug', ...) so scenes snap to the new state without long tweens.
 */
export function installDebugApi(game: Phaser.Game) {
  const scene = <T = any>(key: string) => game.scene.getScene(key) as unknown as T;
  const api = {
    game,
    content: CONTENT,
    scene,
    getState: () => JSON.parse(JSON.stringify(store.state)),
    summary: () => ({
      day: store.state.day, season: season(store.state), phase: phase(store.state), stamina: staminaLeft(store.state), staminaMax: store.state.staminaMax,
      yen: store.state.yen, kizuna: store.state.kizuna, inventory: { ...store.state.inventory }, region: store.state.currentRegion, step: currentStep(store.state, store.state.currentRegion)?.id ?? null,
      primary: store.state.primaryArchetype, chassis: store.state.chassisTier, roof: [...store.state.van.roof], menu: store.state.business.menu,
      vitality: Object.fromEntries(Object.entries(store.state.regions).map(([k, v]) => [k, v.vitality])),
      reputation: store.state.business.reputation, unlocks: [...store.state.unlocks],
    }),
    activeScenes: () => game.scene.getScenes(true).map((s) => s.scene.key),
    startScene: (key: string, data?: object) => switchTo(game, key, data),
    /** Jump to a region scene (no stamina, no road checks). */
    goto: (region: string) => { store.update('debug', (st) => { st.currentRegion = region; }); goToRegion(game, region); },
    /** Drive like the player would (checks roads, spends stamina). */
    drive: (region: string) => { let ok = false; store.update('drive', (st) => { ok = drive(st, region).ok; }); if (ok) goToRegion(game, region); return ok; },
    openRoad: (region: string) => { let r; store.update('board', (st) => { r = openRoad(st, region); }); return r; },
    /** Complete a region's remaining quest steps at 3★ (for testing later content). */
    fastForward: (region: string) => store.update('debug', (st) => fastForwardRegion(st, region)),
    balance: (season: ScoredSeason, days = 7) => simulateSeason(store.state, season, days),
    regionScene: () => REGION_SCENES[store.state.currentRegion],
    /** Restore today's stamina (testing only). */
    /** Turn the one-step-per-day pacing on/off (tests play whole arcs in one sitting). */
    setPacing: (on: boolean) => { (CONTENT.tuning as { stepCooldownDays: number }).stepCooldownDays = on ? 1 : 0; },
    setReputation: (n: number) => store.update('debug', (st) => { st.business.reputation = n; }),
    rest: () => store.update('debug', (st) => { st.staminaSpent = 0; }),
    setChassis: (tier: number) => store.update('debug', (st) => { st.chassisTier = tier; st.van.grid = { ...CONTENT.chassis[tier].grid }; }),
    newGame: (seed?: number) => store.replace(createNewGame({ seed }), 'debug'),
    setSeason: (s: SeasonId) => store.update('debug', (st) => jumpToSeason(st, s)),
    setVitality: (region: string, v: Vitality) => store.update('debug', (st) => setVitality(st, region, v)),
    grant: (item: string, n = 1) => store.update('debug', (st) => grant(st, item, n)),
    spend: (kind: ActionKind) => { let r; store.update('debug', (st) => { r = spendAction(st, kind); }); return r; },
    endDay: () => game.events.emit('endDay'),
    warp: (x: number, y: number) => scene<{ warp(x: number, y: number): void }>(REGION_SCENES[store.state.currentRegion]).warp(x, y),
    save: () => saveGame(store.state),
    load: () => { const s = loadGame(); if (s) store.replace(s, 'load'); return !!s; },
    clearSave,
    /** Freeze tweens/animations for stable screenshots. */
    freeze: (on = true) => game.scene.getScenes(true).forEach((s) => { if (on) s.tweens.pauseAll(); else s.tweens.resumeAll(); }),
  };
  (window as unknown as { __hakuba: typeof api }).__hakuba = api;
  return api;
}
