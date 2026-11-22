import { SONGS, type SongId } from './music/player';
import { MusicRig, type Variant } from './music/rig';
import { loadBanks } from './music/banks';
import { loopSeconds, type SongDef } from './music/score';

/** Music audition page + offline renderer (used by tools/render-music.mjs). */
let songId: SongId = 'winter';
let SONG: SongDef = SONGS[songId];
const LAYER_NAMES = ['Dormant: pad + bell', 'Stirring: + clean guitar', 'Awake: + bass & drums', 'Thriving: + lead & fuzz wall'];

let variant: Variant = 'band';
let layers = 3;
let ctx: AudioContext | null = null;
let rig: MusicRig | null = null;
let timer = 0;
const status = document.getElementById('status')!;
const layerName = document.getElementById('layerName')!;
const slider = document.getElementById('layers') as HTMLInputElement;

function stop() {
  window.clearTimeout(timer);
  if (ctx) { void ctx.close(); ctx = null; rig = null; }
  status.textContent = '';
}

function play() {
  stop();
  ctx = new AudioContext();
  rig = new MusicRig(ctx, variant);
  if (variant === 'band') { const c = ctx; void loadBanks(c).then((b) => { if (rig && ctx === c) rig.useSamples(b); }); }
  rig.load(SONG);
  rig.setLayers(layers, ctx.currentTime, 0.01);
  let next = ctx.currentTime + 0.15;
  const pump = () => {
    if (!ctx || !rig) return;
    while (next < ctx.currentTime + 4) next += rig.schedule(SONG, next); // queue loops a few seconds ahead
    timer = window.setTimeout(pump, 1000);
  };
  pump();
  status.textContent = `Playing ${variant === 'synth' ? 'A · Synth' : 'B · Tape sampler'} (loop ${loopSeconds(SONG).toFixed(1)} s)`;
}

document.querySelectorAll<HTMLButtonElement>('[data-variant]').forEach((b) => b.addEventListener('click', () => {
  variant = b.dataset.variant as Variant;
  document.querySelectorAll('[data-variant]').forEach((x) => x.classList.toggle('on', x === b));
  if (ctx) play();
}));
const info = document.getElementById('songInfo')!;
const describe = () => { info.textContent = `${SONG.title} · ${songId === 'cafe' ? '150 BPM in 7/8' : `${SONG.bpm} BPM`} · ${loopSeconds(SONG).toFixed(1)} s loop. Hand-written score; the tape sampler (B) is the house sound.`; };
describe();
document.querySelectorAll<HTMLButtonElement>('[data-song]').forEach((b) => b.addEventListener('click', () => {
  songId = b.dataset.song as SongId; SONG = SONGS[songId];
  document.querySelectorAll('[data-song]').forEach((x) => x.classList.toggle('on', x === b));
  describe();
  if (ctx) play();
}));
slider.addEventListener('input', () => { layers = Number(slider.value); layerName.textContent = LAYER_NAMES[layers]; rig?.setLayers(layers); });
layerName.textContent = LAYER_NAMES[layers];
document.getElementById('play')!.addEventListener('click', play);
document.getElementById('stop')!.addEventListener('click', stop);

// ---- offline rendering (for files + automated checks) --------------------------

function wav(buf: AudioBuffer): Uint8Array {
  const ch = buf.numberOfChannels, len = buf.length, sr = buf.sampleRate;
  const out = new DataView(new ArrayBuffer(44 + len * ch * 2));
  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); out.setUint32(4, 36 + len * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true); out.setUint32(24, sr, true);
  out.setUint32(28, sr * ch * 2, true); out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, len * ch * 2, true);
  const data = Array.from({ length: ch }, (_, c) => buf.getChannelData(c));
  let o = 44;
  for (let i = 0; i < len; i++) for (let c = 0; c < ch; c++) { const v = Math.max(-1, Math.min(1, data[c][i])); out.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true); o += 2; }
  return new Uint8Array(out.buffer);
}

/** Render `loops` passes at a layer level and return a base64 WAV. */
async function renderSong(v: Variant, layerLevel: number, loops = 2, id: SongId = songId, solo: string[] | null = null): Promise<string> {
  const SONG = SONGS[id];
  const sr = 44100, secs = loopSeconds(SONG) * loops + 3.5; // + reverb tail
  const off = new OfflineAudioContext(2, Math.ceil(sr * secs), sr);
  const r = new MusicRig(off, v);
  if (v === 'band') r.useSamples(await loadBanks(off));
  r.load(SONG);
  r.setSolo(solo);
  r.setLayers(layerLevel, 0, 0.001);
  for (let i = 0, t = 0.05; i < loops; i++) t += r.schedule(SONG, t);
  const buf = await off.startRendering();
  (window as unknown as { lastRenderStats: unknown }).lastRenderStats = { banks: Object.keys(await loadBanks(off)), stats: r.stats };
  const bytes = wav(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

(window as unknown as { renderSong: typeof renderSong; songInfo: () => unknown }).renderSong = renderSong;
(window as unknown as { songInfo: (id?: SongId) => unknown }).songInfo = (id: SongId = songId) => ({ title: SONGS[id].title, bpm: SONGS[id].bpm, loopSeconds: loopSeconds(SONGS[id]), parts: SONGS[id].parts.map((p) => ({ name: p.name, layer: p.layer, until: p.until ?? 3 })) });
