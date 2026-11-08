// Engine-agnostic game types. Nothing in src/sim may import Phaser.

export type SeasonId = 'autumn' | 'winter' | 'spring' | 'green';
export type ScoredSeason = 'winter' | 'green';
export type PhaseId = 'morning' | 'afternoon' | 'evening' | 'night';
export type Vitality = 0 | 1 | 2 | 3;
export type ActionKind = 'forage' | 'questStep' | 'miniGame' | 'businessShift' | 'craft';

export interface CalendarEntry { season: SeasonId; label: string; days: number; scored: boolean }
export interface DayPhase { id: PhaseId; label: string; untilSpent: number }

export interface Tuning {
  baseStamina: number;
  actionCosts: Record<ActionKind, number>;
  dayPhases: DayPhase[];
  calendar: CalendarEntry[];
  startingYen: number;
  startingKizuna: number;
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
}

export interface ArchetypeDef {
  id: string;
  name: string;
  icon: string;
  strongIn: Record<ScoredSeason, number>;
  products: string[];
}

export interface PersonalityDef {
  id: string;
  name: string;
  blurb: string;
  mods: Record<string, number>;
}

export interface Content {
  tuning: Tuning;
  regions: RegionDef[];
  archetypes: ArchetypeDef[];
  personalities: PersonalityDef[];
}

export interface PlayerProfile {
  name: string;
  pronouns: 'she' | 'he' | 'they';
  personality: string;
}

export interface RegionState { vitality: Vitality; questStep: number; kodamaFound: number }

export interface GameState {
  version: 1;
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
