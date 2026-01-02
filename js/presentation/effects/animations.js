// ========================================
// アニメーション
// ========================================
import { BUTTON_ANIMATIONS, READING_ANIMATIONS, ANIMATION_CONFIG } from '../../shared/constants.js';
import { randomItem, getTimeSlot } from '../../shared/utils.js';
import { calculateStreak } from '../../domain/stats/stats-service.js';

// ========================================
// ボタンアニメーション
// ========================================

export function getButtonAnimation() {
  const streak = calculateStreak();

  if (streak >= ANIMATION_CONFIG.streakThreshold && Math.random() < ANIMATION_CONFIG.streakProbability) {
    return randomItem(BUTTON_ANIMATIONS.streak);
  }

  return randomItem(BUTTON_ANIMATIONS[getTimeSlot()]);
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
