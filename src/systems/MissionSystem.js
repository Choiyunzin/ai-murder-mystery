import { meets } from './Conditions.js';
import { Registry } from './Registry.js';

/** 아직 끝나지 않은 첫 번째 목표 문구 */
export function currentObjective() {
  return Registry.gameRules.objectives.find((o) => !meets(o.done))?.text ?? '';
}
