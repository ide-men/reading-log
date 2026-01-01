// ========================================
// 本関連の共通ヘルパー関数
// ========================================
import { BOOK_STATUS, BOOK_COLORS } from './constants.js';
import { stateManager } from './state.js';
import { saveState } from './storage.js';
import { escapeHtml, adjustColor } from './utils.js';

// ========================================
// 本の状態変更後の共通処理
// ========================================
export function persistAndRender(renderBooks) {
  saveState();
  renderBooks();
}

// ========================================
// ステータス別フィルタ
// ========================================
export function getBooksByStatus(status) {
  const state = stateManager.getState();
  return state.books.filter(book => book.status === status);
}

// ========================================
// 日付フォーマット
// ========================================
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP');
}

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

// ========================================
// 本の日付テキスト生成
// ========================================

// 本の追加日（ID=タイムスタンプ）を日付文字列として取得
function getBookCreatedDateStr(book) {
  return new Date(book.id).toISOString().split('T')[0];
}

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
// 本のカラー取得
// ========================================
export function getBookColor(book) {
  const bookIndex = stateManager.getState().books.findIndex(b => b.id === book.id);
  return BOOK_COLORS[bookIndex % BOOK_COLORS.length];
}

export function getBookColorByIndex(index) {
  return BOOK_COLORS[index % BOOK_COLORS.length];
}

// ========================================
// 本のカバーHTML生成
// ========================================
export function createBookCoverHtml(book, placeholder = '📕') {
  return book.coverUrl
    ? `<img src="${escapeHtml(book.coverUrl)}" alt="">`
    : `<span class="book-placeholder">${placeholder}</span>`;
}

// ========================================
// ミニ本棚のスタイル生成
// ========================================
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

// ========================================
// ミニ本棚のHTML生成
// ========================================
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
