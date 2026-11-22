// Music evaluator: Gemini listens to rendered audio and critiques it against the style rubric.
// Usage: node tools/music-eval/evaluate.mjs <file.wav> [...more]   (writes <file>.eval.json and <file>.eval.md next to each)
import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { interact, MODEL, uploadFile } from './gemini.mjs';
import { analyzeWav } from '../analyze-wav.mjs';

const DIR = new URL('./', import.meta.url);
// policy.json layers the user's judging policy (weights, production constraints, scale) over the video-derived rubric.
const policy = JSON.parse(readFileSync(new URL('policy.json', DIR), 'utf8'));
const weights = { ...Object.fromEntries(JSON.parse(readFileSync(new URL('style-profile.json', DIR), 'utf8')).criteria.map((c) => [c.id, c.weight])), ...policy.weights };
const rubricMd = readFileSync(new URL('style-profile.md', DIR), 'utf8').replace(/\(`(\w+)`, weight \d+\)/g, (m, id) => `(\`${id}\`, weight ${weights[id] ?? '?'})`);
const briefs = JSON.parse(readFileSync(new URL('briefs.json', DIR), 'utf8'));

/** The knobs the composer (Claude) can actually turn, so the critique's fixes are actionable. */
const ENGINE = `WHAT THE COMPOSER CAN CHANGE (only to make your fixes actionable; judge strictly by what you HEAR, do not assume
anything about how it was produced): the score is hand-written (chords per bar, step patterns, per-part rhythmic grids) and can change
tempo, chords, voicings, rhythms, parts, arrangement per bar and which layers play. Per instrument the mix offers: level, note length /
ring time, strum spread, timing and velocity humanization, EQ (high-pass, presence, low-pass), drive / saturation amount, chorus mix,
reverb send (short plate) and delay send; master compressor and limiter. Instruments: clean electric guitar (bridge pickup), a warmer
neck-tone guitar for leads, an overdriven rhythm guitar, electric bass, an acoustic drum kit (kick, snare, ghost snare, hi-hats closed /
half / open, three toms), plus a soft electric-piano bed and a bell that only play in the quietest layers.`;

const s = { type: 'string' };
const SCHEMA = {
  type: 'object',
  properties: {
    verdict: s,
    genre_fit_summary: s,
    criteria: { type: 'array', items: { type: 'object', properties: { id: s, score: { type: 'number' }, evidence: s, timestamps: { type: 'array', items: s } }, required: ['id', 'score', 'evidence', 'timestamps'] } },
    red_flags_triggered: { type: 'array', items: s },
    top_problems: { type: 'array', items: { type: 'object', properties: { issue: s, where: s, severity: { type: 'string', enum: ['high', 'medium', 'low'] }, fix: s }, required: ['issue', 'where', 'severity', 'fix'] } },
    what_works: { type: 'array', items: s },
    next_iteration_plan: { type: 'array', items: s },
  },
  required: ['verdict', 'genre_fit_summary', 'criteria', 'red_flags_triggered', 'top_problems', 'what_works', 'next_iteration_plan'],
};

function briefFor(file) {
  if (/^https?:/.test(file)) return 'CALIBRATION: this is a published reference track (with vocals). Judge its music and production against the rubric exactly as you would a candidate; treat the vocal as the lead melody.';
  const key = Object.keys(briefs).find((k) => k !== 'note' && basename(file).startsWith(k));
  const layer = /-L(\d)/.exec(basename(file))?.[1];
  return `${key ? briefs[key] : 'No specific brief.'}${layer !== undefined ? ` This render is layer L${layer}.` : ''}`;
}

/** Objective levels for the judge, so loudness/compression calls rest on numbers rather than impressions. */
function measured(file) {
  const a = analyzeWav(readFileSync(file));
  return `MEASURED LEVELS (objective): peak ${a.peakDb} dBFS, loudness ${a.loudnessDb} dB, peak-to-loudness ${Math.round((a.peakDb - a.loudnessDb) * 10) / 10} dB, clipped samples ${a.clipped}, spectral balance low/mid/high ${a.bands.low}/${a.bands.mid}/${a.bands.high} %.`;
}

