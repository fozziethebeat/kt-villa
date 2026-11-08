import manifest from '../content/asset-manifest.json';

export const FONT = '"Zen Maru Gothic", system-ui, sans-serif';
export const PAL = manifest.palette;
export const hex = (c: string) => parseInt(c.slice(1), 16);

export const WIDTH = 1280;
export const HEIGHT = 720;
/** Walkable band of the region scene (feet y-range). */
export const GROUND_TOP = 470;
export const GROUND_BOTTOM = 700;
