import type Phaser from 'phaser';
import { store } from '../gameStore';
import { addUnlock, grant, spendAction } from '../sim/game';
import { currentStep } from '../sim/quests';
import type { GameState } from '../sim/types';
import { art } from '../ui/art';
import { openOverlay } from '../ui/widgets';
import { RegionScene, type RegionLayout } from './RegionScene';

export const BROCHURE_SPOTS: [number, number][] = [[150, 560], [380, 660], [700, 690], [880, 630], [1180, 560]];
export const KODAMA_SPOTS: [number, number][] = [[92, 512], [846, 500], [1196, 690]];
export const SPOTS = { kobayashi: [610, 545], van: [1010, 640], luggageDoor: [372, 528], board: [250, 560] } as const;

/**
 * Region 1: JR Hakuba Station. Arc: brochures (fetch) → valley map (create, at the van workbench)
 * → lost-luggage room (grid-packing puzzle). Thriving opens the Valley Revival Board.
 */
export class StationScene extends RegionScene {
  protected layout: RegionLayout = {
    region: 'station',
    keyPerson: { name: 'Mrs. Kobayashi', texture: 'char_kobayashi', at: SPOTS.kobayashi },
    van: SPOTS.van,
    playerStart: [760, 640],
    kodama: KODAMA_SPOTS,
    trees: [[70, 500, 1.15], [180, 488, 0.85], [800, 494, 0.95], [1230, 505, 1.2], [40, 690, 1.1], [1250, 700, 1.0]],
    crowdLanes: [[200, 600, 520], [560, 980, 690], [660, 860, 505], [400, 640, 700], [640, 900, 580]],
    crowd: { snowy: ['char_skier', 'char_tourist', 'char_skier', 'char_local', 'char_tourist'], green: ['char_hiker', 'char_tourist', 'char_hiker', 'char_local', 'char_hiker'] },
  };
  private brochures: Phaser.GameObjects.Image[] = [];
  private door!: Phaser.GameObjects.Image;
  private board!: Phaser.GameObjects.Image;
  private lanterns!: Phaser.GameObjects.Image;

  constructor() { super('Station'); }

  protected build() {
    this.brochures = [];
    this.scenery(art(this, 470, 520, 'bldg_station').setDepth(520));
    // Lanterns hang across the station front once Thriving (kept in colour: they *are* the celebration).
    this.lanterns = art(this, 470, 300, 'deco_lanterns', 0.5, 0).setScale(0.62).setDepth(530).setVisible(false);
    this.door = art(this, SPOTS.luggageDoor[0], SPOTS.luggageDoor[1] - 2, 'deco_luggage_door').setScale(0.42).setDepth(521);
    this.board = art(this, SPOTS.board[0], SPOTS.board[1], 'deco_board').setScale(0.55).setDepth(SPOTS.board[1]);

    BROCHURE_SPOTS.forEach(([x, y], i) => {
      const b = art(this, x, y, 'item_brochure').setDepth(y);
      this.tweens.add({ targets: b, y: y - 6, duration: 900 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.brochures.push(b);
    });

    const s = () => store.state;
    this.interactables.push({
      id: 'luggage', x: SPOTS.luggageDoor[0], y: SPOTS.luggageDoor[1] + 20, visible: () => currentStep(s(), 'station')?.id === 'luggage',
      prompt: () => 'E  Sort the lost-luggage room  (1 stamina)', act: () => this.enterLuggage(), promptLift: 110,
    });
    this.interactables.push({
      id: 'board', x: SPOTS.board[0], y: SPOTS.board[1], visible: () => s().unlocks.includes('revival_board'),
      prompt: () => 'E  Valley Revival Board', act: () => openOverlay(this, 'Board'), promptLift: 100,
    });
    BROCHURE_SPOTS.forEach(([x, y], i) => this.interactables.push({
      id: `brochure_${i}`, x, y, visible: () => this.brochureAvailable(i), prompt: () => 'E  Pick up brochure', act: () => this.pickBrochure(i),
    }));
  }

  private brochureAvailable(i: number): boolean {
    const st = store.state;
    return st.regions.station.questStep === 0 && !st.unlocks.includes(`brochure:${i}`);
  }

  private pickBrochure(i: number) {
    const b = this.brochures[i];
    this.tweens.killTweensOf(b);
    this.tweens.add({ targets: b, y: b.y - 40, alpha: 0, duration: 280, onComplete: () => b.setVisible(false) });
    store.update('pickup', (s) => { addUnlock(s, `brochure:${i}`); grant(s, 'brochure', 1); });
    this.toast(`Brochure ${store.state.inventory.brochure ?? 0}/5`);
  }

  private enterLuggage() {
    let ok = false;
    store.update('minigame', (s) => { ok = spendAction(s, 'miniGame').ok; });
    if (!ok) { this.openDialog(store.state.player.name, "I'm too tired to sort luggage today. Time to sleep in the van."); return; }
    openOverlay(this, 'Luggage');
  }

  protected onSync(s: GameState) {
    const v = s.regions.station.vitality;
    this.lanterns.setVisible(v >= 3);
    const step = currentStep(s, 'station');
    this.brochures.forEach((b, i) => { if (!this.brochureAvailable(i)) b.setVisible(false); else if (!b.visible) b.setVisible(true).setAlpha(1); });
    this.door.setAlpha(step?.id === 'luggage' ? 1 : 0.0);
    this.board.setVisible(s.unlocks.includes('revival_board'));
  }
}
