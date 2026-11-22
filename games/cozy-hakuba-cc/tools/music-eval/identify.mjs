// Instrument-identity probe: ask Gemini only what it hears in a (solo) render and why it sounds real or not.
// Cheaper and more targeted than a full review when one part "reads as keyboard". Usage: node tools/music-eval/identify.mjs a.wav [b.wav ...]
import { basename } from 'node:path';
import { interact, uploadFile } from './gemini.mjs';

const s = { type: 'string' };
const SCHEMA = {
  type: 'object',
  properties: {
    instruments: { type: 'array', items: { type: 'object', properties: { heard_as: s, confidence: { type: 'number' }, playing: s, cues: s }, required: ['heard_as', 'confidence', 'playing', 'cues'] } },
    if_meant_to_be_electric_guitar: s,
  },
  required: ['instruments', 'if_meant_to_be_electric_guitar'],
};
for (const file of process.argv.slice(2)) {
  const up = await uploadFile(file, 'audio/wav');
  const prompt = `Listen to this short audio. Without assuming anything, name each instrument you hear (be specific: e.g. clean
electric guitar, Rhodes electric piano, harp, music box, synth pluck, acoustic guitar), your confidence 0–1, what it is playing, and
the audible cues behind your identification (attack, decay, overlap, spectrum, articulation). Then: if it were meant to be a clean
electric guitar in a Japanese indie band, what specifically makes it sound less like one, and what would most fix that?`;
  const r = await interact({ input: [{ type: 'text', text: prompt }, { type: 'audio', uri: up.uri, mime_type: 'audio/wav' }], schema: SCHEMA });
  const out = JSON.parse(r.text);
  console.log(`\n== ${basename(file)}`);
  for (const i of out.instruments) console.log(`- ${i.heard_as} (${i.confidence}): ${i.playing} | cues: ${i.cues}`);
  console.log(`> ${out.if_meant_to_be_electric_guitar}`);
}
