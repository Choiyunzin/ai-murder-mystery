import Phaser from 'phaser';
import { FADE_MS } from '../config/gameConfig.js';
import { ui } from '../ui/UIRoot.js';
import { openMenu } from '../ui/MenuPanel.js';
import gameState from '../systems/GameState.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { audio } from '../systems/AudioSystem.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    ui.closeAll();
    ui.setHotkey('i', null);
    ui.setActionHandler(null);
    this.cameras.main.setBackgroundColor('#0d0e12');
    this.cameras.main.fadeIn(FADE_MS);
    audio.setMode('menu');

    const start = () => {
      audio.unlock();
      audio.sfx('door');
      this.cameras.main.fadeOut(FADE_MS);
      this.time.delayedCall(FADE_MS, () => this.scene.start('LobbyScene'));
    };
    openMenu({
      canContinue: SaveSystem.hasSave(),
      onNew: () => {
        SaveSystem.clear();
        gameState.reset();
        start();
      },
      onContinue: () => {
        SaveSystem.load();
        start();
      }
    });
  }
}
