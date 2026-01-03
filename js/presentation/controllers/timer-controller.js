// ========================================
// Timer Controller
// タイマー操作の制御
// ========================================
import { escapeAttr, escapeHtml } from '../../shared/utils.js';
import * as timerService from '../../domain/timer/timer-service.js';
import * as bookRepository from '../../domain/book/book-repository.js';
import * as bookService from '../../domain/book/book-service.js';
import { stateManager } from '../../core/state-manager.js';
import { applyReadingAnimation } from '../effects/animations.js';
import { renderReadingBooks } from '../views/carousel-view.js';
import { updateUI, openModal, closeModal, showToast } from './navigation.js';
import { initModalValidation, updateButtonState } from '../utils/modal-validation.js';
import { initClearButton } from '../utils/form-clear-button.js';

// ========================================
// Pure関数（テスト用）
// ========================================

/**
 * 読書画面の表示データを生成
 * @param {Object|null} book - 本のオブジェクト
 * @returns {Object} 表示データ
 */
export function prepareReadingScreenData(book) {
  if (book && book.coverUrl) {
    return {
      hasCover: true,
      coverHtml: `<img src="${escapeAttr(book.coverUrl)}" alt="">`,
      title: book.title
    };
  }
  return {
    hasCover: false,
    coverHtml: '<span class="reading-book__icon">📖</span>',
    title: book?.title || ''
  };
}

/**
 * 栞保存時の処理データを生成
 * @param {string} bookmarkValue - 入力された栞の値
 * @returns {Object} 処理データ
 */
export function prepareBookmarkData(bookmarkValue) {
  const bookmark = bookmarkValue?.trim() || null;
  return {
    bookmark,
    shouldShowToast: !!bookmark
  };
}

// ========================================
// 読書開始
// ========================================
export function handleStartReading() {
  const selectedId = stateManager.getSelectedBookId();
  if (!selectedId) return;

  const { book } = timerService.startReading(selectedId);

  // 読書画面を表示
  const bookCover = document.getElementById('readingBookCover');
  const readingTitle = document.getElementById('readingTitle');

  const screenData = prepareReadingScreenData(book);
  bookCover.innerHTML = screenData.coverHtml;
  if (screenData.hasCover) {
    bookCover.classList.add('has-cover');
  } else {
    bookCover.classList.remove('has-cover');
  }

  // 本のタイトルを表示
  if (readingTitle) {
    readingTitle.textContent = screenData.title;
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

  // 栞入力モーダルを表示（どこまで読んだか）
  if (book) {
    stateManager.setReadingBookmarkBookId(bookId);
    document.getElementById('readingBookmarkBookTitle').textContent = book.title;
    document.getElementById('readingBookmarkInput').value = book.bookmark || '';
    openModal('readingBookmarkModal');

    // バリデーション状態を更新（任意のみなので入力がない場合は非活性）
    updateButtonState('saveReadingBookmarkBtn', [], ['readingBookmarkInput']);
  }
}

// ========================================
// 読書終了時の栞保存
// ========================================
export function saveReadingBookmark() {
  const bookId = stateManager.getReadingBookmarkBookId();
  if (!bookId) return;

  const inputValue = document.getElementById('readingBookmarkInput').value;
  const { bookmark, shouldShowToast } = prepareBookmarkData(inputValue);
  bookService.editBook(bookId, { bookmark });

  closeModal('readingBookmarkModal');
  if (shouldShowToast) {
    showToast('栞を挟みました');
  }
  renderReadingBooks();
}

export function skipReadingBookmark() {
  closeModal('readingBookmarkModal');
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

  // 読書終了時の栞モーダル
  document.getElementById('saveReadingBookmarkBtn').addEventListener('click', () => {
    saveReadingBookmark();
  });

  document.getElementById('skipReadingBookmarkBtn').addEventListener('click', () => {
    skipReadingBookmark();
  });

  // バリデーションを初期化（入力イベントでボタン状態を更新）
  initModalValidation({
    modalId: 'readingBookmarkModal',
    buttonId: 'saveReadingBookmarkBtn',
    requiredFields: [],
    optionalFields: ['readingBookmarkInput']
  });

  // クリアボタンを初期化
  initClearButton('readingBookmarkInput');
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
