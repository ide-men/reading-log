// ========================================
// ID Generator
// ユニークID生成ユーティリティ
// ========================================

// ID生成用のカウンター（同一ミリ秒内の重複を防止）
let lastIdTimestamp = 0;
let idCounter = 0;

/**
 * ユニークなIDを生成
 * 同一ミリ秒内での連続呼び出しでも重複しないIDを生成
 * @param {Date} [date] - 基準日時（省略時は現在時刻）
 * @returns {number}
 */
export function generateUniqueId(date = new Date()) {
  const timestamp = date.getTime();
  if (timestamp === lastIdTimestamp) {
    // 同じミリ秒内なのでカウンターを増加
    idCounter++;
  } else {
    // 新しいミリ秒なのでカウンターをリセット
    lastIdTimestamp = timestamp;
    idCounter = 0;
  }
  // タイムスタンプ + カウンター（最大999まで対応）
  return timestamp * 1000 + idCounter;
}

/**
 * IDからタイムスタンプを抽出
 * 新フォーマット（timestamp * 1000 + counter）と旧フォーマット（timestamp）の両方に対応
 * @param {number} id - エンティティのID
 * @returns {number} - タイムスタンプ（ミリ秒）
 */
export function extractTimestampFromId(id) {
  return id > 1e15 ? Math.floor(id / 1000) : id;
}

/**
 * ID生成カウンターをリセット（テスト用）
 */
export function resetIdCounter() {
  lastIdTimestamp = 0;
  idCounter = 0;
}
