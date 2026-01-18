import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BOOK_STATUS, BOOK_COLORS } from '../../js/shared/constants.js';

// stateManagerをモック
const mockState = {
  books: []
};

vi.mock('../../js/core/state-manager.js', () => ({
  stateManager: {
    getState: vi.fn(() => mockState),
    getBook: vi.fn((id) => mockState.books.find(b => b.id === id)),
    addBook: vi.fn((book) => { mockState.books.push(book); }),
    updateBook: vi.fn((id, updates) => {
      const book = mockState.books.find(b => b.id === id);
      if (book) Object.assign(book, updates);
    }),
    removeBook: vi.fn((id) => {
      mockState.books = mockState.books.filter(b => b.id !== id);
    })
  }
}));

// storageをモック
vi.mock('../../js/core/storage.js', () => ({
  saveState: vi.fn()
}));

import {
  getAllBooks,
  getBookById,
  getBooksByStatus,
  getBookColor,
  addBook,
  updateBook,
  removeBook,
  // Pure関数
  getAllBooksPure,
  getBookByIdPure,
  getBooksByStatusPure,
  getBookColorPure
} from '../../js/domain/book/book-repository.js';
import { saveState } from '../../js/core/storage.js';
import { stateManager } from '../../js/core/state-manager.js';

describe('book-repository.js', () => {
  beforeEach(() => {
    mockState.books = [];
    vi.clearAllMocks();
  });

  describe('getAllBooks', () => {
    it('全ての本を取得', () => {
      mockState.books = [
        { id: 1, title: 'Book1' },
        { id: 2, title: 'Book2' }
      ];

      const books = getAllBooks();

      expect(books).toHaveLength(2);
    });

    it('本がない場合は空配列', () => {
      const books = getAllBooks();

      expect(books).toEqual([]);
    });
  });

  describe('getBookById', () => {
    it('IDで本を取得', () => {
      mockState.books = [{ id: 1, title: 'Test Book' }];

      const book = getBookById(1);

      expect(book).toBeDefined();
      expect(book.title).toBe('Test Book');
    });

    it('存在しないIDはundefined', () => {
      const book = getBookById(999);

      expect(book).toBeUndefined();
    });
  });

  describe('getBooksByStatus', () => {
    beforeEach(() => {
      mockState.books = [
        { id: 1, title: 'A', status: BOOK_STATUS.READING },
        { id: 2, title: 'B', status: BOOK_STATUS.READING },
        { id: 3, title: 'C', status: BOOK_STATUS.COMPLETED },
        { id: 4, title: 'D', status: BOOK_STATUS.UNREAD }
      ];
    });

    it('ステータスでフィルタリング', () => {
      const reading = getBooksByStatus(BOOK_STATUS.READING);
      expect(reading).toHaveLength(2);

      const completed = getBooksByStatus(BOOK_STATUS.COMPLETED);
      expect(completed).toHaveLength(1);

      const unread = getBooksByStatus(BOOK_STATUS.UNREAD);
      expect(unread).toHaveLength(1);
    });

    it('該当なしは空配列', () => {
      const wishlist = getBooksByStatus(BOOK_STATUS.WISHLIST);

      expect(wishlist).toEqual([]);
    });
  });

  describe('getBookColor', () => {
    beforeEach(() => {
      mockState.books = [
        { id: 1, title: 'A' },
        { id: 2, title: 'B' },
        { id: 3, title: 'C' }
      ];
    });

    it('インデックスに基づいた色を返す', () => {
      const color1 = getBookColor({ id: 1 });
      const color2 = getBookColor({ id: 2 });

      expect(color1).toBe(BOOK_COLORS[0]);
      expect(color2).toBe(BOOK_COLORS[1]);
    });

    it('配列長を超えるとループする', () => {
      // BOOK_COLORS.lengthを超えるインデックスを作る
      for (let i = 4; i <= BOOK_COLORS.length + 1; i++) {
        mockState.books.push({ id: i, title: `Book${i}` });
      }

      const lastBook = { id: BOOK_COLORS.length + 1 };
      const color = getBookColor(lastBook);

      expect(BOOK_COLORS).toContain(color);
    });
  });

  describe('addBook', () => {
    it('本を追加してsaveState呼び出し', () => {
      const book = { id: 1, title: 'New Book', status: BOOK_STATUS.READING };

      addBook(book);

      expect(stateManager.addBook).toHaveBeenCalledWith(book);
      expect(saveState).toHaveBeenCalled();
    });
  });

  describe('updateBook', () => {
    it('本を更新してsaveState呼び出し', () => {
      const updates = { title: 'Updated Title' };

      updateBook(1, updates);

      expect(stateManager.updateBook).toHaveBeenCalledWith(1, updates);
      expect(saveState).toHaveBeenCalled();
    });
  });

  describe('removeBook', () => {
    it('本を削除してsaveState呼び出し', () => {
      removeBook(1);

      expect(stateManager.removeBook).toHaveBeenCalledWith(1);
      expect(saveState).toHaveBeenCalled();
    });
  });

  // ========================================
  // Pure関数のテスト（モック不要）
  // ========================================

  describe('getAllBooksPure', () => {
    it('状態から全ての本を取得', () => {
      const state = {
        books: [
          { id: 1, title: 'Book1' },
          { id: 2, title: 'Book2' }
        ]
      };

      const books = getAllBooksPure(state);

      expect(books).toHaveLength(2);
      expect(books[0].title).toBe('Book1');
    });

    it('本がない場合は空配列', () => {
      const state = { books: [] };

      const books = getAllBooksPure(state);

      expect(books).toEqual([]);
    });
  });

  describe('getBookByIdPure', () => {
    it('IDで本を取得', () => {
      const state = {
        books: [
          { id: 1, title: 'Test Book' },
          { id: 2, title: 'Another Book' }
        ]
      };

      const book = getBookByIdPure(state, 1);

      expect(book).toBeDefined();
      expect(book.title).toBe('Test Book');
    });

    it('文字列IDでも本を取得（DOM dataset互換）', () => {
      const state = {
        books: [
          { id: 1737178234567000, title: 'Test Book' }
        ]
      };

      // dataset.bookIdは常に文字列を返すため
      const book = getBookByIdPure(state, '1737178234567000');

      expect(book).toBeDefined();
      expect(book.title).toBe('Test Book');
    });

    it('存在しないIDはundefined', () => {
      const state = { books: [{ id: 1, title: 'Test' }] };

      const book = getBookByIdPure(state, 999);

      expect(book).toBeUndefined();
    });
  });

  describe('getBooksByStatusPure', () => {
    it('ステータスでフィルタリング', () => {
      const state = {
        books: [
          { id: 1, title: 'A', status: BOOK_STATUS.READING },
          { id: 2, title: 'B', status: BOOK_STATUS.READING },
          { id: 3, title: 'C', status: BOOK_STATUS.COMPLETED },
          { id: 4, title: 'D', status: BOOK_STATUS.UNREAD }
        ]
      };

      const reading = getBooksByStatusPure(state, BOOK_STATUS.READING);
      expect(reading).toHaveLength(2);

      const completed = getBooksByStatusPure(state, BOOK_STATUS.COMPLETED);
      expect(completed).toHaveLength(1);
    });

    it('該当なしは空配列', () => {
      const state = {
        books: [{ id: 1, status: BOOK_STATUS.READING }]
      };

      const wishlist = getBooksByStatusPure(state, BOOK_STATUS.WISHLIST);

      expect(wishlist).toEqual([]);
    });
  });

  describe('getBookColorPure', () => {
    it('インデックスに基づいた色を返す', () => {
      const state = {
        books: [
          { id: 1, title: 'A' },
          { id: 2, title: 'B' },
          { id: 3, title: 'C' }
        ]
      };

      const color1 = getBookColorPure(state, { id: 1 });
      const color2 = getBookColorPure(state, { id: 2 });

      expect(color1).toBe(BOOK_COLORS[0]);
      expect(color2).toBe(BOOK_COLORS[1]);
    });

    it('配列長を超えるとループする', () => {
      const books = [];
      for (let i = 1; i <= BOOK_COLORS.length + 1; i++) {
        books.push({ id: i, title: `Book${i}` });
      }
      const state = { books };

      const lastBook = { id: BOOK_COLORS.length + 1 };
      const color = getBookColorPure(state, lastBook);

      expect(BOOK_COLORS).toContain(color);
    });
  });
});
