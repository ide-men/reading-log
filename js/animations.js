// ========================================
// アニメーション
// ========================================
import { BUTTON_ANIMATIONS, READING_ANIMATIONS } from './constants.js';
import { randomItem } from './utils.js';
import { calculateStreak } from './stats.js';

export function getButtonAnimation() {
  const hour = new Date().getHours();
  const streak = calculateStreak();

  if (streak >= 3 && Math.random() < 0.3) {
    return randomItem(BUTTON_ANIMATIONS.streak);
  }

  let timeSlot;
  if (hour >= 5 && hour < 12) timeSlot = 'morning';
  else if (hour >= 12 && hour < 17) timeSlot = 'afternoon';
  else if (hour >= 17 && hour < 21) timeSlot = 'evening';
  else timeSlot = 'night';

  return randomItem(BUTTON_ANIMATIONS[timeSlot]);
}

export function updateButtonAnimation() {
  const btnIcon = document.querySelector('#startBtn .main-btn-icon');
  if (!btnIcon) return;

  const config = getButtonAnimation();
  btnIcon.textContent = config.icon;
  btnIcon.className = `main-btn-icon anim-${config.anim}`;
}

export function applyReadingAnimation() {
  const config = randomItem(READING_ANIMATIONS);
  const animEl = document.getElementById('readingAnim');
  const iconEl = document.getElementById('readingIcon');
  const labelEl = document.getElementById('readingLabel');

  iconEl.textContent = config.icon;
  animEl.className = `reading-anim anim-${config.anim}`;
  labelEl.textContent = config.label;
}
