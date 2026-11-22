import { describe, expect, it } from 'vitest';
import { barsOf, loopSeconds, partEvents } from '../../src/music/score';
import { winterRegion } from '../../src/music/songs/winterRegion';
import { greenRegion } from '../../src/music/songs/greenRegion';
import { cafeShift } from '../../src/music/songs/cafeShift';
import type { SongDef } from '../../src/music/score';
import { GUITAR_SHAPES, noteToMidi, parseChord, voice } from '../../src/music/theory';

describe('music theory', () => {
  it('spells notes and chords', () => {
    expect(noteToMidi('A4')).toBe(69);
    expect(noteToMidi('F#4')).toBe(66);
    expect(parseChord('Gmaj7').intervals).toEqual([0, 4, 7, 11]);
    expect(parseChord('Dmaj7/F#')).toMatchObject({ root: 2, bass: 6 });
    expect(voice(parseChord('Am7'), 57)).toEqual([57, 60, 64, 67]);
    expect(() => parseChord('Hm7')).toThrow();
  });
});

describe('score', () => {
  it('rejects bars with the wrong number of steps', () => {
    expect(() => barsOf('a b c', 1, 4)).toThrow(/expected 4/);
  });

  it('the winter loop parses: 12 bars, ~30 s, every part in time, notes held with "-"', () => {
    expect(winterRegion.chords).toHaveLength(12);
    expect(loopSeconds(winterRegion)).toBeCloseTo(30, 0);
    for (const p of winterRegion.parts) {
      const ev = partEvents(winterRegion, p);
      expect(ev.length, p.name).toBeGreaterThan(0);
      for (const e of ev) {
        expect(e.time).toBeGreaterThanOrEqual(0);
        expect(e.time + 0.001).toBeLessThan(loopSeconds(winterRegion));
      }
    }
    const lead = partEvents(winterRegion, winterRegion.parts.find((p) => p.name === 'lead')!);
    expect(lead[0]).toMatchObject({ midi: noteToMidi('A4') }); // melody starts on a pickup
    const d5 = lead.find((e) => e.midi === noteToMidi('D5'))!;
    expect(d5.dur).toBeCloseTo((60 / 96 / 2) * 2, 5); // "D5 -" = two eighth notes
  });

  it('melody and bass stay in D major (pitch classes D E F# G A B C#)', () => {
    const scale = new Set([2, 4, 6, 7, 9, 11, 1]);
    for (const name of ['lead', 'bell', 'bass', 'arp']) {
      const ev = partEvents(winterRegion, winterRegion.parts.find((p) => p.name === name)!);
      for (const e of ev) expect(scale.has(e.midi % 12), `${name} ${e.midi}`).toBe(true);
    }
  });
});

/** Pitch classes of each song's key (melody, bass and arpeggios must stay inside). */
const KEYS: [SongDef, number[]][] = [
  [winterRegion, [2, 4, 6, 7, 9, 11, 1]], // D major
  [greenRegion, [9, 11, 1, 2, 4, 6, 8]], // A major
  [cafeShift, [9, 11, 1, 2, 4, 6, 8]], // A major
];

describe('all songs', () => {
  it.each(KEYS.map(([s, k]) => [s.title, s, k] as const))('%s parses, fits its bars and stays in key', (_t, song, key) => {
    const scale = new Set(key);
    for (const p of song.parts) {
      const ev = partEvents(song, p);
      expect(ev.length, p.name).toBeGreaterThan(0);
      if (p.kind === 'drums' || p.kind === 'chord' || p.kind === 'strum') continue; // harmony may borrow (secondary dominants)
      for (const e of ev) expect(scale.has(e.midi % 12), `${song.title} ${p.name} midi ${e.midi}`).toBe(true);
    }
  });

  it('the café shift is a 120 BPM 4/4 groove on a 16th grid, 16 bars (32 s)', () => {
    expect(cafeShift.beatsPerBar * cafeShift.stepsPerBeat).toBe(16);
    expect(loopSeconds(cafeShift)).toBeCloseTo(32, 5);
  });

  it('every chord in every song has a real guitar shape', () => {
    for (const song of [winterRegion, greenRegion, cafeShift]) for (const c of song.chords) expect(GUITAR_SHAPES[c], `${song.title}: ${c}`).toBeDefined();
  });

  it('strums go low→high down and high→low up; chucks are muted; picked strings ring until re-picked', () => {
    const stabs = partEvents(winterRegion, winterRegion.parts.find((p) => p.name === 'stabs')!);
    const triad = stabs.filter((e) => !e.art?.mute);
    const firstT = triad.filter((e) => e.time === triad[0].time);
    expect(firstT.length).toBe(3); // T = top three strings of the shape
    expect(firstT[0].midi).toBeLessThan(firstT[2].midi); // downstroke: low → high
    const drive = partEvents(winterRegion, winterRegion.parts.find((p) => p.name === 'drive')!);
    expect(drive.filter((e) => e.time === drive[0].time).length).toBe(6); // D on Em9 020002 = all six strings
    expect(stabs.some((e) => e.art?.mute)).toBe(true);
    const arp = partEvents(winterRegion, winterRegion.parts.find((p) => p.name === 'arp')!);
    expect(arp[0].dur).toBeGreaterThan(0.5); // low string rings under the picking pattern
    const lead = partEvents(winterRegion, winterRegion.parts.find((p) => p.name === 'lead')!);
    expect(lead.some((e) => e.art?.slide) && lead.some((e) => e.art?.bend)).toBe(true);
  });
});
