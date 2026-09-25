import Phaser from 'phaser';
import { FONT_FAMILY } from '../config/gameConfig.js';
import gameState from '../systems/GameState.js';
import { getTopics } from '../systems/DialogueSystem.js';

/**
 * NPC: 인물 스프라이트 + 이름표 + 상태 말풍선(… 첫 대화 전 / ! 제시할 증거가 있음).
 * 클릭하면 거리와 무관하게 역할 배지를 띄운다(대화와는 별개, 질문 포인트 소모 없음).
 */
export default class NPC extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, character, { onClick } = {}) {
    super(scene, x, y, `npc_${character.id}_0`);
    this.character = character;

    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setOrigin(0.5, 0.6);
    this.body.setCircle(11, 5, 27);
    this.body.updateFromGameObject();
    this.setDepth(y + 20);

    this.nameTag = scene.add
      .text(x, y - 34, character.name, {
        fontFamily: FONT_FAMILY,
        fontSize: '13px',
        color: '#ffffff',
        backgroundColor: '#000000aa',
        padding: { x: 5, y: 1 }
      })
      .setOrigin(0.5, 1)
      .setDepth(900);

    this.marker = scene.add
      .text(x + 18, y - 40, '', { fontFamily: FONT_FAMILY, fontSize: '14px', fontStyle: 'bold', color: '#17140c', backgroundColor: '#f1ead8', padding: { x: 5, y: 0 } })
      .setOrigin(0.5, 1)
      .setDepth(901);
    scene.tweens.add({ targets: this.marker, y: this.marker.y - 4, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    // 숨쉬기 idle
    scene.tweens.add({ targets: this, scaleY: 1.03, duration: 1100 + Math.random() * 300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    this.setInteractive({ useHandCursor: true, pixelPerfect: false });
    this.on('pointerdown', (pointer, lx, ly, event) => {
      event?.stopPropagation();
      onClick?.(this);
    });

    this.refreshMarker();
    const off = gameState.on(() => this.refreshMarker());
    scene.events.once('shutdown', off);
  }

  refreshMarker() {
    const id = this.character.id;
    const state = gameState.npc(id);
    const canPresent = getTopics(id).some((t) => t.cost === 0 && t.status === 'available');
    const text = canPresent ? '!' : !state.greeted ? '…' : '';
    this.marker.setText(text).setVisible(!!text);
    this.marker.setBackgroundColor(canPresent ? '#d9b45a' : '#f1ead8');
  }
}
