import { describe, it, expect, beforeEach } from 'vitest';
import { generateUniqueId, extractTimestampFromId, resetIdCounter } from '../../js/shared/id-generator.js';

describe('id-generator', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  describe('generateUniqueId', () => {
    it('日付からユニークなIDを生成する', () => {
      const date = new Date('2024-01-15T10:00:00.000Z');
      const id = generateUniqueId(date);
      expect(id).toBe(date.getTime() * 1000);
    });

    it('同じミリ秒内でも異なるIDを生成する', () => {
      const date = new Date('2024-01-15T10:00:00.000Z');
      const id1 = generateUniqueId(date);
      const id2 = generateUniqueId(date);
      const id3 = generateUniqueId(date);

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id2).toBe(id1 + 1);
      expect(id3).toBe(id1 + 2);
    });

    it('異なるミリ秒ではカウンターがリセットされる', () => {
      const date1 = new Date('2024-01-15T10:00:00.000Z');
      const date2 = new Date('2024-01-15T10:00:00.001Z');

      const id1 = generateUniqueId(date1);
      const id2 = generateUniqueId(date1);
      const id3 = generateUniqueId(date2);

      expect(id2).toBe(id1 + 1);
      expect(id3).toBe(date2.getTime() * 1000); // カウンター0でリセット
    });

    it('引数なしの場合は現在時刻を使用する', () => {
      const before = Date.now();
      const id = generateUniqueId();
      const after = Date.now();

      const timestamp = extractTimestampFromId(id);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('extractTimestampFromId', () => {
    it('新フォーマット（timestamp * 1000 + counter）からタイムスタンプを抽出する', () => {
      const originalTimestamp = 1705312800000;
      const id = originalTimestamp * 1000 + 5;
      const extracted = extractTimestampFromId(id);
      expect(extracted).toBe(originalTimestamp);
    });

    it('旧フォーマット（timestampのみ）からタイムスタンプを抽出する', () => {
      const originalTimestamp = 1705312800000;
      const extracted = extractTimestampFromId(originalTimestamp);
      expect(extracted).toBe(originalTimestamp);
    });
  });

  describe('resetIdCounter', () => {
    it('カウンターをリセットする', () => {
      const date = new Date('2024-01-15T10:00:00.000Z');
      generateUniqueId(date);
      generateUniqueId(date);

      resetIdCounter();

      const id = generateUniqueId(date);
      expect(id).toBe(date.getTime() * 1000); // カウンター0
    });
  });
});
