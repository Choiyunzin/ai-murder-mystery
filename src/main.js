import Phaser from 'phaser';
import { GAME_WIDTH, CANVAS_HEIGHT } from './config/gameConfig.js';
import BootScene from './scenes/BootScene.js';
import LobbyScene from './scenes/LobbyScene.js';
import MorningClassScene from './scenes/MorningClassScene.js';
import AfternoonClassScene from './scenes/AfternoonClassScene.js';
import PMSOfficeScene from './scenes/PMSOfficeScene.js';
import VendorRoomScene from './scenes/VendorRoomScene.js';
import LoungeScene from './scenes/LoungeScene.js';
import ExecutiveOfficeScene from './scenes/ExecutiveOfficeScene.js';
import { ui } from './ui/UIRoot.js';

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
    LobbyScene,
    MorningClassScene,
    AfternoonClassScene,
    PMSOfficeScene,
    VendorRoomScene,
    LoungeScene,
    ExecutiveOfficeScene
  ]
});

ui.mount(game);

if (import.meta.env.DEV) window.game = game;
