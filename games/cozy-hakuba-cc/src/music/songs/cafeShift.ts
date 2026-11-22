import type { SongDef } from '../score';

const R16 = '. . . . . . . . . . . . . . . .'; // a bar of rest

/**
 * "Golden Hour at the Hatch": café / kitchen shift music. Bright indie funk-pop with a little soul, in the world of
 * muque's "ブルーライト" (an original piece: no borrowed melody, riff or progression). 120 BPM, straight 16ths, A major,
 * 16 bars (32 s).
 *
 * v3 (2026-11-21, replaces the 7/8 math-rock draft, which the user found too busy and panic-inducing): fun comes from
 * bounce and space, not density. Four-on-the-floor kick and a dry backbeat; offbeat top-string guitar "chanks";
 * a staccato bass that leaves air and pushes into each chord on the "and" of 4; soulful electric-piano comping;
 * warm city-pop 7ths and sus chords with a secondary dominant (C#7) and a borrowed minor iv (Dm6); a lead that
 * enters off the beat and leaves pockets. Bars 13-16 are a breather (drums drop out, chords hold) so long shifts
 * don't fatigue the ear.
 *
 * Layers build over a shift (BusinessScene raises them): 0 keys + guitar chanks · 1 + bass, kick, hats ·
 * 2 + snare backbeat, 16th hats and a second muted guitar · 3 + the lead.
 */
