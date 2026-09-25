import roomData from '../data/rooms.json';

/**
 * 게임 전체 진행 상태를 한 곳에서 관리하는 싱글턴.
 * Scene이 재시작/전환되어도 모듈 인스턴스는 유지되므로 상태가 초기화되지 않는다.
 * (Phase 3 이후 evidence/dialogue 상태도 여기에 추가한다.)
 */
class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.currentScene = 'LobbyScene';
    // 로비로 돌아올 때 어느 문 앞에 설지 결정하는 값
    this.lastRoom = null;
    this.visitedRooms = [];
    this.lockedRooms = Object.entries(roomData.rooms)
      .filter(([, room]) => room.initiallyLocked)
      .map(([key]) => key);
    this.flags = {};
    this.applyDebugOverrides();
  }

  // 개발 편의: ?debug=unlock 으로 접속하면 잠긴 방을 모두 연다.
  applyDebugOverrides() {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === 'unlock') this.lockedRooms = [];
  }

  enterRoom(roomKey) {
    this.currentScene = roomKey;
    this.lastRoom = roomKey;
    if (!this.visitedRooms.includes(roomKey)) this.visitedRooms.push(roomKey);
  }

  returnToLobby() {
    this.currentScene = 'LobbyScene';
  }

  isLocked(roomKey) {
    return this.lockedRooms.includes(roomKey);
  }

  unlockRoom(roomKey) {
    this.lockedRooms = this.lockedRooms.filter((key) => key !== roomKey);
  }

  hasVisited(roomKey) {
    return this.visitedRooms.includes(roomKey);
  }

  setFlag(name, value = true) {
    this.flags[name] = value;
  }

  getFlag(name) {
    return this.flags[name];
  }

  toJSON() {
    return {
      currentScene: this.currentScene,
      lastRoom: this.lastRoom,
      visitedRooms: [...this.visitedRooms],
      lockedRooms: [...this.lockedRooms],
      flags: { ...this.flags }
    };
  }
}

const gameState = new GameState();

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.gameState = gameState;
}

export default gameState;
