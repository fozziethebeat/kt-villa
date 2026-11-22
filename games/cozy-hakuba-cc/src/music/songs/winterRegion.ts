import type { SongDef } from '../score';

const R8 = '. . . . . . . .'; // a bar of rest (8 eighth-note steps)

/**
 * "First Snow at the Station": the winter region loop. 96 BPM, D major, 12 bars (~30 s).
 *
 * v9 (parts pass): guitar 1 picks real chord shapes, guitar 2 strums with muted chucks, the lead slides and bends,
 * the bass pushes into chords. v2 (dry live-band revision): an 8-bar verse where a single-coil arpeggio and off-beat chord stabs talk to each other
 * over a dry, ghost-noted pocket and a walking bass; a tom fill into a 4-bar lift with overdriven 8th-note strums,
 * ride cymbal and an octave-up lead hook; a second fill turns the loop around. The lead melody leaves rests so
 * game sounds stay clear. Layers: 0 Dormant (electric-piano bed + bell), 1 + clean arpeggio, 2 + bass, drums and
 * chord stabs (the bed steps aside), 3 + lead guitar and the overdriven lift.
 */
export const winterRegion: SongDef = {
  title: 'First Snow at the Station',
  bpm: 96,
  beatsPerBar: 4,
  stepsPerBeat: 2,
  //        1        2      3       4      5        6         7          8      9      10       11       12
  chords: ['Gmaj7', 'A6', 'F#m7', 'Bm7', 'Gmaj7', 'A7sus4', 'Dmaj7/F#', 'Bm9', 'Em9', 'Gmaj7', 'Asus4', 'A'],
  parts: [
    // ---- layer 0 (Dormant): a soft bed and a music-box bell; both step aside once the band arrives ----------------
    { name: 'bed', instrument: 'pad', layer: 0, until: 1, vol: 0.9, kind: 'chord', center: 62, line: 'X - - - - - - -' },
    {
      name: 'bell', instrument: 'bell', layer: 0, until: 1, vol: 0.8, kind: 'notes',
      line: [
        'F#5 . . . . . . .', '. . . . E5 . . .', 'C#5 . . . . . . .', '. . . . D5 . A4 .',
        'B5 . . . . . . .', '. . . . A5 . . .', 'F#5 . . . . . . .', '. . . . C#5 . . .',
        'G5 . . . . . . .', '. . . . F#5 . . .', 'E5 . . . . . . .', 'C#5 . . . E5 . A5 .',
      ].join(' | '),
    },
    // ---- layer 1 (Stirring): guitar 1 picks the real chord shape; strings ring into each other --------------------
    {
      name: 'arp', instrument: 'pluck', layer: 1, vol: 1.15, kind: 'pick',
      line: [
        '2! . 4 3 . 5 4 3_', '2! . 4 3 . 5 4 5_', '2! . 4 3 . 5 4 3_', '2! . 4 3 5 4 3 .',
        '2! 4 3 5 2_ 5 4 3', '2! 4 3 5 3_ 5 4 5', '2! 4 3 5 2_ 5 4 3', '2! 4 3 5 . . 5_ 4_',
        '3! . 4 5 3 5 4 5', '3! . 4 5 3 5 4 5', '3! . 4 5 3 5 4 5', '3! . 4 5 - - - -',
      ].join(' | '),
    },
    // ---- layer 2 (Awake): rhythm section + guitar 2 strumming off-beats with muted chucks ----------------------
    {
      // Guitar 2 waits until bar 5, then answers guitar 1 with small top-string triads and muted chucks (not full-chord pads).
      name: 'stabs', instrument: 'pluck', layer: 2, vol: 1, kind: 'strum',
      line: [
        R8, R8, R8, R8,
        '. x T! x . x T_ x', '. x T! x . x T U', '. x T! x . x T_ x', '. x T! x T! . . .', R8, R8, R8, R8,
      ].join(' | '),
    },
    {
      // Bass: roomy in bars 1-4, 8th-note drive from bar 5 with octave pops; pushes into each new chord on the last 8th.
      name: 'bass', instrument: 'bass', layer: 2, vol: 1.25, kind: 'bass', octave: 2,
      line: [
        'R! - - 5 . R 5 A2', 'R! - - 5 . R 8 F#2', 'R! - - 5 . R 5 .', 'R! - - 5 . 5 4 b3',
        'R! R R 8 R R 5 A2', 'R! R R 8 R R 5 F#2', 'R! R R 8 R 5 6 B2', 'R! R R 8 . 5 b7 E2',
        'R! R 8 R R_ 8 R 5', 'R! R 8 R R_ 8 R A2', 'R! R 8 R R_ 8 R 5', 'R! R 8 R 5 . b7 6',
      ].join(' | '),
    },
    // Drums on a 16th grid so ghost notes can sit on the "e" and "a" (16 steps per bar).
    {
      name: 'kick-snare', instrument: 'drums', layer: 2, vol: 1, kind: 'drums', steps: 16,
      line: [
        'k! . . . s! . . g . . k . s! . . g', 'k! . . g s! . . g . . k . s! . k g', 'k! . . . s! . g . . . k . s! . . g', 'k! . . g s! . . g . . k . s! g k .',
        'k! . . . s! . . g . g k . s! . . g', 'k! . . g s! . . g . . k . s! . k g', 'k! . . . s! . g . . g k . s! . . g', 'k! . . . s! . g g t! . t . m! . f f!',
        'k! . . . s! . . g k . k . s! . . g', 'k! . . g s! . . g k . k . s! . g g', 'k! . . . s! . . g k . k . s! . . g', 'k! . . . s! . g . t! t m! m f! f s! s!',
      ].join(' | '),
    },
    {
      name: 'cymbals', instrument: 'drums', layer: 2, vol: 1.5, kind: 'drums', steps: 16,
      line: [
        'h! . h_ . h . h_ . h! . h_ . h . h_ h_', 'h! . h_ . h . h_ . h! . h_ . h . o .', 'h! . h_ . h . h_ . h! . h_ . h . h_ h_', 'h! . h_ . h . h_ . h! . h_ . o . . .',
        'h! . h_ . h . h_ . h! . h_ . h . h_ h_', 'h! . h_ . h . h_ . h! . h_ . h . o .', 'h! . h_ . h . h_ . h! . h_ . h . h_ h_', 'h! . h_ . h . h_ . . . . . . . . .',
        'c! . h_ . h! . h_ . h! . h_ . h! . o .', 'h! . h_ . h! . h_ . h! . h_ . h! . o .', 'h! . h_ . h! . h_ . h! . h_ . h! . o .', 'h! . h_ . h! . h_ . h! . . . o . . .',
      ].join(' | '),
    },
    // ---- layer 3 (Thriving): a sung-sounding lead (slides ~, bends ^, vibrato on held notes) and the drive lift ---
    {
      name: 'lead', instrument: 'lead', layer: 3, vol: 1, kind: 'notes',
      line: [
        // A1: a pickup into the phrase, a note pushed ahead of beat 3, then a breath
        '. . . A4 B4 D5 - F#5~', '- - E5 - D5 - . .', '. . . . . . . .', '. . . C#5 D5 E5 - F#5',
        // A2: the answer climbs, lands ahead of the bar, and stops early
        '- - E5 D5 E5 - A5~ -', '- - G5 F#5 . . . .', 'F#5 - - - . . . .', '. . . . . A4 C#5 E5',
        // B: the lift hook, an octave up, with a held bend at the peak
        'B5~ - - - . A5 B5 -', 'D6 - F#6^ - - - E6 D6', '- - E6 - D6 - B5 -', 'C#6~ - - - - - . .',
      ].join(' | '),
    },
    {
      name: 'drive', instrument: 'fuzz', layer: 3, vol: 0.85, kind: 'strum',
      line: [R8, R8, R8, R8, R8, R8, R8, R8, 'D! . D U x U D U', 'D! . D U x U D U', 'D! . D U x U D U', 'D! . D U x . D! -'].join(' | '),
    },
  ],
};
