// ========================================
// イベントリスナー
// ========================================
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
  completeBook,
  dropBook,
  setCurrentStudyStatus,
  selectBook,
  getSelectedBookId,
  getDetailBookId,
  setStudySelectedBookId,
  getStudySelectedBookId,
  clearStudySelection,
  setStoreSelectedBookId,
  getStoreSelectedBookId,
  clearStoreSelection,
  updateCarouselScrollState
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
import {
  delegateEvents,
  studyBookListHandlers,
  studyBookListFallback,
  storeBookListHandlers,
  storeBookListFallback
} from './event-handlers.js';

// ========================================
// ナビゲーション・タブ
// ========================================
function initNavigationEvents() {
  setTabCallbacks({
    home: renderReadingBooks,
    study: renderStudyBooks,
    store: renderStoreBooks,
    stats: renderStats
  });

  document.querySelectorAll('.nav button').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

// ========================================
// タイマー関連
// ========================================
function initTimerEvents() {
  const onReadingStop = () => {
    updateUI();
    renderReadingBooks();
  };

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
}

// ========================================
// 設定・バックアップ関連
// ========================================
function initSettingsEvents() {
  document.getElementById('settingsBtn').addEventListener('click', () => {
    updateStorageDisplay();
    openModal('settingsModal');
  });

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
}

// ========================================
// 本の追加関連
// ========================================
function initAddBookEvents() {
  const fab = document.getElementById('addBookFab');
  fab.addEventListener('click', () => {
    const activeTab = document.querySelector('.nav button.active');
    const tabName = activeTab?.dataset.tab || 'home';

    const statusMap = {
      home: BOOK_STATUS.READING,
      study: BOOK_STATUS.UNREAD,
      store: BOOK_STATUS.WISHLIST
    };

    const titleMap = {
      home: 'カバンに本を追加',
      study: '書斎に本を追加',
      store: '本屋に本を追加'
    };

    const status = statusMap[tabName] || BOOK_STATUS.READING;
    document.getElementById('addBookModalTitle').textContent = titleMap[tabName] || '本を追加';
    document.getElementById('addBookStatus').value = status;

    const statusSelector = document.getElementById('studyStatusSelector');
    if (tabName === 'study') {
      statusSelector.style.display = 'block';
      document.querySelector('input[name="studyStatus"][value="unread"]').checked = true;
    } else {
      statusSelector.style.display = 'none';
    }

    openModal('addBookModal');
  });

  document.querySelectorAll('input[name="studyStatus"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      document.getElementById('addBookStatus').value = e.target.value;
    });
  });

  document.getElementById('linkToggle').addEventListener('click', () => {
    const fields = document.getElementById('linkFields');
    const isOpen = fields.classList.toggle('open');
    document.getElementById('linkIcon').textContent = isOpen ? '−' : '+';
  });

  document.getElementById('addBookBtn').addEventListener('click', () => {
    const status = document.getElementById('addBookStatus').value;
    addBook(status);
  });
}

// ========================================
// 本の編集・削除関連
// ========================================
function initEditDeleteEvents() {
  document.getElementById('saveEditBtn').addEventListener('click', saveEditBook);

  document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    confirmDeleteBook(updateUI);
  });

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
}

// ========================================
// モーダル共通
// ========================================
function initModalEvents() {
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal(btn.dataset.close);
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });
}

// ========================================
// カルーセル（カバン）関連
// ========================================
function initCarouselEvents() {
  document.getElementById('bookCarousel').addEventListener('click', (e) => {
    const book = e.target.closest('.carousel-book');
    if (book && book.dataset.id) {
      selectBook(Number(book.dataset.id));
      updateCarouselScrollState();
    }
  });

  document.getElementById('bookCarousel').addEventListener('scroll', () => {
    updateCarouselScrollState();
  });

  document.getElementById('carouselDots').addEventListener('click', (e) => {
    const dot = e.target.closest('.carousel-dot');
    if (!dot) return;

    const index = Number(dot.dataset.index);
    const carousel = document.getElementById('bookCarousel');
    const books = carousel.querySelectorAll('.carousel-book');

    if (books[index]) {
      const bookId = Number(books[index].dataset.id);
      selectBook(bookId);
      books[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      updateCarouselScrollState();
    }
  });

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
}

// ========================================
// 書斎関連
// ========================================
function initStudyEvents() {
  document.getElementById('studyStatusTabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.status-tab');
    if (!tab) return;

    const status = tab.dataset.status;
    if (!status) return;

    document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    clearStudySelection();
    setCurrentStudyStatus(status);
    renderStudyBooks();
  });

  delegateEvents(
    document.getElementById('studyBookList'),
    'click',
    studyBookListHandlers,
    studyBookListFallback
  );

  let lastStudyShelfClickTime = 0;
  document.getElementById('studyShelf').addEventListener('click', (e) => {
    const now = Date.now();
    if (now - lastStudyShelfClickTime < 300) return;
    lastStudyShelfClickTime = now;

    const miniBook = e.target.closest('.mini-book');
    if (!miniBook) return;

    const bookId = Number(miniBook.dataset.bookId);
    if (!bookId) return;

    if (getStudySelectedBookId() === bookId) {
      miniBook.classList.remove('selected');
      clearStudySelection();
      setTimeout(() => {
        renderStudyBooks();
      }, 200);
    } else {
      setStudySelectedBookId(bookId);
      renderStudyBooks();
    }
  });
}

// ========================================
// 本屋関連
// ========================================
function initStoreEvents() {
  delegateEvents(
    document.getElementById('storeBookList'),
    'click',
    storeBookListHandlers,
    storeBookListFallback
  );

  let lastStoreShelfClickTime = 0;
  document.getElementById('storeShelf').addEventListener('click', (e) => {
    const now = Date.now();
    if (now - lastStoreShelfClickTime < 300) return;
    lastStoreShelfClickTime = now;

    const miniBook = e.target.closest('.store-mini-book');
    if (!miniBook) return;

    const bookId = Number(miniBook.dataset.bookId);
    if (!bookId) return;

    if (getStoreSelectedBookId() === bookId) {
      miniBook.classList.remove('selected');
      clearStoreSelection();
      setTimeout(() => {
        renderStoreBooks();
      }, 200);
    } else {
      setStoreSelectedBookId(bookId);
      renderStoreBooks();
    }
  });
}

// ========================================
// ページ離脱警告
// ========================================
function initBeforeUnloadEvent() {
  window.addEventListener('beforeunload', (e) => {
    if (isTimerRunning() && getSeconds() > 0) {
      e.preventDefault();
      e.returnValue = '読書中のデータが失われます。ページを離れますか？';
      return e.returnValue;
    }
  });
}

// ========================================
// 全イベントリスナー初期化
// ========================================
export function initializeEventListeners() {
  initNavigationEvents();
  initTimerEvents();
  initSettingsEvents();
  initAddBookEvents();
  initEditDeleteEvents();
  initModalEvents();
  initCarouselEvents();
  initStudyEvents();
  initStoreEvents();
  initBeforeUnloadEvent();
}
