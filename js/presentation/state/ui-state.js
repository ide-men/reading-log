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
