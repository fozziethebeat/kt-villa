import tuning from '../../content/tuning.json';
import regions from '../../content/regions.json';
import archetypes from '../../content/archetypes.json';
import personalities from '../../content/personalities.json';
import type { Content } from './types';

/** All data-driven content. Tuning lives in JSON so balance changes never touch code. */
export const CONTENT: Content = {
  tuning: tuning as Content['tuning'],
  regions: regions as Content['regions'],
  archetypes: archetypes as Content['archetypes'],
  personalities: personalities as unknown as Content['personalities'],
};

export function regionDef(content: Content, id: string) {
  const r = content.regions.find((x) => x.id === id);
  if (!r) throw new Error(`Unknown region: ${id}`);
  return r;
}
