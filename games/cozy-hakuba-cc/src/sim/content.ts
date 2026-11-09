import tuning from '../../content/tuning.json';
import regions from '../../content/regions.json';
import archetypes from '../../content/archetypes.json';
import personalities from '../../content/personalities.json';
import quests from '../../content/quests.json';
import modules from '../../content/modules.json';
import business from '../../content/business.json';
import type { Content } from './types';

/** All data-driven content. Tuning lives in JSON so balance changes never touch code. */
export const CONTENT: Content = {
  tuning: tuning as Content['tuning'],
  regions: regions as Content['regions'],
  archetypes: archetypes as Content['archetypes'],
  personalities: personalities as unknown as Content['personalities'],
  quests: quests as unknown as Content['quests'],
  modules: modules as unknown as Content['modules'],
  business: business as unknown as Content['business'],
};

export function regionDef(content: Content, id: string) {
  const r = content.regions.find((x) => x.id === id);
  if (!r) throw new Error(`Unknown region: ${id}`);
  return r;
}

export function moduleDef(content: Content, id: string) {
  const m = content.modules.find((x) => x.id === id);
  if (!m) throw new Error(`Unknown module: ${id}`);
  return m;
}

export function productDef(content: Content, id: string) {
  const p = content.business.products.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown product: ${id}`);
  return p;
}
