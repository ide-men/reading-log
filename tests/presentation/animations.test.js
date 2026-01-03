import { describe, it, expect } from 'vitest';
import { BUTTON_ANIMATIONS, ANIMATION_CONFIG } from '../../js/shared/constants.js';
import { getButtonAnimationPure } from '../../js/presentation/effects/animations.js';

describe('animations.js', () => {
  describe('getButtonAnimationPure', () => {
    it('連続日数が閾値以上で確率を満たすとstreak用アニメーションを返す', () => {
      const result = getButtonAnimationPure({
        streak: ANIMATION_CONFIG.streakThreshold,
        timeSlot: 'morning',
        random: () => 0, // 常に確率条件を満たす
        pickItem: (arr) => arr[0]
      });

      expect(result).toBe(BUTTON_ANIMATIONS.streak[0]);
    });

    it('連続日数が閾値未満の場合は時間帯に応じたアニメーションを返す', () => {
      const result = getButtonAnimationPure({
        streak: 0,
        timeSlot: 'morning',
        random: () => 0,
        pickItem: (arr) => arr[0]
      });

      expect(result).toBe(BUTTON_ANIMATIONS.morning[0]);
    });

    it('確率条件を満たさない場合は時間帯に応じたアニメーションを返す', () => {
      const result = getButtonAnimationPure({
        streak: ANIMATION_CONFIG.streakThreshold,
        timeSlot: 'evening',
        random: () => 1, // 確率条件を満たさない
        pickItem: (arr) => arr[0]
      });

      expect(result).toBe(BUTTON_ANIMATIONS.evening[0]);
    });

    it('各時間帯でアニメーションを返す', () => {
      const timeSlots = ['morning', 'afternoon', 'evening', 'night'];

      for (const timeSlot of timeSlots) {
        const result = getButtonAnimationPure({
          streak: 0,
          timeSlot,
          random: () => 1,
          pickItem: (arr) => arr[0]
        });

        expect(result).toBe(BUTTON_ANIMATIONS[timeSlot][0]);
      }
    });

    it('pickItem関数が正しく使用される', () => {
      const customPick = (arr) => arr[arr.length - 1]; // 最後の要素を返す

      const result = getButtonAnimationPure({
        streak: 0,
        timeSlot: 'morning',
        random: () => 1,
        pickItem: customPick
      });

      expect(result).toBe(BUTTON_ANIMATIONS.morning[BUTTON_ANIMATIONS.morning.length - 1]);
    });
  });
});
