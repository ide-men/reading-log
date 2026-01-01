// ========================================
// セレブレーション表示
// ========================================
import { CELEBRATION_CONFIG } from '../../shared/constants.js';
import { escapeHtml } from '../../shared/utils.js';

// 現在のクリーンアップ関数を保持
let currentCleanup = null;

// ========================================
// 本を手に入れた時のセレブレーション
// ========================================
export function showAcquireCelebration(book, destination = '書斎', onComplete = null) {
  const celebration = document.getElementById('acquireCelebration');
  const bookVisual = document.getElementById('acquireBookVisual');
  const bookName = document.getElementById('acquireBookName');
  const particles = document.getElementById('acquireParticles');

  if (!celebration) return;

  // 前回のセレブレーションをクリーンアップ
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }

  // 本のビジュアルを設定
  if (book.coverUrl) {
    bookVisual.innerHTML = `<img src="${escapeHtml(book.coverUrl)}" alt="">`;
  } else {
    bookVisual.innerHTML = '<span class="book-placeholder">📖</span>';
  }
  bookName.textContent = book.title;

  // タイトルとヒントテキストを更新
  const titleEl = celebration.querySelector('.acquire-title');
  if (titleEl) {
    const titleText = {
      'カバン': '🎉 手に入れた！',
      '書斎': '🎉 手に入れた！',
      '読了': '🎉 読了おめでとう！'
    };
    titleEl.textContent = titleText[destination] || '🎉 手に入れた！';
  }

  const hintEl = celebration.querySelector('.acquire-hint');
  if (hintEl) {
    const hintText = {
      'カバン': 'カバンに追加されました',
      '書斎': '書斎の積読に追加されました',
      '読了': 'お疲れさまでした！'
    };
    hintEl.textContent = hintText[destination] || '書斎の積読に追加されました';
  }

  // パーティクルを生成
  particles.innerHTML = '';
  createCelebrationParticles(particles);

  // 表示
  celebration.classList.add('active');

  // 完了フラグ（重複実行防止）
  let completed = false;
  const complete = () => {
    if (completed) return;
    completed = true;
    celebration.classList.remove('active');
    celebration.removeEventListener('click', closeHandler);
    currentCleanup = null;
    if (onComplete) onComplete();
  };

  // クリックで早めに閉じる
  const closeHandler = () => complete();
  celebration.addEventListener('click', closeHandler);

  // 自動で閉じる
  const timeoutId = setTimeout(complete, CELEBRATION_CONFIG.displayDuration);

  // クリーンアップ関数を保存
  currentCleanup = () => {
    clearTimeout(timeoutId);
    celebration.removeEventListener('click', closeHandler);
    celebration.classList.remove('active');
  };
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
