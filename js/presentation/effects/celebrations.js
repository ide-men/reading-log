// ========================================
// セレブレーション表示
// ========================================
import { CELEBRATION_CONFIG } from '../../shared/constants.js';
import { escapeHtml } from '../../shared/utils.js';

// ========================================
// 本を手に入れた時のセレブレーション
// ========================================
export function showAcquireCelebration(book, destination = '書斎', onComplete = null) {
  const celebration = document.getElementById('acquireCelebration');
  const bookVisual = document.getElementById('acquireBookVisual');
  const bookName = document.getElementById('acquireBookName');
  const particles = document.getElementById('acquireParticles');

  if (!celebration) return;

  // 本のビジュアルを設定
  if (book.coverUrl) {
    bookVisual.innerHTML = `<img src="${escapeHtml(book.coverUrl)}" alt="">`;
  } else {
    bookVisual.innerHTML = '<span class="book-placeholder">📖</span>';
  }
  bookName.textContent = book.title;

  // ヒントテキストを更新
  const hintEl = celebration.querySelector('.acquire-hint');
  if (hintEl) {
    hintEl.textContent = destination === 'カバン'
      ? 'カバンに追加されました'
      : '書斎の積読に追加されました';
  }

  // パーティクルを生成
  particles.innerHTML = '';
  createCelebrationParticles(particles);

  // 表示
  celebration.classList.add('active');

  // 自動で閉じる
  setTimeout(() => {
    celebration.classList.remove('active');
    if (onComplete) onComplete();
  }, CELEBRATION_CONFIG.displayDuration);

  // クリックで早めに閉じる
  const closeHandler = () => {
    celebration.classList.remove('active');
    celebration.removeEventListener('click', closeHandler);
    if (onComplete) onComplete();
  };
  celebration.addEventListener('click', closeHandler);
}

// ========================================
// パーティクル生成
// ========================================
function createCelebrationParticles(container) {
  const colors = ['#f59e0b', '#fbbf24', '#6366f1', '#8b5cf6', '#ec4899', '#10b981'];

  for (let i = 0; i < CELEBRATION_CONFIG.particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'acquire-particle';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `-20px`;
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    particle.style.animationDelay = `${Math.random() * 0.5}s`;
    particle.style.animationDuration = `${1 + Math.random() * 1}s`;
    container.appendChild(particle);
  }

  // スパークル追加
  for (let i = 0; i < CELEBRATION_CONFIG.sparkleCount; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'acquire-sparkle';
    sparkle.style.left = `${20 + Math.random() * 60}%`;
    sparkle.style.top = `${20 + Math.random() * 60}%`;
    sparkle.style.animationDelay = `${Math.random() * 0.8}s`;
    container.appendChild(sparkle);
  }
}
