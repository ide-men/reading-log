// ========================================
// Book Entity
// 本のデータ構造・バリデーション・ヘルパー
// ========================================
import { BOOK_STATUS, BOOK_COLORS } from '../../shared/constants.js';
import { escapeHtml, adjustColor, getCoverUrlFromLink, toLocalDateString } from '../../shared/utils.js';
import { generateUniqueId, extractTimestampFromId, resetIdCounter as resetSharedIdCounter } from '../../shared/id-generator.js';
import { createValidator, required, createDuplicateChecker } from '../common/validator.js';

// ========================================
// Book型定義（JSDoc）
// ========================================

/**
 * @typedef {Object} Reflection
 * @property {string} date - 振り返り日（YYYY-MM-DD）
 * @property {string} note - その時の気づき
 */

/**
 * @typedef {Object} Book
 * @property {number} id - ユニークID（タイムスタンプ）
 * @property {string} title - 本のタイトル
 * @property {string|null} link - Amazon等のリンク
 * @property {string|null} coverUrl - 表紙画像URL
 * @property {string} status - ステータス（BOOK_STATUS値）
 * @property {string|null} startedAt - 読み始めた日（YYYY-MM-DD）
 * @property {string|null} completedAt - 読了日（YYYY-MM-DD）
 * @property {string|null} triggerNote - きっかけ（なぜこの本？）
 * @property {string|null} completionNote - 読了時の感想（何が変わった？）
 * @property {Reflection[]} reflections - 振り返りの履歴
 * @property {number} readingTime - 累計読書時間（分）
 * @property {string|null} bookmark - 栞メモ（どこまで読んだか等）
 * @property {number[]} labelIds - ラベルIDの配列
 */

// ========================================
// Book生成
// ========================================

/**
 * @typedef {Object} CreateBookOptions
 * @property {Function} [onShortUrl] - 短縮URL検出時のコールバック
 * @property {Function} [now] - 現在時刻を取得する関数（テスト用）
 */

/**
 * 新しいBookオブジェクトを作成
 * @param {Object} params - 本のデータ
 * @param {string} params.title - タイトル
 * @param {string} [params.link] - リンク
 * @param {string} [params.triggerNote] - きっかけ
 * @param {string} [params.status] - ステータス
 * @param {CreateBookOptions} [options] - オプション
 * @returns {Book}
 */
export function createBook({ title, link, triggerNote, status = BOOK_STATUS.READING }, options = {}) {
  const { now = () => new Date() } = options;
  const currentDate = now();
  const coverUrl = getCoverUrlFromLink(link);
  const today = toLocalDateString(currentDate);

  // ステータスに応じて日付を設定
  let startedAt = null;
  let completedAt = null;
  if (status === BOOK_STATUS.READING) {
    startedAt = today;
  } else if (status === BOOK_STATUS.COMPLETED) {
    completedAt = today;
  }

  return {
    id: generateUniqueId(currentDate),
    title,
    link: link || null,
    coverUrl,
    status,
    startedAt,
    completedAt,
    triggerNote: triggerNote || null,
    completionNote: null,
    reflections: [],
    readingTime: 0,
    bookmark: null,
    labelIds: []
  };
}

// ========================================
// バリデーション
// ========================================

/**
 * 本のタイトルをバリデート
 * @param {string} title - タイトル
 * @returns {{ valid: boolean, error?: string }}
 */
export const validateBookTitle = createValidator(
  required('タイトルを入力してください')
);

/**
 * ステータスが有効かチェック
 * @param {string} status - ステータス
 * @returns {boolean}
 */
export function isValidStatus(status) {
  return Object.values(BOOK_STATUS).includes(status);
}

// 重複チェッカー（内部で使用）
const checkTitleDuplicate = createDuplicateChecker({ field: 'title', caseSensitive: false });

/**
 * タイトルの重複をチェック（Pure版）
 * @param {string} title - チェックするタイトル
 * @param {Book[]} books - 既存の本の配列
 * @param {number|null} [excludeId] - 除外する本のID（編集時用）
 * @returns {{ isDuplicate: boolean, duplicateBook?: Book }}
 */
export function checkDuplicateTitlePure(title, books, excludeId = null) {
  const result = checkTitleDuplicate(title, books, excludeId);
  return {
    isDuplicate: result.isDuplicate,
    duplicateBook: result.duplicateItem
  };
}

/**
 * リンクの重複をチェック（Pure版）
 * @param {string} link - チェックするリンク
 * @param {Book[]} books - 既存の本の配列
 * @param {number|null} [excludeId] - 除外する本のID（編集時用）
 * @returns {{ isDuplicate: boolean, duplicateBook?: Book }}
 */
