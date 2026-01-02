// ========================================
// 本屋（ウィッシュリスト）ビュー
// ========================================
import { BOOK_STATUS } from '../../shared/constants.js';
import * as bookRepository from '../../domain/book/book-repository.js';
import { stateManager } from '../../core/state-manager.js';
import { renderShelfContent } from './shared.js';

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
