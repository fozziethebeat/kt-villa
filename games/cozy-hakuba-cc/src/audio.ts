import { music } from './music/player';

/**
 * Synthesized audio (no asset files): short, soft UI/feedback sounds and a gentle seasonal ambience bed.
 * Browsers only allow audio after a user gesture, so the context starts on the first click/key.
 * Settings persist in localStorage (wrapped: storage can be blocked).
 */
export type SfxName = 'click' | 'pickup' | 'quest' | 'coin' | 'sleep' | 'season' | 'oops' | 'kodama' | 'hit' | 'stamp' | 'shutter';
export type Ambience = 'winter' | 'green' | 'quiet' | 'off';

const SETTINGS_KEY = 'hakuba-wakeup-settings';
export interface AudioSettings { volume: number; muted: boolean; ambience: boolean; music: number }

function loadSettings(): AudioSettings {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null');
    if (s && typeof s.volume === 'number') return { volume: s.volume, muted: !!s.muted, ambience: s.ambience !== false, music: typeof s.music === 'number' ? s.music : 0.8 };
  } catch { /* ignore */ }
  return { volume: 0.7, muted: false, ambience: true, music: 0.8 };
}

class AudioEngine {
  settings = loadSettings();
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxBus!: GainNode;
  private ambBus!: GainNode;
  private musicBus!: GainNode;
  private ambNodes: AudioNode[] = [];
  private ambTimers: number[] = [];
  private current: Ambience = 'off';
  private wanted: Ambience = 'off';
  /** Count of sounds requested (also before the context starts) — lets tests check hooks fire. */
  played: Record<string, number> = {};

