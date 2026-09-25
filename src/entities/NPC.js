import Phaser from 'phaser';
import { FONT_FAMILY } from '../config/gameConfig.js';

/**
 * Phase 1 NPC: placeholder 원형 + 이름표.
 * 클릭하면 거리와 무관하게 역할 배지를 띄운다(대화와는 별개, 질문 포인트 소모 없음).
 */
export default class NPC extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, character, { onClick } = {}) {
    super(scene, x, y, 'npc');
    this.character = character;

    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.body.setCircle(16, 0, 0);
    this.setTint(Phaser.Display.Color.HexStringToColor(character.color).color);
    this.setDepth(9);

    this.nameTag = scene.add
      .text(x, y - 30, character.name, {
        fontFamily: FONT_FAMILY,
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#00000088',
        padding: { x: 4, y: 1 }
      })
      .setOrigin(0.5, 1)
      .setDepth(9);

    this.setInteractive({ useHandCursor: true });
    this.on('pointerdown', (pointer, lx, ly, event) => {
      event?.stopPropagation();
      onClick?.(this);
    });
  }
}
