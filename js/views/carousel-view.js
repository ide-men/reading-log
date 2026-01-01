// ========================================
// カバン（読書中）- カルーセルビュー
// ========================================
import { BOOK_STATUS, UI_CONFIG } from '../constants.js';
import { stateManager } from '../state.js';
import { escapeHtml } from '../utils.js';
import { getBooksByStatus, getRelativeDate } from '../book-helpers.js';

// ========================================
// カバン（読書中）のレンダリング
// ========================================
export function renderReadingBooks() {
  const books = getBooksByStatus(BOOK_STATUS.READING);
  const carousel = document.getElementById('bookCarousel');
  const wrapper = document.getElementById('bookCarouselWrapper');
  const dotsContainer = document.getElementById('carouselDots');
  const infoContainer = document.getElementById('selectedBookInfo');
  const startBtn = document.getElementById('startBtn');
  const completeBtn = document.getElementById('completeSelectedBtn');
  const dropBtn = document.getElementById('dropSelectedBtn');

  if (!carousel) return;

  let selectedBookId = stateManager.getSelectedBookId();

  if (books.length === 0) {
    carousel.innerHTML = `
      <div class="empty-carousel">
        <div class="empty-carousel-icon">📖</div>
        <div class="empty-carousel-text">読んでいる本はありません</div>
        <div class="empty-carousel-hint">本を追加して読書を始めましょう</div>
      </div>`;
    infoContainer.innerHTML = '';
    startBtn.disabled = true;
    startBtn.innerHTML = '<span class="main-btn-icon">📖</span><span>本を追加してください</span>';
    completeBtn.disabled = true;
    dropBtn.disabled = true;
    stateManager.setSelectedBookId(null);
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      dotsContainer.classList.remove('visible');
    }
    if (wrapper) {
      wrapper.classList.remove('can-scroll-left', 'can-scroll-right');
    }
    return;
  }

  // 選択中の本が削除されていたら最初の本を選択
  if (!selectedBookId || !books.find(b => b.id === selectedBookId)) {
    selectedBookId = books[0].id;
    stateManager.setSelectedBookId(selectedBookId);
  }

  // カルーセルをレンダリング
  carousel.innerHTML = books.map(book => {
    const coverHtml = book.coverUrl
      ? `<img src="${escapeHtml(book.coverUrl)}" alt="">`
      : '📖';
    const isSelected = book.id === selectedBookId;

    return `
      <div class="carousel-book${isSelected ? ' selected' : ''}" data-id="${book.id}">
        <div class="carousel-book-cover">${coverHtml}</div>
      </div>`;
  }).join('');

  // ドットインジケーターを生成（一定数以上の場合のみ表示）
  if (dotsContainer && books.length >= UI_CONFIG.carouselDotsMinBooks) {
    dotsContainer.innerHTML = books.map((book, i) => {
      const isActive = book.id === selectedBookId;
      return `<div class="carousel-dot${isActive ? ' active' : ''}" data-index="${i}"></div>`;
    }).join('');
    dotsContainer.classList.add('visible');
  } else if (dotsContainer) {
    dotsContainer.innerHTML = '';
    dotsContainer.classList.remove('visible');
  }

  // スクロール状態を更新（DOM更新後に実行）
  requestAnimationFrame(() => {
    updateCarouselScrollState();
  });

  // 選択中の本の情報を表示
  updateSelectedBookInfo();
}

// ========================================
// カルーセルのスクロール状態を更新
// ========================================
export function updateCarouselScrollState() {
  const carousel = document.getElementById('bookCarousel');
  const wrapper = document.getElementById('bookCarouselWrapper');
  const dotsContainer = document.getElementById('carouselDots');

  if (!carousel || !wrapper) return;

  const threshold = UI_CONFIG.carouselScrollThreshold;
  const canScrollLeft = carousel.scrollLeft > threshold;
  const canScrollRight = carousel.scrollLeft < carousel.scrollWidth - carousel.clientWidth - threshold;

  wrapper.classList.toggle('can-scroll-left', canScrollLeft);
  wrapper.classList.toggle('can-scroll-right', canScrollRight);

  // 現在表示されている本に基づいてドットを更新
  if (dotsContainer) {
    const selectedBook = carousel.querySelector('.carousel-book.selected');
    if (selectedBook) {
      const bookElements = Array.from(carousel.querySelectorAll('.carousel-book'));
      const selectedIndex = bookElements.indexOf(selectedBook);
      const dots = dotsContainer.querySelectorAll('.carousel-dot');
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === selectedIndex);
      });
    }
  }
}

// ========================================
// 選択中の本の情報を更新
// ========================================
export function updateSelectedBookInfo() {
  const selectedBookId = stateManager.getSelectedBookId();
  const infoContainer = document.getElementById('selectedBookInfo');
  const startBtn = document.getElementById('startBtn');
  const completeBtn = document.getElementById('completeSelectedBtn');
  const dropBtn = document.getElementById('dropSelectedBtn');

  if (!selectedBookId) {
    infoContainer.innerHTML = '';
    startBtn.disabled = true;
    startBtn.innerHTML = '<span class="main-btn-icon">📖</span><span>本を選んでください</span>';
    completeBtn.disabled = true;
    dropBtn.disabled = true;
    return;
  }

  const book = stateManager.getBook(selectedBookId);
  if (!book) return;

  const meta = book.startedAt ? getRelativeDate(book.startedAt) : '';

  infoContainer.innerHTML = `
    <div class="selected-book-title">${escapeHtml(book.title)}</div>
    <div class="selected-book-meta">${meta}</div>
  `;

  // ボタンを有効化
  startBtn.disabled = false;
  startBtn.innerHTML = '<span class="main-btn-icon">📖</span><span>この本を読む</span>';
  completeBtn.disabled = false;
  dropBtn.disabled = false;
}

// ========================================
// カルーセルで本を選択
// ========================================
export function selectBook(id) {
  stateManager.setSelectedBookId(id);

  // UIを更新
  const books = document.querySelectorAll('.carousel-book');
  books.forEach(book => {
    if (parseInt(book.dataset.id) === id) {
      book.classList.add('selected');
    } else {
      book.classList.remove('selected');
    }
  });

  updateSelectedBookInfo();
}
