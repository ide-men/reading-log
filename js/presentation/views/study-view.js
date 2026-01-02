// ========================================
// 書斎ビュー
// ========================================
import { BOOK_STATUS } from '../../shared/constants.js';
import * as bookRepository from '../../domain/book/book-repository.js';
import { stateManager } from '../../core/state-manager.js';
import { renderShelfContent } from './shared.js';

// ========================================
// 書斎のレンダリング
// ========================================
export function renderStudyBooks() {
  const currentStudyStatus = stateManager.getCurrentStudyStatus();
  const studySelectedBookId = stateManager.getStudySelectedBookId();

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

  const shelf = document.getElementById('studyShelf');
  const bookList = document.getElementById('studyBookList');

  if (!shelf || !bookList) return;

  const emptyMessages = {
    [BOOK_STATUS.COMPLETED]: { icon: '✅', text: '読了した本はまだありません', hint: '本を読み終えたらここに表示されます' },
    [BOOK_STATUS.UNREAD]: { icon: '📚', text: '積読本はありません', hint: '買った本を追加してみましょう' },
    [BOOK_STATUS.DROPPED]: { icon: '⏸️', text: '中断した本はありません', hint: '読書を中断した本がここに表示されます' }
  };

  renderShelfContent({
    books,
    selectedBookId: studySelectedBookId,
    shelfEl: shelf,
    containerEl: bookList,
    type: 'study',
    miniBookClass: 'mini-book',
    emptyConfig: emptyMessages[currentStudyStatus] || emptyMessages[BOOK_STATUS.COMPLETED]
  });
}
