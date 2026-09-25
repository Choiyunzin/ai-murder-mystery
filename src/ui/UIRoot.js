import './ui.css';
import { GAME_WIDTH } from '../config/gameConfig.js';

// 모달이 키 입력으로 닫힌 직후 같은 키가 Phaser 쪽 상호작용을 다시 발동하지 않도록 두는 유예 시간
const CLOSE_GRACE_MS = 200;

/**
 * 캔버스 위 DOM UI 레이어. Scene 과 독립적으로 유지되며
 * 모달 스택(대화창, 수첩, 문서 뷰어)과 토스트 알림을 관리한다.
 */
class UIRoot {
  constructor() {
    this.stack = [];
    this.lastClosedAt = 0;
    this.hotkeys = {};
  }

  mount(game) {
    this.game = game;
    this.el = document.createElement('div');
    this.el.id = 'ui-root';
    this.toasts = document.createElement('div');
    this.toasts.className = 'toasts';
    this.el.append(this.toasts);
    document.body.append(this.el);

    const sync = () => requestAnimationFrame(() => this.sync());
    game.scale.on('resize', sync);
    window.addEventListener('resize', sync);
    game.events.once('ready', sync);
    sync();

    // 캡처 단계에서 받아 Phaser 키 처리보다 먼저 실행되게 한다
    // (같은 키 입력으로 창이 열리자마자 한 줄 넘어가는 것을 막는다)
    window.addEventListener('keydown', (e) => this.onKey(e), { capture: true });
  }

  sync() {
    const canvas = this.game?.canvas;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    Object.assign(this.el.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    this.el.style.setProperty('--s', (r.width / GAME_WIDTH).toFixed(4));
  }

  onKey(e) {
    const top = this.stack[this.stack.length - 1];
    if (top) {
      if (top.onKey?.(e)) e.preventDefault();
      return;
    }
    const handler = this.hotkeys[e.key.toLowerCase()];
    if (handler && !e.repeat) {
      e.preventDefault();
      handler();
    }
  }

  /** 모달이 없을 때만 동작하는 단축키 (예: I = 수첩) */
  setHotkey(key, handler) {
    this.hotkeys[key] = handler;
  }

  /** 모달 등록. modal = { el, onKey(e) → handled, onClose() } */
  open(modal) {
    this.stack.push(modal);
    this.el.append(modal.el);
    return modal;
  }

  close(modal) {
    const i = this.stack.indexOf(modal);
    if (i === -1) return;
    this.stack.splice(i, 1);
    modal.el.remove();
    this.lastClosedAt = performance.now();
    modal.onClose?.();
  }

  closeAll() {
    [...this.stack].reverse().forEach((m) => this.close(m));
  }

  isOpen() {
    return this.stack.length > 0;
  }

  /** 게임 조작(이동/상호작용)을 막아야 하는지 */
  isBlocking() {
    return this.isOpen() || performance.now() - this.lastClosedAt < CLOSE_GRACE_MS;
  }

  toast(text, type = 'info', duration = 2600) {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = text;
    this.toasts.append(el);
    setTimeout(() => el.remove(), duration);
  }

  notify(notices) {
    // 같은 문구(예: 한 번에 여러 진술 기록)는 한 번만 띄운다
    notices = notices.filter((n, i) => notices.findIndex((m) => m.text === n.text) === i);
    notices.forEach((n, i) => setTimeout(() => this.toast(n.text, n.type, n.type === 'statement' ? 1800 : 3200), i * 120));
  }
}

export const ui = new UIRoot();

/** 작은 DOM 헬퍼 */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c != null && c !== false) el.append(c);
  return el;
}
