import { describe, it, expect, beforeEach } from 'vitest';
import {
  isOnboardingCompleted,
  markOnboardingCompleted,
  getNextStep,
  getTotalSteps
} from '../../js/domain/onboarding.js';
import { createLocalStorageMock } from '../helpers/index.js';

describe('isOnboardingCompleted', () => {
  it('データがない場合はfalseを返す', () => {
    const storage = createLocalStorageMock();
    expect(isOnboardingCompleted(storage)).toBe(false);
  });

  it('completed: trueの場合はtrueを返す', () => {
    const storage = createLocalStorageMock({
      'rl_v1_onboarding': JSON.stringify({ completed: true })
    });
    expect(isOnboardingCompleted(storage)).toBe(true);
  });

  it('completed: falseの場合はfalseを返す', () => {
    const storage = createLocalStorageMock({
      'rl_v1_onboarding': JSON.stringify({ completed: false })
    });
    expect(isOnboardingCompleted(storage)).toBe(false);
  });

  it('不正なJSONの場合はfalseを返す', () => {
    const storage = createLocalStorageMock({
      'rl_v1_onboarding': 'invalid json'
    });
    expect(isOnboardingCompleted(storage)).toBe(false);
  });
});

describe('markOnboardingCompleted', () => {
  it('完了状態をストレージに保存する', () => {
    const storage = createLocalStorageMock();
    markOnboardingCompleted(storage);

    const saved = JSON.parse(storage.getData()['rl_v1_onboarding']);
    expect(saved.completed).toBe(true);
    expect(saved.completedAt).toBeDefined();
  });

  it('保存後はisOnboardingCompletedがtrueを返す', () => {
    const storage = createLocalStorageMock();
    markOnboardingCompleted(storage);
    expect(isOnboardingCompleted(storage)).toBe(true);
  });
});

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

  it('ステップ4の次はステップ5', () => {
    const result = getNextStep(4);
    expect(result.nextStep).toBe(5);
    expect(result.isLastStep).toBe(false);
  });

  it('ステップ5の次はステップ6', () => {
    const result = getNextStep(5);
    expect(result.nextStep).toBe(6);
    expect(result.isLastStep).toBe(false);
  });

  it('ステップ6の次はisLastStep: true', () => {
    const result = getNextStep(6);
    expect(result.isLastStep).toBe(true);
  });
});

describe('getTotalSteps', () => {
  it('ステップ総数は6', () => {
    expect(getTotalSteps()).toBe(6);
  });
});
