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
// ラベルフィルターのレンダリング
// ========================================
export function renderLabelFilter() {
  const searchInput = document.getElementById('labelFilterSearchInput');
  const clearBtn = document.getElementById('labelFilterClearBtn');
  if (!searchInput || !clearBtn) return;

  const selectedLabelId = stateManager.getSelectedLabelId();
  const labels = getAllLabels();

  // 選択中のラベルを表示
  if (selectedLabelId !== null) {
    const selectedLabel = labels.find(l => l.id === selectedLabelId);
    searchInput.value = selectedLabel ? selectedLabel.name : '';
    searchInput.classList.add('has-value');
    clearBtn.classList.remove('hidden');
  } else {
    searchInput.value = '';
    searchInput.classList.remove('has-value');
    clearBtn.classList.add('hidden');
  }
}

// ========================================
// ラベルフィルタードロップダウンのレンダリング
// ========================================
export function renderLabelFilterOptions(searchQuery = '') {
  const optionsContainer = document.getElementById('labelFilterOptions');
  if (!optionsContainer) return;

  let labels = getAllLabels();
  const selectedLabelId = stateManager.getSelectedLabelId();

  // 検索フィルタリング
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    labels = labels.filter(label => label.name.toLowerCase().includes(query));
  }

  if (labels.length === 0) {
    optionsContainer.innerHTML = searchQuery
      ? '<div class="label-filter-search__empty">該当するラベルがありません</div>'
      : '<div class="label-filter-search__empty">ラベルがありません</div>';
    return;
  }

  optionsContainer.innerHTML = labels.map(label => `
    <button class="label-filter-search__option ${selectedLabelId === label.id ? 'selected' : ''}" data-label-id="${label.id}">
      ${escapeHtml(label.name)}
    </button>
  `).join('');
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

  // ラベルフィルターをレンダリング
  renderLabelFilter();

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
