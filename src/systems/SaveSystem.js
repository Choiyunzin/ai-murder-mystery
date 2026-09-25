import gameState from './GameState.js';

const SAVE_KEY = 'case026.save.v1';
const REFLECTION_KEY = 'case026.reflections.v1';

// 저장소가 막힌 환경(시크릿 창 등)에서도 게임은 계속 동작해야 한다
function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

let timer = null;

export const SaveSystem = {
  /** GameState 가 바뀔 때마다 잠시 뒤 자동 저장 */
  enableAutosave() {
    gameState.on(() => {
      clearTimeout(timer);
      timer = setTimeout(() => this.save(), 300);
    });
  },

  save() {
    return write(SAVE_KEY, { savedAt: Date.now(), state: gameState.toJSON() });
  },

  hasSave() {
    const data = read(SAVE_KEY);
    return !!data?.state && data.state.deduction?.outcome == null;
  },

  load() {
    const data = read(SAVE_KEY);
    if (!data?.state) return false;
    gameState.load(data.state);
    return true;
  },

  clear() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* 무시 */
    }
  },

  /** 엔딩의 자유 입력 답변을 누적 저장 */
  saveReflection(text, meta) {
    const list = read(REFLECTION_KEY) ?? [];
    list.push({ text, savedAt: new Date().toISOString(), ...meta });
    return write(REFLECTION_KEY, list);
  },

  reflections() {
    return read(REFLECTION_KEY) ?? [];
  }
};
