import { describe, it, expect, beforeEach } from 'vitest';
import {
  isOnboardingCompleted,
  markOnboardingCompleted,
  getNextStep,
  getTotalSteps
} from '../../js/domain/onboarding.js';

// ========================================
// モックストレージ
// ========================================
function createMockStorage(initialData = {}) {
  const data = { ...initialData };
  return {
    getItem: (key) => data[key] || null,
    setItem: (key, value) => { data[key] = value; },
    removeItem: (key) => { delete data[key]; },
    clear: () => { Object.keys(data).forEach(k => delete data[k]); },
    getData: () => ({ ...data })
  };
}

// ========================================
// isOnboardingCompleted
// ========================================
describe('isOnboardingCompleted', () => {
  it('データがない場合はfalseを返す', () => {
    const storage = createMockStorage();
    expect(isOnboardingCompleted(storage)).toBe(false);
  });

  it('completed: trueの場合はtrueを返す', () => {
    const storage = createMockStorage({
      'rl_v1_onboarding': JSON.stringify({ completed: true })
    });
    expect(isOnboardingCompleted(storage)).toBe(true);
  });

  it('completed: falseの場合はfalseを返す', () => {
    const storage = createMockStorage({
      'rl_v1_onboarding': JSON.stringify({ completed: false })
    });
    expect(isOnboardingCompleted(storage)).toBe(false);
  });

  it('不正なJSONの場合はfalseを返す', () => {
    const storage = createMockStorage({
      'rl_v1_onboarding': 'invalid json'
    });
    expect(isOnboardingCompleted(storage)).toBe(false);
  });
});

// ========================================
// markOnboardingCompleted
// ========================================
describe('markOnboardingCompleted', () => {
  it('完了状態をストレージに保存する', () => {
    const storage = createMockStorage();
    markOnboardingCompleted(storage);

    const saved = JSON.parse(storage.getData()['rl_v1_onboarding']);
    expect(saved.completed).toBe(true);
    expect(saved.completedAt).toBeDefined();
  });

  it('保存後はisOnboardingCompletedがtrueを返す', () => {
    const storage = createMockStorage();
    markOnboardingCompleted(storage);
    expect(isOnboardingCompleted(storage)).toBe(true);
  });
});

// ========================================
// getNextStep
// ========================================
describe('getNextStep', () => {
  it('ステップ1の次はステップ2', () => {
    const result = getNextStep(1);
    expect(result.nextStep).toBe(2);
    expect(result.isLastStep).toBe(false);
  });

  it('ステップ2の次はステップ3', () => {
    const result = getNextStep(2);
    expect(result.nextStep).toBe(3);
    expect(result.isLastStep).toBe(false);
  });

  it('ステップ3の次はステップ4', () => {
    const result = getNextStep(3);
    expect(result.nextStep).toBe(4);
    expect(result.isLastStep).toBe(false);
  });

  it('ステップ4の次はisLastStep: true', () => {
    const result = getNextStep(4);
    expect(result.isLastStep).toBe(true);
  });
});

// ========================================
// getTotalSteps
// ========================================
describe('getTotalSteps', () => {
  it('ステップ総数は4', () => {
    expect(getTotalSteps()).toBe(4);
  });
});
