import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CONFIG } from '../../js/shared/constants.js';

// stateManagerをモック
const mockState = {
  stats: { total: 0, today: 0, sessions: 0, firstSessionDate: null },
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

// storageをモック
vi.mock('../../js/core/storage.js', () => ({
  saveState: vi.fn()
}));

// eventBusをモック
vi.mock('../../js/shared/event-bus.js', () => ({
  eventBus: { emit: vi.fn() },
  Events: {
    TIMER_TICK: 'TIMER_TICK',
    TIMER_STARTED: 'TIMER_STARTED',
    TIMER_STOPPED: 'TIMER_STOPPED',
    SESSION_COMPLETED: 'SESSION_COMPLETED'
  }
}));

// テスト前にモジュールをリセットするために動的インポート
let timerService;

describe('timer-service.js', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    // 状態をリセット
    mockState.stats = { total: 0, today: 0, sessions: 0, firstSessionDate: null };
    mockState.books = [];

    // モジュールをリセットして再インポート
    vi.resetModules();
    timerService = await import('../../js/domain/timer/timer-service.js');
  });

  afterEach(() => {
    // タイマーが動いていたらキャンセル
    if (timerService.isTimerRunning()) {
      timerService.cancelReading();
    }
    vi.useRealTimers();
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

      vi.advanceTimersByTime(5000); // 5秒経過

      expect(timerService.getSeconds()).toBe(5);
    });
  });

  describe('getCurrentBookId', () => {
    it('初期状態ではnull', () => {
      expect(timerService.getCurrentBookId()).toBeNull();
    });

    it('本を指定して開始するとそのIDが返る', () => {
      mockState.books = [{ id: 42, title: 'Test Book' }];
      timerService.startReading(42);

      expect(timerService.getCurrentBookId()).toBe(42);
    });
  });

  describe('getFormattedTime', () => {
    it('秒数をMM:SS形式でフォーマット', () => {
      timerService.startReading();

      expect(timerService.getFormattedTime()).toBe('0:00');

      vi.advanceTimersByTime(65000); // 65秒 = 1:05

      expect(timerService.getFormattedTime()).toBe('1:05');
    });

    it('10分以上も正しくフォーマット', () => {
      timerService.startReading();
      vi.advanceTimersByTime(600000); // 600秒 = 10:00

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
      mockState.books = [{ id: 1, title: 'Test Book' }];

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
      vi.advanceTimersByTime(60000); // 1分

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
      vi.advanceTimersByTime(600000); // 10分

      timerService.stopReading();

      expect(stateManager.updateStats).toHaveBeenCalled();
    });

    it('本の読書時間が更新される', async () => {
      const { stateManager } = await import('../../js/core/state-manager.js');
      mockState.books = [{ id: 1, title: 'Test', readingTime: 0 }];

      timerService.startReading(1);
      vi.advanceTimersByTime(120000); // 2分

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
      vi.advanceTimersByTime(600000); // 10分

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
