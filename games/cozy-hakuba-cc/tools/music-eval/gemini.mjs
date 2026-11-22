// Minimal Gemini Interactions API client (REST, no SDK). Reads GEMINI_API_KEY from the project's .env.
// Docs: POST https://generativelanguage.googleapis.com/v1beta/interactions  (header x-goog-api-key)
import { existsSync, readFileSync, statSync } from 'node:fs';

const ROOT = new URL('../../', import.meta.url);
export const MODEL = process.env.GEMINI_MODEL ?? 'gemini-4-hydrogen';
const BASE = 'https://generativelanguage.googleapis.com';
const API_REVISION = '2026-05-20';

function apiKey() {
  if (!process.env.GEMINI_API_KEY) {
    const env = new URL('.env', ROOT);
    if (existsSync(env)) {
      for (const line of readFileSync(env, 'utf8').split('\n')) {
        const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
        if (m) process.env[m[1]] ??= m[2].replace(/^['"]|['"]$/g, '');
      }
    }
  }
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error('GEMINI_API_KEY is not set (expected in games/cozy-hakuba-cc/.env)');
  return k;
}

const headers = () => ({ 'x-goog-api-key': apiKey(), 'Content-Type': 'application/json', 'Api-Revision': API_REVISION });

/** One interaction. `input` is an array of parts ({type:'text'|'video'|'audio', ...}). Returns { text, raw }. */
export async function interact({ input, schema, model = MODEL, extra = {} }) {
  const body = { model, input, ...extra };
  if (schema) body.response_format = { type: 'text', mime_type: 'application/json', schema };
  const res = await fetch(`${BASE}/v1beta/interactions`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  const raw = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${JSON.stringify(raw?.error ?? raw).slice(0, 800)}`);
  return { text: extractText(raw), raw };
}

/** Pull the model's text out of an interaction response (output_text, or the last text output). */
export function extractText(raw) {
  if (typeof raw.output_text === 'string') return raw.output_text;
  // Interactions responses: steps[] with {type:'thought'} and {type:'model_output', content:[{type:'text', text}]}.
  const fromSteps = (raw.steps ?? []).filter((s) => s?.type === 'model_output').flatMap((s) => s.content ?? []).filter((c) => c?.type === 'text').map((c) => c.text);
  if (fromSteps.length) return fromSteps.join('');
  const outs = raw.outputs ?? raw.output ?? [];
  const texts = (Array.isArray(outs) ? outs : []).filter((o) => o?.type === 'text' && typeof o.text === 'string').map((o) => o.text);
  return texts.join('\n');
}

/** Upload a local file with the resumable Files API flow; waits until it is ACTIVE. Returns { uri, name, mimeType }. */
export async function uploadFile(path, mimeType, displayName = path.split('/').pop()) {
  const size = statSync(path).size;
  const start = await fetch(`${BASE}/upload/v1beta/files`, {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey(), 'X-Goog-Upload-Protocol': 'resumable', 'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(size), 'X-Goog-Upload-Header-Content-Type': mimeType, 'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file: { display_name: displayName } }),
  });
  const url = start.headers.get('x-goog-upload-url');
  if (!start.ok || !url) throw new Error(`upload start ${start.status}: ${(await start.text()).slice(0, 400)}`);
  const up = await fetch(url, { method: 'POST', headers: { 'Content-Length': String(size), 'X-Goog-Upload-Offset': '0', 'X-Goog-Upload-Command': 'upload, finalize' }, body: readFileSync(path) });
  const info = await up.json();
  if (!up.ok) throw new Error(`upload ${up.status}: ${JSON.stringify(info).slice(0, 400)}`);
  let file = info.file;
  for (let i = 0; i < 60 && file.state && file.state !== 'ACTIVE'; i++) {
    if (file.state === 'FAILED') throw new Error(`file processing failed: ${file.name}`);
    await new Promise((r) => setTimeout(r, 2000));
    file = await (await fetch(`${BASE}/v1beta/${file.name}`, { headers: { 'x-goog-api-key': apiKey() } })).json();
  }
  return { uri: file.uri, name: file.name, mimeType };
}
