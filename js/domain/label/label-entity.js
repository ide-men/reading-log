// ========================================
// Label Entity
// ラベルのデータ構造・バリデーション・ヘルパー
// ========================================

// ========================================
// Label型定義（JSDoc）
// ========================================

/**
 * @typedef {Object} Label
 * @property {number} id - ユニークID（タイムスタンプ）
 * @property {string} name - ラベル名
 */

// ID生成用のカウンター（同一ミリ秒内の重複を防止）
let lastIdTimestamp = 0;
let idCounter = 0;

/**
 * ユニークなIDを生成
 * @param {Date} date - 基準日時
 * @returns {number}
 */
function generateUniqueId(date) {
  const timestamp = date.getTime();
  if (timestamp === lastIdTimestamp) {
    idCounter++;
  } else {
    lastIdTimestamp = timestamp;
    idCounter = 0;
  }
  return timestamp * 1000 + idCounter;
}

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
export function validateLabelName(name) {
  if (!name || !name.trim()) {
    return { valid: false, error: 'ラベル名を入力してください' };
  }
  if (name.trim().length > 20) {
    return { valid: false, error: 'ラベル名は20文字以内で入力してください' };
  }
  return { valid: true };
}

/**
 * ラベル名の重複をチェック（Pure版）
 * @param {string} name - チェックするラベル名
 * @param {Label[]} labels - 既存のラベルの配列
 * @param {number|null} [excludeId] - 除外するラベルID（編集時用）
 * @returns {{ isDuplicate: boolean, duplicateLabel?: Label }}
 */
export function checkDuplicateLabelNamePure(name, labels, excludeId = null) {
  if (!name || !name.trim()) {
    return { isDuplicate: false };
  }
  const normalizedName = name.trim().toLowerCase();
  const duplicateLabel = labels.find(label =>
    label.name.toLowerCase() === normalizedName &&
    label.id !== excludeId
  );
  return {
    isDuplicate: !!duplicateLabel,
    duplicateLabel
  };
}

/**
 * ID生成カウンターをリセット（テスト用）
 */
export function resetIdCounter() {
  lastIdTimestamp = 0;
  idCounter = 0;
}
