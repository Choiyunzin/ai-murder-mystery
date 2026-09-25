import Phaser from 'phaser';
import { FADE_MS } from '../config/gameConfig.js';
import { ui } from '../ui/UIRoot.js';
import { openEnding } from '../ui/EndingPanel.js';
import gameState from '../systems/GameState.js';
import { SaveSystem } from '../systems/SaveSystem.js';

export default class EndingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EndingScene' });
  }

  create() {
    ui.closeAll();
    ui.setHotkey('i', null);
    this.cameras.main.setBackgroundColor('#0d0e12');
    this.cameras.main.fadeIn(FADE_MS);
    gameState.currentScene = 'EndingScene';

    openEnding({
      onRestart: () => {
        SaveSystem.clear();
        gameState.reset();
        this.cameras.main.fadeOut(FADE_MS);
        this.time.delayedCall(FADE_MS, () => this.scene.start('LobbyScene'));
      }
    });
  }
}
