// ========================================
// タイマー管理
// ========================================
import { CONFIG } from './constants.js';
import { stateManager } from './state.js';
import { saveState } from './storage.js';
import { applyReadingAnimation } from './animations.js';

// タイマー状態
let timer = null;
let seconds = 0;
let currentBookId = null;

export function isTimerRunning() {
  return timer !== null;
}

export function getSeconds() {
  return seconds;
}

export function startReading(bookId = null) {
  if (timer) return;

  seconds = 0;
  currentBookId = bookId;

  // 読書中の本の情報を表示
  const bookInfo = document.getElementById('readingBookInfo');
  const bookCover = document.getElementById('readingBookCover');

  if (bookId) {
    const book = stateManager.getBook(bookId);
    if (book && book.coverUrl) {
      bookInfo.style.display = 'flex';
      bookCover.style.backgroundImage = `url(${book.coverUrl})`;
    } else {
      bookInfo.style.display = 'none';
    }
  } else {
    bookInfo.style.display = 'none';
  }

  applyReadingAnimation();
  document.getElementById('readingScreen').classList.add('active');
  timer = setInterval(() => seconds++, 1000);
  document.getElementById('startBtn').innerHTML =
    '<span class="main-btn-icon anim-relax">📖</span><span>読書中...</span>';
}

export function stopReading(onComplete) {
  clearInterval(timer);
  timer = null;
  document.getElementById('readingScreen').classList.remove('active');

  const minutes = Math.floor(seconds / 60);
  const state = stateManager.getState();

  stateManager.updateStats({
    total: state.stats.total + minutes,
    today: state.stats.today + minutes
  });

  // 本ごとの読書時間を記録
  if (currentBookId) {
    const book = stateManager.getBook(currentBookId);
    if (book) {
      stateManager.updateBook(currentBookId, {
        readingTime: (book.readingTime || 0) + minutes
      });
    }
  }

  if (minutes >= CONFIG.minSessionMinutes) {
    const currentState = stateManager.getState();
    const updates = {
      sessions: currentState.stats.sessions + 1
    };

    if (!currentState.stats.firstSessionDate) {
      updates.firstSessionDate = new Date().toISOString();
    }

    stateManager.updateStats(updates);
    stateManager.addHistory({
      d: new Date().toISOString(),
      m: minutes,
      h: new Date().getHours(),
      bookId: currentBookId
    });
  }

  // ボタンテキストはupdateUI経由でrenderReadingBooksが更新する
  seconds = 0;
  currentBookId = null;

  saveState();
  onComplete();
}
