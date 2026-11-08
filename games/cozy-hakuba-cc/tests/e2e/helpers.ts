import type { Page } from '@playwright/test';

/** Typed handle to window.__hakuba inside page.evaluate. */
export type Hakuba = {
  getState(): any; summary(): any; activeScenes(): string[]; startScene(k: string): void;
  setSeason(s: string): void; setVitality(r: string, v: number): void; grant(i: string, n?: number): void;
  endDay(): void; warp(x: number, y: number): void; freeze(on?: boolean): void; newGame(seed?: number): void;
};

export async function boot(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__hakuba?.activeScenes().includes('Title'));
}

export async function waitForScene(page: Page, key: string) {
  await page.waitForFunction((k) => (window as any).__hakuba.activeScenes().includes(k), key);
}

/** Let tweens settle, then freeze them for a stable screenshot. */
export async function settle(page: Page, ms = 2600) {
  await page.waitForTimeout(ms);
  await page.evaluate(() => (window as any).__hakuba.freeze(true));
}

export const hk = <T>(page: Page, fn: (h: Hakuba) => T) => page.evaluate(`(${fn.toString()})(window.__hakuba)`) as Promise<T>;
