import { ui, h } from './UIRoot.js';
import { Registry } from '../systems/Registry.js';
import gameState from '../systems/GameState.js';
import { computeScore } from '../systems/ScoringSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';

const TRUTH = [
  ['배후', '김상무', '철강 시황 악화를 이유로 하반기 교육 예산 재배정을 일방적으로 지시했다. AI 파트는 공문 없이 구두로 처리하게 했다.'],
  ['실행', '박피엠', '지시를 이행해 사전 협의 없이 강사료를 깎고, 교육 이틀 전에 실습시간 단축을 통보했다.'],
  ['결과', '조강사 / 정강사', '조강사는 현장 맞춤 신규 실습을 포기하고 IT 회사용 예전 자료를 재사용했고, 정강사는 현장 사례 대신 범용 코딩 템플릿을 급조했다.']
];

function truthList() {
  return h('dl', { class: 'truth' }, TRUTH.flatMap(([k, who, why]) => [h('dt', {}, k), h('dd', {}, h('b', {}, who), ` — ${why}`)]));
}

/** CASE CLOSED / 미제 사건 엔딩 */
export function openEnding({ onRestart }) {
  const outcome = gameState.deduction.outcome;
  const last = gameState.deduction.history.at(-1)?.verdict;
  const score = computeScore();
  const solved = outcome === 'solved';
  const modal = {};

  const scoreEl = h(
    'div',
    { class: 'score' },
    score.rows.flatMap((r) => [h('span', {}, r.label), h('span', {}, `${r.value} / ${r.max}`)]),
    h('span', { class: 'total' }, '합계'),
    h('span', { class: 'total' }, `${score.total} / ${score.max}`)
  );

  const textarea = h('textarea', { id: 'reflection', placeholder: '예: 일정·예산 변경은 강사와 사전 협의하고 문서로 남긴다', maxlength: '1000' });
  textarea.value = gameState.reflection ?? '';
  const savedEl = h('span', { class: 'saved', role: 'status' });
  const save = () => {
    const text = textarea.value.trim();
    if (!text) {
      savedEl.textContent = '내용을 입력하세요.';
      return;
    }
    gameState.reflection = text;
    const ok = SaveSystem.saveReflection(text, { outcome, grade: score.grade, total: score.total });
    savedEl.textContent = ok ? '저장했습니다.' : '이 브라우저에서는 저장할 수 없어 이번 화면에만 남습니다.';
  };

  const truthBox = h('div', { hidden: true }, truthList());
  const body = solved
    ? [
        h('div', { class: 'stamp' }, 'CASE CLOSED'),
        truthList(),
        last && last.pathCorrect < last.pathTotal ? h('p', { class: 'ending-note' }, '결과 경로 중 일부만 짚었다. 두 교육 파트 모두 같은 원인에서 무너졌다.') : null,
        h('p', {}, '만족도 급락은 한 사람의 잘못이 아니었다. 위에서 내려온 예산 지시가 협의 없는 일정 변경으로, 다시 준비 부족과 자료 재사용으로 이어졌다. 전사 필수 교육이라도 제철소 현장 리더에게 맞춘 설계와 준비 시간이 없으면 성과를 낼 수 없었다. 이과장의 수치 부풀리기와 최본부장의 자책은 표면의 혼선이었다.')
      ]
    : [
        h('div', { class: 'stamp unsolved' }, 'UNSOLVED'),
        h('p', {}, '두 번의 지목이 모두 어긋났다. 사건은 미제로 남았다.'),
        h('div', { class: 'row' }, h('button', { class: 'btn', onclick: (e) => { truthBox.hidden = !truthBox.hidden; e.currentTarget.textContent = truthBox.hidden ? '진상 보기' : '진상 숨기기'; } }, '진상 보기')),
        truthBox
      ];

  modal.el = h(
    'div',
    { class: 'ui-modal', style: 'inset:0' },
    h(
      'article',
      { class: 'ui-modal ending', role: 'dialog', 'aria-label': solved ? 'CASE CLOSED' : '미제 사건' },
      ...body,
      h('div', { class: 'grade-row' }, h('div', { class: 'grade' }, score.grade), scoreEl),
      h('p', { class: 'ending-note' }, '등급은 게임 결과이며 실제 업무평가가 아닙니다.'),
      h(
        'div',
        { class: 'reflect' },
        h('label', { for: 'reflection' }, '그렇다면 다음 리더십 교육에서 가장 먼저 바꿔야 할 것은 무엇일까요?'),
        textarea,
        h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: save }, '답변 저장'), savedEl)
      ),
      h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => { ui.close(modal); onRestart(); } }, '처음부터 다시'))
    )
  );
  // 엔딩은 Esc 로 닫지 않는다. 입력 중 키가 게임으로 새지 않도록 모두 소비한다.
  modal.onKey = (e) => e.target === textarea ? false : e.key === 'Escape';
  ui.open(modal);
}
