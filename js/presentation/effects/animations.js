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
  const animEl = document.getElementById('readingAnim');
  const iconEl = document.getElementById('readingIcon');
  const labelEl = document.getElementById('readingLabel');

  // 表紙画像がある場合はアイコンを上書きしない
  if (!iconEl.classList.contains('has-cover')) {
    iconEl.textContent = config.icon;
  }
  animEl.className = `reading-anim anim-${config.anim}`;
  labelEl.textContent = config.label;
}
