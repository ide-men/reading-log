// ========================================
// 本の選択状態管理
// ========================================
import { BOOK_STATUS } from './constants.js';

// 編集・削除中の本ID
let deletingBookId = null;
let editingBookId = null;

// カルーセルで選択中の本ID
let selectedBookId = null;

// 書斎の現在選択中のステータス
let currentStudyStatus = BOOK_STATUS.COMPLETED;

// 書斎で選択中の本ID
let studySelectedBookId = null;

// 本屋で選択中の本ID
let storeSelectedBookId = null;

// 詳細ダイアログで開いている本ID
let detailBookId = null;

// ========================================
// Getter / Setter
// ========================================

export function getEditingBookId() {
  return editingBookId;
}

export function setEditingBookId(id) {
  editingBookId = id;
}

export function getDeletingBookId() {
  return deletingBookId;
}

export function setDeletingBookId(id) {
  deletingBookId = id;
}

export function getCurrentStudyStatus() {
  return currentStudyStatus;
}

export function setCurrentStudyStatus(status) {
  currentStudyStatus = status;
}

export function getSelectedBookId() {
  return selectedBookId;
}

export function setSelectedBookId(id) {
  selectedBookId = id;
}

export function getStudySelectedBookId() {
  return studySelectedBookId;
}

export function setStudySelectedBookId(id) {
  studySelectedBookId = id;
}

export function clearStudySelection() {
  studySelectedBookId = null;
}

export function getStoreSelectedBookId() {
  return storeSelectedBookId;
}

export function setStoreSelectedBookId(id) {
  storeSelectedBookId = id;
}

export function clearStoreSelection() {
  storeSelectedBookId = null;
}

export function getDetailBookId() {
  return detailBookId;
}

export function setDetailBookId(id) {
  detailBookId = id;
}
