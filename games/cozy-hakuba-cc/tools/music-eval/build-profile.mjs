// Build the target-style rubric from reference videos with Gemini's agentic video understanding.
// Usage: node tools/music-eval/build-profile.mjs        → writes references/*.json, style-profile.json, style-profile.md
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { interact, MODEL } from './gemini.mjs';

const DIR = new URL('./', import.meta.url);
const refs = JSON.parse(readFileSync(new URL('references.json', DIR), 'utf8')).videos;
mkdirSync(new URL('references/', DIR), { recursive: true });

const str = { type: 'string' };
const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    artist: str, title: str,
    tempo_bpm: { type: 'number' }, meter: str, key_or_mode: str,
    song_form: str,
    instrumentation: { type: 'array', items: { type: 'object', properties: { instrument: str, role: str, tone: str, playing_style: str }, required: ['instrument', 'role', 'tone', 'playing_style'] } },
    guitars: str, bass: str, drums: str, keys_and_synths: str,
    harmony: str, melody: str, rhythm_and_groove: str,
    mix_and_production: { type: 'object', properties: { reverb_and_space: str, distortion_and_saturation: str, stereo_width: str, brightness_and_eq: str, compression_and_loudness: str, dynamics_and_arrangement: str }, required: ['reverb_and_space', 'distortion_and_saturation', 'stereo_width', 'brightness_and_eq', 'compression_and_loudness', 'dynamics_and_arrangement'] },
    signature_traits: { type: 'array', items: str },
    what_it_is_not: { type: 'array', items: str },
  },
  required: ['artist', 'title', 'tempo_bpm', 'meter', 'key_or_mode', 'song_form', 'instrumentation', 'guitars', 'bass', 'drums', 'keys_and_synths', 'harmony', 'melody', 'rhythm_and_groove', 'mix_and_production', 'signature_traits', 'what_it_is_not'],
};

const ANALYZE = `You are a veteran record producer and music theorist who knows Japanese indie / alternative rock deeply.
Listen to this music video carefully (the audio is what matters). Produce a precise, technical breakdown a composer could use to
write ORIGINAL instrumental music in the same genre and production style (not copying melodies or riffs).
Be concrete: describe guitar tones (clean/chorus/overdrive/fuzz, pick attack, amp character), drum sound and patterns,
bass playing, harmony (chord colours, progressions as functions, modulations), groove, and the mix (how wet/dry, how bright,
how loud and compressed, how wide). "what_it_is_not" should list sounds that would make an imitation feel wrong
(e.g. "washed-out ambient pads", "chiptune", "EDM sidechain").`;

const analyses = [];
for (const [i, uri] of refs.entries()) {
  const t0 = Date.now();
  process.stdout.write(`Analyzing reference ${i + 1}/${refs.length} (${uri}) … `);
  const r = await interact({ input: [{ type: 'text', text: ANALYZE }, { type: 'video', uri, processing: 'agentic' }], schema: ANALYSIS_SCHEMA });
  const a = { uri, ...JSON.parse(r.text) };
  analyses.push(a);
  writeFileSync(new URL(`references/ref-${i + 1}.json`, DIR), JSON.stringify(a, null, 2));
  console.log(`${a.artist} – "${a.title}" (${a.tempo_bpm} BPM, ${a.meter}) in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}

const RUBRIC_SCHEMA = {
  type: 'object',
  properties: {
    genre_summary: str,
    target_sound: { type: 'array', items: str },
    criteria: {
      type: 'array',
      items: {
        type: 'object',
        properties: { id: str, name: str, weight: { type: 'number' }, what_good_sounds_like: str, failure_modes: { type: 'array', items: str }, how_to_listen: str },
        required: ['id', 'name', 'weight', 'what_good_sounds_like', 'failure_modes', 'how_to_listen'],
      },
    },
    red_flags: { type: 'array', items: str },
    game_adaptation: { type: 'array', items: str },
  },
  required: ['genre_summary', 'target_sound', 'criteria', 'red_flags', 'game_adaptation'],
};

console.log('Synthesizing the rubric …');
const SYNTH = `Here are technical breakdowns of ${analyses.length} reference tracks (JSON below). Synthesize ONE evaluation rubric that a strict
music critic will use to judge whether a NEW, original, INSTRUMENTAL track (background music for a cozy video game about reviving
the Hakuba valley in Japan with a van café) genuinely sounds like it belongs in this genre and production style.

Requirements:
- 7 to 10 criteria with integer weights that sum to 100. Cover at least: guitar tone & parts, drums & groove, bass, harmony & chord colour,
  melody & hooks (instrumental: a lead instrument replaces the vocal), arrangement & dynamics, mix clarity & space (wet/dry, mud, brightness),
  overall genre authenticity / "would this pass on a Japanese indie playlist".
- Each criterion: what good sounds like (concrete, from the references), failure modes (concrete: e.g. "reverb so heavy the transients smear,
  sounds washed out"), and how to listen for it.
- red_flags: sounds that should cap the overall score (e.g. washed-out, toy-like/chiptune synth tones, static loop with no development).
- game_adaptation: how the style should be adapted for looping, instrumental game BGM without losing its identity.

REFERENCE ANALYSES:
${JSON.stringify(analyses, null, 1)}`;
const rr = await interact({ input: [{ type: 'text', text: SYNTH }], schema: RUBRIC_SCHEMA });
const rubric = { model: MODEL, built: new Date().toISOString(), references: analyses.map((a) => ({ uri: a.uri, artist: a.artist, title: a.title, tempo_bpm: a.tempo_bpm, meter: a.meter, key: a.key_or_mode })), ...JSON.parse(rr.text) };
writeFileSync(new URL('style-profile.json', DIR), JSON.stringify(rubric, null, 2));

// Human-editable Markdown version: this is what the evaluator reads, so edits here change what it checks.
const md = [
  '# Target style profile (music evaluator rubric)',
  '',
  `Built by ${MODEL} from the reference videos on ${rubric.built.slice(0, 10)}. **Edit this file to change what the evaluator checks**;`,
  'rebuild from scratch with `npm run music:profile` (that overwrites your edits).',
  '',
  '## References',
  ...rubric.references.map((r) => `- ${r.artist} – "${r.title}" (${r.tempo_bpm} BPM, ${r.meter}, ${r.key}) ${r.uri}`),
  '',
  '## Genre summary',
  rubric.genre_summary,
  '',
  '## Target sound',
  ...rubric.target_sound.map((t) => `- ${t}`),
  '',
  '## Criteria',
  ...rubric.criteria.flatMap((c) => [
    `### ${c.name} (\`${c.id}\`, weight ${c.weight})`,
    `**Good:** ${c.what_good_sounds_like}`,
    '',
    '**Failure modes:**',
    ...c.failure_modes.map((f) => `- ${f}`),
    '',
    `**How to listen:** ${c.how_to_listen}`,
    '',
  ]),
  '## Red flags (cap the overall score)',
  ...rubric.red_flags.map((f) => `- ${f}`),
  '',
  '## Adapting the style for game music',
  ...rubric.game_adaptation.map((g) => `- ${g}`),
  '',
].join('\n');
writeFileSync(new URL('style-profile.md', DIR), md);
console.log(`Wrote style-profile.md (${rubric.criteria.length} criteria, weights sum ${rubric.criteria.reduce((a, c) => a + c.weight, 0)}).`);
