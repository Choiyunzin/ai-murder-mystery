import { ui, h } from './UIRoot.js';
import { Registry } from '../systems/Registry.js';
import { audio } from '../systems/AudioSystem.js';
import { portraitSrc } from '../gfx/Portraits.js';
import reconstruction from '../data/reconstruction.json';
import orchestration from '../data/orchestration.json';
import { AI, aiReview } from '../systems/AiLabSystem.js';
import gameState from '../systems/GameState.js';

/**
 * 엔딩의 연출 영상 플레이어.
 * - 사건 재구성: src/data/reconstruction.json
 * - AI 오케스트레이션 해설: src/data/orchestration.json
 * 자동 재생되며 → / Space 다음, ← 이전, P 일시정지, Esc 건너뛰기.
 */
const SEC = 1000;

function portrait(id, cls = '') {
  const { src, pixel } = portraitSrc(ui.game, id);
  const c = Registry.characters[id] ?? { name: '탐정', color: '#d9b45a' };
  return h('figure', { class: `cine-face ${cls}${pixel ? ' pixel' : ''}`, style: `--ring:${c.color}` }, h('img', { src, alt: c.name }));
}

const agentTag = (id) => h('span', { class: 'lab-tag', style: `--agent:${AI.agents[id].color}` }, AI.agents[id].tag);
const head = (s) => [rv('div', { class: 'cine-kicker' }, 0, s.kicker), rv('h2', { class: 'cine-h2' }, 0.2, s.title)];

// 등장 순서를 --d(초)로 지정하는 요소
const rv = (tag, attrs, delay, ...children) => h(tag, { ...attrs, class: `rv ${attrs.class ?? ''}`, style: `--d:${delay}s;${attrs.style ?? ''}` }, ...children);

