// ========================================
// UI状態管理
// presentation層専用の状態管理
// ========================================
import { stateManager } from '../../core/state-manager.js';

// ========================================
// カルーセル選択
// ========================================
export function getSelectedBookId() {
  return stateManager.getSelectedBookId();
}

export function setSelectedBookId(id) {
  stateManager.setSelectedBookId(id);
}

// ========================================
// 書斎選択
// ========================================
export function getStudySelectedBookId() {
  return stateManager.getStudySelectedBookId();
}

export function setStudySelectedBookId(id) {
  stateManager.setStudySelectedBookId(id);
}

export function clearStudySelection() {
  stateManager.clearStudySelection();
}

// ========================================
// 本屋選択
// ========================================
export function getStoreSelectedBookId() {
  return stateManager.getStoreSelectedBookId();
}

export function setStoreSelectedBookId(id) {
  stateManager.setStoreSelectedBookId(id);
}

export function clearStoreSelection() {
  stateManager.clearStoreSelection();
}

// ========================================
// 書斎ステータス
// ========================================
export function getCurrentStudyStatus() {
  return stateManager.getCurrentStudyStatus();
}

export function setCurrentStudyStatus(status) {
  stateManager.setCurrentStudyStatus(status);
}

// ========================================
// 編集・削除
// ========================================
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

// ========================================
// 詳細ダイアログ
// ========================================
export function getDetailBookId() {
  return stateManager.getDetailBookId();
}

export function setDetailBookId(id) {
  stateManager.setDetailBookId(id);
}

// ========================================
// 中断確認
// ========================================
export function getDroppingBookId() {
  return stateManager.getDroppingBookId();
}

export function setDroppingBookId(id) {
  stateManager.setDroppingBookId(id);
}

// ========================================
// 読了時の感想入力
// ========================================
export function getReadingNoteBookId() {
  return stateManager.getReadingNoteBookId();
}

export function setReadingNoteBookId(id) {
  stateManager.setReadingNoteBookId(id);
}

// ========================================
// 読書終了時の付箋入力
// ========================================
export function getReadingBookmarkBookId() {
  return stateManager.getReadingBookmarkBookId();
}

export function setReadingBookmarkBookId(id) {
  stateManager.setReadingBookmarkBookId(id);
}
