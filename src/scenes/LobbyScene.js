import ExploreScene from './ExploreScene.js';
import Door from '../entities/Door.js';
import Hud from '../ui/Hud.js';
import gameState from '../systems/GameState.js';
import roomData from '../data/rooms.json';
import characters from '../data/characters.json';
import { GAME_HEIGHT, WALL_THICKNESS } from '../config/gameConfig.js';
import { deductionReadiness } from '../systems/ScoringSystem.js';
import { openNarration } from '../ui/DialogueBox.js';

export default class LobbyScene extends ExploreScene {
  constructor() {
    super({ key: 'LobbyScene' });
  }

  create() {
    const lobby = roomData.lobby;
    gameState.returnToLobby();

    this.initExplore(lobby);
    this.hud = new Hud(this, lobby.name);

    const doors = lobby.doors.map((cfg) => this.createDoor(cfg));

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
      onInteract: () => this.useDoor(roomKey)
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

  useDoor(roomKey) {
    const room = roomData.rooms[roomKey];
    if (gameState.isLocked(roomKey)) {
      this.hud.toast(room.lockedMessage ?? '문이 잠겨 있다.');
      return;
    }
    gameState.enterRoom(roomKey);
    this.goToScene(roomKey);
  }
}