const RENDER = {
  title(s) {
    return {
      duration: 4.5 * SEC,
      sfx: 'contradiction',
      el: h(
        'div',
        { class: 'cine-title' },
        rv('div', { class: 'cine-kicker' }, 0.2, s.kicker),
        rv('h2', { class: 'cine-h1' }, 0.6, s.title),
        rv('p', { class: 'cine-caption' }, 1.6, s.caption)
      )
    };
  },
  timeline(s) {
    const step = 1.3;
    return {
      duration: (s.events.length * step + 4) * SEC,
      el: h(
        'div',
        { class: 'cine-body' },
        rv('div', { class: 'cine-kicker' }, 0, s.kicker),
        rv('h2', { class: 'cine-h2' }, 0.2, s.title),
        h(
          'ol',
          { class: 'cine-timeline' },
          s.events.map((e, i) =>
            rv('li', { class: i === s.events.length - 1 ? 'last' : '' }, 0.8 + i * step, h('span', { class: 'tl-when' }, e.when), h('span', { class: 'tl-who' }, e.who), h('span', { class: 'tl-what' }, e.what))
          )
        )
      )
    };
  },
  person(s) {
    const step = 1.9;
    return {
      duration: (s.lines.length * step + 3.5) * SEC,
      el: h(
        'div',
        { class: 'cine-person' },
        rv('div', { class: 'cine-face-wrap' }, 0.1, portrait(s.npc, 'big')),
        h(
          'div',
          { class: 'cine-person-text' },
          rv('div', { class: 'cine-kicker' }, 0.3, s.kicker),
          rv('h2', { class: 'cine-h2', style: `color:${Registry.characters[s.npc].color}` }, 0.5, s.title, h('span', { class: 'cine-role' }, Registry.characters[s.npc].role)),
          ...s.lines.map((l, i) => rv('p', { class: 'cine-line' }, 1.1 + i * step, l)),
          rv('div', { class: 'cine-evidence' }, 1.1 + s.lines.length * step, `증거 · ${s.evidence}`)
        )
      )
    };
  },
  flow(s) {
    const main = s.nodes.filter((n) => !n.branch);
    const branch = s.nodes.filter((n) => n.branch);
    const node = (n, d) => rv('div', { class: 'flow-node' }, d, portrait(n.npc, 'small'), h('b', {}, Registry.characters[n.npc].name), h('span', {}, n.label));
    const arrow = (d) => rv('div', { class: 'flow-arrow', 'aria-hidden': 'true' }, d, '');
    let d = 0.8;
    const parts = [];
    main.forEach((n) => {
      parts.push(node(n, d));
      parts.push(arrow(d + 0.6));
      d += 1.2;
    });
    parts.push(h('div', { class: 'flow-branch' }, branch.map((n, i) => node(n, d + i * 0.4))));
    d += 1.2;
    parts.push(arrow(d));
    parts.push(rv('div', { class: 'flow-result' }, d + 0.6, s.result));
    return {
      duration: (d + 4) * SEC,
      el: h('div', { class: 'cine-body' }, rv('div', { class: 'cine-kicker' }, 0, s.kicker), rv('h2', { class: 'cine-h2' }, 0.2, s.title), h('div', { class: 'cine-flow' }, parts))
    };
  },
  cleared(s) {
    return {
      duration: 10 * SEC,
      el: h(
        'div',
        { class: 'cine-body' },
        rv('div', { class: 'cine-kicker' }, 0, s.kicker),
        rv('h2', { class: 'cine-h2' }, 0.2, s.title),
        h(
          'div',
          { class: 'cine-cleared' },
          s.people.map((p, i) =>
            rv(
              'div',
              { class: 'cleared-card' },
              0.8 + i * 2.2,
              portrait(p.npc, 'small'),
              h('div', {}, h('b', {}, Registry.characters[p.npc].name), h('s', { class: 'cleared-claim' }, p.claim), h('p', {}, p.truth)),
              rv('span', { class: 'cleared-stamp' }, 1.8 + i * 2.2, '원인 아님')
            )
          )
        )
      )
    };
  },
  concept(s) {
    return {
      duration: 11 * SEC,
      el: h(
        'div',
        { class: 'cine-body' },
        ...head(s),
        rv('blockquote', { class: 'cine-def' }, 0.8, s.definition),
        h('div', { class: 'cine-analogy' }, s.analogy.map((a, i) => rv('div', { class: 'analogy-card' }, 2.6 + i * 1.4, h('b', {}, a.k), h('span', {}, a.v))))
      )
    };
  },
  compare(s) {
    const col = (c, d, strong) =>
      rv('div', { class: `cmp-col${strong ? ' strong' : ''}` }, d, h('b', {}, c.head), h('ul', {}, c.items.map((it, i) => rv('li', {}, d + 0.5 + i * 0.7, it))));
    return {
      duration: 10 * SEC,
      el: h('div', { class: 'cine-body' }, ...head(s), h('div', { class: 'cine-compare' }, col(s.left, 0.8, false), rv('div', { class: 'cmp-vs' }, 2.8, '→'), col(s.right, 3.2, true)))
    };
  },
  agents(s) {
    return {
      duration: 10 * SEC,
      el: h(
        'div',
        { class: 'cine-body' },
        ...head(s),
        h(
          'div',
          { class: 'cine-agents' },
          rv('div', { class: 'agents-hub' }, 0.6, portrait('player', 'small'), h('b', {}, '탐정 (리더)'), h('span', {}, '맡기고 · 검증하고 · 판단한다')),
          h(
            'div',
            { class: 'agents-list' },
            Object.entries(s.examples).map(([id, ex], i) =>
              rv('div', { class: 'agent-card', style: `--agent:${AI.agents[id].color}` }, 1.4 + i * 0.9, agentTag(id), h('b', {}, AI.agents[id].name), h('span', {}, ex))
            )
          )
        ),
        rv('p', { class: 'cine-caption left' }, 4.4, s.caption)
      )
    };
  },
  mistakes(s) {
    return {
      duration: (s.cases.length * 3.4 + 4) * SEC,
      el: h(
        'div',
        { class: 'cine-body' },
        ...head(s),
        h(
          'div',
          { class: 'cine-cleared' },
          s.cases.map((c, i) =>
            rv(
              'div',
              { class: 'cleared-card mistake' },
              0.8 + i * 3.4,
              agentTag(c.agent),
              h('div', {}, h('p', { class: 'ai-said' }, `“${c.said}”`), rv('p', { class: 'ai-truth' }, 2.2 + i * 3.4, c.truth)),
              rv('span', { class: 'cleared-stamp wrong' }, 1.8 + i * 3.4, '그럴듯한 오답')
            )
          )
        )
      )
    };
  },
  blindspot(s) {
    return {
      duration: 10 * SEC,
      el: h(
        'div',
        { class: 'cine-body' },
        ...head(s),
        h(
          'div',
          { class: 'cine-bubbles' },
          rv('div', { class: 'bubble ai' }, 0.8, h('div', { class: 'bubble-who' }, agentTag('doc'), AI.agents.doc.name), h('p', {}, s.ai)),
          rv('div', { class: 'bubble human' }, 3.2, h('div', { class: 'bubble-who' }, portrait('player', 'tiny'), '탐정'), h('p', {}, s.human))
        ),
        rv('p', { class: 'cine-caption left' }, 5.6, s.caption)
      )
    };
  },
  loop(s) {
    return {
      duration: 9 * SEC,
      el: h(
        'div',
        { class: 'cine-body' },
        ...head(s),
        h(
          'div',
          { class: 'cine-loop' },
          s.steps.flatMap((st, i) => [
            rv('div', { class: 'loop-step' }, 0.8 + i * 1.2, h('span', { class: 'loop-n' }, String(i + 1)), h('b', {}, st.head), h('span', {}, st.body)),
            i < s.steps.length - 1 ? rv('div', { class: 'flow-arrow', 'aria-hidden': 'true' }, 1.4 + i * 1.2, '') : null
          ])
        ),
        rv('p', { class: 'cine-caption left' }, 4.6, s.caption)
      )
    };
  },
  story(s) {
    return {
      duration: 11 * SEC,
      el: h(
        'div',
        { class: 'cine-body' },
        ...head(s),
        h(
          'div',
          { class: 'cine-story' },
          rv('div', { class: 'story-card planned' }, 0.8, h('b', {}, s.planned.head), h('span', {}, s.planned.body)),
          rv('div', { class: 'story-trigger' }, 2.6, s.trigger),
          rv('div', { class: 'story-card actual' }, 3.6, h('b', {}, s.actual.head), h('span', {}, s.actual.body))
        ),
        rv('p', { class: 'cine-caption left' }, 5.6, s.caption)
      )
    };
  },
  yourplay(s) {
    const r = aiReview();
    const msg =
      r.calls === 0
        ? '이번 플레이에서는 AI에게 맡기지 않았다. 다음엔 로비의 AI 분석 콘솔을 써 보자.'
        : r.adoptedWrong > 0
          ? `그럴듯한 오답 ${r.adoptedWrong}개를 그대로 채택했다. AI의 말은 증거로 확인한 뒤에 믿자.`
          : r.misleading > 0
            ? '그럴듯한 오답을 받고도 채택하지 않았다. 검증하는 리더의 모습이다.'
            : '맡긴 분석을 증거와 함께 활용했다.';
    const stat = (n, label, d, cls = '') => rv('div', { class: `play-stat ${cls}` }, d, h('b', {}, String(n)), h('span', {}, label));
    return {
      duration: 8 * SEC,
      el: h(
        'div',
        { class: 'cine-body' },
        ...head(s),
        h('div', { class: 'cine-stats' }, stat(r.calls, 'AI에게 맡긴 분석', 0.6), stat(r.items.length - r.misleading, '맞는 분석', 1.1, 'ok'), stat(r.misleading, '그럴듯한 오답', 1.6, 'bad'), stat(r.adoptedWrong, '오답을 채택', 2.1, r.adoptedWrong ? 'bad' : 'ok')),
        rv('p', { class: 'cine-caption left' }, 3, msg)
      )
    };
  },
  narration(s) {
    const step = 2.4;
    return {
      duration: (s.paragraphs.length * step + 4) * SEC,
      el: h('div', { class: 'cine-body' }, ...head(s), ...s.paragraphs.map((p, i) => rv('p', { class: 'cine-line narr' }, 0.8 + i * step, p)))
    };
  },
  lessons(s) {
    const step = 1.3;
    return {
      duration: (s.items.length * step + 6) * SEC,
      sfx: 'unlock',
      el: h(
        'div',
        { class: 'cine-body' },
        rv('div', { class: 'cine-kicker' }, 0, s.kicker),
        rv('h2', { class: 'cine-h2' }, 0.2, s.title),
        h(
          'ol',
          { class: 'cine-lessons' },
          s.items.map((it, i) => rv('li', {}, 0.8 + i * step, h('b', {}, it.head), h('span', {}, it.body)))
        )
      )
    };
  }
};

