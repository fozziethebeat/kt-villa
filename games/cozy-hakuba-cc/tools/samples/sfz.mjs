// Minimal SFZ parser (enough for the CC0 libraries we use): <control default_path>, <global>, <master>, <group>,
// <region>, #define, #include, opcode=value. Round robins from seq_position or lorand/hirand ranges.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const NOTE = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
export const keyNum = (v) => {
  if (v === undefined) return NaN;
  if (/^-?\d+$/.test(v)) return Number(v);
  const m = /^([a-gA-G])([#b]?)(-?\d)$/.exec(v);
  return m ? NOTE[m[1].toLowerCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12 : NaN;
};

function expand(path, defines = {}) {
  let text = readFileSync(path, 'utf8').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  text = text.replace(/#define\s+(\$\w+)\s+(\S+)/g, (_, k, v) => { defines[k] = v; return ''; });
  text = text.replace(/#include\s+"([^"]+)"/g, (_, inc) => expand(resolve(dirname(path), inc), defines));
  return text.replace(/\$\w+/g, (k) => defines[k] ?? k);
}

export function parseSfz(path) {
  const text = expand(path);
  const regions = [];
  let control = {}, global = {}, master = {}, group = {}, cur = null, header = null;
  const re = /<(\w+)>|(\w+)=([^\s<>=][^<>=]*?)(?=\s+\w+=|\s*<|\s*$)/g;
  const flush = () => { if (header === 'region' && cur) regions.push({ ...global, ...master, ...group, ...cur }); };
  for (let m; (m = re.exec(text));) {
    if (m[1]) {
      flush(); header = m[1];
      if (header === 'control') control = {};
      if (header === 'global') global = {};
      if (header === 'master') { master = {}; group = {}; }
      if (header === 'group') group = {};
      cur = header === 'region' ? {} : null;
      continue;
    }
    const k = m[2], v = m[3].trim();
    if (header === 'control') control[k] = v; else if (header === 'global') global[k] = v;
    else if (header === 'master') master[k] = v; else if (header === 'group') group[k] = v; else if (cur) cur[k] = v;
  }
  flush();
  const base = resolve(dirname(path), (control.default_path ?? '').replace(/\\/g, '/'));
  return regions.filter((r) => r.sample && (r.trigger ?? 'attack') === 'attack').map((r) => {
    const root = keyNum(r.pitch_keycenter ?? r.key ?? r.lokey);
    const rr = r.seq_position ? Number(r.seq_position) : r.lorand ? Math.round(Number(r.lorand) * 4) + 1 : 1;
    return {
      file: resolve(base, r.sample.replace(/\\/g, '/')), root,
      lo: keyNum(r.lokey ?? r.key) || root, hi: keyNum(r.hikey ?? r.key) || root,
      velLo: Number(r.lovel ?? 1), velHi: Number(r.hivel ?? 127), rr, tune: Number(r.tune ?? 0),
    };
  }).filter((z) => Number.isFinite(z.root));
}
