import { ui, h } from './UIRoot.js';
import { Registry } from '../systems/Registry.js';
import gameState from '../systems/GameState.js';
import { submitDeduction } from '../systems/ScoringSystem.js';

/**
 * 최종 추론 보드: 배후(1명) → 실행(1명) → 결과 경로(복수) 선택 후 제출.
 * onBack(): 로비로 돌아가기, onResult(outcome): 'solved' | 'unsolved'
 */
export function openDeductionBoard({ onBack, onResult, onFeedback }) {
  const rules = Registry.gameRules.deduction;
  const sel = { mastermind: null, executor: null, paths: [] };
  const modal = {};
  const attemptsEl = h('span', { class: 'board-attempts' });
  const msgEl = h('span', { class: 'board-msg', role: 'status' });
  const submitBtn = h('button', { class: 'btn primary', onclick: () => submit() }, '지목 제출');

  const people = Object.values(Registry.characters);
  const personStage = (key, idx) => {
    const buttons = people.map((c) =>
      h(
        'button',
        { class: 'pick', 'aria-pressed': 'false', onclick: () => { sel[key] = c.id; sync(); } , 'data-id': c.id },
        h('span', { class: 'dot', style: `background:${c.color}` }),
        h('span', {}, c.name, h('span', { class: 'sub' }, c.role))
      )
    );
    return {
      buttons,
      el: h('section', { class: 'stage' }, h('div', { class: 'stage-q' }, h('b', {}, `STAGE ${idx}`), rules.stages[key].question), h('div', { class: 'pick-grid' }, buttons))
    };
  };
  const s1 = personStage('mastermind', 1);
  const s2 = personStage('executor', 2);
  const pathButtons = rules.pathOptions.map((p) =>
    h(
      'button',
      {
        class: 'pick', 'aria-pressed': 'false', 'data-id': p.id,
        onclick: () => {
          sel.paths = sel.paths.includes(p.id) ? sel.paths.filter((x) => x !== p.id) : [...sel.paths, p.id];
          sync();
        }
      },
      h('span', { class: 'box' }, ''),
      h('span', {}, p.label)
    )
  );
  const s3 = h('section', { class: 'stage' }, h('div', { class: 'stage-q' }, h('b', {}, 'STAGE 3'), rules.stages.paths.question), h('div', { class: 'pick-list' }, pathButtons));

  function sync() {
    s1.buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === sel.mastermind)));
    s2.buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === sel.executor)));
    pathButtons.forEach((b) => {
      const on = sel.paths.includes(b.dataset.id);
      b.setAttribute('aria-pressed', String(on));
      b.querySelector('.box').textContent = on ? '✓' : '';
    });
    submitBtn.disabled = !(sel.mastermind && sel.executor && sel.paths.length);
    attemptsEl.textContent = `남은 지목 기회 ${rules.maxAttempts - gameState.deduction.attempts} / ${rules.maxAttempts}`;
  }

  function submit() {
    if (submitBtn.disabled) return;
    const { outcome, attemptsLeft } = submitDeduction({ ...sel, paths: [...sel.paths] });
    onFeedback?.(outcome);
    if (outcome === 'retry') {
      msgEl.textContent = `${rules.failMessage} (남은 기회 ${attemptsLeft}회) 다시 조사하거나 판단을 고쳐 제출하세요.`;
      sync();
      return;
    }
    ui.close(modal);
    onResult(outcome);
  }

  modal.el = h(
    'div',
    { class: 'ui-modal', style: 'inset:0' },
    h(
      'section',
      { class: 'ui-modal board', role: 'dialog', 'aria-label': '최종 추론' },
      h('div', { class: 'board-head' }, h('span', { class: 'board-title' }, '최종 추론 보드'), h('span', { class: 'board-sub' }, '단일 범인이 아니라 배후 · 실행 · 결과의 구조를 지목한다'), attemptsEl),
      h('div', { class: 'board-body' }, s1.el, s2.el, s3),
      h('div', { class: 'board-foot' }, msgEl, h('button', { class: 'btn', onclick: () => { ui.close(modal); onBack(); } }, '로비로 돌아가기 (Esc)'), submitBtn)
    )
  );
  modal.onKey = (e) => {
    if (e.key === 'Escape') {
      ui.close(modal);
      onBack();
      return true;
    }
    return false;
  };
  ui.open(modal);
  sync();
}
