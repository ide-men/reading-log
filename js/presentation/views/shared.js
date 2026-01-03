// ========================================
// 共通レンダリング関数
// ========================================
import { BOOK_STATUS } from '../../shared/constants.js';
import { escapeHtml, escapeAttr, isValidUrl } from '../../shared/utils.js';
import * as bookRepository from '../../domain/book/book-repository.js';
import { stateManager } from '../../core/state-manager.js';
import {
  getBookDateText,
  createBookCoverHtml,
  renderMiniBookShelf
} from '../../domain/book/book-entity.js';

// ========================================
// 再会判定ヘルパー
// ========================================
function isReunionBook(book, months = 3) {
  if (book.status !== BOOK_STATUS.COMPLETED || !book.completedAt) return false;
  const now = new Date();
  const thresholdDate = new Date(now.setMonth(now.getMonth() - months));
  const completedDate = new Date(book.completedAt);
  return completedDate <= thresholdDate;
}

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
          <span>書斎に入れる</span>
        </button>
        <button class="action-btn action-btn--secondary" data-to-bag="${book.id}">
          <span>カバンに入れる</span>
        </button>`;
    }
    return `
      <button class="action-btn action-btn--primary" data-start="${book.id}">
        <span>カバンに入れる</span>
      </button>`;
  };

  return `<div class="book-grid">${[...books].reverse().map((book, i) => {
    const coverHtml = createBookCoverHtml(book, placeholder);
    const reunion = isReunionBook(book);
    const reunionBadge = reunion ? '<div class="book-card__reunion-badge">久しぶり</div>' : '';

    return `
      <div class="book-card ${modifier}" data-book-id="${book.id}" ${reunion ? 'data-reunion="true"' : ''}>
        ${reunionBadge}
        <div class="book-card__cover">
          ${coverHtml}
        </div>
        <div class="book-card__info">
          <div class="book-card__title">${escapeHtml(book.title)}</div>
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

  // FABの表示制御（書斎・本屋タブのみ、かつこのタブがアクティブの場合のみ）
  const fab = document.getElementById('addBookFab');
  const activeTab = document.querySelector('.nav button.active')?.dataset?.tab;
  const isThisTabActive = (type === 'store' && activeTab === 'store') || (type === 'study' && activeTab === 'study');

  if (books.length === 0) {
    const addBookType = type === 'store' ? 'wishlist' : 'unread';
    shelfEl.innerHTML = `
      <div class="empty-state empty-state--small">
        <div class="empty-state__icon">${emptyConfig.icon}</div>
        <div class="empty-state__text">${emptyConfig.text}</div>
        <div class="empty-state__hint">${emptyConfig.hint}</div>
        <button class="empty-state__add-btn" data-add-book="${addBookType}" aria-label="本を追加">
          <span class="empty-state__add-icon">＋</span>
        </button>
      </div>`;
    containerEl.innerHTML = '';
    // empty-state表示時はFABを非表示（このタブがアクティブの場合のみ制御）
    if (fab && isThisTabActive) fab.classList.add('hidden');
    return;
  }

  // 本がある場合はFABを表示（このタブがアクティブの場合のみ制御）
  if (fab && isThisTabActive) fab.classList.remove('hidden');

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
  const placeholder = type === 'store' ? '📖' : '📕';
  const coverHtml = createBookCoverHtml(book, placeholder);
  const modifier = type === 'store' ? 'detail-view--store' : 'detail-view--study';

  // 栞メモ表示（中断本のみ）
  const bookmarkHtml = (book.status === BOOK_STATUS.DROPPED && book.bookmark)
    ? `<div class="detail-view__bookmark">
        <span class="detail-view__bookmark-icon">🔖</span>
        <span class="detail-view__bookmark-text">${escapeHtml(book.bookmark)}</span>
      </div>`
    : '';

  // きっかけ表示
  const triggerHtml = book.triggerNote
    ? `<div class="detail-view__note"><strong>📌 きっかけ:</strong> ${escapeHtml(book.triggerNote)}</div>`
    : '';

  // 読了時の感想表示
  const completionHtml = book.completionNote
    ? `<div class="detail-view__note"><strong>✨ 読了時:</strong> ${escapeHtml(book.completionNote)}</div>`
    : '';

  // 再会判定
  const reunion = isReunionBook(book);

  // リンクボタン
  const linkBtn = isValidUrl(book.link)
    ? `<button class="detail-view__action" data-link="${escapeAttr(book.link)}">
        <span>↗</span>
        <span>リンクを開く</span>
      </button>`
    : '';

  // 再会ボタン（読了から3ヶ月以上経過した本）
  const reunionBtn = reunion
    ? `<button class="detail-view__action detail-view__action--primary" data-reunion="${book.id}">
        <span>📚</span>
        <span>振り返る</span>
      </button>`
    : '';

  // ステータスに応じたアクションボタン
  let primaryActions = '';
  if (type === 'store') {
    primaryActions = `
      <button class="detail-view__action detail-view__action--primary" data-to-study="${book.id}">
        <span>書斎に入れる</span>
      </button>
      <button class="detail-view__action" data-to-bag="${book.id}">
        <span>カバンに入れる</span>
      </button>`;
  } else if (book.status === BOOK_STATUS.UNREAD || book.status === BOOK_STATUS.DROPPED || book.status === BOOK_STATUS.COMPLETED) {
    primaryActions = reunion ? reunionBtn : `
      <button class="detail-view__action detail-view__action--primary" data-start="${book.id}">
        <span>カバンに入れる</span>
      </button>`;
  }

  return `
    <div class="detail-view ${modifier}">
      <button class="detail-view__close" data-close-detail>✕</button>
      <div class="detail-view__content">
        <div class="detail-view__cover">
          ${coverHtml}
        </div>
        <div class="detail-view__info">
          <div class="detail-view__title">${escapeHtml(book.title)}</div>
          ${bookmarkHtml}
          ${triggerHtml}
          ${completionHtml}
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

  // メモ（きっかけ・読了時の感想）
  const noteEl = document.getElementById('bookDetailNote');
  const notes = [];
  if (book.triggerNote) notes.push(`📌 きっかけ: ${book.triggerNote}`);
  if (book.completionNote) notes.push(`✨ 読了時: ${book.completionNote}`);

  if (notes.length > 0) {
    noteEl.textContent = notes.join('\n\n');
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
