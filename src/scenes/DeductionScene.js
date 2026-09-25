import Phaser from 'phaser';
import { FADE_MS } from '../config/gameConfig.js';
import { ui } from '../ui/UIRoot.js';
import { openDeductionBoard } from '../ui/DeductionBoard.js';
import gameState from '../systems/GameState.js';

export default class DeductionScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DeductionScene' });
  }

  create() {
    ui.closeAll();
    ui.setHotkey('i', null);
    this.cameras.main.setBackgroundColor('#0d0e12');
    this.cameras.main.fadeIn(FADE_MS);
    gameState.currentScene = 'DeductionScene';

    openDeductionBoard({
      onBack: () => this.leave('LobbyScene'),
      onResult: () => this.leave('EndingScene'),
      onFeedback: (outcome) => this.events.emit('verdict', outcome)
    });
  }

  leave(key) {
    this.cameras.main.fadeOut(FADE_MS);
    this.time.delayedCall(FADE_MS, () => this.scene.start(key));
  }
}
