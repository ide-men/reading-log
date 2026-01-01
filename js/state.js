// ========================================
// State Manager
// ========================================
import { SCHEMA_VERSION } from './constants.js';

// 初期状態を作成する関数
export function createInitialMeta() {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: new Date().toISOString()
  };
}

export function createInitialStats() {
  return {
    total: 0,
    today: 0,
    date: new Date().toDateString(),
    sessions: 0,
    firstSessionDate: null
  };
}

export function createInitialState() {
  return {
    meta: createInitialMeta(),
    stats: createInitialStats(),
    books: [],
    history: [],
    archived: {}
  };
}

// State Manager クラス
class StateManager {
  constructor() {
    this._state = null;
    this._listeners = new Set();
  }

  // 状態を初期化
  initialize(state) {
    this._state = state;
  }

  // 現在の状態を取得（読み取り専用のコピー）
  getState() {
    return this._state;
  }

  // 状態を更新
  setState(updates) {
    if (typeof updates === 'function') {
      this._state = updates(this._state);
    } else {
      this._state = { ...this._state, ...updates };
    }
    this._notifyListeners();
  }

  // 特定のプロパティを更新
  updateStats(updates) {
    this._state.stats = { ...this._state.stats, ...updates };
    this._notifyListeners();
  }

  updateMeta(updates) {
    this._state.meta = { ...this._state.meta, ...updates };
    this._notifyListeners();
  }

  // 本を追加
  addBook(book) {
    this._state.books.push(book);
    this._notifyListeners();
  }

  // 本を更新
  updateBook(id, updates) {
    const book = this._state.books.find(b => b.id === id);
    if (book) {
      Object.assign(book, updates);
      this._notifyListeners();
    }
  }

  // 本を削除
  removeBook(id) {
    this._state.books = this._state.books.filter(b => b.id !== id);
    this._notifyListeners();
  }

  // 本を取得
  getBook(id) {
    return this._state.books.find(b => b.id === id);
  }

  // 履歴を追加
  addHistory(entry) {
    this._state.history.push(entry);
    this._notifyListeners();
  }

  // 履歴を更新
  setHistory(history) {
    this._state.history = history;
    this._notifyListeners();
  }

  // アーカイブを更新
  updateArchived(monthKey, data) {
    if (!this._state.archived[monthKey]) {
      this._state.archived[monthKey] = { sessions: 0, totalMinutes: 0 };
    }
    this._state.archived[monthKey].sessions += data.sessions || 0;
    this._state.archived[monthKey].totalMinutes += data.totalMinutes || 0;
  }

  // アーカイブを削除
  removeArchived(monthKey) {
    delete this._state.archived[monthKey];
  }

  // リスナーを登録
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  // リスナーに通知
  _notifyListeners() {
    this._listeners.forEach(listener => listener(this._state));
  }
}

// シングルトンインスタンス
export const stateManager = new StateManager();
