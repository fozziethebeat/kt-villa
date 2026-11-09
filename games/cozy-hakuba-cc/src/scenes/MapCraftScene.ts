import { ArrangeScene, type ArrangeData } from './ArrangeScene';

/** Correct sticker positions in map coordinates (geography-inspired: mountains west, lake south, river east). */
export const MAP_SLOTS: Record<string, [number, number]> = {
  mountains: [170, 120],
  gondola: [290, 210],
  station: [430, 300],
  onsen: [560, 180],
  lake: [300, 390],
};

/** Station step 2: draw the valley map (the first "arrange" creation). */
export class MapCraftScene extends ArrangeScene {
  constructor() { super('MapCraft'); }

  init(_data: Partial<ArrangeData>) {
    super.init({
      stepId: 'valley_map', item: 'valley_map', consume: 'blank_map', doneText: 'Bring it to Mrs. Kobayashi.',
      cfg: {
        title: 'Workbench · A Map for Visitors',
        subtitle: 'Drag each sticker onto the map',
        board: { texture: 'map_blank' },
        slots: MAP_SLOTS,
        notes: [
          "Mrs. Kobayashi's notes:",
          '· The Hakuba Sanzan peaks rise in the far northwest.',
          '· The gondola climbs toward them, between the peaks and the village.',
          '· The station sits at the crossroads where the road meets the river.',
          '· The onsen steams beside the river, upstream to the north.',
          '· Lake Aoki lies south, at the end of the road.',
        ],
        stickers: Object.keys(MAP_SLOTS).map((id) => ({ id, texture: `stk_${id}` })),
      },
    });
  }
}
