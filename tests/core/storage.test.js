import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { STORAGE_KEYS, SCHEMA_VERSION, CONFIG } from '../../js/shared/constants.js';
import { cleanupHistoryPure } from '../../js/core/storage.js';

// stateManagerとeventBusをモック
vi.mock('../../js/shared/event-bus.js', () => ({
  eventBus: { emit: vi.fn() },
  Events: { STATE_CHANGED: 'STATE_CHANGED', DATA_IMPORTED: 'DATA_IMPORTED', DATA_RESET: 'DATA_RESET' }
}));

vi.mock('../../js/core/state-manager.js', () => {
  const mockState = {
    meta: { schemaVersion: 1, createdAt: '2024-01-01T00:00:00.000Z' },
    stats: { total: 100, today: 10, date: 'Mon Jan 01 2024', sessions: 5, firstSessionDate: null },
    books: [{ id: 1, title: 'テスト本' }],
    history: [{ d: '2024-01-01T10:00:00.000Z', m: 30, h: 10, bookId: 1 }],
    archived: {}
  };
  return {
    stateManager: {
      getState: vi.fn(() => mockState),
      initialize: vi.fn(),
      updateArchived: vi.fn(),
      removeArchived: vi.fn(),
      setHistory: vi.fn()
    },
    createInitialState: vi.fn(() => ({
      meta: { schemaVersion: SCHEMA_VERSION, createdAt: new Date().toISOString() },
      stats: { total: 0, today: 0, date: new Date().toDateString(), sessions: 0, firstSessionDate: null },
      books: [],
      history: [],
      archived: {}
    }))
  };
});

