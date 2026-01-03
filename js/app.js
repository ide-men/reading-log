// ========================================
// Reading Log - メインエントリポイント
// ========================================

// Core
import { stateManager } from './core/state-manager.js';
import { loadState, cleanupHistory, saveState } from './core/storage.js';

// Presentation - Controllers
import {
  initNavigationEvents,
  initScrollNavigation,
  initModalEvents,
  initSettingsEvents,
  updateUI,
  renderBooks
} from './presentation/controllers/navigation.js';
import {
  initTimerEvents,
  initBeforeUnloadEvent
} from './presentation/controllers/timer-controller.js';
import {
  initAddBookEvents,
  initEditDeleteEvents,
  initCarouselEvents,
  initStudyEvents,
  initStoreEvents,
  initReunionEvents
} from './presentation/controllers/book-controller.js';
import {
  initOnboardingEvents,
  showOnboardingIfNeeded
} from './presentation/controllers/onboarding-controller.js';
import { initTermHintEvents } from './presentation/controllers/term-hint-controller.js';

// ========================================
// 全イベントリスナー初期化
// ========================================
function initializeEventListeners() {
  initNavigationEvents();
  initScrollNavigation();
  initTimerEvents();
  initSettingsEvents();
  initAddBookEvents();
  initEditDeleteEvents();
  initModalEvents();
  initCarouselEvents();
  initStudyEvents();
  initStoreEvents();
  initReunionEvents();
  initOnboardingEvents();
  initTermHintEvents();
  initBeforeUnloadEvent();
}

// ========================================
// アプリケーション初期化
// ========================================
function init() {
  // 状態を読み込み
  const state = loadState();
  stateManager.initialize(state);

  // 古い履歴をクリーンアップ
  cleanupHistory();

  // 状態を保存
  saveState();

  // イベントリスナーを設定
  initializeEventListeners();

  // 初期レンダリング
  renderBooks();

  // UIを更新
  updateUI();

  // 初回起動時はオンボーディングを表示
  showOnboardingIfNeeded();

  // 状態変更時に自動保存
  stateManager.subscribe(() => {
    saveState();
  });
}

// ========================================
// DOM読み込み完了後に初期化
// ========================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
