// ========================================
// Reading Log - メインエントリポイント
// ========================================
import { stateManager } from './state.js';
import { loadState, cleanupHistory, saveState } from './storage.js';
import { initializeEventListeners } from './events.js';
import { updateUI } from './ui.js';

// アプリケーション初期化
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

  // UIを更新
  updateUI();

  // 状態変更時に自動保存
  stateManager.subscribe(() => {
    saveState();
  });
}

// DOM読み込み完了後に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
