/** Tiny music-theory helpers: note names, chord spelling, guitar-ish voicings. Pure functions (unit-tested). */

const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** 'F#4' → 66 (MIDI). */
export function noteToMidi(name: string): number {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) throw new Error(`Bad note: ${name}`);
  return PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12;
}

export const midiToHz = (m: number) => 440 * 2 ** ((m - 69) / 12);

/** Semitone intervals for the chord qualities this genre leans on (major 7ths, add9s, sus chords). */
const QUALITY: Record<string, number[]> = {
  '': [0, 4, 7], m: [0, 3, 7], '5': [0, 7, 12],
  maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], '7': [0, 4, 7, 10], '6': [0, 4, 7, 9], m6: [0, 3, 7, 9],
  add9: [0, 4, 7, 14], madd9: [0, 3, 7, 14], maj9: [0, 4, 7, 11, 14], m9: [0, 3, 7, 10, 14],
  sus2: [0, 2, 7], sus4: [0, 5, 7], '7sus4': [0, 5, 7, 10], m7b5: [0, 3, 6, 10], maj7s11: [0, 4, 7, 11, 18],
  m11: [0, 3, 7, 10, 17], '6add9': [0, 4, 7, 9, 14],
};

export interface Chord { name: string; root: number; intervals: number[]; bass: number }

/** 'F#m7', 'Gmaj7', 'D/F#' (slash bass) → root pitch class + intervals. */
export function parseChord(name: string): Chord {
  const [main, slash] = name.split('/');
  const m = /^([A-G])([#b]?)(.*)$/.exec(main);
  if (!m || !(m[3] in QUALITY)) throw new Error(`Bad chord: ${name}`);
  const root = (PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12;
  let bass = root;
  if (slash) { const b = /^([A-G])([#b]?)$/.exec(slash); if (!b) throw new Error(`Bad slash: ${name}`); bass = (PC[b[1]] + (b[2] === '#' ? 1 : b[2] === 'b' ? -1 : 0) + 12) % 12; }
  return { name, root, intervals: QUALITY[m[3]], bass };
}

/**
 * A guitar-ish voicing: root placed so the chord sits around `center` (MIDI), tones ascending.
 * Returned sorted, so arpeggio patterns can index tones 0..n-1 from low to high.
 */
export function voice(chord: Chord, center = 57): number[] {
  let base = chord.root + 48; // C3 octave
  while (base + 6 < center - 6) base += 12;
  while (base > center) base -= 12;
  return chord.intervals.map((i) => base + i).sort((a, b) => a - b);
}

/** The bass note for a chord in a given octave (default around E1–E2). */
export function bassNote(chord: Chord, octave = 2): number {
  return chord.bass + (octave + 1) * 12;
}

// ---- guitar ------------------------------------------------------------------

/** Standard tuning, low E to high e. */
export const STRINGS = [40, 45, 50, 55, 59, 64];

/**
 * Hand-picked guitar shapes (frets low E → high e, 'x' = muted) for the chords our songs use. Open strings and
 * shared upper notes are what make chords sound like a guitar instead of a keyboard. Frets above 9 use letters
 * (a = 10, b = 11, c = 12).
 */
export const GUITAR_SHAPES: Record<string, string> = {
  // D major / B minor family (winter)
  Gmaj7: '320002', A6: 'x02222', 'F#m7': '242222', Bm7: 'x24232', A7sus4: 'x02030', 'Dmaj7/F#': '2x0222',
  Bm9: 'x20222', Em9: '020002', Asus4: 'x02230', A: 'x02220', D: 'xx0232', Dmaj7: 'xx0222', Em7: '022033', G: '320033',
  // A major family (green)
  Amaj7: 'x02120', 'E/G#': '4x2100', Dmaj9: 'xx0220', Esus4: '022200', 'C#m7': 'x46454', 'F#m9': '242224', E6: '022120', E: '022100',
  // E major family (café)
  Emaj7: '021100', Amaj9: 'x02100', B6: 'x24444', 'G#m7': '464444', B7sus4: 'x24252', B: 'x24442',
  // café (indie-soul): V7sus4, a secondary dominant and a borrowed minor-iv colour
  E7sus4: '020200', 'C#7': 'x46464', Dm6: 'xx0201',
};

/** Sounding notes of a chord's guitar shape, low → high (falls back to a keyboard voicing if no shape is known). */
export function guitarNotes(chordName: string): number[] {
  const shape = GUITAR_SHAPES[chordName];
  if (!shape) return voice(parseChord(chordName), 57);
  const notes: number[] = [];
  [...shape].forEach((f, i) => { if (f !== 'x') notes.push(STRINGS[i] + parseInt(f, 36)); });
  return notes;
}
