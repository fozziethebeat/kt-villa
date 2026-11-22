import { midiToHz } from './theory';
import type { SampleBank } from './sampler';
import { BANK_FOR } from './banks';
import { loopSeconds, partEvents, type Articulation, type InstrumentId, type NoteEvent, type SongDef } from './score';

/**
 * The band, built from synthesis (works on a live AudioContext or an OfflineAudioContext for rendering).
 *
 * Variants:
 *  - 'band':  the house sound. Dry, close-miked indie band: bright single-coil clean guitar (little chorus), mid-forward
 *             overdrive instead of fuzz, a plucked electric bass, a plucked lead guitar, a dry humanized kit with toms,
 *             strummed chords, and only a short plate reverb.
 *  - 'synth': every note synthesized fresh (Karplus-Strong plucked strings, subtractive bass/pad/lead, FM bell,
 *             oscillator+noise drums), through chorus, amp-ish EQ and a generated reverb.
 *  - 'tape':  the OP-1 / OP-XY workflow. Each instrument is *sampled once* from the synth at one pitch and
 *             re-pitched across the keyboard (sampler character), drums are a chopped one-shot kit through a
 *             12-bit crusher, and the whole mix is printed through a "tape" bus (wow, flutter, saturation, hiss).
 */
export type Variant = 'band' | 'synth' | 'tape';

/**
 * Mix/tone settings per variant. 'band' is the house sound (chosen 2026-11-21): a dry, close-miked indie band with a
 * short plate, after the first wet drafts were judged "washed out".
 */
const TONE = {
  band: { irSec: 1.2, irDark: 0.7, revReturn: 0.2, sends: { pluck: 0.08, fuzz: 0.1, drums: 0.03, bass: 0, pad: 0.35, bell: 0.3, lead: 0.24 }, delay: { bell: 0.12, lead: 0.08 }, chorus: 0.24, air: 1.5, comp: [-10, 1.4] },
  synth: { irSec: 3.2, irDark: 0.4, revReturn: 0.55, sends: { pluck: 1, fuzz: 1.4, drums: 0.18, bass: 0, pad: 0.8, bell: 0.6, lead: 0.6 }, delay: { bell: 0.2, lead: 0.35 }, chorus: 0.55, air: 5, comp: [-18, 3] },
  tape: { irSec: 3.2, irDark: 0.4, revReturn: 0.55, sends: { pluck: 1, fuzz: 1.4, drums: 0.18, bass: 0, pad: 0.8, bell: 0.6, lead: 0.6 }, delay: { bell: 0.2, lead: 0.35 }, chorus: 0.55, air: 5, comp: [-18, 3] },
} as const;

/** Relative levels of the sampled drum hits (a drummer's natural balance: hats well under kick and snare). */
const DRUM_LEVEL: Record<string, number> = { k: 1.15, s: 1.1, g: 0.7, h: 0.55, o: 0.5, r: 0.5, c: 0.55, t: 0.8, m: 0.8, f: 0.85 };

/** Deterministic per-note jitter in [-1, 1] (same every loop, different per note). */
function jitter(a: number, b: number): number {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (((h ^ (h >>> 16)) >>> 0) / 4294967295) * 2 - 1;
}

type Ctx = BaseAudioContext;

// ---- DSP helpers ---------------------------------------------------------------

/** Karplus-Strong plucked string as a buffer (the core of the guitar sound). */
function ksBuffer(ctx: Ctx, freq: number, seconds: number, opts: { bright?: number; decay?: number; pick?: number } = {}): AudioBuffer {
  const sr = ctx.sampleRate, len = Math.floor(sr * seconds);
  const buf = ctx.createBuffer(1, len, sr);
  const out = buf.getChannelData(0);
  const N = Math.max(2, Math.round(sr / freq));
  const ring = new Float32Array(N);
  // Excitation: noise, low-passed by "brightness" (pick tone), with a pick-position comb.
  const bright = opts.bright ?? 0.6;
  let lp = 0;
  for (let i = 0; i < N; i++) { lp += bright * ((Math.random() * 2 - 1) - lp); ring[i] = lp; }
  const pick = Math.floor(N * (opts.pick ?? 0.18));
  for (let i = N - 1; i >= pick; i--) ring[i] -= ring[i - pick] * 0.5;
  const decay = opts.decay ?? 0.996;
  let idx = 0;
  for (let i = 0; i < len; i++) {
    const a = ring[idx], b = ring[(idx + 1) % N];
    out[i] = a;
    ring[idx] = decay * 0.5 * (a + b);
    idx = (idx + 1) % N;
  }
  // Normalize.
  let peak = 0;
  for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(out[i]));
  if (peak > 0) for (let i = 0; i < len; i++) out[i] /= peak;
  return buf;
}

