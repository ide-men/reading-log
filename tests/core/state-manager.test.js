import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  stateManager,
  createInitialState,
  createInitialMeta,
  createInitialStats,
  createInitialUI
} from '../../js/core/state-manager.js';
import { BOOK_STATUS } from '../../js/shared/constants.js';

// eventBusをモック
vi.mock('../../js/shared/event-bus.js', () => ({
  eventBus: { emit: vi.fn() },
  Events: {
    STATE_CHANGED: 'STATE_CHANGED',
    BOOK_ADDED: 'BOOK_ADDED',
    BOOK_UPDATED: 'BOOK_UPDATED',
    BOOK_DELETED: 'BOOK_DELETED'
  }
}));

describe('createInitialMeta', () => {
  it('スキーマバージョンと作成日時を持つメタデータを生成', () => {
    const meta = createInitialMeta();

    expect(meta.schemaVersion).toBe(1);
    expect(meta.createdAt).toBeDefined();
    expect(() => new Date(meta.createdAt)).not.toThrow();
  });
});

describe('createInitialStats', () => {
  it('ゼロ値の統計データを生成', () => {
    const stats = createInitialStats();

    expect(stats.total).toBe(0);
    expect(stats.today).toBe(0);
    expect(stats.sessions).toBe(0);
    expect(stats.firstSessionDate).toBeNull();
    expect(stats.date).toBeDefined();
  });
});

describe('createInitialUI', () => {
  it('null値のUI状態を生成', () => {
    const ui = createInitialUI();

    expect(ui.selectedBookId).toBeNull();
    expect(ui.studySelectedBookId).toBeNull();
    expect(ui.storeSelectedBookId).toBeNull();
    expect(ui.editingBookId).toBeNull();
    expect(ui.deletingBookId).toBeNull();
    expect(ui.detailBookId).toBeNull();
    expect(ui.currentStudyStatus).toBe(BOOK_STATUS.UNREAD);
  });
});

describe('createInitialState', () => {
  it('完全な初期状態を生成', () => {
    const state = createInitialState();

    expect(state.meta).toBeDefined();
    expect(state.stats).toBeDefined();
    expect(state.books).toEqual([]);
    expect(state.history).toEqual([]);
    expect(state.archived).toEqual({});
  });
});

