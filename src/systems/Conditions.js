import gameState from './GameState.js';

/**
 * 데이터 파일의 requires 조건을 평가한다.
 * { evidence, clues, statements, contradictions, flags } 는 모두 보유해야 하고,
 * any: [조건...] 는 하나 이상 충족, not: 조건 은 충족하지 않아야 한다.
 */
export function meets(req, state = gameState) {
  if (!req) return true;
  const all = (ids, has) => (ids ?? []).every(has);
  return (
    all(req.evidence, (id) => state.has('evidence', id)) &&
    all(req.clues, (id) => state.has('clues', id)) &&
    all(req.statements, (id) => state.has('statements', id)) &&
    all(req.contradictions, (id) => state.has('contradictions', id)) &&
    all(req.flags, (id) => !!state.flags[id]) &&
    (!req.any || req.any.some((r) => meets(r, state))) &&
    (!req.not || !meets(req.not, state))
  );
}
