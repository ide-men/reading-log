// ========================================
// Timer Controller
// タイマー操作の制御
// ========================================
import { escapeAttr } from '../../shared/utils.js';
import * as timerService from '../../domain/timer/timer-service.js';
import * as bookRepository from '../../domain/book/book-repository.js';
import * as bookService from '../../domain/book/book-service.js';
import * as uiState from '../state/ui-state.js';
import { applyReadingAnimation } from '../effects/animations.js';
import { renderReadingBooks } from '../views/carousel-view.js';
import { updateUI, openModal, closeModal, showToast } from './navigation.js';

// ========================================
// 読書開始
// ========================================
export function handleStartReading() {
  const selectedId = uiState.getSelectedBookId();
  if (!selectedId) return;

  const { book } = timerService.startReading(selectedId);

  // 読書画面を表示
  const readingIcon = document.getElementById('readingIcon');
  if (book && book.coverUrl) {
    readingIcon.innerHTML = `<img src="${escapeAttr(book.coverUrl)}" class="reading-cover-img" alt="">`;
    readingIcon.classList.add('has-cover');
  } else {
    readingIcon.textContent = '📖';
    readingIcon.classList.remove('has-cover');
  }

  applyReadingAnimation();
  document.getElementById('readingScreen').classList.add('active');
  document.getElementById('startBtn').innerHTML =
    '<span class="main-btn-icon anim-relax">📖</span><span>読書中...</span>';
}

// ========================================
// 読書停止
// ========================================
export function handleStopReading() {
  // 読書中の本のIDを取得（stopReadingを呼ぶ前に取得）
  const bookId = timerService.getCurrentBookId();
  const book = bookId ? bookRepository.getBookById(bookId) : null;

  timerService.stopReading();

  document.getElementById('readingScreen').classList.remove('active');
  updateUI();
  renderReadingBooks();

  // 感想入力モーダルを表示
  if (book) {
    uiState.setReadingNoteBookId(bookId);
    document.getElementById('readingNoteBookTitle').textContent = book.title;
    document.getElementById('readingNoteInput').value = book.note || '';
    openModal('readingNoteModal');
  }
}

// ========================================
// 読書終了時の感想保存
// ========================================
export function saveReadingNote() {
  const bookId = uiState.getReadingNoteBookId();
  if (!bookId) return;

  const note = document.getElementById('readingNoteInput').value.trim() || null;
  bookService.editBook(bookId, { note });

  closeModal('readingNoteModal');
  showToast('保存しました');
  renderReadingBooks();
}

export function skipReadingNote() {
  closeModal('readingNoteModal');
}

// ========================================
// タイマーイベント初期化
// ========================================
export function initTimerEvents() {
  document.getElementById('startBtn').addEventListener('click', () => {
    if (timerService.isTimerRunning()) {
      handleStopReading();
    } else {
      handleStartReading();
    }
  });

  document.getElementById('stopBtn').addEventListener('click', () => {
    handleStopReading();
  });

  // 読書終了時の感想モーダル
  document.getElementById('saveReadingNoteBtn').addEventListener('click', () => {
    saveReadingNote();
  });

  document.getElementById('skipReadingNoteBtn').addEventListener('click', () => {
    skipReadingNote();
  });
}

// ========================================
// ページ離脱警告
// ========================================
export function initBeforeUnloadEvent() {
  window.addEventListener('beforeunload', (e) => {
    if (timerService.isTimerRunning() && timerService.getSeconds() > 0) {
      e.preventDefault();
      e.returnValue = '読書中のデータが失われます。ページを離れますか？';
      return e.returnValue;
    }
  });
}

// ========================================
// タイマー状態のエクスポート（他のモジュールから使用）
// ========================================
export const isTimerRunning = timerService.isTimerRunning;
export const getSeconds = timerService.getSeconds;
