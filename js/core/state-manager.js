// ========================================
// State Manager
// アプリケーション全体の状態を管理
// ========================================
import { SCHEMA_VERSION, BOOK_STATUS } from '../shared/constants.js';
import { eventBus, Events } from '../shared/event-bus.js';

// ========================================
// 初期状態の生成関数
// ========================================

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

// UI状態の初期値（永続化しない）
export function createInitialUI() {
  return {
    selectedBookId: null,        // カルーセルで選択中
    studySelectedBookId: null,   // 書斎で選択中
    storeSelectedBookId: null,   // 本屋で選択中
    currentStudyStatus: BOOK_STATUS.UNREAD,  // 書斎の現在のタブ
    selectedLabelId: null,       // 書斎でフィルタリング中のラベル
    editingBookId: null,         // 編集中の本
    deletingBookId: null,        // 削除確認中の本
    detailBookId: null,          // 詳細ダイアログで開いている本
    droppingBookId: null,        // 中断確認中の本
    readingNoteBookId: null,     // 読了時の感想入力中の本
    readingBookmarkBookId: null, // 読書終了時の栞入力中の本
    editingLabelId: null         // 編集中のラベル
  };
}

export function createInitialState() {
  return {
    meta: createInitialMeta(),
    stats: createInitialStats(),
    books: [],
    history: [],
    archived: {},
    labels: []
  };
}

// ========================================
// State Manager クラス
// ========================================

class StateManager {
  constructor() {
    this._state = null;
    this._ui = createInitialUI();  // UI状態（永続化しない）
    this._listeners = new Set();
  }

  // 状態を初期化
  initialize(state) {
    this._state = state;
    this._ui = createInitialUI();  // UI状態をリセット
  }

  // ========================================
  // UI状態の getter/setter
  // ========================================
  getUI(key) {
    return key ? this._ui[key] : this._ui;
  }

  setUI(key, value) {
    this._ui[key] = value;
  }

  // カルーセル選択
  getSelectedBookId() { return this._ui.selectedBookId; }
  setSelectedBookId(id) { this._ui.selectedBookId = id; }

  // 書斎選択
  getStudySelectedBookId() { return this._ui.studySelectedBookId; }
  setStudySelectedBookId(id) { this._ui.studySelectedBookId = id; }
  clearStudySelection() { this._ui.studySelectedBookId = null; }

  // 本屋選択
  getStoreSelectedBookId() { return this._ui.storeSelectedBookId; }
  setStoreSelectedBookId(id) { this._ui.storeSelectedBookId = id; }
  clearStoreSelection() { this._ui.storeSelectedBookId = null; }

  // 書斎ステータス
  getCurrentStudyStatus() { return this._ui.currentStudyStatus; }
  setCurrentStudyStatus(status) { this._ui.currentStudyStatus = status; }

  // 編集・削除
  getEditingBookId() { return this._ui.editingBookId; }
  setEditingBookId(id) { this._ui.editingBookId = id; }
  getDeletingBookId() { return this._ui.deletingBookId; }
  setDeletingBookId(id) { this._ui.deletingBookId = id; }

  // 詳細ダイアログ
  getDetailBookId() { return this._ui.detailBookId; }
  setDetailBookId(id) { this._ui.detailBookId = id; }

  // 中断確認
  getDroppingBookId() { return this._ui.droppingBookId; }
  setDroppingBookId(id) { this._ui.droppingBookId = id; }

  // 読了時の感想入力
  getReadingNoteBookId() { return this._ui.readingNoteBookId; }
  setReadingNoteBookId(id) { this._ui.readingNoteBookId = id; }

  // 読書終了時の栞入力
  getReadingBookmarkBookId() { return this._ui.readingBookmarkBookId; }
  setReadingBookmarkBookId(id) { this._ui.readingBookmarkBookId = id; }

  // ラベルフィルター
  getSelectedLabelId() { return this._ui.selectedLabelId; }
  setSelectedLabelId(id) { this._ui.selectedLabelId = id; }

  // ラベル編集
  getEditingLabelId() { return this._ui.editingLabelId; }
  setEditingLabelId(id) { this._ui.editingLabelId = id; }

  // ========================================
  // 永続化状態の getter/setter
  // ========================================

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
    eventBus.emit(Events.STATE_CHANGED, this._state);
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

  // ========================================
  // 本の操作
  // ========================================

  addBook(book) {
    this._state.books.push(book);
    this._notifyListeners();
    eventBus.emit(Events.BOOK_ADDED, book);
  }

  updateBook(id, updates) {
    const book = this._state.books.find(b => b.id === id);
    if (book) {
      Object.assign(book, updates);
      this._notifyListeners();
      eventBus.emit(Events.BOOK_UPDATED, { id, updates, book });
    }
  }

  removeBook(id) {
    const book = this._state.books.find(b => b.id === id);
    this._state.books = this._state.books.filter(b => b.id !== id);
    this._notifyListeners();
    eventBus.emit(Events.BOOK_DELETED, { id, book });
  }

  getBook(id) {
    return this._state.books.find(b => b.id === id);
  }

  // ========================================
  // ラベルの操作
  // ========================================

  addLabel(label) {
    this._state.labels.push(label);
    this._notifyListeners();
  }

  updateLabel(id, updates) {
    const label = this._state.labels.find(l => l.id === id);
    if (label) {
      Object.assign(label, updates);
      this._notifyListeners();
    }
  }

  removeLabel(id) {
    this._state.labels = this._state.labels.filter(l => l.id !== id);
    // ラベルが削除されたら、本からもそのラベルIDを除外
    this._state.books.forEach(book => {
      if (book.labelIds && book.labelIds.includes(id)) {
        book.labelIds = book.labelIds.filter(labelId => labelId !== id);
      }
    });
    this._notifyListeners();
  }

  getLabel(id) {
    return this._state.labels.find(l => l.id === id);
  }

  getLabels() {
    return this._state.labels;
  }

  // ========================================
  // 履歴の操作
  // ========================================

  addHistory(entry) {
    this._state.history.push(entry);
    this._notifyListeners();
  }

  setHistory(history) {
    this._state.history = history;
    this._notifyListeners();
  }

  // ========================================
  // アーカイブの操作
  // ========================================

  updateArchived(monthKey, data) {
    if (!this._state.archived[monthKey]) {
      this._state.archived[monthKey] = { sessions: 0, totalMinutes: 0 };
    }
    this._state.archived[monthKey].sessions += data.sessions || 0;
    this._state.archived[monthKey].totalMinutes += data.totalMinutes || 0;
  }

  removeArchived(monthKey) {
    delete this._state.archived[monthKey];
  }

  // ========================================
  // Pub/Sub
  // ========================================

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notifyListeners() {
    this._listeners.forEach(listener => listener(this._state));
  }
}

// シングルトンインスタンス
export const stateManager = new StateManager();
