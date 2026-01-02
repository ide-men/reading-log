import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createBook,
  validateBookTitle,
  isValidStatus,
  formatDate,
  getRelativeDate,
  getBookCreatedDateStr,
  getBookDateText,
  getBookColorByIndex,
  getMiniBookStyle,
} from '../../js/domain/book/book-entity.js';
import { BOOK_STATUS, BOOK_COLORS } from '../../js/shared/constants.js';

// ========================================
// createBook（Date注入によるテスト）
// ========================================
describe('createBook', () => {
  it('決定論的なIDと日付を生成できる', () => {
    const fixedDate = new Date('2024-06-15T12:00:00');
    const book = createBook(
      { title: 'テスト本' },
      { now: () => fixedDate }
    );

    expect(book.id).toBe(fixedDate.getTime());
    expect(book.title).toBe('テスト本');
    expect(book.startedAt).toBe('2024-06-15');
    expect(book.status).toBe(BOOK_STATUS.READING);
  });

  it('読書中ステータスでstartedAtが設定される', () => {
    const fixedDate = new Date('2024-03-20T10:00:00');
    const book = createBook(
      { title: '読書中の本', status: BOOK_STATUS.READING },
      { now: () => fixedDate }
    );

    expect(book.startedAt).toBe('2024-03-20');
    expect(book.completedAt).toBeNull();
  });

  it('読了ステータスでcompletedAtが設定される', () => {
    const fixedDate = new Date('2024-12-25T15:30:00');
    const book = createBook(
      { title: '読了本', status: BOOK_STATUS.COMPLETED },
      { now: () => fixedDate }
    );

    expect(book.startedAt).toBeNull();
    expect(book.completedAt).toBe('2024-12-25');
  });

  it('積読ステータスでは日付が設定されない', () => {
    const book = createBook(
      { title: '積読本', status: BOOK_STATUS.UNREAD },
      { now: () => new Date('2024-01-01') }
    );

    expect(book.startedAt).toBeNull();
    expect(book.completedAt).toBeNull();
  });

  it('デフォルト値が正しく設定される', () => {
    const book = createBook(
      { title: 'デフォルト本' },
      { now: () => new Date('2024-01-01') }
    );

    expect(book.link).toBeNull();
    expect(book.coverUrl).toBeNull();
    expect(book.note).toBeNull();
    expect(book.readingTime).toBe(0);
    expect(book.bookmark).toBeNull();
  });

  it('リンクとメモを設定できる', () => {
    const book = createBook(
      { title: '本', link: 'https://example.com', note: 'メモ' },
      { now: () => new Date('2024-01-01') }
    );

    expect(book.link).toBe('https://example.com');
    expect(book.note).toBe('メモ');
  });
});

describe('validateBookTitle', () => {
  it('有効なタイトル', () => {
    expect(validateBookTitle('本のタイトル')).toEqual({ valid: true });
    expect(validateBookTitle('a')).toEqual({ valid: true });
  });

  it('空のタイトルはエラー', () => {
    expect(validateBookTitle('')).toEqual({
      valid: false,
      error: 'タイトルを入力してください',
    });
    expect(validateBookTitle('   ')).toEqual({
      valid: false,
      error: 'タイトルを入力してください',
    });
    expect(validateBookTitle(null)).toEqual({
      valid: false,
      error: 'タイトルを入力してください',
    });
  });
});

describe('isValidStatus', () => {
  it('有効なステータス', () => {
    expect(isValidStatus('reading')).toBe(true);
    expect(isValidStatus('completed')).toBe(true);
    expect(isValidStatus('unread')).toBe(true);
    expect(isValidStatus('dropped')).toBe(true);
    expect(isValidStatus('wishlist')).toBe(true);
  });

  it('無効なステータス', () => {
    expect(isValidStatus('invalid')).toBe(false);
    expect(isValidStatus('')).toBe(false);
    expect(isValidStatus(null)).toBe(false);
  });
});