describe('StateManager', () => {
  beforeEach(() => {
    stateManager.initialize(createInitialState());
  });

  describe('initialize', () => {
    it('状態を初期化する', () => {
      const newState = {
        meta: { schemaVersion: 1 },
        stats: { total: 100 },
        books: [{ id: 1, title: 'テスト' }],
        history: [],
        archived: {}
      };

      stateManager.initialize(newState);

      expect(stateManager.getState()).toBe(newState);
    });

    it('UI状態もリセットする', () => {
      stateManager.setSelectedBookId(123);
      stateManager.initialize(createInitialState());

      expect(stateManager.getSelectedBookId()).toBeNull();
    });
  });

  describe('UI状態の操作', () => {
    it('getUI/setUIで汎用的にアクセスできる', () => {
      stateManager.setUI('selectedBookId', 42);
      expect(stateManager.getUI('selectedBookId')).toBe(42);
    });

    it('getUI()でUI状態全体を取得', () => {
      const ui = stateManager.getUI();
      expect(ui).toHaveProperty('selectedBookId');
      expect(ui).toHaveProperty('studySelectedBookId');
    });

    it('カルーセル選択', () => {
      stateManager.setSelectedBookId(1);
      expect(stateManager.getSelectedBookId()).toBe(1);
    });

    it('書斎選択', () => {
      stateManager.setStudySelectedBookId(2);
      expect(stateManager.getStudySelectedBookId()).toBe(2);

      stateManager.clearStudySelection();
      expect(stateManager.getStudySelectedBookId()).toBeNull();
    });

    it('本屋選択', () => {
      stateManager.setStoreSelectedBookId(3);
      expect(stateManager.getStoreSelectedBookId()).toBe(3);

      stateManager.clearStoreSelection();
      expect(stateManager.getStoreSelectedBookId()).toBeNull();
    });

    it('書斎ステータス', () => {
      stateManager.setCurrentStudyStatus(BOOK_STATUS.COMPLETED);
      expect(stateManager.getCurrentStudyStatus()).toBe(BOOK_STATUS.COMPLETED);
    });

    it('編集・削除状態', () => {
      stateManager.setEditingBookId(10);
      expect(stateManager.getEditingBookId()).toBe(10);

      stateManager.setDeletingBookId(20);
      expect(stateManager.getDeletingBookId()).toBe(20);
    });

    it('詳細ダイアログ', () => {
      stateManager.setDetailBookId(30);
      expect(stateManager.getDetailBookId()).toBe(30);
    });

    it('中断確認', () => {
      stateManager.setDroppingBookId(40);
      expect(stateManager.getDroppingBookId()).toBe(40);
    });

    it('読了時の感想入力', () => {
      stateManager.setReadingNoteBookId(50);
      expect(stateManager.getReadingNoteBookId()).toBe(50);
    });

    it('読書終了時の栞入力', () => {
      stateManager.setReadingBookmarkBookId(60);
      expect(stateManager.getReadingBookmarkBookId()).toBe(60);
    });
  });

  describe('setState', () => {
    it('オブジェクトで状態を更新', () => {
      stateManager.setState({ stats: { total: 200 } });

      expect(stateManager.getState().stats.total).toBe(200);
    });

    it('関数で状態を更新', () => {
      stateManager.setState(prev => ({
        ...prev,
        stats: { ...prev.stats, total: prev.stats.total + 50 }
      }));

      expect(stateManager.getState().stats.total).toBe(50);
    });
  });

  describe('updateStats', () => {
    it('統計を部分更新', () => {
      stateManager.updateStats({ total: 300, sessions: 10 });

      const stats = stateManager.getState().stats;
      expect(stats.total).toBe(300);
      expect(stats.sessions).toBe(10);
    });
  });

  describe('updateMeta', () => {
    it('メタデータを部分更新', () => {
      stateManager.updateMeta({ importedAt: '2024-01-01' });

      expect(stateManager.getState().meta.importedAt).toBe('2024-01-01');
    });
  });

  describe('本の操作', () => {
    it('addBook: 本を追加', () => {
      const book = { id: 1, title: 'テスト本', status: 'reading' };
      stateManager.addBook(book);

      expect(stateManager.getState().books).toHaveLength(1);
      expect(stateManager.getBook(1)).toEqual(book);
    });

    it('updateBook: 本を更新', () => {
      stateManager.addBook({ id: 1, title: '元のタイトル' });
      stateManager.updateBook(1, { title: '新しいタイトル' });

      expect(stateManager.getBook(1).title).toBe('新しいタイトル');
    });

    it('updateBook: 存在しない本は何もしない', () => {
      stateManager.updateBook(999, { title: 'テスト' });
      expect(stateManager.getBook(999)).toBeUndefined();
    });

    it('removeBook: 本を削除', () => {
      stateManager.addBook({ id: 1, title: 'テスト' });
      stateManager.addBook({ id: 2, title: 'テスト2' });

      stateManager.removeBook(1);

      expect(stateManager.getState().books).toHaveLength(1);
      expect(stateManager.getBook(1)).toBeUndefined();
      expect(stateManager.getBook(2)).toBeDefined();
    });
  });

  describe('履歴の操作', () => {
    it('addHistory: 履歴を追加', () => {
      const entry = { d: '2024-01-01', m: 30, h: 10 };
      stateManager.addHistory(entry);

      expect(stateManager.getState().history).toHaveLength(1);
    });

    it('setHistory: 履歴を置換', () => {
      stateManager.addHistory({ d: '2024-01-01', m: 30, h: 10 });
      stateManager.setHistory([]);

      expect(stateManager.getState().history).toHaveLength(0);
    });
  });

  describe('アーカイブの操作', () => {
    it('updateArchived: アーカイブを更新（新規）', () => {
      stateManager.updateArchived('2024-01', { sessions: 5, totalMinutes: 100 });

      const archived = stateManager.getState().archived['2024-01'];
      expect(archived.sessions).toBe(5);
      expect(archived.totalMinutes).toBe(100);
    });

    it('updateArchived: アーカイブを更新（加算）', () => {
      stateManager.updateArchived('2024-01', { sessions: 5, totalMinutes: 100 });
      stateManager.updateArchived('2024-01', { sessions: 3, totalMinutes: 50 });

      const archived = stateManager.getState().archived['2024-01'];
      expect(archived.sessions).toBe(8);
      expect(archived.totalMinutes).toBe(150);
    });

    it('removeArchived: アーカイブを削除', () => {
      stateManager.updateArchived('2024-01', { sessions: 5, totalMinutes: 100 });
      stateManager.removeArchived('2024-01');

      expect(stateManager.getState().archived['2024-01']).toBeUndefined();
    });
  });

  describe('Pub/Sub', () => {
    it('subscribe/unsubscribe', () => {
      const listener = vi.fn();

      const unsubscribe = stateManager.subscribe(listener);
      stateManager.addBook({ id: 1, title: 'テスト' });

      expect(listener).toHaveBeenCalled();

      listener.mockClear();
      unsubscribe();

      stateManager.addBook({ id: 2, title: 'テスト2' });
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
