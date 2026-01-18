import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CONFIG, STORAGE_KEYS } from '../../js/shared/constants.js';
import {
  setupFakeTimers,
  teardownFakeTimers,
  createTimerDependenciesMock,
  createTestBook,
  createTestStats
} from '../helpers/index.js';

// localStorageをモック
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// stateManagerをモック
const mockState = {
  stats: createTestStats(),
  books: []
};

vi.mock('../../js/core/state-manager.js', () => ({
  stateManager: {
    getState: vi.fn(() => mockState),
    getBook: vi.fn((id) => mockState.books.find(b => b.id === id)),
    updateStats: vi.fn((updates) => {
      Object.assign(mockState.stats, updates);
    }),
    updateBook: vi.fn((id, updates) => {
      const book = mockState.books.find(b => b.id === id);
      if (book) Object.assign(book, updates);
    }),
    addHistory: vi.fn()
  }
}));

vi.mock('../../js/core/storage.js', () => ({
  saveState: vi.fn()
}));

vi.mock('../../js/shared/event-bus.js', () => ({
  eventBus: { emit: vi.fn() },
  Events: {
    TIMER_TICK: 'TIMER_TICK',
    TIMER_STARTED: 'TIMER_STARTED',
    TIMER_STOPPED: 'TIMER_STOPPED',
    SESSION_COMPLETED: 'SESSION_COMPLETED'
  }
}));

let timerService;

describe('timer-service.js', () => {
  beforeEach(async () => {
    setupFakeTimers();
    vi.clearAllMocks();
    localStorageMock.clear();
    mockState.stats = createTestStats();
    mockState.books = [];
    vi.resetModules();
    timerService = await import('../../js/domain/timer/timer-service.js');
  });

  afterEach(() => {
    if (timerService.isTimerRunning()) {
      timerService.cancelReading();
    }
    teardownFakeTimers();
  });

  describe('isTimerRunning', () => {
    it('初期状態ではfalse', () => {
      expect(timerService.isTimerRunning()).toBe(false);
    });

    it('タイマー開始後はtrue', () => {
      timerService.startReading();
      expect(timerService.isTimerRunning()).toBe(true);
    });
  });

  describe('getSeconds', () => {
    it('初期状態では0', () => {
      expect(timerService.getSeconds()).toBe(0);
    });

    it('タイマー動作中は秒数が増加', () => {
      timerService.startReading();
      vi.advanceTimersByTime(5000);
      expect(timerService.getSeconds()).toBe(5);
    });
  });

  describe('getCurrentBookId', () => {
    it('初期状態ではnull', () => {
      expect(timerService.getCurrentBookId()).toBeNull();
    });

    it('本を指定して開始するとそのIDが返る', () => {
      mockState.books = [createTestBook({ id: 42, title: 'Test Book' })];
      timerService.startReading(42);
      expect(timerService.getCurrentBookId()).toBe(42);
    });
  });

  describe('getFormattedTime', () => {
    it('タイマー未開始時は0:00', () => {
      expect(timerService.getFormattedTime()).toBe('0:00');
    });

    it('秒数をMM:SS形式でフォーマット', () => {
      timerService.startReading();
      vi.advanceTimersByTime(65000);
      expect(timerService.getFormattedTime()).toBe('1:05');
    });

    it('10分以上も正しくフォーマット', () => {
      timerService.startReading();
      vi.advanceTimersByTime(600000);
      expect(timerService.getFormattedTime()).toBe('10:00');
    });
  });

  describe('startReading', () => {
    it('タイマーを開始する', () => {
      const result = timerService.startReading();
      expect(timerService.isTimerRunning()).toBe(true);
      expect(result.book).toBeNull();
    });

    it('本を指定して開始', () => {
      mockState.books = [createTestBook({ id: 1, title: 'Test Book' })];
      const result = timerService.startReading(1);
      expect(result.book.title).toBe('Test Book');
    });

    it('既に動作中の場合は何もしない', () => {
      timerService.startReading();
      const result = timerService.startReading();
      expect(result.book).toBeNull();
    });
  });

  describe('stopReading', () => {
    it('タイマーを停止する', () => {
      timerService.startReading();
      vi.advanceTimersByTime(60000);
      const result = timerService.stopReading();
      expect(timerService.isTimerRunning()).toBe(false);
      expect(result.minutes).toBe(1);
    });

    it('最低セッション時間未満は無効', () => {
      timerService.startReading();
      vi.advanceTimersByTime((CONFIG.minSessionMinutes - 1) * 60000);
      const result = timerService.stopReading();
      expect(result.isValidSession).toBe(false);
    });

    it('最低セッション時間以上は有効', () => {
      timerService.startReading();
      vi.advanceTimersByTime(CONFIG.minSessionMinutes * 60000);
      const result = timerService.stopReading();
      expect(result.isValidSession).toBe(true);
    });

    it('タイマーが動いていない場合', () => {
      const result = timerService.stopReading();
      expect(result.minutes).toBe(0);
      expect(result.isValidSession).toBe(false);
    });

    it('統計が更新される', async () => {
      const { stateManager } = await import('../../js/core/state-manager.js');
      timerService.startReading();
      vi.advanceTimersByTime(600000);
      timerService.stopReading();
      expect(stateManager.updateStats).toHaveBeenCalled();
    });

    it('本の読書時間が更新される', async () => {
      const { stateManager } = await import('../../js/core/state-manager.js');
      mockState.books = [createTestBook({ id: 1, readingTime: 0 })];
      timerService.startReading(1);
      vi.advanceTimersByTime(120000);
      timerService.stopReading();
      expect(stateManager.updateBook).toHaveBeenCalledWith(1, { readingTime: 2 });
    });

    it('有効セッションで履歴が追加される', async () => {
      const { stateManager } = await import('../../js/core/state-manager.js');
      timerService.startReading();
      vi.advanceTimersByTime(CONFIG.minSessionMinutes * 60000);
      timerService.stopReading();
      expect(stateManager.addHistory).toHaveBeenCalled();
    });
  });

  describe('cancelReading', () => {
    it('タイマーをキャンセル（統計に記録しない）', async () => {
      const { stateManager } = await import('../../js/core/state-manager.js');
      timerService.startReading();
      vi.advanceTimersByTime(600000);
      timerService.cancelReading();
      expect(timerService.isTimerRunning()).toBe(false);
      expect(timerService.getSeconds()).toBe(0);
      expect(stateManager.updateStats).not.toHaveBeenCalled();
    });

    it('タイマーが動いていない場合は何もしない', () => {
      timerService.cancelReading();
      expect(timerService.isTimerRunning()).toBe(false);
    });
  });
});

