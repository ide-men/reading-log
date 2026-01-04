// ========================================
// Event Bus
// アプリケーション全体のイベント通知を管理
// ========================================

/**
 * イベント名の定義
 * 循環依存を避けるため、イベントを介して層間通信を行う
 */
export const Events = {
  // 本関連
  BOOK_ADDED: 'book:added',
  BOOK_UPDATED: 'book:updated',
  BOOK_DELETED: 'book:deleted',
  BOOK_STATUS_CHANGED: 'book:statusChanged',

  // タイマー関連
  TIMER_STARTED: 'timer:started',
  TIMER_STOPPED: 'timer:stopped',
  TIMER_TICK: 'timer:tick',
  SESSION_COMPLETED: 'session:completed',

  // UI関連
  TAB_CHANGED: 'ui:tabChanged',
  MODAL_OPENED: 'ui:modalOpened',
  MODAL_CLOSED: 'ui:modalClosed',
  TOAST_SHOW: 'ui:toastShow',

  // データ関連
  STATE_CHANGED: 'state:changed',
  DATA_IMPORTED: 'data:imported',
  DATA_RESET: 'data:reset',
  STORAGE_ERROR: 'storage:error',

  // レンダリング関連
  RENDER_REQUESTED: 'render:requested',
  RENDER_BOOKS: 'render:books',
  RENDER_STATS: 'render:stats'
};

/**
 * EventBus クラス
 * Pub/Sub パターンによるイベント管理
 */
class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  /**
   * イベントを購読
   * @param {string} event - イベント名
   * @param {Function} callback - コールバック関数
   * @returns {Function} 購読解除関数
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);

    // 購読解除関数を返す
    return () => this.off(event, callback);
  }

  /**
   * イベントを一度だけ購読
   * @param {string} event - イベント名
   * @param {Function} callback - コールバック関数
   * @returns {Function} 購読解除関数
   */
  once(event, callback) {
    const wrapper = (data) => {
      this.off(event, wrapper);
      callback(data);
    };
    return this.on(event, wrapper);
  }

  /**
   * イベントの購読を解除
   * @param {string} event - イベント名
   * @param {Function} callback - コールバック関数
   */
  off(event, callback) {
    const listeners = this._listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this._listeners.delete(event);
      }
    }
  }

  /**
   * イベントを発行
   * @param {string} event - イベント名
   * @param {*} data - イベントデータ
   */
  emit(event, data) {
    const listeners = this._listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`EventBus: Error in listener for "${event}"`, error);
        }
      });
    }
  }

  /**
   * 特定イベントのリスナー数を取得
   * @param {string} event - イベント名
   * @returns {number} リスナー数
   */
  listenerCount(event) {
    const listeners = this._listeners.get(event);
    return listeners ? listeners.size : 0;
  }

  /**
   * 全リスナーをクリア（テスト用）
   */
  clear() {
    this._listeners.clear();
  }
}

// シングルトンインスタンス
export const eventBus = new EventBus();
