// ========================================
// アニメーション
// ========================================
import { BUTTON_ANIMATIONS, READING_ANIMATIONS, ANIMATION_CONFIG } from '../../shared/constants.js';
import { randomItem, getTimeSlot } from '../../shared/utils.js';
import { calculateStreak } from '../../domain/stats/stats-service.js';

// ========================================
// ボタンアニメーション
// ========================================

/**
 * ボタンアニメーション設定を取得（Pure版）
 * @param {Object} options - オプション
 * @param {number} options.streak - 連続日数
 * @param {string} [options.timeSlot] - 時間帯（省略時はgetTimeSlot()を使用）
 * @param {Function} [options.random] - 乱数関数（テスト用）
 * @param {Function} [options.pickItem] - 配列からアイテムを選択する関数（テスト用）
 * @returns {Object} アニメーション設定
 */
export function getButtonAnimationPure({
  streak,
  timeSlot = getTimeSlot(),
  random = Math.random,
  pickItem = randomItem
}) {
  if (streak >= ANIMATION_CONFIG.streakThreshold && random() < ANIMATION_CONFIG.streakProbability) {
    return pickItem(BUTTON_ANIMATIONS.streak);
  }

  return pickItem(BUTTON_ANIMATIONS[timeSlot]);
}

/**
 * ボタンアニメーション設定を取得
 * @returns {Object} アニメーション設定
 */
export function getButtonAnimation() {
  return getButtonAnimationPure({ streak: calculateStreak() });
}

export function updateButtonAnimation() {
  const btnIcon = document.querySelector('#startBtn .main-btn-icon');
  if (!btnIcon) return;

  const config = getButtonAnimation();
  btnIcon.textContent = config.icon;
  btnIcon.className = `main-btn-icon anim-${config.anim}`;
}

// ========================================
// 読書画面アニメーション
// ========================================

export function applyReadingAnimation() {
  const config = randomItem(READING_ANIMATIONS);
  const bookEl = document.getElementById('readingBook');
  const coverEl = document.getElementById('readingBookCover');
  const subtitleEl = document.getElementById('readingSubtitle');

  // 表紙画像がある場合はアイコンを上書きしない
  if (!coverEl.classList.contains('has-cover')) {
    const iconEl = coverEl.querySelector('.reading-book__icon');
    if (iconEl) {
      iconEl.textContent = config.icon;
    }
  }
  bookEl.className = `reading-book anim-${config.anim}`;
  subtitleEl.textContent = config.label;
}
