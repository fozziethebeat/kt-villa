import tuning from '../../content/tuning.json';
import regions from '../../content/regions.json';
import archetypes from '../../content/archetypes.json';
import personalities from '../../content/personalities.json';
import quests from '../../content/quests.json';
import modules from '../../content/modules.json';
import business from '../../content/business.json';
import chassis from '../../content/chassis.json';
import layouts from '../../content/layouts.json';
import helpers from '../../content/helpers.json';
import minigames from '../../content/minigames.json';
import type { Content } from './types';

/** All data-driven content. Tuning lives in JSON so balance changes never touch code. */
export const CONTENT: Content = {
  tuning: tuning as unknown as Content['tuning'],
  regions: regions as unknown as Content['regions'],
  archetypes: archetypes as unknown as Content['archetypes'],
  personalities: personalities as unknown as Content['personalities'],
  quests: quests as unknown as Content['quests'],
  modules: modules as unknown as Content['modules'],
  business: business as unknown as Content['business'],
  chassis: chassis as unknown as Content['chassis'],
  helpers: helpers as unknown as Content['helpers'],
  layouts: layouts as unknown as Content['layouts'],
  minigames: minigames as unknown as Content['minigames'],
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

export function archetypeDef(content: Content, id: string) {
  const a = content.archetypes.find((x) => x.id === id);
  if (!a) throw new Error(`Unknown archetype: ${id}`);
  return a;
}

export function chassisDef(content: Content, tier: number) {
  const c = content.chassis.find((x) => x.tier === tier);
  if (!c) throw new Error(`Unknown chassis tier: ${tier}`);
  return c;
}
