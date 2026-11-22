import { bassNote, guitarNotes, noteToMidi, parseChord, voice } from './theory';

/**
 * Hand-written score format. A song is chords-per-bar plus parts written as step-sequencer strings,
 * the way you'd program a groovebox. Nothing is generated: every pattern below is authored in a song file.
 *
 *  - Note lines:  'D4 . F#4 - - . A4 .'   ('.' rest, '-' hold previous note one more step)
 *  - Arp lines:   '0 2 4 1 . 2 3 -'       (indices into the bar's voiced chord, low→high; '+' suffix = up an octave)
 *  - Bass lines:  'R . R 5 . R b7 -'      (R root, intervals 3 5 b7 7 9 8, or explicit notes like 'F#2')
 *  - Drum lines:  'k . h . s . h h'       (k kick, s snare, h hat, o open hat, r ride, c crash, g ghost snare, t/m/f high/mid/floor tom)
 *  - Chord lines: 'X - - - . . X -'       (X = strum the whole voiced chord)
 *  - Strum lines: 'D . x U . U D U'       (guitar shape of the bar's chord: D downstroke low→high, U upstroke on the top
 *                                          strings high→low, x muted chuck)
 *  - Pick lines:  '0 3 4 5 3 4 2 4'       (strings of the guitar shape, low→high; each string rings until picked again)
 *  Suffixes: '!' accent, '_' soft, '~' slide up into the note, '^' bend up into the note (lead lines).
 * Bars are separated by '|'. A line shorter than the song repeats. A part can set `steps` (per bar) for a finer grid.
 */
export type Articulation = { slide?: number; bend?: number; mute?: boolean };
export type InstrumentId = 'pluck' | 'fuzz' | 'bass' | 'drums' | 'pad' | 'bell' | 'lead';
/** `strum` = position within a strummed chord (0 = lowest string), so the rig can spread the attack like a pick stroke. */
export interface NoteEvent { time: number; dur: number; midi: number; vel: number; drum?: string; strum?: number; art?: Articulation }
/** `layer` = lowest restoration layer that plays this part; `until` = highest (e.g. a pad that steps aside once the band is in). */
export interface PartDef { name: string; instrument: InstrumentId; layer: 0 | 1 | 2 | 3; until?: number; steps?: number; vol: number; kind: 'notes' | 'arp' | 'bass' | 'drums' | 'chord' | 'strum' | 'pick'; line: string; center?: number; octave?: number; vel?: number }
export interface SongDef { title: string; bpm: number; beatsPerBar: number; stepsPerBeat: number; chords: string[]; parts: PartDef[]; swing?: number }

const INTERVAL: Record<string, number> = { R: 0, '1': 0, b3: 3, '3': 4, '4': 5, b5: 6, '5': 7, '6': 9, b7: 10, '7': 11, '8': 12, '9': 14 };

export const stepsPerBar = (s: SongDef) => s.beatsPerBar * s.stepsPerBeat;
export const secondsPerStep = (s: SongDef) => 60 / s.bpm / s.stepsPerBeat;
export const loopSeconds = (s: SongDef) => s.chords.length * stepsPerBar(s) * secondsPerStep(s);

/** Split a part line into per-bar token arrays, repeating to cover every bar of the song. */
export function barsOf(line: string, bars: number, steps: number): string[][] {
  const raw = line.split('|').map((b) => b.trim().split(/\s+/).filter(Boolean));
  for (const [i, b] of raw.entries()) if (b.length !== steps) throw new Error(`Bar ${i + 1} has ${b.length} steps, expected ${steps}: "${b.join(' ')}"`);
  return Array.from({ length: bars }, (_, i) => raw[i % raw.length]);
}

