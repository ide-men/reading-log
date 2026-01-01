// ========================================
// 本のレンダリング - ファサード
// ========================================
// 各ビューモジュールを再エクスポート

// カルーセル（カバン）
export {
  renderReadingBooks,
  updateCarouselScrollState,
  updateSelectedBookInfo,
  selectBook
} from './views/carousel-view.js';

// 書斎
export { renderStudyBooks } from './views/study-view.js';

// 本屋
export { renderStoreBooks } from './views/store-view.js';

// 共通
export { openBookDetail } from './views/shared.js';

// ========================================
// 全体レンダリング
// ========================================
import { renderReadingBooks } from './views/carousel-view.js';
import { renderStudyBooks } from './views/study-view.js';
import { renderStoreBooks } from './views/store-view.js';

export function renderBooks() {
  renderReadingBooks();
  renderStudyBooks();
  renderStoreBooks();
}
