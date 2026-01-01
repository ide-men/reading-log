// ========================================
// 本の管理・レンダリング
// ========================================
import { BOOK_COLORS, BOOK_STATUS } from './constants.js';
import { stateManager } from './state.js';
import { saveState } from './storage.js';
import {
  escapeHtml,
  escapeAttr,
  isValidUrl,
  isAmazonShortUrl,
  extractAsinFromUrl,
  getAmazonImageUrl,
  adjustColor
} from './utils.js';
import { showToast, closeModal } from './ui.js';

// 編集・削除中の本ID
let deletingBookId = null;
let editingBookId = null;

// カルーセルで選択中の本ID
let selectedBookId = null;

// 書斎の現在選択中のステータス
let currentStudyStatus = BOOK_STATUS.COMPLETED;

// 書斎で選択中の本ID
let studySelectedBookId = null;

// 本屋で選択中の本ID
let storeSelectedBookId = null;

export function getEditingBookId() {
  return editingBookId;
}

export function getDeletingBookId() {
  return deletingBookId;
}

export function getCurrentStudyStatus() {
  return currentStudyStatus;
}

export function setCurrentStudyStatus(status) {
  currentStudyStatus = status;
}

export function getSelectedBookId() {
  return selectedBookId;
}

export function setSelectedBookId(id) {
  selectedBookId = id;
}

export function getStudySelectedBookId() {
  return studySelectedBookId;
}

export function setStudySelectedBookId(id) {
  studySelectedBookId = id;
}

export function clearStudySelection() {
  studySelectedBookId = null;
}

export function getStoreSelectedBookId() {
  return storeSelectedBookId;
}

export function setStoreSelectedBookId(id) {
  storeSelectedBookId = id;
}

export function clearStoreSelection() {
  storeSelectedBookId = null;
}

// ========================================
// ヘルパー関数
// ========================================
function getBooksByStatus(status) {
  const state = stateManager.getState();
  return state.books.filter(book => book.status === status);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP');
}

function getRelativeDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今日から';
  if (diffDays === 1) return '昨日から';
  if (diffDays < 7) return `${diffDays}日前から`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前から`;
  return formatDate(dateStr) + 'から';
}

// ========================================
// カバン（読書中）のレンダリング - カルーセル版
// ========================================
export function renderReadingBooks() {
  const books = getBooksByStatus(BOOK_STATUS.READING);
  const carousel = document.getElementById('bookCarousel');
  const infoContainer = document.getElementById('selectedBookInfo');
  const startBtn = document.getElementById('startBtn');
  const completeBtn = document.getElementById('completeSelectedBtn');
  const dropBtn = document.getElementById('dropSelectedBtn');

  if (!carousel) return;

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
    selectedBookId = null;
    return;
  }

  // 選択中の本が削除されていたら最初の本を選択
  if (!selectedBookId || !books.find(b => b.id === selectedBookId)) {
    selectedBookId = books[0].id;
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
        <div class="carousel-book-title">${escapeHtml(book.title)}</div>
      </div>`;
  }).join('');

  // 選択中の本の情報を表示
  updateSelectedBookInfo();
}

