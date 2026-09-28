import { ui, h } from './UIRoot.js';
import { Registry } from '../systems/Registry.js';
import { audio } from '../systems/AudioSystem.js';
import { portraitSrc } from '../gfx/Portraits.js';
import reconstruction from '../data/reconstruction.json';

/**
 * 엔딩의 '사건 재구성' 연출 영상. 장면 데이터는 src/data/reconstruction.json.
 * 자동 재생되며 → / Space 다음, ← 이전, P 일시정지, Esc 건너뛰기.
 */
const SEC = 1000;

function portrait(id, cls = '') {
  const { src, pixel } = portraitSrc(ui.game, id);
  const c = Registry.characters[id];
  return h('figure', { class: `cine-face ${cls}${pixel ? ' pixel' : ''}`, style: `--ring:${c.color}` }, h('img', { src, alt: c.name }));
}

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

export function openCutscene({ onDone } = {}) {
  const scenes = reconstruction.scenes;
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
    { class: 'ui-modal cine', role: 'dialog', 'aria-label': '사건 재구성' },
    h('div', { class: 'cine-bar top' }, h('span', { class: 'cine-rec' }, '● REC'), h('span', {}, 'CASE 026 · 사건 재구성')),
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
        h('button', { class: 'cine-btn skip', onclick: finish }, '리포트로 (Esc)')
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
