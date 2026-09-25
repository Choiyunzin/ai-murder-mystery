import Phaser from 'phaser';
import { GAME_WIDTH, CANVAS_HEIGHT } from './config/gameConfig.js';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import LobbyScene from './scenes/LobbyScene.js';
import MorningClassScene from './scenes/MorningClassScene.js';
import AfternoonClassScene from './scenes/AfternoonClassScene.js';
import PMSOfficeScene from './scenes/PMSOfficeScene.js';
import VendorRoomScene from './scenes/VendorRoomScene.js';
import LoungeScene from './scenes/LoungeScene.js';
import ExecutiveOfficeScene from './scenes/ExecutiveOfficeScene.js';
import DeductionScene from './scenes/DeductionScene.js';
import EndingScene from './scenes/EndingScene.js';
import { ui } from './ui/UIRoot.js';
import { SaveSystem } from './systems/SaveSystem.js';
import { isTouchDevice, mountTouchControls } from './ui/TouchControls.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: CANVAS_HEIGHT,
  backgroundColor: '#111318',
  pixelArt: false,
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [
    BootScene,
    MenuScene,
    LobbyScene,
    MorningClassScene,
    AfternoonClassScene,
    PMSOfficeScene,
    VendorRoomScene,
    LoungeScene,
    ExecutiveOfficeScene,
    DeductionScene,
    EndingScene
  ]
});

ui.mount(game);
SaveSystem.enableAutosave();

if (isTouchDevice()) {
  mountTouchControls({
    onAction: () => ui.action(),
    onNotebook: () => !ui.isOpen() && ui.hotkeys.i?.()
  });
} else {
  ui.el.classList.add('no-touch');
}

if (import.meta.env.DEV) window.game = game;
