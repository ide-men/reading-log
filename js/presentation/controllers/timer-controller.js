// ========================================
// Timer Controller
// タイマー操作の制御
// ========================================
import { escapeAttr } from '../../shared/utils.js';
import { eventBus, Events } from '../../shared/event-bus.js';
import * as timerService from '../../domain/timer/timer-service.js';
import * as uiState from '../state/ui-state.js';
import { applyReadingAnimation } from '../effects/animations.js';
import { renderReadingBooks } from '../views/carousel-view.js';
import { updateUI } from './navigation.js';

// ========================================
// 読書開始
// ========================================
export function handleStartReading() {
  const selectedId = uiState.getSelectedBookId();
  if (!selectedId) return;

  const { book } = timerService.startReading(selectedId);

  // 読書画面を表示
  const readingIcon = document.getElementById('readingIcon');
  if (book && book.coverUrl) {
    readingIcon.innerHTML = `<img src="${escapeAttr(book.coverUrl)}" class="reading-cover-img" alt="">`;
    readingIcon.classList.add('has-cover');
  } else {
    readingIcon.textContent = '📖';
    readingIcon.classList.remove('has-cover');
  }

  applyReadingAnimation();
  document.getElementById('readingScreen').classList.add('active');
  document.getElementById('startBtn').innerHTML =
    '<span class="main-btn-icon anim-relax">📖</span><span>読書中...</span>';
}

// ========================================
// 読書停止
// ========================================
export function handleStopReading() {
  timerService.stopReading();

  document.getElementById('readingScreen').classList.remove('active');
  updateUI();
  renderReadingBooks();
}

// ========================================
// タイマーイベント初期化
// ========================================
export function initTimerEvents() {
  document.getElementById('startBtn').addEventListener('click', () => {
    if (timerService.isTimerRunning()) {
      handleStopReading();
    } else {
      handleStartReading();
    }
  });

  document.getElementById('stopBtn').addEventListener('click', () => {
    handleStopReading();
  });
}

// ========================================
// ページ離脱警告
// ========================================
export function initBeforeUnloadEvent() {
  window.addEventListener('beforeunload', (e) => {
    if (timerService.isTimerRunning() && timerService.getSeconds() > 0) {
      e.preventDefault();
      e.returnValue = '読書中のデータが失われます。ページを離れますか？';
      return e.returnValue;
    }
  });
}

// ========================================
// タイマー状態のエクスポート（他のモジュールから使用）
// ========================================
export const isTimerRunning = timerService.isTimerRunning;
export const getSeconds = timerService.getSeconds;
