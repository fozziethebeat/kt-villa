// Style brief from one reference video: Gemini watches it and describes the FEEL (groove, harmony colour, instruments,
// arrangement build) so an original piece can live in the same world. It must not transcribe melodies or riffs.
// Usage: node tools/music-eval/describe-style.mjs <youtube-url> <out.json>
import { writeFileSync } from 'node:fs';
import { interact } from './gemini.mjs';

const [url, out] = process.argv.slice(2);
const s = { type: 'string' };
const SCHEMA = {
  type: 'object',
  properties: {
    genre_and_feel: s, tempo_and_groove: s, drums: s, bass: s, guitars: s, keys_and_other: s,
    harmony_colour: s, melody_style: s, arrangement_build: s, mix: s, why_it_feels_fun: s,
    original_piece_recipe: { type: 'array', items: s },
  },
  required: ['genre_and_feel', 'tempo_and_groove', 'drums', 'bass', 'guitars', 'keys_and_other', 'harmony_colour', 'melody_style', 'arrangement_build', 'mix', 'why_it_feels_fun', 'original_piece_recipe'],
};
const prompt = `Watch and listen to this whole music video. I am composing an ORIGINAL instrumental loop for a cozy game's café shift
that should live in the same musical world: same genre feel and energy, but no copied melody, riff, lyric or chord sequence.
Describe the style precisely enough for a composer: genre and feel, tempo and groove (straight or swung 16ths, where the backbeat
sits, syncopation), what each instrument plays (rhythmic roles, register, articulation), harmonic colour (chord TYPES and movement
habits in general terms, not the actual progression), melody style, how the arrangement builds and breathes, the mix, and what
makes it feel fun rather than tense. Finish with a recipe of 6-10 concrete, original-piece guidelines.`;
const r = await interact({ input: [{ type: 'text', text: prompt }, { type: 'video', uri: url, processing: 'agentic' }], schema: SCHEMA });
const j = JSON.parse(r.text);
writeFileSync(out, JSON.stringify({ url, ...j }, null, 2));
for (const [k, v] of Object.entries(j)) console.log(`## ${k}\n${Array.isArray(v) ? v.map((x) => '- ' + x).join('\n') : v}\n`);