function noiseBuffer(ctx: Ctx, seconds: number): AudioBuffer {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/**
 * Improved plucked string for the band sound (v2 model): triangle "pick" displacement instead of a noise burst,
 * a one-pole loss filter in the loop so upper harmonics die faster than the fundamental (real strings darken as
 * they ring; plain Karplus-Strong sounds like a harpsichord), and a pickup-position comb on the output.
 */
function stringBuffer(ctx: Ctx, freq: number, seconds: number, opts: { tone?: number; decay?: number; pick?: number; pickup?: number; noise?: number } = {}): AudioBuffer {
  const sr = ctx.sampleRate, len = Math.floor(sr * seconds);
  const buf = ctx.createBuffer(1, len, sr);
  const out = buf.getChannelData(0);
  const N = Math.max(2, Math.round(sr / freq - 0.5)); // the loss filter adds ~half a sample of delay
  const ring = new Float32Array(N);
  const p = Math.max(1, Math.floor(N * (opts.pick ?? 0.2)));
  const noise = opts.noise ?? 0.08;
  let mean = 0;
  for (let i = 0; i < N; i++) { ring[i] = (i < p ? i / p : (N - i) / (N - p)) + (Math.random() * 2 - 1) * noise; mean += ring[i]; }
  mean /= N;
  for (let i = 0; i < N; i++) ring[i] -= mean;
  const tone = opts.tone ?? 0.5; // 0 dark … 1 bright: how gently the loop filter damps highs
  const damp = 0.18 + 0.75 * tone;
  const decay = opts.decay ?? 0.997;
  let idx = 0, z = 0;
  for (let i = 0; i < len; i++) {
    const a = ring[idx], b = ring[(idx + 1) % N];
    out[i] = a;
    z += damp * (0.5 * (a + b) - z);
    ring[idx] = decay * z;
    idx = (idx + 1) % N;
  }
  // Pickup position: comb on the output (a neck pickup sits further from the bridge than a bridge pickup).
  const M = Math.max(1, Math.floor(N * (opts.pickup ?? 0.27)));
  for (let i = len - 1; i >= M; i--) out[i] -= 0.55 * out[i - M];
  let peak = 0;
  for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(out[i]));
  if (peak > 0) for (let i = 0; i < len; i++) out[i] /= peak;
  return buf;
}

/** Stereo reverb impulse: decaying, slightly darkening noise (no external IR files). */
function reverbIR(ctx: Ctx, seconds: number, darken = 0.4): AudioBuffer {
  const sr = ctx.sampleRate, len = Math.floor(sr * seconds);
  const buf = ctx.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const k = 1 - darken * t; // brighter early, darker tail
      lp += k * ((Math.random() * 2 - 1) - lp);
      d[i] = lp * Math.pow(1 - t, 2.2);
    }
  }
  return buf;
}

function shaper(ctx: Ctx, amount: number, crushBits = 0): WaveShaperNode {
  const n = 2048, curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let x = (i / (n - 1)) * 2 - 1;
    x = Math.tanh(amount * x) / Math.tanh(amount);
    if (crushBits) { const q = 2 ** crushBits; x = Math.round(x * q) / q; }
    curve[i] = x;
  }
  const s = ctx.createWaveShaper();
  s.curve = curve;
  s.oversample = '2x';
  return s;
}

function lfo(ctx: Ctx, freq: number, depth: number, target: AudioParam, startAt = 0) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.value = freq; g.gain.value = depth;
  o.connect(g).connect(target);
  o.start(startAt);
  return o;
}

/** Simple stereo chorus: two modulated short delays panned apart. */
function chorus(ctx: Ctx, input: AudioNode, output: AudioNode, mix = 0.5) {
  const dry = ctx.createGain(); dry.gain.value = 1 - mix * 0.5;
  input.connect(dry).connect(output);
  [-0.6, 0.6].forEach((pan, i) => {
    const d = ctx.createDelay(0.05); d.delayTime.value = 0.012 + i * 0.006;
    lfo(ctx, 0.6 + i * 0.27, 0.003, d.delayTime);
    const g = ctx.createGain(); g.gain.value = mix * 0.6;
    const p = ctx.createStereoPanner(); p.pan.value = pan;
    input.connect(d).connect(g).connect(p).connect(output);
  });
}

// ---- the rig -------------------------------------------------------------------

export class MusicRig {
  readonly master: GainNode;
  private mixBus!: GainNode;
  private buses = {} as Record<InstrumentId, GainNode>;
  private reverb: ConvolverNode;
  private reverbSend: GainNode;
  private delaySend: GainNode;
  private ksCache = new Map<string, AudioBuffer>();
  private samples = new Map<string, { buf: AudioBuffer; midi: number }>();
  private drumKit = new Map<string, AudioBuffer>();
  private noise: AudioBuffer;
  private parts: { name: string; inst: InstrumentId; layer: number; until: number; vol: number; gain: GainNode; events: NoteEvent[] }[] = [];
  /** When set, only these parts are audible (stem renders for blind mixing). */
  private solo: Set<string> | null = null;
  /** Real one-shot sample banks (band variant). Instruments without a bank fall back to synthesis. */
  private banks: Partial<Record<string, SampleBank>> = {};
  /** Notes played from samples vs synthesis, per instrument (debugging the sample path). */
  readonly stats: Record<string, { sampled: number; synth: number }> = {};
  private readonly tone: (typeof TONE)[Variant];