export function checkDuplicateLinkPure(link, books, excludeId = null) {
  if (!link || !link.trim()) {
    return { isDuplicate: false };
  }
  const normalizedLink = link.trim();
  const duplicateBook = books.find(book =>
    book.link && book.link === normalizedLink &&
    book.id !== excludeId
  );
  return {
    isDuplicate: !!duplicateBook,
    duplicateBook
  };
}

// ========================================
// 日付フォーマット
// ========================================

/**
 * 日付文字列をローカライズされた形式に変換
 * @param {string} dateStr - ISO日付文字列
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP');
}

/**
 * 相対日付を取得（「今日から」「3日前から」等）
 * @param {string} dateStr - ISO日付文字列
 * @returns {string}
 */
export function getRelativeDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今日から';
  if (diffDays === 1) return '昨日から';
  if (diffDays < 7) return `${diffDays}日前から`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前から`;
  return formatDate(dateStr) + 'から';
}

/**
 * 本の追加日（ID=タイムスタンプ）を日付文字列として取得
 * @param {Book} book - 本
 * @returns {string}
 */
export function getBookCreatedDateStr(book) {
  const timestamp = extractTimestampFromId(book.id);
  return new Date(timestamp).toISOString().split('T')[0];
}

/**
 * ID生成カウンターをリセット（テスト用）
 */
export function resetIdCounter() {
  resetSharedIdCounter();
}

/**
 * 本のステータスに応じた日付テキストを生成
 * @param {Book} book - 本
 * @returns {string}
 */
export function getBookDateText(book) {
  if (book.status === BOOK_STATUS.COMPLETED && book.completedAt) {
    return formatDate(book.completedAt) + ' 読了';
  }
  if (book.status === BOOK_STATUS.UNREAD) {
    return formatDate(getBookCreatedDateStr(book)) + ' 追加';
  }
  if (book.status === BOOK_STATUS.DROPPED && book.startedAt) {
    return formatDate(book.startedAt) + ' 開始';
  }
  if (book.status === BOOK_STATUS.READING && book.startedAt) {
    return formatDate(book.startedAt) + ' 開始';
  }
  if (book.status === BOOK_STATUS.WISHLIST) {
    return formatDate(getBookCreatedDateStr(book)) + ' 追加';
  }
  return '';
}

// ========================================
// 表示用ヘルパー
// ========================================

/**
 * 本のカラーをインデックスから取得
 * @param {number} index - インデックス
 * @returns {string} - 16進数カラーコード
 */
export function getBookColorByIndex(index) {
  return BOOK_COLORS[index % BOOK_COLORS.length];
}

/**
 * 本のカバーHTML生成
 * @param {Book} book - 本
 * @param {string} [placeholder='📕'] - プレースホルダー
 * @returns {string}
 */
export function createBookCoverHtml(book, placeholder = '📕') {
  return book.coverUrl
    ? `<img src="${escapeHtml(book.coverUrl)}" alt="">`
    : `<span class="book-placeholder">${placeholder}</span>`;
}

/**
 * ミニ本棚のスタイル生成
 * @param {Book} book - 本
 * @param {number} index - インデックス
 * @returns {Object}
 */
export function getMiniBookStyle(book, index) {
  const color = BOOK_COLORS[index % BOOK_COLORS.length];
  const height = 50 + ((index * 17) % 25);
  const width = book.coverUrl ? 18 + ((index * 2) % 6) : 14 + ((index * 3) % 8);
  const tilt = ((index * 7) % 5) - 2;
  const darkerColor = adjustColor(color, -20);
  const lighterColor = adjustColor(color, 15);

  const bgStyle = book.coverUrl
    ? `background-color: ${color}; background-image: url('${escapeHtml(book.coverUrl)}'); background-size: cover; background-position: center;`
    : `background: linear-gradient(to right, ${lighterColor} 0%, ${color} 15%, ${color} 85%, ${darkerColor} 100%);`;

  return {
    height,
    width,
    tilt,
    bgStyle,
    hasCover: !!book.coverUrl
  };
}

/**
 * ミニ本棚のHTML生成
 * @param {Book[]} books - 本の配列
 * @param {number|null} selectedBookId - 選択中の本ID
 * @param {string} [className='mini-book'] - CSSクラス名
 * @returns {string}
 */
export function renderMiniBookShelf(books, selectedBookId, className = 'mini-book') {
  return books.map((book, i) => {
    const style = getMiniBookStyle(book, i);
    const selectedClass = selectedBookId === book.id ? 'selected' : '';

    return `
      <div class="${className} ${style.hasCover ? 'has-cover' : ''} ${selectedClass}" data-book-id="${book.id}" style="
        height:${style.height}px;
        width:${style.width}px;
        ${style.bgStyle}
        transform: rotate(${style.tilt}deg);
      "></div>`;
  }).join('');
}