export async function evaluate(file) {
  const t0 = Date.now();
  const isUrl = /^https?:\/\//.test(file);
  const media = isUrl ? { type: 'video', uri: file, processing: 'agentic' } : { type: 'audio', uri: (await uploadFile(file, 'audio/wav')).uri, mime_type: 'audio/wav' };
  const prompt = `You are an experienced producer and fan of Japanese indie / alt-rock (think Hitsujibungaku, tiny yawn, Gestalt Girl,
Kinoko Teikoku, Mass of the Fermenting Dregs). You are judging a candidate piece of ORIGINAL instrumental game music.
Listen to the WHOLE audio file carefully. Be honest and specific, and fair to how it is made (below). Scores are ${policy.scale}

${isUrl ? '' : `${policy.constraints}

${policy.layers}

${measured(file)}`}
Give timestamps (m:ss) for evidence and problems. Score EVERY criterion id in the rubric. List any rubric red flags that apply.
"next_iteration_plan" = the 3–6 most valuable concrete changes for the next version, most important first.

PIECE BRIEF (overrides the general rubric where it explicitly says so):
${briefFor(file)}

${ENGINE}

RUBRIC:
${rubricMd}`;
  const r = await interact({ input: [{ type: 'text', text: prompt }, media], schema: SCHEMA });
  const out = JSON.parse(r.text);
  // Weighted score computed here (not by the model) so it's consistent; red flags cap it at 5.
  const total = out.criteria.reduce((a, c) => a + (weights[c.id] ?? 0), 0) || 1;
  let weighted = out.criteria.reduce((a, c) => a + c.score * (weights[c.id] ?? 0), 0) / total;
  const capped = out.red_flags_triggered.length > 0 && weighted > 5;
  if (capped) weighted = 5;
  const report = { file: basename(file), model: MODEL, evaluated: new Date().toISOString(), seconds: Math.round((Date.now() - t0) / 1000), weighted_score: Math.round(weighted * 10) / 10, capped_by_red_flags: capped, ...out };
  const outBase = isUrl ? new URL(`../../music-renders/control-${file.split('v=')[1]?.slice(0, 11) ?? 'url'}`, import.meta.url).pathname : file.replace(/\.wav$/, '');
  writeFileSync(`${outBase}.eval.json`, JSON.stringify(report, null, 2));
  writeFileSync(`${outBase}.eval.md`, toMarkdown(report));
  return report;
}

function toMarkdown(r) {
  return [
    `# Evaluation: ${r.file}`,
    `**Score ${r.weighted_score}/10**${r.capped_by_red_flags ? ' (capped by red flags)' : ''} · ${r.model} · ${r.evaluated.slice(0, 16)}`,
    '', `**Verdict:** ${r.verdict}`, '', r.genre_fit_summary, '',
    '## Criteria', ...r.criteria.map((c) => `- **${c.id}** ${c.score}/10: ${c.evidence}${c.timestamps.length ? ` (${c.timestamps.join(', ')})` : ''}`),
    '', '## Red flags', ...(r.red_flags_triggered.length ? r.red_flags_triggered.map((f) => `- ${f}`) : ['- none']),
    '', '## Top problems', ...r.top_problems.map((p) => `- [${p.severity}] ${p.issue} (${p.where}). Fix: ${p.fix}`),
    '', '## What works', ...r.what_works.map((w) => `- ${w}`),
    '', '## Next iteration', ...r.next_iteration_plan.map((n, i) => `${i + 1}. ${n.replace(/^\s*\d+[.)]\s*/, '')}`), '',
  ].join('\n');
}

/**
 * Single runs are noisy (calibration 2026-11-21: the same render scored 3.2 / 3.7 / 4.3). Run `n` times and keep the
 * report whose score is the median; all scores are recorded in `runs`.
 */
export async function evaluateMedian(file, n = 3) {
  const reports = await Promise.all(Array.from({ length: n }, () => evaluate(file)));
  const sorted = [...reports].sort((a, b) => a.weighted_score - b.weighted_score);
  const med = sorted[Math.floor(n / 2)];
  const out = { ...med, runs: reports.map((r) => r.weighted_score), spread: Math.round((sorted[n - 1].weighted_score - sorted[0].weighted_score) * 10) / 10 };
  const isUrl = /^https?:/.test(file);
  const outBase = isUrl ? new URL(`../../music-renders/control-${file.split('v=')[1]?.slice(0, 11) ?? 'url'}`, import.meta.url).pathname : file.replace(/\.wav$/, '');
  writeFileSync(`${outBase}.eval.json`, JSON.stringify(out, null, 2));
  writeFileSync(`${outBase}.eval.md`, toMarkdown(out).replace(/\*\*Score ([\d.]+)\/10\*\*/, `**Score $1/10** (median of ${n}: ${out.runs.join(', ')})`));
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const n = args.includes('--runs') ? Number(args[args.indexOf('--runs') + 1]) : 3;
  const files = args.filter((a, i) => a !== '--runs' && args[i - 1] !== '--runs');
  if (!files.length) { console.error('usage: node tools/music-eval/evaluate.mjs [--runs 3] <file.wav|youtube-url> [...]'); process.exit(1); }
  for (const f of files) {
    process.stdout.write(`Evaluating ${basename(f)} (${n} runs) … `);
    const r = await evaluateMedian(f, n);
    console.log(`${r.weighted_score}/10 median [${r.runs.join(', ')}]${r.capped_by_red_flags ? ' (capped)' : ''}: ${r.verdict}`);
  }
}
