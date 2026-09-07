import { TileItem } from "./types";

export function getGdScriptPreload(item: TileItem): string {
  return `var tex_${item.name.replace(/[^a-zA-Z0-9_]/g, '_')} = preload("${item.resPath}")`;
}

export function getGdScriptVector(item: TileItem): string {
  if (item.col !== undefined && item.row !== undefined) {
    return `Vector2i(${item.col}, ${item.row})`;
  }
  return `Vector2i(0, 0)`;
}

export function getGdScriptSetCell(item: TileItem): string {
  const sourceId = item.sourceId !== undefined ? item.sourceId : 0;
  const col = item.col ?? 0;
  const row = item.row ?? 0;
  return `tilemap_layer.set_cell(grid_pos, ${sourceId}, Vector2i(${col}, ${row}))`;
}

export function getEntityAnimationCode(item: TileItem): string {
  if (!item.frames || item.frames.length === 0) return "";
  const lines = [
    `# Frame sequence for ${item.name} (${item.fps || 4} FPS)`,
    `var frames = [`
  ];
  for (const f of item.frames) {
    lines.push(`    preload("${f.resPath}"), # ${f.name}`);
  }
  lines.push(`]`);
  return lines.join("\n");
}