// localStorageのモック
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    _getStore: () => store
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('storage.js', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('saveStateToStorage', () => {
    it('状態を各ストレージキーに保存する', async () => {
      const { saveStateToStorage } = await import('../../js/core/storage.js');

      const state = {
        meta: { schemaVersion: 1 },
        stats: { total: 100 },
        books: [{ id: 1 }],
        history: [],
        archived: {}
      };

      saveStateToStorage(state);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEYS.meta, JSON.stringify(state.meta));
      expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEYS.stats, JSON.stringify(state.stats));
      expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEYS.books, JSON.stringify(state.books));
      expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEYS.history, JSON.stringify(state.history));
      expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEYS.archived, JSON.stringify(state.archived));
    });
  });

  describe('loadState', () => {
    it('ストレージにデータがない場合は初期状態を返す', async () => {
      const { loadState } = await import('../../js/core/storage.js');
      const { createInitialState } = await import('../../js/core/state-manager.js');

      const result = loadState();

      expect(createInitialState).toHaveBeenCalled();
    });

    it('ストレージからデータを読み込む', async () => {
      localStorageMock.setItem(STORAGE_KEYS.meta, JSON.stringify({ schemaVersion: 1, createdAt: '2024-01-01' }));
      localStorageMock.setItem(STORAGE_KEYS.stats, JSON.stringify({ total: 50, today: 5, date: new Date().toDateString() }));
      localStorageMock.setItem(STORAGE_KEYS.books, JSON.stringify([{ id: 1, title: 'Book1' }]));
      localStorageMock.setItem(STORAGE_KEYS.history, JSON.stringify([]));
      localStorageMock.setItem(STORAGE_KEYS.archived, JSON.stringify({}));

      // モジュールを再インポートして新しいlocalStorageの値を読む
      vi.resetModules();
      vi.doMock('../../js/shared/event-bus.js', () => ({
        eventBus: { emit: vi.fn() },
        Events: {}
      }));
      vi.doMock('../../js/core/state-manager.js', () => ({
        stateManager: { getState: vi.fn() },
        createInitialState: vi.fn()
      }));

      const { loadState } = await import('../../js/core/storage.js');
      const result = loadState();

      expect(result.meta.schemaVersion).toBe(1);
      expect(result.books).toHaveLength(1);
    });
  });

  describe('getStorageUsage', () => {
    it('ストレージ使用量を計算する', async () => {
      const { getStorageUsage } = await import('../../js/core/storage.js');

      // テストデータをセット
      localStorageMock.setItem(STORAGE_KEYS.meta, 'a'.repeat(100));
      localStorageMock.setItem(STORAGE_KEYS.stats, 'b'.repeat(200));

      const usage = getStorageUsage();

      expect(usage.limit).toBe(5 * 1024 * 1024);
      expect(usage.limitMB).toBe(5);
      expect(typeof usage.used).toBe('number');
      expect(typeof usage.percent).toBe('number');
      expect(typeof usage.usedKB).toBe('number');
    });
  });

  describe('validateImportedStats (via importData)', () => {
    it('不正なstatsを持つインポートは失敗する', async () => {
      const { importData } = await import('../../js/core/storage.js');
      const showToast = vi.fn();
      const onSuccess = vi.fn();

      // stats.totalが欠けているデータ
      const invalidData = {
        stats: { sessions: 1 }, // totalがない
        books: []
      };

      // FileReaderをグローバルにクラスとして定義
      class MockFileReader {
        constructor() {
          this.onload = null;
        }
        readAsText() {
          if (this.onload) {
            this.onload({ target: { result: JSON.stringify(invalidData) } });
          }
        }
      }
      global.FileReader = MockFileReader;

      const file = new Blob([JSON.stringify(invalidData)], { type: 'application/json' });
      importData(file, { showToast, onSuccess });

      expect(showToast).toHaveBeenCalledWith('バックアップデータが破損しています', 4000);
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  // ========================================
  // Pure関数のテスト（モック不要）
  // ========================================

  describe('cleanupHistoryPure', () => {
    it('保持期間内の履歴を返す', () => {
      // CONFIG.historyRetentionDays = 90日
      const now = new Date('2024-06-15T12:00:00.000Z');
      const state = {
        history: [
          { d: '2024-06-14T10:00:00.000Z', m: 30, h: 10 }, // 1日前（保持）
          { d: '2024-06-10T10:00:00.000Z', m: 25, h: 10 }, // 5日前（保持）
          { d: '2024-03-01T10:00:00.000Z', m: 20, h: 10 }  // 約106日前（アーカイブ対象）
        ],
        archived: {}
      };

      const result = cleanupHistoryPure(state, { now });

      expect(result.recentHistory).toHaveLength(2);
      expect(result.recentHistory[0].d).toBe('2024-06-14T10:00:00.000Z');
    });

    it('古い履歴を月別にアーカイブデータとしてまとめる', () => {
      // CONFIG.historyRetentionDays = 90日
      const now = new Date('2024-06-15T12:00:00.000Z');
      const state = {
        history: [
          { d: '2024-02-10T10:00:00.000Z', m: 30, h: 10 }, // 約125日前
          { d: '2024-02-15T10:00:00.000Z', m: 20, h: 14 }  // 約120日前
        ],
        archived: {}
      };

      const result = cleanupHistoryPure(state, { now });

      expect(result.recentHistory).toHaveLength(0);
      expect(result.archiveUpdates['2024-02']).toBeDefined();
      expect(result.archiveUpdates['2024-02'].sessions).toBe(2);
      expect(result.archiveUpdates['2024-02'].totalMinutes).toBe(50);
    });

    it('1年以上前のアーカイブを削除対象にする', () => {
      const now = new Date('2024-06-15T12:00:00.000Z');
      const state = {
        history: [],
        archived: {
          '2023-01': { sessions: 10, totalMinutes: 300 }, // 17ヶ月前（削除対象）
          '2024-01': { sessions: 5, totalMinutes: 150 }   // 5ヶ月前（保持）
        }
      };

      const result = cleanupHistoryPure(state, { now });

      expect(result.archiveKeysToRemove).toContain('2023-01');
      expect(result.archiveKeysToRemove).not.toContain('2024-01');
    });

    it('履歴が空の場合は空の結果を返す', () => {
      const now = new Date();
      const state = {
        history: [],
        archived: {}
      };

      const result = cleanupHistoryPure(state, { now });

      expect(result.recentHistory).toEqual([]);
      expect(result.archiveUpdates).toEqual({});
      expect(result.archiveKeysToRemove).toEqual([]);
    });
  });
});
