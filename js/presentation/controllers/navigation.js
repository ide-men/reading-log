// ========================================
// Navigation Controller
// タブ・モーダル・設定の制御
// ========================================
import { eventBus, Events } from '../../shared/event-bus.js';
import { stateManager } from '../../core/state-manager.js';
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
import {
  addLabel,
  updateLabel,
  deleteLabel,
  getLabelUsageCount,
  getAllLabels
} from '../../domain/label/label-service.js';
import { escapeHtml } from '../../shared/utils.js';

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
  const tab = document.getElementById(`tab-${name}`);
  const navButton = document.querySelector(`.nav button[data-tab="${name}"]`);

  // タブまたはナビボタンが存在しない場合は何もしない
  if (!tab || !navButton) {
    console.error(`switchTab: Tab or nav button not found for "${name}"`);
    return;
  }

  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));

  tab.classList.add('active');
  navButton.classList.add('active');

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
  const modal = document.getElementById(id);
  if (!modal) {
    console.error(`openModal: Modal not found for "${id}"`);
    return;
  }
  modal.classList.add('active');
  eventBus.emit(Events.MODAL_OPENED, { id });
}

export function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) {
    console.error(`closeModal: Modal not found for "${id}"`);
    return;
  }
  modal.classList.remove('active');
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
    renderLabelList();
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

// ========================================
// ラベル一覧レンダリング
// ========================================
export function renderLabelList() {
  const labelList = document.getElementById('labelList');
  if (!labelList) return;

  const labels = getAllLabels();

  if (labels.length === 0) {
    labelList.innerHTML = '';
    return;
  }

  labelList.innerHTML = labels.map(label => {
    const usageCount = getLabelUsageCount(label.id);
    return `
      <div class="label-item" data-label-id="${label.id}">
        <span class="label-item__name">${escapeHtml(label.name)}</span>
        <span class="label-item__count">${usageCount}冊</span>
        <div class="label-item__actions">
          <button class="label-item__btn" data-action="edit" aria-label="編集">✏️</button>
          <button class="label-item__btn label-item__btn--danger" data-action="delete" aria-label="削除">×</button>
        </div>
      </div>
    `;
  }).join('');
}

// ========================================
// ラベル管理イベント初期化
// ========================================
let deletingLabelId = null;

export function initLabelEvents() {
  const labelList = document.getElementById('labelList');
  const newLabelInput = document.getElementById('newLabelInput');
  const addLabelBtn = document.getElementById('addLabelBtn');

  // ラベル追加
  if (addLabelBtn && newLabelInput) {
    addLabelBtn.addEventListener('click', () => {
      const name = newLabelInput.value.trim();
      if (!name) return;

      const result = addLabel(name);
      if (result.success) {
        newLabelInput.value = '';
        renderLabelList();
        showToast(result.message);
      } else {
        showToast(result.message);
      }
    });

    // Enterキーで追加
    newLabelInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addLabelBtn.click();
      }
    });
  }

  // ラベル一覧のクリックイベント（イベント委譲）
  if (labelList) {
    labelList.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const labelItem = btn.closest('.label-item');
      const labelId = parseInt(labelItem.dataset.labelId, 10);
      const action = btn.dataset.action;

      if (action === 'edit') {
        openEditLabelModal(labelId);
      } else if (action === 'delete') {
        openDeleteLabelConfirm(labelId);
      }
    });
  }

  // ラベル編集モーダル保存
  const saveLabelBtn = document.getElementById('saveLabelBtn');
  if (saveLabelBtn) {
    saveLabelBtn.addEventListener('click', () => {
      const editingLabelId = stateManager.getEditingLabelId();
      if (!editingLabelId) return;

      const name = document.getElementById('editLabelName').value.trim();
      const result = updateLabel(editingLabelId, name);

      if (result.success) {
        closeModal('editLabelModal');
        renderLabelList();
        renderBooks();
        showToast(result.message);
      } else {
        showToast(result.message);
      }
    });
  }

  // ラベル削除確認
  const confirmDeleteLabelBtn = document.getElementById('confirmDeleteLabelBtn');
  if (confirmDeleteLabelBtn) {
    confirmDeleteLabelBtn.addEventListener('click', () => {
      if (!deletingLabelId) return;

      const result = deleteLabel(deletingLabelId);
      if (result.success) {
        closeModal('deleteLabelConfirm');
        renderLabelList();
        renderBooks();
        showToast(result.message);
      } else {
        showToast(result.message);
      }
      deletingLabelId = null;
    });
  }
}

function openEditLabelModal(labelId) {
  const label = stateManager.getLabel(labelId);
  if (!label) return;

  stateManager.setEditingLabelId(labelId);
  document.getElementById('editLabelName').value = label.name;
  openModal('editLabelModal');
}

function openDeleteLabelConfirm(labelId) {
  const label = stateManager.getLabel(labelId);
  if (!label) return;

  deletingLabelId = labelId;
  const usageCount = getLabelUsageCount(labelId);

  const confirmText = document.getElementById('deleteLabelConfirmText');
  if (usageCount > 0) {
    confirmText.textContent = `「${label.name}」は${usageCount}冊の本で使用されています。削除すると、これらの本からもラベルが外れます。`;
  } else {
    confirmText.textContent = `「${label.name}」を削除しますか？`;
  }

  openModal('deleteLabelConfirm');
}
