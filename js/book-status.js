// ========================================
// 本のステータス遷移
// ========================================
import { BOOK_STATUS } from './constants.js';
import { stateManager } from './state.js';
import { saveState } from './storage.js';
import { escapeHtml } from './utils.js';
import { showToast } from './ui.js';
import { renderBooks } from './book-rendering.js';

// ========================================
// wishlist → unread（書斎に入れる）
// ========================================
export function acquireBook(id) {
  const book = stateManager.getBook(id);
  if (!book) return;

  // セレブレーションを表示
  showAcquireCelebration(book, '書斎');

  // 少し待ってからステータス更新
  setTimeout(() => {
    stateManager.updateBook(id, { status: BOOK_STATUS.UNREAD });
    saveState();
    renderBooks();
  }, 300);
}

// ========================================
// wishlist → reading（カバンに入れる）
// ========================================
export function moveToReading(id) {
  const book = stateManager.getBook(id);
  if (!book) return;

  // セレブレーションを表示
  showAcquireCelebration(book, 'カバン');

  const today = new Date().toISOString().split('T')[0];

  // 少し待ってからステータス更新
  setTimeout(() => {
    stateManager.updateBook(id, {
      status: BOOK_STATUS.READING,
      startedAt: today
    });
    saveState();
    renderBooks();
  }, 300);
}

// ========================================
// 本を手に入れた時のセレブレーション
// ========================================
function showAcquireCelebration(book, destination = '書斎') {
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

  // クリックで早めに閉じる
  const toastMessage = destination === 'カバン'
    ? 'カバンに追加しました！'
    : '書斎の積読に追加しました！';

  const closeHandler = () => {
    celebration.classList.remove('active');
    celebration.removeEventListener('click', closeHandler);
    clearTimeout(autoCloseTimer);
  };
  celebration.addEventListener('click', closeHandler);

  // 自動で閉じる（イベントリスナーも確実に解除）
  const autoCloseTimer = setTimeout(() => {
    closeHandler();
    showToast(toastMessage);
  }, 2000);
}

// ========================================
// パーティクル生成
// ========================================
function createCelebrationParticles(container) {
  const colors = ['#f59e0b', '#fbbf24', '#6366f1', '#8b5cf6', '#ec4899', '#10b981'];
  const particleCount = 50;

  for (let i = 0; i < particleCount; i++) {
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
  for (let i = 0; i < 20; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'acquire-sparkle';
    sparkle.style.left = `${20 + Math.random() * 60}%`;
    sparkle.style.top = `${20 + Math.random() * 60}%`;
    sparkle.style.animationDelay = `${Math.random() * 0.8}s`;
    container.appendChild(sparkle);
  }
}

// ========================================
// unread/dropped/completed → reading（読み始める・再読！）
// ========================================
export function startReadingBook(id) {
  const book = stateManager.getBook(id);
  const today = new Date().toISOString().split('T')[0];
  const wasCompleted = book.status === BOOK_STATUS.COMPLETED;

  const updates = {
    status: BOOK_STATUS.READING,
    startedAt: today
  };

  // 読了からの再読の場合は completedAt をリセット
  if (wasCompleted) {
    updates.completedAt = null;
  }

  stateManager.updateBook(id, updates);
  saveState();
  renderBooks();
  showToast(wasCompleted ? 'カバンに入れました！' : '読書を始めました！');
}

// ========================================
// reading → completed（読み終わった！）
// ========================================
export function completeBook(id) {
  const today = new Date().toISOString().split('T')[0];
  stateManager.updateBook(id, {
    status: BOOK_STATUS.COMPLETED,
    completedAt: today
  });
  saveState();
  renderBooks();
  showToast('読了おめでとうございます！');
}

// ========================================
// reading → dropped（中断）
// ========================================
export function dropBook(id) {
  stateManager.updateBook(id, { status: BOOK_STATUS.DROPPED });
  saveState();
  renderBooks();
  showToast('本を中断しました');
}
