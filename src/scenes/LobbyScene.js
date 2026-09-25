import ExploreScene from './ExploreScene.js';
import Door from '../entities/Door.js';
import Hud from '../ui/Hud.js';
import gameState from '../systems/GameState.js';
import roomData from '../data/rooms.json';
import characters from '../data/characters.json';
import { GAME_HEIGHT, WALL_THICKNESS, FONT_FAMILY } from '../config/gameConfig.js';
import { isTouchDevice } from '../ui/TouchControls.js';
import { audio } from '../systems/AudioSystem.js';
import { deductionReadiness } from '../systems/ScoringSystem.js';
import { openNarration } from '../ui/DialogueBox.js';

export default class LobbyScene extends ExploreScene {
  constructor() {
    super({ key: 'LobbyScene' });
  }

  create() {
    const lobby = roomData.lobby;
    gameState.returnToLobby();

    this.initExplore({ ...lobby, music: 'lobby' });
    this.hud = new Hud(this, lobby.name);

    this.doors = lobby.doors.map((cfg) => this.createDoor(cfg));
    const doors = this.doors;

    // 바닥 안내문
    this.add
      .text(480, 510, isTouchDevice() ? '조이스틱 이동 · 조사 버튼 상호작용 · 인물 탭: 역할 확인' : 'WASD/방향키 이동 · E/Space 상호작용 · I 수첩 · M 소리 · 인물 클릭: 역할 확인', {
        fontFamily: FONT_FAMILY,
        fontSize: '12px',
        color: '#9a9384'
      })
      .setOrigin(0.5)
      .setAlpha(0.8)
      .setDepth(-5);

    const returnDoor = doors.find((d) => d.target === gameState.lastRoom);
    const spawn = returnDoor ? returnDoor.approach : lobby.playerStart;
    this.spawnPlayer(spawn.x, spawn.y);
  }

  createDoor({ room: roomKey, wall, x }) {
    const room = roomData.rooms[roomKey];
    const npc = characters[room.npc];
    const t = WALL_THICKNESS;
    const isTop = wall === 'top';
    const y = isTop ? t / 2 : GAME_HEIGHT - t / 2;
    const approach = { x, y: isTop ? t + 36 : GAME_HEIGHT - t - 36 };
    const locked = gameState.isLocked(roomKey);

    const door = new Door(this, {
      x,
      y,
      target: roomKey,
      approach,
      label: room.name,
      sublabel: gameState.hasVisited(roomKey) ? `${npc.name} ✓` : npc.name,
      locked,
      labelBelow: isTop
    });

    const interactable = this.addInteractable({
      x: approach.x,
      y: approach.y,
      prompt: locked ? '[E] 🔒 문 두드리기' : `[E] ${room.name} 입장`,
      promptX: x,
      promptY: isTop ? t + 110 : GAME_HEIGHT - t - 70,
      onInteract: () => this.useDoor(roomKey, door)
    });

    door.onClick(() => {
      if (this.isInRange(interactable)) this.activate(interactable);
      else this.hud.toast('문에 더 가까이 다가가세요.');
    });

    return door;
  }

  onAction(action, label) {
    if (action !== 'deduction') return;
    if (gameState.deduction.outcome) {
      this.goToScene('EndingScene');
      return;
    }
    const { ready, items } = deductionReadiness();
    if (!ready) {
      openNarration(label, ['아직 사건을 정리하기엔 이르다.', items.map((i) => `${i.ok ? '✓' : '·'} ${i.label}`).join('\n')]);
      return;
    }
    gameState.lastRoom = null;
    this.goToScene('DeductionScene');
  }

  useDoor(roomKey, door) {
    const room = roomData.rooms[roomKey];
    if (gameState.isLocked(roomKey)) {
      audio.sfx('knock');
      this.hud.toast(room.lockedMessage ?? '문이 잠겨 있다.');
      return;
    }
    gameState.enterRoom(roomKey);
    this.goToScene(roomKey, undefined, door);
  }
}
