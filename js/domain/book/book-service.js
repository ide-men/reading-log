// ========================================
// Book Service
// 本に関するビジネスロジック（CRUD・ステータス遷移）
// ========================================
import { BOOK_STATUS, CELEBRATION_CONFIG } from '../../shared/constants.js';
import { getCoverUrlFromLink } from '../../shared/utils.js';
import { eventBus, Events } from '../../shared/event-bus.js';
import * as bookRepository from './book-repository.js';
import { createBook, validateBookTitle } from './book-entity.js';

// ========================================
// 追加時のメッセージ
// ========================================
const ADD_BOOK_MESSAGES = {
  [BOOK_STATUS.READING]: 'カバンに追加しました',
  [BOOK_STATUS.UNREAD]: '積読に追加しました',
  [BOOK_STATUS.COMPLETED]: '読了に追加しました',
  [BOOK_STATUS.DROPPED]: '中断に追加しました',
  [BOOK_STATUS.WISHLIST]: '本屋に追加しました'
};

// ========================================
// 本の追加
// ========================================

/**
 * 本を追加する
 * @param {Object} params - 本のデータ
 * @param {string} params.title - タイトル
 * @param {string} [params.link] - リンク
 * @param {string} [params.note] - メモ
 * @param {string} [params.status] - ステータス
 * @returns {{ success: boolean, message: string, book?: Book, shortUrlWarning?: boolean }}
 */
export function addBook({ title, link, note, status = BOOK_STATUS.READING }) {
  // バリデーション
  const validation = validateBookTitle(title);
  if (!validation.valid) {
    return { success: false, message: validation.error };
  }

  // 短縮URLフラグ
  let shortUrlWarning = false;

  // 本を作成
  const book = createBook(
    { title, link, note, status },
    { onShortUrl: () => { shortUrlWarning = true; } }
  );

  // 保存
  bookRepository.addBook(book);

  return {
    success: true,
    message: ADD_BOOK_MESSAGES[status] || '本を追加しました',
    book,
    shortUrlWarning
  };
}

// ========================================
// 本の編集
// ========================================

/**
 * 本を編集する
 * @param {number} id - 本のID
 * @param {Object} updates - 更新内容
 * @param {string} [updates.title] - タイトル
 * @param {string} [updates.link] - リンク
 * @param {string} [updates.status] - ステータス
 * @param {string} [updates.note] - メモ
 * @returns {{ success: boolean, message: string, shortUrlWarning?: boolean }}
 */
export function editBook(id, updates) {
  const book = bookRepository.getBookById(id);
  if (!book) {
    return { success: false, message: '本が見つかりません' };
  }

  // タイトルのバリデーション
  if (updates.title !== undefined) {
    const validation = validateBookTitle(updates.title);
    if (!validation.valid) {
      return { success: false, message: validation.error };
    }
  }

  // リンクが変更された場合はカバー画像を再取得
  let shortUrlWarning = false;
  if (updates.link !== undefined && updates.link !== book.link) {
    updates.coverUrl = getCoverUrlFromLink(updates.link, () => {
      shortUrlWarning = true;
    });
  }

  bookRepository.updateBook(id, updates);

  return {
    success: true,
    message: '保存しました',
    shortUrlWarning
  };
}

// ========================================
// 本の削除
// ========================================

/**
 * 本を削除する
 * @param {number} id - 本のID
 * @returns {{ success: boolean, message: string }}
 */
export function deleteBook(id) {
  const book = bookRepository.getBookById(id);
  if (!book) {
    return { success: false, message: '本が見つかりません' };
  }

  bookRepository.removeBook(id);

  return {
    success: true,
    message: '削除しました'
  };
}

// ========================================
// ステータス遷移
// ========================================

/**
 * wishlist → unread（書斎に入れる）
 * @param {number} id - 本のID
 * @returns {{ success: boolean, book?: Book, destination: string }}
 */
export function acquireBook(id) {
  const book = bookRepository.getBookById(id);
  if (!book) {
    return { success: false };
  }

  // 即座に更新せず、セレブレーション後に更新するためのデータを返す
  return {
    success: true,
    book,
    destination: '書斎',
    applyUpdate: () => {
      bookRepository.updateBook(id, { status: BOOK_STATUS.UNREAD });
      eventBus.emit(Events.BOOK_STATUS_CHANGED, { id, from: book.status, to: BOOK_STATUS.UNREAD });
    }
  };
}

/**
 * wishlist → reading（カバンに入れる）
 * @param {number} id - 本のID
 * @returns {{ success: boolean, book?: Book, destination: string }}
 */
export function moveToReading(id) {
  const book = bookRepository.getBookById(id);
  if (!book) {
    return { success: false };
  }

  const today = new Date().toISOString().split('T')[0];

  return {
    success: true,
    book,
    destination: 'カバン',
    applyUpdate: () => {
      bookRepository.updateBook(id, {
        status: BOOK_STATUS.READING,
        startedAt: today
      });
      eventBus.emit(Events.BOOK_STATUS_CHANGED, { id, from: book.status, to: BOOK_STATUS.READING });
    }
  };
}

/**
 * unread/dropped/completed → reading（読み始める・再読！）
 * @param {number} id - 本のID
 * @returns {{ success: boolean, message: string }}
 */
export function startReadingBook(id) {
  const book = bookRepository.getBookById(id);
  if (!book) {
    return { success: false, message: '本が見つかりません' };
  }

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

  bookRepository.updateBook(id, updates);
  eventBus.emit(Events.BOOK_STATUS_CHANGED, { id, from: book.status, to: BOOK_STATUS.READING });

  return {
    success: true,
    message: wasCompleted ? 'カバンに入れました！' : '読書を始めました！'
  };
}

/**
 * reading → completed（読み終わった！）
 * @param {number} id - 本のID
 * @returns {{ success: boolean, book?: Book, destination: string }}
 */
export function completeBook(id) {
  const book = bookRepository.getBookById(id);
  if (!book) {
    return { success: false };
  }

  const today = new Date().toISOString().split('T')[0];

  return {
    success: true,
    book,
    destination: '読了',
    applyUpdate: () => {
      bookRepository.updateBook(id, {
        status: BOOK_STATUS.COMPLETED,
        completedAt: today
      });
      eventBus.emit(Events.BOOK_STATUS_CHANGED, { id, from: book.status, to: BOOK_STATUS.COMPLETED });
    }
  };
}

/**
 * reading → dropped（中断）
 * @param {number} id - 本のID
 * @param {string|null} [bookmark] - 付箋メモ（どこまで読んだか等）
 * @returns {{ success: boolean, message: string }}
 */
export function dropBook(id, bookmark = null) {
  const book = bookRepository.getBookById(id);
  if (!book) {
    return { success: false, message: '本が見つかりません' };
  }

  const updates = { status: BOOK_STATUS.DROPPED };
  if (bookmark) {
    updates.bookmark = bookmark;
  }

  bookRepository.updateBook(id, updates);
  eventBus.emit(Events.BOOK_STATUS_CHANGED, { id, from: book.status, to: BOOK_STATUS.DROPPED });

  return {
    success: true,
    message: '本を中断しました'
  };
}

// ========================================
// クエリ（リポジトリへの委譲）
// ========================================

export const getBookById = bookRepository.getBookById;
export const getBooksByStatus = bookRepository.getBooksByStatus;
export const getAllBooks = bookRepository.getAllBooks;
export const getBookColor = bookRepository.getBookColor;