export const cafeShift: SongDef = {
  title: 'Golden Hour at the Hatch',
  bpm: 120,
  beatsPerBar: 4,
  stepsPerBeat: 4, // sixteenth-note steps
  chords: [
    'Dmaj7', 'E7sus4', 'C#m7', 'F#m7', 'Bm7', 'C#7', 'F#m7', 'E7sus4',
    'Dmaj7', 'E7sus4', 'C#m7', 'F#m7', 'Dmaj9', 'Dm6', 'C#m7', 'E7sus4',
  ],
  parts: [
    // ---- layer 0: doors open --------------------------------------------------------------------------------
    { name: 'keys', instrument: 'pad', layer: 0, vol: 2.5, kind: 'chord', center: 62, line: [
        'X - - - - - . X - - - . . . . .', 'X - - - - - . X - - - . . . . .', 'X - - - - - . X - - - . . . . .', 'X - - - - - . X - - - . . . . .',
        'X - - - - - . X - - - . . . . .', 'X - - - - - . X - - - . . . . .', 'X - - - - - . X - - - . . . . .', 'X - - - - - . X - - - . . . . .',
        'X - - - - - . X - - - . . . . .', 'X - - - - - . X - - - . . . . .', 'X - - - - - . X - - - . . . . .', 'X - - - - - . X - - - . . . . .',
        'X - - - - - - - - - - - - - - -', 'X - - - - - - - - - - - - - - -', 'X - - - - - - - - - - - - - - -', 'X - - - - - - - - - - - - - - -',
      ].join(' | ') },
    { name: 'chank', instrument: 'pluck', layer: 0, vol: 1.7, kind: 'strum', line: [
        '. . T! . . x T_ . . . T! . x . T_ .', '. . T! . . x T_ . . . T! . x . T_ .', '. . T! . . x T_ . . . T! . x . T_ .', '. . T! . . x T_ . . . T! . x . T_ .',
        '. . T! . . x T_ . . . T! . x . T_ .', '. . T! . . x T_ . . . T! . x . T_ .', '. . T! . . x T_ . . . T! . x . T_ .', '. . T! . . x T_ . . . T! . T! . . .',
        '. . T! . . x T_ . . . T! . x . T_ .', '. . T! . . x T_ . . . T! . x . T_ .', '. . T! . . x T_ . . . T! . x . T_ .', '. . T! . . x T_ . . . T! . x . T_ .',
        'T_ . . . . . . . . . . . . . . .', 'T_ . . . . . . . . . . . . . . .', 'T_ . . . . . . . . . . . . . . .', 'T_ . . . . . . . T_ . . . T . . .',
      ].join(' | ') },
    // ---- layer 1: the groove arrives -----------------------------------------------------------------------
    { name: 'bass', instrument: 'bass', layer: 1, vol: 1.5, vel: 0.6, kind: 'bass', octave: 2, line: [
        'R! . . R_ . . 8 . . R . 5 . . E2 .', 'R! . . R_ . . 8 . . R . 5 . . C#2 .', 'R! . . R_ . . 8 . . R . 5 . . F#2 .', 'R! . . R_ . . 8 . . R . 5 . . B1 .',
        'R! . . R_ . . 8 . . R . 5 . . C#2 .', 'R! . . R_ . . 8 . . R . 5 . . F#2 .', 'R! . . R_ . . 8 . . R . 5 . . E2 .', 'R! . . R_ . . 8 . . R . 5 . . D2 .',
        'R! . 8 R_ . . 8 . R! . 8 5 . . E2 .', 'R! . 8 R_ . . 8 . R! . 8 5 . . C#2 .', 'R! . 8 R_ . . 8 . R! . 8 5 . . F#2 .', 'R! . 8 R_ . . 8 . R! . 8 5 . . D2 .',
        'R! - - - - - - - 5 - - - . . D2 .', 'R! - - - - - - - 5 - - - . . C#2 .', 'R! - - - - - - - 5 - - - . . E2 .', 'R! - - - - - - - 5 - - - . . D2 .',
      ].join(' | ') },
    { name: 'kick', instrument: 'drums', layer: 1, vol: 0.8, kind: 'drums', line: [
        'k! . . . k . . . k . . . k . . .', 'k! . . . k . . . k . . . k . . .', 'k! . . . k . . . k . . . k . . .', 'k! . . . k . . . k . . . k . . .',
        'k! . . . k . . . k . . . k . . .', 'k! . . . k . . . k . . . k . . .', 'k! . . . k . . . k . . . k . . .', 'k! . . . k . . . k . . . k . k .',
        'k! . . . k . . . k . . . k . . .', 'k! . . . k . . . k . . . k . . .', 'k! . . . k . . . k . . . k . . .', 'k! . . . k . . . k . . . k . k .',
        'k_ . . . . . . . . . . . . . . .', 'k_ . . . . . . . . . . . . . . .', 'k_ . . . . . . . . . . . . . . .', 'k . . . . . . . k . . . k . k k',
      ].join(' | ') },
    { name: 'hats', instrument: 'drums', layer: 1, vol: 1.9, kind: 'drums', line: [
        'h! . h_ . h . h_ . h! . h_ . h . h_ .', 'h! . h_ . h . h_ . h! . h_ . h . h_ .', 'h! . h_ . h . h_ . h! . h_ . h . h_ .', 'h! . h_ . h . h_ . h! . h_ . h . h_ .',
        'h! . h_ . h . h_ . h! . h_ . h . h_ .', 'h! . h_ . h . h_ . h! . h_ . h . h_ .', 'h! . h_ . h . h_ . h! . h_ . h . h_ .', 'h! . h_ . h . h_ . h! . h_ . h . h_ .',
        'h! . h_ . h . h_ . h! . h_ . h . h_ .', 'h! . h_ . h . h_ . h! . h_ . h . h_ .', 'h! . h_ . h . h_ . h! . h_ . h . h_ .', 'h! . h_ . h . h_ . h! . h_ . h . h_ .',
        'h_ . . . h_ . . . h_ . . . h_ . . .', 'h_ . . . h_ . . . h_ . . . h_ . . .', 'h_ . . . h_ . . . h_ . . . h_ . . .', 'h_ . . . h_ . . . h . h . h . h .',
      ].join(' | ') },
    // ---- layer 2: full pocket ------------------------------------------------------------------------------
    { name: 'snare', instrument: 'drums', layer: 2, vol: 1.2, kind: 'drums', line: [
        '. . . . s! . . g . . . . s! . . .', '. . . . s! . . g . . g . s! . . g', '. . . . s! . . g . . . . s! . . .', '. . . . s! . . g . . g . s! . . g',
        '. . . . s! . . g . . . . s! . . .', '. . . . s! . . g . . g . s! . . g', '. . . . s! . . g . . . . s! . . .', '. . . . s! . . g . . g . s! . . g',
        '. . . . s! . . g . . g . s! . . g', '. . . . s! . . g . . g . s! . . g', '. . . . s! . . g . . g . s! . . g', '. . . . s! . . g . . g . s! . . g',
        R16, R16, R16, '. . . . . . . . . . . . s! g s! s!',
      ].join(' | ') },
    { name: 'hats16', instrument: 'drums', layer: 2, vol: 1.8, kind: 'drums', line: [
        '. h_ . . . h_ . h_ . h_ . . . h_ . .', '. h_ . . . h_ . h_ . h_ . . . h_ . .', '. h_ . . . h_ . h_ . h_ . . . h_ . .', '. h_ . . . h_ . h_ . h_ . . . h_ . .',
        '. h_ . . . h_ . h_ . h_ . . . h_ . .', '. h_ . . . h_ . h_ . h_ . . . h_ . .', '. h_ . . . h_ . h_ . h_ . . . h_ . .', '. h_ . . . h_ . h_ . h_ . . . h_ . .',
        '. h_ . . . h_ . h_ . h_ . . . h_ o .', '. h_ . . . h_ . h_ . h_ . . . h_ o .', '. h_ . . . h_ . h_ . h_ . . . h_ o .', '. h_ . . . h_ . h_ . h_ . . . h_ o .',
        R16, R16, R16, R16,
      ].join(' | ') },
    { name: 'chank2', instrument: 'pluck', layer: 2, vol: 2.4, kind: 'strum', line: [
        '. x . . . x . x . x . . . x . .', '. x . . . x . x . x . . . x . .', '. x . . . x . x . x . . . x . .', '. x . . . x . x . x . . . x . .',
        '. x . . . x . x . x . . . x . .', '. x . . . x . x . x . . . x . .', '. x . . . x . x . x . . . x . .', '. x . . . x . x . x . . . x . .',
        '. x . . . x . x . x . . . x . .', '. x . . . x . x . x . . . x . .', '. x . . . x . x . x . . . x . .', '. x . . . x . x . x . . . x . .',
        R16, R16, R16, R16,
      ].join(' | ') },
    // ---- layer 3: the hook ---------------------------------------------------------------------------------
    { name: 'lead', instrument: 'lead', layer: 3, vol: 1.55, kind: 'notes', line: [
        '. . A5 . B5 . C#6 - - . E5 . . . . .', '. . . . . . . . . . B5 . A5 - . .', '. . G#5 . B5 . C#6 - - . E6 . C#6 - . .', R16,
        '. . F#5 . A5 . B5 - - . D6 . . . . .', '. . . . . . . . . . C#6 . B5 - . .', '. . A5 . C#6 . E6 - - - C#6 . B5 . A5 .', '. . . . . . . . . . . . . . E5 F#5',
        'A5~ - . . C#6 . E6 - - . . . . . . .', '. . . . B5 . A5 . B5 - - - . . . .', '. . E6 . G#5 . B5 . C#6 - - . . . . .', 'F#6~ - - - E6 - C#6 - - - . . . . . .',
        'A5 - - - - - - - . . . . . . . .', R16, '. . . . . . . . G#5 . B5 . C#6 - - -', '- - - - B5 - - - . . . . . . . .',
      ].join(' | ') },
  ],
};