/** 사건 재구성 영상 */
export function openCutscene({ onDone } = {}) {
  return playScenes({ scenes: reconstruction.scenes, label: '사건 재구성', skipLabel: '건너뛰기 (Esc)', onDone });
}

/**
 * AI 오케스트레이션 해설 영상.
 * 게임을 하지 않은 사람(메뉴·링크로 보는 팀원)에게는 '이번 플레이' 장면을 빼고 보여 준다.
 */
export function openOrchestration({ onDone } = {}) {
  const played = gameState.deduction.outcome || gameState.aiReports.length;
  const scenes = orchestration.scenes.filter((s) => s.type !== 'yourplay' || played);
  return playScenes({ scenes, label: orchestration.label, skipLabel: '닫기 (Esc)', onDone });
}

function playScenes({ scenes, label, skipLabel, onDone }) {
  const modal = {};
  const prevMusic = audio.mode;
  audio.setMode('deduction');

  let index = 0;
  let timer = null;
  let paused = false;

  const stage = h('div', { class: 'cine-stage' });
  const progress = h('div', { class: 'cine-progress' }, scenes.map(() => h('span', {}, h('i', {}))));
  const pauseBtn = h('button', { class: 'cine-btn', onclick: () => togglePause() }, '일시정지');
  const counter = h('span', { class: 'cine-count' });

  const finish = () => {
    clearTimeout(timer);
    ui.close(modal);
  };

  function show(i) {
    index = Math.max(0, Math.min(scenes.length - 1, i));
    clearTimeout(timer);
    const s = scenes[index];
    const { el, duration, sfx } = RENDER[s.type](s);
    stage.replaceChildren(el);
    audio.sfx(sfx ?? 'clue');
    counter.textContent = `${index + 1} / ${scenes.length}`;
    [...progress.children].forEach((bar, j) => {
      const fill = bar.firstChild;
      fill.style.transition = 'none';
      fill.style.width = j < index ? '100%' : '0%';
      if (j === index && !paused) {
        requestAnimationFrame(() => {
          fill.style.transition = `width ${duration}ms linear`;
          fill.style.width = '100%';
        });
      }
    });
    stage.classList.toggle('paused', paused);
    if (!paused) timer = setTimeout(() => (index < scenes.length - 1 ? show(index + 1) : null), duration);
  }

  function togglePause() {
    paused = !paused;
    pauseBtn.textContent = paused ? '재생' : '일시정지';
    show(index);
  }

  modal.el = h(
    'div',
    { class: 'ui-modal cine', role: 'dialog', 'aria-label': label },
    h('div', { class: 'cine-bar top' }, h('span', { class: 'cine-rec' }, '● REC'), h('span', {}, `CASE 026 · ${label}`)),
    stage,
    h(
      'div',
      { class: 'cine-bar bottom' },
      progress,
      h(
        'div',
        { class: 'cine-controls' },
        h('button', { class: 'cine-btn', onclick: () => show(index - 1) }, '◀ 이전'),
        pauseBtn,
        h('button', { class: 'cine-btn', onclick: () => (index < scenes.length - 1 ? show(index + 1) : finish()) }, '다음 ▶'),
        counter,
        h('button', { class: 'cine-btn skip', onclick: finish }, skipLabel)
      )
    )
  );
  modal.onKey = (e) => {
    if (e.key === 'Escape') finish();
    else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') index < scenes.length - 1 ? show(index + 1) : finish();
    else if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key.toLowerCase() === 'p') togglePause();
    else return false;
    return true;
  };
  modal.onClose = () => {
    clearTimeout(timer);
    if (prevMusic) audio.setMode(prevMusic);
    onDone?.();
  };
  ui.open(modal);
  show(0);
}
