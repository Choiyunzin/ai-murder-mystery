import Phaser from 'phaser';
import { GAME_WIDTH, CANVAS_HEIGHT, FONT_FAMILY } from '../config/gameConfig.js';

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

    this.time.delayedCall(800, () => {
      this.cameras.main.fadeOut(250);
      this.time.delayedCall(250, () => this.scene.start('LobbyScene'));
    });
  }

  createPlaceholderTextures() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // 플레이어: 청록색 원 + 진행 방향 표시(오른쪽을 향함, 회전으로 방향 표현)
    g.fillStyle(0x3fd1c1, 1).fillCircle(16, 16, 14);
    g.lineStyle(2, 0x0b3d38, 1).strokeCircle(16, 16, 14);
    g.fillStyle(0x0b3d38, 1).fillTriangle(22, 11, 22, 21, 30, 16);
    g.generateTexture('player', 32, 32);
    g.clear();

    // NPC: 흰색 원(캐릭터 색으로 tint)
    g.fillStyle(0xffffff, 1).fillCircle(16, 16, 16);
    g.lineStyle(2, 0x000000, 0.5).strokeCircle(16, 16, 15);
    g.generateTexture('npc', 32, 32);
    g.destroy();
  }
}