// 選択中の本の情報を更新
export function updateSelectedBookInfo() {
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
  selectedBookId = id;

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
  const state = stateManager.getState();

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
    const color = BOOK_COLORS[i % BOOK_COLORS.length];
    const height = 50 + ((i * 17) % 25);
    const width = book.coverUrl ? 18 + ((i * 2) % 6) : 14 + ((i * 3) % 8);
    const tilt = ((i * 7) % 5) - 2;
    const darkerColor = adjustColor(color, -20);
    const lighterColor = adjustColor(color, 15);

    const bgStyle = book.coverUrl
      ? `background-color: ${color}; background-image: url('${escapeHtml(book.coverUrl)}'); background-size: cover; background-position: center;`
      : `background: linear-gradient(to right, ${lighterColor} 0%, ${color} 15%, ${color} 85%, ${darkerColor} 100%);`;
    const hasCoverClass = book.coverUrl ? 'has-cover' : '';
    const selectedClass = studySelectedBookId === book.id ? 'selected' : '';

    return `
      <div class="mini-book ${hasCoverClass} ${selectedClass}" data-book-id="${book.id}" style="
        height:${height}px;
        width:${width}px;
        ${bgStyle}
        transform: rotate(${tilt}deg);
      ">
        <div class="book-tooltip">
          <div class="tooltip-title">${escapeHtml(book.title)}</div>
        </div>
      </div>`;
  }).join('');

  // 選択中の本がある場合は詳細ビューを表示
  const selectedBook = studySelectedBookId ? books.find(b => b.id === studySelectedBookId) : null;

  if (selectedBook) {
    bookList.innerHTML = renderStudyDetailView(selectedBook);
  } else {
    // グリッドカードレイアウトでレンダリング
    bookList.innerHTML = `<div class="study-grid">${[...books].reverse().map((book, i) => {
      const colorIndex = books.length - 1 - i;
      const color = BOOK_COLORS[colorIndex % BOOK_COLORS.length];

      const coverHtml = book.coverUrl
        ? `<img src="${escapeHtml(book.coverUrl)}" alt="">`
        : `<span class="book-placeholder">📕</span>`;

      // ステータスに応じた日付表示
      let dateText = '';
      if (currentStudyStatus === BOOK_STATUS.COMPLETED && book.completedAt) {
        dateText = formatDate(book.completedAt) + ' 読了';
      } else if (currentStudyStatus === BOOK_STATUS.UNREAD) {
        dateText = formatDate(new Date(book.id).toISOString().split('T')[0]) + ' 追加';
      } else if (currentStudyStatus === BOOK_STATUS.DROPPED && book.startedAt) {
        dateText = formatDate(book.startedAt) + ' 開始';
      }

      // ステータスに応じたアクションボタン（グリッドではステータス変更のみ）
      let actionBtn = '';
      if (currentStudyStatus === BOOK_STATUS.UNREAD || currentStudyStatus === BOOK_STATUS.DROPPED) {
        actionBtn = `
          <div class="study-book-actions">
            <button class="study-action-btn" data-start="${book.id}">
              <span>📖</span>
              <span>読み始める！</span>
            </button>
          </div>`;
      }

      return `
        <div class="study-book-card" data-book-id="${book.id}">
          <div class="study-book-cover" style="background-color: ${color}">
            ${coverHtml}
          </div>
          <div class="study-book-info">
            <div class="study-book-title">${escapeHtml(book.title)}</div>
            <div class="study-book-date">${dateText}</div>
          </div>
          ${actionBtn}
        </div>
      `;
    }).join('')}</div>`;
  }
}

