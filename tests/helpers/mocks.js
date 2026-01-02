/**
 * テスト用共通モックファクトリ
 */
import { vi } from 'vitest';

/**
 * LocalStorage モックを作成
 * @param {Object} initialData - 初期データ
 * @returns {Object} localStorage互換オブジェクト
 */
export function createLocalStorageMock(initialData = {}) {
  let store = { ...initialData };
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    getData: () => ({ ...store }),
    _reset: (data = {}) => { store = { ...data }; }
  };
}

/**
 * EventBus モック用のEventsオブジェクト
 */
export const MockEvents = {
  STATE_CHANGED: 'STATE_CHANGED',
  DATA_IMPORTED: 'DATA_IMPORTED',
  DATA_RESET: 'DATA_RESET',
  BOOK_ADDED: 'BOOK_ADDED',
  BOOK_UPDATED: 'BOOK_UPDATED',
  BOOK_DELETED: 'BOOK_DELETED',
  BOOK_STATUS_CHANGED: 'BOOK_STATUS_CHANGED',
  TIMER_TICK: 'TIMER_TICK',
  TIMER_STARTED: 'TIMER_STARTED',
  TIMER_STOPPED: 'TIMER_STOPPED',
  SESSION_COMPLETED: 'SESSION_COMPLETED'
};

/**
 * EventBus モックを作成
 * @returns {Object} eventBus互換オブジェクト
 */
export function createEventBusMock() {
  return {
    emit: vi.fn(),
    on: vi.fn(() => vi.fn()),
    off: vi.fn(),
    once: vi.fn(),
    clear: vi.fn()
  };
}

/**
 * StateManager用のモック状態を作成
 * @param {Object} overrides - 上書きするプロパティ
 * @returns {Object} 状態オブジェクト
 */
export function createMockState(overrides = {}) {
  return {
    meta: { schemaVersion: 1, createdAt: '2024-01-01T00:00:00.000Z' },
    stats: { total: 0, today: 0, date: new Date().toDateString(), sessions: 0, firstSessionDate: null },
    books: [],
    history: [],
    archived: {},
    ...overrides
  };
}

/**
 * StateManager モックを作成
 * @param {Object} initialState - 初期状態
 * @returns {Object} stateManager互換オブジェクト
 */
export function createStateManagerMock(initialState = {}) {
  const state = createMockState(initialState);

  return {
    state,
    getState: vi.fn(() => state),
    getBook: vi.fn((id) => state.books.find(b => b.id === id)),
    initialize: vi.fn(),
    setState: vi.fn((updates) => {
      if (typeof updates === 'function') {
        Object.assign(state, updates(state));
      } else {
        Object.assign(state, updates);
      }
    }),
    addBook: vi.fn((book) => { state.books.push(book); }),
    updateBook: vi.fn((id, updates) => {
      const book = state.books.find(b => b.id === id);
      if (book) Object.assign(book, updates);
    }),
    removeBook: vi.fn((id) => {
      state.books = state.books.filter(b => b.id !== id);
    }),
    updateStats: vi.fn((updates) => {
      Object.assign(state.stats, updates);
    }),
    addHistory: vi.fn((entry) => { state.history.push(entry); }),
    setHistory: vi.fn((history) => { state.history = history; }),
    updateArchived: vi.fn(),
    removeArchived: vi.fn()
  };
}

/**
 * Storage モックを作成
 * @returns {Object} storage互換オブジェクト
 */
export function createStorageMock() {
  return {
    saveState: vi.fn(),
    loadState: vi.fn(),
    saveStateToStorage: vi.fn(),
    getStorageUsage: vi.fn(() => ({
      used: 0,
      limit: 5 * 1024 * 1024,
      percent: 0,
      usedKB: 0,
      limitMB: 5
    }))
  };
}

/**
 * TimerService 依存性モックを作成
 * @param {Object} overrides - 上書きするプロパティ
 * @returns {Object} TimerService用依存性オブジェクト
 */
export function createTimerDependenciesMock(overrides = {}) {
  return {
    getBook: vi.fn(),
    getState: vi.fn(() => ({
      stats: { total: 0, today: 0, sessions: 0, firstSessionDate: null },
      books: []
    })),
    updateStats: vi.fn(),
    updateBook: vi.fn(),
    addHistory: vi.fn(),
    save: vi.fn(),
    emit: vi.fn(),
    now: vi.fn(() => new Date('2024-06-15T12:00:00')),
    ...overrides
  };
}

/**
 * BookRepository用のモックマップを作成
 * @returns {Map} 本のIDをキーとするMap
 */
export function createBookMapMock() {
  return new Map();
}