/** Turn a song into timed events for one part (seconds from loop start). */
export function partEvents(song: SongDef, part: PartDef): NoteEvent[] {
  // A part may use its own grid (e.g. drums in 16ths while the song is written in 8ths): `steps` per bar.
  const spb = part.steps ?? stepsPerBar(song), dt = (stepsPerBar(song) * secondsPerStep(song)) / spb;
  const bars = barsOf(part.line, song.chords.length, spb);
  const out: NoteEvent[] = [];
  const swingAt = (step: number) => (song.swing && step % 2 === 1 ? song.swing * dt : 0);
  bars.forEach((tokens, bar) => {
    const chord = parseChord(song.chords[bar]);
    const voiced = voice(chord, part.center ?? 57);
    let last: NoteEvent[] = [];
    tokens.forEach((tok, step) => {
      const t = (bar * spb + step) * dt + swingAt(step);
      if (tok === '.') { last = []; return; }
      if (tok === '-') { for (const e of last) e.dur += dt; return; }
      const vel = part.vel ?? 0.8;
      const accent = tok.includes('!') ? 1.25 : tok.includes('_') ? 0.6 : 1;
      const art: Articulation = {};
      if (tok.includes('~')) art.slide = 2;
      if (tok.includes('^')) art.bend = 1;
      const body = tok.replace(/[!_~^]/g, '');
      if (part.kind === 'strum') {
        // Guitar strum: D = all strings low→high, U = top 3-4 strings high→low, T = top three strings only (a small
        // high-voiced triad stab), x = muted chuck.
        const shape = guitarNotes(song.chords[bar]);
        if (body === 'x') {
          last = [];
          shape.slice(1, 5).forEach((m, i) => out.push({ time: t, dur: dt * 0.25, midi: m, vel: vel * 0.45, strum: i, art: { mute: true } }));
          return;
        }
        const strings = body === 'U' ? shape.slice(-4).reverse() : body === 'T' ? shape.slice(-3) : shape;
        const v = vel * accent * (body === 'U' ? 0.75 : 1);
        last = strings.map((m, i) => ({ time: t, dur: dt, midi: m, vel: v * (1 - i * 0.04), strum: i }));
        out.push(...last);
        return;
      }
      if (part.kind === 'pick') {
        // Fingerpicked / picked arpeggio over the guitar shape; strings ring until re-picked (handled after the loop).
        const shape = guitarNotes(song.chords[bar]);
        const idx = Math.min(shape.length - 1, Number(body));
        last = [{ time: t, dur: dt, midi: shape[idx], vel: vel * accent, strum: 0, art: { ...art, string: idx } as Articulation }];
        out.push(...last);
        return;
      }
      let midis: number[] = [];
      let drum: string | undefined;
      if (part.kind === 'drums') drum = body;
      else if (part.kind === 'notes') midis = [noteToMidi(body)];
      else if (part.kind === 'chord') midis = voiced;
      else if (part.kind === 'arp') {
        const up = body.endsWith('+') ? 12 : 0;
        const idx = Number(body.replace('+', ''));
        midis = [voiced[idx % voiced.length] + 12 * Math.floor(idx / voiced.length) + up];
      } else if (part.kind === 'bass') {
        midis = [body in INTERVAL ? bassNote(chord, part.octave ?? 2) + (body === 'R' ? 0 : INTERVAL[body] - (chord.bass - chord.root + 12) % 12) : noteToMidi(body)];
      }
      last = drum ? [{ time: t, dur: dt, midi: 0, vel: vel * accent, drum }] : midis.map((m, i) => ({ time: t, dur: dt, midi: m, vel: vel * accent, ...(part.kind === 'chord' ? { strum: i } : {}), ...(art.slide || art.bend ? { art } : {}) }));
      out.push(...last);
    });
  });
  if (part.kind === 'pick') {
    // Let each string ring until it is picked again, but only ~2 eighths at most: longer overlap reads as sustained block
    // chords (or a piano's sustain pedal) instead of picking.
    const barSec = Math.min(stepsPerBar(song), song.stepsPerBeat) * secondsPerStep(song);
    out.forEach((e, i) => {
      const s = (e.art as { string?: number } | undefined)?.string;
      const next = out.slice(i + 1).find((o) => (o.art as { string?: number } | undefined)?.string === s);
      e.dur = Math.min(barSec, (next ? next.time : e.time + barSec) - e.time);
    });
  }
  return out;
}
