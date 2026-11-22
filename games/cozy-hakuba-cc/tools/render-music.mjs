// Render the audition song offline in headless Chromium, write WAVs, and print objective checks.
// Usage: node tools/render-music.mjs [baseUrl]   (dev server must be running; default http://localhost:5173)
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { analyzeWav } from './analyze-wav.mjs';

// Args: [baseUrl] [--variant band|tape|synth] [--only winter:3,green:0,...]
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const base = args.find((a) => a.startsWith('http')) ?? 'http://localhost:5173';
const variant = opt('--variant', 'band');
const outDir = new URL('../music-renders/', import.meta.url);
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`${base}/audition.html`);
await page.waitForFunction(() => typeof window.renderSong === 'function');
// Default: each song at Dormant (L0) and Thriving (L3); the café always plays L3.
const only = opt('--only', null);
const jobs = only ? only.split(',').map((j) => { const [s, l] = j.split(':'); return [s, Number(l ?? 3)]; }) : [['winter', 0], ['winter', 3], ['green', 0], ['green', 3], ['cafe', 3]];
const rows = [];
for (const [song, layers] of jobs) {
  const info = await page.evaluate((id) => window.songInfo(id), song);
  const b64 = await page.evaluate(([id, l, v]) => window.renderSong(v, l, 2, id), [song, layers, variant]);
  const bytes = Buffer.from(b64, 'base64');
  const name = `${song}-${variant}-L${layers}${opt('--tag', '') ? `-${opt('--tag', '')}` : ''}.wav`;
  writeFileSync(new URL(name, outDir), bytes);
  console.log(`rendered ${name}: "${info.title}", loop ${info.loopSeconds.toFixed(2)} s`);
  rows.push({ file: name, ...analyzeWav(bytes, info.loopSeconds) });
}
await browser.close();
console.table(rows.map((r) => ({ file: r.file, peakDb: r.peakDb, loudDb: r.loudnessDb, clipped: r.clipped, gaps: r.silentGaps, seamDb: r.seamDeltaDb, low: r.bands.low, mid: r.bands.mid, high: r.bands.high })));
writeFileSync(new URL('report.json', outDir), JSON.stringify(rows, null, 2));
const problems = rows.flatMap((r) => r.problems.map((p) => `${r.file}: ${p}`));
console.log(problems.length ? `\nProblems:\n${problems.join('\n')}` : '\nNo problems found.');
