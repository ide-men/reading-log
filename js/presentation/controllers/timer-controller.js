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

  // 栞入力モーダルを表示（次はどこから読むか）
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
// 未完了セッション復元
// ========================================

let pendingIncompleteSession = null;

/**
 * 日時を表示用にフォーマット
 * @param {Date} date
 * @returns {string}
 */
function formatDateTime(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}月${day}日 ${hours}:${minutes}`;
}

/**
 * datetime-local用にフォーマット
 * @param {Date} date
 * @returns {string}
 */
function formatDateTimeLocal(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * 未完了セッションをチェックしてモーダルを表示
 */
export function checkIncompleteSession() {
  const session = timerService.getActiveSession();
  if (!session) return;

  const book = session.bookId ? bookRepository.getBookById(session.bookId) : null;
  const startTime = new Date(session.startTime);
  const now = new Date();

  // 開始時刻が未来や、24時間以上前の場合は無効として扱う
  if (startTime > now || (now.getTime() - startTime.getTime()) > 24 * 60 * 60 * 1000) {
    timerService.discardIncompleteSession();
    return;
  }

  pendingIncompleteSession = session;

  // モーダルの内容を設定
  document.getElementById('incompleteSessionBookTitle').textContent =
    book?.title || '（本の情報なし）';
  document.getElementById('incompleteSessionStartTime').textContent =
    formatDateTime(startTime);

  // 終了時刻の初期値を現在時刻に設定
  const endTimeInput = document.getElementById('incompleteSessionEndTime');
  endTimeInput.value = formatDateTimeLocal(now);
  endTimeInput.min = formatDateTimeLocal(startTime);
  endTimeInput.max = formatDateTimeLocal(now);

  openModal('incompleteSessionModal');
}

/**
 * 未完了セッションを記録
 */
function handleRecordIncompleteSession() {
  if (!pendingIncompleteSession) return;

  const endTimeValue = document.getElementById('incompleteSessionEndTime').value;
  if (!endTimeValue) {
    showToast('終了時刻を入力してください');
    return;
  }

  const endTime = new Date(endTimeValue);
  const startTime = new Date(pendingIncompleteSession.startTime);

  // バリデーション
  if (endTime <= startTime) {
    showToast('終了時刻は開始時刻より後にしてください');
    return;
  }

  const { minutes, isValidSession } = timerService.recordIncompleteSession(
    pendingIncompleteSession,
    endTime
  );

  closeModal('incompleteSessionModal');
  pendingIncompleteSession = null;

  if (isValidSession) {
    showToast(`${minutes}分の読書を記録しました`);
  } else {
    showToast(`${minutes}分の読書を記録しました（10分未満のため履歴には追加されません）`);
  }

  updateUI();
  renderReadingBooks();
}

/**
 * 未完了セッションを破棄
 */
function handleDiscardIncompleteSession() {
  timerService.discardIncompleteSession();
  closeModal('incompleteSessionModal');
  pendingIncompleteSession = null;
}

/**
 * 未完了セッションモーダルのイベント初期化
 */
export function initIncompleteSessionEvents() {
  document.getElementById('recordIncompleteSessionBtn').addEventListener('click', () => {
    handleRecordIncompleteSession();
  });

  document.getElementById('discardIncompleteSessionBtn').addEventListener('click', () => {
    handleDiscardIncompleteSession();
  });
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
