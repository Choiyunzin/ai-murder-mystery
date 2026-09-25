import interactions from '../data/interactions.json';
import { meets } from './Conditions.js';
import { applyEffects } from './Effects.js';

/** 소품 조사: 조건을 만족하는 첫 번째 결과를 적용한다. */
export function inspect(interactionId) {
  const data = interactions[interactionId];
  if (!data) return { lines: ['특별한 것은 없어 보인다.'], notices: [] };
  const result = data.results.find((r) => meets(r.requires)) ?? { lines: ['특별한 것은 없어 보인다.'] };
  return { lines: result.lines, notices: applyEffects(result.effects) };
}
