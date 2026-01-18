import { describe, it, expect } from 'vitest';
import {
  required,
  maxLength,
  custom,
  createValidator,
  createDuplicateChecker
} from '../../../js/domain/common/validator.js';

describe('validator', () => {
  describe('required', () => {
    it('空文字列の場合にfalseを返す', () => {
      const rule = required('入力してください');
      expect(rule.validate('')).toBe(false);
      expect(rule.validate('   ')).toBe(false);
      expect(rule.validate(null)).toBe(false);
      expect(rule.validate(undefined)).toBe(false);
    });

    it('値がある場合にtrueを返す', () => {
      const rule = required('入力してください');
      expect(rule.validate('テスト')).toBe(true);
      expect(rule.validate('a')).toBe(true);
    });
  });

  describe('maxLength', () => {
    it('最大長を超える場合にfalseを返す', () => {
      const rule = maxLength(5, '5文字以内で入力してください');
      expect(rule.validate('123456')).toBe(false);
      expect(rule.validate('あいうえおか')).toBe(false);
    });

    it('最大長以内の場合にtrueを返す', () => {
      const rule = maxLength(5, '5文字以内で入力してください');
      expect(rule.validate('12345')).toBe(true);
      expect(rule.validate('1234')).toBe(true);
      expect(rule.validate('')).toBe(true);
      expect(rule.validate(null)).toBe(true);
    });
  });

  describe('custom', () => {
    it('カスタム関数の結果を返す', () => {
      const isEven = custom(v => v % 2 === 0, '偶数を入力してください');
      expect(isEven.validate(2)).toBe(true);
      expect(isEven.validate(3)).toBe(false);
    });
  });

  describe('createValidator', () => {
    it('すべてのルールを通過した場合にvalidを返す', () => {
      const validate = createValidator(
        required('必須です'),
        maxLength(10, '10文字以内')
      );

      const result = validate('テスト');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('最初に失敗したルールのエラーを返す', () => {
      const validate = createValidator(
        required('必須です'),
        maxLength(3, '3文字以内')
      );

      const result1 = validate('');
      expect(result1.valid).toBe(false);
      expect(result1.error).toBe('必須です');

      const result2 = validate('あいうえお');
      expect(result2.valid).toBe(false);
      expect(result2.error).toBe('3文字以内');
    });
  });

  describe('createDuplicateChecker', () => {
    const items = [
      { id: 1, name: 'Item One' },
      { id: 2, name: 'Item Two' },
      { id: 3, name: 'Item Three' }
    ];

    it('重複がある場合にisDuplicateをtrueで返す', () => {
      const checker = createDuplicateChecker({ field: 'name' });
      const result = checker('item one', items);
      expect(result.isDuplicate).toBe(true);
      expect(result.duplicateItem).toEqual({ id: 1, name: 'Item One' });
    });

    it('重複がない場合にisDuplicateをfalseで返す', () => {
      const checker = createDuplicateChecker({ field: 'name' });
      const result = checker('Item Four', items);
      expect(result.isDuplicate).toBe(false);
      expect(result.duplicateItem).toBeUndefined();
    });

    it('excludeIdで除外されたアイテムは重複とみなさない', () => {
      const checker = createDuplicateChecker({ field: 'name' });
      const result = checker('Item One', items, 1);
      expect(result.isDuplicate).toBe(false);
    });

    it('空文字列の場合は重複なしとして扱う', () => {
      const checker = createDuplicateChecker({ field: 'name' });
      expect(checker('', items).isDuplicate).toBe(false);
      expect(checker('   ', items).isDuplicate).toBe(false);
    });

    it('caseSensitive: trueで大文字小文字を区別する', () => {
      const checker = createDuplicateChecker({ field: 'name', caseSensitive: true });
      expect(checker('item one', items).isDuplicate).toBe(false);
      expect(checker('Item One', items).isDuplicate).toBe(true);
    });
  });
});
