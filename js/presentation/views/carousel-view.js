// ========================================
// カバン（読書中）- カルーセルビュー
// ========================================
import { BOOK_STATUS, UI_CONFIG } from '../../shared/constants.js';
import { escapeHtml } from '../../shared/utils.js';
import * as bookRepository from '../../domain/book/book-repository.js';
import { stateManager } from '../../core/state-manager.js';

// ========================================
// カバン（読書中）のレンダリング
// ========================================
export function renderReadingBooks() {
  const books = bookRepository.getBooksByStatus(BOOK_STATUS.READING);
  const carousel = document.getElementById('bookCarousel');
  const wrapper = document.getElementById('bookCarouselWrapper');
  const dotsContainer = document.getElementById('carouselDots');
  const infoContainer = document.getElementById('selectedBookInfo');
  const startBtn = document.getElementById('startBtn');
  const completeBtn = document.getElementById('completeSelectedBtn');
  const menuBtn = document.getElementById('bookActionsMenuBtn');

  if (!carousel) return;

  let selectedBookId = stateManager.getSelectedBookId();

  if (books.length === 0) {
    carousel.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">📖</div>
        <div class="empty-state__text">読んでいる本はありません</div>
        <div class="empty-state__hint">本を追加して読書を始めましょう</div>
      </div>`;
    infoContainer.innerHTML = '';
    startBtn.disabled = true;
    startBtn.innerHTML = '<span class="main-btn-icon">📖</span><span>本を追加してください</span>';
    completeBtn.disabled = true;
    menuBtn.disabled = true;
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

    // 選択中の本に付箋があれば吹き出しで表示
    const bookmarkHtml = isSelected && book.bookmark
      ? `<div class="carousel-book-balloon">${escapeHtml(book.bookmark)}</div>`
      : '';

    return `
      <div class="carousel-book${isSelected ? ' selected' : ''}" data-id="${book.id}">
        ${bookmarkHtml}
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
  const menuBtn = document.getElementById('bookActionsMenuBtn');
  const linkBtn = document.getElementById('openLinkSelectedBtn');

  if (!selectedBookId) {
    infoContainer.innerHTML = '';
    startBtn.disabled = true;
    startBtn.innerHTML = '<span class="main-btn-icon">📖</span><span>本を選んでください</span>';
    completeBtn.disabled = true;
    menuBtn.disabled = true;
    if (linkBtn) linkBtn.disabled = true;
    return;
  }

  const book = bookRepository.getBookById(selectedBookId);
  if (!book) return;

  // 本の名前・開始日は表示しない（付箋は別の場所で表示）
  infoContainer.innerHTML = '';

  // ボタンを有効化
  startBtn.disabled = false;
  startBtn.innerHTML = '<span class="main-btn-icon">📖</span><span>この本を読む</span>';
  completeBtn.disabled = false;
  menuBtn.disabled = false;
  // リンクボタンはリンクがある場合のみ有効化
  if (linkBtn) linkBtn.disabled = !book.link;
}

// ========================================
// カルーセルで本を選択
// ========================================
export function selectBook(id, scrollToCenter = false) {
  stateManager.setSelectedBookId(id);

  // UIを更新
  const books = document.querySelectorAll('.carousel-book');
  let selectedElement = null;

  books.forEach(book => {
    if (parseInt(book.dataset.id) === id) {
      book.classList.add('selected');
      selectedElement = book;
    } else {
      book.classList.remove('selected');
    }
  });

  // 選択した本を中央にスクロール
  if (scrollToCenter && selectedElement) {
    scrollBookToCenter(selectedElement);
  }

  updateSelectedBookInfo();
}

// ========================================
// 本を中央にスクロール
// ========================================
function scrollBookToCenter(bookElement) {
  const carousel = document.getElementById('bookCarousel');
  if (!carousel || !bookElement) return;

  const carouselRect = carousel.getBoundingClientRect();
  const bookRect = bookElement.getBoundingClientRect();

  // 本の中央とカルーセルの中央のオフセットを計算
  const bookCenterX = bookRect.left + bookRect.width / 2;
  const carouselCenterX = carouselRect.left + carouselRect.width / 2;
  const scrollOffset = bookCenterX - carouselCenterX;

  carousel.scrollBy({
    left: scrollOffset,
    behavior: 'smooth'
  });
}

// ========================================
// 中央に最も近い本を選択
// ========================================
let scrollEndTimer = null;

export function selectCenteredBook() {
  const carousel = document.getElementById('bookCarousel');
  if (!carousel) return;

  const books = carousel.querySelectorAll('.carousel-book');
  if (books.length <= 1) return;

  // スクロール終了を待ってから選択を更新（debounce）
  clearTimeout(scrollEndTimer);
  scrollEndTimer = setTimeout(() => {
    const carouselRect = carousel.getBoundingClientRect();
    const centerX = carouselRect.left + carouselRect.width / 2;

    let closestBook = null;
    let closestDistance = Infinity;

    books.forEach(book => {
      const bookRect = book.getBoundingClientRect();
      const bookCenterX = bookRect.left + bookRect.width / 2;
      const distance = Math.abs(bookCenterX - centerX);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestBook = book;
      }
    });

    if (closestBook) {
      const bookId = Number(closestBook.dataset.id);
      const currentSelectedId = stateManager.getSelectedBookId();

      if (bookId !== currentSelectedId) {
        selectBook(bookId);
      }
    }
  }, 100);
}
