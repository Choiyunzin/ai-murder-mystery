import { FONT_FAMILY } from '../config/gameConfig.js';

/** 상호작용 가능한 대상 위에 뜨는 "[E] ..." 프롬프트. */
export default class InteractionPrompt {
  constructor(scene) {
    this.text = scene.add
      .text(0, 0, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '14px',
        color: '#111318',
        backgroundColor: '#f3e6c4',
        padding: { x: 8, y: 4 }
      })
      .setOrigin(0.5, 1)
      .setDepth(50)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.currentTarget = null;
  }

  onClick(handler) {
    this.text.on('pointerdown', (pointer, lx, ly, event) => {
      event?.stopPropagation();
      if (this.currentTarget) handler(this.currentTarget);
    });
  }

  show(target) {
    this.currentTarget = target;
    this.text.setText(target.prompt).setPosition(target.promptX, target.promptY).setVisible(true);
  }

  hide() {
    this.currentTarget = null;
    this.text.setVisible(false);
  }
}
