export interface TileUsage {
  pack: string;
  tile_name: string;
  project: string;
  entity_type: string;
  entity_id?: string;
  role?: string;
  notes?: string;
}

export interface EntityFrame {
  name: string;
  imgSrc: string;
  resPath: string;
  sourceTile?: string;
}

export interface EntityComponent {
  name: string;
  tile: string;
}

export interface Entity {
  id: string;
  name: string;
  project: string;
  entity_type: string;
  fps: number;
  preview_img: string;
  frames?: EntityFrame[];
  components?: EntityComponent[];
  notes?: string;
}

export interface TileItem {
  key: string;
  name: string;
  pack: string;
  packName: string;
  col?: number;
  row?: number;
  w?: number;
  h?: number;
  sx?: number;
  sy?: number;
  imgSrc: string;
  resPath: string;
  isAtlasSlice?: boolean;
  isEntity?: boolean;
  fps?: number;
  frames?: EntityFrame[];
  components?: EntityComponent[];
  sourcePack?: string;
  sourceTile?: string;
  sourceId?: number;
  tags: string[];
  usages?: TileUsage[];
  categoryPill?: string;
  entity_type?: string;
}

export interface PackData {
  id: string;
  name: string;
  icon: string;
  desc: string;
  isEntityPack?: boolean;
  tiles: TileItem[];
}

export interface CatalogData {
  packs: Record<string, PackData>;
  usages: TileUsage[];
  entities: Entity[];
  projects: Record<string, { name: string; description: string; path: string }>;
}

export interface HakubaTarget {
  id: string;
  name: string;
  type: string;
  role: string;
  icon: string;
  category: string;
  sourceId?: number;
  defaultTile?: string;
  notes?: string;
}
