// ========================================
// 本のステータス遷移
// ========================================
import { BOOK_STATUS, CELEBRATION_CONFIG } from './constants.js';
import { stateManager } from './state.js';
import { showToast } from './ui.js';
import { persistAndRender } from './book-helpers.js';
import { renderBooks } from './book-rendering.js';
import { showAcquireCelebration } from './celebrations.js';

// ========================================
// wishlist → unread（書斎に入れる）
// ========================================
export function acquireBook(id) {
  const book = stateManager.getBook(id);
  if (!book) return;

  // セレブレーションを表示
  showAcquireCelebration(book, '書斎');

  // 少し待ってからステータス更新
  setTimeout(() => {
    stateManager.updateBook(id, { status: BOOK_STATUS.UNREAD });
    persistAndRender(renderBooks);
  }, CELEBRATION_CONFIG.statusUpdateDelay);
}

// ========================================
// wishlist → reading（カバンに入れる）
// ========================================
export function moveToReading(id) {
  const book = stateManager.getBook(id);
  if (!book) return;

  // セレブレーションを表示
  showAcquireCelebration(book, 'カバン');

  const today = new Date().toISOString().split('T')[0];

  // 少し待ってからステータス更新
  setTimeout(() => {
    stateManager.updateBook(id, {
      status: BOOK_STATUS.READING,
      startedAt: today
    });
    persistAndRender(renderBooks);
  }, CELEBRATION_CONFIG.statusUpdateDelay);
}

// ========================================
// unread/dropped/completed → reading（読み始める・再読！）
// ========================================
export function startReadingBook(id) {
  const book = stateManager.getBook(id);
  const today = new Date().toISOString().split('T')[0];
  const wasCompleted = book.status === BOOK_STATUS.COMPLETED;

  const updates = {
    status: BOOK_STATUS.READING,
    startedAt: today
  };

  // 読了からの再読の場合は completedAt をリセット
  if (wasCompleted) {
    updates.completedAt = null;
  }

  stateManager.updateBook(id, updates);
  persistAndRender(renderBooks);
  showToast(wasCompleted ? 'カバンに入れました！' : '読書を始めました！');
}

// ========================================
// reading → completed（読み終わった！）
// ========================================
export function completeBook(id) {
  const today = new Date().toISOString().split('T')[0];
  stateManager.updateBook(id, {
    status: BOOK_STATUS.COMPLETED,
    completedAt: today
  });
  persistAndRender(renderBooks);
  showToast('読了おめでとうございます！');
}

// ========================================
// reading → dropped（中断）
// ========================================
export function dropBook(id) {
  stateManager.updateBook(id, { status: BOOK_STATUS.DROPPED });
  persistAndRender(renderBooks);
  showToast('本を中断しました');
}
