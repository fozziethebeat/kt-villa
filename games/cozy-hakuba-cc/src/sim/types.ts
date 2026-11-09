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
  effects?: ModuleEffects;
  blurb: string;
}

export interface ModuleEffects { stockBonus?: number; customerMult?: Partial<Record<ScoredSeason, number>>; tipMult?: number }

export interface ChassisDef { tier: number; name: string; grid: { w: number; h: number }; roofSlots: number; price: number; available: boolean; blurb: string }

export type ProductLine = 'cup' | 'bowl' | 'shelf';
export interface ProductDef { id: string; name: string; price: number; archetype: string; line: ProductLine; seasonAppeal: Record<ScoredSeason, number> }
export interface CustomerTypeDef { id: string; name: string; weight: Record<ScoredSeason, number>; prefs: Record<string, number>; patience: number; tip: number }
export interface BusinessDef {
  products: ProductDef[];
  customers: CustomerTypeDef[];
  shift: {
    baseCustomers: number; minCustomers: number; maxCustomers: number; durationSec: number;
    phaseMult: Record<PhaseId, number>; cupsPerPour: number; pours: number; bowlsPerCut: number; cuts: number; shelfStock: number;
    qualityMult: number[]; tipRate: number; reputationPerHappy: number; reputationPerMissed: number; specialtyBonus: number;
  };
  menuSlots: number;
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
}

export interface PlayerProfile {
  name: string;
  pronouns: 'she' | 'he' | 'they';
  personality: string;
}

export interface RegionState { vitality: Vitality; questStep: number; kodamaFound: number }

export interface Placement { moduleId: string; x: number; y: number; rot: number }

export interface ShiftSummary { day: number; region: string; served: number; missed: number; soldOut: number; yen: number; tips: number; reputation: number }

export interface GameState {
  version: 3;
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
  currentRegion: string;
  regions: Record<string, RegionState>;
  inventory: Record<string, number>;
  /** Feature flags unlocked by quests, e.g. "business:coffee", "module:pour_bar", "revival_board", "road:snowpeak". */
  unlocks: string[];
  /** Best star rating per quest step / mini-game id. */
  stars: Record<string, number>;
  van: { grid: { w: number; h: number }; owned: string[]; placed: Placement[]; roof: string[] };
  /** `menu` null = automatic (primary archetype first, then whatever the van can make). */
  business: { reputation: number; served: number; shifts: number; last: ShiftSummary | null; menu: string[] | null };
  log: string[];
}

export interface SeasonInfo {
  season: SeasonId;
  label: string;
  scored: boolean;
  dayInSeason: number; // 1-based
  seasonLength: number;
  year: number; // 1-based
}