// TimerServiceクラスのテスト（依存性注入パターン）
import { createTimerService } from '../../js/domain/timer/timer-service.js';
import { Events } from '../../js/shared/event-bus.js';

describe('TimerService クラス（依存性注入）', () => {
  let timer;
  let mockDeps;

  beforeEach(() => {
    setupFakeTimers();
    mockDeps = createTimerDependenciesMock();
    timer = createTimerService(mockDeps);
  });

  afterEach(() => {
    timer.reset();
    teardownFakeTimers();
  });

  it('初期状態ではタイマー停止中', () => {
    expect(timer.isTimerRunning()).toBe(false);
    expect(timer.getSeconds()).toBe(0);
    expect(timer.getCurrentBookId()).toBeNull();
  });

  it('タイマー開始時にイベントを発行', () => {
    timer.startReading(1);
    expect(mockDeps.emit).toHaveBeenCalledWith(Events.TIMER_STARTED, {
      bookId: 1,
      book: undefined
    });
  });

  it('タイマー停止時に正しいDateを使用', () => {
    const fixedDate = new Date('2024-06-15T14:30:00');
    mockDeps.now.mockReturnValue(fixedDate);
    mockDeps.getState.mockReturnValue({ stats: createTestStats() });

    timer.startReading();
    vi.advanceTimersByTime(CONFIG.minSessionMinutes * 60000);
    timer.stopReading();

    expect(mockDeps.addHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        d: fixedDate.toISOString(),
        h: 14
      })
    );
  });

  it('本の読書時間が更新される', () => {
    const testBook = createTestBook({ id: 42, readingTime: 10 });
    mockDeps.getBook.mockReturnValue(testBook);
    mockDeps.getState.mockReturnValue({ stats: createTestStats() });

    timer.startReading(42);
    vi.advanceTimersByTime(180000);
    timer.stopReading();

    expect(mockDeps.updateBook).toHaveBeenCalledWith(42, { readingTime: 13 });
  });

  it('reset()でタイマー状態がクリアされる', () => {
    timer.startReading(1);
    vi.advanceTimersByTime(5000);
    timer.reset();

    expect(timer.isTimerRunning()).toBe(false);
    expect(timer.getSeconds()).toBe(0);
    expect(timer.getCurrentBookId()).toBeNull();
  });
});

