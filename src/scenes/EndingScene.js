import Phaser from 'phaser';
import { FADE_MS } from '../config/gameConfig.js';
import { ui } from '../ui/UIRoot.js';
import { openEnding } from '../ui/EndingPanel.js';
import gameState from '../systems/GameState.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { audio } from '../systems/AudioSystem.js';
import { openCutscene } from '../ui/CutscenePlayer.js';

export default class EndingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EndingScene' });
  }

  create() {
    ui.closeAll();
    ui.setHotkey('i', null);
    ui.setActionHandler(null);
    audio.setMode(gameState.deduction.outcome === 'solved' ? 'solved' : 'unsolved');
    this.cameras.main.setBackgroundColor('#0d0e12');
    this.cameras.main.fadeIn(FADE_MS);
    gameState.currentScene = 'EndingScene';

    const report = () =>
      openEnding({
        onRestart: () => {
          SaveSystem.clear();
          gameState.reset();
          this.cameras.main.fadeOut(FADE_MS);
          this.time.delayedCall(FADE_MS, () => this.scene.start('MenuScene'));
        }
      });
    // 사건을 해결하면 리포트 전에 '사건 재구성' 영상을 먼저 보여 준다
    if (gameState.deduction.outcome === 'solved') openCutscene({ onDone: report });
    else report();
  }
}
