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
  resetIdCounter,
  checkDuplicateTitlePure,
  checkDuplicateLinkPure,
} from '../../js/domain/book/book-entity.js';
import { BOOK_STATUS, BOOK_COLORS } from '../../js/shared/constants.js';
import {
  setupFakeTimers,
  teardownFakeTimers,
  createCompletedBook,
  createReadingBook,
  createUnreadBook,
  createDroppedBook,
  createWishlistBook,
  DEFAULT_TEST_DATE,
  DEFAULT_TEST_TIMESTAMP
} from '../helpers/index.js';

describe('createBook', () => {
  const fixedDate = new Date(DEFAULT_TEST_DATE);

  beforeEach(() => {
    // テスト前にIDカウンターをリセット
    resetIdCounter();
  });

  it('決定論的なIDと日付を生成できる', () => {
    const book = createBook(
      { title: 'テスト本' },
      { now: () => fixedDate }
    );

    // ID = timestamp * 1000 + counter (counter is 0 for first book)
    expect(book.id).toBe(fixedDate.getTime() * 1000);
    expect(book.title).toBe('テスト本');
    expect(book.startedAt).toBe('2024-06-15');
    expect(book.status).toBe(BOOK_STATUS.READING);
  });

  it('同一ミリ秒内で連続作成してもユニークなIDを生成する', () => {
    const book1 = createBook({ title: '本1' }, { now: () => fixedDate });
    const book2 = createBook({ title: '本2' }, { now: () => fixedDate });
    const book3 = createBook({ title: '本3' }, { now: () => fixedDate });

    expect(book1.id).toBe(fixedDate.getTime() * 1000);
    expect(book2.id).toBe(fixedDate.getTime() * 1000 + 1);
    expect(book3.id).toBe(fixedDate.getTime() * 1000 + 2);
    expect(book1.id).not.toBe(book2.id);
    expect(book2.id).not.toBe(book3.id);
  });

  it('読書中ステータスでstartedAtが設定される', () => {
    const date = new Date('2024-03-20T10:00:00');
    const book = createBook(
      { title: '読書中の本', status: BOOK_STATUS.READING },
      { now: () => date }
    );

    expect(book.startedAt).toBe('2024-03-20');
    expect(book.completedAt).toBeNull();
  });

  it('読了ステータスでcompletedAtが設定される', () => {
    const date = new Date('2024-12-25T15:30:00');
    const book = createBook(
      { title: '読了本', status: BOOK_STATUS.COMPLETED },
      { now: () => date }
    );

    expect(book.startedAt).toBeNull();
    expect(book.completedAt).toBe('2024-12-25');
  });

  it('未読ステータスでは日付が設定されない', () => {
    const book = createBook(
      { title: '未読本', status: BOOK_STATUS.UNREAD },
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
    expect(book.triggerNote).toBeNull();
    expect(book.completionNote).toBeNull();
    expect(book.reflections).toEqual([]);
    expect(book.readingTime).toBe(0);
    expect(book.bookmark).toBeNull();
  });

  it('リンクときっかけを設定できる', () => {
    const book = createBook(
      { title: '本', link: 'https://example.com', triggerNote: 'きっかけ' },
      { now: () => new Date('2024-01-01') }
    );

    expect(book.link).toBe('https://example.com');
    expect(book.triggerNote).toBe('きっかけ');
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
  beforeEach(() => setupFakeTimers());
  afterEach(() => teardownFakeTimers());

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
  beforeEach(() => setupFakeTimers());
  afterEach(() => teardownFakeTimers());

  it('読了本は読了日を表示', () => {
    const book = createCompletedBook({ id: DEFAULT_TEST_TIMESTAMP, completedAt: '2024-06-10' });
    expect(getBookDateText(book)).toBe('2024/6/10 読了');
  });

  it('読書中は開始日を表示', () => {
    const book = createReadingBook({ id: DEFAULT_TEST_TIMESTAMP, startedAt: '2024-06-01' });
    expect(getBookDateText(book)).toBe('2024/6/1 開始');
  });

  it('未読は追加日を表示', () => {
    const book = createUnreadBook({ id: DEFAULT_TEST_TIMESTAMP });
    expect(getBookDateText(book)).toBe('2024/6/15 追加');
  });

  it('中断は開始日を表示', () => {
    const book = createDroppedBook({ id: DEFAULT_TEST_TIMESTAMP, startedAt: '2024-05-15' });
    expect(getBookDateText(book)).toBe('2024/5/15 開始');
  });

  it('気になるは追加日を表示', () => {
    const book = createWishlistBook({ id: DEFAULT_TEST_TIMESTAMP });
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
    expect(style.bgStyle).toContain('background-color');
  });

  it('幅は高さの約2/3になる', () => {
    const book = { id: 1, coverUrl: null };
    const style = getMiniBookStyle(book, 0);
    const expectedWidth = Math.round(style.height * 0.67);

    expect(style.width).toBe(expectedWidth);
  });
});

describe('checkDuplicateTitlePure', () => {
  const existingBooks = [
    { id: 1, title: '人を動かす', link: 'https://amazon.co.jp/dp/123' },
    { id: 2, title: '7つの習慣', link: 'https://amazon.co.jp/dp/456' },
    { id: 3, title: 'Test Book', link: null },
  ];

  it('重複するタイトルを検出する', () => {
    const result = checkDuplicateTitlePure('人を動かす', existingBooks);

    expect(result.isDuplicate).toBe(true);
    expect(result.duplicateBook.id).toBe(1);
    expect(result.duplicateBook.title).toBe('人を動かす');
  });

  it('大文字小文字を無視して重複を検出する', () => {
    const result = checkDuplicateTitlePure('test book', existingBooks);

    expect(result.isDuplicate).toBe(true);
    expect(result.duplicateBook.title).toBe('Test Book');
  });

  it('重複がない場合はfalseを返す', () => {
    const result = checkDuplicateTitlePure('新しい本', existingBooks);

    expect(result.isDuplicate).toBe(false);
    expect(result.duplicateBook).toBeUndefined();
  });

  it('空のタイトルは重複なしとして扱う', () => {
    expect(checkDuplicateTitlePure('', existingBooks).isDuplicate).toBe(false);
    expect(checkDuplicateTitlePure('   ', existingBooks).isDuplicate).toBe(false);
    expect(checkDuplicateTitlePure(null, existingBooks).isDuplicate).toBe(false);
  });

  it('excludeIdで指定されたIDの本を除外する', () => {
    const result = checkDuplicateTitlePure('人を動かす', existingBooks, 1);

    expect(result.isDuplicate).toBe(false);
  });

  it('前後の空白を無視して重複を検出する', () => {
    const result = checkDuplicateTitlePure('  人を動かす  ', existingBooks);

    expect(result.isDuplicate).toBe(true);
  });
});

describe('checkDuplicateLinkPure', () => {
  const existingBooks = [
    { id: 1, title: '人を動かす', link: 'https://amazon.co.jp/dp/123' },
    { id: 2, title: '7つの習慣', link: 'https://amazon.co.jp/dp/456' },
    { id: 3, title: 'リンクなし', link: null },
  ];

  it('重複するリンクを検出する', () => {
    const result = checkDuplicateLinkPure('https://amazon.co.jp/dp/123', existingBooks);

    expect(result.isDuplicate).toBe(true);
    expect(result.duplicateBook.id).toBe(1);
    expect(result.duplicateBook.title).toBe('人を動かす');
  });

  it('重複がない場合はfalseを返す', () => {
    const result = checkDuplicateLinkPure('https://amazon.co.jp/dp/999', existingBooks);

    expect(result.isDuplicate).toBe(false);
    expect(result.duplicateBook).toBeUndefined();
  });

  it('空のリンクは重複なしとして扱う', () => {
    expect(checkDuplicateLinkPure('', existingBooks).isDuplicate).toBe(false);
    expect(checkDuplicateLinkPure('   ', existingBooks).isDuplicate).toBe(false);
    expect(checkDuplicateLinkPure(null, existingBooks).isDuplicate).toBe(false);
  });

  it('excludeIdで指定されたIDの本を除外する', () => {
    const result = checkDuplicateLinkPure('https://amazon.co.jp/dp/123', existingBooks, 1);

    expect(result.isDuplicate).toBe(false);
  });

  it('リンクがnullの本とは重複しない', () => {
    const result = checkDuplicateLinkPure('https://example.com', existingBooks);

    expect(result.isDuplicate).toBe(false);
  });
});