  constructor(private ctx: Ctx, private variant: Variant, out: AudioNode = ctx.destination) {
    this.tone = TONE[variant];
    this.noise = noiseBuffer(ctx, 2);
    this.master = ctx.createGain(); this.master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = this.tone.comp[0]; comp.ratio.value = this.tone.comp[1]; comp.attack.value = 0.012; comp.release.value = 0.2;
    // Band: hit the master softer. Web Audio compressors add automatic makeup gain, so a hot bus keeps the limiter
    // pinned and the mix reads as brickwalled; leave headroom so the full-band lift can actually be louder.
    const mixBus = ctx.createGain(); mixBus.gain.value = variant === 'band' ? 0.5 : 0.7;
    // Master tone: clean up sub rumble, a little "air" on top (indie mixes are bright).
    const rumble = ctx.createBiquadFilter(); rumble.type = 'highpass'; rumble.frequency.value = 38;
    const air = ctx.createBiquadFilter(); air.type = 'highshelf'; air.frequency.value = 5500; air.gain.value = this.tone.air;
    mixBus.connect(rumble).connect(air).connect(comp);
    // Brick-wall-ish limiter at the very end so nothing clips (ceiling ≈ -1 dBFS).
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = variant === 'band' ? -1 : -3; limiter.knee.value = 0; limiter.ratio.value = variant === 'band' ? 12 : 20; limiter.attack.value = 0.001; limiter.release.value = 0.12;
    const ceiling = ctx.createGain(); ceiling.gain.value = 0.8;
    if (variant === 'tape') this.tapeChain(comp, limiter); else comp.connect(limiter);
    limiter.connect(ceiling).connect(this.master);
    this.master.connect(out);

    this.reverb = ctx.createConvolver();
    this.reverb.buffer = reverbIR(ctx, this.tone.irSec, this.tone.irDark);
    this.reverbSend = ctx.createGain(); this.reverbSend.gain.value = 1;
    const revReturn = ctx.createGain(); revReturn.gain.value = this.tone.revReturn;
    this.mixBus = mixBus;
    this.reverbSend.connect(this.reverb).connect(revReturn).connect(mixBus);
    // Dotted-eighth-ish delay for the lead (set per song).
    this.delaySend = ctx.createGain();
    const dly = ctx.createDelay(2); dly.delayTime.value = 0.47;
    const fb = ctx.createGain(); fb.gain.value = 0.35;
    const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2800;
    this.delaySend.connect(dly).connect(dlp).connect(fb).connect(dly);
    dlp.connect(mixBus); dlp.connect(this.reverbSend);

    this.buildBuses();
  }

