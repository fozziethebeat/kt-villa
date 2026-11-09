import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { StationScene } from './scenes/StationScene';
import { HudScene } from './scenes/HudScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { VanInteriorScene } from './scenes/VanInteriorScene';
import { MapCraftScene } from './scenes/MapCraftScene';
import { LuggageScene } from './scenes/LuggageScene';
import { BusinessScene } from './scenes/BusinessScene';
import { BoardScene } from './scenes/BoardScene';
import { SnowPeakScene } from './scenes/SnowPeakScene';
import { TentScene } from './scenes/TentScene';
import { ArchetypeScene } from './scenes/ArchetypeScene';
import { BuildScene } from './scenes/BuildScene';
import { GarageScene } from './scenes/GarageScene';
import { TravelScene } from './scenes/TravelScene';
import { DataRegionScene } from './scenes/DataRegionScene';
import { FlowScene } from './scenes/FlowScene';
import { SeatingScene } from './scenes/SeatingScene';
import { CairnScene } from './scenes/CairnScene';
import { CookScene } from './scenes/CookScene';
import { ArrangeScene } from './scenes/ArrangeScene';
import { SeasonReportScene } from './scenes/SeasonReportScene';
import { CONTENT } from './sim/content';
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
    // Order = draw order: overlays come after the HUD so they cover it.
    scene: [BootScene, TitleScene, CharacterSelectScene, StationScene, SnowPeakScene, ...Object.keys(CONTENT.layouts).map((id) => new DataRegionScene(id)), HudScene, VanInteriorScene, MapCraftScene, LuggageScene, BusinessScene, BoardScene, TentScene, ArchetypeScene, BuildScene, GarageScene, TravelScene, FlowScene, SeatingScene, CairnScene, CookScene, ArrangeScene, SeasonReportScene],
  });
  installDebugApi(game);
}

start();