describe('formatDate', () => {
  it('日付をフォーマット', () => {
    // ja-JP形式: YYYY/MM/DD
    expect(formatDate('2024-01-15')).toBe('2024/1/15');
    expect(formatDate('2024-12-31')).toBe('2024/12/31');
  });

  it('空の日付は空文字を返す', () => {
    expect(formatDate('')).toBe('');
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
  });
});

describe('getRelativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('今日', () => {
    expect(getRelativeDate('2024-06-15')).toBe('今日から');
  });

  it('昨日', () => {
    expect(getRelativeDate('2024-06-14')).toBe('昨日から');
  });

  it('数日前', () => {
    expect(getRelativeDate('2024-06-12')).toBe('3日前から');
    expect(getRelativeDate('2024-06-09')).toBe('6日前から');
  });

  it('週間前', () => {
    expect(getRelativeDate('2024-06-08')).toBe('1週間前から');
    expect(getRelativeDate('2024-06-01')).toBe('2週間前から');
  });

  it('1ヶ月以上前は日付を表示', () => {
    expect(getRelativeDate('2024-05-01')).toBe('2024/5/1から');
  });

  it('空の日付は空文字を返す', () => {
    expect(getRelativeDate('')).toBe('');
    expect(getRelativeDate(null)).toBe('');
  });
});

describe('getBookCreatedDateStr', () => {
  it('IDから日付文字列を取得', () => {
    const book = { id: new Date('2024-03-20T10:30:00').getTime() };
    expect(getBookCreatedDateStr(book)).toBe('2024-03-20');
  });
});

describe('getBookDateText', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('読了本は読了日を表示', () => {
    const book = {
      id: Date.now(),
      status: BOOK_STATUS.COMPLETED,
      completedAt: '2024-06-10',
    };
    expect(getBookDateText(book)).toBe('2024/6/10 読了');
  });

  it('読書中は開始日を表示', () => {
    const book = {
      id: Date.now(),
      status: BOOK_STATUS.READING,
      startedAt: '2024-06-01',
    };
    expect(getBookDateText(book)).toBe('2024/6/1 開始');
  });

  it('積読は追加日を表示', () => {
    const book = {
      id: new Date('2024-06-15T12:00:00').getTime(),
      status: BOOK_STATUS.UNREAD,
    };
    expect(getBookDateText(book)).toBe('2024/6/15 追加');
  });

  it('中断は開始日を表示', () => {
    const book = {
      id: Date.now(),
      status: BOOK_STATUS.DROPPED,
      startedAt: '2024-05-15',
    };
    expect(getBookDateText(book)).toBe('2024/5/15 開始');
  });

  it('気になるは追加日を表示', () => {
    const book = {
      id: new Date('2024-06-15T12:00:00').getTime(),
      status: BOOK_STATUS.WISHLIST,
    };
    expect(getBookDateText(book)).toBe('2024/6/15 追加');
  });
});

describe('getBookColorByIndex', () => {
  it('インデックスに応じた色を返す', () => {
    expect(getBookColorByIndex(0)).toBe(BOOK_COLORS[0]);
    expect(getBookColorByIndex(5)).toBe(BOOK_COLORS[5]);
  });

  it('配列長を超えるとループする', () => {
    expect(getBookColorByIndex(10)).toBe(BOOK_COLORS[0]);
    expect(getBookColorByIndex(15)).toBe(BOOK_COLORS[5]);
  });
});

describe('getMiniBookStyle', () => {
  it('表紙なしのスタイル', () => {
    const book = { id: 1, coverUrl: null };
    const style = getMiniBookStyle(book, 0);

    expect(style.hasCover).toBe(false);
    expect(style.height).toBeGreaterThan(0);
    expect(style.width).toBeGreaterThan(0);
    expect(style.bgStyle).toContain('linear-gradient');
  });

  // 表紙ありのテストはescapeHtmlがDOM依存のためスキップ
});
