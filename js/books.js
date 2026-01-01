// ========================================
// 本モジュール ファサード
// ========================================
// 本関連の機能を一箇所からインポートできるようにする
// 注: 直接インポートも推奨（依存関係を明確にするため）

// ----------------------------------------
// 選択状態の管理（stateManager 経由）
// ----------------------------------------
import { stateManager } from './state.js';

// カルーセル（カバン）
export const getSelectedBookId = () => stateManager.getSelectedBookId();
export const setSelectedBookId = (id) => stateManager.setSelectedBookId(id);

// 書斎
export const getCurrentStudyStatus = () => stateManager.getCurrentStudyStatus();
export const setCurrentStudyStatus = (status) => stateManager.setCurrentStudyStatus(status);
export const getStudySelectedBookId = () => stateManager.getStudySelectedBookId();
export const setStudySelectedBookId = (id) => stateManager.setStudySelectedBookId(id);
export const clearStudySelection = () => stateManager.clearStudySelection();

// 本屋
export const getStoreSelectedBookId = () => stateManager.getStoreSelectedBookId();
export const setStoreSelectedBookId = (id) => stateManager.setStoreSelectedBookId(id);
export const clearStoreSelection = () => stateManager.clearStoreSelection();

// 詳細ダイアログ
export const getDetailBookId = () => stateManager.getDetailBookId();
export const setDetailBookId = (id) => stateManager.setDetailBookId(id);

// 編集・削除
export const getEditingBookId = () => stateManager.getEditingBookId();
export const getDeletingBookId = () => stateManager.getDeletingBookId();

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
