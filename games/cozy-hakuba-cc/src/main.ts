import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { StationScene } from './scenes/StationScene';
import { HudScene } from './scenes/HudScene';
import { installDebugApi } from './debug/api';
import { HEIGHT, WIDTH } from './theme';

async function start() {
  // Make sure the UI font is ready before Phaser rasterizes any text.
  try {
    await Promise.race([
      Promise.all([document.fonts.load('700 20px "Zen Maru Gothic"'), document.fonts.load('500 20px "Zen Maru Gothic"')]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch { /* fall back to system font */ }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: '#f4ecdc',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, preserveDrawingBuffer: true },
    scene: [BootScene, TitleScene, StationScene, HudScene],
  });
  installDebugApi(game);
}

start();
