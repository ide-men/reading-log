// ========================================
// Book Entity
// 本のデータ構造・バリデーション・ヘルパー
// ========================================
import { BOOK_STATUS, BOOK_COLORS } from '../../shared/constants.js';
import { escapeHtml, adjustColor, getCoverUrlFromLink } from '../../shared/utils.js';

// ========================================
// Book型定義（JSDoc）
// ========================================

/**
 * @typedef {Object} Book
 * @property {number} id - ユニークID（タイムスタンプ）
 * @property {string} title - 本のタイトル
 * @property {string|null} link - Amazon等のリンク
 * @property {string|null} coverUrl - 表紙画像URL
 * @property {string} status - ステータス（BOOK_STATUS値）
 * @property {string|null} startedAt - 読み始めた日（YYYY-MM-DD）
 * @property {string|null} completedAt - 読了日（YYYY-MM-DD）
 * @property {string|null} note - メモ・感想
 * @property {number} readingTime - 累計読書時間（分）
 * @property {string|null} bookmark - 付箋メモ（中断時のどこまで読んだか等）
 */

// ========================================
// Book生成
// ========================================

/**
 * 新しいBookオブジェクトを作成
 * @param {Object} params - 本のデータ
 * @param {string} params.title - タイトル
 * @param {string} [params.link] - リンク
 * @param {string} [params.note] - メモ
 * @param {string} [params.status] - ステータス
 * @param {Function} [onShortUrl] - 短縮URL検出時のコールバック
 * @returns {Book}
 */
export function createBook({ title, link, note, status = BOOK_STATUS.READING }, onShortUrl = null) {
  const coverUrl = getCoverUrlFromLink(link, onShortUrl);
  const today = new Date().toISOString().split('T')[0];

  // ステータスに応じて日付を設定
  let startedAt = null;
  let completedAt = null;
  if (status === BOOK_STATUS.READING) {
    startedAt = today;
  } else if (status === BOOK_STATUS.COMPLETED) {
    completedAt = today;
  }

  return {
    id: Date.now(),
    title,
    link: link || null,
    coverUrl,
    status,
    startedAt,
    completedAt,
    note: note || null,
    readingTime: 0,
    bookmark: null
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
export function validateBookTitle(title) {
  if (!title || !title.trim()) {
    return { valid: false, error: 'タイトルを入力してください' };
  }
  return { valid: true };
}

/**
 * ステータスが有効かチェック
 * @param {string} status - ステータス
 * @returns {boolean}
 */
export function isValidStatus(status) {
  return Object.values(BOOK_STATUS).includes(status);
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
  return new Date(book.id).toISOString().split('T')[0];
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
