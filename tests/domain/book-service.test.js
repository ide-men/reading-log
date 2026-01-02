import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BOOK_STATUS } from '../../js/shared/constants.js';

// book-repositoryをモック
const mockBooks = new Map();
vi.mock('../../js/domain/book/book-repository.js', () => ({
  addBook: vi.fn((book) => { mockBooks.set(book.id, book); }),
  getBookById: vi.fn((id) => mockBooks.get(id)),
  updateBook: vi.fn((id, updates) => {
    const book = mockBooks.get(id);
    if (book) Object.assign(book, updates);
  }),
  removeBook: vi.fn((id) => { mockBooks.delete(id); }),
  getBooksByStatus: vi.fn((status) => Array.from(mockBooks.values()).filter(b => b.status === status)),
  getAllBooks: vi.fn(() => Array.from(mockBooks.values())),
  getBookColor: vi.fn(() => '#c62828')
}));

// eventBusをモック
vi.mock('../../js/shared/event-bus.js', () => ({
  eventBus: { emit: vi.fn() },
  Events: {
    BOOK_STATUS_CHANGED: 'BOOK_STATUS_CHANGED'
  }
}));

import {
  addBook,
  editBook,
  deleteBook,
  acquireBook,
  moveToReading,
  startReadingBook,
  completeBook,
  dropBook,
  saveCompletionNote,
  addReflection,
  getBooksForReunion,
  getBookById,
  getBooksByStatus,
  getAllBooks
} from '../../js/domain/book/book-service.js';

