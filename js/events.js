// ========================================
// イベントリスナー
// ========================================
import { stateManager, createInitialState } from './state.js';
import { BOOK_STATUS } from './constants.js';
import {
  exportData,
  importData,
  loadSampleData,
  resetAllData,
  updateStorageDisplay
} from './storage.js';
import { isTimerRunning, getSeconds, startReading, stopReading } from './timer.js';
import {
  addBook,
  editBook,
  saveEditBook,
  deleteBook,
  confirmDeleteBook,
  renderBooks,
  renderReadingBooks,
  renderStudyBooks,
  renderStoreBooks,
  acquireBook,
  startReadingBook,
  completeBook,
  dropBook,
  setCurrentStudyStatus,
  getCurrentStudyStatus,
  selectBook,
  getSelectedBookId,
  openBookDetail,
  getDetailBookId,
  setStudySelectedBookId,
  clearStudySelection
} from './books.js';
import { renderStats } from './stats.js';
import {
  switchTab,
  updateUI,
  closeModal,
  openModal,
  showToast,
  setTabCallbacks
} from './ui.js';
import { openLink } from './utils.js';

// 現在追加しようとしている本のステータス
let addingBookStatus = BOOK_STATUS.READING;

export function initializeEventListeners() {
  // タブコールバックを登録
  setTabCallbacks({
    home: renderReadingBooks,
    study: renderStudyBooks,
    store: renderStoreBooks,
    stats: renderStats
  });

  // ナビゲーション
  document.querySelectorAll('.nav button').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // 読書停止後のコールバック
  const onReadingStop = () => {
    updateUI();
    renderReadingBooks();
  };

  // タイマー
  document.getElementById('startBtn').addEventListener('click', () => {
    if (isTimerRunning()) {
      stopReading(onReadingStop);
    } else {
      const selectedId = getSelectedBookId();
      if (selectedId) {
        startReading(selectedId);
      }
    }
  });

  document.getElementById('stopBtn').addEventListener('click', () => {
    stopReading(onReadingStop);
  });

  // 設定
  document.getElementById('settingsBtn').addEventListener('click', () => {
    updateStorageDisplay();
    openModal('settingsModal');
  });

  // バックアップ・復元
  document.getElementById('exportBtn').addEventListener('click', () => {
    exportData(showToast);
  });

  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });

  document.getElementById('importFile').addEventListener('change', (e) => {
    if (e.target.files[0]) {
      importData(e.target.files[0], {
        showToast,
        onSuccess: () => {
          updateUI();
          renderBooks();
          renderStats();
        }
      });
      e.target.value = '';
    }
  });

  // 本追加ボタン（各ページ）
  document.getElementById('addReadingBookBtn').addEventListener('click', () => {
    addingBookStatus = BOOK_STATUS.READING;
    document.getElementById('addBookModalTitle').textContent = 'カバンに本を追加';
    document.getElementById('addBookStatus').value = BOOK_STATUS.READING;
    openModal('addBookModal');
  });

  document.getElementById('addStudyBookBtn').addEventListener('click', () => {
    addingBookStatus = BOOK_STATUS.UNREAD;
    document.getElementById('addBookModalTitle').textContent = '書斎に本を追加';
    document.getElementById('addBookStatus').value = BOOK_STATUS.UNREAD;
    openModal('addBookModal');
  });

  document.getElementById('addStoreBookBtn').addEventListener('click', () => {
    addingBookStatus = BOOK_STATUS.WISHLIST;
    document.getElementById('addBookModalTitle').textContent = '本屋に本を追加';
    document.getElementById('addBookStatus').value = BOOK_STATUS.WISHLIST;
    openModal('addBookModal');
  });

  // リンク入力トグル
  document.getElementById('linkToggle').addEventListener('click', () => {
    const fields = document.getElementById('linkFields');
    const isOpen = fields.classList.toggle('open');
    document.getElementById('linkIcon').textContent = isOpen ? '−' : '+';
  });

  // 本の追加
  document.getElementById('addBookBtn').addEventListener('click', () => {
    const status = document.getElementById('addBookStatus').value;
    addBook(status);
  });

  // 本の編集
  document.getElementById('saveEditBtn').addEventListener('click', saveEditBook);

  // リセット
  document.getElementById('resetBtn').addEventListener('click', () => {
    openModal('resetConfirm');
  });

  document.getElementById('confirmResetBtn').addEventListener('click', () => {
    resetAllData({
      showToast,
      onSuccess: () => {
        updateUI();
        closeModal('resetConfirm');
        closeModal('settingsModal');
      }
    });
  });

  // サンプルデータ
  document.getElementById('sampleDataBtn').addEventListener('click', () => {
    openModal('sampleDataConfirm');
  });

  document.getElementById('confirmSampleBtn').addEventListener('click', () => {
    loadSampleData({
      showToast,
      onSuccess: () => {
        updateUI();
        renderBooks();
        renderStats();
        closeModal('sampleDataConfirm');
        closeModal('settingsModal');
      }
    });
  });

  // 削除確認
  document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    confirmDeleteBook(updateUI);
  });

  // data-close属性を持つボタン
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal(btn.dataset.close);
    });
  });

  // モーダルオーバーレイクリックで閉じる
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });

  // 書斎のステータスタブ切り替え
  document.getElementById('studyStatusTabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.status-tab');
    if (!tab) return;

    const status = tab.dataset.status;
    if (!status) return;

    // アクティブ状態を更新
    document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    // 選択状態をクリア
    clearStudySelection();

    // ステータスを更新してレンダリング
    setCurrentStudyStatus(status);
    renderStudyBooks();
  });

  // カルーセルのクリックイベント（本の選択）
  document.getElementById('bookCarousel').addEventListener('click', (e) => {
    const book = e.target.closest('.carousel-book');
    if (book && book.dataset.id) {
      selectBook(Number(book.dataset.id));
    }
  });

  // 選択中の本に対するアクションボタン
  document.getElementById('completeSelectedBtn').addEventListener('click', () => {
    const selectedId = getSelectedBookId();
    if (selectedId) {
      completeBook(selectedId);
    }
  });

  document.getElementById('dropSelectedBtn').addEventListener('click', () => {
    const selectedId = getSelectedBookId();
    if (selectedId) {
      dropBook(selectedId);
    }
  });

  // 書斎の本リストのアクション（グリッドカード・詳細ビュー）
  document.getElementById('studyBookList').addEventListener('click', (e) => {
    // 詳細ビューの閉じるボタン
    const closeBtn = e.target.closest('[data-close-detail]');
    if (closeBtn) {
      clearStudySelection();
      renderStudyBooks();
      return;
    }

    // 読み始めるボタン
    const startBtn = e.target.closest('[data-start]');
    if (startBtn) {
      e.stopPropagation();
      clearStudySelection();
      startReadingBook(Number(startBtn.dataset.start));
      return;
    }

    // リンクボタン
    const linkBtn = e.target.closest('[data-link]');
    if (linkBtn) {
      e.preventDefault();
      openLink(linkBtn.dataset.link);
      return;
    }

    // 編集ボタン
    const editBtn = e.target.closest('[data-edit]');
    if (editBtn) {
      clearStudySelection();
      editBook(Number(editBtn.dataset.edit));
      return;
    }

    // 削除ボタン
    const deleteBtn = e.target.closest('[data-delete]');
    if (deleteBtn) {
      clearStudySelection();
      deleteBook(Number(deleteBtn.dataset.delete));
      return;
    }

    // カードをクリックで詳細ダイアログを開く（グリッド時のみ）
    const card = e.target.closest('.study-book-card');
    if (card && card.dataset.bookId) {
      openBookDetail(Number(card.dataset.bookId));
    }
  });

  // 書籍詳細ダイアログのアクション
  document.getElementById('bookDetailLinkBtn').addEventListener('click', () => {
    const link = document.getElementById('bookDetailLinkBtn').dataset.link;
    if (link) {
      openLink(link);
    }
  });

  document.getElementById('bookDetailEditBtn').addEventListener('click', () => {
    const bookId = getDetailBookId();
    if (bookId) {
      closeModal('bookDetailModal');
      editBook(bookId);
    }
  });

  document.getElementById('bookDetailDeleteBtn').addEventListener('click', () => {
    const bookId = getDetailBookId();
    if (bookId) {
      closeModal('bookDetailModal');
      deleteBook(bookId);
    }
  });

  // 書斎の本棚ツールチップ
  document.getElementById('studyShelf').addEventListener('mouseover', (e) => {
    const miniBook = e.target.closest('.mini-book');
    if (!miniBook) return;

    const tooltip = miniBook.querySelector('.book-tooltip');
    if (!tooltip) return;

    tooltip.classList.remove('tooltip-align-left', 'tooltip-align-right');

    const bookRect = miniBook.getBoundingClientRect();
    const bookCenter = bookRect.left + bookRect.width / 2;
    const screenCenter = window.innerWidth / 2;
    const threshold = window.innerWidth * 0.15;

    if (bookCenter < screenCenter - threshold) {
      tooltip.classList.add('tooltip-align-left');
    } else if (bookCenter > screenCenter + threshold) {
      tooltip.classList.add('tooltip-align-right');
    }
  });

  // 書斎の本棚クリック（本を選択）
  document.getElementById('studyShelf').addEventListener('click', (e) => {
    const miniBook = e.target.closest('.mini-book');
    if (!miniBook) return;

    const bookId = Number(miniBook.dataset.bookId);
    if (!bookId) return;

    setStudySelectedBookId(bookId);
    renderStudyBooks();
  });

  // 本屋のアクション
  document.getElementById('storeBookList').addEventListener('click', (e) => {
    const acquireBtn = e.target.closest('[data-acquire]');
    if (acquireBtn) {
      acquireBook(Number(acquireBtn.dataset.acquire));
      return;
    }

    const linkBtn = e.target.closest('[data-link]');
    if (linkBtn) {
      e.preventDefault();
      openLink(linkBtn.dataset.link);
      return;
    }

    const editBtn = e.target.closest('[data-edit]');
    if (editBtn) {
      editBook(Number(editBtn.dataset.edit));
      return;
    }

    const deleteBtn = e.target.closest('[data-delete]');
    if (deleteBtn) {
      deleteBook(Number(deleteBtn.dataset.delete));
    }
  });

  // 読書中にページを離れる際の警告
  window.addEventListener('beforeunload', (e) => {
    if (isTimerRunning() && getSeconds() > 0) {
      e.preventDefault();
      e.returnValue = '読書中のデータが失われます。ページを離れますか？';
      return e.returnValue;
    }
  });
}
