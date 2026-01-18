// ========================================
// Validator
// 汎用バリデーションユーティリティ
// ========================================

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - バリデーション成功かどうか
 * @property {string} [error] - エラーメッセージ
 */

/**
 * @typedef {Object} ValidationRule
 * @property {string} type - ルールタイプ ('required', 'maxLength', 'custom')
 * @property {string} message - エラーメッセージ
 * @property {number} [value] - 最大長などの値
 * @property {Function} [fn] - カスタム検証関数
 */

/**
 * 必須チェックルールを作成
 * @param {string} message - エラーメッセージ
 * @returns {ValidationRule}
 */
export function required(message) {
  return {
    type: 'required',
    message,
    validate: (value) => !!(value && value.trim())
  };
}

/**
 * 最大長チェックルールを作成
 * @param {number} max - 最大長
 * @param {string} message - エラーメッセージ
 * @returns {ValidationRule}
 */
export function maxLength(max, message) {
  return {
    type: 'maxLength',
    value: max,
    message,
    validate: (value) => !value || value.trim().length <= max
  };
}

/**
 * カスタム検証ルールを作成
 * @param {Function} fn - 検証関数 (value) => boolean
 * @param {string} message - エラーメッセージ
 * @returns {ValidationRule}
 */
export function custom(fn, message) {
  return {
    type: 'custom',
    message,
    validate: fn
  };
}

/**
 * バリデーターを作成
 * @param {...ValidationRule} rules - バリデーションルール
 * @returns {(value: string) => ValidationResult}
 */
export function createValidator(...rules) {
  return (value) => {
    for (const rule of rules) {
      if (!rule.validate(value)) {
        return { valid: false, error: rule.message };
      }
    }
    return { valid: true };
  };
}

/**
 * 重複チェック関数を作成（Pure版）
 * @param {Object} options
 * @param {string} options.field - 比較対象のフィールド名
 * @param {boolean} [options.caseSensitive=false] - 大文字小文字を区別するか
 * @returns {(value: string, items: any[], excludeId?: number|null) => { isDuplicate: boolean, duplicateItem?: any }}
 */
export function createDuplicateChecker({ field, caseSensitive = false }) {
  return (value, items, excludeId = null) => {
    if (!value || !value.trim()) {
      return { isDuplicate: false };
    }
    const normalizedValue = caseSensitive ? value.trim() : value.trim().toLowerCase();
    const duplicateItem = items.find(item => {
      const itemValue = caseSensitive ? item[field] : item[field].toLowerCase();
      return itemValue === normalizedValue && item.id !== excludeId;
    });
    return {
      isDuplicate: !!duplicateItem,
      duplicateItem
    };
  };
}
