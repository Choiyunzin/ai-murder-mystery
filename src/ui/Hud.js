import { FONT_FAMILY, GAME_WIDTH, HUD_HEIGHT, CANVAS_HEIGHT } from '../config/gameConfig.js';
import gameState from '../systems/GameState.js';
import roomData from '../data/rooms.json';

/** 상단 HUD 띠(위치/방문 현황, 조작 안내) + 하단 토스트 메시지. 모두 화면 고정. */
export default class Hud {
  constructor(scene, locationName) {
    this.scene = scene;
    const total = Object.keys(roomData.rooms).length;

    scene.add.rectangle(0, 0, GAME_WIDTH, HUD_HEIGHT, 0x0b0c10).setOrigin(0).setScrollFactor(0).setDepth(70);

    scene.add
      .text(12, HUD_HEIGHT / 2, `📍 ${locationName}   ·   방문한 공간 ${gameState.visitedRooms.length}/${total}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '15px',
        color: '#f3e6c4'
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(71);

    scene.add
      .text(GAME_WIDTH - 12, HUD_HEIGHT / 2, 'WASD/방향키 이동 · E/Space/클릭 상호작용 · NPC 클릭: 역할 확인', {
        fontFamily: FONT_FAMILY,
        fontSize: '12px',
        color: '#999999'
      })
      .setOrigin(1, 0.5)
      .setScrollFactor(0)
      .setDepth(71);

    this.toastText = scene.add
      .text(GAME_WIDTH / 2, CANVAS_HEIGHT - 80, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '15px',
        color: '#ffffff',
        backgroundColor: '#000000cc',
        padding: { x: 12, y: 6 }
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(71)
      .setVisible(false);
    this.toastTimer = null;
  }

  toast(message, duration = 2000) {
    this.toastText.setText(message).setVisible(true);
    this.toastTimer?.remove();
    this.toastTimer = this.scene.time.delayedCall(duration, () => this.toastText.setVisible(false));
  }
}