  /** Per-instrument buses with their character (amp EQ, chorus, sends). Each part feeds its layer gain. */
  private buildBuses() {
    const c = this.ctx;
    const mk = (id: InstrumentId) => { const g = c.createGain(); this.buses[id] = g; return g; };
    // Clean guitar: chorus → gentle "amp" EQ → reverb send.
    const pluck = mk('pluck');
    const pluckOut = c.createGain();
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 110;
    const presence = c.createBiquadFilter(); presence.type = 'peaking'; presence.frequency.value = 2400; presence.gain.value = 3;
    chorus(c, pluck, hp, this.variant === 'band' && this.samplesFor('pluck') ? 0 : this.tone.chorus);
    if (this.variant === 'band' && this.samplesFor('pluck')) {
      // The recorded guitar is dark (almost nothing above 2.5 kHz, like a DI with the tone rolled off), so give it an
      // amp: gentle saturation makes real upper harmonics, then a treble shelf brings out pick and string sheen.
      presence.frequency.value = 3200; presence.gain.value = 3; hp.frequency.value = 170;
      const drive = c.createGain(); drive.gain.value = 2.2;
      const shelf = c.createBiquadFilter(); shelf.type = 'highshelf'; shelf.frequency.value = 2800; shelf.gain.value = 7;
      const trim = c.createGain(); trim.gain.value = 0.55;
      const lowMid = c.createBiquadFilter(); lowMid.type = 'peaking'; lowMid.frequency.value = 300; lowMid.Q.value = 0.9; lowMid.gain.value = -4;
      presence.connect(lowMid).connect(drive).connect(shaper(c, 1.6)).connect(shelf).connect(trim).connect(pluckOut);
      hp.connect(presence);
    } else if (this.variant === 'band') {
      // Single-coil through a clean amp: gentle presence, warm body, amp-style top roll-off (no harpsichord fizz).
      presence.frequency.value = 2500; presence.gain.value = 2; hp.frequency.value = 120;
      const body = c.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 280; body.gain.value = 2.5; body.Q.value = 0.8;
      const roll = c.createBiquadFilter(); roll.type = 'lowpass'; roll.frequency.value = 5200; roll.Q.value = 0.6;
      presence.disconnect(); presence.connect(body).connect(roll).connect(shaper(c, 1.25)).connect(pluckOut);
    }
    if (!(this.variant === 'band' && this.samplesFor('pluck'))) hp.connect(presence).connect(pluckOut);
    pluckOut.connect(this.reverbSend);
    this.buses.pluck = pluck; (pluck as GainNode & { out?: AudioNode }).out = pluckOut;
    // Fuzz: drive → cab-ish lowpass → big reverb.
    const fuzz = mk('fuzz');
    const fuzzOut = c.createGain(); fuzzOut.gain.value = this.variant === 'band' ? 1.6 : 0.5;
    const band = this.variant === 'band';
    // Band: mid-forward tube-style overdrive (chord extensions stay legible); others: the old fuzz wall.
    const drive = shaper(c, band ? 2.4 : 9);
    const cab = c.createBiquadFilter(); cab.type = 'lowpass'; cab.frequency.value = band ? 4600 : 3600; cab.Q.value = band ? 0.5 : 0.7;
    const scoop = c.createBiquadFilter(); scoop.type = 'peaking'; scoop.frequency.value = band ? 1200 : 800; scoop.gain.value = band ? 2.5 : -4;
    if (band) { const pre = c.createBiquadFilter(); pre.type = 'highpass'; pre.frequency.value = 200; fuzz.connect(pre).connect(drive); } else fuzz.connect(drive);
    if (band) { const lowMid = c.createBiquadFilter(); lowMid.type = 'peaking'; lowMid.frequency.value = 280; lowMid.Q.value = 0.9; lowMid.gain.value = -4; drive.connect(cab).connect(lowMid).connect(scoop).connect(fuzzOut); }
    else drive.connect(cab).connect(scoop).connect(fuzzOut);
    const fuzzSend = c.createGain(); fuzzSend.gain.value = 1.4;
    fuzzOut.connect(fuzzSend).connect(this.reverbSend);
    (fuzz as GainNode & { out?: AudioNode }).out = fuzzOut;
    // Bass: a touch of drive.
    const bass = mk('bass');
    const bassOut = c.createGain();
    const bassHp = c.createBiquadFilter(); bassHp.type = 'highpass'; bassHp.frequency.value = 55;
    const bassMid = c.createBiquadFilter(); bassMid.type = 'peaking'; bassMid.frequency.value = 900; bassMid.gain.value = 4;
    const bassLp = c.createBiquadFilter(); bassLp.type = 'lowpass'; bassLp.frequency.value = this.variant === 'band' ? 1500 : 20000;
    if (this.variant === 'band') { bassMid.frequency.value = 800; bassMid.gain.value = 3; bassLp.frequency.value = 2200; }
    // Band: carve the boxy 250 Hz region so the bass's growl (800 Hz) and the kick's thump carry instead of low-mid mud.
    const bassBox = c.createBiquadFilter(); bassBox.type = 'peaking'; bassBox.frequency.value = 250; bassBox.Q.value = 1; bassBox.gain.value = this.variant === 'band' ? -4 : 0;
    bass.connect(shaper(c, this.variant === 'band' ? 1.1 : 1.8)).connect(bassHp).connect(bassBox).connect(bassMid).connect(bassLp).connect(bassOut);
    (bass as GainNode & { out?: AudioNode }).out = bassOut;
    // Drums (tape variant: 12-bit crunch, like an OP-1 drum sampler).
    const drums = mk('drums');
    const drumOut = c.createGain();
    if (this.variant === 'tape') drums.connect(shaper(c, 1.05, 11)).connect(drumOut);
    else if (this.variant === 'band') {
      // Glue the kit: slow-ish attack keeps the stick transient, then makeup gain for weight.
      const dc = c.createDynamicsCompressor(); dc.threshold.value = -22; dc.ratio.value = 4; dc.attack.value = 0.008; dc.release.value = 0.12;
      const makeup = c.createGain(); makeup.gain.value = 2.6;
      drums.connect(dc).connect(makeup).connect(drumOut);
    } else drums.connect(drumOut);
    const drumVerb = c.createGain(); drumVerb.gain.value = 0.18;
    drumOut.connect(drumVerb).connect(this.reverbSend);
    (drums as GainNode & { out?: AudioNode }).out = drumOut;
    // Pad, bell, lead: wet.
    for (const id of ['pad', 'bell', 'lead'] as const) {
      const g = mk(id); const o = c.createGain();
      if (id === 'lead' && this.variant === 'band') {
        const sampled = !!this.samplesFor('lead');
        const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = sampled ? 7500 : 4800;
        const mid = c.createBiquadFilter(); mid.type = 'peaking'; mid.frequency.value = 1500; mid.gain.value = 3;
        const shelf = c.createBiquadFilter(); shelf.type = 'highshelf'; shelf.frequency.value = 2800; shelf.gain.value = sampled ? 6 : 0;
        g.connect(shaper(c, 2.2)).connect(mid).connect(shelf).connect(lp).connect(o);
      } else g.connect(o);
      const send = c.createGain(); send.gain.value = id === 'pad' ? 0.8 : 0.6;
      o.connect(send).connect(this.reverbSend);
      if (id === 'lead' || id === 'bell') { const ds = c.createGain(); ds.gain.value = id === 'lead' ? (this.variant === 'band' ? 0.15 : 0.35) : 0.2; o.connect(ds).connect(this.delaySend); }
      (g as GainNode & { out?: AudioNode }).out = o;
    }
  }

  /** OP-1-style tape print: wow + flutter (modulated delay), saturation, top-end roll-off, a little hiss. */
  private tapeChain(input: AudioNode, output: AudioNode) {
    const c = this.ctx;
    const d = c.createDelay(0.1); d.delayTime.value = 0.02;
    lfo(c, 0.55, 0.0016, d.delayTime); // wow
    lfo(c, 6.3, 0.00022, d.delayTime); // flutter
    const sat = shaper(c, 1.6);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 12500;
    const warm = c.createBiquadFilter(); warm.type = 'lowshelf'; warm.frequency.value = 180; warm.gain.value = 1;
    input.connect(d).connect(sat).connect(warm).connect(lp).connect(output);
    const hiss = c.createBufferSource(); hiss.buffer = this.noise; hiss.loop = true;
    const hf = c.createBiquadFilter(); hf.type = 'highpass'; hf.frequency.value = 4000;
    const hg = c.createGain(); hg.gain.value = 0.004;
    hiss.connect(hf).connect(hg).connect(output);
    hiss.start();
  }

  /** Load a song: precompute its events; each part gets its own gain (for layers) feeding its instrument bus. */
  load(song: SongDef) {
    this.song = song;
    for (const p of this.parts) p.gain.disconnect();
    this.parts = song.parts.map((p) => {
      const gain = this.ctx.createGain(); gain.gain.value = 0;
      gain.connect(this.buses[p.instrument]);
      return { name: p.name, inst: p.instrument, layer: p.layer, until: p.until ?? 3, vol: p.vol, gain, events: partEvents(song, p) };
    });
    // Bus outputs: dry to the mix, plus this variant's reverb / delay sends.
    for (const id of Object.keys(this.buses) as InstrumentId[]) {
      const out = (this.buses[id] as GainNode & { out?: AudioNode }).out ?? this.buses[id];
      out.disconnect();
      out.connect(this.mixBus);
      const send = (gain: number, to: AudioNode) => { if (gain > 0) { const g = this.ctx.createGain(); g.gain.value = gain; out.connect(g).connect(to); } };
      send(this.tone.sends[id], this.reverbSend);
      if (id === 'bell' || id === 'lead') send(this.tone.delay[id], this.delaySend);
    }
  }

