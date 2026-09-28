import { ui, h } from './UIRoot.js';
import { audio } from '../systems/AudioSystem.js';
import gameState from '../systems/GameState.js';
import { AI, inputsFor, runAnalysis, judgeReport, findReport, callsLeft } from '../systems/AiLabSystem.js';

let lastAgent = 'doc';

/**
 * AI 분석 콘솔: 요원 선택 → 자료 선택 → 분석 맡기기 → 결과 검증 후 채택/보류.
 */
export function openAiLab() {
  const modal = {};
  const close = () => ui.close(modal);
  let agentId = lastAgent;
  let selected = null; // 현재 보고 있는 보고서 key

  const callsEl = h('span', { class: 'lab-calls' });
  const agentsEl = h('div', { class: 'lab-agents', role: 'tablist' });
  const inputsEl = h('div', { class: 'lab-inputs' });
  const outputEl = h('div', { class: 'lab-output', 'aria-live': 'polite' });

  const renderCalls = () => {
    callsEl.textContent = `남은 AI 호출 ${callsLeft()} / ${AI.calls}`;
  };

  const renderAgents = () => {
    agentsEl.replaceChildren(
      ...Object.entries(AI.agents).map(([id, a], i) =>
        h(
          'button',
          {
            class: 'lab-agent',
            role: 'tab',
            'aria-selected': String(id === agentId),
            style: `--agent:${a.color}`,
            onclick: () => {
              agentId = lastAgent = id;
              selected = null;
              render();
            }
          },
          h('span', { class: 'lab-tag' }, a.tag),
          h('span', { class: 'lab-agent-name' }, `${i + 1}. ${a.name}`),
          h('span', { class: 'lab-agent-desc' }, a.desc)
        )
      )
    );
  };

  const renderInputs = () => {
    const list = inputsFor(agentId);
    inputsEl.replaceChildren(
      h('div', { class: 'lab-col-title' }, '맡길 자료'),
      ...list.map((it) =>
        h(
          'button',
          {
            class: `lab-input${selected === it.key ? ' on' : ''}`,
            disabled: !it.available,
            onclick: () => analyze(it.id)
          },
          h('span', {}, it.label),
          h('span', { class: 'lab-input-tag' }, it.done ? statusTag(findReport(it.key)) : it.available ? '분석 맡기기' : '')
        )
      )
    );
  };

  const statusTag = (r) => (r.adopted === true ? '채택함' : r.adopted === false ? '보류함' : '검증 대기');

  function analyze(inputId) {
    const res = runAnalysis(agentId, inputId);
    if (res.status === 'new') audio.sfx('clue');
    else audio.sfx('select');
    selected = res.report ? res.key : null;
    showOutput(res);
    renderCalls();
    renderInputs();
  }

  function showOutput(res) {
    const agent = AI.agents[agentId];
    if (!res.report) {
      outputEl.replaceChildren(h('div', { class: 'lab-empty' }, res.lines.join(' ')), h('div', { class: 'lab-hint' }, '호출 횟수는 차감되지 않았습니다.'));
      return;
    }
    const r = findReport(res.key);
    const judge = (adopted) => {
      judgeReport(res.key, adopted);
      audio.sfx(adopted ? 'select' : 'blip');
      showOutput({ ...res, status: 'cached' });
      renderInputs();
    };
    outputEl.replaceChildren(
      h('div', { class: 'lab-out-head', style: `--agent:${agent.color}` }, h('span', { class: 'lab-tag' }, agent.tag), agent.name, h('span', { class: 'lab-badge' }, 'AI 제안 · 검증 필요')),
      h('div', { class: 'lab-out-lines' }, res.report.lines.map((l, i) => h('p', { class: 'lab-line', style: `--d:${res.status === 'new' ? i * 0.35 : 0}s` }, l))),
      h('div', { class: 'lab-judge' },
        h('span', { class: 'lab-q' }, '이 분석을 믿을 수 있을까? 증거·진술과 맞는지 확인한 뒤 판단하세요.'),
        h('div', { class: 'row' },
          h('button', { class: `btn${r.adopted === true ? ' primary' : ''}`, onclick: () => judge(true) }, '채택 — 수첩에 기록'),
          h('button', { class: `btn${r.adopted === false ? ' primary' : ''}`, onclick: () => judge(false) }, '보류 — 더 확인 필요')
        )
      )
    );
  }

  function render() {
    renderCalls();
    renderAgents();
    renderInputs();
    if (!selected) {
      outputEl.replaceChildren(
        h('div', { class: 'lab-intro' }, AI.intro.map((l) => h('p', {}, l))),
        h('div', { class: 'lab-hint' }, '왼쪽에서 요원을, 가운데에서 맡길 자료를 고르세요. 새 보고서를 받을 때만 호출 횟수가 줄어듭니다.')
      );
    }
  }

  modal.el = h(
    'div',
    { class: 'ui-modal', style: 'inset:0' },
    h('div', { class: 'ui-dim', onclick: close }),
    h(
      'section',
      { class: 'ui-modal notebook lab', role: 'dialog', 'aria-label': 'AI 분석 콘솔' },
      h('div', { class: 'nb-head' }, h('span', { class: 'nb-title' }, 'AI 분석 콘솔'), callsEl, h('button', { class: 'nb-close', onclick: close }, '닫기 (Esc)')),
      h('div', { class: 'lab-grid' }, agentsEl, inputsEl, outputEl)
    )
  );
  modal.onKey = (e) => {
    if (e.key === 'Escape') {
      close();
      return true;
    }
    if (/^[1-3]$/.test(e.key)) {
      agentId = lastAgent = Object.keys(AI.agents)[Number(e.key) - 1];
      selected = null;
      render();
      return true;
    }
    return ['e', 'E', ' '].includes(e.key);
  };
  ui.open(modal);
  audio.sfx('open');
  render();
  gameState.emit();
}
