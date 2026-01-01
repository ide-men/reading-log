// ========================================
// 本の管理・レンダリング
// ========================================
import { BOOK_COLORS } from './constants.js';
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

export function getEditingBookId() {
  return editingBookId;
}

export function getDeletingBookId() {
  return deletingBookId;
}

// ========================================
// 本棚レンダリング
// ========================================
export function renderBooks() {
  const state = stateManager.getState();
  const bookCount = state.books.length;
  document.getElementById('bookCount').textContent = bookCount;

  const shelf = document.getElementById('shelf');
  const bookList = document.getElementById('bookList');
  const booksListTitle = document.getElementById('booksListTitle');

  if (!bookCount) {
    shelf.innerHTML = `
      <div class="empty-shelf">
        <div class="empty-shelf-icon">📖</div>
        <div class="empty-shelf-text">まだ本がありません</div>
        <div class="empty-shelf-hint">読み終えた本を記録してみましょう</div>
      </div>`;
    bookList.innerHTML = '';
    booksListTitle.style.display = 'none';
    return;
  }

  booksListTitle.style.display = 'block';

  shelf.innerHTML = state.books.map((book, i) => {
    const color = BOOK_COLORS[i % BOOK_COLORS.length];
    const height = 50 + ((i * 17) % 25);
    const width = book.coverUrl ? 18 + ((i * 2) % 6) : 14 + ((i * 3) % 8);
    const tilt = ((i * 7) % 5) - 2;
    const hasLink = isValidUrl(book.link);
    const linkBtn = hasLink
      ? `<button class="tooltip-btn" data-link="${escapeAttr(book.link)}">リンクを開く</button>`
      : '';
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
      "${book.coverUrl ? ` data-cover-url="${escapeAttr(book.coverUrl)}" data-color="${color}"` : ''}>
        <div class="book-tooltip">
          <div class="tooltip-title">${escapeHtml(book.title)}</div>
          ${linkBtn}
        </div>
      </div>`;
  }).join('');

  bookList.innerHTML = [...state.books].reverse().map((book, i) => {
    const link = isValidUrl(book.link) ? escapeAttr(book.link) : null;
    const linkBtn = link ? `<button data-link="${link}">↗</button>` : '';

    const colorIndex = state.books.length - 1 - i;
    const color = BOOK_COLORS[colorIndex % BOOK_COLORS.length];

    const coverHtml = book.coverUrl
      ? `<img src="${escapeHtml(book.coverUrl)}" alt="" class="book-cover"><span class="book-icon-emoji">📕</span>`
      : '<span class="book-icon-emoji">📕</span>';

    return `
      <div class="book-item">
        <div class="book-icon${book.coverUrl ? ' has-cover' : ''}" style="background-color: ${color}"${book.coverUrl ? ` data-cover-url="${escapeAttr(book.coverUrl)}" data-color="${color}"` : ''}>${coverHtml}</div>
        <div class="book-info">
          <div class="book-name">${escapeHtml(book.title)}</div>
          <div class="book-date">${new Date(book.id).toLocaleDateString('ja-JP')}</div>
        </div>
        <div class="book-actions">
          ${linkBtn}
          <button data-edit="${book.id}">✏️</button>
          <button data-delete="${book.id}">×</button>
        </div>
      </div>
    `;
  }).join('');
}

// ========================================
// 本の追加
// ========================================
export function addBook(isPastBook = false) {
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
    showToast('短縮URL(amzn.asia等)では表紙画像を取得できません。amazon.co.jpのフルURLをお使いください', 4000);
  }

  const bookData = {
    id: Date.now(),
    title,
    link: link || null,
    coverUrl
  };

  if (isPastBook) {
    bookData.isPastBook = true;
  }

  stateManager.addBook(bookData);

  showToast(isPastBook ? '過去の本を登録しました' : '本を登録しました');

  saveState();
  renderBooks();

  // フォームをクリア（モーダルは閉じない）
  document.getElementById('bookInput').value = '';
  document.getElementById('linkInput').value = '';
  document.getElementById('linkFields').classList.remove('show');
  document.getElementById('linkIcon').textContent = '+';
  document.getElementById('bookInput').focus();
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
    const updates = { title };

    if (newLink !== book.link) {
      updates.link = newLink;
      const asin = extractAsinFromUrl(newLink);
      updates.coverUrl = asin ? getAmazonImageUrl(asin) : null;

      if (!asin && isAmazonShortUrl(newLink)) {
        showToast('短縮URL(amzn.asia等)では表紙画像を取得できません。amazon.co.jpのフルURLをお使いください', 4000);
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
