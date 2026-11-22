// Engine-agnostic game types. Nothing in src/sim may import Phaser.

export type SeasonId = 'autumn' | 'winter' | 'spring' | 'green';
export type ScoredSeason = 'winter' | 'green';
export type PhaseId = 'morning' | 'afternoon' | 'evening' | 'night';
export type Vitality = 0 | 1 | 2 | 3;
export type ActionKind = 'forage' | 'questStep' | 'miniGame' | 'businessShift' | 'craft' | 'drive';

export interface CalendarEntry { season: SeasonId; label: string; days: number; scored: boolean }
export interface DayPhase { id: PhaseId; label: string; untilSpent: number }

export interface Tuning {
  baseStamina: number;
  actionCosts: Record<ActionKind, number>;
  dayPhases: DayPhase[];
  calendar: CalendarEntry[];
  startingYen: number;
  startingKizuna: number;
  roadCost: number;
  /** Days a key person needs before their next request can be turned in (cozy daily rhythm). 0 disables. */
  stepCooldownDays: number;
}

export interface RegionDef {
  id: string;
  order: number;
  name: string;
  nameJa: string;
  keyPerson: string;
  connects: string[];
  requires: { chassisTier: number; regions: string[] };
  draw: Record<ScoredSeason, number>;
  /** Position on the valley travel map (1280×720 screen space). */
  map: [number, number];
  /** Has a playable scene in this build. */
  playable: boolean;
  /** Seasonal attraction that opens at Thriving and raises demand across the valley. */
  attraction?: { name: string; blurb: string; demand: Record<ScoredSeason, number> };
}

export interface ArchetypeDef {
  id: string;
  name: string;
  icon: string;
  strongIn: Record<ScoredSeason, number>;
  phaseMult: Record<PhaseId, number>;
  products: string[];
  /** Module built for free when this archetype is chosen at Snow Peak. */
  builds: string;
  pitch: string;
  signature: string;
  /** Offered as a first trade at Snow Peak (others unlock as a second trade at Rank 3). */
  primaryChoice: boolean;
}

export interface PersonalityDef {
  id: string;
  name: string;
  blurb: string;
  summary: string;
  mods: Record<string, number>;
}

export type QuestType = 'fetch' | 'create' | 'puzzle';
export interface QuestStepDef {
  id: string;
  type: QuestType;
  title: string;
  needs: Record<string, number>;
  consumes: boolean;
  rewards: Record<string, number>;
  vitality: Vitality;
  unlocks: string[];
  lines: { intro: string; progress: string; complete: string };
}
export interface RegionQuestDef { keyPerson: string; steps: QuestStepDef[]; after: string }

export type Shape = [number, number][];
export interface ModuleDef {
  id: string;
  name: string;
  category: 'living' | 'production' | 'service' | 'roof' | 'utility';
  shape: Shape;
  comfort: number;
  price: number;
  enables: string[];
  /** Only sold once this trade is yours (primary or secondary). */
  archetype?: string;
  effects?: ModuleEffects;
  blurb: string;
}

export interface ModuleEffects { stockBonus?: number; customerMult?: Partial<Record<ScoredSeason, number>>; tipMult?: number; staminaBonus?: number }

export interface RankDef { rank: number; title: string; reputation: number; regions: number; menuSlots: number; helpers: number; secondary: boolean }
export interface HelperDef { region: string; name: string; blurb: string; effects: ModuleEffects }

export interface ChassisDef { tier: number; name: string; grid: { w: number; h: number }; roofSlots: number; price: number; available: boolean; blurb: string }

export type ProductLine = 'cup' | 'bowl' | 'shelf' | 'session';
export interface ProductDef { id: string; name: string; price: number; archetype: string; line: ProductLine; seasonAppeal: Record<ScoredSeason, number> }
export interface CustomerTypeDef { id: string; name: string; weight: Record<ScoredSeason, number>; prefs: Record<string, number>; patience: number; tip: number }
export interface BusinessDef {
  products: ProductDef[];
  customers: CustomerTypeDef[];
  shift: {
    baseCustomers: number; minCustomers: number; maxCustomers: number; durationSec: number;
    phaseMult: Record<PhaseId, number>; cupsPerPour: number; pours: number; bowlsPerCut: number; cuts: number; shelfStock: number; sessionStock: number;
    qualityMult: number[]; tipRate: number; reputationPerHappy: number; reputationPerMissed: number; specialtyBonus: number;
  };
  menuSlots: number;
  ranks: RankDef[];
  helperCost: number;
  liveries: { id: string; name: string; tint: string; price: number }[];
  sponsorship: { base: number; step: number; buzz: number };
  comfortStaminaDivisor: number;
  comfortStaminaCap: number;
}