  /** Use recorded one-shot banks for the band sound (keys: guitar, guitar_neck, bass, drums). Rebuilds the buses for samples. */
  useSamples(banks: Partial<Record<string, SampleBank>>) {
    this.banks = banks;
    if (this.variant === 'band') { this.buildBuses(); if (this.song) this.load(this.song); }
  }

  private samplesFor(inst: keyof typeof BANK_FOR): boolean { return !!this.banks[BANK_FOR[inst]]; }
  private song: SongDef | null = null;

  private bank(inst: keyof typeof BANK_FOR): SampleBank | undefined {
    return this.variant === 'band' ? this.banks[BANK_FOR[inst]] ?? (inst === 'lead' ? this.banks.guitar : undefined) : undefined;
  }

  /** Solo a set of parts (by name) for stem renders; null = everyone. Apply before setLayers. */
  setSolo(names: string[] | null) { this.solo = names ? new Set(names) : null; }

  /** Layer mix: 0 = Dormant … 3 = Thriving. Parts fade in at `layer` and out above `until` (adaptive music). */
  setLayers(n: number, at = this.ctx.currentTime, ramp = 1.5) {
    for (const p of this.parts) {
      p.gain.gain.cancelScheduledValues(at);
      const on = n >= p.layer && n <= p.until && (!this.solo || this.solo.has(p.name));
      p.gain.gain.setTargetAtTime(on ? 1 : 0, at, ramp / 3);
    }
  }

  /**
   * Schedule only the notes of a loop pass (starting at `loopStart`) that fall in [from, to).
   * The live player streams a second or two ahead with this, so it never creates a whole loop of nodes at once.
   */
  scheduleRange(loopStart: number, from: number, to: number) {
    this.parts.forEach((p, pi) => p.events.forEach((e, ei) => {
      const t = loopStart + e.time;
      if (t >= from && t < to) this.note(p.inst, p.gain, this.humanize(t, pi, ei, e), e, p.vol * this.humanVel(pi, ei, p.inst));
    }));
  }

  /** Schedule one pass of the loaded song starting at `startAt`. Returns its length in seconds. */
  schedule(song: SongDef, startAt: number): number {
    this.parts.forEach((p, pi) => p.events.forEach((e, ei) => this.note(p.inst, p.gain, this.humanize(startAt + e.time, pi, ei, e), e, p.vol * this.humanVel(pi, ei, p.inst))));
    return loopSeconds(song);
  }

  /**
   * Band variant: a few ms of human timing drift, plus a pick-stroke spread across strummed chords. The drift is shared by
   * every string of one strum (keyed by the strum's time), so the strings stay in stroke order instead of smearing into a
   * block chord; only a tiny per-string wobble is added.
   */
  private humanize(t: number, pi: number, ei: number, e: NoteEvent): number {
    if (this.variant !== 'band') return t;
    if (e.strum === undefined) return Math.max(0, t + jitter(pi, ei) * 0.011);
    const group = jitter(pi, Math.round(e.time * 1000)) * 0.01;
    return Math.max(0, t + group + e.strum * 0.013 + jitter(pi, ei) * 0.002);
  }

  /** Band variant: ±12 % velocity variation (drums ±18 %), so repeated hits never sound machine-identical. */
  private humanVel(pi: number, ei: number, inst: InstrumentId): number {
    if (this.variant !== 'band') return 1;
    return 1 + jitter(ei, pi + 101) * (inst === 'drums' ? 0.18 : 0.12);
  }

  // ---- instruments ---------------------------------------------------------------

  private note(inst: InstrumentId, bus: AudioNode, t: number, e: NoteEvent, vol: number) {
    const v = e.vel * vol;
    const st = (this.stats[inst] ??= { sampled: 0, synth: 0 });
    const b = inst === 'pad' || inst === 'bell' ? undefined : this.bank(inst as keyof typeof BANK_FOR);
    if (b && (inst === 'drums' ? b.hit(e.drum ?? 'k', 0.8) : b.note(e.midi, 0.8))) st.sampled++; else st.synth++;
    switch (inst) {
      case 'pluck': return this.pluck(bus, t, e.midi, e.dur, v, e.art);
      case 'fuzz': return this.fuzz(bus, t, e.midi, e.dur, v, e.art);
      case 'bass': return this.bass(bus, t, e.midi, e.dur, v);
      case 'drums': return this.drum(bus, t, e.drum ?? 'k', v);
      case 'pad': return this.pad(bus, t, e.midi, e.dur, v);
      case 'bell': return this.bell(bus, t, e.midi, v);
      case 'lead': return this.lead(bus, t, e.midi, e.dur, v, e.art);
    }
  }

