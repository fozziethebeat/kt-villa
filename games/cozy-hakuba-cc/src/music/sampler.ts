/**
 * One-shot sample banks (the OP-1-style workflow with real recordings): each instrument is a set of zones
 * (sample file, root note, key range, velocity range, round-robin slot). Notes pick the zone covering the key and
 * velocity, rotate through round-robins, and re-pitch the recording (playbackRate) to the exact note.
 * Banks decode with whatever context they're given, so the same bank works live and in offline renders.
 */
export interface Zone { url: string; root: number; lo: number; hi: number; velLo: number; velHi: number; rr?: number; tune?: number; gainDb?: number }
export interface SampleMap { id: string; source: string; license: string; zones?: Zone[]; drums?: Record<string, Zone[]> }

export class SampleBank {
  private buffers = new Map<string, AudioBuffer>();
  private rr = new Map<string, number>();
  constructor(readonly map: SampleMap) {}

  /** Fetch + decode every sample referenced by the map. */
  async load(ctx: BaseAudioContext, base = ''): Promise<this> {
    const urls = new Set([...(this.map.zones ?? []), ...Object.values(this.map.drums ?? {}).flat()].map((z) => z.url));
    await Promise.all([...urls].map(async (u) => {
      const res = await fetch(base + u);
      if (!res.ok) throw new Error(`sample ${u}: HTTP ${res.status}`);
      this.buffers.set(u, await ctx.decodeAudioData(await res.arrayBuffer()));
    }));
    return this;
  }

  get loaded() { return this.buffers.size > 0; }

  private choose(zones: Zone[], key: string, vel: number, midi?: number): Zone | null {
    const v = Math.max(1, Math.min(127, Math.round(vel * 100)));
    let cands = zones.filter((z) => (midi === undefined || (midi >= z.lo && midi <= z.hi)) && v >= z.velLo && v <= z.velHi);
    if (!cands.length && midi !== undefined) {
      // No exact zone: take the nearest root at a matching velocity (or any velocity).
      const pool = zones.filter((z) => v >= z.velLo && v <= z.velHi);
      const src = pool.length ? pool : zones;
      const best = Math.min(...src.map((z) => Math.abs(z.root - midi)));
      cands = src.filter((z) => Math.abs(z.root - midi) === best);
    }
    if (!cands.length) cands = zones;
    if (!cands.length) return null;
    const n = (this.rr.get(key) ?? 0) + 1;
    this.rr.set(key, n);
    return cands[n % cands.length];
  }

  /** Pitched instrument: buffer + playback rate for this MIDI note (velocity 0..1+). */
  note(midi: number, vel: number): { buf: AudioBuffer; rate: number; gain: number } | null {
    const z = this.choose(this.map.zones ?? [], `n${midi}`, vel, midi);
    const buf = z && this.buffers.get(z.url);
    if (!z || !buf) return null;
    return { buf, rate: 2 ** ((midi - z.root + (z.tune ?? 0) / 100) / 12), gain: 10 ** ((z.gainDb ?? 0) / 20) };
  }

  /** Drum hit by letter (k s g h o r c t m f). */
  hit(kind: string, vel: number): { buf: AudioBuffer; rate: number; gain: number } | null {
    const zones = this.map.drums?.[kind];
    if (!zones?.length) return null;
    const z = this.choose(zones, `d${kind}`, vel);
    const buf = z && this.buffers.get(z.url);
    return z && buf ? { buf, rate: 1, gain: 10 ** ((z.gainDb ?? 0) / 20) } : null;
  }
}
