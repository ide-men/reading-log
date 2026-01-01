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

// 書斎の現在選択中のステータス
let currentStudyStatus = BOOK_STATUS.COMPLETED;

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
// カバン（読書中）のレンダリング
// ========================================
export function renderReadingBooks() {
  const books = getBooksByStatus(BOOK_STATUS.READING);
  const container = document.getElementById('readingBooks');

  if (!container) return;

  if (books.length === 0) {
    container.innerHTML = `
      <div class="empty-reading">
        <div class="empty-reading-icon">📖</div>
        <div class="empty-reading-text">読んでいる本はありません</div>
        <div class="empty-reading-hint">本を追加して読書を始めましょう</div>
      </div>`;
    return;
  }

  container.innerHTML = books.map(book => {
    const coverHtml = book.coverUrl
      ? `<img src="${escapeHtml(book.coverUrl)}" alt="">`
      : '📖';
    const meta = book.startedAt ? getRelativeDate(book.startedAt) : '';

    return `
      <div class="reading-book-card" data-id="${book.id}">
        <div class="reading-book-cover">${coverHtml}</div>
        <div class="reading-book-info">
          <div class="reading-book-title">${escapeHtml(book.title)}</div>
          <div class="reading-book-meta">${meta}</div>
        </div>
        <div class="reading-book-actions">
          <button class="reading-book-action complete" data-complete="${book.id}">読み終わった！</button>
          <button class="reading-book-action drop" data-drop="${book.id}">中断</button>
        </div>
      </div>`;
  }).join('');
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

    return `
      <div class="mini-book ${hasCoverClass}" style="
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

  // リスト表示
  bookList.innerHTML = [...books].reverse().map((book, i) => {
    const link = isValidUrl(book.link) ? escapeAttr(book.link) : null;
    const linkBtn = link ? `<button data-link="${link}">↗</button>` : '';
    const colorIndex = books.length - 1 - i;
    const color = BOOK_COLORS[colorIndex % BOOK_COLORS.length];

    const coverHtml = book.coverUrl
      ? `<img src="${escapeHtml(book.coverUrl)}" alt="" class="book-cover"><span class="book-icon-emoji">📕</span>`
      : '<span class="book-icon-emoji">📕</span>';

    // ステータスに応じた日付表示
    let dateText = '';
    if (currentStudyStatus === BOOK_STATUS.COMPLETED && book.completedAt) {
      dateText = formatDate(book.completedAt) + ' 読了';
    } else if (currentStudyStatus === BOOK_STATUS.UNREAD) {
      dateText = formatDate(new Date(book.id).toISOString().split('T')[0]) + ' 追加';
    } else if (currentStudyStatus === BOOK_STATUS.DROPPED && book.startedAt) {
      dateText = formatDate(book.startedAt) + ' 開始';
    }

    // ステータスに応じたアクションボタン
    let actionBtn = '';
    if (currentStudyStatus === BOOK_STATUS.UNREAD || currentStudyStatus === BOOK_STATUS.DROPPED) {
      actionBtn = `<button class="book-status-action start" data-start="${book.id}">読み始める！</button>`;
    }

    return `
      <div class="book-item">
        <div class="book-icon${book.coverUrl ? ' has-cover' : ''}" style="background-color: ${color}">${coverHtml}</div>
        <div class="book-info">
          <div class="book-name">${escapeHtml(book.title)}</div>
          <div class="book-date">${dateText}</div>
        </div>
        <div class="book-actions">
          ${actionBtn}
          ${linkBtn}
          <button data-edit="${book.id}">✏️</button>
          <button data-delete="${book.id}">×</button>
        </div>
      </div>
    `;
  }).join('');
}

// ========================================
// 本屋（ウィッシュリスト）のレンダリング
// ========================================
export function renderStoreBooks() {
  const books = getBooksByStatus(BOOK_STATUS.WISHLIST);
  const container = document.getElementById('storeBookList');
  const countEl = document.getElementById('wishlistCount');

  if (!container) return;

  if (countEl) {
    countEl.textContent = books.length;
  }

  if (books.length === 0) {
    container.innerHTML = `
      <div class="empty-store">
        <div class="empty-store-icon">💭</div>
        <div class="empty-store-text">気になる本はありません</div>
        <div class="empty-store-hint">読みたい本をメモしておきましょう</div>
      </div>`;
    return;
  }

  container.innerHTML = books.map((book, i) => {
    const link = isValidUrl(book.link) ? escapeAttr(book.link) : null;
    const linkBtn = link ? `<button data-link="${link}">↗</button>` : '';
    const color = BOOK_COLORS[i % BOOK_COLORS.length];

    const coverHtml = book.coverUrl
      ? `<img src="${escapeHtml(book.coverUrl)}" alt="" class="book-cover"><span class="book-icon-emoji">📕</span>`
      : '<span class="book-icon-emoji">📕</span>';

    return `
      <div class="book-item store-book-item">
        <div class="book-icon${book.coverUrl ? ' has-cover' : ''}" style="background-color: ${color}">${coverHtml}</div>
        <div class="book-info">
          <div class="book-name">${escapeHtml(book.title)}</div>
          <div class="book-date">${formatDate(new Date(book.id).toISOString().split('T')[0])} 追加</div>
        </div>
        <div class="book-actions">
          <button class="book-status-action acquire" data-acquire="${book.id}">手に入れた！</button>
          ${linkBtn}
          <button data-edit="${book.id}">✏️</button>
          <button data-delete="${book.id}">×</button>
        </div>
      </div>
    `;
  }).join('');
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
    note: null
  };

  stateManager.addBook(bookData);
  saveState();
  renderBooks();

  // フォームをクリア
  document.getElementById('bookInput').value = '';
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
  stateManager.updateBook(id, { status: BOOK_STATUS.UNREAD });
  saveState();
  renderBooks();
  showToast('書斎に追加しました！');
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
  document.getElementById('editBookStartedAt').value = book.startedAt || '';
  document.getElementById('editBookCompletedAt').value = book.completedAt || '';
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
      startedAt: document.getElementById('editBookStartedAt').value || null,
      completedAt: document.getElementById('editBookCompletedAt').value || null,
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
