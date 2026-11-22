import Phaser from 'phaser';
import { audio } from '../audio';
import { store } from '../gameStore';
import { describeSave, listSlots, loadGame, loadSlot, saveGame, saveToSlot } from '../persist';
import type { GameState } from '../sim/types';
import { label, paperGrain, paperPanel } from '../ui/art';
import { button, closeOverlay } from '../ui/widgets';
import { PAL, WIDTH, hex } from '../theme';
import { goToRegion, switchTo } from './regions';

type Tab = 'main' | 'save' | 'load' | 'settings';

/** Pause menu: resume, manual save slots, load, sound settings, controls, back to title. */
export class PauseScene extends Phaser.Scene {
  private tab: Tab = 'main';
  private msg = '';
  /** Opened from the title screen: only the load list, and Back closes the menu. */
  private fromTitle = false;
  constructor() { super('Pause'); }

  init(data: { tab?: Tab; fromTitle?: boolean }) { this.tab = data?.tab ?? 'main'; this.fromTitle = !!data?.fromTitle; this.msg = ''; }

  create() {
    this.input.keyboard!.on('keydown-ESC', () => (this.tab === 'main' || this.fromTitle ? closeOverlay(this) : this.show('main')));
    this.draw();
  }

  private show(tab: Tab) { this.tab = tab; this.draw(); }

  private draw() {
    this.children.removeAll(true);
    this.add.rectangle(0, 0, WIDTH, 720, hex(PAL.ink), 0.45).setOrigin(0);
    paperPanel(this, 340, 80, 600, 560, PAL.paper);
    const title = { main: 'Paused', save: 'Save to a slot', load: 'Load a save', settings: 'Settings' }[this.tab];
    label(this, 640, 100, title, 32, PAL.ink, '900').setOrigin(0.5, 0);
    if (!this.fromTitle) label(this, 640, 146, describeSave(store.state), 16, PAL.twilight, '500').setOrigin(0.5, 0);
    if (this.tab === 'main') this.main();
    if (this.tab === 'save') this.slots('save');
    if (this.tab === 'load') this.slots('load');
    if (this.tab === 'settings') this.settings();
    label(this, 640, 596, this.msg, 16, PAL.cedar, '700').setOrigin(0.5, 0);
    paperGrain(this);
  }

  private main() {
    const items: [string, () => void][] = [
      ['Resume', () => closeOverlay(this)],
      ['Save game', () => this.show('save')],
      ['Load game', () => this.show('load')],
      ['Settings & controls', () => this.show('settings')],
      ['Save & quit to title', () => { saveGame(store.state); switchTo(this.game, 'Title'); }],
    ];
    items.forEach(([t, fn], i) => button(this, 640, 210 + i * 72, 380, 56, t, fn, i === 0 ? PAL.lantern : PAL.snow, 20));
  }

  private slots(mode: 'save' | 'load') {
    const slots = listSlots();
    const rows: { title: string; sub: string; enabled: boolean; act: () => void }[] = [];
    if (mode === 'load') {
      const auto = loadGame();
      rows.push({ title: 'Autosave', sub: auto ? describeSave(auto) : 'None yet (the game saves when you sleep)', enabled: !!auto, act: () => auto && this.loadState(auto) });
    }
    for (const sl of slots) {
      rows.push({
        title: `Slot ${sl.slot}`,
        sub: sl.empty ? 'Empty' : `${sl.label}${sl.savedAt ? ` · ${new Date(sl.savedAt).toLocaleString()}` : ''}`,
        enabled: mode === 'save' || !sl.empty,
        act: () => {
          if (mode === 'save') { this.msg = saveToSlot(sl.slot, store.state) ? `Saved to slot ${sl.slot}.` : 'Saving failed (storage blocked?).'; this.draw(); }
          else { const st = loadSlot(sl.slot); if (st) this.loadState(st); }
        },
      });
    }
    rows.forEach((r, i) => {
      const y = 200 + i * 84;
      const b = button(this, 640, y + 22, 520, 70, '', r.act, r.enabled ? PAL.snow : PAL.paper, 16);
      b.container.add([
        label(this, -240, -26, r.title, 19, PAL.ink, '900'),
        label(this, -240, 2, r.sub, 14, PAL.twilight, '500').setWordWrapWidth(480),
      ]);
      b.setEnabled(r.enabled);
    });
    button(this, 640, 570, 200, 44, 'Back', () => (this.fromTitle ? closeOverlay(this) : this.show('main')), PAL.paper, 16);
  }

  private loadState(st: GameState) {
    store.replace(st, 'load');
    goToRegion(this.game, st.currentRegion);
  }

  private settings() {
    const a = audio.settings;
    label(this, 400, 196, `Volume  ${Math.round(a.volume * 100)}%`, 20, PAL.ink, '900');
    button(this, 700, 210, 70, 44, '−', () => { audio.setVolume(a.volume - 0.1); this.draw(); }, PAL.snow, 22);
    button(this, 790, 210, 70, 44, '+', () => { audio.setVolume(a.volume + 0.1); this.draw(); }, PAL.snow, 22);
    label(this, 400, 246, `Music  ${Math.round(a.music * 100)}%`, 18, PAL.ink, '900');
    button(this, 700, 258, 70, 36, '−', () => { audio.setMusic(a.music - 0.1); this.draw(); }, PAL.snow, 20);
    button(this, 790, 258, 70, 36, '+', () => { audio.setMusic(a.music + 0.1); this.draw(); }, PAL.snow, 20);
    button(this, 640, 312, 380, 46, a.muted ? 'Sound: off  (M)' : 'Sound: on  (M)', () => { audio.toggleMute(); this.draw(); }, PAL.snow, 18);
    button(this, 640, 368, 380, 46, a.ambience ? 'Ambience: on' : 'Ambience: off', () => { audio.setAmbienceOn(!a.ambience); this.draw(); }, PAL.snow, 18);
    label(this, 400, 404, [
      'Controls',
      'WASD / arrows  walk     E / Space  interact',
      'Esc  pause / close     M  mute',
      'Mini-games: mouse; R or right-click rotates pieces',
    ].join('\n'), 16, PAL.ink, '500').setLineSpacing(8);
    button(this, 640, 570, 200, 44, 'Back', () => this.show('main'), PAL.paper, 16);
  }
}
