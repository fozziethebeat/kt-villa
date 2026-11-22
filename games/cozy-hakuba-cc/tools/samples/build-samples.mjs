// Build the game's sample banks from the CC0 libraries in sample-sources/ (download those first; see README).
// Thins each library to what the music uses, mixes the multi-mic drum kit to one file per hit, trims, and writes
// 16-bit mono WAVs to public/samples/<bank>/ plus maps to content/samples/<bank>.json.
// Usage: node tools/samples/build-samples.mjs        (no dev server needed; uses headless Chromium for decoding)
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { parseSfz } from './sfz.mjs';

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const SRC = resolve(ROOT, 'sample-sources');
const G_CLEAN = resolve(SRC, 'guitar-clean/EGuitarFSBS-clean SFZ+FLAC-20260807/EGuitarFSBS-clean bridge 20260807.sfz');
const G_JAZZ = resolve(SRC, 'guitar-jazz/EGuitarFSBS-jazz SFZ+FLAC-20260807/EGuitarFSBS-jazz bridge 20260807.sfz');
const BASS = resolve(SRC, 'bass-growly/Growlybass/growlybass_clean.sfz');
const KIT = resolve(SRC, 'drums-gogodze/Gogodze_Phu_vol_II/Samples');

/** Thin an SFZ region list: key range, every Nth root, top N velocity layers, first N round robins. Re-spread ranges. */
function thin(regions, { lo, hi, every = 1, vels = 99, rr = 99 }) {
  const roots = [...new Set(regions.map((z) => z.root))].filter((r) => r >= lo && r <= hi).sort((a, b) => a - b).filter((_, i) => i % every === 0);
  const layers = [...new Set(regions.map((z) => z.velHi))].sort((a, b) => b - a).slice(0, vels).sort((a, b) => a - b);
  const kept = regions.filter((z) => roots.includes(z.root) && layers.includes(z.velHi) && z.rr <= rr);
  const span = (r) => { const i = roots.indexOf(r); return [i === 0 ? 0 : Math.floor((roots[i - 1] + r) / 2) + 1, i === roots.length - 1 ? 127 : Math.floor((r + roots[i + 1]) / 2)]; };
  const vspan = (vh) => { const i = layers.indexOf(vh); return [i === 0 ? 1 : layers[i - 1] + 1, i === layers.length - 1 ? 127 : vh]; };
  return kept.map((z) => { const [l, h] = span(z.root), [vl, vh] = vspan(z.velHi); return { sources: [[z.file, 1]], root: z.root, lo: l, hi: h, velLo: vl, velHi: vh, rr: z.rr, tune: z.tune }; });
}

// Drum hits: our letter → kit file prefix, velocity layers to keep (with the velocity range they cover), mic blend.
const MIX = {
  kick: { kick_mic: 1, oh_mic: 0.35, front_mic: 0.25, snare_mic: 0.1 },
  snare: { snare_mic: 1, oh_mic: 0.45, front_mic: 0.25, kick_mic: 0.1 },
  hat: { oh_mic: 1, snare_mic: 0.35, front_mic: 0.3 },
  tom: { oh_mic: 0.8, front_mic: 0.6, snare_mic: 0.3, kick_mic: 0.3 },
};
const HITS = {
  k: { prefix: 'ks', layers: [[2, 1, 60], [4, 61, 100], [6, 101, 127]], mix: 'kick', sec: 1.0 },
  s: { prefix: 'sc', layers: [[3, 1, 70], [5, 71, 105], [6, 106, 127]], mix: 'snare', sec: 1.0 },
  g: { prefix: 'sc', layers: [[1, 1, 127]], mix: 'snare', sec: 0.5 },
  h: { prefix: 'hc', layers: [[2, 1, 75], [4, 76, 127]], mix: 'hat', sec: 0.5 },
  o: { prefix: 'ho', layers: [[3, 1, 90], [5, 91, 127]], mix: 'hat', sec: 1.4 },
  r: { prefix: 'hh', layers: [[2, 1, 80], [4, 81, 127]], mix: 'hat', sec: 0.9 },
  c: { prefix: 'ho', layers: [[5, 1, 127]], mix: 'hat', sec: 1.8 },
  t: { prefix: 'th', layers: [[3, 1, 90], [5, 91, 127]], mix: 'tom', sec: 1.2 },
  m: { prefix: 'tm', layers: [[3, 1, 90], [5, 91, 127]], mix: 'tom', sec: 1.2 },
  f: { prefix: 'tl', layers: [[3, 1, 90], [5, 91, 127]], mix: 'tom', sec: 1.4 },
};
function drumZones(rrMax = 2) {
  const out = {};
  for (const [letter, h] of Object.entries(HITS)) {
    out[letter] = [];
    for (const [vl, velLo, velHi] of h.layers) for (let rr = 1; rr <= rrMax; rr++) {
      const sources = Object.entries(MIX[h.mix]).map(([mic, w]) => [resolve(KIT, mic, `${h.prefix}_vl${vl}_rr${rr}.wav`), w]).filter(([f]) => existsSync(f));
      if (sources.length) out[letter].push({ sources, root: 60, lo: 0, hi: 127, velLo, velHi, rr, sec: h.sec, name: `${letter}_v${vl}_r${rr}` });
    }
  }
  return out;
}

