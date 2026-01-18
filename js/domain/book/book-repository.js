// ========================================
// Book Repository
// stateManagerへのアクセスを抽象化
// ========================================
import { BOOK_STATUS, BOOK_COLORS } from '../../shared/constants.js';
import { stateManager } from '../../core/state-manager.js';
import { saveState } from '../../core/storage.js';

// ========================================
// Pure関数版（テスト用）
// ========================================

/**
 * 全ての本を取得（Pure版）
 * @param {Object} state - 状態オブジェクト
 * @returns {Book[]}
 */
export function getAllBooksPure(state) {
  return state.books;
}

/**
 * IDで本を取得（Pure版）
 * @param {Object} state - 状態オブジェクト
 * @param {number|string} id - 本のID
 * @returns {Book|undefined}
 */
export function getBookByIdPure(state, id) {
  const numId = typeof id === 'string' ? parseInt(id, 10) : id;
  return state.books.find(book => book.id === numId);
}

/**
 * ステータスで本をフィルタリング（Pure版）
 * @param {Object} state - 状態オブジェクト
 * @param {string} status - ステータス
 * @returns {Book[]}
 */
export function getBooksByStatusPure(state, status) {
  return state.books.filter(book => book.status === status);
}

/**
 * 本のカラーを取得（Pure版）
 * @param {Object} state - 状態オブジェクト
 * @param {Book} book - 本
 * @returns {string}
 */
export function getBookColorPure(state, book) {
  const bookIndex = state.books.findIndex(b => b.id === book.id);
  return BOOK_COLORS[bookIndex % BOOK_COLORS.length];
}

// ========================================
// 読み取り操作（stateManagerを使用）
// ========================================

/**
 * 全ての本を取得
 * @returns {Book[]}
 */
export function getAllBooks() {
  return getAllBooksPure(stateManager.getState());
}

/**
 * IDで本を取得
 * @param {number} id - 本のID
 * @returns {Book|undefined}
 */
export function getBookById(id) {
  return getBookByIdPure(stateManager.getState(), id);
}

/**
 * ステータスで本をフィルタリング
 * @param {string} status - ステータス
 * @returns {Book[]}
 */
export function getBooksByStatus(status) {
  return getBooksByStatusPure(stateManager.getState(), status);
}

/**
 * 本のカラーを取得（配列内のインデックスに基づく）
 * @param {Book} book - 本
 * @returns {string}
 */
export function getBookColor(book) {
  return getBookColorPure(stateManager.getState(), book);
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