// アクティブセッション永続化のテスト
describe('アクティブセッション永続化', () => {
  beforeEach(async () => {
    setupFakeTimers();
    vi.clearAllMocks();
    localStorageMock.clear();
    mockState.stats = createTestStats();
    mockState.books = [];
    vi.resetModules();
    timerService = await import('../../js/domain/timer/timer-service.js');
  });

  afterEach(() => {
    if (timerService.isTimerRunning()) {
      timerService.cancelReading();
    }
    teardownFakeTimers();
  });

  describe('getActiveSession', () => {
    it('セッションがない場合はnullを返す', () => {
      expect(timerService.getActiveSession()).toBeNull();
    });

    it('保存されたセッションを取得できる', () => {
      const sessionData = {
        startTime: Date.now(),
        bookId: 42,
        savedAt: Date.now()
      };
      localStorageMock.setItem(STORAGE_KEYS.activeSession, JSON.stringify(sessionData));

      const session = timerService.getActiveSession();
      expect(session).not.toBeNull();
      expect(session.bookId).toBe(42);
    });

    it('不正なデータの場合はnullを返す', () => {
      localStorageMock.setItem(STORAGE_KEYS.activeSession, 'invalid json');
      expect(timerService.getActiveSession()).toBeNull();
    });
  });

  describe('startReading時のセッション保存', () => {
    it('読書開始時にセッションがストレージに保存される', () => {
      mockState.books = [createTestBook({ id: 1 })];
      timerService.startReading(1);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.activeSession,
        expect.any(String)
      );

      const saved = JSON.parse(localStorageMock.setItem.mock.calls.find(
        call => call[0] === STORAGE_KEYS.activeSession
      )[1]);
      expect(saved.bookId).toBe(1);
      expect(saved.startTime).toBeDefined();
    });
  });

  describe('stopReading時のセッションクリア', () => {
    it('読書停止時にセッションがクリアされる', () => {
      timerService.startReading(1);
      vi.advanceTimersByTime(60000);
      timerService.stopReading();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.activeSession);
    });
  });

  describe('cancelReading時のセッションクリア', () => {
    it('読書キャンセル時にセッションがクリアされる', () => {
      timerService.startReading(1);
      timerService.cancelReading();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.activeSession);
    });
  });

  describe('recordIncompleteSession', () => {
    it('有効なセッションを記録できる', async () => {
      const { stateManager } = await import('../../js/core/state-manager.js');
      mockState.books = [createTestBook({ id: 42, readingTime: 0 })];

      const session = {
        startTime: Date.now() - 15 * 60 * 1000, // 15分前
        bookId: 42
      };
      const endTime = new Date();

      const result = timerService.recordIncompleteSession(session, endTime);

      expect(result.minutes).toBe(15);
      expect(result.isValidSession).toBe(true);
      expect(stateManager.updateStats).toHaveBeenCalled();
      expect(stateManager.updateBook).toHaveBeenCalledWith(42, { readingTime: 15 });
      expect(stateManager.addHistory).toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.activeSession);
    });

    it('無効なセッション（5分未満）は履歴に追加されない', async () => {
      const { stateManager } = await import('../../js/core/state-manager.js');

      const session = {
        startTime: Date.now() - 4 * 60 * 1000, // 4分前
        bookId: null
      };
      const endTime = new Date();

      const result = timerService.recordIncompleteSession(session, endTime);

      expect(result.minutes).toBe(4);
      expect(result.isValidSession).toBe(false);
      expect(stateManager.addHistory).not.toHaveBeenCalled();
    });
  });

  describe('discardIncompleteSession', () => {
    it('セッションを破棄できる', () => {
      const sessionData = {
        startTime: Date.now(),
        bookId: 42,
        savedAt: Date.now()
      };
      localStorageMock.setItem(STORAGE_KEYS.activeSession, JSON.stringify(sessionData));

      timerService.discardIncompleteSession();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.activeSession);
    });
  });
});