// 書斎の詳細ビューをレンダリング
function renderStudyDetailView(book) {
  const bookIndex = stateManager.getState().books.findIndex(b => b.id === book.id);
  const color = BOOK_COLORS[bookIndex % BOOK_COLORS.length];

  const coverHtml = book.coverUrl
    ? `<img src="${escapeHtml(book.coverUrl)}" alt="">`
    : `<span class="book-placeholder">📕</span>`;

  // ステータスに応じた日付表示
  let dateText = '';
  if (book.status === BOOK_STATUS.COMPLETED && book.completedAt) {
    dateText = formatDate(book.completedAt) + ' 読了';
  } else if (book.status === BOOK_STATUS.UNREAD) {
    dateText = formatDate(new Date(book.id).toISOString().split('T')[0]) + ' 追加';
  } else if (book.status === BOOK_STATUS.DROPPED && book.startedAt) {
    dateText = formatDate(book.startedAt) + ' 開始';
  } else if (book.status === BOOK_STATUS.READING && book.startedAt) {
    dateText = formatDate(book.startedAt) + ' 開始';
  }

  // メモ表示
  const noteHtml = book.note
    ? `<div class="study-detail-note">${escapeHtml(book.note)}</div>`
    : '';

  // リンクボタン
  const linkBtn = isValidUrl(book.link)
    ? `<button class="study-detail-action" data-link="${escapeAttr(book.link)}">
        <span>↗</span>
        <span>リンクを開く</span>
      </button>`
    : '';

  // ステータスに応じたアクションボタン
  let actionBtn = '';
  if (book.status === BOOK_STATUS.UNREAD || book.status === BOOK_STATUS.DROPPED) {
    actionBtn = `
      <button class="study-detail-action primary" data-start="${book.id}">
        <span>📖</span>
        <span>読み始める！</span>
      </button>`;
  }

  return `
    <div class="study-detail-view">
      <button class="study-detail-close" data-close-detail>✕</button>
      <div class="study-detail-content">
        <div class="study-detail-cover" style="background-color: ${color}">
          ${coverHtml}
        </div>
        <div class="study-detail-info">
          <div class="study-detail-title">${escapeHtml(book.title)}</div>
          <div class="study-detail-date">${dateText}</div>
          ${noteHtml}
          <div class="study-detail-actions">
            ${actionBtn}
            ${linkBtn}
            <button class="study-detail-action" data-edit="${book.id}">
              <span>✏️</span>
              <span>編集</span>
            </button>
            <button class="study-detail-action danger" data-delete="${book.id}">
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
let detailBookId = null;

export function getDetailBookId() {
  return detailBookId;
}

export function openBookDetail(id) {
  const book = stateManager.getBook(id);
  if (!book) return;

  detailBookId = id;

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
  let metaText = '';
  if (book.status === BOOK_STATUS.COMPLETED && book.completedAt) {
    metaText = formatDate(book.completedAt) + ' 読了';
  } else if (book.status === BOOK_STATUS.UNREAD) {
    metaText = formatDate(new Date(book.id).toISOString().split('T')[0]) + ' 追加';
  } else if (book.status === BOOK_STATUS.DROPPED && book.startedAt) {
    metaText = formatDate(book.startedAt) + ' 開始';
  } else if (book.status === BOOK_STATUS.READING && book.startedAt) {
    metaText = formatDate(book.startedAt) + ' 開始';
  }
  document.getElementById('bookDetailMeta').textContent = metaText;

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
// 本屋（ウィッシュリスト）のレンダリング
// ========================================
export function renderStoreBooks() {
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
    const color = BOOK_COLORS[i % BOOK_COLORS.length];
    const height = 50 + ((i * 17) % 25);
    const width = book.coverUrl ? 18 + ((i * 2) % 6) : 14 + ((i * 3) % 8);
    const tilt = ((i * 7) % 5) - 2;
    const darkerColor = adjustColor(color, -20);
    const lighterColor = adjustColor(color, 15);

    const bgStyle = book.coverUrl
      ? `background-color: ${color}; background-image: url('${escapeHtml(book.coverUrl)}'); background-size: cover; background-position: center;`
      : `background: linear-gradient(to right, ${lighterColor} 0%, ${color} 15%, ${color} 85%, ${darkerColor} 100%);`;
    const hasCoverClass = book.coverUrl ? 'has-cover' : '';
    const selectedClass = storeSelectedBookId === book.id ? 'selected' : '';

    return `
      <div class="store-mini-book ${hasCoverClass} ${selectedClass}" data-book-id="${book.id}" style="
        height:${height}px;
        width:${width}px;
        ${bgStyle}
        transform: rotate(${tilt}deg);
      ">
        <div class="book-tooltip">
          <div class="tooltip-title">${escapeHtml(book.title)}</div>
        </div>
      </div>`;
  }).join('');

  // 選択中の本がある場合は詳細ビューを表示
  const selectedBook = storeSelectedBookId ? books.find(b => b.id === storeSelectedBookId) : null;

  if (selectedBook) {
    container.innerHTML = renderStoreDetailView(selectedBook);
  } else {
    // グリッドカードレイアウトでレンダリング
    container.innerHTML = `<div class="store-grid">${[...books].reverse().map((book, i) => {
      const colorIndex = books.length - 1 - i;
      const color = BOOK_COLORS[colorIndex % BOOK_COLORS.length];

      const coverHtml = book.coverUrl
        ? `<img src="${escapeHtml(book.coverUrl)}" alt="">`
        : `<span class="book-placeholder">📖</span>`;

      return `
        <div class="store-book-card" data-book-id="${book.id}">
          <div class="store-book-cover" style="background-color: ${color}">
            ${coverHtml}
          </div>
          <div class="store-book-info">
            <div class="store-book-title">${escapeHtml(book.title)}</div>
            <div class="store-book-date">${formatDate(new Date(book.id).toISOString().split('T')[0])} 追加</div>
          </div>
          <div class="store-book-actions">
            <button class="store-acquire-btn" data-acquire="${book.id}">
              <span>🛒</span>
              <span>手に入れた！</span>
            </button>
          </div>
        </div>
      `;
    }).join('')}</div>`;
  }
}

// 本屋の詳細ビューをレンダリング
function renderStoreDetailView(book) {
  const bookIndex = stateManager.getState().books.findIndex(b => b.id === book.id);
  const color = BOOK_COLORS[bookIndex % BOOK_COLORS.length];

  const coverHtml = book.coverUrl
    ? `<img src="${escapeHtml(book.coverUrl)}" alt="">`
    : `<span class="book-placeholder">📖</span>`;

  const dateText = formatDate(new Date(book.id).toISOString().split('T')[0]) + ' 追加';

  // メモ表示
  const noteHtml = book.note
    ? `<div class="store-detail-note">${escapeHtml(book.note)}</div>`
    : '';

  // リンクボタン
  const linkBtn = isValidUrl(book.link)
    ? `<button class="store-detail-action" data-link="${escapeAttr(book.link)}">
        <span>↗</span>
        <span>リンクを開く</span>
      </button>`
    : '';

  return `
    <div class="store-detail-view">
      <button class="store-detail-close" data-close-detail>✕</button>
      <div class="store-detail-content">
        <div class="store-detail-cover" style="background-color: ${color}">
          ${coverHtml}
        </div>
        <div class="store-detail-info">
          <div class="store-detail-title">${escapeHtml(book.title)}</div>
          <div class="store-detail-date">${dateText}</div>
          ${noteHtml}
          <div class="store-detail-actions">
            <button class="store-detail-action primary" data-acquire="${book.id}">
              <span>🛒</span>
              <span>手に入れた！</span>
            </button>
            ${linkBtn}
            <button class="store-detail-action" data-edit="${book.id}">
              <span>✏️</span>
              <span>編集</span>
            </button>
            <button class="store-detail-action danger" data-delete="${book.id}">
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
// 全体レンダリング（互換性のため）
// ========================================
export function renderBooks() {
  renderReadingBooks();
  renderStudyBooks();
  renderStoreBooks();
}

// ========================================
// 本の追加
// ========================================
export function addBook(status = BOOK_STATUS.READING) {
  const title = document.getElementById('bookInput').value.trim();
  if (!title) {
    showToast('タイトルを入力してください');
    return;
  }

  const link = document.getElementById('linkInput').value.trim();
  const comment = document.getElementById('bookCommentInput').value.trim();
  let coverUrl = null;
  const asin = extractAsinFromUrl(link);

  if (asin) {
    coverUrl = getAmazonImageUrl(asin);
  } else if (isAmazonShortUrl(link)) {
    showToast('短縮URL(amzn.asia等)では表紙画像を取得できません', 4000);
  }

  const today = new Date().toISOString().split('T')[0];
  const bookData = {
    id: Date.now(),
    title,
    link: link || null,
    coverUrl,
    status,
    startedAt: status === BOOK_STATUS.READING ? today : null,
    completedAt: null,
    note: comment || null,
    readingTime: 0
  };

  stateManager.addBook(bookData);
  saveState();
  renderBooks();

  // フォームをクリア
  document.getElementById('bookInput').value = '';
  document.getElementById('bookCommentInput').value = '';
  document.getElementById('linkInput').value = '';
  document.getElementById('linkFields').classList.remove('open');
  document.getElementById('linkIcon').textContent = '+';

  // 通知を表示
  const messages = {
    [BOOK_STATUS.READING]: 'カバンに追加しました',
    [BOOK_STATUS.UNREAD]: '書斎に追加しました',
    [BOOK_STATUS.WISHLIST]: '本屋に追加しました'
  };
  showToast(messages[status] || '本を追加しました');

  // 続けて追加がOFFならモーダルを閉じる
  const continueAdd = document.getElementById('continueAddCheckbox').checked;
  if (!continueAdd) {
    closeModal('addBookModal');
  }
}

// ========================================
// ステータス遷移
// ========================================

// wishlist → unread（手に入れた！）
export function acquireBook(id) {
  const book = stateManager.getBook(id);
  if (!book) return;

  // セレブレーションを表示
  showAcquireCelebration(book);

  // 少し待ってからステータス更新
  setTimeout(() => {
    stateManager.updateBook(id, { status: BOOK_STATUS.UNREAD });
    saveState();
    renderBooks();
  }, 300);
}

// 本を手に入れた時のセレブレーション
function showAcquireCelebration(book) {
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

  // パーティクルを生成
  particles.innerHTML = '';
  createCelebrationParticles(particles);

  // 表示
  celebration.classList.add('active');

  // 自動で閉じる
  setTimeout(() => {
    celebration.classList.remove('active');
    showToast('書斎の積読に追加しました！');
  }, 2000);

  // クリックで早めに閉じる
  const closeHandler = () => {
    celebration.classList.remove('active');
    celebration.removeEventListener('click', closeHandler);
  };
  celebration.addEventListener('click', closeHandler);
}

// パーティクル生成
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

// unread/dropped → reading（読み始める！）
export function startReadingBook(id) {
  const book = stateManager.getBook(id);
  const today = new Date().toISOString().split('T')[0];
  const updates = {
    status: BOOK_STATUS.READING,
    startedAt: book.startedAt || today
  };
  stateManager.updateBook(id, updates);
  saveState();
  renderBooks();
  showToast('読書を始めました！');
}

// reading → completed（読み終わった！）
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

// reading → dropped（中断）
export function dropBook(id) {
  stateManager.updateBook(id, { status: BOOK_STATUS.DROPPED });
  saveState();
  renderBooks();
  showToast('本を中断しました');
}

// ========================================
// 本の編集
// ========================================
export function editBook(id) {
  const book = stateManager.getBook(id);
  if (!book) return;

  editingBookId = id;
  document.getElementById('editBookTitle').value = book.title;
  document.getElementById('editBookLink').value = book.link || '';
  document.getElementById('editBookStatus').value = book.status || BOOK_STATUS.COMPLETED;
  document.getElementById('editBookNote').value = book.note || '';
  document.getElementById('editBookModal').classList.add('active');
}

export function saveEditBook() {
  const title = document.getElementById('editBookTitle').value.trim();
  if (!title) {
    showToast('タイトルを入力してください');
    return;
  }

  const book = stateManager.getBook(editingBookId);
  if (book) {
    const newLink = document.getElementById('editBookLink').value.trim() || null;
    const updates = {
      title,
      status: document.getElementById('editBookStatus').value,
      note: document.getElementById('editBookNote').value.trim() || null
    };

    if (newLink !== book.link) {
      updates.link = newLink;
      const asin = extractAsinFromUrl(newLink);
      updates.coverUrl = asin ? getAmazonImageUrl(asin) : null;

      if (!asin && isAmazonShortUrl(newLink)) {
        showToast('短縮URLでは表紙画像を取得できません', 4000);
      }
    }

    stateManager.updateBook(editingBookId, updates);
    saveState();
    renderBooks();
    showToast('保存しました');
  }
  closeModal('editBookModal');
}

// ========================================
// 本の削除
// ========================================
export function deleteBook(id) {
  const book = stateManager.getBook(id);
  if (!book) return;

  deletingBookId = id;
  document.getElementById('deleteBookTitle').textContent = `「${book.title}」`;
  document.getElementById('deleteConfirm').classList.add('active');
}

export function confirmDeleteBook(updateUI) {
  stateManager.removeBook(deletingBookId);

  saveState();
  renderBooks();
  updateUI();
  showToast('削除しました');
  closeModal('deleteConfirm');
}
