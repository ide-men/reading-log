// ========================================
// 本モジュール ファサード
// ========================================
// 本関連の機能を一箇所からインポートできるようにする
// 注: 直接インポートも推奨（依存関係を明確にするため）

// ----------------------------------------
// 選択状態の管理
// ----------------------------------------
export {
  // カルーセル（カバン）
  getSelectedBookId,
  setSelectedBookId,
  // 書斎
  getCurrentStudyStatus,
  setCurrentStudyStatus,
  getStudySelectedBookId,
  setStudySelectedBookId,
  clearStudySelection,
  // 本屋
  getStoreSelectedBookId,
  setStoreSelectedBookId,
  clearStoreSelection,
  // 詳細ダイアログ
  getDetailBookId,
  setDetailBookId,
  // 編集・削除
  getEditingBookId,
  getDeletingBookId
} from './book-state.js';

// ----------------------------------------
// レンダリング
// ----------------------------------------
export {
  renderBooks,
  renderReadingBooks,
  renderStudyBooks,
  renderStoreBooks,
  updateCarouselScrollState,
  selectBook,
  openBookDetail
} from './book-rendering.js';

// ----------------------------------------
// CRUD操作
// ----------------------------------------
export {
  addBook,
  editBook,
  saveEditBook,
  deleteBook,
  confirmDeleteBook
} from './book-crud.js';

// ----------------------------------------
// ステータス遷移
// ----------------------------------------
export {
  acquireBook,
  moveToReading,
  startReadingBook,
  completeBook,
  dropBook
} from './book-status.js';
