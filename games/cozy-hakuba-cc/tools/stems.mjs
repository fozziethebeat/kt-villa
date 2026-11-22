// Stem levels for blind mixing: render each part of a song solo (at a layer) and report its loudness and band balance.
import { mkdirSync, writeFileSync } from 'node:fs';
// Usage: node tools/stems.mjs <song> [layer=3] [--variant band]
import { chromium } from '@playwright/test';
import { analyzeWav } from './analyze-wav.mjs';
const args = process.argv.slice(2);
const song = args[0] ?? 'winter', layer = Number(args[1] ?? 3);
const variant = args.includes('--variant') ? args[args.indexOf('--variant') + 1] : 'band';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:5173/audition.html');
await page.waitForFunction(() => typeof window.renderSong === 'function');
const info = await page.evaluate((id) => window.songInfo(id), song);
const rows = [];
for (const p of info.parts.filter((p) => layer >= p.layer && layer <= p.until)) {
  const b64 = await page.evaluate(([id, l, v, name]) => window.renderSong(v, l, 1, id, [name]), [song, layer, variant, p.name]);
  if (args.includes('--save')) { mkdirSync('music-renders/stems', { recursive: true }); writeFileSync(`music-renders/stems/${song}-L${layer}-${p.name}.wav`, Buffer.from(b64, 'base64')); }
  const a = analyzeWav(Buffer.from(b64, 'base64'), info.loopSeconds / 2);
  rows.push({ part: p.name, loudDb: a.loudnessDb, peakDb: a.peakDb, low: a.bands.low, mid: a.bands.mid, high: a.bands.high });
}
const all = await page.evaluate(([id, l, v]) => window.renderSong(v, l, 1, id), [song, layer, variant]);
const a = analyzeWav(Buffer.from(all, 'base64'), info.loopSeconds / 2);
rows.push({ part: '(full mix)', loudDb: a.loudnessDb, peakDb: a.peakDb, low: a.bands.low, mid: a.bands.mid, high: a.bands.high });
await browser.close();
console.table(rows);
