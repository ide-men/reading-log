// ========================================
// 書斎ビュー
// ========================================
import { BOOK_STATUS } from '../../shared/constants.js';
import { escapeHtml } from '../../shared/utils.js';
import * as bookRepository from '../../domain/book/book-repository.js';
import { stateManager } from '../../core/state-manager.js';
import { renderShelfContent } from './shared.js';
import { getAllLabels } from '../../domain/label/label-service.js';

// ========================================
// 検索フィルターのレンダリング（選択中のラベル表示）
// ========================================
export function renderStudySearchFilter() {
  const searchInput = document.getElementById('studySearchInput');
  const clearBtn = document.getElementById('studySearchClearBtn');
  if (!searchInput || !clearBtn) return;

  const selectedLabelId = stateManager.getSelectedLabelId();
  const labels = getAllLabels();

  // 選択中のラベルを入力欄に表示
  if (selectedLabelId !== null) {
    const selectedLabel = labels.find(l => l.id === selectedLabelId);
    searchInput.value = selectedLabel ? `🏷️ ${selectedLabel.name}` : '';
    searchInput.classList.add('has-filter');
    clearBtn.classList.remove('hidden');
  } else {
    // 検索クエリがあれば保持、なければ空にする
    if (!searchInput.dataset.searching) {
      searchInput.value = '';
    }
    searchInput.classList.remove('has-filter');
    clearBtn.classList.add('hidden');
  }
}

// ========================================
// 検索ドロップダウンのレンダリング
// ========================================
export function renderStudySearchOptions(searchQuery = '') {
  const optionsContainer = document.getElementById('studySearchOptions');
  const dropdown = document.getElementById('studySearchDropdown');
  if (!optionsContainer || !dropdown) return;

  const selectedLabelId = stateManager.getSelectedLabelId();
  const currentStudyStatus = stateManager.getCurrentStudyStatus();
  let labels = getAllLabels();

  // 現在のステータスの本を取得
  let books = [];
  switch (currentStudyStatus) {
    case BOOK_STATUS.COMPLETED:
      books = bookRepository.getBooksByStatus(BOOK_STATUS.COMPLETED);
      break;
    case BOOK_STATUS.UNREAD:
      books = bookRepository.getBooksByStatus(BOOK_STATUS.UNREAD);
      break;
    case BOOK_STATUS.DROPPED:
      books = bookRepository.getBooksByStatus(BOOK_STATUS.DROPPED);
      break;
    default:
      books = bookRepository.getBooksByStatus(BOOK_STATUS.COMPLETED);
  }

  // 検索クエリがない場合はドロップダウンを閉じる
  if (!searchQuery) {
    dropdown.classList.remove('visible');
    optionsContainer.innerHTML = '';
    return;
  }

  // 検索フィルタリング
  const query = searchQuery.toLowerCase();
  labels = labels.filter(label => label.name.toLowerCase().includes(query));
  books = books.filter(book => book.title.toLowerCase().includes(query));

  // 結果を構築
  let html = '';

  // ラベルセクション
  if (labels.length > 0) {
    html += `<div class="search-section">
      <div class="search-section__header">🏷️ ラベルで絞り込み</div>
      ${labels.map(label => `
        <button class="book-search__option" data-label-id="${label.id}" data-type="label">
          <span class="search-option__icon">🏷️</span>
          <span class="search-option__text">${escapeHtml(label.name)}</span>
          ${selectedLabelId === label.id ? '<span class="search-option__check">✓</span>' : ''}
        </button>
      `).join('')}
    </div>`;
  }

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
    html = '<div class="book-search__empty">該当する結果がありません</div>';
  }

  optionsContainer.innerHTML = html;
  dropdown.classList.add('visible');
}

// ========================================
// 書斎のレンダリング
// ========================================
export function renderStudyBooks() {
  const currentStudyStatus = stateManager.getCurrentStudyStatus();
  const studySelectedBookId = stateManager.getStudySelectedBookId();
  const selectedLabelId = stateManager.getSelectedLabelId();

  // カウント更新
  const completedBooks = bookRepository.getBooksByStatus(BOOK_STATUS.COMPLETED);
  const unreadBooks = bookRepository.getBooksByStatus(BOOK_STATUS.UNREAD);
  const droppedBooks = bookRepository.getBooksByStatus(BOOK_STATUS.DROPPED);

  document.getElementById('completedCount').textContent = completedBooks.length;
  document.getElementById('unreadCount').textContent = unreadBooks.length;
  document.getElementById('droppedCount').textContent = droppedBooks.length;

  // 現在選択中のステータスの本を取得
  let books;
  switch (currentStudyStatus) {
    case BOOK_STATUS.COMPLETED:
      books = completedBooks;
      break;
    case BOOK_STATUS.UNREAD:
      books = unreadBooks;
      break;
    case BOOK_STATUS.DROPPED:
      books = droppedBooks;
      break;
    default:
      books = completedBooks;
  }

  // ラベルフィルターを適用
  if (selectedLabelId !== null) {
    books = books.filter(book =>
      book.labelIds && book.labelIds.includes(selectedLabelId)
    );
  }

  const shelf = document.getElementById('studyShelf');
  const bookList = document.getElementById('studyBookList');

  if (!shelf || !bookList) return;

  // 検索フィルターをレンダリング
  renderStudySearchFilter();

  const emptyMessages = {
    [BOOK_STATUS.COMPLETED]: { icon: '✅', text: '読了した本はまだありません', hint: '本を読み終えたらここに表示されます' },
    [BOOK_STATUS.UNREAD]: { icon: '📚', text: '未読本はありません', hint: '買った本を追加してみましょう' },
    [BOOK_STATUS.DROPPED]: { icon: '⏸️', text: '中断した本はありません', hint: '読書を中断した本がここに表示されます' }
  };

  // ラベルフィルタリング時の空メッセージ
  const filteredEmptyMessages = {
    [BOOK_STATUS.COMPLETED]: { icon: '🏷️', text: 'このラベルの読了本はありません', hint: 'フィルターを解除するか、別のラベルを選択してください' },
    [BOOK_STATUS.UNREAD]: { icon: '🏷️', text: 'このラベルの未読本はありません', hint: 'フィルターを解除するか、別のラベルを選択してください' },
    [BOOK_STATUS.DROPPED]: { icon: '🏷️', text: 'このラベルの中断本はありません', hint: 'フィルターを解除するか、別のラベルを選択してください' }
  };

  const emptyConfig = selectedLabelId !== null
    ? filteredEmptyMessages[currentStudyStatus] || filteredEmptyMessages[BOOK_STATUS.COMPLETED]
    : emptyMessages[currentStudyStatus] || emptyMessages[BOOK_STATUS.COMPLETED];

  renderShelfContent({
    books,
    selectedBookId: studySelectedBookId,
    shelfEl: shelf,
    containerEl: bookList,
    type: 'study',
    miniBookClass: 'mini-book',
    emptyConfig
  });
}
