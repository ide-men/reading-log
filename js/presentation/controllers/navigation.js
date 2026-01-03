// ========================================
// Navigation Controller
// タブ・モーダル・設定の制御
// ========================================
import { eventBus, Events } from '../../shared/event-bus.js';
import {
  exportData,
  importData,
  loadSampleData,
  resetAllData,
  updateStorageDisplay
} from '../../core/storage.js';
import { updateButtonAnimation } from '../effects/animations.js';
import { renderReadingBooks } from '../views/carousel-view.js';
import { renderStudyBooks } from '../views/study-view.js';
import { renderStoreBooks } from '../views/store-view.js';
import { renderStats } from '../views/stats-view.js';
import { showOnboarding } from './onboarding-controller.js';

// ========================================
// タブコールバック
// ========================================
const tabCallbacks = {
  home: renderReadingBooks,
  study: renderStudyBooks,
  store: renderStoreBooks,
  stats: renderStats
};

// ========================================
// タブ切り替え
// ========================================
export function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));

  document.getElementById(`tab-${name}`).classList.add('active');
  document.querySelector(`.nav button[data-tab="${name}"]`).classList.add('active');

  // FABの表示/非表示を切り替え（カバン・記録タブでは非表示）
  const fab = document.getElementById('addBookFab');
  if (fab) {
    fab.classList.toggle('hidden', name === 'home' || name === 'stats');
  }

  if (tabCallbacks[name]) {
    tabCallbacks[name]();
  }

  eventBus.emit(Events.TAB_CHANGED, { tab: name });
}

// ========================================
// モーダル操作
// ========================================
export function openModal(id) {
  document.getElementById(id).classList.add('active');
  eventBus.emit(Events.MODAL_OPENED, { id });
}

export function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  eventBus.emit(Events.MODAL_CLOSED, { id });
}

// ========================================
// トースト（キュー方式）
// ========================================
const toastQueue = [];
let isShowingToast = false;

function showNextToast() {
  if (isShowingToast || toastQueue.length === 0) return;

  isShowingToast = true;
  const { message, duration } = toastQueue.shift();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  eventBus.emit(Events.TOAST_SHOW, { message });

  setTimeout(() => {
    toast.remove();
    isShowingToast = false;
    showNextToast();
  }, duration);
}

export function showToast(message, duration = 3000) {
  toastQueue.push({ message, duration });
  showNextToast();
}

// ========================================
// UI更新
// ========================================
export function updateUI() {
  updateButtonAnimation();
}

// ========================================
// 全ビューのレンダリング
// ========================================
export function renderBooks() {
  renderReadingBooks();
  renderStudyBooks();
  renderStoreBooks();
}

// ========================================
// ナビゲーションイベント初期化
// ========================================
export function initNavigationEvents() {
  document.querySelectorAll('.nav button').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

// ========================================
// スクロール連動ナビゲーション
// ========================================
export function initScrollNavigation() {
  const nav = document.querySelector('.nav');
  const content = document.querySelector('.content');
  if (!nav || !content) return;

  let lastScrollTop = 0;
  let ticking = false;
  const SCROLL_THRESHOLD = 10;

  content.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollTop = content.scrollTop;
        const scrollDelta = scrollTop - lastScrollTop;

        if (Math.abs(scrollDelta) > SCROLL_THRESHOLD) {
          if (scrollDelta > 0 && scrollTop > 50) {
            // 下スクロール時は非表示
            nav.classList.add('nav--hidden');
          } else {
            // 上スクロール時は表示
            nav.classList.remove('nav--hidden');
          }
          lastScrollTop = scrollTop;
        }

        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// ========================================
// モーダルイベント初期化
// ========================================
export function initModalEvents() {
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal(btn.dataset.close);
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      // 本追加モーダル・オンボーディングモーダルは背景クリックで閉じない
      if (overlay.id === 'addBookModal' || overlay.id === 'onboardingModal') return;

      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });
}

// ========================================
// 設定イベント初期化
// ========================================
export function initSettingsEvents() {
  document.getElementById('settingsBtn').addEventListener('click', () => {
    updateStorageDisplay();
    openModal('settingsModal');
  });

  document.getElementById('showOnboardingBtn').addEventListener('click', () => {
    closeModal('settingsModal');
    showOnboarding();
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
