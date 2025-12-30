// ========================================
// イベントリスナー
// ========================================
import { stateManager, createInitialState } from './state.js';
import {
  exportData,
  importData,
  loadSampleData,
  resetAllData,
  updateStorageDisplay
} from './storage.js';
import { isTimerRunning, getSeconds, startReading, stopReading } from './timer.js';
import { addBook, editBook, saveEditBook, deleteBook, confirmDeleteBook, renderBooks } from './books.js';
import { renderStats } from './stats.js';
import {
  switchTab,
  updateUI,
  closeModal,
  openModal,
  showToast,
  showLevelUp,
  showTitleUp,
  setFab,
  getFab,
  setTabCallbacks
} from './ui.js';
import { openLink } from './utils.js';

export function initializeEventListeners() {
  // タブコールバックを登録
  setTabCallbacks({
    books: renderBooks,
    stats: renderStats
  });

  // ナビゲーション
  document.querySelectorAll('.nav button').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // タイマー
  document.getElementById('startBtn').addEventListener('click', () => {
    if (isTimerRunning()) {
      stopReading({
        onLevelUp: showLevelUp,
        onTitleUp: showTitleUp,
        onComplete: updateUI
      });
    } else {
      startReading();
    }
  });

  document.getElementById('stopBtn').addEventListener('click', () => {
    stopReading({
      onLevelUp: showLevelUp,
      onTitleUp: showTitleUp,
      onComplete: updateUI
    });
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

  // FAB（本追加ボタン）
  const fab = document.createElement('button');
  fab.className = 'header-btn primary';
  fab.style.cssText = 'position:fixed;bottom:90px;right:20px;width:56px;height:56px;border-radius:50%;font-size:28px;z-index:50;display:none;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
  fab.textContent = '+';
  fab.addEventListener('click', () => openModal('addBookModal'));
  document.body.appendChild(fab);
  setFab(fab);

  // リンク入力トグル
  document.getElementById('linkToggle').addEventListener('click', () => {
    const fields = document.getElementById('linkFields');
    const isOpen = fields.classList.toggle('open');
    document.getElementById('linkIcon').textContent = isOpen ? '−' : '+';
  });

  // 本の追加・編集
  const bookCallbacks = {
    onLevelUp: showLevelUp,
    onTitleUp: showTitleUp
  };

  document.getElementById('addBookBtn').addEventListener('click', () => {
    addBook(true, bookCallbacks);
  });

  document.getElementById('addBookNoXpBtn').addEventListener('click', () => {
    addBook(false, bookCallbacks);
  });

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

  // レベルアップ・称号オーバーレイ
  document.getElementById('closeLevelup').addEventListener('click', () => {
    closeModal('levelupOverlay');
  });

  document.getElementById('closeTitle').addEventListener('click', () => {
    closeModal('titleOverlay');
  });

  // data-close属性を持つボタン
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  // モーダルオーバーレイクリックで閉じる
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  });

  // 本棚ツールチップ位置調整
  document.getElementById('shelf').addEventListener('mouseover', (e) => {
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

  // 本棚リンククリック
  document.getElementById('shelf').addEventListener('click', (e) => {
    const linkBtn = e.target.closest('[data-link]');
    if (linkBtn) {
      e.preventDefault();
      openLink(linkBtn.dataset.link);
    }
  });

  // 本リストのボタン操作
  document.getElementById('bookList').addEventListener('click', (e) => {
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