  /**
   * Play a sampled guitar note with articulation: muted chuck, slide or bend into the pitch (playback-rate glide),
   * and delayed vibrato on long notes, the expressive moves that separate a guitarist from a step sequencer.
   */
  private playGuitar(buf: AudioBuffer, bus: AudioNode, t: number, gain: number, rate: number, dur: number, release: number, art?: Articulation, vibrato = false) {
    const c = this.ctx;
    // Plectrum transient: real string attacks have a short bright click that sampled notes re-pitched or trimmed lose.
    this.pickTick(bus, t, gain * (art?.mute ? 0.5 : 0.2), art?.mute ? 2400 : 3400);
    if (art?.mute) { this.play(buf, bus, t, gain * 0.7, rate, 0.035, 0.02); return; }
    const src = c.createBufferSource(); src.buffer = buf;
    const from = art?.slide ? rate * 2 ** (-art.slide / 12) : art?.bend ? rate * 2 ** (-art.bend / 12) : rate;
    src.playbackRate.setValueAtTime(from, t);
    if (from !== rate) src.playbackRate.exponentialRampToValueAtTime(rate, t + (art?.bend ? 0.14 : 0.07));
    if (vibrato && dur > 0.45) {
      const o = c.createOscillator(), d = c.createGain();
      o.frequency.value = 5.1; d.gain.setValueAtTime(0, t + 0.3); d.gain.linearRampToValueAtTime(rate * 0.0035, t + 0.7);
      o.connect(d).connect(src.playbackRate); o.start(t + 0.3); o.stop(t + dur + release + 0.05);
    }
    const g = c.createGain();
    g.gain.setValueAtTime(gain, t); g.gain.setValueAtTime(gain, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + release);
    src.connect(g).connect(bus);
    src.start(t); src.stop(t + dur + release + 0.05);
  }

