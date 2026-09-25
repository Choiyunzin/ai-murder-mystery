import { ui, h } from './UIRoot.js';

/** 가상 조이스틱 입력. Player 가 키보드 입력과 합쳐 읽는다. */
export const virtualInput = { x: 0, y: 0 };

export function isTouchDevice() {
  const forced = new URLSearchParams(window.location.search).get('touch') === '1' || window.location.hash === '#touch';
  return forced || window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
}

/** 모바일: 좌하단 조이스틱 + 우하단 조사/수첩 버튼 */
export function mountTouchControls({ onAction, onNotebook }) {
  const knob = h('div', { class: 'joy-knob' });
  const base = h('div', { class: 'joy-base', 'aria-label': '이동 조이스틱' }, knob);
  const RADIUS = 1; // 정규화 반경

  let pointerId = null;
  const move = (e) => {
    const r = base.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = (e.clientX - cx) / (r.width / 2);
    let dy = (e.clientY - cy) / (r.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx /= len;
      dy /= len;
    }
    virtualInput.x = Math.abs(dx) > 0.2 ? dx : 0;
    virtualInput.y = Math.abs(dy) > 0.2 ? dy : 0;
    knob.style.transform = `translate(${dx * 50}%, ${dy * 50}%)`;
  };
  const end = () => {
    pointerId = null;
    virtualInput.x = 0;
    virtualInput.y = 0;
    knob.style.transform = '';
  };
  base.addEventListener('pointerdown', (e) => {
    pointerId = e.pointerId;
    base.setPointerCapture(e.pointerId);
    move(e);
  });
  base.addEventListener('pointermove', (e) => e.pointerId === pointerId && move(e));
  base.addEventListener('pointerup', end);
  base.addEventListener('pointercancel', end);

  const tap = (fn) => (e) => {
    e.preventDefault();
    fn();
  };
  const el = h(
    'div',
    { class: 'touch' },
    base,
    h(
      'div',
      { class: 'touch-buttons' },
      h('button', { class: 'touch-btn small', onpointerdown: tap(onNotebook), 'aria-label': '수첩' }, '수첩'),
      h('button', { class: 'touch-btn', onpointerdown: tap(onAction), 'aria-label': '조사 / 대화' }, '조사')
    )
  );
  ui.el.append(el);
  return el;
}