export interface Content {
  tuning: Tuning;
  regions: RegionDef[];
  archetypes: ArchetypeDef[];
  personalities: PersonalityDef[];
  quests: Record<string, RegionQuestDef>;
  modules: ModuleDef[];
  business: BusinessDef;
  chassis: ChassisDef[];
  helpers: HelperDef[];
  layouts: Record<string, RegionLayoutDef>;
  minigames: Record<string, MiniGameDef>;
}

/** Data-driven layout for a walkable region (M3+). Coordinates are 1280×720 screen space. */
export interface RegionLayoutDef {
  sceneKey: string;
  keyPerson: { name: string; texture: string; at: [number, number] };
  van: [number, number];
  vanTexture?: string;
  vanPrompt?: string;
  playerStart: [number, number];
  kodama: [number, number][];
  trees: [number, number, number][];
  crowdLanes: [number, number, number][];
  crowd: { snowy: string[]; green: string[] };
  landmarks: { texture: string; at: [number, number]; flip?: boolean; tint?: string; depth?: number; scale?: [number, number] }[];
  festive?: { at: [number, number] };
  board?: [number, number];
  stations: { steps: string[]; at: [number, number]; texture: string | null; prompt: string; overlay: string; config: string; cost: ActionKind }[];
  fetch: { step: string; item: string; texture: string; label: string; cost: ActionKind | null; spots: [number, number][] };
}

export type MiniGameDef = { engine: string; title: string; subtitle?: string } & Record<string, unknown>;

export interface PlayerProfile {
  name: string;
  pronouns: 'she' | 'he' | 'they';
  personality: string;
  /** Appearance preset 0–3 (M5). */
  look?: number;
}

export interface RegionState { vitality: Vitality; questStep: number; kodamaFound: number; /** Day from which the next step can be turned in. */ readyDay?: number }

export interface Placement { moduleId: string; x: number; y: number; rot: number }

export interface ShiftSummary { day: number; region: string; served: number; missed: number; soldOut: number; yen: number; tips: number; reputation: number }

export interface GameState {
  version: 6;
  seed: number;
  rngState: number;
  player: PlayerProfile;
  day: number; // 1-based absolute day counter
  staminaMax: number;
  staminaSpent: number;
  yen: number;
  kizuna: number;
  chassisTier: number;
  primaryArchetype: string | null;
  /** Second trade, chosen at Rank 3. */
  secondaryArchetype: string | null;
  /** Regions whose key person helps at the van (one effect each). */
  helpers: string[];
  /** Set when the Hakuba Valley Festival ending is reached. */
  ending: { day: number } | null;
  /** Regions whose festival the van sponsors (late-game yen sink: +buzz every season). */
  sponsored: string[];
  currentRegion: string;
  regions: Record<string, RegionState>;
  inventory: Record<string, number>;
  /** Feature flags unlocked by quests, e.g. "business:coffee", "module:pour_bar", "revival_board", "road:snowpeak". */
  unlocks: string[];
  /** Best star rating per quest step / mini-game id. */
  stars: Record<string, number>;
  van: { grid: { w: number; h: number }; owned: string[]; placed: Placement[]; roof: string[]; livery?: string; liveries?: string[] };
  /** `menu` null = automatic (primary archetype first, then whatever the van can make). */
  business: { reputation: number; served: number; shifts: number; last: ShiftSummary | null; menu: string[] | null };
  /** Running totals for the current season (reset when a season ends). */
  seasonStats: SeasonStats;
  /** Season Reports written at the end of each scored season. */
  reports: SeasonReport[];
  log: string[];
}

export interface SeasonStats { yen: number; served: number; soldOut: number; missed: number; shifts: number; byProduct: Record<string, number>; byRegion: Record<string, number> }
export interface RegionBuzz { region: string; name: string; vitality: number; buzz: number; attraction: string | null; shifts: number }
export interface SeasonReport {
  season: ScoredSeason; year: number; label: string; endedDay: number;
  regions: RegionBuzz[]; valleyBuzz: number; rating: 'Quiet' | 'Busy' | 'Thriving';
  business: { yen: number; served: number; soldOut: number; shifts: number; reputation: number; bestSeller: string | null };
  tips: string[];
}

export interface SeasonInfo {
  season: SeasonId;
  label: string;
  scored: boolean;
  dayInSeason: number; // 1-based
  seasonLength: number;
  year: number; // 1-based
}
