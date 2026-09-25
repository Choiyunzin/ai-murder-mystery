import ExploreScene from './ExploreScene.js';
import Door from '../entities/Door.js';
import NPC from '../entities/NPC.js';
import Hud from '../ui/Hud.js';
import gameState from '../systems/GameState.js';
import roomData from '../data/rooms.json';
import characters from '../data/characters.json';
import { GAME_WIDTH, GAME_HEIGHT, WALL_THICKNESS } from '../config/gameConfig.js';

/**
 * 6개 방이 공유하는 Scene. 방 구성(NPC, 소품, 바닥색)은 rooms.json에서 Scene key로 읽는다.
 */
export default class RoomScene extends ExploreScene {
  create() {
    const roomKey = this.scene.key;
    const room = roomData.rooms[roomKey];
    const character = characters[room.npc];

    this.initExplore(room);
    this.hud = new Hud(this, room.name);

    // 출입구(하단 중앙) → 로비 복귀
    const t = WALL_THICKNESS;
    const exitX = GAME_WIDTH / 2;
    const approach = { x: exitX, y: GAME_HEIGHT - t - 36 };
    const exit = new Door(this, {
      x: exitX,
      y: GAME_HEIGHT - t / 2,
      approach,
      label: '출입구',
      sublabel: '로비',
      target: 'LobbyScene',
      labelBelow: false
    });
    const exitTarget = this.addInteractable({
      x: approach.x,
      y: approach.y,
      prompt: '[E] 로비로 나가기',
      promptX: exitX,
      promptY: GAME_HEIGHT - t - 56,
      onInteract: () => this.goToScene('LobbyScene')
    });
    exit.onClick(() => {
      if (this.isInRange(exitTarget)) this.activate(exitTarget);
      else this.hud.toast('출입구에 더 가까이 다가가세요.');
    });

    this.spawnPlayer(approach.x, approach.y - 20);

    this.npc = new NPC(this, room.npcPos.x, room.npcPos.y, character, {
      onClick: (npc) => this.showRoleBadge(npc)
    });
    this.physics.add.collider(this.player, this.npc);

    gameState.enterRoom(roomKey);
  }
}
