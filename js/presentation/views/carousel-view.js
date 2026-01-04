// ========================================
// カバン（読書中）- カルーセルビュー
// ========================================
import { BOOK_STATUS, UI_CONFIG } from '../../shared/constants.js';
import { escapeHtml } from '../../shared/utils.js';
import * as bookRepository from '../../domain/book/book-repository.js';
import { stateManager } from '../../core/state-manager.js';

// ========================================
// カルーセルボタンの状態を一括設定
// ========================================
function setCarouselButtonsState(enabled, linkEnabled = false) {
  const startBtn = document.getElementById('startBtn');
  const completeBtn = document.getElementById('completeSelectedBtn');
  const dropBtn = document.getElementById('dropSelectedBtn');
  const menuBtn = document.getElementById('bookActionsMenuBtn');
  const linkBtn = document.getElementById('openLinkSelectedBtn');

  startBtn.disabled = !enabled;
  completeBtn.disabled = !enabled;
  dropBtn.disabled = !enabled;
  menuBtn.disabled = !enabled;
  if (linkBtn) linkBtn.disabled = !linkEnabled;
}

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
  const dropBtn = document.getElementById('dropSelectedBtn');
  const menuBtn = document.getElementById('bookActionsMenuBtn');

  if (!carousel) return;

  let selectedBookId = stateManager.getSelectedBookId();

  if (books.length === 0) {
    carousel.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">📖</div>
        <div class="empty-state__text">読んでいる本はありません</div>
        <div class="empty-state__hint">本を追加して読書を始めましょう</div>
        <button class="empty-state__add-btn round-action-btn" data-add-book="reading" aria-label="本を追加">
          <span class="round-action-btn__icon">＋</span>
        </button>
      </div>`;
    infoContainer.innerHTML = '';
    setCarouselButtonsState(false);
    startBtn.innerHTML = '<span class="main-btn-icon">📖</span><span>本を追加してください</span>';
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
    const hasCover = !!book.coverUrl;
    const coverHtml = hasCover
      ? `<img src="${escapeHtml(book.coverUrl)}" alt="">`
      : `<span class="carousel-book-spine-title">${escapeHtml(book.title)}</span>`;
    const coverClass = hasCover ? '' : ' carousel-book-cover--no-image';
    const isSelected = book.id === selectedBookId;

    // 栞がある本には栞を表示（選択時のみCSSで可視化）
    const bookmarkHtml = book.bookmark
      ? `<div class="carousel-book-bookmark${isSelected ? ' animate' : ''}">${escapeHtml(book.bookmark)}</div>`
      : '';

    return `
      <div class="carousel-book${isSelected ? ' selected' : ''}" data-id="${book.id}">
        ${bookmarkHtml}
        <div class="carousel-book-title">${escapeHtml(book.title)}</div>
        <div class="carousel-book-cover${coverClass}">${coverHtml}</div>
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

  if (!selectedBookId) {
    infoContainer.innerHTML = '';
    setCarouselButtonsState(false);
    startBtn.innerHTML = '<span class="main-btn-icon">📖</span><span>本を選んでください</span>';
    return;
  }

  const book = bookRepository.getBookById(selectedBookId);
  if (!book) return;

  // タイトルは各本の上に表示されるので、infoContainerは空にする
  infoContainer.innerHTML = '';

  // ボタンを有効化（リンクボタンはリンクがある場合のみ）
  setCarouselButtonsState(true, !!book.link);
  startBtn.innerHTML = '<span>この本を読む</span>';
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
    const bookId = parseInt(book.dataset.id);
    const bookmark = book.querySelector('.carousel-book-bookmark');

    if (bookId === id) {
      book.classList.add('selected');
      selectedElement = book;
      // 栞のアニメーションを発火
      if (bookmark) {
        bookmark.classList.remove('animate');
        // リフローを強制してアニメーションをリセット
        void bookmark.offsetWidth;
        bookmark.classList.add('animate');
      }
    } else {
      book.classList.remove('selected');
      // 非選択の本の栞からanimate クラスを除去
      if (bookmark) {
        bookmark.classList.remove('animate');
      }
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

/**
 * カルーセルビューのクリーンアップ（タイマー解放）
 */
export function cleanupCarouselView() {
  if (scrollEndTimer) {
    clearTimeout(scrollEndTimer);
    scrollEndTimer = null;
  }
}
