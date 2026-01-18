// ========================================
// Label Entity
// ラベルのデータ構造・バリデーション・ヘルパー
// ========================================
import { generateUniqueId, resetIdCounter as resetSharedIdCounter } from '../../shared/id-generator.js';
import { createValidator, required, maxLength, createDuplicateChecker } from '../common/validator.js';

// ========================================
// Label型定義（JSDoc）
// ========================================

/**
 * @typedef {Object} Label
 * @property {number} id - ユニークID（タイムスタンプ）
 * @property {string} name - ラベル名
 */

/**
 * 新しいLabelオブジェクトを作成
 * @param {Object} params - ラベルのデータ
 * @param {string} params.name - ラベル名
 * @param {Object} [options] - オプション
 * @param {Function} [options.now] - 現在時刻を取得する関数（テスト用）
 * @returns {Label}
 */
export function createLabel({ name }, options = {}) {
  const { now = () => new Date() } = options;
  const currentDate = now();

  return {
    id: generateUniqueId(currentDate),
    name: name.trim()
  };
}

/**
 * ラベル名をバリデート
 * @param {string} name - ラベル名
 * @returns {{ valid: boolean, error?: string }}
 */
export const validateLabelName = createValidator(
  required('ラベル名を入力してください'),
  maxLength(20, 'ラベル名は20文字以内で入力してください')
);

// 重複チェッカー（内部で使用）
const checkNameDuplicate = createDuplicateChecker({ field: 'name', caseSensitive: false });

/**
 * ラベル名の重複をチェック（Pure版）
 * @param {string} name - チェックするラベル名
 * @param {Label[]} labels - 既存のラベルの配列
 * @param {number|null} [excludeId] - 除外するラベルID（編集時用）
 * @returns {{ isDuplicate: boolean, duplicateLabel?: Label }}
 */
export function checkDuplicateLabelNamePure(name, labels, excludeId = null) {
  const result = checkNameDuplicate(name, labels, excludeId);
  return {
    isDuplicate: result.isDuplicate,
    duplicateLabel: result.duplicateItem
  };
}

/**
 * ID生成カウンターをリセット（テスト用）
 */
export function resetIdCounter() {
  resetSharedIdCounter();
}
