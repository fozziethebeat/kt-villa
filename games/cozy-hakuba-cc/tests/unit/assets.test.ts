import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import manifest from '../../content/asset-manifest.json';

describe('asset manifest', () => {
  it('has unique ids and every file exists with matching dimensions', () => {
    const ids = manifest.assets.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of manifest.assets) {
      const p = resolve(__dirname, '../../public/assets', a.file);
      expect(existsSync(p), a.file).toBe(true);
      const svg = readFileSync(p, 'utf8');
      expect(svg, `${a.id} width`).toContain(`width="${a.w}"`);
      expect(svg, `${a.id} height`).toContain(`height="${a.h}"`);
      expect(a.purpose.length, `${a.id} needs a purpose`).toBeGreaterThan(5);
    }
  });
});
