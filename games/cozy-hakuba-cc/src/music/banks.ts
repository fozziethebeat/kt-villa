import { SampleBank, type SampleMap } from './sampler';

/** Sample maps in content/samples/*.json (built from CC0 libraries by tools/samples/sfz-to-map.mjs). */
const MAPS = import.meta.glob('../../content/samples/*.json', { eager: true, import: 'default' }) as Record<string, SampleMap>;

/** Which bank each band instrument plays from (when present). */
export const BANK_FOR = { pluck: 'guitar', fuzz: 'guitar', lead: 'guitar_neck', bass: 'bass', drums: 'drums' } as const;
export type BankId = (typeof BANK_FOR)[keyof typeof BANK_FOR];

export function availableMaps(): SampleMap[] { return Object.values(MAPS); }

/** Decode every available bank with this context (cached per context). */
const cache = new WeakMap<BaseAudioContext, Promise<Partial<Record<string, SampleBank>>>>();
export function loadBanks(ctx: BaseAudioContext): Promise<Partial<Record<string, SampleBank>>> {
  let p = cache.get(ctx);
  if (!p) {
    p = Promise.all(availableMaps().map((m) => new SampleBank(m).load(ctx, import.meta.env.BASE_URL))).then((banks) => Object.fromEntries(banks.map((b) => [b.map.id, b])));
    cache.set(ctx, p);
  }
  return p;
}
