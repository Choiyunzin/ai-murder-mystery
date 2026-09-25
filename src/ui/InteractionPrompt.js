import { FONT_FAMILY } from '../config/gameConfig.js';
import { audio } from '../systems/AudioSystem.js';

/** 상호작용 가능한 대상 위에 뜨는 "[E] ..." 프롬프트. 대상이 바뀌면 살짝 떠오르며 '팅' 소리. */
export default class InteractionPrompt {
  constructor(scene) {
    this.scene = scene;
    this.text = scene.add
      .text(0, 0, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '14px',
        color: '#111318',
        backgroundColor: '#f3e6c4',
        padding: { x: 8, y: 4 }
      })
      .setOrigin(0.5, 1)
      .setDepth(1000)
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
    if (this.currentTarget === target) return;
    this.currentTarget = target;
    this.text.setText(target.prompt).setPosition(target.promptX, target.promptY + 6).setAlpha(0).setVisible(true);
    this.scene.tweens.killTweensOf(this.text);
    this.scene.tweens.add({ targets: this.text, y: target.promptY, alpha: 1, duration: 140, ease: 'Quad.out' });
    audio.sfx('ting');
  }

  hide() {
    if (!this.currentTarget) return;
    this.currentTarget = null;
    this.scene.tweens.killTweensOf(this.text);
    this.text.setVisible(false);
  }
}
