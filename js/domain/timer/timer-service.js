// ========================================
// Timer Service
// タイマーのビジネスロジック（UI操作なし）
// ========================================
import { CONFIG } from '../../shared/constants.js';
import { eventBus, Events } from '../../shared/event-bus.js';
import { stateManager } from '../../core/state-manager.js';
import { saveState } from '../../core/storage.js';

// ========================================
// TimerServiceクラス（テスタビリティ向上のため）
// ========================================

/**
 * @typedef {Object} TimerDependencies
 * @property {Function} getBook - 本を取得する関数
 * @property {Function} getState - 状態を取得する関数
 * @property {Function} updateStats - 統計を更新する関数
 * @property {Function} updateBook - 本を更新する関数
 * @property {Function} addHistory - 履歴を追加する関数
 * @property {Function} save - 状態を永続化する関数
 * @property {Function} emit - イベントを発行する関数
 * @property {Function} [now] - 現在時刻を取得する関数（テスト用）
 */

export class TimerService {
  /**
   * @param {TimerDependencies} [deps] - 依存性（テスト用に注入可能）
   */
  constructor(deps = {}) {
    this.deps = {
      getBook: deps.getBook ?? ((id) => stateManager.getBook(id)),
      getState: deps.getState ?? (() => stateManager.getState()),
      updateStats: deps.updateStats ?? ((updates) => stateManager.updateStats(updates)),
      updateBook: deps.updateBook ?? ((id, updates) => stateManager.updateBook(id, updates)),
      addHistory: deps.addHistory ?? ((entry) => stateManager.addHistory(entry)),
      save: deps.save ?? (() => saveState()),
      emit: deps.emit ?? ((event, data) => eventBus.emit(event, data)),
      now: deps.now ?? (() => new Date()),
    };

    this.timerId = null;
    this.seconds = 0;
    this.currentBookId = null;
  }

  // ========================================
  // ゲッター
  // ========================================

  isTimerRunning() {
    return this.timerId !== null;
  }

  getSeconds() {
    return this.seconds;
  }

  getCurrentBookId() {
    return this.currentBookId;
  }

  getFormattedTime() {
    const mins = Math.floor(this.seconds / 60);
    const secs = this.seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // ========================================
  // タイマー操作
  // ========================================

  startReading(bookId = null) {
    if (this.timerId) {
      return { book: null };
    }

    this.seconds = 0;
    this.currentBookId = bookId;

    const book = bookId ? this.deps.getBook(bookId) : null;

    this.timerId = setInterval(() => {
      this.seconds++;
      this.deps.emit(Events.TIMER_TICK, {
        seconds: this.seconds,
        formatted: this.getFormattedTime()
      });
    }, 1000);

    this.deps.emit(Events.TIMER_STARTED, { bookId, book });

    return { book };
  }

  stopReading() {
    if (!this.timerId) {
      return { minutes: 0, isValidSession: false };
    }

    clearInterval(this.timerId);
    this.timerId = null;

    const minutes = Math.floor(this.seconds / 60);
    const state = this.deps.getState();
    const now = this.deps.now();
    const isValidSession = minutes >= CONFIG.minSessionMinutes;

    // すべての統計更新を一度に計算
    const statsUpdates = {
      total: state.stats.total + minutes,
      today: state.stats.today + minutes
    };

    if (isValidSession) {
      statsUpdates.sessions = state.stats.sessions + 1;
      if (!state.stats.firstSessionDate) {
        statsUpdates.firstSessionDate = now.toISOString();
      }
    }

    // 統計を一度に更新
    this.deps.updateStats(statsUpdates);

    // 本の読書時間を更新
    if (this.currentBookId) {
      const book = this.deps.getBook(this.currentBookId);
      if (book) {
        this.deps.updateBook(this.currentBookId, {
          readingTime: (book.readingTime || 0) + minutes
        });
      }
    }

    // 有効なセッションの場合は履歴を追加
    if (isValidSession) {
      this.deps.addHistory({
        d: now.toISOString(),
        m: minutes,
        h: now.getHours(),
        bookId: this.currentBookId
      });
    }

    const finishedBookId = this.currentBookId;
    this.seconds = 0;
    this.currentBookId = null;

    this.deps.save();

    this.deps.emit(Events.TIMER_STOPPED, { minutes, isValidSession });
    if (isValidSession) {
      this.deps.emit(Events.SESSION_COMPLETED, { minutes, bookId: finishedBookId });
    }

    return { minutes, isValidSession };
  }

  cancelReading() {
    if (!this.timerId) return;

    clearInterval(this.timerId);
    this.timerId = null;
    this.seconds = 0;
    this.currentBookId = null;

    this.deps.emit(Events.TIMER_STOPPED, { minutes: 0, isValidSession: false, cancelled: true });
  }

  /**
   * 状態をリセット（テスト用）
   */
  reset() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
    this.timerId = null;
    this.seconds = 0;
    this.currentBookId = null;
  }
}

// ========================================
// ファクトリ関数（テスト用）
// ========================================

/**
 * テスト用にTimerServiceインスタンスを作成
 * @param {TimerDependencies} [deps] - 依存性
 * @returns {TimerService}
 */
export function createTimerService(deps) {
  return new TimerService(deps);
}

// ========================================
// デフォルトインスタンス（後方互換性）
// ========================================

const defaultInstance = new TimerService();

// 後方互換性のための関数エクスポート
export function isTimerRunning() {
  return defaultInstance.isTimerRunning();
}

export function getSeconds() {
  return defaultInstance.getSeconds();
}

export function getCurrentBookId() {
  return defaultInstance.getCurrentBookId();
}

export function getFormattedTime() {
  return defaultInstance.getFormattedTime();
}

export function startReading(bookId = null) {
  return defaultInstance.startReading(bookId);
}

export function stopReading() {
  return defaultInstance.stopReading();
}

export function cancelReading() {
  return defaultInstance.cancelReading();
}

/**
 * デフォルトインスタンスをリセット（テスト用）
 */
export function resetDefaultInstance() {
  defaultInstance.reset();
}