  /** Call once: starts the AudioContext on the first user gesture. */
  install() {
    const start = () => { this.ensure(); window.removeEventListener('pointerdown', start); window.removeEventListener('keydown', start); };
    window.addEventListener('pointerdown', start);
    window.addEventListener('keydown', start);
  }

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
    } catch { return null; }
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    this.sfxBus = this.ctx.createGain(); this.sfxBus.gain.value = 0.9; this.sfxBus.connect(this.master);
    this.ambBus = this.ctx.createGain(); this.ambBus.gain.value = 0.35; this.ambBus.connect(this.master);
    this.musicBus = this.ctx.createGain(); this.musicBus.gain.value = this.settings.music; this.musicBus.connect(this.master);
    this.applyVolume();
    music.attach(this.ctx, this.musicBus);
    const w = this.wanted; this.current = 'off'; this.ambience(w);
    return this.ctx;
  }

  private save() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings)); } catch { /* ignore */ }
  }

  private applyVolume() {
    if (!this.ctx) return;
    this.master.gain.setTargetAtTime(this.settings.muted ? 0 : this.settings.volume, this.ctx.currentTime, 0.05);
    this.ambBus.gain.setTargetAtTime(this.settings.ambience ? 0.35 : 0, this.ctx.currentTime, 0.2);
  }

  setVolume(v: number) { this.settings.volume = Math.max(0, Math.min(1, v)); this.save(); this.applyVolume(); }
  setMuted(m: boolean) { this.settings.muted = m; this.save(); this.applyVolume(); }
  toggleMute() { this.setMuted(!this.settings.muted); return this.settings.muted; }
  setMusic(v: number) { this.settings.music = Math.max(0, Math.min(1, v)); this.save(); if (this.ctx) this.musicBus.gain.setTargetAtTime(this.settings.music, this.ctx.currentTime, 0.1); }
  setAmbienceOn(on: boolean) { this.settings.ambience = on; this.save(); this.applyVolume(); }

  // ---- synthesis helpers -----------------------------------------------------

  private tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.2, bus?: AudioNode, glideTo?: number) {
    const c = this.ctx!;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, start);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g).connect(bus ?? this.sfxBus);
    o.start(start); o.stop(start + dur + 0.05);
  }

  private noise(start: number, dur: number, gain: number, filterFreq: number, bus?: AudioNode, q = 1) {
    const c = this.ctx!;
    const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = filterFreq; f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(f).connect(g).connect(bus ?? this.sfxBus);
    src.start(start); src.stop(start + dur);
  }

  /** Play a short sound effect. Safe to call before audio has started (it is just counted). */
  sfx(name: SfxName) {
    this.played[name] = (this.played[name] ?? 0) + 1;
    const c = this.ctx;
    if (!c || this.settings.muted) return;
    const t = c.currentTime + 0.01;
    const N = (n: number) => 440 * 2 ** ((n - 69) / 12); // MIDI → Hz
    switch (name) {
      case 'click': this.tone(N(84), t, 0.06, 'triangle', 0.08); break;
      case 'hit': this.tone(N(79), t, 0.12, 'triangle', 0.12); this.tone(N(86), t + 0.05, 0.14, 'sine', 0.08); break;
      case 'oops': this.tone(N(55), t, 0.18, 'sine', 0.14, undefined, N(50)); break;
      case 'pickup': this.tone(N(84), t, 0.12, 'triangle', 0.12); this.tone(N(91), t + 0.07, 0.22, 'sine', 0.1); break;
      case 'kodama': [72, 76, 79, 84, 88].forEach((n, i) => this.tone(N(n), t + i * 0.05, 0.16, 'sine', 0.08)); break;
      case 'coin': this.tone(N(88), t, 0.07, 'square', 0.04); this.tone(N(93), t + 0.06, 0.2, 'triangle', 0.09); break;
      case 'stamp': this.noise(t, 0.12, 0.25, 300, undefined, 0.7); this.tone(N(48), t, 0.12, 'sine', 0.15); break;
      case 'shutter': this.noise(t, 0.05, 0.3, 3000, undefined, 2); this.noise(t + 0.07, 0.05, 0.25, 2400, undefined, 2); break;
      case 'quest': [72, 76, 79, 84].forEach((n, i) => this.tone(N(n), t + i * 0.11, 0.5, 'triangle', 0.1)); this.tone(N(60), t, 0.9, 'sine', 0.06); break;
      case 'season': [67, 71, 74, 79].forEach((n) => this.tone(N(n), t, 1.6, 'sine', 0.05)); break;
      case 'sleep': [79, 76, 72, 67].forEach((n, i) => this.tone(N(n), t + i * 0.18, 0.7, 'sine', 0.07)); break;
    }
  }

  // ---- ambience --------------------------------------------------------------

  /** Seasonal ambience bed: soft pad chords; wind in winter, birdsong in green, near-silence when quiet. */
  ambience(kind: Ambience) {
    this.wanted = kind;
    const c = this.ctx;
    if (!c || kind === this.current) return;
    this.stopAmbience();
    this.current = kind;
    if (kind === 'off') return;
    const N = (n: number) => 440 * 2 ** ((n - 69) / 12);
    // Pad: a slow I–vi–IV–V in C (pentatonic-friendly, cozy), each chord ~5s with long fades.
    const chords = kind === 'winter' ? [[48, 55, 64], [45, 52, 60], [41, 48, 57], [43, 50, 59]] : [[53, 60, 69], [50, 57, 65], [46, 53, 62], [48, 55, 64]];
    let k = 0;
    const playChord = () => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + 0.05;
      for (const n of chords[k % chords.length]) this.tone(N(n), t, 5.5, 'sine', kind === 'quiet' ? 0.02 : 0.035, this.ambBus);
      k++;
    };
    void playChord; // the composed music (src/music) now carries the harmony; ambience keeps only wind / birds
    if (kind === 'winter') {
      const gust = () => { if (this.ctx) this.noise(this.ctx.currentTime, 3 + Math.random() * 2, 0.05, 400 + Math.random() * 300, this.ambBus, 0.6); };
      gust();
      this.ambTimers.push(window.setInterval(gust, 3500));
    }
    if (kind === 'green') {
      const bird = () => {
        if (!this.ctx || Math.random() < 0.3) return;
        const t = this.ctx.currentTime;
        const base = 2200 + Math.random() * 1200;
        for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) this.tone(base, t + i * 0.12, 0.08, 'sine', 0.03, this.ambBus, base * 1.25);
      };
      this.ambTimers.push(window.setInterval(bird, 1800));
    }
  }

  private stopAmbience() {
    for (const id of this.ambTimers) window.clearInterval(id);
    this.ambTimers = [];
    for (const n of this.ambNodes) try { (n as AudioScheduledSourceNode).stop?.(); } catch { /* ignore */ }
    this.ambNodes = [];
  }

  get ambienceNow(): Ambience { return this.wanted; }
}

export const audio = new AudioEngine();
export const sfx = (name: SfxName) => audio.sfx(name);
