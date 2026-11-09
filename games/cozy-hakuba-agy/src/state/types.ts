export type Season = 'winter' | 'green';
export type Gender = 'female' | 'male' | 'nonbinary';
export type PersonalityId = 'barista' | 'tinkerer' | 'photographer' | 'curator';
export type RegionId = 'station' | 'snowpeak' | 'happo' | 'echoland' | 'iwatake' | 'goryu' | 'hakuba47' | 'tsugaike' | 'oide' | 'aokiko';
export type ModuleCategory = 'cafe' | 'gear' | 'craft' | 'living';
export type SeasonTag = 'winter' | 'green' | 'both';

export interface PersonalityDef {
  id: PersonalityId;
  name: string;
  subtitle: string;
  backstory: string;
  perkTitle: string;
  perkDesc: string;
  bonusCategory: ModuleCategory;
  startingItem: string;
  icon: string;
}

export interface VanModuleDef {
  id: string;
  name: string;
  category: ModuleCategory;
  seasonTag: SeasonTag;
  width: number; // grid cells (1 or 2)
  height: number; // grid cells (1)
  cost: number;
  baseRevenue: number;
  cozyBonus: number; // stamina/vibe boost
  icon: string;
  color: string;
  purposeLabel: string;
  description: string;
}

export interface PlacedVanModule {
  instanceId: string;
  moduleId: string;
  gridX: number;
  gridY: number;
}

export interface InteractiveZone {
  id: string;
  label: string;
  sublabel: string;
  type: 'steward' | 'hearth' | 'forage' | 'puzzle' | 'parking' | 'pivot' | 'portal';
  x: number;
  y: number;
  seasonTag: SeasonTag;
  icon: string;
  targetRegion?: RegionId;
  itemReward?: string;
  requiresGreenPivot?: boolean;
}

export interface RegionDef {
  id: RegionId;
  number: number;
  name: string;
  japaneseName: string;
  tagline: string;
  stewardName: string;
  stewardTitle: string;
  stewardPortraitColor: string;
  unlockedInPhase1: boolean;
  defaultUnlocked: boolean;
  winterTrafficBase: number;
  greenTrafficBase: number;
  greenTrafficPivoted: number;
  questTitle: string;
  questDescription: string;
  fetchItemName: string;
  fetchItemRequired: number;
  puzzleType: 'pipes' | 'stove' | 'routes';
  puzzleTitle: string;
  greenPivotTitle: string;
  greenPivotCost: number;
  greenPivotDesc: string;
  zones: InteractiveZone[];
}

export interface RegionProgress {
  unlocked: boolean;
  fetchCollected: number;
  puzzleSolved: boolean;
  stewardHelped: boolean; // Wakes up the region (0 -> 100% color wake!)
  greenPivotBuilt: boolean; // Keeps region thriving in Green Season!
  vitalityWinter: number; // 0 - 100
  vitalityGreen: number; // 0 - 100
}

export interface GameState {
  started: boolean;
  playerName: string;
  gender: Gender;
  personality: PersonalityId;
  day: number; // 1..6 per season cycle
  dayInCycle: number; // 1..6 (Day 6 is Shoulder Transition Prep Day)
  season: Season;
  isPrepDay: boolean;
  yen: number;
  stamina: number;
  maxStamina: number;
  cozyRating: number;
  reputation: number;
  currentRegion: RegionId;
  vanParkedAndOpen: boolean;
  vanTier: 1 | 2;
  gridCols: number;
  gridRows: number;
  ownedModules: string[];
  placedModules: PlacedVanModule[];
  inventory: Record<string, number>;
  regions: Record<RegionId, RegionProgress>;
  customersServedTotal: number;
  customersServedToday: number;
  log: string[];
}
