// ========================================
// アニメーション
// ========================================
import { BUTTON_ANIMATIONS, READING_ANIMATIONS } from './constants.js';
import { randomItem } from './utils.js';
import { calculateStreak } from './stats.js';

// ページフリップの状態
let pageFlip = null;
let autoFlipInterval = null;

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
  const labelEl = document.getElementById('readingLabel');
  const config = randomItem(READING_ANIMATIONS);
  labelEl.textContent = config.label;

  initPageFlip();
}

export function stopReadingAnimation() {
  destroyPageFlip();
}

function initPageFlip() {
  const container = document.getElementById('pageFlipBook');
  if (!container || typeof St === 'undefined') return;

  // 既存のインスタンスを破棄
  destroyPageFlip();

  // StPageFlipを初期化
  pageFlip = new St.PageFlip(container, {
    width: 100,
    height: 140,
    size: 'fixed',
    minWidth: 100,
    maxWidth: 100,
    minHeight: 140,
    maxHeight: 140,
    showCover: true,
    flippingTime: 1200,
    useMouseEvents: false,
    swipeDistance: 0,
    clickEventForward: false,
    usePortrait: false,
    startPage: 0,
    drawShadow: true,
    autoSize: false
  });

  // ページを読み込み
  const pages = document.querySelectorAll('.page-flip-page');
  pageFlip.loadFromHTML(pages);

  // 自動ページめくり（3秒ごと）
  autoFlipInterval = setInterval(() => {
    if (!pageFlip) return;

    const currentPage = pageFlip.getCurrentPageIndex();
    const totalPages = pageFlip.getPageCount();

    if (currentPage >= totalPages - 2) {
      // 最後まで行ったら最初に戻る
      pageFlip.turnToPage(0);
    } else {
      pageFlip.flipNext();
    }
  }, 3000);
}

function destroyPageFlip() {
  if (autoFlipInterval) {
    clearInterval(autoFlipInterval);
    autoFlipInterval = null;
  }

  if (pageFlip) {
    pageFlip.destroy();
    pageFlip = null;
  }
}
