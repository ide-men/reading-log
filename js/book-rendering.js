// ========================================
// 本のレンダリング
// ========================================
import { BOOK_STATUS } from './constants.js';
import { stateManager } from './state.js';
import { escapeHtml, escapeAttr, isValidUrl } from './utils.js';
import {
  getSelectedBookId,
  setSelectedBookId,
  getCurrentStudyStatus,
  getStudySelectedBookId,
  getStoreSelectedBookId,
  setDetailBookId
} from './book-state.js';
import {
  getBooksByStatus,
  formatDate,
  getRelativeDate,
  getBookDateText,
  getBookColor,
  getBookColorByIndex,
  createBookCoverHtml,
  getMiniBookStyle
} from './book-helpers.js';

// ========================================
// カバン（読書中）のレンダリング - カルーセル版
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

  let selectedBookId = getSelectedBookId();

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
    setSelectedBookId(null);
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
    setSelectedBookId(selectedBookId);
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

  // ドットインジケーターを生成（4冊以上の場合のみ表示）
  if (dotsContainer && books.length >= 4) {
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

// カルーセルのスクロール状態を更新
export function updateCarouselScrollState() {
  const carousel = document.getElementById('bookCarousel');
  const wrapper = document.getElementById('bookCarouselWrapper');
  const dotsContainer = document.getElementById('carouselDots');

  if (!carousel || !wrapper) return;

  const canScrollLeft = carousel.scrollLeft > 5;
  const canScrollRight = carousel.scrollLeft < carousel.scrollWidth - carousel.clientWidth - 5;

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

// 選択中の本の情報を更新
export function updateSelectedBookInfo() {
  const selectedBookId = getSelectedBookId();
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

// カルーセルで本を選択
export function selectBook(id) {
  setSelectedBookId(id);

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

// ========================================
// 書斎のレンダリング
// ========================================
export function renderStudyBooks() {
  const currentStudyStatus = getCurrentStudyStatus();
  const studySelectedBookId = getStudySelectedBookId();

  // カウント更新
  const completedBooks = getBooksByStatus(BOOK_STATUS.COMPLETED);
  const unreadBooks = getBooksByStatus(BOOK_STATUS.UNREAD);
  const droppedBooks = getBooksByStatus(BOOK_STATUS.DROPPED);

  document.getElementById('completedCount').textContent = completedBooks.length;
  document.getElementById('unreadCount').textContent = unreadBooks.length;
  document.getElementById('droppedCount').textContent = droppedBooks.length;

  // 現在選択中のステータスの本を取得
  let books;
  switch (currentStudyStatus) {
    case BOOK_STATUS.COMPLETED:
      books = completedBooks;
      break;
    case BOOK_STATUS.UNREAD:
      books = unreadBooks;
      break;
    case BOOK_STATUS.DROPPED:
      books = droppedBooks;
      break;
    default:
      books = completedBooks;
  }

  const shelf = document.getElementById('studyShelf');
  const bookList = document.getElementById('studyBookList');

  if (!shelf || !bookList) return;

  if (books.length === 0) {
    const emptyMessages = {
      [BOOK_STATUS.COMPLETED]: { icon: '✅', text: '読了した本はまだありません', hint: '本を読み終えたらここに表示されます' },
      [BOOK_STATUS.UNREAD]: { icon: '📚', text: '積読本はありません', hint: '買った本を追加してみましょう' },
      [BOOK_STATUS.DROPPED]: { icon: '⏸️', text: '中断した本はありません', hint: '読書を中断した本がここに表示されます' }
    };
    const msg = emptyMessages[currentStudyStatus] || emptyMessages[BOOK_STATUS.COMPLETED];

    shelf.innerHTML = `
      <div class="empty-study">
        <div class="empty-study-icon">${msg.icon}</div>
        <div class="empty-study-text">${msg.text}</div>
        <div class="empty-study-hint">${msg.hint}</div>
      </div>`;
    bookList.innerHTML = '';
    return;
  }

  // 本棚表示
  shelf.innerHTML = books.map((book, i) => {
    const style = getMiniBookStyle(book, i);
    const selectedClass = studySelectedBookId === book.id ? 'selected' : '';

    return `
      <div class="mini-book ${style.hasCover ? 'has-cover' : ''} ${selectedClass}" data-book-id="${book.id}" style="
        height:${style.height}px;
        width:${style.width}px;
        ${style.bgStyle}
        transform: rotate(${style.tilt}deg);
      "></div>`;
  }).join('');

  // 選択中の本がある場合は詳細ビューを表示
  const selectedBook = studySelectedBookId ? books.find(b => b.id === studySelectedBookId) : null;

  if (selectedBook) {
    bookList.innerHTML = renderDetailView(selectedBook, 'study');
  } else {
    // グリッドカードレイアウトでレンダリング
    bookList.innerHTML = `<div class="study-grid">${[...books].reverse().map((book, i) => {
      const colorIndex = books.length - 1 - i;
      const color = getBookColorByIndex(colorIndex);
      const coverHtml = createBookCoverHtml(book, '📕');
      const dateText = getBookDateText(book);

      return `
        <div class="study-book-card" data-book-id="${book.id}">
          <div class="study-book-cover" style="background-color: ${color}">
            ${coverHtml}
          </div>
          <div class="study-book-info">
            <div class="study-book-title">${escapeHtml(book.title)}</div>
            <div class="study-book-date">${dateText}</div>
          </div>
          <div class="study-book-actions">
            <button class="study-action-btn" data-start="${book.id}">
              <span>🎒</span>
              <span>カバンに入れる</span>
            </button>
          </div>
        </div>
      `;
    }).join('')}</div>`;
  }
}

// ========================================
// 本屋（ウィッシュリスト）のレンダリング
// ========================================
export function renderStoreBooks() {
  const storeSelectedBookId = getStoreSelectedBookId();
  const books = getBooksByStatus(BOOK_STATUS.WISHLIST);
  const shelf = document.getElementById('storeShelf');
  const container = document.getElementById('storeBookList');
  const countEl = document.getElementById('wishlistCount');

  if (!container || !shelf) return;

  if (countEl) {
    countEl.textContent = books.length;
  }

  if (books.length === 0) {
    shelf.innerHTML = `
      <div class="empty-study">
        <div class="empty-study-icon">🏪</div>
        <div class="empty-study-text">気になる本はありません</div>
        <div class="empty-study-hint">読みたい本を見つけたら追加しましょう</div>
      </div>`;
    container.innerHTML = '';
    return;
  }

  // 本棚表示
  shelf.innerHTML = books.map((book, i) => {
    const style = getMiniBookStyle(book, i);
    const selectedClass = storeSelectedBookId === book.id ? 'selected' : '';

    return `
      <div class="store-mini-book ${style.hasCover ? 'has-cover' : ''} ${selectedClass}" data-book-id="${book.id}" style="
        height:${style.height}px;
        width:${style.width}px;
        ${style.bgStyle}
        transform: rotate(${style.tilt}deg);
      "></div>`;
  }).join('');

  // 選択中の本がある場合は詳細ビューを表示
  const selectedBook = storeSelectedBookId ? books.find(b => b.id === storeSelectedBookId) : null;

  if (selectedBook) {
    container.innerHTML = renderDetailView(selectedBook, 'store');
  } else {
    // グリッドカードレイアウトでレンダリング
    container.innerHTML = `<div class="store-grid">${[...books].reverse().map((book, i) => {
      const colorIndex = books.length - 1 - i;
      const color = getBookColorByIndex(colorIndex);
      const coverHtml = createBookCoverHtml(book, '📖');
      const dateText = formatDate(new Date(book.id).toISOString().split('T')[0]) + ' 追加';

      return `
        <div class="store-book-card" data-book-id="${book.id}">
          <div class="store-book-cover" style="background-color: ${color}">
            ${coverHtml}
          </div>
          <div class="store-book-info">
            <div class="store-book-title">${escapeHtml(book.title)}</div>
            <div class="store-book-date">${dateText}</div>
          </div>
          <div class="store-book-actions">
            <button class="store-acquire-btn" data-to-study="${book.id}">
              <span>📚</span>
              <span>書斎に入れる</span>
            </button>
            <button class="store-acquire-btn secondary" data-to-bag="${book.id}">
              <span>🎒</span>
              <span>カバンに入れる</span>
            </button>
          </div>
        </div>
      `;
    }).join('')}</div>`;
  }
}

// ========================================
// 共通詳細ビューレンダリング
// ========================================
function renderDetailView(book, type = 'study') {
  const color = getBookColor(book);
  const placeholder = type === 'store' ? '📖' : '📕';
  const coverHtml = createBookCoverHtml(book, placeholder);
  const dateText = getBookDateText(book);
  const prefix = type === 'store' ? 'store' : 'study';

  // メモ表示
  const noteHtml = book.note
    ? `<div class="${prefix}-detail-note">${escapeHtml(book.note)}</div>`
    : '';

  // リンクボタン
  const linkBtn = isValidUrl(book.link)
    ? `<button class="${prefix}-detail-action" data-link="${escapeAttr(book.link)}">
        <span>↗</span>
        <span>リンクを開く</span>
      </button>`
    : '';

  // ステータスに応じたアクションボタン
  let primaryActions = '';
  if (type === 'store') {
    primaryActions = `
      <button class="${prefix}-detail-action primary" data-to-study="${book.id}">
        <span>📚</span>
        <span>書斎に入れる</span>
      </button>
      <button class="${prefix}-detail-action" data-to-bag="${book.id}">
        <span>🎒</span>
        <span>カバンに入れる</span>
      </button>`;
  } else if (book.status === BOOK_STATUS.UNREAD || book.status === BOOK_STATUS.DROPPED || book.status === BOOK_STATUS.COMPLETED) {
    primaryActions = `
      <button class="${prefix}-detail-action primary" data-start="${book.id}">
        <span>🎒</span>
        <span>カバンに入れる</span>
      </button>`;
  }

  return `
    <div class="${prefix}-detail-view">
      <button class="${prefix}-detail-close" data-close-detail>✕</button>
      <div class="${prefix}-detail-content">
        <div class="${prefix}-detail-cover" style="background-color: ${color}">
          ${coverHtml}
        </div>
        <div class="${prefix}-detail-info">
          <div class="${prefix}-detail-title">${escapeHtml(book.title)}</div>
          <div class="${prefix}-detail-date">${dateText}</div>
          ${noteHtml}
          <div class="${prefix}-detail-actions">
            ${primaryActions}
            ${linkBtn}
            <button class="${prefix}-detail-action" data-edit="${book.id}">
              <span>✏️</span>
              <span>編集</span>
            </button>
            <button class="${prefix}-detail-action danger" data-delete="${book.id}">
              <span>🗑️</span>
              <span>削除</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ========================================
// 書籍詳細ダイアログを開く
// ========================================
export function openBookDetail(id) {
  const book = stateManager.getBook(id);
  if (!book) return;

  setDetailBookId(id);

  // カバー画像
  const coverEl = document.getElementById('bookDetailCover');
  if (book.coverUrl) {
    coverEl.innerHTML = `<img src="${escapeHtml(book.coverUrl)}" alt="">`;
  } else {
    coverEl.innerHTML = '<span class="book-placeholder">📕</span>';
  }

  // タイトル
  document.getElementById('bookDetailTitle').textContent = book.title;

  // メタ情報
  document.getElementById('bookDetailMeta').textContent = getBookDateText(book);

  // メモ
  const noteEl = document.getElementById('bookDetailNote');
  if (book.note) {
    noteEl.textContent = book.note;
    noteEl.classList.add('has-note');
  } else {
    noteEl.textContent = '';
    noteEl.classList.remove('has-note');
  }

  // リンクボタン
  const linkBtn = document.getElementById('bookDetailLinkBtn');
  if (isValidUrl(book.link)) {
    linkBtn.style.display = 'flex';
    linkBtn.dataset.link = book.link;
  } else {
    linkBtn.style.display = 'none';
  }

  // ダイアログを開く
  document.getElementById('bookDetailModal').classList.add('active');
}

// ========================================
// 全体レンダリング
// ========================================
export function renderBooks() {
  renderReadingBooks();
  renderStudyBooks();
  renderStoreBooks();
}
