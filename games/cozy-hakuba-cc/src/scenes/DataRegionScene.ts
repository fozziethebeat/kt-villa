import Phaser from 'phaser';
import { store } from '../gameStore';
import { CONTENT } from '../sim/content';
import { addUnlock, grant, spendAction } from '../sim/game';
import { currentStep } from '../sim/quests';
import type { GameState, RegionLayoutDef } from '../sim/types';
import { art } from '../ui/art';
import { openOverlay } from '../ui/widgets';
import { RegionScene, type RegionLayout } from './RegionScene';

/**
 * A region built entirely from content/layouts.json (M3+): landmarks, a fetch step with scattered items,
 * and "stations" that open a mini-game overlay for a quest step. New regions need data + art, not code.
 */
export class DataRegionScene extends RegionScene {
  protected layout: RegionLayout;
  private def: RegionLayoutDef;
  private items: Phaser.GameObjects.Image[] = [];
  private stationImgs: { img: Phaser.GameObjects.Image | null; steps: string[] }[] = [];
  private festive!: Phaser.GameObjects.Image | null;
  private boardImg: Phaser.GameObjects.Image | null = null;

  constructor(private regionId: string) {
    const def = CONTENT.layouts[regionId];
    super(def.sceneKey);
    this.def = def;
    this.layout = {
      region: regionId, keyPerson: def.keyPerson, van: def.van, vanTexture: def.vanTexture, vanPrompt: def.vanPrompt,
      playerStart: def.playerStart, kodama: def.kodama, trees: def.trees, crowdLanes: def.crowdLanes, crowd: def.crowd,
    };
  }

  protected build() {
    const d = this.def;
    this.items = []; this.stationImgs = [];
    for (const lm of d.landmarks) {
      const img = art(this, lm.at[0], lm.at[1], lm.texture).setDepth(lm.depth ?? lm.at[1]).setFlipX(!!lm.flip);
      if (lm.tint) img.setTint(parseInt(lm.tint.slice(1), 16));
      this.scenery(img);
    }
    this.festive = d.festive ? art(this, d.festive.at[0], d.festive.at[1], 'deco_lanterns', 0.5, 0).setScale(0.62).setDepth(530).setVisible(false) : null;
    const s = () => store.state;
    const step = () => currentStep(s(), this.regionId)?.id;

    if (d.board) {
      this.boardImg = art(this, d.board[0], d.board[1], 'deco_board').setScale(0.55).setDepth(d.board[1]);
      this.interactables.push({ id: 'board', x: d.board[0], y: d.board[1], visible: () => s().regions[this.regionId].vitality >= 3, prompt: () => 'E  Valley Revival Board', act: () => openOverlay(this, 'Board'), promptLift: 100 });
    }

    for (const st of d.stations) {
      const img = st.texture ? art(this, st.at[0], st.at[1], st.texture).setDepth(st.at[1]) : null;
      this.stationImgs.push({ img, steps: st.steps });
      const costLabel = st.cost === 'craft' || st.cost === 'miniGame' ? '  (1 stamina)' : '';
      this.interactables.push({
        id: `station_${st.steps.join('_')}`, x: st.at[0], y: st.at[1] + 10, visible: () => st.steps.includes(step() ?? '') && !this.stepItemReady(),
        prompt: () => `E  ${st.prompt}${costLabel}`, act: () => this.useStation(st), promptLift: 120,
      });
    }

    const f = d.fetch;
    f.spots.forEach(([x, y], i) => {
      const it = art(this, x, y, f.texture).setDepth(y);
      this.tweens.add({ targets: it, y: y - 6, duration: 900 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.items.push(it);
      this.interactables.push({
        id: `fetch_${i}`, x, y, visible: () => this.itemAvailable(i),
        prompt: () => `E  Pick up ${f.label.toLowerCase()}${f.cost ? '  (1 stamina)' : ''}`, act: () => this.pickItem(i),
      });
    });
  }

  /** The current step's quest item is already made (talk to the key person to turn it in). */
  private stepItemReady(): boolean {
    const st = currentStep(store.state, this.regionId);
    return !!st && Object.entries(st.needs).every(([k, n]) => (store.state.inventory[k] ?? 0) >= n);
  }

  private itemAvailable(i: number): boolean {
    const st = store.state;
    return currentStep(st, this.regionId)?.id === this.def.fetch.step && !st.unlocks.includes(`fetch:${this.regionId}:${i}`);
  }

  private pickItem(i: number) {
    const f = this.def.fetch;
    let ok = true;
    store.update('pickup', (s) => {
      if (f.cost) ok = spendAction(s, f.cost).ok;
      if (ok) { addUnlock(s, `fetch:${this.regionId}:${i}`); grant(s, f.item, 1); }
    });
    if (!ok) { this.openDialog(store.state.player.name, "I'm too tired to carry anything else today. Time to rest."); return; }
    const it = this.items[i];
    this.tweens.killTweensOf(it);
    this.tweens.add({ targets: it, y: it.y - 40, alpha: 0, duration: 280, onComplete: () => it.setVisible(false) });
    const need = currentStep(store.state, this.regionId)?.needs[f.item] ?? f.spots.length;
    this.toast(`${f.label} ${Math.min(store.state.inventory[f.item] ?? 0, need)}/${need}`);
  }

  private useStation(st: RegionLayoutDef['stations'][number]) {
    const step = currentStep(store.state, this.regionId)!;
    let ok = false;
    store.update('minigame', (s) => { ok = spendAction(s, st.cost).ok; });
    if (!ok) { this.openDialog(store.state.player.name, "I'm too tired for that today. Time to rest."); return; }
    const item = Object.keys(step.needs)[0];
    openOverlay(this, st.overlay, { stepId: step.id, item, config: st.config, title: st.prompt });
  }

  protected onSync(s: GameState, reason: string) {
    const r = s.regions[this.regionId];
    this.festive?.setVisible(r.vitality >= 3);
    this.boardImg?.setVisible(r.vitality >= 3);
    const step = currentStep(s, this.regionId)?.id ?? '';
    for (const st of this.stationImgs) st.img?.setAlpha(st.steps.includes(step) ? 1 : 0.55);
    this.items.forEach((it, i) => {
      if (!this.itemAvailable(i)) it.setVisible(false);
      else if (reason === 'debug' || reason === 'init' || reason === 'load') it.setVisible(true).setAlpha(1).setY(this.def.fetch.spots[i][1]);
    });
  }
}
