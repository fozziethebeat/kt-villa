import { loadBanks } from './banks';
import { MusicRig } from './rig';
import type { SampleBank } from './sampler';
import { loopSeconds, type SongDef } from './score';
import { cafeShift } from './songs/cafeShift';
import { greenRegion } from './songs/greenRegion';
import { winterRegion } from './songs/winterRegion';

export const SONGS = { winter: winterRegion, green: greenRegion, cafe: cafeShift } satisfies Record<string, SongDef>;
export type SongId = keyof typeof SONGS;

interface Playing { id: SongId; rig: MusicRig; out: GainNode; timer: number; loopStart: number; cursor: number }

/**
 * In-game music: plays hand-composed songs on the dry live-band rig (real one-shot guitar, bass and drum samples), loops them seamlessly, crossfades between
 * songs, fades restoration layers in and out live, and darkens the tone in the evening and at night.
 * It waits for the audio context (first user gesture) and the sample banks, then picks up whatever was last requested.
 * If the samples fail to load, it plays the band rig's synthesized fallback instead.
 */
export class MusicPlayer {
  private ctx: AudioContext | null = null;
  private bus!: GainNode;
  private tone!: BiquadFilterNode;
  private cur: Playing | null = null;
  private want: { id: SongId; layers: number } | null = null;
  private dark = 0;
  /** The region song to return to after a café shift. */
  private regionWant: { id: SongId; layers: number } | null = null;
  /** Decoded sample banks; undefined while loading, null if loading failed (synth fallback). */
  private banks: Partial<Record<string, SampleBank>> | null | undefined;

  /** Attach to the audio engine's context and output once audio is allowed. */
  attach(ctx: AudioContext, out: AudioNode) {
    if (this.ctx) return;
    this.ctx = ctx;
    this.tone = ctx.createBiquadFilter(); this.tone.type = 'lowpass'; this.tone.frequency.value = 18000;
    this.bus = ctx.createGain();
    this.bus.connect(this.tone).connect(out);
    this.applyDark();
    loadBanks(ctx).then((b) => { this.banks = b; }, () => { this.banks = null; }).finally(() => {
      if (this.want) { const w = this.want; this.want = null; this.play(w.id, w.layers); }
    });
  }

  get current(): SongId | null { return this.cur?.id ?? this.want?.id ?? null; }

  /** Debug: whether the sample banks loaded and how many notes the current rig played from samples vs synthesis. */
  get debugInfo() { return { samples: this.banks === undefined ? 'loading' : this.banks ? Object.keys(this.banks) : 'failed', stats: this.cur?.rig.stats ?? null }; }

  /** Play a song at a layer level (0–3). Same song: just move the layers. Different song: crossfade. */
  play(id: SongId, layers = 3, fade = 2) {
    if (!this.ctx || this.banks === undefined) { this.want = { id, layers }; return; }
    if (this.cur?.id === id) { this.cur.rig.setLayers(layers); return; }
    const ctx = this.ctx, now = ctx.currentTime;
    if (this.cur) this.fadeOut(this.cur, fade);
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, now); out.gain.exponentialRampToValueAtTime(1, now + fade);
    out.connect(this.bus);
    const song = SONGS[id];
    const rig = new MusicRig(ctx, 'band', out);
    if (this.banks) rig.useSamples(this.banks);
    rig.load(song);
    rig.setLayers(layers, now, 0.01);
    const len = loopSeconds(song);
    const p: Playing = { id, rig, out, timer: 0, loopStart: now + 0.1, cursor: now + 0.1 };
    // Stream notes ~1.5 s ahead in small batches (keeps CPU smooth; a whole loop at once causes hitches).
    const pump = () => {
      const until = ctx.currentTime + 1.5;
      while (p.cursor < until) {
        const end = Math.min(until, p.loopStart + len);
        rig.scheduleRange(p.loopStart, p.cursor, end);
        p.cursor = end;
        if (p.cursor >= p.loopStart + len - 1e-6) p.loopStart += len;
      }
      p.timer = window.setTimeout(pump, 250);
    };
    pump();
    this.cur = p;
  }

  /** Region music follows season + restoration; remembered so the café can hand back to it. */
  region(snowy: boolean, vitality: number) {
    this.regionWant = { id: snowy ? 'winter' : 'green', layers: vitality };
    this.play(this.regionWant.id, vitality);
  }

  /** Return to the region song after a shift (or anything else that took over). */
  backToRegion() { if (this.regionWant) this.play(this.regionWant.id, this.regionWant.layers); }

  /** 0 = daylight … 1 = night: rolls off the top end for a hazier, sleepier sound. */
  setDark(d: number) { this.dark = d; this.applyDark(); }

  private applyDark() {
    if (!this.ctx) return;
    const hz = 18000 * Math.pow(1800 / 18000, this.dark);
    this.tone.frequency.setTargetAtTime(hz, this.ctx.currentTime, 0.8);
  }

  setVolume(v: number) { if (this.bus) this.bus.gain.setTargetAtTime(v, this.ctx!.currentTime, 0.1); }

  stop(fade = 1.5) { if (this.cur) { this.fadeOut(this.cur, fade); this.cur = null; } this.want = null; }

  private fadeOut(p: Playing, fade: number) {
    const now = this.ctx!.currentTime;
    window.clearTimeout(p.timer);
    p.out.gain.cancelScheduledValues(now);
    p.out.gain.setValueAtTime(Math.max(0.0001, p.out.gain.value), now);
    p.out.gain.exponentialRampToValueAtTime(0.0001, now + fade);
    window.setTimeout(() => p.out.disconnect(), (fade + 0.5) * 1000); // notes already queued play into silence
  }
}

export const music = new MusicPlayer();