describe('book-service.js', () => {
  beforeEach(() => {
    mockBooks.clear();
    vi.clearAllMocks();
  });

  describe('addBook', () => {
    it('有効なタイトルで本を追加', () => {
      const result = addBook({ title: 'テスト本', status: BOOK_STATUS.READING });

      expect(result.success).toBe(true);
      expect(result.message).toBe('カバンに追加しました');
      expect(result.book).toBeDefined();
      expect(result.book.title).toBe('テスト本');
    });

    it('各ステータスで適切なメッセージを返す', () => {
      expect(addBook({ title: 'A', status: BOOK_STATUS.UNREAD }).message).toBe('積読に追加しました');
      expect(addBook({ title: 'B', status: BOOK_STATUS.COMPLETED }).message).toBe('読了に追加しました');
      expect(addBook({ title: 'C', status: BOOK_STATUS.DROPPED }).message).toBe('中断に追加しました');
      expect(addBook({ title: 'D', status: BOOK_STATUS.WISHLIST }).message).toBe('本屋に追加しました');
    });

    it('空のタイトルはエラー', () => {
      const result = addBook({ title: '' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('タイトルを入力してください');
    });

    it('デフォルトステータスはreading', () => {
      const result = addBook({ title: 'テスト' });

      expect(result.book.status).toBe(BOOK_STATUS.READING);
    });
  });

  describe('editBook', () => {
    beforeEach(() => {
      mockBooks.set(1, { id: 1, title: '元のタイトル', link: '', status: BOOK_STATUS.READING });
    });

    it('タイトルを編集', () => {
      const result = editBook(1, { title: '新しいタイトル' });

      expect(result.success).toBe(true);
      expect(result.message).toBe('保存しました');
    });

    it('存在しない本はエラー', () => {
      const result = editBook(999, { title: 'テスト' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('本が見つかりません');
    });

    it('空のタイトルはエラー', () => {
      const result = editBook(1, { title: '' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('タイトルを入力してください');
    });
  });

  describe('deleteBook', () => {
    beforeEach(() => {
      mockBooks.set(1, { id: 1, title: 'テスト', status: BOOK_STATUS.READING });
    });

    it('本を削除', () => {
      const result = deleteBook(1);

      expect(result.success).toBe(true);
      expect(result.message).toBe('削除しました');
    });

    it('存在しない本はエラー', () => {
      const result = deleteBook(999);

      expect(result.success).toBe(false);
      expect(result.message).toBe('本が見つかりません');
    });
  });

  describe('acquireBook', () => {
    it('wishlistからunreadへ遷移（書斎に入れる）', () => {
      mockBooks.set(1, { id: 1, title: 'テスト', status: BOOK_STATUS.WISHLIST });

      const result = acquireBook(1);

      expect(result.success).toBe(true);
      expect(result.destination).toBe('書斎');
      expect(typeof result.applyUpdate).toBe('function');
    });

    it('applyUpdateで実際に更新', () => {
      mockBooks.set(1, { id: 1, title: 'テスト', status: BOOK_STATUS.WISHLIST });

      const result = acquireBook(1);
      result.applyUpdate();

      expect(mockBooks.get(1).status).toBe(BOOK_STATUS.UNREAD);
    });

    it('存在しない本は失敗', () => {
      const result = acquireBook(999);

      expect(result.success).toBe(false);
    });
  });

  describe('moveToReading', () => {
    it('wishlistからreadingへ遷移（カバンに入れる）', () => {
      mockBooks.set(1, { id: 1, title: 'テスト', status: BOOK_STATUS.WISHLIST });

      const result = moveToReading(1);

      expect(result.success).toBe(true);
      expect(result.destination).toBe('カバン');
    });

    it('applyUpdateで開始日が設定される', () => {
      mockBooks.set(1, { id: 1, title: 'テスト', status: BOOK_STATUS.WISHLIST });

      const result = moveToReading(1);
      result.applyUpdate();

      const book = mockBooks.get(1);
      expect(book.status).toBe(BOOK_STATUS.READING);
      expect(book.startedAt).toBeDefined();
    });
  });

  describe('startReadingBook', () => {
    it('unreadからreadingへ遷移', () => {
      mockBooks.set(1, { id: 1, title: 'テスト', status: BOOK_STATUS.UNREAD });

      const result = startReadingBook(1);

      expect(result.success).toBe(true);
      expect(result.message).toBe('読書を始めました！');
    });

    it('completedからreadingへ遷移（再読）', () => {
      mockBooks.set(1, { id: 1, title: 'テスト', status: BOOK_STATUS.COMPLETED, completedAt: '2024-01-01' });

      const result = startReadingBook(1);

      expect(result.success).toBe(true);
      expect(result.message).toBe('カバンに入れました！');
      expect(mockBooks.get(1).completedAt).toBeNull();
    });

    it('存在しない本はエラー', () => {
      const result = startReadingBook(999);

      expect(result.success).toBe(false);
      expect(result.message).toBe('本が見つかりません');
    });
  });

  describe('completeBook', () => {
    it('readingからcompletedへ遷移', () => {
      mockBooks.set(1, { id: 1, title: 'テスト', status: BOOK_STATUS.READING });

      const result = completeBook(1);

      expect(result.success).toBe(true);
      expect(result.destination).toBe('読了');
    });

    it('applyUpdateで完了日が設定される', () => {
      mockBooks.set(1, { id: 1, title: 'テスト', status: BOOK_STATUS.READING });

      const result = completeBook(1);
      result.applyUpdate();

      const book = mockBooks.get(1);
      expect(book.status).toBe(BOOK_STATUS.COMPLETED);
      expect(book.completedAt).toBeDefined();
    });
  });

  describe('dropBook', () => {
    it('readingからdroppedへ遷移', () => {
      mockBooks.set(1, { id: 1, title: 'テスト', status: BOOK_STATUS.READING });

      const result = dropBook(1);

      expect(result.success).toBe(true);
      expect(result.message).toBe('本を中断しました');
    });

    it('付箋メモを保存', () => {
      mockBooks.set(1, { id: 1, title: 'テスト', status: BOOK_STATUS.READING });

      dropBook(1, '3章まで読んだ');

      expect(mockBooks.get(1).bookmark).toBe('3章まで読んだ');
    });

    it('存在しない本はエラー', () => {
      const result = dropBook(999);

      expect(result.success).toBe(false);
      expect(result.message).toBe('本が見つかりません');
    });
  });

  describe('saveCompletionNote', () => {
    it('読了時の感想を保存', () => {
      mockBooks.set(1, { id: 1, title: 'テスト', status: BOOK_STATUS.COMPLETED });

      const result = saveCompletionNote(1, '素晴らしい本だった');

      expect(result.success).toBe(true);
      expect(result.message).toBe('保存しました');
      expect(mockBooks.get(1).completionNote).toBe('素晴らしい本だった');
    });

    it('存在しない本はエラー', () => {
      const result = saveCompletionNote(999, 'メモ');

      expect(result.success).toBe(false);
      expect(result.message).toBe('本が見つかりません');
    });
  });

  describe('addReflection', () => {
    it('振り返りを追加', () => {
      mockBooks.set(1, { id: 1, title: 'テスト', status: BOOK_STATUS.COMPLETED, reflections: [] });

      const result = addReflection(1, '今読み返すと違う視点が見えた');

      expect(result.success).toBe(true);
      expect(result.message).toBe('振り返りを保存しました');
      expect(mockBooks.get(1).reflections).toHaveLength(1);
      expect(mockBooks.get(1).reflections[0].note).toBe('今読み返すと違う視点が見えた');
    });

    it('複数の振り返りを追加', () => {
      mockBooks.set(1, {
        id: 1,
        title: 'テスト',
        status: BOOK_STATUS.COMPLETED,
        reflections: [{ date: '2024-01-01', note: '最初の振り返り' }]
      });

      addReflection(1, '2回目の振り返り');

      expect(mockBooks.get(1).reflections).toHaveLength(2);
    });

    it('存在しない本はエラー', () => {
      const result = addReflection(999, 'メモ');

      expect(result.success).toBe(false);
      expect(result.message).toBe('本が見つかりません');
    });
  });

  describe('getBooksForReunion', () => {
    it('3ヶ月以上前に読了した本を取得', () => {
      const fourMonthsAgo = new Date();
      fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      mockBooks.set(1, {
        id: 1,
        title: '古い本',
        status: BOOK_STATUS.COMPLETED,
        completedAt: fourMonthsAgo.toISOString().split('T')[0]
      });
      mockBooks.set(2, {
        id: 2,
        title: '新しい本',
        status: BOOK_STATUS.COMPLETED,
        completedAt: oneMonthAgo.toISOString().split('T')[0]
      });

      const reunionBooks = getBooksForReunion();

      expect(reunionBooks).toHaveLength(1);
      expect(reunionBooks[0].title).toBe('古い本');
    });

    it('読了以外のステータスは除外', () => {
      const fourMonthsAgo = new Date();
      fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

      mockBooks.set(1, {
        id: 1,
        title: '読書中',
        status: BOOK_STATUS.READING,
        completedAt: fourMonthsAgo.toISOString().split('T')[0]
      });

      const reunionBooks = getBooksForReunion();

      expect(reunionBooks).toHaveLength(0);
    });
  });

  describe('クエリ関数', () => {
    beforeEach(() => {
      mockBooks.set(1, { id: 1, title: 'A', status: BOOK_STATUS.READING });
      mockBooks.set(2, { id: 2, title: 'B', status: BOOK_STATUS.COMPLETED });
    });

    it('getBookById', () => {
      expect(getBookById(1)).toBeDefined();
      expect(getBookById(1).title).toBe('A');
    });

    it('getBooksByStatus', () => {
      const reading = getBooksByStatus(BOOK_STATUS.READING);
      expect(reading).toHaveLength(1);
    });

    it('getAllBooks', () => {
      const all = getAllBooks();
      expect(all).toHaveLength(2);
    });
  });
});
