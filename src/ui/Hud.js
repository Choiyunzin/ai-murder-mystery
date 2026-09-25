import { FONT_FAMILY, GAME_WIDTH, HUD_HEIGHT } from '../config/gameConfig.js';
import gameState from '../systems/GameState.js';
import { Registry } from '../systems/Registry.js';
import { ui } from './UIRoot.js';
import { toggleNotebook } from './InventoryPanel.js';
import roomData from '../data/rooms.json';
import { currentObjective } from '../systems/MissionSystem.js';

/** 상단 HUD 띠: 위치/방문 현황, 현재 목표, 수첩 버튼(증거·모순 수). 음소거 버튼은 DOM(UIRoot). 알림은 DOM 토스트. */
export default class Hud {
  constructor(scene, locationName) {
    this.scene = scene;
    this.locationName = locationName;

    scene.add.rectangle(0, 0, GAME_WIDTH, HUD_HEIGHT, 0x0b0c10).setOrigin(0).setScrollFactor(0).setDepth(70);

    this.locationText = scene.add
      .text(12, HUD_HEIGHT / 2, '', { fontFamily: FONT_FAMILY, fontSize: '15px', color: '#f3e6c4' })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(71);

    // 현재 목표 (MissionPanel)
    this.objectiveText = scene.add
      .text(250, HUD_HEIGHT / 2, '', { fontFamily: FONT_FAMILY, fontSize: '12px', color: '#b8b09c' })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(71);

    this.notebookButton = scene.add
      .text(GAME_WIDTH - 46, HUD_HEIGHT / 2, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '14px',
        color: '#111318',
        backgroundColor: '#d9b45a',
        padding: { x: 8, y: 4 }
      })
      .setOrigin(1, 0.5)
      .setScrollFactor(0)
      .setDepth(71)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', (pointer, lx, ly, event) => {
        event?.stopPropagation();
        if (!ui.isOpen()) toggleNotebook();
      });

    this.refresh();
    const off = gameState.on(() => this.refresh());
    scene.events.once('shutdown', off);
  }

  refresh() {
    const totalRooms = Object.keys(roomData.rooms).length;
    this.locationText.setText(`📍 ${this.locationName}  ·  방문 ${gameState.visitedRooms.length}/${totalRooms}`);
    const ev = `${gameState.evidence.length}/${Object.keys(Registry.evidences).length}`;
    const ct = `${gameState.contradictions.length}/${Object.keys(Registry.contradictions).length}`;
    this.notebookButton.setText(`수첩 [I]  증거 ${ev} · 모순 ${ct}`);
    const objective = currentObjective();
    this.objectiveText.setText(objective ? `목표 · ${objective}` : '');
  }

  toast(message, type = 'info') {
    ui.toast(message, type);
  }
}
