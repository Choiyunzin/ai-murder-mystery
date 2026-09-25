import roomData from '../data/rooms.json';

/**
 * 게임 전체 진행 상태를 한 곳에서 관리하는 싱글턴.
 * Scene이 재시작/전환되어도 모듈 인스턴스는 유지되므로 상태가 초기화되지 않는다.
 * 상태가 바뀌면 'change' 리스너(HUD, 수첩 등)에 알린다.
 */
class GameState {
  constructor() {
    this.listeners = new Set();
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
    this.evidence = [];
    this.clues = [];
    this.statements = [];
    this.contradictions = [];
    // NPC별 대화 상태: { pointsUsed, alert, asked: { topicId: count }, talked }
    this.npcs = {};
    // 최종 추론: 시도 횟수, 각 시도의 선택, 결과(solved | unsolved | null)
    this.deduction = { attempts: 0, history: [], outcome: null };
    this.reflection = '';
    this.applyDebugOverrides();
    this.emit();
  }

  // 개발 편의: ?debug=unlock 으로 접속하면 잠긴 방을 모두 연다.
  applyDebugOverrides() {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === 'unlock') this.lockedRooms = [];
  }

  on(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit() {
    this.listeners?.forEach((fn) => fn(this));
  }

  // ── 공간 ──────────────────────────────
  enterRoom(roomKey) {
    this.currentScene = roomKey;
    this.lastRoom = roomKey;
    if (!this.visitedRooms.includes(roomKey)) this.visitedRooms.push(roomKey);
    this.emit();
  }

  returnToLobby() {
    this.currentScene = 'LobbyScene';
  }

  isLocked(roomKey) {
    return this.lockedRooms.includes(roomKey);
  }

  unlockRoom(roomKey) {
    if (!this.isLocked(roomKey)) return false;
    this.lockedRooms = this.lockedRooms.filter((key) => key !== roomKey);
    this.emit();
    return true;
  }

  hasVisited(roomKey) {
    return this.visitedRooms.includes(roomKey);
  }

  // ── 플래그 / 수집 항목 ──────────────────
  setFlag(name, value = true) {
    this.flags[name] = value;
    this.emit();
  }

  getFlag(name) {
    return this.flags[name];
  }

  /** list 이름('evidence' | 'clues' | 'statements' | 'contradictions')에 id를 추가. 새로 추가됐으면 true. */
  add(list, id) {
    if (this[list].includes(id)) return false;
    this[list].push(id);
    this.emit();
    return true;
  }

  has(list, id) {
    return this[list].includes(id);
  }

  hasEvidence(id) {
    return this.has('evidence', id);
  }

  // ── NPC 대화 상태 ──────────────────────
  npc(id) {
    if (!this.npcs[id]) this.npcs[id] = { pointsUsed: 0, alert: 0, wasted: 0, asked: {}, talked: false, greeted: false };
    return this.npcs[id];
  }

  talkedCount() {
    return Object.values(this.npcs).filter((n) => n.talked).length;
  }

  toJSON() {
    return {
      currentScene: this.currentScene,
      lastRoom: this.lastRoom,
      visitedRooms: [...this.visitedRooms],
      lockedRooms: [...this.lockedRooms],
      flags: { ...this.flags },
      evidence: [...this.evidence],
      clues: [...this.clues],
      statements: [...this.statements],
      contradictions: [...this.contradictions],
      npcs: JSON.parse(JSON.stringify(this.npcs)),
      deduction: JSON.parse(JSON.stringify(this.deduction)),
      reflection: this.reflection
    };
  }

  /** 저장된 상태 복원 (SaveSystem) */
  load(data) {
    this.reset();
    for (const key of Object.keys(this.toJSON())) {
      if (data[key] !== undefined) this[key] = data[key];
    }
    this.emit();
  }
}

const gameState = new GameState();

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.gameState = gameState;
}

export default gameState;
