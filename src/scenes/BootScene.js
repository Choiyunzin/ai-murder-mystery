import Phaser from 'phaser';
import { GAME_WIDTH, CANVAS_HEIGHT, FONT_FAMILY } from '../config/gameConfig.js';
import { makeCharacterTextures, PLAYER_LOOK } from '../gfx/Textures.js';
import characters from '../data/characters.json';

/** placeholder 텍스처를 생성하고 로비로 진입한다. */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    this.createPlaceholderTextures();

    this.add
      .text(GAME_WIDTH / 2, CANVAS_HEIGHT / 2 - 20, 'CASE 026', {
        fontFamily: FONT_FAMILY,
        fontSize: '40px',
        fontStyle: 'bold',
        color: '#f3e6c4'
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, CANVAS_HEIGHT / 2 + 28, '리더십 교육 만족도 급락 사건', {
        fontFamily: FONT_FAMILY,
        fontSize: '18px',
        color: '#bbbbbb'
      })
      .setOrigin(0.5);

    this.time.delayedCall(600, () => {
      this.cameras.main.fadeOut(250);
      this.time.delayedCall(250, () => this.scene.start('MenuScene'));
    });
  }

  createPlaceholderTextures() {
    makeCharacterTextures(this, 'player', PLAYER_LOOK);
    for (const c of Object.values(characters)) makeCharacterTextures(this, `npc_${c.id}`, { ...c.look, outfit: c.color });
  }
}
