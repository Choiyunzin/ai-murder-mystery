import gameState from './GameState.js';
import { meets } from './Conditions.js';
import { Registry } from './Registry.js';
import aiData from '../data/aiAgents.json';

/**
 * AI 분석 콘솔 (AI 오케스트레이션 체험).
 * 탐정이 AI 요원에게 분석을 맡기고(위임), 결과를 채택/보류(검증·판단)한다.
 * 보고서 내용과 정답 여부는 src/data/aiAgents.json 에 미리 작성되어 있다.
 */
export const AI = aiData;

export const reportKey = (agent, input) => `${agent}:${input}`;

export function callsUsed() {
  return gameState.aiReports.length;
}

export function callsLeft() {
  return AI.calls - callsUsed();
}

export function findReport(key) {
  return gameState.aiReports.find((r) => r.key === key);
}

/** 요원별로 맡길 수 있는 자료 목록과 상태 */
export function inputsFor(agentId) {
  const agent = AI.agents[agentId];
  if (agent.inputs === 'npc') {
    return Object.values(Registry.characters).map((c) => {
      const key = reportKey(agentId, c.id);
      const report = AI.reports[key];
      const ready = gameState.npc(c.id).greeted && report && meets(report.requires);
      return { id: c.id, label: `${c.name}의 진술`, key, done: !!findReport(key), available: gameState.npc(c.id).greeted, ready };
    });
  }
  return Object.entries(Registry.evidences).map(([id, ev]) => {
    const key = reportKey(agentId, id);
    const report = AI.reports[key];
    const owned = gameState.hasEvidence(id);
    return { id, label: owned ? ev.title : '??? (아직 확보하지 못한 증거)', key, done: !!findReport(key), available: owned, ready: owned && !!report };
  });
}

/**
 * 분석 맡기기. 새 보고서면 호출 1회를 쓴다. 이미 받은 보고서는 다시 보여 주기만 한다.
 * 자료가 부족하면 호출을 쓰지 않고 안내 문구만 돌려준다.
 */
export function runAnalysis(agentId, inputId) {
  const key = reportKey(agentId, inputId);
  const report = AI.reports[key];
  const existing = findReport(key);
  if (existing) return { status: 'cached', key, report };
  if (!report || !meets(report.requires)) {
    const msg = AI.agents[agentId].inputs === 'npc' ? AI.fallback.npc : AI.fallback.data;
    return { status: 'insufficient', key, lines: [msg] };
  }
  if (callsLeft() <= 0) return { status: 'noCalls', key, lines: ['AI 호출 횟수를 모두 썼습니다.'] };
  gameState.aiReports.push({ key, agent: agentId, input: inputId, adopted: null });
  gameState.emit();
  return { status: 'new', key, report };
}

/** 검증 후 판단: 채택(true) 또는 보류(false) */
export function judgeReport(key, adopted) {
  const r = findReport(key);
  if (!r) return;
  r.adopted = adopted;
  gameState.emit();
}

/** 엔딩 복기용 요약 */
export function aiReview() {
  const items = gameState.aiReports.map((r) => {
    const data = AI.reports[r.key];
    const agent = AI.agents[r.agent];
    const inputLabel = agent.inputs === 'npc' ? `${Registry.characters[r.input].name}의 진술` : Registry.evidences[r.input].title;
    return { ...r, agent, inputLabel, verdict: data.verdict, note: data.note };
  });
  return {
    items,
    calls: items.length,
    misleading: items.filter((i) => i.verdict === 'misleading').length,
    adoptedWrong: items.filter((i) => i.verdict === 'misleading' && i.adopted === true).length,
    heldWrong: items.filter((i) => i.verdict === 'misleading' && i.adopted === false).length,
    adoptedRight: items.filter((i) => i.verdict === 'correct' && i.adopted === true).length
  };
}

/** 문서 요약 AI 가 놓친 '문서 부재'를 사람이 찾아냈을 때의 알림 */
export function blindSpotNotice() {
  return findReport(reportKey('doc', 'ev_memo'))
    ? { type: 'clue', text: 'AI는 "문서 없음 = 변경 없음"으로 봤지만, 당신은 구두 지시를 의심했다.' }
    : null;
}
