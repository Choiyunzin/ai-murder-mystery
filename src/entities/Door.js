import { FONT_FAMILY, GAME_HEIGHT } from '../config/gameConfig.js';

// 문은 벽(측면·하단 벽 그래픽) 위에 그려져야 한다
const DEPTH = GAME_HEIGHT + 50;

/**
 * 벽에 달린 문: 문틀 + 문짝 + 명패. 잠긴 문은 붉은 문짝과 자물쇠.
 * approach 는 플레이어가 서야 할 위치.
 */
export default class Door {
  constructor(scene, { x, y, width = 64, height = 24, approach, label, sublabel, locked = false, target, labelBelow = true }) {
    this.scene = scene;
    this.target = target;
    this.locked = locked;
    this.approach = approach;

    scene.add.rectangle(x, y, width + 10, height, 0x2a2118).setDepth(DEPTH);
    this.panel = scene.add
      .rectangle(x, y, width, height - 4, locked ? 0x6a2a2a : 0x9a6a3a)
      .setStrokeStyle(2, locked ? 0x3a1414 : 0x5a3a1e)
      .setDepth(DEPTH + 1)
      .setInteractive({ useHandCursor: true });
    scene.add.rectangle(x + width / 2 - 9, y, 4, 4, 0xd9b45a).setDepth(DEPTH + 2);
    if (locked) {
      scene.add.text(x, y, '🔒', { fontSize: '13px' }).setOrigin(0.5).setDepth(DEPTH + 2);
    }

    const text = [label, sublabel].filter(Boolean).join('\n');
    const plateY = labelBelow ? y + height / 2 + 6 : y - height / 2 - 6;
    this.label = scene.add
      .text(x, plateY, text + (locked ? '\n잠김' : ''), {
        fontFamily: FONT_FAMILY,
        fontSize: '12px',
        color: locked ? '#f0b0a8' : '#f3e6c4',
        align: 'center',
        lineSpacing: 1,
        backgroundColor: '#15171cdd',
        padding: { x: 6, y: 3 }
      })
      .setOrigin(0.5, labelBelow ? 0 : 1)
      .setDepth(DEPTH + 3);
  }

  /** 입장 연출: 문짝이 옆으로 열린다 */
  open() {
    this.scene.tweens.add({ targets: this.panel, scaleX: 0.15, duration: 200, ease: 'Quad.out' });
  }

  onClick(handler) {
    this.panel.on('pointerdown', (pointer, lx, ly, event) => {
      event?.stopPropagation();
      handler(this);
    });
    return this;
  }
}