  private play(buf: AudioBuffer, bus: AudioNode, t: number, gain: number, rate = 1, dur?: number, release = 0.08) {
    const c = this.ctx;
    const src = c.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, t);
    if (dur !== undefined) { g.gain.setValueAtTime(gain, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + release); }
    src.connect(g).connect(bus);
    src.start(t);
    src.stop(t + (dur !== undefined ? dur + release + 0.05 : buf.duration / rate));
  }

  /** Synth variant: a fresh KS buffer per pitch. Tape variant: one sampled note, re-pitched (sampler style). */
  /** A short band-passed noise "tick": the pick hitting the string (what makes a pluck read as a guitar). */
  private pickTick(bus: AudioNode, t: number, gain: number, freq = 3200) {
    const c = this.ctx;
    const src = c.createBufferSource(); src.buffer = this.noise;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.2;
    const g = c.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
    src.connect(f).connect(g).connect(bus); src.start(t, Math.random()); src.stop(t + 0.02);
  }

  /** Band variant: the improved string model, one buffer per pitch. */
  private bandString(kind: string, midi: number, opts: Parameters<typeof stringBuffer>[3], seconds: number): { buf: AudioBuffer; rate: number } {
    const key = `${kind}:${midi}`;
    let b = this.ksCache.get(key);
    if (!b) { b = stringBuffer(this.ctx, midiToHz(midi), seconds, opts); this.ksCache.set(key, b); }
    return { buf: b, rate: 1 };
  }

  private stringBuf(kind: string, midi: number, opts: Parameters<typeof ksBuffer>[3], seconds: number): { buf: AudioBuffer; rate: number } {
    if (this.variant === 'tape') {
      let s = this.samples.get(kind);
      if (!s) { s = { buf: ksBuffer(this.ctx, midiToHz(57), seconds * 1.6, opts), midi: 57 }; this.samples.set(kind, s); }
      return { buf: s.buf, rate: 2 ** ((midi - s.midi) / 12) };
    }
    const key = `${kind}:${midi}`;
    let b = this.ksCache.get(key);
    if (!b) { b = ksBuffer(this.ctx, midiToHz(midi), seconds, opts); this.ksCache.set(key, b); }
    return { buf: b, rate: 1 };
  }

  private pluck(bus: AudioNode, t: number, midi: number, dur: number, v: number, art?: Articulation) {
    const s = this.bank('pluck')?.note(midi, v);
    if (s) { this.playGuitar(s.buf, bus, t, 0.25 * v * s.gain, s.rate, Math.max(dur, 0.12) + 0.08, 0.1, art); return; }
    if (this.variant === 'band') {
      // Single-coil: bright pick near the bridge; notes ring a little past their step, then damp (no smear).
      const { buf, rate } = this.bandString('pluckBand', midi, { tone: 0.7, decay: 0.998, pick: 0.15, pickup: 0.17, noise: 0.13 }, 2.5);
      this.play(buf, bus, t, 0.2 * v, rate, Math.max(dur, 0.2) + 0.3, 0.15);
      this.pickTick(bus, t, 0.05 * v);
      return;
    }
    const { buf, rate } = this.stringBuf('pluck', midi, { bright: 0.55, decay: 0.9975, pick: 0.16 }, 3);
    this.play(buf, bus, t, 0.32 * v, rate, Math.max(dur, 0.25) + 0.6, 0.4); // let notes ring (arpeggios overlap)
  }

  private fuzz(bus: AudioNode, t: number, midi: number, dur: number, v: number, art?: Articulation) {
    const band = this.variant === 'band';
    const s = this.bank('fuzz')?.note(midi, v);
    if (s) { this.playGuitar(s.buf, bus, t, 0.16 * v * s.gain, s.rate, dur, 0.06, art); return; }
    for (const cents of band ? [-3, 3] : [-9, 9]) {
      const { buf, rate } = band ? this.bandString('driveBand', midi, { tone: 0.6, decay: 0.9985, pick: 0.15, pickup: 0.12, noise: 0.1 }, 2.5) : this.stringBuf('fuzz', midi, { bright: 0.8, decay: 0.9993, pick: 0.12 }, 4);
      this.play(buf, bus, t + (cents > 0 ? 0.004 : 0), (band ? 0.09 : 0.22) * v, rate * 2 ** (cents / 1200), dur, band ? 0.06 : 0.15);
    }
  }

  private bass(bus: AudioNode, t: number, midi: number, dur: number, v: number) {
    const c = this.ctx;
    const s = this.bank('bass')?.note(midi, v);
    if (s) { this.play(s.buf, bus, t, 1.6 * v * s.gain, s.rate, Math.max(dur * 0.95, 0.09), 0.05); return; }
    if (this.variant === 'band') {
      // Plucked electric bass: woody string attack plus a quiet sine underneath for weight; muted at note end.
      const { buf, rate } = this.bandString('bassBand', midi, { tone: 0.55, decay: 0.9993, pick: 0.22, pickup: 0.2, noise: 0.06 }, 2.5);
      const len = Math.max(dur * 0.94, 0.09);
      this.play(buf, bus, t, 0.22 * v, rate, len, 0.05);
      const sub = c.createOscillator(); sub.frequency.value = midiToHz(midi);
      const sg = c.createGain(); sg.gain.setValueAtTime(0.0001, t); sg.gain.exponentialRampToValueAtTime(0.16 * v, t + 0.01);
      sg.gain.setValueAtTime(0.14 * v, t + len); sg.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.05);
      sub.connect(sg).connect(bus); sub.start(t); sub.stop(t + len + 0.1);
      return;
    }
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midiToHz(midi);
    const sub = c.createOscillator(); sub.type = 'sine'; sub.frequency.value = midiToHz(midi);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 2;
    f.frequency.setValueAtTime(1400, t); f.frequency.exponentialRampToValueAtTime(380, t + 0.18);
    const g = c.createGain();
    const end = t + Math.max(dur * 0.92, 0.08);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2 * v, t + 0.008);
    g.gain.setValueAtTime(0.17 * v, end); g.gain.exponentialRampToValueAtTime(0.0001, end + 0.05);
    const sg = c.createGain(); sg.gain.value = 0.2;
    o.connect(f); sub.connect(sg).connect(f); f.connect(g).connect(bus);
    o.start(t); sub.start(t); o.stop(end + 0.1); sub.stop(end + 0.1);
  }

  private pad(bus: AudioNode, t: number, midi: number, dur: number, v: number) {
    const c = this.ctx;
    if (this.variant === 'band') {
      // Soft electric-piano-ish bed (FM, low index) instead of a detuned-saw wash.
      const f0 = midiToHz(midi);
      const car = c.createOscillator(); car.frequency.value = f0;
      const mod = c.createOscillator(); mod.frequency.value = f0;
      const mg = c.createGain(); mg.gain.setValueAtTime(f0 * 0.9, t); mg.gain.exponentialRampToValueAtTime(f0 * 0.08, t + 0.8);
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07 * v, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.03 * v, t + Math.min(dur, 1.2)); g.gain.setValueAtTime(0.03 * v, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.4);
      mod.connect(mg).connect(car.frequency); car.connect(g).connect(bus);
      car.start(t); mod.start(t); car.stop(t + dur + 0.5); mod.stop(t + dur + 0.5);
      return;
    }
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1300;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.07 * v, t + 0.9);
    g.gain.setValueAtTime(0.07 * v, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 1.4);
    f.connect(g).connect(bus);
    for (const det of [-12, 0, 11]) {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midiToHz(midi); o.detune.value = det;
      o.connect(f); o.start(t); o.stop(t + dur + 1.5);
    }
  }

  private bell(bus: AudioNode, t: number, midi: number, v: number) {
    const c = this.ctx;
    const f0 = midiToHz(midi);
    const car = c.createOscillator(); car.frequency.value = f0;
    const mod = c.createOscillator(); mod.frequency.value = f0 * 3.5;
    const mg = c.createGain(); mg.gain.setValueAtTime(f0 * 2.2, t); mg.gain.exponentialRampToValueAtTime(f0 * 0.05, t + 1.2);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16 * v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    mod.connect(mg).connect(car.frequency);
    car.connect(g).connect(bus);
    car.start(t); mod.start(t); car.stop(t + 1.9); mod.stop(t + 1.9);
  }

  private lead(bus: AudioNode, t: number, midi: number, dur: number, v: number, art?: Articulation) {
    const c = this.ctx;
    const s = this.bank('lead')?.note(midi, v);
    if (s) { this.playGuitar(s.buf, bus, t, 0.32 * v * s.gain, s.rate, Math.max(dur, 0.15), 0.2, art, true); return; }
    if (this.variant === 'band') {
      // Lead guitar: a long-sustaining plucked string (driven on the bus), held for the written length.
      const { buf, rate } = this.bandString('leadBand', midi, { tone: 0.62, decay: 0.9996, pick: 0.17, pickup: 0.26, noise: 0.1 }, 3.5);
      this.play(buf, bus, t, 0.55 * v, rate, Math.max(dur, 0.15), 0.2);
      this.pickTick(bus, t, 0.06 * v, 2600);
      return;
    }
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2300; f.Q.value = 1.5;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12 * v, t + 0.03);
    g.gain.setValueAtTime(0.1 * v, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.35);
    f.connect(g).connect(bus);
    for (const [type, det] of [['sawtooth', -6], ['triangle', 6]] as const) {
      const o = c.createOscillator(); o.type = type; o.frequency.value = midiToHz(midi); o.detune.value = det;
      lfo(c, 5.2, 9, o.detune, t + 0.25); // gentle delayed vibrato
      o.connect(f); o.start(t); o.stop(t + dur + 0.4);
    }
  }

  /** Drum voices. Tape variant renders each voice once to a buffer (a chopped one-shot kit). */
  private drum(bus: AudioNode, t: number, kind: string, v: number) {
    const s = this.bank('drums')?.hit(kind, v);
    // Per-hit balance for the sampled kit (each hit is normalized on its own when the bank is built).
    if (s) { this.play(s.buf, bus, t, (DRUM_LEVEL[kind] ?? 0.6) * v * s.gain, s.rate); return; }
    if (this.variant === 'tape') {
      let b = this.drumKit.get(kind);
      if (!b) { b = this.renderDrumOneShot(kind); this.drumKit.set(kind, b); }
      this.play(b, bus, t, v);
      return;
    }
    this.drumVoice(this.ctx, bus, t, kind, v);
  }

  /** Bake one drum hit into a buffer by synthesizing it sample-by-sample (works for any context type). */
  private renderDrumOneShot(kind: string): AudioBuffer {
    const sr = this.ctx.sampleRate, len = Math.floor(sr * (kind === 'c' ? 1.6 : kind === 'r' ? 0.9 : 0.45));
    const buf = this.ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
    let phase = 0, lp = 0, hpPrev = 0, hpOut = 0;
    for (let i = 0; i < len; i++) {
      const t = i / sr, n = Math.random() * 2 - 1;
      let s = 0;
      if (kind === 'k') { const f = 48 + 62 * Math.exp(-t * 28); phase += (2 * Math.PI * f) / sr; s = Math.sin(phase) * Math.exp(-t * 11) * 0.45; }
      else if (kind === 's' || kind === 'g') { phase += (2 * Math.PI * 190) / sr; lp += 0.35 * (n - lp); s = (Math.sin(phase) * 0.25 * Math.exp(-t * 30) + lp * 0.55 * Math.exp(-t * 16)) * (kind === 'g' ? 0.35 : 1); }
      else { hpOut = 0.92 * (hpOut + n - hpPrev); hpPrev = n; const dec = kind === 'h' ? 60 : kind === 'o' ? 9 : kind === 'r' ? 5 : 2.6; s = hpOut * Math.exp(-t * dec) * (kind === 'h' ? 0.6 : 0.45); }
      d[i] = s;
    }
    return buf;
  }

  private drumVoice(c: Ctx, bus: AudioNode, t: number, kind: string, v: number) {
    const noise = (dur: number, type: BiquadFilterType, freq: number, gain: number, q = 1) => {
      const src = c.createBufferSource(); src.buffer = this.noise;
      const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = c.createGain(); g.gain.setValueAtTime(gain * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f).connect(g).connect(bus); src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.02);
    };
    const tone = (f0: number, f1: number, dur: number, gain: number, type: OscillatorType = 'sine') => {
      const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.4);
      const g = c.createGain(); g.gain.setValueAtTime(gain * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(bus); o.start(t); o.stop(t + dur + 0.02);
    };
    if (this.variant === 'band') {
      // Dry, damped studio kit.
      switch (kind) {
        case 'k': tone(85, 48, 0.34, 1.1); tone(1400, 900, 0.012, 0.3, 'triangle'); noise(0.008, 'bandpass', 3500, 0.25); return;
        case 's': tone(185, 165, 0.16, 0.9, 'triangle'); tone(330, 300, 0.08, 0.4, 'triangle'); noise(0.22, 'bandpass', 1900, 2.8, 0.7); noise(0.035, 'highpass', 4500, 0.7); return;
        case 'g': tone(185, 170, 0.04, 0.1, 'triangle'); noise(0.05, 'bandpass', 1900, 0.3, 0.8); return;
        case 'h': noise(0.035, 'bandpass', 8000, 1.9, 0.8); noise(0.01, 'bandpass', 4500, 0.25); return;
        case 'o': noise(0.24, 'highpass', 7000, 0.75); return;
        case 'r': noise(0.7, 'bandpass', 5600, 1.3, 1.2); tone(3300, 3250, 0.6, 0.06, 'square'); return;
        case 'c': noise(1.0, 'bandpass', 6500, 0.9, 0.6); return;
        case 't': tone(210, 170, 0.28, 0.45); noise(0.03, 'bandpass', 1500, 0.15); return;
        case 'm': tone(155, 125, 0.32, 0.45); noise(0.03, 'bandpass', 1200, 0.15); return;
        case 'f': tone(110, 88, 0.4, 0.5); noise(0.03, 'bandpass', 900, 0.15); return;
      }
    }
    switch (kind) {
      case 'k': tone(110, 48, 0.35, 0.5); noise(0.015, 'highpass', 2500, 0.18); break;
      case 's': tone(200, 160, 0.12, 0.35, 'triangle'); noise(0.22, 'bandpass', 1900, 0.75, 0.8); break;
      case 'g': noise(0.08, 'bandpass', 2000, 0.22, 0.8); break;
      case 'h': noise(0.05, 'highpass', 7000, 0.55); break;
      case 'o': noise(0.32, 'highpass', 6500, 0.45); break;
      case 'r': noise(0.9, 'bandpass', 5200, 0.4, 1.5); tone(3150, 3100, 0.8, 0.04, 'square'); break;
      case 'c': noise(1.6, 'highpass', 4200, 0.5); break;
    }
  }
}
