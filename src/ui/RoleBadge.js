import { FONT_FAMILY } from '../config/gameConfig.js';

/** NPC 클릭 시 뜨는 이름 + 역할 배지. 정보 제공용이며 게임 상태를 바꾸지 않는다. */
export default class RoleBadge {
  constructor(scene) {
    this.scene = scene;
    // 깊이 정렬된 캐릭터·소품보다 항상 위
    this.container = scene.add.container(0, 0).setDepth(1100).setVisible(false);
    this.bg = scene.add.rectangle(0, 0, 10, 10, 0x111318, 0.92).setStrokeStyle(2, 0xf3e6c4).setOrigin(0.5, 1);
    this.nameText = scene.add
      .text(0, 0, '', { fontFamily: FONT_FAMILY, fontSize: '16px', fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0.5, 1);
    this.roleText = scene.add
      .text(0, 0, '', { fontFamily: FONT_FAMILY, fontSize: '13px', color: '#c9c9c9' })
      .setOrigin(0.5, 1);
    this.thumb = scene.add.image(0, 0, '__DEFAULT').setVisible(false);
    this.container.add([this.bg, this.thumb, this.nameText, this.roleText]);
    this.hideTimer = null;
  }

  show(npc) {
    const { name, role, color } = npc.character;
    this.nameText.setText(name).setColor(color);
    this.roleText.setText(role);

    const padX = 14;
    const padY = 8;
    // 초상화 토큰이 있으면 왼쪽에 작은 얼굴을 붙인다
    const tokenKey = `token_${npc.character.id}`;
    const thumbW = this.scene.textures.exists(tokenKey) ? 46 : 0;
    const textW = Math.max(this.nameText.width, this.roleText.width);
    const width = textW + padX * 2 + thumbW;
    const height = Math.max(this.nameText.height + this.roleText.height, thumbW ? 40 : 0) + padY * 2;
    this.bg.setSize(width, height);
    this.bg.setDisplayOrigin(width / 2, height);
    const textX = thumbW / 2 + (thumbW ? 2 : 0);
    this.roleText.setPosition(textX, -padY);
    this.nameText.setPosition(textX, -padY - this.roleText.height);
    if (thumbW) {
      this.thumb.setTexture(tokenKey).setCrop(8, 0, 48, 50).setScale(0.8).setVisible(true);
      // 크롭된 영역(얼굴)이 배지 세로 가운데 오도록 보정
      this.thumb.setPosition(-width / 2 + 10 + 19, -height / 2 + 5);
    } else {
      this.thumb.setVisible(false);
    }

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
