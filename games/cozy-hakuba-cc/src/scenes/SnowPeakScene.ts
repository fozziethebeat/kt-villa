import type Phaser from 'phaser';
import { store } from '../gameStore';
import { addUnlock, grant, spendAction } from '../sim/game';
import { currentStep } from '../sim/quests';
import type { GameState } from '../sim/types';
import { art } from '../ui/art';
import { openOverlay } from '../ui/widgets';
import { RegionScene, type RegionLayout } from './RegionScene';

export const SP = {
  takumi: [630, 590], van: [1130, 670], tent: [120, 610], workbench: [790, 548], garage: [935, 540],
  parts: [[440, 690], [540, 630], [800, 690], [1000, 620]] as [number, number][],
  kodama: [[60, 520], [690, 494], [1244, 540]] as [number, number][],
} as const;

/**
 * Region 2: Snow Peak Land Station (campfield + gear shop). Key person Takumi.
 * Arc: pitch the demo tent (balance puzzle) → salvage van parts (fetch) → choose your trade and build its
 * first module (trace craft). Thriving opens Takumi's garage (chassis + roof modules).
 */
export class SnowPeakScene extends RegionScene {
  protected layout: RegionLayout = {
    region: 'snowpeak',
    keyPerson: { name: 'Takumi', texture: 'char_takumi', at: SP.takumi },
    van: SP.van,
    playerStart: [990, 660],
    kodama: SP.kodama.map((k) => [...k] as [number, number]),
    trees: [[36, 498, 1.1], [640, 482, 0.75], [1190, 492, 1.0], [1262, 512, 1.2], [20, 704, 1.0]],
    crowdLanes: [[420, 640, 700], [660, 900, 520], [300, 700, 590], [700, 960, 660], [480, 820, 610]],
    crowd: { snowy: ['char_skier', 'char_local', 'char_skier', 'char_tourist', 'char_local'], green: ['char_hiker', 'char_hiker', 'char_local', 'char_tourist', 'char_hiker'] },
  };
  private parts: Phaser.GameObjects.Image[] = [];
  private tentFlat!: Phaser.GameObjects.Image;
  private tentUp!: Phaser.GameObjects.Image;
  private bench!: Phaser.GameObjects.Image;
  private lanterns!: Phaser.GameObjects.Image;

  constructor() { super('SnowPeak'); }

  protected build() {
    this.parts = [];
    this.scenery(art(this, 400, 506, 'bldg_snowpeak').setDepth(506));
    this.scenery(art(this, 900, 506, 'bldg_garage').setDepth(506));
    this.lanterns = art(this, 400, 330, 'deco_lanterns', 0.5, 0).setScale(0.62).setDepth(530).setVisible(false);
    this.bench = art(this, SP.workbench[0], SP.workbench[1], 'deco_workbench_out').setDepth(SP.workbench[1]);
    this.tentFlat = art(this, SP.tent[0], SP.tent[1], 'tent_flat').setDepth(SP.tent[1]);
    this.tentUp = art(this, SP.tent[0], SP.tent[1], 'tent_pitched').setScale(0.55).setDepth(SP.tent[1]).setVisible(false);

    SP.parts.forEach(([x, y], i) => {
      const p = art(this, x, y, 'item_van_part').setDepth(y);
      this.tweens.add({ targets: p, angle: { from: -4, to: 4 }, duration: 700 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.parts.push(p);
    });

    const s = () => store.state;
    const step = () => currentStep(s(), 'snowpeak')?.id;
    this.interactables.push({
      id: 'tent', x: SP.tent[0] + 40, y: SP.tent[1], visible: () => step() === 'tent',
      prompt: () => 'E  Pitch the demo tent  (1 stamina)', act: () => this.pitchTent(), promptLift: 100,
    });
    SP.parts.forEach(([x, y], i) => this.interactables.push({
      id: `part_${i}`, x, y, visible: () => this.partAvailable(i), prompt: () => 'E  Dig out a van part  (1 stamina)', act: () => this.digPart(i),
    }));
    this.interactables.push({
      id: 'workbench', x: SP.workbench[0], y: SP.workbench[1] + 10, visible: () => step() === 'first_module' && !(s().inventory.built_module > 0),
      prompt: () => (s().primaryArchetype ? 'E  Build your first module  (1 stamina)' : 'E  Choose your trade'), act: () => this.useWorkbench(), promptLift: 110,
    });
    this.interactables.push({
      id: 'garage', x: SP.garage[0], y: SP.garage[1] + 20, visible: () => s().unlocks.includes('garage'),
      prompt: () => "E  Takumi's garage", act: () => openOverlay(this, 'Garage'), promptLift: 140,
    });
  }

  private partAvailable(i: number): boolean {
    const st = store.state;
    return currentStep(st, 'snowpeak')?.id === 'parts' && !st.unlocks.includes(`part:${i}`);
  }

  private tired(what: string) {
    this.openDialog(store.state.player.name, `I'm too tired to ${what} today. Time to sleep in the van.`);
  }

  private pitchTent() {
    let ok = false;
    store.update('minigame', (s) => { ok = spendAction(s, 'miniGame').ok; });
    if (!ok) return this.tired('wrestle a tent');
    openOverlay(this, 'Tent');
  }

  private digPart(i: number) {
    let ok = false;
    store.update('pickup', (s) => { ok = spendAction(s, 'forage').ok; if (ok) { addUnlock(s, `part:${i}`); grant(s, 'van_part', 1); } });
    if (!ok) return this.tired('dig');
    const p = this.parts[i];
    this.tweens.killTweensOf(p);
    this.tweens.add({ targets: p, y: p.y - 40, alpha: 0, duration: 300, onComplete: () => p.setVisible(false) });
    this.toast(`Van part ${store.state.inventory.van_part ?? 0}/4`);
  }

  private useWorkbench() {
    if (!store.state.primaryArchetype) {
      // Chosen a trade? Go straight to the build.
      openOverlay(this, 'Archetype', {}, () => { if (store.state.primaryArchetype) this.time.delayedCall(60, () => this.useWorkbench()); });
      return;
    }
    let ok = false;
    store.update('craft', (s) => { ok = spendAction(s, 'craft').ok; });
    if (!ok) return this.tired('build');
    openOverlay(this, 'Build');
  }

  protected onSync(s: GameState) {
    const r = s.regions.snowpeak;
    const pitched = r.questStep >= 1 || (s.inventory.tent_pitched ?? 0) > 0;
    this.tentFlat.setVisible(!pitched);
    this.tentUp.setVisible(pitched);
    this.lanterns.setVisible(r.vitality >= 3);
    this.bench.setAlpha(1);
    this.parts.forEach((p, i) => { if (!this.partAvailable(i)) p.setVisible(false); else if (!p.visible) p.setVisible(true).setAlpha(1).setY(SP.parts[i][1]); });
  }
}
