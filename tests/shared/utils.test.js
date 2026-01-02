import { describe, it, expect } from 'vitest';
import {
  adjustColor,
  isValidUrl,
  isAmazonShortUrl,
  extractAsinFromUrl,
  getAmazonImageUrl,
  getTimeSlot,
  getTimeSlotIndex,
  escapeAttr,
  toLocalDateString,
} from '../../js/shared/utils.js';

describe('adjustColor', () => {
  it('明るくする', () => {
    expect(adjustColor('#000000', 50)).toBe('#323232');
  });

  it('暗くする', () => {
    expect(adjustColor('#ffffff', -50)).toBe('#cdcdcd');
  });

  it('範囲外の値はクランプされる', () => {
    expect(adjustColor('#ffffff', 100)).toBe('#ffffff');
    expect(adjustColor('#000000', -100)).toBe('#000000');
  });
});

describe('isValidUrl', () => {
  it('有効なURLを判定', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://example.com')).toBe(true);
  });

  it('無効なURLを判定', () => {
    expect(isValidUrl('example.com')).toBe(false);
    expect(isValidUrl('')).toBeFalsy();
    expect(isValidUrl(null)).toBeFalsy();
  });
});

describe('isAmazonShortUrl', () => {
  it('Amazon短縮URLを判定', () => {
    expect(isAmazonShortUrl('https://amzn.asia/d/abc123')).toBe(true);
    expect(isAmazonShortUrl('https://amzn.to/abc123')).toBe(true);
  });

  it('通常のAmazon URLはfalse', () => {
    expect(isAmazonShortUrl('https://www.amazon.co.jp/dp/B123456789')).toBe(false);
  });
});

describe('extractAsinFromUrl', () => {
  it('/dp/ パターンからASINを抽出', () => {
    expect(extractAsinFromUrl('https://www.amazon.co.jp/dp/B08N5WRWNW')).toBe('B08N5WRWNW');
  });

  it('/gp/product/ パターンからASINを抽出', () => {
    expect(extractAsinFromUrl('https://www.amazon.co.jp/gp/product/B08N5WRWNW')).toBe('B08N5WRWNW');
  });

  it('ASINがない場合はnull', () => {
    expect(extractAsinFromUrl('https://example.com')).toBe(null);
    expect(extractAsinFromUrl(null)).toBe(null);
  });
});

describe('getAmazonImageUrl', () => {
  it('ASINから画像URLを生成', () => {
    expect(getAmazonImageUrl('B08N5WRWNW')).toBe(
      'https://images-na.ssl-images-amazon.com/images/P/B08N5WRWNW.09.LZZZZZZZ.jpg'
    );
  });

  it('ASINがない場合はnull', () => {
    expect(getAmazonImageUrl(null)).toBe(null);
  });
});

describe('getTimeSlot', () => {
  it('朝 (5-11時)', () => {
    expect(getTimeSlot(5)).toBe('morning');
    expect(getTimeSlot(11)).toBe('morning');
  });

  it('昼 (12-16時)', () => {
    expect(getTimeSlot(12)).toBe('afternoon');
    expect(getTimeSlot(16)).toBe('afternoon');
  });

  it('夕方 (17-20時)', () => {
    expect(getTimeSlot(17)).toBe('evening');
    expect(getTimeSlot(20)).toBe('evening');
  });

  it('夜 (21-4時)', () => {
    expect(getTimeSlot(21)).toBe('night');
    expect(getTimeSlot(0)).toBe('night');
    expect(getTimeSlot(4)).toBe('night');
  });
});

describe('getTimeSlotIndex', () => {
  it('朝型 (5-11時) = 0', () => {
    expect(getTimeSlotIndex(5)).toBe(0);
    expect(getTimeSlotIndex(11)).toBe(0);
  });

  it('昼型 (12-17時) = 1', () => {
    expect(getTimeSlotIndex(12)).toBe(1);
    expect(getTimeSlotIndex(17)).toBe(1);
  });

  it('夜型 (18-21時) = 2', () => {
    expect(getTimeSlotIndex(18)).toBe(2);
    expect(getTimeSlotIndex(21)).toBe(2);
  });

  it('深夜型 (22-4時) = 3', () => {
    expect(getTimeSlotIndex(22)).toBe(3);
    expect(getTimeSlotIndex(0)).toBe(3);
  });
});

describe('escapeAttr', () => {
  it('特殊文字をエスケープ', () => {
    expect(escapeAttr('<script>')).toBe('&lt;script&gt;');
    expect(escapeAttr('"test"')).toBe('&quot;test&quot;');
    expect(escapeAttr("it's")).toBe("it&#39;s");
    expect(escapeAttr('a & b')).toBe('a &amp; b');
  });
});

describe('toLocalDateString', () => {
  it('DateオブジェクトからYYYY-MM-DD形式の文字列を返す', () => {
    const date = new Date(2026, 0, 2); // 2026年1月2日（ローカルタイム）
    expect(toLocalDateString(date)).toBe('2026-01-02');
  });

  it('月・日が1桁の場合はゼロパディング', () => {
    const date = new Date(2025, 4, 5); // 2025年5月5日
    expect(toLocalDateString(date)).toBe('2025-05-05');
  });

  it('月末の日付を正しく処理', () => {
    const date = new Date(2025, 11, 31); // 2025年12月31日
    expect(toLocalDateString(date)).toBe('2025-12-31');
  });
});
