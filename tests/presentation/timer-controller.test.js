import { describe, it, expect } from 'vitest';
import {
  prepareReadingScreenData,
  prepareBookmarkData
} from '../../js/presentation/controllers/timer-controller.js';

describe('timer-controller.js', () => {
  describe('prepareReadingScreenData', () => {
    it('表紙URLがある場合はカバー画像HTMLを返す', () => {
      const book = {
        title: 'テスト本',
        coverUrl: 'https://example.com/cover.jpg'
      };

      const result = prepareReadingScreenData(book);

      expect(result.hasCover).toBe(true);
      expect(result.coverHtml).toContain('<img');
      expect(result.coverHtml).toContain('https://example.com/cover.jpg');
      expect(result.title).toBe('テスト本');
    });

    it('表紙URLがない場合はデフォルトアイコンを返す', () => {
      const book = {
        title: 'テスト本',
        coverUrl: null
      };

      const result = prepareReadingScreenData(book);

      expect(result.hasCover).toBe(false);
      expect(result.coverHtml).toContain('📖');
      expect(result.title).toBe('テスト本');
    });

    it('bookがnullの場合はデフォルト値を返す', () => {
      const result = prepareReadingScreenData(null);

      expect(result.hasCover).toBe(false);
      expect(result.coverHtml).toContain('📖');
      expect(result.title).toBe('');
    });

    it('bookがundefinedの場合はデフォルト値を返す', () => {
      const result = prepareReadingScreenData(undefined);

      expect(result.hasCover).toBe(false);
      expect(result.title).toBe('');
    });

    it('coverUrlが空文字の場合はデフォルトアイコンを返す', () => {
      const book = {
        title: 'テスト本',
        coverUrl: ''
      };

      const result = prepareReadingScreenData(book);

      expect(result.hasCover).toBe(false);
    });

    it('XSS攻撃を防ぐためにcoverUrlをエスケープする', () => {
      const book = {
        title: 'テスト本',
        coverUrl: 'https://example.com/cover.jpg" onload="alert(1)'
      };

      const result = prepareReadingScreenData(book);

      // ダブルクォートがエスケープされていること（属性値の終了を防ぐ）
      expect(result.coverHtml).toContain('&quot;');
      // src属性が正しく閉じられていること
      expect(result.coverHtml).toMatch(/src="[^"]*&quot;[^"]*"/);
    });
  });

  describe('prepareBookmarkData', () => {
    it('栞の値をトリムして返す', () => {
      const result = prepareBookmarkData('  第3章まで  ');

      expect(result.bookmark).toBe('第3章まで');
      expect(result.shouldShowToast).toBe(true);
    });

    it('空の値はnullを返す', () => {
      const result = prepareBookmarkData('');

      expect(result.bookmark).toBeNull();
      expect(result.shouldShowToast).toBe(false);
    });

    it('空白のみの値はnullを返す', () => {
      const result = prepareBookmarkData('   ');

      expect(result.bookmark).toBeNull();
      expect(result.shouldShowToast).toBe(false);
    });

    it('nullの場合はnullを返す', () => {
      const result = prepareBookmarkData(null);

      expect(result.bookmark).toBeNull();
      expect(result.shouldShowToast).toBe(false);
    });

    it('undefinedの場合はnullを返す', () => {
      const result = prepareBookmarkData(undefined);

      expect(result.bookmark).toBeNull();
      expect(result.shouldShowToast).toBe(false);
    });

    it('有効な栞がある場合はshouldShowToastがtrue', () => {
      const result = prepareBookmarkData('第5章');

      expect(result.shouldShowToast).toBe(true);
    });
  });
});