const BANKS = [
  { id: 'guitar', source: 'FreePats FSBS Electric Guitar, clean bridge pickup', license: 'CC0-1.0', url: 'https://freepats.zenvoid.org/ElectricGuitar/clean-electric-guitar.html', sec: 1.8, zones: thin(parseSfz(G_CLEAN), { lo: 38, hi: 92, vels: 2, rr: 2 }) },
  { id: 'guitar_neck', source: 'FreePats FSBS Electric Guitar, jazz (neck) tone', license: 'CC0-1.0', url: 'https://freepats.zenvoid.org/ElectricGuitar/clean-electric-guitar.html', sec: 2.6, zones: thin(parseSfz(G_JAZZ), { lo: 58, hi: 92, vels: 1, rr: 2 }) },
  { id: 'bass', source: 'Karoryfer Growlybass (Squier Jazz Bass), clean', license: 'CC0-1.0', url: 'https://shop.karoryfer.com/pages/free-growlybass', sec: 1.8, zones: thin(parseSfz(BASS), { lo: 26, hi: 62, every: 2, vels: 2, rr: 2 }) },
  { id: 'drums', source: 'Karoryfer Gogodze Phu Vol II (mic blend by us)', license: 'CC0-1.0', url: 'https://shop.karoryfer.com/pages/free-gogodze-phu-vol-ii', drums: drumZones() },
];

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<html><body>sample builder</body></html>');
/** Decode sources in the browser, mix with weights, trim to `sec` with a 40 ms fade, return 16-bit mono WAV (base64) + peak. */
const RENDER = async ({ srcs, sec }) => {
  const ctx = new OfflineAudioContext(1, 1, 44100);
  const bufs = await Promise.all(srcs.map(async ([b64, w]) => {
    const bin = atob(b64), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return [await ctx.decodeAudioData(bytes.buffer), w];
  }));
  const sr = bufs[0][0].sampleRate;
  const len = Math.min(Math.floor(sr * sec), Math.max(...bufs.map(([b]) => b.length)));
  const out = new Float32Array(len);
  for (const [b, w] of bufs) { const d = b.getChannelData(0); for (let i = 0; i < Math.min(len, d.length); i++) out[i] += d[i] * w; }
  const fade = Math.floor(sr * 0.04);
  for (let i = 0; i < fade && i < len; i++) out[len - 1 - i] *= i / fade;
  let peak = 0; for (const v of out) peak = Math.max(peak, Math.abs(v));
  return { pcm: Array.from(out), sr, peak };
};
const encode = (pcm, sr, gain) => {
  const dv = new DataView(new ArrayBuffer(44 + pcm.length * 2));
  const w = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); dv.setUint32(4, 36 + pcm.length * 2, true); w(8, 'WAVE'); w(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, sr, true); dv.setUint32(28, sr * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, pcm.length * 2, true);
  pcm.forEach((v, i) => dv.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, Math.round(v * gain * 32767))), true));
  return Buffer.from(dv.buffer);
};

let totalBytes = 0;
for (const bank of BANKS) {
  const outDir = resolve(ROOT, 'public/samples', bank.id);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const all = bank.zones ? bank.zones.map((z) => ['', z]) : Object.entries(bank.drums).flatMap(([k, zs]) => zs.map((z) => [k, z]));
  const rendered = [];
  for (const [, z] of all) {
    const srcs = z.sources.map(([f, w]) => [readFileSync(f).toString('base64'), w]);
    rendered.push(await page.evaluate(RENDER, { srcs, sec: z.sec ?? bank.sec }));
  }
  // One gain per instrument (per drum hit for the kit): peak → -1 dBFS, so velocity layers keep their dynamics.
  const groupOf = (i) => (bank.zones ? '' : all[i][0]);
  const gains = {};
  rendered.forEach((r, i) => { const g = groupOf(i); gains[g] = Math.max(gains[g] ?? 0, r.peak); });
  const zoneOut = (z, r, i) => {
    const gain = 0.89 / gains[groupOf(i)];
    const name = `${z.name ?? `${z.root}_v${z.velHi}_r${z.rr}`}.wav`.replace(/[^\w.-]/g, '_');
    const bytes = encode(r.pcm, r.sr, gain);
    writeFileSync(resolve(outDir, name), bytes);
    totalBytes += bytes.length;
    void i;
    return { url: `samples/${bank.id}/${name}`, root: z.root, lo: z.lo, hi: z.hi, velLo: z.velLo, velHi: z.velHi, rr: z.rr, ...(z.tune ? { tune: z.tune } : {}) };
  };
  const map = { id: bank.id, source: bank.source, license: bank.license, url: bank.url };
  if (bank.zones) map.zones = bank.zones.map((z, i) => zoneOut(z, rendered[i], i));
  else { map.drums = {}; let i = 0; for (const [k, zs] of Object.entries(bank.drums)) map.drums[k] = zs.map((z) => { const o = zoneOut(z, rendered[i], i); i++; return o; }); }
  mkdirSync(resolve(ROOT, 'content/samples'), { recursive: true });
  writeFileSync(resolve(ROOT, 'content/samples', `${bank.id}.json`), JSON.stringify(map, null, 1));
  console.log(`${bank.id}: ${all.length} samples (${bank.zones ? [...new Set(bank.zones.map((z) => z.root))].length + ' roots' : Object.keys(bank.drums).length + ' hits'})`);
}
await browser.close();
console.log(`Total ${(totalBytes / 1e6).toFixed(1)} MB in public/samples/`);
void basename;
