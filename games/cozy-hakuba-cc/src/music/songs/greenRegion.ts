import type { SongDef } from '../score';

const R8 = '. . . . . . . .';

/**
 * "Paddles on Lake Aoki": the green-season region loop. 108 BPM, A major, 12 bars (~27 s).
 *
 * Brighter and jangly where the winter loop is hazy: a I–V/7–vi–IV opening (Amaj7 → E/G# → F#m7 → Dmaj7),
 * a glockenspiel answering the guitar, a skipping bass and an open-hat lift into the last four bars.
 * Same four restoration layers as the winter loop, so a region can switch seasons without changing its feel.
 *
 * v2 (band pass, after the winter loop's lessons): guitar 1 picks real chord shapes, guitar 2 enters at bar 5 with
 * small top-string triads and muted chucks, an 8th-note bass drive, audible ghost notes, an accented-hat lift (not a
 * cymbal wash), and a lead that breathes. The keyboard bed and bell only play in the quietest layer.
 */
export const greenRegion: SongDef = {
  title: 'Paddles on Lake Aoki',
  bpm: 108,
  beatsPerBar: 4,
  stepsPerBeat: 2,
  //        1        2       3       4        5      6        7       8       9        10    11      12
  chords: ['Amaj7', 'E/G#', 'F#m7', 'Dmaj7', 'Bm7', 'Esus4', 'C#m7', 'F#m9', 'Dmaj7', 'E6', 'C#m7', 'E'],
  parts: [
    // ---- layer 0 ----------------------------------------------------------------------
    { name: 'pad', instrument: 'pad', layer: 0, until: 1, vol: 0.85, kind: 'chord', center: 64, line: 'X - - - - - - -' },
    {
      name: 'bell', instrument: 'bell', layer: 0, until: 1, vol: 0.9, kind: 'notes',
      line: [
        'E6 . C#6 . . . A5 .', '. . B5 . . . G#5 .', 'A5 . . . C#6 . . .', '. . F#5 . A5 . . .',
        'D6 . . . B5 . . .', '. . A5 . . . G#5 .', 'E6 . . . C#6 . . .', '. . B5 . A5 . . .',
        'F#6 . . . E6 . . .', '. . C#6 . . . B5 .', 'G#5 . . . E6 . . .', 'B5 . G#5 . E5 . . .',
      ].join(' | '),
    },
    // ---- layer 1: guitar 1, jangly picking on the real shapes (brighter, busier than winter) ---------------------
    {
      name: 'arp', instrument: 'pluck', layer: 1, vol: 1.15, kind: 'pick',
      line: [
        '2! 4 3 5 . 4 3 5_', '2! 4 3 5 . 4 5 4_', '2! 4 3 5 . 4 3 5_', '2! 4 3 5 4 3 2 .',
        '2! 4 3 5 2_ 4 3 5', '2! 4 3 5 2_ 4 5 4', '2! 4 3 5 2_ 4 3 5', '2! 4 3 5 . . 5_ 4_',
        '3! . 4 5 3 5 4 5', '3! . 4 5 3 5 4 5', '3! . 4 5 3 5 4 5', '3! . 4 5 - - - -',
      ].join(' | '),
    },
    // ---- layer 2: rhythm section + guitar 2 -------------------------------------------------------------------
    {
      name: 'stabs', instrument: 'pluck', layer: 2, vol: 1, kind: 'strum',
      line: [
        R8, R8, R8, R8,
        '. x T! x . x T_ U', '. x T! x . x T_ x', '. x T! x . x T U', '. x T! x T! . . .', R8, R8, R8, R8,
      ].join(' | '),
    },
    {
      name: 'bass', instrument: 'bass', layer: 2, vol: 1.25, kind: 'bass', octave: 2,
      line: [
        'R! - - R 5 . R .', 'R! - - R 5 . R .', 'R! - - R 5 . 8 .', 'R! - - R 5 . R 5',
        'R! R R R 5 R R 8', 'R! R R R 5 R 4 .', 'R! R R R 5 R R 8', 'R! R R R 5 . b3 E2',
        'R! R 8 R 5 R 8 R', 'R! R 8 R 5 R 8 R', 'R! R 8 R 5 R 8 R', 'R! R . R 5 5 8 .',
      ].join(' | '),
    },
    {
      name: 'kick-snare', instrument: 'drums', layer: 2, vol: 1, kind: 'drums', steps: 16,
      line: [
        'k! . . . s! . . g . . k . s! . . g', 'k! . . g s! . . g . . k . s! . k g', 'k! . . . s! . g . . . k . s! . . g', 'k! . . g s! . . g . . k . s! g k .',
        'k! . . . s! . . g . g k . s! . . g', 'k! . . g s! . . g . . k . s! . k g', 'k! . . . s! . g . . g k . s! . . g', 'k! . . . s! . g g t! . t . m! . f f!',
        'k! . . . s! . . g k . k . s! . . g', 'k! . . g s! . . g k . k . s! . g g', 'k! . . . s! . . g k . k . s! . . g', 's! . s . s! g s . t! t m! m f! f s! s!',
      ].join(' | '),
    },
    {
      name: 'cymbals', instrument: 'drums', layer: 2, vol: 1.5, kind: 'drums', steps: 16,
      line: [
        'h! . h_ . h . h_ . h! . h_ . h . h_ h_', 'h! . h_ . h . h_ . h! . h_ . h . o .', 'h! . h_ . h . h_ . h! . h_ . h . h_ h_', 'h! . h_ . h . h_ . h! . h_ . o . . .',
        'h! . h_ . h . h_ . h! . h_ . h . h_ h_', 'h! . h_ . h . h_ . h! . h_ . h . o .', 'h! . h_ . h . h_ . h! . h_ . h . h_ h_', 'h! . h_ . h . h_ . . . . . . . . .',
        'c! . h_ . h! . h_ . h! . h_ . h! . o .', 'h! . h_ . h! . h_ . h! . h_ . h! . o .', 'h! . h_ . h! . h_ . h! . h_ . h! . o .', 'h! . h_ . h! . h_ . . . . . . . . .',
      ].join(' | '),
    },
    // ---- layer 3: lead (with breaths) and the overdriven lift -------------------------------------------------
    {
      name: 'lead', instrument: 'lead', layer: 3, vol: 1, kind: 'notes',
      line: [
        '. . . E5 A5 B5 C#6~ -', '- - B5 - G#5 - . .', R8, '. . . . . A5 B5 C#6',
        'D6 - C#6 B5 - - A5 -', '- - G#5 - E5 - . .', 'E5 - G#5 - B5 - C#6~ -', '- - A5 - . . . .',
        'F#6~ - E6 - D6 - C#6 -', 'B5 - - - C#6 - E6^ -', '- - G#5 - E5 - G#5 -', 'B5 - - - . . . .',
      ].join(' | '),
    },
    {
      name: 'fuzz', instrument: 'fuzz', layer: 3, vol: 0.85, kind: 'strum',
      line: [R8, R8, R8, R8, R8, R8, R8, R8, 'D! . D U x U D U', 'D! . D U x U D U', 'D! . D U x U D U', 'D! . D U x . D! -'].join(' | '),
    },
  ],
};
