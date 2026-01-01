// ========================================
// 本の管理・レンダリング（ファサード）
// ========================================
// 各モジュールから再エクスポート

// 状態管理
export {
  getEditingBookId,
  setEditingBookId,
  getDeletingBookId,
  setDeletingBookId,
  getCurrentStudyStatus,
  setCurrentStudyStatus,
  getSelectedBookId,
  setSelectedBookId,
  getStudySelectedBookId,
  setStudySelectedBookId,
  clearStudySelection,
  getStoreSelectedBookId,
  setStoreSelectedBookId,
  clearStoreSelection,
  getDetailBookId,
  setDetailBookId
} from './book-state.js';

// ヘルパー関数
export {
  getBooksByStatus,
  formatDate,
  getRelativeDate,
  getBookDateText,
  getBookColor,
  getBookColorByIndex,
  createBookCoverHtml,
  getMiniBookStyle
} from './book-helpers.js';

// レンダリング
export {
  renderReadingBooks,
  updateCarouselScrollState,
  updateSelectedBookInfo,
  selectBook,
  renderStudyBooks,
  renderStoreBooks,
  openBookDetail,
  renderBooks
} from './book-rendering.js';

// CRUD操作
export {
  addBook,
  editBook,
  saveEditBook,
  deleteBook,
  confirmDeleteBook
} from './book-crud.js';

// ステータス遷移
export {
  acquireBook,
  moveToReading,
  startReadingBook,
  completeBook,
  dropBook
} from './book-status.js';
