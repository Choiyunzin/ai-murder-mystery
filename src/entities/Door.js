import Phaser from 'phaser';
import { FONT_FAMILY } from '../config/gameConfig.js';

/**
 * 문 placeholder. 벽에 붙은 사각형과 라벨로 구성되며,
 * 플레이어가 서야 할 위치(approach)를 함께 가진다.
 */
export default class Door {
  constructor(scene, { x, y, width = 72, height = 16, approach, label, sublabel, locked = false, target, labelBelow = true }) {
    this.scene = scene;
    this.target = target;
    this.locked = locked;
    this.approach = approach;

    this.rect = scene.add
      .rectangle(x, y, width, height, locked ? 0x6a2a2a : 0xc9a24f)
      .setStrokeStyle(2, 0x111111)
      .setDepth(5)
      .setInteractive({ useHandCursor: true });

    const text = [label, sublabel, locked ? '🔒 잠김' : null].filter(Boolean).join('\n');
    this.label = scene.add
      .text(x, labelBelow ? y + height / 2 + 6 : y - height / 2 - 6, text, {
        fontFamily: FONT_FAMILY,
        fontSize: '13px',
        color: locked ? '#e89a9a' : '#f3e6c4',
        align: 'center',
        lineSpacing: 2
      })
      .setOrigin(0.5, labelBelow ? 0 : 1)
      .setDepth(5);
  }

  onClick(handler) {
    this.rect.on('pointerdown', (pointer, lx, ly, event) => {
      event?.stopPropagation();
      handler(this);
    });
    return this;
  }
}
