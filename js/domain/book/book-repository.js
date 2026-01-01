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
 * 本を追加
 * @param {Book} book - 追加する本
 */
export function addBook(book) {
  stateManager.addBook(book);
  saveState();
}

/**
 * 本を更新
 * @param {number} id - 本のID
 * @param {Object} updates - 更新内容
 */
export function updateBook(id, updates) {
  stateManager.updateBook(id, updates);
  saveState();
}

/**
 * 本を削除
 * @param {number} id - 本のID
 */
export function removeBook(id) {
  stateManager.removeBook(id);
  saveState();
}

// ========================================
// UI状態管理
// ========================================

// カルーセル選択
export function getSelectedBookId() {
  return stateManager.getSelectedBookId();
}

export function setSelectedBookId(id) {
  stateManager.setSelectedBookId(id);
}

// 書斎選択
export function getStudySelectedBookId() {
  return stateManager.getStudySelectedBookId();
}

export function setStudySelectedBookId(id) {
  stateManager.setStudySelectedBookId(id);
}

export function clearStudySelection() {
  stateManager.clearStudySelection();
}

// 本屋選択
export function getStoreSelectedBookId() {
  return stateManager.getStoreSelectedBookId();
}

export function setStoreSelectedBookId(id) {
  stateManager.setStoreSelectedBookId(id);
}

export function clearStoreSelection() {
  stateManager.clearStoreSelection();
}

// 書斎ステータス
export function getCurrentStudyStatus() {
  return stateManager.getCurrentStudyStatus();
}

export function setCurrentStudyStatus(status) {
  stateManager.setCurrentStudyStatus(status);
}

// 編集・削除
export function getEditingBookId() {
  return stateManager.getEditingBookId();
}

export function setEditingBookId(id) {
  stateManager.setEditingBookId(id);
}

export function getDeletingBookId() {
  return stateManager.getDeletingBookId();
}

export function setDeletingBookId(id) {
  stateManager.setDeletingBookId(id);
}

// 詳細ダイアログ
export function getDetailBookId() {
  return stateManager.getDetailBookId();
}

export function setDetailBookId(id) {
  stateManager.setDetailBookId(id);
}
