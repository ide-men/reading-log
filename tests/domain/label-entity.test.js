import { describe, it, expect, beforeEach } from 'vitest';
import {
  createLabel,
  validateLabelName,
  checkDuplicateLabelNamePure,
  resetIdCounter
} from '../../js/domain/label/label-entity.js';

describe('label-entity', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  describe('createLabel', () => {
    it('正しくラベルを作成できる', () => {
      const label = createLabel({ name: 'ビジネス書' });

      expect(label).toHaveProperty('id');
      expect(label.name).toBe('ビジネス書');
      expect(typeof label.id).toBe('number');
    });

    it('名前の前後の空白をトリムする', () => {
      const label = createLabel({ name: '  技術書  ' });
      expect(label.name).toBe('技術書');
    });

    it('異なる時刻で異なるIDを生成する', () => {
      let time = new Date('2024-01-01T00:00:00Z').getTime();
      const label1 = createLabel({ name: 'ラベル1' }, {
        now: () => new Date(time)
      });
      time += 1000;
      const label2 = createLabel({ name: 'ラベル2' }, {
        now: () => new Date(time)
      });

      expect(label1.id).not.toBe(label2.id);
    });

    it('同じミリ秒でも異なるIDを生成する', () => {
      const fixedTime = new Date('2024-01-01T00:00:00Z');
      const label1 = createLabel({ name: 'ラベル1' }, { now: () => fixedTime });
      const label2 = createLabel({ name: 'ラベル2' }, { now: () => fixedTime });

      expect(label1.id).not.toBe(label2.id);
    });
  });

  describe('validateLabelName', () => {
    it('有効なラベル名を検証できる', () => {
      expect(validateLabelName('ビジネス書')).toEqual({ valid: true });
      expect(validateLabelName('技術書')).toEqual({ valid: true });
      expect(validateLabelName('a')).toEqual({ valid: true });
    });

    it('空のラベル名はエラー', () => {
      expect(validateLabelName('')).toEqual({
        valid: false,
        error: 'ラベル名を入力してください'
      });
      expect(validateLabelName('   ')).toEqual({
        valid: false,
        error: 'ラベル名を入力してください'
      });
    });

    it('nullまたはundefinedはエラー', () => {
      expect(validateLabelName(null)).toEqual({
        valid: false,
        error: 'ラベル名を入力してください'
      });
      expect(validateLabelName(undefined)).toEqual({
        valid: false,
        error: 'ラベル名を入力してください'
      });
    });

    it('20文字を超えるラベル名はエラー', () => {
      const longName = 'a'.repeat(21);
      expect(validateLabelName(longName)).toEqual({
        valid: false,
        error: 'ラベル名は20文字以内で入力してください'
      });
    });

    it('20文字ちょうどは有効', () => {
      const exactName = 'a'.repeat(20);
      expect(validateLabelName(exactName)).toEqual({ valid: true });
    });
  });

  describe('checkDuplicateLabelNamePure', () => {
    const existingLabels = [
      { id: 1, name: 'ビジネス書' },
      { id: 2, name: '技術書' },
      { id: 3, name: '小説' }
    ];

    it('重複するラベル名を検出できる', () => {
      const result = checkDuplicateLabelNamePure('ビジネス書', existingLabels);
      expect(result.isDuplicate).toBe(true);
      expect(result.duplicateLabel).toEqual({ id: 1, name: 'ビジネス書' });
    });

    it('大文字小文字を区別しない', () => {
      const labels = [{ id: 1, name: 'ABC' }];
      const result = checkDuplicateLabelNamePure('abc', labels);
      expect(result.isDuplicate).toBe(true);
    });

    it('重複しないラベル名はOK', () => {
      const result = checkDuplicateLabelNamePure('新しいラベル', existingLabels);
      expect(result.isDuplicate).toBe(false);
      expect(result.duplicateLabel).toBeUndefined();
    });

    it('編集時に自分自身を除外できる', () => {
      const result = checkDuplicateLabelNamePure('ビジネス書', existingLabels, 1);
      expect(result.isDuplicate).toBe(false);
    });

    it('編集時に他のラベルとの重複は検出する', () => {
      const result = checkDuplicateLabelNamePure('技術書', existingLabels, 1);
      expect(result.isDuplicate).toBe(true);
      expect(result.duplicateLabel).toEqual({ id: 2, name: '技術書' });
    });

    it('空のラベル名は重複なしと判定', () => {
      const result = checkDuplicateLabelNamePure('', existingLabels);
      expect(result.isDuplicate).toBe(false);
    });

    it('空の配列では重複なし', () => {
      const result = checkDuplicateLabelNamePure('ビジネス書', []);
      expect(result.isDuplicate).toBe(false);
    });
  });
});
