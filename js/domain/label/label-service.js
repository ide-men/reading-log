// ========================================
// Label Service
// ラベルのビジネスロジック
// ========================================
import { stateManager } from '../../core/state-manager.js';
import { createLabel, validateLabelName, checkDuplicateLabelNamePure } from './label-entity.js';

/**
 * ラベルを追加
 * @param {string} name - ラベル名
 * @returns {{ success: boolean, message: string, label?: Object }}
 */
export function addLabel(name) {
  const validation = validateLabelName(name);
  if (!validation.valid) {
    return { success: false, message: validation.error };
  }

  const labels = stateManager.getLabels();
  const { isDuplicate } = checkDuplicateLabelNamePure(name, labels);
  if (isDuplicate) {
    return { success: false, message: '同じ名前のラベルが既に存在します' };
  }

  const label = createLabel({ name });
  stateManager.addLabel(label);
  return { success: true, message: 'ラベルを追加しました', label };
}

/**
 * ラベルを更新
 * @param {number} id - ラベルID
 * @param {string} name - 新しいラベル名
 * @returns {{ success: boolean, message: string }}
 */
export function updateLabel(id, name) {
  const label = stateManager.getLabel(id);
  if (!label) {
    return { success: false, message: 'ラベルが見つかりません' };
  }

  const validation = validateLabelName(name);
  if (!validation.valid) {
    return { success: false, message: validation.error };
  }

  const labels = stateManager.getLabels();
  const { isDuplicate } = checkDuplicateLabelNamePure(name, labels, id);
  if (isDuplicate) {
    return { success: false, message: '同じ名前のラベルが既に存在します' };
  }

  stateManager.updateLabel(id, { name: name.trim() });
  return { success: true, message: 'ラベルを更新しました' };
}

/**
 * ラベルを削除
 * @param {number} id - ラベルID
 * @returns {{ success: boolean, message: string }}
 */
export function deleteLabel(id) {
  const label = stateManager.getLabel(id);
  if (!label) {
    return { success: false, message: 'ラベルが見つかりません' };
  }

  stateManager.removeLabel(id);
  return { success: true, message: 'ラベルを削除しました' };
}

/**
 * ラベルを使用している本の数を取得
 * @param {number} labelId - ラベルID
 * @returns {number}
 */
export function getLabelUsageCount(labelId) {
  const books = stateManager.getState().books;
  return books.filter(book => book.labelIds && book.labelIds.includes(labelId)).length;
}

/**
 * すべてのラベルを取得
 * @returns {Array}
 */
export function getAllLabels() {
  return stateManager.getLabels();
}

/**
 * ラベルを取得
 * @param {number} id - ラベルID
 * @returns {Object|undefined}
 */
export function getLabelById(id) {
  return stateManager.getLabel(id);
}

/**
 * 本にラベルを追加
 * @param {number} bookId - 本のID
 * @param {number} labelId - ラベルID
 * @returns {{ success: boolean, message: string }}
 */
export function addLabelToBook(bookId, labelId) {
  const book = stateManager.getBook(bookId);
  if (!book) {
    return { success: false, message: '本が見つかりません' };
  }

  const label = stateManager.getLabel(labelId);
  if (!label) {
    return { success: false, message: 'ラベルが見つかりません' };
  }

  const labelIds = book.labelIds || [];
  if (labelIds.includes(labelId)) {
    return { success: false, message: '既にこのラベルが付いています' };
  }

  stateManager.updateBook(bookId, { labelIds: [...labelIds, labelId] });
  return { success: true, message: 'ラベルを追加しました' };
}

/**
 * 本からラベルを削除
 * @param {number} bookId - 本のID
 * @param {number} labelId - ラベルID
 * @returns {{ success: boolean, message: string }}
 */
export function removeLabelFromBook(bookId, labelId) {
  const book = stateManager.getBook(bookId);
  if (!book) {
    return { success: false, message: '本が見つかりません' };
  }

  const labelIds = book.labelIds || [];
  if (!labelIds.includes(labelId)) {
    return { success: false, message: 'このラベルは付いていません' };
  }

  stateManager.updateBook(bookId, { labelIds: labelIds.filter(id => id !== labelId) });
  return { success: true, message: 'ラベルを削除しました' };
}

/**
 * 本のラベルを設定（上書き）
 * @param {number} bookId - 本のID
 * @param {number[]} labelIds - ラベルIDの配列
 * @returns {{ success: boolean, message: string }}
 */
export function setBookLabels(bookId, labelIds) {
  const book = stateManager.getBook(bookId);
  if (!book) {
    return { success: false, message: '本が見つかりません' };
  }

  stateManager.updateBook(bookId, { labelIds });
  return { success: true, message: 'ラベルを更新しました' };
}

/**
 * 本のラベル情報を取得
 * @param {number} bookId - 本のID
 * @returns {Array}
 */
export function getBookLabels(bookId) {
  const book = stateManager.getBook(bookId);
  if (!book || !book.labelIds) return [];

  const allLabels = stateManager.getLabels();
  return book.labelIds
    .map(id => allLabels.find(l => l.id === id))
    .filter(Boolean);
}
