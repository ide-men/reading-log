// ========================================
// Timer Service
// タイマーのビジネスロジック（UI操作なし）
// ========================================
import { CONFIG } from '../../shared/constants.js';
import { eventBus, Events } from '../../shared/event-bus.js';
import { stateManager } from '../../core/state-manager.js';
import { saveState } from '../../core/storage.js';

// ========================================
// タイマー状態
// ========================================
let timerId = null;
let seconds = 0;
let currentBookId = null;

// ========================================
// ゲッター
// ========================================

/**
 * タイマーが動作中かどうか
 * @returns {boolean}
 */
export function isTimerRunning() {
  return timerId !== null;
}

/**
 * 経過秒数を取得
 * @returns {number}
 */
export function getSeconds() {
  return seconds;
}

/**
 * 現在読書中の本のIDを取得
 * @returns {number|null}
 */
export function getCurrentBookId() {
  return currentBookId;
}

/**
 * 経過時間をフォーマット
 * @returns {string} "MM:SS" 形式
 */
export function getFormattedTime() {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ========================================
// タイマー操作
// ========================================

/**
 * 読書を開始
 * @param {number|null} bookId - 読書する本のID
 * @returns {{ book: Book|null }}
 */
export function startReading(bookId = null) {
  if (timerId) {
    return { book: null };
  }

  seconds = 0;
  currentBookId = bookId;

  // 本の情報を取得
  const book = bookId ? stateManager.getBook(bookId) : null;

  // タイマー開始
  timerId = setInterval(() => {
    seconds++;
    eventBus.emit(Events.TIMER_TICK, {
      seconds,
      formatted: getFormattedTime()
    });
  }, 1000);

  eventBus.emit(Events.TIMER_STARTED, { bookId, book });

  return { book };
}

/**
 * 読書を停止
 * @returns {{ minutes: number, isValidSession: boolean }}
 */
export function stopReading() {
  if (!timerId) {
    return { minutes: 0, isValidSession: false };
  }

  clearInterval(timerId);
  timerId = null;

  const minutes = Math.floor(seconds / 60);
  const state = stateManager.getState();

  // 統計を更新
  stateManager.updateStats({
    total: state.stats.total + minutes,
    today: state.stats.today + minutes
  });

  // 本ごとの読書時間を記録
  if (currentBookId) {
    const book = stateManager.getBook(currentBookId);
    if (book) {
      stateManager.updateBook(currentBookId, {
        readingTime: (book.readingTime || 0) + minutes
      });
    }
  }

  // 有効なセッション（最低時間以上）の場合
  const isValidSession = minutes >= CONFIG.minSessionMinutes;
  if (isValidSession) {
    const currentState = stateManager.getState();
    const updates = {
      sessions: currentState.stats.sessions + 1
    };

    if (!currentState.stats.firstSessionDate) {
      updates.firstSessionDate = new Date().toISOString();
    }

    stateManager.updateStats(updates);
    stateManager.addHistory({
      d: new Date().toISOString(),
      m: minutes,
      h: new Date().getHours(),
      bookId: currentBookId
    });
  }

  // リセット
  const finishedBookId = currentBookId;
  seconds = 0;
  currentBookId = null;

  // 保存
  saveState();

  eventBus.emit(Events.TIMER_STOPPED, { minutes, isValidSession });
  if (isValidSession) {
    eventBus.emit(Events.SESSION_COMPLETED, { minutes, bookId: finishedBookId });
  }

  return { minutes, isValidSession };
}

/**
 * タイマーをキャンセル（統計に記録しない）
 */
export function cancelReading() {
  if (!timerId) return;

  clearInterval(timerId);
  timerId = null;
  seconds = 0;
  currentBookId = null;

  eventBus.emit(Events.TIMER_STOPPED, { minutes: 0, isValidSession: false, cancelled: true });
}
