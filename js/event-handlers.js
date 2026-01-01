// ========================================
// イベントハンドラマップ
// ========================================
import {
  editBook,
  deleteBook,
  startReadingBook,
  acquireBook,
  moveToReading,
  openBookDetail,
  clearStudySelection,
  clearStoreSelection,
  renderStudyBooks,
  renderStoreBooks
} from './books.js';
import { openLink } from './utils.js';

// ========================================
// イベント委譲ユーティリティ
// ========================================

/**
 * イベント委譲を設定
 * @param {HTMLElement} container - イベントを設定するコンテナ要素
 * @param {string} eventType - イベントタイプ（'click'など）
 * @param {Array} handlers - ハンドラ定義の配列 [{selector, handler, stopPropagation?, preventDefault?}]
 * @param {Function} fallback - どのハンドラにもマッチしなかった場合のフォールバック
 */
export function delegateEvents(container, eventType, handlers, fallback = null) {
  container.addEventListener(eventType, (e) => {
    for (const { selector, handler, stopPropagation, preventDefault } of handlers) {
      const target = e.target.closest(selector);
      if (target) {
        if (stopPropagation) e.stopPropagation();
        if (preventDefault) e.preventDefault();
        handler(e, target);
        return;
      }
    }
    // フォールバック処理
    if (fallback) {
      fallback(e);
    }
  });
}

// ========================================
// 書斎のイベントハンドラ
// ========================================
export const studyBookListHandlers = [
  {
    selector: '[data-close-detail]',
    handler: () => {
      clearStudySelection();
      renderStudyBooks();
    }
  },
  {
    selector: '[data-start]',
    stopPropagation: true,
    handler: (e, target) => {
      clearStudySelection();
      startReadingBook(Number(target.dataset.start));
    }
  },
  {
    selector: '[data-link]',
    preventDefault: true,
    handler: (e, target) => {
      openLink(target.dataset.link);
    }
  },
  {
    selector: '[data-edit]',
    handler: (e, target) => {
      clearStudySelection();
      editBook(Number(target.dataset.edit));
    }
  },
  {
    selector: '[data-delete]',
    handler: (e, target) => {
      clearStudySelection();
      deleteBook(Number(target.dataset.delete));
    }
  }
];

export function studyBookListFallback(e) {
  const card = e.target.closest('.study-book-card');
  if (card && card.dataset.bookId) {
    openBookDetail(Number(card.dataset.bookId));
  }
}

// ========================================
// 本屋のイベントハンドラ
// ========================================
export const storeBookListHandlers = [
  {
    selector: '[data-close-detail]',
    handler: () => {
      clearStoreSelection();
      renderStoreBooks();
    }
  },
  {
    selector: '[data-to-study]',
    handler: (e, target) => {
      clearStoreSelection();
      acquireBook(Number(target.dataset.toStudy));
    }
  },
  {
    selector: '[data-to-bag]',
    handler: (e, target) => {
      clearStoreSelection();
      moveToReading(Number(target.dataset.toBag));
    }
  },
  {
    selector: '[data-link]',
    preventDefault: true,
    handler: (e, target) => {
      openLink(target.dataset.link);
    }
  },
  {
    selector: '[data-edit]',
    handler: (e, target) => {
      clearStoreSelection();
      editBook(Number(target.dataset.edit));
    }
  },
  {
    selector: '[data-delete]',
    handler: (e, target) => {
      clearStoreSelection();
      deleteBook(Number(target.dataset.delete));
    }
  }
];

export function storeBookListFallback(e) {
  const card = e.target.closest('.store-book-card');
  if (card && card.dataset.bookId) {
    openBookDetail(Number(card.dataset.bookId));
  }
}
