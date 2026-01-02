// ========================================
// Onboarding - ドメインロジック
// ========================================
import { STORAGE_KEYS } from '../shared/constants.js';

const TOTAL_STEPS = 4;

/**
 * オンボーディング完了状態を取得
 * @param {Storage} storage - localStorage互換オブジェクト
 * @returns {boolean}
 */
export function isOnboardingCompleted(storage = localStorage) {
  try {
    const data = storage.getItem(STORAGE_KEYS.onboarding);
    if (!data) return false;
    const parsed = JSON.parse(data);
    return parsed.completed === true;
  } catch {
    return false;
  }
}

/**
 * オンボーディング完了状態を保存
 * @param {Storage} storage - localStorage互換オブジェクト
 */
export function markOnboardingCompleted(storage = localStorage) {
  const data = {
    completed: true,
    completedAt: new Date().toISOString()
  };
  storage.setItem(STORAGE_KEYS.onboarding, JSON.stringify(data));
}

/**
 * 次のステップを計算
 * @param {number} currentStep - 現在のステップ（1-indexed）
 * @returns {{ nextStep: number, isLastStep: boolean }}
 */
export function getNextStep(currentStep) {
  const nextStep = currentStep + 1;
  const isLastStep = nextStep > TOTAL_STEPS;
  return {
    nextStep: isLastStep ? TOTAL_STEPS : nextStep,
    isLastStep
  };
}

/**
 * ステップ総数を取得
 * @returns {number}
 */
export function getTotalSteps() {
  return TOTAL_STEPS;
}
