# Music evaluator (Gemini listens so you don't have to listen to every draft)

The loop: **Claude composes → renders WAVs → Gemini critiques against a style rubric → Claude revises**. You judge
the finalists, and steer by either giving musical direction or editing what the evaluator checks.

Requires `GEMINI_API_KEY` in `games/cozy-hakuba-cc/.env`. Uses `gemini-4-hydrogen` (override with `GEMINI_MODEL`)
through the Interactions API; renders are uploaded with the Files API.

| Command | What it does |
|---|---|
| `npm run music:profile` | Gemini watches the videos in `references.json` (agentic video understanding) and writes `references/ref-*.json`, `style-profile.json` and the rubric `style-profile.md`. Overwrites manual edits to the rubric. |
| `npm run music:render` | Renders the songs to `music-renders/*.wav` (dev server must be running) and prints objective checks (clipping, loudness, loop seams, spectrum). |
| `npm run music:eval -- music-renders/winter-tape-L3.wav` | Gemini listens and writes `*.eval.json` + `*.eval.md` next to the file: per-criterion scores with timestamps, red flags, ranked problems, a next-iteration plan in synth terms. The weighted score is computed locally; any red flag caps it at 5/10. |

## Steering it

- **Change what "good" means:** edit `style-profile.md` (criteria, weights, red flags). The evaluator reads that file directly.
  Keep weights in `style-profile.json` in sync if you change them (they drive the weighted score).
- **Change the target sound entirely:** edit `references.json` (public YouTube URLs) and rebuild with `npm run music:profile`.
- **Per-piece intent:** `briefs.json` (keyed by render file prefix). A brief overrides the rubric where it says so; for example,
  the café brief makes 7/8 math rock the intended style.

## Calibration (2026-11-21)

On the first tape-sampler drafts (which the game owner judged "washed out, doesn't fit the style") the evaluator scored
winter 4.9, green 4.6, café 4.4, flagged cavernous reverb, and described the timbres as synth/VGM rather than a live indie band.
That matched the human verdict, so the evaluator is ready to drive the next composition passes.

## Calibration, round 2 (2026-11-21)

- **Repeatability:** one render scored 3.2 / 3.7 / 4.3 on three runs, so the evaluator now reports the **median of 3** (`--runs`).
  Treat differences under about 1 point as noise.
- **Positive control:** tiny yawn's "花筏" (a reference track) scored **9/10** with the same rubric and prompt (`npm run music:eval -- <youtube url>`),
  so the scale discriminates. Our drafts sit around 4 whether the instruments are synthesized or real CC0 recordings. The persistent
  complaint is "programmed / General-MIDI feel", which points to the parts and performance (keyboard voicings, mechanical patterns), not the sound source.

## Judging policy (`policy.json`)
Layered over the video-derived rubric so rebuilding `style-profile.*` doesn't wipe it. Set by the user 2026-11-21: genre **feel**
matters most (weights favour vibe, harmony, melody, arrangement), and the judge is told how the music is made (hand-written score,
a few one-shot samples, real time in a browser) so it doesn't mark down the unavoidable "sequenced" sound. Also records that the
guitar library's timbre is fixed: even the raw, unprocessed samples are heard as "FM electric piano / synth pluck", so critique
the guitar *parts*, not the instrument.

## Instrument-identity probe (`identify.mjs`)
`node tools/stems.mjs winter 3 --save` writes each part solo to `music-renders/stems/`; `node tools/music-eval/identify.mjs <wav…>`
asks Gemini only what instrument it hears and which audible cues drive that. It found the strum-smear bug (per-note timing jitter
scrambled string order). Caveat: it hears "reverb/chorus" even in dry mono files, so treat it as a hint, not a measurement.
