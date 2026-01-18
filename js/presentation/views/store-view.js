// ========================================
// 本屋（ウィッシュリスト）ビュー
// ========================================
import { BOOK_STATUS } from '../../shared/constants.js';
import { escapeHtml } from '../../shared/utils.js';
import * as bookRepository from '../../domain/book/book-repository.js';
import { stateManager } from '../../core/state-manager.js';
import { renderShelfContent } from './shared.js';

// ========================================
// 検索ドロップダウンのレンダリング
// ========================================
export function renderStoreSearchOptions(searchQuery = '') {
  const optionsContainer = document.getElementById('storeSearchOptions');
  const dropdown = document.getElementById('storeSearchDropdown');
  if (!optionsContainer || !dropdown) return;

  // 検索クエリがない場合はドロップダウンを閉じる
  if (!searchQuery) {
    dropdown.classList.remove('visible');
    optionsContainer.innerHTML = '';
    return;
  }

  // 本を取得してフィルタリング
  const query = searchQuery.toLowerCase();
  const allBooks = bookRepository.getBooksByStatus(BOOK_STATUS.WISHLIST);
  const books = allBooks.filter(book => book.title.toLowerCase().includes(query));

  // 結果を構築
  let html = '';

  // 本セクション（最大5件）
  if (books.length > 0) {
    const displayBooks = books.slice(0, 5);
    html += `<div class="search-section">
      <div class="search-section__header">📚 本を表示</div>
      ${displayBooks.map(book => `
        <button class="book-search__option" data-book-id="${book.id}" data-type="book">
          <span class="search-option__icon">📕</span>
          <span class="search-option__text">${escapeHtml(book.title)}</span>
        </button>
      `).join('')}
    </div>`;
  }

  // 結果なし
  if (!html) {
    html = '<div class="book-search__empty">該当する本がありません</div>';
  }

  optionsContainer.innerHTML = html;
  dropdown.classList.add('visible');
}

// ========================================
// 本屋（ウィッシュリスト）のレンダリング
// ========================================
export function renderStoreBooks() {
  const storeSelectedBookId = stateManager.getStoreSelectedBookId();
  const books = bookRepository.getBooksByStatus(BOOK_STATUS.WISHLIST);
  const shelf = document.getElementById('storeShelf');
  const container = document.getElementById('storeBookList');
  const countEl = document.getElementById('wishlistCount');

  if (!container || !shelf) return;

  if (countEl) {
    countEl.textContent = books.length;
  }

  renderShelfContent({
    books,
    selectedBookId: storeSelectedBookId,
    shelfEl: shelf,
    containerEl: container,
    type: 'store',
    miniBookClass: 'mini-book',
    emptyConfig: { icon: '🏪', text: '気になる本はありません', hint: '読みたい本を見つけたら追加しましょう' }
  });
}
