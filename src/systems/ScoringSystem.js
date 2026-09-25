import gameState from './GameState.js';
import { Registry } from './Registry.js';

const rules = () => Registry.gameRules;

/** 최종 추론 진입 조건 점검. missing 에 부족한 항목을 담아 돌려준다. */
export function deductionReadiness() {
  const req = rules().deduction.requires;
  const npcTotal = Object.keys(Registry.characters).length;
  const evTotal = Object.keys(Registry.evidences).length;
  const items = [
    { label: `인물 전원과 대화 (${gameState.talkedCount()}/${npcTotal})`, ok: !req.talkedAll || gameState.talkedCount() >= npcTotal },
    { label: `증거 확보 (${gameState.evidence.length}/${evTotal})`, ok: !req.evidenceAll || gameState.evidence.length >= evTotal },
    { label: `모순 발견 (${gameState.contradictions.length}/${req.minContradictions} 이상)`, ok: gameState.contradictions.length >= req.minContradictions }
  ];
  return { ready: items.every((i) => i.ok), items };
}

/** 한 번의 지목을 판정한다. selection = { mastermind, executor, paths: [] } */
export function judge(selection) {
  const { stages } = rules().deduction;
  const pathCorrect = selection.paths.filter((p) => stages.paths.answers.includes(p)).length;
  const pathWrong = selection.paths.length - pathCorrect;
  const mastermind = selection.mastermind === stages.mastermind.answer;
  const executor = selection.executor === stages.executor.answer;
  return {
    mastermind,
    executor,
    pathCorrect,
    pathWrong,
    pathTotal: stages.paths.answers.length,
    // 배후·실행이 맞고, 결과 경로를 하나 이상 맞히고 틀린 경로가 없으면 해결로 본다(부분 점수 허용)
    solved: mastermind && executor && pathCorrect > 0 && pathWrong === 0
  };
}

/** 지목 제출: 시도 횟수를 올리고 결과(solved | retry | unsolved)를 기록한다. */
export function submitDeduction(selection) {
  const verdict = judge(selection);
  const d = gameState.deduction;
  d.attempts += 1;
  d.history.push({ selection, verdict });
  if (verdict.solved) d.outcome = 'solved';
  else if (d.attempts >= rules().deduction.maxAttempts) d.outcome = 'unsolved';
  gameState.emit();
  return { verdict, outcome: d.outcome ?? 'retry', attemptsLeft: rules().deduction.maxAttempts - d.attempts };
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** 최종 점수와 등급 */
export function computeScore() {
  const s = rules().scoring;
  const d = gameState.deduction;
  const last = d.history[d.history.length - 1]?.verdict;
  const npcs = Object.values(gameState.npcs);

  const accuracy = last
    ? Math.max(
        0,
        (last.mastermind ? s.accuracy.mastermind : 0) +
          (last.executor ? s.accuracy.executor : 0) +
          last.pathCorrect * s.accuracy.pathCorrect +
          last.pathWrong * s.accuracy.pathWrong
      )
    : 0;
  const accuracyMax = s.accuracy.mastermind + s.accuracy.executor + rules().deduction.stages.paths.answers.length * s.accuracy.pathCorrect;

  const questions = npcs.reduce((n, x) => n + x.pointsUsed, 0);
  const wasted = npcs.reduce((n, x) => n + (x.wasted ?? 0), 0);
  const efficiency = clamp(
    s.efficiency.max - Math.max(0, questions - s.efficiency.freeQuestions) * s.efficiency.perExtraQuestion - wasted * s.efficiency.perWasted,
    0,
    s.efficiency.max
  );

  const alertMax = rules().alert.max;
  const guarded = npcs.filter((x) => x.alert >= alertMax).length;
  const warned = npcs.filter((x) => x.alert >= rules().alert.warnAt && x.alert < alertMax).length;
  const alert = clamp(s.alert.max - guarded * s.alert.perGuardedNpc - warned * s.alert.perWarnedNpc, 0, s.alert.max);

  const evTotal = Object.keys(Registry.evidences).length;
  const ctTotal = Object.keys(Registry.contradictions).length;
  const rows = [
    { label: '최종 지목 정확도', value: accuracy, max: accuracyMax },
    { label: '1회 해결', value: d.outcome === 'solved' && d.attempts === 1 ? s.firstTry : 0, max: s.firstTry },
    { label: `증거 확보 (${gameState.evidence.length}/${evTotal})`, value: gameState.evidence.length * s.perEvidence, max: evTotal * s.perEvidence },
    { label: `모순 발견 (${gameState.contradictions.length}/${ctTotal})`, value: gameState.contradictions.length * s.perContradiction, max: ctTotal * s.perContradiction },
    { label: `질문 효율 (질문 ${questions}회 · 낭비 ${wasted}회)`, value: Math.round(efficiency), max: s.efficiency.max },
    { label: `경계 관리 (최고조 ${guarded}명)`, value: alert, max: s.alert.max }
  ];
  const total = rows.reduce((n, r) => n + r.value, 0);
  const max = rows.reduce((n, r) => n + r.max, 0);
  let grade = s.grades.find((g) => total >= g.min).grade;
  if (d.outcome === 'unsolved') grade = 'D';
  return { rows, total, max, grade };
}
