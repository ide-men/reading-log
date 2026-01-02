/**
 * テスト用データファクトリ
 */
import { BOOK_STATUS } from '../../js/shared/constants.js';

/**
 * デフォルトの固定日時
 */
export const DEFAULT_TEST_DATE = '2024-06-15T12:00:00';
export const DEFAULT_TEST_TIMESTAMP = new Date(DEFAULT_TEST_DATE).getTime();

/**
 * テスト用の本を作成
 * @param {Object} overrides - 上書きするプロパティ
 * @returns {Object} 本オブジェクト
 */
export function createTestBook(overrides = {}) {
  const id = overrides.id ?? DEFAULT_TEST_TIMESTAMP;
  return {
    id,
    title: 'テスト本',
    status: BOOK_STATUS.READING,
    link: null,
    coverUrl: null,
    triggerNote: null,
    completionNote: null,
    reflections: [],
    readingTime: 0,
    bookmark: null,
    startedAt: null,
    completedAt: null,
    ...overrides
  };
}

/**
 * 読書中の本を作成
 * @param {Object} overrides - 上書きするプロパティ
 * @returns {Object} 本オブジェクト
 */
export function createReadingBook(overrides = {}) {
  return createTestBook({
    status: BOOK_STATUS.READING,
    startedAt: '2024-06-01',
    ...overrides
  });
}

/**
 * 読了した本を作成
 * @param {Object} overrides - 上書きするプロパティ
 * @returns {Object} 本オブジェクト
 */
export function createCompletedBook(overrides = {}) {
  return createTestBook({
    status: BOOK_STATUS.COMPLETED,
    startedAt: '2024-05-01',
    completedAt: '2024-06-10',
    ...overrides
  });
}

/**
 * 未読の本を作成
 * @param {Object} overrides - 上書きするプロパティ
 * @returns {Object} 本オブジェクト
 */
export function createUnreadBook(overrides = {}) {
  return createTestBook({
    status: BOOK_STATUS.UNREAD,
    ...overrides
  });
}

/**
 * 気になる本を作成
 * @param {Object} overrides - 上書きするプロパティ
 * @returns {Object} 本オブジェクト
 */
export function createWishlistBook(overrides = {}) {
  return createTestBook({
    status: BOOK_STATUS.WISHLIST,
    ...overrides
  });
}

/**
 * 中断した本を作成
 * @param {Object} overrides - 上書きするプロパティ
 * @returns {Object} 本オブジェクト
 */
export function createDroppedBook(overrides = {}) {
  return createTestBook({
    status: BOOK_STATUS.DROPPED,
    startedAt: '2024-05-01',
    bookmark: '3章まで読んだ',
    ...overrides
  });
}

/**
 * 読書履歴エントリを作成
 * @param {Object} overrides - 上書きするプロパティ
 * @returns {Object} 履歴エントリ
 */
export function createHistoryEntry(overrides = {}) {
  const date = overrides.date ?? DEFAULT_TEST_DATE;
  const d = new Date(date);
  return {
    d: d.toISOString(),
    m: 30,
    h: d.getHours(),
    bookId: null,
    ...overrides,
    // dateプロパティは最終結果に含めない
    date: undefined
  };
}

/**
 * 連続した読書履歴を作成
 * @param {number} days - 日数
 * @param {Date} endDate - 終了日
 * @returns {Array} 履歴エントリの配列
 */
export function createConsecutiveHistory(days, endDate = new Date(DEFAULT_TEST_DATE)) {
  const history = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - i);
    history.push(createHistoryEntry({
      date: date.toISOString(),
      m: 30
    }));
  }
  return history;
}

/**
 * テスト用の統計データを作成
 * @param {Object} overrides - 上書きするプロパティ
 * @returns {Object} 統計オブジェクト
 */
export function createTestStats(overrides = {}) {
  return {
    total: 0,
    today: 0,
    date: new Date().toDateString(),
    sessions: 0,
    firstSessionDate: null,
    ...overrides
  };
}

/**
 * テスト用のメタデータを作成
 * @param {Object} overrides - 上書きするプロパティ
 * @returns {Object} メタデータオブジェクト
 */
export function createTestMeta(overrides = {}) {
  return {
    schemaVersion: 1,
    createdAt: DEFAULT_TEST_DATE,
    ...overrides
  };
}

/**
 * テスト用の状態を作成
 * @param {Object} overrides - 上書きするプロパティ
 * @returns {Object} 状態オブジェクト
 */
export function createTestState(overrides = {}) {
  return {
    meta: createTestMeta(overrides.meta),
    stats: createTestStats(overrides.stats),
    books: overrides.books ?? [],
    history: overrides.history ?? [],
    archived: overrides.archived ?? {}
  };
}
