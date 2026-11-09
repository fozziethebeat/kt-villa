import Phaser from 'phaser';
import { OverworldScene } from './scenes/OverworldScene';
import { UIController } from './ui/uiController';
import { store } from './state/store';
import { RegionId } from './state/types';

const overworldScene = new OverworldScene();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  parent: 'phaser-container',
  width: 1080,
  height: 560,
  backgroundColor: '#1e293b',
  scene: [overworldScene],
  render: {
    antialias: true,
    pixelArt: false,
  },
};

const game = new Phaser.Game(config);

let uiController: UIController;
game.events.once('ready', () => {
  uiController = new UIController(overworldScene);
});

// Deterministic Debug & Playtest Harness
declare global {
  interface Window {
    hakubaDebug: {
      getState: typeof store.getState;
      store: typeof store;
      travelTo: (id: RegionId) => ReturnType<typeof store.travelToRegion>;
      wakeCurrentRegion: () => void;
      advanceDays: (count: number) => void;
      openVanModal: () => void;
      openAtlasModal: () => void;
      openStewardModal: () => void;
    };
  }
}

window.hakubaDebug = {
  getState: () => store.getState(),
  store,
  travelTo: (id: RegionId) => store.travelToRegion(id),
  wakeCurrentRegion: () => {
    const st = store.getState();
    store.collectForageItem(st.currentRegion, 'Cedar Branch');
    store.collectForageItem(st.currentRegion, 'Birch Bark');
    store.collectForageItem(st.currentRegion, 'Route Plaque');
    store.getState().regions[st.currentRegion].fetchCollected = 3;
    store.completeRegionPuzzle(st.currentRegion);
  },
  advanceDays: (count: number) => {
    for (let i = 0; i < count; i++) {
      store.advanceDay();
    }
  },
  openVanModal: () => {
    uiController?.renderVanInteriorModal();
    const dlg = document.getElementById('dialog-van-interior') as HTMLDialogElement | null;
    if (dlg && !dlg.open) dlg.showModal();
  },
  openAtlasModal: () => {
    uiController?.renderValleyAtlasModal();
    const dlg = document.getElementById('dialog-valley-atlas') as HTMLDialogElement | null;
    if (dlg && !dlg.open) dlg.showModal();
  },
  openStewardModal: () => {
    uiController?.renderStewardModal();
    const dlg = document.getElementById('dialog-steward') as HTMLDialogElement | null;
    if (dlg && !dlg.open) dlg.showModal();
  },
};
