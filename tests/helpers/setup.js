/**
 * テスト用セットアップユーティリティ
 */
import { vi } from 'vitest';
import { DEFAULT_TEST_DATE } from './test-data.js';

/**
 * フェイクタイマーを設定
 * @param {string|Date} date - 固定する日時
 */
export function setupFakeTimers(date = DEFAULT_TEST_DATE) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(date));
}

/**
 * フェイクタイマーを解除
 */
export function teardownFakeTimers() {
  vi.useRealTimers();
}

/**
 * 全てのモックをクリア
 */
export function clearAllMocks() {
  vi.clearAllMocks();
}

/**
 * モジュールをリセット（動的インポート用）
 */
export function resetModules() {
  vi.resetModules();
}

/**
 * beforeEach用の共通セットアップ
 * @param {Object} options - オプション
 * @param {boolean} options.fakeTimers - フェイクタイマーを使用するか
 * @param {string|Date} options.date - 固定する日時
 * @returns {Function} クリーンアップ関数
 */
export function setupTest(options = {}) {
  const { fakeTimers = false, date = DEFAULT_TEST_DATE } = options;

  vi.clearAllMocks();

  if (fakeTimers) {
    setupFakeTimers(date);
  }

  return () => {
    if (fakeTimers) {
      teardownFakeTimers();
    }
  };
}

/**
 * コンソールエラーを抑制
 * @returns {Function} 復元関数
 */
export function suppressConsoleError() {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  return () => spy.mockRestore();
}

/**
 * コンソールログを抑制
 * @returns {Function} 復元関数
 */
export function suppressConsoleLog() {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  return () => spy.mockRestore();
}
