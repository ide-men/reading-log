// ========================================
// 共通レンダリング関数
// ========================================
import { BOOK_STATUS } from '../constants.js';
import { stateManager } from '../state.js';
import { escapeHtml, escapeAttr, isValidUrl } from '../utils.js';
import {
  getBookDateText,
  getBookColor,
  getBookColorByIndex,
  createBookCoverHtml,
  renderMiniBookShelf
} from '../book-helpers.js';

// ========================================
// 共通グリッドカードレンダリング
// ========================================
export function renderBookGrid(books, type = 'study') {
  const prefix = type === 'store' ? 'store' : 'study';
  const placeholder = type === 'store' ? '📖' : '📕';

  const renderActions = (book) => {
    if (type === 'store') {
      return `
        <button class="store-acquire-btn" data-to-study="${book.id}">
          <span>📚</span>
          <span>書斎に入れる</span>
        </button>
        <button class="store-acquire-btn secondary" data-to-bag="${book.id}">
          <span>🎒</span>
          <span>カバンに入れる</span>
        </button>`;
    }
    return `
      <button class="study-action-btn" data-start="${book.id}">
        <span>🎒</span>
        <span>カバンに入れる</span>
      </button>`;
  };

  return `<div class="${prefix}-grid">${[...books].reverse().map((book, i) => {
    const colorIndex = books.length - 1 - i;
    const color = getBookColorByIndex(colorIndex);
    const coverHtml = createBookCoverHtml(book, placeholder);
    const dateText = getBookDateText(book);

    return `
      <div class="${prefix}-book-card" data-book-id="${book.id}">
        <div class="${prefix}-book-cover" style="background-color: ${color}">
          ${coverHtml}
        </div>
        <div class="${prefix}-book-info">
          <div class="${prefix}-book-title">${escapeHtml(book.title)}</div>
          <div class="${prefix}-book-date">${dateText}</div>
        </div>
        <div class="${prefix}-book-actions">
          ${renderActions(book)}
        </div>
      </div>
    `;
  }).join('')}</div>`;
}

// ========================================
// 共通シェルフコンテンツレンダリング
// ========================================
export function renderShelfContent(options) {
  const {
    books,
    selectedBookId,
    shelfEl,
    containerEl,
    type,
    miniBookClass,
    emptyConfig
  } = options;

  if (books.length === 0) {
    shelfEl.innerHTML = `
      <div class="empty-study">
        <div class="empty-study-icon">${emptyConfig.icon}</div>
        <div class="empty-study-text">${emptyConfig.text}</div>
        <div class="empty-study-hint">${emptyConfig.hint}</div>
      </div>`;
    containerEl.innerHTML = '';
    return;
  }

  // 本棚表示
  shelfEl.innerHTML = renderMiniBookShelf(books, selectedBookId, miniBookClass);

  // 選択中の本がある場合は詳細ビューを表示
  const selectedBook = selectedBookId ? books.find(b => b.id === selectedBookId) : null;

  if (selectedBook) {
    containerEl.innerHTML = renderDetailView(selectedBook, type);
  } else {
    containerEl.innerHTML = renderBookGrid(books, type);
  }
}

// ========================================
// 共通詳細ビューレンダリング
// ========================================
export function renderDetailView(book, type = 'study') {
  const color = getBookColor(book);
  const placeholder = type === 'store' ? '📖' : '📕';
  const coverHtml = createBookCoverHtml(book, placeholder);
  const dateText = getBookDateText(book);
  const prefix = type === 'store' ? 'store' : 'study';

  // メモ表示
  const noteHtml = book.note
    ? `<div class="${prefix}-detail-note">${escapeHtml(book.note)}</div>`
    : '';

  // リンクボタン
  const linkBtn = isValidUrl(book.link)
    ? `<button class="${prefix}-detail-action" data-link="${escapeAttr(book.link)}">
        <span>↗</span>
        <span>リンクを開く</span>
      </button>`
    : '';

  // ステータスに応じたアクションボタン
  let primaryActions = '';
  if (type === 'store') {
    primaryActions = `
      <button class="${prefix}-detail-action primary" data-to-study="${book.id}">
        <span>📚</span>
        <span>書斎に入れる</span>
      </button>
      <button class="${prefix}-detail-action" data-to-bag="${book.id}">
        <span>🎒</span>
        <span>カバンに入れる</span>
      </button>`;
  } else if (book.status === BOOK_STATUS.UNREAD || book.status === BOOK_STATUS.DROPPED || book.status === BOOK_STATUS.COMPLETED) {
    primaryActions = `
      <button class="${prefix}-detail-action primary" data-start="${book.id}">
        <span>🎒</span>
        <span>カバンに入れる</span>
      </button>`;
  }

  return `
    <div class="${prefix}-detail-view">
      <button class="${prefix}-detail-close" data-close-detail>✕</button>
      <div class="${prefix}-detail-content">
        <div class="${prefix}-detail-cover" style="background-color: ${color}">
          ${coverHtml}
        </div>
        <div class="${prefix}-detail-info">
          <div class="${prefix}-detail-title">${escapeHtml(book.title)}</div>
          <div class="${prefix}-detail-date">${dateText}</div>
          ${noteHtml}
          <div class="${prefix}-detail-actions">
            ${primaryActions}
            ${linkBtn}
            <button class="${prefix}-detail-action" data-edit="${book.id}">
              <span>✏️</span>
              <span>編集</span>
            </button>
            <button class="${prefix}-detail-action danger" data-delete="${book.id}">
              <span>🗑️</span>
              <span>削除</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ========================================
// 書籍詳細ダイアログを開く
// ========================================
export function openBookDetail(id) {
  const book = stateManager.getBook(id);
  if (!book) return;

  stateManager.setDetailBookId(id);

  // カバー画像
  const coverEl = document.getElementById('bookDetailCover');
  if (book.coverUrl) {
    coverEl.innerHTML = `<img src="${escapeHtml(book.coverUrl)}" alt="">`;
  } else {
    coverEl.innerHTML = '<span class="book-placeholder">📕</span>';
  }

  // タイトル
  document.getElementById('bookDetailTitle').textContent = book.title;

  // メタ情報
  document.getElementById('bookDetailMeta').textContent = getBookDateText(book);

  // メモ
  const noteEl = document.getElementById('bookDetailNote');
  if (book.note) {
    noteEl.textContent = book.note;
    noteEl.classList.add('has-note');
  } else {
    noteEl.textContent = '';
    noteEl.classList.remove('has-note');
  }

  // リンクボタン
  const linkBtn = document.getElementById('bookDetailLinkBtn');
  if (isValidUrl(book.link)) {
    linkBtn.style.display = 'flex';
    linkBtn.dataset.link = book.link;
  } else {
    linkBtn.style.display = 'none';
  }

  // ダイアログを開く
  document.getElementById('bookDetailModal').classList.add('active');
}
