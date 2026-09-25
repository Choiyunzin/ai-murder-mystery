import { FONT_FAMILY } from '../config/gameConfig.js';

/** NPC 클릭 시 뜨는 이름 + 역할 배지. 정보 제공용이며 게임 상태를 바꾸지 않는다. */
export default class RoleBadge {
  constructor(scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setDepth(60).setVisible(false);
    this.bg = scene.add.rectangle(0, 0, 10, 10, 0x111318, 0.92).setStrokeStyle(2, 0xf3e6c4).setOrigin(0.5, 1);
    this.nameText = scene.add
      .text(0, 0, '', { fontFamily: FONT_FAMILY, fontSize: '16px', fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0.5, 1);
    this.roleText = scene.add
      .text(0, 0, '', { fontFamily: FONT_FAMILY, fontSize: '13px', color: '#c9c9c9' })
      .setOrigin(0.5, 1);
    this.container.add([this.bg, this.nameText, this.roleText]);
    this.hideTimer = null;
  }

  show(npc) {
    const { name, role, color } = npc.character;
    this.nameText.setText(name).setColor(color);
    this.roleText.setText(role);

    const padX = 14;
    const padY = 8;
    const width = Math.max(this.nameText.width, this.roleText.width) + padX * 2;
    const height = this.nameText.height + this.roleText.height + padY * 2;
    this.bg.setSize(width, height);
    this.bg.setDisplayOrigin(width / 2, height);
    this.roleText.setPosition(0, -padY);
    this.nameText.setPosition(0, -padY - this.roleText.height);

    const x = Math.min(Math.max(npc.x, width / 2 + 4), this.scene.scale.width - width / 2 - 4);
    const y = Math.max(npc.y - 52, height + 4);
    this.container.setPosition(x, y).setVisible(true);

    this.hideTimer?.remove();
    this.hideTimer = this.scene.time.delayedCall(2500, () => this.hide());
  }

  hide() {
    this.container.setVisible(false);
  }
}
