import { ui, h } from './UIRoot.js';
import { isTouchDevice } from './TouchControls.js';

/** 타이틀 메뉴: 새로 시작 / 이어하기 */
export function openMenu({ canContinue, onNew, onContinue }) {
  const modal = {};
  const touch = isTouchDevice();
  const newBtn = h('button', { class: 'btn primary', onclick: () => { ui.close(modal); onNew(); } }, '새로 시작');
  const contBtn = h('button', { class: 'btn', disabled: !canContinue, onclick: () => { ui.close(modal); onContinue(); } }, '이어하기');
  modal.el = h(
    'div',
    { class: 'ui-modal menu' },
    h(
      'div',
      { class: 'menu-card' },
      h('div', { class: 'menu-case' }, 'CASE 026'),
      h('h1', { class: 'menu-title' }, '만족도 급락 사건'),
      h('p', { class: 'menu-sub' }, '사업부장급 리더 대상 AI + 리더십 혼합 교육'),
      h('div', { class: 'menu-drop' }, h('span', { class: 'from' }, '4.8'), h('span', {}, '→'), h('span', { class: 'to' }, '2.1'), h('span', { class: 'unit' }, '/ 5.0 교육 만족도')),
      h('p', { class: 'menu-brief' }, '오전 AI 실습도, 오후 리더십 실습도 무너졌다. 여섯 명의 관계자를 만나 진술을 듣고, 문서를 찾고, 모순을 짚어 만족도가 떨어진 진짜 원인의 구조를 밝혀내자.'),
      h('div', { class: 'menu-actions' }, newBtn, contBtn),
      h(
        'div',
        { class: 'menu-help' },
        touch
          ? [h('b', {}, '조이스틱'), ' 이동 · ', h('b', {}, '조사'), ' 버튼 대화·조사·문 열기 · ', h('b', {}, '인물 탭'), ' 역할 확인 · 가로 화면을 권장합니다']
          : [h('b', {}, 'WASD / 방향키'), ' 이동 · ', h('b', {}, 'E / Space'), ' 대화·조사·문 열기 · ', h('b', {}, 'I'), ' 수첩 · ', h('b', {}, '숫자키'), ' 선택지 · ', h('b', {}, '인물 클릭'), ' 역할 확인']
      )
    )
  );
  modal.onKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      (canContinue ? contBtn : newBtn).click();
      return true;
    }
    return false;
  };
  ui.open(modal);
  newBtn.focus();
}
