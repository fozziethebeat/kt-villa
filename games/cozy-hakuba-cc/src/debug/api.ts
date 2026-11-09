import type Phaser from 'phaser';
import { store } from '../gameStore';
import { clearSave, loadGame, saveGame } from '../persist';
import { CONTENT } from '../sim/content';
import { createNewGame, grant, jumpToSeason, phase, season, setVitality, spendAction, staminaLeft } from '../sim/game';
import { currentStep } from '../sim/quests';
import type { ActionKind, SeasonId, Vitality } from '../sim/types';

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
      yen: store.state.yen, kizuna: store.state.kizuna, inventory: { ...store.state.inventory }, step: currentStep(store.state, 'station')?.id ?? null,
      vitality: Object.fromEntries(Object.entries(store.state.regions).map(([k, v]) => [k, v.vitality])),
      reputation: store.state.business.reputation, unlocks: [...store.state.unlocks],
    }),
    activeScenes: () => game.scene.getScenes(true).map((s) => s.scene.key),
    startScene: (key: string, data?: object) => { for (const s of game.scene.getScenes(true)) game.scene.stop(s.scene.key); game.scene.start(key, data); },
    newGame: (seed?: number) => store.replace(createNewGame({ seed }), 'debug'),
    setSeason: (s: SeasonId) => store.update('debug', (st) => jumpToSeason(st, s)),
    setVitality: (region: string, v: Vitality) => store.update('debug', (st) => setVitality(st, region, v)),
    grant: (item: string, n = 1) => store.update('debug', (st) => grant(st, item, n)),
    spend: (kind: ActionKind) => { let r; store.update('debug', (st) => { r = spendAction(st, kind); }); return r; },
    endDay: () => game.events.emit('endDay'),
    warp: (x: number, y: number) => scene<{ warp(x: number, y: number): void }>('Station').warp(x, y),
    save: () => saveGame(store.state),
    load: () => { const s = loadGame(); if (s) store.replace(s, 'load'); return !!s; },
    clearSave,
    /** Freeze tweens/animations for stable screenshots. */
    freeze: (on = true) => game.scene.getScenes(true).forEach((s) => { if (on) s.tweens.pauseAll(); else s.tweens.resumeAll(); }),
  };
  (window as unknown as { __hakuba: typeof api }).__hakuba = api;
  return api;
}
