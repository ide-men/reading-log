// ========================================
// 共通レンダリング関数
// ========================================
import { BOOK_STATUS } from '../../shared/constants.js';
import { escapeHtml, escapeAttr, isValidUrl } from '../../shared/utils.js';
import * as bookRepository from '../../domain/book/book-repository.js';
import * as uiState from '../state/ui-state.js';
import {
  getBookDateText,
  getBookColorByIndex,
  createBookCoverHtml,
  renderMiniBookShelf
} from '../../domain/book/book-entity.js';

// ========================================
// 共通グリッドカードレンダリング
// ========================================
export function renderBookGrid(books, type = 'study') {
  const modifier = type === 'store' ? 'book-card--store' : 'book-card--study';
  const placeholder = type === 'store' ? '📖' : '📕';

  const renderActions = (book) => {
    if (type === 'store') {
      return `
        <button class="action-btn action-btn--primary" data-to-study="${book.id}">
          <span>📚</span>
          <span>書斎に入れる</span>
        </button>
        <button class="action-btn action-btn--secondary" data-to-bag="${book.id}">
          <span>🎒</span>
          <span>カバンに入れる</span>
        </button>`;
    }
    return `
      <button class="action-btn action-btn--primary" data-start="${book.id}">
        <span>🎒</span>
        <span>カバンに入れる</span>
      </button>`;
  };

  return `<div class="book-grid">${[...books].reverse().map((book, i) => {
    const colorIndex = books.length - 1 - i;
    const color = getBookColorByIndex(colorIndex);
    const coverHtml = createBookCoverHtml(book, placeholder);
    const dateText = getBookDateText(book);

    return `
      <div class="book-card ${modifier}" data-book-id="${book.id}">
        <div class="book-card__cover" style="background-color: ${color}">
          ${coverHtml}
        </div>
        <div class="book-card__info">
          <div class="book-card__title">${escapeHtml(book.title)}</div>
          <div class="book-card__date">${dateText}</div>
        </div>
        <div class="book-card__actions">
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
      <div class="empty-state empty-state--small">
        <div class="empty-state__icon">${emptyConfig.icon}</div>
        <div class="empty-state__text">${emptyConfig.text}</div>
        <div class="empty-state__hint">${emptyConfig.hint}</div>
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
  const color = bookRepository.getBookColor(book);
  const placeholder = type === 'store' ? '📖' : '📕';
  const coverHtml = createBookCoverHtml(book, placeholder);
  const dateText = getBookDateText(book);
  const modifier = type === 'store' ? 'detail-view--store' : 'detail-view--study';

  // メモ表示
  const noteHtml = book.note
    ? `<div class="detail-view__note">${escapeHtml(book.note)}</div>`
    : '';

  // リンクボタン
  const linkBtn = isValidUrl(book.link)
    ? `<button class="detail-view__action" data-link="${escapeAttr(book.link)}">
        <span>↗</span>
        <span>リンクを開く</span>
      </button>`
    : '';

  // ステータスに応じたアクションボタン
  let primaryActions = '';
  if (type === 'store') {
    primaryActions = `
      <button class="detail-view__action detail-view__action--primary" data-to-study="${book.id}">
        <span>📚</span>
        <span>書斎に入れる</span>
      </button>
      <button class="detail-view__action" data-to-bag="${book.id}">
        <span>🎒</span>
        <span>カバンに入れる</span>
      </button>`;
  } else if (book.status === BOOK_STATUS.UNREAD || book.status === BOOK_STATUS.DROPPED || book.status === BOOK_STATUS.COMPLETED) {
    primaryActions = `
      <button class="detail-view__action detail-view__action--primary" data-start="${book.id}">
        <span>🎒</span>
        <span>カバンに入れる</span>
      </button>`;
  }

  return `
    <div class="detail-view ${modifier}">
      <button class="detail-view__close" data-close-detail>✕</button>
      <div class="detail-view__content">
        <div class="detail-view__cover" style="background-color: ${color}">
          ${coverHtml}
        </div>
        <div class="detail-view__info">
          <div class="detail-view__title">${escapeHtml(book.title)}</div>
          <div class="detail-view__date">${dateText}</div>
          ${noteHtml}
          <div class="detail-view__actions">
            ${primaryActions}
            ${linkBtn}
            <button class="detail-view__action" data-edit="${book.id}">
              <span>✏️</span>
              <span>編集</span>
            </button>
            <button class="detail-view__action detail-view__action--danger" data-delete="${book.id}">
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
  const book = bookRepository.getBookById(id);
  if (!book) return;

  uiState.setDetailBookId(id);

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
