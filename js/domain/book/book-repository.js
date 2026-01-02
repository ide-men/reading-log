// ========================================
// Book Repository
// stateManagerへのアクセスを抽象化
// ========================================
import { BOOK_STATUS, BOOK_COLORS } from '../../shared/constants.js';
import { stateManager } from '../../core/state-manager.js';
import { saveState } from '../../core/storage.js';

// ========================================
// 読み取り操作
// ========================================

/**
 * 全ての本を取得
 * @returns {Book[]}
 */
export function getAllBooks() {
  return stateManager.getState().books;
}

/**
 * IDで本を取得
 * @param {number} id - 本のID
 * @returns {Book|undefined}
 */
export function getBookById(id) {
  return stateManager.getBook(id);
}

/**
 * ステータスで本をフィルタリング
 * @param {string} status - ステータス
 * @returns {Book[]}
 */
export function getBooksByStatus(status) {
  const state = stateManager.getState();
  return state.books.filter(book => book.status === status);
}

/**
 * 本のカラーを取得（配列内のインデックスに基づく）
 * @param {Book} book - 本
 * @returns {string}
 */
export function getBookColor(book) {
  const bookIndex = stateManager.getState().books.findIndex(b => b.id === book.id);
  return BOOK_COLORS[bookIndex % BOOK_COLORS.length];
}

// ========================================
// 書き込み操作
// ========================================

/**
 * 本を追加（状態のみ変更、永続化なし）
 * @param {Book} book - 追加する本
 */
export function addBookToState(book) {
  stateManager.addBook(book);
}

/**
 * 本を追加
 * @param {Book} book - 追加する本
 * @param {Object} [options] - オプション
 * @param {boolean} [options.persist=true] - 永続化するかどうか
 */
export function addBook(book, { persist = true } = {}) {
  addBookToState(book);
  if (persist) saveState();
}

/**
 * 本を更新（状態のみ変更、永続化なし）
 * @param {number} id - 本のID
 * @param {Object} updates - 更新内容
 */
export function updateBookInState(id, updates) {
  stateManager.updateBook(id, updates);
}

/**
 * 本を更新
 * @param {number} id - 本のID
 * @param {Object} updates - 更新内容
 * @param {Object} [options] - オプション
 * @param {boolean} [options.persist=true] - 永続化するかどうか
 */
export function updateBook(id, updates, { persist = true } = {}) {
  updateBookInState(id, updates);
  if (persist) saveState();
}

/**
 * 本を削除（状態のみ変更、永続化なし）
 * @param {number} id - 本のID
 */
export function removeBookFromState(id) {
  stateManager.removeBook(id);
}

/**
 * 本を削除
 * @param {number} id - 本のID
 * @param {Object} [options] - オプション
 * @param {boolean} [options.persist=true] - 永続化するかどうか
 */
export function removeBook(id, { persist = true } = {}) {
  removeBookFromState(id);
  if (persist) saveState();
}

